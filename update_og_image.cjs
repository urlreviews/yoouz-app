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
            // Found the closing brace for the route handler. 
            // the route is app.get(..., (req, res) => { ... });
            // So there's a ); after the }
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
      let rating = parseFloat(req.query.rating as string) || 0;
      let author = (req.query.author as string) || "";
      let placeName = (req.query.placeName as string) || (req.query.place as string) || "";
      placeName = cleanDomainName(placeName) || placeName; // Use clean Domain Name for display
      let caption = (req.query.caption as string) || "";

      if (type === 'video') {
         const videoId = req.query.id;
         let thumbBuf;
         let avatarBuf;
         
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
              let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";
              if (!thumbArg.startsWith('data:image')) {
                 try {
                    const tr = await fetch(thumbArg);
                    thumbBuf = Buffer.from(await tr.arrayBuffer());
                 } catch(e) {}
              }
              
              let avArg = foundVideo.author?.avatar || foundVideo.avatar || "";
              if (avArg && !avArg.startsWith('data:image')) {
                 try {
                    const ar = await fetch(avArg);
                    avatarBuf = Buffer.from(await ar.arrayBuffer());
                 } catch(e) {}
              }
              if (!author) author = foundVideo.author?.name || foundVideo.authorName || "Reviewer";
              if (!rating) rating = foundVideo.rating || 5;
              if (!placeName) placeName = cleanDomainName(foundVideo.placeName || "") || foundVideo.placeName || "Business";
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

         const compositeArr = [];
         
         // Function to generate SVG stars based on rating
         const generateStars = (rating: number) => {
           let starsSvg = '';
           for (let i = 1; i <= 5; i++) {
             let fill = i <= rating ? '#fbbf24' : '#4b5563'; // Amber 400 for filled, Gray 600 for empty
             starsSvg += \`<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="\${fill}" transform="translate(\${(i-1) * 36}, 0) scale(1.5)" />\`;
           }
           return starsSvg;
         };

         // Text Overlay and Gradient
         const safeAuthor = (author || 'Reviewer').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
         const safePlaceName = (placeName || 'Business').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

         const svgOverlay = \`
           <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="30%" style="stop-color:rgb(0,0,0);stop-opacity:0.1" />
                 <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.95" />
               </linearGradient>
             </defs>
             <rect width="1200" height="630" fill="url(#grad1)"/>
             
             <!-- Play Button Center -->
             <g transform="translate(540, 255)">
               <circle cx="60" cy="60" r="60" fill="rgba(0,0,0,0.6)"/>
               <path d="M45 35l40 25-40 25V35z" fill="#ffffff"/>
             </g>

             <!-- Logo / Yoouz tag -->
             <text x="1150" y="60" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" opacity="0.8" text-anchor="end">yoouz.com</text>

             <!-- Rating Stars -->
             <g transform="translate(200, 470)">
               \${generateStars(rating)}
             </g>

             <!-- Title / Place -->
             <text x="200" y="540" font-family="system-ui, sans-serif" font-weight="800" font-size="44" fill="#ffffff">60s Review for \${safePlaceName}</text>
             
             <!-- Author -->
             <text x="200" y="585" font-family="system-ui, sans-serif" font-weight="500" font-size="28" fill="#a1a1aa">Authentic review by \${safeAuthor}</text>
           </svg>
         \`;

         compositeArr.push({ input: Buffer.from(svgOverlay), top: 0, left: 0 });

         // Render final
         let baseImage = sharp(thumbBuf).resize(1200, 630, { fit: 'cover' });
         
         // If we have an avatar, round it and add to composite
         if (avatarBuf) {
           try {
             const circleMask = Buffer.from('<svg width="100" height="100"><circle cx="50" cy="50" r="50" fill="#ffffff"/></svg>');
             const roundedAvatar = await sharp(avatarBuf)
               .resize(100, 100, { fit: 'cover' })
               .composite([{ input: circleMask, blend: 'dest-in' }])
               .png()
               .toBuffer();
             
             compositeArr.push({ input: roundedAvatar, top: 490, left: 60 });
           } catch(e) {
             console.error("Avatar overlay error", e);
           }
         }

         const finalImage = await baseImage.composite(compositeArr).png().toBuffer();
         
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
console.log("Updated OG image endpoint");
