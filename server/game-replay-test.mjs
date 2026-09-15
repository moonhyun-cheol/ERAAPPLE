// S1 completion check (plan §6): the ported server session core must produce the SAME output and
// the SAME on-disk save state as a direct probe-style vm.start() loop, when replaying an identical
// scripted input sequence on the REAL game ('에라마왕 개조판 1.28') — not just the neutral fixture.
//
// This is the "Node 프로브와 동일 출력/저장 해시" acceptance: with a pinned RNG seed and fixed clock,
//   A = drive the engine generator directly (reference), and
//   B = drive it through createEngineSession's transport-agnostic post()/handle() gate,
// then assert their delivered non-input event streams hash-equal and their save stores hash-equal.
// Equality proves the port (batching, input-gate, waiting-relay, file store) altered no engine
// semantics on real content.
//
// The real game folder is not part of the tracked inventory and may be absent on another machine,
// so the whole suite skips cleanly when it is missing (portability, plan §8).
//
//   node --test server/game-replay-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { compile } from '../tools/web-engine-probe/dist/engine.mjs';
import { createEngineSession } from './engine-session.mjs';
import { createSaveStore } from './save-store.mjs';
import { loadGameSource } from './game-source.mjs';

// Repo-relative default; overridable so a relocated checkout / different game can point elsewhere.
const gameDir = process.env.ERA_REPLAY_GAME_DIR?.trim()
  || fileURLToPath(new URL('../에라마왕 개조판 1.28', import.meta.url));

const SEED = 0x51ed;                     // any fixed value; both A and B use it -> reproducible RNG
const getTime = () => 1700000000000;     // fixed clock (matches the compile probe)
const getFont = () => false;

// A blind fixed script can't reach a real save: char-creation branches on the (seeded) RNG and
// interleaves free `wait` prompts, so a hard-coded array desyncs. Instead we drive run A with the
// SAME content-adaptive heuristic the save probe uses (eramaou128-save-probe.mjs): title -> NEW
// GAME -> setup -> SHOP. Entering the SHOP runs the game's built-in autosave (SAVEDATA 99), which
// materializes the full 1.28 saveData to `save99.sav` — the exact save path we need to exercise so
// the save-hash comparison is non-trivial. Run A RECORDS the exact input string it fed at each
// prompt (including '' for waits); run B then REPLAYS that recorded sequence 1:1 through the session
// gate. Identical inputs on identical content must yield identical output AND identical on-disk save.
const NAME = 'ㅅㅎ';
const AVOID = /LOAD|불러|HELP|도움|설명|돌아가|이전\s*페이지|다음\s*페이지/i;
const NEWGAME = /NEW\s*GAME|새\s*게임|강한\s*시작|처음부터/i;
const CONFIRM = /결정|確定|확정|이대로|완료|결정하기|시작하기|決定/;

