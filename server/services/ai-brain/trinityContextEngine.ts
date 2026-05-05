/**
 * Trinity Context Engine — Wave 23B
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamic semantic router that injects the RIGHT documentation into Trinity's
 * context window for each query — not all 3,500+ lines at once.
 *
 * WHY: Gemini's context window is finite and expensive. Injecting every MD file
 * on every message wastes tokens and degrades response quality. This engine
 * keyword-routes each message to the relevant documentation slice.
 *
 * ARCHITECTURE:
 *   Message arrives → classify topic → inject relevant doc sections
 *
 *   Topic routing:
 *     scheduling/shifts/calloff → WORKFLOW_MAP Pipeline 1+2 + scheduling RBAC
 *     billing/invoice/payment  → WORKFLOW_MAP Pipeline 6 + finance RBAC
 *     compliance/audit/license → WORKFLOW_MAP Pipeline 7 + auditor RBAC
 *     onboarding/setup         → WORKFLOW_MAP Pipeline 1 + onboarding RBAC
 *     payroll/timesheet        → WORKFLOW_MAP Pipeline 5 + finance RBAC
 *     force/detention/arrest   → AI_COGNITIVE_MAP Jurisprudence + safety overrides
 *     emergency/medical        → AI_COGNITIVE_MAP Zero Liability Protocol (ALWAYS)
 *     code/deploy/patch        → AI_COGNITIVE_MAP DevOps Lobe + 3-Strike Rule
 *     permissions/access/role  → RBAC_MATRIX relevant role section
 *
 * ALWAYS INJECTED (every message):
 *   - Zero Liability Protocol excerpt (safety overrides)
 *   - Platform capabilities summary (what Trinity can do)
 *   - SARGE vs Trinity escalation boundary
 */

import { createLogger } from '../../lib/logger';
import * as fs from 'fs';
import * as path from 'path';

const log = createLogger('TrinityContextEngine');

// ── Doc file paths ────────────────────────────────────────────────────────────

const DOC_ROOT = path.resolve(process.cwd());
const DOCS = {
  workflow:   path.join(DOC_ROOT, 'WORKFLOW_MAP.md'),
  rbac:       path.join(DOC_ROOT, 'RBAC_MATRIX.md'),
  system:     path.join(DOC_ROOT, 'SYSTEM_MAP.md'),
  cognitive:  path.join(DOC_ROOT, 'AI_COGNITIVE_MAP.md'),
};

// Cache doc content in memory (refreshed every 10 min)
const docCache: Map<string, { content: string; cachedAt: number }> = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function readDoc(key: keyof typeof DOCS): string {
  const cached = docCache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.content;
  }
  try {
    const content = fs.readFileSync(DOCS[key], 'utf-8');
    docCache.set(key, { content, cachedAt: Date.now() });
    return content;
  } catch {
    log.warn(`[ContextEngine] Could not read ${key} doc`);
    return '';
  }
}

// ── Section extraction ────────────────────────────────────────────────────────

/**
 * Extract a named section from a markdown document.
 * Finds the heading and returns content until the next same-level heading.
 */
function extractSection(doc: string, sectionTitle: string): string {
  const lines = doc.split('\n');
  let inSection = false;
  let headingLevel = 0;
  const result: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      if (title.toLowerCase().includes(sectionTitle.toLowerCase())) {
        inSection = true;
        headingLevel = level;
        result.push(line);
        continue;
      }

      if (inSection && level <= headingLevel) {
        break; // End of our section
      }
    }

    if (inSection) {
      result.push(line);
    }
  }

  return result.join('\n').trim();
}

// ── Topic classifier ──────────────────────────────────────────────────────────

type DocumentTopic =
  | 'emergency'        // ALWAYS first — zero liability
  | 'scheduling'
  | 'calloff'
  | 'billing'
  | 'payroll'
  | 'compliance'
  | 'onboarding'
  | 'legal_force'      // UoF, detention, arrest
  | 'devops'           // Patching, deploying
  | 'permissions'      // RBAC, role questions
  | 'client_request'   // Client shift request
  | 'general';

