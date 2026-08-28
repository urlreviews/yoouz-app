const fs = require('fs');

function patchModal(file, findFnStr, newFnStr) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    'import { uploadAndPublishVideoReview } from "../lib/videoUploadEngine";',
    'import { uploadVideoReview } from "../lib/videoUploadEngine";'
  );

  const fnStart = content.indexOf(findFnStr);
  const fnEnd = content.indexOf('};', fnStart) + 2;
  
  if (fnStart > -1) {
    content = content.replace(content.substring(fnStart, fnEnd), newFnStr);
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find fn in ${file}`);
  }
}

// CopoCreateModal
const copoNewHandlePublish = `const handlePublish = async () => {
    setIsPublishing(true);
    setUploadProgress(0);
    setPublishStatus("Publishing video review...");
    setErrorMessage("");

    try {
      const userThumbnail =
        capturedThumbnailUrl ||
        captureCameraSnapshot() ||
        (selectedPlace?.avatarUrl && !selectedPlace.avatarUrl.includes("unsplash")
          ? selectedPlace.avatarUrl
          : generateNeutralPoster(selectedPlace?.name || "Verified Place"));

      const authorHandle = currentUser?.email
        ? currentUser.email.split("@")[0]
        : currentUser?.name
        ? currentUser.name.toLowerCase().replace(/\\s+/g, "_")
        : "localguide";

      const authorName = currentUser?.name || "Verified Local Guide";
      const authorAvatar = currentUser?.avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(authorName)}&background=1a73e8&color=fff&bold=true&size=128\`;

      const meta = {
        userId: currentUser?.email || "anonymous",
        userEmail: currentUser?.email || "",
        placeId: selectedPlace?.id || \`place-\${Date.now()}\`,
        placeName: selectedPlace?.name || "Verified Business",
        placeCategory: selectedPlace?.category || "Establishment",
        placeAddress: selectedPlace?.address || "Reviuz Verified Location",
        placeCity: selectedPlace?.city || "San Francisco",
        placeRating: selectedPlace?.rating || 4.8,
        placeWebsite: selectedPlace?.website || selectedPlace?.brandDomain || "",
        placeLogoUrl: selectedPlace?.logoUrl || selectedPlace?.avatarUrl || "",
        rating: reviewRating || 5,
        caption: reviewCaption.trim() || \`Authentic video review of \${selectedPlace?.name || "this spot"}.\`,
        dishTag: selectedPlace?.topDishes?.[0] || selectedPlace?.name || "Signature Experience",
        thumbnailUrl: userThumbnail?.startsWith("http") ? userThumbnail : \`https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80\`,
        durationSeconds: secondsRecorded || 45,
        author: {
          name: authorName,
          handle: authorHandle,
          avatar: authorAvatar,
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
        tags: [selectedPlace?.category || "establishment", "review"],
        createdAtMs: Date.now()
      };

      const docId = await uploadVideoReview(
        recordedBlob!,
        meta,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );

      onPublishVideoReview({ ...meta, id: docId, videoUrl: "" } as any);
      setIsPublishing(false);
      setShowSuccessScreen(true);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error("🔥 [CopoCreateModal] Failed to publish video review:", err);
      setIsPublishing(false);
      setErrorMessage(\`\${err?.message || "Failed to publish video review. Please try again."}\`);
    }
  };`;

patchModal('src/components/CopoCreateModal.tsx', 'const handlePublish = async () => {', copoNewHandlePublish);

// GoogleVideoRecordModal
const googleNewHandleSubmit = `const handleSubmit = async (e: React.FormEvent) => {
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

patchModal('src/components/GoogleVideoRecordModal.tsx', 'const handleSubmit = async (e: React.FormEvent) => {', googleNewHandleSubmit);

