import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { getLocalizedPath, getLanguageFromPath } from '@/i18n';
import { useAccountStore } from '@/store/auth';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useRealTradingData } from '@/hooks/useRealTradingData';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  AlertTriangle,
  BarChart3,
  Zap,
  Plus,
  ExternalLink,
  ChevronRight,
  Calculator,
  BookOpen,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/useRTL';

export function MobileDashboardCards() {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedAccount, metrics, formatCurrency } = useTradingDashboard();
  const { accounts } = useAccountStore();
  const { triggerHapticFeedback, hapticFeedback } = useMobileOptimizations();
  const { trades } = useRealTradingData();

  const handleCardPress = (action: string) => {
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
    
    const currentLang = getLanguageFromPath(location.pathname);
    
    // Handle navigation based on action
    switch (action) {
      case 'link-account':
        navigate(getLocalizedPath('/tnm-ai#accounts', currentLang));
        break;
      case 'risk-calculator':
        navigate(getLocalizedPath('/tnm-ai#risk-calculator', currentLang));
        break;
      case 'journal':
        navigate(getLocalizedPath('/tnm-ai#journal', currentLang));
        break;
      case 'analytics':
        navigate(getLocalizedPath('/tnm-ai#analytics', currentLang));
        break;
      case 'quick-trade':
        navigate(getLocalizedPath('/tnm-ai#dashboard', currentLang));
        break;
      case 'platform':
        // External platform link - could open a new tab
        window.open('https://platform.tnm.com', '_blank');
        break;
      default:
        // For performance cards, navigate to analytics
        if (action.startsWith('performance-')) {
          navigate(getLocalizedPath('/tnm-ai#analytics', currentLang));
        }
        break;
    }
  };

  if (!selectedAccount) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* No Account Connected Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('dashboard.welcomeTitle')}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {t('dashboard.welcomeSubtitle')}
              </p>
            </div>
            <Button 
              className="w-full"
              onClick={() => handleCardPress('link-account')}
            >
              {t('account.linkAccount')}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Start Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 cursor-pointer transition-all duration-200 active:scale-95"
            onClick={() => handleCardPress('risk-calculator')}
          >
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium">{t('navigation.riskCalculator')}</p>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 cursor-pointer transition-all duration-200 active:scale-95"
            onClick={() => handleCardPress('journal')}
          >
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">{t('navigation.journal')}</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  const performanceCards = [
    {
      title: t('dashboard.totalProfit'),
      value: formatCurrency(metrics.netPnl),
      change: '+12.5%',
      icon: metrics.netPnl >= 0 ? TrendingUp : TrendingDown,
      color: metrics.netPnl >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: metrics.netPnl >= 0 ? 'from-green-500/10 to-green-600/10' : 'from-red-500/10 to-red-600/10',
      borderColor: metrics.netPnl >= 0 ? 'border-green-500/20' : 'border-red-500/20'
    },
    {
      title: t('dashboard.winRate'),
      value: `${(metrics.winRate * 100).toFixed(1)}%`,
      change: '+2.1%',
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: t('dashboard.activeTrades'),
      value: metrics.openTrades.toString(),
      change: '',
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'from-purple-500/10 to-purple-600/10',
      borderColor: 'border-purple-500/20'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      dir={rtl.dir}
    >
      {/* Account Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">{selectedAccount.name}</p>
              <p className="text-2xl font-bold">{formatCurrency(selectedAccount.balance)}</p>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {t('common.live')}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{t('account.equity')}</p>
              <p className="font-semibold">{formatCurrency(selectedAccount.equity || selectedAccount.balance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('account.margin')}</p>
              <p className="font-semibold">{formatCurrency(selectedAccount.margin || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('account.freeMargin')}</p>
              <p className="font-semibold">{formatCurrency(selectedAccount.freeMargin || selectedAccount.balance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {performanceCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  `bg-gradient-to-br ${card.bgColor} ${card.borderColor} cursor-pointer transition-all duration-200 active:scale-95`
                )}
                onClick={() => handleCardPress(`performance-${index}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-5 w-5", card.color)} />
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {card.change}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
                    <p className={cn("text-lg font-bold", card.color)}>{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card 
          className="cursor-pointer transition-all duration-200 active:scale-95"
          onClick={() => handleCardPress('quick-trade')}
        >
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs font-medium">{t('common.quickTrade')}</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all duration-200 active:scale-95"
          onClick={() => handleCardPress('analytics')}
        >
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-medium">{t('analytics.analytics')}</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all duration-200 active:scale-95"
          onClick={() => handleCardPress('platform')}
        >
          <CardContent className="p-4 text-center">
            <ExternalLink className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <p className="text-xs font-medium">{t('common.platform')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t('activity.recentActivity')}</h3>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {trades.length > 0 ? (
            trades.slice(0, 3).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{trade.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trade.closed_at || trade.opened_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    (trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(trade.pnl || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trade.trade_status === 'closed' ? t('common.closed') : t('common.open')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('emptyStates.noRecentActivity')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}