import test from 'node:test';
import assert from 'node:assert/strict';
import { compile } from './dist/engine.mjs';
import { externalFor, files } from './fixture.mjs';
import { sha } from './inventory.mjs';
import { canonicalString, createReplayRecorder, hashValue, runReplay } from './replay-harness.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';

test('canonical replay hashing preserves BigInt and ignores only declared volatile fields', () => {
  const left = { z: 1, value: 9007199254740993n, nested: new Map([['b', 2], ['a', 1]]), deadline: 10 };
  const right = { deadline: 99, nested: new Map([['a', 1], ['b', 2]]), value: 9007199254740993n, z: 1 };
  assert.equal(canonicalString(left), canonicalString(right));
  assert.equal(hashValue(left), hashValue(right));
  assert.notEqual(hashValue(left), hashValue({ ...right, value: 9007199254740992n }));
  assert.throws(() => { const cyclic = {}; cyclic.self = cyclic; canonicalString(cyclic); }, /cycles/);
});

async function fixtureReplay() {
  const store = new Map();
  const vm = compile(files);
  vm.random.state = 42;
  const generator = vm.start(externalFor(store));
  const inputs = ['0', '42', '동일 입력 😀'];
  let used = 0;
  try {
    const result = await runReplay({ generator, recorder: createReplayRecorder(), decide: ({ event }) => ({
      input: event.type === 'wait' ? '' : inputs[used++], context: { eventType: event.type, ordinal: used }
    }) });
    assert.equal(used, inputs.length);
    return { replay: result.replay, saves: [...store].map(([key, value]) => [key, sha(value)]) };
  } finally { await generator.return(); }
}

test('the same engine, fixture and inputs produce an identical event/input/save transcript', async () => {
  const first = await fixtureReplay();
  const second = await fixtureReplay();
  assert.deepEqual(second, first);
  assert.ok(first.replay.counts.events > first.replay.counts.inputs);
  assert.equal(first.replay.counts.inputs, 3);
  assert.equal(first.saves.length, 2);
});

test('lifecycle sampler keeps natural and forced-GC observations distinct', () => {
  const sample = sampleLifecycle('unit', { corpus: 'neutral-fixture' });
  assert.equal(sample.natural.gcRequested, false);
  assert.equal(sample.forcedGc.gcRequested, true);
  assert.equal(sample.natural.details.corpus, 'neutral-fixture');
  assert.ok(sample.natural.bytes.heapUsed > 0 && sample.forcedGc.bytes.rss > 0);
});