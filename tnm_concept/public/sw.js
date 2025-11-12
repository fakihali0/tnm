// Enhanced Service Worker for Trademore
// Provides offline support, advanced caching, background sync, and push notifications

// Cache names and versions
const STATIC_CACHE = 'trademore-static-v3';
const DYNAMIC_CACHE = 'trademore-dynamic-v3';
const API_CACHE = 'trademore-api-v2';
const CRITICAL_CACHE = 'trademore-critical-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/ar',
  '/offline.html',
  '/offline-enhanced.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/og-image.webp',
  '/critical.css',
  // Key pages for offline
  '/products',
  '/products/trading-instruments',
  '/products/payment-methods',
  '/products/platforms',
  '/products/account-types',
  '/get-funded',
  '/education',
  '/partners',
  '/contact',
  // Translation files
  '/locales/en/common.json',
  '/locales/ar/common.json'
];

// Critical resources for offline-first experience
const CRITICAL_ASSETS = [
  '/products/trading-instruments',
  '/products/payment-methods',
  '/get-funded',
  '/education'
];

// Fonts and external resources
const FONT_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Noto+Sans+Arabic:wght@300;400;600;700&display=swap',
  'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
  'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2',
  'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
];

// API endpoints to cache
const API_PATTERNS = [
  /\/api\/financial-data/,
  /\/functions\/financial-data/,
  /\/functions\/swap-rates/
];

// Listen for messages to control SW lifecycle
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(async (cache) => {
        try {
          await cache.addAll(STATIC_ASSETS);
        } catch (error) {
          // Fail silently for individual assets
        }
      }),
      caches.open(API_CACHE).then((cache) => cache.addAll([])),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, CRITICAL_CACHE];
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all caches that are NOT in our current cache list
            if (!currentCaches.includes(cacheName)) {
              if (import.meta.env.DEV) {
                console.log('🗑️ Deleting old cache:', cacheName);
              }
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
  
  // Listen for skip waiting message
  self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
});

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // API requests - stale-while-revalidate strategy
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Static assets - cache first strategy
  if (STATIC_ASSETS.some(asset => asset === request.url || url.pathname === asset)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflinePage(request));
    return;
  }

  // Other requests - network first strategy
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cachedResponse || fetchPromise;
}

async function networkFirstWithOfflinePage(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    return caches.match('/offline.html') || 
           new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

// Background sync for form submissions and analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'form-submission') {
    event.waitUntil(handleFormSync());
  }
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(handleAnalyticsSync());
  }
});

async function handleFormSync() {
  // Handle queued form submissions when back online
  try {
    const forms = await getQueuedForms();
    for (const form of forms) {
      await fetch(form.url, {
        method: 'POST',
        body: form.data,
        headers: form.headers
      });
      await removeQueuedForm(form.id);
    }
  } catch (error) {
    // Retry on next sync
  }
}

async function handleAnalyticsSync() {
  // Handle queued analytics events
  try {
    const events = await getQueuedAnalytics();
    for (const event of events) {
      await fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: { 'Content-Type': 'application/json' }
      });
      await removeQueuedAnalytics(event.id);
    }
  } catch (error) {
    // Retry on next sync
  }
}

// Enhanced push notifications
self.addEventListener('push', (event) => {
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData = { body: event.data.text() };
    }
  }

  const options = {
    body: notificationData.body || 'New notification from Trademore',
    icon: '/icon-192x192.png',
    badge: '/og-image.webp',
    image: notificationData.image,
    vibrate: [100, 50, 100],
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: {
      ...notificationData,
      dateOfArrival: Date.now(),
      url: notificationData.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Trademore', 
      options
    )
  );
});

// Enhanced notification interaction handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  const urlToOpen = action === 'open' ? data.url : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// IndexedDB for offline storage
const DB_NAME = 'TrademoreOfflineDB';
const DB_VERSION = 1;
const FORMS_STORE = 'queuedForms';
const ANALYTICS_STORE = 'queuedAnalytics';

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(FORMS_STORE)) {
        const formsStore = db.createObjectStore(FORMS_STORE, { keyPath: 'id', autoIncrement: true });
        formsStore.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains(ANALYTICS_STORE)) {
        const analyticsStore = db.createObjectStore(ANALYTICS_STORE, { keyPath: 'id', autoIncrement: true });
        analyticsStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Queue form submission for offline sync
async function queueFormSubmission(url, data, headers) {
  try {
    const db = await initDB();
    const transaction = db.transaction([FORMS_STORE], 'readwrite');
    const store = transaction.objectStore(FORMS_STORE);
    
    await store.add({
      url,
      data,
      headers,
      timestamp: Date.now()
    });
    
    // Try to register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('form-submission');
    }
  } catch (error) {
    console.error('Failed to queue form submission:', error);
  }
}

// Queue analytics event for offline sync
async function queueAnalyticsEvent(eventData) {
  try {
    const db = await initDB();
    const transaction = db.transaction([ANALYTICS_STORE], 'readwrite');
    const store = transaction.objectStore(ANALYTICS_STORE);
    
    await store.add({
      ...eventData,
      timestamp: Date.now()
    });
    
    // Try to register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('analytics-sync');
    }
  } catch (error) {
    console.error('Failed to queue analytics event:', error);
  }
}

// Get queued forms
async function getQueuedForms() {
  try {
    const db = await initDB();
    const transaction = db.transaction([FORMS_STORE], 'readonly');
    const store = transaction.objectStore(FORMS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get queued forms:', error);
    return [];
  }
}

// Remove queued form
async function removeQueuedForm(id) {
  try {
    const db = await initDB();
    const transaction = db.transaction([FORMS_STORE], 'readwrite');
    const store = transaction.objectStore(FORMS_STORE);
    await store.delete(id);
  } catch (error) {
    console.error('Failed to remove queued form:', error);
  }
}

// Get queued analytics
async function getQueuedAnalytics() {
  try {
    const db = await initDB();
    const transaction = db.transaction([ANALYTICS_STORE], 'readonly');
    const store = transaction.objectStore(ANALYTICS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get queued analytics:', error);
    return [];
  }
}

// Remove queued analytics
async function removeQueuedAnalytics(id) {
  try {
    const db = await initDB();
    const transaction = db.transaction([ANALYTICS_STORE], 'readwrite');
    const store = transaction.objectStore(ANALYTICS_STORE);
    await store.delete(id);
  } catch (error) {
    console.error('Failed to remove queued analytics:', error);
  }
}

// Make functions available globally for offline form handling
self.queueFormSubmission = queueFormSubmission;
self.queueAnalyticsEvent = queueAnalyticsEvent;