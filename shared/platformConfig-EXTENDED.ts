/**
 * EXTENDED PLATFORM CONFIGURATION
 * ===============================
 * This is the TEMPLATE for what platformConfig.ts will look like after Phase 2
 * Copy this structure and integrate into the main platformConfig.ts
 * 
 * THIS REMOVES ALL HARDCODED VALUES FROM THE ENTIRE PLATFORM
 */

// ============================================================================
// PAGE LABELS & TITLES (for all 107 pages)
// ============================================================================
export const PAGE_LABELS = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Welcome to your workspace",
    description: "Real-time operational insights and key metrics"
  },
  employees: {
    title: "Employees",
    subtitle: "Manage your workforce",
    description: "View, add, and manage employee records"
  },
  schedule: {
    title: "Schedule",
    subtitle: "Workforce scheduling",
    description: "Create and manage employee schedules"
  },
  settings: {
    title: "Settings",
    subtitle: "Workspace settings",
    description: "Configure workspace preferences and defaults"
  },
  billing: {
    title: "Billing",
    subtitle: "Subscription & Billing",
    description: "Manage billing, invoices, and payment methods"
  },
  admin: {
    title: "Administration",
    subtitle: "Admin Panel",
    description: "System administration and management"
  },
  notFound: {
    title: "Page Not Found",
    subtitle: "404 Error",
    description: "The page you're looking for doesn't exist"
  },
  // Add entries for all 107 pages following this pattern
} as const;

// ============================================================================
// BUTTON LABELS (for all buttons across app)
// ============================================================================
export const BUTTON_LABELS = {
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  add: "Add",
  remove: "Remove",
  submit: "Submit",
  reset: "Reset",
  confirm: "Confirm",
  close: "Close",
  back: "Back",
  next: "Next",
  skip: "Skip",
  logout: "Sign Out",
  login: "Sign In",
  register: "Register",
  update: "Update",
  create: "Create",
  export: "Export",
  import: "Import",
  download: "Download",
  upload: "Upload",
  approve: "Approve",
  reject: "Reject",
  publish: "Publish",
  draft: "Draft",
  search: "Search",
  filter: "Filter",
  sort: "Sort",
  refresh: "Refresh",
  clear: "Clear",
  apply: "Apply",
  done: "Done",
} as const;

// ============================================================================
// ERROR MESSAGES (standardized across app)
// ============================================================================
export const ERROR_MESSAGES = {
  generic: "Something went wrong. Please try again.",
  network: "Network error. Please check your connection.",
  unauthorized: "You don't have permission to access this resource.",
  forbidden: "Access denied. Contact administrator.",
  notFound: "The requested resource was not found.",
  validation: "Please check your input and try again.",
  timeout: "Request timed out. Please try again.",
  server: "Server error occurred. Please try again later.",
  unknown: "An unexpected error occurred.",
  
  auth: {
    loginFailed: "Login failed. Please check your credentials.",
    logoutFailed: "Logout failed. Please try again.",
    sessionExpired: "Your session has expired. Please login again.",
    invalidCredentials: "Invalid email or password.",
    accountLocked: "Account is locked. Contact support.",
    emailNotVerified: "Please verify your email address.",
  },
  
  employee: {
    notFound: "Employee not found.",
    duplicateEmail: "Email already in use.",
    invalidData: "Invalid employee data.",
    cannotDelete: "Cannot delete employee with active shifts.",
  },
  
  schedule: {
    notFound: "Schedule not found.",
    conflict: "Schedule conflict detected.",
    pastDate: "Cannot create schedule for past dates.",
    invalidTimeRange: "Invalid time range.",
  },
  
  billing: {
    paymentFailed: "Payment failed. Please try again.",
    invalidCard: "Invalid card information.",
    cardDeclined: "Your card was declined.",
    insufficientFunds: "Insufficient funds.",
  },
} as const;

// ============================================================================
// SUCCESS MESSAGES (standardized across app)
// ============================================================================
export const SUCCESS_MESSAGES = {
  saved: "Changes saved successfully.",
  created: "Created successfully.",
  updated: "Updated successfully.",
  deleted: "Deleted successfully.",
  sent: "Sent successfully.",
  exported: "Exported successfully.",
  imported: "Imported successfully.",
  published: "Published successfully.",
  downloaded: "Downloaded successfully.",
  uploaded: "Uploaded successfully.",
  approved: "Approved successfully.",
  rejected: "Rejected successfully.",
  restored: "Restored successfully.",
} as const;

// ============================================================================
// FORM LABELS & PLACEHOLDERS
// ============================================================================
export const FORM_LABELS = {
  email: {
    label: "Email Address",
    placeholder: "Enter your email",
    hint: "We'll never share your email."
  },
  password: {
    label: "Password",
    placeholder: "Enter password",
    hint: "Minimum 8 characters"
  },
  firstName: {
    label: "First Name",
    placeholder: "John"
  },
  lastName: {
    label: "Last Name",
    placeholder: "Doe"
  },
  phone: {
    label: "Phone Number",
    placeholder: "(555) 123-4567"
  },
  company: {
    label: "Company Name",
    placeholder: "Acme Corp"
  },
  address: {
    label: "Street Address",
    placeholder: "123 Main Street"
  },
  city: {
    label: "City",
    placeholder: "New York"
  },
  state: {
    label: "State/Province",
    placeholder: "NY"
  },
  zipCode: {
    label: "ZIP/Postal Code",
    placeholder: "10001"
  },
  country: {
    label: "Country",
    placeholder: "United States"
  },
  // Add more form fields following this pattern
} as const;

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================
export const VALIDATION_MESSAGES = {
  required: "This field is required.",
  email: "Please enter a valid email address.",
  password: "Password must be at least 8 characters.",
  passwordConfirm: "Passwords do not match.",
  minLength: (min: number) => `Minimum ${min} characters required.`,
  maxLength: (max: number) => `Maximum ${max} characters allowed.`,
  pattern: "Invalid format.",
  number: "Please enter a valid number.",
  phone: "Please enter a valid phone number.",
  url: "Please enter a valid URL.",
  date: "Please enter a valid date.",
  dateRange: "End date must be after start date.",
  time: "Please enter a valid time.",
  noSpecialChars: "Special characters not allowed.",
} as const;

