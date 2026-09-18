/* Replaced by build-pwa.mjs; no remote scripts or user-provided code. */
const RELEASE = "388e7b4d85d63d099868";
const ASSETS = {
  "index.html": "dab43c0773c50cd7abff5dd1ee47ddc2217cbb60f7495425673ee446865709ef",
  "browser.js": "baff34aae7b80ed5abb836bfc836c0c772cf46286c5156d56b71c8d2365f9286",
  "engine-worker.js": "e1691b035b1f8ed596d4b5b4582bc3024b7a694cd3cd4e3e587ccb9c32d10389",
  "eraJS-LICENSE.txt": "acbd9f2b463cd3431927837baf8abfc42f9b848e7d8732a5cebfd6cbeaf4c79f",
  "build.json": "2b0f55b471425ec83bd526cf5e72d16d01b8f47c8f08559e897629ea8e6eb01b",
  "local-game.bin": "dda7fa32ce4805c144444febe9834166035166efb385855420140c348e1471b5",
  "game-eramaou128.bin": "0812349f97bc430ba9ebfa0a64723300341a483d79013289c30917800e1b1c0a",
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