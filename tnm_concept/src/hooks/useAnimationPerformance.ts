import { useEffect, useState, useCallback } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface AnimationPerformanceConfig {
  enableGPUAcceleration?: boolean;
  throttleAnimations?: boolean;
  adaptiveDuration?: boolean;
  enablePerformanceMetrics?: boolean;
}

interface PerformanceMetrics {
  fps: number;
  isLowPerformance: boolean;
  deviceCapability: 'high' | 'medium' | 'low';
}

export function useAnimationPerformance(config: AnimationPerformanceConfig = {}) {
  const {
    enableGPUAcceleration = true,
    throttleAnimations = true,
    adaptiveDuration = true,
    enablePerformanceMetrics = false
  } = config;

  const prefersReducedMotion = usePrefersReducedMotion();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    isLowPerformance: false,
    deviceCapability: 'high'
  });
  const [isThrottled, setIsThrottled] = useState(false);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMetrics || prefersReducedMotion) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measurePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const isLowPerformance = fps < 30;
        
        let deviceCapability: 'high' | 'medium' | 'low' = 'high';
        if (fps < 20) deviceCapability = 'low';
        else if (fps < 45) deviceCapability = 'medium';

        setMetrics({ fps, isLowPerformance, deviceCapability });
        
        // Auto-throttle if performance is poor
        if (throttleAnimations && isLowPerformance && !isThrottled) {
          setIsThrottled(true);
        }

        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enablePerformanceMetrics, prefersReducedMotion, throttleAnimations, isThrottled]);

  // Get optimized animation duration based on device performance
  const getOptimizedDuration = useCallback((baseDuration: number): number => {
    if (prefersReducedMotion) return 0;
    if (!adaptiveDuration) return baseDuration;

    switch (metrics.deviceCapability) {
      case 'low':
        return baseDuration * 0.5; // 50% faster
      case 'medium':
        return baseDuration * 0.75; // 25% faster
      default:
        return baseDuration;
    }
  }, [prefersReducedMotion, adaptiveDuration, metrics.deviceCapability]);

  // Get optimized transition settings
  const getOptimizedTransition = useCallback((baseTransition: any = {}) => {
    if (prefersReducedMotion) {
      return { duration: 0 };
    }

    const optimizedDuration = getOptimizedDuration(baseTransition.duration || 0.6);
    
    return {
      ...baseTransition,
      duration: optimizedDuration,
      ease: isThrottled ? "easeOut" : (baseTransition.ease || [0.22, 1, 0.36, 1])
    };
  }, [prefersReducedMotion, getOptimizedDuration, isThrottled]);

  // Get GPU acceleration styles
  const getGPUStyles = useCallback((): React.CSSProperties => {
    if (!enableGPUAcceleration || prefersReducedMotion) {
      return {};
    }

    return {
      willChange: 'transform, opacity',
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden' as const,
    };
  }, [enableGPUAcceleration, prefersReducedMotion]);

  // Performance-aware animation variants
  const createPerformantVariants = useCallback((baseVariants: any) => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 1 },
        visible: { opacity: 1 }
      };
    }

    const optimizedVariants = { ...baseVariants };
    
    // Simplify animations for low-performance devices
    if (metrics.deviceCapability === 'low') {
      Object.keys(optimizedVariants).forEach(key => {
        if (optimizedVariants[key].scale) {
          delete optimizedVariants[key].scale; // Remove scale animations
        }
        if (optimizedVariants[key].rotate) {
          delete optimizedVariants[key].rotate; // Remove rotation
        }
      });
    }

    return optimizedVariants;
  }, [prefersReducedMotion, metrics.deviceCapability]);

  return {
    metrics,
    isThrottled,
    getOptimizedDuration,
    getOptimizedTransition,
    getGPUStyles,
    createPerformantVariants,
    shouldAnimate: !prefersReducedMotion && !isThrottled
  };
}