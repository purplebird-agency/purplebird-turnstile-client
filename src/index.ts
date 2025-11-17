// Export types
export type {
  TurnstileTheme,
  TurnstileSize,
  TurnstileWidgetProps,
  AutoRefreshOptions,
  VerificationResult,
  TurnstileAPI,
  TurnstileRenderParams,
} from './types';

// Export client-side utilities
export {
  setupAutoRefresh,
  getTurnstileToken,
  isTestSiteKey,
  getSiteKey,
  TURNSTILE_TEST_SITE_KEY,
  TURNSTILE_TEST_SECRET_KEY,
} from './turnstile-client';

// Note: TurnstileWidget.astro is exported as a component file
// and should be imported directly: import TurnstileWidget from '@purplebird/turnstile-client/TurnstileWidget.astro'

