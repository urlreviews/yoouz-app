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
import { resolvePlayableVideoSource, normalizeVideoUrl, releaseVideoHardwareDecoder } from "../utils/videoUtils";
import { useGlobalMute, ensureSharedAudioContextUnlocked } from "../hooks/useGlobalMute";
import { getSafeAvatarUrl, getDisplayUrlAsDomain } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";

interface GoogleVideoPlayerModalProps {
  reviews: VideoReview[];
  currentReview: VideoReview;
  onClose: () => void;
  onSelectReview: (review: VideoReview) => void;
  onToggleLike: (reviewId: string) => void;
  onToggleBookmark: (placeId: string) => void;
  isBookmarked: boolean;
  onOpenCreator?: (author: VideoAuthor) => void;
  onRecordView?: (videoId: string) => void;
}

export const GoogleVideoPlayerModal: React.FC<GoogleVideoPlayerModalProps> = ({
  reviews,
  currentReview,
  onClose,
  onSelectReview,
  onToggleLike,
  onToggleBookmark,
  isBookmarked,
  onOpenCreator,
  onRecordView
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(true);
  const [isMuted, setIsMuted, isSessionAudioUnlocked, unlockAudioSession] = useGlobalMute();
  const [isActualMuted, setIsActualMuted] = useState<boolean>(isMuted || !isSessionAudioUnlocked);
  const [newComment, setNewComment] = useState("");
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentIndex = reviews.findIndex((r) => r.id === currentReview.id);

  // Immediate decoder release on unmount to prevent 3-5 video decoder freeze
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        releaseVideoHardwareDecoder(videoRef.current);
      }
    };
  }, []);

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
    const el = videoRef.current;
    if (el && activeVideoSrc) {
      el.currentTime = 0;
      const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
      el.muted = shouldBeMuted;
      if (!shouldBeMuted) {
        try { el.volume = 1; } catch {}
      }
      
      if (hasStarted) {
        const playPromise = el.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsActualMuted(el.muted);
              if (currentReview?.id) {
                onRecordView?.(currentReview.id);
              }
            })
            .catch(() => {
              // Browser autoplay policy rejected unmuted playback, fallback to muted
              el.muted = true;
              setIsActualMuted(true);
              const retry = el.play();
              if (retry !== undefined) {
                retry
                  .then(() => {
                    setIsPlaying(true);
                    if (isSessionAudioUnlocked && !isMuted) {
                      const restoreAudio = () => {
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                          try { videoRef.current.volume = 1; } catch {}
                          setIsActualMuted(false);
                        }
                      };
                      window.addEventListener("touchstart", restoreAudio, { once: true, passive: true });
                      window.addEventListener("click", restoreAudio, { once: true, passive: true });
                    }
                  })
                  .catch(() => {});
              }
            });
        }
      } else {
        try {
          el.pause();
        } catch (e) {}
        setIsPlaying(false);
      }
    }
    return () => {
      if (el) {
        releaseVideoHardwareDecoder(el);
      }
    };
  }, [activeVideoSrc, currentReview?.id, hasStarted, isMuted, isSessionAudioUnlocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp") handlePrev();
      if (e.key === "ArrowDown") handleNext();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "m") {
        handleToggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, reviews, hasStarted, isMuted, isSessionAudioUnlocked, isActualMuted]);

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
      const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
      videoRef.current.muted = shouldBeMuted;
      if (!shouldBeMuted) {
        try { videoRef.current.volume = 1; } catch {}
      }
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsActualMuted(videoRef.current?.muted ?? true);
        })
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsActualMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
    }
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    ensureSharedAudioContextUnlocked();

    const isCurrentlyMuted = isMuted || !isSessionAudioUnlocked || isActualMuted;
    if (isCurrentlyMuted) {
      unlockAudioSession();
      setIsActualMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        try { videoRef.current.volume = 1; } catch {}
      }
    } else {
      setIsMuted(true);
      setIsActualMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    let currentUserProfile: any = null;
    try {
      const stored = localStorage.getItem("copo_user_profile");
      if (stored) currentUserProfile = JSON.parse(stored);
    } catch {}
    const commentAuthorName = currentUserProfile?.name || "Local Reviewer";
    const commentAuthorHandle = currentUserProfile?.handle || `@${commentAuthorName.toLowerCase().replace(/[^a-z0-9]/g, "") || "reviewer"}`;
    const commentAuthorAvatar = currentUserProfile?.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`;

    currentReview.comments.push({
      id: `comm-${Date.now()}`,
      authorName: commentAuthorName,
      authorHandle: commentAuthorHandle,
      authorAvatar: commentAuthorAvatar,
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
                type="button"
                onClick={handleToggleMute}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className={`h-10 rounded-full bg-black/85 hover:bg-black active:scale-90 backdrop-blur-2xl border flex items-center justify-center text-white transition-all cursor-pointer shadow-2xl ${
                  isMuted || !isSessionAudioUnlocked || isActualMuted
                    ? "px-3.5 gap-2 border-white/50 animate-pulse-subtle bg-black/90"
                    : "w-10 border-white/35"
                }`}
                title={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Tap to unmute" : "Mute sound"}
                aria-label={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Tap to unmute" : "Mute sound"}
              >
                {isMuted || !isSessionAudioUnlocked || isActualMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-white stroke-[2.2] shrink-0" />
                    <span className="text-xs font-bold tracking-wide select-none whitespace-nowrap">
                      Tap to Unmute
                    </span>
                  </>
                ) : (
                  <Volume2 className="w-4 h-4 text-white stroke-[2.2]" />
                )}
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
                src={getSafeAvatarUrl(currentReview.author.avatar, currentReview.author.name)}
                alt={currentReview.author.name}
                className="w-9 h-9 rounded-full object-cover border border-white/30 group-hover:border-white transition-all"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = generateGoogleLetterAvatarSvg(currentReview.author.name || "User", 128);
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-1 group-hover:text-zinc-200 transition-colors min-w-0">
                  <span className="truncate">{currentReview.author.name}</span>
                  {currentReview.author.isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
                  )}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-200">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < currentReview.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-200 fill-zinc-500"
                        }`}
                      />
                    ))}
                  </div>
                  {(currentReview.recordedAt || currentReview.createdAtMs) && (
                    <span className="text-zinc-200 text-[11px]">
                      • {formatRecordedDate(currentReview.recordedAt, currentReview.createdAtMs)}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Dish Badge */}
            {currentReview.dishOrItem && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
                <Tag className="w-3 h-3" />
                <span>{currentReview.dishOrItem}</span>
              </div>
            )}

            {/* Caption */}
            <p className="text-xs text-white/95 leading-relaxed font-normal drop-shadow">
              {(() => {
                const trimmed = (currentReview.caption || "").trim();
                if (/^video review (for|of)\b/i.test(trimmed)) {
                  const cleanDomain = getDisplayUrlAsDomain(currentReview);
                  return `Video review for ${cleanDomain}`;
                }
                return currentReview.caption;
              })()}
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
                    ? "bg-white text-black scale-110"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${currentReview.isLiked ? "fill-black" : ""}`} />
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
                  const cleanHandle = ((currentReview.author as any)?.handle || currentReview.author?.name || "user")
                    .replace(/^@+/, "")
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9_-]/g, "")
                    .replace(/-+/g, "-") || "user";
                  const shareUrl = `${window.location.origin}/@${cleanHandle}/video/${currentReview.id}`;
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
