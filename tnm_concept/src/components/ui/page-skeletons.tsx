import { LoadingSkeleton, HeroSkeleton, InstrumentCardSkeleton } from './loading-skeleton';

/**
 * Page-specific loading skeletons for better UX during page transitions
 */

export function PageWithHeroSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header space */}
      <div className="h-16 md:h-20 bg-muted/50" />
      
      {/* Hero section */}
      <div className="container py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <LoadingSkeleton variant="text" lines={2} className="h-16" />
          <LoadingSkeleton variant="text" lines={2} className="h-6 max-w-2xl mx-auto" />
          <div className="flex gap-4 justify-center pt-4">
            <LoadingSkeleton className="h-12 w-40 rounded-lg" />
            <LoadingSkeleton className="h-12 w-40 rounded-lg" />
          </div>
        </div>
      </div>
      
      {/* Content section */}
      <div className="container py-12 space-y-8">
        <LoadingSkeleton variant="card" className="h-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" className="h-48" />
          <LoadingSkeleton variant="card" className="h-48" />
          <LoadingSkeleton variant="card" className="h-48" />
        </div>
      </div>
    </div>
  );
}

export function InstrumentsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 md:h-20 bg-muted/50" />
      
      {/* Hero */}
      <HeroSkeleton />
      
      {/* Filter bar */}
      <div className="container py-4">
        <div className="flex gap-4">
          <LoadingSkeleton className="h-10 w-32 rounded-lg" />
          <LoadingSkeleton className="h-10 w-32 rounded-lg" />
          <LoadingSkeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
      
      {/* Cards grid */}
      <div className="container py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <InstrumentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 md:h-20 bg-muted/50" />
      
      {/* Hero */}
      <div className="container py-16 text-center">
        <LoadingSkeleton variant="text" lines={1} className="h-12 max-w-xl mx-auto" />
        <LoadingSkeleton variant="text" lines={2} className="h-6 max-w-2xl mx-auto mt-4" />
      </div>
      
      {/* Form */}
      <div className="container py-12 max-w-4xl">
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <LoadingSkeleton className="h-12 rounded-lg" />
            <LoadingSkeleton className="h-12 rounded-lg" />
          </div>
          <LoadingSkeleton className="h-12 rounded-lg" />
          <LoadingSkeleton className="h-32 rounded-lg" />
          <LoadingSkeleton className="h-12 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 md:h-20 bg-muted/50" />
      
      {/* Stats row */}
      <div className="container py-8">
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="trading-card p-4 space-y-2">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Charts */}
      <div className="container pb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <LoadingSkeleton variant="card" className="h-80" />
          <LoadingSkeleton variant="card" className="h-80" />
        </div>
      </div>
    </div>
  );
}

export function ContentPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 md:h-20 bg-muted/50" />
      
      <PageWithHeroSkeleton />
    </div>
  );
}
