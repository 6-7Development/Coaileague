# CoAIleague — Enterprise Workflow Map
# Waves 22 + 23 · As-Is Audit + Closed-Loop Pipeline Blueprint

> **Classification:** Living Architecture Document — updated every wave
> **Audience:** Trinity, SARGE, Claude Code agents, CoAIleague engineering
> **Purpose:** Trinity reads this to understand what the platform can do and
>              how every pipeline works end-to-end. SARGE reads his subset.
> **Rule:** Every new feature gets documented HERE before code is written.

---

## HOW TO READ THIS DOCUMENT

Each pipeline follows the 7-step canonical pattern locked in SYSTEM_MAP.md:

```
TRIGGER → VALIDATE → PROCESS → PERSIST → PROPAGATE → NOTIFY → CONFIRM
```

Every step lists:
- **What fires it**
- **What it does**
- **What it writes to the DB**
- **What WebSocket event it broadcasts**
- **What the next step expects**

---

## WAVE 23 IMPLEMENTATION STATUS

| Gap | Status | File |
|---|---|---|
| Stripe → workspace provisioning | ✅ BUILT | workspaceProvisioningService.ts |
| Mandatory 5-step onboarding checklist | ✅ BUILT | SetupChecklist.tsx + OnboardingGate.tsx |
| #trinity-command room auto-creation | ✅ BUILT | workspaceProvisioningService.ts |
| SARGE auto-joins all rooms | ✅ BUILT | workspaceProvisioningService.ts |
| Schedule approval gate | ✅ BUILT | scheduleApprovalRoutes.ts |
| SARGE ChatDock execution feedback | ✅ BUILT | calloffCoverageWorkflow.ts + websocket |
| Client shift request → shift creation | ✅ BUILT | clientShiftRequestWorkflow.ts |
| ChatActionBlock new types (4 added) | ✅ BUILT | ChatActionBlock.tsx |
| Monthly scheduling cron | ⏳ Deferred | Next sprint |
| Client confirmation email post-assign | ⏳ Deferred | Wires to invoice_lifecycle |

---

## PIPELINE 1 — ZERO-TO-LIVE TENANT ONBOARDING

### Overview
New org subscribes via Stripe → platform provisions everything they need
to go live → mandatory 5-step checklist gates dashboard access until complete.

### Trigger
```
Stripe event: customer.subscription.created
Handler:      server/services/billing/stripeEventBridge.ts
              → handleSubscriptionCreated()
              → workspaceProvisioningService.provisionNewTenant(workspaceId, name)
```

### Step-by-Step Pipeline

**STEP 1 — TRIGGER (Stripe webhook)**
```
Input:  Stripe Subscription object { customer, id, status }
Action: getWorkspaceByStripeCustomer(customerId)
        db.update(workspaces).set({ subscriptionStatus, stripeSubscriptionId })
Output: workspace record updated
Next:   provisionNewTenant() called
```

**STEP 2 — VALIDATE & MARK PENDING**
```
File:   server/services/workspaceProvisioningService.ts
Action: UPDATE workspaces SET onboarding_status = 'pending_setup'
Output: workspace.onboarding_status = 'pending_setup'
Gate:   OnboardingGate.tsx reads this — dashboard blocked for owners
```

**STEP 3 — PROCESS: Create Onboarding Checklist**
```
Table:  tenant_onboarding_steps
Insert: 5 rows (idempotent — ON CONFLICT DO NOTHING)

Step 1: state_selection   | required=true  | 'Select your operating state'
Step 2: org_code          | required=true  | 'Choose your organization code'
Step 3: license_number    | required=true  | 'Enter your company license number'
Step 4: overage_limits    | required=true  | 'Set AI usage overage limits'
Step 5: import_data       | required=false | 'Import existing employee data (optional)'

Status on create: 'pending' (except import_data → 'skipped')
```

**STEP 4 — PROCESS: Provision Default Rooms**
```
Table:  conversations
Insert: 3 rooms (idempotent — ON CONFLICT (workspace_id, slug) DO NOTHING)

Room 1: id={workspaceId}-general         | slug=general          | is_private=false
Room 2: id={workspaceId}-ops             | slug=ops              | is_private=false
Room 3: id={workspaceId}-trinity-command | slug=trinity-command  | is_private=true
        → #trinity-command: managers and owners ONLY
        → SARGE and Trinity are both active here
```

**STEP 5 — PROCESS: SARGE Auto-Joins All Rooms**
```
Table:  conversation_participants
Insert: 3 rows — one per room (idempotent — ON CONFLICT DO NOTHING)
        user_id = 'helpai-bot' (SARGE's DB identity)
Result: SARGE is live in #general, #ops, and #trinity-command from minute one
```

**STEP 6 — NOTIFY: Welcome Notification to Owner**
```
Table:  notifications
Insert: 1 row targeting workspace owner/super_admin
        title: 'Welcome to CoAIleague!'
        message: 'Your workspace is ready. Complete the 5-step setup to unlock your dashboard. SARGE is online and ready to help.'
        priority: 'high'
```

**STEP 7 — CONFIRM: Broadcast to Dashboard**
```
WebSocket event:  workspace_provisioned
Payload: {
  type: 'workspace_provisioned',
  data: {
    workspaceId: string,
    companyName: string,
    requiresSetup: true
  }
}
Client effect: Dashboard detects requiresSetup → OnboardingGate shows SetupChecklist
```

### Frontend Gate: OnboardingGate.tsx
```
File:    client/src/components/onboarding/OnboardingGate.tsx
Logic:
  1. useAuth() → check if user is owner/super_admin/admin
  2. If NOT owner → render children (pass through, no gate)
  3. If owner → GET /api/smart-onboarding/tenant → fetch step statuses
  4. Filter: steps where required=true AND status NOT IN ('completed','skipped')
  5. If incomplete.length === 0 → render children (dashboard unlocked)
  6. If incomplete.length > 0  → render <SetupChecklist steps={...} />

API used: GET /api/smart-onboarding/tenant (existing intelligentOnboardingRoutes.ts)
```

### Frontend Page: SetupChecklist.tsx
```
File:   client/src/pages/onboarding/SetupChecklist.tsx
Route:  Rendered by OnboardingGate — not a direct URL route

UI:
  Header: TrinityOrbitalAvatar (size=64, state=idle) + progress bar
  Body:   One Card per step, sorted by step_number
  Active step: expanded with input control + Complete/Skip buttons
  Done steps: collapsed, green checkmark

Step controls by type:
  state_selection → <select> dropdown (US states list)
  org_code        → <Input> placeholder "e.g. STATEWIDE"
  license_number  → <Input> placeholder "e.g. C11608501"
  overage_limits  → <Input> placeholder "e.g. 50" (dollar amount)
  import_data     → Optional, Skip button only

On complete:
  POST /api/smart-onboarding/tenant/steps/:stepKey/complete
  Body: { value: string }
  On success: invalidate /api/smart-onboarding/tenant query → Gate re-evaluates

On all required complete: Gate passes through → full dashboard renders
```

### State After Full Onboarding
```
workspace.onboarding_status:   'active'
workspace.state:               'TX' (or selected state)
workspace.org_code:            'STATEWIDE' (chosen by owner)
workspace.license_number:      'C11608501' (entered by owner)
tenant_onboarding_steps:       all 5 rows status='completed'|'skipped'
state_regulatory_config:       row exists for workspace.state
regulatory_knowledge_base:     seeded for state + FEDERAL
rooms:                         #general, #ops, #trinity-command exist
conversation_participants:     SARGE in all 3 rooms
```

---

## PIPELINE 2 — PREDICTIVE SCHEDULE APPROVAL

### Overview
Trinity drafts AI shifts → stays in 'draft' until owner reviews and approves
→ approval publishes all shifts → officers notified via ChatDock + push.

### Trigger
```
Manual:    Owner clicks "Approve All" in dashboard or ChatActionBlock
Automatic: Will be cron-triggered when schedulingCronService.ts is built
Current:   Manager calls POST /api/schedule-approval/approve
```

### Step-by-Step Pipeline

**STEP 1 — TRIGGER: Check Pending**
```
Endpoint: GET /api/schedule-approval/pending
Auth:     requireAuth + ensureWorkspaceAccess + requireManager
Response: {
  success: true,
  pending_count: number,       // Total draft AI shifts
  earliest_shift: timestamp,   // First shift start time
  latest_shift: timestamp,     // Last shift start time
  avg_confidence: decimal,     // 0.00-1.00 average AI confidence
  low_confidence_count: number // Shifts with confidence < 0.7
}
Source:   shifts WHERE status='draft' AND ai_generated=true
```

