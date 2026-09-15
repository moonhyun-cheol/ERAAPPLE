// Loads an era game's ERB/CSV/ERH source tree into the Map shape compile() expects (S1, plan §10-4).
//
// The server holds the game source locally, so unlike the browser it does NOT fetch/DecompressionStream
// a bundle: it reads the CSV/ and ERB/ trees straight off disk and hands the resulting Map to
// createEngineSession({ source }). Key scheme mirrors the probe loader (inventory.gameFiles /
// eramaou128-compile-probe.loadGame) EXACTLY so compile() sees identical inputs:
//   - CSV: keyed by basename upper-cased (e.g. 'GAMEBASE.CSV')
//   - ERB/ERH: keyed by the tree-relative path (e.g. 'ERB/SYSTEM/TITLE.ERB')
// Decoding reuses inventory.decode so encoding handling stays identical to the integrity tooling.
// No compatibility shims are applied here: the server runs real content as-is.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { decode } from '../tools/web-engine-probe/inventory.mjs';

export async function loadGameSource(gameDir) {
  if (!gameDir) throw new Error('loadGameSource requires a game directory');
  const files = new Map();
  const counts = {};
  const encodings = [];
  let totalBytes = 0;

  async function walk(abs, rel) {
    let entries;
    try {
      entries = await readdir(abs, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return; // a game may lack one of the two trees
      throw error;
    }
    for (const entry of entries) {
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? rel + '/' + entry.name : entry.name;
      if (entry.isSymbolicLink()) throw new Error('Symlink not supported: ' + childRel);
      if (entry.isDirectory()) { await walk(childAbs, childRel); continue; }
      if (!entry.isFile()) continue;
      if (!/\.(erb|erh|csv)$/i.test(entry.name)) continue;
      const ext = path.extname(entry.name).toUpperCase();
      const bytes = await readFile(childAbs);
      totalBytes += bytes.length;
      const result = decode(bytes);
      encodings.push({ path: childRel, encoding: result.encoding, candidates: result.candidates });
      if (result.text == null)
        throw new Error('encoding-unresolved: ' + childRel + ' candidates=' + JSON.stringify(result.candidates));
      counts[ext] = (counts[ext] ?? 0) + 1;
      const key = ext === '.CSV' ? path.basename(entry.name).toUpperCase() : childRel;
      if (files.has(key)) throw new Error('game source key collision: ' + key);
      files.set(key, result.text);
    }
  }

  // Only the CSV/ and ERB/ trees are engine source (matches the probe loader and inventory.gameFiles);
  // everything else in a game folder (docs, .exe, logs, srs/, 資料/) is ignored.
  for (const top of ['CSV', 'ERB']) await walk(path.join(gameDir, top), top);

  if (files.size === 0) throw new Error('no ERB/CSV source found under ' + gameDir);
  return { files, counts, encodings, totalBytes };
}
