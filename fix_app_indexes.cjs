const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// In handleOpenPlaceDrawer
const oldPlace = /previousVideoIndexRef\.current = currentVideoIndex; \/\/ Save feed index[\s\S]*?setFullscreenFeedContext\(null\);[\s\S]*?setSelectedAuthorForDrawer\(null\);[\s\S]*?setSelectedPlaceIdForDrawer\(placeId\);[\s\S]*?setCurrentVideoIndex\(0\);/;
content = content.replace(oldPlace, `setFullscreenFeedContext(null);
    setSelectedAuthorForDrawer(null);
    setSelectedPlaceIdForDrawer(placeId);`);

// In onOpenCreator inside CopoVideoPlayer instances
content = content.replace(
  /previousVideoIndexRef\.current = currentVideoIndex; \/\/ Save feed index[\s\S]*?setSelectedPlaceIdForDrawer\(null\);[\s\S]*?setSelectedAuthorForDrawer\(author\);[\s\S]*?setCurrentVideoIndex\(0\);/g,
  `setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);`
);

// Specifically the one with setActiveSection("home");
content = content.replace(
  /previousVideoIndexRef\.current = currentVideoIndex; \/\/ Save feed index[\s\S]*?setSelectedPlaceIdForDrawer\(null\);[\s\S]*?setSelectedAuthorForDrawer\(author\);[\s\S]*?setActiveSection\("home"\);[\s\S]*?setCurrentVideoIndex\(0\);/g,
  `setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);
                  setActiveSection("home");`
);

// In CopoCommentsDrawer onSelectAuthor
content = content.replace(
  /setActiveCommentVideo\(null\); \/\/ Close the drawer first[\s\S]*?previousVideoIndexRef\.current = currentVideoIndex; \/\/ Save feed index/g,
  `setActiveCommentVideo(null); // Close the drawer first`
);

// In handleCloseDrawers, remove setCurrentVideoIndex
const oldClose = /\/\/ Restore the index from before the drawer was opened[\s\S]*?setCurrentVideoIndex\(previousVideoIndexRef\.current\);/;
content = content.replace(oldClose, ``);


fs.writeFileSync(path, content, 'utf8');
