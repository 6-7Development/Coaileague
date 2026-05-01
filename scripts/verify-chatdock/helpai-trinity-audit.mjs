#!/usr/bin/env node
/**
 * HelpAI ↔ Trinity Brain & Memory Audit
 * ───────────────────────────────────────
 * Verifies the user's stated architecture:
 *   • HelpAI uses Trinity's "biblical brain" — the non-overrideable values +
 *     character foundation that govern every response.
 *   • HelpAI has its own field-manager personality on top of that brain.
 *   • Both bots remember per-user context: shifts, incidents, call-ins,
 *     attendance, language, professionalism/mannerism, communication style.
 *   • Trinity adapts to multiple audiences: officers, managers, clients,
 *     auditors, guests, support agents, other AI.
 *
 * Output: PASS / FAIL per claim with the file/line evidence so any gap
 * is concretely visible (no "this looks fine" hand-waving).
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function fileExists(rel) { try { fs.accessSync(path.join(ROOT, rel)); return true; } catch { return false; } }

const RESULTS = [];
function rec(group, name, pass, evidence) {
  RESULTS.push({ group, name, pass, evidence });
  console.log(`  ${pass ? "✓" : "✗"} ${name}${evidence ? `  — ${evidence}` : ""}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Group 1 — Trinity's biblical brain exists and is structured
// ─────────────────────────────────────────────────────────────────────────
console.log("\n[1] Trinity biblical brain — values + character foundation");
const trinityPersona = read("server/services/ai-brain/trinityPersona.ts");
rec("trinity-core", "TRINITY_VALUES_ANCHOR exists (dignity / service / accountability / honesty / protection / legal walls / trust hierarchy)",
  /export const TRINITY_VALUES_ANCHOR/.test(trinityPersona)
    && /DIGNITY:/.test(trinityPersona)
    && /TRUST HIERARCHY/.test(trinityPersona),
  "trinityPersona.ts:57-89");
rec("trinity-core", "PERSONA_CHARACTER_FOUNDATION exists (faith-grounded conviction)",
  /PERSONA_CHARACTER_FOUNDATION/.test(trinityPersona) && /FAITH:/.test(trinityPersona),
  "trinityPersona.ts:98-136");
rec("trinity-core", "TRINITY_MASTER_SYSTEM_PROMPT, KNOWLEDGE_CORPUS, COGNITIVE_ARCHITECTURE, LEARNING_PROTOCOL all exported",
  /TRINITY_MASTER_SYSTEM_PROMPT/.test(trinityPersona)
    && /TRINITY_KNOWLEDGE_CORPUS/.test(trinityPersona)
    && /TRINITY_COGNITIVE_ARCHITECTURE/.test(trinityPersona)
    && /TRINITY_LEARNING_PROTOCOL/.test(trinityPersona),
  "trinityPersona.ts:748+");
rec("trinity-core", "trinityChatService consumes the biblical brain in its system prompt",
  /TRINITY_VALUES_ANCHOR/.test(read("server/services/ai-brain/trinityChatService.ts")),
  "trinityChatService.ts:2634");

// ─────────────────────────────────────────────────────────────────────────
// Group 2 — HelpAI inherits Trinity's brain (the gap the user described)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n[2] HelpAI inheritance from Trinity brain");
const helpAIBot = read("server/services/helpai/helpAIBotService.ts");
rec("helpai-inherits", "HelpAI imports TRINITY_VALUES_ANCHOR (dignity / accountability / trust hierarchy)",
  /TRINITY_VALUES_ANCHOR/.test(helpAIBot),
  "helpAIBotService.ts");
rec("helpai-inherits", "HelpAI imports PERSONA_CHARACTER_FOUNDATION (faith-grounded conviction)",
  /PERSONA_CHARACTER_FOUNDATION/.test(helpAIBot),
  "helpAIBotService.ts");
rec("helpai-inherits", "HelpAI shares the human personality block with Trinity",
  /buildSharedPersonalityBlock\(['"]helpai['"]/.test(helpAIBot),
  "helpAIBotService.ts:427");
rec("helpai-inherits", "HelpAI uses the same Gemini Pro tier as Trinity (\"Trinity brain\")",
  /Trinity brain/.test(helpAIBot),
  "helpAIBotService.ts:509");

// ─────────────────────────────────────────────────────────────────────────
// Group 3 — HelpAI has its own field-manager personality on top
// ─────────────────────────────────────────────────────────────────────────
console.log("\n[3] HelpAI field-manager personality layer");
const summon = read("server/services/botSummonService.ts");
rec("helpai-persona", "HelpAI is described as Trinity's \"field intelligence assistant / co-pilot\" in summon contexts",
  /field intelligence assistant/.test(summon) && /co-pilot/.test(summon),
  "botSummonService.ts:35,39,75");
rec("helpai-persona", "HelpAI has shift_chat-specific welcome (real-time guidance, incident reporting, clock in/out, emergency)",
  /shift room/.test(summon) && /Incident reporting/.test(summon) && /Emergency protocols/.test(summon),
  "botSummonService.ts:50-58");
rec("helpai-persona", "HelpAI joins as chat_participants row with role 'admin' (field manager authority)",
  /participantRole:\s*['"]admin['"]/.test(summon),
  "botSummonService.ts:128");

// ─────────────────────────────────────────────────────────────────────────
// Group 4 — Per-officer memory (shifts, mannerism, language, etc.)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n[4] Per-officer memory coverage");
const officerPersona = read("server/services/helpai/helpAIOfficerPersonaService.ts");
const officerSchema = read("shared/schema/domains/trinity/extended.ts");
rec("officer-memory", "helpaiOfficerProfiles tracks preferredStyle (mannerism)",
  /preferredStyle:\s*varchar/.test(officerSchema),
  "trinity/extended.ts:585");
rec("officer-memory", "helpaiOfficerProfiles tracks preferredLanguage",
  /preferredLanguage:\s*varchar/.test(officerSchema),
  "trinity/extended.ts:586");
rec("officer-memory", "helpaiOfficerProfiles tracks commonStruggles + commonRequests",
  /commonStruggles:/.test(officerSchema) && /commonRequests:/.test(officerSchema),
  "trinity/extended.ts:590-591");
rec("officer-memory", "helpaiOfficerProfiles tracks strengths (good-officer attendance/professionalism notes)",
  /strengths:\s*text/.test(officerSchema),
  "trinity/extended.ts:592");
rec("officer-memory", "helpaiOfficerProfiles tracks typicalMood, stressSignals, distressHistory (emotional baseline)",
  /typicalMood:/.test(officerSchema) && /stressSignals:/.test(officerSchema) && /distressHistory:/.test(officerSchema),
  "trinity/extended.ts:595-597");
rec("officer-memory", "helpaiOfficerProfiles has free-form observationNotes (mannerism / professionalism)",
  /observationNotes:/.test(officerSchema),
  "trinity/extended.ts:605");
rec("officer-memory", "Persona prompt computes shiftLoad live from shifts table (last 7d, OT count)",
  /getShiftLoad/.test(officerPersona) && /CURRENT_DATE - 7/.test(officerPersona),
  "helpAIOfficerPersonaService.ts:217-238");
rec("officer-memory", "Persona prompt computes certStatus live (license expiry warning)",
  /License EXPIRED/.test(officerPersona) && /License expires in/.test(officerPersona),
  "helpAIOfficerPersonaService.ts:251-252");
rec("officer-memory", "Persona prompt computes reliabilityScore live (90d completion rate)",
  /getReliabilityScore/.test(officerPersona) && /CURRENT_DATE - 90/.test(officerPersona),
  "helpAIOfficerPersonaService.ts:257-273");
rec("officer-memory", "Persona prompt explicitly summarizes call-ins / incidents (recent attendance issues)",
  /call.?in/i.test(officerPersona) || /no.?show/i.test(officerPersona) || /incident/i.test(officerPersona),
  "helpAIOfficerPersonaService.ts");
rec("officer-memory", "Persona prompt links to incident_reports table for safety-history awareness",
  /incident_reports/.test(officerPersona) || /incidentReports/.test(officerPersona),
  "helpAIOfficerPersonaService.ts");

// ─────────────────────────────────────────────────────────────────────────
// Group 5 — Trinity memory across audiences (clients / auditors / guests / support / other AI)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n[5] Trinity audience-aware adaptation");
const trinityChat = read("server/services/ai-brain/trinityChatService.ts");
rec("audience", "Trinity adapts prompts by workspaceRole (owner / co_owner / org_admin / manager / supervisor / officer)",
  /workspaceRole === 'org_owner'/.test(trinityChat) && /workspaceRole === 'supervisor'/.test(trinityChat),
  "trinityChatService.ts:2649-2656");
rec("audience", "Trinity has Mode 2 platform-support preamble (support_agent / sysop / root_admin context)",
  /PLATFORM_STAFF_MODE2_PREAMBLE/.test(trinityChat),
  "trinityChatService.ts:2780");
rec("audience", "Trinity has explicit billing-restriction by role (managers below owner cannot access tokens/allotments)",
  /BILLING.*RESTRICTION/.test(trinityChat),
  "trinityChatService.ts:2794");
rec("audience", "Trinity has explicit supervisor site-scoping module",
  /SUPERVISOR SITE-SCOPED ACCESS/.test(trinityChat),
  "trinityChatService.ts:2806");
// Audience modules are defined in trinityPersona.ts and wired into
// trinityChatService.buildSystemPrompt via getAudienceModule(audience).
// Each check requires BOTH the module to exist AND the chat-service to
// actually consume it for that audience.
rec("audience", "Trinity has explicit CLIENT audience handling (client portal / client liaison persona)",
  /CLIENT_AUDIENCE_MODULE/.test(trinityPersona) && /CLIENT_AUDIENCE_MODULE/.test(trinityChat),
  "trinityPersona.ts + trinityChatService.ts");
rec("audience", "Trinity has explicit AUDITOR audience handling (read-only / compliance review tone)",
  /AUDITOR_AUDIENCE_MODULE/.test(trinityPersona) && /AUDITOR_AUDIENCE_MODULE/.test(trinityChat),
  "trinityPersona.ts + trinityChatService.ts");
rec("audience", "Trinity has explicit GUEST audience handling (unauthenticated / scoped public-help tone)",
  /GUEST_AUDIENCE_MODULE/.test(trinityPersona) && /GUEST_AUDIENCE_MODULE/.test(trinityChat),
  "trinityPersona.ts + trinityChatService.ts");
rec("audience", "Trinity has explicit AI-to-AI / agent-to-agent context (other AI as caller)",
  /AGENT_TO_AGENT_AUDIENCE_MODULE/.test(trinityPersona) && /AGENT_TO_AGENT_AUDIENCE_MODULE/.test(trinityChat),
  "trinityPersona.ts + trinityChatService.ts");
rec("audience", "trinityChatService selects audience module via resolveTrinityAudience()",
  /resolveTrinityAudience\(/.test(trinityChat) && /getAudienceModule\(/.test(trinityChat),
  "trinityChatService.ts");

// ─────────────────────────────────────────────────────────────────────────
// Group 6 — Trinity memory service (cross-bot remembering)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n[6] Trinity long-term memory & cross-bot bridge");
const trinityMem = read("server/services/ai-brain/trinityMemoryService.ts");
rec("memory", "trinityMemoryService.getUserMemoryProfile aggregates per-user history",
  /getUserMemoryProfile/.test(trinityMem),
  "trinityMemoryService.ts:216");
rec("memory", "trinityMemoryService.shareInsight broadcasts cross-bot knowledge",
  /shareInsight/.test(trinityMem),
  "trinityMemoryService.ts:633");
rec("memory", "trinityMemoryService.buildOptimizedContext supplies prompt-time memory",
  /buildOptimizedContext/.test(trinityMem),
  "trinityMemoryService.ts:829");
rec("memory", "HelpAI consumes trinityMemoryService for cross-bot continuity (sees what Trinity learned)",
  /trinityMemoryService/.test(read("server/services/helpai/helpAIBotService.ts")),
  "helpAIBotService.ts");

// ─────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────
const groups = [...new Set(RESULTS.map(r => r.group))];
console.log("\n═══════════════════════════════════════════════════════════════");
for (const g of groups) {
  const items = RESULTS.filter(r => r.group === g);
  const pass = items.filter(r => r.pass).length;
  console.log(`  ${pass === items.length ? "✓" : "·"} ${g.padEnd(20)}  ${pass}/${items.length}`);
}
const totalPass = RESULTS.filter(r => r.pass).length;
console.log(`\n  TOTAL: ${totalPass}/${RESULTS.length} claims verified`);
console.log("═══════════════════════════════════════════════════════════════");

// Persist machine-readable receipt
const outDir = path.resolve(ROOT, "sim_output");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "helpai-trinity-audit.json"),
  JSON.stringify({ ranAt: new Date().toISOString(), passed: totalPass, total: RESULTS.length, results: RESULTS }, null, 2));
