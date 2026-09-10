// Lightweight startup/reload timing probe for the served pwa-dist worker bundle.
// Isolates one-time compile + first-input latency so worker overlay changes can be
// attributed (not a game test). Usage: node startup-probe.mjs [chromium|webkit] [label]
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import * as playwright from 'playwright';
import { createStaticServer } from './serve-pwa.mjs';

const engine = process.argv[2] || 'chromium';
const label = process.argv[3] || engine;
const launcher = playwright[engine];

const server = createStaticServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const url = `http://127.0.0.1:${server.address().port}/iphone-test/`;
const browser = await launcher.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', e => errors.push(e.message));

const firstInput = async () => {
  await page.waitForFunction(() => {
    const s = document.querySelector('#status');
    return s && (s.textContent === '입력 대기' || /실패|종료/.test(s.textContent));
  });
  return page.evaluate(() => ({ status: document.querySelector('#status').textContent,
    error: document.querySelector('#error').textContent }));
};

try {
  const t0 = Date.now();
  await page.goto(url);
  await page.locator('#game-start').click();
  const first = await firstInput();
  const startupMs = Date.now() - t0;

  const t1 = Date.now();
  await page.reload();
  await page.locator('#game-start').click();
  await firstInput();
  const reloadMs = Date.now() - t1;

  const report = { engine, label, startupMs, reloadMs, firstStatus: first.status, firstError: first.error, pageErrors: errors };
  await writeFile(new URL(`./results/startup-${label}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  server.close();
}
