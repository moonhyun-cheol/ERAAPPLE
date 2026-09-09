// Semantic-equivalence acceptance for the paged default-value storage.
// A paged Array-compatible Proxy must be observably identical to a plain
// zero-filled Array under the engine's dense-default contract: indexing,
// length growth/shrink, iteration/map, JSON serialization, and page
// reclamation must all agree with an independent reference model.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPagedArray, pagedArrayGet, pagedArraySet, pagedArrayStats } from './paged-default-array.mjs';

// Independent reference: a plain nested Array whose observable reads follow
// the same "unset slot within length reads as zero" rule the engine relies on.
const buildRef = (shape, zero) => shape.length === 1
  ? new Array(shape[0]).fill(zero)
  : Array.from({ length: shape[0] }, () => buildRef(shape.slice(1), zero));

// Canonical read of any array-like (plain or paged Proxy) honouring zero-fill.
const canon = (arr, dims, zero) => {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (dims === 1) {
      let v = arr[i];
      if (v === undefined) v = zero;
      out.push(typeof v === 'bigint' ? 'B' + v.toString() : v);
    } else {
      out.push(canon(arr[i], dims - 1, zero));
    }
  }
  return out;
};

// JSON serialization must also match (holes -> the reference fills zero).
const jsonReplacer = (_key, value) => (typeof value === 'bigint' ? 'B' + value.toString() : value);
const json = arr => JSON.stringify(arr, jsonReplacer);

// Count reachable non-default leaves so we can check page reclamation.
const countNonDefault = (arr, dims, zero) => {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    if (dims === 1) { const v = arr[i]; if (v !== undefined && v !== zero) total++; }
    else total += countNonDefault(arr[i], dims - 1, zero);
  }
  return total;
};

// Deterministic PRNG so failures are reproducible.
const lcg = seed => () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const shapes = [[64], [40, 10], [8, 6, 5]];
const zeros = [0n, ''];
const pageSizes = [1, 7, 64, 256];

for (const shape of shapes) {
  for (const zero of zeros) {
    for (const pageSize of pageSizes) {
      const label = `shape=${shape.join('x')} zero=${zero === '' ? '""' : '0n'} page=${pageSize}`;
      test(`paged array matches reference — ${label}`, () => {
        const dims = shape.length;
        const paged = createPagedArray(shape, zero, { pageSize });
        const ref = buildRef(shape, zero);
        assert.equal(paged.length, ref.length, 'initial outer length');
        assert.equal(json(paged), json(ref), 'initial serialization');

        const rand = lcg(shape.length * 97 + (zero === '' ? 1 : 0) + pageSize);
        const value = () => {
          if (rand() < 0.35) return zero; // clear back to default
          if (zero === '') return 'v' + Math.floor(rand() * 1000);
          const raw = BigInt(Math.floor(rand() * 4_000_000)) * (rand() < 0.2 ? -1n : 1n);
          // Exercise > 53-bit precision the engine requires to survive intact.
          return rand() < 0.15 ? raw + 9_007_199_254_740_993n : raw;
        };

        // Navigate to an array at a path using current (possibly shrunk) lengths.
        const reachable = (root, path) => {
          let cur = root;
          for (const idx of path) { if (idx >= cur.length) return null; cur = cur[idx]; }
          return cur;
        };
        const randPath = (root, count) => {
          const path = [];
          let curRef = root;
          for (let d = 0; d < count; d++) {
            if (curRef.length === 0) return null;
            const idx = Math.floor(rand() * curRef.length);
            path.push(idx);
            curRef = curRef[idx];
          }
          return path;
        };

        for (let step = 0; step < 1500; step++) {
          const roll = rand();
          if (roll < 0.6) {
            // Write a leaf value at an in-bounds coordinate.
            const outer = randPath(ref, dims - 1);
            if (outer === null) continue;
            const leafRef = reachable(ref, outer);
            if (!leafRef || leafRef.length === 0) continue;
            const j = Math.floor(rand() * leafRef.length);
            const v = value();
            leafRef[j] = v;
            reachable(paged, outer)[j] = v;
          } else if (roll < 0.75 && dims === 1) {
            // 1-D leaf growth: engine contract fills the gap with zero.
            const j = ref.length + Math.floor(rand() * 8);
            const v = value();
            for (let k = ref.length; k < j; k++) ref[k] = zero;
            ref[j] = v;
            paged[j] = v;
          } else if (roll < 0.88) {
            // Shrink an inner array's length (page reclamation path).
            const path = randPath(ref, dims - 1);
            if (path === null) continue;
            const arrRef = reachable(ref, path);
            if (!arrRef || arrRef.length === 0) continue;
            const len = Math.floor(rand() * arrRef.length);
            arrRef.length = len;
            reachable(paged, path).length = len;
          } else {
            // Shrink the outer array.
            const len = Math.floor(rand() * (ref.length + 1));
            ref.length = len;
            paged.length = len;
          }
        }

        assert.equal(paged.length, ref.length, `outer length after ops — ${label}`);
        assert.equal(json(paged), json(ref), `serialization after ops — ${label}`);
        assert.deepEqual(canon(paged, dims, zero), canon(ref, dims, zero), `canonical reads after ops — ${label}`);

        // Iteration length contract on the top level.
        assert.deepEqual(
          Array.from(paged, () => 0),
          Array.from(ref, () => 0),
          `iteration length via Array.from — ${label}`
        );

        // Page reclamation: reported non-default slots equal reachable non-zero leaves.
        const stats = pagedArrayStats(paged);
        assert.ok(stats, 'stats available for a paged root');
        assert.equal(stats.nonDefault, countNonDefault(ref, dims, zero), `nonDefault reclamation — ${label}`);
        assert.equal(stats.pageSize, Math.max(1, Math.min(pageSize, shape.at(-1) || 1)));
        assert.equal(stats.requestedPageSize, pageSize);
        assert.equal(stats.mode, dims === 1 ? 'dense-1d' : 'hybrid');
        assert.ok(stats.allocatedSlots >= stats.nonDefault, 'allocated slots cover live values');
      });
    }
  }
}

