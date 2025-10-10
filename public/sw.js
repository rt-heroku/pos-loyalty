// Service Worker for POS System - Simplified Version
// This service worker provides basic caching without offline capabilities
// and ensures proper cache invalidation for updates

const CACHE_VERSION = 'v20250926-1123'; // Update this when deploying
const CACHE_NAME = `pos-cache-${CACHE_VERSION}`;

// Static assets to cache (only essential files)
const STATIC_ASSETS = [
    '/',
    '/pos/icons.js',
    '/pos/api.js',
    '/pos/crypto-utils.js',
    '/pos/mobile-utils.js'
];

// Install event - cache only essential static assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(error => {
                console.error('Cache failed:', error);
            })
    );
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...', CACHE_VERSION);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            console.log('Found caches:', cacheNames);
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete ALL old caches that don't match current version
                    if (cacheName.startsWith('pos-cache-') && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    // Also delete any cache that might be interfering
                    if (cacheName.includes('pos') && cacheName !== CACHE_NAME) {
                        console.log('Deleting interfering cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Cache cleanup completed');
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - network-first strategy with fallback to cache
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Skip API requests - always go to network
    if (url.pathname.startsWith('/pos/api/')) {
        return;
    }

    // For all other requests, use network-first strategy
    event.respondWith(
        fetch(request)
            .then(response => {
                // If network request succeeds, update cache and return response
                if (response.status === 200) {
                    const responseClone = response.clone();
                    
                    // Only cache same-origin requests
                    if (url.origin === location.origin) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                }
                return response;
            })
            .catch(() => {
                // If network fails, try to serve from cache
                return caches.match(request).then(response => {
                    if (response) {
                        console.log('Serving from cache:', request.url);
                        return response;
                    }
                    
                    // If no cache available, return a basic offline page for navigation requests
                    if (request.destination === 'document') {
                        return caches.match('/pos/').then(response => {
                            if (response) {
                                return response;
                            }
                            // Last resort - return a basic HTML response
                            return new Response(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>POS System - Offline</title>
                                    <meta charset="utf-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1">
                                </head>
                                <body>
                                    <h1>POS System</h1>
                                    <p>You are currently offline. Please check your internet connection and try again.</p>
                                    <button onclick="window.location.reload()">Retry</button>
                                </body>
                                </html>
                            `, {
                                headers: { 'Content-Type': 'text/html' }
                            });
                        });
                    }
                    
                    // For other requests, return a 404
                    return new Response('Not found', { status: 404 });
                });
            })
    );
});

// Message handling for cache updates
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.startsWith('pos-cache-')) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// Push notifications (simplified)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from POS System',
        icon: '/pos/icon-192x192.png',
        badge: '/pos/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('POS System', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});