import { useCallback } from 'react';
import { useTranslationValidation } from './useTranslationValidation';

export const useLoadingTranslations = () => {
  const { safeT } = useTranslationValidation();

  const getLoadingMessage = useCallback(
    (context?: string) => {
      if (!context) {
        return safeT('common:loading.content', 'Loading content...');
      }

      // Map specific contexts to translation keys
      const loadingMessages: Record<string, string> = {
        page: safeT('common:loading.page', 'Loading page...'),
        economicCalendar: safeT('common:loading.economicCalendar', 'Loading economic calendar...'),
        forexRates: safeT('common:loading.forexRates', 'Loading forex rates...'),
        stockHeatmap: safeT('common:loading.stockHeatmap', 'Loading stock heatmap...'),
        marketData: safeT('common:loading.marketData', 'Loading market data...'),
        instruments: safeT('common:loading.instruments', 'Loading instruments...'),
        paymentMethods: safeT('common:loading.paymentMethods', 'Loading payment methods...'),
        tradingView: safeT('common:loading.tradingView', 'Loading TradingView widget...'),
        chart: safeT('common:loading.chart', 'Loading chart...'),
        data: safeT('common:loading.data', 'Loading data...'),
        content: safeT('common:loading.content', 'Loading content...')
      };

      return loadingMessages[context] || safeT('common:loading.content', 'Loading content...');
    },
    [safeT]
  );

  const getErrorMessage = useCallback(
    (context?: string) => {
      if (!context) {
        return safeT('common:errors.loadingFailed', 'Failed to load content');
      }

      const errorMessages: Record<string, string> = {
        network: safeT('common:errors.networkError', 'Network connection error'),
        translation: safeT('common:errors.translationMissing', 'Translation missing'),
        general: safeT('common:errors.loadingFailed', 'Failed to load content')
      };

      return errorMessages[context] || safeT('common:errors.loadingFailed', 'Failed to load content');
    },
    [safeT]
  );

  return {
    getLoadingMessage,
    getErrorMessage,
    // Convenience methods for common loading states
    pageLoading: () => getLoadingMessage('page'),
    dataLoading: () => getLoadingMessage('data'),
    chartLoading: () => getLoadingMessage('chart'),
    tradingViewLoading: () => getLoadingMessage('tradingView'),
    instrumentsLoading: () => getLoadingMessage('instruments'),
    paymentMethodsLoading: () => getLoadingMessage('paymentMethods'),
    economicCalendarLoading: () => getLoadingMessage('economicCalendar'),
    forexRatesLoading: () => getLoadingMessage('forexRates'),
    stockHeatmapLoading: () => getLoadingMessage('stockHeatmap'),
    marketDataLoading: () => getLoadingMessage('marketData'),
    // Error methods
    networkError: () => getErrorMessage('network'),
    generalError: () => getErrorMessage('general')
  };
};

export type UseLoadingTranslationsReturn = ReturnType<typeof useLoadingTranslations>;