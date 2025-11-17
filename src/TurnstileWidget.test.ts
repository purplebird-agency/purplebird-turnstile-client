import { describe, it, expect } from 'vitest';

/**
 * Test suite for TurnstileWidget.astro component logic
 * Since Astro components can't be directly unit tested, we test the logic
 */

// Helper function that matches the component's siteKey normalization logic
function normalizeSiteKey(providedSiteKey: any): string {
  const normalizedKey = typeof providedSiteKey === 'string' ? providedSiteKey.trim() : '';
  const hasSiteKey = normalizedKey !== '' && normalizedKey !== 'undefined';
  return hasSiteKey ? normalizedKey : '1x00000000000000000000AA';
}

describe('TurnstileWidget logic', () => {
  describe('siteKey normalization', () => {
    it('should handle undefined siteKey', () => {
      expect(normalizeSiteKey(undefined)).toBe('1x00000000000000000000AA');
    });

    it('should handle null siteKey', () => {
      expect(normalizeSiteKey(null)).toBe('1x00000000000000000000AA');
    });

    it('should handle empty string siteKey', () => {
      expect(normalizeSiteKey('')).toBe('1x00000000000000000000AA');
    });

    it('should handle whitespace-only siteKey', () => {
      expect(normalizeSiteKey('   ')).toBe('1x00000000000000000000AA');
      expect(normalizeSiteKey('\t\n')).toBe('1x00000000000000000000AA');
    });

    it('should handle string "undefined"', () => {
      expect(normalizeSiteKey('undefined')).toBe('1x00000000000000000000AA');
      expect(normalizeSiteKey('  undefined  ')).toBe('1x00000000000000000000AA');
    });

    it('should use provided valid siteKey', () => {
      const prodKey = '0x4AAAAAAB2Tn5Qf6KFSt94L';
      expect(normalizeSiteKey(prodKey)).toBe(prodKey);
    });

    it('should trim whitespace from valid siteKey', () => {
      const prodKey = '0x4AAAAAAB2Tn5Qf6KFSt94L';
      expect(normalizeSiteKey(`  ${prodKey}  `)).toBe(prodKey);
      expect(normalizeSiteKey(`\t${prodKey}\n`)).toBe(prodKey);
    });

    it('should use test key when provided test key', () => {
      const testKey = '1x00000000000000000000AA';
      expect(normalizeSiteKey(testKey)).toBe(testKey);
    });

    it('should handle various falsy values', () => {
      expect(normalizeSiteKey(false)).toBe('1x00000000000000000000AA');
      expect(normalizeSiteKey(0)).toBe('1x00000000000000000000AA');
      expect(normalizeSiteKey(NaN)).toBe('1x00000000000000000000AA');
    });

    it('should preserve valid keys with special characters', () => {
      const keyWithSpecialChars = '0x4AAAAAAB2Tn5Qf6KFSt94L-test';
      expect(normalizeSiteKey(keyWithSpecialChars)).toBe(keyWithSpecialChars);
    });

    it('should handle very long keys', () => {
      const longKey = '0x' + 'A'.repeat(100);
      expect(normalizeSiteKey(longKey)).toBe(longKey);
    });

    it('should handle keys that look like test key but are different', () => {
      const similarKey = '1x00000000000000000000AB'; // Different last char
      expect(normalizeSiteKey(similarKey)).toBe(similarKey);
    });
  });

  describe('widget ID generation', () => {
    it('should generate unique widget IDs', () => {
      // Test that the ID generation logic works (component uses Math.random)
      const id1 = `turnstile-widget-${Math.random().toString(36).substring(2, 9)}`;
      const id2 = `turnstile-widget-${Math.random().toString(36).substring(2, 9)}`;
      
      expect(id1).toMatch(/^turnstile-widget-[a-z0-9]+$/);
      expect(id2).toMatch(/^turnstile-widget-[a-z0-9]+$/);
      // They should be different (very unlikely to be same)
      expect(id1).not.toBe(id2);
    });

    it('should use provided containerId when given', () => {
      // In component: const widgetId = containerId || `turnstile-widget-${...}`
      const containerId = 'custom-widget-id';
      const widgetId = containerId || `turnstile-widget-${Math.random().toString(36).substring(2, 9)}`;
      
      expect(widgetId).toBe('custom-widget-id');
    });
  });
});

