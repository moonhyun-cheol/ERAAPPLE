import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium, webkit } from 'playwright';
import { encodeBackup, decodeBackup, packBackup, unpackBackup, MAX_BACKUP_BYTES } from './save-backup.mjs';

const slot = JSON.stringify({ code: 890016222, version: 3210, data: { comment: '한글', characters: [{ NAME: '웹시험' }], variables: { MONEY: '42' } } });
const global = JSON.stringify({ code: 890016222, version: 3210, data: { GLOBAL: ['77'], GLOBALS: ['한글'] } });
const entries = [['save00.sav', slot], ['global.sav', global]];
test('backup codec: hash, schema, identity, duplicate/path keys and gzip corruption', async () => {
  const text = await encodeBackup(entries);
  assert.deepEqual((await decodeBackup(text)).entries, entries);
  assert.deepEqual((await unpackBackup(await packBackup(entries))).entries, entries);
  await assert.rejects(decodeBackup('{broken'));
  const parsed = JSON.parse(text);
  await assert.rejects(decodeBackup(JSON.stringify({ ...parsed, schema: 2 })));
  await assert.rejects(decodeBackup(JSON.stringify({ ...parsed, sha256: '0'.repeat(64) })));
  await assert.rejects(decodeBackup(JSON.stringify({ ...parsed, payload: { ...parsed.payload, engine: 'other' } })));
  await assert.rejects(encodeBackup([]));
  await assert.rejects(encodeBackup([entries[0], entries[0]]));
  await assert.rejects(encodeBackup([['../save00.sav', slot]]));
  await assert.rejects(encodeBackup([['save00.sav', slot.replace('890016222', '1')]]));
  await assert.rejects(encodeBackup([['save00.sav', slot.replace('3210', '3211')]]));
  await assert.rejects(encodeBackup([['global.sav', slot]]));
  await assert.rejects(unpackBackup({ size: MAX_BACKUP_BYTES + 1 }));
  await assert.rejects(unpackBackup(new Blob([new Uint8Array([31, 139, 0, 0, 0])])));
});

test('IndexedDB: consistent snapshot, full replacement, sync/async rollback and cross-tab lock', { timeout: 60000 }, async () => {
  const bundled = await build({ stdin: { contents: "export * from './browser-store.mjs'; export * from './save-backup.mjs';", resolveDir: fileURLToPath(new URL('.', import.meta.url)) }, bundle: true, format: 'esm', write: false });
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/api.js' ? 'text/javascript' : 'text/html');
    res.end(req.url === '/api.js' ? bundled.outputFiles[0].text : '<!doctype html><title>Isolated backup test</title>');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const engine = process.env.PROBE_BROWSER_ENGINE ?? 'chromium';
  let browser;
  try {
    browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine !== 'webkit' && process.env.PROBE_BROWSER_CHANNEL ? { channel: process.env.PROBE_BROWSER_CHANNEL } : {}) });
    const context = await browser.newContext();
    const page = await context.newPage(), other = await context.newPage();
    const url = `http://127.0.0.1:${server.address().port}`;
    await page.goto(url); await other.goto(url);
    const result = await page.evaluate(async entries => {
      const { createStore, encodeBackup, decodeBackup, packBackup, unpackBackup } = await import('/api.js');
      const store = createStore('isolated-backup-unit');
      const expect = (condition, message) => { if (!condition) throw new Error(message); };
      await store.set('obsolete.sav', 'old');
      await store.replaceAll(entries);
      const baseline = JSON.stringify(await store.entries());
      expect((await store.get('obsolete.sav')) === undefined, 'full replacement removes old files');
      try { await store.replaceAll([['new', 'ok'], [null, 'invalid key']]); throw new Error('should reject invalid key'); }
      catch (error) { expect(error.name === 'DataError', 'sync transaction failure detected'); }
      expect(JSON.stringify(await store.entries()) === baseline, 'sync abort rolls back clear and puts');
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        const request = put.apply(this, args);
        request.addEventListener('success', () => this.transaction.abort());
        return request;
      };
      let rejected = false;
      try { await store.replaceAll([['new', 'value']]); } catch { rejected = true; }
      finally { IDBObjectStore.prototype.put = put; }
      expect(rejected, 'asynchronous abort detected');
      expect(JSON.stringify(await store.entries()) === baseline, 'async abort preserves all original data');
      const file = await packBackup(entries);
      expect(JSON.stringify((await unpackBackup(file)).entries) === JSON.stringify(entries), 'browser gzip round trip');
      expect(JSON.stringify((await decodeBackup(await encodeBackup(entries))).entries) === JSON.stringify(entries), 'browser hash round trip');
      await store.close();
      return { syncRollback: true, asyncRollback: true, fullReplacement: true, gzip: true };
    }, entries);
    await page.evaluate(async () => {
      const { withSaveLock } = await import('/api.js');
      window.held = false;
      window.lockTask = withSaveLock(() => new Promise(resolve => { window.releaseLock = resolve; window.held = true; }));
    });
    await page.waitForFunction(() => window.held);
    assert.match(await other.evaluate(async () => {
      const { withSaveLock } = await import('/api.js');
      try { await withSaveLock(() => true); return 'incorrectly accepted'; } catch (error) { return error.message; }
    }), /다른 탭/);
    await page.evaluate(async () => { window.releaseLock(); await window.lockTask; });
    assert.equal(await other.evaluate(async () => (await import('/api.js')).withSaveLock(() => 'released')), 'released');
    await writeFile(new URL(`./results/backup-unit-${engine}.json`, import.meta.url), JSON.stringify({ passed: true, engine, ...result, crossTabLock: true }, null, 2) + '\n');
    await context.close();
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
