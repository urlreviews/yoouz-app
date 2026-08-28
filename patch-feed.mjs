import fs from 'fs';
let content = fs.readFileSync('src/hooks/useFeedPagination.ts', 'utf8');

content = content.replace(
  `      if (filtered.length > 0) {
        setVideos((prev) => {
          const map = new Map<string, VideoReview>();
          // Keep existing local previews/blobs if present
          prev.forEach((v) => map.set(v.id, v));
          // Apply fetched docs
          filtered.forEach((v) => {
            const existing = map.get(v.id);
            map.set(v.id, existing ? { ...v, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : v);
          });
          const list = Array.from(map.values()).filter(v => !deletedIds.includes(v.id));
          list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          return list;
        });`,
  `      setVideos((prev) => {
        const prevMap = new Map<string, VideoReview>();
        prev.forEach((v) => prevMap.set(v.id, v));
        
        // Start with the exact list from Firestore (filtered)
        const nextList = filtered.map(v => {
          const existing = prevMap.get(v.id);
          return existing ? { ...v, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : v;
        });
        
        // Also keep any optimistic local videos that haven't synced to Firestore yet (created in the last 10 seconds)
        const firestoreIds = new Set(filtered.map(v => v.id));
        const now = Date.now();
        prev.forEach(v => {
          if (!firestoreIds.has(v.id) && !deletedIds.includes(v.id)) {
            // Keep it if it's very new (optimistic)
            if (v.createdAtMs && (now - v.createdAtMs < 10000)) {
              nextList.push(v);
            }
          }
        });
        
        nextList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        return nextList;
      });`
);

fs.writeFileSync('src/hooks/useFeedPagination.ts', content);
console.log('Patched useFeedPagination successfully');
