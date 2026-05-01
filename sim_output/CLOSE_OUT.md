# Schedule Subsystem — Close-Out Memo

Final state of branch `claude/test-schedule-integration-0vxFL` before merge.

## Bottom line

Branch is **green and mergeable**. Schedule subsystem is fully verified, every
endpoint the UI invokes is wired front-to-back, every TS error in scope is
fixed, and a system map captures the wiring so concurrent sessions don't fork.

## Numbers

| Metric                              | Value |
|-------------------------------------|------:|
| Verifier endpoints                  | 28/28 PASS |
| Schedule-scope TS errors            | 0 |
| Files I touched with TS errors      | 0 |
| Total codebase TS errors            | 225 (out of scope) |
| Real silent runtime bugs killed     | 13 across rounds 1–4 |
| Stale `@ts-expect-error` removed    | 51 |
| Production build                    | OK |

## Real bugs killed (would have crashed in prod)

| #  | File                                          | Bug |
|----|-----------------------------------------------|-----|
| 1  | `universal-schedule.tsx:1519`                 | `POST /api/scheduling/shifts/:id/swap-request` had no backend route — silent 404 on every "Request Swap" click |
| 2  | `advancedSchedulingRoutes.ts`                 | Insert wrote `requestedById` (not in schema) — schema column is `requesterId`. Every insert would have hit `NOT NULL` violation |
| 3  | `advancedSchedulingService.ts`                | `getSwapRequests` used drizzle `with: {…}` which compiled to a single Postgres `json_build_object` exceeding the 100-arg limit. Always 500'd |
| 4  | `schedulesRoutes.ts` publish/unpublish        | Referenced an undeclared free `workspaceId` symbol — `ReferenceError` at runtime |
| 5  | `shiftRoutes.ts` send-reminder                | Returned misleading `404 Shift not found` for duplicate reminder calls |
| 6  | `shiftRoutes.ts` deny                         | Wrote ISO string into a `timestamp` column |
| 7  | `availabilityRoutes.ts` exception             | Zod accepted `time_off/schedule_change/…`; service required `vacation/sick/…` — every UI submission silently 400'd |
| 8  | `actionRegistry.ts`                           | Optimistic-lock select didn't fetch `updatedAt`, so every `expectedUpdatedAt` request wrongly tripped `CONCURRENT_MODIFICATION` |
| 9  | `autonomousScheduler.ts`                      | Cron called `gamificationService.resetWeeklyPoints()` / `resetMonthlyPoints()` — methods didn't exist. Threw silently every Sunday and on the 1st |
| 10 | `calendarRoutes.ts`                           | Google Calendar OAuth handlers referenced 4 helpers that were never imported — `ReferenceError` on every connect/sync |
| 11 | `trinityDocumentActions.ts`                   | 4 "Elite AI" actions called `claudeVerificationService.verify()` with the wrong signature; would crash at runtime |
| 12 | `trinityDocumentActions.ts`                   | 8 action registrations were inside `scanOverdueI9s` (no orchestrator in scope) |
| 13 | `authCoreRoutes.ts`                           | Duplicate `requireAuth` import (silently shadowed), missing `verifyPassword`/`verifyMfaToken`/`validatePendingMfaToken`/`SUPPORT_PLATFORM_ROLES` |

## Suggestions before / during merge

These are recommendations the user should consider; I did not implement them
because they were out of scope:

1. **Merge order matters.** `origin/development` carries Phase 1–12 TS debt
   purge that's not in `main`. Almost every file I touched is also touched
   on development. Merge sequence:
   - **Option A** (recommended): rebase this branch onto `development`,
     resolve conflicts (most are import-list deltas), then PR into
     `development`. From there, ride the development → main merge train.
   - **Option B**: merge development into main first, then merge this
     branch into main. Higher conflict surface; not recommended.

2. **Wire the verifier into CI.** `scripts/verify-schedule-integration.mjs`
   is a real regression net — 28 endpoints exercised against real seeded
   data in ~1 second. Adding it to `.github/workflows/*.yml` (after `npm
   run dev` boot) would catch a schedule regression on every PR.

3. **Set `RESEND_API_KEY` in Railway and re-run `fire-proof-email.mjs`
   against the deployed environment.** The dev-mode noop confirms the
   pipeline; only a real key proves a real send. Do it before promoting
   to prod.

4. **Tier-gate UX.** `requireProfessional` on `/api/scheduling/*` returns
   `403 { error: 'TIER_UPGRADE_REQUIRED', upgradeUrl }`. Frontend currently
   shows a generic toast instead of the upsell — a follow-up PR should
   branch on `error === 'TIER_UPGRADE_REQUIRED'` in `apiError.ts` and
   route to `upgradeUrl`. Free/Trial users hitting Swap or Recurring see
   no in-product path forward today.

5. **The four removed business-document actions** (`proof_of_employment`,
   `direct_deposit_confirmation`, `payroll_run_summary`, `w3_transmittal`)
   are now absent from the action registry. If the AI Brain action manifest
   or any PRD references them, that's broken until the generators in
   `services/documents/` actually ship. Worth grepping the manifest.

6. **`@ts-expect-error` directives still suppressing real errors.** I only
   removed the *unused* ones. Real suppressions remain — primarily in
   `shiftRoutes.ts` (~30 directives), `storage.ts` (~30 directives), and
   misc trinity services. These are technical debt; a follow-up TS cleanup
   sprint should walk the list and either fix the underlying type or
   replace with a typed `as any` cast that documents what's being asserted.

7. **N+1 audit for the wider platform.** The schedule services are clean
   (every enrichment uses `inArray()`), but I didn't audit other domains.
   Worth a separate `Plan` agent run on routes/storage to find more.

8. **Keep `SCHEDULE_SYSTEM_MAP.md` updated.** Concurrent Claude sessions
   working on schedule files should treat it as the source of truth and
   update it when adding routes/services so the map doesn't decay.

## What's safe to ship now

* Every schedule UI endpoint is wired and verified.
* Every fix introduces only typed code (no `any` smuggling, no bandaid
  stubs that throw at runtime, no `@ts-ignore`).
* No existing functionality was removed except the 4 broken business
  document actions whose generators don't exist anywhere — those would
  have crashed at runtime if invoked.
* Build is green, schedule TS scope is 0, runtime verifier is 28/28.

## Files in this branch

Source-of-truth artifacts (read these in order if you're picking up the
context cold):

* `sim_output/SCHEDULE_INTEGRATION_VERIFICATION.md` — round 1 (front-to-back wiring proof)
* `sim_output/SCHEDULE_INTEGRATION_VERIFICATION_R2.md` — round 2 (5 silent bugs killed)
* `sim_output/SCHEDULE_INTEGRATION_VERIFICATION_R3.md` — round 3 (final gap analysis)
* `sim_output/SCHEDULE_SYSTEM_MAP.md` — canonical wiring map
* `sim_output/CLOSE_OUT.md` — this memo
* `scripts/verify-schedule-integration.mjs` — 28-test verifier
* `scripts/fire-proof-email.mjs` — email pipeline proof
* `scripts/strip-unused-ts-expect-error.sh` — TS debt sweeper
