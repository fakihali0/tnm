import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { getBrowserInfo, getDeviceInfo, getPWACapabilities } from '@/utils/browser-detection';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstallation() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationSupported, setInstallationSupported] = useState(false);

  const browserInfo = getBrowserInfo();
  const deviceInfo = getDeviceInfo();
  const pwaCapabilities = getPWACapabilities();

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(deviceInfo.isStandalone);
    setInstallationSupported(pwaCapabilities.canInstall);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstalling(false);
      setDeferredPrompt(null);
      
      // Show success message
      toast.success("App installed successfully! 🎉", {
        description: "You can now access Trade'n More from your home screen.",
        duration: 5000
      });

      // Clear dismissal flags
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-last-shown');
    };

    if (deviceInfo.supportsBeforeInstallPrompt) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    }
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deviceInfo.isStandalone, deviceInfo.supportsBeforeInstallPrompt, pwaCapabilities.canInstall, deviceInfo.isIOS, browserInfo.isSafari, pwaCapabilities.installMethod, pwaCapabilities.browserSpecificInstructions]);

  const install = useCallback(async () => {
    if (!installationSupported) {
      toast.error("Installation not supported", {
        description: "Your browser doesn't support PWA installation."
      });
      return false;
    }

    if (isInstalled) {
      toast.info("App already installed", {
        description: "The app is already on your device."
      });
      return false;
    }

    setIsInstalling(true);

    try {
      if (deferredPrompt && pwaCapabilities.installMethod === 'beforeinstallprompt') {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast.success("Installing app...", {
            description: "The app will be available on your device shortly."
          });
          return true;
        } else {
          toast.info("Installation cancelled", {
            description: "You can install the app later from the browser menu."
          });
          return false;
        }
      } else {
        // For manual installation, show instructions
        toast.info("Manual installation required", {
          description: pwaCapabilities.browserSpecificInstructions,
          duration: 8000
        });
        return false;
      }
    } catch (error) {
      console.error('PWA installation error:', error);
      toast.error("Installation failed", {
        description: "Please try installing from your browser menu."
      });
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt, installationSupported, isInstalled, pwaCapabilities]);

  const getInstallPromptTiming = useCallback(() => {
    if (deviceInfo.isIOS) return 800;
    if (browserInfo.isSafari && !deviceInfo.isMobile) return 800;
    if (deviceInfo.isAndroid && browserInfo.isChrome) return deferredPrompt ? 1000 : 2500;
    return 1500;
  }, [browserInfo, deviceInfo, deferredPrompt]);

  return {
    isInstalled,
    isInstalling,
    installationSupported,
    deferredPrompt: !!deferredPrompt,
    install,
    getInstallPromptTiming
  };
}