const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldBlock = `            if (foundVideo) {
              let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";
              if (!thumbArg.startsWith('data:image')) {
                 try {
                    const tr = await fetch(thumbArg);
                    thumbBuf = Buffer.from(await tr.arrayBuffer());
                 } catch(e) {}
              }
            }`;

const newBlock = `            if (foundVideo) {
              let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";
              if (thumbArg.startsWith('data:image')) {
                 try {
                    const b64 = thumbArg.split(',')[1];
                    if (b64) thumbBuf = Buffer.from(b64, 'base64');
                 } catch(e) {}
              } else if (thumbArg) {
                 try {
                    const tr = await fetch(thumbArg);
                    thumbBuf = Buffer.from(await tr.arrayBuffer());
                 } catch(e) {}
              }
            }`;

if (code.includes(oldBlock)) {
    code = code.replace(oldBlock, newBlock);
    fs.writeFileSync('server.ts', code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find block!");
}
