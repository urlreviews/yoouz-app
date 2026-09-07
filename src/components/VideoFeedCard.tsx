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
  onSeekToPercent?: (percent: number) => void;
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
  onSeekToPercent
}) => {
  const { t } = useLanguage();
  const [showHeartAnimation, setShowHeartAnimation] = useState<boolean>(false);
  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastMuteTapTimeRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video Scrubbing state
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubPercent, setScrubPercent] = useState<number | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  const calculatePctFromClientX = (clientX: number) => {
    if (!scrubberRef.current) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (offsetX / rect.width) * 100;
  };

  const handleScrubberSeek = (clientX: number) => {
    const pct = calculatePctFromClientX(clientX);
    setScrubPercent(pct);
    if (onSeekToPercent) {
      onSeekToPercent(pct);
    }
  };

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsScrubbing(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    handleScrubberSeek(e.clientX);
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    handleScrubberSeek(e.clientX);
  };

  const handleScrubberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    setIsScrubbing(false);
    setScrubPercent(null);
  };

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
      className="snap-start snap-always shrink-0 relative w-full h-full md:w-auto md:h-[min(88vh,780px)] md:aspect-[9/16] md:max-w-[min(480px,calc(100vw-120px))] bg-black md:rounded-[24px] overflow-hidden md:shadow-2xl md:border md:border-zinc-800/90 select-none flex flex-col justify-end group"
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
        aria-label="Toggle Play/Pause"
      />

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

      {/* Bottom Area: Metadata & Actions Container - sits cleanly near bottom on desktop and comfortably above bottom nav on mobile */}
      <div 
        className="relative z-30 w-full flex items-end justify-between px-3 md:px-4.5 pt-2 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+38px)] md:pb-4"
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
            id={`pill-place-${video.placeId}`}
            onClick={(e) => {
              e.stopPropagation();
              onPauseVideo?.();
              onOpenPlace(video.placeId);
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
          className="flex flex-col items-center gap-2.5 sm:gap-3 text-white pointer-events-auto shrink-0 mb-0"
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
          <div className="flex flex-col items-center">
            <button
              id={`btn-more-options-${video.id}`}
              onClick={() => {
                triggerHaptic("light");
                onOpenMoreMenu(video);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 backdrop-blur-xl border border-white/30 hover:border-white/60 hover:bg-black/85 flex items-center justify-center hover:scale-105 transition-all active:scale-90 text-white cursor-pointer shadow-xl"
              title={t("video.moreOptions", "More options")}
            >
              <MoreHorizontal className="w-6 h-6 stroke-[2.5] text-white" />
            </button>
          </div>
        </aside>
      </div>

      {/* Interactive Video Progress Bar (Bottom edge, scrubbable left/right) */}
      {isActive && (
        <div
          ref={scrubberRef}
          onPointerDown={handleScrubberPointerDown}
          onPointerMove={handleScrubberPointerMove}
          onPointerUp={handleScrubberPointerUp}
          onPointerCancel={handleScrubberPointerUp}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 z-50 h-5 flex items-end cursor-pointer group pointer-events-auto touch-none select-none pb-0.5 px-0.5"
          title={t("video.scrubVideo", "Drag or tap to seek video")}
          aria-label={t("video.scrubVideo", "Drag or tap to seek video")}
        >
          {/* Background Track */}
          <div className="w-full h-1 group-hover:h-2 group-active:h-2 bg-white/25 transition-all duration-150 relative rounded-full overflow-hidden">
            {/* Filled Progress Track */}
            <div
              className="h-full bg-white transition-[width] duration-75 ease-out shadow-[0_0_10px_rgba(255,255,255,0.9)] relative"
              style={{
                width: `${Math.min(100, Math.max(0, isScrubbing && scrubPercent !== null ? scrubPercent : progressPercent))}%`
              }}
            >
              {/* Scrubbing Handle Dot */}
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-black/20 transition-transform ${
                  isScrubbing ? "scale-125 bg-red-500 ring-2 ring-white" : "scale-100 group-hover:scale-110"
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
