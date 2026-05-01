/**
 * Document Form Routes
 * ====================
 * Handles the Universal Document Template System (UDTS) form API.
 *
 * Routes:
 *   GET  /api/document-forms/templates          — list all templates
 *   GET  /api/document-forms/templates/:id      — get single template definition
 *   POST /api/document-forms/validate           — validate form data (Trinity pipeline)
 *   POST /api/document-forms/submit             — validate + store submission + trigger PDF
 *   POST /api/document-forms/draft              — save/update a draft
 *   GET  /api/document-forms/draft/:templateId  — load draft for current user
 */

import { Router } from "express";
import { db } from "../db";
import { customFormSubmissions, workspaces, employees, users } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../rbac";
import { getTemplate, getAllTemplates, TEMPLATE_REGISTRY } from "../services/documents/templateRegistry";
import { validateDocumentForm } from "../services/documents/trinityDocumentValidator";
import { generateSubmissionPdf } from "../services/forms/submissionPdfService";
import { saveToVault, type FormCategory } from "../services/documents/businessFormsVaultService";
import { platformEventBus } from "../services/platformEventBus";
import { sendCanSpamCompliantEmail } from "../services/emailCore";
import { scheduleNonBlocking } from "../lib/scheduleNonBlocking";
import { createLogger } from '../lib/logger';
const log = createLogger('DocumentFormRoutes');

// UDTS templates use richer category strings (employment, payroll, tax,
// policy, operations, etc.). The vault accepts a smaller closed set; map
// the template category to the vault's FormCategory so storage stays
// consistent and document numbers are prefixed correctly.
function toVaultCategory(templateCategory: string): FormCategory {
  const c = (templateCategory || '').toLowerCase();
  if (c === 'tax') return 'tax';
  if (c === 'payroll') return 'payroll';
  if (c === 'operations' || c === 'field') return 'operations';
  if (c === 'legal' || c === 'contract' || c === 'agreement') return 'legal';
  if (c === 'compliance' || c === 'regulatory') return 'compliance';
  // employment, policy, hr, onboarding, training → hr
  return 'hr';
}

// Pull the first signer name we can find — preferring explicit fullName
// fields, then firstName + lastName, then any "name" field. Used both for
// the PDF signer block and the vault title.
function deriveSignerName(formData: Record<string, any>): string | null {
  if (typeof formData.fullName === 'string' && formData.fullName.trim()) {
    return formData.fullName.trim();
  }
  if (typeof formData.fullLegalName === 'string' && formData.fullLegalName.trim()) {
    return formData.fullLegalName.trim();
  }
  const first = typeof formData.firstName === 'string' ? formData.firstName.trim() : '';
  const last = typeof formData.lastName === 'string' ? formData.lastName.trim() : '';
  const composed = `${first} ${last}`.trim();
  if (composed) return composed;
  if (typeof formData.employeeName === 'string' && formData.employeeName.trim()) {
    return formData.employeeName.trim();
  }
  if (typeof formData.name === 'string' && formData.name.trim()) {
    return formData.name.trim();
  }
  return null;
}


const router = Router();
router.use(requireAuth);

// ── GET /api/document-forms/templates ────────────────────────────────────────
router.get("/templates", async (_req: AuthenticatedRequest, res) => {
  try {
    const templates = getAllTemplates().map((t) => ({
      id: t.id,
      documentType: t.documentType,
      title: t.title,
      version: t.version,
      category: t.category,
      description: t.description,
      estimatedMinutes: t.estimatedMinutes,
      requiresSignature: t.requiresSignature,
      allowSaveForLater: t.allowSaveForLater,
      sectionCount: t.sections.length,
    }));
    res.json({ templates });
  } catch (err: unknown) {
    log.error("[DocumentForms] list templates error:", err);
    res.status(500).json({ error: "Failed to list templates" });
  }
});

// ── GET /api/document-forms/templates/:templateId ─────────────────────────────
router.get("/templates/:templateId", async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;
    const template = getTemplate(templateId.toUpperCase());
    if (!template) {
      return res.status(404).json({ error: `Template '${templateId}' not found` });
    }
    res.json({ template });
  } catch (err: unknown) {
    log.error("[DocumentForms] get template error:", err);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// ── POST /api/document-forms/validate ────────────────────────────────────────
const validateSchema = z.object({
  templateId: z.string().min(1),
  formData: z.record(z.any()),
});

router.post("/validate", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = validateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    }
    const { templateId, formData } = parsed.data;
    const template = getTemplate(templateId.toUpperCase());
    if (!template) {
      return res.status(404).json({ error: `Template '${templateId}' not found` });
    }
    const result = validateDocumentForm(template, formData);
    res.json(result);
  } catch (err: unknown) {
    log.error("[DocumentForms] validate error:", err);
    res.status(500).json({ error: "Validation failed" });
  }
});

