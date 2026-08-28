const fs = require('fs');

let content = fs.readFileSync('src/components/GoogleVideoRecordModal.tsx', 'utf8');

// Replace imports
content = content.replace(
  /import \{ publishVideoReviewFromScratch, UploadProgressInfo \} from "\.\.\/lib\/videoStorage";/g,
  'import { uploadAndPublishVideoReview } from "../lib/videoUploadEngine";'
);

const handlePublishStart = content.indexOf('const submitReview = async (e: React.FormEvent) => {');
const handlePublishEnd = content.indexOf('};', handlePublishStart) + 2;

const newHandlePublish = `const submitReview = async (e: React.FormEvent) => {
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
      const reviewDoc = await uploadAndPublishVideoReview({
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
        recordedBlob,
        customPosterUrl: capturedPosterUrl || place.bannerUrl || place.avatarUrl,
        recordedSeconds: recordedSeconds > 0 ? recordedSeconds : 45,
        currentUser: {
          name: "Samet (Local Guide)",
          email: "samet@reviuz.com",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
        },
        onProgress: (progress: number) => {
          setUploadProgress(progress);
        }
      });

      onSaveReview(reviewDoc);
      setIsUploading(false);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onClose();
    } catch (err: any) {
      console.error("🔥 [GoogleVideoRecordModal] Publishing error:", err);
      setIsUploading(false);
      setErrorMessage(\`\${err?.message || "Failed to publish review. Please try again."}\`);
    }
  };`;

content = content.replace(content.substring(handlePublishStart, handlePublishEnd), newHandlePublish);
fs.writeFileSync('src/components/GoogleVideoRecordModal.tsx', content);
console.log("Updated GoogleVideoRecordModal");
