import { mkdir, readFile, writeFile, rename, rm, access, readdir } from 'node:fs/promises';
import { deflateSync, gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory, gameFiles, sha, decode } from './inventory.mjs';

// Dependency-free, original geometric icon; not game artwork.
function icon(size) {
  function chunk(type, data) {
    const body = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const b of body) { crc ^= b; for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const head = Buffer.alloc(4), tail = Buffer.alloc(4);
    head.writeUInt32BE(data.length); tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([head, body, tail]);
  }
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = x / size, ny = y / size;
    const mark = nx > .25 && nx < .75 && ny > .25 && ny < .75 && (nx < .34 || ny < .34 || ny > .66 || (ny > .46 && ny < .54 && nx < .66));
    const offset = y * (1 + size * 3) + 1 + x * 3;
    raw.set(mark ? [188, 227, 255] : [21, 24, 33], offset);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const before = await inventory();
// Optional alternate game: package a SEPARATE game folder (e.g. '에라마왕 개조판 1.28') instead of
// the root baseline. Root is still scanned as the tamper baseline (never written); the alternate
// folder is read-only. Same file-key scheme as gameFiles (CSV -> basename, ERB/ERH -> relative path).
const altName = process.env.PWA_GAME_ROOT ?? null;
async function loadAltGame(name) {
  const gameRoot = fileURLToPath(new URL('../../' + name + '/', import.meta.url));
  const files = new Map();
  async function walk(rel) {
    for (const entry of await readdir(path.join(gameRoot, rel), { withFileTypes: true })) {
      const child = rel + '/' + entry.name;
      if (entry.isSymbolicLink()) throw new Error('Symlink not supported: ' + child);
      if (entry.isDirectory()) { await walk(child); continue; }
      if (!entry.isFile() || !/\.(erb|erh|csv)$/i.test(entry.name)) continue;
      const ext = path.extname(entry.name).toUpperCase();
      const result = decode(await readFile(path.join(gameRoot, child)));
      if (result.text == null) throw new Error('encoding-unresolved: ' + child);
      const key = ext === '.CSV' ? path.basename(child).toUpperCase() : child.replace(/^\//, '');
      if (files.has(key)) throw new Error('eraJS file key collision: ' + key);
      files.set(key, result.text);
    }
  }
  for (const top of ['CSV', 'ERB']) await walk(top);
  return { files };
}
const assets = new Map();
for (const name of ['index.html', 'browser.js', 'engine-worker.js', 'eraJS-LICENSE.txt', 'build.json']) {
  assets.set(name, await readFile(new URL('./dist/' + name, import.meta.url)));
}
assets.set('index.html', Buffer.from(assets.get('index.html').toString().replace('data-pwa="false"', 'data-pwa="true"')
  .replace('<!-- PWA_LINKS -->', '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">')));
// Games packaged into this one PWA. Default: root baseline + the 1.28 mod, each with its own
// bin and IndexedDB namespace so their saves never mix. PWA_GAME_ROOT still builds a single
// alternate game (kept for legacy single-game smoke builds).
const registry = altName
  ? [{ id: 'era-alt-game', label: altName, folder: altName, bin: 'local-game.bin' }]
  : [{ id: 'eraTHYMKR', label: 'eraTHYMKR (원작)', folder: null, bin: 'local-game.bin' },
     { id: 'eramaou128', label: '에라마왕 개조판 1.28', folder: '에라마왕 개조판 1.28', bin: 'game-eramaou128.bin' }];
const games = [];
for (const entry of registry) {
  const source = entry.folder ? await loadAltGame(entry.folder) : await gameFiles(before.records);
  // NDJSON: a header line, then one JSON [key, text] pair per line. The worker stream-decodes it
  // line by line so it never holds the whole text as one string / one JSON.parse (peak memory
  // that risks iOS Safari Jetsam). gzip level 9 keeps the download small.
  assets.set(entry.bin, gzipSync(Buffer.from(
    [JSON.stringify({ id: entry.id, count: source.files.size }),
      ...[...source.files].map(pair => JSON.stringify(pair))].join('\n') + '\n'), { level: 9 }));
  games.push({ id: entry.id, label: entry.label, bin: entry.bin, db: `era-game-${entry.id}-erajs-v1`, count: source.files.size });
}
assets.set('games.json', Buffer.from(JSON.stringify({ games }, null, 2) + '\n'));
assets.set('manifest.webmanifest', Buffer.from(JSON.stringify({ id: './', name: 'eraTHYMKR 웹 실행 시험', short_name: 'era 시험', lang: 'ko',
  start_url: './', scope: './', display: 'standalone', background_color: '#151821', theme_color: '#151821',
  icons: [192, 512].map(size => ({ src: `icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable' }))
}, null, 2)));
for (const size of [180, 192, 512]) assets.set(`icon-${size}.png`, icon(size));
const template = await readFile(new URL('./sw-template.js', import.meta.url), 'utf8');
const hashes = Object.fromEntries([...assets].map(([name, bytes]) => [name, sha(bytes)]));
const release = sha(JSON.stringify(hashes) + template).slice(0, 20);
assets.set('sw.js', Buffer.from(template.replace('__RELEASE__', JSON.stringify(release)).replace('__ASSETS__', JSON.stringify(hashes, null, 2))));
const report = { release, bytes: [...assets.values()].reduce((n, b) => n + b.length, 0), assets: hashes,
  originalCount: before.records.length, originalDigest: before.originalDigest, iPhoneTested: false,
  packagedGames: games.map(game => ({ id: game.id, label: game.label, db: game.db, count: game.count })),
  note: 'Private static test artifact; check game and bundled dependency rights before distribution.' };
assets.set('pwa-build.json', Buffer.from(JSON.stringify(report, null, 2) + '\n'));
const stage = new URL(`./.pwa-stage-${process.pid}/`, import.meta.url);
const output = new URL('./pwa-dist/', import.meta.url);
const backup = new URL(`./.pwa-previous-${process.pid}/`, import.meta.url);
await mkdir(stage);
let moved = false;
try {
  for (const [name, bytes] of assets) await writeFile(new URL(name, stage), bytes);
  if ((await inventory()).originalDigest !== before.originalDigest) throw new Error('Original files changed during packaging');
  let exists = false; try { await access(output); exists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (exists) { await rename(output, backup); moved = true; }
  try { await rename(stage, output); } catch (error) { if (moved) await rename(backup, output); throw error; }
  if (moved) await rm(backup, { recursive: true });
} finally { await rm(stage, { recursive: true, force: true }); }
console.log(JSON.stringify(report, null, 2));