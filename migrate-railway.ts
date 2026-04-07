import pg from 'pg';
import { readFileSync } from 'fs';
import { readdirSync } from 'fs';
import path from 'path';

const DB_URL = 'postgresql://postgres:EvAAWZUwRCaoOecMWkAWuJQBZwhRVIio@junction.proxy.rlwy.net:52981/railway';

(async () => {
  const client = new pg.Client(DB_URL);
  await client.connect();
  console.log('Connected to Railway DB');
  
  // Get all migration files
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${files.length} migration files`);
  
  for (const file of files) {
    console.log(`Running: ${file}`);
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await client.query(sql);
      console.log(`✓ ${file}`);
    } catch (e: any) {
      if (e.code === '42P07' || e.code === '42710') {
        console.log(`⚠ ${file} - already exists, skipping`);
      } else {
        console.error(`✗ ${file}: ${e.message}`);
      }
    }
  }
  
  await client.end();
  console.log('Migration complete!');
})();
