import { normalizeVideoUrl, resolvePlayableVideoSource, resolveVideoPosterUrl } from "./videoUtils";
import { saveVideoBlobToIndexedDB, getRawVideoBlobFromIndexedDB } from "../lib/videoStorage";

// Keep track of preloaded video URLs and poster images
const preloadedUrls = new Set<string>();
const preloadedPosters = new Set<string>();

/**
 * Universal Mobile & Desktop Video & Poster Prefetch Engine.
 * Preloads video byte streams using lightweight HTTP Range requests
 * and primes poster artwork into GPU image cache.
 * 
 * CRITICAL FIX FOR BRAVE, FIREFOX & SAFARI:
 * Never instantiate headless, unmounted <video> elements with .load() in JavaScript.
 * Unmounted video elements leak hardware media decoders in iOS WebKit, Firefox Gecko,
 * and Chromium/Brave, causing video freeze or audio cutoff after 3-4 videos.
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

  // 1. High-Performance HTTP Byte Range Warm-Up (fetches initial 512KB chunk into browser edge cache)
  try {
    fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-524287" },
      mode: "cors",
      cache: "force-cache"
    }).catch(() => {});
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
              }
            })
            .catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {}
  }

  // 3. Preload Poster Image into browser image cache
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


