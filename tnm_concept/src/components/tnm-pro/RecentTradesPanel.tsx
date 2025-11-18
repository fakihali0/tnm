/**
 * RecentTradesPanel Component
 * 
 * Displays recent closed trades with sortable columns.
 * Integrated into AIHub for quick performance review.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  History,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trade } from '@/types/trading';

interface RecentTradesPanelProps {
  accountId?: string | null;
  limit?: number;
}

export const RecentTradesPanel: React.FC<RecentTradesPanelProps> = ({ 
  accountId, 
  limit = 10 
}) => {
  const { t } = useTranslation('tnm-ai');
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'closed_at' | 'pnl' | 'symbol'>('closed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTrades();

    // Realtime subscription for trades table
    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: accountId ? `account_id=eq.${accountId}` : undefined,
        },
        () => {
          loadTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, limit]);

  const loadTrades = async () => {
    try {
      let query = supabase
        .from('trades')
        .select(`
          *,
          trading_accounts!inner(account_name, login_number, currency)
        `)
        .not('closed_at', 'is', null) // Closed trades only
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTrades(data || []);
    } catch (error: any) {
      console.error('Error loading trades:', error);
      toast({
        title: 'Failed to load trades',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTrades();
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'symbol') {
      comparison = a.symbol.localeCompare(b.symbol);
    } else if (sortBy === 'pnl') {
      comparison = (a.pnl || 0) - (b.pnl || 0);
    } else if (sortBy === 'closed_at') {
      const aTime = a.closed_at ? new Date(a.closed_at).getTime() : 0;
      const bTime = b.closed_at ? new Date(b.closed_at).getTime() : 0;
      comparison = aTime - bTime;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatVolume = (volume: number) => {
    return volume.toFixed(2);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (opened: string, closed: string) => {
    const duration = new Date(closed).getTime() - new Date(opened).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Recent Trades</CardTitle>
            {trades.length > 0 && (
              <Badge variant="secondary">{trades.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalPnL !== 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground mr-2">Total:</span>
                <span className={`font-semibold ${totalPnL > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(totalPnL)}
                </span>
              </div>
            )}
            {winRate > 0 && (
              <Badge variant="outline" className="text-xs">
                {winRate.toFixed(1)}% Win Rate
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No closed trades found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Trades will appear here after you close positions
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('pnl')}
                  >
                    P&L {sortBy === 'pnl' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('closed_at')}
                  >
                    Closed {sortBy === 'closed_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => {
                  const pnl = trade.pnl || 0;
                  const isWin = pnl > 0;

                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.direction === 'BUY' ? 'default' : 'secondary'}>
                          {trade.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatVolume(trade.volume)}</TableCell>
                      <TableCell className="text-right">{trade.entry_price.toFixed(5)}</TableCell>
                      <TableCell className="text-right">{trade.exit_price?.toFixed(5) || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isWin ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`font-medium ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(pnl, (trade as any).trading_accounts?.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {trade.closed_at && calculateDuration(trade.opened_at, trade.closed_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {trade.closed_at && formatDateTime(trade.closed_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
