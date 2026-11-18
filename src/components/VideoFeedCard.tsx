import React, { useRef, useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { buildLocalizedPath } from "../i18n/urlLocalization";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Star,
  CheckCircle,
  Plus,
  MoreHorizontal,
  Menu,
  ChevronLeft,
  Globe,
  Camera
} from "lucide-react";
import { VideoReview, VideoAuthor, FeedSubTab, Place } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import {
  formatBusinessName,
  resolveSafeAuthor,
  extractCleanDomain,
  getSafeAvatarUrl,
  getDisplayUrlAsDomain,
  isPlaceReviewMatch
} from "../utils/placeUtils";
import { isPurgedItem } from "../hooks/useFeedPagination";
import { getProxiedImageUrl } from "../utils/logoUtils";
import { resolveVideoPosterUrl, resolveVideoPosterCascade } from "../utils/videoUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { SEOTags } from "./SEOTags";
import { triggerHaptic } from "../utils/haptics";
import { preloadBusinessAssets, preloadImage } from "../utils/preloadUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { CopoStarRating, getRoundedRating } from "./CopoStarRating";

interface VideoFeedCardProps {
  video: VideoReview;
  index: number;
  isActive: boolean;
  isNear: boolean;
  isMuted?: boolean;
  isPlaying?: boolean;
  isBuffering?: boolean;
  progressPercent?: number;
  videoDuration?: number;
  isActualMuted?: boolean;
  isManuallyPaused?: boolean;
  hasRenderedFirstFrame?: boolean;
  videoTime?: number;
  allUsers?: any[];
  currentUser?: any;
  places?: Place[];
  allVideos?: VideoReview[];

  activeSubTab?: FeedSubTab;
  onSelectSubTab?: (tab: FeedSubTab) => void;
  onToggleMute?: (e?: React.SyntheticEvent | Event) => void;
  onForceMute?: () => void;
  onTogglePlayPause?: (e?: React.SyntheticEvent | Event, targetCardIndex?: number) => void;
  onActivateCard?: (cardIndex: number) => void;
  onPauseVideo?: () => void;
  onOpenComments: (video: VideoReview) => void;
  onOpenPlace: (placeId: string, fromVideoId?: string) => void;
  onOpenCreator: (author: VideoAuthor) => void;
  onOpenShare: (video: VideoReview) => void;
  onOpenMoreMenu: (video: VideoReview) => void;
  onToggleLike: (videoId: string) => void;
  onToggleBookmark: (videoId: string) => void;
  onToggleFollow: (name: string) => void;
  onToggleRepost?: (videoId: string) => void;
  onOpenMenu?: () => void;
  onGoBack?: () => void;
  feedContextTitle?: string;
  onGoHome?: () => void;
  businessName?: string | null;
  businessLogoUrl?: string | null;
  businessBannerUrl?: string | null;
  cardRef: (el: HTMLDivElement | null) => void;
  slotRef?: (el: HTMLDivElement | null) => void;
  slotId?: string;
  isSessionAudioUnlocked?: boolean;
  onUnlockAudio?: () => void;
  onRecordView?: (videoId: string) => void;
  unreadCount?: number;
  onScrubStart?: () => void;
  onSeekToPercent?: (percent: number) => void;
  onSeekDelta?: (deltaSeconds: number) => void;
  onScrubEnd?: (percent: number) => void;
  forceShowMenu?: boolean;
  isEmbed?: boolean;
  isBusinessOwnerView?: boolean;
  onOpenOwnerReply?: (video: VideoReview) => void;
  onCloseEmbed?: () => void;
  onPrevVideo?: () => void;
  onNextVideo?: () => void;
  isAtLastVideo?: boolean;
  hideFloatingNav?: boolean;
  commentsOpen?: boolean;
}

