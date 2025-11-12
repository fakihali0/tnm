// Analytics service for tracking user interactions and performance
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

interface PageViewEvent {
  page: string;
  title: string;
  language: string;
  userAgent?: string;
}

class AnalyticsService {
  private isEnabled: boolean = false;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    // Enable analytics in production only
    this.isEnabled = process.env.NODE_ENV === 'production';
    
    // Track Core Web Vitals
    this.trackWebVitals();
  }

  // Initialize analytics (call after user consent)
  init() {
    if (!this.isEnabled) return;
    
    // Initialize your analytics provider here
    // Example: Google Analytics 4, Mixpanel, etc.
    
    // Process queued events
    this.processQueue();
  }

  // Track page views
  trackPageView({ page, title, language, userAgent }: PageViewEvent) {
    if (!this.isEnabled) return;

    this.track('page_view', {
      page,
      title,
      language,
      userAgent: userAgent || navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer
    });
  }

  // Track custom events
  track(event: string, properties?: Record<string, any>, userId?: string) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        language: document.documentElement.lang
      },
      userId
    };

    if (!this.isEnabled) {
      this.queue.push(analyticsEvent);
      return;
    }

    // Send to analytics provider
    this.sendEvent(analyticsEvent);
  }

  // Track user interactions
  trackInteraction(element: string, action: string, properties?: Record<string, any>) {
    this.track('user_interaction', {
      element,
      action,
      ...properties
    });
  }

  // Track form submissions
  trackFormSubmission(formName: string, success: boolean, errorMessage?: string) {
    this.track('form_submission', {
      formName,
      success,
      errorMessage
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.track('feature_usage', {
      feature,
      ...properties
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance_metric', {
      metric,
      value,
      unit,
      url: window.location.pathname
    });
  }

  // Track errors
  trackError(error: Error, context?: string) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.pathname
    });
  }

  private trackWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Track Core Web Vitals using the web-vitals library approach
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
          this.trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
        }
        
        if (entry.entryType === 'paint') {
          this.trackPerformance(entry.name.replace('-', '_'), entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['navigation', 'paint'] });

    // Track largest contentful paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('largest_contentful_paint', lastEntry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track cumulative layout shift
    new PerformanceObserver((list) => {
      let cls = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
      if (cls > 0) {
        this.trackPerformance('cumulative_layout_shift', cls, 'score');
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private sendEvent(event: AnalyticsEvent) {
    // Implement your analytics provider logic here
    // Example for Google Analytics 4:
    // gtag('event', event.event, event.properties);
    
    // Example for custom API:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Hook for React components
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    track: analytics.track.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackFormSubmission: analytics.trackFormSubmission.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackError: analytics.trackError.bind(analytics)
  };
}