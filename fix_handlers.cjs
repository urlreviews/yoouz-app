const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');
content = content.replace(
  /onPlaying=\{\(\) => \{\s+if \(isActive\) \{\s+setHasError\(false\);\s+setIsPlaying\(true\);\s+\}\s+\}\}/g,
  `onPlaying={() => {
              if (isActive) {
                setHasError(false);
                setIsPlaying(true);
              }
            }}
            onPause={() => {
              if (isActive) {
                setIsPlaying(false);
              }
            }}`
);
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated video event handlers");
