import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { inventory, gameFiles } from './inventory.mjs';
import { gzipSync } from 'node:zlib';
const allowed = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/browser.js', ['browser.js', 'text/javascript; charset=utf-8']],
  ['/engine-worker.js', ['engine-worker.js', 'text/javascript; charset=utf-8']],
  ['/eraJS-LICENSE.txt', ['eraJS-LICENSE.txt', 'text/plain; charset=utf-8']],
  ['/build.json', ['build.json', 'application/json']]
]);
const server = http.createServer(async (req, res) => {
  // Reject foreign Host/Origin (including DNS rebinding); never enable CORS.
  const origin = `http://127.0.0.1:${server.address().port}`;
  if (req.headers.host !== new URL(origin).host ||
      (req.headers.origin && req.headers.origin !== origin)) {
    res.writeHead(403).end(); return;
  }
  if (req.method === 'GET' && req.url === '/local-game.bin') {
    try {
      const data = await gameFiles((await inventory()).records);
      const body = gzipSync(Buffer.from([JSON.stringify({ id: 'eraTHYMKR', count: data.files.size }),
        ...[...data.files].map(entry => JSON.stringify(entry))].join('\n') + '\n'));
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' })
        .end(body);
    } catch { res.writeHead(500).end('Local game data could not be read'); }
    return;
  }
  const entry = allowed.get(req.url);
  if (req.method !== 'GET' || !entry) { res.writeHead(404).end(); return; }
  try {
    const bytes = await readFile(new URL('./dist/' + entry[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(bytes);
  } catch { res.writeHead(500).end('Run npm run build first'); }
});
server.listen(Number(process.env.PORT ?? 4173), '127.0.0.1', () => console.log('Probe only: http://127.0.0.1:' + server.address().port));
