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
  AlertCircle
} from 'lucide-react';
import { AIInsightsDashboard } from './AIInsightsDashboard';
import { MarketIntelligencePanel } from './MarketIntelligencePanel';
import { AIChatAssistant } from './AIChatAssistant';
import { LivePositionsPanel } from './LivePositionsPanel';
import { useAccountStore } from '@/store/auth';
import { useJournalStore } from '@/store/auth';
import { useRTL } from '@/hooks/useRTL';

export const AIHub = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const [activeTab, setActiveTab] = useState('insights');
  const { accounts, selectedAccount, setSelectedAccount, getAccountStatus, syncAccount } = useAccountStore();
  const { trades, loadTrades } = useJournalStore();
  const [isSyncing, setIsSyncing] = useState(false);

  // Load trades when account changes
  useEffect(() => {
    if (selectedAccount) {
      loadTrades(selectedAccount.id);
    }
  }, [selectedAccount?.id, loadTrades]);

  // Calculate aggregate metrics
  const calculateMetrics = () => {
    if (!selectedAccount) {
      // Show aggregated data across all accounts
      const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      const totalEquity = accounts.reduce((sum, acc) => sum + (acc.equity || 0), 0);
      const totalMargin = accounts.reduce((sum, acc) => sum + (acc.margin || 0), 0);
      const openPositions = accounts.filter(acc => (acc.margin || 0) > 0).length;
      
      return {
        balance: totalBalance,
        equity: totalEquity,
        margin: totalMargin,
        openPositions,
        currency: accounts[0]?.currency || 'USD',
        accountName: 'All Accounts'
      };
    } else {
      // Show selected account data
      return {
        balance: selectedAccount.balance || 0,
        equity: selectedAccount.equity || 0,
        margin: selectedAccount.margin || 0,
        openPositions: (selectedAccount.margin || 0) > 0 ? 1 : 0, // Simplified
        currency: selectedAccount.currency,
        accountName: selectedAccount.account_name || selectedAccount.login
      };
    }
  };

  const metrics = calculateMetrics();
  const accountStatus = selectedAccount ? getAccountStatus(selectedAccount.id) : null;
  const equityChange = metrics.equity - metrics.balance;
  const equityPercentage = metrics.balance > 0 ? (equityChange / metrics.balance) * 100 : 0;

  // Calculate P&L from recent trades
  const recentTrades = trades.slice(0, 50); // Last 50 trades
  const totalPnL = recentTrades.reduce((sum, trade) => {
    const pnl = (trade.closePrice || 0) - (trade.openPrice || 0);
    return sum + (trade.direction === 'BUY' ? pnl : -pnl) * (trade.volume || 0);
  }, 0);
  
  const winningTrades = recentTrades.filter(trade => {
    const pnl = (trade.closePrice || 0) - (trade.openPrice || 0);
    return trade.direction === 'BUY' ? pnl > 0 : pnl < 0;
  });
  const winRate = recentTrades.length > 0 ? (winningTrades.length / recentTrades.length) * 100 : 0;

  const handleSync = async () => {
    if (!selectedAccount) return;
    setIsSyncing(true);
    try {
      await syncAccount(selectedAccount.id);
      await loadTrades(selectedAccount.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: metrics.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const stats = [
    {
      label: selectedAccount ? t('aiHub.stats.balance') : t('aiHub.stats.totalBalance'),
      value: formatCurrency(metrics.balance),
      change: selectedAccount 
        ? `Equity: ${formatCurrency(metrics.equity)}`
        : `${accounts.length} accounts`,
      icon: Wallet,
      color: 'text-blue-500'
    },
    {
      label: t('aiHub.stats.equity'),
      value: formatCurrency(metrics.equity),
      change: `${equityChange >= 0 ? '+' : ''}${equityPercentage.toFixed(2)}%`,
      icon: equityChange >= 0 ? TrendingUp : TrendingDown,
      color: equityChange >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      label: t('aiHub.stats.openPositions'),
      value: metrics.openPositions.toString(),
      change: `Margin: ${formatCurrency(metrics.margin)}`,
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      label: t('aiHub.stats.winRate'),
      value: `${winRate.toFixed(1)}%`,
      change: `${recentTrades.length} trades`,
      icon: BarChart3,
      color: winRate >= 50 ? 'text-green-500' : 'text-amber-500'
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
          <div className="flex items-center gap-2">
            {accounts.length > 0 && (
              <>
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
                
                {selectedAccount && accountStatus && (
                  <div className="flex items-center gap-2">
                    {accountStatus.lastSync && (
                      <Badge variant="outline" className="text-xs">
                        Last sync: {new Date(accountStatus.lastSync).toLocaleTimeString()}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                )}
              </>
            )}
            {accounts.length === 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                No accounts linked
              </Badge>
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
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights" className="flex items-center gap-2 text-start">
              <Activity className="h-4 w-4" />
              {t('aiHub.tabs.insights')}
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2 text-start">
              <BarChart3 className="h-4 w-4" />
              Positions
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
            <LivePositionsPanel />
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