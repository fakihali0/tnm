/**
 * Enhanced form security utilities with rate limiting and validation
 */

import { z } from 'zod';
import { formSecurity } from './form-security';

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true };
};

// Enhanced contact form validation schema
export const createEnhancedContactSchema = () => z.object({
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
  
  lastName: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
  
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  phone: z.string()
    .trim()
    .optional()
    .refine((phone) => !phone || /^\+?[\d\s\-\(\)]+$/.test(phone), 'Invalid phone number format'),
  
  subject: z.string()
    .trim()
    .min(1, 'Subject is required')
    .max(100, 'Subject must be less than 100 characters'),
  
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .refine((message) => {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i,
        /vbscript:/i
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(message));
    }, 'Message contains invalid content')
});

// Enhanced form submission with security checks
export const submitSecureForm = async (
  formId: string,
  formData: FormData,
  submitFn: (data: FormData) => Promise<any>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Security validation
    const validation = formSecurity.validateFormSubmission(formId, formData, {
      maxAttempts: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
      blockDurationMs: 30 * 60 * 1000   // 30 minutes in milliseconds
    });

    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Sanitize form data
    const sanitizedData = formSecurity.sanitizeFormData(formData);

    // Submit the form
    const result = await submitFn(sanitizedData);
    return { success: true };
  } catch (error) {
    console.error('Form submission error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
};

// Rate limiting hook for forms
export const useFormRateLimit = (formId: string) => {
  const checkRateLimit = () => {
    const stats = formSecurity.getSecurityStats();
    const validation = formSecurity.validateFormSubmission(formId, new FormData());
    return validation.isValid;
  };

  return { checkRateLimit };
};