/**
 * Post Order RAG Service — Wave 11 / Task 4
 * ─────────────────────────────────────────────────────────────────────────────
 * Site-scoped Retrieval-Augmented Generation for Post Orders.
 *
 * When a guard asks Trinity "What is the gate code for the North lot?" —
 * Trinity ONLY searches the Post Order for the guard's current shift site.
 * She never returns information from another site. This prevents cross-site
 * information leakage in multi-client operations.
 *
 * HOW IT WORKS:
 *   1. Guard sends question to Trinity in ChatDock
 *   2. System looks up guard's active shift → gets siteId
 *   3. RAG pulls the Post Order text for that specific site
 *   4. Gemini Flash answers using ONLY that site's content
 *   5. If no Post Order is on file, Trinity says so honestly
 *
 * NO EMBEDDINGS REQUIRED for MVP: We use Gemini's 1M context window to
 * pass the entire Post Order text as context. No vector DB needed.
 * When Post Orders exceed ~100 pages, upgrade path is Vertex AI Matching Engine.
 *
 * POST /api/post-orders/ask — guard asks a site-scoped question
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { classifyAndRoute } from '../ai-brain/providers/taskComplexityClassifier';

const log = createLogger('PostOrderRAG');

export interface PostOrderAnswer {
  answer: string;
  siteId: string | null;
  siteName: string | null;
  sourceDocument: string | null;
  confidence: 'high' | 'medium' | 'low' | 'not_found';
  disclaimer: string;
}

// ── Look up guard's current shift site ───────────────────────────────────────
async function getGuardCurrentSite(
  workspaceId: string,
  employeeId: string
): Promise<{ siteId: string; siteName: string } | null> {
  try {
    const { rows } = await pool.query(
      `SELECT s.site_id, si.name AS site_name
       FROM shifts s
       LEFT JOIN sites si ON si.id = s.site_id
       WHERE s.workspace_id = $1
         AND s.assigned_employee_id = $2
         AND s.start_time <= NOW()
         AND s.end_time >= NOW()
         AND s.status IN ('active', 'started', 'in_progress')
       ORDER BY s.start_time DESC
       LIMIT 1`,
      [workspaceId, employeeId]
    );
    if (!rows[0]?.site_id) return null;
    return { siteId: rows[0].site_id, siteName: rows[0].site_name || 'Your Site' };
  } catch {
    return null;
  }
}

// ── Load Post Order content for a site ───────────────────────────────────────
async function getSitePostOrderContent(
  workspaceId: string,
  siteId: string
): Promise<{ content: string; documentName: string; version: string } | null> {
  try {
    // Check post_order_versions table (the Wave 7 version control system)
    const { rows } = await pool.query(
      `SELECT pov.content, pov.version_number, pot.title
       FROM post_order_versions pov
       JOIN post_order_templates pot ON pot.id = pov.template_id
       WHERE pot.workspace_id = $1
         AND pot.site_id = $2
         AND pov.is_current = true
       ORDER BY pov.created_at DESC
       LIMIT 1`,
      [workspaceId, siteId]
    );

    if (rows[0]?.content) {
      return {
        content: String(rows[0].content),
        documentName: String(rows[0].title || 'Post Order'),
        version: String(rows[0].version_number || '1.0'),
      };
    }

    // Fallback: check post_order_templates directly
    const { rows: templateRows } = await pool.query(
      `SELECT content, title FROM post_order_templates
       WHERE workspace_id = $1 AND site_id = $2
       ORDER BY updated_at DESC LIMIT 1`,
      [workspaceId, siteId]
    );

    if (templateRows[0]?.content) {
      return {
        content: String(templateRows[0].content),
        documentName: String(templateRows[0].title || 'Post Order'),
        version: 'current',
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ── Main RAG answer function ──────────────────────────────────────────────────
export async function answerPostOrderQuestion(params: {
  workspaceId: string;
  employeeId: string;
  question: string;
  /** Override site — managers can ask about any site */
  overrideSiteId?: string;
}): Promise<PostOrderAnswer> {
  const { workspaceId, employeeId, question, overrideSiteId } = params;

  // Step 1: Find the guard's current site
  let siteId: string | null = overrideSiteId || null;
  let siteName: string | null = null;

  if (!siteId) {
    const currentSite = await getGuardCurrentSite(workspaceId, employeeId);
    if (!currentSite) {
      return {
        answer: "I don't see you on an active shift right now, so I can't scope your question to a specific site. If you're asking about a specific site, please mention the site name or ask your manager.",
        siteId: null,
        siteName: null,
        sourceDocument: null,
        confidence: 'not_found',
        disclaimer: 'No active shift found for this employee.',
      };
    }
    siteId = currentSite.siteId;
    siteName = currentSite.siteName;
  } else {
    // Manager override — get site name
    const { rows } = await pool.query(`SELECT name FROM sites WHERE id = $1 LIMIT 1`, [siteId]).catch(() => ({ rows: [] }));
    siteName = rows[0]?.name || siteId;
  }

  // Step 2: Load Post Order for this site
  const postOrder = await getSitePostOrderContent(workspaceId, siteId);

  if (!postOrder) {
    return {
      answer: `I don't have a Post Order on file for ${siteName}. Please ask your supervisor or contact the operations team to upload one.`,
      siteId,
      siteName,
      sourceDocument: null,
      confidence: 'not_found',
      disclaimer: `No Post Order found for site: ${siteName}`,
    };
  }

  // Step 3: Answer using Gemini Flash (cheapest — executor tier, context window answer)
  try {
    const { meteredGemini } = await import('../billing/meteredGeminiClient');

    const systemPrompt = [
      `You are Trinity, the security operations AI assistant for ${siteName}.`,
      `Answer ONLY using the Post Order document provided below.`,
      `If the answer is not in the document, say so explicitly — do NOT guess or use general knowledge.`,
      `Be specific and direct. Guards on duty need clear, actionable answers.`,
      `NEVER reveal information from other sites. This document is site-specific.`,
    ].join('\n');

    const userPrompt = [
      `POST ORDER DOCUMENT — ${postOrder.documentName} (v${postOrder.version}):`,
      `---`,
      postOrder.content.slice(0, 50_000), // Respect context window
      `---`,
      `GUARD'S QUESTION: ${question}`,
    ].join('\n');

    const role = classifyAndRoute({
      actionType: 'post_order_question',
      prompt: question,
      isRealtime: true,
    });

    const result = await meteredGemini({
      workspaceId,
      userId: employeeId,
      prompt: userPrompt,
      systemPrompt,
      actionType: 'post_order_rag',
      featureName: 'post_order_assistant',
    });

    const answer = result.text?.trim() || 'I was unable to retrieve an answer. Please contact your supervisor.';
    const confidence = answer.toLowerCase().includes('not in') || answer.toLowerCase().includes("don't see")
      ? 'low' : 'high';

    log.info(`[PostOrderRAG] ws=${workspaceId} site=${siteId} confidence=${confidence}`);

    return {
      answer,
      siteId,
      siteName,
      sourceDocument: `${postOrder.documentName} v${postOrder.version}`,
      confidence,
      disclaimer: `Answer sourced from: ${postOrder.documentName} (${siteName} only). Always verify critical procedures with your supervisor.`,
    };

  } catch (err: unknown) {
    log.error('[PostOrderRAG] AI call failed:', err instanceof Error ? err.message : String(err));
    return {
      answer: 'I encountered an error retrieving the Post Order answer. Please check with your supervisor.',
      siteId,
      siteName,
      sourceDocument: postOrder.documentName,
      confidence: 'low',
      disclaimer: 'AI error — manual lookup required.',
    };
  }
}
