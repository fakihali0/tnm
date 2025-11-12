import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trade } from '@/types/trading';
import { Plus, Tag, TrendingUp, TrendingDown, X } from 'lucide-react';

interface StrategyManagerProps {
  trades: Trade[];
  currency: string;
  onFilterByStrategy?: (strategy: string | null) => void;
  selectedStrategy?: string | null;
}

interface StrategyStats {
  name: string;
  trades: number;
  pnl: number;
  winRate: number;
  avgRR: number;
  profitFactor: number;
}

export const StrategyManager = ({ 
  trades, 
  currency, 
  onFilterByStrategy, 
  selectedStrategy 
}: StrategyManagerProps) => {
  const [newStrategy, setNewStrategy] = useState('');
  const [showAddStrategy, setShowAddStrategy] = useState(false);

  const strategyStats = useMemo(() => {
    if (!trades.length) return [];

    // Group trades by strategy tags
    const strategyMap = new Map<string, Trade[]>();
    
    trades.forEach(trade => {
      if (trade.tags && trade.tags.length > 0) {
        trade.tags.forEach(tag => {
          if (!strategyMap.has(tag)) {
            strategyMap.set(tag, []);
          }
          strategyMap.get(tag)!.push(trade);
        });
      } else {
        // Untagged trades
        if (!strategyMap.has('Untagged')) {
          strategyMap.set('Untagged', []);
        }
        strategyMap.get('Untagged')!.push(trade);
      }
    });

    // Calculate statistics for each strategy
    const stats: StrategyStats[] = Array.from(strategyMap.entries()).map(([name, strategyTrades]) => {
      const closedTrades = strategyTrades.filter(t => t.closed_at && t.pnl !== undefined);
      const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
      const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
      
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
      
      const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length 
        : 0;
      const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
        : 0;
      
      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
      
      const avgRR = closedTrades.length > 0 
        ? closedTrades.reduce((sum, t) => sum + (t.risk_reward_ratio || 0), 0) / closedTrades.length 
        : 0;

      return {
        name,
        trades: closedTrades.length,
        pnl: totalPnl,
        winRate,
        avgRR,
        profitFactor
      };
    });

    // Sort by total PnL descending
    return stats.sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency || 'USD',
      minimumFractionDigits: 0
    }).format(value);

  const handleAddStrategy = () => {
    if (newStrategy.trim()) {
      // In a real implementation, this would add the strategy to a trade
      // For now, we'll just show it in the list if there are trades with this tag
      setNewStrategy('');
      setShowAddStrategy(false);
    }
  };

  const getStrategyColor = (pnl: number) => {
    if (pnl > 0) return 'default';
    if (pnl < 0) return 'destructive';
    return 'secondary';
  };

  const getPerformanceIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-3 w-3" />;
    if (pnl < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Strategy Performance
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddStrategy(!showAddStrategy)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Strategy */}
        {showAddStrategy && (
          <div className="flex gap-2">
            <Input
              placeholder="Strategy name..."
              value={newStrategy}
              onChange={(e) => setNewStrategy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStrategy()}
            />
            <Button onClick={handleAddStrategy} size="sm">
              Add
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddStrategy(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Strategy Filter */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedStrategy === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onFilterByStrategy?.(null)}
          >
            All Strategies
          </Badge>
          {strategyStats.map((strategy) => (
            <Badge
              key={strategy.name}
              variant={selectedStrategy === strategy.name ? "default" : "outline"}
              className="cursor-pointer flex items-center gap-1"
              onClick={() => onFilterByStrategy?.(strategy.name)}
            >
              {getPerformanceIcon(strategy.pnl)}
              {strategy.name}
              <span className="text-xs">({strategy.trades})</span>
            </Badge>
          ))}
        </div>

        {/* Strategy Statistics */}
        {strategyStats.length > 0 ? (
          <div className="space-y-3">
            {strategyStats.map((strategy) => (
              <div
                key={strategy.name}
                className={`
                  p-4 rounded-lg border transition-all cursor-pointer
                  ${selectedStrategy === strategy.name 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/30'
                  }
                `}
                onClick={() => onFilterByStrategy?.(
                  selectedStrategy === strategy.name ? null : strategy.name
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{strategy.name}</div>
                    <Badge variant={getStrategyColor(strategy.pnl)} className="flex items-center gap-1">
                      {getPerformanceIcon(strategy.pnl)}
                      {formatCurrency(strategy.pnl)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {strategy.trades} trades
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Win Rate</div>
                    <div className="font-medium">{strategy.winRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg R:R</div>
                    <div className="font-medium">{strategy.avgRR.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Profit Factor</div>
                    <div className="font-medium">
                      {strategy.profitFactor === Infinity 
                        ? '∞' 
                        : strategy.profitFactor.toFixed(2)
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <div>No strategy tags found</div>
            <div className="text-sm">Start adding tags to your trades to see strategy performance</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};