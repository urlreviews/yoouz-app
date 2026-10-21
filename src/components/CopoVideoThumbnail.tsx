import React, { useState } from "react";
import { VideoReview } from "../types";
import { resolveVideoPosterUrl } from "../utils/videoUtils";

interface CopoVideoThumbnailProps {
  video: VideoReview;
  className?: string;
  alt?: string;
}

const FALLBACK_POSTER_SVG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
  <rect width="300" height="400" fill="#18181b"/>
  <circle cx="150" cy="200" r="32" fill="#27272a"/>
  <polygon points="144,188 162,200 144,212" fill="#a1a1aa"/>
</svg>`);

export const CopoVideoThumbnail: React.FC<CopoVideoThumbnailProps> = ({
  video,
  className = "w-full h-full object-cover",
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const posterSrc = React.useMemo(() => {
    return resolveVideoPosterUrl(video);
  }, [video]);

  const activeSrc = hasError || !posterSrc ? FALLBACK_POSTER_SVG : posterSrc;

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse pointer-events-none" />
      )}
      <img
        src={activeSrc}
        alt={alt || video.caption || video.placeName || "Video review preview"}
        className={`${className} transition-opacity duration-200 ${isLoaded || hasError ? "opacity-100" : "opacity-0"}`}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
};
