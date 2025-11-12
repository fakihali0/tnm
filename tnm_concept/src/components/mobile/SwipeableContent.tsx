import React, { ReactNode } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface SwipeableContentProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeableContent({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
  className,
  disabled = false
}: SwipeableContentProps) {
  const { swipeGestures, hapticFeedback, triggerHapticFeedback } = useMobileOptimizations();

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !swipeGestures) return;

    const { offset, velocity } = info;
    const swipeThreshold = threshold;
    const velocityThreshold = 500;

    // Determine swipe direction based on offset and velocity
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
        // Swipe right
        if (onSwipeRight) {
          if (hapticFeedback) triggerHapticFeedback('light');
          onSwipeRight();
        }
      } else if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
        // Swipe left
        if (onSwipeLeft) {
          if (hapticFeedback) triggerHapticFeedback('light');
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
        // Swipe down
        if (onSwipeDown) {
          if (hapticFeedback) triggerHapticFeedback('light');
          onSwipeDown();
        }
      } else if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
        // Swipe up
        if (onSwipeUp) {
          if (hapticFeedback) triggerHapticFeedback('light');
          onSwipeUp();
        }
      }
    }
  };

  if (!swipeGestures || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      drag={swipeGestures && !disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}