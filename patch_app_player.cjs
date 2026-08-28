const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(
  /<CopoVideoPlayer\s+videos={activeFeedVideos}/,
  '<CopoVideoPlayer\n              onLoadMore={loadMoreVideos}\n              videos={activeFeedVideos}'
);

fs.writeFileSync('src/App.tsx', file);
