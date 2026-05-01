/**
 * Onboarding & Settings Wiring — surface tests
 *
 * Locks in the wiring fixes shipped in commits 7a1174b + c1553f8 + later
 * follow-ups. These are router-shape and module-export tests in the style of
 * tests/unit/sps-onboarding-routes.test.ts — they don't hit a DB, they only
 * verify that the routes / middleware / helpers are exposed under the
 * expected names so future refactors that rename or remove them fail loudly.
 */

import { describe, expect, it } from 'vitest';

function listRoutes(router: any): Array<{ method: string; path: string }> {
  return (router?.stack || [])
    .filter((layer: any) => layer.route)
    .flatMap((layer: any) =>
      Object.keys(layer.route.methods).map((method) => ({
        method: method.toUpperCase(),
        path: layer.route.path as string,
      })),
    );
}

describe('auditor router — settings surface', () => {
  it('exposes GET and PATCH /settings', async () => {
    const mod = await import('../../server/routes/auditorRoutes');
    const routes = listRoutes(mod.auditorRouter);
    expect(routes).toContainEqual({ method: 'GET', path: '/settings' });
    expect(routes).toContainEqual({ method: 'PATCH', path: '/settings' });
  });

  it('still exposes the unchanged audit lifecycle endpoints', async () => {
    const mod = await import('../../server/routes/auditorRoutes');
    const routes = listRoutes(mod.auditorRouter);
    expect(routes).toContainEqual({ method: 'POST', path: '/intake' });
    expect(routes).toContainEqual({ method: 'POST', path: '/claim' });
    expect(routes).toContainEqual({ method: 'POST', path: '/login' });
    expect(routes).toContainEqual({ method: 'POST', path: '/logout' });
  });
});

describe('workspace router — onboarding progress surface', () => {
  it('exposes /onboarding/progress, /step, /complete', async () => {
    const mod = await import('../../server/routes/workspace');
    const routes = listRoutes(mod.default);
    expect(routes).toContainEqual({ method: 'GET', path: '/onboarding/progress' });
    expect(routes).toContainEqual({ method: 'POST', path: '/onboarding/step' });
    expect(routes).toContainEqual({ method: 'POST', path: '/onboarding/complete' });
  });
});

describe('workspaceScope middleware — onboarding gate', () => {
  it('exports requireOnboardingComplete', async () => {
    const mod = await import('../../server/middleware/workspaceScope');
    expect(typeof mod.requireOnboardingComplete).toBe('function');
  });

  it('still exports ensureWorkspaceAccess (unchanged)', async () => {
    const mod = await import('../../server/middleware/workspaceScope');
    expect(typeof mod.ensureWorkspaceAccess).toBe('function');
  });
});

describe('settingsSyncBroadcaster — broadcast helper', () => {
  it('exports broadcastSettingsUpdated', async () => {
    const mod = await import('../../server/services/settingsSyncBroadcaster');
    expect(typeof mod.broadcastSettingsUpdated).toBe('function');
  });
});

describe('shared schema — auditor_settings table', () => {
  it('exports auditorSettings drizzle table + insert schema + types', async () => {
    const mod = await import('../../shared/schema/domains/audit');
    expect(mod.auditorSettings).toBeDefined();
    expect(mod.insertAuditorSettingsSchema).toBeDefined();
  });
});

describe('publicOnboardingRoutes — role landing maps', () => {
  it('defines landing pages for every supported role', async () => {
    // Read the file rather than import (the module has side effects requiring
    // a full express app context). Verify the role keys are present.
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../server/routes/publicOnboardingRoutes.ts'),
      'utf-8',
    );
    for (const role of [
      'org_owner', 'co_owner', 'org_admin', 'org_manager',
      'manager', 'department_manager', 'supervisor',
      'employee', 'staff', 'contractor',
      'vendor', 'client', 'auditor', 'co_auditor',
    ]) {
      expect(src).toContain(`${role}:`);
    }
  });
});

describe('trinityEventSubscriptions — onboarding handler', () => {
  it('subscribes to onboarding_completed', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../server/services/trinityEventSubscriptions.ts'),
      'utf-8',
    );
    // Both the handler function and the subscription registration must exist.
    expect(src).toContain('onOnboardingCompleted');
    expect(src).toContain("platformEventBus.subscribe('onboarding_completed'");
    expect(src).toContain('TrinityOnboardingCompletionHandler');
  });
});

describe('workspace.ts — eager onboarding_completed fix', () => {
  it('no longer publishes onboarding_completed during workspace creation', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../server/routes/workspace.ts'),
      'utf-8',
    );
    // The eager publish that conflated workspace.created with onboarding done
    // must be gone. The string is now only emitted from POST /onboarding/complete.
    const occurrences = src.match(/type:\s*'onboarding_completed'/g) || [];
    expect(occurrences.length).toBe(1);
  });
});
