});

  app.get(['/api/og-image', '/api/og-image.png', '/og-banner.png', '/og-image.png'], async (req: any, res: any) => {
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
      let avatarBase64 = '';
      let bannerBase64 = '';
      let logoBase64 = '';
      let reviewerPhotoBase64 = '';

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;

      const vidId = (req.query.id as string) || (req.query.videoId as string) || (req.query.video as string) || (req.query.v as string);

      if (vidId) {
        let foundVideo: any = null;
        if (adminDb) {
          try {
            const snap = await adminDb.collection("videoReviews").doc(vidId).get();
            if (snap.exists) foundVideo = { id: snap.id, ...snap.data() };
          } catch(e) {}
        }
        if (!foundVideo) {
          const localList = readReviewsIndex();
          foundVideo = localList.find((v: any) => v.id === vidId);
        }
        if (!foundVideo && getDb()) {
          try {
            const [rec] = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, vidId));
            if (rec) foundVideo = { id: rec.id, ...rec.data };
          } catch(e) {}
        }

        if (foundVideo) {
          type = 'video';
          if (!placeName && foundVideo.placeName) placeName = foundVideo.placeName;
          if (!author && (foundVideo.author?.name || foundVideo.authorName)) author = foundVideo.author?.name || foundVideo.authorName;
          if (!rating && foundVideo.rating) rating = foundVideo.rating;
          if (!caption && foundVideo.caption) caption = foundVideo.caption;

          // Fetch thumbnail photo of actual video recording
          if (foundVideo.thumbnailUrl) {
            if (foundVideo.thumbnailUrl.startsWith('data:image')) {
              reviewerPhotoBase64 = foundVideo.thumbnailUrl.split(',')[1];
            } else {
              const tUrl = foundVideo.thumbnailUrl.startsWith('/') ? `${baseUrl}${foundVideo.thumbnailUrl}` : foundVideo.thumbnailUrl;
              try {
                reviewerPhotoBase64 = await fetchBase64(tUrl);
              } catch(e) {}
            }
          }

          // Fetch reviewer profile avatar
          if (foundVideo.author?.avatar) {
            if (foundVideo.author.avatar.startsWith('data:image')) {
              avatarBase64 = foundVideo.author.avatar.split(',')[1];
            } else {
              const aUrl = foundVideo.author.avatar.startsWith('/') ? `${baseUrl}${foundVideo.author.avatar}` : foundVideo.author.avatar;
              try {
                avatarBase64 = await fetchBase64(aUrl);
              } catch(e) {}
            }
          }
        }
      }

      if (!reviewerPhotoBase64 && req.query.thumbnailUrl) {
        const tUrl = req.query.thumbnailUrl as string;
        if (tUrl.startsWith('data:image')) {
          reviewerPhotoBase64 = tUrl.split(',')[1];
        } else {
          const absUrl = tUrl.startsWith('/') ? `${baseUrl}${tUrl}` : tUrl;
          reviewerPhotoBase64 = await fetchBase64(absUrl);
        }
      }

      if (!reviewerPhotoBase64) {
        // Fall back to the author's avatar, or a transparent pixel
        if (avatarBase64) {
          reviewerPhotoBase64 = avatarBase64;
        } else {
          reviewerPhotoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // transparent pixel
        }
      }

      if (type === 'homepage') {
        try {
          logoBase64 = fs.readFileSync(path.join(process.cwd(), 'public', 'icon-512.png')).toString('base64');
        } catch(e) {}
      } else if (!avatarBase64 && req.query.avatarUrl) {
        avatarBase64 = await fetchBase64(req.query.avatarUrl as string);
      }
      if (req.query.bannerUrl) {
        bannerBase64 = await fetchBase64(req.query.bannerUrl as string);
      }

      
      // Short-circuit for 'video' type to use native Sharp compositing (Avoid SVG text rendering issues on Linux)
      
      if (type === 'video') {
         let thumbBuf;
         if (req.query.thumbUrl) {
           const tUrl = req.query.thumbUrl;
           if (tUrl.startsWith('data:image')) {
             thumbBuf = Buffer.from(tUrl.split(',')[1], 'base64');
           } else {
             try {
                const tr = await fetch(tUrl);
                thumbBuf = Buffer.from(await tr.arrayBuffer());
             } catch(e) {
                console.error("Failed to fetch thumbUrl", e);
             }
           }
         }
         
         if (!thumbBuf) {
            thumbBuf = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
         }

         const playButtonSvg = `
           <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
             <rect width="1200" height="630" fill="#000000" fill-opacity="0.2"/>
             <g transform="translate(560, 275)">
               <circle cx="40" cy="40" r="40" fill="#000000" fill-opacity="0.6"/>
               <path d="M30 25l26 15-26 15V25z" fill="#ffffff"/>
             </g>
           </svg>
         `;

         try {
           // 1. Create a blurred, covered background
           const background = await sharp(thumbBuf)
             .resize(1200, 630, { fit: 'cover' })
             .blur(40)
             .modulate({ brightness: 0.6 })
             .toBuffer();

           // 2. Create the crisp, contained foreground
           // Videos are typically 9:16 vertical (e.g. 720x1280). We fit it into 1200x630 with 'contain'.
           // To make it look like a short, we give it a clean height of 630.
           const foreground = await sharp(thumbBuf)
             .resize(1200, 630, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
             .toBuffer();

           const finalPng = await sharp(background)
             .composite([
                { input: foreground, blend: 'over' },
                { input: Buffer.from(playButtonSvg), blend: 'over' }
             ])
             .png({ quality: 90 })
             .toBuffer();
             
           res.setHeader('Content-Type', 'image/png');
           res.setHeader('Cache-Control', 'public, max-age=86400');
           return res.send(finalPng);
         } catch(e) {
           console.error("Sharp composite error:", e);
           const blank = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
           res.setHeader('Content-Type', 'image/png');
           return res.send(blank);
         }
      }

      }
        type,
        title,
        subtitle,
        badge,
        rating: rating || 5.0,
        author,
        caption,
        placeName,
        category,
        city,
