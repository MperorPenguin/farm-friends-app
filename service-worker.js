// Farm Friends – Service Worker
// Version v0.2.8 (bump CACHE_NAME every time you change code/assets)

const CACHE_NAME = "farm-friends-v0.2.9";
const ASSETS = [
  "/",                 // index.html
  "/index.html",
  "/styles.css",
  "/app.js",
  "/animals.js",

  // Brand assets
  "/assets/brand/background.png",
  "/assets/brand/logo.png",

  // Animal images
  "/assets/img/cow.png",
  "/assets/img/pig.png",
  "/assets/img/chicken.png",
  "/assets/img/duck.png",
  "/assets/img/sheep.png",
  "/assets/img/goat.png",
  "/assets/img/horse.png",
  "/assets/img/donkey.png",

  // Animal sounds
  "/assets/audio/cow.mp3",
  "/assets/audio/pig.mp3",
  "/assets/audio/chicken.mp3",
  "/assets/audio/duck.mp3",
  "/assets/audio/sheep.mp3",
  "/assets/audio/goat.mp3",
  "/assets/audio/horse.mp3",
  "/assets/audio/donkey.mp3"
];

// Install: cache all app shell files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, fallback to network
self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET requests
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((res) => {
            // Optionally cache new requests (only same-origin)
            if (req.url.startsWith(self.location.origin)) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached) // fallback to cached if offline
      );
    })
  );
});
