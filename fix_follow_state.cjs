const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `  const handleToggleFollow = (authorHandle: string) => {
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

const replacement = `  const handleToggleFollow = (authorHandle: string) => {
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

if(code.includes('setSelectedAuthorForDrawer((prev) => {')) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/App.tsx', code, 'utf-8');
   console.log("Updated handleToggleFollow robustness");
} else {
   console.log("Could not find exact text block");
}
