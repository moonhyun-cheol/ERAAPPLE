import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gameFiles, inventory } from './inventory.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';
import { summarizeVmStorage } from './vm-structure.mjs';

const childEngine = process.argv.find(value => value.startsWith('--engine='))?.slice(9);
const engines = [
  'engine-compact-ir-labels-lazy-slice-paged-statements-printform.mjs',
  'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs'
];

if (childEngine) {
  assert.ok(engines.includes(childEngine));
  assert.ok(global.gc);
  const original = await inventory();
  let source = await gameFiles(original.records);
  const { compile } = await import(new URL(`./dist/${childEngine}`, import.meta.url));
  const vm = compile(source.files); source = null;
  const compiled = sampleLifecycle('compiled-source-released');
  await vm.reset();
  const reset = sampleLifecycle('reset');
  const scopes = { allocated: vm.staticMap.size, totalFunctions: vm.fnMap.size + [...vm.eventMap.values()].flat().length,
    explicitTargets: vm.explicitStaticScopes?.size ?? null, storage: summarizeVmStorage(vm).static };
  assert.equal((await inventory()).originalDigest, original.originalDigest);
  console.log(JSON.stringify({ engine: childEngine, originalDigest: original.originalDigest, compiled, reset, scopes }));
} else {
  const script = fileURLToPath(import.meta.url);
  const run = engine => JSON.parse(execFileSync(process.execPath, ['--expose-gc', script, `--engine=${engine}`], {
    encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 300000, windowsHide: true
  }));
  const baseline = run(engines[0]), compact = run(engines[1]);
  assert.equal(compact.originalDigest, baseline.originalDigest);
  assert.ok(compact.scopes.allocated < baseline.scopes.allocated * 0.1);
  const baselineBytes = baseline.reset.forcedGc.bytes.heapUsed, compactBytes = compact.reset.forcedGc.bytes.heapUsed;
  const report = { passed: true, generatedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch },
    representation: 'Function static maps, LOCAL/LOCALS cells and non-dynamic #DIM cells are created on first function entry; scopes targeted by explicit VAR@FUNCTION references are prepared during reset.',
    memory: { baselineBytes, compactBytes, savedBytes: baselineBytes - compactBytes,
      savedMiB: Math.round((baselineBytes - compactBytes) / 2 ** 20 * 1000) / 1000 },
    scopes: { baseline: baseline.scopes, compact: compact.scopes }, baseline, compact, originalUnchanged: true,
    limitations: ['Reset-only forced-GC Node samples are not browser/iPhone peaks.', 'Runtime scope growth and semantic equivalence are measured by the separate 1/4/16-day acceptance run.', 'Alternate ERA corpora remain untested.'] };
  const url = new URL('./results/lazy-static-scope-profile.json', import.meta.url);
  await writeFile(url, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, memory: report.memory, scopes: report.scopes, result: fileURLToPath(url) }, null, 2));
}
