/**
 * Service Worker
 * Allows to cache the app file and access it offline
 */

const CACHE_VERSION = '0.1.0';

const RESOURCE_LIST = [
    // ./
    '/',
    '/app.js',
    '/style.css',
    '/manifest.webmanifest',
    // ./img/
    '/img/heather-ford-Fq54FqucgCE-unsplash.jpg',
    '/img/izuddin-helmi-adnan-8VJDHw3daGk-unsplash.jpg',
    '/img/norris-niman-ePB2oGU8mb4-unsplash.jpg',
    '/img/icon-badge.svg',
    '/img/logo-black.svg',
    '/img/icon-black.svg',
    '/img/matthew-hamilton-BeeMMFF_jso-unsplash.jpg',
    '/img/icon-white.svg',
    '/img/icon-192.png',
    '/img/icon-512.png',
    // fontawesome
    '/lib/fontawesome-free-5.14.0-web/css/all.min.css',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-brands-400.eot',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-brands-400.svg',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-brands-400.ttf',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-brands-400.woff',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-brands-400.woff2',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-regular-400.eot',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-regular-400.svg',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-regular-400.ttf',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-regular-400.woff',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-regular-400.woff2',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-solid-900.eot',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-solid-900.svg',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-solid-900.ttf',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-solid-900.woff',
    '/lib/fontawesome-free-5.14.0-web/webfonts/fa-solid-900.woff2',
    // bootstrap
    'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
    'https://code.jquery.com/jquery-3.5.1.slim.min.js',
    'https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js',
    'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
];

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (name) {
                if (name != CACHE_VERSION) {
                    console.debug('clean past cache', name);
                    return caches.delete(name);
                }
            }));
        })
    );
});

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll(RESOURCE_LIST);
        })
    );
});


// Message from other workers

let backPort = null;

let hasPendingSignalUpdate = false;
let signalUpdate = (url) => {
    console.info('resource updated', url);
    if (backPort) {
        setTimeout(() => {
            backPort.postMessage({ type: 'has_update', data: null });
        }, 500);
    } else {
        hasPendingSignalUpdate = true;
    }
};

let messageMapHandler = new Map();
messageMapHandler.set('init_port', event => {
    backPort = event.ports[0];
    if (hasPendingSignalUpdate) {
        signalUpdate();
        hasPendingSignalUpdate = false;
    }
});
messageMapHandler.set('get_version', () => {
    backPort.postMessage({ type: 'get_version', data: CACHE_VERSION });
});

self.addEventListener('message', event => {
    if (event.data && event.data.type) {
        let handler = messageMapHandler.get(event.data.type);
        if (handler) {
            handler(event);
        } else {
            console.warn(`lost message`, event);
        }
    } else {
        console.warn(`lost message`, event);
    }
});


// Cache strategy
// - cached then network fallback
this.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.open(CACHE_VERSION).then(cache => {
            let request = event.request;
            return cache.match(request).then(cached_response => {
                if (cached_response !== undefined) {
                    // try to update resource via network
                    fetch(request).then(async network_response => {
                        let a = await cached_response.clone().text();
                        let b = await network_response.clone().text();
                        if (a != b) {
                            signalUpdate(request.url);
                            cache.put(request, network_response);
                        }
                    }).catch(() => {
                        // error may happen in offline mode
                    });
                    return cached_response.clone();
                } else {
                    // get resource offline
                    console.warn("missing resource, added to cache", request.url);
                    return fetch(request).then(network_response => {
                        cache.put(request, network_response.clone());
                        return network_response;
                    }).catch(reason => {
                        log.error('missing resource, fetch failed', request, reason);
                    });
                }
            })
        })
    );
});