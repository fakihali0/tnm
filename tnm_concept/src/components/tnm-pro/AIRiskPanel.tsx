import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useRTL } from '@/hooks/useRTL';

interface RiskRecommendation {
  type: 'position_size' | 'stop_loss' | 'leverage' | 'timing' | 'symbol_warning';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

interface AIRiskPanelProps {
  recommendations: {
    optimalRiskPercent: number;
    recommendedLotSize: number;
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
    recommendations: RiskRecommendation[];
    warnings: string[];
    confidence: number;
  };
  userRiskPercent: number;
  userLotSize: number;
  onApplyRecommendations: (riskPercent: number) => void;
}

export const AIRiskPanel: React.FC<AIRiskPanelProps> = ({
  recommendations,
  userRiskPercent,
  userLotSize,
  onApplyRecommendations,
}) => {
  const rtl = useRTL();
  
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'conservative': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'aggressive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  const isDifferentFromUser = Math.abs(recommendations.optimalRiskPercent - userRiskPercent) > 0.1;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" dir={rtl.dir}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-start">AI Risk Recommendations</CardTitle>
            <Badge variant="outline" className="ms-2">
              <Sparkles className="h-3 w-3 me-1" />
              AI-Powered
            </Badge>
          </div>
          <Badge className={getRiskLevelColor(recommendations.riskLevel)}>
            {recommendations.riskLevel.toUpperCase()}
          </Badge>
        </div>
        <CardDescription className="text-start">
          Personalized recommendations based on your trading history and current market conditions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Confidence Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AI Confidence</span>
            <span className="font-medium">{recommendations.confidence}%</span>
          </div>
          <Progress value={recommendations.confidence} className="h-2" />
        </div>

        <Separator />

        {/* Comparison Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Your Risk %</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{userRiskPercent}%</span>
              {isDifferentFromUser && userRiskPercent > recommendations.optimalRiskPercent && (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              {isDifferentFromUser && userRiskPercent < recommendations.optimalRiskPercent && (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">AI Suggested Risk %</span>
            <div className="text-2xl font-bold text-primary">
              {recommendations.optimalRiskPercent}%
            </div>
          </div>
        </div>

        {/* Recommended Lot Size */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
          <span className="text-sm font-medium">Recommended Lot Size</span>
          <span className="text-lg font-bold">{recommendations.recommendedLotSize}</span>
        </div>

        {/* Warnings */}
        {recommendations.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span>Important Warnings</span>
            </div>
            <div className="space-y-1">
              {recommendations.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-muted-foreground bg-orange-50 p-2 rounded">
                  • {warning}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-3">
          <div className="text-sm font-medium">AI Insights</div>
          {recommendations.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              {getImpactIcon(rec.impact)}
              <div className="flex-1">
                <div className="text-sm">{rec.message}</div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {rec.type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Apply Button */}
        {isDifferentFromUser && (
          <Button 
            className="w-full"
            onClick={() => onApplyRecommendations(recommendations.optimalRiskPercent)}
          >
            <Brain className="h-4 w-4 me-2" />
            Apply AI Recommendations ({recommendations.optimalRiskPercent}%)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};