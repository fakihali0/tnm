import { useEffect } from 'react';
import { setupOfflineHandlers } from '@/utils/offline-queue';

/**
 * Hook to manage offline queue event handlers
 * Ensures proper cleanup to prevent memory leaks
 */
export function useOfflineQueue() {
  useEffect(() => {
    // Set up offline handlers and get cleanup function
    const cleanup = setupOfflineHandlers();

    // Clean up on unmount
    return cleanup;
  }, []);
}
