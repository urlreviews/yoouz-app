import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug, formatBusinessName, extractCleanDomain, resolveSafeAuthor, getSafeAvatarUrl } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { Star, Play, CheckCircle, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";

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

function getRatingTierLabel(rating: number): string {
  if (rating >= 4.5) return "EXCELLENT";
  if (rating >= 4.0) return "GREAT";
  if (rating >= 3.0) return "GOOD";
  if (rating >= 2.0) return "AVERAGE";
  return "POOR";
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
  const itemsPerPage = displayVideos.length === 1 ? 1 : 2;
  const totalPages = Math.ceil(displayVideos.length / itemsPerPage);

  const safePageIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
  const currentPair = displayVideos.slice(safePageIndex * itemsPerPage, (safePageIndex + 1) * itemsPerPage);

  const handlePrevPage = useCallback(() => {
    setPageIndex((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
    setPlayingVideoId(null);
    setIsVideoPaused(false);
  }, [totalPages]);

  const handleNextPage = useCallback(() => {
    setPageIndex((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
    setPlayingVideoId(null);
    setIsVideoPaused(false);
  }, [totalPages]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevPage, handleNextPage]);

  // Mobile Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (diff > 40) {
      handleNextPage();
    } else if (diff < -40) {
      handlePrevPage();
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
      if (dragDistanceRef.current < -40) {
        handleNextPage();
      } else if (dragDistanceRef.current > 40) {
        handlePrevPage();
      }
    }
    setIsDragging(false);
    dragStartXRef.current = null;
  };

  const handleCardClick = (video: VideoReview) => {
    if (Math.abs(dragDistanceRef.current) > 10) return; // Ignore drag release clicks

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

  const ratingTier = getRatingTierLabel(overallRating);
  const totalReviewsCount = Math.max(displayVideos.length, targetPlace.totalReviews || 0);

  return (
    <div
      id="copo-embed-widget-root"
      className="w-full h-full min-h-[100dvh] bg-zinc-950 sm:bg-black/95 text-white flex flex-col items-center justify-center p-3 sm:p-4 select-none antialiased font-sans"
    >
      <div
        id="copo-embed-card"
        className="w-full max-w-[440px] bg-zinc-950 border border-zinc-800/80 rounded-[28px] p-4 sm:p-5 shadow-2xl flex flex-col gap-4 relative transition-all"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        {/* Top Header Card: Centered Independent Rating Trust Badge (Google/Trustpilot format) */}
        <div className="flex flex-col items-center justify-center text-center bg-zinc-900/90 border border-white/10 rounded-2xl py-3.5 px-4 sm:py-4 sm:px-5 shadow-md relative">
          {/* Rating Tier Title */}
          <span className="font-black text-sm sm:text-base tracking-wider uppercase text-white drop-shadow-sm">
            {ratingTier}
          </span>

          {/* 5 Gold Stars Row */}
          <div className="flex items-center justify-center gap-1.5 my-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${
                  i < Math.round(overallRating)
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "fill-zinc-700 text-zinc-700"
                }`}
              />
            ))}
          </div>

          {/* Review Count Subtitle */}
          <span className="text-xs sm:text-[13px] text-zinc-300 font-medium">
            Based on {totalReviewsCount} {totalReviewsCount === 1 ? "review" : "reviews"}
          </span>

          {/* Verified Authority Seal */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="font-extrabold text-[13px] sm:text-sm text-white tracking-tight">Yoouz</span>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-zinc-950 text-[10px] font-black shrink-0 shadow-sm">
              ✓
            </span>
          </div>
        </div>

        {/* Video Display Container (1 Centered Card or 2-by-2 Grid with Left/Right navigation) */}
        <div
          className="relative w-full select-none cursor-grab active:cursor-grabbing group/carousel"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Floating Left Navigation Arrow */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPage();
              }}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-zinc-950/90 hover:bg-zinc-900 border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-90 hover:scale-105"
              aria-label="Previous reviews"
              title="Previous reviews"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Floating Right Navigation Arrow */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextPage();
              }}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-zinc-950/90 hover:bg-zinc-900 border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-90 hover:scale-105"
              aria-label="Next reviews"
              title="Next reviews"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Video Grid */}
          <div className={`w-full ${displayVideos.length === 1 ? "flex justify-center" : "grid grid-cols-2 gap-3"}`}>
            {currentPair.map((video, idx) => {
              const realIndex = safePageIndex * itemsPerPage + idx;
              const safeAuthor = resolveSafeAuthor(video, currentUser, allUsers);
              const isPlaying = playingVideoId === video.id;

              // Extract actual author avatar from video review / database
              const reviewerAvatarUrl =
                safeAuthor.avatar ||
                video.author?.avatar ||
                (video as any)?.authorAvatar ||
                getSafeAvatarUrl(safeAuthor.avatar, safeAuthor.name, safeAuthor.handle);

              return (
                <div
                  key={video.id || realIndex}
                  id={`embed-video-card-${realIndex}`}
                  onClick={() => handleCardClick(video)}
                  className={`group relative aspect-[9/13.5] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 shadow-lg cursor-pointer transition-all duration-200 hover:border-zinc-600 hover:shadow-2xl active:scale-[0.98] ${
                    displayVideos.length === 1 ? "w-full max-w-[240px]" : "w-full"
                  }`}
                >
                  {/* Inline Video Playback or Thumbnail */}
                  {isPlaying ? (
                    <div className="relative w-full h-full bg-black">
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
                        src={video.videoUrl}
                        poster={
                          video.thumbnailUrl ||
                          video.bannerUrl ||
                          video.ogImage ||
                          `https://rev1.b-cdn.net/videos/${video.id}.jpg`
                        }
                        playsInline
                        autoPlay
                        loop
                        muted={isMuted}
                        className="w-full h-full object-cover"
                      />

                      {/* Subdued Sound Toggle in Top-Right */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted((prev) => !prev);
                        }}
                        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/80 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-black active:scale-95 transition-all shadow-md"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? (
                          <VolumeX className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>

                      {/* Paused Overlay Indicator */}
                      {isVideoPaused && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                          <div className="w-11 h-11 rounded-full bg-white text-zinc-950 shadow-2xl flex items-center justify-center">
                            <Play className="w-4.5 h-4.5 fill-zinc-950 text-zinc-950 ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Video Thumbnail */}
                      <img
                        src={
                          video.thumbnailUrl ||
                          video.bannerUrl ||
                          video.ogImage ||
                          `https://rev1.b-cdn.net/videos/${video.id}.jpg`
                        }
                        alt={video.caption || video.placeName || "Yoouz Review"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg";
                        }}
                      />

                      {/* Center Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-white text-zinc-950 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Play className="w-4.5 h-4.5 fill-zinc-950 text-zinc-950 ml-0.5" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bottom User Avatar, Author Name & 5 Stars Pill */}
                  <div className="absolute inset-x-2 bottom-2 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg z-20 pointer-events-none">
                    {/* Real Reviewer Avatar / Photo from Database */}
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-white/20 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                      <img
                        src={reviewerAvatarUrl}
                        alt={safeAuthor.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const fallback = generateGoogleLetterAvatarSvg(safeAuthor.name || "User", 64, safeAuthor.handle || safeAuthor.name);
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-white truncate leading-tight">
                          By {safeAuthor.name}
                        </span>
                        {safeAuthor.isVerified && (
                          <CheckCircle className="w-3 h-3 fill-white text-black shrink-0" />
                        )}
                      </div>

                      {/* 5 gold stars */}
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < Math.round(video.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-zinc-600 text-zinc-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls when there are multiple pages */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 px-1">
              <button
                type="button"
                onClick={handlePrevPage}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-600 active:scale-90 transition-all shadow"
                aria-label="Previous reviews"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dots indicator & Count */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPageIndex(i);
                        setPlayingVideoId(null);
                        setIsVideoPaused(false);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === safePageIndex ? "w-4 bg-white" : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                      }`}
                      aria-label={`Page ${i + 1}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {safePageIndex * itemsPerPage + 1}–{Math.min((safePageIndex + 1) * itemsPerPage, displayVideos.length)} of {displayVideos.length} reviews
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-600 active:scale-90 transition-all shadow"
                aria-label="Next reviews"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Live Sync Powered by Yoouz Footer (Clickable to visit application) */}
        <div className="flex items-center justify-center gap-2 pt-0.5 pb-0.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <a
            href={`https://yoouz.com/${cleanSlug === "yoouz.com" ? "" : `place/${encodeURIComponent(targetPlace.id || cleanSlug)}`}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Live Sync Powered by Yoouz
          </a>
        </div>
      </div>
    </div>
  );
};
