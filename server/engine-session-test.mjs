// Headless verification for S1 Layer A (plan §6 S1 completion criterion, in-process transport).
// Proves the ported session core + file save store run in plain Node with the SAME reliability
// semantics as the browser Worker, using the neutral fixture (no original game text).
//
//   node --test server/engine-session-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { compile } from '../tools/web-engine-probe/dist/engine.mjs';
import { files } from '../tools/web-engine-probe/fixture.mjs';
import { createEngineSession } from './engine-session.mjs';
import { createSaveStore } from './save-store.mjs';

// Fixed clock so the fixture behaves deterministically (matches fixture.externalFor).
const getTime = () => 1700000000000;

// An in-process transport that mirrors what the WS client will do: ACK every render batch and
// every `waiting` announcement immediately, and record output / lifecycle messages. Resend timers
// are disabled (no-op schedulers) because each message is acknowledged synchronously here.
function connect(store) {
  const rendered = [];   // flat list of engine events actually delivered
  const waits = [];      // every `waiting` announcement (including resent duplicates)
  const saved = [];      // keys the engine committed
  const running = [];
  let ended = false, error = null, session;

  function post(message) {
    switch (message.type) {
      case 'events': rendered.push(...message.events); session.handle({ type: 'rendered', id: message.id }); break;
      case 'waiting': waits.push(message); session.handle({ type: 'waiting-ack', id: message.id }); break;
      case 'running': running.push(message.id); break;
      case 'saved': saved.push(message.key); break;
      case 'ended': ended = true; break;
      case 'error': error = message.error; break;
    }
  }

  session = createEngineSession({
    compile, source: files, store, post, getTime,
    schedule: () => 0, unschedule: () => {}
  });

  const text = () => rendered.filter(e => e.type === 'content')
    .map(e => e.children.map(c => c.text).join('')).join('\n');

  return { session, rendered, waits, saved, running, text, isEnded: () => ended, getError: () => error };
}

async function startAndSettle(conn) {
  await conn.session.handle({ type: 'start' });
  await conn.session.settled();
}
async function send(conn, value) {
  const pending = conn.session.peekPending();
  assert.ok(pending, 'expected the engine to be waiting for input');
  await conn.session.handle({ type: 'input', id: pending.id, value });
  await conn.session.settled();
}

test('S1: title renders and the engine reaches an input wait', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s1-'));
  const conn = connect(createSaveStore(dir));
  try {
    await startAndSettle(conn);
    assert.match(conn.text(), /엔진 시험/);           // title batch was delivered + ACKed
    assert.ok(conn.waits.length >= 1, 'a waiting was announced');
    assert.ok(conn.session.peekPending(), 'input gate is open');
    assert.equal(conn.getError(), null);
    conn.session.dispose();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('S1: playing to SAVEDATA writes save files, then a fresh session reloads them', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s1-'));
  try {
    // Session A: new game -> integer -> string -> engine saves GLOBAL + slot, then QUIT.
    const store = createSaveStore(dir);
    const a = connect(store);
    await startAndSettle(a);
    await send(a, '0');              // [0] 새 시험
    await send(a, '42');             // 정수
    await send(a, 'hangul test');    // 문자 (INPUTS)
    assert.ok(a.isEnded(), 'session A ran to QUIT');
    assert.match(a.text(), /SAVED/);
    assert.deepEqual([...a.saved].sort(), ['global.sav', 'save00.sav']);
    assert.equal(a.getError(), null);

    // Files actually landed on disk (not just in memory).
    const onDisk = (await readdir(dir)).filter(n => n.endsWith('.json')).sort();
    assert.deepEqual(onDisk, ['global.sav.json', 'save00.sav.json']);
    const slot = JSON.parse(await readFile(path.join(dir, 'save00.sav.json'), 'utf8'));
    assert.equal(typeof slot, 'string'); // engine persists plain-string saves

    // Session B: a brand-new session over the SAME file store loads the save.
    const b = connect(createSaveStore(dir));
    await startAndSettle(b);
    await send(b, '1');              // [1] 저장 불러오기
    assert.ok(b.isEnded(), 'session B ran to QUIT after load');
    assert.match(b.text(), /RESTORED:42:hangul test:77/);
    assert.equal(b.getError(), null);
    a.session.dispose(); b.session.dispose();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('S1: resume re-announces the pending waiting (dropped-input recovery, plan §3)', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-s1-'));
  try {
    const conn = connect(createSaveStore(dir));
    await startAndSettle(conn);
    const before = conn.waits.length;
    const pendingId = conn.session.peekPending().id;
    // Simulate a foreground wake / reconnect while the input is still unanswered.
    await conn.session.handle({ type: 'resume' });
    assert.ok(conn.waits.length > before, 'resume re-emitted a waiting announcement');
    assert.equal(conn.waits.at(-1).id, pendingId, 'the re-emitted waiting keeps the same request id');
    conn.session.dispose();
  } finally { await rm(dir, { recursive: true, force: true }); }
});
