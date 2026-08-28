const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

code = code.replace(/YouTube Shorts/g, 'Reviuz');
code = code.replace(/YouTubeShort/g, 'VideoReview');
code = code.replace(/YouTube-grade/g, 'Pro-grade');

fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
