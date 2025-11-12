import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslationValidationOptions {
  enableLogging?: boolean;
  fallbackLanguage?: string;
}

interface ValidatedTranslation {
  text: string;
  isValid: boolean;
  key: string;
  fallbackUsed?: boolean;
}

export const useTranslationValidation = (options: TranslationValidationOptions = {}) => {
  const { t, i18n } = useTranslation();
  const { enableLogging = process.env.NODE_ENV === 'development', fallbackLanguage = 'en' } = options;

  const validateTranslation = useCallback(
    (key: string, defaultValue?: string, interpolationObject?: Record<string, any>): ValidatedTranslation => {
      try {
        // Get the translation
        const translation = t(key, { defaultValue, ...interpolationObject });
        
        // Check if translation exists and is not just the key returned
        const isValid = translation !== key && translation !== defaultValue;
        
        if (!isValid && enableLogging && process.env.NODE_ENV === 'development') {
          // Translation missing for key
        }

        // If translation is invalid and we have a fallback language, try that
        let fallbackUsed = false;
        let finalText = translation;
        
        if (!isValid && i18n.language !== fallbackLanguage) {
          // Try to get translation from fallback language
          const fallbackText = i18n.getFixedT(fallbackLanguage)(key, defaultValue);
          if (fallbackText !== key) {
            finalText = fallbackText;
            fallbackUsed = true;
            if (enableLogging) {
              console.info(`Using fallback translation for key: ${key}`);
            }
          }
        }

        // If still no valid translation, use the default value or key
        if (finalText === key && defaultValue) {
          finalText = defaultValue;
        }

        return {
          text: finalText,
          isValid: isValid || fallbackUsed,
          key,
          fallbackUsed
        };
      } catch (error) {
        if (enableLogging && process.env.NODE_ENV === 'development') {
          // Error getting translation for key
        }
        
        return {
          text: defaultValue || key,
          isValid: false,
          key
        };
      }
    },
    [t, i18n, enableLogging, fallbackLanguage]
  );

  const safeT = useCallback(
    (key: string, defaultValue?: string, interpolationObject?: Record<string, any>): string => {
      const validation = validateTranslation(key, defaultValue, interpolationObject);
      return validation.text;
    },
    [validateTranslation]
  );

  const getTranslationStatus = useCallback(
    (keys: string[]): { valid: string[]; missing: string[]; total: number } => {
      const valid: string[] = [];
      const missing: string[] = [];

      keys.forEach(key => {
        const validation = validateTranslation(key);
        if (validation.isValid) {
          valid.push(key);
        } else {
          missing.push(key);
        }
      });

      return {
        valid,
        missing,
        total: keys.length
      };
    },
    [validateTranslation]
  );

  return {
    validateTranslation,
    safeT,
    getTranslationStatus,
    currentLanguage: i18n.language,
    isReady: i18n.isInitialized
  };
};

// Hook specifically for accessibility translations with better defaults
export const useAccessibilityTranslation = () => {
  const { safeT } = useTranslationValidation();

  const getAccessibilityLabel = useCallback(
    (key: string, fallback: string) => {
      return safeT(`common:accessibility.${key}`, fallback);
    },
    [safeT]
  );

  return {
    getAccessibilityLabel,
    skipToContent: () => getAccessibilityLabel('skipToContent', 'Skip to main content'),
    closeMenu: () => getAccessibilityLabel('closeMenu', 'Close menu'),
    openMenu: () => getAccessibilityLabel('openMenu', 'Open menu'),
    loading: () => getAccessibilityLabel('loading', 'Loading content, please wait'),
    error: () => getAccessibilityLabel('error', 'An error occurred')
  };
};

export type UseTranslationValidationReturn = ReturnType<typeof useTranslationValidation>;
export type UseAccessibilityTranslationReturn = ReturnType<typeof useAccessibilityTranslation>;