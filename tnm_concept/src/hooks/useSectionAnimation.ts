import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { type MotionProps, type Transition } from "framer-motion";
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useAnimationPerformance } from './useAnimationPerformance';
import { useMobileAnimationConfig } from './useMobileOptimizations';

export type UseSectionAnimationOptions = {
  amount?: number;
  once?: boolean;
  margin?: string;
  delay?: number;
  duration?: number;
  ease?: number[] | string;
  forceImmediate?: boolean;
  waitForSequence?: boolean;
  sequenceReady?: boolean;
};

export type UseSectionAnimationResult = {
  motionProps: MotionProps;
  transition: Transition;
  prefersReducedMotion: boolean;
  elementRef: React.RefObject<any>;
  reducedMotionClassName: string;
};

// Track if this is the first page load
let isFirstPageLoad = true;
let pageLoadTime = Date.now();

export function useSectionAnimation(
  options: UseSectionAnimationOptions = {}
): UseSectionAnimationResult {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shouldUseImmediate, setShouldUseImmediate] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasCheckedRef = useRef(false);
  const elementRef = useRef<any>(null);
  const activeAnimationsRef = useRef(0);
  
  // Performance optimizations
  const { getOptimizedTransition, getGPUStyles } = useAnimationPerformance({
    enableGPUAcceleration: true,
    adaptiveDuration: true,
    throttleAnimations: true
  });
  
  const mobileConfig = useMobileAnimationConfig();
  
  const {
    amount = 0.3,
    once = true,
    margin,
    delay = 0,
    duration = mobileConfig.duration,
    ease = mobileConfig.ease,
    forceImmediate = false,
    waitForSequence = false,
    sequenceReady = true
  } = options;

  // Check if we should wait for animation sequence
  const canAnimate = !waitForSequence || sequenceReady;

  useEffect(() => {
    if (!hasCheckedRef.current) {
      // Only use immediate animation when explicitly requested
      setShouldUseImmediate(forceImmediate);
      hasCheckedRef.current = true;
    }
  }, [forceImmediate]);

  // Base animation lifecycle handlers
  const baseAnimationStart = useCallback(() => {
    if (!prefersReducedMotion && elementRef.current) {
      elementRef.current.classList.add("animate-hints");
      // Apply GPU styles for hardware acceleration
      const gpuStyles = getGPUStyles();
      Object.assign(elementRef.current.style, gpuStyles);
    }
  }, [prefersReducedMotion, getGPUStyles]);

  const baseAnimationComplete = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.classList.remove("animate-hints");
      // Clean up GPU styles after animation
      elementRef.current.style.willChange = 'auto';
    }
  }, []);

  const baseMotionProps = useMemo<MotionProps>(() => {
    const baseProps: MotionProps = {
      onAnimationStart: baseAnimationStart,
      onAnimationComplete: baseAnimationComplete
    };

    if (prefersReducedMotion || !canAnimate) {
      return {
        ...baseProps,
        initial: "visible",
        animate: canAnimate ? "visible" : "hidden"
      };
    }

    // Use immediate animation for first load, scroll-triggered for subsequent
    if (shouldUseImmediate && canAnimate) {
      return {
        ...baseProps,
        initial: "hidden",
        animate: "visible"
      };
    }

    if (!canAnimate) {
      return {
        ...baseProps,
        initial: "hidden",
        animate: "hidden"
      };
    }

    return {
      ...baseProps,
      initial: "hidden",
      whileInView: "visible",
      viewport: {
        amount,
        once,
        margin
      }
    };
  }, [
    prefersReducedMotion,
    shouldUseImmediate,
    canAnimate,
    amount,
    once,
    margin,
    baseAnimationStart,
    baseAnimationComplete
  ]);

  // Enhanced animation handlers to track active animations
  const motionProps = useMemo<MotionProps>(() => {
    const {
      onAnimationStart: existingOnAnimationStart,
      onAnimationComplete: existingOnAnimationComplete,
      ...restMotionProps
    } = baseMotionProps;

    type AnimationStartArgs = Parameters<NonNullable<MotionProps["onAnimationStart"]>>;
    type AnimationCompleteArgs = Parameters<NonNullable<MotionProps["onAnimationComplete"]>>;

    return {
      ...restMotionProps,
      onAnimationStart: (...args: AnimationStartArgs) => {
        if (!prefersReducedMotion) {
          activeAnimationsRef.current += 1;
          setIsAnimating(true);
        }

        existingOnAnimationStart?.(...args);
      },
      onAnimationComplete: (...args: AnimationCompleteArgs) => {
        if (!prefersReducedMotion) {
          const nextCount = Math.max(0, activeAnimationsRef.current - 1);
          activeAnimationsRef.current = nextCount;

          if (nextCount === 0) {
            setIsAnimating(false);
          }
        } else {
          activeAnimationsRef.current = 0;
          setIsAnimating(false);
        }

        existingOnAnimationComplete?.(...args);
      }
    };
  }, [baseMotionProps, prefersReducedMotion]);

  const transition = useMemo<Transition>(() => {
    if (prefersReducedMotion) {
      return { duration: 0 };
    }

    const baseTransition = {
      delay: shouldUseImmediate ? delay : delay,
      duration,
      ease
    };

    // Apply performance optimizations
    return getOptimizedTransition(baseTransition);
  }, [prefersReducedMotion, shouldUseImmediate, delay, duration, ease, getOptimizedTransition]);

  return {
    motionProps,
    transition,
    prefersReducedMotion,
    elementRef,
    reducedMotionClassName: prefersReducedMotion ? "animate-hints-reduced-motion" : ""
  };
}

// Reset page load tracking when navigating
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    isFirstPageLoad = true;
    pageLoadTime = Date.now();
  });
}
