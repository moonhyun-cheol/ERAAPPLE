// Local build overlay only: do not modify the pinned upstream checkout.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const hashes = {
  'value/str-1d.js': '6bd79d11519c6726f02c68a82217a213fa324db62f652757a479ba04a281f8a0',
  'value/int-1d.js': 'b79b4071f47bc7b1cc5522490779b8c9a60165755d14249660a734fb10d79888',
  'value/int-2d.js': '0fb8ea127d0785e39f4dc6fff9c86b4fa13cb5bbb8e5451a4c41323cab5da0a5',
  'value/int-3d.js': '4c560a9090c89322cd84301d15a9e650e5605042c54fc4766fa11e102fdba6e0',
  'statement/command/savedata.js': '8ce412f48c7e09c9a9187639e4e6caaf4bd9ba14954009175d7b7c92666b57f8',
  'statement/command/saveglobal.js': '8f13e5fd3c20f5ce5c3d35cfeb4a5a41fd0c4aec1f71e019763aa78f23c739b3',
  'statement/command/loaddata.js': '576b1aa06480b3427360a127b98c1e5c947ac66cc93c0aa9600d8fc1eb61b633',
  'statement/command/loadglobal.js': '470762902ec909afee065a73581c2088b98d00d086483f4da5e414a788842cba'
};
export function transformSaveSource(relative, source, { lazyLocals = true, pagedStorage = false, sparse1d = false } = {}) {
  // Compare canonical line endings so a clean Windows or Linux checkout works.
  source = source.replaceAll('\r\n', '\n');
  if (createHash('sha256').update(source).digest('hex') !== hashes[relative]) {
    throw new Error('Save overlay source fingerprint mismatch: ' + relative);
  }
  const replace = (old, replacement, count = 1) => {
    if (source.split(old).length - 1 !== count) throw new Error('Save overlay match count: ' + relative);
    source = source.split(old).join(replacement);
  };
  if (relative.startsWith('value/int-')) {
    replace('        this.name = name;\n        this.value =', '        this.name = name;\n        this.saveShape = [...realSize];\n        this.value =');
  } else if (/\/save(data|global)\.js$/.test(relative)) {
    const global = relative.endsWith('saveglobal.js');
    source = `import { compactIntegers } from ${JSON.stringify(path.join(here, 'compact-save.mjs').replaceAll('\\', '/'))};\n` + source;
    replace('        const saveData = {', `        await vm.external.saveProgress?.({ phase: 'serialize', key: ${global ? 'savefile.global' : 'savefile.game(Number(index))'} });\n        const saveData = {`);
    replace('cell.value.map((value) => value.toString())', 'compactIntegers(cell.value, cell.saveShape)');
    replace('cell.value.map((value0) => value0.map((value1) => value1.toString()))', 'compactIntegers(cell.value, cell.saveShape)');
    replace('cell.value.map((value0) => value0.map((value1) => value1.map((value2) => value2.toString())))', 'compactIntegers(cell.value, cell.saveShape)');
    if (global) replace('vm.getValue("GLOBAL").value.map((value) => value.toString())', 'compactIntegers(vm.getValue("GLOBAL").value, vm.getValue("GLOBAL").saveShape)');
    else replace('characterCell.value.map((value) => value.toString())', 'compactIntegers(characterCell.value, characterCell.saveShape)');
  } else if (relative.startsWith('statement/')) {
    // Numeric reset already invokes BigInt at each leaf. Keep upstream validation;
    // avoid allocating a second full nested array just to convert strings first.
    replace('cell.reset(value.map((v) => BigInt(v)));', 'cell.reset(value);', relative.endsWith('loaddata.js') ? 2 : 1);
    replace('cell.reset(value.map((v0) => v0.map((v1) => BigInt(v1))));', 'cell.reset(value);');
    replace('cell.reset(value.map((v0) => v0.map((v1) => v1.map((v2) => BigInt(v2)))));', 'cell.reset(value);');
  }
  if (lazyLocals && ['value/int-1d.js', 'value/str-1d.js'].includes(relative)) {
    const numeric = relative === 'value/int-1d.js';
    const zero = numeric ? '0n' : '""';
    const name = numeric ? 'LOCAL' : 'LOCALS';
    source = `import { deferLocalArray } from ${JSON.stringify(path.join(here, 'deferred-local.mjs').replaceAll('\\', '/'))};\n` + source;
    replace(`        this.value = new Array(realSize[0]).fill(${zero});`,
      `        if (name === "${name}") deferLocalArray(this, realSize[0], ${zero});\n        else this.value = new Array(realSize[0]).fill(${zero});`);
  }
  if (pagedStorage && relative.startsWith('value/')) {
    const zero = relative === 'value/str-1d.js' ? '""' : '0n';
    source = `import { createPagedArray, pagedArrayGet, pagedArraySet } from ${JSON.stringify(path.join(here, 'paged-default-array.mjs').replaceAll('\\', '/'))};\n` + source;
    if (relative === 'value/int-1d.js') {
      // Global (non-LOCAL) 1-D integer arrays dominate the day-16 live heap: ~11.4M
      // slots that are 99.98% the 0n default. sparse1d keeps those rows unphysicalized
      // (paged, promote-on-saturation) instead of a dense fill; semantics are identical.
      replace('        else this.value = new Array(realSize[0]).fill(0n);',
        `        else this.value = createPagedArray(realSize, 0n${sparse1d ? ', { sparse1d: true }' : ''});`);
    } else if (relative === 'value/str-1d.js') {
      replace('        else this.value = new Array(realSize[0]).fill("");',
        '        else this.value = createPagedArray(realSize, "");');
    } else {
      const allocations = {
        'value/int-2d.js': 'new Array(realSize[0]).fill(0).map(() => new Array(realSize[1]).fill(0n))',
        'value/int-3d.js': 'new Array(realSize[0]).fill(0).map(() => new Array(realSize[1]).fill(0).map(() => new Array(realSize[2]).fill(0n)))'
      };
      replace(`        this.value = ${allocations[relative]};`,
        `        this.value = createPagedArray(realSize, ${zero});`);
      if (relative === 'value/int-2d.js') {
        replace('        return this.value[realIndex[0]][realIndex[1]];',
          '        return pagedArrayGet(this.value, realIndex);');
        replace('        this.value[realIndex[0]][realIndex[1]] = value;',
          '        pagedArraySet(this.value, realIndex, value);');
      } else {
        replace('        return this.value[realIndex[0]][realIndex[1]][realIndex[2]];',
          '        return pagedArrayGet(this.value, realIndex);');
        replace('        this.value[realIndex[0]][realIndex[1]][realIndex[2]] = BigInt(value);',
          '        pagedArraySet(this.value, realIndex, BigInt(value));');
      }
    }
  }
  return source;
}
export function saveOptimizationPlugin(engine, options = {}) {
  return { name: 'era-save-memory-v1', setup(build) {
    build.onLoad({ filter: /[\\/]build[\\/](value[\\/](int-[123]d|str-1d)|statement[\\/]command[\\/](save|load)(data|global))\.js$/ }, async args => {
      const relative = path.relative(path.join(engine, 'build'), args.path).replaceAll('\\', '/');
      if (!hashes[relative]) throw new Error('Unexpected save overlay path: ' + args.path);
      return { contents: transformSaveSource(relative, await readFile(args.path, 'utf8'), options), loader: 'js', resolveDir: path.dirname(args.path) };
    });
  } };
}
