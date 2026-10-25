const CACHE = 'uton-v5';
const ASSETS = [
    '/',
    '/css/app.css',
    '/js/app.js',
    '/manifest.webmanifest',
    '/apple-touch-icon-alzafutar-v5.png',
    '/apple-touch-icon.png',
    '/favicon.ico',
    '/favicon.svg',
    '/icons/android/launchericon-192x192.png',
    '/icons/android/launchericon-512x512.png',
    '/icons/ios/32.png',
    '/icons/ios/180.png',
    '/icons/maskable.svg',
];
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('uton-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).then(response => {
            if (response.ok && url.pathname === '/') {
                const copy = response.clone();
                event.waitUntil(caches.open(CACHE).then(cache => cache.put('/', copy)));
            }
            return response;
        }).catch(() => caches.match('/')));
    } else if (ASSETS.includes(url.pathname)) {
        event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(cached => cached || fetch(event.request)));
    }
});
