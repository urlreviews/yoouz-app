import fs from 'fs';
const file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf-8');
console.log(file.includes('videos = videos.filter') || file.includes('setVideos('));
