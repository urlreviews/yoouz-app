import React, { useState, useRef, useEffect } from "react";
import {
  Star,
  MoreVertical,
  ThumbsUp,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Award,
  Tag,
  CheckCircle,
  MapPin
} from "lucide-react";
import { VideoReview } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { resolvePlayableVideoSource, normalizeVideoUrl } from "../utils/videoUtils";
import { getVideoBlobFromIndexedDB } from "../lib/videoStorage";

interface GoogleVideoReviewCardProps {
  review: VideoReview;
  onOpenVideoModal: (review: VideoReview) => void;
  onToggleLike: (reviewId: string) => void;
  onShareReview: (review: VideoReview) => void;
}

export const GoogleVideoReviewCard: React.FC<GoogleVideoReviewCardProps> = ({
  review,
  onOpenVideoModal,
  onToggleLike,
  onShareReview
}) => {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    getVideoBlobFromIndexedDB(review.id).then((url) => {
      if (url && active) {
        setLocalBlobUrl(url);
      }
    }).catch(() => {});
    return () => {
      active = false;
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch(e) {}
      }
    };
  }, [review.id]);

  const getReviewVideoSrc = (rev: VideoReview) => {
    return resolvePlayableVideoSource(rev, localBlobUrl);
  };

  const toggleInlinePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) {
      onOpenVideoModal(review);
      return;
    }
    if (isPlayingInline) {
      videoRef.current.pause();
      setIsPlayingInline(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlayingInline(true))
        .catch(() => {
          onOpenVideoModal(review);
        });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      id={`google-review-${review.id}`}
      className="py-4 border-b border-[#dadce0] last:border-b-0 space-y-2.5 text-[#202124]"
    >
      {/* 1. Google Review Author Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={review.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author.name || "User")}&background=1a73e8&color=fff`}
              alt={review.author.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <h4 className="font-medium text-[14px] text-[#202124] leading-tight flex items-center gap-1">
              {review.author.name}
              {review.author.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 fill-[#1a73e8] text-white" />
              )}
            </h4>
            <p className="text-[12px] text-[#70757a] leading-tight flex items-center gap-1.5 mt-0.5">
              <span>{`${review.author.videoReviewCount || 4} video reviews`}</span>
              {review.author.location && (
                <>
                  <span className="text-[#dadce0]">•</span>
                  <span className="flex items-center gap-0.5 text-pink-600 font-semibold">
                    <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
                    {review.author.location}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#70757a] hover:bg-gray-100 transition-colors"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Rating Stars & Timestamp (e.g. 5 gold stars • a year ago) */}
      <div className="flex items-center gap-2 text-[13px] text-[#70757a]">
        <div className="flex items-center gap-0.5 text-[#e37400]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < review.rating
                  ? "fill-[#fbbc04] text-[#fbbc04]"
                  : "text-[#dadce0] fill-[#dadce0]"
              }`}
            />
          ))}
        </div>
        {(review.recordedAt || review.createdAtMs) && (
          <span className="text-[12px] text-[#70757a] font-normal">
            • {formatRecordedDate(review.recordedAt, review.createdAtMs)}
          </span>
        )}
      </div>

      {/* 3. Pure Video Review Viewport (100% Video-Only, No Text) */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/13] max-h-[360px] w-full max-w-[280px] border border-[#dadce0] shadow-sm group cursor-pointer">
        <video
          ref={videoRef}
          src={getReviewVideoSrc(review) || undefined}
          poster={review.thumbnailUrl || undefined}
          playsInline
          loop
          preload="auto"
          muted={isMuted}
          onClick={toggleInlinePlay}
          onError={(e) => {
            const el = e.currentTarget;
            console.warn(`Video playback notice on review card for ${review.id}`);
            const fallbacks = (review.fallbackVideoUrls || [])
              .concat(review.videoUrl ? [review.videoUrl] : [])
              .map(u => normalizeVideoUrl(u))
              .filter(
                u =>
                  u &&
                  u !== el.src
              );
            if (fallbacks.length > 0 && videoRef.current) {
              videoRef.current.src = fallbacks[0];
              videoRef.current.load();
            }
          }}
          className="w-full h-full object-cover"
        />

        {/* Video Overlay Info */}
        <div
          onClick={toggleInlinePlay}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3"
        >
          {/* Top Row: Video badge & Sound toggle */}
          <div className="flex items-center justify-between">
            <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1 border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>0:{review.durationSeconds}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVideoModal(review);
                }}
                className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80"
                title="Fullscreen video"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Play Button if paused */}
          {!isPlayingInline && (
            <div className="self-center w-12 h-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white translate-x-0.5" />
            </div>
          )}

          {/* Bottom Dish / Highlights Tag & Caption preview */}
          <div className="space-y-1 text-white">
            {review.dishOrItem && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1a73e8]/90 text-[11px] font-semibold text-white">
                <Tag className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{review.dishOrItem}</span>
              </div>
            )}
            <p className="text-[12px] text-white/95 leading-tight line-clamp-2 drop-shadow-sm font-medium">
              {review.caption}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Google Review Action Row: Thumbs Up / Share / Helpful */}
      <div className="flex items-center gap-5 pt-1 text-[13px] text-[#5f6368]">
        <button
          onClick={() => onToggleLike(review.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
            review.isLiked
              ? "border-[#1a73e8] text-[#1a73e8] bg-blue-50"
              : "border-[#dadce0] text-[#5f6368] hover:bg-gray-50"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${review.isLiked ? "fill-[#1a73e8]" : ""}`} />
          <span className="text-[12px] font-medium">
            {review.likes + (review.isLiked ? 1 : 0) > 0
              ? review.likes + (review.isLiked ? 1 : 0)
              : "Helpful"}
          </span>
        </button>

        <button
          onClick={() => onShareReview(review)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#dadce0] text-[#5f6368] hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[12px] font-medium">Share</span>
        </button>
      </div>
    </div>
  );
};
