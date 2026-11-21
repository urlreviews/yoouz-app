import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug, formatBusinessName, extractCleanDomain, resolveSafeAuthor, getSafeAvatarUrl, getDisplayUrlAsDomain } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { getProxiedImageUrl } from "../utils/logoUtils";
import { isPhotoReview } from "../utils/videoUtils";
import { Star, Play, Pause, CheckCircle, ChevronLeft, ChevronRight, Volume2, VolumeX, Globe, Clock, Camera, Sparkles, Lock } from "lucide-react";
import { formatRecordedDate } from "../utils/dateUtils";
import { CopoStarRating, getRoundedRating } from "./CopoStarRating";

export interface CopoEmbedViewProps {
  embedId?: string | null;
  places: Place[];
  videos: VideoReview[];
  currentUser: UserProfile | null;
  allUsers?: any[];
  onOpenComments?: (video: VideoReview) => void;
  onOpenShare?: (video: VideoReview) => void;
  onOpenPlace?: (placeId: string) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  onToggleLike?: (videoId: string) => void;
  onToggleBookmark?: (videoId: string) => void;
  onToggleFollow?: (handle: string) => void;
  onOpenReport?: (video: VideoReview) => void;
  onRecordReview?: (place?: Place) => void;
  onOpenAuth?: () => void;
  onOpenMenu?: () => void;
  onOpenSearch?: () => void;
  onSelectSection?: (section: NavSection) => void;
  unreadNotifsCount?: number;
  unreadMessagesCount?: number;
  onCloseEmbed?: () => void;
  forcePreview?: boolean;
}

