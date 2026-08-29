const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const oldStr = `      if (!reviewerPhotoBase64) {
        // High quality authentic human reviewer portrait
        const defaultPhotoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=95';
        try {
          reviewerPhotoBase64 = await fetchBase64(defaultPhotoUrl);
        } catch(e) {}
      }`;

const newStr = `      if (!reviewerPhotoBase64) {
        // Fall back to the author's avatar, or a transparent pixel
        if (avatarBase64) {
          reviewerPhotoBase64 = avatarBase64;
        } else {
          reviewerPhotoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // transparent pixel
        }
      }`;

if (server.includes(oldStr)) {
    server = server.replace(oldStr, newStr);
    fs.writeFileSync('server.ts', server);
    console.log("Patched reviewer photo fallback successfully");
} else {
    console.log("Could not find reviewer photo fallback string");
}
