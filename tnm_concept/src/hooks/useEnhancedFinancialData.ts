/**
 * @deprecated Use `useMarketData` instead for unified market data functionality
 * @see src/hooks/useMarketData.ts
 * 
 * This hook attempted WebSocket connections that don't actually work.
 * Use useMarketData with HTTP polling for reliable real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

console.warn('⚠️ useEnhancedFinancialData is deprecated. Please migrate to useMarketData.');

export interface EnhancedQuoteData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'post-market';
}

export interface MarketSession {
  name: string;
  open: string;
  close: string;
  timezone: string;
  isActive: boolean;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  reconnectAttempts: number;
  latency: number;
}

export function useEnhancedFinancialData() {
  const [quotes, setQuotes] = useState<Map<string, EnhancedQuoteData>>(new Map());
  const [marketSessions, setMarketSessions] = useState<MarketSession[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastUpdate: null,
    reconnectAttempts: 0,
    latency: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const subscribedSymbols = useRef<Set<string>>(new Set());

  // Market hours detection
  const getMarketStatus = useCallback((symbol: string): EnhancedQuoteData['marketStatus'] => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // Forex market (24/5)
    if (symbol.length === 6) {
      const dayOfWeek = now.getUTCDay();
      const isFridayAfterClose = dayOfWeek === 5 && utcHour >= 22;
      const isSundayBeforeOpen = dayOfWeek === 0 && utcHour < 22;
      const isWeekend = dayOfWeek === 6 || isFridayAfterClose || isSundayBeforeOpen;
      
      return isWeekend ? 'closed' : 'open';
    }
    
    // Stock markets (example: US market 9:30-16:00 EST)
    const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
    if (isWeekend) return 'closed';
    
    // US market hours in UTC (14:30-21:00)
    if (utcHour >= 14 && utcHour < 21) return 'open';
    if (utcHour >= 13 && utcHour < 14) return 'pre-market';
    if (utcHour >= 21 && utcHour < 23) return 'post-market';
    
    return 'closed';
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `wss://edzkorfdixvvvrkfzqzg.functions.supabase.co/functions/v1/real-time-market-data`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('📡 WebSocket connected for market data');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          reconnectAttempts: 0
        }));
        
        // Subscribe to symbols
        subscribedSymbols.current.forEach(symbol => {
          wsRef.current?.send(JSON.stringify({
            action: 'subscribe',
            symbol
          }));
        });

        // Start ping/pong for latency monitoring
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const pingTime = Date.now();
            wsRef.current.send(JSON.stringify({
              action: 'ping',
              timestamp: pingTime
            }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            const latency = Date.now() - data.timestamp;
            setConnectionStatus(prev => ({ ...prev, latency }));
            return;
          }

          if (data.type === 'quote_update') {
            const enhancedQuote: EnhancedQuoteData = {
              ...data.quote,
              marketStatus: getMarketStatus(data.quote.symbol),
              timestamp: Date.now()
            };
            
            setQuotes(prev => new Map(prev.set(data.quote.symbol, enhancedQuote)));
            setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('📡 WebSocket disconnected');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          reconnectAttempts: prev.reconnectAttempts + 1
        }));
        
        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error - attempting to reconnect...');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to establish real-time connection');
    }
  }, [getMarketStatus, connectionStatus.reconnectAttempts]);

  // Fetch quotes (fallback to REST API)
  const fetchQuotes = useCallback(async (symbols: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('real-time-market-data', {
        body: { symbols, dataType: 'quotes' }
      });

      if (fetchError) throw fetchError;

      if (data?.quotes) {
        const quotesMap = new Map<string, EnhancedQuoteData>();
        data.quotes.forEach((quote: any) => {
          quotesMap.set(quote.symbol, {
            ...quote,
            marketStatus: getMarketStatus(quote.symbol),
            timestamp: Date.now()
          });
        });
        setQuotes(quotesMap);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      toast({
        title: "Market Data Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [getMarketStatus]);

  // Subscribe to symbols for real-time updates
  const subscribeToSymbols = useCallback((symbols: string[]) => {
    symbols.forEach(symbol => subscribedSymbols.current.add(symbol));
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      symbols.forEach(symbol => {
        wsRef.current?.send(JSON.stringify({
          action: 'subscribe',
          symbol
        }));
      });
    } else {
      // Fallback to periodic fetching if WebSocket not available
      fetchQuotes(symbols);
      const interval = setInterval(() => fetchQuotes(symbols), 10000);
      return () => clearInterval(interval);
    }
  }, [fetchQuotes]);

  // Get current market sessions
  const getCurrentMarketSessions = useCallback(() => {
    const sessions: MarketSession[] = [
      {
        name: 'Tokyo',
        open: '00:00',
        close: '09:00',
        timezone: 'UTC',
        isActive: false
      },
      {
        name: 'London',
        open: '08:00',
        close: '17:00',
        timezone: 'UTC',
        isActive: false
      },
      {
        name: 'New York',
        open: '13:00',
        close: '22:00',
        timezone: 'UTC',
        isActive: false
      }
    ];

    const now = new Date();
    const utcHour = now.getUTCHours();
    
    sessions.forEach(session => {
      const openHour = parseInt(session.open.split(':')[0]);
      const closeHour = parseInt(session.close.split(':')[0]);
      session.isActive = utcHour >= openHour && utcHour < closeHour;
    });

    setMarketSessions(sessions);
    return sessions;
  }, []);

  // Initialize connection and market sessions
  useEffect(() => {
    connectWebSocket();
    getCurrentMarketSessions();
    
    // Update market sessions every minute
    const sessionInterval = setInterval(getCurrentMarketSessions, 60000);
    
    return () => {
      clearInterval(sessionInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      wsRef.current?.close();
    };
  }, [connectWebSocket, getCurrentMarketSessions]);

  // Get quote for specific symbol
  const getQuote = useCallback((symbol: string) => {
    return quotes.get(symbol) || null;
  }, [quotes]);

  // Calculate price change color
  const getPriceChangeColor = useCallback((change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  }, []);

  return {
    quotes: Array.from(quotes.values()),
    marketSessions,
    connectionStatus,
    isLoading,
    error,
    fetchQuotes,
    subscribeToSymbols,
    getQuote,
    getPriceChangeColor,
    getCurrentMarketSessions
  };
}