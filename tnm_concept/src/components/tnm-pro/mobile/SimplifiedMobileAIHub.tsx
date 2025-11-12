import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useAdvancedNotifications } from '@/hooks/useAdvancedNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { 
  Brain, 
  Sparkles, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Activity,
  RefreshCw,
  Loader2,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIChatAssistant } from '@/components/tnm-pro/AIChatAssistant';
import { useRTL } from '@/hooks/useRTL';

interface Insight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function SimplifiedMobileAIHub() {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { triggerHapticFeedback, hapticFeedback } = useMobileOptimizations();
  const { addNotification } = useAdvancedNotifications();
  const { selectedAccount } = useTradingDashboard();
  
  const [searchSymbol, setSearchSymbol] = useState('EURUSD');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [showChat, setShowChat] = useState(false);

  // Cache key for insights
  const cacheKey = `insights_${searchSymbol}_${selectedAccount?.id || 'demo'}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Load from cache first
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setInsights(data);
        return;
      }
    }
    // Load fresh insights
    loadInsights();
  }, [searchSymbol]);

  const loadInsights = async () => {
    setIsLoading(true);
    if (hapticFeedback) triggerHapticFeedback('light');

    try {
      const { data, error } = await supabase.functions.invoke('ai-insights-generator', {
        body: { 
          accountId: selectedAccount?.id,
          symbol: searchSymbol,
          limit: 5
        }
      });

      if (error) throw error;

      if (data?.insights) {
        const mapped = data.insights.map((i: any) => ({
          ...i,
          icon: getIcon(i.type),
          color: getColor(i.impact),
          bgColor: getBgColor(i.impact)
        }));
        
        setInsights(mapped);
        
        // Cache the results
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: mapped,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
      addNotification({
        title: 'Failed to load insights',
        message: 'Please try again',
        type: 'system',
        priority: 'medium',
        category: 'warning'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'market': return TrendingUp;
      case 'risk': return AlertTriangle;
      case 'opportunity': return Target;
      default: return Activity;
    }
  };

  const getColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const getBgColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'from-red-500/10 to-red-600/10';
      case 'medium': return 'from-orange-500/10 to-orange-600/10';
      case 'low': return 'from-green-500/10 to-green-600/10';
      default: return 'from-blue-500/10 to-blue-600/10';
    }
  };

  return (
    <div className="flex flex-col h-full" dir={rtl.dir}>
      {/* Search & Refresh */}
      <div className="p-4 space-y-3 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
              placeholder={t('common.search', 'Enter symbol...')}
              className="ps-10"
            />
          </div>
          <Button 
            onClick={loadInsights}
            disabled={isLoading}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          onClick={() => setShowChat(!showChat)}
          variant="outline"
          className="w-full gap-2"
        >
          <Brain className="h-4 w-4" />
          {showChat ? t('ai.hideChat', 'Hide AI Chat') : t('ai.openChat', 'Open AI Chat')}
        </Button>
      </div>

      {/* AI Chat */}
      {showChat && (
        <div className="border-b">
          <AIChatAssistant />
        </div>
      )}

      {/* Insights List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && insights.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : insights.length > 0 ? (
          insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <div className={cn("h-1 bg-gradient-to-r", insight.bgColor)} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg bg-gradient-to-br", insight.bgColor)}>
                        <Icon className={cn("h-5 w-5", insight.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 text-start">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2 text-start">{insight.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {insight.timeframe}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", insight.color)}>
                            {insight.impact} impact
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">{t('emptyStates.noData.title', 'No insights yet')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('emptyStates.noData.description', 'Enter a symbol and tap refresh to get AI insights')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
