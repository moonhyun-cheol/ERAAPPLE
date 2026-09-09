import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { compile } from './dist/engine.mjs';
import { execute, files, textOf } from './fixture.mjs';
import { inventory } from './inventory.mjs';

test('original 1,151 files still match the recorded baseline byte-for-byte', async () => {
  const baseline = JSON.parse(await readFile(new URL('./results/original-inventory.json', import.meta.url), 'utf8'));
  const current = await inventory();
  assert.equal(current.records.length, 1151);
  assert.deepEqual(current.records, baseline.records);
  assert.equal(current.originalDigest, baseline.originalDigest);
});

test('Korean input, ordinary integer, slot/GLOBAL survive a new VM', async () => {
  const store = new Map();
  const first = await execute(compile, files, ['0', '42', '한글 시험'], store);
  assert.equal(first.used, 3);
  assert.match(textOf(first.events), /SAVED/);
  assert.equal(store.size, 2);
  const second = await execute(compile, files, ['1'], store);
  assert.match(textOf(second.events), /RESTORED:42:한글 시험:77/);
});

// Characterization of a CONFIRMED DEFECT, not a compatibility pass.
test('KNOWN DEFECT: INPUT rounds 9007199254740993 via Number', async () => {
  const store = new Map();
  await execute(compile, files, ['0', '9007199254740993', 'integer-probe'], store);
  const loaded = textOf((await execute(compile, files, ['1'], store)).events);
  assert.match(loaded, /RESTORED:9007199254740992:integer-probe:77/);
  assert.doesNotMatch(loaded, /RESTORED:9007199254740993:/);
});

test('host storage failure is not reported as successful save', async () => {
  const store = { get() {}, set() { throw new Error('injected quota failure'); } };
  await assert.rejects(execute(compile, files, ['0', '42', 'text'], store), /injected quota failure/);
});

test('unknown instruction is rejected during execution (lazy parsing)', async () => {
  await assert.rejects(execute(compile, new Map([['BAD.ERB', '@SYSTEM_TITLE\nNOT_A_REAL_COMMAND\nQUIT\n']])), error => {
    assert.equal(error.line.file, 'BAD.ERB');
    assert.equal(error.line.line, 1); // Engine source position is zero-based.
    assert.ok(error.trace.includes('SYSTEM_TITLE'));
    return true;
  });
});

test('async storage rejection is awaited, not reported as success', async () => {
  const store = { get() {}, async set() { throw new Error('injected transaction abort'); } };
  await assert.rejects(execute(compile, files, ['0', '42', 'text'], store), /injected transaction abort/);
});

test('design/report relative links and JSON example resolve', async () => {
  const docs = new URL('../../docs/web-runtime/', import.meta.url);
  const paths = (await readdir(docs)).filter(name => name.endsWith('.md')).map(name => new URL(name, docs));
  paths.push(new URL('./README.md', import.meta.url));
  for (const path of paths) {
    const text = await readFile(path, 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (target && !/^[a-z]+:/i.test(target)) await access(new URL(target, path));
    }
  }
  JSON.parse(await readFile(new URL('package.example.json', docs), 'utf8'));
});
