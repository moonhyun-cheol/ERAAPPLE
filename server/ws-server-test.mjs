// Headless verification for S1 Layer B (plan §3 transport framing).
// Proves the engine session core runs UNCHANGED behind a real WebSocket transport: the same
// title/save-reload/resume scenarios from Layer A now travel over actual RFC 6455 frames, driven
// by Node's built-in WebSocket client acting as the thin device (it ACKs every render batch and
// every `waiting`, exactly as the browser client must). No `ws` dependency, no package.json.
//
//   node --test server/ws-server-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { compile } from '../tools/web-engine-probe/dist/engine.mjs';
import { files } from '../tools/web-engine-probe/fixture.mjs';
import { createSaveStore } from './save-store.mjs';
import { createWsServer } from './ws-server.mjs';
import { encodeFrame, decodeFrames, acceptKey } from './ws-frame.mjs';

const getTime = () => 1700000000000; // same fixed clock as the Layer A test

// ---- pure frame codec -----------------------------------------------------------------------

// Build a client->server (masked) text frame by hand, the way a browser/undici client would.
function maskClientFrame(text, opcode = 0x1) {
  const payload = Buffer.from(text, 'utf8');
  const mask = Buffer.from([0x12, 0x34, 0x56, 0x78]);
  const body = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) body[i] = payload[i] ^ mask[i & 3];
  const len = payload.length;
  let header;
  if (len < 126) { header = Buffer.alloc(2); header[1] = 0x80 | len; }
  else if (len < 65536) { header = Buffer.alloc(4); header[1] = 0x80 | 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(len), 2); }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, mask, body]);
}

test('ws-frame: decodes masked client frames across the length boundaries', () => {
  const small = 'hi';
  const medium = 'x'.repeat(200);   // exercises the 126 / 16-bit length path
  const buf = Buffer.concat([maskClientFrame(small), maskClientFrame(medium)]);
  const { frames, rest } = decodeFrames(buf);
  assert.equal(frames.length, 2);
  assert.equal(frames[0].payload.toString('utf8'), small);
  assert.equal(frames[1].payload.toString('utf8'), medium);
  assert.equal(rest.length, 0);
});

test('ws-frame: a frame split across two chunks is buffered until complete', () => {
  const whole = maskClientFrame('{"type":"start"}');
  const cut = 4;
  let pass1 = decodeFrames(whole.subarray(0, cut));
  assert.equal(pass1.frames.length, 0, 'no complete frame yet');
  const joined = Buffer.concat([pass1.rest, whole.subarray(cut)]);
  const pass2 = decodeFrames(joined);
  assert.equal(pass2.frames.length, 1);
  assert.deepEqual(JSON.parse(pass2.frames[0].payload.toString('utf8')), { type: 'start' });
});

test('ws-frame: server frames are unmasked with a correct length header', () => {
  const frame = encodeFrame('abc');
  assert.equal(frame[0], 0x81);          // FIN + text
  assert.equal(frame[1] & 0x80, 0);      // MASK bit clear (server never masks)
  assert.equal(frame[1] & 0x7f, 3);
  assert.equal(frame.subarray(2).toString('utf8'), 'abc');
});

