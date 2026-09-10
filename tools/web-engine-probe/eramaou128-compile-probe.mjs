// Compile/load probe for the SEPARATE game '에라마왕 개조판 1.28'.
// Read-only: never writes savedata, never mutates the game folder.
// Loads ERB/CSV straight from the 1.28 folder (the root inventory intentionally excludes it),
// runs compile(), then drives vm.start() to the first input to see how far the title/new-game path gets.
// Reports parse success/first error, file counts, encodings, compile time, and heap deltas.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from './inventory.mjs';
import { compile } from './dist/engine.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));

function errorInfo(error) {
  return { name: error?.name, message: error?.message, file: error?.line?.file ?? null,
    line: error?.line?.line == null ? null : error.line.line + 1, trace: (error?.trace ?? []).slice(0, 12) };
}

// Walk CSV/ and ERB/ under the 1.28 folder. Keys mirror gameFiles(): CSV by basename upper, ERB by 'ERB/...'.
async function loadGame() {
  const files = new Map();
  const counts = {};
  const encodings = [];
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
      encodings.push({ path: name, encoding: result.encoding, candidates: result.candidates });
      if (result.text == null) throw new Error('encoding-unresolved: ' + name + ' candidates=' + JSON.stringify(result.candidates));
      counts[ext] = (counts[ext] ?? 0) + 1;
      const key = ext === '.CSV' ? path.basename(name).toUpperCase() : name;
      if (files.has(key)) throw new Error('file key collision: ' + key);
      // DISCOVERY-ONLY in-memory shims (disk untouched). Mirror emuera-permissive semantics so
      // compile() gets past known-blocking-but-valid inputs and surfaces further issues in one pass.
      // Each shim here is a candidate for a real fingerprint overlay fix later.
      let text = result.text;
      if (process.env.PROBE_SHIM === '1') {
        if (key === 'GAMEBASE.CSV') {
          // emuera allows empty コード/バージョン; eraJS parseInt('')->NaN throws. Default to 0.
          text = text.replace(/^コード,\s*$/m, 'コード,0')
                     .replace(/^バージョン,\s*$/m, 'バージョン,0');
        }
      }
      files.set(key, text);
    }
  }
  for (const top of ['CSV', 'ERB']) await walk(top);

  if (process.env.PROBE_SHIM === '1') {
    // emuera allows file-scope #DIM (before the first @function) as global user variables;
    // eraJS registers globals only from .ERH (header). Relocate leading '#' property lines from
    // ERBs into a synthetic .ERH so compile() sees them as globals. Discovery-only (disk untouched).
    const globalLines = [];
    for (const key of [...files.keys()]) {
      if (key.endsWith('.CSV') || key.endsWith('.ERH')) continue;
      const raw = files.get(key);
      const srcLines = raw.split(/\r?\n/);
      let firstAt = srcLines.findIndex(l => /^\s*@/.test(l));
      if (firstAt === -1) firstAt = srcLines.length;
      const head = srcLines.slice(0, firstAt);
      const moved = head.filter(l => /^\s*#/.test(l));
      if (moved.length === 0) continue;
      globalLines.push(...moved.map(l => l.replace(/^\s*/, '')));
      const kept = [...head.filter(l => !/^\s*#/.test(l)), ...srcLines.slice(firstAt)];
      files.set(key, kept.join('\n'));
    }
    if (globalLines.length) files.set('__ERB_GLOBALS__.ERH', globalLines.join('\n') + '\n');
  }

  return { files, counts, encodings, totalBytes };
}

// BISECT: parse each ERB/ERH file on its own (with all CSVs) to attribute a parser error to a file.
if (process.argv.includes('--bisect')) {
  const { files } = await loadGame();
  const csvOnly = new Map([...files].filter(([k]) => k.endsWith('.CSV')));
  const erbKeys = [...files.keys()].filter(k => !k.endsWith('.CSV'));
  const offenders = [];
  for (const key of erbKeys) {
    const subset = new Map(csvOnly);
    subset.set(key, files.get(key));
    try { compile(subset); }
    catch (error) {
      const msg = error?.message ?? String(error);
      if (/Parser error|Expected one of/.test(msg)) offenders.push({ file: key, message: msg });
    }
  }
  const out = new URL('./results/', import.meta.url);
  await mkdir(out, { recursive: true });
  const rep = { bisect: true, erbCount: erbKeys.length, offenderCount: offenders.length, offenders: offenders.slice(0, 60) };
  await writeFile(new URL('eramaou128-bisect.json', out), JSON.stringify(rep, null, 2) + '\n');
  console.log(JSON.stringify(rep, null, 2));
  process.exit(0);
}

const started = performance.now();
const baseHeap = process.memoryUsage();
let liveObs = null;
const report = { game: '에라마왕 개조판 1.28', node: process.version, phase: 'load' };
try {
  const { files, counts, encodings, totalBytes } = await loadGame();
  report.counts = counts;
  report.totalSourceBytes = totalBytes;
  report.encodingsSummary = encodings.reduce((m, e) => (m[e.encoding] = (m[e.encoding] ?? 0) + 1, m), {});
  report.unresolvedEncodings = encodings.filter(e => e.encoding === 'unresolved').map(e => ({ path: e.path, candidates: e.candidates }));
  report.loadedMs = +(performance.now() - started).toFixed(1);

  report.phase = 'compile';
  const compileStart = performance.now();
  const beforeCompile = process.memoryUsage().heapUsed;
  const vm = compile(files);
  const afterCompile = process.memoryUsage();
  report.compileMs = +(performance.now() - compileStart).toFixed(1);
  report.compileHeapDeltaMiB = +((afterCompile.heapUsed - beforeCompile) / 1048576).toFixed(2);
  report.rssAfterCompileMiB = +(afterCompile.rss / 1048576).toFixed(2);
  report.fnCount = vm.fnMap?.size ?? null;
  report.customTitleRegistered = vm.fnMap?.has('SYSTEM_TITLE') ?? false;

  report.phase = 'start';
  // Scripted inputs to walk past the title (e.g. '1'=NEW GAME) and surface deeper compat issues.
  const choices = (process.env.PROBE_CHOICES ?? '').split(',').map(s => s.trim()).filter(Boolean);
  // Auto-drive: after explicit choices, keep feeding a benign input to walk into the
  // main game loop and surface unimplemented commands/methods deeper in play.
  const autoMax = parseInt(process.env.PROBE_AUTO ?? '0', 10) || 0;
  const autoInput = process.env.PROBE_AUTO_INPUT ?? '0';
  const store = new Map(); // in-memory savedata sink; disk untouched.
  const obs = { events: 0, inputs: 0, inputsConsumed: 0, autoFed: 0, titleTextSeen: false, inputStacks: [], sampleText: [], lateText: [], lastText: [] };
  liveObs = obs;
  const startRun = performance.now();
  const generator = vm.start({ getSavedata: (k) => store.get(k),
    setSavedata: (k, v) => { store.set(k, v); },
    getTime: () => 1700000000000, getFont: () => false });
  let input = null;
  for (let n = 0; n < 200000; n++) {
    const next = await generator.next(input);
    input = null;
    if (next.done) { report.startStatus = 'ended'; break; }
    obs.events++;
    if (next.value.type === 'content') {
      const text = next.value.children.map(c => c.text).join('');
      if (text.trim() && obs.sampleText.length < 40) obs.sampleText.push(text);
      if (text.trim() && obs.inputsConsumed >= 1 && obs.lateText.length < 60) obs.lateText.push(text);
      if (text.length) obs.titleTextSeen = true;
    }
    if (next.value.type === 'content') {
      const text = next.value.children.map(c => c.text).join('');
      if (text.trim()) { obs.lastText.push(text); if (obs.lastText.length > 12) obs.lastText.shift(); }
    }
    if (['input', 'wait', 'tinput'].includes(next.value.type)) {
      obs.inputs++;
      if (obs.inputStacks.length < 80) obs.inputStacks.push(vm.contextStack?.map(c => c.fn?.name).slice(-3) ?? null);
      if (obs.inputsConsumed < choices.length) {
        input = choices[obs.inputsConsumed++];
        continue;
      }
      if (obs.autoFed < autoMax) {
        obs.autoFed++;
        input = next.value.type === 'wait' ? '' : autoInput;
        continue;
      }
      await generator.return();
      report.startStatus = (choices.length || autoMax) ? 'input-after-choices' : 'first-input-reached';
      break;
    }
    if (n === 199999) { await generator.return(); report.startStatus = 'event-limit'; }
  }
  report.startMs = +(performance.now() - startRun).toFixed(1);
  report.choicesFed = choices;
  report.observations = obs;
  report.peakRssMiB = +(process.memoryUsage().rss / 1048576).toFixed(2);
  report.savedataKeys = [...store.keys()];
  report.ok = true;
} catch (error) {
  report.ok = false;
  report.error = errorInfo(error);
  report.failedPhase = report.phase;
  if (liveObs) report.observations = liveObs;
}
report.elapsedMs = +(performance.now() - started).toFixed(1);
report.baseRssMiB = +(baseHeap.rss / 1048576).toFixed(2);

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('eramaou128-compile.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
