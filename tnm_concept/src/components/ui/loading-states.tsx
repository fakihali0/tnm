import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-skeleton rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted",
        "bg-[length:200%_100%]",
        className
      )}
      style={{
        backgroundImage: "linear-gradient(90deg, hsl(var(--muted)), hsl(var(--muted)/0.5), hsl(var(--muted)))"
      }}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="trading-card space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/6" />
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

interface LoadingStateProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export function LoadingState({ isLoading, skeleton, children }: LoadingStateProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
}