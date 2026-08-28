import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const handleAdminDeleteVideo = async[\s\S]*?return updated;\n    }\);/g, 
  `const handleAdminDeleteVideo = async (id: string) => {
    // 1. Instantly remove from local videos state
    setVideos(prev => {
      const updated = prev.filter(v => v.id !== id);
      try {
        // Save to deleted videos list to prevent re-merging from any cache
        const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
        let deletedVideos: string[] = [];
        try { deletedVideos = JSON.parse(deletedStr); } catch(e){}
        if (!deletedVideos.includes(id)) {
          deletedVideos.push(id);
          localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedVideos));
        }
        const cached = localStorage.getItem("reviuz_cached_videos");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            localStorage.setItem("reviuz_cached_videos", JSON.stringify(parsed.filter(v => v.id !== id)));
          }
        }
      } catch (e) {}
      return updated;
    });`);

code = code.replace(/const handleAdminBulkDeleteVideos = async[\s\S]*?return updated;\n    }\);/g,
  `const handleAdminBulkDeleteVideos = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    // 1. Instantly remove from local videos state
    setVideos(prev => {
      const updated = prev.filter(v => !ids.includes(v.id));
      try {
        // Save deleted video IDs to prevent re-merging
        const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
        let deletedVideos: string[] = [];
        try { deletedVideos = JSON.parse(deletedStr); } catch(e){}
        ids.forEach(id => {
          if (!deletedVideos.includes(id)) {
            deletedVideos.push(id);
          }
        });
        localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedVideos));
        
        const cached = localStorage.getItem("reviuz_cached_videos");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            localStorage.setItem("reviuz_cached_videos", JSON.stringify(parsed.filter(v => !ids.includes(v.id))));
          }
        }
      } catch (e) {}
      return updated;
    });`);

fs.writeFileSync('src/App.tsx', code);
