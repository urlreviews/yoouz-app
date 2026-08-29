const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const regex = /\} else if \(placeId \|\| creatorHandle\) \{([\s\S]*?)type = "video\.other";\n\s*\}/;

const match = server.match(regex);
if (match) {
    const newBlock = `} else if (placeId) {
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
    
    server = server.replace(match[0], newBlock);
    fs.writeFileSync('server.ts', server);
    console.log("Patched server.ts successfully");
} else {
    console.log("Could not find block");
}
