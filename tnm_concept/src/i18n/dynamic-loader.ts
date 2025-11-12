/**
 * Dynamic translation loading system to reduce initial bundle size
 * Implements lazy loading with caching and fallback strategies
 */

import { Resource } from 'i18next';

// Enhanced cache and loading state management with cleanup
const translationCache = new Map<string, any>();
const loadingStates = new Map<string, Promise<any>>();
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Cleanup utility for stuck loading states
const cleanupStuckLoadingStates = () => {
  const now = Date.now();
  const timeout = 30000; // 30 seconds
  
  for (const [key, promise] of loadingStates.entries()) {
    // Check if promise has been pending too long
    Promise.race([
      promise,
      new Promise(resolve => setTimeout(resolve, timeout))
    ]).finally(() => {
      if (loadingStates.get(key) === promise) {
        loadingStates.delete(key);
      }
    });
  }
};

// Build a static map of all translation JSON files using Vite's import.meta.glob
const translationModules = import.meta.glob('./locales/*/*.json', { eager: false });

// In development, log available translation files once for easier debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  if (!(window as any).__i18nAvailableModulesLogged__) {
    (window as any).__i18nAvailableModulesLogged__ = true;
    console.debug('[i18n] Available translation modules:', Object.keys(translationModules));
  }
}

// Core translations that should be loaded immediately
const CORE_TRANSLATIONS = ['common', 'navigation', 'auth', 'errors'];

// Translation namespaces organized by feature/page
export const TRANSLATION_NAMESPACES = {
  // Core - always loaded
  core: ['common', 'navigation', 'auth', 'errors'],
  
  // Home page
  home: ['hero', 'features', 'testimonials', 'cta'],
  
  // Products
  products: ['instruments', 'accounts', 'platforms', 'tools', 'payments', 'risk-calculator'],
  
  // Education
  education: ['education', 'courses', 'webinars', 'resources', 'blog', 'market-reports'],
  
  // Trading
  trading: ['charts', 'orders', 'portfolio', 'analytics'],
  
  // TNM Pro / TNM AI
  tnmPro: ['tnm-pro'],
  tnmAi: ['tnm-ai'],
  
  // Legal
  legal: ['terms', 'privacy', 'cookies', 'compliance'],
  
  // Support
  support: ['contact', 'getfunded', 'faq', 'help', 'feedback']
} as const;

// Route to namespace mapping
export const ROUTE_NAMESPACES: Record<string, keyof typeof TRANSLATION_NAMESPACES> = {
  '/': 'home',
  '/products': 'products',
  '/products/trading-instruments': 'products',
  '/products/account-types': 'products',
  '/products/platforms': 'products',
  '/products/trading-tools': 'products',
  '/products/payment-methods': 'products',
  '/products/risk-calculator': 'products',
  '/education': 'education',
  '/education/webinars': 'education',
  '/education/resources': 'education',
  '/education/blogs': 'education',
  '/education/market-reports': 'education',
  '/get-funded': 'support', // Use support namespace which includes getfunded
  '/partners': 'support',
  '/contact': 'support', // Use support namespace which includes contact
  '/tnm-pro': 'tnmAi',
  '/tnm-ai': 'tnmAi',
  '/reset-password': 'tnmAi',
  '/terms': 'legal',
  '/privacy': 'legal',
  '/cookies': 'legal'
};

/**
 * Get the cache key for a translation namespace and language
 */
function getCacheKey(namespace: string, language: string): string {
  return `${language}:${namespace}`;
}

/**
 * Enhanced translation namespace loading with deduplication and cleanup
 */
