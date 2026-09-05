import React, { useRef, useState, useEffect, useCallback } from "react";
import { useGlobalMute, ensureSharedAudioContextUnlocked } from "../hooks/useGlobalMute";
import { prefetchVideo, prefetchUpcomingVideos } from "../utils/videoPrefetcher";
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
  Loader2,
  RotateCcw,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Plus
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
  allUsers?: any[];
  onDeleteVideo?: (videoId: string) => void;
  onUpdateVideoReview?: (videoId: string, updates: { rating?: number; caption?: string; dishOrItem?: string; tags?: string[] }) => void;
  isPaused?: boolean;
  contextKey?: string;
  onRecordView?: (videoId: string) => void;
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
  allUsers,
  onDeleteVideo,
  onUpdateVideoReview,
  isPaused = false,
  contextKey,
  onRecordView
}) => {
  const currentVideo = videos[Math.min(currentIndex, Math.max(0, videos.length - 1))] || videos[0];
  const [isMuted, setIsMuted, isSessionAudioUnlocked, unlockAudioSession] = useGlobalMute();
  const [moreMenuVideo, setMoreMenuVideo] = useState<VideoReview | null>(null);

  // Edit Rating State
  const [editingReviewVideo, setEditingReviewVideo] = useState<VideoReview | null>(null);
  const [videoConfirmDelete, setVideoConfirmDelete] = useState<VideoReview | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [localBlobUrls, setLocalBlobUrls] = useState<Record<string, string>>({});

  // Safety clamp if a video deletion causes currentIndex to exceed new feed bounds
  useEffect(() => {
    const maxIdx = videos.length > 0 ? videos.length : 0;
    if (currentIndex > maxIdx) {
      onSelectVideoIndex(maxIdx);
    }
  }, [videos.length, currentIndex, onSelectVideoIndex]);

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

  const mainRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef<number>(currentIndex);
  const lastObserverIndexRef = useRef<number>(currentIndex);

  // Sync ref
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Robust programmatic scroll function that guarantees instant synchronization
  const scrollToCard = useCallback(
    (targetIndex: number, behavior: ScrollBehavior = "smooth") => {
      const maxIdx = videos.length > 0 ? videos.length : 0;
      if (targetIndex < 0 || targetIndex > maxIdx) return;

      // Update refs and trigger state change immediately to prevent race conditions
      const isJump = Math.abs(targetIndex - currentIndexRef.current) > 1;
      currentIndexRef.current = targetIndex;
      lastObserverIndexRef.current = targetIndex;
      onSelectVideoIndex(targetIndex);

      const cardEl = cardRefs.current[targetIndex];
      const container = containerRef.current;
      if (cardEl && container) {
        isProgrammaticScrollRef.current = true;
        const targetTop = cardEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: targetTop, behavior: isJump ? "auto" : behavior });

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
      }
    },
    [videos.length, onSelectVideoIndex]
  );

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
    prefetchUpcomingVideos(videos, currentIndex);

    if (videos.length > 0 && currentIndex >= videos.length - 3) {
      onLoadMore?.();
    }
  }, [currentIndex, videos, onLoadMore]);

  // Ultra-responsive IntersectionObserver index detection (matches app.copo.st active claim threshold)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.45
        );
        if (visibleEntries.length === 0) return;

        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const bestEntry = visibleEntries[0];

        const idxAttr = bestEntry.target.getAttribute("data-video-index");
        if (idxAttr !== null) {
          const idx = parseInt(idxAttr, 10);
          const maxIdx = videos.length > 0 ? videos.length : 0;
          if (!isNaN(idx) && idx >= 0 && idx <= maxIdx && idx !== currentIndexRef.current) {
            currentIndexRef.current = idx;
            lastObserverIndexRef.current = idx;
            onSelectVideoIndex(idx);
            if (idx < videos.length) {
              prefetchUpcomingVideos(videos, idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: [0.3, 0.45, 0.75]
      }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [videos, onSelectVideoIndex]);

  // Zero-Latency Frame-Synchronized Settle Engine
  // Real-time scroll frame updates via requestAnimationFrame ensuring zero delay on mobile swipes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const syncScrollIndex = () => {
      if (isProgrammaticScrollRef.current || !container) return;
      const containerHeight = container.clientHeight;
      if (!containerHeight || containerHeight <= 0) return;

      const settledIndex = Math.round(container.scrollTop / containerHeight);
      const maxIdx = videos.length > 0 ? videos.length : 0;
      if (
        settledIndex >= 0 &&
        settledIndex <= maxIdx &&
        settledIndex !== currentIndexRef.current
      ) {
        currentIndexRef.current = settledIndex;
        lastObserverIndexRef.current = settledIndex;
        onSelectVideoIndex(settledIndex);
        if (settledIndex < videos.length) {
          prefetchUpcomingVideos(videos, settledIndex);
        }
      }
    };

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncScrollIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("scrollend", syncScrollIndex, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("scrollend", syncScrollIndex);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [videos, onSelectVideoIndex]);

  // app.copo.st Touch Gesture Engine: 15% swipe height threshold & instant flick transition
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let isTouchActive = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      touchStartTime = Date.now();
      isTouchActive = true;

      // Authorize audio subsystem inside active user gesture
      if (isSessionAudioUnlocked && !isMuted) {
        ensureSharedAudioContextUnlocked();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouchActive || e.changedTouches.length !== 1) return;
      isTouchActive = false;

      // Ensure audio permission is propagated during touch completion
      if (isSessionAudioUnlocked && !isMuted) {
        ensureSharedAudioContextUnlocked();
      }

      const touch = e.changedTouches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = touch.clientX - touchStartX;
      const elapsed = Date.now() - touchStartTime;
      const containerHeight = container.clientHeight || window.innerHeight;

      // Only handle if movement was predominantly vertical
      if (Math.abs(deltaY) < Math.abs(deltaX) * 1.2) return;

      const swipeRatio = Math.abs(deltaY) / containerHeight;
      // 15% distance threshold OR fast flick (>35px in <300ms) matching app.copo.st
      const isSignificantSwipe = swipeRatio >= 0.15 || (Math.abs(deltaY) >= 35 && elapsed < 300);

      if (isSignificantSwipe) {
        const maxIdx = videos.length > 0 ? videos.length : 0;
        let targetIdx = currentIndexRef.current;
        if (deltaY < 0) {
          // Swiped UP -> Next video or End Card
          if (currentIndexRef.current < maxIdx) {
            targetIdx = currentIndexRef.current + 1;
          }
        } else {
          // Swiped DOWN -> Prev video (stops at first video, does not loop to end)
          if (currentIndexRef.current > 0) {
            targetIdx = currentIndexRef.current - 1;
          }
        }

        if (targetIdx !== currentIndexRef.current) {
          // 1. Immediately pause & mute current video to release audio pipeline cleanly
          const currentCard = cardRefs.current[currentIndexRef.current];
          const currentVid = currentCard?.querySelector<HTMLVideoElement>("video");
          if (currentVid) {
            try {
              currentVid.pause();
              currentVid.muted = true;
            } catch (e) {}
          }

          // 2. Pre-authorize target video playback SYNCHRONOUSLY inside this active touch gesture
          if (targetIdx < videos.length) {
            const targetCard = cardRefs.current[targetIdx];
            const targetVid = targetCard?.querySelector<HTMLVideoElement>("video");
            if (targetVid) {
              const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
              targetVid.muted = shouldBeMuted;
              if (!shouldBeMuted) {
                targetVid.volume = 1;
              }
              const p = targetVid.play();
              if (p !== undefined) {
                p.catch(() => {});
              }
            }
          }

          scrollToCard(targetIdx, "smooth");
        }
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [videos.length, scrollToCard, isSessionAudioUnlocked, isMuted]);

  // Scroll to currentIndex when changed from outside (e.g. initial load, drawer switches, subtabs)
  useEffect(() => {
    if (currentIndex !== lastObserverIndexRef.current) {
      const isJump = Math.abs(currentIndex - currentIndexRef.current) > 1;
      lastObserverIndexRef.current = currentIndex;
      currentIndexRef.current = currentIndex;

      const cardEl = cardRefs.current[currentIndex];
      const container = containerRef.current;
      if (cardEl && container) {
        isProgrammaticScrollRef.current = true;
        const targetTop = cardEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: targetTop, behavior: isJump ? "auto" : "smooth" });

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
      }
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (isSessionAudioUnlocked && !isMuted) {
      ensureSharedAudioContextUnlocked();
    }
    const maxIdx = videos.length > 0 ? videos.length : 0;
    if (currentIndexRef.current < maxIdx) {
      const nextIdx = currentIndexRef.current + 1;

      // Pause & mute current video
      const currentCard = cardRefs.current[currentIndexRef.current];
      const currentVid = currentCard?.querySelector<HTMLVideoElement>("video");
      if (currentVid) {
        try {
          currentVid.pause();
          currentVid.muted = true;
        } catch (e) {}
      }

      // Pre-authorize next video playback synchronously in click gesture
      if (nextIdx < videos.length) {
        const targetCard = cardRefs.current[nextIdx];
        const targetVid = targetCard?.querySelector<HTMLVideoElement>("video");
        if (targetVid) {
          const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
          targetVid.muted = shouldBeMuted;
          if (!shouldBeMuted) targetVid.volume = 1;
          const p = targetVid.play();
          if (p !== undefined) p.catch(() => {});
        }
      }

      scrollToCard(nextIdx, "smooth");
    }
  }, [videos.length, scrollToCard, isSessionAudioUnlocked, isMuted]);

  const handlePrev = useCallback(() => {
    if (isSessionAudioUnlocked && !isMuted) {
      ensureSharedAudioContextUnlocked();
    }
    if (currentIndexRef.current > 0) {
      const prevIdx = currentIndexRef.current - 1;

      // Pause & mute current video
      const currentCard = cardRefs.current[currentIndexRef.current];
      const currentVid = currentCard?.querySelector<HTMLVideoElement>("video");
      if (currentVid) {
        try {
          currentVid.pause();
          currentVid.muted = true;
        } catch (e) {}
      }

      // Pre-authorize prev video playback synchronously in click gesture
      const targetCard = cardRefs.current[prevIdx];
      const targetVid = targetCard?.querySelector<HTMLVideoElement>("video");
      if (targetVid) {
        const shouldBeMuted = isMuted || !isSessionAudioUnlocked;
        targetVid.muted = shouldBeMuted;
        if (!shouldBeMuted) targetVid.volume = 1;
        const p = targetVid.play();
        if (p !== undefined) p.catch(() => {});
      }

      scrollToCard(prevIdx, "smooth");
    }
  }, [scrollToCard, isSessionAudioUnlocked, isMuted]);

  // Desktop Mouse Wheel & Trackpad Navigation: smoothly step strictly 1 video at a time without multi-skipping
  useEffect(() => {
    const mainEl = mainRef.current || containerRef.current;
    if (!mainEl) return;

    let wheelTimeout: NodeJS.Timeout | null = null;
    let isWheeling = false;

    const handleWheel = (e: WheelEvent) => {
      // If user is inside an open popup, comment drawer, modal, input, or textarea, allow normal native scroll
      const targetEl = e.target as HTMLElement | null;
      if (
        document.body.style.overflow === "hidden" ||
        moreMenuVideo !== null ||
        targetEl?.closest?.(
          "#yoouz-report-modal-overlay, #yoouz-report-modal-dialog, #yoouz-share-modal-overlay, #yoouz-share-modal-dialog, [role='dialog'], [id*='modal'], [id*='dialog'], #google-maps-business-panel, #google-maps-creator-panel, #copo-comments-drawer, textarea, input, select, [contenteditable='true']"
        ) !== null
      ) {
        return;
      }

      // Intercept wheel event on desktop to guarantee exactly 1 video transition per scroll gesture
      e.preventDefault();

      if (isWheeling) return;

      // Threshold check to filter out tiny trackpad micro-jitters
      if (Math.abs(e.deltaY) >= 15) {
        isWheeling = true;

        if (e.deltaY > 0) {
          // Wheel Down -> Next Video or End Card
          const maxIdx = videos.length > 0 ? videos.length : 0;
          if (currentIndexRef.current < maxIdx) {
            scrollToCard(currentIndexRef.current + 1, "smooth");
          }
        } else {
          // Wheel Up -> Previous Video (bounded to start of feed)
          if (currentIndexRef.current > 0) {
            scrollToCard(currentIndexRef.current - 1, "smooth");
          }
        }

        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          isWheeling = false;
        }, 520);
      }
    };

    mainEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      mainEl.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [videos.length, moreMenuVideo, scrollToCard]);

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
  }, [currentIndex, videos.length, handleNext, handlePrev]);

  // Sound toggle with session audio unlocking
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextMuted = !isMuted;
    if (!nextMuted) {
      unlockAudioSession();
    } else {
      setIsMuted(true);
    }
  };

  // Keyboard navigation: ArrowDown/ArrowUp, PageDown/PageUp, Space/Shift+Space, Mute
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
          "#yoouz-report-modal-overlay, #yoouz-report-modal-dialog, #yoouz-share-modal-overlay, #yoouz-share-modal-dialog, [role='dialog'], [id*='modal'], [id*='dialog'], #google-maps-business-panel, #google-maps-creator-panel, #copo-comments-drawer"
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

      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrev();
        } else {
          handleNext();
        }
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, isMuted, moreMenuVideo]);

  if (!currentVideo) {
    if (isLoading) {
      return (
        <main
          id="copo-loading-feed-container"
          className="flex-1 h-full flex items-center justify-center relative overflow-hidden bg-black md:bg-zinc-950 p-0 md:p-3"
        >
          <div className="w-full h-full md:w-[440px] lg:w-[480px] xl:w-[500px] md:h-[92vh] md:max-h-[890px] bg-zinc-900 md:rounded-3xl overflow-hidden md:shadow-2xl md:border md:border-zinc-800 flex flex-col justify-between p-6 animate-pulse relative">
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
        className="flex-1 h-full flex items-center justify-center relative p-3 overflow-hidden bg-zinc-950"
      >
        <div className="relative w-full max-w-[360px] sm:max-w-[380px] h-[80vh] max-h-[680px] bg-zinc-900 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border border-zinc-800 text-white">
          <div className="w-20 h-20 rounded-[28px] bg-zinc-800 border border-zinc-700 shadow-xl flex items-center justify-center text-white mb-6">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {feedContextTitle ? `No Reviews by ${feedContextTitle}` : "No Video Reviews Yet"}
          </h2>
          <p className="text-sm text-zinc-400 max-w-[280px] mb-8 leading-relaxed">
            {feedContextTitle
              ? `${feedContextTitle} hasn't published any video reviews yet. Follow them to stay updated on their upcoming reviews!`
              : "Record the first authentic 60-second video review for any business or place!"}
          </p>
          {onOpenCreateModal && (
            <button
              id="copo-empty-state-record-btn"
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-full shadow-lg active:scale-95 transition-all text-sm cursor-pointer"
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
      ref={mainRef}
      id="copo-main-feed-container"
      data-hide-scrollbar="true"
      className="flex-1 h-full flex items-center justify-center relative overflow-hidden bg-black md:bg-zinc-950 select-none hide-scrollbar no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="w-full h-full md:h-auto md:w-auto flex items-center md:justify-center gap-4 relative md:max-h-[95vh] md:p-3">
        {/* Scroll Snap Feed Container */}
        <div
          ref={containerRef}
          data-hide-scrollbar="true"
          className="w-full h-full md:h-[min(88vh,780px)] md:w-auto overflow-y-scroll snap-y snap-mandatory touch-pan-y overscroll-y-contain no-scrollbar hide-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] flex flex-col md:gap-4 items-center"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "y mandatory",
            overscrollBehaviorY: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {videos.map((vid, idx) => {
            const isCardActive = idx === currentIndex && !isPaused;
            // Adaptive sliding window (±1 on mobile/touch, ±2 on desktop) protects mobile hardware decoders
            // from crashing or freezing across Brave, Firefox & Safari (WebKit limit ~3-4 decoders)
            const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
            const bufferRadius = isTouch ? 1 : 2;
            const isCardNear = Math.abs(idx - currentIndex) <= bufferRadius;

            return (
              <VideoFeedCard
                key={vid.id}
                video={vid}
                index={idx}
                isActive={isCardActive}
                isNear={isCardNear}
                isMuted={isMuted}
                allUsers={allUsers}
                currentUser={currentUser}
                activeSubTab={activeSubTab}
                onSelectSubTab={onSelectSubTab}
                isSessionAudioUnlocked={isSessionAudioUnlocked}
                onUnlockAudio={unlockAudioSession}
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
                onRecordView={onRecordView}
              />
            );
          })}

          {/* End of Feed Card (Matches Screenshot 2) */}
          {videos.length > 0 && (
            <div
              key="feed-end-card"
              data-video-index={videos.length}
              ref={(el) => {
                cardRefs.current[videos.length] = el;
              }}
              className="w-full h-full md:h-[min(88vh,780px)] md:w-auto aspect-[9/16] md:max-w-[440px] snap-start shrink-0 flex flex-col items-center justify-center p-6 sm:p-8 bg-black md:bg-zinc-950 md:rounded-3xl border-0 md:border md:border-white/10 text-center select-none relative"
            >
              {/* Green checkmark circle */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-5 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-8 h-8 stroke-[2]" />
              </div>

              {/* Feed Completed Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                FEED COMPLETED
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                You're all caught up!
              </h3>

              {/* Subtitle */}
              <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-[280px]">
                You've watched all {videos.length} reviews in this feed.
              </p>

              {/* Action Buttons */}
              <div className="w-full max-w-[280px] flex flex-col gap-3">
                <button
                  type="button"
                  id="btn-end-card-back-to-top"
                  onClick={() => scrollToCard(0, "smooth")}
                  className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-200 active:scale-95 text-black font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>Back to First Review</span>
                </button>

                <button
                  type="button"
                  id="btn-end-card-revisit-last"
                  onClick={() => scrollToCard(videos.length - 1, "smooth")}
                  className="w-full py-3.5 px-5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-white font-semibold text-sm transition-all border border-white/15 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  <span>Revisit Last Review</span>
                </button>

                {onOpenCreateModal && (
                  <button
                    type="button"
                    id="btn-end-card-record-review"
                    onClick={onOpenCreateModal}
                    className="mt-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer py-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Record your own review</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Up/Down Navigation Buttons (Desktop) */}
        <div
          id="copo-floating-nav-buttons"
          className="hidden sm:flex flex-col gap-3 z-30"
        >
          <button
            id="btn-scroll-prev-video"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className={`w-12 h-12 rounded-full bg-zinc-900/95 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-xl ${
              currentIndex <= 0
                ? "opacity-25 cursor-not-allowed text-zinc-600 border-zinc-800"
                : "text-white hover:bg-black hover:border-white/40 hover:scale-105 active:scale-95 cursor-pointer"
            }`}
            title="Previous Video (Up Arrow)"
          >
            <ChevronUp className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            id="btn-scroll-next-video"
            onClick={handleNext}
            disabled={currentIndex >= (videos.length > 0 ? videos.length : 0)}
            className={`w-12 h-12 rounded-full bg-zinc-900/95 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-xl ${
              currentIndex >= (videos.length > 0 ? videos.length : 0)
                ? "opacity-25 cursor-not-allowed text-zinc-600 border-zinc-800"
                : "text-white hover:bg-black hover:border-white/40 hover:scale-105 active:scale-95 cursor-pointer"
            }`}
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
                    {formatBusinessName(moreMenuVideo?.placeName || moreMenuVideo?.dishOrItem || moreMenuVideo?.placeId) || "Business Place"}
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
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all text-left font-semibold text-sm cursor-pointer shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-700 flex items-center justify-center text-white shrink-0">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white">Edit Star Rating & Review</div>
                      <div className="text-xs text-zinc-400 font-normal">
                        Update your score ({typeof moreMenuVideo.rating === "number" && !isNaN(moreMenuVideo.rating) ? moreMenuVideo.rating.toFixed(1) : (Number(moreMenuVideo.rating) || 5.0).toFixed(1)} ★) & place rating
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
                      const v = moreMenuVideo;
                      setMoreMenuVideo(null);
                      if (v) {
                        setVideoConfirmDelete(v);
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
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center shrink-0">
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
              <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                  Changing your rating will automatically recalculate the overall average score for <strong className="font-semibold text-white">{formatBusinessName(editingReviewVideo.placeName) || "this business"}</strong> across all verified reviews.
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
                  className="flex-1 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      <span>Updated!</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-black text-black" />
                      <span>Save Rating</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creator Review Permanent Deletion Confirmation Modal */}
      {videoConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">Delete Video Review?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will permanently delete your review for <span className="text-zinc-200 font-semibold">{videoConfirmDelete.placeName || "this place"}</span> globally from all feeds, databases, and storage.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-video"
                onClick={() => setVideoConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-video"
                onClick={() => {
                  const id = videoConfirmDelete.id;
                  setVideoConfirmDelete(null);
                  if (id && onDeleteVideo) {
                    onDeleteVideo(id);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
