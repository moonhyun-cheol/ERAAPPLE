// Fingerprint-checked isolated overlays for two upstream eraJS compatibility
// gaps. The pinned eraJS checkout stays untouched; each transform verifies the
// source hash and the exact match count so a future engine bump fails loudly
// instead of silently skipping the fix.
//
//   1. SELECTCASE never executed its CASEELSE (`this.def`) branch: when no CASE
//      matched, `run` returned null and dropped the default body. This broke any
//      `#FUNCTIONS` inline call whose value came from a CASEELSE (surfacing as
//      "Inline call should return a value") and silently skipped default
//      handling everywhere SELECTCASE is used.
//   2. A runtime string used as a variable index (Emuera resolves e.g.
//      `TALENT:MASTER:(LOCALS:LOCAL)` through the matching CSV name table) threw
//      "Index of variable should be an integer". We resolve the string via the
//      variable's *NAME table / registered CSV constant, matching Emuera.
//   3. GAMEBASE.CSV with an empty コード/バージョン value: eraJS parseInt('')->NaN
//      throws "Code/Version in GAMEBASE.CSV should be an integer". Emuera treats a
//      missing metadata value as 0; we default blank to 0 (verified against
//      '에라마왕 개조판 1.28' whose コード/バージョン rows are empty).
//   4. File-scope declarations (e.g. `#DIM GLOBAL` before the first @function):
//      eraJS's parseFn treats the first line as an `@definition` and throws
//      "Expected one of ('@')". Emuera registers such leading properties as globals
//      like an .ERH header entry. parseERB now collects them and compile() merges
//      them into the header (proven path: the discovery run reached the intro).
//   5. Built-in autosave scene emitted a malformed synthetic
//      `SAVEDATA 99 SAVEDATA_TEXT` Slice with two defects: it omitted the
//      argument offset (so the SaveData PARSER, arg2R2 == WS1 then args, saw the
//      "SAVEDATA" keyword) and used space instead of the comma separator that
//      real ERB uses (`SAVEDATA 999, "..."`). Every other synthetic scene
//      statement passes the keyword length as the Slice offset. Only reachable
//      when the game lacks @SYSTEM_AUTOSAVE (the main game defines it, so it
//      never fired; '에라마왕 개조판 1.28' does not, so its very first shop autosave
//      crashed). We insert the comma and the missing "SAVEDATA".length offset.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const caseHash = '7c17c9eeb8e9d86e719b975736333b36f73394b709eeb6aa8b307bf69617750c';
const variableHash = 'e2d3c846c7ed6d3c0991e7464cb7445e4f4e29ea497b2023bf36690d5b5cc6df';
const gamebaseHash = '29f75dddc12429bd140ddb052e0cf6f0c9413a52d918eaa1f5466bdd2564a095';
const erbHash = '4bdcd4db383fed0413279507eb8e25e237bffa2490a016efc87a5176a15b6227';
const indexHash = 'c80f7eff1a62dcb6b57949a1a337437443ca2b0b316e92b38fc7f8766fd32913';
const dimHash = 'ad6796e361d6f5be9749a95f4244f258f16c04c3ad735e32d78d81a36dcf263e';
const sceneHash = '074903852ba7a8dc24c89fbfc46f5b157f1c54435c9be3d592002e92dcb9154c';

function makeReplace(label, source) {
  const state = { source };
  return {
    apply(oldText, newText, expected = 1) {
      const count = state.source.split(oldText).length - 1;
      if (count !== expected) throw new Error(`${label} match count: ${count} != ${expected}`);
      state.source = state.source.split(oldText).join(newText);
    },
    result: () => state.source,
  };
}

export function transformCaseSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== caseHash) throw new Error(`Compat fix source fingerprint mismatch: case.js (${digest})`);
  const r = makeReplace('Compat case.js', source);
  // Honour a GOTO label that lands inside the CASEELSE body.
  r.apply(
    `                    return yield* thunk.run(vm, label);
                }
            }
        }
        const value = await this.arg.get().reduce(vm);`,
    `                    return yield* thunk.run(vm, label);
                }
            }
            if (this.def.labelMap.has(label)) {
                return yield* this.def.run(vm, label);
            }
        }
        const value = await this.arg.get().reduce(vm);`);
  // Run the CASEELSE body when no CASE branch matched (empty Thunk when absent,
  // so this stays a no-op returning null for SELECTCASE without CASEELSE).
  r.apply(
    `            if (satisfied) {
                return yield* expr.run(vm);
            }
        }
        return null;
    }`,
    `            if (satisfied) {
                return yield* expr.run(vm);
            }
        }
        return yield* this.def.run(vm);
    }`);
  return r.result();
}

