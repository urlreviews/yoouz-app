const fs = require('fs');
let content = fs.readFileSync('./src/components/CopoDiscoverView.tsx', 'utf8');
content = content.replace(/handle: /g, '//handle: ');
fs.writeFileSync('./src/components/CopoDiscoverView.tsx', content);

let syncContent = fs.readFileSync('./src/lib/socialSync.ts', 'utf8');
syncContent = syncContent.replace(/handle: /g, '//handle: ');
fs.writeFileSync('./src/lib/socialSync.ts', syncContent);

console.log("Re-patched");
