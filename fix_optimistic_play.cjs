const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');
content = content.replace(
  /const playPromise = el\.play\(\);\s+if \(playPromise !== undefined\) \{\s+await playPromise;/g,
  `const playPromise = el.play();
      if (isActive) setIsPlaying(true); // Optimistically hide play button while buffering
      if (playPromise !== undefined) {
        await playPromise;`
);

content = content.replace(
  /await el\.play\(\);\s+if \(isActive\) \{\s+setIsPlaying\(true\);/g,
  `if (isActive) setIsPlaying(true);
        await el.play();
        if (isActive) {`
);

fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated optimistic play");
