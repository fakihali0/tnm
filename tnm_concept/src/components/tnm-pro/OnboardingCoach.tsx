import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { useCoaching } from '@/hooks/useCoaching';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  validation?: () => boolean;
}

interface OnboardingCoachProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingCoach({ isOpen, onClose, onComplete }: OnboardingCoachProps) {
  const { t } = useTranslation('tnm-ai');
  const { completeTip, setUserLevel } = useCoaching();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title', 'Meet Your AI Trading Assistant'),
      description: t('onboarding.welcome.description', 'Welcome to TNM AI - your intelligent trading companion. Let me show you how AI can transform your trading.'),
    },
    {
      id: 'dashboard',
      title: t('onboarding.dashboard.title', 'Performance Dashboard'),
      description: t('onboarding.dashboard.description', 'This is your main dashboard where you can see your trading performance metrics and key statistics.'),
      targetElement: '[data-onboarding="dashboard"]'
    },
    {
      id: 'link-account',
      title: t('onboarding.linkAccount.title', 'Link Your Trading Account'),
      description: t('onboarding.linkAccount.description', 'Connect your trading account to start receiving real-time analytics and insights.'),
      targetElement: '[data-onboarding="link-account"]',
      action: {
        label: t('onboarding.linkAccount.action', 'Link Account'),
        onClick: () => {
          // This would open the account linking modal
          console.log('Open account linking modal');
        }
      }
    },
    {
      id: 'journal',
      title: t('onboarding.journal.title', 'Trading Journal'),
      description: t('onboarding.journal.description', 'Record your trades manually or sync them automatically to track your progress and identify patterns.'),
      targetElement: '[data-onboarding="journal"]'
    },
    {
      id: 'analytics',
      title: t('onboarding.analytics.title', 'Advanced Analytics'),
      description: t('onboarding.analytics.description', 'Dive deep into your performance with detailed charts, risk metrics, and trading insights.'),
      targetElement: '[data-onboarding="analytics"]'
    },
    {
      id: 'complete',
      title: t('onboarding.complete.title', 'You\'re All Set!'),
      description: t('onboarding.complete.description', 'You\'ve completed the tour. Start by linking your account or adding your first trade to see TNM AI in action.'),
      action: {
        label: t('onboarding.complete.action', 'Get Started'),
        onClick: async () => {
          setIsCompleting(true);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate completion
          completeTip('onboarding-complete');
          setUserLevel('intermediate');
          onComplete();
          setIsCompleting(false);
        }
      }
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Highlight target element
  useEffect(() => {
    if (currentStepData.targetElement) {
      const element = document.querySelector(currentStepData.targetElement);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('onboarding-highlight');
        
        return () => {
          element.classList.remove('onboarding-highlight');
        };
      }
    }
  }, [currentStep, currentStepData.targetElement]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    completeTip('onboarding-skipped');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full max-w-md p-6 shadow-2xl border-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {currentStep + 1} / {steps.length}
                </span>
                <Progress value={progress} className="w-24 h-2" />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-center">
                {currentStepData.title}
              </h2>
              
              <p className="text-muted-foreground text-center leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {currentStepData.action && (
              <div className="mb-6 text-center">
                <Button
                  onClick={currentStepData.action.onClick}
                  disabled={isCompleting}
                  className="w-full"
                >
                  {isCompleting && <motion.div
                    className="h-4 w-4 mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⟳
                  </motion.div>}
                  {currentStepData.action.label}
                </Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1 mr-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={currentStepData.action?.onClick || onComplete}
                  disabled={isCompleting}
                  className="flex-1 ml-2"
                >
                  {isCompleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2"
                    >
                      ⟳
                    </motion.div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Complete
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex-1 ml-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {currentStep > 0 && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground"
                >
                  Skip tour
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}