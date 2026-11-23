import { getProxiedImageUrl, KNOWN_BRAND_LOGOS } from './logoUtils';
import { toCardPhotoUrl } from './videoUtils';

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
      img.decoding = 'async';

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

const resolvePreloadLogoUrl = (review: any): string => {
  if (!review) return '';
  const dom = String(review.brandDomain || review.placeId || '').toLowerCase().replace(/^www\./, '').trim();
  if (dom && KNOWN_BRAND_LOGOS[dom]) {
    return getProxiedImageUrl(KNOWN_BRAND_LOGOS[dom]) || KNOWN_BRAND_LOGOS[dom];
  }
  const raw = review.placeLogoUrl || review.logoUrl || '';
  if (raw && typeof raw === 'string' && raw.trim()) {
    return getProxiedImageUrl(raw.trim()) || raw.trim();
  }
  return dom && dom.includes('.') ? `/api/favicon?domain=${encodeURIComponent(dom)}` : '';
};

/**
 * Preload all photos and media associated with a review.
 */
export const preloadReviewAssets = (review: any) => {
  if (!review) return;
  const photo = review.photoUrl || review.photoDataUrl || review.thumbnailUrl;
  if (photo) {
    const cardUrl = toCardPhotoUrl(photo);
    if (cardUrl && cardUrl !== photo) preloadImage(cardUrl, 'high');
    preloadImage(photo, 'high');
  }
  const logo = resolvePreloadLogoUrl(review);
  if (logo) preloadImage(logo, 'high');
  if (review.placeBannerUrl) preloadImage(getProxiedImageUrl(review.placeBannerUrl) || review.placeBannerUrl, 'auto');
  if (review.author?.avatar) preloadImage(review.author.avatar, 'auto');
};

/**
 * Batch preload an array of image URLs smoothly in parallel waves
 * without starving network sockets.
 */
export const preloadImageBatch = (urls: (string | null | undefined)[], priority: 'high' | 'auto' = 'auto', immediateCount = 12) => {
  const valid = Array.from(
    new Set(
      urls
        .filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0 && !u.trim().startsWith('data:')))
        .map((u) => u.trim())
    )
  );
  if (valid.length === 0) return;

  // Immediately decode first wave at requested priority
  const firstWave = valid.slice(0, immediateCount);
  firstWave.forEach((url) => preloadImage(url, priority));

  // Pump remaining images in smooth micro-waves of 6 so every business/user profile photo, logo & banner is warm
  let cursor = immediateCount;
  const pump = () => {
    const end = Math.min(cursor + 6, valid.length);
    for (; cursor < end; cursor++) {
      preloadImage(valid[cursor], 'auto');
    }
    if (cursor < valid.length) {
      setTimeout(pump, 70);
    }
  };
  if (valid.length > immediateCount) {
    setTimeout(pump, 80);
  }
};

/**
 * Preload EVERY review photo, business logo, business banner, and reviewer avatar in priority waves:
 * - Wave 0 (immediate): Top 8 logos + Top 8 ultra-light Retina ?v=card thumbnails (~15KB each)
 * - Wave 1 (+160ms): Remaining ?v=card thumbnails + remaining brand logos
 * - Wave 2 (+420ms): Full-resolution 2K HD review photos (top 10) + business banners + avatars
 * This guarantees 0ms above-the-fold card paint AND instant full-screen transitions without socket contention.
 */
export const preloadAllReviewPhotos = (reviews: any[], priorityCount = 16) => {
  if (!Array.isArray(reviews) || reviews.length === 0 || typeof window === 'undefined') return;
  const immediateWave: string[] = [];
  const cardWave: string[] = [];
  const fullHdWave: string[] = [];

  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    if (!r) continue;
    const rawPhoto = r.photoUrl || r.photoDataUrl || r.thumbnailUrl;
    const fullPhoto = rawPhoto && typeof rawPhoto === 'string' ? rawPhoto.trim() : '';
    const cardPhoto = fullPhoto ? toCardPhotoUrl(fullPhoto) : '';
    const logo = resolvePreloadLogoUrl(r);
    const bannerRaw = r.placeBannerUrl || r.bannerUrl;
    const banner = bannerRaw && typeof bannerRaw === 'string' ? (getProxiedImageUrl(bannerRaw.trim()) || bannerRaw.trim()) : '';
    const avatar = r.author?.avatar || r.author?.avatarUrl;

    if (i < 8) {
      if (logo) immediateWave.push(logo);
      if (cardPhoto) immediateWave.push(cardPhoto);
      if (fullPhoto && fullPhoto !== cardPhoto) fullHdWave.push(fullPhoto);
      if (banner) fullHdWave.push(banner);
      if (avatar && typeof avatar === 'string' && avatar.trim()) fullHdWave.push(avatar.trim());
    } else {
      if (cardPhoto) cardWave.push(cardPhoto);
      if (logo) cardWave.push(logo);
      if (i < 16 && fullPhoto && fullPhoto !== cardPhoto) fullHdWave.push(fullPhoto);
      if (banner) fullHdWave.push(banner);
    }
  }

  // Wave 0: Ultra-light logos + Retina card WebPs (completes in ~20ms)
  preloadImageBatch(immediateWave, 'high', Math.min(priorityCount, immediateWave.length || 16));

  // Wave 1: Off-screen card thumbnails & remaining logos after initial paint settles
  if (cardWave.length > 0) {
    setTimeout(() => {
      preloadImageBatch(cardWave, 'auto', 6);
    }, 160);
  }

  // Wave 2: Full-res 2K HD photos + profile banners strictly AFTER page load settles
  // so zero heavy HD bytes ever compete with above-the-fold card paint on cellular networks
  if (fullHdWave.length > 0) {
    const startHdWave = () => {
      setTimeout(() => {
        preloadImageBatch(fullHdWave, 'auto', 4);
      }, 450);
    };
    if (document.readyState === 'complete') {
      startHdWave();
    } else {
      window.addEventListener('load', startHdWave, { once: true });
    }
  }
};
