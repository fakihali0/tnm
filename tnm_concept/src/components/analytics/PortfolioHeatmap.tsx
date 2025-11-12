import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePortfolioAnalytics, PortfolioPosition } from '@/hooks/usePortfolioAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  Shield,
  AlertTriangle,
  RefreshCw,
  Database
} from 'lucide-react';

type ViewMode = 'risk' | 'performance' | 'correlation' | 'exposure';

export function PortfolioHeatmap() {
  const { toast } = useToast();
  const { positions, totalEquity, totalExposure, isLoading, error, refreshMarketData } = usePortfolioAnalytics();
  const [viewMode, setViewMode] = useState<ViewMode>('risk');
  const [selectedCell, setSelectedCell] = useState<PortfolioPosition | null>(null);

  const getValue = (position: PortfolioPosition) => {
    switch (viewMode) {
      case 'risk': return position.risk;
      case 'performance': return position.performance;
      case 'correlation': return Math.abs(position.correlation);
      case 'exposure': return position.exposure;
      default: return 0;
    }
  };

  const getColor = (value: number, position: PortfolioPosition) => {
    switch (viewMode) {
      case 'risk':
        if (value < 0.2) return 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800';
        if (value < 0.3) return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800';
        return 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800';
      
      case 'performance':
        if (value > 2) return 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800';
        if (value > 0) return 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800';
        return 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800';
      
      case 'correlation':
        if (value < 0.3) return 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800';
        if (value < 0.7) return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800';
        return 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800';
      
      case 'exposure':
        if (value < 0.15) return 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800';
        if (value < 0.25) return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800';
        return 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800';
      
      default:
        return 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }
  };

  const formatValue = (value: number, position: PortfolioPosition) => {
    switch (viewMode) {
      case 'risk':
      case 'correlation':
      case 'exposure':
        return `${(value * 100).toFixed(1)}%`;
      case 'performance':
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const getIcon = (value: number, position: PortfolioPosition) => {
    switch (viewMode) {
      case 'risk':
        return value > 0.25 ? AlertTriangle : Shield;
      case 'performance':
        return value > 0 ? TrendingUp : TrendingDown;
      case 'correlation':
        return Activity;
      case 'exposure':
        return Target;
      default:
        return Activity;
    }
  };

  const groupedData = useMemo(() => {
    const groups = positions.reduce((acc, position) => {
      if (!acc[position.sector]) {
        acc[position.sector] = [];
      }
      acc[position.sector].push(position);
      return acc;
    }, {} as Record<string, PortfolioPosition[]>);
    
    return groups;
  }, [positions]);

  const handleRefresh = async () => {
    try {
      await refreshMarketData();
      toast({
        title: "Data Refreshed",
        description: "Portfolio data has been updated with latest market prices.",
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh market data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getViewModeConfig = () => {
    switch (viewMode) {
      case 'risk':
        return {
          title: 'Risk Distribution',
          description: 'Risk level across positions',
          icon: Shield,
          color: 'text-orange-600'
        };
      case 'performance':
        return {
          title: 'Performance Map',
          description: 'Current P&L by instrument',
          icon: TrendingUp,
          color: 'text-green-600'
        };
      case 'correlation':
        return {
          title: 'Correlation Matrix',
          description: 'Position correlation strength',
          icon: Activity,
          color: 'text-blue-600'
        };
      case 'exposure':
        return {
          title: 'Exposure Analysis',
          description: 'Portfolio exposure distribution',
          icon: Target,
          color: 'text-purple-600'
        };
      default:
        return {
          title: 'Portfolio Heatmap',
          description: 'Portfolio overview',
          icon: Activity,
          color: 'text-gray-600'
        };
    }
  };

  const config = getViewModeConfig();
  const ConfigIcon = config.icon;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Portfolio Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Portfolio Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={AlertTriangle}
            title="Error Loading Portfolio Data"
            description={error}
            action={{
              label: "Try Again",
              onClick: handleRefresh,
              variant: "outline"
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Portfolio Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Database}
            title="No Trading Positions"
            description="Connect your trading account or execute trades to see portfolio analysis here."
            action={{
              label: "Refresh Data",
              onClick: handleRefresh,
              variant: "outline"
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ConfigIcon className={`h-5 w-5 ${config.color}`} />
            <div>
              <CardTitle>{config.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Risk Analysis</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="correlation">Correlation</SelectItem>
                <SelectItem value="exposure">Exposure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <span className="text-xs text-muted-foreground">Total Equity</span>
            <div className="font-medium">${totalEquity.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Active Positions</span>
            <div className="font-medium">{positions.length}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Total Exposure</span>
            <div className="font-medium">{(totalExposure * 100).toFixed(1)}%</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">P&L</span>
            <div className={`font-medium ${positions.reduce((sum, p) => sum + p.totalPnL, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${positions.reduce((sum, p) => sum + p.totalPnL, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Heatmap Grid */}
        <div className="space-y-4">
          {Object.entries(groupedData).map(([sector, positions]) => (
            <div key={sector} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">{sector}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {positions.map((position) => {
                  const value = getValue(position);
                  const cellColor = getColor(value, position);
                  const CellIcon = getIcon(value, position);
                  
                  return (
                    <motion.div
                      key={position.symbol}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${cellColor}
                        ${selectedCell?.symbol === position.symbol ? 'ring-2 ring-primary' : ''}
                      `}
                      onClick={() => setSelectedCell(selectedCell?.symbol === position.symbol ? null : position)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{position.symbol}</span>
                          {position.openPositions > 0 && (
                            <Badge variant="secondary" className="text-xs h-4 px-1">
                              {position.openPositions}
                            </Badge>
                          )}
                        </div>
                        <CellIcon className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-bold">
                        {formatValue(value, position)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {position.tradeCount} trades
                      </div>
                      <div className={`text-xs font-medium ${position.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${position.totalPnL.toFixed(2)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Position Details */}
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-lg p-4 bg-muted/50"
          >
            <h4 className="font-medium mb-3">{selectedCell.symbol} Position Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Total Trades</span>
                <div className="font-medium">{selectedCell.tradeCount}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Open Positions</span>
                <div className="font-medium">{selectedCell.openPositions}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <div className="font-medium">{(selectedCell.winRate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total P&L</span>
                <div className={`font-medium ${selectedCell.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${selectedCell.totalPnL.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Realized P&L</span>
                <div className={`font-medium ${selectedCell.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${selectedCell.realizedPnL.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Unrealized P&L</span>
                <div className={`font-medium ${selectedCell.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${selectedCell.unrealizedPnL.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{(selectedCell.risk * 100).toFixed(1)}%</span>
                  <Badge variant={selectedCell.risk > 0.25 ? "destructive" : selectedCell.risk > 0.15 ? "secondary" : "default"}>
                    {selectedCell.risk > 0.25 ? "High" : selectedCell.risk > 0.15 ? "Medium" : "Low"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Performance</span>
                <div className={`font-medium ${selectedCell.performance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCell.performance > 0 ? '+' : ''}{selectedCell.performance.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Correlation</span>
                <span className="font-medium block">{selectedCell.correlation.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Exposure</span>
                <span className="font-medium block">{(selectedCell.exposure * 100).toFixed(1)}%</span>
              </div>
            </div>

            {selectedCell.avgWin > 0 && selectedCell.avgLoss > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Avg Win</span>
                    <div className="font-medium text-green-600">${selectedCell.avgWin.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Avg Loss</span>
                    <div className="font-medium text-red-600">${selectedCell.avgLoss.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Legend */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded"></div>
                <span className="text-xs">Low {viewMode}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-800 rounded"></div>
                <span className="text-xs">Medium {viewMode}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-200 dark:bg-red-800 rounded"></div>
                <span className="text-xs">High {viewMode}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}