/**
 * QUICKBOOKS RECEIPT SERVICE - Commit Confirmation & Payload Tracking
 * ====================================================================
 * Generates receipts for Trinity's QuickBooks commits:
 * - Invoice syncs
 * - Payroll time activity syncs
 * - Customer/Vendor syncs
 * 
 * Provides:
 * - Unique receipt IDs
 * - Payload summaries
 * - QuickBooks external IDs
 * - Trinity verification signatures
 * - Audit trail for org owners
 */

import { db } from '../db';
import { platformEventBus } from './platformEventBus';

export interface QuickBooksReceipt {
  receiptId: string;
  workspaceId: string;
  syncType: 'invoice' | 'payroll' | 'customer' | 'vendor' | 'timeactivity';
  timestamp: Date;
  status: 'success' | 'partial' | 'failed';
  
  summary: {
    totalRecords: number;
    syncedRecords: number;
    failedRecords: number;
    totalValue?: number;
  };
  
  quickbooksDetails: {
    companyId?: string;
    externalIds: Array<{
      localId: string;
      quickbooksId: string;
      type: string;
    }>;
  };
  
  payload: {
    items: Array<{
      id: string;
      name: string;
      amount?: number;
      status: 'synced' | 'failed';
      error?: string;
      quickbooksId?: string;
    }>;
  };
  
  trinitySignature: string;
  viewInQuickBooksUrl?: string;
}

const receiptStore = new Map<string, QuickBooksReceipt>();

class QuickBooksReceiptService {
  private static instance: QuickBooksReceiptService;

  private constructor() {}

  static getInstance(): QuickBooksReceiptService {
    if (!this.instance) {
      this.instance = new QuickBooksReceiptService();
    }
    return this.instance;
  }

  generateReceiptId(): string {
    return `qb_rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSignature(receipt: Omit<QuickBooksReceipt, 'trinitySignature'>): string {
    const data = JSON.stringify({
      receiptId: receipt.receiptId,
      syncType: receipt.syncType,
      timestamp: receipt.timestamp.toISOString(),
      totalRecords: receipt.summary.totalRecords,
      syncedRecords: receipt.summary.syncedRecords,
    });
    
    return `trinity_qb_${Buffer.from(data).toString('base64').substring(0, 24)}`;
  }

  async createInvoiceReceipt(params: {
    workspaceId: string;
    invoices: Array<{
      id: string;
      clientName: string;
      amount: number;
      status: 'synced' | 'failed';
      quickbooksId?: string;
      error?: string;
    }>;
    quickbooksCompanyId?: string;
  }): Promise<QuickBooksReceipt> {
    const receiptId = this.generateReceiptId();
    const syncedInvoices = params.invoices.filter(i => i.status === 'synced');
    const failedInvoices = params.invoices.filter(i => i.status === 'failed');
    const totalValue = syncedInvoices.reduce((sum, i) => sum + i.amount, 0);

    const receipt: Omit<QuickBooksReceipt, 'trinitySignature'> = {
      receiptId,
      workspaceId: params.workspaceId,
      syncType: 'invoice',
      timestamp: new Date(),
      status: failedInvoices.length === 0 ? 'success' : (syncedInvoices.length > 0 ? 'partial' : 'failed'),
      summary: {
        totalRecords: params.invoices.length,
        syncedRecords: syncedInvoices.length,
        failedRecords: failedInvoices.length,
        totalValue,
      },
      quickbooksDetails: {
        companyId: params.quickbooksCompanyId,
        externalIds: syncedInvoices.map(i => ({
          localId: i.id,
          quickbooksId: i.quickbooksId || '',
          type: 'Invoice',
        })),
      },
      payload: {
        items: params.invoices.map(i => ({
          id: i.id,
          name: i.clientName,
          amount: i.amount,
          status: i.status,
          error: i.error,
          quickbooksId: i.quickbooksId,
        })),
      },
      viewInQuickBooksUrl: params.quickbooksCompanyId 
        ? `https://app.qbo.intuit.com/app/invoices?company=${params.quickbooksCompanyId}`
        : undefined,
    };

    const fullReceipt: QuickBooksReceipt = {
      ...receipt,
      trinitySignature: this.generateSignature(receipt),
    };

    receiptStore.set(receiptId, fullReceipt);

    await platformEventBus.publish({
      type: 'quickbooks_sync_receipt',
      category: 'integrations',
      title: 'QuickBooks Invoice Sync Complete',
      description: `Synced ${syncedInvoices.length}/${params.invoices.length} invoices ($${totalValue.toFixed(2)})`,
      workspaceId: params.workspaceId,
      metadata: {
        receiptId,
        syncType: 'invoice',
        status: fullReceipt.status,
        summary: fullReceipt.summary,
      },
    });

