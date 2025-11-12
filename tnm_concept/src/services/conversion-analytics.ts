// Enhanced analytics service with conversion tracking and A/B testing
import { analytics } from './analytics';

interface ConversionGoal {
  id: string;
  name: string;
  value?: number;
  category: 'signup' | 'demo_request' | 'pwa_install' | 'education_engagement' | 'trading_action' | 'contact_form';
  properties?: Record<string, any>;
}

interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage
  config: Record<string, any>;
}

interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  targetProperty: string;
  active: boolean;
}

interface UserSegment {
  id: string;
  name: string;
  conditions: Record<string, any>;
  properties: Record<string, any>;
}

class ConversionAnalytics {
  private conversionGoals: ConversionGoal[] = [];
  private abTests: ABTest[] = [];
  private userSegments: UserSegment[] = [];
  private userId: string | null = null;
  private sessionId: string;
  private userSegment: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDefaultGoals();
    this.initializeDefaultTests();
    this.identifyUserSegment();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultGoals() {
    this.conversionGoals = [
      {
        id: 'pwa_install',
        name: 'PWA Installation',
        value: 10,
        category: 'pwa_install'
      },
      {
        id: 'demo_request',
        name: 'Demo Account Request',
        value: 25,
        category: 'demo_request'
      },
      {
        id: 'contact_form',
        name: 'Contact Form Submission',
        value: 15,
        category: 'contact_form'
      },
      {
        id: 'education_completion',
        name: 'Educational Content Completion',
        value: 5,
        category: 'education_engagement'
      },
      {
        id: 'instrument_exploration',
        name: 'Trading Instrument Detailed View',
        value: 8,
        category: 'trading_action'
      },
      {
        id: 'calculator_usage',
        name: 'Trading Calculator Usage',
        value: 12,
        category: 'trading_action'
      }
    ];
  }

  private initializeDefaultTests() {
    this.abTests = [
      {
        id: 'pwa_install_prompt',
        name: 'PWA Install Prompt Timing',
        variants: [
          { id: 'immediate', name: 'Immediate', weight: 25, config: { delay: 0 } },
          { id: 'after_navigation', name: 'After Navigation', weight: 25, config: { delay: 10000 } },
          { id: 'contextual', name: 'Contextual', weight: 50, config: { delay: 30000, contextual: true } }
        ],
        targetProperty: 'pwa_install_timing',
        active: true
      },
      {
        id: 'hero_cta_text',
        name: 'Hero CTA Button Text',
        variants: [
          { id: 'start_trading', name: 'Start Trading', weight: 50, config: { text: 'Start Trading Now' } },
          { id: 'get_funded', name: 'Get Funded', weight: 50, config: { text: 'Get Funded Today' } }
        ],
        targetProperty: 'hero_cta_text',
        active: true
      },
      {
        id: 'education_layout',
        name: 'Education Section Layout',
        variants: [
          { id: 'grid', name: 'Grid Layout', weight: 50, config: { layout: 'grid' } },
          { id: 'carousel', name: 'Carousel Layout', weight: 50, config: { layout: 'carousel' } }
        ],
        targetProperty: 'education_layout',
        active: true
      }
    ];
  }

  private identifyUserSegment() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isReturnVisitor = localStorage.getItem('user_session_count') !== null;
    const language = navigator.language.startsWith('ar') ? 'arabic' : 'english';
    
    // Determine user segment
    if (isMobile && !isReturnVisitor) {
      this.userSegment = 'mobile_new';
    } else if (isMobile && isReturnVisitor) {
      this.userSegment = 'mobile_returning';
    } else if (!isMobile && !isReturnVisitor) {
      this.userSegment = 'desktop_new';
    } else {
      this.userSegment = 'desktop_returning';
    }

