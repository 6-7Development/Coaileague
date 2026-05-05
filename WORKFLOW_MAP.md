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
