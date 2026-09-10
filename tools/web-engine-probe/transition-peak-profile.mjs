// Day-transition PEAK profiler. Resident heap is already ~half (day16-ownership),
// but iPhone Jetsam kills on the transient allocation SPIKE at an event/day boundary,
// which no existing sampler captures (m1/ownership take point snapshots only).
//
// Method: fixed-seed new game (identical driver to m1-baseline / day16-ownership).
// Between two consecutive input prompts the engine processes a burst of events
// (event end, day rollover, autosave). We sample process.memoryUsage() NATURALLY
// (never forcing GC inside a segment, which would collect the very transient we
// want to see) on every yielded event and keep the high-water mark. At each new
// DAY we also take a forcedGC resident floor. transient = segmentPeak - residentFloor.
//
// Node heapUsed is not iPhone/WebKit RSS or a true GC peak; it is a lower bound on
// the transient pressure. Attribution (event-type histogram, autosave bytes, stack)
// identifies the dominant contributor to the spike.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { inventory, gameFiles, sha } from './inventory.mjs';
import { sampleMemory } from './memory-sampler.mjs';
import { createReplayRecorder, runReplay } from './replay-harness.mjs';

const child = process.argv.includes('--child');
const engineArg = process.argv.find(a => a.startsWith('--engine='))?.slice('--engine='.length)
  ?? 'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';
assert.match(engineArg, /^engine[\w.-]*\.mjs$/, 'unsupported engine bundle');

const mib = bytes => Math.round(bytes / 2 ** 20 * 1000) / 1000;

