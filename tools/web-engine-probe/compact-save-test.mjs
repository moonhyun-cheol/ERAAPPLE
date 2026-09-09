import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { compactIntegers } from './compact-save.mjs';
import { transformSaveSource } from './save-build-plugin.mjs';
import { compile as compact } from './dist/engine.mjs';
import { compile as paged } from './dist/engine-compact-ir-labels-lazy-slice-paged.mjs';
import { compile as legacy } from './dist/engine-legacy.mjs';
import { externalFor } from './fixture.mjs';
import { packBackup, unpackBackup } from './save-backup.mjs';
const make = (shape, value = 0n) => Array.from({ length: shape[0] }, () => shape.length === 1 ? value : make(shape.slice(1), value));
const restore = (source, shape) => {
  const result = make(shape);
  function fill(target, prefix) {
    for (let i = 0; i < prefix.length; i++) {
      if (Array.isArray(prefix[i])) fill(target[i], prefix[i]);
      else target[i] = BigInt(prefix[i]);
    }
  }
  fill(result, source); return result;
};
test('zero prefixes preserve every integer, dense/empty arrays and extended leaf length', () => {
  assert.deepEqual(compactIntegers(make([100, 100, 100]), [100, 100, 100]), []);
  assert.deepEqual(compactIntegers([], [0]), []);
  assert.deepEqual(compactIntegers([0n, 0n, 0n], [2]), ['0', '0', '0']);
  assert.throws(() => compactIntegers([1n]), /shape/);
  let seed = 42;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  for (const shape of [[8], [4, 8], [3, 4, 8]]) {
    for (let trial = 0; trial < 40; trial++) {
      const original = make(shape);
      function vary(value) {
        for (let i = 0; i < value.length; i++) {
          if (Array.isArray(value[i])) vary(value[i]);
          else if (random() % 4 === 0) value[i] = BigInt(random()) * 9007199254740993n - 9223372036854775808n;
        }
      }
      vary(original);
      const prefix = compactIntegers(original, shape);
      assert.deepEqual(restore(prefix, shape), original);
      assert.deepEqual(restore(compactIntegers(make(shape, -9n), shape), shape), make(shape, -9n));
    }
  }
});
test('pinned overlay fails closed on upstream change; CRLF/LF equivalent', async () => {
  const source = await readFile(new URL('../../.my_agent_remote/undercrow__eraJS/build/value/int-1d.js', import.meta.url), 'utf8');
  assert.equal(transformSaveSource('value/int-1d.js', source), transformSaveSource('value/int-1d.js', source.replaceAll('\r\n', '\n')));
  assert.throws(() => transformSaveSource('value/int-1d.js', source + ' '), /fingerprint/);
});
const source = new Map([
  ['GAMEBASE.CSV', 'コード,890016222\nバージョン,3210\n'],
  ['CHARA0.CSV', '番号,0\n名前,중립 시험\n'],
  ['TEST.ERH', '#DIM SAVEDATA SCALAR\n#DIM SAVEDATA ONE, 8\n#DIM SAVEDATA TWO, 4, 8\n#DIM SAVEDATA THREE, 3, 4, 8\n#DIM SAVEDATA GLOBAL GONE, 8\n#DIM SAVEDATA GLOBAL GTWO, 4, 8\n#DIM SAVEDATA GLOBAL GTHREE, 3, 4, 8\n#DIMS SAVEDATA WORDS, 4\n'],
  ['TEST.ERB', '@SYSTEM_TITLE\nINPUT\nIF RESULT == 1\nLOADGLOBAL\nLOADDATA 0\nELSE\nADDCHARA 0\nWAIT\nSAVEGLOBAL\nSAVEDATA 0, "중립 저장"\nWAIT\nQUIT\nENDIF\n@SYSTEM_LOADEND\nWAIT\nINPUT\nLOADGLOBAL\nLOADDATA 0\n']
]);
async function until(vm, generator, type, input = null) {
  for (let i = 0; i < 100; i++) {
    const next = await generator.next(input); input = null;
    assert.ok(!next.done, 'unexpected end');
    if (next.value.type === type) return;
  }
  assert.fail('fixture budget');
}
const names = ['SCALAR', 'ONE', 'TWO', 'THREE', 'GONE', 'GTWO', 'GTHREE', 'WORDS', 'GLOBAL', 'GLOBALS'];
const clone = value => Array.isArray(value) ? Array.from(value, clone) : value;
function snapshot(vm) {
  return { variables: Object.fromEntries(names.map(n => [n, clone(vm.getValue(n).value)])),
    chars: vm.characterList.map(c => Object.fromEntries(['NAME', 'CSTR', 'CFLAG', 'NO'].map(n => [n, clone(c.getValue(n).value)]))) };
}
function populate(vm) {
  vm.getValue('SCALAR').value = -9223372036854775808n;
  for (const n of ['ONE', 'GONE']) vm.getValue(n).value[3] = 9007199254740993n;
  for (const n of ['TWO', 'GTWO']) vm.getValue(n).value[1][2] = 9223372036854775807n;
  for (const n of ['THREE', 'GTHREE']) vm.getValue(n).value[1][2][4] = -9007199254740993n;
  // Dense values, internal zero gaps and declaration-extending trailing zeros.
  vm.getValue('TWO').value[0].fill(17n);
  vm.getValue('ONE').value.push(0n);
  vm.getValue('GTWO').value[0].push(0n);
  vm.getValue('THREE').value[0][0].push(0n);
  vm.getValue('WORDS').value = ['0', '', '한글 😀', ''];
  vm.getValue('GLOBAL').value[0] = 77n;
  vm.getValue('GLOBALS').value[0] = '0';
  vm.characterList[0].getValue('CFLAG').value[3] = 9007199254740993n;
  vm.characterList[0].getValue('CSTR').value[2] = '0';
}
const reports = [];
for (const [writerName, writer] of Object.entries({ legacy, compact, paged })) {
  test(`${writerName} writer -> all loaders and unchanged backup codec`, async () => {
    const store = new Map(), vm = writer(source), generator = vm.start(externalFor(store));
    await until(vm, generator, 'input'); await until(vm, generator, 'wait', '0');
    populate(vm); const expected = snapshot(vm);
    await until(vm, generator, 'wait'); await generator.return();
    assert.deepEqual(snapshot(vm), expected, 'saving is read-only');
    const entries = [...store];
    assert.deepEqual((await unpackBackup(await packBackup(entries))).entries, entries);
    const bytes = entries.reduce((n, [, value]) => n + Buffer.byteLength(value), 0);
    for (const [readerName, reader] of Object.entries({ legacy, compact, paged })) {
      const loaded = reader(source), gen = loaded.start(externalFor(store));
      await until(loaded, gen, 'input'); await until(loaded, gen, 'wait', '1');
      assert.deepEqual(snapshot(loaded), expected, readerName + ' full values, shapes and strings');
      assert.equal(loaded.getValue('TA').value[99][99][99], 0n);
      // Exercise the real LOADGLOBAL/LOADDATA commands again in the same dirty VM.
      for (const n of ['ONE', 'GONE', 'GLOBAL']) loaded.getValue(n).value.fill(123n);
      for (const n of ['TWO', 'GTWO']) for (const row of loaded.getValue(n).value) row.fill(123n);
      for (const n of ['THREE', 'GTHREE']) for (const plane of loaded.getValue(n).value) for (const row of plane) row.fill(123n);
      loaded.getValue('TA').value[99][99][99] = 123n;
      loaded.characterList[0].getValue('CFLAG').value.fill(123n);
      await until(loaded, gen, 'input'); await until(loaded, gen, 'wait', '1');
      assert.deepEqual(snapshot(loaded), expected, readerName + ' clears omitted tails on repeated load');
      assert.equal(loaded.getValue('TA').value[99][99][99], 0n);
      await gen.return();
    }
    reports.push({ writer: writerName, bytes, bothReaders: true, gzipBackup: true });
    if (reports.length === 3) {
      assert.ok(reports[1].bytes < reports[0].bytes / 100);
      assert.ok(reports[2].bytes < reports[0].bytes / 100);
      await writeFile(new URL('./results/save-compatibility.json', import.meta.url), JSON.stringify({ passed: true, reports }, null, 2) + '\n');
    }
  });
}
test('serialization milestone is awaited before reading arrays, rejected writes never succeed', async () => {
  const vm = compact(source), store = new Map(); let release, marked = false, writes = 0;
  const generator = vm.start({ ...externalFor(store), saveProgress: async () => {
    marked = true; await new Promise(resolve => { release = resolve; });
  }, setSavedata: async () => { writes++; throw new Error('injected quota failure'); } });
  await until(vm, generator, 'input'); await until(vm, generator, 'wait', '0');
  const pending = generator.next();
  while (!marked) await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(writes, 0);
  let touched = false;
  const values = vm.getValue('GLOBAL').value;
  Object.defineProperty(values, '0', { get() { touched = true; return 0n; }, configurable: true });
  assert.equal(touched, false);
  release();
  await assert.rejects(pending, /injected quota failure/);
  assert.equal(touched, true); assert.equal(writes, 1); assert.equal(store.size, 0);
});
