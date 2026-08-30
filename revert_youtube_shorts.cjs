const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
          let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";
          if (thumbArg.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')) {
             thumbArg = "";
          }
          if (thumbArg.length > 0 && thumbArg.length < 1000 && thumbArg.startsWith('data:image')) {
             thumbArg = "";
          }
          if (!thumbArg && (foundVideo.author?.avatar || foundVideo.avatar)) {
             thumbArg = foundVideo.author?.avatar || foundVideo.avatar;
          }
          imageUrl = \`\${baseUrl}/api/og-image.png?type=video&id=\${encodeURIComponent(foundVideo.id)}&placeName=\${encodeURIComponent(placeName)}&author=\${encodeURIComponent(authorName)}&rating=\${rating}&caption=\${encodeURIComponent(caption)}&thumbUrl=\${encodeURIComponent(thumbArg)}&v=6\`;
`;

code = code.replace(
  /const thumbArg = foundVideo\.videoThumbnail[\s\S]*?imageUrl = `\$\{baseUrl\}\/og-banner\.png\?v=5`;\n          \}/,
  replacement
);

fs.writeFileSync('server.ts', code);
console.log("Reverted to using the proxy, handling transparent pixels");
