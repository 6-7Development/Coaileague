/**
 * Trinity Triage Service — Wave 23D
 * ─────────────────────────────────────────────────────────────────────────────
 * Trinity's mailroom. When a support ticket arrives (from email, API, or chat),
 * Trinity classifies it immediately and appends a diagnostic summary
 * BEFORE the human agent opens it.
 *
 * Classification categories:
 *   billing    → Stripe, invoices, overages, subscription, refunds
 *   tech       → 500 errors, builds, deployment, database, API failures
 *   compliance → licensing, audits, DARs, regulatory questions
 *   hr         → employee records, payroll disputes, termination
 *   general    → feature requests, how-to questions, account setup
 *
 * Co-Pilot Diagnostic:
 *   For 'tech' tickets: Trinity pulls the workspace's 500 errors from the
 *   last 10 minutes and appends them to the ticket as copilot_diagnostic.
 *   Agent opens the ticket and the context is already there.
 *
 * RBAC routing:
 *   billing → visible to: root_admin, deputy_admin, support_manager, support_billing
 *   tech    → visible to: root_admin, deputy_admin, sysop, support_tech
 *   others  → visible to: root_admin, deputy_admin, support_manager, support_agent
 */

import { pool } from "../../db";
import { createLogger } from "../../lib/logger";

const log = createLogger("TrinityTriage");

export type TicketCategory = "billing" | "tech" | "compliance" | "hr" | "general";

export interface TriageResult {
  category: TicketCategory;
  confidence: number;
  trinitySummary: string;
  suggestedPriority: "low" | "normal" | "high" | "urgent";
  copilotDiagnostic: string | null;
  rbacGroup: "billing_agents" | "tech_agents" | "general_agents";
}

// ── Keyword-based fast classification (no API call needed for obvious cases) ──

const BILLING_KEYWORDS = /invoice|billing|stripe|charge|refund|overag|subscription|payment|credit|plan|tier|upgrade|downgrade/i;
const TECH_KEYWORDS    = /500|error|crash|bug|broken|fail|not working|timeout|database|deploy|build|api|server|login.*fail|cannot access/i;
const COMPLIANCE_KEYWORDS = /licen|audit|DAR|regulatory|DPS|compliance|expired|TCOLE|BSIS|PSB/i;
const HR_KEYWORDS      = /terminat|suspend|disciplin|payroll|pay.*rate|direct deposit|W-2|1099|harassment|complaint/i;
const URGENT_KEYWORDS  = /urgent|asap|immediately|emergency|critical|down|outage|cannot log|locked out/i;

function classifyByKeywords(text: string): { category: TicketCategory; confidence: number } {
  const t = (text || "").toLowerCase();
  if (BILLING_KEYWORDS.test(t))    return { category: "billing",    confidence: 0.85 };
  if (TECH_KEYWORDS.test(t))       return { category: "tech",       confidence: 0.85 };
  if (COMPLIANCE_KEYWORDS.test(t)) return { category: "compliance", confidence: 0.80 };
  if (HR_KEYWORDS.test(t))         return { category: "hr",         confidence: 0.80 };
  return { category: "general", confidence: 0.60 };
}

// ── Pull recent 500 errors for the workspace (co-pilot diagnostic) ─────────────

async function pullRecentErrors(workspaceId: string, minutes = 10): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT error_type, error_message, route, created_at
       FROM error_logs
       WHERE workspace_id = $1
         AND created_at > NOW() - INTERVAL '${minutes} minutes'
         AND http_status >= 500
       ORDER BY created_at DESC LIMIT 5`,
      [workspaceId]
    );
    if (!result.rows.length) return null;
    return result.rows.map(r =>
      `[${new Date(r.created_at).toISOString()}] ${r.http_status || 500} on ${r.route || 'unknown'}: ${r.error_message?.slice(0, 120) || 'No message'}`
    ).join("
");
  } catch {
    return null;
  }
}

// ── Main triage entry point ────────────────────────────────────────────────────

export async function triageTicket(
  ticketId: string,
  workspaceId: string,
  subject: string,
  description: string,
  fromEmail?: string
): Promise<TriageResult> {
  const fullText = `${subject} ${description}`;
  const { category, confidence } = classifyByKeywords(fullText);

  // Attempt Gemini refinement for borderline cases
  let refinedCategory = category;
  let refinedConfidence = confidence;
  let trinitySummary = "";

  try {
    const { geminiClient } = await import("../ai-brain/providers/geminiClient");
    const prompt = [
      "Classify this support ticket for a security workforce management platform.",
      "Categories: billing, tech, compliance, hr, general",
      `Subject: ${subject}`,
      `Description: ${description.slice(0, 400)}`,
      `From: ${fromEmail || "unknown"}`,
      "Respond ONLY in JSON: { "category": string, "confidence": number, "summary": string, "priority": "low"|"normal"|"high"|"urgent" }",
    ].join("
");

    const raw = await (geminiClient as { generateWithSearch?: (p: string) => Promise<{ text: string }> })
      .generateWithSearch?.(prompt).then(r => r.text) || "{}";
    const jsonMatch = raw.match(/[{][\s\S]+[}]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        category?: TicketCategory; confidence?: number; summary?: string; priority?: string;
      };
      if (parsed.category && parsed.confidence) {
        refinedCategory = parsed.category;
        refinedConfidence = parsed.confidence;
        trinitySummary = parsed.summary || "";
      }
    }
  } catch {
    // Gemini unavailable — keyword classification is fine for most tickets
  }

  // Co-pilot diagnostic for tech tickets
  const copilotDiagnostic = refinedCategory === "tech"
    ? await pullRecentErrors(workspaceId)
    : null;

  if (!trinitySummary) {
    trinitySummary = `Ticket classified as [${refinedCategory.toUpperCase()}] with ${Math.round(refinedConfidence * 100)}% confidence. ${
      copilotDiagnostic ? "Co-pilot pulled recent 500 errors for this workspace." : ""
    }`;
  }

  // Suggested priority
  const suggestedPriority: TriageResult["suggestedPriority"] = URGENT_KEYWORDS.test(fullText) ? "urgent"
    : refinedCategory === "tech" ? "high"
    : "normal";

  // RBAC group routing
  const rbacGroup: TriageResult["rbacGroup"] = refinedCategory === "billing" ? "billing_agents"
    : refinedCategory === "tech" ? "tech_agents"
    : "general_agents";

  // Write triage results back to the ticket
  await pool.query(
    `UPDATE support_tickets
     SET category = $1, trinity_summary = $2, copilot_diagnostic = $3,
         priority = $4, triage_confidence = $5, triage_completed_at = NOW(),
         rbac_group = $6
     WHERE id = $7`,
    [refinedCategory, trinitySummary, copilotDiagnostic, suggestedPriority,
     refinedConfidence, rbacGroup, ticketId]
  ).catch(err => log.warn("[TrinityTriage] DB update failed (non-fatal):", err.message));

  log.info(`[TrinityTriage] Ticket ${ticketId}: ${refinedCategory} (${Math.round(refinedConfidence*100)}%) → ${rbacGroup}`);

  return {
    category: refinedCategory,
    confidence: refinedConfidence,
    trinitySummary,
    suggestedPriority,
    copilotDiagnostic,
    rbacGroup,
  };
}

export const trinityTriageService = { triageTicket };
