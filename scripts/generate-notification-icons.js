/**
 * generate-notification-icons.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Regenerates all Android notification icons from the canonical Trinity orbital
 * arm SVG (client/public/favicon.svg).
 *
 * Run any time the brand mark updates:
 *   node scripts/generate-notification-icons.js
 *
 * Outputs:
 *   android/app/src/main/res/drawable-{mdpi|hdpi|xhdpi|xxhdpi|xxxhdpi}/ic_stat_coaileague.png
 *   client/public/icons/badge-72.png
 *   client/public/icons/ic_stat_coaileague_96.png  (for manifest.json monochrome)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ARM = "M60 43 C55 34,53 19,60 6 C67 19,65 34,60 43 Z";

function buildMonochromeSVG(size) {
  const showRings = size >= 48;
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  ${showRings ? `
  <circle cx="60" cy="60" r="53" fill="none" stroke="white" stroke-width="1.8" stroke-dasharray="7 22 2 22" opacity="0.4"/>
  <circle cx="60" cy="60" r="45" fill="none" stroke="white" stroke-width="1.2" stroke-dasharray="4 16" opacity="0.3"/>
  ` : ''}
  <path d="${ARM}" fill="white" opacity="0.95"/>
  <circle cx="60" cy="6" r="3.5" fill="white" opacity="0.95"/>
  <g transform="rotate(120 60 60)">
    <path d="${ARM}" fill="white" opacity="0.95"/>
    <circle cx="60" cy="6" r="3.5" fill="white" opacity="0.95"/>
  </g>
  <g transform="rotate(240 60 60)">
    <path d="${ARM}" fill="white" opacity="0.95"/>
    <circle cx="60" cy="6" r="3.5" fill="white" opacity="0.95"/>
  </g>
  <circle cx="60" cy="60" r="14" fill="white" opacity="0.95"/>
  <circle cx="57" cy="57" r="3" fill="white" opacity="0.7"/>
</svg>`;
}

const RES = path.join(__dirname, '..', 'android/app/src/main/res');
const PUBLIC_ICONS = path.join(__dirname, '..', 'client/public/icons');

const DENSITIES = [
  ['drawable-mdpi',    24],
  ['drawable-hdpi',    36],
  ['drawable-xhdpi',   48],
  ['drawable-xxhdpi',  72],
  ['drawable-xxxhdpi', 96],
];

async function run() {
  for (const [dir, px] of DENSITIES) {
    const outDir = path.join(RES, dir);
    fs.mkdirSync(outDir, { recursive: true });
    const svg = Buffer.from(buildMonochromeSVG(px));
    const out = path.join(outDir, 'ic_stat_coaileague.png');
    await sharp(svg).png({ compressionLevel: 9 }).toFile(out);
    console.log(`✅ ${dir}/ic_stat_coaileague.png — ${px}×${px}px — ${fs.statSync(out).size}B`);
  }

  // Badge for PWA/Chrome
  const badgeSVG = Buffer.from(buildMonochromeSVG(72));
  const badgePath = path.join(PUBLIC_ICONS, 'badge-72.png');
  await sharp(badgeSVG).png({ compressionLevel: 9 }).toFile(badgePath);
  console.log(`✅ client/public/icons/badge-72.png — 72×72px — ${fs.statSync(badgePath).size}B`);

  // Manifest monochrome (96px copy)
  const mono96 = path.join(PUBLIC_ICONS, 'ic_stat_coaileague_96.png');
  fs.copyFileSync(path.join(RES, 'drawable-xxxhdpi', 'ic_stat_coaileague.png'), mono96);
  console.log(`✅ client/public/icons/ic_stat_coaileague_96.png — 96×96px`);

  console.log('\nAll Trinity orbital arm notification icons regenerated.');
}

run().catch(console.error);
