import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  BarChart3,
  Sparkles,
  Activity,
  Globe,
  Zap
} from 'lucide-react';
import { AIInsightsDashboard } from './AIInsightsDashboard';
import { MarketIntelligencePanel } from './MarketIntelligencePanel';
import { AIChatAssistant } from './AIChatAssistant';

import { useRTL } from '@/hooks/useRTL';

export const AIHub = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const [activeTab, setActiveTab] = useState('insights');

  const stats = [
    {
      label: t('aiHub.stats.insightsGenerated'),
      value: '24',
      change: t('aiHub.stats.thisWeek', { count: 12 }),
      icon: Brain,
      color: 'text-primary'
    },
    {
      label: t('aiHub.stats.marketPredictions'),
      value: '89%',
      change: t('aiHub.stats.accuracyRate'),
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: t('aiHub.stats.chatSessions'),
      value: '15',
      change: t('aiHub.stats.today', { count: 5 }),
      icon: MessageSquare,
      color: 'text-blue-500'
    },
    {
      label: t('aiHub.stats.performanceScore'),
      value: '8.7/10',
      change: t('aiHub.stats.thisMonth', { value: 0.3 }),
      icon: BarChart3,
      color: 'text-purple-500'
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights" className="flex items-center gap-2 text-start">
              <Activity className="h-4 w-4" />
              {t('aiHub.tabs.insights')}
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