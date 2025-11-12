// Performance budget monitoring and enforcement
interface PerformanceBudget {
  maxBundleSize: number; // KB
  maxImageSize: number; // KB
  maxTotalAssets: number; // KB
  maxScriptExecutionTime: number; // ms
  maxFirstContentfulPaint: number; // ms
  maxLargestContentfulPaint: number; // ms
  maxCumulativeLayoutShift: number; // score
  maxFirstInputDelay: number; // ms
  maxTimeToFirstByte: number; // ms
}

interface BudgetViolation {
  metric: string;
  actual: number;
  budget: number;
  severity: 'warning' | 'error';
  impact: string;
  recommendation: string;
}

// Performance budgets for different environments
export const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
  development: {
    maxBundleSize: 2000, // 2MB for dev (larger due to source maps)
    maxImageSize: 500,
    maxTotalAssets: 5000,
    maxScriptExecutionTime: 200,
    maxFirstContentfulPaint: 2000,
    maxLargestContentfulPaint: 3000,
    maxCumulativeLayoutShift: 0.15,
    maxFirstInputDelay: 150,
    maxTimeToFirstByte: 1000
  },
  production: {
    maxBundleSize: 250, // 250KB for production (optimized from 500KB)
    maxImageSize: 150,
    maxTotalAssets: 1000,
    maxScriptExecutionTime: 100,
    maxFirstContentfulPaint: 1800,
    maxLargestContentfulPaint: 2500,
    maxCumulativeLayoutShift: 0.1,
    maxFirstInputDelay: 100,
    maxTimeToFirstByte: 800
  },
  mobile: {
    maxBundleSize: 300, // 300KB for mobile
    maxImageSize: 100,
    maxTotalAssets: 600,
    maxScriptExecutionTime: 80,
    maxFirstContentfulPaint: 1500,
    maxLargestContentfulPaint: 2000,
    maxCumulativeLayoutShift: 0.08,
    maxFirstInputDelay: 80,
    maxTimeToFirstByte: 600
  }
};

class PerformanceBudgetMonitor {
  private budget: PerformanceBudget;
  private violations: BudgetViolation[] = [];
  private isEnabled: boolean = true;

  constructor() {
    // Determine which budget to use
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const environment = import.meta.env.PROD ? 'production' : 'development';
    
    this.budget = isMobile ? PERFORMANCE_BUDGETS.mobile : PERFORMANCE_BUDGETS[environment];
    
    if (this.isEnabled) {
      this.init();
    }
  }

