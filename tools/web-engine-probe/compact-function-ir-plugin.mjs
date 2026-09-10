// Fingerprint-checked local overlay; the pinned eraJS checkout remains untouched.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const hashes = {
  'thunk.js': '48485c8b577db629b0cd84d2b9aa59ef0fe69bad0902713227883a7ecfdadf06',
  'lazy.js': '626cd30410c0aea147b150551ca584965eb229d54e20eacfa22cc413b915d5a5',
  'slice.js': '9ead05fe3d42404488b5cad23297fb57ac88144b39d60e17279b724a9611de6e',
  'printer.js': '221ca0d8db63b75b5caf50d8eb14b738c1f59146af17d785d4c82c4c448faed9',
  'statement/assign/index.js': '4cac9672488c27895147f83faa704ee295b4cb611fe3dd4a6bc73bac13ca0d31',
  'statement/command/if.js': 'e97f5775df17c1b7bf3c5be055d9f4a8cc275c069c34246d2e81832d082af6c4',
  'statement/command/print.js': '837e0dd59914a68db3febb17d586469d7ed7f942ba7d0583a314a44349756abc',
  'statement/command/printc.js': '1dff7fb9eec196fb9293daec84e891fb12371979f54e13b617c766c123335147',
  'statement/command/printdata.js': '381ac5b9405ae0e21a650a67008c1711ec64d0e5e90efefab621d16c80d1ed03',
  'statement/command/printform.js': '9184e2aabd1f3bb0025902b282506a0385ed851188cb3163370508c61bdbed9c',
  'statement/command/printformc.js': 'd6093283d3a040b68d472dadbd83cee670d28c67609d3616f63ca0831beff926',
  'statement/command/printforms.js': '8f76fead03e765a37ec3c73b365b9330f83d30b738b877edc493f07bc6e20b97',
  'statement/command/prints.js': 'b499fa0b2202e2f0d0a74ab12de60f486b3c0fd8a31a549da246bb6a500e4871',
  'statement/command/printv.js': 'ad4e2c7d8ee8684da417c59f7789a4293c1f4b32f2519de545973ae064f63b38'
};
const helper = path.join(here, 'compact-function-ir.mjs').replaceAll('\\', '/');
const labelHelper = path.join(here, 'compact-label-map.mjs').replaceAll('\\', '/');
const lazySliceHelper = path.join(here, 'compact-lazy-slice.mjs').replaceAll('\\', '/');

