import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { SPACING } from "@/styles/spacing";

export function QuickCostWidget() {
  const { t } = useTranslation('common');
  const [lots, setLots] = useState(10);

  const calculateCost = (accountType: 'zero' | 'raw', lots: number) => {
    if (accountType === 'zero') {
      // Zero Commission: Higher spread but no commission
      return (lots * 1.2 * 10).toFixed(2); // 1.2 pip spread × $10 per pip
    } else {
      // Raw: Lower spread + commission
      const spreadCost = lots * 0.6 * 10; // 0.6 pip spread × $10 per pip
      const commission = lots * 5; // $5.00 commission per lot
      return (spreadCost + commission).toFixed(2);
    }
  };

  const getCostBreakdown = (accountType: 'zero' | 'raw', lots: number) => {
    if (accountType === 'zero') {
      return {
        spread: (lots * 1.2 * 10).toFixed(2),
        commission: '0.00',
        total: calculateCost(accountType, lots)
      };
    } else {
      const spreadCost = (lots * 0.6 * 10).toFixed(2);
      const commission = (lots * 5).toFixed(2);
      return {
        spread: spreadCost,
        commission: commission,
        total: calculateCost(accountType, lots)
      };
    }
  };

  const zeroCost = parseFloat(calculateCost('zero', lots));
  const rawCost = parseFloat(calculateCost('raw', lots));
  const savings = zeroCost - rawCost;
  const recommendedAccount = rawCost < zeroCost ? 'raw' : 'zero';
  const zeroBreakdown = getCostBreakdown('zero', lots);
  const rawBreakdown = getCostBreakdown('raw', lots);

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30 border-2 border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className={`w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center`}>
          <Calculator className={`${SPACING.icon.lg} text-primary`} />
        </div>
        <CardTitle className="text-xl">{t('products.accountTypes.quickCalc.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('products.accountTypes.quickCalc.subtitle')}</p>
      </CardHeader>
      
      <CardContent className={SPACING.gap.card}>
        {/* Input */}
        <div className={SPACING.stack.compact}>
          <Label htmlFor="lots-input" className="text-sm font-medium">
            {t('products.accountTypes.quickCalc.monthlyVolumeLabel')}
          </Label>
          <div className="relative">
            <Input
              id="lots-input"
              type="number"
              value={lots}
              onChange={(e) => setLots(Number(e.target.value) || 0)}
              className="pr-12"
              min="1"
              max="1000"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {t('products.accountTypes.quickCalc.lotsUnit')}
            </span>
          </div>
        </div>

        <Separator />

        {/* Results */}
        <div className={SPACING.stack.comfortable}>
          <div className={`grid grid-cols-2 ${SPACING.gap.medium}`}>
            <div className={`p-4 rounded-lg border ${recommendedAccount === 'zero' ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'}`}>
              <div className={`flex items-center ${SPACING.gap.small} mb-2`}>
                <div className="text-sm font-medium">{t('products.accountTypes.quickCalc.zeroCommission')}</div>
                {recommendedAccount === 'zero' && (
                  <Badge variant="secondary" className="text-xs">{t('products.accountTypes.quickCalc.mostPopularBadge')}</Badge>
                )}
              </div>
              <div className="text-lg font-bold mb-2">${zeroCost}</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('products.accountTypes.quickCalc.spreadWithPips', { pips: '1.2' })}</span>
                  <span>${zeroBreakdown.spread}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('products.accountTypes.quickCalc.commission')}</span>
                  <span>${zeroBreakdown.commission}</span>
                </div>
              </div>
            </div>
            
              <div className={`p-4 rounded-lg border ${recommendedAccount === 'raw' ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'}`}>
              <div className={`flex items-center ${SPACING.gap.small} mb-2`}>
                <div className="text-sm font-medium">{t('products.accountTypes.quickCalc.raw')}</div>
                {recommendedAccount === 'raw' && (
                  <Badge variant="secondary" className="text-xs">{t('products.accountTypes.quickCalc.bestBadge')}</Badge>
                )}
              </div>
              <div className="text-lg font-bold mb-2">${rawCost}</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('products.accountTypes.quickCalc.spreadWithPips', { pips: '0.6' })}</span>
                  <span>${rawBreakdown.spread}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('products.accountTypes.quickCalc.commission')}</span>
                  <span>${rawBreakdown.commission}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className={`flex items-center justify-center ${SPACING.gap.small} mb-1`}>
              <TrendingUp className={`${SPACING.icon.sm} text-accent`} />
              <span className="text-sm font-medium">{t('products.accountTypes.quickCalc.recommendation.title')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {recommendedAccount === 'zero' 
                ? t('products.accountTypes.quickCalc.recommendation.zero')
                : t('products.accountTypes.quickCalc.recommendation.raw', { savings: savings.toFixed(2) })
              }
            </div>
          </div>

          {/* Savings highlight */}
          {savings > 0 && recommendedAccount === 'raw' && (
            <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/30">
              <div className={`flex items-center justify-center ${SPACING.gap.iconButton} text-accent`}>
                <DollarSign className={SPACING.icon.sm} />
                <span className="text-sm font-medium">
                  {t('products.accountTypes.quickCalc.yearlySavings', { amount: (savings * 12).toFixed(0) })}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}