// One-off smoke check: does the packaged '에라마왕 개조판 1.28' PWA bundle actually load,
// compile and render its title in a real browser (Chromium, mobile viewport)?
// Points at an already-running serve-pwa instance. Read-only; writes only a results JSON + screenshot.
import { writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const url = process.env.SMOKE_URL ?? 'http://127.0.0.1:4174/iphone-test/';
const engineName = process.env.PROBE_BROWSER_ENGINE ?? 'chromium';
const gameId = process.env.SMOKE_GAME ?? 'eramaou128';
const errors = [], externalRequests = [];
const origin = new URL(url).origin;
const browser = await (engineName === 'webkit' ? webkit : chromium).launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(60000);
page.on('pageerror', e => errors.push(e.message));
context.on('request', r => { if (!r.url().startsWith(origin + '/')) externalRequests.push(r.url()); });
const result = { game: gameId, engine: engineName, url, startedAt: new Date().toISOString() };
try {
  await page.goto(url);
  await page.locator(`#game-menu button[data-game="${gameId}"]`).click();
  // Wait until the title actually rendered and the engine is waiting for the first menu input.
  await page.waitForFunction(() => document.querySelector('#status')?.textContent === '입력 대기'
    && document.querySelector('#output')?.innerText.trim().length > 0);
  const output = (await page.locator('#output').innerText()).trim();
  const buttons = await page.locator('#output button').allInnerTexts();
  result.status = await page.locator('#status').textContent();
  result.outputHead = output.slice(0, 400);
  result.outputLength = output.length;
  result.menuButtons = buttons.slice(0, 20);
  await page.screenshot({ path: new URL(`./results/pwa-${gameId}-${engineName}.png`, import.meta.url).pathname.replace(/^\//, ''), fullPage: true });
  result.rendered = output.length > 0;
  result.pageErrors = errors;
  result.externalRequests = externalRequests;
  result.passed = result.rendered && errors.length === 0 && externalRequests.length === 0;
} catch (error) {
  result.passed = false;
  result.error = { name: error.name, message: error.message };
  result.pageErrors = errors;
  try { result.outputHead = (await page.locator('#output').innerText()).trim().slice(0, 400); } catch { /* ignore */ }
  try { result.errorBox = (await page.locator('#error').innerText()).trim().slice(0, 400); } catch { /* ignore */ }
} finally {
  await writeFile(new URL(`./results/pwa-${gameId}-${engineName}.json`, import.meta.url), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  await context.close();
  await browser.close();
}
