import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ThumbsUp,
  Share2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Star,
  MapPin,
  Tag,
  CheckCircle,
  MessageCircle,
  Send
} from "lucide-react";
import { VideoReview, VideoAuthor } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { getVideoBlobFromIndexedDB } from "../lib/videoStorage";
import { resolvePlayableVideoSource, normalizeVideoUrl } from "../utils/videoUtils";

interface GoogleVideoPlayerModalProps {
  reviews: VideoReview[];
  currentReview: VideoReview;
  onClose: () => void;
  onSelectReview: (review: VideoReview) => void;
  onToggleLike: (reviewId: string) => void;
  onToggleBookmark: (placeId: string) => void;
  isBookmarked: boolean;
  onOpenCreator?: (author: VideoAuthor) => void;
}

export const GoogleVideoPlayerModal: React.FC<GoogleVideoPlayerModalProps> = ({
  reviews,
  currentReview,
  onClose,
  onSelectReview,
  onToggleLike,
  onToggleBookmark,
  isBookmarked,
  onOpenCreator
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [newComment, setNewComment] = useState("");
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentIndex = reviews.findIndex((r) => r.id === currentReview.id);

  useEffect(() => {
    let isCancelled = false;
    async function resolveSource() {
      if (!currentReview) return;
      let idbUrl: string | null = null;
      try {
        idbUrl = await getVideoBlobFromIndexedDB(currentReview.id);
      } catch (e) {}

      if (!isCancelled) {
        const src = resolvePlayableVideoSource(currentReview, idbUrl);
        setActiveVideoSrc(src);
      }
    }

    resolveSource();
    return () => {
      isCancelled = true;
    };
  }, [currentReview?.id, currentReview?.videoUrl, currentReview?.localVideoUrl]);

  useEffect(() => {
    if (videoRef.current && activeVideoSrc) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      
      if (hasStarted) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        try {
          videoRef.current.pause();
        } catch (e) {}
        setIsPlaying(false);
      }
    }
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) {}
      }
    };
  }, [activeVideoSrc, currentReview?.id, hasStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp") handlePrev();
      if (e.key === "ArrowDown") handleNext();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, reviews, hasStarted]);

  const handleNext = () => {
    if (currentIndex < reviews.length - 1) {
      onSelectReview(reviews[currentIndex + 1]);
    } else {
      onSelectReview(reviews[0]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectReview(reviews[currentIndex - 1]);
    } else {
      onSelectReview(reviews[reviews.length - 1]);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasStarted(true);
      videoRef.current.muted = isMuted;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem("yoouz_sound_muted", String(nextMuted));
    } catch (e) {}
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    currentReview.comments.push({
      id: `comm-${Date.now()}`,
      authorName: "Samet (Local Guide)",
      authorHandle: "4samet",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      text: newComment,
      createdAt: "Just now",
      createdAtMs: Date.now(),
      likesCount: 0
    });
    setNewComment("");
  };

  return (
    <div
      id="google-video-player-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none"
    >
      {/* Close button top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Container */}
      <div className="flex items-center gap-4 max-h-[92vh]">
        {/* Vertical Video Viewport */}
        <div className="relative w-[340px] sm:w-[380px] h-[86vh] max-h-[820px] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-between group">
          <video
            ref={videoRef}
            src={activeVideoSrc || normalizeVideoUrl(currentReview.videoUrl) || undefined}
            poster={currentReview.thumbnailUrl}
            playsInline
            loop
            preload="auto"
            muted={isMuted}
            onClick={togglePlay}
            onCanPlay={() => {
              if (!hasStarted && videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
              }
            }}
            onPlaying={() => {
              if (!hasStarted && videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
              } else {
                setIsPlaying(true);
              }
            }}
            onTimeUpdate={(e) => {
              const t = e.currentTarget;
              // Safety catch: force pause if it should be stopped but is moving
              if ((!hasStarted || !isPlaying) && !t.paused) {
                t.pause();
              }
            }}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              const el = e.currentTarget;
              const errCode = el.error?.code;
              console.warn(`Video playback notice (${errCode}) in modal for ${currentReview.id}`);
              
              const fallbacks = (currentReview.fallbackVideoUrls || [])
                .concat(currentReview.videoUrl ? [currentReview.videoUrl] : [])
                .map(u => normalizeVideoUrl(u))
                .filter(
                  u =>
                    u &&
                    u !== activeVideoSrc &&
                    u !== el.src
                );

              if (fallbacks.length > 0 && videoRef.current) {
                const nextSrc = fallbacks[0];
                if (videoRef.current.src !== nextSrc) {
                  videoRef.current.src = nextSrc;
                  videoRef.current.load();
                  if (isPlaying) {
                    videoRef.current.muted = isMuted;
                    videoRef.current.play().catch(() => {});
                  }
                }
              }
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

          {/* Top Bar Header */}
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#ea4335]" />
                <span className="truncate max-w-[160px]">{currentReview.placeName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/70 cursor-pointer"
                title={isMuted ? "Unmute sound" : "Mute sound"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Center Play Button Overlay */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              onTouchEnd={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-2xl active:scale-90 transition-transform">
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </div>
            </div>
          )}

        {/* Bottom Area: Metadata & Actions Container */}
        <div className="relative z-20 w-full flex items-end justify-between p-4 pointer-events-none">
          {/* Bottom Review Details */}
          <div className="space-y-2 text-white pointer-events-auto pr-2 flex-1 min-w-0">
            {/* Author Info */}
            <button
              type="button"
              onClick={() => {
                if (onOpenCreator && currentReview.author) {
                  onClose();
                  onOpenCreator(currentReview.author);
                }
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-85 transition-opacity"
              title={`View ${currentReview.author?.name || 'Customer'}'s Profile`}
            >
              <img
                src={currentReview.author.avatar}
                alt={currentReview.author.name}
                className="w-9 h-9 rounded-full object-cover border border-white/30 group-hover:border-[#1a73e8] transition-all"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-1 group-hover:text-[#8ab4f8] transition-colors">
                  {currentReview.author.name}
                  {currentReview.author.isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 fill-[#1a73e8] text-white" />
                  )}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                  <div className="flex items-center text-[#fbbc04]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < currentReview.rating
                            ? "fill-[#fbbc04] text-[#fbbc04]"
                            : "text-zinc-500 fill-zinc-500"
                        }`}
                      />
                    ))}
                  </div>
                  {(currentReview.recordedAt || currentReview.createdAtMs) && (
                    <span className="text-zinc-300 text-[11px]">
                      • {formatRecordedDate(currentReview.recordedAt, currentReview.createdAtMs)}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Dish Badge */}
            {currentReview.dishOrItem && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1a73e8]/90 text-xs font-semibold text-white">
                <Tag className="w-3 h-3" />
                <span>{currentReview.dishOrItem}</span>
              </div>
            )}

            {/* Caption */}
            <p className="text-xs text-white/95 leading-relaxed font-normal drop-shadow">
              {currentReview.caption}
            </p>
          </div>

          {/* Right Action Rail */}
          <div className="flex flex-col items-center gap-4 text-white pointer-events-auto shrink-0 mb-1">
            <button
              onClick={() => onToggleLike(currentReview.id)}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                  currentReview.isLiked
                    ? "bg-[#1a73e8] text-white scale-110"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${currentReview.isLiked ? "fill-white" : ""}`} />
              </div>
              <span className="text-[11px] font-bold mt-1 drop-shadow">
                {currentReview.likes + (currentReview.isLiked ? 1 : 0)}
              </span>
            </button>

            <button
              onClick={() => onToggleBookmark(currentReview.placeId)}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                  isBookmarked
                    ? "bg-amber-500 text-white scale-110"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-white" : ""}`} />
              </div>
              <span className="text-[11px] font-bold mt-1 drop-shadow">Save</span>
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  const handle = currentReview.author?.name || currentReview.author?.name?.replace(/\s+/g, "").toLowerCase() || "user";
                  const shareUrl = `${window.location.origin}/creator/${(currentReview.author?.name || "user").replace(/\s+/g, "").toLowerCase()}/video/${currentReview.id}`;
                  navigator.share({ title: currentReview.placeName, url: shareUrl }).catch(() => {});
                }
              }}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold mt-1 drop-shadow">Share</span>
            </button>
          </div>
        </div>
      </div>

        {/* Floating Prev/Next Buttons */}
        <div className="hidden sm:flex flex-col gap-3">
          <button
            onClick={handlePrev}
            className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-md"
            title="Previous Video"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-md"
            title="Next Video"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
