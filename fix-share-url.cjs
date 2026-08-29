const fs = require('fs');
let modal = fs.readFileSync('src/components/CopoShareModal.tsx', 'utf8');

const oldStr = '`${window.location.origin}/@${getCleanHandle(video.author)}/video/${video.id}`';
const newStr = '`${window.location.origin}/@${getCleanHandle(video.author)}/video/${video.id}?ref=x`';

if (modal.includes(oldStr)) {
    modal = modal.replace(oldStr, newStr);
    fs.writeFileSync('src/components/CopoShareModal.tsx', modal);
    console.log("Patched CopoShareModal successfully");
} else {
    console.log("Could not find CopoShareModal string");
}
