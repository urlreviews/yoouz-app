// Persistent in-memory decoded image cache shared with pre-hydration SSR bootstrap.
// Pinning HTMLImageElement references in a bounded Map prevents Chrome/Safari GC
// from evicting decoded GPU bitmaps across route/drawer transitions.
const MAX_PINNED_IMAGES = 360;

const getGlobalImageCache = (): Map<string, HTMLImageElement> => {
  if (typeof window === 'undefined') return new Map();
  const w = window as any;
  if (!(w.__YOOUZ_IMAGE_CACHE__ instanceof Map)) {
    w.__YOOUZ_IMAGE_CACHE__ = new Map<string, HTMLImageElement>();
  }
  return w.__YOOUZ_IMAGE_CACHE__;
};

const getGlobalReadySet = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  const w = window as any;
  if (!(w.__YOOUZ_IMAGE_READY__ instanceof Set)) {
    w.__YOOUZ_IMAGE_READY__ = new Set<string>();
  }
  return w.__YOOUZ_IMAGE_READY__;
};

const IN_FLIGHT_PRELOADS = new Map<string, Promise<boolean>>();

/**
 * Determines whether a URL is external (cross-origin) and therefore benefits from
 * referrerPolicy="no-referrer". Same-origin URLs (like /uploads/photos/*) MUST NOT
 * set mismatched referrerPolicy so Blink & WebKit achieve 100% Memory Cache hits.
 */
export const isExternalCrossOriginUrl = (url: string): boolean => {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  if (typeof window === 'undefined') return true;
  try {
    return new URL(url).origin !== window.location.origin;
  } catch {
    return true;
  }
};

/**
 * Universal Zero-Warning & Instant-Decode Image Preloader.
 * Uses browser image decoding API (img.decode) and pins the decoded HTMLImageElement
 * in memory so mounting <img> on ANY page paints synchronously on frame 0.
 * Never injects <link rel="preload"> in DOM, avoiding Chrome unused-preload warnings.
 */
export const preloadImage = (url: string | null | undefined, priority: 'high' | 'auto' = 'auto'): Promise<boolean> => {
  if (!url || typeof window === 'undefined') return Promise.resolve(false);
  const clean = url.trim();
  if (!clean || clean === 'data:;' || clean.startsWith('data:;')) return Promise.resolve(false);

  // Data URIs are already resident in memory
  if (clean.startsWith('data:')) {
    return Promise.resolve(true);
  }

  const cache = getGlobalImageCache();
  const readySet = getGlobalReadySet();

  const existingImg = cache.get(clean);
  if (existingImg) {
    if (readySet.has(clean) || (existingImg.complete && existingImg.naturalWidth > 0)) {
      readySet.add(clean);
      return Promise.resolve(true);
    }
    const inFlight = IN_FLIGHT_PRELOADS.get(clean);
    if (inFlight) return inFlight;
  }

  const promise = new Promise<boolean>((resolve) => {
    try {
      const img = new window.Image();
      if (isExternalCrossOriginUrl(clean)) {
        img.referrerPolicy = 'no-referrer';
      }
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }
      img.decoding = 'sync';

      // Enforce bounded LRU-style cache size
      if (cache.size >= MAX_PINNED_IMAGES && !cache.has(clean)) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) {
          cache.delete(oldestKey);
          readySet.delete(oldestKey);
        }
      }
      cache.set(clean, img);

      img.onload = () => {
        readySet.add(clean);
        IN_FLIGHT_PRELOADS.delete(clean);
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode()
            .then(() => resolve(true))
            .catch(() => resolve(true));
        } else {
          resolve(true);
        }
      };

      img.onerror = () => {
        cache.delete(clean);
        readySet.delete(clean);
        IN_FLIGHT_PRELOADS.delete(clean);
        resolve(false);
      };

      img.src = clean;

      // Handle synchronous cache hit (already complete right after setting .src)
      if (img.complete && img.naturalWidth > 0) {
        readySet.add(clean);
        IN_FLIGHT_PRELOADS.delete(clean);
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
        resolve(true);
      }
    } catch {
      IN_FLIGHT_PRELOADS.delete(clean);
      resolve(false);
    }
  });

  IN_FLIGHT_PRELOADS.set(clean, promise);
  return promise;
};

