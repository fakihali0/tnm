import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthGate } from '@/components/tnm-pro/AuthGate';
import { useIsMobile } from '@/hooks/use-mobile';
import { ImmersiveMobileLayout } from '@/components/tnm-pro/mobile/ImmersiveMobileLayout';
import { useAccountStore, useAuthStore } from '@/store/auth';
import { TranslationErrorBoundary } from '@/components/error/TranslationErrorBoundary';
import { useTranslationHealthMonitor } from '@/hooks/useTranslationHealthMonitor';
import { useTranslation } from 'react-i18next';
import { preloadRouteTranslations } from '@/i18n/dynamic-loader';
import { useTradingAlerts } from '@/hooks/useTradingAlerts';
import { useJournalData } from '@/hooks/useJournalData';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { EnhancedProfessionalSidebar } from '@/components/tnm-pro/EnhancedProfessionalSidebar';
import { FloatingAIButton } from '@/components/tnm-pro/FloatingAIButton';
import { AIChatDrawer } from '@/components/tnm-pro/AIChatDrawer';
import { TNMProRouter } from '@/components/tnm-pro/TNMProRouter';
import { useRTL } from '@/hooks/useRTL';

const TNMProContent = () => {
  const loadAccounts = useAccountStore(state => state.loadAccounts);

  // Initialize data loading
  useTradingAlerts();
  useJournalData();

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return <TNMProRouter mode="desktop" />;
};

const MobileTNMProContent = () => {
  return <TNMProRouter mode="mobile" />;
};

const TNMProApp: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const isLoading = useAuthStore(state => state.isLoading);
  const { healthStatus, runHealthCheck } = useTranslationHealthMonitor();
  const [appInitialized, setAppInitialized] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!healthStatus.isHealthy) {
          await runHealthCheck();
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn('App initialization warning:', error);
      } finally {
        setAppInitialized(true);
      }
    };

    if (!isLoading) {
      initializeApp();
    }
  }, [isLoading, healthStatus.isHealthy, runHealthCheck]);

  if (isLoading || !appInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getActiveSection = () => {
    const hash = location.hash.replace('#', '');
    return hash || 'ai-hub';
  };

  if (isMobile) {
    return (
      <ImmersiveMobileLayout>
        <MobileTNMProContent />
      </ImmersiveMobileLayout>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex bg-background" dir={rtl.dir}>
        <EnhancedProfessionalSidebar />
        <SidebarInset>
          <header className="h-16 flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ps-0 pe-3 gap-2 sticky top-0 z-40">
            <SidebarTrigger className="h-8 w-8 -ms-1" />
            
            <div className="flex items-center justify-between flex-1">
              <div>
                <h1 className="text-lg font-semibold text-foreground text-start">{t('common.aiIntelligence')}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Brain className="h-3 w-3" />
                  {t('sidebar.aiPowered')}
                </Badge>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            <TNMProContent />
          </main>
        </SidebarInset>
        <FloatingAIButton onClick={() => setAiDrawerOpen(true)} />
        <AIChatDrawer open={aiDrawerOpen} onOpenChange={setAiDrawerOpen} />
      </div>
    </SidebarProvider>
  );
};

// Translation preloader gate component
const TNMProTranslationGate = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const [translationsReady, setTranslationsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const language = i18n.language;

    const checkAndPreload = async () => {
      try {
        if (i18n.hasResourceBundle(language, 'tnm-ai')) {
          if (mounted) setTranslationsReady(true);
          return;
        }

        await preloadRouteTranslations('/tnm-ai', language);
        
        if (!i18n.hasResourceBundle(language, 'tnm-ai')) {
          const { loadTranslationNamespace } = await import('@/i18n/dynamic-loader');
          const tnmAiData = await loadTranslationNamespace('tnm-ai', language);
          i18n.addResourceBundle(language, 'tnm-ai', tnmAiData, true, true);
        }
        
        if (mounted) setTranslationsReady(true);
      } catch (error) {
        console.error('Failed to preload TNM AI translations:', error);
        if (language !== 'en') {
          try {
            await preloadRouteTranslations('/tnm-ai', 'en');
          } catch {}
        }
        if (mounted) setTranslationsReady(true);
      }
    };

    checkAndPreload();

    // Safety timeout - don't block indefinitely
    const timeout = setTimeout(() => {
      if (mounted) setTranslationsReady(true);
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [i18n]);

  if (!translationsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

const TNMAI: React.FC = () => {
  return (
    <TranslationErrorBoundary namespace="tnm-ai">
      <AuthGate>
        <TNMProTranslationGate>
          <TNMProApp />
        </TNMProTranslationGate>
      </AuthGate>
    </TranslationErrorBoundary>
  );
};

export default TNMAI;