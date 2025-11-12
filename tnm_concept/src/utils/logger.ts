/**
 * Production-safe logging utility
 * Provides conditional logging based on environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  sessionId?: string;
  feature?: string;
  action?: string;
}

class Logger {
  private isProduction = import.meta.env.PROD;

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apikey', 'email'];
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context) return message;
    
    const contextStr = Object.entries(context)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    
    return contextStr ? `${message} [${contextStr}]` : message;
  }

  debug(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const formattedMessage = this.formatMessage(message, context);
    console.log(`[DEBUG] ${formattedMessage}`, data ? this.sanitizeData(data) : '');
  }

  info(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const formattedMessage = this.formatMessage(message, context);
    console.info(`[INFO] ${formattedMessage}`, data ? this.sanitizeData(data) : '');
  }

  warn(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const formattedMessage = this.formatMessage(message, context);
    console.warn(`[WARN] ${formattedMessage}`, data ? this.sanitizeData(data) : '');
  }

  error(message: string, error?: any, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    const formattedMessage = this.formatMessage(message, context);
    console.error(`[ERROR] ${formattedMessage}`, error ? this.sanitizeData(error) : '');
  }

  // Security-specific logging
  security(event: string, details?: any, context?: LogContext): void {
    const formattedMessage = this.formatMessage(`SECURITY: ${event}`, context);
    console.warn(formattedMessage, details ? this.sanitizeData(details) : '');
  }
}

export const logger = new Logger();

// Convenience exports for common logging patterns
export const logAuth = (message: string, data?: any, userId?: string) =>
  logger.debug(message, data, { feature: 'auth', userId });

export const logError = (message: string, error?: any, context?: LogContext) =>
  logger.error(message, error, context);

export const logSecurity = (event: string, details?: any, context?: LogContext) =>
  logger.security(event, details, context);