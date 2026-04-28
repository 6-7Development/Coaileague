#!/usr/bin/env node
/**
 * Manual seed runner — run this ONCE on a fresh environment.
 * 
 * Usage:
 *   node server/scripts/run-seed.js
 * 
 * On Railway (via CLI):
 *   railway run node server/scripts/run-seed.js
 * 
 * Or set SEED_ON_STARTUP=true in Railway Variables for one deploy,
 * then remove it immediately after.
 *
 * This script will NOT re-seed data that already exists.
 * Every seed function uses ON CONFLICT DO NOTHING + sentinel checks.
 */

process.env.SEED_ON_STARTUP = 'true';

import('../dist/index.js')
  .then(() => {
    console.log('\n✅ Seed script launched — check server logs for completion.');
    console.log('   The server will remain running. Ctrl+C when seeding is done.\n');
  })
  .catch(err => {
    console.error('Failed to launch:', err.message);
    process.exit(1);
  });
