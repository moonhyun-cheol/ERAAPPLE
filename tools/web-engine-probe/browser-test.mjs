import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

test('browser fixture: Korean input, slot and GLOBAL survive page reload', { timeout: 45000 }, async () => {
  const server = spawn(process.execPath, [fileURLToPath(new URL('./serve.mjs', import.meta.url))], {
    env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let browser;
  let page;
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server start timeout')), 5000);
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', code => { clearTimeout(timer); reject(new Error('server exited: ' + code)); });
      server.stdout.on('data', bytes => {
        const match = bytes.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timer); resolve(match[0]); }
      });
    });
    const channel = process.env.PROBE_BROWSER_CHANNEL;
    browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    const externalRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!request.url().startsWith(url + '/')) externalRequests.push(request.url()); });
    await page.goto(url);
    const submit = async value => {
      await page.waitForFunction(() => document.querySelector('#status').textContent === '입력 대기' && !document.querySelector('#submit').disabled);
      await page.locator('#input').fill(value);
      await page.locator('#submit').click();
    };
    await page.locator('#fixture-help summary').click();
    await page.locator('#start').click();
    await submit('0');
    await submit('42');
    await submit('브라우저 한글');
    await page.waitForFunction(() => document.querySelector('#status').textContent === '시험 종료');
    assert.match(await page.locator('#output').innerText(), /SAVED/);
    const keys = await page.evaluate(() => new Promise((resolve, reject) => {
      const open = indexedDB.open('era-engine-probe-v1', 1);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('saves', 'readonly');
        const request = tx.objectStore('saves').getAllKeys();
        tx.oncomplete = () => { db.close(); resolve(request.result); };
        tx.onabort = () => { db.close(); reject(tx.error); };
      };
    }));
    assert.equal(keys.length, 2);
    await page.reload();
    await page.locator('#fixture-help summary').click();
    await page.locator('#start').click();
    await submit('1');
    await page.waitForFunction(() => document.querySelector('#status').textContent === '시험 종료');
    const restored = await page.locator('#output').innerText();
    assert.match(restored, /RESTORED:42:브라우저 한글:77/);
    assert.deepEqual(errors, []);
    assert.deepEqual(externalRequests, []);
    for (const path of ['/ERB/SYS/TITLE.ERB', '/emuera.config', '/.my_agent_remote/']) {
      assert.equal((await context.request.get(url + path)).status(), 404);
    }
    const report = { passed: true, browser: browser.version(), channel: channel ?? 'chromium',
      iPhoneTested: false, actualGameTestedInBrowser: false, fixtureOnly: true,
      storage: 'IndexedDB, isolated browser context; not production SaveService',
      reloaded: true, restored, storageKeys: keys, pageErrors: errors, externalRequests,
      originalFileRoutesRejected: true };
    await writeFile(new URL('./results/browser.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
    await context.close();
  } catch (error) {
    if (page) console.error('Browser failure DOM:', await page.locator('body').innerText().catch(() => 'unavailable'));
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server.exitCode == null) { const closed = once(server, 'exit'); server.kill(); await closed; }
  }
});
