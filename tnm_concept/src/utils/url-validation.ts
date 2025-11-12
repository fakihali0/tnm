/**
 * URL validation utilities for language switching
 */

export interface URLValidationResult {
  isValid: boolean;
  normalizedURL?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a URL for language switching operations
 */
export const validateURL = (url: string): URLValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let normalizedURL: string | undefined;

  try {
    if (!url || typeof url !== 'string') {
      errors.push('URL is required and must be a string');
      return { isValid: false, errors, warnings };
    }

    // Try to parse the URL
    const testURL = new URL(url, 'http://localhost');
    normalizedURL = `${testURL.pathname}${testURL.search}${testURL.hash}`;

    // Check for common issues
    if (url.includes('//')) {
      warnings.push('URL contains double slashes');
    }

    if (url.includes('%') && !isValidEncoding(url)) {
      warnings.push('URL contains potentially malformed encoding');
    }

    if (testURL.search.includes('&=') || testURL.search.includes('=&')) {
      warnings.push('URL contains empty query parameters');
    }

    return {
      isValid: errors.length === 0,
      normalizedURL,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors, warnings };
  }
};

/**
 * Checks if URL encoding is valid
 */
const isValidEncoding = (url: string): boolean => {
  try {
    decodeURIComponent(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Preserves scroll position during navigation
 */
export const preserveScrollPosition = (): (() => void) => {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  return () => {
    setTimeout(() => {
      window.scrollTo(scrollX, scrollY);
    }, 0);
  };
};

/**
 * Validates that a route exists (basic check)
 */
export const isValidRoute = (pathname: string): boolean => {
  // Remove language prefix for validation
  const cleanPath = pathname.replace(/^\/ar\//, '/').replace(/^\/ar$/, '/');
  
  // List of known valid routes (expand as needed)
  const validRoutes = [
    '/',
    '/contact',
    '/products',
    '/education',
    '/partners',
    '/get-funded',
    '/products/trading-instruments',
    '/products/platforms',
    '/products/account-types',
    '/products/payment-methods',
    '/products/trading-tools',
    '/education/blogs',
    '/education/webinars',
    '/education/resources',
    '/education/market-reports',
    '/legal/terms',
    '/legal/privacy',
    '/legal/cookies'
  ];
  
  return validRoutes.includes(cleanPath) || cleanPath.startsWith('/products/') || cleanPath.startsWith('/education/');
};