  private init() {
    // Monitor performance metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.checkAllBudgets();
      }, 2000); // Wait 2 seconds for accurate measurements
    });

    // Monitor bundle size continuously
    this.monitorBundleSize();
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Resource monitoring is handled in checkResourceMetrics
  }

  private checkAllBudgets() {
    this.violations = [];
    
    // Check all performance metrics against budgets
    this.checkBundleSize();
    this.checkCoreWebVitals();
    this.checkResourceMetrics();
    
    // Report violations
    if (this.violations.length > 0) {
      this.reportViolations();
    } else {
      console.log('✅ All performance budgets are within limits!');
    }
  }

  private checkBundleSize() {
    // Estimate bundle size from script resources
    const scripts = performance.getEntriesByType('resource')
      .filter((entry: PerformanceResourceTiming) => 
        entry.name.includes('.js') && 
        entry.name.includes(window.location.origin)
      );
    
    const totalSize = scripts.reduce((total, script: PerformanceResourceTiming) => 
      total + (script.transferSize || 0), 0
    );
    
    const bundleSizeKB = totalSize / 1024;
    
    if (bundleSizeKB > this.budget.maxBundleSize) {
      this.violations.push({
        metric: 'Bundle Size',
        actual: bundleSizeKB,
        budget: this.budget.maxBundleSize,
        severity: bundleSizeKB > this.budget.maxBundleSize * 1.2 ? 'error' : 'warning',
        impact: 'Slower initial page load, especially on mobile',
        recommendation: 'Implement code splitting, remove unused dependencies, optimize imports'
      });
    }
  }

  private checkCoreWebVitals() {
    // Check FCP
    const fcpEntry = performance.getEntriesByType('paint')
      .find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry && fcpEntry.startTime > this.budget.maxFirstContentfulPaint) {
      this.violations.push({
        metric: 'First Contentful Paint',
        actual: fcpEntry.startTime,
        budget: this.budget.maxFirstContentfulPaint,
        severity: 'warning',
        impact: 'Users see blank page longer',
        recommendation: 'Optimize critical resources, inline critical CSS, preload key assets'
      });
    }

    // Check TTFB
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.fetchStart;
      if (ttfb > this.budget.maxTimeToFirstByte) {
        this.violations.push({
          metric: 'Time to First Byte',
          actual: ttfb,
          budget: this.budget.maxTimeToFirstByte,
          severity: ttfb > this.budget.maxTimeToFirstByte * 1.5 ? 'error' : 'warning',
          impact: 'Slow server response affects all subsequent loading',
          recommendation: 'Optimize server performance, use CDN, implement caching'
        });
      }
    }

    // Monitor LCP and CLS asynchronously
    this.monitorAsyncMetrics();
  }

  private monitorAsyncMetrics() {
    // Monitor LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lcp = entries[entries.length - 1].startTime;
        if (lcp > this.budget.maxLargestContentfulPaint) {
          this.violations.push({
            metric: 'Largest Contentful Paint',
            actual: lcp,
            budget: this.budget.maxLargestContentfulPaint,
            severity: 'warning',
            impact: 'Main content appears slowly',
            recommendation: 'Optimize largest content element, use lazy loading, compress images'
          });
          this.reportViolations();
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'], buffered: true });

    // Monitor CLS
    let cls = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      
      if (cls > this.budget.maxCumulativeLayoutShift) {
        this.violations.push({
          metric: 'Cumulative Layout Shift',
          actual: cls,
          budget: this.budget.maxCumulativeLayoutShift,
          severity: 'error',
          impact: 'Page elements shift during loading, poor UX',
          recommendation: 'Set dimensions on images/videos, reserve space for dynamic content'
        });
        this.reportViolations();
      }
    }).observe({ entryTypes: ['layout-shift'], buffered: true });

    // Monitor FID
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        if (fid > this.budget.maxFirstInputDelay) {
          this.violations.push({
            metric: 'First Input Delay',
            actual: fid,
            budget: this.budget.maxFirstInputDelay,
            severity: 'warning',
            impact: 'Page feels unresponsive to user interactions',
            recommendation: 'Reduce main thread blocking, optimize JavaScript execution'
          });
          this.reportViolations();
        }
      });
    }).observe({ entryTypes: ['first-input'], buffered: true });
  }

  private checkResourceMetrics() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Check image sizes
    const images = resources.filter(r => r.initiatorType === 'img');
    images.forEach(img => {
      const sizeKB = (img.transferSize || 0) / 1024;
      if (sizeKB > this.budget.maxImageSize) {
        this.violations.push({
          metric: 'Image Size',
          actual: sizeKB,
          budget: this.budget.maxImageSize,
          severity: 'warning',
          impact: 'Slower image loading',
          recommendation: `Optimize image: ${img.name}. Use WebP format, proper sizing, compression`
        });
      }
    });

    // Check total asset size
    const totalAssetsSize = resources.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0
    ) / 1024;
    
    if (totalAssetsSize > this.budget.maxTotalAssets) {
      this.violations.push({
        metric: 'Total Asset Size',
        actual: totalAssetsSize,
        budget: this.budget.maxTotalAssets,
        severity: 'error',
        impact: 'Overall slow page loading',
        recommendation: 'Implement asset optimization, lazy loading, remove unused resources'
      });
    }
  }

  private monitorBundleSize() {
    // Use Intersection Observer to track when resources are loaded
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceResourceTiming) => {
        if (entry.name.includes('.js') && entry.transferSize) {
          const sizeKB = entry.transferSize / 1024;
          
          // Track individual script sizes
          if (import.meta.env.DEV && sizeKB > 100) {
            console.warn(`⚠️ Large script detected: ${entry.name} (${sizeKB.toFixed(1)}KB)`);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorCoreWebVitals() {
    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > this.budget.maxScriptExecutionTime) {
              this.violations.push({
                metric: 'Long Task',
                actual: entry.duration,
                budget: this.budget.maxScriptExecutionTime,
                severity: 'warning',
                impact: 'Main thread blocking causes poor responsiveness',
                recommendation: 'Break up long tasks, use requestIdleCallback, optimize algorithms'
              });
            }
          });
          
          if (this.violations.length > 0) {
            this.reportViolations();
          }
        }).observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  private reportViolations() {
    if (this.violations.length === 0) return;

    // Group violations by severity
    const errors = this.violations.filter(v => v.severity === 'error');
    const warnings = this.violations.filter(v => v.severity === 'warning');

    // Report to console in development
    if (import.meta.env.DEV) {
      if (errors.length > 0) {
        console.group('❌ Performance Budget Violations (Errors)');
        errors.forEach(violation => {
          console.error(
            `${violation.metric}: ${violation.actual.toFixed(1)} > ${violation.budget} (${violation.impact})\n` +
            `💡 ${violation.recommendation}`
          );
        });
        console.groupEnd();
      }

      if (warnings.length > 0) {
        console.group('⚠️ Performance Budget Violations (Warnings)');
        warnings.forEach(violation => {
          console.warn(
            `${violation.metric}: ${violation.actual.toFixed(1)} > ${violation.budget} (${violation.impact})\n` +
            `💡 ${violation.recommendation}`
          );
        });
        console.groupEnd();
      }
    }

    // Track violations in analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('performance_budget_violation', {
        violations: this.violations.length,
        errors: errors.length,
        warnings: warnings.length,
        url: window.location.pathname
      });
    }

    // Clear violations after reporting
    this.violations = [];
  }

  public getCurrentBudget(): PerformanceBudget {
    return { ...this.budget };
  }

  public getViolations(): BudgetViolation[] {
    return [...this.violations];
  }

  public setBudget(budget: Partial<PerformanceBudget>) {
    this.budget = { ...this.budget, ...budget };
  }
}

// Export singleton instance
export const performanceBudgetMonitor = new PerformanceBudgetMonitor();

// Hook for React components
export function usePerformanceBudget() {
  return {
    getCurrentBudget: performanceBudgetMonitor.getCurrentBudget.bind(performanceBudgetMonitor),
    getViolations: performanceBudgetMonitor.getViolations.bind(performanceBudgetMonitor),
    setBudget: performanceBudgetMonitor.setBudget.bind(performanceBudgetMonitor)
  };
}