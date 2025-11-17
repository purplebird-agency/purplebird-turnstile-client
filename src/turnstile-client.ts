import type { AutoRefreshOptions } from './types';

/**
 * Cloudflare Turnstile test site key for development
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/**
 * Cloudflare Turnstile test secret key for development
 */
export const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

/**
 * Default refresh interval (2 minutes in milliseconds)
 */
const DEFAULT_REFRESH_INTERVAL = 120000;

/**
 * Timeout for widget initialization check (10 seconds)
 */
const WIDGET_INIT_TIMEOUT = 10000;

/**
 * Interval for checking widget initialization (100ms)
 */
const WIDGET_CHECK_INTERVAL = 100;

/**
 * Sets up automatic token refresh for a Cloudflare Turnstile widget.
 * The widget will be reset before the token expires to prevent expiration issues.
 * 
 * @param widget - The widget element (must have class 'cf-turnstile' or be the container)
 * @param options - Configuration options for auto-refresh
 * @returns Cleanup function to stop auto-refresh
 */
export function setupAutoRefresh(
  widget: HTMLElement,
  options: AutoRefreshOptions = {}
): () => void {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    onRefresh,
    onError,
  } = options;

  let turnstileResetInterval: number | null = null;
  let checkWidgetInterval: number | null = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    if (turnstileResetInterval !== null) {
      clearInterval(turnstileResetInterval);
      turnstileResetInterval = null;
    }

    if (checkWidgetInterval !== null) {
      clearInterval(checkWidgetInterval);
      checkWidgetInterval = null;
    }
  };

  const setupReset = () => {
    if (!widget || !window.turnstile) {
      return;
    }

    // Wait for widget to be initialized (check for widget ID)
    checkWidgetInterval = window.setInterval(() => {
      const widgetId = widget.getAttribute('data-widget-id');
      if (widgetId) {
        if (checkWidgetInterval !== null) {
          clearInterval(checkWidgetInterval);
          checkWidgetInterval = null;
        }

        // Reset every refreshInterval to stay ahead of 5-minute expiration
        turnstileResetInterval = window.setInterval(() => {
          try {
            window.turnstile!.reset(widgetId);
            onRefresh?.();
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.warn('Turnstile reset error:', err);
            onError?.(err);
          }
        }, refreshInterval);
      }
    }, WIDGET_CHECK_INTERVAL);

    // Stop checking after timeout (widget should be initialized by then)
    setTimeout(() => {
      if (checkWidgetInterval !== null) {
        clearInterval(checkWidgetInterval);
        checkWidgetInterval = null;
      }
    }, WIDGET_INIT_TIMEOUT);
  };

  // Clean up interval when page unloads
  window.addEventListener('beforeunload', cleanup);

  // Wait for Turnstile script to load
  if (window.turnstile) {
    setupReset();
  } else {
    // If script hasn't loaded yet, wait for it
    const loadHandler = () => {
      // Give Turnstile a moment to initialize
      setTimeout(setupReset, 500);
    };
    window.addEventListener('load', loadHandler);
    
    // Also check periodically in case load event already fired
    const checkScript = setInterval(() => {
      if (window.turnstile) {
        clearInterval(checkScript);
        setupReset();
      }
    }, 100);
    
    // Clean up check after 5 seconds
    setTimeout(() => {
      clearInterval(checkScript);
    }, 5000);
  }

  return cleanup;
}

/**
 * Gets the Turnstile token from a form element.
 * 
 * @param form - The form element containing the Turnstile widget
 * @returns The Turnstile token, or null if not found
 */
export function getTurnstileToken(form: HTMLFormElement): string | null {
  const turnstileInput = form.querySelector<HTMLInputElement>(
    'input[name="cf-turnstile-response"]'
  );
  return turnstileInput?.value || null;
}

/**
 * Checks if a site key is a test key (for development).
 * 
 * @param siteKey - The site key to check
 * @returns Whether the site key is a test key
 */
export function isTestSiteKey(siteKey: string): boolean {
  return siteKey === TURNSTILE_TEST_SITE_KEY || !siteKey || siteKey.trim() === '';
}

/**
 * Gets the appropriate site key, falling back to test key in development.
 * 
 * @param siteKey - The provided site key
 * @param forceTest - Force use of test key (for development)
 * @returns The site key to use
 */
export function getSiteKey(siteKey?: string, forceTest = false): string {
  if (forceTest || !siteKey || siteKey.trim() === '') {
    return TURNSTILE_TEST_SITE_KEY;
  }
  return siteKey;
}