**STEP 2 — VALIDATE: Owner Reviews**
```
Dashboard widget / ChatActionBlock type='schedule_approve' shows:
  - Pending count
  - Average confidence score
  - Low confidence count (review these manually)
  - Approve All button | Review First button

If avg_confidence >= 0.8: safe to approve all
If low_confidence_count > 0: owner should review flagged shifts first
```

**STEP 3 — PROCESS: Bulk Publish**
```
Endpoint: POST /api/schedule-approval/approve
Body:     { scheduleId?: string, shiftIds?: string[] }
          (omit both = approve ALL pending AI drafts)
Auth:     requireAuth + ensureWorkspaceAccess + requireManager

SQL executed:
  Case A (specific shifts):  UPDATE shifts SET status='published'
                              WHERE workspace_id=$1 AND id=ANY($2) AND status='draft'
  Case B (by scheduleId):    UPDATE shifts SET status='published'
                              WHERE workspace_id=$1 AND schedule_id=$2 AND status='draft'
  Case C (approve all):      UPDATE shifts SET status='published'
                              WHERE workspace_id=$1 AND status='draft' AND ai_generated=true

Returns: { success: true, publishedCount: number }
```

**STEP 4 — REJECT PATH (if owner rejects)**
```
Endpoint: POST /api/schedule-approval/reject
Body:     { shiftIds: string[], reason?: string }
SQL:      UPDATE shifts SET status='cancelled', denial_reason=$3
          WHERE workspace_id=$1 AND id=ANY($2) AND status='draft'
Returns:  { success: true, rejectedCount: number }
```

**STEP 5 — PROPAGATE: Broadcast to Workspace**
```
WebSocket event:  schedule_published
Server fires:     broadcastToWorkspace(workspaceId, { type: 'schedule_published', data: {...} })
Payload: {
  type: 'schedule_published',
  data: {
    publishedCount: number,
    approvedBy: string,       // user.id of approving manager
    message: string           // "N shifts published. Officers will be notified."
  }
}
```

**STEP 6 — NOTIFY: ChatDock + Officer Push**
```
Client handler (use-chatroom-websocket.ts):
  case 'schedule_published':
    → dispatchTrinityState('success')
    → Insert SARGE message into shift room:
        { senderName: 'SARGE', message: sp.message, isBot: true }
    → setTimeout → dispatchTrinityState('idle') after 2s

Next step (deferred — Wave 23B):
  → notificationDeliveryService sends push + SMS per affected officer
  → "Your schedule is posted. {N} shifts assigned for {month}."
```

**STEP 7 — CONFIRM**
```
Dashboard widget re-queries GET /api/schedule-approval/pending
pending_count returns 0 → approval banner clears
Officers see their schedule in the scheduling view
```

---

## PIPELINE 3 — CLIENT SHIFT REQUEST (INBOUND EMAIL)

### Overview
Client emails a shift request → Trinity's email processor parses it →
workflow creates a draft shift → backfill SMS to officers → owner billing alert.

### Trigger
```
Inbound email to: incidents@ | support@ | calloffs@ (Resend inbound webhook)
Handler chain:    Resend webhook → trinityInboundEmailProcessor.ts
                  → workRequestParser.classifyEmail()
                  → workRequestParser.parseWorkRequest()
                  → executeClientShiftRequestWorkflow() [if confidence >= 0.7]
```

### Step-by-Step Pipeline

**STEP 1 — TRIGGER: Email Arrives**
```
Source:   Resend inbound webhook (POST /api/inbound-email)
Payload:  Raw email { from, subject, body, attachments }
Action:   workRequestParser.classifyEmail(emailData)
Returns:  {
  isWorkRequest: boolean,
  confidence: number,       // 0.0-1.0
  requestType: 'new_shift' | 'modification' | 'cancellation' | 'inquiry',
  suggestedPriority: 'high' | 'medium' | 'low'
}
Gate:     confidence >= 0.7 → auto-process
          confidence < 0.7  → Trinity emails client asking to confirm details
```

**STEP 2 — VALIDATE: Parse Work Request**
```
Action:  workRequestParser.parseWorkRequest(emailData)
Returns: ParsedWorkRequest {
  success: boolean,
  confidence: number,
  requestedDate: Date,
  startTime: string,        // "14:00"
  endTime: string,          // "22:00"
  guardsNeeded: number,
  positionType: 'armed' | 'unarmed' | 'supervisor' | 'manager',
  location: {
    address: string,
    city: string,
    state: string,
    zipCode: string,
    coordinates?: { lat: number, lng: number }
  },
  clientInfo: {
    name?: string,
    email: string,
    phone?: string,
    companyName?: string
  },
  specialRequirements: string[],
  urgency: 'normal' | 'urgent' | 'critical',
  notes: string
}
```

**STEP 3 — PROCESS: Match Client**
```
File:   server/services/trinity/workflows/clientShiftRequestWorkflow.ts
SQL:    SELECT id, name, billing_rate FROM clients
        WHERE workspace_id=$1 AND (
          contact_email ILIKE $2 OR billing_email ILIKE $2 OR name ILIKE $3
        ) LIMIT 1

Result A: Client found → clientId set, billing_rate from contract
Result B: Client not found → clientId=null, billing_rate=null (owner must confirm)
```

**STEP 4 — PERSIST: Create Draft Shift**
```
Table:  shifts
INSERT: {
  workspace_id:   workspaceId,
  client_id:      clientId (may be null),
  title:          "Armed Security — {clientName}" | "Unarmed Security — {clientName}",
  start_time:     parsed date + startTime,
  end_time:       parsed date + endTime,
  status:         'draft',
  ai_generated:   true,
  bill_rate:      clientRow.billing_rate (may be null),
  description:    parsed notes / special requirements
}
Returns: { id: shiftId }
```

**STEP 5 — PROCESS: Send Shift Offers**
```
Action:  sendShiftOffers(workspaceId, shiftId, guardsNeeded)
Source:  server/services/trinityVoice/trinityShiftOfferService.ts (existing)
Result:  Officers matched by: availability, proximity, license type (armed/unarmed),
         reliability score, recent calloff history
SMS sent: "New shift available {date} {time} {location}. Reply YES to accept."
Tracking: shift_offers table — one row per officer contacted
Returns: { offersSent: number }
```

**STEP 6 — PROPAGATE: Owner Billing Alert**
```
WebSocket event:  client_shift_request_received
Payload: {
  type: 'client_shift_request_received',
  data: {
    shiftId: string,
    clientName: string,
    clientEmail: string,
    requestedDate: ISO string,
    guardsNeeded: number,
    positionType: string,
    urgency: 'normal' | 'urgent' | 'critical',
    offersSent: number,
    message: "📋 New client request: {client} needs {N} officers on {date}. {N} officers notified."
  }
}
```

**STEP 7 — NOTIFY: Owner Notification**
```
Table:    notifications
Target:   users WHERE workspace_id=$1 AND role IN ('owner','super_admin') LIMIT 1
Title:    'New Client Shift Request'
Message:  '{clientName} needs {N} officer(s) on {date}. Review and confirm billing rate.'
Priority: 'urgent' (if urgency=critical) | 'high' (otherwise)
Metadata: { shiftId, clientId, billRate }
```

**DEFERRED — STEP 8: Client Confirmation Email**
```
Status:   ⏳ Not yet built
Trigger:  When first officer accepts shift offer (shift_offers.status = 'accepted')
Action:   Resend email to client.contact_email
Content:  "Confirmed: {N} officer(s) for {date} {time} at {location}"
Wire:     Extend trinityShiftOfferService.onOfferAccepted() → send confirmation
```

---

## PIPELINE 4 — SARGE CALLOFF FEEDBACK LOOP

### Overview
Officer reports calloff → SARGE immediately shows "Executing..." in the shift room
→ calloff pipeline runs → completion message replaces the bubble.
Full visibility in ChatDock — no silent processing.

### Trigger Sources
```
Source A: SMS keyword "CALLOFF" → smsAutoResolver → calloffCoverageWorkflow
Source B: Voice extension 4→2   → voiceOrchestrator → calloffCoverageWorkflow
Source C: SARGE chat command    → helpAIBotService (case 'calloff_shift') → calloffCoverageWorkflow
Source D: Manager marks absent  → UI action → calloffCoverageWorkflow
Source E: Trinity action        → workflowOrchestrator → calloffCoverageWorkflow
```

