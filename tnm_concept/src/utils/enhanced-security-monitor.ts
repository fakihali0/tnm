/**
 * Enhanced security monitoring with real-time threat detection
 */

import { supabase } from '@/integrations/supabase/client';
import { logSecurity } from './logger';

interface SecurityEvent {
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
}

interface ThreatPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

class EnhancedSecurityMonitor {
  private threatPatterns: ThreatPattern[] = [
    {
      pattern: /<script[^>]*>.*?<\/script>/gi,
      severity: 'high',
      description: 'Script injection attempt detected'
    },
    {
      pattern: /javascript:|data:text\/html|vbscript:/gi,
      severity: 'high',
      description: 'Malicious URL scheme detected'
    },
    {
      pattern: /on\w+\s*=\s*["'][^"']*["']/gi,
      severity: 'medium',
      description: 'Event handler injection attempt'
    },
    {
      pattern: /\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(from|where|order|group)\b/gi,
      severity: 'high',
      description: 'SQL injection attempt detected'
    },
    {
      pattern: /\.\.\//g,
      severity: 'medium',
      description: 'Directory traversal attempt detected'
    }
  ];

  private submissionCounts = new Map<string, { count: number; lastSubmission: number }>();
  private blockedIPs = new Set<string>();

  private getClientInfo() {
    return {
      ip_address: 'client-side', // Client-side can't get real IP
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
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to log security event to database:', error);
      }
    } catch (error) {
      console.warn('Security event logging failed:', error);
    }
  }

  // Enhanced threat detection
  async detectThreats(input: string, context: string = 'general'): Promise<{ threats: string[]; severity: string }> {
    const detectedThreats: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    for (const threat of this.threatPatterns) {
      if (threat.pattern.test(input)) {
        detectedThreats.push(threat.description);
        
        // Update max severity
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityLevels[threat.severity] > severityLevels[maxSeverity]) {
          maxSeverity = threat.severity;
        }

        // Log the threat
        await this.logSecurityEvent('threat_detected', {
          threat_type: threat.description,
          severity: threat.severity,
          context,
          input_sample: input.substring(0, 100) // Log first 100 chars
        });
      }
    }

    return { threats: detectedThreats, severity: maxSeverity };
  }

  // Enhanced rate limiting with IP tracking
  checkAdvancedRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 900000): boolean {
    const now = Date.now();
    const userSubmissions = this.submissionCounts.get(identifier) || { count: 0, lastSubmission: 0 };

    // Reset count if window has passed
    if (now - userSubmissions.lastSubmission > windowMs) {
      userSubmissions.count = 0;
    }

    // Check if rate limit exceeded
    if (userSubmissions.count >= maxAttempts) {
      this.blockedIPs.add(identifier);
      this.logSecurityEvent('advanced_rate_limit_exceeded', {
        identifier,
        attempts: userSubmissions.count,
        window_ms: windowMs
      });
      return false;
    }

    // Update counter
    userSubmissions.count++;
    userSubmissions.lastSubmission = now;
    this.submissionCounts.set(identifier, userSubmissions);

    return true;
  }

  // Check if identifier is blocked
  isBlocked(identifier: string): boolean {
    return this.blockedIPs.has(identifier);
  }

  // Unblock identifier (admin function)
  unblock(identifier: string): void {
    this.blockedIPs.delete(identifier);
    this.submissionCounts.delete(identifier);
    this.logSecurityEvent('identifier_unblocked', { identifier });
  }

  // Enhanced form validation with security checks
  async validateSecureForm(formData: Record<string, any>, formId: string): Promise<{ 
    isValid: boolean; 
    errors: string[]; 
    threats: string[]; 
    severity: string 
  }> {
    const errors: string[] = [];
    let allThreats: string[] = [];
    let maxSeverity = 'low';

    // Check each form field for threats
    for (const [field, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        const { threats, severity } = await this.detectThreats(value, `form_${formId}_${field}`);
        allThreats = [...allThreats, ...threats];
        
        if (severity === 'critical' || severity === 'high') {
          maxSeverity = severity;
          errors.push(`Security threat detected in ${field}`);
        }
      }
    }

    // Additional validation rules
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Invalid email format');
    }

    // Log form validation attempt
    await this.logSecurityEvent('secure_form_validation', {
      form_id: formId,
      threats_detected: allThreats.length,
      max_severity: maxSeverity,
      validation_passed: errors.length === 0
    });

    return {
      isValid: errors.length === 0,
      errors,
      threats: allThreats,
      severity: maxSeverity
    };
  }

  // Monitor suspicious patterns in user behavior
  async monitorUserBehavior(userId: string, action: string, metadata?: Record<string, any>) {
    const sessionKey = `user_${userId}_${new Date().toDateString()}`;
    const userActions = this.submissionCounts.get(sessionKey) || { count: 0, lastSubmission: 0 };
    
    userActions.count++;
    userActions.lastSubmission = Date.now();
    this.submissionCounts.set(sessionKey, userActions);

    // Alert on suspicious activity patterns
    if (userActions.count > 100) { // More than 100 actions per day
      await this.logSecurityEvent('suspicious_user_activity', {
        user_id: userId,
        action,
        daily_action_count: userActions.count,
        metadata
      });
    }
  }

  // Get security statistics
  getSecurityStats(): {
    totalEvents: number;
    blockedIPs: number;
    activeMonitoring: boolean;
  } {
    return {
      totalEvents: this.submissionCounts.size,
      blockedIPs: this.blockedIPs.size,
      activeMonitoring: true
    };
  }

  // Clear old entries (cleanup function)
  cleanup(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (const [key, value] of this.submissionCounts.entries()) {
      if (now - value.lastSubmission > dayMs) {
        this.submissionCounts.delete(key);
      }
    }

    this.logSecurityEvent('security_monitor_cleanup', {
      cleaned_entries: this.submissionCounts.size
    });
  }
}

export const enhancedSecurityMonitor = new EnhancedSecurityMonitor();

// Auto-cleanup every hour
setInterval(() => {
  enhancedSecurityMonitor.cleanup();
}, 3600000);