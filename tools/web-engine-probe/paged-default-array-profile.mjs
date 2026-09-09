// Performance judgment for the shape-aware hybrid default-value storage BEFORE
// any product promotion. Reproducible, isolated Node measurements (forced GC +
// hrtime), NOT browser/WebKit/iPhone telemetry.
//
// The hybrid keeps 1-D storage dense, caps nested page size to the innermost
// dimension, and promotes a leaf row from sparse pages to a cached dense Proxy
// backing once allocated sparse slots reach 75% of its logical length. This
// profile covers multi-dimensional shapes (where the saving lives) and a 1-D
// linear case. It compares write/read/serialization throughput and retained
// heap for a plain Array vs the hybrid Proxy across page sizes 64/128/256/512
// and sparse/medium/dense leaf fills, plus a densification sweep.
//
//   node --expose-gc paged-default-array-profile.mjs
//
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createPagedArray, pagedArrayStats } from './paged-default-array.mjs';

assert.ok(global.gc, 'run with --expose-gc');

const ZERO = 0n;
const PAGE_SIZES = [64, 128, 256, 512];
const DEFAULT_PAGE = 256;                       // shipped default; timing/densify use this
const BUDGET_MS = 60;
const SHAPES = {
  linear1d: [120_000],                          // ~120k leaves — paged cannot beat a flat array
  grid2d: [1_200, 500],                         // 600k leaves in 1,200 rows
  cube3d: [120, 120, 40]                        // 576k leaves in a 3-D field
};
const DENSITIES = { sparse: 0.001, medium: 0.02, dense: 0.3 }; // fraction of NON-default leaves

const round = (value, digits = 3) => { const f = 10 ** digits; return Math.round(value * f) / f; };
const leafCount = shape => shape.reduce((a, b) => a * b, 1);
const decode = (linear, shape) => {
  const coords = new Array(shape.length);
  for (let d = shape.length - 1; d >= 0; d--) { coords[d] = linear % shape[d]; linear = Math.floor(linear / shape[d]); }
  return coords;
};

// Deterministic, evenly-spread non-default leaves. Even spacing is a
// conservative memory case (values land in as many distinct pages as possible);
// clustered game data would let the pager reclaim/skip even more.
const scatter = (shape, fraction) => {
  const total = leafCount(shape);
  const count = Math.min(total, Math.max(1, Math.round(total * fraction)));
  const step = total / count;
  const entries = new Array(count);
  for (let i = 0; i < count; i++) {
    const linear = Math.min(total - 1, Math.floor(i * step));
    entries[i] = [decode(linear, shape), BigInt(linear * 2 + 1)]; // never the zero default
  }
  return entries;
};

const buildRef = (shape) => shape.length === 1
  ? new Array(shape[0]).fill(ZERO)
  : Array.from({ length: shape[0] }, () => buildRef(shape.slice(1)));
const applyEntries = (root, entries) => {
  for (const [coords, value] of entries) {
    let cur = root;
    for (let d = 0; d < coords.length - 1; d++) cur = cur[coords[d]];
    cur[coords[coords.length - 1]] = value;
  }
  return root;
};
const buildBase = (shape, entries) => applyEntries(buildRef(shape), entries);
const buildPaged = (shape, entries, pageSize) => applyEntries(createPagedArray(shape, ZERO, { pageSize }), entries);

const readAllIndex = (a, dims) => {
  let sum = 0n;
  const n = a.length;
  if (dims === 1) { for (let i = 0; i < n; i++) sum += a[i]; return sum; }
  for (let i = 0; i < n; i++) sum += readAllIndex(a[i], dims - 1);
  return sum;
};
const readAllIterate = (a, dims) => {
  let sum = 0n;
  if (dims === 1) { for (const value of a) sum += value; return sum; }
  for (const child of a) sum += readAllIterate(child, dims - 1);
  return sum;
};
const serialize = a => JSON.stringify(a, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));

// Adaptive wall-clock: repeat until the time budget elapses, return ms/op.
const bench = (fn, budgetMs = BUDGET_MS) => {
  fn();
  let iterations = 0;
  const start = process.hrtime.bigint();
  let now;
  do { fn(); iterations++; now = process.hrtime.bigint(); }
  while (Number(now - start) < budgetMs * 1e6);
  return Number(now - start) / iterations / 1e6;
};

