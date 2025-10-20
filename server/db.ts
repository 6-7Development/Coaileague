// Reference: javascript_database blueprint
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// ⚠️ RENDER DEPLOYMENT: Check for internal database URL
const isRenderInternal = databaseUrl.includes('.render.internal');
if (process.env.NODE_ENV === 'production' && !isRenderInternal && databaseUrl.includes('render.com')) {
  console.warn('⚠️  WARNING: Using external database URL on Render');
  console.warn('    For better performance, switch to INTERNAL DATABASE URL');
  console.warn('    Format: postgresql://user:pass@hostname.render.internal:5432/dbname');
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
