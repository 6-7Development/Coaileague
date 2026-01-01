/**
 * Pricing & Subscription Tiers Configuration
 * Maps tiers to features, pricing, and limits
 * 
 * NEW PRICING (Jan 2026):
 * - Starter: $499/month (15 employees included, +$15/employee overage)
 * - Professional: $1,499/month (50 employees included, +$12/employee overage) - MOST POPULAR
 * - Enterprise: Custom (150+ employees, starts at $3,500/month)
 */

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

export interface PricingTier {
  name: string;
  displayName: string;
  description: string;
  price: number | null;
  annualPrice?: number;
  annualMonthlyPrice?: number;
  currency: string;
  billingPeriod: string;
  includedEmployees: number;
  overagePrice: number;
  aiCreditsIncluded: number;
  savings: string;
  bestFor: string;
  popular?: boolean;
  features: string[];
  featureDescriptions: string[];
  limits: {
    employees: number | null;
    shifts: number | null;
    monthlyInvoices: number | null;
    storageGB: number;
    apiCalls: number | null;
  };
  supportLevel: 'email_72hr' | 'priority_24hr' | 'dedicated';
}

/**
 * PREMIUM VALUE-BASED PRICING
 * ==========================
 * Trinity AI is NOT commodity software - it's an autonomous AI workforce manager.
 * Pricing reflects the value: 30-40 hours/month saved, 2-5% profit margin improvement.
 */
