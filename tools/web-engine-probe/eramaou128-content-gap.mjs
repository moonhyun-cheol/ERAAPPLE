// Phase 0 content-gap static analysis for the FORK game '에라마왕 개조판 1.28'.
// READ-ONLY: never writes into the game folder, never mutates ERB/CSV. Emits results JSON only.
//
// Signals (with confidence):
//   1. ORPHAN functions  (high): @NAME defined but the name never appears as a whole word
//      elsewhere in the corpus, AND not an engine-convention entrypoint. "made but never wired".
//   2. UNDEFINED call/jump targets (high): literal CALL/TRYCALL/JUMP/TRYJUMP NAME whose NAME is
//      not a defined @function. Broken wire (unless built dynamically via *FORM).
//   3. DEAD labels (high): GOTO/TRYGOTO LABEL with no matching $LABEL in the same function.
//   4. Dynamic dispatch tally (context): CALLFORM/JUMPFORM/CALLF counts, so orphan/undefined
//      numbers can be read with the right caveats.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from './inventory.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));

function stripComment(line) {
  const i = line.indexOf(';');
  return i === -1 ? line : line.slice(0, i);
}

const ENTRY_PREFIXES = ['EVENT', 'COM', 'SOURCE', 'SYSTEM_', 'SHOW_', 'USERCOM', 'USERSHOP'];
const ENTRY_EXACT = new Set([
  'SYSTEM_TITLE', 'EVENTFIRST', 'EVENTTRAIN', 'EVENTEND', 'EVENTSHOP', 'EVENTBUY', 'EVENTCOM',
  'EVENTCOMEND', 'EVENTTURNEND', 'USERSHOP', 'USERCOM', 'SAVEINFO',
]);
function isEntry(name) {
  if (ENTRY_EXACT.has(name)) return true;
  return ENTRY_PREFIXES.some(p => name === p || name.startsWith(p));
}

async function loadErb() {
  const files = new Map();
  async function walk(rel) {
    for (const entry of await readdir(path.join(gameRoot, rel), { withFileTypes: true })) {
      const name = rel + '/' + entry.name;
      if (entry.isDirectory()) { await walk(name); continue; }
      if (!entry.isFile()) continue;
      if (!/\.(erb|erh)$/i.test(entry.name)) continue;
      const bytes = await readFile(path.join(gameRoot, name));
      const result = decode(bytes);
      if (result.text == null) throw new Error('encoding-unresolved: ' + name);
      files.set(name, { text: result.text, ext: path.extname(name).toUpperCase() });
    }
  }
  await walk('ERB');
  return files;
}

