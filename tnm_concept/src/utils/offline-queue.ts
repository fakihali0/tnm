// Offline queue utilities for handling form submissions and analytics
// when the app is offline

interface QueuedForm {
  id?: number;
  url: string;
  data: FormData | string;
  headers: Record<string, string>;
  timestamp: number;
}

interface QueuedAnalytic {
  id?: number;
  event: string;
  data: Record<string, any>;
  timestamp: number;
}

// Extend ServiceWorkerRegistration interface to include sync
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}

const DB_NAME = 'TrademoreOfflineDB';
const DB_VERSION = 1;
const FORMS_STORE = 'queuedForms';
const ANALYTICS_STORE = 'queuedAnalytics';

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
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

// Pending requests map for deduplication
const pendingRequests = new Map<string, Promise<void>>();

// Exponential backoff configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = BASE_DELAY * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} failed, waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Queue form submission with deduplication and retry
export async function queueFormSubmission(
  url: string, 
  data: FormData | string, 
  headers: Record<string, string> = {}
): Promise<void> {
  // Create request key for deduplication
  const requestKey = `${url}-${Date.now()}`;
  
  // Check if this request is already pending
  if (pendingRequests.has(requestKey)) {
    console.log('Request already pending, skipping duplicate');
    return pendingRequests.get(requestKey);
  }
  
  // Create promise for this request
  const requestPromise = (async () => {
    try {
      // Try immediate submission with retry logic if online
      if (navigator.onLine) {
        await retryWithBackoff(async () => {
          const response = await fetch(url, {
            method: 'POST',
            body: data,
            headers
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          console.log('Form submitted successfully');
        });
        return;
      }
      
      // Queue for later if offline
      const db = await initDB();
      const transaction = db.transaction([FORMS_STORE], 'readwrite');
      const store = transaction.objectStore(FORMS_STORE);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add({
          url,
          data: data instanceof FormData ? JSON.stringify(Object.fromEntries(data)) : data,
          headers,
          timestamp: Date.now(),
          retries: 0
        });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // Try to register background sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.sync) {
          await registration.sync.register('form-submission');
        }
      }
    } finally {
      // Clean up pending request
      pendingRequests.delete(requestKey);
    }
  })();
  
  // Store promise for deduplication
  pendingRequests.set(requestKey, requestPromise);
  
  return requestPromise;
}

// Queue analytics event for offline sync
export async function queueAnalyticsEvent(event: string, data: Record<string, any>): Promise<void> {
  if (navigator.onLine) {
    // If online, send immediately
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify({ event, data }),
        headers: { 'Content-Type': 'application/json' }
      });
      return;
    } catch (error) {
      // If network fails, queue it
    }
  }

  try {
    const db = await initDB();
    const transaction = db.transaction([ANALYTICS_STORE], 'readwrite');
    const store = transaction.objectStore(ANALYTICS_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        event,
        data,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Try to register background sync
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.sync) {
        await registration.sync.register('analytics-sync');
      }
    }
  } catch (error) {
    console.error('Failed to queue analytics event:', error);
  }
}

// Check if app is online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOfflineHandlers(): () => void {
  const onlineHandler = () => {
    console.log('App is back online - syncing queued data');
    // Trigger sync when back online
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.sync) {
          registration.sync.register('form-submission');
          registration.sync.register('analytics-sync');
        }
      });
    }
  };

  const offlineHandler = () => {
    console.log('App is offline - queueing new data');
  };

  // Add event listeners
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
    console.log('Offline handlers cleaned up');
  };
}