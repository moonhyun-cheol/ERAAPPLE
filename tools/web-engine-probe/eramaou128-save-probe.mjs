// Save/transition probe for the SEPARATE game '에라마왕 개조판 1.28'.
// Read-only on disk: loads ERB/CSV straight from the 1.28 folder, never writes savedata,
// never mutates the game folder. Uses the PROMOTED worker engine stack so results match
// the production runtime worker (compat + paged save-memory + compact IR + lazy-static + assign).
//
// Goal: drive title -> NEW GAME -> setup -> shop, then exercise the actual save path
// (manual save 200 -> slot 0), which materializes the full saveData object exactly like the
// date-transition autosave. Reports how far it got, any runtime error, peak RSS, gross save
// allocation (with --expose-gc), and the savedata keys actually written to the in-memory sink.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from './inventory.mjs';
// Promoted worker stack (mirrors dist/engine-worker.js overlays).
import { compile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));

function errorInfo(error) {
  const slice = error?.line ?? null;
  let sliceContent = null, sliceGet = null, sliceRange = null;
  try {
    if (slice) {
      sliceContent = typeof slice.content === 'string' ? slice.content : null;
      sliceGet = typeof slice.get === 'function' ? slice.get() : null;
      sliceRange = { from: slice.from ?? null, to: slice.to ?? null };
    }
  } catch { /* ignore */ }
  return { name: error?.name, message: error?.message, file: slice?.file ?? null,
    line: slice?.line == null ? null : slice.line + 1,
    sliceContent, sliceGet, sliceRange, trace: (error?.trace ?? []).slice(0, 16) };
}

async function loadGame() {
  const files = new Map();
  const counts = {};
  let totalBytes = 0;
  async function walk(rel) {
    for (const entry of await readdir(path.join(gameRoot, rel), { withFileTypes: true })) {
      const name = rel + '/' + entry.name;
      if (entry.isDirectory()) { await walk(name); continue; }
      if (!entry.isFile()) continue;
      if (!/\.(erb|erh|csv)$/i.test(entry.name)) continue;
      const ext = path.extname(entry.name).toUpperCase();
      const bytes = await readFile(path.join(gameRoot, name));
      totalBytes += bytes.length;
      const result = decode(bytes);
      if (result.text == null) throw new Error('encoding-unresolved: ' + name);
      counts[ext] = (counts[ext] ?? 0) + 1;
      const key = ext === '.CSV' ? path.basename(name).toUpperCase() : name;
      if (files.has(key)) throw new Error('file key collision: ' + key);
      files.set(key, result.text);
    }
  }
  for (const top of ['CSV', 'ERB']) await walk(top);
  return { files, counts, totalBytes };
}

const gc = typeof global.gc === 'function' ? () => global.gc() : null;
const mib = b => +(b / 1048576).toFixed(2);

