const fs = require('fs');

// 1. Fix App.tsx handleToggleFollow and handleToggleFollowPlace
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

const targetFollowAuthor = `  const handleToggleFollow = (authorHandle: string) => {
    let newFollowState = true;
    
    setVideos((prev) => {
      // Find the current state from the first matching video
      const firstMatch = prev.find(v => v.author.handle === authorHandle);
      if (firstMatch) {
        newFollowState = !firstMatch.author.isFollowed;
      }

      return prev.map((v) => {
        if (v.author.handle === authorHandle) {
          return {
            ...v,
            author: {
              ...v.author,
              isFollowed: newFollowState
            }
          };
        }
        return v;
      });
    });
    
    setSelectedAuthorForDrawer((prev) => {
      if (prev && prev.handle === authorHandle) {
        return { ...prev, isFollowed: newFollowState };
      }
      return prev;
    });
  };`;

const replaceFollowAuthor = `  const handleToggleFollow = (authorHandle: string) => {
    let newFollowState = true;
    
    setVideos((prev) => {
      const firstMatch = prev.find(v => v.author.handle === authorHandle);
      if (firstMatch) {
        newFollowState = !firstMatch.author.isFollowed;
      }

      return prev.map((v) => {
        if (v.author.handle === authorHandle) {
          return { ...v, author: { ...v.author, isFollowed: newFollowState } };
        }
        return v;
      });
    });
    
    try {
      const stored = localStorage.getItem("copo_followed_authors") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(authorHandle)) followed.push(authorHandle);
      else if (!newFollowState) followed = followed.filter(h => h !== authorHandle);
      localStorage.setItem("copo_followed_authors", JSON.stringify(followed));
    } catch(e) {}
    
    setSelectedAuthorForDrawer((prev) => {
      if (prev && prev.handle === authorHandle) {
        return { ...prev, isFollowed: newFollowState };
      }
      return prev;
    });
  };`;

appCode = appCode.replace(targetFollowAuthor, replaceFollowAuthor);

const targetFollowPlace = `  const handleToggleFollowPlace = (placeId: string) => {
    setPlaces((prev) => {
      const updated = prev.map((p) =>
        p.id === placeId ? { ...p, isFollowed: !p.isFollowed } : p
      );
      return updated;
    });
  };`;

const replaceFollowPlace = `  const handleToggleFollowPlace = (placeId: string) => {
    let newFollowState = true;
    setPlaces((prev) => {
      const updated = prev.map((p) => {
        if (p.id === placeId) {
          newFollowState = !p.isFollowed;
          return { ...p, isFollowed: newFollowState };
        }
        return p;
      });
      return updated;
    });
    
    try {
      const stored = localStorage.getItem("copo_followed_places") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(placeId)) followed.push(placeId);
      else if (!newFollowState) followed = followed.filter(id => id !== placeId);
      localStorage.setItem("copo_followed_places", JSON.stringify(followed));
    } catch(e) {}
  };`;

appCode = appCode.replace(targetFollowPlace, replaceFollowPlace);
fs.writeFileSync('src/App.tsx', appCode, 'utf-8');
console.log("Updated App.tsx");

// 2. Fix useFeedPagination.ts to hydrate isFollowed
let feedCode = fs.readFileSync('src/hooks/useFeedPagination.ts', 'utf-8');
const targetFeed = `        // Start with the exact list from Firestore (filtered)
        const nextList = filtered.map(v => {
          const existing = prevMap.get(v.id);
          return existing ? { ...v, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : v;
        });`;

const replaceFeed = `        let followedAuthors = [];
        try { followedAuthors = JSON.parse(localStorage.getItem("copo_followed_authors") || "[]"); } catch(e){}

        // Start with the exact list from Firestore (filtered)
        const nextList = filtered.map(v => {
          const existing = prevMap.get(v.id);
          const isFollowed = followedAuthors.includes(v.author.handle);
          const updatedV = { ...v, author: { ...v.author, isFollowed } };
          return existing ? { ...updatedV, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : updatedV;
        });`;

feedCode = feedCode.replace(targetFeed, replaceFeed);
fs.writeFileSync('src/hooks/useFeedPagination.ts', feedCode, 'utf-8');
console.log("Updated useFeedPagination.ts");
