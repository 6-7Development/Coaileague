/**
 * Automation Metrics Configuration - Universal & Dynamic
 * Eliminates hardcoded metrics collection and tracking settings
 */

export const automationMetricsConfig = {
  // Metrics Collection Settings
  collection: {
    enableMetricsCollection: process.env.VITE_METRICS_ENABLED === 'true' || true,
    enableDetailedTracking: process.env.VITE_METRICS_DETAILED === 'true' || true,
    samplingRate: parseFloat(process.env.VITE_METRICS_SAMPLING_RATE || '1.0'), // 0-1, 1.0 = 100%
  },

  // Processing Metrics
  processingMetrics: {
    trackScheduleGeneration: process.env.VITE_METRICS_SCHEDULE_GEN === 'true' || true,
    trackPayrollProcessing: process.env.VITE_METRICS_PAYROLL_PROC === 'true' || true,
    trackInvoiceGeneration: process.env.VITE_METRICS_INVOICE_GEN === 'true' || true,
    trackReportGeneration: process.env.VITE_METRICS_REPORT_GEN === 'true' || true,
  },

  // Health Check Metrics
  healthCheckMetrics: {
    trackDatabaseHealth: process.env.VITE_METRICS_DB_HEALTH === 'true' || true,
    trackApiHealth: process.env.VITE_METRICS_API_HEALTH === 'true' || true,
    trackWebSocketHealth: process.env.VITE_METRICS_WS_HEALTH === 'true' || true,
    trackObjectStorageHealth: process.env.VITE_METRICS_STORAGE_HEALTH === 'true' || true,
    healthCheckIntervalSeconds: parseInt(process.env.VITE_HEALTH_CHECK_INTERVAL || '60', 10),
  },

  // Duration Tracking (from billableHoursAggregator telemetry)
  durationTracking: {
    trackSchedulingDuration: process.env.VITE_METRICS_TRACK_SCHEDULING_DUR === 'true' || true,
    trackPayrollDuration: process.env.VITE_METRICS_TRACK_PAYROLL_DUR === 'true' || true,
    trackReportingDuration: process.env.VITE_METRICS_TRACK_REPORTING_DUR === 'true' || true,
    dutyAggregationIntervalMinutes: parseInt(process.env.VITE_DUTY_AGGREGATION_INTERVAL || '15', 10),
  },

  // Analytics Configuration
  analytics: {
    enableRealTimeAnalytics: process.env.VITE_ANALYTICS_REALTIME === 'true' || true,
    aggregationIntervalMinutes: parseInt(process.env.VITE_ANALYTICS_AGGREGATION_MINUTES || '5', 10),
    retentionDays: parseInt(process.env.VITE_ANALYTICS_RETENTION_DAYS || '365', 10),
  },

  // Performance Thresholds (for alerting)
  performanceThresholds: {
    scheduleGenerationMaxMs: parseInt(process.env.VITE_PERF_SCHEDULE_MAX_MS || '30000', 10),
    payrollProcessingMaxMs: parseInt(process.env.VITE_PERF_PAYROLL_MAX_MS || '60000', 10),
    invoiceGenerationMaxMs: parseInt(process.env.VITE_PERF_INVOICE_MAX_MS || '15000', 10),
    reportGenerationMaxMs: parseInt(process.env.VITE_PERF_REPORT_MAX_MS || '45000', 10),
  },

  // Workspace-Specific Metrics
  workspaceMetrics: {
    trackPerWorkspace: process.env.VITE_METRICS_PER_WORKSPACE === 'true' || true,
    enableComparativeAnalytics: process.env.VITE_METRICS_COMPARATIVE === 'true' || true,
  },

  // Alerting Configuration
  alerting: {
    enablePerformanceAlerts: process.env.VITE_ALERTS_PERFORMANCE === 'true' || true,
    enableHealthAlerts: process.env.VITE_ALERTS_HEALTH === 'true' || true,
    alertSeverityLevel: process.env.VITE_ALERT_SEVERITY || 'MEDIUM',
  },
};

export default automationMetricsConfig;
