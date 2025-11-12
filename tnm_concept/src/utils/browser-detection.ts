interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isSamsung: boolean;
  isOpera: boolean;
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isStandalone: boolean;
  supportsPWA: boolean;
  supportsBeforeInstallPrompt: boolean;
}

interface PWACapabilities {
  canInstall: boolean;
  installMethod: 'beforeinstallprompt' | 'manual' | 'safari' | 'ios' | 'none';
  needsManualInstructions: boolean;
  browserSpecificInstructions: string;
}

export function getBrowserInfo(): BrowserInfo {
  const userAgent = navigator.userAgent;
  
  // Enhanced browser detection with better vendor fallbacks
  const isChrome = (/Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)) || 
                   (/Chrome/.test(userAgent) && navigator.vendor.includes('Google'));
  const isSafari = (/Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor)) || 
                   (/Safari/.test(userAgent) && navigator.vendor.includes('Apple')) ||
                   (/Safari/.test(userAgent) && !userAgent.includes('Chrome'));
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  const isSamsung = /SamsungBrowser/.test(userAgent);
  const isOpera = /OPR/.test(userAgent) || /Opera/.test(userAgent);

  let name = 'Unknown';
  let version = '';

  if (isChrome && !isEdge && !isOpera && !isSamsung) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '';
  } else if (isSafari && !isChrome) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : '';
  } else if (isFirefox) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '';
  } else if (isEdge) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? match[1] : '';
  } else if (isSamsung) {
    name = 'Samsung Internet';
    const match = userAgent.match(/SamsungBrowser\/(\d+)/);
    version = match ? match[1] : '';
  } else if (isOpera) {
    name = 'Opera';
    const match = userAgent.match(/(OPR|Opera)\/(\d+)/);
    version = match ? match[2] : '';
  }

  return {
    name,
    version,
    isChrome,
    isSafari,
    isFirefox,
    isEdge,
    isSamsung,
    isOpera
  };
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Enhanced iOS detection with multiple fallbacks
  const isIOSFromUA = /iPad|iPhone|iPod/.test(userAgent) && !('MSStream' in window);
  const isIOSFromPlatform = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIOSFromTouch = 'ontouchend' in document && navigator.maxTouchPoints > 0 && /Apple/.test(navigator.vendor);
  const isIOS = isIOSFromUA || isIOSFromPlatform || isIOSFromTouch;
  
  const isAndroid = /Android/.test(userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isTablet = /iPad/.test(userAgent) || (isAndroid && !/Mobile/.test(userAgent)) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  let os: DeviceInfo['os'] = 'unknown';
  if (isIOS) os = 'ios';
  else if (isAndroid) os = 'android';
  else if (/Windows/.test(userAgent)) os = 'windows';
  else if (/Mac/.test(userAgent)) os = 'macos';
  else if (/Linux/.test(userAgent)) os = 'linux';

  const type: DeviceInfo['type'] = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  
  // Enhanced standalone detection for iOS and other platforms
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
                      window.matchMedia('(display-mode: fullscreen)').matches ||
                      window.matchMedia('(display-mode: minimal-ui)').matches;
  
  const supportsPWA = 'serviceWorker' in navigator && 'PushManager' in window;
  const supportsBeforeInstallPrompt = 'BeforeInstallPromptEvent' in window || 
                                     'onbeforeinstallprompt' in window;

  return {
    type,
    os,
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isStandalone,
    supportsPWA,
    supportsBeforeInstallPrompt
  };
}

export function getPWACapabilities(): PWACapabilities {
  const browser = getBrowserInfo();
  const device = getDeviceInfo();
  
  // Already installed
  if (device.isStandalone) {
    return {
      canInstall: false,
      installMethod: 'none',
      needsManualInstructions: false,
      browserSpecificInstructions: ''
    };
  }

  // Chrome/Chromium-based browsers that support beforeinstallprompt
  if ((browser.isChrome || browser.isEdge || browser.isSamsung) && device.supportsBeforeInstallPrompt) {
    return {
      canInstall: true,
      installMethod: 'beforeinstallprompt',
      needsManualInstructions: false,
      browserSpecificInstructions: ''
    };
  }

  // iOS Safari
  if (device.isIOS && browser.isSafari) {
    return {
      canInstall: true,
      installMethod: 'ios',
      needsManualInstructions: true,
      browserSpecificInstructions: 'Tap the Share button and select "Add to Home Screen"'
    };
  }

  // Desktop Safari
  if (browser.isSafari && !device.isMobile) {
    return {
      canInstall: true,
      installMethod: 'safari',
      needsManualInstructions: true,
      browserSpecificInstructions: 'Go to File menu and select "Add to Dock"'
    };
  }

  // Android Chrome without beforeinstallprompt (older versions or disabled)
  if (device.isAndroid && browser.isChrome) {
    return {
      canInstall: true,
      installMethod: 'manual',
      needsManualInstructions: true,
      browserSpecificInstructions: 'Tap the menu (three dots) and select "Add to Home screen"'
    };
  }

  // Samsung Internet
  if (browser.isSamsung) {
    return {
      canInstall: true,
      installMethod: 'manual',
      needsManualInstructions: true,
      browserSpecificInstructions: 'Tap the menu and select "Add page to Apps"'
    };
  }

  // Firefox Mobile
  if (browser.isFirefox && device.isMobile) {
    return {
      canInstall: true,
      installMethod: 'manual',
      needsManualInstructions: true,
      browserSpecificInstructions: 'Tap the menu and select "Add to Home Screen"'
    };
  }

  // Other browsers - limited support
  return {
    canInstall: false,
    installMethod: 'none',
    needsManualInstructions: false,
    browserSpecificInstructions: 'PWA installation not supported in this browser. Try Chrome, Safari, or Edge.'
  };
}

