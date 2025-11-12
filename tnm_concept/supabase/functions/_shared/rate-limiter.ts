/**
 * Shared Rate Limiter for Edge Functions
 * Prevents API abuse with configurable limits per function
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'ai-chat-assistant': { windowMs: 60000, maxRequests: 20 },  // 20 per minute
  'market-insights-generator': { windowMs: 300000, maxRequests: 5 },  // 5 per 5 min
  'financial-data': { windowMs: 60000, maxRequests: 60 },  // 60 per minute
  'ai-risk-recommendations': { windowMs: 60000, maxRequests: 10 },  // 10 per minute
  'connect-mt4-account': { windowMs: 300000, maxRequests: 3 },  // 3 per 5 min
  'connect-mt5-account': { windowMs: 300000, maxRequests: 3 },  // 3 per 5 min
};

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfter?: number;
  limit?: number;
}

/**
 * Check if a user has exceeded rate limits for a function
 */
export async function checkRateLimit(
  userId: string,
  functionName: string,
  supabaseClient: any
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[functionName] || { windowMs: 60000, maxRequests: 30 };
  const windowStart = Date.now() - config.windowMs;

  try {
    // Count recent requests within the time window
    const { count, error } = await supabaseClient
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('function_name', functionName)
      .gte('timestamp', new Date(windowStart).toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if database check fails
      return { allowed: true };
    }

    const requestCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);

    if (requestCount >= config.maxRequests) {
      console.warn(`[RATE_LIMIT] User ${userId} exceeded limit for ${functionName}: ${requestCount}/${config.maxRequests}`);
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(config.windowMs / 1000),
        limit: config.maxRequests
      };
    }

    // Log this request
    await supabaseClient
      .from('api_rate_limits')
      .insert({
        user_id: userId,
        function_name: functionName,
        timestamp: new Date().toISOString()
      });

    return {
      allowed: true,
      remaining,
      limit: config.maxRequests
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open on error
    return { allowed: true };
  }
}

/**
 * Get rate limit info without incrementing counter
 */
export async function getRateLimitInfo(
  userId: string,
  functionName: string,
  supabaseClient: any
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[functionName] || { windowMs: 60000, maxRequests: 30 };
  const windowStart = Date.now() - config.windowMs;

  try {
    const { count } = await supabaseClient
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('function_name', functionName)
      .gte('timestamp', new Date(windowStart).toISOString());

    const requestCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);

    return {
      allowed: requestCount < config.maxRequests,
      remaining,
      limit: config.maxRequests,
      retryAfter: requestCount >= config.maxRequests ? Math.ceil(config.windowMs / 1000) : undefined
    };
  } catch (error) {
    console.error('Rate limit info error:', error);
    return { allowed: true };
  }
}

/**
 * Create standardized rate limit error response
 */
export function createRateLimitError(result: RateLimitResult, corsHeaders: any) {
  return new Response(
    JSON.stringify({
      error: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      errorType: 'RATE_LIMIT',
      retryAfter: result.retryAfter,
      limit: result.limit,
      remaining: 0
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + (result.retryAfter! * 1000)),
        'Retry-After': String(result.retryAfter)
      }
    }
  );
}
