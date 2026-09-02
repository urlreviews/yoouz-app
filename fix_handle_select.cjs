const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// In handleSelectVideoById
content = content.replace(
  /if \(source === "creator" \|\| isCreatorView\) \{/,
  `previousVideoIndexRef.current = currentVideoIndex; // Save background feed index before going fullscreen
    if (source === "creator" || isCreatorView) {`
);

// In handleFeedGoBack
content = content.replace(
  /setFullscreenFeedContext\(null\);[\s\S]*?\} else if \(isCreatorView \|\| isPlaceView\)/,
  `setFullscreenFeedContext(null);
      setCurrentVideoIndex(previousVideoIndexRef.current); // Restore background feed index
    } else if (isCreatorView || isPlaceView)`
);

fs.writeFileSync(path, content, 'utf8');
