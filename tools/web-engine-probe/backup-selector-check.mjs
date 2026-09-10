// One-off UI check: does the backup game selector populate from games.json with both games?
// Points at a running serve-pwa. Read-only.
import { chromium } from 'playwright';

const url = process.env.SMOKE_URL ?? 'http://127.0.0.1:4174/iphone-test/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const result = {};
try {
  await page.goto(url);
  await page.locator('#backup-help summary').click();
  await page.waitForFunction(() => document.querySelector('#backup-game')?.options.length > 1);
  result.options = await page.locator('#backup-game option').evaluateAll(
    els => els.map(el => ({ value: el.value, label: el.textContent })));
  result.hidden = await page.locator('#backup-game').evaluate(el => el.hidden);
  result.pageErrors = errors;
  result.passed = result.options.length === 2 && errors.length === 0;
} catch (error) {
  result.passed = false;
  result.error = { name: error.name, message: error.message };
  result.pageErrors = errors;
} finally {
  console.log(JSON.stringify(result, null, 2));
  await context.close();
  await browser.close();
}
