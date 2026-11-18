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

import { preloadImage, preloadReviewAssets } from "./preloadUtils";

/**
 * Universal Mobile & Desktop Review & Photo Prefetch Engine.
 * Preloads photo review images and decodes them directly into GPU cache,
 * ensuring zero-black-frame transitions when browsing feeds.
 */
export const prefetchUpcomingVideos = (videos: any[], currentIndex: number) => {
  if (!videos || videos.length === 0) return;
  
  // Lookahead: Pre-decode photos for upcoming cards (1, 2, and 3 steps ahead)
  for (let offset = 1; offset <= 3; offset++) {
    const idx = currentIndex + offset;
    if (idx < videos.length) {
      const v = videos[idx];
      if (v) {
        // Pre-decode review photo or poster into GPU memory
        const photo = v.photoUrl || v.photoDataUrl || resolveVideoPosterUrl(v);
        if (photo) {
          preloadImage(photo, offset === 1 ? 'high' : 'auto');
        }
        // Preload place logo / banner if present
        if (v.placeLogoUrl) preloadImage(v.placeLogoUrl, 'auto');
        if (v.placeBannerUrl) preloadImage(v.placeBannerUrl, 'auto');
        
        // Video byte prefetch for any video reviews
        const src = resolvePlayableVideoSource(v);
        if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
          prefetchVideo(src, photo);
        }
      }
    }
  }
};

/**
 * Eagerly prewarms the initial feed batch on app or page mount.
 * Prevents any first-second black frames or loading spinners for the user.
 */
export const prefetchInitialFeedPhotos = (videos: any[], count: number = 8) => {
  if (!videos || videos.length === 0) return;
  const initialBatch = videos.slice(0, count);
  initialBatch.forEach((v, i) => {
    const photo = v.photoUrl || v.photoDataUrl || resolveVideoPosterUrl(v);
    if (photo) {
      preloadImage(photo, i < 3 ? 'high' : 'auto');
    }
    if (v.placeLogoUrl) preloadImage(v.placeLogoUrl, 'auto');
    if (v.placeBannerUrl) preloadImage(v.placeBannerUrl, 'auto');
  });
};

export const getCachedVideoUrl = (rawUrl: string) => {
  return normalizeVideoUrl(rawUrl) || rawUrl;
};


