import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, Smartphone, Download, Bell, Zap } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  completed: boolean;
  icon: React.ReactNode;
}

export function PostInstallOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Trade\'n More!',
      description: 'Your trading app is now installed and ready to use. Let\'s get you started with the key features.',
      completed: false,
      icon: <Smartphone className="w-6 h-6" />
    },
    {
      id: 'notifications',
      title: 'Enable Trading Alerts',
      description: 'Get real-time notifications for market movements, trade opportunities, and important updates.',
      action: 'Enable Notifications',
      completed: false,
      icon: <Bell className="w-6 h-6" />
    },
    {
      id: 'offline',
      title: 'Offline Trading Tools',
      description: 'Access charts, educational content, and trading calculators even without internet connection.',
      completed: false,
      icon: <Download className="w-6 h-6" />
    },
    {
      id: 'features',
      title: 'Explore Key Features',
      description: 'Discover trading instruments, funding options, educational resources, and advanced tools.',
      action: 'Start Trading',
      completed: false,
      icon: <Zap className="w-6 h-6" />
    }
  ];

  const [onboardingSteps, setOnboardingSteps] = useState(steps);

  useEffect(() => {
    // Check if user just installed the app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const wasJustInstalled = sessionStorage.getItem('pwa_just_installed') === 'true';
    const hasSeenOnboarding = localStorage.getItem('pwa_onboarding_completed') === 'true';

    if ((isStandalone || wasJustInstalled) && !hasSeenOnboarding) {
      setTimeout(() => setIsVisible(true), 1000);
      sessionStorage.removeItem('pwa_just_installed');
    }
  }, []);

  const handleStepAction = async (stepId: string) => {
    switch (stepId) {
      case 'notifications':
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Show success notification
            new Notification('Trade\'n More', {
              body: 'You\'ll now receive real-time trading alerts!',
              icon: '/icon-192x192.png',
              tag: 'onboarding-notification'
            });
          }
          completeStep(stepId);
        } catch (error) {
          console.error('Notification permission error:', error);
          completeStep(stepId); // Continue even if notifications fail
        }
        break;
      
      case 'offline':
        // Simulate caching key pages
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_KEY_PAGES',
            pages: ['/products/trading-instruments', '/education', '/get-funded']
          });
        }
        completeStep(stepId);
        break;
      
      case 'features':
        // Track feature exploration
        if (typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.track('onboarding_completed', {
            source: 'pwa_install',
            steps_completed: onboardingSteps.filter(s => s.completed).length
          });
        }
        completeStep(stepId);
        break;
      
      default:
        completeStep(stepId);
    }
  };

  const completeStep = (stepId: string) => {
    setOnboardingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      )
    );

    // Move to next step
    const nextStepIndex = onboardingSteps.findIndex(s => s.id === stepId) + 1;
    if (nextStepIndex < onboardingSteps.length) {
      setTimeout(() => setCurrentStep(nextStepIndex), 500);
    } else {
      // All steps completed
      setTimeout(() => {
        setIsCompleted(true);
        localStorage.setItem('pwa_onboarding_completed', 'true');
        setTimeout(() => setIsVisible(false), 3000);
      }, 500);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('pwa_onboarding_completed', 'true');
    setIsVisible(false);
  };

  const progressPercentage = ((currentStep + 1) / onboardingSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-background border shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="text-primary"
                >
                  {onboardingSteps[currentStep]?.icon}
                </motion.div>
              </div>
              
              <CardTitle className="text-xl">
                {isCompleted ? 'You\'re All Set!' : onboardingSteps[currentStep]?.title}
              </CardTitle>
              
              <CardDescription>
                {isCompleted 
                  ? 'Welcome to the Trade\'n More community! Start exploring and happy trading.'
                  : onboardingSteps[currentStep]?.description
                }
              </CardDescription>
              
              {!isCompleted && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Step {currentStep + 1} of {onboardingSteps.length}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {!isCompleted ? (
                <>
                  {/* Current step content */}
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {onboardingSteps[currentStep]?.action ? (
                      <Button
                        onClick={() => handleStepAction(onboardingSteps[currentStep].id)}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {onboardingSteps[currentStep].action}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => completeStep(onboardingSteps[currentStep].id)}
                        className="w-full gap-2"
                        size="lg"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>

                  {/* Progress indicators */}
                  <div className="flex justify-center gap-2">
                    {onboardingSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index <= currentStep 
                            ? 'bg-primary' 
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Skip option */}
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipOnboarding}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Skip onboarding
                    </Button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Badge variant="secondary" className="justify-center">
                      <Bell className="w-3 h-3 mr-1" />
                      Alerts Ready
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      <Download className="w-3 h-3 mr-1" />
                      Offline Ready
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={() => setIsVisible(false)}
                    className="w-full"
                    size="lg"
                  >
                    Start Trading
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}