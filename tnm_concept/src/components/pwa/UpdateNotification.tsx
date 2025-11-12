import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShowUpdate(true);
      if (import.meta.env.DEV) {
        console.log('📢 Update notification shown to user');
      }
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = () => {
    setIsUpdating(true);
    
    // Trigger service worker update
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    // Also call global update function if available
    if ((window as any).updateServiceWorker) {
      (window as any).updateServiceWorker();
    }

    // Page will reload automatically when new SW takes over
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // User dismissed - they'll get the update on next page load
    if (import.meta.env.DEV) {
      console.log('ℹ️ User dismissed update notification');
    }
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100]"
        >
          <div className="bg-card border border-border rounded-lg shadow-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-full bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-card-foreground mb-1">
                    Update Available
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    A new version of Trade'n More is ready to install with improvements and bug fixes.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Now'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                      disabled={isUpdating}
                    >
                      Later
                    </Button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss update notification"
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
