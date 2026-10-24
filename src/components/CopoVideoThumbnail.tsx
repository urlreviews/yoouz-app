import React, { useState } from "react";
import { VideoReview } from "../types";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { getCategoryThematicBanner } from "../utils/logoUtils";

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
  const [errorStage, setErrorStage] = useState(0); // 0: primary poster, 1: category/banner fallback, 2: svg fallback
  const [isLoaded, setIsLoaded] = useState(true);

  const posterSrc = React.useMemo(() => {
    if (errorStage === 0) {
      return resolveVideoPosterUrl(video) || video.placeBannerUrl || getCategoryThematicBanner(video.placeCategory, video.placeName);
    }
    if (errorStage === 1) {
      return video.placeBannerUrl || getCategoryThematicBanner(video.placeCategory, video.placeName);
    }
    return "";
  }, [video, errorStage]);

  const placeInitial = (video.placeName || video.placeId || "V").charAt(0).toUpperCase();

  const FALLBACK_POSTER_SVG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
  </defs>
  <rect width="300" height="400" fill="url(#bg)"/>
  <circle cx="150" cy="180" r="40" fill="#3f3f46" opacity="0.8"/>
  <text x="150" y="190" font-family="-apple-system, sans-serif" font-weight="bold" font-size="28" fill="#ffffff" text-anchor="middle">${placeInitial}</text>
  <circle cx="150" cy="270" r="24" fill="#ef4444"/>
  <polygon points="144,260 162,270 144,280" fill="#ffffff"/>
  <text x="150" y="330" font-family="-apple-system, sans-serif" font-weight="600" font-size="13" fill="#a1a1aa" text-anchor="middle">${video.placeName || "Video Review"}</text>
</svg>`);

  const activeSrc = errorStage >= 2 || !posterSrc ? FALLBACK_POSTER_SVG : posterSrc;

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center">
      <img
        src={activeSrc}
        alt={alt || video.caption || video.placeName || "Video review preview"}
        className={`${className} transition-opacity duration-300`}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (errorStage < 2) {
            setErrorStage(prev => prev + 1);
          }
        }}
      />
    </div>
  );
};
