/**
 * License Verification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates deep-link URLs for manual license verification on state regulatory
 * websites. Trinity uses this to produce one-click verification cards.
 *
 * WHY DEEP LINKS, NOT AUTOMATION:
 *   State PSB sites use CAPTCHA to block bots. Bypassing it on a .gov site
 *   violates their ToS and creates legal risk for a licensed security company.
 *   Deep links eliminate all the typing — manager clicks, lands directly on the
 *   pre-filled search, solves CAPTCHA in 5 seconds, done.
 *
 *   When DPS data agreement (Option 1) is approved, this service gets upgraded
 *   to query the local data export directly — no CAPTCHA at all.
 *
 * STATES SUPPORTED:
 *   TX — Texas DPS PSB (TOPS system)   — individual + company search
 *   CA — California BSIS               — guard card + PPO search
 *   FL — Florida DBPR Chapter 493      — individual + agency search
 *   NY — New York DOS Licensing         — security guard search
 *
 * FUTURE: when DPS data agreement is in place, add queryLocalLicenseData()
 * that reads from the bulk export table instead of generating links.
 */

import { pool } from "../db";
import { createLogger } from "../lib/logger";

const log = createLogger("LicenseVerificationService");

// ── URL builders per state ────────────────────────────────────────────────────

function buildTopsIndividualUrl(firstName: string, lastName: string): string {
  // TOPS = Texas Online Public Safety — DPS PSB public search
  const params = new URLSearchParams();
  if (lastName) params.set("LastName", lastName.toUpperCase().trim());
  if (firstName) params.set("FirstName", firstName.toUpperCase().trim());
  params.set("LicenseType", ""); // blank = all types
  return `https://tops.dps.texas.gov/PSBLicenseeSearch/Search?${params.toString()}`;
}

function buildTopsCompanyUrl(companyName: string): string {
  const params = new URLSearchParams();
  params.set("CompanyName", companyName.trim());
  return `https://tops.dps.texas.gov/PSBLicenseeSearch/CompanySearch?${params.toString()}`;
}

function buildTopsByLicenseUrl(licenseNumber: string): string {
  const params = new URLSearchParams();
  params.set("LicenseNumber", licenseNumber.trim().toUpperCase());
  return `https://tops.dps.texas.gov/PSBLicenseeSearch/Search?${params.toString()}`;
}

function buildBsisUrl(name: string, licenseNumber?: string): string {
  // California BSIS license lookup
  const base = "https://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup";
  const params = new URLSearchParams({ p_qte_code: "SG", p_qte_pgm_code: "0" });
  if (licenseNumber) params.set("p_license_no", licenseNumber);
  else params.set("p_name_key", name.trim());
  return `${base}?${params.toString()}`;
}

function buildFloridaUrl(licenseNumber?: string, lastName?: string): string {
  const base = "https://www.myfloridalicense.com/LicenseDetail.asp";
  const params = new URLSearchParams({ SID: "" });
  if (licenseNumber) params.set("id", licenseNumber);
  if (lastName) params.set("nm", lastName.trim().toUpperCase());
  return `${base}?${params.toString()}`;
}

function buildNewYorkUrl(lastName: string, firstName: string): string {
  const params = new URLSearchParams({
    businessName: "",
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    licenseType: "79",  // Security Guard
  });
  return `https://www.dos.ny.gov/licensing/lookup/licenseelookup.html?${params.toString()}`;
}

// ── Core types ────────────────────────────────────────────────────────────────

export interface VerificationLink {
  label: string;
  url: string;
  note: string;
}

export interface OfficerVerificationCard {
  officerName: string;
  licenseNumber: string | null;
  licenseType: string | null;
  expiryDate: string | null;
  stateCode: string;
  verificationLinks: VerificationLink[];
  internalStatus: "active" | "expired" | "missing" | "unknown";
  warningLevel: "ok" | "warning" | "critical";
  warningReason: string | null;
  instructions: string;
}

