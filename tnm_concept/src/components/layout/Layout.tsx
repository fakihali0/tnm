import { useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion } from "framer-motion";
import { Header } from "./Header";
import Footer from "./Footer";
import { SkipToContent } from "./SkipToContent";
import { ensureLanguage, getLanguageFromPath } from '@/i18n';
import { usePageMotion } from "@/components/animation/PageTransition";
import { useAnalytics } from "@/services/analytics";

let hasLayoutMotionCommitted = false;

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  author?: string;
  datePublished?: string;
  dateModified?: string;
  noIndex?: boolean;
}

export function Layout({ 
  children, 
  title, 
  description, 
  keywords,
  image,
  type = 'website',
  author,
  datePublished,
  dateModified,
  noIndex = false
}: LayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname);
  const { variants, transition, states } = usePageMotion();
  const initialMotionStateRef = useRef(
    hasLayoutMotionCommitted ? states.initial : states.animate,
  );

  useEffect(() => {
    if (hasLayoutMotionCommitted) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      hasLayoutMotionCommitted = true;
    });

    return () => cancelAnimationFrame(frame);
  }, []);
  const { trackPageView } = useAnalytics();
  
  // Sync language with URL on route change and update document attributes
  useEffect(() => {
    void ensureLanguage(currentLang).catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to ensure language resources', error);
      }
    });
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('i18nextLng', currentLang);
    }
  }, [currentLang, i18n]);
  useEffect(() => {
    // Update meta tags for current page
    const pageTitle = title || t('meta.title', 'Trade\'n More - A Broker On Your Side');
    const pageDescription = description || t('meta.description', 'A broker on your side offering MT5, prop trading accounts, education, and comprehensive trading tools.');
    
    document.title = pageTitle;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', pageDescription);
    }
    
    // Add hreflang tags for SEO
    const existingHreflang = document.querySelectorAll('link[hreflang]');
    existingHreflang.forEach(link => link.remove());
    
    // Get current path without language prefix
    const basePath = location.pathname.startsWith('/ar') ? location.pathname.slice(3) || '/' : location.pathname;
    
    // Add hreflang for English
    const enLink = document.createElement('link');
    enLink.rel = 'alternate';
    enLink.hreflang = 'en';
    enLink.href = `${window.location.origin}${basePath}`;
    document.head.appendChild(enLink);
    
    // Add hreflang for Arabic
    const arLink = document.createElement('link');
    arLink.rel = 'alternate';
    arLink.hreflang = 'ar';
    arLink.href = `${window.location.origin}/ar${basePath}`;
    document.head.appendChild(arLink);
    
    // Add x-default hreflang (defaults to English)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${window.location.origin}${basePath}`;
    document.head.appendChild(defaultLink);
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}${location.pathname}`);
    
    // Track page view for analytics
    trackPageView({
      page: location.pathname,
      title: pageTitle,
      language: currentLang
    });
    
  }, [location.pathname, title, description, t, trackPageView, currentLang]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to content link for accessibility */}
      <SkipToContent />
      <Header />
      <motion.main
        id="main-content"
        className="flex-1 focus:outline-none"
        tabIndex={-1}
        variants={variants}
        transition={transition}
        initial={initialMotionStateRef.current}
        animate={states.animate}
        exit={states.exit}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}