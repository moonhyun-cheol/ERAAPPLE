import { readFile } from 'node:fs/promises';
const left = process.argv[2] ?? 'compact-statement-vector-baseline-run.json';
const right = process.argv[3] ?? 'compact-statement-vector-m1-run.json';
const a = JSON.parse(await readFile(new URL(`./results/${left}`, import.meta.url)));
const b = JSON.parse(await readFile(new URL(`./results/${right}`, import.meta.url)));
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const compactSummary = replay => Object.fromEntries(Object.entries(replay).map(([key, value]) => [key,
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : Array.isArray(value) ? `[${value.length}]` : '{object}']));
console.log(JSON.stringify({ corpus: a.corpus.originalDigest === b.corpus.originalDigest,
  replayEqual: eq(a.deterministic.replay, b.deterministic.replay), baselineReplay: compactSummary(a.deterministic.replay),
  compactReplay: compactSummary(b.deterministic.replay), checkpointsEqual: eq(a.deterministic.checkpoints, b.deterministic.checkpoints),
  baselineCheckpointHashes: a.deterministic.checkpoints.map(x => [x.day, x.stateSha256]),
  compactCheckpointHashes: b.deterministic.checkpoints.map(x => [x.day, x.stateSha256]),
  savesEqual: eq(a.deterministic.finalSaves, b.deterministic.finalSaves) }, null, 2));
