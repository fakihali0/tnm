import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface CoachingTip {
  id: string;
  type: 'onboarding' | 'feature' | 'improvement' | 'warning';
  title: string;
  content: string;
  trigger: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface CoachingState {
  isEnabled: boolean;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  completedTips: string[];
  dismissedTips: string[];
  currentTips: CoachingTip[];
}

const COACHING_STORAGE_KEY = 'tnm-ai-coaching';

export function useCoaching() {
  const location = useLocation();
  const [state, setState] = useState<CoachingState>(() => {
    const saved = localStorage.getItem(COACHING_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      isEnabled: true,
      userLevel: 'beginner',
      completedTips: [],
      dismissedTips: [],
      currentTips: []
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(COACHING_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Available coaching tips
  const availableTips: CoachingTip[] = [
    {
      id: 'dashboard-welcome',
      type: 'onboarding',
      title: 'Welcome to TNM AI',
      content: 'This is your trading performance dashboard. Start by linking your trading account.',
      trigger: '/tnm-pro',
      priority: 'high',
      category: 'onboarding'
    },
    {
      id: 'link-account-tip',
      type: 'onboarding',
      title: 'Link Your Account',
      content: 'Connect your trading account to see real-time analytics and insights.',
      trigger: '/tnm-pro',
      priority: 'high',
      category: 'setup'
    },
    {
      id: 'journal-introduction',
      type: 'feature',
      title: 'Trading Journal',
      content: 'Record your trades and thoughts to improve your strategy over time.',
      trigger: '/tnm-pro',
      priority: 'medium',
      category: 'features'
    },
    {
      id: 'performance-metrics',
      type: 'improvement',
      title: 'Key Metrics',
      content: 'Focus on your Sharpe ratio and maximum drawdown to gauge risk-adjusted returns.',
      trigger: '/tnm-pro',
      priority: 'medium',
      category: 'education'
    },
    {
      id: 'risk-management',
      type: 'warning',
      title: 'Risk Alert',
      content: 'Your current drawdown is approaching your risk limit. Consider reducing position sizes.',
      trigger: 'high-risk',
      priority: 'high',
      category: 'risk'
    }
  ];

  // Get contextual tips based on current route and user state
  const getContextualTips = useCallback(() => {
    const currentPath = location.pathname;
    
    return availableTips.filter(tip => {
      // Skip if already completed or dismissed
      if (state.completedTips.includes(tip.id) || state.dismissedTips.includes(tip.id)) {
        return false;
      }

      // Check if tip is relevant to current route
      if (tip.trigger === currentPath) {
        return true;
      }

      // Special triggers
      if (tip.trigger === 'high-risk') {
        // This would be triggered by actual risk calculations
        return false; // For now, don't show risk warnings
      }

      return false;
    });
  }, [location.pathname, state.completedTips, state.dismissedTips]);

  // Update current tips when route changes
  useEffect(() => {
    if (state.isEnabled) {
      const newTips = getContextualTips();
      setState(prev => ({ ...prev, currentTips: newTips.slice(0, 2) })); // Max 2 tips at once
    }
  }, [location.pathname, state.isEnabled, getContextualTips]);

  const dismissTip = useCallback((tipId: string) => {
    setState(prev => ({
      ...prev,
      dismissedTips: [...prev.dismissedTips, tipId],
      currentTips: prev.currentTips.filter(tip => tip.id !== tipId)
    }));
  }, []);

  const completeTip = useCallback((tipId: string) => {
    setState(prev => ({
      ...prev,
      completedTips: [...prev.completedTips, tipId],
      currentTips: prev.currentTips.filter(tip => tip.id !== tipId)
    }));
  }, []);

  const resetCoaching = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedTips: [],
      dismissedTips: [],
      currentTips: []
    }));
  }, []);

  const setUserLevel = useCallback((level: 'beginner' | 'intermediate' | 'advanced') => {
    setState(prev => ({ ...prev, userLevel: level }));
  }, []);

  const toggleCoaching = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const triggerTip = useCallback((tipId: string) => {
    const tip = availableTips.find(t => t.id === tipId);
    if (tip && !state.dismissedTips.includes(tipId) && !state.completedTips.includes(tipId)) {
      setState(prev => ({
        ...prev,
        currentTips: [...prev.currentTips.filter(t => t.id !== tipId), tip].slice(0, 2)
      }));
    }
  }, [state.dismissedTips, state.completedTips]);

  return {
    // State
    isEnabled: state.isEnabled,
    userLevel: state.userLevel,
    currentTips: state.currentTips,
    completedTips: state.completedTips,
    dismissedTips: state.dismissedTips,

    // Actions
    dismissTip,
    completeTip,
    resetCoaching,
    setUserLevel,
    toggleCoaching,
    triggerTip,

    // Utils
    getContextualTips,
    hasCompletedOnboarding: state.completedTips.some(id => id.includes('onboarding'))
  };
}