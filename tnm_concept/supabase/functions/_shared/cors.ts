/**
 * Secure CORS configuration for edge functions
 * Implements origin allowlist to prevent CSRF attacks
 */

const ALLOWED_ORIGINS = [
  'https://tradenmore.com',
  'https://www.tradenmore.com',
  'https://1b5d5c4f-1260-431d-b9ed-fedc311bbd61.lovableproject.com',
  'http://localhost:8080',
  'http://localhost:5173'
];

/**
 * Get CORS headers with secure origin validation
 * @param request - The incoming request to validate origin
 * @returns CORS headers object with validated origin
 */
export function getCorsHeaders(request?: Request): Record<string, string> {
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Default to primary domain
  
  if (request) {
    const origin = request.headers.get('origin') || '';
    
    // Check exact match first
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    } else {
      // Allow Lovable preview environments
      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        if (hostname.endsWith('.lovable.app') || hostname.endsWith('.lovableproject.com')) {
          allowedOrigin = origin;
        }
      } catch {
        // Invalid URL, use default
      }
    }
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Sanitize error messages for client responses
 * Prevents information leakage about internal systems
 * @param error - The error to sanitize
 * @returns Generic error message safe for client display
 */
export function sanitizeError(error: any): string {
  // Log full error server-side for debugging
  console.error('Internal error:', error);
  
  // Return generic message to client
  return 'An error occurred while processing your request. Please try again later.';
}