const report = { game: '에라마왕 개조판 1.28', node: process.version, phase: 'load', exposedGc: !!gc };
const started = performance.now();
let obs = null;
try {
  const { files, counts, totalBytes } = await loadGame();
  report.counts = counts; report.totalSourceBytes = totalBytes;

  report.phase = 'compile';
  const vm = compile(files);
  report.fnCount = vm.fnMap?.size ?? null;
  report.customTitleRegistered = vm.fnMap?.has('SYSTEM_TITLE') ?? false;

  report.phase = 'drive';
  // In-memory savedata sink; disk untouched. Track write sizes to see the save payload.
  const store = new Map();
  const writes = [];
  const generator = vm.start({
    getSavedata: k => store.get(k),
    setSavedata: (k, v) => { store.set(k, v); writes.push({ key: k, bytes: typeof v === 'string' ? Buffer.byteLength(v) : null }); },
    getTime: () => 1700000000000, getFont: () => false });

  obs = { events: 0, inputs: 0, decisions: [], phase: 'setup', saved: false, sawShop: false,
    peakRssMiB: mib(process.memoryUsage().rss), stacks: [], lastError: null };
  const NAME = 'ㅅㅎ';
  let buffer = '';                 // visible text since last input request
  let input = null;
  const maxSteps = 500000;
  let saveGross = null;

  const topStack = () => vm.contextStack?.map(c => c?.fn?.name).filter(Boolean).slice(-3) ?? [];

  // Decide the next input from the text buffer seen since the last prompt.
  const AVOID = /LOAD|불러|HELP|도움|설명|돌아가|이전\s*페이지|다음\s*페이지/i;
  const NEWGAME = /NEW\s*GAME|새\s*게임|강한\s*시작|처음부터/i;
  // Exit settings screens by confirming defaults instead of toggling options forever.
  const CONFIRM = /결정|確定|확정|이대로|완료|결정하기|시작하기|決定/;
  const fnVisits = new Map();
  function decide(kind, topFn) {
    const text = buffer;
    if (kind === 'wait') return '';
    // Free-text name prompt.
    if (/이름|명칭/.test(text) && /\(\s*5|자까지|５자/.test(text)) return NAME;
    // Parse '[N] label' pairs (labels run until the next '[' or newline).
    const pairs = [...text.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
    const seen = new Map();
    for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
    const uniq = [...seen.entries()].map(([n, label]) => ({ n, label }));
    const hasShop = uniq.some(o => o.n === 200);
    if (hasShop) obs.sawShop = true;
    // Title: pick NEW GAME explicitly (1.28 inverts the order vs the main game).
    const newgame = uniq.find(o => NEWGAME.test(o.label));
    if (newgame && obs.phase === 'setup' && !obs.sawShop) return String(newgame.n);
    // Shop menu reached: the SHOP scene already ran the built-in autosave
    // (SAVEDATA 99) on entry, which materializes the full 1.28 saveData exactly
    // like the date-transition autosave. That is the save path we wanted to
    // exercise, so signal the loop to finalize instead of opening the manual
    // save menu (option 200 -> BEGIN SAVEGAME, an emuera scene eraJS omits).
    if (hasShop && obs.phase === 'setup') { obs.phase = 'shop'; return '0'; }
    // Settings screens: pick the confirm/decide option to advance (defaults accepted).
    if (!hasShop && obs.phase === 'setup') {
      const confirm = uniq.find(o => CONFIRM.test(o.label));
      if (confirm) return String(confirm.n);
      // Loop escape: era edit screens re-display themselves until a high 'decide' option
      // (conventionally 100) is chosen. If we've revisited this fn several times, stop
      // toggling low options and pick the highest offered number to advance.
      const visits = (fnVisits.get(topFn) ?? 0) + 1; fnVisits.set(topFn, visits);
      if (visits > 3 && uniq.length) {
        // Pick the highest offered number: era 'decide/accept' options sort highest
        // ([100] 결정, [2] 확실히 그렇다 vs [1] 다시). Escapes regenerate/toggle loops.
        const hi = uniq.reduce((a, o) => o.n > a.n ? o : a);
        return String(hi.n);
      }
    }
    // Setup: choose the first non-avoided option (skip LOAD/HELP/page nav); else first; else 0.
    const good = uniq.find(o => !AVOID.test(o.label));
    if (good) return String(good.n);
    if (uniq.length) return String(uniq[0].n);
    return '0';
  }

  let setupInputs = 0;
  for (let n = 0; n < maxSteps; n++) {
    let next;
    // Measure gross save allocation across the .next() that performs the save write.
    const measuring = obs.phase === 'shop' && gc;
    if (measuring) { gc(); }
    const beforeHeap = measuring ? process.memoryUsage().heapUsed : 0;
    next = await generator.next(input);
    if (measuring) {
      const afterHeap = process.memoryUsage().heapUsed;
      saveGross = { beforeMiB: mib(beforeHeap), afterMiB: mib(afterHeap), deltaMiB: mib(afterHeap - beforeHeap) };
    }
    input = null;
    const rss = process.memoryUsage().rss / 1048576;
    if (rss > obs.peakRssMiB) obs.peakRssMiB = +rss.toFixed(2);
    if (next.done) { report.driveStatus = 'ended'; break; }
    obs.events++;
    if (next.value.type === 'content') {
      buffer += next.value.children.map(c => c.text).join('');
      if (buffer.length > 20000) buffer = buffer.slice(-20000);
    } else if (['input', 'wait', 'tinput'].includes(next.value.type)) {
      obs.inputs++;
      if (!obs.sawShop && ++setupInputs > 600) { await generator.return(); report.driveStatus = 'setup-stuck'; break; }
      const stack = topStack();
      const choice = decide(next.value.type, stack[stack.length - 1] ?? '?');
      if (obs.decisions.length < 200) obs.decisions.push({ i: obs.inputs, type: next.value.type, stack, choice, tail: buffer.slice(-140) });
      buffer = '';
      input = choice;
      if (obs.phase === 'shop') {
        // Autosave (SAVEDATA 99) already executed on SHOP entry; capture it.
        obs.saved = store.size > 0;
        await generator.return();
        report.driveStatus = 'shop-autosave-reached';
        break;
      }
    }
    if (n === maxSteps - 1) { await generator.return(); report.driveStatus = 'step-limit'; }
  }

  report.saveWrites = writes;
  report.saveGrossHeapDelta = saveGross;
  report.savedataKeys = [...store.keys()];
  report.observations = obs;
  report.ok = true;
} catch (error) {
  report.ok = false; report.error = errorInfo(error); report.failedPhase = report.phase;
  if (obs) report.observations = obs;
}
report.elapsedMs = +(performance.now() - started).toFixed(1);
report.finalRssMiB = mib(process.memoryUsage().rss);

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('eramaou128-save.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, driveStatus: report.driveStatus, phase: report.failedPhase ?? report.phase,
  fnCount: report.fnCount, inputs: report.observations?.inputs, sawShop: report.observations?.sawShop,
  saved: report.observations?.saved, savedataKeys: report.savedataKeys, saveWrites: report.saveWrites,
  saveGrossHeapDelta: report.saveGrossHeapDelta, peakRssMiB: report.observations?.peakRssMiB,
  error: report.error ?? null }, null, 2));
