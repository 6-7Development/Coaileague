/**
 * Timesheet Invoice API Routes
 * Generate invoices from approved time entries
 * Enhanced with PDF generation, email integration, and AI Brain events
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { requireWorkspaceRole, requireManager } from '../rbac';
import { 
  generateInvoiceFromTimesheets,
  generateInvoiceFromHours,
  getUninvoicedTimeEntries,
  sendInvoice,
  sendInvoiceWithEmail,
  markInvoicePaid,
  checkOverdueInvoices,
  getRevenueForecast,
  generateInvoicePdfBuffer,
  InvoicePdfData
} from '../services/timesheetInvoiceService';
import { db } from '../db';
import { invoices, invoiceLineItems, clients, workspaces } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import '../types';

export const timesheetInvoiceRouter = Router();

timesheetInvoiceRouter.post('/generate', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { clientId, startDate, endDate, taxRate, notes, dueInDays } = req.body;

    if (!clientId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Client ID, start date, and end date are required' });
    }

    const result = await generateInvoiceFromTimesheets({
      workspaceId,
      clientId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      taxRate: taxRate ? Number(taxRate) : undefined,
      notes,
      dueInDays: dueInDays ? Number(dueInDays) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[TimesheetInvoice] Generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice' });
  }
});

timesheetInvoiceRouter.get('/uninvoiced', requireAuth, requireManager, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const clientId = req.query.clientId as string | undefined;

    const result = await getUninvoicedTimeEntries(workspaceId, clientId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[TimesheetInvoice] Uninvoiced error:', error);
    res.status(500).json({ error: error.message });
  }
});

timesheetInvoiceRouter.post('/:invoiceId/send', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { invoiceId } = req.params;

    const result = await sendInvoice(invoiceId, workspaceId);

    res.json(result);
  } catch (error: any) {
    console.error('[TimesheetInvoice] Send error:', error);
    res.status(500).json({ error: error.message });
  }
});

timesheetInvoiceRouter.post('/:invoiceId/mark-paid', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { invoiceId } = req.params;
    const { amountPaid, paymentIntentId } = req.body;

    const result = await markInvoicePaid(
      invoiceId,
      workspaceId,
      amountPaid ? Number(amountPaid) : undefined,
      paymentIntentId
    );

    res.json(result);
  } catch (error: any) {
    console.error('[TimesheetInvoice] Mark paid error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENHANCED INVOICE GENERATION FROM HOURS
// ============================================================================

timesheetInvoiceRouter.post('/generate-from-hours', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { 
      clientId, 
      startDate, 
      endDate, 
      hourlyRateOverride,
      taxRate, 
      notes, 
      dueInDays,
      groupByEmployee,
      groupByProject
    } = req.body;

    if (!clientId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Client ID, start date, and end date are required' });
    }

    const result = await generateInvoiceFromHours({
      workspaceId,
      clientId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      hourlyRateOverride: hourlyRateOverride ? Number(hourlyRateOverride) : undefined,
      taxRate: taxRate ? Number(taxRate) : undefined,
      notes,
      dueInDays: dueInDays ? Number(dueInDays) : undefined,
      groupByEmployee: Boolean(groupByEmployee),
      groupByProject: Boolean(groupByProject),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[TimesheetInvoice] Generate from hours error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice from hours' });
  }
});

// ============================================================================
// SEND INVOICE WITH EMAIL AND PDF ATTACHMENT
// ============================================================================

timesheetInvoiceRouter.post('/:invoiceId/send-email', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId || !user?.id) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { invoiceId } = req.params;
    const { customMessage } = req.body;

    const result = await sendInvoiceWithEmail({
      invoiceId,
      workspaceId,
      userId: user.id,
      customMessage,
    });

    res.json(result);
  } catch (error: any) {
    console.error('[TimesheetInvoice] Send email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send invoice email' });
  }
});

// ============================================================================
// DOWNLOAD INVOICE PDF
// ============================================================================

timesheetInvoiceRouter.get('/:invoiceId/pdf', requireAuth, requireManager, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { invoiceId } = req.params;

    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.workspaceId, workspaceId)),
      with: {
        client: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    const lineItems = await db.select().from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId));

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate || new Date(),
      dueDate: invoice.dueDate || new Date(),
      clientName: invoice.client ? `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim() : 'Valued Client',
      clientCompany: invoice.client?.companyName || '',
      clientEmail: invoice.client?.email || '',
      clientAddress: invoice.client?.address || undefined,
      workspaceName: workspace?.name || 'CoAIleague',
      workspaceAddress: workspace?.address || undefined,
      lineItems: lineItems.map(li => ({
        description: li.description,
        quantity: Number(li.quantity),
        rate: Number(li.unitPrice),
        amount: Number(li.amount),
      })),
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate || 0),
      taxAmount: Number(invoice.taxAmount || 0),
      total: Number(invoice.total),
      notes: invoice.notes || undefined,
    };

    const pdfBuffer = await generateInvoicePdfBuffer(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[TimesheetInvoice] PDF download error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
});

// ============================================================================
// OVERDUE INVOICES AND REVENUE FORECAST
// ============================================================================

timesheetInvoiceRouter.get('/overdue', requireAuth, requireManager, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const result = await checkOverdueInvoices(workspaceId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[TimesheetInvoice] Overdue check error:', error);
    res.status(500).json({ error: error.message });
  }
});

timesheetInvoiceRouter.get('/revenue-forecast', requireAuth, requireManager, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const result = await getRevenueForecast(workspaceId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[TimesheetInvoice] Revenue forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});