### WebSocket Event Chain

**EVENT 1 — sarge_executing** *(fires before STEP 4 PROCESS)*
```
Server fires:  broadcastToWorkspace(workspaceId, {...})
When:          Immediately after shift is located and validated,
               BEFORE offers are sent
Payload: {
  type: 'sarge_executing',
  data: {
    action: 'calloff_coverage',
    message: 'Processing calloff for shift... Finding coverage.'
  }
}

Client handler (use-chatroom-websocket.ts):
  case 'sarge_executing':
    → dispatchTrinityState('thinking')
    → insert into messages: {
        id: `exec-${Date.now()}`,
        message: ex.message,       // "Processing calloff..."
        senderName: 'SARGE',
        senderId: 'helpai-bot',
        senderType: 'bot',
        isBot: true,
        isExecuting: true,         // FLAG — identifies this bubble for replacement
        metadata: { executing: true, action: 'calloff_coverage' }
      }

UI effect: Gold SARGE typing bubble appears with action message
```

**EVENT 2 — sarge_calloff_handled** *(fires before STEP 7 NOTIFY)*
```
Server fires:  broadcastToWorkspace(workspaceId, {...})
When:          After offers are sent, before supervisor SMS
Payload: {
  type: 'sarge_calloff_handled',
  data: {
    action: 'calloff_complete',
    message: '✅ Coverage initiated: 3 officers notified. Supervisor alerted.'
            | '⚠️ No available officers found. Supervisor escalation triggered.',
    offersSent: number
  }
}

Client handler (use-chatroom-websocket.ts):
  case 'sarge_calloff_handled':
    → setMessages(prev => prev.map(m =>
        m.isExecuting
          ? { ...m, message: cf.message, isExecuting: false }   // REPLACE bubble
          : m
      ))
    → dispatchTrinityState('success')
    → setTimeout → dispatchTrinityState('idle') after 2s

UI effect: Executing bubble transforms in-place → result message
           No disappear/reappear. Same bubble, content replaced.
```

### Full Calloff Pipeline State Machine
```
STEP 1  TRIGGER        → logWorkflowStart()
STEP 2  FETCH          → locate shift (explicit shiftId OR officer's next ≤6hrs)
STEP 3  VALIDATE       → shift exists, belongs to officer, is schedulable
── EVENT: sarge_executing broadcast ──────────────────────────────────
STEP 4  PROCESS        → sendShiftOffers() → shortlist qualified replacements
STEP 5  MUTATE         → shift.status = 'calloff'
                         replacement shift created → status='draft'
                         shift_offers rows created → status='sent'
                         SMS sent to each candidate
STEP 6  CONFIRM        → verify DB mutation, count outstanding offers
── EVENT: sarge_calloff_handled broadcast ────────────────────────────
STEP 7  NOTIFY         → supervisor SMS + in-app
                         client SMS (if client.smsNotifications = true)
                         audit trail appended to workflow record

SLA:    15 minutes. scanStaleCalloffWorkflows() sweeps every few minutes.
        At 15min if shift still unfilled → escalate to supervisor.
```

### SARGE Deliberation Events (separate from execution)
```
EVENT: sarge_deliberating
  When:    SARGE detects hard-escalation topic (UoF, termination, legal, payroll)
  Payload: { type: 'sarge_deliberating', data: { roomId, query } }
  Client:  Insert deliberating bubble with amber "Deliberating with Trinity···" label
  Timeout: 8 seconds max — SARGE proceeds with best judgment if Trinity unreachable

EVENT: sarge_deliberation_complete
  When:    Trinity responds OR 8s timeout
  Payload: { type: 'sarge_deliberation_complete', data: { roomId } }
  Client:  Remove deliberating bubble — real answer arrives via standard message event
```

---

## CHATACTIONBLOCK — ALL 9 TYPES

**File:** `client/src/components/chatdock/ChatActionBlock.tsx`

| Type | Color | Description | Actions |
|---|---|---|---|
| `approval_button` | Blue | Generic approve/reject button | approve, reject |
| `shift_offer` | Green | Shift pickup offer for officer | accept, decline |
| `document_upload` | Gray | Request document from officer | upload |
| `coi_request` | Orange | Certificate of Insurance request | submit |
| `poll` | Purple | Question with multiple choice | select option |
| `license_verify` | Amber | Pre-filled TOPS deep-link card | open URL |
| `shift_fill` | Green | Coverage confirmation card | informational |
| `schedule_approve` | Blue | AI draft schedule review | approve_all, review |
| `compliance_alert` | Red | Compliance flag with details | acknowledge |

### license_verify Payload Shape
```typescript
{
  type: 'license_verify',
  props: {
    body: string,                          // Explanation text
    links: Array<{ url: string; label: string; note: string }>,
    warning?: string                       // e.g. "License expired 14 days ago"
  }
}
```

### schedule_approve Payload Shape
```typescript
{
  type: 'schedule_approve',
  props: {
    body: string,                         // e.g. "12 shifts drafted for June. Avg confidence: 0.87"
    pendingCount: number,
    avgConfidence: number,
    lowConfidenceCount: number
  }
}
// onAction('approve_all') → POST /api/schedule-approval/approve
// onAction('review')      → navigate to /schedule?filter=draft
```

### compliance_alert Payload Shape
```typescript
{
  type: 'compliance_alert',
  props: {
    body: string,
    flags: Array<{
      code: string,                       // e.g. "ARMED_POST_EXPIRED_LICENSE"
      description: string,
      severity: 'critical' | 'warning'
    }>
  }
}
// onAction('acknowledge') → logs acknowledgment to compliance_documents
```

---

## ROUTE TOPOLOGY — ALL WAVE 23 ROUTES

### New Server Routes

```
POST /api/stripe/webhook → stripeEventBridge.handleEvent()
                        → case 'customer.subscription.created'
                        → workspaceProvisioningService.provisionNewTenant()

GET  /api/schedule-approval/pending    → scheduleApprovalRoutes.ts
     Auth: requireAuth + ensureWorkspaceAccess + requireManager
     Response: { pending_count, earliest_shift, avg_confidence, low_confidence_count }

POST /api/schedule-approval/approve    → scheduleApprovalRoutes.ts
     Auth: requireAuth + ensureWorkspaceAccess + requireManager
     Body: { scheduleId?, shiftIds? }
     Response: { success, publishedCount }
     Side effect: broadcastToWorkspace('schedule_published')

POST /api/schedule-approval/reject     → scheduleApprovalRoutes.ts
     Auth: requireAuth + ensureWorkspaceAccess + requireManager
     Body: { shiftIds, reason? }
     Response: { success, rejectedCount }

[Internal] workspaceProvisioningService.provisionNewTenant(workspaceId, name)
           Not a public route — called by stripeEventBridge
```

### New Frontend Routes

```
/onboarding/setup → client/src/pages/onboarding/SetupChecklist.tsx
                    Rendered by OnboardingGate when setup incomplete
                    Not a direct URL — injected by OnboardingGate wrapper
```

### Existing Routes — Now Fully Connected

```
GET /api/smart-onboarding/tenant              → intelligentOnboardingRoutes.ts
    Now consumed by: OnboardingGate.tsx (gating logic)

POST /api/smart-onboarding/tenant/steps/:key/complete
    Now consumed by: SetupChecklist.tsx (step completion)

POST /api/inbound-email (Resend webhook)      → trinityInboundEmailProcessor.ts
    Now wires to: clientShiftRequestWorkflow.executeClientShiftRequestWorkflow()
    When:         parsed email confidence >= 0.7

[All existing calloff workflow routes unchanged]
[All existing schedule routes unchanged]
```

---

## TRINITY'S CAPABILITY AWARENESS

**File:** `server/services/ai-brain/platformCapabilitiesService.ts`

Injected into every Trinity response as the 4th context block in `enrichedSystemPrompt`:

```
systemPrompt (base personality)
+ regulatoryContextBlock   (state law — Wave 20 RKE)
+ webSearchContext          (Gemini grounding — Wave 22)
+ platformCapabilitiesContext (this — always present)
```

Trinity now knows she can trigger all 6 Phase 20 workflows, the full action registry, the shift lifecycle, the SARGE/Trinity escalation boundary, and the data integrity rules. She can trace any operational situation through its full pipeline without being explicitly told each step.

---

## DEPLOYMENT CRASH LAWS (from SYSTEM_MAP.md — summary)

