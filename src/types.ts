/**
 * Cloudflare Turnstile widget theme
 */
export type TurnstileTheme = 'light' | 'dark' | 'auto';

/**
 * Cloudflare Turnstile widget size
 */
export type TurnstileSize = 'normal' | 'compact';

/**
 * Props for the TurnstileWidget Astro component
 */
export interface TurnstileWidgetProps {
  /** Cloudflare Turnstile site key (required) */
  siteKey: string;
  /** Custom ID for the widget container (optional) */
  containerId?: string;
  /** Widget theme (default: 'auto') */
  theme?: TurnstileTheme;
  /** Widget size (default: 'normal') */
  size?: TurnstileSize;
  /** Refresh interval in milliseconds (default: 120000 = 2 minutes) */
  refreshInterval?: number;
}

/**
 * Options for auto-refresh functionality
 */
export interface AutoRefreshOptions {
  /** Refresh interval in milliseconds (default: 120000 = 2 minutes) */
  refreshInterval?: number;
  /** Callback function called when widget is refreshed */
  onRefresh?: () => void;
  /** Callback function called if refresh fails */
  onError?: (error: Error) => void;
}

/**
 * Result of Turnstile token verification
 */
export interface VerificationResult {
  /** Whether verification was successful */
  success: boolean;
  /** Error message if verification failed */
  error?: string;
}

/**
 * Cloudflare Turnstile API methods
 */
export interface TurnstileAPI {
  /**
   * Render a Turnstile widget
   * @param container - Container element or selector
   * @param params - Widget parameters
   * @returns Widget ID
   */
  render(container: string | HTMLElement, params: TurnstileRenderParams): string;
  
  /**
   * Reset a Turnstile widget
   * @param widgetId - Widget ID returned from render()
   */
  reset(widgetId: string): void;
  
  /**
   * Remove a Turnstile widget
   * @param widgetId - Widget ID returned from render()
   */
  remove(widgetId: string): void;
  
  /**
   * Get the response token for a widget
   * @param widgetId - Widget ID returned from render()
   * @returns Response token or empty string
   */
  getResponse(widgetId: string): string;
  
  /**
   * Check if a widget is expired
   * @param widgetId - Widget ID returned from render()
   * @returns Whether the widget is expired
   */
  isExpired(widgetId: string): boolean;
}

/**
 * Parameters for rendering a Turnstile widget
 */
export interface TurnstileRenderParams {
  /** Site key */
  sitekey: string;
  /** Callback function called when challenge succeeds */
  callback?: (token: string) => void;
  /** Callback function called when challenge expires */
  'expired-callback'?: () => void;
  /** Callback function called when challenge errors */
  'error-callback'?: (error: string) => void;
  /** Widget theme */
  theme?: TurnstileTheme;
  /** Widget size */
  size?: TurnstileSize;
  /** Language code */
  language?: string;
  /** Tab index */
  tabindex?: number;
  /** Appearance mode */
  appearance?: 'always' | 'execute' | 'interaction-only';
  /** Execution mode */
  execution?: 'render' | 'execute';
}

/**
 * Global window interface augmentation for Turnstile
 */
declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

