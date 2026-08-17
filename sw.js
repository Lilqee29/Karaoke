const CACHE_NAME = 'gbos-v18';
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

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(err => {
                return Promise.all(
                    ASSETS.map(url => cache.add(url).catch(() => {}))
                );
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // ONLY cache same-origin requests. Everything else goes straight to network.
    if (!e.request.url.startsWith(self.location.origin)) return;
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cached) => {
            return cached || fetch(e.request).then((res) => {
                if (res && res.status === 200) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                }
                return res;
            });
        }).catch(() => {
            return new Response('Offline', { status: 503 });
        })
    );
});
