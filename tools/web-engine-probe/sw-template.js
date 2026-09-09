/* Replaced by build-pwa.mjs; no remote scripts or user-provided code. */
const RELEASE = __RELEASE__;
const ASSETS = __ASSETS__;
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