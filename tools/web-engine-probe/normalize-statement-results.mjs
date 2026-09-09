import { readFile, writeFile } from 'node:fs/promises';
for (const name of ['compact-statement-vector-baseline-run.json', 'compact-statement-vector-m1-run.json']) {
  const url = new URL(`./results/${name}`, import.meta.url);
  const raw = await readFile(url);
  await writeFile(url, raw.toString('utf16le').replace(/^\uFEFF/, ''), 'utf8');
}
