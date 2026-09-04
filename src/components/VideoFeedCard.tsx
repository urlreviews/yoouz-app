import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Star,
  CheckCircle,
  Plus,
  Clock,
  MoreHorizontal,
  Menu,
  ChevronRight,
  ChevronLeft,
  Loader2,
  MapPin
} from "lucide-react";
import { VideoReview, VideoAuthor, FeedSubTab } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { formatBusinessName, resolveSafeAuthor, extractCleanDomain, getSafeAvatarUrl } from "../utils/placeUtils";
import { resolvePlayableVideoSource, resolvePlayableVideoSourcesCascade, resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { SEOTags } from "./SEOTags";
import {  saveVideoBlobToIndexedDB } from "../lib/videoStorage";
import { triggerHaptic } from "../utils/haptics";
import { preloadBusinessAssets } from "../utils/preloadUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";

interface VideoFeedCardProps {
  video: VideoReview;
  index: number;
  isActive: boolean;
  isNear: boolean;
  isMuted: boolean;
  isPlaying?: boolean;
  progressPercent?: number;
  allUsers?: any[];
  currentUser?: any;
  
  activeSubTab?: FeedSubTab;
  onSelectSubTab?: (tab: FeedSubTab) => void;
  onToggleMute: (e?: React.MouseEvent) => void;
  onForceMute?: () => void;
  onTogglePlayPause?: (e?: React.MouseEvent) => void;
  onOpenComments: (video: VideoReview) => void;
  onOpenPlace: (placeId: string) => void;
  onOpenCreator: (author: VideoAuthor) => void;
  onOpenShare: (video: VideoReview) => void;
  onOpenMoreMenu: (video: VideoReview) => void;
  onToggleLike: (videoId: string) => void;
  onToggleBookmark: (videoId: string) => void;
  onToggleFollow: (name: string) => void;
  onOpenMenu?: () => void;
  onGoBack?: () => void;
  feedContextTitle?: string;
  onGoHome?: () => void;
  businessLogoUrl?: string | null;
  businessBannerUrl?: string | null;
  cardRef: (el: HTMLDivElement | null) => void;
  slotRef?: (el: HTMLDivElement | null) => void;
  hasUserStartedFeed?: boolean;
  onStartFeed?: () => void;
  isSessionAudioUnlocked?: boolean;
  onUnlockAudio?: () => void;
  onRecordView?: (videoId: string) => void;
}

export const VideoFeedCard: React.FC<VideoFeedCardProps> = ({
  video,
  index,
  isActive,
  isNear,
  isMuted,
  allUsers,
  currentUser,
  activeSubTab,
  onSelectSubTab,
  onToggleMute,
  onForceMute,
  onOpenComments,
  onOpenPlace,
  onOpenCreator,
  onOpenShare,
  onOpenMoreMenu,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  onOpenMenu,
  onGoBack,
  feedContextTitle,
  businessLogoUrl,
  businessBannerUrl,
  cardRef,
  
  hasUserStartedFeed = true,
  onStartFeed,
  isSessionAudioUnlocked = false,
  onUnlockAudio,
  onRecordView
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState<boolean>(false);
  const isManuallyPausedRef = useRef<boolean>(false);
  useEffect(() => {
    isManuallyPausedRef.current = isManuallyPaused;
  }, [isManuallyPaused]);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isActualMuted, setIsActualMuted] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  const [showHeartAnimation, setShowHeartAnimation] = useState<boolean>(false);
  const [showPlayPauseFeedback, setShowPlayPauseFeedback] = useState<"play" | "pause" | null>(null);
  const [showMuteFeedback, setShowMuteFeedback] = useState<"muted" | "unmuted" | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);

  const muteFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number } | null>(null);

  // Establish prioritized source cascade list (Bunny CDN Edge -> Local Server Stream -> Secondary Mirror -> Fallback)
  const sourceCandidates = React.useMemo(() => {
    return resolvePlayableVideoSourcesCascade(video);
  }, [video]);
  const [sourceIndex, setSourceIndex] = useState<number>(0);

  // Reset source index whenever video changes
  useEffect(() => {
    setSourceIndex(0);
  }, [video?.id]);

  const currentSource = sourceCandidates[sourceIndex] || sourceCandidates[0] || resolvePlayableVideoSource(video);

  // High-fidelity poster URL
  const posterUrl = React.useMemo(() => {
    return resolveVideoPosterUrl(video);
  }, [video]);


  // Helper: Synchronously pause all other video elements on the page (Zero Hardware Lockup)
  const pauseOtherVideos = useCallback(() => {
    const currentEl = videoRef.current;
    document.querySelectorAll<HTMLVideoElement>("video").forEach((other) => {
      if (other !== currentEl && !other.paused) {
        try {
          other.pause();
        } catch (e) {}
      }
    });
  }, []);

  // Safe Play Execution using managed play promise queue
  const safePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    pauseOtherVideos();

    // Set muted to global isMuted state
    el.muted = isMuted;
    if (!isMuted) {
      el.volume = 1;
    }

    const p = el.play();
    if (p !== undefined) {
      playPromiseRef.current = p;
      p.then(() => {
        playPromiseRef.current = null;
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch((err) => {
        playPromiseRef.current = null;
        // If unmuted autoplay is blocked by browser policy without gesture, fallback to muted autoplay (standard YouTube Shorts behavior)
        if (err?.name === "NotAllowedError" || err?.name === "AbortError" || err?.message?.includes("gesture")) {
          el.muted = true;
          const retry = el.play();
          if (retry !== undefined) {
            playPromiseRef.current = retry;
            retry
              .then(() => {
                playPromiseRef.current = null;
                setIsPlaying(true);
                setIsBuffering(false);
              })
              .catch(() => {
                playPromiseRef.current = null;
                setIsPlaying(false);
              });
          }
        } else {
          setIsPlaying(false);
        }
      });
    }
  }, [isMuted, pauseOtherVideos]);

  // Safe Pause Execution waiting for pending play promises
  const safePause = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        })
        .catch(() => {})
        .finally(() => {
          playPromiseRef.current = null;
          setIsPlaying(false);
        });
    } else {
      if (!el.paused) {
        try {
          el.pause();
        } catch (e) {}
      }
      setIsPlaying(false);
    }
  }, []);

  // Sync mute state to video element in real time
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  // Play / Pause video based on card active state and manual pause flag
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const shouldPlay = isActive && !isManuallyPaused;

    if (shouldPlay) {
      setShowPlayPauseFeedback(null);
      safePlay();
    } else {
      safePause();
      if (!isActive) {
        el.currentTime = 0;
        setIsManuallyPaused(false);
        setProgressPercent(0);
      }
      setShowPlayPauseFeedback(null);
    }
  }, [isActive, currentSource, isMuted, isManuallyPaused, safePlay, safePause]);


  // Clean unmount safety
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) {}
      }
    };
  }, []);

  // Record view count when video is active and playing
  useEffect(() => {
    if (isActive && video?.id) {
      const timer = setTimeout(() => {
        onRecordView?.(video.id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, video?.id, onRecordView]);

  // Keep iOS / Android Lock Screen & Media Controls in sync with rich metadata & app logo artwork
  useEffect(() => {
    if (isActive && typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        const origin = window.location.origin;
        const place = formatBusinessName(video.placeName) || "Business Review";
        const author = video.author?.name || video.author?.name || "Verified Reviewer";
        const caption = video.caption || `${video.rating || 5}★ Video Review of ${place}`;

        const artworks: MediaImage[] = [
          { src: `${origin}/icon-512.png`, sizes: "512x512", type: "image/png" },
          { src: `${origin}/icon-192.png`, sizes: "192x192", type: "image/png" },
          { src: `${origin}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
          { src: `${origin}/favicon.png`, sizes: "64x64", type: "image/png" }
        ];

        if (video.thumbnailUrl) {
          const fullThumb = video.thumbnailUrl.startsWith("http")
            ? video.thumbnailUrl
            : `${origin}${video.thumbnailUrl}`;
          artworks.unshift({ src: fullThumb, sizes: "512x512", type: "image/jpeg" });
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${place} - ${caption}`,
          artist: `${author} • Yoouz`,
          album: "Yoouz - Real Video Reviews",
          artwork: artworks,
        });

        navigator.mediaSession.setActionHandler("play", () => {
          videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          videoRef.current?.pause();
          setIsPlaying(false);
        });
      } catch (e) {}
    }
  }, [isActive, video]);

  // Automatic source cascade failover handler
  const handleVideoError = useCallback(() => {
    console.warn(`[VideoFeedCard] Source failed for video ${video.id} (index ${sourceIndex}): ${currentSource}`);
    if (sourceIndex + 1 < sourceCandidates.length) {
      console.log(`[VideoFeedCard] Failing over to next source: ${sourceCandidates[sourceIndex + 1]}`);
      setSourceIndex((prev) => prev + 1);
    }
  }, [currentSource, video.id, sourceIndex, sourceCandidates]);

  // Click card to toggle Play / Pause (YouTube Shorts style)
  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const el = videoRef.current;
    if (!el) return;

    triggerHaptic("light");

    // If audio is locked and video is muted, tapping to play also unlocks audio with sound (Dual Play+Unmute)
    if (!isSessionAudioUnlocked && isMuted) {
      onUnlockAudio?.();
      if (onStartFeed) onStartFeed();
      el.muted = false;
      el.volume = 1;
      isManuallyPausedRef.current = false;
      setIsManuallyPaused(false);
      safePlay();
      if (e) triggerFeedback("play");
      setShowMuteFeedback("unmuted");
      return;
    }

    if (!hasUserStartedFeed) {
      if (onStartFeed) onStartFeed();
      isManuallyPausedRef.current = false;
      setIsManuallyPaused(false);
      safePlay();
      if (e) triggerFeedback("play");
      return;
    }

    if (isMuted && !el.paused && !isManuallyPaused) {
      // Single tap on playing muted video unmutes it (TikTok / Reels UX)
      handleToggleMute(e);
      return;
    }

    if (el.paused || isManuallyPaused) {
      isManuallyPausedRef.current = false;
      setIsManuallyPaused(false);
      safePlay();
      if (e) triggerFeedback("play");
    } else {
      isManuallyPausedRef.current = true;
      setIsManuallyPaused(true);
      safePause();
      if (e) triggerFeedback("pause");
    }
  };

  // Sound toggle button (YouTube Shorts style)
  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic("selection");

    const nextMuted = !isMuted;
    if (!nextMuted) {
      onUnlockAudio?.();
    }

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      }
    }

    onToggleMute(e);

    if (muteFeedbackTimeoutRef.current) clearTimeout(muteFeedbackTimeoutRef.current);
    setShowMuteFeedback(nextMuted ? "muted" : "unmuted");
    muteFeedbackTimeoutRef.current = setTimeout(() => {
      setShowMuteFeedback(null);
    }, 650);
  };

  const triggerFeedback = (type: "play" | "pause") => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setShowPlayPauseFeedback(type);
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowPlayPauseFeedback(null);
    }, 650);
  };

  // Double tap to like (supports touch taps & mouse clicks)
  const triggerDoubleTapLike = (clientX?: number, clientY?: number) => {
    triggerHaptic("success");
    if (!video.isLiked) {
      onToggleLike(video.id);
    }
    if (clientX !== undefined && clientY !== undefined) {
      setHeartCoords({ x: clientX, y: clientY });
    } else {
      setHeartCoords(null);
    }
    setShowHeartAnimation(true);
    setTimeout(() => {
      setShowHeartAnimation(false);
      setHeartCoords(null);
    }, 900);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const diff = now - lastTapTimeRef.current;
    
    if (diff < 320 && diff > 0) {
      // Detected Double Tap! Cancel pending single tap play/pause
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      triggerDoubleTapLike(e.clientX, e.clientY);
    } else {
      // Single tap: execute togglePlayPause directly and synchronously to preserve gesture token
      lastTapTimeRef.current = now;
      togglePlayPause(e);
    }
  };

  const handleDoubleTapLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
    triggerDoubleTapLike(e.clientX, e.clientY);
  };

  const safeAuthor = resolveSafeAuthor(video, currentUser, allUsers);

  // Preload high-priority assets when the card is active or near-active
  useEffect(() => {
    if (isActive || isNear) {
      preloadBusinessAssets(
        video.placeLogoUrl,
        video.placeBannerUrl,
        safeAuthor.avatar
      );
    }
  }, [isActive, isNear, video.placeLogoUrl, video.placeBannerUrl, safeAuthor.avatar]);


  const videoJsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": video.author.name
    },
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": formatBusinessName(video.placeName)
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": video.rating || 5,
      "bestRating": "5"
    },
    "video": {
      "@type": "VideoObject",
      "name": `${video.author.name} reviews ${formatBusinessName(video.placeName)}`,
      "description": video.caption || `Video review of ${formatBusinessName(video.placeName)} by ${video.author.name}`,
      "thumbnailUrl": resolveVideoPosterUrl(video),
      "uploadDate": (video.createdAtMs && !isNaN(new Date(video.createdAtMs).getTime())) ? new Date(video.createdAtMs).toISOString() : new Date().toISOString(),
      "contentUrl": video.videoUrl,
      "embedUrl": `https://yoouz.com/video/${video.id}`,
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": { "@type": "WatchAction" },
        "userInteractionCount": (video.likes * 3) || 0
      }
    }
  };

  const isExplicitVideoUrl = window.location.pathname.includes('/video/') || window.location.pathname.startsWith('/v/');

  return (
    <>
      {isActive && isExplicitVideoUrl && (
        <SEOTags 
          title={`${video.author.name} at ${formatBusinessName(video.placeName)} | Yoouz`}
          description={video.caption || `Check out ${video.author.name}'s video review of ${formatBusinessName(video.placeName)} on Yoouz.`}
          image={resolveVideoPosterUrl(video)}
          jsonLd={videoJsonLd}
          updateTitle={false}
        />
      )}
    <div
      ref={cardRef}
      data-video-index={index}
      id={`copo-video-card-${video.id}`}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleTapLike}
      className="snap-start snap-always shrink-0 relative w-full h-full md:w-auto md:h-[min(88vh,780px)] md:aspect-[9/16] md:max-w-[min(480px,calc(100vw-120px))] bg-black md:rounded-[24px] overflow-hidden md:shadow-2xl md:border md:border-zinc-800/90 select-none flex flex-col justify-end cursor-pointer group"
    >
      {/* Video Container */}
      <div
        id={`video-slot-${video.id}`}
        className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black"
      >
        {/* Direct Embedded Video Element with Active / Standby Pre-buffering (Sliding Window like YouTube Shorts) */}
        {(isActive || isNear) && (
          <video
            ref={videoRef}
            id={`video-element-${video.id}`}
            data-active={isActive ? "true" : "false"}
            src={currentSource}
            poster={resolveVideoPosterUrl(video)}
            preload="auto"
            autoPlay={isActive && hasUserStartedFeed}
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            x5-video-player-type="h5-page"
            x5-video-player-fullscreen="true"
            onVolumeChange={() => setIsActualMuted(videoRef.current?.muted ?? true)}
            loop
            muted={isMuted}
            disablePictureInPicture
            disableRemotePlayback
            className="w-full h-full object-cover absolute inset-0 pointer-events-none"
            onTimeUpdate={(e) => {
              const t = e.currentTarget;
              if (t.duration && !isNaN(t.duration) && t.duration > 0) {
                setProgressPercent((t.currentTime / t.duration) * 100);
              }
            }}
            onLoadedData={() => {
              setIsVideoLoaded(true);
              setIsBuffering(false);
            }}
            onCanPlay={() => {
              setIsVideoLoaded(true);
              if (isActive && !isManuallyPaused) {
                safePlay();
              }
            }}
            onPlaying={() => {
              setIsPlaying(true);
              setIsBuffering(false);
              setIsVideoLoaded(true);
              if (video?.id) {
                onRecordView?.(video.id);
              }
            }}
            onPause={() => {
              setIsPlaying(false);
            }}
            onWaiting={() => {
              if (isActive) setIsBuffering(true);
            }}
            onError={handleVideoError}
          />
        )}

        {/* High-Fidelity Poster (visible until video starts playback) */}
        <img
          src={posterUrl}
          alt={video.caption || formatBusinessName(video.placeName) || "Video review poster"}
          loading={isActive || isNear ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={isActive ? "high" : "auto"}
          className={`w-full h-full object-cover pointer-events-none absolute inset-0 transition-opacity duration-150 z-10 ${
            isActive && isPlaying ? "opacity-0" : "opacity-100"
          }`}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Progress Bar (Scrubber Indicator at top edge) */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20 z-40 pointer-events-none">
          <div
            className="h-full bg-white transition-[width] duration-150 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      {/* Vignette Gradients for readable text */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 z-10 pointer-events-none" />

      {/* Top Header Overlay (iOS & Android Universal Ergonomics) - z-50 to stay above everything */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 flex items-start justify-between px-3 md:px-5 [padding-top:max(8px,calc(env(safe-area-inset-top,0px)+2px))] md:[padding-top:16px] pointer-events-none"
      >
        {/* Left side: Navigation or Mobile Hamburger Drawer Pill */}
        <div className="pointer-events-auto flex items-center gap-2">
          {onGoBack ? (
            <button
              type="button"
              id={`btn-feed-back-${video.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  try {
                    videoRef.current.pause();
                  } catch (err) {
                    console.warn("Failed to pause video on back button click:", err);
                  }
                }
                onGoBack();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="w-11 h-11 rounded-full bg-black/85 hover:bg-black backdrop-blur-xl border border-white/35 flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl cursor-pointer"
              title="Go back"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          ) : (
            onOpenMenu && (
              <button
                type="button"
                id={`btn-mobile-menu-${video.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMenu();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="flex md:hidden items-center gap-2.5 px-4 h-11 rounded-full bg-black/85 hover:bg-black active:scale-95 backdrop-blur-2xl border border-white/35 text-white shadow-2xl transition-all cursor-pointer select-none"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
                <span className="text-[15px] font-extrabold tracking-wide text-white drop-shadow-sm">Yoouz</span>
              </button>
            )
          )}
        </div>

        {/* Center: Context Title if viewing a specific place or category */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 [padding-top:max(8px,calc(env(safe-area-inset-top,0px)+2px))] md:[padding-top:16px] w-full max-w-[45%] flex justify-center pointer-events-none">
          {feedContextTitle && 
             !feedContextTitle.startsWith("@") && 
             feedContextTitle.trim().toLowerCase() !== (safeAuthor.name || "").trim().toLowerCase() && (
            <div className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-2xl truncate text-center pointer-events-auto">
              {feedContextTitle}
            </div>
          )}
        </div>

        {/* Right side: Sound Mute / Unmute Toggle Button (Positioned at top right) */}
        <div className="pointer-events-auto">
          <button
            type="button"
            id={`btn-toggle-sound-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMute(e);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/85 hover:bg-black active:scale-90 backdrop-blur-2xl border border-white/35 flex items-center justify-center text-white transition-all cursor-pointer shadow-2xl"
            title={isMuted ? "Unmute sound" : "Mute sound"}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white stroke-[2.2]" />
            ) : (
              <Volume2 className="w-5 h-5 text-white stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* Sleek "Tap to Unmute" Overlay Pill (Visible on first video or whenever session audio is locked) */}
      {isActive && isMuted && (!isSessionAudioUnlocked || index === 0) && (
        <div className="absolute top-[68px] sm:top-[76px] left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
          <button
            type="button"
            id={`btn-tap-unmute-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic("success");
              onUnlockAudio?.();
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.volume = 1;
              }
              onToggleMute(e);
              safePlay();
              setShowMuteFeedback("unmuted");
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/85 hover:bg-black active:scale-95 backdrop-blur-2xl border border-white/35 text-white shadow-2xl transition-all cursor-pointer group select-none"
            aria-label="Tap to Unmute"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <VolumeX className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-wide text-white whitespace-nowrap drop-shadow-sm">
              Tap to Unmute
            </span>
          </button>
        </div>
      )}

      {/* Transient Play/Pause Icon Tap Feedback */}
      {showPlayPauseFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl animate-out fade-out zoom-out duration-500 pointer-events-none">
          {showPlayPauseFeedback === "play" ? (
            <Play className="w-9 h-9 fill-white translate-x-0.5" />
          ) : (
            <Pause className="w-9 h-9 fill-white" />
          )}
        </div>
      )}

      {/* Transient Mute/Unmute Icon Tap Feedback */}
      {showMuteFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-2xl animate-out fade-out zoom-out duration-500 pointer-events-none">
          {showMuteFeedback === "unmuted" ? (
            <Volume2 className="w-8 h-8 text-white" />
          ) : (
            <VolumeX className="w-8 h-8 text-white" />
          )}
        </div>
      )}

      {/* Center Play Button (Click in middle of video to start on first video, exactly like desktop) */}
      {isActive && (!hasUserStartedFeed || isManuallyPaused) && !showPlayPauseFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-auto">
          <button
            type="button"
            id={`copo-play-center-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause(e);
            }}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 hover:scale-105 transition-all duration-200 relative group shadow-2xl bg-black/60 hover:bg-black/80 backdrop-blur-xl border-2 border-white/40 md:border-white/30"
            aria-label="Play video"
          >
            {/* Gentle invitation ping ring for initial start */}
            {!hasUserStartedFeed && (
              <span
                className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-60 pointer-events-none"
                style={{ animationDuration: "2s" }}
              />
            )}
            <Play className="w-10 h-10 fill-white text-white translate-x-0.5 drop-shadow-md relative z-10" />
          </button>
        </div>
      )}


      {/* Double-tap Heart Animation (Positioned at tap coords or centered with burst animation) */}
      {showHeartAnimation && (
        <div 
          className="absolute z-40 pointer-events-none flex items-center justify-center animate-in zoom-in-50 fade-in duration-200"
          style={heartCoords ? {
            left: `${heartCoords.x}px`,
            top: `${heartCoords.y}px`,
            transform: 'translate(-50%, -50%)'
          } : {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative flex items-center justify-center">
            <Heart className="w-28 h-28 fill-[#ff2d55] text-[#ff2d55] drop-shadow-[0_0_25px_rgba(255,45,85,0.85)] animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-pink-500/20 blur-xl animate-ping" />
          </div>
        </div>
      )}

      {/* Bottom Area: Metadata & Actions Container - sits right above mobile bottom nav */}
      <div 
        className="relative z-30 w-full flex items-end justify-between px-3 md:px-5 pt-4 pointer-events-none md:pb-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 58px)" }}
      >
        
        {/* Bottom Video Metadata & Place Badge */}
        <footer
          id={`copo-video-bottom-info-${video.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col gap-2 pointer-events-auto pr-2 min-w-0 flex-1"
        >
          <div className="flex flex-col gap-1 w-full">
            <button
              onClick={() => {
                if (videoRef.current) {
                  try { videoRef.current.pause(); } catch (e) {}
                }
                pauseOtherVideos();
                onOpenCreator(safeAuthor);
              }}
              className="font-extrabold text-white text-[15px] sm:text-[16px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] flex items-center gap-1.5 hover:underline cursor-pointer bg-transparent border-0 p-0 text-left w-fit"
              title={`View ${safeAuthor.name} Profile`}
            >
              <span className="whitespace-nowrap truncate leading-tight">By {safeAuthor.name}</span>
              {safeAuthor.isVerified && (
                <CheckCircle className="w-4 h-4 fill-white text-black inline shrink-0" />
              )}
            </button>

            {safeAuthor.location && (
              <div className="flex items-center gap-1 text-[11.5px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-none shrink-0 w-fit">
                <MapPin className="w-3 h-3 text-white shrink-0" />
                <span>{safeAuthor.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(video.rating)
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "fill-zinc-600/70 text-zinc-500/80"
                    }`}
                  />
                ))}
              </div>
              {(video.recordedAt || video.createdAtMs) && (
                <span className="text-white text-[11.5px] font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white shrink-0" />
                  <span>{formatRecordedDate(video.recordedAt, video.createdAtMs)}</span>
                </span>
              )}
            </div>
          </div>

          <button
            id={`pill-place-${video.placeId}`}
            onClick={() => {
              if (videoRef.current) {
                try { videoRef.current.pause(); } catch (e) {}
              }
              pauseOtherVideos();
              onOpenPlace(video.placeId);
            }}
            className="self-start flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/85 backdrop-blur-xl border border-white/35 text-white text-[14px] font-bold hover:bg-black hover:border-white/60 transition-all w-fit max-w-[80vw] text-left group cursor-pointer shadow-2xl"
          >
            <CopoBrandLogo
              domain={extractCleanDomain(video.placeWebsite || video.placeId || video.placeName)}
              name={formatBusinessName(video?.placeName || video?.dishOrItem || video?.placeId) || "Business Place"}
              website={video.placeWebsite}
              logoUrl={businessLogoUrl || video?.placeLogoUrl}
              bannerUrl={businessBannerUrl || video.placeBannerUrl}
              className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-sm group-hover:scale-105 transition-transform"
              imageClassName="w-full h-full object-contain rounded-[5px] [image-rendering:-webkit-optimize-contrast]"
              fallbackTextClassName="font-extrabold text-xs text-white"
            />
            <div className="flex items-center min-w-0 flex-1 gap-1.5">
              <span className="truncate leading-tight font-extrabold text-[14px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] group-hover:text-white transition-colors">
                {formatBusinessName(video?.placeName || video?.dishOrItem || video?.placeId) || "Business Place"}
              </span>
              <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0 drop-shadow-sm" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </footer>

        {/* Right Side Action Column */}
        <aside
          id={`copo-video-actions-col-${video.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-3 sm:gap-3.5 text-white pointer-events-auto shrink-0 mb-0 md:mb-1"
        >
          {/* Creator Avatar */}
          <div className="relative group/avatar mb-1">
            <button
              onClick={() => {
                if (videoRef.current) {
                  try { videoRef.current.pause(); } catch (e) {}
                }
                pauseOtherVideos();
                onOpenCreator(safeAuthor);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 border-2 border-white/70 hover:border-white overflow-hidden bg-black transition-colors cursor-pointer shadow-xl"
              title={`View ${safeAuthor.name} Profile`}
            >
              <img
                src={getSafeAvatarUrl(safeAuthor.avatar, safeAuthor.name, safeAuthor.handle)}
                alt={safeAuthor.name}
                loading={isActive || isNear ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={isActive ? "high" : "auto"}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = generateGoogleLetterAvatarSvg(safeAuthor.name || "User", 128, safeAuthor.handle || safeAuthor.name);
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            </button>

            {!safeAuthor.isFollowed && (
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  onToggleFollow(safeAuthor.name);
                }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer border-2 border-zinc-950"
                title="Follow"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3] text-zinc-950" />
              </button>
            )}
          </div>

          {/* Like */}
          <div className="flex flex-col items-center">
            <button
              id={`btn-like-${video.id}`}
              onClick={() => {
                triggerHaptic(video.isLiked ? "selection" : "medium");
                onToggleLike(video.id);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 backdrop-blur-xl border border-white/30 hover:border-white/60 hover:bg-black/85 flex items-center justify-center transition-all active:scale-90 shadow-xl"
              title="Like"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  video.isLiked
                    ? "fill-[#ff2d55] text-[#ff2d55] drop-shadow-sm"
                    : "text-white fill-none stroke-[2.2]"
                }`}
              />
            </button>
            <span className="text-[12px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {typeof video.likes === 'number' ? video.likes : (video.likesCount || 0)}
            </span>
          </div>

          {/* Comments */}
          <div className="flex flex-col items-center">
            <button
              id={`btn-comments-${video.id}`}
              onClick={() => {
                triggerHaptic("light");
                onOpenComments(video);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 backdrop-blur-xl border border-white/30 hover:border-white/60 hover:bg-black/85 flex items-center justify-center transition-all active:scale-90 shadow-xl"
              title="Comments"
            >
              <MessageCircle className="w-6 h-6 text-white stroke-[2.2]" />
            </button>
            <span className="text-[12px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {(video.commentsCount || video.comments?.length || 0) + (video.ownerResponse ? 1 : 0)}
            </span>
          </div>

          {/* Bookmark */}
          <div className="flex flex-col items-center">
            <button
              id={`btn-bookmark-${video.id}`}
              onClick={() => {
                triggerHaptic("selection");
                onToggleBookmark(video.id);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 backdrop-blur-xl border border-white/30 hover:border-white/60 hover:bg-black/85 flex items-center justify-center transition-all active:scale-90 shadow-xl"
              title="Bookmark Place & Video"
            >
              <Bookmark
                className={`w-6 h-6 transition-colors ${
                  video.isBookmarked
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "text-white stroke-[2.2]"
                }`}
              />
            </button>
            <span className="text-[12px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {video.bookmarksCount || 0}
            </span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center">
            <button
              id={`btn-share-${video.id}`}
              onClick={() => {
                triggerHaptic("light");
                onOpenShare(video);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 backdrop-blur-xl border border-white/30 hover:border-white/60 hover:bg-black/85 flex items-center justify-center transition-all active:scale-90 shadow-xl"
              title="Share Video Review"
            >
              <Share2 className="w-6 h-6 text-white stroke-[2.2]" />
            </button>
            <span className="text-[12px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {video.sharesCount || video.shares || 0}
            </span>
          </div>

          {/* More Options */}
          <div className="flex flex-col items-center">
            <button
              id={`btn-more-options-${video.id}`}
              onClick={() => {
                triggerHaptic("light");
                onOpenMoreMenu(video);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 backdrop-blur-xl border border-white/30 hover:border-white/60 hover:bg-black/85 flex items-center justify-center hover:scale-105 transition-all active:scale-90 text-white cursor-pointer shadow-xl"
              title="More options"
            >
              <MoreHorizontal className="w-6 h-6 stroke-[2.5] text-white" />
            </button>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
};
