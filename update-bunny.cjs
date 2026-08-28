const fs = require('fs');

let envExample = fs.readFileSync('.env.example', 'utf8');
if (!envExample.includes('BUNNY_STORAGE_API_KEY')) {
  envExample += `
# Bunny CDN Video Hosting (Optional, overrides local/firebase storage)
BUNNY_STORAGE_API_KEY=
BUNNY_STORAGE_ZONE_NAME=
BUNNY_PULL_ZONE_URL=
BUNNY_STORAGE_REGION=
`;
  fs.writeFileSync('.env.example', envExample);
}

let serverCode = fs.readFileSync('server.ts', 'utf8');
const bunnyUploadCode = `
      let publicUrl = \`/api/videos/stream/\${cleanFileName}\`;
      let thumbnailUrl = "";
      console.log(\`✅ [Server] Stored video \${cleanFileName} (\${fs.statSync(filePath).size} bytes) at \${filePath}\`);

      // 🐰 Bunny CDN Integration
      const bunnyAccessKey = process.env.BUNNY_STORAGE_API_KEY;
      const bunnyStorageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
      const bunnyPullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;
      const bunnyRegion = process.env.BUNNY_STORAGE_REGION || "";

      if (bunnyAccessKey && bunnyStorageZone && bunnyPullZoneUrl) {
        console.log("🐰 [Server] Uploading to Bunny CDN...");
        try {
          const hostname = bunnyRegion ? \`\${bunnyRegion}.storage.bunnycdn.com\` : 'storage.bunnycdn.com';
          const bunnyUrl = \`https://\${hostname}/\${bunnyStorageZone}/videos/\${cleanFileName}\`;
          
          const fileBuffer = fs.readFileSync(filePath);
          const response = await fetch(bunnyUrl, {
            method: 'PUT',
            headers: {
              'AccessKey': bunnyAccessKey,
              'Content-Type': mimeType,
            },
            body: fileBuffer
          });

          if (response.ok) {
            console.log("🐰 [Server] Successfully uploaded to Bunny CDN!");
            const pullZoneDomain = bunnyPullZoneUrl.replace(/\\/$/, '');
            publicUrl = \`\${pullZoneDomain}/videos/\${cleanFileName}\`;
          } else {
            console.error("🐰 [Server] Failed to upload to Bunny CDN:", await response.text());
          }
        } catch (bunnyErr) {
          console.error("🐰 [Server] Error uploading to Bunny CDN:", bunnyErr);
        }
      }
`;

serverCode = serverCode.replace(
  /let publicUrl = `\/api\/videos\/stream\/\$\{cleanFileName\}`;[\s\S]*?\/\/ Mirror to Firebase Storage if bucket is configured/,
  bunnyUploadCode + "\n      // Mirror to Firebase Storage if bucket is configured"
);

fs.writeFileSync('server.ts', serverCode);
console.log("Done");
