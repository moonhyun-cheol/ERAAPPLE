import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baselineUrl = new URL('./results/compact-assign-payload-baseline-run.json', import.meta.url);
const compactUrl = new URL('./results/compact-assign-payload-m1-run.json', import.meta.url);
if (process.argv.includes('--run')) {
  const script = fileURLToPath(new URL('./m1-baseline.mjs', import.meta.url));
  const run = engine => execFileSync(process.execPath,
    ['--expose-gc', script, '--child', '--semantic-state-only', `--engine=${engine}`], {
      encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 300000, windowsHide: true
    });
  await writeFile(baselineUrl, run('engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs'));
  await writeFile(compactUrl, run('engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs'));
}
const parseRun = text => JSON.parse(text.replace(/^\uFEFF/, ''));
const baseline = parseRun(await readFile(baselineUrl, 'utf8'));
const compact = parseRun(await readFile(compactUrl, 'utf8'));
assert.deepEqual(compact.deterministic, baseline.deterministic,
  'compact Assign payloads must preserve replay, selected state, and complete save hashes');
assert.equal(compact.corpus.originalDigest, baseline.corpus.originalDigest);
const point = (run, label) => run.lifecycle.find(sample => sample.label === label)?.forcedGc.bytes.heapUsed
  ?? run.checkpoints.find(sample => `day-${sample.day}` === label)?.memory.forcedGc.bytes.heapUsed;
const labels = ['compiled', 'vm-started', 'day-1', 'day-4', 'day-16'];
const memory = Object.fromEntries(labels.map(label => {
  const baselineBytes = point(baseline, label), compactBytes = point(compact, label);
  return [label, { baselineBytes, compactBytes, savedBytes: baselineBytes - compactBytes,
    savedMiB: Math.round((baselineBytes - compactBytes) / 2 ** 20 * 1000) / 1000 }];
}));
const report = {
  passed: true, generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  semanticEvidence: { replayStateAndSaveHashesEqual: true, deterministic: baseline.deterministic },
  memory, originalUnchanged: true, baseline, compact,
  limitations: ['Current-game fixed path only; alternate ERA corpora remain untested.',
    'Node forced-GC lifecycle samples are not browser/iPhone peaks.',
    'Only the pre-execution undefined Assign.inner slot is omitted; typed inner statements are unchanged.']
};
const resultUrl = new URL('./results/compact-assign-payload-acceptance.json', import.meta.url);
await writeFile(resultUrl, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, replayStateAndSaveHashesEqual: true,
  replayHash: baseline.deterministic.replay.sha256,
  savedMiB: Object.fromEntries(Object.entries(memory).map(([label, value]) => [label, value.savedMiB])),
  result: fileURLToPath(resultUrl) }, null, 2));