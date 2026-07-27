// Service Worker · TCAE SERGAS app
// Estrategia: "network-first" -> siempre intenta traer la versión más reciente
// de index.html (para que tus actualizaciones se vean al instante),
// y solo usa la copia guardada en caché si no hay conexión (modo offline).
//
// Si alguna vez quieres forzar que todos los dispositivos limpien la caché
// vieja, simplemente sube el número de CACHE_VERSION.

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'tcae-sergas-' + CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo gestionamos peticiones GET del propio origen (la app en sí).
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return networkResponse;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
