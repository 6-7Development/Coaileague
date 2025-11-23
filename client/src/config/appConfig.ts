/**
 * Master Application Configuration
 * Single source of truth for ALL app settings
 * Edit here to change behavior everywhere instantly
 */

export const APP_CONFIG = {
  // App Identity
  appName: "AutoForce™",
  appTagline: "Autonomous Workforce Management",
  version: "1.0.0",
  
  // UI Behavior
  ui: {
    defaultTheme: "light",
    animationDuration: 300,
    transitionDuration: 200,
    toastDuration: 3000,
    notificationDuration: 6000,
  },

  // Pagination & Lists
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
    pageSizeOptions: [5, 10, 20, 50, 100],
  },

  // Timeouts & Retries
  timing: {
    requestTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
  },

  // Workspace defaults
  workspace: {
    defaultTimezone: "UTC",
    defaultCurrency: "USD",
    defaultLanguage: "en",
  },

  // Security
  security: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    requireMfa: false,
    enableCors: true,
  },

  // Feature Toggles (moved to featureToggles.ts)
  // Messages (moved to messages.ts)
  // Defaults (moved to defaults.ts)
  // API Endpoints (moved to apiEndpoints.ts)
};

export function getAppConfig() {
  return APP_CONFIG;
}