export interface CompanyVerificationCard {
  companyName: string;
  licenseNumber: string | null;
  stateCode: string;
  verificationLinks: VerificationLink[];
  instructions: string;
}

// ── Officer verification card ─────────────────────────────────────────────────

export async function buildOfficerVerificationCard(
  employeeId: string,
  workspaceId: string
): Promise<OfficerVerificationCard | null> {
  try {
    // Pull officer data from employees + workspace state
    const result = await pool.query(
      `SELECT
         e.first_name, e.last_name,
         e.guard_card_number, e.guard_card_expiry_date, e.guard_card_status,
         e.license_type, e.is_armed,
         w.state
       FROM employees e
       JOIN workspaces w ON w.id = e.workspace_id
       WHERE e.id = $1 AND e.workspace_id = $2
       LIMIT 1`,
      [employeeId, workspaceId]
    );

    if (!result.rows[0]) return null;
    const row = result.rows[0];

    const firstName: string = row.first_name || "";
    const lastName: string = row.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const licenseNumber: string | null = row.guard_card_number || null;
    const stateCode: string = (row.state || "TX").toUpperCase();
    const expiryDate: string | null = row.guard_card_expiry_date
      ? new Date(row.guard_card_expiry_date).toLocaleDateString("en-US")
      : null;

    // Determine internal status
    let internalStatus: OfficerVerificationCard["internalStatus"] = "unknown";
    let warningLevel: OfficerVerificationCard["warningLevel"] = "ok";
    let warningReason: string | null = null;

    if (!licenseNumber) {
      internalStatus = "missing";
      warningLevel = "critical";
      warningReason = "No license number on file";
    } else if (row.guard_card_expiry_date) {
      const expiry = new Date(row.guard_card_expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.floor(
        (expiry.getTime() - now.getTime()) / 86400000
      );

      if (daysUntilExpiry < 0) {
        internalStatus = "expired";
        warningLevel = "critical";
        warningReason = `License expired ${Math.abs(daysUntilExpiry)} days ago`;
      } else if (daysUntilExpiry <= 30) {
        internalStatus = "active";
        warningLevel = "warning";
        warningReason = `License expires in ${daysUntilExpiry} days`;
      } else {
        internalStatus = "active";
        warningLevel = "ok";
      }
    } else {
      internalStatus = "active";
      warningLevel = "warning";
      warningReason = "No expiry date on file — verify current status";
    }

    // Build state-specific verification links
    const verificationLinks: VerificationLink[] = [];

    if (stateCode === "TX") {
      if (firstName && lastName) {
        verificationLinks.push({
          label: "Search by Name — TX DPS TOPS",
          url: buildTopsIndividualUrl(firstName, lastName),
          note: "Pre-filled with officer's name. Solve CAPTCHA to see results.",
        });
      }
      if (licenseNumber) {
        verificationLinks.push({
          label: "Search by License # — TX DPS TOPS",
          url: buildTopsByLicenseUrl(licenseNumber),
          note: `Pre-filled with license ${licenseNumber}. Fastest lookup.`,
        });
      }
    } else if (stateCode === "CA") {
      verificationLinks.push({
        label: "Search — California BSIS",
        url: buildBsisUrl(fullName, licenseNumber || undefined),
        note: "California Bureau of Security and Investigative Services lookup.",
      });
    } else if (stateCode === "FL") {
      verificationLinks.push({
        label: "Search — Florida DBPR",
        url: buildFloridaUrl(licenseNumber || undefined, lastName),
        note: "Florida Department of Business and Professional Regulation.",
      });
    } else if (stateCode === "NY") {
      verificationLinks.push({
        label: "Search — New York DOS",
        url: buildNewYorkUrl(lastName, firstName),
        note: "New York Department of State security guard license lookup.",
      });
    }

    // Always add the regulatory body's main search page as a fallback
    const mainPages: Record<string, { label: string; url: string }> = {
      TX: { label: "TX DPS PSB License Search", url: "https://tops.dps.texas.gov/PSBLicenseeSearch/" },
      CA: { label: "CA BSIS License Lookup",    url: "https://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=SG&p_qte_pgm_code=0" },
      FL: { label: "FL DBPR License Search",    url: "https://www.myfloridalicense.com/wl11.asp?mode=2&SID=" },
      NY: { label: "NY DOS License Lookup",     url: "https://www.dos.ny.gov/licensing/lookup/licenseelookup.html" },
    };

    if (mainPages[stateCode] && verificationLinks.length === 0) {
      const mp = mainPages[stateCode];
      verificationLinks.push({
        label: mp.label,
        url: mp.url,
        note: "Manual search required — enter officer details on the site.",
      });
    }

    const instructions = licenseNumber
      ? `Click "Search by License #" for the fastest result. The license number is pre-filled. You only need to solve the CAPTCHA.`
      : `No license number on file. Use "Search by Name" and compare the result to the officer's ID.`;

    return {
      officerName: fullName,
      licenseNumber,
      licenseType: row.license_type || null,
      expiryDate,
      stateCode,
      verificationLinks,
      internalStatus,
      warningLevel,
      warningReason,
      instructions,
    };
  } catch (err: unknown) {
    log.error("[LicenseVerification] buildOfficerVerificationCard failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ── Company verification card ─────────────────────────────────────────────────

export async function buildCompanyVerificationCard(
  workspaceId: string
): Promise<CompanyVerificationCard | null> {
  try {
    const result = await pool.query(
      `SELECT
         w.name AS company_name,
         w.state_license_number,
         w.license_number,
         w.state
       FROM workspaces w
       WHERE w.id = $1 LIMIT 1`,
      [workspaceId]
    );

    if (!result.rows[0]) return null;
    const row = result.rows[0];

    const companyName: string = row.company_name || "";
    const licenseNumber: string | null =
      row.state_license_number || row.license_number || null;
    const stateCode: string = (row.state || "TX").toUpperCase();

    const verificationLinks: VerificationLink[] = [];

    if (stateCode === "TX") {
      verificationLinks.push({
        label: "Search Company — TX DPS TOPS",
        url: buildTopsCompanyUrl(companyName),
        note: "Pre-filled with company name. Verify company license is active.",
      });
      if (licenseNumber) {
        verificationLinks.push({
          label: `Verify License ${licenseNumber} — TX DPS TOPS`,
          url: buildTopsByLicenseUrl(licenseNumber),
          note: "Direct lookup by company PSB license number.",
        });
      }
    }

    return {
      companyName,
      licenseNumber,
      stateCode,
      verificationLinks,
      instructions: licenseNumber
        ? `Click "Verify License ${licenseNumber}" for a direct lookup. Solve CAPTCHA and confirm the license shows as ACTIVE.`
        : `No company license number on file. Search by company name and verify the result matches your records.`,
    };
  } catch (err: unknown) {
    log.error("[LicenseVerification] buildCompanyVerificationCard failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ── Quick link builder for Trinity chat responses ─────────────────────────────
// Used when Trinity is answering a question in chat and wants to give
// a direct verification link without a full employee record lookup.

export function buildQuickVerificationLinks(
  firstName: string,
  lastName: string,
  licenseNumber: string | null,
  stateCode = "TX"
): VerificationLink[] {
  const links: VerificationLink[] = [];
  const state = stateCode.toUpperCase();

  if (state === "TX") {
    if (firstName && lastName) {
      links.push({
        label: "Search by Name — TX DPS TOPS",
        url: buildTopsIndividualUrl(firstName, lastName),
        note: `Search pre-filled for ${firstName} ${lastName}`,
      });
    }
    if (licenseNumber) {
      links.push({
        label: `Verify License ${licenseNumber} — TX DPS TOPS`,
        url: buildTopsByLicenseUrl(licenseNumber),
        note: "Direct license number lookup — fastest method",
      });
    }
  }

  return links;
}
