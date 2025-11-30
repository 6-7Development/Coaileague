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
import { eq, and, gte, lte, desc, or } from 'drizzle-orm';
import { format } from 'date-fns';
import '../types';

export const timesheetInvoiceRouter = Router();

// ============================================================================
// LIST ALL INVOICES WITH FILTERS
// ============================================================================

timesheetInvoiceRouter.get('/', requireAuth, requireManager, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'No workspace selected' });
    }

    const { clientId, status, startDate, endDate } = req.query;

    const conditions = [eq(invoices.workspaceId, workspaceId)];

    if (clientId && typeof clientId === 'string') {
      conditions.push(eq(invoices.clientId, clientId));
    }

    if (status && typeof status === 'string') {
      if (status === 'overdue') {
        const now = new Date();
        conditions.push(
          or(
            eq(invoices.status, 'overdue'),
            and(eq(invoices.status, 'sent'), lte(invoices.dueDate, now))
          ) as any
        );
      } else {
        conditions.push(eq(invoices.status, status as any));
      }
    }

    if (startDate && typeof startDate === 'string') {
      conditions.push(gte(invoices.issueDate, new Date(startDate)));
    }

    if (endDate && typeof endDate === 'string') {
      conditions.push(lte(invoices.issueDate, new Date(endDate)));
    }

    const invoiceList = await db.query.invoices.findMany({
      where: and(...conditions),
      with: {
        client: true,
      },
      orderBy: [desc(invoices.createdAt)],
    });

    const data = invoiceList.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      subtotal: inv.subtotal,
      taxRate: inv.taxRate,
      taxAmount: inv.taxAmount,
      total: inv.total,
      status: inv.status,
      paidAt: inv.paidAt,
      amountPaid: inv.amountPaid,
      sentAt: inv.sentAt,
      clientId: inv.clientId,
      clientName: inv.client 
        ? (inv.client.companyName || `${inv.client.firstName || ''} ${inv.client.lastName || ''}`.trim())
        : 'Unknown Client',
      clientEmail: inv.client?.email,
      notes: inv.notes,
      createdAt: inv.createdAt,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[TimesheetInvoice] List error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to list invoices' });
  }
});

// ============================================================================
// GET INVOICE DETAIL WITH LINE ITEMS
// ============================================================================

timesheetInvoiceRouter.get('/:invoiceId', requireAuth, requireManager, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'No workspace selected' });
    }

    const { invoiceId } = req.params;

    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.workspaceId, workspaceId)),
      with: {
        client: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const lineItems = await db.select().from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId));

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    const data = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      status: invoice.status,
      paidAt: invoice.paidAt,
      amountPaid: invoice.amountPaid,
      sentAt: invoice.sentAt,
      notes: invoice.notes,
      paymentIntentId: invoice.paymentIntentId,
      client: invoice.client ? {
        id: invoice.client.id,
        firstName: invoice.client.firstName,
        lastName: invoice.client.lastName,
        companyName: invoice.client.companyName,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
      } : null,
      workspace: workspace ? {
        id: workspace.id,
        name: workspace.name,
        companyName: workspace.companyName,
        address: workspace.address,
        phone: workspace.phone,
      } : null,
      lineItems: lineItems.map(li => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: li.amount,
        timeEntryId: li.timeEntryId,
      })),
      createdAt: invoice.createdAt,
    };

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[TimesheetInvoice] Detail error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get invoice detail' });
  }
});

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
