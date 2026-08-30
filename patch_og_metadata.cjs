const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Update buildOgImageSvg options
code = code.replace(
  /reviewerPhotoBase64\?: string;\n\s*\}/,
  `reviewerPhotoBase64?: string;
    thumbBase64?: string;
  }`
);

// 2. Update buildOgImageSvg video render logic
const newVideoRender = `
    const isVideoCard = type === 'video';
    if (isVideoCard) {
      const displayAuthor = author || 'Reviewer';
      const displayPlace = placeName || 'Business';
      const displayRating = rating || 5.0;
      let starsSvg = '';
      for(let i=0; i<5; i++) {
        const fill = i < Math.floor(displayRating) ? '#fbbf24' : '#3f3f46';
        starsSvg += \\\`<path transform="translate(\\\${i * 28}, 0)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="\\\${fill}"/></\\\`;
      }
      
      const thumb = options.thumbBase64 || "data:image/svg+xml;base64," + Buffer.from(\\\`<svg width="300" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#3b82f6"/></svg>\\\`).toString('base64');
      const avatarStr = options.avatarBase64 || options.reviewerPhotoBase64 || "";

      let avatarImg = '';
      if (avatarStr) {
         avatarImg = \\\`<image href="data:image/jpeg;base64,\\\${avatarStr}" x="0" y="0" width="56" height="56" preserveAspectRatio="xMidYMid slice"/>\\\`;
      } else {
         avatarImg = \\\`<rect width="56" height="56" fill="#27272a"/><text x="28" y="36" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#ffffff">\\\${displayAuthor.charAt(0)}</text>\\\`;
      }

      return \\\`
  <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <filter id="blurLg" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="80" />
      </filter>
      <filter id="shadow">
        <feDropShadow dx="0" dy="24" stdDeviation="32" flood-opacity="0.6" flood-color="#000000"/>
      </filter>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="30%" stop-color="#09090b" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#09090b" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
      </linearGradient>
      <clipPath id="thumbClip">
        <rect width="315" height="560" rx="32"/>
      </clipPath>
      <clipPath id="avatarClip">
        <circle cx="28" cy="28" r="28"/>
      </clipPath>
    </defs>

    <rect width="1200" height="630" fill="#09090b"/>
    
    <image href="\\\${thumb}" x="-100" y="-100" width="1400" height="830" preserveAspectRatio="xMidYMid slice" opacity="0.6" filter="url(#blurLg)"/>
    
    <rect width="1200" height="630" fill="url(#fade)"/>

    <g transform="translate(80, 80)">
      <g transform="translate(0, 0)">
        <rect width="48" height="48" rx="14" fill="#ffffff"/>
        <path d="M24 13.5l2.4 4.9 5.4.8-3.9 3.8.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.9-3.8 5.4-.8z" fill="#09090b"/>
        <text x="64" y="34" font-family="system-ui, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="-0.5">Yoouz</text>
      </g>

      <g transform="translate(0, 160)">
        \\\${starsSvg}
        <text x="150" y="17" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#a1a1aa">\\\${displayRating.toFixed(1)} / 5.0</text>
      </g>

      <text x="0" y="240" font-family="system-ui, sans-serif" font-size="72" font-weight="900" fill="#ffffff" letter-spacing="-2">\\\${displayPlace.substring(0, 22)}\\\${displayPlace.length > 22 ? '...' : ''}</text>
      
      <text x="0" y="300" font-family="system-ui, sans-serif" font-size="26" font-weight="600" fill="#a1a1aa">Authentic 60-Second Video Review</text>

      <g transform="translate(0, 420)">
        <g clip-path="url(#avatarClip)">
           \\\${avatarImg}
        </g>
        <text x="76" y="24" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#ffffff">\\\${displayAuthor}</text>
        <text x="76" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#3b82f6">Verified Video Reviewer</text>
      </g>
    </g>

    <g transform="translate(750, 35)" filter="url(#shadow)">
      <g clip-path="url(#thumbClip)">
        <image href="\\\${thumb}" x="0" y="0" width="315" height="560" preserveAspectRatio="xMidYMid slice"/>
        <rect width="315" height="560" fill="#000000" fill-opacity="0.15"/>
      </g>
      <rect width="315" height="560" rx="32" fill="none" stroke="url(#glass)" stroke-width="2"/>
      <g transform="translate(113.5, 236)">
        <circle cx="44" cy="44" r="44" fill="#000000" fill-opacity="0.4"/>
        <circle cx="44" cy="44" r="44" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5"/>
        <path d="M36 28l24 16-24 16V28z" fill="#ffffff"/>
      </g>
    </g>
  </svg>
  \\\`;
    }
`;

code = code.replace(
  /const isVideoCard = type === 'video';\n\s*if \(isVideoCard\) \{[\s\S]*?yoouz\.com · Authentic 60-Second Video Reviews[\s\S]*?<\/svg>\n\s*`;\n\s*\}/,
  newVideoRender
);

// 3. Update route to fetch thumbUrl base64
code = code.replace(
  /let reviewerPhotoBase64 = '';/,
  `let reviewerPhotoBase64 = '';
      let thumbBase64 = '';
      if (req.query.thumbUrl) {
         try {
           const response = await fetch(req.query.thumbUrl);
           const arrayBuffer = await response.arrayBuffer();
           const buffer = Buffer.from(arrayBuffer);
           thumbBase64 = \`data:image/jpeg;base64,\${buffer.toString('base64')}\`;
         } catch(e) {}
      }`
);

code = code.replace(
  /logoBase64,\n\s*reviewerPhotoBase64\n\s*\}\);/,
  `logoBase64,
        reviewerPhotoBase64,
        thumbBase64
      });`
);

// 4. Update resolveMetadataForRequest to pass thumbUrl
code = code.replace(
  /imageUrl = \\\`\\\$\{baseUrl\}\/api\/og-image\.png\?type=video&id=\\\$\{encodeURIComponent\(foundVideo\.id\)\}&placeName=\\\$\{encodeURIComponent\(placeName\)\}&author=\\\$\{encodeURIComponent\(authorName\)\}&rating=\\\$\{rating\}&caption=\\\$\{encodeURIComponent\(caption\)\}&v=4\\\`;/,
  `const thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || foundVideo.avatar || foundVideo.author?.avatar || "";
          imageUrl = \`\${baseUrl}/api/og-image.png?type=video&id=\${encodeURIComponent(foundVideo.id)}&placeName=\${encodeURIComponent(placeName)}&author=\${encodeURIComponent(authorName)}&rating=\${rating}&caption=\${encodeURIComponent(caption)}&thumbUrl=\${encodeURIComponent(thumbArg)}&v=4\`;`
);

fs.writeFileSync('server.ts', code);
console.log('Patched metadata generation');
