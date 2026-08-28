const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');
content = content.replace(/const \[, setIsGlobalMuted\] = useGlobalMute\(\);\n/, '');
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Removed unused setIsGlobalMuted");
