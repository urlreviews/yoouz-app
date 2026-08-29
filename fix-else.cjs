const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const oldStr = `        } else {
          const placeParam = params.get('placeName') || params.get('place') || "Local Business";
          const authorParam = params.get('author') || (creatorHandle ? creatorHandle.replace(/^@/, '') : "Verified Customer");
          const ratingParam = parseFloat(params.get('rating') || "5");
          title = \`\${authorParam}'s 60-Second Video Review | Yoouz\`;
          description = \`Watch authentic 60-second customer video review on Yoouz. Real People. Real Reviews.\`;
          imageUrl = \`\${baseUrl}/api/og-image.png?type=video&placeName=\${encodeURIComponent(placeParam)}&author=\${encodeURIComponent(authorParam)}&rating=\${ratingParam}&v=4\`;
          type = "video.other";
          structuredData = {`;

const newStr = `        } else if (placeId) {
          title = \`Authentic Video Reviews for \${placeId} | Yoouz\`;
          description = \`Discover genuine 60-second video testimonials for \${placeId} on Yoouz. 100% Real Video. Zero Fake Text Reviews.\`;
          imageUrl = \`\${baseUrl}/api/og-image.png?type=homepage&v=4\`;
          type = "website";
          structuredData = null;
        } else if (creatorHandle) {
          const cleanHandle = creatorHandle.replace(/^@/, '');
          title = \`@\${cleanHandle}'s Authentic Video Reviews | Yoouz\`;
          description = \`Watch genuine 60-second video testimonials by @\${cleanHandle} on Yoouz.\`;
          imageUrl = \`\${baseUrl}/api/og-image.png?type=creator&author=\${encodeURIComponent(cleanHandle)}&v=4\`;
          type = "profile";
          structuredData = null;
        } else {
          const placeParam = params.get('placeName') || params.get('place') || "Local Business";
          const authorParam = params.get('author') || "Verified Customer";
          const ratingParam = parseFloat(params.get('rating') || "5");
          title = \`\${authorParam}'s 60-Second Video Review | Yoouz\`;
          description = \`Watch authentic 60-second customer video review on Yoouz. Real People. Real Reviews.\`;
          imageUrl = \`\${baseUrl}/api/og-image.png?type=video&placeName=\${encodeURIComponent(placeParam)}&author=\${encodeURIComponent(authorParam)}&rating=\${ratingParam}&v=4\`;
          type = "video.other";
          structuredData = {`;

if (server.includes(oldStr)) {
    server = server.replace(oldStr, newStr);
    fs.writeFileSync('server.ts', server);
    console.log("Patched else block successfully");
} else {
    console.log("Could not find else block string");
}
