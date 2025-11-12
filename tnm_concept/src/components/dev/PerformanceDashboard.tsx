import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitor } from '@/services/performance-monitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, BarChart3, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold?: string;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, rating, threshold, icon }: MetricCardProps) => {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRatingBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good': return 'default' as const;
      case 'needs-improvement': return 'secondary' as const;
      case 'poor': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={getRatingColor(rating)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-2">
          <Badge variant={getRatingBadgeVariant(rating)} className="capitalize">
            {rating.replace('-', ' ')}
          </Badge>
          {threshold && (
            <p className="text-xs text-muted-foreground">Target: {threshold}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function PerformanceDashboard() {
  const { getMetrics, getBundleSize, getCoreWebVitalsScore } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [bundleSize, setBundleSize] = useState(0);
  const [coreVitalsScore, setCoreVitalsScore] = useState({ score: 0, grade: 'N/A' });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
      setBundleSize(getBundleSize());
      setCoreVitalsScore(getCoreWebVitalsScore());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getMetrics, getBundleSize, getCoreWebVitalsScore]);

  // Only show in development
  if (import.meta.env.PROD && !window.location.hostname.includes('lovable.app')) {
    return null;
  }

  const coreWebVitals = metrics.filter(m => 
    ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(m.name)
  );

  const resourceMetrics = metrics.filter(m => 
    ['LARGE_RESOURCE', 'SLOW_RESOURCE', 'BUNDLE_SIZE'].includes(m.name)
  );

  const allMetrics = metrics.filter(m => 
    !['LARGE_RESOURCE', 'SLOW_RESOURCE', 'BUNDLE_SIZE', 'LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(m.name)
  );

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/90 backdrop-blur-sm"
        >
          <Activity className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px]">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Performance Monitor</CardTitle>
            <CardDescription>Real-time performance metrics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={coreVitalsScore.grade === 'A' ? 'default' : 'secondary'}>
              Score: {coreVitalsScore.grade}
            </Badge>
            <Button 
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="vitals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vitals">Core Vitals</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="all">All Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="vitals" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Core Web Vitals Score</span>
                  <div className="flex items-center gap-2">
                    <Progress value={coreVitalsScore.score} className="w-20" />
                    <span className="text-sm font-bold">{Math.round(coreVitalsScore.score)}%</span>
                  </div>
                </div>
                
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {coreWebVitals.map((metric, index) => (
                      <MetricCard
                        key={index}
                        title={metric.name}
                        value={`${metric.value.toFixed(0)}${metric.name === 'CLS' ? '' : 'ms'}`}
                        rating={metric.rating}
                        threshold={
                          metric.name === 'LCP' ? '<2.5s' :
                          metric.name === 'FID' ? '<100ms' :
                          metric.name === 'CLS' ? '<0.1' :
                          metric.name === 'FCP' ? '<1.8s' :
                          metric.name === 'TTFB' ? '<800ms' : undefined
                        }
                        icon={
                          metric.rating === 'good' ? <CheckCircle className="w-4 h-4" /> :
                          metric.rating === 'needs-improvement' ? <Clock className="w-4 h-4" /> :
                          <AlertTriangle className="w-4 h-4" />
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bundle Size</span>
                  <span className="text-sm font-bold">
                    {(bundleSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {resourceMetrics.map((metric, index) => (
                      <MetricCard
                        key={index}
                        title={metric.name.replace('_', ' ')}
                        value={`${metric.value.toFixed(0)}${metric.name === 'BUNDLE_SIZE' ? 'KB' : 'ms'}`}
                        rating={metric.rating}
                        icon={<BarChart3 className="w-4 h-4" />}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {allMetrics.map((metric, index) => (
                    <MetricCard
                      key={index}
                      title={metric.name.replace('_', ' ')}
                      value={`${metric.value.toFixed(0)}ms`}
                      rating={metric.rating}
                      icon={<Zap className="w-4 h-4" />}
                    />
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