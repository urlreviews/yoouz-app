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
      const updated = prev.map((v) => {
        if (v.author.handle === authorHandle) {
          return {
            ...v,
            author: {
              ...v.author,
              isFollowed: !v.author.isFollowed
            }
          };
        }
        return v;
      });
      return updated;
    });
    
    setSelectedAuthorForDrawer((prev) => {
      if (prev && prev.handle === authorHandle) {
        return { ...prev, isFollowed: !prev.isFollowed };
      }
      return prev;
    });
  };`;

if(code.includes('isFollowed: !v.author.isFollowed')) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/App.tsx', code, 'utf-8');
   console.log("Updated handleToggleFollow");
} else {
   console.log("Could not find exact text block");
}
