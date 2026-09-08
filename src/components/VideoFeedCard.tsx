import React, { useRef, useState, useEffect, useCallback } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
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
  MapPin,
  RotateCcw,
  RotateCw
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
import { ensureSharedAudioContextUnlocked } from "../hooks/useGlobalMute";

interface VideoFeedCardProps {
  video: VideoReview;
  index: number;
  isActive: boolean;
  isNear: boolean;
  isMuted: boolean;
  isPlaying?: boolean;
  isBuffering?: boolean;
  progressPercent?: number;
  videoDuration?: number;
  isActualMuted?: boolean;
  isManuallyPaused?: boolean;
  hasRenderedFirstFrame?: boolean;
  allUsers?: any[];
  currentUser?: any;
  
  activeSubTab?: FeedSubTab;
  onSelectSubTab?: (tab: FeedSubTab) => void;
  onToggleMute: (e?: React.SyntheticEvent | Event) => void;
  onForceMute?: () => void;
  onTogglePlayPause?: (e?: React.SyntheticEvent | Event) => void;
  onPauseVideo?: () => void;
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
  isSessionAudioUnlocked?: boolean;
  onUnlockAudio?: () => void;
  onRecordView?: (videoId: string) => void;
  unreadCount?: number;
  onScrubStart?: () => void;
  onSeekToPercent?: (percent: number) => void;
  onSeekDelta?: (deltaSeconds: number) => void;
  onScrubEnd?: (percent: number) => void;
}

