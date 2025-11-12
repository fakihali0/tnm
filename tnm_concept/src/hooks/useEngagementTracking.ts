import { useState, useEffect, useCallback } from 'react';

interface EngagementMetrics {
  pageViews: number;
  timeSpent: number;
  interactions: number;
  scrollDepth: number;
  score: number;
}

export function useEngagementTracking() {
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    pageViews: 0,
    timeSpent: 0,
    interactions: 0,
    scrollDepth: 0,
    score: 0
  });

  const [startTime] = useState(Date.now());

  // Load existing metrics from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pwa-engagement-metrics');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMetrics(prev => ({
          ...prev,
          pageViews: parsed.pageViews || 0,
          interactions: parsed.interactions || 0,
          scrollDepth: Math.max(prev.scrollDepth, parsed.scrollDepth || 0)
        }));
      } catch (error) {
        console.warn('Failed to parse engagement metrics from localStorage');
      }
    }
  }, []);

  // Track page view
  useEffect(() => {
    setMetrics(prev => {
      const updated = { ...prev, pageViews: prev.pageViews + 1 };
      localStorage.setItem('pwa-engagement-metrics', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        timeSpent: Date.now() - startTime
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.min(Math.round((scrollTop / docHeight) * 100), 100);
      
      setMetrics(prev => {
        if (scrollPercent > prev.scrollDepth) {
          const updated = { ...prev, scrollDepth: scrollPercent };
          localStorage.setItem('pwa-engagement-metrics', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track interactions
  const trackInteraction = useCallback(() => {
    setMetrics(prev => {
      const updated = { ...prev, interactions: prev.interactions + 1 };
      localStorage.setItem('pwa-engagement-metrics', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Calculate engagement score
  useEffect(() => {
    const timeScore = Math.min(metrics.timeSpent / 30000, 1) * 25; // 30 seconds = max time score
    const pageScore = Math.min(metrics.pageViews / 3, 1) * 25; // 3 pages = max page score
    const interactionScore = Math.min(metrics.interactions / 5, 1) * 25; // 5 interactions = max interaction score
    const scrollScore = (metrics.scrollDepth / 100) * 25; // 100% scroll = max scroll score
    
    const totalScore = timeScore + pageScore + interactionScore + scrollScore;
    
    setMetrics(prev => ({
      ...prev,
      score: Math.round(totalScore)
    }));
  }, [metrics.timeSpent, metrics.pageViews, metrics.interactions, metrics.scrollDepth]);

  // Check if user is engaged enough for PWA prompt
  const isEngaged = useCallback(() => {
    // Import device info for iOS priority
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // iOS users - more respectful thresholds (20+ seconds, 2+ page views)
    if (isIOS) {
      return (metrics.pageViews >= 2 && metrics.timeSpent >= 20000) || 
             (metrics.interactions >= 2 && metrics.timeSpent >= 15000);
    }
    
    // Android/Desktop - balanced thresholds (30+ seconds, 2+ page views, 2+ interactions)
    return metrics.score >= 30 || 
           (metrics.pageViews >= 2 && metrics.timeSpent >= 30000) || 
           (metrics.interactions >= 2 && metrics.timeSpent >= 20000) ||
           (metrics.scrollDepth >= 50 && metrics.interactions >= 1); // Meaningful scroll + interaction
  }, [metrics]);

  return {
    metrics,
    trackInteraction,
    isEngaged
  };
}