if (child) {
  assert.ok(global.gc, 'transition peak child requires --expose-gc');
  const original = await inventory();
  let source = await gameFiles(original.records);
  const engineUrl = new URL(`./dist/${engineArg}`, import.meta.url);
  const { compile } = await import(engineUrl);
  const engineBytes = await readFile(engineUrl);
  let vm = compile(source.files);
  source = null;
  vm.random.state = 42;

  // --- per-segment peak state (a segment = events processed between two input prompts) ---
  let seg = null;
  const openSegment = fromDay => {
    seg = { fromDay, events: 0, peakHeapUsed: 0, peakExternal: 0, peakArrayBuffers: 0,
      peakRss: 0, types: {}, children: 0, saveBytes: 0, saveWrites: 0 };
  };
  const sampleIntoSegment = event => {
    if (!seg) return;
    seg.events++;
    seg.types[event?.type ?? 'unknown'] = (seg.types[event?.type ?? 'unknown'] ?? 0) + 1;
    seg.children += Array.isArray(event?.children) ? event.children.length : 0;
    const u = process.memoryUsage(); // natural; no allocation, no GC
    if (u.heapUsed > seg.peakHeapUsed) seg.peakHeapUsed = u.heapUsed;
    if (u.external > seg.peakExternal) seg.peakExternal = u.external;
    if (u.arrayBuffers > seg.peakArrayBuffers) seg.peakArrayBuffers = u.arrayBuffers;
    if (u.rss > seg.peakRss) seg.peakRss = u.rss;
  };

  const store = new Map();
  const external = {
    getSavedata: async key => store.get(key),
    setSavedata: async (key, value) => {
      if (seg) { seg.saveBytes += Buffer.byteLength(value); seg.saveWrites++; }
      store.set(key, value);
    },
    getTime: () => 1700000000000,
    getFont: () => false
  };
  let generator = vm.start(external);

  // Wrap the recorder so EVERY yielded event (prints included) feeds the peak sampler,
  // while replay hashing stays byte-identical to the other profilers.
  const base = createReplayRecorder();
  const recorder = {
    recordEvent(event) { sampleIntoSegment(event); return base.recordEvent(event); },
    recordInput: (...a) => base.recordInput(...a),
    checkpoint: (...a) => base.checkpoint(...a),
    summary: () => base.summary()
  };

  const residentFloor = new Map(); // day -> forcedGC heapUsed bytes at first sight of that day
  const transitions = [];          // closed segments whose day advanced
  let currentDay = null;

  const closeSegment = dayNow => {
    if (seg && seg.fromDay != null && dayNow > seg.fromDay) {
      const floorBytes = residentFloor.get(seg.fromDay) ?? 0;
      transitions.push({
        fromDay: seg.fromDay, toDay: dayNow,
        events: seg.events, children: seg.children,
        saveWrites: seg.saveWrites, saveBytes: seg.saveBytes,
        types: seg.types,
        peak: { heapUsedMiB: mib(seg.peakHeapUsed), externalMiB: mib(seg.peakExternal),
          arrayBuffersMiB: mib(seg.peakArrayBuffers), rssMiB: mib(seg.peakRss) },
        residentFloorMiB: mib(floorBytes),
        transientMiB: mib(Math.max(0, seg.peakHeapUsed - floorBytes))
      });
    }
  };

  const recorder2 = recorder;
  try {
    const result = await runReplay({ generator, recorder: recorder2, eventLimit: 50000, decide: ({ event, events }) => {
      const buttons = events.flatMap(item => item.children ?? []).filter(item => item.type === 'button');
      const stack = vm.contextStack.map(context => context.fn.name);
      const day = Number(vm.getValue('DAY').get(vm, []));
      const time = Number(vm.getValue('TIME').get(vm, []));

      if (currentDay === null) currentDay = day;
      if (!residentFloor.has(day)) residentFloor.set(day, sampleMemory(`floor-day-${day}`, { forceGc: true }).bytes.heapUsed);
      if (day !== currentDay) { closeSegment(day); currentDay = day; }

      let input;
      if (event.type === 'wait') input = '';
      else if (event.type === 'tinput') input = null;
      else if (stack.includes('START_CONFIGURATION')) input = buttons.some(b => b.value === '11') ? '11' : '1';
      else if (stack.includes('CHARA_BUY_MAIN') && buttons.some(b => b.value === '1000')) input = vm.characterList.length < 2 ? '104' : '1000';
      else if (buttons.some(b => b.value === '200')) {
        if (vm.characterList.length < 2) input = '111';
        else {
          if (day >= 16) { closeSegment(day); return { stop: true, reason: 'day-16-checkpoint' }; }
          input = '102';
        }
      } else input = String(buttons[0]?.value ?? '0');

      openSegment(day); // start measuring the burst that this input will trigger
      return { input, context: { eventType: event.type, day, time, stack } };
    } });
    assert.equal(result.reason, 'day-16-checkpoint');

    await generator.return(); generator = null;
    await vm.reset(); vm = null; store.clear();
    assert.equal((await inventory()).originalDigest, original.originalDigest);

    const dayTransitions = transitions.filter(t => t.toDay === t.fromDay + 1 || t.toDay > t.fromDay);
    const peak = dayTransitions.reduce((best, t) => t.transientMiB > (best?.transientMiB ?? -1) ? t : best, null);
    console.log(JSON.stringify({ engine: { file: engineArg, sha256: sha(engineBytes) },
      originalDigest: original.originalDigest, originalUnchanged: true,
      transitions: dayTransitions, peakTransition: peak,
      residentFloorMiB: Object.fromEntries([...residentFloor].map(([d, b]) => [d, mib(b)])) }));
  } finally { if (generator) await generator.return(); }
} else {
  const script = fileURLToPath(import.meta.url);
  const output = execFileSync(process.execPath, ['--expose-gc', script, '--child', `--engine=${engineArg}`],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 600000, windowsHide: true });
  const run = JSON.parse(output);
  assert.ok(run.originalUnchanged, 'original game files must be unchanged');
  const outUrl = new URL('./results/transition-peak-profile.json', import.meta.url);
  const report = {
    passed: true,
    generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    engine: run.engine.file,
    method: 'Fixed-seed new game (identical driver to m1-baseline). Between input prompts every yielded event feeds a natural-heap high-water sampler; forcedGC resident floor taken at each new day. transient = segmentPeak - residentFloor.',
    limitations: [
      'Node heapUsed is a lower bound on transient pressure, not iPhone/WebKit RSS or a true GC-instant peak.',
      'Sampling granularity is per yielded event; allocation spikes strictly inside one event step are not resolved.',
      'Two-character rest-only fixed-seed path; not a user-save reproduction or full-game compatibility result.'
    ],
    originalUnchanged: run.originalUnchanged,
    peakTransition: run.peakTransition,
    residentFloorMiB: run.residentFloorMiB,
    transitions: run.transitions
  };
  await writeFile(outUrl, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true,
    peakTransition: run.peakTransition,
    transitionCount: run.transitions.length,
    top5ByTransient: [...run.transitions].sort((a, b) => b.transientMiB - a.transientMiB).slice(0, 5)
      .map(t => ({ toDay: t.toDay, transientMiB: t.transientMiB, peakHeapUsedMiB: t.peak.heapUsedMiB,
        residentFloorMiB: t.residentFloorMiB, events: t.events, saveWrites: t.saveWrites,
        saveKiB: Math.round(t.saveBytes / 1024), types: t.types })),
    result: fileURLToPath(outUrl) }, null, 2));
}
