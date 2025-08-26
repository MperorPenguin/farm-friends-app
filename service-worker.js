/* Service worker for offline caching (v6 landing update) */
const CACHE_NAME = 'farm-friends-v8'; // was v6 or v7
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './animals.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  // Animal images
  './assets/img/cow.png',
  './assets/img/pig.png',
  './assets/img/chicken.png',
  './assets/img/duck.png',
  './assets/img/sheep.png',
  './assets/img/goat.png',
  './assets/img/horse.png',
  './assets/img/donkey.png',
  // Sounds
  './assets/audio/cow.mp3',
  './assets/audio/pig.mp3',
  './assets/audio/chicken.mp3',
  './assets/audio/duck.mp3',
  './assets/audio/sheep.mp3',
  './assets/audio/goat.mp3',
  './assets/audio/horse.mp3',
  './assets/audio/donkey.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(()=>{});
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
