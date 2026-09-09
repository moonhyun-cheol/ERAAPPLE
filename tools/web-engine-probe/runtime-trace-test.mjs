import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { createStaticServer } from './serve-pwa.mjs';
import { TRACE_KEY, createRuntimeTrace, describeTrace, createProgressBridge } from './runtime-trace.mjs';

test('tiny journal survives restart; unavailable/corrupt storage fails open; modes isolated', () => {
  const map = new Map(), storage = { getItem: k => map.get(k), setItem: (k, v) => map.set(k, v) };
  const trace = createRuntimeTrace(() => storage);
  assert.equal(trace.previous, null);
  trace.record('serialize', 'save90.sav');
  assert.match(describeTrace(createRuntimeTrace(() => storage).previous), /저장 데이터 생성 중/);
  trace.record('writing', 'save90.sav'); trace.record('committed', 'save90.sav'); trace.record('waiting');
  const next = createRuntimeTrace(() => storage).previous;
  assert.equal(next.save.phase, 'committed');
  assert.ok(map.get(TRACE_KEY + 'game').length < 512);
  assert.equal(createRuntimeTrace(() => storage, 'fixture').previous, null);
  map.set(TRACE_KEY + 'game', '{bad');
  assert.equal(createRuntimeTrace(() => storage).previous, null);
  const broken = createRuntimeTrace(() => { throw new Error('private mode'); });
  assert.doesNotThrow(() => broken.record('serialize', 'save00.sav'));
  assert.equal(broken.available, false);
});
test('progress ACK ordering, wrong ACK, timeout and failed send do not hang', async () => {
  let message, done = false;
  const bridge = createProgressBridge(data => { message = data; }, 30);
  const report = bridge.report({ phase: 'serialize', key: 'save00.sav' }).then(() => { done = true; });
  bridge.acknowledge(message.id + 1); await Promise.resolve(); assert.equal(done, false);
  bridge.acknowledge(message.id); await report; assert.equal(done, true);
  await bridge.report({ phase: 'writing' }); // deliberate no ACK -> bounded fallback
  await createProgressBridge(() => { throw new Error('gone'); }).report({ phase: 'serialize' });
});
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  test(`${engine}: actual worker diagnostic ordering, interrupted save breadcrumb, restore and unavailable journal`, { timeout: 90000 }, async () => {
    const server = createStaticServer(); let browser;
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      browser = await launcher.launch({ headless: true, ...(engine === 'chromium' && process.env.PROBE_BROWSER_CHANNEL ? { channel: process.env.PROBE_BROWSER_CHANNEL } : {}) });
      const context = await browser.newContext();
      await context.addInitScript(() => {
        window.traceEvents = []; window.interruptSave = false;
        const Native = Worker;
        window.Worker = class extends Native {
          constructor(...args) {
            super(...args);
            this.addEventListener('message', ({ data }) => {
              if (data.type === 'save-progress') {
                window.traceEvents.push(data.phase);
                if (window.interruptSave && data.phase === 'serialize') this.terminate();
              }
              // The injected journal failure deliberately leaves save=null; observing
              // that case must not itself introduce a page error.
              if (data.type === 'saved') window.traceEvents.push('saved:' + (JSON.parse(localStorage.getItem('era-runtime-trace-v1:fixture'))?.save?.phase ?? 'unavailable'));
            });
          }
        };
      });
      const page = await context.newPage(); page.setDefaultTimeout(30000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const url = `http://127.0.0.1:${server.address().port}/iphone-test/`;
      await page.goto(url);
      const start = async () => {
        await page.locator('#fixture-help').evaluate(node => { node.open = true; });
        await page.locator('#start').click();
        await page.waitForFunction(() => document.querySelector('#status').textContent === '입력 대기');
      };
      const enter = async value => {
        const id = await page.locator('#status').getAttribute('data-request-id');
        await page.locator('#input').fill(value); await page.locator('#submit').click();
        await page.waitForFunction(id => {
          const s = document.querySelector('#status');
          return /종료|실패/.test(s.textContent) || (s.textContent === '입력 대기' && s.dataset.requestId !== id);
        }, id);
      };
      await start(); await enter('0'); await enter('42'); await enter('한글 시험');
      assert.equal(await page.locator('#status').textContent(), '시험 종료');
      assert.deepEqual(await page.evaluate(() => window.traceEvents), [
        'serialize', 'writing', 'committed', 'saved:committed', 'serialize', 'writing', 'committed', 'saved:committed'
      ]);
      await page.reload(); await start();
      assert.match(await page.locator('#previous-run').textContent(), /save00.sav: 저장 완료/);
      await enter('1'); assert.match(await page.locator('#output').textContent(), /RESTORED:42:한글 시험:77/);
      await start(); await enter('0'); await enter('99');
      await page.evaluate(() => { window.interruptSave = true; });
      await page.locator('#input').fill('interrupted'); await page.locator('#submit').click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('era-runtime-trace-v1:fixture')).phase === 'serialize');
      await page.reload(); await start();
      assert.match(await page.locator('#previous-run').textContent(), /저장 데이터 생성 중/);
      await enter('1'); assert.match(await page.locator('#output').textContent(), /RESTORED:42:한글 시험:77/);
      // Journal write failures must not prevent IndexedDB saves or their commit acknowledgement.
      await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('injected', 'QuotaExceededError'); }; });
      await start(); await enter('0'); await enter('55'); await enter('진단 실패 시험');
      assert.equal(await page.locator('#status').textContent(), '시험 종료');
      assert.match(await page.locator('#current-run').textContent(), /진단 기록 보관 불가/);
      await start(); await enter('1'); assert.match(await page.locator('#output').textContent(), /RESTORED:55:진단 실패 시험:77/);
      assert.deepEqual(errors, []);
      await writeFile(new URL(`./results/save-trace-${engine}.json`, import.meta.url), JSON.stringify({ passed: true, engine, phaseOrdering: true, interruptedSavePreserved: true, unavailableJournal: true, actualIPhone: false }, null, 2) + '\n');
    } finally {
      await browser?.close(); await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
  });
}
