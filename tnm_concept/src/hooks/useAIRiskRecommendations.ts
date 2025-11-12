import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RiskRecommendation {
  type: 'position_size' | 'stop_loss' | 'leverage' | 'timing' | 'symbol_warning';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

interface AIRiskRecommendations {
  optimalRiskPercent: number;
  recommendedLotSize: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  recommendations: RiskRecommendation[];
  warnings: string[];
  confidence: number;
  usedFallback?: boolean;
}

export const useAIRiskRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRiskRecommendations | null>(null);
  const { toast } = useToast();

  const fetchRecommendations = async (params: {
    accountId: string;
    symbol: string;
    balance: number;
    riskPercent: number;
    stopDistance: number;
    leverage: number;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-risk-recommendations', {
        body: params
      });

      if (error) throw error;

      if (data.success) {
        setRecommendations(data);
        
        if (data.usedFallback) {
          toast({
            title: 'AI Recommendations Generated',
            description: 'Using fallback analysis due to AI service limitations',
            variant: 'default',
          });
        }
      } else {
        throw new Error(data.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      toast({
        title: 'Failed to Generate AI Recommendations',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setRecommendations(null);
    } finally {
      setLoading(false);
    }
  };

  const clearRecommendations = () => {
    setRecommendations(null);
  };

  return {
    loading,
    recommendations,
    fetchRecommendations,
    clearRecommendations
  };
};