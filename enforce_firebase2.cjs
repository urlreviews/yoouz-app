const fs = require('fs');

let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const attempt2Old = `  try {
    onProgress?.({
      percent: 65,
      bytesTransferred: 0,
      totalBytes: blob.size,
      statusText: "Uploading video to Cloud Storage...",
      stage: "uploading"
    });

    const uploadPromise = uploadBytes(storageRef, blob, metadata).then((res) => getDownloadURL(res.ref));
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Cloud storage timeout")), 8000)
    );

    const url = await Promise.race([uploadPromise, timeoutPromise]);
    if (url && (url.startsWith("http") || url.startsWith("/"))) {
      onProgress?.({
        percent: 100,
        bytesTransferred: blob.size,
        totalBytes: blob.size,
        statusText: "Video successfully stored on Cloud Storage!",
        stage: "syncing"
      });
      return { downloadUrl: url, provider: "firebase" };
    }
  } catch (directUploadErr: any) {
    console.warn("Direct cloud storage notice:", directUploadErr);
  }`;

const attempt2New = `  try {
    onProgress?.({
      percent: 15,
      bytesTransferred: 0,
      totalBytes: blob.size,
      statusText: "Uploading video to Cloud Storage...",
      stage: "uploading"
    });

    // Use uploadBytes without a strict timeout to ensure large videos complete successfully on any network
    const uploadResult = await uploadBytes(storageRef, blob, metadata);
    const url = await getDownloadURL(uploadResult.ref);
    
    if (url) {
      onProgress?.({
        percent: 100,
        bytesTransferred: blob.size,
        totalBytes: blob.size,
        statusText: "Video successfully stored on Cloud Storage!",
        stage: "syncing"
      });
      return { downloadUrl: url, provider: "firebase" };
    }
  } catch (directUploadErr: any) {
    console.warn("Direct cloud storage notice:", directUploadErr);
    throw directUploadErr; // Throw so we don't silently fail to Firestore chunks which hit 1MB limits
  }`;

if (content.includes(attempt2Old)) {
  content = content.replace(attempt2Old, attempt2New);
  fs.writeFileSync('src/lib/videoStorage.ts', content);
  console.log("Patched Attempt 2 to remove 8-second timeout.");
} else {
  console.log("Could not find Attempt 2 block exactly as expected. I need to be more resilient.");
}
