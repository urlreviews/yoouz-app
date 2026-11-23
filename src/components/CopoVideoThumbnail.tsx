import React, { useState, useEffect } from "react";
import { VideoReview } from "../types";
import { resolveVideoPosterCascade, toCardPhotoUrl } from "../utils/videoUtils";

interface CopoVideoThumbnailProps {
  video: VideoReview;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export const CopoVideoThumbnail: React.FC<CopoVideoThumbnailProps> = ({
  video,
  className = "w-full h-full object-cover",
  alt,
  priority = true,
}) => {
  const [candidateIdx, setCandidateIdx] = useState(0);

  const candidates = React.useMemo(() => {
    const raw = resolveVideoPosterCascade(video);
    const out: string[] = [];
    for (const u of raw) {
      const cardUrl = toCardPhotoUrl(u);
      if (cardUrl && !out.includes(cardUrl)) out.push(cardUrl);
      if (u && !out.includes(u)) out.push(u);
    }
    return out;
  }, [video]);

  useEffect(() => {
    setCandidateIdx(0);
  }, [video?.id, video?.photoUrl, video?.thumbnailUrl]);

  const placeInitial = (video.placeName || video.placeId || "Y").charAt(0).toUpperCase();

  const FALLBACK_PHOTO_SVG = React.useMemo(
    () =>
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
  </defs>
  <rect width="300" height="400" fill="url(#bg)"/>
  <circle cx="150" cy="175" r="40" fill="#3f3f46" opacity="0.85"/>
  <text x="150" y="185" font-family="-apple-system, sans-serif" font-weight="bold" font-size="28" fill="#ffffff" text-anchor="middle">${placeInitial}</text>
</svg>`),
    [placeInitial]
  );

  const allFailed = candidateIdx >= candidates.length;
  const activeSrc = !allFailed ? candidates[candidateIdx] : FALLBACK_PHOTO_SVG;
  const isExternal = /^https?:\/\//i.test(activeSrc);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#111114] flex items-center justify-center">
      <img
        src={activeSrc}
        alt={alt || video.placeName || "Photo review preview"}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "low"}
        referrerPolicy={isExternal ? "no-referrer" : undefined}
        onError={() => {
          if (candidateIdx < candidates.length) {
            setCandidateIdx((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};
