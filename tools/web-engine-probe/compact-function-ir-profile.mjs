import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baselineScript = fileURLToPath(new URL('./m1-baseline.mjs', import.meta.url));
function run(engine) {
  const output = execFileSync(process.execPath, ['--expose-gc', baselineScript, '--child', `--engine=${engine}`], {
    encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 300000, windowsHide: true
  });
  return JSON.parse(output);
}
const baseline = run('engine.mjs');
const compact = run('engine-compact-ir.mjs');
const compactLabels = run('engine-compact-ir-labels.mjs');
const compactLazy = run('engine-compact-ir-labels-lazy.mjs');
const compactLazySlice = run('engine-compact-ir-labels-lazy-slice.mjs');
const compactPaged = run('engine-compact-ir-labels-lazy-slice-paged.mjs');
assert.deepEqual(compact.deterministic, baseline.deterministic,
  'compact function IR must preserve replay, selected state, and complete save hashes');
assert.deepEqual(compactLabels.deterministic, compact.deterministic,
  'compact label maps must preserve replay, selected state, and complete save hashes');
assert.deepEqual(compactLazy.deterministic, compactLabels.deterministic,
  'compact Lazy must preserve replay, selected state, and complete save hashes');
assert.deepEqual(compactLazySlice.deterministic, compactLazy.deterministic,
  'compact Slice must preserve replay, selected state, and complete save hashes');
assert.deepEqual(compactPaged.deterministic, compactLazySlice.deterministic,
  'paged default storage must preserve replay, selected state, and complete save hashes');
assert.equal(compact.corpus.originalDigest, baseline.corpus.originalDigest);
assert.equal(compactLabels.corpus.originalDigest, baseline.corpus.originalDigest);
assert.equal(compactLazy.corpus.originalDigest, baseline.corpus.originalDigest);
assert.equal(compactLazySlice.corpus.originalDigest, baseline.corpus.originalDigest);
assert.equal(compactPaged.corpus.originalDigest, baseline.corpus.originalDigest);
const point = (run, label) => run.lifecycle.find(sample => sample.label === label)?.forcedGc.bytes.heapUsed
  ?? run.checkpoints.find(sample => `day-${sample.day}` === label)?.memory.forcedGc.bytes.heapUsed;
const labels = ['compiled', 'vm-started', 'day-1', 'day-4', 'day-16'];
function compare(beforeRun, afterRun) {
  return Object.fromEntries(labels.map(label => {
    const before = point(beforeRun, label), after = point(afterRun, label), bytes = before - after;
    return [label, { baselineBytes: before, compactBytes: after, savedBytes: bytes,
      savedMiB: Math.round(bytes / 2 ** 20 * 1000) / 1000, savedPercent: Math.round(bytes / before * 10000) / 100 }];
  }));
}
const memory = compare(baseline, compact);
const labelMapIncrementalMemory = compare(compact, compactLabels);
const lazyIncrementalMemory = compare(compactLabels, compactLazy);
const sliceIncrementalMemory = compare(compactLazy, compactLazySlice);
const pagedIncrementalMemory = compare(compactLazySlice, compactPaged);
const cumulativeMemory = compare(baseline, compactPaged);
const report = {
  passed: true, generatedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch },
  representation: 'PRINT bitmasks, compact label maps, two-field Lazy, packed-range Slice, and paged default-value arrays in separate prototype bundles',
  semanticEvidence: { replayStateAndSaveHashesEqual: true, deterministic: baseline.deterministic },
  originalUnchanged: true, memory, labelMapIncrementalMemory, lazyIncrementalMemory, sliceIncrementalMemory,
  pagedIncrementalMemory, cumulativeMemory, baseline, compact, compactLabels, compactLazy, compactLazySlice, compactPaged,
  limitations: ['These are compact metadata slices, not a general statement bytecode VM.',
    'Measurements are isolated Node forced-GC lifecycle samples, not browser/iPhone peaks.',
    'Only the current fixed-input new-game path and neutral fixture are covered.',
    'Compact Slice packs ordinary non-negative ranges below 2^26 and falls back to a two-item array for unusual bounds.',
    'Paged storage uses Array-compatible Proxies and 256-slot pages; browser layout and dense-workload throughput remain unmeasured.']
};
await writeFile(new URL('./results/compact-function-ir-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, replayStateAndSaveHashesEqual: true,
  printSavedMiB: Object.fromEntries(Object.entries(memory).map(([label, value]) => [label, value.savedMiB])),
  labelMapIncrementalSavedMiB: Object.fromEntries(Object.entries(labelMapIncrementalMemory).map(([label, value]) => [label, value.savedMiB])),
  lazyIncrementalSavedMiB: Object.fromEntries(Object.entries(lazyIncrementalMemory).map(([label, value]) => [label, value.savedMiB])),
  sliceIncrementalSavedMiB: Object.fromEntries(Object.entries(sliceIncrementalMemory).map(([label, value]) => [label, value.savedMiB])),
  pagedIncrementalSavedMiB: Object.fromEntries(Object.entries(pagedIncrementalMemory).map(([label, value]) => [label, value.savedMiB])),
  cumulativeSavedMiB: Object.fromEntries(Object.entries(cumulativeMemory).map(([label, value]) => [label, value.savedMiB])),
  result: fileURLToPath(new URL('./results/compact-function-ir-profile.json', import.meta.url)) }, null, 2));