import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ComparisonRow {
  riskPercentage: number;
  lotSize: number;
  riskAmount: number;
  potentialProfit: number;
}

interface RiskComparisonTableProps {
  accountBalance: number;
  stopLossDistance: number;
  takeProfitDistance: number;
  pipValue: number;
}

export function RiskComparisonTable({ 
  accountBalance, 
  stopLossDistance, 
  takeProfitDistance,
  pipValue 
}: RiskComparisonTableProps) {
  const { t } = useTranslation('risk-calculator');

  const riskLevels = [1, 1.5, 2, 2.5, 3];

  const calculations: ComparisonRow[] = riskLevels.map(risk => {
    const riskAmount = accountBalance * (risk / 100);
    const lotSize = riskAmount / (stopLossDistance * pipValue);
    const potentialProfit = lotSize * takeProfitDistance * pipValue;

    return {
      riskPercentage: risk,
      lotSize: Math.round(lotSize * 100) / 100,
      riskAmount: Math.round(riskAmount * 100) / 100,
      potentialProfit: Math.round(potentialProfit * 100) / 100,
    };
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t('comparison.title', 'Risk Comparison')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">{t('comparison.risk', 'Risk %')}</TableHead>
                <TableHead className="text-center">{t('comparison.lotSize', 'Lot Size')}</TableHead>
                <TableHead className="text-center">{t('comparison.riskAmount', 'Risk Amount')}</TableHead>
                <TableHead className="text-center">{t('comparison.potential', 'Potential Profit')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map((row) => (
                <TableRow key={row.riskPercentage} className="text-center">
                  <TableCell className="font-medium">
                    <span className={`px-2 py-1 rounded ${
                      row.riskPercentage < 2 ? 'bg-green-500/20 text-green-600' :
                      row.riskPercentage < 3 ? 'bg-yellow-500/20 text-yellow-600' :
                      'bg-red-500/20 text-red-600'
                    }`}>
                      {row.riskPercentage}%
                    </span>
                  </TableCell>
                  <TableCell>{row.lotSize}</TableCell>
                  <TableCell className="text-red-600 dark:text-red-400">${row.riskAmount}</TableCell>
                  <TableCell className="text-green-600 dark:text-green-400">${row.potentialProfit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