export function transformVariableSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== variableHash) throw new Error(`Compat fix source fingerprint mismatch: variable.js (${digest})`);
  const r = makeReplace('Compat variable.js', source);
  r.apply(
    `import * as assert from "../../assert";
export default class Variable {`,
    `import * as assert from "../../assert";
function resolveNameIndex(vm, name, key) {
    // Emuera maps a string variable index to an integer through the variable's
    // CSV name table (e.g. TALENT -> TALENTNAME) or a registered CSV constant.
    if (key === "")
        return key;
    const nameVar = vm.globalMap.get(name + "NAME");
    if (nameVar != null && Array.isArray(nameVar.value)) {
        const index = nameVar.value.indexOf(key);
        if (index >= 0)
            return BigInt(index);
    }
    const konst = vm.globalMap.get(key);
    if (konst != null && typeof konst.value === "bigint")
        return konst.value;
    return key;
}
export default class Variable {`);
  r.apply(
    `            for (const i of this.index) {
                const value = await i.reduce(vm);
                assert.bigint(value, "Index of variable should be an integer");
                result.push(Number(value));
            }`,
    `            for (const i of this.index) {
                let value = await i.reduce(vm);
                if (typeof value === "string") {
                    value = resolveNameIndex(vm, this.name, value);
                }
                assert.bigint(value, "Index of variable should be an integer");
                result.push(Number(value));
            }`);
  return r.result();
}

export function transformDimSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== dimHash) throw new Error(`Compat fix source fingerprint mismatch: dim.js (${digest})`);
  const r = makeReplace('Compat dim.js', source);
  // eraJS only sized #DIM(S) initializers of length 0 or 1; a multi-element list with
  // no explicit size fell through to the size-based branch and became a 0D scalar
  // (VARSIZE => 1). Emuera sizes the array to the initializer count (or the declared
  // size, whichever is larger). e.g. `#DIMS ARR_HAIRCOLOR = "","..",..` (8 elems) must
  // report VARSIZE 8 so `RAND(VARSIZE(..)-1)` is not RAND(0) (Division by zero).
  r.apply(
    `        else if (this.value != null && this.value.length === 1 && this.type === "string") {
            const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
            assert.strArray(value, "Default value for 1D #DIMS must be a string array");
            return new Str1DValue(this.name, [value.length]).reset(value);
        }
        else if (this.size.length === 0 && this.type === "number" && !this.isChar()) {`,
    `        else if (this.value != null && this.value.length === 1 && this.type === "string") {
            const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
            assert.strArray(value, "Default value for 1D #DIMS must be a string array");
            return new Str1DValue(this.name, [value.length]).reset(value);
        }
        else if (this.value != null && this.value.length > 1 && this.type === "number" && this.size.length <= 1 && !this.isChar()) {
            const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
            assert.bigintArray(value, "Default value for 1D #DIM must be a number array");
            let length = value.length;
            if (this.size.length === 1) {
                const size = await this.size[0].reduce(vm);
                assert.bigint(size, "Size of an array must be an integer");
                length = Math.max(Number(size), value.length);
            }
            return new Int1DValue(this.name, [length]).reset(value);
        }
        else if (this.value != null && this.value.length > 1 && this.type === "string" && this.size.length <= 1 && !this.isChar()) {
            const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
            assert.strArray(value, "Default value for 1D #DIMS must be a string array");
            let length = value.length;
            if (this.size.length === 1) {
                const size = await this.size[0].reduce(vm);
                assert.bigint(size, "Size of an array must be an integer");
                length = Math.max(Number(size), value.length);
            }
            return new Str1DValue(this.name, [length]).reset(value);
        }
        else if (this.size.length === 0 && this.type === "number" && !this.isChar()) {`);
  return r.result();
}

export function transformSceneSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== sceneHash) throw new Error(`Compat fix source fingerprint mismatch: scene.js (${digest})`);
  const r = makeReplace('Compat scene.js', source);
  // Two defects in one synthetic statement, both only reachable without
  // @SYSTEM_AUTOSAVE: (a) the Slice omits the argument offset, so the PARSER
  // (arg2R2 == WS1 then args) saw the "SAVEDATA" keyword; (b) the argument text
  // is space-separated ("99 SAVEDATA_TEXT") but SAVEDATA's PARSER is comma-
  // separated exactly like real ERB (`SAVEDATA 999, "..."`). Fix both: insert the
  // comma and pass "SAVEDATA".length as the offset, matching every other scene
  // statement and the real command syntax.
  r.apply(
    'new Slice(FILE, 0, "SAVEDATA 99 SAVEDATA_TEXT")',
    'new Slice(FILE, 0, "SAVEDATA 99, SAVEDATA_TEXT", "SAVEDATA".length)');
  return r.result();
}

