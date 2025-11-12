import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analytics } from '@/services/analytics';
import { useToast } from '@/hooks/use-toast';

export const InstallPromptManager = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show prompt after 30 seconds of usage if not previously dismissed
      const dismissedTimestamp = localStorage.getItem('pwa-install-dismissed-at');
      const daysSinceDismissed = dismissedTimestamp 
        ? (Date.now() - parseInt(dismissedTimestamp)) / (1000 * 60 * 60 * 24)
        : 999;

      // Show again after 7 days if previously dismissed
      if (daysSinceDismissed > 7) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      localStorage.setItem('pwa-installed', 'true');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Installation not available',
        description: 'Please try again later or check your browser settings.',
        variant: 'default'
      });
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      analytics.track('pwa_installed', {
        source: 'install_prompt',
        timestamp: new Date().toISOString()
      });

      localStorage.setItem('pwa-installed', 'true');

      toast({
        title: 'App installed successfully!',
        description: 'You can now access TNM AI from your home screen.',
      });
    } else {
      analytics.track('pwa_install_dismissed', {
        source: 'install_prompt',
        timestamp: new Date().toISOString()
      });
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
    setShowPrompt(false);

    analytics.track('pwa_install_prompt_dismissed', {
      timestamp: new Date().toISOString()
    });
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 max-w-sm z-50"
        >
          <Card className="p-4 shadow-lg bg-card border-border">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">Install TNM AI</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get faster access and work offline with our app
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleInstall} className="flex-1">
                    Install
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
