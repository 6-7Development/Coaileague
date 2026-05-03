/**
 * Phase 48 — Onboarding Task Management
 * =======================================
 * Tables: onboarding_task_templates, employee_onboarding_completions
 */

import {
  pgTable, varchar, text, integer, boolean,
  timestamp, jsonb, index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── onboarding_task_templates ────────────────────────────────────────────────
// Platform-wide and workspace-specific task templates.
// workspaceId = null means platform default (visible to all orgs).

// ─── employee_onboarding_completions ─────────────────────────────────────────
// Per-employee task completion tracking.

export type OnboardingTaskTemplate = typeof onboardingTaskTemplates.$inferSelect;
export type EmployeeOnboardingCompletion = typeof employeeOnboardingCompletions.$inferSelect;
