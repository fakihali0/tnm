// Real User Monitoring (RUM) service for performance tracking
import { analytics } from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

interface CoreWebVitalsThresholds {
  [key: string]: {
    good: number;
    needsImprovement: number;
  };
}

// Core Web Vitals thresholds (in milliseconds or score)
const THRESHOLDS: CoreWebVitalsThresholds = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 }
};

class PerformanceMonitor {
  private metricsQueue: PerformanceMetric[] = [];
  private isEnabled: boolean = true;
  private bundleSize: number = 0;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    
    // Track page load performance
    this.trackPageLoadMetrics();
    
    // Track Core Web Vitals
    this.trackCoreWebVitals();
    
    // Track resource loading
    this.trackResourceMetrics();
    
    // Track bundle size
    this.trackBundleSize();
    
    // Set up performance observer for ongoing monitoring
    this.setupPerformanceObserver();
  }

  private trackPageLoadMetrics() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // Time to First Byte
          const ttfb = navigation.responseStart - navigation.fetchStart;
          this.recordMetric('TTFB', ttfb);
          
          // DOM Content Loaded
          const dcl = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          this.recordMetric('DCL', dcl);
          
          // Page Load Time
          const plt = navigation.loadEventEnd - navigation.fetchStart;
          this.recordMetric('PLT', plt);
          
          // DNS Lookup Time
          const dns = navigation.domainLookupEnd - navigation.domainLookupStart;
          this.recordMetric('DNS', dns);
          
          // SSL Connection Time
          const ssl = navigation.connectEnd - navigation.secureConnectionStart;
          if (ssl > 0) this.recordMetric('SSL', ssl);
        }
      }, 0);
    });
  }

  private trackCoreWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'], buffered: true });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid = (entry as any).processingStart - entry.startTime;
        this.recordMetric('FID', fid);
      });
    }).observe({ entryTypes: ['first-input'], buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    let clsEntries: any[] = [];
    
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = clsEntries[0];
          const lastSessionEntry = clsEntries[clsEntries.length - 1];
          
          if (!firstSessionEntry || 
              entry.startTime - lastSessionEntry.startTime < 1000 && 
              entry.startTime - firstSessionEntry.startTime < 5000) {
            clsEntries.push(entry);
            clsValue += entry.value;
          } else {
            clsEntries = [entry];
            clsValue = entry.value;
          }
        }
      });
      
      if (clsValue > 0) {
        this.recordMetric('CLS', clsValue);
      }
    }).observe({ entryTypes: ['layout-shift'], buffered: true });

    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime);
        }
      });
    }).observe({ entryTypes: ['paint'], buffered: true });
  }

  private trackResourceMetrics() {
    // Track critical resources
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: PerformanceResourceTiming) => {
        // Track large resources
        if (entry.transferSize > 50000) { // > 50KB
          this.recordMetric('LARGE_RESOURCE', entry.duration, {
            url: entry.name,
            size: entry.transferSize,
            type: entry.initiatorType
          });
        }
        
        // Track slow resources
        if (entry.duration > 1000) { // > 1s
          this.recordMetric('SLOW_RESOURCE', entry.duration, {
            url: entry.name,
            type: entry.initiatorType
          });
        }
      });
    }).observe({ entryTypes: ['resource'], buffered: true });
  }

  private trackBundleSize() {
    // Estimate bundle size from script resources
    const scripts = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('.js') && entry.name.includes(window.location.origin));
    
    this.bundleSize = scripts.reduce((total, script: any) => total + (script.transferSize || 0), 0);
    
    if (this.bundleSize > 0) {
      this.recordMetric('BUNDLE_SIZE', this.bundleSize / 1024, { unit: 'KB' }); // Convert to KB
    }
  }

  private setupPerformanceObserver() {
    // Monitor long tasks (blocking main thread)
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.recordMetric('LONG_TASK', entry.duration);
            }
          });
        }).observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  private recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const rating = this.getRating(name, value);
    
    const metric: PerformanceMetric = {
      name,
      value,
      rating
    };

    this.metricsQueue.push(metric);
    
    // Send to analytics
    analytics.trackPerformance(name, value, metadata?.unit || 'ms');
    
    // Send to console in development
    if (import.meta.env.DEV) {
      console.log(`🔍 Performance: ${name} = ${value.toFixed(2)}ms (${rating})`, metadata);
    }
    
    // Alert for poor performance
    if (rating === 'poor') {
      this.alertPoorPerformance(metric);
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[metricName];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private alertPoorPerformance(metric: PerformanceMetric) {
    // In development, show console warning
    if (import.meta.env.DEV) {
      console.warn(`⚠️ Poor performance detected: ${metric.name} = ${metric.value.toFixed(2)}`, metric);
    }
    
    // In production, track for monitoring
    analytics.track('performance_alert', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: window.location.pathname
    });
  }

  // Public API for manual performance tracking
  public mark = (name: string) => {
    performance.mark(name);
  };

  public measure = (name: string, startMark: string, endMark?: string) => {
    try {
      const measure = performance.measure(name, startMark, endMark);
      this.recordMetric(`CUSTOM_${name.toUpperCase()}`, measure.duration);
      return measure.duration;
    } catch (e) {
      console.warn(`Could not measure ${name}:`, e);
      return 0;
    }
  };

  public getMetrics = (): PerformanceMetric[] => {
    return [...this.metricsQueue];
  };

  public getBundleSize = (): number => {
    return this.bundleSize;
  };

  public getCoreWebVitalsScore = (): { score: number; grade: string } => {
    const metrics = this.metricsQueue.filter(m => 
      ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(m.name)
    );
    
    if (metrics.length === 0) return { score: 0, grade: 'N/A' };
    
    const scores = metrics.map(m => {
      switch (m.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 75;
        case 'poor': return 25;
        default: return 50;
      }
    });
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const grade = averageScore >= 90 ? 'A' : 
                  averageScore >= 80 ? 'B' : 
                  averageScore >= 70 ? 'C' : 
                  averageScore >= 60 ? 'D' : 'F';
    
    return { score: averageScore, grade };
  };
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export function usePerformanceMonitor() {
  return {
    mark: performanceMonitor.mark,
    measure: performanceMonitor.measure,
    getMetrics: performanceMonitor.getMetrics,
    getBundleSize: performanceMonitor.getBundleSize,
    getCoreWebVitalsScore: performanceMonitor.getCoreWebVitalsScore
  };
}