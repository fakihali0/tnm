import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { ensureLanguage, getLocalizedPath, getLanguageFromPath } from '@/i18n';
import { useTranslationValidation } from '@/hooks/useTranslationValidation';
import { validateURL, preserveScrollPosition, isValidRoute } from '@/utils/url-validation';
import { cn } from "@/lib/utils";

type ToggleSize = "sm" | "mobile";

interface LanguageToggleProps {
  size?: ToggleSize;
  className?: string;
  hideLabel?: boolean;
}

export function LanguageToggle({ size = "sm", className, hideLabel = false }: LanguageToggleProps) {
  const { i18n, t } = useTranslation();
  const { safeT } = useTranslationValidation();
  const navigate = useNavigate();
  const location = useLocation();

  const currentLang = getLanguageFromPath(location.pathname);

  const toggleLanguage = async () => {
    try {
      const currentPath = location.pathname;
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      
      // Validate current URL before proceeding
      const currentURL = `${currentPath}${location.search}${location.hash}`;
      const validation = validateURL(currentURL);
      
      if (!validation.isValid && process.env.NODE_ENV === 'development') {
        // Invalid URL detected during language switch
      }
      
      // Validate target route exists
      if (!isValidRoute(currentPath) && process.env.NODE_ENV === 'development') {
        // Target route may not exist
      }
      
      // Preserve scroll position
      const restoreScroll = preserveScrollPosition();
      
      // Ensure language resources are available before navigation
      await ensureLanguage(newLang);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('i18nextLng', newLang);
      }

      // Update document direction and language
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
      
      // Get the new path using the enhanced helper function
      const newPath = getLocalizedPath(currentPath, newLang, location.search, location.hash);
      
      // Development debugging
      if (import.meta.env.DEV) {
        console.debug('Language toggle:', {
          from: { lang: currentLang, url: currentURL },
          to: { lang: newLang, url: newPath },
          validation
        });
      }
      
      // Navigate to new path with scroll preservation state
      navigate(newPath, { 
        replace: true,
        state: { preserveScroll: true, scrollY: window.scrollY }
      });
      
      // Restore scroll position after navigation
      restoreScroll();
    } catch (error) {
      // Error during language toggle, fallback to home page
      // Fallback: navigate to home page in target language
      const fallbackPath = currentLang === 'ar' ? '/' : '/ar';
      navigate(fallbackPath, { replace: true });
    }
  };

  const resolvedLang = i18n.resolvedLanguage ?? currentLang;
  const displayLang = resolvedLang === 'ar' ? 'العربية' : 'English';
  const otherLang = resolvedLang === 'ar' ? 'EN' : 'العربية';

  const isMobileSize = size === "mobile";

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => {
        void toggleLanguage();
      }}
      className={cn(
        "gap-2 font-medium flex-shrink-0",
        isMobileSize ? "h-11 w-11 min-h-[44px] min-w-[44px] touch-target p-0" : "",
        className,
      )}
      aria-label={`${safeT('common:common.language', 'Language')}: ${displayLang}`}
    >
      <Globe className="h-4 w-4" />
      {!hideLabel && <span className="hidden sm:inline">{otherLang}</span>}
    </Button>
  );
}