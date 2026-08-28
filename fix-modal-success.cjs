const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const regex = /onPublishVideoReview\(newReview\);\s*setIsPublishing\(false\);\s*\/\/ Reset state for next time[\s\S]*?onClose\(\);/;

const replacement = `onPublishVideoReview(newReview);
      setIsPublishing(false);
      setShowSuccessScreen(true);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });`;

if(content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
    console.log("Restored success screen");
} else {
    console.log("Could not find regex");
}
