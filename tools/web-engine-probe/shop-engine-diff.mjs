// A/B engine-output comparison for the "상점 상품을 눌러도 반응 없음" report.
//
// Root-cause isolation: the SERVER runs dist/engine.mjs (era-deferred-local-v1, NO printform overlay),
// while the WORKING PWA runs the printform overlay build. This harness drives the SAME deterministic
// decision sequence through BOTH engines and compares, step by step, the events they emit at the shop
// (content text + waiting/input/tinput kind + the button values offered).
//
//   - If the two event streams DIFFER at/around the shop  => the engine build IS the cause.
//   - If they are byte-identical                          => the engine is innocent; look at transport/client.
//
// Read-only on disk. No network. Runs both engines in one process for an exact comparison.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { decode } from './inventory.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));

const ENGINES = [
  { id: 'server', label: 'dist/engine.mjs (server: deferred-local, no printform)',
    spec: './dist/engine.mjs' },
  { id: 'pwa', label: 'dist/…printform-static-assign.mjs (PWA/probe overlay)',
    spec: './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs' },
];

async function loadGame() {
  const files = new Map();
  async function walk(rel) {
    for (const entry of await readdir(path.join(gameRoot, rel), { withFileTypes: true })) {
      const name = rel + '/' + entry.name;
      if (entry.isDirectory()) { await walk(name); continue; }
      if (!entry.isFile() || !/\.(erb|erh|csv)$/i.test(entry.name)) continue;
      const ext = path.extname(entry.name).toUpperCase();
      const result = decode(await readFile(path.join(gameRoot, name)));
      if (result.text == null) throw new Error('encoding-unresolved: ' + name);
      const key = ext === '.CSV' ? path.basename(name).toUpperCase() : name;
      files.set(key, result.text);
    }
  }
  for (const top of ['CSV', 'ERB']) await walk(top);
  return files;
}

const NAME = 'ㅅㅎ';
const AVOID = /LOAD|불러|HELP|도움|설명|돌아가|이전\s*페이지|다음\s*페이지/i;
const CONFIRM = /결정|確定|확정|이대로|완료|결정하기|시작하기|決定/;

