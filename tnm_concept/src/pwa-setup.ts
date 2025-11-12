// Clear app cache utility
import { clearAppCache } from '@/utils/clear-cache';

// Export for global access
export { clearAppCache };

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const INSTALL_BUTTON_HIDE_DELAY = 15_000;
const SAFARI_HINT_DELAY = 2_000;
const SAFARI_HINT_HIDE_DELAY = 8_000;
const IOS_HINT_DELAY = 3_000;
const IOS_HINT_HIDE_DELAY = 10_000;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installButton: HTMLButtonElement | null = null;
let installButtonTimer: ReturnType<typeof setTimeout> | null = null;

// Service Worker registration is now handled in main.tsx

const hideInstallButton = () => {
  if (!installButton) {
    return;
  }

  if (installButtonTimer) {
    clearTimeout(installButtonTimer);
    installButtonTimer = null;
  }

  installButton.classList.add("pwa-install-button--hidden");

  setTimeout(() => {
    installButton?.remove();
    installButton = null;
  }, 300);
};

const showInstallButton = () => {
  if (installButton) {
    return;
  }

  installButton = document.createElement("button");
  installButton.type = "button";
  installButton.className = "pwa-install-button";
  installButton.setAttribute("id", "pwa-install-button");

  const emoji = document.createElement("span");
  emoji.className = "pwa-install-button__emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = "📱";

  const label = document.createElement("span");
  label.textContent = "Install App";

  installButton.append(emoji, label);

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (import.meta.env.DEV) {
      console.log(`User response to the install prompt: ${outcome}`);
    }

    deferredPrompt = null;
    hideInstallButton();
  });

  document.body.appendChild(installButton);

  if (installButtonTimer) {
    clearTimeout(installButtonTimer);
  }

  installButtonTimer = setTimeout(() => {
    hideInstallButton();
  }, INSTALL_BUTTON_HIDE_DELAY);
};

const createHint = (
  options: {
    emoji: string;
    title: string;
    subtitle: string;
    className: string;
    autoHideAfter: number;
  }
) => {
  const hint = document.createElement("div");
  hint.className = `pwa-hint ${options.className}`;
  hint.setAttribute("role", "status");

  const emoji = document.createElement("span");
  emoji.className = "pwa-hint__emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = options.emoji;

  const textWrapper = document.createElement("div");
  textWrapper.className = "pwa-hint__text";

  const title = document.createElement("div");
  title.className = "pwa-hint__title";
  title.textContent = options.title;

  const subtitle = document.createElement("div");
  subtitle.className = "pwa-hint__subtitle";
  subtitle.textContent = options.subtitle;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "pwa-hint__close";
  closeButton.setAttribute("aria-label", "Dismiss install hint");
  closeButton.textContent = "×";

  closeButton.addEventListener("click", () => {
    hint.remove();
  });

  textWrapper.append(title, subtitle);
  hint.append(emoji, textWrapper, closeButton);
  document.body.appendChild(hint);

  setTimeout(() => {
    hint.remove();
  }, options.autoHideAfter);
};

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isInStandaloneMode = () => ("standalone" in window.navigator) && Boolean((window.navigator as any).standalone);
const supportsPWAInstall = () => "serviceWorker" in navigator && "PushManager" in window;

const checkSafariPWASupport = () => {
  if (!isSafari() || isIOS() || !supportsPWAInstall()) {
    return;
  }

  if (import.meta.env.DEV) {
    console.log("Safari desktop detected - PWA install available via browser menu");
  }

  setTimeout(() => {
    createHint({
      emoji: "🖥️",
      title: "Install as Desktop App",
      subtitle: "File → Add to Dock (Safari)",
      className: "pwa-hint--safari",
      autoHideAfter: SAFARI_HINT_HIDE_DELAY,
    });
  }, SAFARI_HINT_DELAY);
};

const showIOSInstallHint = () => {
  if (!isIOS() || isInStandaloneMode()) {
    return;
  }

  setTimeout(() => {
    createHint({
      emoji: "📱",
      title: "Install Trade'n More",
      subtitle: "Tap Share → Add to Home Screen",
      className: "pwa-hint--ios",
      autoHideAfter: IOS_HINT_HIDE_DELAY,
    });
  }, IOS_HINT_DELAY);
};

const setupLoadingScreen = () => {
  window.addEventListener("load", () => {
    const loadingScreen = document.getElementById("loading-screen");
    if (!loadingScreen) {
      return;
    }

    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 100);
  });
};

const registerInstallListeners = () => {
  // Disable native install prompts - handled by React component
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    // Don't show the old install button anymore
    // deferredPrompt = event;
    // showInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    if (import.meta.env.DEV) {
      console.log("PWA was installed");
    }
    hideInstallButton();
  });
};

// Service Worker registration moved to main.tsx for better update handling
registerInstallListeners();
setupLoadingScreen();
// Safari and iOS hints now handled by React component
// checkSafariPWASupport();
// showIOSInstallHint();

export {};
