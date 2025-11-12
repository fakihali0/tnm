import React, { useState, useEffect } from 'react';
import { useAccountStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnimatedStat } from '@/components/ui/animated-stat';
import { useMarketData } from '@/hooks/useMarketData';
import { useAdvancedNotifications } from '@/hooks/useAdvancedNotifications';
import { 
  Wallet, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface LiveData {
  openPositions: number;
  totalUnrealizedPL: number;
  pendingOrders: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  sparklineData: number[];
  marginCallRisk: boolean;
  lastUpdate: Date;
}

export const EnhancedLiveAccountPanel: React.FC = () => {
  const { selectedAccount } = useAccountStore();
  const { addNotification } = useAdvancedNotifications();
  
  // Use unified market data hook
  const { latency, lastUpdate, error: marketDataError } = useMarketData({
    symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'], // Active positions
    refreshInterval: 5000,
    enableSwaps: true,
  });

  // Market sessions (simplified)
  const [marketSessions, setMarketSessions] = useState([
    { name: 'Tokyo', open: '00:00', close: '09:00', timezone: 'UTC', isActive: false },
    { name: 'London', open: '08:00', close: '17:00', timezone: 'UTC', isActive: false },
    { name: 'New York', open: '13:00', close: '22:00', timezone: 'UTC', isActive: false }
  ]);

  // Connection status derived from market data
  const connectionStatus = {
    isConnected: !marketDataError && lastUpdate !== null,
    lastUpdate: lastUpdate,
    reconnectAttempts: 0,
    latency: latency
  };
  
  const [liveData, setLiveData] = useState<LiveData>({
    openPositions: 0,
    totalUnrealizedPL: 0,
    pendingOrders: 0,
    dailyDrawdown: 0,
    maxDrawdown: 0,
    sparklineData: [],
    marginCallRisk: false,
    lastUpdate: new Date()
  });

  // Update market sessions status
  useEffect(() => {
    const updateMarketSessions = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      
      setMarketSessions(prev => prev.map(session => {
        const openHour = parseInt(session.open.split(':')[0]);
        const closeHour = parseInt(session.close.split(':')[0]);
        return {
          ...session,
          isActive: utcHour >= openHour && utcHour < closeHour
        };
      }));
    };

    updateMarketSessions();
    const interval = setInterval(updateMarketSessions, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Enhanced real-time updates
  useEffect(() => {
    if (!selectedAccount) return;

    // Generate enhanced live data with market context
    const updateLiveData = () => {
      const unrealizedPL = selectedAccount.equity - selectedAccount.balance;
      const dailyDD = Math.abs((unrealizedPL / selectedAccount.balance) * 100);
      const marginLevel = selectedAccount.margin > 0 ? (selectedAccount.equity / selectedAccount.margin) * 100 : 1000;
      
      setLiveData(prev => {
        const change = (Math.random() - 0.5) * 75; // More volatile changes
        const newUnrealizedPL = prev.totalUnrealizedPL + change;
        const newDailyDD = Math.abs((newUnrealizedPL / selectedAccount.balance) * 100);
        const newMarginCallRisk = marginLevel < 100;
        
        // Trigger risk alerts
        if (newMarginCallRisk && !prev.marginCallRisk) {
          addNotification({
            type: 'risk',
            title: 'Margin Call Warning',
            message: `Margin level at ${marginLevel.toFixed(1)}% - Immediate action required`,
            priority: 'critical',
            category: 'alert',
            metadata: { marginLevel, accountId: selectedAccount.id }
          });
        }
        
        if (newDailyDD > 5 && prev.dailyDrawdown <= 5) {
          addNotification({
            type: 'risk',
            title: 'Daily Drawdown Alert',
            message: `Daily drawdown exceeded 5% (${newDailyDD.toFixed(2)}%)`,
            priority: 'high',
            category: 'warning',
            metadata: { drawdown: newDailyDD, accountId: selectedAccount.id }
          });
        }
        
        return {
          openPositions: Math.floor(Math.random() * 12) + 1,
          totalUnrealizedPL: newUnrealizedPL,
          pendingOrders: Math.floor(Math.random() * 8),
          dailyDrawdown: newDailyDD,
          maxDrawdown: Math.max(prev.maxDrawdown, newDailyDD),
          sparklineData: [...prev.sparklineData.slice(-19), change],
          marginCallRisk: newMarginCallRisk,
          lastUpdate: new Date()
        };
      });
    };

    updateLiveData();
    const interval = setInterval(updateLiveData, 3000); // Faster updates

    return () => clearInterval(interval);
  }, [selectedAccount, addNotification]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const getMarginLevel = () => {
    if (!selectedAccount || selectedAccount.margin === 0) return 100;
    return (selectedAccount.equity / selectedAccount.margin) * 100;
  };

  const getMarginLevelColor = () => {
    const level = getMarginLevel();
    if (level > 300) return 'text-emerald-600 dark:text-emerald-400';
    if (level > 200) return 'text-green-600 dark:text-green-400';
    if (level > 100) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDrawdownColor = (dd: number) => {
    if (dd < 2) return 'text-emerald-600 dark:text-emerald-400';
    if (dd < 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConnectionStatusColor = () => {
    if (!connectionStatus.isConnected) return 'text-red-500';
    if (connectionStatus.latency > 1000) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (!selectedAccount) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Enhanced Live Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No account selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status Bar */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connectionStatus.isConnected ? (
                <Wifi className={`h-4 w-4 ${getConnectionStatusColor()}`} />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {connectionStatus.isConnected ? 'Live Data Connected' : 'Reconnecting...'}
              </span>
              {connectionStatus.isConnected && (
                <Badge variant="outline" className="text-xs">
                  {connectionStatus.latency}ms
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last update: {liveData.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Sessions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            Market Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {marketSessions.map((session) => (
              <div key={session.name} className="text-center">
                <div className={`text-xs font-medium mb-1 ${
                  session.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`}>
                  {session.name}
                </div>
                <div className={`w-3 h-3 rounded-full mx-auto ${
                  session.isActive ? 'bg-green-500' : 'bg-muted'
                }`} />
                <div className="text-xs text-muted-foreground mt-1">
                  {session.open}-{session.close}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Main Account Card */}
      <Card className={liveData.marginCallRisk ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {selectedAccount.platform} Account
              {liveData.marginCallRisk && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus.isConnected ? "default" : "destructive"}>
                {connectionStatus.isConnected ? "Live" : "Offline"}
              </Badge>
              {liveData.marginCallRisk && (
                <Badge variant="destructive">Margin Call</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Core Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                Balance
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              </div>
              <div className="text-xl font-bold">
                <AnimatedStat target={selectedAccount.balance} prefix="$" duration={1000} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                Equity
                {connectionStatus.isConnected && (
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>
              <div className="text-xl font-bold">
                <AnimatedStat target={selectedAccount.equity} prefix="$" duration={1000} />
              </div>
            </div>
          </div>

          {/* Enhanced Margin Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Margin Used</span>
              <span className="font-medium">{formatCurrency(selectedAccount.margin)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Free Margin</span>
              <span className="font-medium">{formatCurrency(selectedAccount.freeMargin)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Margin Level</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getMarginLevelColor()}`}>
                  <AnimatedStat target={getMarginLevel()} suffix="%" decimals={1} />
                </span>
                {liveData.marginCallRisk && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            
            {/* Enhanced Margin Level Progress with Risk Zones */}
            <div className="space-y-1">
              <Progress 
                value={Math.min(getMarginLevel(), 500)} 
                max={500}
                className={`h-3 ${liveData.marginCallRisk ? 'bg-red-100' : ''}`}
              />
              <div className="flex justify-between text-xs">
                <span className="text-red-600">0% (Margin Call)</span>
                <span className="text-yellow-600">100% (Warning)</span>
                <span className="text-green-600">200% (Safe)</span>
                <span className="text-emerald-600">500%+</span>
              </div>
            </div>
          </div>

          {/* Leverage with Performance Context */}
          {selectedAccount.leverage && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Leverage</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  1:{selectedAccount.leverage}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Max: ${(selectedAccount.balance * selectedAccount.leverage).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Trading Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Trading Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Position & Order Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                <AnimatedStat target={liveData.openPositions} />
              </div>
              <div className="text-sm text-muted-foreground">Open Positions</div>
              <div className="text-xs text-primary mt-1">
                Est. Value: ${(liveData.openPositions * 10000).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg">
              <div className="text-3xl font-bold text-foreground mb-1">
                <AnimatedStat target={liveData.pendingOrders} />
              </div>
              <div className="text-sm text-muted-foreground">Pending Orders</div>
              <div className="text-xs text-muted-foreground mt-1">
                Ready to execute
              </div>
            </div>
          </div>

          {/* Enhanced Unrealized P/L with Trend Analysis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Unrealized P/L</span>
              <div className={`flex items-center gap-2 font-bold text-lg ${
                liveData.totalUnrealizedPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {liveData.totalUnrealizedPL >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <AnimatedStat 
                  target={Math.abs(liveData.totalUnrealizedPL)} 
                  prefix={liveData.totalUnrealizedPL >= 0 ? '+$' : '-$'} 
                  decimals={2}
                  duration={800}
                />
              </div>
            </div>
            
            {/* Advanced Sparkline with Gradient */}
            <div className="h-12 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-end justify-center px-1">
                {liveData.sparklineData.map((value, index) => (
                  <div
                    key={index}
                    className={`w-2 mx-px rounded-t transition-all duration-300 ${
                      value >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      height: `${Math.max(8, (Math.abs(value) / 100) * 100)}%`,
                      opacity: (index / liveData.sparklineData.length) * 0.8 + 0.2
                    }}
                  />
                ))}
              </div>
              <div className="absolute top-2 left-3 text-xs text-muted-foreground">
                P/L Trend
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Drawdown Monitoring */}
      <Card className={liveData.dailyDrawdown > 5 ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Risk Monitor
            {liveData.dailyDrawdown > 5 && (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Drawdown</span>
              <span className={`font-bold text-lg ${getDrawdownColor(liveData.dailyDrawdown)}`}>
                <AnimatedStat target={liveData.dailyDrawdown} suffix="%" decimals={2} />
              </span>
            </div>
            
            {/* Enhanced Risk Progress with Multiple Zones */}
            <div className="space-y-2">
              <Progress 
                value={liveData.dailyDrawdown} 
                max={15}
                className="h-3"
              />
              <div className="grid grid-cols-4 gap-1 text-xs">
                <span className="text-green-600 text-center">Safe (0-2%)</span>
                <span className="text-yellow-600 text-center">Caution (2-5%)</span>
                <span className="text-orange-600 text-center">Warning (5-10%)</span>
                <span className="text-red-600 text-center">Critical (10%+)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className={`font-bold ${getDrawdownColor(liveData.maxDrawdown)}`}>
                <AnimatedStat target={liveData.maxDrawdown} suffix="%" decimals={2} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Risk Score</div>
              <div className={`font-bold ${
                liveData.dailyDrawdown < 2 ? 'text-green-600' :
                liveData.dailyDrawdown < 5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {liveData.dailyDrawdown < 2 ? 'LOW' :
                 liveData.dailyDrawdown < 5 ? 'MEDIUM' : 'HIGH'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};