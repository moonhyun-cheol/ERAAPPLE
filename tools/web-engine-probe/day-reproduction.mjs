import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { compile } from './dist/engine.mjs';
import { inventory, gameFiles } from './inventory.mjs';
import { externalFor, textOf } from './fixture.mjs';

const source = await gameFiles((await inventory()).records);
const vm = compile(source.files), store = new Map();
const generator = vm.start(externalFor(store));
let value = null, events = [], rests = 0, steps = [], finalDay = 0;
try {
  for (let n = 0; n < 20000; n++) {
    const next = await generator.next(value); value = null;
    assert.equal(next.done, false, 'game unexpectedly ended');
    const event = next.value;
    if (!['input', 'wait', 'tinput'].includes(event.type)) { events.push(event); continue; }
    const text = textOf(events);
    const buttons = events.flatMap(e => e.children ?? []).filter(c => c.type === 'button');
    const day = Number(vm.getValue('DAY').get(vm, [])), time = Number(vm.getValue('TIME').get(vm, []));
    if (event.type === 'wait') value = '';
    else if (event.type === 'tinput') value = null;
    else if (vm.contextStack.some(c => c.fn.name === 'START_CONFIGURATION')) value = buttons.some(b => b.value === '11') ? (process.env.PROBE_CONFIG ?? '11') : '1';
    else if (vm.contextStack.some(c => c.fn.name === 'CHARA_BUY_MAIN') && buttons.some(b => b.value === '1000')) value = vm.characterList.length < 2 ? '104' : '1000';
    else if (buttons.some(b => b.value === '200')) {
      if (vm.characterList.length < 2) value = '111';
      else { value = '102'; rests++; }
    }
    else value = String(buttons[0]?.value ?? (event.numeric ? '0' : '웹시험'));
    const step = { type: event.type, day, time, rests, value, stack: vm.contextStack.map(c => c.fn.name), tail: text.slice(-350) };
    steps.push(step); finalDay = day;
    if (process.env.PROBE_QUIET !== '1') console.log(JSON.stringify(step));
    events = [];
    if (rests >= 31) break;
  }
  assert.ok(rests >= 31 && finalDay >= 16, 'must pass multiple full days');
  const report = { passed: true, finalDay, rests, storageKeys: [...store.keys()],
    actualBrowser: false, actualIPhone: false, steps };
  await writeFile(new URL('./results/day-reproduction.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, finalDay, rests }));
} catch (error) {
  const report = { error: { message: error.message, file: error.line?.file, line: error.line?.line + 1, trace: error.trace }, steps };
  await writeFile(new URL('./results/day-reproduction.json', import.meta.url), JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report.error)); process.exitCode = 1;
} finally { await generator.return(); }
