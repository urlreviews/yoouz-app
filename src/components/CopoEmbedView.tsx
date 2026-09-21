import React, { useState, useMemo, useRef, useCallback } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug, formatBusinessName, extractCleanDomain, resolveSafeAuthor, getSafeAvatarUrl } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { CopoVideoPlayer } from "./CopoVideoPlayer";
import { Star, Play, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

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
  onOpenComments,
  onOpenShare,
  onOpenPlace,
  onOpenCreator,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  onOpenReport,
  onRecordReview,
  onOpenAuth: _onOpenAuth,
  onOpenMenu: _onOpenMenu,
  onOpenSearch: _onOpenSearch,
  onSelectSection: _onSelectSection,
  unreadNotifsCount: _unreadNotifsCount = 0,
  unreadMessagesCount: _unreadMessagesCount = 0,
  onCloseEmbed
}) => {
  // Check if URL parameters request direct player mode
  const initialMode = useMemo(() => {
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      if (params.get("view") === "player" || params.get("mode") === "player") {
        return "player";
      }
    } catch (e) {}
    return "widget";
  }, []);

  const [viewMode, setViewMode] = useState<"widget" | "player">(initialMode);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [localLikedMap, setLocalLikedMap] = useState<Record<string, boolean>>({});
  const [localBookmarkedMap, setLocalBookmarkedMap] = useState<Record<string, boolean>>({});
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});

  const touchStartXRef = useRef<number | null>(null);

  // Close handler function
  const handleCloseEmbed = () => {
    // If inside player mode, back button takes us back to widget mode first
    if (viewMode === "player") {
      setViewMode("widget");
      return;
    }

    // 1. Send postMessages to parent window if embedded in an iframe
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "YOOUZ_EMBED_CLOSE", action: "close" }, "*");
        window.parent.postMessage({ type: "YOOUZ_CLOSE_MODAL", action: "close" }, "*");
        window.parent.postMessage("yoouz_close", "*");
      }
    } catch (e) {}

    // 2. Invoke parent onCloseEmbed callback if present
    if (onCloseEmbed) {
      onCloseEmbed();
      return;
    }

    // 3. If navigated directly from an external website, return to referrer page
    if (document.referrer && !document.referrer.includes(window.location.host)) {
      window.location.href = document.referrer;
      return;
    }

    // 4. Otherwise cleanly reset state & URL to main app feed
    try {
      window.history.replaceState(null, "", "/");
    } catch (e) {}
    if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  // Check if embedId matches a specific video directly
  const specificVideo = useMemo(() => {
    if (!embedId) return null;
    const clean = embedId.toLowerCase().trim();
    return videos.find((v) => v && (v.id === embedId || v.id.toLowerCase() === clean)) || null;
  }, [videos, embedId]);

  // Normalize embed ID / slug
  let cleanSlug = (embedId || "yoouz.com").toLowerCase().trim();
  if (specificVideo) {
    cleanSlug = getPlaceSlug(specificVideo.placeId || specificVideo.placeName);
  } else if (cleanSlug.includes("place-custom") || cleanSlug.includes("yoouz")) {
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

    let result = matched;
    if (specificVideo) {
      result = [specificVideo, ...matched.filter((v) => v.id !== specificVideo.id)];
    }

    if (result.length === 0) {
      if (specificVideo) return [specificVideo];
      return videos.slice(0, 2);
    }

    return result.map((v) => ({
      ...v,
      isLiked: localLikedMap[v.id] !== undefined ? localLikedMap[v.id] : v.isLiked,
      likes: (v.likes || 0) + (localLikedMap[v.id] && !v.isLiked ? 1 : 0),
      isBookmarked: localBookmarkedMap[v.id] !== undefined ? localBookmarkedMap[v.id] : v.isBookmarked,
      author: {
        ...v.author,
        isFollowed:
          v.author?.name && localFollowedMap[v.author.name] !== undefined
            ? localFollowedMap[v.author.name]
            : v.author?.isFollowed
      }
    }));
  }, [videos, cleanSlug, specificVideo, localLikedMap, localBookmarkedMap, localFollowedMap]);

  const handleLike = (videoId: string) => {
    if (onToggleLike) {
      onToggleLike(videoId);
    } else {
      setLocalLikedMap((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
    }
  };

  const handleBookmark = (videoId: string) => {
    if (onToggleBookmark) {
      onToggleBookmark(videoId);
    } else {
      setLocalBookmarkedMap((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
    }
  };

  const handleFollow = (handle: string) => {
    if (onToggleFollow) {
      onToggleFollow(handle);
    } else {
      setLocalFollowedMap((prev) => ({ ...prev, [handle]: !prev[handle] }));
    }
  };

  const handleOpenPlaceLink = (placeId: string) => {
    if (onOpenPlace) {
      onOpenPlace(placeId);
    } else {
      window.open(`https://yoouz.com/place/${encodeURIComponent(placeId)}`, "_blank");
    }
  };

  const handleOpenCreatorLink = (author: VideoAuthor) => {
    if (onOpenCreator) {
      onOpenCreator(author);
    } else {
      window.open(`https://yoouz.com/@${encodeURIComponent(author.name)}`, "_blank");
    }
  };

  // Click on a video card from the widget to play inline
  const handleSelectVideoCard = (realIndex: number) => {
    setCurrentIndex(realIndex);
    setViewMode("player");
  };

  // Pagination calculation for 2-at-a-time display
  const displayVideos = matchingVideos.length > 0 ? matchingVideos : videos.slice(0, 2);
  const itemsPerPage = displayVideos.length === 1 ? 1 : 2;
  const totalPages = Math.ceil(displayVideos.length / itemsPerPage);

  const safePageIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
  const currentPair = displayVideos.slice(safePageIndex * 2, safePageIndex * 2 + 2);

  const handlePrevPage = useCallback(() => {
    setPageIndex((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  }, [totalPages]);

  const handleNextPage = useCallback(() => {
    setPageIndex((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  }, [totalPages]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (diff > 45) {
      // Swiped left -> next
      handleNextPage();
    } else if (diff < -45) {
      // Swiped right -> prev
      handlePrevPage();
    }
    touchStartXRef.current = null;
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

  // If in Player View (Expanded vertical player)
  if (viewMode === "player") {
    return (
      <div
        id="copo-embed-player-root"
        className="w-full h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none antialiased"
      >
        <div className="w-full h-full relative bg-zinc-950 flex flex-col overflow-hidden z-10">
          <CopoVideoPlayer
            videos={matchingVideos}
            places={places}
            currentIndex={currentIndex}
            onSelectVideoIndex={setCurrentIndex}
            activeSubTab="discover"
            onSelectSubTab={() => {}}
            onOpenComments={onOpenComments || (() => {})}
            onOpenPlace={handleOpenPlaceLink}
            onOpenCreator={handleOpenCreatorLink}
            onOpenShare={onOpenShare || (() => {})}
            onToggleLike={handleLike}
            onToggleBookmark={handleBookmark}
            onToggleFollow={handleFollow}
            onOpenReport={onOpenReport}
            onOpenCreateModal={onRecordReview ? () => onRecordReview(targetPlace) : undefined}
            currentUser={currentUser}
            allUsers={allUsers}
            feedContextTitle={targetPlace?.name}
            onGoBack={() => setViewMode("widget")}
            isEmbed={true}
            hideFloatingNav={false}
            onCloseEmbed={handleCloseEmbed}
          />
        </div>
      </div>
    );
  }

  // Otherwise in Widget View (Card overview)
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
        {/* Top Header Card: Independent Rating Badge (Google/Trustpilot format with Yoouz branding) */}
        <div className="flex items-center gap-3.5 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          {/* Yoouz Icon Logo on Left */}
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
            <Star className="w-6 h-6 fill-white text-white drop-shadow-sm" />
          </div>

          {/* Rating Calculation & Verification */}
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-black text-xs sm:text-[13px] tracking-wider uppercase text-white drop-shadow-sm">
                {ratingTier}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-extrabold text-[12px] text-white">Yoouz</span>
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white text-zinc-950 text-[9px] font-black shrink-0">
                  ✓
                </span>
              </div>
            </div>

            {/* 5 Gold Stars Row */}
            <div className="flex items-center gap-1 my-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    i < Math.round(overallRating)
                      ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                      : "fill-zinc-700 text-zinc-700"
                  }`}
                />
              ))}
            </div>

            {/* Review count subtitle */}
            <span className="text-[11.5px] text-zinc-400 font-medium leading-none">
              Based on {totalReviewsCount} {totalReviewsCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>

        {/* Video Display Container (1 Centered Card or 2-by-2 Grid with Left/Right navigation) */}
        <div
          className="relative w-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Video Grid */}
          <div className={`w-full ${displayVideos.length === 1 ? "flex justify-center" : "grid grid-cols-2 gap-3"}`}>
            {currentPair.map((video, idx) => {
              const realIndex = safePageIndex * 2 + idx;
              const safeAuthor = resolveSafeAuthor(video.author, currentUser);

              return (
                <div
                  key={video.id || realIndex}
                  id={`embed-video-card-${realIndex}`}
                  onClick={() => handleSelectVideoCard(realIndex)}
                  className={`group relative aspect-[9/13.5] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 shadow-lg cursor-pointer transition-all duration-200 hover:border-zinc-600 hover:shadow-2xl active:scale-[0.98] ${
                    displayVideos.length === 1 ? "w-full max-w-[240px]" : "w-full"
                  }`}
                >
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

                  {/* Bottom User Avatar, Author Name, 5 Stars & Review Subtitle Pill */}
                  <div className="absolute inset-x-2 bottom-2 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg">
                    {/* User Avatar */}
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-white/20 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                      <img
                        src={getSafeAvatarUrl(safeAuthor.avatar, safeAuthor.name, safeAuthor.handle)}
                        alt={safeAuthor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = generateGoogleLetterAvatarSvg(safeAuthor.name || "User", 64);
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

                      <p className="text-[9px] text-zinc-400 truncate leading-tight mt-0.5">
                        Video review for {extractCleanDomain(video.placeWebsite || video.placeId || video.placeName) || targetPlace.name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls when there are >2 videos */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2.5 px-1">
              <button
                type="button"
                onClick={handlePrevPage}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-600 active:scale-90 transition-all shadow"
                aria-label="Previous reviews"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dots indicator */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPageIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === safePageIndex ? "w-4 bg-white" : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                    }`}
                    aria-label={`Page ${i + 1}`}
                  />
                ))}
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
