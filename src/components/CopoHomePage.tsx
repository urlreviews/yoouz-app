import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from "react";
import { flushSync } from "react-dom";
import { Search, Star, ChevronLeft, ChevronRight, ArrowRight, Loader2, X, Building2, CheckCircle, Bell, Camera, User, Globe, BedDouble, UtensilsCrossed, Package, Briefcase, Sparkles, ShoppingBag, Car, Cpu } from "lucide-react";
const MobileSearchOverlay = lazy(() => import("./MobileSearchOverlay").then(m => ({ default: m.MobileSearchOverlay })));
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { formatBusinessName, extractCleanDomain, resolveSafeAuthor, isPlaceReviewMatch, isValidDomainUrl, isDomainDerivedGuess, isDomainStemName, isFalseSplitOfDomain, isFalseSplitAgainstText, isGenericSeoSlogan, extractBrandFromDescription, extractOfficialBrandSpellingFromText, mergeOfficialBrandSpelling, KNOWN_OFFICIAL_NAMES, getSafeAvatarUrl, getReviewTime } from "../utils/placeUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { KNOWN_BRAND_LOGOS, KNOWN_BRAND_BANNERS, isGenericOrPlaceholderLogo } from "../utils/logoUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { useLanguage } from "../i18n/LanguageContext";
import { getRoundedRating } from "./CopoStarRating";
import { isPurgedItem } from "../hooks/useFeedPagination";
import { preloadImage, preloadAllReviewPhotos, preloadBusinessAssets } from "../utils/preloadUtils";
import { CANONICAL_CATEGORIES, CanonicalCategoryId, ConcreteCategoryId, classifyBusinessCategory, selectDiverseTrendingReviews, isGenericCategory, isSeededReviewId } from "../utils/categoryUtils";

