/**
 * Elara Service Worker
 * Version: 1.0.0
 * 
 * This service worker handles offline capabilities using:
 * - Stale-While-Revalidate for static assets (CSS, JS, images)
 * - Network-First for HTML pages (navigation)
 * - Pre-caching for core application shell
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `elara-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `elara-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `elara-images-${CACHE_VERSION}`;

// Core assets to pre-cache during installation
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    // Note: Specific CSS/JS files are usually handled by the build process, 
    // but we include common paths here for demonstration.
];

// --- Install Event ---
// Purpose: Pre-cache the core application shell
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[Service Worker] Pre-caching app shell');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

// --- Activate Event ---
// Purpose: Clean up old caches to prevent stale data
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure that subsequent fetches from the client go through the new service worker
    return self.clients.claim();
});

// --- Fetch Event ---
// Purpose: Handle network requests with specific caching strategies
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Network-First Strategy for HTML/Navigation
    if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match('/index.html') || caches.match(event.request))
        );
        return;
    }

    // 2. Stale-While-Revalidate for Static Assets (JS, CSS, fonts)
    if (
        event.request.destination === 'script' ||
        event.request.destination === 'style' ||
        event.request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 3. Cache-First or Stale-While-Revalidate for Images
    if (event.request.destination === 'image') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request).then((networkResponse) => {
                    caches.open(IMAGE_CACHE).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
            })
        );
        return;
    }

    // Default: Network Only with fallback to Cache
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
