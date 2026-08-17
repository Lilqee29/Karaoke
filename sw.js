const CACHE_NAME = 'gbos-v14';
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
    './scripts/p2p-games/sync.js',
    './scripts/kartracing.js',
    './scripts/newapps_utility.js',
    './scripts/app_upgrades.js',
    './beat-boy.js',
];

// API domains that should be network-only (never cached)
const API_PATTERNS = [
    'itunes.apple.com',
    'api.radio-browser.info',
    'api.open-meteo.com',
    'nasa.gov',
    'api.openweathermap.org',
    'thecocktaildb.com',
    'youtube.com',
    'ytimg.com',
    'googlevideo.com',
    'tonejs.github.io',
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
    const url = e.request.url;

    // Skip non-GET requests
    if (e.request.method !== 'GET') return;

    // API calls / external resources → network only, never cache
    const isAPI = API_PATTERNS.some(p => url.includes(p));
    if (isAPI) {
        e.respondWith(
            fetch(e.request).catch(() => {
                return new Response(JSON.stringify({ error: 'Offline' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Static assets → cache-first
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).then(networkResponse => {
                // Cache new static assets
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return networkResponse;
            }).catch(() => {
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
});
