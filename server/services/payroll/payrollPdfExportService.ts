/**
 * PAYROLL PDF EXPORT SERVICE
 * ============================
 * Generates a branded PDF payroll run summary for employer download.
 * Extracted from the 110-line GET /export/pdf/:runId inline handler.
 *
 * Note: This handler is distinct from generatePayrollRunSummary() in
 * businessDocumentGenerators.ts — that saves to vault. This one streams
 * directly to the HTTP response (for immediate download without vault overhead).
 * Both should eventually use the same underlying PDF generator.
 */

import PDFDocument from 'pdfkit';
import { db } from '../../db';
import { payrollRuns, payrollEntries, employees as employeesTable } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { storage } from '../../storage';
import { format } from 'date-fns';
import { createLogger } from '../../lib/logger';

const log = createLogger('payrollPdfExportService');

export interface PayrollPdfExportResult {
  success: boolean;
  pdfBuffer?: Buffer;
  filename?: string;
  error?: string;
  status?: number;
}

export async function generatePayrollRunPdf(
  workspaceId: string,
  runId: string,
): Promise<PayrollPdfExportResult> {
  const [run] = await db.select().from(payrollRuns)
    .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.workspaceId, workspaceId)))
    .limit(1);

  if (!run) return { success: false, error: 'Payroll run not found', status: 404 };

  const entries = await db.select({
    id: payrollEntries.id,
    employeeId: payrollEntries.employeeId,
    regularHours: payrollEntries.regularHours,
    overtimeHours: payrollEntries.overtimeHours,
    hourlyRate: payrollEntries.hourlyRate,
    grossPay: payrollEntries.grossPay,
    federalTax: payrollEntries.federalTax,
    stateTax: payrollEntries.stateTax,
    socialSecurity: payrollEntries.socialSecurity,
    medicare: payrollEntries.medicare,
    netPay: payrollEntries.netPay,
    workerType: payrollEntries.workerType,
  }).from(payrollEntries)
    .where(and(
      eq(payrollEntries.payrollRunId, runId),
      eq(payrollEntries.workspaceId, workspaceId),
    ));

  const workspace = await storage.getWorkspace(workspaceId);

  const empList = await db.select({
    id: employeesTable.id,
    firstName: employeesTable.firstName,
    lastName: employeesTable.lastName,
  }).from(employeesTable).where(eq(employeesTable.workspaceId, workspaceId));

  const empMap = new Map(empList.map(e => [e.id, `${e.firstName} ${e.lastName}`.trim()]));

  // Build PDF
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  doc.on('data', (c: Buffer) => chunks.push(c));
  const pdfReady = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Header
  doc.fontSize(20).text((workspace as any)?.companyName || 'Company', { align: 'center' });
  doc.fontSize(14).text('PAYROLL RUN SUMMARY', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(
    `Pay Period: ${format(new Date((run as any).periodStart || new Date()), 'MMMM d, yyyy')} – ${format(new Date((run as any).periodEnd || new Date()), 'MMMM d, yyyy')}`,
    { align: 'center' },
  );
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, { align: 'center' });
  doc.text(`Status: ${((run as any).status || '').toUpperCase()}`, { align: 'center' });
  doc.moveDown();

  // Employee breakdown table
  doc.fontSize(12).text('EMPLOYEE BREAKDOWN', { underline: true });
  doc.moveDown(0.3);

  const colX = { name: 50, hours: 220, rate: 290, gross: 360, taxes: 420, net: 490 };
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Employee', colX.name, doc.y, { continued: false });
  const headerY = doc.y - 12;
  doc.text('Reg Hrs', colX.hours, headerY, { continued: false });
  doc.text('Rate', colX.rate, headerY, { continued: false });
  doc.text('Gross', colX.gross, headerY, { continued: false });
  doc.text('Taxes', colX.taxes, headerY, { continued: false });
  doc.text('Net Pay', colX.net, headerY, { continued: false });
  doc.moveDown(0.2);
  doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9);

  for (const entry of entries) {
    const name = empMap.get((entry as any).employeeId) || 'Unknown';
    const taxes = (
      parseFloat((entry as any).federalTax || '0') +
      parseFloat((entry as any).stateTax || '0') +
      parseFloat((entry as any).socialSecurity || '0') +
      parseFloat((entry as any).medicare || '0')
    ).toFixed(2);
    const rowY = doc.y;
    doc.text(name, colX.name, rowY, { width: 165, continued: false });
    doc.text(parseFloat((entry as any).regularHours || '0').toFixed(1), colX.hours, rowY);
    doc.text(`$${parseFloat((entry as any).hourlyRate || '0').toFixed(2)}`, colX.rate, rowY);
    doc.text(`$${parseFloat((entry as any).grossPay || '0').toFixed(2)}`, colX.gross, rowY);
    doc.text(`$${taxes}`, colX.taxes, rowY);
    doc.text(`$${parseFloat((entry as any).netPay || '0').toFixed(2)}`, colX.net, rowY);
    doc.moveDown(0.4);
  }

  // Totals
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Total Employees: ${entries.length}`, 50);
  doc.text(`Total Gross Pay: $${parseFloat((run as any).totalGrossPay || '0').toFixed(2)}`, 50);
  doc.text(`Total Taxes: $${parseFloat((run as any).totalTaxes || '0').toFixed(2)}`, 50);
  doc.text(`Total Net Pay: $${parseFloat((run as any).totalNetPay || '0').toFixed(2)}`, 50);

  doc.moveDown();
  doc.fontSize(8).font('Helvetica').fillColor('grey')
    .text('This document is confidential. Generated by Trinity Payroll Automation.', { align: 'center' });

  doc.end();
  const pdfBuffer = await pdfReady;

  const filename = `payroll-run-${format((run as any).periodStart || new Date(), 'yyyy-MM-dd')}.pdf`;
  log.info(`[PayrollPdfExport] Generated PDF for run ${runId}: ${entries.length} employees`);

  return { success: true, pdfBuffer, filename };
}
