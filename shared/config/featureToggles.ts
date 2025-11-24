/**
 * Feature Toggles Configuration
 * Shared configuration for both client and server
 * Control what features are enabled/disabled without code changes
 */

export const featureToggles = {
  // AI Features
  ai: {
    autoScheduling: true,
    sentimentAnalysis: true,
    predictiveAnalytics: true,
    smartMatching: true,
    aiCopilot: true,
  },

  // Workspace Features
  workspace: {
    multiWorkspace: true,
    customBranding: false,
    advancedReporting: true,
    customFields: true,
    apiAccess: false,
  },

  // Core Features
  core: {
    scheduling: true,
    timeTracking: true,
    payroll: false,
    billing: true,
    invoicing: true,
    employees: true,
    clients: true,
    shifts: true,
  },

  // Communications
  communications: {
    emailNotifications: true,
    smsNotifications: true,
    inAppNotifications: true,
    chatSupport: true,
    webhooks: true,
  },

  // Analytics
  analytics: {
    basicReports: true,
    advancedAnalytics: true,
    customReports: true,
    dataExport: true,
    dashboards: true,
  },

  // Integrations
  integrations: {
    quickbooks: true,
    gusto: true,
    slack: false,
    zapier: false,
    stripe: true,
  },

  // Security
  security: {
    mfa: true,
    sso: false,
    apiKeys: false,
    auditLogs: true,
    dataEncryption: true,
  },

  // Development/Testing
  development: {
    debugMode: false,
    testDataGeneration: false,
    errorTracking: true,
    performanceMonitoring: true,
  },

  // Automation
  automation: {
    autoTicketCreation: true, // Auto-create support tickets for critical health check failures
  },

  // Phase 4: Advanced Automation & Compliance
  phase4: {
    disputeResolution: true,
    payrollDeductions: true,
    payrollGarnishments: true,
    realTimeShiftNotifications: true,
    customSchedulerTracking: true,
    aiDisputeAnalysis: true,
  },
};