const TOPIC_PATTERNS: Array<{ topic: DocumentTopic; patterns: RegExp[] }> = [
  {
    topic: 'emergency',
    patterns: [
      /\b(911|emergency|ambulance|police|fire.?dept)\b/i,
      /\b(hurt|injured|bleeding|unconscious|medical|accident)\b/i,
      /\b(shooting|shot|stabbed|attack|assault|violence)\b/i,
      /\b(suicide|self.harm|kill.myself|end.it)\b/i,
    ],
  },
  {
    topic: 'legal_force',
    patterns: [
      /\b(use of force|detain|detention|arrest|trespass|shoplifter|shopkeeper)\b/i,
      /\b(citizen.*arrest|lawful.*detain|can i hold|have the right to)\b/i,
      /\b(graham|garner|reasonable force|deadly force|stand your ground)\b/i,
    ],
  },
  {
    topic: 'calloff',
    patterns: [
      /\b(calloff|call.?off|calling off|can't make|won't make|miss.*shift)\b/i,
      /\b(sick|ill|not coming in|coverage|replacement|backfill)\b/i,
    ],
  },
  {
    topic: 'scheduling',
    patterns: [
      /\b(schedule|shift|roster|post|assignment|draft.*schedule|approve.*schedule)\b/i,
      /\b(publish|open shift|swap|time off)\b/i,
    ],
  },
  {
    topic: 'payroll',
    patterns: [
      /\b(payroll|timesheet|clock.?in|clock.?out|time entry|pay stub|direct deposit)\b/i,
      /\b(hours|overtime|OT|pay period|paycheck)\b/i,
    ],
  },
  {
    topic: 'billing',
    patterns: [
      /\b(invoice|billing|payment|stripe|subscription|overage|spend cap)\b/i,
      /\b(charge|credit|refund|billing rate|client invoice)\b/i,
    ],
  },
  {
    topic: 'compliance',
    patterns: [
      /\b(compliance|audit|DPS|PSB|BSIS|guard card|license|certification)\b/i,
      /\b(auditor|regulatory|expir|expired|renewal|inspection)\b/i,
    ],
  },
  {
    topic: 'onboarding',
    patterns: [
      /\b(onboard|setup|getting started|org code|organization code|state selection)\b/i,
      /\b(new org|new tenant|new account|first time|initial setup)\b/i,
    ],
  },
  {
    topic: 'devops',
    patterns: [
      /\b(deploy|patch|fix|build|railway|git|schema|migration|crash|error log)\b/i,
      /\b(drizzle|prisma|zod|type error|import error|startup crash)\b/i,
    ],
  },
  {
    topic: 'permissions',
    patterns: [
      /\b(permission|role|access|rbac|can.*do|allowed to|authorized)\b/i,
      /\b(manager|owner|supervisor|employee.*access|what can)\b/i,
    ],
  },
  {
    topic: 'client_request',
    patterns: [
      /\b(client.*request|inbound.*email|client.*shift|new.*job|work.*request)\b/i,
    ],
  },
];

export function classifyTopic(message: string): DocumentTopic {
  for (const { topic, patterns } of TOPIC_PATTERNS) {
    if (patterns.some(p => p.test(message))) {
      return topic;
    }
  }
  return 'general';
}

// ── Context builder ───────────────────────────────────────────────────────────

export interface ContextInjection {
  topic: DocumentTopic;
  sections: string[];
  tokenEstimate: number; // rough estimate
}

const ZERO_LIABILITY_EXCERPT = `
=== ZERO LIABILITY PROTOCOL (ALWAYS ACTIVE) ===
In ANY medical, violent, or life-threatening situation:
  NEVER offer to call 911 or claim emergency services dispatched.
  ALWAYS: instruct user to call 911 themselves + handle admin backend.
  Example: "Please call 911 right now. I'm notifying your supervisor and logging this incident."
=== END ZERO LIABILITY PROTOCOL ===`;

