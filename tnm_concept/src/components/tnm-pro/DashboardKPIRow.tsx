import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedStat } from '@/components/ui/animated-stat';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Activity,
  Clock,
  TrendingDown,
  Trophy
} from 'lucide-react';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { SPACING } from '@/styles/spacing';

interface DashboardKPIRowProps {
  compact?: boolean;
}

export const DashboardKPIRow: React.FC<DashboardKPIRowProps> = ({ compact = false }) => {
  const { t } = useTranslation('tnm-ai');
  const { metrics, formatCurrency, selectedAccount } = useTradingDashboard();
  const [activePeriod, setActivePeriod] = React.useState<'today' | 'mtd' | 'custom'>('mtd');

  if (!selectedAccount) {
    return (
      <Card className="card-enhanced">
        <CardContent className={`${SPACING.padding.card} text-center`}>
          <p className="text-muted-foreground">{t('dashboard.noAccountDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getTrendIcon = (value: number, type: 'pnl' | 'percentage' = 'pnl') => {
    if (value > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Activity className="h-3 w-3 text-muted-foreground" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const kpiItems = compact ? [
    {
      title: t('dashboard.kpis.netPnl'),
      value: formatCurrency(metrics.netPnl),
      icon: <DollarSign className="h-4 w-4" />,
      trend: getTrendIcon(metrics.netPnl),
      color: getTrendColor(metrics.netPnl),
    },
    {
      title: t('dashboard.kpis.winRate'),
      value: formatPercentage(metrics.winRate),
      icon: <Target className="h-4 w-4" />,
      color: 'text-green-600',
    },
    {
      title: t('dashboard.kpis.activeTrades'),
      value: metrics.openTrades.toString(),
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-600',
    },
  ] : [
    {
      title: t('dashboard.kpis.netPnl'),
      value: formatCurrency(metrics.netPnl),
      icon: <DollarSign className="h-4 w-4" />,
      trend: getTrendIcon(metrics.netPnl),
      color: getTrendColor(metrics.netPnl),
      subtitle: t('dashboard.kpis.trades', { count: metrics.totalTrades }),
    },
    {
      title: t('dashboard.kpis.winRate'),
      value: formatPercentage(metrics.winRate),
      icon: <Target className="h-4 w-4" />,
      color: 'text-green-600',
      subtitle: t('dashboard.kpis.winners', { count: Math.round((metrics.winRate / 100) * metrics.totalTrades) }),
    },
    {
      title: t('dashboard.kpis.profitFactor'),
      value: metrics.profitFactor.toFixed(2),
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-blue-600',
      subtitle: t('dashboard.kpis.grossProfit', { amount: formatCurrency(metrics.grossProfit) }),
    },
    {
      title: t('dashboard.kpis.avgRiskReward'),
      value: `1:${metrics.avgRiskReward.toFixed(1)}`,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-purple-600',
      subtitle: t('dashboard.kpis.avgWin', { amount: formatCurrency(metrics.avgWin) }),
    },
    {
      title: t('dashboard.kpis.activeTrades'),
      value: metrics.openTrades.toString(),
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-600',
      subtitle: t('dashboard.kpis.openPositions'),
    },
    {
      title: t('dashboard.kpis.winStreak'),
      value: metrics.maxConsecutiveWins.toString(),
      icon: <Trophy className="h-4 w-4" />,
      color: 'text-amber-600',
      subtitle: t('dashboard.kpis.maxConsecutive'),
    },
  ];

  return (
    <div className={SPACING.stack.comfortable}>
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('dashboard.performance.overview')}</h2>
            <p className="text-muted-foreground">
              {t('dashboard.performance.account')}: {selectedAccount.account_name || selectedAccount.login_number}
            </p>
          </div>
          <Tabs value={activePeriod} onValueChange={(value) => setActivePeriod(value as any)}>
            <TabsList>
              <TabsTrigger value="today">{t('dashboard.periods.today')}</TabsTrigger>
              <TabsTrigger value="mtd">{t('dashboard.periods.mtd')}</TabsTrigger>
              <TabsTrigger value="custom">{t('dashboard.periods.custom')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className={`grid ${SPACING.gap.medium} ${compact ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'}`}>
        {kpiItems.map((item, index) => (
          <Card key={index} className="card-enhanced">
            <CardContent className={SPACING.padding.cardSmall}>
              <div className={`flex items-center justify-between ${SPACING.margin.paragraph}`}>
                <div className={`flex items-center ${SPACING.gap.small} ${item.color}`}>
                  {item.icon}
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {item.trend}
              </div>
              <div className={SPACING.stack.tight}>
                <div className={`text-2xl font-bold ${item.color}`}>
                  {item.value}
                </div>
                {item.subtitle && !compact && (
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!compact && metrics.bestDay && metrics.worstDay && (
        <div className={`grid ${SPACING.gap.medium} md:grid-cols-2`}>
          <Card className="card-enhanced">
            <CardContent className={SPACING.padding.cardSmall}>
              <div className={`flex items-center ${SPACING.gap.small} ${SPACING.margin.paragraph}`}>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{t('dashboard.performance.bestDay')}</span>
                <Badge variant="secondary" className="ml-auto">
                  {metrics.bestDay.date}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics.bestDay.pnl)}
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardContent className={SPACING.padding.cardSmall}>
              <div className={`flex items-center ${SPACING.gap.small} ${SPACING.margin.paragraph}`}>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">{t('dashboard.performance.worstDay')}</span>
                <Badge variant="secondary" className="ml-auto">
                  {metrics.worstDay.date}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(metrics.worstDay.pnl)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};