// ── POST /api/document-forms/draft ───────────────────────────────────────────
const draftSchema = z.object({
  templateId: z.string().min(1),
  formData: z.record(z.any()),
  currentSectionIndex: z.number().int().min(0).optional(),
});

router.post("/draft", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = draftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    }

    const userId = req.user?.id;
    const workspaceId = req.workspaceId;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    if (!workspaceId) return res.status(403).json({ error: "Workspace context required" });

    const { templateId, formData, currentSectionIndex } = parsed.data;
    const formId = `udts-${templateId.toLowerCase()}`;

    const [existing] = await db
      .select({ id: customFormSubmissions.id })
      .from(customFormSubmissions)
      .where(
        and(
          eq(customFormSubmissions.workspaceId, workspaceId),
          eq(customFormSubmissions.formId, formId),
          eq(customFormSubmissions.submittedBy, userId),
          eq(customFormSubmissions.status, "draft"),
        )
      )
      .limit(1);

    const payload = {
      formId,
      workspaceId,
      submittedBy: userId,
      submittedByType: "employee",
      formData: {
        ...formData,
        __templateId: templateId,
        __currentSectionIndex: currentSectionIndex ?? 0,
        __savedAt: new Date().toISOString(),
      },
      status: "draft",
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    } as any;

    let record;
    if (existing) {
      [record] = await db
        .update(customFormSubmissions)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(customFormSubmissions.id, existing.id))
        .returning();
    } else {
      [record] = await db
        .insert(customFormSubmissions)
        .values(payload)
        .returning();
    }

    res.json({ success: true, draftId: record.id, savedAt: new Date().toISOString() });
  } catch (err: unknown) {
    log.error("[DocumentForms] draft save error:", err);
    res.status(500).json({ error: "Failed to save draft" });
  }
});

// ── GET /api/document-forms/draft/:templateId ────────────────────────────────
router.get("/draft/:templateId", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const workspaceId = req.workspaceId;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    if (!workspaceId) return res.status(403).json({ error: "Workspace context required" });

    const { templateId } = req.params;
    const formId = `udts-${templateId.toLowerCase()}`;

    const [draft] = await db
      .select()
      .from(customFormSubmissions)
      .where(
        and(
          eq(customFormSubmissions.workspaceId, workspaceId),
          eq(customFormSubmissions.formId, formId),
          eq(customFormSubmissions.submittedBy, userId),
          eq(customFormSubmissions.status, "draft"),
        )
      )
      .orderBy(desc(customFormSubmissions.updatedAt))
      .limit(1);

    if (!draft) return res.json({ draft: null });

    res.json({ draft });
  } catch (err: unknown) {
    log.error("[DocumentForms] draft load error:", err);
    res.status(500).json({ error: "Failed to load draft" });
  }
});

// ── POST /api/document-forms/submit ──────────────────────────────────────────
const submitSchema = z.object({
  templateId: z.string().min(1),
  formData: z.record(z.any()),
  gpsData: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    denied: z.boolean().optional(),
  }).optional(),
  skipValidation: z.boolean().optional().default(false),
});

