import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug, formatBusinessName, extractCleanDomain, resolveSafeAuthor, getSafeAvatarUrl } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { Star, Play, CheckCircle, ChevronLeft, ChevronRight, Volume2, VolumeX, Globe } from "lucide-react";

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
  const dragStartXRef = useRef<number | null>(null);
  const dragDistanceRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);

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
        p.name.toLowerCase().trim() === cleanSlug ||
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
  }, [totalCount]);

  const handleNextVideo = useCallback(() => {
    setPageIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
    setPlayingVideoId(null);
    setIsVideoPaused(false);
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

  const handleTogglePlay = (video: VideoReview) => {
    if (playingVideoId === video.id) {
      setIsVideoPaused((prev) => !prev);
    } else {
      setPlayingVideoId(video.id);
      setIsVideoPaused(false);
    }
  };

  return (
    <div
      id="copo-embed-widget-root"
      className="w-full h-full min-h-0 bg-black text-white flex flex-col items-center justify-center p-0 select-none antialiased font-sans overflow-hidden"
    >
      <div
        id="copo-embed-card"
        className="relative w-full h-full max-w-[420px] max-h-[100%] bg-zinc-950 sm:rounded-[24px] overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between group/embed"
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
                if (el) {
                  if (isVideoPaused) {
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
                currentVideo?.thumbnailUrl ||
                currentVideo?.bannerUrl ||
                currentVideo?.ogImage ||
                `https://rev1.b-cdn.net/videos/${currentVideo?.id}.jpg`
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

          {/* Center Luxury Play Button (when paused or not playing) */}
          {(!isPlaying || isVideoPaused) && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/30 text-white shadow-2xl flex items-center justify-center group-hover/embed:scale-110 transition-all duration-300">
                <Play className="w-6 h-6 fill-white text-white ml-1 drop-shadow-md" />
              </div>
            </div>
          )}
        </div>

        {/* TOP OVERLAY: Story Progress & Brand Trust Pill */}
        <div className="relative z-30 flex flex-col gap-2 p-3 sm:p-3.5 pointer-events-auto">
          {/* Story Progress Bars for multiple reviews */}
          {totalCount > 1 && (
            <div className="flex items-center gap-1.5 w-full">
              {displayVideos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPageIndex(i);
                    if (playingVideoId) {
                      setPlayingVideoId(displayVideos[i]?.id || null);
                    }
                    setIsVideoPaused(false);
                  }}
                  className="h-1 flex-1 rounded-full overflow-hidden bg-white/25 hover:bg-white/40 transition-all relative cursor-pointer"
                  aria-label={`Jump to review ${i + 1}`}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      i === safeActiveIndex
                        ? "w-full bg-white shadow-sm"
                        : i < safeActiveIndex
                        ? "w-full bg-white/70"
                        : "w-0"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Brand Trust Header Pill + Sound Toggle */}
          <div className="flex items-center justify-between gap-2">
            <a
              href={`https://yoouz.com/${cleanSlug === "yoouz.com" ? "" : `place/${encodeURIComponent(targetPlace.id || cleanSlug)}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-black/65 hover:bg-black/85 backdrop-blur-xl border border-white/20 rounded-full py-1.5 px-3 shadow-lg transition-all active:scale-95 max-w-[calc(100%-44px)]"
              title="View verified reviews on Yoouz"
            >
              <CopoBrandLogo
                domain={displayDomain}
                name={displayBusinessName}
                website={targetPlace.website}
                logoUrl={targetPlace.logoUrl || targetPlace.avatarUrl || targetPlace.ogImage}
                bannerUrl={targetPlace.bannerUrl}
                loading="eager"
                fetchPriority="high"
                className="w-5 h-5 rounded-full bg-zinc-950 border border-white/20 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm"
                imageClassName="w-full h-full object-contain rounded-full"
                fallbackTextClassName="font-black text-[10px] text-white"
              />
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-bold text-xs text-white truncate max-w-[120px] sm:max-w-[160px]">
                  {displayBusinessName}
                </span>
                <CheckCircle className="w-3.5 h-3.5 fill-white text-black shrink-0" />
              </div>
              <div className="h-3 w-[1px] bg-white/20 shrink-0" />
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-xs text-white">{overallRating.toFixed(1)}</span>
                <span className="text-zinc-300 text-[10.5px]">({totalReviewsCount})</span>
              </div>
            </a>

            {/* Mute / Unmute Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              className="w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg shrink-0"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-white" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>
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

        {/* BOTTOM OVERLAY: Reviewer Frosted Glass Card & Yoouz Sync */}
        <div className="relative z-30 p-3 sm:p-3.5 flex flex-col gap-2 pointer-events-auto">
          {/* Reviewer Glass Pill */}
          <div className="bg-black/75 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/25 shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
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
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate leading-tight">
                    By {safeAuthor.name}
                  </span>
                  {safeAuthor.isVerified && (
                    <CheckCircle className="w-3 h-3 fill-white text-black shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(currentVideo?.rating || 5)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-zinc-600 text-zinc-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10.5px] text-zinc-300 font-medium">Verified Customer</span>
                </div>
              </div>
            </div>

            {totalCount > 1 && (
              <span className="text-[11px] font-semibold text-zinc-300 bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                {safeActiveIndex + 1} of {totalCount}
              </span>
            )}
          </div>

          {/* Live Sync Powered by Yoouz Footer (Clickable to visit application) */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <a
              href={`https://yoouz.com/${cleanSlug === "yoouz.com" ? "" : `place/${encodeURIComponent(targetPlace.id || cleanSlug)}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Live Sync Powered by Yoouz
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