    return fullReceipt;
  }

  async createPayrollReceipt(params: {
    workspaceId: string;
    payrollRunId: string;
    entries: Array<{
      id: string;
      employeeName: string;
      hours: number;
      amount: number;
      status: 'synced' | 'failed';
      quickbooksId?: string;
      error?: string;
    }>;
    quickbooksCompanyId?: string;
  }): Promise<QuickBooksReceipt> {
    const receiptId = this.generateReceiptId();
    const syncedEntries = params.entries.filter(e => e.status === 'synced');
    const failedEntries = params.entries.filter(e => e.status === 'failed');
    const totalHours = syncedEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalValue = syncedEntries.reduce((sum, e) => sum + e.amount, 0);

    const receipt: Omit<QuickBooksReceipt, 'trinitySignature'> = {
      receiptId,
      workspaceId: params.workspaceId,
      syncType: 'timeactivity',
      timestamp: new Date(),
      status: failedEntries.length === 0 ? 'success' : (syncedEntries.length > 0 ? 'partial' : 'failed'),
      summary: {
        totalRecords: params.entries.length,
        syncedRecords: syncedEntries.length,
        failedRecords: failedEntries.length,
        totalValue,
      },
      quickbooksDetails: {
        companyId: params.quickbooksCompanyId,
        externalIds: syncedEntries.map(e => ({
          localId: e.id,
          quickbooksId: e.quickbooksId || '',
          type: 'TimeActivity',
        })),
      },
      payload: {
        items: params.entries.map(e => ({
          id: e.id,
          name: e.employeeName,
          amount: e.amount,
          status: e.status,
          error: e.error,
          quickbooksId: e.quickbooksId,
        })),
      },
      viewInQuickBooksUrl: params.quickbooksCompanyId 
        ? `https://app.qbo.intuit.com/app/timeactivity?company=${params.quickbooksCompanyId}`
        : undefined,
    };

    const fullReceipt: QuickBooksReceipt = {
      ...receipt,
      trinitySignature: this.generateSignature(receipt),
    };

    receiptStore.set(receiptId, fullReceipt);

    await platformEventBus.publish({
      type: 'quickbooks_sync_receipt',
      category: 'integrations',
      title: 'QuickBooks Payroll Sync Complete',
      description: `Synced ${syncedEntries.length}/${params.entries.length} time activities (${totalHours.toFixed(1)} hrs, $${totalValue.toFixed(2)})`,
      workspaceId: params.workspaceId,
      metadata: {
        receiptId,
        payrollRunId: params.payrollRunId,
        syncType: 'timeactivity',
        status: fullReceipt.status,
        summary: fullReceipt.summary,
      },
    });

    return fullReceipt;
  }

  getReceipt(receiptId: string): QuickBooksReceipt | undefined {
    return receiptStore.get(receiptId);
  }

  getRecentReceipts(workspaceId: string, limit = 10): QuickBooksReceipt[] {
    return Array.from(receiptStore.values())
      .filter(r => r.workspaceId === workspaceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  formatReceiptForDisplay(receipt: QuickBooksReceipt): {
    title: string;
    status: string;
    statusColor: string;
    summary: string;
    details: string[];
    viewUrl?: string;
    signature: string;
  } {
    const statusColors: Record<string, string> = {
      success: 'green',
      partial: 'yellow',
      failed: 'red',
    };

    const typeLabels: Record<string, string> = {
      invoice: 'Invoice Sync',
      payroll: 'Payroll Sync',
      timeactivity: 'Time Activity Sync',
      customer: 'Customer Sync',
      vendor: 'Vendor Sync',
    };

    return {
      title: typeLabels[receipt.syncType] || receipt.syncType,
      status: receipt.status.toUpperCase(),
      statusColor: statusColors[receipt.status] || 'gray',
      summary: `${receipt.summary.syncedRecords}/${receipt.summary.totalRecords} records synced${
        receipt.summary.totalValue ? ` ($${receipt.summary.totalValue.toFixed(2)})` : ''
      }`,
      details: receipt.payload.items.map(item => 
        `${item.name}: ${item.status === 'synced' ? '✓' : '✗'} ${item.amount ? `$${item.amount.toFixed(2)}` : ''}${item.error ? ` - ${item.error}` : ''}`
      ),
      viewUrl: receipt.viewInQuickBooksUrl,
      signature: receipt.trinitySignature,
    };
  }
}

export const quickbooksReceiptService = QuickBooksReceiptService.getInstance();
