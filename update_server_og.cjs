const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add cleanDomainName utility
if (!code.includes('function cleanDomainName')) {
  const cleanFn = `
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
  code = code.replace('function injectOpenGraphTags', cleanFn + '\nfunction injectOpenGraphTags');
}

// 2. Clean placeName in resolveMetadataForRequest
const metaResolveMatch = /const placeName = foundVideo\.placeName \|\| "Local Business";/;
if (code.match(metaResolveMatch)) {
  code = code.replace(metaResolveMatch, 'const placeName = cleanDomainName(foundVideo.placeName || "") || foundVideo.placeName || "Local Business";');
}

fs.writeFileSync('server.ts', code);
console.log("Updated resolveMetadataForRequest with cleanDomainName");
