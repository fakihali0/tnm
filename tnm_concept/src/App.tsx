import React, { Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ScrollToHash } from "@/components/layout/ScrollToHash";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from '@/components/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from "framer-motion";

import { ensureLanguage, getLanguageFromPath } from '@/i18n';
import Index from "./pages/Index";
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { UpdateNotification } from '@/components/pwa/UpdateNotification';
import { 
  PageWithHeroSkeleton, 
  InstrumentsPageSkeleton, 
  FormPageSkeleton, 
  DashboardPageSkeleton,
  ContentPageSkeleton 
} from '@/components/ui/page-skeletons';

import { TranslationDebugger } from "@/components/dev/TranslationDebugger";
import { PerformanceDashboard } from "@/components/dev/PerformanceDashboard";
import { AnalyticsDashboard } from "@/components/dev/AnalyticsDashboard";
import { PostInstallOnboarding } from "@/components/pwa/PostInstallOnboarding";
import { CookieConsentManager } from "@/components/gdpr/CookieConsentManager";
import { useTranslationValidation } from '@/hooks/useTranslationValidation';
import { useTranslationReportLogger } from "@/components/dev/TranslationReport";
import { setupOfflineHandlers } from "@/utils/offline-queue";

// Lazy load non-critical pages to reduce initial bundle size
const Products = React.lazy(() => import("./pages/Products"));
const Education = React.lazy(() => import("./pages/Education"));
const GetFunded = React.lazy(() => import("./pages/GetFunded"));
const Partners = React.lazy(() => import("./pages/Partners"));
const Contact = React.lazy(() => import("./pages/Contact"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Privacy = React.lazy(() => import("./pages/legal/Privacy"));
const Terms = React.lazy(() => import("./pages/legal/Terms"));
const Cookies = React.lazy(() => import("./pages/legal/Cookies"));

// Lazy load product subpages
const TradingInstruments = React.lazy(() => import("./pages/products/TradingInstruments"));
const AccountTypes = React.lazy(() => import("./pages/products/AccountTypes"));
const Platforms = React.lazy(() => import("./pages/products/Platforms"));
const TradingTools = React.lazy(() => import("./pages/products/TradingTools"));
const RiskCalculator = React.lazy(() => import("./pages/products/RiskCalculator"));
const PaymentMethods = React.lazy(() => import("./pages/products/PaymentMethods"));

// Lazy load education subpages
const Webinars = React.lazy(() => import("./pages/education/Webinars"));
const Resources = React.lazy(() => import("./pages/education/Resources"));
const MarketReports = React.lazy(() => import("./pages/education/MarketReports"));
const Blogs = React.lazy(() => import("./pages/education/Blogs"));

// Lazy load TNM AI
const TNMAI = React.lazy(() => import("./pages/TNMAI"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));

// Component to handle language-based routing and direction
const AppContent = () => {
  const { t, i18n } = useTranslation('common');
  const { safeT } = useTranslationValidation();
  useTranslationReportLogger();
  const location = useLocation();

  const renderFallback = () => {
    const path = location.pathname.replace(/^\/ar/, ''); // Remove /ar prefix
    
    // Page-specific skeletons for better UX
    if (path.includes('/trading-instruments')) {
      return <InstrumentsPageSkeleton />;
    }
    
    if (path.includes('/contact')) {
      return <FormPageSkeleton />;
    }
    
    if (path.includes('/partners')) {
      return <FormPageSkeleton />;
    }
    
    if (path.includes('/tnm-ai') || path.includes('/tnm-pro')) {
      return <DashboardPageSkeleton />;
    }
    
    if (path.includes('/education') || path.includes('/get-funded')) {
      return <ContentPageSkeleton />;
    }
    
    // Default skeleton for other pages
    return <PageWithHeroSkeleton />;
  };
  
  useEffect(() => {
    const loadTranslationsAndSync = async () => {
      const expectedLanguage = getLanguageFromPath(location.pathname);

      // Update document attributes immediately
      document.documentElement.dir = expectedLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = expectedLanguage;

      // Update font classes
      if (expectedLanguage === 'ar') {
        document.body.classList.add('font-cairo');
        document.body.classList.remove('font-inter');
      } else {
        document.body.classList.add('font-inter');
        document.body.classList.remove('font-cairo');
      }

      // Clear cache if switching languages
      if (typeof window !== 'undefined') {
        const cachedLng = window.localStorage.getItem('i18nextLng');
        if (cachedLng && cachedLng !== expectedLanguage) {
          window.localStorage.setItem('i18nextLng', expectedLanguage);
        }
      }

      // Preload translations for this route BEFORE rendering
      try {
        await ensureLanguage(expectedLanguage, location.pathname);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to sync language', error);
        }
      }
    };

    loadTranslationsAndSync();
    
    // Add global loading timeout fallback
    const loadingTimeout = setTimeout(() => {
      const loadingElements = document.querySelectorAll('[data-loading="true"]');
      if (loadingElements.length > 0) {
        console.warn('Page load timeout - forcing display');
        loadingElements.forEach(el => el.removeAttribute('data-loading'));
      }
    }, 10000);

    return () => clearTimeout(loadingTimeout);
  }, [i18n, location.pathname]);

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Setup offline handlers
    setupOfflineHandlers();
    
    // Initialize conversion analytics
    import('@/services/conversion-analytics').then(({ conversionAnalytics }) => {
      conversionAnalytics.trackPWAMetrics();
    });
  }, []);

  const renderPage = (
    Component: React.ComponentType,
    { suspense = true }: { suspense?: boolean } = {}
  ) => {
    const content = <Component />;

    return suspense ? (
      <Suspense fallback={renderFallback()}>
        {content}
      </Suspense>
    ) : (
      content
    );
  };

  const createRoute = (path: string, Component: React.ComponentType) => [
    <Route key={path} path={path} element={renderPage(Component)} />,
    <Route key={`ar${path}`} path={`/ar${path}`} element={renderPage(Component)} />
  ];

  return (
    <>
      <AnimatePresence mode="wait" initial={!hasMounted}>
        <Routes location={location} key={`${location.pathname}${location.search}`}>
          <Route path="/" element={renderPage(Index, { suspense: false })} />
          <Route path="/ar" element={renderPage(Index, { suspense: false })} />
        {createRoute("/products", Products)}
            {createRoute("/products/risk-calculator", RiskCalculator)}
            {createRoute("/products/trading-instruments", TradingInstruments)}
            {createRoute("/products/account-types", AccountTypes)}
            {createRoute("/products/payment-methods", PaymentMethods)}
            {createRoute("/products/platforms", Platforms)}
            {createRoute("/products/trading-tools", TradingTools)}
        {createRoute("/education", Education)}
        {createRoute("/education/webinars", Webinars)}
        {createRoute("/education/resources", Resources)}
        {createRoute("/education/market-reports", MarketReports)}
        {createRoute("/education/blogs", Blogs)}
        {createRoute("/get-funded", GetFunded)}
        {createRoute("/partners", Partners)}
        {createRoute("/contact", Contact)}
        {createRoute("/tnm-ai", TNMAI)}
        {createRoute("/tnm-pro", TNMAI)}
        {createRoute("/reset-password", ResetPassword)}
        {createRoute("/auth/callback", AuthCallback)}
        {createRoute("/privacy", Privacy)}
        {createRoute("/terms", Terms)}
        {createRoute("/cookies", Cookies)}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={renderPage(NotFound)} />
        </Routes>
      </AnimatePresence>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Post-install onboarding */}
      <PostInstallOnboarding />
      
      {/* GDPR Cookie Consent */}
      <CookieConsentManager />
      
      {/* Debug panels for development */}
      {import.meta.env.DEV && (
        <>
          <TranslationDebugger />
          <PerformanceDashboard />
          <AnalyticsDashboard />
        </>
      )}
    </>
  );
};

const App = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Ensure React is fully ready before initializing ThemeProvider
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <OfflineIndicator />
            <UpdateNotification />
            <BrowserRouter>
              <ScrollToHash />
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;