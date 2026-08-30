const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /imageUrl = \\\`\\\$\{baseUrl\}\/api\/og-image\.png\?type=video&id=\\\$\{encodeURIComponent\(foundVideo\.id\)\}&placeName=\\\$\{encodeURIComponent\(placeName\)\}&author=\\\$\{encodeURIComponent\(authorName\)\}&rating=\\\$\{rating\}&caption=\\\$\{encodeURIComponent\(caption\)\}&v=4\\\`;/;

const replacementStr = `const thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || foundVideo.avatar || foundVideo.author?.avatar || "";
          imageUrl = \`\${baseUrl}/api/og-image.png?type=video&id=\${encodeURIComponent(foundVideo.id)}&placeName=\${encodeURIComponent(placeName)}&author=\${encodeURIComponent(authorName)}&rating=\${rating}&caption=\${encodeURIComponent(caption)}&thumbUrl=\${encodeURIComponent(thumbArg)}&v=4\`;`;

code = code.replace(regex, replacementStr);
fs.writeFileSync('server.ts', code);
console.log("Patched via regex");
