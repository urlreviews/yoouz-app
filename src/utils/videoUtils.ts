import { VideoReview } from "../types";

// Bunny CDN Pull Zone Configuration (Dynamic with environment and API status support)
let activeBunnyPullZone = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BUNNY_PULL_ZONE_URL) || "https://rev1.b-cdn.net";

if (typeof window !== "undefined") {
  fetch("/api/cdn/status")
    .then((r) => r.json())
    .then((data) => {
      if (data?.pullZoneUrl && typeof data.pullZoneUrl === "string") {
        activeBunnyPullZone = data.pullZoneUrl.replace(/\/+$/, "");
      }
    })
    .catch(() => {});
}

/**
 * Normalizes video URLs to ensure flawless cross-origin and cross-device playback.
 * Automatically handles public static assets, Bunny CDN edge URLs, remote CDNs, and server streaming endpoints.
 */
export function normalizeVideoUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "/default-review.mp4";
  const trimmed = url.trim();
  if (!trimmed) return "/default-review.mp4";

  // 1. Base64 data URI
  if (trimmed.startsWith("data:video/")) {
    return trimmed;
  }

  // 2. Static root assets (e.g. /default-review.mp4 or default-review.mp4)
  if (trimmed === "/default-review.mp4" || trimmed === "default-review.mp4" || trimmed === "/api/videos/stream/default-review.mp4") {
    return "/default-review.mp4";
  }

  // 3. Bunny CDN Edge URLs & Remote CDNs
  if (
    trimmed.includes("b-cdn.net") ||
    trimmed.includes("bunnycdn.com") ||
    trimmed.includes("video.bunnycdn.com") ||
    trimmed.includes("cloudinary.com")
  ) {
    if (trimmed.includes("/banners/") || trimmed.includes("brand_banner")) {
      return trimmed;
    }
    const match = trimmed.match(/\/([a-zA-Z0-9_\-]+)\.(mp4|webm|mov|m3u8)/i) || trimmed.match(/\/videos\/([a-zA-Z0-9_\-]+)/i) || trimmed.match(/([a-zA-Z0-9_\-]+)$/);
    if (match && match[1] && match[1] !== "playlist" && match[1] !== "videos" && match[1] !== "uploads") {
      let filename = match[1];
      if (!filename.includes(".")) filename += ".mp4";
      return `/api/videos/stream/${filename}`;
    }
    return trimmed;
  }

  // 4. Full HTTP/HTTPS URLs (check if pointing to this app's streaming or upload endpoint)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const secureUrl = trimmed.replace("http://", "https://");
    
    if (secureUrl.includes("b-cdn.net") || secureUrl.includes("bunnycdn.com")) {
      if (!secureUrl.includes("/banners/") && !secureUrl.includes("brand_banner")) {
        const match = secureUrl.match(/\/([a-zA-Z0-9_\-]+)\.(mp4|webm|mov|m3u8)/i) || secureUrl.match(/\/videos\/([a-zA-Z0-9_\-]+)/i) || secureUrl.match(/([a-zA-Z0-9_\-]+)$/);
        if (match && match[1] && match[1] !== "playlist" && match[1] !== "videos" && match[1] !== "uploads") {
          let filename = match[1];
          if (!filename.includes(".")) filename += ".mp4";
          return `/api/videos/stream/${filename}`;
        }
      }
    }

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
      return "/default-review.mp4";
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
    if (trimmed.includes("rev-")) {
      const match = trimmed.match(/(rev-\d+-[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)?)/);
      if (match && match[1]) {
        let filename = match[1];
        if (!filename.includes(".")) filename += ".mp4";
        return `/api/videos/stream/${filename}`;
      }
    }
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
 * Resolves the prioritized list of playable video sources for instant failover (Local Blob -> Server Stream -> Fallback MP4).
 */
