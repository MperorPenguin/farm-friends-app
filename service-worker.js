// Farm Friends – Service Worker
// Version v0.3.0 (bump CACHE_NAME when you change files)

const CACHE_NAME = "farm-friends-v0.3.0";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/animals.js",

  // Brand
  "/assets/brand/background.png",
  "/assets/brand/logo.png",

  // Images
  "/assets/img/cow.png",
  "/assets/img/pig.png",
  "/assets/img/chicken.png",
  "/assets/img/duck.png",
  "/assets/img/sheep.png",
  "/assets/img/goat.png",
  "/assets/img/horse.png",
  "/assets/img/donkey.png",

  // Audio
  "/assets/audio/cow.mp3",
  "/assets/audio/pig.mp3",
  "/assets/audio/chicken.mp3",
  "/assets/audio/duck.mp3",
  "/assets/audio/sheep.mp3",
  "/assets/audio/goat.mp3",
  "/assets/audio/horse.mp3",
  "/assets/audio/donkey.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((res) => {
            if (req.url.startsWith(self.location.origin)) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});
