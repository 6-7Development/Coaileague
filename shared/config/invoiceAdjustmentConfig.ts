/**
 * Invoice Adjustment Configuration - Universal & Dynamic
 * Configuration for invoice credits, discounts, refunds, and adjustments
 */

export const invoiceAdjustmentConfig = {
  // Adjustment Types
  adjustmentTypes: {
    discount: {
      name: 'Discount',
      enabled: process.env.VITE_ADJUSTMENT_DISCOUNT_ENABLED === 'true' || true,
      maxPercentage: parseFloat(process.env.VITE_DISCOUNT_MAX_PERCENT || '50'),
      requiresApproval: process.env.VITE_DISCOUNT_REQUIRES_APPROVAL === 'true' || true,
      approverRole: process.env.VITE_DISCOUNT_APPROVER_ROLE || 'admin',
    },
    credit: {
      name: 'Credit',
      enabled: process.env.VITE_ADJUSTMENT_CREDIT_ENABLED === 'true' || true,
      maxAmount: parseFloat(process.env.VITE_CREDIT_MAX_AMOUNT || '999999.99'),
      requiresApproval: process.env.VITE_CREDIT_REQUIRES_APPROVAL === 'true' || true,
      approverRole: process.env.VITE_CREDIT_APPROVER_ROLE || 'admin',
    },
    refund: {
      name: 'Refund',
      enabled: process.env.VITE_ADJUSTMENT_REFUND_ENABLED === 'true' || true,
      maxPercentage: parseFloat(process.env.VITE_REFUND_MAX_PERCENT || '100'),
      requiresApproval: process.env.VITE_REFUND_REQUIRES_APPROVAL === 'true' || true,
      approverRole: process.env.VITE_REFUND_APPROVER_ROLE || 'admin',
      autoRefundToPaymentMethod: process.env.VITE_AUTO_REFUND_PAYMENT_METHOD === 'true' || false,
    },
    writeoff: {
      name: 'Write-Off',
      enabled: process.env.VITE_ADJUSTMENT_WRITEOFF_ENABLED === 'true' || false,
      maxPercentage: parseFloat(process.env.VITE_WRITEOFF_MAX_PERCENT || '10'),
      requiresApproval: process.env.VITE_WRITEOFF_REQUIRES_APPROVAL === 'true' || true,
      approverRole: process.env.VITE_WRITEOFF_APPROVER_ROLE || 'finance',
    },
    correction: {
      name: 'Correction',
      enabled: process.env.VITE_ADJUSTMENT_CORRECTION_ENABLED === 'true' || true,
      requiresApproval: process.env.VITE_CORRECTION_REQUIRES_APPROVAL === 'true' || false,
    },
  },

  // Approval Workflow
  approval: {
    multiLevelApproval: process.env.VITE_ADJUSTMENT_MULTI_LEVEL === 'true' || false,
    requiresAuditTrail: process.env.VITE_ADJUSTMENT_AUDIT_TRAIL === 'true' || true,
    approvalTimeoutDays: parseInt(process.env.VITE_ADJUSTMENT_APPROVAL_DAYS || '3', 10),
    notifyFinanceTeam: process.env.VITE_ADJUSTMENT_NOTIFY_FINANCE === 'true' || true,
    notifyClientOnCredit: process.env.VITE_ADJUSTMENT_NOTIFY_CLIENT === 'true' || true,
  },

  // Amount Validation
  validation: {
    minAdjustmentAmount: parseFloat(process.env.VITE_ADJUSTMENT_MIN_AMOUNT || '0.01'),
    maxAdjustmentAmount: parseFloat(process.env.VITE_ADJUSTMENT_MAX_AMOUNT || '999999.99'),
    preventNegativeInvoiceAmount: process.env.VITE_ADJUSTMENT_NO_NEGATIVE === 'true' || true,
    requireAdjustmentReason: process.env.VITE_ADJUSTMENT_REQUIRE_REASON === 'true' || true,
  },

  // Persistence & History
  persistence: {
    persistAdjustmentsToDatabase: process.env.VITE_ADJUSTMENT_PERSIST === 'true' || true,
    enableVersionHistory: process.env.VITE_ADJUSTMENT_VERSION_HISTORY === 'true' || true,
    retentionDays: parseInt(process.env.VITE_ADJUSTMENT_RETENTION_DAYS || '2555', 10), // 7 years
  },

  // Compliance & Reporting
  compliance: {
    treatAsRevenueAdjustment: process.env.VITE_ADJUSTMENT_REVENUE_IMPACT === 'true' || true,
    includeInFinancialReports: process.env.VITE_ADJUSTMENT_INCLUDE_REPORTS === 'true' || true,
    includeInAuditTrail: process.env.VITE_ADJUSTMENT_INCLUDE_AUDIT === 'true' || true,
    separateLineItem: process.env.VITE_ADJUSTMENT_SEPARATE_LINE === 'true' || true,
  },

  // Integration with Stripe
  stripeIntegration: {
    autoSyncToStripe: process.env.VITE_ADJUSTMENT_SYNC_STRIPE === 'true' || false,
    createCreditNotes: process.env.VITE_ADJUSTMENT_CREDIT_NOTES === 'true' || true,
    applyAutomatically: process.env.VITE_ADJUSTMENT_APPLY_AUTO === 'true' || false,
  },

  // Notification Configuration
  notifications: {
    notifyApproverOnSubmission: process.env.VITE_ADJUSTMENT_NOTIFY_APPROVER === 'true' || true,
    notifySubmitterOnApproval: process.env.VITE_ADJUSTMENT_NOTIFY_SUBMISSION === 'true' || true,
    notifySubmitterOnRejection: process.env.VITE_ADJUSTMENT_NOTIFY_REJECTION === 'true' || true,
    notifyClientEmail: process.env.VITE_ADJUSTMENT_NOTIFY_EMAIL || null,
  },
};

export default invoiceAdjustmentConfig;
