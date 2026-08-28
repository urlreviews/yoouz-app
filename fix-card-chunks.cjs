const fs = require('fs');

let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf8');

// Replace the handleTogglePlayPause block
content = content.replace(
`    if (hasError || !el || !el.src || el.error) {
      setHasError(false);
      setIsBuffering(true);
      // cloud chunks removed
        }
      });
      return;
    }`,
`    if (hasError || !el || !el.src || el.error) {
      setHasError(false);
      setIsBuffering(true);
      if (el) el.load();
      return;
    }`
);

// Replace the onError block
content = content.replace(
`              console.warn(\`Playback notice (\${errCode}) for video \${video.id}, attempting cloud chunks recovery...\`);

              // Try fetching video directly from cloud chunks
              // cloud chunks removed`,
`              console.warn(\`Playback notice (\${errCode}) for video \${video.id}...\`);`
);

// Replace the Reload Video button block
content = content.replace(
`                  e.stopPropagation();
                  setHasError(false);
                  setIsBuffering(true);
                  // cloud chunks removed
                }}`,
`                  e.stopPropagation();
                  setHasError(false);
                  setIsBuffering(true);
                  if (videoRef.current) videoRef.current.load();
                }}`
);

fs.writeFileSync('src/components/VideoFeedCard.tsx', content);
