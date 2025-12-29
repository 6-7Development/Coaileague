#!/bin/bash
set -e

echo "🧹 Cleaning previous build..."
rm -rf dist server/public

echo "🏗️  Building frontend..."
npx vite build

echo "📦 Copying frontend build to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/

echo "🏗️  Building backend with path alias resolution..."
node build.mjs

echo "✅ Build complete!"
