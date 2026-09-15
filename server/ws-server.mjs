// S1 Layer B: WebSocket transport for the server-authoritative runtime.
// See docs/web-runtime/server-runtime-plan.md §3 (transport framing) and §4/§7 (single-user token).
//
// This is the transport SHELL only. It does NOT touch engine semantics: it frames the session
// core's `post(message)` outputs as WS text frames and feeds decoded client frames straight into
// `session.handle(message)` — a 1:1 mapping (plan §3), so the exact same message shapes verified
// in Layer A travel over the wire with nothing invented. One session is created per connection and
// disposed on close so resend timers never leak.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { acceptKey, encodeFrame, decodeFrames, OPCODE } from './ws-frame.mjs';
import { createEngineSession } from './engine-session.mjs';

// Wrap a raw TCP socket (already upgraded) as a tiny text-message channel. Emits 'message' (string)
// and 'close'; `send(string)` writes a server text frame. Handles ping->pong and fragmentation.
function wrapSocket(socket) {
  const conn = new EventEmitter();
  let buffer = Buffer.alloc(0);
  let frag = null; // { chunks: [] } while a fragmented text message is being reassembled
  let closed = false;

  const shutdown = () => {
    if (closed) return;
    closed = true;
    conn.emit('close');
  };

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    let decoded;
    try {
      decoded = decodeFrames(buffer);
    } catch {
      socket.destroy(); shutdown(); return;
    }
    buffer = decoded.rest;
    for (const frame of decoded.frames) {
      if (frame.opcode === OPCODE.CLOSE) { try { socket.end(encodeFrame(Buffer.alloc(0), OPCODE.CLOSE)); } catch {} shutdown(); return; }
      if (frame.opcode === OPCODE.PING) { try { socket.write(encodeFrame(frame.payload, OPCODE.PONG)); } catch {} continue; }
      if (frame.opcode === OPCODE.PONG) continue;
      if (frame.opcode === OPCODE.TEXT || frame.opcode === OPCODE.CONTINUATION) {
        if (frame.opcode === OPCODE.TEXT) frag = { chunks: [] };
        if (!frag) continue; // continuation with no start; ignore defensively
        frag.chunks.push(frame.payload);
        if (frame.fin) {
          const text = Buffer.concat(frag.chunks).toString('utf8');
          frag = null;
          conn.emit('message', text);
        }
      }
    }
  });
  socket.on('close', shutdown);
  socket.on('error', () => { socket.destroy(); shutdown(); });

  conn.send = text => { if (!closed) { try { socket.write(encodeFrame(text, OPCODE.TEXT)); } catch {} } };
  conn.close = () => { if (!closed) { try { socket.end(encodeFrame(Buffer.alloc(0), OPCODE.CLOSE)); } catch {} } };
  return conn;
}

