const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Update imports
const importRegex = /import \{ adminAuth, adminDb \} from "\.\/src\/lib\/firebase-admin\.ts";/;
const newImport = `import { adminAuth, adminDb, adminStorage } from "./src/lib/firebase-admin.ts";`;
content = content.replace(importRegex, newImport);

// 2. Update /api/videos/upload
const oldUploadEndpoint = `      if (!cleanFileName) {
        cleanFileName = path.basename(filePath);
      }

      let publicUrl = \`/api/videos/stream/\${cleanFileName}\`;

      return res.json({ success: true, url: publicUrl, fileName: cleanFileName });
    } catch (err: any) {`;

const newUploadEndpoint = `      if (!cleanFileName) {
        cleanFileName = path.basename(filePath);
      }

      let publicUrl = \`/api/videos/stream/\${cleanFileName}\`;
      
      // Attempt to mirror to Firebase Storage for permanent CDN delivery
      if (adminStorage) {
        try {
          const bucket = adminStorage.bucket();
          const destination = \`videos/\${cleanFileName}\`;
          await bucket.upload(filePath, {
            destination,
            metadata: {
              contentType: mimeType,
              cacheControl: 'public, max-age=31536000'
            }
          });
          // Make it public
          await bucket.file(destination).makePublic();
          publicUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket.name}/o/\${encodeURIComponent(destination)}?alt=media\`;
          console.log(\`Successfully mirrored video to Firebase Storage: \${publicUrl}\`);
        } catch (storageErr: any) {
          console.warn("Failed to mirror video to Firebase Storage (using local fallback):", storageErr.message);
        }
      }

      return res.json({ success: true, url: publicUrl, fileName: cleanFileName });
    } catch (err: any) {`;

if (content.includes("let publicUrl = `/api/videos/stream/${cleanFileName}`;")) {
  content = content.replace(oldUploadEndpoint, newUploadEndpoint);
  fs.writeFileSync('server.ts', content);
  console.log("Patched server.ts successfully");
} else {
  console.log("Could not find upload endpoint to patch");
}
