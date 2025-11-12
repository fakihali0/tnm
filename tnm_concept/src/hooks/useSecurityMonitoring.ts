/**
 * Security Monitoring React Hook
 * Provides real-time security monitoring and threat detection
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { enhancedSecurityValidator } from '@/utils/enhanced-security-validator';

interface SecurityEvent {
  id: string;
  event_type: string;
  details: any;
  timestamp: string;
  ip_address: string;
  user_agent?: string;
  created_at?: string;
}

interface SecurityAlert {
  id: string;
  type: 'threat' | 'anomaly' | 'breach' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

interface SecurityStats {
  totalEvents: number;
  recentThreats: number;
  criticalAlerts: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityMonitoring = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    recentThreats: 0,
    criticalAlerts: 0,
    riskLevel: 'low'
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Start real-time monitoring
  const startMonitoring = useCallback(async () => {
    setIsMonitoring(true);

    try {
      // Fetch recent security events
      const { data: events, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch security events:', error);
        return;
      }

      setSecurityEvents(events || []);
      analyzeSecurityEvents(events || []);

      // Set up real-time subscription
      const subscription = supabase
        .channel('security_events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'security_events'
          },
          (payload) => {
            const newEvent = payload.new as SecurityEvent;
            setSecurityEvents(prev => [newEvent, ...prev.slice(0, 49)]);
            processNewSecurityEvent(newEvent);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to start security monitoring:', error);
      setIsMonitoring(false);
    }
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Process new security events for alerts
  const processNewSecurityEvent = useCallback((event: SecurityEvent) => {
    const alertConfig = getAlertConfiguration(event);
    
    if (alertConfig) {
      const alert: SecurityAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: alertConfig.type,
        severity: alertConfig.severity,
        message: alertConfig.message,
        timestamp: new Date(),
        details: event.details
      };

      setAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts
      
      // Update stats
      setStats(prev => ({
        ...prev,
        criticalAlerts: alertConfig.severity === 'critical' ? prev.criticalAlerts + 1 : prev.criticalAlerts,
        recentThreats: prev.recentThreats + 1
      }));
    }
  }, []);

  // Analyze security events for patterns
  const analyzeSecurityEvents = useCallback((events: SecurityEvent[]) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentEvents = events.filter(
      event => new Date(event.timestamp) > oneHourAgo
    );

    const threatEvents = events.filter(
      event => event.event_type.includes('threat') || 
                event.event_type.includes('failed') ||
                event.event_type.includes('suspicious')
    );

    const criticalEvents = events.filter(
      event => event.details?.severity === 'critical'
    );

    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (criticalEvents.length > 0) {
      riskLevel = 'critical';
    } else if (recentEvents.length > 10) {
      riskLevel = 'high';
    } else if (threatEvents.length > 5) {
      riskLevel = 'medium';
    }

    setStats({
      totalEvents: events.length,
      recentThreats: threatEvents.length,
      criticalAlerts: criticalEvents.length,
      riskLevel
    });
  }, []);

  // Get alert configuration for specific events
  const getAlertConfiguration = (event: SecurityEvent) => {
    const alertMap: Record<string, { type: SecurityAlert['type']; severity: SecurityAlert['severity']; message: string }> = {
      'threat_detected': {
        type: 'threat',
        severity: event.details?.severity || 'medium',
        message: `Security threat detected: ${event.details?.threats?.join(', ') || 'Unknown threat'}`
      },
      'failed_login': {
        type: 'warning',
        severity: 'medium',
        message: 'Failed login attempt detected'
      },
      'suspicious_form_submission': {
        type: 'anomaly',
        severity: 'medium',
        message: 'Suspicious form submission detected'
      },
      'rate_limit_exceeded': {
        type: 'warning',
        severity: 'high',
        message: 'Rate limit exceeded - possible attack'
      },
      'mt4_connection_failed': {
        type: 'warning',
        severity: 'low',
        message: 'MT4 connection failed'
      },
      'mt5_connection_failed': {
        type: 'warning',
        severity: 'low',
        message: 'MT5 connection failed'
      },
      'unauthorized_access': {
        type: 'breach',
        severity: 'critical',
        message: 'Unauthorized access attempt detected'
      }
    };

    return alertMap[event.event_type] || null;
  };

  // Log custom security event
  const logSecurityEvent = useCallback(async (
    eventType: string,
    details: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: eventType,
          details,
          ip_address: 'client-side',
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Dismiss specific alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Get security report
  const generateSecurityReport = useCallback(async () => {
    return await enhancedSecurityValidator.generateSecurityReport();
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    // State
    securityEvents,
    alerts,
    stats,
    isMonitoring,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    logSecurityEvent,
    clearAlerts,
    dismissAlert,
    generateSecurityReport,
    
    // Utils
    processNewSecurityEvent
  };
};