/**
 * Error Sanitization Utility
 * Sanitizes error messages before sending to clients to prevent information disclosure
 */

/**
 * Sanitizes connection errors for MT4/MT5 to prevent leaking implementation details
 */
export function sanitizeConnectionError(error: any): string {
  const errorStr = String(error?.message || error || '').toLowerCase();
  
  // Map specific errors to generic messages
  if (errorStr.includes('invalid credentials') || 
      errorStr.includes('authentication failed') ||
      errorStr.includes('unauthorized') ||
      errorStr.includes('login') ||
      errorStr.includes('password')) {
    return 'Invalid trading account credentials. Please verify your login and password.';
  }
  
  if (errorStr.includes('server') || 
      errorStr.includes('not found') ||
      errorStr.includes('unknown server')) {
    return 'Unable to connect to trading server. Please verify the server address.';
  }
  
  if (errorStr.includes('timeout') || 
      errorStr.includes('network') ||
      errorStr.includes('connection') ||
      errorStr.includes('timed out')) {
    return 'Connection timeout. Please try again later.';
  }
  
  if (errorStr.includes('rate limit') || 
      errorStr.includes('quota') ||
      errorStr.includes('too many')) {
    return 'Service temporarily unavailable. Please try again in a few minutes.';
  }
  
  if (errorStr.includes('deploy') || 
      errorStr.includes('deployment')) {
    return 'Unable to establish connection. Please check your credentials and try again.';
  }
  
  // Default generic error - never reveal internal details
  return 'Unable to connect trading account. Please contact support if the issue persists.';
}

/**
 * Sanitizes general API errors
 */
export function sanitizeAPIError(error: any): string {
  const errorStr = String(error?.message || error || '').toLowerCase();
  
  if (errorStr.includes('api key') || errorStr.includes('apikey')) {
    return 'Service configuration error. Please contact support.';
  }
  
  if (errorStr.includes('unauthorized') || errorStr.includes('forbidden')) {
    return 'Access denied. Please check your permissions.';
  }
  
  if (errorStr.includes('not found')) {
    return 'Requested resource not found.';
  }
  
  return 'An error occurred. Please try again later.';
}
