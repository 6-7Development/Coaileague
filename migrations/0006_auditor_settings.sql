-- Auditor settings — per-auditor preferences (optionally workspace-scoped).
-- Closes the wiring gap where auditors had no persistence layer for any
-- per-auditor configuration. Compound unique on (auditor_id, workspace_id);
-- workspace_id IS NULL means "global default for this auditor".

CREATE TABLE IF NOT EXISTS auditor_settings (
  id                                 VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  auditor_id                         VARCHAR     NOT NULL,
  workspace_id                       VARCHAR,

  email_notifications                BOOLEAN     NOT NULL DEFAULT TRUE,
  sms_notifications                  BOOLEAN     NOT NULL DEFAULT FALSE,
  notify_on_document_uploaded        BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_on_compliance_score_change  BOOLEAN     NOT NULL DEFAULT TRUE,
  compliance_alert_threshold         INTEGER     NOT NULL DEFAULT 70,

  dashboard_layout                   VARCHAR(32) NOT NULL DEFAULT 'default',
  default_export_format              VARCHAR(16) NOT NULL DEFAULT 'pdf',
  default_date_range_days            INTEGER     NOT NULL DEFAULT 30,

  preferences                        JSONB       DEFAULT '{}'::jsonb,

  created_at                         TIMESTAMP   DEFAULT NOW(),
  updated_at                         TIMESTAMP   DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_auditor_settings_auditor_workspace
  ON auditor_settings (auditor_id, workspace_id);

CREATE INDEX IF NOT EXISTS idx_auditor_settings_auditor
  ON auditor_settings (auditor_id);
