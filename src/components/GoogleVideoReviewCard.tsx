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
import { resolvePlayableVideoSource, resolveVideoPosterUrl, normalizeVideoUrl, releaseVideoHardwareDecoder } from "../utils/videoUtils";
import { useGlobalMute, ensureSharedAudioContextUnlocked } from "../hooks/useGlobalMute";
import { getVideoBlobFromIndexedDB } from "../lib/videoStorage";
import { getSafeAvatarUrl } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";

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
  const [isMuted, setIsMuted, isSessionAudioUnlocked, unlockAudioSession] = useGlobalMute();
  const [isActualMuted, setIsActualMuted] = useState<boolean>(isMuted || !isSessionAudioUnlocked);
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
        releaseVideoHardwareDecoder(videoRef.current);
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
      ensureSharedAudioContextUnlocked();
      const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
      videoRef.current.muted = shouldBeMuted;
      videoRef.current
        .play()
        .then(() => {
          setIsPlayingInline(true);
          setIsActualMuted(videoRef.current?.muted ?? true);
        })
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsActualMuted(true);
            videoRef.current
              .play()
              .then(() => setIsPlayingInline(true))
              .catch(() => {
                onOpenVideoModal(review);
              });
          } else {
            onOpenVideoModal(review);
          }
        });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSharedAudioContextUnlocked();
    const isCurrentlyMuted = isMuted || !isSessionAudioUnlocked || isActualMuted;
    if (isCurrentlyMuted) {
      unlockAudioSession();
      setIsActualMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
      }
    } else {
      setIsMuted(true);
      setIsActualMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  return (
    <div
      id={`google-review-${review.id}`}
      className="py-4 border-b border-zinc-800 last:border-b-0 space-y-2.5 text-zinc-200"
    >
      {/* 1. Google Review Author Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={getSafeAvatarUrl(review.author.avatar, review.author.name)}
              alt={review.author.name}
              className="w-10 h-10 rounded-full object-cover border border-zinc-700"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = generateGoogleLetterAvatarSvg(review.author.name || "User", 128);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
          </div>

          <div>
            <h4 className="font-medium text-[14px] text-white leading-tight flex items-center gap-1 min-w-0">
              <span className="truncate">{review.author.name}</span>
              {review.author.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
              )}
            </h4>
            <p className="text-[12px] text-zinc-400 leading-tight flex items-center gap-1.5 mt-0.5">
              <span>{`${review.author.videoReviewCount || 4} video reviews`}</span>
              {review.author.location && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-0.5 text-zinc-300 font-semibold">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                    {review.author.location}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 transition-colors"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Rating Stars & Timestamp */}
      <div className="flex items-center gap-2 text-[13px] text-zinc-400">
        <div className="flex items-center gap-0.5 text-zinc-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < review.rating
                  ? "fill-white text-white"
                  : "text-zinc-700 fill-zinc-700"
              }`}
            />
          ))}
        </div>
        {(review.recordedAt || review.createdAtMs) && (
          <span className="text-[12px] text-zinc-500 font-normal">
            • {formatRecordedDate(review.recordedAt, review.createdAtMs)}
          </span>
        )}
      </div>

      {/* 3. Pure Video Review Viewport (100% Video-Only, No Text) */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/13] max-h-[360px] w-full max-w-[280px] border border-zinc-800 shadow-sm group cursor-pointer">
        {isPlayingInline ? (
          <video
            ref={videoRef}
            src={getReviewVideoSrc(review) || undefined}
            poster={resolveVideoPosterUrl(review) || undefined}
            playsInline
            autoPlay
            loop
            preload="auto"
            muted={isMuted || !isSessionAudioUnlocked || isActualMuted}
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
        ) : (
          <div className="w-full h-full relative" onClick={toggleInlinePlay}>
            <img
              src={resolveVideoPosterUrl(review)}
              alt={review.caption || "Video review"}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Video Overlay Info */}
        <div
          onClick={toggleInlinePlay}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3"
        >
          {/* Top Row: Video badge & Sound toggle */}
          <div className="flex items-center justify-between">
            <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1 border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
              <span>0:{review.durationSeconds}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className={`rounded-full bg-black/75 hover:bg-black active:scale-95 backdrop-blur-md text-white flex items-center justify-center border transition-all cursor-pointer ${
                  isMuted || !isSessionAudioUnlocked || isActualMuted
                    ? "px-2 py-1 gap-1 border-white/40 animate-pulse-subtle"
                    : "w-7 h-7 border-white/20"
                }`}
                title={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Tap to unmute" : "Mute"}
              >
                {isMuted || !isSessionAudioUnlocked || isActualMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="text-[9px] font-bold">Unmute</span>
                  </>
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                )}
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
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-semibold text-white border border-zinc-700">
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
      <div className="flex items-center gap-5 pt-1 text-[13px] text-zinc-400">
        <button
          onClick={() => onToggleLike(review.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
            review.isLiked
              ? "border-zinc-500 text-white bg-zinc-800"
              : "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${review.isLiked ? "fill-white" : ""}`} />
          <span className="text-[12px] font-medium">
            {review.likes + (review.isLiked ? 1 : 0) > 0
              ? review.likes + (review.isLiked ? 1 : 0)
              : "Helpful"}
          </span>
        </button>

        <button
          onClick={() => onShareReview(review)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[12px] font-medium">Share</span>
        </button>
      </div>
    </div>
  );
};
