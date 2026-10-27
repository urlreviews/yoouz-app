import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Play, Star, ChevronLeft, ChevronRight, Menu, Loader2, X, Building2, CheckCircle, Bell, Video } from "lucide-react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { formatBusinessName, extractCleanDomain, resolveSafeAuthor, isPlaceReviewMatch, isValidDomainUrl } from "../utils/placeUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoHomePageProps {
  places: Place[];
  videos: VideoReview[];
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
  currentUser?: UserProfile | null;
  autoFocusSearch?: boolean;
  searchMode?: "general" | "review";
  headerTitle?: string;
  headerSubtitle?: string;
  onClose?: () => void;
}

interface SuggestionItem {
  id?: string;
  title: string;
  domain: string;
  logoUrl?: string;
  category?: string;
  address?: string;
}

export const CopoHomePage: React.FC<CopoHomePageProps> = ({
  places,
  videos,
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
  currentUser,
  autoFocusSearch = false,
  searchMode = "general",
  headerTitle,
  headerSubtitle,
  onClose
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  // Auto-focus search input when requested (e.g. tapping Search or Review in mobile bottom nav)
  useEffect(() => {
    if (autoFocusSearch) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocusSearch]);

  // Active trending videos (prioritizing videos with real titles and creators)
  const trendingVideos = useMemo(() => {
    if (!Array.isArray(videos)) return [];
    
    // Filter valid reviews, de-duplicate by place to show diverse businesses
    const seenPlaces = new Set<string>();
    const filtered: VideoReview[] = [];

    // Order: Verified/authentic seed videos first (Cetaphil, Zara, Art Coffee Gallery, Anthropic, Burger King, etc.)
    const sorted = [...videos].sort((a, b) => {
      // Prioritize high-rated, captioned videos
      const aScore = (a.rating || 5) * 10 + (a.thumbnailUrl ? 5 : 0) + (a.caption ? 3 : 0);
      const bScore = (b.rating || 5) * 10 + (b.thumbnailUrl ? 5 : 0) + (b.caption ? 3 : 0);
      return bScore - aScore;
    });

    for (const v of sorted) {
      if (!v || !v.id) continue;
      const pKey = (v.placeName || v.placeId || v.businessName || "").toLowerCase().trim();
      if (!seenPlaces.has(pKey)) {
        seenPlaces.add(pKey);
        filtered.push(v);
      }
    }

    return filtered.length > 0 ? filtered : sorted.slice(0, 10);
  }, [videos]);

  // Carousel scroll controls for desktop
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Live Auto-Suggest debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoadingSuggest(false);
      setShowDropdown(false);
      return;
    }

    // Fast local match (0ms)
    const qLow = trimmed.toLowerCase();
    const localMatches: SuggestionItem[] = places
      .filter((p) => {
        const pName = (p.name || "").toLowerCase();
        const pDom = (p.brandDomain || p.website || p.id || "").toLowerCase();
        return pName.includes(qLow) || pDom.includes(qLow);
      })
      .slice(0, 5)
      .map((p) => {
        const dom = extractCleanDomain(p.brandDomain || p.website || p.id) || "";
        return {
          id: p.id,
          title: p.name || dom,
          domain: dom.includes(".") ? dom : "",
          logoUrl: p.logoUrl && !p.logoUrl.includes("favicon") ? p.logoUrl : "",
          category: p.category || "Business",
          address: p.city || p.address || ""
        };
      });

    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setShowDropdown(true);
    }

    setIsLoadingSuggest(true);
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}`);
        if (resp.ok) {
          const data = await resp.json();
          const serverList: SuggestionItem[] = data.suggestions || [];
          const seen = new Set<string>();
          const merged: SuggestionItem[] = [];

          for (const item of [...localMatches, ...serverList]) {
            const key = (item.id || item.domain || item.title).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }
          setSuggestions(merged.slice(0, 8));
          setShowDropdown(true);
        }
      } catch (e) {
      } finally {
        setIsLoadingSuggest(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, places]);

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

  const resolveAndOpenBusiness = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    const cleanCandidate = extractCleanDomain(trimmed);
    if (cleanCandidate && isValidDomainUrl(cleanCandidate)) {
      if (searchMode === "review" && onRecordReview) {
        const existing = places.find(p => {
          const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
          return pDom?.toLowerCase() === cleanCandidate.toLowerCase();
        });
        if (existing) {
          onRecordReview(existing);
          return;
        }
      }
      onOpenPlace(cleanCandidate);
      return;
    }

    const qLow = trimmed.toLowerCase();
    const match = places.find(p => {
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      if (!pDom || !isValidDomainUrl(pDom)) return false;
      return (
        (p.name || "").toLowerCase() === qLow ||
        pDom.toLowerCase() === qLow ||
        (p.website || "").toLowerCase().includes(qLow)
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
          const officialName = formatBusinessName(meta.siteName || meta.title || trimmed, resolvedDomain) || trimmed;
          const newPlace: Place = {
            id: resolvedDomain,
            name: officialName,
            brandDomain: resolvedDomain,
            category: meta.category || "Verified Business",
            categoryType: "all",
            address: meta.address || "",
            city: meta.city || "",
            country: meta.country || "",
            lat: meta.lat || 0,
            lng: meta.lng || 0,
            rating: 5.0,
            totalReviews: 0,
            ratingDistribution: { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
            avatarUrl: meta.logo || "",
            logoUrl: meta.logo || "",
            bannerUrl: meta.image || "",
            ogImage: meta.image || "",
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

    if (searchMode === "review" && onRecordReview) {
      const fallback = places.find(p => p.id.toLowerCase() === trimmed.toLowerCase() || (p.name || "").toLowerCase() === trimmed.toLowerCase());
      if (fallback) {
        onRecordReview(fallback);
      } else {
        onOpenPlace(trimmed);
      }
    } else {
      onOpenPlace(trimmed);
    }
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setShowDropdown(false);
    setQuery(item.title);

    if (searchMode === "review") {
      const qLow = (item.title || "").toLowerCase().trim();
      const domLow = extractCleanDomain(item.domain || item.id || "")?.toLowerCase() || "";
      const match = places.find(p => {
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

    const candidateId = extractCleanDomain(item.id || "");
    const candidateDom = extractCleanDomain(item.domain || "");
    if (candidateId && isValidDomainUrl(candidateId)) {
      onOpenPlace(candidateId);
    } else if (candidateDom && isValidDomainUrl(candidateDom)) {
      onOpenPlace(candidateDom);
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
    <div className="flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 text-white flex flex-col select-none pb-[calc(env(safe-area-inset-bottom,16px)+64px)] md:pb-12 scroll-smooth">
      {/* 1. Header (Mobile Only) - Hamburger on Left, Official Dark Mode Icon & 'Yoouz' Wordmark, Balanced Right Spacer */}
      <header className="w-full flex md:hidden items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 select-none z-20 border-b border-zinc-900/60 bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <button
          type="button"
          onClick={onClose || onOpenMenu}
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-white hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer shrink-0"
          aria-label={onClose ? t("common.close", "Close") : t("nav.openMenu", "Open menu")}
        >
          {onClose ? (
            <X className="w-6 h-6 stroke-[2.2]" />
          ) : (
            <Menu className="w-6 h-6 stroke-[2.2]" />
          )}
        </button>

        {/* Official Dark Mode Yoouz Brand Logo or Review Mode Title */}
        {searchMode === "review" ? (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-[32px] h-[32px] rounded-[11px] bg-zinc-900 border border-zinc-800 text-white shadow-md shrink-0">
              <Video className="w-4 h-4 stroke-[2.2] text-white" />
            </div>
            <span className="text-white text-[17px] font-bold tracking-tight">
              {headerTitle || "Search Business"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-[34px] h-[34px] rounded-[11px] bg-zinc-900 shadow-md shrink-0 border border-zinc-800">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-white">
                <path d="M12 3.8l2.32 4.7 5.18 0.75-3.75 3.65 0.88 5.16L12 15.62l-4.63 2.44 0.88-5.16-3.75-3.65 5.18-0.75L12 3.8z" />
              </svg>
            </div>
            <span className="text-white text-[20px] font-black tracking-tight leading-none font-['Google_Sans',sans-serif]">
              Yoouz
            </span>
          </div>
        )}

        {/* Right Action: Notifications or Balanced Spacer */}
        {onClose ? (
          <div className="w-10 h-10 -mr-1" aria-hidden="true" />
        ) : (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative w-10 h-10 -mr-1 rounded-full flex items-center justify-center text-zinc-100 hover:text-white hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label={t("nav.notifications", "Notifications")}
            title={t("nav.notifications", "Notifications")}
          >
            <Bell className="w-5.5 h-5.5 stroke-[2.1]" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-zinc-950" />
              </span>
            )}
          </button>
        )}
      </header>

      {/* Main Content Area - Optimized compact vertical spacing so videos sit higher up on desktop */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-3 xs:pt-4 sm:pt-6 md:pt-6 lg:pt-8 flex flex-col items-center">
        
        {/* 2. Hero Copy */}
        <div className="w-full text-center max-w-2xl mx-auto mb-4 xs:mb-5 sm:mb-6 md:mb-6 animate-in fade-in duration-300">
          <h1 className="text-[26px] xs:text-[28px] sm:text-4xl md:text-5xl lg:text-[50px] font-black text-white tracking-tight leading-[1.12]">
            {searchMode === "review" ? (
              <>
                <span className="block">Find a Business</span>
                <span className="block mt-0.5 sm:mt-1.5">To Review</span>
              </>
            ) : (
              <>
                <span className="block">See the Truth</span>
                <span className="block mt-0.5 sm:mt-1.5">Before You Decide</span>
              </>
            )}
          </h1>
          <p className="text-zinc-200 text-[14.5px] xs:text-[15.5px] sm:text-lg md:text-[18px] mt-2 sm:mt-3 leading-relaxed max-w-[340px] xs:max-w-md sm:max-w-xl mx-auto font-medium text-balance">
            {searchMode === "review"
              ? (headerSubtitle || "Search any business, product, or place to record your authentic 60-second video review.")
              : "Watch authentic video reviews of any place, product, or service, or record your own."
            }
          </p>
        </div>

        {/* 3. Search Component - Compact margins so Trending Video Reviews sits higher up on desktop */}
        <div className="w-full max-w-2xl relative mx-auto mb-6 xs:mb-7 sm:mb-8 md:mb-8 lg:mb-10" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative flex items-center w-full bg-zinc-900/70 hover:bg-zinc-900/85 backdrop-blur-xl border border-zinc-800/80 hover:border-zinc-700/80 focus-within:border-zinc-500 focus-within:ring-4 focus-within:ring-white/10 rounded-full px-4 sm:px-5 py-2.5 sm:py-3.5 shadow-2xl transition-all duration-200">
              <Search className="w-5 h-5 text-zinc-300 shrink-0 ml-0.5 mr-2.5 sm:mr-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="copo-main-search-input"
                type="text"
                dir="auto"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder={
                  searchMode === "review"
                    ? "Search business name, place, or website to review..."
                    : t("search.placeholder", "Search any business, service, or place...")
                }
                style={{ caretColor: "#007aff" }}
                className="w-full min-w-0 bg-transparent text-white text-[14px] xs:text-[15px] sm:text-base placeholder:text-zinc-400 placeholder:truncate focus:outline-none font-medium pr-2 truncate caret-[#007aff]"
              />

              {/* Right Side: Subtle Spinner / Clear Button */}
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                {(isLoadingSuggest || isResolvingPlace) && (
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                )}
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSuggestions([]);
                      setShowDropdown(false);
                      setSelectedIndex(-1);
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                    title={t("common.clear", "Clear")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Autocomplete Dropdown: No scrollbar on mobile PWA, smooth custom thin scrollbar on desktop */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2.5 bg-zinc-900/98 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden z-50 divide-y divide-zinc-800/60 max-h-[340px] overflow-y-auto no-scrollbar md:scrollbar-thin md:[scrollbar-width:thin] md:scrollbar-thumb-zinc-700/60 hover:md:scrollbar-thumb-zinc-500 md:scrollbar-track-transparent animate-in fade-in duration-150 overscroll-contain">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full px-4 py-3 flex items-center gap-3.5 transition-colors text-left cursor-pointer group ${
                    selectedIndex === idx ? "bg-zinc-800/90 text-white" : "hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0 overflow-hidden text-zinc-300 shadow-xs">
                    {item.logoUrl ? (
                      <img src={item.logoUrl} alt={item.title} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white group-hover:text-zinc-200 transition-colors truncate">
                      <span>{item.title}</span>
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0 inline-block" />
                    </div>
                    {item.domain && (
                      <div className="text-xs text-zinc-400 truncate font-medium mt-0.5">
                        {item.domain}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Trending Video Reviews Grid / Carousel - Hidden while typing so search results sit on a clean canvas */}
        {!query.trim() && (
          <section className="w-full relative mt-1 xs:mt-2 sm:mt-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between w-full mb-2.5 sm:mb-3 px-1">
              <h2 className="text-xs sm:text-sm font-bold tracking-wider text-zinc-400 uppercase">
                Trending Video Reviews
              </h2>
            <button
              type="button"
              onClick={() => {
                if (onViewAll) onViewAll();
                else if (trendingVideos.length > 0) onSelectVideo(trendingVideos[0].id);
              }}
              className="text-xs sm:text-sm font-bold tracking-wider text-zinc-400 hover:text-white uppercase transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* Cards Container: Responsive Horizontal Carousel on Mobile, 4-Column Grid on Desktop */}
          <div className="relative group/carousel">
            {/* Desktop Carousel Navigation Arrows */}
            {trendingVideos.length > 4 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-700 items-center justify-center text-white shadow-2xl opacity-80 hover:opacity-100 transition-all z-20 cursor-pointer active:scale-95"
                  aria-label="Previous videos"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-700 items-center justify-center text-white shadow-2xl opacity-80 hover:opacity-100 transition-all z-20 cursor-pointer active:scale-95"
                  aria-label="Next videos"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Carousel Wrapper: Single horizontal row on desktop and mobile */}
            <div
              ref={carouselRef}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-3 snap-x snap-mandatory px-0.5 scroll-smooth"
            >
              {trendingVideos.slice(0, 10).map((video) => {
                const matchedPlace = places.find(p => isPlaceReviewMatch(video, p));
                const businessName = matchedPlace?.name || video.businessName || video.placeName || formatBusinessName(video.placeId) || "Business";
                
                const author = resolveSafeAuthor(video, currentUser);
                const creatorFullName = author?.name || (author?.firstName ? `${author.firstName} ${author.lastName || ""}`.trim() : "") || video.authorName || "Reviewer";
                const rating = typeof video.rating === "number" ? video.rating : 5.0;
                const posterUrl = resolveVideoPosterUrl(video);

                return (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo(video.id)}
                    className="relative shrink-0 w-[165px] xs:w-[185px] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] h-[305px] xs:h-[340px] sm:h-auto sm:aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 shadow-lg group cursor-pointer select-none transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 snap-start"
                  >
                    {/* Video Thumbnail */}
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={`${businessName} review - ${creatorFullName}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.dataset.triedProxy && posterUrl.startsWith("http")) {
                            target.dataset.triedProxy = "true";
                            target.src = `/api/proxy-image?url=${encodeURIComponent(posterUrl)}`;
                          } else if (!target.dataset.triedBanner && video.placeBannerUrl) {
                            target.dataset.triedBanner = "true";
                            target.src = video.placeBannerUrl;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-zinc-700" />
                      </div>
                    )}

                    {/* Top-Left Star Badge: ⭐ 5.0 */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-md z-10 pointer-events-none">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] sm:text-xs font-bold text-white leading-none">
                        {rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Centered Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-zinc-950 transition-all duration-200 shadow-xl">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Clean Bottom Scrim: Business Name & Creator Full Name */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pt-10 pb-3 px-2.5 sm:px-4 flex flex-col justify-end z-10 pointer-events-none">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-white text-[13px] sm:text-base font-bold tracking-tight truncate leading-tight">
                          {businessName}
                        </span>
                        <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0 inline-block" />
                      </div>
                      <div className="text-white/85 text-[10.5px] sm:text-xs font-normal truncate mt-0.5 flex items-center gap-1">
                        <span className="truncate text-white/85">{creatorFullName}</span>
                        {author?.isVerified !== false && (
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white/85 text-zinc-950 shrink-0 inline-block" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        )}
      </main>
    </div>
  );
};
