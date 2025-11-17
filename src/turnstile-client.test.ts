import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSiteKey,
  isTestSiteKey,
  getTurnstileToken,
  setupAutoRefresh,
  TURNSTILE_TEST_SITE_KEY,
  TURNSTILE_TEST_SECRET_KEY,
} from './turnstile-client';

describe('turnstile-client', () => {
  describe('isTestSiteKey', () => {
    it('should return true for test site key', () => {
      expect(isTestSiteKey('1x00000000000000000000AA')).toBe(true);
      expect(isTestSiteKey(TURNSTILE_TEST_SITE_KEY)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isTestSiteKey('')).toBe(true);
      expect(isTestSiteKey('   ')).toBe(true);
    });

    it('should return false for production keys', () => {
      expect(isTestSiteKey('0x4AAAAAAB2Tn5Qf6KFSt94L')).toBe(false);
      expect(isTestSiteKey('0x4AAAAAAB4V0l07Qx8HNYUX')).toBe(false);
    });
  });

  describe('getSiteKey', () => {
    it('should return test key when siteKey is undefined', () => {
      expect(getSiteKey(undefined)).toBe(TURNSTILE_TEST_SITE_KEY);
    });

    it('should return test key when siteKey is empty string', () => {
      expect(getSiteKey('')).toBe(TURNSTILE_TEST_SITE_KEY);
      expect(getSiteKey('   ')).toBe(TURNSTILE_TEST_SITE_KEY);
    });

    it('should return test key when forceTest is true', () => {
      expect(getSiteKey('0x4AAAAAAB2Tn5Qf6KFSt94L', true)).toBe(TURNSTILE_TEST_SITE_KEY);
    });

    it('should return provided key when valid and forceTest is false', () => {
      const prodKey = '0x4AAAAAAB2Tn5Qf6KFSt94L';
      expect(getSiteKey(prodKey)).toBe(prodKey);
      expect(getSiteKey(prodKey, false)).toBe(prodKey);
    });

    it('should handle null values', () => {
      expect(getSiteKey(null as any)).toBe(TURNSTILE_TEST_SITE_KEY);
    });
  });

  describe('getTurnstileToken', () => {
    it('should extract token from form input', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.name = 'cf-turnstile-response';
      input.value = 'test-token-123';
      form.appendChild(input);

      expect(getTurnstileToken(form)).toBe('test-token-123');
    });

    it('should return null when token input does not exist', () => {
      const form = document.createElement('form');
      expect(getTurnstileToken(form)).toBe(null);
    });

    it('should return null when token input has no value', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.name = 'cf-turnstile-response';
      input.value = '';
      form.appendChild(input);

      expect(getTurnstileToken(form)).toBe(null);
    });
  });

  describe('setupAutoRefresh', () => {
    let mockWidget: HTMLElement;
    let mockTurnstile: any;
    let originalWindow: any;

    beforeEach(() => {
      // Create mock widget
      mockWidget = document.createElement('div');
      mockWidget.className = 'cf-turnstile';
      document.body.appendChild(mockWidget);

      // Mock window.turnstile
      mockTurnstile = {
        reset: vi.fn(),
      };
      originalWindow = (global as any).window;
      (global as any).window = {
        ...originalWindow,
        turnstile: mockTurnstile,
        setInterval: vi.fn((fn, delay) => {
          return setInterval(fn, delay);
        }),
        clearInterval: vi.fn((id) => clearInterval(id)),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    });

    afterEach(() => {
      document.body.removeChild(mockWidget);
      vi.clearAllTimers();
      vi.useRealTimers();
      (global as any).window = originalWindow;
    });

    it('should return cleanup function', () => {
      vi.useFakeTimers();
      const cleanup = setupAutoRefresh(mockWidget);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should not setup refresh if widget is null', () => {
      const cleanup = setupAutoRefresh(null as any);
      expect((global as any).window.setInterval).not.toHaveBeenCalled();
      cleanup();
    });

    it('should not setup refresh if turnstile is not available', () => {
      (global as any).window.turnstile = undefined;
      const cleanup = setupAutoRefresh(mockWidget);
      expect((global as any).window.setInterval).not.toHaveBeenCalled();
      cleanup();
    });

    it('should wait for widget initialization before setting up refresh', () => {
      vi.useFakeTimers();
      const cleanup = setupAutoRefresh(mockWidget, { refreshInterval: 1000 });

      // Initially, widget has no data-widget-id
      expect(mockWidget.getAttribute('data-widget-id')).toBeNull();

      // setInterval should not be called yet
      expect((global as any).window.setInterval).not.toHaveBeenCalled();

      // Simulate widget initialization
      mockWidget.setAttribute('data-widget-id', 'widget-123');

      // Fast-forward to trigger the check interval
      vi.advanceTimersByTime(100);

      // Now setInterval should be called for the refresh
      expect((global as any).window.setInterval).toHaveBeenCalled();

      cleanup();
    });

    it('should call turnstile.reset when refresh interval fires', () => {
      vi.useFakeTimers();
      mockWidget.setAttribute('data-widget-id', 'widget-123');

      const cleanup = setupAutoRefresh(mockWidget, { refreshInterval: 1000 });

      // Fast-forward past initialization check
      vi.advanceTimersByTime(100);

      // Fast-forward past the refresh interval
      vi.advanceTimersByTime(1000);

      // turnstile.reset should have been called
      expect(mockTurnstile.reset).toHaveBeenCalledWith('widget-123');

      cleanup();
    });

    it('should call onRefresh callback when provided', () => {
      vi.useFakeTimers();
      mockWidget.setAttribute('data-widget-id', 'widget-123');
      const onRefresh = vi.fn();

      const cleanup = setupAutoRefresh(mockWidget, {
        refreshInterval: 1000,
        onRefresh,
      });

      vi.advanceTimersByTime(100); // Past initialization
      vi.advanceTimersByTime(1000); // Past refresh interval

      expect(onRefresh).toHaveBeenCalled();

      cleanup();
    });

    it('should call onError callback when reset fails', () => {
      vi.useFakeTimers();
      mockWidget.setAttribute('data-widget-id', 'widget-123');
      const onError = vi.fn();
      const error = new Error('Reset failed');
      mockTurnstile.reset.mockImplementation(() => {
        throw error;
      });

      const cleanup = setupAutoRefresh(mockWidget, {
        refreshInterval: 1000,
        onError,
      });

      vi.advanceTimersByTime(100); // Past initialization
      vi.advanceTimersByTime(1000); // Past refresh interval

      expect(onError).toHaveBeenCalledWith(error);

      cleanup();
    });

    it('should cleanup intervals on page unload', () => {
      vi.useFakeTimers();
      mockWidget.setAttribute('data-widget-id', 'widget-123');

      const cleanup = setupAutoRefresh(mockWidget, { refreshInterval: 1000 });
      vi.advanceTimersByTime(100);

      // Get the beforeunload handler
      const addEventListenerCalls = (global as any).window.addEventListener.mock.calls;
      const beforeunloadHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === 'beforeunload'
      )?.[1];

      expect(beforeunloadHandler).toBeDefined();

      // Call the cleanup
      cleanup();

      // Verify clearInterval was called
      expect((global as any).window.clearInterval).toHaveBeenCalled();
    });

    it('should handle turnstile loading after DOMContentLoaded', () => {
      vi.useFakeTimers();
      (global as any).window.turnstile = undefined;

      const cleanup = setupAutoRefresh(mockWidget);

      // Simulate turnstile loading
      (global as any).window.turnstile = mockTurnstile;
      mockWidget.setAttribute('data-widget-id', 'widget-123');

      // Fast-forward to trigger script check
      vi.advanceTimersByTime(100);

      // Should now set up refresh
      expect((global as any).window.setInterval).toHaveBeenCalled();

      cleanup();
    });

    it('should stop checking for widget after timeout', () => {
      vi.useFakeTimers();
      const cleanup = setupAutoRefresh(mockWidget);

      // Fast-forward past the 10 second timeout
      vi.advanceTimersByTime(10000);

      // clearInterval should have been called to stop checking
      expect((global as any).window.clearInterval).toHaveBeenCalled();

      cleanup();
    });

    it('should use default refresh interval when not provided', () => {
      vi.useFakeTimers();
      mockWidget.setAttribute('data-widget-id', 'widget-123');

      const cleanup = setupAutoRefresh(mockWidget);
      vi.advanceTimersByTime(100);

      // Check that setInterval was called with default 120000ms
      const setIntervalCalls = (global as any).window.setInterval.mock.calls;
      const refreshCall = setIntervalCalls.find((call: any[]) => call[1] === 120000);
      expect(refreshCall).toBeDefined();

      cleanup();
    });

    it('should handle multiple refresh cycles', () => {
      vi.useFakeTimers();
      mockWidget.setAttribute('data-widget-id', 'widget-123');

      const cleanup = setupAutoRefresh(mockWidget, { refreshInterval: 1000 });
      vi.advanceTimersByTime(100);

      // First refresh
      vi.advanceTimersByTime(1000);
      expect(mockTurnstile.reset).toHaveBeenCalledTimes(1);

      // Second refresh
      vi.advanceTimersByTime(1000);
      expect(mockTurnstile.reset).toHaveBeenCalledTimes(2);

      // Third refresh
      vi.advanceTimersByTime(1000);
      expect(mockTurnstile.reset).toHaveBeenCalledTimes(3);

      cleanup();
    });

    it('should not setup refresh if cleanup is called before initialization', () => {
      vi.useFakeTimers();
      const cleanup = setupAutoRefresh(mockWidget);
      
      // Cleanup immediately
      cleanup();

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      // Should not have called setInterval
      expect((global as any).window.setInterval).not.toHaveBeenCalled();
    });

    it('should handle widget being removed from DOM', () => {
      vi.useFakeTimers();
      mockWidget.setAttribute('data-widget-id', 'widget-123');

      const cleanup = setupAutoRefresh(mockWidget, { refreshInterval: 1000 });
      vi.advanceTimersByTime(100);

      // Remove widget from DOM
      document.body.removeChild(mockWidget);

      // Should still work (widget element still exists in memory)
      vi.advanceTimersByTime(1000);
      expect(mockTurnstile.reset).toHaveBeenCalled();

      cleanup();
    });
  });

  describe('constants', () => {
    it('should have correct test keys', () => {
      expect(TURNSTILE_TEST_SITE_KEY).toBe('1x00000000000000000000AA');
      expect(TURNSTILE_TEST_SECRET_KEY).toBe('1x0000000000000000000000000000000AA');
    });
  });
});
