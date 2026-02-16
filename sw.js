const CACHE_NAME = 'gbos-v13';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './retroos.js',
    './manifest.json',
    './scripts/system.js',
    './scripts/games.js',
    './scripts/newapps.js',
    './scripts/newapps_batch5.js',
    './scripts/batch6.js',
    './scripts/utils_expanded.js',
    './scripts/critical_fixes.js',
    './scripts/app_fixes.js',
    './scripts/karaoke.js',
    './scripts/productivity_apps.js',
    './scripts/retro_quest.js',
    './scripts/p2p-games/engine.js',
    './scripts/p2p-games/brawl.js',
    './scripts/p2p-games/chess.js',
    './scripts/p2p-games/racer.js',
    './scripts/p2p-games/duel.js',
    './scripts/p2p-games/sync.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching assets...');
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Cache addAll failed for some assets, trying individual add:', err);
                return Promise.all(
                    ASSETS.map(url => cache.add(url).catch(e => console.error(`Failed to cache: ${url}`, e)))
                );
            });
        })
    );
    self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('Deleting old cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Network-first for API calls, cache-first for static assets
    if (e.request.url.includes('/api/') || e.request.url.includes('http')) {
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    // Clone the response before caching
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match(e.request)) // Fallback to cache
        );
    } else {
        e.respondWith(
            caches.match(e.request).then((response) => response || fetch(e.request))
        );
    }
});
