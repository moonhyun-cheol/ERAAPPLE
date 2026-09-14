import test from 'node:test';
import assert from 'node:assert/strict';
import { createBatchChannel } from './batch-channel.mjs';

// Deterministic clock: capture posted messages and the single armed timer so we can simulate
// iOS dropping a batch or its ACK by choosing when (or whether) the timer fires.
function harness(timeout = 8000) {
  const posts = [];
  const timers = new Map();
  let seq = 0;
  const channel = createBatchChannel(m => posts.push(m), {
    timeout,
    schedule: (fn) => { const id = ++seq; timers.set(id, fn); return id; },
    unschedule: (id) => timers.delete(id)
  });
  return {
    channel, posts,
    // One-shot semantics: a fired timer is consumed. The channel re-arms a fresh timer
    // inside fire(), so clear the map before invoking to avoid re-firing stale timers.
    fireTimers: () => { const fns = [...timers.values()]; timers.clear(); for (const fn of fns) fn(); },
    timerCount: () => timers.size
  };
}

test('empty batch resolves immediately and posts nothing', async () => {
  const { channel, posts } = harness();
  await channel.send([]);
  assert.equal(posts.length, 0);
  assert.equal(channel.inFlight(), false);
});

test('normal path: one post, ACK resolves and clears the resend timer', async () => {
  const { channel, posts, timerCount } = harness();
  let done = false;
  const p = channel.send([{ type: 'line' }]).then(() => { done = true; });
  assert.equal(posts.length, 1);
  assert.equal(posts[0].type, 'events');
  const id = posts[0].id;
  assert.equal(channel.inFlight(), true);
  assert.equal(timerCount(), 1, 'resend timer armed while awaiting ACK');
  channel.ack(id);
  await p;
  assert.equal(done, true);
  assert.equal(channel.inFlight(), false);
  assert.equal(timerCount(), 0, 'resend timer cleared after ACK');
});

test('lost ACK: batch is resent with the SAME id until acknowledged', async () => {
  const { channel, posts, fireTimers } = harness();
  const p = channel.send([{ type: 'line', text: 'x' }]);
  const id = posts[0].id;
  fireTimers(); // ACK never arrived -> resend
  fireTimers(); // still no ACK -> resend again
  assert.equal(posts.length, 3, 'resent twice');
  assert.deepEqual(posts.map(m => m.id), [id, id, id], 'same id every resend');
  assert.ok(channel.inFlight());
  channel.ack(id);
  await p;
  assert.equal(channel.inFlight(), false);
  fireTimers(); // no live timer -> no further posts
  assert.equal(posts.length, 3);
});

test('stale/duplicate ACK is ignored; only the in-flight id resolves', async () => {
  const { channel, posts } = harness();
  const p = channel.send([{ type: 'line' }]);
  const id = posts[0].id;
  assert.equal(channel.ack(id - 1), false, 'unknown id does nothing');
  assert.equal(channel.ack(id), true);
  await p;
  assert.equal(channel.ack(id), false, 'duplicate ACK after settle is a no-op');
});

test('sequential batches use strictly increasing ids', async () => {
  const { channel, posts } = harness();
  const a = channel.send([{ type: 'line' }]);
  channel.ack(posts[0].id); await a;
  const b = channel.send([{ type: 'line' }]);
  channel.ack(posts[1].id); await b;
  assert.equal(posts[1].id, posts[0].id + 1);
  assert.equal(channel.lastId(), posts[1].id);
});

test('reset clears an in-flight batch and stops resends', async () => {
  const { channel, posts, fireTimers, timerCount } = harness();
  channel.send([{ type: 'line' }]);
  assert.ok(channel.inFlight());
  channel.reset();
  assert.equal(channel.inFlight(), false);
  assert.equal(timerCount(), 0);
  fireTimers();
  assert.equal(posts.length, 1, 'no resend after reset');
});
