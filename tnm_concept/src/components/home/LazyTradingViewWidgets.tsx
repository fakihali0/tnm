import React, { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

// Lazy load TradingView widgets to reduce initial bundle size
export const LazyTradingViewEconomicCalendar = React.lazy(() => 
  import('./TradingViewEconomicCalendar').then(m => ({ default: m.TradingViewEconomicCalendar }))
);

export const LazyTradingViewForexCrossRates = React.lazy(() => 
  import('./TradingViewForexCrossRates').then(m => ({ default: m.TradingViewForexCrossRates }))
);

export const LazyTradingViewStockHeatmap = React.lazy(() => 
  import('./TradingViewStockHeatmap').then(m => ({ default: m.TradingViewStockHeatmap }))
);

// Wrapper component with proper fallback
export const TradingViewEconomicCalendar: React.FC = () => (
  <Suspense fallback={
    <div className="w-full bg-card border rounded-lg overflow-hidden min-h-[500px]">
      <LoadingSkeleton variant="card" className="w-full h-[500px]" />
    </div>
  }>
    <LazyTradingViewEconomicCalendar />
  </Suspense>
);

export const TradingViewForexCrossRates: React.FC = () => (
  <Suspense fallback={
    <div className="w-full bg-card border rounded-lg overflow-hidden min-h-[500px]">
      <LoadingSkeleton variant="card" className="w-full h-[500px]" />
    </div>
  }>
    <LazyTradingViewForexCrossRates />
  </Suspense>
);

export const TradingViewStockHeatmap: React.FC = () => (
  <Suspense fallback={
    <div className="w-full bg-card border rounded-lg overflow-hidden min-h-[500px]">
      <LoadingSkeleton variant="card" className="w-full h-[500px]" />
    </div>
  }>
    <LazyTradingViewStockHeatmap />
  </Suspense>
);
