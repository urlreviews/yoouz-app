const fs = require('fs');
const path = 'src/components/VideoFeedCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace everything from localBlobUrl declaration down to currentSource
const targetPattern = /\/\/ Video Streaming State[\s\S]*?const currentSource = activeSource;/;

const newLogic = `
  // Establish a single, stable, optimized CDN source.
  // We completely bypass IndexedDB caching for large blobs on mobile, 
  // relying purely on the browser's optimized HTTP byte-range caching & edge CDNs.
  const currentSource = React.useMemo(() => {
    return resolvePlayableVideoSource(video);
  }, [video]);
`;

content = content.replace(targetPattern, newLogic.trim());

// Also remove localBlobUrl from props if it exists
content = content.replace(/localBlobUrl\?: string \| null;/g, "");
content = content.replace(/localBlobUrl,/g, "");

// Replace the video tag preload logic
content = content.replace(
  /preload={isActive \|\| isNear \? "auto" : "metadata"}/g, 
  'preload={isActive ? "auto" : "none"}'
);
// Make the video src render conditionally
content = content.replace(
  /\{\(isActive \|\| isNear\) && \(/g,
  '{true ? ('
); // keep rendering it but we will change src logic

fs.writeFileSync(path, content, 'utf8');
