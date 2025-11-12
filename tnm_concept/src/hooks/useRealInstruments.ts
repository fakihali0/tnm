import { useState, useEffect, useMemo } from 'react';
import { mockInstruments, type InstrumentData } from '@/data/instruments';
import { supabase } from '@/integrations/supabase/client';

export interface RealInstrumentData extends Omit<InstrumentData, 'currentPrice' | 'priceChange'> {
  currentPrice: {
    bid: number;
    ask: number;
    timestamp: number;
    spread?: number;
  };
  priceChange: {
    absolute: number;
    percentage: number;
  };
  isLive: boolean;
  lastUpdate: Date;
}

export function useRealInstruments() {
  const [instruments, setInstruments] = useState<RealInstrumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Get all symbols from mock instruments
  const allSymbols = useMemo(() => 
    mockInstruments.map(inst => inst.symbol), 
    []
  );

  // Fetch real-time quotes using financial-data function
  useEffect(() => {
    let isActive = true; // Prevent state updates after unmount
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchRealTimeData = async () => {
      if (!isActive) return;
      
      if (allSymbols.length === 0) {
        setInstruments([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Set up timeout handler
      timeoutId = setTimeout(() => {
        if (!isActive) return;
        console.warn('🕐 [useRealInstruments] Request timeout (30s) - falling back to mock data');
        setError('Connection timeout - using cached data');
        setFallbackInstruments();
        setIsLoading(false);
        timeoutId = null;
      }, 30000);

      try {
        const symbolsParam = allSymbols.join(',');
        console.log('🚀 [useRealInstruments] Fetching quotes for:', symbolsParam);
        
        const { data, error: funcError } = await supabase.functions.invoke('financial-data', {
          body: { symbols: allSymbols }
        });

        // Clear timeout if request completed
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!isActive) return; // Component unmounted during request

        if (funcError) {
          console.error('❌ [useRealInstruments] Financial data error:', funcError);
          setFallbackInstruments();
          setError('Using cached data - live prices temporarily unavailable');
          setIsLoading(false);
          return;
        }

        console.log('📡 [useRealInstruments] Financial data response:', data);

        if (data && Array.isArray(data) && data.length > 0) {
          const quotesMap: { [symbol: string]: any } = {};
          data.forEach((quote: any) => {
            if (quote && quote.symbol) {
              quotesMap[quote.symbol] = quote;
            }
          });

          const enrichedInstruments: RealInstrumentData[] = mockInstruments.map(mockInst => {
            const liveQuote = quotesMap[mockInst.symbol];
            
            if (liveQuote && typeof liveQuote.bid === 'number' && typeof liveQuote.ask === 'number') {
              const currentBid = liveQuote.bid;
              const currentAsk = liveQuote.ask;
              const spread = currentAsk - currentBid;
              
              const mockPrice = mockInst.currentPrice?.bid || mockInst.currentPrice?.ask || currentBid;
              const priceChange = mockPrice > 0 ? {
                absolute: currentBid - mockPrice,
                percentage: ((currentBid - mockPrice) / mockPrice) * 100
              } : { absolute: 0, percentage: 0 };

              console.log(`💰 [useRealInstruments] Live data for ${mockInst.symbol}:`, {
                bid: currentBid,
                ask: currentAsk,
                spread,
                dataSource: liveQuote.dataSource
              });

              return {
                ...mockInst,
                currentPrice: {
                  bid: currentBid,
                  ask: currentAsk,
                  timestamp: liveQuote.timestamp || Date.now(),
                  spread: spread
                },
                priceChange,
                isLive: true,
                lastUpdate: new Date(liveQuote.timestamp || Date.now()),
                isMarketOpen: liveQuote.isMarketOpen !== undefined ? liveQuote.isMarketOpen : mockInst.isMarketOpen
              };
            } else {
              console.log(`📋 [useRealInstruments] No live data for ${mockInst.symbol}, using mock`);
              return {
                ...mockInst,
                currentPrice: {
                  bid: mockInst.currentPrice?.bid ?? 0,
                  ask: mockInst.currentPrice?.ask ?? 0,
                  timestamp: Date.now(),
                  spread: 0
                },
                priceChange: mockInst.priceChange ?? { absolute: 0, percentage: 0 },
                isLive: false,
                lastUpdate: new Date()
              };
            }
          });

          if (isActive) {
            setInstruments(enrichedInstruments);
            console.log(`✅ [useRealInstruments] Successfully processed ${enrichedInstruments.length} instruments`);
          }
        } else {
          console.warn('⚠️ [useRealInstruments] Invalid data format or empty response:', data);
          setFallbackInstruments();
          setError('Invalid data format received - using cached data');
        }
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (!isActive) return;
        
        console.error('💥 [useRealInstruments] Network error:', err);
        setFallbackInstruments();
        setError(err instanceof Error ? err.message : 'Network error - using cached data');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    const setFallbackInstruments = () => {
      setInstruments(prev => mockInstruments.map(mockInst => {
        const prevInst = prev?.find(p => p.symbol === mockInst.symbol);
        return {
          ...mockInst,
          currentPrice: prevInst?.currentPrice ?? {
            bid: mockInst.currentPrice?.bid ?? 0,
            ask: mockInst.currentPrice?.ask ?? 0,
            timestamp: Date.now(),
            spread: 0
          },
          priceChange: prevInst?.priceChange ?? (mockInst.priceChange ?? { absolute: 0, percentage: 0 }),
          isLive: false,
          lastUpdate: new Date()
        };
      }));
    };

    // Initial fetch
    fetchRealTimeData();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      if (isActive) fetchRealTimeData();
    }, 30000);

    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [allSymbols, refreshTick]);

  // Filter and search functions
  const getInstrumentsByCategory = (category: string): RealInstrumentData[] => {
    if (category === 'all') return instruments;
    return instruments.filter(inst => inst.assetClass.toLowerCase() === category.toLowerCase());
  };

  const searchInstruments = (query: string): RealInstrumentData[] => {
    if (!query.trim()) return instruments;
    const lowercaseQuery = query.toLowerCase();
    return instruments.filter(inst => 
      inst.symbol.toLowerCase().includes(lowercaseQuery) ||
      inst.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getCategoryCounts = (): { [key: string]: number } => {
    const counts: { [key: string]: number } = { all: instruments.length };
    instruments.forEach(inst => {
      const category = inst.assetClass.toLowerCase();
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  };

  // Manual refetch method
  const refetch = () => {
    console.log('🔄 [useRealInstruments] Manual refetch triggered');
    setRefreshTick(t => t + 1);
    setIsLoading(true);
    setError(null);
  };

  return {
    instruments,
    isLoading,
    error,
    refetch,
    getInstrumentsByCategory,
    searchInstruments,
    getCategoryCounts,
    // Maintain compatibility with existing code
    mockInstruments: instruments
  };
}