interface CopoHomePageProps {
  places: Place[];
  videos: VideoReview[];
  allUsers?: any[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onAddPlace?: (place: Place) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
  unreadNotifsCount?: number;
  onViewAll?: () => void;
  onRecordReview?: (place?: Place | null) => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onOpenMore?: () => void;
  onOpenBusiness?: () => void;
  currentUser?: UserProfile | null;
  autoFocusSearch?: boolean;
  searchMode?: "general" | "review";
  headerTitle?: string;
  headerSubtitle?: string;
  onClose?: () => void;
  onCancelSearch?: () => void;
  setIsSearchActive?: (active: boolean) => void;
}

export interface SuggestionItem {
  id?: string;
  title: string;
  domain: string;
  websiteUrl?: string;
  logoUrl?: string;
  category?: string;
  address?: string;
  isCreator?: boolean;
  creatorAuthor?: VideoAuthor;
}

export const CopoHomePage: React.FC<CopoHomePageProps> = ({
  places,
  videos,
  allUsers = [],
  onSelectVideo,
  onOpenPlace,
  onAddPlace,
  onOpenCreator,
  onOpenMenu,
  onOpenNotifications,
  unreadNotifsCount = 0,
  onViewAll,
  onRecordReview,
  onOpenLegal,
  onOpenMore,
  onOpenBusiness,
  currentUser,
  autoFocusSearch = false,
  searchMode = "general",
  headerTitle,
  headerSubtitle,
  onClose,
  onCancelSearch,
  setIsSearchActive
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(Boolean(autoFocusSearch));
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [activeCategory, setActiveCategory] = useState<CanonicalCategoryId>("all");
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleCancelMobileSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setIsMobileSearchOpen(false);
    setIsFocused(false);
    if (onClose) onClose();
    if (onCancelSearch) onCancelSearch();
    if (setIsSearchActive) setIsSearchActive(false);
  };

  useEffect(() => {
    // Hiding nav when search overlay is open OR focused on mobile
    setIsSearchActive?.(isMobile && (isMobileSearchOpen || showDropdown || isFocused));
  }, [isMobile, isMobileSearchOpen, showDropdown, isFocused, setIsSearchActive]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Global keyboard shortcut to focus search (/ or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || (activeEl as HTMLElement).isContentEditable);
      
      if ((e.key === "/" && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus search input synchronously when requested (e.g. tapping Search or Review on mobile, tablet, or desktop)
  useLayoutEffect(() => {
    if (autoFocusSearch) {
      setQuery("");
      setSuggestions([]);
      setShowDropdown(false);
      setIsMobileSearchOpen(true);
      setSelectedIndex(-1);
      if (!isMobile && searchInputRef.current) {
        try {
          searchInputRef.current.focus({ preventScroll: true });
        } catch {
          searchInputRef.current.focus();
        }
        if (document.activeElement === searchInputRef.current) {
          setIsFocused(true);
        }
      }
    }
  }, [autoFocusSearch, isMobile]);

  useEffect(() => {
    if (autoFocusSearch && !isMobile) {
      const timer = setTimeout(() => {
        if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
          try {
            searchInputRef.current.focus({ preventScroll: true });
          } catch {
            searchInputRef.current.focus();
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [autoFocusSearch, isMobile]);

  // Active trending videos (purged items removed, newest-first to match feed ordering)
  const trendingVideos = useMemo(() => {
    if (!Array.isArray(videos)) return [];
    return [...videos]
      .filter((v) => v && v.id && !isPurgedItem(v))
      .sort((a, b) => getReviewTime(b) - getReviewTime(a));
  }, [videos]);

  // Precompute normalized category classification for every trending review (fast O(1) lookup)
  const reviewCategoryMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof classifyBusinessCategory>>();
    for (const v of trendingVideos) {
      const matchedPlace = places.find((p) => isPlaceReviewMatch(v, p));
      const dom = extractCleanDomain(matchedPlace?.brandDomain || matchedPlace?.website || v.placeWebsite || v.placeId || "") || "";
      const rawCat = (!isGenericCategory(matchedPlace?.category) ? matchedPlace?.category : "") || (!isGenericCategory(v.placeCategory) ? v.placeCategory : "") || matchedPlace?.category || v.placeCategory || "";
      const info = classifyBusinessCategory({
        rawCategory: rawCat,
        name: matchedPlace?.name || v.businessName || v.placeName || "",
        domain: dom,
        description: matchedPlace?.description || ""
      });
      map.set(v.id, info);
    }
    return map;
  }, [trendingVideos, places]);

  // Filtered & category-diverse trending reviews ("All" ALWAYS puts all real user photo reviews first in newest-first order)
  const displayedTrendingVideos = useMemo(() => {
    return selectDiverseTrendingReviews(
      trendingVideos,
      (v) => reviewCategoryMap.get(v.id)?.canonicalId || "services",
      (v) => getReviewTime(v),
      activeCategory,
      (v) => !isSeededReviewId(v.id)
    );
  }, [trendingVideos, reviewCategoryMap, activeCategory]);

  // Verified places in the currently selected category (used if a category has 0 photo reviews yet)
  const categoryFallbackPlaces = useMemo(() => {
    if (activeCategory === "all") return [];
    const seen = new Set<string>();
    const out: Array<{ place: Place; badgeLabel: string; specificCategory: string; domain: string }> = [];
    for (const p of places) {
      if (!p || !p.id) continue;
      const dom = extractCleanDomain(p.brandDomain || p.website || p.id) || "";
      if (!dom || dom.includes("yoouz") || dom.startsWith("web_") || seen.has(dom.toLowerCase())) continue;
      const info = classifyBusinessCategory({
        rawCategory: p.category,
        name: p.name,
        domain: dom,
        description: p.description
      });
      if (info.canonicalId !== activeCategory) continue;
      seen.add(dom.toLowerCase());
      out.push({ place: p, badgeLabel: info.badgeLabel, specificCategory: info.specificCategory, domain: dom });
      if (out.length >= 6) break;
    }
    return out;
  }, [places, activeCategory]);

  // Tactile domain hint chips for mobile search overlay (strictly category-diverse iconic examples)
  const suggestedDomains = useMemo(() => {
    const fallback = ["hilton.com", "wolt.com", "sephora.com", "nike.com"];
    const found: string[] = [];
    const seen = new Set<string>();
    const seenCats = new Set<string>();
    for (const v of displayedTrendingVideos) {
      const matched = places.find((p) => isPlaceReviewMatch(v, p));
      const dom = extractCleanDomain(matched?.brandDomain || matched?.website || v.placeWebsite || v.placeId || "");
      const cat = reviewCategoryMap.get(v.id)?.canonicalId || "services";
      if (dom && dom.includes(".") && !dom.includes("yoouz") && !seen.has(dom.toLowerCase()) && !seenCats.has(cat)) {
        seen.add(dom.toLowerCase());
        seenCats.add(cat);
        found.push(dom.toLowerCase());
      }
      if (found.length >= 4) break;
    }
    for (const d of fallback) {
      if (found.length >= 4) break;
      if (!seen.has(d)) {
        seen.add(d);
        found.push(d);
      }
    }
    return found.slice(0, 4);
  }, [displayedTrendingVideos, places, reviewCategoryMap]);

  const activeCategoryMeta = useMemo(
    () => CANONICAL_CATEGORIES.find((c) => c.id === activeCategory) || CANONICAL_CATEGORIES[0],
    [activeCategory]
  );

  const renderCategoryIcon = useCallback((id: CanonicalCategoryId, isActive: boolean) => {
    const cls = `w-3.5 h-3.5 shrink-0 ${isActive ? "text-zinc-950" : "text-zinc-400"}`;
    switch (id) {
      case "hotels":
        return <BedDouble className={cls} />;
      case "restaurants":
        return <UtensilsCrossed className={cls} />;
      case "products":
        return <Package className={cls} />;
      case "services":
        return <Briefcase className={cls} />;
      case "beauty":
        return <Sparkles className={cls} />;
      case "shopping":
        return <ShoppingBag className={cls} />;
      case "auto":
        return <Car className={cls} />;
      case "tech":
        return <Cpu className={cls} />;
      default:
        return null;
    }
  }, []);

  const formatCompactRecency = useCallback((video: VideoReview): string => {
    const ts = getReviewTime(video);
    if (!ts || !Number.isFinite(ts) || ts <= 0) return "Live";
    const diffMs = Math.max(0, Date.now() - ts);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 2) return "Now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    return `${Math.max(1, Math.floor(days / 365))}y`;
  }, []);

  // Background-warm trending review photos smoothly after initial paint
  useEffect(() => {
    if (trendingVideos.length === 0) return;
    const timer = setTimeout(() => {
      preloadAllReviewPhotos(trendingVideos.slice(0, 16), 6);
    }, 800);
    return () => clearTimeout(timer);
  }, [trendingVideos]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    checkScrollState();
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);
    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [checkScrollState, displayedTrendingVideos.length, activeCategory]);

  // Reset horizontal carousel smoothly when switching categories
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
      setTimeout(checkScrollState, 120);
    }
  }, [activeCategory, checkScrollState]);

  // Carousel scroll controls for desktop
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -440 : 440;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScrollState, 350);
    }
  };

  // Build deduplicated list of creators/users for person search
  const knownCreators = useMemo(() => {
    const map = new Map<string, VideoAuthor>();
    const addAuthor = (author?: VideoAuthor | null) => {
      if (!author || !author.name) return;
      const cleanName = author.name.trim();
      const key = cleanName.toLowerCase();
      if (!cleanName || key === "reviewer" || key === "verified reviewer" || key === "user" || key === "registered user" || key.includes("@")) return;
      if (!map.has(key)) {
        map.set(key, {
          ...author,
          name: cleanName,
          avatar: getSafeAvatarUrl(author.avatar, cleanName, author.handle || cleanName),
          isVerified: false
        });
      }
    };

    for (const v of videos || []) {
      const resolved = resolveSafeAuthor(v, currentUser, allUsers);
      addAuthor(resolved);
    }
    for (const u of allUsers || []) {
      if (u && u.name) {
        addAuthor({
          id: u.id || u.userId,
          userId: u.userId || u.id,
          name: u.name,
          avatar: u.avatar,
          bio: u.bio || "Community Reviewer",
          location: u.location || "",
          isVerified: false
        });
      }
    }
    if (currentUser && currentUser.name) {
      addAuthor({
        id: currentUser.id,
        userId: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        bio: currentUser.bio || "Community Reviewer",
        location: currentUser.location || "",
        isVerified: false
      });
    }
    return Array.from(map.values());
  }, [videos, allUsers, currentUser]);

  // Live business review stats lookup for enriching desktop & mobile autocomplete results
  const businessStatsMap = useMemo(() => {
    const map = new Map<string, { rating: number; reviewCount: number }>();
    const agg = new Map<string, { sum: number; count: number; title?: string; domain?: string }>();

    for (const v of trendingVideos) {
      const matchedPlace = places.find((p) => isPlaceReviewMatch(v, p));
      const dom = (extractCleanDomain(matchedPlace?.brandDomain || matchedPlace?.website || v.placeWebsite || v.placeId || "") || "").toLowerCase();
      const title = ((dom && KNOWN_OFFICIAL_NAMES[dom]) || matchedPlace?.name || v.businessName || v.placeName || "").trim().toLowerCase();
      const key = dom || title;
      if (!key) continue;
      const ratingVal = typeof v.rating === "number" && v.rating >= 1 && v.rating <= 5 ? v.rating : 5;
      const cur = agg.get(key);
      if (cur) {
        cur.sum += ratingVal;
        cur.count += 1;
      } else {
        agg.set(key, { sum: ratingVal, count: 1, title, domain: dom });
      }
    }

    for (const [, val] of agg.entries()) {
      const entry = {
        rating: Math.round((val.sum / val.count) * 10) / 10,
        reviewCount: val.count
      };
      if (val.domain) map.set(val.domain, entry);
      if (val.title) map.set(val.title, entry);
    }
    return map;
  }, [trendingVideos, places]);

  const rankSuggestions = useCallback(
    (items: SuggestionItem[], qRaw: string): SuggestionItem[] => {
      const qLow = qRaw.trim().toLowerCase();
      const qNoSpace = qLow.replace(/\s+/g, "");
      const directDom = extractCleanDomain(qRaw)?.toLowerCase() || "";
      const explicitlySearchingYoouz = qLow.startsWith("y") || qLow.includes("yoouz");

      const scoreItem = (item: SuggestionItem): number => {
        const titleLow = (item.title || "").trim().toLowerCase();
        const titleNoSpace = titleLow.replace(/\s+/g, "");
        const domLow = (item.domain || "").trim().toLowerCase();
        const domRoot = domLow.split(".")[0] || "";

        if ((domLow === "yoouz.com" || titleLow === "yoouz") && !explicitlySearchingYoouz) {
          return -1000;
        }

        let score = 0;
        if (directDom && isValidDomainUrl(directDom) && domLow === directDom) {
          score = 1200;
        } else if (titleLow === qLow || domLow === qLow || domRoot === qLow || (qNoSpace.length >= 2 && titleNoSpace === qNoSpace)) {
          score = 1000;
        } else if (titleLow.startsWith(qLow) || (qNoSpace.length >= 2 && titleNoSpace.startsWith(qNoSpace))) {
          score = 860;
        } else if (domLow.startsWith(qLow) || domRoot.startsWith(qNoSpace)) {
          score = 820;
        } else if (titleLow.split(/[\s\-_&./]+/).some((w) => w.startsWith(qLow))) {
          score = 560;
        } else if (titleLow.includes(qLow) || (qNoSpace.length >= 2 && titleNoSpace.includes(qNoSpace))) {
          score = 260;
        } else if (domLow.includes(qLow) || (qNoSpace.length >= 2 && domLow.includes(qNoSpace))) {
          score = 210;
        } else {
          score = 100;
        }

        const stats = businessStatsMap.get(domLow) || businessStatsMap.get(titleLow);
        if (stats && stats.reviewCount > 0) {
          score += Math.min(stats.reviewCount * 12, 48);
        }
        // Subtle tie-breaker favoring shorter, cleaner canonical brand names
        score -= Math.min(titleLow.length, 40) * 0.25;
        return score;
      };

      return items
        .filter((item) => {
          if (searchMode === "review" && item.isCreator) return false;
          const domLow = (item.domain || "").trim().toLowerCase();
          const titleLow = (item.title || "").trim().toLowerCase();
          if ((domLow === "yoouz.com" || titleLow === "yoouz") && !explicitlySearchingYoouz) {
            return false;
          }
          return true;
        })
        .sort((a, b) => scoreItem(b) - scoreItem(a));
    },
    [businessStatsMap, searchMode]
  );

  // Live Auto-Suggest debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoadingSuggest(false);
      setShowDropdown(false);
      return;
    }

    const qLow = trimmed.toLowerCase();
    const normalizeDomain = (raw?: string | null): string => {
      if (!raw) return "";
      const extracted = extractCleanDomain(raw) || raw.trim().toLowerCase();
      const cleaned = extracted.replace(/^https?:\/\//i, "").replace(/^www\d*\./i, "").split("/")[0].trim();
      return cleaned.includes(".") ? cleaned : "";
    };
    const compactTitleKey = (title?: string | null): string =>
      (title || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim();

    const sanitizeSuggestion = (item: SuggestionItem): SuggestionItem => {
      const cleanDom = normalizeDomain(item.domain || (item.id && item.id.includes(".") ? item.id : ""));
      const cleanId = cleanDom || (item.id ? item.id.replace(/^www\d*\./i, "") : undefined);
      return {
        ...item,
        id: cleanId,
        domain: cleanDom,
        websiteUrl: cleanDom ? `https://${cleanDom}` : item.websiteUrl
      };
    };

    const dedupeSuggestions = (items: SuggestionItem[]): SuggestionItem[] => {
      const byDomain = new Map<string, SuggestionItem>();
      const byTitle = new Map<string, SuggestionItem>();
      const out: SuggestionItem[] = [];

      const mergeInto = (target: SuggestionItem, incoming: SuggestionItem) => {
        if (!target.domain && incoming.domain) {
          target.domain = incoming.domain;
          target.id = incoming.domain;
        }
        if (!target.logoUrl && incoming.logoUrl) {
          target.logoUrl = incoming.logoUrl;
        } else if (
          target.logoUrl &&
          target.logoUrl.includes("/api/favicon") &&
          incoming.logoUrl &&
          !incoming.logoUrl.includes("/api/favicon")
        ) {
          target.logoUrl = incoming.logoUrl;
        }
        if (!target.websiteUrl && incoming.websiteUrl) target.websiteUrl = incoming.websiteUrl;
        if (!target.address && incoming.address) target.address = incoming.address;
      };

      for (const rawItem of items) {
        const item = sanitizeSuggestion(rawItem);
        const domKey = item.domain ? `${item.isCreator ? "creator:" : "dom:"}${item.domain}` : "";
        const titleKey = compactTitleKey(item.title) ? `${item.isCreator ? "creator:" : "title:"}${compactTitleKey(item.title)}` : "";

        const existingByDom = domKey ? byDomain.get(domKey) : undefined;
        if (existingByDom) {
          mergeInto(existingByDom, item);
          continue;
        }
        const existingByTitle = titleKey ? byTitle.get(titleKey) : undefined;
        if (existingByTitle) {
          mergeInto(existingByTitle, item);
          if (domKey && !byDomain.has(domKey)) byDomain.set(domKey, existingByTitle);
          continue;
        }

        out.push(item);
        if (domKey) byDomain.set(domKey, item);
        if (titleKey) byTitle.set(titleKey, item);
      }
      return out;
    };

    const localMatches: SuggestionItem[] = [];
    const pushLocal = (item: SuggestionItem) => {
      localMatches.push(sanitizeSuggestion(item));
    };

    // 1. If user typed a URL or domain directly (e.g. "https://www.apple.com" or "www.mcdonalds.com"), strip www and put canonical domain #1
    const directDomain = normalizeDomain(trimmed);
    if (directDomain && isValidDomainUrl(directDomain)) {
      const existingPlace = places.find((p) => {
        const pDom = normalizeDomain(p.brandDomain || p.website || p.id);
        return pDom === directDomain;
      });
      const officialTitle =
        KNOWN_OFFICIAL_NAMES[directDomain] ||
        (existingPlace?.name && !isDomainStemName(existingPlace.name, directDomain) ? existingPlace.name : "") ||
        formatBusinessName(directDomain, directDomain) ||
        directDomain;
      pushLocal({
        id: existingPlace?.id ? existingPlace.id.replace(/^www\d*\./i, "") : directDomain,
        title: officialTitle,
        domain: directDomain,
        logoUrl:
          (existingPlace?.logoUrl && !isGenericOrPlaceholderLogo(existingPlace.logoUrl) ? existingPlace.logoUrl : "") ||
          KNOWN_BRAND_LOGOS[directDomain] ||
          `/api/favicon?domain=${encodeURIComponent(directDomain)}`,
        category: existingPlace?.category || "Website",
        address: existingPlace?.city || existingPlace?.address || ""
      });
    }

    const qSearchClean = qLow.replace(/^https?:\/\//i, "").replace(/^www\d*\./i, "");
    const qNoSpace = qSearchClean.replace(/\s+/g, "");

    // 2. Scan ALL local places (do not break early so prefix matches like "Zara" are never dropped)
    for (const p of places) {
      const pName = (p.name || "").toLowerCase();
      const pNameNoSpace = pName.replace(/\s+/g, "");
      const pDomLow = normalizeDomain(p.brandDomain || p.website || p.id);
      if (
        pName.includes(qSearchClean) ||
        (qNoSpace.length >= 2 && pNameNoSpace.includes(qNoSpace)) ||
        pDomLow.includes(qSearchClean) ||
        (qNoSpace.length >= 2 && pDomLow.includes(qNoSpace))
      ) {
        const officialFromDesc = pDomLow ? extractOfficialBrandSpellingFromText(p.description, pDomLow) : null;
        const resolvedPlaceTitle =
          KNOWN_OFFICIAL_NAMES[pDomLow] ||
          ((isFalseSplitOfDomain(p.name, pDomLow) || isFalseSplitAgainstText(p.name, p.description, pDomLow)) && officialFromDesc ? officialFromDesc : "") ||
          p.name ||
          pDomLow;
        pushLocal({
          id: pDomLow || p.id.replace(/^www\d*\./i, ""),
          title: resolvedPlaceTitle,
          domain: pDomLow,
          logoUrl:
            (p.logoUrl && !isGenericOrPlaceholderLogo(p.logoUrl) ? p.logoUrl : "") ||
            (pDomLow && KNOWN_BRAND_LOGOS[pDomLow] ? KNOWN_BRAND_LOGOS[pDomLow] : "") ||
            (pDomLow ? `/api/favicon?domain=${encodeURIComponent(pDomLow)}` : ""),
          category: p.category || "Business",
          address: p.city || p.address || ""
        });
      }
    }

    // 3. Scan businesses from active video reviews if not already matched
    for (const v of trendingVideos) {
      const vName = (v.placeName || v.businessName || "").trim();
      const vNameLow = vName.toLowerCase();
      const vNameNoSpace = vNameLow.replace(/\s+/g, "");
      const vDomLow = normalizeDomain(v.placeWebsite || v.placeId || "");
      if (
        vNameLow.includes(qSearchClean) ||
        (qNoSpace.length >= 2 && vNameNoSpace.includes(qNoSpace)) ||
        (vDomLow && (vDomLow.includes(qSearchClean) || (qNoSpace.length >= 2 && vDomLow.includes(qNoSpace))))
      ) {
        pushLocal({
          id: vDomLow || (v.placeId ? v.placeId.replace(/^www\d*\./i, "") : vName),
          title: (vDomLow && KNOWN_OFFICIAL_NAMES[vDomLow]) || vName || vDomLow,
          domain: vDomLow,
          logoUrl:
            (v.placeLogoUrl && !isGenericOrPlaceholderLogo(v.placeLogoUrl) ? v.placeLogoUrl : "") ||
            (vDomLow && KNOWN_BRAND_LOGOS[vDomLow] ? KNOWN_BRAND_LOGOS[vDomLow] : "") ||
            (vDomLow ? `/api/favicon?domain=${encodeURIComponent(vDomLow)}` : ""),
          category: "Business"
        });
      }
    }

    // 4. Scan KNOWN_OFFICIAL_NAMES with strict www stripping so www.* aliases never duplicate canonical brands
    for (const [domKey, officialName] of Object.entries(KNOWN_OFFICIAL_NAMES)) {
      if (!domKey.includes(".")) continue;
      const domLow = normalizeDomain(domKey);
      if (!domLow) continue;
      const nameLow = officialName.toLowerCase();
      if (nameLow.startsWith(qSearchClean) || domLow.startsWith(qSearchClean)) {
        pushLocal({
          id: domLow,
          title: officialName,
          domain: domLow,
          logoUrl: KNOWN_BRAND_LOGOS[domLow] || `/api/favicon?domain=${encodeURIComponent(domLow)}`,
          category: "Brand"
        });
      }
    }

    const dedupedLocal = dedupeSuggestions(localMatches);
    const rankedLocal = rankSuggestions(dedupedLocal, qSearchClean || trimmed).slice(0, 6);
    setSuggestions(rankedLocal);
    setShowDropdown(true);

    setIsLoadingSuggest(true);
    let cancelled = false;
    const searchParam = directDomain && isValidDomainUrl(directDomain) ? directDomain : (qSearchClean || trimmed);
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search-suggest?q=${encodeURIComponent(searchParam)}`);
        if (!cancelled && resp.ok) {
          const data = await resp.json();
          const serverList: SuggestionItem[] = (data.suggestions || []).map(sanitizeSuggestion);
          const merged = dedupeSuggestions([...dedupedLocal, ...serverList]);
          const rankedMerged = rankSuggestions(merged, qSearchClean || trimmed).slice(0, 6);
          setSuggestions(rankedMerged);
          setShowDropdown(true);
        }
      } catch (e) {
      } finally {
        if (!cancelled) setIsLoadingSuggest(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, places, trendingVideos, knownCreators, searchMode, rankSuggestions]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const seedAndOpenDomainPlace = (domain: string, preferredTitle?: string, logoUrl?: string, websiteUrl?: string) => {
    const cleanDom = extractCleanDomain(domain);
    if (!cleanDom) return;
    const existing = places.find((p) => {
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      return pDom?.toLowerCase() === cleanDom.toLowerCase();
    });
    const existingValidName = existing?.name && !isDomainStemName(existing.name, cleanDom) && !isFalseSplitOfDomain(existing.name, cleanDom) && !isFalseSplitAgainstText(existing.name, existing.description, cleanDom) && !isGenericSeoSlogan(existing.name, cleanDom) ? existing.name : "";
    const validPreferred = preferredTitle && !isDomainStemName(preferredTitle, cleanDom) && !isFalseSplitOfDomain(preferredTitle, cleanDom) && !isGenericSeoSlogan(preferredTitle, cleanDom) ? preferredTitle : "";
    const hasSpecificUrlPath = (() => {
      try {
        const u = new URL(websiteUrl || "");
        const segs = u.pathname.split("/").filter(Boolean);
        return segs.length > 0 && !(segs.length === 1 && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(segs[0]));
      } catch { return false; }
    })();
    const officialName =
      (!hasSpecificUrlPath ? KNOWN_OFFICIAL_NAMES[cleanDom] : undefined) ||
      validPreferred ||
      existingValidName ||
      KNOWN_OFFICIAL_NAMES[cleanDom] ||
      formatBusinessName(cleanDom, cleanDom) ||
      cleanDom;

    const seededCat = classifyBusinessCategory({
      rawCategory: existing?.category,
      name: officialName,
      domain: cleanDom,
      description: existing?.description
    });

    const placeObj: Place = existing
      ? {
          ...existing,
          name: officialName || existing.name,
          category: !isGenericCategory(existing.category) ? existing.category : seededCat.specificCategory,
          categoryType: seededCat.canonicalId,
          brandDomain: cleanDom,
          website: websiteUrl || existing.website || `https://${cleanDom}`
        }
      : {
          id: cleanDom,
          name: officialName,
          brandDomain: cleanDom,
          category: seededCat.specificCategory,
          categoryType: seededCat.canonicalId,
          address: "",
          city: "",
          country: "",
          lat: 0,
          lng: 0,
          rating: 5.0,
          totalReviews: 0,
          ratingDistribution: { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
          avatarUrl: logoUrl || KNOWN_BRAND_LOGOS[cleanDom] || "",
          logoUrl: logoUrl || KNOWN_BRAND_LOGOS[cleanDom] || "",
          bannerUrl: KNOWN_BRAND_BANNERS[cleanDom] || "",
          ogImage: KNOWN_BRAND_BANNERS[cleanDom] || "",
          photos: KNOWN_BRAND_BANNERS[cleanDom] ? [KNOWN_BRAND_BANNERS[cleanDom]] : [],
          openingHours: "",
          isOpen: true,
          phone: "",
          email: "",
          website: websiteUrl || `https://${cleanDom}`,
          priceRange: "N/A",
          plusCode: "",
          description: "",
          popularKeywords: [],
          amenities: [],
          topDishes: [],
          locations: []
        };

    onAddPlace?.(placeObj);
    if (searchMode === "review" && onRecordReview) {
      onRecordReview(placeObj);
    } else {
      onOpenPlace(placeObj.id);
    }
  };

  const resolveAndOpenBusiness = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    // 1. Direct URL or domain input (e.g. "https://apple.com", "www.zara.com", "booking.com")
    const cleanCandidate = extractCleanDomain(trimmed);
    if (cleanCandidate && isValidDomainUrl(cleanCandidate)) {
      const matchedSugg = suggestions.find(
        (s) => !s.isCreator && extractCleanDomain(s.domain || s.id || "")?.toLowerCase() === cleanCandidate.toLowerCase()
      );
      seedAndOpenDomainPlace(cleanCandidate, matchedSugg?.title, matchedSugg?.logoUrl);
      return;
    }

    const qLow = trimmed.toLowerCase();
    const qNoSpace = qLow.replace(/\s+/g, "");

    // 2. Exact match in local places (or space-collapsed exact brand match)
    const match = places.find((p) => {
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      const pNameLow = (p.name || "").toLowerCase().trim();
      const pNameNoSpace = pNameLow.replace(/\s+/g, "");
      return (
        pNameLow === qLow ||
        (qNoSpace.length >= 3 && pNameNoSpace === qNoSpace) ||
        (pDom && pDom.toLowerCase() === qLow) ||
        p.id.toLowerCase() === qLow
      );
    });
    if (match) {
      if (searchMode === "review" && onRecordReview) {
        onRecordReview(match);
      } else {
        onOpenPlace(match.id);
      }
      return;
    }

    // 3. Exact match in KNOWN_OFFICIAL_NAMES dictionary
    const brandEntry = Object.entries(KNOWN_OFFICIAL_NAMES).find(([domKey, officialName]) => {
      if (!domKey.includes(".")) return false;
      const domLow = domKey.toLowerCase();
      const domRoot = domLow.split(".")[0];
      const nameLow = officialName.toLowerCase().trim();
      const nameNoSpace = nameLow.replace(/\s+/g, "");
      return nameLow === qLow || (qNoSpace.length >= 3 && nameNoSpace === qNoSpace) || domLow === qLow || domRoot === qLow;
    });
    if (brandEntry) {
      seedAndOpenDomainPlace(brandEntry[0], brandEntry[1]);
      return;
    }

    // 4. Match in video reviews' businesses
    const matchedVideoBiz = videos.find((v) => {
      const vNameLow = (v.placeName || v.businessName || "").toLowerCase().trim();
      const vNameNoSpace = vNameLow.replace(/\s+/g, "");
      const vDomLow = (extractCleanDomain(v.placeWebsite || v.placeId || "") || "").toLowerCase();
      return vNameLow === qLow || (qNoSpace.length >= 3 && vNameNoSpace === qNoSpace) || (vDomLow && vDomLow === qLow);
    });
    if (matchedVideoBiz) {
      const vDom = extractCleanDomain(matchedVideoBiz.placeWebsite || matchedVideoBiz.placeId || "");
      if (vDom && isValidDomainUrl(vDom)) {
        seedAndOpenDomainPlace(vDom, matchedVideoBiz.placeName || matchedVideoBiz.businessName, matchedVideoBiz.placeLogoUrl);
        return;
      }
      onOpenPlace(matchedVideoBiz.placeId || matchedVideoBiz.placeName);
      return;
    }

    // 6. Fast path from pre-fetched suggestions if available
    const topBusinessSuggestion = suggestions.find(
      (s) =>
        !s.isCreator &&
        s.domain &&
        isValidDomainUrl(extractCleanDomain(s.domain)) &&
        (s.title.toLowerCase() === qLow ||
          s.title.toLowerCase().replace(/\s+/g, "") === qNoSpace ||
          s.title.toLowerCase().startsWith(qLow) ||
          extractCleanDomain(s.domain) === qLow ||
          extractCleanDomain(s.domain).split(".")[0] === qNoSpace)
    );
    if (topBusinessSuggestion) {
      seedAndOpenDomainPlace(topBusinessSuggestion.domain, topBusinessSuggestion.title, topBusinessSuggestion.logoUrl, topBusinessSuggestion.websiteUrl);
      return;
    }

    // 7. Backend metadata & domain resolution for any business name or URL
    setIsResolvingPlace(true);
    try {
      const endpoint = isValidDomainUrl(trimmed)
        ? `/api/url-metadata?url=${encodeURIComponent(trimmed)}`
        : `/api/url-metadata?q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const meta = await res.json();
        const resolvedDomain = extractCleanDomain(meta.domain || meta.url || "");
        if (resolvedDomain && isValidDomainUrl(resolvedDomain)) {
          const descBrand = extractBrandFromDescription(meta.description, resolvedDomain);
          const officialBrand = extractOfficialBrandSpellingFromText([meta.siteName, meta.title, meta.description].filter(Boolean).join(" | "), resolvedDomain);
          const rawMetaName = (meta.siteName && !isDomainDerivedGuess(meta.siteName, resolvedDomain) && !isFalseSplitOfDomain(meta.siteName, resolvedDomain))
            ? meta.siteName
            : (meta.title || meta.siteName || descBrand || trimmed);
          const hasSpecificUrlPath = (() => {
            try {
              const segs = new URL(meta.url || "").pathname.split("/").filter(Boolean);
              return segs.length > 0 && !(segs.length === 1 && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(segs[0]));
            } catch { return false; }
          })();
          const mergedMetaName = mergeOfficialBrandSpelling(rawMetaName, officialBrand, resolvedDomain);
          const officialName = (!hasSpecificUrlPath ? KNOWN_OFFICIAL_NAMES[resolvedDomain] : undefined)
            || (mergedMetaName ? formatBusinessName(mergedMetaName, resolvedDomain, undefined, { fromWebsite: true, fallbackText: meta.description }) || mergedMetaName : "")
            || formatBusinessName(rawMetaName, resolvedDomain, undefined, { fromWebsite: true, fallbackText: meta.description })
            || descBrand
            || trimmed;
          const resolvedCat = classifyBusinessCategory({
            rawCategory: meta.category,
            name: officialName,
            domain: resolvedDomain,
            description: meta.description
          });
          const newPlace: Place = {
            id: resolvedDomain,
            name: officialName,
            brandDomain: resolvedDomain,
            category: resolvedCat.specificCategory,
            categoryType: resolvedCat.canonicalId,
            address: meta.address || "",
            city: meta.city || "",
            country: meta.country || "",
            lat: meta.lat || 0,
            lng: meta.lng || 0,
            rating: 5.0,
            totalReviews: 0,
            ratingDistribution: { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
            avatarUrl: meta.logo || KNOWN_BRAND_LOGOS[resolvedDomain] || "",
            logoUrl: meta.logo || KNOWN_BRAND_LOGOS[resolvedDomain] || "",
            bannerUrl: meta.image || KNOWN_BRAND_BANNERS[resolvedDomain] || "",
            ogImage: meta.image || KNOWN_BRAND_BANNERS[resolvedDomain] || "",
            photos: meta.image ? [meta.image] : [],
            openingHours: meta.openingHours || "",
            isOpen: true,
            phone: meta.phone || "",
            email: meta.email || "",
            website: meta.url || `https://${resolvedDomain}`,
            priceRange: "N/A",
            plusCode: "",
            description: meta.description || "",
            popularKeywords: [],
            amenities: [],
            topDishes: [],
            locations: meta.locations || []
          };
          onAddPlace?.(newPlace);
          if (searchMode === "review" && onRecordReview) {
            onRecordReview(newPlace);
          } else {
            onOpenPlace(resolvedDomain);
          }
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to resolve business query:", err);
    } finally {
      setIsResolvingPlace(false);
    }

    // 8. Final fallback: check partial local match or creator match before opening raw query
    const partialLocal = places.find(
      (p) =>
        (p.name || "").toLowerCase().includes(qLow) ||
        (p.brandDomain || p.website || p.id || "").toLowerCase().includes(qLow)
    );
    if (partialLocal) {
      if (searchMode === "review" && onRecordReview) {
        onRecordReview(partialLocal);
      } else {
        onOpenPlace(partialLocal.id);
      }
      return;
    }



    onOpenPlace(trimmed);
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setShowDropdown(false);
    setQuery(item.title);



    if (searchMode === "review") {
      const qLow = (item.title || "").toLowerCase().trim();
      const domLow = extractCleanDomain(item.domain || item.id || "")?.toLowerCase() || "";
      const match = places.find((p) => {
        const pDom = extractCleanDomain(p.brandDomain || p.website || p.id)?.toLowerCase() || "";
        const pName = (p.name || "").toLowerCase().trim();
        return (domLow && pDom === domLow) || (qLow && pName === qLow) || (item.id && p.id === item.id);
      });
      if (match) {
        if (onRecordReview) {
          onRecordReview(match);
        } else {
          onOpenPlace(match.id);
        }
        return;
      }
    }

    const candidateDom = extractCleanDomain(item.domain || "");
    const candidateId = extractCleanDomain(item.id || "");
    if (candidateDom && isValidDomainUrl(candidateDom)) {
      seedAndOpenDomainPlace(candidateDom, item.title, item.logoUrl, item.websiteUrl);
    } else if (candidateId && isValidDomainUrl(candidateId)) {
      seedAndOpenDomainPlace(candidateId, item.title, item.logoUrl, item.websiteUrl);
    } else {
      resolveAndOpenBusiness(item.title || item.domain || item.id || "");
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    resolveAndOpenBusiness(trimmed);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        e.preventDefault();
        setShowDropdown(true);
        setSelectedIndex(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev < suggestions.length - 1 ? prev + 1 : 0;
        itemRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : suggestions.length - 1;
        itemRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return next;
      });
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="flex-1 h-full min-h-0 w-full max-w-full min-w-0 relative overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y bg-[#050506] text-white flex flex-col select-none md:pb-8 scroll-smooth">
      {/* 1. Mobile Frameless Obsidian Header (md:hidden) — Brand Left, Bell + Minimal Menu Right */}
      <header className="w-full max-w-full flex md:hidden items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top,12px))] pb-2.5 shrink-0 select-none z-20 border-b border-white/[0.06] bg-[#050506]/88 backdrop-blur-2xl sticky top-0">
        {searchMode === "review" ? (
          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-zinc-200 hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label={t("common.close", "Close")}
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            )}
            <div className="relative flex items-center justify-center w-[32px] h-[32px] rounded-[10px] bg-[#121216] border border-white/[0.12] text-white shrink-0">
              <Camera className="w-4 h-4 stroke-[2.1] text-white" />
            </div>
            <span className="text-white text-[17px] font-semibold tracking-[-0.02em]">
              {headerTitle || "Find Business"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-zinc-200 hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label={t("common.close", "Close")}
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            )}
            <div className="relative flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#121216] border border-white/[0.12] shadow-[0_4px_16px_rgba(0,0,0,0.5)] shrink-0">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-white">
                <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
              </svg>
            </div>
            <span className="text-white text-[20px] font-bold tracking-[-0.03em] leading-none font-['Google_Sans',sans-serif]">
              Yoouz
            </span>
          </div>
        )}

        {/* Right Actions: Notifications Bell + Minimalist 2-Line Menu (44px Apple HIG targets) */}
        <div className="flex items-center gap-0.5 shrink-0 -mr-1.5">
          {!onClose && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative w-11 h-11 rounded-full flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer"
              aria-label={t("nav.notifications", "Notifications")}
              title={t("nav.notifications", "Notifications")}
            >
              <Bell className="w-[20px] h-[20px] stroke-[1.9]" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white ring-2 ring-[#050506]" />
              )}
            </button>
          )}
          {!onClose && onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="w-11 h-11 rounded-full flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer"
              aria-label={t("nav.openMenu", "Open menu")}
              title={t("nav.openMenu", "Open menu")}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.9" strokeLinecap="round">
                <line x1="4" y1="8.5" x2="20" y2="8.5" />
                <line x1="4" y1="15.5" x2="20" y2="15.5" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Stage — Widescreen 1360px Gallery Canvas */}
      <main className="flex-1 w-full max-w-[1360px] min-w-0 mx-auto px-4 sm:px-6 lg:px-8 pt-[clamp(10px,1.8dvh,22px)] sm:pt-8 md:pt-9 lg:pt-10 flex flex-col justify-start items-center relative overflow-x-clip">
        {/* Subtle Editorial Radial Top Depth (strictly clipped so it never widens mobile scrollWidth) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[260px] overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(520px,100%)] h-[220px] bg-gradient-to-b from-white/[0.035] via-white/[0.015] to-transparent rounded-full blur-3xl" />
        </div>

        {/* 2. Sculpted Sentence-Case Editorial Hero — Instant 1-Second Review Identity */}
        <div className="w-full shrink-0 text-center max-w-3xl mx-auto mb-[clamp(10px,1.8dvh,20px)] sm:mb-6 relative z-10 px-1 animate-in fade-in duration-300">
          <h1 className="text-[27px] xs:text-[31px] sm:text-[44px] md:text-[50px] lg:text-[54px] font-bold text-white tracking-[-0.038em] leading-[1.06] text-balance">
            {searchMode === "review" ? (
              <>Find a business to review.</>
            ) : (
              <>See the truth before you decide.</>
            )}
          </h1>

          {searchMode === "review" ? (
            <p className="text-zinc-400 text-[13px] sm:text-[15.5px] mt-1.5 sm:mt-2.5 leading-[1.42] sm:leading-relaxed max-w-[345px] sm:max-w-xl mx-auto font-normal tracking-[-0.01em] text-balance">
              {headerSubtitle || "Pick any hotel, restaurant, brand, or website URL to snap a live camera photo review."}
            </p>
          ) : (
            <p className="text-zinc-400 text-[13px] sm:text-[15px] md:text-[16px] mt-1.5 sm:mt-2.5 leading-[1.42] sm:leading-relaxed max-w-[345px] xs:max-w-[370px] sm:max-w-3xl mx-auto font-normal tracking-[-0.01em] text-balance">
              Real customer photo reviews of hotels, restaurants, products &amp; services — zero fake text.
            </p>
          )}
        </div>

        {/* 3. Spotlight-Grade Elevated Glass Search Bar */}
        <div
          className="w-full shrink-0 max-w-[660px] relative mx-auto mb-[clamp(10px,1.8dvh,18px)] sm:mb-6 z-30"
          ref={dropdownRef}
        >
          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="w-full" autoComplete="off" role="search" action="#" noValidate>
              <div
                onClick={() => {
                  if (isMobile) {
                    flushSync(() => {
                      setIsMobileSearchOpen(true);
                    });
                    const overlayInput = document.getElementById("yoouz-mobile-search-input") as HTMLInputElement | null;
                    overlayInput?.focus();
                  } else {
                    searchInputRef.current?.focus();
                  }
                }}
                className={`relative flex items-center w-full bg-white/[0.045] hover:bg-white/[0.065] backdrop-blur-2xl border rounded-full pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1.5 sm:py-2 shadow-[0_20px_54px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 cursor-text ${
                  autoFocusSearch || isFocused || (!isMobile && showDropdown && query.trim().length > 0)
                    ? "border-white/35 ring-4 ring-white/[0.07] bg-white/[0.065]"
                    : "border-white/[0.11] hover:border-white/[0.2] focus-within:border-white/35 focus-within:ring-4 focus-within:ring-white/[0.07]"
                }`}
              >
                <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-zinc-400 shrink-0 mr-3 pointer-events-none" />
                <div className="relative flex-1 min-w-0 flex items-center">
                  {autoFocusSearch && !isFocused && query.length === 0 && (
                    <span
                      aria-hidden="true"
                      className="yoouz-caret-blink pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[20px] rounded-full bg-white"
                    />
                  )}
                  <input
                    ref={searchInputRef}
                    id="copo-main-search-input"
                    name="yoouz_search_q_disabled"
                    type="text"
                    autoFocus={autoFocusSearch && !isMobile}
                    dir="auto"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    aria-autocomplete="none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onFocus={() => {
                      setIsFocused(true);
                      if (isMobile && !isMobileSearchOpen) {
                        flushSync(() => {
                          setIsMobileSearchOpen(true);
                        });
                        const mobileInputs = document.querySelectorAll<HTMLInputElement>("#yoouz-mobile-search-input");
                        const overlayInput = mobileInputs.length > 0 ? mobileInputs[mobileInputs.length - 1] : null;
                        overlayInput?.focus();
                      }
                      if (query.trim().length > 0) setShowDropdown(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                      isMobile
                        ? "Search any place, brand, or URL..."
                        : "Search any hotel, restaurant, brand, or paste a URL..."
                    }
                    className="w-full min-w-0 bg-transparent text-white text-[16px] sm:text-[15.5px] placeholder:text-zinc-500 placeholder:truncate focus:outline-none font-normal pr-2 py-2 truncate caret-white select-text"
                  />
                </div>

                {/* Right Side: Spinner / Clear + Pure-White Submit Arrow */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(isLoadingSuggest || isResolvingPlace) && (
                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin mr-1" />
                  )}
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuery("");
                        setSuggestions([]);
                        setShowDropdown(false);
                        setSelectedIndex(-1);
                        searchInputRef.current?.focus();
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title={t("common.clear", "Clear")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!query.trim()) {
                        e.preventDefault();
                        if (isMobile) {
                          flushSync(() => setIsMobileSearchOpen(true));
                          const overlayInput = document.getElementById("yoouz-mobile-search-input") as HTMLInputElement | null;
                          overlayInput?.focus();
                        } else {
                          searchInputRef.current?.focus();
                        }
                      }
                    }}
                    aria-label="Search"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(255,255,255,0.16)]"
                  >
                    <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.2]" />
                  </button>
                </div>
              </div>
            </form>

            {/* Desktop Spotlight Autocomplete Sheet — Anchored Directly Below Pill, Zero Half-Cut Rows */}
            {!isMobile && showDropdown && query.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D0D10]/97 backdrop-blur-3xl border border-white/[0.12] rounded-[24px] shadow-[0_32px_90px_rgba(0,0,0,0.94),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-2 space-y-0.5 max-h-[388px] overflow-y-auto no-scrollbar md:scrollbar-thin overscroll-contain">
                  {isLoadingSuggest && suggestions.length === 0 && (
                    <div className="space-y-1 p-1">
                      {[0, 1, 2].map((sIdx) => (
                        <div key={sIdx} className="px-3 py-2.5 flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.06] shrink-0 animate-pulse" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-32 rounded bg-white/[0.08] animate-pulse" />
                            <div className="h-2.5 w-24 rounded bg-white/[0.04] animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {suggestions.map((item, idx) => {
                    const domKey = (item.domain || "").toLowerCase();
                    const titleKey = (item.title || "").toLowerCase();
                    const stats = !item.isCreator ? businessStatsMap.get(domKey) || businessStatsMap.get(titleKey) : undefined;
                    const isActive = selectedIndex === idx;
                    const qTrim = query.trim();
                    const matchIdx = qTrim ? item.title.toLowerCase().indexOf(qTrim.toLowerCase()) : -1;

                    return (
                      <button
                        key={`${item.id || item.domain || item.title}-${idx}`}
                        ref={(el) => { itemRefs.current[idx] = el; }}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => handleSelectSuggestion(item)}
                        className={`w-full px-3 py-2.5 rounded-[14px] flex items-center gap-3.5 transition-colors text-left cursor-pointer group ${
                          isActive ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.06]"
                        }`}
                      >
                        {item.isCreator ? (
                          <div className="w-9 h-9 rounded-full bg-[#121216] border border-white/[0.1] flex items-center justify-center shrink-0 overflow-hidden text-zinc-300">
                            {item.logoUrl ? (
                              <img
                                src={item.logoUrl}
                                alt={item.title}
                                loading="eager"
                                decoding="sync"
                                className="w-full h-full object-cover"
                                referrerPolicy={/^https?:\/\//i.test(item.logoUrl) ? "no-referrer" : undefined}
                              />
                            ) : (
                              <User className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        ) : item.domain || item.logoUrl ? (
                          <CopoBrandLogo
                            domain={item.domain || item.id}
                            name={item.title}
                            logoUrl={item.logoUrl}
                            className="w-9 h-9 rounded-[11px] bg-white border border-white/[0.12] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-xs"
                            imageClassName="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-[11px] bg-[#121216] border border-white/[0.1] flex items-center justify-center shrink-0 overflow-hidden text-zinc-300">
                            <Building2 className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[14.5px] tracking-[-0.012em] truncate">
                            <span className="truncate">
                              {matchIdx >= 0 ? (
                                <>
                                  <span className="font-medium text-zinc-300">{item.title.slice(0, matchIdx)}</span>
                                  <span className="font-semibold text-white">{item.title.slice(matchIdx, matchIdx + qTrim.length)}</span>
                                  <span className="font-medium text-zinc-300">{item.title.slice(matchIdx + qTrim.length)}</span>
                                </>
                              ) : (
                                <span className="font-semibold text-white">{item.title}</span>
                              )}
                            </span>
                            {!item.isCreator && (
                              <CheckCircle className="w-3.5 h-3.5 fill-white text-[#0D0D10] shrink-0 inline-block" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 truncate font-normal mt-0.5 tabular-nums">
                            {item.domain && <span className="truncate">{item.domain}</span>}
                            {!item.isCreator && (() => {
                              const suggCat = classifyBusinessCategory({
                                rawCategory: item.category,
                                name: item.title,
                                domain: item.domain || item.id
                              }).badgeLabel;
                              return suggCat ? (
                                <>
                                  {item.domain && <span aria-hidden="true">·</span>}
                                  <span className="text-zinc-400 shrink-0">{suggCat}</span>
                                </>
                              ) : null;
                            })()}
                            {stats && stats.reviewCount > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 text-zinc-300 shrink-0">
                                  <Star className="w-3 h-3 fill-[#F5B942] text-[#F5B942]" />
                                  {stats.rating.toFixed(1)}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="shrink-0">
                                  {stats.reviewCount} {stats.reviewCount === 1 ? "review" : "reviews"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {searchMode === "review" ? (
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isActive
                                  ? "bg-white text-zinc-950"
                                  : "bg-white/[0.06] text-zinc-300 group-hover:bg-white group-hover:text-zinc-950"
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5 stroke-[2.1]" />
                            </span>
                          ) : isActive ? (
                            <span className="text-[11px] font-medium text-zinc-400 px-1.5 py-0.5 rounded-md bg-white/[0.07] border border-white/[0.1] font-mono">
                              ↵
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Integrated Direct-Action Footer + Quiet Keyboard Hints */}
                <div className="border-t border-white/[0.07] bg-white/[0.02] px-3 py-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors cursor-pointer min-w-0 flex-1 group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-zinc-300 group-hover:text-white shrink-0">
                      {isResolvingPlace ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : searchMode === "review" ? (
                        <Camera className="w-3.5 h-3.5" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span className="text-[13px] text-zinc-300 group-hover:text-white truncate">
                      {searchMode === "review" ? "Review" : "Look up"}{" "}
                      <span className="font-semibold text-white">“{query.trim()}”</span>
                    </span>
                  </button>
                  <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-zinc-500 shrink-0 pr-1">
                    <span>↑↓ navigate</span>
                    <span aria-hidden="true">·</span>
                    <span>↵ open</span>
                    <span aria-hidden="true">·</span>
                    <span>Esc close</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search Overlay */}
          {isMobile && isMobileSearchOpen && (
            <Suspense fallback={null}>
            <MobileSearchOverlay
              query={query}
              setQuery={setQuery}
              suggestions={suggestions}
              isOpen={isMobileSearchOpen}
              onClose={handleCancelMobileSearch}
              searchMode={searchMode}
              places={places}
              videos={trendingVideos}
              suggestedDomains={suggestedDomains}
              isResolving={isResolvingPlace}
              onQuickSelectDomain={(domain) => {
                resolveAndOpenBusiness(domain).finally(() => {
                  setIsMobileSearchOpen(false);
                });
              }}
              onSelectTrendingPlace={(place) => {
                setIsMobileSearchOpen(false);
                if (searchMode === "review" && onRecordReview) {
                  onRecordReview(place);
                } else {
                  onOpenPlace(place.id);
                }
              }}
              onSelectSuggestion={(item) => {
                setIsMobileSearchOpen(false);
                handleSelectSuggestion(item);
              }}
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = query.trim();
                if (!trimmed) return;
                setShowDropdown(false);
                resolveAndOpenBusiness(trimmed).finally(() => {
                  setIsMobileSearchOpen(false);
                });
              }}
              isLoading={isLoadingSuggest}
            />
            </Suspense>
          )}
        </div>

        {/* 3.5 Unified Universal Category Filter Rail — Apple/Google Single-Row Precision */}
        <nav
          aria-label="Browse reviews by category"
          className={`w-full shrink-0 max-w-full overflow-hidden mb-[clamp(12px,2dvh,22px)] sm:mb-7 relative z-20 transition-all duration-200 ${
            !isMobile && showDropdown && query.trim().length > 0
              ? "opacity-25 pointer-events-none"
              : "opacity-100"
          }`}
        >
          <div className="w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 sm:gap-2 w-max mx-auto pr-1">
              {CANONICAL_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    data-category-pill={cat.id}
                    aria-pressed={isSelected}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-[7px] rounded-full text-[12.5px] sm:text-[13px] tracking-[-0.01em] whitespace-nowrap shrink-0 transition-all duration-150 active:scale-95 cursor-pointer border ${
                      isSelected
                        ? "bg-white text-zinc-950 border-white font-semibold shadow-[0_4px_18px_rgba(255,255,255,0.16)]"
                        : "bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border-white/[0.09] hover:border-white/[0.18] font-medium"
                    }`}
                  >
                    {renderCategoryIcon(cat.id, isSelected)}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* 4. Live Photo Reviews Widescreen Gallery — Pure Flexbox Remaining-Space Architecture on Mobile */}
        <section
          className={`w-full flex-1 flex flex-col sm:flex-none relative transition-all duration-200 ${
            !isMobile && showDropdown && query.trim().length > 0
              ? "opacity-25 blur-[1.5px] pointer-events-none"
              : "opacity-100"
          }`}
        >
          <div className="flex items-center justify-between w-full shrink-0 mb-2.5 sm:mb-3.5 px-0.5">
            <div className="flex items-baseline gap-2 min-w-0">
              <h2 className="text-[16.5px] sm:text-[18.5px] font-semibold tracking-[-0.02em] text-white truncate">
                {activeCategoryMeta.headingLabel}
              </h2>
              <span className="hidden sm:inline text-[13.5px] text-zinc-500 font-normal">
                {activeCategory === "all"
                  ? "· Verified customer photos"
                  : `· ${displayedTrendingVideos.length} live ${displayedTrendingVideos.length === 1 ? "review" : "reviews"}`}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {displayedTrendingVideos.length > 4 && (
                <div className="hidden md:flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { if (canScrollLeft) scrollCarousel("left"); }}
                    disabled={!canScrollLeft}
                    aria-label="Previous photo reviews"
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                      canScrollLeft
                        ? "bg-white/[0.04] hover:bg-white/[0.1] border-white/[0.12] text-white cursor-pointer active:scale-95"
                        : "bg-transparent border-white/[0.06] text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (canScrollRight) scrollCarousel("right"); }}
                    disabled={!canScrollRight}
                    aria-label="Next photo reviews"
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                      canScrollRight
                        ? "bg-white/[0.04] hover:bg-white/[0.1] border-white/[0.12] text-white cursor-pointer active:scale-95"
                        : "bg-transparent border-white/[0.06] text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activeCategory !== "all" ? (
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className="inline-flex items-center gap-1 text-[13px] sm:text-[13.5px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                displayedTrendingVideos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewAll) onViewAll();
                      else if (displayedTrendingVideos.length > 0) onSelectVideo(displayedTrendingVideos[0].id);
                    }}
                    className="inline-flex items-center gap-1 text-[13px] sm:text-[13.5px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Explore all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          </div>

          {displayedTrendingVideos.length === 0 ? (
            categoryFallbackPlaces.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryFallbackPlaces.map(({ place, specificCategory, domain }) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => onOpenPlace(place.id)}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.18] transition-all text-left cursor-pointer group active:scale-[0.99]"
                    >
                      <CopoBrandLogo
                        domain={domain}
                        name={place.name}
                        logoUrl={place.logoUrl}
                        className="w-11 h-11 rounded-[12px] bg-white border border-white/15 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-sm"
                        imageClassName="w-full h-full object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-semibold text-white truncate">{place.name}</span>
                          <CheckCircle className="w-3.5 h-3.5 fill-white text-[#050506] shrink-0" />
                        </div>
                        <div className="text-[12px] text-zinc-400 truncate mt-0.5">
                          {specificCategory} · {domain}
                        </div>
                      </div>
                      <span className="text-[11.5px] font-medium text-zinc-300 group-hover:text-white px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] shrink-0">
                        Review
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full rounded-3xl bg-white/[0.03] border border-white/[0.08] px-5 py-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#111114] border border-white/[0.1] flex items-center justify-center">
                  <Camera className="w-5 h-5 text-zinc-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {activeCategory === "all" ? "No live photo reviews yet" : `No ${activeCategoryMeta.label.toLowerCase()} photo reviews yet`}
                  </p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Snap a live camera photo and pick 1 to 5 stars to share the first real review.
                  </p>
                </div>
                {onRecordReview && (
                  <button
                    type="button"
                    onClick={() => onRecordReview(null)}
                    className="mt-1 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs tracking-tight flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Add Review</span>
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="relative w-full max-w-full overflow-hidden flex-1 min-h-[235px] max-h-[365px] flex flex-col sm:block sm:flex-none sm:min-h-0 sm:max-h-none">
              {/* Compact Widescreen 5-Card Row on Desktop, Dynamic Remaining-Space 2+Peek Cards on Mobile */}
              <div
                ref={carouselRef}
                className="flex items-stretch gap-2.5 sm:gap-3.5 w-full max-w-full flex-1 min-h-0 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x no-scrollbar pb-0 sm:pb-2 snap-x snap-mandatory scroll-smooth"
              >
                {displayedTrendingVideos.map((video, idx) => {
                  const matchedPlace = places.find((p) => isPlaceReviewMatch(video, p));
                  const businessName = matchedPlace?.name || video.businessName || video.placeName || formatBusinessName(video.placeId) || "Business";
                  const brandDomain = extractCleanDomain(matchedPlace?.brandDomain || matchedPlace?.website || video.placeWebsite || video.placeId || "") || "";
                  const brandLogoUrl = matchedPlace?.logoUrl || video.placeLogoUrl || "";
                  const catInfo = reviewCategoryMap.get(video.id) || classifyBusinessCategory({
                    rawCategory: matchedPlace?.category || video.placeCategory,
                    name: businessName,
                    domain: brandDomain,
                    description: matchedPlace?.description
                  });

                  const author = resolveSafeAuthor(video, currentUser);
                  const creatorFullName = author?.name || (author?.firstName ? `${author.firstName} ${author.lastName || ""}`.trim() : "") || video.authorName || "Reviewer";
                  const rating = typeof video.rating === "number" ? video.rating : 5;
                  const wholeStars = getRoundedRating(rating);
                  const posterUrl = resolveVideoPosterUrl(video);
                  const recency = formatCompactRecency(video);

                  return (
                    <div
                      key={video.id}
                      role="button"
                      tabIndex={0}
                      data-trending-video-id={video.id}
                      data-category-id={catInfo.canonicalId}
                      onClick={() => onSelectVideo(video.id)}
                      onPointerEnter={() => {
                        if (posterUrl) preloadImage(posterUrl, "high");
                        preloadBusinessAssets(
                          brandLogoUrl,
                          matchedPlace?.bannerUrl || video.placeBannerUrl,
                          author?.avatar
                        );
                      }}
                      onTouchStart={() => {
                        if (posterUrl) preloadImage(posterUrl, "high");
                        preloadBusinessAssets(
                          brandLogoUrl,
                          matchedPlace?.bannerUrl || video.placeBannerUrl,
                          author?.avatar
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectVideo(video.id);
                        }
                      }}
                      className="relative shrink-0 self-stretch w-[clamp(162px,43.5vw,196px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-11px)] lg:w-[calc(20%-11.5px)] min-h-[235px] sm:min-h-0 sm:h-auto sm:aspect-[3/3.85] rounded-[22px] overflow-hidden bg-[#111114] border border-white/[0.09] hover:border-white/[0.24] shadow-[0_14px_36px_rgba(0,0,0,0.6)] group cursor-pointer select-none touch-manipulation transition-all duration-300 hover:-translate-y-1 snap-start"
                    >
                      {/* Clean Neutral Obsidian Fallback */}
                      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-[#08080a] flex flex-col items-center justify-center p-4 text-center z-0">
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white font-semibold text-base mb-2">
                          {businessName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-zinc-400 line-clamp-2">{businessName}</span>
                      </div>

                      {/* Full-Bleed Live Photo Review */}
                      {posterUrl && (
                        <img
                          src={posterUrl}
                          alt={`${businessName} ${catInfo.badgeLabel.toLowerCase()} photo review by ${creatorFullName}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.035] transition-transform duration-500 ease-out z-10 pointer-events-none"
                          loading="eager"
                          decoding="sync"
                          fetchPriority={idx < 8 ? "high" : "auto"}
                          referrerPolicy={/^https?:\/\//i.test(posterUrl) ? "no-referrer" : undefined}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.dataset.triedProxy && posterUrl.startsWith("http")) {
                              target.dataset.triedProxy = "true";
                              target.src = `/api/proxy-image?url=${encodeURIComponent(posterUrl)}`;
                            } else {
                              target.style.display = "none";
                            }
                          }}
                        />
                      )}

                      {/* Top Row: Clear Category Pill Left + Subtle Recency Pill Right */}
                      <div className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 flex items-center justify-between gap-1.5 z-20 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-full bg-black/58 backdrop-blur-md border border-white/[0.15] text-[10.5px] sm:text-[11px] font-medium text-white/95 leading-none tracking-[-0.01em] shadow-sm truncate max-w-[108px]">
                          {catInfo.badgeLabel}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-black/48 backdrop-blur-md border border-white/[0.11] text-[10px] sm:text-[10.5px] font-medium text-white/85 leading-none tabular-nums shrink-0">
                          {recency}
                        </span>
                      </div>

                      {/* Bottom Unmistakable Customer Review Scrim: Full 5-Star Rating Row + Business + Reviewer */}
                      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.78)_44%,rgba(0,0,0,0.28)_76%,transparent_100%)] pt-14 sm:pt-20 pb-2.5 sm:pb-3 px-2.5 sm:px-3.5 z-20 pointer-events-none">
                        {/* 5-Star Solid Rating Row — Instant Universal Review Signal */}
                        <div className="flex items-center gap-1.5 mb-2" aria-label={`Rated ${wholeStars} out of 5 stars`}>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3 h-3 sm:w-[13px] sm:h-[13px] ${
                                  starIdx <= wholeStars
                                    ? "fill-[#F5B942] text-[#F5B942]"
                                    : "fill-white/15 text-white/25"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-semibold text-white/95 leading-none tabular-nums">
                            {wholeStars}/5
                          </span>
                        </div>

                        {/* Business Brand Row + Reviewer Attribution */}
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <CopoBrandLogo
                            domain={brandDomain || video.placeId}
                            name={businessName}
                            logoUrl={brandLogoUrl}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-[9px] sm:rounded-[10px] bg-white/95 border border-white/25 flex items-center justify-center shrink-0 overflow-hidden p-0.5 sm:p-1 shadow-md"
                            imageClassName="w-full h-full object-contain"
                            fallbackTextClassName="text-[11px] font-bold text-zinc-900"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-white text-[12.5px] sm:text-[13.5px] font-semibold tracking-[-0.015em] truncate leading-tight drop-shadow-xs">
                                {businessName}
                              </span>
                              <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0 inline-block" />
                            </div>
                            <div className="text-white/75 text-[10.5px] sm:text-[11px] font-normal truncate mt-0.5">
                              Review by {creatorFullName}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Whisper-Quiet Minimal Desktop Footer (About / Privacy / Terms live cleanly here) */}
        <footer className="hidden md:flex items-center justify-between w-full mt-auto pt-10 pb-2 border-t border-white/[0.06] text-[12px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>{t("legal.allRightsReserved", "© 2026 Yoouz. All rights reserved.")}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">{t("legal.tagline", "Real Photos. Real Proof.")}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onOpenMore?.()}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-zinc-400 whitespace-nowrap"
            >
              {t("legal.about", "About")}
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal ? onOpenLegal("privacy") : onOpenMore?.()}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-zinc-400 whitespace-nowrap"
            >
              {t("legal.privacy", "Privacy")}
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal ? onOpenLegal("terms") : onOpenMore?.()}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-zinc-400 whitespace-nowrap"
            >
              {t("legal.terms", "Terms")}
            </button>
            <button
              type="button"
              onClick={() => onOpenBusiness ? onOpenBusiness() : window.open("/business", "_blank", "noopener,noreferrer")}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-zinc-300 font-medium whitespace-nowrap"
            >
              Yoouz for Business
            </button>
          </div>
        </footer>
      </main>

      {/* Guaranteed Floating-Dock Safe Clearance Spacer (< md) — Prevents overlap on every phone & browser */}
      <div
        className="md:hidden w-full shrink-0 h-[max(94px,calc(env(safe-area-inset-bottom,0px)+82px))]"
        aria-hidden="true"
      />
    </div>
  );
};
