import React, { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

// Lazy load Recharts to reduce initial bundle size (~94KB savings)
// Only loaded when TNM Pro analytics pages are accessed

export const LazyLineChart = React.lazy(() => 
  import('recharts').then(m => ({ default: m.LineChart }))
);

export const LazyLine = React.lazy(() => 
  import('recharts').then(m => ({ default: m.Line }))
);

export const LazyArea = React.lazy(() => 
  import('recharts').then(m => ({ default: m.Area }))
);

export const LazyAreaChart = React.lazy(() => 
  import('recharts').then(m => ({ default: m.AreaChart }))
);

export const LazyBarChart = React.lazy(() => 
  import('recharts').then(m => ({ default: m.BarChart }))
);

export const LazyBar = React.lazy(() => 
  import('recharts').then(m => ({ default: m.Bar }))
);

export const LazyPieChart = React.lazy(() => 
  import('recharts').then(m => ({ default: m.PieChart }))
);

export const LazyPie = React.lazy(() => 
  import('recharts').then(m => ({ default: m.Pie }))
);

export const LazyComposedChart = React.lazy(() => 
  import('recharts').then(m => ({ default: m.ComposedChart }))
);

export const LazyXAxis = React.lazy(() => 
  import('recharts').then(m => ({ default: m.XAxis }))
);

export const LazyYAxis = React.lazy(() => 
  import('recharts').then(m => ({ default: m.YAxis }))
);

export const LazyCartesianGrid = React.lazy(() => 
  import('recharts').then(m => ({ default: m.CartesianGrid }))
);

export const LazyTooltip = React.lazy(() => 
  import('recharts').then(m => ({ default: m.Tooltip }))
);

export const LazyLegend = React.lazy(() => 
  import('recharts').then(m => ({ default: m.Legend }))
);

export const LazyResponsiveContainer = React.lazy(() => 
  import('recharts').then(m => ({ default: m.ResponsiveContainer }))
);

export const LazyReferenceLine = React.lazy(() => 
  import('recharts').then(m => ({ default: m.ReferenceLine }))
);

export const LazyReferenceArea = React.lazy(() => 
  import('recharts').then(m => ({ default: m.ReferenceArea }))
);

export const LazyCell = React.lazy(() => 
  import('recharts').then(m => ({ default: m.Cell }))
);

// Wrapper component for chart containers with proper fallback
export const LazyChartContainer: React.FC<{ 
  children: React.ReactNode;
  height?: number;
  className?: string;
}> = ({ children, height = 400, className }) => (
  <Suspense fallback={
    <LoadingSkeleton variant="card" className={`w-full ${className}`} style={{ height: `${height}px` }} />
  }>
    {children}
  </Suspense>
);
