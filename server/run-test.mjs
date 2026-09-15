// Headless verification of the always-on supervisor (server/run.mjs), plan §9.
// No browser, no network: we point the supervisor at a throwaway child via ERA_SUPERVISOR_ENTRY
// and observe respawn / crash-loop-cap / clean-shutdown behaviour by watching a counter file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUN = fileURLToPath(new URL('./run.mjs', import.meta.url));

async function makeSandbox() {
  const dir = await mkdtemp(path.join(tmpdir(), 'era-run-'));
  const counter = path.join(dir, 'starts.log');
  // Throwaway child: record one start, then exit non-zero immediately (a "crash").
  const child = path.join(dir, 'crasher.mjs');
  await writeFile(child, [
    "import { appendFileSync } from 'node:fs';",
    `appendFileSync(${JSON.stringify(counter)}, 'x\\n');`,
    'process.exit(1);'
  ].join('\n'));
  return { dir, counter, child };
}

async function countStarts(counter) {
  try { return (await readFile(counter, 'utf8')).split('\n').filter(Boolean).length; }
  catch { return 0; }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

test('run.mjs respawns a crashed child, then stops cleanly on SIGTERM without restarting', async () => {
  const { dir, counter, child } = await makeSandbox();
  const sup = spawn(process.execPath, [RUN], {
    stdio: 'ignore',
    env: {
      ...process.env,
      ERA_SUPERVISOR_ENTRY: child,
      ERA_SUPERVISOR_BACKOFF_MS: '30',
      ERA_SUPERVISOR_MAX_BACKOFF_MS: '30',
      ERA_SUPERVISOR_HEALTHY_MS: '100000', // never "healthy" → every exit is a fast fail
      ERA_SUPERVISOR_MAX_FAST_FAILS: '50'  // high cap so it keeps respawning during the window
    }
  });
  const exited = new Promise((resolve) => sup.on('exit', (c, s) => resolve({ c, s })));

  // Wait until it has respawned several times.
  const deadline = Date.now() + 4000;
  while (await countStarts(counter) < 3 && Date.now() < deadline) await delay(50);
  const startsBeforeStop = await countStarts(counter);
  assert.ok(startsBeforeStop >= 3, `expected >=3 respawns, saw ${startsBeforeStop}`);

  // Clean shutdown: supervisor must exit and must not spawn any further children.
  sup.kill('SIGTERM');
  await exited;
  const settled = await countStarts(counter);
  await delay(200);
  const after = await countStarts(counter);
  assert.equal(after, settled, 'no child should be spawned after SIGTERM');

  await rm(dir, { recursive: true, force: true });
});

test('run.mjs gives up (exits 1) when fast failures exceed the crash-loop cap', async () => {
  const { dir, child } = await makeSandbox();
  const sup = spawn(process.execPath, [RUN], {
    stdio: 'ignore',
    env: {
      ...process.env,
      ERA_SUPERVISOR_ENTRY: child,
      ERA_SUPERVISOR_BACKOFF_MS: '10',
      ERA_SUPERVISOR_MAX_BACKOFF_MS: '10',
      ERA_SUPERVISOR_HEALTHY_MS: '100000',
      ERA_SUPERVISOR_MAX_FAST_FAILS: '2' // gives up after 2 fast fails are exceeded
    }
  });
  const { c } = await new Promise((resolve) => sup.on('exit', (code, signal) => resolve({ c: code, signal })));
  assert.equal(c, 1, 'supervisor should exit 1 when the crash-loop cap is exceeded');
  await rm(dir, { recursive: true, force: true });
});
