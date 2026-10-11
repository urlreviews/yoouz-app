const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateOgBanner() {
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#09090b"/>
        <stop offset="50%" stop-color="#111115"/>
        <stop offset="100%" stop-color="#09090b"/>
      </linearGradient>
      <radialGradient id="starGlow" cx="600" cy="315" r="400" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
        <stop offset="50%" stop-color="#ffffff" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Background Base -->
    <rect width="1200" height="630" fill="url(#bgGrad)"/>
    <rect width="1200" height="630" fill="url(#starGlow)"/>

    <!-- Outer Border Frame -->
    <rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="#27272a" stroke-width="2"/>

    <!-- Centered Icon Only (Dark Squircle with White Star Emblem) -->
    <g transform="translate(460, 175)">
      <rect width="280" height="280" rx="76" fill="#09090b" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4"/>
      <g transform="translate(47, 47) scale(7.75)">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ffffff"/>
      </g>
    </g>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(path.join(process.cwd(), 'public', 'og-banner.png'));

  console.log('og-banner.png successfully generated with ICON ONLY!');
}

generateOgBanner().catch(console.error);
