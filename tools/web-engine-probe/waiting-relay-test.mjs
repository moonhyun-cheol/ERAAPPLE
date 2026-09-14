import test from 'node:test';
import assert from 'node:assert/strict';
import { createWaitingRelay } from './waiting-relay.mjs';

// Deterministic clock mirroring batch-channel-test: capture posts and the single armed timer so we
// can simulate iOS dropping the `waiting` announcement (or its ACK) by choosing when it fires.
function harness(timeout = 4000) {
  const posts = [];
  const timers = new Map();
  let seq = 0;
  const relay = createWaitingRelay(m => posts.push(m), {
    timeout,
    schedule: (fn) => { const id = ++seq; timers.set(id, fn); return id; },
    unschedule: (id) => timers.delete(id)
  });
  return {
    relay, posts,
    fireTimers: () => { const fns = [...timers.values()]; timers.clear(); for (const fn of fns) fn(); },
    timerCount: () => timers.size
  };
}

test('announce posts once and arms a resend timer', () => {
  const { relay, posts, timerCount } = harness();
  relay.announce({ type: 'waiting', id: 1, event: { type: 'input' } });
  assert.equal(posts.length, 1);
  assert.equal(posts[0].type, 'waiting');
  assert.equal(posts[0].id, 1);
  assert.equal(relay.pendingId(), 1);
  assert.equal(timerCount(), 1, 'resend timer armed until ACK');
});

test('ACK clears the pending announcement and its resend timer', () => {
  const { relay, posts, timerCount } = harness();
  relay.announce({ type: 'waiting', id: 7 });
  assert.equal(relay.ack(7), true);
  assert.equal(relay.pendingId(), null);
  assert.equal(timerCount(), 0);
  assert.equal(posts.length, 1, 'no resend after ACK');
});

test('lost ACK: waiting is resent with the SAME id until acknowledged', () => {
  const { relay, posts, fireTimers } = harness();
  relay.announce({ type: 'waiting', id: 3, deadline: null });
  fireTimers(); // no ACK -> resend
  fireTimers(); // still none -> resend again
  assert.equal(posts.length, 3, 'resent twice');
  assert.deepEqual(posts.map(m => m.id), [3, 3, 3]);
  assert.equal(relay.ack(3), true);
  fireTimers(); // no live timer -> silence
  assert.equal(posts.length, 3);
});

test('stale/duplicate ACK is ignored; only the pending id clears', () => {
  const { relay } = harness();
  relay.announce({ type: 'waiting', id: 10 });
  assert.equal(relay.ack(9), false, 'unknown id does nothing');
  assert.equal(relay.ack(10), true);
  assert.equal(relay.ack(10), false, 'duplicate ACK after clear is a no-op');
});

test('a new announcement supersedes an unacked one and stops its resend', () => {
  const { relay, posts, fireTimers } = harness();
  relay.announce({ type: 'waiting', id: 1 });
  relay.announce({ type: 'waiting', id: 2 }); // e.g. input answered, next prompt opened
  assert.equal(relay.pendingId(), 2);
  fireTimers(); // only id 2 should resend
  const resent = posts.filter(m => m.id === 1);
  assert.equal(resent.length, 1, 'id 1 posted once, never resent after being superseded');
  assert.ok(posts.some(m => m.id === 2));
});

test('cancel stops all resends (input answered)', () => {
  const { relay, posts, fireTimers, timerCount } = harness();
  relay.announce({ type: 'waiting', id: 5 });
  relay.cancel();
  assert.equal(relay.pendingId(), null);
  assert.equal(timerCount(), 0);
  fireTimers();
  assert.equal(posts.length, 1, 'no resend after cancel');
});