export const CopoEmbedView: React.FC<CopoEmbedViewProps> = ({
  embedId,
  places,
  videos,
  currentUser,
  allUsers = [],
  onOpenComments: _onOpenComments,
  onOpenShare: _onOpenShare,
  onOpenPlace,
  onOpenCreator,
  onToggleLike: _onToggleLike,
  onToggleBookmark: _onToggleBookmark,
  onToggleFollow: _onToggleFollow,
  onOpenReport: _onOpenReport,
  onRecordReview,
  onOpenAuth: _onOpenAuth,
  onOpenMenu: _onOpenMenu,
  onOpenSearch: _onOpenSearch,
  onSelectSection: _onSelectSection,
  unreadNotifsCount: _unreadNotifsCount = 0,
  unreadMessagesCount: _unreadMessagesCount = 0,
  onCloseEmbed: _onCloseEmbed,
  forcePreview = false
}) => {
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isVideoPaused, setIsVideoPaused] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragDistanceRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  // Stop and silence video playback immediately upon transfer/navigation
  const handleStopVideo = useCallback(() => {
    setIsVideoPaused(true);
    setPlayingVideoId(null);
    setIsMuted(true);
    if (videoElementRef.current) {
      try {
        videoElementRef.current.pause();
        videoElementRef.current.muted = true;
      } catch {
        // ignore
      }
    }
    try {
      document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
        try {
          v.pause();
          v.muted = true;
        } catch {}
      });
    } catch {}
  }, []);

  // When window loses focus or page is hidden (e.g. transferred to our website or opened new tab), stop video
  useEffect(() => {
    const handlePause = () => {
      handleStopVideo();
    };
    window.addEventListener("blur", handlePause);
    window.addEventListener("pagehide", handlePause);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleStopVideo();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", handlePause);
      window.removeEventListener("pagehide", handlePause);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleStopVideo]);

  // Normalize embed ID / slug
  let cleanSlug = (embedId || "yoouz.com").toLowerCase().trim();
  if (cleanSlug.includes("place-custom") || cleanSlug.includes("yoouz")) {
    cleanSlug = "yoouz.com";
  }

  // Resolve target place
  const targetPlace: Place = useMemo(() => {
    const found = places.find((p) => {
      const pSlug = getPlaceSlug(p);
      return (
        pSlug === cleanSlug ||
        p.id === cleanSlug ||
        (p.name ? p.name.toLowerCase().trim() === cleanSlug : false) ||
        (p.website && getPlaceSlug(p.website) === cleanSlug) ||
        (p.brandDomain && extractCleanDomain(p.brandDomain) === cleanSlug)
      );
    });

    if (found) return found;

    // Check if any matching video in database has place info
    const sampleVideo = videos.find((v) => {
      if (!v) return false;
      const vSlug = getPlaceSlug(v.placeId || v.placeName);
      return (
        vSlug === cleanSlug ||
        v.placeId === cleanSlug ||
        (v.placeName && v.placeName.toLowerCase().trim() === cleanSlug) ||
        (v.placeWebsite && extractCleanDomain(v.placeWebsite) === cleanSlug)
      );
    });

    const isYoouz = cleanSlug === "yoouz.com" || cleanSlug === "yoouz";
    const derivedName = sampleVideo?.placeName || (isYoouz ? "Yoouz" : formatBusinessName(cleanSlug));
    const derivedWebsite = sampleVideo?.placeWebsite || (isYoouz ? "https://yoouz.com" : (cleanSlug.includes(".") ? `https://${cleanSlug}` : undefined));
    const derivedLogo = isYoouz ? "/favicon.svg" : (sampleVideo?.placeLogoUrl || undefined);

    return {
      id: isYoouz ? "yoouz.com" : cleanSlug,
      name: derivedName,
      rating: sampleVideo?.rating || 5.0,
      totalReviews: 1,
      website: derivedWebsite,
      logoUrl: derivedLogo,
      isClaimed: true
    } as Place;
  }, [places, cleanSlug, videos]);

  // Check if we are in preview mode inside the dashboard
  const isPreviewMode = useMemo(() => {
    if (forcePreview) return true;
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("preview") === "true";
  }, [forcePreview]);

  const isPlacePremium = useMemo(() => {
    if (!targetPlace) return false;
    const planStr = ((targetPlace as any).plan || (targetPlace as any).subscriptionPlan || '').toLowerCase();
    if (planStr === 'free') return false;
    if ((targetPlace as any).isPremium === false && (targetPlace as any).isPremiumPlan === false) return false;
    return Boolean(
      (targetPlace as any).isPremium === true ||
      planStr === 'premium' ||
      (targetPlace as any).isPremiumPlan === true
    );
  }, [targetPlace]);

  // Filter videos belonging strictly to this business / place
  const matchingVideos: VideoReview[] = useMemo(() => {
    const matched = videos.filter((v) => {
      if (!v) return false;
      if (cleanSlug === "yoouz.com" || cleanSlug === "yoouz") {
        return (
          v.placeId === "yoouz.com" ||
          v.placeId === "place-custom-yoouz-com" ||
          v.placeId === "place-custom" ||
          (v.placeName && v.placeName.toLowerCase().includes("yoouz"))
        );
      }
      const vSlug = getPlaceSlug(v.placeId || v.placeName);
      return (
        vSlug === cleanSlug ||
        v.placeId === cleanSlug ||
        (v.placeName && v.placeName.toLowerCase().trim() === cleanSlug) ||
        (v.placeWebsite && extractCleanDomain(v.placeWebsite) === cleanSlug)
      );
    });

    // Option A: Strictly match venue reviews. Never fall back to other venues' videos!
    return matched;
  }, [videos, cleanSlug]);

  const hasReviews = matchingVideos.length > 0;
  // Display list (supports 1, 2, 10, 100, 1000 reviews)
  const displayVideos = matchingVideos;
  const totalCount = displayVideos.length;
  const safeActiveIndex = Math.min(pageIndex, Math.max(0, totalCount - 1));

  const handlePrevVideo = useCallback(() => {
    setPageIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1));
    setPlayingVideoId(null);
    setIsVideoPaused(false);
    if (videoElementRef.current) {
      try {
        videoElementRef.current.pause();
      } catch {}
    }
  }, [totalCount]);

  const handleNextVideo = useCallback(() => {
    setPageIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
    setPlayingVideoId(null);
    setIsVideoPaused(false);
    if (videoElementRef.current) {
      try {
        videoElementRef.current.pause();
      } catch {}
    }
  }, [totalCount]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevVideo();
      } else if (e.key === "ArrowRight") {
        handleNextVideo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevVideo, handleNextVideo]);

  // Mobile Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (diff > 35) {
      handleNextVideo();
    } else if (diff < -35) {
      handlePrevVideo();
    }
    touchStartXRef.current = null;
  };

  // Desktop Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartXRef.current === null) return;
    dragDistanceRef.current = e.clientX - dragStartXRef.current;
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartXRef.current !== null) {
      if (dragDistanceRef.current < -35) {
        handleNextVideo();
      } else if (dragDistanceRef.current > 35) {
        handlePrevVideo();
      }
    }
    setIsDragging(false);
    dragStartXRef.current = null;
  };

  const handleCardClick = (video: VideoReview, index: number) => {
    if (Math.abs(dragDistanceRef.current) > 10) return; // Ignore drag release clicks

    // If clicking a side card, slide it into the center
    if (index !== safeActiveIndex) {
      setPageIndex(index);
      setPlayingVideoId(null);
      setIsVideoPaused(false);
      return;
    }

    // Toggle play/pause for active center card
    if (playingVideoId === video.id) {
      setIsVideoPaused((prev) => !prev);
    } else {
      setPlayingVideoId(video.id);
      setIsVideoPaused(false);
    }
  };

  // Calculate overall rating score
  const overallRating = useMemo(() => {
    if (displayVideos.length > 0) {
      const sum = displayVideos.reduce((acc, v) => acc + (v.rating || 5), 0);
      return Number((sum / displayVideos.length).toFixed(1));
    }
    return targetPlace.rating || 5.0;
  }, [displayVideos, targetPlace]);

  const totalReviewsCount = Math.max(displayVideos.length, targetPlace.totalReviews || 0);
  const displayDomain = extractCleanDomain(targetPlace.website || targetPlace.id || cleanSlug) || cleanSlug;
  const displayBusinessName = targetPlace.name || formatBusinessName(cleanSlug);

  const currentVideo = displayVideos[safeActiveIndex] || displayVideos[0];
  const isPlaying = playingVideoId === currentVideo?.id;
  const safeAuthor = resolveSafeAuthor(currentVideo, currentUser, allUsers);
  const reviewerAvatarUrl =
    safeAuthor.avatar ||
    currentVideo?.author?.avatar ||
    (currentVideo as any)?.authorAvatar ||
    getSafeAvatarUrl(safeAuthor.avatar, safeAuthor.name, safeAuthor.handle);

  const isCurrentPhoto = isPhotoReview(currentVideo);
  const captionText = `Live photo review for ${getDisplayUrlAsDomain(currentVideo) || displayDomain || "yoouz.com"}`;

  // Synchronize video element play/pause state when isVideoPaused or playingVideoId changes
  useEffect(() => {
    const el = videoElementRef.current;
    if (!el) return;
    if (isVideoPaused || !playingVideoId) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  }, [isVideoPaused, playingVideoId]);

  const handleTogglePlay = useCallback((video: VideoReview) => {
    if (!video) return;
    if (playingVideoId === video.id) {
      if (isVideoPaused) {
        setIsVideoPaused(false);
        if (videoElementRef.current) {
          videoElementRef.current.play().catch(() => {});
        }
      } else {
        setIsVideoPaused(true);
        if (videoElementRef.current) {
          videoElementRef.current.pause();
        }
      }
    } else {
      setPlayingVideoId(video.id);
      setIsVideoPaused(false);
      if (videoElementRef.current) {
        videoElementRef.current.play().catch(() => {});
      }
    }
  }, [playingVideoId, isVideoPaused]);

  // Canonical place profile URL on Yoouz (e.g. /reviews/lernerandrowe.com or https://www.yoouz.com/reviews/...)
  const placeProfileUrl = useMemo(() => {
    const slug = getPlaceSlug(targetPlace) || targetPlace.id || cleanSlug;
    if (!slug || slug === "yoouz.com" || slug === "yoouz" || slug === "www.yoouz.com") {
      if (typeof window !== "undefined" && !window.location.hostname.includes("yoouz.com")) {
        return "/";
      }
      return "https://www.yoouz.com/";
    }
    if (typeof window !== "undefined" && !window.location.hostname.includes("yoouz.com")) {
      return `/reviews/${encodeURIComponent(slug)}`;
    }
    return `https://www.yoouz.com/reviews/${encodeURIComponent(slug)}`;
  }, [targetPlace, cleanSlug]);

  // Canonical reviewer user profile URL on Yoouz (e.g. /@ben-blue or https://www.yoouz.com/@benblue)
  const reviewerProfileUrl = useMemo(() => {
    const rawHandle = safeAuthor.handle ? safeAuthor.handle.replace(/^@+/, "").trim() : "";
    const rawName = (safeAuthor.name || "").trim();
    let cleanSlugCandidate = "";
    if (rawHandle && rawHandle !== "user" && rawHandle !== "reviewer") {
      cleanSlugCandidate = rawHandle.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    } else if (rawName) {
      cleanSlugCandidate = rawName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
    }

    if (!cleanSlugCandidate || cleanSlugCandidate === "reviewer" || cleanSlugCandidate === "user" || cleanSlugCandidate === "registered-user") {
      return placeProfileUrl;
    }
    if (typeof window !== "undefined" && !window.location.hostname.includes("yoouz.com")) {
      return `/@${encodeURIComponent(cleanSlugCandidate)}`;
    }
    return `https://www.yoouz.com/@${encodeURIComponent(cleanSlugCandidate)}`;
  }, [safeAuthor, placeProfileUrl]);

  // Safe non-blocking navigation handler when business clicks their own logo in embed
  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 1. If onOpenPlace is provided by parent container (e.g. running in App.tsx)
      if (onOpenPlace) {
        handleStopVideo();
        onOpenPlace(targetPlace.id || cleanSlug);
        return;
      }

      // 2. If running inside an iframe (e.g. business dashboard embed preview or embed tester)
      if (typeof window !== "undefined" && window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(
            {
              type: "YOOUZ_OPEN_PLACE",
              placeId: targetPlace.id || cleanSlug,
              slug: cleanSlug,
              url: placeProfileUrl
            },
            "*"
          );
        } catch {}

        // If parent window is on the same origin (dashboard preview in the app)
        try {
          if (window.parent.location.origin === window.location.origin) {
            // Inside own dashboard preview - never trigger a popup blocked error!
            return;
          }
        } catch {
          // Cross-origin iframe (e.g. merchant site)
        }

        // External merchant site: open place profile safely without popup blocking
        try {
          const opened = window.open(placeProfileUrl, "_blank", "noopener,noreferrer");
          if (!opened) {
            window.location.href = placeProfileUrl;
          }
        } catch {
          window.location.href = placeProfileUrl;
        }
        return;
      }

      // 3. Standalone mode: navigate directly
      if (typeof window !== "undefined") {
        if (placeProfileUrl.startsWith("/")) {
          window.location.href = placeProfileUrl;
        } else {
          window.open(placeProfileUrl, "_blank", "noopener,noreferrer");
        }
      }
    },
    [onOpenPlace, handleStopVideo, targetPlace, cleanSlug, placeProfileUrl]
  );

  // Safe non-blocking navigation handler when reviewer avatar/name is clicked
  const handleReviewerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onOpenCreator && safeAuthor) {
        handleStopVideo();
        onOpenCreator(safeAuthor);
        return;
      }

      if (typeof window !== "undefined" && window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(
            {
              type: "YOOUZ_OPEN_CREATOR",
              author: safeAuthor,
              url: reviewerProfileUrl
            },
            "*"
          );
        } catch {}

        try {
          if (window.parent.location.origin === window.location.origin) {
            return;
          }
        } catch {}

        try {
          const opened = window.open(reviewerProfileUrl, "_blank", "noopener,noreferrer");
          if (!opened) {
            window.location.href = reviewerProfileUrl;
          }
        } catch {
          window.location.href = reviewerProfileUrl;
        }
        return;
      }

      if (typeof window !== "undefined") {
        if (reviewerProfileUrl.startsWith("/")) {
          window.location.href = reviewerProfileUrl;
        } else {
          window.open(reviewerProfileUrl, "_blank", "noopener,noreferrer");
        }
      }
    },
    [onOpenCreator, safeAuthor, handleStopVideo, reviewerProfileUrl]
  );

  // Safe handler to initiate authentic 60-second video recording for this place
  const handleRecordClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 1. If onRecordReview is passed directly by host
      if (onRecordReview) {
        handleStopVideo();
        onRecordReview(targetPlace);
        return;
      }

      // 2. If running inside an iframe (e.g. business dashboard embed preview or external site)
      if (typeof window !== "undefined" && window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(
            {
              type: "YOOUZ_RECORD_REVIEW",
              placeId: targetPlace.id || cleanSlug,
              slug: cleanSlug,
              place: targetPlace
            },
            "*"
          );
        } catch {}

        try {
          if (window.parent.location.origin === window.location.origin) {
            return;
          }
        } catch {}

        // External website embed: open create review screen for this place
        const recordUrl =
          typeof window !== "undefined" && !window.location.hostname.includes("yoouz.com")
            ? `/reviews/${encodeURIComponent(cleanSlug)}?record=true`
            : `https://www.yoouz.com/reviews/${encodeURIComponent(cleanSlug)}?record=true`;

        try {
          const opened = window.open(recordUrl, "_blank", "noopener,noreferrer");
          if (!opened) {
            window.location.href = recordUrl;
          }
        } catch {
          window.location.href = recordUrl;
        }
        return;
      }

      // 3. Standalone mode
      if (typeof window !== "undefined") {
        const recordUrl = !window.location.hostname.includes("yoouz.com")
          ? `/reviews/${encodeURIComponent(cleanSlug)}?record=true`
          : `https://www.yoouz.com/reviews/${encodeURIComponent(cleanSlug)}?record=true`;
        if (recordUrl.startsWith("/")) {
          window.location.href = recordUrl;
        } else {
          window.open(recordUrl, "_blank", "noopener,noreferrer");
        }
      }
    },
    [onRecordReview, handleStopVideo, targetPlace, cleanSlug]
  );

  if (!isPlacePremium && !isPreviewMode) {
    return (
      <div
        id="copo-embed-widget-root"
        className="w-full h-full min-h-0 bg-black text-white flex flex-col items-center justify-center p-0 select-none antialiased font-sans overflow-hidden"
      >
        <div
          id="copo-embed-card"
          className="relative w-full h-full bg-zinc-950 overflow-hidden border border-zinc-800 shadow-2xl flex flex-col justify-center items-center p-6 text-center space-y-6"
        >
          {/* Lock Icon Ring */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-zinc-200" />
          </div>

          <div className="space-y-2 max-w-[280px]">
            <h3 className="text-base font-black text-white leading-tight tracking-tight uppercase">Photo Review Widget Inactive</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This venue is currently operating on the <strong className="text-zinc-200">Free Package</strong>. Upgrading to the <strong className="text-white">Premium Partner Suite ($199/mo)</strong> unlocks live photo review streams, widget embeds & 1st-Page Google SEO packages.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-[11px] text-zinc-300 max-w-[280px] leading-relaxed">
            <p className="font-bold text-white mb-1">How to Re-activate Review Embeds?</p>
            Request a Premium Partner Upgrade inside your Yoouz Business Portal or contact your assigned regional partner agency to activate your $199/mo suite.
          </div>

          {/* Mini branded watermark */}
          <div className="flex items-center gap-1.5 opacity-40">
            <img src="/favicon.svg" alt="Yoouz Logo" className="w-4 h-4 shadow-sm" />
            <span className="text-[10px] font-black tracking-widest text-white uppercase">Yoouz B2B Network</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="copo-embed-widget-root"
      className="w-full h-full min-h-0 bg-black text-white flex flex-col items-center justify-center p-0 select-none antialiased font-sans overflow-hidden"
    >
      <div
        id="copo-embed-card"
        className="relative w-full h-full bg-zinc-950 overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between group/embed"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {!hasReviews ? (
          /* OPTION A / C: Branded Pure Darkmode "Be the First to Record" Invitation State */
          <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-5 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white select-none">
            {/* Top Bar: Venue Header Pill */}
            <div className="flex items-center justify-between gap-2 z-20">
              <a
                href={placeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 text-white transition-all text-left cursor-pointer shadow-lg active:scale-[0.98] min-w-0 max-w-[calc(100%-40px)] no-underline outline-none"
                onClick={handleLogoClick}
                title={`View ${displayBusinessName} on Yoouz`}
              >
                <CopoBrandLogo
                  domain={displayDomain}
                  name={displayBusinessName}
                  website={targetPlace.website}
                  logoUrl={targetPlace.logoUrl || targetPlace.avatarUrl || targetPlace.ogImage}
                  bannerUrl={targetPlace.bannerUrl}
                  loading="eager"
                  fetchPriority="high"
                  className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-xs"
                  imageClassName="w-full h-full object-contain rounded-md"
                  fallbackTextClassName="font-black text-[10px] text-white"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate flex items-center gap-1 leading-tight font-extrabold text-[12.5px] text-white">
                    <span className="truncate">{displayBusinessName}</span>
                    <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-300 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-white/10 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                <span>Verified</span>
              </div>
            </div>

            {/* Centerpiece: Floating Brand Badge + Interactive Call to Action */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-3 z-20 space-y-3.5 sm:space-y-4">
              {/* Studio Camera Icon Ring */}
              <div className="relative group/camera cursor-pointer" onClick={handleRecordClick}>
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-zinc-900 border border-white/20 shadow-2xl flex items-center justify-center relative overflow-hidden backdrop-blur-xl group-hover/camera:scale-105 transition-transform duration-300">
                  <CopoBrandLogo
                    domain={displayDomain}
                    name={displayBusinessName}
                    website={targetPlace.website}
                    logoUrl={targetPlace.logoUrl || targetPlace.avatarUrl || targetPlace.ogImage}
                    bannerUrl={targetPlace.bannerUrl}
                    loading="eager"
                    fetchPriority="high"
                    className="w-12 h-12 rounded-2xl bg-zinc-950/90 border border-white/10 flex items-center justify-center p-1.5 shadow-md"
                    imageClassName="w-full h-full object-contain"
                    fallbackTextClassName="font-black text-sm text-white"
                  />
                  {/* Subtle live badge */}
                  <div className="absolute -bottom-1 -right-1 bg-zinc-800 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-zinc-950 flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>LIVE</span>
                  </div>
                </div>
              </div>

              {/* Invitation Headings */}
              <div className="space-y-1 max-w-[280px]">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                  Be the first to review <br />
                  <span className="text-zinc-200 truncate inline-block max-w-[240px] align-bottom">
                    {displayBusinessName}
                  </span>
                </h3>
                <p className="text-[11.5px] sm:text-xs text-zinc-400 font-medium leading-relaxed">
                  Real customers snap live photo reviews. Your review will appear live on this website.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleRecordClick}
                className="w-full max-w-[260px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs sm:text-sm shadow-xl active:scale-95 transition-all cursor-pointer border border-white/40"
              >
                <Camera className="w-4 h-4 text-zinc-950" />
                <span>Add Photo Review</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-semibold pt-0.5">
                <Sparkles className="w-3 h-3 text-zinc-400" />
                <span>100% Authentic • Live Camera Only</span>
              </div>
            </div>

            {/* Bottom Bar: Official Yoouz Brand Attribution */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/10 z-20 text-[11px] text-zinc-400">
              <a
                href={placeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors no-underline"
                onClick={handleLogoClick}
                title="Verified by Yoouz"
              >
                <span className="flex items-center justify-center w-[18px] h-[18px] rounded-[5px] bg-[#121216] border border-white/[0.15] shrink-0">
                  <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] fill-white" aria-hidden="true">
                    <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
                  </svg>
                </span>
                <span className="text-[12px] font-bold tracking-[-0.02em] font-['Google_Sans',sans-serif] text-white/90">
                  Yoouz
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">· Verified Photos</span>
              </a>
              <span className="text-[10.5px] font-semibold text-zinc-400">0 Reviews</span>
            </div>
          </div>
        ) : (
          /* Signature Photo Review Embed Card when reviews exist */
          <>
            {/* Background Full-Bleed Photo */}
            <div className="absolute inset-0 w-full h-full bg-black">
              <img
                src={
                  getProxiedImageUrl(
                    currentVideo?.photoUrl ||
                    currentVideo?.thumbnailUrl ||
                    currentVideo?.bannerUrl ||
                    currentVideo?.ogImage ||
                    `https://rev1.b-cdn.net/videos/${currentVideo?.id}.jpg`
                  )
                }
                alt={`${displayBusinessName} photo review by ${safeAuthor.name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg";
                }}
              />

              {/* Editorial Scrims — Keeps Top 70% Pure Photography with Crisp Bottom Legibility */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 bottom-0 h-[48%] min-h-[175px] bg-[linear-gradient(to_top,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.72)_45%,rgba(0,0,0,0.24)_76%,transparent_100%)] pointer-events-none z-10" />
            </div>

            {/* TOP BAR: Subtle Counter (Left, only if multiple) + Official Monochrome Yoouz Mark (Right) */}
            <div className="relative z-30 px-3.5 pt-3.5 flex items-center justify-between gap-2 pointer-events-none">
              <div className="pointer-events-auto">
                {totalCount > 1 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/[0.14] text-[10.5px] font-semibold text-white/85 tabular-nums shadow-sm select-none">
                    {safeActiveIndex + 1} / {totalCount}
                  </span>
                )}
              </div>

              <a
                href={placeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLogoClick}
                className="pointer-events-auto flex items-center gap-1.5 opacity-85 hover:opacity-100 transition-opacity select-none no-underline outline-none"
                title={`Verified customer photo reviews for ${displayBusinessName} on Yoouz`}
                aria-label="Verified on Yoouz"
              >
                <span className="flex items-center justify-center w-[20px] h-[20px] rounded-[6px] bg-black/45 backdrop-blur-md border border-white/[0.16] shadow-[0_2px_8px_rgba(0,0,0,0.45)] shrink-0">
                  <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] fill-white" aria-hidden="true">
                    <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
                  </svg>
                </span>
                <span className="text-white/90 text-[13px] font-bold tracking-[-0.03em] leading-none font-['Google_Sans',sans-serif] drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                  Yoouz
                </span>
              </a>
            </div>

            {/* SIDE CHEVRONS (Desktop hover or tap navigation) */}
            {totalCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevVideo();
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg opacity-75 hover:opacity-100 cursor-pointer"
                  aria-label="Previous review"
                  title="Previous review"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextVideo();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg opacity-75 hover:opacity-100 cursor-pointer"
                  aria-label="Next review"
                  title="Next review"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* BOTTOM OVERLAY: Signature 3-Line Photo Review Attribution */}
            <div className="relative z-30 px-3.5 pb-3.5 pt-2 flex flex-col gap-2 pointer-events-auto select-none">
              {/* Line 1: Bold Universal 5-Star Customer Rating + Numeric Score + Category */}
              <div className="flex items-center gap-1.5 min-w-0">
                <CopoStarRating
                  rating={getRoundedRating(currentVideo?.rating || 5)}
                  roundToWhole={true}
                  starClassName="w-[15px] h-[15px]"
                  filledColorClass="fill-[#FBBF24] text-[#FBBF24] drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
                  emptyColorClass="fill-white/20 text-white/35 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                />
                <span className="text-[13.5px] font-bold text-white tabular-nums tracking-[-0.01em] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  {getRoundedRating(currentVideo?.rating || 5)}/5
                </span>
                {targetPlace.category && (
                  <>
                    <span className="text-white/40 text-[12px]">·</span>
                    <span className="text-[12px] font-medium text-white/75 truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                      {targetPlace.category}
                    </span>
                  </>
                )}
              </div>

              {/* Line 2: Brand Anchor (Logo + Business Name + Aggregate Rating) */}
              <a
                href={placeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLogoClick}
                className="flex items-center gap-2.5 min-w-0 group/brand no-underline outline-none cursor-pointer"
                title={`View all photo reviews for ${displayBusinessName} on Yoouz`}
              >
                <CopoBrandLogo
                  domain={displayDomain}
                  name={displayBusinessName}
                  website={targetPlace.website}
                  logoUrl={targetPlace.logoUrl || targetPlace.avatarUrl || targetPlace.ogImage}
                  bannerUrl={targetPlace.bannerUrl}
                  loading="eager"
                  fetchPriority="high"
                  className="w-9 h-9 rounded-[10px] bg-white border border-white/25 overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                  imageClassName="w-full h-full object-contain rounded-[6px]"
                  fallbackTextClassName="font-bold text-[12px] text-zinc-900"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[16px] font-bold text-white tracking-[-0.02em] truncate leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] group-hover/brand:underline">
                      {displayBusinessName}
                    </span>
                    <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-white/75 leading-tight mt-0.5 truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    <span className="inline-flex items-center gap-0.5 font-semibold text-white/90 shrink-0 tabular-nums">
                      <Star className="w-2.5 h-2.5 fill-[#FBBF24] text-[#FBBF24]" />
                      {overallRating.toFixed(1)}
                    </span>
                    <span className="text-white/60 shrink-0 tabular-nums">({totalReviewsCount})</span>
                    {displayDomain && (
                      <>
                        <span className="text-white/40">·</span>
                        <span className="truncate text-white/70">{displayDomain}</span>
                      </>
                    )}
                  </div>
                </div>
              </a>

              {/* Line 3: Reviewer Attribution + Exact Recency */}
              <div className="flex items-center gap-1.5 text-[12px] text-white/75 min-w-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                <span className="truncate">
                  Review by <span className="font-semibold text-white/95">{safeAuthor.name}</span>
                </span>
                <span className="text-white/40 shrink-0">·</span>
                <span className="text-white/65 shrink-0 tabular-nums">
                  {formatRecordedDate(currentVideo?.recordedAt, currentVideo?.createdAtMs)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
