import { useEffect, useRef, useState } from "react";
import { useTradingViewLocale } from "@/hooks/useTradingViewLocale";
import { useLoadingTranslations } from "@/hooks/useLoadingTranslations";

export function TradingViewForexCrossRates() {
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const locale = useTradingViewLocale();
  const loadingTranslations = useLoadingTranslations();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (container.current) {
      observer.observe(container.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    // Only load the widget when it becomes visible to reduce critical request chain
    const containerEl = container.current;
    const widgetEl = widgetRef.current;

    if (!containerEl || !widgetEl || !isVisible) {
      return;
    }

    setHasLoaded(false);
    widgetEl.innerHTML = "";

    if (scriptRef.current && containerEl.contains(scriptRef.current)) {
      containerEl.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      colorTheme: "light",
      isTransparent: false,
      locale,
      currencies: [
        "EUR",
        "USD",
        "JPY",
        "GBP",
        "CHF",
        "AUD",
        "CAD",
        "NZD",
        "CNY"
      ],
      backgroundColor: "#ffffff",
      width: "100%",
      height: "100%"
    });

    containerEl.appendChild(script);
    scriptRef.current = script;
    setHasLoaded(true);

    return () => {
      if (scriptRef.current && containerEl.contains(scriptRef.current)) {
        containerEl.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [isVisible, locale]);

  return (
    <div className="w-full bg-card border rounded-lg overflow-hidden min-h-[500px]">
      <div className="tradingview-widget-container h-full min-h-[500px]" ref={container}>
        {!hasLoaded && isVisible && (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            {loadingTranslations.forexRatesLoading()}
          </div>
        )}
        <div className="tradingview-widget-container__widget" ref={widgetRef}></div>
        <div className="tradingview-widget-copyright">
          <a href="https://www.tradingview.com/markets/currencies/cross-rates-overview-prices/" rel="noopener nofollow" target="_blank">
            <span className="text-primary">Forex market by TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}