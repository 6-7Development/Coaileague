/**
 * PDF Document Routes — Wave 21C
 * Three endpoints + download history.
 * Auth: requireAuth + ensureWorkspaceAccess on all routes.
 */

import { Router, type Response } from "express";
import { requireAuth } from "../auth";
import { type AuthenticatedRequest, requireManager } from "../rbac";
import { ensureWorkspaceAccess } from "../middleware/workspaceScope";
import { sanitizeError } from "../middleware/errorHandler";
import { createLogger } from "../lib/logger";
import {
  generateUoFReport,
  generateDAR,
  generateDPSAuditPacket,
} from "../services/pdfEngine";
import { pool } from "../db";

const log = createLogger("PDFRoutes");
export const pdfRouter = Router();

// ── Helper: stream PDF to client ─────────────────────────────────────────────

function streamPDF(res: Response, buffer: Buffer, filename: string, docId: string): void {
  res.set({
    "Content-Type":        "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length":      String(buffer.length),
    "X-Doc-Id":            docId,
    "Cache-Control":       "no-store",
  });
  res.send(buffer);
}

// ── POST /api/documents/uof-report/:incidentId ────────────────────────────────
pdfRouter.post(
  "/uof-report/:incidentId",
  requireAuth, ensureWorkspaceAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const { incidentId } = req.params;
      const result = await generateUoFReport({
        workspaceId, incidentId,
        generatedBy: req.user?.id,
        generatedByName: req.user?.firstName && req.user?.lastName
          ? `${req.user.firstName} ${req.user.lastName}` : undefined,
      });
      streamPDF(res, result.buffer, result.filename, result.docId);
    } catch (err: unknown) {
      log.error("[PDFRoutes] UoF report failed:", err instanceof Error ? err.message : String(err));
      res.status(500).json({ error: sanitizeError(err) });
    }
  }
);

// ── POST /api/documents/dar/:darId ────────────────────────────────────────────
pdfRouter.post(
  "/dar/:darId",
  requireAuth, ensureWorkspaceAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const { darId } = req.params;
      const result = await generateDAR({
        workspaceId, darId,
        generatedBy: req.user?.id,
        generatedByName: req.user?.firstName && req.user?.lastName
          ? `${req.user.firstName} ${req.user.lastName}` : undefined,
      });
      streamPDF(res, result.buffer, result.filename, result.docId);
    } catch (err: unknown) {
      log.error("[PDFRoutes] DAR failed:", err instanceof Error ? err.message : String(err));
      res.status(500).json({ error: sanitizeError(err) });
    }
  }
);

// ── POST /api/documents/dps-audit-packet ─────────────────────────────────────
pdfRouter.post(
  "/dps-audit-packet",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const { auditLabel } = req.body as { auditLabel?: string };
      const result = await generateDPSAuditPacket({
        workspaceId,
        auditLabel,
        generatedBy: req.user?.id,
        generatedByName: req.user?.firstName && req.user?.lastName
          ? `${req.user.firstName} ${req.user.lastName}` : undefined,
      });
      log.info(`[PDFRoutes] DPS Audit Packet: ${result.pageCount} pages, doc ${result.docId}`);
      streamPDF(res, result.buffer, result.filename, result.docId);
    } catch (err: unknown) {
      log.error("[PDFRoutes] DPS Audit Packet failed:", err instanceof Error ? err.message : String(err));
      res.status(500).json({ error: sanitizeError(err) });
    }
  }
);

// ── GET /api/documents/history ────────────────────────────────────────────────
pdfRouter.get(
  "/history",
  requireAuth, ensureWorkspaceAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const { rows } = await pool.query(
        `SELECT id, document_type, reference_id, doc_id,
                file_size_bytes, page_count, generated_by_name,
                regulatory_citations, status, created_at
         FROM generated_documents
         WHERE workspace_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [workspaceId]
      );
      res.json({ success: true, documents: rows });
    } catch (err: unknown) {
      res.status(500).json({ error: sanitizeError(err) });
    }
  }
);

// ── GET /api/documents/schema-bootstrap ──────────────────────────────────────
// Idempotent — ensures generated_documents table exists
pdfRouter.post(
  "/schema-bootstrap",
  requireAuth,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS generated_documents (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          workspace_id VARCHAR NOT NULL,
          document_type VARCHAR(80) NOT NULL,
          reference_id VARCHAR(200),
          doc_id VARCHAR(80) NOT NULL UNIQUE,
          file_size_bytes INTEGER,
          page_count INTEGER,
          storage_path TEXT,
          generated_by VARCHAR,
          generated_by_name VARCHAR(200),
          snapshot_json JSONB,
          regulatory_citations TEXT[] DEFAULT ARRAY[]::text[],
          status VARCHAR(20) DEFAULT 'generated',
          sent_to_client_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS gendoc_ws_type_idx ON generated_documents(workspace_id, document_type);
        CREATE INDEX IF NOT EXISTS gendoc_ref_idx ON generated_documents(reference_id);
        CREATE INDEX IF NOT EXISTS gendoc_docid_idx ON generated_documents(doc_id);
      `);
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(500).json({ error: sanitizeError(err) });
    }
  }
);
