import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { gzipSync, gunzipSync } from 'node:zlib';
import { inventory } from './inventory.mjs';

const pwa = process.env.PROBE_PWA === '1';
const browserEngine = process.env.PROBE_BROWSER_ENGINE ?? 'chromium';
const offlineMode = process.env.PROBE_OFFLINE_MODE ?? 'browser-offline';
const quiet = process.env.PROBE_QUIET === '1';
test(`actual game ${pwa ? 'PWA offline' : 'browser'}: title, setup and compatibility boundary`, { timeout: 170000 }, async () => {
  const before = await inventory();
  const server = spawn(process.execPath, [fileURLToPath(new URL(pwa ? './serve-pwa.mjs' : './serve.mjs', import.meta.url))], {
    env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let browser, page;
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server timeout')), 5000);
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', code => { clearTimeout(timer); reject(new Error('server exit ' + code)); });
      server.stdout.on('data', data => {
        const match = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timer); resolve(match[0]); }
      });
    });
    const channel = process.env.PROBE_BROWSER_CHANNEL;
    browser = await (browserEngine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(channel && browserEngine !== 'webkit' ? { channel } : {}) });
    const context = await browser.newContext(pwa ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {});
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [], externalRequests = [], steps = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!request.url().startsWith(url + '/')) externalRequests.push(request.url()); });
    await page.goto(url + (pwa ? '/iphone-test/' : '/'));
    if (pwa) {
      await page.locator('#pwa-help summary').click();
      await page.locator('#offline-prepare').click();
      await page.waitForFunction(() => document.querySelector('#pwa-status').textContent.startsWith('오프라인 준비됨'), { }, { timeout: 60000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '390px shell fits viewport');
    }
    const snapshot = async input => {
      await page.waitForFunction(() => /입력 대기|실패|종료/.test(document.querySelector('#status').textContent));
      const state = await page.evaluate(() => ({
        status: document.querySelector('#status').textContent,
        stack: JSON.parse(document.querySelector('#status').dataset.stack || '[]'),
        output: document.querySelector('#output').innerText.slice(-6000),
        error: document.querySelector('#error').textContent,
        saved: document.querySelector('#saved').textContent,
        buttons: [...document.querySelectorAll('#output button:not(:disabled)')].map(b => ({ text: b.textContent, value: b.dataset.value }))
      }));
      steps.push({ input, ...state });
      if (!quiet) console.log(JSON.stringify({ input, status: state.status, stack: state.stack, tail: state.output.slice(-200), error: state.error }));
      return state;
    };
    await page.locator('#game-start').click();
    let state = await snapshot(null);
    assert.match(state.output, /힘세고 강한 시작/);
    for (let n = 0; n < 25 && state.status === '입력 대기' && !state.buttons.some(b => b.value === '200'); n++) {
      const value = state.buttons[0]?.value ?? (state.output.trimEnd().endsWith('(5자까지)') ? '웹시험' : '0');
      if (state.buttons.length) await page.locator('#output button:not(:disabled)').first().click();
      else { await page.locator('#input').fill(value); await page.locator('#submit').click(); }
      state = await snapshot(value);
    }
    assert.ok(state.buttons.some(b => b.value === '200'), 'setup reaches shop');
    const enter = async value => {
      await page.locator('#input').fill(value); await page.locator('#submit').click();
      state = await snapshot(value);
    };
    await enter('102');
    for (let n = 0; n < 10 && state.status === '입력 대기' && !state.buttons.some(b => b.value === '200'); n++) await enter('0');
    assert.ok(state.buttons.some(b => b.value === '200'), 'rest returns to shop');
    await enter('200');
    await enter('0');
    assert.match(state.saved, /save00.sav/);
    // All destructive backup tests use this fresh, disposable browser context only.
    await page.locator('#backup-help summary').click();
    assert.equal(await page.locator('#backup-export').isDisabled(), true, 'backup blocked during game execution');
    const other = await context.newPage();
    await other.goto(url + (pwa ? '/iphone-test/' : '/'));
    await other.locator('#backup-help summary').click();
    await other.locator('#backup-export').click();
    await other.waitForFunction(() => document.querySelector('#backup-status').textContent.includes('다른 탭'));
    await other.close();
    await page.locator('#runtime-help summary').click();
    await page.locator('#stop').click();
    await page.locator('#backup-export').click();
    await page.waitForFunction(() => /^(백업 준비됨|실패:)/.test(document.querySelector('#backup-status').textContent));
    assert.match(await page.locator('#backup-status').textContent(), /^백업 준비됨/);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#backup-download').click();
    const download = await downloadEvent;
    const backupBytes = await readFile(await download.path());
    const backupObject = JSON.parse(gunzipSync(backupBytes).toString());
    assert.ok(backupObject.payload.entries.some(([key]) => key === 'save00.sav'));
    const savedEntries = async () => page.evaluate(() => new Promise((resolve, reject) => {
      const open = indexedDB.open('era-game-eraTHYMKR-erajs-v1', 1);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction('saves', 'readonly'), store = tx.objectStore('saves');
        const keys = store.getAllKeys(), values = store.getAll();
        tx.oncomplete = async () => {
          db.close();
          const hashes = await Promise.all(values.result.map(async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('')));
          resolve(keys.result.map((key, i) => [key, hashes[i]]));
        };
        tx.onabort = () => { db.close(); reject(tx.error); };
      };
    }));
    const original = await savedEntries();
    const choose = async buffer => page.locator('#backup-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer });
    for (const invalid of [Buffer.from('{broken'), gzipSync(Buffer.from(JSON.stringify({ ...backupObject, sha256: '0'.repeat(64) }))),
      gzipSync(Buffer.from(JSON.stringify({ ...backupObject, payload: { ...backupObject.payload, game: 'another-game' } })))]) {
      await choose(invalid); await page.locator('#backup-restore').click();
      await page.waitForFunction(() => document.querySelector('#backup-status').textContent.startsWith('실패:'));
      assert.deepEqual(await savedEntries(), original, 'invalid backup preserves saves');
    }
    await choose(backupBytes);
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#backup-restore').click();
    await page.waitForFunction(() => document.querySelector('#backup-status').textContent.startsWith('복원 취소'));
    assert.deepEqual(await savedEntries(), original, 'cancel preserves saves');
    await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('era-game-eraTHYMKR-erajs-v1');
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('test database deletion blocked'));
    }));
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#backup-restore').click();
    await page.waitForFunction(() => document.querySelector('#backup-status').textContent.startsWith('복원 완료'));
    assert.deepEqual(await savedEntries(), original, 'file restores every entry after database deletion');
    if (pwa) {
      if (offlineMode === 'server-stop') {
        const closed = once(server, 'exit'); server.kill(); await closed;
        await assert.rejects(context.request.get(url), 'origin server is actually stopped');
      } else await context.setOffline(true);
    }
    await page.reload();
    await page.locator('#game-start').click();
    state = await snapshot('reload');
    await enter('1');
    await enter('0');
    for (let n = 0; n < 10 && state.status === '입력 대기' && !state.buttons.some(b => b.value === '200'); n++) await enter('0');
    assert.match(state.output, /웹시험\(주인\)/, 'saved Korean player name is restored');
    assert.match(state.output, /일요일\(밤\)/, 'post-rest state is restored');
    assert.ok(state.buttons.some(b => b.value === '200'), 'loaded game returns to playable shop');
    assert.equal(state.error, '');
    if (pwa) {
      await enter('102');
      for (let n = 0; n < 10 && !state.buttons.some(b => b.value === '200'); n++) await enter('0');
      assert.ok(state.buttons.some(b => b.value === '200'), 'offline restored game accepts more input');
      await enter('200'); await enter('1');
      assert.match(state.saved, /save01.sav/, 'can save another slot offline');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'game output fits mobile viewport');
    }
    if (!quiet) console.log('RESTORE RESULT', JSON.stringify(state));
    const after = await inventory();
    assert.equal(after.originalDigest, before.originalDigest);
    assert.deepEqual(errors, []);
    assert.deepEqual(externalRequests, []);
    const report = { browser: browser.version(), actualGameTestedInBrowser: true, actualGameSaveReloadPassed: true,
      restoredPlayer: '웹시험', restoredTime: '밤', iPhoneTested: false, browserEngine,
      offlineMode: pwa ? offlineMode : null,
      staticPwa: pwa, offlineReloadRestoreAndInputPassed: pwa, offlineAdditionalSavePassed: pwa,
      p0Passed: false, originalUnchanged: true, originalDigest: after.originalDigest,
      saveBackup: { compressedBytes: backupBytes.length, entries: backupObject.payload.entries.map(([key]) => key), invalidAndCancelPreservePassed: true, crossTabLockPassed: true, databaseDeletedThenRestored: true },
      steps, pageErrors: errors, externalRequests };
    await writeFile(new URL(pwa ? `./results/pwa-game-${browserEngine}-${offlineMode}.json` : './results/game-browser.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
    if (!pwa) await writeFile(new URL(`./results/game-browser-${browserEngine}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
    await context.close();
  } finally {
    if (browser) await browser.close();
    if (server.exitCode == null && server.signalCode == null) { const closed = once(server, 'exit'); server.kill(); await closed; }
  }
});
