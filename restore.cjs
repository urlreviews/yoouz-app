const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /setFullscreenFeedContext\(null\);[\s\S]*?setCurrentVideoIndex\(previousVideoIndexRef\.current\); \/\/ Restore background feed index[\s\S]*?\} else if \(isCreatorView \|\| isPlaceView\) \{/;

const replacement = `setFullscreenFeedContext(null);
      setSelectedPlaceIdForDrawer(targetVid.placeId);
      setSelectedAuthorForDrawer(null);
      setActiveSection("home");
      
      const vids = videos.filter((v) => v.placeId === targetVid.placeId || v.placeName === targetVid.placeName);
      const idx = vids.findIndex(v => v.id === videoId);
      if (idx !== -1) {
        setCurrentVideoIndex(idx);
      } else {
        setPendingVideoId(videoId);
      }
    }
  };

  // TikTok Back button handler (takes you back to the profile drawer where you came from)
  const handleFeedGoBack = () => {
    // Explicitly pause all videos on the page synchronously to prevent background playback on mobile (e.g. iOS Safari)
    try {
      const vids = document.querySelectorAll("video");
      vids.forEach((v) => {
        try {
          v.pause();
        } catch (e) {}
      });
    } catch (err) {
      console.warn("Failed to pause videos globally on back navigation:", err);
    }

    if (fullscreenFeedContext) {
      if (fullscreenFeedContext.type === "creator" && fullscreenFeedContext.authorData) {
        setSelectedAuthorForDrawer(fullscreenFeedContext.authorData);
        setSelectedPlaceIdForDrawer(null);
      } else if (fullscreenFeedContext.type === "place" && (fullscreenFeedContext.placeData || fullscreenFeedContext.id)) {
        setSelectedPlaceIdForDrawer(fullscreenFeedContext.placeData?.id || fullscreenFeedContext.id || null);
        setSelectedAuthorForDrawer(null);
      } else if (fullscreenFeedContext.type === "profile") {
        handleGoToProfile();
      }
      setFullscreenFeedContext(null);
      setCurrentVideoIndex(previousVideoIndexRef.current);
    } else if (isCreatorView || isPlaceView) {`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