    // Track session
    const sessionCount = parseInt(localStorage.getItem('user_session_count') || '0') + 1;
    localStorage.setItem('user_session_count', sessionCount.toString());
    localStorage.setItem('user_segment', this.userSegment);
    localStorage.setItem('user_language', language);
  }

  // A/B Testing Methods
  public getABTestVariant(testId: string): ABTestVariant | null {
    const test = this.abTests.find(t => t.id === testId && t.active);
    if (!test) return null;

    // Check if user already has an assigned variant
    const storedVariant = localStorage.getItem(`ab_test_${testId}`);
    if (storedVariant) {
      const variant = test.variants.find(v => v.id === storedVariant);
      if (variant) return variant;
    }

    // Assign new variant based on weights
    const random = Math.random() * 100;
    let cumulativeWeight = 0;
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        localStorage.setItem(`ab_test_${testId}`, variant.id);
        
        // Track A/B test assignment
        this.trackEvent('ab_test_assigned', {
          test_id: testId,
          test_name: test.name,
          variant_id: variant.id,
          variant_name: variant.name,
          user_segment: this.userSegment
        });
        
        return variant;
      }
    }

    return test.variants[0]; // Fallback to first variant
  }

  public trackABTestConversion(testId: string, goalId: string, properties?: Record<string, any>) {
    const variant = this.getABTestVariant(testId);
    const goal = this.conversionGoals.find(g => g.id === goalId);
    
    if (variant && goal) {
      this.trackEvent('ab_test_conversion', {
        test_id: testId,
        variant_id: variant.id,
        goal_id: goalId,
        goal_name: goal.name,
        goal_value: goal.value,
        user_segment: this.userSegment,
        ...properties
      });
    }
  }

  // Conversion Tracking Methods
  public trackConversion(goalId: string, properties?: Record<string, any>) {
    const goal = this.conversionGoals.find(g => g.id === goalId);
    if (!goal) {
      console.warn(`Conversion goal not found: ${goalId}`);
      return;
    }

    const conversionData = {
      goal_id: goalId,
      goal_name: goal.name,
      goal_category: goal.category,
      goal_value: goal.value,
      user_segment: this.userSegment,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: Date.now(),
      url: window.location.pathname,
      referrer: document.referrer,
      ...properties
    };

    // Track conversion
    this.trackEvent('conversion', conversionData);

    // Track funnel stage
    this.trackFunnelStage(goal.category, goalId);

    // Store conversion for attribution
    this.storeConversionAttribution(conversionData);

    console.log(`🎯 Conversion tracked: ${goal.name} (${goal.value} points)`);
  }

  private trackFunnelStage(category: string, goalId: string) {
    const funnelStages = {
      'pwa_install': ['awareness', 'interest', 'consideration', 'installation'],
      'demo_request': ['awareness', 'interest', 'consideration', 'intent', 'action'],
      'education_engagement': ['awareness', 'interest', 'engagement'],
      'trading_action': ['awareness', 'interest', 'consideration', 'intent', 'action'],
      'contact_form': ['awareness', 'interest', 'intent', 'action']
    };

    const stages = funnelStages[category as keyof typeof funnelStages] || [];
    const currentStage = stages[stages.length - 1] || 'action';

    this.trackEvent('funnel_stage', {
      category,
      stage: currentStage,
      goal_id: goalId,
      user_segment: this.userSegment
    });
  }

  private storeConversionAttribution(conversionData: any) {
    const attributions = JSON.parse(localStorage.getItem('conversion_attributions') || '[]');
    attributions.push({
      ...conversionData,
      attribution_timestamp: Date.now()
    });

    // Keep only last 10 conversions
    if (attributions.length > 10) {
      attributions.splice(0, attributions.length - 10);
    }

    localStorage.setItem('conversion_attributions', JSON.stringify(attributions));
  }

  // Enhanced Event Tracking
  public trackEvent(event: string, properties?: Record<string, any>) {
    const eventData = {
      event,
      properties: {
        ...properties,
        user_segment: this.userSegment,
        session_id: this.sessionId,
        user_id: this.userId,
        page_url: window.location.pathname,
        page_title: document.title,
        timestamp: Date.now()
      }
    };

    // Send to analytics service
    analytics.track(event, eventData.properties, this.userId || undefined);

    // Store for offline sync if needed
    if (!navigator.onLine) {
      this.queueOfflineEvent(eventData);
    }
  }

  private queueOfflineEvent(eventData: any) {
    const queue = JSON.parse(localStorage.getItem('offline_analytics_queue') || '[]');
    queue.push(eventData);
    localStorage.setItem('offline_analytics_queue', JSON.stringify(queue));
  }

  // User Journey Tracking
  public trackPageView(page: string, title: string) {
    const journey = JSON.parse(sessionStorage.getItem('user_journey') || '[]');
    journey.push({
      page,
      title,
      timestamp: Date.now(),
      session_id: this.sessionId
    });

    // Keep last 20 page views
    if (journey.length > 20) {
      journey.splice(0, journey.length - 20);
    }

    sessionStorage.setItem('user_journey', JSON.stringify(journey));

    this.trackEvent('page_view', {
      page,
      title,
      journey_length: journey.length,
      previous_page: journey[journey.length - 2]?.page || null
    });
  }

  // PWA Specific Analytics
  public trackPWAMetrics() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isPWACapable = 'serviceWorker' in navigator;
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    
    this.trackEvent('pwa_capabilities', {
      is_standalone: isStandalone,
      is_pwa_capable: isPWACapable,
      has_manifest: hasManifest,
      supports_notifications: 'Notification' in window,
      supports_push: 'PushManager' in window
    });

    if (isStandalone) {
      this.trackConversion('pwa_install', {
        install_source: 'automatic_detection'
      });
    }
  }

  // User Engagement Scoring
  public calculateEngagementScore(): number {
    const journey = JSON.parse(sessionStorage.getItem('user_journey') || '[]');
    const conversions = JSON.parse(localStorage.getItem('conversion_attributions') || '[]');
    
    let score = 0;
    
    // Page views score (0-20 points)
    score += Math.min(journey.length * 2, 20);
    
    // Time on site score (0-30 points)
    if (journey.length > 1) {
      const sessionDuration = Date.now() - journey[0].timestamp;
      score += Math.min(sessionDuration / 60000 * 2, 30); // 2 points per minute, max 30
    }
    
    // Conversion score (0-50 points)
    const conversionValue = conversions.reduce((sum: number, conv: any) => sum + (conv.goal_value || 0), 0);
    score += Math.min(conversionValue, 50);
    
    return Math.round(score);
  }

  // Public API
  public setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('analytics_user_id', userId);
  }

  public getUserSegment(): string | null {
    return this.userSegment;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getConversionGoals(): ConversionGoal[] {
    return [...this.conversionGoals];
  }

  public getABTests(): ABTest[] {
    return [...this.abTests];
  }
}

// Export singleton instance
export const conversionAnalytics = new ConversionAnalytics();

// React hook
export function useConversionAnalytics() {
  return {
    trackConversion: conversionAnalytics.trackConversion.bind(conversionAnalytics),
    trackEvent: conversionAnalytics.trackEvent.bind(conversionAnalytics),
    trackPageView: conversionAnalytics.trackPageView.bind(conversionAnalytics),
    getABTestVariant: conversionAnalytics.getABTestVariant.bind(conversionAnalytics),
    trackABTestConversion: conversionAnalytics.trackABTestConversion.bind(conversionAnalytics),
    calculateEngagementScore: conversionAnalytics.calculateEngagementScore.bind(conversionAnalytics),
    getUserSegment: conversionAnalytics.getUserSegment.bind(conversionAnalytics),
    setUserId: conversionAnalytics.setUserId.bind(conversionAnalytics),
    getABTests: conversionAnalytics.getABTests.bind(conversionAnalytics),
    getConversionGoals: conversionAnalytics.getConversionGoals.bind(conversionAnalytics)
  };
}
