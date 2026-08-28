import { normalizeVideoUrl } from "./videoUtils";
import { saveVideoBlobToIndexedDB, getRawVideoBlobFromIndexedDB } from "../lib/videoStorage";

const preloadedUrls = new Set<string>();
const preloadedPosters = new Set<string>();
const videoBufferPool: HTMLVideoElement[] = [];
const MAX_BUFFER_POOL_SIZE = 4;

/**
 * TikTok / YouTube Shorts-grade Video & Poster Prefetch Engine.
 * Preloads video byte streams, decodes initial frames into GPU cache,
 * and primes poster artwork so when scrolling down, playback starts instantaneously.
 */
export const prefetchVideo = (rawUrl: string, posterUrl?: string) => {
  if (!rawUrl || typeof rawUrl !== "string") return;
  const url = normalizeVideoUrl(rawUrl);
  if (!url || url.startsWith("blob:") || url.startsWith("data:") || preloadedUrls.has(url)) return;

  preloadedUrls.add(url);

  // Extract video ID from stream URL to index in local storage
  let videoId = "";
  if (url.includes("/api/videos/stream/")) {
    videoId = url.split("/api/videos/stream/")[1]?.replace(/\.[^.]+$/, "") || "";
  }

  // 1. Headless GPU-warmed HTMLVideoElement Pre-buffer (primes decoding pipeline)
  try {
    if (typeof document !== "undefined") {
      const warmVideo = document.createElement("video");
      warmVideo.preload = "auto";
      warmVideo.muted = true;
      warmVideo.playsInline = true;
      (warmVideo as any)["webkit-playsinline"] = "true";
      warmVideo.src = url;
      warmVideo.load();

      videoBufferPool.push(warmVideo);
      if (videoBufferPool.length > MAX_BUFFER_POOL_SIZE) {
        const oldest = videoBufferPool.shift();
        if (oldest) {
          oldest.src = "";
          oldest.load();
        }
      }
    }
  } catch (e) {}

  // 2. High-Performance IndexedDB Blob Cache Background Prefetch (stores full video offline)
  if (videoId) {
    try {
      getRawVideoBlobFromIndexedDB(videoId).then((existing) => {
        if (!existing) {
          fetch(url)
            .then((res) => {
              if (res.ok) return res.blob();
              throw new Error("Fetch failed");
            })
            .then((blob) => {
              if (blob && blob.size > 1000) {
                saveVideoBlobToIndexedDB(videoId, blob);
                console.log(`⚡ [Prefetcher] Cached video ${videoId} in IndexedDB (${blob.size} bytes)`);
              }
            })
            .catch(() => {});
        }
      });
    } catch (e) {}
  }

  // 3. HTTP Byte Range Warm-Up (fallback fetches initial 512KB chunk into browser disk/RAM cache)
  try {
    fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-524287" },
      mode: "cors",
      cache: "force-cache"
    }).catch(() => {});
  } catch (e) {}

  // 4. Preload Poster Image if provided
  if (posterUrl && !preloadedPosters.has(posterUrl)) {
    preloadedPosters.add(posterUrl);
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.src = posterUrl;
  }
};

export const getCachedVideoUrl = (rawUrl: string) => {
  return normalizeVideoUrl(rawUrl) || rawUrl;
};

