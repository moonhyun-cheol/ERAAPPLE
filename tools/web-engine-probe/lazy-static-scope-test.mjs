import test from 'node:test';
import assert from 'node:assert/strict';
import { compile as baselineCompile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform.mjs';
import { compile as lazyCompile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs';
import { externalFor } from './fixture.mjs';

const source = new Map([['STATIC.ERB', `@SYSTEM_TITLE
PRINTFORM {X@TARGET}
RESETDATA
CALL USED
QUIT

@USED
#DIM OWN
OWN = 3
RETURN

@TARGET
#DIM X
RETURN

@UNUSED
#DIM NEVER
RETURN
`]]);

async function run(compile) {
  const vm = compile(source);
  const generator = vm.start(externalFor(new Map()));
  while (!(await generator.next()).done) {}
  return vm;
}

test('lazy static scopes allocate called functions and explicit cross-function targets only', async () => {
  const baseline = await run(baselineCompile);
  const lazy = await run(lazyCompile);
  assert.equal(lazy.getValue('X', 'TARGET').get(lazy, []), 0n);
  assert.equal(lazy.getValue('OWN', 'USED').get(lazy, []), 3n);
  assert.equal(lazy.staticMap.has('UNUSED'), false);
  assert.ok(baseline.staticMap.has('UNUSED'));
  assert.deepEqual([...lazy.staticMap.keys()].sort(), ['@DUMMY', 'SYSTEM_TITLE', 'TARGET', 'USED']);
});

test('lazy static scope reset discards called scopes and resets explicit targets', async () => {
  const vm = await run(lazyCompile);
  await vm.reset();
  assert.deepEqual([...vm.staticMap.keys()].sort(), ['@DUMMY', 'TARGET']);
  assert.equal(vm.getValue('X', 'TARGET').get(vm, []), 0n);
});