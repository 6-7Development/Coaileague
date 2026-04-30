/**
 * CoAIleague API Route Constants
 * ================================
 * SINGLE SOURCE OF TRUTH for every API URL.
 *
 * HOW TO USE:
 *   Frontend: import { API } from "@shared/apiRoutes";
 *             apiRequest("POST", API.shifts.accept(shiftId))
 *
 *   Backend:  import { API_PATHS } from "@shared/apiRoutes";
 *             router.post(API_PATHS.shifts.accept, handler)
 *
 * HOW TO ADD A ROUTE:
 *   1. Add the path constant to API_PATHS
 *   2. Add the typed helper to API
 *   3. Run: npx tsx server/tests/routeIntegrity.test.ts
 *   If the test passes, implement the backend handler.
 *   If the test fails, add the handler first.
 *
 * This file makes "Phantom Routes" compile-time errors, not 404s.
 */

// ─── Raw path patterns (for backend router.METHOD() calls) ────────────────────
export const API_PATHS = {
  shifts: {
    list:           "/",
    create:         "/",
    get:            "/:id",
    update:         "/:id",
    delete:         "/:id",
    acknowledge:    "/:id/acknowledge",
    accept:         "/:id/accept",
    deny:           "/:id/deny",
    markCalloff:    "/:id/mark-calloff",
    pickup:         "/:id/pickup",
    proofOfService: "/:id/proof-of-service",
    aiFill:         "/:id/ai-fill",
    approve:        "/:id/approve",
    offerAccept:    "/offers/:id/accept",
    offerDecline:   "/offers/:id/decline",
  },
  schedules: {
    weekStats:        "/week/stats",
    publish:          "/publish",
    applyInsight:     "/apply-insight",
    preflightAutofill:"/auto-fill/preflight",
    aiInsights:       "/ai-insights",
  },
  scheduling: {
    swapRequestsCreate:  "/swap-requests",
    swapRequestsList:    "/swap-requests",
    swapApprove:         "/swap-requests/:id/approve",
    swapReject:          "/swap-requests/:id/reject",
    swapCancel:          "/swap-requests/:id/cancel",
    duplicateShift:      "/shifts/:id/duplicate",
  },
  shiftTrading: {
    tradeAccept:         "/trades/:id/accept",
    tradeManagerApprove: "/trades/:id/manager-approve",
    tradeManagerReject:  "/trades/:id/manager-reject",
    availabilityList:    "/availability",
    availabilityCreate:  "/availability",
    availabilityDelete:  "/availability/:id",
  },
  coverage: {
    list:    "/",
    accept:  "/accept/:id",
    trigger: "/trigger",
  },
  approvals: {
    list:     "/",
    decision: "/:id/decision",
    cancel:   "/:id/cancel",
  },
  timesheetEdits: {
    pending: "/pending",
    review:  "/:id/review",
  },
  timesheets: {
    list:    "/",
    approve: "/:id/approve",
    reject:  "/:id/reject",
    submit:  "/:id/submit",
  },
  trinityScheduling: {
    autofill:         "/auto-fill",
    insights:         "/insights",
    pendingList:      "/pending-approvals",
    pendingApprove:   "/pending-approvals/:id/approve",
    pendingReject:    "/pending-approvals/:id/reject",
  },
  securityCompliance: {
    approvalsList:   "/",
    approvalsPending:"/pending",
    approvalsDecide: "/:id/decide",
  },
  timeEntries: {
    list:     "/",
    approve:  "/:id/approve",
    reject:   "/:id/reject",
    clockOut: "/:id/clock-out",
  },
} as const;

// ─── Typed URL builder helpers (for frontend) ─────────────────────────────────
// Usage: API.shifts.accept("shift-123") → "/api/shifts/shift-123/accept"

const BASE = "/api";