// ============================================================================
// STATUS LABELS & VARIANTS (badges, labels, etc)
// ============================================================================
export const STATUS_CONFIG = {
  active: {
    label: "Active",
    variant: "success" as const,
    color: "#10b981"
  },
  inactive: {
    label: "Inactive",
    variant: "secondary" as const,
    color: "#6b7280"
  },
  pending: {
    label: "Pending",
    variant: "warning" as const,
    color: "#f59e0b"
  },
  approved: {
    label: "Approved",
    variant: "success" as const,
    color: "#10b981"
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    color: "#ef4444"
  },
  draft: {
    label: "Draft",
    variant: "outline" as const,
    color: "#8b5cf6"
  },
  published: {
    label: "Published",
    variant: "success" as const,
    color: "#10b981"
  },
  archived: {
    label: "Archived",
    variant: "secondary" as const,
    color: "#6b7280"
  },
  error: {
    label: "Error",
    variant: "destructive" as const,
    color: "#ef4444"
  },
  warning: {
    label: "Warning",
    variant: "warning" as const,
    color: "#f59e0b"
  },
  info: {
    label: "Info",
    variant: "outline" as const,
    color: "#3b82f6"
  },
  success: {
    label: "Success",
    variant: "success" as const,
    color: "#10b981"
  },
} as const;

// ============================================================================
// CONFIRMATION DIALOGS
// ============================================================================
export const CONFIRMATIONS = {
  deleteItem: {
    title: "Delete Item?",
    description: "Are you sure you want to delete this item? This action cannot be undone.",
    confirmButton: "Delete",
    cancelButton: "Cancel"
  },
  leaveWithoutSaving: {
    title: "Unsaved Changes",
    description: "You have unsaved changes. Are you sure you want to leave?",
    confirmButton: "Leave",
    cancelButton: "Stay"
  },
  logout: {
    title: "Sign Out?",
    description: "Are you sure you want to sign out?",
    confirmButton: "Sign Out",
    cancelButton: "Cancel"
  },
} as const;

// ============================================================================
// EMPTY STATES
// ============================================================================
export const EMPTY_STATES = {
  noData: {
    title: "No data yet",
    description: "Nothing to display right now."
  },
  noEmployees: {
    title: "No employees",
    description: "Add your first employee to get started."
  },
  noSchedules: {
    title: "No schedules",
    description: "Create your first schedule."
  },
  noInvoices: {
    title: "No invoices",
    description: "Invoices will appear here."
  },
  searchNoResults: {
    title: "No results found",
    description: "Try adjusting your search terms."
  },
} as const;

// ============================================================================
// HELP TEXT & HINTS
// ============================================================================
export const HELP_TEXT = {
  dashboard: "View your workspace metrics and recent activity.",
  schedule: "Create and manage shifts for your employees.",
  employees: "Add, edit, and manage employee information.",
  billing: "View your subscription and billing information.",
  settings: "Configure workspace settings and preferences.",
} as const;

// ============================================================================
// NAVIGATION LABELS (updated from existing config)
// ============================================================================
export const NAV_LABELS = {
  main: {
    dashboard: "Dashboard",
    schedule: "Schedule",
    timeTracking: "Time Tracking",
    employees: "Employees",
    clients: "Clients",
    invoices: "Invoices",
    reports: "Reports",
    analytics: "Analytics",
  },
  admin: {
    settings: "Settings",
    billing: "Billing",
    workspace: "Workspace",
    users: "Users",
  },
  os: {
    communications: "Communications",
    scheduling: "Scheduling",
    analytics: "Analytics",
    budget: "Budget",
    training: "Training",
    integrations: "Integrations",
  },
} as const;

// ============================================================================
// COLOR & STYLING TOKENS (theme-agnostic)
// ============================================================================
export const COLOR_TOKENS = {
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  info: "var(--color-info)",
  neutral: "var(--color-neutral)",
} as const;

// ============================================================================
// EXPORT ALL LABELS FOR EASIER ACCESS
// ============================================================================
export const ALL_LABELS = {
  pages: PAGE_LABELS,
  buttons: BUTTON_LABELS,
  errors: ERROR_MESSAGES,
  success: SUCCESS_MESSAGES,
  forms: FORM_LABELS,
  validation: VALIDATION_MESSAGES,
  statuses: STATUS_CONFIG,
  confirmations: CONFIRMATIONS,
  emptyStates: EMPTY_STATES,
  helpText: HELP_TEXT,
  navigation: NAV_LABELS,
  colors: COLOR_TOKENS,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type PageLabel = keyof typeof PAGE_LABELS;
export type ButtonLabel = keyof typeof BUTTON_LABELS;
export type ErrorMessage = keyof typeof ERROR_MESSAGES;
export type SuccessMessage = keyof typeof SUCCESS_MESSAGES;
export type StatusKey = keyof typeof STATUS_CONFIG;
