const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');
content = content.replace(/preload="auto"/g, 'preload={isActive ? "auto" : "metadata"}');
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Fixed preload");
