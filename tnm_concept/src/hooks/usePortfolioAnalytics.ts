import { useState, useEffect, useMemo } from 'react';
import { useRealTradingData } from './useRealTradingData';
import { supabase } from '@/integrations/supabase/client';
import { Trade, TradingAccount } from '@/types/trading';

export interface PortfolioPosition {
  symbol: string;
  sector: string;
  totalVolume: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  tradeCount: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  currentPrice: number;
  exposure: number;
  risk: number;
  correlation: number;
  performance: number;
  lastTradeDate: string;
  openPositions: number;
}

interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface UsePortfolioAnalyticsReturn {
  positions: PortfolioPosition[];
  totalEquity: number;
  totalExposure: number;
  isLoading: boolean;
  error: string | null;
  refreshMarketData: () => Promise<void>;
}

export const usePortfolioAnalytics = (): UsePortfolioAnalyticsReturn => {
  const { trades, positions: livePositions, accounts, selectedAccount, isLoading: tradesLoading } = useRealTradingData();
  const [marketQuotes, setMarketQuotes] = useState<Record<string, MarketQuote>>({});
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSectorForSymbol = (symbol: string): string => {
    if (['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF'].includes(symbol)) return 'Major Pairs';
    if (['AUDUSD', 'NZDUSD', 'USDCAD', 'EURJPY', 'GBPJPY'].includes(symbol)) return 'Minor Pairs';
    if (['EURGBP', 'EURAUD', 'GBPAUD', 'AUDCAD'].includes(symbol)) return 'Cross Pairs';
    if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('OIL')) return 'Commodities';
    if (symbol.includes('US30') || symbol.includes('SPX') || symbol.includes('NAS')) return 'Indices';
    return 'Other';
  };

  const fetchMarketData = async (symbols: string[]) => {
    if (symbols.length === 0) return;
    
    setIsLoadingMarket(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-data', {
        body: { 
          symbols: symbols.slice(0, 10), // Limit to avoid API limits
          dataType: 'quote'
        }
      });

      if (error) throw error;
      
      const quotes: Record<string, MarketQuote> = {};
      if (data?.quotes) {
        Object.entries(data.quotes).forEach(([symbol, quote]: [string, any]) => {
          quotes[symbol] = {
            symbol,
            price: quote.regularMarketPrice || quote.bid || 1,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0
          };
        });
      }
      
      setMarketQuotes(quotes);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data');
    } finally {
      setIsLoadingMarket(false);
    }
  };

  const refreshMarketData = async () => {
    const symbols = Array.from(new Set(trades.map(trade => trade.symbol)));
    await fetchMarketData(symbols);
  };

  const positions = useMemo(() => {
    // Prioritize live positions from MT5, fallback to trades-based calculation
    if (livePositions && livePositions.length > 0) {
      console.log('📊 Using live MT5 positions:', livePositions.length);
      
      const totalAccountEquity = selectedAccount?.equity || selectedAccount?.balance || 100000;
      
      // Group live positions by symbol for aggregation
      const positionMap = new Map<string, {
        positions: typeof livePositions;
        totalVolume: number;
        totalProfit: number;
      }>();
      
      livePositions.forEach(pos => {
        if (!positionMap.has(pos.symbol)) {
          positionMap.set(pos.symbol, {
            positions: [],
            totalVolume: 0,
            totalProfit: 0
          });
        }
        
        const group = positionMap.get(pos.symbol)!;
        group.positions.push(pos);
        group.totalVolume += pos.volume * pos.price_open;
        group.totalProfit += pos.profit;
      });
      
      // Get historical trades for win rate calculations
      const tradesBySymbol = new Map<string, Trade[]>();
      trades.forEach(trade => {
        if (!tradesBySymbol.has(trade.symbol)) {
          tradesBySymbol.set(trade.symbol, []);
        }
        tradesBySymbol.get(trade.symbol)!.push(trade);
      });
      
      return Array.from(positionMap.entries()).map(([symbol, { positions: symbolPositions, totalVolume, totalProfit }]) => {
        const historicalTrades = tradesBySymbol.get(symbol) || [];
        const closedTrades = historicalTrades.filter(t => t.trade_status === 'closed');
        const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
        const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
        
        const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
        const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length) : 0;
        const realizedPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        
        const exposure = totalVolume / totalAccountEquity;
        
        // Calculate risk from stop losses
        const risk = symbolPositions.reduce((maxRisk, pos) => {
          if (!pos.sl || pos.sl === 0) return maxRisk;
          const stopDistance = Math.abs(pos.price_open - pos.sl);
          const positionRisk = (stopDistance * pos.volume) / totalAccountEquity;
          return Math.max(maxRisk, positionRisk);
        }, 0);
        
        const currentPrice = symbolPositions[0]?.price_current || 1;
        const performance = totalVolume > 0 ? (totalProfit / totalVolume) * 100 : 0;
        
        // Get most recent position time
        const lastPositionTime = symbolPositions.reduce((latest, pos) => {
          return pos.time > latest ? pos.time : latest;
        }, symbolPositions[0]?.time || '');
        
        return {
          symbol,
          sector: getSectorForSymbol(symbol),
          totalVolume,
          realizedPnL,
          unrealizedPnL: totalProfit,
          totalPnL: realizedPnL + totalProfit,
          tradeCount: historicalTrades.length,
          winRate,
          avgWin,
          avgLoss,
          currentPrice,
          exposure: Math.min(exposure, 1),
          risk: Math.min(risk, 1),
          correlation: 0.5, // Default correlation
          performance,
          lastTradeDate: lastPositionTime,
          openPositions: symbolPositions.length
        };
      }).sort((a, b) => Math.abs(b.totalPnL) - Math.abs(a.totalPnL));
    }

    // Fallback: Calculate from historical trades if no live positions
    if (!trades.length) return [];

    const positionMap = new Map<string, {
      trades: Trade[];
      openTrades: Trade[];
      closedTrades: Trade[];
    }>();

    // Group trades by symbol
    trades.forEach(trade => {
      if (!positionMap.has(trade.symbol)) {
        positionMap.set(trade.symbol, {
          trades: [],
          openTrades: [],
          closedTrades: []
        });
      }
      
      const position = positionMap.get(trade.symbol)!;
      position.trades.push(trade);
      
      if (trade.trade_status === 'open') {
        position.openTrades.push(trade);
      } else if (trade.trade_status === 'closed') {
        position.closedTrades.push(trade);
      }
    });

    const totalAccountEquity = selectedAccount?.equity || selectedAccount?.balance || 100000;

    return Array.from(positionMap.entries()).map(([symbol, { trades, openTrades, closedTrades }]) => {
      // Calculate realized P&L from closed trades
      const realizedPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      
      // Calculate unrealized P&L from open trades
      const currentPrice = marketQuotes[symbol]?.price || 1;
      const unrealizedPnL = openTrades.reduce((sum, trade) => {
        if (!trade.entry_price) return sum;
        const direction = trade.direction === 'buy' ? 1 : -1;
        const priceDiff = (currentPrice - trade.entry_price) * direction;
        return sum + (priceDiff * trade.volume);
      }, 0);

      const totalPnL = realizedPnL + unrealizedPnL;
      const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
      const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
      
      const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
      const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length) : 0;
      
      // Calculate total volume exposure
      const totalVolume = openTrades.reduce((sum, trade) => sum + (trade.volume * (trade.entry_price || 1)), 0);
      const exposure = totalVolume / totalAccountEquity;
      
      // Risk calculation based on stop loss distance and position size
      const risk = openTrades.reduce((maxRisk, trade) => {
        if (!trade.stop_loss || !trade.entry_price) return maxRisk;
        const stopDistance = Math.abs(trade.entry_price - trade.stop_loss);
        const positionRisk = (stopDistance * trade.volume) / totalAccountEquity;
        return Math.max(maxRisk, positionRisk);
      }, 0);

      // Simple correlation calculation (based on trading frequency compared to other symbols)
      const tradingFrequency = trades.length;
      const avgFrequency = Array.from(positionMap.values()).reduce((sum, pos) => sum + pos.trades.length, 0) / positionMap.size;
      const correlation = Math.min(tradingFrequency / (avgFrequency || 1), 1);

      // Performance as percentage return
      const performance = totalVolume > 0 ? (totalPnL / totalVolume) * 100 : 0;

      const lastTrade = trades.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())[0];

      return {
        symbol,
        sector: getSectorForSymbol(symbol),
        totalVolume,
        realizedPnL,
        unrealizedPnL,
        totalPnL,
        tradeCount: trades.length,
        winRate,
        avgWin,
        avgLoss,
        currentPrice,
        exposure: Math.min(exposure, 1), // Cap at 100%
        risk: Math.min(risk, 1), // Cap at 100%
        correlation: Math.min(correlation, 1), // Cap at 100%
        performance,
        lastTradeDate: lastTrade?.opened_at || '',
        openPositions: openTrades.length
      };
    }).sort((a, b) => Math.abs(b.totalPnL) - Math.abs(a.totalPnL)); // Sort by total P&L
  }, [trades, livePositions, marketQuotes, selectedAccount]);

  const totalEquity = selectedAccount?.equity || selectedAccount?.balance || 0;
  const totalExposure = positions.reduce((sum, pos) => sum + pos.exposure, 0);

  // Fetch market data when symbols change
  useEffect(() => {
    const symbols = Array.from(new Set(trades.map(trade => trade.symbol)));
    if (symbols.length > 0) {
      fetchMarketData(symbols);
    }
  }, [trades]);

  return {
    positions,
    totalEquity,
    totalExposure,
    isLoading: tradesLoading || isLoadingMarket,
    error,
    refreshMarketData
  };
};