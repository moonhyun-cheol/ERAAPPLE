// Focused regressions for the dungeon compatibility audit. Includes the actual
// DUNGEON_INFO2 source flow plus every game-used notImpl/bar-rendering sibling.
// In-memory store only; no engine/game/baseline writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { compile } from './dist/engine.mjs';
import { externalFor } from './fixture.mjs';
import { loadGameSource } from '../../server/game-source.mjs';

async function drive(body, { inputs = [] } = {}) {
  const files = new Map([['HARNESS.ERB', `@SYSTEM_TITLE\n${body}\nQUIT\n`]]);
  const vm = compile(files);
  const gen = vm.start(externalFor(new Map()));
  let next = null, output = '', waits = 0, used = 0;
  try {
    for (let n = 0; n < 2000; n++) {
      const step = await gen.next(next);
      next = null;
      if (step.done) return { output, waits, used };
      const ev = step.value;
      if (ev.type === 'content') {
        output += ev.children.map(c => c.text ?? '').join('') + '\n';
      } else if (ev.type === 'input' || ev.type === 'tinput') {
        next = String(inputs[used++] ?? '999');
      } else if (ev.type === 'wait') {
        waits++;
        next = '';
      }
    }
    throw new Error('bounded runtime exceeded');
  } finally { await gen.return(); }
}

test('BARSTR clamps an over-max value instead of throwing "Invalid count value"', async () => {
  // value(15) > max(10), length 8 => native code would repeat(-N) and throw.
  const r = await drive('PRINTFORML [%BARSTR(15, 10, 8)%]');
  assert.match(r.output, /\[\[\*{8}\]\]/, 'full bar (8 filled, 0 empty)');
});

test('BARSTR treats a negative value as an empty bar', async () => {
  const r = await drive('PRINTFORML [%BARSTR(-5, 10, 8)%]');
  assert.match(r.output, /\[\[\.{8}\]\]/, 'empty bar (0 filled, 8 empty)');
});

test('BARSTR treats max<=0 as an empty bar (no division by zero)', async () => {
  const r = await drive('PRINTFORML [%BARSTR(5, 0, 8)%]');
  assert.match(r.output, /\[\[\.{8}\]\]/, 'empty bar for max=0');
});

test('BARSTR still renders a normal in-range ratio', async () => {
  const r = await drive('PRINTFORML [%BARSTR(5, 10, 8)%]');
  assert.match(r.output, /\[\[\*{4}\.{4}\]\]/, 'half bar (4 filled, 4 empty)');
});

test('WAITANYKEY blocks for a key instead of throwing notImpl', async () => {
  const r = await drive('PRINTL A\nWAITANYKEY\nPRINTL B');
  assert.ok(r.waits >= 1, 'emitted a wait event');
  assert.match(r.output, /A[\s\S]*B/, 'execution continued past WAITANYKEY');
});

test('BAR/BARL clamp over-max, negative, and zero-max values', async () => {
  const r = await drive([
    'PRINT [',
    'BAR 15, 10, 8',
    'PRINTL ]',
    'PRINT [',
    'BARL -5, 10, 8',
    'PRINTL ]',
    'PRINT [',
    'BAR 5, 0, 8',
    'PRINTL ]',
  ].join('\n'));
  assert.match(r.output, /\[\[\*{8}\]\]/, 'over-max BAR is full');
  assert.match(r.output, /\[\[\.{8}\]\]/, 'negative/zero-max bars are empty');
});

test('statement BARSTR uses the same safe range and writes RESULTS', async () => {
  const r = await drive('BARSTR 15, 10, 8\nPRINTFORML S:%RESULTS%');
  assert.match(r.output, /S:\[\*{8}\]/);
});

test('PRINT_PALAM renders a negative game value without native repeat failure', async () => {
  const files = new Map([
    ['PALAM.CSV', '0,Test\n'],
    ['CHARA0.CSV', '番号,0\n名前,Test\n'],
    ['HARNESS.ERB', '@SYSTEM_TITLE\nADDCHARA 0\nTARGET = 0\nPALAM:0 = -5\nPRINT_PALAM 0\nQUIT\n'],
  ]);
  const vm = compile(files);
  const gen = vm.start(externalFor(new Map()));
  let output = '';
  for (let n = 0; n < 200; n++) {
    const step = await gen.next();
    if (step.done) break;
    if (step.value.type === 'content') output += step.value.children.map(c => c.text ?? '').join('') + '\n';
  }
  assert.match(output, /\[\.{10}\]-5/);
});

test('FORCEWAIT emits a forced wait and resumes', async () => {
  const r = await drive('PRINTL A\nFORCEWAIT\nPRINTL B');
  assert.equal(r.waits, 1);
  assert.match(r.output, /A[\s\S]*B/);
});

test('ADDVOIDCHARA appends a writable zero-initialized character', async () => {
  const r = await drive('ADDVOIDCHARA\nNO:0 = 77\nPRINTFORML C:{CHARANUM}:{NO:0}');
  assert.match(r.output, /C:1:77/);
});

test('actual DUNGEON_INFO2 warning wait, trap selection, assignment, and exit complete', async () => {
  const gameDir = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));
  const { files } = await loadGameSource(gameDir);
  // Added last: VM uses the last non-event function definition, so this replaces
  // only SYSTEM_TITLE while preserving the real DUNGEON_INFO2 and its callees.
  files.set('ZZ_DUNGEON_AUDIT.ERB', `@SYSTEM_TITLE
ITEM:60 = 1
ITEM:61 = 1
ITEM:62 = 1
CALL DUNGEON_INFO2
PRINTFORML __TRAP__:{FLAG:300}:{FLAG:310}:{FLAG:320}
QUIT
`);
  const vm = compile(files);
  const gen = vm.start(externalFor(new Map()));
  const answers = [
    '60',             // no selection: one intentional warning
    '111', '60',      // select A/1F, install trap 60
    '111', '112', '61', // clear A, select B/1F, install trap 61
    '112', '113', '62', // clear B, select C/1F, install trap 62
    '999',
  ];
  let input = null, used = 0, waits = 0, output = '';
  try {
    for (let n = 0; n < 10000; n++) {
      const step = await gen.next(input);
      input = null;
      if (step.done) break;
      const event = step.value;
      if (event.type === 'content') output += event.children.map(c => c.text ?? '').join('') + '\n';
      else if (event.type === 'wait') { waits++; input = ''; }
      else if (event.type === 'input' || event.type === 'tinput') input = answers[used++];
    }
  } finally { await gen.return(); }
  assert.equal(used, answers.length, 'warning, selection, install, and exit inputs consumed');
  assert.equal(waits, 1, 'only the no-target action warns; A/B/C selections are all recognized');
  assert.equal(vm.globalMap.get('FLAG').get(vm, [300]), 60n, 'trap 60 installed in floor 1 / column A');
  assert.equal(vm.globalMap.get('FLAG').get(vm, [310]), 61n, 'trap 61 installed in floor 1 / column B');
  assert.equal(vm.globalMap.get('FLAG').get(vm, [320]), 62n, 'trap 62 installed in floor 1 / column C');
  assert.match(output, /__TRAP__:60:61:62/, 'actual function returned to its caller');
});
