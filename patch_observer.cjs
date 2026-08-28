const fs = require('fs');
let file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

file = file.replace(
  /  \}, \[videos, onSelectVideoIndex\]\);/g,
  '  }, [videos, onSelectVideoIndex, currentIndex]);'
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', file);