export const VideoFeedCard: React.FC<VideoFeedCardProps> = ({
  video,
  index,
  isActive,
  isNear,
  allUsers,
  currentUser,
  places,
  allVideos,
  onActivateCard,
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
  businessName,
  businessLogoUrl,
  businessBannerUrl,
  cardRef,
  slotRef,
  slotId,
  onRecordView,
  unreadCount = 0,
  forceShowMenu = false,
  isEmbed = false,
  onCloseEmbed,
  commentsOpen = false
}) => {
  const { t, language } = useLanguage();
  const safeAuthor = resolveSafeAuthor(video, currentUser, allUsers);
  const computedCommentsCount = Number(video.commentsCount || 0);

  const { effectiveReviewCount, effectiveRating } = React.useMemo(() => {
    let count = 1;
    let ratingVal = getRoundedRating(Number(video.rating) || 5);

    if (allVideos && allVideos.length > 0) {
      const matches = allVideos.filter((v) => {
        if (!v || isPurgedItem(v)) return false;
        return isPlaceReviewMatch(v, {
          id: video.placeId,
          name: video.placeName,
          website: video.placeWebsite
        });
      });
      if (matches.length > 0) {
        count = matches.length;
        const totalRating = matches.reduce((acc, curr) => acc + (getRoundedRating(Number(curr.rating) || 5)), 0);
        ratingVal = totalRating / matches.length;
        return {
          effectiveReviewCount: count,
          effectiveRating: ratingVal.toFixed(1)
        };
      }
    }

    const vCount = Number(computedCommentsCount || (video as any).reviewsCount || (video as any).reviewCount || (video as any).totalReviews || 0);
    if (vCount > 0) count = vCount;

    if (places && places.length > 0) {
      const matchedPlace = places.find((p) => isPlaceReviewMatch(video, p));
      if (matchedPlace) {
        const pCount = Number(matchedPlace.videoReviewCount || matchedPlace.totalReviews || 0);
        if (pCount > 0 && count === 1) count = pCount;
        if (matchedPlace.rating) ratingVal = Number(matchedPlace.rating) || ratingVal;
      }
    }

    return {
      effectiveReviewCount: count,
      effectiveRating: ratingVal.toFixed(1)
    };
  }, [video, places, allVideos, computedCommentsCount]);

  const [showHeartAnimation, setShowHeartAnimation] = useState<boolean>(false);
  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Record view when active for 1s
  useEffect(() => {
    if (isActive && video?.id) {
      const timer = setTimeout(() => {
        onRecordView?.(video.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, video?.id, onRecordView]);

  // High-fidelity photo URL cascade
  const [posterCandidateIdx, setPosterCandidateIdx] = useState(0);
  const posterCandidates = React.useMemo(() => {
    const rawList = resolveVideoPosterCascade(video);
    const proxied = rawList.map((u) => getProxiedImageUrl(u)).filter(Boolean);
    return proxied;
  }, [video]);

  useEffect(() => {
    setPosterCandidateIdx(0);
  }, [video?.id, video?.photoUrl]);

  const hasRealPhoto = posterCandidateIdx < posterCandidates.length;
  const photoUrl = hasRealPhoto ? posterCandidates[posterCandidateIdx] : "";

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
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea") || target.closest('[role="button"]')) {
      return;
    }

    const now = Date.now();
    if (!isActive) {
      lastTapTimeRef.current = now;
      triggerHaptic("selection");
      onActivateCard?.(index);
      return;
    }

    const diff = now - lastTapTimeRef.current;
    if (diff < 340 && diff > 0) {
      lastTapTimeRef.current = 0;
      triggerDoubleTapLike(e.clientX, e.clientY);
    } else {
      lastTapTimeRef.current = now;
    }
  };

  const handleDoubleTapLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerDoubleTapLike(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (photoUrl) {
      preloadImage(photoUrl, isActive ? "high" : "auto");
    }
    if (isActive || isNear) {
      preloadBusinessAssets(video.placeLogoUrl, video.placeBannerUrl, safeAuthor.avatar);
    }
  }, [isActive, isNear, photoUrl, video.placeLogoUrl, video.placeBannerUrl, safeAuthor.avatar]);

  const wholeStarScore = getRoundedRating(Number(video.rating) || 5);

  const reviewJsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: safeAuthor.name
    },
    itemReviewed: {
      "@type": "LocalBusiness",
      name: formatBusinessName(video.placeName)
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: wholeStarScore,
      bestRating: "5",
      worstRating: "1"
    },
    associatedMedia: {
      "@type": "ImageObject",
      name: `${safeAuthor.name} reviews ${formatBusinessName(video.placeName)}`,
      contentUrl: photoUrl || resolveVideoPosterUrl(video),
      uploadDate:
        video.createdAtMs && !isNaN(new Date(video.createdAtMs).getTime())
          ? new Date(video.createdAtMs).toISOString()
          : new Date().toISOString()
    }
  };

  const isExplicitVideoUrl =
    typeof window !== "undefined" &&
    (window.location.pathname.includes("/video/") || window.location.pathname.startsWith("/v/"));

  const cleanDomain = getDisplayUrlAsDomain(video) || "yoouz.com";

  const renderActionButtons = (isDesktop: boolean) => (
    <>
      {/* Creator Avatar */}
      <div className="relative group/avatar mb-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreator(safeAuthor);
          }}
          className={`${
            isDesktop ? "w-12 h-12" : "w-11 h-11 sm:w-12 sm:h-12"
          } rounded-full p-0.5 border border-white/30 hover:border-white/70 active:scale-95 overflow-hidden bg-black transition-all cursor-pointer shadow-xl outline-none select-none`}
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
          id={isDesktop ? `btn-like-desktop-${video.id}` : `btn-like-${video.id}`}
          onClick={() => {
            triggerHaptic(video.isLiked ? "selection" : "medium");
            onToggleLike(video.id);
          }}
          className={`${
            isDesktop
              ? "w-12 h-12 bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700/60 hover:border-zinc-500/80"
              : "w-10 h-10 sm:w-11 sm:h-11 bg-black/50 border-white/20 hover:border-white/50 hover:bg-black/75"
          } rounded-full backdrop-blur-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-xl cursor-pointer`}
          title={t("video.like", "Like")}
        >
          <Heart
            className={`w-5 h-5 md:w-5.5 md:h-5.5 transition-colors ${
              video.isLiked ? "fill-[#ff2d55] text-[#ff2d55] drop-shadow-sm" : "text-white fill-none stroke-[2]"
            }`}
          />
        </button>
        <span className={`text-[11.5px] font-extrabold mt-1 tracking-tight ${isDesktop ? "text-zinc-200" : "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"}`}>
          {typeof video.likesCount === "number" ? video.likesCount : typeof video.likes === "number" ? video.likes : 0}
        </span>
      </div>

      {/* Comments */}
      <div className="flex flex-col items-center">
        <button
          id={isDesktop ? `btn-comments-desktop-${video.id}` : `btn-comments-${video.id}`}
          onClick={() => {
            triggerHaptic("light");
            onOpenComments(video);
          }}
          className={`${
            isDesktop
              ? "w-12 h-12 bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700/60 hover:border-zinc-500/80"
              : "w-10 h-10 sm:w-11 sm:h-11 bg-black/50 border-white/20 hover:border-white/50 hover:bg-black/75"
          } rounded-full backdrop-blur-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-xl cursor-pointer`}
          title={t("video.comments", "Comments")}
        >
          <MessageCircle className="w-5 h-5 md:w-5.5 md:h-5.5 text-white stroke-[2]" />
        </button>
        <span className={`text-[11.5px] font-extrabold mt-1 tracking-tight ${isDesktop ? "text-zinc-200" : "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"}`}>
          {(() => {
            let delSet = new Set<string>();
            try {
              const delRaw = typeof localStorage !== "undefined" ? localStorage.getItem("copo_deleted_comments") : null;
              if (delRaw) delSet = new Set(JSON.parse(delRaw));
            } catch (e) {}

            const videoFromAll = allVideos?.find((v) => v.id === video.id);
            const rawList = (
              Array.isArray(video.comments) && video.comments.length > 0
                ? video.comments
                : Array.isArray(videoFromAll?.comments) && videoFromAll.comments.length > 0
                ? videoFromAll.comments
                : []
            ) as any[];
            const list = rawList.filter((c) => c && c.id && !delSet.has(String(c.id)));
            let computedCount = 0;
            list.forEach((c) => {
              computedCount += 1;
              if (Array.isArray(c.replies)) {
                computedCount += c.replies.filter((r: any) => r && r.id && !delSet.has(String(r.id))).length;
              }
            });
            if (video.ownerResponse && !list.some((c) => c.isOwner || c.id?.startsWith("owner_comm_"))) {
              computedCount += 1;
            }
            const serverCount = typeof computedCommentsCount === "number" ? computedCommentsCount : video.commentsCount || 0;
            return Math.max(computedCount, serverCount);
          })()}
        </span>
      </div>

      {/* Save / Bookmark */}
      <div className="flex flex-col items-center">
        <button
          id={isDesktop ? `btn-bookmark-desktop-${video.id}` : `btn-bookmark-${video.id}`}
          onClick={() => {
            triggerHaptic(video.isBookmarked ? "selection" : "medium");
            onToggleBookmark(video.id);
          }}
          className={`${
            isDesktop
              ? "w-12 h-12 bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700/60 hover:border-zinc-500/80"
              : "w-10 h-10 sm:w-11 sm:h-11 bg-black/50 border-white/20 hover:border-white/50 hover:bg-black/75"
          } rounded-full backdrop-blur-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-xl cursor-pointer`}
          title={t("video.save", "Save Review")}
        >
          <Bookmark
            className={`w-5 h-5 md:w-5.5 md:h-5.5 transition-colors ${
              video.isBookmarked ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-white fill-none stroke-[2]"
            }`}
          />
        </button>
        <span className={`text-[11.5px] font-extrabold mt-1 tracking-tight ${isDesktop ? "text-zinc-200" : "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"}`}>
          {typeof video.bookmarksCount === "number"
            ? video.bookmarksCount
            : typeof (video as any).bookmarks === "number"
            ? (video as any).bookmarks
            : 0}
        </span>
      </div>

      {/* Share */}
      <div className="flex flex-col items-center">
        <button
          id={isDesktop ? `btn-share-desktop-${video.id}` : `btn-share-${video.id}`}
          onClick={() => {
            triggerHaptic("light");
            onOpenShare(video);
          }}
          className={`${
            isDesktop
              ? "w-12 h-12 bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700/60 hover:border-zinc-500/80"
              : "w-10 h-10 sm:w-11 sm:h-11 bg-black/50 border-white/20 hover:border-white/50 hover:bg-black/75"
          } rounded-full backdrop-blur-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-xl cursor-pointer`}
          title={t("video.shareReview", "Share Photo Review")}
        >
          <Share2 className="w-5 h-5 md:w-5.5 md:h-5.5 text-white stroke-[2]" />
        </button>
        <span className={`text-[11.5px] font-extrabold mt-1 tracking-tight ${isDesktop ? "text-zinc-200" : "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"}`}>
          {video.sharesCount || video.shares || 0}
        </span>
      </div>

      {/* More Options */}
      <div className="flex flex-col items-center relative z-50 pointer-events-auto">
        <button
          type="button"
          id={isDesktop ? `btn-more-options-desktop-${video.id}` : `btn-more-options-${video.id}`}
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("light");
            onOpenMoreMenu(video);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          className={`${
            isDesktop
              ? "w-12 h-12 bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700/60 hover:border-zinc-500/80"
              : "w-10 h-10 sm:w-11 sm:h-11 bg-black/50 border-white/20 hover:border-white/50 hover:bg-black/75"
          } rounded-full backdrop-blur-xl border flex items-center justify-center hover:scale-110 transition-all active:scale-90 text-white cursor-pointer touch-manipulation shadow-xl relative z-50 pointer-events-auto`}
          title={t("video.moreOptions", "More options")}
        >
          <MoreHorizontal className="w-5 h-5 md:w-5.5 md:h-5.5 stroke-[2] text-white" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {isActive && isExplicitVideoUrl && (
        <SEOTags
          title={`${safeAuthor.name} at ${formatBusinessName(video.placeName)} | Yoouz`}
          description={`Live photo review (${wholeStarScore}/5 stars) of ${formatBusinessName(video.placeName)} by ${safeAuthor.name} on Yoouz.`}
          image={photoUrl || resolveVideoPosterUrl(video)}
          jsonLd={reviewJsonLd}
          updateTitle={false}
        />
      )}
      <div
        ref={cardRef}
        data-video-index={index}
        id={`copo-feed-item-${video.id}`}
        className={`snap-start snap-always shrink-0 relative select-none flex flex-row items-end justify-center ${
          isEmbed
            ? "w-auto h-full max-h-full"
            : "w-full h-full min-h-full max-h-full md:min-h-0 md:max-h-none md:w-auto md:h-auto"
        }`}
      >
        {/* 1. Main 9:16 Live Photo Frame */}
        <div
          id={`copo-video-card-${video.id}`}
          className={`relative bg-black select-none flex flex-col justify-end group overflow-hidden ${
            isEmbed
              ? "w-auto h-full max-h-full aspect-[9/16] max-w-[min(460px,100%)] rounded-[24px] shadow-2xl border border-zinc-800/90 mx-auto"
              : commentsOpen
              ? "w-full h-full min-h-full max-h-full md:min-h-0 md:max-h-none md:h-auto md:w-[min(470px,calc(min(92cqh,840px)*9/16),calc(100cqw-148px))] md:aspect-[9/16] md:rounded-[24px] md:shadow-2xl md:border md:border-zinc-800/90"
              : "w-full h-full min-h-full max-h-full md:min-h-0 md:max-h-none md:h-auto md:w-[min(480px,calc(min(93cqh,860px)*9/16),calc(100cqw-136px))] md:aspect-[9/16] md:rounded-[24px] md:shadow-2xl md:border md:border-zinc-800/90"
          }`}
        >
          {/* Full-Frame Live Photo */}
          <div
            id={slotId || `video-slot-${video.id}`}
            ref={slotRef}
            data-video-slot="true"
            className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-gradient-to-br from-indigo-950 via-zinc-900 to-black pointer-events-none"
          >
            {/* Rich Brand Backdrop (Never Black) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-indigo-950/90 via-zinc-900 to-zinc-950 z-0">
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white font-black text-2xl mb-3 shadow-2xl">
                {(businessName || video.placeName || "B").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-extrabold text-white tracking-tight">{businessName || formatBusinessName(video.placeName) || "Business Place"}</span>
              <span className="text-xs font-medium text-zinc-400 mt-1">Live Photo Review</span>
            </div>

            {hasRealPhoto ? (
              <img
                src={photoUrl}
                alt={`${formatBusinessName(video.placeName) || "Business"} live photo review by ${safeAuthor.name}`}
                loading={isActive || isNear ? "eager" : "lazy"}
                decoding={isActive || isNear ? "sync" : "async"}
                fetchPriority={isActive ? "high" : "auto"}
                referrerPolicy="no-referrer"
                onError={() => setPosterCandidateIdx((prev) => prev + 1)}
                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none transition-opacity duration-200"
              />
            ) : null}
          </div>

          {/* Double-Tap Interaction Layer */}
          <div
            id={`copo-card-tap-overlay-${video.id}`}
            className="absolute inset-0 z-20 cursor-pointer touch-manipulation select-none"
            onClick={handleCardClick}
            onDoubleClick={handleDoubleTapLike}
            aria-label="Double tap to like photo review"
          />

          {/* Subtle corner-only vignette — leaves the photo crisp and unobstructed */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/25 md:from-black/10 md:via-transparent md:to-black/15 z-10 pointer-events-none" />

          {/* Top Header Overlay: Business Name / Logo */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 md:px-4 pt-3.5 md:pt-4 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 max-w-[calc(100%-16px)]">
              {(onGoBack || onCloseEmbed || isEmbed) && (
                <button
                  type="button"
                  id={`btn-feed-back-${video.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: "YOOUZ_EMBED_CLOSE", action: "close" }, "*");
                        window.parent.postMessage({ type: "YOOUZ_CLOSE_MODAL", action: "close" }, "*");
                        window.parent.postMessage("yoouz_close", "*");
                      }
                    } catch (err) {}

                    if (onCloseEmbed) {
                      onCloseEmbed();
                    } else if (onGoBack) {
                      onGoBack();
                    } else if (document.referrer && !document.referrer.includes(window.location.host)) {
                      window.location.href = document.referrer;
                    } else {
                      try {
                        window.history.replaceState(null, "", buildLocalizedPath("/", language));
                      } catch (err) {}
                      if (window.history && window.history.length > 1) {
                        window.history.back();
                      } else {
                        window.location.href = buildLocalizedPath("/", language);
                      }
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl cursor-pointer shrink-0"
                  title={t("common.goBack", "Go back")}
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}

              {onOpenMenu && (
                <button
                  type="button"
                  id={`btn-mobile-menu-${video.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMenu();
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className={`relative flex ${forceShowMenu ? "" : "md:hidden"} w-10 h-10 rounded-full bg-black/65 hover:bg-black/90 active:scale-90 backdrop-blur-2xl border border-white/20 items-center justify-center text-white shadow-xl transition-all cursor-pointer select-none shrink-0`}
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
              )}

              {/* Top Business Header Badge */}
              <button
                type="button"
                id={`pill-top-place-${video.placeId || video.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const targetPlaceId = extractCleanDomain(video.placeWebsite || video.placeId) || video.placeId || video.placeName || video.id;
                  onOpenPlace(targetPlaceId, video.id);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl sm:rounded-3xl bg-black/75 hover:bg-black/90 backdrop-blur-2xl border border-white/20 hover:border-white/40 text-white transition-all max-w-[300px] sm:max-w-[380px] md:max-w-[440px] text-left cursor-pointer touch-manipulation shadow-2xl active:scale-[0.98] min-w-0 outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent] no-underline"
              >
                {(() => {
                  const cardDom = extractCleanDomain(video.placeWebsite || video.placeId || video.placeName);
                  const cardName =
                    businessName ||
                    formatBusinessName(video?.businessName || video?.placeName || video?.dishOrItem || video?.placeId, cardDom) ||
                    t("common.businessPlace", "Business Place");
                  return (
                    <>
                      <CopoBrandLogo
                        domain={cardDom}
                        name={cardName}
                        website={video.placeWebsite}
                        logoUrl={businessLogoUrl || video?.placeLogoUrl}
                        bannerUrl={businessBannerUrl || video.placeBannerUrl}
                        loading={isActive || isNear ? "eager" : "lazy"}
                        fetchPriority={isActive ? "high" : "auto"}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-white/30 overflow-hidden flex items-center justify-center shrink-0 p-[2px] shadow-md self-center"
                        imageClassName="w-full h-full object-contain rounded-lg sm:rounded-xl"
                        fallbackTextClassName="font-extrabold text-[11px] text-zinc-950"
                      />
                      <div className="min-w-0 flex-1 py-0.5">
                        <span className="leading-snug font-black text-[12.5px] sm:text-[13.5px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-2" dir="auto">
                          {(() => {
                            const fullName = (cardName || "").trim();
                            const words = fullName.split(/\s+/);
                            const lastWord = words.pop() || "";
                            const firstPart = words.join(" ");
                            return (
                              <span className="text-white" dir="auto">
                                {firstPart ? firstPart + " " : ""}
                                <span className="whitespace-nowrap inline-block align-baseline">
                                  {lastWord}
                                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-zinc-950 shrink-0 inline-block align-middle ml-1" />
                                </span>
                              </span>
                            );
                          })()}
                        </span>
                        {!isEmbed && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-extrabold leading-none mt-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                            <span>{effectiveRating}</span>
                            <span className="text-zinc-300 font-normal">
                              ({effectiveReviewCount} {effectiveReviewCount === 1 ? t("common.review", "review") : t("common.reviews", "reviews")})
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </button>
            </div>
          </div>

          {/* Double-tap Heart Animation */}
          {showHeartAnimation && (
            <div
              className="absolute z-40 pointer-events-none flex items-center justify-center animate-in zoom-in-50 fade-in duration-200"
              style={
                heartCoords
                  ? {
                      left: `${heartCoords.x}px`,
                      top: `${heartCoords.y}px`,
                      transform: "translate(-50%, -50%)"
                    }
                  : {
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)"
                    }
              }
            >
              <div className="relative flex items-center justify-center">
                <Heart className="w-28 h-28 fill-[#ff2d55] text-[#ff2d55] drop-shadow-[0_0_25px_rgba(255,45,85,0.85)] animate-bounce" />
                <div className="absolute inset-0 rounded-full bg-pink-500/20 blur-xl animate-ping" />
              </div>
            </div>
          )}

          {/* Bottom Area: Compact Bottom-Left Pill (Reviewer, Timestamp, Stars, Domain) + Mobile Action Rail */}
          <div className="relative z-45 w-full flex items-end justify-between gap-2 px-3 md:px-3.5 pt-2 pointer-events-none copo-video-bottom-metadata select-none">
            <footer
              id={`copo-video-bottom-info-${video.id}`}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto w-fit max-w-full min-w-0 inline-flex flex-col gap-1 px-3.5 py-2 rounded-2xl sm:rounded-3xl bg-black/75 hover:bg-black/85 backdrop-blur-2xl border border-white/20 text-white shadow-2xl transition-all"
            >
              <div className="flex flex-col gap-1 min-w-0">
                {/* Line 1: Reviewer Anonymous ID / Username + Verified Badge + Timestamp */}
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCreator(safeAuthor);
                    }}
                    className="font-black text-white text-[13px] sm:text-[13.5px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] flex items-center gap-1.5 no-underline hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer bg-transparent border-0 p-0 text-left w-fit max-w-full outline-none focus:outline-none focus:ring-0 select-none [-webkit-tap-highlight-color:transparent]"
                    title={`${t("video.viewProfile", "View Profile")} - ${safeAuthor.name}`}
                  >
                    <span className="whitespace-nowrap truncate leading-tight no-underline">{safeAuthor.name}</span>
                    {Boolean(safeAuthor?.passkeyProtected) && (
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                    )}
                  </button>
                  {(video.recordedAt || video.createdAtMs) && (
                    <>
                      <span className="text-zinc-400 text-[11px] select-none">•</span>
                      <span className="text-zinc-300 text-[11px] sm:text-[11.5px] font-semibold whitespace-nowrap">
                        {formatRecordedDate(video.recordedAt, video.createdAtMs)}
                      </span>
                    </>
                  )}
                </div>

                {/* Line 2: Strict Whole-Number Solid Star Rating (1-5) + Clickable Domain */}
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <CopoStarRating
                    rating={wholeStarScore}
                    starClassName="w-3.5 h-3.5"
                    filledColorClass="fill-amber-400 text-amber-400 drop-shadow-sm"
                    emptyColorClass="fill-zinc-700/70 text-zinc-400/70"
                  />
                  {cleanDomain && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetPlaceId =
                          extractCleanDomain(video.placeWebsite || video.placeId) ||
                          video.placeId ||
                          video.placeName ||
                          cleanDomain ||
                          video.id;
                        onOpenPlace(targetPlaceId, video.id);
                      }}
                      className="inline-flex items-center gap-1 text-zinc-200 hover:text-white active:opacity-75 transition-colors cursor-pointer text-[11.5px] sm:text-[12px] font-semibold truncate max-w-[180px] sm:max-w-[220px]"
                      title={`${cleanDomain}`}
                    >
                      <Globe className="w-3 h-3 text-zinc-300 shrink-0" />
                      <span className="truncate">{cleanDomain}</span>
                    </button>
                  )}
                </div>
              </div>
            </footer>

            {/* MOBILE ONLY: Right Side Action Column */}
            <aside
              id={`copo-video-actions-col-${video.id}`}
              onClick={(e) => e.stopPropagation()}
              className="md:hidden relative z-50 flex flex-col items-center gap-2.5 sm:gap-3 text-white pointer-events-auto shrink-0"
            >
              {renderActionButtons(false)}
            </aside>
          </div>
        </div>

        {/* 2. DESKTOP ONLY: Action Buttons Column */}
        {!isEmbed && (
          <aside
            id={`copo-desktop-actions-${video.id}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden md:flex flex-col items-center gap-3.5 ml-3.5 mb-2.5 z-30 shrink-0 select-none text-white pointer-events-auto"
          >
            {renderActionButtons(true)}
          </aside>
        )}
      </div>
    </>
  );
};
