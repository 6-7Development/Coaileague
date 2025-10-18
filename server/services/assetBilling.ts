/**
 * ASSETOS™ × BILLOS™ INTEGRATION
 * 
 * Automatic inclusion of Asset Usage Fees on client invoices.
 * Turns asset scheduling into an automated revenue stream.
 */

import { storage } from "../storage";

// ============================================================================
// ASSET USAGE BILLING
// ============================================================================

/**
 * Add asset usage charges to invoice
 */
export async function addAssetUsageToInvoice(
  invoiceId: string,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  addedItems: number;
  totalAssetRevenue: number;
}> {
  const invoice = await storage.getInvoice(invoiceId, workspaceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const clientId = invoice.clientId;

  // Get all unbilled asset usage logs for this client in the period
  const usageLogs = await storage.getAssetUsageLogsByClient(
    workspaceId,
    clientId,
    periodStart,
    periodEnd,
    'pending' // Only unbilled usage
  );

  let totalAssetRevenue = 0;
  let addedItems = 0;

  for (const log of usageLogs) {
    const asset = await storage.getAsset(log.assetId, workspaceId);
    if (!asset || !asset.isBillable) {
      continue;
    }

    const billableAmount = parseFloat(log.billableAmount?.toString() || '0');
    if (billableAmount === 0) {
      continue;
    }

    // Add line item to invoice
    await storage.createInvoiceLineItem({
      invoiceId,
      workspaceId,
      description: `${asset.assetName} - ${log.totalHours} hours @ $${asset.hourlyRate}/hr`,
      itemType: 'asset_usage',
      quantity: parseFloat(log.totalHours?.toString() || '0'),
      unitPrice: parseFloat(asset.hourlyRate?.toString() || '0'),
      amount: billableAmount,
      metadata: {
        assetId: asset.id,
        assetUsageLogId: log.id,
        assetScheduleId: log.assetScheduleId,
        usagePeriodStart: log.usagePeriodStart,
        usagePeriodEnd: log.usagePeriodEnd,
      },
    });

    // Mark usage log as invoiced
    await storage.updateAssetUsageLog(log.id, workspaceId, {
      billingStatus: 'invoiced',
      invoiceLineItemId: invoiceId, // Reference back
    });

    totalAssetRevenue += billableAmount;
    addedItems++;
  }

  // Update invoice totals
  const currentSubtotal = parseFloat(invoice.subtotal?.toString() || '0');
  const newSubtotal = currentSubtotal + totalAssetRevenue;
  
  // Recalculate tax and total
  const taxRate = parseFloat(invoice.taxRate?.toString() || '0');
  const taxAmount = (newSubtotal * taxRate) / 100;
  const total = newSubtotal + taxAmount;

  await storage.updateInvoice(invoiceId, workspaceId, {
    subtotal: newSubtotal.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
  });

  return {
    addedItems,
    totalAssetRevenue,
  };
}

/**
 * Generate automatic asset usage invoice for client
 */
export async function generateAssetUsageInvoice(
  clientId: string,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date,
  createdBy: string
): Promise<any> {
  const client = await storage.getClient(clientId, workspaceId);
  if (!client) {
    throw new Error('Client not found');
  }

  // Get unbilled asset usage
  const usageLogs = await storage.getAssetUsageLogsByClient(
    workspaceId,
    clientId,
    periodStart,
    periodEnd,
    'pending'
  );

  if (usageLogs.length === 0) {
    throw new Error('No unbilled asset usage found for this client');
  }

  // Calculate totals
  let subtotal = 0;
  const lineItems: any[] = [];

  for (const log of usageLogs) {
    const asset = await storage.getAsset(log.assetId, workspaceId);
    if (!asset || !asset.isBillable) {
      continue;
    }

    const billableAmount = parseFloat(log.billableAmount?.toString() || '0');
    if (billableAmount === 0) {
      continue;
    }

    lineItems.push({
      description: `${asset.assetName} - ${log.totalHours} hours`,
      itemType: 'asset_usage',
      quantity: parseFloat(log.totalHours?.toString() || '0'),
      unitPrice: parseFloat(asset.hourlyRate?.toString() || '0'),
      amount: billableAmount,
      assetUsageLogId: log.id,
    });

    subtotal += billableAmount;
  }

  if (lineItems.length === 0) {
    throw new Error('No billable asset usage found');
  }

  // Calculate tax
  const workspace = await storage.getWorkspace(workspaceId);
  const taxRate = parseFloat(workspace?.defaultTaxRate?.toString() || '0');
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(workspaceId);

  // Create invoice
  const invoice = await storage.createInvoice({
    workspaceId,
    clientId,
    invoiceNumber,
    invoiceType: 'asset_usage',
    status: 'draft',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    subtotal: subtotal.toFixed(2),
    taxRate: taxRate.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
    notes: `Asset usage charges for period ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
    createdBy,
  });

  // Add line items
  for (const item of lineItems) {
    await storage.createInvoiceLineItem({
      invoiceId: invoice.id,
      workspaceId,
      description: item.description,
      itemType: item.itemType,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      metadata: {
        assetUsageLogId: item.assetUsageLogId,
      },
    });

    // Mark usage log as invoiced
    await storage.updateAssetUsageLog(item.assetUsageLogId, workspaceId, {
      billingStatus: 'invoiced',
      invoiceLineItemId: invoice.id,
    });
  }

  return invoice;
}

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(workspaceId: string): Promise<string> {
  const workspace = await storage.getWorkspace(workspaceId);
  const prefix = workspace?.invoicePrefix || 'INV';
  
  const allInvoices = await storage.getInvoices(workspaceId);
  const maxNumber = allInvoices.reduce((max: number, inv: any) => {
    const num = parseInt(inv.invoiceNumber?.replace(/\D/g, '') || '0');
    return Math.max(max, num);
  }, 0);

  const nextNumber = maxNumber + 1;
  return `${prefix}-${String(nextNumber).padStart(6, '0')}`;
}

// ============================================================================
// COST CENTER TRACKING
// ============================================================================

/**
 * Assign cost center codes to asset usage for client accounting
 */
export async function assignCostCenter(
  usageLogId: string,
  workspaceId: string,
  costCenterCode: string
): Promise<void> {
  await storage.updateAssetUsageLog(usageLogId, workspaceId, {
    costCenterCode,
  });
}

/**
 * Get asset usage summary by cost center
 */
export async function getAssetUsageByCostCenter(
  clientId: string,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Array<{
  costCenter: string;
  totalHours: number;
  totalAmount: number;
  assetCount: number;
}>> {
  const usageLogs = await storage.getAssetUsageLogsByClient(
    workspaceId,
    clientId,
    periodStart,
    periodEnd
  );

  const costCenterMap = new Map<string, {
    totalHours: number;
    totalAmount: number;
    assets: Set<string>;
  }>();

  for (const log of usageLogs) {
    const costCenter = log.costCenterCode || 'UNASSIGNED';
    
    if (!costCenterMap.has(costCenter)) {
      costCenterMap.set(costCenter, {
        totalHours: 0,
        totalAmount: 0,
        assets: new Set(),
      });
    }

    const data = costCenterMap.get(costCenter)!;
    data.totalHours += parseFloat(log.totalHours?.toString() || '0');
    data.totalAmount += parseFloat(log.billableAmount?.toString() || '0');
    data.assets.add(log.assetId);
  }

  return Array.from(costCenterMap.entries()).map(([costCenter, data]) => ({
    costCenter,
    totalHours: data.totalHours,
    totalAmount: data.totalAmount,
    assetCount: data.assets.size,
  }));
}

// ============================================================================
// REVENUE TRACKING
// ============================================================================

/**
 * Get total asset revenue for period
 */
export async function getAssetRevenue(
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  totalRevenue: number;
  invoicedRevenue: number;
  pendingRevenue: number;
  assetBreakdown: Array<{
    assetId: string;
    assetName: string;
    revenue: number;
    hours: number;
  }>;
}> {
  const usageLogs = await storage.getAssetUsageLogsByDateRange(
    workspaceId,
    periodStart,
    periodEnd
  );

  let totalRevenue = 0;
  let invoicedRevenue = 0;
  let pendingRevenue = 0;

  const assetMap = new Map<string, { revenue: number; hours: number; name: string }>();

  for (const log of usageLogs) {
    const amount = parseFloat(log.billableAmount?.toString() || '0');
    totalRevenue += amount;

    if (log.billingStatus === 'invoiced' || log.billingStatus === 'paid') {
      invoicedRevenue += amount;
    } else {
      pendingRevenue += amount;
    }

    // Asset breakdown
    const asset = await storage.getAsset(log.assetId, workspaceId);
    if (asset) {
      if (!assetMap.has(log.assetId)) {
        assetMap.set(log.assetId, {
          revenue: 0,
          hours: 0,
          name: asset.assetName || 'Unknown',
        });
      }

      const data = assetMap.get(log.assetId)!;
      data.revenue += amount;
      data.hours += parseFloat(log.totalHours?.toString() || '0');
    }
  }

  const assetBreakdown = Array.from(assetMap.entries()).map(([assetId, data]) => ({
    assetId,
    assetName: data.name,
    revenue: data.revenue,
    hours: data.hours,
  }));

  return {
    totalRevenue,
    invoicedRevenue,
    pendingRevenue,
    assetBreakdown,
  };
}
