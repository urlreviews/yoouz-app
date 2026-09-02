const fs = require('fs');
const path = 'src/components/VideoFeedCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the old handleVideoError with a much simpler one
const targetPattern = /\/\/ Handle video error and advance through cascade[\s\S]*?\}, \[cascade, currentSource, video.id\]\);/;

const newLogic = `
  // Simple error handler for single source
  const handleVideoError = useCallback(() => {
    console.warn(\`[VideoFeedCard] Source failed for video \${video.id}: \${currentSource}\`);
  }, [currentSource, video.id]);
`;

if (content.match(targetPattern)) {
    content = content.replace(targetPattern, newLogic.trim());
}

// Remove cascadeIndex
content = content.replace(/const \[cascadeIndex, setCascadeIndex\] = useState<number>\(0\);/g, "");

fs.writeFileSync(path, content, 'utf8');
