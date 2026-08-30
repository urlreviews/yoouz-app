const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const targetStart = `app.get(['/api/og-image', '/api/og-image.png', '/og-banner.png', '/og-image.png'], async (req: any, res: any) => {`;
const startIndex = code.indexOf(targetStart);
if (startIndex === -1) {
    console.log("Could not find start index");
    process.exit(1);
}

// Find matching closing brace
let endIndex = -1;
let depth = 0;
for (let i = startIndex + targetStart.length - 1; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}') {
        depth--;
        if (depth === 0) {
            if (code.substring(i, i + 3).includes(');')) {
               endIndex = code.indexOf(');', i) + 2;
               break;
            }
        }
    }
}

if (endIndex === -1) {
    console.log("Could not find end index");
    process.exit(1);
}

const newRoute = `app.get(['/api/og-image', '/api/og-image.png', '/og-banner.png', '/og-image.png'], async (req: any, res: any) => {
    try {
      let type = (req.query.type as string) || "homepage";

      if (type === 'video') {
         const videoId = req.query.id;
         let thumbBuf;
         
         if (videoId) {
            let foundVideo: any = null;
            if (typeof adminDb !== 'undefined' && adminDb) {
              try {
                const snap = await adminDb.collection("videoReviews").doc(videoId).get();
                if (snap.exists) foundVideo = { id: snap.id, ...snap.data() };
              } catch (e) {}
            }
            if (!foundVideo && typeof getDb !== 'undefined' && getDb()) {
              try {
                const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, videoId));
                if (rec) foundVideo = { id: rec.id, ...rec.data };
              } catch (e) {}
            }
            
            if (foundVideo) {
              let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || foundVideo.author?.avatar || foundVideo.avatar || "";
              if (!thumbArg.startsWith('data:image')) {
                 try {
                    const tr = await fetch(thumbArg);
                    thumbBuf = Buffer.from(await tr.arrayBuffer());
                 } catch(e) {}
              }
            }
         }
         
         if (!thumbBuf && req.query.thumbUrl) {
           const tUrl = req.query.thumbUrl as string;
           if (!tUrl.startsWith('data:image')) {
             try {
                const tr = await fetch(tUrl);
                thumbBuf = Buffer.from(await tr.arrayBuffer());
             } catch(e) {}
           }
         }
         
         if (!thumbBuf) {
            const ogBannerPath = path.join(process.cwd(), 'public', 'og-banner.png');
            if (fs.existsSync(ogBannerPath)) {
               thumbBuf = await sharp(ogBannerPath).resize(1200, 630, { fit: 'cover' }).png().toBuffer();
            } else {
               thumbBuf = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
            }
         }

         const playButtonSvg = \`
           <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
             <rect width="1200" height="630" fill="#000000" fill-opacity="0.2"/>
             <g transform="translate(560, 275)">
               <circle cx="40" cy="40" r="40" fill="#000000" fill-opacity="0.6"/>
               <path d="M30 25l26 15-26 15V25z" fill="#ffffff"/>
             </g>
           </svg>
         \`;
         
         const finalImage = await sharp(thumbBuf)
           .resize(1200, 630, { fit: 'cover' })
           .composite([{ input: Buffer.from(playButtonSvg), top: 0, left: 0 }])
           .png()
           .toBuffer();
         
         res.setHeader("Content-Type", "image/png");
         res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
         return res.end(finalImage);
      }

      // Default fallback for non-video OG images
      const ogBannerPath = path.join(process.cwd(), 'public', 'og-banner.png');
      let fallbackBuf;
      if (fs.existsSync(ogBannerPath)) {
         fallbackBuf = await sharp(ogBannerPath).resize(1200, 630, { fit: 'cover' }).png().toBuffer();
      } else {
         fallbackBuf = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
      }
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.end(fallbackBuf);
    } catch (e: any) {
      console.error("OG Image Error:", e);
      return res.status(500).send("Error generating image");
    }
  });`;

code = code.substring(0, startIndex) + newRoute + code.substring(endIndex);
fs.writeFileSync('server.ts', code);
console.log("Reverted OG image to simple play button");
