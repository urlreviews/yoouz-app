const fs = require('fs');
let file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

file = file.replace(
  /  \}, \[videos, onSelectVideoIndex, currentIndex\]\);/g,
  '  }, [videos, onSelectVideoIndex]);'
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', file);
