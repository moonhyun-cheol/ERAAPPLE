// Manual SAVEGAME/LOADGAME roundtrip probe for '에라마왕 개조판 1.28'.
// Read-only on disk: loads ERB/CSV from the 1.28 folder, never writes savedata to
// disk, never mutates the game folder. Uses the PROMOTED worker engine stack (same
// overlays as dist/engine-worker.js) so it exercises exactly what the browser runs.
//
// Proves fix #6 (SAVEGAME/LOADGAME scenes) end to end:
//   Phase A (save): title -> NEW GAME -> setup -> shop -> option 200 (SAVEGAME) ->
//                   slot 0 -> SAVEDATA. Captures the in-memory save00 payload.
//   Phase B (load): FRESH vm with only save00 seeded (simulates a reload) -> title
//                   -> option 0 (LOADGAME) -> slot 0 -> LOADDATA -> DATALOADED ->
//                   shop. Asserts DAY/MONEY restored to the saved values.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from './inventory.mjs';
import { compile } from './dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));

function errorInfo(error) {
  return { name: error?.name, message: error?.message, file: error?.line?.file ?? null,
    line: error?.line?.line == null ? null : error.line.line + 1, trace: (error?.trace ?? []).slice(0, 16) };
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

// Drive one VM to completion of the requested roundtrip phase.
//   mode 'save': reach shop, open SAVEGAME (200), save slot 0, stop when shop returns.
//   mode 'load': at title pick LOADGAME (0), load slot 0, stop when shop is reached.
async function drive(vm, store, mode) {
  const writes = [];
  const generator = vm.start({
    getSavedata: k => store.get(k),
    setSavedata: (k, v) => { store.set(k, v); writes.push(k); },
    getTime: () => 1700000000000, getFont: () => false });

  const obs = { events: 0, inputs: 0, decisions: [], done: false, saved: false, loaded: false,
    sawSaveMenu: false, sawLoadMenu: false, saveMenuText: null, loadMenuText: null, stop: null };
  let buffer = '';
  let input = null;
  const fnVisits = new Map();

  const decide = (kind, topFn) => {
    const text = buffer;
    if (kind === 'wait') return '';
    const isSaveMenu = text.includes('SAVE GAME') && text.includes('[100]');
    const isLoadMenu = text.includes('LOAD GAME') && text.includes('[100]');
    const isTitle = /NEW GAME/.test(text) && /LOAD GAME/.test(text) && !text.includes('[100]');
    const pairs = [...text.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
    const seen = new Map();
    for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
    const uniq = [...seen.entries()].map(([n, label]) => ({ n, label }));
    const hasShop = uniq.some(o => o.n === 200);

    if (mode === 'save') {
      if (isSaveMenu) { obs.sawSaveMenu = true; obs.saveMenuText ??= text.slice(-400); obs.saved = true; return '0'; }
      if (isTitle) return '1';                       // NEW GAME
      if (hasShop) {
        if (obs.saved) { obs.stop = 'shop-after-save'; return null; }
        return '200';                                 // open SAVEGAME
      }
    } else { // load
      if (isLoadMenu) { obs.sawLoadMenu = true; obs.loadMenuText ??= text.slice(-400); obs.loaded = true; return '0'; }
      if (isTitle) return '0';                        // LOAD GAME
      if (hasShop && obs.loaded) { obs.stop = 'shop-after-load'; return null; }
    }
    // Shared setup heuristic (drives char creation / intro / tutorial to the shop).
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

  const maxSteps = 500000;
  for (let n = 0; n < maxSteps; n++) {
    const next = await generator.next(input);
    input = null;
    if (next.done) { obs.stop ??= 'ended'; break; }
    obs.events++;
    const v = next.value;
    if (v.type === 'content') {
      buffer += v.children.map(c => c.text ?? '').join('') + '\n';
      if (buffer.length > 20000) buffer = buffer.slice(-20000);
    } else if (['input', 'wait', 'tinput'].includes(v.type)) {
      obs.inputs++;
      const topFn = vm.contextStack?.map(c => c?.fn?.name).filter(Boolean).slice(-1)[0] ?? '?';
      const choice = decide(v.type, topFn);
      if (obs.decisions.length < 400) obs.decisions.push({ i: obs.inputs, type: v.type, choice, tail: buffer.slice(-90).replace(/\n/g, ' ') });
      buffer = '';
      if (choice === null) { await generator.return(); break; }  // stop condition hit
      input = choice;
    }
    if (obs.inputs > 4000) { await generator.return(); obs.stop = 'input-limit'; break; }
  }
  obs.writes = writes;
  return obs;
}

const report = { game: '에라마왕 개조판 1.28', node: process.version };
try {
  const files = await loadGame();

  // Phase A: save into slot 0 via the SAVEGAME scene.
  const storeA = new Map();
  const vmA = compile(files);
  report.fnCount = vmA.fnMap?.size ?? null;
  const a = await drive(vmA, storeA, 'save');
  const save00 = storeA.get('save00.sav');
  report.phaseA = { stop: a.stop, inputs: a.inputs, sawSaveMenu: a.sawSaveMenu, saved: a.saved,
    savedataKeys: [...storeA.keys()], save00Bytes: save00 == null ? null : Buffer.byteLength(save00),
    saveMenuHead: a.saveMenuText };
  if (save00 == null) throw new Error('Phase A did not produce save00.sav');
  const savedParsed = JSON.parse(save00);
  const savedVars = savedParsed.data.variables;
  // DAY/MONEY are 1D arrays in the save; compare element [0]. NAME is per-character.
  const savedDay = Array.isArray(savedVars.DAY) ? savedVars.DAY[0] : savedVars.DAY;
  const savedMoney = Array.isArray(savedVars.MONEY) ? savedVars.MONEY[0] : savedVars.MONEY;
  const savedName = savedParsed.data.characters?.[0]?.NAME ?? null;
  report.phaseA.savedDay = savedDay; report.phaseA.savedMoney = savedMoney; report.phaseA.savedName = savedName;
  report.phaseA.charCount = savedParsed.data.characters?.length ?? 0;

  // Phase B: FRESH vm, only save00 seeded (a reload), load it via the LOADGAME scene.
  const storeB = new Map([['save00.sav', save00]]);
  const vmB = compile(files);
  const b = await drive(vmB, storeB, 'load');
  const loadedDay = vmB.getValue('DAY').get(vmB, [0])?.toString?.() ?? null;
  const loadedMoney = vmB.getValue('MONEY').get(vmB, [0])?.toString?.() ?? null;
  let loadedName = null;
  try { loadedName = vmB.characterList?.[0]?.getValue('NAME')?.value ?? null; } catch { /* ignore */ }
  report.phaseB = { stop: b.stop, inputs: b.inputs, sawLoadMenu: b.sawLoadMenu, loaded: b.loaded,
    loadMenuHead: b.loadMenuText, loadedDay, loadedMoney, loadedName, charCount: vmB.characterList?.length ?? 0 };

  report.roundtrip = {
    dayMatch: String(savedDay) === String(loadedDay),
    moneyMatch: String(savedMoney) === String(loadedMoney),
    nameMatch: savedName != null && String(savedName) === String(loadedName),
  };
  report.ok = a.sawSaveMenu && a.saved && save00 != null && b.sawLoadMenu && b.loaded
    && report.roundtrip.dayMatch && report.roundtrip.moneyMatch && report.roundtrip.nameMatch
    && b.stop === 'shop-after-load';
} catch (error) {
  report.ok = false; report.error = errorInfo(error);
}

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('eramaou128-savemenu.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, phaseA: { stop: report.phaseA?.stop, sawSaveMenu: report.phaseA?.sawSaveMenu,
  save00Bytes: report.phaseA?.save00Bytes, savedDay: report.phaseA?.savedDay, savedMoney: report.phaseA?.savedMoney },
  phaseB: { stop: report.phaseB?.stop, sawLoadMenu: report.phaseB?.sawLoadMenu, loadedDay: report.phaseB?.loadedDay, loadedMoney: report.phaseB?.loadedMoney, loadedName: report.phaseB?.loadedName },
  savedName: report.phaseA?.savedName, roundtrip: report.roundtrip, error: report.error ?? null }, null, 2));
