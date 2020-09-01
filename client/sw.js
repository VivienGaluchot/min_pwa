/**
 * Service Worker
 * Allows to cache the app file and access it offline
 */

const CACHE_VERSION = '0.0.1';

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (name) {
                if (name != CACHE_VERSION) {
                    return caches.delete(name);
                }
            }));
        })
    );
});

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll([
                // ./
                '/',
                '/app.js',
                '/style.css',
                '/sw-init.js',
                // ./img/
                '/img/heather-ford-Fq54FqucgCE-unsplash.jpg',
                '/img/izuddin-helmi-adnan-8VJDHw3daGk-unsplash.jpg',
                '/img/icon-badge.svg',
                '/img/logo-black.svg',
                '/img/icon-black.svg',
                '/img/matthew-hamilton-BeeMMFF_jso-unsplash.jpg',
                '/img/icon-white.svg',
                // cdn
                'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/css/all.min.css',
                'https://code.jquery.com/jquery-3.5.1.slim.min.js',
                'https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js',
                'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
            ]);
        })
    );
});




// Cache strategy
// - cached then network fallback
this.addEventListener('fetch', function (event) {
    var response;
    event.respondWith(
        caches.match(event.request).catch(function () {
            return fetch(event.request);
        }).then(function (r) {
            response = r;
            caches.open(CACHE_VERSION).then(function (cache) {
                cache.put(event.request, response);
            });
            return response.clone();
        })
    );
});
