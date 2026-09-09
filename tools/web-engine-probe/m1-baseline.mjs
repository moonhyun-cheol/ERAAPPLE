// Fixed-seed current-game baseline for M1. Node memory samples are not browser/iPhone telemetry or true peaks.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { inventory, gameFiles, sha } from './inventory.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';
import { createReplayRecorder, hashValue, runReplay } from './replay-harness.mjs';

const child = process.argv.includes('--child');
const semanticStateOnly = process.argv.includes('--semantic-state-only');
const engineArg = process.argv.find(argument => argument.startsWith('--engine='))?.slice('--engine='.length) ?? 'engine.mjs';
assert.match(engineArg, /^engine(?:-compact-ir(?:-labels(?:-lazy(?:-slice(?:-paged(?:-statements(?:-printform(?:-static(?:-assign)?)?)?)?)?)?)?)?)?\.mjs$/, 'unsupported M1 engine bundle');
const saveManifest = store => Object.fromEntries([...store].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
  .map(([key, value]) => [key, { bytes: Buffer.byteLength(value), sha256: sha(value) }]));
const selectedState = vm => ({
  day: vm.getValue('DAY').get(vm, []).toString(),
  time: vm.getValue('TIME').get(vm, []).toString(),
  money: vm.getValue('MONEY').get(vm, []).toString(),
  master: vm.getValue('MASTER').get(vm, []).toString(),
  target: vm.getValue('TARGET').get(vm, []).toString(),
  characters: vm.characterList.length,
  randomState: String(vm.random.state),
  stack: vm.contextStack.map(context => context.fn.name)
});
function localAllocation(vm) {
  let cells = 0, allocatedCells = 0, allocatedElements = 0;
  for (const scope of vm.staticMap.values()) for (const name of ['LOCAL', 'LOCALS']) {
    const cell = scope.get(name); if (!cell) continue;
    cells++;
    const descriptor = Object.getOwnPropertyDescriptor(cell, 'value');
    if (descriptor && 'value' in descriptor) { allocatedCells++; allocatedElements += descriptor.value.length; }
  }
  return { cells, allocatedCells, allocatedElements };
}

