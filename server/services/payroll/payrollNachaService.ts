/**
 * PAYROLL NACHA SERVICE
 * ======================
 * Generates proper NACHA ACH PPD files for payroll direct deposit disbursement.
 * Extracted from the 224-line GET /runs/:id/nacha inline handler.
 *
 * NACHA file format:
 *   Record 1 (File Header)
 *   Record 5 (Batch Header)
 *   Records 6 (Entry Detail — one per eligible employee)
 *   Record 8 (Batch Control)
 *   Record 9 (File Control)
 *   Filler 9s (pad to multiple of 10 records)
 *
 * Security: Routing/account numbers are decrypted transiently only for file
 * generation — never logged, never stored in plaintext.
 *
 * Eligibility: Only employees with directDepositEnabled=true AND both
 * routing+account numbers configured are included. Missing employees are
 * reported in the X-NACHA-Missing response header.
 */

import { db } from '../../db';
import {
  payrollEntries,
  employeeBankAccounts,
  workspaces,
} from '@shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { decryptToken } from '../../security/tokenEncryption';
import { storage } from '../../storage';
import { isTerminalPayrollStatus } from './payrollStatus';
import { createLogger } from '../../lib/logger';

const log = createLogger('payrollNachaService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely decrypt a token — returns null if empty or decryption fails. */
function safeDecrypt(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  try { return decryptToken(encrypted); } catch { return null; }
}

function pad(s: string | number, len: number, rightAlign = false): string {
  const str = String(s);
  return rightAlign
    ? str.substring(0, len).padEnd(len, ' ')
    : str.substring(0, len).padStart(len, '0');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NachaFileResult {
  success: boolean;
  nachaContent?: string;
  filename?: string;
  eligibleCount?: number;
  missingCount?: number;
  totalCreditCents?: number;
  error?: string;
  status?: number;
  extra?: Record<string, unknown>;
}

// ─── Main Function ────────────────────────────────────────────────────────────

export async function generateNachaFile(
  workspaceId: string,
  runId: string,
): Promise<NachaFileResult> {
  // Fetch the payroll run
  const run = await storage.getPayrollRun(runId, workspaceId);
  if (!run) {
    return { success: false, error: 'Payroll run not found', status: 404 };
  }

  // NACHA is only valid for terminal-state runs (processed / paid)
  if (!isTerminalPayrollStatus((run as any).status)) {
    return {
      success: false,
      error: 'NACHA file is only available for processed or paid payroll runs',
      status: 400,
      extra: { currentStatus: (run as any).status },
    };
  }

  // Fetch workspace bank details
  const [ws] = await db.select().from(workspaces)
    .where(eq(workspaces.id, workspaceId)).limit(1);

  // Fetch payroll entries for this run
  const entries = await db.select().from(payrollEntries)
    .where(and(
      eq(payrollEntries.payrollRunId, runId),
      eq(payrollEntries.workspaceId, workspaceId),
    ));

  if (entries.length === 0) {
    return {
      success: false,
      error: 'No payroll entries found for this run',
      status: 422,
    };
  }

  // Fetch canonical encrypted bank accounts for all employees in this run
  const employeeIds = [...new Set(entries.map(e => (e as any).employeeId).filter(Boolean))];
  const bankAccountRows = employeeIds.length > 0
    ? await db.select().from(employeeBankAccounts)
        .where(and(
          inArray(employeeBankAccounts.employeeId, employeeIds),
          eq(employeeBankAccounts.isPrimary, true),
          eq(employeeBankAccounts.isActive, true),
        ))
    : [];

  const bankAccountMap = new Map(bankAccountRows.map(r => [(r as any).employeeId, r]));

  // Decrypt routing/account numbers transiently for file generation
  const decryptedEntries = entries.map(e => {
    const canonical = bankAccountMap.get((e as any).employeeId);
    if ((canonical as any)?.routingNumberEncrypted && (canonical as any)?.accountNumberEncrypted) {
      return {
        ...e,
        routingNumber: safeDecrypt((canonical as any).routingNumberEncrypted),
        accountNumber: safeDecrypt((canonical as any).accountNumberEncrypted),
        accountType:   (canonical as any).accountType || (e as any).accountType,
      };
    }
    return {
      ...e,
      routingNumber: safeDecrypt((e as any).routingNumber),
      accountNumber: safeDecrypt((e as any).accountNumber),
    };
  });

  const eligible = decryptedEntries.filter(e =>
    (e as any).directDepositEnabled && (e as any).routingNumber && (e as any).accountNumber
  );
  const missing = decryptedEntries.filter(e =>
    !(e as any).directDepositEnabled || !(e as any).routingNumber || !(e as any).accountNumber
  );

  if (eligible.length === 0) {
    return {
      success: false,
      error: 'No employees have direct deposit configured for this payroll run',
      status: 422,
      extra: { missingCount: missing.length, hint: 'Ensure employees have bank routing/account numbers set in their payroll profile' },
    };
  }

  // ── Build NACHA ACH PPD file ───────────────────────────────────────────────

  const companyName      = ((ws as any)?.companyName || (ws as any)?.name || 'COMPANY').substring(0, 16).padEnd(16, ' ');
  const originRoutingRaw = (ws as any)?.payrollBankRouting || '000000000';
  const originRouting    = `1${originRoutingRaw.replace(/\D/g, '').substring(0, 8).padEnd(8, '0')}`;
  const originAccount    = ((ws as any)?.payrollBankAccount || '00000000000').replace(/\D/g, '').substring(0, 17).padEnd(17, ' ');

  const now           = new Date();
  const fileDate      = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const fileTime      = now.toTimeString().slice(0, 5).replace(':', '');  // HHMM
  const batchCount    = 1;
  const blockingFactor = 10;

  const totalCreditCents = eligible.reduce(
    (sum, e) => sum + Math.round(Number((e as any).netPay) * 100), 0
  );
  const totalDebitCents = 0;

  // File Header (Type 1)
  const fileHeader = [
    '1', '01',
    pad(originRouting, 10),
    pad(originRouting.replace(/\D/g, '').padEnd(10, '0'), 10),
    fileDate, fileTime, 'A', '094',
    String(blockingFactor), '1',
    companyName.padEnd(23, ' '),
    companyName.padEnd(23, ' '),
    '        ',
  ].join('');

  // Batch Header (Type 5)
  const batchHeader = [
    '5', '200',
    companyName.padEnd(16, ' '),
    '          ',
    originRouting.replace(/\D/g, '').padStart(10, '0'),
    'PPD', 'PAYROLL         ',
    fileDate, fileDate, '   ', '1',
    originRouting,
    pad(batchCount, 7),
  ].join('');

  // Entry Detail Records (Type 6)
  const entryLines: string[] = [];
  let traceSeq = 1;

  for (const e of eligible) {
    const txCode     = (e as any).accountType === 'savings' ? '32' : '22';
    const routingRaw = ((e as any).routingNumber || '').replace(/\D/g, '').padEnd(8, '0');
    const checkDigit = ((e as any).routingNumber || '0').slice(-1);
    const accountNum = ((e as any).accountNumber || '').padEnd(17, ' ').substring(0, 17);
    const amountCents = Math.round(Number((e as any).netPay) * 100);
    const employeeName = `${(e as any).firstName || ''} ${(e as any).lastName || ''}`.trim().substring(0, 22).padEnd(22, ' ');
    const traceNum   = `${originRouting.slice(1, 9)}${pad(traceSeq++, 7)}`;

    entryLines.push([
      '6', txCode,
      `${routingRaw}${checkDigit}`,
      accountNum,
      pad(amountCents, 10),
      (e as any).employeeId.substring(0, 15).padEnd(15, ' '),
      employeeName,
      '  ', '0', traceNum,
    ].join(''));
  }

  // Batch Control (Type 8)
  const entryHash = eligible
    .reduce((sum, e) => sum + parseInt(((e as any).routingNumber || '0').replace(/\D/g, '').substring(0, 8), 10), 0)
    .toString().slice(-10).padStart(10, '0');

  const batchControl = [
    '8', '220',
    pad(entryLines.length, 6),
    entryHash,
    pad(totalDebitCents, 12),
    pad(totalCreditCents, 12),
    originRouting.replace(/\D/g, '').padStart(10, '0'),
    ' '.repeat(39),
    originRouting.slice(1, 9),
    pad(batchCount, 7),
  ].join('');

  // File Control (Type 9)
  const blockCount = Math.ceil((2 + 2 + entryLines.length) / blockingFactor);
  const fileControl = [
    '9',
    pad(batchCount, 6),
    pad(blockCount, 6),
    pad(entryLines.length, 8),
    entryHash,
    pad(totalDebitCents, 12),
    pad(totalCreditCents, 12),
    ' '.repeat(39),
  ].join('');

  // Assemble and pad to multiple of 10 records
  const records = [fileHeader, batchHeader, ...entryLines, batchControl, fileControl];
  const paddedTo = Math.ceil(records.length / 10) * 10;
  for (let i = records.length; i < paddedTo; i++) {
    records.push('9'.repeat(94));
  }

  const nachaContent = records.map(r => r.substring(0, 94)).join('\r\n');

  const periodLabel = (run as any).periodStart
    ? new Date((run as any).periodStart).toISOString().slice(0, 10).replace(/-/g, '')
    : fileDate;
  const filename = `payroll-ach-${periodLabel}-${runId.substring(0, 8)}.ach`;

  log.info(`[NACHA] Generated file: ${filename} — ${eligible.length} entries, $${(totalCreditCents / 100).toFixed(2)} total`);

  return {
    success: true,
    nachaContent,
    filename,
    eligibleCount: eligible.length,
    missingCount: missing.length,
    totalCreditCents,
  };
}
