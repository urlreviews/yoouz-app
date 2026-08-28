const fs = require('fs');
const file = './src/utils/logoUtils.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'url.startsWith("https://")',
  'url.startsWith("https://") || url.startsWith("http://")'
);

fs.writeFileSync(file, content);
console.log("Patched getCleanLogoUrl");
