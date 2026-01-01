import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function ensureRequiredTables(): Promise<void> {
  console.log('[DbMigration] Checking for required tables...');
  
  try {
    // Check if external_id_entity_type enum exists
    const enumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'external_id_entity_type'
      ) as exists
    `);
    
    if (!enumExists.rows[0]?.exists) {
      console.log('[DbMigration] Creating external_id_entity_type enum...');
      await db.execute(sql`
        CREATE TYPE external_id_entity_type AS ENUM ('org', 'employee', 'ticket', 'client')
      `);
    }
    
    // Check if id_sequence_kind enum exists
    const seqEnumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'id_sequence_kind'
      ) as exists
    `);
    
    if (!seqEnumExists.rows[0]?.exists) {
      console.log('[DbMigration] Creating id_sequence_kind enum...');
      await db.execute(sql`
        CREATE TYPE id_sequence_kind AS ENUM ('employee', 'ticket', 'client')
      `);
    }
    
    // Check if external_identifiers table exists
    const extIdTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'external_identifiers'
      ) as exists
    `);
    
    if (!extIdTableExists.rows[0]?.exists) {
      console.log('[DbMigration] Creating external_identifiers table...');
      await db.execute(sql`
        CREATE TABLE external_identifiers (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type external_id_entity_type NOT NULL,
          entity_id VARCHAR NOT NULL,
          external_id VARCHAR NOT NULL UNIQUE,
          org_id VARCHAR REFERENCES workspaces(id) ON DELETE CASCADE,
          is_primary BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('[DbMigration] ✅ Created external_identifiers table');
    }
    
    // Check if id_sequences table exists
    const seqTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'id_sequences'
      ) as exists
    `);
    
    if (!seqTableExists.rows[0]?.exists) {
      console.log('[DbMigration] Creating id_sequences table...');
      await db.execute(sql`
        CREATE TABLE id_sequences (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id VARCHAR NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          kind id_sequence_kind NOT NULL,
          next_val INTEGER NOT NULL DEFAULT 1,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Create unique index
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS id_sequences_org_kind_idx ON id_sequences(org_id, kind)
      `);
      console.log('[DbMigration] ✅ Created id_sequences table');
    }
    
    // Check if expense_categories table exists
    const expCatTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'expense_categories'
      ) as exists
    `);
    
    if (!expCatTableExists.rows[0]?.exists) {
      console.log('[DbMigration] Creating expense_categories table...');
      await db.execute(sql`
        CREATE TABLE expense_categories (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id VARCHAR NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          name VARCHAR NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('[DbMigration] ✅ Created expense_categories table');
    }
    
    console.log('[DbMigration] ✅ All required tables verified');
  } catch (error) {
    console.error('[DbMigration] Error ensuring required tables:', error);
    // Don't throw - allow server to continue starting
  }
}
