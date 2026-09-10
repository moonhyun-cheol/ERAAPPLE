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
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const caseHash = '7c17c9eeb8e9d86e719b975736333b36f73394b709eeb6aa8b307bf69617750c';
const variableHash = 'e2d3c846c7ed6d3c0991e7464cb7445e4f4e29ea497b2023bf36690d5b5cc6df';

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
  } };
}
