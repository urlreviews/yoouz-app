import React, { useRef, useState, useEffect, useCallback } from "react";
import { useGlobalMute } from "../hooks/useGlobalMute";
import { prefetchVideo } from "../utils/videoPrefetcher";
import { resolvePlayableVideoSource, resolveVideoPosterUrl } from "../utils/videoUtils";
import { VideoFeedCard } from "./VideoFeedCard";
import { getVideoBlobFromIndexedDB } from "../lib/videoStorage";
import {
  ChevronUp,
  ChevronDown,
  Video,
  Flag,
  MoreHorizontal,
  EyeOff,
  Share2,
  MapPin,
  User,
  X,
  Trash2,
  Star,
  Edit3,
  Check,
  Sparkles,
  Loader2
} from "lucide-react";
import { VideoReview, FeedSubTab, VideoAuthor, Place } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { isAuthorMatch, formatBusinessName } from "../utils/placeUtils";

interface CopoVideoPlayerProps {
  videos: VideoReview[];
  isLoading?: boolean;
  places?: Place[];
  currentIndex: number;
  onSelectVideoIndex: (index: number) => void;
  activeSubTab: FeedSubTab;
  onSelectSubTab: (tab: FeedSubTab) => void;
  onOpenComments: (video: VideoReview) => void;
  onOpenPlace: (placeId: string) => void;
  onOpenCreator: (author: VideoAuthor) => void;
  onOpenShare: (video: VideoReview) => void;
  onToggleLike: (videoId: string) => void;
  onToggleBookmark: (videoId: string) => void;
  onToggleFollow: (handle: string) => void;
  onToggleRepost?: (videoId: string) => void;
  onOpenReport?: (video: VideoReview) => void;
  onHideVideo?: (videoId: string) => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  feedContextTitle?: string;
  onOpenCreateModal?: () => void;
  onOpenMenu?: () => void;
  onLoadMore?: () => void;
  currentUser?: any;
  onDeleteVideo?: (videoId: string) => void;
  onUpdateVideoReview?: (videoId: string, updates: { rating?: number; caption?: string; dishOrItem?: string; tags?: string[] }) => void;
  isPaused?: boolean;
  contextKey?: string;
}

