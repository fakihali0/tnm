/**
 * @deprecated Use `useMarketData` instead for better performance and features
 * @see src/hooks/useMarketData.ts
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

console.warn('⚠️ useRealTimeQuotes is deprecated. Please migrate to useMarketData for better performance.');

interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  change?: number;
  changePercent?: number;
  timestamp: number;
  isMarketOpen: boolean;
  dataSource: string;
}

interface UseRealTimeQuotesReturn {
  quotes: Record<string, Quote>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  latency: number;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  reconnect: () => void;
}

export const useRealTimeQuotes = (): UseRealTimeQuotesReturn => {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState(0);
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTime = useRef<number>(0);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Create WebSocket connection to our edge function
      wsRef.current = new WebSocket(
        'wss://edzkorfdixvvvrkfzqzg.functions.supabase.co/real-time-market-data'
      );

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        
        // Subscribe to previously subscribed symbols
        if (subscribedSymbols.size > 0) {
          const symbols = Array.from(subscribedSymbols);
          wsRef.current?.send(JSON.stringify({
            type: 'subscribe',
            symbols
          }));
        }

        // Start ping/pong for latency measurement
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            lastPingTime.current = Date.now();
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 5000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            setLatency(Date.now() - lastPingTime.current);
            return;
          }
          
          if (data.type === 'quote' || Array.isArray(data)) {
            const quotesArray = Array.isArray(data) ? data : [data];
            
            setQuotes(prev => {
              const newQuotes = { ...prev };
              quotesArray.forEach((quote: Quote) => {
                if (quote.symbol) {
                  // Calculate change if we have previous data
                  const prevQuote = prev[quote.symbol];
                  if (prevQuote) {
                    const currentPrice = (quote.bid + quote.ask) / 2;
                    const prevPrice = (prevQuote.bid + prevQuote.ask) / 2;
                    quote.change = currentPrice - prevPrice;
                    quote.changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
                  }
                  newQuotes[quote.symbol] = quote;
                }
              });
              return newQuotes;
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
        setIsConnected(false);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsLoading(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect after 3 seconds if not closed intentionally
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to connect');
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const subscribe = (symbols: string[]) => {
    const newSymbols = new Set([...subscribedSymbols, ...symbols]);
    setSubscribedSymbols(newSymbols);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));
    }
  };

  const unsubscribe = (symbols: string[]) => {
    const newSymbols = new Set(subscribedSymbols);
    symbols.forEach(symbol => newSymbols.delete(symbol));
    setSubscribedSymbols(newSymbols);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        symbols
      }));
    }
  };

  const reconnect = () => {
    disconnect();
    setTimeout(connect, 1000);
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return disconnect;
  }, []);

  // Fallback to HTTP polling if WebSocket fails
  useEffect(() => {
    if (!isConnected && subscribedSymbols.size > 0) {
      const fetchQuotes = async () => {
        try {
          const symbols = Array.from(subscribedSymbols);
          const { data, error } = await supabase.functions.invoke('real-time-market-data', {
            body: { symbols }
          });

          if (error) throw error;

          if (data && Array.isArray(data)) {
            setQuotes(prev => {
              const newQuotes = { ...prev };
              data.forEach((quote: Quote) => {
                if (quote.symbol) {
                  newQuotes[quote.symbol] = quote;
                }
              });
              return newQuotes;
            });
          }
        } catch (err) {
          console.error('Error fetching quotes via HTTP:', err);
        }
      };

      const interval = setInterval(fetchQuotes, 2000);
      return () => clearInterval(interval);
    }
  }, [isConnected, subscribedSymbols]);

  return {
    quotes,
    isConnected,
    isLoading,
    error,
    latency,
    subscribe,
    unsubscribe,
    reconnect
  };
};