export function transformGamebaseSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== gamebaseHash) throw new Error(`Compat fix source fingerprint mismatch: gamebase.js (${digest})`);
  const r = makeReplace('Compat gamebase.js', source);
  // Emuera allows an empty/missing コード value; default blank to 0 instead of NaN.
  r.apply(
    ['            case "\u30b3\u30fc\u30c9": {',
     '                const code = parseInt(row[1]);'].join('\n'),
    ['            case "\u30b3\u30fc\u30c9": {',
     '                const rawCode = row[1];',
     '                const code = rawCode == null || rawCode.trim() === "" ? 0 : parseInt(rawCode);'].join('\n'));
  // Same for an empty/missing バージョン value.
  r.apply(
    ['            case "\u30d0\u30fc\u30b8\u30e7\u30f3": {',
     '                const version = parseInt(row[1]);'].join('\n'),
    ['            case "\u30d0\u30fc\u30b8\u30e7\u30f3": {',
     '                const rawVersion = row[1];',
     '                const version = rawVersion == null || rawVersion.trim() === "" ? 0 : parseInt(rawVersion);'].join('\n'));
  return r.result();
}

export function transformErbSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== erbHash) throw new Error(`Compat fix source fingerprint mismatch: erb.js (${digest})`);
  const r = makeReplace('Compat erb.js', source);
  r.apply(
    `export default function parseERB(files, macros) {
    const result = [];
    for (const [name, content] of files) {`,
    `export default function parseERB(files, macros) {
    const result = [];
    const globals = [];
    for (const [name, content] of files) {`);
  r.apply(
    `        let index = 0;
        while (lines.length > index) {
            const [fn, consumed] = parseFn(lines, index);
            result.push(fn);
            index += consumed;
        }
    }
    return result;
}`,
    `        let index = 0;
        // Emuera registers file-scope declarations (e.g. #DIM GLOBAL) that appear
        // before the first @function as globals, exactly like an .ERH header entry.
        while (lines.length > index && lines[index].content.startsWith("#")) {
            globals.push(U.tryParse(prop, lines[index]));
            index += 1;
        }
        while (lines.length > index) {
            const [fn, consumed] = parseFn(lines, index);
            result.push(fn);
            index += consumed;
        }
    }
    result.globals = globals;
    return result;
}`);
  return r.result();
}

export function transformIndexSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== indexHash) throw new Error(`Compat fix source fingerprint mismatch: index.js (${digest})`);
  const r = makeReplace('Compat index.js', source);
  r.apply(
    `    const fnList = parseERB(erbFiles, macros);
    return new VM({ header, fnList, csv });`,
    `    const fnList = parseERB(erbFiles, macros);
    const mergedHeader = fnList.globals != null ? header.concat(fnList.globals) : header;
    return new VM({ header: mergedHeader, fnList, csv });`);
  return r.result();
}

export function compatFixPlugin(engine) {
  return { name: 'era-compat-fix-v1', setup(build) {
    build.onLoad({ filter: /[\\/]build[\\/]statement[\\/]command[\\/]case\.js$/ }, async args => ({
      contents: transformCaseSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
    build.onLoad({ filter: /[\\/]build[\\/]statement[\\/]expr[\\/]variable\.js$/ }, async args => ({
      contents: transformVariableSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
    build.onLoad({ filter: /[\\/]build[\\/]csv[\\/]gamebase\.js$/ }, async args => ({
      contents: transformGamebaseSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
    build.onLoad({ filter: /[\\/]build[\\/]parser[\\/]erb\.js$/ }, async args => ({
      contents: transformErbSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
    build.onLoad({ filter: /eraJS[\\/]build[\\/]index\.js$/ }, async args => ({
      contents: transformIndexSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
    build.onLoad({ filter: /[\\/]build[\\/]property[\\/]dim\.js$/ }, async args => ({
      contents: transformDimSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
    build.onLoad({ filter: /[\\/]build[\\/]scene\.js$/ }, async args => ({
      contents: transformSceneSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
  } };
}
