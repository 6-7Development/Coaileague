-- ─────────────────────────────────────────────────────────────────────────────
-- WAVE 6.5 SCHEMA CONSOLIDATION MIGRATION
-- Execute A: Drop 31 dead tables (zero-reference, confirmed safe)
-- Execute B: Add 3 missing composite indexes on high-velocity tables
-- 
-- Run with: psql $DATABASE_URL -f server/migrations/wave65_schema_consolidation.sql
-- Safe to run multiple times (IF EXISTS guards on all drops, IF NOT EXISTS on indexes)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════════
-- DIRECTIVE A — DROP 31 DEAD TABLES
-- All confirmed: zero server-side Drizzle references, no production writes
-- ══════════════════════════════════════════════════════════════════════════════

-- ATS/Hiring shadows (canonical: interview_candidates in recruitment domain)
DROP TABLE IF EXISTS hiring_pipeline               CASCADE;
DROP TABLE IF EXISTS applicant_interviews          CASCADE;
DROP TABLE IF EXISTS interview_sessions            CASCADE;

-- Training OS abandoned feature (entire training_os was abandoned post-MVP)
DROP TABLE IF EXISTS training_requirements         CASCADE;
DROP TABLE IF EXISTS training_scheduled_sessions   CASCADE;
DROP TABLE IF EXISTS training_certificates         CASCADE;
DROP TABLE IF EXISTS training_courses              CASCADE;
DROP TABLE IF EXISTS training_enrollments          CASCADE;
DROP TABLE IF EXISTS training_providers            CASCADE;
DROP TABLE IF EXISTS employee_training_records     CASCADE;

-- Onboarding scaffolding (superseded by onboarding_flows + interactive_onboarding_state)
DROP TABLE IF EXISTS employee_onboarding_steps        CASCADE;
DROP TABLE IF EXISTS employee_onboarding_completions  CASCADE;
DROP TABLE IF EXISTS onboarding_task_templates        CASCADE;
DROP TABLE IF EXISTS tenant_onboarding_steps          CASCADE;
DROP TABLE IF EXISTS tenant_onboarding_progress       CASCADE;

-- Scheduling relics (shadows active shift_coverage_requests)
DROP TABLE IF EXISTS service_coverage_requests     CASCADE;
DROP TABLE IF EXISTS shift_coverage_claims         CASCADE;
DROP TABLE IF EXISTS schedule_snapshots            CASCADE;
DROP TABLE IF EXISTS scheduler_notification_events CASCADE;

-- Trinity cognitive stubs (never built out; canonical: ai_learning_events)
DROP TABLE IF EXISTS trinity_ai_usage_log          CASCADE;
DROP TABLE IF EXISTS trinity_memory_service        CASCADE;
DROP TABLE IF EXISTS trinity_thinking_sessions     CASCADE;
DROP TABLE IF EXISTS ai_decision_audit             CASCADE;

-- Abandoned feature tables
DROP TABLE IF EXISTS faq_entries                   CASCADE;  -- superseded by helpos_faqs
DROP TABLE IF EXISTS social_relationships          CASCADE;  -- social graph never shipped
DROP TABLE IF EXISTS leaderboard_cache             CASCADE;  -- no writer exists
DROP TABLE IF EXISTS workspace_themes              CASCADE;  -- theme engine never shipped
DROP TABLE IF EXISTS workspace_credit_balance      CASCADE;  -- shadows credit_balances
DROP TABLE IF EXISTS workspace_cost_summary        CASCADE;  -- shadows financial_snapshots
DROP TABLE IF EXISTS platform_credit_pool          CASCADE;  -- stub, 5 cols, no writer
DROP TABLE IF EXISTS voice_usage                   CASCADE;  -- shadows voiceSmsMeteringService
DROP TABLE IF EXISTS visitor_pre_registrations     CASCADE;  -- visitor mgmt never shipped

-- ══════════════════════════════════════════════════════════════════════════════
-- DIRECTIVE B — ADD 3 MISSING COMPOSITE INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- B-1: chat_messages — reconnect replay (Wave 5 listMessagesSince query)
-- The WHERE clause is: conversationId = ? AND seqNum > ? AND isDeletedForEveryone = false
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_chat_messages_conv_seq
  ON chat_messages (conversation_id, seq_num)
  WHERE is_deleted_for_everyone = false;

-- B-2: token_usage_log — Wave 5 Redis buffer Stripe sync + monthly rollup
-- Queries filter by workspace_id + action_type, then sort/aggregate by created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_token_usage_workspace_action_ts
  ON token_usage_log (workspace_id, action_type, created_at DESC);

-- B-3: ai_learning_events — Wave 6 episodic memory retrieval
-- buildSystemPrompt reads: WHERE workspace_id = ? AND event_type = 'human_override'
--   AND human_intervention = true ORDER BY created_at DESC LIMIT 5
-- Without this index, every system prompt generation does a full table scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_ai_learning_workspace_override
  ON ai_learning_events (workspace_id, event_type, human_intervention, created_at DESC);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-MIGRATION VERIFICATION
-- Run these queries after the migration to confirm success:
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN (
--     'hiring_pipeline', 'training_requirements', 'trinity_memory_service',
--     'faq_entries', 'workspace_themes', 'platform_credit_pool'
--   );
-- Expected: 0 rows (all dropped)
--
-- SELECT indexname FROM pg_indexes
--   WHERE tablename IN ('chat_messages', 'token_usage_log', 'ai_learning_events')
--   AND indexname LIKE 'idx_%wave65%' OR indexname LIKE 'idx_%conv_seq%'
--     OR indexname LIKE 'idx_%workspace_action%' OR indexname LIKE 'idx_%workspace_override%';
-- Expected: 3 rows (all three new indexes)
