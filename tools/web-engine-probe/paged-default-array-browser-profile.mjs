// Isolated browser timing judgment for hybrid paged storage. This does not
// modify or load the release/PWA engine.
import http from 'node:http';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const source = await readFile(new URL('./paged-default-array.mjs', import.meta.url));
const server = http.createServer((req, res) => {
  if (req.url === '/paged-default-array.mjs') {
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }).end(source);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }).end('<!doctype html><meta charset="utf-8"><title>paged profile</title>');
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;

const results = {};
try {
  for (const [name, launcher] of Object.entries({ chromium, webkit })) {
    let browser;
    try {
      browser = await launcher.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(origin);
      results[name] = await page.evaluate(async () => {
        const { createPagedArray } = await import('/paged-default-array.mjs');
        const rows = 400, columns = 256, zero = 0n;
        const entries = Array.from({ length: 103 }, (_, i) => {
          const linear = Math.floor(i * rows * columns / 103);
          return [Math.floor(linear / columns), linear % columns, BigInt(linear + 1)];
        });
        const buildBase = () => {
          const value = Array.from({ length: rows }, () => new Array(columns).fill(zero));
          for (const [r, c, v] of entries) value[r][c] = v;
          return value;
        };
        const buildPaged = () => {
          const value = createPagedArray([rows, columns], zero);
          for (const [r, c, v] of entries) value[r][c] = v;
          return value;
        };
        const sumIndex = value => {
          let sum = 0n;
          for (let r = 0; r < value.length; r++) for (let c = 0; c < value[r].length; c++) sum += value[r][c];
          return sum;
        };
        const sumIterate = value => {
          let sum = 0n;
          for (const row of value) for (const item of row) sum += item;
          return sum;
        };
        const bench = fn => {
          fn();
          let iterations = 0;
          const start = performance.now();
          let now;
          do { fn(); iterations++; now = performance.now(); } while (now - start < 40);
          return (now - start) / iterations;
        };
        const base = buildBase(), paged = buildPaged();
        const expected = sumIndex(base);
        if (sumIndex(paged) !== expected || sumIterate(paged) !== expected) throw new Error('browser traversal mismatch');
        const replacer = (_key, value) => typeof value === 'bigint' ? value.toString() : value;
        if (JSON.stringify(base, replacer) !== JSON.stringify(paged, replacer)) throw new Error('browser serialization mismatch');
        const pair = (baseFn, pagedFn) => {
          const baseMs = bench(baseFn), pagedMs = bench(pagedFn);
          return { baseMs, pagedMs, ratio: pagedMs / baseMs };
        };
        return {
          userAgent: navigator.userAgent,
          shape: [rows, columns], density: entries.length / (rows * columns),
          readIndex: pair(() => sumIndex(base), () => sumIndex(paged)),
          readIterate: pair(() => sumIterate(base), () => sumIterate(paged)),
          build: pair(buildBase, buildPaged),
          memory: performance.memory?.usedJSHeapSize == null
            ? { available: false, reason: 'precise JS heap telemetry is not exposed by this browser context' }
            : { available: true, usedJSHeapSize: performance.memory.usedJSHeapSize }
        };
      });
      results[name].status = 'measured';
    } catch (error) {
      results[name] = { status: 'unavailable', error: String(error?.message ?? error).split('\n')[0] };
    } finally {
      await browser?.close();
    }
  }
} finally {
  server.close();
}

const measured = Object.values(results).filter(result => result.status === 'measured').length;
const report = {
  passed: measured > 0,
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  measured, results,
  limitations: [
    'Synthetic 2-D sparse BigInt workload, not the full game VM or iPhone RSS.',
    'Wall-clock medians are promotion signals and vary by host/browser JIT.',
    'Browser heap is reported only when the engine exposes performance.memory; absence is recorded rather than estimated.'
  ]
};
await writeFile(new URL('./results/paged-default-array-browser-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
