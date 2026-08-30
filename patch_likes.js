const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch handleToggleLike
code = code.replace(
  /const handleToggleLike = async \(videoId: string\) => \{/,
  `const handleToggleLike = async (videoId: string) => {
    if (!currentUser) {
      setAuthIntent("like");
      setIsAuthModalOpen(true);
      return;
    }`
);

code = code.replace(
  /fetch\("\/api\/videos\/save-review", \{\n\s*method: "POST",\n\s*headers: \{ "Content-Type": "application\/json" \},\n\s*body: JSON.stringify\(\{ id: videoId, likes: nextLikes \}\)\n\s*\}\)/,
  `fetch("/api/interactions/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, isLiked: nextIsLiked, likesCount: nextLikes, userId: currentUser?.email || auth.currentUser?.uid })
      })`
);

// Patch handleToggleBookmark
code = code.replace(
  /const handleToggleBookmark = async \(videoId: string\) => \{/,
  `const handleToggleBookmark = async (videoId: string) => {
    if (!currentUser) {
      setAuthIntent("bookmarks");
      setIsAuthModalOpen(true);
      return;
    }`
);

code = code.replace(
  /fetch\("\/api\/videos\/save-review", \{\n\s*method: "POST",\n\s*headers: \{ "Content-Type": "application\/json" \},\n\s*body: JSON.stringify\(\{ id: videoId, bookmarksCount: nextCount \}\)\n\s*\}\)/,
  `fetch("/api/interactions/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, isBookmarked: nextBookmarked, bookmarksCount: nextCount, userId: currentUser?.email || auth.currentUser?.uid })
      })`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx');
