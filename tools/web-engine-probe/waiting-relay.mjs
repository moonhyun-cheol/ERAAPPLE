// Reliable delivery of the single `waiting` announcement that re-opens the UI's input path.
//
// Hazard this fixes: output batches are already resend-protected (see batch-channel.mjs), but the
// `waiting` message that follows a flushed batch was posted exactly once. On iOS a throttled or
// backgrounded tab can drop that one message. The batch still renders (it is resent until ACKed),
// so the screen shows the next menu — e.g. the 구입/복장·장비 list — but the controls are never
// re-enabled, and every later tap is ignored. The game "freezes after a few inputs" with no error.
//
// Fix: announce the pending `waiting` repeatedly (same id) until the UI acknowledges it, mirroring
// batch-channel. The UI must treat a repeated id as idempotent (re-ACK, do not re-initialise the
// choice epoch). Cancelled as soon as the input is answered so a stale resend cannot re-open an
// already-answered prompt.
export function createWaitingRelay(post, { timeout = 4000, schedule = setTimeout, unschedule = clearTimeout } = {}) {
  let current = null; // { id, timer }
  function cancel() { if (current) { unschedule(current.timer); current = null; } }
  function announce(payload) {
    cancel();
    const fire = () => { post(payload); if (current) current.timer = schedule(fire, timeout); };
    current = { id: payload.id, timer: null };
    fire();
  }
  function ack(id) {
    if (!current || current.id !== id) return false;
    unschedule(current.timer); current = null;
    return true;
  }
  return { announce, ack, cancel, pendingId: () => current?.id ?? null };
}
