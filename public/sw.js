const CACHE_NAME = "blog-cache-v1";
const RUNTIME_CACHE = "runtime-cache-v1";

// Files to cache on install
const STATIC_CACHE_URLS = [
  "/",
  "/offline.html",
  "/assets/logo.svg",
  "/theme-toggle-handler.js",
];

// Install event - cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(
              cacheName =>
                cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) return;

  // HTML requests - Network first, cache fallback
  if (request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches
            .match(request)
            .then(
              cachedResponse => cachedResponse || caches.match("/offline.html")
            );
        })
    );
    return;
  }

  // Static assets - Cache first, network fallback
  if (
    url.pathname.includes("/assets/") ||
    url.pathname.includes("/_astro/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default - Network only
  event.respondWith(fetch(request));
});
