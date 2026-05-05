/**
 * ID Photo Verification Route — Wave 23A
 * POST /api/compliance/verify/id-photo
 * Guard uploads an ID or security license photo → Gemini Vision extracts fields
 * → cross-references against known templates → SARGE drops license_verify card.
 *
 * DISCLAIMER hardcoded: "AI extraction — human verification required for legal decisions."
 * Trinity NEVER claims document is authentic. Only flags anomalies for human review.
 */
import { Router, type Response } from "express";
import { requireAuth } from "../auth";
import { type AuthenticatedRequest } from "../rbac";
import { ensureWorkspaceAccess } from "../middleware/workspaceScope";
import { createLogger } from "../lib/logger";
import { broadcastToWorkspace } from "../websocket";
import multer from "multer";

const log = createLogger("IdPhotoVerification");
export const idPhotoRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const EXTRACTION_PROMPT = `You are analyzing an image of an official document — either a state-issued 
driver's license, state ID card, or security guard license. Extract the following fields as JSON:

{
  "documentType": "drivers_license" | "state_id" | "security_license" | "unknown",
  "issuerState": "2-letter state code or null",
  "fullName": "as printed or null",
  "dateOfBirth": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "idNumber": "the primary ID or license number or null",
  "licenseType": "e.g. Level II Unarmed, Level III Armed, or null if not a security license",
  "isExpired": true | false | null,
  "layoutAnomalies": ["list of any unusual characteristics: cropping, pixelation, inconsistent fonts, etc."],
  "overallConfidence": 0.0-1.0
}

Be conservative. If a field is unclear, return null rather than guessing.
Do not add commentary — return only valid JSON.`;

idPhotoRouter.post("/",
  requireAuth, ensureWorkspaceAccess,
  upload.single("photo"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const { employeeId, roomId } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "No photo uploaded" });
      }

      const imageData = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype as "image/jpeg" | "image/png";

      // Step 1: Gemini Vision extraction
      let extracted: Record<string, unknown> = {};
      try {
        const { geminiClient } = await import("../services/ai-brain/providers/geminiClient");
        const result = await (geminiClient as {
          generateWithVision?: (imageData: string, mimeType: string, prompt: string) => Promise<string>
        }).generateWithVision?.(imageData, mimeType, EXTRACTION_PROMPT) || "{}";

        // Parse JSON from Gemini response
        const jsonMatch = result.match(/\{[\s\S]+\}/);
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
      } catch (geminiErr: unknown) {
        log.warn("[IdVerify] Gemini extraction failed:", geminiErr instanceof Error ? geminiErr.message : String(geminiErr));
        extracted = { overallConfidence: 0, layoutAnomalies: ["Extraction failed — manual verification required"] };
      }

      // Step 2: Build verification links if it's a security license
      const verificationLinks: Array<{ url: string; label: string; note: string }> = [];
      if (extracted.documentType === "security_license" && extracted.fullName) {
        const nameParts = String(extracted.fullName).trim().split(" ");
        const lastName = nameParts.pop() || "";
        const firstName = nameParts.join(" ");
        const state = String(extracted.issuerState || "TX");
        try {
          const { buildQuickVerificationLinks } = await import("../services/licenseVerificationService");
          const links = buildQuickVerificationLinks(firstName, lastName, String(extracted.idNumber || ""), state);
          verificationLinks.push(...links);
        } catch { /* non-blocking */ }
      }

      // Step 3: Build warning
      const anomalies = (extracted.layoutAnomalies as string[]) || [];
      const isExpired = extracted.isExpired === true;
      let warning: string | null = null;
      if (isExpired) warning = "DOCUMENT EXPIRED";
      else if (anomalies.length > 0) warning = `ANOMALY DETECTED: ${anomalies[0]}`;

      // Step 4: Drop ChatActionBlock into room (if roomId provided)
      if (roomId) {
        await broadcastToWorkspace(workspaceId, {
          type: "chatdock_action_card",
          data: {
            roomId,
            actionType: "license_verify",
            senderId: "helpai-bot",
            senderName: "SARGE",
            props: {
              body: `ID verification result for ${extracted.fullName || "Unknown"}`,
              extractedName: extracted.fullName,
              extractedExpiry: extracted.expiryDate,
              extractedLicenseType: extracted.licenseType,
              issuerState: extracted.issuerState,
              confidenceScore: extracted.overallConfidence,
              anomalies,
              verificationLinks,
              warning,
              disclaimer: "AI extraction only — human verification required for legal decisions",
            },
          },
        }).catch(() => {});
      }

      // Step 5: Log to generated_documents
      try {
        const { pool } = await import("../db");
        await pool.query(
          `INSERT INTO generated_documents
             (workspace_id, document_type, reference_id, doc_id, generated_at, metadata)
           VALUES ($1, 'id_verification_result', $2, $3, NOW(), $4::jsonb)
           ON CONFLICT DO NOTHING`,
          [workspaceId, employeeId || null,
           `idv-${Date.now()}`,
           JSON.stringify({ extracted, warning, anomalies })]
        ).catch(() => {});
      } catch { /* non-blocking */ }

      log.info(`[IdVerify] Processed for workspace ${workspaceId}, confidence=${extracted.overallConfidence}`);

      return res.json({
        success: true,
        extracted,
        verificationLinks,
        warning,
        anomalies,
        disclaimer: "AI extraction only — human verification required for legal decisions",
      });
    } catch (err: unknown) {
      log.error("[IdVerify] Failed:", err instanceof Error ? err.message : String(err));
      return res.status(500).json({ error: "ID verification failed" });
    }
  }
);
