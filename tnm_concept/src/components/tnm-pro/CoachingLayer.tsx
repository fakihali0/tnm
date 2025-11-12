import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Target, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface CoachingTip {
  id: string;
  type: 'onboarding' | 'feature' | 'improvement' | 'warning';
  title: string;
  content: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface CoachingLayerProps {
  currentPage?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  showTips?: boolean;
  onDismiss?: (tipId: string) => void;
}

const getTipIcon = (type: CoachingTip['type']) => {
  switch (type) {
    case 'onboarding': return Target;
    case 'feature': return Lightbulb;
    case 'improvement': return TrendingUp;
    case 'warning': return Shield;
    default: return Lightbulb;
  }
};

const getTipColor = (type: CoachingTip['type']) => {
  switch (type) {
    case 'onboarding': return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300';
    case 'feature': return 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300';
    case 'improvement': return 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300';
    case 'warning': return 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300';
    default: return 'bg-muted border-muted-foreground/20';
  }
};

export function CoachingLayer({ 
  currentPage = 'dashboard',
  userLevel = 'beginner',
  showTips = true,
  onDismiss
}: CoachingLayerProps) {
  const { t } = useTranslation('tnm-ai');
  const [activeTips, setActiveTips] = useState<CoachingTip[]>([]);
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);

  // Mock tips - in real app, these would come from context/user behavior
  const availableTips: CoachingTip[] = [
    {
      id: 'welcome-dashboard',
      type: 'onboarding',
      title: t('coaching.welcome.title', 'Welcome to TNM AI'),
      content: t('coaching.welcome.content', 'Start by linking your trading account to see your performance analytics.'),
      priority: 'high',
      category: 'onboarding',
      action: {
        label: t('coaching.welcome.action', 'Link Account'),
        onClick: () => console.log('Navigate to account linking')
      }
    },
    {
      id: 'journal-tip',
      type: 'feature',
      title: t('coaching.journal.title', 'Track Your Trades'),
      content: t('coaching.journal.content', 'Use the trading journal to record insights and improve your strategy.'),
      priority: 'medium',
      category: 'feature'
    },
    {
      id: 'risk-warning',
      type: 'warning',
      title: t('coaching.risk.title', 'Risk Management'),
      content: t('coaching.risk.content', 'Your current position size is higher than recommended. Consider reducing risk.'),
      priority: 'high',
      category: 'risk'
    }
  ];

  useEffect(() => {
    if (!showTips) return;

    // Filter tips based on context and user level
    const contextualTips = availableTips.filter(tip => {
      if (dismissedTips.includes(tip.id)) return false;
      
      // Show different tips based on user level
      if (userLevel === 'beginner' && tip.type === 'onboarding') return true;
      if (userLevel === 'intermediate' && tip.type === 'feature') return true;
      if (tip.type === 'warning') return true; // Always show warnings
      
      return false;
    });

    setActiveTips(contextualTips.slice(0, 2)); // Show max 2 tips at once
  }, [currentPage, userLevel, showTips, dismissedTips]);

  const handleDismiss = (tipId: string) => {
    setDismissedTips(prev => [...prev, tipId]);
    setActiveTips(prev => prev.filter(tip => tip.id !== tipId));
    onDismiss?.(tipId);
  };

  if (!showTips || activeTips.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm space-y-3">
      <AnimatePresence>
        {activeTips.map((tip) => {
          const Icon = getTipIcon(tip.type);
          
          return (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className={`p-4 border-2 ${getTipColor(tip.type)} shadow-lg backdrop-blur-sm`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">{tip.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-background/20"
                        onClick={() => handleDismiss(tip.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {tip.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {tip.category}
                      </Badge>
                      
                      {tip.action && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={tip.action.onClick}
                        >
                          {tip.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}