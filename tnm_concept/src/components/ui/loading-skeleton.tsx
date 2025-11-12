import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  lineClassName?: string;
}

export function LoadingSkeleton({
  className,
  lineClassName,
  variant = 'default',
  width,
  height,
  lines = 3,
  ...props
}: LoadingSkeletonProps) {
  const baseClasses = "animate-skeleton bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]";

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              "h-[1em] rounded",
              lineClassName,
              !lineClassName && className,
              width === undefined && (i === lines - 1 ? "w-3/4" : "w-full")
            )}
            style={{
              width: width ?? (i === lines - 1 ? "75%" : undefined),
              height
            }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    default: "rounded",
    circular: "rounded-full",
    text: "h-4 rounded w-full",
    card: "rounded-lg"
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        variant === 'default' && "h-4 w-full",
        variant === 'card' && "h-32 w-full",
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// Optimized loading skeletons for specific components
export function TradingViewSkeleton() {
  return (
    <div className="w-full h-20 bg-card border-y p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <LoadingSkeleton variant="circular" width={32} height={32} />
          <div className="space-y-2">
            <LoadingSkeleton width={80} height={12} />
            <LoadingSkeleton width={60} height={10} />
          </div>
        </div>
        <div className="flex space-x-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <LoadingSkeleton width={60} height={12} />
              <LoadingSkeleton width={50} height={10} className="mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton
          variant="text"
          lines={2}
          lineClassName="font-poppins text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight sm:leading-tight md:leading-tight"
        />
        <LoadingSkeleton
          variant="text"
          lines={2}
          className="max-w-2xl mx-auto"
          lineClassName="text-lg font-medium leading-7 text-muted-foreground sm:text-xl md:text-2xl md:leading-8"
        />
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LoadingSkeleton width={200} height={48} className="rounded-lg" />
          <LoadingSkeleton width={200} height={48} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function InstrumentCardSkeleton() {
  return (
    <div className="trading-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <LoadingSkeleton width={80} height={20} />
        <LoadingSkeleton width={60} height={16} />
      </div>
      
      <div className="space-y-2">
        <LoadingSkeleton width="100%" height={16} />
        <LoadingSkeleton width="75%" height={16} />
      </div>
      
      <div className="flex justify-between items-center">
        <LoadingSkeleton width={96} height={32} className="rounded-lg" />
        <LoadingSkeleton width={96} height={32} className="rounded-lg" />
      </div>
      
      <div className="space-y-1">
        <LoadingSkeleton width="100%" height={12} />
        <LoadingSkeleton width="66%" height={12} />
      </div>
    </div>
  );
}

export function InstrumentTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-2 p-4">
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        <LoadingSkeleton width={96} height={16} />
        <LoadingSkeleton width={128} height={16} />
        <LoadingSkeleton width={80} height={16} />
        <LoadingSkeleton width={80} height={16} />
        <LoadingSkeleton width={64} height={16} />
        <LoadingSkeleton width={64} height={16} />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 py-2">
          <LoadingSkeleton width={96} height={32} />
          <LoadingSkeleton width={128} height={32} />
          <LoadingSkeleton width={80} height={32} />
          <LoadingSkeleton width={80} height={32} />
          <LoadingSkeleton width={64} height={32} />
          <LoadingSkeleton width={64} height={32} />
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}