// Real-browser regression for the packaged eramaou128 PWA dungeon trap flow.
// Uses a disposable browser context and the checked-in PWA artifact; no saves persist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium, webkit } from 'playwright';
import { createStaticServer } from './serve-pwa.mjs';

const browserEngine = process.env.PROBE_BROWSER_ENGINE ?? 'chromium';
const AVOID = /LOAD|불러|HELP|도움|설명|돌아가|이전\s*페이지|다음\s*페이지/i;
const CONFIRM = /결정|確定|확정|이대로|완료|결정하기|시작하기|決定|확실히 그렇다/;

test(`eramaou128 PWA ${browserEngine}: actual dungeon A/B/C trap flow`, { timeout: 170000 }, async () => {
  const server = createStaticServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/iphone-test/`;
  let browser, context;
  try {
    browser = await (browserEngine === 'webkit' ? webkit : chromium).launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(url);
    await page.locator('#game-menu button[data-game="eramaou128"]').click();

    const steps = [];
    async function snapshot() {
      await page.waitForFunction(() => /입력 대기|실패|종료/.test(document.querySelector('#status')?.textContent || ''));
      const result = await page.evaluate(() => ({
        status: document.querySelector('#status').textContent,
        error: document.querySelector('#error').textContent,
        output: document.querySelector('#output').innerText.slice(-12000),
        floor1: [...document.querySelectorAll('#output button:not(:disabled)[data-value="111"]')].at(-1)?.closest('.game-line')?.textContent ?? '',
        waitVisible: !document.querySelector('#continue').hidden,
        buttons: [...document.querySelectorAll('#output button:not(:disabled)')]
          .map(button => ({ value: button.dataset.value, text: button.textContent }))
      }));
      assert.match(result.status, /입력 대기/, JSON.stringify(result));
      steps.push({ status: result.status, wait: result.waitVisible, tail: result.output.slice(-160), buttons: result.buttons });
      return result;
    }
    async function enter(value) {
      const button = page.locator(`#output button:not(:disabled)[data-value="${value}"]`).last();
      if (await button.count()) await button.click();
      else {
        await page.locator('#input').fill(String(value));
        await page.locator('#submit').click();
      }
      return snapshot();
    }

    let state = await snapshot();
    const visits = new Map();
    for (let step = 0; step < 160 && !state.buttons.some(button => button.value === '107'); step++) {
      if (state.waitVisible) {
        await page.locator('#continue').click();
        state = await snapshot();
        continue;
      }
      let value;
      const values = new Set(state.buttons.map(button => button.value));
      if (values.has('0') && values.has('1') && /NEW GAME/.test(state.output)) value = '1';
      else if (state.buttons.some(button => button.value === '100' && /였을것이다/.test(button.text))) value = '100';
      else if (/이름|명칭/.test(state.output) && /5자까지|５자/.test(state.output.slice(-300))) value = '웹시험';
      else {
        const confirm = state.buttons.find(button => CONFIRM.test(button.text));
        if (confirm) value = confirm.value;
        else {
          const key = state.output.slice(-120);
          const seen = (visits.get(key) ?? 0) + 1;
          visits.set(key, seen);
          const good = state.buttons.find(button => !AVOID.test(button.text));
          if (seen > 3 && state.buttons.length) value = state.buttons.reduce((a, b) => Number(b.value) > Number(a.value) ? b : a).value;
          else value = good?.value ?? state.buttons[0]?.value ?? '0';
        }
      }
      state = await enter(value);
    }
    assert.ok(state.buttons.some(button => button.value === '107'),
      'setup reaches the real command menu: ' + JSON.stringify(steps.slice(-12)));
    assert.ok(state.buttons.some(button => button.value === '102'), 'dungeon info command is available');

    // New games do not own traps. Buy through the real SHOP/EVENTBUY path;
    // DUNGEON_INFO2 ignores an unowned trap number rather than warning.
    state = await enter('107');
    state = await enter('998');
    for (const trap of ['60', '61', '62']) {
      assert.ok(state.buttons.some(button => button.value === trap), `trap ${trap} is for sale`);
      state = await enter(trap);
      assert.match(state.output.slice(-400), /몇 개 구입합니까/, 'purchase quantity prompt');
      state = await enter('1');
      assert.equal(state.waitVisible, true, 'purchase confirmation wait');
      assert.match(state.output.slice(-250), /구입했습니다/, 'purchase succeeded');
      await page.locator('#continue').click();
      state = await snapshot();
    }
    state = await enter('999');
    state = await enter('102');
    assert.ok(state.buttons.some(button => button.value === '111'), 'DUNGEON_INFO2 rendered floor/column choices');
    for (const trap of ['60', '61', '62']) {
      assert.ok(state.buttons.some(button => button.value === trap), `owned trap ${trap} can be installed`);
    }

    state = await enter('60');
    assert.equal(state.waitVisible, true, 'no-selection warning reaches WAITANYKEY');
    await page.locator('#continue').click();
    state = await snapshot();

    for (const [select, trap, label] of [
      ['111', '60', '떨어지는함정'],
      ['112', '61', '화살형함정'],
      ['113', '62', '텔레포트형함정'],
    ]) {
      state = await enter(select);
      state = await enter(trap);
      assert.equal(state.waitVisible, false, `${select} is recognized without a false warning`);
      assert.ok(state.floor1.replace(/\s/g, '').includes(`[${select}]함정：${label}`), `${label} is installed in column ${select}: ${state.floor1}`);
      state = await enter(select); // clear this column before checking the next one
    }

    state = await enter('999');
    assert.ok(state.buttons.some(button => button.value === '107'), 'exit returns to the command menu');
    assert.deepEqual(pageErrors, []);
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    const closed = new Promise(resolve => server.close(resolve));
    server.closeAllConnections();
    await closed;
  }
});
