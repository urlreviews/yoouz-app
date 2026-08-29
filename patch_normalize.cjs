const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFeedPagination.ts', 'utf8');

code = code.replace(
  /isLiked: typeof v.isLiked === 'boolean' \? v.isLiked : likedIds.includes\(v.id\),/,
  `isLiked: likedIds.includes(v.id),`
);

code = code.replace(
  /isBookmarked: typeof v.isBookmarked === 'boolean' \? v.isBookmarked : savedIds.includes\(v.id\),/,
  `isBookmarked: savedIds.includes(v.id),`
);

fs.writeFileSync('src/hooks/useFeedPagination.ts', code);
console.log('Patched normalizeReview to force local storage states');
