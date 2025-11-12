import React, { useState, useEffect } from 'react';
import { useAccountStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Target,
  Activity,
  Bell,
  RefreshCw,
  Brain
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'performance' | 'risk' | 'timing' | 'strategy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  isNew: boolean;
  timestamp: Date;
}

interface RiskNudge {
  id: string;
  type: 'warning' | 'info' | 'suggestion';
  message: string;
  action?: string;
  timestamp: Date;
}

interface ActivityEvent {
  id: string;
  type: 'account' | 'auth' | 'rule' | 'export' | 'system';
  message: string;
  timestamp: Date;
  status?: 'success' | 'warning' | 'error';
}

export const InsightsPanel: React.FC = () => {
  const { selectedAccount } = useAccountStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [riskNudges, setRiskNudges] = useState<RiskNudge[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate mock insights based on account data
  useEffect(() => {
    if (!selectedAccount) {
      setInsights([]);
      setRiskNudges([]);
      setActivities([]);
      return;
    }

    // Generate insights
    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'performance',
        title: 'Best performing day: Monday afternoons',
        description: 'Your win rate is 73% on Mondays after 14:00 UTC. Consider focusing more trades during this period.',
        impact: 'high',
        isNew: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: '2',
        type: 'strategy',
        title: 'Optimal R:R found for GBPUSD',
        description: 'Setting 1:2.5 target on GBPUSD gives you the highest profit factor (2.3) based on your trading history.',
        impact: 'medium',
        isNew: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: '3',
        type: 'risk',
        title: 'Overtrading pattern detected',
        description: 'You tend to take 40% more trades on days following losses. Consider implementing cooling-off periods.',
        impact: 'high',
        isNew: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6)
      },
      {
        id: '4',
        type: 'timing',
        title: 'Low performance during overlap sessions',
        description: 'Your win rate drops to 52% during London-NY overlap. Focus on Asia or late NY sessions instead.',
        impact: 'medium',
        isNew: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    ];

    // Generate risk nudges
    const mockRiskNudges: RiskNudge[] = [
      {
        id: '1',
        type: 'warning',
        message: 'Current trade idea exceeds daily risk budget by 0.4R',
        action: 'Reduce position size by 20%',
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: '2',
        type: 'suggestion',
        message: 'Consider taking partial profits - unrealized P/L at +1.8R',
        action: 'Move stop to breakeven',
        timestamp: new Date(Date.now() - 1000 * 60 * 15)
      }
    ];

    // Generate activity events
    const mockActivities: ActivityEvent[] = [
      {
        id: '1',
        type: 'account',
        message: 'MT5 account data synchronized',
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        status: 'success'
      },
      {
        id: '2',
        type: 'rule',
        message: 'Daily drawdown rule triggered (4.2%)',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        status: 'warning'
      },
      {
        id: '3',
        type: 'export',
        message: 'Trading journal exported to CSV',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: 'success'
      },
      {
        id: '4',
        type: 'auth',
        message: 'Session renewed automatically',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: 'success'
      },
      {
        id: '5',
        type: 'system',
        message: 'Risk assessment model updated',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        status: 'success'
      }
    ];

    setInsights(mockInsights);
    setRiskNudges(mockRiskNudges);
    setActivities(mockActivities);
  }, [selectedAccount]);

  const generateNewInsights = async () => {
    setIsGenerating(true);
    // Simulate AI processing time
    setTimeout(() => {
      setInsights(prev => [
        {
          id: Date.now().toString(),
          type: 'performance',
          title: 'New pattern identified',
          description: 'Recent analysis shows improved performance when trading with trend during Asian session.',
          impact: 'medium',
          isNew: true,
          timestamp: new Date()
        },
        ...prev
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'strategy': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNudgeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'suggestion': return <Target className="h-4 w-4 text-green-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'account': return <Activity className="h-3 w-3" />;
      case 'auth': return <Bell className="h-3 w-3" />;
      case 'rule': return <AlertTriangle className="h-3 w-3" />;
      case 'export': return <TrendingUp className="h-3 w-3" />;
      case 'system': return <RefreshCw className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const getActivityColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  if (!selectedAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No account selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateNewInsights}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Lightbulb className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-primary mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{insight.title}</h4>
                        {insight.isNew && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(insight.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Risk Nudges */}
      {riskNudges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Nudges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskNudges.map((nudge) => (
                <div key={nudge.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {getNudgeIcon(nudge.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">{nudge.message}</p>
                      {nudge.action && (
                        <p className="text-xs text-primary">→ {nudge.action}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(nudge.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 py-2">
                  <div className={getActivityColor(activity.status)}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};