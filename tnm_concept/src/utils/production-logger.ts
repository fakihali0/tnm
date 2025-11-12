/**
 * Production-safe logger with performance tracking
 * Automatically strips logs in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'auth' | 'api' | 'ui' | 'performance' | 'security' | 'general';

interface LogContext {
  category?: LogCategory;
  userId?: string;
  sessionId?: string;
  feature?: string;
  duration?: number;
}

class ProductionLogger {
  private isDevelopment = import.meta.env.DEV;
  private errorBuffer: Array<{ message: string; error: any; timestamp: Date }> = [];
  private maxBufferSize = 50;

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // In production, only log errors and warnings
    return level === 'error' || level === 'warn';
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context) return message;
    
    const parts = [message];
    if (context.category) parts.push(`[${context.category}]`);
    if (context.feature) parts.push(`{${context.feature}}`);
    if (context.duration) parts.push(`(${context.duration}ms)`);
    
    return parts.join(' ');
  }

  private bufferError(message: string, error: any) {
    this.errorBuffer.push({
      message,
      error: this.sanitizeError(error),
      timestamp: new Date()
    });

    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift();
    }
  }

  private sanitizeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      };
    }
    return error;
  }

  debug(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const formattedMsg = this.formatMessage(message, context);
    console.log(`[DEBUG] ${formattedMsg}`, data || '');
  }

  info(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const formattedMsg = this.formatMessage(message, context);
    console.info(`[INFO] ${formattedMsg}`, data || '');
  }

  warn(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const formattedMsg = this.formatMessage(message, context);
    console.warn(`[WARN] ${formattedMsg}`, data || '');
  }

  error(message: string, error?: any, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    const formattedMsg = this.formatMessage(message, context);
    console.error(`[ERROR] ${formattedMsg}`, error || '');
    
    this.bufferError(message, error);
  }

  // Performance tracking
  measure(label: string, callback: () => void, context?: LogContext): void {
    if (!this.isDevelopment) {
      callback();
      return;
    }

    const start = performance.now();
    callback();
    const duration = performance.now() - start;

    if (duration > 100) {
      this.warn(`Slow operation: ${label}`, { duration }, { ...context, duration });
    }
  }

  // Get recent errors for debugging
  getErrorBuffer() {
    return [...this.errorBuffer];
  }

  clearErrorBuffer() {
    this.errorBuffer = [];
  }
}

export const prodLogger = new ProductionLogger();

// Convenience exports
export const logAuth = (message: string, data?: any) =>
  prodLogger.debug(message, data, { category: 'auth' });

export const logAPI = (message: string, data?: any) =>
  prodLogger.debug(message, data, { category: 'api' });

export const logPerformance = (message: string, data?: any) =>
  prodLogger.info(message, data, { category: 'performance' });

export const logSecurity = (message: string, data?: any) =>
  prodLogger.warn(message, data, { category: 'security' });

export const logError = (message: string, error?: any) =>
  prodLogger.error(message, error, { category: 'general' });
