/**
 * Skeleton Loader Components
 * Provides loading states for various UI components
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circular' | 'chart';
  count?: number;
}

export const Skeleton = ({ className, variant = 'default' }: SkeletonProps) => {
  const baseClasses = "animate-pulse bg-muted";
  
  const variantClasses = {
    default: "rounded-md",
    card: "rounded-lg h-32",
    text: "rounded h-4",
    circular: "rounded-full",
    chart: "rounded-lg h-64"
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
};

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3 p-4 border rounded-lg bg-card", className)}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" /> {/* Header */}
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

export const SkeletonChart = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4", className)}>
    <Skeleton variant="text" className="w-1/4" />
    <Skeleton variant="chart" />
    <div className="flex gap-4">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
    ))}
  </div>
);
