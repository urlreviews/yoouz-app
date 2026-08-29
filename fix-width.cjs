const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const authorDisplay = author \|\| 'Reviewer';[\s\S]*?(?=<\/svg>`)/;

const replacement = `const authorDisplay = author || 'Reviewer';
      const placeDisplay = placeName || 'Business';
      const ratingVal = rating || 5.0;

      // Calculate widths for pixel-perfect positioning
      const authorTextStr = \`By \${authorDisplay}\`;
      const authorWidth = getAccurateTextWidth(authorTextStr, 32, true);
      const verifiedBadgeX = authorWidth + 12;

      const placeWidth = getAccurateTextWidth(placeDisplay, 18, true);
      const placePillWidth = Math.max(placeWidth + 72, 140); // 72 = 44 (icon+padding) + 28 (right padding)

      // Generate stars
      let starsSvg = '';
      for (let i = 0; i < 5; i++) {
        const isFilled = i < Math.floor(ratingVal);
        starsSvg += \`
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
                fill="\${isFilled ? '#eab308' : '#3f3f46'}" 
                transform="translate(\${i * 24}, 0) scale(0.9)"/>
        \`;
      }

      return \`
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <linearGradient id="bottomGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="40%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.95" />
          </linearGradient>
          <linearGradient id="topGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.5" />
            <stop offset="30%" stop-color="#000000" stop-opacity="0" />
          </linearGradient>
        </defs>
        
        <rect width="1200" height="630" fill="#09090b"/>
        \${bgImg}
        
        <!-- Overlays for text legibility -->
        <rect width="1200" height="630" fill="url(#topGradient)" />
        <rect width="1200" height="630" fill="url(#bottomGradient)" />

        <!-- Top Left Brand Logo -->
        <g transform="translate(48, 48)">
          <rect width="48" height="48" rx="14" fill="#ffffff"/>
          <path d="M24 13.5l2.45 5.01 5.51.82-3.98 3.88.94 5.46-4.92-2.6-4.92 2.6.94-5.46-3.98-3.88 5.51-.82z" fill="#09090b"/>
          <text x="64" y="34" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="-0.5">Yoouz</text>
        </g>

        <!-- Bottom Content Area -->
        <g transform="translate(48, 480)">
          <!-- Author Name -->
          <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="32" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
            By \${authorDisplay}
          </text>
          
          <!-- Verified Badge -->
          <g transform="translate(\${verifiedBadgeX}, -20)">
            <circle cx="10" cy="10" r="10" fill="#ffffff"/>
            <path d="M6 10l3 3 5-5" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </g>

          <!-- Star Rating -->
          <g transform="translate(0, 16)">
            \${starsSvg}
          </g>

          <!-- Place Label Pill -->
          <g transform="translate(0, 56)">
            <rect x="0" y="0" width="\${placePillWidth}" height="44" rx="22" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5" />
            
            <!-- Pin Icon -->
            <path d="M14 12c0-3.31 2.69-6 6-6s6 2.69 6 6c0 4.5-6 10-6 10s-6-5.5-6-10z M18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#ffffff" transform="translate(4, 4) scale(0.9)" />
            
            <text x="44" y="27" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff" letter-spacing="0.2">
              \${placeDisplay}
            </text>
          </g>
        </g>
      `;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Updated with precise text widths!");
