import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { getLanguageFromPath } from '@/i18n';
import { StructuredData } from './StructuredData';

interface SEOHeadProps {
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

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  author,
  datePublished,
  dateModified,
  noIndex = false
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname) || 'en';
  
  const baseUrl = 'https://tradenmore.com';
  const currentUrl = `${baseUrl}${location.pathname}`;
  
  // Default values
  const defaultTitle = t('common:seo.title', "Trade'n More - A Broker On Your Side");
  const defaultDescription = t('common:seo.description', 'A broker on your side offering MT5, prop trading accounts, education, and comprehensive trading tools. Get funded and start trading today.');
  const defaultKeywords = t('common:seo.keywords', 'trading, forex, prop trading, get funded, MT5, trading education, financial markets');
  const defaultImage = 'https://storage.googleapis.com/gpt-engineer-file-uploads/5zFY2YF99yZIZ2fW8lCu080Kmv33/social-images/social-1757768019722-FACEBOOK COVER-05.jpg';
  
  const finalTitle = title ? `${title} | Trade'n More` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalImage = image || defaultImage;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDescription);
    }
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', finalKeywords);
    
    // Update robots meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);
    
    // Update hreflang tags
    const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflangs.forEach(link => link.remove());
    
    // Add hreflang for English
    const hreflangEn = document.createElement('link');
    hreflangEn.setAttribute('rel', 'alternate');
    hreflangEn.setAttribute('hreflang', 'en');
    hreflangEn.setAttribute('href', `${baseUrl}${location.pathname.replace('/ar', '')}`);
    document.head.appendChild(hreflangEn);
    
    // Add hreflang for Arabic
    const hreflangAr = document.createElement('link');
    hreflangAr.setAttribute('rel', 'alternate');
    hreflangAr.setAttribute('hreflang', 'ar');
    const arPath = location.pathname.startsWith('/ar') ? location.pathname : `/ar${location.pathname}`;
    hreflangAr.setAttribute('href', `${baseUrl}${arPath}`);
    document.head.appendChild(hreflangAr);
    
    // Add x-default hreflang
    const hreflangDefault = document.createElement('link');
    hreflangDefault.setAttribute('rel', 'alternate');
    hreflangDefault.setAttribute('hreflang', 'x-default');
    hreflangDefault.setAttribute('href', `${baseUrl}${location.pathname.replace('/ar', '')}`);
    document.head.appendChild(hreflangDefault);
    
    // Update Open Graph tags
    const updateMetaProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateMetaProperty('og:title', finalTitle);
    updateMetaProperty('og:description', finalDescription);
    updateMetaProperty('og:url', currentUrl);
    updateMetaProperty('og:type', type);
    updateMetaProperty('og:image', finalImage);
    updateMetaProperty('og:locale', currentLang === 'ar' ? 'ar_AR' : 'en_US');
    updateMetaProperty('og:site_name', "Trade'n More");
    
    // Update Twitter Card tags
    const updateTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateTwitterMeta('twitter:card', 'summary_large_image');
    updateTwitterMeta('twitter:title', finalTitle);
    updateTwitterMeta('twitter:description', finalDescription);
    updateTwitterMeta('twitter:image', finalImage);
    updateTwitterMeta('twitter:site', '@tradenmore');
    
    // Update language and direction
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    
  }, [finalTitle, finalDescription, finalKeywords, finalImage, currentUrl, currentLang, type, noIndex, location.pathname]);

  return (
    <>
      <StructuredData
        type={type === 'article' ? 'article' : 'website'}
        title={title}
        description={description}
        image={image}
        author={author}
        datePublished={datePublished}
        dateModified={dateModified}
      />
      <StructuredData type="organization" />
    </>
  );
};