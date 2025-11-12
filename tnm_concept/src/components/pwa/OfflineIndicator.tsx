import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Keep showing for 2 seconds to confirm reconnection
      setTimeout(() => setShowIndicator(false), 2000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
        >
          <div className="container mx-auto px-4 pt-4">
            <div 
              className={`
                rounded-lg shadow-lg backdrop-blur-sm p-4 pointer-events-auto
                ${isOffline 
                  ? 'bg-destructive/90 text-destructive-foreground' 
                  : 'bg-success/90 text-white'
                }
              `}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <WifiOff className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {isOffline ? 'You\'re Offline' : 'Back Online'}
                    </p>
                    <p className="text-sm opacity-90">
                      {isOffline 
                        ? 'Some features may be limited. Cached content is still available.' 
                        : 'Connection restored successfully!'
                      }
                    </p>
                  </div>
                </div>
                {isOffline && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRetry}
                    className="flex-shrink-0"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
