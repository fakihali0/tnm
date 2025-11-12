import { useMemo } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Trade } from '@/types/trading';

interface EquityCurveEnhancedProps {
  trades: Trade[];
  currency: string;
}

interface EquityCurvePoint {
  date: string;
  equity: number;
  drawdown: number;
  maxDrawdown: number;
  isMaxDD: boolean;
  trade?: Trade;
}

export const EquityCurveEnhanced = ({ trades, currency }: EquityCurveEnhancedProps) => {
  const { chartData, maxDrawdown, maxDrawdownPeriod, currentDrawdown } = useMemo(() => {
    if (!trades.length) return { chartData: [], maxDrawdown: 0, maxDrawdownPeriod: null, currentDrawdown: 0 };

    const sortedTrades = trades
      .filter(trade => trade.closed_at && trade.pnl !== undefined)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

    let runningEquity = 0;
    let peak = 0;
    let maxDD = 0;
    let maxDDPeriod: { start: string; end: string; amount: number } | null = null;
    let currentDDStart: string | null = null;

    const points: EquityCurvePoint[] = sortedTrades.map((trade, index) => {
      runningEquity += trade.pnl!;
      
      if (runningEquity > peak) {
        peak = runningEquity;
        currentDDStart = null;
      }
      
      const drawdown = peak - runningEquity;
      if (drawdown > maxDD) {
        maxDD = drawdown;
        if (currentDDStart) {
          maxDDPeriod = {
            start: currentDDStart,
            end: trade.closed_at!,
            amount: maxDD
          };
        }
      }
      
      if (drawdown > 0 && !currentDDStart) {
        currentDDStart = trade.closed_at!;
      }

      return {
        date: new Date(trade.closed_at!).toLocaleDateString(),
        equity: runningEquity,
        drawdown: -drawdown,
        maxDrawdown: -maxDD,
        isMaxDD: drawdown === maxDD,
        trade
      };
    });

    const finalDrawdown = peak - runningEquity;

    return {
      chartData: points,
      maxDrawdown: maxDD,
      maxDrawdownPeriod: maxDDPeriod,
      currentDrawdown: finalDrawdown
    };
  }, [trades]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency || 'USD',
      minimumFractionDigits: 2
    }).format(value);

  const chartConfig = {
    equity: {
      label: "Equity",
      color: "hsl(var(--primary))",
    },
    drawdown: {
      label: "Drawdown",
      color: "hsl(var(--destructive))",
    },
  };

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No closed trades available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Enhanced Equity Curve
          <div className="flex gap-2">
            <Badge variant={currentDrawdown > 0 ? "destructive" : "default"} className="flex items-center gap-1">
              {currentDrawdown > 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              Current DD: {formatCurrency(-currentDrawdown)}
            </Badge>
            <Badge variant="outline">
              Max DD: {formatCurrency(-maxDrawdown)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              
              {/* Drawdown area */}
              <Area
                type="monotone"
                dataKey="drawdown"
                stackId="1"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.2}
              />
              
              {/* Equity line */}
              <Line
                type="monotone"
                dataKey="equity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
              
              {/* Zero line reference */}
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
              
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === 'equity' ? 'Equity' : 'Drawdown'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                }
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {maxDrawdownPeriod && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
            <div className="font-medium text-destructive mb-1">Maximum Drawdown Period</div>
            <div className="text-muted-foreground">
              {new Date(maxDrawdownPeriod.start).toLocaleDateString()} - {new Date(maxDrawdownPeriod.end).toLocaleDateString()}
              <span className="ml-2">Amount: {formatCurrency(-maxDrawdownPeriod.amount)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};