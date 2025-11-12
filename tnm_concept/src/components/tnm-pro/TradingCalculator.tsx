import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { useRealInstruments } from '@/hooks/useRealInstruments';

interface TradingAccount {
  id: string;
  balance: number;
  equity: number;
  currency: string;
  leverage: number;
  margin: number;
  freeMargin: number;
}

interface TradingCalculatorProps {
  selectedAccount: TradingAccount | null;
}

interface CalculationResult {
  lotSize: number;
  positionValue: number;
  marginRequired: number;
  riskAmount: number;
  potentialProfit: number;
  potentialLoss: number;
  riskRewardRatio: number;
  marginUtilization: number;
  recommendation: 'conservative' | 'moderate' | 'aggressive' | 'high-risk';
}

export function TradingCalculator({ selectedAccount }: TradingCalculatorProps) {
  const { instruments } = useRealInstruments();
  const [symbol, setSymbol] = useState('EURUSD');
  const [entryPrice, setEntryPrice] = useState('1.0950');
  const [stopLoss, setStopLoss] = useState('1.0900');
  const [takeProfit, setTakeProfit] = useState('1.1050');
  const [riskPercentage, setRiskPercentage] = useState('2');
  const [calculationMethod, setCalculationMethod] = useState('risk-based');

  const calculation = useMemo((): CalculationResult | null => {
    if (!selectedAccount || !entryPrice || !stopLoss || !riskPercentage) {
      return null;
    }

    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const target = takeProfit ? parseFloat(takeProfit) : null;
    const riskPct = parseFloat(riskPercentage) / 100;
    
    if (entry <= 0 || stop <= 0 || riskPct <= 0) return null;

    // Calculate pip value and distance
    const pipDistance = Math.abs(entry - stop);
    const pipValue = 10; // Simplified for major pairs
    
    // Calculate position size based on risk
    const accountRisk = selectedAccount.equity * riskPct;
    const riskPerPip = pipDistance * pipValue;
    const lotSize = riskPerPip > 0 ? accountRisk / riskPerPip : 0;
    
    // Position value and margin calculations
    const positionValue = lotSize * 100000 * entry; // Standard lot = 100,000 units
    const marginRequired = positionValue / (selectedAccount.leverage || 100);
    
    // Profit/Loss calculations
    const potentialLoss = accountRisk;
    const potentialProfit = target ? Math.abs(target - entry) * pipValue * lotSize : 0;
    const riskRewardRatio = potentialLoss > 0 ? potentialProfit / potentialLoss : 0;
    
    // Margin utilization
    const marginUtilization = (marginRequired / selectedAccount.freeMargin) * 100;
    
    // Risk assessment
    let recommendation: CalculationResult['recommendation'] = 'conservative';
    if (marginUtilization > 50 || riskPct > 0.05) {
      recommendation = 'high-risk';
    } else if (marginUtilization > 30 || riskPct > 0.03) {
      recommendation = 'aggressive';
    } else if (marginUtilization > 15 || riskPct > 0.02) {
      recommendation = 'moderate';
    }

    return {
      lotSize: Math.round(lotSize * 100) / 100,
      positionValue,
      marginRequired,
      riskAmount: accountRisk,
      potentialProfit,
      potentialLoss,
      riskRewardRatio,
      marginUtilization,
      recommendation
    };
  }, [selectedAccount, entryPrice, stopLoss, takeProfit, riskPercentage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'conservative': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-blue-100 text-blue-800';
      case 'aggressive': return 'bg-orange-100 text-orange-800';
      case 'high-risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!selectedAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Position Size Calculator
          </CardTitle>
          <CardDescription>Advanced position sizing with risk management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Please select a trading account to use the calculator
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Position Size Calculator
        </CardTitle>
        <CardDescription>
          Calculate optimal position sizes with advanced risk management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(selectedAccount.equity)}</div>
            <div className="text-sm text-muted-foreground">Account Equity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(selectedAccount.freeMargin)}</div>
            <div className="text-sm text-muted-foreground">Free Margin</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">1:{selectedAccount.leverage}</div>
            <div className="text-sm text-muted-foreground">Leverage</div>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Trading Symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
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
            <Label htmlFor="method">Calculation Method</Label>
            <Select value={calculationMethod} onValueChange={setCalculationMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk-based">Risk-Based Sizing</SelectItem>
                <SelectItem value="fixed-lots">Fixed Lot Size</SelectItem>
                <SelectItem value="percent-equity">Percent of Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry">Entry Price</Label>
            <Input
              id="entry"
              type="number"
              step="0.00001"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="1.0950"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stop">Stop Loss</Label>
            <Input
              id="stop"
              type="number"
              step="0.00001"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="1.0900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Take Profit (Optional)</Label>
            <Input
              id="target"
              type="number"
              step="0.00001"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="1.1050"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk">Risk Percentage</Label>
            <Input
              id="risk"
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={riskPercentage}
              onChange={(e) => setRiskPercentage(e.target.value)}
              placeholder="2.0"
            />
          </div>
        </div>

        <Separator />

        {/* Calculation Results */}
        {calculation ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Calculation Results</h3>
              <Badge className={getRecommendationColor(calculation.recommendation)}>
                {calculation.recommendation.charAt(0).toUpperCase() + calculation.recommendation.slice(1)} Risk
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-xl font-bold text-primary">{calculation.lotSize}</div>
                <div className="text-sm text-muted-foreground">Lot Size</div>
              </div>
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-xl font-bold">{formatCurrency(calculation.marginRequired)}</div>
                <div className="text-sm text-muted-foreground">Margin Required</div>
              </div>
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-xl font-bold">{formatCurrency(calculation.riskAmount)}</div>
                <div className="text-sm text-muted-foreground">Risk Amount</div>
              </div>
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-xl font-bold">{calculation.riskRewardRatio.toFixed(2)}:1</div>
                <div className="text-sm text-muted-foreground">Risk:Reward</div>
              </div>
            </div>

            {/* Risk Analysis */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Risk Analysis</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Margin Utilization:</span>
                  <span className={calculation.marginUtilization > 50 ? 'text-red-500 font-semibold' : ''}>
                    {calculation.marginUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Position Value:</span>
                  <span>{formatCurrency(calculation.positionValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Potential Profit:</span>
                  <span className="text-green-600">{formatCurrency(calculation.potentialProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Potential Loss:</span>
                  <span className="text-red-600">{formatCurrency(calculation.potentialLoss)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1">
                <Target className="h-4 w-4 mr-2" />
                Place Order
              </Button>
              <Button variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Save Setup
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Enter valid trading parameters to see calculations
          </div>
        )}
      </CardContent>
    </Card>
  );
}