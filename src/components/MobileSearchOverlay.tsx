import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Loader2,
  Building2,
  User,
  CheckCircle,
  Camera,
  ChevronRight,
  Star,
  Clock,
  Globe,
  ArrowRight
} from "lucide-react";
import { SuggestionItem } from "./CopoHomePage";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { Place, VideoReview } from "../types";
import {
  extractCleanDomain,
  formatBusinessName,
  isPlaceReviewMatch,
  KNOWN_OFFICIAL_NAMES,
  getReviewTime
} from "../utils/placeUtils";
import { KNOWN_BRAND_LOGOS, isGenericOrPlaceholderLogo } from "../utils/logoUtils";
import { isPurgedItem } from "../hooks/useFeedPagination";
import { classifyBusinessCategory } from "../utils/categoryUtils";

const RECENT_SEARCHES_KEY = "yoouz_recent_searches_v1";
const MAX_RECENT_SEARCHES = 5;

interface RecentSearchEntry {
  title: string;
  domain: string;
  logoUrl?: string;
}

interface TrendingBusinessEntry {
  key: string;
  title: string;
  domain: string;
  logoUrl?: string;
  rating: number;
  reviewCount: number;
  latestTime: number;
  place?: Place;
}

interface MobileSearchOverlayProps {
  query: string;
  setQuery: (q: string) => void;
  suggestions: SuggestionItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestion: (item: SuggestionItem) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isResolving?: boolean;
  searchMode?: "general" | "review";
  places?: Place[];
  videos?: VideoReview[];
  suggestedDomains?: string[];
  onQuickSelectDomain?: (domain: string) => void;
  onSelectTrendingPlace?: (place: Place) => void;
}

function loadRecentSearches(): RecentSearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const cleanList: RecentSearchEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item.title !== "string" || !item.title.trim()) continue;
      const cleanDom = String(item.domain || "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\d*\./i, "")
        .split("/")[0];
      const dedupeKey = cleanDom || item.title.trim().toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      cleanList.push({
        title: item.title.trim(),
        domain: cleanDom,
        logoUrl: item.logoUrl
      });
      if (cleanList.length >= MAX_RECENT_SEARCHES) break;
    }
    return cleanList;
  } catch {
    return [];
  }
}

