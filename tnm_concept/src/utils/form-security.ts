// Form security utilities with rate limiting and validation
import { securityMonitor } from './security-monitor';
interface FormSubmissionData {
  formId: string;
  timestamp: number;
  fingerprint: string;
  userAgent: string;
  ip?: string;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface SecurityConfig {
  enableRateLimit: boolean;
  enableFingerprinting: boolean;
  enableCaptcha: boolean;
  enableCSRF: boolean;
  validateReferer: boolean;
}

class FormSecurityManager {
  private submissions: Map<string, FormSubmissionData[]> = new Map();
  private blockedFingerprints: Set<string> = new Set();
  private csrfToken: string | null = null;
  
  private defaultRateLimit: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  };

  private securityConfig: SecurityConfig = {
    enableRateLimit: true,
    enableFingerprinting: true,
    enableCaptcha: false, // Enable for production
    enableCSRF: true,
    validateReferer: true
  };

  constructor() {
    this.initializeCSRF();
    this.cleanupOldSubmissions();
    
    // Cleanup every 5 minutes
    setInterval(() => this.cleanupOldSubmissions(), 5 * 60 * 1000);
  }

  private initializeCSRF() {
    this.csrfToken = this.generateCSRFToken();
    
    // Add CSRF token to meta tag
    const metaTag = document.createElement('meta');
    metaTag.name = 'csrf-token';
    metaTag.content = this.csrfToken;
    document.head.appendChild(metaTag);
  }

  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      canvas.toDataURL()
    ].join('|');
    
    return this.hashString(fingerprint);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private cleanupOldSubmissions() {
    const now = Date.now();
    for (const [fingerprint, submissions] of this.submissions.entries()) {
      const validSubmissions = submissions.filter(
        sub => now - sub.timestamp < this.defaultRateLimit.windowMs
      );
      
      if (validSubmissions.length === 0) {
        this.submissions.delete(fingerprint);
      } else {
        this.submissions.set(fingerprint, validSubmissions);
      }
    }
    
    // Cleanup blocked fingerprints
    const blockedArray = Array.from(this.blockedFingerprints);
    this.blockedFingerprints.clear();
    blockedArray.forEach(fp => {
      const submissions = this.submissions.get(fp) || [];
      const recentSubmissions = submissions.filter(
        sub => now - sub.timestamp < this.defaultRateLimit.blockDurationMs
      );
      
      if (recentSubmissions.length > 0) {
        this.blockedFingerprints.add(fp);
      }
    });
  }

  public validateFormSubmission(
    formId: string, 
    formData: FormData,
    options: Partial<RateLimitConfig> = {}
  ): { isValid: boolean; error?: string; csrfToken?: string } {
    const rateLimit = { ...this.defaultRateLimit, ...options };
    const fingerprint = this.generateFingerprint();
    const now = Date.now();

    // Check if fingerprint is blocked
    if (this.securityConfig.enableRateLimit && this.blockedFingerprints.has(fingerprint)) {
      return {
        isValid: false,
        error: 'Too many submission attempts. Please try again later.'
      };
    }

    // Validate CSRF token
    if (this.securityConfig.enableCSRF) {
      const submittedToken = formData.get('csrf_token') as string;
      if (!submittedToken || submittedToken !== this.csrfToken) {
        return {
          isValid: false,
          error: 'Invalid security token. Please refresh the page and try again.'
        };
      }
    }

    // Validate referer
    if (this.securityConfig.validateReferer) {
      const referer = document.referrer;
      const currentOrigin = window.location.origin;
      if (referer && !referer.startsWith(currentOrigin)) {
        return {
          isValid: false,
          error: 'Invalid request origin.'
        };
      }
    }

    // Rate limiting check
    if (this.securityConfig.enableRateLimit) {
      const submissions = this.submissions.get(fingerprint) || [];
      const recentSubmissions = submissions.filter(
        sub => now - sub.timestamp < rateLimit.windowMs
      );

      if (recentSubmissions.length >= rateLimit.maxAttempts) {
        this.blockedFingerprints.add(fingerprint);
        securityMonitor.logRateLimitExceeded(formId);
        return {
          isValid: false,
          error: `Too many submission attempts. Please wait ${Math.ceil(rateLimit.blockDurationMs / 60000)} minutes before trying again.`
        };
      }
    }

    // Log submission
    const submissionData: FormSubmissionData = {
      formId,
      timestamp: now,
      fingerprint,
      userAgent: navigator.userAgent
    };

    const existingSubmissions = this.submissions.get(fingerprint) || [];
    existingSubmissions.push(submissionData);
    this.submissions.set(fingerprint, existingSubmissions);

    return {
      isValid: true,
      csrfToken: this.csrfToken || undefined
    };
  }

  public sanitizeFormData(formData: FormData): FormData {
    const sanitized = new FormData();
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        // Basic XSS prevention
        const sanitizedValue = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
        
        // Length limits
        const maxLength = key.includes('email') ? 254 : 
                         key.includes('phone') ? 20 : 
                         key.includes('message') || key.includes('comment') ? 5000 : 
                         500;
        
        const truncatedValue = sanitizedValue.length > maxLength 
          ? sanitizedValue.substring(0, maxLength) 
          : sanitizedValue;
        
        sanitized.append(key, truncatedValue);
      } else {
        sanitized.append(key, value);
      }
    }
    
    return sanitized;
  }

  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  public validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }

  public validateName(name: string): boolean {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-\'\.]{2,50}$/;
    return nameRegex.test(name.trim());
  }

  public getSecurityStats(): {
    totalSubmissions: number;
    blockedFingerprints: number;
    recentSubmissions: number;
  } {
    const now = Date.now();
    let totalSubmissions = 0;
    let recentSubmissions = 0;

    for (const submissions of this.submissions.values()) {
      totalSubmissions += submissions.length;
      recentSubmissions += submissions.filter(
        sub => now - sub.timestamp < 60 * 60 * 1000 // Last hour
      ).length;
    }

    return {
      totalSubmissions,
      blockedFingerprints: this.blockedFingerprints.size,
      recentSubmissions
    };
  }

  public updateSecurityConfig(config: Partial<SecurityConfig>) {
    this.securityConfig = { ...this.securityConfig, ...config };
  }

  public getCSRFToken(): string | null {
    return this.csrfToken;
  }

  public refreshCSRFToken(): string {
    this.csrfToken = this.generateCSRFToken();
    
    // Update meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (metaTag) {
      metaTag.content = this.csrfToken;
    }
    
    return this.csrfToken;
  }
}

// Export singleton instance
export const formSecurity = new FormSecurityManager();

// React hook for form security
export function useFormSecurity() {
  return {
    validateSubmission: formSecurity.validateFormSubmission.bind(formSecurity),
    sanitizeFormData: formSecurity.sanitizeFormData.bind(formSecurity),
    validateEmail: formSecurity.validateEmail.bind(formSecurity),
    validatePhone: formSecurity.validatePhone.bind(formSecurity),
    validateName: formSecurity.validateName.bind(formSecurity),
    getCSRFToken: formSecurity.getCSRFToken.bind(formSecurity),
    refreshCSRFToken: formSecurity.refreshCSRFToken.bind(formSecurity),
    getSecurityStats: formSecurity.getSecurityStats.bind(formSecurity)
  };
}