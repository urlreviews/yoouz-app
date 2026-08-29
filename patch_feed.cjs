const fs = require('fs');
const file = 'src/hooks/useFeedPagination.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
    const loadServerData = async () => {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(deletedStr); } catch (e) {}
      
      let fetchedVideos = null;
      try {
        const res = await fetch("/api/videos/feed");
        if (res.ok && active) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data && Array.isArray(data.videos) && data.videos.length > 0) {
              fetchedVideos = data.videos;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch /api/videos/feed, falling back to static seed");
      }

      if (!fetchedVideos && active) {
        try {
          const fallbackRes = await fetch("/seed-reviews.json");
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (Array.isArray(fallbackData) && fallbackData.length > 0) {
              fetchedVideos = fallbackData;
            }
          }
        } catch(e) {
          console.warn("Fallback seed fetch failed");
        }
      }

      if (fetchedVideos && active) {
        const valid = fetchedVideos.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
        setVideos((prev) => {
          const map = new Map<string, VideoReview>();
          prev.forEach((v) => {
            if (v.createdAtMs && (Date.now() - v.createdAtMs < 60000)) {
              map.set(v.id, v);
            }
          });
          valid.forEach((v: VideoReview) => map.set(v.id, { ...map.get(v.id), ...v }));
          const merged = Array.from(map.values());
          merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          return merged;
        });
        setIsLoading(false);
      }
    };
`;

const origRegex = /const loadServerData = async \(\) => \{[\s\S]*?loadServerData\(\);/;

code = code.replace(origRegex, replacement.trim() + '\n    loadServerData();');
fs.writeFileSync(file, code, 'utf8');
