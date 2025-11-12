export interface SecurityHeadersConfig {
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains: boolean;
    preload?: boolean;
  };
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
  };
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
  crossOriginEmbedderPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;
}

export const defaultSecurityHeaders: SecurityHeadersConfig = {
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        'https://s3.tradingview.com',
        'https://www.tradingview-widget.com'
      ],
      'style-src': [
        "'self'",
        'https://fonts.googleapis.com',
        "'sha256-PsZll6aHYAIASf03JEonE23Kv5v8ElkuGjBGBwZ929Q='",
        "'sha256-JyHF32z4Ou/Ujas95CX3WgBqlTt7Dxzo/fQG5/5oBo8='"
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:'
      ],
      'connect-src': [
        "'self'",
        'https://edzkorfdixvvvrkfzqzg.supabase.co',
        'https://s3.tradingview.com',
        'https://www.tradingview-widget.com',
        'wss:'
      ],
      'frame-src': [
        'https://www.tradingview-widget.com'
      ],
      'worker-src': [
        "'self'",
        'blob:'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    location: [],
    'payment-method': [],
    'usb': [],
    'midi': [],
    'sync-xhr': [],
    'picture-in-picture': []
  },
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'cross-origin'
};

export function generateSecurityHeaders(config: SecurityHeadersConfig = defaultSecurityHeaders): Record<string, string> {
  const headers: Record<string, string> = {};

  // Strict-Transport-Security
  if (config.strictTransportSecurity) {
    const { maxAge, includeSubDomains, preload } = config.strictTransportSecurity;
    let hsts = `max-age=${maxAge}`;
    if (includeSubDomains) hsts += '; includeSubDomains';
    if (preload) hsts += '; preload';
    headers['Strict-Transport-Security'] = hsts;
  }

  // Content-Security-Policy
  if (config.contentSecurityPolicy) {
    const csp = Object.entries(config.contentSecurityPolicy.directives)
      .map(([directive, values]) => {
        return values.length > 0 
          ? `${directive} ${values.join(' ')}`
          : directive;
      })
      .join('; ');
    headers['Content-Security-Policy'] = csp;
  }

  // Other security headers
  if (config.referrerPolicy) {
    headers['Referrer-Policy'] = config.referrerPolicy;
  }

  if (config.permissionsPolicy) {
    const permissions = Object.entries(config.permissionsPolicy)
      .map(([feature, allowlist]) => {
        return allowlist.length > 0
          ? `${feature}=(${allowlist.join(' ')})`
          : `${feature}=()`;
      })
      .join(', ');
    headers['Permissions-Policy'] = permissions;
  }

  if (config.crossOriginEmbedderPolicy) {
    headers['Cross-Origin-Embedder-Policy'] = config.crossOriginEmbedderPolicy;
  }

  if (config.crossOriginOpenerPolicy) {
    headers['Cross-Origin-Opener-Policy'] = config.crossOriginOpenerPolicy;
  }

  if (config.crossOriginResourcePolicy) {
    headers['Cross-Origin-Resource-Policy'] = config.crossOriginResourcePolicy;
  }

  // Standard security headers
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';
  headers['X-XSS-Protection'] = '1; mode=block';

  return headers;
}

// For Vite/development environment
export function addSecurityHeadersToVite() {
  if (import.meta.env.DEV) {
    // Add headers for development server
    const headers = generateSecurityHeaders();
    console.log('Security headers to configure:', headers);
    
    // Note: These would typically be configured in vite.config.ts
    // or deployment infrastructure
  }
}

// For production deployment (example for Vercel)
export const vercelHeaders = [
  {
    source: '/(.*)',
    headers: Object.entries(generateSecurityHeaders()).map(([key, value]) => ({
      key,
      value
    }))
  }
];

// For Netlify _headers file
export function generateNetlifyHeaders(): string {
  const headers = generateSecurityHeaders();
  return Object.entries(headers)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');
}

// For Apache .htaccess
export function generateApacheHeaders(): string {
  const headers = generateSecurityHeaders();
  return Object.entries(headers)
    .map(([key, value]) => `Header always set ${key} "${value}"`)
    .join('\n');
}

// For Nginx
export function generateNginxHeaders(): string {
  const headers = generateSecurityHeaders();
  return Object.entries(headers)
    .map(([key, value]) => `add_header ${key} "${value}" always;`)
    .join('\n');
}
