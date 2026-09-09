// Focused actual-source regression tests. Not a native Emuera/full-game certification.
// All saves live in an in-memory Map. No player save, engine, baseline or PWA writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { compile } from './dist/engine.mjs';
import { externalFor } from './fixture.mjs';
import { root, sha, inventory, ordinal } from './inventory.mjs';

const game = '에라마왕 개조판 1.28';
const target = `${game}/ERB/ARCANA_FORT.ERB`;
const manifestURL = new URL('./results/eramaou-unit1-protected.json', import.meta.url);
const text = async p => (await readFile(path.join(root, p), 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const production = new Map();
for (const file of ['ARCANA_FORT.ERB', 'INVASION.ERB', 'TAX.ERB']) {
  production.set(file, await text(`${game}/ERB/${file}`));
}
// Exact original variable sizes; unrelated CSVs/game-wide functions are deliberately not loaded.
production.set('VARIABLESIZE.CSV', await text(`${game}/CSV/VARIABLESIZE.CSV`));
production.set('CHARA0.CSV', '番号,0\n名前,Test\n');
const oldTail = source => source.slice(source.indexOf('\t;포획 ３명')).split('\n; UNIT1_COMPLETION_BEGIN')[0].trimEnd();

async function protectedFiles() {
  const records = [];
  async function walk(relative) {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const file = relative + '/' + entry.name;
      assert.ok(!entry.isSymbolicLink());
      if (entry.isDirectory()) await walk(file);
      else if (file !== target) {
        const bytes = await readFile(path.join(root, file));
        records.push({ path: file, sha256: sha(bytes) });
      }
    }
  }
  await walk(game);
  await walk('tools/web-engine-probe/pwa-dist');
  for (const file of ['tools/web-engine-probe/results/original-inventory.json', 'tools/web-engine-probe/dist/engine.mjs']) {
    records.push({ path: file, sha256: sha(await readFile(path.join(root, file))) });
  }
  return records.sort((a, b) => ordinal(a.path, b.path));
}

if (process.argv.includes('--capture-protection')) {
  // One-time pre-edit record, exclusive creation: cannot silently replace an earlier reference.
  await writeFile(manifestURL, JSON.stringify({
    capturedAt: new Date().toISOString(),
    originalTargetSha256: sha(await readFile(path.join(root, target))),
    originalTailSha256: sha(oldTail(production.get('ARCANA_FORT.ERB'))),
    records: await protectedFiles()
  }, null, 2) + '\n', { flag: 'wx' });
  console.log('Pre-edit protected-file hashes recorded; original inventory was not regenerated.');
} else {
  const setup = ({ mask = 15, state = 0, conquered = 1, day = 1 } = {}) => `
ADDCHARA 0
MASTER = 0
TARGET = 0
ASSI = -1
FOR LOCAL, 0, 10000
    FLAG:LOCAL = LOCAL * 3 + 7
NEXT
FLAG:5 = 0
FLAG:9 = 0
FLAG:81 = 10000
FLAG:82 = ${conquered}
FLAG:83 = 0
FLAG:84 = 0
FLAG:86 = 0
FLAG:87 = 0
FLAG:88 = 0
FLAG:89 = 0
FLAG:90 = 0
FLAG:91 = 0
FLAG:92 = ${mask}
FLAG:97 = ${state}
MONEY = 12345
DAY:0 = 11
DAY:1 = 3
DAY:2 = ${day}
TIME:0 = 2
TIME:1 = 12
CFLAG:0:9 = 10
CFLAG:0:501 = 1
ABL:0:0 = 3
TALENT:0:0 = 1
BASE:0:0 = 600
MAXBASE:0:0 = 700
EXP:0:0 = 19
ITEM:100 = 17
SAVESTR:0 = Unit test
`;
  const snapshot = vm => structuredClone({
    globals: Object.fromEntries(['FLAG', 'MONEY', 'DAY', 'TIME', 'ITEM', 'ITEMSALES', 'SAVESTR', 'GLOBAL', 'GLOBALS', 'MASTER', 'TARGET', 'ASSI'].map(name => [name, vm.globalMap.get(name).value])),
    characters: vm.characterList.map(c => Object.fromEntries([...c.values].map(([name, value]) => [name, value.value])))
  });
  async function run({ config, call = 'INVASION', inputs = [], store = new Map(), load = false, sources = production, after = '', save = true } = {}) {
    const body = `PRINTL __BEFORE__
WAIT
${call ? `CALL ${call}` : 'RESULT = 0'}
PRINTFORML __RETURN__:{RESULT}
${after}
PRINTL __AFTER__
WAIT
${save ? 'SAVEDATA 0, "isolated-unit-test"' : ''}
QUIT\n`;
    const harness = load ? `@SYSTEM_TITLE\nLOADDATA 0\nQUIT\n@SYSTEM_LOADEND\n${body}` : `@SYSTEM_TITLE\n${setup(config)}\n${body}`;
    const files = new Map([...sources, ['HARNESS.ERB', harness + '\n@VITAL_BAR\nRETURN 0\n']]);
    const vm = compile(files);
    const gen = vm.start(externalFor(store));
    let next = null, before, result, currentText = '', used = 0;
    const afterStates = [];
    try {
      for (let n = 0; n < 3000; n++) {
        const step = await gen.next(next);
        next = null;
        if (step.done) {
          assert.equal(used, inputs.length, 'all expected menu inputs consumed');
          assert.ok(before && afterStates.length, 'harness reached both state markers');
          return { before, after: afterStates.at(-1), store, result, output: currentText, used };
        }
        const event = step.value;
        if (event.type === 'content') {
          const line = event.children.map(c => c.text ?? '').join('');
          currentText += line + '\n';
          if (line.includes('__BEFORE__')) before = snapshot(vm);
          if (line.includes('__AFTER__')) afterStates.push(snapshot(vm));
          const match = /__RETURN__:(-?\d+)/.exec(line);
          if (match) result = Number(match[1]);
        } else if (event.type === 'input' || event.type === 'tinput') {
          assert.ok(used < inputs.length, 'unexpected extra menu input');
          next = String(inputs[used++]);
        } else if (event.type === 'wait') next = '';
      }
      throw new Error('bounded runtime exceeded');
    } finally { await gen.return(); }
  }
  function unchangedExceptState(result, state = Number(result.before.globals.FLAG[97])) {
    const expected = structuredClone(result.before);
    expected.globals.FLAG[97] = BigInt(state);
    assert.deepEqual(result.after, expected, 'persistent world/character state preserved except reserved slot');
    assert.equal(result.result, 0, 'same no-extra-turn return contract as the original completion stub');
  }

  test('protected game files, existing saves, PWA and baseline bytes are unchanged', async () => {
    const before = JSON.parse(await readFile(manifestURL, 'utf8'));
    assert.deepEqual(await protectedFiles(), before.records);
    assert.equal(sha(oldTail(production.get('ARCANA_FORT.ERB'))), before.originalTailSha256, 'legacy battle/reward code preserved');
    const bytes = await readFile(path.join(root, target));
    assert.ok(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), 'keep UTF-8 BOM for native Emuera');
    const baseline = JSON.parse(await readFile(new URL('./results/original-inventory.json', import.meta.url), 'utf8'));
    const now = await inventory();
    assert.equal(now.records.length, 1151);
    assert.deepEqual(now.records, baseline.records);
    assert.equal(now.originalDigest, baseline.originalDigest);
  });

  test('all incomplete masks and missing prerequisite block the new helper', async () => {
    for (let mask = 0; mask < 15; mask++) {
      const r = await run({ config: { mask }, call: 'ARCANA_FORT_COMPLETE', save: false });
      unchangedExceptState(r);
    }
    unchangedExceptState(await run({ config: { conquered: 0 }, call: 'ARCANA_FORT_COMPLETE' }));
  });

  test('real caller hides expanded route before prerequisite and preserves cancellation', async () => {
    const r = await run({ config: { conquered: 0 }, inputs: [4, 999] });
    unchangedExceptState(r);
  });

  test('real incomplete entry still allows withdrawal without completing anything', async () => {
    for (let mask = 0; mask < 15; mask++) {
      const r = await run({ config: { mask }, inputs: mask ? [4, 4] : [4], save: false });
      unchangedExceptState(r);
    }
  });

  for (const choice of [0, 1]) {
    test(`first completion path ${choice + 1}: actual caller, state and action contract`, async () => {
      const r = await run({ inputs: [4, choice] });
      unchangedExceptState(r, choice + 1);
      assert.equal(r.store.size, 1);
    });
    test(`path ${choice + 1}: serialized save restores into a fresh VM and cannot repeat rewards`, async () => {
      const first = await run({ inputs: [4, choice] });
      const store = new Map([...first.store].map(([key, value]) => [key, JSON.parse(JSON.stringify(value))]));
      for (let revisit = 0; revisit < 3; revisit++) {
        const restored = await run({ load: true, store, inputs: [4] });
        unchangedExceptState(restored, choice + 1);
        assert.deepEqual(restored.before, first.after);
      }
    });
  }

  test('out-of-range input retries; cancellation is not committed; retry remains available', async () => {
    const r = await run({ inputs: [4, -1, 2, 1000, 999] });
    unchangedExceptState(r, 0);
    const retry = await run({ load: true, store: r.store, inputs: [4, 1] });
    unchangedExceptState(retry, 2);
  });

  test('synthetic pre-change save with unused zero slot upgrades without migration', async () => {
    // Recreate the former no-op entry contract in memory, not its narrative text.
    // This is a synthetic eraJS save, not a compatibility claim for native .sav files.
    const original = new Map(production);
    original.set('ARCANA_FORT.ERB', production.get('ARCANA_FORT.ERB')
      .replace('\t\tCALL ARCANA_FORT_COMPLETE', '\t\tPRINTW legacy-stub')
      .split('\n; UNIT1_COMPLETION_BEGIN')[0]);
    const old = await run({ sources: original, inputs: [4] });
    unchangedExceptState(old, 0);
    const r = await run({ load: true, store: old.store, inputs: [4, 0] });
    assert.deepEqual(r.before, old.after);
    unchangedExceptState(r, 1);
  });

  test('unknown nonzero completion values are preserved rather than silently overwritten', async () => {
    for (const state of [-1, 3, 999]) {
      unchangedExceptState(await run({ config: { state }, inputs: [4], save: false }), state);
    }
  });

  test('RESETDATA clears completion without changing a separately stored completed save', async () => {
    const completed = await run({ inputs: [4, 0] });
    const storedBefore = JSON.stringify([...completed.store]);
    const r = await run({ load: true, store: completed.store, inputs: [4], save: false,
      after: 'RESETDATA\nPRINTFORML __RESET__:{FLAG:97}:{FLAG:92}' });
    assert.match(r.output, /__RESET__:0:0/);
    assert.equal(r.after.globals.FLAG[97], 0n);
    assert.equal(JSON.stringify([...completed.store]), storedBefore);
    unchangedExceptState(await run({ load: true, store: completed.store, inputs: [4] }), 1);
  });

  test('real tax function retains existing income on all completion states and tax dates', async () => {
    for (const day of [10, 20, 30]) {
      for (const state of [0, 1, 2]) {
        const full = await run({ config: { day, state }, call: 'TAX_GET', save: false });
        const partial = await run({ config: { day, state, mask: 14 }, call: 'TAX_GET', save: false });
        assert.equal(full.after.globals.MONEY[0] - full.before.globals.MONEY[0], 4320n);
        assert.equal(full.after.globals.MONEY[0] - partial.after.globals.MONEY[0], 1500n);
        assert.equal(full.after.globals.FLAG[92], 15n);
        assert.equal(full.after.globals.FLAG[97], BigInt(state));
      }
    }
    unchangedExceptState(await run({ config: { day: 11 }, call: 'TAX_GET' }));
  });
}
