import { useSyncExternalStore } from 'react';

let mediaQuery: MediaQueryList | null = null;

function getSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side fallback
  }
  
  if (!mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  
  return mediaQuery.matches;
}

function getServerSnapshot(): boolean {
  return false; // Always return false on server
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }
  
  if (!mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  
  const listener = () => callback();
  mediaQuery.addEventListener('change', listener);
  
  return () => {
    mediaQuery?.removeEventListener('change', listener);
  };
}

/**
 * Synchronously returns the user's reduced motion preference.
 * Uses useSyncExternalStore to ensure the preference is available
 * before the first paint, preventing animation glitches.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}