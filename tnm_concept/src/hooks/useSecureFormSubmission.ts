/**
 * Enhanced secure form submission hook with real-time threat detection
 */

import { useState, useCallback } from 'react';
import { enhancedSecurityMonitor } from '@/utils/enhanced-security-monitor';
import { formSecurity } from '@/utils/form-security';

interface SubmissionResult {
  success: boolean;
  error?: string;
  threats?: string[];
  severity?: string;
  rateLimited?: boolean;
}

interface UseSecureFormSubmissionOptions {
  formId: string;
  maxAttempts?: number;
  windowMs?: number;
  enableThreatDetection?: boolean;
}

export function useSecureFormSubmission(options: UseSecureFormSubmissionOptions) {
  const { formId, maxAttempts = 3, windowMs = 900000, enableThreatDetection = true } = options;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number | null>(null);

  const submitSecureForm = useCallback(async (
    formData: Record<string, any>,
    submitFunction: (data: Record<string, any>) => Promise<any>
  ): Promise<SubmissionResult> => {
    setIsSubmitting(true);

    try {
      // Generate a user fingerprint for rate limiting
      const fingerprint = `${navigator.userAgent}_${window.location.host}`;
      
      // Check if user is blocked
      if (enhancedSecurityMonitor.isBlocked(fingerprint)) {
        return {
          success: false,
          error: 'Access temporarily blocked due to security concerns',
          rateLimited: true
        };
      }

      // Check advanced rate limiting
      const rateLimitPassed = enhancedSecurityMonitor.checkAdvancedRateLimit(
        fingerprint,
        maxAttempts,
        windowMs
      );

      if (!rateLimitPassed) {
        return {
          success: false,
          error: 'Too many attempts. Please try again later.',
          rateLimited: true
        };
      }

      // Enhanced security validation
      let validationResult = { isValid: true, errors: [], threats: [], severity: 'low' };
      
      if (enableThreatDetection) {
        validationResult = await enhancedSecurityMonitor.validateSecureForm(formData, formId);
        
        if (!validationResult.isValid) {
          // Log security violation
          await enhancedSecurityMonitor.logSecurityEvent('form_security_violation', {
            form_id: formId,
            errors: validationResult.errors,
            threats: validationResult.threats,
            severity: validationResult.severity
          });

          return {
            success: false,
            error: 'Security validation failed: ' + validationResult.errors.join(', '),
            threats: validationResult.threats,
            severity: validationResult.severity
          };
        }
      }

      // Additional form security check (existing system)
      const formSecurityResult = formSecurity.validateFormSubmission(formId, new FormData());
      if (!formSecurityResult.isValid) {
        return {
          success: false,
          error: formSecurityResult.error || 'Form validation failed',
          rateLimited: true
        };
      }

      // Sanitize form data
      const sanitizedData = formSecurity.sanitizeFormData(new FormData());
      const sanitizedObject: Record<string, any> = {};
      
      // Convert sanitized FormData back to object and merge with original structure
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
          // Apply basic sanitization
          sanitizedObject[key] = value
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim()
            .substring(0, 1000); // Limit length
        } else {
          sanitizedObject[key] = value;
        }
      }

      // Log successful form validation
      await enhancedSecurityMonitor.logSecurityEvent('secure_form_submitted', {
        form_id: formId,
        validation_passed: true,
        threats_detected: validationResult.threats.length
      });

      // Submit the form
      const result = await submitFunction(sanitizedObject);
      setLastSubmissionTime(Date.now());

      return {
        success: true,
        threats: validationResult.threats,
        severity: validationResult.severity
      };

    } catch (error) {
      // Log submission error
      await enhancedSecurityMonitor.logSecurityEvent('form_submission_error', {
        form_id: formId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed'
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [formId, maxAttempts, windowMs, enableThreatDetection]);

  const checkSubmissionCooldown = useCallback((cooldownMs: number = 30000): boolean => {
    if (!lastSubmissionTime) return true;
    return Date.now() - lastSubmissionTime > cooldownMs;
  }, [lastSubmissionTime]);

  return {
    submitSecureForm,
    isSubmitting,
    checkSubmissionCooldown,
    lastSubmissionTime
  };
}