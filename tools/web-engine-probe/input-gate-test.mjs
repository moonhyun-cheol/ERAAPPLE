import test from 'node:test';
import assert from 'node:assert/strict';
import { createInputGate } from './input-gate.mjs';
import { compile } from './dist/engine.mjs';
import { execute, textOf } from './fixture.mjs';

function clock() {
  let time = 1000, sequence = 0;
  const timers = new Map(), resumed = [];
  const gate = createInputGate((value, id) => resumed.push({ value, id }), {
    now: () => time, schedule: fn => { timers.set(++sequence, fn); return sequence; },
    unschedule: id => timers.delete(id)
  });
  return { gate, resumed, timers, advance: ms => { time += ms; } };
}
test('timed input accepts one on-time integer; rejects invalid, duplicate and stale input', () => {
  const { gate, resumed, timers, advance } = clock();
  const first = gate.open({ type: 'tinput', numeric: true, timeout: 3000 });
  assert.equal(gate.accept(first.id, 'bad'), false);
  assert.equal(gate.accept(first.id, '9007199254740993'), false);
  assert.equal(gate.accept(first.id, '2'), true);
  assert.equal(timers.size, 0);
  const second = gate.open({ type: 'input', numeric: true });
  assert.equal(gate.accept(first.id, '1'), false);
  advance(5000); gate.check();
  assert.equal(resumed.length, 1, 'ordinary INPUT never expires');
  assert.equal(gate.accept(second.id, '8'), true);
  assert.deepEqual(resumed.map(r => r.value), ['2', '8']);
});
test('timer vs click race: elapsed deadline chooses engine default exactly once', () => {
  const { gate, resumed, advance, timers } = clock();
  const first = gate.open({ type: 'tinput', numeric: true, timeout: 3000 });
  const delayedTimer = [...timers.values()][0];
  advance(3000);
  gate.accept(first.id, '1'); // timer was throttled; do not accept a late value
  delayedTimer(); gate.check();
  assert.deepEqual(resumed, [{ value: null, id: first.id }]);
  const second = gate.open({ type: 'tinput', numeric: true, timeout: 3000 });
  gate.accept(first.id, '2');
  advance(4000); gate.check(); // foreground resume after background throttling
  assert.deepEqual(resumed[1], { value: null, id: second.id });
  assert.equal(resumed.length, 2);
});
test('zero timeout, long duration, countdown-free timeout and cancellation', () => {
  const { gate, resumed, advance } = clock();
  gate.open({ type: 'tinput', numeric: false, timeout: 0, countdown: false });
  assert.equal(resumed.length, 0); gate.check();
  assert.equal(resumed.length, 1);
  const long = gate.open({ type: 'tinput', numeric: false, timeout: 3e9 });
  advance(1); gate.check(); assert.equal(resumed.length, 1);
  gate.accept(long.id, '한글'); assert.equal(resumed[1].value, '한글');
  gate.open({ type: 'tinput', timeout: 100 }); gate.cancel();
  advance(1000); gate.check(); assert.equal(resumed.length, 2);
});
test('engine TINPUT and TINPUTS retain script defaults on null, and chosen values on input', async () => {
  const files = new Map([['TIMED.ERB', `@SYSTEM_TITLE
TINPUT 3000, 100, 1
PRINTFORML NUMBER:{RESULT}
TINPUTS 3000, "기본", 0
PRINTFORML TEXT:%RESULTS%
QUIT
`]]);
  const timeout = await execute(compile, files, [null, null]);
  assert.match(textOf(timeout.events), /NUMBER:100/);
  assert.match(textOf(timeout.events), /TEXT:기본/);
  const input = await execute(compile, files, ['2', '선택']);
  assert.match(textOf(input.events), /NUMBER:2/);
  assert.match(textOf(input.events), /TEXT:선택/);
});
