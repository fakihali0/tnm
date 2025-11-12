import React, { ReactNode, useRef, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false
}: PullToRefreshProps) {
  const { hapticFeedback, triggerHapticFeedback } = useMobileOptimizations();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePanStart = () => {
    if (disabled || isRefreshing) return;
    
    // Only trigger pull-to-refresh if we're at the top of the scroll container
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      if (hapticFeedback) triggerHapticFeedback('light');
    }
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;
    
    const isAtTop = containerRef.current && containerRef.current.scrollTop === 0;
    const isPullingDown = info.delta.y > 0;
    
    // Only handle pull-to-refresh when at top AND pulling down
    if (isAtTop && isPullingDown) {
      if (event.preventDefault) event.preventDefault();
      const newDistance = Math.min(info.delta.y * 0.5, threshold * 1.5);
      setPullDistance(newDistance);
      
      // Haptic feedback when reaching threshold
      if (newDistance > threshold && pullDistance <= threshold && hapticFeedback) {
        triggerHapticFeedback('medium');
      }
    }
  };

  const handlePanEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance > threshold) {
      setIsRefreshing(true);
      if (hapticFeedback) triggerHapticFeedback('heavy');
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const isReadyToRefresh = pullDistance > threshold;

  return (
    <div className={className}>
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: pullProgress, 
            height: Math.min(pullDistance, threshold) 
          }}
          className="flex items-center justify-center bg-muted/50 overflow-hidden"
        >
          <div className="flex items-center gap-2 py-2">
            {isRefreshing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">Refreshing...</span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ 
                    rotate: isReadyToRefresh ? 180 : 0,
                    scale: isReadyToRefresh ? 1.1 : 1
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <ArrowDown className="h-5 w-5 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">
                  {isReadyToRefresh ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ 
          y: pullDistance,
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}