export function transformCompactFunctionSource(relative, source,
  { compactLabels = false, compactLazy = false, compactSlice = false, compactStatements = false,
    compactPrintFormPayload = false, compactAssignPayload = false, compactIfPayload = false } = {}) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== hashes[relative]) {
    throw new Error(`Compact function IR source fingerprint mismatch: ${relative} (${digest})`);
  }
  const replace = (oldText, newText, expected) => {
    const count = source.split(oldText).length - 1;
    if (count !== expected) throw new Error(`Compact function IR match count ${relative}: ${count} != ${expected}`);
    source = source.split(oldText).join(newText);
  };
  if (relative === 'lazy.js') {
    if (!compactLazy) return source;
    return `import * as U from "./parser/util";\nimport { createCompactLazy } from ${JSON.stringify(lazySliceHelper)};\nexport default createCompactLazy(U.tryParse);\n`;
  }
  if (relative === 'slice.js') {
    if (!compactSlice) return source;
    return `export { CompactSlice as default } from ${JSON.stringify(lazySliceHelper)};\n`;
  }
  if (relative === 'thunk.js') {
    if (compactLabels) {
      source = `import { CompactLabelMap } from ${JSON.stringify(labelHelper)};\n` + source;
      replace('this.labelMap = new Map();', 'this.labelMap = new CompactLabelMap();', 1);
    }
    if (compactStatements) {
      source = `import { compactStatementVector, statementVectorLength, statementVectorAt } from ${JSON.stringify(helper)};\n` + source;
      replace('        }\n    }\n    async *run(vm, label) {',
        '        }\n        this.statement = compactStatementVector(this.statement);\n    }\n    async *run(vm, label) {', 1);
      replace('for (let i = start; i < this.statement.length; ++i) {\n            const statement = this.statement[i];',
        'for (let i = start; i < statementVectorLength(this.statement); ++i) {\n            const statement = statementVectorAt(this.statement, i);', 1);
    }
    return source;
  } else if (relative === 'statement/assign/index.js') {
    if (compactAssignPayload) replace('    inner;\n', '', 1);
    return source;
  } else if (relative === 'statement/command/if.js') {
    if (compactIfPayload) {
      // Each IF/ELSEIF branch eagerly allocates a Lazy wrapper (raw already parsed lazily).
      // Defer the wrapper allocation until the branch first runs; parse timing is unchanged,
      // so semantics (including parse-error timing) are identical.
      replace('        this.ifThunk = ifThunk.map(([raw, thunk]) => [\n            raw,\n            new Lazy(raw, PARSER),\n            thunk,\n        ]);',
        '        this.ifThunk = ifThunk.map(([raw, thunk]) => [raw, null, thunk]);', 1);
      replace('        for (const [, cond, thunk] of this.ifThunk) {\n            const condValue = await cond.get().reduce(vm);\n            assert.bigint(condValue, "Condition should be an integer");\n            if (condValue !== 0n) {\n                return yield* thunk.run(vm);\n            }\n        }',
        '        for (const branch of this.ifThunk) {\n            let cond = branch[1];\n            if (cond === null) {\n                cond = new Lazy(branch[0], PARSER);\n                branch[1] = cond;\n            }\n            const condValue = await cond.get().reduce(vm);\n            assert.bigint(condValue, "Condition should be an integer");\n            if (condValue !== 0n) {\n                return yield* branch[2].run(vm);\n            }\n        }', 1);
    }
    return source;
  } else if (relative === 'printer.js') {
    source = `import { hasPrintFlag } from ${JSON.stringify(helper)};\n` + source;
    replace('flags.has("S")', 'hasPrintFlag(flags, "S")', 2);
    replace('flags.has("L")', 'hasPrintFlag(flags, "L")', 1);
    replace('flags.has("W")', 'hasPrintFlag(flags, "W")', 2);
  } else {
    source = `import { encodePrintFlags } from ${JSON.stringify(helper)};\n` + source;
    replace('this.flags = new Set(flags);', 'this.flags = encodePrintFlags(flags);', 1);
    if (relative === 'statement/command/printform.js' && compactPrintFormPayload) {
      replace('import Lazy from "../../lazy";\n', '', 1);
      replace('this.arg = new Lazy(raw, PARSER);', 'this.arg = null;', 1);
      replace('const value = await this.arg.get().reduce(vm);',
        'const arg = this.arg ?? U.tryParse(PARSER, this.raw);\n        this.arg = arg;\n        const value = await arg.reduce(vm);', 1);
    }
  }
  return source;
}

export function compactFunctionIrPlugin(engine,
  { compactLabels = false, compactLazy = false, compactSlice = false, compactStatements = false,
    compactPrintFormPayload = false, compactAssignPayload = false, compactIfPayload = false } = {}) {
  const suffix = [compactLabels && 'labels', compactLazy && 'lazy', compactSlice && 'slice', compactStatements && 'statements',
    compactPrintFormPayload && 'printform', compactAssignPayload && 'assign', compactIfPayload && 'if'].filter(Boolean).join('-');
  return { name: `era-compact-function-ir${suffix ? `-${suffix}` : ''}-v1`, setup(build) {
    build.onLoad({ filter: /[\\/]build[\\/](lazy|slice|thunk|printer|statement[\\/](assign[\\/]index|command[\\/](if|print(c|data|form(c|s)?|s|v)?)))\.js$/ }, async args => {
      const relative = path.relative(path.join(engine, 'build'), args.path).replaceAll('\\', '/');
      if (!hashes[relative]) throw new Error('Unexpected compact function IR path: ' + args.path);
      return { contents: transformCompactFunctionSource(relative, await readFile(args.path, 'utf8'),
        { compactLabels, compactLazy, compactSlice, compactStatements, compactPrintFormPayload, compactAssignPayload, compactIfPayload }), loader: 'js', resolveDir: path.dirname(args.path) };
    });
  } };
}