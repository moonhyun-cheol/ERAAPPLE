// Reproducible, isolated Node measurements; not iPhone/WebKit memory telemetry.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { inventory, gameFiles, sha } from './inventory.mjs';
import { externalFor } from './fixture.mjs';
const variant = process.argv[2];
if (!variant) {
  const results = {};
  for (const name of ['eager', 'deferred']) {
    results[name] = JSON.parse(execFileSync(process.execPath, ['--expose-gc', fileURLToPath(import.meta.url), name],
      { encoding: 'utf8', maxBuffer: 1024 * 1024 }));
  }
  assert.equal(results.eager.originalDigest, results.deferred.originalDigest);
  assert.deepEqual(results.eager.checkpoints.map(s => [s.day, s.saves]), results.deferred.checkpoints.map(s => [s.day, s.saves]), 'same seed/input must yield byte-identical compact saves');
  for (let i = 0; i < results.eager.checkpoints.length; i++) {
    assert.ok(results.deferred.checkpoints[i].heapMiB < results.eager.checkpoints[i].heapMiB * 0.85, 'at least 15% retained-heap reduction');
  }
  const report = { passed: true, at: new Date().toISOString(), runtime: process.version, actualIPhone: false, actualBrowser: false,
    limitation: 'Fixed-seed new game, two characters, rest-only day 1/4/16 checkpoints after forced GC; not peak RSS, IndexedDB or user save reproduction.', results };
  await writeFile(new URL('./results/deferred-local-profile.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} else {
  assert.ok(['eager', 'deferred'].includes(variant)); assert.ok(global.gc);
  const engineFile = variant === 'eager' ? './dist/engine-save-only.mjs' : './dist/engine.mjs';
  const { compile } = await import(engineFile);
  const before = await inventory(); let source = await gameFiles(before.records);
  const vm = compile(source.files); source = null; vm.random.state = 42;
  const store = new Map(), generator = vm.start(externalFor(store));
  const checkpoints = []; let value = null, events = [], reached = false;
  for (let n = 0; n < 40000; n++) {
    const next = await generator.next(value); value = null;
    assert.equal(next.done, false);
    const event = next.value;
    if (!['input', 'wait', 'tinput'].includes(event.type)) { events.push(event); continue; }
    const buttons = events.flatMap(e => e.children ?? []).filter(c => c.type === 'button');
    if (event.type === 'wait') value = '';
    else if (event.type === 'tinput') value = null;
    else if (vm.contextStack.some(c => c.fn.name === 'START_CONFIGURATION')) value = buttons.some(b => b.value === '11') ? '11' : '1';
    else if (vm.contextStack.some(c => c.fn.name === 'CHARA_BUY_MAIN') && buttons.some(b => b.value === '1000')) value = vm.characterList.length < 2 ? '104' : '1000';
    else if (buttons.some(b => b.value === '200')) {
      const day = Number(vm.getValue('DAY').get(vm, []));
      if (vm.characterList.length < 2) value = '111';
      else {
        if ([1, 4, 16].includes(day) && !checkpoints.some(s => s.day === day)) {
          let total = 0, allocated = 0, elements = 0;
          for (const scope of vm.staticMap.values()) for (const name of ['LOCAL', 'LOCALS']) {
            const cell = scope.get(name); if (!cell) continue;
            total++;
            const descriptor = Object.getOwnPropertyDescriptor(cell, 'value');
            if ('value' in descriptor) { allocated++; elements += descriptor.value.length; }
          }
          global.gc();
          checkpoints.push({ day, characters: vm.characterList.length, heapMiB: process.memoryUsage().heapUsed / 2 ** 20,
            rssMiB: process.memoryUsage().rss / 2 ** 20, totalLocalCells: total, allocatedLocalCells: allocated,
            allocatedLocalElements: elements, stackDepth: vm.contextStack.length,
            saves: Object.fromEntries([...store].map(([key, data]) => [key, sha(data)])) });
        }
        if (day >= 16) { reached = true; break; }
        value = '102';
      }
    } else value = String(buttons[0]?.value ?? '0');
    events = [];
  }
  assert.ok(reached); assert.deepEqual(checkpoints.map(s => s.day), [1, 4, 16]);
  await generator.return();
  assert.equal((await inventory()).originalDigest, before.originalDigest);
  console.log(JSON.stringify({ variant, engineSha256: sha(await readFile(new URL(engineFile, import.meta.url))), originalDigest: before.originalDigest, checkpoints }));
}
