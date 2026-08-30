const fs = require('fs');
let code = fs.readFileSync('src/components/CopoShareModal.tsx', 'utf8');

const oldRegex = /\/api\/og-image\.png\?type=video&id=\$\{encodeURIComponent\(video\.id\)\}&placeName=\$\{encodeURIComponent\(cleanDomainName\(video\.placeName \|\| "Business"\)\)\}&author=\$\{encodeURIComponent\(video\.author\?\.name \|\| "Reviewer"\)\}&rating=\$\{video\.rating \|\| 5\}&caption=\$\{encodeURIComponent\(video\.caption \|\| ""\)\}&thumbUrl=\$\{encodeURIComponent\(video\.thumbnailUrl \|\| \(video as any\)\.videoThumbnail \|\| \(video as any\)\.videoPreviewUrl \|\| video\.author\?\.avatar \|\| ""\)\}&v=11/g;

const newImgUrl = `/api/og-image.png?type=video&id=\${encodeURIComponent(video.id)}&placeName=\${encodeURIComponent(cleanDomainName(video.placeName || "Business"))}&author=\${encodeURIComponent(video.author?.name || "Reviewer")}&rating=\${video.rating || 5}&caption=\${encodeURIComponent(video.caption || "")}&thumbUrl=\${encodeURIComponent(video.thumbnailUrl || (video as any).videoThumbnail || (video as any).videoPreviewUrl || (video as any).coverUrl || "")}&v=12`;

code = code.replace(oldRegex, newImgUrl);

fs.writeFileSync('src/components/CopoShareModal.tsx', code);
console.log("Updated Share Modal to remove avatar fallback completely");
