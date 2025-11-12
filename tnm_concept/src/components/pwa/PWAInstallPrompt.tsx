import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone, Monitor, Zap, Shield, Bell, TrendingUp, BarChart3, Clock, Share, Menu, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { getBrowserInfo, getDeviceInfo, getPWACapabilities, shouldShowPWAPrompt, getInstallInstructions } from "@/utils/browser-detection";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { usePWAInstallation } from "@/hooks/usePWAInstallation";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  className?: string;
}

export function PWAInstallPrompt({ className }: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const { t, i18n } = useTranslation(['common', 'pwa']);
  const location = useLocation();
  
  const isRTL = i18n.language === 'ar';
  const browserInfo = getBrowserInfo();
  const deviceInfo = getDeviceInfo();
  const pwaCapabilities = getPWACapabilities();
  
  // Use new hooks
  const { metrics, trackInteraction, isEngaged } = useEngagementTracking();
  const { isInstalled, isInstalling, installationSupported, deferredPrompt, install, getInstallPromptTiming } = usePWAInstallation();

  useEffect(() => {
    if (isInstalled || !installationSupported) {
      return;
    }

    const showBasedOnEngagement = () => {
      if (!shouldShowPWAPrompt()) {
        return;
      }
      
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const lastShown = localStorage.getItem('pwa-install-last-shown');
      const now = Date.now();
      
      // Very reduced dismissal periods for debugging, especially iOS
      const dismissalPeriod = deviceInfo.isIOS ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 min iOS, 15 min others
      const lastShownPeriod = deviceInfo.isIOS ? 1 * 60 * 1000 : 3 * 60 * 1000; // 1 min iOS, 3 min others
      
      if (dismissed && now - parseInt(dismissed) < dismissalPeriod) {
        return;
      }
      if (lastShown && now - parseInt(lastShown) < lastShownPeriod) {
        return;
      }
      
      // Check engagement before showing (iOS gets high priority)
      const engaged = isEngaged();
      if (engaged || deviceInfo.isIOS) {
        setShowPrompt(true);
        localStorage.setItem('pwa-install-last-shown', now.toString());
      }
    };

    // Use dynamic timing based on browser and engagement
    const timing = getInstallPromptTiming();
    
    // iOS Safari - show prompt regardless of beforeinstallprompt
    if (deviceInfo.isIOS && browserInfo.isSafari) {
      const iosTimer = setTimeout(showBasedOnEngagement, timing);
      return () => clearTimeout(iosTimer);
    }
    
    // Android Chrome without beforeinstallprompt, use fallback timing
    if (deviceInfo.isAndroid && browserInfo.isChrome && !deferredPrompt) {
      const fallbackTimer = setTimeout(() => {
        if (!deferredPrompt) {
          // Show manual installation prompt after waiting for potential beforeinstallprompt
          showBasedOnEngagement();
        }
      }, timing);
      
      return () => clearTimeout(fallbackTimer);
    } else {
      // Regular timing for other browsers
      const timer = setTimeout(showBasedOnEngagement, timing);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, installationSupported, isEngaged, deferredPrompt, deviceInfo.isAndroid, deviceInfo.isIOS, browserInfo.isChrome, browserInfo.isSafari, getInstallPromptTiming, metrics]);

  const handleInstall = async () => {
    trackInteraction(); // Track user interaction
    
    const success = await install();
    if (success || pwaCapabilities.installMethod === 'beforeinstallprompt') {
      setShowPrompt(false);
    } else {
      // For manual installation, show learn more with instructions
      setShowLearnMore(true);
    }
  };

  const handleDismiss = () => {
    trackInteraction(); // Track user interaction
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const getContextualContent = () => {
    const path = location.pathname;
    if (path.includes('trading') || path.includes('instruments')) {
      return {
        title: t('pwa.contextual.trading.title', 'Trade faster with our app'),
        subtitle: t('pwa.contextual.trading.subtitle', 'Execute trades in milliseconds')
      };
    }
    if (path.includes('education')) {
      return {
        title: t('pwa.contextual.education.title', 'Learn trading anywhere'),
        subtitle: t('pwa.contextual.education.subtitle', 'Access educational content offline')
      };
    }
    if (path.includes('markets') || path === '/') {
      return {
        title: t('pwa.contextual.markets.title', 'Never miss a market move'),
        subtitle: t('pwa.contextual.markets.subtitle', 'Get real-time alerts & analysis')
      };
    }
    return {
      title: t('pwa.install.title', "Install Trade'n More"),
      subtitle: t('pwa.install.subtitle', 'Join 50,000+ traders who trust our platform')
    };
  };

  const getDeviceInstructions = () => {
    if (deviceInfo.isMobile) {
      return t('pwa.install.mobileInstructions', 'Tap "Add to Home Screen" for lightning-fast trading');
    }
    return t('pwa.install.desktopInstructions', 'Install for instant access to your trading dashboard');
  };

  const getInstallButtonText = () => {
    if (isInstalling) {
      return t('pwa.install.installing', 'Installing...');
    }
    if (pwaCapabilities.installMethod === 'beforeinstallprompt') {
      return t('pwa.install.button', 'Install Trading App');
    }
    return t('pwa.install.learnMore', 'How to Install');
  };

  const getBrowserSpecificIcon = () => {
    if (deviceInfo.isIOS || (browserInfo.isSafari && !deviceInfo.isMobile)) {
      return Share;
    }
    if (browserInfo.isSamsung || browserInfo.isFirefox) {
      return Menu;
    }
    return Download;
  };

  const getFeatureIcons = () => [
    { icon: Zap, key: 'instantAccess' },
    { icon: BarChart3, key: 'offlineCharts' },
    { icon: Bell, key: 'pushNotifications' },
    { icon: Shield, key: 'secureBanking' },
    { icon: TrendingUp, key: 'oneClickTrading' },
    { icon: Clock, key: 'marketAnalysis' }
  ];

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />
          
          {/* Install Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              duration: 0.5 
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 mx-4 mb-4 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2",
              "bg-card border border-border/20 rounded-2xl shadow-2xl overflow-hidden",
              "backdrop-blur-xl bg-card/95 supports-[backdrop-filter]:bg-card/95",
              className
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className={cn(
                "absolute top-4 z-10 p-2 rounded-full hover:bg-accent/80 transition-colors",
                "touch-target min-h-[44px] min-w-[44px] flex items-center justify-center",
                isRTL ? "left-4" : "right-4"
              )}
              aria-label={t('common.close', 'Close')}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Header with Animated Icon */}
              <div className="flex items-center gap-4 mb-4">
                 <motion.div 
                  className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px hsl(var(--primary) / 0.2)",
                      "0 0 30px hsl(var(--primary) / 0.3)",
                      "0 0 20px hsl(var(--primary) / 0.2)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: deviceInfo.isMobile ? [0, 5, -5, 0] : [0, 0, 0, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {deviceInfo.isMobile ? (
                      <Smartphone className="h-6 w-6 text-primary" />
                    ) : (
                      <Monitor className="h-6 w-6 text-primary" />
                    )}
                  </motion.div>
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {getContextualContent().title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getContextualContent().subtitle}
                  </p>
                  <p className="text-xs text-primary/80 mt-1 font-medium">
                    {t('pwa.install.socialProof', 'Trusted by traders worldwide')}
                  </p>
                </div>
              </div>

              {/* Enhanced Features Grid */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t('pwa.install.benefits', 'Why install?')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {getFeatureIcons().slice(0, 4).map(({ icon: IconComponent, key }, index) => (
                    <motion.div 
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 text-xs p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      <IconComponent className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{t(`pwa.features.${key}`, key)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Learn More Section */}
              <AnimatePresence>
                {showLearnMore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                     <div className="bg-accent/20 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <h5 className="text-sm font-medium text-foreground">
                          {pwaCapabilities.needsManualInstructions 
                            ? `How to install in ${browserInfo.name}`
                            : t('pwa.installation.steps.title', 'Easy 3-step installation')
                          }
                        </h5>
                      </div>
                      
                      {pwaCapabilities.needsManualInstructions ? (
                        <div className="space-y-2 text-xs text-muted-foreground">
                          {getInstallInstructions(i18n.language as 'en' | 'ar').map((instruction, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-xs flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <span className="leading-relaxed">{instruction}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-xs">1</div>
                            <span>{t('pwa.installation.steps.step1', 'Tap the install button below')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-xs">2</div>
                            <span>{t('pwa.installation.steps.step2', "Choose 'Add to Home Screen'")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-xs">3</div>
                            <span>{t('pwa.installation.steps.step3', 'Enjoy native app experience')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <motion.div className="flex-1">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="w-full h-12 gradient-bg text-white shadow-primary hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                      >
                      <motion.div
                        animate={{ 
                          rotate: pwaCapabilities.installMethod === 'beforeinstallprompt' ? [0, 360] : [0, 0] 
                        }}
                        transition={{ 
                          duration: pwaCapabilities.installMethod === 'beforeinstallprompt' ? 2 : 0, 
                          repeat: pwaCapabilities.installMethod === 'beforeinstallprompt' ? Infinity : 0, 
                          ease: "linear" 
                        }}
                        className="mr-2"
                      >
                        {React.createElement(getBrowserSpecificIcon(), { className: "h-4 w-4" })}
                        </motion.div>
                        {getInstallButtonText()}
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      trackInteraction();
                      setShowLearnMore(!showLearnMore);
                    }}
                    variant="ghost"
                    className="flex-1 h-10 text-xs hover:bg-accent/80"
                    size="sm"
                  >
                    {t('pwa.install.learnMore', 'Learn More')}
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    className="flex-1 h-10 text-xs hover:bg-accent/80"
                    size="sm"
                  >
                    {t('pwa.install.dismiss', 'Maybe Later')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom Gradient Bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}