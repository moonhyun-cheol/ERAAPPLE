import test from 'node:test';
import assert from 'node:assert/strict';
import { encodePrintFlags, hasPrintFlag, compactStatementVector, statementVectorLength, statementVectorAt } from './compact-function-ir.mjs';
import { CompactLabelMap } from './compact-label-map.mjs';
import { CompactSlice, createCompactLazy } from './compact-lazy-slice.mjs';
import { createPagedArray, pagedArrayStats } from './paged-default-array.mjs';
import { compile as baselineCompile } from './dist/engine.mjs';
import { compile as compactCompile } from './dist/engine-compact-ir.mjs';
import { compile as compactLabelsCompile } from './dist/engine-compact-ir-labels.mjs';
import { compile as compactLazyCompile } from './dist/engine-compact-ir-labels-lazy.mjs';
import { compile as compactLazySliceCompile } from './dist/engine-compact-ir-labels-lazy-slice.mjs';
import { compile as compactPagedCompile } from './dist/engine-compact-ir-labels-lazy-slice-paged.mjs';
import { compile as compactStatementsCompile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements.mjs';
import { compile as compactPrintFormCompile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform.mjs';
import { compile as lazyStaticCompile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs';
import { compile as compactAssignCompile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';
import { execute, files } from './fixture.mjs';

test('PRINT flags round-trip through a compact immutable bitmask', () => {
  const flags = encodePrintFlags('SLW');
  assert.equal(typeof flags, 'number');
  for (const flag of 'SLW') assert.equal(hasPrintFlag(flags, flag), true);
  assert.equal(hasPrintFlag(flags, 'C'), false);
  assert.equal(hasPrintFlag(new Set(['L']), 'L'), true);
  assert.throws(() => encodePrintFlags('?'), /Unsupported PRINT flag/);
});

test('compact label map preserves empty, singleton, update, spill and callback semantics', () => {
  const labels = new CompactLabelMap();
  assert.equal(labels.size, 0);
  assert.equal(labels.set('A', 1), labels);
  labels.set('A', 2);
  assert.equal(labels.size, 1);
  assert.equal(labels.get('A'), 2);
  assert.equal(labels.has('B'), false);
  const seen = [];
  labels.forEach(function (value, key, owner) { seen.push([this, value, key, owner]); }, 'ctx');
  assert.deepEqual(seen, [['ctx', 2, 'A', labels]]);
  labels.set('B', 3).set('C', 4);
  assert.equal(labels.size, 3);
  assert.deepEqual(['A', 'B', 'C'].map(key => labels.get(key)), [2, 3, 4]);
});

test('compact Lazy preserves retry, memoization and undefined results with two fields', () => {
  let calls = 0;
  const Lazy = createCompactLazy((parser, raw) => { calls += 1; return parser(raw); });
  const raw = { value: 4 };
  const lazy = new Lazy(raw, value => value.value * 2);
  assert.equal(Object.keys(lazy).length, 2);
  assert.equal(lazy.get(), 8);
  assert.equal(lazy.get(), 8);
  assert.equal(calls, 1);
  const undefinedLazy = new Lazy(raw, () => undefined);
  assert.equal(undefinedLazy.get(), undefined);
  assert.equal(undefinedLazy.get(), undefined);
  assert.equal(calls, 2);
  let fail = true;
  const retry = new Lazy(raw, () => { if (fail) throw new Error('retry'); return 9; });
  assert.throws(() => retry.get(), /retry/);
  fail = false;
  assert.equal(retry.get(), 9);
  assert.equal(calls, 4);
});

test('compact Slice preserves location, range, slicing and writable bounds', () => {
  const raw = new CompactSlice('A.ERB', 7, '0123456789', 2, 9);
  assert.equal(Object.keys(raw).length, 4);
  assert.equal(raw.get(), '2345678');
  assert.equal(raw.length(), 7);
  const nested = raw.slice(2, 5);
  assert.deepEqual([nested.file, nested.line, nested.from, nested.to, nested.get()], ['A.ERB', 7, 4, 7, '456']);
  raw.from = 1;
  raw.to = 4;
  assert.equal(raw.get(), '123');
  const fallback = new CompactSlice('B', 1, 'abc', -1, 3);
  assert.equal(fallback.get(), 'c');
});

test('hybrid arrays preserve dense Array reads with shape-aware backing', () => {
  const one = createPagedArray([600], 0n);
  assert.equal(Array.isArray(one), true);
  assert.equal(one.length, 600);
  assert.equal(one[599], 0n);
  assert.deepEqual(one.slice(0, 3), [0n, 0n, 0n]);
  one[1] = 7n;
  one[300] = 9n;
  assert.deepEqual(pagedArrayStats(one), {
    dimensions: [600], requestedPageSize: 256, pageSize: 256, denseThreshold: 0.75,
    mode: 'dense-1d', pages: 0, denseLeaves: 1, allocatedSlots: 600, nonDefault: 2
  });
  assert.deepEqual(one.map(value => value).slice(0, 3), [0n, 7n, 0n]);
  one[1] = 0n;
  one[300] = 0n;
  assert.equal(pagedArrayStats(one).pages, 0);

  const two = createPagedArray([2, 4], '');
  assert.equal(two[1][3], '');
  two[1][3] = 'x';
  assert.deepEqual(two.map(row => row.map(value => value)), [['', '', '', ''], ['', '', '', 'x']]);
  assert.equal(pagedArrayStats(two).nonDefault, 1);
  two[1].fill('');
  assert.equal(pagedArrayStats(two).pages, 0);

  const three = createPagedArray([2, 2, 3], 0n);
  three[1][0][2] = 5n;
  assert.equal(three[1][0][2], 5n);
  assert.equal(three[0][1][2], 0n);
  assert.deepEqual(JSON.parse(JSON.stringify(three, (_, value) => typeof value === 'bigint' ? value.toString() : value)),
    [[['0', '0', '0'], ['0', '0', '0']], [['0', '0', '5'], ['0', '0', '0']]]);
});

test('compact statement vectors preserve empty, singleton and multi-statement order', () => {
  const first = { id: 1 }, second = { id: 2 };
  const empty = compactStatementVector([]);
  const single = compactStatementVector([first]);
  const multi = compactStatementVector([first, second]);
  assert.equal(empty, null);
  assert.equal(single, first);
  assert.deepEqual(multi, [first, second]);
  assert.deepEqual([empty, single, multi].map(statementVectorLength), [0, 1, 2]);
  assert.equal(statementVectorAt(single, 0), first);
  assert.equal(statementVectorAt(single, 1), undefined);
  assert.equal(statementVectorAt(multi, 1), second);
});

test('compact PRINT metadata preserves neutral fixture events and saves', async () => {
  const inputs = ['0', '42', '동일 입력 😀'];
  const baseline = await execute(baselineCompile, files, inputs, new Map(), 1000, 42);
  const compact = await execute(compactCompile, files, inputs, new Map(), 1000, 42);
  const compactLabels = await execute(compactLabelsCompile, files, inputs, new Map(), 1000, 42);
  const compactLazy = await execute(compactLazyCompile, files, inputs, new Map(), 1000, 42);
  const compactLazySlice = await execute(compactLazySliceCompile, files, inputs, new Map(), 1000, 42);
  const compactPaged = await execute(compactPagedCompile, files, inputs, new Map(), 1000, 42);
  const compactStatements = await execute(compactStatementsCompile, files, inputs, new Map(), 1000, 42);
  const compactPrintForm = await execute(compactPrintFormCompile, files, inputs, new Map(), 1000, 42);
  const lazyStatic = await execute(lazyStaticCompile, files, inputs, new Map(), 1000, 42);
  const compactAssign = await execute(compactAssignCompile, files, inputs, new Map(), 1000, 42);
  assert.deepEqual(compact.events, baseline.events);
  assert.deepEqual([...compact.store], [...baseline.store]);
  assert.deepEqual(compactLabels.events, compact.events);
  assert.deepEqual([...compactLabels.store], [...compact.store]);
  assert.deepEqual(compactLazy.events, compactLabels.events);
  assert.deepEqual([...compactLazy.store], [...compactLabels.store]);
  assert.deepEqual(compactLazySlice.events, compactLazy.events);
  assert.deepEqual([...compactLazySlice.store], [...compactLazy.store]);
  assert.deepEqual(compactPaged.events, compactLazySlice.events);
  assert.deepEqual([...compactPaged.store], [...compactLazySlice.store]);
  assert.deepEqual(compactStatements.events, compactPaged.events);
  assert.deepEqual([...compactStatements.store], [...compactPaged.store]);
  assert.deepEqual(compactPrintForm.events, compactStatements.events);
  assert.deepEqual([...compactPrintForm.store], [...compactStatements.store]);
  assert.deepEqual(lazyStatic.events, compactPrintForm.events);
  assert.deepEqual([...lazyStatic.store], [...compactPrintForm.store]);
  assert.deepEqual(compactAssign.events, lazyStatic.events);
  assert.deepEqual([...compactAssign.store], [...lazyStatic.store]);
});