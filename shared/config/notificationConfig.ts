/**
 * NOTIFICATION CONFIGURATION REGISTRY
 * ====================================
 * Centralized configuration for all notification categories, severities,
 * and display settings. Used by both frontend components and backend services.
 * 
 * NO HARDCODED VALUES - All notification styling comes from this registry.
 */

// ============================================================================
// SEVERITY CONFIGURATION
// ============================================================================

export const SEVERITY_CONFIG = {
  info: {
    iconName: "Info",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-900",
    label: "Info",
  },
  warning: {
    iconName: "AlertTriangle",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900",
    label: "Warning",
  },
  critical: {
    iconName: "AlertTriangle",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    border: "border-red-200 dark:border-red-900",
    label: "Critical",
  },
  success: {
    iconName: "Check",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    border: "border-green-200 dark:border-green-900",
    label: "Success",
  },
} as const;

export type SeverityType = keyof typeof SEVERITY_CONFIG;

// ============================================================================
// UPDATE CATEGORY CONFIGURATION
// ============================================================================

export const CATEGORY_CONFIG = {
  feature: {
    iconName: "Sparkles",
    color: "text-purple-500",
    label: "New Feature",
    priority: 1,
  },
  improvement: {
    iconName: "Check",
    color: "text-green-500",
    label: "Improvement",
    priority: 2,
  },
  fix: {
    iconName: "Wrench",
    color: "text-blue-500",
    label: "Fix",
    priority: 3,
  },
  bugfix: {
    iconName: "Wrench",
    color: "text-blue-500",
    label: "Bug Fix",
    priority: 3,
  },
  security: {
    iconName: "Shield",
    color: "text-red-500",
    label: "Security",
    priority: 0,
  },
  announcement: {
    iconName: "MessageSquare",
    color: "text-amber-500",
    label: "Announcement",
    priority: 1,
  },
  service: {
    iconName: "Server",
    color: "text-cyan-500",
    label: "Service Update",
    priority: 2,
  },
  bot_automation: {
    iconName: "Bot",
    color: "text-violet-500",
    label: "Bot Automation",
    priority: 4,
  },
  deprecation: {
    iconName: "AlertTriangle",
    color: "text-orange-500",
    label: "Deprecation",
    priority: 1,
  },
  hotpatch: {
    iconName: "Zap",
    color: "text-yellow-500",
    label: "Hotpatch",
    priority: 2,
  },
  integration: {
    iconName: "Globe",
    color: "text-teal-500",
    label: "Integration",
    priority: 3,
  },
  ui_update: {
    iconName: "Layout",
    color: "text-pink-500",
    label: "UI Update",
    priority: 4,
  },
  backend_update: {
    iconName: "Database",
    color: "text-slate-500",
    label: "Backend",
    priority: 4,
  },
  performance: {
    iconName: "TrendingUp",
    color: "text-emerald-500",
    label: "Performance",
    priority: 3,
  },
  documentation: {
    iconName: "FileText",
    color: "text-gray-500",
    label: "Documentation",
    priority: 5,
  },
  ai_brain: {
    iconName: "Bot",
    color: "text-violet-500",
    label: "AI Brain",
    priority: 2,
  },
  workflow: {
    iconName: "Settings",
    color: "text-indigo-500",
    label: "Workflow",
    priority: 3,
  },
  api_change: {
    iconName: "Code",
    color: "text-cyan-500",
    label: "API Change",
    priority: 2,
  },
  compliance: {
    iconName: "Shield",
    color: "text-emerald-500",
    label: "Compliance",
    priority: 1,
  },
  billing: {
    iconName: "CreditCard",
    color: "text-green-500",
    label: "Billing",
    priority: 2,
  },
} as const;

export type CategoryType = keyof typeof CATEGORY_CONFIG;

// ============================================================================
// NOTIFICATION TYPE CONFIGURATION
// ============================================================================

