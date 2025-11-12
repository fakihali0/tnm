/**
 * Admin Performance Monitoring Dashboard
 * Real-time monitoring of app performance, security events, and errors
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, Shield, Zap, Database, Users } from 'lucide-react';
import { prodLogger } from '@/utils/production-logger';
import { credentialSecurity } from '@/utils/credential-security';
import { supabase } from '@/integrations/supabase/client';
import { SkeletonChart, SkeletonCard } from '@/components/ui/skeleton-loader';

export default function PerformanceMonitor() {
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [errorBuffer, setErrorBuffer] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get performance metrics
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      setPerformanceMetrics({
        domContentLoaded: Math.round(perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart),
        loadComplete: Math.round(perfData?.loadEventEnd - perfData?.loadEventStart),
        firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0),
        totalResources: performance.getEntriesByType('resource').length
      });

      // Get recent security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setSecurityEvents(events || []);

      // Get error buffer
      setErrorBuffer(prodLogger.getErrorBuffer());

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const getSeverityColor = (eventType: string) => {
    if (eventType.includes('failed') || eventType.includes('suspicious')) return 'destructive';
    if (eventType.includes('unauthorized')) return 'destructive';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-muted-foreground">Real-time application monitoring and security</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <Activity className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Load</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics?.loadComplete || 0}ms</div>
            <p className="text-xs text-muted-foreground">Load event complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DOM Ready</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics?.domContentLoaded || 0}ms</div>
            <p className="text-xs text-muted-foreground">DOM content loaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics?.totalResources || 0}</div>
            <p className="text-xs text-muted-foreground">Total loaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorBuffer.length}</div>
            <p className="text-xs text-muted-foreground">Recent errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Error Log
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Users className="mr-2 h-4 w-4" />
            Credential Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Last 10 security-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No security events recorded</p>
                ) : (
                  securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(event.event_type)}>
                            {event.event_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          IP: {event.ip_address}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Buffer</CardTitle>
              <CardDescription>Recent application errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorBuffer.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No errors recorded</p>
                ) : (
                  errorBuffer.map((err, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-destructive/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{err.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(err.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {err.error && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(err.error, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credential Access Logs</CardTitle>
              <CardDescription>Recent credential access attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {credentialSecurity.getAccessLogs().slice(-10).map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.action === 'delete' ? 'destructive' : 'secondary'}>
                          {log.action}
                        </Badge>
                        <span className="text-sm">Account: {log.accountId.slice(0, 8)}...</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        User: {log.userId.slice(0, 8)}... at {log.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {credentialSecurity.getAccessLogs().length === 0 && (
                  <p className="text-sm text-muted-foreground">No credential access logged</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
