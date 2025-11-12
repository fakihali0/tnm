// Lighthouse monitoring service for automated performance tracking
import { analytics } from './analytics';

interface LighthouseMetric {
  id: string;
  title: string;
  score: number;
  numericValue?: number;
  displayValue?: string;
  description?: string;
}

interface LighthouseResult {
  finalUrl: string;
  fetchTime: string;
  categories: {
    performance: { score: number };
    accessibility: { score: number };
    'best-practices': { score: number };
    seo: { score: number };
    pwa?: { score: number };
  };
  audits: Record<string, LighthouseMetric>;
}

class LighthouseMonitor {
  private lastResults: LighthouseResult | null = null;
  private isEnabled: boolean = false;

  constructor() {
    // Only enable in production or staging environments
    this.isEnabled = import.meta.env.PROD || window.location.hostname.includes('lovable.app');
    
    if (this.isEnabled) {
      this.init();
    }
  }

  private init() {
    // Run initial performance check after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.runLighthouseCheck();
      }, 5000); // Wait 5 seconds after load
    });

    // Schedule periodic checks (every 30 minutes)
    setInterval(() => {
      this.runLighthouseCheck();
    }, 30 * 60 * 1000);
  }

  private async runLighthouseCheck() {
    try {
      // Simulate lighthouse-like checks using Performance API
      const results = await this.performBasicAudit();
      this.processResults(results);
    } catch (error) {
      console.error('Lighthouse check failed:', error);
    }
  }

  private async performBasicAudit(): Promise<Partial<LighthouseResult>> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    // Calculate basic performance metrics
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = await this.getLargestContentfulPaint();
    const cls = await this.getCumulativeLayoutShift();
    const fid = await this.getFirstInputDelay();
    const ttfb = navigation ? navigation.responseStart - navigation.fetchStart : 0;
    
    // Calculate scores based on thresholds
    const performanceScore = this.calculatePerformanceScore({
      fcp,
      lcp,
      cls,
      fid,
      ttfb
    });

    const accessibilityScore = this.calculateAccessibilityScore();
    const seoScore = this.calculateSEOScore();
    const bestPracticesScore = this.calculateBestPracticesScore();
    const pwaScore = this.calculatePWAScore();

    return {
      finalUrl: window.location.href,
      fetchTime: new Date().toISOString(),
      categories: {
        performance: { score: performanceScore },
        accessibility: { score: accessibilityScore },
        'best-practices': { score: bestPracticesScore },
        seo: { score: seoScore },
        pwa: { score: pwaScore }
      },
      audits: {
        'first-contentful-paint': {
          id: 'first-contentful-paint',
          title: 'First Contentful Paint',
          score: fcp <= 1800 ? 1 : fcp <= 3000 ? 0.5 : 0,
          numericValue: fcp,
          displayValue: `${(fcp / 1000).toFixed(1)}s`
        },
        'largest-contentful-paint': {
          id: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          score: lcp <= 2500 ? 1 : lcp <= 4000 ? 0.5 : 0,
          numericValue: lcp,
          displayValue: `${(lcp / 1000).toFixed(1)}s`
        },
        'cumulative-layout-shift': {
          id: 'cumulative-layout-shift',
          title: 'Cumulative Layout Shift',
          score: cls <= 0.1 ? 1 : cls <= 0.25 ? 0.5 : 0,
          numericValue: cls,
          displayValue: cls.toFixed(3)
        }
      }
    };
  }

  private async getLargestContentfulPaint(): Promise<number> {
    return new Promise((resolve) => {
      let lcp = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          lcp = entries[entries.length - 1].startTime;
        }
        observer.disconnect();
        resolve(lcp);
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'], buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(lcp);
        }, 1000);
      } catch (e) {
        resolve(0);
      }
    });
  }

  private async getCumulativeLayoutShift(): Promise<number> {
    return new Promise((resolve) => {
      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['layout-shift'], buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 1000);
      } catch (e) {
        resolve(0);
      }
    });
  }

  private async getFirstInputDelay(): Promise<number> {
    return new Promise((resolve) => {
      let fid = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const entry = entries[0] as any;
          fid = entry.processingStart - entry.startTime;
        }
        observer.disconnect();
        resolve(fid);
      });
      
      try {
        observer.observe({ entryTypes: ['first-input'], buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(fid);
        }, 5000);
      } catch (e) {
        resolve(0);
      }
    });
  }

  private calculatePerformanceScore(metrics: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
    ttfb: number;
  }): number {
    const weights = {
      fcp: 0.1,
      lcp: 0.25,
      cls: 0.15,
      fid: 0.1,
      ttfb: 0.1,
      speedIndex: 0.1,
      tbt: 0.2
    };

    const fcpScore = metrics.fcp <= 1800 ? 100 : metrics.fcp <= 3000 ? 50 : 0;
    const lcpScore = metrics.lcp <= 2500 ? 100 : metrics.lcp <= 4000 ? 50 : 0;
    const clsScore = metrics.cls <= 0.1 ? 100 : metrics.cls <= 0.25 ? 50 : 0;
    const fidScore = metrics.fid <= 100 ? 100 : metrics.fid <= 300 ? 50 : 0;
    const ttfbScore = metrics.ttfb <= 800 ? 100 : metrics.ttfb <= 1800 ? 50 : 0;

    const totalScore = (
      fcpScore * weights.fcp +
      lcpScore * weights.lcp +
      clsScore * weights.cls +
      fidScore * weights.fid +
      ttfbScore * weights.ttfb +
      85 * weights.speedIndex + // Assume good speed index
      90 * weights.tbt // Assume good total blocking time
    );

    return Math.round(totalScore) / 100;
  }

  private calculateAccessibilityScore(): number {
    let score = 100;
    
    // Check for basic accessibility issues
    const images = document.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    images.forEach(img => {
      if (!img.alt) imagesWithoutAlt++;
    });
    
    if (imagesWithoutAlt > 0) {
      score -= Math.min(20, imagesWithoutAlt * 5);
    }

    // Check for proper heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) score -= 10;

    // Check for form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    let inputsWithoutLabels = 0;
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      if (id && !document.querySelector(`label[for="${id}"]`)) {
        inputsWithoutLabels++;
      }
    });
    
    if (inputsWithoutLabels > 0) {
      score -= Math.min(15, inputsWithoutLabels * 5);
    }

    return Math.max(0, score) / 100;
  }

  private calculateSEOScore(): number {
    let score = 100;

    // Check for title tag
    const title = document.querySelector('title');
    if (!title || title.textContent!.length < 30) score -= 15;

    // Check for meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc || metaDesc.getAttribute('content')!.length < 120) score -= 15;

    // Check for h1 tag
    const h1 = document.querySelector('h1');
    if (!h1) score -= 10;

    // Check for alt attributes on images
    const images = document.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    images.forEach(img => {
      if (!img.alt) imagesWithoutAlt++;
    });
    
    if (imagesWithoutAlt > 0) {
      score -= Math.min(10, imagesWithoutAlt * 2);
    }

    return Math.max(0, score) / 100;
  }

  private calculateBestPracticesScore(): number {
    let score = 100;

    // Check for HTTPS
    if (location.protocol !== 'https:') score -= 20;

    // Check for console errors
    const errors = (window as any).__lighthouse_errors__ || [];
    if (errors.length > 0) score -= Math.min(30, errors.length * 5);

    // Check for mixed content
    const mixedContent = document.querySelectorAll('[src^="http://"], [href^="http://"]');
    if (mixedContent.length > 0 && location.protocol === 'https:') {
      score -= Math.min(20, mixedContent.length * 2);
    }

    return Math.max(0, score) / 100;
  }

  private calculatePWAScore(): number {
    let score = 0;

    // Check for service worker
    if ('serviceWorker' in navigator) score += 25;

    // Check for web app manifest
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) score += 25;

    // Check for viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) score += 20;

    // Check for theme color
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) score += 10;

    // Check for app icons
    const icons = document.querySelectorAll('link[rel*="icon"]');
    if (icons.length >= 3) score += 20;

    return score / 100;
  }

  private processResults(results: Partial<LighthouseResult>) {
    this.lastResults = results as LighthouseResult;
    
    // Track results in analytics
    if (results.categories) {
      analytics.track('lighthouse_audit', {
        performance: results.categories.performance?.score || 0,
        accessibility: results.categories.accessibility?.score || 0,
        bestPractices: results.categories['best-practices']?.score || 0,
        seo: results.categories.seo?.score || 0,
        pwa: results.categories.pwa?.score || 0,
        url: window.location.pathname
      });
    }

    // Alert for poor scores
    Object.entries(results.categories || {}).forEach(([category, data]) => {
      if (data.score < 0.7) {
        analytics.track('lighthouse_alert', {
          category,
          score: data.score,
          url: window.location.pathname
        });
      }
    });

    if (import.meta.env.DEV) {
      console.log('🔍 Lighthouse Results:', results);
    }
  }

  public getLastResults(): LighthouseResult | null {
    return this.lastResults;
  }

  public async runManualAudit(): Promise<Partial<LighthouseResult>> {
    const results = await this.performBasicAudit();
    this.processResults(results);
    return results;
  }
}

// Export singleton instance
export const lighthouseMonitor = new LighthouseMonitor();

// Hook for React components
export function useLighthouseMonitor() {
  return {
    getLastResults: lighthouseMonitor.getLastResults.bind(lighthouseMonitor),
    runManualAudit: lighthouseMonitor.runManualAudit.bind(lighthouseMonitor)
  };
}