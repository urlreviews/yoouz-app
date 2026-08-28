import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `<CopoVideoPlayer
              onLoadMore={loadMoreVideos}`,
  `<CopoVideoPlayer
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onLoadMore={loadMoreVideos}`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched App.tsx props');
