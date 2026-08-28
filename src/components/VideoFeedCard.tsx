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
import { formatBusinessName } from "../utils/placeUtils";
import { resolvePlayableVideoSourcesCascade, resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { SEOTags } from "./SEOTags";
import { getVideoBlobFromIndexedDB, saveVideoBlobToIndexedDB } from "../lib/videoStorage";
import { triggerHaptic } from "../utils/haptics";

interface VideoFeedCardProps {
  video: VideoReview;
  index: number;
  isActive: boolean;
  isNear: boolean;
  isMuted: boolean;
  isPlaying?: boolean;
  progressPercent?: number;
  localBlobUrl?: string | null;
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
}

export const VideoFeedCard: React.FC<VideoFeedCardProps> = ({
  video,
  index,
  isActive,
  isNear,
  isMuted,
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
  localBlobUrl,
  hasUserStartedFeed = false,
  onStartFeed
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [cascadeIndex, setCascadeIndex] = useState<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState<boolean>(false);
  const [showPlayPauseFeedback, setShowPlayPauseFeedback] = useState<"play" | "pause" | null>(null);
  const [showMuteFeedback, setShowMuteFeedback] = useState<"muted" | "unmuted" | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);

  const muteFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number } | null>(null);

  const [cachedLocalUrl, setCachedLocalUrl] = useState<string | null>(null);

  // Fallback video cascade list
  const cascade = React.useMemo(() => {
    return resolvePlayableVideoSourcesCascade(video);
  }, [video]);

  // Read local IndexedDB blob URL if available
  useEffect(() => {
    let active = true;
    if (video?.id) {
      getVideoBlobFromIndexedDB(video.id).then((url) => {
        if (active && url) {
          setCachedLocalUrl(url);
          console.log(`⚡ [VideoFeedCard] Loaded video ${video.id} instantly from local IndexedDB cache!`);
        }
      });
    }
return () => {
      active = false;
    };
  }, [video?.id]);

  // Establish stable source to prevent mobile Safari/Chrome pipeline resets
  const [activeSource, setActiveSource] = useState<string>(() => {
    return localBlobUrl || cachedLocalUrl || cascade[cascadeIndex] || "/api/videos/stream/default-review.mp4";
  });

  useEffect(() => {
    const resolved = localBlobUrl || cachedLocalUrl || cascade[cascadeIndex] || "/api/videos/stream/default-review.mp4";
    
    // If card is active and already playing or loaded, lock the source to prevent pipeline teardown
    if (isActive && activeSource) {
      // If we got a local blob, we can only safely hot-swap before playback starts
      if (!isPlaying && !isVideoLoaded && localBlobUrl && activeSource !== localBlobUrl) {
        setActiveSource(localBlobUrl);
      }
      return;
    }

    // Otherwise, we are free to keep the source fully up-to-date with preloaded blobs
    if (resolved && resolved !== activeSource) {
      setActiveSource(resolved);
    }
  }, [isActive, localBlobUrl, cachedLocalUrl, cascade, cascadeIndex, isPlaying, isVideoLoaded, activeSource]);

  const currentSource = activeSource;

  // High-fidelity poster URL
  const posterUrl = React.useMemo(() => {
    return resolveVideoPosterUrl(video);
  }, [video]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  // Play / Pause video based on card active state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const shouldPlay = isActive && hasUserStartedFeed && !isManuallyPaused;

    if (shouldPlay) {
      setShowPlayPauseFeedback(null);
      el.muted = isMuted;
      if (!isMuted) el.volume = 1;

      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(() => {
            el.muted = true;
            el.play().then(() => {
              setIsPlaying(true);
              setIsBuffering(false);
            }).catch(() => {
              setIsPlaying(false);
            });
          });
      }
    } else {
      // If we are not supposed to play, force pause
      try {
        el.pause();
        if (!isActive) {
          el.currentTime = 0;
        }
      } catch (e) {}
      setIsPlaying(false);
      setIsBuffering(false);
      if (!isActive) {
        setIsManuallyPaused(false);
        setProgressPercent(0);
      }
      setShowPlayPauseFeedback(null);
    }
    
    return () => {
      try {
        el.pause();
      } catch (e) {}
    };
  }, [isActive, currentSource, isMuted, hasUserStartedFeed, isManuallyPaused]);

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

  // Handle video error and advance through cascade
  const handleVideoError = useCallback(() => {
    console.warn(`[VideoFeedCard] Source failed for video ${video.id}: ${currentSource}`);
    if (cascadeIndex < cascade.length - 1) {
      setCascadeIndex((prev) => prev + 1);
    }
  }, [cascadeIndex, cascade.length, currentSource, video.id]);

  // Click card to toggle Play / Pause (TikTok style)
  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const el = videoRef.current;
    if (!el) return;

    // Direct user tap: activate feed session immediately
    if (onStartFeed && !hasUserStartedFeed) {
      onStartFeed();
    }

    triggerHaptic("light");

    if (el.paused) {
      setIsManuallyPaused(false);
      el.muted = isMuted;
      if (!isMuted) el.volume = 1;
      el.play()
        .then(() => {
          setIsPlaying(true);
          if (e) triggerFeedback("play");
        })
        .catch(() => {
          el.muted = true;
          el.play().then(() => {
            setIsPlaying(true);
            if (e) triggerFeedback("play");
          }).catch(() => {});
        });
    } else {
      setIsManuallyPaused(true);
      el.pause();
      setIsPlaying(false);
      if (e) triggerFeedback("pause");
    }
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic("selection");
    
    // Direct user tap: activate feed session immediately
    if (onStartFeed && !hasUserStartedFeed) {
      onStartFeed();
    }

    // Synchronous direct DOM mutation inside the click handler to satisfy iOS Safari
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      if (isMuted) {
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      }
    }

    onToggleMute(e);

    if (muteFeedbackTimeoutRef.current) clearTimeout(muteFeedbackTimeoutRef.current);
    setShowMuteFeedback(isMuted ? "unmuted" : "muted");
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
      // First tap: debounce single tap so double tap isn't interrupted by play/pause
      lastTapTimeRef.current = now;
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = setTimeout(() => {
        togglePlayPause(e);
        singleTapTimeoutRef.current = null;
      }, 250);
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

  const safeAuthor = video.author || {
    name: "Verified Reviewer",
    
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(video.userId || "Reviewer")}&background=1a73e8&color=fff&bold=true&size=128`,
    isVerified: true,
    isFollowed: false
  };


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

  return (
    <>
      {isActive && (
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
      className="snap-start snap-always shrink-0 relative w-full h-full md:w-full md:max-w-[400px] lg:w-[420px] lg:max-w-none md:h-[92vh] md:max-h-[880px] bg-black md:rounded-3xl overflow-hidden md:shadow-2xl md:border md:border-zinc-800 select-none flex flex-col justify-between cursor-pointer group"
    >
      {/* Video Container */}
      <div
        id={`video-slot-${video.id}`}
        className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black"
      >
        {/* Direct Embedded Video Element with Active / Standby Pre-buffering */}
        <video
          ref={videoRef}
          id={`video-element-${video.id}`}
          src={isActive || isNear ? currentSource : undefined}
          preload={isActive ? "auto" : "metadata"}
          autoPlay={false}
          playsInline
          webkit-playsinline="true"
          loop
          muted={isMuted}
          disablePictureInPicture
          className="w-full h-full object-cover absolute inset-0"
          onTimeUpdate={(e) => {
            const t = e.currentTarget;
            
            // Safety: if it should be paused but is moving (browser heuristic), force pause
            const shouldPlay = isActive && hasUserStartedFeed && !isManuallyPaused;
            if (!shouldPlay && !t.paused) {
              t.pause();
            }

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
            const shouldPlay = isActive && hasUserStartedFeed && !isManuallyPaused;
            if (shouldPlay) {
              if (videoRef.current?.paused) {
                videoRef.current.play().catch(() => {});
              }
            } else {
              // Force pause if not active or feed not started or manually paused
              videoRef.current?.pause();
              setIsPlaying(false);
            }
          }}
          onPlaying={() => {
            const shouldPlay = isActive && hasUserStartedFeed && !isManuallyPaused;
            if (!shouldPlay) {
              // Safety catch for browser-level autoplay heuristics or race conditions
              videoRef.current?.pause();
              setIsPlaying(false);
              return;
            }
            setIsPlaying(true);
            setIsBuffering(false);
            setIsVideoLoaded(true);
          }}
          onPause={() => {
            setIsPlaying(false);
          }}
          onWaiting={() => {
            if (isActive) setIsBuffering(true);
          }}
          onError={handleVideoError}
        />

        {/* High-Fidelity Poster (visible until video starts playback) */}
        <img
          src={posterUrl}
          alt={video.caption || formatBusinessName(video.placeName) || "Video review poster"}
          className={`w-full h-full object-cover pointer-events-none absolute inset-0 transition-opacity duration-300 z-10 ${
            isActive && isPlaying ? "opacity-0" : "opacity-100"
          }`}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Progress Bar (Scrubber Indicator at top edge) */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20 z-40 pointer-events-none">
          <div
            className="h-full bg-blue-500 transition-[width] duration-150 ease-linear shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      {/* Vignette Gradients for readable text */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 z-10 pointer-events-none" />

      {/* Top Header Overlay (iOS & Android Universal Ergonomics) - z-30 to stay above tap-to-play overlay */}
      <header
        id={`copo-video-top-brand-${video.id}`}
        onClick={(e) => e.stopPropagation()}
        className="relative z-30 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,14px)+10px)] md:pt-4 pb-2 pointer-events-auto"
      >
        {/* Left side: Back button if inside a place/creator feed, or interactive Drawer Menu & Brand button */}
        <div className="flex items-center gap-2 min-w-[70px]">
          {onGoBack ? (
            <button
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
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg cursor-pointer pointer-events-auto"
              title="Go back"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          ) : (
            <button
              id="btn-mobile-menu-drawer"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenMenu) onOpenMenu();
              }}
              className="md:hidden flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 backdrop-blur-xl border border-white/25 shadow-md cursor-pointer transition-all text-white pointer-events-auto"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 text-white shrink-0" strokeWidth={2.2} />
              <span className="text-xs font-bold tracking-tight text-white drop-shadow">Yoouz</span>
            </button>
          )}
        </div>

        {/* Center: Context Title if viewing a specific place or creator review list */}
        <div className="flex items-center justify-center">
          {feedContextTitle && (
            <div className="px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-md max-w-[180px] sm:max-w-[240px] truncate text-center">
              {feedContextTitle}
            </div>
          )}
        </div>

        {/* Right side: Sound Mute / Unmute Toggle Button */}
        <div className="flex items-center justify-end gap-2 min-w-[70px]">
          <button
            id={`btn-toggle-sound-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMute(e);
            }}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 active:scale-90 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg pointer-events-auto"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-zinc-200" />
            ) : (
              <div className="flex items-end justify-center gap-[2px] w-5 h-5 relative">
                {isPlaying ? (
                  <>
                    <div className="w-[3px] bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite] h-2"></div>
                    <div className="w-[3px] bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_0.2s] h-4"></div>
                    <div className="w-[3px] bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_0.4s] h-3"></div>
                  </>
                ) : (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            )}
          </button>
        </div>
      </header>

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

      {/* Paused Center Play Button - shown whenever video is paused or feed hasn't started */}
      {isActive && (isManuallyPaused || !hasUserStartedFeed) && !showPlayPauseFeedback && (
        <button
          type="button"
          id={`copo-play-center-btn-${video.id}`}
          onClick={togglePlayPause}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/65 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-2xl animate-in zoom-in-90 duration-150 pointer-events-auto cursor-pointer active:scale-90 hover:scale-105 transition-transform"
          aria-label="Play video"
        >
          <Play className="w-8 h-8 fill-white translate-x-0.5" />
        </button>
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

      {/* Bottom Area: Metadata & Actions Container - elevated to z-30 */}
      <div className="relative z-30 w-full flex items-end justify-between px-4 pb-[calc(env(safe-area-inset-bottom,8px)+48px)] md:pb-6 pt-4 pointer-events-none">
        
        {/* Bottom Video Metadata & Place Badge */}
        <footer
          id={`copo-video-bottom-info-${video.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col gap-3 pointer-events-auto pr-2 min-w-0 flex-1"
        >
          <div className="flex flex-col gap-1.5 w-full">
            <button
              onClick={() => onOpenCreator(safeAuthor)}
              className="font-bold text-white text-[15px] drop-shadow flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 p-0 text-left w-fit"
              title={`View ${safeAuthor.name} Profile`}
            >
              <span className="whitespace-nowrap truncate leading-tight">By {safeAuthor.name}</span>
              {safeAuthor.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-black inline shrink-0" />
              )}
            </button>

            {safeAuthor.location && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-white/95 drop-shadow-sm leading-none shrink-0 w-fit">
                <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
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
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "fill-zinc-600/70 text-zinc-500/80"
                    }`}
                  />
                ))}
              </div>
              {(video.recordedAt || video.createdAtMs) && (
                <span className="text-white/80 text-[11px] font-medium drop-shadow-sm flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/70 shrink-0" />
                  <span>{formatRecordedDate(video.recordedAt, video.createdAtMs)}</span>
                </span>
              )}
            </div>
          </div>

          <button
            id={`pill-place-${video.placeId}`}
            onClick={() => onOpenPlace(video.placeId)}
            className="self-start flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-white text-[14px] font-semibold hover:bg-black/95 hover:border-white/40 transition-all w-fit max-w-[100%] text-left group cursor-pointer shadow-lg"
          >
            <CopoBrandLogo
              domain={video.placeWebsite}
              name={formatBusinessName(video?.placeName) || "Business Place"}
              website={video.placeWebsite}
              logoUrl={businessLogoUrl}
              bannerUrl={businessBannerUrl || video.placeBannerUrl}
              className="w-9 h-9 rounded-lg bg-white border border-white/40 overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-sm group-hover:scale-105 transition-transform"
              imageClassName="w-full h-full object-contain rounded-[5px] [image-rendering:-webkit-optimize-contrast]"
              fallbackTextClassName="font-extrabold text-sm text-white"
            />
            <div className="flex flex-col justify-center min-w-0 flex-1 leading-snug">
              <span className="whitespace-normal leading-tight line-clamp-2 font-bold text-white group-hover:text-zinc-200 transition-colors">{formatBusinessName(video?.placeName) || "Business Place"}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </footer>

        {/* Right Side Action Column */}
        <aside
          id={`copo-video-actions-col-${video.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-4 text-white pointer-events-auto shrink-0 mb-1"
        >
          {/* Creator Avatar */}
          <div className="relative group/avatar">
            <button
              onClick={() => onOpenCreator(safeAuthor)}
              className="w-11 h-11 rounded-full p-0.5 border-2 border-white/30 hover:border-blue-500 overflow-hidden bg-black transition-colors cursor-pointer"
              title={`View ${safeAuthor.name} Profile`}
            >
              <img
                src={safeAuthor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeAuthor.name || "User")}&background=1a73e8&color=fff`}
                alt={safeAuthor.name}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </button>

            {!safeAuthor.isFollowed && (
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  onToggleFollow(safeAuthor.name);
                }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                title="Follow"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
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
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-transform active:scale-90"
              title="Like"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  video.isLiked
                    ? "fill-[#ff2d55] text-[#ff2d55]"
                    : "text-white fill-none stroke-[2]"
                }`}
              />
            </button>
            <span className="text-[12px] font-bold mt-1 text-white drop-shadow">
              {video.likes}
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
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-transform active:scale-90"
              title="Comments"
            >
              <MessageCircle className="w-6 h-6 text-white stroke-[2]" />
            </button>
            <span className="text-[12px] font-bold mt-1 text-white drop-shadow">
              {(video.comments?.length || video.commentsCount || 0) + (video.ownerResponse ? 1 : 0)}
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
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-transform active:scale-90"
              title="Bookmark Place & Video"
            >
              <Bookmark
                className={`w-6 h-6 transition-colors ${
                  video.isBookmarked
                    ? "fill-amber-400 text-amber-400"
                    : "text-white stroke-[2]"
                }`}
              />
            </button>
            <span className="text-[12px] font-bold mt-1 text-white drop-shadow">
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
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-transform active:scale-90"
              title="Share Video Review"
            >
              <Share2 className="w-5 h-5 text-white stroke-[2]" />
            </button>
            <span className="text-[12px] font-bold mt-1 text-white drop-shadow">
              {video.sharesCount}
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
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 hover:scale-105 transition-all active:scale-90 text-white cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
};
