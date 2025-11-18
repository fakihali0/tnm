import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  BarChart3,
  Sparkles,
  Activity,
  Globe,
  Zap,
  Wallet,
  RefreshCw,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Target,
  PieChart
} from 'lucide-react';
import { AIInsightsDashboard } from './AIInsightsDashboard';
import { MarketIntelligencePanel } from './MarketIntelligencePanel';
import { AIChatAssistant } from './AIChatAssistant';
import { LivePositionsPanel } from './LivePositionsPanel';
import { RecentTradesPanel } from './RecentTradesPanel';
import { SyncStatusWidget } from './SyncStatusWidget';
import { useAccountStore } from '@/store/auth';
import { useJournalStore } from '@/store/auth';
import { useAccountInsights } from '@/hooks/useAccountInsights';
import { useRTL } from '@/hooks/useRTL';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const AIHub = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const [activeTab, setActiveTab] = useState('insights');
  const { 
    accounts, 
    selectedAccount, 
    setSelectedAccount, 
    getAccountStatus, 
    syncAccount,
    lastSyncTime,
    syncErrors,
    loadAccounts
  } = useAccountStore();
  const { trades, loadTrades } = useJournalStore();
  const { toast } = useToast();
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Load trades when account changes
  useEffect(() => {
    if (selectedAccount) {
      loadTrades(selectedAccount.id);
    } else {
      // Load trades for all accounts
      accounts.forEach(acc => loadTrades(acc.id));
    }
  }, [selectedAccount?.id, loadTrades]);

  // Realtime subscriptions for trading_accounts and trades
  useEffect(() => {
    const accountsChannel = supabase
      .channel('accounts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_accounts',
        },
        () => {
          loadAccounts();
        }
      )
      .subscribe();

    const tradesChannel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        () => {
          if (selectedAccount) {
            loadTrades(selectedAccount.id);
          } else {
            accounts.forEach(acc => loadTrades(acc.id));
          }
        }
      )
      .subscribe();

    // Polling fallback every 30 seconds
    const pollInterval = setInterval(() => {
      loadAccounts();
      if (selectedAccount) {
        loadTrades(selectedAccount.id);
      }
    }, 30000);

    return () => {
      supabase.removeChannel(accountsChannel);
      supabase.removeChannel(tradesChannel);
      clearInterval(pollInterval);
    };
  }, [selectedAccount?.id, accounts.length]);

  // Use insights hook for aggregated metrics
  const { metrics, pnl, syncStatus } = useAccountInsights(
    accounts,
    selectedAccount,
    trades,
    syncingAccountId,
    syncErrors
  );

  const handleSync = async () => {
    if (!selectedAccount) {
      toast({
        title: "No account selected",
        description: "Please select an account to sync",
        variant: "destructive",
      });
      return;
    }

    setSyncingAccountId(selectedAccount.id);
    try {
      const result = await syncAccount(selectedAccount.mt5_service_account_id);
      if (result.success) {
        // Accounts are already reloaded by syncAccount(), just reload trades
        await loadTrades(selectedAccount.id);
        toast({
          title: "Sync Complete",
          description: "Account data synchronized successfully",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync account data",
          variant: "destructive",
        });
      }
    } finally {
      setSyncingAccountId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: metrics.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const equityChange = metrics.totalEquity - metrics.totalBalance;
  const equityPercentage = metrics.totalBalance > 0 
    ? (equityChange / metrics.totalBalance) * 100 
    : 0;

  const stats = [
    {
      label: selectedAccount ? t('aiHub.stats.balance') : t('aiHub.stats.totalBalance'),
      value: formatCurrency(metrics.totalBalance),
      change: selectedAccount 
        ? `Equity: ${formatCurrency(metrics.totalEquity)}`
        : `${accounts.length} accounts`,
      icon: Wallet,
      color: 'text-blue-500'
    },
    {
      label: t('aiHub.stats.equity'),
      value: formatCurrency(metrics.totalEquity),
      change: `${equityChange >= 0 ? '+' : ''}${equityPercentage.toFixed(2)}%`,
      icon: equityChange >= 0 ? TrendingUp : TrendingDown,
      color: equityChange >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      label: t('aiHub.stats.openPositions'),
      value: metrics.openPositionCount.toString(),
      change: `Margin: ${formatCurrency(metrics.totalMargin)}`,
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      label: 'Daily P&L',
      value: formatCurrency(pnl.daily.profit),
      change: `${pnl.daily.trades} trades`,
      icon: pnl.daily.profit >= 0 ? TrendingUp : TrendingDown,
      color: pnl.daily.profit >= 0 ? 'text-green-500' : 'text-red-500'
    }
  ];

  // Additional P&L stats for expanded view
  const pnlStats = [
    {
      label: 'Weekly P&L',
      value: formatCurrency(pnl.weekly.profit),
      trades: pnl.weekly.trades,
      winRate: pnl.weekly.winRate,
      color: pnl.weekly.profit >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      label: 'Monthly P&L',
      value: formatCurrency(pnl.monthly.profit),
      trades: pnl.monthly.trades,
      winRate: pnl.monthly.winRate,
      color: pnl.monthly.profit >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      label: 'Total P&L',
      value: formatCurrency(pnl.total.profit),
      trades: pnl.total.trades,
      winRate: pnl.total.winRate,
      color: pnl.total.profit >= 0 ? 'text-green-500' : 'text-red-500'
    }
  ];

  return (
    <div className="space-y-6" dir={rtl.dir}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground text-start">{t('aiHub.title')}</h1>
              <p className="text-muted-foreground text-start">
                {t('aiHub.description')}
              </p>
            </div>
          </div>
          
          {/* Account Selector and Sync Status */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {accounts.length > 0 && (
                <Select 
                  value={selectedAccount?.id || 'all'} 
                  onValueChange={(value) => {
                    const account = accounts.find(acc => acc.id === value);
                    setSelectedAccount(account || null);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.platform} - {account.login}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {accounts.length === 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No accounts linked
                </Badge>
              )}
            </div>
            {accounts.length > 0 && (
              <SyncStatusWidget
                syncStatus={syncStatus}
                onSync={handleSync}
                isSyncing={syncingAccountId !== null}
              />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md bg-background ${stat.color}`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground text-start">{stat.label}</p>
                      <p className="text-lg font-semibold text-foreground text-start">{stat.value}</p>
                      <p className="text-xs text-muted-foreground text-start">{stat.change}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* P&L Performance Stats */}
        {pnl.total.trades > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pnlStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{stat.trades} trades</span>
                        <Badge variant="outline" className="text-xs">
                          {stat.winRate.toFixed(1)}% win rate
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights" className="flex items-center gap-2 text-start">
              <Activity className="h-4 w-4" />
              {t('aiHub.tabs.insights')}
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2 text-start">
              <PieChart className="h-4 w-4" />
              Positions
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2 text-start">
              <BarChart3 className="h-4 w-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2 text-start">
              <Globe className="h-4 w-4" />
              {t('aiHub.tabs.market')}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2 text-start">
              <MessageSquare className="h-4 w-4" />
              {t('aiHub.tabs.chat')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            <AIInsightsDashboard />
          </TabsContent>

          <TabsContent value="positions" className="space-y-6">
            <LivePositionsPanel accountId={selectedAccount?.id} />
          </TabsContent>

          <TabsContent value="trades" className="space-y-6">
            <RecentTradesPanel accountId={selectedAccount?.id} limit={20} />
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <MarketIntelligencePanel />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <AIChatAssistant />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};