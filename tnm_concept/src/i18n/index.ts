import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { 
  loadTranslationNamespaces, 
  getCachedTranslations, 
  TRANSLATION_NAMESPACES,
  getNamespacesForRoute,
  clearTranslationCache
} from './dynamic-loader';

// Import only core translations for initial load
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import arMissing from './locales/ar/missing-translations.json';

const fallbackLng = 'en' as const;
export const supportedLngs = ['en', 'ar'] as const;

type SupportedLanguage = (typeof supportedLngs)[number];

const normalizeLanguage = (language?: string): SupportedLanguage => {
  if (!language) {
    return fallbackLng;
  }

  const [base] = language.split('-');
  return supportedLngs.includes(base as SupportedLanguage) ? (base as SupportedLanguage) : fallbackLng;
};

// Enhanced resource loading with dynamic imports
export const loadLocaleResources = async (
  language: string, 
  namespaces?: string[]
): Promise<SupportedLanguage> => {
  const normalized = normalizeLanguage(language);

  // Use dynamic loader for additional namespaces
  if (namespaces && namespaces.length > 0) {
    const translations = await loadTranslationNamespaces(namespaces, normalized);
    
    Object.entries(translations).forEach(([ns, resources]) => {
      if (resources && Object.keys(resources).length > 0) {
        i18n.addResourceBundle(normalized, ns, resources, true, true);
      }
    });
  }

  return normalized;
};

// Timeout wrapper to prevent blocking
const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Translation load timeout')), timeoutMs)
    )
  ]);
};

export const ensureLanguage = async (
  language: string,
  routePath?: string
): Promise<SupportedLanguage> => {
  const normalized = normalizeLanguage(language);

  try {
    // Clear cache if switching languages to prevent stale translations
    if (i18n.language && i18n.language !== normalized) {
      clearTranslationCache(i18n.language);
    }

    // Load route-specific namespaces BEFORE changing language - with timeout
    if (routePath) {
      const requiredNamespaces = getNamespacesForRoute(routePath);
      await withTimeout(loadLocaleResources(normalized, requiredNamespaces));
    }

    // Now change language after translations are loaded - with timeout
    if (i18n.language !== normalized) {
      await withTimeout(i18n.changeLanguage(normalized));
    }
  } catch (error) {
    console.warn('Translation load failed, continuing with defaults:', error);
    // Don't block - just use whatever translations are available
  }

  return normalized;
};

let initializationPromise: Promise<SupportedLanguage> | null = null;

export const initializeI18n = async (): Promise<SupportedLanguage> => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (!i18n.isInitialized) {
      i18n
        .use(LanguageDetector)
        .use(initReactI18next);

  // Initialize with core translations only
  const coreResources = {
    en: { 
      common: enCommon
    },
    ar: { 
      common: {
        ...arCommon,
        ...arMissing // Merge missing translations
      }
    }
  };

      await i18n.init({
        fallbackLng,
        defaultNS: 'common',
        ns: ['common'],
        fallbackNS: 'common',
        supportedLngs: Array.from(supportedLngs),
        nonExplicitSupportedLngs: true,
        load: 'languageOnly',
        debug: import.meta.env.DEV,
        resources: coreResources,
        detection: {
          order: ['path', 'localStorage', 'navigator'],
          lookupFromPathIndex: 0,
          caches: ['localStorage']
        },
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });
    }

    const initialLanguage = i18n.language || fallbackLng;
    return ensureLanguage(initialLanguage);
  })();

  initializationPromise.catch(() => {
    initializationPromise = null;
  });

  return initializationPromise;
};

// Helper function to get localized path with enhanced robustness
export const getLocalizedPath = (
  path: string,
  language: string,
  search?: string,
  hash?: string
) => {
  try {
    // Handle edge cases for input validation
    if (!path || typeof path !== 'string') {
      path = '/';
    }
    
    if (!language || typeof language !== 'string') {
      language = 'en';
    }

    const normalizedInput = path.startsWith('/') ? path : `/${path}`;
    
    // Use URL constructor for robust parsing, but handle edge cases
    let url: URL;
    try {
      url = new URL(normalizedInput, 'http://localhost');
    } catch (error) {
      // Fallback for malformed URLs
      const cleanPath = normalizedInput.split('?')[0].split('#')[0];
      url = new URL(cleanPath || '/', 'http://localhost');
    }
    
    let { pathname } = url;
    
    // Handle search and hash with proper precedence
    const finalSearch = search !== undefined ? search : url.search;
    const finalHash = hash !== undefined ? hash : url.hash;
    
    // Normalize search parameter
    const normalizedSearch = finalSearch
      ? finalSearch.startsWith('?')
        ? finalSearch
        : `?${finalSearch}`
      : '';
    
    // Normalize hash parameter
    const normalizedHash = finalHash
      ? finalHash.startsWith('#')
        ? finalHash
        : `#${finalHash}`
      : '';

    // Remove any existing language prefix with enhanced logic
    if (pathname === '/ar' || pathname.startsWith('/ar/')) {
      pathname = pathname.slice(3) || '/';
    }

    // Ensure pathname starts with /
    if (!pathname.startsWith('/')) {
      pathname = `/${pathname}`;
    }

    let basePath = pathname;

    // Add language prefix for Arabic
    if (language === 'ar') {
      basePath = pathname === '/' ? '/ar' : `/ar${pathname}`;
    }

    const result = `${basePath}${normalizedSearch}${normalizedHash}`;
    
    // Development mode debugging
    if (import.meta.env.DEV && search !== undefined && hash !== undefined) {
      console.debug('getLocalizedPath:', {
        input: { path, language, search, hash },
        output: result,
        intermediate: { pathname, normalizedSearch, normalizedHash, basePath }
      });
    }

    return result;
  } catch (error) {
    // Graceful fallback for any unexpected errors
    if (process.env.NODE_ENV === 'development') {
      // Log error in development only
    }
    const fallbackPath = language === 'ar' ? '/ar' : '/';
    return fallbackPath;
  }
};

// Helper function to detect language from path
export const getLanguageFromPath = (pathname: string) => {
  return pathname.startsWith('/ar') ? 'ar' : 'en';
};

export default i18n;
