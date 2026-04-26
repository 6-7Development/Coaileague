# Jack/GPT Handoff — TRINITY/AI Inline Audit + RFP Pricing Notes

Branch: `development`
Date: 2026-04-25

## Sync Correction

The connector branch display lag was real. Jack verified the source-of-truth commit directly:

```text
0bb2740068ecd0fef5270d4be13b27e2d684eda9 — dispatch.ts DELETED (-350L) + sync verification
```

Then Jack verified that his later vehicle cleanup chain is a clean descendant of `0bb274006`:

```text
compare 0bb274006..74b7a276 = ahead_by 2, behind_by 0
```

Files in that two-commit chain:

```text
server/routes/vehicleRoutes.ts
AGENT_HANDOFF_JACK_2026-04-25_OPS_VEHICLE_CLEANUP.md
```

So there is no branch divergence. Claude should still build-check the vehicle cleanup because it was made during connector display lag.

## Current Verified Chain Head For Jack's Work

```text
74b7a27615694fa34e537237c9ed907d6c39cf51
```

## New Commit

This file: `docs: add Jack Trinity AI inline audit and RFP pricing notes`

## Domain

TRINITY/AI

Mount source read from exact ref `74b7a276`:

```text
server/routes/domains/trinity.ts
```

Important mounted surfaces:

```text
/api/ai-brain/console
/api/ai-brain/control
/api/ai-brain
/api/helpai
/api/trinity/*
/api/automation/*
/api/execution-tracker
/api/subagents
/api/trinity-decisions
/api/trinity-training
/api/bug-remediation
/api/control-tower
/api/quick-fixes
/api/vqa
/api/ai-orchestrator
/api/ai
/api/code-editor
/api/workflow-configs
/api/workflows
/api/agent-activity
```

## File Audited

```text
server/routes/aiBrainInlineRoutes.ts
```

Mount:

```text
/api/ai-brain
```

Important: This router shares `/api/ai-brain` with `ai-brain-routes.ts`. Do not delete by prefix; delete only confirmed no-caller handlers.

## Caller Audit — Active / Keep

### Issue detection

```text
POST /api/ai-brain/detect-issues
```

Caller evidence:

```text
client/src/components/ai-brain/issue-detection-viewer.tsx
```

Keep.

### Guardrails

```text
POST /api/ai-brain/guardrails/validate
GET  /api/ai-brain/guardrails/config
```

Caller evidence:

```text
client/src/components/ai-brain/guardrails-dashboard.tsx
```

Keep.

### Knowledge routes

Broad caller evidence:

```text
client/src/pages/trinity-memory.tsx
```

Keep all `/knowledge/*` routes until Claude does exact local mapping from `trinity-memory.tsx`.

### Fast mode

```text
GET  /api/ai-brain/fast-mode/tiers
POST /api/ai-brain/fast-mode/execute
GET  /api/ai-brain/fast-mode/metrics
```

Caller evidence:

```text
client/src/hooks/useFastMode.ts
client/src/components/ai-brain/FastModeTierSelector.tsx
client/src/components/ai-brain/FastModeStatusWidget.tsx
client/src/components/ai-brain/FastModeROIDashboard.tsx
client/src/components/ai-brain/FastModeToggle.tsx
```

Keep.

## Caller Audit — Strong Delete Candidates

Connector search found no active caller evidence for these visible `aiBrainInlineRoutes.ts` handlers:

```text
POST /api/ai-brain/workflow/execute
POST /api/ai-brain/workflow/high-priority-fixes
POST /api/ai-brain/workflow/search-and-fix
POST /api/ai-brain/workflow/execute-chain
POST /api/ai-brain/diagnostic/run-fast
GET  /api/ai-brain/services/registry
GET  /api/ai-brain/services/orphans
POST /api/ai-brain/services/:serviceId/heartbeat
POST /api/ai-brain/services/:serviceId/hotpatch
GET  /api/ai-brain/mailing-instructions
GET  /api/ai-brain/mailing-instructions/:category
POST /api/ai-brain/mailing-instructions/validate
POST /api/ai-brain/mailer/send
```

These look like old autonomous self-healing/service-watchdog/mailer utility endpoints. They may still be useful internally, but they should not stay mounted as route handlers without a caller.

## Claude Local Verification Commands

