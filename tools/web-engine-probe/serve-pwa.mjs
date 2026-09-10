import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Preview/test only. An approved HTTPS tunnel may forward to the loopback Host.
export function createStaticServer(directory = new URL('./pwa-dist/', import.meta.url), prefix = '/iphone-test/', { publicOrigin } = {}) {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(prefix)) throw new Error('Invalid base path');
  if (publicOrigin !== undefined) {
    const url = new URL(publicOrigin);
    if (url.protocol !== 'https:' || url.origin !== publicOrigin) throw new Error('publicOrigin must be an exact HTTPS origin without a trailing slash');
  }
  const types = { 'index.html': 'text/html; charset=utf-8', 'browser.js': 'text/javascript; charset=utf-8',
    'engine-worker.js': 'text/javascript; charset=utf-8', 'sw.js': 'text/javascript; charset=utf-8',
    'local-game.bin': 'application/octet-stream', 'games.json': 'application/json',
    'build.json': 'application/json', 'pwa-build.json': 'application/json',
    'manifest.webmanifest': 'application/manifest+json', 'eraJS-LICENSE.txt': 'text/plain; charset=utf-8',
    'icon-180.png': 'image/png', 'icon-192.png': 'image/png', 'icon-512.png': 'image/png' };
  const server = http.createServer(async (req, res) => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    // Keep the loopback Host boundary. Never trust forwarded headers or allow arbitrary origins.
    const requestOrigin = req.headers.origin;
    if (req.headers.host !== new URL(origin).host ||
        (requestOrigin !== undefined && requestOrigin !== origin && requestOrigin !== publicOrigin)) { res.writeHead(403).end(); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = new URL(req.url, origin).pathname;
    if (prefix !== '/' && pathname === prefix.slice(0, -1)) { res.writeHead(308, { Location: prefix }).end(); return; }
    const name = pathname.startsWith(prefix) ? pathname.slice(prefix.length) || 'index.html' : '';
    const contentType = Object.hasOwn(types, name) ? types[name]
      : /^game-[a-zA-Z0-9_]+\.bin$/.test(name) ? 'application/octet-stream' : null;
    if (!contentType) { res.writeHead(404).end(); return; }
    try {
      const bytes = await readFile(new URL(name, directory));
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'same-origin', 'Referrer-Policy': 'no-referrer' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404).end('Build PWA first'); }
  });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prefix = process.env.PWA_BASE ?? '/iphone-test/';
  const server = createStaticServer(undefined, prefix, { publicOrigin: process.env.PWA_PUBLIC_ORIGIN });
  server.listen(Number(process.env.PORT ?? 4174), '127.0.0.1', () => console.log(`Static PWA preview only: http://127.0.0.1:${server.address().port}${prefix}`));
}