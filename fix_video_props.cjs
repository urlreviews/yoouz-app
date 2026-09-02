const fs = require('fs');
const path = 'src/components/VideoFeedCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace everything from `const [cachedLocalUrl, setCachedLocalUrl]` down to `const currentSource = activeSource;`
// We will also use resolvePlayableVideoSource instead.
const targetPattern = /const \[cachedLocalUrl, setCachedLocalUrl\] = useState<string \| null>\(null\);[\s\S]*?const \[activeSource, setActiveSource\] = useState<string>\(\(\) => \{[\s\S]*?const currentSource = activeSource;/;

const newLogic = `
  // Establish a single, stable, optimized CDN source.
  // We completely bypass IndexedDB caching for large blobs on mobile, 
  // relying purely on the browser's optimized HTTP byte-range caching & edge CDNs.
  const currentSource = React.useMemo(() => {
    return resolvePlayableVideoSource(video);
  }, [video]);
`;

if (content.match(targetPattern)) {
    content = content.replace(targetPattern, newLogic.trim());
} else {
    console.log("Could not find the target pattern.");
}

// Remove cachedLocalUrl usage from resolvePlayableVideoSourcesCascade if it still exists
content = content.replace(/\|\| localBlobUrl/g, "");
content = content.replace(/, localBlobUrl/g, "");
content = content.replace(/localBlobUrl \|\| /g, "");

content = content.replace(/getVideoBlobFromIndexedDB,/g, "");

fs.writeFileSync(path, content, 'utf8');
