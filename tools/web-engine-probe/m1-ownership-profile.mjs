// Isolated post-reset ownership ablations. Deltas are reachability attribution, not allocator-exact retained sizes.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gameFiles, inventory } from './inventory.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';
import { censusObjectGraph, summarizeVmStorage } from './vm-structure.mjs';

const modeArg = process.argv.find(argument => argument.startsWith('--mode='));
const mode = modeArg?.slice('--mode='.length);
const modes = ['baseline', 'functions', 'static', 'runtime', 'csv', 'header', 'all'];

function release(vm, target) {
  if (target === 'functions' || target === 'all') {
    vm.fnMap.clear(); vm.eventMap.clear(); vm.code.fnList.length = 0; vm.contextStack.length = 0;
  }
  if (target === 'static' || target === 'runtime' || target === 'all') vm.staticMap.clear();
  if (target === 'runtime' || target === 'all') {
    vm.globalMap.clear(); vm.characterList.length = 0; vm.printer = null;
  }
  if (target === 'csv' || target === 'all') {
    vm.templateMap.clear(); vm.code.csv = null;
  }
  if (target === 'header' || target === 'all') {
    vm.macroMap.clear(); vm.code.header.length = 0;
  }
}

if (mode) {
  assert.ok(modes.includes(mode), `unknown ownership mode: ${mode}`);
  assert.ok(global.gc, 'ownership profile child requires --expose-gc');
  const original = await inventory();
  let source = await gameFiles(original.records);
  const { compile } = await import('./dist/engine.mjs');
  let vm = compile(source.files);
  source = null;
  const compiled = sampleLifecycle('compiled-source-released');
  await vm.reset();
  const postReset = sampleLifecycle('post-reset');
  let structure, storage;
  if (mode === 'baseline') {
    structure = censusObjectGraph(vm);
    storage = summarizeVmStorage(vm);
  }
  release(vm, mode);
  const afterRelease = sampleLifecycle(`after-release-${mode}`);
  const digestAfter = (await inventory()).originalDigest;
  assert.equal(digestAfter, original.originalDigest);
  console.log(JSON.stringify({ mode, originalDigest: original.originalDigest, compiled, postReset, afterRelease, structure, storage }));
  vm = null;
} else {
  const script = fileURLToPath(import.meta.url);
  const runs = {};
  for (const target of modes) {
    const output = execFileSync(process.execPath, ['--expose-gc', script, `--mode=${target}`], {
      encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 300000, windowsHide: true
    });
    runs[target] = JSON.parse(output);
  }
  const baseline = runs.baseline.afterRelease.forcedGc.bytes.heapUsed;
  const attribution = Object.fromEntries(modes.slice(1).map(target => {
    const bytes = baseline - runs[target].afterRelease.forcedGc.bytes.heapUsed;
    return [target, { bytes, mib: Math.round(bytes / 2 ** 20 * 1000) / 1000 }];
  }));
  const report = {
    passed: true,
    generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    method: 'Each target is released from an independently compiled and reset VM; forced-GC heap delta against the baseline process is reachability attribution, not exact allocator accounting.',
    caveats: [
      'A target delta can overlap another target when objects are cross-referenced; individual deltas must not be summed.',
      'V8 heapUsed is process-level and includes engine/module/tool overhead.',
      'The structural census counts references and logical Array slots, not shallow or retained bytes.',
      'This is Node evidence, not browser or iPhone memory telemetry.'
    ],
    originalUnchanged: new Set(Object.values(runs).map(run => run.originalDigest)).size === 1,
    attribution,
    runs
  };
  assert.ok(report.originalUnchanged);
  assert.ok(attribution.all.bytes > 0);
  await writeFile(new URL('./results/m1-ownership-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, postResetHeapMiB: runs.baseline.postReset.forcedGc.mib.heapUsed,
    attributionMiB: Object.fromEntries(Object.entries(attribution).map(([key, value]) => [key, value.mib])),
    structure: runs.baseline.structure, storage: runs.baseline.storage,
    result: fileURLToPath(new URL('./results/m1-ownership-profile.json', import.meta.url)) }, null, 2));
}
