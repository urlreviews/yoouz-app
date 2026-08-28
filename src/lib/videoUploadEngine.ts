import { collection, addDoc, serverTimestamp, setDoc, doc } from "../lib/firebase";
import { db } from "./firebase";

export async function uploadVideoReview(
  blob: Blob,
  meta: any,
  onProgress: (pct: number) => void
): Promise<string> {
  console.log("🔥 [videoUploadEngine] Starting backend video upload of size:", blob.size);
  onProgress(5); // Start with a small progress indicator immediately

  const formData = new FormData();
  // Name the file dynamically with a unique timestamp
  const mime = blob.type || "video/mp4";
  let ext = "mp4";
  if (mime.includes("webm")) ext = "webm";
  else if (mime.includes("quicktime") || mime.includes("mov")) ext = "mov";

  const fileName = `rev-${Date.now()}.${ext}`;
  formData.append("video", blob, fileName);
  formData.append("fileName", fileName);
  formData.append("mimeType", mime);

  const uploadedUrl = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Map progress from 5% to 95% during actual file transfer
        const percent = Math.min(95, Math.round((event.loaded / event.total) * 90) + 5);
        console.log(`🔥 [videoUploadEngine] Upload progress: ${percent}%`);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.url) {
            onProgress(98);
            console.log("🔥 [videoUploadEngine] Upload successful, url:", res.url);
            resolve(res.url);
          } else {
            reject(new Error(res.error || "Failed to parse upload response URL"));
          }
        } catch (e: any) {
          reject(new Error("Failed to parse upload response JSON: " + e.message));
        }
      } else {
        reject(new Error(`Server returned HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error occurred during video upload."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload timed out. Please try again."));
    };

    xhr.send(formData);
  });

  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fullReview = {
    ...meta,
    id: reviewId,
    videoUrl: uploadedUrl,
    createdAt: new Date().toISOString(),
    createdAtMs: Date.now()
  };

  // 1. Persist to server index
  try {
    await fetch("/api/videos/save-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullReview)
    }).catch(() => {});
  } catch (e) {}

  // 2. Persist to Firestore if available
  try {
    if (db) {
      await setDoc(doc(db, "videoReviews", reviewId), {
        ...fullReview,
        createdAt: serverTimestamp()
      }, { merge: true }).catch((err) => {
        console.warn("Firestore upload review write notice:", err?.message || err);
      });
    }
  } catch (e) {}

  onProgress(100);
  return reviewId;
}
