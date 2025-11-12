import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useRealInstruments } from "@/hooks/useRealInstruments";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { SPACING } from "@/styles/spacing";

const FEATURED_SYMBOLS = ["EURUSD", "GBPUSD", "XAUUSD", "SPX500", "BTCUSD"];

export function MarketOverviewWidget() {
  const { t } = useTranslation('common');
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [displayedPrices, setDisplayedPrices] = useState<Record<string, number>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLiveData, setHasLiveData] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get real instruments data
  const { instruments } = useRealInstruments();

  // Fetch live data for featured instruments using financial-data directly
  useEffect(() => {
    const fetchQuotes = async () => {
      setDataLoading(true);
      setError(null);
      
      try {
        const symbolsParam = FEATURED_SYMBOLS.join(',');
        const { data, error: funcError } = await supabase.functions.invoke(`financial-data/quotes?symbols=${encodeURIComponent(symbolsParam)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (funcError) {
          console.error('❌ [MarketOverview] Financial data error:', funcError);
          setError('Failed to fetch live data');
          setDataLoading(false);
          return;
        }

        if (data && Array.isArray(data)) {
          const quotesMap: Record<string, any> = {};
          data.forEach((quote: any) => {
            if (quote && quote.symbol) {
              quotesMap[quote.symbol] = quote;
            }
          });
          setQuotes(quotesMap);
          setHasLiveData(Object.keys(quotesMap).length > 0);
        }
      } catch (err) {
        console.error('💥 [MarketOverview] Network error:', err);
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setDataLoading(false);
      }
    };

    // Initial fetch
    fetchQuotes();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchQuotes, 30000);

    return () => clearInterval(interval);
  }, []);

  // Get instrument metadata from real data
  const featuredInstruments = useMemo(() => {
    return FEATURED_SYMBOLS.map(symbol =>
      instruments.find(inst => inst.symbol === symbol)
    ).filter(Boolean).slice(0, 4);
  }, [instruments]);

  // Define price change thresholds by asset class
  const getChangeThreshold = (assetClass: string) => {
    switch (assetClass) {
      case 'Forex': return 0.00001; // 1 pip for most pairs
      case 'Indices': return 0.1; // 0.1 points
      case 'Commodities': return 0.01; // $0.01
      case 'Crypto': return 1; // $1
      default: return 0.01;
    }
  };

  // Update prices with smoothing when new quotes come in
  useEffect(() => {
    if (quotes && Object.keys(quotes).length > 0) {
      setIsInitialLoad(false);
      setHasLiveData(true);
      
      // Update displayed prices only if change is significant
      setDisplayedPrices(prev => {
        const newPrices = { ...prev };
        Object.entries(quotes).forEach(([symbol, quote]) => {
          if (quote) {
            const price = quote.bid || quote.ask || 0;
            if (price > 0) {
              const instrument = instruments.find(inst => inst.symbol === symbol);
              const threshold = instrument ? getChangeThreshold(instrument.assetClass) : 0.01;
              const currentDisplayed = prev[symbol];
              
              // Only update if significant change or first time
              if (!currentDisplayed || Math.abs(price - currentDisplayed) >= threshold) {
                newPrices[symbol] = price;
              }
            }
          }
        });
        return newPrices;
      });

      // Update previous prices for change calculation (only on first quote)
      setPreviousPrices(prev => {
        const newPrev = { ...prev };
        Object.entries(quotes).forEach(([symbol, quote]) => {
          if (quote && !prev[symbol]) {
            newPrev[symbol] = quote.bid || quote.ask || 0;
          }
        });
        return newPrev;
      });
    }
  }, [quotes]);

  const formatPrice = (price: number | undefined) => {
    if (typeof price !== 'number' || !Number.isFinite(price)) return '—';
    return price > 100 ? price.toFixed(2) : price.toFixed(5);
  };

  const calculateChange = (symbol: string, currentPrice: number) => {
    const prevPrice = previousPrices[symbol];
    if (!prevPrice || prevPrice === currentPrice) return null;
    
    const absolute = currentPrice - prevPrice;
    const percentage = (absolute / prevPrice) * 100;
    
    return { absolute, percentage };
  };

  return (
    <Card className={`trading-card ${SPACING.padding.card} bg-gradient-to-br from-primary/5 to-accent/5`}>
      <CardContent className={SPACING.gap.card}>
        <div className={`flex items-center ${SPACING.gap.button}`}>
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
            <Activity className={`${SPACING.icon.md} text-white`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('marketOverview.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('marketOverview.subtitle')}</p>
          </div>
        </div>

        <div className={SPACING.stack.normal}>
          {featuredInstruments.map((instrument) => {
            if (!instrument) return null;
            
            // Get stable displayed price or fallback to mock data
            const liveQuote = quotes[instrument.symbol];
            const livePrice = liveQuote?.bid || liveQuote?.ask;
            const displayPrice = displayedPrices[instrument.symbol] || instrument.currentPrice?.bid || instrument.currentPrice?.ask;
            
            // Calculate price change from live data
            const priceChange = livePrice ? calculateChange(instrument.symbol, livePrice) : instrument.priceChange;
            const isPositive = priceChange ? priceChange.percentage >= 0 : false;
            
              return (
              <div key={instrument.symbol} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                <div className="flex-1">
                  <div className={`flex items-center ${SPACING.gap.small}`}>
                    <span className="font-medium text-sm">{instrument.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {t(`tradingCalculator.assetClasses.${instrument.assetClass}`)}
                    </Badge>
                    {liveQuote && (
                      <Badge variant="secondary" className="text-xs">
                        {t('marketOverview.live')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {instrument.name}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center ${SPACING.gap.iconButton} justify-end`}>
                    <p className="font-medium text-sm tabular-nums min-w-[80px] text-right">
                      {isInitialLoad && dataLoading ? '...' : formatPrice(displayPrice)}
                    </p>
                  </div>
                  {priceChange && Math.abs(priceChange.percentage) >= 0.05 && (
                    <div className={`flex items-center ${SPACING.gap.iconButton} text-xs ${
                      isPositive ? 'text-primary' : 'text-destructive'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className={SPACING.icon.xs} />
                      ) : (
                        <TrendingDown className={SPACING.icon.xs} />
                      )}
                      <span>{isPositive ? '+' : ''}{priceChange.percentage.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {isInitialLoad && dataLoading ? t('marketOverview.loadingData') : 
             error ? t('marketOverview.dataUnavailable') : 
             hasLiveData ? t('marketOverview.liveUpdates') :
             t('marketOverview.liveUpdates')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}