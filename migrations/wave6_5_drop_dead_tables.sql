-- ============================================================================
-- WAVE 6.5 — DIRECTIVE A: Drop Dead-Weight Tables
-- Authorized by: Lead Enterprise Architect | Date: 2026-05-03
-- ============================================================================
-- 30 confirmed dead tables:
--   27 ghost tables (Postgres-only, never in Drizzle schema, 0 server refs)
--    3 tables with Drizzle definitions being removed simultaneously
-- All IF EXISTS — migration is idempotent.
-- DEFERRED: ai_usage_log (active analytics), training_certificates (active certs)
-- ============================================================================

BEGIN;

-- ATS Shadow Tables (superseded by Wave 6 canonical interview_candidates)
DROP TABLE IF EXISTS applicant_interviews CASCADE;
DROP TABLE IF EXISTS hiring_pipeline CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;

-- Training OS Skeleton (built then abandoned, all zero refs)
DROP TABLE IF EXISTS training_requirements CASCADE;
DROP TABLE IF EXISTS training_scheduled_sessions CASCADE;
DROP TABLE IF EXISTS training_courses CASCADE;
DROP TABLE IF EXISTS training_enrollments CASCADE;
DROP TABLE IF EXISTS training_providers CASCADE;
DROP TABLE IF EXISTS employee_training_records CASCADE;
DROP TABLE IF EXISTS employee_onboarding_steps CASCADE;
DROP TABLE IF EXISTS employee_onboarding_completions CASCADE;
DROP TABLE IF EXISTS onboarding_task_templates CASCADE;
DROP TABLE IF EXISTS tenant_onboarding_steps CASCADE;
DROP TABLE IF EXISTS tenant_onboarding_progress CASCADE;

-- Scheduling Ghosts (Phase 1 coverage tables superseded)
DROP TABLE IF EXISTS service_coverage_requests CASCADE;
DROP TABLE IF EXISTS shift_coverage_claims CASCADE;
DROP TABLE IF EXISTS schedule_snapshots CASCADE;
DROP TABLE IF EXISTS scheduler_notification_events CASCADE;

-- Trinity Brain Duplicates (shadow canonical ai_learning_events)
DROP TABLE IF EXISTS trinity_ai_usage_log CASCADE;
DROP TABLE IF EXISTS trinity_thinking_sessions CASCADE;
DROP TABLE IF EXISTS ai_decision_audit CASCADE;

-- Social Graph (never shipped)
DROP TABLE IF EXISTS social_relationships CASCADE;

-- Leaderboard Cache (computed, no writer)
DROP TABLE IF EXISTS leaderboard_cache CASCADE;

-- Billing Shadows (superseded by credit_balances / financial_snapshots)
DROP TABLE IF EXISTS workspace_credit_balance CASCADE;
DROP TABLE IF EXISTS workspace_cost_summary CASCADE;
DROP TABLE IF EXISTS platform_credit_pool CASCADE;

-- Helpdesk Phantom (superseded by helpos_faqs)
DROP TABLE IF EXISTS faq_entries CASCADE;

-- Visitor Management (never shipped)
DROP TABLE IF EXISTS visitor_pre_registrations CASCADE;

-- Voice Usage (shadow of voiceSmsMeteringService)
DROP TABLE IF EXISTS voice_usage CASCADE;

-- UI Themes (theme engine never shipped)
DROP TABLE IF EXISTS workspace_themes CASCADE;

COMMIT;
