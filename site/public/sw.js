const CACHE = 'ppr-shell-v2';
const SHELL = ['/', '/demo/', '/privacy/', '/terms/', '/ceramic-proxy-gates.webp', '/favicon.svg'];
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const pages = await Promise.all(['/', '/demo/'].map(async (path) => (await fetch(path)).text()));
  const assets = pages.flatMap((html) => [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]));
  await cache.addAll([...new Set(assets)]);
  await self.skipWaiting();
})()));
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === location.origin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => {
    if (event.request.mode !== 'navigate') return Response.error();
    return caches.match(new URL(event.request.url).pathname.startsWith('/demo') ? '/demo/' : '/');
  })));
});
