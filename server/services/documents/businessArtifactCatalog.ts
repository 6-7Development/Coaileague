export type BusinessArtifactCategory = 'payroll' | 'tax' | 'billing' | 'time_tracking' | 'hr' | 'compliance';
export type BusinessArtifactOwnerType = 'tenant' | 'employee' | 'client' | 'vendor' | 'government' | 'system';
export type BusinessArtifactCadence = 'per_run' | 'per_payment' | 'per_employee' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';

export interface BusinessArtifactCatalogEntry {
  artifactType: string;
  title: string;
  category: BusinessArtifactCategory;
  ownerType: BusinessArtifactOwnerType;
  cadence: BusinessArtifactCadence;
  sourceDomain: BusinessArtifactCategory;
  sourceTables: string[];
  generator?: string;
  trinityActionId?: string;
  vaultBacked: boolean;
  availableToTenant: boolean;
  availableToEmployee: boolean;
  notes: string[];
}

const BUSINESS_ARTIFACT_CATALOG: BusinessArtifactCatalogEntry[] = [
  {
    artifactType: 'pay_stub',
    title: 'Pay Stub',
    category: 'payroll',
    ownerType: 'employee',
    cadence: 'per_payment',
    sourceDomain: 'payroll',
    sourceTables: ['payrollRuns', 'payrollEntries', 'employees'],
    generator: 'paystubService.generatePaystub',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
    notes: ['Gross/net pay, deductions, and YTD payroll context.'],
  },
  {
    artifactType: 'w2',
    title: 'Form W-2',
    category: 'tax',
    ownerType: 'employee',
    cadence: 'annual',
    sourceDomain: 'payroll',
    sourceTables: ['employeeTaxForms', 'payrollEntries', 'employees'],
    generator: 'taxFormGeneratorService.generateW2ForEmployee',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
    notes: ['Employee annual wage and tax statement.'],
  },
  {
    artifactType: '1099_nec',
    title: 'Form 1099-NEC',
    category: 'tax',
    ownerType: 'vendor',
    cadence: 'annual',
    sourceDomain: 'payroll',
    sourceTables: ['employeeTaxForms', 'payrollEntries', 'employees'],
    generator: 'taxFormGeneratorService.generate1099ForEmployee',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
    notes: ['Nonemployee compensation reporting for eligible contractors.'],
  },
  {
    artifactType: 'form_941',
    title: 'Form 941 Support Package',
    category: 'tax',
    ownerType: 'tenant',
    cadence: 'quarterly',
    sourceDomain: 'payroll',
    sourceTables: ['payrollRuns', 'payrollEntries'],
    generator: 'taxFormGeneratorService.generate941Report',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
    notes: ['Quarterly employer federal payroll tax support package.'],
  },
  {
    artifactType: 'form_940',
    title: 'Form 940 Support Package',
    category: 'tax',
    ownerType: 'tenant',
    cadence: 'annual',
    sourceDomain: 'payroll',
    sourceTables: ['payrollRuns', 'payrollEntries'],
    generator: 'taxFormGeneratorService.generate940Report',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
    notes: ['Annual FUTA support package.'],
  },
  {
    artifactType: 'w3_transmittal',
    title: 'Form W-3 Transmittal',
    category: 'tax',
    ownerType: 'tenant',
    cadence: 'annual',
    sourceDomain: 'payroll',
    sourceTables: ['payrollEntries', 'employees'],
    generator: 'generateW3Transmittal',
    trinityActionId: 'document.w3_transmittal',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
    notes: ['Aggregate W-2 transmittal summary for employer records/SSA workflow.'],
  },
  {
    artifactType: 'direct_deposit_confirmation',
    title: 'Direct Deposit Confirmation',
    category: 'payroll',
    ownerType: 'employee',
    cadence: 'per_payment',
    sourceDomain: 'payroll',
    sourceTables: ['payrollRuns', 'payrollEntries', 'employeePayrollInfo'],
    generator: 'generateDirectDepositConfirmation',
    trinityActionId: 'document.direct_deposit_confirmation',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: true,
    notes: ['ACH confirmation with amount, pay date, and account last-4 metadata only.'],
  },
  {
    artifactType: 'payroll_run_summary',
    title: 'Payroll Run Summary',
    category: 'payroll',
    ownerType: 'tenant',
    cadence: 'per_run',
    sourceDomain: 'payroll',
    sourceTables: ['payrollRuns', 'payrollEntries'],
    generator: 'generatePayrollRunSummary',
    trinityActionId: 'document.payroll_run_summary',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
    notes: ['Employer-facing run summary with totals and per-employee breakdown.'],
  },
  {
    artifactType: 'proof_of_employment',
    title: 'Proof of Employment Letter',
    category: 'hr',
    ownerType: 'employee',
    cadence: 'on_demand',
    sourceDomain: 'hr',
    sourceTables: ['employees', 'workspaces'],
    generator: 'generateProofOfEmployment',
    trinityActionId: 'document.proof_of_employment',
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
    notes: ['Manager/HR-generated employment verification letter.'],
  },
  {
    artifactType: 'invoice_pdf',
    title: 'Client Invoice PDF',
    category: 'billing',
    ownerType: 'client',
    cadence: 'per_run',
    sourceDomain: 'billing',
    sourceTables: ['invoices', 'invoiceLineItems', 'timeEntries'],
    vaultBacked: true,
    availableToTenant: true,
    availableToEmployee: false,
    notes: ['Cataloged as required business artifact. Confirm generator/vault path during billing extraction.'],
  },
  {
    artifactType: 'timesheet_support_package',
    title: 'Timesheet Support Package',
    category: 'time_tracking',
    ownerType: 'tenant',
    cadence: 'per_run',
    sourceDomain: 'time_tracking',
    sourceTables: ['timeEntries', 'shifts', 'employees', 'clients'],
    vaultBacked: false,
    availableToTenant: true,
    availableToEmployee: false,
    notes: ['Required for invoice/payroll reconciliation. Confirm generator/vault path during time tracking extraction.'],
  },
];

export function listBusinessArtifactCatalog(): BusinessArtifactCatalogEntry[] {
  return [...BUSINESS_ARTIFACT_CATALOG];
}

export function getBusinessArtifactCatalogEntry(artifactType: string): BusinessArtifactCatalogEntry | null {
  return BUSINESS_ARTIFACT_CATALOG.find(entry => entry.artifactType === artifactType) ?? null;
}

export function listBusinessArtifactsByCategory(category: BusinessArtifactCategory): BusinessArtifactCatalogEntry[] {
  return BUSINESS_ARTIFACT_CATALOG.filter(entry => entry.category === category);
}

export function listBusinessArtifactsByOwner(ownerType: BusinessArtifactOwnerType): BusinessArtifactCatalogEntry[] {
  return BUSINESS_ARTIFACT_CATALOG.filter(entry => entry.ownerType === ownerType);
}

export function listBusinessArtifactGaps(): BusinessArtifactCatalogEntry[] {
  return BUSINESS_ARTIFACT_CATALOG.filter(entry => !entry.vaultBacked || !entry.generator);
}