// Decide the next input from the visible text since the last prompt. `sawShop` latches once the
// shop menu (option 200) appears so the caller can stop right after the autosave commits.
function makeDecider() {
  const fnVisits = new Map();
  const state = { sawShop: false };
  state.decide = (kind, buffer, topFn) => {
    if (kind === 'wait') return '';
    if (/이름|명칭/.test(buffer) && /\(\s*5|자까지|５자/.test(buffer)) return NAME;
    const pairs = [...buffer.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
    const seen = new Map();
    for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
    const uniq = [...seen.entries()].map(([n, label]) => ({ n, label }));
    if (uniq.some(o => o.n === 200)) state.sawShop = true;    // shop menu reached (autosave already ran)
    if (state.sawShop) return '0';
    const newgame = uniq.find(o => NEWGAME.test(o.label));
    if (newgame) return String(newgame.n);
    const confirm = uniq.find(o => CONFIRM.test(o.label));
    if (confirm) return String(confirm.n);
    // Escape era edit/regenerate loops that re-display until a high 'decide' option is chosen.
    const visits = (fnVisits.get(topFn) ?? 0) + 1; fnVisits.set(topFn, visits);
    if (visits > 3 && uniq.length) return String(uniq.reduce((a, o) => o.n > a.n ? o : a).n);
    const good = uniq.find(o => !AVOID.test(o.label));
    if (good) return String(good.n);
    if (uniq.length) return String(uniq[0].n);
    return '0';
  };
  return state;
}

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const eventText = events => events
  .filter(e => e.type === 'content')
  .map(e => (e.children ?? []).map(c => c.text ?? '').join(''))
  .join('\n');

async function saveHash(store) {
  const entries = (await store.entries()).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return { hash: hash(entries), keys: entries.map(e => e[0]) };
}

// A — reference: drive the generator directly with the adaptive decider, collecting non-input
// (rendered) events and RECORDING the exact input fed at each prompt. Stops once the shop menu is
// reached (its autosave `save99.sav` has committed by then), leaving that final prompt unanswered
// — exactly where run B will also stop.
async function runDirect(source, store) {
  const vm = compile(source);
  vm.random.state = SEED;
  const generator = vm.start({
    getSavedata: key => store.get(key),
    setSavedata: async (key, value) => { await store.set(key, value); },
    getTime, getFont
  });
  const decider = makeDecider();
  const events = [];
  const inputs = [];                 // the recorded sequence B will replay 1:1
  let input = null, ended = false, reachedShop = false, buffer = '';
  for (let n = 0; n < 500000; n++) {
    const next = await generator.next(input);
    input = null;
    if (next.done) { ended = true; break; }
    const event = next.value;
    if (['input', 'wait', 'tinput'].includes(event.type)) {
      const topFn = vm.contextStack?.map(c => c?.fn?.name).filter(Boolean).slice(-1)[0] ?? '?';
      const choice = decider.decide(event.type, buffer, topFn);
      if (decider.sawShop) { await generator.return(); reachedShop = true; break; }
      inputs.push(choice);
      buffer = '';
      input = choice;
      if (inputs.length > 4000) { await generator.return(); break; } // safety; shop is ~26 prompts in
      continue;
    }
    if (event.type === 'content') buffer += (event.children ?? []).map(c => c.text ?? '').join('');
    events.push(event);
  }
  return { events, ended, inputs, reachedShop };
}

// B — session core over an in-process transport that ACKs every batch/waiting immediately, exactly
// like the WS client will. This is the same connect() pattern as engine-session-test.mjs, with the
// real source + seed injected.
function connect(store, source) {
  const rendered = [];
  let ended = false, error = null, session;
  function post(message) {
    switch (message.type) {
      case 'events': rendered.push(...message.events); session.handle({ type: 'rendered', id: message.id }); break;
      case 'waiting': session.handle({ type: 'waiting-ack', id: message.id }); break;
      case 'ended': ended = true; break;
      case 'error': error = message.error; break;
    }
  }
  session = createEngineSession({
    compile, source, store, post, getTime, getFont, seed: SEED,
    schedule: () => 0, unschedule: () => {}
  });
  return { session, rendered, isEnded: () => ended, getError: () => error };
}

async function runSession(source, store, script) {
  const conn = connect(store, source);
  await conn.session.handle({ type: 'start' });
  await conn.session.settled();
  for (const value of script) {
    const pending = conn.session.peekPending();
    if (!pending) break; // engine already ended
    await conn.session.handle({ type: 'input', id: pending.id, value });
    await conn.session.settled();
  }
  conn.session.dispose();
  assert.equal(conn.getError(), null, 'session run produced no engine error');
  return { events: conn.rendered, ended: conn.isEnded() };
}

let available = true;
try { await access(path.join(gameDir, 'ERB')); } catch { available = false; }

test('S1 replay: session core matches a direct vm loop on the real game (output + save hash)',
  { skip: available ? false : `real game folder not present at ${gameDir}` },
  async () => {
    // Load the real source ONCE and share it; compile() must not mutate its input, which this very
    // comparison also implicitly checks (both sides compile from the same Map).
    const { files, counts, totalBytes } = await loadGameSource(gameDir);
    assert.ok(files.size > 100, `loaded a substantial source tree (${files.size} files)`);
    assert.ok(counts['.ERB'] > 0 && counts['.CSV'] > 0, 'both ERB and CSV trees loaded');

    const dirA = await mkdtemp(path.join(tmpdir(), 'era-replayA-'));
    const dirB = await mkdtemp(path.join(tmpdir(), 'era-replayB-'));
    try {
      const storeA = createSaveStore(dirA);
      const storeB = createSaveStore(dirB);

      // A drives adaptively to the shop autosave and records the exact inputs; B replays them 1:1.
      const A = await runDirect(files, storeA);
      const B = await runSession(files, storeB, A.inputs);

      // Sanity: the run actually reached the shop autosave over real content.
      assert.ok(A.reachedShop, 'direct run reached the shop menu (autosave trigger)');
      assert.ok(A.events.length > 50, `direct run produced events (${A.events.length})`);
      assert.ok(A.inputs.length > 10, `recorded a real setup->shop input sequence (${A.inputs.length})`);
      assert.match(eventText(B.events), /NEW GAME/, 'title screen was rendered in the session run');

      // Core equivalence: identical delivered output and identical lifecycle.
      assert.equal(B.events.length, A.events.length, 'same number of delivered events');
      assert.equal(B.ended, A.ended, 'same ended/settled state');
      assert.equal(hash(B.events), hash(A.events), 'delivered output event streams are hash-identical');

      // Save-state equivalence — now NON-TRIVIAL: the shop autosave wrote a real save99.sav on both
      // sides, and the two independently-produced stores must agree byte-for-byte.
      const sa = await saveHash(storeA);
      const sb = await saveHash(storeB);
      assert.ok(sa.keys.includes('save99.sav'), `real autosave was persisted (keys: ${sa.keys.join(',')})`);
      const save99A = await storeA.get('save99.sav');
      assert.ok(typeof save99A === 'string' && save99A.length > 1000,
        `save99.sav is a substantial payload (${save99A?.length ?? 0} chars)`);
      assert.deepEqual(sb.keys, sa.keys, 'same save keys written');
      assert.equal(sb.hash, sa.hash, 'save stores are hash-identical');

      console.log(JSON.stringify({
        files: files.size, counts, totalSourceBytes: totalBytes,
        events: A.events.length, ended: A.ended, inputs: A.inputs.length, reachedShop: A.reachedShop,
        outputHash: hash(A.events), saveKeys: sa.keys, save99Chars: save99A.length, saveHash: sa.hash
      }));
    } finally {
      await rm(dirA, { recursive: true, force: true });
      await rm(dirB, { recursive: true, force: true });
    }
  });
