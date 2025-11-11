CREATE TYPE "public"."account_state" AS ENUM('active', 'trial', 'payment_failed', 'suspended', 'requires_support', 'cancelled', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'reviewed', 'interviewed', 'offered', 'hired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'login', 'logout', 'clock_in', 'clock_out', 'generate_invoice', 'payment_received', 'assign_manager', 'remove_manager', 'kick_user', 'silence_user', 'give_voice', 'remove_voice', 'ban_user', 'unban_user', 'reset_password', 'unlock_account', 'lock_account', 'change_role', 'change_permissions', 'transfer_ownership', 'impersonate_user', 'export_data', 'import_data', 'delete_data', 'restore_data', 'update_motd', 'update_banner', 'change_settings', 'view_audit_logs', 'escalate_ticket', 'transfer_ticket', 'view_documents', 'request_secure_info', 'release_spectator', 'automation_job_start', 'automation_job_complete', 'automation_job_error', 'automation_artifact_generated', 'other');--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('available', 'unavailable', 'preferred', 'limited');--> statement-breakpoint
CREATE TYPE "public"."benefit_status" AS ENUM('pending', 'active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."benefit_type" AS ENUM('health_insurance', 'dental_insurance', 'vision_insurance', 'life_insurance', '401k', 'pto_vacation', 'sick_leave', 'bonus', 'equity', 'other');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."business_category" AS ENUM('general', 'security', 'healthcare', 'construction', 'cleaning', 'hospitality', 'retail', 'transportation', 'manufacturing', 'education', 'custom');--> statement-breakpoint
CREATE TYPE "public"."certification_status" AS ENUM('pending', 'verified', 'expired', 'invalid');--> statement-breakpoint
CREATE TYPE "public"."contract_document_type" AS ENUM('i9', 'w4', 'w9', 'nda', 'employment_agreement', 'contractor_agreement', 'handbook_acknowledgment', 'policy_acknowledgment', 'direct_deposit_authorization', 'background_check_consent', 'drug_test_consent', 'other');--> statement-breakpoint
CREATE TYPE "public"."signature_status" AS ENUM('pending', 'signed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('certification', 'license', 'contract', 'policy', 'id', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_type_signature" AS ENUM('employee_contract', 'contractor_agreement', 'sop_acknowledgement', 'drug_free_policy', 'handbook', 'confidentiality', 'i9_form', 'w4_form', 'w9_form');--> statement-breakpoint
CREATE TYPE "public"."employee_document_status" AS ENUM('pending_upload', 'uploaded', 'pending_review', 'approved', 'rejected', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."employee_document_type" AS ENUM('government_id', 'passport', 'ssn_card', 'birth_certificate', 'i9_form', 'w4_form', 'w9_form', 'direct_deposit_form', 'employee_handbook_signed', 'confidentiality_agreement', 'code_of_conduct', 'certification', 'license', 'training_certificate', 'background_check', 'drug_test', 'physical_exam', 'emergency_contact_form', 'uniform_agreement', 'vehicle_insurance', 'custom_document');--> statement-breakpoint
CREATE TYPE "public"."escalation_category" AS ENUM('billing', 'compliance', 'technical_issue', 'security', 'feature_request', 'data_correction', 'other');--> statement-breakpoint
CREATE TYPE "public"."escalation_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'reimbursed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."external_id_entity_type" AS ENUM('org', 'employee', 'user', 'support', 'client');--> statement-breakpoint
CREATE TYPE "public"."i9_status" AS ENUM('pending', 'verified', 'reverification_required', 'expired', 'invalid');--> statement-breakpoint
CREATE TYPE "public"."id_sequence_kind" AS ENUM('employee', 'ticket', 'client');--> statement-breakpoint
CREATE TYPE "public"."idempotency_status" AS ENUM('processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."integration_category" AS ENUM('accounting', 'erp', 'crm', 'hris', 'communication', 'productivity', 'analytics', 'storage', 'custom');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_posting_status" AS ENUM('draft', 'active', 'closed', 'filled');--> statement-breakpoint
CREATE TYPE "public"."leader_action" AS ENUM('reset_password', 'unlock_account', 'update_employee_contact', 'approve_schedule_swap', 'adjust_time_entry', 'flag_security_issue', 'create_support_ticket', 'export_report');--> statement-breakpoint
CREATE TYPE "public"."leader_capability" AS ENUM('view_reports', 'manage_employees_basic', 'manage_schedules', 'escalate_support', 'view_audit_logs', 'manage_security_flags');--> statement-breakpoint
CREATE TYPE "public"."notice_status" AS ENUM('submitted', 'acknowledged', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notice_type" AS ENUM('resignation', 'role_change', 'termination');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('shift_assigned', 'shift_changed', 'shift_cancelled', 'pto_approved', 'pto_denied', 'schedule_change', 'document_uploaded', 'document_expiring', 'profile_updated', 'form_assigned', 'timesheet_approved', 'timesheet_rejected', 'payroll_processed', 'mention', 'support_escalation', 'system');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('invited', 'in_progress', 'pending_review', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."onboarding_step" AS ENUM('personal_info', 'tax_selection', 'tax_forms', 'contract_signature', 'document_upload', 'work_availability', 'certifications', 'acknowledgements', 'completed');--> statement-breakpoint
CREATE TYPE "public"."operation_type" AS ENUM('invoice_generation', 'payroll_run', 'timesheet_ingest', 'schedule_generation', 'payment_processing');--> statement-breakpoint
CREATE TYPE "public"."oversight_entity_type" AS ENUM('invoice', 'expense', 'timesheet', 'shift', 'payroll_run', 'dispute', 'time_entry');--> statement-breakpoint
CREATE TYPE "public"."oversight_status" AS ENUM('pending', 'approved', 'rejected', 'auto_resolved');--> statement-breakpoint
CREATE TYPE "public"."partner_connection_status" AS ENUM('connected', 'disconnected', 'expired', 'error');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('quickbooks', 'gusto', 'stripe', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'pending', 'approved', 'processed', 'paid');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('root_admin', 'deputy_admin', 'sysop', 'support_manager', 'support_agent', 'compliance_officer', 'none');--> statement-breakpoint
CREATE TYPE "public"."policy_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."pto_status" AS ENUM('pending', 'approved', 'denied', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pto_type" AS ENUM('vacation', 'sick', 'personal', 'bereavement', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('7_day', '14_day', '30_day', 'custom');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('draft', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('annual', 'quarterly', 'probation', '90_day', 'promotion', 'pip');--> statement-breakpoint
CREATE TYPE "public"."room_member_role" AS ENUM('owner', 'admin', 'member', 'guest');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('active', 'suspended', 'closed');--> statement-breakpoint
CREATE TYPE "public"."rule_status" AS ENUM('active', 'inactive', 'testing');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('payroll', 'scheduling', 'time_tracking', 'billing');--> statement-breakpoint
CREATE TYPE "public"."shift_acknowledgment_type" AS ENUM('post_order', 'special_order', 'safety_notice', 'site_instruction');--> statement-breakpoint
CREATE TYPE "public"."shift_action_status" AS ENUM('pending', 'approved', 'denied', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."shift_action_type" AS ENUM('accept', 'deny', 'switch_request', 'cover_request');--> statement-breakpoint
CREATE TYPE "public"."shift_order_priority" AS ENUM('normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('draft', 'published', 'scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'cancelled', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."tax_classification" AS ENUM('w4_employee', 'w9_contractor');--> statement-breakpoint
CREATE TYPE "public"."tax_form_type" AS ENUM('w4', 'w2', '1099');--> statement-breakpoint
CREATE TYPE "public"."termination_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."termination_type" AS ENUM('voluntary', 'involuntary', 'retirement', 'layoff', 'end_of_contract');--> statement-breakpoint
CREATE TYPE "public"."timesheet_edit_request_status" AS ENUM('pending', 'approved', 'denied', 'applied');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('org_owner', 'org_admin', 'department_manager', 'supervisor', 'staff', 'auditor', 'contractor');--> statement-breakpoint
CREATE TABLE "abuse_violations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"message_id" varchar,
	"violation_type" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"detected_patterns" text[],
	"original_message" text NOT NULL,
	"action" varchar NOT NULL,
	"warning_message" text,
	"detected_by" varchar DEFAULT 'system',
	"action_taken_by" varchar,
	"user_violation_count" integer DEFAULT 1 NOT NULL,
	"is_banned" boolean DEFAULT false,
	"banned_until" timestamp,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"category" varchar NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"summary" text NOT NULL,
	"details" text,
	"data_points" text,
	"generated_by" varchar DEFAULT 'gpt-4',
	"confidence" numeric(5, 2),
	"actionable" boolean DEFAULT true,
	"suggested_actions" text[],
	"estimated_impact" varchar,
	"status" varchar DEFAULT 'active',
	"dismissed_by" varchar,
	"dismissed_at" timestamp,
	"dismiss_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_token_wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"current_balance" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"total_purchased" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"total_used" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"monthly_included_credits" numeric(10, 2) DEFAULT '0.00',
	"monthly_credits_used" numeric(10, 2) DEFAULT '0.00',
	"monthly_credits_reset_at" timestamp,
	"auto_recharge_enabled" boolean DEFAULT false,
	"auto_recharge_threshold" numeric(10, 2),
	"auto_recharge_amount" numeric(10, 2),
	"low_balance_alert_enabled" boolean DEFAULT true,
	"low_balance_alert_threshold" numeric(10, 2) DEFAULT '10.00',
	"last_low_balance_alert_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_token_wallets_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_daily_rollups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"usage_date" timestamp NOT NULL,
	"feature_key" varchar NOT NULL,
	"total_events" integer DEFAULT 0 NOT NULL,
	"total_usage_amount" numeric(15, 4) DEFAULT '0' NOT NULL,
	"total_cost" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"unique_users" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_usage_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar,
	"feature_key" varchar NOT NULL,
	"addon_id" varchar,
	"usage_type" varchar NOT NULL,
	"usage_amount" numeric(15, 4) NOT NULL,
	"usage_unit" varchar NOT NULL,
	"unit_price" numeric(10, 4),
	"total_cost" numeric(10, 4),
	"session_id" varchar,
	"activity_type" varchar,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar,
	"message_id" varchar,
	"request_type" varchar NOT NULL,
	"model" varchar NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"prompt_cost" numeric(10, 6) DEFAULT '0' NOT NULL,
	"completion_cost" numeric(10, 6) DEFAULT '0' NOT NULL,
	"total_cost" numeric(10, 6) DEFAULT '0' NOT NULL,
	"user_tier" varchar NOT NULL,
	"usage_count" integer NOT NULL,
	"billing_month" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anonymous_suggestions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar,
	"sentiment_score" numeric(5, 2),
	"sentiment_label" varchar,
	"urgency_level" varchar,
	"ticket_id" varchar,
	"status" varchar DEFAULT 'submitted',
	"status_updated_at" timestamp,
	"response_to_employee" text,
	"internal_notes" text,
	"implementation_date" timestamp,
	"decline_reason" text,
	"is_anonymous" boolean DEFAULT true,
	"visible_to_all_employees" boolean DEFAULT false,
	"upvotes" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"submitted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"key_hash" varchar NOT NULL,
	"key_prefix" varchar NOT NULL,
	"scopes" text[],
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "asset_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"asset_id" varchar NOT NULL,
	"shift_id" varchar,
	"employee_id" varchar,
	"client_id" varchar,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"job_description" text,
	"job_location" text,
	"has_conflict" boolean DEFAULT false,
	"conflict_with" jsonb DEFAULT '[]',
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"actual_hours" numeric(10, 2),
	"odometer_start" numeric(10, 2),
	"odometer_end" numeric(10, 2),
	"fuel_used" numeric(10, 2),
	"billable_hours" numeric(10, 2),
	"hourly_rate" numeric(10, 2),
	"total_charge" numeric(10, 2),
	"invoiced" boolean DEFAULT false,
	"invoice_id" varchar,
	"pre_inspection_completed" boolean DEFAULT false,
	"pre_inspection_by" varchar,
	"pre_inspection_notes" text,
	"post_inspection_completed" boolean DEFAULT false,
	"post_inspection_by" varchar,
	"post_inspection_notes" text,
	"damage_reported" boolean DEFAULT false,
	"damage_description" text,
	"status" varchar DEFAULT 'scheduled',
	"cancelled_by" varchar,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "asset_usage_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"asset_id" varchar NOT NULL,
	"asset_schedule_id" varchar,
	"usage_period_start" timestamp NOT NULL,
	"usage_period_end" timestamp NOT NULL,
	"total_hours" numeric(10, 2),
	"operated_by" varchar,
	"operator_certification_verified" boolean DEFAULT false,
	"client_id" varchar,
	"cost_center_code" varchar,
	"maintenance_required" boolean DEFAULT false,
	"maintenance_notes" text,
	"issues_reported" jsonb DEFAULT '[]',
	"total_distance" numeric(10, 2),
	"fuel_consumed" numeric(10, 2),
	"idle_time" numeric(10, 2),
	"invoice_line_item_id" varchar,
	"billing_status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"asset_number" varchar NOT NULL,
	"asset_name" varchar NOT NULL,
	"asset_type" varchar NOT NULL,
	"category" varchar,
	"manufacturer" varchar,
	"model" varchar,
	"serial_number" varchar,
	"year_manufactured" integer,
	"purchase_date" timestamp,
	"purchase_price" numeric(12, 2),
	"current_location" text,
	"home_location" text,
	"assigned_to_client_id" varchar,
	"hourly_rate" numeric(10, 2),
	"daily_rate" numeric(10, 2),
	"weekly_rate" numeric(10, 2),
	"billing_type" varchar DEFAULT 'hourly',
	"is_billable" boolean DEFAULT true,
	"last_maintenance_date" timestamp,
	"next_maintenance_date" timestamp,
	"maintenance_interval_days" integer,
	"certifications" jsonb DEFAULT '[]',
	"certification_expiry" timestamp,
	"status" varchar DEFAULT 'available',
	"is_schedulable" boolean DEFAULT true,
	"requires_operator_certification" boolean DEFAULT false,
	"required_certifications" jsonb DEFAULT '[]',
	"photos" jsonb DEFAULT '[]',
	"documents" jsonb DEFAULT '[]',
	"notes" text,
	"depreciation_method" varchar,
	"depreciation_rate" numeric(5, 2),
	"current_value" numeric(12, 2),
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar,
	"command_id" varchar,
	"user_id" varchar NOT NULL,
	"user_email" varchar NOT NULL,
	"user_role" varchar NOT NULL,
	"action" "audit_action" NOT NULL,
	"action_description" text,
	"entity_type" varchar,
	"entity_id" varchar,
	"target_id" varchar,
	"target_name" varchar,
	"target_type" varchar,
	"conversation_id" varchar,
	"reason" text,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"request_id" varchar,
	"success" boolean DEFAULT true,
	"error_message" text,
	"is_sensitive_data" boolean DEFAULT false,
	"compliance_tag" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_trail" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar,
	"user_name" varchar NOT NULL,
	"user_role" varchar NOT NULL,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"entity_description" text,
	"changes_before" jsonb,
	"changes_after" jsonb,
	"field_changes" jsonb,
	"reason" text,
	"ip_address" varchar,
	"user_agent" text,
	"geo_location" jsonb,
	"requires_approval" boolean DEFAULT false,
	"approved_by" varchar,
	"approved_at" timestamp,
	"retention_until" timestamp,
	"is_locked" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auto_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"report_type" varchar NOT NULL,
	"period" varchar NOT NULL,
	"summary" text NOT NULL,
	"accomplishments" text[],
	"blockers" text[],
	"next_steps" text[],
	"hours_worked" numeric(5, 2),
	"tasks_completed" integer,
	"meetings_attended" integer,
	"status" varchar DEFAULT 'draft',
	"reviewed_by" varchar,
	"sent_at" timestamp,
	"sent_to" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "benchmark_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"period_type" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"avg_time_to_invoice_payment" numeric(8, 2),
	"shift_adherence_rate" numeric(5, 2),
	"employee_turnover_rate" numeric(5, 2),
	"avg_overtime_percentage" numeric(5, 2),
	"avg_revenue_per_employee" numeric(12, 2),
	"avg_cost_variance_percentage" numeric(5, 2),
	"platform_fee_collected" numeric(12, 2),
	"total_active_employees" integer,
	"total_active_clients" integer,
	"total_shifts_scheduled" integer,
	"total_hours_worked" numeric(12, 2),
	"industry_category" varchar,
	"company_size" varchar,
	"is_anonymized" boolean DEFAULT true,
	"share_with_peer_benchmarks" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bid_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"bid_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"cover_letter" text,
	"why_interested" text,
	"relevant_experience" text,
	"skill_match_percentage" numeric(5, 2),
	"missing_skills" jsonb DEFAULT '[]',
	"matching_skills" jsonb DEFAULT '[]',
	"turnover_risk_score" integer,
	"is_high_risk" boolean DEFAULT false,
	"status" varchar DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"intervention_triggered" boolean DEFAULT false,
	"intervention_by" varchar,
	"intervention_at" timestamp,
	"intervention_notes" text,
	"applied_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "billing_addons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"addon_key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"pricing_type" varchar NOT NULL,
	"base_price" numeric(10, 2),
	"usage_price" numeric(10, 4),
	"usage_unit" varchar,
	"monthly_token_allowance" numeric(15, 2),
	"overage_rate_per_1k_tokens" numeric(10, 4),
	"stripe_price_id" varchar,
	"stripe_metered_price_id" varchar,
	"requires_base_tier" varchar,
	"is_ai_feature" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "billing_addons_addon_key_unique" UNIQUE("addon_key")
);
--> statement-breakpoint
CREATE TABLE "billing_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"event_category" varchar NOT NULL,
	"actor_type" varchar NOT NULL,
	"actor_id" varchar,
	"actor_email" varchar,
	"description" text NOT NULL,
	"related_entity_type" varchar,
	"related_entity_id" varchar,
	"previous_state" jsonb,
	"new_state" jsonb,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category_code" varchar,
	"planned_amount" numeric(12, 2) NOT NULL,
	"actual_spent" numeric(12, 2) DEFAULT '0.00',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_variances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"planned_amount" numeric(12, 2) NOT NULL,
	"actual_spent" numeric(12, 2) NOT NULL,
	"variance" numeric(12, 2) NOT NULL,
	"variance_percentage" numeric(5, 2),
	"analysis_notes" text,
	"action_items" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"budget_type" varchar NOT NULL,
	"fiscal_year" integer NOT NULL,
	"fiscal_quarter" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"planned_amount" numeric(12, 2) NOT NULL,
	"adjusted_amount" numeric(12, 2),
	"actual_spent" numeric(12, 2) DEFAULT '0.00',
	"committed" numeric(12, 2) DEFAULT '0.00',
	"department_name" varchar,
	"category_code" varchar,
	"owner_id" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"status" varchar DEFAULT 'draft',
	"alert_threshold" integer DEFAULT 80,
	"is_over_budget" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capacity_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar,
	"manager_id" varchar,
	"alert_type" varchar NOT NULL,
	"severity" varchar DEFAULT 'medium',
	"week_start_date" timestamp NOT NULL,
	"scheduled_hours" numeric(5, 2),
	"available_hours" numeric(5, 2),
	"overage_hours" numeric(5, 2),
	"message" text NOT NULL,
	"suggested_action" text,
	"status" varchar DEFAULT 'active',
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_agreement_acceptances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"ticket_id" varchar,
	"session_id" varchar,
	"agreement_version" varchar DEFAULT '1.0' NOT NULL,
	"full_name" varchar,
	"agreed_to_terms" boolean DEFAULT false NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"accepted_at" timestamp DEFAULT now(),
	"room_slug" varchar NOT NULL,
	"platform_role" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"customer_id" varchar,
	"customer_name" varchar,
	"customer_email" varchar,
	"support_agent_id" varchar,
	"support_agent_name" varchar,
	"subject" varchar,
	"status" varchar DEFAULT 'active' NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"associated_ticket_id" varchar,
	"conversation_type" varchar DEFAULT 'open_chat' NOT NULL,
	"shift_id" varchar,
	"time_entry_id" varchar,
	"is_encrypted" boolean DEFAULT false,
	"encryption_key_id" varchar,
	"is_silenced" boolean DEFAULT true,
	"voice_granted_by" varchar,
	"voice_granted_at" timestamp,
	"rating" integer,
	"feedback" text,
	"last_message_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_guest_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"guest_name" varchar,
	"guest_email" varchar,
	"guest_phone" varchar,
	"access_token" varchar NOT NULL,
	"token_type" varchar DEFAULT 'email' NOT NULL,
	"can_send_messages" boolean DEFAULT true,
	"can_view_files" boolean DEFAULT true,
	"can_upload_files" boolean DEFAULT true,
	"scope_description" text,
	"invited_by" varchar NOT NULL,
	"invited_by_name" varchar NOT NULL,
	"invitation_message" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_accessed_at" timestamp,
	"revoked_at" timestamp,
	"revoked_by" varchar,
	"revoked_reason" text,
	"is_active" boolean DEFAULT true,
	"access_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chat_guest_tokens_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar,
	"sender_name" varchar NOT NULL,
	"sender_type" varchar NOT NULL,
	"message" text NOT NULL,
	"message_type" varchar DEFAULT 'text',
	"is_system_message" boolean DEFAULT false,
	"is_encrypted" boolean DEFAULT false,
	"encryption_iv" varchar,
	"is_private_message" boolean DEFAULT false,
	"recipient_id" varchar,
	"parent_message_id" varchar,
	"thread_id" varchar,
	"reply_count" integer DEFAULT 0,
	"attachment_url" varchar,
	"attachment_name" varchar,
	"attachment_type" varchar,
	"attachment_size" integer,
	"attachment_thumbnail" varchar,
	"is_formatted" boolean DEFAULT false,
	"formatted_content" text,
	"mentions" text[] DEFAULT ARRAY[]::text[],
	"visible_to_staff_only" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"participant_id" varchar NOT NULL,
	"participant_name" varchar NOT NULL,
	"participant_email" varchar,
	"participant_role" varchar DEFAULT 'member' NOT NULL,
	"can_send_messages" boolean DEFAULT true,
	"can_view_history" boolean DEFAULT true,
	"can_invite_others" boolean DEFAULT false,
	"invited_by" varchar,
	"invited_at" timestamp DEFAULT now(),
	"joined_at" timestamp,
	"left_at" timestamp,
	"is_minimized" boolean DEFAULT false,
	"bubble_position" integer,
	"last_read_at" timestamp,
	"is_muted" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_payment_info" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"stripe_customer_id" varchar,
	"payment_terms_days" integer DEFAULT 30,
	"auto_charge_enabled" boolean DEFAULT false,
	"billing_email" varchar,
	"billing_phone" varchar,
	"billing_contact_name" varchar,
	"billing_address" text,
	"billing_city" varchar,
	"billing_state" varchar,
	"billing_zip" varchar,
	"billing_country" varchar DEFAULT 'US',
	"has_payment_method" boolean DEFAULT false,
	"payment_method_last4" varchar,
	"payment_method_type" varchar,
	"payment_method_expiry" varchar,
	"credit_limit" numeric(10, 2),
	"current_balance" numeric(10, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "client_payment_info_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "client_payment_info_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "client_portal_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"access_token" varchar NOT NULL,
	"email" varchar NOT NULL,
	"portal_name" varchar,
	"logo_url" varchar,
	"primary_color" varchar,
	"is_active" boolean DEFAULT true,
	"last_accessed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "client_portal_access_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "client_rate_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"billable_rate" numeric(10, 2) NOT NULL,
	"role_rate_overrides" jsonb,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"superseded_by" varchar,
	"changed_by" varchar,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"billable_rate" numeric(10, 2) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"has_subscription" boolean DEFAULT false,
	"subscription_amount" numeric(10, 2),
	"subscription_frequency" varchar,
	"subscription_start_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"company_name" varchar,
	"email" varchar,
	"phone" varchar,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"billing_email" varchar,
	"tax_id" varchar,
	"client_overtime_multiplier" numeric(5, 2),
	"client_holiday_multiplier" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"content_markdown" text,
	"pdf_url" varchar,
	"version" varchar NOT NULL,
	"previous_version_id" varchar,
	"status" "policy_status" DEFAULT 'draft',
	"published_at" timestamp,
	"published_by" varchar,
	"requires_acknowledgment" boolean DEFAULT true,
	"acknowledgment_deadline_days" integer DEFAULT 30,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"title" varchar,
	"company_name" varchar NOT NULL,
	"company_domain" varchar,
	"source" varchar DEFAULT 'manual',
	"confidence_score" integer DEFAULT 50,
	"consent_given" boolean DEFAULT false,
	"consent_source" varchar,
	"consent_date" timestamp,
	"status" varchar DEFAULT 'active',
	"lead_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"document_type" "contract_document_type" NOT NULL,
	"document_name" varchar NOT NULL,
	"template_id" varchar,
	"file_url" varchar NOT NULL,
	"signed_file_url" varchar,
	"requires_signature" boolean DEFAULT true,
	"signed_by" varchar,
	"signed_at" timestamp,
	"ip_address" varchar,
	"requires_employer_signature" boolean DEFAULT false,
	"employer_signed_by" varchar,
	"employer_signed_at" timestamp,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"is_required" boolean DEFAULT true,
	"must_complete_before_work" boolean DEFAULT true,
	"expiration_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_encryption_keys" (
	"id" varchar PRIMARY KEY NOT NULL,
	"conversation_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"key_material" text NOT NULL,
	"algorithm" varchar DEFAULT 'aes-256-gcm' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"is_active" boolean DEFAULT true,
	"rotated_at" timestamp,
	"replaced_by" varchar,
	CONSTRAINT "conversation_encryption_keys_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "cost_variance_predictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"shift_id" varchar,
	"schedule_date" timestamp NOT NULL,
	"schedule_period" varchar,
	"budgeted_cost" numeric(10, 2) NOT NULL,
	"predicted_cost" numeric(10, 2) NOT NULL,
	"variance_amount" numeric(10, 2) NOT NULL,
	"variance_percentage" numeric(5, 2) NOT NULL,
	"exceeds_10_percent" boolean DEFAULT false,
	"risk_level" varchar NOT NULL,
	"risk_factors" jsonb,
	"problematic_shifts" jsonb,
	"recommendations" text,
	"ai_model" varchar DEFAULT 'gpt-4',
	"confidence_score" numeric(5, 2),
	"analysis_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_form_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"submitted_by" varchar,
	"submitted_by_type" varchar,
	"employee_id" varchar,
	"form_data" jsonb NOT NULL,
	"signature_data" jsonb,
	"has_accepted" boolean DEFAULT false,
	"accepted_at" timestamp,
	"documents" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"onboarding_token_id" varchar,
	"report_submission_id" varchar,
	"status" varchar DEFAULT 'completed',
	"submitted_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"template" jsonb NOT NULL,
	"requires_signature" boolean DEFAULT false,
	"signature_type" varchar DEFAULT 'typed_name',
	"signature_text" text,
	"requires_documents" boolean DEFAULT false,
	"document_types" jsonb,
	"max_documents" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"accessible_by" jsonb,
	"created_by" varchar,
	"created_by_role" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"rule_type" "rule_type" NOT NULL,
	"priority" integer DEFAULT 0,
	"trigger" varchar NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"condition_logic" varchar(3) DEFAULT 'AND',
	"status" "rule_status" DEFAULT 'active',
	"is_locked" boolean DEFAULT false,
	"execution_count" integer DEFAULT 0,
	"last_executed_at" timestamp,
	"error_count" integer DEFAULT 0,
	"last_error" text,
	"created_by" varchar,
	"updated_by" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_report_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"access_token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"access_count" integer DEFAULT 0,
	"last_accessed_at" timestamp,
	"is_revoked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customer_report_access_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "deal_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"deal_id" varchar,
	"rfp_id" varchar,
	"assigned_to" varchar,
	"due_date" timestamp,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'pending',
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_name" varchar NOT NULL,
	"company_name" varchar NOT NULL,
	"lead_id" varchar,
	"rfp_id" varchar,
	"stage" varchar DEFAULT 'prospect' NOT NULL,
	"estimated_value" numeric(12, 2),
	"probability" integer DEFAULT 50,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"owner_id" varchar,
	"status" varchar DEFAULT 'active',
	"lost_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dispatch_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"incident_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"unit_number" varchar NOT NULL,
	"status" varchar DEFAULT 'assigned' NOT NULL,
	"assigned_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"en_route_at" timestamp,
	"arrived_at" timestamp,
	"cleared_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"is_primary" boolean DEFAULT false,
	"assigned_by" varchar,
	"assignment_method" varchar DEFAULT 'manual',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dispatch_incidents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"incident_number" varchar NOT NULL,
	"priority" varchar NOT NULL,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'queued' NOT NULL,
	"client_id" varchar,
	"location_address" text NOT NULL,
	"location_latitude" double precision,
	"location_longitude" double precision,
	"location_zone" varchar,
	"caller_name" varchar,
	"caller_phone" varchar,
	"caller_type" varchar,
	"description" text,
	"special_instructions" text,
	"notes" text,
	"call_received_at" timestamp NOT NULL,
	"dispatched_at" timestamp,
	"en_route_at" timestamp,
	"arrived_at" timestamp,
	"cleared_at" timestamp,
	"cancelled_at" timestamp,
	"response_time_seconds" integer,
	"travel_time_seconds" integer,
	"scene_time_seconds" integer,
	"total_time_seconds" integer,
	"assigned_units" text[],
	"required_certifications" text[],
	"created_by" varchar,
	"cancelled_by" varchar,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dispatch_incidents_incident_number_unique" UNIQUE("incident_number")
);
--> statement-breakpoint
CREATE TABLE "dispatch_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"incident_id" varchar,
	"employee_id" varchar,
	"action" varchar NOT NULL,
	"action_category" varchar NOT NULL,
	"user_id" varchar,
	"actor_type" varchar DEFAULT 'user',
	"description" text NOT NULL,
	"details" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"filed_by" varchar NOT NULL,
	"filed_by_role" varchar NOT NULL,
	"dispute_type" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"target_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"reason" text NOT NULL,
	"evidence" text[],
	"requested_outcome" text,
	"ai_summary" text,
	"ai_recommendation" varchar,
	"ai_confidence_score" numeric(3, 2),
	"ai_analysis_factors" text[],
	"ai_processed_at" timestamp,
	"ai_model" varchar,
	"compliance_category" varchar,
	"regulatory_reference" varchar,
	"priority" varchar DEFAULT 'normal',
	"assigned_to" varchar,
	"assigned_at" timestamp,
	"filed_at" timestamp DEFAULT now() NOT NULL,
	"review_deadline" timestamp,
	"status" varchar DEFAULT 'pending',
	"review_started_at" timestamp,
	"reviewer_notes" text,
	"reviewer_recommendation" varchar,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"resolution" text,
	"resolution_action" text,
	"changes_applied" boolean DEFAULT false,
	"changes_applied_at" timestamp,
	"can_be_appealed" boolean DEFAULT true,
	"appeal_deadline" timestamp,
	"appealed_to_upper_management" boolean DEFAULT false,
	"status_history" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dm_access_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"audit_request_id" varchar,
	"accessed_by" varchar NOT NULL,
	"accessed_by_name" varchar NOT NULL,
	"accessed_by_email" varchar NOT NULL,
	"accessed_by_role" varchar NOT NULL,
	"accessed_at" timestamp DEFAULT now() NOT NULL,
	"access_reason" text NOT NULL,
	"ip_address" varchar,
	"user_agent" varchar,
	"messages_viewed" integer DEFAULT 0,
	"files_accessed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dm_audit_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"investigation_reason" text NOT NULL,
	"case_number" varchar,
	"requested_by" varchar NOT NULL,
	"requested_by_name" varchar NOT NULL,
	"requested_by_email" varchar NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_by_name" varchar,
	"approved_at" timestamp,
	"denied_reason" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_access_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"document_id" varchar NOT NULL,
	"accessed_by" varchar NOT NULL,
	"accessed_by_email" varchar NOT NULL,
	"accessed_by_role" varchar NOT NULL,
	"access_type" varchar NOT NULL,
	"ip_address" varchar NOT NULL,
	"user_agent" text,
	"accessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_signatures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"application_id" varchar,
	"employee_id" varchar,
	"document_type" "document_type_signature" NOT NULL,
	"document_title" varchar NOT NULL,
	"document_content" text,
	"document_url" varchar,
	"status" "signature_status" DEFAULT 'pending',
	"signature_data" text,
	"signed_by_name" varchar,
	"signed_at" timestamp,
	"ip_address" varchar,
	"user_agent" varchar,
	"geo_location" varchar,
	"witness_name" varchar,
	"witness_signature" text,
	"witnessed_at" timestamp,
	"viewed_at" timestamp,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"template_id" varchar NOT NULL,
	"target_industry" varchar,
	"status" varchar DEFAULT 'draft',
	"scheduled_for" timestamp,
	"lead_filters" jsonb,
	"total_sent" integer DEFAULT 0,
	"total_opened" integer DEFAULT 0,
	"total_clicked" integer DEFAULT 0,
	"total_replied" integer DEFAULT 0,
	"total_bounced" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_sends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar,
	"lead_id" varchar NOT NULL,
	"template_id" varchar NOT NULL,
	"to_email" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"status" varchar DEFAULT 'pending',
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"replied_at" timestamp,
	"external_id" varchar,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_sequences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"steps" jsonb NOT NULL,
	"target_industry" varchar,
	"daily_send_limit" integer DEFAULT 100,
	"send_window" jsonb,
	"status" varchar DEFAULT 'active',
	"total_enrolled" integer DEFAULT 0,
	"total_completed" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"target_industry" varchar,
	"category" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"body_template" text NOT NULL,
	"use_ai" boolean DEFAULT true,
	"ai_prompt" text,
	"is_active" boolean DEFAULT true,
	"times_sent" integer DEFAULT 0,
	"open_rate" numeric(5, 2),
	"response_rate" numeric(5, 2),
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar NOT NULL,
	"end_time" varchar NOT NULL,
	"status" "availability_status" DEFAULT 'available',
	"notes" text,
	"effective_from" timestamp DEFAULT now(),
	"effective_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_bank_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"account_holder_name" varchar NOT NULL,
	"bank_name" varchar NOT NULL,
	"routing_number" varchar NOT NULL,
	"account_number" varchar NOT NULL,
	"account_type" varchar NOT NULL,
	"stripe_bank_account_token" varchar,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_benefits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"benefit_type" "benefit_type" NOT NULL,
	"benefit_name" varchar NOT NULL,
	"provider" varchar,
	"coverage_amount" numeric(12, 2),
	"employee_contribution" numeric(10, 2),
	"employer_contribution" numeric(10, 2),
	"pto_hours_per_year" numeric(10, 2),
	"pto_hours_accrued" numeric(10, 2) DEFAULT '0',
	"pto_hours_used" numeric(10, 2) DEFAULT '0',
	"contribution_percentage" numeric(5, 2),
	"match_percentage" numeric(5, 2),
	"status" "benefit_status" DEFAULT 'active',
	"start_date" timestamp,
	"end_date" timestamp,
	"policy_number" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"application_id" varchar,
	"certification_type" varchar NOT NULL,
	"certification_name" varchar NOT NULL,
	"certification_number" varchar,
	"issuing_authority" varchar,
	"issued_date" timestamp,
	"expiration_date" timestamp,
	"status" "certification_status" DEFAULT 'pending',
	"document_url" varchar,
	"verified_by" varchar,
	"verified_at" timestamp,
	"is_required" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"application_id" varchar,
	"document_type" "employee_document_type" NOT NULL,
	"document_name" varchar NOT NULL,
	"document_description" text,
	"file_url" varchar NOT NULL,
	"file_size" integer,
	"file_type" varchar,
	"original_file_name" varchar,
	"uploaded_by" varchar,
	"uploaded_by_email" varchar,
	"uploaded_by_role" varchar,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"upload_ip_address" varchar NOT NULL,
	"upload_user_agent" text,
	"upload_geo_location" varchar,
	"status" "employee_document_status" DEFAULT 'uploaded',
	"expiration_date" timestamp,
	"requires_approval" boolean DEFAULT false,
	"approved_by" varchar,
	"approved_at" timestamp,
	"approval_notes" text,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"is_compliance_document" boolean DEFAULT false,
	"retention_period_years" integer DEFAULT 7,
	"delete_after" timestamp,
	"is_verified" boolean DEFAULT false,
	"verified_by" varchar,
	"verified_at" timestamp,
	"is_immutable" boolean DEFAULT false,
	"digital_signature_hash" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_url" varchar NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"document_type" "document_type" DEFAULT 'other',
	"title" varchar NOT NULL,
	"description" text,
	"expiration_date" timestamp,
	"is_expired" boolean DEFAULT false,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_health_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"overall_engagement_score" numeric(5, 2),
	"survey_participation_rate" numeric(5, 2),
	"average_sentiment_score" numeric(5, 2),
	"workload_satisfaction" numeric(5, 2),
	"management_satisfaction" numeric(5, 2),
	"growth_satisfaction" numeric(5, 2),
	"compensation_satisfaction" numeric(5, 2),
	"culture_satisfaction" numeric(5, 2),
	"turnover_risk_score" numeric(5, 2),
	"risk_level" varchar,
	"risk_factors" jsonb DEFAULT '[]',
	"requires_manager_action" boolean DEFAULT false,
	"action_priority" varchar,
	"suggested_actions" jsonb DEFAULT '[]',
	"manager_notified" boolean DEFAULT false,
	"manager_notified_at" timestamp,
	"action_taken" boolean DEFAULT false,
	"action_taken_at" timestamp,
	"action_notes" text,
	"calculated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_i9_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"status" "i9_status" DEFAULT 'pending',
	"verified_at" timestamp,
	"verified_by" varchar,
	"work_authorization_type" varchar,
	"expiration_date" timestamp,
	"reverification_required" boolean DEFAULT false,
	"reverification_date" timestamp,
	"reverification_completed" boolean DEFAULT false,
	"reverification_completed_at" timestamp,
	"list_a_document" varchar,
	"list_a_document_number" varchar,
	"list_a_expiration_date" timestamp,
	"list_a_document_url" varchar,
	"list_b_document" varchar,
	"list_b_document_number" varchar,
	"list_b_expiration_date" timestamp,
	"list_b_document_url" varchar,
	"list_c_document" varchar,
	"list_c_document_number" varchar,
	"list_c_expiration_date" timestamp,
	"list_c_document_url" varchar,
	"alert_sent_30_days" boolean DEFAULT false,
	"alert_sent_7_days" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_notices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"notice_type" "notice_type" NOT NULL,
	"current_role" varchar,
	"submitted_date" timestamp DEFAULT now(),
	"effective_date" timestamp NOT NULL,
	"reason" text,
	"status" "notice_status" DEFAULT 'submitted',
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"released_early" boolean DEFAULT false,
	"released_by" varchar,
	"released_at" timestamp,
	"actual_end_date" timestamp,
	"eligible_for_rehire" boolean DEFAULT true,
	"rehire_notes" text,
	"retention_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_payroll_info" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"ssn" varchar,
	"tax_filing_status" varchar,
	"federal_allowances" integer DEFAULT 0,
	"state_allowances" integer DEFAULT 0,
	"additional_withholding" numeric(10, 2) DEFAULT '0.00',
	"w4_completed" boolean DEFAULT false,
	"w4_completed_at" timestamp,
	"w4_document_id" varchar,
	"i9_completed" boolean DEFAULT false,
	"i9_completed_at" timestamp,
	"i9_document_id" varchar,
	"i9_expiration_date" timestamp,
	"bank_name" varchar,
	"bank_account_type" varchar,
	"bank_routing_number" varchar,
	"bank_account_number" varchar,
	"direct_deposit_enabled" boolean DEFAULT false,
	"state_of_residence" varchar,
	"local_tax_jurisdiction" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employee_payroll_info_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_rate_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"superseded_by" varchar,
	"changed_by" varchar,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_recognition" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"recognized_employee_id" varchar NOT NULL,
	"recognized_by_employee_id" varchar,
	"recognized_by_manager_id" varchar,
	"reason" text NOT NULL,
	"category" varchar,
	"related_shift_id" varchar,
	"related_client_id" varchar,
	"related_report_id" varchar,
	"is_public" boolean DEFAULT true,
	"has_monetary_reward" boolean DEFAULT false,
	"reward_amount" numeric(10, 2),
	"reward_type" varchar,
	"reward_paid" boolean DEFAULT false,
	"reward_paid_at" timestamp,
	"reward_transaction_id" varchar,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_tax_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"form_type" "tax_form_type" NOT NULL,
	"tax_year" integer NOT NULL,
	"filing_status" varchar,
	"allowances" integer,
	"additional_withholding" numeric(10, 2),
	"wages" numeric(10, 2),
	"federal_tax_withheld" numeric(10, 2),
	"social_security_wages" numeric(10, 2),
	"social_security_tax_withheld" numeric(10, 2),
	"medicare_wages" numeric(10, 2),
	"medicare_tax_withheld" numeric(10, 2),
	"state_tax_withheld" numeric(10, 2),
	"pdf_url" varchar,
	"generated_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_terminations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"terminated_by" varchar NOT NULL,
	"termination_type" "termination_type" NOT NULL,
	"termination_date" timestamp NOT NULL,
	"last_working_day" timestamp NOT NULL,
	"reason" text NOT NULL,
	"exit_interview_notes" text,
	"rehire_eligible" boolean DEFAULT false,
	"equipment_returned" boolean DEFAULT false,
	"access_revoked" boolean DEFAULT false,
	"final_payment_processed" boolean DEFAULT false,
	"exit_interview_completed" boolean DEFAULT false,
	"status" "termination_status" DEFAULT 'pending',
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar,
	"employee_number" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"address" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"emergency_contact_name" varchar,
	"emergency_contact_phone" varchar,
	"emergency_contact_relation" varchar,
	"role" varchar,
	"workspace_role" "workspace_role" DEFAULT 'staff',
	"hourly_rate" numeric(10, 2),
	"color" varchar DEFAULT '#3b82f6',
	"onboarding_status" varchar DEFAULT 'not_started',
	"is_active" boolean DEFAULT true,
	"availability_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employer_benchmark_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"benchmark_type" varchar NOT NULL,
	"target_id" varchar,
	"target_name" varchar,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"management_quality_avg" numeric(3, 2),
	"work_environment_avg" numeric(3, 2),
	"compensation_fairness_avg" numeric(3, 2),
	"growth_opportunities_avg" numeric(3, 2),
	"work_life_balance_avg" numeric(3, 2),
	"equipment_resources_avg" numeric(3, 2),
	"communication_clarity_avg" numeric(3, 2),
	"recognition_appreciation_avg" numeric(3, 2),
	"overall_score" numeric(3, 2),
	"industry_average_score" numeric(3, 2),
	"percentile_rank" integer,
	"score_trend" varchar,
	"month_over_month_change" numeric(4, 2),
	"total_responses" integer DEFAULT 0,
	"response_rate" numeric(5, 2),
	"critical_issues_count" integer DEFAULT 0,
	"high_risk_flags" jsonb DEFAULT '[]',
	"calculated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employer_ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar,
	"rating_type" varchar NOT NULL,
	"target_id" varchar,
	"target_name" varchar,
	"management_quality" integer,
	"work_environment" integer,
	"compensation_fairness" integer,
	"growth_opportunities" integer,
	"work_life_balance" integer,
	"equipment_resources" integer,
	"communication_clarity" integer,
	"recognition_appreciation" integer,
	"overall_score" numeric(3, 1),
	"positive_comments" text,
	"improvement_suggestions" text,
	"sentiment_score" numeric(5, 2),
	"sentiment_label" varchar,
	"risk_flags" jsonb DEFAULT '[]',
	"is_anonymous" boolean DEFAULT true,
	"ip_address" varchar,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "escalation_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"requestor_id" varchar NOT NULL,
	"requestor_email" varchar NOT NULL,
	"requestor_role" "workspace_role" NOT NULL,
	"category" "escalation_category" NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"related_entity_type" varchar,
	"related_entity_id" varchar,
	"context_data" jsonb,
	"attachments" jsonb,
	"assigned_to" varchar,
	"status" "escalation_status" DEFAULT 'open',
	"resolution" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "escalation_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "exit_interview_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"rating" integer,
	"category" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"code" varchar,
	"budget_id" varchar,
	"requires_approval" boolean DEFAULT true,
	"approval_threshold" numeric(10, 2),
	"max_per_transaction" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_receipts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"expense_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_url" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"extracted_amount" numeric(10, 2),
	"extracted_date" timestamp,
	"extracted_vendor" varchar,
	"ocr_confidence" numeric(5, 2),
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"expense_date" timestamp NOT NULL,
	"merchant" varchar,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"receipt_url" varchar,
	"receipt_image_url" varchar,
	"client_id" varchar,
	"project_code" varchar,
	"is_billable" boolean DEFAULT false,
	"mileage_distance" numeric(10, 2),
	"mileage_rate" numeric(5, 3),
	"mileage_start_location" text,
	"mileage_end_location" text,
	"status" "expense_status" DEFAULT 'submitted',
	"submitted_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"review_notes" text,
	"reimbursed_at" timestamp,
	"reimbursed_by" varchar,
	"reimbursement_method" varchar,
	"reimbursement_reference" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_identifiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "external_id_entity_type" NOT NULL,
	"entity_id" varchar NOT NULL,
	"external_id" varchar NOT NULL,
	"org_id" varchar,
	"is_primary" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "external_identifiers_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"tier" varchar DEFAULT 'basic' NOT NULL,
	"has_employee_management" boolean DEFAULT true,
	"has_client_management" boolean DEFAULT true,
	"has_basic_scheduling" boolean DEFAULT true,
	"has_time_tracking" boolean DEFAULT true,
	"has_invoice_generation" boolean DEFAULT false,
	"has_analytics_dashboard" boolean DEFAULT false,
	"has_employee_onboarding" boolean DEFAULT false,
	"has_report_management_system" boolean DEFAULT false,
	"has_gps_tracking" boolean DEFAULT false,
	"has_advanced_rbac" boolean DEFAULT false,
	"has_compliance_tools" boolean DEFAULT false,
	"has_white_label_rms" boolean DEFAULT false,
	"has_custom_branding" boolean DEFAULT false,
	"has_api_access" boolean DEFAULT false,
	"has_sso_integration" boolean DEFAULT false,
	"has_dedicated_support" boolean DEFAULT false,
	"has_automated_payroll" boolean DEFAULT false,
	"has_sms_notifications" boolean DEFAULT false,
	"has_advanced_analytics" boolean DEFAULT false,
	"max_employees" integer DEFAULT 5,
	"max_clients" integer DEFAULT 10,
	"max_reports_per_month" integer DEFAULT 10,
	"max_storage_gb" integer DEFAULT 5,
	"stripe_subscription_id" varchar,
	"billing_cycle" varchar DEFAULT 'monthly',
	"trial_ends_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_flags_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "gps_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"time_entry_id" varchar,
	"employee_id" varchar,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"accuracy" numeric(10, 2),
	"altitude" numeric(10, 2),
	"speed" numeric(10, 2),
	"heading" numeric(10, 2),
	"is_moving" boolean DEFAULT false,
	"address" varchar,
	"verified" boolean DEFAULT false,
	"device_info" jsonb,
	"battery_level" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "help_os_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar,
	"ticket_number" varchar NOT NULL,
	"user_name" varchar NOT NULL,
	"workspace_id" varchar,
	"queue_position" integer,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"estimated_wait_minutes" integer,
	"priority_score" integer DEFAULT 0 NOT NULL,
	"wait_time_score" integer DEFAULT 0,
	"tier_score" integer DEFAULT 0,
	"special_needs_score" integer DEFAULT 0,
	"ownership_score" integer DEFAULT 0,
	"subscription_tier" varchar DEFAULT 'free',
	"has_special_needs" boolean DEFAULT false,
	"is_owner" boolean DEFAULT false,
	"is_poc" boolean DEFAULT false,
	"last_announcement_at" timestamp,
	"announcement_count" integer DEFAULT 0,
	"has_received_welcome" boolean DEFAULT false,
	"status" varchar DEFAULT 'waiting',
	"assigned_staff_id" varchar,
	"assigned_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "helpos_faqs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"embedding_vector" text,
	"search_keywords" text,
	"view_count" integer DEFAULT 0,
	"helpful_count" integer DEFAULT 0,
	"not_helpful_count" integer DEFAULT 0,
	"is_published" boolean DEFAULT true,
	"published_at" timestamp DEFAULT now(),
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "id_sequences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"kind" "id_sequence_kind" NOT NULL,
	"next_val" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"operation_type" "operation_type" NOT NULL,
	"request_fingerprint" text NOT NULL,
	"status" "idempotency_status" DEFAULT 'processing' NOT NULL,
	"result_id" varchar,
	"result_metadata" jsonb,
	"error_message" text,
	"error_stack" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"key_prefix" varchar NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" jsonb DEFAULT '[]',
	"ip_whitelist" jsonb DEFAULT '[]',
	"rate_limit" integer DEFAULT 1000,
	"rate_limit_window" varchar DEFAULT 'hour',
	"last_used_at" timestamp,
	"total_requests" integer DEFAULT 0,
	"total_errors" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_by_user_id" varchar,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"integration_id" varchar NOT NULL,
	"connection_name" varchar,
	"external_account_id" varchar,
	"external_account_name" varchar,
	"auth_type" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"api_key" text,
	"api_secret" text,
	"sync_config" jsonb,
	"last_sync_at" timestamp,
	"last_sync_status" varchar,
	"last_sync_error" text,
	"next_sync_at" timestamp,
	"total_sync_count" integer DEFAULT 0,
	"failed_sync_count" integer DEFAULT 0,
	"is_healthy" boolean DEFAULT true,
	"health_check_at" timestamp,
	"health_check_error" text,
	"is_active" boolean DEFAULT true,
	"connected_at" timestamp DEFAULT now(),
	"disconnected_at" timestamp,
	"connected_by_user_id" varchar,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_marketplace" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"category" "integration_category" NOT NULL,
	"provider" varchar NOT NULL,
	"logo_url" varchar,
	"description" text,
	"long_description" text,
	"website_url" varchar,
	"documentation_url" varchar,
	"auth_type" varchar NOT NULL,
	"auth_config" jsonb,
	"supported_features" jsonb DEFAULT '[]',
	"webhook_support" boolean DEFAULT false,
	"bidirectional_sync" boolean DEFAULT false,
	"is_certified" boolean DEFAULT false,
	"is_developer_submitted" boolean DEFAULT false,
	"install_count" integer DEFAULT 0,
	"rating" numeric(3, 2),
	"review_count" integer DEFAULT 0,
	"developer_id" varchar,
	"developer_email" varchar,
	"developer_webhook_url" varchar,
	"is_active" boolean DEFAULT true,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "integration_marketplace_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "internal_bids" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"bid_type" varchar NOT NULL,
	"required_skills" jsonb DEFAULT '[]' NOT NULL,
	"required_certifications" jsonb DEFAULT '[]',
	"minimum_experience" integer,
	"target_role" varchar,
	"compensation_type" varchar NOT NULL,
	"compensation_amount" numeric(10, 2),
	"estimated_duration" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"location_required" varchar,
	"site_location" text,
	"client_id" varchar,
	"posted_by" varchar NOT NULL,
	"status" varchar DEFAULT 'open',
	"max_applicants" integer DEFAULT 10,
	"application_deadline" timestamp,
	"selected_employee_id" varchar,
	"selected_at" timestamp,
	"high_risk_view_count" integer DEFAULT 0,
	"high_risk_viewers" jsonb DEFAULT '[]',
	"last_high_risk_view_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"time_entry_id" varchar,
	"shift_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"invoice_id" varchar NOT NULL,
	"stripe_payment_intent_id" varchar,
	"stripe_customer_id" varchar,
	"stripe_charge_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar DEFAULT 'usd',
	"status" "payment_status" DEFAULT 'pending',
	"payer_email" varchar,
	"payer_name" varchar,
	"payment_method" varchar,
	"last4" varchar,
	"receipt_url" varchar,
	"refunded_amount" numeric(10, 2) DEFAULT '0.00',
	"refund_reason" text,
	"refunded_at" timestamp,
	"failure_code" varchar,
	"failure_message" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoice_payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "invoice_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"invoice_id" varchar NOT NULL,
	"reminder_type" "reminder_type" NOT NULL,
	"days_overdue" integer NOT NULL,
	"sent_at" timestamp,
	"email_to" varchar NOT NULL,
	"email_subject" text,
	"email_body" text,
	"status" varchar DEFAULT 'pending',
	"failure_reason" text,
	"needs_human_intervention" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"invoice_number" varchar NOT NULL,
	"issue_date" timestamp DEFAULT now(),
	"due_date" timestamp,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00',
	"tax_amount" numeric(10, 2) DEFAULT '0.00',
	"total" numeric(10, 2) NOT NULL,
	"platform_fee_percentage" numeric(5, 2),
	"platform_fee_amount" numeric(10, 2),
	"business_amount" numeric(10, 2),
	"status" "invoice_status" DEFAULT 'draft',
	"paid_at" timestamp,
	"payment_intent_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_posting_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"applicant_name" varchar NOT NULL,
	"applicant_email" varchar NOT NULL,
	"applicant_phone" varchar,
	"resume_url" varchar,
	"cover_letter" text,
	"status" "application_status" DEFAULT 'pending',
	"reviewed_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"department" varchar,
	"location" varchar,
	"employment_type" varchar,
	"description" text NOT NULL,
	"requirements" text,
	"salary_min" numeric(10, 2),
	"salary_max" numeric(10, 2),
	"status" "job_posting_status" DEFAULT 'draft',
	"posted_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "knowledge_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"category" varchar(100),
	"tags" text[],
	"is_public" boolean DEFAULT false,
	"required_role" varchar,
	"last_updated_by" varchar,
	"view_count" integer DEFAULT 0,
	"helpful_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_queries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar,
	"user_id" varchar,
	"query" text NOT NULL,
	"response" text,
	"response_time" integer,
	"articles_retrieved" text[],
	"was_helpful" boolean,
	"follow_up_queries" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kpi_alert_triggers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"metric_value" numeric(10, 2) NOT NULL,
	"threshold_value" numeric(10, 2) NOT NULL,
	"entity_type" varchar,
	"entity_id" varchar,
	"entity_data" jsonb,
	"notified_users" jsonb,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kpi_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"alert_name" varchar NOT NULL,
	"description" text,
	"alert_type" varchar NOT NULL,
	"metric_source" varchar NOT NULL,
	"threshold_value" numeric(10, 2) NOT NULL,
	"threshold_unit" varchar,
	"comparison_operator" varchar NOT NULL,
	"notify_roles" jsonb NOT NULL,
	"notify_users" jsonb,
	"notification_method" varchar DEFAULT 'in_app',
	"is_active" boolean DEFAULT true,
	"last_triggered_at" timestamp,
	"trigger_count" integer DEFAULT 0,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leader_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"leader_id" varchar NOT NULL,
	"leader_email" varchar NOT NULL,
	"leader_role" "workspace_role" NOT NULL,
	"action" "leader_action" NOT NULL,
	"target_entity_type" varchar NOT NULL,
	"target_entity_id" varchar NOT NULL,
	"target_employee_name" varchar,
	"changes_before" jsonb,
	"changes_after" jsonb,
	"reason" text,
	"metadata" jsonb,
	"ip_address" varchar,
	"requires_approval" boolean DEFAULT false,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar NOT NULL,
	"industry" varchar,
	"company_website" varchar,
	"estimated_employees" integer,
	"contact_name" varchar,
	"contact_title" varchar,
	"contact_email" varchar NOT NULL,
	"contact_phone" varchar,
	"lead_status" varchar DEFAULT 'new',
	"lead_score" integer DEFAULT 0,
	"estimated_value" numeric(10, 2),
	"source" varchar,
	"last_campaign_id" varchar,
	"last_contacted_at" timestamp,
	"notes" text,
	"next_follow_up_date" timestamp,
	"assigned_to" varchar,
	"converted_to_workspace_id" varchar,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locked_report_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"snapshot_data" jsonb NOT NULL,
	"pdf_url" text,
	"pdf_generated_at" timestamp,
	"locked_by" varchar NOT NULL,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"lock_reason" varchar DEFAULT 'approved',
	"content_hash" varchar,
	"digital_signature" text,
	"employee_id" varchar,
	"shift_id" varchar,
	"client_id" varchar,
	"retention_years" integer DEFAULT 7,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manager_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"manager_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"emoji" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_read_receipts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "metrics_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"period" varchar NOT NULL,
	"metrics" text NOT NULL,
	"total_revenue" numeric(12, 2),
	"total_expenses" numeric(12, 2),
	"net_profit" numeric(12, 2),
	"employee_count" integer,
	"active_clients" integer,
	"hours_tracked" numeric(10, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "motd_acknowledgments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"motd_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"acknowledged_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "motd_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"requires_acknowledgment" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"background_color" varchar DEFAULT '#1e3a8a',
	"text_color" varchar DEFAULT '#ffffff',
	"icon_name" varchar DEFAULT 'bell',
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_by" varchar,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"action_url" varchar(500),
	"related_entity_type" varchar(100),
	"related_entity_id" varchar,
	"metadata" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"partner_type" "partner_type" NOT NULL,
	"state" varchar NOT NULL,
	"code_verifier" text,
	"code_challenge" varchar,
	"code_challenge_method" varchar DEFAULT 'S256',
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "oauth_states_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "off_cycle_payroll_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"pay_type" varchar NOT NULL,
	"description" text NOT NULL,
	"pay_date" timestamp NOT NULL,
	"federal_tax_withheld" numeric(10, 2),
	"state_tax_withheld" numeric(10, 2),
	"social_security_withheld" numeric(10, 2),
	"medicare_withheld" numeric(10, 2),
	"net_amount" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'pending',
	"processed_at" timestamp,
	"stripe_transfer_id" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offboarding_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"last_work_day" timestamp NOT NULL,
	"exit_reason" varchar,
	"exit_reason_details" text,
	"is_voluntary" boolean DEFAULT true,
	"exit_interview_scheduled" timestamp,
	"exit_interview_completed" timestamp,
	"exit_interview_conducted_by" varchar,
	"exit_interview_notes" text,
	"assets_returned" boolean DEFAULT false,
	"asset_return_notes" text,
	"access_revoked" boolean DEFAULT false,
	"access_revoked_at" timestamp,
	"access_revoked_by" varchar,
	"final_pay_calculated" boolean DEFAULT false,
	"final_pay_amount" numeric(10, 2),
	"final_pay_date" timestamp,
	"clearance_status" varchar DEFAULT 'pending',
	"clearance_notes" text,
	"eligible_for_rehire" boolean,
	"rehire_notes" text,
	"status" varchar DEFAULT 'in_progress',
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar,
	"invite_id" varchar,
	"employee_number" varchar,
	"first_name" varchar NOT NULL,
	"middle_name" varchar,
	"last_name" varchar NOT NULL,
	"date_of_birth" timestamp,
	"ssn" varchar,
	"email" varchar NOT NULL,
	"phone" varchar,
	"address" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"emergency_contact_name" varchar,
	"emergency_contact_phone" varchar,
	"emergency_contact_relation" varchar,
	"tax_classification" "tax_classification",
	"bank_name" varchar,
	"routing_number" varchar,
	"account_number" varchar,
	"account_type" varchar,
	"filing_status" varchar,
	"multiple_jobs" varchar,
	"dependents_amount" varchar,
	"other_income" varchar,
	"deductions" varchar,
	"extra_withholding" varchar,
	"available_monday" boolean DEFAULT true,
	"available_tuesday" boolean DEFAULT true,
	"available_wednesday" boolean DEFAULT true,
	"available_thursday" boolean DEFAULT true,
	"available_friday" boolean DEFAULT true,
	"available_saturday" boolean DEFAULT false,
	"available_sunday" boolean DEFAULT false,
	"preferred_shift_time" varchar,
	"max_hours_per_week" integer,
	"availability_notes" text,
	"current_step" "onboarding_step" DEFAULT 'personal_info',
	"status" "onboarding_status" DEFAULT 'in_progress',
	"completed_at" timestamp,
	"ip_address" varchar,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "onboarding_applications_employee_number_unique" UNIQUE("employee_number")
);
--> statement-breakpoint
CREATE TABLE "onboarding_checklists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"application_id" varchar NOT NULL,
	"employee_id" varchar,
	"template_id" varchar,
	"checklist_items" jsonb NOT NULL,
	"overall_progress" integer DEFAULT 0,
	"i9_deadline_date" timestamp,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"invite_token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"is_used" boolean DEFAULT false,
	"sent_by" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "onboarding_invites_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "onboarding_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"template_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"expected_end_date" timestamp,
	"actual_end_date" timestamp,
	"status" varchar DEFAULT 'in_progress',
	"completion_percentage" integer DEFAULT 0,
	"manager_id" varchar,
	"hr_contact_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_task_completions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"task_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"completed_at" timestamp,
	"completed_by" varchar,
	"document_url" varchar,
	"signature_url" varchar,
	"notes" text,
	"due_date" timestamp,
	"is_overdue" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"task_type" varchar NOT NULL,
	"assigned_to" varchar,
	"day_offset" integer DEFAULT 0,
	"is_required" boolean DEFAULT true,
	"requires_document" boolean DEFAULT false,
	"requires_signature" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"department_name" varchar,
	"role_template_id" varchar,
	"duration_days" integer DEFAULT 30,
	"is_active" boolean DEFAULT true,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_workflow_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"industry" varchar,
	"role_type" varchar,
	"steps" jsonb NOT NULL,
	"compliance_requirements" jsonb,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_chat_channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"channel_name" varchar NOT NULL,
	"channel_slug" varchar NOT NULL,
	"description" text,
	"channel_type" varchar DEFAULT 'general',
	"conversation_id" varchar,
	"is_private" boolean DEFAULT false,
	"allow_guests" boolean DEFAULT false,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_chat_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"room_name" varchar NOT NULL,
	"room_slug" varchar NOT NULL,
	"description" text,
	"status" "room_status" DEFAULT 'active',
	"suspended_reason" text,
	"suspended_at" timestamp,
	"suspended_by" varchar,
	"conversation_id" varchar,
	"is_onboarded" boolean DEFAULT false,
	"onboarded_at" timestamp,
	"onboarded_by" varchar,
	"allow_guests" boolean DEFAULT true,
	"require_approval" boolean DEFAULT false,
	"max_members" integer DEFAULT 100,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_onboarding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"current_step" integer DEFAULT 1,
	"total_steps" integer DEFAULT 8,
	"is_completed" boolean DEFAULT false,
	"step1_company_info" boolean DEFAULT false,
	"step2_billing_info" boolean DEFAULT false,
	"step3_roles_permissions" boolean DEFAULT false,
	"step4_invite_employees" boolean DEFAULT false,
	"step5_add_customers" boolean DEFAULT false,
	"step6_configure_payroll" boolean DEFAULT false,
	"step7_setup_integrations" boolean DEFAULT false,
	"step8_review_launch" boolean DEFAULT false,
	"completed_at" timestamp,
	"completed_by" varchar,
	"skipped_steps" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_onboarding_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "organization_room_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"role" "room_member_role" DEFAULT 'member',
	"can_invite" boolean DEFAULT false,
	"can_manage" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now(),
	"last_active_at" timestamp,
	"is_approved" boolean DEFAULT true,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_room_onboarding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"current_step" integer DEFAULT 1,
	"total_steps" integer DEFAULT 4,
	"is_completed" boolean DEFAULT false,
	"step1_room_name" boolean DEFAULT false,
	"step2_channels" boolean DEFAULT false,
	"step3_members" boolean DEFAULT false,
	"step4_settings" boolean DEFAULT false,
	"room_name_input" varchar,
	"channels_input" text[] DEFAULT ARRAY[]::text[],
	"guest_access_enabled" boolean DEFAULT true,
	"completed_at" timestamp,
	"completed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_room_onboarding_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "overage_charges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"subscription_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"overage_type" varchar NOT NULL,
	"limit" integer NOT NULL,
	"actual" integer NOT NULL,
	"overage" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_charge" numeric(10, 2) NOT NULL,
	"invoiced" boolean DEFAULT false,
	"invoice_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oversight_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"entity_type" "oversight_entity_type" NOT NULL,
	"entity_id" varchar NOT NULL,
	"detected_by" varchar NOT NULL,
	"detected_at" timestamp DEFAULT now(),
	"auto_score" integer,
	"flag_reason" text NOT NULL,
	"entity_summary" jsonb,
	"status" "oversight_status" DEFAULT 'pending' NOT NULL,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_api_usage_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar,
	"partner_connection_id" varchar NOT NULL,
	"partner_type" "partner_type" NOT NULL,
	"endpoint" varchar NOT NULL,
	"http_method" varchar NOT NULL,
	"usage_type" varchar NOT NULL,
	"usage_amount" numeric(15, 4) DEFAULT '1.0000' NOT NULL,
	"usage_unit" varchar DEFAULT 'api_calls' NOT NULL,
	"unit_price" numeric(10, 6),
	"total_cost" numeric(10, 6),
	"cost_currency" varchar DEFAULT 'USD',
	"request_payload_size" integer,
	"response_payload_size" integer,
	"response_status_code" integer,
	"response_time_ms" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"error_code" varchar,
	"feature_key" varchar,
	"activity_type" varchar,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"partner_type" "partner_type" NOT NULL,
	"partner_name" varchar NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_type" varchar DEFAULT 'Bearer',
	"expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scopes" text[] DEFAULT ARRAY[]::text[],
	"status" "partner_connection_status" DEFAULT 'connected' NOT NULL,
	"last_sync_at" timestamp,
	"last_error_at" timestamp,
	"last_error" text,
	"webhook_secret" text,
	"webhook_url" varchar,
	"webhook_enabled" boolean DEFAULT false,
	"realm_id" varchar,
	"company_id" varchar,
	"metadata" jsonb,
	"connected_by" varchar,
	"connected_at" timestamp DEFAULT now(),
	"disconnected_by" varchar,
	"disconnected_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_data_mappings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"partner_connection_id" varchar NOT NULL,
	"partner_type" "partner_type" NOT NULL,
	"entity_type" varchar NOT NULL,
	"autoforce_entity_id" varchar NOT NULL,
	"partner_entity_id" varchar NOT NULL,
	"partner_entity_name" varchar,
	"sync_status" varchar DEFAULT 'synced' NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_error" text,
	"mapping_source" varchar DEFAULT 'manual',
	"metadata" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"invoice_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"payment_intent_id" varchar,
	"transaction_id" varchar,
	"platform_fee_amount" numeric(10, 2),
	"business_amount" numeric(10, 2),
	"status" varchar DEFAULT 'pending',
	"paid_at" timestamp,
	"failure_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"regular_hours" numeric(8, 2) DEFAULT '0.00',
	"overtime_hours" numeric(8, 2) DEFAULT '0.00',
	"holiday_hours" numeric(8, 2) DEFAULT '0.00',
	"hourly_rate" numeric(10, 2) NOT NULL,
	"gross_pay" numeric(10, 2) DEFAULT '0.00',
	"federal_tax" numeric(10, 2) DEFAULT '0.00',
	"state_tax" numeric(10, 2) DEFAULT '0.00',
	"social_security" numeric(10, 2) DEFAULT '0.00',
	"medicare" numeric(10, 2) DEFAULT '0.00',
	"net_pay" numeric(10, 2) DEFAULT '0.00',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"status" "payroll_status" DEFAULT 'draft',
	"total_gross_pay" numeric(12, 2) DEFAULT '0.00',
	"total_taxes" numeric(12, 2) DEFAULT '0.00',
	"total_net_pay" numeric(12, 2) DEFAULT '0.00',
	"processed_by" varchar,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"reviewer_id" varchar,
	"review_type" "review_type" NOT NULL,
	"review_period_start" timestamp,
	"review_period_end" timestamp,
	"overall_rating" integer,
	"technical_skills_rating" integer,
	"communication_rating" integer,
	"teamwork_rating" integer,
	"leadership_rating" integer,
	"attendance_rating" integer,
	"strengths" text,
	"areas_for_improvement" text,
	"goals" text[],
	"reviewer_comments" text,
	"employee_comments" text,
	"status" "review_status" DEFAULT 'draft',
	"completed_at" timestamp,
	"salary_adjustment" numeric(10, 2),
	"promotion_recommended" boolean DEFAULT false,
	"shifts_completed_on_time" integer,
	"total_shifts_assigned" integer,
	"attendance_rate" numeric(5, 2),
	"average_hours_worked_per_week" numeric(5, 2),
	"overtime_hours" numeric(10, 2),
	"reports_submitted" integer,
	"reports_approved" integer,
	"reports_rejected" integer,
	"report_quality_score" numeric(5, 2),
	"compliance_violations" integer,
	"safety_incidents" integer,
	"training_completion_rate" numeric(5, 2),
	"quality_of_work_rating" integer,
	"initiative_rating" integer,
	"composite_score" numeric(5, 2),
	"performance_tier" varchar,
	"current_hourly_rate" numeric(10, 2),
	"suggested_pay_increase" numeric(10, 2),
	"suggested_pay_increase_percentage" numeric(5, 2),
	"pay_increase_formula" text,
	"pay_increase_justification" text,
	"manager_approved_increase" numeric(10, 2),
	"manager_override_reason" text,
	"employee_acknowledged_at" timestamp,
	"goals_met" jsonb,
	"goals_not_met" jsonb,
	"next_quarter_goals" jsonb,
	"development_needs" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_revenue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"revenue_type" varchar NOT NULL,
	"source_id" varchar,
	"amount" numeric(12, 2) NOT NULL,
	"fee_percentage" numeric(5, 2),
	"collected_at" timestamp,
	"status" varchar DEFAULT 'pending',
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "platform_role" NOT NULL,
	"granted_by" varchar,
	"granted_reason" text,
	"revoked_at" timestamp,
	"revoked_by" varchar,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policy_acknowledgments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"policy_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"acknowledged_at" timestamp DEFAULT now(),
	"signature_url" varchar,
	"ip_address" varchar,
	"user_agent" text,
	"policy_version" varchar NOT NULL,
	"policy_title" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotional_banners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"cta_text" varchar(100),
	"cta_link" varchar(500),
	"is_active" boolean DEFAULT false,
	"priority" integer DEFAULT 0,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"rfp_id" varchar,
	"proposal_name" varchar NOT NULL,
	"version" integer DEFAULT 1,
	"sections" jsonb,
	"file_url" varchar,
	"status" varchar DEFAULT 'draft',
	"submitted_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pto_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"approver_id" varchar,
	"pto_type" "pto_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_hours" numeric(10, 2) NOT NULL,
	"request_notes" text,
	"status" "pto_status" DEFAULT 'pending',
	"approved_at" timestamp,
	"denial_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "published_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"week_start_date" timestamp NOT NULL,
	"week_end_date" timestamp NOT NULL,
	"title" varchar,
	"published_by" varchar NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"total_shifts" integer DEFAULT 0,
	"employees_affected" integer DEFAULT 0,
	"shift_ids" text[],
	"notifications_sent" boolean DEFAULT false,
	"notifications_sent_at" timestamp,
	"version" integer DEFAULT 1,
	"replaces_schedule_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pulse_survey_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"survey_template_id" varchar NOT NULL,
	"employee_id" varchar,
	"responses" jsonb NOT NULL,
	"sentiment_score" numeric(5, 2),
	"sentiment_label" varchar,
	"emotional_tone" varchar,
	"key_themes" jsonb DEFAULT '[]',
	"engagement_score" numeric(5, 2),
	"submitted_at" timestamp DEFAULT now(),
	"ip_address" varchar,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "pulse_survey_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"questions" jsonb NOT NULL,
	"frequency" varchar DEFAULT 'monthly',
	"is_active" boolean DEFAULT true,
	"is_anonymous" boolean DEFAULT true,
	"show_results_to_employees" boolean DEFAULT false,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_approval_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"step_name" varchar,
	"required_role" varchar,
	"assigned_to" varchar,
	"status" varchar DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"rejection_reason" text,
	"notification_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"file_data" text,
	"uploaded_by" varchar,
	"uploaded_at" timestamp DEFAULT now(),
	"captured_at" timestamp,
	"gps_location" jsonb
);
--> statement-breakpoint
CREATE TABLE "report_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"template_id" varchar NOT NULL,
	"report_number" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"client_id" varchar,
	"form_data" jsonb NOT NULL,
	"photos" jsonb,
	"status" varchar DEFAULT 'draft',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"sent_to_customer_at" timestamp,
	"customer_viewed_at" timestamp,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"fields" jsonb NOT NULL,
	"requires_photos" boolean DEFAULT false,
	"min_photos" integer DEFAULT 0,
	"max_photos" integer DEFAULT 10,
	"photo_instructions" text,
	"is_compliance_report" boolean DEFAULT false,
	"compliance_type" varchar,
	"auto_generate_pdf" boolean DEFAULT false,
	"allow_ai_summary" boolean DEFAULT false,
	"is_dynamic_report" boolean DEFAULT false,
	"data_source_config" jsonb,
	"chart_type" varchar,
	"is_active" boolean DEFAULT false,
	"is_system_template" boolean DEFAULT false,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_workflow_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"approval_steps" jsonb NOT NULL,
	"final_destination" varchar NOT NULL,
	"email_template" text,
	"email_subject" varchar,
	"include_attachments" boolean DEFAULT true,
	"require_rejection_notes" boolean DEFAULT true,
	"allow_resubmit" boolean DEFAULT true,
	"auto_lock_on_approval" boolean DEFAULT true,
	"auto_generate_pdf" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rfps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"rfp_number" varchar,
	"buyer" varchar NOT NULL,
	"source_url" varchar,
	"source" varchar DEFAULT 'manual',
	"posted_date" timestamp,
	"due_date" timestamp,
	"estimated_value" numeric(12, 2),
	"industry" varchar,
	"location" varchar,
	"ai_summary" text,
	"scope_of_work" text,
	"requirements" jsonb,
	"red_flags" text[] DEFAULT ARRAY[]::text[],
	"status" varchar DEFAULT 'active',
	"content_hash" varchar,
	"assigned_to" varchar,
	"deal_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_capabilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"workspace_role" "workspace_role" NOT NULL,
	"capability" "leader_capability" NOT NULL,
	"constraints" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"role_name" varchar NOT NULL,
	"role_level" integer,
	"department" varchar,
	"from_role" varchar,
	"minimum_time_in_current_role" integer,
	"minimum_performance_score" numeric(5, 2),
	"required_skills" jsonb DEFAULT '[]' NOT NULL,
	"required_certifications" jsonb DEFAULT '[]',
	"required_training_courses" jsonb DEFAULT '[]',
	"desired_skills" jsonb DEFAULT '[]',
	"desired_certifications" jsonb DEFAULT '[]',
	"min_hourly_rate" numeric(10, 2),
	"max_hourly_rate" numeric(10, 2),
	"min_salary" numeric(12, 2),
	"max_salary" numeric(12, 2),
	"responsibilities" text,
	"performance_expectations" text,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rule_execution_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"trigger_event" varchar NOT NULL,
	"entity_type" varchar,
	"entity_id" varchar,
	"conditions_met" boolean NOT NULL,
	"actions_executed" jsonb,
	"execution_time_ms" integer,
	"success" boolean DEFAULT true,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_queries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"query" text NOT NULL,
	"search_type" varchar NOT NULL,
	"results_count" integer DEFAULT 0,
	"ai_processed" boolean DEFAULT false,
	"ai_interpretation" text,
	"search_filters" text,
	"execution_time_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sequence_sends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" varchar NOT NULL,
	"lead_id" varchar,
	"deal_id" varchar,
	"current_step" integer DEFAULT 1,
	"total_steps" integer NOT NULL,
	"status" varchar DEFAULT 'active',
	"last_sent_at" timestamp,
	"next_send_at" timestamp,
	"replied" boolean DEFAULT false,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_coverage_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"client_id" varchar,
	"request_number" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"number_of_employees_needed" integer DEFAULT 1 NOT NULL,
	"job_site_address" text,
	"job_site_city" varchar,
	"job_site_state" varchar,
	"job_site_zip_code" varchar,
	"job_site_latitude" numeric(10, 6),
	"job_site_longitude" numeric(10, 6),
	"required_skills" text[],
	"required_certifications" text[],
	"ai_processed" boolean DEFAULT false,
	"ai_processed_at" timestamp,
	"ai_suggested_employees" jsonb,
	"ai_confidence_score" numeric(3, 2),
	"status" varchar DEFAULT 'pending',
	"assigned_employee_ids" text[],
	"ai_usage_log_id" varchar,
	"requested_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_coverage_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_acknowledgments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"shift_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"type" "shift_acknowledgment_type" NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"attachment_urls" text[],
	"is_required" boolean DEFAULT true,
	"acknowledged_at" timestamp,
	"acknowledged_by" varchar,
	"denied_at" timestamp,
	"denial_reason" text,
	"created_by" varchar NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shift_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"shift_id" varchar NOT NULL,
	"action_type" "shift_action_type" NOT NULL,
	"requested_by" varchar NOT NULL,
	"target_employee_id" varchar,
	"reason" text,
	"status" "shift_action_status" DEFAULT 'pending',
	"requires_approval" boolean DEFAULT true,
	"approved_by" varchar,
	"approved_at" timestamp,
	"denial_reason" text,
	"ai_schedule_updated" boolean DEFAULT false,
	"replacement_shift_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shift_order_acknowledgments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"shift_order_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"acknowledged_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "shift_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"shift_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"priority" "shift_order_priority" DEFAULT 'normal',
	"requires_acknowledgment" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shift_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"title" varchar,
	"description" text,
	"duration_hours" numeric(5, 2) NOT NULL,
	"billable_to_client" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar,
	"client_id" varchar,
	"title" varchar,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"ai_generated" boolean DEFAULT false,
	"requires_acknowledgment" boolean DEFAULT false,
	"replacement_for_shift_id" varchar,
	"auto_replacement_attempts" integer DEFAULT 0,
	"ai_confidence_score" numeric(3, 2),
	"risk_score" numeric(3, 2),
	"risk_factors" jsonb,
	"acknowledged_at" timestamp,
	"denied_at" timestamp,
	"denial_reason" text,
	"status" "shift_status" DEFAULT 'draft',
	"billable_to_client" boolean DEFAULT true,
	"hourly_rate_override" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill_gap_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"target_role_id" varchar NOT NULL,
	"current_role" varchar,
	"current_skills" jsonb DEFAULT '[]',
	"current_certifications" jsonb DEFAULT '[]',
	"current_training_completed" jsonb DEFAULT '[]',
	"missing_skills" jsonb DEFAULT '[]',
	"missing_certifications" jsonb DEFAULT '[]',
	"missing_training" jsonb DEFAULT '[]',
	"readiness_score" numeric(5, 2),
	"skills_readiness" numeric(5, 2),
	"certifications_readiness" numeric(5, 2),
	"training_readiness" numeric(5, 2),
	"experience_readiness" numeric(5, 2),
	"estimated_time_to_ready" integer,
	"blockers" jsonb DEFAULT '[]',
	"recommended_actions" jsonb DEFAULT '[]',
	"actions_completed" integer DEFAULT 0,
	"total_actions" integer DEFAULT 0,
	"last_progress_update" timestamp,
	"status" varchar DEFAULT 'active',
	"employee_interested_at" timestamp,
	"manager_reviewed_at" timestamp,
	"manager_notes" text,
	"generated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "smart_schedule_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"schedule_date" timestamp NOT NULL,
	"employees_scheduled" integer NOT NULL,
	"shifts_generated" integer NOT NULL,
	"billing_model" varchar NOT NULL,
	"charge_amount" numeric(10, 2),
	"ai_model" varchar DEFAULT 'gpt-4',
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"invoice_number" varchar NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0.00',
	"discount_amount" numeric(10, 2) DEFAULT '0.00',
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"paid_at" timestamp,
	"due_date" timestamp NOT NULL,
	"stripe_invoice_id" varchar,
	"stripe_payment_intent_id" varchar,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "subscription_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"item_type" varchar NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '1.0000',
	"unit_price" numeric(10, 4) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"addon_id" varchar,
	"feature_key" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"invoice_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar DEFAULT 'usd' NOT NULL,
	"status" varchar NOT NULL,
	"failure_reason" text,
	"payment_method" varchar,
	"payment_method_last4" varchar,
	"stripe_payment_intent_id" varchar,
	"stripe_charge_id" varchar,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"refund_amount" numeric(10, 2),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"plan" "subscription_plan" DEFAULT 'free',
	"billing_cycle" "billing_cycle" DEFAULT 'monthly',
	"status" "subscription_status" DEFAULT 'active',
	"base_price" integer DEFAULT 0,
	"platform_fee_percentage" numeric(5, 2) DEFAULT '3.00',
	"max_employees" integer DEFAULT 5,
	"max_clients" integer DEFAULT 10,
	"current_employees" integer DEFAULT 0,
	"current_clients" integer DEFAULT 0,
	"trial_started_at" timestamp,
	"trial_ends_at" timestamp,
	"current_period_start" timestamp DEFAULT now(),
	"current_period_end" timestamp,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"stripe_subscription_id" varchar,
	"stripe_customer_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "support_registry" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"support_code" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "support_registry_support_code_unique" UNIQUE("support_code")
);
--> statement-breakpoint
CREATE TABLE "support_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'open',
	"status_message" text,
	"workspace_id" varchar,
	"conversation_id" varchar,
	"requires_ticket" boolean DEFAULT false,
	"allowed_roles" jsonb,
	"last_status_change" timestamp DEFAULT now(),
	"status_changed_by" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "support_rooms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "support_ticket_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"room_id" varchar NOT NULL,
	"granted_by" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"join_count" integer DEFAULT 0,
	"last_joined_at" timestamp,
	"is_revoked" boolean DEFAULT false,
	"revoked_at" timestamp,
	"revoked_by" varchar,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"ticket_number" varchar NOT NULL,
	"type" varchar NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"client_id" varchar,
	"employee_id" varchar,
	"requested_by" varchar,
	"subject" varchar NOT NULL,
	"description" text NOT NULL,
	"report_submission_id" varchar,
	"status" varchar DEFAULT 'open',
	"assigned_to" varchar,
	"resolution" text,
	"resolution_summary" text,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"closed_at" timestamp,
	"closed_by" varchar,
	"verified_at" timestamp,
	"verified_by" varchar,
	"is_escalated" boolean DEFAULT false,
	"escalated_at" timestamp,
	"escalated_by" varchar,
	"escalated_reason" text,
	"platform_assigned_to" varchar,
	"platform_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"platform_role" "platform_role",
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"workspace_id" varchar,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" varchar,
	"requires_confirmation" boolean DEFAULT false,
	"confirmed_by" varchar,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terms_acknowledgments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar,
	"ticket_number" varchar,
	"user_id" varchar,
	"user_name" varchar NOT NULL,
	"user_email" varchar NOT NULL,
	"workspace_id" varchar,
	"initials_provided" varchar NOT NULL,
	"accepted_terms_version" varchar DEFAULT '1.0',
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar,
	"user_agent" varchar,
	"ticket_closed_at" timestamp,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"shift_id" varchar,
	"employee_id" varchar NOT NULL,
	"client_id" varchar,
	"clock_in" timestamp NOT NULL,
	"clock_out" timestamp,
	"total_hours" numeric(10, 2),
	"hourly_rate" numeric(10, 2),
	"total_amount" numeric(10, 2),
	"clock_in_latitude" numeric(10, 7),
	"clock_in_longitude" numeric(10, 7),
	"clock_in_accuracy" numeric(8, 2),
	"clock_in_ip_address" varchar,
	"clock_out_latitude" numeric(10, 7),
	"clock_out_longitude" numeric(10, 7),
	"clock_out_accuracy" numeric(8, 2),
	"clock_out_ip_address" varchar,
	"job_site_latitude" numeric(10, 7),
	"job_site_longitude" numeric(10, 7),
	"job_site_address" text,
	"status" varchar DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"invoice_id" varchar,
	"billed_at" timestamp,
	"payroll_run_id" varchar,
	"payrolled_at" timestamp,
	"billable_to_client" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_entry_approval_audit" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"time_entry_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"performed_by" varchar,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"previous_status" varchar,
	"new_status" varchar NOT NULL,
	"reason" text,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_entry_discrepancies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"time_entry_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"discrepancy_type" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"expected_location" jsonb,
	"actual_location" jsonb,
	"distance_meters" numeric(10, 2),
	"detected_at" timestamp DEFAULT now(),
	"auto_flagged" boolean DEFAULT true,
	"status" varchar DEFAULT 'open',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"resolution" text,
	"resolution_notes" text,
	"evidence_snapshot" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"request_type" varchar NOT NULL,
	"total_days" integer,
	"reason" text,
	"notes" text,
	"status" varchar DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"affects_scheduling" boolean DEFAULT true,
	"ai_notified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timesheet_edit_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"time_entry_id" varchar NOT NULL,
	"requested_by" varchar NOT NULL,
	"reason" text NOT NULL,
	"proposed_clock_in" timestamp,
	"proposed_clock_out" timestamp,
	"proposed_notes" text,
	"original_clock_in" timestamp,
	"original_clock_out" timestamp,
	"original_notes" text,
	"status" timesheet_edit_request_status DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"applied_by" varchar,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tombstones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"org_id" varchar,
	"deleted_by_user_id" varchar NOT NULL,
	"approval_id" varchar,
	"reason" text,
	"entity_snapshot" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"issuing_organization" varchar,
	"certification_number" varchar,
	"issued_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"certificate_url" varchar,
	"verification_url" varchar,
	"status" varchar DEFAULT 'active',
	"course_id" varchar,
	"enrollment_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"course_type" varchar NOT NULL,
	"duration" integer,
	"content_url" varchar,
	"video_url" varchar,
	"is_required" boolean DEFAULT false,
	"expires_after_days" integer,
	"passing_score" integer,
	"requires_approval" boolean DEFAULT false,
	"max_enrollments" integer,
	"instructor_id" varchar,
	"instructor_name" varchar,
	"is_active" boolean DEFAULT true,
	"published_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"enrolled_by" varchar,
	"status" varchar DEFAULT 'enrolled',
	"started_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"assessment_score" integer,
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"certificate_url" varchar,
	"certificate_issued_at" timestamp,
	"rating" integer,
	"feedback" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "turnover_risk_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"risk_score" numeric(5, 2) NOT NULL,
	"risk_level" varchar NOT NULL,
	"confidence_score" numeric(5, 2),
	"prediction_period" integer DEFAULT 90,
	"predicted_turnover_date" timestamp,
	"replacement_cost" numeric(10, 2),
	"training_cost" numeric(10, 2),
	"lost_productivity_cost" numeric(10, 2),
	"total_turnover_cost" numeric(10, 2),
	"risk_factors" jsonb,
	"recommendations" text,
	"ai_model" varchar DEFAULT 'gpt-4',
	"data_points_used" integer,
	"analysis_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "unit_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"unit_number" varchar NOT NULL,
	"unit_type" varchar,
	"status" varchar DEFAULT 'offline' NOT NULL,
	"status_changed_at" timestamp NOT NULL,
	"status_changed_by" varchar,
	"current_incident_id" varchar,
	"last_known_latitude" double precision,
	"last_known_longitude" double precision,
	"last_location_update" timestamp,
	"assigned_zone" varchar,
	"capabilities" text[],
	"equipment_assigned" text[],
	"current_shift_id" varchar,
	"clocked_in_at" timestamp,
	"device_id" varchar,
	"app_version" varchar,
	"last_heartbeat" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unit_statuses_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "user_onboarding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"completed_steps" text[] DEFAULT ARRAY[]::text[],
	"current_step" varchar,
	"total_steps" integer DEFAULT 20,
	"progress_percentage" integer DEFAULT 0,
	"has_skipped" boolean DEFAULT false,
	"has_completed" boolean DEFAULT false,
	"last_viewed_at" timestamp,
	"communication_progress" integer DEFAULT 0,
	"operations_progress" integer DEFAULT 0,
	"growth_progress" integer DEFAULT 0,
	"platform_progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_onboarding_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"email_verified" boolean DEFAULT false,
	"verification_token" varchar,
	"verification_token_expiry" timestamp,
	"reset_token" varchar,
	"reset_token_expiry" timestamp,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"phone" varchar,
	"work_id" varchar,
	"current_workspace_id" varchar,
	"role" varchar,
	"last_login_at" timestamp,
	"login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"event_id" varchar,
	"payload" jsonb NOT NULL,
	"attempt_number" integer DEFAULT 1,
	"target_url" varchar NOT NULL,
	"http_method" varchar DEFAULT 'POST',
	"request_headers" jsonb,
	"request_body" jsonb,
	"status_code" integer,
	"response_headers" jsonb,
	"response_body" text,
	"duration_ms" integer,
	"status" varchar NOT NULL,
	"error_message" text,
	"error_stack" text,
	"next_retry_at" timestamp,
	"max_retries" integer,
	"scheduled_at" timestamp DEFAULT now(),
	"sent_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"target_url" varchar NOT NULL,
	"events" jsonb NOT NULL,
	"filters" jsonb,
	"auth_type" varchar,
	"auth_config" jsonb,
	"retry_policy" varchar DEFAULT 'exponential',
	"max_retries" integer DEFAULT 3,
	"timeout_seconds" integer DEFAULT 30,
	"is_healthy" boolean DEFAULT true,
	"last_success_at" timestamp,
	"last_failure_at" timestamp,
	"consecutive_failures" integer DEFAULT 0,
	"total_deliveries" integer DEFAULT 0,
	"successful_deliveries" integer DEFAULT 0,
	"failed_deliveries" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"paused_reason" text,
	"created_by_user_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_addons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"addon_id" varchar NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"purchased_by" varchar NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"stripe_subscription_item_id" varchar,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"monthly_tokens_used" numeric(15, 2) DEFAULT '0',
	"last_usage_reset_at" timestamp DEFAULT now(),
	"cancelled_at" timestamp,
	"cancelled_by" varchar,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_ai_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"feature" varchar NOT NULL,
	"operation" varchar NOT NULL,
	"request_id" varchar NOT NULL,
	"tokens_used" integer NOT NULL,
	"model" varchar NOT NULL,
	"provider_cost_usd" numeric(10, 6) NOT NULL,
	"markup_percentage" numeric(5, 2) DEFAULT '300.00',
	"client_charge_usd" numeric(10, 6) NOT NULL,
	"status" varchar DEFAULT 'pending',
	"invoice_id" varchar,
	"billing_period" varchar,
	"input_data" jsonb,
	"output_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_rate_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"default_billable_rate" numeric(10, 2),
	"default_hourly_rate" numeric(10, 2),
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"superseded_by" varchar,
	"changed_by" varchar,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_themes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"tier" varchar DEFAULT 'standard',
	"primary_color" varchar,
	"secondary_color" varchar,
	"success_color" varchar,
	"warning_color" varchar,
	"error_color" varchar,
	"logo_url" text,
	"logo_url_inverted" text,
	"favicon_url" text,
	"login_background_url" text,
	"font_family" varchar,
	"custom_domain" varchar,
	"custom_email_domain" varchar,
	"remove_powered_by" boolean DEFAULT false,
	"remove_clockwork_logo" boolean DEFAULT false,
	"remove_watermarks" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "workspace_themes_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"organization_id" varchar,
	"organization_serial" varchar,
	"company_name" varchar,
	"business_category" "business_category" DEFAULT 'general',
	"industry_description" text,
	"tax_id" varchar,
	"address" text,
	"phone" varchar,
	"website" varchar,
	"subscription_tier" varchar DEFAULT 'free',
	"subscription_status" varchar DEFAULT 'active',
	"max_employees" integer DEFAULT 5,
	"max_clients" integer DEFAULT 10,
	"stripe_account_id" varchar,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"platform_fee_percentage" numeric(5, 2) DEFAULT '3.00',
	"is_suspended" boolean DEFAULT false,
	"suspended_reason" text,
	"suspended_at" timestamp,
	"suspended_by" varchar,
	"is_frozen" boolean DEFAULT false,
	"frozen_reason" text,
	"frozen_at" timestamp,
	"frozen_by" varchar,
	"is_locked" boolean DEFAULT false,
	"locked_reason" text,
	"locked_at" timestamp,
	"locked_by" varchar,
	"scheduleos_trial_started_at" timestamp,
	"scheduleos_activated_at" timestamp,
	"scheduleos_activated_by" varchar,
	"scheduleos_payment_method" varchar,
	"hireos_trial_started_at" timestamp,
	"hireos_activated_at" timestamp,
	"hireos_activated_by" varchar,
	"feature_scheduleos_enabled" boolean DEFAULT true,
	"feature_timeos_enabled" boolean DEFAULT true,
	"feature_payrollos_enabled" boolean DEFAULT false,
	"feature_billos_enabled" boolean DEFAULT true,
	"feature_hireos_enabled" boolean DEFAULT true,
	"feature_reportos_enabled" boolean DEFAULT true,
	"feature_analyticsos_enabled" boolean DEFAULT true,
	"feature_supportos_enabled" boolean DEFAULT true,
	"feature_communicationos_enabled" boolean DEFAULT true,
	"billing_override_type" varchar,
	"billing_override_discount_percent" integer,
	"billing_override_custom_price" numeric(10, 2),
	"billing_override_reason" text,
	"billing_override_applied_by" varchar,
	"billing_override_applied_at" timestamp,
	"billing_override_expires_at" timestamp,
	"admin_notes" text,
	"admin_flags" text[] DEFAULT ARRAY[]::text[],
	"last_admin_action" text,
	"last_admin_action_by" varchar,
	"last_admin_action_at" timestamp,
	"account_state" varchar DEFAULT 'active',
	"account_suspension_reason" text,
	"account_suspended_at" timestamp,
	"support_ticket_id" varchar,
	"next_invoice_at" timestamp,
	"last_invoice_generated_at" timestamp,
	"billing_cycle_day" integer DEFAULT 1,
	"billing_preferences" jsonb,
	"monthly_employee_overages" integer DEFAULT 0,
	"last_overage_check_at" timestamp,
	"auto_invoicing_enabled" boolean DEFAULT true,
	"invoice_schedule" varchar DEFAULT 'monthly',
	"invoice_custom_days" integer,
	"invoice_day_of_week" integer,
	"invoice_day_of_month" integer DEFAULT 1,
	"auto_payroll_enabled" boolean DEFAULT true,
	"payroll_schedule" varchar DEFAULT 'biweekly',
	"payroll_custom_days" integer,
	"payroll_day_of_week" integer DEFAULT 1,
	"payroll_day_of_month" integer DEFAULT 1,
	"payroll_cutoff_day" integer DEFAULT 15,
	"auto_scheduling_enabled" boolean DEFAULT true,
	"schedule_generation_interval" varchar DEFAULT 'weekly',
	"schedule_custom_days" integer,
	"schedule_advance_notice_days" integer DEFAULT 7,
	"schedule_day_of_week" integer DEFAULT 0,
	"schedule_day_of_month" integer,
	"invoice_biweekly_anchor" timestamp with time zone,
	"schedule_biweekly_anchor" timestamp with time zone,
	"payroll_biweekly_anchor" timestamp with time zone,
	"last_invoice_run_at" timestamp with time zone,
	"last_schedule_run_at" timestamp with time zone,
	"last_payroll_run_at" timestamp with time zone,
	"enable_daily_overtime" boolean DEFAULT false,
	"daily_overtime_threshold" numeric(5, 2) DEFAULT '8.00',
	"weekly_overtime_threshold" numeric(5, 2) DEFAULT '40.00',
	"default_billable_rate" numeric(10, 2),
	"default_hourly_rate" numeric(10, 2),
	"timezone" varchar DEFAULT 'America/New_York',
	"holiday_calendar" jsonb DEFAULT '[]',
	"overtime_billable_multiplier" numeric(5, 2) DEFAULT '1.50',
	"overtime_pay_multiplier" numeric(5, 2) DEFAULT '1.50',
	"holiday_billable_multiplier" numeric(5, 2) DEFAULT '2.00',
	"holiday_pay_multiplier" numeric(5, 2) DEFAULT '2.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "workspaces_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "workspaces_organization_serial_unique" UNIQUE("organization_serial")
);
--> statement-breakpoint
ALTER TABLE "abuse_violations" ADD CONSTRAINT "abuse_violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abuse_violations" ADD CONSTRAINT "abuse_violations_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abuse_violations" ADD CONSTRAINT "abuse_violations_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abuse_violations" ADD CONSTRAINT "abuse_violations_action_taken_by_users_id_fk" FOREIGN KEY ("action_taken_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_dismissed_by_users_id_fk" FOREIGN KEY ("dismissed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_token_wallets" ADD CONSTRAINT "ai_token_wallets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_daily_rollups" ADD CONSTRAINT "ai_usage_daily_rollups_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_addon_id_billing_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."billing_addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_suggestions" ADD CONSTRAINT "anonymous_suggestions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_suggestions" ADD CONSTRAINT "anonymous_suggestions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_suggestions" ADD CONSTRAINT "anonymous_suggestions_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_pre_inspection_by_users_id_fk" FOREIGN KEY ("pre_inspection_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_post_inspection_by_users_id_fk" FOREIGN KEY ("post_inspection_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_schedules" ADD CONSTRAINT "asset_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_usage_logs" ADD CONSTRAINT "asset_usage_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_usage_logs" ADD CONSTRAINT "asset_usage_logs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_usage_logs" ADD CONSTRAINT "asset_usage_logs_asset_schedule_id_asset_schedules_id_fk" FOREIGN KEY ("asset_schedule_id") REFERENCES "public"."asset_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_usage_logs" ADD CONSTRAINT "asset_usage_logs_operated_by_employees_id_fk" FOREIGN KEY ("operated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_usage_logs" ADD CONSTRAINT "asset_usage_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_to_client_id_clients_id_fk" FOREIGN KEY ("assigned_to_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_reports" ADD CONSTRAINT "auto_reports_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_reports" ADD CONSTRAINT "auto_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_reports" ADD CONSTRAINT "auto_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_metrics" ADD CONSTRAINT "benchmark_metrics_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_applications" ADD CONSTRAINT "bid_applications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_applications" ADD CONSTRAINT "bid_applications_bid_id_internal_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."internal_bids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_applications" ADD CONSTRAINT "bid_applications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_applications" ADD CONSTRAINT "bid_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_applications" ADD CONSTRAINT "bid_applications_intervention_by_users_id_fk" FOREIGN KEY ("intervention_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_audit_log" ADD CONSTRAINT "billing_audit_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_variances" ADD CONSTRAINT "budget_variances_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_alerts" ADD CONSTRAINT "capacity_alerts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_alerts" ADD CONSTRAINT "capacity_alerts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_alerts" ADD CONSTRAINT "capacity_alerts_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_alerts" ADD CONSTRAINT "capacity_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_agreement_acceptances" ADD CONSTRAINT "chat_agreement_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_agreement_acceptances" ADD CONSTRAINT "chat_agreement_acceptances_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_support_agent_id_users_id_fk" FOREIGN KEY ("support_agent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_associated_ticket_id_support_tickets_id_fk" FOREIGN KEY ("associated_ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_voice_granted_by_users_id_fk" FOREIGN KEY ("voice_granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_guest_tokens" ADD CONSTRAINT "chat_guest_tokens_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_guest_tokens" ADD CONSTRAINT "chat_guest_tokens_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_guest_tokens" ADD CONSTRAINT "chat_guest_tokens_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_guest_tokens" ADD CONSTRAINT "chat_guest_tokens_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_participant_id_users_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_payment_info" ADD CONSTRAINT "client_payment_info_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_payment_info" ADD CONSTRAINT "client_payment_info_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_rate_history" ADD CONSTRAINT "client_rate_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_rate_history" ADD CONSTRAINT "client_rate_history_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_rate_history" ADD CONSTRAINT "client_rate_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_rates" ADD CONSTRAINT "client_rates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_rates" ADD CONSTRAINT "client_rates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_policies" ADD CONSTRAINT "company_policies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_policies" ADD CONSTRAINT "company_policies_previous_version_id_company_policies_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."company_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_policies" ADD CONSTRAINT "company_policies_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_policies" ADD CONSTRAINT "company_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_employer_signed_by_users_id_fk" FOREIGN KEY ("employer_signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_encryption_keys" ADD CONSTRAINT "conversation_encryption_keys_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_encryption_keys" ADD CONSTRAINT "conversation_encryption_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_encryption_keys" ADD CONSTRAINT "conversation_encryption_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_variance_predictions" ADD CONSTRAINT "cost_variance_predictions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_variance_predictions" ADD CONSTRAINT "cost_variance_predictions_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_form_submissions" ADD CONSTRAINT "custom_form_submissions_form_id_custom_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."custom_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_form_submissions" ADD CONSTRAINT "custom_form_submissions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_form_submissions" ADD CONSTRAINT "custom_form_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_form_submissions" ADD CONSTRAINT "custom_form_submissions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_form_submissions" ADD CONSTRAINT "custom_form_submissions_report_submission_id_report_submissions_id_fk" FOREIGN KEY ("report_submission_id") REFERENCES "public"."report_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_forms" ADD CONSTRAINT "custom_forms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_forms" ADD CONSTRAINT "custom_forms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_rules" ADD CONSTRAINT "custom_rules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_rules" ADD CONSTRAINT "custom_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_rules" ADD CONSTRAINT "custom_rules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_report_access" ADD CONSTRAINT "customer_report_access_submission_id_report_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."report_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_report_access" ADD CONSTRAINT "customer_report_access_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_assignments" ADD CONSTRAINT "dispatch_assignments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_assignments" ADD CONSTRAINT "dispatch_assignments_incident_id_dispatch_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."dispatch_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_assignments" ADD CONSTRAINT "dispatch_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_assignments" ADD CONSTRAINT "dispatch_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_incidents" ADD CONSTRAINT "dispatch_incidents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_incidents" ADD CONSTRAINT "dispatch_incidents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_incidents" ADD CONSTRAINT "dispatch_incidents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_incidents" ADD CONSTRAINT "dispatch_incidents_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_incident_id_dispatch_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."dispatch_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_filed_by_users_id_fk" FOREIGN KEY ("filed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_access_logs" ADD CONSTRAINT "dm_access_logs_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_access_logs" ADD CONSTRAINT "dm_access_logs_audit_request_id_dm_audit_requests_id_fk" FOREIGN KEY ("audit_request_id") REFERENCES "public"."dm_audit_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_access_logs" ADD CONSTRAINT "dm_access_logs_accessed_by_users_id_fk" FOREIGN KEY ("accessed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_audit_requests" ADD CONSTRAINT "dm_audit_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_audit_requests" ADD CONSTRAINT "dm_audit_requests_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_audit_requests" ADD CONSTRAINT "dm_audit_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_audit_requests" ADD CONSTRAINT "dm_audit_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_employee_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."employee_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_accessed_by_users_id_fk" FOREIGN KEY ("accessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_availability" ADD CONSTRAINT "employee_availability_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_availability" ADD CONSTRAINT "employee_availability_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_bank_accounts" ADD CONSTRAINT "employee_bank_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_bank_accounts" ADD CONSTRAINT "employee_bank_accounts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_certifications" ADD CONSTRAINT "employee_certifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_certifications" ADD CONSTRAINT "employee_certifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_certifications" ADD CONSTRAINT "employee_certifications_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_certifications" ADD CONSTRAINT "employee_certifications_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_files" ADD CONSTRAINT "employee_files_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_files" ADD CONSTRAINT "employee_files_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_files" ADD CONSTRAINT "employee_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_health_scores" ADD CONSTRAINT "employee_health_scores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_health_scores" ADD CONSTRAINT "employee_health_scores_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_i9_records" ADD CONSTRAINT "employee_i9_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_i9_records" ADD CONSTRAINT "employee_i9_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_i9_records" ADD CONSTRAINT "employee_i9_records_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_notices" ADD CONSTRAINT "employee_notices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_notices" ADD CONSTRAINT "employee_notices_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_notices" ADD CONSTRAINT "employee_notices_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_notices" ADD CONSTRAINT "employee_notices_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_info" ADD CONSTRAINT "employee_payroll_info_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_info" ADD CONSTRAINT "employee_payroll_info_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_info" ADD CONSTRAINT "employee_payroll_info_w4_document_id_employee_files_id_fk" FOREIGN KEY ("w4_document_id") REFERENCES "public"."employee_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_info" ADD CONSTRAINT "employee_payroll_info_i9_document_id_employee_files_id_fk" FOREIGN KEY ("i9_document_id") REFERENCES "public"."employee_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_rate_history" ADD CONSTRAINT "employee_rate_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_rate_history" ADD CONSTRAINT "employee_rate_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_rate_history" ADD CONSTRAINT "employee_rate_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_recognition" ADD CONSTRAINT "employee_recognition_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_recognition" ADD CONSTRAINT "employee_recognition_recognized_employee_id_employees_id_fk" FOREIGN KEY ("recognized_employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_recognition" ADD CONSTRAINT "employee_recognition_recognized_by_employee_id_employees_id_fk" FOREIGN KEY ("recognized_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_recognition" ADD CONSTRAINT "employee_recognition_recognized_by_manager_id_employees_id_fk" FOREIGN KEY ("recognized_by_manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_recognition" ADD CONSTRAINT "employee_recognition_related_shift_id_shifts_id_fk" FOREIGN KEY ("related_shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_recognition" ADD CONSTRAINT "employee_recognition_related_client_id_clients_id_fk" FOREIGN KEY ("related_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tax_forms" ADD CONSTRAINT "employee_tax_forms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tax_forms" ADD CONSTRAINT "employee_tax_forms_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_terminations" ADD CONSTRAINT "employee_terminations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_terminations" ADD CONSTRAINT "employee_terminations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_terminations" ADD CONSTRAINT "employee_terminations_terminated_by_employees_id_fk" FOREIGN KEY ("terminated_by") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_benchmark_scores" ADD CONSTRAINT "employer_benchmark_scores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_ratings" ADD CONSTRAINT "employer_ratings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_ratings" ADD CONSTRAINT "employer_ratings_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_tickets" ADD CONSTRAINT "escalation_tickets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_tickets" ADD CONSTRAINT "escalation_tickets_requestor_id_users_id_fk" FOREIGN KEY ("requestor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_tickets" ADD CONSTRAINT "escalation_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_interview_responses" ADD CONSTRAINT "exit_interview_responses_session_id_offboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."offboarding_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reimbursed_by_users_id_fk" FOREIGN KEY ("reimbursed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_identifiers" ADD CONSTRAINT "external_identifiers_org_id_workspaces_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_locations" ADD CONSTRAINT "gps_locations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_locations" ADD CONSTRAINT "gps_locations_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_locations" ADD CONSTRAINT "gps_locations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_os_queue" ADD CONSTRAINT "help_os_queue_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_os_queue" ADD CONSTRAINT "help_os_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_os_queue" ADD CONSTRAINT "help_os_queue_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_os_queue" ADD CONSTRAINT "help_os_queue_assigned_staff_id_users_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "helpos_faqs" ADD CONSTRAINT "helpos_faqs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_sequences" ADD CONSTRAINT "id_sequences_org_id_workspaces_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_api_keys" ADD CONSTRAINT "integration_api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_api_keys" ADD CONSTRAINT "integration_api_keys_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_integration_id_integration_marketplace_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration_marketplace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_connected_by_user_id_users_id_fk" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_bids" ADD CONSTRAINT "internal_bids_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_bids" ADD CONSTRAINT "internal_bids_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_bids" ADD CONSTRAINT "internal_bids_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_bids" ADD CONSTRAINT "internal_bids_selected_employee_id_employees_id_fk" FOREIGN KEY ("selected_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_reminders" ADD CONSTRAINT "invoice_reminders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_reminders" ADD CONSTRAINT "invoice_reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_queries" ADD CONSTRAINT "knowledge_queries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_queries" ADD CONSTRAINT "knowledge_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_alert_triggers" ADD CONSTRAINT "kpi_alert_triggers_alert_id_kpi_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."kpi_alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_alert_triggers" ADD CONSTRAINT "kpi_alert_triggers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_alert_triggers" ADD CONSTRAINT "kpi_alert_triggers_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_alerts" ADD CONSTRAINT "kpi_alerts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_alerts" ADD CONSTRAINT "kpi_alerts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leader_actions" ADD CONSTRAINT "leader_actions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leader_actions" ADD CONSTRAINT "leader_actions_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leader_actions" ADD CONSTRAINT "leader_actions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_to_workspace_id_workspaces_id_fk" FOREIGN KEY ("converted_to_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_report_records" ADD CONSTRAINT "locked_report_records_submission_id_report_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."report_submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_report_records" ADD CONSTRAINT "locked_report_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_report_records" ADD CONSTRAINT "locked_report_records_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_report_records" ADD CONSTRAINT "locked_report_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_report_records" ADD CONSTRAINT "locked_report_records_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_assignments" ADD CONSTRAINT "manager_assignments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_assignments" ADD CONSTRAINT "manager_assignments_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_assignments" ADD CONSTRAINT "manager_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_snapshots" ADD CONSTRAINT "metrics_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motd_acknowledgments" ADD CONSTRAINT "motd_acknowledgments_motd_id_motd_messages_id_fk" FOREIGN KEY ("motd_id") REFERENCES "public"."motd_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motd_acknowledgments" ADD CONSTRAINT "motd_acknowledgments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motd_messages" ADD CONSTRAINT "motd_messages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motd_messages" ADD CONSTRAINT "motd_messages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_cycle_payroll_runs" ADD CONSTRAINT "off_cycle_payroll_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_cycle_payroll_runs" ADD CONSTRAINT "off_cycle_payroll_runs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_cycle_payroll_runs" ADD CONSTRAINT "off_cycle_payroll_runs_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_sessions" ADD CONSTRAINT "offboarding_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_sessions" ADD CONSTRAINT "offboarding_sessions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_sessions" ADD CONSTRAINT "offboarding_sessions_exit_interview_conducted_by_users_id_fk" FOREIGN KEY ("exit_interview_conducted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_sessions" ADD CONSTRAINT "offboarding_sessions_access_revoked_by_users_id_fk" FOREIGN KEY ("access_revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_invite_id_onboarding_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."onboarding_invites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_template_id_onboarding_workflow_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."onboarding_workflow_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_invites" ADD CONSTRAINT "onboarding_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_invites" ADD CONSTRAINT "onboarding_invites_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_invites" ADD CONSTRAINT "onboarding_invites_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_template_id_onboarding_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."onboarding_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_hr_contact_id_users_id_fk" FOREIGN KEY ("hr_contact_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_task_completions" ADD CONSTRAINT "onboarding_task_completions_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_task_completions" ADD CONSTRAINT "onboarding_task_completions_task_id_onboarding_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."onboarding_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_task_completions" ADD CONSTRAINT "onboarding_task_completions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_template_id_onboarding_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."onboarding_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_templates" ADD CONSTRAINT "onboarding_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_templates" ADD CONSTRAINT "onboarding_templates_role_template_id_role_templates_id_fk" FOREIGN KEY ("role_template_id") REFERENCES "public"."role_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_templates" ADD CONSTRAINT "onboarding_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_workflow_templates" ADD CONSTRAINT "onboarding_workflow_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_workflow_templates" ADD CONSTRAINT "onboarding_workflow_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_channels" ADD CONSTRAINT "organization_chat_channels_room_id_organization_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."organization_chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_channels" ADD CONSTRAINT "organization_chat_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_channels" ADD CONSTRAINT "organization_chat_channels_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_channels" ADD CONSTRAINT "organization_chat_channels_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_rooms" ADD CONSTRAINT "organization_chat_rooms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_rooms" ADD CONSTRAINT "organization_chat_rooms_suspended_by_users_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_rooms" ADD CONSTRAINT "organization_chat_rooms_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_rooms" ADD CONSTRAINT "organization_chat_rooms_onboarded_by_users_id_fk" FOREIGN KEY ("onboarded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_chat_rooms" ADD CONSTRAINT "organization_chat_rooms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_onboarding" ADD CONSTRAINT "organization_onboarding_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_onboarding" ADD CONSTRAINT "organization_onboarding_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_room_members" ADD CONSTRAINT "organization_room_members_room_id_organization_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."organization_chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_room_members" ADD CONSTRAINT "organization_room_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_room_members" ADD CONSTRAINT "organization_room_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_room_members" ADD CONSTRAINT "organization_room_members_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_room_onboarding" ADD CONSTRAINT "organization_room_onboarding_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_room_onboarding" ADD CONSTRAINT "organization_room_onboarding_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overage_charges" ADD CONSTRAINT "overage_charges_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overage_charges" ADD CONSTRAINT "overage_charges_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oversight_events" ADD CONSTRAINT "oversight_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oversight_events" ADD CONSTRAINT "oversight_events_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_api_usage_events" ADD CONSTRAINT "partner_api_usage_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_api_usage_events" ADD CONSTRAINT "partner_api_usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_api_usage_events" ADD CONSTRAINT "partner_api_usage_events_partner_connection_id_partner_connections_id_fk" FOREIGN KEY ("partner_connection_id") REFERENCES "public"."partner_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_connections" ADD CONSTRAINT "partner_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_connections" ADD CONSTRAINT "partner_connections_connected_by_users_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_connections" ADD CONSTRAINT "partner_connections_disconnected_by_users_id_fk" FOREIGN KEY ("disconnected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_data_mappings" ADD CONSTRAINT "partner_data_mappings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_data_mappings" ADD CONSTRAINT "partner_data_mappings_partner_connection_id_partner_connections_id_fk" FOREIGN KEY ("partner_connection_id") REFERENCES "public"."partner_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_data_mappings" ADD CONSTRAINT "partner_data_mappings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_employees_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_revenue" ADD CONSTRAINT "platform_revenue_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_policy_id_company_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."company_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_banners" ADD CONSTRAINT "promotional_banners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pto_requests" ADD CONSTRAINT "pto_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pto_requests" ADD CONSTRAINT "pto_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pto_requests" ADD CONSTRAINT "pto_requests_approver_id_employees_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_schedules" ADD CONSTRAINT "published_schedules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_schedules" ADD CONSTRAINT "published_schedules_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_survey_responses" ADD CONSTRAINT "pulse_survey_responses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_survey_responses" ADD CONSTRAINT "pulse_survey_responses_survey_template_id_pulse_survey_templates_id_fk" FOREIGN KEY ("survey_template_id") REFERENCES "public"."pulse_survey_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_survey_responses" ADD CONSTRAINT "pulse_survey_responses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_survey_templates" ADD CONSTRAINT "pulse_survey_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_survey_templates" ADD CONSTRAINT "pulse_survey_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_approval_steps" ADD CONSTRAINT "report_approval_steps_submission_id_report_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."report_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_approval_steps" ADD CONSTRAINT "report_approval_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_approval_steps" ADD CONSTRAINT "report_approval_steps_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_approval_steps" ADD CONSTRAINT "report_approval_steps_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_submission_id_report_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."report_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_submissions" ADD CONSTRAINT "report_submissions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_submissions" ADD CONSTRAINT "report_submissions_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_submissions" ADD CONSTRAINT "report_submissions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_submissions" ADD CONSTRAINT "report_submissions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_submissions" ADD CONSTRAINT "report_submissions_reviewed_by_employees_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_workflow_configs" ADD CONSTRAINT "report_workflow_configs_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_workflow_configs" ADD CONSTRAINT "report_workflow_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfps" ADD CONSTRAINT "rfps_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_capabilities" ADD CONSTRAINT "role_capabilities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_templates" ADD CONSTRAINT "role_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_templates" ADD CONSTRAINT "role_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_execution_logs" ADD CONSTRAINT "rule_execution_logs_rule_id_custom_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."custom_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_execution_logs" ADD CONSTRAINT "rule_execution_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_sends" ADD CONSTRAINT "sequence_sends_sequence_id_email_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."email_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_sends" ADD CONSTRAINT "sequence_sends_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_sends" ADD CONSTRAINT "sequence_sends_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_coverage_requests" ADD CONSTRAINT "service_coverage_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_coverage_requests" ADD CONSTRAINT "service_coverage_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_coverage_requests" ADD CONSTRAINT "service_coverage_requests_ai_usage_log_id_workspace_ai_usage_id_fk" FOREIGN KEY ("ai_usage_log_id") REFERENCES "public"."workspace_ai_usage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_coverage_requests" ADD CONSTRAINT "service_coverage_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_acknowledgments" ADD CONSTRAINT "shift_acknowledgments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_acknowledgments" ADD CONSTRAINT "shift_acknowledgments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_acknowledgments" ADD CONSTRAINT "shift_acknowledgments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_acknowledgments" ADD CONSTRAINT "shift_acknowledgments_acknowledged_by_employees_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_acknowledgments" ADD CONSTRAINT "shift_acknowledgments_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_actions" ADD CONSTRAINT "shift_actions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_actions" ADD CONSTRAINT "shift_actions_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_actions" ADD CONSTRAINT "shift_actions_requested_by_employees_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_actions" ADD CONSTRAINT "shift_actions_target_employee_id_employees_id_fk" FOREIGN KEY ("target_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_actions" ADD CONSTRAINT "shift_actions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_actions" ADD CONSTRAINT "shift_actions_replacement_shift_id_shifts_id_fk" FOREIGN KEY ("replacement_shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_order_acknowledgments" ADD CONSTRAINT "shift_order_acknowledgments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_order_acknowledgments" ADD CONSTRAINT "shift_order_acknowledgments_shift_order_id_shift_orders_id_fk" FOREIGN KEY ("shift_order_id") REFERENCES "public"."shift_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_order_acknowledgments" ADD CONSTRAINT "shift_order_acknowledgments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_orders" ADD CONSTRAINT "shift_orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_orders" ADD CONSTRAINT "shift_orders_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_orders" ADD CONSTRAINT "shift_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gap_analyses" ADD CONSTRAINT "skill_gap_analyses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gap_analyses" ADD CONSTRAINT "skill_gap_analyses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gap_analyses" ADD CONSTRAINT "skill_gap_analyses_target_role_id_role_templates_id_fk" FOREIGN KEY ("target_role_id") REFERENCES "public"."role_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_schedule_usage" ADD CONSTRAINT "smart_schedule_usage_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_line_items" ADD CONSTRAINT "subscription_line_items_invoice_id_subscription_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."subscription_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_line_items" ADD CONSTRAINT "subscription_line_items_addon_id_billing_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."billing_addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_invoice_id_subscription_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."subscription_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_registry" ADD CONSTRAINT "support_registry_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_rooms" ADD CONSTRAINT "support_rooms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_rooms" ADD CONSTRAINT "support_rooms_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_rooms" ADD CONSTRAINT "support_rooms_status_changed_by_users_id_fk" FOREIGN KEY ("status_changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_rooms" ADD CONSTRAINT "support_rooms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_access" ADD CONSTRAINT "support_ticket_access_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_access" ADD CONSTRAINT "support_ticket_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_access" ADD CONSTRAINT "support_ticket_access_room_id_support_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."support_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_access" ADD CONSTRAINT "support_ticket_access_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_access" ADD CONSTRAINT "support_ticket_access_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_report_submission_id_report_submissions_id_fk" FOREIGN KEY ("report_submission_id") REFERENCES "public"."report_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_escalated_by_users_id_fk" FOREIGN KEY ("escalated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_platform_assigned_to_users_id_fk" FOREIGN KEY ("platform_assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acknowledgments" ADD CONSTRAINT "terms_acknowledgments_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acknowledgments" ADD CONSTRAINT "terms_acknowledgments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acknowledgments" ADD CONSTRAINT "terms_acknowledgments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_approval_audit" ADD CONSTRAINT "time_entry_approval_audit_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_approval_audit" ADD CONSTRAINT "time_entry_approval_audit_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_approval_audit" ADD CONSTRAINT "time_entry_approval_audit_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_discrepancies" ADD CONSTRAINT "time_entry_discrepancies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_discrepancies" ADD CONSTRAINT "time_entry_discrepancies_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_discrepancies" ADD CONSTRAINT "time_entry_discrepancies_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_discrepancies" ADD CONSTRAINT "time_entry_discrepancies_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_edit_requests" ADD CONSTRAINT "timesheet_edit_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_edit_requests" ADD CONSTRAINT "timesheet_edit_requests_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_edit_requests" ADD CONSTRAINT "timesheet_edit_requests_requested_by_employees_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_edit_requests" ADD CONSTRAINT "timesheet_edit_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_edit_requests" ADD CONSTRAINT "timesheet_edit_requests_applied_by_users_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tombstones" ADD CONSTRAINT "tombstones_org_id_workspaces_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tombstones" ADD CONSTRAINT "tombstones_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certifications" ADD CONSTRAINT "training_certifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certifications" ADD CONSTRAINT "training_certifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certifications" ADD CONSTRAINT "training_certifications_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certifications" ADD CONSTRAINT "training_certifications_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_enrolled_by_users_id_fk" FOREIGN KEY ("enrolled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnover_risk_scores" ADD CONSTRAINT "turnover_risk_scores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnover_risk_scores" ADD CONSTRAINT "turnover_risk_scores_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_statuses" ADD CONSTRAINT "unit_statuses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_statuses" ADD CONSTRAINT "unit_statuses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_statuses" ADD CONSTRAINT "unit_statuses_current_incident_id_dispatch_incidents_id_fk" FOREIGN KEY ("current_incident_id") REFERENCES "public"."dispatch_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_statuses" ADD CONSTRAINT "unit_statuses_current_shift_id_shifts_id_fk" FOREIGN KEY ("current_shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_id_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."webhook_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_addons" ADD CONSTRAINT "workspace_addons_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_addons" ADD CONSTRAINT "workspace_addons_addon_id_billing_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."billing_addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_addons" ADD CONSTRAINT "workspace_addons_purchased_by_users_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_addons" ADD CONSTRAINT "workspace_addons_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_ai_usage" ADD CONSTRAINT "workspace_ai_usage_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_ai_usage" ADD CONSTRAINT "workspace_ai_usage_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_rate_history" ADD CONSTRAINT "workspace_rate_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_rate_history" ADD CONSTRAINT "workspace_rate_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_themes" ADD CONSTRAINT "workspace_themes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_insights_workspace_idx" ON "ai_insights" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "ai_insights_category_idx" ON "ai_insights" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ai_insights_priority_idx" ON "ai_insights" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "ai_insights_status_idx" ON "ai_insights" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_rollups_workspace_idx" ON "ai_usage_daily_rollups" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "ai_rollups_date_idx" ON "ai_usage_daily_rollups" USING btree ("usage_date");--> statement-breakpoint
CREATE INDEX "ai_rollups_feature_idx" ON "ai_usage_daily_rollups" USING btree ("feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_workspace_date_feature" ON "ai_usage_daily_rollups" USING btree ("workspace_id","usage_date","feature_key");--> statement-breakpoint
CREATE INDEX "ai_usage_workspace_idx" ON "ai_usage_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "ai_usage_user_idx" ON "ai_usage_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_feature_idx" ON "ai_usage_events" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_session_idx" ON "ai_usage_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "suggestions_workspace_status_idx" ON "anonymous_suggestions" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "suggestions_category_urgency_idx" ON "anonymous_suggestions" USING btree ("category","urgency_level");--> statement-breakpoint
CREATE INDEX "asset_schedules_asset_time_idx" ON "asset_schedules" USING btree ("asset_id","start_time");--> statement-breakpoint
CREATE INDEX "asset_schedules_shift_idx" ON "asset_schedules" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "asset_schedules_conflict_idx" ON "asset_schedules" USING btree ("has_conflict");--> statement-breakpoint
CREATE INDEX "asset_usage_logs_asset_period_idx" ON "asset_usage_logs" USING btree ("asset_id","usage_period_start");--> statement-breakpoint
CREATE INDEX "asset_usage_logs_client_idx" ON "asset_usage_logs" USING btree ("client_id","billing_status");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_workspace_number_idx" ON "assets" USING btree ("workspace_id","asset_number");--> statement-breakpoint
CREATE INDEX "assets_status_idx" ON "assets" USING btree ("status","is_schedulable");--> statement-breakpoint
CREATE INDEX "assets_maintenance_idx" ON "assets" USING btree ("next_maintenance_date");--> statement-breakpoint
CREATE INDEX "idx_audit_workspace_created" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_user_created" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action_created" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_command_id" ON "audit_logs" USING btree ("command_id");--> statement-breakpoint
CREATE INDEX "idx_audit_target" ON "audit_logs" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "audit_trail_entity_idx" ON "audit_trail" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_trail_workspace_idx" ON "audit_trail" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "auto_reports_user_idx" ON "auto_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auto_reports_period_idx" ON "auto_reports" USING btree ("period");--> statement-breakpoint
CREATE INDEX "auto_reports_status_idx" ON "auto_reports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bid_applications_bid_employee_idx" ON "bid_applications" USING btree ("bid_id","employee_id");--> statement-breakpoint
CREATE INDEX "bid_applications_employee_status_idx" ON "bid_applications" USING btree ("employee_id","status");--> statement-breakpoint
CREATE INDEX "billing_audit_workspace_idx" ON "billing_audit_log" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "billing_audit_event_type_idx" ON "billing_audit_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "billing_audit_category_idx" ON "billing_audit_log" USING btree ("event_category");--> statement-breakpoint
CREATE INDEX "billing_audit_actor_idx" ON "billing_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "billing_audit_created_at_idx" ON "billing_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "budget_variances_month_idx" ON "budget_variances" USING btree ("budget_id","year","month");--> statement-breakpoint
CREATE INDEX "capacity_alerts_employee_idx" ON "capacity_alerts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "capacity_alerts_status_idx" ON "capacity_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "capacity_alerts_week_idx" ON "capacity_alerts" USING btree ("week_start_date");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "chat_messages_thread_idx" ON "chat_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "chat_messages_parent_idx" ON "chat_messages" USING btree ("parent_message_id");--> statement-breakpoint
CREATE INDEX "client_payment_info_workspace_idx" ON "client_payment_info" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "client_payment_info_client_idx" ON "client_payment_info" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_payment_info_stripe_idx" ON "client_payment_info" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "client_rate_history_workspace_idx" ON "client_rate_history" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "client_rate_history_client_idx" ON "client_rate_history" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_rate_history_valid_from_idx" ON "client_rate_history" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "client_rate_history_valid_to_idx" ON "client_rate_history" USING btree ("valid_to");--> statement-breakpoint
CREATE INDEX "client_rate_history_active_idx" ON "client_rate_history" USING btree ("client_id","valid_to");--> statement-breakpoint
CREATE INDEX "policies_workspace_idx" ON "company_policies" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "policies_status_idx" ON "company_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contract_documents_workspace_idx" ON "contract_documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "contract_documents_employee_idx" ON "contract_documents" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "contract_documents_type_idx" ON "contract_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "contract_documents_completed_idx" ON "contract_documents" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "contract_documents_required_idx" ON "contract_documents" USING btree ("is_required","must_complete_before_work");--> statement-breakpoint
CREATE INDEX "dispatch_assignments_workspace_idx" ON "dispatch_assignments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "dispatch_assignments_incident_idx" ON "dispatch_assignments" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "dispatch_assignments_employee_idx" ON "dispatch_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "dispatch_assignments_status_idx" ON "dispatch_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dispatch_assignments_unit_idx" ON "dispatch_assignments" USING btree ("unit_number");--> statement-breakpoint
CREATE INDEX "dispatch_assignments_created_at_idx" ON "dispatch_assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dispatch_incidents_workspace_idx" ON "dispatch_incidents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "dispatch_incidents_status_idx" ON "dispatch_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dispatch_incidents_priority_idx" ON "dispatch_incidents" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "dispatch_incidents_number_idx" ON "dispatch_incidents" USING btree ("incident_number");--> statement-breakpoint
CREATE INDEX "dispatch_incidents_client_idx" ON "dispatch_incidents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "dispatch_incidents_created_at_idx" ON "dispatch_incidents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dispatch_incidents_call_received_idx" ON "dispatch_incidents" USING btree ("call_received_at");--> statement-breakpoint
CREATE INDEX "dispatch_logs_workspace_idx" ON "dispatch_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "dispatch_logs_incident_idx" ON "dispatch_logs" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "dispatch_logs_employee_idx" ON "dispatch_logs" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "dispatch_logs_action_idx" ON "dispatch_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "dispatch_logs_timestamp_idx" ON "dispatch_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "disputes_filed_by_idx" ON "disputes" USING btree ("filed_by");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "disputes_type_idx" ON "disputes" USING btree ("dispute_type");--> statement-breakpoint
CREATE INDEX "disputes_target_idx" ON "disputes" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "disputes_assigned_to_idx" ON "disputes" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "disputes_workspace_status_idx" ON "disputes" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_document_access_document" ON "document_access_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_document_access_user" ON "document_access_logs" USING btree ("accessed_by");--> statement-breakpoint
CREATE INDEX "idx_document_access_time" ON "document_access_logs" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "employee_availability_workspace_idx" ON "employee_availability" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "employee_availability_employee_idx" ON "employee_availability" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_availability_day_idx" ON "employee_availability" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "idx_employee_documents_employee" ON "employee_documents" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_employee_documents_type" ON "employee_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_employee_documents_status" ON "employee_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_employee_documents_expiration" ON "employee_documents" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "health_scores_employee_period_idx" ON "employee_health_scores" USING btree ("employee_id","period_end");--> statement-breakpoint
CREATE INDEX "health_scores_risk_level_idx" ON "employee_health_scores" USING btree ("workspace_id","risk_level","requires_manager_action");--> statement-breakpoint
CREATE INDEX "health_scores_action_queue_idx" ON "employee_health_scores" USING btree ("requires_manager_action","manager_notified");--> statement-breakpoint
CREATE INDEX "i9_records_employee_idx" ON "employee_i9_records" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "i9_records_expiration_idx" ON "employee_i9_records" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "i9_records_status_idx" ON "employee_i9_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_payroll_info_workspace_idx" ON "employee_payroll_info" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "employee_payroll_info_employee_idx" ON "employee_payroll_info" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_rate_history_workspace_idx" ON "employee_rate_history" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "employee_rate_history_employee_idx" ON "employee_rate_history" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_rate_history_valid_from_idx" ON "employee_rate_history" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "employee_rate_history_valid_to_idx" ON "employee_rate_history" USING btree ("valid_to");--> statement-breakpoint
CREATE INDEX "employee_rate_history_active_idx" ON "employee_rate_history" USING btree ("employee_id","valid_to");--> statement-breakpoint
CREATE INDEX "employer_benchmarks_workspace_type_idx" ON "employer_benchmark_scores" USING btree ("workspace_id","benchmark_type");--> statement-breakpoint
CREATE INDEX "employer_benchmarks_target_period_idx" ON "employer_benchmark_scores" USING btree ("target_id","period_end");--> statement-breakpoint
CREATE INDEX "employer_benchmarks_score_rank_idx" ON "employer_benchmark_scores" USING btree ("overall_score","percentile_rank");--> statement-breakpoint
CREATE INDEX "employer_ratings_workspace_type_idx" ON "employer_ratings" USING btree ("workspace_id","rating_type");--> statement-breakpoint
CREATE INDEX "employer_ratings_target_idx" ON "employer_ratings" USING btree ("target_id","submitted_at");--> statement-breakpoint
CREATE INDEX "employer_ratings_score_idx" ON "employer_ratings" USING btree ("workspace_id","overall_score");--> statement-breakpoint
CREATE INDEX "idx_escalation_workspace" ON "escalation_tickets" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_escalation_assigned" ON "escalation_tickets" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "expense_receipts_expense_idx" ON "expense_receipts" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "expenses_employee_idx" ON "expenses" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "expenses_status_idx" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "external_identifiers_entity_idx" ON "external_identifiers" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "external_identifiers_external_id_idx" ON "external_identifiers" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "external_identifiers_org_idx" ON "external_identifiers" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_identifiers_entity_primary_idx" ON "external_identifiers" USING btree ("entity_type","entity_id","is_primary");--> statement-breakpoint
CREATE INDEX "gps_locations_workspace_idx" ON "gps_locations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "gps_locations_employee_idx" ON "gps_locations" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "gps_locations_timestamp_idx" ON "gps_locations" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "id_sequences_org_kind_idx" ON "id_sequences" USING btree ("org_id","kind");--> statement-breakpoint
CREATE INDEX "idempotency_keys_workspace_idx" ON "idempotency_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idempotency_keys_operation_idx" ON "idempotency_keys" USING btree ("operation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_fingerprint_idx" ON "idempotency_keys" USING btree ("workspace_id","operation_type","request_fingerprint");--> statement-breakpoint
CREATE INDEX "idempotency_keys_expires_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "integration_api_keys_workspace_active_idx" ON "integration_api_keys" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_api_keys_key_hash_idx" ON "integration_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "integration_connections_workspace_integration_idx" ON "integration_connections" USING btree ("workspace_id","integration_id");--> statement-breakpoint
CREATE INDEX "integration_connections_active_health_idx" ON "integration_connections" USING btree ("is_active","is_healthy");--> statement-breakpoint
CREATE INDEX "integration_connections_next_sync_idx" ON "integration_connections" USING btree ("next_sync_at","is_active");--> statement-breakpoint
CREATE INDEX "integration_marketplace_category_slug_idx" ON "integration_marketplace" USING btree ("category","slug");--> statement-breakpoint
CREATE INDEX "integration_marketplace_certified_active_idx" ON "integration_marketplace" USING btree ("is_certified","is_active");--> statement-breakpoint
CREATE INDEX "integration_marketplace_install_count_idx" ON "integration_marketplace" USING btree ("install_count");--> statement-breakpoint
CREATE INDEX "internal_bids_workspace_status_idx" ON "internal_bids" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "internal_bids_deadline_idx" ON "internal_bids" USING btree ("application_deadline");--> statement-breakpoint
CREATE INDEX "invoice_payments_workspace_idx" ON "invoice_payments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invoice_payments_invoice_idx" ON "invoice_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_payments_status_idx" ON "invoice_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_payments_stripe_intent_idx" ON "invoice_payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "knowledge_articles_category_idx" ON "knowledge_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "knowledge_articles_workspace_idx" ON "knowledge_articles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_queries_user_idx" ON "knowledge_queries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_queries_created_idx" ON "knowledge_queries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_leader_workspace_created" ON "leader_actions" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_leader_user_created" ON "leader_actions" USING btree ("leader_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_leader_action_type" ON "leader_actions" USING btree ("action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_manager_employee" ON "manager_assignments" USING btree ("manager_id","employee_id");--> statement-breakpoint
CREATE INDEX "message_reactions_message_user_idx" ON "message_reactions" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_reactions_unique" ON "message_reactions" USING btree ("message_id","user_id","emoji");--> statement-breakpoint
CREATE UNIQUE INDEX "message_read_receipts_unique" ON "message_read_receipts" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "metrics_snapshots_workspace_idx" ON "metrics_snapshots" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "metrics_snapshots_date_idx" ON "metrics_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "metrics_snapshots_period_idx" ON "metrics_snapshots" USING btree ("period");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_workspace_idx" ON "notifications" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "oauth_states_workspace_idx" ON "oauth_states" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "oauth_states_partner_idx" ON "oauth_states" USING btree ("partner_type");--> statement-breakpoint
CREATE INDEX "oauth_states_state_idx" ON "oauth_states" USING btree ("state");--> statement-breakpoint
CREATE INDEX "oauth_states_expiry_idx" ON "oauth_states" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_onboarding_checklist_employee" ON "onboarding_checklists" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_onboarding_checklist_application" ON "onboarding_checklists" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "org_chat_channels_room_idx" ON "organization_chat_channels" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "org_chat_channels_workspace_idx" ON "organization_chat_channels" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_chat_channels_slug_idx" ON "organization_chat_channels" USING btree ("room_id","channel_slug");--> statement-breakpoint
CREATE INDEX "org_chat_rooms_workspace_idx" ON "organization_chat_rooms" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "org_chat_rooms_status_idx" ON "organization_chat_rooms" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "org_chat_rooms_slug_idx" ON "organization_chat_rooms" USING btree ("workspace_id","room_slug");--> statement-breakpoint
CREATE INDEX "organization_onboarding_workspace_idx" ON "organization_onboarding" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "organization_onboarding_completed_idx" ON "organization_onboarding" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "org_room_members_room_idx" ON "organization_room_members" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "org_room_members_user_idx" ON "organization_room_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "org_room_members_workspace_idx" ON "organization_room_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_room_members_unique_idx" ON "organization_room_members" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "org_room_onboarding_workspace_idx" ON "organization_room_onboarding" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "org_room_onboarding_completed_idx" ON "organization_room_onboarding" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "oversight_events_workspace_idx" ON "oversight_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "oversight_events_status_idx" ON "oversight_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "oversight_events_entity_idx" ON "oversight_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "oversight_events_workspace_status_idx" ON "oversight_events" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "oversight_events_detected_at_idx" ON "oversight_events" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "oversight_events_pending_queue_idx" ON "oversight_events" USING btree ("workspace_id","status","detected_at");--> statement-breakpoint
CREATE INDEX "partner_api_usage_workspace_idx" ON "partner_api_usage_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "partner_api_usage_user_idx" ON "partner_api_usage_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "partner_api_usage_partner_idx" ON "partner_api_usage_events" USING btree ("partner_type");--> statement-breakpoint
CREATE INDEX "partner_api_usage_connection_idx" ON "partner_api_usage_events" USING btree ("partner_connection_id");--> statement-breakpoint
CREATE INDEX "partner_api_usage_feature_idx" ON "partner_api_usage_events" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "partner_api_usage_created_at_idx" ON "partner_api_usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "partner_api_usage_success_idx" ON "partner_api_usage_events" USING btree ("success");--> statement-breakpoint
CREATE INDEX "partner_connections_workspace_idx" ON "partner_connections" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "partner_connections_partner_idx" ON "partner_connections" USING btree ("partner_type");--> statement-breakpoint
CREATE INDEX "partner_connections_status_idx" ON "partner_connections" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_workspace_partner" ON "partner_connections" USING btree ("workspace_id","partner_type");--> statement-breakpoint
CREATE INDEX "partner_mappings_workspace_idx" ON "partner_data_mappings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "partner_mappings_partner_idx" ON "partner_data_mappings" USING btree ("partner_type");--> statement-breakpoint
CREATE INDEX "partner_mappings_connection_idx" ON "partner_data_mappings" USING btree ("partner_connection_id");--> statement-breakpoint
CREATE INDEX "partner_mappings_entity_type_idx" ON "partner_data_mappings" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "partner_mappings_autoforce_idx" ON "partner_data_mappings" USING btree ("autoforce_entity_id");--> statement-breakpoint
CREATE INDEX "partner_mappings_partner_entity_idx" ON "partner_data_mappings" USING btree ("partner_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_partner_mapping" ON "partner_data_mappings" USING btree ("workspace_id","partner_type","entity_type","autoforce_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_platform_role" ON "platform_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "policy_acks_policy_employee_idx" ON "policy_acknowledgments" USING btree ("policy_id","employee_id");--> statement-breakpoint
CREATE INDEX "policy_acks_employee_idx" ON "policy_acknowledgments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "promotional_banners_active_idx" ON "promotional_banners" USING btree ("is_active","priority");--> statement-breakpoint
CREATE INDEX "pulse_responses_survey_employee_idx" ON "pulse_survey_responses" USING btree ("survey_template_id","employee_id");--> statement-breakpoint
CREATE INDEX "pulse_responses_sentiment_idx" ON "pulse_survey_responses" USING btree ("workspace_id","sentiment_label");--> statement-breakpoint
CREATE INDEX "pulse_responses_engagement_idx" ON "pulse_survey_responses" USING btree ("workspace_id","engagement_score");--> statement-breakpoint
CREATE INDEX "pulse_survey_templates_workspace_active_idx" ON "pulse_survey_templates" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_workspace_role_capability" ON "role_capabilities" USING btree ("workspace_id","workspace_role","capability");--> statement-breakpoint
CREATE INDEX "role_templates_workspace_role_idx" ON "role_templates" USING btree ("workspace_id","role_name");--> statement-breakpoint
CREATE INDEX "role_templates_level_idx" ON "role_templates" USING btree ("role_level");--> statement-breakpoint
CREATE INDEX "search_queries_workspace_idx" ON "search_queries" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "search_queries_user_idx" ON "search_queries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_queries_type_idx" ON "search_queries" USING btree ("search_type");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "shift_actions_workspace_idx" ON "shift_actions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "shift_actions_shift_idx" ON "shift_actions" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "shift_actions_requested_by_idx" ON "shift_actions" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "shift_actions_status_idx" ON "shift_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shift_actions_action_type_idx" ON "shift_actions" USING btree ("action_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_acknowledgment" ON "shift_order_acknowledgments" USING btree ("shift_order_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_gap_analyses_employee_target_idx" ON "skill_gap_analyses" USING btree ("employee_id","target_role_id");--> statement-breakpoint
CREATE INDEX "skill_gap_analyses_readiness_idx" ON "skill_gap_analyses" USING btree ("readiness_score");--> statement-breakpoint
CREATE INDEX "subscription_invoices_workspace_idx" ON "subscription_invoices" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "subscription_invoices_status_idx" ON "subscription_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_invoices_due_date_idx" ON "subscription_invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "subscription_invoices_created_at_idx" ON "subscription_invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subscription_invoices_stripe_idx" ON "subscription_invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "subscription_line_items_invoice_idx" ON "subscription_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "subscription_line_items_type_idx" ON "subscription_line_items" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "subscription_line_items_addon_idx" ON "subscription_line_items" USING btree ("addon_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_workspace_idx" ON "subscription_payments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_invoice_idx" ON "subscription_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_payments_stripe_idx" ON "subscription_payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_created_at_idx" ON "subscription_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "time_off_requests_workspace_idx" ON "time_off_requests" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "time_off_requests_employee_idx" ON "time_off_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "time_off_requests_status_idx" ON "time_off_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "time_off_requests_date_range_idx" ON "time_off_requests" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "timesheet_edit_requests_workspace_idx" ON "timesheet_edit_requests" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "timesheet_edit_requests_time_entry_idx" ON "timesheet_edit_requests" USING btree ("time_entry_id");--> statement-breakpoint
CREATE INDEX "timesheet_edit_requests_requested_by_idx" ON "timesheet_edit_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "timesheet_edit_requests_status_idx" ON "timesheet_edit_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tombstones_entity_idx" ON "tombstones" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "tombstones_org_idx" ON "tombstones" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tombstones_deleted_by_idx" ON "tombstones" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "training_certifications_employee_idx" ON "training_certifications" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "training_certifications_expiry_idx" ON "training_certifications" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "training_certifications_status_idx" ON "training_certifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_enrollments_employee_idx" ON "training_enrollments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "training_enrollments_status_idx" ON "training_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_enrollments_expires_idx" ON "training_enrollments" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_employee_current_prediction" ON "turnover_risk_scores" USING btree ("employee_id","analysis_date");--> statement-breakpoint
CREATE INDEX "unit_statuses_workspace_idx" ON "unit_statuses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "unit_statuses_employee_idx" ON "unit_statuses" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "unit_statuses_status_idx" ON "unit_statuses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "unit_statuses_unit_number_idx" ON "unit_statuses" USING btree ("unit_number");--> statement-breakpoint
CREATE INDEX "unit_statuses_incident_idx" ON "unit_statuses" USING btree ("current_incident_id");--> statement-breakpoint
CREATE INDEX "unit_statuses_zone_idx" ON "unit_statuses" USING btree ("assigned_zone");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_subscription_status_idx" ON "webhook_deliveries" USING btree ("subscription_id","status");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_event_type_idx" ON "webhook_deliveries" USING btree ("event_type","event_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_retry_queue_idx" ON "webhook_deliveries" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_workspace_idx" ON "webhook_deliveries" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_subscriptions_workspace_active_idx" ON "webhook_subscriptions" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE INDEX "webhook_subscriptions_event_idx" ON "webhook_subscriptions" USING btree ("events");--> statement-breakpoint
CREATE INDEX "webhook_subscriptions_health_idx" ON "webhook_subscriptions" USING btree ("is_healthy","consecutive_failures");--> statement-breakpoint
CREATE INDEX "workspace_addons_workspace_idx" ON "workspace_addons" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_addons_addon_idx" ON "workspace_addons" USING btree ("addon_id");--> statement-breakpoint
CREATE INDEX "workspace_addons_status_idx" ON "workspace_addons" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_workspace_addon" ON "workspace_addons" USING btree ("workspace_id","addon_id");--> statement-breakpoint
CREATE INDEX "workspace_rate_history_workspace_idx" ON "workspace_rate_history" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_rate_history_valid_from_idx" ON "workspace_rate_history" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "workspace_rate_history_valid_to_idx" ON "workspace_rate_history" USING btree ("valid_to");--> statement-breakpoint
CREATE INDEX "workspace_rate_history_active_idx" ON "workspace_rate_history" USING btree ("workspace_id","valid_to");