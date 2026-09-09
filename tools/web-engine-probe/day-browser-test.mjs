import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { createStaticServer } from './serve-pwa.mjs';
import { inventory } from './inventory.mjs';

// Real, unchanged game bundle in disposable browser storage. No production save edits.
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  test(`${engine}: real game day rollover, rotating autosaves and reload`, { timeout: 240000 }, async () => {
    const before = await inventory();
    const server = createStaticServer();
    let browser, page, state, steps = [];
    const started = Date.now();
    try {
      server.listen(0, '127.0.0.1'); await once(server, 'listening');
      const url = `http://127.0.0.1:${server.address().port}/iphone-test/`;
      browser = await launcher.launch({ headless: true,
        ...(engine === 'chromium' && process.env.PROBE_BROWSER_CHANNEL ? { channel: process.env.PROBE_BROWSER_CHANNEL } : {}) });
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await context.addInitScript(() => {
        window.savedKeys = [];
        const NativeWorker = Worker;
        window.Worker = class extends NativeWorker {
          constructor(...args) {
            super(...args);
            this.addEventListener('message', ({ data }) => {
              if (data.type === 'saved') window.savedKeys.push(data.key);
            });
          }
        };
      });
      page = await context.newPage(); page.setDefaultTimeout(60000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url);
      const snapshot = async previous => {
        await page.waitForFunction(previous => {
          const s = document.querySelector('#status');
          return /실패|종료|시간 한도/.test(s.textContent) ||
            (s.textContent === '입력 대기' && s.dataset.requestId !== previous);
        }, previous);
        state = await page.evaluate(() => ({
          id: document.querySelector('#status').dataset.requestId,
          status: document.querySelector('#status').textContent,
          type: document.querySelector('#status').dataset.waitType,
          stack: JSON.parse(document.querySelector('#status').dataset.stack || '[]'),
          output: document.querySelector('#output').textContent.slice(-6000),
          error: document.querySelector('#error').textContent,
          buttons: [...document.querySelectorAll('#output button:not(:disabled)')].map(b => b.dataset.value)
        }));
        assert.equal(state.error, ''); assert.equal(state.status, '입력 대기');
        steps.push({ id: state.id, type: state.type, stack: state.stack, tail: state.output.slice(-300) });
        return state;
      };
      const enter = async value => {
        const previous = state.id;
        // Drive the normal composer submit handler without tap animation delays for hundreds of waits.
        await page.evaluate(value => {
          document.querySelector('#input').value = value;
          document.querySelector('form').requestSubmit();
        }, value);
        return snapshot(previous);
      };
      const shop = () => state.type === 'input' && state.buttons.includes('200');
      const advanceToShop = async () => {
        for (let n = 0; n < 100 && !shop(); n++) {
          let value = state.buttons[0] ?? '0';
          if (state.stack.includes('START_CONFIGURATION')) value = state.buttons.includes('11') ? '11' : '1';
          if (state.type === 'wait') value = '';
          if (state.type === 'tinput') await snapshot(state.id);
          else await enter(value);
        }
        assert.ok(shop(), 'returns to shop');
      };
      const day = () => Number([...state.output.matchAll(/(\d+)일째/g)].at(-1)?.[1]);
      await page.locator('#game-start').click(); await snapshot(undefined);
      await advanceToShop();
      assert.equal(day(), 1);
      await enter('111');
      for (let n = 0; n < 40 && !(state.stack.includes('CHARA_BUY_MAIN') && state.buttons.includes('1000')); n++) await enter(state.type === 'wait' ? '' : state.buttons[0] ?? '0');
      await enter('104'); // Same character as the attached refusal path.
      for (let n = 0; n < 40 && !(state.stack.includes('CHARA_BUY_MAIN') && state.buttons.includes('1000')); n++) await enter(state.type === 'wait' ? '' : state.buttons[0] ?? '0');
      await enter('1000'); await advanceToShop();
      assert.match(state.output, /대요정/);
      await enter('200'); await enter('0'); await advanceToShop();
      const reloadSlot = async slot => {
        await page.reload(); await page.locator('#game-start').click(); await snapshot(undefined);
        await enter('1'); await enter(slot); await advanceToShop();
      };
      const refusal = [];
      for (const choice of ['2', null]) {
        // Natural refusal is probabilistic; each attempt reloads the same unmodified day-one save.
        let reached = false;
        for (let attempt = 0; attempt < 10 && !reached; attempt++) {
          await reloadSlot('0'); await enter('100');
          for (let n = 0; n < 60 && !state.buttons.includes('899'); n++) await enter(state.type === 'wait' ? '' : state.buttons[0] ?? '0');
          assert.ok(state.buttons.includes('899'), 'real game exposes food command');
          await enter('899');
          let inputs = 0;
          for (let n = 0; n < 40 && state.type !== 'tinput'; n++) {
            if (state.buttons.includes('899')) break; // accepted food, retry with a fresh save
            await enter(state.type === 'wait' ? '' : ++inputs === 1 ? '1' : '3');
          }
          reached = state.type === 'tinput';
        }
        assert.ok(reached, 'reaches the screenshot timed-input branch');
        assert.ok(state.stack.includes('FEED_IN_TRAIN_TORIKOMODE'));
        assert.match(state.output, /성의를 거부했다/);
        assert.deepEqual(state.buttons, ['1', '2']);
        if (choice === null) await snapshot(state.id);
        else await enter(choice);
        assert.match(state.output, choice === null ? /결정을 내리지 못한/ : /때로는 저쪽의 의견/);
        for (let n = 0; n < 40 && !state.buttons.includes('899'); n++) await enter(state.type === 'wait' ? '' : state.buttons[0] ?? '0');
        assert.ok(state.buttons.includes('899'), 'food refusal returns to playable menu');
        refusal.push(choice ?? 'timeout-default-100');
      }
      await reloadSlot('0');
      const days = [day()];
      for (let n = 0; n < 24; n++) {
        await enter('102'); await advanceToShop();
        const current = day();
        assert.equal(current, 1 + Math.floor((n + 1) / 2), 'night-to-day increments exactly once');
        days.push(current);
      }
      const saves = await page.evaluate(() => window.savedKeys);
      for (let slot = 90; slot < 100; slot++) assert.ok(saves.includes(`save${slot}.sav`), `automatic save slot ${slot}`);
      // Choose the last fully committed automatic save, not the last displayed GLOBAL message.
      const lastSave = saves.filter(key => /^save9\d\.sav$/.test(key)).at(-1);
      const slot = String(Number(lastSave.match(/\d+/)[0]));
      const finalDay = day();
      await page.reload(); await page.locator('#game-start').click(); await snapshot(undefined);
      await enter('1'); await enter(slot); await advanceToShop();
      assert.equal(day(), finalDay, 'automatic save survives reload with the correct date');
      assert.match(state.output, /대요정/);
      await enter('102'); await advanceToShop();
      assert.equal(day(), finalDay, 'rest after restored daytime reaches night');
      await enter('102'); await advanceToShop();
      assert.equal(day(), finalDay + 1, 'next day still works after reload');
      assert.deepEqual(errors, []);
      assert.equal((await inventory()).originalDigest, before.originalDigest);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const report = { passed: true, engine, actualIPhone: false, originalUnchanged: true,
        days, finalDayAfterReload: day(), autosaveWrites: saves.length, lastSave, refusal,
        elapsedMs: Date.now() - started, pageErrors: errors };
      await writeFile(new URL(`./results/day-${engine}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
      console.log(report);
    } catch (error) {
      await writeFile(new URL(`./results/day-${engine}-failure.json`, import.meta.url), JSON.stringify({ error: error.message, state, steps }, null, 2));
      throw error;
    } finally {
      await browser?.close();
      await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
  });
}
