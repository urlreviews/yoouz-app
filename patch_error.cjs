const fs = require('fs');
let file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

file = file.replace(
  /const handleVideoError = \(vidId: string\) => \{[\s\S]*?setFailedVideoIds\(\(prev\) => \(\{ \.\.\.prev, \[vidId\]: true \}\)\);\s*\};/,
  `const handleVideoError = (vidId: string, idx: number) => {
    const el = videoRefs.current[idx];
    if (el && el.src !== "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4") {
      el.src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      el.load();
      if (idx === currentIndexRef.current && isPlaying) {
        el.muted = isMuted;
        el.play().catch(() => {
          el.muted = true;
          el.play().catch(() => {});
        });
      }
    }
    setFailedVideoIds((prev) => ({ ...prev, [vidId]: true }));
  };`
);

file = file.replace(
  /onError=\{\(\) => \{\s*if \(isCardActive\) \{\s*handleVideoError\(vid\.id\);\s*\}\s*\}\}/g,
  `onError={() => handleVideoError(vid.id, idx)}`
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', file);
