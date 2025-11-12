import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@/store/auth';
import { useRTL } from '@/hooks/useRTL';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Shield, AlertTriangle, CheckCircle, XCircle, Brain, Sparkles } from 'lucide-react';
import { useRealInstruments } from '@/hooks/useRealInstruments';
import { useAIRiskRecommendations } from '@/hooks/useAIRiskRecommendations';
import { AIRiskPanel } from './AIRiskPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { SimplifiedMobileRiskCalculator } from './mobile/SimplifiedMobileRiskCalculator';

interface RiskCalculation {
  lotSize: number;
  positionValue: number;
  riskAmount: number;
  valuePerPip: number;
  requiredMargin: number;
  rrRatio: string;
}

export const RiskCalculator: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const isMobile = useIsMobile();
  const rtl = useRTL();
  const { selectedAccount } = useAccountStore();
  const { instruments } = useRealInstruments();
  const { loading: aiLoading, recommendations, fetchRecommendations, clearRecommendations } = useAIRiskRecommendations();
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

  const handleGetAIRecommendations = async () => {
    if (!selectedAccount) return;
    
    await fetchRecommendations({
      accountId: selectedAccount.id,
      symbol: inputs.symbol,
      balance: inputs.balance,
      riskPercent: inputs.riskPercent,
      stopDistance: inputs.stopDistance,
      leverage: inputs.leverage
    });
  };

  const handleApplyAIRecommendations = (aiRiskPercent: number) => {
    setInputs(prev => ({
      ...prev,
      riskPercent: aiRiskPercent
    }));
  };

  const calculation = useMemo((): RiskCalculation => {
    const riskAmount = (inputs.balance * inputs.riskPercent) / 100;
    const pipValue = inputs.symbol.includes('JPY') ? 0.01 : 0.0001;
    const contractSize = 100000; // Standard lot size
    
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
    
    const assessments = [
      {
        label: t('riskCalculator.assessment.marginLevel.label'),
        value: `${marginLevel.toFixed(1)}%`,
        status: marginLevel > 200 ? 'pass' : marginLevel > 100 ? 'warn' : 'fail',
        description: marginLevel > 200 
          ? t('riskCalculator.assessment.marginLevel.healthy')
          : marginLevel > 100 
            ? t('riskCalculator.assessment.marginLevel.acceptable')
            : t('riskCalculator.assessment.marginLevel.dangerous'),
      },
      {
        label: t('riskCalculator.assessment.dailyDrawdown.label'),
        value: `${Math.abs(dailyDrawdown).toFixed(2)}%`,
        status: Math.abs(dailyDrawdown) < 2 ? 'pass' : Math.abs(dailyDrawdown) < 5 ? 'warn' : 'fail',
        description: Math.abs(dailyDrawdown) < 2 
          ? t('riskCalculator.assessment.dailyDrawdown.low')
          : Math.abs(dailyDrawdown) < 5 
            ? t('riskCalculator.assessment.dailyDrawdown.moderate')
            : t('riskCalculator.assessment.dailyDrawdown.high'),
      },
      {
        label: t('riskCalculator.assessment.freeMargin.label'),
        value: `$${freeMarginAfterTrade.toFixed(2)}`,
        status: freeMarginAfterTrade > 1000 ? 'pass' : freeMarginAfterTrade > 0 ? 'warn' : 'fail',
        description: freeMarginAfterTrade > 1000 
          ? t('riskCalculator.assessment.freeMargin.sufficient')
          : freeMarginAfterTrade > 0 
            ? t('riskCalculator.assessment.freeMargin.limited')
            : t('riskCalculator.assessment.freeMargin.insufficient'),
      },
    ];
    
    return assessments;
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
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'fail': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Use mobile version on mobile devices
  if (isMobile) {
    return <SimplifiedMobileRiskCalculator />;
  }

  if (!selectedAccount) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="text-center">
          <CardHeader>
            <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
            <CardTitle>{t('riskCalculator.noAccount.title')}</CardTitle>
            <CardDescription>
              {t('riskCalculator.noAccount.description')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={rtl.dir}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-start">
              <Calculator className="h-5 w-5 me-2" />
              {t('riskCalculator.title')}
            </CardTitle>
            <CardDescription className="text-start">
              {t('riskCalculator.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance" className="text-start">{t('riskCalculator.inputs.accountBalance')}</Label>
              <Input
                id="balance"
                type="number"
                value={inputs.balance}
                onChange={(e) => setInputs(prev => ({ ...prev, balance: Number(e.target.value) }))}
                dir={rtl.dir}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="risk-percent" className="text-start">{t('riskCalculator.inputs.riskPerTrade')}</Label>
              <Input
                id="risk-percent"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={inputs.riskPercent}
                onChange={(e) => setInputs(prev => ({ ...prev, riskPercent: Number(e.target.value) }))}
                dir={rtl.dir}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stop-distance" className="text-start">{t('riskCalculator.inputs.stopDistance')}</Label>
              <Input
                id="stop-distance"
                type="number"
                min="1"
                value={inputs.stopDistance}
                onChange={(e) => setInputs(prev => ({ ...prev, stopDistance: Number(e.target.value) }))}
                dir={rtl.dir}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-start">{t('riskCalculator.inputs.symbol')}</Label>
              <Select 
                value={inputs.symbol}
                onValueChange={(value) => setInputs(prev => ({ ...prev, symbol: value }))}
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
              <Label htmlFor="target-rr" className="text-start">{t('riskCalculator.inputs.targetRiskReward')}</Label>
              <Select 
                value={inputs.targetRR.toString()}
                onValueChange={(value) => setInputs(prev => ({ ...prev, targetRR: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1:1</SelectItem>
                  <SelectItem value="1.5">1:1.5</SelectItem>
                  <SelectItem value="2">1:2</SelectItem>
                  <SelectItem value="3">1:3</SelectItem>
                  <SelectItem value="4">1:4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('riskCalculator.results.title')}</CardTitle>
            <CardDescription className="text-start">
              {t('riskCalculator.results.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground text-start">{t('riskCalculator.results.lotSize')}</Label>
                <div className="text-2xl font-bold text-start">{calculation.lotSize}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground text-start">{t('riskCalculator.results.riskAmount')}</Label>
                <div className="text-2xl font-bold text-start">{formatCurrency(calculation.riskAmount)}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground text-start">{t('riskCalculator.results.positionValue')}:</span>
                <span className="font-medium text-start">{formatCurrency(calculation.positionValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground text-start">{t('riskCalculator.results.valuePerPip')}:</span>
                <span className="font-medium text-start">{formatCurrency(calculation.valuePerPip)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground text-start">{t('riskCalculator.results.requiredMargin')}:</span>
                <span className="font-medium text-start">{formatCurrency(calculation.requiredMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground text-start">{t('riskCalculator.results.targetRR')}:</span>
                <span className="font-medium text-start">{calculation.rrRatio}</span>
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGetAIRecommendations}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <Sparkles className="h-4 w-4 me-2 animate-pulse" />
                    {t('riskCalculator.actions.analyzing')}
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 me-2" />
                    {t('riskCalculator.actions.getAIRecommendations')}
                  </>
                )}
              </Button>
              <Button className="w-full">
                {t('riskCalculator.actions.applyToTrade')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Risk Panel */}
      {recommendations && (
        <AIRiskPanel
          recommendations={recommendations}
          userRiskPercent={inputs.riskPercent}
          userLotSize={calculation.lotSize}
          onApplyRecommendations={handleApplyAIRecommendations}
        />
      )}

      {/* Real-time Assessment */}
      {riskAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-start">
              <Shield className="h-5 w-5 me-2" />
              {t('riskCalculator.assessment.title')}
            </CardTitle>
            <CardDescription className="text-start">
              {t('riskCalculator.assessment.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {riskAssessment.map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(assessment.status)}
                    <div>
                      <div className="font-medium text-start">{assessment.label}</div>
                      <div className="text-sm text-muted-foreground text-start">{assessment.description}</div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(assessment.status)}>
                    {assessment.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};