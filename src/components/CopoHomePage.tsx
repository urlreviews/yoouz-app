import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Play, Star, ChevronLeft, ChevronRight, Menu, Loader2, X, Building2, CheckCircle, Globe } from "lucide-react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { formatBusinessName, extractCleanDomain, resolveSafeAuthor, getPlaceSlug } from "../utils/placeUtils";
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
  currentUser
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 text-white flex flex-col select-none pb-[calc(env(safe-area-inset-bottom,16px)+80px)] md:pb-12">
      {/* 1. Header (Mobile Only) - Hamburger Menu on Left, Centered Logo, Clean on Right */}
      <header className="w-full flex md:hidden items-center justify-between px-4 py-3 shrink-0 select-none z-20">
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-white hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
          aria-label={t("nav.openMenu", "Open menu")}
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-white font-['Google_Sans',sans-serif]">
            yoouz
          </span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800/90 border border-zinc-700/80 text-[10px] text-zinc-300 font-extrabold uppercase tracking-wider">
            BETA
          </span>
        </div>

        {/* Clean right spacer (NO redundant + Video Review button in header) */}
        <div className="w-10 h-10 -mr-1" aria-hidden="true" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-8 md:pt-12 flex flex-col items-center">
        
        {/* 2. Hero Copy */}
        <div className="w-full text-center max-w-2xl mx-auto mb-6 sm:mb-8 animate-in fade-in duration-300">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            See the Truth Before You Buy
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base md:text-lg mt-3 sm:mt-4 leading-relaxed max-w-lg mx-auto font-normal">
            Watch authentic video reviews of any business, or record your own.
          </p>
        </div>

        {/* 3. Search Component */}
        <div className="w-full max-w-xl relative mx-auto mb-10 sm:mb-14" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative flex items-center w-full bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-white/10 rounded-full px-4 py-3 sm:py-3.5 shadow-2xl transition-all duration-200 ring-1 ring-white/5">
              <Search className="w-5 h-5 text-zinc-400 shrink-0 ml-1 mr-3 pointer-events-none" />
              <input
                type="text"
                dir="auto"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder={t("search.placeholder", "Search business...")}
                className="w-full bg-transparent text-white text-[15px] sm:text-base placeholder:text-zinc-500 focus:outline-none font-medium pr-8"
              />

              {isLoadingSuggest && (
                <Loader2 className="w-4 h-4 text-zinc-400 animate-spin absolute right-4 shrink-0 pointer-events-none" />
              )}
              {!isLoadingSuggest && query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setShowDropdown(false);
                  }}
                  className="absolute right-3.5 p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={t("common.clear", "Clear")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {!isLoadingSuggest && !query.trim() && (
                <Search className="w-4 h-4 text-zinc-600 absolute right-4 shrink-0 pointer-events-none" />
              )}
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/60 max-h-[340px] overflow-y-auto animate-in fade-in duration-150">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-zinc-800/80 transition-colors text-left cursor-pointer group"
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

        {/* 4. Recent Searches: Completely Removed Per User Request */}

        {/* 5. Trending Video Reviews Grid / Carousel */}
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
                  className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 items-center justify-center text-white shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity z-20 cursor-pointer"
                  aria-label="Previous videos"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 items-center justify-center text-white shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity z-20 cursor-pointer"
                  aria-label="Next videos"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Carousel / Grid Wrapper */}
            <div
              ref={carouselRef}
              className="grid grid-flow-col auto-cols-[calc(33.333%-8px)] sm:auto-cols-[calc(28%-10px)] md:grid-flow-row md:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-4 md:pb-0 snap-x snap-mandatory px-0.5"
            >
              {trendingVideos.slice(0, 8).map((video) => {
                const businessName = video.businessName || video.placeName || formatBusinessName(video.placeId) || "Business";
                const author = resolveSafeAuthor(video, currentUser);
                const creatorName = author?.firstName || author?.name?.split(" ")[0] || "Reviewer";
                const rating = typeof video.rating === "number" ? video.rating : 5.0;
                const posterUrl = resolveVideoPosterUrl(video);

                return (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo(video.id)}
                    className="relative aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 shadow-lg group cursor-pointer select-none transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 snap-start"
                  >
                    {/* Video Thumbnail */}
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={`${businessName} review by ${creatorName}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = "none";
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

                    {/* Bottom Dark Gradient Scrim: Business Name & "by [Creator]" */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pt-12 pb-3.5 px-3 sm:px-4 flex flex-col justify-end z-10 pointer-events-none">
                      <div className="text-white text-sm sm:text-base font-bold tracking-tight truncate leading-tight">
                        {businessName}
                      </div>
                      <div className="text-zinc-400 text-[11px] sm:text-xs font-medium truncate mt-0.5">
                        by {creatorName}
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
