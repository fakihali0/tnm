import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface AnnouncementOptions {
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export function useAccessibilityAnnouncements() {
  const { t } = useTranslation('tnm-ai');
  const announcementRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((message: string, options: AnnouncementOptions = {}) => {
    const { priority = 'polite', delay = 0 } = options;

    // Create announcement element if it doesn't exist
    if (!announcementRef.current) {
      const element = document.createElement('div');
      element.setAttribute('aria-live', priority);
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      element.id = 'accessibility-announcements';
      document.body.appendChild(element);
      announcementRef.current = element;
    }

    // Clear previous announcement and set new one
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
        // Use another timeout to ensure screen readers pick up the change
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = message;
          }
        }, 10);
      }
    }, delay);
  }, []);

  const announceNavigation = useCallback((destination: string) => {
    announce(t('common.loading') + ' ' + destination);
  }, [announce, t]);

  const announceError = useCallback((error: string) => {
    announce(t('errors.somethingWentWrong') + ': ' + error, { priority: 'assertive' });
  }, [announce, t]);

  const announceSuccess = useCallback((message: string) => {
    announce(t('common.success') + ': ' + message);
  }, [announce, t]);

  const announceLoading = useCallback((context?: string) => {
    const loadingMessage = context 
      ? t('common.loading') + ' ' + context
      : t('common.loading');
    announce(loadingMessage);
  }, [announce, t]);

  return {
    announce,
    announceNavigation,
    announceError,
    announceSuccess,
    announceLoading
  };
}