importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = 'elara-shell-v1';
const AUDIO_CACHE_NAME = 'elara-audio-cache';

// Basic App Shell files to pre-cache
// Note: In a production build, use a build tool to inject the full list of assets
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

if (workbox) {
  console.log(`[Service Worker] Workbox loaded`);

  // 1. Cache the App Shell
  // Using NetworkFirst for the shell ensures we always get the latest version if online,
  // but fall back to cache if offline.
  // For production with versioned assets, StaleWhileRevalidate or PrecacheController is better.
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate' || SHELL_FILES.includes(new URL(request.url).pathname),
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAME,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
        }),
      ],
    })
  );

  // 2. Cache Audio Files (CacheFirst with Range Requests)
  workbox.routing.registerRoute(
    ({ request, url }) => {
      return request.destination === 'audio' || 
             request.destination === 'video' ||
             /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(url.pathname);
    },
    new workbox.strategies.CacheFirst({
      cacheName: AUDIO_CACHE_NAME,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100, // Limit number of songs cached
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          purgeOnQuotaError: true,
        }),
        // Crucial for audio seeking
        new workbox.rangeRequests.RangeRequestsPlugin(),
      ],
    })
  );

  // 3. Cache Images (StaleWhileRevalidate)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'elara-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

} else {
  console.log(`[Service Worker] Workbox failed to load`);
  // Fallback to basic manual implementation if Workbox fails (unlikely)
  
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
    );
  });

  self.addEventListener('fetch', (event) => {
    // Basic cache-first for audio (no range support)
    if (/\.(mp3|m4a|wav|ogg)$/i.test(event.request.url)) {
      event.respondWith(
        caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(event.request);
          if (cached) return cached;
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
      );
      return;
    }

    // Default strategy
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  });
}

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME && 
              cacheName !== 'elara-images' && !cacheName.startsWith('workbox-')) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
