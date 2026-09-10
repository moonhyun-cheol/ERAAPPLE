// Isolated allocation/time probe for the save integer compaction path.
// Full-game transition-peak uses natural heapUsed high-water (no GC), which is
// confounded: faster non-Proxy code leaves more uncollected garbage between
// per-event samples, so it cannot judge an allocation reduction. Here we run one
// compaction call in a forced-GC sandbox and read heapUsed growth + wall time.
// Requires --expose-gc.
import assert from 'node:assert/strict';
import { createPagedArray, pagedDenseBacking } from './paged-default-array.mjs';

assert.ok(global.gc, 'run with --expose-gc');

// Original algorithm, forced through the Proxy (index access) -- the pre-fix path.
function compactViaProxy(value, shape, depth = 0) {
  let end = value.length;
  const leaf = depth === shape.length - 1;
  if (leaf && end <= shape[depth]) { while (end && value[end - 1] === 0n) end--; }
  const result = new Array(end);
  for (let i = 0; i < end; i++) result[i] = leaf ? value[i].toString() : compactViaProxy(value[i], shape, depth + 1);
  if (!leaf && end <= shape[depth]) { while (end && result[end - 1].length === 0) end--; result.length = end; }
  return result;
}
// Post-fix path: scan the raw dense backing.
function compactViaBacking(value, shape) {
  const src = pagedDenseBacking(value); assert.ok(src, 'expected dense-1d backing');
  let end = src.length;
  if (end <= shape[0]) { while (end && src[end - 1] === 0n) end--; }
  const result = new Array(end);
  for (let i = 0; i < end; i++) result[i] = src[i].toString();
  return result;
}

function measure(label, make, run, shape) {
  const value = make();
  global.gc(); global.gc();
  const before = process.memoryUsage().heapUsed;
  const t0 = process.hrtime.bigint();
  const out = run(value, shape);
  const t1 = process.hrtime.bigint();
  const afterNoGc = process.memoryUsage().heapUsed; // result + not-yet-collected garbage
  global.gc(); global.gc();
  const afterGc = process.memoryUsage().heapUsed;
  return { label, outLen: out.length,
    ms: Math.round(Number(t1 - t0) / 1e5) / 10,
    grossAllocMiB: Math.round((afterNoGc - before) / 2 ** 20 * 100) / 100,
    retainedMiB: Math.round((afterGc - before) / 2 ** 20 * 100) / 100 };
}

// Large mostly-default global 1-D integer row (GLOBAL / A-Z / FLAG shape class).
const N = 11_400_000;
const shape = [N];
const seed = value => { value[5] = 3n; value[128] = 7n; value[100000] = 9n; return value; };
const makePaged = () => seed(createPagedArray([N], 0n));

const proxy = measure('proxy-scan (pre-fix)', makePaged, compactViaProxy, shape);
const backing = measure('backing-scan (post-fix)', makePaged, compactViaBacking, shape);

// Parity: both paths must produce identical output.
const a = compactViaProxy(makePaged(), shape);
const b = compactViaBacking(makePaged(), shape);
assert.equal(JSON.stringify(a), JSON.stringify(b), 'proxy and backing outputs must be byte-identical');

console.log(JSON.stringify({
  passed: true,
  arraySlots: N,
  parity: true,
  proxy, backing,
  timeSpeedup: Math.round(proxy.ms / backing.ms * 10) / 10,
  grossAllocReductionMiB: Math.round((proxy.grossAllocMiB - backing.grossAllocMiB) * 100) / 100
}, null, 2));
