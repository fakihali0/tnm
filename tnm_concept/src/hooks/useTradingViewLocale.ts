import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type TradingViewLocale = "en" | "ar";

const ARABIC_PREFIX = "ar";

function determineLocale(language?: string): TradingViewLocale {
  if (!language) {
    return "en";
  }

  const normalized = language.toLowerCase();
  return normalized.startsWith(ARABIC_PREFIX) ? "ar" : "en";
}

export function useTradingViewLocale(): TradingViewLocale {
  const { i18n } = useTranslation();
  const [locale, setLocale] = useState<TradingViewLocale>(() => {
    const documentLanguage =
      typeof document !== "undefined" ? document.documentElement.lang : undefined;

    if (documentLanguage) {
      return determineLocale(documentLanguage);
    }

    return "en";
  });

  useEffect(() => {
    const documentLanguage =
      typeof document !== "undefined" ? document.documentElement.lang : undefined;
    const activeLanguage = i18n?.language || documentLanguage;

    setLocale(determineLocale(activeLanguage));
  }, [i18n.language]);

  return locale;
}
