import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Brain } from 'lucide-react';
import { Trade } from '@/types/trading';

interface EquityPoint {
  date: string;
  equity: number;
  dailyPnl: number;
  cumulativePnl: number;
  drawdown: number;
  prediction?: number;
  confidence?: number;
}

interface EnhancedEquityCurveProps {
  trades: Trade[];
  initialBalance: number;
  currency: string;
}

// Hoist helper functions to avoid TDZ issues
function calculateProfitFactor(trades: Trade[]): number {
  const profits = trades.filter(t => t.pnl && t.pnl > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
  const losses = Math.abs(trades.filter(t => t.pnl && t.pnl < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
  return losses > 0 ? profits / losses : profits > 0 ? 999 : 0;
}

function calculateSharpeRatio(data: EquityPoint[]): number {
  if (data.length < 2) return 0;
  const returns = data.slice(1).map((point, i) => 
    (point.equity - data[i].equity) / data[i].equity
  );
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev > 0 ? (avgReturn * Math.sqrt(252)) / (stdDev * Math.sqrt(252)) : 0;
}

export function EnhancedEquityCurve({ trades, initialBalance = 10000, currency }: EnhancedEquityCurveProps) {
  const { localizePath } = useLocalizedPath();
  
  const { equityData, analytics, predictions } = useMemo(() => {
    if (trades.length === 0) {
      return { equityData: [], analytics: null, predictions: [] };
    }

    // Filter out trades without closed_at date and sort by date
    const sortedTrades = [...trades]
      .filter(t => t.closed_at)
      .sort((a, b) => 
        new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime()
      );
    
    if (sortedTrades.length === 0) {
      return { equityData: [], analytics: null, predictions: [] };
    }

    // Calculate equity curve data
    const data: EquityPoint[] = [];
    let runningBalance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;

    sortedTrades.forEach((trade, index) => {
      const tradeDate = new Date(trade.closed_at!);
      runningBalance += trade.pnl || 0;
      
      // Update peak and calculate drawdown
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const currentDrawdown = ((peak - runningBalance) / peak) * 100;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }

      data.push({
        date: tradeDate.toISOString().split('T')[0],
        equity: runningBalance,
        dailyPnl: trade.pnl,
        cumulativePnl: runningBalance - initialBalance,
        drawdown: currentDrawdown
      });
    });

    // Generate AI predictions (last 30 days)
    const lastDate = new Date(data[data.length - 1]?.date || new Date());
    const predictionData: EquityPoint[] = [];
    
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      // Simple trend-based prediction with volatility
      const recentTrend = data.slice(-10).reduce((sum, point, idx, arr) => {
        if (idx === 0) return 0;
        return sum + (point.equity - arr[idx - 1].equity);
      }, 0) / 9;

      const baseEquity = data[data.length - 1].equity;
      const trendPrediction = baseEquity + (recentTrend * i);
      const volatility = Math.random() * 200 - 100; // Random volatility
      const predictedEquity = trendPrediction + volatility;
      
      predictionData.push({
        date: futureDate.toISOString().split('T')[0],
        equity: baseEquity,
        dailyPnl: 0,
        cumulativePnl: predictedEquity - initialBalance,
        drawdown: 0,
        prediction: predictedEquity,
        confidence: Math.max(0.3, 0.9 - (i * 0.02)) // Decreasing confidence
      });
    }

    // Calculate analytics
    const totalReturn = ((runningBalance - initialBalance) / initialBalance) * 100;
    const winningTrades = sortedTrades.filter(t => t.pnl > 0).length;
    const winRate = (winningTrades / sortedTrades.length) * 100;
    
    const analytics = {
      totalReturn,
      maxDrawdown,
      winRate,
      currentEquity: runningBalance,
      peakEquity: peak,
      totalTrades: sortedTrades.length,
      profitFactor: calculateProfitFactor(sortedTrades),
      sharpeRatio: calculateSharpeRatio(data),
      recoveryFactor: maxDrawdown > 0 ? totalReturn / maxDrawdown : 0
    };

    return { equityData: data, analytics, predictions: predictionData };
  }, [trades, initialBalance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (equityData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Enhanced Equity Curve
          </CardTitle>
          <CardDescription>AI-powered equity analysis with predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No trading data available for equity curve analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  const combinedData = [...equityData, ...predictions];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Enhanced Equity Curve
            </CardTitle>
            <CardDescription>AI-powered equity analysis with 30-day predictions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={analytics?.totalReturn >= 0 ? "default" : "destructive"}>
              {analytics?.totalReturn >= 0 ? '+' : ''}{analytics?.totalReturn.toFixed(2)}%
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI Enhanced
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Analytics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(analytics?.currentEquity || 0)}</div>
            <div className="text-sm text-muted-foreground">Current Equity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.maxDrawdown.toFixed(2)}%</div>
            <div className="text-sm text-muted-foreground">Max Drawdown</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.profitFactor.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Profit Factor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.sharpeRatio.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
          </div>
        </div>

        {/* Equity Curve Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'equity' ? 'Actual Equity' : 'Predicted Equity'
                ]}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <ReferenceLine 
                y={initialBalance} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5" 
              />
              <Line 
                type="monotone" 
                dataKey="equity" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="prediction" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-medium">AI Analysis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {analytics?.totalReturn >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span>
                {analytics?.totalReturn >= 0 ? 'Positive' : 'Negative'} trend detected with{' '}
                {analytics?.winRate.toFixed(1)}% win rate
              </span>
            </div>
            <div className="flex items-center gap-2">
              {analytics?.maxDrawdown > 15 ? (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              ) : (
                <Target className="h-4 w-4 text-green-500" />
              )}
              <span>
                {analytics?.maxDrawdown > 15 ? 'High' : 'Moderate'} risk profile with{' '}
                {analytics?.recoveryFactor.toFixed(2)} recovery factor
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm">
            Export Chart
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={localizePath('/tnm-ai#ai-hub')}>AI Recommendations</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}