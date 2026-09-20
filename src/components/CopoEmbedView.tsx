import React, { useState, useMemo } from "react";
import { VideoReview, Place, VideoAuthor, UserProfile, NavSection } from "../types";
import { getPlaceSlug } from "../utils/placeUtils";
import { CopoVideoPlayer } from "./CopoVideoPlayer";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { Star, Play, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

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
  onOpenSearch: _onOpenSearch,
  onSelectSection: _onSelectSection,
  unreadNotifsCount: _unreadNotifsCount = 0,
  unreadMessagesCount: _unreadMessagesCount = 0,
  onCloseEmbed
}) => {
  const [localLikedMap, setLocalLikedMap] = useState<Record<string, boolean>>({});
  const [localBookmarkedMap, setLocalBookmarkedMap] = useState<Record<string, boolean>>({});
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});

  // Check if embedId matches a specific video directly (e.g. /embed/video/rev-123)
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

  // activeVideoIndex state: if specificVideo was passed, default to index 0 to play it full screen immediately.
  // Otherwise, default to null so the user sees the 2-column showcase widget grid FIRST!
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(() => {
    if (specificVideo) return 0;
    return null;
  });

  const avgRating = useMemo(() => {
    if (targetPlace?.rating && targetPlace.rating > 0) return targetPlace.rating.toFixed(1);
    if (matchingVideos.length === 0) return "5.0";
    const sum = matchingVideos.reduce((acc, v) => acc + (v.rating || 5), 0);
    return (sum / matchingVideos.length).toFixed(1);
  }, [targetPlace, matchingVideos]);

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

  // IF ACTIVE VIDEO IS SELECTED: Render full vertical video player view!
  if (activeVideoIndex !== null && matchingVideos.length > 0) {
    return (
      <div
        id="copo-embed-player-root"
        className="w-full h-[100dvh] bg-zinc-950 text-white flex flex-col relative overflow-hidden font-sans select-none antialiased"
      >
        <CopoVideoPlayer
          videos={matchingVideos}
          places={places}
          currentIndex={activeVideoIndex}
          onSelectVideoIndex={(idx) => setActiveVideoIndex(idx)}
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
          onGoBack={() => setActiveVideoIndex(null)}
          isEmbed={true}
          hideFloatingNav={true}
          onCloseEmbed={() => setActiveVideoIndex(null)}
        />
      </div>
    );
  }

  // DEFAULT SHOWCASE WIDGET VIEW: Header + 2-Column Side-by-Side Video Grid
  return (
    <div
      id="copo-embed-grid-root"
      className="w-full min-h-[100dvh] h-full bg-zinc-950 text-white flex flex-col p-3 sm:p-4 font-sans select-none antialiased box-border overflow-y-auto"
    >
      {/* Top Business Header Card */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xl mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <CopoBrandLogo
            domain={targetPlace?.website || targetPlace?.id}
            name={targetPlace?.name}
            logoUrl={targetPlace?.logoUrl}
            className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 shadow-md shrink-0 flex items-center justify-center p-1.5 overflow-hidden"
            imageClassName="w-full h-full object-contain"
            fallbackTextClassName="font-bold text-base text-white"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight truncate">
                {targetPlace?.name || "Verified Business"}
              </span>
              <CheckCircle className="w-4 h-4 fill-white text-black shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-white">{avgRating}</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400 font-medium truncate">
                {matchingVideos.length} {matchingVideos.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
          </div>
        </div>

        <a
          href={`https://yoouz.com/place/${encodeURIComponent(cleanSlug)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1 shrink-0 border border-zinc-700/60"
        >
          <span className="hidden xs:inline">Yoouz</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* 2-Column Side-by-Side Video Cards Grid */}
      {matchingVideos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-zinc-500 space-y-2">
          <AlertCircle className="w-8 h-8 text-zinc-600" />
          <p className="text-xs font-medium text-zinc-400">No video reviews available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 flex-1 pb-3">
          {matchingVideos.map((v, idx) => (
            <div
              key={v.id}
              onClick={() => setActiveVideoIndex(idx)}
              className="relative rounded-2xl overflow-hidden aspect-9/14 bg-zinc-900 group border border-zinc-800/80 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
            >
              <img
                src={v.thumbnailUrl}
                alt={v.dishOrItem || 'Review'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-extrabold flex items-center gap-0.5 z-10 border border-white/10">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{v.rating || 5}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-2.5 text-white">
                <span className="text-[11px] font-bold leading-snug line-clamp-1 drop-shadow-md">
                  {v.dishOrItem && v.dishOrItem !== cleanSlug ? v.dishOrItem : (v.author?.name || 'Verified Reviewer')}
                </span>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Sync Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 pt-2 pb-1 shrink-0 border-t border-zinc-900">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span>Live Sync Powered by</span>
        <a
          href="https://yoouz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-white hover:underline ml-0.5"
        >
          Yoouz
        </a>
      </div>
    </div>
  );
};

