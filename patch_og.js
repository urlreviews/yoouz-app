const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');

// 1. Update buildOgImageSvg signature
serverTs = serverTs.replace(
  /function buildOgImageSvg\(options: \{([\s\S]*?)reviewsCount\?: number;\n  \}\): string \{/,
  `function buildOgImageSvg(options: {$1reviewsCount?: number;\n    avatarBase64?: string;\n    bannerBase64?: string;\n    logoBase64?: string;\n  }): string {`
);

// 2. Update the inner usage of options
serverTs = serverTs.replace(
  /const reviewsCount = options\.reviewsCount \|\| 12;/,
  `const reviewsCount = options.reviewsCount || 12;\n    const avatarBase64 = options.avatarBase64;\n    const bannerBase64 = options.bannerBase64;\n    const logoBase64 = options.logoBase64;`
);

// 3. Update the Place Card to use avatarBase64
serverTs = serverTs.replace(
  /<!-- Map Pin Icon Graphic -->([\s\S]*?)<circle cx="180" cy="150" r="54" fill="#27272a" stroke="#3f3f46" stroke-width="1.5"\/>([\s\S]*?)<path d="M180 134c-7.7 0-14 6.3-14 14 0 10.5 14 26 14 26s14-15.5 14-26c0-7.7-6.3-14-14-14zm0 19c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" fill="#09090b"\/>/g,
  `<!-- Place Avatar Graphic -->
          \${avatarBase64 ? 
            \`<defs>
              <clipPath id="placeClip">
                <circle cx="180" cy="150" r="54" />
              </clipPath>
            </defs>
            <image href="data:image/jpeg;base64,\${avatarBase64}" x="126" y="96" width="108" height="108" clip-path="url(#placeClip)" preserveAspectRatio="xMidYMid slice" />
            <circle cx="180" cy="150" r="54" fill="none" stroke="#3f3f46" stroke-width="1.5"/>\` 
            : 
            \`<circle cx="180" cy="150" r="54" fill="#27272a" stroke="#3f3f46" stroke-width="1.5"/>
            <circle cx="180" cy="150" r="40" fill="#ffffff"/>
            <path d="M180 134c-7.7 0-14 6.3-14 14 0 10.5 14 26 14 26s14-15.5 14-26c0-7.7-6.3-14-14-14zm0 19c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" fill="#09090b"/>\`
          }`
);

// 4. Update Creator Card to use avatarBase64
serverTs = serverTs.replace(
  /<circle cx="180" cy="140" r="54" fill="#27272a" stroke="#3f3f46" stroke-width="1.5"\/>\n          <text x="180" y="158" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">\$\{cleanHandle\.charAt\(0\)\.toUpperCase\(\)\}<\/text>/g,
  `\${avatarBase64 ? 
            \`<defs>
              <clipPath id="creatorClip">
                <circle cx="180" cy="140" r="54" />
              </clipPath>
            </defs>
            <image href="data:image/jpeg;base64,\${avatarBase64}" x="126" y="86" width="108" height="108" clip-path="url(#creatorClip)" preserveAspectRatio="xMidYMid slice" />
            <circle cx="180" cy="140" r="54" fill="none" stroke="#3f3f46" stroke-width="1.5"/>\` 
            : 
            \`<circle cx="180" cy="140" r="54" fill="#27272a" stroke="#3f3f46" stroke-width="1.5"/>
            <text x="180" y="158" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">\${cleanHandle.charAt(0).toUpperCase()}</text>\`
          }`
);

// 5. Update Homepage Card to use logoBase64
serverTs = serverTs.replace(
  /<!-- Yoouz Logo SVG \(Star\) -->([\s\S]*?)<\/g>/,
  `<!-- Yoouz Logo Graphic -->
          <g transform="translate(0, -50)">
            \${logoBase64 ? 
              \`<image href="data:image/png;base64,\${logoBase64}" x="-10" y="-10" width="84" height="84" preserveAspectRatio="xMidYMid meet" />\`
              :
              \`<rect width="64" height="64" rx="20" fill="#ffffff" />
              <path d="M32 14l4.5 9 10 1-7 7 1.5 10-9-4.5-9 4.5 1.5-10-7-7 10-1 4.5-9z" fill="#09090b" />\`
            }
          </g>`
);


fs.writeFileSync('server.ts', serverTs);
console.log('Patched SVG logic in server.ts');