export function buildContextInjection(message: string, workspaceState?: string): ContextInjection {
  const topic = classifyTopic(message);
  const sections: string[] = [ZERO_LIABILITY_EXCERPT];

  const workflow = readDoc('workflow');
  const rbac = readDoc('rbac');
  const cognitive = readDoc('cognitive');

  switch (topic) {
    case 'emergency':
      sections.push(extractSection(cognitive, 'Zero Liability Protocol'));
      sections.push(extractSection(cognitive, 'Operational Safety Lobe'));
      break;

    case 'legal_force':
      sections.push(extractSection(cognitive, 'Jurisprudence Engine'));
      sections.push(extractSection(cognitive, 'Operational Safety Lobe'));
      if (workspaceState) {
        sections.push(`Active state: ${workspaceState} — use state-specific statutes from regulatory_knowledge_base`);
      }
      break;

    case 'calloff':
      sections.push(extractSection(workflow, 'PIPELINE 2'));
      sections.push(extractSection(workflow, 'SARGE Calloff Feedback'));
      break;

    case 'scheduling':
      sections.push(extractSection(workflow, 'PIPELINE 1'));
      sections.push(extractSection(workflow, 'PIPELINE 2'));
      sections.push(extractSection(rbac, 'MANAGER'));
      break;

    case 'payroll':
      sections.push(extractSection(workflow, 'PIPELINE 5'));
      sections.push(extractSection(rbac, 'ORG_OWNER'));
      break;

    case 'billing':
      sections.push(extractSection(workflow, 'PIPELINE 6'));
      sections.push(extractSection(rbac, 'ORG_OWNER'));
      break;

    case 'compliance':
      sections.push(extractSection(workflow, 'PIPELINE 7'));
      sections.push(extractSection(rbac, 'AUDITOR'));
      break;

    case 'onboarding':
      sections.push(extractSection(workflow, 'PIPELINE 1 — ZERO-TO-LIVE'));
      sections.push(extractSection(workflow, 'OnboardingGate'));
      break;

    case 'devops':
      sections.push(extractSection(cognitive, '3-Strike Rule'));
      sections.push(extractSection(cognitive, 'Blast Radius'));
      sections.push(extractSection(cognitive, 'Post-Mortem Learning'));
      break;

    case 'permissions':
      sections.push(extractSection(rbac, 'PERMISSION MATRIX'));
      sections.push(extractSection(rbac, 'AI Agent RBAC'));
      break;

    case 'client_request':
      sections.push(extractSection(workflow, 'PIPELINE 4'));
      break;

    case 'general':
      // General: inject just the capabilities summary (already in platformCapabilitiesService)
      break;
  }

  const combined = sections.filter(Boolean).join('\n\n');
  const tokenEstimate = Math.round(combined.length / 4); // ~4 chars/token

  log.info(`[ContextEngine] Topic: ${topic}, sections: ${sections.length}, ~${tokenEstimate} tokens`);

  return { topic, sections: sections.filter(Boolean), tokenEstimate };
}

/**
 * Query a specific doc file for a section by keyword.
 * Used by the read_system_documentation Gemini tool.
 */
export function queryDocumentation(
  document: 'workflow' | 'rbac' | 'system' | 'cognitive',
  query: string
): string {
  const doc = readDoc(document);
  if (!doc) return 'Document not available.';

  // Find the most relevant section
  const lines = doc.split('\n');
  const queryLower = query.toLowerCase();

  // Score each line for relevance
  const scored: Array<{ lineIdx: number; score: number }> = [];
  lines.forEach((line, idx) => {
    if (line.match(/^#{1,4}\s+/) && line.toLowerCase().includes(queryLower)) {
      scored.push({ lineIdx: idx, score: 10 });
    } else if (line.toLowerCase().includes(queryLower)) {
      scored.push({ lineIdx: idx, score: 1 });
    }
  });

  if (scored.length === 0) return `No section found for "${query}" in ${document} documentation.`;

  // Get the best match heading
  const bestHeading = scored.sort((a, b) => b.score - a.score)[0];
  const headingLine = lines[bestHeading.lineIdx];
  const sectionTitle = headingLine.replace(/^#+\s+/, '').trim();

  return extractSection(doc, sectionTitle) ||
    `Found reference to "${query}" but could not extract section.`;
}
