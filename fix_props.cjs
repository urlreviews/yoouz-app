const fs = require('fs');
const path = 'src/components/CopoVideoPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/localBlobUrl=\{[^\}]+\}/g, "");
content = content.replace(/const localBlobUrls = \{.*?\};/g, "");

fs.writeFileSync(path, content, 'utf8');
