/**
 * Application Configuration
 * 
 * Centralized configuration for environment variables.
 * All components should import from this file instead of directly accessing import.meta.env
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
} as const;

// MT5 Service Configuration
export const MT5_CONFIG = {
  serviceUrl: import.meta.env.VITE_MT5_SERVICE_URL || '',
  websocketUrl: import.meta.env.VITE_MT5_SERVICE_WS || '',
  enableWebsocket: import.meta.env.VITE_ENABLE_MT5_WEBSOCKET === 'true',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false', // Default true
  enableMT5Websocket: import.meta.env.VITE_ENABLE_MT5_WEBSOCKET === 'true', // Default false
  debug: import.meta.env.DEV,
} as const;

// Environment Info
export const ENV = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

/**
 * Validate that all required configuration is present
 * Throws an error if required values are missing
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!SUPABASE_CONFIG.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  if (!MT5_CONFIG.serviceUrl) {
    errors.push('VITE_MT5_SERVICE_URL is required for MT5 integration');
  }

  if (errors.length > 0) {
    throw new Error(
      `Missing required configuration:\n${errors.join('\n')}\n\nPlease check your .env file.`
    );
  }
}

// Validate on module load in production
if (ENV.isProd) {
  try {
    validateConfig();
  } catch (error) {
    console.error('Configuration validation failed:', error);
    // In production, we still throw to prevent running with invalid config
    throw error;
  }
}

// Export helper function for building MT5 API URLs
export function getMT5ApiUrl(path: string): string {
  const baseUrl = MT5_CONFIG.serviceUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Export helper function for building WebSocket URLs
export function getMT5WebSocketUrl(path: string = ''): string {
  if (!MT5_CONFIG.websocketUrl) {
    throw new Error('MT5 WebSocket URL not configured. Set VITE_MT5_SERVICE_WS in .env');
  }
  
  const baseUrl = MT5_CONFIG.websocketUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Export default configuration object
export default {
  supabase: SUPABASE_CONFIG,
  mt5: MT5_CONFIG,
  features: FEATURE_FLAGS,
  env: ENV,
  getMT5ApiUrl,
  getMT5WebSocketUrl,
  validateConfig,
} as const;
