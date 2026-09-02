const fs = require('fs');
const path = 'src/components/VideoFeedCard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\{true \? \(/g, '{(isActive || isNear) && (');

fs.writeFileSync(path, content, 'utf8');