export const PRICING_TIERS: Record<SubscriptionTier, PricingTier> = {
  free: {
    name: "Free Trial",
    displayName: "Free Trial",
    description: "14-day trial to experience Trinity AI automation",
    price: 0,
    currency: "USD",
    billingPeriod: "14 days",
    includedEmployees: 5,
    overagePrice: 0,
    aiCreditsIncluded: 500,
    savings: "",
    bestFor: "Testing Trinity AI capabilities",
    features: [
      "core.timeTracking",
      "core.scheduling",
      "core.employees",
      "analytics.basicReports",
      "ai.trinityAssistant",
    ],
    featureDescriptions: [
      "Up to 5 employees, 1 manager",
      "Basic scheduling automation",
      "Time tracking",
      "500 AI credits for trial",
      "Email support"
    ],
    limits: {
      employees: 5,
      shifts: 20,
      monthlyInvoices: 0,
      storageGB: 1,
      apiCalls: 500,
    },
    supportLevel: 'email_72hr',
  },

  starter: {
    name: "Starter",
    displayName: "Starter",
    description: "AI scheduling for small security companies",
    price: 499,
    annualPrice: 4990,
    annualMonthlyPrice: 416,
    currency: "USD",
    billingPeriod: "month",
    includedEmployees: 15,
    overagePrice: 15,
    aiCreditsIncluded: 2000,
    savings: "~$10K/year in admin time",
    bestFor: "5-25 employee security companies",
    features: [
      "core.timeTracking",
      "core.scheduling",
      "core.employees",
      "core.invoicing",
      "communications.emailNotifications",
      "communications.smsNotifications",
      "analytics.basicReports",
      "ai.trinityAssistant",
      "ai.autoScheduling",
      "compliance.basicAlerts",
    ],
    featureDescriptions: [
      "Up to 15 employees included",
      "+$15/employee after 15",
      "Trinity AI scheduling",
      "GPS time tracking",
      "Basic compliance alerts",
      "Mobile app for guards",
      "Email/SMS notifications",
      "2,000 AI credits/month",
      "Email support (72hr response)"
    ],
    limits: {
      employees: 15,
      shifts: 200,
      monthlyInvoices: 100,
      storageGB: 10,
      apiCalls: 5000,
    },
    supportLevel: 'email_72hr',
  },

  professional: {
    name: "Professional",
    displayName: "Professional",
    description: "Full automation for growing security companies",
    price: 1499,
    annualPrice: 14390,
    annualMonthlyPrice: 1199,
    currency: "USD",
    billingPeriod: "month",
    includedEmployees: 50,
    overagePrice: 12,
    aiCreditsIncluded: 10000,
    savings: "~$35K/year in admin time",
    bestFor: "25-150 employee companies ready to scale",
    popular: true,
    features: [
      "core.timeTracking",
      "core.scheduling",
      "core.employees",
      "core.invoicing",
      "core.payroll",
      "core.billing",
      "communications.emailNotifications",
      "communications.smsNotifications",
      "communications.chatSupport",
      "analytics.basicReports",
      "analytics.advancedAnalytics",
      "ai.trinityAssistant",
      "ai.autoScheduling",
      "ai.smartMatching",
      "ai.payrollAutomation",
      "ai.profitOptimization",
      "integrations.quickbooks",
      "compliance.fiftyState",
      "compliance.soxAuditTrails",
    ],
    featureDescriptions: [
      "Up to 50 employees included",
      "+$12/employee after 50",
      "FULL Trinity AI automation",
      "Profit-first scheduling optimization",
      "Automated payroll processing",
      "Client billing automation",
      "QuickBooks integration",
      "Advanced compliance (SOX audit trails)",
      "Incident management",
      "Strategic business insights",
      "10,000 AI credits/month",
      "Priority support (24hr response)"
    ],
    limits: {
      employees: 50,
      shifts: 1000,
      monthlyInvoices: 500,
      storageGB: 50,
      apiCalls: 50000,
    },
    supportLevel: 'priority_24hr',
  },

  enterprise: {
    name: "Enterprise",
    displayName: "Enterprise",
    description: "Custom solutions for large security companies",
    price: null,
    currency: "USD",
    billingPeriod: "month",
    includedEmployees: 150,
    overagePrice: 0,
    aiCreditsIncluded: -1,
    savings: "~$250K+/year in admin time",
    bestFor: "Large security firms (150+ guards)",
    features: [
      "core.timeTracking",
      "core.scheduling",
      "core.employees",
      "core.invoicing",
      "core.payroll",
      "core.billing",
      "core.clients",
      "communications.emailNotifications",
      "communications.smsNotifications",
      "communications.inAppNotifications",
      "communications.chatSupport",
      "communications.webhooks",
      "analytics.basicReports",
      "analytics.advancedAnalytics",
      "analytics.customReports",
      "analytics.dataExport",
      "analytics.dashboards",
      "ai.autoScheduling",
      "ai.sentimentAnalysis",
      "ai.predictiveAnalytics",
      "ai.smartMatching",
      "ai.aiCopilot",
      "ai.profitOptimization",
      "integrations.quickbooks",
      "integrations.gusto",
      "integrations.adp",
      "integrations.workday",
      "integrations.stripe",
      "security.mfa",
      "security.sso",
      "security.apiKeys",
      "security.auditLogs",
      "workspace.multiWorkspace",
      "workspace.customBranding",
      "workspace.advancedReporting",
      "workspace.customFields",
      "workspace.whiteLabel",
    ],
    featureDescriptions: [
      "150+ employees",
      "Multi-location management",
      "Strategic profit optimization",
      "Custom integrations (ADP, Workday, etc.)",
      "White-label options",
      "API access",
      "Dedicated account manager",
      "Custom SLAs",
      "Unlimited AI credits",
      "On-demand support"
    ],
    limits: {
      employees: null,
      shifts: null,
      monthlyInvoices: null,
      storageGB: 1000,
      apiCalls: null,
    },
    supportLevel: 'dedicated',
  },
};

/**
 * Add-on modules for additional revenue
 */
export const ADDON_MODULES = [
  {
    id: 'analytics',
    name: 'Advanced Analytics Dashboard',
    price: 99,
    description: 'Deep insights, custom reports, and AI-powered business intelligence',
  },
  {
    id: 'multilocation',
    name: 'Multi-Location Management',
    price: 199,
    description: 'Manage multiple sites with centralized control and reporting',
  },
  {
    id: 'integration',
    name: 'Custom Integration',
    price: 299,
    description: 'Connect to any third-party system with dedicated integration support',
  },
];

/**
 * Implementation/Onboarding fee
 */