// Median-of-3 retained heap held by one live structure after forced GC.
const heapOnce = build => {
  global.gc(); global.gc();
  const before = process.memoryUsage().heapUsed;
  const held = build();
  global.gc(); global.gc();
  const bytes = process.memoryUsage().heapUsed - before;
  if (held.length === -1) throw new Error('unreachable'); // keep alive past measurement
  return bytes;
};
const retainedHeap = build => {
  const samples = [heapOnce(build), heapOnce(build), heapOnce(build)].sort((a, b) => a - b);
  return samples[1];
};

const memoryBlock = (shape, entries, pageSize) => {
  const baseBytes = retainedHeap(() => buildBase(shape, entries));
  const pagedBytes = retainedHeap(() => buildPaged(shape, entries, pageSize));
  const stats = pagedArrayStats(buildPaged(shape, entries, pageSize));
  return {
    baseBytes, pagedBytes, savedBytes: baseBytes - pagedBytes,
    savedMiB: round((baseBytes - pagedBytes) / 2 ** 20),
    ratio: round(pagedBytes / baseBytes, 3),
    pages: stats.pages, allocatedSlots: stats.allocatedSlots, nonDefault: stats.nonDefault
  };
};

const timingBlock = (shape, entries, pageSize) => {
  const dims = shape.length;
  const base = buildBase(shape, entries);
  const paged = buildPaged(shape, entries, pageSize);
  assert.equal(serialize(base), serialize(paged), 'paged serialization must equal base');
  const op = (baseFn, pagedFn) => {
    const baseMs = bench(() => baseFn(base));
    const pagedMs = bench(() => pagedFn(paged));
    return { baseMs: round(baseMs, 5), pagedMs: round(pagedMs, 5), ratio: round(pagedMs / baseMs, 2) };
  };
  const writeBase = bench(() => buildBase(shape, entries));
  const writePaged = bench(() => buildPaged(shape, entries, pageSize));
  return {
    write: { baseMs: round(writeBase, 5), pagedMs: round(writePaged, 5), ratio: round(writePaged / writeBase, 2) },
    readIndex: op(a => readAllIndex(a, dims), a => readAllIndex(a, dims)),
    readIterate: op(a => readAllIterate(a, dims), a => readAllIterate(a, dims)),
    serialize: op(serialize, serialize)
  };
};

const matrix = {};
for (const [shapeName, shape] of Object.entries(SHAPES)) {
  const perShape = {};
  const entriesByDensity = Object.fromEntries(Object.entries(DENSITIES).map(([n, f]) => [n, scatter(shape, f)]));
  for (const pageSize of PAGE_SIZES) {
    const perDensity = {};
    for (const [name, fraction] of Object.entries(DENSITIES)) {
      console.error(`[matrix] ${shapeName} page=${pageSize} density=${name}`);
      const entries = entriesByDensity[name];
      perDensity[name] = { fraction, nonDefault: entries.length, memory: memoryBlock(shape, entries, pageSize) };
      if (pageSize === DEFAULT_PAGE && shapeName === 'grid2d') perDensity[name].timings = timingBlock(shape, entries, pageSize);
    }
    perShape[`page-${pageSize}`] = perDensity;
  }
  matrix[shapeName] = perShape;
}

// Progressive densification on grid2d at the default page size: find where the
// paged structure stops saving memory versus a plain nested array.
const DENSIFY_SHAPE = SHAPES.grid2d;
const densifySteps = [0, 0.005, 0.02, 0.05, 0.1, 0.2, 0.5];
const densification = densifySteps.map(fraction => {
  console.error(`[densify] fraction=${fraction}`);
  const entries = fraction === 0 ? [] : scatter(DENSIFY_SHAPE, fraction);
  const baseBytes = retainedHeap(() => buildBase(DENSIFY_SHAPE, entries));
  const pagedBytes = retainedHeap(() => buildPaged(DENSIFY_SHAPE, entries, DEFAULT_PAGE));
  const writeMs = fraction === 0 ? 0 : bench(() => buildPaged(DENSIFY_SHAPE, entries, DEFAULT_PAGE));
  const stats = pagedArrayStats(buildPaged(DENSIFY_SHAPE, entries, DEFAULT_PAGE));
  return {
    fraction, nonDefault: entries.length, baseBytes, pagedBytes,
    ratio: round(pagedBytes / baseBytes, 3), savedMiB: round((baseBytes - pagedBytes) / 2 ** 20),
    pages: stats.pages, writeMs: round(writeMs, 5)
  };
});
const breakEven = densification.find(row => row.pagedBytes >= row.baseBytes) ?? null;

