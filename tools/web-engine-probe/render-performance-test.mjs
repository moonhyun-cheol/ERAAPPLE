import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, webkit } from 'playwright';

// UI-only workload using the actual bundled host and the engine's output event shape.
// No game VM, compilation, network or save work is included in these timings.
const label = process.env.PROBE_PERF_LABEL ?? 'optimized';
assert.match(label, /^[a-z0-9-]+$/);
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  test(`${engine}: rendering benchmark and output semantics`, { timeout: 90000 }, async () => {
    const server = http.createServer(async (req, res) => {
      const name = req.url === '/' ? 'index.html' : req.url.slice(1);
      if (!['index.html', 'browser.js'].includes(name)) { res.writeHead(404).end(); return; }
      const bytes = await readFile(new URL('./dist/' + name, import.meta.url));
      res.writeHead(200, { 'Content-Type': name.endsWith('.js') ? 'text/javascript' : 'text/html' }).end(bytes);
    });
    let browser;
    try {
      server.listen(0, '127.0.0.1'); await once(server, 'listening');
      browser = await launcher.launch({ headless: true,
        ...(engine === 'chromium' && process.env.PROBE_BROWSER_CHANNEL ? { channel: process.env.PROBE_BROWSER_CHANNEL } : {}) });
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await context.addInitScript(() => {
        window.resetMetrics = () => { window.metrics = { mainReads: 0, composerReads: 0, createdElements: 0, buttonQueries: 0, scrolls: 0, batches: 0, acks: 0, renderMs: [] }; };
        window.resetMetrics();
        const rect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function () {
          if (this.tagName === 'MAIN') window.metrics.mainReads++;
          if (this.id === 'composer') window.metrics.composerReads++;
          return rect.call(this);
        };
        const create = document.createElement.bind(document);
        document.createElement = (...args) => { window.metrics.createdElements++; return create(...args); };
        const query = Element.prototype.querySelectorAll;
        Element.prototype.querySelectorAll = function (selector) {
          if (selector === 'button') window.metrics.buttonQueries++;
          return query.call(this, selector);
        };
        const scroll = window.scrollTo.bind(window);
        window.scrollTo = (...args) => { window.metrics.scrolls++; return scroll(...args); };
        window.Worker = class {
          constructor() { window.uiWorker = this; this.sent = []; }
          terminate() { this.stopped = true; }
          postMessage(data) { this.sent.push(data); if (data.type === 'rendered') window.metrics.acks++; }
          emit(data) { this.onmessage({ data }); }
        };
        window.frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.line = (text, style = { color: 'FFFFFF' }) => ({ type: 'content', align: 'LEFT', children: [{ type: 'string', text, style }] });
        window.events = events => {
          const start = performance.now();
          window.uiWorker.emit({ type: 'events', id: ++window.metrics.batches, events });
          window.metrics.renderMs.push(performance.now() - start);
        };
        window.waiting = id => window.uiWorker.emit({ type: 'waiting', id, event: { type: 'input', numeric: true }, stack: [] });
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const samples = [];
      for (let sample = 0; sample < 4; sample++) {
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.locator('#game-start').click();
        await page.waitForFunction(() => window.uiWorker);
        const result = await page.evaluate(async () => {
          await window.frames();
          window.waiting(0); // Benchmark steady UI output, not the deliberate-start follow flag.
          await window.frames();
          // Prepare identical data outside the timed region. One event batch per message task.
          const batches = Array.from({ length: 80 }, (_, b) => Array.from({ length: 128 }, (_, i) => {
            const n = b * 128 + i, row = window.line(`ROW:${n} 한글 출력 `);
            if (n % 8 === 0) row.children.push({ type: 'string', text: '강조', style: { color: 'ff8800', bold: true, underline: true } }, { type: 'string', text: ' 끝', style: { color: 'FFFFFF' } });
            if (n % 32 === 0) row.children.push({ type: 'button', text: '[1] 선택', value: 1, style: { color: 'FFFFFF' } });
            return row;
          }));
          window.resetMetrics();
          const start = performance.now();
          const channel = new MessageChannel();
          await new Promise(resolve => {
            let index = 0;
            channel.port1.onmessage = () => {
              window.events(batches[index++]);
              if (index === batches.length) resolve();
              else channel.port2.postMessage(null);
            };
            channel.port2.postMessage(null);
          });
          channel.port1.close(); channel.port2.close();
          window.waiting(1);
          await window.frames(); // Includes final layout/scroll, not just DOM insertion.
          const elapsedMs = performance.now() - start;
          const output = document.querySelector('#output'), times = [...window.metrics.renderMs].sort((a, b) => a - b);
          return { ...window.metrics, renderMs: undefined, elapsedMs,
            handlerTotalMs: times.reduce((a, b) => a + b, 0), handlerP95Ms: times[Math.floor(times.length * .95)],
            rows: output.childElementCount, elements: output.querySelectorAll('*').length,
            first: output.firstChild.textContent, last: output.lastChild.textContent,
            activeButtons: output.querySelectorAll('button:not(:disabled)').length };
        });
        assert.equal(result.rows, 2000);
        assert.match(result.first, /^ROW:8240 /); assert.match(result.last, /^ROW:10239 /);
        assert.equal(result.activeButtons, 62); assert.equal(result.acks, 80);
        if (label !== 'baseline') {
          // Deterministic work budgets, not noisy wall-clock thresholds.
          assert.equal(result.createdElements, 14400);
          assert.equal(result.elements, 2812);
          assert.equal(result.buttonQueries, 0);
        }
        if (sample > 0) samples.push(result); // One warmup, three recorded repetitions.
      }
      // Semantics: styled text, literal markup, mixed buttons, CLEARLINE in/across batches.
      await page.evaluate(async () => {
        window.events([{ type: 'clear', count: 3000 }]);
        window.events([window.line('KEEP'), window.line('REMOVE')]);
        const styled = window.line('<b>문자 그대로</b>', { color: '12Ab34', bold: true, italic: true, underline: true, strike: true });
        styled.align = 'RIGHT';
        window.events([window.line('TEMP'), { type: 'clear', count: 2 }, styled,
          { type: 'content', align: 'CENTER', children: [{ type: 'button', text: '[7] 선택', value: 7 }, { type: 'string', text: ' 뒤', style: { color: 'ff0000' } }] }]);
        window.waiting(2); await window.frames();
      });
      const semantic = await page.evaluate(() => {
        const rows = [...document.querySelector('#output').children], text = rows[1].firstChild;
        const css = getComputedStyle(text.nodeType === Node.TEXT_NODE ? rows[1] : text);
        return { texts: rows.map(row => row.textContent), color: css.color, bold: css.fontWeight, italic: css.fontStyle,
          decoration: css.textDecorationLine, align: getComputedStyle(rows[1]).textAlign,
          button: document.querySelector('#output button:not(:disabled)').dataset.value,
          markup: document.querySelectorAll('#output b').length };
      });
      assert.deepEqual(semantic.texts, ['KEEP', '<b>문자 그대로</b>', '[7] 선택 뒤']);
      assert.equal(semantic.color, 'rgb(18, 171, 52)'); assert.equal(semantic.bold, '700'); assert.equal(semantic.italic, 'italic');
      assert.match(semantic.decoration, /underline/); assert.match(semantic.decoration, /line-through/);
      assert.equal(semantic.align, 'right'); assert.equal(semantic.button, '7'); assert.equal(semantic.markup, 0);
      await page.locator('#output button[data-value="7"]').click();
      assert.deepEqual(await page.evaluate(() => window.uiWorker.sent.filter(message => message.type === 'input')), [{ type: 'input', id: 2, value: '7' }]);
      // Old choices must not become active again, even after CLEARLINE removes the new epoch.
      await page.evaluate(() => { window.events([window.line('NEXT')]); window.waiting(3); });
      assert.equal(await page.locator('#output button:not(:disabled)').count(), 0);
      await page.evaluate(() => { window.events([{ type: 'clear', count: 5000 }]); });
      assert.equal(await page.locator('#output > div').count(), 0);
      const temporary = await page.evaluate(() => {
        window.events([window.line('KEEP')]); window.resetMetrics();
        window.events(Array.from({ length: 64 }, () => [
          { type: 'content', children: [{ type: 'button', text: 'TEMP', value: 99 }] },
          { type: 'clear', count: 1 }
        ]).flat());
        window.waiting(4);
        return { created: window.metrics.createdElements, text: document.querySelector('#output').textContent,
          choices: document.querySelectorAll('#output button:not(:disabled)').length };
      });
      assert.equal(temporary.text, 'KEEP'); assert.equal(temporary.choices, 0);
      if (label !== 'baseline') assert.equal(temporary.created, 0);
      // Seeded reference model verifies batch-end pruning, interleaved clears and button cleanup.
      const modelCheck = await page.evaluate(() => {
        window.events([{ type: 'clear', count: 5000 }]);
        let seed = 17, next = 0, expected = [];
        const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
        for (let b = 0; b < 60; b++) {
          const events = [];
          for (let i = 0; i < 128; i++) {
            const r = random();
            if (r % 11 === 0) {
              const count = r % 13; events.push({ type: 'clear', count });
              expected.splice(Math.max(0, expected.length - count), count);
            } else {
              const text = `MODEL:${next++}`, button = r % 7 === 0;
              events.push(button ? { type: 'content', children: [{ type: 'button', text, value: text }] } : window.line(text));
              expected.push({ text, button });
            }
          }
          expected = expected.slice(-2000);
          window.events(events);
          if (JSON.stringify([...document.querySelector('#output').children].map(row => row.textContent)) !== JSON.stringify(expected.map(row => row.text))) return { passed: false, batch: b };
        }
        window.waiting(5);
        return { passed: true, expectedButtons: expected.filter(row => row.button).length,
          activeButtons: document.querySelectorAll('#output button:not(:disabled)').length };
      });
      assert.equal(modelCheck.passed, true, JSON.stringify(modelCheck));
      assert.equal(modelCheck.activeButtons, modelCheck.expectedButtons);
      // A user reading older output must not be pulled down by unsolicited output.
      // Stay below the history cap here: trimming the very row being read may scroll-anchor.
      await page.evaluate(async () => {
        window.events([{ type: 'clear', count: 5000 }, ...Array.from({ length: 128 }, (_, i) => window.line(`SCROLL:${i}`))]);
        await window.frames();
      });
      const bottom = () => page.evaluate(() => document.querySelector('main').getBoundingClientRect().bottom - document.querySelector('#composer').getBoundingClientRect().top < 80);
      await page.locator('#latest').click(); await page.evaluate(() => window.frames());
      assert.equal(await bottom(), true);
      await page.evaluate(async () => { window.scrollTo(0, 300); await window.frames(); });
      const olderPosition = await page.evaluate(() => scrollY);
      assert.equal(await bottom(), false);
      await page.evaluate(async () => { window.events(Array.from({ length: 8 }, (_, i) => window.line(`BACKGROUND:${i}`))); await window.frames(); });
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - olderPosition) < 3, 'older output keeps its scroll position');
      await page.locator('#latest').click(); await page.evaluate(() => window.frames());
      assert.equal(await bottom(), true);
      await page.evaluate(async () => { window.events(Array.from({ length: 128 }, (_, i) => window.line(`FOLLOW:${i}`))); await window.frames(); });
      assert.equal(await bottom(), true, 'pinned output follows subsequent batches');
      await page.evaluate(async () => {
        window.scrollTo(0, 300); await window.frames();
        document.querySelector('#input').value = '1'; document.querySelector('form').requestSubmit();
        window.events([window.line('AFTER DELIBERATE INPUT')]); window.waiting(6); await window.frames();
      });
      assert.equal(await bottom(), true, 'deliberate input resumes follow');
      assert.deepEqual(errors, []);
      const median = key => samples.map(sample => sample[key]).sort((a, b) => a - b)[1];
      const report = { engine, browserVersion: browser.version(), label, passed: true, actualIPhone: false,
        workload: '10240 rows / 80 batches; 1 warmup + 3 samples; UI-only mock Worker; 390x844',
        bundleSha256: createHash('sha256').update(await readFile(new URL('./dist/browser.js', import.meta.url))).digest('hex'),
        median: Object.fromEntries(['elapsedMs', 'handlerTotalMs', 'handlerP95Ms', 'mainReads', 'composerReads', 'createdElements', 'buttonQueries', 'scrolls', 'elements'].map(key => [key, median(key)])), samples };
      await writeFile(new URL(`./results/render-${label}-${engine}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
      console.log({ engine, label, median: report.median });
    } finally {
      await browser?.close();
      await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
  });
}