```
LAW 1: No literal newlines inside double-quoted strings (.join("\n") not .join("↵"))
LAW 2: No standalone Drizzle index exports — indexes inside pgTable() third arg only
LAW 3: No middleware (requireAuth, ensureWorkspaceAccess) used without explicit import

PRE-PUSH CHECKLIST:
  grep -rPln 'join\("[^"]*\n' client/src/         → must return 0 results
  grep -rn 'export const.*Indexes.*=' shared/schema/ → must return 0 results
  Scan routes for middleware used without import     → must return 0 results
  node build.mjs                                    → must show ✅ Server build complete
  npm run build                                     → must show ✓ built
  npx vitest run                                    → must show 0 failed
```

---

*WAVES 22A & 22B SECURED. TRINITY'S BLUEPRINT IS READY FOR INJECTION.*

---

## ERROR STATES & UNHAPPY PATHS

### Standard Error Response Envelope (ALL routes)

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description (sanitized in production)"
  },
  "requestId": "uuid",
  "workspaceId": "ws-xxx",
  "timestamp": "2026-05-04T12:00:00.000Z",
  "details": [...]
}
```

### HTTP Status Code Dictionary

| Code | `code` value | When it fires |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema validation fails — `details` array has field-level errors |
| 401 | `UNAUTHORIZED` | No valid session token / token expired |
| 402 | `PAYMENT_REQUIRED` | AI spend cap hit (`maxOverageLimitCents` exceeded) |
| 403 | `FORBIDDEN` | Insufficient role for the operation |
| 403 | `WORKSPACE_INACTIVE` | Workspace suspended or in grace period |
| 403 | `ORG_ISOLATION_VIOLATION` | Cross-tenant data access attempted |
| 404 | `NOT_FOUND` | Resource not found in this workspace |
| 404 | `WORKSPACE_NOT_FOUND` | Workspace doesn't exist or token mismatch |
| 408 | `REQUEST_TIMEOUT` | Request exceeded time limit |
| 409 | `CONCURRENT_OPERATION` | Workspace locked by another operation |
| 409 | `DB_CONSTRAINT` | DB constraint violation (overlap, unique, FK) |
| 429 | `RATE_LIMITED` | Too many requests / AI token rate limit |
| 429 | `ORG_AI_LIMIT_EXCEEDED` | Per-org AI token limit for the period |
| 500 | `INTERNAL_ERROR` | Unhandled server error (message sanitized in prod) |
| 503 | `DATABASE_CIRCUIT_OPEN` | DB circuit breaker open — retry after backoff |

---

### PIPELINE 1 — Tenant Onboarding Unhappy Paths

**E1.1 — Stripe card declined during subscription**
```
Trigger:  Stripe fires invoice.payment_failed
Handler:  stripeEventBridge.handlePaymentFailed()
State:    workspace.subscriptionStatus = 'past_due'
Gate:     WorkspaceInactiveError thrown on all API requests → 403 WORKSPACE_INACTIVE
UI:       Dashboard shows "Payment required" banner
Recovery: Stripe retries (3 attempts). On success → status = 'active', gate lifts.
          Owner receives email from Stripe (not CoAIleague — Stripe handles dunning).
SARGE:    Does NOT message officer about billing — that's owner-only information.
```

**E1.2 — Workspace provisioning partial failure**
```
Scenario: Provisioning service fails mid-way (e.g., room insert succeeds, SARGE join fails)
Recovery: All inserts use ON CONFLICT DO NOTHING — re-running provisionNewTenant() is safe
          stripeEventBridge re-fires on Stripe webhook retry (Stripe retries 3x)
Log:      Each sub-step wrapped in .catch() with warn log — never throws to caller
DB state: Whatever succeeded stays. Next run fills the gaps idempotently.
```

**E1.3 — Owner skips setup checklist and tries to use dashboard**
```
Gate:     OnboardingGate.tsx blocks dashboard render
          Returns <SetupChecklist> until all required steps complete
HTTP:     No 4xx — purely frontend gate
If owner finds API directly: all endpoints still work (checklist is advisory gate)
          This is intentional — power users can bypass UI gate via direct API calls
```

---

### PIPELINE 2 — Schedule Approval Unhappy Paths

**E2.1 — No AI-drafted shifts exist when owner tries to approve**
```
GET /api/schedule-approval/pending → { pending_count: 0, ... }
UI: Approval widget shows "No pending AI drafts" — no approve button rendered
```

**E2.2 — Shift already published by the time approve fires**
```
SQL: WHERE status='draft' — already-published shifts are silently skipped
Response: { publishedCount: N } where N may be less than expected
No error thrown — idempotent by design
```

**E2.3 — Manager tries to approve without requireManager role**
```
Response: 403 FORBIDDEN
Body: { error: { code: "FORBIDDEN", message: "Insufficient permissions" } }
```

---

### PIPELINE 3 — Client Shift Request Unhappy Paths

**E3.1 — Inbound email confidence below 0.7**
```
State:    Email classified but not auto-processed
Action:   Trinity emails client asking to clarify:
          "We received your request but need a few details: date, time, guard count."
No shift created yet. Waiting for client reply.
On reply: re-process via workRequestParser. If confidence >= 0.7 → create shift.
```

**E3.2 — Client email doesn't match any client record**
```
State:    clientId = null, billing_rate = null
Shift:    Created with client_id=null, status='draft'
Owner:    Notified — "New request from unknown sender: {email}. Please assign to a client."
Recovery: Owner assigns client in UI → billing rate populated → shift moves to scheduled
```

**E3.3 — No available officers for shift offers**
```
sendShiftOffers() returns { offersSent: 0 }
Owner broadcast: "No available officers for this date/time. Manual assignment required."
Shift remains at status='draft'
Trinity does NOT auto-escalate the bill rate to attract officers — that's a human decision
```

**E3.4 — Resend inbound webhook fails**
```
Resend retries delivery (3x with backoff)
If all 3 fail: email is lost — no recovery unless client re-sends
Mitigation: Resend dashboard shows failed webhooks for manual inspection
```

---

### PIPELINE 4 — SARGE Calloff Unhappy Paths

**E4.1 — Shift not found for officer's calloff**
```
STEP 2 FETCH fails: no upcoming shift in next 6 hours
SARGE response: "I don't see a shift for you in the next 6 hours. Which shift are you calling off from? Provide the date and time."
Workflow: not started (no workflowId created)
```

**E4.2 — No available replacements**
```
sendShiftOffers() returns { offersSent: 0 }
sarge_calloff_handled broadcasts: "⚠️ No available officers found. Supervisor escalation triggered."
Supervisor SMS: "CALLOFF ALERT: No coverage found for [Shift] at [Time]. Manual assignment required."
Shift remains status='calloff' — NOT auto-cancelled (client still needs coverage)
```

**E4.3 — SLA (15 minutes) breached without fill**
```
scanStaleCalloffWorkflows() detects: workflowAge > 15min AND shift.status = 'calloff'
Action: supervisor SMS escalation (second level)
        If supervisor unreachable after 30min: owner SMS
ChatDock: SARGE posts "⚠️ ALERT: [Shift] has been uncovered for 20 minutes."
Shift: remains 'calloff' — never auto-cancelled
```

**E4.4 — Officer submits calloff for another officer's shift**
```
STEP 3 VALIDATE: shift.employeeId !== requesting employeeId
Response: workflow not started
SARGE: "That shift isn't assigned to you. Are you calling off for someone else? Only supervisors can mark another officer as absent."
```

**E4.5 — sarge_executing broadcast fails (no WebSocket connection)**
```
broadcastToWorkspace() wrapped in .catch(() => {}) — non-blocking
Workflow continues regardless of broadcast success
Officer may not see the typing bubble — shift is still processed correctly
The calloff is never blocked by a WebSocket failure
```

---

### GENERAL UNHAPPY PATHS

**G1 — Offline guard's DAR fails to sync**
```
Scenario: Guard completes a DAR on mobile while offline
Client:   DAR stored in op-sqlite local store with optimistic_send=true
On reconnect: WebSocket fires pending sends from local queue
If conflict: server timestamp wins — last-write-wins
If DAR table insert fails: 409 DB_CONSTRAINT returned
Client:   Error state shown → "Sync failed. Tap to retry."
Data:     Never silently lost — always in local store until confirmed by server
```

**G2 — Stripe webhook received out of order**
```
Stripe can deliver events out of order (subscription.updated before subscription.created)
Handler: each event is idempotent — re-processing subscription.created twice is safe
State machine: subscriptionStatus field tracks current known state
If subscription.deleted received before payment.failed: deletion wins (Stripe is authoritative)
```

**G3 — AI metering DB write fails**
```
meteredGemini catches the credit write failure
Response: AI call is still returned (never blocks the user response)
Log: warn level — "Credit deduction failed (non-blocking)"
Recovery: Billing reconciliation sweep catches undercharged sessions in next cycle
```

**G4 — Guard card expired while officer is on an active shift**
```
Pre-audit engine catches this on next run (daily sweep)
Flag: ARMED_POST_EXPIRED_LICENSE → CRITICAL
Owner notification: "Officer X's license expired during shift on {date}"
Action: Manual review required — platform does not auto-remove officer from active shift
Reason: Removing officer from live shift creates a safety gap (no coverage)
        Human manager decides: pull officer or let shift complete + correct after
