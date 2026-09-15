// S1 Layer B: WebSocket transport for the server-authoritative runtime.
// See docs/web-runtime/server-runtime-plan.md §3 (transport framing) and §4/§7 (single-user token).
//
// This is the transport SHELL only. It does NOT touch engine semantics: it frames the session
// core's `post(message)` outputs as WS text frames and feeds decoded client frames straight into
// `session.handle(message)` — a 1:1 mapping (plan §3), so the exact same message shapes verified
// in Layer A travel over the wire with nothing invented. One session is created per connection and
// disposed on close so resend timers never leak.
import http from 'node:http';
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

// Create an HTTP server whose only job is the WebSocket upgrade. Each accepted connection gets its
// own engine session bound to a freshly created store.
//
//   compile     : function(source) -> vm            (engine compiler)
//   source      : decoded game source (Map)         (fixture for the PoC; real game later, §10-4)
//   createStore : function() -> { get,set,close,... }  per-connection save store
//   config      : { token }                         single-user access token (plan §4/§7); null = local-only
//   onSession   : optional (session, conn) => void  test/inspection hook
export function createWsServer({ compile, source, createStore, config = {}, onSession, sessionOptions = {} } = {}) {
  if (typeof compile !== 'function') throw new Error('createWsServer requires compile');
  if (typeof createStore !== 'function') throw new Error('createWsServer requires createStore');
  const token = config.token ?? null;

  const server = http.createServer((req, res) => {
    // Plain HTTP has no role here; the thin client connects only via WS upgrade.
    res.writeHead(426, { 'Content-Type': 'text/plain; charset=utf-8', Upgrade: 'websocket' });
    res.end('This endpoint speaks WebSocket only.');
  });

  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    const upgrade = String(req.headers['upgrade'] || '').toLowerCase();
    if (upgrade !== 'websocket' || !key) { socket.destroy(); return; }

    // Single-user token gate (plan §4/§7). Enforced before the handshake so an unauthorized client
    // never reaches the engine. Local-only deployments leave token null and skip this.
    if (token) {
      let provided = null;
      try { provided = new URL(req.url, 'http://localhost').searchParams.get('token'); } catch {}
      if (provided !== token) { socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
    }

    socket.write([
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey(key)}`,
      '\r\n'
    ].join('\r\n'));

    const conn = wrapSocket(socket);
    const store = createStore();
    // post(message) -> WS text frame. This is the whole Layer B contract: frame what Layer A emits.
    const session = createEngineSession({
      compile, source, store,
      post: message => conn.send(JSON.stringify(message)),
      ...sessionOptions
    });
    conn.on('message', text => {
      let message;
      try { message = JSON.parse(text); } catch { return; } // ignore non-JSON garbage frames
      session.handle(message);
    });
    conn.on('close', () => { session.dispose(); Promise.resolve(store.close?.()).catch(() => {}); });
    onSession?.(session, conn);
  });

  return server;
}
