export const preloadImage = (url: string | null | undefined) => {
  if (!url) return;
  // Don't preload data URIs, they are already in memory
  if (url.startsWith('data:')) return;
  
  // Use a generic image object to force the browser to cache the network request
  const img = new window.Image();
  img.src = url;
};

export const preloadBusinessAssets = (logoUrl?: string | null, bannerUrl?: string | null, avatarUrl?: string | null) => {
  if (logoUrl) preloadImage(logoUrl);
  if (bannerUrl) preloadImage(bannerUrl);
  if (avatarUrl) preloadImage(avatarUrl);
};
