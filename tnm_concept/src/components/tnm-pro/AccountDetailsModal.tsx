import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle 
} from 'lucide-react';
import { LinkedAccount } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface AccountDetailsModalProps {
  account: LinkedAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SyncLog {
  id: string;
  sync_type: string;
  started_at: string;
  completed_at: string;
  status: 'success' | 'failed' | 'partial';
  trades_synced: number;
  error_message?: string;
}

interface AccountStats {
  openPositions: number;
  recentTrades: number;
  totalPnL: number;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  account,
  open,
  onOpenChange,
}) => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<AccountStats>({ openPositions: 0, recentTrades: 0, totalPnL: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && account) {
      loadAccountDetails();
    }
  }, [open, account]);

  const loadAccountDetails = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      // Load sync logs
      const { data: logsData } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('account_id', account.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (logsData) {
        setSyncLogs(logsData);
      }

      // Load account stats
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', account.id);

      if (tradesData) {
        const openPositions = tradesData.filter(t => t.trade_status === 'open').length;
        const recentTrades = tradesData.length;
        const totalPnL = tradesData.reduce((sum, t) => sum + (t.pnl || 0), 0);
        
        setStats({ openPositions, recentTrades, totalPnL });
      }
    } catch (error) {
      console.error('Error loading account details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Account Details - {account.platform}
          </DialogTitle>
          <DialogDescription>
            {account.broker_name} • {account.server} • Login: {account.login}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Account Metrics */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Account Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      Balance
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(account.balance || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Equity
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(account.equity || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Activity className="h-4 w-4" />
                      Margin
                    </div>
                    <div className="text-xl font-semibold">{formatCurrency(account.margin || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <BarChart3 className="h-4 w-4" />
                      Margin Level
                    </div>
                    <div className="text-xl font-semibold">
                      {account.margin_level ? `${account.margin_level.toFixed(2)}%` : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Trading Statistics */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Trading Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.openPositions}</div>
                  <div className="text-xs text-muted-foreground mt-1">Open Positions</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.recentTrades}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Trades</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.totalPnL)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Total P&L</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Account Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leverage:</span>
                  <span className="font-medium">1:{account.leverage || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Free Margin:</span>
                  <span className="font-medium">{formatCurrency(account.free_margin || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium">{account.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={account.is_active ? 'default' : 'secondary'}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connected:</span>
                  <span className="font-medium">{new Date(account.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sync History */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Recent Sync History</h3>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Loading sync history...
                </div>
              ) : syncLogs.length > 0 ? (
                <div className="space-y-2">
                  {syncLogs.map((log) => (
                    <Card key={log.id} className="bg-muted/50">
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {getSyncStatusIcon(log.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium capitalize">{log.sync_type}</span>
                                <Badge 
                                  variant={log.status === 'success' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {log.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(log.completed_at), { addSuffix: true })}
                                {log.trades_synced > 0 && ` • ${log.trades_synced} trades synced`}
                              </div>
                              {log.error_message && (
                                <div className="text-xs text-red-600 mt-1 break-words">
                                  {log.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No sync history available
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
