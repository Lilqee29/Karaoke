const CACHE_NAME = 'gbos-v26';
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
    './scripts/creative_apps.js',
    './scripts/platformer.js',
    './beat-boy.js',
];

// ── INSTALL: cache everything, then activate immediately ────────
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(() => {
                return Promise.all(
                    ASSETS.map(url => cache.add(url).catch(() => {}))
                );
            });
        })
    );
    self.skipWaiting();
});

// ── ACTIVATE: nuke ALL old caches, then take over ──────────────
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

// ── FETCH: network-first for HTML, cache-first for everything else ──
self.addEventListener('fetch', (e) => {
    // Skip non-GET and cross-origin
    if (!e.request.url.startsWith(self.location.origin)) return;
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);
    const isHTML = e.request.mode === 'navigate' ||
                   url.pathname.endsWith('.html') ||
                   url.pathname === './' || url.pathname === '/' ||
                   (e.request.headers && e.request.headers.get && (e.request.headers.get('accept') || '').includes('text/html'));

    if (isHTML) {
        // HTML: network-first so new deploys are seen immediately
        e.respondWith(
            fetch(e.request).then((res) => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return res;
            }).catch(() => caches.match(e.request))
        );
    } else {
        // JS/CSS/images: cache-first, update in background
        e.respondWith(
            caches.match(e.request).then((cached) => {
                const fetchPromise = fetch(e.request).then((res) => {
                    if (res && res.status === 200) {
                        const clone = res.clone();
                        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                    }
                    return res;
                }).catch(() => cached);

                return cached || fetchPromise;
            })
        );
    }
});

// ── MESSAGE: force-skip waiting ────────────────────────────────
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
