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
import { getSafeAvatarUrl, getDisplayUrlAsDomain, getPlaceSlug } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { CopoStarRating } from "./CopoStarRating";
import { SubtitleOverlay } from "./SubtitleOverlay";

interface GoogleVideoPlayerModalProps {
  reviews: VideoReview[];
  currentReview: VideoReview;
  onClose: () => void;
  onSelectReview: (review: VideoReview) => void;
  onToggleLike: (reviewId: string) => void;
  onToggleBookmark: (videoId: string) => void;
  isBookmarked: boolean;
  onOpenCreator?: (author: VideoAuthor) => void;
  onRecordView?: (videoId: string) => void;
  onAddComment?: (videoId: string, text: string) => void;
  onShareIncrement?: (videoId: string) => void;
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
  onRecordView,
  onAddComment,
  onShareIncrement
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(true);
  const [isMuted, setIsMuted, isSessionAudioUnlocked, unlockAudioSession] = useGlobalMute();
  const [isActualMuted, setIsActualMuted] = useState<boolean>(isMuted || !isSessionAudioUnlocked);
  const [newComment, setNewComment] = useState("");
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(currentReview?.durationSeconds || 15);
  const [showSubtitles, setShowSubtitles] = useState(true);
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
      const activeEl = document.activeElement;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        handleNext();
      }
      if (e.key === " " || e.key === "Spacebar") {
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
    const commentBody = newComment.trim();
    if (!commentBody) return;
    let currentUserProfile: any = null;
    try {
      const stored = localStorage.getItem("copo_user_profile");
      if (stored) currentUserProfile = JSON.parse(stored);
    } catch {}
    const commentAuthorName = currentUserProfile?.name || "Local Reviewer";
    const commentAuthorHandle = currentUserProfile?.handle || `@${commentAuthorName.toLowerCase().replace(/[^a-z0-9]/g, "") || "reviewer"}`;
    const commentAuthorAvatar = currentUserProfile?.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`;

    const newCommentItem = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorName: commentAuthorName,
      authorHandle: commentAuthorHandle,
      authorAvatar: commentAuthorAvatar,
      text: commentBody,
      createdAt: "Just now",
      createdAtMs: Date.now(),
      likesCount: 0
    };

    if (!Array.isArray(currentReview.comments)) {
      currentReview.comments = [];
    }
    currentReview.comments.push(newCommentItem);
    currentReview.commentsCount = (currentReview.commentsCount || 0) + 1;

    if (onAddComment) {
      onAddComment(currentReview.id, commentBody);
    } else {
      fetch("/api/interactions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: currentReview.id,
          comment: newCommentItem,
          userId: currentUserProfile?.email || currentUserProfile?.id || "anon",
          userEmail: currentUserProfile?.email || "",
          userName: commentAuthorName,
          userAvatar: commentAuthorAvatar
        })
      }).catch(() => {});
    }

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
              setCurrentTime(t.currentTime);
              if (t.duration && !isNaN(t.duration)) {
                setDuration(t.duration);
              }
              if ((!hasStarted || !isPlaying) && !t.paused) {
                t.pause();
              }
            }}
            onLoadedMetadata={(e) => {
              const t = e.currentTarget;
              if (t.duration && !isNaN(t.duration)) {
                setDuration(t.duration);
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

          {/* Subtitle Overlay (YouTube-grade sentence captions) */}
          <SubtitleOverlay
            currentTime={currentTime}
            segments={currentReview.segments}
            transcriptText={currentReview.transcriptText}
            duration={duration || currentReview.durationSeconds || 15}
            isActive={showSubtitles}
          />

          {/* Top Bar Header */}
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#ea4335]" />
                <span className="truncate max-w-[160px]">{currentReview.placeName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* YouTube-style CC Subtitles Toggle Button */}
              <button
                type="button"
                onClick={() => setShowSubtitles(prev => !prev)}
                className={`px-2.5 h-9 rounded-full backdrop-blur-2xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-xl ${
                  showSubtitles
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-black/60 border-white/20 text-white/70 hover:text-white"
                }`}
                title={showSubtitles ? "Disable Subtitles" : "Enable Subtitles"}
              >
                CC
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className={`w-10 h-10 rounded-full bg-black/85 hover:bg-black active:scale-90 backdrop-blur-2xl border flex items-center justify-center text-white transition-all cursor-pointer shadow-2xl ${
                  isMuted || !isSessionAudioUnlocked || isActualMuted
                    ? "border-amber-400/80 bg-black/90 animate-pulse-subtle"
                    : "border-white/35"
                }`}
                title={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Unmute sound" : "Mute sound"}
                aria-label={isMuted || !isSessionAudioUnlocked || isActualMuted ? "Unmute sound" : "Mute sound"}
              >
                {isMuted || !isSessionAudioUnlocked || isActualMuted ? (
                  <VolumeX className="w-4 h-4 text-amber-300 stroke-[2.2] shrink-0" />
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
              className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-85 active:scale-[0.98] transition-all no-underline outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent]"
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
                <h4 className="font-semibold text-sm group-hover:text-zinc-200 transition-colors min-w-0 leading-snug">
                  <span className="inline-flex items-center gap-1">
                    <span className="truncate">{currentReview.author.name}</span>
                    {currentReview.author.isVerified && (
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0 inline-block align-middle" />
                    )}
                  </span>
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-200">
                  <CopoStarRating
                    rating={currentReview.rating || 5}
                    starClassName="w-3 h-3"
                    filledColorClass="fill-amber-400 text-amber-400"
                    emptyColorClass="text-zinc-200 fill-zinc-500"
                  />
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
                let trimmed = (currentReview.caption || "").trim();
                // Strip raw review ID leaks (e.g. rev17895770756273488d.com)
                trimmed = trimmed.replace(/rev\d+[a-z0-9]*(\.com)?/gi, "yoouz.com").replace(/rev[0-9a-f]{8,}(\.com)?/gi, "yoouz.com");
                if (/^video review (for|of)\b/i.test(trimmed)) {
                  const cleanDomain = getDisplayUrlAsDomain(currentReview) || "yoouz.com";
                  return `Video review for ${cleanDomain}`;
                }
                return trimmed;
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
                {typeof currentReview.likes === 'number' ? currentReview.likes : (currentReview.likesCount || 0)}
              </span>
            </button>

            <button
              onClick={() => onToggleBookmark(currentReview.id)}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                  (currentReview.isBookmarked || isBookmarked)
                    ? "bg-amber-500 text-white scale-110"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${(currentReview.isBookmarked || isBookmarked) ? "fill-white" : ""}`} />
              </div>
              <span className="text-[11px] font-bold mt-1 drop-shadow">
                {typeof currentReview.bookmarksCount === 'number' ? currentReview.bookmarksCount : (typeof (currentReview as any).bookmarks === 'number' ? (currentReview as any).bookmarks : 0)}
              </span>
            </button>

            <button
              onClick={() => {
                if (onShareIncrement) {
                  onShareIncrement(currentReview.id);
                } else {
                  fetch("/api/interactions/share", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      videoId: currentReview.id,
                      platform: "general"
                    })
                  }).catch(() => {});
                }
                const currentShares = (currentReview.sharesCount || currentReview.shares || 0) + 1;
                currentReview.shares = currentShares;
                currentReview.sharesCount = currentShares;

                if (navigator.share) {
                  const domainSlug = getPlaceSlug(currentReview.placeWebsite || currentReview.placeId || currentReview.placeName || currentReview);
                  const shareUrl = `${window.location.origin}/review/${encodeURIComponent(domainSlug)}/${encodeURIComponent(currentReview.id)}`;
                  navigator.share({ title: currentReview.placeName, url: shareUrl }).catch(() => {});
                }
              }}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold mt-1 drop-shadow">
                {currentReview.sharesCount || currentReview.shares || "Share"}
              </span>
            </button>
          </div>
        </div>
      </div>

        {/* Floating Prev/Next Buttons */}
        {reviews.length > 0 && (() => {
          const isAtFirstVideo = currentIndex <= 0;
          const isAtLastVideo = currentIndex >= reviews.length - 1;

          return (
            <div className="hidden sm:flex flex-col gap-3 select-none">
              <button
                onClick={handlePrev}
                disabled={isAtFirstVideo}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
                  isAtFirstVideo
                    ? "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed opacity-35"
                    : "bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                }`}
                title={isAtFirstVideo ? "First Video" : "Previous Video"}
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                disabled={isAtLastVideo}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
                  isAtLastVideo
                    ? "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed opacity-35"
                    : "bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                }`}
                title={isAtLastVideo ? "Last Video" : "Next Video"}
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