router.post("/submit", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    }

    const userId = req.user?.id;
    const workspaceId = req.workspaceId;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    if (!workspaceId) return res.status(403).json({ error: "Workspace context required" });

    const { templateId, formData, gpsData, skipValidation } = parsed.data;
    const template = getTemplate(templateId.toUpperCase());
    if (!template) {
      return res.status(404).json({ error: `Template '${templateId}' not found` });
    }

    // Run Trinity validation
    if (!skipValidation) {
      const validation = validateDocumentForm(template, formData);
      if (!validation.valid) {
        return res.status(422).json({
          error: "Validation failed",
          validation,
        });
      }
    }

    const formId = `udts-${templateId.toLowerCase()}`;

    // Build geo location string
    const geoLocation = gpsData && !gpsData.denied
      ? `${gpsData.latitude.toFixed(6)},${gpsData.longitude.toFixed(6)}`
      : gpsData?.denied ? "denied" : null;

    // Extract primary signature data (first signature field found)
    let primarySignatureData: string | null = null;
    let signerName: string | null = null;
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.type === 'signature' && formData[field.id]) {
          primarySignatureData = formData[field.id];
          break;
        }
      }
      if (primarySignatureData) break;
    }

    // Try to extract name from form data
    const nameKeys = ['firstName', 'lastName', 'employeeName', 'fullName', 'name'];
    const parts: string[] = [];
    for (const k of nameKeys) {
      if (formData[k] && typeof formData[k] === 'string') parts.push(formData[k]);
      if (parts.length >= 2) break;
    }
    signerName = parts.join(' ').trim() || null;

    // Store submission record
    const submissionData = {
      formId,
      workspaceId,
      submittedBy: userId,
      submittedByType: "employee",
      formData: {
        ...formData,
        __templateId: templateId,
        __submittedAt: new Date().toISOString(),
        __geoLocation: geoLocation,
      },
      signatureData: primarySignatureData ? {
        signatureData: primarySignatureData,
        signerName,
        signedAt: new Date().toISOString(),
        ipAddress: req.ip,
        geoLocation,
        userAgent: req.headers["user-agent"],
      } : null,
      hasAccepted: true,
      acceptedAt: new Date(),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      status: "completed",
    } as any;

    const [submission] = await db
      .insert(customFormSubmissions)
      .values(submissionData)
      .returning();

    // Archive existing drafts — never hard-delete submission history
    await db
      .update(customFormSubmissions)
      .set({
        status: "archived",
        updatedAt: new Date(),
        formData: sql`form_data || ${JSON.stringify({ __archivedAt: new Date().toISOString() })}::jsonb`,
      })
      .where(
        and(
          eq(customFormSubmissions.workspaceId, workspaceId),
          eq(customFormSubmissions.formId, formId),
          eq(customFormSubmissions.submittedBy, userId),
          eq(customFormSubmissions.status, "draft"),
        )
      );

    // ── End-cycle handshake ──────────────────────────────────────────────────
    // 1. Render the submitted form to a branded PDF (sections, fields,
    //    signature blocks, acknowledgments, audit metadata).
    // 2. Stamp + persist to the document vault (uploads to GCS, writes
    //    documentVault row). The vault writer is the single source of truth
    //    for end-user/tenant safe access via /api/document-vault/:id/{download,preview}.
    // 3. UPDATE the submission row with pdfUrl + vault reference so the
    //    submission feed always points at the canonical PDF.
    // 4. Publish a platform event so listeners (Trinity, manager dashboard,
    //    chat dock) can react in real time.
    // 5. Best-effort receipt email to the signer.
    //
    // The handshake is wrapped in try/catch so a vault failure surfaces
    // explicitly to the caller (we do NOT silently report success when the
    // PDF/vault step failed — that was the gap in the previous design).
    let vaultPayload: { id: string; documentNumber: string | null } | null = null;
    let pdfUrl: string | null = null;

    try {
      const [ws] = await db
        .select({ id: workspaces.id, name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      // Try to resolve the signing user's display name from the user row
      // when the form data does not carry it.
      let resolvedSignerName = signerName ?? deriveSignerName(formData);
      if (!resolvedSignerName) {
        const [u] = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        resolvedSignerName = u
          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || null
          : null;
      }

      const submittedAtIso = (submission.submittedAt instanceof Date
        ? submission.submittedAt
        : new Date()
      ).toISOString();

      const pdfBuffer = await generateSubmissionPdf({
        template,
        formData,
        signer: {
          signerName: resolvedSignerName,
          ipAddress: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          geoLocation,
          submittedAt: submittedAtIso,
        },
        workspaceId,
        workspaceName: ws?.name ?? null,
        submissionRef: submission.id,
      });

      // Resolve the related employee record (if any) so the vault row is
      // addressed to the right officer for safe-tab visibility.
      const [emp] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(and(eq(employees.userId, userId), eq(employees.workspaceId, workspaceId)))
        .limit(1);

      const vaultResult = await saveToVault({
        workspaceId,
        workspaceName: ws?.name || workspaceId,
        documentTitle: template.title,
        category: toVaultCategory(template.category),
        relatedEntityType: emp ? 'employee' : 'submission',
        relatedEntityId: emp?.id ?? submission.id,
        generatedBy: userId,
        rawBuffer: pdfBuffer,
      });

      if (!vaultResult.success || !vaultResult.vault) {
        log.error('[DocumentForms] Vault save failed for submission', submission.id, vaultResult.error);
        return res.status(500).json({
          success: false,
          submissionId: submission.id,
          error: `Document was recorded but the PDF could not be saved to the vault: ${vaultResult.error || 'unknown error'}`,
        });
      }

      vaultPayload = {
        id: vaultResult.vault.id,
        documentNumber: vaultResult.vault.documentNumber ?? null,
      };
      pdfUrl = vaultResult.vault.fileUrl;

      // Stamp the submission row with the vault reference
      await db
        .update(customFormSubmissions)
        .set({
          pdfUrl: pdfUrl,
          updatedAt: new Date(),
          formData: sql`form_data || ${JSON.stringify({
            __vaultDocumentId: vaultPayload.id,
            __vaultDocumentNumber: vaultPayload.documentNumber,
            __pdfGeneratedAt: new Date().toISOString(),
          })}::jsonb`,
        })
        .where(eq(customFormSubmissions.id, submission.id));

      // Fire-and-forget event so manager dashboards / chat dock surface it
      scheduleNonBlocking('document-forms.submit.publish', async () => {
        platformEventBus.publish({
          type: 'document.submitted' as any,
          category: 'compliance' as any,
          workspaceId,
          userId,
          title: `${template.title} submitted`,
          description: resolvedSignerName
            ? `${resolvedSignerName} submitted ${template.title}.`
            : `${template.title} was submitted.`,
          metadata: {
            submissionId: submission.id,
            templateId: template.id,
            templateCategory: template.category,
            vaultId: vaultPayload!.id,
            documentNumber: vaultPayload!.documentNumber,
            employeeId: emp?.id ?? null,
            signerName: resolvedSignerName,
          },
        } as any);
      });

      // Best-effort receipt email — never blocks the response and never fails
      // the request if email is misconfigured for this environment.
      scheduleNonBlocking('document-forms.submit.receipt-email', async () => {
        try {
          const [u] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          if (!u?.email) return;
          const docLabel = vaultPayload?.documentNumber ?? submission.id.slice(0, 8);
          await sendCanSpamCompliantEmail({
            to: u.email,
            subject: `Your ${template.title} has been received (${docLabel})`,
            workspaceId,
            emailType: 'document_receipt',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
                <h2 style="margin:0 0 12px 0">Document received</h2>
                <p>We received your <strong>${template.title}</strong> submission and saved a signed PDF copy to your document safe.</p>
                <p style="margin:18px 0;padding:12px 16px;background:#f3f4f6;border-radius:6px;font-size:14px">
                  <strong>Document #:</strong> ${docLabel}<br/>
                  <strong>Submitted:</strong> ${submittedAtIso}
                </p>
                <p style="font-size:13px;color:#6b7280">
                  This document is legally binding once submitted. Open it any time from your document safe to view, download, or share with auditors.
                </p>
              </div>
            `,
          });
        } catch (mailErr: any) {
          log.warn('[DocumentForms] receipt email skipped:', mailErr?.message);
        }
      });
    } catch (handshakeErr: any) {
      log.error('[DocumentForms] post-submit handshake failed:', handshakeErr?.message);
      // The submission row exists; surface the partial-failure clearly so
      // the caller can retry the PDF/vault step instead of assuming success.
      return res.status(500).json({
        success: false,
        submissionId: submission.id,
        error: `Document recorded but PDF generation failed: ${handshakeErr?.message || 'unknown error'}`,
      });
    }

    res.json({
      success: true,
      submissionId: submission.id,
      submittedAt: submission.submittedAt,
      vaultId: vaultPayload?.id ?? null,
      documentNumber: vaultPayload?.documentNumber ?? null,
      pdfUrl,
      message: "Document submitted successfully",
    });
  } catch (err: unknown) {
    log.error("[DocumentForms] submit error:", err);
    res.status(500).json({ error: "Failed to submit document" });
  }
});

// ── GET /api/document-forms/submissions ──────────────────────────────────────
router.get("/submissions", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const workspaceId = req.workspaceId;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    if (!workspaceId) return res.status(403).json({ error: "Workspace context required" });

    const submissions = await db
      .select({
        id: customFormSubmissions.id,
        formId: customFormSubmissions.formId,
        status: customFormSubmissions.status,
        submittedAt: customFormSubmissions.submittedAt,
        updatedAt: customFormSubmissions.updatedAt,
      })
      .from(customFormSubmissions)
      .where(
        and(
          eq(customFormSubmissions.workspaceId, workspaceId),
          eq(customFormSubmissions.submittedBy, userId),
        )
      )
      .orderBy(desc(customFormSubmissions.updatedAt))
      .limit(50);

    const enriched = submissions.map((s) => {
      const templateId = s.formId.startsWith("udts-") ? s.formId.slice(5).toUpperCase() : null;
      const template = templateId ? getTemplate(templateId) : null;
      return {
        ...s,
        templateId,
        templateTitle: template?.title ?? null,
        templateCategory: template?.category ?? null,
      };
    });

    res.json({ submissions: enriched });
  } catch (err: unknown) {
    log.error("[DocumentForms] submissions error:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

export default router;
