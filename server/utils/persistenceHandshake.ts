// Persistence handshake — verify a write actually committed before responding.
//
// After an INSERT we hold the row data in memory (the `.returning()` payload).
// That is not proof that the row is queryable to subsequent connections: a
// transaction may have been rolled back, a replica may be lagging, or a
// connection-pool quirk could mask a non-commit. The handshake performs an
// independent SELECT against the same id (with optional retry to absorb
// short replica lag) and asserts the row is present. If the row is missing,
// `PersistenceVerificationError` is thrown so the caller can surface a
// clear, retryable error instead of returning a "success" response for a
// write that did not stick.
//
// Cost: a single primary-key SELECT per critical write (registration, org
// creation, sub-org creation). Negligible vs. the user-facing cost of a
// silently-dropped account.

import type { SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from '../db';
import { createLogger } from '../lib/logger';

const log = createLogger('PersistenceHandshake');

export class PersistenceVerificationError extends Error {
  readonly retryable = true;
  readonly context: Record<string, unknown>;
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'PersistenceVerificationError';
    this.context = context;
  }
}

interface VerifyOptions {
  // Human-readable label used in logs and error messages (e.g. "user", "workspace", "sub-org").
  label: string;
  // What we were looking for, for log/error context (e.g. `id=abc`).
  description: string;
  // Number of retry attempts when the row is missing. Default 3.
  attempts?: number;
  // Delay between attempts in ms. Default 50ms.
  delayMs?: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Re-read a row matching `where` against the primary db connection to confirm
// the prior write is visible. Throws PersistenceVerificationError if not.
export async function verifyPersisted(
  table: PgTable,
  where: SQL,
  opts: VerifyOptions,
): Promise<void> {
  const attempts = opts.attempts ?? 3;
  const delayMs = opts.delayMs ?? 50;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const [row] = await db.select().from(table).where(where).limit(1);
    if (row) {
      if (attempt > 1) {
        log.info(`[Handshake] ${opts.label} (${opts.description}) verified on attempt ${attempt}`);
      }
      return;
    }
    if (attempt < attempts) {
      log.warn(`[Handshake] ${opts.label} (${opts.description}) not yet visible (attempt ${attempt}/${attempts}); retrying in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }

  throw new PersistenceVerificationError(
    `Persisted ${opts.label} not found after ${attempts} attempts (${opts.description})`,
    { description: opts.description, attempts },
  );
}
