const fs = require('fs');
const path = 'src/components/CopoBrandLogo.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /return \{ src: \`https:\/\/t1\.gstatic\.com\/faviconV2\?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https:\/\/\$\{resolvedDomain\}&size=256\`, isCover: false \};/;
const replacement = `return { src: \`/api/favicon?domain=\${encodeURIComponent(resolvedDomain)}\`, isCover: false };`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
