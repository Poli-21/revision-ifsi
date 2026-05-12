// Service Worker — cache offline
const CACHE = 'ifsi-v3';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './styles/app.css',
  './data/cards.js',
  './ui/svgs.js',
  './core/srs.js',
  './core/store.js',
  './core/distractor.js',
  './core/sync.js',
  './core/session.js',
  './core/ortho.js',
  './core/games.js',
  './ui/render.js',
  './ui/modal.js',
  './core/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Cache-first : si pas de réseau, utilise le cache
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
