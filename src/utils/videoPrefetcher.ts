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

  // 1. High-Performance Poster Preload (primes GPU texture cache without touching decoders or socket queues)
  if (posterUrl && !preloadedPosters.has(posterUrl)) {
    preloadedPosters.add(posterUrl);
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.src = posterUrl;
  }
  
  // NOTE: We intentionally removed the HTTP fetch Range requests here because desktop browsers (Chrome/Safari)
  // strictly limit concurrent connections. Making background fetch requests for videos while the `<video>` player
  // is simultaneously trying to load the active stream causes severe network queue starvation, resulting in a 3+ second delay.
};

/**
 * Lightweight lookahead prefetcher for the immediate next video only.
 * Avoids browser connection starvation and decoder blocking.
 */
export const prefetchUpcomingVideos = (videos: any[], currentIndex: number) => {
  if (!videos || videos.length === 0) return;
  // Lookahead: strictly immediate next video (currentIndex + 1) to conserve connection slots
  const nextIdx = currentIndex + 1;
  if (nextIdx < videos.length) {
    const v = videos[nextIdx];
    if (v) {
      const src = resolvePlayableVideoSource(v);
      const poster = resolveVideoPosterUrl(v);
      if (src && !src.startsWith("blob:")) {
        prefetchVideo(src, poster);
      }
    }
  }

  // Also prefetch poster only for currentIndex + 2 so images are instant
  const nextNextIdx = currentIndex + 2;
  if (nextNextIdx < videos.length) {
    const nextV = videos[nextNextIdx];
    if (nextV) {
      const poster = resolveVideoPosterUrl(nextV);
      if (poster && !preloadedPosters.has(poster)) {
        preloadedPosters.add(poster);
        const img = new Image();
        img.referrerPolicy = "no-referrer";
        img.src = poster;
      }
    }
  }
};

export const getCachedVideoUrl = (rawUrl: string) => {
  return normalizeVideoUrl(rawUrl) || rawUrl;
};