export function shouldShowPWAPrompt(): boolean {
  const capabilities = getPWACapabilities();
  const device = getDeviceInfo();
  
  // Don't show if already installed
  if (device.isStandalone) return false;
  
  // Don't show if PWA not supported
  if (!device.supportsPWA) return false;
  
  // Show if we can install via any method
  return capabilities.canInstall;
}

export function getInstallInstructions(lang: 'en' | 'ar' = 'en'): string[] {
  const capabilities = getPWACapabilities();
  const device = getDeviceInfo();
  const browser = getBrowserInfo();

  interface InstructionSets {
    ios: string[];
    safari: string[];
    androidChrome: string[];
    samsung: string[];
    firefox: string[];
  }

  const instructions: Record<string, InstructionSets> = {
    en: {
      ios: [
        "1. Tap the Share button (square with arrow) at the bottom of the screen",
        "2. Scroll down and tap 'Add to Home Screen'",
        "3. Customize the app name if desired and tap 'Add'"
      ],
      safari: [
        "1. Click on 'File' in the menu bar",
        "2. Select 'Add to Dock'",
        "3. The app will be added to your Dock for quick access"
      ],
      androidChrome: [
        "1. Tap the menu button (three dots) in the top right",
        "2. Select 'Add to Home screen'",
        "3. Confirm by tapping 'Add' in the dialog"
      ],
      samsung: [
        "1. Tap the menu button",
        "2. Select 'Add page to Apps'",
        "3. The app will be added to your device"
      ],
      firefox: [
        "1. Tap the menu button (three lines)",
        "2. Select 'Add to Home Screen'",
        "3. Confirm the installation"
      ]
    },
    ar: {
      ios: [
        "١. اضغط على زر المشاركة (المربع مع السهم) في أسفل الشاشة",
        "٢. اسحب لأسفل واضغط على 'إضافة إلى الشاشة الرئيسية'",
        "٣. خصص اسم التطبيق إذا رغبت واضغط على 'إضافة'"
      ],
      safari: [
        "١. انقر على 'ملف' في شريط القائمة",
        "٢. اختر 'إضافة إلى Dock'",
        "٣. سيتم إضافة التطبيق إلى Dock للوصول السريع"
      ],
      androidChrome: [
        "١. اضغط على زر القائمة (ثلاث نقاط) في الأعلى يمين",
        "٢. اختر 'إضافة إلى الشاشة الرئيسية'",
        "٣. أكد بالضغط على 'إضافة' في النافذة"
      ],
      samsung: [
        "١. اضغط على زر القائمة",
        "٢. اختر 'إضافة الصفحة إلى التطبيقات'",
        "٣. سيتم إضافة التطبيق إلى جهازك"
      ],
      firefox: [
        "١. اضغط على زر القائمة (ثلاثة خطوط)",
        "٢. اختر 'إضافة إلى الشاشة الرئيسية'",
        "٣. أكد التثبيت"
      ]
    }
  };

  const langInstructions = instructions[lang];

  if (device.isIOS && browser.isSafari) {
    return langInstructions.ios;
  } else if (browser.isSafari && !device.isMobile) {
    return langInstructions.safari;
  } else if (device.isAndroid && browser.isChrome) {
    return langInstructions.androidChrome;
  } else if (browser.isSamsung) {
    return langInstructions.samsung;
  } else if (browser.isFirefox && device.isMobile) {
    return langInstructions.firefox;
  }

  return langInstructions.androidChrome; // Default fallback
}
