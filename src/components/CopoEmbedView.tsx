import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug, formatBusinessName, extractCleanDomain, resolveSafeAuthor, getSafeAvatarUrl, getDisplayUrlAsDomain } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { getProxiedImageUrl } from "../utils/logoUtils";
import { Star, Play, Pause, CheckCircle, ChevronLeft, ChevronRight, Volume2, VolumeX, Globe, Clock } from "lucide-react";
import { formatRecordedDate } from "../utils/dateUtils";

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
}

export const CopoEmbedView: React.FC<CopoEmbedViewProps> = ({
  embedId,
  places,
  videos,
  currentUser,
  allUsers = [],
  onOpenComments: _onOpenComments,
  onOpenShare: _onOpenShare,
  onOpenPlace: _onOpenPlace,
  onOpenCreator: _onOpenCreator,
  onToggleLike: _onToggleLike,
  onToggleBookmark: _onToggleBookmark,
  onToggleFollow: _onToggleFollow,
  onOpenReport: _onOpenReport,
  onRecordReview: _onRecordReview,
  onOpenAuth: _onOpenAuth,
  onOpenMenu: _onOpenMenu,
  onOpenSearch: _onOpenSearch,
  onSelectSection: _onSelectSection,
  unreadNotifsCount: _unreadNotifsCount = 0,
  unreadMessagesCount: _unreadMessagesCount = 0,
  onCloseEmbed: _onCloseEmbed
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

    if (matched.length === 0) {
      return videos.slice(0, 10);
    }
    return matched;
  }, [videos, cleanSlug]);

  // Display list (supports 1, 2, 10, 100, 1000 reviews)
  const displayVideos = matchingVideos.length > 0 ? matchingVideos : videos.slice(0, 2);
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

  const captionText = useMemo(() => {
    let trimmed = (currentVideo?.caption || "").trim();
    trimmed = trimmed
      .replace(/rev\d+[a-z0-9]*(\.com)?/gi, "yoouz.com")
      .replace(/rev[0-9a-f]{8,}(\.com)?/gi, "yoouz.com");
    if (/^video review (for|of)\b/i.test(trimmed)) {
      const cleanDomain = getDisplayUrlAsDomain(currentVideo) || displayDomain;
      return `Video review for ${cleanDomain}`;
    }
    if (!trimmed) {
      return `Video review for ${displayDomain}`;
    }
    return trimmed;
  }, [currentVideo, displayDomain]);

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

  // Canonical place profile URL on Yoouz (e.g. https://www.yoouz.com/place/lernerandrowe.com or https://www.yoouz.com/)
  const placeProfileUrl = useMemo(() => {
    const slug = getPlaceSlug(targetPlace) || targetPlace.id || cleanSlug;
    if (!slug || slug === "yoouz.com" || slug === "yoouz" || slug === "www.yoouz.com") {
      return "https://www.yoouz.com/";
    }
    return `https://www.yoouz.com/place/${encodeURIComponent(slug)}`;
  }, [targetPlace, cleanSlug]);

  // Canonical reviewer user profile URL on Yoouz (e.g. https://www.yoouz.com/@ben-blue or https://www.yoouz.com/@benblue)
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
    return `https://www.yoouz.com/@${encodeURIComponent(cleanSlugCandidate)}`;
  }, [safeAuthor, placeProfileUrl]);

  return (
    <div
      id="copo-embed-widget-root"
      className="w-full h-full min-h-0 bg-black text-white flex flex-col items-center justify-center p-0 select-none antialiased font-sans overflow-hidden"
    >
      <div
        id="copo-embed-card"
        className="relative w-full h-full max-w-[390px] max-h-[100%] bg-zinc-950 sm:rounded-[24px] overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between group/embed"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Background Full-Bleed Video / Poster */}
        <div 
          className="absolute inset-0 w-full h-full bg-black cursor-pointer"
          onClick={() => currentVideo && handleTogglePlay(currentVideo)}
        >
          {isPlaying ? (
            <video
              ref={(el) => {
                videoElementRef.current = el;
                if (el) {
                  if (isVideoPaused || !playingVideoId) {
                    el.pause();
                  } else {
                    el.play().catch(() => {});
                  }
                }
              }}
              src={currentVideo.videoUrl}
              poster={
                currentVideo.thumbnailUrl ||
                currentVideo.bannerUrl ||
                currentVideo.ogImage ||
                `https://rev1.b-cdn.net/videos/${currentVideo.id}.jpg`
              }
              playsInline
              autoPlay
              loop
              muted={isMuted}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={
                getProxiedImageUrl(
                  currentVideo?.thumbnailUrl ||
                  currentVideo?.bannerUrl ||
                  currentVideo?.ogImage ||
                  `https://rev1.b-cdn.net/videos/${currentVideo?.id}.jpg`
                )
              }
              alt={currentVideo?.caption || currentVideo?.placeName || "Yoouz Review"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg";
              }}
            />
          )}

          {/* Cinematic Top and Bottom Gradients for Uncompromising Legibility */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none z-10" />

          {/* Center Luxury Play / Pause Indicator */}
          {(!isPlaying || isVideoPaused) ? (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/30 text-white shadow-2xl flex items-center justify-center group-hover/embed:scale-110 transition-all duration-300">
                <Play className="w-6 h-6 fill-white text-white ml-1 drop-shadow-md" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none opacity-0 group-hover/embed:opacity-100 transition-opacity duration-200">
              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center justify-center">
                <Pause className="w-5 h-5 fill-white text-white" />
              </div>
            </div>
          )}
        </div>

        {/* TOP OVERLAY: Brand Trust Header Pill + Sound Toggle */}
        <div className="relative z-30 p-3 sm:p-3.5 flex items-start justify-between gap-2 pointer-events-auto">
          <a
            href={placeProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 pl-1.5 pr-3.5 py-1 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-2xl border border-white/20 hover:border-white/40 text-white transition-all text-left cursor-pointer shadow-xl active:scale-[0.98] min-w-0 max-w-[calc(100%-48px)] no-underline outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent]"
            title={`View verified reviews for ${displayBusinessName} on Yoouz`}
            onClick={(e) => {
              e.stopPropagation();
              handleStopVideo();
            }}
          >
            <CopoBrandLogo
              domain={displayDomain}
              name={displayBusinessName}
              website={targetPlace.website}
              logoUrl={targetPlace.logoUrl || targetPlace.avatarUrl || targetPlace.ogImage}
              bannerUrl={targetPlace.bannerUrl}
              loading="eager"
              fetchPriority="high"
              className="w-8 h-8 rounded-xl bg-zinc-900/90 border border-white/25 overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-md transition-transform"
              imageClassName="w-full h-full object-contain rounded-lg"
              fallbackTextClassName="font-extrabold text-[11px] text-white"
            />
            <div className="min-w-0 flex-1 py-0.5">
              <div className="truncate flex items-center gap-1 leading-tight font-black text-[13px] sm:text-[14px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] no-underline">
                <span className="truncate no-underline">{displayBusinessName}</span>
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-black shrink-0" />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-extrabold leading-none mt-0.5 no-underline">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{overallRating.toFixed(1)}</span>
                <span className="text-zinc-300 font-normal">
                  ({totalReviewsCount} {totalReviewsCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>
          </a>

          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted((prev) => !prev);
            }}
            className="w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg shrink-0 mt-0.5"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-white" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-white" />
            )}
          </button>
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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all active:scale-90 shadow-xl opacity-70 hover:opacity-100"
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all active:scale-90 shadow-xl opacity-70 hover:opacity-100"
              aria-label="Next review"
              title="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* BOTTOM OVERLAY: Clean Original Video Feed Layout */}
        <div className="relative z-30 p-3 sm:p-3.5 flex flex-col gap-2 pointer-events-auto">
          {/* Reviewer Metadata (Frameless, clean overlay matching original Yoouz video feed) */}
          <div className="flex items-start gap-2.5 min-w-0">
            {/* Reviewer Avatar -> Direct link to user profile on Yoouz */}
            <a
              href={reviewerProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full overflow-hidden bg-zinc-900/80 border border-white/30 shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-md hover:scale-105 hover:border-white/60 active:scale-95 transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none [-webkit-tap-highlight-color:transparent]"
              title={`View ${safeAuthor.name}'s verified profile on Yoouz`}
              onClick={(e) => {
                e.stopPropagation();
                handleStopVideo();
              }}
            >
              <img
                src={reviewerAvatarUrl}
                alt={safeAuthor.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = generateGoogleLetterAvatarSvg(
                    safeAuthor.name || "User",
                    64,
                    safeAuthor.handle || safeAuthor.name
                  );
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            </a>

            <div className="min-w-0 flex flex-col gap-0.5">
              {/* Line 1: Author Name with Verified Check -> Direct link to user profile on Yoouz */}
              <a
                href={reviewerProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer min-w-0 w-fit no-underline outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent]"
                title={`View ${safeAuthor.name}'s verified profile on Yoouz`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopVideo();
                }}
              >
                <span className="text-[13.5px] sm:text-[14px] font-black text-white no-underline truncate leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                  By {safeAuthor.name}
                </span>
                {safeAuthor.isVerified && (
                  <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                )}
              </a>

              {/* Line 2: Rating Stars & Recorded Time */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(currentVideo?.rating || 5)
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          : "fill-zinc-500/70 text-zinc-300/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white text-[11px] font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-white/80 shrink-0" />
                  <span>{formatRecordedDate(currentVideo?.recordedAt, currentVideo?.createdAtMs)}</span>
                </span>
              </div>

              {/* Line 3: Caption (e.g. Video review for yoouz.com) */}
              <p className="text-white text-[12px] sm:text-[12.5px] font-medium line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] mt-0.5 leading-snug">
                {captionText}
              </p>
            </div>
          </div>

          {/* Footer Bar: Live Sync on Left, Video Count (1 of 3) on Right */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <a
                href={placeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-white/80 hover:text-white transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] no-underline outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopVideo();
                }}
              >
                Live Sync Powered by Yoouz
              </a>
            </div>

            {totalCount > 1 && (
              <span className="text-[10.5px] font-extrabold text-white/90 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 drop-shadow-sm shrink-0">
                {safeActiveIndex + 1} of {totalCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
