import React, { useState, useMemo } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug } from "../utils/placeUtils";
import { CopoVideoPlayer } from "./CopoVideoPlayer";
import { X } from "lucide-react";

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
  onOpenMenu,
  onCloseEmbed
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [localLikedMap, setLocalLikedMap] = useState<Record<string, boolean>>({});
  const [localBookmarkedMap, setLocalBookmarkedMap] = useState<Record<string, boolean>>({});
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});

  // Close handler function
  const handleCloseEmbed = () => {
    if (onCloseEmbed) {
      onCloseEmbed();
      return;
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "YOOUZ_EMBED_CLOSE", action: "close" }, "*");
      }
    } catch (e) {}

    if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "https://yoouz.com";
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
  const targetPlace: Place | undefined = useMemo(() => {
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
      totalReviews: 0,
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
      return videos;
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

  return (
    <div
      id="copo-embed-root"
      className="copo-embed-mode w-full h-full min-h-screen h-[100dvh] bg-zinc-950/90 text-white flex items-center justify-center relative overflow-hidden font-sans select-none antialiased p-0 md:p-6"
    >
      {/* Background Backdrop Overlay (Clickable on Desktop to close) */}
      <div
        className="hidden md:block absolute inset-0 bg-black/85 backdrop-blur-2xl z-0 cursor-pointer"
        onClick={handleCloseEmbed}
        title="Click backdrop to close"
      />

      {/* Mobile View Container (< 768px) - Full Screen Direct Feed */}
      <div className="md:hidden w-full h-full relative bg-black flex flex-col overflow-hidden z-10">
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
          onOpenMenu={onOpenMenu}
          isEmbed={true}
          hideFloatingNav={true}
          onCloseEmbed={handleCloseEmbed}
        />
      </div>

      {/* Desktop View Container (>= 768px) - Realistic iPhone Mockup Frame */}
      <div className="hidden md:flex relative z-10 flex-col items-center justify-center">
        {/* Floating Top-Right Close Button Badge for Desktop */}
        <div className="absolute -top-12 right-0 flex items-center gap-2 z-50">
          <button
            type="button"
            onClick={handleCloseEmbed}
            className="px-4 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/20 text-white font-semibold text-xs shadow-2xl flex items-center gap-2 backdrop-blur-xl transition-all cursor-pointer hover:scale-105 active:scale-95 group/close"
            title="Close (Back to Website)"
          >
            <span className="text-zinc-200 group-hover/close:text-white">Close (Back to Website)</span>
            <X className="w-4 h-4 stroke-[2.5] text-white" />
          </button>
        </div>

        {/* iPhone Outer Frame Body */}
        <div className="relative w-[380px] sm:w-[400px] h-[min(88vh,820px)] max-h-[840px] aspect-[9/19.5] bg-zinc-900 rounded-[52px] p-3 border-[4px] border-zinc-700/80 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_30px_90px_rgba(0,0,0,1)]">
          {/* iPhone Physical Side Buttons */}
          <div className="absolute -left-[6px] top-28 w-[3px] h-7 bg-zinc-700 rounded-l-md pointer-events-none" />
          <div className="absolute -left-[6px] top-40 w-[3px] h-12 bg-zinc-700 rounded-l-md pointer-events-none" />
          <div className="absolute -left-[6px] top-56 w-[3px] h-12 bg-zinc-700 rounded-l-md pointer-events-none" />
          <div className="absolute -right-[6px] top-36 w-[3px] h-16 bg-zinc-700 rounded-r-md pointer-events-none" />

          {/* Inner Phone Screen Container */}
          <div className="w-full h-full rounded-[40px] bg-black overflow-hidden relative flex flex-col border border-zinc-800/90 shadow-inner">
            {/* Dynamic Island / Speaker Notch Cutout */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-50 flex items-center justify-between px-2.5 pointer-events-none border border-zinc-800/80 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700/50" />
              <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-800/80 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40" />
              </div>
            </div>

            {/* Video Player inside Frame */}
            <div className="w-full h-full relative overflow-hidden flex-1">
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
                onOpenMenu={onOpenMenu}
                isEmbed={true}
                hideFloatingNav={true}
                onCloseEmbed={handleCloseEmbed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
