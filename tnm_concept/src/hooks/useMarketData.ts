/**
 * Unified Market Data Hook
 * Consolidates all real-time market data functionality into one optimized hook
 * Uses HTTP polling with smart intervals, request deduplication, and caching
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuoteData {
  symbol: string;
  bid: number;
  ask: number;
  last?: number;
  spread: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  high?: number;
  low?: number;
  timestamp: number;
  isMarketOpen: boolean;
  marketStatus?: 'open' | 'closed' | 'pre-market' | 'post-market';
  dataSource: string;
}

export interface SwapData {
  symbol: string;
  swapLong: number;
  swapShort: number;
  lastUpdated: string;
}

export interface UseMarketDataOptions {
  symbols: string[];
  refreshInterval?: number; // default: 5000ms (5 seconds)
  enableSwaps?: boolean; // default: false
  onError?: (error: Error) => void;
  onQuoteUpdate?: (quote: QuoteData) => void;
}

export interface MarketDataReturn {
  // Data
  quotes: Record<string, QuoteData>;
  swaps: Record<string, SwapData>;
  
  // Status
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  latency: number;
  
  // Methods
  getQuote: (symbol: string) => QuoteData | null;
  getSwap: (symbol: string) => SwapData | null;
  refresh: () => Promise<void>;
  addSymbols: (symbols: string[]) => void;
  removeSymbols: (symbols: string[]) => void;
}

// Cache management
const quoteCache = new Map<string, { data: QuoteData; timestamp: number }>();
const QUOTE_CACHE_TTL = 20000; // 20 seconds
const swapCache = new Map<string, { data: SwapData; timestamp: number }>();
const SWAP_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// Request deduplication
const inflightRequests = new Map<string, Promise<any>>();

export function useMarketData(options: UseMarketDataOptions): MarketDataReturn {
  const {
    symbols: initialSymbols,
    refreshInterval = 5000,
    enableSwaps = false,
    onError,
    onQuoteUpdate
  } = options;

  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [swaps, setSwaps] = useState<Record<string, SwapData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [latency, setLatency] = useState(0);
  const [activeSymbols, setActiveSymbols] = useState<Set<string>>(new Set(initialSymbols));

  const fetchStartTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const swapIntervalRef = useRef<NodeJS.Timeout>();

  // Fetch quotes with deduplication and caching
  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;

    const sortedSymbols = [...symbols].sort();
    const cacheKey = sortedSymbols.join(',');

    // Check if we already have a request in flight
    if (inflightRequests.has(cacheKey)) {
      console.log('🔄 [useMarketData] Deduplicating request for:', cacheKey);
      return inflightRequests.get(cacheKey);
    }

    fetchStartTime.current = Date.now();
    setIsLoading(true);
    setError(null);

    const fetchPromise = (async () => {
      try {
        console.log('📊 [useMarketData] Fetching quotes for:', sortedSymbols);

        const { data, error: fetchError } = await supabase.functions.invoke('financial-data', {
          body: { 
            endpoint: 'quotes',
            symbols: sortedSymbols 
          }
        });

        const fetchLatency = Date.now() - fetchStartTime.current;
        setLatency(fetchLatency);

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch market data');
        }

        if (data?.quotes && Array.isArray(data.quotes)) {
          const newQuotes: Record<string, QuoteData> = {};
          const now = Date.now();

          data.quotes.forEach((quote: QuoteData) => {
            // Update cache
            quoteCache.set(quote.symbol, { data: quote, timestamp: now });
            newQuotes[quote.symbol] = quote;

            // Trigger callback
            if (onQuoteUpdate) {
              onQuoteUpdate(quote);
            }
          });

          setQuotes(prev => ({ ...prev, ...newQuotes }));
          setLastUpdate(new Date());
          console.log('✅ [useMarketData] Updated', Object.keys(newQuotes).length, 'quotes');
        } else {
          console.warn('⚠️ [useMarketData] No quotes in response:', data);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        console.error('❌ [useMarketData] Fetch error:', errorMessage);
        setError(errorMessage);
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        setIsLoading(false);
        inflightRequests.delete(cacheKey);
      }
    })();

    inflightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [onError, onQuoteUpdate]);

  // Fetch swap rates with caching
  const fetchSwapRates = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0 || !enableSwaps) return;

    const sortedSymbols = [...symbols].sort();
    const cacheKey = `swaps:${sortedSymbols.join(',')}`;

    // Check cache first
    const now = Date.now();
    const cachedData: SwapData[] = [];
    const uncachedSymbols: string[] = [];

    sortedSymbols.forEach(symbol => {
      const cached = swapCache.get(symbol);
      if (cached && (now - cached.timestamp) < SWAP_CACHE_TTL) {
        cachedData.push(cached.data);
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    if (cachedData.length > 0) {
      const swapsMap: Record<string, SwapData> = {};
      cachedData.forEach(swap => {
        swapsMap[swap.symbol] = swap;
      });
      setSwaps(prev => ({ ...prev, ...swapsMap }));
    }

    if (uncachedSymbols.length === 0) {
      console.log('✅ [useMarketData] Using cached swaps');
      return;
    }

    // Check if we already have a request in flight
    if (inflightRequests.has(cacheKey)) {
      return inflightRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        console.log('📈 [useMarketData] Fetching swaps for:', uncachedSymbols);

        const { data, error: fetchError } = await supabase.functions.invoke('swap-rates', {
          body: { symbols: uncachedSymbols }
        });

        if (fetchError) {
          console.error('❌ [useMarketData] Swap fetch error:', fetchError);
          return;
        }

        if (data && Array.isArray(data)) {
          const newSwaps: Record<string, SwapData> = {};
          const now = Date.now();

          data.forEach((swap: SwapData) => {
            swapCache.set(swap.symbol, { data: swap, timestamp: now });
            newSwaps[swap.symbol] = swap;
          });

          setSwaps(prev => ({ ...prev, ...newSwaps }));
          console.log('✅ [useMarketData] Updated', Object.keys(newSwaps).length, 'swaps');
        }
      } catch (err) {
        console.error('❌ [useMarketData] Swap network error:', err);
      } finally {
        inflightRequests.delete(cacheKey);
      }
    })();

    inflightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [enableSwaps]);

  // Public methods
  const refresh = useCallback(async () => {
    const symbols = Array.from(activeSymbols);
    await Promise.all([
      fetchQuotes(symbols),
      enableSwaps ? fetchSwapRates(symbols) : Promise.resolve()
    ]);
  }, [activeSymbols, fetchQuotes, fetchSwapRates, enableSwaps]);

  const addSymbols = useCallback((newSymbols: string[]) => {
    setActiveSymbols(prev => {
      const updated = new Set(prev);
      newSymbols.forEach(symbol => updated.add(symbol));
      return updated;
    });
  }, []);

  const removeSymbols = useCallback((symbolsToRemove: string[]) => {
    setActiveSymbols(prev => {
      const updated = new Set(prev);
      symbolsToRemove.forEach(symbol => updated.delete(symbol));
      return updated;
    });
  }, []);

  const getQuote = useCallback((symbol: string): QuoteData | null => {
    return quotes[symbol] || null;
  }, [quotes]);

  const getSwap = useCallback((symbol: string): SwapData | null => {
    return swaps[symbol] || null;
  }, [swaps]);

  // Auto-refresh quotes
  useEffect(() => {
    const symbols = Array.from(activeSymbols);
    if (symbols.length === 0) return;

    console.log('⚡ [useMarketData] Starting auto-refresh for:', symbols, `(${refreshInterval}ms)`);

    // Initial fetch
    fetchQuotes(symbols);

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchQuotes(symbols);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSymbols, refreshInterval, fetchQuotes]);

  // Auto-refresh swaps (less frequent)
  useEffect(() => {
    if (!enableSwaps) return;

    const symbols = Array.from(activeSymbols);
    if (symbols.length === 0) return;

    console.log('📈 [useMarketData] Starting swap auto-refresh for:', symbols);

    // Initial fetch
    fetchSwapRates(symbols);

    // Set up interval (4 hours)
    swapIntervalRef.current = setInterval(() => {
      fetchSwapRates(symbols);
    }, 4 * 60 * 60 * 1000);

    return () => {
      if (swapIntervalRef.current) {
        clearInterval(swapIntervalRef.current);
      }
    };
  }, [activeSymbols, enableSwaps, fetchSwapRates]);

  return {
    quotes,
    swaps,
    isLoading,
    error,
    lastUpdate,
    latency,
    getQuote,
    getSwap,
    refresh,
    addSymbols,
    removeSymbols
  };
}
