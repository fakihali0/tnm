import { describe, expect, it } from 'vitest';

import { getLocalizedPath } from './index';

describe('getLocalizedPath', () => {
  describe('basic functionality', () => {
    it('preserves hashes when switching to Arabic', () => {
      expect(getLocalizedPath('/products#accounts', 'ar')).toBe('/ar/products#accounts');
    });

    it('preserves query parameters when switching to Arabic', () => {
      expect(getLocalizedPath('/contact?subject=partnership', 'ar')).toBe('/ar/contact?subject=partnership');
    });

    it('keeps search and hash when removing the Arabic prefix', () => {
      expect(getLocalizedPath('/ar/products?type=all#overview', 'en')).toBe('/products?type=all#overview');
    });

    it('reuses the provided search and hash arguments', () => {
      expect(getLocalizedPath('/contact', 'ar', '?subject=partnership', '#contact-form')).toBe(
        '/ar/contact?subject=partnership#contact-form'
      );
    });

    it('normalizes search and hash without prefixes', () => {
      expect(getLocalizedPath('/contact', 'ar', 'subject=partnership', 'contact-form')).toBe(
        '/ar/contact?subject=partnership#contact-form'
      );
    });
  });

  describe('edge cases', () => {
    it('handles multiple query parameters', () => {
      expect(getLocalizedPath('/products?category=forex&type=major&sort=name', 'ar')).toBe(
        '/ar/products?category=forex&type=major&sort=name'
      );
    });

    it('handles encoded characters in URLs', () => {
      expect(getLocalizedPath('/search?q=hello%20world&tab=all', 'ar')).toBe(
        '/ar/search?q=hello%20world&tab=all'
      );
    });

    it('handles complex hash fragments', () => {
      expect(getLocalizedPath('/docs#section-1.2.3', 'ar')).toBe('/ar/docs#section-1.2.3');
    });

    it('handles both search and hash components', () => {
      expect(getLocalizedPath('/contact?subject=partnership&priority=high#contact-form', 'ar')).toBe(
        '/ar/contact?subject=partnership&priority=high#contact-form'
      );
    });

    it('handles empty query parameters', () => {
      expect(getLocalizedPath('/products?', 'ar')).toBe('/ar/products?');
    });

    it('handles empty hash', () => {
      expect(getLocalizedPath('/products#', 'ar')).toBe('/ar/products#');
    });

    it('handles root path with parameters', () => {
      expect(getLocalizedPath('/?welcome=true#hero', 'ar')).toBe('/ar?welcome=true#hero');
    });

    it('handles malformed URLs gracefully', () => {
      expect(getLocalizedPath('/products?invalid=&hash#', 'ar')).toBe('/ar/products?invalid=&hash#');
    });
  });

  describe('language switching scenarios', () => {
    it('switches from Arabic to English with complex URL', () => {
      expect(getLocalizedPath('/ar/products?category=forex&type=major&sort=name#overview', 'en')).toBe(
        '/products?category=forex&type=major&sort=name#overview'
      );
    });

    it('switches from English to Arabic with complex URL', () => {
      expect(getLocalizedPath('/contact?subject=partnership&priority=high#contact-form', 'ar')).toBe(
        '/ar/contact?subject=partnership&priority=high#contact-form'
      );
    });

    it('preserves exact query parameter order', () => {
      expect(getLocalizedPath('/products?z=last&a=first&m=middle', 'ar')).toBe(
        '/ar/products?z=last&a=first&m=middle'
      );
    });

    it('handles special characters in parameters', () => {
      expect(getLocalizedPath('/search?q=test+query&lang=en-US', 'ar')).toBe(
        '/ar/search?q=test+query&lang=en-US'
      );
    });
  });

  describe('overriding with explicit search and hash', () => {
    it('overrides existing search with explicit search parameter', () => {
      expect(getLocalizedPath('/contact?old=param', 'ar', '?new=param')).toBe(
        '/ar/contact?new=param'
      );
    });

    it('overrides existing hash with explicit hash parameter', () => {
      expect(getLocalizedPath('/contact#old-section', 'ar', undefined, '#new-section')).toBe(
        '/ar/contact#new-section'
      );
    });

    it('overrides both search and hash with explicit parameters', () => {
      expect(getLocalizedPath('/contact?old=param#old-section', 'ar', '?new=param', '#new-section')).toBe(
        '/ar/contact?new=param#new-section'
      );
    });
  });
});
