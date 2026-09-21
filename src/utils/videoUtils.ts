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
 * Resolves the prioritized list of playable video sources for instant failover (Local Blob -> Direct videoUrl -> Local Server -> Bunny CDN -> Fallback MP4).
 */
export function resolvePlayableVideoSourcesCascade(
  video?: VideoReview | null,
  cachedLocalBlobUrl?: string | null
): string[] {
  if (!video) return ["/default-review.mp4"];

  const sources: string[] = [];
  const cleanZone = (activeBunnyPullZone || "https://rev1.b-cdn.net").replace(/\/+$/, "");

  // 1. Fresh active session IndexedDB blob URL or locally attached blob URL (instant 0ms local playback for creator)
  const explicitBlob = cachedLocalBlobUrl || (video as any)?.localBlobUrl || (video as any)?.blobUrl;
  if (explicitBlob && typeof explicitBlob === "string" && explicitBlob.startsWith("blob:")) {
    sources.push(explicitBlob);
  }

  // 2. Direct specified videoUrl on the video review (if it's a blob, push it first)
  if (video.videoUrl && typeof video.videoUrl === "string") {
    if (video.videoUrl.startsWith("blob:") && !sources.includes(video.videoUrl)) {
      sources.push(video.videoUrl);
    }
  }

  // 3. Local Server streaming endpoint (direct stream for rev-* IDs, available 0ms after upload before CDN edge sync)
  if (video.id && typeof video.id === "string") {
    const cleanId = video.id.replace(/\.[^.]+$/, "");
    const serverStream = `/api/videos/stream/${cleanId}.mp4`;
    if (!sources.includes(serverStream)) {
      sources.push(serverStream);
    }
  }

  // 4. Direct specified videoUrl on the video review (Authoritative URL from upload/storage)
  if (video.videoUrl && typeof video.videoUrl === "string") {
    const norm = normalizeVideoUrl(video.videoUrl);
    if (norm && !sources.includes(norm)) {
      sources.push(norm);
    }
  }

  // 5. Base64 data URI (if present)
  if (video.videoData && video.videoData.startsWith("data:video/")) {
    sources.push(video.videoData);
  }

  // 6. Fallback video URLs from document
  if (video.fallbackVideoUrls && Array.isArray(video.fallbackVideoUrls)) {
    for (const fb of video.fallbackVideoUrls) {
      const norm = normalizeVideoUrl(fb);
      if (norm && !sources.includes(norm)) {
        sources.push(norm);
      }
    }
  }

  // 7. Bunny CDN Edge URL fallback
  if (video.id && typeof video.id === "string" && video.id.startsWith("rev-")) {
    const cleanId = video.id.replace(/\.[^.]+$/, "");
    const cdnUrlMp4 = `${cleanZone}/videos/${cleanId}.mp4`;
    if (!sources.includes(cdnUrlMp4)) {
      sources.push(cdnUrlMp4);
    }
  }

  // 8. Static default MP4 asset
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
export function resolveVideoPosterUrl(video?: VideoReview | null): string {
  if (!video) return "";

  const cleanZone = (activeBunnyPullZone || "https://rev1.b-cdn.net").replace(/\/+$/, "");
  const rawThumb = video.thumbnailUrl;

  if (rawThumb && typeof rawThumb === "string" && rawThumb.trim()) {
    const trimmed = rawThumb.trim();

    // Direct base64 or blob poster (instant preview without network latency)
    if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) {
      return trimmed;
    }

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
    
    // Direct Bunny CDN image
    if (trimmed.includes("b-cdn.net") && !isVideoFile && !isAvatarOrLogo) {
      return trimmed;
    }

    if (!isVideoFile && !isAvatarOrLogo && (trimmed.startsWith("http") || trimmed.startsWith("/uploads/") || trimmed.startsWith("/videos/"))) {
      return trimmed;
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


