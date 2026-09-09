// Targeted Cell.get/set hot-path profile for the isolated paged prototype.
// Compares plain nested Array access, public Proxy indexing, and direct backing
// helpers using the same pre-normalized coordinate arrays.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createPagedArray, pagedArrayGet, pagedArraySet } from './paged-default-array.mjs';

const BUDGET_MS = 80;
const CASES = {
  grid2d: [1_200, 500],
  cube3d: [120, 120, 40]
};
const DENSITIES = { sparse: 0.001, dense: 0.3 };
const round = (value, digits = 3) => { const scale = 10 ** digits; return Math.round(value * scale) / scale; };
const leafCount = shape => shape.reduce((total, size) => total * size, 1);
const decode = (linear, shape) => {
  const result = new Array(shape.length);
  for (let depth = shape.length - 1; depth >= 0; depth--) {
    result[depth] = linear % shape[depth];
    linear = Math.floor(linear / shape[depth]);
  }
  return result;
};
const entries = (shape, fraction) => {
  const total = leafCount(shape), count = Math.max(1, Math.round(total * fraction)), step = total / count;
  return Array.from({ length: count }, (_, index) => {
    const linear = Math.min(total - 1, Math.floor(index * step));
    return [decode(linear, shape), BigInt(linear + 1)];
  });
};
const buildBase = shape => shape.length === 1
  ? new Array(shape[0]).fill(0n)
  : Array.from({ length: shape[0] }, () => buildBase(shape.slice(1)));
const nestedGet = (root, index) => index.reduce((value, part) => value[part], root);
const nestedSet = (root, index, value) => {
  let target = root;
  for (let depth = 0; depth < index.length - 1; depth++) target = target[index[depth]];
  target[index.at(-1)] = value;
};
const populate = (root, values, setter) => { for (const [index, value] of values) setter(root, index, value); return root; };
const bench = fn => {
  fn();
  let iterations = 0, checksum = 0n;
  const start = process.hrtime.bigint();
  let now;
  do { checksum ^= BigInt(fn() ?? 0); iterations++; now = process.hrtime.bigint(); }
  while (Number(now - start) < BUDGET_MS * 1e6);
  return { ms: Number(now - start) / iterations / 1e6, checksum };
};
const ratio = (numerator, denominator) => round(numerator / denominator, 2);

const results = {};
for (const [caseName, shape] of Object.entries(CASES)) {
  results[caseName] = {};
  for (const [densityName, density] of Object.entries(DENSITIES)) {
    const values = entries(shape, density);
    const sample = values.length <= 20_000
      ? values
      : Array.from({ length: 20_000 }, (_, index) => values[Math.floor(index * values.length / 20_000)]);
    const base = populate(buildBase(shape), values, nestedSet);
    const paged = populate(createPagedArray(shape, 0n), values, nestedSet);
    const read = getter => () => {
      let sum = 0n;
      for (const [index] of sample) sum += getter(paged, index);
      return sum;
    };
    const baseRead = () => {
      let sum = 0n;
      for (const [index] of sample) sum += nestedGet(base, index);
      return sum;
    };
    const write = setter => () => {
      for (const [index, value] of sample) setter(paged, index, value);
      return sample.length;
    };
    const baseWrite = () => {
      for (const [index, value] of sample) nestedSet(base, index, value);
      return sample.length;
    };
    const measured = {
      read: {
        base: bench(baseRead).ms,
        proxy: bench(read(nestedGet)).ms,
        backing: bench(read(pagedArrayGet)).ms
      },
      write: {
        base: bench(baseWrite).ms,
        proxy: bench(write(nestedSet)).ms,
        backing: bench(write(pagedArraySet)).ms
      }
    };
    assert.equal(read(pagedArrayGet)(), baseRead(), `${caseName}/${densityName} direct read`);
    results[caseName][densityName] = {
      density, populated: values.length, sampled: sample.length,
      read: {
        baseMs: round(measured.read.base, 5), proxyMs: round(measured.read.proxy, 5), backingMs: round(measured.read.backing, 5),
        proxyOverBase: ratio(measured.read.proxy, measured.read.base), backingOverBase: ratio(measured.read.backing, measured.read.base),
        backingVsProxy: ratio(measured.read.backing, measured.read.proxy)
      },
      write: {
        baseMs: round(measured.write.base, 5), proxyMs: round(measured.write.proxy, 5), backingMs: round(measured.write.backing, 5),
        proxyOverBase: ratio(measured.write.proxy, measured.write.base), backingOverBase: ratio(measured.write.backing, measured.write.base),
        backingVsProxy: ratio(measured.write.backing, measured.write.proxy)
      }
    };
    console.error(`[direct] ${caseName}/${densityName}`, results[caseName][densityName]);
  }
}

const report = {
  passed: true,
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  parameters: { cases: CASES, densities: DENSITIES, sampleMax: 20_000, budgetMs: BUDGET_MS },
  results,
  scope: 'Pre-normalized Int2DValue/Int3DValue Cell.get/set access only; reset/rangeSet, browser layout, and iPhone telemetry are excluded.'
};
await writeFile(new URL('./results/paged-direct-access-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
