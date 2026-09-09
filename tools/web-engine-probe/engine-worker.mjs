import { compile } from '../../.my_agent_remote/undercrow__eraJS/build/index.js';
import { files } from './fixture.mjs';
import { createStore } from './browser-store.mjs';
import { createInputGate } from './input-gate.mjs';
import { createProgressBridge } from './runtime-trace.mjs';
const progress = createProgressBridge(message => postMessage(message));

let vm, generator, busy = false, batchId = 0, rendered;
const gate = createInputGate((value, id) => {
  busy = true;
  postMessage({ type: 'running', id });
  advance(value).finally(() => { busy = false; });
});
function fail(error) {
  gate.cancel();
  postMessage({ type: 'error', error: { message: error.message, name: error.name,
    file: error.line?.file ?? null, line: error.line?.line == null ? null : error.line.line + 1,
    trace: error.trace ?? vm?.contextStack.map(c => c.fn.name) ?? [] } });
}
async function advance(value) {
  let events = [];
  const flush = async () => {
    if (!events.length) return;
    const id = ++batchId;
    // At most one output batch in flight. Large day-end output cannot flood iOS's UI queue.
    const ack = new Promise(resolve => { rendered = { id, resolve }; });
    postMessage({ type: 'events', id, events }); events = [];
    await ack;
  };
  try {
    for (let n = 0; n < 100000; n++) {
      const next = await generator.next(value);
      value = null;
      if (next.done) { await flush(); postMessage({ type: 'ended' }); return; }
      const event = next.value;
      if (['input', 'wait', 'tinput'].includes(event.type)) {
        await flush();
        const { id, deadline } = gate.open(event);
        postMessage({ type: 'waiting', id, deadline, event, stack: vm.contextStack.map(c => c.fn.name) });
        return;
      }
      events.push(event);
      if (events.length >= 128) await flush();
    }
    throw new Error('Event budget exceeded; stop and restart the session');
  } catch (error) { await flush(); fail(error); }
}
self.onmessage = async ({ data }) => {
  if (data.type === 'progress-recorded') { progress.acknowledge(data.id); return; }
  if (data.type === 'rendered') {
    if (rendered?.id === data.id) { const { resolve } = rendered; rendered = null; resolve(); }
    return;
  }
  if (busy) return;
  if (data.type === 'input') { gate.accept(data.id, data.value); return; }
  if (data.type === 'resume') { gate.check(); return; }
  busy = true;
  try {
    if (data.type === 'start' && !generator) {
      const game = data.mode === 'game';
      let source = files;
      if (game) {
        const response = await fetch('./local-game.bin');
        if (!response.ok) throw new Error('Local game endpoint: HTTP ' + response.status);
        // Bundle is gzip-compressed NDJSON to cut download, offline cache and SW hashing memory
        // (~61 MiB -> ~11 MiB). Named .bin, served application/octet-stream so no proxy/tunnel
        // applies transport Content-Encoding (which would break the SW's raw-bytes integrity hash).
        // We stream-decode line by line (a header line, then one [key, text] pair per line) so the
        // full ~61 MiB text is never held as a single string nor JSON.parsed in one shot. That
        // duplicate (decompressed buffer + whole UTF-16 string + parsed tree) was the peak that
        // risks iOS Safari Jetsam. DecompressionStream/TextDecoderStream are the same 16.4+ baseline.
        const reader = response.body.pipeThrough(new DecompressionStream('gzip'))
          .pipeThrough(new TextDecoderStream()).getReader();
        source = new Map();
        let buffer = '', header = null;
        for (;;) {
          const { value, done } = await reader.read();
          if (value) buffer += value;
          let nl;
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl); buffer = buffer.slice(nl + 1);
            if (!line) continue;
            if (!header) { header = JSON.parse(line); continue; }
            const entry = JSON.parse(line); source.set(entry[0], entry[1]);
          }
          if (done) break;
        }
        const tail = buffer.trim();
        if (tail) { const entry = JSON.parse(tail); source.set(entry[0], entry[1]); }
        if (!header || source.size !== header.count)
          throw new Error('Local game bundle incomplete: ' + source.size + '/' + (header?.count ?? '?'));
      }
      const store = createStore(game ? 'era-game-eraTHYMKR-erajs-v1' : 'era-engine-probe-v1');
      vm = compile(source);
      source = null; // drop the large source reference so GC can reclaim it during play
      generator = vm.start({
        getSavedata: async key => store.get(key),
        saveProgress: detail => progress.report(detail),
        setSavedata: async (key, value) => {
          await progress.report({ phase: 'writing', key });
          await store.set(key, value);
          await progress.report({ phase: 'committed', key });
          postMessage({ type: 'saved', key });
        },
        getTime: () => Date.now(), getFont: () => false
      });
      await advance(null);
    }
  } catch (error) { fail(error); }
  finally { busy = false; }
};
