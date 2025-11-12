import { useState, useEffect, useCallback, useRef } from 'react';
import { useMobileOptimizations } from './useMobileOptimizations';

export interface AnimationSequenceConfig {
  enableSequencing?: boolean;
  backgroundDelay?: number;
  contentDelay?: number;
  staggerDelay?: number;
}

export interface AnimationSequenceState {
  isBackgroundReady: boolean;
  isContentReady: boolean;
  isStaggerReady: boolean;
  shouldAnimateBackground: boolean;
  shouldAnimateContent: boolean;
  shouldAnimateStagger: boolean;
}

const DEFAULT_CONFIG: Required<AnimationSequenceConfig> = {
  enableSequencing: true,
  backgroundDelay: 100,
  contentDelay: 300,
  staggerDelay: 150
};

export function useAnimationSequence(config: AnimationSequenceConfig = {}) {
  const { reducedAnimations } = useMobileOptimizations();
  const [sequenceState, setSequenceState] = useState<AnimationSequenceState>({
    isBackgroundReady: false,
    isContentReady: false,
    isStaggerReady: false,
    shouldAnimateBackground: false,
    shouldAnimateContent: false,
    shouldAnimateStagger: false
  });
  
  const [isSystemReady, setIsSystemReady] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isInitializedRef = useRef(false);
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Disable sequencing if reduced animations are preferred
  const shouldSequence = finalConfig.enableSequencing && !reducedAnimations;
  
  const initializeSequence = useCallback(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    
    // First, mark system as ready after a brief prep phase
    const systemReadyTimeout = setTimeout(() => {
      setIsSystemReady(true);
    }, 50);
    
    if (!shouldSequence) {
      // If sequencing is disabled, enable everything after system is ready
      const immediateTimeout = setTimeout(() => {
        setSequenceState({
          isBackgroundReady: true,
          isContentReady: true,
          isStaggerReady: true,
          shouldAnimateBackground: true,
          shouldAnimateContent: true,
          shouldAnimateStagger: true
        });
      }, 100);
      timeoutsRef.current = [systemReadyTimeout, immediateTimeout];
      return;
    }
    
    // Phase 1: Start background animations after system is ready
    const backgroundTimeout = setTimeout(() => {
      setSequenceState(prev => ({
        ...prev,
        shouldAnimateBackground: true
      }));
    }, 100 + finalConfig.backgroundDelay);
    
    // Phase 2: Background animations complete, start content
    const backgroundReadyTimeout = setTimeout(() => {
      setSequenceState(prev => ({
        ...prev,
        isBackgroundReady: true,
        shouldAnimateContent: true
      }));
    }, finalConfig.backgroundDelay + finalConfig.contentDelay);
    
    // Phase 3: Content ready, start staggered animations
    const contentReadyTimeout = setTimeout(() => {
      setSequenceState(prev => ({
        ...prev,
        isContentReady: true,
        shouldAnimateStagger: true
      }));
    }, finalConfig.backgroundDelay + finalConfig.contentDelay + finalConfig.staggerDelay);
    
    // Phase 4: Everything is ready
    const allReadyTimeout = setTimeout(() => {
      setSequenceState(prev => ({
        ...prev,
        isStaggerReady: true
      }));
    }, finalConfig.backgroundDelay + finalConfig.contentDelay + finalConfig.staggerDelay + 100);
    
    timeoutsRef.current = [
      systemReadyTimeout,
      backgroundTimeout,
      backgroundReadyTimeout,
      contentReadyTimeout,
      allReadyTimeout
    ];
  }, [shouldSequence, finalConfig]);
  
  useEffect(() => {
    initializeSequence();
    
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [initializeSequence]);
  
  // Helper functions for animation configuration
  const getBackgroundConfig = useCallback(() => ({
    shouldAnimate: shouldSequence ? (isSystemReady && sequenceState.shouldAnimateBackground) : true,
    isReady: shouldSequence ? sequenceState.isBackgroundReady : true,
    opacity: shouldSequence ? (isSystemReady && sequenceState.shouldAnimateBackground ? 1 : 0) : 1,
    transition: { duration: shouldSequence ? 0.8 : 0.3, ease: "easeOut" }
  }), [isSystemReady, sequenceState, shouldSequence]);
  
  const getContentConfig = useCallback(() => ({
    shouldAnimate: isSystemReady && sequenceState.shouldAnimateContent,
    isReady: sequenceState.isContentReady,
    delay: shouldSequence ? 0 : 0.1,
    transition: { duration: shouldSequence ? 0.6 : 0.3, ease: "easeOut" }
  }), [isSystemReady, sequenceState, shouldSequence]);
  
  const getStaggerConfig = useCallback(() => ({
    shouldAnimate: sequenceState.shouldAnimateStagger,
    isReady: sequenceState.isStaggerReady,
    stagger: shouldSequence ? 0.08 : 0.04,
    delayChildren: shouldSequence ? 0.1 : 0,
    transition: { duration: shouldSequence ? 0.5 : 0.2, ease: "easeOut" }
  }), [sequenceState, shouldSequence]);
  
  return {
    sequenceState,
    isSystemReady,
    isSequencingEnabled: shouldSequence,
    getBackgroundConfig,
    getContentConfig,
    getStaggerConfig,
    resetSequence: () => {
      isInitializedRef.current = false;
      setIsSystemReady(false);
      initializeSequence();
    }
  };
}