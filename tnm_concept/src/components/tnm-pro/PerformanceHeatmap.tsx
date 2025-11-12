import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trade } from '@/types/trading';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceHeatmapProps {
  trades: Trade[];
  currency: string;
}

interface HourData {
  hour: number;
  pnl: number;
  trades: number;
  avgPnl: number;
  winRate: number;
}

const SESSIONS = {
  Asia: { start: 21, end: 6, color: 'hsl(var(--chart-1))' },
  London: { start: 7, end: 15, color: 'hsl(var(--chart-2))' },
  NewYork: { start: 12, end: 21, color: 'hsl(var(--chart-3))' }
};

export const PerformanceHeatmap = ({ trades, currency }: PerformanceHeatmapProps) => {
  const { hourlyData, sessionStats, bestHour, worstHour } = useMemo(() => {
    if (!trades.length) return { hourlyData: [], sessionStats: {}, bestHour: null, worstHour: null };

    // Initialize hourly data
    const hourlyMap = new Map<number, { pnl: number; trades: Trade[]; wins: number }>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { pnl: 0, trades: [], wins: 0 });
    }

    // Process trades by hour
    trades
      .filter(trade => trade.closed_at && trade.pnl !== undefined)
      .forEach(trade => {
        const hour = new Date(trade.closed_at!).getHours();
        const hourData = hourlyMap.get(hour)!;
        hourData.pnl += trade.pnl!;
        hourData.trades.push(trade);
        if (trade.pnl! > 0) hourData.wins += 1;
      });

    // Convert to array and calculate metrics
    const hourlyData: HourData[] = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      pnl: data.pnl,
      trades: data.trades.length,
      avgPnl: data.trades.length > 0 ? data.pnl / data.trades.length : 0,
      winRate: data.trades.length > 0 ? (data.wins / data.trades.length) * 100 : 0
    }));

    // Calculate session statistics
    const sessionStats = Object.entries(SESSIONS).reduce((acc, [name, session]) => {
      const sessionHours = [];
      for (let h = session.start; h !== session.end; h = (h + 1) % 24) {
        sessionHours.push(h);
        if (sessionHours.length > 12) break; // Safety check for infinite loop
      }
      
      const sessionData = hourlyData.filter(h => sessionHours.includes(h.hour));
      const totalPnl = sessionData.reduce((sum, h) => sum + h.pnl, 0);
      const totalTrades = sessionData.reduce((sum, h) => sum + h.trades, 0);
      const totalWins = sessionData.reduce((sum, h) => sum + h.winRate * h.trades / 100, 0);
      
      acc[name] = {
        pnl: totalPnl,
        trades: totalTrades,
        winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
        color: session.color
      };
      
      return acc;
    }, {} as Record<string, any>);

    // Find best and worst hours
    const hoursWithTrades = hourlyData.filter(h => h.trades > 0);
    const bestHour = hoursWithTrades.reduce((best, current) => 
      current.pnl > best.pnl ? current : best, hoursWithTrades[0] || null);
    const worstHour = hoursWithTrades.reduce((worst, current) => 
      current.pnl < worst.pnl ? current : worst, hoursWithTrades[0] || null);

    return { hourlyData, sessionStats, bestHour, worstHour };
  }, [trades]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency || 'USD',
      minimumFractionDigits: 0
    }).format(value);

  const getHeatmapColor = (pnl: number, trades: number) => {
    if (trades === 0) return 'bg-muted/30';
    
    // Normalize PnL for color intensity
    const maxAbsPnl = Math.max(...hourlyData.map(h => Math.abs(h.pnl)));
    if (maxAbsPnl === 0) return 'bg-muted/30';
    
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
    
    if (pnl > 0) {
      // Green for profits
      const opacity = Math.max(0.1, intensity * 0.8);
      return `bg-green-500 bg-opacity-${Math.round(opacity * 100)}`;
    } else {
      // Red for losses
      const opacity = Math.max(0.1, intensity * 0.8);
      return `bg-red-500 bg-opacity-${Math.round(opacity * 100)}`;
    }
  };

  const getSessionColor = (hour: number) => {
    for (const [name, session] of Object.entries(SESSIONS)) {
      if (session.start <= session.end) {
        if (hour >= session.start && hour < session.end) return session.color;
      } else {
        if (hour >= session.start || hour < session.end) return session.color;
      }
    }
    return 'transparent';
  };

  if (!hourlyData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hour-of-Day Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No trade data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Hour-of-Day Performance Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Performance Summary */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(sessionStats).map(([name, stats]: [string, any]) => (
            <div key={name} className="text-center p-3 rounded-lg border">
              <div className="font-medium text-sm">{name} Session</div>
              <div className={`text-lg font-bold ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.pnl)}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.trades} trades • {stats.winRate.toFixed(0)}% win rate
              </div>
            </div>
          ))}
        </div>

        {/* 24-Hour Heatmap Grid */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Trading Hours (UTC)</div>
          <div className="grid grid-cols-12 gap-1">
            {hourlyData.map((hourData) => (
              <div
                key={hourData.hour}
                className={`
                  relative aspect-square rounded border-2 transition-all duration-200 cursor-pointer
                  hover:scale-105 hover:border-primary/50
                  ${hourData.trades > 0 
                    ? hourData.pnl >= 0 
                      ? 'bg-green-500/20 border-green-500/30' 
                      : 'bg-red-500/20 border-red-500/30'
                    : 'bg-muted/30 border-muted'
                  }
                `}
                style={{
                  borderLeftColor: getSessionColor(hourData.hour),
                  borderLeftWidth: '3px'
                }}
                title={`
                  ${hourData.hour}:00 - P&L: ${formatCurrency(hourData.pnl)}
                  Trades: ${hourData.trades}
                  Win Rate: ${hourData.winRate.toFixed(0)}%
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                  <div className="font-medium">{hourData.hour.toString().padStart(2, '0')}</div>
                  {hourData.trades > 0 && (
                    <>
                      <div className={`font-bold ${hourData.pnl >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {Math.abs(hourData.pnl) >= 1000 
                          ? `${(hourData.pnl / 1000).toFixed(1)}k`
                          : hourData.pnl.toFixed(0)
                        }
                      </div>
                      <div className="text-muted-foreground">{hourData.trades}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best/Worst Hours */}
        {bestHour && worstHour && (
          <div className="flex justify-between items-center">
            <Badge variant="default" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Best: {bestHour.hour}:00 ({formatCurrency(bestHour.pnl)})
            </Badge>
            <Badge variant="destructive" className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Worst: {worstHour.hour}:00 ({formatCurrency(worstHour.pnl)})
            </Badge>
          </div>
        )}

        {/* Session Legend */}
        <div className="flex justify-center gap-4 text-xs">
          {Object.entries(SESSIONS).map(([name, session]) => (
            <div key={name} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: session.color }}
              />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};