export async function loadTranslationNamespace(
  namespace: string,
  language: string
): Promise<any> {
  const cacheKey = getCacheKey(namespace, language);
  
  // Return cached version if available
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey);
    return cached !== null && cached !== undefined ? cached : {};
  }
  
  // Check for recent failures and implement backoff
  const failureInfo = failedAttempts.get(cacheKey);
  if (failureInfo && failureInfo.count >= 3) {
    const timeSinceLastAttempt = Date.now() - failureInfo.lastAttempt;
    const backoffTime = Math.min(60000 * Math.pow(2, failureInfo.count - 3), 300000); // Max 5 minutes
    
    if (timeSinceLastAttempt < backoffTime) {
      console.log(`Skipping ${namespace}:${language} due to recent failures, trying again in ${Math.round((backoffTime - timeSinceLastAttempt) / 1000)}s`);
      return {}; // Return empty object to prevent errors
    }
  }
  
  // Return existing loading promise if already in progress (deduplication)
  if (loadingStates.has(cacheKey)) {
    try {
      return await loadingStates.get(cacheKey);
    } catch (error) {
      // If the shared promise fails, we'll retry below
      loadingStates.delete(cacheKey);
    }
  }
  
  // Start loading with timeout protection
  const loadingPromise = Promise.race([
    loadNamespaceFile(namespace, language),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Loading timeout')), 15000))
  ]);
  
  // Store the loading promise for deduplication
  loadingStates.set(cacheKey, loadingPromise);
  
  try {
    const translations = await loadingPromise;
    
    // Ensure we don't cache null or undefined values
    const safeTranslations = translations !== null && translations !== undefined ? translations : {};
    translationCache.set(cacheKey, safeTranslations);
    
    // Clear any failure history on success
    failedAttempts.delete(cacheKey);
    
    return safeTranslations;
    
  } catch (error) {
    console.error(`Failed to load translation for ${namespace}:${language}:`, error);
    
    // Track failure for backoff
    const currentFailures = failedAttempts.get(cacheKey) || { count: 0, lastAttempt: 0 };
    failedAttempts.set(cacheKey, {
      count: currentFailures.count + 1,
      lastAttempt: Date.now()
    });
    
    // Return empty object instead of throwing to prevent app crashes
    return {};
  } finally {
    // Clean up loading state
    loadingStates.delete(cacheKey);
  }
}

/**
 * Enhanced file loading with robust error handling and retries
 */
