/**
 * SECURITY TESTS — Plaid Employee Ownership / Bank-Account IDOR
 * Domain: integrations / Plaid
 *
 * The Plaid bank-link flow must only allow:
 *   - An employee to link a bank account to their OWN employee record
 *   - A manager+ (org_owner / co_owner / manager / supervisor) to link an
 *     employee in their OWN workspace
 *
 * Guards under test (server/routes/plaidRoutes.ts):
 *   POST /api/plaid/link-token/employee/:employeeId   (lines 199-235)
 *   POST /api/plaid/exchange/employee/:employeeId     (lines 237-346)
 *
 * Strategy: We exercise the route handlers in isolation by mocking the
 * minimum surface (`db`, the `plaidService` exchange/account fetchers,
 * and the websocket/event-bus side effects). Any change to the ownership
 * decision logic in those routes must keep these tests green.
 *
 * NOTE on test runner wiring: tests/security/ is not included in the
 * default vitest workspace projects (only tests/unit, tests/api,
 * tests/regression). To run: `npx vitest run tests/security` or add a
 * `security` project to vitest.workspace.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Request, type Response } from 'express';
import request from 'supertest';

// ── Test fixtures ────────────────────────────────────────────────────────────
const WS_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const WS_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const USER_ALICE = 'user-alice';
const USER_BOB = 'user-bob';
const USER_MGR_A = 'user-manager-a';
const EMP_ALICE = 'emp-alice';
const EMP_BOB = 'emp-bob';
const EMP_IN_B = 'emp-in-b';

// In-memory employee table the mocked db.select reads from.
const employeesFixture: Array<{ id: string; workspaceId: string; userId: string }> = [
  { id: EMP_ALICE, workspaceId: WS_A, userId: USER_ALICE },
  { id: EMP_BOB, workspaceId: WS_A, userId: USER_BOB },
  { id: EMP_IN_B, workspaceId: WS_B, userId: 'user-in-b' },
];

// Captured INSERT/UPDATE payloads, asserted by tests.
const captured: { inserts: unknown[]; updates: unknown[]; events: unknown[] } = {
  inserts: [],
  updates: [],
  events: [],
};

// ── Module mocks ─────────────────────────────────────────────────────────────
vi.mock('../../server/db', () => {
  // Returns a chainable query builder. Resolves the same way whether the
  // caller terminates with `.limit()` (employee lookup) or awaits `.where()`
  // directly (bank-account list query). Reads from `employeesFixture` for
  // the `employees` table; returns `[]` for any other table since we don't
  // need fixture data for bank accounts in these tests.
  const buildSelect = () => {
    const state: { table?: string; where?: Record<string, unknown> } = {};
    const resolve = async () => {
      const where = state.where || {};
      const id = where.id as string | undefined;
      const workspaceId = where.workspaceId as string | undefined;
      // Only `employees` is fixture-backed. Other tables (e.g. employeeBankAccounts)
      // resolve to [] which matches the route's "no accounts" response shape.
      if (state.table !== 'employees') return [];
      const row = employeesFixture.find((e) => (!id || e.id === id) && (!workspaceId || e.workspaceId === workspaceId));
      return row ? [row] : [];
    };
    const chain: Record<string, unknown> = {};
    chain.from = (t: unknown) => { state.table = String((t as { __name?: string })?.__name || ''); return chain; };
    chain.where = (cond: unknown) => { state.where = (cond as { __resolved?: Record<string, unknown> })?.__resolved || {}; return chain; };
    chain.limit = resolve;
    // Make the chain itself awaitable so callers that don't append .limit()
    // (e.g. `await db.select().from().where(...)`) still resolve.
    chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      resolve().then(onFulfilled, onRejected);
    return chain;
  };
  const insertChain = () => ({
    values: (v: unknown) => { captured.inserts.push(v); return { returning: async () => [{ id: 'new-bank-account' }] }; },
  });
  const updateChain = () => ({
    set: (v: unknown) => { captured.updates.push(v); return { where: async () => undefined }; },
  });
  return {
    db: {
      select: () => buildSelect(),
      insert: () => insertChain(),
      update: () => updateChain(),
    },
    pool: { query: async () => ({ rows: [] }) },
  };
});

vi.mock('../../server/services/partners/plaidService', () => ({
  isPlaidConfigured: () => true,
  createLinkToken: vi.fn(async () => ({ linkToken: 'link-sandbox-test', expiration: new Date().toISOString() })),
  exchangePublicToken: vi.fn(async () => ({ accessToken: 'access-sandbox-test', itemId: 'item-test' })),
  getAccountDetails: vi.fn(async () => ({
    accountId: 'acct-test',
    mask: '1234',
    accountType: 'checking',
    accountName: 'Checking',
    institutionName: 'Test Bank',
  })),
  encryptToken: (s: string) => `enc:${s}`,
  decryptToken: (s: string) => s.replace(/^enc:/, ''),
  plaidEncrypt: (s: string) => `enc:${s}`,
}));

vi.mock('../../server/services/platformEventBus', () => ({
  platformEventBus: {
    publish: vi.fn(async (e: unknown) => { captured.events.push(e); }),
  },
}));

vi.mock('../../server/websocket', () => ({
  broadcastToWorkspace: vi.fn(),
}));

// drizzle-orm `eq` / `and` — return a small marker the mocked db.select can read
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('drizzle-orm');
  return {
    ...actual,
    eq: (col: unknown, val: unknown) => ({ __field: (col as { __name?: string })?.__name, __val: val }),
    and: (...conds: unknown[]) => {
      const resolved: Record<string, unknown> = {};
      for (const c of conds) {
        const co = c as { __field?: string; __val?: unknown };
        if (co?.__field) resolved[co.__field] = co.__val;
      }
      return { __resolved: resolved };
    },
  };
});

// Schema columns get `.__name` so the eq() mock can read them. Tables also
// carry a `__name` so the buildSelect() chain can route the resolver.
vi.mock('@shared/schema', () => {
  const col = (name: string) => ({ __name: name });
  const table = (name: string, cols: Record<string, unknown>) =>
    Object.assign({ __name: name }, cols);
  return {
    employees: table('employees', { id: col('id'), workspaceId: col('workspaceId'), userId: col('userId') }),
    employeeBankAccounts: table('employeeBankAccounts', {
      id: col('id'),
      workspaceId: col('workspaceId'),
      employeeId: col('employeeId'),
      isPrimary: col('isPrimary'),
      isActive: col('isActive'),
      bankName: col('bankName'),
      accountType: col('accountType'),
      accountNumberLast4: col('accountNumberLast4'),
      plaidItemId: col('plaidItemId'),
      plaidMask: col('plaidMask'),
      plaidInstitutionName: col('plaidInstitutionName'),
      isVerified: col('isVerified'),
    }),
    payStubs: table('payStubs', {}),
    orgFinanceSettings: table('orgFinanceSettings', {}),
    workspaces: table('workspaces', { id: col('id') }),
  };
});

// Bypass the production auth middleware — we install our own auth context per
// request. plaidRoutes imports requireAuth from ../auth and the *Owner/*Manager
// guards from ../rbac, so we have to mock both modules.
vi.mock('../../server/auth', () => ({
  requireAuth: (_req: Request, _res: Response, next: () => void) => next(),
}));
vi.mock('../../server/rbac', () => ({
  requireOwner: (_req: Request, _res: Response, next: () => void) => next(),
  requireManager: (_req: Request, _res: Response, next: () => void) => next(),
}));

vi.mock('../../server/middleware/errorHandler', () => ({
  sanitizeError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

// ── App harness ──────────────────────────────────────────────────────────────
async function makeApp(actor: { userId: string; workspaceId: string; workspaceRole: string }) {
  const app = express();
  app.use(express.json());
  // Inject the auth context the routes expect.
  app.use((req, _res, next) => {
    (req as unknown as { user: unknown; workspaceId: string; workspaceRole: string }).user = {
      id: actor.userId,
      workspaceRole: actor.workspaceRole,
    };
    (req as unknown as { workspaceId: string }).workspaceId = actor.workspaceId;
    (req as unknown as { workspaceRole: string }).workspaceRole = actor.workspaceRole;
    next();
  });
  const { default: plaidRouter } = await import('../../server/routes/plaidRoutes');
  app.use('/api/plaid', plaidRouter);
  return app;
}

beforeEach(() => {
  captured.inserts.length = 0;
  captured.updates.length = 0;
  captured.events.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Plaid employee ownership guard', () => {
  it('employee can request a link-token for their own bank account (200)', async () => {
    const app = await makeApp({ userId: USER_ALICE, workspaceId: WS_A, workspaceRole: 'employee' });
    const res = await request(app).post(`/api/plaid/link-token/employee/${EMP_ALICE}`).send({});
    expect(res.status).toBe(200);
    expect(res.body.linkToken).toBe('link-sandbox-test');
  });

  it('employee CANNOT request a link-token for another employee (403)', async () => {
    const app = await makeApp({ userId: USER_ALICE, workspaceId: WS_A, workspaceRole: 'employee' });
    const res = await request(app).post(`/api/plaid/link-token/employee/${EMP_BOB}`).send({});
    expect(res.status).toBe(403);
    expect(String(res.body.error || '')).toMatch(/your own/i);
  });

  it('manager CAN request a link-token for an employee in the same workspace (200)', async () => {
    const app = await makeApp({ userId: USER_MGR_A, workspaceId: WS_A, workspaceRole: 'manager' });
    const res = await request(app).post(`/api/plaid/link-token/employee/${EMP_BOB}`).send({});
    expect(res.status).toBe(200);
  });

  it('manager CANNOT request a link-token for an employee in a different workspace (404)', async () => {
    // The route resolves the employee by (id, workspaceId) tuple, so a manager
    // in workspace A asking about an employee in workspace B never finds the
    // row and returns 404 — the same authoritative outcome as 403 (no leak).
    const app = await makeApp({ userId: USER_MGR_A, workspaceId: WS_A, workspaceRole: 'manager' });
    const res = await request(app).post(`/api/plaid/link-token/employee/${EMP_IN_B}`).send({});
    expect(res.status).toBe(404);
  });

  it('employee CANNOT exchange a public token for another employee (403)', async () => {
    const app = await makeApp({ userId: USER_ALICE, workspaceId: WS_A, workspaceRole: 'employee' });
    const res = await request(app)
      .post(`/api/plaid/exchange/employee/${EMP_BOB}`)
      .send({ publicToken: 'public-sandbox-test' });
    expect(res.status).toBe(403);
    // No state mutation may occur on a denied request.
    expect(captured.inserts).toHaveLength(0);
    expect(captured.updates).toHaveLength(0);
  });

  it('on a successful self-exchange, the encrypted token is stored against the requesting employee only', async () => {
    const app = await makeApp({ userId: USER_ALICE, workspaceId: WS_A, workspaceRole: 'employee' });
    const res = await request(app)
      .post(`/api/plaid/exchange/employee/${EMP_ALICE}`)
      .send({ publicToken: 'public-sandbox-test' });
    expect(res.status).toBe(200);
    // Either an insert or update occurred — but always scoped to (WS_A, EMP_ALICE).
    const writes = [...captured.inserts, ...captured.updates];
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      const payload = w as Record<string, unknown>;
      // No write may carry another employee's ID or another workspace's ID.
      if (payload.employeeId !== undefined) expect(payload.employeeId).toBe(EMP_ALICE);
      if (payload.workspaceId !== undefined) expect(payload.workspaceId).toBe(WS_A);
    }
  });

  // ── VD-08: bank-status read guard ──────────────────────────────────────────
  it('employee CANNOT read another employee\'s bank-status (403)', async () => {
    const app = await makeApp({ userId: USER_ALICE, workspaceId: WS_A, workspaceRole: 'employee' });
    const res = await request(app).get(`/api/plaid/employee/${EMP_BOB}/bank-status`);
    expect(res.status).toBe(403);
    expect(String(res.body.error || '')).toMatch(/your own/i);
  });

  it('employee CAN read their own bank-status (200)', async () => {
    const app = await makeApp({ userId: USER_ALICE, workspaceId: WS_A, workspaceRole: 'employee' });
    const res = await request(app).get(`/api/plaid/employee/${EMP_ALICE}/bank-status`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('connected');
  });

  it('manager CAN read any employee\'s bank-status in their own workspace (200)', async () => {
    const app = await makeApp({ userId: USER_MGR_A, workspaceId: WS_A, workspaceRole: 'manager' });
    const res = await request(app).get(`/api/plaid/employee/${EMP_BOB}/bank-status`);
    expect(res.status).toBe(200);
  });

  it('cross-workspace bank-status read returns 404 (no leak)', async () => {
    const app = await makeApp({ userId: USER_MGR_A, workspaceId: WS_A, workspaceRole: 'manager' });
    const res = await request(app).get(`/api/plaid/employee/${EMP_IN_B}/bank-status`);
    expect(res.status).toBe(404);
  });
});
