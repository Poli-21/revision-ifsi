// Service Worker — cache offline + mises à jour automatiques
const CACHE = 'ifsi-v4';
const STATIC = [
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

// À l'installation : met en cache uniquement les icônes/manifest
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

// À l'activation : supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Stratégie :
// - HTML/JS/CSS → Network-first (toujours la version à jour)
// - Icônes/images → Cache-first (statique, ne change pas)
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isStatic = url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.ico');

  // Ne cache que les requêtes GET (pas POST/PATCH/PUT)
  if (e.request.method !== 'GET') return;

  if (isStatic) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  } else {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
