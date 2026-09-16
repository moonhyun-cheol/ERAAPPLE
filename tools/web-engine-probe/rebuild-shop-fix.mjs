// Minimal rebuild of the two engines the server uses (legacy + engine.mjs).
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compatFixPlugin } from './compat-fix-plugin.mjs';
import { saveOptimizationPlugin } from './save-build-plugin.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, '../../.my_agent_remote/undercrow__eraJS');
const commit = 'fb487bceacd899a033db017ff0dff5bb3878d4a5';
const head = execFileSync('git', ['-C', engine, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== commit) throw new Error(`Expected eraJS ${commit}, got ${head}`);
if (execFileSync('git', ['-C', engine, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim()) {
  throw new Error('Engine tracked files have local changes');
}
const dist = path.join(here, 'dist');
const compat = compatFixPlugin(engine);
const common = {
  bundle: true, nodePaths: [path.join(here, 'node_modules')],
  target: 'es2022', logLevel: 'info', legalComments: 'eof',
  plugins: [compat],
  entryPoints: [path.join(engine, 'build/index.js')],
  platform: 'node', format: 'esm',
};
await build({ ...common, outfile: path.join(dist, 'engine-legacy.mjs') });
await build({
  ...common,
  plugins: [compat, saveOptimizationPlugin(engine)],
  outfile: path.join(dist, 'engine.mjs'),
});
console.log('rebuilt engine-legacy.mjs + engine.mjs');
