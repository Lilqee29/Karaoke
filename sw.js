const CACHE_NAME = 'gbos-v17';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './retroos.js',
    './manifest.json',
    './beat-boy.css',
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
// NOTE: itunes.apple.com is NOT here — iOS redirects to musics:// scheme which breaks SW fetch
const API_PATTERNS = [
    'api.radio-browser.info',
    'api.open-meteo.com',
    'nasa.gov',
    'api.openweathermap.org',
    'thecocktaildb.com',
];

// YouTube domains — network-only for video/audio
const YT_PATTERNS = ['youtube.com', 'ytimg.com', 'googlevideo.com'];

// CORS proxy domains — network-only
const CORS_PROXY_PATTERNS = ['corsproxy.io', 'allorigins.win'];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching assets...');
            return cache.addAll(ASSETS).catch(err => {
                console.warn('SW: Cache addAll failed, trying individual:', err);
                return Promise.all(
                    ASSETS.map(url => cache.add(url).catch(e => console.error(`SW: Failed to cache: ${url}`, e)))
                );
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('SW: Deleting old cache:', name);
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

    // Skip cross-origin navigation (e.g. MiniTrollGame, external pages)
    // Only handle same-origin or known CDN requests
    const isSameOrigin = url.startsWith(self.location.origin);
    const isCDN = url.includes('cdn.jsdelivr.net') || url.includes('cdnjs.cloudflare.com') || url.includes('tonejs.github.io');

    // API calls → network only, never cache
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

    // YouTube → network only
    const isYT = YT_PATTERNS.some(p => url.includes(p));
    if (isYT) {
        e.respondWith(
            fetch(e.request).catch(() => {
                return new Response('Offline', { status: 503 });
            })
        );
        return;
    }

    // For non-same-origin, non-CDN requests (e.g. external page navigation) — just fetch, don't cache
    if (!isSameOrigin && !isCDN) {
        return; // Let browser handle it normally
    }

    // Static assets / same-origin / CDN audio → cache-first
    e.respondWith(
        caches.match(e.request).then((response) => {
            if (response) return response;
            return fetch(e.request).then(networkResponse => {
                // Cache successful responses for same-origin and CDN
                if (networkResponse && networkResponse.status === 200 && (isSameOrigin || isCDN)) {
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
