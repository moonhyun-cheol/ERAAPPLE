// Minimal, dependency-free RFC 6455 WebSocket framing for the server-authoritative runtime.
// See docs/web-runtime/server-runtime-plan.md §3 (transport framing).
//
// Why hand-rolled instead of the `ws` npm package: the server tree deliberately ships with NO
// dependencies and NO package.json (plan §8 portability, §11 hygiene) so relocating the server is
// a folder copy — never an `npm install`. Node's built-in `WebSocket` covers the *client* side
// (thin device / tests); only the *server* side needs framing, and for single-user JSON control
// messages that surface is small and well understood. This module is pure (no I/O) so it can be
// unit-tested independently of any socket.
import { createHash } from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// The Sec-WebSocket-Accept handshake response value for a given client key (RFC 6455 §4.2.2).
export function acceptKey(clientKey) {
  return createHash('sha1').update(clientKey + GUID).digest('base64');
}

// Encode one server->client frame. Server frames MUST NOT be masked (RFC 6455 §5.1). `data` may be
// a string (encoded UTF-8) or a Buffer (used verbatim, e.g. echoing a ping payload back as pong).
export function encodeFrame(data, opcode = 0x1) {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | opcode; // FIN=1 + opcode
  return Buffer.concat([header, payload]);
}

// Decode as many COMPLETE frames as `buffer` contains and return them plus the unconsumed tail.
// A partial trailing frame (TCP split mid-frame) is left in `rest` for the next call to prepend.
// Client->server frames are always masked; we unmask them here. Fragmentation reassembly (opcode
// continuation) is handled one level up in ws-server so this stays a pure per-frame decoder.
export function decodeFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const b0 = buffer[offset], b1 = buffer[offset + 1];
    const fin = (b0 & 0x80) !== 0;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let p = offset + 2;
    if (len === 126) {
      if (p + 2 > buffer.length) break;
      len = buffer.readUInt16BE(p); p += 2;
    } else if (len === 127) {
      if (p + 8 > buffer.length) break;
      const big = buffer.readBigUInt64BE(p);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('WS frame too large');
      len = Number(big); p += 8;
    }
    let mask;
    if (masked) {
      if (p + 4 > buffer.length) break;
      mask = buffer.subarray(p, p + 4); p += 4;
    }
    if (p + len > buffer.length) break; // frame not fully arrived yet
    let payload = buffer.subarray(p, p + len);
    if (masked) {
      const out = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3];
      payload = out;
    } else {
      payload = Buffer.from(payload); // copy out of the shared buffer before it is reused
    }
    frames.push({ fin, opcode, payload });
    offset = p + len;
  }
  return { frames, rest: buffer.subarray(offset) };
}

export const OPCODE = { CONTINUATION: 0x0, TEXT: 0x1, BINARY: 0x2, CLOSE: 0x8, PING: 0x9, PONG: 0xA };
