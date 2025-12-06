const CACHE_NAME = 'haifest-v1';
const ASSETS = [
  './',
  './index.html',
  './2.png',
  './3.png',
  './4.png',
  './5.png',
  './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching assets');
        return cache.addAll(ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        // Attempt to fetch from network
        return fetch(fetchRequest).then(
          (response) => {
            // Check if valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response to cache it
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache requests from our origin or google fonts
                if (event.request.url.startsWith(self.location.origin) || 
                    event.request.url.includes('fonts.googleapis.com') || 
                    event.request.url.includes('fonts.gstatic.com')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(() => {
            // Fallback for offline
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        });
      })
  );
});
