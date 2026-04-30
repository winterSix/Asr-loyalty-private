const STATIC_CACHE = 'asr-static-v1';
const PAGES_CACHE = 'asr-pages-v1';

// On install, cache the app shell immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(['/', '/manifest.json', '/logo.svg', '/logo.png'])
    )
  );
});

// On activate, delete any old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls — React Query owns data freshness
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('asr-loyalty-api') ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('accounts.google.com')
  ) {
    return;
  }

  // Next.js static assets (_next/static): cache-first, long-lived
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Page navigations: network-first with cache fallback (keeps content fresh
  // when online, still works offline)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.open(PAGES_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await cache.match(request);
          return cached || caches.match('/');
        }
      })
    );
    return;
  }

  // Everything else (fonts, images from same origin): stale-while-revalidate
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((response) => {
        cache.put(request, response.clone());
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
