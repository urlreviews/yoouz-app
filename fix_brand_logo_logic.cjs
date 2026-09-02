const fs = require('fs');
const path = 'src/components/CopoBrandLogo.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ 1\. Known high quality vectors[\s\S]*?return \{ src: logoUrl, isCover: false \};\n    \}/;

const replacement = `// 1. Explicit Logo URL passed down (e.g. from Database places array!) ALWAYS prefer this first!
    if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("/api/") || logoUrl.startsWith("data:image"))) {
      return { src: logoUrl, isCover: false };
    }

    // 2. Known high quality vectors
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      return { src: KNOWN_BRAND_LOGOS[resolvedDomain], isCover: false };
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
