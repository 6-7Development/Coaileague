#!/usr/bin/env node
/**
 * Generate Trinity notification icons from the arm path in favicon.svg.
 * Run: node scripts/generateNotificationIcons.js
 *
 * Outputs:
 *   android/app/src/main/res/drawable-{density}/ic_stat_coaileague.png  (monochrome)
 *   client/public/icons/badge-72.png                                    (monochrome, PWA badge)
 *   client/public/icons/ic_stat_coaileague-96.png                       (monochrome, PWA manifest)
 *   client/public/icons/trinity-notification-192.png                    (full-color, LargeIcon)
 *
 * Icon design: Three Trinity teardrop arms ONLY.
 * No orbital rings. No halo. No core glow. Clean silhouette.
 * SmallIcon (status bar): monochrome white-on-transparent — Material Design 3 requirement.
 * LargeIcon (shade):      full-color blue/gold/purple arms.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ARM = 'M60 43 C55 34,53 19,60 6 C67 19,65 34,60 43 Z';

const colorSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <path d="${ARM}" fill="#93C5FD" opacity="0.95"/>
  <circle cx="60" cy="6" r="3.5" fill="#93C5FD"/>
  <g transform="rotate(120 60 60)">
    <path d="${ARM}" fill="#FED7AA" opacity="0.95"/>
    <circle cx="60" cy="6" r="3.5" fill="#FED7AA"/>
  </g>
  <g transform="rotate(240 60 60)">
    <path d="${ARM}" fill="#C4B5FD" opacity="0.95"/>
    <circle cx="60" cy="6" r="3.5" fill="#C4B5FD"/>
  </g>
  <circle cx="60" cy="60" r="10" fill="#ffffff" opacity="0.95"/>
  <circle cx="57" cy="57" r="3" fill="#ffffff" opacity="0.85"/>
</svg>`;

const monoSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <path d="${ARM}" fill="#ffffff"/>
  <circle cx="60" cy="6" r="3.5" fill="#ffffff"/>
  <g transform="rotate(120 60 60)">
    <path d="${ARM}" fill="#ffffff"/>
    <circle cx="60" cy="6" r="3.5" fill="#ffffff"/>
  </g>
  <g transform="rotate(240 60 60)">
    <path d="${ARM}" fill="#ffffff"/>
    <circle cx="60" cy="6" r="3.5" fill="#ffffff"/>
  </g>
  <circle cx="60" cy="60" r="10" fill="#ffffff"/>
</svg>`;

const androidSizes = [
  { dir: 'drawable-mdpi',    size: 24 },
  { dir: 'drawable-hdpi',    size: 36 },
  { dir: 'drawable-xhdpi',   size: 48 },
  { dir: 'drawable-xxhdpi',  size: 72 },
  { dir: 'drawable-xxxhdpi', size: 96 },
];

async function run() {
  const BASE = path.resolve(__dirname, '..');
  for (const { dir, size } of androidSizes) {
    const outDir = path.join(BASE, 'android/app/src/main/res', dir);
    fs.mkdirSync(outDir, { recursive: true });
    await sharp(Buffer.from(monoSvg)).resize(size, size).png({ compressionLevel: 9 })
      .toFile(path.join(outDir, 'ic_stat_coaileague.png'));
    console.log(`✅ ${dir}/ic_stat_coaileague.png (${size}×${size})`);
  }
  const pub = path.join(BASE, 'client/public/icons');
  await sharp(Buffer.from(monoSvg)).resize(72,72).png({compressionLevel:9}).toFile(path.join(pub,'badge-72.png'));
  console.log('✅ badge-72.png (72×72 monochrome)');
  await sharp(Buffer.from(monoSvg)).resize(96,96).png({compressionLevel:9}).toFile(path.join(pub,'ic_stat_coaileague-96.png'));
  console.log('✅ ic_stat_coaileague-96.png (96×96 monochrome)');
  await sharp(Buffer.from(colorSvg)).resize(192,192).png({compressionLevel:9}).toFile(path.join(pub,'trinity-notification-192.png'));
  console.log('✅ trinity-notification-192.png (192×192 full-color)');
  console.log('\nDone. Run `npx cap sync android` then rebuild the APK.');
}
run().catch(e => { console.error(e.message); process.exit(1); });
