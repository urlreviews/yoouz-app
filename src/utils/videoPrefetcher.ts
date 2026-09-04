import { normalizeVideoUrl, resolvePlayableVideoSource, resolveVideoPosterUrl } from "./videoUtils";
import { saveVideoBlobToIndexedDB, getRawVideoBlobFromIndexedDB } from "../lib/videoStorage";

const preloadedUrls = new Set<string>();
const preloadedPosters = new Set<string>();
const videoBufferPool: HTMLVideoElement[] = [];
// Keep buffer pool small (1-2) to avoid exhausting iOS WebKit / Android hardware video decoders (limit ~3-4 concurrent streams)
const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
const MAX_BUFFER_POOL_SIZE = isTouchDevice ? 2 : 4;

/**
 * TikTok / YouTube Shorts-grade Video & Poster Prefetch Engine.
 * Preloads video byte streams, decodes initial frames into GPU cache,
 * and primes poster artwork so when swiping fast up or down on any mobile phone,
 * playback starts instantaneously without lag or black frames.
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

  // 1. High-Performance HTTP Byte Range Warm-Up (fetches initial 1MB chunk into browser edge cache)
  try {
    fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1048575" },
      mode: "cors",
      cache: "force-cache"
    }).catch(() => {});
  } catch (e) {}

  // 2. Headless GPU-warmed HTMLVideoElement Pre-buffer (primes decoding pipeline)
  try {
    if (typeof document !== "undefined") {
      const warmVideo = document.createElement("video");
      warmVideo.preload = "auto";
      warmVideo.muted = true;
      warmVideo.playsInline = true;
      (warmVideo as any)["webkit-playsinline"] = "true";
      (warmVideo as any)["x5-playsinline"] = "true";
      warmVideo.src = url;
      warmVideo.load();

      videoBufferPool.push(warmVideo);
      while (videoBufferPool.length > MAX_BUFFER_POOL_SIZE) {
        const oldest = videoBufferPool.shift();
        if (oldest) {
          oldest.removeAttribute("src");
          try {
            oldest.load();
          } catch (e) {}
        }
      }
    }
  } catch (e) {}

  // 3. High-Performance IndexedDB Blob Cache Background Prefetch (stores full video offline)
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
              }
            })
            .catch(() => {});
        }
      });
    } catch (e) {}
  }

  // 4. Preload Poster Image if provided
  if (posterUrl && !preloadedPosters.has(posterUrl)) {
    preloadedPosters.add(posterUrl);
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.src = posterUrl;
  }
};

/**
 * Batch-prefetches upcoming and neighboring videos around the current active index.
 */
export const prefetchUpcomingVideos = (videos: any[], currentIndex: number) => {
  if (!videos || videos.length === 0) return;
  // Lookahead: next 3 videos, lookbehind: previous 1 video
  const targetIndices = [
    currentIndex + 1,
    currentIndex + 2,
    currentIndex + 3,
    currentIndex - 1
  ];

  targetIndices.forEach((idx) => {
    if (idx >= 0 && idx < videos.length) {
      const v = videos[idx];
      if (v) {
        const src = resolvePlayableVideoSource(v);
        const poster = resolveVideoPosterUrl(v);
        if (src && !src.startsWith("blob:")) {
          prefetchVideo(src, poster);
        }
      }
    }
  });
};

export const getCachedVideoUrl = (rawUrl: string) => {
  return normalizeVideoUrl(rawUrl) || rawUrl;
};


