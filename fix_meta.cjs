const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement1 = `
      if (type === 'video') {
         let thumbBuf;
         
         // 1. Try to fetch from DB using ID to avoid huge query params
         const videoId = req.query.id;
         if (videoId && !req.query.thumbUrl) {
            let foundVideo = null;
            if (typeof adminDb !== 'undefined' && adminDb) {
              try {
                const snap = await adminDb.collection("videoReviews").doc(videoId).get();
                if (snap.exists) foundVideo = { id: snap.id, ...snap.data() };
              } catch (e) {}
            }
            if (!foundVideo) {
              try {
                const localList = readReviewsIndex();
                foundVideo = localList.find(v => v.id === videoId);
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
           const tUrl = req.query.thumbUrl;
           if (tUrl.startsWith('data:image')) {
             thumbBuf = Buffer.from(tUrl.split(',')[1], 'base64');
           } else {
             try {
                const tr = await fetch(tUrl);
                thumbBuf = Buffer.from(await tr.arrayBuffer());
             } catch(e) {}
           }
         }
`;

code = code.replace(/      if \(type === 'video'\) \{\n         let thumbBuf;\n         if \(req\.query\.thumbUrl\) \{[\s\S]*?thumbBuf = Buffer\.from\(await tr\.arrayBuffer\(\)\);\n             \} catch\(e\) \{\n                console\.error\("Failed to fetch thumbUrl", e\);\n             \}\n           \}\n         \}/, replacement1);


const replacement2 = `
          let thumbArg = foundVideo.videoThumbnail || foundVideo.videoPreviewUrl || foundVideo.coverUrl || foundVideo.thumbnailUrl || "";
          if (thumbArg.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')) {
             thumbArg = "";
          }
          if (thumbArg.startsWith('data:image')) {
             thumbArg = ""; // DO NOT PASS BASE64 IN URL!
          }
          if (!thumbArg && (foundVideo.author?.avatar || foundVideo.avatar)) {
             thumbArg = foundVideo.author?.avatar || foundVideo.avatar;
             if (thumbArg.startsWith('data:image')) thumbArg = "";
          }
          
          let queryParams = \`type=video&id=\${encodeURIComponent(foundVideo.id)}&placeName=\${encodeURIComponent(placeName)}&author=\${encodeURIComponent(authorName)}&rating=\${rating}&caption=\${encodeURIComponent(caption)}&v=6\`;
          if (thumbArg) {
             queryParams += \`&thumbUrl=\${encodeURIComponent(thumbArg)}\`;
          }
          
          imageUrl = \`\${baseUrl}/api/og-image.png?\${queryParams}\`;
`;

code = code.replace(/          let thumbArg = foundVideo\.videoThumbnail[\s\S]*?imageUrl = `\$\{baseUrl\}\/api\/og-image\.png\?type=video&id=\$\{encodeURIComponent\(foundVideo\.id\)\}.*?v=6`;/, replacement2);

fs.writeFileSync('server.ts', code);
console.log("Fixed metadata");
