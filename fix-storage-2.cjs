const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

// Strip out chunks logic
const chunkStart = content.indexOf('export async function saveVideoChunksToFirestore');
if (chunkStart !== -1) {
  const chunkEnd = content.indexOf('// ==========================================', chunkStart);
  if (chunkEnd !== -1) {
    content = content.substring(0, chunkStart) + content.substring(chunkEnd);
    fs.writeFileSync('src/lib/videoStorage.ts', content);
    console.log("Stripped chunking methods");
  }
}
