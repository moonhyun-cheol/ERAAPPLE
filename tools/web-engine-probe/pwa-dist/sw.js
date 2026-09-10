/* Replaced by build-pwa.mjs; no remote scripts or user-provided code. */
const RELEASE = "e5103b4a2e3ebdd8055a";
const ASSETS = {
  "index.html": "b972688517e100b25806daed4d7a9f1cfee1ae724425de463b7801d3173811a5",
  "browser.js": "b3dcfbb3863aa1f0d121d3a732a478b626989e42bb8b251ae1479198d101e6f6",
  "engine-worker.js": "e9b8d7032ac0e182fef9a89e7fd5c10950cc654a48427fb0308d3b9c1dc6f474",
  "eraJS-LICENSE.txt": "acbd9f2b463cd3431927837baf8abfc42f9b848e7d8732a5cebfd6cbeaf4c79f",
  "build.json": "10bedcc8bf7e83897ed6063dfef02682659ae05c2725677eb43bb69faf37ccc9",
  "local-game.bin": "c6c5de8ed0de23b21ffa9dcfc12487298a2bd0ddf64020ad1844589e03c7bad0",
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