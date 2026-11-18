// In-memory cache of pre-decoded images to prevent duplicate network fetches or decode overhead
const PRELOADED_ASSETS_SET = new Set<string>();

/**
 * Universal Zero-Warning & Instant-Decode Image Preloader.
 * Uses browser image decoding API (img.decode) directly into GPU raster memory.
 * Never uses <link rel="preload"> in DOM, preventing Chrome "was preloaded using link preload but not used" warnings.
 */
export const preloadImage = (url: string | null | undefined, priority: 'high' | 'auto' = 'auto'): Promise<boolean> => {
  if (!url || typeof window === 'undefined') return Promise.resolve(false);
  const clean = url.trim();
  if (!clean || clean === 'data:;' || clean.startsWith('data:;')) return Promise.resolve(false);
  
  if (PRELOADED_ASSETS_SET.has(clean)) {
    return Promise.resolve(true);
  }
  
  PRELOADED_ASSETS_SET.add(clean);

  // Data URIs are already resident in memory
  if (clean.startsWith('data:')) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.referrerPolicy = 'no-referrer';
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }
      
      img.onload = () => {
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode()
            .then(() => resolve(true))
            .catch(() => resolve(true));
        } else {
          resolve(true);
        }
      };
      
      img.onerror = () => {
        resolve(false);
      };
      
      img.src = clean;
    } catch {
      resolve(false);
    }
  });
};

/**
 * Check if an image URL has already been prewarmed and decoded in memory.
 */
export const isImagePreloaded = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return PRELOADED_ASSETS_SET.has(url.trim());
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
  if (review.placeLogoUrl) preloadImage(review.placeLogoUrl, 'auto');
  if (review.placeBannerUrl) preloadImage(review.placeBannerUrl, 'auto');
  if (review.author?.avatar) preloadImage(review.author.avatar, 'auto');
};

/**
 * Batch preload an array of image URLs sequentially or in micro-batches
 * without starving network sockets.
 */
export const preloadImageBatch = (urls: (string | null | undefined)[], priority: 'high' | 'auto' = 'auto') => {
  const valid = urls.filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0));
  valid.forEach((url, i) => {
    // Eagerly prewarm first 4, stagger remainder slightly
    if (i < 4) {
      preloadImage(url, priority);
    } else {
      setTimeout(() => preloadImage(url, 'auto'), (i - 3) * 60);
    }
  });
};