export function resolvePlayableVideoSourcesCascade(
  video?: VideoReview | null,
  cachedLocalBlobUrl?: string | null
): string[] {
  if (!video) return ["/default-review.mp4"];

  const sources: string[] = [];

  // 1. In-Memory Session IndexedDB Blob URL (Instant playback during upload session)
  const localBlobCandidate = cachedLocalBlobUrl;
  if (localBlobCandidate && typeof localBlobCandidate === "string" && localBlobCandidate.startsWith("blob:")) {
    if (!sources.includes(localBlobCandidate)) {
      sources.push(localBlobCandidate);
    }
  }

  // 2. Direct Authentic Bunny Stream URLs (Highest priority for authentic video playback)
  const bunnyId = video.bunnyVideoId || (video as any).bunnyGuid || (video.videoUrl && typeof video.videoUrl === "string" && video.videoUrl.match(/vz-[^/]+\.b-cdn\.net\/([0-9a-f-]{36})/i)?.[1]);
  if (bunnyId && typeof bunnyId === "string" && bunnyId.length > 10 && !bunnyId.startsWith("rev-")) {
    const streamCdn = "https://vz-dcd9e101-437.b-cdn.net";
    const hlsUrl = `${streamCdn}/${bunnyId}/playlist.m3u8`;
    const mp4_720 = `${streamCdn}/${bunnyId}/play_720p.mp4`;
    const mp4_480 = `${streamCdn}/${bunnyId}/play_480p.mp4`;
    const mp4_360 = `${streamCdn}/${bunnyId}/play_360p.mp4`;
    
    // In HLS-capable environments or Safari, playlist.m3u8 is primary
    if (!sources.includes(hlsUrl)) sources.push(hlsUrl);
    if (!sources.includes(mp4_720)) sources.push(mp4_720);
    if (!sources.includes(mp4_480)) sources.push(mp4_480);
    if (!sources.includes(mp4_360)) sources.push(mp4_360);
  }

  // 3. Direct Explicit videoUrl on Document (both m3u8 and mp4)
  if (video.videoUrl && typeof video.videoUrl === "string" && !video.videoUrl.startsWith("blob:")) {
    const norm = normalizeVideoUrl(video.videoUrl);
    if (norm && !sources.includes(norm)) {
      sources.push(norm);
    }
  }

  // 4. Reliable Server Proxy Stream Endpoint (/api/videos/stream/:id)
  if (video.id && typeof video.id === "string") {
    const cleanId = video.id.replace(/\.[^.]+$/, "");
    const serverStream = `/api/videos/stream/${cleanId}.mp4`;
    if (!sources.includes(serverStream)) {
      sources.push(serverStream);
    }
  }

  // 5. Fallback Video URLs Array
  if (video.fallbackVideoUrls && Array.isArray(video.fallbackVideoUrls)) {
    for (const fb of video.fallbackVideoUrls) {
      if (fb && typeof fb === "string" && !fb.startsWith("blob:")) {
        const norm = normalizeVideoUrl(fb);
        if (norm && !sources.includes(norm)) {
          sources.push(norm);
        }
      }
    }
  }

  // 6. Base64 Data URI (if present)
  if (video.videoData && video.videoData.startsWith("data:video/")) {
    sources.push(video.videoData);
  }

  // 7. Static Bulletproof Fallback Asset (only for completely missing/unseeded fallback)
  if (!sources.includes("/default-review.mp4")) {
    sources.push("/default-review.mp4");
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
  return cascade[0] || "/default-review.mp4";
}

/**
 * Resolves the best available cover thumbnail poster for a VideoReview.
 * Never falls back to place logos, user avatars, or letter graphics to avoid screen flash before playback.
 */
export function extractBunnyIdFromVideo(video?: VideoReview | null): string | null {
  if (!video) return null;
  if (video.bunnyVideoId && typeof video.bunnyVideoId === "string" && video.bunnyVideoId.length > 10 && !video.bunnyVideoId.startsWith("rev-")) {
    return video.bunnyVideoId;
  }
  if (video.bunnyGuid && typeof video.bunnyGuid === "string" && video.bunnyGuid.length > 10 && !video.bunnyGuid.startsWith("rev-")) {
    return video.bunnyGuid;
  }
  const urlsToSearch = [video.videoUrl, video.thumbnailUrl, ...(video.fallbackVideoUrls || [])].filter(Boolean) as string[];
  for (const url of urlsToSearch) {
    if (typeof url !== "string") continue;
    const match = url.match(/vz-[^/]+\.b-cdn\.net\/([0-9a-f-]{36})/i) || url.match(/\/([0-9a-f-]{36})\/(playlist\.m3u8|play_|thumbnail)/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Resolves the best available cover thumbnail poster for a VideoReview.
 * Returns direct CDN URLs (or local paths) for 100% instant rendering without server proxy bottlenecks.
 */
export function resolveVideoPosterUrl(video?: VideoReview | null): string {
  if (!video) return "";

  // 1. Direct Bunny Stream official video thumbnail (most authentic frame from user's video)
  const bunnyId = extractBunnyIdFromVideo(video);
  if (bunnyId) {
    const streamCdn = "https://vz-dcd9e101-437.b-cdn.net";
    return `${streamCdn}/${bunnyId}/thumbnail.jpg`;
  }

  // 2. Explicit thumbnail URL on the review
  const rawThumb = video.thumbnailUrl;
  if (rawThumb && typeof rawThumb === "string" && rawThumb.trim()) {
    let trimmed = rawThumb.trim();

    // Direct base64 or blob poster (ONLY if current session recording)
    if (trimmed.startsWith("data:image/") || (trimmed.startsWith("blob:") && video.isCurrentSessionBlob)) {
      return trimmed;
    }

    // Unwrap proxy wrapper if present
    while (trimmed.includes("/api/proxy-image?url=")) {
      const parts = trimmed.split("/api/proxy-image?url=");
      trimmed = decodeURIComponent(parts[parts.length - 1]);
    }

    if (!trimmed.startsWith("blob:")) {
      const isVideoFile = trimmed.endsWith(".mp4") || trimmed.endsWith(".webm") || trimmed.endsWith(".mov") || trimmed.includes("/api/videos/stream/");
      const isAvatarOrLogo =
        trimmed.includes("/api/avatar") ||
        trimmed.includes("ui-avatars") ||
        trimmed.includes("dicebear") ||
        trimmed.includes("favicon") ||
        trimmed.includes("google.com/s2") ||
        trimmed.includes("clearbit.com") ||
        trimmed.includes("logo.png") ||
        trimmed.includes("logo.jpg") ||
        trimmed.includes("brandfetch.io");
      
      if (!isVideoFile && !isAvatarOrLogo) {
        if (trimmed.includes("b-cdn.net") || trimmed.includes("bunnycdn.com") || trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
          return trimmed;
        }
      }
    }
  }

  // Fallback to local server thumbnail or Bunny CDN thumbnail
  if (video.id && typeof video.id === "string" && video.id.startsWith("rev-")) {
    const cleanId = video.id.replace(/\.[^.]+$/, "");
    return `/api/videos/stream/${cleanId}.jpg`;
  }

  return "";
}

/**
 * Aggressively forces WebKit (iOS Safari), Gecko (Firefox), and Blink (Chrome/Brave)
 * to immediately release hardware video decoders from memory.
 * This prevents decoder pool exhaustion (freezing after 3-5 videos).
 */
export function releaseVideoHardwareDecoder(el: HTMLVideoElement | null) {
  if (!el) return;
  try {
    el.pause();
    el.removeAttribute("src");
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    el.load();
  } catch (e) {}
}

/**
 * Downloads a video review formatted for advertising campaigns (Meta/TikTok/Google).
 * Validates availability and triggers clean, branded file saving.
 */
export async function downloadVideoForAds(video: VideoReview, placeName?: string): Promise<boolean> {
  try {
    const rawUrl = video.videoUrl || '';
    const src = normalizeVideoUrl(rawUrl);
    if (!src) return false;

    const safePlace = (placeName || video.placeName || 'venue')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const safeAuthor = (video.author?.name || 'review')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const filename = `yoouz-ad-review-${safePlace}-${safeAuthor}.mp4`;

    // Attempt blob download for seamless file saving
    try {
      const response = await fetch(src, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
        return true;
      }
    } catch {
      // CORS or network fallback
    }

    // Direct anchor fallback
    const link = document.createElement('a');
    link.href = src;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Error downloading video for ads:', err);
    return false;
  }
}


