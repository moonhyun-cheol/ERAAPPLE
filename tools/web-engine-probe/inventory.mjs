import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const ordinal = (a, b) => a < b ? -1 : a > b ? 1 : 0;
// Top-level names excluded from the original-integrity scan.
// The '에라마왕 개조판 1.28' folder and its .7z are a SEPARATE game to be added later,
// not part of the recorded original inventory; excluding them keeps the tamper baseline honest.
// .gitattributes was added by the PWA deployment to preserve generated asset bytes;
// it is not original game data. Do not regenerate the original 1,151-file baseline.
const excludes = new Set(['docs', 'tools', '.my_agent_remote', '.git', '.gitattributes', '.playwright', '에라마왕 개조판 1.28', '에라마왕 개조판 1.28.7z']);
// Nested paths excluded from the scan: repo tooling added after the baseline was recorded.
// '.github/workflows' holds the GitHub Pages deploy pipeline (not original game data);
// excluding it keeps the recorded 1,151-file baseline stable while '.github/ISSUE_TEMPLATE' stays tracked.
const nestedExcludes = new Set(['.github/workflows']);
export async function inventory() {
  const records = [];
  async function walk(relative = '') {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      if (!relative && excludes.has(entry.name)) continue;
      const name = (relative ? relative + '/' : '') + entry.name;
      if (entry.isDirectory() && nestedExcludes.has(name)) continue;
      if (entry.isSymbolicLink()) throw new Error('Symlink not supported: ' + name);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) {
        const bytes = await readFile(path.join(root, name));
        records.push({ path: name, size: bytes.length, sha256: sha(bytes) });
      }
    }
  }
  await walk();
  records.sort((a, b) => ordinal(a.path, b.path));
  return { records, originalDigest: sha(records.map(f => f.path + '|' + f.sha256.toUpperCase()).join('\n')) };
}
export function decode(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { encoding: 'utf-16le-bom', text: new TextDecoder('utf-16le', { fatal: true }).decode(bytes) };
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return { encoding: 'utf-16be-bom', text: new TextDecoder('utf-16be', { fatal: true }).decode(bytes) };
  try {
    return { encoding: bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])) ? 'utf-8-bom' : 'utf-8',
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    // Successful decoding does NOT establish intended encoding. Never auto-select a legacy encoding.
    const candidates = ['shift_jis', 'euc-kr'].filter(label => {
      try { new TextDecoder(label, { fatal: true }).decode(bytes); return true; } catch { return false; }
    });
    return { encoding: 'unresolved', candidates };
  }
}
export async function gameFiles(records) {
  const files = new Map();
  const encodings = [];
  const counts = {};
  const tokens = {};
  for (const record of records) {
    if (!/^(CSV|ERB)\//i.test(record.path) && record.path !== 'emuera.config') continue;
    if (!/\.(erb|erh|csv|config)$/i.test(record.path)) continue;
    const ext = path.extname(record.path).toUpperCase();
    counts[ext] = (counts[ext] ?? 0) + 1;
    const result = decode(await readFile(path.join(root, record.path)));
    encodings.push({ path: record.path, encoding: result.encoding, candidates: result.candidates });
    if (ext === '.CONFIG') continue; // eraJS compile has no config input; explicitly reported as an unmet requirement.
    if (result.text == null) throw new Error('encoding-unresolved: ' + record.path);
    const key = ext === '.CSV' ? path.basename(record.path).toUpperCase() : record.path;
    if (files.has(key)) throw new Error('eraJS file key collision: ' + key);
    files.set(key, result.text);
    if (ext === '.ERB' || ext === '.ERH') {
      for (const line of result.text.split(/\r?\n/)) {
        const token = /^\s*([A-Z][A-Z0-9_]*|#\w+|\[\w+)\b/.exec(line)?.[1];
        if (token) tokens[token] = (tokens[token] ?? 0) + 1;
      }
    }
  }
  return { files, counts, encodings, lexicalTokens: tokens };
}
