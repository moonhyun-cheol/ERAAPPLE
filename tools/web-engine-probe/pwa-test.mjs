import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { chromium, webkit } from 'playwright';
import { createStaticServer } from './serve-pwa.mjs';
import { inventory, sha } from './inventory.mjs';

async function poll(page, predicate, arg) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await page.evaluate(predicate, arg)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Async service-worker state poll timed out');
}

test('PWA: subpath, atomic install, failed update, waiting update, eviction repair, offline cold start', { timeout: 170000 }, async () => {
  const original = await inventory();
  const temp = await mkdtemp(path.join(tmpdir(), 'era-pwa-'));
  const directory = pathToFileURL(temp + path.sep);
  let browser, server;
  const browserEngine = process.env.PROBE_BROWSER_ENGINE ?? 'chromium';
  const offlineMode = process.env.PROBE_OFFLINE_MODE ?? 'browser-offline';
  assert.ok(['browser-offline', 'server-stop'].includes(offlineMode));
  const errors = [], externalRequests = [];
  try {
    await cp(new URL('./pwa-dist/', import.meta.url), temp, { recursive: true });
    const report = JSON.parse(await readFile(new URL('pwa-build.json', directory), 'utf8'));
    assert.equal(report.originalDigest, original.originalDigest);
    for (const [name, hash] of Object.entries(report.assets)) assert.equal(sha(await readFile(new URL(name, directory))), hash, name);
    const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', directory), 'utf8'));
    assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './'); assert.equal(manifest.display, 'standalone');
    for (const size of [180, 192, 512]) {
      const bytes = await readFile(new URL(`icon-${size}.png`, directory));
      assert.equal(bytes.readUInt32BE(16), size); assert.equal(bytes.readUInt32BE(20), size);
    }
    server = createStaticServer(directory, '/nested/era/');
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const port = server.address().port;
    const origin = `http://127.0.0.1:${port}`;
    const url = origin + '/nested/era/';
    const channel = process.env.PROBE_BROWSER_CHANNEL;
    browser = await (browserEngine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(channel && browserEngine !== 'webkit' ? { channel } : {}) });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    // A distinct offline mechanism, not a workaround silently relabelled as setOffline.
    const offline = async enabled => {
      if (offlineMode === 'browser-offline') return context.setOffline(enabled);
      if (enabled) {
        const closed = new Promise(resolve => server.close(resolve));
        server.closeAllConnections(); await closed;
        await assert.rejects(context.request.get(url, { timeout: 3000 }), 'origin is actually stopped');
      } else {
        server.listen(port, '127.0.0.1'); await once(server, 'listening');
        assert.equal((await context.request.get(url)).status(), 200);
      }
    };
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    page.on('pageerror', e => errors.push(e.message));
    context.on('request', r => { if (!r.url().startsWith(origin + '/')) externalRequests.push(r.url()); });
    await page.goto(url);
    await page.locator('#pwa-help summary').click();
    const sw = await readFile(new URL('sw.js', directory), 'utf8');
    const workerBytes = await readFile(new URL('engine-worker.js', directory));
    // A 200 response with corrupt bytes must fail installation, not just HTTP errors.
    await writeFile(new URL('engine-worker.js', directory), '// corrupt deployment');
    await page.locator('#offline-prepare').click();
    await page.waitForFunction(() => /준비 실패/.test(document.querySelector('#pwa-status').textContent));
    assert.deepEqual(await page.evaluate(() => caches.keys()), [], 'failed first install deletes partial version');
    assert.equal(await page.evaluate(() => !!navigator.serviceWorker.controller), false);
    await writeFile(new URL('engine-worker.js', directory), workerBytes);
    await page.locator('#offline-prepare').click();
    await page.waitForFunction(() => document.querySelector('#pwa-status').textContent.startsWith('오프라인 준비됨'));
    const oldCache = (await page.evaluate(() => caches.keys()))[0];
    assert.ok(oldCache.endsWith(report.release));
    // Keep an unrelated application's cache untouched across activation/cleanup.
    await page.evaluate(async () => { await caches.open('unrelated-app-cache'); });
    await offline(true);
    await page.reload();
    await page.locator('#fixture-help summary').click(); await page.locator('#start').click();
    const enter = async value => {
      await page.waitForFunction(() => document.querySelector('#status').textContent === '입력 대기');
      await page.locator('#input').fill(value); await page.locator('#submit').click();
    };
    await enter('0'); await enter('42');
    await page.waitForFunction(() => document.querySelector('#status').textContent === '입력 대기');
    await page.locator('#input').fill('PWA한글');
    await page.evaluate(() => {
      document.querySelector('#input').dispatchEvent(new CompositionEvent('compositionstart'));
      document.querySelector('form').requestSubmit();
    });
    assert.equal(await page.locator('#status').textContent(), '입력 대기', 'IME composition cannot prematurely submit');
    assert.equal(await page.locator('#input').inputValue(), 'PWA한글');
    await page.evaluate(() => document.querySelector('#input').dispatchEvent(new CompositionEvent('compositionend')));
    await enter('PWA한글');
    await page.waitForFunction(() => document.querySelector('#status').textContent === '시험 종료');
    await page.reload();
    await page.locator('#fixture-help summary').click(); await page.locator('#start').click(); await enter('1');
    await page.waitForFunction(() => document.querySelector('#status').textContent === '시험 종료');
    assert.match(await page.locator('#output').innerText(), /RESTORED:42:PWA한글:77/);
    // Missing entry is reported; only matching current-version bytes may repair it.
    await offline(false);
    await page.evaluate(async key => { await (await caches.open(key)).delete(new URL('icon-192.png', location.href).href); }, oldCache);
    await page.reload();
    await page.waitForFunction(() => /누락/.test(document.querySelector('#pwa-status').textContent));
    await page.locator('#pwa-help summary').click(); await page.locator('#offline-prepare').click();
    await page.waitForFunction(() => document.querySelector('#pwa-status').textContent.startsWith('오프라인 준비됨'));
    // New SW with a deliberately broken asset cannot replace the active version.
    const nextRelease = report.release + '-test-update';
    await writeFile(new URL('sw.js', directory), sw.replace(JSON.stringify(report.release), JSON.stringify(nextRelease)));
    await writeFile(new URL('engine-worker.js', directory), '// broken update');
    await page.locator('#offline-prepare').click();
    await page.waitForFunction(() => /준비 실패/.test(document.querySelector('#pwa-status').textContent));
    assert.deepEqual((await page.evaluate(() => caches.keys())).sort(), [oldCache, 'unrelated-app-cache'].sort());
    await offline(true); await page.reload();
    assert.match(await page.locator('h1').innerText(), /웹 실행 시험/);
    await offline(false);
    await writeFile(new URL('engine-worker.js', directory), workerBytes);
    await page.locator('#pwa-help summary').click(); await page.locator('#offline-prepare').click();
    await poll(page, async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
    assert.equal(await page.evaluate(async () => new Promise(resolve => {
      const c = new MessageChannel(); c.port1.onmessage = e => { c.port1.close(); resolve(e.data.release); };
      navigator.serviceWorker.controller.postMessage({ type: 'offline-status' }, [c.port2]);
    })), report.release, 'running client remains on old release');
    assert.equal((await page.evaluate(() => caches.keys())).length, 3);
    await page.close();
    const fresh = await context.newPage();
    fresh.on('pageerror', e => errors.push(e.message));
    // A test-only same-origin document outside the app scope can observe activation.
    await fresh.route(origin + '/not-an-app', route => route.fulfill({ contentType: 'text/html', body: '<title>Activation observer</title>' }));
    await fresh.goto(origin + '/not-an-app'); // no controlled client: allow pending activation
    await poll(fresh, async ({ expected, oldCache }) => {
      const r = await navigator.serviceWorker.getRegistration('/nested/era/');
      const keys = await caches.keys();
      if (r?.active?.state !== 'activated' || r.waiting || r.installing || keys.includes(oldCache)) return false;
      return new Promise(resolve => {
        const c = new MessageChannel();
        c.port1.onmessage = e => { c.port1.close(); resolve(e.data.release === expected); };
        r.active.postMessage({ type: 'offline-status' }, [c.port2]);
      });
    }, { expected: nextRelease, oldCache });
    await offline(true); await fresh.goto(url);
    await fresh.waitForFunction(() => document.querySelector('#pwa-status').textContent.startsWith('오프라인 준비됨'));

    assert.match(await fresh.locator('#pwa-status').textContent(), new RegExp(nextRelease));
    assert.deepEqual((await fresh.evaluate(() => caches.keys())).sort(), [oldCache.replace(report.release, nextRelease), 'unrelated-app-cache'].sort());
    await fresh.locator('#fixture-help summary').click(); await fresh.locator('#start').click();
    await fresh.waitForFunction(() => document.querySelector('#status').textContent === '입력 대기');
    await fresh.locator('#input').fill('1'); await fresh.locator('#submit').click();
    await fresh.waitForFunction(() => document.querySelector('#status').textContent === '시험 종료');
    assert.match(await fresh.locator('#output').innerText(), /RESTORED:42:PWA한글:77/, 'update preserves IndexedDB');
    assert.equal(await fresh.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await offline(false);
    for (const suffix of ['../../ERB/SYS/TITLE.ERB', '.my_agent_remote/', 'emuera.config']) assert.equal((await context.request.get(url + suffix)).status(), 404);
    assert.equal((await context.request.get(url, { headers: { Origin: 'https://example.invalid' } })).status(), 403);
    assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
    assert.equal((await inventory()).originalDigest, original.originalDigest);
    const result = { passed: true, browserEngine, offlineMode, browser: browser.version(), iPhoneTested: false, release: report.release,
      bytes: report.bytes, subpathPassed: true, initialHashFailureRollback: true, failedUpdateKeepsOldCache: true,
      waitingUpdatePassed: true, unrelatedCachePreserved: true, evictionRepairPassed: true,
      offlineFixtureSaveReload: true, offlineNewPageAfterUpdate: true, updatePreservesSave: true,
      mobileViewport: '390x844 simulated, not physical keyboard', originalUnchanged: true, originalCount: original.records.length,
      originalDigest: original.originalDigest, pageErrors: errors, externalRequests };
    const suffix = offlineMode === 'server-stop' ? '-server-stop' : '';
    await writeFile(new URL(`./results/pwa-${browserEngine}${suffix}.json`, import.meta.url), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result)); await context.close();
  } finally {
    if (browser) await browser.close();
    if (server) { const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); await closed; }
    await rm(temp, { recursive: true, force: true });
  }
});