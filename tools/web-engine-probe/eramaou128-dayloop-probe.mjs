// Date-transition (day loop) stress probe for '에라마왕 개조판 1.28'.
// Read-only on disk (loads ERB/CSV from the 1.28 folder; never writes savedata or
// mutates the game folder). Uses the PROMOTED worker engine stack.
//
// Goal: this is the project's core question — can the web runtime survive many
// SHOP -> TURNEND day transitions on a LARGE era game without crashing or leaking?
// We reach the shop, then repeatedly pick shop option 199 (휴식 -> BEGIN TURNEND,
// which the game's EVENTTURNEND ends with BEGIN SHOP), advancing one in-game turn
// per cycle. We sample RSS/heap every turn and record any thrown runtime error.
// Run with --expose-gc for a stable post-GC heap series.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from './inventory.mjs';
import { compile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));
const TURNS = Number(process.env.PROBE_TURNS ?? 60);
const gc = typeof global.gc === 'function' ? () => global.gc() : null;
const mib = b => +(b / 1048576).toFixed(2);

function errorInfo(error) {
  return { name: error?.name, message: error?.message, file: error?.line?.file ?? null,
    line: error?.line?.line == null ? null : error.line.line + 1, trace: (error?.trace ?? []).slice(0, 16) };
}

async function loadGame() {
  const files = new Map();
  async function walk(rel) {
    for (const entry of await readdir(path.join(gameRoot, rel), { withFileTypes: true })) {
      const name = rel + '/' + entry.name;
      if (entry.isDirectory()) { await walk(name); continue; }
      if (!entry.isFile() || !/\.(erb|erh|csv)$/i.test(entry.name)) continue;
      const ext = path.extname(entry.name).toUpperCase();
      const result = decode(await readFile(path.join(gameRoot, name)));
      if (result.text == null) throw new Error('encoding-unresolved: ' + name);
      files.set(ext === '.CSV' ? path.basename(name).toUpperCase() : name, result.text);
    }
  }
  for (const top of ['CSV', 'ERB']) await walk(top);
  return files;
}

const NAME = 'ㅅㅎ';
const AVOID = /LOAD|불러|저장|HELP|도움|설명|돌아가|이전\s*페이지|다음\s*페이지|SAVE|CONFIG|설정/i;
const CONFIRM = /결정|確定|확정|이대로|완료|결정하기|시작하기|決定/;