test('Array contract predicates hold on a paged root', () => {
  const arr = createPagedArray([300], 0n, { pageSize: 64 });
  assert.ok(Array.isArray(arr), 'Array.isArray');
  arr[100] = 5n;
  assert.ok(100 in arr, 'in operator within length');
  assert.equal(299 in arr, true, 'default slot within length is present');
  assert.equal(500 in arr, false, 'index beyond length absent');
  assert.equal(arr[500], undefined, 'read beyond length is undefined');
  assert.equal(arr[100], 5n, 'written value read back');
  assert.equal(arr.map(v => v).filter(v => v === 5n).length, 1, 'map preserves single non-default');
  arr[100] = 0n; // clearing releases the page
  assert.equal(pagedArrayStats(arr).pages, 0, 'page reclaimed after clearing its only value');
});

test('1-D storage uses a dense backing while preserving zero-filled growth', () => {
  const arr = createPagedArray([8], 0n, { pageSize: 256 });
  assert.deepEqual(pagedArrayStats(arr), {
    dimensions: [8], requestedPageSize: 256, pageSize: 8, denseThreshold: 0.75,
    mode: 'dense-1d', pages: 0, denseLeaves: 1, allocatedSlots: 8, nonDefault: 0
  });
  arr[12] = 9n;
  assert.equal(arr.length, 13);
  assert.equal(arr[10], 0n, 'grown gap remains default-filled');
  assert.equal(pagedArrayStats(arr).allocatedSlots, 13);
  assert.equal(pagedArrayStats(arr).nonDefault, 1);
});

test('nested leaves cap page size and promote independently when sparse allocation saturates', () => {
  const arr = createPagedArray([3, 10], 0n, { pageSize: 256, denseThreshold: 0.5 });
  let stats = pagedArrayStats(arr);
  assert.equal(stats.pageSize, 10, 'page is bounded by the innermost dimension');
  assert.equal(stats.denseLeaves, 0);

  arr[1][2] = 7n; // one full-width page reaches the 50% allocation threshold
  stats = pagedArrayStats(arr);
  assert.equal(stats.pages, 0);
  assert.equal(stats.denseLeaves, 1, 'only the touched leaf is promoted');
  assert.equal(stats.allocatedSlots, 10);
  assert.equal(arr[1][2], 7n);
  assert.equal(arr[0][2], 0n, 'untouched leaves remain unallocated and default-filled');

  arr[1].length = 14;
  assert.equal(arr[1][12], 0n, 'promoted leaf preserves default-filled growth');
  arr[1][12] = 11n;
  assert.equal(arr[1][12], 11n);
  arr.length = 1;
  stats = pagedArrayStats(arr);
  assert.equal(stats.denseLeaves, 0, 'outer truncation releases promoted children');
  assert.equal(stats.nonDefault, 0);
});

