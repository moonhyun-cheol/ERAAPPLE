// File-backed save store for the server-authoritative runtime (S1).
// See docs/web-runtime/server-runtime-plan.md §5 (save migration) and §8-4 (portable format).
//
// This replaces the browser's IndexedDB `createStore` (browser-store.mjs) with the SAME interface
// { get, set, entries, replaceAll, close } so the engine session code is transport/storage-agnostic.
// The engine hands `setSavedata` plain strings (verified: keys like `global.sav`/`save00.sav`),
// so a JSON-on-disk format round-trips faithfully and is platform-neutral (Windows↔Linux, §8-4):
// moving the server = copying this folder.
//
// Durability: writes go to a temp file then atomic rename, so a crash mid-write cannot leave a
// half-written save readable. (Single-writer coordination across connections is a later layer —
// plan §12; this store is the persistence primitive, not the session lock.)
import { mkdir, readFile, writeFile, rename, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const SUFFIX = '.json';
const encodeKey = key => encodeURIComponent(String(key));
const decodeKey = name => decodeURIComponent(name.slice(0, -SUFFIX.length));

export function createSaveStore(dir) {
  if (!dir) throw new Error('createSaveStore requires a directory');
  let ready;
  const ensure = () => (ready ??= mkdir(dir, { recursive: true }));
  const fileFor = key => path.join(dir, encodeKey(key) + SUFFIX);

  async function listNames() {
    await ensure();
    return (await readdir(dir)).filter(name => name.endsWith(SUFFIX));
  }

  return {
    async get(key) {
      await ensure();
      try {
        return JSON.parse(await readFile(fileFor(key), 'utf8'));
      } catch (error) {
        if (error.code === 'ENOENT') return undefined; // absent key => undefined, like IndexedDB get
        throw error;
      }
    },
    async set(key, value) {
      await ensure();
      const file = fileFor(key);
      // Unique temp name per process so concurrent writers cannot clobber each other's temp file.
      const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmp, JSON.stringify(value));
      await rename(tmp, file); // atomic on the same filesystem; never acknowledge before this resolves
    },
    async entries() {
      const names = await listNames();
      return Promise.all(names.map(async name =>
        [decodeKey(name), JSON.parse(await readFile(path.join(dir, name), 'utf8'))]));
    },
    // Whole-store replace for backup ZIP import / migration (plan §5-2). Clear then write; used by
    // the migration tool, not the hot play path.
    async replaceAll(entries) {
      const names = await listNames();
      await Promise.all(names.map(name => rm(path.join(dir, name))));
      for (const [key, value] of entries) await this.set(key, value);
    },
    async close() {}
  };
}
