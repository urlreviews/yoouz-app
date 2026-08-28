const fs = require('fs');

let file = 'src/components/GoogleVideoRecordModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const fnStart = content.indexOf('const submitReview = async (e: React.FormEvent) => {');
const fnEnd = content.indexOf('};', fnStart) + 2;

const newFn = `const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRecordedVideo && !selectedSampleVideo) {
      setErrorMessage("Please record a video review first.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Publishing review...");
    setErrorMessage("");

    try {
      const meta = {
        userId: "samet@reviuz.com",
        userEmail: "samet@reviuz.com",
        placeId: place.id,
        placeName: place.name,
        placeCategory: place.category,
        placeAddress: place.address,
        placeCity: place.city,
        placeRating: place.rating,
        placeWebsite: place.website,
        placeLogoUrl: place.logoUrl || place.avatarUrl,
        rating,
        caption: caption || \`Authentic video review of \${dishTag || place.name}. Highly recommended!\`,
        dishTag: dishTag || place.topDishes?.[0] || "Featured Item",
        thumbnailUrl: capturedPosterUrl || place.bannerUrl || place.avatarUrl,
        durationSeconds: recordedSeconds > 0 ? recordedSeconds : 45,
        author: {
          name: "Samet (Local Guide)",
          handle: "samet",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          isLocalGuide: true,
          localGuideLevel: Math.floor(Math.random() * 4) + 4,
          videoReviewCount: Math.floor(Math.random() * 50) + 1,
          photosCount: Math.floor(Math.random() * 200) + 10,
        },
        likes: 0,
        isLiked: false,
        commentsCount: 0,
        comments: [],
        bookmarksCount: 0,
        isBookmarked: false,
        repostsCount: 0,
        sharesCount: 0,
        recordedAt: "Just now",
        feedCategory: "discover",
        tags: [place.category || "establishment", "review"],
        createdAtMs: Date.now()
      };

      const docId = await uploadVideoReview(
        recordedBlob!,
        meta,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );

      onSaveReview({ ...meta, id: docId, videoUrl: "" } as any);
      setIsUploading(false);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onClose();
    } catch (err: any) {
      console.error("🔥 [GoogleVideoRecordModal] Publishing error:", err);
      setIsUploading(false);
      setErrorMessage(\`\${err?.message || "Failed to publish review. Please try again."}\`);
    }
  };`;

content = content.replace(content.substring(fnStart, fnEnd), newFn);
fs.writeFileSync(file, content);
console.log("Updated GoogleVideoRecordModal properly");
