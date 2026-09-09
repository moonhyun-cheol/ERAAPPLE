import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Read-only health check for the local PWA preview (does not start/stop processes).
const base = process.argv[2] ?? 'http://127.0.0.1:4175/iphone-test/';
const results = [];
for (const name of ['index.html', 'pwa-build.json', 'sw.js']) {
  const url = name === 'index.html' ? base : new URL(name, base).href;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, `${url}: expected HTTP 200`);
  const actual = Buffer.from(await response.arrayBuffer());
  const expected = await readFile(new URL(`./pwa-dist/${name}`, import.meta.url));
  assert.ok(actual.equals(expected), `${name}: response differs from local build`);
  results.push({ url, status: response.status, bytes: actual.length, matchesLocalBuild: true });
}
console.log(JSON.stringify({ ok: true, results }, null, 2));
