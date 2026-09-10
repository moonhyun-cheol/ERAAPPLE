/* Replaced by build-pwa.mjs; no remote scripts or user-provided code. */
const RELEASE = "f54ab5c22a46db9da38b";
const ASSETS = {
  "index.html": "191b467935d79f424d14b9ebb287db1ab113afd1d7a24d701f0c4f1d5ec4b96e",
  "browser.js": "00192fd9035ad1e848e6a5c6762b4f946736a06c6785404adf90610a89e7b6c9",
  "engine-worker.js": "ad9bd020a205eaa784bced32852eef72b5039c65e9b2e87edbf26a964479eff0",
  "eraJS-LICENSE.txt": "acbd9f2b463cd3431927837baf8abfc42f9b848e7d8732a5cebfd6cbeaf4c79f",
  "build.json": "1d4777b1543bcb53efcb9a117904e0b8fce801950e82e408f03ed08607a26c6a",
  "local-game.bin": "dda7fa32ce4805c144444febe9834166035166efb385855420140c348e1471b5",
  "game-eramaou128.bin": "f9f1566a422571c8d2198ae56918bfa030eb746a5f8d9fe5c04e99eb9d0e578b",
  "games.json": "8015c3fd2e28329d5edf835fe5b383d6a29c1a717fc6aa6fcf60f64fd933c90c",
  "manifest.webmanifest": "559c19ff906d1e855a0b1e6a963709b338931c5c2a880618903bafe9df7b1cb8",
  "icon-180.png": "653bd2e4ba3b5b8e2468df9a11d2d168c8f38f5296ff794dce5d594aa2175dbb",
  "icon-192.png": "beda65ebe09ef25ed5a8ff5f8fa5a7843577973e6a1291f904be1819a50cf292",
  "icon-512.png": "70b388b895bfe355fdf5b4fa3522344d7abb91883d0b48fcb98b35a8c6315570"
};
const PREFIX = 'era-pwa:' + encodeURIComponent(self.registration.scope) + ':';
const CACHE = PREFIX + RELEASE;
const url = name => new URL(name, self.registration.scope).href;
async function verified(name, digest) {
  const response = await fetch(url(name), { cache: 'no-store', credentials: 'same-origin', redirect: 'error' });
  if (!response.ok || response.type === 'opaque') throw new Error('HTTP/cache asset: ' + name);
  const bytes = await response.clone().arrayBuffer();
  const actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
  if (actual !== digest) throw new Error('Asset hash mismatch: ' + name);
  return response;
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      for (const [name, digest] of Object.entries(ASSETS)) await cache.put(url(name), await verified(name, digest));
    } catch (error) { await caches.delete(CACHE); throw error; }
    // No skipWaiting: never replace the engine beneath a running game.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const target = new URL(request.url);
  const base = new URL(self.registration.scope);
  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) return;
  let name = target.pathname.slice(base.pathname.length);
  if (name === '') name = 'index.html';
  if (!Object.hasOwn(ASSETS, name)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(url(name));
    // Do not mix an old engine/shell with a new deployment if the OS evicts data.
    return cached ?? new Response('Offline asset missing. Reopen online and repair offline cache.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
self.addEventListener('message', event => {
  if (!event.ports[0] || !['offline-status', 'repair-cache'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      let ready = true;
      for (const [name, digest] of Object.entries(ASSETS)) {
        if (await cache.match(url(name))) continue;
        if (event.data.type === 'repair-cache') await cache.put(url(name), await verified(name, digest));
        else ready = false;
      }
      event.ports[0].postMessage({ ready, release: RELEASE, count: Object.keys(ASSETS).length });
    } catch (error) { event.ports[0].postMessage({ ready: false, error: error.message }); }
  })());
});