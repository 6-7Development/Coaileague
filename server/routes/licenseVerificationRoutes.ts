/**
 * License Verification Routes
 * GET  /api/compliance/verify/officer/:employeeId  → OfficerVerificationCard
 * GET  /api/compliance/verify/company              → CompanyVerificationCard
 * POST /api/compliance/verify/quick                → quick links from name+license
 */
import { Router, type Response } from "express";
import { requireAuth } from "../auth";
import { type AuthenticatedRequest, requireManager } from "../rbac";
import { ensureWorkspaceAccess } from "../middleware/workspaceScope";
import { buildOfficerVerificationCard, buildCompanyVerificationCard, buildQuickVerificationLinks } from "../services/licenseVerificationService";
import { sanitizeError } from "../middleware/errorHandler";
import { createLogger } from "../lib/logger";

const log = createLogger("LicenseVerificationRoutes");
export const licenseVerificationRouter = Router();

// Officer license verification card
licenseVerificationRouter.get(
  "/officer/:employeeId",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { employeeId } = req.params;
      const workspaceId = req.workspaceId!;
      const card = await buildOfficerVerificationCard(employeeId, workspaceId);
      if (!card) return res.status(404).json({ success: false, error: "Officer not found" });
      return res.json({ success: true, card });
    } catch (err: unknown) {
      log.error("Officer verification failed:", err instanceof Error ? err.message : String(err));
      return res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  }
);

// Company license verification card
licenseVerificationRouter.get(
  "/company",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const card = await buildCompanyVerificationCard(workspaceId);
      if (!card) return res.status(404).json({ success: false, error: "Company not found" });
      return res.json({ success: true, card });
    } catch (err: unknown) {
      return res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  }
);

// Quick link generator — for Trinity chat: name + license number → deep links
licenseVerificationRouter.post(
  "/quick",
  requireAuth, ensureWorkspaceAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName, licenseNumber, stateCode } = req.body;
      if (!lastName) return res.status(400).json({ success: false, error: "lastName required" });
      const links = buildQuickVerificationLinks(
        String(firstName || ""),
        String(lastName),
        licenseNumber ? String(licenseNumber) : null,
        String(stateCode || "TX")
      );
      return res.json({ success: true, links });
    } catch (err: unknown) {
      return res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  }
);
