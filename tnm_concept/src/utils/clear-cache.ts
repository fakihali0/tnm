/**
 * Clear all application caches including service worker caches
 * Useful for debugging and forcing fresh content
 */
export const clearAppCache = async (): Promise<void> => {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Cleared', cacheNames.length, 'cache(s)');
    }

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Unregistered', registrations.length, 'service worker(s)');
    }

    // Clear localStorage (except essentials)
    const essentialKeys = ['i18nextLng', 'theme'];
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !essentialKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('✅ Cleared', keysToRemove.length, 'localStorage item(s)');

    console.log('🎉 Cache cleared successfully! Reloading...');
    
    // Force reload to get fresh content
    window.location.reload();
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    throw error;
  }
};

// Expose globally for debugging in development
if (import.meta.env.DEV) {
  (window as any).clearAppCache = clearAppCache;
  console.log('💡 Tip: Run clearAppCache() in console to clear all caches');
}
