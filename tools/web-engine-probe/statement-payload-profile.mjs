import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gameFiles, inventory } from './inventory.mjs';
import { sampleLifecycle } from './memory-sampler.mjs';

const engine = 'engine-compact-ir-labels-lazy-slice-paged-statements.mjs';
const focus = new Set(['PrintForm', 'Assign', 'If', 'Return']);
const original = await inventory();
let source = await gameFiles(original.records);
const { compile } = await import(new URL(`./dist/${engine}`, import.meta.url));
const before = sampleLifecycle('before-compile');
const vm = compile(source.files);
source = null;
const compiled = sampleLifecycle('compiled-source-released');

const seen = new WeakSet();
const statementObjects = new WeakSet();
const stack = [vm];
const objects = new Map();
const add = (map, key, amount = 1) => map.set(key, (map.get(key) ?? 0) + amount);
const rawConstructorName = value => value?.constructor?.name || '(anonymous)';
const constructorName = value => rawConstructorName(value).replace(/^_/, '');
const vectorItems = value => value == null ? [] : Array.isArray(value) ? value : [value];

while (stack.length) {
  const value = stack.pop();
  if (value == null || (typeof value !== 'object' && typeof value !== 'function') || seen.has(value)) continue;
  seen.add(value);
  const name = constructorName(value);
  add(objects, name);
  if (name === 'Thunk') {
    const statements = Object.getOwnPropertyDescriptor(value, 'statement')?.value;
    for (const statement of vectorItems(statements)) {
      if (statement && (typeof statement === 'object' || typeof statement === 'function')) statementObjects.add(statement);
    }
  }
  if (Array.isArray(value)) for (const item of value) stack.push(item);
  else if (value instanceof Map) for (const [key, item] of value) stack.push(key, item);
  else if (value instanceof Set) for (const item of value) stack.push(item);
  else for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) stack.push(descriptor.value);
  }
}

const statements = new Map();
const statementShapes = new Map();
const directPayloads = new Map();
const lazyPayloads = new Map();
let statementCount = 0;
const shapeOf = value => Reflect.ownKeys(value).map(String).sort().join(',');
const typeOf = value => value == null ? String(value) : typeof value === 'object' || typeof value === 'function'
  ? constructorName(value) : typeof value;

// Revisit the graph so statement counts do not rely on exported engine classes or renamed base classes.
const visited = new WeakSet(), revisit = [vm];
while (revisit.length) {
  const value = revisit.pop();
  if (value == null || (typeof value !== 'object' && typeof value !== 'function') || visited.has(value)) continue;
  visited.add(value);
  if (statementObjects.has(value)) {
    statementCount++;
    const name = constructorName(value);
    add(statements, name);
    add(statementShapes, `${name}|${shapeOf(value)}`);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor)) continue;
      const payloadType = typeOf(descriptor.value);
      add(directPayloads, `${name}.${String(key)}:${payloadType}`);
      if (payloadType === 'Lazy' || payloadType === 'CompactLazy') add(lazyPayloads, name);
    }
  }
  if (Array.isArray(value)) for (const item of value) revisit.push(item);
  else if (value instanceof Map) for (const [key, item] of value) revisit.push(key, item);
  else if (value instanceof Set) for (const item of value) revisit.push(item);
  else for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) revisit.push(descriptor.value);
  }
}

const sorted = (map, limit = Infinity) => [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, limit).map(([name, count]) => ({ name, count }));
const focusStatements = Object.fromEntries([...focus].map(name => [name, {
  count: statements.get(name) ?? 0,
  shapes: sorted(new Map([...statementShapes].filter(([key]) => key.startsWith(`${name}|`))
    .map(([key, count]) => [key.slice(name.length + 1), count]))),
  directPayloads: sorted(new Map([...directPayloads].filter(([key]) => key.startsWith(`${name}.`))
    .map(([key, count]) => [key.slice(name.length + 1), count]))),
  directCompactLazy: lazyPayloads.get(name) ?? 0
}]));

assert.equal((await inventory()).originalDigest, original.originalDigest);
const report = {
  passed: true,
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  engine,
  originalDigest: original.originalDigest,
  memory: { before, compiled },
  graph: { objects: [...objects.values()].reduce((sum, count) => sum + count, 0), statementCount },
  focusStatements,
  statementTypes: sorted(statements),
  statementShapes: sorted(statementShapes),
  directCompactLazyByStatement: sorted(lazyPayloads),
  topObjectTypes: sorted(objects, 40),
  method: 'Reachable VM graph traversal; statement identity is derived from compact Thunk vectors, then grouped by constructor, own-field shape, and direct payload type.',
  limitations: [
    'Counts and shapes are exact for the current game immediately after compile, but they are not retained-byte measurements.',
    'Nested payload objects can be shared; direct payload counts must not be summed as exclusive retained memory.',
    'Assign creates its typed inner statement lazily during execution, so compile-time counts only describe the outer Assign objects.',
    'Current-game corpus only; medium and large alternate ERA games remain untested.'
  ],
  originalUnchanged: true
};
const resultUrl = new URL('./results/statement-payload-profile.json', import.meta.url);
await writeFile(resultUrl, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, graph: report.graph, focusStatements, topStatementTypes: report.statementTypes.slice(0, 12),
  result: fileURLToPath(resultUrl) }, null, 2));
