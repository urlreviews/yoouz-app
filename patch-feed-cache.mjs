import fs from 'fs';
let content = fs.readFileSync('src/hooks/useFeedPagination.ts', 'utf8');

content = content.replace(
  `          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            const valid = data.videos.filter((v: any) => !deletedIds.includes(v.id));
            if (valid.length > 0) {
              setVideos((prev) => {
                const map = new Map<string, VideoReview>();
                prev.forEach((v) => map.set(v.id, v));
                valid.forEach((v: VideoReview) => map.set(v.id, { ...map.get(v.id), ...v }));
                const merged = Array.from(map.values());
                merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
                return merged;
              });
            }
          }`,
  `          if (data && Array.isArray(data.videos)) {
            const valid = data.videos.filter((v: any) => !deletedIds.includes(v.id));
            setVideos((prev) => {
              if (valid.length === 0) {
                // Server says 0 videos. Keep only newly created optimistic ones
                return prev.filter(v => v.createdAtMs && (Date.now() - v.createdAtMs < 10000) && !deletedIds.includes(v.id));
              }
              const map = new Map<string, VideoReview>();
              prev.forEach((v) => map.set(v.id, v));
              valid.forEach((v: VideoReview) => map.set(v.id, { ...map.get(v.id), ...v }));
              const merged = Array.from(map.values());
              merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
              return merged;
            });
          }`
);

fs.writeFileSync('src/hooks/useFeedPagination.ts', content);
console.log('Patched useFeedPagination cache fetch logic');
