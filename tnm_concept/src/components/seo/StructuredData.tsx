import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { getLanguageFromPath } from '@/i18n';

declare global {
  interface Window {
    addStructuredData: (data: any) => void;
  }
}

interface StructuredDataProps {
  type?: 'organization' | 'website' | 'breadcrumb' | 'article';
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  type = 'website',
  title,
  description,
  image,
  author,
  datePublished,
  dateModified
}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname) || 'en';
  
  const baseUrl = 'https://tradenmore.com';
  const currentUrl = `${baseUrl}${location.pathname}`;
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Trade'n More",
    "description": t('common:seo.organizationDescription', 'A broker on your side offering MT5, prop trading accounts, education, and comprehensive trading tools.'),
    "url": baseUrl,
    "logo": `${baseUrl}/og-image.webp`,
    "image": `${baseUrl}/apple-touch-icon.png`,
    "sameAs": [
      // Add social media URLs when available
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+961-3-794-185",
      "contactType": "customer service",
      "availableLanguage": ["English", "Arabic"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "LB"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": title || "Trade'n More",
    "description": description || t('common:seo.defaultDescription', 'A broker on your side offering MT5, prop trading accounts, education, and comprehensive trading tools.'),
    "url": currentUrl,
    "inLanguage": currentLang,
    "publisher": {
      "@type": "Organization",
      "name": "Trade'n More",
      "logo": `${baseUrl}/og-image.webp`
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "author": {
      "@type": "Person",
      "name": author || "Trade'n More"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Trade'n More",
      "logo": `${baseUrl}/og-image.webp`
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    }
  };

  const getSchema = () => {
    switch (type) {
      case 'organization':
        return organizationSchema;
      case 'breadcrumb':
        return breadcrumbSchema;
      case 'article':
        return articleSchema;
      default:
        return websiteSchema;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.addStructuredData) {
      window.addStructuredData(getSchema());
    }
  }, []);

  return null;
};