export const CopoVideoPlayer: React.FC<CopoVideoPlayerProps> = ({
  videos,
  isLoading,
  places,
  currentIndex,
  onSelectVideoIndex,
  activeSubTab,
  onSelectSubTab,
  onOpenComments,
  onOpenPlace,
  onOpenCreator,
  onOpenShare,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  onOpenReport,
  onHideVideo,
  onGoHome,
  onGoBack,
  feedContextTitle,
  onOpenCreateModal,
  onOpenMenu,
  onLoadMore,
  currentUser,
  onDeleteVideo,
  onUpdateVideoReview,
  isPaused = false,
  contextKey
}) => {
  const currentVideo = videos[currentIndex] || videos[0];
  const [isMuted, setIsMuted] = useGlobalMute();
  const [moreMenuVideo, setMoreMenuVideo] = useState<VideoReview | null>(null);
  const [hasUserStartedFeed, setHasUserStartedFeed] = useState<boolean>(false);

  // Reset when navigating pages or sub-tabs
  useEffect(() => {
    setHasUserStartedFeed(false);
  }, [activeSubTab, contextKey]);

  // Edit Rating State
  const [editingReviewVideo, setEditingReviewVideo] = useState<VideoReview | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [localBlobUrls, setLocalBlobUrls] = useState<Record<string, string>>({});

  // Asynchronously resolve IndexedDB blob URLs for all loaded videos to feed them synchronously to the children cards
  useEffect(() => {
    let active = true;
    if (videos && videos.length > 0) {
      videos.forEach((vid) => {
        if (vid?.id && !localBlobUrls[vid.id]) {
          getVideoBlobFromIndexedDB(vid.id).then((url) => {
            if (active && url) {
              setLocalBlobUrls((prev) => ({
                ...prev,
                [vid.id]: url
              }));
              console.log(`⚡ [CopoVideoPlayer] Pre-bound blob URL for ${vid.id}`);
            }
          });
        }
      });
    }
    return () => {
      active = false;
    };
  }, [videos]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(currentIndex);

  // Sync ref
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Web Audio API session unlocker to guarantee audio permission
  const unlockAudioSession = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!(window as any).__copoAudioCtx) {
          (window as any).__copoAudioCtx = new AudioCtx();
        }
        if ((window as any).__copoAudioCtx.state === "suspended") {
          (window as any).__copoAudioCtx.resume();
        }
      }
    } catch (e) {}
  }, []);

  // Listen to all touch/click interactions to prime audio context
  useEffect(() => {
    const onUserGesture = () => {
      unlockAudioSession();
    };
    window.addEventListener("touchstart", onUserGesture, { passive: true });
    window.addEventListener("touchend", onUserGesture, { passive: true });
    window.addEventListener("click", onUserGesture, { passive: true });
    window.addEventListener("keydown", onUserGesture, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onUserGesture);
      window.removeEventListener("touchend", onUserGesture);
      window.removeEventListener("click", onUserGesture);
      window.removeEventListener("keydown", onUserGesture);
    };
  }, [unlockAudioSession]);

  // Compute Place Logo Map for fast lookups
  const getLogoForVideo = useCallback(
    (vid: VideoReview | undefined): string | null => {
      if (!vid) return null;

      if (places && vid.placeId) {
        const p = places.find((place) => place.id === vid.placeId);
        if (p) {
          const logo = getPlaceLogoUrl(p);
          if (logo) return logo;
        }
      }

      if (vid.placeLogoUrl || vid.placeWebsite) {
        return getCleanLogoUrl(vid.placeLogoUrl, vid.placeWebsite);
      }

      if (vid.placeName) {
        return getPlaceLogoUrl({
          name: vid.placeName,
          website: vid.placeName.includes(".") ? vid.placeName : undefined
        });
      }

      return null;
    },
    [places]
  );

  const getBannerForVideo = useCallback(
    (vid: VideoReview | undefined): string | null => {
      if (!vid) return null;
      if (vid.placeBannerUrl) return vid.placeBannerUrl;

      if (places && vid.placeId) {
        const p = places.find((place) => place.id === vid.placeId);
        if (p) return p.bannerUrl || p.ogImage || null;
      }

      return null;
    },
    [places]
  );

  // Pre-fetch upcoming videos for fast transitions (TikTok/Shorts sliding window)
  useEffect(() => {
    const next1 = currentIndex + 1;
    const next2 = currentIndex + 2;
    const next3 = currentIndex + 3;
    const prev1 = currentIndex - 1;
    const prev2 = currentIndex - 2;

    [currentIndex, next1, next2, next3, prev1, prev2].forEach((idx) => {
      if (idx >= 0 && idx < videos.length) {
        const v = videos[idx];
        if (v) {
          const src = resolvePlayableVideoSource(v);
          const poster = resolveVideoPosterUrl(v);
          if (src && !src.startsWith("blob:")) {
            prefetchVideo(src, poster);
          }
        }
      }
    });

    if (videos.length > 0 && currentIndex >= videos.length - 3) {
      onLoadMore?.();
    }
  }, [currentIndex, videos, onLoadMore]);

  // IntersectionObserver: 0.55 visibility threshold for instant active card selection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute("data-video-index");
            if (idxAttr !== null) {
              const idx = parseInt(idxAttr, 10);
              if (!isNaN(idx) && idx !== currentIndexRef.current) {
                currentIndexRef.current = idx;
                onSelectVideoIndex(idx);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.55
      }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [videos, onSelectVideoIndex]);

  // Scroll to currentIndex when changed via keyboard or floating arrow buttons
  useEffect(() => {
    if (isProgrammaticScrollRef.current) {
      const cardEl = cardRefs.current[currentIndex];
      if (cardEl && containerRef.current) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      
      const timeout = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      isProgrammaticScrollRef.current = true;
      onSelectVideoIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      isProgrammaticScrollRef.current = true;
      onSelectVideoIndex(currentIndex - 1);
    }
  };

  // MediaSession Next/Prev Skip Action Handlers for Lock Screen
  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          handleNext();
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          handlePrev();
        });
      } catch (e) {}
    }
  }, [currentIndex, videos.length]);

  // Sound toggle with localStorage caching
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHasUserStartedFeed(true);
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem("yoouz_sound_muted", String(nextMuted));
    } catch {}
    unlockAudioSession();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (
        document.body.style.overflow === "hidden" ||
        moreMenuVideo !== null ||
        document.querySelector(
          "#yoouz-report-modal-overlay, #yoouz-report-modal-dialog, [role='dialog'], [id*='modal'], [id*='dialog'], #google-maps-business-panel, #google-maps-creator-panel, #copo-comments-drawer"
        ) !== null
      ) {
        return;
      }

      if (
        e.target instanceof HTMLElement &&
        e.target.closest("[role='dialog'], .fixed, [id*='modal'], [id*='drawer']")
      ) {
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, videos.length, isMuted, moreMenuVideo]);

  if (!currentVideo) {
    if (isLoading) {
      return (
        <main
          id="copo-loading-feed-container"
          className="flex-1 h-full flex items-center justify-center relative overflow-hidden bg-black md:bg-zinc-100 p-0 md:p-3"
        >
          <div className="w-full h-full md:w-full md:max-w-[400px] lg:w-[420px] lg:max-w-none md:h-[92vh] md:max-h-[880px] bg-zinc-900 md:rounded-3xl overflow-hidden md:shadow-2xl md:border md:border-zinc-800 flex flex-col justify-between p-6 animate-pulse relative">
            <div className="flex justify-between items-start z-10 w-full pt-12 md:pt-4">
              <div className="h-7 w-36 bg-white/20 rounded-full" />
              <div className="h-10 w-10 bg-white/20 rounded-full" />
            </div>
            <div className="flex justify-between items-end z-10 w-full mb-16 md:mb-6">
              <div className="flex flex-col gap-3">
                <div className="h-7 w-52 bg-white/20 rounded-lg" />
                <div className="h-5 w-64 bg-white/20 rounded-lg" />
              </div>
              <div className="flex flex-col gap-4 items-center">
                <div className="h-12 w-12 bg-white/20 rounded-full" />
                <div className="h-12 w-12 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main
        id="copo-empty-feed-container"
        className="flex-1 h-full flex items-center justify-center relative p-3 overflow-hidden bg-zinc-100"
      >
        <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[85vh] max-h-[850px] bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl border border-zinc-200">
          <div className="w-20 h-20 rounded-[28px] bg-[#1a73e8] shadow-[0_8px_24px_rgba(26,115,232,0.4)] flex items-center justify-center text-white mb-6">
            <Video className="w-10 h-10 text-white" />
          </div>
          <span className="inline-block px-3 py-1 bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Real Users Only
          </span>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            No Video Reviews Yet
          </h2>
          <p className="text-sm text-zinc-500 max-w-[280px] mb-8 leading-relaxed">
            Record the first authentic 60-second video review for any business or place!
          </p>
          {onOpenCreateModal && (
            <button
              id="copo-empty-state-record-btn"
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-full shadow-lg shadow-[#1a73e8]/25 active:scale-95 transition-all text-sm"
            >
              <Video className="w-4 h-4" />
              Record Video Review
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main
      id="copo-main-feed-container"
      className="flex-1 h-full flex items-center justify-center relative overflow-hidden bg-black md:bg-zinc-100 select-none"
    >
      <div className="w-full h-full md:h-auto md:w-full md:max-w-[400px] lg:w-auto lg:max-w-none flex items-center md:justify-center gap-4 relative md:max-h-[98vh] md:p-3">
        {/* Scroll Snap Feed Container */}
        <div
          ref={containerRef}
          className="w-full h-full md:h-[92vh] md:max-h-[880px] overflow-y-scroll snap-y snap-mandatory touch-pan-y no-scrollbar hide-scrollbar [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] flex flex-col md:gap-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {videos.map((vid, idx) => {
            const isCardActive = idx === currentIndex && !isPaused;
            const isCardNear = idx === currentIndex + 1;

            return (
              <VideoFeedCard
                key={vid.id}
                video={vid}
                index={idx}
                isActive={isCardActive}
                isNear={isCardNear}
                isMuted={isMuted}
                activeSubTab={activeSubTab}
                onSelectSubTab={onSelectSubTab}
                hasUserStartedFeed={hasUserStartedFeed}
                onStartFeed={() => setHasUserStartedFeed(true)}
                localBlobUrl={localBlobUrls[vid.id] || null}
                onToggleMute={toggleMute}
                onForceMute={() => setIsMuted(true)}
                onOpenComments={onOpenComments}
                onOpenPlace={onOpenPlace}
                onOpenCreator={onOpenCreator}
                onOpenShare={onOpenShare}
                onOpenMoreMenu={setMoreMenuVideo}
                onToggleLike={onToggleLike}
                onToggleBookmark={onToggleBookmark}
                onToggleFollow={onToggleFollow}
                onOpenMenu={onOpenMenu}
                onGoBack={onGoBack}
                feedContextTitle={feedContextTitle}
                onGoHome={onGoHome}
                businessLogoUrl={getLogoForVideo(vid)}
                businessBannerUrl={getBannerForVideo(vid)}
                cardRef={(el) => {
                  cardRefs.current[idx] = el;
                }}
              />
            );
          })}
        </div>

        {/* Floating Up/Down Navigation Buttons (Desktop) */}
        <div
          id="copo-floating-nav-buttons"
          className="hidden sm:flex flex-col gap-3 z-30"
        >
          <button
            id="btn-scroll-prev-video"
            onClick={handlePrev}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-zinc-300 flex items-center justify-center text-zinc-800 hover:bg-white hover:text-zinc-950 hover:border-zinc-400 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            title="Previous Video (Up Arrow)"
          >
            <ChevronUp className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            id="btn-scroll-next-video"
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-zinc-300 flex items-center justify-center text-zinc-800 hover:bg-white hover:text-zinc-950 hover:border-zinc-400 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            title="Next Video (Down Arrow)"
          >
            <ChevronDown className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* More Options Modal */}
      {moreMenuVideo && (
        <div
          id="copo-more-options-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onClick={() => setMoreMenuVideo(null)}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            id="copo-more-options-modal"
            className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-white animate-in slide-in-from-bottom-5 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 line-clamp-1">
                    {formatBusinessName(moreMenuVideo?.placeName) || "Business Place"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Review by {moreMenuVideo?.author?.name || "Verified Reviewer"}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-more-options"
                onClick={() => setMoreMenuVideo(null)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="p-3 space-y-1.5 max-h-[70vh] overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Check if current user is owner of the video */}
              {Boolean(
                moreMenuVideo &&
                  currentUser &&
                  (isAuthorMatch(moreMenuVideo, currentUser) ||
                    (currentUser.email && (moreMenuVideo?.userId === currentUser.email || (moreMenuVideo as any)?.userEmail === currentUser.email)) ||
                    moreMenuVideo.author?.name === "me" ||
                    moreMenuVideo.userId === "me")
              ) ? (
                /* OWNER ACTIONS: Edit Star Rating & Review, Share, View Place, Delete */
                <>
                  <button
                    id="btn-more-option-edit-rating"
                    onClick={() => {
                      setEditRating(Math.round(moreMenuVideo.rating) || 5);
                      setEditingReviewVideo(moreMenuVideo);
                      setMoreMenuVideo(null);
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all text-left font-semibold text-sm cursor-pointer shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-amber-200">Edit Star Rating & Review</div>
                      <div className="text-xs text-amber-400/80 font-normal">
                        Update your score ({moreMenuVideo.rating.toFixed(1)} ★) & place rating
                      </div>
                    </div>
                  </button>

                  <button
                    id="btn-more-option-share-owner"
                    onClick={() => {
                      const v = moreMenuVideo;
                      setMoreMenuVideo(null);
                      if (v) onOpenShare(v);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-zinc-400" />
                    <span>Share Video Review Link</span>
                  </button>

                  <button
                    id="btn-more-option-view-place-owner"
                    onClick={() => {
                      const pid = moreMenuVideo.placeId;
                      setMoreMenuVideo(null);
                      if (pid) onOpenPlace(pid);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>View Business Info & All Reviews</span>
                  </button>

                  <div className="my-2 border-t border-zinc-800" />

                  <button
                    id="btn-more-option-delete"
                    onClick={() => {
                      const idToDelete = moreMenuVideo.id;
                      setMoreMenuVideo(null);
                      if (idToDelete && onDeleteVideo) {
                        onDeleteVideo(idToDelete);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors text-left font-medium text-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Delete Video Review</span>
                  </button>
                </>
              ) : (
                /* VIEWER ACTIONS: Share, View Place, View Creator, Report, Not Interested */
                <>
                  <button
                    id="btn-more-option-share"
                    onClick={() => {
                      const v = moreMenuVideo;
                      setMoreMenuVideo(null);
                      if (v) onOpenShare(v);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-zinc-400" />
                    <span>Share Video Review</span>
                  </button>

                  <button
                    id="btn-more-option-view-place"
                    onClick={() => {
                      const pid = moreMenuVideo.placeId;
                      setMoreMenuVideo(null);
                      if (pid) onOpenPlace(pid);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>View Place Info & All Reviews</span>
                  </button>

                  {moreMenuVideo.author && (
                    <button
                      id="btn-more-option-view-creator"
                      onClick={() => {
                        const author = moreMenuVideo.author;
                        setMoreMenuVideo(null);
                        if (author) onOpenCreator(author);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>View Creator Profile ({moreMenuVideo.author.name})</span>
                    </button>
                  )}

                  <div className="my-2 border-t border-zinc-800" />

                  {onHideVideo && (
                    <button
                      id="btn-more-option-hide"
                      onClick={() => {
                        const vidId = moreMenuVideo.id;
                        setMoreMenuVideo(null);
                        if (vidId) onHideVideo(vidId);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-400 cursor-pointer"
                    >
                      <EyeOff className="w-4 h-4 text-zinc-400" />
                      <span>Not interested in this video</span>
                    </button>
                  )}

                  {onOpenReport && (
                    <button
                      id="btn-more-option-report"
                      onClick={() => {
                        const v = moreMenuVideo;
                        setMoreMenuVideo(null);
                        if (v) onOpenReport(v);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors text-left font-medium text-sm cursor-pointer"
                    >
                      <Flag className="w-4 h-4 text-red-400" />
                      <span>Report Video Review</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Star Rating & Review Modal */}
      {editingReviewVideo && (
        <div
          id="copo-edit-rating-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in overscroll-contain"
          onClick={() => !isSavingEdit && setEditingReviewVideo(null)}
        >
          <div
            id="copo-edit-rating-modal"
            className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">
                    Edit Your Review Rating
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Instant live recalculation across all places
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-edit-rating"
                disabled={isSavingEdit}
                onClick={() => setEditingReviewVideo(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Target Place Information */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white truncate">
                    {formatBusinessName(editingReviewVideo.placeName) || "Business"}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {editingReviewVideo.placeCity || editingReviewVideo.placeAddress || "Verified Business Review"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    {(() => {
                      const val = hoverRating || editRating;
                      switch (val) {
                        case 5: return "Exceptional";
                        case 4: return "Great Experience";
                        case 3: return "Good / Average";
                        case 2: return "Needs Work";
                        case 1: return "Poor Experience";
                        default: return "Selected";
                      }
                    })()}
                  </span>
                </div>
              </div>

              {/* Star Rating Interactive Selector */}
              <div className="space-y-4 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/90">
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Tap to Select Stars (1 to 5)
                  </span>
                  <div className="text-base font-black text-amber-400 mt-1">
                    {(() => {
                      const val = hoverRating || editRating;
                      switch (val) {
                        case 5: return "⭐⭐⭐⭐⭐ Exceptional (5.0)";
                        case 4: return "⭐⭐⭐⭐ Great Experience (4.0)";
                        case 3: return "⭐⭐⭐ Good / Average (3.0)";
                        case 2: return "⭐⭐ Needs Improvement (2.0)";
                        case 1: return "⭐ Poor Experience (1.0)";
                        default: return `${val.toFixed(1)} Stars`;
                      }
                    })()}
                  </div>
                </div>

                {/* 5 Interactive Glowing Stars */}
                <div className="flex items-center justify-center gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const activeVal = hoverRating || editRating;
                    const isFilled = starNum <= activeVal;
                    return (
                      <button
                        key={starNum}
                        type="button"
                        id={`btn-select-rating-star-${starNum}`}
                        onClick={() => setEditRating(starNum)}
                        onMouseEnter={() => setHoverRating(starNum)}
                        onMouseLeave={() => setHoverRating(null)}
                        className={`p-2 rounded-2xl transition-all cursor-pointer transform hover:scale-115 active:scale-95 ${
                          isFilled
                            ? "text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.6)]"
                            : "text-zinc-600 hover:text-zinc-400"
                        }`}
                        title={`Rate ${starNum} Stars`}
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            isFilled ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between px-2 text-[11px] font-bold text-zinc-500">
                  <span>1 Star (Poor)</span>
                  <span>5 Stars (Exceptional)</span>
                </div>
              </div>

              {/* Note on live recalculation */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-blue-400" />
                </div>
                <p className="text-xs text-blue-200/90 leading-relaxed font-normal">
                  Changing your rating will automatically recalculate the overall average score for <strong className="font-semibold text-blue-100">{formatBusinessName(editingReviewVideo.placeName) || "this business"}</strong> across all verified reviews.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  id="btn-cancel-edit-rating"
                  disabled={isSavingEdit}
                  onClick={() => setEditingReviewVideo(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-save-edit-rating"
                  disabled={isSavingEdit}
                  onClick={async () => {
                    if (!editingReviewVideo || !onUpdateVideoReview) return;
                    setIsSavingEdit(true);
                    try {
                      await onUpdateVideoReview(editingReviewVideo.id, {
                        rating: editRating
                      });
                      setSaveSuccess(true);
                      setTimeout(() => {
                        setIsSavingEdit(false);
                        setEditingReviewVideo(null);
                        setSaveSuccess(false);
                      }, 500);
                    } catch (err) {
                      setIsSavingEdit(false);
                    }
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm transition-all shadow-lg shadow-[#1a73e8]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Updated!</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-white text-white" />
                      <span>Save Rating</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