```

---

## PIPELINE 5 — PAYROLL & TIME-TRACKING

### Time Entry Sources

```
Source A: NFC/QR checkpoint scan → patrol_scan event → auto clock-in (in_progress shift)
Source B: Manual clock-in via app → POST /api/timesheets/clock-in
Source C: Manager manual entry  → POST /api/timesheets (requireManager)
Source D: Trinity auto-clock-in → triggered by missed_clockin workflow (supervisor notified first)
```

### Payroll Pipeline (closed-loop)

```
STEP 1 TRIGGER: Payroll period set (manager sets start/end dates)
STEP 2 COLLECT: All time_entries WHERE period_start <= clockIn < period_end
STEP 3 VALIDATE:
  - OT calculation: hours > 40/week → 1.5x rate (FLSA)
  - Anomaly detection: trinityPayrollAnomalyService flags outliers
  - Missing entries: officers with shifts but no time_entry flagged
STEP 4 APPROVE: requireManager approves individual timesheets
STEP 5 CLOSE PERIOD: POST /api/payroll/period/close (requireManager)
  - status changes: period → 'closed'
  - Triggers: invoice_lifecycle workflow (if auto-invoice enabled)
STEP 6 PAY STUB: pdfEngine.generatePayStub() → stored in generated_documents
STEP 7 DIRECT DEPOSIT: Plaid Transfer ACH batch → notified via email/push
```

### Payroll Unhappy Paths

```
P1 — Time entry for a cancelled shift:
     entry.shiftId → shift.status = 'cancelled' → flag for manager review
     Do not auto-delete — manager decides if work was actually performed

P2 — Clock-out time before clock-in:
     Zod validation: clockOut > clockIn → 400 VALIDATION_ERROR
     { error: { code: "VALIDATION_ERROR", details: [{ field: "clockOut", message: "Must be after clock-in" }] } }

P3 — Payroll period closed with anomaly flags:
     trinityPayrollAnomalyService.flaggedEntries.length > 0
     → 409 CONCURRENT_OPERATION: "Resolve N anomalies before closing period"
     Manager must clear each flag → then close succeeds

P4 — ACH transfer fails (Plaid):
     Plaid returns error → payment not sent
     Notification to owner: "Direct deposit failed for {N} employees. Retry or issue paper check."
     Time entry status reverts to 'approved' (not 'paid')
```

---

## PIPELINE 6 — INVOICING & BILLING

### Invoice Lifecycle (closed-loop)

```
STEP 1 TRIGGER: time_entry.status → 'approved' (manager approves timesheet)
STEP 2 FETCH:   workspace auto_invoice flag, client billing settings, contract rate
STEP 3 PROCESS: Calculate: hours × billRate (not payRate — client-facing)
STEP 4 CREATE:  INSERT INTO invoices (status='draft', clientId, workspaceId, lineItems)
STEP 5 SEND:    Resend email to client.billingEmail with PDF attachment
                pdfEngine.generateInvoice() → stored in generated_documents
STEP 6 CONFIRM: invoice.status → 'sent'
STEP 7 PAID:    Stripe invoice.paid webhook → invoice.status = 'paid'
                resetMonthlyOverage(workspaceId) fires
```

### Stripe Metering & Spend Caps

```
AI Usage Metering:
  Every Gemini call goes through meteredGemini → aiMeteringService
  Credits deducted from workspace.aiCreditsUsed
  At 80% of maxOverageLimitCents: owner alert notification
  At 100%: 402 PAYMENT_REQUIRED returned for all AI calls
           Panic/emergency alerts always bypass the cap

Hard Cap by Tier:
  Free/Trial: hardCapK set (e.g., 1000 tokens) → enforced strictly
  Paid tiers: hardCapK = null → cap is the maxOverageLimitCents only

Overage Reset:
  Fires on: Stripe invoice.paid webhook → resetMonthlyOverage(workspaceId)
  Resets: workspace.monthlyOverage = 0
```

### Invoice Unhappy Paths

```
I1 — Client billing email bounces:
     Resend delivery failure → webhook to /api/resend/webhook
     invoice.status stays 'sent' (not bounced — no bounce status)
     Owner notification: "Invoice delivery failed for {client}"

I2 — Stripe payment declined on invoice:
     Stripe fires invoice.payment_failed
     invoice.status → 'payment_failed'
     Owner and client notified via Stripe dunning emails
     AI cap enforced if workspace falls past_due

I3 — Timesheet approved with missing bill_rate:
     invoice calculation: hours × null → triggers validation error
     invoiceLifecycleWorkflow returns { success: false, reason: "No billing rate for client" }
     Owner notified: "Invoice not created — set billing rate for {client} first"
```

---

## PIPELINE 7 — REPORTING & COMPLIANCE

### PDF Document Generation

All PDFs generated by `server/services/pdfEngine.ts` (701 lines).
Every generated PDF logged in `generated_documents` table.

```
Document Types:
  generateUoFReport()      → Use of Force report (court-ready, includes Trinity narrative + RKE citations)
  generateDAR()            → Daily Activity Report (client-facing, shift timeline)
  generateDPSAuditPacket() → DPS audit export (Exhibit A: Roster, B: UoF, C: Shift logs)
  [pay stubs via payroll pipeline]

All PDFs include:
  → Header: workspace logo + company name
  → Footer: doc ID (UUID), page numbers, generation timestamp
  → Stored: generated_documents table (workspace_id, document_type, reference_id, file_url)
```

### DAR Signing & Acknowledgment

```
STEP 1: Shift completes → DAR auto-generated from shift timeline
STEP 2: Officer reviews in app → POST /api/dars/:id/acknowledge
STEP 3: DAR.status → 'acknowledged' + officer signature timestamp
STEP 4: Client portal: client sees DAR for their site (read-only)
STEP 5: Manager downloads signed PDF via pdfEngine.generateDAR()

Unhappy path — Officer offline when DAR needs signature:
  DAR stored locally (op-sqlite) → sync on reconnect
  If 24h pass without acknowledgment: SARGE reminds officer in ChatDock
  If 48h: supervisor escalation
```

### DPS Auditor Portal Access

```
STEP 1: Manager generates auditor link → POST /api/regulatory/auditor-portal/create-link
        Body: { label, expiresAt, allowedExhibits }
        Returns: { token, url: "https://coaileague.com/dps-portal/{token}" }

STEP 2: Manager shares URL with DPS auditor (email, text)

STEP 3: Auditor opens URL → /dps-portal/:token (no login required)
        GET /api/regulatory/auditor-portal/:token/meta → workspace + state config
        GET /api/regulatory/auditor-portal/:token/officers → redacted officer list
        GET /api/regulatory/auditor-portal/:token/use-of-force → UoF reports
        GET /api/regulatory/auditor-portal/:token/armed-shifts → shift logs

STEP 4: All financial data stripped by redaction middleware:
        Stripped: internalNotes, billingRate, payRate, ssn, bankAccount, privateNotes

Unhappy paths:
  Token expired: 401 UNAUTHORIZED + "Link has expired. Contact the organization for a new link."
  Token revoked: 401 UNAUTHORIZED + "This link has been revoked."
  Token not found: 404 NOT_FOUND
```

---

## TASK 4 — AI READ/WRITE DOCUMENTATION PROTOCOL

### Architectural Requirement: `update_system_map` Gemini Function

**Purpose:** Trinity autonomously keeps SYSTEM_MAP.md, WORKFLOW_MAP.md,
and RBAC_MATRIX.md current as she pushes patches to the platform.

**NOT BUILT YET — this is the architectural specification.**

```typescript
// Proposed Gemini Function Declaration (to be registered in actionRegistry)
{
  actionId: 'system.update_documentation',
  name: 'Update System Documentation',
  category: 'system',
  description: 'Update SYSTEM_MAP.md, WORKFLOW_MAP.md, or RBAC_MATRIX.md with new feature documentation. Trinity calls this after pushing any code change that adds routes, workflows, WebSocket events, or RBAC rules.',
}

