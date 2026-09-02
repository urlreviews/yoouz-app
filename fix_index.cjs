const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add previousVideoIndexRef
const refCode = `  const previousSectionRef = useRef<NavSection | null>(null);
  const previousVideoIndexRef = useRef<number>(0);`;
content = content.replace(/const previousSectionRef = useRef<NavSection \| null>\(null\);/g, refCode);

// 2. Modify handleOpenPlaceDrawer to save the index
const oldHandleOpenPlace = `  const handleOpenPlaceDrawer = (placeId: string) => {
    if (activeSection !== "home") {
      previousSectionRef.current = activeSection;
    }
    setFullscreenFeedContext(null);
    setSelectedAuthorForDrawer(null);
    setSelectedPlaceIdForDrawer(placeId);
    setCurrentVideoIndex(0);
  };`;

const newHandleOpenPlace = `  const handleOpenPlaceDrawer = (placeId: string) => {
    if (activeSection !== "home") {
      previousSectionRef.current = activeSection;
    }
    previousVideoIndexRef.current = currentVideoIndex; // Save feed index
    setFullscreenFeedContext(null);
    setSelectedAuthorForDrawer(null);
    setSelectedPlaceIdForDrawer(placeId);
    setCurrentVideoIndex(0);
  };`;
content = content.replace(oldHandleOpenPlace, newHandleOpenPlace);

// 3. Modify setSelectedAuthorForDrawer inline calls to also save index
// Since there are many, we'll write a simple regex to catch the common pattern in the feed when opening a creator
content = content.replace(
  /onOpenCreator=\{\(author\) => \{[\s]*setSelectedPlaceIdForDrawer\(null\);[\s]*setSelectedAuthorForDrawer\(author\);[\s]*setCurrentVideoIndex\(0\);[\s]*\}\}/g,
  `onOpenCreator={(author) => {
                  previousVideoIndexRef.current = currentVideoIndex; // Save feed index
                  setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);
                  setCurrentVideoIndex(0);
                }}`
);

// Do the same for the one that has setActiveSection("home"); inside it:
content = content.replace(
  /onOpenCreator=\{\(author\) => \{[\s]*setSelectedPlaceIdForDrawer\(null\);[\s]*setSelectedAuthorForDrawer\(author\);[\s]*setActiveSection\("home"\);[\s]*setCurrentVideoIndex\(0\);[\s]*\}\}/g,
  `onOpenCreator={(author) => {
                  previousVideoIndexRef.current = currentVideoIndex; // Save feed index
                  setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);
                  setActiveSection("home");
                  setCurrentVideoIndex(0);
                }}`
);

// Do the same for CopoCommentsDrawer where we open creator profile
content = content.replace(
  /setActiveCommentVideo\(null\); \/\/ Close the drawer first/g,
  `setActiveCommentVideo(null); // Close the drawer first
          previousVideoIndexRef.current = currentVideoIndex; // Save feed index`
);


// 4. Modify handleCloseDrawers to restore the index
const oldHandleClose = `  const handleCloseDrawers = () => {
    setFullscreenFeedContext(null);
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);
    // Removed setCurrentVideoIndex(0) to preserve feed scroll position on close
    if (previousSectionRef.current) {
      setActiveSection(previousSectionRef.current);
      previousSectionRef.current = null;
    }
  };`;

const newHandleClose = `  const handleCloseDrawers = () => {
    setFullscreenFeedContext(null);
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);
    // Restore the index from before the drawer was opened
    setCurrentVideoIndex(previousVideoIndexRef.current);
    if (previousSectionRef.current) {
      setActiveSection(previousSectionRef.current);
      previousSectionRef.current = null;
    }
  };`;
content = content.replace(oldHandleClose, newHandleClose);


fs.writeFileSync(path, content, 'utf8');
