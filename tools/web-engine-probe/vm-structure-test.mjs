import test from 'node:test';
import assert from 'node:assert/strict';
import { censusObjectGraph, summarizeValueMaps } from './vm-structure.mjs';

test('value-map summary does not allocate deferred value accessors', () => {
  let reads = 0;
  const deferred = {};
  Object.defineProperty(deferred, 'value', { configurable: true, get() { reads++; return new Array(100).fill(0n); } });
  const allocated = { value: [0n, 2n, '', 'x'] };
  const summary = summarizeValueMaps({ test: [new Map([['deferred', deferred], ['allocated', allocated]])] }).test;
  assert.equal(reads, 0);
  assert.deepEqual(summary, { maps: 1, cells: 2, deferredCells: 1, allocatedCells: 1, arrays: 1, slots: 4, nonDefaultSlots: 2 });
});

test('object census handles cycles, maps and repeated references once', () => {
  const shared = { value: 1n };
  const root = { list: [shared, shared, 'abc'], map: new Map([['key', shared]]) };
  root.self = root;
  const result = censusObjectGraph(root, { top: 10 });
  assert.equal(result.objects, 4);
  assert.equal(result.arrays, 1);
  assert.equal(result.arraySlots, 3);
  assert.equal(result.maps, 1);
  assert.equal(result.mapEntries, 1);
  assert.equal(result.bigints, 1);
  assert.equal(result.strings, 2);
  assert.equal(result.stringCodeUnits, 6);
});