export const IMPLEMENTATION_FEE = {
  price: 2500,
  name: 'Professional Onboarding',
  includes: [
    'QuickBooks migration & testing',
    'Employee data import & validation',
    'Custom Trinity configuration',
    'Training session for your team',
    '30-day success check-ins',
  ],
};

/**
 * Get pricing tier by name
 */
export function getPricingTier(tier: SubscriptionTier) {
  return PRICING_TIERS[tier];
}

/**
 * Get features for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): string[] {
  const tierConfig = PRICING_TIERS[tier];
  return tierConfig?.features || [];
}

/**
 * Check if feature is in a tier
 */
export function isFeatureInTier(featurePath: string, tier: SubscriptionTier): boolean {
  const features = getTierFeatures(tier);
  return features.includes(featurePath);
}

/**
 * Get all tiers
 */
export function getAllTiers(): SubscriptionTier[] {
  return Object.keys(PRICING_TIERS) as SubscriptionTier[];
}

/**
 * Get tier limit value
 */
export function getTierLimit(tier: SubscriptionTier, limit: keyof PricingTier["limits"]) {
  return PRICING_TIERS[tier].limits[limit];
}

/**
 * Check if user has reached tier limit
 */
export function hasReachedLimit(tier: SubscriptionTier, limitName: keyof PricingTier["limits"], currentValue: number): boolean {
  const limit = getTierLimit(tier, limitName);
  if (limit === null) return false;
  return currentValue >= limit;
}

/**
 * Get price formatted as string
 */
export function formatPrice(tier: SubscriptionTier, annual: boolean = false): string {
  const tierConfig = PRICING_TIERS[tier];
  if (!tierConfig) return "";
  
  if (tierConfig.price === null) return "Custom";
  
  const price = annual && tierConfig.annualMonthlyPrice ? tierConfig.annualMonthlyPrice : tierConfig.price;
  return `$${price}`;
}

/**
 * Get monthly price from annual
 */
export function getMonthlyPrice(tier: SubscriptionTier, annual: boolean = false): number {
  const tierConfig = PRICING_TIERS[tier];
  if (!tierConfig) return 0;
  
  if (tierConfig.price === null) return 0;
  
  return annual && tierConfig.annualMonthlyPrice ? tierConfig.annualMonthlyPrice : tierConfig.price;
}

/**
 * Calculate overage cost for a given employee count
 */
export function calculateOverage(tier: SubscriptionTier, employeeCount: number): { overageEmployees: number; overageCharge: number } {
  const tierConfig = PRICING_TIERS[tier];
  if (!tierConfig) return { overageEmployees: 0, overageCharge: 0 };
  
  const overageEmployees = Math.max(0, employeeCount - tierConfig.includedEmployees);
  const overageCharge = overageEmployees * tierConfig.overagePrice;
  
  return { overageEmployees, overageCharge };
}

/**
 * Calculate total monthly cost including overage
 */
export function calculateTotalMonthly(tier: SubscriptionTier, employeeCount: number, annual: boolean = false): number {
  const tierConfig = PRICING_TIERS[tier];
  if (!tierConfig || tierConfig.price === null) return 0;
  
  const basePrice = annual && tierConfig.annualMonthlyPrice ? tierConfig.annualMonthlyPrice : tierConfig.price;
  const { overageCharge } = calculateOverage(tier, employeeCount);
  
  return basePrice + overageCharge;
}

/**
 * Get tier that includes all features
 */
export function getTierForFeatures(features: string[]): SubscriptionTier | null {
  for (const tier of getAllTiers()) {
    if (features.every((f) => isFeatureInTier(f, tier))) {
      return tier;
    }
  }
  return null;
}

/**
 * Calculate annual savings percentage
 */
export function getAnnualDiscount(tier: SubscriptionTier): number {
  const tierConfig = PRICING_TIERS[tier];
  if (!tierConfig || !tierConfig.price || !tierConfig.annualMonthlyPrice) return 0;
  
  return Math.round(((tierConfig.price - tierConfig.annualMonthlyPrice) / tierConfig.price) * 100);
}
