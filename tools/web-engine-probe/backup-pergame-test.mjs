import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, DEFAULT_TARGET } from './save-backup.mjs';

// Two games with distinct identities. eramaou128: empty code -> 0, version 920 (from GAMEBASE.CSV).
const thymkr = DEFAULT_TARGET; // { code: 890016222, version: 3210, db: era-game-eraTHYMKR-erajs-v1 }
const maou = { id: 'eramaou128', game: 'eramaou128', db: 'era-game-eramaou128-erajs-v1', code: 0, version: 920 };

const slot = (code, version) => JSON.stringify({ code, version, data: { comment: '한글', characters: [{ NAME: '웹시험' }], variables: { MONEY: '42' } } });
const global = (code, version) => JSON.stringify({ code, version, data: { GLOBAL: ['77'], GLOBALS: ['한글'] } });
const entriesFor = t => [['save00.sav', slot(t.code, t.version)], ['global.sav', global(t.code, t.version)]];

test('per-game backup: each game round-trips, DB namespaces differ', async () => {
  const a = createBackup(thymkr), b = createBackup(maou);
  assert.equal(a.GAME_DB, 'era-game-eraTHYMKR-erajs-v1');
  assert.equal(b.GAME_DB, 'era-game-eramaou128-erajs-v1');
  assert.notEqual(a.GAME_DB, b.GAME_DB);
  assert.notEqual(a.SAVE_LOCK, b.SAVE_LOCK);
  // Each encodes and decodes its own saves.
  assert.deepEqual((await a.decodeBackup(await a.encodeBackup(entriesFor(thymkr)))).entries, entriesFor(thymkr));
  assert.deepEqual((await b.decodeBackup(await b.encodeBackup(entriesFor(maou)))).entries, entriesFor(maou));
});

test('per-game backup: cross-game restore is rejected (saves never mix)', async () => {
  const a = createBackup(thymkr), b = createBackup(maou);
  // A backup produced for eramaou128 must not decode/validate under eraTHYMKR identity, and vice versa.
  const maouBackup = await b.encodeBackup(entriesFor(maou));
  await assert.rejects(a.decodeBackup(maouBackup), /다른 게임/);
  const thymkrBackup = await a.encodeBackup(entriesFor(thymkr));
  await assert.rejects(b.decodeBackup(thymkrBackup), /다른 게임/);
  // Slot payloads with the wrong game's code/version are rejected at encode time too.
  await assert.rejects(b.encodeBackup(entriesFor(thymkr)), /다른 게임 또는/);
});

test('default export stays bound to eraTHYMKR (backward compatible)', async () => {
  const { encodeBackup, decodeBackup, GAME_DB } = await import('./save-backup.mjs');
  assert.equal(GAME_DB, 'era-game-eraTHYMKR-erajs-v1');
  assert.deepEqual((await decodeBackup(await encodeBackup(entriesFor(thymkr)))).entries, entriesFor(thymkr));
});
