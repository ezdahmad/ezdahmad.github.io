// service-worker.js
const VERSION = (self.registration.scope.split('?version=')[1] || 'v1');
const CACHE_NAME = `ezdahmad-cache-${VERSION}`;

const CORE_ASSETS = [
  `/?v=${VERSION}`,
  `/index.html?v=${VERSION}`,
  `/privacy-policy.html?v=${VERSION}`,
  `/manifest.json?v=${VERSION}`,
  `/assets/icons/apple-touch-icon.png?v=${VERSION}`
];

// Install: precache core assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

// Activate: clean old caches and take control of open pages
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Allow the page to tell us to activate right now
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch:
// • HTML (navigation): network‑first so you get the newest page
// • Everything else: cache‑first with background update
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same‑origin requests
  if (url.origin !== location.origin) return;

  // HTML documents → network-first
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-cache' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(req)) ||
               (await caches.match(`/index.html?v=${VERSION}`)) ||
               (await caches.match('/index.html')) ||
               new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' }});
      }
    })());
    return;
  }

  // Static assets → stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    }).catch(() => undefined);

    return cached || network || fetch(req);
  })());
});