import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Trade } from '@/types/trading';

interface StreaksAnalyticsProps {
  trades: Trade[];
  currency: string;
}

interface StreakData {
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

interface RRDistribution {
  range: string;
  count: number;
  percentage: number;
}

const RR_RANGES = [
  { min: -Infinity, max: -3, label: '< -3:1' },
  { min: -3, max: -2, label: '-3 to -2' },
  { min: -2, max: -1, label: '-2 to -1' },
  { min: -1, max: 0, label: '-1 to 0' },
  { min: 0, max: 1, label: '0 to 1' },
  { min: 1, max: 2, label: '1 to 2' },
  { min: 2, max: 3, label: '2 to 3' },
  { min: 3, max: Infinity, label: '> 3:1' }
];

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))'
];

export const StreaksAnalytics = ({ trades, currency }: StreaksAnalyticsProps) => {
  const { streakData, rrDistribution } = useMemo(() => {
    if (!trades.length) {
      return {
        streakData: {
          currentWinStreak: 0,
          currentLossStreak: 0,
          longestWinStreak: 0,
          longestLossStreak: 0,
          consecutiveWins: 0,
          consecutiveLosses: 0
        },
        rrDistribution: []
      };
    }

    const sortedTrades = trades
      .filter(trade => trade.closed_at && trade.pnl !== undefined)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

    // Calculate streaks
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let consecutiveWins = 0;
    let consecutiveLosses = 0;

    // Analyze from most recent trades backwards for current streak
    for (let i = sortedTrades.length - 1; i >= 0; i--) {
      const trade = sortedTrades[i];
      const isWin = trade.pnl! > 0;
      
      if (i === sortedTrades.length - 1) {
        // Most recent trade
        if (isWin) {
          currentWinStreak = 1;
          currentLossStreak = 0;
        } else {
          currentWinStreak = 0;
          currentLossStreak = 1;
        }
      } else {
        // Continue current streak
        if (isWin && currentWinStreak > 0) {
          currentWinStreak++;
        } else if (!isWin && currentLossStreak > 0) {
          currentLossStreak++;
        } else {
          break; // Streak broken
        }
      }
    }

    // Calculate longest streaks
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    sortedTrades.forEach(trade => {
      const isWin = trade.pnl! > 0;
      
      if (isWin) {
        tempWinStreak++;
        tempLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
        consecutiveWins++;
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
        consecutiveLosses++;
      }
    });

    // Calculate R:R distribution
    const rrCounts = new Map(RR_RANGES.map(range => [range.label, 0]));
    
    sortedTrades.forEach(trade => {
      if (trade.risk_reward_ratio !== undefined) {
        const rr = trade.risk_reward_ratio;
        const range = RR_RANGES.find(r => rr >= r.min && rr < r.max);
        if (range) {
          rrCounts.set(range.label, (rrCounts.get(range.label) || 0) + 1);
        }
      }
    });

    const totalRRTrades = Array.from(rrCounts.values()).reduce((sum, count) => sum + count, 0);
    const rrDistribution: RRDistribution[] = Array.from(rrCounts.entries()).map(([range, count]) => ({
      range,
      count,
      percentage: totalRRTrades > 0 ? (count / totalRRTrades) * 100 : 0
    })).filter(item => item.count > 0);

    return {
      streakData: {
        currentWinStreak,
        currentLossStreak,
        longestWinStreak,
        longestLossStreak,
        consecutiveWins,
        consecutiveLosses
      },
      rrDistribution
    };
  }, [trades]);

  const chartConfig = {
    count: {
      label: "Trades",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Streaks Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Trading Streaks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Streaks */}
          <div className="space-y-3">
            <div className="font-medium text-sm">Current Streaks</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600">{streakData.currentWinStreak}</div>
                <div className="text-xs text-green-600/80">Current Wins</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="text-2xl font-bold text-red-600">{streakData.currentLossStreak}</div>
                <div className="text-xs text-red-600/80">Current Losses</div>
              </div>
            </div>
          </div>

          {/* Historical Bests */}
          <div className="space-y-3">
            <div className="font-medium text-sm">Historical Records</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Longest Win Streak</span>
                <Badge variant="default" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {streakData.longestWinStreak}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Longest Loss Streak</span>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {streakData.longestLossStreak}
                </Badge>
              </div>
            </div>
          </div>

          {/* Total Counts */}
          <div className="space-y-3">
            <div className="font-medium text-sm">Total Trading Activity</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded border">
                <div className="text-lg font-bold text-green-600">{streakData.consecutiveWins}</div>
                <div className="text-xs text-muted-foreground">Total Wins</div>
              </div>
              <div className="text-center p-2 rounded border">
                <div className="text-lg font-bold text-red-600">{streakData.consecutiveLosses}</div>
                <div className="text-xs text-muted-foreground">Total Losses</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* R:R Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Risk:Reward Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rrDistribution.length > 0 ? (
            <div className="space-y-4">
              {/* Bar Chart */}
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rrDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [
                            `${value} trades (${rrDistribution.find(d => d.count === value)?.percentage.toFixed(1)}%)`,
                            'Count'
                          ]}
                          labelFormatter={(label) => `R:R Range: ${label}`}
                        />
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 rounded border">
                  <div className="font-medium">Positive R:R</div>
                  <div className="text-green-600">
                    {rrDistribution
                      .filter(d => d.range.includes('1 to') || d.range.includes('2 to') || d.range.includes('> 3'))
                      .reduce((sum, d) => sum + d.percentage, 0)
                      .toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-2 rounded border">
                  <div className="font-medium">Negative R:R</div>
                  <div className="text-red-600">
                    {rrDistribution
                      .filter(d => d.range.includes('< -') || d.range.includes('-3 to') || d.range.includes('-2 to') || d.range.includes('-1 to'))
                      .reduce((sum, d) => sum + d.percentage, 0)
                      .toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No R:R data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};