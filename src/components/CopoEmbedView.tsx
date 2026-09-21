import React, { useState, useMemo } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug } from "../utils/placeUtils";
import { CopoVideoPlayer } from "./CopoVideoPlayer";
import { Star, Play, ArrowLeft } from "lucide-react";

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
  const [localLikedMap, setLocalLikedMap] = useState<Record<string, boolean>>({});
  const [localBookmarkedMap, setLocalBookmarkedMap] = useState<Record<string, boolean>>({});
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});

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
        (p.website && getPlaceSlug(p.website) === cleanSlug)
      );
    });

    if (found) return found;

    const isYoouz = cleanSlug === "yoouz.com" || cleanSlug === "yoouz";
    return {
      id: isYoouz ? "yoouz.com" : cleanSlug,
      name: isYoouz ? "Yoouz" : cleanSlug.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      rating: 5.0,
      totalReviews: 2,
      website: isYoouz ? "https://yoouz.com" : `https://www.${cleanSlug}`,
      logoUrl: isYoouz ? "/favicon.svg" : undefined,
      isClaimed: true
    } as Place;
  }, [places, cleanSlug]);

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
        (v.placeName && v.placeName.toLowerCase().trim() === cleanSlug)
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

  // Click on a video card from the widget
  const handleSelectVideoCard = (index: number) => {
    setCurrentIndex(index);
    setViewMode("player");
  };

  // If in Player View (Expanded full vertical player - Screenshot 3)
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

  // Otherwise in Widget View (Card overview - Screenshot 1)
  const displayVideos = matchingVideos.length > 0 ? matchingVideos : videos.slice(0, 2);
  const totalReviewsCount = Math.max(displayVideos.length, targetPlace.totalReviews || 0);

  return (
    <div
      id="copo-embed-widget-root"
      className="w-full h-full min-h-[100dvh] bg-zinc-950 sm:bg-black/95 text-white flex flex-col items-center justify-center p-3 sm:p-4 select-none antialiased font-sans"
    >
      <div
        id="copo-embed-card"
        className="w-full max-w-[460px] bg-zinc-950 border border-zinc-850 rounded-[28px] p-4 sm:p-5 shadow-2xl flex flex-col gap-4 relative transition-all"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        {/* Top Header Card */}
        <div className="flex items-center gap-3.5 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Star className="w-5 h-5 fill-white text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-white truncate tracking-tight">
                {targetPlace.name}
              </h2>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-zinc-950 text-[10px] font-black shrink-0">
                ✓
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-300 mt-0.5 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-400">
                {(targetPlace.rating || 5.0).toFixed(1)}
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-300">
                {totalReviewsCount} {totalReviewsCount === 1 ? "Review" : "Reviews"}
              </span>
            </div>
          </div>
        </div>

        {/* Video Grid (Side-by-side reviews) */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {displayVideos.slice(0, 2).map((video, idx) => (
            <div
              key={video.id || idx}
              id={`embed-video-card-${idx}`}
              onClick={() => handleSelectVideoCard(idx)}
              className="group relative aspect-[9/13.5] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 shadow-md cursor-pointer transition-all duration-200 hover:border-zinc-600 hover:shadow-xl active:scale-[0.98]"
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

              {/* Star Rating Badge (Top Right) */}
              <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-white border border-white/15 flex items-center gap-1 shadow-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{video.rating || 5}</span>
              </div>

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white text-zinc-950 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Play className="w-5 h-5 fill-zinc-950 text-zinc-950 ml-0.5" />
                </div>
              </div>

              {/* Bottom Gradient Overlay & Place/Review Title */}
              <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end">
                <p className="text-xs font-bold text-white tracking-wide truncate drop-shadow-md">
                  {video.dishOrItem || video.placeName || targetPlace.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Sync Powered by Yoouz Footer */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-0.5">
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
