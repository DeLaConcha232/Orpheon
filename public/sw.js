const CACHE_NAME = 'orpheon-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Security headers for cached responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Bypass caching for dev module graph and Vite assets
  if (
    url.includes('/node_modules/.vite') ||
    url.includes('/@vite') ||
    url.includes('/src/') ||
    url.includes('/assets/')
  ) {
    return; // let the network handle it to avoid stale modules
  }

  // Skip Supabase API calls for real-time data
  if (url.includes('supabase.co')) {
    return;
  }

  // Skip sensitive endpoints
  if (url.includes('/auth') || url.includes('/api/') || url.includes('token')) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          const secureResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
              ...Object.fromEntries(response.headers.entries()),
              ...SECURITY_HEADERS,
            },
          });
          return secureResponse;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          if (
            response.headers.get('authorization') ||
            response.headers.get('cookie') ||
            response.headers.get('set-cookie')
          ) {
            return response;
          }

          const responseToCache = response.clone();
          const secureResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
              ...Object.fromEntries(response.headers.entries()),
              ...SECURITY_HEADERS,
            },
          });

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return secureResponse;
        });
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/').then((response) => {
            if (response) {
              return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                  ...Object.fromEntries(response.headers.entries()),
                  ...SECURITY_HEADERS,
                },
              });
            }
          });
        }
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Orpheon',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Orpheon', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Enhanced security - validate URL before opening
  const targetUrl = event.notification.data?.url || '/';
  
  // Only allow relative URLs or URLs from our domain
  if (targetUrl.startsWith('/') || targetUrl.startsWith(self.location.origin)) {
    event.waitUntil(
      clients.openWindow(targetUrl)
    );
  } else {
    // Log suspicious activity and open safe default
    console.warn('Blocked suspicious notification URL:', targetUrl);
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});