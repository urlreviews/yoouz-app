import React, { useState, useMemo } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug } from "../utils/placeUtils";
import { CopoVideoPlayer } from "./CopoVideoPlayer";
import { CopoMobileBottomNav } from "./CopoMobileBottomNav";

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
  onOpenSearch,
  onSelectSection,
  unreadNotifsCount = 0,
  unreadMessagesCount = 0,
  onCloseEmbed
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [localLikedMap, setLocalLikedMap] = useState<Record<string, boolean>>({});
  const [localBookmarkedMap, setLocalBookmarkedMap] = useState<Record<string, boolean>>({});
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});

  // Close handler function
  const handleCloseEmbed = () => {
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
      className="w-full h-full min-h-screen h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none antialiased"
    >
      <div className="copo-has-bottom-nav w-full h-full relative bg-black flex flex-col overflow-hidden z-10">
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
          onGoBack={handleCloseEmbed}
          isEmbed={true}
          hideFloatingNav={false}
          onCloseEmbed={handleCloseEmbed}
        />
      </div>

      {/* Official Bottom Mobile Navigation Bar */}
      <CopoMobileBottomNav
        activeSection="home"
        onSelectSection={(sec) => {
          if (sec === "home") {
            // Stay on feed
          } else if (onSelectSection) {
            onSelectSection(sec);
          }
        }}
        currentUser={currentUser}
        unreadNotifsCount={unreadNotifsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenSearch={onOpenSearch}
        onOpenCreateModal={onRecordReview ? () => onRecordReview(targetPlace) : undefined}
      />
    </div>
  );
};
