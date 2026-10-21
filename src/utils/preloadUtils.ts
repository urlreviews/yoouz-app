export const preloadImage = (url: string | null | undefined) => {
  if (!url || typeof document === 'undefined') return;
  // Don't preload data URIs, they are already in memory
  if (url.startsWith('data:')) return;
  
  // Use link rel=preload for high-priority network scheduling
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  
  // Also keep the Image object fallback for older browser compatibility and to ensure cache hit
  const img = new window.Image();
  img.src = url;
  
  document.head.appendChild(link);
};

export const preloadBusinessAssets = (logoUrl?: string | null, bannerUrl?: string | null, avatarUrl?: string | null) => {
  if (logoUrl) preloadImage(logoUrl);
  if (bannerUrl) preloadImage(bannerUrl);
  if (avatarUrl) preloadImage(avatarUrl);
};
