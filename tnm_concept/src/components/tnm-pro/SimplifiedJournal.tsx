import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Download, 
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { EnhancedEquityCurve } from './EnhancedEquityCurve';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import type { Position } from '@/hooks/useRealTradingData';

export const SimplifiedJournal: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { selectedAccount, trades, closedTrades, formatCurrency } = useTradingDashboard();
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  const fetchPositions = useCallback(async (): Promise<Position[]> => {
    if (!selectedAccount) {
      return [];
    }

    const { data, error } = await supabase.functions.invoke('sync-trading-data', {
      body: {
        account_id: selectedAccount.id,
        fetch_positions: true
      }
    });

    if (error) {
      throw error;
    }

    return Array.isArray(data?.positions) ? data.positions : [];
  }, [selectedAccount?.id]);

  const loadPositions = useCallback(async () => {
    if (!selectedAccount) {
      setPositions([]);
      return;
    }

    setPositionsLoading(true);
    setPositionsError(null);

    try {
      const latestPositions = await fetchPositions();
      setPositions(latestPositions);
    } catch (error) {
      console.error('Failed to load positions:', error);
      setPositions([]);
      setPositionsError('Unable to load open positions right now.');
    } finally {
      setPositionsLoading(false);
    }
  }, [fetchPositions, selectedAccount]);

  useEffect(() => {
    if (!selectedAccount) {
      setPositions([]);
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      setPositionsLoading(true);
      setPositionsError(null);

      try {
        const latestPositions = await fetchPositions();
        if (isMounted) {
          setPositions(latestPositions);
        }
      } catch (error) {
        console.error('Failed to load positions:', error);
        if (isMounted) {
          setPositions([]);
          setPositionsError('Unable to load open positions right now.');
        }
      } finally {
        if (isMounted) {
          setPositionsLoading(false);
        }
      }
    };

    initialize();
    const interval = setInterval(initialize, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchPositions, selectedAccount]);

  if (!selectedAccount) {
    return (
      <Card className="text-center">
        <CardHeader>
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>{t('dashboard.noAccountTitle')}</CardTitle>
          <CardDescription>{t('dashboard.noAccountDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleExportCSV = () => {
    const csvHeaders = ['Date', 'Symbol', 'Direction', 'Entry', 'Exit', 'Volume', 'P&L'];
    const csvData = closedTrades.map(trade => [
      format(new Date(trade.opened_at), 'yyyy-MM-dd'),
      trade.symbol,
      trade.direction,
      trade.entry_price,
      trade.exit_price || '',
      trade.volume,
      trade.pnl || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group trades by date
  const tradesByDate = closedTrades.reduce((acc, trade) => {
    const date = format(new Date(trade.opened_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {} as Record<string, typeof closedTrades>);

  const sortedDates = Object.keys(tradesByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6" dir={rtl.dir}>
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-start">{t('journal.title')}</h2>
          <p className="text-muted-foreground text-start">{t('journal.completedTrades', { count: closedTrades.length })}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 me-2" />
          {t('journal.exportReport')}
        </Button>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">{t('journal.tabs.timeline')}</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="performance">{t('journal.tabs.performance')}</TabsTrigger>
          <TabsTrigger value="insights">{t('journal.tabs.insights')}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Timeline View */}
          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('journal.empty.noCompletedTrades')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedDates.map(date => {
                const dayTrades = tradesByDate[date];
                const dayPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                
                return (
                  <Card key={date}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-start">
                            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          </CardTitle>
                          <CardDescription className="text-sm text-start">
                            {dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <Badge variant={dayPnl >= 0 ? 'default' : 'destructive'}>
                          {dayPnl >= 0 ? '+' : ''}{formatCurrency(dayPnl)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dayTrades.map(trade => (
                        <div 
                          key={trade.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => setSelectedTrade(trade.id === selectedTrade ? null : trade.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${(trade.pnl || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="font-medium">{trade.symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                {trade.direction} • {trade.volume} lots
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(trade.pnl || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(trade.opened_at), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground text-start">Total Unrealized P&L</p>
              <p className={`text-2xl font-semibold text-start ${positions.reduce((sum, pos) => sum + (pos.profit || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(() => {
                  const total = positions.reduce((sum, pos) => sum + (pos.profit || 0), 0);
                  const formatted = formatCurrency(total);
                  return total >= 0 ? `+${formatted}` : formatted;
                })()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadPositions} disabled={positionsLoading}>
              <RefreshCw className={`h-4 w-4 me-2 ${positionsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {positionsError && (
            <Card>
              <CardContent className="text-sm text-destructive">
                {positionsError}
              </CardContent>
            </Card>
          )}

          {positionsLoading && positions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Loading open positions…</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No open positions</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-2">
                {positions.map(position => {
                  const profit = position.profit || 0;
                  const volume = typeof position.volume === 'number' ? position.volume.toFixed(2) : position.volume;
                  const entryPrice = typeof position.price_open === 'number' ? position.price_open.toFixed(5) : '-';
                  const currentPrice = typeof position.price_current === 'number' ? position.price_current.toFixed(5) : '-';
                  const direction = position.type === 0 || position.type_str === 'buy' ? 'BUY' : 'SELL';

                  return (
                    <Card key={position.ticket} className="border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={direction === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                              {direction}
                            </Badge>
                            <span className="font-semibold">{position.symbol}</span>
                          </div>
                          <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="block text-xs">Volume</span>
                            <span>{volume}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Entry</span>
                            <span>{entryPrice}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Current</span>
                            <span>{currentPrice}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Opened {position.time ? new Date(position.time).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <EnhancedEquityCurve 
            trades={closedTrades}
            initialBalance={selectedAccount.balance || 10000}
            currency={selectedAccount.currency}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 me-2" />
                  <span className="text-start">{t('journal.insights.topPerformer')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {closedTrades.length > 0 ? (
                  <div>
                    <p className="text-2xl font-bold text-start">
                      {closedTrades.reduce((max, t) => (t.pnl || 0) > (max.pnl || 0) ? t : max, closedTrades[0])?.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground text-start">
                      {t('journal.insights.mostProfitablePair')}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-start">{t('analytics.noData')}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 me-2" />
                  <span className="text-start">{t('journal.insights.improvementArea')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-start">
                  {t('journal.insights.focusPositionSizing')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
