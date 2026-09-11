// Phase 1 "skeleton-only" (틀만 잡힌) content detector for the FORK '에라마왕 개조판 1.28'.
// READ-ONLY: never writes into the game folder. Emits results JSON only.
//
// Goal: find functions/branches whose STRUCTURE exists (branches, cases, event hooks)
// but whose NARRATIVE BODY (PRINT-family text) is empty or very thin. This is the
// "made the frame, never wrote the content" case the automatic call/jump scan can't see.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from './inventory.mjs';

const gameRoot = fileURLToPath(new URL('../../에라마왕 개조판 1.28/', import.meta.url));
const PER_BRANCH_MIN = 12;   // expected literal chars of narration per branch to not look skeletal
const TOP = 200;

function stripComment(line) {
  const i = line.indexOf(';');
  return i === -1 ? line : line.slice(0, i);
}

const PRINT_RE = /^\s*(PRINTSINGLE|PRINTFORMS|PRINTFORM|PRINTFORMW|PRINTFORML|PRINTFORMLC|PRINTFORMC|PRINTFORMD|PRINTSL|PRINTS|PRINTVL|PRINTV|PRINTLC|PRINTLW|PRINTL|PRINTW|PRINTC|PRINTDL|PRINTD|PRINT)\b(.*)$/;
// Text-carrying print variants: an EMPTY body here (no literal text, no %var%, no {expr})
// is a deliberate placeholder for unwritten narration — the strongest "틀만 잡힘" signal.
const TEXT_PRINT = new Set(['PRINTSINGLE','PRINTFORMS','PRINTFORM','PRINTFORMW','PRINTFORML',
  'PRINTFORMLC','PRINTFORMC','PRINTFORMD','PRINTSL','PRINTS','PRINTW']);
function isEmptyPlaceholder(cmd, rest) {
  if (!TEXT_PRINT.has(cmd)) return false;
  const s = (rest || '').trim();
  if (s.length === 0) return true;           // e.g. "PRINTFORMW " with nothing
  return false;
}
const BRANCH_RE = /^\s*(SELECTCASE|CASEELSE|CASE|ELSEIF|ELSE|IF|SIF|REPEAT|FOR|WHILE|DO)\b/;
const CALL_RE = /^\s*(TRYCALLFORM|TRYJUMPFORM|CALLFORM|JUMPFORM|TRYCCALLFORM|TRYCALL|TRYJUMP|CALLF|CALL|JUMP)\b/;

function textLen(rest) {
  if (!rest) return 0;
  let s = rest;
  s = s.replace(/%[^%]*%/g, '');       // %VAR:idx%
  s = s.replace(/\{[^}]*\}/g, '');     // {EXPR}
  s = s.replace(/\\[a-zA-Z@]/g, '');   // \n \@ etc.
  s = s.trim();
  return s.length;
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
      files.set(name, result.text);
    }
  }
  await walk('ERB');
  return files;
}

