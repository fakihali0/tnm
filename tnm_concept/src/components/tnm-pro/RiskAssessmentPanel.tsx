import React, { useState, useEffect, useMemo } from 'react';
import { useAccountStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calculator,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useRealInstruments } from '@/hooks/useRealInstruments';
import { SPACING } from '@/styles/spacing';

interface RiskRule {
  id: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  value: number;
  threshold: number;
  unit: string;
  description: string;
  actionable?: string;
}

interface TradeIdeaInputs {
  symbol: string;
  riskPercent: number;
  stopDistance: number;
  targetRR: number;
}

export const RiskAssessmentPanel: React.FC = () => {
  const { selectedAccount } = useAccountStore();
  const { instruments } = useRealInstruments();
  const [tradeInputs, setTradeInputs] = useState<TradeIdeaInputs>({
    symbol: 'EURUSD',
    riskPercent: 2,
    stopDistance: 20,
    targetRR: 2
  });
  const [isWeekend, setIsWeekend] = useState(false);
  const [rolloverRisk, setRolloverRisk] = useState(false);

  // Check for weekend and rollover conditions
  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    setIsWeekend(day === 0 || day === 6); // Sunday or Saturday
    setRolloverRisk(hour >= 21 || hour <= 3); // Between 9 PM and 3 AM
  }, []);

  // Calculate risk rules based on account data
  const riskRules = useMemo((): RiskRule[] => {
    if (!selectedAccount) return [];

    const marginLevel = selectedAccount.margin > 0 ? (selectedAccount.equity / selectedAccount.margin) * 100 : 100;
    const dailyDD = Math.abs(((selectedAccount.balance - selectedAccount.equity) / selectedAccount.balance) * 100);
    const freeMarginPercent = (selectedAccount.freeMargin / selectedAccount.equity) * 100;
    const leverageRatio = selectedAccount.leverage || 100;
    
    // Calculate position size for current trade idea
    const riskAmount = (selectedAccount.balance * tradeInputs.riskPercent) / 100;
    const pipValue = tradeInputs.symbol.includes('JPY') ? 0.01 : 0.0001;
    const contractSize = 100000;
    const valuePerPip = (contractSize * pipValue);
    const lotSize = riskAmount / (tradeInputs.stopDistance * valuePerPip);
    const requiredMargin = (lotSize * contractSize) / leverageRatio;
    const marginUsagePercent = (requiredMargin / selectedAccount.freeMargin) * 100;

    // Symbol concentration (mock calculation)
    const symbolExposure = 25 + Math.random() * 30; // Mock 25-55% exposure to this symbol

    return [
      {
        id: 'daily-dd',
        name: 'Daily Drawdown',
        status: dailyDD < 2 ? 'PASS' : dailyDD < 5 ? 'WARN' : 'FAIL',
        value: dailyDD,
        threshold: 5,
        unit: '%',
        description: 'Current daily drawdown vs risk limit',
        actionable: dailyDD >= 5 ? 'Reduce position sizes or stop trading' : dailyDD >= 2 ? 'Consider reducing risk' : 'Within safe limits'
      },
      {
        id: 'margin-level',
        name: 'Margin Level',
        status: marginLevel > 200 ? 'PASS' : marginLevel > 100 ? 'WARN' : 'FAIL',
        value: marginLevel,
        threshold: 100,
        unit: '%',
        description: 'Account margin level health',
        actionable: marginLevel <= 100 ? 'Close positions immediately - margin call risk' : marginLevel <= 200 ? 'Monitor closely, consider reducing positions' : 'Healthy margin level'
      },
      {
        id: 'free-margin',
        name: 'Free Margin',
        status: freeMarginPercent > 30 ? 'PASS' : freeMarginPercent > 10 ? 'WARN' : 'FAIL',
        value: freeMarginPercent,
        threshold: 10,
        unit: '%',
        description: 'Available margin for new positions',
        actionable: freeMarginPercent <= 10 ? 'Insufficient margin for new trades' : freeMarginPercent <= 30 ? 'Limited margin available' : 'Sufficient margin available'
      },
      {
        id: 'trade-margin',
        name: 'Trade Margin Usage',
        status: marginUsagePercent < 20 ? 'PASS' : marginUsagePercent < 50 ? 'WARN' : 'FAIL',
        value: marginUsagePercent,
        threshold: 50,
        unit: '%',
        description: 'Margin required for current trade idea',
        actionable: marginUsagePercent >= 50 ? 'Reduce lot size significantly' : marginUsagePercent >= 20 ? 'Consider smaller position' : 'Trade size appropriate'
      },
      {
        id: 'symbol-concentration',
        name: 'Symbol Concentration',
        status: symbolExposure < 30 ? 'PASS' : symbolExposure < 50 ? 'WARN' : 'FAIL',
        value: symbolExposure,
        threshold: 50,
        unit: '%',
        description: `Exposure to ${tradeInputs.symbol}`,
        actionable: symbolExposure >= 50 ? 'Overexposed to this symbol' : symbolExposure >= 30 ? 'High concentration, diversify' : 'Good diversification'
      },
      {
        id: 'concurrent-risk',
        name: 'Max Concurrent Risk',
        status: (tradeInputs.riskPercent * 3) < 6 ? 'PASS' : (tradeInputs.riskPercent * 3) < 10 ? 'WARN' : 'FAIL',
        value: tradeInputs.riskPercent * 3, // Assume 3 concurrent trades
        threshold: 10,
        unit: '%',
        description: 'Total risk if all positions hit stop loss',
        actionable: (tradeInputs.riskPercent * 3) >= 10 ? 'Reduce per-trade risk or number of positions' : (tradeInputs.riskPercent * 3) >= 6 ? 'Monitor total exposure' : 'Risk manageable'
      }
    ];
  }, [selectedAccount, tradeInputs]);

  // Calculate recommended lot size
  const recommendedLotSize = useMemo(() => {
    if (!selectedAccount) return 0;
    
    const riskAmount = (selectedAccount.balance * tradeInputs.riskPercent) / 100;
    const pipValue = tradeInputs.symbol.includes('JPY') ? 0.01 : 0.0001;
    const contractSize = 100000;
    const valuePerPip = contractSize * pipValue;
    const lotSize = riskAmount / (tradeInputs.stopDistance * valuePerPip);
    
    return Math.round(lotSize * 100) / 100;
  }, [selectedAccount, tradeInputs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'FAIL': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'WARN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'FAIL': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallStatus = () => {
    const failCount = riskRules.filter(rule => rule.status === 'FAIL').length;
    const warnCount = riskRules.filter(rule => rule.status === 'WARN').length;
    
    if (failCount > 0) return 'FAIL';
    if (warnCount > 0) return 'WARN';
    return 'PASS';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!selectedAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No account selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={SPACING.stack.comfortable}>
      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center ${SPACING.gap.small}`}>
              <Shield className={SPACING.icon.md} />
              Risk Assessment
            </CardTitle>
            <Badge className={getStatusColor(getOverallStatus())}>
              {getStatusIcon(getOverallStatus())}
              {getOverallStatus()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={SPACING.stack.normal}>
            {/* Daily DD Progress */}
            <div className={SPACING.stack.compact}>
              <div className="flex justify-between text-sm">
                <span>Daily Drawdown vs Limit</span>
                <span className="font-medium">
                  {riskRules.find(r => r.id === 'daily-dd')?.value.toFixed(2)}% / 5%
                </span>
              </div>
              <Progress 
                value={riskRules.find(r => r.id === 'daily-dd')?.value || 0} 
                max={5}
                className="h-2"
              />
            </div>
            
            {/* Market Conditions Warnings */}
            {(isWeekend || rolloverRisk) && (
              <div className={`flex items-center ${SPACING.gap.small} p-2 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-950/20`}>
                <Clock className={SPACING.icon.sm} />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  {isWeekend ? 'Weekend - Markets closed' : 'Rollover period - Increased spread risk'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trade Idea Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${SPACING.gap.small}`}>
            <Calculator className={SPACING.icon.md} />
            Trade Risk Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className={SPACING.stack.comfortable}>
          <div className={`grid grid-cols-2 ${SPACING.gap.medium}`}>
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select 
                value={tradeInputs.symbol}
                onValueChange={(value) => setTradeInputs(prev => ({ ...prev, symbol: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50 max-h-60 overflow-y-auto">
                  {['forex', 'indices', 'commodities', 'crypto'].map(category => (
                    <div key={category}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                      {instruments
                        .filter(inst => inst.assetClass.toLowerCase() === category)
                        .map(instrument => (
                          <SelectItem key={instrument.symbol} value={instrument.symbol}>
                            {instrument.symbol} - {instrument.name}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="risk-percent">Risk %</Label>
              <Input
                id="risk-percent"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={tradeInputs.riskPercent}
                onChange={(e) => setTradeInputs(prev => ({ ...prev, riskPercent: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stop-distance">Stop Distance (Pips)</Label>
              <Input
                id="stop-distance"
                type="number"
                min="1"
                value={tradeInputs.stopDistance}
                onChange={(e) => setTradeInputs(prev => ({ ...prev, stopDistance: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-rr">Target R:R</Label>
              <Select 
                value={tradeInputs.targetRR.toString()}
                onValueChange={(value) => setTradeInputs(prev => ({ ...prev, targetRR: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1:1</SelectItem>
                  <SelectItem value="1.5">1:1.5</SelectItem>
                  <SelectItem value="2">1:2</SelectItem>
                  <SelectItem value="3">1:3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Recommended Position Size */}
          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recommended Lot Size:</span>
              <span className="text-lg font-bold text-primary">{recommendedLotSize}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Risk Amount:</span>
              <span className="font-medium">
                {formatCurrency((selectedAccount.balance * tradeInputs.riskPercent) / 100)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Rules */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${SPACING.gap.small}`}>
            <Activity className={SPACING.icon.md} />
            Risk Rules Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={SPACING.stack.normal}>
            {riskRules.map((rule, index) => (
              <div key={rule.id}>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className={`flex items-center ${SPACING.gap.button}`}>
                    {getStatusIcon(rule.status)}
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">{rule.actionable}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(rule.status)}>
                      {rule.value.toFixed(1)}{rule.unit}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Limit: {rule.threshold}{rule.unit}
                    </div>
                  </div>
                </div>
                {index < riskRules.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};