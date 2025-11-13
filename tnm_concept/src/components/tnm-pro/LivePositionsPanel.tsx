import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccountStore, useJournalStore } from '@/store/auth';
import { toast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react';

export const LivePositionsPanel = () => {
  const { selectedAccount, syncAccount } = useAccountStore();
  const { trades, loadTrades } = useJournalStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    if (selectedAccount) {
      console.log('🔄 Loading trades for account:', selectedAccount.id);
      loadTrades(selectedAccount.id).then(() => {
        console.log('✅ Trades loaded from useEffect');
      });
    }
  }, [selectedAccount?.id, loadTrades]);

  const handleRefresh = async () => {
    if (!selectedAccount) return;
    setIsRefreshing(true);
    try {
      await loadTrades(selectedAccount.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSync = async () => {
    if (!selectedAccount) return;
    setIsSyncing(true);
    console.log('🔄 Starting sync for account:', selectedAccount.id);
    
    try {
      const syncResult = await syncAccount(selectedAccount.id);
      console.log('✅ Sync result:', syncResult);
      
      if (!syncResult.success) {
        console.error('❌ Sync failed:', syncResult.error);
        toast({
          title: "Sync Failed",
          description: syncResult.error || "Failed to sync trading data",
          variant: "destructive",
        });
      } else {
        console.log('✅ Sync successful, reloading trades...');
        await loadTrades(selectedAccount.id);
        console.log('✅ Trades reloaded, total trades:', trades.length);
        
        toast({
          title: "Sync Complete",
          description: "Trading data synchronized successfully",
        });
      }
    } catch (error) {
      console.error('❌ Sync exception:', error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Open positions are trades without closed_at
  const openPositions = trades.filter(trade => !trade.closed_at);
  
  // Recent closed trades
  const recentClosedTrades = trades
    .filter(trade => trade.closed_at)
    .slice(0, 10);

  // Calculate total P&L from open positions (unrealized)
  const totalOpenPnL = openPositions.reduce((sum, trade) => {
    const pnl = ((trade.exit_price || trade.entry_price) - trade.entry_price) * (trade.volume || 1);
    return sum + (trade.direction === 'BUY' ? pnl : -pnl);
  }, 0);

  // Debug logging
  React.useEffect(() => {
    console.log('📊 LivePositionsPanel - Data State:', {
      selectedAccount: selectedAccount?.id,
      totalTrades: trades.length,
      openPositions: openPositions.length,
      closedTrades: recentClosedTrades.length,
      sampleTrade: trades[0],
      allTrades: trades
    });
  }, [trades, openPositions, recentClosedTrades]);

  if (!selectedAccount) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No Account Selected</p>
          <p className="text-sm mt-2">Select an account to view positions and trades</p>
        </CardContent>
      </Card>
    );
  }

  const hasNoTrades = trades.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Trading Activity</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasNoTrades ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Trading Data Available</p>
            <p className="text-sm mb-4">Sync your account to import trading history and positions</p>
            <Button onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Trading Data
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="positions">
              Open Positions ({openPositions.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Recent Trades ({recentClosedTrades.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="mt-4">
            {openPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No open positions</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Unrealized P&L</span>
                    <span className={`text-lg font-semibold ${totalOpenPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalOpenPnL >= 0 ? '+' : ''}{formatCurrency(totalOpenPnL, selectedAccount?.currency || 'USD')}
                    </span>
                  </div>
                </div>

                {/* Positions List */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {openPositions.map((position) => {
                      const pnl = ((position.exit_price || position.entry_price) - position.entry_price) * (position.volume || 1);
                      const actualPnL = position.direction === 'BUY' ? pnl : -pnl;
                      
                      return (
                        <div
                          key={position.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={position.direction === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                                {position.direction}
                              </Badge>
                              <span className="font-semibold">{position.symbol}</span>
                            </div>
                            <span className={`font-semibold ${actualPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {actualPnL >= 0 ? '+' : ''}{formatCurrency(actualPnL, selectedAccount?.currency || 'USD')}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="block text-xs">Volume</span>
                              <span>{(position.volume || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="block text-xs">Entry</span>
                              <span>{position.entry_price.toFixed(5)}</span>
                            </div>
                            <div>
                              <span className="block text-xs">Current</span>
                              <span>{(position.exit_price || position.entry_price).toFixed(5)}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Opened {new Date(position.opened_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {recentClosedTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No trade history available</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recentClosedTrades.map((trade) => {
                    const pnl = ((trade.exit_price || 0) - trade.entry_price) * (trade.volume || 1);
                    const isProfit = trade.direction === 'BUY' ? pnl > 0 : pnl < 0;
                    const actualPnL = trade.direction === 'BUY' ? pnl : -pnl;

                    return (
                      <div
                        key={trade.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={trade.direction === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                              {trade.direction}
                            </Badge>
                            <span className="font-semibold">{trade.symbol}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isProfit ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                              {isProfit ? '+' : ''}{formatCurrency(actualPnL, selectedAccount?.currency || 'USD')}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="block text-xs">Volume</span>
                            <span>{(trade.volume || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Entry</span>
                            <span>{trade.entry_price.toFixed(5)}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Exit</span>
                            <span>{(trade.exit_price || 0).toFixed(5)}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Duration</span>
                            <span>
                              {trade.closed_at && trade.opened_at
                                ? `${Math.round((new Date(trade.closed_at).getTime() - new Date(trade.opened_at).getTime()) / 60000)}m`
                                : '-'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Closed {trade.closed_at ? new Date(trade.closed_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
