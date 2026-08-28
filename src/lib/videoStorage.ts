import { VideoReview } from "../types";
import { validateAndOptimizeVideoBlob, VideoMetadata } from "./videoCompression";
import { db, storage } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "../lib/firebase";
import { collection, doc, setDoc, getDocs, orderBy, query } from "../lib/firebase";

// ==========================================
// IndexedDB Local Video Vault
// ==========================================

const DB_NAME = "yoouz_video_vault";
const STORE_NAME = "video_blobs";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        return reject(new Error("IndexedDB not supported"));
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

// ==========================================
// Video Storage & Streaming Engine
// ==========================================

export async function saveVideoBlobToIndexedDB(videoId: string, blob: Blob): Promise<boolean> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, videoId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn("IndexedDB save error:", err);
    return false;
  }
}

export async function getVideoBlobFromIndexedDB(videoId: string): Promise<string | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);
      req.onsuccess = () => {
        const blob = req.result as Blob;
        if (blob && blob instanceof Blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("IndexedDB get error:", err);
    return null;
  }
}

export async function getRawVideoBlobFromIndexedDB(videoId: string): Promise<Blob | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);
      req.onsuccess = () => {
        const blob = req.result as Blob;
        if (blob && blob instanceof Blob) {
          resolve(blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("IndexedDB raw get error:", err);
    return null;
  }
}

// ==========================================
// Firebase Resumable Storage Upload Engine
// ==========================================

export interface UploadProgressInfo {
  percent: number;
  bytesTransferred: number;
  totalBytes: number;
  statusText: string;
  stage: "optimizing" | "uploading" | "syncing" | "complete" | "error";
}

export type ProgressCallback = (info: UploadProgressInfo) => void;

/**
 * Uploads a video blob directly using the high-performance multipart streaming API with live progress tracking.
 * On completion, resolves with the verified public tokenized streaming / cloud download URL.
 */
export async function uploadVideoResumableWithProgress(
  blob: Blob,
  videoId: string,
  onProgress?: ProgressCallback
): Promise<{ downloadUrl: string; thumbnailUrl?: string; provider: "server" | "firebase" | "bunny", bunnyVideoId?: string }> {
  try {
    // Send to our server to handle Bunny CDN upload
    const result = await uploadVideoToServerWithProgress(blob, videoId, (pct) => {
      onProgress?.({
        percent: pct,
        bytesTransferred: 0,
        totalBytes: blob.size,
        statusText: `Uploading video... ${pct}%`,
        stage: pct === 100 ? "complete" : "uploading"
      });
    });

    if (result && result.url) {
      return { 
        downloadUrl: result.url, 
        thumbnailUrl: result.thumbnailUrl, 
        provider: result.url.includes('b-cdn.net') ? "bunny" : "server",
        bunnyVideoId: result.bunnyVideoId
      };
    }
  } catch (err) {
    console.warn("Server upload failed:", err);
  }
  
  // Fallback to local server stream URL
  return { downloadUrl: `/api/videos/stream/${videoId}.mp4`, provider: "server" };
}


// ==========================================
// Existing Utility Functions
// ==========================================

export async function uploadVideoToFirebaseStorage(blob: Blob, videoId: string): Promise<string | null> {
  try {
    const res = await uploadVideoResumableWithProgress(blob, videoId);
    return res.downloadUrl;
  } catch (e) {
    return null;
  }
}

export async function uploadVideoToServerWithProgress(
  blob: Blob,
  videoId: string,
  onProgress: (percent: number) => void
): Promise<{ url: string, thumbnailUrl?: string, bunnyVideoId?: string } | null> {
  return new Promise((resolve) => {
    let ext = "mp4";
    const mime = blob.type || "video/mp4";
    if (mime.includes("webm")) ext = "webm";
    else if (mime.includes("quicktime") || mime.includes("mov")) ext = "mov";

    const fileName = `${videoId}.${ext}`;
    const formData = new FormData();
    formData.append("video", blob, fileName);
    formData.append("fileName", fileName);
    formData.append("mimeType", mime);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(Math.min(100, percent));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            onProgress(100);
            const finalUrl = data.url.includes("/api/videos/stream/")
              ? `/api/videos/stream/${data.url.split("/api/videos/stream/")[1]}`
              : data.url;
            
            // Extract the Bunny video ID (the clean file name without extension) from the server response
            let bunnyId = data.fileName ? data.fileName.split('.')[0] : undefined;
            if (data.url && data.url.includes('b-cdn.net')) {
               bunnyId = data.fileName ? data.fileName.split('.')[0] : videoId;
            }

            resolve({ url: finalUrl, thumbnailUrl: data.thumbnailUrl, bunnyVideoId: bunnyId });
            return;
          }
        } catch (e) {}
      }
      resolve(null);
    };

    xhr.onerror = () => resolve(null);
    xhr.timeout = 60000;
    xhr.ontimeout = () => resolve(null);
    xhr.send(formData);
  });
}

export async function uploadVideoToServer(blob: Blob, videoId: string): Promise<string | null> {
  const result = await uploadVideoToServerWithProgress(blob, videoId, () => {});
  return result?.url || null;
}

export async function transcribeVideoBlobWithGemini(blob: Blob): Promise<string> {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const response = await fetch("/api/videos/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoData: base64Data,
        mimeType: blob.type || "video/webm"
      })
    });

    if (response.ok) {
      const data = await response.json();
      return (data.transcript || "").trim();
    }
    return "";
  } catch (err) {
    console.warn("Gemini transcription client error:", err);
    return "";
  }
}
