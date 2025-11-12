/**
 * @deprecated Use `useMarketData` instead for unified, optimized market data
 * @see src/hooks/useMarketData.ts
 * 
 * This hook is kept for backward compatibility but will be removed in a future release.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

console.warn('⚠️ useFinancialData is deprecated. Please migrate to useMarketData for better performance and features.');

export interface QuoteData {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: number;
  isMarketOpen: boolean;
  dataSource?: string;
}

export interface SwapData {
  symbol: string;
  swapLong: number;
  swapShort: number;
  lastUpdated: string;
}

export interface HistoricalData {
  symbol: string;
  prices: number[];
  timestamps: number[];
  volumes: number[];
}

export const useFinancialData = () => {
  const [quotes, setQuotes] = useState<{ [symbol: string]: QuoteData }>({});
  const [swaps, setSwaps] = useState<{ [symbol: string]: SwapData }>({});
  const [loading, setLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRequestRef = useRef<string | null>(null);

  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;

    // Deduplication guard - prevent overlapping fetches for same symbol set
    const sortedSymbols = [...symbols].sort();
    const symbolKey = sortedSymbols.join(',');
    console.log('📊 [useFinancialData] fetchQuotes called with symbols:', sortedSymbols);
    
    if (inflightRequestRef.current === symbolKey) {
      console.log('🔄 [useFinancialData] Skipping duplicate request for:', symbolKey);
      return;
    }

    inflightRequestRef.current = symbolKey;
    setLoading(true);
    setError(null);
    
    const symbolsParam = sortedSymbols.join(',');
    console.log('🚀 [useFinancialData] Starting fetch for symbols:', symbolsParam);

    try {
      // Use real-time market data function
      const { data, error: funcError } = await supabase.functions.invoke(`real-time-market-data?symbols=${encodeURIComponent(symbolsParam)}&type=quotes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 [useFinancialData] Real-time market data response:', { data, error: funcError });

      if (funcError) {
        console.error('❌ [useFinancialData] Edge function error:', funcError);
        setError('Failed to fetch market data');
        return;
      }

      if (data && Array.isArray(data)) {
        console.log('✅ [useFinancialData] Processing', data.length, 'quotes:', data);
        const quotesMap: { [symbol: string]: QuoteData } = {};
        data.forEach((quote: QuoteData) => {
          quotesMap[quote.symbol] = quote;
          console.log('💰 [useFinancialData] Processed quote for', quote.symbol, ':', quote);
        });
        setQuotes(prev => {
          const newQuotes = { ...prev, ...quotesMap };
          console.log('🔄 [useFinancialData] Updated quotes state:', newQuotes);
          return newQuotes;
        });
      } else {
        console.warn('⚠️ [useFinancialData] Invalid data format received:', data);
      }
    } catch (err) {
      console.error('💥 [useFinancialData] Network error:', err);
      setError('Network error while fetching data');
    } finally {
      setLoading(false);
      inflightRequestRef.current = null;
      console.log('🏁 [useFinancialData] Fetch completed, loading set to false');
    }
  }, []);

  const fetchHistoricalData = useCallback(async (symbol: string, days: number = 30): Promise<HistoricalData | null> => {
    try {
      const { data, error: funcError } = await supabase.functions.invoke(`financial-data/historical?symbol=${encodeURIComponent(symbol)}&days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (funcError) {
        return null;
      }

      return data;
    } catch (err) {
      return null;
    }
  }, []);

  const fetchSwapRates = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;

    console.log('🔄 [useFinancialData] fetchSwapRates called with symbols:', symbols);
    setSwapLoading(true);
    try {
      const symbolsParam = symbols.join(',');
      const { data, error: funcError } = await supabase.functions.invoke(`swap-rates?symbols=${encodeURIComponent(symbolsParam)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📈 [useFinancialData] Swap rates response:', { data, error: funcError });

      if (funcError) {
        console.error('❌ [useFinancialData] Swap rates error:', funcError);
        return;
      }

      if (data && Array.isArray(data)) {
        console.log('✅ [useFinancialData] Processing', data.length, 'swap rates:', data);
        const swapsMap: { [symbol: string]: SwapData } = {};
        data.forEach((swap: SwapData) => {
          swapsMap[swap.symbol] = swap;
        });
        setSwaps(prev => {
          const newSwaps = { ...prev, ...swapsMap };
          console.log('🔄 [useFinancialData] Updated swaps state:', newSwaps);
          return newSwaps;
        });
      } else {
        console.warn('⚠️ [useFinancialData] Invalid swap data format received:', data);
      }
    } catch (err) {
      console.error('💥 [useFinancialData] Swap rates network error:', err);
    } finally {
      setSwapLoading(false);
    }
  }, []);

  const getQuote = useCallback((symbol: string): QuoteData | null => {
    return quotes[symbol] || null;
  }, [quotes]);

  const getSwap = useCallback((symbol: string): SwapData | null => {
    return swaps[symbol] || null;
  }, [swaps]);

  const refreshQuotes = useCallback((symbols: string[]) => {
    fetchQuotes(symbols);
  }, [fetchQuotes]);

  const refreshSwaps = useCallback((symbols: string[]) => {
    fetchSwapRates(symbols);
  }, [fetchSwapRates]);

  return {
    quotes,
    swaps,
    loading,
    swapLoading,
    error,
    fetchQuotes,
    fetchSwapRates,
    fetchHistoricalData,
    getQuote,
    getSwap,
    refreshQuotes,
    refreshSwaps
  };
};

// Auto-refresh hook for real-time updates
export const useRealTimeQuotes = (symbols: string[], refreshInterval: number = 30000) => {
  const { quotes, swaps, loading, swapLoading, error, fetchQuotes, fetchSwapRates, getQuote, getSwap } = useFinancialData();

  const symbolsKey = useMemo(() => {
    if (symbols.length === 0) {
      return '';
    }

    const sortedSymbols = [...symbols].sort();
    return sortedSymbols.join(',');
  }, [symbols]);

  useEffect(() => {
    console.log('⚡ [useRealTimeQuotes] Effect triggered with symbolsKey:', symbolsKey);
    if (!symbolsKey) return;

    const targetSymbols = symbolsKey.split(',');
    console.log('🎯 [useRealTimeQuotes] Target symbols:', targetSymbols);

    // Initial fetch for both quotes and swaps
    console.log('🚀 [useRealTimeQuotes] Starting initial fetch...');
    fetchQuotes(targetSymbols);
    fetchSwapRates(targetSymbols);

    // Set up interval for quotes updates
    console.log('⏰ [useRealTimeQuotes] Setting up quotes interval:', refreshInterval + 'ms');
    const quotesInterval = setInterval(() => {
      console.log('🔄 [useRealTimeQuotes] Interval fetch triggered');
      fetchQuotes(targetSymbols);
    }, refreshInterval);

    // Set up interval for swap rates (less frequent - every 4 hours)
    const swapsInterval = setInterval(() => {
      fetchSwapRates(targetSymbols);
    }, 4 * 60 * 60 * 1000);

    return () => {
      console.log('🛑 [useRealTimeQuotes] Cleaning up intervals');
      clearInterval(quotesInterval);
      clearInterval(swapsInterval);
    };
  }, [symbolsKey, refreshInterval, fetchQuotes, fetchSwapRates]);

  return {
    quotes,
    swaps,
    dataLoading: loading || swapLoading,
    error,
    getQuote,
    getSwap
  };
};