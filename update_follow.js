const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `  const handleToggleFollow = (authorHandle: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.author.handle === authorHandle
          ? {
              ...v,
              author: {
                ...v.author,
                isFollowed: !v.author.isFollowed
              }
            }
          : v
      )
    );
  };`;

const replacement = `  const handleToggleFollow = (authorHandle: string) => {
    setVideos((prev) => {
      let nextIsFollowed = true;
      const updated = prev.map((v) => {
        if (v.author.handle === authorHandle) {
          nextIsFollowed = !v.author.isFollowed;
          return {
            ...v,
            author: {
              ...v.author,
              isFollowed: nextIsFollowed
            }
          };
        }
        return v;
      });
      return updated;
    });
    
    // Also update selected drawer author to trigger immediate UI refresh
    setSelectedAuthorForDrawer((prev) => {
      if (prev && prev.handle === authorHandle) {
        return { ...prev, isFollowed: !prev.isFollowed };
      }
      return prev;
    });
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Updated handleToggleFollow");
