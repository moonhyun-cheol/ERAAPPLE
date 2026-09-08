import { compile } from '../../.my_agent_remote/undercrow__eraJS/build/index.js';
import { files } from './fixture.mjs';
import { createStore } from './browser-store.mjs';

let vm, generator, waiting = false, busy = false;
function fail(error) {
  waiting = false;
  postMessage({ type: 'error', error: { message: error.message, name: error.name,
    file: error.line?.file ?? null, line: error.line?.line == null ? null : error.line.line + 1,
    trace: error.trace ?? vm?.contextStack.map(c => c.fn.name) ?? [] } });
}
async function advance(value) {
  waiting = false;
  let events = [];
  const flush = () => { if (events.length) postMessage({ type: 'events', events }); events = []; };
  try {
    for (let n = 0; n < 100000; n++) {
      const next = await generator.next(value);
      value = null;
      if (next.done) { flush(); postMessage({ type: 'ended' }); return; }
      const event = next.value;
      if (event.type === 'tinput') throw new Error('Timed input is not supported by this probe host');
      if (['input', 'wait'].includes(event.type)) {
        flush(); waiting = true;
        postMessage({ type: 'waiting', event, stack: vm.contextStack.map(c => c.fn.name) });
        return;
      }
      events.push(event);
      if (events.length >= 128) flush();
    }
    throw new Error('Event budget exceeded; stop and restart the session');
  } catch (error) { flush(); fail(error); }
}
self.onmessage = async ({ data }) => {
  if (busy) return;
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
        setSavedata: async (key, value) => { await store.set(key, value); postMessage({ type: 'saved', key }); },
        getTime: () => Date.now(), getFont: () => false
      });
      await advance(null);
    } else if (data.type === 'input' && waiting) await advance(data.value);
  } catch (error) { fail(error); }
  finally { busy = false; }
};