function parseChoices(text) {
  const pairs = [...text.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
  const seen = new Map();
  for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
  return [...seen.entries()].map(([n, label]) => ({ n, label }));
}

const SEED = 0x2f6b8d1;

async function drive(vm) {
  if (vm.random) vm.random.state = SEED; // fixed RNG so the ONLY differences would be engine behavior, not random rolls
  const store = new Map();
  const generator = vm.start({
    getSavedata: k => store.get(k),
    setSavedata: (k, v) => { store.set(k, v); },
    getTime: () => 1700000000000, getFont: () => false });

  const obs = { events: 0, inputs: 0, steps: [], stop: null,
    enteredShop: false, pickedItem: false, gaveQty: false, roundsAfterPick: 0, pickTail: null };
  let buffer = '';
  let input = null;
  const fnVisits = new Map();
  let eventsSinceInput = 0;

  const decide = (kind) => {
    const text = buffer;
    if (kind === 'wait') return '';
    const uniq = parseChoices(text);
    const isTitle = /NEW GAME/.test(text) && /LOAD GAME/.test(text) && !text.includes('[100]');
    const isCommandMenu = uniq.some(o => o.n === 107) && uniq.some(o => o.n === 200);
    const isShopList = /어둠의 상인|상품 목록|소지금/.test(text) && uniq.some(o => o.n === 0);
    if (isTitle) return '1';
    if (isCommandMenu && !obs.enteredShop) { obs.enteredShop = true; return '107'; }
    if (obs.enteredShop && !obs.pickedItem && isShopList) {
      obs.pickedItem = true; obs.pickTail = text.slice(-200).replace(/\n/g, ' '); return '0';
    }
    if (obs.pickedItem) {
      obs.roundsAfterPick++;
      if (kind === 'tinput') return '';
      if (!obs.gaveQty && kind === 'input') { obs.gaveQty = true; return '1'; }
      const good = uniq.find(o => !AVOID.test(o.label));
      if (good) return String(good.n);
      if (uniq.length) return String(uniq[0].n);
      return '0';
    }
    if (/이름|명칭/.test(text) && /\(\s*5|자까지|５자/.test(text)) return NAME;
    const confirm = uniq.find(o => CONFIRM.test(o.label));
    if (confirm) return String(confirm.n);
    const visits = (fnVisits.get('top') ?? 0) + 1; fnVisits.set('top', visits);
    if (visits > 3 && uniq.length) return String(uniq.reduce((a, o) => o.n > a.n ? o : a).n);
    const good = uniq.find(o => !AVOID.test(o.label));
    if (good) return String(good.n);
    if (uniq.length) return String(uniq[0].n);
    return '0';
  };

  const maxSteps = 2000000;
  for (let n = 0; n < maxSteps; n++) {
    const next = await generator.next(input);
    input = null;
    if (next.done) { obs.stop ??= 'ended'; break; }
    obs.events++;
    eventsSinceInput++;
    const v = next.value;
    if (v.type === 'content') {
      buffer += v.children.map(c => c.text ?? '').join('') + '\n';
      if (buffer.length > 40000) buffer = buffer.slice(-40000);
    } else if (['input', 'wait', 'tinput'].includes(v.type)) {
      obs.inputs++;
      const choices = parseChoices(buffer);
      const normText = buffer.replace(/\s+/g, ' ').trim();
      const choice = decide(v.type);
      obs.steps.push({
        i: obs.inputs, type: v.type, choice, burst: eventsSinceInput,
        choices, choiceCount: choices.length,
        textHash: createHash('sha256').update(normText).digest('hex').slice(0, 16),
        textLen: normText.length,
        textTail: normText.slice(-140),
      });
      eventsSinceInput = 0;
      buffer = '';
      if (obs.pickedItem && obs.gaveQty && obs.roundsAfterPick >= 8) { obs.stop = 'post-buy-ok'; await generator.return(); break; }
      input = choice;
    }
    if (obs.inputs > 8000) { obs.stop = 'input-limit'; await generator.return(); break; }
  }
  return obs;
}

const files = await loadGame();
const runs = [];
for (const eng of ENGINES) {
  const record = { id: eng.id, label: eng.label };
  try {
    const { compile } = await import(eng.spec);
    const vm = compile(files);
    record.fnCount = vm.fnMap?.size ?? null;
    const o = await drive(vm);
    record.stop = o.stop;
    record.inputs = o.inputs;
    record.events = o.events;
    record.enteredShop = o.enteredShop;
    record.pickedItem = o.pickedItem;
    record.gaveQty = o.gaveQty;
    record.roundsAfterPick = o.roundsAfterPick;
    record.pickTail = o.pickTail;
    record.steps = o.steps;
  } catch (error) {
    record.error = { name: error?.name, message: error?.message,
      file: error?.line?.file ?? null, line: error?.line?.line == null ? null : error.line.line + 1 };
  }
  runs.push(record);
}

function diffSteps(a, b) {
  const max = Math.max(a?.length ?? 0, b?.length ?? 0);
  const diffs = [];
  for (let i = 0; i < max; i++) {
    const sa = a?.[i]; const sb = b?.[i];
    if (!sa || !sb) { diffs.push({ i, reason: !sa ? 'server-missing' : 'pwa-missing' }); break; }
    const fields = ['type', 'choice', 'choiceCount', 'textHash'];
    const changed = fields.filter(f => JSON.stringify(sa[f]) !== JSON.stringify(sb[f]));
    if (changed.length) {
      diffs.push({ i, changed,
        server: { type: sa.type, choice: sa.choice, choiceCount: sa.choiceCount, textHash: sa.textHash, tail: sa.textTail },
        pwa: { type: sb.type, choice: sb.choice, choiceCount: sb.choiceCount, textHash: sb.textHash, tail: sb.textTail } });
      if (diffs.length >= 8) break;
    }
  }
  return diffs;
}

const server = runs.find(r => r.id === 'server');
const pwa = runs.find(r => r.id === 'pwa');
const diffs = (server?.steps && pwa?.steps) ? diffSteps(server.steps, pwa.steps) : null;
const identical = diffs != null && diffs.length === 0
  && server.steps.length === pwa.steps.length
  && server.stop === pwa.stop;

const report = {
  game: '에라마왕 개조판 1.28', node: process.version,
  engines: runs.map(r => ({ id: r.id, label: r.label, fnCount: r.fnCount, stop: r.stop,
    inputs: r.inputs, events: r.events, enteredShop: r.enteredShop, pickedItem: r.pickedItem,
    gaveQty: r.gaveQty, roundsAfterPick: r.roundsAfterPick, stepCount: r.steps?.length ?? null,
    error: r.error ?? null })),
  identical,
  firstDivergence: diffs && diffs.length ? diffs[0] : null,
  divergences: diffs,
  verdict: server?.error || pwa?.error ? 'engine-threw'
    : identical ? 'engines-identical => engine NOT the cause; investigate transport/client'
    : 'engines-differ => engine build IS implicated at the divergence above',
};

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('shop-engine-diff.json', out), JSON.stringify({ ...report, fullSteps: { server: server?.steps, pwa: pwa?.steps } }, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