export const API = {
  shifts: {
    list:           () => `${BASE}/shifts`,
    create:         () => `${BASE}/shifts`,
    get:            (id: string) => `${BASE}/shifts/${id}`,
    update:         (id: string) => `${BASE}/shifts/${id}`,
    delete:         (id: string) => `${BASE}/shifts/${id}`,
    acknowledge:    (id: string) => `${BASE}/shifts/${id}/acknowledge`,
    accept:         (id: string) => `${BASE}/shifts/${id}/accept`,
    deny:           (id: string) => `${BASE}/shifts/${id}/deny`,
    markCalloff:    (id: string) => `${BASE}/shifts/${id}/mark-calloff`,
    pickup:         (id: string) => `${BASE}/shifts/${id}/pickup`,
    proofOfService: (id: string) => `${BASE}/shifts/${id}/proof-of-service`,
    aiFill:         (id: string) => `${BASE}/shifts/${id}/ai-fill`,
    approve:        (id: string) => `${BASE}/shifts/${id}/approve`,
    offerAccept:    (id: string) => `${BASE}/shifts/offers/${id}/accept`,
    offerDecline:   (id: string) => `${BASE}/shifts/offers/${id}/decline`,
  },
  schedules: {
    weekStats:         () => `${BASE}/schedules/week/stats`,
    publish:           () => `${BASE}/schedules/publish`,
    applyInsight:      () => `${BASE}/schedules/apply-insight`,
    preflightAutofill: () => `${BASE}/schedules/auto-fill/preflight`,
    aiInsights:        () => `${BASE}/schedules/ai-insights`,
  },
  scheduling: {
    swapRequestsCreate:  ()            => `${BASE}/scheduling/swap-requests`,
    swapRequestsList:    ()            => `${BASE}/scheduling/swap-requests`,
    swapApprove:         (id: string)  => `${BASE}/scheduling/swap-requests/${id}/approve`,
    swapReject:          (id: string)  => `${BASE}/scheduling/swap-requests/${id}/reject`,
    swapCancel:          (id: string)  => `${BASE}/scheduling/swap-requests/${id}/cancel`,
    duplicateShift:      (id: string)  => `${BASE}/scheduling/shifts/${id}/duplicate`,
  },
  shiftTrading: {
    tradeAccept:         (id: string) => `${BASE}/shift-trading/trades/${id}/accept`,
    tradeManagerApprove: (id: string) => `${BASE}/shift-trading/trades/${id}/manager-approve`,
    tradeManagerReject:  (id: string) => `${BASE}/shift-trading/trades/${id}/manager-reject`,
    availabilityList:    ()            => `${BASE}/shift-trading/availability`,
    availabilityCreate:  ()            => `${BASE}/shift-trading/availability`,
    availabilityDelete:  (id: string)  => `${BASE}/shift-trading/availability/${id}`,
  },
  coverage: {
    list:    () => `${BASE}/coverage`,
    accept:  (id: string) => `${BASE}/coverage/accept/${id}`,
    trigger: () => `${BASE}/coverage/trigger`,
  },
  approvals: {
    list:     () => `${BASE}/approvals`,
    decision: (id: string) => `${BASE}/approvals/${id}/decision`,
    cancel:   (id: string) => `${BASE}/approvals/${id}/cancel`,
  },
  timesheetEdits: {
    pending: () => `${BASE}/timesheet-edit-requests/pending`,
    review:  (id: string) => `${BASE}/timesheet-edit-requests/${id}/review`,
  },
  timesheets: {
    list:    () => `${BASE}/timesheets`,
    approve: (id: string) => `${BASE}/timesheets/${id}/approve`,
    reject:  (id: string) => `${BASE}/timesheets/${id}/reject`,
    submit:  (id: string) => `${BASE}/timesheets/${id}/submit`,
  },
  trinityScheduling: {
    autofill:       () => `${BASE}/trinity/scheduling/auto-fill`,
    insights:       () => `${BASE}/trinity/scheduling/insights`,
    pendingList:    () => `${BASE}/trinity/scheduling/pending-approvals`,
    pendingApprove: (id: string) => `${BASE}/trinity/scheduling/pending-approvals/${id}/approve`,
    pendingReject:  (id: string) => `${BASE}/trinity/scheduling/pending-approvals/${id}/reject`,
  },
  securityCompliance: {
    approvalsList:    () => `${BASE}/security-compliance/approvals`,
    approvalsPending: () => `${BASE}/security-compliance/approvals/pending`,
    approvalsDecide:  (id: string) => `${BASE}/security-compliance/approvals/${id}/decide`,
  },
  timeEntries: {
    list:     () => `${BASE}/time-entries`,
    approve:  (id: string) => `${BASE}/time-entries/${id}/approve`,
    reject:   (id: string) => `${BASE}/time-entries/${id}/reject`,
    clockOut: (id: string) => `${BASE}/time-entries/${id}/clock-out`,
  },
} as const;

// ─── Type helpers ─────────────────────────────────────────────────────────────
export type ApiRouteKey = keyof typeof API;