test('a small page stays sparse until its allocation threshold is reached', () => {
  const arr = createPagedArray([1, 16], '', { pageSize: 4, denseThreshold: 0.75 });
  arr[0][0] = 'a';
  arr[0][4] = 'b';
  assert.equal(pagedArrayStats(arr).pages, 2);
  assert.equal(pagedArrayStats(arr).denseLeaves, 0);
  arr[0][8] = 'c';
  assert.equal(pagedArrayStats(arr).pages, 0);
  assert.equal(pagedArrayStats(arr).denseLeaves, 1);
  assert.deepEqual(Array.from(arr[0]), ['a', '', '', '', 'b', '', '', '', 'c', '', '', '', '', '', '', '']);
});

test('sparse leaf iterator follows Array value and dynamic-length semantics', () => {
  const arr = createPagedArray([1, 12], 0n, { pageSize: 4 });
  const leaf = arr[0];
  leaf[1] = 7n;
  leaf[9] = 11n;
  assert.deepEqual([...leaf], [0n, 7n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 11n, 0n, 0n]);
  assert.deepEqual(Array.from(leaf), [...leaf], 'Array.from consumes the fast iterator');

  const iterator = leaf[Symbol.iterator]();
  assert.deepEqual(iterator.next(), { value: 0n, done: false });
  leaf[0] = 3n; // the first value was already observed
  leaf[2] = 8n; // a future value in the already-open page must be observed
  leaf.length = 3;
  assert.deepEqual(iterator.next(), { value: 7n, done: false });
  assert.deepEqual(iterator.next(), { value: 8n, done: false });
  assert.deepEqual(iterator.next(), { value: undefined, done: true }, 'iterator observes shrink dynamically');
});

test('nested iterator preserves assigned child replacements', () => {
  const arr = createPagedArray([2, 4], '', { pageSize: 2 });
  const replacement = ['x', 'y'];
  arr[0] = replacement;
  assert.equal([...arr][0], replacement);
  assert.deepEqual([...arr][1], ['', '', '', '']);
});

test('backing accessors preserve nested get/set semantics without a Proxy chain', () => {
  const two = createPagedArray([3, 8], 0n, { pageSize: 2 });
  assert.equal(pagedArrayGet(two, [1n, 6n]), 0n, 'BigInt indices retain native property-key semantics');
  pagedArraySet(two, [1n, 6n], 9_007_199_254_740_993n);
  assert.equal(two[1][6], 9_007_199_254_740_993n);
  assert.equal(pagedArrayGet(two, [1, 6]), two[1][6]);
  pagedArraySet(two, [1, 10], -7n);
  assert.equal(two[1].length, 11, 'leaf growth matches nested assignment');
  assert.equal(two[1][9], 0n);
  assert.equal(pagedArrayGet(two, [1, 10]), -7n);
  assert.equal(pagedArrayGet(two, [1, 20]), undefined, 'leaf out-of-range read remains undefined');
  assert.throws(() => pagedArrayGet(two, [8, 0]), TypeError, 'outer out-of-range read still fails through native semantics');

  const replacement = new Array(8).fill(0n);
  two[2] = replacement;
  pagedArraySet(two, [2, 3], 5n);
  assert.equal(replacement[3], 5n, 'assigned child replacements remain authoritative');
  assert.equal(pagedArrayGet(two, [2, 3]), 5n);

  const three = createPagedArray([2, 3, 4], 0n, { pageSize: 2 });
  pagedArraySet(three, [1, 2, 3], -9_007_199_254_740_999n);
  assert.equal(pagedArrayGet(three, [1, 2, 3]), -9_007_199_254_740_999n);
  assert.equal(three[1][2][3], -9_007_199_254_740_999n);

  const plain = [[0n, 0n]];
  pagedArraySet(plain, [0, 1], 4n);
  assert.equal(pagedArrayGet(plain, [0, 1]), 4n, 'helpers safely fall back for plain arrays');
  assert.throws(() => pagedArrayGet(two, [1]), RangeError);
});

test('invalid shapes and page sizes are rejected like the base allocation', () => {
  assert.throws(() => createPagedArray([], 0n), RangeError);
  assert.throws(() => createPagedArray([1, 2, 3, 4], 0n), RangeError);
  assert.throws(() => createPagedArray([-1], 0n), RangeError);
  assert.throws(() => createPagedArray([2 ** 32], 0n), RangeError);
  assert.throws(() => createPagedArray([10], 0n, { pageSize: 0 }), RangeError);
  assert.throws(() => createPagedArray([10], 0n, { pageSize: 1.5 }), RangeError);
  assert.throws(() => createPagedArray([10], 0n, { denseThreshold: 0 }), RangeError);
  assert.throws(() => createPagedArray([10], 0n, { denseThreshold: 1.1 }), RangeError);
});
