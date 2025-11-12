import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./pwa-setup";
import { initializeI18n } from "@/i18n";
import { performanceMonitor } from "@/services/performance-monitor";
import { setupOfflineHandlers } from "@/utils/offline-queue";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

// Set initial direction and language before React renders (prevents RTL/LTR flash)
(() => {
  const path = window.location.pathname;
  const isArabic = path.startsWith('/ar');
  const html = document.documentElement;
  html.dir = isArabic ? 'rtl' : 'ltr';
  html.lang = isArabic ? 'ar' : 'en';
  const body = document.body;
  // Ensure correct font classes at first paint
  body.classList.toggle('font-cairo', isArabic);
  body.classList.toggle('font-inter', !isArabic);
})();

// Enhanced Service Worker registration with update handling
let newWorkerWaiting: ServiceWorker | null = null;

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        });

        if (import.meta.env.DEV) {
          console.log('✅ Service Worker registered successfully');
        }

        // Immediately activate waiting service worker if present
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              newWorkerWaiting = newWorker;
              
              // Immediately activate the waiting service worker
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
              
              // Dispatch custom event for update notification
              window.dispatchEvent(new CustomEvent('sw-update-available', {
                detail: { registration, newWorker }
              }));

              if (import.meta.env.DEV) {
                console.log('🔄 New service worker available');
              }
            }
          });
        });

        // Handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (import.meta.env.DEV) {
            console.log('♻️ Service worker updated, reloading page...');
          }
          window.location.reload();
        });

        // Listen for skip waiting message from update notification
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SKIP_WAITING') {
            newWorkerWaiting?.postMessage({ type: 'SKIP_WAITING' });
          }
        });

      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ Service Worker registration failed:', error);
        }
      }
    });
  }
}

// Expose update function globally for update notification component
(window as any).updateServiceWorker = () => {
  if (newWorkerWaiting) {
    newWorkerWaiting.postMessage({ type: 'SKIP_WAITING' });
  }
};

// Register service worker
registerServiceWorker();

// Set up offline handlers with automatic cleanup
const cleanupOfflineHandlers = setupOfflineHandlers();

// Initialize i18n before rendering to avoid hook errors
performanceMonitor.mark('app_bootstrap_start');

initializeI18n()
  .catch((error) => {
    if (import.meta.env.DEV) {
      console.error('Failed to initialize i18n', error);
    }
  })
  .finally(async () => {
    // Lazy import InstallPromptManager
    const { InstallPromptManager } = await import('@/components/pwa/InstallPromptManager');
    
    // Render app with install prompt once after i18n is ready
    root.render(
      <>
        <App />
        <InstallPromptManager />
      </>
    );
    
    performanceMonitor.measure('app_bootstrap', 'app_bootstrap_start');
    
    if (import.meta.env.DEV) {
      setTimeout(() => {
        console.log('🚀 Performance monitoring active');
      }, 1000);
    }
  });
