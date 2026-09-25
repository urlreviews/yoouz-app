import React, { useRef, useState, useEffect, useCallback } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
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
  RotateCw,
  CornerDownLeft,
  ShieldCheck,
  X
} from "lucide-react";
import { VideoReview, VideoAuthor, FeedSubTab, Place } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { formatBusinessName, resolveSafeAuthor, extractCleanDomain, getSafeAvatarUrl, getDisplayUrlAsDomain, getPlaceSlug, isPlaceReviewMatch } from "../utils/placeUtils";
import { getProxiedImageUrl } from "../utils/logoUtils";
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
  places?: Place[];
  allVideos?: VideoReview[];
  
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
  onToggleRepost?: (videoId: string) => void;
  onOpenMenu?: () => void;
  onGoBack?: () => void;
  feedContextTitle?: string;
  onGoHome?: () => void;
  businessName?: string | null;
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
  forceShowMenu?: boolean;
  isEmbed?: boolean;
  isBusinessOwnerView?: boolean;
  onOpenOwnerReply?: (video: VideoReview) => void;
  onCloseEmbed?: () => void;
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
  places,
  allVideos,
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
  onToggleRepost,
  onOpenMenu,
  onGoBack,
  feedContextTitle,
  businessName,
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
  onScrubEnd,
  forceShowMenu = false,
  isEmbed = false,
  isBusinessOwnerView = false,
  onOpenOwnerReply,
  onCloseEmbed
}) => {
  const { t } = useLanguage();

  const { effectiveReviewCount, effectiveRating } = React.useMemo(() => {
    let count = 1;
    let ratingVal = Number(video.rating) || 5.0;

    // 1. Calculate exact count and average rating from allVideos feed if available
    if (allVideos && allVideos.length > 0) {
      const matches = allVideos.filter(v => {
        if (!v) return false;
        return isPlaceReviewMatch(v, {
          id: video.placeId,
          name: video.placeName,
          website: video.placeWebsite
        });
      });
      if (matches.length > 0) {
        count = matches.length;
        const totalRating = matches.reduce((acc, curr) => acc + (Number(curr.rating) || 5.0), 0);
        ratingVal = totalRating / matches.length;
        return {
          effectiveReviewCount: count,
          effectiveRating: ratingVal.toFixed(1)
        };
      }
    }

    // 2. Fall back to video's own review count / matched place info
    const vCount = Number((video as any).reviewsCount || (video as any).reviewCount || (video as any).totalReviews || 0);
    if (vCount > 0) count = vCount;

    if (places && places.length > 0) {
      const matchedPlace = places.find(p => isPlaceReviewMatch(video, p));
      if (matchedPlace) {
        const pCount = Number(matchedPlace.videoReviewCount || matchedPlace.totalReviews || 0);
        if (pCount > 0 && count === 1) count = pCount;
        if (matchedPlace.rating) ratingVal = Number(matchedPlace.rating) || ratingVal;
      }
    }

    return {
      effectiveReviewCount: count,
      effectiveRating: ratingVal.toFixed(1)
    };
  }, [video, places, allVideos]);
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

  // Video Scrubbing state (supports live seeking, desktop hover preview, and unified mobile touch)
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubPercent, setScrubPercent] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
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

  // Record view when active and playing for at least 1s
  useEffect(() => {
    if (isActive && isPlaying && video?.id) {
      const timer = setTimeout(() => {
        onRecordView?.(video.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, isPlaying, video?.id, onRecordView]);

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
      // Desktop hover preview timestamp
      const pct = calculatePctFromClientX(e.clientX);
      setHoverPercent(pct);
      setIsHovering(true);
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

  // High-fidelity poster URL with graceful fallback
  const [posterLoadError, setPosterLoadError] = useState(false);
  const posterUrl = React.useMemo(() => {
    if (posterLoadError) {
      return getProxiedImageUrl(video.placeBannerUrl || video.placeLogoUrl || "");
    }
    const rawPoster = resolveVideoPosterUrl(video) || video.placeBannerUrl || video.placeLogoUrl || "";
    return getProxiedImageUrl(rawPoster);
  }, [video, posterLoadError]);

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
      className={`snap-start snap-always shrink-0 relative bg-black select-none flex flex-col justify-end group overflow-hidden ${
        isEmbed
          ? "w-auto h-full max-h-full aspect-[9/16] max-w-[min(460px,100%)] rounded-[24px] shadow-2xl border border-zinc-800/90 mx-auto"
          : "w-full h-full min-h-full max-h-full md:min-h-0 md:max-h-none md:w-auto md:h-[min(88vh,780px)] md:aspect-[9/16] md:max-w-[min(480px,calc(100vw-120px))] md:rounded-[24px] md:shadow-2xl md:border md:border-zinc-800/90"
      }`}
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
          onError={() => setPosterLoadError(true)}
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
        className="absolute inset-0 z-20 cursor-pointer touch-manipulation select-none"
        onClick={handleCardClick}
        onDoubleClick={handleDoubleTapLike}
        aria-label="Toggle Play/Pause"
      />

      {/* Scrubbing Centered HUD */}
      {isScrubbing && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="px-6 py-3.5 rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex flex-col items-center gap-1.5 text-white">
            <div className="flex items-baseline gap-2 font-mono">
              <span className="font-black text-3xl sm:text-4xl tracking-tight text-white drop-shadow-md">
                {scrubTimeText}
              </span>
              <span className="text-white/60 text-lg sm:text-xl font-semibold">
                / {formatTimeText(effectiveDuration)}
              </span>
            </div>
            <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-none"
                style={{ width: `${currentScrubPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

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
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 md:px-4 pt-3.5 md:pt-4 pointer-events-none"
      >
        {/* Left side: Navigation / Menu + Top Business Badge */}
        <div className="pointer-events-auto flex items-center gap-2 max-w-[calc(100%-60px)]">
          {(onGoBack || onCloseEmbed || isEmbed) && (
            <button
              type="button"
              id={`btn-feed-back-${video.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPauseVideo?.();

                // 1. Post message to host window if inside an iframe
                try {
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: "YOOUZ_EMBED_CLOSE", action: "close" }, "*");
                    window.parent.postMessage({ type: "YOOUZ_CLOSE_MODAL", action: "close" }, "*");
                    window.parent.postMessage("yoouz_close", "*");
                  }
                } catch (err) {}

                // 2. Invoke React onCloseEmbed / onGoBack if passed
                if (onCloseEmbed) {
                  onCloseEmbed();
                } else if (onGoBack) {
                  onGoBack();
                } else {
                  // 3. Fallback: Check for external referrer or clean URL replace
                  if (document.referrer && !document.referrer.includes(window.location.host)) {
                    window.location.href = document.referrer;
                  } else {
                    try {
                      window.history.replaceState(null, "", "/");
                    } catch (err) {}
                    if (window.history && window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.location.href = "/";
                    }
                  }
                }
              }}
              className="w-10 h-10 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl cursor-pointer shrink-0"
              title={t("common.goBack", "Go back")}
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {onOpenMenu && (
            <button
              type="button"
              id={`btn-mobile-menu-${video.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenMenu();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className={`relative flex ${forceShowMenu ? '' : 'md:hidden'} w-10 h-10 rounded-full bg-black/65 hover:bg-black/90 active:scale-90 backdrop-blur-2xl border border-white/20 items-center justify-center text-white shadow-xl transition-all cursor-pointer select-none shrink-0`}
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
          )}

          {/* Top Business Header Badge */}
          <button
            id={`pill-top-place-${video.placeId || video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPauseVideo?.();
              const targetPlaceId = extractCleanDomain(video.placeWebsite || video.placeId) || video.placeId || video.placeName || video.id;
              onOpenPlace(targetPlaceId);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onPauseVideo?.();
              const targetPlaceId = extractCleanDomain(video.placeWebsite || video.placeId) || video.placeId || video.placeName || video.id;
              onOpenPlace(targetPlaceId);
            }}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl sm:rounded-3xl bg-black/75 hover:bg-black/90 backdrop-blur-2xl border border-white/20 hover:border-white/40 text-white transition-all max-w-[300px] sm:max-w-[380px] md:max-w-[440px] text-left cursor-pointer shadow-2xl active:scale-[0.98] min-w-0 outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent] no-underline"
          >
            {(() => {
              const cardDom = extractCleanDomain(video.placeWebsite || video.placeId || video.placeName);
              const cardName = businessName || formatBusinessName(video?.businessName || video?.placeName || video?.dishOrItem || video?.placeId, cardDom) || t("common.businessPlace", "Business Place");
              return (
                <>
                  <CopoBrandLogo
                    domain={cardDom}
                    name={cardName}
                    website={video.placeWebsite}
                    logoUrl={businessLogoUrl || video?.placeLogoUrl}
                    bannerUrl={businessBannerUrl || video.placeBannerUrl}
                    loading={isActive || isNear ? "eager" : "lazy"}
                    fetchPriority={isActive ? "high" : "auto"}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-white/25 overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-md self-center"
                    imageClassName="w-full h-full object-contain rounded-lg"
                    fallbackTextClassName="font-extrabold text-[11px] text-zinc-950"
                  />
                  <div className="min-w-0 flex-1 py-0.5">
                    <span className="flex items-center gap-1 leading-snug font-black text-[12.5px] sm:text-[13.5px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-2 [overflow-wrap:anywhere]">
                      <span className="line-clamp-2 [overflow-wrap:anywhere]">{cardName}</span>
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-black shrink-0 inline-block align-text-top ml-0.5" />
                    </span>
                    {!isEmbed && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-extrabold leading-none mt-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{effectiveRating}</span>
                        <span className="text-zinc-300 font-normal">({effectiveReviewCount} {effectiveReviewCount === 1 ? t("common.review", "review") : t("common.reviews", "reviews")})</span>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </button>
        </div>

        {/* Right side: Sound Mute / Unmute Toggle Button */}
        <div className="pointer-events-auto flex items-center gap-2">
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
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/65 hover:bg-black/90 active:scale-90 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-xl"
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
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 hover:scale-105 transition-all duration-200 relative group shadow-2xl bg-black/50 hover:bg-black/75 backdrop-blur-xl border border-white/20"
            aria-label={t("video.playVideo", "Play video")}
            title={t("video.resumeVideo", "Resume Video")}
          >
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white translate-x-0.5 drop-shadow-md relative z-10" />
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
        className={`relative z-45 w-full flex items-end justify-between px-3 md:px-4.5 pt-2 pointer-events-none copo-video-bottom-metadata transition-opacity duration-200 select-none ${
          isScrubbing ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        
        {/* Bottom Video Metadata */}
        <footer
          id={`copo-video-bottom-info-${video.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col gap-1.5 pointer-events-auto pr-3 md:pr-4 min-w-0 flex-1 mb-1 sm:mb-2"
        >
          <div className="flex flex-col gap-1 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPauseVideo?.();
                onOpenCreator(safeAuthor);
              }}
              className="font-extrabold text-white text-[15px] sm:text-[16px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] flex items-center gap-1.5 no-underline hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer bg-transparent border-0 p-0 text-left w-fit outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent]"
              title={`${t("video.viewProfile", "View Profile")} - ${safeAuthor.name}`}
            >
              <span className="whitespace-nowrap truncate leading-tight no-underline">{t("video.by", "By")} {safeAuthor.name}</span>
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
                      i < Math.round(video.rating || 5)
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "fill-zinc-600/70 text-zinc-200/80"
                    }`}
                  />
                ))}
              </div>
              {(video.recordedAt || video.createdAtMs) && (
                <span className="text-white/90 text-[11.5px] font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/80 shrink-0" />
                  <span>{formatRecordedDate(video.recordedAt, video.createdAtMs)}</span>
                </span>
              )}
            </div>

            {video.caption && video.caption.trim().length > 0 && (
              <p className="text-white/95 text-xs font-medium line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5">
                {(() => {
                  let trimmed = video.caption.trim();
                  trimmed = trimmed.replace(/rev\d+[a-z0-9]*(\.com)?/gi, "yoouz.com").replace(/rev[0-9a-f]{8,}(\.com)?/gi, "yoouz.com");
                  if (/^video review (for|of)\b/i.test(trimmed)) {
                    const cleanDomain = getDisplayUrlAsDomain(video);
                    return `Video review for ${cleanDomain}`;
                  }
                  return trimmed;
                })()}
              </p>
            )}

          </div>
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
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 border border-white/30 hover:border-white/60 active:scale-95 overflow-hidden bg-black transition-all cursor-pointer shadow-xl outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none [-webkit-tap-highlight-color:transparent]"
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
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:border-white/50 hover:bg-black/75 flex items-center justify-center transition-all active:scale-90 shadow-lg"
              title={t("video.like", "Like")}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  video.isLiked
                    ? "fill-[#ff2d55] text-[#ff2d55] drop-shadow-sm"
                    : "text-white fill-none stroke-[2]"
                }`}
              />
            </button>
            <span className="text-[11.5px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {Math.max(
                typeof video.likes === 'number' ? video.likes : (video.likesCount || 0),
                video.isLiked ? 1 : 0
              )}
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
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:border-white/50 hover:bg-black/75 flex items-center justify-center transition-all active:scale-90 shadow-lg"
              title={t("video.comments", "Comments")}
            >
              <MessageCircle className="w-5 h-5 text-white stroke-[2]" />
            </button>
            <span className="text-[11.5px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {typeof video.commentsCount === 'number' ? video.commentsCount : ((video.comments?.length || 0) + (video.ownerResponse && !(video.comments || []).some(c => c.isOwner || c.id?.startsWith("owner_comm_")) ? 1 : 0))}
            </span>
          </div>

          {/* Save / Bookmark */}
          <div className="flex flex-col items-center">
            <button
              id={`btn-bookmark-${video.id}`}
              onClick={() => {
                triggerHaptic(video.isBookmarked ? "selection" : "medium");
                onToggleBookmark(video.id);
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:border-white/50 hover:bg-black/75 flex items-center justify-center transition-all active:scale-90 shadow-lg"
              title={t("video.save", "Save Review")}
            >
              <Bookmark
                className={`w-5 h-5 transition-colors ${
                  video.isBookmarked
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "text-white fill-none stroke-[2]"
                }`}
              />
            </button>
            <span className="text-[11.5px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
              {Math.max(
                typeof video.bookmarksCount === 'number' ? video.bookmarksCount : 0,
                typeof (video as any).bookmarks === 'number' ? (video as any).bookmarks : 0,
                video.isBookmarked ? 1 : 0
              )}
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
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:border-white/50 hover:bg-black/75 flex items-center justify-center transition-all active:scale-90 shadow-lg"
              title={t("video.shareVideoReview", "Share Video Review")}
            >
              <Share2 className="w-5 h-5 text-white stroke-[2]" />
            </button>
            <span className="text-[11.5px] font-extrabold mt-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
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
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:border-white/50 hover:bg-black/75 flex items-center justify-center hover:scale-105 transition-all active:scale-90 text-white cursor-pointer shadow-lg relative z-50 pointer-events-auto"
              title={t("video.moreOptions", "More options")}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2] text-white" />
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
          {/* Desktop Hover Floating Time Badge */}
          {isHovering && !isScrubbing && (
            <div 
              className="absolute bottom-6 sm:bottom-7 flex flex-col items-center pointer-events-none drop-shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{ 
                left: `${clampedPreviewLeftPct}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="px-2.5 py-1 rounded-full bg-black/90 backdrop-blur-md border border-white/30 shadow-lg">
                <span className="text-white text-xs font-bold font-mono tracking-wider select-none">
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
