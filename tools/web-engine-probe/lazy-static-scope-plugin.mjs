// Fingerprint-checked isolated overlay; the pinned eraJS checkout remains untouched.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const vmHash = '18fe5bb4ebe0d48a588a410f71472d5d629bfd95c54c200e09b4d36b960779f1';

export function transformLazyStaticScopeSource(source) {
  source = source.replaceAll('\r\n', '\n');
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== vmHash) throw new Error(`Lazy static scope source fingerprint mismatch: vm.js (${digest})`);
  const replace = (oldText, newText, expected = 1) => {
    const count = source.split(oldText).length - 1;
    if (count !== expected) throw new Error(`Lazy static scope match count: ${count} != ${expected}`);
    source = source.split(oldText).join(newText);
  };
  replace('const EVENT = [', `function explicitStaticScopes(root) {
    const scopes = new Set(), seen = new WeakSet(), stack = [root];
    while (stack.length) {
        const value = stack.pop();
        if (typeof value === "string") {
            for (const match of value.matchAll(/[^\\s+\\-*\\/%=!<>|&^~?#()\\[\\]{},.:$\\\\'\";@]+@([^\\s+\\-*\\/%=!<>|&^~?#()\\[\\]{},.:$\\\\'\";@]+)/gu)) scopes.add(match[1]);
            continue;
        }
        if (value == null || (typeof value !== "object" && typeof value !== "function") || seen.has(value)) continue;
        seen.add(value);
        if (value.constructor?.name === "Variable" && value.scope != null) scopes.add(value.scope);
        if (Array.isArray(value)) for (const item of value) stack.push(item);
        else if (value instanceof Map) for (const [key, item] of value) stack.push(key, item);
        else if (value instanceof Set) for (const item of value) stack.push(item);
        else for (const key of Reflect.ownKeys(value)) {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if (descriptor && "value" in descriptor) stack.push(descriptor.value);
        }
    }
    return scopes;
}
const EVENT = [`);
  replace('    staticMap;\n    characterList;', '    staticMap;\n    explicitStaticScopes;\n    characterList;');
  replace('        this.staticMap = new Map();\n        this.characterList = [];',
    '        this.staticMap = new Map();\n        this.explicitStaticScopes = explicitStaticScopes(code.fnList);\n        this.characterList = [];');
  replace(`        this.staticMap = new Map();
        this.staticMap.set("@DUMMY", new Map());
        let fnList = [...this.fnMap.values()];
        for (const events of this.eventMap.values()) {
            fnList = fnList.concat(events);
        }
        // TODO: #DIM REF
        for (const fn of fnList) {
            this.staticMap.set(fn.name, new Map());
            this.staticMap.get(fn.name).set("LOCAL", new Int1DValue("LOCAL", varSize.get("LOCAL")));
            this.staticMap.get(fn.name).set("LOCALS", new Str1DValue("LOCALS", varSize.get("LOCALS")));
            for (const property of fn.property) {
                if (property instanceof Dim && !property.isDynamic()) {
                    this.staticMap.get(fn.name).set(property.name, await property.build(this));
                }
                else if (property instanceof LocalSize || property instanceof LocalSSize) {
                    property.apply(this, fn.name);
                }
            }
        }
        this.characterList = [];`, `        this.staticMap = new Map();
        this.staticMap.set("@DUMMY", new Map());
        for (const scope of this.explicitStaticScopes) {
            if (this.fnMap.has(scope) || this.eventMap.has(scope)) await this.ensureStaticScope(scope, varSize);
        }
        for (const context of this.contextStack) await this.ensureStaticScope(context.fn.name, varSize);
        this.characterList = [];`);
  replace('    configure(config) {', `    async ensureStaticScope(name, varSize = this.code.csv.varSize) {
        if (this.staticMap.has(name)) return this.staticMap.get(name);
        const fn = this.fnMap.get(name) ?? this.eventMap.get(name)?.at(-1);
        if (fn == null) throw E.notFound("Scope", name);
        const scope = new Map();
        this.staticMap.set(name, scope);
        scope.set("LOCAL", new Int1DValue("LOCAL", varSize.get("LOCAL")));
        scope.set("LOCALS", new Str1DValue("LOCALS", varSize.get("LOCALS")));
        for (const property of fn.property) {
            if (property instanceof Dim && !property.isDynamic()) scope.set(property.name, await property.build(this));
            else if (property instanceof LocalSize || property instanceof LocalSSize) property.apply(this, fn.name);
        }
        return scope;
    }
    configure(config) {`);
  replace('    async pushContext(fn) {\n        const context = {',
    '    async pushContext(fn) {\n        await this.ensureStaticScope(fn.name);\n        const context = {');
  return source;
}

export function lazyStaticScopePlugin(engine) {
  return { name: 'era-lazy-static-scope-v1', setup(build) {
    build.onLoad({ filter: /[\\/]build[\\/]vm\.js$/ }, async args => ({
      contents: transformLazyStaticScopeSource(await readFile(args.path, 'utf8')),
      loader: 'js', resolveDir: path.dirname(args.path)
    }));
  } };
}
