import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getLanguageFromPath, getLocalizedPath } from '@/i18n';

interface LocalizedPathOptions {
  hash?: string;
}

const normalizeHash = (hash?: string) => {
  if (!hash) {
    return '';
  }

  return hash.startsWith('#') ? hash : `#${hash}`;
};

export const useLocalizedPath = () => {
  const location = useLocation();
  const { i18n } = useTranslation();

  const currentLanguage = useMemo(() => {
    const detectedLanguage = getLanguageFromPath(location.pathname);
    if (detectedLanguage) {
      return detectedLanguage;
    }

    return i18n.language?.startsWith('ar') ? 'ar' : 'en';
  }, [location.pathname, i18n.language]);

  const localizePath = useCallback(
    (path: string, options: LocalizedPathOptions = {}) => {
      const { hash } = options;

      if (!path) {
        const localizedRoot = getLocalizedPath('/', currentLanguage);
        return `${localizedRoot}${normalizeHash(hash)}`;
      }

      let basePath = path;
      let hashFromPath: string | undefined;

      const hashIndex = path.indexOf('#');
      if (hashIndex !== -1) {
        basePath = path.slice(0, hashIndex);
        hashFromPath = path.slice(hashIndex + 1);
      }

      const normalizedBase = basePath || '/';
      const localizedBase = getLocalizedPath(normalizedBase, currentLanguage);
      const finalHash = normalizeHash(hash ?? hashFromPath);

      return `${localizedBase}${finalHash}`;
    },
    [currentLanguage]
  );

  return { currentLanguage, localizePath };
};

export type UseLocalizedPathReturn = ReturnType<typeof useLocalizedPath>;
