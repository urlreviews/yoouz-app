const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf8');

// replace the import
content = content.replace(", getVideoBlobFromCloudChunks", "");

// replace the usage
const regex = /getVideoBlobFromCloudChunks\([^)]*\)\.then\([^)]*\)\s*=>\s*\{[^}]*\}\)\.catch\([^)]*\)\s*=>\s*\{[^}]*\}\);/g;
content = content.replace(regex, "");

fs.writeFileSync('src/components/VideoFeedCard.tsx', content);
