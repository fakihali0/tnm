import React, { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface LazyTradingViewWidgetProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
}

export const LazyTradingViewWidget: React.FC<LazyTradingViewWidgetProps> = ({
  children,
  height = 400,
  className,
  fallback
}) => {
  const defaultFallback = fallback || (
    <div className={className}>
      <LoadingSkeleton variant="card" className="w-full h-[300px]" />
    </div>
  );

  return (
    <Suspense fallback={defaultFallback}>
      {children}
    </Suspense>
  );
};

// Enhanced wrapper for TradingView widgets with intersection observer
export const OptimizedTradingViewWidget: React.FC<{
  children: React.ReactNode;
  height?: number;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}> = ({
  children,
  height = 400,
  className,
  rootMargin = '100px',
  threshold = 0.1
}) => {
  const [isInView, setIsInView] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ minHeight: `${height}px` }}
    >
      {isInView ? (
        <LazyTradingViewWidget height={height} className={className}>
          {children}
        </LazyTradingViewWidget>
      ) : (
        <LoadingSkeleton variant="card" className="w-full h-full" />
      )}
    </div>
  );
};