const report = { game: '에라마왕 개조판 1.28', phase: 'load', readOnly: true, perBranchMin: PER_BRANCH_MIN };
try {
  const files = await loadErb();
  report.erbCount = files.size;

  const fns = [];
  const emptyCases = [];

  for (const [file, text] of files) {
    const lines = text.split(/\r?\n/);
    let fn = null;

    const startFn = (name, line) => {
      fn = { name, file, line, codeLines: 0, printLines: 0, printedChars: 0, branchPoints: 0, calls: 0, emptyPrints: 0 };
    };
    const endFn = () => { if (fn) fns.push(fn); fn = null; };

    let caseOpen = null;
    const closeCase = () => {
      if (caseOpen && caseOpen.printed === 0)
        emptyCases.push({ file, fn: fn ? fn.name : null, case: caseOpen.label, line: caseOpen.line });
      caseOpen = null;
    };

    lines.forEach((raw, idx) => {
      const code = stripComment(raw);
      const lineNo = idx + 1;
      if (!code.trim()) return;

      const def = /^\s*@([A-Z_][A-Z0-9_]*)/.exec(code);
      if (def) { closeCase(); endFn(); startFn(def[1], lineNo); return; }
      if (!fn) return;

      fn.codeLines++;

      const sel = /^\s*SELECTCASE\b/.test(code);
      const caseM = /^\s*(CASEELSE|CASE)\b(.*)$/.exec(code);
      const endsel = /^\s*ENDSELECT\b/.test(code);
      if (sel) closeCase();
      if (caseM) { closeCase(); caseOpen = { label: (caseM[2] || caseM[1]).trim() || 'CASE', line: lineNo, printed: 0 }; }
      if (endsel) closeCase();

      const p = PRINT_RE.exec(code);
      if (p) {
        fn.printLines++;
        const t = textLen(p[2]);
        fn.printedChars += t;
        if (isEmptyPlaceholder(p[1], p[2])) fn.emptyPrints++;
        if (caseOpen && t > 0) caseOpen.printed += t;
        else if (caseOpen && /PRINTFORM|PRINTV|PRINTS|%|\{/.test(code)) caseOpen.printed += 1;
      }
      if (BRANCH_RE.test(code)) fn.branchPoints++;
      if (CALL_RE.test(code)) fn.calls++;
    });
    closeCase();
    endFn();
  }

  report.functionCount = fns.length;

  // PRIMARY, reliable signal: functions with empty placeholder print statements
  // (narration hook placed, text never written). Ranked by emptyPrints.
  const unwritten = fns.filter(f => f.emptyPrints > 0).sort((a, b) => b.emptyPrints - a.emptyPrints);
  report.totalEmptyPrints = fns.reduce((s, f) => s + f.emptyPrints, 0);
  report.unwrittenFunctionCount = unwritten.length;
  report.unwrittenFunctions = unwritten.slice(0, TOP);
  const upByFile = {};
  for (const f of unwritten) upByFile[f.file] = (upByFile[f.file] || 0) + f.emptyPrints;
  report.emptyPrintsByFile = Object.fromEntries(Object.entries(upByFile).sort((a, b) => b[1] - a[1]).slice(0, 40));

  // SECONDARY (noisy) heuristic kept for reference.
  const skeleton = fns
    .filter(f => f.branchPoints >= 2 && f.calls === 0 && f.printedChars < f.branchPoints * PER_BRANCH_MIN)
    .map(f => ({ ...f, skeletonScore: Math.round((f.branchPoints * PER_BRANCH_MIN - f.printedChars) + f.branchPoints) }))
    .sort((a, b) => b.skeletonScore - a.skeletonScore);

  report.skeletonFunctionCount = skeleton.length;
  report.skeletonFunctions = skeleton.slice(0, 40);

  const byFile = {};
  for (const f of skeleton) byFile[f.file] = (byFile[f.file] || 0) + 1;
  report.skeletonByFile = Object.fromEntries(Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 40));

  report.emptyCaseCount = emptyCases.length;
  report.emptyCases = emptyCases.slice(0, TOP);
  const ecByFile = {};
  for (const c of emptyCases) ecByFile[c.file] = (ecByFile[c.file] || 0) + 1;
  report.emptyCasesByFile = Object.fromEntries(Object.entries(ecByFile).sort((a, b) => b[1] - a[1]).slice(0, 40));

  report.phase = 'ok';
  report.ok = true;
} catch (error) {
  report.ok = false;
  report.error = { name: error && error.name, message: error && error.message };
}

const out = new URL('./results/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('eramaou128-thin-body.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, erbCount: report.erbCount, functionCount: report.functionCount,
  totalEmptyPrints: report.totalEmptyPrints, unwrittenFunctionCount: report.unwrittenFunctionCount,
  emptyPrintsByFile: report.emptyPrintsByFile,
  top20unwritten: (report.unwrittenFunctions || []).slice(0, 20).map(f => f.name + ' @' + f.file + ':' + f.line + ' empty=' + f.emptyPrints),
  error: report.error }, null, 2));
