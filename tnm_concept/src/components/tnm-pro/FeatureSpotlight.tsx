import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SpotlightProps {
  target: string; // CSS selector for target element
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
  className?: string;
}

const getArrowIcon = (position: string) => {
  switch (position) {
    case 'top': return ArrowDown;
    case 'bottom': return ArrowUp;
    case 'left': return ArrowRight;
    case 'right': return ArrowLeft;
    default: return ArrowDown;
  }
};

export function FeatureSpotlight({
  target,
  title,
  description,
  position = 'auto',
  onClose,
  onNext,
  onPrevious,
  showNavigation = false,
  className
}: SpotlightProps) {
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = document.querySelector(target);
    if (element) {
      setTargetElement(element);
      
      const rect = element.getBoundingClientRect();
      setSpotlightPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });

      // Calculate optimal tooltip position
      if (position === 'auto') {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        if (rect.top > viewportHeight / 2) {
          setTooltipPosition('top');
        } else if (rect.left > viewportWidth / 2) {
          setTooltipPosition('left');
        } else if (rect.right < viewportWidth / 2) {
          setTooltipPosition('right');
        } else {
          setTooltipPosition('bottom');
        }
      } else {
        setTooltipPosition(position);
      }

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [target, position]);

  const getTooltipPosition = () => {
    if (!targetElement) return {};

    const margin = 16;
    
    switch (tooltipPosition) {
      case 'top':
        return {
          top: spotlightPosition.top - margin,
          left: spotlightPosition.left + spotlightPosition.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: spotlightPosition.top + spotlightPosition.height + margin,
          left: spotlightPosition.left + spotlightPosition.width / 2,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: spotlightPosition.top + spotlightPosition.height / 2,
          left: spotlightPosition.left - margin,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: spotlightPosition.top + spotlightPosition.height / 2,
          left: spotlightPosition.left + spotlightPosition.width + margin,
          transform: 'translate(0, -50%)'
        };
      default:
        return {};
    }
  };

  const ArrowIcon = getArrowIcon(tooltipPosition);

  if (!targetElement) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Spotlight cutout */}
      <div
        className="absolute border-4 border-primary shadow-2xl rounded-lg transition-all duration-300"
        style={{
          top: spotlightPosition.top - 4,
          left: spotlightPosition.left - 4,
          width: spotlightPosition.width + 8,
          height: spotlightPosition.height + 8,
          boxShadow: `
            0 0 0 4px rgba(59, 130, 246, 0.5),
            0 0 0 9999px rgba(0, 0, 0, 0.6)
          `
        }}
      />

      {/* Tooltip */}
      <AnimatePresence>
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute z-10"
          style={getTooltipPosition()}
        >
          <Card className={cn(
            "p-4 max-w-sm shadow-xl border-2 bg-background/95 backdrop-blur-sm",
            className
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{title}</h3>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {description}
            </p>

            {showNavigation && (onNext || onPrevious) && (
              <div className="flex justify-between gap-2">
                {onPrevious ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}
                
                {onNext ? (
                  <Button
                    size="sm"
                    onClick={onNext}
                    className="flex-1"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Got it
                  </Button>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Multi-step spotlight tour
interface SpotlightTourProps {
  steps: Array<{
    target: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  }>;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function SpotlightTour({ steps, isOpen, onClose, onComplete }: SpotlightTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen || steps.length === 0) return null;

  const currentStepData = steps[currentStep];

  return (
    <FeatureSpotlight
      target={currentStepData.target}
      title={currentStepData.title}
      description={currentStepData.description}
      position={currentStepData.position}
      onClose={onClose}
      onNext={currentStep < steps.length - 1 ? handleNext : undefined}
      onPrevious={currentStep > 0 ? handlePrevious : undefined}
      showNavigation={true}
    />
  );
}