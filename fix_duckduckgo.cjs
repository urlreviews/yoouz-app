const fs = require('fs');
const path = 'src/utils/logoUtils.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /\/\/ 4\. DuckDuckGo Crisp Favicon for domain[\s\S]*?return \`https:\/\/icons\.duckduckgo\.com\/ip3\/\$\{cleanDomain\}\.ico\`;/,
  `// 4. Secure Local Favicon Proxy (Bypasses tracking blockers)
  if (cleanDomain && cleanDomain.includes(".")) {
    return \`/api/favicon?domain=\${cleanDomain}\`;`
);

fs.writeFileSync(path, content, 'utf8');
