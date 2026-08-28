const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const oldStorage = `          // Make it public
          await bucket.file(destination).makePublic();
          publicUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket.name}/o/\${encodeURIComponent(destination)}?alt=media\`;
          console.log(\`Successfully mirrored video to Firebase Storage: \${publicUrl}\`);`;

const newStorage = `          const file = bucket.file(destination);
          try {
            await file.makePublic();
            publicUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket.name}/o/\${encodeURIComponent(destination)}?alt=media\`;
          } catch (aclErr: any) {
            // If Uniform Bucket-Level Access is enabled, makePublic fails. Use a signed URL instead.
            const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: '01-01-2100' });
            publicUrl = signedUrl;
          }
          console.log(\`Successfully mirrored video to Firebase Storage: \${publicUrl}\`);`;

if (content.includes("await bucket.file(destination).makePublic();")) {
  content = content.replace(oldStorage, newStorage);
  fs.writeFileSync('server.ts', content);
  console.log("Patched storage URL generation");
} else {
  console.log("Could not find storage block");
}
