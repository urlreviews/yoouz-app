const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startMarker = "app.get(['/api/og-image', '/api/og-image.png', '/og-banner.png', '/og-image.png'], async (req: any, res: any) => {";
const endMarker = "    // Handle bot/crawler requests and direct HTML requests for Open Graph tags in dev mode";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find markers", { startIndex, endIndex });
  process.exit(1);
}

const replacement = `  app.get(['/api/og-image', '/api/og-image.png', '/og-banner.png', '/og-image.png'], async (req: any, res: any) => {
    try {
      let type = (req.query.type as string) || "homepage";
      let title = (req.query.title as string) || "";
      let subtitle = (req.query.subtitle as string) || "";
      let badge = (req.query.badge as string) || "";
      let rating = parseFloat(req.query.rating as string) || 0;
      let author = (req.query.author as string) || "";
      let caption = (req.query.caption as string) || "";
      let placeName = (req.query.placeName as string) || (req.query.place as string) || "";
      let category = (req.query.category as string) || "";
      let city = (req.query.city as string) || "";
      let reviewsCount = parseInt(req.query.reviewsCount as string, 10) || 12;

      let thumbBuf;
      let reviewerPhotoBase64 = '';
      let avatarBase64 = '';
      let bannerBase64 = '';
      let logoBase64 = '';

      if (type === 'video') {
         const videoId = req.query.id;
         if (videoId) {
            let foundVideo: any = null;
            if (typeof adminDb !== 'undefined' && adminDb) {
              try {
                const snap = await adminDb.collection("videoReviews").doc(videoId).get();
                if (snap.exists) foundVideo = { id: snap.id, ...snap.data() };
              } catch (e) {}
            }
            if (!foundVideo && typeof readReviewsIndex === 'function') {
              try {
                const localList = readReviewsIndex();
                foundVideo = localList.find((v: any) => v.id === videoId);
              } catch(e) {}
            }
            if (!foundVideo && typeof getDb !== 'undefined' && getDb()) {
              try {
                const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, videoId));
                if (rec) foundVideo = { id: rec.id, ...rec.data };
              } catch (e) {}
            }
            
            if (foundVideo) {
              let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || foundVideo.author?.avatar || foundVideo.avatar || "";
              if (thumbArg.startsWith('data:image')) {
                 thumbBuf = Buffer.from(thumbArg.split(',')[1], 'base64');
              } else if (thumbArg.startsWith('http')) {
                 try {
                    const tr = await fetch(thumbArg);
                    thumbBuf = Buffer.from(await tr.arrayBuffer());
                 } catch(e) {}
              }
            }
         }

         if (!thumbBuf && req.query.thumbUrl) {
           const tUrl = req.query.thumbUrl as string;
           if (tUrl.startsWith('data:image')) {
             thumbBuf = Buffer.from(tUrl.split(',')[1], 'base64');
           } else {
             try {
                const tr = await fetch(tUrl);
                thumbBuf = Buffer.from(await tr.arrayBuffer());
             } catch(e) {}
           }
         }

         if (!thumbBuf) {
            thumbBuf = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
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
      const fallbackBuf = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.end(fallbackBuf);

    } catch (e: any) {
      console.error("OG Image Error:", e);
      return res.status(500).send("Error generating image");
    }
  });

  async function resolveMetadataForRequest(req: any) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = \`\${protocol}://\${host}\`;
    const fullUrl = \`\${baseUrl}\${req.originalUrl || req.url}\`;

    const urlObj = new URL(fullUrl);
    const params = urlObj.searchParams;
    const pathname = urlObj.pathname;
    
    let title = "Yoouz - Authentic 60-Second Video Reviews";
    let description = "Yoouz is the premier authentic video review platform. Real people record genuine 60-second live video testimonials. Zero fake text reviews, 100% verified trust.";
    let imageUrl = \`\${baseUrl}/og-banner.png?v=4\`;
    let videoUrl = "";
    let type = "website";
    let structuredData: any = null;
    let keywords = "Yoouz, video reviews, authentic customer reviews, google maps video reviews, 60 second video reviews, restaurant video reviews, local business video ratings";

    const videoIdMatch = pathname.match(/\\/video\\/(rev-[a-zA-Z0-9-]+)/);
    const placeIdMatch = pathname.match(/\\/place\\/([a-zA-Z0-9-]+)/);
    const creatorMatch = pathname.match(/^\\/@([a-zA-Z0-9_.-]+)$/);

    const videoId = videoIdMatch ? videoIdMatch[1] : (params.get('video') || params.get('v') || params.get('id'));
    const placeId = placeIdMatch ? placeIdMatch[1] : (params.get('place') && !videoId ? params.get('place') : null);
    const creatorHandle = creatorMatch ? creatorMatch[1] : null;

    if (videoId) {
        let foundVideo: any = null;
        if (typeof adminDb !== 'undefined' && adminDb) {
            try {
                const snap = await adminDb.collection("videoReviews").doc(videoId).get();
                if (snap.exists) foundVideo = { id: snap.id, ...snap.data() };
            } catch (e) {}
        }
        if (!foundVideo && typeof readReviewsIndex === 'function') {
            try {
                const localList = readReviewsIndex();
                foundVideo = localList.find((v: any) => v.id === videoId);
            } catch (e) {}
        }
        if (!foundVideo && typeof getDb !== 'undefined' && getDb()) {
            try {
                const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, videoId));
                if (rec) foundVideo = { id: rec.id, ...rec.data };
            } catch (e) {}
        }
        
        if (foundVideo) {
            const authorName = foundVideo.author?.name || foundVideo.authorName || "Verified Customer";
            const authorHandle = foundVideo.author?.handle || authorName.toLowerCase().replace(/\\s+/g, "");
            const placeName = foundVideo.placeName || "Local Business";
            const rating = foundVideo.rating || 5.0;
            const caption = foundVideo.caption || "";

            title = \`\${authorName}'s 60s Video Review of \${placeName} | Yoouz\`;
            description = caption 
              ? \`"\${caption}" — Watch the authentic 60-second video review by \${authorName} for \${placeName} on Yoouz. 100% Real Video. Zero Fake Text Reviews.\`
              : \`Watch the authentic 60-second video review by \${authorName} for \${placeName} on Yoouz. Real People. Real Reviews.\`;
            
            let queryParams = \`type=video&id=\${encodeURIComponent(foundVideo.id)}&placeName=\${encodeURIComponent(placeName)}&author=\${encodeURIComponent(authorName)}&rating=\${rating}&caption=\${encodeURIComponent(caption)}&v=7\`;
            
            let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";
            if (thumbArg.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')) {
               thumbArg = "";
            }
            if (thumbArg.startsWith('data:image')) {
               thumbArg = ""; // Prevent massive URLs
            }
            if (!thumbArg && (foundVideo.author?.avatar || foundVideo.avatar)) {
               thumbArg = foundVideo.author?.avatar || foundVideo.avatar;
               if (thumbArg && thumbArg.startsWith('data:image')) thumbArg = "";
            }
            if (thumbArg) {
               queryParams += \`&thumbUrl=\${encodeURIComponent(thumbArg)}\`;
            }
            
            imageUrl = \`\${baseUrl}/api/og-image.png?\${queryParams}\`;
            videoUrl = foundVideo.videoUrl || "";
            type = "video.other";
            
            structuredData = {
              "@context": "https://schema.org",
              "@type": "VideoObject",
              "name": title,
              "description": description,
              "thumbnailUrl": [imageUrl],
              "uploadDate": foundVideo.createdAt || new Date().toISOString(),
              "duration": "PT60S",
              "contentUrl": videoUrl,
              "embedUrl": fullUrl,
              "author": {
                "@type": "Person",
                "name": authorName,
                "url": \`\${baseUrl}/@\${encodeURIComponent(authorHandle)}\`
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": (rating).toFixed(1),
                "bestRating": "5",
                "worstRating": "1",
                "ratingCount": "1"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Yoouz",
                "logo": {
                  "@type": "ImageObject",
                  "url": \`\${baseUrl}/favicon.svg\`
                }
              }
            };
        }
    } else if (placeId) {
        title = \`Authentic Video Reviews for \${placeId} | Yoouz\`;
        description = \`Discover genuine 60-second video testimonials for \${placeId} on Yoouz. 100% Real Video. Zero Fake Text Reviews.\`;
        imageUrl = \`\${baseUrl}/api/og-image.png?type=homepage&v=4\`;
    } else if (creatorHandle) {
        title = \`@\${creatorHandle}'s Authentic Video Reviews | Yoouz\`;
        description = \`Watch genuine 60-second video testimonials by @\${creatorHandle} on Yoouz.\`;
        imageUrl = \`\${baseUrl}/api/og-image.png?type=creator&author=\${encodeURIComponent(creatorHandle)}&v=4\`;
    }

    if (!structuredData) {
      structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": \`\${baseUrl}/#website\`,
            "url": baseUrl,
            "name": "Yoouz",
            "alternateName": "Yoouz Video Reviews",
          }
        ]
      }
    }

    return {
      title,
      description,
      imageUrl,
      videoUrl,
      type,
      url: fullUrl,
      keywords,
      structuredData
    };
  }

  if (!isProduction) {
    console.log("Yoouz Server: Starting in DEVELOPMENT mode (Vite middleware enabled)");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true,
        host: true,
        hmr: false,
        watch: {
          usePolling: true,
          interval: 100
        }
      },
      appType: "spa",
    });

`;

const newCode = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync('server.ts', newCode);
console.log("Fixed mess successfully");
