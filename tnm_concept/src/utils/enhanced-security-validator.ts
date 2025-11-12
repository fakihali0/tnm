/**
 * Enhanced Security Validation Utilities
 * Provides comprehensive input validation and threat detection
 */

import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  threats: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityMetrics {
  totalValidations: number;
  threatsDetected: number;
  criticalThreats: number;
  lastThreatDetected?: Date;
}

class EnhancedSecurityValidator {
  private metrics: SecurityMetrics = {
    totalValidations: 0,
    threatsDetected: 0,
    criticalThreats: 0
  };

  private threatPatterns = [
    {
      name: 'SQL Injection',
      pattern: /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript)/i,
      severity: 'critical' as const
    },
    {
      name: 'XSS Attack',
      pattern: /(<script|javascript:|vbscript:|onload|onerror|onclick)/i,
      severity: 'high' as const
    },
    {
      name: 'Path Traversal',
      pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\)/i,
      severity: 'high' as const
    },
    {
      name: 'Command Injection',
      pattern: /(;|\||&|`|\$\(|eval\(|system\(|exec\()/i,
      severity: 'critical' as const
    },
    {
      name: 'LDAP Injection',
      pattern: /(\*|\(|\)|\\|\/|\+|=|<|>|;|,|\0)/i,
      severity: 'medium' as const
    },
    {
      name: 'Email Header Injection',
      pattern: /(\n|\r|%0a|%0d|%0A|%0D)/i,
      severity: 'medium' as const
    }
  ];

  private suspiciousPatterns = [
    {
      name: 'Multiple Special Characters',
      pattern: /[!@#$%^&*()_+=\[\]{}|;:,.<>?]{5,}/,
      severity: 'low' as const
    },
    {
      name: 'Encoded Content',
      pattern: /%[0-9a-f]{2}/i,
      severity: 'medium' as const
    },
    {
      name: 'Long Repetitive Content',
      pattern: /(.)\1{50,}/,
      severity: 'low' as const
    }
  ];

  async validateInput(
    input: string,
    context: string = 'general',
    logEvents: boolean = true
  ): Promise<ValidationResult> {
    this.metrics.totalValidations++;
    
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      threats: [],
      severity: 'low'
    };

    try {
      // Check for threat patterns
      const threats = this.detectThreats(input);
      
      if (threats.length > 0) {
        result.threats = threats.map(t => t.name);
        result.severity = this.calculateSeverity(threats);
        result.isValid = result.severity === 'critical' ? false : true;
        
        this.metrics.threatsDetected += threats.length;
        if (result.severity === 'critical') {
          this.metrics.criticalThreats++;
          this.metrics.lastThreatDetected = new Date();
        }

        if (logEvents) {
          await this.logSecurityEvent('threat_detected', {
            context,
            threats: result.threats,
            severity: result.severity,
            inputLength: input.length,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Basic validation checks
      result.errors = this.performBasicValidation(input, context);
      
      if (result.errors.length > 0 && result.severity === 'low') {
        result.isValid = false;
      }

    } catch (error) {
      console.error('Security validation error:', error);
      result.errors.push('Validation system error');
      result.isValid = false;
      result.severity = 'high';
    }

    return result;
  }

  private detectThreats(input: string) {
    const detectedThreats: Array<{ name: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = [];
    
    // Check primary threat patterns
    for (const pattern of this.threatPatterns) {
      if (pattern.pattern.test(input)) {
        detectedThreats.push(pattern);
      }
    }

    // Check suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.pattern.test(input)) {
        detectedThreats.push(pattern);
      }
    }

    return detectedThreats;
  }

  private calculateSeverity(threats: Array<{ severity: string }>): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.some(t => t.severity === 'critical')) return 'critical';
    if (threats.some(t => t.severity === 'high')) return 'high';
    if (threats.some(t => t.severity === 'medium')) return 'medium';
    return 'low';
  }

  private performBasicValidation(input: string, context: string): string[] {
    const errors: string[] = [];

    // Context-specific validation
    switch (context) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          errors.push('Invalid email format');
        }
        break;
      
      case 'phone':
        if (!/^\+?[\d\s\-\(\)]{10,}$/.test(input)) {
          errors.push('Invalid phone format');
        }
        break;
      
      case 'name':
        if (!/^[a-zA-Z\s\-']{2,50}$/.test(input)) {
          errors.push('Invalid name format');
        }
        break;
      
      case 'trading_credential':
        if (input.length < 3 || input.length > 50) {
          errors.push('Trading credential must be 3-50 characters');
        }
        break;
    }

    // General validation
    if (input.length > 5000) {
      errors.push('Input exceeds maximum length');
    }

    if (input.trim().length === 0) {
      errors.push('Input cannot be empty');
    }

    return errors;
  }

  async logSecurityEvent(eventType: string, details: Record<string, any>) {
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
        console.warn('Failed to log security event:', error);
      }
    } catch (error) {
      console.warn('Security event logging failed:', error);
    }
  }

  async validateFormData(
    formData: Record<string, any>,
    contextMap: Record<string, string> = {}
  ): Promise<{
    isValid: boolean;
    fieldErrors: Record<string, string[]>;
    overallThreats: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const fieldErrors: Record<string, string[]> = {};
    const allThreats: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    for (const [field, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        const context = contextMap[field] || 'general';
        const result = await this.validateInput(value, context, false);
        
        if (!result.isValid || result.errors.length > 0) {
          fieldErrors[field] = [...result.errors, ...result.threats];
        }
        
        allThreats.push(...result.threats);
        
        // Update max severity
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityLevels[result.severity] > severityLevels[maxSeverity]) {
          maxSeverity = result.severity;
        }
      }
    }

    // Log form validation if threats detected
    if (allThreats.length > 0) {
      await this.logSecurityEvent('form_validation_threats', {
        fieldCount: Object.keys(formData).length,
        threatsDetected: allThreats,
        severity: maxSeverity,
        timestamp: new Date().toISOString()
      });
    }

    return {
      isValid: Object.keys(fieldErrors).length === 0 && maxSeverity !== 'critical',
      fieldErrors,
      overallThreats: [...new Set(allThreats)],
      severity: maxSeverity
    };
  }

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  async generateSecurityReport(): Promise<{
    summary: SecurityMetrics;
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const riskLevel = this.calculateRiskLevel();
    const recommendations = this.generateRecommendations(riskLevel);

    return {
      summary: this.getSecurityMetrics(),
      recommendations,
      riskLevel
    };
  }

  private calculateRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const { totalValidations, threatsDetected, criticalThreats } = this.metrics;
    
    if (criticalThreats > 0) return 'critical';
    if (totalValidations > 0) {
      const threatRatio = threatsDetected / totalValidations;
      if (threatRatio > 0.1) return 'high';
      if (threatRatio > 0.05) return 'medium';
    }
    return 'low';
  }

  private generateRecommendations(riskLevel: string): string[] {
    const recommendations: string[] = [];
    
    switch (riskLevel) {
      case 'critical':
        recommendations.push('Immediate security review required');
        recommendations.push('Consider implementing additional input filters');
        recommendations.push('Enable enhanced monitoring and alerts');
        break;
      case 'high':
        recommendations.push('Review recent security events');
        recommendations.push('Consider rate limiting for suspicious activities');
        break;
      case 'medium':
        recommendations.push('Monitor security trends');
        recommendations.push('Review validation rules');
        break;
      default:
        recommendations.push('Security status normal');
        recommendations.push('Continue regular monitoring');
    }
    
    return recommendations;
  }
}

export const enhancedSecurityValidator = new EnhancedSecurityValidator();