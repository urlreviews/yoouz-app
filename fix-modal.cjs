const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

content = content.replace(
`      onPublishVideoReview(newReview);
      setIsPublishing(false);
      setShowSuccessScreen(true);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });`,
`      onPublishVideoReview(newReview);
      setIsPublishing(false);
      
      // Reset state for next time
      setSearchQuery("");
      setSelectedPlace(null);
      setHasRecordedVideo(false);
      setRecordedVideoBlobUrl(null);
      setRecordedBlob(null);
      setSecondsRecorded(0);
      setReviewCaption("");
      setReviewRating(0);
      
      onClose();`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
