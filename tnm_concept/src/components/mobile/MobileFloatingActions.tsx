import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SPACING } from '@/styles/spacing';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface FloatingAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

interface MobileFloatingActionsProps {
  actions: FloatingAction[];
  mainIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function MobileFloatingActions({
  actions,
  mainIcon: MainIcon = Plus,
  className,
  position = 'bottom-right'
}: MobileFloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hapticFeedback, triggerHapticFeedback } = useMobileOptimizations();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (hapticFeedback) {
      triggerHapticFeedback(isOpen ? 'light' : 'medium');
    }
  };

  const handleActionClick = (action: FloatingAction) => {
    if (hapticFeedback) triggerHapticFeedback('light');
    action.onClick();
    setIsOpen(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-24 left-4';
      case 'bottom-center':
        return 'bottom-24 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-24 right-4';
    }
  };

  const getActionsPosition = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-20 left-4';
      case 'bottom-center':
        return 'bottom-20 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-20 right-4';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(`fixed z-50 ${SPACING.stack.normal}`, getActionsPosition())}
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ 
                    delay: index * 0.1, 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25 
                  }}
                  className={`flex items-center ${SPACING.gap.button}`}
                >
                  {/* Action Label */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                    className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border"
                  >
                    <span className="text-sm font-medium whitespace-nowrap">
                      {action.label}
                    </span>
                  </motion.div>
                  
                  {/* Action Button */}
                  <Button
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full shadow-lg text-white border-0",
                      action.color
                    )}
                    onClick={() => handleActionClick(action)}
                  >
                    <ActionIcon className={SPACING.icon.md} />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        className={cn(
          "fixed w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50",
          getPositionClasses(),
          className
        )}
        style={{ boxShadow: '0 8px 25px -8px hsl(var(--primary) / 0.4)' }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleToggle}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className={SPACING.icon.lg} /> : <MainIcon className={SPACING.icon.lg} />}
        </motion.div>
      </motion.button>
    </>
  );
}