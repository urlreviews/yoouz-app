import React, { useState, useEffect } from "react";
import { VideoReview } from "../types";
import { resolveVideoPosterCascade } from "../utils/videoUtils";

interface CopoVideoThumbnailProps {
  video: VideoReview;
  className?: string;
  alt?: string;
}

export const CopoVideoThumbnail: React.FC<CopoVideoThumbnailProps> = ({
  video,
  className = "w-full h-full object-cover",
  alt,
}) => {
  const [candidateIdx, setCandidateIdx] = useState(0);

  const candidates = React.useMemo(() => {
    return resolveVideoPosterCascade(video);
  }, [video]);

  useEffect(() => {
    setCandidateIdx(0);
  }, [video?.id, video?.photoUrl, video?.thumbnailUrl]);

  const placeInitial = (video.placeName || video.placeId || "Y").charAt(0).toUpperCase();

  const FALLBACK_PHOTO_SVG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
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
  <rect x="128" y="246" width="44" height="32" rx="8" fill="#18181b" stroke="#71717a" stroke-width="2"/>
  <circle cx="150" cy="262" r="8" fill="none" stroke="#ffffff" stroke-width="2.2"/>
  <text x="150" y="318" font-family="-apple-system, sans-serif" font-weight="600" font-size="13" fill="#a1a1aa" text-anchor="middle">${video.placeName || "Photo Review"}</text>
</svg>`);

  const activeSrc = candidateIdx < candidates.length ? candidates[candidateIdx] : FALLBACK_PHOTO_SVG;

  const isExternal = /^https?:\/\//i.test(activeSrc);

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900 flex items-center justify-center">
      <img
        src={activeSrc}
        alt={alt || video.placeName || "Photo review preview"}
        className={className}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
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
