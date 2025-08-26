/* Farm Friends — Service Worker (fresh build)
   Strategy:
   - App shell is precached for full offline use
   - Images/Audio: precached (animals) + runtime cache
   - HTML navigations: network-first with navigationPreload, fallback to cached index.html
   - Static assets (CSS/JS): stale-while-revalidate
   - Safe updates via skipWaiting + clients.claim
*/

const CACHE_VERSION = 'v14';
const CACHE_NAME = `farm-friends-${CACHE_VERSION}`;

// --- App shell + core assets (edit paths if yours differ) ---
const PRECACHE_URLS = [
  '/',                  // ensure server maps "/" to /index.html
  '/index.html',
  '/styles.css',
  '/app.js',
  '/animals.js',
  '/manifest.webmanifest',

  // Icons (optional; include if you have them)
  // '/assets/icons/icon-192.png',
  // '/assets/icons/icon-512.png',

  // Animal images
  '/assets/img/cow.png',
  '/assets/img/pig.png',
  '/assets/img/chicken.png',
  '/assets/img/duck.png',
  '/assets/img/sheep.png',
  '/assets/img/goat.png',
  '/assets/img/horse.png',
  '/assets/img/donkey.png',

  // Animal audio (mp3 as you said)
  '/assets/audio/cow.mp3',
  '/assets/audio/pig.mp3',
  '/assets/audio/chicken.mp3',
  '/assets/audio/duck.mp3',
  '/assets/audio/sheep.mp3',
  '/assets/audio/goat.mp3',
  '/assets/audio/horse.mp3',
  '/assets/audio/donkey.mp3',
];

// Build a quick lookup set for static cache-first
const STATIC_SET = new Set(PRECACHE_URLS.map(u => new URL(u, self.location.origin).pathname));

// Optional: small runtime cache size guard (very simple)
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const MAX_RUNTIME_ENTRIES = 120;

/* -----------------------
   INSTALL: pre-cache app
------------------------*/
self.addEventListener('install', (event) => {
  // Force this SW to become active immediately after install
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Fetch with cache-busting to ensure fresh content
      const requests = PRECACHE_URLS.map((url) =>
        new Request(url, { cache: 'reload' })
      );
      await cache.addAll(requests);
    })
  );
});

/* -----------------------
   ACTIVATE: cleanup old
------------------------*/
self.addEventListener('activate', (event) => {
  // Enable navigation preload for faster navigations
  event.waitUntil((async () => {
    // Clear old caches
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME && key !== RUNTIME_CACHE) {
          return caches.delete(key);
        }
      })
    );

    // Turn on nav preload if supported
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }

    // Control clients without a reload
    await self.clients.claim();
  })());
});

/* -----------------------
   FETCH: smart routing
------------------------*/
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Pass through Range requests (audio seeking)
  if (req.headers.has('range')) {
    event.respondWith(fetch(req));
    return;
  }

  // Handle navigations (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  // Same-origin static assets we precached: cache-first
  if (url.origin === self.location.origin && STATIC_SET.has(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Everything else (images, audio not in list, JSON, etc.): stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

/* -----------------------
   Message: allow SKIP_WAITING
------------------------*/
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* =======================
   Strategies & Helpers
======================= */

// Network-first for navigations with preload & fallback to index.html
async function handleNavigation(event) {
  try {
    // Use navigation preload if available
    const preload = await event.preloadResponse;
    if (preload) return preload;

    // Else try network
    const net = await fetch(event.request);
    // Optionally: cache a fresh index.html response (not required)
    return net;
  } catch {
    // Offline fallback to cached index.html
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match('/index.html');
    return cached || new Response('<h1>Offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
      status: 200
    });
  }
}

// Cache-first for static, precached assets
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreVary: true, ignoreSearch: true });
  if (cached) return cached;

  try {
    const net = await fetch(request);
    cache.put(request, net.clone());
    return net;
  } catch (e) {
    // as a conservative fallback, return a 504
    return new Response('Offline', { status: 504 });
  }
}

// Stale-while-revalidate for misc resources
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      // Only cache successful, basic/opaque or CORS responses
      if (res && (res.status === 200 || res.type === 'opaque')) {
        cache.put(request, res.clone()).then(() => limitCache(cache, MAX_RUNTIME_ENTRIES)).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  // Return cached immediately, else wait for network
  return cached || networkPromise || new Response('Offline', { status: 504 });
}

// Tiny FIFO-ish limiter (simple: delete oldest if too many)
async function limitCache(cache, max) {
  const keys = await cache.keys();
  if (keys.length <= max) return;
  const excess = keys.length - max;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}
