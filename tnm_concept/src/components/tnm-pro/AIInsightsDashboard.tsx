import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccountStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { useAdvancedNotifications } from '@/hooks/useAdvancedNotifications';
import { useRTL } from '@/hooks/useRTL';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Target,
  Lightbulb,
  Star,
  RefreshCw,
  Filter,
  Download,
  BookOpen,
  Zap
} from 'lucide-react';

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  impact_level: 'high' | 'medium' | 'low';
  actionable: boolean;
  generated_at?: string;
  created_at: string;
  account_id: string;
}

export const AIInsightsDashboard = () => {
  const rtl = useRTL();
  const { selectedAccount } = useAccountStore();
  const notifications = useAdvancedNotifications();
  const triggerSystemAlert = (message: string) => {
    notifications.addNotification({
      title: 'AI Insights',
      message,
      type: 'system',
      priority: 'low',
      category: 'info'
    });
  };
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');

  useEffect(() => {
    if (selectedAccount) {
      loadInsights();
    }
  }, [selectedAccount]);

  const loadInsights = async () => {
    if (!selectedAccount) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('account_id', selectedAccount.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setInsights((data || []).map(item => ({
        ...item,
        impact_level: item.impact_level as 'high' | 'medium' | 'low'
      })));
    } catch (error) {
      console.error('Error loading insights:', error);
      triggerSystemAlert('Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInsights = async () => {
    if (!selectedAccount) {
      triggerSystemAlert('Please select an account first');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights-generator', {
        body: { accountId: selectedAccount.id }
      });

      if (error) throw error;

      if (data?.insights) {
        triggerSystemAlert(`Generated ${data.insights.length} new insights`);
        await loadInsights(); // Reload from database
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      triggerSystemAlert('Failed to generate new insights');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInsights = insights.filter(insight => {
    const typeMatch = filterType === 'all' || insight.insight_type === filterType;
    const impactMatch = filterImpact === 'all' || insight.impact_level === filterImpact;
    return typeMatch && impactMatch;
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return TrendingUp;
      case 'risk': return AlertTriangle;
      case 'timing': return Clock;
      case 'strategy': return Target;
      default: return Lightbulb;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const insightsByType = insights.reduce((acc, insight) => {
    acc[insight.insight_type] = (acc[insight.insight_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6" dir={rtl.dir}>
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="risk">Risk</SelectItem>
              <SelectItem value="timing">Timing</SelectItem>
              <SelectItem value="strategy">Strategy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterImpact} onValueChange={setFilterImpact}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by impact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impact</SelectItem>
              <SelectItem value="high">High Impact</SelectItem>
              <SelectItem value="medium">Medium Impact</SelectItem>
              <SelectItem value="low">Low Impact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadInsights}
            disabled={isLoading || !selectedAccount}
          >
            <RefreshCw className={`h-4 w-4 me-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={generateNewInsights}
            disabled={isLoading || !selectedAccount}
          >
            <Brain className="h-4 w-4 me-2" />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Impact</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.impact_level === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actionable</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.actionable).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Insights ({filteredInsights.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedAccount ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Please select a trading account to view AI insights</p>
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights found. Generate new insights to get started.</p>
              <Button 
                onClick={generateNewInsights} 
                className="mt-4"
                disabled={isLoading}
              >
                <Brain className="h-4 w-4 me-2" />
                Generate First Insights
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredInsights.map((insight, index) => {
                  const IconComponent = getInsightIcon(insight.insight_type);
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-border/50 hover:border-border transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-foreground">
                                  {insight.title}
                                </h3>
                                <div className="flex gap-2">
                                  <Badge variant={getImpactColor(insight.impact_level)}>
                                    {insight.impact_level} impact
                                  </Badge>
                                  {insight.actionable && (
                                    <Badge variant="secondary">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Actionable
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {insight.description}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Type: {insight.insight_type}</span>
                                 <span>
                                   {new Date(insight.created_at || insight.generated_at).toLocaleDateString()}
                                 </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};