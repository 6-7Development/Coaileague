#!/bin/bash
# verify-build.sh — Simulates Railway's exact build pipeline locally
# Run this before EVERY push to development/main
# Usage: bash scripts/verify-build.sh

set -e
echo "🔍 Simulating Railway build pipeline..."
echo ""

# Step 1: Clean install (like npm ci on Railway)
echo "Step 1: npm ci (clean install from lock file)"
npm ci --silent
echo "✅ npm ci passed"
echo ""

# Step 2: Full vite + server build (like npm run build on Railway)
echo "Step 2: npm run build (vite build + node build.mjs)"
npm run build
echo "✅ Build passed"
echo ""

echo "🎉 Railway build simulation PASSED — safe to push"
