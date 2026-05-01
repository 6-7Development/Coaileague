/**
 * encrypt-pii-at-rest.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot migration that walks the DB and rewrites any plaintext SSN-class
 * value through fieldEncryption.encryptField. Idempotent — already-encrypted
 * values (envelope prefix `pf1:`) are skipped.
 *
 * Run on a maintenance window with FIELD_ENCRYPTION_KEY set:
 *
 *   FIELD_ENCRYPTION_KEY=<32-byte hex>  npx tsx scripts/encrypt-pii-at-rest.ts
 *   FIELD_ENCRYPTION_KEY=<32-byte hex>  npx tsx scripts/encrypt-pii-at-rest.ts --dry-run
 *
 * Tables / columns covered:
 *   - employees.ssn
 *   - employee_payroll_info.ssn
 *   - onboarding_applications.ssn   (if column present)
 *
 * Safety notes:
 *   - Reads each row, encrypts in-process, UPDATEs by primary key. No bulk
 *     UPDATE ... WHERE — every change is a single-row write so a partial
 *     failure leaves the rest of the table consistent.
 *   - --dry-run reports counts without writing anything.
 *   - Counts both "encrypted now" and "already encrypted" for each table.
 *   - Refuses to run if FIELD_ENCRYPTION_KEY is unset (would otherwise
 *     silently no-op leave plaintext in place).
 */

import { db } from '../server/db';
import { employees } from '@shared/schema';
import { eq, isNotNull } from 'drizzle-orm';
import {
  encryptField,
  isEncryptedField,
  isFieldEncryptionConfigured,
} from '../server/security/fieldEncryption';
import { sql } from 'drizzle-orm';

const DRY_RUN = process.argv.includes('--dry-run');

async function migrateColumn(
  tableName: string,
  pkColumn: string,
  piiColumn: string,
): Promise<{ scanned: number; encrypted: number; alreadyEncrypted: number; nullOrEmpty: number }> {
  const rows = await db.execute<{ pk: string; pii: string | null }>(
    sql.raw(`SELECT ${pkColumn} AS pk, ${piiColumn} AS pii FROM ${tableName} WHERE ${piiColumn} IS NOT NULL AND ${piiColumn} <> ''`),
  );

  let scanned = 0;
  let encrypted = 0;
  let alreadyEncrypted = 0;
  let nullOrEmpty = 0;

  for (const row of rows.rows as Array<{ pk: string; pii: string | null }>) {
    scanned++;
    const value = row.pii;
    if (!value) { nullOrEmpty++; continue; }
    if (isEncryptedField(value)) { alreadyEncrypted++; continue; }

    const enc = encryptField(value);
    if (!enc || enc === value) {
      // No key configured or encryption was a no-op — bail loudly
      throw new Error(
        `encryptField returned plaintext for ${tableName}.${piiColumn} pk=${row.pk}. ` +
        `Is FIELD_ENCRYPTION_KEY set?`
      );
    }

    if (!DRY_RUN) {
      await db.execute(
        sql.raw(`UPDATE ${tableName} SET ${piiColumn} = '${enc.replace(/'/g, "''")}' WHERE ${pkColumn} = '${row.pk.replace(/'/g, "''")}'`),
      );
    }
    encrypted++;
  }

  return { scanned, encrypted, alreadyEncrypted, nullOrEmpty };
}

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await db.execute(sql.raw(`SELECT 1 FROM ${tableName} LIMIT 1`));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!isFieldEncryptionConfigured()) {
    console.error('FIELD_ENCRYPTION_KEY (or fallback ENCRYPTION_KEY) is not set. Refusing to run.');
    process.exit(2);
  }

  console.log(DRY_RUN ? '── DRY RUN ──' : '── ENCRYPT PII AT REST ──');

  const targets: Array<{ table: string; pk: string; col: string }> = [
    { table: 'employees', pk: 'id', col: 'ssn' },
    { table: 'employee_payroll_info', pk: 'id', col: 'ssn' },
    { table: 'onboarding_applications', pk: 'id', col: 'ssn' },
  ];

  for (const t of targets) {
    if (!(await tableExists(t.table))) {
      console.log(`  · ${t.table}: skipped (table not present)`);
      continue;
    }
    try {
      const result = await migrateColumn(t.table, t.pk, t.col);
      console.log(
        `  · ${t.table}.${t.col}: scanned=${result.scanned}, encrypted=${result.encrypted}, ` +
          `alreadyEncrypted=${result.alreadyEncrypted}, empty=${result.nullOrEmpty}`,
      );
    } catch (err: any) {
      console.error(`  · ${t.table}.${t.col}: FAILED — ${err?.message}`);
    }
  }

  console.log(DRY_RUN ? '── DRY RUN COMPLETE ──' : '── DONE ──');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
