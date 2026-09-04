const CACHE_NAME = 'yoouz-pwa-v8-fresh';

// Install Event - skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event - Clean up ALL stale caches immediately to bust any old cached code
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - ALWAYS Network-First for HTML, JS, and CSS so user gets live updates immediately
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and video streaming chunk requests / APIs
  if (
    request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    request.headers.get('range') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Network-first for everything
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
