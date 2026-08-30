const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Fix `/api/og-image` handler
const oldHandlerThumb = `let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || foundVideo.author?.avatar || foundVideo.avatar || "";`;
const newHandlerThumb = `let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";`;

code = code.replace(oldHandlerThumb, newHandlerThumb);

// 2. Fix `resolveMetadataForRequest` logic
const metaLogicOld = `            if (!thumbArg && (foundVideo.author?.avatar || foundVideo.avatar)) { 
               thumbArg = foundVideo.author?.avatar || foundVideo.avatar; 
               if (thumbArg && thumbArg.startsWith('data:image')) thumbArg = "";
            }`;

// Replace the avatar fallback logic with empty space
code = code.replace(metaLogicOld, ``);

fs.writeFileSync('server.ts', code);
console.log("Fixed server.ts thumbArg to never fallback to avatar");
