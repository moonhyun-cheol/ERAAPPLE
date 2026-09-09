import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deferLocalArray } from './deferred-local.mjs';
import { transformSaveSource } from './save-build-plugin.mjs';
import { compile as deferred } from './dist/engine.mjs';
import { compile as eager } from './dist/engine-save-only.mjs';
import { externalFor } from './fixture.mjs';
const isDeferred = cell => typeof Object.getOwnPropertyDescriptor(cell, 'value').get === 'function';
test('deferred arrays materialize once, allow replacement, and preserve Array size errors', () => {
  for (const zero of [0n, '']) {
    const cell = {}; deferLocalArray(cell, 8, zero);
    assert.ok(isDeferred(cell)); assert.deepEqual(Object.keys(cell), ['value']);
    const value = cell.value; assert.ok(Array.isArray(value)); assert.deepEqual(value, new Array(8).fill(zero));
    assert.equal(cell.value, value); assert.equal(isDeferred(cell), false);
    const other = {}; deferLocalArray(other, 8, zero);
    other.value = [zero]; assert.equal(isDeferred(other), false); assert.equal(other.value.length, 1);
    for (const bad of [-1, 0.5, 2 ** 32]) assert.throws(() => deferLocalArray({}, bad, zero), RangeError);
    const empty = {}; deferLocalArray(empty, 0, zero); assert.deepEqual(empty.value, []);
  }
});
test('both value overlays fail closed and accept CRLF/LF', async () => {
  for (const relative of ['value/int-1d.js', 'value/str-1d.js']) {
    const source = await readFile(new URL('../../.my_agent_remote/undercrow__eraJS/build/' + relative, import.meta.url), 'utf8');
    assert.equal(transformSaveSource(relative, source), transformSaveSource(relative, source.replaceAll('\r\n', '\n')));
    assert.throws(() => transformSaveSource(relative, source + ' '), /fingerprint/);
  }
});
const source = new Map([['TEST.ERB', `@SYSTEM_TITLE
CALL BUMP
CALL BUMP
CALL RECURSE, 3
WAIT
QUIT
@BUMP
#LOCALSIZE 8
#LOCALSSIZE 4
LOCAL:1 += 1
LOCALS:1 = 한글 😀
RETURN
@RECURSE, ARG:0
LOCAL:0 += 1
IF ARG:0 > 0
CALL RECURSE, ARG:0 - 1
ENDIF
RETURN
@UNUSED
#LOCALSIZE 17
#LOCALSSIZE 5
RETURN
`]]);
test('actual cell methods, function persistence/recursion, scoped access and reset match eager engine', async () => {
  const runs = [];
  for (const compile of [eager, deferred]) {
    const vm = compile(source), gen = vm.start(externalFor(new Map()));
    let waiting = false;
    for (let n = 0; n < 100; n++) { const next = await gen.next(); if (next.value?.type === 'wait') { waiting = true; break; } }
    assert.ok(waiting);
    assert.equal(vm.getValue('LOCAL', 'BUMP').value[1], 2n);
    assert.equal(vm.getValue('LOCAL', 'RECURSE').value[0], 4n);
    const numeric = vm.getValue('LOCAL', 'UNUSED'), text = vm.getValue('LOCALS', 'UNUSED');
    assert.equal(isDeferred(numeric), compile === deferred);
    assert.equal(isDeferred(text), compile === deferred);
    assert.equal(numeric.length(0), 17); assert.equal(text.length(0), 5);
    assert.equal(numeric.get(vm, []), 0n); assert.equal(text.get(vm, [1]), '');
    numeric.set(vm, 9007199254740993n, [3]); text.set(vm, '한글 😀', [2]);
    numeric.rangeSet(vm, -7n, [], [5, 9]); text.rangeSet(vm, '0', [], [3, 5]);
    const first = structuredClone([numeric.value, text.value]);
    numeric.set(vm, 9n, [20]); numeric.reset(new Map([[1, '9223372036854775807']]));
    text.reset(['재설정']);
    assert.equal(numeric.length(0), 21); assert.equal(numeric.value[20], 0n);
    assert.equal(text.value[4], '');
    assert.throws(() => numeric.set(vm, 'x', [0])); assert.throws(() => text.set(vm, 1n, [0]));
    runs.push({ first, reset: structuredClone([numeric.value, text.value]), bump: [...vm.getValue('LOCALS', 'BUMP').value] });
    await gen.return(); await vm.reset();
    assert.notEqual(vm.staticMap.get('UNUSED').get('LOCAL'), numeric);
    assert.equal(isDeferred(vm.staticMap.get('UNUSED').get('LOCAL')), compile === deferred);
    assert.equal(vm.staticMap.get('BUMP').get('LOCAL').value[1], 0n);
  }
  assert.deepEqual(runs[0], runs[1]);
});
