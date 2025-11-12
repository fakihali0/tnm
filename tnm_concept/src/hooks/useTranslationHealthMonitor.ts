import { useEffect, useState } from 'react';
import { getTranslationCacheStats } from '@/i18n/dynamic-loader';

export interface TranslationHealthStatus {
  isHealthy: boolean;
  cacheStats: ReturnType<typeof getTranslationCacheStats>;
  lastHealthCheck: Date | null;
  errorCount: number;
}

export const useTranslationHealthMonitor = (language: string = 'en') => {
  const [healthStatus, setHealthStatus] = useState<TranslationHealthStatus>({
    isHealthy: true,
    cacheStats: getTranslationCacheStats(),
    lastHealthCheck: null,
    errorCount: 0
  });

  const runHealthCheck = async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { checkTranslationHealth } = await import('@/i18n/dynamic-loader');
      const isHealthy = await checkTranslationHealth(language);
      const cacheStats = getTranslationCacheStats();
      
      setHealthStatus(prev => ({
        isHealthy,
        cacheStats,
        lastHealthCheck: new Date(),
        errorCount: isHealthy ? 0 : prev.errorCount + 1
      }));

      return isHealthy;
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus(prev => ({
        ...prev,
        isHealthy: false,
        lastHealthCheck: new Date(),
        errorCount: prev.errorCount + 1
      }));
      return false;
    }
  };

  useEffect(() => {
    // Initial health check
    runHealthCheck();

    // Periodic health checks every 5 minutes
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [language]);

  return {
    healthStatus,
    runHealthCheck,
    refreshStats: () => setHealthStatus(prev => ({
      ...prev,
      cacheStats: getTranslationCacheStats()
    }))
  };
};