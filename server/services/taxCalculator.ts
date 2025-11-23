/**
 * Tax Calculation Service
 * Computes federal income tax, FICA, and related withholdings for payroll
 */

// 2024 Federal Tax Brackets (Single Filer)
const FEDERAL_TAX_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 }
];

const STANDARD_DEDUCTION = 13850; // Single filer 2024
const STANDARD_DEDUCTION_MARRIED = 27700; // Married filing jointly 2024
const FICA_SOCIAL_SECURITY_RATE = 0.062; // 6.2%
const FICA_MEDICARE_RATE = 0.0145; // 1.45%
const FICA_SS_WAGE_BASE = 168600; // 2024 Social Security wage base

export interface TaxCalculationInput {
  grossWages: number;
  filingStatus: 'single' | 'married' | 'head_of_household';
  dependents?: number;
  ytdWages?: number; // Year-to-date wages for FICA calculations
}

export interface TaxCalculationResult {
  grossWages: number;
  federalIncomeTax: number;
  ficaSocialSecurity: number;
  ficaMedicare: number;
  totalDeductions: number;
  netPay: number;
  effectiveTaxRate: number;
}

function calculateFederalTax(grossWages: number, filingStatus: string): number {
  let standardDeduction = STANDARD_DEDUCTION;
  if (filingStatus === 'married') {
    standardDeduction = STANDARD_DEDUCTION_MARRIED;
  } else if (filingStatus === 'head_of_household') {
    standardDeduction = 17400; // 2024 head of household
  }

  let taxableIncome = Math.max(grossWages - standardDeduction, 0);
  let tax = 0;

  for (const bracket of FEDERAL_TAX_BRACKETS) {
    if (taxableIncome <= bracket.min) break;
    
    const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += incomeInBracket * bracket.rate;
  }

  return Math.round(tax * 100) / 100;
}

function calculateFICA(grossWages: number, ytdWages: number = 0): { socialSecurity: number; medicare: number } {
  // Social Security tax (up to wage base)
  const ssWageBase = Math.max(FICA_SS_WAGE_BASE - ytdWages, 0);
  const ssWageable = Math.min(grossWages, ssWageBase);
  const socialSecurity = Math.round(ssWageable * FICA_SOCIAL_SECURITY_RATE * 100) / 100;

  // Medicare tax (no wage base limit)
  const medicare = Math.round(grossWages * FICA_MEDICARE_RATE * 100) / 100;

  return { socialSecurity, medicare };
}

export function calculateTaxes(input: TaxCalculationInput): TaxCalculationResult {
  const federalTax = calculateFederalTax(input.grossWages, input.filingStatus);
  const { socialSecurity, medicare } = calculateFICA(input.grossWages, input.ytdWages || 0);

  const totalDeductions = federalTax + socialSecurity + medicare;
  const netPay = input.grossWages - totalDeductions;
  const effectiveTaxRate = input.grossWages > 0 ? (totalDeductions / input.grossWages) * 100 : 0;

  return {
    grossWages: input.grossWages,
    federalIncomeTax: federalTax,
    ficaSocialSecurity: socialSecurity,
    ficaMedicare: medicare,
    totalDeductions,
    netPay,
    effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100
  };
}

export const taxCalculator = {
  calculateTaxes
};
