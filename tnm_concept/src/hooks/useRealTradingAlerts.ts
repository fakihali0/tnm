import { useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import { useAccountStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';

export function useRealTradingAlerts() {
  const { addNotification, settings } = useNotifications();
  const { selectedAccount } = useAccountStore();

  // Monitor real-time risk alerts
  useEffect(() => {
    if (!selectedAccount || !settings.riskAlerts) return;

    console.log('Setting up real-time risk monitoring for account:', selectedAccount.id);

    const checkRisks = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('risk-monitor', {
          body: { accountId: selectedAccount.id }
        });

        if (error) {
          console.error('Risk monitoring error:', error);
          return;
        }

        if (data.alerts && data.alerts.length > 0) {
          data.alerts.forEach((alert: any) => {
            if (alert.severity === 'critical' || alert.severity === 'high') {
              addNotification({
                type: 'risk',
                title: alert.title,
                message: alert.message,
                priority: alert.severity === 'critical' ? 'high' : 'medium'
              });
            }
          });
        }
      } catch (error) {
        console.error('Risk monitoring failed:', error);
      }
    };

    // Initial check
    checkRisks();

    // Set up interval for continuous monitoring (every 30 seconds)
    const riskInterval = setInterval(checkRisks, 30000);

    return () => clearInterval(riskInterval);
  }, [selectedAccount, settings.riskAlerts, addNotification]);

  // Auto-sync disabled - MetaAPI integration removed
  // useEffect(() => {
  //   console.log('Auto-sync disabled: MetaAPI integration removed');
  // }, [selectedAccount]);

  // Generate AI insights periodically
  useEffect(() => {
    if (!selectedAccount || !settings.performanceAlerts) return;

    const generateInsights = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('ai-insights-generator', {
          body: { accountId: selectedAccount.id }
        });

        if (error) {
          console.error('AI insights error:', error);
          return;
        }

        if (data.insights && data.insights.length > 0) {
          // Show high-impact insights as notifications
          data.insights
            .filter((insight: any) => insight.impact === 'high' && insight.actionable)
            .forEach((insight: any) => {
              addNotification({
                type: 'performance',
                title: insight.title,
                message: insight.description,
                priority: 'medium'
              });
            });
        }
      } catch (error) {
        console.error('AI insights generation failed:', error);
      }
    };

    // Generate insights every 30 minutes
    const insightsInterval = setInterval(generateInsights, 30 * 60 * 1000);

    return () => clearInterval(insightsInterval);
  }, [selectedAccount, settings.performanceAlerts, addNotification]);

  const triggerManualRiskCheck = useCallback(async () => {
    if (!selectedAccount) return;

    try {
      const { data, error } = await supabase.functions.invoke('risk-monitor', {
        body: { accountId: selectedAccount.id }
      });

      if (error) throw error;

      addNotification({
        type: 'system',
        title: 'Risk Check Complete',
        message: `Found ${data.totalAlerts} potential risks. ${data.criticalAlerts} require immediate attention.`,
        priority: data.criticalAlerts > 0 ? 'high' : 'low'
      });

      return data;
    } catch (error) {
      console.error('Manual risk check failed:', error);
      addNotification({
        type: 'system',
        title: 'Risk Check Failed',
        message: 'Unable to perform risk assessment. Please try again.',
        priority: 'medium'
      });
    }
  }, [selectedAccount, addNotification]);

  const triggerManualSync = useCallback(async () => {
    // MetaAPI integration disabled
    addNotification({
      type: 'system',
      title: 'Sync Unavailable',
      message: 'Live account synchronization is temporarily disabled. New integration coming soon!',
      priority: 'low'
    });
  }, [addNotification]);

  return {
    triggerManualRiskCheck,
    triggerManualSync
  };
}