// Create an HTTP server whose only job is the WebSocket upgrade.
//
// S1 Layer B bound one session to one connection and disposed it on close. S2 (plan §2, session
// lifecycle) decouples the two: the engine session lives in a registry keyed by a client-supplied
// id, and a socket drop only DETACHES the transport. Within a grace window the same client can
// reconnect with its id, rebind to the still-live in-memory VM, and `resume` to re-sync the pending
// `waiting` — so a phone locking/backgrounding no longer restarts the game (the original freeze).
//
//   compile             : function(source) -> vm            (engine compiler)
//   source              : decoded game source (Map)
//   createStore         : function() -> { get,set,close,... }  per-session save store
//   config.token        : single-user access token (plan §4/§7); null = local-only
//   config.sessionTtlMs : grace window before a detached session is disposed (default 30s)
//   onSession           : optional (session, conn, { id, resumed }) => void  test/inspection hook
export function createWsServer({ compile, source, createStore, config = {}, onSession, sessionOptions = {} } = {}) {
  if (typeof compile !== 'function') throw new Error('createWsServer requires compile');
  if (typeof createStore !== 'function') throw new Error('createWsServer requires createStore');
  const token = config.token ?? null;
  const ttl = config.sessionTtlMs ?? 30000;

  // id -> { id, session, store, holder:{conn}, graceTimer }. The holder is the swappable transport:
  // the session posts through holder.conn, so rebinding a reconnect is just replacing that socket
  // (no engine-side change — the same `post` closure keeps working across sockets).
  const registry = new Map();

  function disposeEntry(entry) {
    if (entry.graceTimer) { clearTimeout(entry.graceTimer); entry.graceTimer = null; }
    registry.delete(entry.id);
    entry.session.dispose();
    Promise.resolve(entry.store.close?.()).catch(() => {});
  }

  function createEntry(id) {
    const holder = { conn: null };
    const store = createStore();
    const session = createEngineSession({
      compile, source, store,
      // post(message) -> current socket. Detached (holder.conn === null) posts are dropped; the
      // waiting-relay/batch-channel resend timers keep the pending state so a reconnect re-syncs.
      post: message => { if (holder.conn) holder.conn.send(JSON.stringify(message)); },
      ...sessionOptions
    });
    const entry = { id, session, store, holder, graceTimer: null };
    registry.set(id, entry);
    return entry;
  }

  const server = http.createServer((req, res) => {
    // Plain HTTP has no role here; the thin client connects only via WS upgrade.
    res.writeHead(426, { 'Content-Type': 'text/plain; charset=utf-8', Upgrade: 'websocket' });
    res.end('This endpoint speaks WebSocket only.');
  });

  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    const upgrade = String(req.headers['upgrade'] || '').toLowerCase();
    if (upgrade !== 'websocket' || !key) { socket.destroy(); return; }

    let params;
    try { params = new URL(req.url, 'http://localhost').searchParams; } catch { params = new URLSearchParams(); }

    // Single-user token gate (plan §4/§7). Enforced before the handshake so an unauthorized client
    // never reaches the engine. Local-only deployments leave token null and skip this.
    if (token && params.get('token') !== token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); socket.destroy(); return;
    }

    socket.write([
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey(key)}`,
      '\r\n'
    ].join('\r\n'));

    const conn = wrapSocket(socket);

    // Session resolution (plan §2). A reconnect carries ?session=<id>; if that session is still
    // alive in the registry we rebind to it (resumed=true), otherwise we mint a fresh one under the
    // requested-or-generated id. `resumed` tells the thin client whether to `resume` or `start`.
    const wantId = params.get('session');
    let entry, resumed;
    if (wantId && registry.has(wantId)) {
      entry = registry.get(wantId);
      resumed = true;
      if (entry.graceTimer) { clearTimeout(entry.graceTimer); entry.graceTimer = null; }
      // Single user: if a stale socket is somehow still attached, drop it and take over.
      if (entry.holder.conn && entry.holder.conn !== conn) { try { entry.holder.conn.close(); } catch {} }
    } else {
      entry = createEntry(wantId || randomUUID());
      resumed = false;
    }
    entry.holder.conn = conn;

    // Transport-level hello so the client learns its id and whether to resume or start. This is a
    // session-management message, not an engine event — the engine's message shapes are untouched.
    conn.send(JSON.stringify({ type: 'session', id: entry.id, resumed }));

    conn.on('message', text => {
      let message;
      try { message = JSON.parse(text); } catch { return; } // ignore non-JSON garbage frames
      entry.session.handle(message);
    });

    conn.on('close', () => {
      // Only the currently-attached socket may detach the session (a superseded stale socket must not).
      if (entry.holder.conn !== conn) return;
      entry.holder.conn = null;
      // Grace window: keep the in-memory VM alive so a quick reconnect resumes instead of restarting.
      // unref so a pending timer never keeps the process (or a test run) alive on its own.
      entry.graceTimer = setTimeout(() => { if (!entry.holder.conn) disposeEntry(entry); }, ttl);
      entry.graceTimer.unref?.();
    });

    onSession?.(entry.session, conn, { id: entry.id, resumed });
  });

  // On shutdown, tear down every live session (and cancel its grace timer) so no resend timer or
  // store handle leaks past the server.
  server.on('close', () => { for (const entry of [...registry.values()]) disposeEntry(entry); });

  return server;
}
