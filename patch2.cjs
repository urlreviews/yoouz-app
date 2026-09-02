const fs = require('fs');
const path = 'src/components/VideoFeedCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexToReplace = /\/\/ Video Streaming State[\s\S]*?const currentSource = activeSource;/;
// Let's check what exactly is above "const currentSource = activeSource"
