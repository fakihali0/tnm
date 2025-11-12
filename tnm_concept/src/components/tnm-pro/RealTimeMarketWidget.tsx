import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarketData } from '@/hooks/useMarketData';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';

interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  timestamp: number;
  isMarketOpen: boolean;
  dataSource: string;
}

export const RealTimeMarketWidget: React.FC = () => {
  const [majorPairs] = useState([
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 
    'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP'
  ]);

  const { quotes, latency, isLoading, error } = useMarketData({
    symbols: majorPairs,
    refreshInterval: 3000, // 3 seconds for real-time widget
  });

  const isConnected = !error && Object.keys(quotes).length > 0;

  // Convert quotes object to array format
  const quotesArray = useMemo(() => {
    return majorPairs.map(symbol => quotes[symbol]).filter(Boolean);
  }, [quotes, majorPairs]);

  const formatPrice = (price: number, symbol: string) => {
    const jpyPairs = ['USDJPY', 'EURJPY', 'GBPJPY'];
    const decimals = jpyPairs.some(pair => symbol.includes('JPY')) ? 3 : 5;
    return price.toFixed(decimals);
  };

  const calculateSpread = (quote: MarketQuote) => {
    return ((quote.ask - quote.bid) * 10000).toFixed(1); // In pips
  };

  const getPriceChangeColor = (change?: number) => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Live Market Data
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? (
                <><Wifi className="h-3 w-3 mr-1" />Live</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" />Offline</>
              )}
            </Badge>
            {isConnected && latency > 0 && (
              <Badge variant="outline" className="text-xs">
                {latency}ms
              </Badge>
            )}
            {error && (
              <Badge variant="destructive" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {majorPairs.map((symbol) => {
              const quote = quotesArray.find((q: MarketQuote) => q.symbol === symbol);
              const isLoading = !quote;
              
              return (
                <div 
                  key={symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{symbol}</div>
                    {quote && !quote.isMarketOpen && (
                      <Badge variant="outline" className="text-xs">Closed</Badge>
                    )}
                    <div className={`w-2 h-2 rounded-full ${
                      quote?.isMarketOpen ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-mono">
                          {formatPrice(quote.bid, symbol)} / {formatPrice(quote.ask, symbol)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Spread: {calculateSpread(quote)} pips
                        </div>
                      </div>
                      
                      {quote.changePercent !== undefined && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          getPriceChangeColor(quote.change)
                        }`}>
                          {(quote.change || 0) >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <WifiOff className="h-4 w-4" />
              <span>{error ? 'Connection error - using cached data' : 'Market data delayed - attempting to reconnect...'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};