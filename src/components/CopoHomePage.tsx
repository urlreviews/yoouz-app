import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Play, Star, ChevronLeft, ChevronRight, Menu, Loader2, X, Building2, CheckCircle } from "lucide-react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { formatBusinessName, extractCleanDomain, resolveSafeAuthor, isPlaceReviewMatch } from "../utils/placeUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoHomePageProps {
  places: Place[];
  videos: VideoReview[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  onOpenMenu?: () => void;
  onViewAll?: () => void;
  onRecordReview?: (place?: Place | null) => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  currentUser?: UserProfile | null;
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
  onOpenCreator,
  onOpenMenu,
  onViewAll,
  onRecordReview,
  onOpenLegal,
  currentUser
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
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

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setShowDropdown(false);
    setQuery(item.title);
    if (item.id) {
      onOpenPlace(item.id);
    } else if (item.domain) {
      onOpenPlace(item.domain);
    } else {
      const match = places.find(p => (p.name || "").toLowerCase() === item.title.toLowerCase());
      if (match) {
        onOpenPlace(match.id);
      } else {
        onOpenPlace(item.title);
      }
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    
    // Try exact or partial match
    const qLow = trimmed.toLowerCase();
    const match = places.find(p => 
      (p.name || "").toLowerCase() === qLow || 
      (p.brandDomain || "").toLowerCase() === qLow ||
      (p.website || "").toLowerCase().includes(qLow)
    );
    if (match) {
      onOpenPlace(match.id);
    } else {
      onOpenPlace(trimmed);
    }
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
    <div className="flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 text-white flex flex-col select-none pb-[calc(env(safe-area-inset-bottom,16px)+80px)] md:pb-12">
      {/* 1. Header (Mobile Only) - Hamburger on Left, Minimal Centered 'yoouz BETA', Balanced Right Spacer */}
      <header className="w-full flex md:hidden items-center justify-between px-3.5 pt-3 pb-2.5 shrink-0 select-none z-20">
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-white hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer shrink-0"
          aria-label={t("nav.openMenu", "Open menu")}
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Minimal Clean yoouz Brand Wordmark */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-black tracking-tight text-white font-['Google_Sans',sans-serif]">
            yoouz
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/80 text-[9px] text-zinc-300 font-extrabold uppercase tracking-wider">
            BETA
          </span>
        </div>

        {/* Symmetrical right spacer for optical centering */}
        <div className="w-10 h-10 -mr-1" aria-hidden="true" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-14 md:pt-20 lg:pt-24 flex flex-col items-center">
        
        {/* 2. Hero Copy */}
        <div className="w-full text-center max-w-2xl mx-auto mb-8 sm:mb-11 animate-in fade-in duration-300">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-white tracking-tight leading-[1.12]">
            <span className="block">See the Truth</span>
            <span className="block mt-1 sm:mt-1.5">Before You Decide</span>
          </h1>
          <p className="text-zinc-200/90 text-base sm:text-lg md:text-[19px] mt-3 sm:mt-4 leading-relaxed max-w-xl mx-auto font-normal text-balance">
            Watch authentic video reviews of any place, product, or service—or record your own.
          </p>
        </div>

        {/* 3. Search Component - Optically centered with balanced breathing room */}
        <div className="w-full max-w-2xl relative mx-auto mb-14 sm:mb-18 md:mb-20" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative flex items-center w-full bg-zinc-900/95 hover:bg-zinc-900 border border-zinc-700/60 hover:border-zinc-500/80 focus-within:border-white/50 focus-within:ring-4 focus-within:ring-white/5 rounded-full px-4 sm:px-5 py-2.5 sm:py-3.5 shadow-2xl transition-all duration-200">
              <Search className="w-5 h-5 text-zinc-400 shrink-0 ml-0.5 mr-2.5 sm:mr-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                dir="auto"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder={t("search.placeholder", "Search any business, service, or place...")}
                className="w-full min-w-0 bg-transparent text-white text-[13.5px] xs:text-[14.5px] sm:text-base placeholder:text-zinc-500 placeholder:truncate focus:outline-none font-medium pr-2 truncate"
              />

              {/* Right Side: Subtle Spinner / Clear Button */}
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                {isLoadingSuggest && (
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                )}
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/60 max-h-[340px] overflow-y-auto no-scrollbar md:scrollbar-thin md:[scrollbar-width:thin] md:scrollbar-thumb-zinc-700/60 hover:md:scrollbar-thumb-zinc-500 md:scrollbar-track-transparent animate-in fade-in duration-150 overscroll-contain">
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

        {/* 4. Trending Video Reviews Grid / Carousel */}
        <section className="w-full relative mt-2 sm:mt-4">
          <div className="flex items-center justify-between w-full mb-4 px-1">
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
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory px-0.5 scroll-smooth"
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
                    className="relative shrink-0 w-[calc(46%-6px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 shadow-lg group cursor-pointer select-none transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 snap-start"
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
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pt-12 pb-3.5 px-3 sm:px-4 flex flex-col justify-end z-10 pointer-events-none">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-white text-sm sm:text-base font-bold tracking-tight truncate leading-tight">
                          {businessName}
                        </span>
                        <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0 inline-block" />
                      </div>
                      <div className="text-white/85 text-[11px] sm:text-xs font-normal truncate mt-0.5 flex items-center gap-1">
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
      </main>
    </div>
  );
};