// Gemini function call schema
{
  name: 'update_system_map',
  description: 'Update one of the platform documentation files',
  parameters: {
    file: 'SYSTEM_MAP.md' | 'WORKFLOW_MAP.md' | 'RBAC_MATRIX.md',
    section: string,        // Section heading to update/insert
    content: string,        // Markdown content for the section
    operation: 'append' | 'replace' | 'insert_after',
    after_section?: string, // For insert_after — which section precedes this one
  }
}
```

**Safety constraints Trinity MUST enforce before calling:**
1. Change must be documentation-only — no code modification via this function
2. Section heading must not duplicate an existing heading (Trinity checks first)
3. Content must follow the 7-step canonical pipeline format for workflow sections
4. RBAC changes require human review flag: `<!-- REQUIRES HUMAN REVIEW →` comment
5. All three files must remain valid Markdown (no broken syntax)

**Implementation requirements (Wave 24 — not yet built):**
- Git read/write access via a GitHub Personal Access Token (Railway env var)
- Trinity reads current file via `web.fetch_url(github_raw_url)`
- Trinity diffs her proposed section against current content
- If delta is documentation-only → auto-commit to `development` branch
- If delta includes code references → opens a PR for human review
- Commit message follows canonical format: `docs(trinity): {section} — auto-updated by Trinity`

---

## PIPELINE 8 — DOWNSTREAM USER ORIENTATION (Wave 23C)

### Overview
New user is invited → role-tailored email with magic link → accepts link →
icebreaker fires in ChatDock → user immediately interacts with SARGE or Trinity.

### Canonical 7-Step Pipeline

**STEP 1 — TRIGGER: Manager invites a user**
```
POST /api/invite (requireManager + ensureWorkspaceAccess)
Body: { email, firstName, lastName, workspaceRole }
```

**STEP 2 — VALIDATE: Duplicate + expiry check**
```
Check onboardingInvites: existing pending invite for this email?
If yes → 409 (existing invite, resend)
Generate: rawToken = crypto.randomBytes(32).hex()
Hash:     SHA-256(rawToken) → stored in DB (never raw)
Expiry:   7 days (inviteReaperService.ts sweeps daily)
```

**STEP 3 — PERSIST: Store invite**
```
INSERT INTO onboarding_invites:
  workspace_id, email, first_name, last_name, workspace_role,
  invite_token (SHA-256 hash), status='pending', expires_at
```

**STEP 4 — NOTIFY: Role-tailored welcome email**
```
workspaceRole check → select template:

  org_owner | co_owner | org_admin
    → onboardingEmailTemplates.ownerWelcome()
    → Contains: org code, Trinity intro, #trinity-command commands
      (/audit-keys, /dream-status, /promote, /innovate)

  employee | staff | contractor
    → onboardingEmailTemplates.guardWelcome()
    → Contains: mobile app links, SARGE intro, field commands
      (CALLOFF via SMS, /help, /status)
    → Bilingual if user.preferredLanguage = 'es'

  auditor
    → onboardingEmailTemplates.auditorWelcome()
    → Contains: read-only portal URL, DAR/UoF access, redaction notice

  client
    → emailService.sendClientWelcomeEmail() (existing)
    → Contains: portal URL, how to email shift requests to Trinity

  All emails:
    Zero-Trust notice: "This is a single-use secure link. Expires 7 days.
                        We never send passwords or PINs via email."
    Magic link: https://coaileague.com/accept-invite?token={rawToken}
```

**STEP 5 — USER ACCEPTS: Magic link clicked**
```
GET /accept-invite?token={rawToken} → accept-invite.tsx
POST /api/public/workspace-invite/accept (body: { token, password? })
  → SHA-256(rawToken) → match invite record
  → Create user account (if new) | link existing account
  → workspaceMembers insert (workspace_id, user_id, role)
  → invite status → 'accepted'
  → Return: { workspaceId, role, landingPage, firstLogin: true }
```

**STEP 6 — ICEBREAKER: Server-side ChatDock message**
```
Fires immediately after step 5, before response is returned to client.
Server-side (not client-side): guarantees delivery on poor connectivity.

Time-aware greeting: workspace timezone → hour → morning/afternoon/evening

Role routing:
  employee/staff/contractor → SARGE in #general room
    "Good [time], [Name]. SARGE here. I'm in this room 24/7.
     Type /help for field commands, or just tell me what you need."

  org_owner/co_owner/manager → Trinity in #trinity-command room
    "Good [time], [Name]. I'm Trinity. Your organization [name]
     is fully provisioned. [Org code]. Type /audit-keys to see what I can do."

  auditor → SARGE in #general room
    "Good [time], [Name]. Your read-only compliance access is active.
     I can help you locate DARs, UoF reports, and officer license status."

Delivery:
  broadcastToWorkspace('bot_message') → WebSocket (live users)
  INSERT INTO messages → DB (users who open room later)
Non-blocking: icebreaker failure never breaks invite acceptance (try/catch)
```

**STEP 7 — CONFIRM: User lands on dashboard**
```
Client redirect: getRoleHomeRoute(user) + '?firstLogin=1&org=...&role=...'
leaders-hub.tsx / role dashboards: toast notification (existing)
User sees: role dashboard + SARGE/Trinity message already in ChatDock
InviteReaper sweep (daily): expires any pending invites > 7 days old
```

### Security Constraints (Zero-Trust)
```
✅ rawToken: never stored in DB (only SHA-256 hash stored)
✅ Token: single-use (deleted/marked 'accepted' on first use)
✅ Expiry: 7 days enforced at DB layer + inviteReaperService daily sweep
✅ Email: never contains passwords, PINs, or raw session tokens
✅ HTTPS only: joinUrl always uses getAppBaseUrl() (https in production)
✅ Brute force: token is 32 random bytes = 256-bit entropy
```

### WebSocket Event
```
Event: bot_message
Payload: {
  roomId: string,
  message: string,
  senderName: 'SARGE' | 'Trinity',
  senderId: 'helpai-bot' | 'trinity-bot',
  isBot: true,
  metadata: { icebreaker: true, newUserId: string, role: string }
}
```

---

## PIPELINE 9 — SHADOW MODE & GLASS BREAK PROTOCOL (Wave 23D)

### Overview
Support agent needs to investigate a tenant issue → Shadow Mode session created →
Glass Break justification required → all actions immutably logged → tenant notified
→ session ends → audit trail complete.

### 7-Step Pipeline

**STEP 1 — TRIGGER: Agent initiates Shadow Mode**
```
POST /api/support/shadow/start
Auth: platform role support_agent (tech) | support_manager | sysop | deputy_admin | root_admin
Body: { targetWorkspaceId, justification }
Glass Break: justification REQUIRED — 400 JUSTIFICATION_REQUIRED if missing
```

**STEP 2 — VALIDATE**
```
platformRole in allowed list?  → proceed
justification.trim().length > 0?  → proceed
Else: 400 JUSTIFICATION_REQUIRED
```

**STEP 3 — PERSIST: Immutable session record**
```
INSERT INTO support_sessions:
  agent_id, agent_email, target_workspace_id, justification,
  started_at=NOW(), is_active=true, actions='[]'::jsonb
Returns: { sessionId }
```

**STEP 4 — PROPAGATE: Tenant notification**
```
broadcastToWorkspace(targetWorkspaceId, 'shadow_session_started')
Payload: { agentEmail, justification, sessionId, message }
Tenant owner sees: "A CoAIleague support agent entered your workspace"

universal_audit_trail INSERT:
  entity_type='support_session', action='shadow_session_started',
  actor_email=agentEmail, description=justification
