const fs = require('fs');
let content = fs.readFileSync('src/components/GoogleVideoRecordModal.tsx', 'utf8');

// Find the original start
const importStart = content.indexOf('port React, { useState, useRef, useEffect } from "react";');
if (importStart > -1) {
  // Remove the injected string at the top
  content = 'im' + content.substring(importStart);
}

// Now find handleSubmit and replace it
const submitStart = content.indexOf('const handleSubmit = async (e: React.FormEvent) => {');
if (submitStart > -1) {
  const submitEnd = content.indexOf('};', submitStart) + 2;

  const newHandleSubmit = `const handleSubmit = async (e: React.FormEvent) => {
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

  content = content.replace(content.substring(submitStart, submitEnd), newHandleSubmit);
  fs.writeFileSync('src/components/GoogleVideoRecordModal.tsx', content);
  console.log("Restored and updated GoogleVideoRecordModal");
}