test('ws-frame: acceptKey matches the RFC 6455 §1.3 worked example', () => {
  // The canonical example key/response pair from the spec.
  assert.equal(acceptKey('dGhlIHNhbXBsZSBub25jZQ=='), 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
});

// ---- end-to-end over a real WebSocket -------------------------------------------------------

async function startServer(dir) {
  const server = createWsServer({
    compile, source: files, createStore: () => createSaveStore(dir),
    sessionOptions: { getTime }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, port: server.address().port };
}

// A thin WS client that mirrors the browser device: ACK every batch + waiting, collect output.
function connect(port) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/`);
  const rendered = [], waits = [], saved = [];
  let ended = false, error = null, pending = null;
  const waiters = [];

  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    switch (msg.type) {
      case 'events':
        rendered.push(...msg.events);
        ws.send(JSON.stringify({ type: 'rendered', id: msg.id }));
        break;
      case 'waiting':
        waits.push(msg);
        pending = { id: msg.id, event: msg.event };
        ws.send(JSON.stringify({ type: 'waiting-ack', id: msg.id }));
        break;
      case 'saved': saved.push(msg.key); break;
      case 'ended': ended = true; break;
      case 'error': error = msg.error; break;
    }
    for (const w of waiters.splice(0)) w();
  });

  function until(pred, label = 'condition') {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout: ' + label)), 5000);
      const attempt = () => { if (pred()) { clearTimeout(timer); resolve(); } else waiters.push(attempt); };
      attempt();
    });
  }
  const text = () => rendered.filter(e => e.type === 'content')
    .map(e => e.children.map(c => c.text).join('')).join('\n');

  return {
    ws,
    opened: once(ws, 'open'),
    until,
    text,
    waits, saved,
    isEnded: () => ended,
    getError: () => error,
    peek: () => pending,
    async answer(value) {
      const before = waits.length;
      ws.send(JSON.stringify({ type: 'input', id: pending.id, value }));
      await until(() => waits.length > before || ended || error, `response to ${value}`);
    },
    async start() {
      ws.send(JSON.stringify({ type: 'start' }));
      await until(() => waits.length >= 1 || ended || error, 'first waiting');
    },
    close: () => ws.close()
  };
}

test('S1 Layer B: title renders and an input wait arrives over WS', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s1b-'));
  const { server, port } = await startServer(dir);
  const c = connect(port);
  try {
    await c.opened;
    await c.start();
    assert.match(c.text(), /엔진 시험/);
    assert.ok(c.waits.length >= 1, 'a waiting was announced over the wire');
    assert.equal(c.getError(), null);
  } finally {
    c.close(); server.close(); await rm(dir, { recursive: true, force: true });
  }
});

test('S1 Layer B: play->SAVEDATA writes files, a fresh WS connection reloads them', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s1b-'));
  const { server, port } = await startServer(dir);
  try {
    const a = connect(port);
    await a.opened;
    await a.start();
    await a.answer('0');            // [0] 새 시험
    await a.answer('42');           // 정수
    await a.answer('hangul test');  // 문자
    await a.until(() => a.isEnded() || a.getError(), 'session A end');
    assert.equal(a.getError(), null);
    assert.match(a.text(), /SAVED/);
    assert.deepEqual([...a.saved].sort(), ['global.sav', 'save00.sav']);
    a.close();

    const onDisk = (await readdir(dir)).filter(n => n.endsWith('.json')).sort();
    assert.deepEqual(onDisk, ['global.sav.json', 'save00.sav.json']);

    // A brand-new WS connection (new session + new store over the same folder) loads the save.
    const b = connect(port);
    await b.opened;
    await b.start();
    await b.answer('1');            // [1] 저장 불러오기
    await b.until(() => b.isEnded() || b.getError(), 'session B end');
    assert.equal(b.getError(), null);
    assert.match(b.text(), /RESTORED:42:hangul test:77/);
    b.close();
  } finally {
    server.close(); await rm(dir, { recursive: true, force: true });
  }
});

test('S1 Layer B: resume re-announces the pending waiting over WS (dropped-input recovery, §3)', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s1b-'));
  const { server, port } = await startServer(dir);
  const c = connect(port);
  try {
    await c.opened;
    await c.start();
    const before = c.waits.length;
    const pendingId = c.peek().id;
    c.ws.send(JSON.stringify({ type: 'resume' }));
    await c.until(() => c.waits.length > before, 'resume re-announcement');
    assert.equal(c.waits.at(-1).id, pendingId, 'the re-emitted waiting keeps the same request id');
  } finally {
    c.close(); server.close(); await rm(dir, { recursive: true, force: true });
  }
});
