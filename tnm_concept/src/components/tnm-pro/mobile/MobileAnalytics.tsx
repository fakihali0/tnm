import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Activity,
  PieChart,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/useRTL';

export function MobileAnalytics() {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { metrics, formatCurrency, selectedAccount } = useTradingDashboard();
  const { triggerHapticFeedback, hapticFeedback } = useMobileOptimizations();
  const [activeTab, setActiveTab] = useState('performance');

  const handleTabChange = (value: string) => {
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
    setActiveTab(value);
  };

  const performanceMetrics = [
    {
      title: t('analytics.netPnL'),
      value: formatCurrency(metrics.netPnl),
      change: '+12.5%',
      icon: metrics.netPnl >= 0 ? TrendingUp : TrendingDown,
      color: metrics.netPnl >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: metrics.netPnl >= 0 ? 'from-green-500/10 to-green-600/10' : 'from-red-500/10 to-red-600/10'
    },
    {
      title: t('analytics.winRate'),
      value: `${(metrics.winRate * 100).toFixed(1)}%`,
      change: '+2.1%',
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'from-blue-500/10 to-blue-600/10'
    },
    {
      title: t('analytics.profitFactor'),
      value: metrics.profitFactor.toFixed(2),
      change: '+0.15',
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'from-purple-500/10 to-purple-600/10'
    },
    {
      title: t('analytics.avgRiskReward'),
      value: `1:${metrics.avgRiskReward.toFixed(1)}`,
      change: 'Stable',
      icon: Activity,
      color: 'text-orange-500',
      bgColor: 'from-orange-500/10 to-orange-600/10'
    }
  ];

  const riskMetrics = [
    {
      label: 'Max Drawdown',
      value: '8.5%',
      status: 'Good',
      color: 'text-green-500'
    },
    {
      label: 'Risk of Ruin',
      value: '2.1%',
      status: 'Low',
      color: 'text-green-500'
    },
    {
      label: 'Sharpe Ratio',
      value: '1.85',
      status: 'Excellent',
      color: 'text-blue-500'
    },
    {
      label: 'Volatility',
      value: '12.3%',
      status: 'Moderate',
      color: 'text-orange-500'
    }
  ];

  const tradingAnalysis = [
    {
      category: 'Currency Pairs',
      data: [
        { name: 'EURUSD', trades: 45, pnl: '+$1,250', winRate: '78%', color: 'text-green-500' },
        { name: 'GBPUSD', trades: 32, pnl: '+$890', winRate: '65%', color: 'text-green-500' },
        { name: 'USDJPY', trades: 28, pnl: '-$120', winRate: '48%', color: 'text-red-500' }
      ]
    },
    {
      category: 'Time Analysis',
      data: [
        { name: 'London Session', trades: 65, pnl: '+$1,890', winRate: '72%', color: 'text-green-500' },
        { name: 'NY Session', trades: 28, pnl: '+$340', winRate: '58%', color: 'text-green-500' },
        { name: 'Asian Session', trades: 12, pnl: '-$210', winRate: '42%', color: 'text-red-500' }
      ]
    }
  ];

  if (!selectedAccount) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('analytics.noData')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.connectToViewAnalytics')}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      dir={rtl.dir}
    >
      {/* Analytics Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{t('analytics.analytics')}</h2>
              <p className="text-sm text-muted-foreground">{selectedAccount.name}</p>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Live Data
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(metrics.netPnl)}</p>
              <p className="text-xs text-muted-foreground">Total P&L</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{(metrics.winRate * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance" className="text-xs">
            <TrendingUp className="h-4 w-4 mr-1" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs">
            <PieChart className="h-4 w-4 mr-1" />
            Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {performanceMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={cn(
                    `bg-gradient-to-br ${metric.bgColor} cursor-pointer transition-all duration-200 active:scale-95`
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={cn("h-5 w-5", metric.color)} />
                        <Badge variant="outline" className="text-xs">
                          {metric.change}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{metric.title}</p>
                        <p className={cn("text-lg font-bold", metric.color)}>{metric.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Interactive chart would go here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4 space-y-3">
          {riskMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{metric.label}</p>
                      <p className={cn("text-lg font-bold", metric.color)}>{metric.value}</p>
                    </div>
                    <Badge variant="outline" className={metric.color}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="breakdown" className="mt-4 space-y-4">
          {tradingAnalysis.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{section.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.trades} trades</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-semibold text-sm", item.color)}>{item.pnl}</p>
                      <p className="text-xs text-muted-foreground">{item.winRate} win</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}