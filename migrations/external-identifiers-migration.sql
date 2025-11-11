-- External Identifier System Migration
-- Generated from Drizzle Kit schema analysis
-- Safe to execute: Creates only new tables, never modifies existing ones

-- Step 1: Create ENUMs
DO $$ BEGIN
  CREATE TYPE "public"."external_id_entity_type" AS ENUM('org', 'employee', 'user', 'support', 'client');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."id_sequence_kind" AS ENUM('employee', 'ticket', 'client');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Create external_identifiers table
CREATE TABLE IF NOT EXISTS "external_identifiers" (
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

-- Step 3: Create id_sequences table
CREATE TABLE IF NOT EXISTS "id_sequences" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" varchar NOT NULL,
  "kind" "id_sequence_kind" NOT NULL,
  "next_val" integer DEFAULT 1 NOT NULL,
  "updated_at" timestamp DEFAULT now()
);

-- Step 4: Create support_registry table
CREATE TABLE IF NOT EXISTS "support_registry" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "support_code" varchar NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "support_registry_support_code_unique" UNIQUE("support_code")
);

-- Step 5: Create tombstones table
CREATE TABLE IF NOT EXISTS "tombstones" (
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

-- Step 6: Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "external_identifiers" ADD CONSTRAINT "external_identifiers_org_id_workspaces_id_fk" 
    FOREIGN KEY ("org_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "id_sequences" ADD CONSTRAINT "id_sequences_org_id_workspaces_id_fk" 
    FOREIGN KEY ("org_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_registry" ADD CONSTRAINT "support_registry_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tombstones" ADD CONSTRAINT "tombstones_org_id_workspaces_id_fk" 
    FOREIGN KEY ("org_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tombstones" ADD CONSTRAINT "tombstones_deleted_by_user_id_users_id_fk" 
    FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS "external_identifiers_entity_idx" ON "external_identifiers" USING btree ("entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "external_identifiers_external_id_idx" ON "external_identifiers" USING btree ("external_id");
CREATE INDEX IF NOT EXISTS "external_identifiers_org_idx" ON "external_identifiers" USING btree ("org_id");
CREATE UNIQUE INDEX IF NOT EXISTS "external_identifiers_entity_primary_idx" ON "external_identifiers" USING btree ("entity_type","entity_id","is_primary");
CREATE UNIQUE INDEX IF NOT EXISTS "id_sequences_org_kind_idx" ON "id_sequences" USING btree ("org_id","kind");
CREATE INDEX IF NOT EXISTS "tombstones_entity_idx" ON "tombstones" USING btree ("entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "tombstones_org_idx" ON "tombstones" USING btree ("org_id");
CREATE INDEX IF NOT EXISTS "tombstones_deleted_by_idx" ON "tombstones" USING btree ("deleted_by_user_id");

-- Migration complete!
