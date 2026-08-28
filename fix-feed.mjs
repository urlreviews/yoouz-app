import fs from 'fs';
let content = fs.readFileSync('src/hooks/useFeedPagination.ts', 'utf8');

content = content.replace(
  `        try {
          localStorage.setItem("reviuz_cached_videos", JSON.stringify(filtered.slice(0, 50)));
        } catch (e) {}
      }
      setIsLoading(false);`,
  `        try {
          localStorage.setItem("reviuz_cached_videos", JSON.stringify(filtered.slice(0, 50)));
        } catch (e) {}
      setIsLoading(false);`
);

fs.writeFileSync('src/hooks/useFeedPagination.ts', content);
console.log('Fixed syntax error in useFeedPagination');
