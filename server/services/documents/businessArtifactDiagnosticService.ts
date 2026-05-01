/**
 * BUSINESS ARTIFACT DIAGNOSTIC SERVICE
 *
 * Static catalog of every business artifact / form Trinity is expected
 * to be able to generate, plus a coverage summary that flags gaps
 * (no generator, no vault persistence, missing audience visibility).
 *
 * This is a read-only diagnostic for support, Trinity, and HelpAI —
 * it answers "what forms exist, what's vault-backed, what's missing".
 *
 * The catalog is intentionally inline so this service has zero runtime
 * dependencies on other modules. Add an entry here when a new business
 * artifact is introduced.
 */

export type BusinessArtifactCategory =
  | 'payroll'
  | 'tax'
  | 'hr'
  | 'operations'
  | 'compliance'
  | 'legal'
  | 'finance'
  | 'recruitment';

export interface BusinessArtifactCatalogEntry {
  artifactType: string;
  title: string;
  category: BusinessArtifactCategory;
  sourceDomain: string;
  generator: string | null;
  vaultBacked: boolean;
  availableToTenant: boolean;
  availableToEmployee: boolean;
}

export interface BusinessArtifactCoverageSummary {
  totalArtifacts: number;
  vaultBackedArtifacts: number;
  generatedArtifacts: number;
  tenantVisibleArtifacts: number;
  employeeVisibleArtifacts: number;
  gapCount: number;
  categories: Record<string, {
    total: number;
    vaultBacked: number;
    gaps: number;
  }>;
  gaps: BusinessArtifactCatalogEntry[];
}

export interface BusinessArtifactDiagnosticResult {
  healthy: boolean;
  summary: BusinessArtifactCoverageSummary;
  recommendedNextActions: string[];
}

const CATALOG: BusinessArtifactCatalogEntry[] = [
  {
    artifactType: 'proof_of_employment',
    title: 'Proof of Employment Letter',
    category: 'hr',
    sourceDomain: 'workforce',
    generator: 'generateProofOfEmployment',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
  },
  {
    artifactType: 'direct_deposit_confirmation',
    title: 'Direct Deposit Confirmation',
    category: 'payroll',
    sourceDomain: 'payroll',
    generator: 'generateDirectDepositConfirmation',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
  },
  {
    artifactType: 'payroll_run_summary',
    title: 'Payroll Run Summary',
    category: 'payroll',
    sourceDomain: 'payroll',
    generator: 'generatePayrollRunSummary',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
  },
  {
    artifactType: 'w3_transmittal',
    title: 'W-3 Transmittal of Wage and Tax Statements',
    category: 'tax',
    sourceDomain: 'payroll',
    generator: 'generateW3Transmittal',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
  },
  {
    artifactType: 'invoice_pdf',
    title: 'Per-Invoice PDF',
    category: 'finance',
    sourceDomain: 'billing',
    generator: 'invoiceService.generateInvoicePDF',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
  },
  {
    artifactType: 'timesheet_support_package',
    title: 'Timesheet Support Package',
    category: 'finance',
    sourceDomain: 'time',
    generator: 'generateTimesheetSupportPackage',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
  },
  {
    artifactType: 'incident_report',
    title: 'Incident Report PDF',
    category: 'operations',
    sourceDomain: 'incidents',
    generator: 'incidentPipelineRoutes',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
  },
  {
    artifactType: 'post_order_acknowledgment',
    title: 'Post Order Acknowledgment PDF',
    category: 'compliance',
    sourceDomain: 'post_orders',
    generator: 'postOrderVersionRoutes',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
  },
];

export function listBusinessArtifactCatalog(): BusinessArtifactCatalogEntry[] {
  return CATALOG.slice();
}

export function listBusinessArtifactGaps(): BusinessArtifactCatalogEntry[] {
  return CATALOG.filter(entry => !entry.generator || !entry.vaultBacked);
}

function buildCategorySummary(entries: BusinessArtifactCatalogEntry[]): BusinessArtifactCoverageSummary['categories'] {
  return entries.reduce((acc, entry) => {
    const category = entry.category as BusinessArtifactCategory;
    if (!acc[category]) {
      acc[category] = { total: 0, vaultBacked: 0, gaps: 0 };
    }
    acc[category].total += 1;
    if (entry.vaultBacked) acc[category].vaultBacked += 1;
    if (!entry.vaultBacked || !entry.generator) acc[category].gaps += 1;
    return acc;
  }, {} as BusinessArtifactCoverageSummary['categories']);
}

function buildRecommendations(gaps: BusinessArtifactCatalogEntry[]): string[] {
  if (gaps.length === 0) {
    return ['All cataloged business artifacts have generators and vault coverage. Continue monitoring new artifact requirements.'];
  }

  return gaps.map(gap => {
    const missing: string[] = [];
    if (!gap.generator) missing.push('generator');
    if (!gap.vaultBacked) missing.push('vault persistence');
    return `Add ${missing.join(' + ')} for ${gap.artifactType} (${gap.title}) in ${gap.sourceDomain}.`;
  });
}

export function getBusinessArtifactCoverageSummary(): BusinessArtifactCoverageSummary {
  const entries = listBusinessArtifactCatalog();
  const gaps = listBusinessArtifactGaps();

  return {
    totalArtifacts: entries.length,
    vaultBackedArtifacts: entries.filter(entry => entry.vaultBacked).length,
    generatedArtifacts: entries.filter(entry => Boolean(entry.generator)).length,
    tenantVisibleArtifacts: entries.filter(entry => entry.availableToTenant).length,
    employeeVisibleArtifacts: entries.filter(entry => entry.availableToEmployee).length,
    gapCount: gaps.length,
    categories: buildCategorySummary(entries),
    gaps,
  };
}

/**
 * Read-only diagnostic for support/Trinity/HelpAI.
 *
 * This turns the static artifact catalog into an operational health answer:
 * which forms exist, which are vault-backed, and which business-required
 * artifacts still need a generator or vault path.
 */
export function diagnoseBusinessArtifactCoverage(): BusinessArtifactDiagnosticResult {
  const summary = getBusinessArtifactCoverageSummary();
  return {
    healthy: summary.gapCount === 0,
    summary,
    recommendedNextActions: buildRecommendations(summary.gaps),
  };
}
