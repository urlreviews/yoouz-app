const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startStr = "let mainContentSvg = '';";
const endStr = "} else if (isPlaceCard) {";

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newBlock = `let mainContentSvg = '';
    const isVideoCard = type === 'video';
    if (isVideoCard) {
      const bgImg = reviewerPhotoBase64 ? 
        \`<image href="data:image/jpeg;base64,\${reviewerPhotoBase64}" x="-100" y="-100" width="1400" height="830" preserveAspectRatio="xMidYMid slice" opacity="0.35" filter="url(#bgBlur)"/>\` : '';
        
      const playerMockup = renderVideoPlayerMockup({
          photoBase64: reviewerPhotoBase64,
          authorName: author || 'Reviewer',
          placeName: placeName || 'Business',
          ratingVal: rating || 5.0,
          timeAgo: 'Just now',
          likesCount: '4.2k',
          commentsCount: '128',
          offsetX: 430
      });

      return \`
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <filter id="bgBlur">
            <feGaussianBlur stdDeviation="30" />
          </filter>
        </defs>
        <rect width="1200" height="630" fill="#000000"/>
        \${bgImg}
        
        <!-- Dark tint to ensure mockup pops -->
        <rect width="1200" height="630" fill="#09090b" fill-opacity="0.75" />

        <!-- Luxury premium glow behind the player -->
        <circle cx="600" cy="315" r="300" fill="#3b82f6" fill-opacity="0.15" filter="url(#bgBlur)"/>
        
        <!-- Top Left Brand Identity -->
        <g transform="translate(48, 48)">
          <rect width="44" height="44" rx="13" fill="#ffffff"/>
          <path d="M22 12.5l2.25 4.6 5.05.75-3.65 3.55.85 5-4.5-2.4-4.5 2.4.85-5-3.65-3.55 5.05-.75z" fill="#09090b"/>
          <text x="56" y="32" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="30" font-weight="900" fill="#ffffff" letter-spacing="-0.5">Yoouz</text>
        </g>
        
        <!-- Bottom left subtle text -->
        <text x="48" y="582" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="#71717a" letter-spacing="0.2">
          yoouz.com · Authentic 60-Second Video Reviews
        </text>

        <!-- Centered Mobile Video Player Mockup -->
        \${playerMockup}
      </svg>\`;
    `;

  code = code.substring(0, startIdx) + newBlock + code.substring(endIdx);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed cleanly!");
} else {
  console.log("Could not find boundaries.");
}
