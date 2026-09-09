import { writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inventory, gameFiles } from './inventory.mjs';
import { compile } from './dist/engine.mjs';
import { execute, files, textOf } from './fixture.mjs';

function errorInfo(error) {
  return { name: error.name, message: error.message, file: error.line?.file ?? null,
    line: error.line?.line == null ? null : error.line.line + 1, trace: error.trace ?? [] };
}
async function compileGame(choice) {
  const observations = { inputs: 0, events: 0, customTitleRegistered: false, titleChoicesSeen: false, inputPoints: [] };
  const started = performance.now();
  const finish = (status, extra = {}) => ({ status, choice: choice ?? null, ...observations,
    elapsedMs: performance.now() - started, ...extra });
  try {
    const { files } = await gameFiles((await inventory()).records);
    const vm = compile(files);
    observations.customTitleRegistered = vm.fnMap.has('SYSTEM_TITLE');
    const generator = vm.start({ getSavedata: () => undefined,
      setSavedata: () => { throw new Error('Actual-game probe is read-only'); },
      getTime: () => 1700000000000, getFont: () => false });
    let input = null;
    for (let n = 0; n < 2000; n++) {
      const next = await generator.next(input);
      input = null;
      if (next.done) return finish('ended');
      observations.events++;
      if (next.value.type === 'content') {
        const text = next.value.children.map(c => c.text).join('');
        if (text.includes('[0] 힘세고 강한 시작')) observations.titleChoicesSeen = true;
      }
      if (['input', 'wait', 'tinput'].includes(next.value.type)) {
        observations.inputs++;
        observations.inputPoints.push({ type: next.value.type, stack: vm.contextStack.map(c => c.fn.name) });
        if (observations.inputs === 1 && choice != null) { input = choice; continue; }
        await generator.return();
        return finish(choice == null ? 'first-input-only' : 'next-input-after-choice');
      }
    }
    await generator.return();
    return finish('event-limit');
  } catch (error) { return finish('blocked', { error: errorInfo(error) }); }
}
if (process.argv.includes('--game-worker')) {
  console.log(JSON.stringify(await compileGame(process.argv[process.argv.indexOf('--game-worker') + 1])));
} else {
  const before = await inventory();
  const baseline = '017cbaf8e24440301e71e395bfc8f49189fccab6948c72b517b330898815a37d';
  if (before.originalDigest !== baseline || before.records.length !== 1151) {
    throw new Error('Original baseline mismatch: ' + before.originalDigest + ' / ' + before.records.length);
  }
  const data = await gameFiles(before.records);
  const game = {};
  for (const [name, inputs] of [['initial', []], ['newGame', ['0']], ['loadEmptyStore', ['1']]]) {
    const worker = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--game-worker', ...inputs], {
      encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024
    });
    game[name] = worker.status === 0 ? JSON.parse(worker.stdout) : {
      status: 'probe-process-failed', error: worker.error?.message ?? worker.stderr, signal: worker.signal
    };
  }
  const store = new Map();
  const saved = await execute(compile, files, ['0', '42', '한글 시험'], store);
  const loaded = await execute(compile, files, ['1'], store);
  const largeStore = new Map();
  await execute(compile, files, ['0', '9007199254740993', 'integer-probe'], largeStore);
  const large = await execute(compile, files, ['1'], largeStore);
  const after = await inventory();
  if (before.originalDigest !== after.originalDigest) throw new Error('Original files changed during probe');
  const report = {
    engine: { id: 'erajs', version: '0.7.0', commit: 'fb487bceacd899a033db017ff0dff5bb3878d4a5' },
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    p0Passed: false, iPhoneTested: false,
    original: { count: before.records.length, digest: before.originalDigest, unchanged: true },
    counts: data.counts,
    encodings: data.encodings,
    lexicalTokenNote: 'Approximate line-start inventory, includes variables/comments in blocks; NOT a supported-command list.',
    lexicalTokens: data.lexicalTokens,
    fixture: { saveOutput: textOf(saved.events), loadOutput: textOf(loaded.events),
      largeInteger: { expected: '9007199254740993', output: textOf(large.events), compatible: false } },
    actualGame: game,
    configuration: 'emuera.config and CSV/*.config inventoried but NOT applied by eraJS; Rename/Replace/KR behavior not certified',
    actualGameMilestones: { title: game.initial.titleChoicesSeen === true,
      newGameModeMenu: game.newGame.inputPoints?.some(p => p.stack.includes('SELECT_GAMEMODE')) === true,
      newGameSetupCompleted: false,
      firstInput: game.initial.status === 'first-input-only', save: false, reload: false }
  };
  const out = new URL('./results/', import.meta.url);
  await mkdir(out, { recursive: true });
  await writeFile(new URL('probe.json', out), JSON.stringify(report, null, 2) + '\n');
  await writeFile(new URL('original-inventory.json', out), JSON.stringify(before, null, 2) + '\n');
  console.log(JSON.stringify({ p0Passed: false, counts: data.counts, original: report.original,
    actualGame: game, fixture: report.fixture }, null, 2));
  // Exit 0 means the diagnostic report was produced, NOT that the game is compatible.
}
