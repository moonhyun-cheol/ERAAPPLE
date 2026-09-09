import { createHash } from 'node:crypto';

const defaultExcludedKeys = new Set(['deadline', 'elapsedMs', 'timestamp']);
const ordinal = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function normalize(value, excludedKeys, seen) {
  if (typeof value === 'bigint') return { $bigint: value.toString() };
  if (value === undefined) return { $undefined: true };
  if (typeof value === 'number' && !Number.isFinite(value)) return { $number: String(value) };
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) throw new TypeError('Replay values must not contain cycles');
  seen.add(value);
  try {
    if (ArrayBuffer.isView(value)) return { $typed: value.constructor.name, values: [...value].map(item => normalize(item, excludedKeys, seen)) };
    if (value instanceof ArrayBuffer) return { $arrayBuffer: Buffer.from(value).toString('base64') };
    if (Array.isArray(value)) return value.map(item => normalize(item, excludedKeys, seen));
    if (value instanceof Map) return { $map: [...value.entries()]
      .map(([key, item]) => [normalize(key, excludedKeys, seen), normalize(item, excludedKeys, seen)])
      .sort((a, b) => ordinal(JSON.stringify(a[0]), JSON.stringify(b[0]))) };
    if (value instanceof Set) return { $set: [...value].map(item => normalize(item, excludedKeys, seen))
      .sort((a, b) => ordinal(JSON.stringify(a), JSON.stringify(b))) };
    const result = {};
    for (const key of Object.keys(value).filter(key => !excludedKeys.has(key)).sort()) {
      const item = value[key];
      if (typeof item !== 'function') result[key] = normalize(item, excludedKeys, seen);
    }
    return result;
  } finally { seen.delete(value); }
}

export function canonicalString(value, { excludedKeys = defaultExcludedKeys } = {}) {
  return JSON.stringify(normalize(value, excludedKeys, new Set()));
}

export function hashValue(value, options) {
  return createHash('sha256').update(canonicalString(value, options)).digest('hex');
}

export function createReplayRecorder(options = {}) {
  const hash = createHash('sha256');
  const counts = { events: 0, inputs: 0, checkpoints: 0, eventTypes: {} };
  const checkpoints = [];
  const append = (kind, value) => {
    const payload = canonicalString({ kind, value }, options);
    hash.update(String(Buffer.byteLength(payload))).update(':').update(payload).update('\n');
  };
  return {
    recordEvent(event) {
      append('event', event);
      counts.events++;
      counts.eventTypes[event?.type ?? 'unknown'] = (counts.eventTypes[event?.type ?? 'unknown'] ?? 0) + 1;
    },
    recordInput(input, context = {}) {
      append('input', { input, context }); counts.inputs++;
    },
    checkpoint(label, state, metadata = {}) {
      const stateSha256 = hashValue(state, options);
      append('checkpoint', { label, stateSha256, metadata });
      counts.checkpoints++;
      const checkpoint = { label, stateSha256, transcriptSha256: hash.copy().digest('hex'), metadata };
      checkpoints.push(checkpoint); return checkpoint;
    },
    summary() { return { sha256: hash.copy().digest('hex'), counts: structuredClone(counts), checkpoints: structuredClone(checkpoints) }; }
  };
}

export async function runReplay({ generator, decide, recorder = createReplayRecorder(), eventLimit = 50000 }) {
  let input = null;
  let events = [];
  for (let step = 0; step < eventLimit; step++) {
    const next = await generator.next(input); input = null;
    if (next.done) return { stopped: false, reason: 'generator-complete', steps: step + 1, replay: recorder.summary() };
    const event = next.value;
    recorder.recordEvent(event); events.push(event);
    if (!['input', 'wait', 'tinput'].includes(event.type)) continue;
    const decision = await decide({ event, events, step, recorder });
    for (const checkpoint of decision?.checkpoints ?? []) recorder.checkpoint(checkpoint.label, checkpoint.state, checkpoint.metadata);
    if (decision?.stop) return { stopped: true, reason: decision.reason ?? 'driver-stop', steps: step + 1, replay: recorder.summary() };
    if (!decision || !Object.hasOwn(decision, 'input')) throw new Error('Replay driver must return an input or stop at every input event');
    input = decision.input;
    recorder.recordInput(input, decision.context ?? { eventType: event.type });
    events = [];
  }
  throw new Error(`Replay event limit exceeded: ${eventLimit}`);
}