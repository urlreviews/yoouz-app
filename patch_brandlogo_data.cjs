const fs = require('fs');
const file = './src/components/CopoBrandLogo.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replaceAll(
  '(logoUrl.startsWith("http://") || logoUrl.startsWith("https://"))',
  '(logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:image"))'
);
content = content.replaceAll(
  '(bannerUrl.startsWith("http://") || bannerUrl.startsWith("https://"))',
  '(bannerUrl.startsWith("http://") || bannerUrl.startsWith("https://") || bannerUrl.startsWith("data:image"))'
);

fs.writeFileSync(file, content);
console.log("Patched CopoBrandLogo data URLs");