```

**STEP 5 — UI: Orange border activates (client-side)**
```
Shadow session response → client stores sessionId in session storage
UI wrapper reads activeSession → applies orange (#F97316) border
Banner: "SHADOW MODE — You are acting as support in [Workspace]"
Any mutation button shows: "Log this action with justification"
```

**STEP 6 — LOG ACTIONS (Glass Break per action)**
```
POST /api/support/shadow/action
Body: { sessionId, action, entityType, entityId, justification, resultSummary }
Glass Break: justification required per action
UPDATE support_sessions SET actions = actions || newAction::jsonb
```

**STEP 7 — END SESSION**
```
POST /api/support/shadow/end
Body: { sessionId, targetWorkspaceId }
UPDATE support_sessions SET is_active=false, ended_at=NOW()
broadcastToWorkspace('shadow_session_ended') → tenant sees session ended
```

### WebSocket Events
```
shadow_session_started → { agentEmail, justification, sessionId, message }
shadow_session_ended   → { sessionId, endedAt, message }
support_mutation       → { action, entityType, entityId, agentEmail } (per action)
```

### Immutability Guarantee
```
support_sessions records are never deleted
actions column is append-only (JSONB array, only appended to)
universal_audit_trail is immutable by design
History available via GET /api/support/shadow/history (root/sysop only)
```

---

## PIPELINE 10 — TRINITY TRIAGE MAILROOM (Wave 23D)

### Overview
Ticket arrives (email or API) → Trinity classifies immediately → Co-Pilot Diagnostic
appended for tech tickets → RBAC routing set → agent opens ticket with full context.

### 7-Step Pipeline

**STEP 1 — TRIGGER**
```
Support ticket created (from inbound email, API, or ChatDock /ticket command)
trinityTriageService.triageTicket(ticketId, workspaceId, subject, description)
Called immediately after INSERT — before any agent notification
```

**STEP 2 — CLASSIFY**
```
Fast keyword classification (no API call for obvious cases):
  billing keywords → { category: 'billing', confidence: 0.85 }
  tech keywords    → { category: 'tech',    confidence: 0.85 }
  compliance       → { category: 'compliance', confidence: 0.80 }
  hr               → { category: 'hr', confidence: 0.80 }
  else             → { category: 'general', confidence: 0.60 }

If confidence < 0.80: Gemini refinement call (temperature=0.3, factual mode)
```

**STEP 3 — CO-PILOT DIAGNOSTIC (tech tickets only)**
```
SELECT * FROM error_logs WHERE workspace_id=$1 AND created_at > NOW() - 10min AND http_status >= 500
Returns last 5 server errors for the workspace
Appended to ticket.copilot_diagnostic before agent notification
Agent opens ticket → errors are already there, no manual digging
```

**STEP 4 — PERSIST**
```
UPDATE support_tickets SET:
  category = 'billing'|'tech'|'compliance'|'hr'|'general'
  trinity_summary = "Ticket classified as [TECH] with 85% confidence. Co-pilot pulled recent 500 errors."
  copilot_diagnostic = "2026-05-04T... 500 on /api/shifts/assign: DB timeout"
  priority = 'low'|'normal'|'high'|'urgent'
  triage_confidence = 0.85
  triage_completed_at = NOW()
  rbac_group = 'billing_agents'|'tech_agents'|'general_agents'
```

**STEP 5 — RBAC ROUTING**
```
rbac_group determines which agents see the ticket in their inbox:
  billing_agents  → support_agent(billing) + support_manager + root_admin + deputy_admin
  tech_agents     → support_agent(tech) + sysop + support_manager + root_admin + deputy_admin
  general_agents  → support_agent(general) + support_manager + root_admin + deputy_admin

If Trinity re-tags a ticket (billing→tech): ticket instantly moves queues, no forwarding
```

**STEP 6 — AGENT OPENS TICKET**
```
Agent sees pre-loaded context:
  [Trinity Summary] "This appears to be a billing dispute about overage charges..."
  [Co-Pilot Diagnostic] (tech only) Recent 500 errors for this workspace
  [Suggested Priority] HIGH
Agent does NOT need to reproduce the error from scratch
```

**STEP 7 — TOOLS RENDER BASED ON rbac_group**
```
Billing ticket + billing agent:
  ✅ Renders: Refund button, Stripe portal link, Subscription cap controls
  ❌ Does not render: Error log viewer, DB mutation tools, Shadow Mode

Tech ticket + tech agent:
  ✅ Renders: Error log viewer, Shadow Mode button, DB query tool
  ❌ Does not render: Refund controls, Stripe access, billing portal
```

---

## PIPELINE 11 — LAST MILE OFFLINE SYNC (Wave 26)

### Overview
Guard loses signal → local actions queued in IndexedDB → reconnects →
server honoring local timestamps → SARGE acknowledges batched actions.

### Timestamp Resolution Rule (Critical)
```
IF guard records a DAR at 14:00 and syncs at 18:00:
  Server MUST record 14:00 (X-Local-Timestamp header)
  Server MUST NOT use 18:00 (receipt time)

Implementation:
  offlineQueue.ts: QueuedRequest.localTimestamp = Date.now() at queue time
  syncPendingRequests(): sends X-Local-Timestamp + X-Offline-Sync headers
  Server routes: honor X-Local-Timestamp for time-entry, incident, patrol-scan, DAR
```

### Queue Types (offlineQueue.ts)
```
'clock-in'     → POST /api/timesheets/clock-in
'clock-out'    → POST /api/timesheets/clock-out
'incident'     → POST /api/incidents/report
'time-entry'   → POST /api/timesheets/entries
'patrol-scan'  → POST /api/guard-tours/scans
'dar'          → POST /api/dars
'voice-message'→ POST /api/ptt/voice-message (base64 audio, multipart on sync)
'other'        → generic POST
```

### Voice Message Offline Sync
```
Guard records PTT while offline:
  → queueVoiceMessage(audioBlob, roomId, workspaceId)
  → audio converted to base64, stored in IndexedDB
  → On reconnect: uploads as multipart POST /api/ptt/voice-message
  → SARGE receives audio, responds in shift room
  SARGE does NOT pre-process offline PTT — response happens on delivery
```

### Server Handling (X-Local-Timestamp)
```
All routes that accept offline-synced data check:
  const localTs = req.headers['x-local-timestamp'];
  const isOfflineSync = req.headers['x-offline-sync'] === 'true';
  const recordedAt = localTs ? new Date(parseInt(localTs)) : new Date();
  // Use recordedAt instead of new Date() for all timestamp fields
```

### Conflict Resolution
```
Two guards clock into same shift while both offline:
  → First sync wins (DB unique constraint on shift_id + date)
  → Second sync receives 409 CONFLICT
  → offlineQueue removes the failed record (no retry — data integrity)
  → SARGE posts "Sync conflict: shift already filled" to guard's room
```

---

## PIPELINE 12 — DOOMSDAY PROTOCOL (Wave 26)

### Overview
Critical infrastructure failure detected → Trinity fires autonomously:
status page updated, tenant owners SMS'd, ChatDock alerted.

### Trigger
```
trinitySentinel.ts getStatus() → overallHealth = 'critical'
→ doomsdayProtocol(reason) fires (rate-limited: max 1x per hour)
```

### 3-Step Sequence
```
STEP 1: Status page updated
  INSERT INTO status_incidents: title, status='investigating', severity='critical'
  Message: "Trinity has detected a critical event. Team investigating. Updates every 15min."

STEP 2: SMS all tenant owners (via Twilio notificationDeliveryService)
  SELECT users WHERE role IN ('org_owner','super_admin') AND phone IS NOT NULL
  SMS: "CoAIleague Alert: Platform issue detected. Team recovering. ETA: [30min]. Status: coaileague.com/status"
  Rate: max 200 owners per incident

STEP 3: Broadcast to all #trinity-command rooms
  SELECT conversations WHERE slug='trinity-command'
  broadcastToWorkspace → compliance_alert ChatActionBlock
  Body: "PLATFORM ALERT: [reason]. Doomsday Protocol activated. Status page updated. Owners notified."
```

### Rate Limiting
```
lastDoomsdayFired tracked in memory
If fired < 60 minutes ago: skip (prevents SMS flood on flapping health)
```

### Recovery Signal
```
When health returns to 'healthy':
  UPDATE status_incidents SET status='resolved', resolved_at=NOW()
  Trinity posts "All systems restored" in #trinity-command rooms
  (Deferred: auto-resolve not yet wired — manual close for now)
```

---

## MODULE: FEMA RAPID SURGE (Wave 27 — Premium Enterprise)

> **Billing Tier:** Enterprise Add-on
> **Target Client:** Security companies with government/FEMA contracts
> **Value Proposition:** Guaranteed ICS-214 compliance = guaranteed FEMA reimbursement

### DB Schema

```
surge_events          → Declares a disaster deployment event
surge_deployments     → Per-officer deployment record (accepted/declined/active/returned)
fema_declaration_alerts → FEMA API poll results per workspace
per_diem_records      → GSA-rate per diem tracking per officer per day
```

---

## PIPELINE 13 — SURGE MOBILIZATION (Wave 27)

### Overview
Manager triggers Surge Event → Trinity mass-SMS bench with opt-in offers →
Guards reply DEPLOY → auto-rostered → travel manifests generated → deployed.

### TCPA Compliance Gate (non-negotiable)
```
Surge SMS only goes to employees WHERE sms_opt_in = true
This is enforced at DB query level — not at send level
Guards must have previously opted in to emergency deployment alerts
TCPA violations during FEMA deployments do not qualify for federal exemption
```

### 7-Step Pipeline

**STEP 1 — TRIGGER: Manager creates Surge Event**
```
POST /api/surge-events
Body: { title, state, fema_disaster_number, pay_rate_override, per_diem_rate_cents,
        max_deployment_days, incident_type }
Creates: surge_events record, status='draft'
```

**STEP 2 — FEMA VALIDATION**
```
femaDeclarationService.fetchActiveDeclarations([state])
Verify DR-XXXX is active for the target state
Attach disaster_number, declaration_date, designated_area to surge event
```

**STEP 3 — RECIPROCITY CHECK (per officer)**
```
For each officer being offered: checkEmergencyReciprocity(homeState, deploymentState, declaration)
Priority order:
  1. EMAC — all 50 states, governor request activates cross-state license authority
  2. State-specific statute (FL 252.36, TX 418.016, etc.)
  3. Executive Order in the specific declaration

Result stored in surge_deployments.reciprocity_basis + reciprocity_notes
Trinity includes reciprocity basis in the offer SMS
```

**STEP 4 — MASS SMS OFFER**
```
SELECT employees WHERE workspace_id=$1 AND sms_opt_in=true AND status='active'
  AND license_type IN (required license types for event)
  ORDER BY reliability_score DESC

SMS per officer:
"URGENT: [Company] FEMA Disaster Response DR-[N] in [State].
 [N]-day deployment. $[rate]/hr + $[perdiem]/day per diem.
 EMAC reciprocity covers [HomeState] license in [State].
 Reply DEPLOY to accept. Reply PASS to decline. Offer expires [time]."
```

**STEP 5 — AUTO-ROSTER**
```
Guard replies "DEPLOY" → SMS reply handler fires
  INSERT surge_deployments (surge_event_id, employee_id, status='accepted')
  Create shift records for the deployment period
  Trinity confirms to guard: "Confirmed. Report [date] at [location]. Hotel TBD."

Guard replies "PASS":
  UPDATE surge_deployments SET status='declined'
  Try next guard on ranked list
```

**STEP 6 — LOGISTICS**
```
For each accepted deployment:
  Assign hotel (hotel_assignment, hotel_address fields)
  Generate travel manifest PDF
  Create per_diem_records rows for each deployment day
    GSA rate lookup: gsa.gov/travel/plan-book/per-diem-rates (by county)
    NOT flat rate — federal reimbursement requires GSA locality rates
```

**STEP 7 — DEPLOYMENT TRACKING**
```
surge_deployments.status lifecycle:
  offered → accepted/declined → deployed → returned

Clock-in/clock-out records during surge tagged with surge_deployment_id
All field reports from SARGE during surge tagged for ICS-214 generation
```

---

## PIPELINE 14 — ICS-214 ACTIVITY LOG GENERATION (Wave 27)

### Overview
At end of deployment → Trinity compiles field reports + clock records +
incidents → generates federally-compliant ICS-214 PDF → submitted to FEMA.

### ICS-214 Form Fields (FEMA Required)
```
Block 1: Incident Name
Block 2: Operational Period (Date From/To, Time From/To in 24hr format)
Block 3: Name (officer full name)
Block 4: ICS Position (license type → Security Officer / Armed Security Officer)
Block 5: Home Agency and Unit (company name + org code)
Block 6: Resources Assigned (officer details)
Block 7: Activity Log (Time | Notable Activities) — THE CRITICAL SECTION
Block 8: Prepared By (name, position, signature)
```

### Activity Log Source Data
```
Block 7 is compiled from (all using X-Local-Timestamp for correct times):
  messages table  → Officer's ChatDock field reports to SARGE during deployment
  time_entries    → Clock-in/clock-out with post name and GPS coordinates
  incident_reports → Any incidents during the operational period
  patrol_scans    → NFC/QR checkpoint completions

Source priority for timestamps:
  1. message.local_timestamp (device time — Timestamp Resolution Rule)
  2. message.created_at (server receipt time — fallback)
```

### Generation Trigger
```
POST /api/surge-events/:id/generate-ics214
Body: { officerId, operationalPeriodStart, operationalPeriodEnd }
Returns: PDF buffer (stored to generated_documents + downloadable)

Also available via Trinity action:
  Trinity: "Generate ICS-214 for Officer [Name] for June 3-16 deployment"
  → dispatch_action_card: { type: 'document_upload', pdfUrl: ... }
```

### FEMA Compliance Notes
```
Time format: HHMM (24-hour) — not AM/PM
Activity entries: time of observation, not time of report
Must match personnel roster submitted with FEMA Form 205 (Work Authorization)
One ICS-214 per operational period per officer
AI-Generated disclaimer on every form — review before submission
```

---

## PIPELINE 15 — EMERGENCY LICENSE RECIPROCITY ENGINE (Wave 27)

### Three-Tier Reciprocity Check

```
TIER 1 — EMAC (Emergency Management Assistance Compact)
  All 50 states are signatories
  Activates: when governor formally requests assistance from another state
  Coverage: licensed professionals may cross state lines during activation
  Reference: emacweb.org
  Authority: applies to security personnel under appropriate mutual aid request

TIER 2 — State Emergency Statutes
  States with explicit security licensing waivers:
    FL: Stat. 252.36 (Emergency Management Act) + Stat. 493.6106(2)
    TX: Gov. Code §418.016 + Occ. Code §1702.325
    LA: RS 29:724
    GA: OCGA 38-3-51
    NC: GS 166A-19.31
    MS: Code 33-15-17
  
TIER 3 — Executive Order in Declaration
  Some declarations explicitly waive licensing
  Trinity fetches declaration text via web.fetch_url(fema_declaration_url)
  Gemini extracts: waiver_provisions, effective_date, scope
  If explicit waiver found: note in surge_deployments.reciprocity_notes

Outcome stored per officer per deployment:
  reciprocity_basis: 'EMAC' | 'state_statute' | 'executive_order'
  reciprocity_notes: full citation text
  Included in ICS-214 Block 5 (Home Agency)
```

### FEMA API Integration
```
URL: https://www.fema.gov/api/open/v2/disasterDeclarations
Method: GET (public, no auth)
Poll: every 6 hours (configurable)
Filter: $filter=closeoutDate eq null (active declarations only)

When new declaration detected for workspace state:
  → compliance_alert ChatActionBlock in #trinity-command
  → Workspace owner notified
  → /surge command available to activate deployment
```

---

## PIPELINE 16 — GOVERNOR EARLY WARNING (Wave 27 Enhancement)

### Overview
Governor signs State of Emergency → Trinity detects via web search 24-72hrs
before FEMA acts → advisory alert posted in #trinity-command → when FEMA API
confirms federal declaration → full surge activation triggers.

### Two-Stage System
```
STAGE 1 — ADVISORY (governor declaration only):
  trinityWebSearch.generateWithSearch()
  Query: '"state of emergency" [state] site:governor.[state].gov'
  On match → broadcastToWorkspace('advisory_alert')
  Message: "Hurricane Milton: FL governor declared emergency.
            FEMA declaration likely within 48hrs. Prepare bench."
  NO surge SMS yet — advisory only.

STAGE 2 — FULL ACTIVATION (FEMA API confirms federal declaration):
  femaDeclarationService.fetchActiveDeclarations()
  Poll interval: 6 hours
  On new declaration → POST /api/surge-events (auto-create)
  → activate endpoint → mass-SMS to smsOptIn=true officers
  → surge pipeline fires (Pipeline 13)
```

### Why Two Stages
```
Governor declarations ≠ federal reimbursement
FEMA declaration = guaranteed reimbursement basis
Trinity must not trigger full surge until federal declaration exists —
otherwise officers deploy with no guaranteed per diem or reimbursement.
Advisory: "Get ready." Activation: "Deploy."
```

### TCPA Hard Constraint
```
Surge SMS ONLY to employees WHERE smsOptIn = TRUE
Enforced at DB query level in femaDeclarationService.ts
Not enforced at send level — the record never enters the send queue
Documentation: RBAC_MATRIX.md § Cross-Cutting Security Rules
```
