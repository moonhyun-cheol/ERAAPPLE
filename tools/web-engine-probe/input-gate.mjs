// Exactly one completion per input request, even after background throttling or a late click.
// Timeout returns null: the engine, not the host, owns TINPUT's default value.
export function createInputGate(resume, { now = Date.now, schedule = setTimeout, unschedule = clearTimeout } = {}) {
  let sequence = 0, pending = null, timer;
  function cancel() { unschedule(timer); timer = undefined; pending = null; }
  function finish(value) {
    const request = pending;
    if (!request) return false;
    cancel();
    resume(value, request.id);
    return true;
  }
  function check() {
    if (pending?.deadline == null) return;
    const remaining = pending.deadline - now();
    if (remaining <= 0) finish(null);
    else { unschedule(timer); timer = schedule(check, Math.min(remaining, 2147483647)); }
  }
  return {
    open(event) {
      cancel();
      const timeout = event.type === 'tinput' ? Number(event.timeout) : null;
      if (timeout != null && (!Number.isFinite(timeout) || timeout < 0)) throw new Error('Invalid timed-input duration');
      pending = { id: ++sequence, event, deadline: timeout == null ? null : now() + timeout };
      // Queue even a zero timeout so the waiting message is always sent first.
      if (timeout != null) timer = schedule(check, Math.min(timeout, 2147483647));
      return pending;
    },
    accept(id, value) {
      if (!pending || pending.id !== id || typeof value !== 'string') return false;
      if (pending.deadline != null && now() >= pending.deadline) return finish(null);
      const { event } = pending;
      if (event.type !== 'wait' && event.numeric && (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) return false;
      return finish(event.type === 'wait' ? '' : value);
    },
    check, cancel
  };
}
