/**
 * Security monitoring utilities
 * Tracks and logs security-related events
 */

import { supabase } from '@/integrations/supabase/client';
import { logSecurity } from './logger';

interface SecurityEvent {
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
}

class SecurityMonitor {
  private getClientInfo() {
    return {
      ip_address: 'unknown', // Client-side can't get real IP
      user_agent: navigator.userAgent,
    };
  }

  async logSecurityEvent(eventType: string, details?: Record<string, any>) {
    try {
      const clientInfo = this.getClientInfo();
      
      // Log to console for immediate visibility
      logSecurity(eventType, details);

      // Store in database for audit trail
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: eventType,
          ...clientInfo,
          details: details || {},
        });

      if (error) {
        console.warn('Failed to log security event to database:', error);
      }
    } catch (error) {
      console.warn('Security event logging failed:', error);
    }
  }

  // Authentication events
  async logFailedLogin(email: string, error: string) {
    await this.logSecurityEvent('failed_login', {
      email: email.substring(0, 3) + '***', // Partially mask email
      error,
      timestamp: new Date().toISOString(),
    });
  }

  async logSuccessfulLogin(userId: string) {
    await this.logSecurityEvent('successful_login', {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async logUnauthorizedAccess(resource: string) {
    await this.logSecurityEvent('unauthorized_access', {
      resource,
      timestamp: new Date().toISOString(),
    });
  }

  // Data access events
  async logSensitiveDataAccess(dataType: string, userId?: string) {
    await this.logSecurityEvent('sensitive_data_access', {
      data_type: dataType,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Form security events
  async logSuspiciousFormSubmission(formId: string, reason: string) {
    await this.logSecurityEvent('suspicious_form_submission', {
      form_id: formId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  async logRateLimitExceeded(endpoint: string, userId?: string) {
    await this.logSecurityEvent('rate_limit_exceeded', {
      endpoint,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export const securityMonitor = new SecurityMonitor();