// One-off measurement: count If nodes and their eager Lazy branch payloads in the
// compiled current-game VM, to decide whether an If-payload compaction overlay is worth it.
// Detect structurally (esbuild may rename the default-exported `If` class).
import assert from 'node:assert/strict';
import { gameFiles, inventory } from './inventory.mjs';

assert.ok(global.gc, 'run with --expose-gc');
const original = await inventory();
let source = await gameFiles(original.records);
const { compile } = await import(new URL('./dist/engine.mjs', import.meta.url));
const vm = compile(source.files);
source = null;

const isLazy = v => v && typeof v === 'object' && v.constructor?.name?.startsWith('Lazy');
const looksLikeIf = v => v && typeof v === 'object' && Array.isArray(v.ifThunk) && 'elseThunk' in v
  && v.ifThunk.every(b => Array.isArray(b) && b.length === 3);

const seen = new WeakSet(), stack = [vm];
let ifNodes = 0, ifBranches = 0, lazyOnBranch = 0, rawBytes = 0, totalLazy = 0;
const names = new Map();
while (stack.length) {
  const value = stack.pop();
  if (value == null || (typeof value !== 'object' && typeof value !== 'function') || seen.has(value)) continue;
  seen.add(value);
  if (isLazy(value)) totalLazy++;
  if (looksLikeIf(value)) {
    ifNodes++;
    const n = value.constructor?.name ?? '?';
    names.set(n, (names.get(n) ?? 0) + 1);
    for (const branch of value.ifThunk) {
      ifBranches++;
      if (isLazy(branch[1])) lazyOnBranch++;
      if (typeof branch[0] === 'string') rawBytes += branch[0].length;
    }
  }
  if (Array.isArray(value)) for (const item of value) stack.push(item);
  else if (value instanceof Map) for (const [k, item] of value) stack.push(k, item);
  else if (value instanceof Set) for (const item of value) stack.push(item);
  else for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (d && 'value' in d) stack.push(d.value);
  }
}
assert.equal((await inventory()).originalDigest, original.originalDigest);
console.log(JSON.stringify({ ifNodes, ifBranches, lazyOnBranch, rawBytes, totalLazy,
  ifClassNames: Object.fromEntries(names),
  approxLazyObjectBytesLow: lazyOnBranch * 32, approxLazyObjectBytesHigh: lazyOnBranch * 80 }, null, 2));
