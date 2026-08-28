import { VideoReview } from "../types";

// Bunny CDN Pull Zone Configuration (from Vite environment or default CDN edge)
const DEFAULT_BUNNY_PULL_ZONE = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BUNNY_PULL_ZONE_URL) || "";

/**
 * Normalizes video URLs to ensure flawless cross-origin and cross-device playback.
 * Automatically handles public static assets, Bunny CDN edge URLs, remote CDNs, and server streaming endpoints.
 */
export function normalizeVideoUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "/api/videos/stream/default-review.mp4";
  const trimmed = url.trim();
  if (!trimmed) return "/api/videos/stream/default-review.mp4";

  // 1. Base64 data URI
  if (trimmed.startsWith("data:video/")) {
    return trimmed;
  }

  // 2. Static root assets (e.g. /default-review.mp4 or default-review.mp4)
  if (trimmed === "/default-review.mp4" || trimmed === "default-review.mp4" || trimmed === "/api/videos/stream/default-review.mp4") {
    return "/api/videos/stream/default-review.mp4";
  }

  // 3. Bunny CDN Edge URLs & Remote CDNs
  if (
    trimmed.includes("b-cdn.net") ||
    trimmed.includes("bunnycdn.com") ||
    trimmed.includes("video.bunnycdn.com") ||
    trimmed.includes("firebasestorage.googleapis.com") ||
    trimmed.includes("cloudinary.com") ||
    trimmed.includes("googleapis.com")
  ) {
    return trimmed;
  }

  // 4. Full HTTP/HTTPS URLs (check if pointing to this app's streaming or upload endpoint)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const secureUrl = trimmed.replace("http://", "https://");
    
    if (secureUrl.includes("/api/videos/stream/")) {
      const filename = secureUrl.split("/api/videos/stream/")[1];
      if (filename) return `/api/videos/stream/${filename}`;
    }
    if (secureUrl.includes("/uploads/videos/")) {
      const filename = secureUrl.split("/uploads/videos/")[1];
      if (filename) return `/api/videos/stream/${filename}`;
    }
    if (secureUrl.includes("/uploads/")) {
      const filename = secureUrl.split("/uploads/")[1];
      if (filename && !filename.includes("/")) return `/api/videos/stream/${filename}`;
    }
    if (secureUrl.endsWith("/default-review.mp4") || secureUrl.endsWith("/api/videos/stream/default-review.mp4")) {
      return "/api/videos/stream/default-review.mp4";
    }
    // Remote external CDN URLs
    return secureUrl;
  }

  // Ignore dead serialized blob strings across network
  if (trimmed.startsWith("blob:")) {
    return "";
  }
  
  // 5. Identify if this is a review ID or local video filename
  const revMatch = trimmed.match(/(rev-\d+-[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)?)/);
  if (revMatch && revMatch[1]) {
    let filename = revMatch[1];
    if (!filename.includes(".")) filename += ".mp4";
    return `/api/videos/stream/${filename}`;
  }

  // 6. Relative paths
  if (trimmed.startsWith("/api/videos/stream/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    const filename = trimmed.replace(/^\/uploads\/(videos\/)?/, "");
    return `/api/videos/stream/${filename}`;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // 7. Raw filename or ID
  return `/api/videos/stream/${trimmed}`;
}

/**
 * Resolves the prioritized list of playable video sources for instant failover (Bunny CDN -> Local Server -> Fallback MP4).
 */
export function resolvePlayableVideoSourcesCascade(
  video?: VideoReview | null,
  cachedLocalBlobUrl?: string | null
): string[] {
  if (!video) return ["/api/videos/stream/default-review.mp4", "/api/videos/stream/default-review.mp4"];

  const sources: string[] = [];

  // 1. Fresh active session IndexedDB blob URL (instant local playback for creator)
  if (cachedLocalBlobUrl && cachedLocalBlobUrl.startsWith("blob:")) {
    sources.push(cachedLocalBlobUrl);
  }

  // 2. Base64 data URI
  if (video.videoData && video.videoData.startsWith("data:video/")) {
    sources.push(video.videoData);
  }

  // 3. Primary videoUrl
  const normalizedPrimary = normalizeVideoUrl(video.videoUrl);
  if (normalizedPrimary && !sources.includes(normalizedPrimary)) {
    sources.push(normalizedPrimary);
  }

  // 4. Bunny CDN Pull Zone Stream (if configured)
  if (DEFAULT_BUNNY_PULL_ZONE && video.id) {
    const cleanZone = DEFAULT_BUNNY_PULL_ZONE.replace(/\/$/, "");
    const bunnyUrl = `${cleanZone}/videos/${video.id}.mp4`;
    if (!sources.includes(bunnyUrl)) {
      sources.push(bunnyUrl);
    }
  }

  // 5. Fallback video URLs from document
  if (video.fallbackVideoUrls && Array.isArray(video.fallbackVideoUrls)) {
    for (const fb of video.fallbackVideoUrls) {
      const norm = normalizeVideoUrl(fb);
      if (norm && !sources.includes(norm)) {
        sources.push(norm);
      }
    }
  }

  // 6. Local Server streaming endpoint
  if (video.id) {
    const serverStream = `/api/videos/stream/${video.id}.mp4`;
    if (!sources.includes(serverStream)) {
      sources.push(serverStream);
    }
  }

  // 7. Guaranteed static default MP4 assets
  if (!sources.includes("/api/videos/stream/default-review.mp4")) {
    sources.push("/api/videos/stream/default-review.mp4");
  }

  return sources;
}

/**
 * Resolves the single best playable video source for a VideoReview document.
 */
export function resolvePlayableVideoSource(
  video?: VideoReview | null,
  cachedLocalBlobUrl?: string | null
): string {
  const cascade = resolvePlayableVideoSourcesCascade(video, cachedLocalBlobUrl);
  return cascade[0] || "/api/videos/stream/default-review.mp4";
}

/**
 * Resolves the best available cover thumbnail poster for a VideoReview.
 * Guarantees a high-contrast, polished visual poster so video cards are never black.
 */
export function resolveVideoPosterUrl(video?: VideoReview | null): string {
  if (!video) return "";

  const rawThumb = video.thumbnailUrl;
  if (rawThumb && typeof rawThumb === "string" && rawThumb.trim()) {
    const trimmed = rawThumb.trim();
    // Exclude mp4/video URLs and tiny icons from being treated as <img> sources
    const isVideoFile = trimmed.endsWith(".mp4") || trimmed.endsWith(".webm") || trimmed.endsWith(".mov") || trimmed.includes("/api/videos/stream/");
    const isTinyLogo =
      trimmed.includes("favicon") ||
      trimmed.includes("google.com/s2") ||
      trimmed.includes("clearbit.com") ||
      trimmed.includes("logo.png") ||
      trimmed.includes("logo.jpg");
    
    if (!isVideoFile && !isTinyLogo && (trimmed.startsWith("http") || trimmed.startsWith("data:") || trimmed.startsWith("/"))) {
      return trimmed;
    }
  }

  // Fallback to reviewer avatar (the person speaking)
  if (video.author?.avatar && (video.author.avatar.startsWith("http") || video.author.avatar.startsWith("data:") || video.author.avatar.startsWith("/"))) {
    return video.author.avatar;
  }

  // Fallback to place banner if available
  if (video.placeBannerUrl && (video.placeBannerUrl.startsWith("http") || video.placeBannerUrl.startsWith("/"))) {
    return video.placeBannerUrl;
  }

  // Safe SVG branded poster fallback with dark gradient backdrop
  const title = encodeURIComponent(video.placeName || "Authentic Video Review");
  const author = encodeURIComponent(video.author?.name || "Verified Reviewer");
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2318181b"/><stop offset="100%" stop-color="%2309090b"/></linearGradient></defs><rect width="720" height="1280" fill="url(%23g)"/><circle cx="360" cy="540" r="44" fill="%2327272a"/><polygon points="352,520 376,540 352,560" fill="%231a73e8"/><text x="360" y="650" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="bold" fill="%23ffffff" text-anchor="middle">${title}</text><text x="360" y="695" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle">Review by ${author}</text></svg>`;
}

