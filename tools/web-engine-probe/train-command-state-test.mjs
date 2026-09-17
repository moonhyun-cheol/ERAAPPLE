import test from 'node:test';
import assert from 'node:assert/strict';
import { compile } from './dist/engine.mjs';
import { externalFor } from './fixture.mjs';

const files = new Map([
  ['TRAIN.CSV', '0,상태 경계 시험,\n'],
  ['CHARA0.CSV', '番号,0\n名前,테스트\n呼び名,테스트\n基礎,0,1650\n基礎,1,1000\n'],
  ['HARNESS.ERB', `@SYSTEM_TITLE
ADDCHARA 0
; Simulate DOWNBASE persisted from the previous session/save. Without the
; command-boundary reset, the first action subtracts all 1650 HP immediately.
DOWNBASE:0:0 = 1650
BEGIN TRAIN

@SHOW_STATUS
RETURN 0

@SHOW_USERCOM
RETURN 0

@EVENTCOM
RETURN 0

@COM0
UP:0 += 3
DOWN:0 += 4
LOSEBASE:0 += 10
DOWNBASE:0:0 += 5
RESULT = 1
RETURN 1

@SOURCE_CHECK
BASE:0:0 -= DOWNBASE:0:0
PRINTFORML COMMAND:{UP:0}:{DOWN:0}:{LOSEBASE:0}:{DOWNBASE:0:0}:{BASE:0:0}
RETURN 0

@EVENTCOMEND
RETURN 0
`],
]);

test('TRAIN clears stale global and per-character command costs before every action', async () => {
  const vm = compile(files);
  assert.deepEqual([...vm.code.csv.train.keys()], [0]);
  const generator = vm.start(externalFor(new Map()));
  const inputs = ['0', '0'];
  const commandStates = [];
  let input = null;
  try {
    for (let step = 0; step < 200; step++) {
      const next = await generator.next(input);
      input = null;
      assert.equal(next.done, false, 'TRAIN ended before two commands ran');
      const event = next.value;
      if (event.type === 'input') {
        input = inputs.length ? inputs.shift() : '0';
      } else if (event.type === 'wait') {
        commandStates.push([
          vm.getValue('UP').get(vm, [0]).toString(),
          vm.getValue('DOWN').get(vm, [0]).toString(),
          vm.getValue('LOSEBASE').get(vm, [0]).toString(),
          vm.characterList[0].getValue('DOWNBASE').get(vm, [0]).toString(),
          vm.characterList[0].getValue('BASE').get(vm, [0]).toString(),
        ]);
        if (commandStates.length === 2) break;
        input = '';
      }
    }
  } finally {
    await generator.return();
  }
  assert.deepEqual(commandStates, [
    ['3', '4', '10', '5', '1645'],
    ['3', '4', '10', '5', '1640'],
  ]);
  assert.equal(inputs.length, 0);
});
