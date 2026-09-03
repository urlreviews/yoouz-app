import { normalizeVideoUrl, resolvePlayableVideoSource, resolveVideoPosterUrl } from "./videoUtils";

const preloadedUrls = new Set<string>();
const preloadedPosters = new Set<string>();

/**
 * TikTok / YouTube Shorts-grade Video & Poster Prefetch Engine.
 * Preloads video byte streams using lightweight HTTP range requests
 * and primes poster artwork so when swiping fast up or down on any device,
 * playback starts instantaneously without lag or black frames.
 */
export const prefetchVideo = (rawUrl: string, posterUrl?: string) => {
  if (!rawUrl || typeof rawUrl !== "string") return;
  const url = normalizeVideoUrl(rawUrl);
  if (!url || url.startsWith("blob:") || url.startsWith("data:") || preloadedUrls.has(url)) return;

  preloadedUrls.add(url);

  // 1. HTTP Byte Range Warm-Up (fetches initial chunk into browser network/disk cache)
  try {
    fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1048575" },
      mode: "cors",
      cache: "force-cache"
    }).catch(() => {});
  } catch (e) {}

  // 2. Preload Poster Image if provided
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
