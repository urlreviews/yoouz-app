const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const startMarker = "// Step 2: Immediate metadata & Firestore sync for background upload";
const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
  const endIndex = content.indexOf("return reviewDoc;", startIndex);
  if (endIndex !== -1) {
    const endStr = content.substring(endIndex, content.indexOf("}", endIndex) + 1);
    const textToReplace = content.substring(startIndex, content.indexOf("}", endIndex) + 1);
    
    const newText = `// Step 2: Blocking Upload to Firebase Storage
  if (optimizedBlob) {
    // Save to local IDB first so if they refresh, it's there
    saveVideoBlobToIndexedDB(newId, optimizedBlob).catch(() => {});

    // Upload and await completion
    const uploadResult = await uploadVideoResumableWithProgress(optimizedBlob, newId, (progressInfo) => {
      // Remap 0-100 to 15-95
      const remapped = 15 + Math.round(progressInfo.percent * 0.80);
      onProgress?.({
        ...progressInfo,
        percent: remapped,
        statusText: progressInfo.statusText,
        stage: "uploading"
      });
    });

    if (!uploadResult || !uploadResult.downloadUrl) {
      throw new Error("Failed to upload video to cloud storage.");
    }
    finalVideoUrl = uploadResult.downloadUrl;
  } else if (sampleVideoUrl) {
    finalVideoUrl = sampleVideoUrl;
  } else {
    throw new Error("No video file or valid URL was provided.");
  }

  // Step 3: Finalize metadata & Firestore sync
  onProgress?.({
    percent: 96,
    bytesTransferred: 0,
    totalBytes: 0,
    statusText: "Syncing review to Firestore...",
    stage: "syncing"
  });

  const authorHandle = currentUser?.email
    ? currentUser.email.split("@")[0]
    : currentUser?.name
    ? currentUser.name.toLowerCase().replace(/\\s+/g, "_")
    : "localguide";

  const authorName = currentUser?.name || "Verified Local Guide";
  const authorAvatar = currentUser?.avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(authorName)}&background=1a73e8&color=fff&bold=true&size=128\`;

  const meaningfulTags = Array.from(new Set([
    (dishTag || "food").toLowerCase(),
    (placeCategory || "establishment").toLowerCase(),
    "review",
    placeCity ? placeCity.toLowerCase() : ""
  ].filter(t => t.length > 2)));

  const reviewDoc: VideoReview = {
    id: newId,
    userId: currentUser?.email || "anonymous",
    userEmail: currentUser?.email || "",
    placeId,
    placeName,
    placeCategory,
    placeAddress,
    placeCity,
    placeRating,
    placeWebsite,
    placeLogoUrl,
    author: {
      name: authorName,
      handle: authorHandle,
      avatar: authorAvatar,
      isLocalGuide: true,
      localGuideLevel: Math.floor(Math.random() * 4) + 4,
      videoReviewCount: Math.floor(Math.random() * 50) + 1,
      photosCount: Math.floor(Math.random() * 200) + 10,
    },
    rating,
    durationSeconds: recordedSeconds,
    videoUrl: finalVideoUrl,
    localVideoUrl: localBlobUrl || undefined,
    thumbnailUrl: finalThumbnailUrl?.startsWith("http") ? finalThumbnailUrl : \`https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80\`,
    caption,
    dishOrItem: dishTag || undefined,
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
    tags: meaningfulTags,
    createdAtMs: Date.now()
  };

  // Ensure it is fully written to Firestore before returning
  const { doc, setDoc } = await import("firebase/firestore");
  const firestorePayload = { ...reviewDoc };
  delete firestorePayload.localVideoUrl;
  await setDoc(doc(db, "videoReviews", newId), firestorePayload);

  onProgress?.({
    percent: 100,
    bytesTransferred: 0,
    totalBytes: 0,
    statusText: "Review Published Successfully!",
    stage: "syncing"
  });

  return reviewDoc;
}`;
    content = content.replace(textToReplace, newText);
    fs.writeFileSync('src/lib/videoStorage.ts', content);
    console.log("Patched publishVideoReviewFromScratch successfully!");
  } else {
    console.log("Could not find end marker");
  }
} else {
  console.log("Could not find start marker");
}
