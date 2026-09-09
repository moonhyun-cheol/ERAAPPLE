import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gameFiles, inventory } from './inventory.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';

const childEngine = process.argv.find(value => value.startsWith('--engine='))?.slice(9);
const engines = [
  'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs',
  'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs'
];

function assignPayloads(root) {
  const seen = new WeakSet(), stack = [root];
  const result = { count: 0, ownInner: 0, absentInner: 0, compiledInner: 0 };
  while (stack.length) {
    const value = stack.pop();
    if (value == null || (typeof value !== 'object' && typeof value !== 'function') || seen.has(value)) continue;
    seen.add(value);
    if (value.constructor?.name === 'Assign') {
      result.count++;
      const descriptor = Object.getOwnPropertyDescriptor(value, 'inner');
      if (descriptor) {
        result.ownInner++;
        if (descriptor.value != null) result.compiledInner++;
      } else result.absentInner++;
    }
    if (Array.isArray(value)) for (const item of value) stack.push(item);
    else if (value instanceof Map) for (const [key, item] of value) stack.push(key, item);
    else if (value instanceof Set) for (const item of value) stack.push(item);
    else for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor && 'value' in descriptor) stack.push(descriptor.value);
    }
  }
  return result;
}

if (childEngine) {
  assert.ok(engines.includes(childEngine));
  assert.ok(global.gc);
  const original = await inventory();
  let source = await gameFiles(original.records);
  const { compile } = await import(new URL(`./dist/${childEngine}`, import.meta.url));
  const before = sampleLifecycle('before-compile');
  const vm = compile(source.files);
  source = null;
  const compiled = sampleLifecycle('compiled-source-released');
  const payloads = assignPayloads(vm);
  assert.equal((await inventory()).originalDigest, original.originalDigest);
  console.log(JSON.stringify({ engine: childEngine, originalDigest: original.originalDigest, before, compiled, payloads }));
} else {
  const script = fileURLToPath(import.meta.url);
  const run = engine => JSON.parse(execFileSync(process.execPath, ['--expose-gc', script, `--engine=${engine}`], {
    encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 300000, windowsHide: true
  }));
  const baseline = run(engines[0]), compact = run(engines[1]);
  assert.equal(compact.originalDigest, baseline.originalDigest);
  assert.equal(compact.payloads.count, baseline.payloads.count);
  assert.equal(baseline.payloads.ownInner, baseline.payloads.count);
  assert.equal(compact.payloads.absentInner, compact.payloads.count);
  const baselineBytes = baseline.compiled.forcedGc.bytes.heapUsed;
  const compactBytes = compact.compiled.forcedGc.bytes.heapUsed;
  const report = {
    passed: true, generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    representation: 'Assign omits the eager undefined inner own-property; first execution creates the same typed inner statement as upstream.',
    memory: { baselineBytes, compactBytes, savedBytes: baselineBytes - compactBytes,
      savedMiB: Math.round((baselineBytes - compactBytes) / 2 ** 20 * 1000) / 1000 },
    payloadCounts: compact.payloads, baseline, compact,
    limitations: ['Compile-only forced-GC Node samples are not browser/iPhone memory peaks.',
      'Executed Assign objects transition to the original raw+inner shape; lifecycle impact is measured separately.',
      'Inner assignment statements and expression trees are unchanged.'],
    originalUnchanged: true
  };
  const resultUrl = new URL('./results/compact-assign-payload-profile.json', import.meta.url);
  await writeFile(resultUrl, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, memory: report.memory, payloadCounts: report.payloadCounts,
    result: fileURLToPath(resultUrl) }, null, 2));
}