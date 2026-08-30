const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
          const thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";
          
          if (thumbArg) {
            imageUrl = thumbArg.startsWith('http') ? thumbArg : \`\${baseUrl}\${thumbArg.startsWith('/') ? '' : '/'}\${thumbArg}\`;
          } else if (foundVideo.author?.avatar || foundVideo.avatar) {
            const av = foundVideo.author?.avatar || foundVideo.avatar;
            imageUrl = av.startsWith('http') ? av : \`\${baseUrl}\${av.startsWith('/') ? '' : '/'}\${av}\`;
          } else {
            imageUrl = \`\${baseUrl}/og-banner.png?v=5\`;
          }
`;

code = code.replace(
  /const thumbArg = foundVideo\.videoThumbnail[\s\S]*?imageUrl = `\$\{baseUrl\}\/api\/og-image\.png\?type=video&id=\$\{encodeURIComponent\(foundVideo\.id\)\}.*?v=5`;/,
  replacement
);

fs.writeFileSync('server.ts', code);
console.log("Patched to use raw thumbnail like YouTube Shorts");
