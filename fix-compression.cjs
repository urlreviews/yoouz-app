const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');
content = content.replace(
  `      if (!finalThumbnailUrl && result.posterDataUrl) {
        finalThumbnailUrl = result.posterDataUrl;
      }`,
  `      // Banned Base64 usage
      // if (!finalThumbnailUrl && result.posterDataUrl) {
      //   finalThumbnailUrl = result.posterDataUrl;
      // }`
);
fs.writeFileSync('src/lib/videoStorage.ts', content);

// Let's also check ensureUrlSizeLimit
content = content.replace(
  `    thumbnailUrl: ensureUrlSizeLimit(finalThumbnailUrl || \`https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80\`),`,
  `    thumbnailUrl: finalThumbnailUrl?.startsWith("http") ? finalThumbnailUrl : \`https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80\`,`
);
fs.writeFileSync('src/lib/videoStorage.ts', content);

