// Targeted repro for the "구입 → 상품 선택 시 진행이 멈춘다" report.
// Drives the PROMOTED worker engine stack directly (same overlays as dist/engine-worker.js),
// read-only on disk, to isolate whether the ENGINE stalls/throws on shop-item selection
// (a content/engine bug) or whether the engine advances fine (=> worker/UI glue bug).
//
// Path: title -> NEW GAME -> setup -> command menu -> 107 (구입) -> pick item 0 -> quantity 1
//       -> keep going a few rounds, logging events-between-inputs and any stall/throw.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from './inventory.mjs';
import { compile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));

function errorInfo(error) {
  return { name: error?.name, message: error?.message, file: error?.line?.file ?? null,
    line: error?.line?.line == null ? null : error.line.line + 1, trace: (error?.trace ?? []).slice(0, 20) };
}

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

async function drive(vm) {
  const store = new Map();
  const generator = vm.start({
    getSavedata: k => store.get(k),
    setSavedata: (k, v) => { store.set(k, v); },
    getTime: () => 1700000000000, getFont: () => false });

  const obs = { events: 0, inputs: 0, decisions: [], stop: null,
    enteredShop: false, pickedItem: false, gaveQty: false, roundsAfterPick: 0 };
  let buffer = '';
  let input = null;
  const fnVisits = new Map();
  let eventsSinceInput = 0;
  let maxBurst = 0;

  const parse = text => {
    const pairs = [...text.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
    const seen = new Map();
    for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
    return [...seen.entries()].map(([n, label]) => ({ n, label }));
  };

  const decide = (kind, topFn) => {
    const text = buffer;
    if (kind === 'wait') return '';
    const uniq = parse(text);
    const isTitle = /NEW GAME/.test(text) && /LOAD GAME/.test(text) && !text.includes('[100]');
    const isCommandMenu = uniq.some(o => o.n === 107) && uniq.some(o => o.n === 200); // 구입 + 세이브
    const isShopList = /어둠의 상인|상품 목록|소지금/.test(text) && uniq.some(o => o.n === 0);

    if (isTitle) return '1'; // NEW GAME

    // Once at command menu (before entering shop), pick 구입 (107).
    if (isCommandMenu && !obs.enteredShop) { obs.enteredShop = true; return '107'; }

    // In the shop item list: pick item [0].
    if (obs.enteredShop && !obs.pickedItem && isShopList) {
      obs.pickedItem = true;
      obs.pickTail = text.slice(-200).replace(/\n/g, ' ');
      return '0';
    }

    // After picking an item, the engine typically asks quantity or confirm. Feed sensible values,
    // then keep answering the first non-avoid choice, tracking rounds to detect where it stops.
    if (obs.pickedItem) {
      obs.roundsAfterPick++;
      if (kind === 'tinput') return '';
      if (!obs.gaveQty && kind === 'input') { obs.gaveQty = true; return '1'; } // quantity
      const good = uniq.find(o => !AVOID.test(o.label));
      if (good) return String(good.n);
      if (uniq.length) return String(uniq[0].n);
      return '0';
    }

    // Shared setup heuristic to reach the command menu.
    if (/이름|명칭/.test(text) && /\(\s*5|자까지|５자/.test(text)) return NAME;
    const confirm = uniq.find(o => CONFIRM.test(o.label));
    if (confirm) return String(confirm.n);
    const visits = (fnVisits.get(topFn) ?? 0) + 1; fnVisits.set(topFn, visits);
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
      if (eventsSinceInput > maxBurst) maxBurst = eventsSinceInput;
      const topFn = vm.contextStack?.map(c => c?.fn?.name).filter(Boolean).slice(-1)[0] ?? '?';
      const choice = decide(v.type, topFn);
      if (obs.decisions.length < 600)
        obs.decisions.push({ i: obs.inputs, type: v.type, choice, burst: eventsSinceInput,
          topFn, tail: buffer.slice(-120).replace(/\s+/g, ' ').trim() });
      eventsSinceInput = 0;
      buffer = '';
      // Stop a few rounds after we picked an item and gave quantity, to capture the aftermath.
      if (obs.pickedItem && obs.gaveQty && obs.roundsAfterPick >= 8) { obs.stop = 'post-buy-ok'; await generator.return(); break; }
      input = choice;
    }
    if (obs.inputs > 8000) { obs.stop = 'input-limit'; await generator.return(); break; }
  }
  obs.maxBurst = maxBurst;
  return obs;
}

const report = { game: '에라마왕 개조판 1.28', node: process.version };
try {
  const files = await loadGame();
  const vm = compile(files);
  report.fnCount = vm.fnMap?.size ?? null;
  const o = await drive(vm);
  report.stop = o.stop;
  report.inputs = o.inputs;
  report.events = o.events;
  report.maxBurst = o.maxBurst;
  report.enteredShop = o.enteredShop;
  report.pickedItem = o.pickedItem;
  report.pickTail = o.pickTail ?? null;
  report.gaveQty = o.gaveQty;
  report.roundsAfterPick = o.roundsAfterPick;
  report.decisions = o.decisions;
  // Success = engine did NOT stall on shop-item selection: it entered the shop, picked an item,
  // and continued producing further input requests (roundsAfterPick reached the target).
  report.ok = o.enteredShop && o.pickedItem && o.stop === 'post-buy-ok';
} catch (error) {
  report.ok = false; report.error = errorInfo(error);
}

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('shop-buy.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, stop: report.stop, enteredShop: report.enteredShop,
  pickedItem: report.pickedItem, gaveQty: report.gaveQty, roundsAfterPick: report.roundsAfterPick,
  maxBurst: report.maxBurst, inputs: report.inputs, error: report.error ?? null,
  lastDecisions: (report.decisions ?? []).slice(-12) }, null, 2));
