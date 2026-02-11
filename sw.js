const CACHE_NAME = 'gbos-v11';
    ['/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/scripts/games.js',
    '/scripts/newapps.js',
    '/scripts/newapps_batch5.js',
    '/scripts/batch6.js',
    '/scripts/utils_expanded.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
