import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');

async function generateBrandAssets() {
  console.log('Generating official Yoouz Dark Mode Brand Assets...');

  // 1. Master Dark Mode Vector SVG (512x512)
  const masterSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18181b"/>
        <stop offset="100%" stop-color="#09090b"/>
      </linearGradient>
      <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#e4e4e7"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
    <!-- Dark Squircle Background -->
    <rect width="512" height="512" rx="120" fill="url(#bgGrad)"/>
    <rect x="2" y="2" width="508" height="508" rx="118" stroke="rgba(255, 255, 255, 0.12)" stroke-width="4"/>
    
    <!-- Yoouz Iconic Star Shape in Center -->
    <g transform="translate(106, 106) scale(12.5)" filter="url(#glow)">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#starGrad)"/>
    </g>
  </svg>`;

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), masterSvg);

  const svgBuffer = Buffer.from(masterSvg);

  // 2. Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ icon-512.png generated');

  // 3. Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ icon-192.png generated');

  // 4. Generate 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png generated');

  // 5. Generate 64x64 and 32x32 Favicon PNGs
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png generated');

  // 6. Generate 1200x630 OG Social Banner in Dark Mode
  const ogBannerSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#121215"/>
        <stop offset="50%" stop-color="#09090b"/>
        <stop offset="100%" stop-color="#000000"/>
      </linearGradient>
      <linearGradient id="starGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#d4d4d8"/>
      </linearGradient>
      <radialGradient id="glowEffect" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bgGrad2)"/>
    <rect width="1200" height="630" fill="url(#glowEffect)"/>
    
    <!-- Subtle Grid Lines -->
    <g opacity="0.08" stroke="#ffffff" stroke-width="1">
      <line x1="0" y1="105" x2="1200" y2="105"/>
      <line x1="0" y1="210" x2="1200" y2="210"/>
      <line x1="0" y1="315" x2="1200" y2="315"/>
      <line x1="0" y1="420" x2="1200" y2="420"/>
      <line x1="0" y1="525" x2="1200" y2="525"/>
    </g>

    <!-- Top Badge -->
    <g transform="translate(100, 80)">
      <rect width="260" height="42" rx="21" fill="#18181b" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <circle cx="24" cy="21" r="6" fill="#22c55e"/>
      <text x="42" y="27" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="0.5">AUTHENTIC VIDEO REVIEWS</text>
    </g>

    <!-- Logo and Brand Name -->
    <g transform="translate(100, 160)">
      <!-- Dark Squircle Logo Mark -->
      <rect width="100" height="100" rx="28" fill="#18181b" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <g transform="translate(20, 20) scale(2.5)">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#starGrad2)"/>
      </g>
      
      <!-- Brand Typography -->
      <text x="124" y="68" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" letter-spacing="-2">Yoouz</text>
      <rect x="330" y="34" width="76" height="30" rx="15" fill="#27272a" stroke="#3f3f46" stroke-width="1"/>
      <text x="348" y="54" fill="#e4e4e7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" letter-spacing="1">BETA</text>
    </g>

    <!-- Headline -->
    <text x="100" y="330" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" letter-spacing="-1">
      Real People. Real Video Reviews.
    </text>
    <text x="100" y="380" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" letter-spacing="-0.3">
      100% Authentic 60-second video feedback. Zero fake text reviews.
    </text>

    <!-- Key Differentiator Badges -->
    <g transform="translate(100, 440)">
      <!-- Card 1 -->
      <rect width="280" height="90" rx="16" fill="#18181b" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
      <text x="24" y="40" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700">Zero Fake Reviews</text>
      <text x="24" y="66" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14">No bot or AI-generated text</text>

      <!-- Card 2 -->
      <g transform="translate(300, 0)">
        <rect width="280" height="90" rx="16" fill="#18181b" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
        <text x="24" y="40" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700">60s Live Capture</text>
        <text x="24" y="66" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14">Recorded live on-the-spot</text>
      </g>

      <!-- Card 3 -->
      <g transform="translate(600, 0)">
        <rect width="360" height="90" rx="16" fill="#18181b" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
        <text x="24" y="40" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700">Google Maps Integrated</text>
        <text x="24" y="66" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14">Restaurants, cafes &amp; businesses</text>
      </g>
    </g>

    <!-- Footer URL -->
    <text x="100" y="585" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600">yoouz.com • The Modern Alternative to Yelp, Trustpilot &amp; Google Reviews</text>
  </svg>`;

  await sharp(Buffer.from(ogBannerSvg))
    .resize(1200, 630)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'og-banner.png'));
  console.log('✓ og-banner.png generated');

  console.log('All brand assets successfully generated!');
}

generateBrandAssets().catch(console.error);
