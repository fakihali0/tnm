import React, { useState, useEffect } from 'react';
import { useAccountStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnimatedStat } from '@/components/ui/animated-stat';
import { 
  Wallet, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Shield, 
  BarChart3,
  Zap,
  Clock,
  RefreshCw
} from 'lucide-react';
import { SPACING } from '@/styles/spacing';

interface LiveData {
  openPositions: number;
  totalUnrealizedPL: number;
  pendingOrders: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  sparklineData: number[];
  isUpdating: boolean;
}

export const LiveAccountPanel: React.FC = () => {
  const { selectedAccount } = useAccountStore();
  const [liveData, setLiveData] = useState<LiveData>({
    openPositions: 0,
    totalUnrealizedPL: 0,
    pendingOrders: 0,
    dailyDrawdown: 0,
    maxDrawdown: 0,
    sparklineData: [],
    isUpdating: false
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!selectedAccount) return;

    // Generate initial data
    const unrealizedPL = selectedAccount.equity - selectedAccount.balance;
    const dailyDD = Math.abs((unrealizedPL / selectedAccount.balance) * 100);
    
    setLiveData({
      openPositions: Math.floor(Math.random() * 8) + 1,
      totalUnrealizedPL: unrealizedPL,
      pendingOrders: Math.floor(Math.random() * 5),
      dailyDrawdown: dailyDD,
      maxDrawdown: Math.max(dailyDD, 3.2 + Math.random() * 2),
      sparklineData: Array.from({ length: 20 }, () => Math.random() * 100 - 50),
      isUpdating: false
    });

    // Set up real-time updates
    const interval = setInterval(() => {
      setLiveData(prev => {
        const change = (Math.random() - 0.5) * 50;
        const newUnrealizedPL = prev.totalUnrealizedPL + change;
        const newDailyDD = Math.abs((newUnrealizedPL / selectedAccount.balance) * 100);
        
        return {
          ...prev,
          totalUnrealizedPL: newUnrealizedPL,
          dailyDrawdown: newDailyDD,
          maxDrawdown: Math.max(prev.maxDrawdown, newDailyDD),
          sparklineData: [...prev.sparklineData.slice(1), change],
          isUpdating: Math.random() > 0.7 // Occasionally show updating state
        };
      });
      
      // Clear updating state after brief delay
      setTimeout(() => {
        setLiveData(prev => ({ ...prev, isUpdating: false }));
      }, 500);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedAccount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getMarginLevel = () => {
    if (!selectedAccount || selectedAccount.margin === 0) return 100;
    return (selectedAccount.equity / selectedAccount.margin) * 100;
  };

  const getMarginLevelColor = () => {
    const level = getMarginLevel();
    if (level > 200) return 'text-green-600';
    if (level > 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDrawdownColor = (dd: number) => {
    if (dd < 2) return 'text-green-600';
    if (dd < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!selectedAccount) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Live Account Data
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
    <div className={SPACING.stack.comfortable}>
      {/* Main Account Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center ${SPACING.gap.small}`}>
              <Wallet className={SPACING.icon.md} />
              {selectedAccount.platform} Account
              {liveData.isUpdating && <RefreshCw className={`${SPACING.icon.xs} animate-spin`} />}
            </CardTitle>
            <Badge variant="secondary">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className={SPACING.stack.comfortable}>
          {/* Core Metrics */}
          <div className={`grid grid-cols-2 ${SPACING.gap.medium}`}>
            <div className={SPACING.stack.tight}>
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-xl font-bold">
                <AnimatedStat target={selectedAccount.balance} prefix="$" />
              </div>
            </div>
            <div className={SPACING.stack.tight}>
              <div className="text-sm text-muted-foreground">Equity</div>
              <div className="text-xl font-bold">
                <AnimatedStat target={selectedAccount.equity} prefix="$" />
              </div>
            </div>
          </div>

          {/* Margin Information */}
          <div className={SPACING.stack.normal}>
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
              <span className={`font-bold ${getMarginLevelColor()}`}>
                {getMarginLevel().toFixed(1)}%
              </span>
            </div>
            
            {/* Margin Level Progress */}
            <div className={SPACING.stack.tight}>
              <Progress 
                value={Math.min(getMarginLevel(), 500)} 
                max={500}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
                <span>500%+</span>
              </div>
            </div>
          </div>

          {/* Leverage */}
          {selectedAccount.leverage && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className={`flex items-center ${SPACING.gap.small}`}>
                <Zap className={SPACING.icon.sm} />
                <span className="text-sm text-muted-foreground">Leverage</span>
              </div>
              <Badge variant="outline">1:{selectedAccount.leverage}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${SPACING.gap.small}`}>
            <Activity className={SPACING.icon.md} />
            Trading Activity
          </CardTitle>
        </CardHeader>
        <CardContent className={SPACING.stack.comfortable}>
          {/* Open Positions & Orders */}
          <div className={`grid grid-cols-2 ${SPACING.gap.medium}`}>
            <div className="text-center p-3 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold text-primary">
                <AnimatedStat target={liveData.openPositions} />
              </div>
              <div className="text-xs text-muted-foreground">Open Positions</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold text-muted-foreground">
                <AnimatedStat target={liveData.pendingOrders} />
              </div>
              <div className="text-xs text-muted-foreground">Pending Orders</div>
            </div>
          </div>

          {/* Unrealized P/L */}
          <div className={SPACING.stack.compact}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Unrealized P/L</span>
              <div className={`flex items-center gap-1 font-bold ${
                liveData.totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {liveData.totalUnrealizedPL >= 0 ? (
                  <TrendingUp className={SPACING.icon.xs} />
                ) : (
                  <TrendingDown className={SPACING.icon.xs} />
                )}
                <AnimatedStat 
                  target={liveData.totalUnrealizedPL} 
                  prefix={liveData.totalUnrealizedPL >= 0 ? '+$' : '-$'} 
                  decimals={2}
                />
              </div>
            </div>
            
            {/* Mini Sparkline */}
            <div className="h-8 bg-muted/30 rounded relative overflow-hidden">
              <div className="absolute inset-0 flex items-end justify-center">
                {liveData.sparklineData.map((value, index) => (
                  <div
                    key={index}
                    className={`w-1 mx-px ${value >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{
                      height: `${Math.max(2, (Math.abs(value) / 100) * 100)}%`,
                      opacity: index / liveData.sparklineData.length * 0.7 + 0.3
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawdown Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${SPACING.gap.small}`}>
            <Shield className={SPACING.icon.md} />
            Drawdown Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className={SPACING.stack.comfortable}>
          <div className={SPACING.stack.normal}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Daily Drawdown</span>
              <span className={`font-bold ${getDrawdownColor(liveData.dailyDrawdown)}`}>
                <AnimatedStat target={liveData.dailyDrawdown} suffix="%" decimals={2} />
              </span>
            </div>
            
            <Progress 
              value={liveData.dailyDrawdown} 
              max={10}
              className="h-2"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>5% Warning</span>
              <span>10% Limit</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Max Drawdown</span>
            <span className={`font-medium ${getDrawdownColor(liveData.maxDrawdown)}`}>
              <AnimatedStat target={liveData.maxDrawdown} suffix="%" decimals={2} />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};