export const VideoFeedCard: React.FC<VideoFeedCardProps> = ({
  video,
  index,
  isActive,
  isNear,
  isMuted,
  isPlaying = false,
  isBuffering = false,
  progressPercent = 0,
  videoDuration = 0,
  isActualMuted = true,
  isManuallyPaused = false,
  hasRenderedFirstFrame = false,
  allUsers,
  currentUser,
  activeSubTab,
  onSelectSubTab,
  onToggleMute,
  onForceMute,
  onTogglePlayPause,
  onPauseVideo,
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
  slotRef,
  isSessionAudioUnlocked = false,
  onUnlockAudio,
  onRecordView,
  unreadCount = 0,
  onScrubStart,
  onSeekToPercent,
  onSeekDelta,
  onScrubEnd
}) => {
  const { t } = useLanguage();
  const [showHeartAnimation, setShowHeartAnimation] = useState<boolean>(false);
  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastMuteTapTimeRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Jump feedback badge (e.g. -1.5s or +1.5s)
  const [jumpFeedback, setJumpFeedback] = useState<{ type: 'rewind' | 'forward'; text: string } | null>(null);
  const jumpFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerJumpFeedback = useCallback((deltaSeconds: number) => {
    if (jumpFeedbackTimeoutRef.current) {
      clearTimeout(jumpFeedbackTimeoutRef.current);
    }
    const type = deltaSeconds < 0 ? 'rewind' : 'forward';
    const absSec = Math.abs(deltaSeconds);
    const text = `${deltaSeconds < 0 ? '-' : '+'}${absSec}s`;
    setJumpFeedback({ type, text });
    triggerHaptic("medium");
    jumpFeedbackTimeoutRef.current = setTimeout(() => {
      setJumpFeedback(null);
    }, 750);
  }, []);

  // Card horizontal swipe gesture tracking
  const cardTouchStartXRef = useRef<number>(0);
  const cardTouchStartYRef = useRef<number>(0);
  const cardTouchStartTimeRef = useRef<number>(0);
  const isCardHorizontalSwipeRef = useRef<boolean>(false);

  // Video Scrubbing state (supports live seeking, desktop hover preview, and unified mobile touch)
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubPercent, setScrubPercent] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const seekRafRef = useRef<number | null>(null);

  const effectiveDuration = React.useMemo(() => {
    if (videoDuration && !isNaN(videoDuration) && videoDuration > 0) {
      return videoDuration;
    }
    if (video?.durationSeconds && !isNaN(video.durationSeconds) && video.durationSeconds > 0) {
      return video.durationSeconds;
    }
    return 60;
  }, [videoDuration, video?.durationSeconds]);

  const scrubberRectRef = useRef<DOMRect | null>(null);
  const previewVideoRafRef = useRef<number | null>(null);
  const lastHapticSecondRef = useRef<number>(-1);

  const playableSrc = React.useMemo(() => {
    return resolvePlayableVideoSource(video);
  }, [video]);

  const calculatePctFromClientX = useCallback((clientX: number) => {
    let rect = scrubberRectRef.current;
    if (!rect && scrubberRef.current) {
      rect = scrubberRef.current.getBoundingClientRect();
      scrubberRectRef.current = rect;
    }
    if (!rect || rect.width <= 0) return 0;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (offsetX / rect.width) * 100;
  }, []);

  const formatTimeText = useCallback((totalSeconds: number) => {
    const rounded = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(rounded / 60);
    const s = Math.floor(rounded % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const updateSeekPosition = useCallback((pct: number, isFinal: boolean = false) => {
    const clampedPct = Math.max(0, Math.min(100, pct));
    const targetSeconds = (clampedPct / 100) * effectiveDuration;

    // Instant state update for 120fps direct finger tracking
    setScrubPercent(clampedPct);

    // Subtle tactile haptic tick when crossing integer seconds (YouTube / TikTok native feel)
    const currentSec = Math.floor(targetSeconds);
    if (currentSec !== lastHapticSecondRef.current) {
      lastHapticSecondRef.current = currentSec;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(8);
        } catch (e) {}
      }
    }

    // High-speed preview video seeking
    if (previewVideoRef.current) {
      if (previewVideoRafRef.current) {
        cancelAnimationFrame(previewVideoRafRef.current);
      }
      previewVideoRafRef.current = requestAnimationFrame(() => {
        previewVideoRafRef.current = null;
        if (previewVideoRef.current) {
          try {
            if (typeof (previewVideoRef.current as any).fastSeek === "function") {
              (previewVideoRef.current as any).fastSeek(targetSeconds);
            } else if (Math.abs(previewVideoRef.current.currentTime - targetSeconds) > 0.03) {
              previewVideoRef.current.currentTime = targetSeconds;
            }
          } catch (e) {}
        }
      });
    }

    // Live update main video frame during dragging for physical app responsiveness
    if (seekRafRef.current) {
      cancelAnimationFrame(seekRafRef.current);
    }
    seekRafRef.current = requestAnimationFrame(() => {
      seekRafRef.current = null;
      onSeekToPercent?.(clampedPct);
    });

    if (isFinal) {
      scrubberRectRef.current = null;
      lastHapticSecondRef.current = -1;
      if (seekRafRef.current) {
        cancelAnimationFrame(seekRafRef.current);
        seekRafRef.current = null;
      }
      onSeekToPercent?.(clampedPct);
    }
  }, [effectiveDuration, onSeekToPercent]);

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (scrubberRef.current) {
      scrubberRectRef.current = scrubberRef.current.getBoundingClientRect();
    }
    setIsScrubbing(true);
    triggerHaptic("selection");
    onScrubStart?.();

    if ('pointerId' in e) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    const pct = calculatePctFromClientX(e.clientX);
    updateSeekPosition(pct, false);
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      e.stopPropagation();
      const pct = calculatePctFromClientX(e.clientX);
      updateSeekPosition(pct, false);
    } else if (e.pointerType === "mouse") {
      // Desktop hover preview thumbnail
      const pct = calculatePctFromClientX(e.clientX);
      setHoverPercent(pct);
      setIsHovering(true);
      if (previewVideoRef.current) {
        const targetSeconds = (pct / 100) * effectiveDuration;
        try {
          if (Math.abs(previewVideoRef.current.currentTime - targetSeconds) > 0.05) {
            previewVideoRef.current.currentTime = targetSeconds;
          }
        } catch (e) {}
      }
    }
  };

  const handleScrubberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    if ('pointerId' in e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    const pct = calculatePctFromClientX(e.clientX);
    updateSeekPosition(pct, true);
    onScrubEnd?.(pct);
    setIsScrubbing(false);
    setScrubPercent(null);
    scrubberRectRef.current = null;
    lastHapticSecondRef.current = -1;
    triggerHaptic("selection");
  };

  const handleScrubberTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScrubbing) return;
    e.stopPropagation();
    if (e.touches && e.touches[0]) {
      if (scrubberRef.current) {
        scrubberRectRef.current = scrubberRef.current.getBoundingClientRect();
      }
      setIsScrubbing(true);
      triggerHaptic("selection");
      onScrubStart?.();
      const pct = calculatePctFromClientX(e.touches[0].clientX);
      updateSeekPosition(pct, false);
    }
  };

  const handleScrubberTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    if (e.touches && e.touches[0]) {
      const pct = calculatePctFromClientX(e.touches[0].clientX);
      updateSeekPosition(pct, false);
    }
  };

  const handleScrubberTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    const clientX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0;
    const pct = calculatePctFromClientX(clientX);
    updateSeekPosition(pct, true);
    onScrubEnd?.(pct);
    setIsScrubbing(false);
    setScrubPercent(null);
    scrubberRectRef.current = null;
    lastHapticSecondRef.current = -1;
    triggerHaptic("selection");
  };

  const handleScrubberPointerLeave = () => {
    if (!isScrubbing) {
      setIsHovering(false);
      setHoverPercent(null);
      scrubberRectRef.current = null;
    }
  };

  // Global window listeners when scrubbing ensures dragging never drops even when user thumb/mouse moves outside the bar
  useEffect(() => {
    if (!isScrubbing) return;

    const onGlobalMove = (e: PointerEvent) => {
      const pct = calculatePctFromClientX(e.clientX);
      updateSeekPosition(pct, false);
    };

    const onGlobalUp = (e: PointerEvent) => {
      const pct = calculatePctFromClientX(e.clientX);
      updateSeekPosition(pct, true);
      onScrubEnd?.(pct);
      setIsScrubbing(false);
      setScrubPercent(null);
      scrubberRectRef.current = null;
      lastHapticSecondRef.current = -1;
      triggerHaptic("selection");
    };

    const onGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        const pct = calculatePctFromClientX(e.touches[0].clientX);
        updateSeekPosition(pct, false);
      }
    };

    const onGlobalTouchEnd = (e: TouchEvent) => {
      const clientX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0;
      const pct = calculatePctFromClientX(clientX);
      updateSeekPosition(pct, true);
      onScrubEnd?.(pct);
      setIsScrubbing(false);
      setScrubPercent(null);
      scrubberRectRef.current = null;
      lastHapticSecondRef.current = -1;
      triggerHaptic("selection");
    };

    window.addEventListener("pointermove", onGlobalMove, { passive: false });
    window.addEventListener("pointerup", onGlobalUp);
    window.addEventListener("pointercancel", onGlobalUp);
    window.addEventListener("touchmove", onGlobalTouchMove, { passive: false });
    window.addEventListener("touchend", onGlobalTouchEnd);
    window.addEventListener("touchcancel", onGlobalTouchEnd);

    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
      window.removeEventListener("pointercancel", onGlobalUp);
      window.removeEventListener("touchmove", onGlobalTouchMove);
      window.removeEventListener("touchend", onGlobalTouchEnd);
      window.removeEventListener("touchcancel", onGlobalTouchEnd);
    };
  }, [isScrubbing, calculatePctFromClientX, updateSeekPosition, onScrubEnd]);

  // High-fidelity poster URL
  const posterUrl = React.useMemo(() => {
    return resolveVideoPosterUrl(video);
  }, [video]);

  // Keep iOS / Android Lock Screen & Media Controls in sync with rich metadata & app logo artwork
  useEffect(() => {
    if (isActive && typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        const origin = window.location.origin;
        const place = formatBusinessName(video.placeName) || "Business Review";
        const author = video.author?.name || "Verified Reviewer";
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
          onTogglePlayPause?.();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          onTogglePlayPause?.();
        });
      } catch (e) {}
    }
  }, [isActive, video, onTogglePlayPause]);

  // Click card to toggle Play / Pause (Stop / Resume)
  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic("light");
    ensureSharedAudioContextUnlocked();
    onTogglePlayPause?.(e);
  };

  // Sound toggle button - immediately handles user gesture on both touch and click without delay
  const handleToggleMute = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    const now = Date.now();
    // Debounce to prevent duplicate execution when synthetic click follows touchend on mobile
    if (now - lastMuteTapTimeRef.current < 450) return;
    lastMuteTapTimeRef.current = now;

    triggerHaptic("selection");
    ensureSharedAudioContextUnlocked();
    onToggleMute(e);
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
    // Ignore clicks if they originate from interactive controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea') || target.closest('[role="button"]')) {
      return;
    }

    const now = Date.now();
    const diff = now - lastTapTimeRef.current;
    
    if (diff < 340 && diff > 0) {
      // Detected Double Tap! Cancel pending single tap play/pause
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;

      const cardEl = e.currentTarget;
      const rect = cardEl.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;

      if (relativeX < 0.32) {
        // Double tap on left third -> Rewind 1.5s
        onSeekDelta?.(-1.5);
        triggerJumpFeedback(-1.5);
      } else if (relativeX > 0.68) {
        // Double tap on right third -> Forward 1.5s
        onSeekDelta?.(1.5);
        triggerJumpFeedback(1.5);
      } else {
        // Center double tap -> Heart Like
        triggerDoubleTapLike(e.clientX, e.clientY);
      }
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
    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;

    if (relativeX < 0.32) {
      onSeekDelta?.(-1.5);
      triggerJumpFeedback(-1.5);
    } else if (relativeX > 0.68) {
      onSeekDelta?.(1.5);
      triggerJumpFeedback(1.5);
    } else {
      triggerDoubleTapLike(e.clientX, e.clientY);
    }
  };

  const handleCardTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      cardTouchStartXRef.current = e.touches[0].clientX;
      cardTouchStartYRef.current = e.touches[0].clientY;
      cardTouchStartTimeRef.current = Date.now();
      isCardHorizontalSwipeRef.current = false;
    }
  };

  const handleCardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches || !e.touches[0]) return;
    const dx = e.touches[0].clientX - cardTouchStartXRef.current;
    const dy = e.touches[0].clientY - cardTouchStartYRef.current;
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 18) {
      isCardHorizontalSwipeRef.current = true;
    }
  };

  const handleCardTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isCardHorizontalSwipeRef.current && e.changedTouches && e.changedTouches[0]) {
      const dx = e.changedTouches[0].clientX - cardTouchStartXRef.current;
      const elapsed = Date.now() - cardTouchStartTimeRef.current;
      if (Math.abs(dx) > 30 && elapsed < 450) {
        const delta = dx < 0 ? -1.5 : 1.5;
        onSeekDelta?.(delta);
        triggerJumpFeedback(delta);
        isCardHorizontalSwipeRef.current = false;
        return;
      }
    }
    isCardHorizontalSwipeRef.current = false;
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

  const currentScrubPct = Math.min(100, Math.max(0, isScrubbing && scrubPercent !== null ? scrubPercent : (progressPercent || 0)));
  const previewPct = isScrubbing && scrubPercent !== null ? scrubPercent : (isHovering && hoverPercent !== null ? hoverPercent : currentScrubPct);
  const clampedPreviewLeftPct = Math.min(90, Math.max(10, previewPct));
  const activeSeconds = Math.max(0, Math.min(effectiveDuration, (previewPct / 100) * effectiveDuration));
  const scrubTimeText = formatTimeText(activeSeconds);

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
      className="snap-start snap-always shrink-0 relative w-full h-full min-h-full max-h-full md:min-h-0 md:max-h-none md:w-auto md:h-[min(88vh,780px)] md:aspect-[9/16] md:max-w-[min(480px,calc(100vw-120px))] bg-black md:rounded-[24px] overflow-hidden md:shadow-2xl md:border md:border-zinc-800/90 select-none flex flex-col justify-end group"
    >
      {/* Video Container (Host slot for the persistent hardware-accelerated video player) */}
      <div
        id={`video-slot-${video.id}`}
        ref={slotRef}
        data-video-slot="true"
        className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black pointer-events-none"
      >
        {/* High-Fidelity Poster (visible during loading or until active video starts playback) */}
        <img
          src={posterUrl}
          alt={video.caption || formatBusinessName(video.placeName) || "Video review poster"}
          loading={isActive || isNear ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={isActive ? "high" : "auto"}
          className={`w-full h-full object-cover pointer-events-none absolute inset-0 transition-opacity duration-300 z-10 ${
            isActive && (hasRenderedFirstFrame || isPlaying) ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* DEDICATED PLAY/PAUSE INTERACTION LAYER (z-20) */}
      {/* This sits strictly behind all UI buttons (z-40, z-50) so button taps NEVER accidentally pause the video */}
      <div 
        id={`copo-card-tap-overlay-${video.id}`}
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={handleCardClick}
        onDoubleClick={handleDoubleTapLike}
        onTouchStart={handleCardTouchStart}
        onTouchMove={handleCardTouchMove}
        onTouchEnd={handleCardTouchEnd}
        aria-label="Toggle Play/Pause"
      />

      {/* Visual Jump Feedback Overlay (e.g. -1.5s or +1.5s) */}
      {jumpFeedback && (
        <div className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-90 duration-150">
          <div className="px-5 py-3 rounded-full bg-black/85 backdrop-blur-2xl border border-white/40 shadow-2xl flex items-center gap-2.5 text-white">
            {jumpFeedback.type === "rewind" ? (
              <RotateCcw className="w-6 h-6 text-white stroke-[2.5] animate-pulse" />
            ) : (
              <RotateCw className="w-6 h-6 text-white stroke-[2.5] animate-pulse" />
            )}
            <span className="font-extrabold text-base tracking-wide font-mono">
              {jumpFeedback.text}
            </span>
          </div>
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
                onPauseVideo?.();
                onGoBack();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="w-11 h-11 rounded-full bg-black/85 hover:bg-black backdrop-blur-xl border border-white/35 flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl cursor-pointer"
              title={t("common.goBack", "Go back")}
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
                className="relative flex md:hidden w-11 h-11 rounded-full bg-black/85 hover:bg-black active:scale-90 backdrop-blur-2xl border border-white/35 items-center justify-center text-white shadow-2xl transition-all cursor-pointer select-none"
                aria-label={t("nav.openMenu", "Open menu")}
                title={t("nav.openMenu", "Open menu")}
              >
                <Menu className="w-5 h-5 text-white stroke-[2.2]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-black shadow-lg animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )
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
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleToggleMute(e);
            }}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/85 md:hover:bg-black active:scale-90 backdrop-blur-2xl border border-white/35 flex items-center justify-center text-white transition-all cursor-pointer shadow-2xl"
            title={isMuted || !isSessionAudioUnlocked || isActualMuted ? t("video.unmuteSound", "Unmute sound") : t("video.muteSound", "Mute sound")}
            aria-label={isMuted || !isSessionAudioUnlocked || isActualMuted ? t("video.unmuteSound", "Unmute sound") : t("video.muteSound", "Mute sound")}
          >
            {isMuted || !isSessionAudioUnlocked || isActualMuted ? (
              <VolumeX className="w-5 h-5 text-white stroke-[2.2] shrink-0" />
            ) : (
              <Volume2 className="w-5 h-5 text-white stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* Center Video Player Symbol (Natural Play/Pause in the middle of the video) */}
      {isActive && isManuallyPaused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-auto animate-in zoom-in-75 fade-in duration-200">
          <button
            type="button"
            id={`copo-play-center-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause(e);
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 hover:scale-105 transition-all duration-200 relative group shadow-[0_8px_32px_rgba(0,0,0,0.7)] bg-black/60 hover:bg-black/80 backdrop-blur-md border-2 border-white/40 ring-1 ring-white/20"
            aria-label={t("video.playVideo", "Play video")}
            title={t("video.resumeVideo", "Resume Video")}
          >
            <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-white text-white translate-x-1 drop-shadow-md relative z-10" />
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

      {/* Bottom Area: Metadata & Actions Container - sits cleanly above the bottom progress bar on mobile and desktop */}
      <div 
        className="relative z-45 w-full flex items-end justify-between px-3 md:px-4.5 pt-2 pointer-events-none copo-video-bottom-metadata"
      >
        
        {/* Bottom Video Metadata & Place Badge */}
        <footer
          id={`copo-video-bottom-info-${video.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col gap-1.5 pointer-events-auto pr-3 md:pr-4 min-w-0 flex-1"
        >
          <div className="flex flex-col gap-0.5 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPauseVideo?.();
                onOpenCreator(safeAuthor);
              }}
              className="font-extrabold text-white text-[15px] sm:text-[16px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] flex items-center gap-1.5 hover:underline cursor-pointer bg-transparent border-0 p-0 text-left w-fit"
              title={`${t("video.viewProfile", "View Profile")} - ${safeAuthor.name}`}
            >
              <span className="whitespace-nowrap truncate leading-tight">{t("video.by", "By")} {safeAuthor.name}</span>
              {safeAuthor.isVerified && (
                <CheckCircle className="w-4 h-4 fill-white text-black inline shrink-0" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(video.rating)
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "fill-zinc-600/70 text-zinc-200/80"
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
            id={`pill-place-${video.placeId || video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPauseVideo?.();
              const targetPlaceId = video.placeId || video.placeName || video.dishOrItem || video.id;
              onOpenPlace(targetPlaceId);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onPauseVideo?.();
              const targetPlaceId = video.placeId || video.placeName || video.dishOrItem || video.id;
              onOpenPlace(targetPlaceId);
            }}
            className="self-start flex items-center gap-2.5 sm:gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl bg-black/85 hover:bg-black/95 backdrop-blur-2xl border border-white/35 hover:border-white/60 text-white transition-all w-fit max-w-[calc(100%-8px)] sm:max-w-[280px] md:max-w-[320px] text-left group cursor-pointer shadow-2xl active:scale-[0.98]"
          >
            <CopoBrandLogo
              domain={extractCleanDomain(video.placeWebsite || video.placeId || video.placeName)}
              name={formatBusinessName(video?.placeName || video?.dishOrItem || video?.placeId) || t("common.businessPlace", "Business Place")}
              website={video.placeWebsite}
              logoUrl={businessLogoUrl || video?.placeLogoUrl}
              bannerUrl={businessBannerUrl || video.placeBannerUrl}
              loading={isActive || isNear ? "eager" : "lazy"}
              fetchPriority={isActive ? "high" : "auto"}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-black/10 overflow-hidden flex items-center justify-center shrink-0 p-1 sm:p-1.5 shadow-md group-hover:scale-105 transition-transform ring-1 ring-white/20"
              imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast]"
              fallbackTextClassName="font-extrabold text-xs text-zinc-900"
            />
            <div className="min-w-0 flex-1 py-0.5">
              <span className="line-clamp-2 [overflow-wrap:anywhere] leading-snug font-extrabold text-[13px] sm:text-[14px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] group-hover:text-white transition-colors">
                {formatBusinessName(video?.placeName || video?.dishOrItem || video?.placeId) || t("common.businessPlace", "Business Place")}
                <CheckCircle className="inline-block w-3.5 h-3.5 ml-1 align-text-bottom fill-white text-black shrink-0 relative -top-[1px] drop-shadow-sm" />
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/80 stroke-[2.5] shrink-0 ml-0.5 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
          </button>
        </footer>

        {/* Right Side Action Column */}
        <aside
          id={`copo-video-actions-col-${video.id}`}
          onClick={(e) => e.stopPropagation()}
          className="relative z-50 flex flex-col items-center gap-2.5 sm:gap-3 text-white pointer-events-auto shrink-0 mb-1 sm:mb-2"
        >
          {/* Creator Avatar */}
          <div className="relative group/avatar mb-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPauseVideo?.();
                onOpenCreator(safeAuthor);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 border-2 border-white/70 hover:border-white overflow-hidden bg-black transition-colors cursor-pointer shadow-xl"
              title={`${t("video.viewProfile", "View Profile")} - ${safeAuthor.name}`}
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
                title={t("video.follow", "Follow")}
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
              title={t("video.like", "Like")}
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
              title={t("video.comments", "Comments")}
            >
              <MessageCircle className="w-6 h-6 text-white stroke-[2.2]" />
            </button>
            <span className="text-[12px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {(video.commentsCount || video.comments?.length || 0) + (video.ownerResponse ? 1 : 0)}
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
              title={t("video.shareVideoReview", "Share Video Review")}
            >
              <Share2 className="w-6 h-6 text-white stroke-[2.2]" />
            </button>
            <span className="text-[12px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {video.sharesCount || video.shares || 0}
            </span>
          </div>

          {/* More Options */}
          <div className="flex flex-col items-center relative z-50 pointer-events-auto">
            <button
              id={`btn-more-options-${video.id}`}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic("light");
                onOpenMoreMenu(video);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.stopPropagation();
                triggerHaptic("light");
                onOpenMoreMenu(video);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 backdrop-blur-xl border border-white/30 hover:border-white/60 hover:bg-black/85 flex items-center justify-center hover:scale-105 transition-all active:scale-90 text-white cursor-pointer shadow-xl relative z-50 pointer-events-auto"
              title={t("video.moreOptions", "More options")}
            >
              <MoreHorizontal className="w-6 h-6 stroke-[2.5] text-white" />
            </button>
          </div>
        </aside>
      </div>

      {/* Interactive Video Progress Bar (Ultra-thin hairline YouTube Shorts / TikTok style) */}
      {isActive && (
        <div
          ref={scrubberRef}
          onPointerDown={handleScrubberPointerDown}
          onPointerMove={handleScrubberPointerMove}
          onPointerUp={handleScrubberPointerUp}
          onPointerCancel={handleScrubberPointerUp}
          onPointerLeave={handleScrubberPointerLeave}
          onTouchStart={handleScrubberTouchStart}
          onTouchMove={handleScrubberTouchMove}
          onTouchEnd={handleScrubberTouchEnd}
          onTouchCancel={handleScrubberTouchEnd}
          onClick={(e) => {
            e.stopPropagation();
            const pct = calculatePctFromClientX(e.clientX);
            updateSeekPosition(pct, true);
            onScrubEnd?.(pct);
          }}
          className="copo-video-scrubber-position absolute left-0 right-0 z-40 h-9 sm:h-10 flex items-end pb-1 cursor-pointer select-none px-0 group touch-none"
        >
          {/* YouTube Shorts / TikTok Style Compact Floating Thumbnail Frame Preview */}
          {(isScrubbing || isHovering) && (
            <div 
              className="absolute bottom-6 sm:bottom-7 flex flex-col items-center pointer-events-none drop-shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{ 
                left: `${clampedPreviewLeftPct}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {/* Compact 9:16 Vertical Miniature Video Frame Preview Card */}
              <div className="w-[58px] h-[103px] sm:w-[66px] sm:h-[118px] rounded-xl bg-black border border-white/90 shadow-[0_8px_28px_rgba(0,0,0,0.9)] overflow-hidden relative ring-1 ring-black/60 flex items-center justify-center">
                {/* Fallback Poster Image */}
                <img
                  src={posterUrl}
                  alt="Preview frame"
                  className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                />
                {/* Live Frame Preview Video Element */}
                <video
                  ref={previewVideoRef}
                  src={playableSrc}
                  preload="auto"
                  muted
                  playsInline
                  className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>

              {/* Floating High-Contrast Time Pill Badge */}
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 shadow-md">
                <span className="text-white text-[11px] sm:text-xs font-semibold font-mono tracking-wider select-none">
                  {scrubTimeText}
                </span>
              </div>
            </div>
          )}

          {/* Background Track - Expands smoothly from 2px hairline to 5px/6px tactile bar on touch/hover */}
          <div 
            className={`w-full relative transition-all duration-150 ease-out ${
              isScrubbing || isHovering 
                ? 'h-[5px] sm:h-[6px] bg-white/35 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.25)]' 
                : 'h-[2px] bg-white/25'
            }`}
          >
            {/* Filled Progress Track */}
            <div
              className={`h-full bg-white relative ${
                isScrubbing ? 'transition-none' : 'transition-[width] duration-100 ease-out'
              } ${isScrubbing || isHovering ? 'rounded-full' : ''}`}
              style={{ 
                width: `${currentScrubPct}%`,
                opacity: isScrubbing || isHovering ? 1 : 0.9
              }}
            >
              {/* Scrubbing Handle Dot / Thumb - Tactile white circle appearing instantly under finger/cursor */}
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white transition-transform duration-100 ${
                  isScrubbing || isHovering
                    ? "w-4 h-4 sm:w-4.5 sm:h-4.5 scale-100 opacity-100 shadow-[0_2px_8px_rgba(0,0,0,0.85)] ring-2 ring-black/40"
                    : "w-1 h-1 scale-0 opacity-0 pointer-events-none"
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
