const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const oldMeta = `      } else if (placeId || creatorHandle) {
        // Fallback for paths without video ID
        const placeParam = placeId || "Business";
        const authorParam = creatorHandle || "Reviewer";
        const ratingParam = params.get('rating') || "5";

        title = \`\${authorParam}'s 60s Video Review of \${placeParam} | Yoouz\`;
        description = \`"Video review for \${placeParam}" — Watch the authentic 60-second video review by \${authorParam} for \${placeParam} on Yoouz. 100% Real Video. Zero Fake Text Reviews.\`;
        imageUrl = \`\${baseUrl}/api/og-image.png?type=video&placeName=\${encodeURIComponent(placeParam)}&author=\${encodeURIComponent(authorParam)}&rating=\${ratingParam}&v=4\`;
        type = "video.other";
      }`;

const newMeta = `      } else if (placeId) {
        // Place / Business profile
        const placeParam = placeId || "Business";
        title = \`Authentic Video Reviews for \${placeParam} | Yoouz\`;
        description = \`Discover genuine 60-second video testimonials for \${placeParam} on Yoouz. 100% Real Video. Zero Fake Text Reviews.\`;
        imageUrl = \`\${baseUrl}/api/og-image.png?type=homepage&v=4\`;
        type = "website";
      } else if (creatorHandle) {
        // Creator profile
        const authorParam = creatorHandle || "Creator";
        title = \`\${authorParam}'s Authentic Video Reviews | Yoouz\`;
        description = \`Watch genuine 60-second video testimonials by \${authorParam} on Yoouz.\`;
        imageUrl = \`\${baseUrl}/api/og-image.png?type=homepage&v=4\`;
        type = "profile";
      }`;

if (server.includes(oldMeta)) {
    server = server.replace(oldMeta, newMeta);
    fs.writeFileSync('server.ts', server);
    console.log("Patched server.ts successfully");
} else {
    console.log("Could not find old metadata block");
}
