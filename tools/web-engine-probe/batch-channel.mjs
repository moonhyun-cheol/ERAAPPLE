// Delivers one output batch at a time to the host UI, releasing the next only after the UI
// acknowledges it rendered. That single-batch-in-flight rule bounds how much output iOS's UI
// queue must hold at once (a deliberate flood guard against Jetsam on large day-end output).
//
// Hazard this fixes: on iOS a backgrounded/throttled tab can drop or stall either the batch
// message or its ACK. A plain unbounded `await ack` then waits forever, and the worker's busy
// gate silently ignores every later input — so the game "freezes" after a few taps with no
// error. Fix: an unacknowledged batch is RESENT with the SAME id on an interval until the ACK
// arrives. It is never skipped, so the flood guard still holds. The UI must treat a repeated id
// as idempotent (re-ACK without re-rendering) so a lost ACK cannot duplicate output.
export function createBatchChannel(post, { timeout = 8000, schedule = setTimeout, unschedule = clearTimeout } = {}) {
  let nextId = 0, current = null;
  function ack(id) {
    if (!current || current.id !== id) return false;
    const settled = current; current = null;
    unschedule(settled.timer); settled.resolve();
    return true;
  }
  function send(events) {
    if (!events || !events.length) return Promise.resolve();
    const id = ++nextId;
    return new Promise(resolve => {
      const fire = () => { post({ type: 'events', id, events }); if (current) current.timer = schedule(fire, timeout); };
      current = { id, resolve, timer: null };
      fire();
    });
  }
  function reset() { if (current) { unschedule(current.timer); current = null; } }
  return { send, ack, reset, inFlight: () => Boolean(current), lastId: () => nextId };
}
