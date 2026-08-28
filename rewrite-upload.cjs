const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const startIndex = content.indexOf("export async function publishVideoReviewFromScratch");
const endIndex = content.indexOf("return reviewDoc;", startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  const endStr = content.substring(endIndex, content.indexOf("}", endIndex) + 1);
  const oldFunc = content.substring(startIndex, content.indexOf("}", endIndex) + 1);
  
  const newFunc = `export async function publishVideoReviewFromScratch(
  params: PublishReviewParams
): Promise<VideoReview> {
  const {
    placeId,
    placeName,
    placeCategory,
    placeAddress,
    placeCity,
    placeRating = 4.8,
    placeWebsite = "",
    placeLogoUrl = "",
    rating,
    caption,
    dishTag = "",
    recordedBlob,
    sampleVideoUrl = "",
    customPosterUrl = "",
    recordedSeconds,
    currentUser,
    onProgress
  } = params;

  if (!recordedBlob || recordedBlob.size === 0) {
    throw new Error("Video blob is empty or missing.");
  }

  const newId = \`rev-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`;
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

  let fileExt = "mp4";
  const rawMime = recordedBlob.type || "video/mp4";
  if (rawMime.includes("webm")) fileExt = "webm";
  else if (rawMime.includes("quicktime") || rawMime.includes("mov")) fileExt = "mov";

  const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
  const { doc, setDoc } = await import("firebase/firestore");
  
  const storageRef = ref(storage, \`videos/\${newId}.\${fileExt}\`);
  const uploadTask = uploadBytesResumable(storageRef, recordedBlob, { contentType: rawMime });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Calculate real-time percentage
        const progress = snapshot.totalBytes > 0 
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) 
          : 0;
          
        onProgress?.({
          percent: progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          statusText: \`Uploading \${progress}%\`,
          stage: "uploading"
        });
      },
      (error) => {
        console.error("Firebase Storage Upload Error:", error);
        reject(error);
      },
      async () => {
        try {
          onProgress?.({
            percent: 99,
            bytesTransferred: uploadTask.snapshot.totalBytes,
            totalBytes: uploadTask.snapshot.totalBytes,
            statusText: "Finalizing video upload...",
            stage: "syncing"
          });

          // 3. Upload completed successfully, get public download URL
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

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
            videoUrl: downloadUrl,
            thumbnailUrl: customPosterUrl?.startsWith("http") ? customPosterUrl : \`https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80\`,
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

          // 4. Write document to Firestore AFTER upload is 100% done
          await setDoc(doc(db, "videoReviews", newId), reviewDoc);

          onProgress?.({
            percent: 100,
            bytesTransferred: uploadTask.snapshot.totalBytes,
            totalBytes: uploadTask.snapshot.totalBytes,
            statusText: "Review Published Successfully!",
            stage: "complete"
          });

          resolve(reviewDoc);
        } catch (dbError) {
          console.error("Firestore Save Error after upload:", dbError);
          reject(dbError);
        }
      }
    );
  });
}`;

  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync('src/lib/videoStorage.ts', content);
  console.log("Patched publishVideoReviewFromScratch successfully!");
} else {
  console.log("Could not find function markers", startIndex, endIndex);
}
