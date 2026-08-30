const fs = require('fs');

let code = fs.readFileSync('src/components/CopoShareModal.tsx', 'utf8');

// 1. Add cleanDomainName to the file if missing
if (!code.includes('cleanDomainName(')) {
   const importsEndIndex = code.indexOf('\n\n', code.indexOf('import'));
   const cleanDomainNameFn = `
function cleanDomainName(urlStr: string) {
  if (!urlStr) return "";
  try {
     let lower = urlStr.trim().toLowerCase();
     if (lower.startsWith('http')) {
        const u = new URL(lower);
        return u.hostname.replace(/^www\\./, '');
     }
     return lower.replace(/^(https?:\\/\\/)?(www\\.)?/i, '').split('/')[0];
  } catch(e) {
     return urlStr.replace(/^(https?:\\/\\/)?(www\\.)?/i, '').split('/')[0];
  }
}
`;
   code = code.substring(0, importsEndIndex) + cleanDomainNameFn + code.substring(importsEndIndex);
}

// 2. Fix the URLs in href and src
const ogImgRegex = /\/api\/og-image\.png\?type=video&id=\$\{encodeURIComponent\(video\.id\)\}&placeName=\$\{encodeURIComponent\(video\.placeName \|\| "Business"\)\}&author=\$\{encodeURIComponent\(video\.author\?\.name \|\| "Reviewer"\)\}&rating=\$\{video\.rating \|\| 5\}&caption=\$\{encodeURIComponent\(video\.caption \|\| ""\)\}&thumbUrl=\$\{encodeURIComponent\(video\.videoThumbnail \|\| video\.videoPreviewUrl \|\| video\.author\?\.avatar \|\| ""\)\}&v=8/g;

const newOgImg = `/api/og-image.png?type=video&id=\${encodeURIComponent(video.id)}&placeName=\${encodeURIComponent(cleanDomainName(video.placeName || "Business"))}&author=\${encodeURIComponent(video.author?.name || "Reviewer")}&rating=\${video.rating || 5}&caption=\${encodeURIComponent(video.caption || "")}&thumbUrl=\${encodeURIComponent(video.thumbnailUrl || (video as any).videoThumbnail || video.author?.avatar || "")}&v=10`;

code = code.replace(ogImgRegex, newOgImg);

// 3. Fix the display text "Watch {author}'s authentic 60-second video review of {place}..."
const shareTextRegex = /video\.author\?\.name \|\| "Reviewer"\}'s authentic 60-second video review of \$\{video\.placeName \|\| "a local business"\}/g;
const newShareText = `video.author?.name || "Reviewer"}'s authentic 60-second video review of \${cleanDomainName(video.placeName || "a local business")}`;
code = code.replace(shareTextRegex, newShareText);

// Fix the other one in LinkedIn or WhatsApp share
const shareTextRegex2 = /video\.author\?\.name \|\| 'Someone'\}'s authentic 60s video review of \$\{video\.placeName \|\| 'a local business'\}/g;
const newShareText2 = `video.author?.name || 'Someone'}'s authentic 60s video review of \${cleanDomainName(video.placeName || 'a local business')}`;
code = code.replace(shareTextRegex2, newShareText2);

// Fix the title preview
const titlePreviewRegex = /\{isVideoMode && video \? `\$\{video\.author\?\.name\}'s 60s review of \$\{video\.placeName\}` : title\}/g;
const newTitlePreview = `{isVideoMode && video ? \`\${video.author?.name}'s 60s review of \${cleanDomainName(video.placeName)}\` : title}`;
code = code.replace(titlePreviewRegex, newTitlePreview);

fs.writeFileSync('src/components/CopoShareModal.tsx', code);
console.log("Fixed CopoShareModal.tsx");
