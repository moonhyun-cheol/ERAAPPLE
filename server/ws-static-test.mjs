// Headless verification for S3 (plan §3): the host serves the thin client shell over plain HTTP
// from the SAME origin that speaks WebSocket, refuses path traversal, and the WS engine transport
// keeps working alongside static serving (title still renders over the wire). The browser client's
// DOM/rendering/reconnect behaviour is proven separately with a real browser smoke; here we lock the
// server-side contract that makes a single-origin thin client possible.
//
//   node --test server/ws-static-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../tools/web-engine-probe/dist/engine.mjs';
import { files } from '../tools/web-engine-probe/fixture.mjs';
import { createSaveStore } from './save-store.mjs';
import { createWsServer } from './ws-server.mjs';

const getTime = () => 1700000000000;
const staticDir = fileURLToPath(new URL('./public', import.meta.url));

async function startServer(dir) {
  const server = createWsServer({
    compile, source: files, createStore: () => createSaveStore(dir),
    sessionOptions: { getTime }, staticDir
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, port: server.address().port };
}

test('S3 static: GET / serves the thin client shell', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s3-'));
  const { server, port } = await startServer(dir);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    const body = await res.text();
    assert.match(body, /eraTHYMKR/);
    assert.match(body, /client\.mjs/);
  } finally {
    server.close(); await rm(dir, { recursive: true, force: true });
  }
});

test('S3 static: GET /client.mjs serves the terminal module as JS', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s3-'));
  const { server, port } = await startServer(dir);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/client.mjs`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /javascript/);
    const body = await res.text();
    assert.match(body, /WebSocket/);
    assert.match(body, /waiting-ack/);
  } finally {
    server.close(); await rm(dir, { recursive: true, force: true });
  }
});

test('S3 static: an encoded ../ traversal cannot escape the public root', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s3-'));
  const { server, port } = await startServer(dir);
  try {
    // %2f keeps the ../ segments intact through URL normalization so the traversal actually reaches
    // the server; the containment guard must refuse it rather than leak server/ws-server.mjs.
    const res = await fetch(`http://127.0.0.1:${port}/..%2f..%2fws-server.mjs`);
    assert.ok(res.status === 403 || res.status === 404, `expected 403/404, got ${res.status}`);
    const body = await res.text();
    assert.doesNotMatch(body, /createWsServer/, 'server source must not leak');
  } finally {
    server.close(); await rm(dir, { recursive: true, force: true });
  }
});

test('S3 static: a missing file is 404, not the shell', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s3-'));
  const { server, port } = await startServer(dir);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/nope.txt`);
    assert.equal(res.status, 404);
  } finally {
    server.close(); await rm(dir, { recursive: true, force: true });
  }
});

test('S3 static: WS transport still renders the title alongside static serving', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s3-'));
  const { server, port } = await startServer(dir);
  const rendered = [], waits = [];
  const ws = new WebSocket(`ws://127.0.0.1:${port}/`);
  try {
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'events') { rendered.push(...msg.events); ws.send(JSON.stringify({ type: 'rendered', id: msg.id })); }
      if (msg.type === 'waiting') { waits.push(msg); ws.send(JSON.stringify({ type: 'waiting-ack', id: msg.id })); }
      if (msg.type === 'session' && !msg.resumed) ws.send(JSON.stringify({ type: 'start' }));
    });
    await once(ws, 'open');
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout: first waiting')), 5000);
      const iv = setInterval(() => { if (waits.length) { clearInterval(iv); clearTimeout(timer); resolve(); } }, 20);
    });
    const text = rendered.filter(e => e.type === 'content').map(e => e.children.map(c => c.text).join('')).join('\n');
    assert.match(text, /엔진 시험/);
    assert.ok(waits.length >= 1);
  } finally {
    ws.close(); server.close(); await rm(dir, { recursive: true, force: true });
  }
});
