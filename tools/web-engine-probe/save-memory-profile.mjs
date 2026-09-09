// Compare isolated Node processes, same first-shop state and save command.
// Sampled heap deltas are NOT an iPhone peak/RSS estimate. No user saves touched.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { inventory, gameFiles } from './inventory.mjs';
import { externalFor } from './fixture.mjs';
const variant = process.argv[2];
if (!variant) {
  const results = {};
  for (const name of ['legacy', 'compact']) {
    const output = execFileSync(process.execPath, ['--expose-gc', fileURLToPath(import.meta.url), name], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    results[name] = JSON.parse(output);
  }
  assert.ok(results.compact.samples[0].bytes < results.legacy.samples[0].bytes / 10);
  assert.equal(results.compact.originalDigest, results.legacy.originalDigest);
  const report = { passed: true, runtime: process.version, actualIPhone: false, actualBrowser: false,
    limitation: '3 warmed serializations at the first real-game shop. Heap sampled before command / at setSavedata; not true peak, not IndexedDB, not a long-running save.', results };
  await writeFile(new URL('./results/save-memory-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} else {
  const { compile } = await import(variant === 'legacy' ? './dist/engine-legacy.mjs' : './dist/engine.mjs');
  const before = await inventory(); let source = await gameFiles(before.records);
  source.files.set('MEMORY_PROBE.ERB', '@MEMORY_PROBE\nSAVEDATA 0, "memory probe"\nRETURN\n');
  const vm = compile(source.files); source = null;
  let lastSave, measuring = false, sample, beforeHeap, started;
  const external = { ...externalFor(new Map()), setSavedata: async (key, value) => {
    if (measuring) sample = { bytes: Buffer.byteLength(value), elapsedMs: performance.now() - started,
      heapBeforeMiB: beforeHeap / 2 ** 20, heapAtStorageMiB: process.memoryUsage().heapUsed / 2 ** 20,
      heapDeltaMiB: (process.memoryUsage().heapUsed - beforeHeap) / 2 ** 20 };
    lastSave = value; // only last string, no accumulation of rotating autosaves
  } };
  const generator = vm.start(external);
  let input = null, events = [], reached = false;
  for (let n = 0; n < 10000; n++) {
    const next = await generator.next(input); input = null;
    assert.ok(!next.done);
    const event = next.value;
    if (!['input', 'wait', 'tinput'].includes(event.type)) { events.push(event); continue; }
    const buttons = events.flatMap(e => e.children ?? []).filter(c => c.type === 'button');
    if (event.type === 'input' && buttons.some(b => b.value === '200')) { reached = true; break; }
    if (event.type === 'wait') input = '';
    else if (event.type === 'tinput') input = null;
    else if (vm.contextStack.some(c => c.fn.name === 'START_CONFIGURATION')) input = buttons.some(b => b.value === '11') ? '11' : '1';
    else input = String(buttons[0]?.value ?? '0');
    events = [];
  }
  assert.ok(reached && lastSave, 'real game reaches shop with autosave');
  const samples = [];
  for (let i = 0; i < 4; i++) {
    lastSave = null; global.gc();
    beforeHeap = process.memoryUsage().heapUsed; started = performance.now(); measuring = true;
    const command = vm.fnMap.get('MEMORY_PROBE').run(vm, []);
    assert.equal((await command.next()).done, true);
    measuring = false;
    if (i) samples.push(sample); // exclude warmup
  }
  const parsed = JSON.parse(lastSave);
  const largest = Object.entries(parsed.data.variables).map(([name, value]) => ({ name, bytes: Buffer.byteLength(JSON.stringify(value)) })).sort((a, b) => b.bytes - a.bytes).slice(0, 12);
  assert.equal((await inventory()).originalDigest, before.originalDigest);
  console.log(JSON.stringify({ variant, samples, largest, characters: vm.characterList.length, originalDigest: before.originalDigest }));
  await generator.return();
}
