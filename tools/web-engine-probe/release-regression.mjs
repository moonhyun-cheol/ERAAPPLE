// Sequential, fail-closed acceptance for one rebuilt release. No deployment or user storage.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { verifyRelease } from './verify-release.mjs';
import { sha } from './inventory.mjs';
const here = new URL('./', import.meta.url);
const started = new Date().toISOString();
const logDir = new URL(`results/release-${started.replace(/[:.]/g, '-')}/`, here);
await mkdir(logDir, { recursive: true });
const reportPath = new URL('results/save-memory-release-verification.json', here);
const report = { passed: false, started, node: process.version, platform: process.platform,
  chromiumChannel: process.env.PROBE_BROWSER_CHANNEL || 'playwright-chromium', actualIPhone: false,
  published: false, knownLimitations: ['WebKit browser-offline toggle is not certified; server-stop is a separate path.',
    'Desktop automation is not iOS home-screen process termination testing.', 'Node sampled save heap is not peak RSS or IndexedDB memory.'], steps: [] };
const persist = () => writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
await persist(); // Never leave a stale successful summary after a failed new run.
const baseEnv = { ...process.env };
for (const key of Object.keys(baseEnv)) if (/^(PROBE_|PWA_)/.test(key) && key !== 'PROBE_BROWSER_CHANNEL') delete baseEnv[key];
baseEnv.PROBE_QUIET = '1';
async function run(id, args, overrides = {}, outputs = []) {
  console.log('START ' + id);
  const start = Date.now();
  const result = spawnSync(process.execPath, args, { cwd: fileURLToPath(here), env: { ...baseEnv, ...overrides },
    encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  const log = (result.stdout || '') + '\n' + (result.stderr || '');
  const logPath = new URL(id + '.log', logDir);
  await writeFile(logPath, log);
  const count = Number(/^# tests (\d+)$/m.exec(log)?.[1] || 0);
  const step = { id, args, env: overrides, exitCode: result.status, signal: result.signal, error: result.error?.message,
    elapsedMs: Date.now() - start, tests: count, log: fileURLToPath(logPath), logSha256: sha(log), outputs: {} };
  report.steps.push(step); await persist();
  assert.equal(result.status, 0, id + ' failed: ' + log.slice(-7000));
  if (args.includes('--test')) {
    assert.ok(count > 0, id + ' ran no tests');
    for (const label of ['fail', 'cancelled', 'skipped', 'todo']) assert.match(log, new RegExp('^# ' + label + ' 0$', 'm'));
  }
  for (const name of outputs) step.outputs[name] = sha(await readFile(new URL('results/' + name, here)));
  await persist(); console.log(`PASS ${id} (${count} tests, ${step.elapsedMs} ms)`);
}
const tests = (...files) => ['--test', '--test-concurrency=1', '--test-reporter=tap', '--test-timeout=520000', ...files];
try {
  await run('build', ['build.mjs']);
  await run('package', ['build-pwa.mjs']);
  report.integrity = await verifyRelease(); await persist();
  await run('unit-server', tests('test.mjs', 'input-gate-test.mjs', 'serve-pwa-test.mjs'));
  await run('deferred-local', tests('deferred-local-test.mjs'));
  await run('save-trace', tests('compact-save-test.mjs', 'runtime-trace-test.mjs', 'm1-harness-test.mjs', 'vm-structure-test.mjs', 'compact-function-ir-test.mjs'), {}, ['save-compatibility.json', 'save-trace-chromium.json', 'save-trace-webkit.json']);
  await run('runtime', tests('runtime-browser-test.mjs'), {}, ['runtime-chromium.json', 'runtime-webkit.json']);
  await run('render', tests('render-performance-test.mjs'), {}, ['render-optimized-chromium.json', 'render-optimized-webkit.json']);
  await run('days', tests('day-browser-test.mjs'), {}, ['day-chromium.json', 'day-webkit.json']);
  await run('browser', tests('browser-test.mjs'), {}, ['browser.json']);
  for (const engine of ['chromium', 'webkit']) {
    const env = { PROBE_BROWSER_ENGINE: engine, PROBE_OFFLINE_MODE: engine === 'webkit' ? 'server-stop' : 'browser-offline' };
    await run('backup-' + engine, tests('backup-test.mjs'), env, [`backup-unit-${engine}.json`]);
    await run('game-' + engine, tests('game-browser-test.mjs'), env, [`game-browser-${engine}.json`]);
    await run('mobile-' + engine, tests('mobile-wait-test.mjs'), env, [`mobile-wait-${engine}.json`]);
    await run('pwa-' + engine, tests('pwa-test.mjs'), env, [`pwa-${engine}${engine === 'webkit' ? '-server-stop' : ''}.json`]);
    await run('pwa-game-' + engine, tests('pwa-game-test.mjs'), env, [`pwa-game-${engine}-${env.PROBE_OFFLINE_MODE}.json`]);
  }
  await run('save-profile', ['--expose-gc', 'save-memory-profile.mjs'], {}, ['save-memory-profile.json']);
  await run('deferred-profile', ['--expose-gc', 'deferred-local-profile.mjs'], {}, ['deferred-local-profile.json']);
  assert.deepEqual(await verifyRelease(), report.integrity, 'release/source changed during acceptance');
  report.passed = true;
  report.tests = report.steps.reduce((n, step) => n + step.tests, 0);
} catch (error) {
  report.error = error.stack; process.exitCode = 1; console.error(error);
} finally {
  report.finished = new Date().toISOString(); await persist();
  console.log(JSON.stringify({ passed: report.passed, release: report.integrity?.release, tests: report.tests,
    report: fileURLToPath(reportPath), error: report.error }, null, 2));
}