export const NOTIFICATION_TYPE_CONFIG = {
  shift_assigned: {
    iconName: "Calendar",
    color: "text-blue-500",
    label: "Shift Assigned",
  },
  shift_reminder: {
    iconName: "Clock",
    color: "text-amber-500",
    label: "Shift Reminder",
  },
  shift_change: {
    iconName: "RefreshCw",
    color: "text-orange-500",
    label: "Shift Changed",
  },
  shift_cancelled: {
    iconName: "XCircle",
    color: "text-red-500",
    label: "Shift Cancelled",
  },
  time_off_approved: {
    iconName: "CheckCircle",
    color: "text-green-500",
    label: "Time Off Approved",
  },
  time_off_rejected: {
    iconName: "XCircle",
    color: "text-red-500",
    label: "Time Off Rejected",
  },
  payroll_ready: {
    iconName: "DollarSign",
    color: "text-green-500",
    label: "Payroll Ready",
  },
  compliance_alert: {
    iconName: "AlertTriangle",
    color: "text-amber-500",
    label: "Compliance Alert",
  },
  system: {
    iconName: "Info",
    color: "text-blue-500",
    label: "System",
  },
  welcome: {
    iconName: "Sparkles",
    color: "text-purple-500",
    label: "Welcome",
  },
} as const;

export type NotificationTypeKey = keyof typeof NOTIFICATION_TYPE_CONFIG;

// ============================================================================
// MAINTENANCE ALERT CONFIGURATION
// ============================================================================

export const MAINTENANCE_ALERT_CONFIG = {
  scheduled: {
    iconName: "Clock",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    label: "Scheduled Maintenance",
  },
  in_progress: {
    iconName: "Settings",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    label: "In Progress",
  },
  completed: {
    iconName: "CheckCircle",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    label: "Completed",
  },
  emergency: {
    iconName: "AlertTriangle",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    label: "Emergency",
  },
} as const;

export type MaintenanceAlertType = keyof typeof MAINTENANCE_ALERT_CONFIG;

// ============================================================================
// UI COPY CONFIGURATION (no hardcoded strings)
// ============================================================================

export const NOTIFICATION_COPY = {
  popover: {
    title: "Notifications",
    clearAll: "Clear All",
    markAllRead: "Mark All as Read",
    emptyState: "All caught up!",
    emptyDescription: "No new notifications",
    viewAll: "View All",
  },
  tabs: {
    all: "All",
    updates: "Updates",
    alerts: "Alerts",
    system: "System",
  },
  actions: {
    dismiss: "Dismiss",
    acknowledge: "Acknowledge",
    snooze: "Snooze",
    viewDetails: "View Details",
  },
  timeAgo: {
    justNow: "Just now",
    minutesAgo: (n: number) => `${n} min${n === 1 ? '' : 's'} ago`,
    hoursAgo: (n: number) => `${n} hour${n === 1 ? '' : 's'} ago`,
    daysAgo: (n: number) => `${n} day${n === 1 ? '' : 's'} ago`,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSeverityConfig(severity: string) {
  return SEVERITY_CONFIG[severity as SeverityType] || SEVERITY_CONFIG.info;
}

export function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category as CategoryType] || CATEGORY_CONFIG.feature;
}

export function getNotificationTypeConfig(type: string) {
  return NOTIFICATION_TYPE_CONFIG[type as NotificationTypeKey] || NOTIFICATION_TYPE_CONFIG.system;
}

export function getMaintenanceAlertConfig(status: string) {
  return MAINTENANCE_ALERT_CONFIG[status as MaintenanceAlertType] || MAINTENANCE_ALERT_CONFIG.scheduled;
}

// Get all category options for dropdown/select UI
export function getCategoryOptions() {
  return Object.entries(CATEGORY_CONFIG)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([key, config]) => ({
      value: key,
      label: config.label,
      color: config.color,
    }));
}

// Get all severity options for dropdown/select UI
export function getSeverityOptions() {
  return Object.entries(SEVERITY_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    color: config.color,
  }));
}
