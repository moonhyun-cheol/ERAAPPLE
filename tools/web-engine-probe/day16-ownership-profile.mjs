// Day-16 LIVE-heap ownership decomposition. Unlike m1-ownership-profile (post-reset/idle),
// this plays the fixed-seed game to day 16 and censuses the live VM to find what dominates
// the ~559MiB live heap that drives date-transition Jetsam. Node evidence, not iPhone RSS.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { inventory, gameFiles, sha } from './inventory.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';
import { createReplayRecorder, runReplay } from './replay-harness.mjs';
import { censusObjectGraph, summarizeVmStorage } from './vm-structure.mjs';

const child = process.argv.includes('--child');
const engineArg = process.argv.find(a => a.startsWith('--engine='))?.slice('--engine='.length)
  ?? 'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';
assert.match(engineArg, /^engine[\w.-]*\.mjs$/, 'unsupported engine bundle');

// Census a single reachability root in isolation so per-owner object/string/slot counts
// attribute the live graph. Sub-graphs can overlap (shared refs); do not sum blindly.
function subCensus(root) {
  try { return censusObjectGraph(root, { top: 12 }); }
  catch (error) { return { error: String(error?.message ?? error) }; }
}

if (child) {
  assert.ok(global.gc, 'day16 ownership child requires --expose-gc');
  const original = await inventory();
  let source = await gameFiles(original.records);
  const engineUrl = new URL(`./dist/${engineArg}`, import.meta.url);
  const { compile } = await import(engineUrl);
  const engineBytes = await readFile(engineUrl);
  let vm = compile(source.files);
  source = null;
  vm.random.state = 42;
  const store = new Map();
  const external = {
    getSavedata: async key => store.get(key),
    setSavedata: async (key, value) => { store.set(key, value); },
    getTime: () => 1700000000000,
    getFont: () => false
  };
  let generator = vm.start(external);
  const recorder = createReplayRecorder();
  const wantedDays = new Set([1, 4, 16]);
  const seenDays = new Set();
  let ownership = null;
  try {
    const result = await runReplay({ generator, recorder, eventLimit: 50000, decide: ({ event, events }) => {
      const buttons = events.flatMap(item => item.children ?? []).filter(item => item.type === 'button');
      const stack = vm.contextStack.map(context => context.fn.name);
      const day = Number(vm.getValue('DAY').get(vm, []));
      const time = Number(vm.getValue('TIME').get(vm, []));
      let input;
      if (event.type === 'wait') input = '';
      else if (event.type === 'tinput') input = null;
      else if (stack.includes('START_CONFIGURATION')) input = buttons.some(b => b.value === '11') ? '11' : '1';
      else if (stack.includes('CHARA_BUY_MAIN') && buttons.some(b => b.value === '1000')) input = vm.characterList.length < 2 ? '104' : '1000';
      else if (buttons.some(b => b.value === '200')) {
        if (vm.characterList.length < 2) input = '111';
        else {
          if (wantedDays.has(day) && !seenDays.has(day)) {
            seenDays.add(day);
            if (day >= 16) return { stop: true, reason: 'day-16-checkpoint' };
            input = '102';
          } else input = '102';
        }
      } else input = String(buttons[0]?.value ?? '0');
      return { input, context: { eventType: event.type, day, time, stack } };
    } });
    assert.equal(result.reason, 'day-16-checkpoint');
    assert.deepEqual([...seenDays], [1, 4, 16]);

    // LIVE ownership decomposition at day 16 (before any teardown).
    const liveMemory = sampleLifecycle('day-16-live');
    const fullCensus = censusObjectGraph(vm, { top: 25 });
    const storage = summarizeVmStorage(vm);
    const roots = {
      characterList: subCensus(vm.characterList),
      staticMap: subCensus(vm.staticMap),
      globalMap: subCensus(vm.globalMap),
      printer: subCensus(vm.printer),
      code: subCensus(vm.code),
      fnMap: subCensus(vm.fnMap),
      eventMap: subCensus(vm.eventMap),
      templateMap: subCensus(vm.templateMap),
      contextStack: subCensus(vm.contextStack)
    };
    ownership = { day: 16, characters: vm.characterList.length, staticScopes: vm.staticMap.size,
      functions: vm.fnMap.size, liveMemory, fullCensus, storage, roots };

    await generator.return(); generator = null;
    await vm.reset(); vm = null; store.clear();
    assert.equal((await inventory()).originalDigest, original.originalDigest);
    console.log(JSON.stringify({ engine: { file: engineArg, sha256: sha(engineBytes) },
      originalDigest: original.originalDigest, ownership, originalUnchanged: true }));
  } finally { if (generator) await generator.return(); }
} else {
  const script = fileURLToPath(import.meta.url);
  const output = execFileSync(process.execPath, ['--expose-gc', script, '--child', `--engine=${engineArg}`],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 600000, windowsHide: true });
  const run = JSON.parse(output);
  const o = run.ownership;
  const mib = n => Math.round(n / 2 ** 20 * 1000) / 1000;
  // Derive a distinct output file for non-default engine variants so the baseline
  // profile (used as the ownership decomposition of record) is never clobbered.
  const defaultEngine = 'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';
  const slug = engineArg === defaultEngine ? '' : '-' + engineArg
    .replace(/^engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign-?/, '')
    .replace(/\.mjs$/, '')
    .replace(/[^\w.-]+/g, '-') || '';
  const outUrl = new URL(`./results/day16-ownership-profile${slug}.json`, import.meta.url);
  const report = {
    passed: true,
    generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    engine: run.engine.file,
    method: 'Fixed-seed new game played to day 16 (two characters, rest-only); live VM censused before teardown. Sub-graph censuses attribute reachable objects/strings/slots per owner and may overlap; do not sum.',
    limitations: [
      'Node heapUsed and reachability census are not iPhone/WebKit RSS or true allocation peaks.',
      'Sub-graph censuses share cross-referenced objects; per-owner counts overlap.',
      'censusObjectGraph counts references and code units, not shallow/retained bytes.'
    ],
    originalUnchanged: run.originalUnchanged,
    day16LiveForcedGcMiB: o.liveMemory.forcedGc.mib.heapUsed,
    characters: o.characters,
    staticScopes: o.staticScopes,
    functions: o.functions,
    fullCensus: o.fullCensus,
    storage: o.storage,
    roots: o.roots
  };
  assert.ok(report.originalUnchanged);
  await writeFile(outUrl, JSON.stringify(report, null, 2) + '\n');
  const rootSummary = Object.fromEntries(Object.entries(o.roots).map(([name, c]) => [name,
    c.error ? { error: c.error } : { objects: c.objects, strings: c.strings, stringCodeUnits: c.stringCodeUnits, arraySlots: c.arraySlots, mapEntries: c.mapEntries }]));
  console.log(JSON.stringify({ passed: true, day16LiveForcedGcMiB: report.day16LiveForcedGcMiB,
    characters: o.characters, staticScopes: o.staticScopes,
    fullTopConstructors: o.fullCensus.topConstructors.slice(0, 12),
    fullStringCodeUnitsMiBApprox: mib(o.fullCensus.stringCodeUnits * 2),
    fullArraySlots: o.fullCensus.arraySlots,
    storage: o.storage,
    roots: rootSummary,
    result: fileURLToPath(outUrl) }, null, 2));
}
