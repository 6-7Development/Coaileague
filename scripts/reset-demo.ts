#!/usr/bin/env tsx
// Reset Demo Workspace Script
// Run with: npm run reset-demo (or tsx scripts/reset-demo.ts)

import { resetDemoWorkspace } from "../server/seed-demo";

async function main() {
  console.log("🚀 Starting demo workspace reset...\n");
  
  try {
    await resetDemoWorkspace();
    console.log("\n✅ Demo workspace reset successfully!");
    console.log("💡 Demo users can now access a fresh workspace at /api/demo-login");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to reset demo workspace:", error);
    process.exit(1);
  }
}

main();
