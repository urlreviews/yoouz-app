const fs = require('fs');
let code = fs.readFileSync('src/components/CopoShareModal.tsx', 'utf8');

// Replace the hardcoded thumbUrl query param construction
const findStr = `&thumbUrl=\${encodeURIComponent(video.thumbnailUrl || (video as any).videoThumbnail || (video as any).videoPreviewUrl || (video as any).coverUrl || "")}&v=12`;
const repStr = `&thumbUrl=\${encodeURIComponent([video.thumbnailUrl, (video as any).videoThumbnail, (video as any).videoPreviewUrl, (video as any).coverUrl].find(url => url && typeof url === 'string' && !url.startsWith('data:image')) || "")}&v=13`;

code = code.replace(findStr, repStr);
code = code.replace(findStr, repStr); // Replace both occurrences (href and src)

fs.writeFileSync('src/components/CopoShareModal.tsx', code);
console.log("Updated CopoShareModal to prevent base64 URIs in thumbUrl");
