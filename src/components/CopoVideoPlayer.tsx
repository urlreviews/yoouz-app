// Yoouz Platform Live Photo Review Feed Engine
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { VideoFeedCard } from "./VideoFeedCard";
import { SpecialStarSelector } from "./SpecialStarSelector";
import {
  ChevronUp,
  ChevronDown,
  Camera,
  Flag,
  MoreHorizontal,
  Share2,
  Bookmark,
  BookmarkCheck,
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
import { INITIAL_SEED_VIDEOS } from "../data/seedReviews";
import { isPurgedItem, normalizeReview } from "../hooks/useFeedPagination";
import { getPlaceLogoUrl, getCleanLogoUrl, KNOWN_BRAND_LOGOS } from "../utils/logoUtils";
import {
  isAuthorMatch,
  formatBusinessName,
  isGenericPlaceName,
  extractCleanDomain,
  KNOWN_OFFICIAL_NAMES,
  toTitleCase,
  getReviewTime
} from "../utils/placeUtils";
import { getRoundedRating } from "./CopoStarRating";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { prefetchUpcomingVideos, prefetchInitialFeedPhotos } from "../utils/videoPrefetcher";

interface CopoVideoPlayerProps {
  videos: VideoReview[];
  isLoading?: boolean;
  places?: Place[];
  currentIndex: number;
  onSelectVideoIndex: (index: number) => void;
  activeSubTab: FeedSubTab;
  onSelectSubTab: (tab: FeedSubTab) => void;
  onOpenComments: (video: VideoReview) => void;
  onOpenPlace: (placeId: string, fromVideoId?: string) => void;
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
  onPurgeAllVideos?: () => void;
  onUpdateVideoReview?: (
    videoId: string,
    updates: {
      rating?: number;
      caption?: string;
      dishOrItem?: string;
      tags?: string[];
      segments?: any[];
      transcriptText?: string;
      hasBunnySmartCaptions?: boolean;
      hasHardwareSilenceSync?: boolean;
      title?: string;
      aiTitle?: string;
    }
  ) => void;
  isPaused?: boolean;
  initialAutoplayPaused?: boolean;
  contextKey?: string;
  onRecordView?: (videoId: string) => void;
  unreadCount?: number;
  forceShowMenu?: boolean;
  hideFloatingNav?: boolean;
  isEmbed?: boolean;
  isBusinessOwnerView?: boolean;
  onOpenOwnerReply?: (video: VideoReview) => void;
  onCloseEmbed?: () => void;
  commentsOpen?: boolean;
  feedContextType?: "place" | "creator" | "feed";
  isOwnGuestPreview?: boolean;
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
  onToggleRepost,
  onOpenReport,
  onGoHome,
  onGoBack,
  feedContextTitle,
  onOpenCreateModal,
  onOpenMenu,
  onLoadMore,
  currentUser,
  allUsers,
  onDeleteVideo,
  onPurgeAllVideos,
  onUpdateVideoReview,
  contextKey,
  onRecordView,
  unreadCount = 0,
  forceShowMenu = false,
  hideFloatingNav = false,
  isEmbed = false,
  isBusinessOwnerView = false,
  onOpenOwnerReply,
  onCloseEmbed,
  commentsOpen = false,
  feedContextType = "feed",
  isOwnGuestPreview = false
}) => {
  const { t } = useLanguage();

  const effectiveVideos = useMemo(() => {
    if (Array.isArray(videos)) {
      return videos.filter((v) => v && !isPurgedItem(v));
    }
    if (feedContextTitle) {
      return [];
    }
    const fallbackList =
      typeof window !== "undefined" &&
      Array.isArray((window as any).__INITIAL_FEED_VIDEOS__) &&
      (window as any).__INITIAL_FEED_VIDEOS__.length > 0
        ? (window as any).__INITIAL_FEED_VIDEOS__
        : INITIAL_SEED_VIDEOS;
    return fallbackList
      .filter((v: any) => v && !isPurgedItem(v))
      .map(normalizeReview)
      .sort((a: VideoReview, b: VideoReview) => getReviewTime(b) - getReviewTime(a));
  }, [videos, feedContextTitle]);

  const currentVideo =
    effectiveVideos[Math.min(currentIndex, Math.max(0, effectiveVideos.length - 1))] ||
    effectiveVideos[0];

  const [moreMenuVideo, setMoreMenuVideo] = useState<VideoReview | null>(null);
  const [showConfirmPurgeAllModal, setShowConfirmPurgeAllModal] = useState<boolean>(false);

  const displayItems = useMemo(() => {
    if (effectiveVideos.length === 0) return [];
    return effectiveVideos.map((vid, i) => ({
      video: vid,
      cardIndex: i,
      realIndex: i,
      slotId: `photo-slot-${i}`,
      key: `photo-${vid.id}-${i}`
    }));
  }, [effectiveVideos]);

  const initialIdxClamped = Math.max(0, Math.min(currentIndex, Math.max(0, effectiveVideos.length - 1)));
  const [activeCardIndex, setActiveCardIndex] = useState<number>(initialIdxClamped);
  const activeCardIndexRef = useRef<number>(activeCardIndex);
  activeCardIndexRef.current = activeCardIndex;

  // Pin active video ID so mobile layout resizes / initial scroll-snap settlement / async feed updates never jump to index 0
  const lockedVideoIdRef = useRef<string | null>(effectiveVideos[initialIdxClamped]?.id || null);
  const initialMountTargetRef = useRef<number | null>(currentIndex > 0 ? currentIndex : null);
  const userHasScrolledRef = useRef<boolean>(false);
  const snapRestoreRafRef = useRef<number | null>(null);

  // Edit Rating State (whole numbers 1–5 only)
  const [editingReviewVideo, setEditingReviewVideo] = useState<VideoReview | null>(null);
  const [videoConfirmDelete, setVideoConfirmDelete] = useState<VideoReview | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const maxIdx = effectiveVideos.length > 0 ? effectiveVideos.length - 1 : 0;
    if (currentIndex > maxIdx) {
      onSelectVideoIndex(maxIdx);
    }
  }, [effectiveVideos.length, currentIndex, onSelectVideoIndex]);

  // Eagerly pre-decode upcoming photos as the user navigates or scrolls the feed
  useEffect(() => {
    if (effectiveVideos && effectiveVideos.length > 0) {
      prefetchUpcomingVideos(effectiveVideos, activeCardIndex);
    }
  }, [effectiveVideos, activeCardIndex]);

  // Pre-decode initial feed items into GPU memory on feed initialization
  useEffect(() => {
    if (effectiveVideos && effectiveVideos.length > 0) {
      prefetchInitialFeedPhotos(effectiveVideos, 8);
    }
  }, [effectiveVideos]);

  const mainRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isProgrammaticScrollRef = useRef<boolean>(currentIndex > 0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastObserverIndexRef = useRef<number>(currentIndex);

  const getCardTargetTop = useCallback((container: HTMLDivElement, cardEl: HTMLDivElement) => {
    const containerRect = container.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    if (cardRect.height > 0 && containerRect.height > 0) {
      return container.scrollTop + (cardRect.top - containerRect.top);
    }
    return cardEl.offsetTop - container.offsetTop;
  }, []);

  // Preconnect to CDN for crisp photo loading
  useEffect(() => {
    if (typeof document === "undefined") return;
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://rev1.b-cdn.net";
    preconnect.crossOrigin = "anonymous";
    document.head.appendChild(preconnect);
    return () => {
      try {
        preconnect.remove();
      } catch {}
    };
  }, []);

  // Context switch reset
  const previousContextKeyRef = useRef<string | undefined>(contextKey);
  useEffect(() => {
    if (previousContextKeyRef.current !== contextKey) {
      previousContextKeyRef.current = contextKey;
      initialMountTargetRef.current = null;
      userHasScrolledRef.current = false;
      lockedVideoIdRef.current = effectiveVideos[0]?.id || null;
      activeCardIndexRef.current = 0;
      lastObserverIndexRef.current = 0;
      setActiveCardIndex(0);
      onSelectVideoIndex(0);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, [contextKey, effectiveVideos, onSelectVideoIndex]);

  const scrollToCard = useCallback(
    (targetCardIndex: number, behavior: ScrollBehavior = "smooth") => {
      const maxIdx = displayItems.length > 0 ? displayItems.length - 1 : 0;
      if (targetCardIndex < 0 || targetCardIndex > maxIdx) return;

      const prevActive = activeCardIndexRef.current;
      const isJump = behavior !== "smooth" || Math.abs(targetCardIndex - prevActive) > 1;
      activeCardIndexRef.current = targetCardIndex;
      lastObserverIndexRef.current = targetCardIndex;
      setActiveCardIndex(targetCardIndex);

      const targetItem = displayItems[targetCardIndex];
      if (targetItem?.video?.id) {
        lockedVideoIdRef.current = targetItem.video.id;
      }

      const realIdx = targetCardIndex % (effectiveVideos.length || 1);
      onSelectVideoIndex(realIdx);

      const cardEl = cardRefs.current[targetCardIndex];
      const container = containerRef.current;
      if (cardEl && container) {
        isProgrammaticScrollRef.current = true;
        const targetTop = getCardTargetTop(container, cardEl);

        if (isJump) {
          // Temporarily disable scroll-snap so mobile browsers jump straight to targetTop instead of snapping back toward 0
          const savedSnap = container.style.scrollSnapType;
          container.style.scrollSnapType = "none";
          container.scrollTop = targetTop;
          if (snapRestoreRafRef.current !== null) cancelAnimationFrame(snapRestoreRafRef.current);
          snapRestoreRafRef.current = requestAnimationFrame(() => {
            if (containerRef.current) {
              const verifiedTop = cardRefs.current[targetCardIndex]
                ? getCardTargetTop(containerRef.current, cardRefs.current[targetCardIndex]!)
                : targetTop;
              if (Math.abs(containerRef.current.scrollTop - verifiedTop) > 4) {
                containerRef.current.scrollTop = verifiedTop;
              }
              containerRef.current.style.scrollSnapType = savedSnap || (commentsOpen ? "none" : "y mandatory");
            }
          });
        } else {
          container.scrollTo({ top: targetTop, behavior });
        }

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, isJump ? 450 : 500);
      }
    },
    [displayItems, effectiveVideos.length, onSelectVideoIndex, getCardTargetTop, commentsOpen]
  );

  const getLogoForVideo = useCallback(
    (vid: VideoReview | undefined): string | null => {
      if (!vid) return null;

      const vidCleanId = extractCleanDomain(vid.placeId || "");
      const vidCleanWeb = extractCleanDomain(vid.placeWebsite || "");
      const vidCleanName = extractCleanDomain(vid.placeName || "");
      const vidDomain = vidCleanWeb || vidCleanId || (vidCleanName?.includes(".") ? vidCleanName : "");
      const strippedDomain = vidDomain ? vidDomain.replace(/^www\./, "") : "";

      if (vidDomain && KNOWN_BRAND_LOGOS[vidDomain]) return KNOWN_BRAND_LOGOS[vidDomain];
      if (strippedDomain && KNOWN_BRAND_LOGOS[strippedDomain]) return KNOWN_BRAND_LOGOS[strippedDomain];

      if (places && places.length > 0) {
        const p = places.find((place) => {
          if (!place) return false;
          if (vid.placeId && (place.id === vid.placeId || place.id === vidCleanId)) return true;
          const pDomain = extractCleanDomain(place.id || place.website || place.brandDomain || "");
          if (pDomain && pDomain !== "home" && (pDomain === vidCleanId || pDomain === vidCleanWeb || pDomain === vidCleanName)) return true;
          if (place.website && vid.placeWebsite && extractCleanDomain(place.website) === extractCleanDomain(vid.placeWebsite)) return true;
          return false;
        });

        if (p) {
          const logo = getPlaceLogoUrl(p) || p.logoUrl || p.avatarUrl;
          if (logo && logo.trim() !== "" && !logo.startsWith("data:;") && !logo.includes("tap/0.png") && !logo.includes("icons/tap")) {
            return logo;
          }
        }
      }

      if (
        vid.placeLogoUrl &&
        vid.placeLogoUrl.trim() !== "" &&
        !vid.placeLogoUrl.startsWith("data:;") &&
        !vid.placeLogoUrl.includes("tap/0.png") &&
        !vid.placeLogoUrl.includes("icons/tap")
      ) {
        return getCleanLogoUrl(vid.placeLogoUrl, vid.placeWebsite);
      }

      const fallbackDomain = extractCleanDomain(vid.placeWebsite || vid.placeId || (vid.placeName?.includes(".") ? vid.placeName : ""));
      if (fallbackDomain && fallbackDomain.includes(".") && fallbackDomain !== "home.com") {
        return getPlaceLogoUrl({ name: fallbackDomain, brandDomain: fallbackDomain });
      }

      if (vid.placeName && !isGenericPlaceName(vid.placeName)) {
        return getPlaceLogoUrl({
          name: vid.placeName,
          website: vid.placeName.includes(".") ? vid.placeName : undefined
        });
      }

      return null;
    },
    [places]
  );

  const getBusinessNameForVideo = useCallback(
    (vid: VideoReview | undefined): string => {
      if (!vid) return "Business Place";

      const vidDomain = extractCleanDomain(vid.placeWebsite || vid.placeId || (vid.placeName?.includes(".") ? vid.placeName : ""));
      if (vidDomain && KNOWN_OFFICIAL_NAMES[vidDomain]) return KNOWN_OFFICIAL_NAMES[vidDomain];
      const vidCleanId = extractCleanDomain(vid.placeId || "");
      if (vidCleanId && KNOWN_OFFICIAL_NAMES[vidCleanId]) return KNOWN_OFFICIAL_NAMES[vidCleanId];

      if (places && places.length > 0) {
        const vidCleanWeb = extractCleanDomain(vid.placeWebsite || "");
        const vidCleanName = extractCleanDomain(vid.placeName || "");

        const p = places.find((place) => {
          if (!place) return false;
          if (vid.placeId && (place.id === vid.placeId || place.id === vidCleanId)) return true;
          const pDomain = extractCleanDomain(place.id || place.website || place.brandDomain || "");
          if (pDomain && pDomain !== "home" && (pDomain === vidCleanId || pDomain === vidCleanWeb || pDomain === vidCleanName)) return true;
          if (place.website && vid.placeWebsite && extractCleanDomain(place.website) === extractCleanDomain(vid.placeWebsite)) return true;
          return false;
        });

        if (p) {
          const pDomain = extractCleanDomain(p.brandDomain || p.website || p.id || "");
          if (pDomain && KNOWN_OFFICIAL_NAMES[pDomain]) return KNOWN_OFFICIAL_NAMES[pDomain];
          if (p.name && !isGenericPlaceName(p.name)) {
            const formatted = formatBusinessName(p.name, pDomain || vidDomain);
            if (formatted && formatted.trim() !== "" && formatted.toLowerCase() !== "vaibe") return formatted;
          }
        }
      }

      if (vid.businessName && !isGenericPlaceName(vid.businessName)) {
        const formatted = formatBusinessName(vid.businessName, vidDomain);
        if (formatted && formatted.trim() !== "" && formatted.toLowerCase() !== "vaibe") return formatted;
      }

      if (vid.placeName && !isGenericPlaceName(vid.placeName)) {
        const formatted = formatBusinessName(vid.placeName, vidDomain);
        if (formatted && formatted.trim() !== "" && formatted.toLowerCase() !== "vaibe") return formatted;
      }

      if (vidDomain && vidDomain.includes(".") && vidDomain !== "home.com") {
        const formatted = formatBusinessName(vidDomain, vidDomain);
        if (formatted && formatted.trim() !== "") return formatted;
      }

      return formatBusinessName(vid.businessName || vid.dishOrItem || vid.placeName, vidDomain) || "Business Place";
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

  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  // Pre-decode upcoming photos for zero-flicker swipe
  const prefetchUpcomingPhotos = useCallback(
    (list: VideoReview[], idx: number) => {
      if (typeof Image === "undefined") return;
      [list[idx + 1], list[idx + 2], list[idx - 1]].forEach((upcoming) => {
        if (!upcoming) return;
        const pUrl = resolveVideoPosterUrl(upcoming);
        if (pUrl) {
          const img = new Image();
          img.decoding = "sync";
          img.src = pUrl;
        }
      });
    },
    []
  );

  useEffect(() => {
    prefetchUpcomingPhotos(effectiveVideos, currentIndex);
    if (effectiveVideos.length >= 10 && currentIndex >= effectiveVideos.length - 3 && !isLoading) {
      onLoadMoreRef.current?.();
    }
  }, [currentIndex, effectiveVideos, isLoading, prefetchUpcomingPhotos]);

  // IntersectionObserver index detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        if (initialMountTargetRef.current !== null && !userHasScrolledRef.current) return;

        if (container.scrollTop <= 20) {
          if (activeCardIndexRef.current !== 0) {
            activeCardIndexRef.current = 0;
            lastObserverIndexRef.current = 0;
            lockedVideoIdRef.current = effectiveVideos[0]?.id || null;
            setActiveCardIndex(0);
            onSelectVideoIndex(0);
          }
          return;
        }

        const visibleEntries = entries.filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.25);
        if (visibleEntries.length === 0) return;

        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const bestEntry = visibleEntries[0];

        const idxAttr = bestEntry.target.getAttribute("data-video-index");
        if (idxAttr !== null) {
          const cardIdx = parseInt(idxAttr, 10);
          const maxIdx = displayItems.length > 0 ? displayItems.length - 1 : 0;
          if (!isNaN(cardIdx) && cardIdx >= 0 && cardIdx <= maxIdx && cardIdx !== activeCardIndexRef.current) {
            activeCardIndexRef.current = cardIdx;
            lastObserverIndexRef.current = cardIdx;
            lockedVideoIdRef.current = effectiveVideos[cardIdx]?.id || null;
            setActiveCardIndex(cardIdx);
            const realIdx = cardIdx % (effectiveVideos.length || 1);
            onSelectVideoIndex(realIdx);
            if (realIdx < effectiveVideos.length) {
              prefetchUpcomingPhotos(effectiveVideos, realIdx);
            }
          }
        }
      },
      {
        root: container,
        threshold: [0.15, 0.3, 0.45, 0.75]
      }
    );

    const attachObservers = () => {
      const cardElements = container.querySelectorAll("[data-video-index]");
      cardElements.forEach((el) => observer.observe(el));
    };

    attachObservers();
    const mutationObserver = new MutationObserver(() => attachObservers());
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [displayItems.length, effectiveVideos, onSelectVideoIndex, prefetchUpcomingPhotos]);

  const prevFirstVideoIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentFirstId = effectiveVideos[0]?.id || null;
    if (currentFirstId && currentFirstId !== prevFirstVideoIdRef.current) {
      const isInitialMount = prevFirstVideoIdRef.current === null;
      prevFirstVideoIdRef.current = currentFirstId;
      const firstVid = effectiveVideos[0];
      const isNewSessionPhoto = Boolean((firstVid as any)?.isCurrentSessionBlob || (firstVid as any)?.isLocalUpload);

      if (isNewSessionPhoto || (isInitialMount && currentIndex === 0 && activeCardIndexRef.current === 0)) {
        lockedVideoIdRef.current = currentFirstId;
        lastObserverIndexRef.current = 0;
        activeCardIndexRef.current = 0;
        setActiveCardIndex(0);
        onSelectVideoIndex(0);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
      }
    }
  }, [effectiveVideos, onSelectVideoIndex, currentIndex]);

  // Keep player pinned to the locked videoId if effectiveVideos updates or reorders before user scrolls
  useEffect(() => {
    const lockedId = lockedVideoIdRef.current;
    if (!lockedId || userHasScrolledRef.current) return;
    const pinnedIdx = effectiveVideos.findIndex((v) => v.id === lockedId);
    if (pinnedIdx !== -1 && pinnedIdx !== activeCardIndexRef.current) {
      initialMountTargetRef.current = pinnedIdx;
      scrollToCard(pinnedIdx, "instant");
    }
  }, [effectiveVideos, scrollToCard]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    const markUserScrolled = () => {
      userHasScrolledRef.current = true;
      initialMountTargetRef.current = null;
    };

    container.addEventListener("touchstart", markUserScrolled, { passive: true });
    container.addEventListener("wheel", markUserScrolled, { passive: true });

    const alignToTarget = (idx: number) => {
      const cardEl = cardRefs.current[idx];
      if (!cardEl || !containerRef.current) return;
      const savedSnap = containerRef.current.style.scrollSnapType;
      containerRef.current.style.scrollSnapType = "none";
      const targetTop = getCardTargetTop(containerRef.current, cardEl);
      if (Math.abs(containerRef.current.scrollTop - targetTop) > 4) {
        containerRef.current.scrollTop = targetTop;
      }
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.scrollSnapType = savedSnap || "y mandatory";
        }
      });
    };

    const startIdx = initialMountTargetRef.current !== null ? initialMountTargetRef.current : currentIndex;
    let t1: ReturnType<typeof setTimeout> | null = null;
    let t2: ReturnType<typeof setTimeout> | null = null;
    let resizeObs: ResizeObserver | null = null;

    if (startIdx <= 0) {
      isProgrammaticScrollRef.current = false;
      container.scrollTo({ top: 0, behavior: "instant" });
    } else if (startIdx < displayItems.length) {
      scrollToCard(startIdx, "instant");
      requestAnimationFrame(() => alignToTarget(startIdx));
      t1 = setTimeout(() => {
        if (!userHasScrolledRef.current && initialMountTargetRef.current === startIdx) {
          alignToTarget(startIdx);
        }
      }, 120);
      t2 = setTimeout(() => {
        if (!userHasScrolledRef.current && initialMountTargetRef.current === startIdx) {
          alignToTarget(startIdx);
        }
        isProgrammaticScrollRef.current = false;
      }, 320);

      if (typeof ResizeObserver !== "undefined") {
        resizeObs = new ResizeObserver(() => {
          if (!userHasScrolledRef.current && initialMountTargetRef.current === startIdx) {
            alignToTarget(startIdx);
          }
        });
        resizeObs.observe(container);
      }
    } else {
      isProgrammaticScrollRef.current = false;
    }

    return () => {
      container.removeEventListener("touchstart", markUserScrolled);
      container.removeEventListener("wheel", markUserScrolled);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (resizeObs) resizeObs.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const checkActiveCard = () => {
      if (isProgrammaticScrollRef.current) return;
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      if (!containerHeight) return;

      if (initialMountTargetRef.current !== null && !userHasScrolledRef.current && containerTop <= 20) {
        return;
      }

      if (containerTop <= 20) {
        if (activeCardIndexRef.current !== 0) {
          activeCardIndexRef.current = 0;
          lastObserverIndexRef.current = 0;
          lockedVideoIdRef.current = effectiveVideos[0]?.id || null;
          setActiveCardIndex(0);
          onSelectVideoIndex(0);
        }
        return;
      }

      const containerCenter = containerTop + containerHeight / 2;
      const cardElements = container.querySelectorAll<HTMLElement>("[data-video-index]");
      if (cardElements.length === 0) return;

      let closestIndex = -1;
      let minDistance = Infinity;

      const containerRect = container.getBoundingClientRect();
      cardElements.forEach((el) => {
        const elRect = el.getBoundingClientRect();
        const cardTop = containerRect.height > 0 ? containerTop + (elRect.top - containerRect.top) : el.offsetTop - container.offsetTop;
        const cardCenter = cardTop + el.clientHeight / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < minDistance) {
          minDistance = distance;
          const idxAttr = el.getAttribute("data-video-index");
          if (idxAttr !== null) {
            closestIndex = parseInt(idxAttr, 10);
          }
        }
      });

      const maxIdx = displayItems.length > 0 ? displayItems.length - 1 : 0;
      if (closestIndex >= 0 && closestIndex <= maxIdx && closestIndex !== activeCardIndexRef.current) {
        activeCardIndexRef.current = closestIndex;
        lastObserverIndexRef.current = closestIndex;
        lockedVideoIdRef.current = effectiveVideos[closestIndex]?.id || null;
        setActiveCardIndex(closestIndex);
        const realIdx = closestIndex % (effectiveVideos.length || 1);
        onSelectVideoIndex(realIdx);
        if (realIdx < effectiveVideos.length) {
          prefetchUpcomingPhotos(effectiveVideos, realIdx);
        }
      }
    };

    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkActiveCard);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("scrollend", checkActiveCard, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("scrollend", checkActiveCard);
    };
  }, [displayItems.length, effectiveVideos, onSelectVideoIndex, prefetchUpcomingPhotos]);

  useEffect(() => {
    const currentRealIdx = activeCardIndexRef.current % (effectiveVideos.length || 1);
    if (currentIndex !== currentRealIdx && currentIndex >= 0 && currentIndex < effectiveVideos.length) {
      lockedVideoIdRef.current = effectiveVideos[currentIndex]?.id || null;
      const isLargeJump = Math.abs(currentIndex - currentRealIdx) > 1;
      scrollToCard(currentIndex, currentIndex === 0 || isLargeJump ? "instant" : "smooth");
    }
  }, [currentIndex, effectiveVideos, scrollToCard]);

  const handleNext = useCallback(() => {
    const nextIdx = activeCardIndexRef.current + 1;
    if (nextIdx < displayItems.length) {
      scrollToCard(nextIdx, "smooth");
    }
  }, [displayItems.length, scrollToCard]);

  const handlePrev = useCallback(() => {
    if (activeCardIndexRef.current > 0) {
      scrollToCard(activeCardIndexRef.current - 1, "smooth");
    } else if (displayItems.length > 1) {
      scrollToCard(displayItems.length - 1, "smooth");
    } else {
      scrollToCard(0, "smooth");
    }
  }, [displayItems.length, scrollToCard]);

  // Desktop Mouse Wheel & Trackpad Navigation
  useEffect(() => {
    const mainEl = mainRef.current || containerRef.current;
    if (!mainEl) return;

    let wheelTimeout: NodeJS.Timeout | null = null;
    let isWheeling = false;

    const handleWheel = (e: WheelEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        moreMenuVideo !== null ||
        targetEl?.closest?.(
          "#yoouz-report-modal-overlay, #yoouz-report-modal-dialog, #yoouz-share-modal-overlay, #yoouz-share-modal-dialog, #copo-create-review-modal, #copo-auth-modal, textarea, input, select, [contenteditable='true']"
        ) !== null
      ) {
        return;
      }

      if (isWheeling) return;

      if (Math.abs(e.deltaY) >= 18) {
        if (e.deltaY > 0) {
          isWheeling = true;
          handleNext();
        } else if (activeCardIndexRef.current > 0) {
          isWheeling = true;
          handlePrev();
        } else {
          if (containerRef.current && containerRef.current.scrollTop < 0) {
            containerRef.current.scrollTop = 0;
          }
        }

        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          isWheeling = false;
        }, 400);
      }
    };

    mainEl.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      mainEl.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [videos.length, moreMenuVideo, handleNext, handlePrev]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (activeCardIndexRef.current === 0 && container.scrollTop < 0) {
        container.scrollTop = 0;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Desktop Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      ) {
        return;
      }

      if (
        (e.target instanceof HTMLElement &&
          e.target.closest("input, textarea, select, [contenteditable='true'], #copo-create-review-modal, #copo-auth-modal, #yoouz-report-modal-overlay")) ||
        (activeEl instanceof HTMLElement &&
          activeEl.closest("input, textarea, select, [contenteditable='true'], #copo-create-review-modal, #copo-auth-modal, #yoouz-report-modal-overlay"))
      ) {
        return;
      }

      if (
        moreMenuVideo !== null ||
        document.querySelector("#copo-create-review-modal, #copo-auth-modal, #yoouz-report-modal-overlay, #yoouz-share-modal-overlay") !== null
      ) {
        return;
      }

      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, moreMenuVideo]);

  if (!currentVideo) {
    if (isLoading) {
      return (
        <main
          id="copo-loading-feed-container"
          className="flex-1 h-full flex items-center justify-center relative overflow-hidden bg-black md:bg-zinc-950 p-0 md:p-3"
        />
      );
    }

    const isUserProfileEmpty = feedContextType === "creator";

    return (
      <main
        id="copo-empty-feed-container"
        className="flex-1 h-full flex items-center justify-center relative p-3 overflow-hidden bg-zinc-950"
      >
        <div className="relative w-full max-w-[360px] sm:max-w-[400px] h-[80vh] max-h-[680px] bg-zinc-900 rounded-[40px] px-6 sm:px-10 py-10 flex flex-col items-center justify-center text-center shadow-2xl border border-zinc-800 text-white overflow-hidden">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] sm:rounded-[32px] bg-zinc-800/50 border border-zinc-700 shadow-xl flex items-center justify-center text-white mb-6 sm:mb-8 shrink-0">
            {isUserProfileEmpty ? (
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            ) : (
              <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            )}
          </div>
          <h2 className="w-full max-w-full text-xl sm:text-2xl font-black text-white mb-3 tracking-tight leading-snug break-words">
            {isUserProfileEmpty ? (
              isOwnGuestPreview ? (
                t("profile.guestMemberTitle", "Your Community Profile")
              ) : (
                `${feedContextTitle || "Member"} · Community Profile`
              )
            ) : feedContextTitle ? (
              <>
                No Photo Reviews for{" "}
                <span className="inline font-black text-white break-words max-w-full">
                  {toTitleCase(formatBusinessName(feedContextTitle) || feedContextTitle)}
                </span>
              </>
            ) : (
              "No Photo Reviews Yet"
            )}
          </h2>
          <p className="w-full max-w-[320px] text-xs sm:text-sm text-zinc-400 mb-8 sm:mb-10 leading-relaxed font-medium break-words">
            {isUserProfileEmpty ? (
              isOwnGuestPreview ? (
                t(
                  "profile.guestMemberDesc",
                  "Your permanent U/XXXXXX handle is created automatically when you comment, like, or post a photo review on a business page."
                )
              ) : (
                t(
                  "profile.memberOnlyActivityDesc",
                  "This is a community member profile, not a business listing. Photo reviews and star ratings can only be published on business profiles."
                )
              )
            ) : feedContextTitle ? (
              "A picture is worth a thousand words. Snap 1 live photo and rate in 2 seconds, no signup, no typing."
            ) : (
              "Snap a real-time photo review and select 1–5 stars for any business or place!"
            )}
          </p>
          {isUserProfileEmpty ? (
            onGoHome && (
              <button
                id="copo-empty-state-explore-btn"
                onClick={onGoHome}
                className="w-full max-w-[280px] flex items-center justify-center gap-3 py-4 sm:py-4.5 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-950 font-black rounded-2xl shadow-[0_12px_40px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all text-sm cursor-pointer uppercase tracking-tight shrink-0"
              >
                {t("profile.exploreBusinesses", "Explore Businesses")}
              </button>
            )
          ) : (
            onOpenCreateModal && (
              <button
                id="copo-empty-state-record-btn"
                onClick={onOpenCreateModal}
                className="w-full max-w-[280px] flex items-center justify-center gap-3 py-4 sm:py-4.5 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-950 font-black rounded-2xl shadow-[0_12px_40px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all text-sm cursor-pointer uppercase tracking-tight shrink-0"
              >
                <Camera className="w-4.5 h-4.5 text-zinc-950 shrink-0 stroke-[2.5]" />
                Add Review
              </button>
            )
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
      className={`flex-1 h-full min-h-full max-h-full flex items-center justify-center relative overflow-hidden select-none hide-scrollbar no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] md:transition-all md:duration-200 ${
        commentsOpen ? "md:mr-[440px] md:px-3" : "md:mr-0"
      } ${isEmbed ? "bg-black p-0 sm:p-2" : "bg-black md:bg-zinc-950"}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", containerType: "size" }}
    >
      <div
        className={`w-full h-full flex items-center justify-center relative ${
          isEmbed
            ? "p-0"
            : "min-h-full max-h-full md:min-h-0 md:max-h-none md:h-auto md:w-auto md:justify-center gap-4 lg:gap-6 md:max-h-[95vh] md:p-3"
        }`}
      >
        {/* Scroll Snap Feed Container */}
        <div
          ref={containerRef}
          data-hide-scrollbar="true"
          className={`w-full h-full ${
            commentsOpen ? "overflow-hidden touch-none select-none" : "overflow-y-auto touch-pan-y"
          } snap-y snap-mandatory overscroll-y-contain no-scrollbar hide-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] flex flex-col items-center shrink-0 ${
            isEmbed
              ? "gap-3 p-1 justify-center"
              : "min-h-full max-h-full md:min-h-0 md:max-h-none md:h-[min(93vh,860px)] md:w-auto md:gap-4"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            scrollSnapType: commentsOpen ? "none" : "y mandatory",
            overscrollBehaviorY: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            overflowAnchor: "none"
          }}
        >
          {displayItems.map((item) => {
            const vid = item.video;
            const idx = item.cardIndex;
            const isCardActive = idx === activeCardIndex;
            const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
            const bufferRadius = isTouch ? 1 : 2;
            const isCardNear = Math.abs(idx - activeCardIndex) <= bufferRadius;

            return (
              <VideoFeedCard
                key={item.key}
                video={vid}
                index={idx}
                slotId={item.slotId}
                isActive={isCardActive}
                isNear={isCardNear}
                onActivateCard={(targetIdx) => scrollToCard(targetIdx, "smooth")}
                allUsers={allUsers}
                currentUser={currentUser}
                places={places}
                allVideos={videos}
                activeSubTab={activeSubTab}
                onSelectSubTab={onSelectSubTab}
                onOpenComments={onOpenComments}
                onOpenPlace={onOpenPlace}
                onOpenCreator={onOpenCreator}
                onOpenShare={onOpenShare}
                onOpenMoreMenu={setMoreMenuVideo}
                onToggleLike={onToggleLike}
                onToggleBookmark={onToggleBookmark}
                onToggleFollow={onToggleFollow}
                onToggleRepost={onToggleRepost}
                onOpenMenu={onOpenMenu}
                onGoBack={onGoBack}
                feedContextTitle={feedContextTitle}
                onGoHome={onGoHome}
                businessName={getBusinessNameForVideo(vid)}
                businessLogoUrl={getLogoForVideo(vid)}
                businessBannerUrl={getBannerForVideo(vid)}
                cardRef={(el) => {
                  cardRefs.current[idx] = el;
                }}
                onRecordView={onRecordView}
                unreadCount={unreadCount}
                forceShowMenu={forceShowMenu}
                isEmbed={isEmbed}
                isBusinessOwnerView={isBusinessOwnerView}
                onOpenOwnerReply={onOpenOwnerReply}
                onCloseEmbed={onCloseEmbed}
                commentsOpen={commentsOpen}
              />
            );
          })}
        </div>

        {/* Floating Up/Down Navigation Buttons (Desktop Only) */}
        {!hideFloatingNav && effectiveVideos.length > 0 && (() => {
          const isAtLastPhoto = activeCardIndex >= displayItems.length - 1 && displayItems.length > 1;

          return (
            <div
              id="copo-floating-nav-buttons"
              className={`hidden md:flex flex-col gap-2.5 select-none shrink-0 ${
                commentsOpen
                  ? "relative z-30 self-center"
                  : "z-50 fixed top-1/2 -translate-y-1/2 right-4 lg:right-8 md:transition-all md:duration-200"
              }`}
            >
              <button
                id="btn-scroll-prev-video"
                onClick={handlePrev}
                className="w-11 h-11 lg:w-12 lg:h-12 rounded-full backdrop-blur-xl border border-zinc-700/80 bg-zinc-800/90 hover:bg-zinc-700/90 text-white hover:scale-110 active:scale-95 cursor-pointer shadow-2xl shadow-black/80 flex items-center justify-center transition-all"
                title="Previous Review (Up Arrow)"
                aria-label="Previous Review"
              >
                <ChevronUp className="w-6 h-6 stroke-[2.5]" />
              </button>

              <button
                id="btn-scroll-next-video"
                onClick={handleNext}
                disabled={isAtLastPhoto}
                className={`w-11 h-11 lg:w-12 lg:h-12 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all shadow-2xl ${
                  isAtLastPhoto
                    ? "bg-zinc-800/40 border-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700/80 text-white hover:scale-110 active:scale-95 cursor-pointer shadow-black/80"
                }`}
                title={isAtLastPhoto ? "Last Review" : "Next Review (Down Arrow)"}
                aria-label="Next Review"
              >
                <ChevronDown className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          );
        })()}
      </div>

      {/* More Options Modal */}
      {moreMenuVideo && (
        <div
          id="copo-more-options-backdrop"
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onClick={() => setMoreMenuVideo(null)}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            id="copo-more-options-modal"
            className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-white animate-in slide-in-from-bottom-5 overscroll-contain flex flex-col max-h-[70vh] sm:max-h-[80vh] pb-safe"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200 shrink-0">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-zinc-100 line-clamp-1">
                    {formatBusinessName(moreMenuVideo?.placeName || moreMenuVideo?.dishOrItem || moreMenuVideo?.placeId) ||
                      t("common.businessPlace", "Business Place")}
                  </h3>
                  <p className="text-xs text-zinc-200 truncate">
                    {moreMenuVideo?.author?.name || t("common.photoReviewer", "Photo Reviewer")}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-more-options"
                onClick={() => setMoreMenuVideo(null)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white transition-colors cursor-pointer shrink-0"
                title={t("common.close", "Close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="p-3 space-y-1.5 flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-12 sm:pb-6"
              onWheel={(e) => e.stopPropagation()}
            >
              {(() => {
                let localProfile: any = null;
                try {
                  localProfile = JSON.parse(localStorage.getItem("copo_user_profile") || localStorage.getItem("copo_user") || "null");
                } catch {}
                const activeUser = currentUser || localProfile;

                const isMyReview = Boolean(
                  activeUser &&
                    moreMenuVideo &&
                    ((activeUser.email &&
                      (moreMenuVideo?.userId === activeUser.email ||
                        (moreMenuVideo as any)?.userEmail === activeUser.email ||
                        moreMenuVideo.author?.email === activeUser.email)) ||
                      ((activeUser.id || (activeUser as any).uid) &&
                        (moreMenuVideo?.userId === (activeUser.id || (activeUser as any).uid) ||
                          (moreMenuVideo as any)?.uid === (activeUser.id || (activeUser as any).uid) ||
                          moreMenuVideo.author?.id === (activeUser.id || (activeUser as any).uid))) ||
                      isAuthorMatch(moreMenuVideo, activeUser) ||
                      (typeof localStorage !== "undefined" &&
                        localStorage.getItem("yoouz_local_created_reviews") &&
                        JSON.parse(localStorage.getItem("yoouz_local_created_reviews") || "[]").some(
                          (r: any) =>
                            r &&
                            r.id === moreMenuVideo.id &&
                            (!r.userId || r.userId === activeUser.id || r.userId === activeUser.email || isAuthorMatch(r, activeUser))
                        )))
                );

                return isMyReview ? (
                  <>
                    <button
                      id="btn-more-option-edit-rating"
                      onClick={() => {
                        setEditRating(getRoundedRating(moreMenuVideo.rating) || 5);
                        setEditingReviewVideo(moreMenuVideo);
                        setMoreMenuVideo(null);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all text-left font-semibold text-sm cursor-pointer shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-xl bg-zinc-700 flex items-center justify-center text-white shrink-0">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{t("video.editRatingTitle", "Edit Star Rating")}</div>
                        <div className="text-xs text-zinc-200 font-normal">
                          {t("video.updateYourScore", "Update your score")} ({getRoundedRating(moreMenuVideo.rating) || 5} ★)
                        </div>
                      </div>
                    </button>

                    <button
                      id="btn-more-option-bookmark-owner"
                      onClick={() => {
                        const vidId = moreMenuVideo.id;
                        setMoreMenuVideo(null);
                        if (vidId) onToggleBookmark(vidId);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                    >
                      {moreMenuVideo.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-zinc-200" />
                      )}
                      <span>
                        {moreMenuVideo.isBookmarked
                          ? t("video.removeBookmark", "Remove from Bookmarks")
                          : t("video.saveBookmark", "Save to Bookmarks")}
                      </span>
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
                      <Share2 className="w-4 h-4 text-zinc-200" />
                      <span>{t("video.shareReviewLink", "Share Photo Review Link")}</span>
                    </button>

                    <button
                      id="btn-more-option-view-place-owner"
                      onClick={() => {
                        const pid = moreMenuVideo.placeId;
                        const vId = moreMenuVideo.id;
                        setMoreMenuVideo(null);
                        if (pid) onOpenPlace(pid, vId);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-zinc-200" />
                      <span>{t("video.viewBusinessInfo", "View Business Info")}</span>
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
                      <span>{t("video.deleteReview", "Delete Photo Review")}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      id="btn-more-option-bookmark-viewer"
                      onClick={() => {
                        const vidId = moreMenuVideo.id;
                        setMoreMenuVideo(null);
                        if (vidId) onToggleBookmark(vidId);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                    >
                      {moreMenuVideo.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-zinc-200" />
                      )}
                      <span>
                        {moreMenuVideo.isBookmarked
                          ? t("video.removeBookmark", "Remove from Bookmarks")
                          : t("video.saveBookmark", "Save to Bookmarks")}
                      </span>
                    </button>

                    <button
                      id="btn-more-option-share"
                      onClick={() => {
                        const v = moreMenuVideo;
                        setMoreMenuVideo(null);
                        if (v) onOpenShare(v);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-zinc-200" />
                      <span>{t("video.shareReview", "Share Photo Review")}</span>
                    </button>

                    <button
                      id="btn-more-option-view-place"
                      onClick={() => {
                        const pid = moreMenuVideo.placeId;
                        const vId = moreMenuVideo.id;
                        setMoreMenuVideo(null);
                        if (pid) onOpenPlace(pid, vId);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-left font-medium text-sm text-zinc-200 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-zinc-200" />
                      <span>{t("video.viewPlaceInfo", "View Place Info & All Reviews")}</span>
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
                        <User className="w-4 h-4 text-zinc-200" />
                        <span>
                          {t("video.viewCreatorProfile", "View Reviewer Profile")} ({moreMenuVideo.author.name})
                        </span>
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
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800/80 hover:text-red-400 text-zinc-200 transition-colors text-left font-medium text-sm cursor-pointer group"
                      >
                        <Flag className="w-4 h-4 text-zinc-400 group-hover:text-red-400" />
                        <span>{t("video.reportReview", "Report Photo Review")}</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Star Rating Modal (Strict Whole Numbers 1–5) */}
      {editingReviewVideo && (
        <div
          id="copo-edit-rating-backdrop"
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onClick={() => !isSavingEdit && setEditingReviewVideo(null)}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            id="copo-edit-rating-modal"
            className="w-full sm:max-w-md bg-zinc-900 border border-zinc-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">{t("video.editReviewRating", "Edit Your Star Rating")}</h3>
                  <p className="text-[11px] text-zinc-200">{t("video.liveRecalculation", "Instant live recalculation across all places")}</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-edit-rating"
                disabled={isSavingEdit}
                onClick={() => setEditingReviewVideo(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 min-h-0 overflow-y-auto touch-pan-y">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white truncate">
                    {formatBusinessName(editingReviewVideo.placeName) || t("common.business", "Business")}
                  </div>
                  <div className="text-xs text-zinc-200 truncate">
                    {editingReviewVideo.placeCity || editingReviewVideo.placeAddress || t("common.verifiedBusinessReview", "Verified Business Review")}
                  </div>
                </div>
              </div>

              <SpecialStarSelector
                value={editRating}
                onChange={(next) => setEditRating(next)}
                disabled={isSavingEdit}
                label={t("video.tapToSelectStars", "Tap to Select Stars (1–5)")}
              />

              <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                  {t(
                    "video.recalculationNote",
                    "Changing your rating will automatically recalculate the overall average score for this business across all reviews."
                  )}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-md shrink-0 flex items-center gap-3 pb-[max(16px,calc(env(safe-area-inset-bottom,0px)+16px))] z-20">
              <button
                type="button"
                id="btn-cancel-edit-rating"
                disabled={isSavingEdit}
                onClick={() => setEditingReviewVideo(null)}
                className="flex-1 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {t("common.cancel", "Cancel")}
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
                      rating: getRoundedRating(editRating)
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
                    <span>{t("common.saving", "Saving...")}</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>{t("common.updated", "Updated!")}</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-black text-black" />
                    <span>{t("video.saveRating", "Save Rating")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {videoConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {t("video.deleteReviewTitle", "Delete Photo Review?")}
              </h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {t("video.deleteReviewDesc", "This will permanently delete your photo review from all feeds, databases, and storage.")}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-video"
                onClick={() => setVideoConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-video"
                onClick={() => {
                  const targetVid = videoConfirmDelete;
                  const id = targetVid?.id;
                  setVideoConfirmDelete(null);
                  if (id && onDeleteVideo) {
                    onDeleteVideo(id);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {t("common.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge All Confirmation Modal */}
      {showConfirmPurgeAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">Delete All Reviews?</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                This will permanently delete all photo reviews from all feeds, databases, and cloud storage immediately.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="btn-cancel-purge-all-videos"
                onClick={() => setShowConfirmPurgeAllModal(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                id="btn-confirm-purge-all-videos"
                onClick={() => {
                  setShowConfirmPurgeAllModal(false);
                  if (onPurgeAllVideos) {
                    onPurgeAllVideos();
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