async function loadNamespaceFile(namespace: string, language: string, retryCount = 0): Promise<any> {
  const maxRetries = 3;
  const retryDelay = Math.min(500 * Math.pow(2, retryCount), 3000); // Exponential backoff

  const key = `./locales/${language}/${namespace}.json`;
  const importers = translationModules as Record<string, () => Promise<any>>;
  const loader = importers[key];

  const importWithTimeout = async (fn: () => Promise<any>) => {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Import timeout')), 10000))
    ]);
  };

  try {
    if (import.meta.env.DEV) {
      console.log(`Loading namespace: ${namespace} for language: ${language} (attempt ${retryCount + 1})`);
    }

    if (!loader) {
      console.warn(`[i18n] Translation file not found: ${key}`);
      // Directly attempt English fallback if current language is not English
      if (language !== 'en') {
        const enKey = `./locales/en/${namespace}.json`;
        const enLoader = importers[enKey];
        if (enLoader) {
          const enModule: any = await importWithTimeout(enLoader);
          const enData = enModule?.default ?? enModule;
          if (enData && typeof enData === 'object') return enData;
        }
      }
      return {};
    }

    const module: any = await importWithTimeout(loader);
    const data = module?.default ?? module; // Some bundlers return JSON directly, others under .default

    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid translation data for ${namespace}:${language}`);
    }

    if (import.meta.env.DEV && namespace === 'tnm-pro') {
      console.log(`Successfully loaded tnm-pro for ${language} from ${key}`);
    }
    return data;

  } catch (error) {
    console.warn(`Failed to load namespace ${namespace} for ${language} (attempt ${retryCount + 1}):`, error);

    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return loadNamespaceFile(namespace, language, retryCount + 1);
    }

    // Final fallback: try English namespace once
    if (language !== 'en') {
      try {
        const enKey = `./locales/en/${namespace}.json`;
        const enLoader = importers[enKey];
        if (enLoader) {
          const enModule: any = await importWithTimeout(enLoader);
          const enData = enModule?.default ?? enModule;
          if (enData && typeof enData === 'object') {
            console.warn(`[i18n] Falling back to English for ${namespace}`);
            return enData;
          }
        }
      } catch (e) {
        console.warn(`[i18n] English fallback failed for ${namespace}:`, e);
      }
    }

    // Optional: try to provide minimal structure using common namespace
    if (namespace !== 'common') {
      try {
        const commonKey = `./locales/${language}/common.json`;
        const commonLoader = importers[commonKey];
        if (commonLoader) {
          const commonModule: any = await importWithTimeout(commonLoader);
          const commonData = commonModule?.default ?? commonModule;
          return { [namespace]: commonData };
        }
      } catch (_) {}
    }

    console.error(`All loading attempts failed for ${namespace}:${language}, returning empty object`);
    return {};
  }
}

/**
 * Load multiple namespaces in parallel
 */
export async function loadTranslationNamespaces(
  namespaces: string[],
  language: string
): Promise<Record<string, any>> {
  const promises = namespaces.map(ns => 
    loadTranslationNamespace(ns, language).then(data => ({ [ns]: data }))
  );
  
  const results = await Promise.allSettled(promises);
  const translations: Record<string, any> = {};
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      Object.assign(translations, result.value);
    } else {
      console.error(`Failed to load namespace ${namespaces[index]}:`, result.reason);
    }
  });
  
  return translations;
}

/**
 * Get required namespaces for a specific route
 */
export function getNamespacesForRoute(pathname: string): string[] {
  // Remove language prefix and normalize path
  const cleanPath = pathname.replace(/^\/ar/, '').replace(/\/$/, '') || '/';
  
  // Get specific namespaces for this route
  const routeNamespace = ROUTE_NAMESPACES[cleanPath];
  const specificNamespaces = routeNamespace ? TRANSLATION_NAMESPACES[routeNamespace] : [];
  
  // Always include core namespaces
  return [...TRANSLATION_NAMESPACES.core, ...specificNamespaces];
}

/**
 * Preload translations for a route
 */
export async function preloadRouteTranslations(
  pathname: string,
  language: string
): Promise<void> {
  const namespaces = getNamespacesForRoute(pathname);
  await loadTranslationNamespaces(namespaces, language);
}

/**
 * Get all currently cached translations for a language
 */
export function getCachedTranslations(language: string): Record<string, any> {
  const translations: Record<string, any> = {};
  
  for (const [cacheKey, data] of translationCache.entries()) {
    const [lang, namespace] = cacheKey.split(':');
    if (lang === language) {
      translations[namespace] = data;
    }
  }
  
  return translations;
}

/**
 * Clear translation cache (useful for language switching)
 */
export function clearTranslationCache(language?: string): void {
  if (language) {
    // Clear cache for specific language
    for (const cacheKey of translationCache.keys()) {
      if (cacheKey.startsWith(`${language}:`)) {
        translationCache.delete(cacheKey);
      }
    }
  } else {
    // Clear all cache
    translationCache.clear();
  }
  loadingStates.clear();
}

/**
 * Enhanced translation cache statistics and health monitoring
 */
export function getTranslationCacheStats() {
  return {
    cached: translationCache.size,
    loading: loadingStates.size,
    failed: failedAttempts.size,
    cacheKeys: Array.from(translationCache.keys()),
    loadingKeys: Array.from(loadingStates.keys()),
    failedKeys: Array.from(failedAttempts.keys())
  };
}

/**
 * Health check for translation system
 */
export async function checkTranslationHealth(language: string = 'en'): Promise<boolean> {
  try {
    // Test loading a core namespace
    const testResult = await loadTranslationNamespace('common', language);
    return testResult && typeof testResult === 'object';
  } catch (error) {
    console.error('Translation health check failed:', error);
    return false;
  }
}

// Initialize cleanup interval
if (typeof window !== 'undefined') {
  setInterval(cleanupStuckLoadingStates, 60000); // Run every minute
}