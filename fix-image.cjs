const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const oldStr = `href="\${reviewerPhotoBase64 || bannerBase64 || avatarBase64 || (type === 'homepage' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80' : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80')}"`;
const newStr = `href="\${reviewerPhotoBase64 || bannerBase64 || (type === 'homepage' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80' : (avatarBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwAEhgJq4X3x1QAAAABJRU5ErkJggg=='))}"`;

if (server.includes(oldStr)) {
    server = server.replace(oldStr, newStr);
    fs.writeFileSync('server.ts', server);
    console.log("Patched image fallback successfully");
} else {
    console.log("Could not find image fallback string");
}
