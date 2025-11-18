import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccountStore, useJournalStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
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
  const [positions, setPositions] = React.useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Fetch positions from database for selected account
  const fetchPositions = async (accountId: string) => {
    try {
      console.log('🔄 Fetching open positions for account:', accountId);
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .is('closed_at', null)
        .order('opened_at', { ascending: false });

      if (error) throw error;

      console.log('📩 Positions response:', data);
      if (data) {
        console.log('✅ Positions fetched successfully:', data.length);
        // Map trades to position format
        const mappedPositions = data.map(trade => ({
          ticket: parseInt(trade.external_trade_id || '0'),
          time: trade.opened_at,
          type: trade.direction === 'BUY' ? 0 : 1,
          type_str: trade.direction.toLowerCase() as 'buy' | 'sell',
          volume: trade.volume,
          symbol: trade.symbol,
          price_open: trade.entry_price,
          price_current: trade.entry_price,
          sl: trade.stop_loss || 0,
          tp: trade.take_profit || 0,
          profit: trade.pnl || 0,
          swap: trade.swap || 0,
          commission: trade.commission || 0
        }));
        setPositions(mappedPositions);
      } else {
        setPositions([]);
      }
    } catch (err) {
      console.error('❌ Error fetching positions:', err);
      setPositions([]);
    }
  };

  React.useEffect(() => {
    if (selectedAccount) {
      console.log('🔄 Loading trades and positions for account:', selectedAccount.id);
      loadTrades(selectedAccount.id);
      fetchPositions(selectedAccount.id);
    }
  }, [selectedAccount?.id, loadTrades]);

  const handleRefresh = async () => {
    if (!selectedAccount) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadTrades(selectedAccount.id),
        fetchPositions(selectedAccount.id)
      ]);
      console.log('✅ Trades and positions refreshed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSync = async () => {
    if (!selectedAccount) return;
    setIsSyncing(true);
    console.log('🔄 Starting sync for account:', selectedAccount.mt5_service_account_id);
    
    try {
      const syncResult = await syncAccount(selectedAccount.mt5_service_account_id);
      console.log('✅ Sync result:', syncResult);
      
      if (!syncResult.success) {
        console.error('❌ Sync failed:', syncResult.error);
        toast({
          title: "Sync Failed",
          description: syncResult.error || "Failed to sync trading data",
          variant: "destructive",
        });
      } else {
        console.log('✅ Sync successful, reloading trades and positions...');
        await Promise.all([
          loadTrades(selectedAccount.id),
          fetchPositions(selectedAccount.id)
        ]);
        console.log('✅ Data reloaded - Trades:', trades.length, 'Positions:', positions.length);
        
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

  // Use actual live positions from MT5
  const openPositions = positions || [];
  
  // Recent closed trades
  const recentClosedTrades = trades
    .filter(trade => trade.closed_at)
    .slice(0, 10);

  // Calculate total P&L from open positions (unrealized)
  const totalOpenPnL = openPositions.reduce((sum, position) => {
    return sum + (position.profit || 0);
  }, 0);

  // Determine if we truly have no live data to show
  const hasNoData = openPositions.length === 0 && trades.length === 0;

  // Debug logging
  React.useEffect(() => {
    console.log('📊 LivePositionsPanel - Data State:', {
      selectedAccount: selectedAccount?.id,
      totalTrades: trades.length,
      livePositions: positions?.length || 0,
      openPositions: openPositions.length,
      closedTrades: recentClosedTrades.length,
      samplePosition: positions?.[0],
      allPositions: positions
    });
  }, [trades, positions, openPositions, recentClosedTrades]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-lg">Live Trading Activity</CardTitle>
            {selectedAccount && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Account:</span>
                <Badge variant="outline" className="font-mono">
                  {selectedAccount.login_number}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{selectedAccount.broker_name}</span>
                {selectedAccount.is_default && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
                      Default
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>
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
        {hasNoData ? (
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
                      const profit = position.profit || 0;
                      
                      return (
                        <div
                          key={position.ticket}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={position.type_str === 'buy' ? 'bg-green-600' : 'bg-red-600'}>
                                {position.type_str.toUpperCase()}
                              </Badge>
                              <span className="font-semibold">{position.symbol}</span>
                            </div>
                            <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit, selectedAccount?.currency || 'USD')}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="block text-xs">Volume</span>
                              <span>{position.volume.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="block text-xs">Entry</span>
                              <span>{position.price_open.toFixed(5)}</span>
                            </div>
                            <div>
                              <span className="block text-xs">Current</span>
                              <span>{position.price_current.toFixed(5)}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Opened {new Date(position.time).toLocaleString()}
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