/**
 * Check synchronously if an image URL has already been prewarmed and decoded in memory.
 */
export const isImagePreloaded = (url: string | null | undefined): boolean => {
  if (!url || typeof window === 'undefined') return false;
  const clean = url.trim();
  if (!clean) return false;
  if (clean.startsWith('data:')) return true;
  const readySet = getGlobalReadySet();
  if (readySet.has(clean)) return true;
  const cached = getGlobalImageCache().get(clean);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    readySet.add(clean);
    return true;
  }
  return false;
};

/**
 * Preload and decode business profile assets (logo, banner, avatar).
 */
export const preloadBusinessAssets = (logoUrl?: string | null, bannerUrl?: string | null, avatarUrl?: string | null) => {
  if (logoUrl) preloadImage(logoUrl, 'high');
  if (bannerUrl) preloadImage(bannerUrl, 'high');
  if (avatarUrl) preloadImage(avatarUrl, 'auto');
};

/**
 * Preload all photos and media associated with a review.
 */
export const preloadReviewAssets = (review: any) => {
  if (!review) return;
  const photo = review.photoUrl || review.photoDataUrl || review.thumbnailUrl;
  if (photo) preloadImage(photo, 'high');
  if (review.placeLogoUrl) preloadImage(review.placeLogoUrl, 'high');
  if (review.placeBannerUrl) preloadImage(review.placeBannerUrl, 'auto');
  if (review.author?.avatar) preloadImage(review.author.avatar, 'auto');
};

/**
 * Batch preload an array of image URLs smoothly in parallel waves
 * without starving network sockets.
 */
export const preloadImageBatch = (urls: (string | null | undefined)[], priority: 'high' | 'auto' = 'auto', immediateCount = 14) => {
  const valid = Array.from(
    new Set(
      urls
        .filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0 && !u.trim().startsWith('data:')))
        .map((u) => u.trim())
    )
  );
  if (valid.length === 0) return;

  // Immediately decode first wave at high priority
  const firstWave = valid.slice(0, immediateCount);
  firstWave.forEach((url) => preloadImage(url, priority));

  // Pump remaining images in smooth micro-waves of 8 so every business/user profile photo, logo & banner is warm
  let cursor = immediateCount;
  const pump = () => {
    const end = Math.min(cursor + 8, valid.length);
    for (; cursor < end; cursor++) {
      preloadImage(valid[cursor], 'auto');
    }
    if (cursor < valid.length) {
      setTimeout(pump, 60);
    }
  };
  if (valid.length > immediateCount) {
    setTimeout(pump, 75);
  }
};

/**
 * Preload EVERY review photo, business logo, business banner, and reviewer avatar in the feed
 * so navigating to Homepage, Feed, Business Profiles, User Profiles, or Bookmarks
 * renders every single image instantaneously on frame 0 with zero loading flash.
 */
export const preloadAllReviewPhotos = (reviews: any[], priorityCount = 16) => {
  if (!Array.isArray(reviews) || reviews.length === 0 || typeof window === 'undefined') return;
  const highUrls: string[] = [];
  const bgUrls: string[] = [];
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    if (!r) continue;
    const p = r.photoUrl || r.photoDataUrl || r.thumbnailUrl;
    const logo = r.placeLogoUrl;
    const banner = r.placeBannerUrl;
    const avatar = r.author?.avatar || r.author?.avatarUrl;
    if (i < 8) {
      if (p && typeof p === 'string' && p.trim()) highUrls.push(p.trim());
      if (logo && typeof logo === 'string' && logo.trim()) highUrls.push(logo.trim());
      if (banner && typeof banner === 'string' && banner.trim()) bgUrls.push(banner.trim());
      if (avatar && typeof avatar === 'string' && avatar.trim()) bgUrls.push(avatar.trim());
    } else {
      if (p && typeof p === 'string' && p.trim()) bgUrls.push(p.trim());
      if (logo && typeof logo === 'string' && logo.trim()) bgUrls.push(logo.trim());
      if (banner && typeof banner === 'string' && banner.trim()) bgUrls.push(banner.trim());
      if (avatar && typeof avatar === 'string' && avatar.trim()) bgUrls.push(avatar.trim());
    }
  }
  preloadImageBatch([...highUrls, ...bgUrls], 'high', priorityCount);
};
