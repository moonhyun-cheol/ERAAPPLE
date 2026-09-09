import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gameFiles, inventory } from './inventory.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';

const childEngine = process.argv.find(value => value.startsWith('--engine='))?.slice(9);
const engines = ['engine-compact-ir-labels-lazy-slice-paged.mjs', 'engine-compact-ir-labels-lazy-slice-paged-statements.mjs'];

function statementVectors(root) {
  const seen = new WeakSet(), stack = [root];
  const result = { thunks: 0, empty: 0, singleton: 0, multi: 0, arraySlots: 0 };
  while (stack.length) {
    const value = stack.pop();
    if (value == null || (typeof value !== 'object' && typeof value !== 'function') || seen.has(value)) continue;
    seen.add(value);
    if (value.constructor?.name === 'Thunk') {
      result.thunks++;
      const statements = Object.getOwnPropertyDescriptor(value, 'statement')?.value;
      if (statements == null) result.empty++;
      else if (Array.isArray(statements)) { result.multi++; result.arraySlots += statements.length; }
      else result.singleton++;
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
  const vectors = statementVectors(vm);
  assert.equal((await inventory()).originalDigest, original.originalDigest);
  console.log(JSON.stringify({ engine: childEngine, originalDigest: original.originalDigest, before, compiled, vectors }));
} else {
  const script = fileURLToPath(import.meta.url);
  const run = engine => JSON.parse(execFileSync(process.execPath, ['--expose-gc', script, `--engine=${engine}`], {
    encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 300000, windowsHide: true
  }));
  const baseline = run(engines[0]), compact = run(engines[1]);
  assert.equal(compact.originalDigest, baseline.originalDigest);
  assert.equal(compact.vectors.thunks, baseline.vectors.thunks);
  assert.equal(compact.vectors.empty + compact.vectors.singleton + compact.vectors.multi, compact.vectors.thunks);
  const baselineBytes = baseline.compiled.forcedGc.bytes.heapUsed;
  const compactBytes = compact.compiled.forcedGc.bytes.heapUsed;
  const report = {
    passed: true, generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    representation: 'Thunk statement cardinality vector: zero=null, one=direct statement object, many=Array',
    memory: { baselineBytes, compactBytes, savedBytes: baselineBytes - compactBytes,
      savedMiB: Math.round((baselineBytes - compactBytes) / 2 ** 20 * 1000) / 1000 },
    vectorCounts: compact.vectors, baseline, compact,
    limitations: ['Compile-only forced-GC Node samples are not browser/iPhone memory peaks.',
      'Statement objects and expression trees are unchanged; this is a first compact-vector slice, not bytecode.',
      'Runtime semantic equivalence is established by the separate fixture and M1 replay tests.'],
    originalUnchanged: true
  };
  await writeFile(new URL('./results/compact-statement-vector-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, memory: report.memory, vectorCounts: report.vectorCounts,
    result: fileURLToPath(new URL('./results/compact-statement-vector-profile.json', import.meta.url)) }, null, 2));
}
