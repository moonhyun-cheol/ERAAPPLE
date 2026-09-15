// Transport-agnostic engine session for the server-authoritative runtime (S1 Layer A).
// See docs/web-runtime/server-runtime-plan.md §1–§3.
//
// This is engine-worker.mjs's generator loop + reliability modules, lifted out of the browser
// Worker so it runs in a plain Node process. It is a PORT, not a rewrite (plan §1): the same
// input-gate / batch-channel / waiting-relay modules are reused verbatim, and the exact
// postMessage message shapes are preserved so the WS transport (later layer) can frame them 1:1
// without inventing new semantics (plan §3).
//
// Differences from the Worker version, all mechanical:
//   - `postMessage`/`self.onmessage` become an injected `post(message)` callback and a `handle(message)`
//     method — the transport (WS, in-process test, SSE) is the caller's concern.
//   - `store` is injected (server file store instead of IndexedDB), same { get, set } interface.
//   - `fetch`/DecompressionStream game-bundle loading is NOT here: the server already holds the
//     game source locally (plan §10-4), so callers pass a decoded `source` (Map) directly.
//   - the runtime-trace progress bridge is omitted for the PoC; setSavedata still posts `saved`.
import { createInputGate } from '../tools/web-engine-probe/input-gate.mjs';
import { createBatchChannel } from '../tools/web-engine-probe/batch-channel.mjs';
import { createWaitingRelay } from '../tools/web-engine-probe/waiting-relay.mjs';

export function createEngineSession({
  compile, source, store, post,
  getTime = Date.now, getFont = () => false,
  schedule, unschedule, budget = 100000, seed
} = {}) {
  if (typeof compile !== 'function') throw new Error('createEngineSession requires a compile function');
  if (typeof post !== 'function') throw new Error('createEngineSession requires a post callback');
  if (!store || typeof store.get !== 'function' || typeof store.set !== 'function')
    throw new Error('createEngineSession requires a store with get/set');

  const timers = schedule ? { schedule, unschedule } : {};
  const channel = createBatchChannel(post, timers);
  // The `waiting` handoff is resend-protected: a single dropped announcement otherwise leaves the
  // rendered menu permanently un-clickable (the original iOS "freeze after a few taps"). Same fix.
  const waitingRelay = createWaitingRelay(post, timers);

  let vm, generator, busy = false, active = Promise.resolve();

  const gate = createInputGate((value, id) => {
    busy = true;
    waitingRelay.cancel(); // this request is now answered; stop re-announcing it
    post({ type: 'running', id });
    active = advance(value).finally(() => { busy = false; });
  }, timers);

  function fail(error) {
    gate.cancel();
    waitingRelay.cancel();
    channel.reset();
    post({ type: 'error', error: {
      message: error.message, name: error.name,
      file: error.line?.file ?? null,
      line: error.line?.line == null ? null : error.line.line + 1,
      trace: error.trace ?? vm?.contextStack.map(c => c.fn.name) ?? []
    } });
  }

  // Re-announce the request the engine is still waiting on, so a dropped/rejected input (stale id,
  // reconnect, timeout) can never leave the client's controls permanently disabled (plan §3).
  function resyncWaiting() {
    const pending = gate.peek();
    if (pending) waitingRelay.announce({
      type: 'waiting', id: pending.id, deadline: pending.deadline,
      event: pending.event, stack: vm?.contextStack.map(c => c.fn.name) ?? []
    });
  }

  async function advance(value) {
    let events = [];
    const flush = async () => {
      if (!events.length) return;
      const batch = events; events = [];
      // At most one output batch in flight; resent (never skipped) if the render ACK is lost.
      await channel.send(batch);
    };
    try {
      for (let n = 0; n < budget; n++) {
        const next = await generator.next(value);
        value = null;
        if (next.done) { await flush(); waitingRelay.cancel(); post({ type: 'ended' }); return; }
        const event = next.value;
        if (['input', 'wait', 'tinput'].includes(event.type)) {
          await flush();
          const { id, deadline } = gate.open(event);
          waitingRelay.announce({ type: 'waiting', id, deadline, event, stack: vm.contextStack.map(c => c.fn.name) });
          return;
        }
        events.push(event);
        if (events.length >= 128) await flush();
      }
      throw new Error('Event budget exceeded; stop and restart the session');
    } catch (error) { await flush(); fail(error); }
  }

  async function begin() {
    if (generator) return;
    vm = compile(source);
    // Deterministic-replay hook (plan §6, S1): when a seed is supplied, pin the RNG so a scripted
    // run is byte-reproducible for output/save-hash comparison against the direct probe loop.
    // Production omits `seed` entirely, so the real (time/entropy-seeded) RNG is untouched.
    if (seed != null && vm.random) vm.random.state = seed;
    generator = vm.start({
      getSavedata: async key => store.get(key),
      setSavedata: async (key, value) => {
        await store.set(key, value); // never post `saved` before the write actually commits
        post({ type: 'saved', key });
      },
      getTime, getFont
    });
    active = advance(null);
    await active;
  }

  // Mirrors engine-worker.mjs `self.onmessage`. Control messages (ack/resume) are handled even
  // while busy; state-advancing messages (start/input) are gated.
  async function handle(message) {
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'rendered') { channel.ack(message.id); return; }
    if (message.type === 'waiting-ack') { waitingRelay.ack(message.id); return; }
    // A reconnect / foreground wake: re-check a timed deadline and re-emit the pending `waiting`.
    if (message.type === 'resume') { gate.check(); resyncWaiting(); return; }
    if (busy) return;
    if (message.type === 'input') { if (!gate.accept(message.id, message.value)) resyncWaiting(); return; }
    if (message.type === 'start') {
      busy = true;
      try { await begin(); } catch (error) { fail(error); } finally { busy = false; }
    }
  }

  return {
    handle,
    // Resolves when no engine advance is in flight — lets a transport/test await settlement.
    settled: () => active,
    pendingWaitingId: () => waitingRelay.pendingId(),
    peekPending: () => gate.peek(),
    // Stop all resend timers (call when the connection/session is torn down).
    dispose() { gate.cancel(); waitingRelay.cancel(); channel.reset(); }
  };
}
