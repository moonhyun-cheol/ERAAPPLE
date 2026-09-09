import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baselineUrl = new URL('./results/lazy-static-scope-baseline-run.json', import.meta.url);
const compactUrl = new URL('./results/lazy-static-scope-m1-run.json', import.meta.url);
if (process.argv.some(value => ['--run', '--run-baseline', '--run-compact'].includes(value))) {
  const script = fileURLToPath(new URL('./m1-baseline.mjs', import.meta.url));
  const run = engine => execFileSync(process.execPath, ['--expose-gc', script, '--child', '--semantic-state-only', `--engine=${engine}`], {
    encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 300000, windowsHide: true
  });
  if (process.argv.includes('--run') || process.argv.includes('--run-baseline'))
    await writeFile(baselineUrl, run('engine-compact-ir-labels-lazy-slice-paged-statements-printform.mjs'));
  if (process.argv.includes('--run') || process.argv.includes('--run-compact'))
    await writeFile(compactUrl, run('engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs'));
}
const baseline = JSON.parse(await readFile(baselineUrl, 'utf8'));
const compact = JSON.parse(await readFile(compactUrl, 'utf8'));
assert.deepEqual(compact.deterministic, baseline.deterministic,
  'lazy static scopes must preserve replay, semantic state, and complete save hashes');
assert.equal(compact.corpus.originalDigest, baseline.corpus.originalDigest);
assert.ok(compact.checkpoints.every((point, index) => point.staticScopes < baseline.checkpoints[index].staticScopes));
const point = (run, label) => run.lifecycle.find(sample => sample.label === label)?.forcedGc.bytes.heapUsed
  ?? run.checkpoints.find(sample => `day-${sample.day}` === label)?.memory.forcedGc.bytes.heapUsed;
const labels = ['compiled', 'vm-started', 'day-1', 'day-4', 'day-16'];
const memory = Object.fromEntries(labels.map(label => {
  const baselineBytes = point(baseline, label), compactBytes = point(compact, label);
  return [label, { baselineBytes, compactBytes, savedBytes: baselineBytes - compactBytes,
    savedMiB: Math.round((baselineBytes - compactBytes) / 2 ** 20 * 1000) / 1000 }];
}));
const report = { passed: true, generatedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch },
  semanticEvidence: { replayStateAndSaveHashesEqual: true, deterministic: baseline.deterministic }, memory,
  scopeGrowth: { baseline: baseline.checkpoints.map(({ day, staticScopes }) => ({ day, staticScopes })),
    compact: compact.checkpoints.map(({ day, staticScopes }) => ({ day, staticScopes })) },
  originalUnchanged: true, baseline, compact,
  limitations: ['Current-game fixed path only; alternate ERA corpora remain untested.', 'Node forced-GC lifecycle samples are not browser/iPhone peaks.',
    'Explicit VAR@FUNCTION targets are eagerly prepared to preserve synchronous getValue semantics.'] };
const resultUrl = new URL('./results/lazy-static-scope-acceptance.json', import.meta.url);
await writeFile(resultUrl, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, replayStateAndSaveHashesEqual: true, replayHash: baseline.deterministic.replay.sha256,
  savedMiB: Object.fromEntries(Object.entries(memory).map(([label, value]) => [label, value.savedMiB])), scopeGrowth: report.scopeGrowth,
  result: fileURLToPath(resultUrl) }, null, 2));
