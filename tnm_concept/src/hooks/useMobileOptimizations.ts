import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOptimizations {
  reducedAnimations: boolean;
  optimizedTouchTargets: boolean;
  swipeGestures: boolean;
  hapticFeedback: boolean;
  adaptivePerformance: boolean;
}

interface TouchCapabilities {
  supportsTouch: boolean;
  supportsHaptics: boolean;
  deviceMemory: number | undefined;
  connectionType: string | undefined;
}

export function useMobileOptimizations(): MobileOptimizations & TouchCapabilities & {
  triggerHapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
} {
  const isMobile = useIsMobile();
  const [capabilities, setCapabilities] = useState<TouchCapabilities>({
    supportsTouch: false,
    supportsHaptics: false,
    deviceMemory: undefined,
    connectionType: undefined
  });

  useEffect(() => {
    // Detect device capabilities
    const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const supportsHaptics = 'vibrate' in navigator;
    
    // @ts-ignore - Feature detection for experimental APIs
    const deviceMemory = navigator.deviceMemory;
    // @ts-ignore - Feature detection for experimental APIs
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connectionType = connection?.effectiveType;

    setCapabilities({
      supportsTouch,
      supportsHaptics,
      deviceMemory,
      connectionType
    });
  }, []);

  // Haptic feedback utility
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!capabilities.supportsHaptics) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [40]
    };

    navigator.vibrate(patterns[type]);
  }, [capabilities.supportsHaptics]);

  // Simplified optimization levels
  const optimizations: MobileOptimizations = {
    // Reduce animations on low-end devices
    reducedAnimations: isMobile && (
      (capabilities.deviceMemory !== undefined && capabilities.deviceMemory < 4) ||
      capabilities.connectionType === 'slow-2g' ||
      capabilities.connectionType === '2g'
    ),
    
    // Optimize touch targets for touch devices
    optimizedTouchTargets: capabilities.supportsTouch,
    
    // Disable swipe gestures to prevent scroll conflicts
    swipeGestures: false,
    
    // Simplified haptic - only on key actions
    hapticFeedback: capabilities.supportsHaptics && isMobile,
    
    // Adapt performance based on device
    adaptivePerformance: isMobile && capabilities.deviceMemory !== undefined
  };

  return {
    ...optimizations,
    ...capabilities,
    triggerHapticFeedback
  };
}

// Hook for mobile-optimized animations
export function useMobileAnimationConfig() {
  const { reducedAnimations, adaptivePerformance } = useMobileOptimizations();
  const isMobile = useIsMobile();

  return {
    // Simplified durations
    duration: isMobile ? 0.2 : 0.4,
    
    // Always use simple easing
    ease: "easeOut",
    
    // Disable complex animations on mobile
    enableComplexAnimations: !isMobile,
    
    // Faster stagger on mobile
    stagger: isMobile ? 0.03 : 0.1
  };
}