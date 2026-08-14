/**
 * CineStream - Production Service Worker
 * @version 1.0.0
 */

const CACHE_VERSION = 'cinestream-v1.0.1';
const PRECACHE_NAME = `cinestream-precache-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `cinestream-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `cinestream-images-${CACHE_VERSION}`;

// Core assets required for instantaneous offline App Shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/maskable-192.svg',
  '/icons/maskable-512.svg',
  '/icons/apple-touch-icon.svg',
];

// Domains/Paths that should NEVER be cached (Auth, Tokens, Streaming Video Data, Firebase API)
const EXCLUDED_HOSTS = [
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firestore.googleapis.com',
  'www.googleapis.com',
  'accounts.google.com',
  'oauth2.googleapis.com',
];

// Max items in image cache
const MAX_IMAGE_CACHE_ENTRIES = 80;

/**
 * Utility to prune image cache when exceeding size limit
 */
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (e) {
    // Ignore pruning errors
  }
}

// 1. INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      })
  );
});

// 2. ACTIVATE (Purge old cache versions)
self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE_NAME, RUNTIME_CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[SW] Deleting stale cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. MESSAGE LISTENER (Skip Waiting on user update trigger)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. FETCH STRATEGIES
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Never cache sensitive authentication, googleapis, firebase auth or video streaming byte ranges
  if (
    EXCLUDED_HOSTS.some((host) => url.hostname.includes(host)) ||
    request.headers.get('range') ||
    url.pathname.includes('/api/auth')
  ) {
    return;
  }

  // Strategy A: Navigation Requests (HTML SPA) -> Network-First with Cache App Shell Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Strategy B: Static Assets (JS, CSS, Google Fonts, SVGs, WebManifest) -> Stale-While-Revalidate
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.webmanifest') ||
      url.pathname.endsWith('.json'));

  const isFont =
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset || isFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy C: Image Assets (TMDb Posters, Unsplash Covers, Avatars) -> Stale-While-Revalidate with opaque support
  const isImage =
    request.destination === 'image' ||
    url.hostname.includes('image.tmdb.org') ||
    url.hostname.includes('images.unsplash.com') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|gif)$/i);

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              const responseClone = networkResponse.clone();
              caches.open(IMAGE_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone).catch(() => {});
                trimCache(IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_ENTRIES);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return cached version if network fails
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy D: TMDb API Catalog queries -> Stale-While-Revalidate for instant catalog offline view
  if (url.hostname.includes('api.themoviedb.org')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