function saveRecentSearches(items: RecentSearchEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, MAX_RECENT_SEARCHES)));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({
  query,
  setQuery,
  suggestions,
  isOpen,
  onClose,
  onSelectSuggestion,
  onSubmit,
  isLoading,
  isResolving = false,
  searchMode = "general",
  places = [],
  videos = [],
  onQuickSelectDomain,
  onSelectTrendingPlace
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>(() => loadRecentSearches());
  const isReviewMode = searchMode === "review";

  const recordRecent = (entry: RecentSearchEntry) => {
    const cleanTitle = (entry.title || "").trim();
    const cleanDomain = (entry.domain || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\d*\./i, "")
      .split("/")[0];
    if (!cleanTitle && !cleanDomain) return;
    setRecentSearches((prev) => {
      const dedupeKey = cleanDomain || cleanTitle.toLowerCase();
      const filtered = prev.filter(
        (item) => (item.domain || item.title).trim().toLowerCase() !== dedupeKey
      );
      const next = [
        {
          title: cleanTitle || cleanDomain,
          domain: cleanDomain,
          logoUrl: entry.logoUrl
        },
        ...filtered
      ].slice(0, MAX_RECENT_SEARCHES);
      saveRecentSearches(next);
      return next;
    });
  };

  const handleRemoveRecent = (targetKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter(
        (item) => (item.domain || item.title).trim().toLowerCase() !== targetKey
      );
      saveRecentSearches(next);
      return next;
    });
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  // Synchronous focus on layout so iOS/iPadOS Safari keeps the active tap gesture
  useLayoutEffect(() => {
    if (isOpen && inputRef.current) {
      try {
        inputRef.current.focus({ preventScroll: true });
      } catch {
        inputRef.current.focus();
      }
      if (document.activeElement === inputRef.current) {
        setIsFocused(true);
      }
    }
  }, [isOpen]);

  // Fallback focus for slower layout frames / Android keyboards
  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        try {
          inputRef.current.focus({ preventScroll: true });
        } catch {
          inputRef.current.focus();
        }
      }
    });
    const timer = setTimeout(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        try {
          inputRef.current.focus({ preventScroll: true });
        } catch {
          inputRef.current.focus();
        }
      }
    }, 60);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Build real-time business stats and ranked trending businesses from live videos & places
  const { trendingBusinesses, statsByKey } = useMemo(() => {
    const activeVideos = Array.isArray(videos)
      ? videos.filter((v) => v && v.id && !isPurgedItem(v))
      : [];

    const map = new Map<
      string,
      {
        key: string;
        title: string;
        domain: string;
        logoUrl?: string;
        ratingSum: number;
        reviewCount: number;
        latestTime: number;
        place?: Place;
      }
    >();

    // First index businesses from active live reviews
    for (const v of activeVideos) {
      const matchedPlace = places.find((p) => isPlaceReviewMatch(v, p));
      const dom =
        extractCleanDomain(
          matchedPlace?.brandDomain || matchedPlace?.website || v.placeWebsite || v.placeId || ""
        ) || "";
      const domLow = dom.toLowerCase();
      if (domLow.includes("yoouz")) continue;

      const rawName =
        (domLow && KNOWN_OFFICIAL_NAMES[domLow]) ||
        matchedPlace?.name ||
        v.businessName ||
        v.placeName ||
        (dom ? formatBusinessName(dom, dom) : "") ||
        "";
      const cleanTitle = rawName.trim();
      if (!cleanTitle && !domLow) continue;

      const key = domLow || (matchedPlace?.id || v.placeId || cleanTitle).toLowerCase();
      const ratingVal = typeof v.rating === "number" && v.rating >= 1 && v.rating <= 5 ? v.rating : 5;
      const reviewTime = getReviewTime(v);
      const resolvedLogo =
        (matchedPlace?.logoUrl && !isGenericOrPlaceholderLogo(matchedPlace.logoUrl)
          ? matchedPlace.logoUrl
          : "") ||
        (v.placeLogoUrl && !isGenericOrPlaceholderLogo(v.placeLogoUrl) ? v.placeLogoUrl : "") ||
        (domLow && KNOWN_BRAND_LOGOS[domLow] ? KNOWN_BRAND_LOGOS[domLow] : "") ||
        (domLow.includes(".") ? `/api/favicon?domain=${encodeURIComponent(domLow)}` : "");

      const existing = map.get(key);
      if (existing) {
        existing.ratingSum += ratingVal;
        existing.reviewCount += 1;
        if (reviewTime > existing.latestTime) existing.latestTime = reviewTime;
        if (!existing.place && matchedPlace) existing.place = matchedPlace;
        if (!existing.logoUrl && resolvedLogo) existing.logoUrl = resolvedLogo;
      } else {
        map.set(key, {
          key,
          title: cleanTitle || dom,
          domain: domLow.includes(".") ? domLow : "",
          logoUrl: resolvedLogo || undefined,
          ratingSum: ratingVal,
          reviewCount: 1,
          latestTime: reviewTime,
          place: matchedPlace
        });
      }
    }

    // Supplement with existing places if fewer than 6 reviewed businesses exist
    for (const p of places) {
      if (map.size >= 8) break;
      const dom = extractCleanDomain(p.brandDomain || p.website || p.id || "") || "";
      const domLow = dom.toLowerCase();
      if (domLow.includes("yoouz")) continue;
      const key = domLow || (p.id || p.name || "").toLowerCase();
      if (!key || map.has(key)) continue;

      const cleanTitle =
        (domLow && KNOWN_OFFICIAL_NAMES[domLow]) ||
        (p.name || "").trim() ||
        (dom ? formatBusinessName(dom, dom) : "");
      if (!cleanTitle) continue;

      const resolvedLogo =
        (p.logoUrl && !isGenericOrPlaceholderLogo(p.logoUrl) ? p.logoUrl : "") ||
        (domLow && KNOWN_BRAND_LOGOS[domLow] ? KNOWN_BRAND_LOGOS[domLow] : "") ||
        (domLow.includes(".") ? `/api/favicon?domain=${encodeURIComponent(domLow)}` : "");

      map.set(key, {
        key,
        title: cleanTitle,
        domain: domLow.includes(".") ? domLow : "",
        logoUrl: resolvedLogo || undefined,
        ratingSum: (typeof p.rating === "number" ? p.rating : 5) * Math.max(0, p.totalReviews || 0),
        reviewCount: Math.max(0, p.totalReviews || 0),
        latestTime: 0,
        place: p
      });
    }

    const list: TrendingBusinessEntry[] = Array.from(map.values())
      .map((entry) => ({
        key: entry.key,
        title: entry.title,
        domain: entry.domain,
        logoUrl: entry.logoUrl,
        rating:
          entry.reviewCount > 0
            ? Math.round((entry.ratingSum / entry.reviewCount) * 10) / 10
            : entry.place?.rating || 0,
        reviewCount: entry.reviewCount,
        latestTime: entry.latestTime,
        place: entry.place
      }))
      .sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return b.latestTime - a.latestTime;
      });

    const lookup = new Map<string, TrendingBusinessEntry>();
    for (const item of list) {
      lookup.set(item.key, item);
      if (item.domain) lookup.set(item.domain.toLowerCase(), item);
      if (item.title) lookup.set(item.title.toLowerCase(), item);
    }

    return {
      trendingBusinesses: list.slice(0, 6),
      statsByKey: lookup
    };
  }, [places, videos]);

  const visibleSuggestions = useMemo(() => {
    const seenDom = new Set<string>();
    const seenTitle = new Set<string>();
    const result: SuggestionItem[] = [];
    for (const raw of suggestions) {
      if (isReviewMode && raw.isCreator) continue;
      const cleanDom = (raw.domain || "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\d*\./i, "")
        .split("/")[0];
      const titleKey = (raw.title || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim();
      if (cleanDom && seenDom.has(cleanDom)) continue;
      if (!raw.isCreator && titleKey && seenTitle.has(titleKey)) continue;
      if (cleanDom) seenDom.add(cleanDom);
      if (!raw.isCreator && titleKey) seenTitle.add(titleKey);
      result.push({
        ...raw,
        domain: cleanDom
      });
    }
    return result;
  }, [suggestions, isReviewMode]);

  const handleSelectItem = (item: SuggestionItem) => {
    if (!item.isCreator) {
      recordRecent({
        title: item.title,
        domain: item.domain || "",
        logoUrl: item.logoUrl
      });
    }
    onSelectSuggestion(item);
  };

  const handleSelectTrending = (entry: TrendingBusinessEntry) => {
    recordRecent({
      title: entry.title,
      domain: entry.domain,
      logoUrl: entry.logoUrl
    });
    if (entry.place && onSelectTrendingPlace) {
      onSelectTrendingPlace(entry.place);
      return;
    }
    onSelectSuggestion({
      id: entry.place?.id || entry.domain || entry.title,
      title: entry.title,
      domain: entry.domain,
      logoUrl: entry.logoUrl
    });
  };

  const handleTapRecent = (entry: RecentSearchEntry) => {
    recordRecent(entry);
    if (entry.domain && onQuickSelectDomain) {
      onQuickSelectDomain(entry.domain);
    } else {
      onSelectSuggestion({
        id: entry.domain || entry.title,
        title: entry.title,
        domain: entry.domain,
        logoUrl: entry.logoUrl
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const cleanDom = extractCleanDomain(trimmed);
    recordRecent({
      title: (cleanDom && KNOWN_OFFICIAL_NAMES[cleanDom]) || trimmed,
      domain: cleanDom && cleanDom.includes(".") ? cleanDom : ""
    });
    onSubmit(e);
  };

  const handleBodyScroll = () => {
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop > 14 &&
      document.activeElement === inputRef.current
    ) {
      inputRef.current?.blur();
    }
  };

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  return (
    <div
      className="fixed inset-0 z-[500] w-full max-w-full bg-[#050506] text-white flex flex-col h-[100dvh] select-none overflow-hidden overscroll-none animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={isReviewMode ? "Choose a business to review" : "Search Yoouz"}
    >
      {/* Subtle Flagship Obsidian Top Ambient Depth */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[min(420px,100%)] h-[200px] bg-gradient-to-b from-white/[0.045] via-white/[0.015] to-transparent rounded-full blur-3xl"
        aria-hidden="true"
      />

      {/* Sticky Top Chrome */}
      <div className="relative z-20 shrink-0 border-b border-white/[0.07] bg-[#050506]/92 backdrop-blur-2xl pt-[max(12px,env(safe-area-inset-top,12px))]">
        {isReviewMode ? (
          <>
            {/* Mode Title Bar for Add Photo Review */}
            <div className="flex items-center justify-between px-4 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[10px] bg-[#121216] border border-white/[0.12] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
                  <Camera className="w-4 h-4 text-white stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-semibold text-white tracking-[-0.02em] leading-tight truncate">
                    Add a photo review
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 -mr-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] flex items-center justify-center text-zinc-200 hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5 stroke-[2.1]" />
              </button>
            </div>

            {/* Full-Width Spotlight Search Pill */}
            <div className="px-4 pb-3">
              <form onSubmit={handleFormSubmit} className="w-full" autoComplete="off" role="search">
                <div
                  onClick={() => inputRef.current?.focus()}
                  className={`relative flex items-center w-full h-12 bg-white/[0.055] rounded-full pl-4 pr-1.5 border transition-all duration-150 cursor-text ${
                    isFocused
                      ? "border-white/35 ring-2 ring-white/[0.08] bg-white/[0.07]"
                      : "border-white/[0.14]"
                  }`}
                >
                  <Search className="w-[18px] h-[18px] text-zinc-400 mr-2.5 shrink-0 pointer-events-none" />
                  <input
                    ref={inputRef}
                    id="yoouz-mobile-search-input"
                    name="yoouz_mobile_q_disabled"
                    type="text"
                    autoFocus
                    enterKeyHint="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search place, brand, or URL"
                    className="w-full min-w-0 bg-transparent text-white text-[16px] font-normal focus:outline-none placeholder:text-zinc-400/85 caret-white select-text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    aria-autocomplete="none"
                  />
                  {(isLoading || isResolving) && (
                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin ml-2 shrink-0" />
                  )}
                  {hasQuery && !isLoading && !isResolving && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQuery("");
                        inputRef.current?.focus();
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-90 transition-all shrink-0 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {hasQuery && (
                    <button
                      type="submit"
                      disabled={isResolving}
                      aria-label="Continue to camera"
                      className="ml-1 w-9 h-9 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer shadow-[0_4px_14px_rgba(255,255,255,0.16)]"
                    >
                      {isResolving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 stroke-[2.3]" />
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        ) : (
          /* General Search Mode — Sleek Spotlight Top Bar */
          <div className="flex items-center gap-2.5 px-4 pb-3">
            <form onSubmit={handleFormSubmit} className="flex-1 min-w-0" autoComplete="off" role="search">
              <div
                onClick={() => inputRef.current?.focus()}
                className={`relative flex items-center w-full h-12 bg-white/[0.055] rounded-full pl-4 pr-2 border transition-all duration-150 cursor-text ${
                  isFocused
                    ? "border-white/35 ring-2 ring-white/[0.08] bg-white/[0.07]"
                    : "border-white/[0.14]"
                }`}
              >
                <Search className="w-[18px] h-[18px] text-zinc-400 mr-2.5 shrink-0 pointer-events-none" />
                <input
                  ref={inputRef}
                  id="yoouz-mobile-search-input"
                  name="yoouz_mobile_q_disabled"
                  type="text"
                  autoFocus
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Search place, brand, or URL"
                  className="w-full min-w-0 bg-transparent text-white text-[16px] font-normal focus:outline-none placeholder:text-zinc-400/85 caret-white select-text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                />
                {(isLoading || isResolving) && (
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin ml-2 shrink-0" />
                )}
                {hasQuery && !isLoading && !isResolving && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white bg-white/[0.08] active:scale-90 transition-all ml-1.5 shrink-0 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-2 text-zinc-300 hover:text-white font-medium text-[15px] tracking-[-0.01em] transition-colors shrink-0 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Discovery / Results Canvas */}
      <div
        ref={scrollContainerRef}
        onScroll={handleBodyScroll}
        className="relative z-10 flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,16px)+28px)] no-scrollbar"
      >
        {!hasQuery ? (
          /* ================= ZERO-STATE SPOTLIGHT DISCOVERY ================= */
          <div className="space-y-5">
            {isReviewMode && (
              <p className="text-[13px] text-zinc-400 leading-snug px-0.5 -mt-1">
                Pick a business below or enter any website URL to open the live camera.
              </p>
            )}

            {/* Recent Searches (Persisted in localStorage) */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-0.5 mb-2.5">
                  <h3 className="text-[13px] font-semibold text-zinc-400 tracking-[-0.01em]">
                    Recent
                  </h3>
                  <button
                    type="button"
                    onClick={handleClearRecents}
                    className="text-[13px] font-medium text-zinc-400 hover:text-white px-1.5 py-1 -mr-1.5 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06] overflow-hidden">
                  {recentSearches.map((item) => {
                    const key = (item.domain || item.title).trim().toLowerCase();
                    return (
                      <div
                        key={key}
                        onClick={() => handleTapRecent(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleTapRecent(item);
                          }
                        }}
                        className="w-full min-h-[54px] pl-3.5 pr-1.5 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-400">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                          <span className="text-[14.5px] font-medium text-white truncate">
                            {item.title}
                          </span>
                          {item.domain && item.domain !== item.title.toLowerCase() && (
                            <span className="text-[12.5px] text-zinc-500 truncate">
                              · {item.domain}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(key, e)}
                          aria-label={`Remove ${item.title} from recent`}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] active:scale-90 transition-all shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trending / Popular Businesses Grouped Sheet */}
            {trendingBusinesses.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-0.5 mb-2.5">
                  <h3 className="text-[13px] font-semibold text-zinc-400 tracking-[-0.01em]">
                    {isReviewMode ? "Popular to review" : "Trending on Yoouz"}
                  </h3>
                  {isReviewMode && (
                    <span className="text-[12px] text-zinc-500 font-normal">
                      Tap to open camera
                    </span>
                  )}
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06] overflow-hidden">
                  {trendingBusinesses.map((biz) => (
                    <button
                      key={biz.key}
                      type="button"
                      onClick={() => handleSelectTrending(biz)}
                      className="w-full min-h-[64px] px-3.5 py-3 flex items-center gap-3.5 hover:bg-white/[0.045] active:bg-white/[0.08] text-left transition-colors cursor-pointer group"
                    >
                      {biz.domain || biz.logoUrl ? (
                        <CopoBrandLogo
                          domain={biz.domain || biz.key}
                          name={biz.title}
                          logoUrl={biz.logoUrl}
                          className="w-11 h-11 rounded-xl bg-white border border-white/[0.12] flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-xs"
                          imageClassName="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#121216] border border-white/[0.1] flex items-center justify-center shrink-0">
                          <Building2 className="w-4.5 h-4.5 text-zinc-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-semibold text-white tracking-[-0.015em] truncate">
                            {biz.title}
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 fill-white text-[#050506] shrink-0" />
                        </div>
                        <div className="flex items-center gap-1.5 text-[12.5px] text-zinc-400 mt-0.5 tabular-nums overflow-hidden whitespace-nowrap">
                          {biz.domain && <span className="truncate min-w-0 max-w-[110px]">{biz.domain}</span>}
                          {(() => {
                            const catInfo = classifyBusinessCategory({
                              rawCategory: biz.place?.category,
                              name: biz.title,
                              domain: biz.domain,
                              description: biz.place?.description
                            });
                            const catBadge = catInfo.isFallback ? "" : catInfo.badgeLabel;
                            return catBadge ? (
                              <>
                                {biz.domain && <span aria-hidden="true">·</span>}
                                <span className="shrink-0">{catBadge}</span>
                              </>
                            ) : null;
                          })()}
                          {biz.reviewCount > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 text-zinc-300 shrink-0">
                                <Star className="w-3 h-3 fill-[#F5B942] text-[#F5B942]" />
                                {biz.rating.toFixed(1)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="shrink-0">
                                {biz.reviewCount} {biz.reviewCount === 1 ? "review" : "reviews"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {isReviewMode ? (
                        <div className="w-9 h-9 rounded-full bg-white/[0.07] group-hover:bg-white group-hover:text-zinc-950 border border-white/[0.12] flex items-center justify-center text-white shrink-0 transition-colors">
                          <Camera className="w-4 h-4 stroke-[2]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 shrink-0 transition-colors" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= LIVE TYPING & AUTOCOMPLETE RESULTS ================= */
          <div className="space-y-4">
            {/* Shimmer Loading State when awaiting first results */}
            {isLoading && visibleSuggestions.length === 0 && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06] overflow-hidden">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="px-3.5 py-3 flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.06] shrink-0 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 rounded bg-white/[0.07] animate-pulse" />
                      <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Matched Suggestions List */}
            {visibleSuggestions.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-0.5 mb-2">
                  <h3 className="text-[13px] font-semibold text-zinc-400 tracking-[-0.01em]">
                    {isReviewMode ? "Matching businesses" : "Matches"}
                  </h3>
                  {isLoading && (
                    <span className="text-[12px] text-zinc-500">Updating...</span>
                  )}
                </div>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06] overflow-hidden">
                  {visibleSuggestions.map((item, idx) => {
                    const stats =
                      (!item.isCreator &&
                        (statsByKey.get((item.domain || "").toLowerCase()) ||
                          statsByKey.get((item.title || "").toLowerCase()))) ||
                      undefined;

                    return (
                      <button
                        key={`${item.id || item.domain || item.title}-${idx}`}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="w-full min-h-[64px] px-3.5 py-3 flex items-center gap-3.5 hover:bg-white/[0.05] active:bg-white/[0.08] text-left transition-colors group cursor-pointer"
                      >
                        {item.isCreator ? (
                          <div className="w-11 h-11 rounded-full bg-[#121216] border border-white/[0.1] flex items-center justify-center shrink-0 overflow-hidden">
                            {item.logoUrl ? (
                              <img
                                src={item.logoUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <User className="w-4.5 h-4.5 text-zinc-400" />
                            )}
                          </div>
                        ) : item.domain || item.logoUrl ? (
                          <CopoBrandLogo
                            domain={item.domain || item.id}
                            name={item.title}
                            logoUrl={item.logoUrl}
                            className="w-11 h-11 rounded-xl bg-white border border-white/[0.12] flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-xs"
                            imageClassName="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#121216] border border-white/[0.1] flex items-center justify-center shrink-0">
                            <Building2 className="w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[15px] tracking-[-0.015em] truncate">
                            {(() => {
                              const matchIdx = item.title.toLowerCase().indexOf(trimmedQuery.toLowerCase());
                              if (matchIdx >= 0) {
                                return (
                                  <span className="truncate">
                                    <span className="font-medium text-zinc-300">
                                      {item.title.slice(0, matchIdx)}
                                    </span>
                                    <span className="font-semibold text-white">
                                      {item.title.slice(matchIdx, matchIdx + trimmedQuery.length)}
                                    </span>
                                    <span className="font-medium text-zinc-300">
                                      {item.title.slice(matchIdx + trimmedQuery.length)}
                                    </span>
                                  </span>
                                );
                              }
                              return <span className="font-semibold text-white truncate">{item.title}</span>;
                            })()}
                            {!item.isCreator && Boolean(item.domain) && (
                              <CheckCircle className="w-3.5 h-3.5 fill-white text-[#050506] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[12.5px] text-zinc-400 mt-0.5 tabular-nums truncate">
                            {item.domain && <span className="truncate">{item.domain}</span>}
                            {!item.isCreator && (() => {
                              const catInfo = classifyBusinessCategory({
                                rawCategory: item.category,
                                name: item.title,
                                domain: item.domain || item.id
                              });
                              const catBadge = catInfo.isFallback ? "" : catInfo.badgeLabel;
                              return catBadge ? (
                                <>
                                  {item.domain && <span aria-hidden="true">·</span>}
                                  <span className="shrink-0">{catBadge}</span>
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

                        {isReviewMode ? (
                          <div className="w-9 h-9 rounded-full bg-white/[0.07] group-hover:bg-white group-hover:text-zinc-950 border border-white/[0.12] flex items-center justify-center text-white shrink-0 transition-colors">
                            <Camera className="w-4 h-4 stroke-[2]" />
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Always-Available Direct Launch Row (Zero Dead-Ends for Any Website/Brand) */}
            <button
              type="button"
              disabled={isResolving}
              onClick={(e) => handleFormSubmit(e)}
              className="w-full min-h-[64px] px-3.5 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] active:bg-white/[0.1] border border-white/[0.1] flex items-center gap-3.5 text-left transition-colors cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isReviewMode
                    ? "bg-white text-zinc-950 shadow-[0_4px_14px_rgba(255,255,255,0.14)]"
                    : "bg-[#121216] border border-white/[0.12] text-white"
                }`}
              >
                {isResolving ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : isReviewMode ? (
                  <Camera className="w-4.5 h-4.5 stroke-[2.1]" />
                ) : (
                  <Globe className="w-4.5 h-4.5 stroke-[1.9]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-semibold text-white truncate">
                  {isReviewMode
                    ? `Review “${trimmedQuery}”`
                    : `Look up “${trimmedQuery}”`}
                </p>
                <p className="text-[12.5px] text-zinc-400 truncate mt-0.5">
                  {isResolving
                    ? "Resolving business details..."
                    : isReviewMode
                    ? "Open live camera for this brand or website"
                    : "Open brand profile or resolve website URL"}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
