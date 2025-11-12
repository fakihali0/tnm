import React, { useEffect, useRef } from "react";
import { useTradingViewLocale } from "@/hooks/useTradingViewLocale";

export default function TradingViewTicker() {
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const isMountedRef = useRef(true);
  const locale = useTradingViewLocale();

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const containerEl = container.current;
    const widgetEl = widgetRef.current;

    if (!containerEl || !widgetEl || !isMountedRef.current) {
      return;
    }

    // Safely clear widget content
    try {
      widgetEl.innerHTML = "";
    } catch (error) {
      console.warn('TradingView widget cleanup error:', error);
    }

    // Remove old script if exists
    if (scriptRef.current) {
      try {
        if (containerEl.contains(scriptRef.current)) {
          containerEl.removeChild(scriptRef.current);
        }
      } catch (error) {
        console.warn('TradingView script removal error:', error);
      }
      scriptRef.current = null;
    }

    // Only add new script if still mounted
    if (!isMountedRef.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "US 100" },
        { proName: "FX_IDC:EURUSD", title: "EUR/USD" },
        { proName: "FX_IDC:USDJPY", title: "USD/JPY" },
        { proName: "FX_IDC:GBPUSD", title: "GBP/USD" },
        { proName: "FX_IDC:AUDUSD", title: "AUD/USD" },
        { proName: "FX_IDC:USDCAD", title: "USD/CAD" },
        { proName: "FX_IDC:USDCHF", title: "USD/CHF" }
      ],
      showSymbolLogo: true,
      colorTheme: "light",
      isTransparent: false,
      displayMode: "adaptive",
      locale
    });

    try {
      containerEl.appendChild(script);
      scriptRef.current = script;
    } catch (error) {
      console.warn('TradingView script append error:', error);
    }

    return () => {
      if (scriptRef.current) {
        try {
          if (containerEl && containerEl.contains(scriptRef.current)) {
            containerEl.removeChild(scriptRef.current);
          }
        } catch (error) {
          // Silently handle cleanup errors during unmount
        }
        scriptRef.current = null;
      }
    };
  }, [locale]);

  return (
    <div className="w-full bg-card border-y">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget" ref={widgetRef}></div>
      </div>
    </div>
  );
}