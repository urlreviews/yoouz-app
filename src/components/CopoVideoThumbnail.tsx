import React from "react";
import { VideoReview } from "../types";
import { resolveVideoPosterUrl } from "../utils/videoUtils";

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
  const posterSrc = React.useMemo(() => {
    return resolveVideoPosterUrl(video);
  }, [video]);

  return (
    <img
      src={posterSrc}
      alt={alt || video.caption || video.placeName || "Video review preview"}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/default-poster.jpg";
      }}
    />
  );
};
