import React, { useState } from "react";
import { VideoReview } from "../types";
import { resolveVideoPosterUrl, normalizeVideoUrl } from "../utils/videoUtils";

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
  const [useVideoElement, setUseVideoElement] = useState<boolean>(() => {
    // If the video has an explicit custom image URL that is not a placeholder, prefer img
    const thumb = video.thumbnailUrl;
    if (thumb && !thumb.includes("data:image/svg+xml") && (thumb.startsWith("http") || thumb.startsWith("data:image/jpeg") || thumb.startsWith("data:image/png"))) {
      return false;
    }
    // Otherwise, direct video frame extraction gives the authentic reviewer face from the recording
    return Boolean(video.videoUrl || video.videoData);
  });

  const [hasVideoError, setHasVideoError] = useState<boolean>(false);

  const cleanVideoSrc = React.useMemo(() => {
    const raw = video.videoData || video.videoUrl || "/api/videos/stream/default-review.mp4";
    const normalized = normalizeVideoUrl(raw);
    if (!normalized) return "/api/videos/stream/default-review.mp4#t=0.5";
    return normalized.includes("#t=") ? normalized : `${normalized}#t=0.5`;
  }, [video.videoData, video.videoUrl]);

  const posterSrc = React.useMemo(() => {
    return resolveVideoPosterUrl(video);
  }, [video]);

  if (useVideoElement && !hasVideoError) {
    return (
      <video
        src={cleanVideoSrc}
        preload="metadata"
        muted
        playsInline
        className={className}
        onError={() => {
          setHasVideoError(true);
          setUseVideoElement(false);
        }}
      />
    );
  }

  return (
    <img
      src={posterSrc}
      alt={alt || video.caption || video.placeName || "Video review preview"}
      className={className}
      referrerPolicy="no-referrer"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/default-poster.jpg";
      }}
    />
  );
};
