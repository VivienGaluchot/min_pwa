/**
 * Service Worker
 * Allows to cache the app file and access it offline
 */

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('v1').then(function (cache) {
            return cache.addAll([]);
        })
    );
});


// Cache strategy
// - cached then network fallback
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});
