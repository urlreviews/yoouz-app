const fs = require('fs');
const path1 = 'src/components/CopoVideoPlayer.tsx';
let content1 = fs.readFileSync(path1, 'utf8');
content1 = content1.replace(/localBlobUrl={index === 0 \? primaryLocalBlobUrl : undefined}/g, "");
fs.writeFileSync(path1, content1, 'utf8');

const path2 = 'src/components/VideoFeedCard.tsx';
let content2 = fs.readFileSync(path2, 'utf8');

// 1. Add import
if (content2.includes('resolvePlayableVideoSourcesCascade')) {
    content2 = content2.replace('resolvePlayableVideoSourcesCascade', 'resolvePlayableVideoSource');
}

// 2. Restore hasUserStartedFeedRef
const refCode = `
  const hasUserStartedFeedRef = useRef(hasUserStartedFeed);
  useEffect(() => {
    hasUserStartedFeedRef.current = hasUserStartedFeed;
  }, [hasUserStartedFeed]);
`;

if (!content2.includes('hasUserStartedFeedRef')) {
    const insertPoint = `  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number } | null>(null);`;
    content2 = content2.replace(insertPoint, insertPoint + '\n' + refCode);
} else if (content2.includes('hasUserStartedFeedRef') && !content2.includes('const hasUserStartedFeedRef')) {
    const insertPoint = `  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number } | null>(null);`;
    content2 = content2.replace(insertPoint, insertPoint + '\n' + refCode);
}

fs.writeFileSync(path2, content2, 'utf8');
