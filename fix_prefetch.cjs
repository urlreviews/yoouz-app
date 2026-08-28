const fs = require('fs');
const path = 'src/components/CopoVideoPlayer.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace the prefetchVideo call with a comment
content = content.replace(
  /prefetchVideo\(v\.videoUrl\);/g,
  '// prefetchVideo(v.videoUrl); // Disabled to prevent network/main-thread freezing'
);

fs.writeFileSync(path, content, 'utf-8');
console.log("Disabled prefetchVideo");
