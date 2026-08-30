const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
    const videoIdMatch = pathname.match(/\\/video\\/(rev-[a-zA-Z0-9-]+)/);
    const placeIdMatch = pathname.match(/\\/place\\/([a-zA-Z0-9-]+)/);
    const creatorMatch = pathname.match(/^\\/@([a-zA-Z0-9_.-]+)$/);

    const videoId = videoIdMatch ? videoIdMatch[1] : (params.get('video') || params.get('v') || params.get('id'));
    const placeId = placeIdMatch ? placeIdMatch[1] : (params.get('place') && !videoId ? params.get('place') : null);
    const creatorHandle = creatorMatch ? creatorMatch[1] : null;

    if (pathname.includes('/business')) {
      title = "Yoouz for Business | Leverage Authentic Video Reviews";
      description = "Claim your Yoouz business profile to leverage authentic 60-second video testimonials. Build unparalleled consumer trust through verified video feedback.";
    } else if (params.get('tab') === 'discover') {
      title = "Discover Authentic Video Reviews on Yoouz";
      description = "Explore a continuous feed of authentic 60-second video reviews. Discover the best local businesses, food, and experiences near you.";
    } else if (params.get('tab') === 'following') {
      title = "Following - Your Favorite Reviewers on Yoouz";
      description = "Watch the latest video reviews from the creators and local businesses you follow on Yoouz.";
    } else if (pathname === '/admin') {
       title = "Yoouz Admin Dashboard";
       description = "Manage and moderate content on the Yoouz platform.";
    }

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
        let foundPlace: any = null;
        if (typeof adminDb !== 'undefined' && adminDb) {
            try {
                const snap = await adminDb.collection("places").doc(placeId).get();
                if (snap.exists) foundPlace = { id: snap.id, ...snap.data() };
            } catch (e) {}
        }
        if (!foundPlace && typeof getDb !== 'undefined' && getDb()) {
            try {
                const [pRec] = await db.select().from(places).where(eq(places.id, placeId));
                if (pRec) foundPlace = pRec;
                if (!foundPlace) {
                  const [fpRec] = await db.select().from(firestore_places).where(eq(firestore_places.id, placeId));
                  if (fpRec) foundPlace = { id: fpRec.id, ...fpRec.data };
                }
            } catch (e) {}
        }

        const placeName = foundPlace?.name || placeId.replace(/^place-/, '').replace(/-/g, ' ').replace(/\\b\\w/g, (c: string) => c.toUpperCase());
        const placeRating = parseFloat(foundPlace?.rating || "4.8").toFixed(1);
        const reviewCount = foundPlace?.totalReviews || foundPlace?.reviewsCount || 12;
        const category = foundPlace?.category || "Local Business";
        const city = foundPlace?.city || foundPlace?.address || "Verified Location";

        title = \`\${placeName} - Customer Video Reviews & Ratings | Yoouz\`;
        description = foundPlace?.description 
          ? \`\${foundPlace.description} Watch authentic 60-second video reviews for \${placeName} on Yoouz.\`
          : \`Watch 100% authentic 60-second live video reviews from real customers for \${placeName} on Yoouz. Real People. Real Reviews.\`;
          
        imageUrl = \`\${baseUrl}/api/og-image.png?type=place&placeName=\${encodeURIComponent(placeName)}&rating=\${placeRating}&reviewsCount=\${reviewCount}&category=\${encodeURIComponent(category)}&city=\${encodeURIComponent(city)}\${foundPlace?.avatarUrl ? '&avatarUrl=' + encodeURIComponent(foundPlace.avatarUrl) : ''}\${foundPlace?.bannerUrl ? '&bannerUrl=' + encodeURIComponent(foundPlace.bannerUrl) : ''}\`;
        type = "website";
        keywords = \`\${placeName}, \${placeName} reviews, \${placeName} video reviews, \${city} places, real customer video reviews\`;

        structuredData = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": placeName,
          "description": description,
          "image": imageUrl,
          "url": fullUrl,
          "telephone": foundPlace?.phone || "",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": foundPlace?.address || "",
            "addressLocality": city,
            "addressCountry": "US"
          },
          ...(foundPlace?.lat && foundPlace?.lng ? {
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": foundPlace.lat,
              "longitude": foundPlace.lng
            }
          } : {}),
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": placeRating,
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": String(reviewCount)
          }
        };
    } else if (creatorHandle) {
        const cleanHandle = creatorHandle.replace(/^@+/, '').trim();
        const lowerHandle = cleanHandle.toLowerCase();
        let foundUser: any = null;

        // 1. Check defaultCommunityUsers
        if (typeof defaultCommunityUsers !== 'undefined') {
          const defaultMatch = defaultCommunityUsers.find((du: any) => {
            const duName = (du.name || "").toLowerCase().replace(/^@+/, "");
            const duHandle = (du.handle || "").toLowerCase().replace(/^@+/, "");
            const duEmail = (du.email || "").split("@")[0].toLowerCase();
            return duName === lowerHandle || duHandle === lowerHandle || duEmail === lowerHandle;
          });
          if (defaultMatch?.avatar) {
            foundUser = defaultMatch;
          }
        }

        // 2. Query Firestore if not found
        if (!foundUser && typeof adminDb !== 'undefined' && adminDb) {
          try {
            const userSnap = await adminDb.collection("users").get();
            if (!userSnap.empty) {
              const matchedDoc = userSnap.docs.find(doc => {
                const u = doc.data();
                const uName = (u.name || "").toLowerCase().replace(/^@+/, "");
                const uHandle = (u.handle || "").toLowerCase().replace(/^@+/, "");
                const uEmail = (u.email || "").split("@")[0].toLowerCase();
                return uName === lowerHandle || uHandle === lowerHandle || uEmail === lowerHandle;
              });
              if (matchedDoc) {
                const uData = matchedDoc.data();
                if (uData?.avatar && !uData.avatar.includes("/api/videos/") && !uData.avatar.includes(".mp4") && !uData.avatar.includes("rev-")) {
                  foundUser = uData;
                }
              }
            }
          } catch (e) {}
        }

        title = \`@\${cleanHandle} on Yoouz - Authentic Video Reviews Portfolio\`;
        description = \`Explore authentic 60-second video reviews recorded by @\${cleanHandle} on Yoouz. 100% Genuine Video Reviews.\`;
        imageUrl = \`\${baseUrl}/api/og-image.png?type=creator&author=\${encodeURIComponent(foundUser?.name || cleanHandle)}\${foundUser?.avatar ? '&avatarUrl=' + encodeURIComponent(foundUser.avatar) : ''}\${foundUser?.banner ? '&bannerUrl=' + encodeURIComponent(foundUser.banner) : ''}\`;
        type = "profile";
        keywords = \`\${cleanHandle}, \${cleanHandle} yoouz, video reviewer, authentic local guide, food reviewer, verified reviewer\`;

        structuredData = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": \`@\${cleanHandle}\`,
          "url": fullUrl,
          "image": imageUrl,
          "jobTitle": "Verified Video Reviewer",
          "worksFor": {
            "@type": "Organization",
            "name": "Yoouz"
          }
        };
    }
`;

const matchRegex = /    const videoIdMatch = pathname\.match\(\/\\\/video\\\/.*?    \} else if \(creatorHandle\) \{[\s\S]*?    \}/;

code = code.replace(matchRegex, replacement);

fs.writeFileSync('server.ts', code);
console.log("Restored full routing resolution");
