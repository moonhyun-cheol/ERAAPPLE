import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { webkit, chromium } from 'playwright';
import { createStaticServer } from './serve-pwa.mjs';

const external = process.env.PROBE_PUBLIC_URL;
const engine = process.env.PROBE_BROWSER_ENGINE ?? 'webkit';
test('mobile: offline preparation and explicit continue after mode selection', { timeout: 180000 }, async () => {
  let server, browser;
  try {
    let url = external;
    if (!url) {
      server = createStaticServer(); server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      url = `http://127.0.0.1:${server.address().port}/iphone-test/`;
    }
    browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true,
      ...(engine !== 'webkit' && process.env.PROBE_BROWSER_CHANNEL ? { channel: process.env.PROBE_BROWSER_CHANNEL } : {}) });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const errors = [], failedResponses = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failedResponses.push([response.url(), response.status()]); });
    await page.goto(url);
    await page.locator('#pwa-help summary').tap();
    assert.equal(await page.locator('#offline-prepare').isEnabled(), true);
    await page.locator('#offline-prepare').tap();
    await page.waitForFunction(() => document.querySelector('#pwa-status').textContent.startsWith('오프라인 준비됨'), {}, { timeout: 90000 });
    const offlineStatus = await page.locator('#pwa-status').innerText();
    await page.locator('#pwa-help summary').tap();
    const waiting = () => page.waitForFunction(() => document.querySelector('#status').textContent === '입력 대기');
    const choose = async value => {
      await page.locator(`#output button:not(:disabled)[data-value="${value}"]`).tap();
      await waiting();
    };
    const checkPause = async () => {
      assert.equal(await page.locator('#status').getAttribute('data-wait-type'), 'wait');
      assert.equal(await page.locator('#continue').isVisible(), true);
      assert.equal(await page.locator('#continue').isEnabled(), true);
      assert.equal(await page.locator('#submit').innerText(), '계속 ▶');
      assert.match(await page.locator('#notice').innerText(), /멈춘 것이 아닙니다/);
      assert.equal(await page.locator('#output button:not(:disabled)').count(), 0, 'stale choices disabled');
      await page.waitForFunction(() => {
        const main = document.querySelector('main').getBoundingClientRect();
        const dock = document.querySelector('#composer').getBoundingClientRect();
        return main.bottom <= dock.top + 2;
      });
      assert.equal(await page.evaluate(() => {
        const out = document.querySelector('#output');
        return getComputedStyle(out).maxHeight === 'none' && getComputedStyle(out).overflowY === 'visible'
          && out.scrollHeight <= out.clientHeight + 1;
      }), true, 'output has no nested scroll pane');
    };
    const advance = async () => {
      await page.locator('#continue').tap(); await waiting();
      assert.equal(await page.locator('#continue').isVisible(), false);
    };
    await page.locator('#game-start').tap(); await waiting();
    await choose('0'); // New game.
    await choose('0'); // eratohoYM mode.
    await checkPause();
    // Rotate and simulate a reduced viewport (not a physical iOS keyboard).
    for (const size of [{ width: 844, height: 390 }, { width: 390, height: 360 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await page.locator('#latest').tap();
      await checkPause();
      assert.equal(await page.evaluate(() => {
        const dock = document.querySelector('#composer').getBoundingClientRect();
        return document.documentElement.scrollWidth <= innerWidth && dock.top >= 0 && dock.bottom <= innerHeight + 1;
      }), true, 'no horizontal overflow; dock fits visible viewport');
    }
    assert.equal(await page.evaluate(() => window.scrollY > 0), true, 'document is the scroll container');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#latest').tap();
    await checkPause();
    await advance();
    assert.match(await page.locator('#output button:not(:disabled)').first().innerText(), /EASY/);
    await choose('1'); await checkPause(); await advance();
    assert.match(await page.locator('#output button:not(:disabled)').first().innerText(), /필요 없음/);
    await choose('0'); await checkPause(); await advance();
    assert.match(await page.locator('#output button:not(:disabled)').first().innerText(), /선택하지 않는다/);
    assert.equal(await page.locator('#error').innerText(), '');
    assert.deepEqual(errors, []);
    assert.deepEqual(failedResponses, []);
    const report = { passed: true, url, engine, actualIPhone: false, offlineStatus,
      modeContinueToDifficulty: true, difficultyContinueToSettings: true, settingsContinueAndScroll: true,
      documentOnlyScroll: true, fixedComposer: true, rotationAndReducedViewport: true,
      errors, failedResponses };
    await writeFile(new URL(`./results/mobile-wait-${external ? 'public' : engine}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  } finally {
    await browser?.close();
    if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  }
});