const report = { game: '에라마왕 개조판 1.28', phase: 'load', readOnly: true };
try {
  const files = await loadErb();
  report.erbCount = files.size;

  const defs = new Map();
  const dupDefs = [];
  const gotoTargets = [];
  const labelsByFn = [];
  const callRefs = [];
  const formUses = { callform: 0, jumpform: 0, callf: 0 };
  const dispatchPrefixes = new Set(); // literal prefixes of *FORM dynamic dispatch (e.g. 'MAOUDIC_ITEM_')
  const wordCount = new Map();
  const wordRe = /[A-Z_][A-Z0-9_]*/g;

  for (const [file, { text }] of files) {
    const lines = text.split(/\r?\n/);
    let curFn = null;
    let curLabels = new Set();
    let curGotos = [];
    const flushFn = () => {
      if (curFn) {
        labelsByFn.push({ file, fn: curFn, labels: curLabels });
        for (const g of curGotos) gotoTargets.push({ file, fn: curFn, label: g.label, line: g.line });
      }
      curFn = null; curLabels = new Set(); curGotos = [];
    };
    lines.forEach((raw, idx) => {
      const code = stripComment(raw);
      const lineNo = idx + 1;
      let m; wordRe.lastIndex = 0;
      while ((m = wordRe.exec(code))) wordCount.set(m[0], (wordCount.get(m[0]) ?? 0) + 1);

      const fnDef = /^\s*@([A-Z_][A-Z0-9_]*)/.exec(code);
      if (fnDef) {
        flushFn();
        curFn = fnDef[1];
        if (defs.has(curFn)) dupDefs.push({ name: curFn, first: defs.get(curFn), dup: { file, line: lineNo } });
        else defs.set(curFn, { file, line: lineNo });
        return;
      }
      const label = /^\s*\$([A-Z_][A-Z0-9_]*)/.exec(code);
      if (label) { curLabels.add(label[1]); return; }

      const call = /^\s*(TRYCALL|TRYJUMP|CALL|JUMP)\s+([A-Z_][A-Z0-9_]*)/.exec(code);
      if (call) callRefs.push({ kind: call[1], name: call[2], file, line: lineNo });
      const go = /^\s*(TRYGOTO|GOTO)\s+([A-Z_][A-Z0-9_]*)/.exec(code);
      if (go) curGotos.push({ label: go[2], line: lineNo });
      if (/\bCALLFORM\b/.test(code)) formUses.callform++;
      if (/\bJUMPFORM\b/.test(code)) formUses.jumpform++;
      if (/\bCALLF\b/.test(code)) formUses.callf++;
    });
    flushFn();
  }

  report.functionCount = defs.size;
  report.duplicateDefinitions = dupDefs.slice(0, 60);
  report.dynamicDispatchUses = formUses;

  const undefinedTargets = [];
  for (const r of callRefs) if (!defs.has(r.name)) undefinedTargets.push(r);
  report.undefinedCallJumpCount = undefinedTargets.length;
  report.undefinedCallJump = undefinedTargets.slice(0, 120);

  const labelSetByKey = new Map(labelsByFn.map(x => [x.file + '::' + x.fn, x.labels]));
  const deadLabels = [];
  for (const g of gotoTargets) {
    const labels = labelSetByKey.get(g.file + '::' + g.fn);
    if (!labels || !labels.has(g.label)) deadLabels.push(g);
  }
  report.deadLabelCount = deadLabels.length;
  report.deadLabels = deadLabels.slice(0, 120);

  const referencedNames = new Set(callRefs.map(r => r.name));
  const orphans = [];
  for (const [name, loc] of defs) {
    if (isEntry(name)) continue;
    if (referencedNames.has(name)) continue;
    const count = wordCount.get(name) ?? 0;
    if (count > 1) continue;
    orphans.push({ name, file: loc.file, line: loc.line });
  }
  report.orphanFunctionCount = orphans.length;
  report.orphanFunctions = orphans;

  // Bucket orphans by file so the raw list is navigable (which files hold the most unwired funcs).
  const byFile = {};
  for (const o of orphans) (byFile[o.file] ??= []).push(o.name);
  report.orphansByFile = Object.fromEntries(
    Object.entries(byFile).sort((a, b) => b[1].length - a[1].length).map(([f, names]) => [f, names]));

  // Numbered-family gap: functions like NAME<digits> where some members are orphaned while
  // sibling numbers are wired = a dispatcher that skipped specific indices (highest-signal real gap).
  const famMembers = new Map();   // base -> Set(numbers defined)
  const famOrphan = new Map();    // base -> Set(numbers orphaned)
  const orphanNames = new Set(orphans.map(o => o.name));
  for (const name of defs.keys()) {
    const mm = /^([A-Z_][A-Z0-9_]*?)(\d+)$/.exec(name);
    if (!mm) continue;
    const [, base, num] = mm;
    (famMembers.get(base) ?? famMembers.set(base, new Set()).get(base)).add(Number(num));
    if (orphanNames.has(name)) (famOrphan.get(base) ?? famOrphan.set(base, new Set()).get(base)).add(Number(num));
  }
  const familyGaps = [];
  for (const [base, orphanNums] of famOrphan) {
    const all = famMembers.get(base);
    if (all.size - orphanNums.size >= 2 && orphanNums.size >= 1) {
      familyGaps.push({ base, wired: [...all].filter(n => !orphanNums.has(n)).sort((a, b) => a - b),
        unwired: [...orphanNums].sort((a, b) => a - b) });
    }
  }
  report.numberedFamilyGaps = familyGaps.sort((a, b) => b.unwired.length - a.unwired.length);

  report.phase = 'ok';
  report.ok = true;
} catch (error) {
  report.ok = false;
  report.error = { name: error?.name, message: error?.message };
}

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('eramaou128-content-gap.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, erbCount: report.erbCount, functionCount: report.functionCount,
  orphanFunctionCount: report.orphanFunctionCount, undefinedCallJumpCount: report.undefinedCallJumpCount,
  deadLabelCount: report.deadLabelCount, dynamicDispatchUses: report.dynamicDispatchUses,
  duplicateDefs: report.duplicateDefinitions?.length,
  numberedFamilyGaps: report.numberedFamilyGaps?.map(g => g.base + ' unwired=[' + g.unwired.join(',') + ']'),
  error: report.error }, null, 2));