const report = { game: '에라마왕 개조판 1.28', node: process.version, exposedGc: !!gc, requestedTurns: TURNS };
const startedAt = performance.now();
try {
  const files = await loadGame();
  const store = new Map();
  const vm = compile(files);
  report.fnCount = vm.fnMap?.size ?? null;

  const generator = vm.start({
    getSavedata: k => store.get(k),
    setSavedata: (k, v) => store.set(k, v),
    getTime: () => 1700000000000, getFont: () => false });

  let buffer = '';
  let input = null;
  let phase = 'setup';
  let turns = 0;
  let sawShop = false;
  const fnVisits = new Map();
  const samples = [];        // per-turn memory
  const turnMs = [];
  let lastTurnAt = performance.now();
  let baselineRssMiB = mib(process.memoryUsage().rss);
  let peakRssMiB = baselineRssMiB;
  let contentEvents = 0, totalInputs = 0;

  const decide = (kind, topFn, uniq, hasShop) => {
    if (kind === 'wait') return '';
    if (hasShop) {                                   // at the shop menu
      sawShop = true;
      if (phase === 'setup') phase = 'loop';
      return '199';                                   // 휴식 -> BEGIN TURNEND (advance a turn)
    }
    // Setup + EVENTTURNEND intermediate prompts: reuse the safe navigation heuristic.
    if (/이름|명칭/.test(buffer) && /\(\s*5|자까지|５자/.test(buffer)) return NAME;
    if (phase === 'setup') {
      const confirm = uniq.find(o => CONFIRM.test(o.label));
      if (confirm) return String(confirm.n);
      const newgame = uniq.find(o => /NEW\s*GAME|새\s*게임|강한\s*시작|처음부터/i.test(o.label));
      if (newgame && !sawShop) return String(newgame.n);
    }
    const visits = (fnVisits.get(topFn) ?? 0) + 1; fnVisits.set(topFn, visits);
    if (visits > 3 && uniq.length) return String(uniq.reduce((a, o) => o.n > a.n ? o : a).n);
    const good = uniq.find(o => !AVOID.test(o.label));
    if (good) return String(good.n);
    if (uniq.length) return String(uniq[0].n);
    return '0';
  };

  const maxSteps = 5000000;
  for (let n = 0; n < maxSteps; n++) {
    const next = await generator.next(input);
    input = null;
    if (next.done) { report.driveStatus = 'ended'; break; }
    const v = next.value;
    const rss = process.memoryUsage().rss / 1048576;
    if (rss > peakRssMiB) peakRssMiB = +rss.toFixed(2);
    if (v.type === 'content') {
      contentEvents++;
      buffer += v.children.map(c => c.text ?? '').join('') + '\n';
      if (buffer.length > 20000) buffer = buffer.slice(-20000);
    } else if (['input', 'wait', 'tinput'].includes(v.type)) {
      totalInputs++;
      const pairs = [...buffer.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
      const seen = new Map();
      for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
      const uniq = [...seen.entries()].map(([nn, label]) => ({ n: nn, label }));
      const hasShop = uniq.some(o => o.n === 199 || o.n === 200);
      const topFn = vm.contextStack?.map(c => c?.fn?.name).filter(Boolean).slice(-1)[0] ?? '?';

      if (hasShop && phase === 'loop') {
        // A full turn completed and we are back at the shop.
        turns++;
        const now = performance.now();
        turnMs.push(+(now - lastTurnAt).toFixed(1));
        lastTurnAt = now;
        if (gc) gc();
        const m = process.memoryUsage();
        samples.push({ turn: turns, rssMiB: mib(m.rss), heapUsedMiB: mib(m.heapUsed) });
        if (turns === 1) baselineRssMiB = mib(m.rss);
        if (turns >= TURNS) { await generator.return(); report.driveStatus = 'turns-complete'; break; }
      }
      buffer = '';
      input = decide(v.type, topFn, uniq, hasShop);
    }
    if (totalInputs > TURNS * 400 + 5000) { await generator.return(); report.driveStatus = 'input-limit'; break; }
  }

  const final = process.memoryUsage();
  const heapSeries = samples.map(s => s.heapUsedMiB);
  report.ok = sawShop && turns >= TURNS && report.driveStatus === 'turns-complete';
  report.sawShop = sawShop;
  report.turnsCompleted = turns;
  report.contentEvents = contentEvents;
  report.totalInputs = totalInputs;
  report.memory = {
    baselineRssMiB, peakRssMiB, finalRssMiB: mib(final.rss), finalHeapUsedMiB: mib(final.heapUsed),
    firstTurnHeapMiB: heapSeries[0] ?? null, lastTurnHeapMiB: heapSeries[heapSeries.length - 1] ?? null,
    heapGrowthMiB: heapSeries.length >= 2 ? +(heapSeries[heapSeries.length - 1] - heapSeries[0]).toFixed(2) : null,
    samplesEvery: 1,
  };
  report.timing = {
    totalMs: +(performance.now() - startedAt).toFixed(1),
    meanTurnMs: turnMs.length ? +(turnMs.reduce((a, b) => a + b, 0) / turnMs.length).toFixed(1) : null,
    maxTurnMs: turnMs.length ? Math.max(...turnMs) : null,
  };
  report.samples = samples;
} catch (error) {
  report.ok = false; report.error = errorInfo(error);
}

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('eramaou128-dayloop.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, driveStatus: report.driveStatus, turnsCompleted: report.turnsCompleted,
  contentEvents: report.contentEvents, memory: report.memory, timing: report.timing, error: report.error ?? null }, null, 2));
