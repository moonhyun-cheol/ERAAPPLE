import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { chromium, webkit } from 'playwright';

const fixture = `@SYSTEM_TITLE
REPEAT 2400
PRINTFORML ROW:{COUNT}
REND
CLEARLINE 2
PRINTL [1] First [2] Second
TINPUT 3000, 100, 1
PRINTFORML CHOSEN:{RESULT}
PRINTL [7] Wait for default
TINPUT 300, 100, 0
PRINTFORML EXPIRED:{RESULT}
PRINTL Ordinary input
INPUT
PRINTFORML ORDINARY:{RESULT}
PRINTL Timed text
TINPUTS 3000, "기본", 1
PRINTFORML TEXT:%RESULTS%
PRINTL Continue checkpoint
WAIT
QUIT
`;
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  test(`${engine}: bounded output, timed choices/defaults, stale messages and WAIT`, { timeout: 60000 }, async () => {
    const bytes = gzipSync(Buffer.from(JSON.stringify({ count: 1 }) + '\n' + JSON.stringify(['FIXTURE.ERB', fixture]) + '\n'));
    const server = http.createServer(async (req, res) => {
      if (req.url === '/local-game.bin') { res.writeHead(200, { 'Content-Type': 'application/octet-stream' }); res.end(bytes); return; }
      const name = req.url === '/' ? 'index.html' : req.url.slice(1);
      if (!['index.html', 'browser.js', 'engine-worker.js'].includes(name)) { res.writeHead(404).end(); return; }
      const content = await readFile(new URL('./dist/' + name, import.meta.url));
      res.writeHead(200, { 'Content-Type': name.endsWith('.js') ? 'text/javascript' : 'text/html' }).end(content);
    });
    let browser;
    try {
      server.listen(0, '127.0.0.1'); await once(server, 'listening');
      browser = await launcher.launch({ headless: true,
        ...(engine === 'chromium' && process.env.PROBE_BROWSER_CHANNEL ? { channel: process.env.PROBE_BROWSER_CHANNEL } : {}) });
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await context.addInitScript(() => {
        window.runtimeMetrics = { outstanding: 0, peak: 0, batches: 0, layoutReads: 0 };
        const rect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function () {
          if (this.tagName === 'MAIN') window.runtimeMetrics.layoutReads++;
          return rect.call(this);
        };
        const NativeWorker = Worker;
        window.Worker = class extends NativeWorker {
          constructor(...args) {
            super(...args); window.testWorker = this;
            this.addEventListener('message', ({ data }) => {
              if (data.type === 'events') {
                const m = window.runtimeMetrics; m.batches++; m.outstanding++; m.peak = Math.max(m.peak, m.outstanding);
              }
            });
          }
          postMessage(data, ...rest) {
            if (data.type === 'rendered') window.runtimeMetrics.outstanding--;
            return super.postMessage(data, ...rest);
          }
        };
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const started = Date.now();
      await page.locator('#game-start').tap();
      const waiting = id => page.waitForFunction(id => document.querySelector('#status').textContent === '입력 대기' && document.querySelector('#status').dataset.requestId === String(id), id);
      await waiting(1);
      assert.equal(await page.locator('#output > div').count(), 2000);
      assert.doesNotMatch(await page.locator('#output').innerText(), /ROW:239[89]/);
      assert.match(await page.locator('#notice').innerText(), /제한시간/);
      await page.locator('#output button[data-value="2"]').tap();
      await waiting(2);
      assert.match(await page.locator('#output').innerText(), /CHOSEN:2/);
      await page.evaluate(() => window.testWorker.postMessage({ type: 'input', id: 1, value: '1' }));
      await waiting(3);
      assert.match(await page.locator('#output').innerText(), /EXPIRED:100/);
      assert.equal(await page.locator('#output button:not(:disabled)').count(), 0);
      await page.evaluate(() => window.testWorker.postMessage({ type: 'input', id: 2, value: '7' }));
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#status').getAttribute('data-request-id'), '3');
      await page.locator('#input').fill('bad'); await page.locator('#submit').tap();
      assert.match(await page.locator('#notice').innerText(), /정수를/);
      await page.locator('#input').fill('42'); await page.locator('#submit').tap();
      await waiting(4);
      await page.locator('#input').fill('한글'); await page.locator('#submit').tap();
      await waiting(5);
      assert.match(await page.locator('#output').innerText(), /ORDINARY:42/);
      assert.match(await page.locator('#output').innerText(), /TEXT:한글/);
      assert.equal(await page.locator('#continue').isVisible(), true);
      await page.waitForTimeout(3200); // canceled TINPUT timer must not consume WAIT
      assert.equal(await page.locator('#status').getAttribute('data-request-id'), '5');
      await page.locator('#continue').tap();
      await page.waitForFunction(() => document.querySelector('#status').textContent === '게임 종료');
      assert.equal(await page.locator('#error').innerText(), '');
      assert.deepEqual(errors, []);
      const metrics = await page.evaluate(() => ({ ...window.runtimeMetrics, fits: document.documentElement.scrollWidth <= innerWidth }));
      assert.equal(metrics.peak, 1); assert.equal(metrics.outstanding, 0);
      assert.ok(metrics.layoutReads < 100, JSON.stringify(metrics));
      assert.equal(metrics.fits, true);
      const report = { engine, passed: true, actualIPhone: false, elapsedMs: Date.now() - started, metrics, errors };
      await writeFile(new URL(`./results/runtime-${engine}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
      console.log(report);
    } finally {
      await browser?.close();
      await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
  });
}
