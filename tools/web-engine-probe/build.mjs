import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { saveOptimizationPlugin } from './save-build-plugin.mjs';
import { compactFunctionIrPlugin } from './compact-function-ir-plugin.mjs';
import { lazyStaticScopePlugin } from './lazy-static-scope-plugin.mjs';
import { compatFixPlugin } from './compat-fix-plugin.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, '../../.my_agent_remote/undercrow__eraJS');
const commit = 'fb487bceacd899a033db017ff0dff5bb3878d4a5';
const head = execFileSync('git', ['-C', engine, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== commit) throw new Error(`Expected eraJS ${commit}, got ${head}`);
if (execFileSync('git', ['-C', engine, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim()) {
  throw new Error('Engine tracked files have local changes');
}
const dist = path.join(here, 'dist');
await mkdir(dist, { recursive: true });
// era-compat-fix-v1 is applied to every bundle so the SELECTCASE CASEELSE and
// string-index compatibility fixes reach the runtime worker and every profile.
const compat = compatFixPlugin(engine);
const common = {
  bundle: true, nodePaths: [path.join(here, 'node_modules')],
  target: 'es2022', logLevel: 'info', legalComments: 'eof',
  plugins: [compat]
};
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-legacy.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine, { lazyLocals: false })];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-save-only.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine)];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine), compactFunctionIrPlugin(engine)];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine), compactFunctionIrPlugin(engine, { compactLabels: true })];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine), compactFunctionIrPlugin(engine, { compactLabels: true, compactLazy: true })];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true })];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true }), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true })];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice-paged.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true }), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true, compactStatements: true })];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice-paged-statements.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true }), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true, compactStatements: true, compactPrintFormPayload: true })];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice-paged-statements-printform.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true }), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true, compactStatements: true, compactPrintFormPayload: true }),
  lazyStaticScopePlugin(engine)];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true }), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true, compactStatements: true, compactPrintFormPayload: true,
    compactAssignPayload: true }), lazyStaticScopePlugin(engine)];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true }), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true, compactStatements: true, compactPrintFormPayload: true,
    compactAssignPayload: true, compactIfPayload: true }), lazyStaticScopePlugin(engine)];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign-if.mjs') });
// Profiling-only variant: full assign stack + sparse1d global integer arrays. Not
// promoted to the worker until day-16 ownership reprofile + acceptance parity pass.
common.plugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true, sparse1d: true }), compactFunctionIrPlugin(engine,
  { compactLabels: true, compactLazy: true, compactSlice: true, compactStatements: true, compactPrintFormPayload: true,
    compactAssignPayload: true }), lazyStaticScopePlugin(engine)];
await build({ ...common, entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm', outfile: path.join(dist, 'engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign-sparse1d.mjs') });
common.plugins = [compat, saveOptimizationPlugin(engine)];
await build({ ...common, entryPoints: [path.join(here, 'browser.mjs')],
  platform: 'browser', format: 'esm', outfile: path.join(dist, 'browser.js') });
// Promote the acceptance-verified combined overlay stack to the runtime worker only
// (browser.js store keeps the save-only stack). This mirrors
// engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs,
// which acceptance runs verified keeps replay + full save hashes equal to baseline
// while roughly halving forced-GC resident heap on the date-transition path.
const workerPlugins = [compat, saveOptimizationPlugin(engine, { pagedStorage: true }),
  compactFunctionIrPlugin(engine, { compactLabels: true, compactLazy: true, compactSlice: true,
    compactStatements: true, compactPrintFormPayload: true, compactAssignPayload: true }),
  lazyStaticScopePlugin(engine)];
await build({ ...common, plugins: workerPlugins, entryPoints: [path.join(here, 'engine-worker.mjs')],
  platform: 'browser', format: 'esm', outfile: path.join(dist, 'engine-worker.js') });
await copyFile(path.join(here, 'index.html'), path.join(dist, 'index.html'));
await copyFile(path.join(engine, 'LICENSE.md'), path.join(dist, 'eraJS-LICENSE.txt'));
await writeFile(path.join(dist, 'build.json'), JSON.stringify({ engine: 'eraJS', commit,
  saveOptimization: 'era-save-memory-v1 (zero-tail prefixes, direct numeric restore)',
  runtimeOptimization: 'era-deferred-local-v1 (LOCAL/LOCALS arrays allocated on first access)',
  workerOptimization: 'era-save-memory-v1 (pagedStorage) + era-compact-function-ir-v1 (labels, lazy slice, statements, printform, assign payloads) + era-lazy-static-scope-v1; acceptance-verified replay + full save hash parity with baseline',
  note: 'Pinned upstream release JavaScript with fingerprint-checked local overlays; not an iPhone certification.',
  sha256: createHash('sha256').update(await readFile(path.join(dist, 'browser.js'))).digest('hex')
}, null, 2) + '\n');
