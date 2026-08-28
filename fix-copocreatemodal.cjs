const fs = require('fs');

let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

// Replace imports
content = content.replace(
  /import \{ publishVideoReviewFromScratch, UploadProgressInfo \} from "\.\.\/lib\/videoStorage";/g,
  'import { uploadAndPublishVideoReview } from "../lib/videoUploadEngine";'
);

// Replace handlePublish contents
const handlePublishStart = content.indexOf('const handlePublish = async () => {');
const handlePublishEnd = content.indexOf('};', handlePublishStart) + 2;

const newHandlePublish = `const handlePublish = async () => {
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

      const newReview = await uploadAndPublishVideoReview({
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
        recordedBlob,
        customPosterUrl: userThumbnail,
        recordedSeconds: secondsRecorded || 45,
        currentUser: currentUser ? {
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar
        } : null,
        onProgress: (progress: number) => {
          setUploadProgress(progress);
        }
      });

      onPublishVideoReview(newReview);
      setIsPublishing(false);
      setShowSuccessScreen(true);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error("🔥 [CopoCreateModal] Failed to publish video review:", err);
      setIsPublishing(false);
      setErrorMessage(\`\${err?.message || "Failed to publish video review. Please try again."}\`);
    }
  };`;

content = content.replace(content.substring(handlePublishStart, handlePublishEnd), newHandlePublish);
fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
console.log("Updated CopoCreateModal");