Route inventory:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/aiBrainInlineRoutes.ts
```

Exact caller audit:

```bash
rg "/api/ai-brain/workflow/execute|ai-brain/workflow/execute" client server shared scripts tests
rg "/api/ai-brain/workflow/high-priority-fixes|workflow/high-priority-fixes" client server shared scripts tests
rg "/api/ai-brain/workflow/search-and-fix|workflow/search-and-fix" client server shared scripts tests
rg "/api/ai-brain/workflow/execute-chain|workflow/execute-chain" client server shared scripts tests
rg "/api/ai-brain/diagnostic/run-fast|diagnostic/run-fast" client server shared scripts tests
rg "/api/ai-brain/services/registry|services/registry" client server shared scripts tests
rg "/api/ai-brain/services/orphans|services/orphans" client server shared scripts tests
rg "/api/ai-brain/services/.*/heartbeat|services/.*/heartbeat" client server shared scripts tests
rg "/api/ai-brain/services/.*/hotpatch|services/.*/hotpatch" client server shared scripts tests
rg "/api/ai-brain/mailing-instructions|mailing-instructions|/api/ai-brain/mailer/send|mailer/send" client server shared scripts tests
```

Keep routes if local caller evidence appears. Otherwise delete the listed handlers and clean imports.

Build:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Likely Import Cleanup After Deletion

Let TypeScript decide, but deletion may remove dynamic import usage for:

```text
autonomousWorkflowService
trinityFastDiagnostic
serviceOrchestrationWatchdog
subagentSupervisor mailing instruction helpers
emailService
```

Also check static imports at top of `aiBrainInlineRoutes.ts`; some may already be dead.

## Additional Bug/Smell Observed

Visible `ai-brain-routes.ts` contains:

```ts
// @ts-expect-error
.from(aiGlobalPatterns)
```

but `aiGlobalPatterns` was not visible in the imported schema list in the fetched chunk. Claude should verify locally. This may be a compile-masked dead route:

```text
GET /api/ai-brain/global-patterns
```

Caller audit needed:

```bash
rg "/api/ai-brain/global-patterns|global-patterns" client server shared scripts tests
```

If no callers, delete that handler too rather than keeping a route that depends on an undeclared symbol.

## RFP Dynamic Pricing — Jack Notes

Bryan asked for Jack to deliberate on Claude's RFP pricing model before implementation.

### My position

Claude's base structure is good, but I would harden it before coding. RFP generation is not just token cost; it is contract-value leverage and liability exposure. The price should be explainable to the tenant and defensible in audit/support.

### Answers to Claude's questions

1. **Does the matrix cover the right factors?**

Mostly yes. I would add:

```text
page_count / document_length
required forms count
mandatory compliance matrix required? yes/no
past performance narrative required? yes/no
site walk / Q&A addendum handling required? yes/no
```

Reason: a 70-page RFP with 18 attachments can be harder than a smaller federal RFP. The current matrix catches many signals but misses document size and deliverable count.

2. **Rush scoring cap?**

Cap should be 3, not 2:

```text
7+ days = 0
3–7 days = 1
24–72 hours = 2
same-day / under 24 hours = 3
```

Same-day RFPs are not just harder; they interrupt normal automation capacity and support expectations.

3. **Add page count?**

Yes:

```text
0–25 pages = 0
26–75 pages = 1
76–150 pages = 2
150+ pages = 3 or manual review
```

4. **Hard cap at $1,500?**

No hard cap. I recommend:

```text
Standard: $500
Professional: $750
Complex: $1,000
Enterprise: $1,500
Enterprise Plus / Manual Review: $2,000–$3,500 quote required
```

If the RFP is federal, multi-state, armed, prevailing wage, 150+ pages, and due under 24 hours, $1,500 may still be underpriced.

### Implementation recommendation

Before generating the proposal, Trinity should create a quote object:

```text
rfp_quote_id
workspace_id
source_document_id_or_url
complexity_score
price
pricing_factors_json
expires_at
accepted_at
accepted_by
billing_event_id
```

Flow:

1. Tenant uploads PDF or URL.
2. Trinity extracts factors.
3. Trinity returns quote with factor breakdown.
4. Tenant explicitly accepts.
5. Billing event is created.
6. Proposal generation begins.
7. Final proposal PDF is saved to vault.

No accepted quote = no generation.

### Pricing matrix I recommend coding

```text
0–3   Standard       $500
4–6   Professional   $750
7–10  Complex        $1,000
11–14 Enterprise     $1,500
15+   Enterprise+    manual quote, suggested $2,000–$3,500
```

Add a mandatory manual-review flag when:

```text
same-day deadline
150+ pages
federal + prevailing wage
more than 15 sites
multi-state armed services
```

This protects the platform from undercharging and gives sales/support a clean explanation.

## Previous Jack Runtime Commits Still Need Claude Verification

If not already verified by Claude locally:

```text
8856067dfd8de1042535bb930bdc2571f903889e — vehicleRoutes cleanup/fix
```

Claude should build-check it. It is a clean descendant of `0bb274006`, but still needs normal verification.

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull latest development.
2. Confirm tip includes this handoff.
3. Build-check pending vehicle cleanup.
4. Run local `aiBrainInlineRoutes.ts` audit commands.
5. Delete confirmed dead inline AI routes.
6. Verify `GET /api/ai-brain/global-patterns` symbol/caller issue.
7. Update `AGENT_HANDOFF.md` and `DEEP_ROUTE_INDEX.md`.
8. Push verified remote tip.
