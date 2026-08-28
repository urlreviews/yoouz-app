const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `  const handleToggleFollow = (authorHandle: string) => {`;
const replace = `  const handleOpenShare = async (video: VideoReview) => {
    setActiveShareVideo(video);
    setVideos(prev => prev.map(v => {
      if (v.id === video.id) {
        return { ...v, shares: v.shares + 1 };
      }
      return v;
    }));
    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", video.id);
        setDoc(vidRef, { shares: video.shares + 1 }, { merge: true }).catch(() => {});
      }
    } catch (e) {}
  };

  const handleToggleFollow = (authorHandle: string) => {`;

content = content.replace(target, replace);
content = content.replace(/onOpenShare=\{\(v\) \=\> setActiveShareVideo\(v\)\}/g, 'onOpenShare={handleOpenShare}');

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("Shares fixed");
