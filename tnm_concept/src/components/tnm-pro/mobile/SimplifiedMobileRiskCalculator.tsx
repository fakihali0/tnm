import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useRealInstruments } from '@/hooks/useRealInstruments';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface RiskCalculation {
  lotSize: number;
  positionValue: number;
  riskAmount: number;
  valuePerPip: number;
  requiredMargin: number;
  rrRatio: string;
}

export const SimplifiedMobileRiskCalculator: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const { selectedAccount } = useAccountStore();
  const { instruments } = useRealInstruments();
  const [inputs, setInputs] = useState({
    balance: 0,
    riskPercent: 2,
    stopDistance: 20,
    symbol: 'EURUSD',
    leverage: 100,
    targetRR: 2,
  });

  useEffect(() => {
    if (selectedAccount) {
      setInputs(prev => ({
        ...prev,
        balance: selectedAccount.balance,
        leverage: selectedAccount.leverage || 100,
      }));
    }
  }, [selectedAccount]);

  const calculation = useMemo((): RiskCalculation => {
    const riskAmount = (inputs.balance * inputs.riskPercent) / 100;
    const pipValue = inputs.symbol.includes('JPY') ? 0.01 : 0.0001;
    const contractSize = 100000;
    
    const valuePerPip = (contractSize * pipValue) / inputs.leverage;
    const lotSize = riskAmount / (inputs.stopDistance * valuePerPip);
    const positionValue = lotSize * contractSize;
    const requiredMargin = positionValue / inputs.leverage;
    
    return {
      lotSize: Math.round(lotSize * 100) / 100,
      positionValue,
      riskAmount,
      valuePerPip: Math.round(valuePerPip * 100) / 100,
      requiredMargin,
      rrRatio: `1:${inputs.targetRR}`,
    };
  }, [inputs]);

  const riskAssessment = useMemo(() => {
    if (!selectedAccount) return null;
    
    const marginLevel = (selectedAccount.equity / selectedAccount.margin) * 100;
    const dailyDrawdown = ((selectedAccount.balance - selectedAccount.equity) / selectedAccount.balance) * 100;
    const freeMarginAfterTrade = selectedAccount.freeMargin - calculation.requiredMargin;
    
    return [
      {
        label: 'Margin Level',
        value: `${marginLevel.toFixed(1)}%`,
        status: marginLevel > 200 ? 'pass' : marginLevel > 100 ? 'warn' : 'fail',
      },
      {
        label: 'Daily Drawdown',
        value: `${Math.abs(dailyDrawdown).toFixed(2)}%`,
        status: Math.abs(dailyDrawdown) < 2 ? 'pass' : Math.abs(dailyDrawdown) < 5 ? 'warn' : 'fail',
      },
      {
        label: 'Free Margin',
        value: `$${freeMarginAfterTrade.toFixed(0)}`,
        status: freeMarginAfterTrade > 1000 ? 'pass' : freeMarginAfterTrade > 0 ? 'warn' : 'fail',
      },
    ];
  }, [selectedAccount, calculation]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  if (!selectedAccount) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card>
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle className="text-lg">{t('riskCalculator.noAccount.title')}</CardTitle>
            <CardDescription>
              {t('riskCalculator.linkAccountToUse')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <Accordion type="multiple" defaultValue={["inputs", "results"]} className="space-y-4">
        {/* Inputs Section */}
        <AccordionItem value="inputs" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="font-semibold">Trade Parameters</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Account Balance</Label>
              <Input
                id="balance"
                type="number"
                className="h-12 text-base"
                value={inputs.balance}
                onChange={(e) => setInputs(prev => ({ ...prev, balance: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="risk-percent">Risk per Trade (%)</Label>
              <Input
                id="risk-percent"
                type="number"
                className="h-12 text-base"
                step="0.1"
                min="0.1"
                max="10"
                value={inputs.riskPercent}
                onChange={(e) => setInputs(prev => ({ ...prev, riskPercent: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stop-distance">Stop Distance (Pips)</Label>
              <Input
                id="stop-distance"
                type="number"
                className="h-12 text-base"
                min="1"
                value={inputs.stopDistance}
                onChange={(e) => setInputs(prev => ({ ...prev, stopDistance: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full h-12 justify-start text-base">
                    {inputs.symbol}
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Select Symbol</DrawerTitle>
                    <DrawerDescription>Choose a trading instrument</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">
                    {['forex', 'indices', 'commodities', 'crypto'].map(category => (
                      <div key={category} className="mb-4">
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          {category}
                        </div>
                        <div className="space-y-1">
                          {instruments
                            .filter(inst => inst.assetClass.toLowerCase() === category)
                            .map(instrument => (
                              <DrawerClose asChild key={instrument.symbol}>
                                <Button
                                  variant={inputs.symbol === instrument.symbol ? "secondary" : "ghost"}
                                  className="w-full justify-start h-12"
                                  onClick={() => setInputs(prev => ({ ...prev, symbol: instrument.symbol }))}
                                >
                                  <span className="font-medium">{instrument.symbol}</span>
                                  <span className="text-muted-foreground ml-2 text-sm">{instrument.name}</span>
                                </Button>
                              </DrawerClose>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Results Section */}
        <AccordionItem value="results" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">Calculation Results</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground mb-1">Lot Size</div>
                  <div className="text-2xl font-bold">{calculation.lotSize}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground mb-1">Risk Amount</div>
                  <div className="text-2xl font-bold">{formatCurrency(calculation.riskAmount)}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Position Value</span>
                <span className="font-medium">{formatCurrency(calculation.positionValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Value per Pip</span>
                <span className="font-medium">{formatCurrency(calculation.valuePerPip)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Required Margin</span>
                <span className="font-medium">{formatCurrency(calculation.requiredMargin)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Risk Assessment */}
        {riskAssessment && (
          <AccordionItem value="assessment" className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-semibold">Risk Assessment</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {riskAssessment.map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(assessment.status)}
                    <div className="text-sm font-medium">{assessment.label}</div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {assessment.value}
                  </Badge>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
        <Button className="w-full h-12 text-base">
          Apply to Trade
        </Button>
      </div>
    </div>
  );
};
