import i18n, { getLocalizedPath } from '@/i18n';
import { getScrollBehavior } from '@/utils/scroll';

const WHATSAPP_BASE_URL = 'https://wa.me/9613794185';
const WHATSAPP_MESSAGE_KEY = 'contact.whatsappMessage';

const buildWhatsAppUrl = () => {
  const message = i18n.t(WHATSAPP_MESSAGE_KEY, { ns: 'common' });
  if (!message || message === WHATSAPP_MESSAGE_KEY) {
    return WHATSAPP_BASE_URL;
  }

  const encodedMessage = encodeURIComponent(message);
  return `${WHATSAPP_BASE_URL}?text=${encodedMessage}`;
};

export const AUTH_URLS = {
  REGISTRATION: 'https://portal.bbcorp.trade/auth/jwt/sign-up/partner/7Ws3KC',
  LOGIN: 'https://portal.bbcorp.trade/auth/jwt/sign-in/?returnTo=%2Fdashboard%2Fib',
  DEMO: 'https://portal.bbcorp.trade/auth/jwt/sign-up/partner/7Ws3KC',
  FUNDING: 'https://portal.connectfunded.com/register/trader?link_id=cyflx215&referrer_id=qfb69mpt',
  WHATSAPP: WHATSAPP_BASE_URL,
  MT5_WINDOWS: 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe',
  MT5_MACOS: 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/MetaTrader5.dmg',
  MT5_IOS: 'https://apps.apple.com/app/metatrader-5/id413251709',
  MT5_ANDROID: 'https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5'
} as const;

export const SUPPORT_LINKS = {
  CONSULTATION: 'https://calendly.com/tradenmore/support-consultation',
  STATUS_PAGE: 'https://status.tradenmore.com',
  LIVE_WEBINAR: 'https://events.tradenmore.com/live-support-webinar'
} as const;

interface AnalyticsData {
  buttonType: string;
  buttonLocation: string;
  userAgent?: string;
  referrer?: string;
}

interface StoredAnalyticsData extends AnalyticsData {
  timestamp: string;
}

const inMemoryClicks: StoredAnalyticsData[] = [];

const normalizeHash = (hash?: string) => {
  if (!hash) {
    return '';
  }

  return hash.startsWith('#') ? hash : `#${hash}`;
};

const getUserAgent = () => {
  try {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
  } catch (error) {
    // Unable to read navigator information for analytics
  }
  return undefined;
};

export const trackButtonClick = (data: AnalyticsData) => {
  // Simple analytics tracking - could be enhanced with proper analytics service
  if (process.env.NODE_ENV === 'development') {
    // Button click analytics data captured
  }

  const storedData: StoredAnalyticsData = {
    ...data,
    timestamp: new Date().toISOString(),
    userAgent: data.userAgent ?? getUserAgent(),
    referrer: data.referrer ?? (typeof document !== 'undefined' ? document.referrer : undefined)
  };

  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available in this environment.');
    }

    const storedClicksRaw = localStorage.getItem('buttonClicks');
    const parsedClicks: unknown = storedClicksRaw ? JSON.parse(storedClicksRaw) : [];

    if (!Array.isArray(parsedClicks)) {
      throw new Error('Stored analytics data is not an array.');
    }

    const clicks = parsedClicks as StoredAnalyticsData[];
    clicks.push(storedData);
    localStorage.setItem('buttonClicks', JSON.stringify(clicks));
    return;
  } catch (error) {
    // Unable to persist to localStorage, falling back to in-memory store
    inMemoryClicks.push(storedData);
  }
};

export const __analyticsTestUtils = {
  getInMemoryClicks: () => [...inMemoryClicks],
  resetInMemoryClicks: () => {
    inMemoryClicks.length = 0;
  }
};

export const redirectToAuth = (url: string, buttonType: string, buttonLocation: string) => {
  trackButtonClick({ buttonType, buttonLocation });
  const targetUrl = url === AUTH_URLS.WHATSAPP ? buildWhatsAppUrl() : url;
  const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');

  // Check if popup was blocked after a small delay
  if (newWindow) {
    setTimeout(() => {
      if (newWindow.closed || !newWindow.location) {
        // Popup was blocked, but don't redirect current tab for external auth URLs
        // User should be notified via UI instead
      }
    }, 100);
  }
};

export const scrollToSection = (sectionId: string, buttonType: string, buttonLocation: string) => {
  trackButtonClick({ buttonType, buttonLocation });
  const element = document.getElementById(sectionId);
  if (element) {
    const offsetTop = element.offsetTop - 112; // Account for header (64px) + sub-nav (48px)
    window.scrollTo({
      top: offsetTop,
      behavior: getScrollBehavior()
    });
  }
};

interface ContactRedirectOptions {
  subject?: string;
  hash?: string;
  buttonType?: string;
  buttonLocation?: string;
}

export const redirectToContact = (
  language: string,
  { subject, hash, buttonType, buttonLocation }: ContactRedirectOptions = {}
) => {
  if (buttonType && buttonLocation) {
    trackButtonClick({ buttonType, buttonLocation });
  }

  const basePath = subject ? `/contact?subject=${encodeURIComponent(subject)}` : '/contact';
  const localizedBase = getLocalizedPath(basePath, language);
  const finalPath = `${localizedBase}${normalizeHash(hash)}`;

  if (typeof window !== 'undefined') {
    window.location.href = finalPath;
  }

  return finalPath;
};

export const openEmailClient = (email: string, subject?: string, buttonType?: string, buttonLocation?: string) => {
  if (buttonType && buttonLocation) {
    trackButtonClick({ buttonType, buttonLocation });
  }
  const mailtoUrl = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  window.location.href = mailtoUrl;
};