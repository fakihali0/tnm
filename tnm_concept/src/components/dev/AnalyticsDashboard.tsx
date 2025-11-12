import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversionAnalytics } from '@/services/conversion-analytics';
import { BarChart3, Target, Users, TrendingUp, Eye, TestTube2, Trophy } from 'lucide-react';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export function AnalyticsDashboard() {
  const {
    calculateEngagementScore,
    getUserSegment,
    getABTests,
    getConversionGoals
  } = useConversionAnalytics();

  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [engagementScore, setEngagementScore] = useState(0);
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [conversionGoals, setConversionGoals] = useState<any[]>([]);

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    const journey = JSON.parse(sessionStorage.getItem('user_journey') || '[]');
    const conversions = JSON.parse(localStorage.getItem('conversion_attributions') || '[]');
    const sessionCount = parseInt(localStorage.getItem('user_session_count') || '0');
    const userSegment = getUserSegment();
    const score = calculateEngagementScore();
    
    setEngagementScore(score);
    setActiveTests(getABTests().filter(test => test.active));
    setConversionGoals(getConversionGoals());

    const newMetrics: AnalyticsMetric[] = [
      {
        label: 'Page Views',
        value: journey.length,
        trend: journey.length > 3 ? 'up' : 'neutral',
        icon: <Eye className="w-4 h-4" />
      },
      {
        label: 'Session Count',
        value: sessionCount,
        trend: sessionCount > 1 ? 'up' : 'neutral',
        icon: <Users className="w-4 h-4" />
      },
      {
        label: 'Conversions',
        value: conversions.length,
        trend: conversions.length > 0 ? 'up' : 'neutral',
        icon: <Target className="w-4 h-4" />
      },
      {
        label: 'User Segment',
        value: userSegment || 'Unknown',
        icon: <Users className="w-4 h-4" />
      },
      {
        label: 'Engagement Score',
        value: `${score}/100`,
        trend: score > 50 ? 'up' : score > 25 ? 'neutral' : 'down',
        icon: <Trophy className="w-4 h-4" />
      },
      {
        label: 'A/B Tests',
        value: `${activeTests.length} Active`,
        icon: <TestTube2 className="w-4 h-4" />
      }
    ];

    setMetrics(newMetrics);
  };

  // Only show in development or on lovable staging
  if (import.meta.env.PROD && !window.location.hostname.includes('lovable.app')) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button 
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/90 backdrop-blur-sm"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-96 max-h-[500px]">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
            <CardDescription>Real-time user behavior & conversions</CardDescription>
          </div>
          <Button 
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
          >
            ×
          </Button>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="conversions">Goals</TabsTrigger>
              <TabsTrigger value="tests">A/B Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-3">
                {/* Engagement Score */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Engagement Score</span>
                    <Badge variant={engagementScore > 50 ? 'default' : 'secondary'}>
                      {engagementScore}/100
                    </Badge>
                  </div>
                  <Progress value={engagementScore} className="h-2" />
                </div>

                {/* Metrics Grid */}
                <ScrollArea className="h-48">
                  <div className="grid gap-3">
                    {metrics.map((metric, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-muted-foreground">{metric.icon}</div>
                          <span className="text-sm font-medium">{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{metric.value}</span>
                          {metric.trend && (
                            <TrendingUp 
                              className={`w-3 h-3 ${
                                metric.trend === 'up' ? 'text-green-500' : 
                                metric.trend === 'down' ? 'text-red-500' : 
                                'text-muted-foreground'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="conversions" className="space-y-4">
              <ScrollArea className="h-56">
                <div className="space-y-3">
                  {conversionGoals.map((goal, index) => (
                    <div
                      key={goal.id}
                      className="p-3 rounded-lg bg-muted/30 border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{goal.name}</span>
                        <Badge variant="outline">
                          {goal.value} pts
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Category: {goal.category}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              <ScrollArea className="h-56">
                <div className="space-y-3">
                  {activeTests.map((test, index) => (
                    <div
                      key={test.id}
                      className="p-3 rounded-lg bg-muted/30 border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{test.name}</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="space-y-1">
                        {test.variants.map((variant: any) => (
                          <div
                            key={variant.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span>{variant.name}</span>
                            <span className="text-muted-foreground">
                              {variant.weight}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}