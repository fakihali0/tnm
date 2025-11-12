import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  Lightbulb,
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { EnhancedEquityCurve } from './EnhancedEquityCurve';
import { EnhancedTradesTable } from './EnhancedTradesTable';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { StreaksAnalytics } from './StreaksAnalytics';

export const SimplifiedDashboard: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { selectedAccount, trades, closedTrades, metrics, isLoading, formatCurrency } = useTradingDashboard();

  if (!selectedAccount) {
    return (
      <Card className="text-center">
        <CardHeader>
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>{t('dashboard.noAccountTitle')}</CardTitle>
          <CardDescription>{t('dashboard.noAccountDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Smart action cards - AI-driven suggestions
  const actionCards = [
    {
      icon: Lightbulb,
      title: t('dashboard.actions.bestPerformance'),
      description: metrics.bestDay ? `${formatCurrency(metrics.bestDay.pnl)} on ${metrics.bestDay.date}` : t('dashboard.noAccountDescription'),
      variant: 'default' as const,
      show: !!metrics.bestDay
    },
    {
      icon: Calendar,
      title: t('dashboard.actions.winningStreak'),
      description: t('dashboard.actions.consecutiveWins', { count: metrics.maxConsecutiveWins }),
      variant: 'secondary' as const,
      show: metrics.maxConsecutiveWins > 0
    },
    {
      icon: Target,
      title: t('dashboard.actions.focusArea'),
      description: metrics.avgRiskReward < 1.5 ? t('dashboard.actions.improveRiskReward') : t('dashboard.actions.keepUpGoodRR'),
      variant: metrics.avgRiskReward < 1.5 ? 'destructive' as const : 'default' as const,
      show: true
    }
  ];

  return (
    <div className="space-y-6" dir={rtl.dir}>
      {/* 4 Essential KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-start">{t('dashboard.kpis.netPnl')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-start ${metrics.netPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.netPnl)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {metrics.netPnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="text-start">{t('dashboard.kpis.trades', { count: metrics.totalTrades })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-start">{t('dashboard.kpis.winRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-start">{metrics.winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1 text-start">
              {t('dashboard.kpis.winners', { count: Math.round((metrics.winRate / 100) * metrics.totalTrades) })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-start">{t('dashboard.kpis.activeTrades')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-start">{metrics.openTrades}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <Activity className="h-3 w-3 inline me-1" />
              <span className="text-start">{t('dashboard.kpis.currentlyOpen')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-start">{t('dashboard.kpis.profitFactor')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-start">
              {metrics.profitFactor === 999 ? '∞' : metrics.profitFactor.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-start">
              {metrics.profitFactor > 2 ? t('dashboard.kpis.excellent') : metrics.profitFactor > 1.5 ? t('dashboard.kpis.good') : t('dashboard.kpis.needsWork')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Action Cards */}
      {actionCards.some(card => card.show) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actionCards.filter(card => card.show).map((card, idx) => (
            <Card key={idx} className="border-dashed">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm text-start">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-start">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 3 Main Tabs: Overview, Trades, Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 me-2" />
            {t('dashboard.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="trades">
            <Activity className="h-4 w-4 me-2" />
            {t('dashboard.tabs.trades')}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Zap className="h-4 w-4 me-2" />
            {t('dashboard.tabs.advanced')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EnhancedEquityCurve 
            trades={closedTrades} 
            initialBalance={selectedAccount.balance || 10000}
            currency={selectedAccount.currency}
          />

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-start">{t('dashboard.performance.largestWin')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600 text-start">
                  {formatCurrency(metrics.largestWin)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-start">{t('dashboard.performance.largestLoss')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600 text-start">
                  {formatCurrency(metrics.largestLoss)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-start">{t('dashboard.performance.avgRiskReward')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-start">
                  {metrics.avgRiskReward === 999 ? '∞' : `1:${metrics.avgRiskReward.toFixed(2)}`}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trades">
          <EnhancedTradesTable 
            trades={trades}
            currency={selectedAccount.currency}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PerformanceHeatmap 
            trades={closedTrades}
            currency={selectedAccount.currency}
          />
          
          <StreaksAnalytics 
            trades={closedTrades}
            currency={selectedAccount.currency}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