if (child) {
  assert.ok(global.gc, 'm1 baseline child requires --expose-gc');
  const lifecycle = [sampleLifecycle('process-start')];
  const original = await inventory();
  let source = await gameFiles(original.records);
  const corpus = { files: source.files.size, decodedBytes: [...source.files.values()].reduce((n, text) => n + Buffer.byteLength(text), 0),
    counts: source.counts, originalFiles: original.records.length, originalDigest: original.originalDigest };
  lifecycle.push(sampleLifecycle('source-loaded', { files: corpus.files, decodedBytes: corpus.decodedBytes }));
  const engineUrl = new URL(`./dist/${engineArg}`, import.meta.url);
  const { compile } = await import(engineUrl);
  const engineBytes = await readFile(engineUrl);
  let vm = compile(source.files);
  lifecycle.push(sampleLifecycle('compiled', { functions: vm.fnMap.size, staticScopes: vm.staticMap.size }));
  source = null;
  vm.random.state = 42;
  const store = new Map();
  const writes = [];
  const external = {
    getSavedata: async key => store.get(key),
    setSavedata: async (key, value) => {
      writes.push({ key, bytes: Buffer.byteLength(value), sha256: sha(value), memoryAtStorage: sampleLifecycle(`save-write-${writes.length + 1}`, { key }) });
      store.set(key, value);
    },
    getTime: () => 1700000000000,
    getFont: () => false
  };
  let generator = vm.start(external);
  lifecycle.push(sampleLifecycle('vm-started'));
  const recorder = createReplayRecorder();
  const checkpoints = [];
  const wantedDays = new Set([1, 4, 16]);
  const seenDays = new Set();
  try {
    const result = await runReplay({ generator, recorder, eventLimit: 50000, decide: ({ event, events }) => {
      const buttons = events.flatMap(item => item.children ?? []).filter(item => item.type === 'button');
      const stack = vm.contextStack.map(context => context.fn.name);
      const day = Number(vm.getValue('DAY').get(vm, []));
      const time = Number(vm.getValue('TIME').get(vm, []));
      let input;
      if (event.type === 'wait') input = '';
      else if (event.type === 'tinput') input = null;
      else if (stack.includes('START_CONFIGURATION')) input = buttons.some(button => button.value === '11') ? '11' : '1';
      else if (stack.includes('CHARA_BUY_MAIN') && buttons.some(button => button.value === '1000')) input = vm.characterList.length < 2 ? '104' : '1000';
      else if (buttons.some(button => button.value === '200')) {
        if (vm.characterList.length < 2) input = '111';
        else {
          if (wantedDays.has(day) && !seenDays.has(day)) {
            seenDays.add(day);
            const saves = saveManifest(store);
            const locals = localAllocation(vm);
            const state = semanticStateOnly ? { selected: selectedState(vm), saves } : { selected: selectedState(vm), saves, locals };
            const metadata = { day, time, characters: vm.characterList.length };
            const memory = sampleLifecycle(`day-${day}`, metadata);
            checkpoints.push({ ...metadata, stateSha256: hashValue(state), saves, locals, staticScopes: vm.staticMap.size, memory });
            if (day >= 16) return { stop: true, reason: 'day-16-checkpoint', checkpoints: [{ label: `day-${day}`, state, metadata }] };
            return { input: '102', context: { eventType: event.type, day, time, stack }, checkpoints: [{ label: `day-${day}`, state, metadata }] };
          }
          input = '102';
        }
      } else input = String(buttons[0]?.value ?? '0');
      return { input, context: { eventType: event.type, day, time, stack } };
    } });
    assert.equal(result.reason, 'day-16-checkpoint');
    assert.deepEqual([...seenDays], [1, 4, 16]);
    const finalSaves = saveManifest(store);
    const deterministic = { replay: result.replay, checkpoints: checkpoints.map(({ day, stateSha256, saves }) => ({ day, stateSha256, saves })), finalSaves };
    await generator.return(); generator = null;
    await vm.reset(); vm = null; store.clear();
    lifecycle.push(sampleLifecycle('after-teardown'));
    assert.equal((await inventory()).originalDigest, original.originalDigest);
    console.log(JSON.stringify({ engine: { id: engineArg === 'engine.mjs' ? 'eraJS' : 'eraJS-compact-function-ir-v1', file: engineArg, sha256: sha(engineBytes) }, corpus, lifecycle, writes, checkpoints,
      deterministic, originalUnchanged: true }));
  } finally { if (generator) await generator.return(); }
} else {
  const script = fileURLToPath(import.meta.url);
  const runs = [];
  for (let index = 0; index < 2; index++) {
    const output = execFileSync(process.execPath, ['--expose-gc', script, '--child'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
      timeout: 300000, windowsHide: true });
    runs.push(JSON.parse(output));
  }
  assert.equal(runs[0].corpus.originalDigest, runs[1].corpus.originalDigest);
  assert.equal(runs[0].engine.sha256, runs[1].engine.sha256);
  assert.deepEqual(runs[0].deterministic, runs[1].deterministic, 'two isolated fixed-seed runs must have identical replay/state/save hashes');
  const report = {
    passed: true,
    generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    actualBrowser: false,
    actualIPhone: false,
    truePeakMeasured: false,
    limitations: [
      'Node process.memoryUsage samples are lifecycle observations, not iPhone/WebKit limits or allocation peaks.',
      'The current-game path is fixed-seed new game, two characters and rest-only through day 16; it is not a user-save reproduction or full-game compatibility result.',
      'State equality combines selected live values with complete saved-entry hashes; full unsaved VM heap equivalence is not yet serialized.',
      'Medium/large real-game corpora, synthetic density fixtures, load/backup/100-cycle retention and alternate engines remain M1/M2 work.'
    ],
    deterministicReplayPassed: true,
    deterministic: runs[0].deterministic,
    runs
  };
  await writeFile(new URL('./results/scalable-runtime-baseline.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, deterministicReplayPassed: true, days: report.deterministic.checkpoints.map(item => item.day),
    forcedGcHeapMiB: runs.map(run => Object.fromEntries(run.checkpoints.map(item => [item.day, item.memory.forcedGc.mib.heapUsed]))),
    result: fileURLToPath(new URL('./results/scalable-runtime-baseline.json', import.meta.url)) }, null, 2));
}