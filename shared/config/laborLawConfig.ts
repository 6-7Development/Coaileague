/**
 * Labor Law Configuration - US State Break Rules
 * Pre-populated with common US state labor law requirements
 * 
 * These rules are used for:
 * 1. Automatic break scheduling on shifts
 * 2. Compliance checking and violation detection
 * 3. AI-optimized break timing suggestions
 */

import type { InsertLaborLawRule } from '../schema';

export interface LaborLawRuleConfig {
  jurisdiction: string;
  jurisdictionName: string;
  country: string;
  
  restBreakEnabled: boolean;
  restBreakMinShiftHours: string;
  restBreakDurationMinutes: number;
  restBreakIsPaid: boolean;
  restBreakFrequencyHours: string;
  
  mealBreakEnabled: boolean;
  mealBreakMinShiftHours: string;
  mealBreakDurationMinutes: number;
  mealBreakIsPaid: boolean;
  mealBreakMaxDelayHours: string;
  mealBreakSecondThresholdHours: string;
  
  mealBreakWaiverAllowed: boolean;
  mealBreakWaiverMaxShiftHours: string;
  
  breakViolationPenalty?: string;
  penaltyPerViolation?: string;
  legalReference?: string;
  notes?: string;
  
  isDefault: boolean;
}

export const US_LABOR_LAW_RULES: LaborLawRuleConfig[] = [
  // California - Most strict break laws in the US
  {
    jurisdiction: 'CA',
    jurisdictionName: 'California',
    country: 'US',
    
    restBreakEnabled: true,
    restBreakMinShiftHours: '3.50',
    restBreakDurationMinutes: 10,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '4.00',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '5.00',
    mealBreakDurationMinutes: 30,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '5.00',
    mealBreakSecondThresholdHours: '10.00',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '6.00',
    
    breakViolationPenalty: 'One hour of pay at regular rate for each missed break',
    penaltyPerViolation: '0', // Calculated dynamically based on hourly rate
    legalReference: 'California Labor Code Section 512, IWC Wage Orders',
    notes: 'Most employee-friendly break laws. Rest breaks: 10 min paid per 4 hours. Meal breaks: 30 min unpaid, must start before 5th hour. Second meal break required for 10+ hour shifts.',
    
    isDefault: false,
  },
  
  // New York
  {
    jurisdiction: 'NY',
    jurisdictionName: 'New York',
    country: 'US',
    
    restBreakEnabled: false,
    restBreakMinShiftHours: '4.00',
    restBreakDurationMinutes: 0,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '4.00',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '6.00',
    mealBreakDurationMinutes: 30,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '6.00',
    mealBreakSecondThresholdHours: '12.00',
    
    mealBreakWaiverAllowed: false,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'Civil penalty up to $10,000 per violation',
    penaltyPerViolation: '10000.00',
    legalReference: 'New York Labor Law Section 162',
    notes: 'No rest break requirement. Meal break: 30 min for shifts over 6 hours that extend over noon (11am-2pm). Factory workers get additional protections.',
    
    isDefault: false,
  },
  
  // Texas - Minimal requirements
  {
    jurisdiction: 'TX',
    jurisdictionName: 'Texas',
    country: 'US',
    
    restBreakEnabled: false,
    restBreakMinShiftHours: '0',
    restBreakDurationMinutes: 0,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '0',
    
    mealBreakEnabled: false,
    mealBreakMinShiftHours: '0',
    mealBreakDurationMinutes: 0,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '0',
    mealBreakSecondThresholdHours: '0',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'No state-mandated penalties (follows federal law)',
    legalReference: 'Texas follows FLSA federal guidelines only',
    notes: 'No state break requirements for adults. Follows federal FLSA: breaks under 20 min must be paid if offered. Minors have different rules.',
    
    isDefault: false,
  },
  
  // Florida - Also minimal
  {
    jurisdiction: 'FL',
    jurisdictionName: 'Florida',
    country: 'US',
    
    restBreakEnabled: false,
    restBreakMinShiftHours: '0',
    restBreakDurationMinutes: 0,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '0',
    
    mealBreakEnabled: false,
    mealBreakMinShiftHours: '0',
    mealBreakDurationMinutes: 0,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '0',
    mealBreakSecondThresholdHours: '0',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'No state-mandated penalties (follows federal law)',
    legalReference: 'Florida follows FLSA federal guidelines only',
    notes: 'No state break requirements for adults. Minors (under 18) must receive 30-minute break for 4+ hour shifts.',
    
    isDefault: false,
  },
  
  // Washington
  {
    jurisdiction: 'WA',
    jurisdictionName: 'Washington',
    country: 'US',
    
    restBreakEnabled: true,
    restBreakMinShiftHours: '2.00',
    restBreakDurationMinutes: 10,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '4.00',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '5.00',
    mealBreakDurationMinutes: 30,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '5.00',
    mealBreakSecondThresholdHours: '10.00',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'Civil penalty and back pay',
    legalReference: 'WAC 296-126-092',
    notes: 'Rest: 10 min paid per 4 hours. Meal: 30 min unpaid between 2nd and 5th hour. Additional meal break for 10+ hour shifts.',
    
    isDefault: false,
  },
  
  // Oregon
  {
    jurisdiction: 'OR',
    jurisdictionName: 'Oregon',
    country: 'US',
    
    restBreakEnabled: true,
    restBreakMinShiftHours: '2.00',
    restBreakDurationMinutes: 10,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '4.00',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '6.00',
    mealBreakDurationMinutes: 30,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '6.00',
    mealBreakSecondThresholdHours: '14.00',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'Civil penalties',
    legalReference: 'ORS 653.261',
    notes: 'Rest: 10 min paid per 4 hours. Meal: 30 min unpaid for 6+ hour shifts. Additional meal for 14+ hour shifts.',
    
    isDefault: false,
  },
  
  // Colorado
  {
    jurisdiction: 'CO',
    jurisdictionName: 'Colorado',
    country: 'US',
    
    restBreakEnabled: true,
    restBreakMinShiftHours: '4.00',
    restBreakDurationMinutes: 10,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '4.00',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '5.00',
    mealBreakDurationMinutes: 30,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '5.00',
    mealBreakSecondThresholdHours: '12.00',
    
    mealBreakWaiverAllowed: false,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'Civil penalties up to $500 per violation',
    penaltyPerViolation: '500.00',
    legalReference: 'Colorado COMPS Order (7 CCR 1103-1)',
    notes: 'Rest: 10 min paid per 4 hours. Meal: 30 min unpaid for 5+ hour shifts. Additional meal for 12+ hour shifts.',
    
    isDefault: false,
  },
  
  // Nevada
  {
    jurisdiction: 'NV',
    jurisdictionName: 'Nevada',
    country: 'US',
    
    restBreakEnabled: true,
    restBreakMinShiftHours: '3.50',
    restBreakDurationMinutes: 10,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '4.00',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '8.00',
    mealBreakDurationMinutes: 30,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '8.00',
    mealBreakSecondThresholdHours: '16.00',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'Civil penalties',
    legalReference: 'NRS 608.019',
    notes: 'Rest: 10 min paid per 4 hours. Meal: 30 min for 8+ hour continuous shifts.',
    
    isDefault: false,
  },
  
  // Illinois
  {
    jurisdiction: 'IL',
    jurisdictionName: 'Illinois',
    country: 'US',
    
    restBreakEnabled: false,
    restBreakMinShiftHours: '0',
    restBreakDurationMinutes: 0,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '0',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '7.50',
    mealBreakDurationMinutes: 20,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '5.00',
    mealBreakSecondThresholdHours: '12.00',
    
    mealBreakWaiverAllowed: false,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'Civil penalties',
    legalReference: 'Illinois One Day Rest in Seven Act (820 ILCS 140)',
    notes: 'Meal: 20 min unpaid for 7.5+ hour shifts, no later than 5 hours after start. Hotel workers have additional protections.',
    
    isDefault: false,
  },
  
  // Massachusetts
  {
    jurisdiction: 'MA',
    jurisdictionName: 'Massachusetts',
    country: 'US',
    
    restBreakEnabled: false,
    restBreakMinShiftHours: '0',
    restBreakDurationMinutes: 0,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '0',
    
    mealBreakEnabled: true,
    mealBreakMinShiftHours: '6.00',
    mealBreakDurationMinutes: 30,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '6.00',
    mealBreakSecondThresholdHours: '12.00',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'Civil penalties',
    legalReference: 'Massachusetts General Laws, Chapter 149, Section 100',
    notes: 'Meal: 30 min unpaid for 6+ hour shifts. Employee can voluntarily waive.',
    
    isDefault: false,
  },
  
  // Pennsylvania
  {
    jurisdiction: 'PA',
    jurisdictionName: 'Pennsylvania',
    country: 'US',
    
    restBreakEnabled: false,
    restBreakMinShiftHours: '0',
    restBreakDurationMinutes: 0,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '0',
    
    mealBreakEnabled: false,
    mealBreakMinShiftHours: '0',
    mealBreakDurationMinutes: 0,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '0',
    mealBreakSecondThresholdHours: '0',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'No state-mandated penalties (follows federal law)',
    legalReference: 'Pennsylvania follows FLSA federal guidelines only',
    notes: 'No state break requirements for adults. Minors have different rules.',
    
    isDefault: false,
  },
  
  // US Federal - FLSA baseline (default fallback)
  {
    jurisdiction: 'US-FEDERAL',
    jurisdictionName: 'United States (Federal)',
    country: 'US',
    
    restBreakEnabled: false,
    restBreakMinShiftHours: '0',
    restBreakDurationMinutes: 0,
    restBreakIsPaid: true,
    restBreakFrequencyHours: '0',
    
    mealBreakEnabled: false,
    mealBreakMinShiftHours: '0',
    mealBreakDurationMinutes: 0,
    mealBreakIsPaid: false,
    mealBreakMaxDelayHours: '0',
    mealBreakSecondThresholdHours: '0',
    
    mealBreakWaiverAllowed: true,
    mealBreakWaiverMaxShiftHours: '0',
    
    breakViolationPenalty: 'FLSA: Short breaks (under 20 min) must be paid if offered',
    legalReference: 'Fair Labor Standards Act (FLSA) 29 CFR 785.18-19',
    notes: 'Federal law does not require breaks, but if offered: breaks under 20 min must be paid, meal breaks of 30+ min can be unpaid if employee is completely relieved of duties.',
    
    isDefault: true,
  },
];

export const JURISDICTION_OPTIONS = US_LABOR_LAW_RULES.map(rule => ({
  value: rule.jurisdiction,
  label: rule.jurisdictionName,
  country: rule.country,
  hasRestBreaks: rule.restBreakEnabled,
  hasMealBreaks: rule.mealBreakEnabled,
}));

export function getLaborLawRuleByJurisdiction(jurisdiction: string): LaborLawRuleConfig | undefined {
  return US_LABOR_LAW_RULES.find(rule => rule.jurisdiction === jurisdiction);
}

export function getDefaultLaborLawRule(): LaborLawRuleConfig {
  return US_LABOR_LAW_RULES.find(rule => rule.isDefault) || US_LABOR_LAW_RULES[US_LABOR_LAW_RULES.length - 1];
}
