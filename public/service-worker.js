/**
 * AutoForce™ Service Worker
 * Provides offline support and caching for PWA functionality
 */

const CACHE_NAME = 'autoforce-v1';
const RUNTIME_CACHE = 'autoforce-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // API requests - network only (don't cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // WebSocket connections - network only
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // For all other requests: Network first, fallback to cache
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(cache => {
      return fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then(cached => {
            if (cached) {
              return cached;
            }
            // If not in cache and offline, return offline page
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            // For other resources, just fail gracefully
            return new Response('Offline', { status: 503 });
          });
        });
    })
  );
});

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from AutoForce™',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'autoforce-notification',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AutoForce™', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
