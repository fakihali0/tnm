import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslationStats {
  language: string;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completeness: number;
}

// This would ideally be generated from your actual translation files
const EXPECTED_TRANSLATION_KEYS = [
  // Navigation
  'common:navigation.openMenu',
  'common:navigation.closeMenu',
  
  // Loading states
  'common:loading.page',
  'common:loading.content',
  'common:loading.economicCalendar',
  'common:loading.forexRates',
  'common:loading.stockHeatmap',
  'common:loading.marketData',
  'common:loading.instruments',
  'common:loading.paymentMethods',
  'common:loading.tradingView',
  'common:loading.chart',
  'common:loading.data',
  
  // Accessibility
  'common:accessibility.skipToContent',
  'common:accessibility.loadingPage',
  'common:accessibility.closeMenu',
  'common:accessibility.openMenu',
  'common:accessibility.mainNavigation',
  'common:accessibility.footerNavigation',
  'common:accessibility.loading',
  'common:accessibility.error',
  
  // Errors
  'common:errors.translationMissing',
  'common:errors.loadingFailed',
  'common:errors.networkError',
  'common:errors.tryAgain',
  'common:errors.contactSupport',
  
  // Common terms
  'common:common.language',
  'common:common.loading',
  'common:common.error',
  'common:common.success',
  'common:common.warning',
  'common:common.info',
  'common:common.close',
  'common:common.open',
  'common:common.save',
  'common:common.cancel',
  'common:common.confirm',
  'common:common.back',
  'common:common.next',
  'common:common.previous'
];

export const useTranslationReport = () => {
  const { i18n, t } = useTranslation();
  const [stats, setStats] = useState<TranslationStats[]>([]);

  useEffect(() => {
    const generateReport = () => {
      const languages = ['en', 'ar'];
      const reports: TranslationStats[] = [];

      languages.forEach(lang => {
        const missingKeys: string[] = [];
        let translatedCount = 0;

        EXPECTED_TRANSLATION_KEYS.forEach(key => {
          try {
            // Get fixed translation for specific language
            const translation = i18n.getFixedT(lang)(key, '__MISSING__');
            
            if (translation === '__MISSING__' || translation === key) {
              missingKeys.push(key);
            } else {
              translatedCount++;
            }
          } catch (error) {
            missingKeys.push(key);
          }
        });

        const totalKeys = EXPECTED_TRANSLATION_KEYS.length;
        const completeness = Math.round((translatedCount / totalKeys) * 100);

        reports.push({
          language: lang,
          totalKeys,
          translatedKeys: translatedCount,
          missingKeys,
          completeness
        });
      });

      setStats(reports);
    };

    if (i18n.isInitialized) {
      generateReport();
    }
  }, [i18n, i18n.isInitialized]);

  return { stats, isReady: i18n.isInitialized };
};

// Console logger for translation completeness (development only)
export const useTranslationReportLogger = (): void => {
  // This would be called once on app startup to log translation status
  const { i18n } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (!i18n.isInitialized) return;

    const languages = ['en', 'ar'];
    console.group('🌐 Translation Completeness Report');
    
    languages.forEach(lang => {
      let missing = 0;
      let total = 0;
      const missingKeys: string[] = [];

      EXPECTED_TRANSLATION_KEYS.forEach(key => {
        total++;
        try {
          const translation = i18n.getFixedT(lang)(key, '__MISSING__');
          if (translation === '__MISSING__' || translation === key) {
            missing++;
            missingKeys.push(key);
          }
        } catch {
          missing++;
          missingKeys.push(key);
        }
      });

      const completeness = Math.round(((total - missing) / total) * 100);
      const status = completeness >= 95 ? '✅' : completeness >= 80 ? '⚠️' : '❌';
      
      console.group(`${status} ${lang.toUpperCase()}: ${completeness}% (${total - missing}/${total})`);
      
      if (missingKeys.length > 0 && process.env.NODE_ENV === 'development') {
        // Only log in development
      }
      
      console.groupEnd();
    });

    console.groupEnd();
  }, [i18n, i18n.isInitialized]);
};