// Judgment reference points for the promotion review (not a gate on this run):
// Proxy indirection is expected to cost CPU; the question is whether the
// regression stays inside a band the runtime can absorb on the hot paths.
const thresholds = { readIterateRatioMax: 10, writeRatioMax: 40, serializeRatioMax: 10 };
const denseTimings = matrix.grid2d[`page-${DEFAULT_PAGE}`].dense.timings;
const sparseTimings = matrix.grid2d[`page-${DEFAULT_PAGE}`].sparse.timings;
const observed = {
  readIndexRatioDense: denseTimings.readIndex.ratio,
  readIterateRatioDense: denseTimings.readIterate.ratio,
  readIterateRatioSparse: sparseTimings.readIterate.ratio,
  writeRatioDense: denseTimings.write.ratio,
  serializeRatioDense: denseTimings.serialize.ratio
};
const within = {
  readIterate: observed.readIterateRatioDense <= thresholds.readIterateRatioMax,
  write: observed.writeRatioDense <= thresholds.writeRatioMax,
  serialize: observed.serializeRatioDense <= thresholds.serializeRatioMax
};
const cpuWithinBand = Object.values(within).every(Boolean);
const sparseSaves2d = matrix.grid2d[`page-${DEFAULT_PAGE}`].sparse.memory.savedBytes > 0;
const sparseSaves1d = matrix.linear1d[`page-${DEFAULT_PAGE}`].sparse.memory.savedBytes > 0;

const judgment = {
  thresholds, observed, within, cpuWithinBand,
  nestedSparseSavesMemory: sparseSaves2d,
  linearDenseFallbackNearBase: !sparseSaves1d && matrix.linear1d[`page-${DEFAULT_PAGE}`].sparse.memory.ratio < 1.05,
  breakEvenDensity: breakEven ? breakEven.fraction : null,
  recommendation:
    (sparseSaves2d
      ? 'The shape-aware hybrid retains heap savings on sparse/default-heavy nested arrays. '
      : 'The hybrid did NOT save memory on nested sparse arrays — investigate before any promotion. ') +
    (!sparseSaves1d
      ? 'Its dense 1-D fallback stays near plain-array memory instead of paying page overhead. '
      : '') +
    'Nested pages are capped to the innermost dimension and saturated leaves promote to cached dense backing. ' +
    (cpuWithinBand
      ? 'Iterator fast-path dense CPU regression stayed inside the documented band; direct index reads remain a diagnostic slow path. '
      : 'Iterator/write CPU regression still exceeded the documented band — profile hot operations before promotion. ') +
    'Do NOT promote to the release/PWA engine before full engine replay/save verification plus Chromium/WebKit and real-iPhone measurement.'
};

const report = {
  passed: true,
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  parameters: { shapes: SHAPES, pageSizes: PAGE_SIZES, densities: DENSITIES, defaultPage: DEFAULT_PAGE, denseThreshold: 0.75, benchBudgetMs: BUDGET_MS, heapSampling: 'median-of-3 forced-GC deltas' },
  matrix, densification, breakEven, judgment,
  limitations: [
    'Node forced-GC heap deltas and single-thread hrtime, not browser layout, WebKit object sizes, or iPhone RSS.',
    'Only BigInt numeric leaves with an evenly-spread value pattern are exercised; string arrays and clustered access differ.',
    'Serialization is measured with a BigInt->string replacer applied equally to both sides, not the engine save pipeline.',
    'Timing includes both direct index traversal and the Symbol.iterator fast path; engine loops must use iteration to receive the fast-path benefit.',
    'Densification is sampled on a single 2-D shape; promotion occurs per leaf allocation, so the reported global break-even is descriptive rather than the configured trigger.'
  ]
};

await writeFile(new URL('./results/paged-default-array-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');

const summary = {
  passed: true,
  memoryRatioDefaultPage: Object.fromEntries(Object.keys(SHAPES).map(s => [s, {
    sparse: matrix[s][`page-${DEFAULT_PAGE}`].sparse.memory.ratio,
    medium: matrix[s][`page-${DEFAULT_PAGE}`].medium.memory.ratio,
    dense: matrix[s][`page-${DEFAULT_PAGE}`].dense.memory.ratio
  }])),
  grid2dSparseSavedMiB: matrix.grid2d[`page-${DEFAULT_PAGE}`].sparse.memory.savedMiB,
  denseCpuRatio: observed,
  breakEvenDensity: judgment.breakEvenDensity,
  cpuWithinBand,
  result: new URL('./results/paged-default-array-profile.json', import.meta.url).pathname
};
console.log(JSON.stringify(summary, null, 2));
