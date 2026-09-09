import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Clock, TrendingUp, X } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoSearchView } from "./CopoSearchView";
import { useLanguage } from "../i18n/LanguageContext";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";

interface CopoMobileSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onClose: () => void;
}

const getNormalizedDomain = (text: string) => {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .replace(/\/.*$/, "")
    .trim();
};

const SearchItemLogo: React.FC<{ name: string; logoUrl: string | null; iconType: 'clock' | 'trending' | 'search' }> = ({ name, logoUrl, iconType }) => {
  const [hasError, setHasError] = useState(false);

  if (logoUrl && !hasError) {
    return (
      <img 
        src={logoUrl} 
        alt={name} 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)} 
      />
    );
  }

  if (iconType === 'trending') return <TrendingUp className="w-4 h-4 text-zinc-500" />;
  if (iconType === 'search') return <Search className="w-4 h-4 text-zinc-500" />;
  return <Clock className="w-4 h-4 text-zinc-500" />;
};

export const CopoMobileSearchView: React.FC<CopoMobileSearchViewProps> = ({
  places,
  videos,
  onSelectVideo,
  onOpenPlace,
  onRecordForPlace,
  onAddPlace,
  onClose
}) => {
  const { t } = useLanguage();
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Recent searches (mocked or from localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("yoouz_recent_searches") || "[]");
      setRecentSearches(saved);
    } catch {}
    
    // Auto focus on mount
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Pre-fetch metadata in the background for any recent search item not already in places
  // so the database in BunnyDB/Firestore keeps the banner and logo immediately
  useEffect(() => {
    if (!onAddPlace) return;
    recentSearches.forEach(async (term) => {
      const norm = getNormalizedDomain(term);
      if (!norm || !norm.includes(".")) return;
      const alreadySaved = places.some(p => {
        const pNorm = getNormalizedDomain(p.brandDomain || p.website || p.id);
        return pNorm === norm;
      });
      if (!alreadySaved) {
        try {
          const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(norm)}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data.title || data.domain) {
              const fetchedLogo = data.logo || getCleanLogoUrl(null, data.domain) || "";
              const fetchedBanner = data.image || "";
              const newPlace: Place = {
                id: (data.domain || norm).replace(/[^a-zA-Z0-9]/g, "-"),
                name: data.title || data.domain || norm,
                category: "Website",
                categoryType: "all",
                address: "",
                city: "Online",
                lat: 0,
                lng: 0,
                rating: 5,
                totalReviews: 1,
                ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
                avatarUrl: fetchedLogo,
                logoUrl: fetchedLogo,
                bannerUrl: fetchedBanner,
                ogImage: fetchedBanner,
                photos: fetchedBanner ? [fetchedBanner] : [],
                openingHours: "Available 24/7",
                isOpen: true,
                phone: "",
                website: data.url || `https://${norm}`,
                priceRange: "N/A",
                plusCode: "",
                description: data.description || "",
                popularKeywords: [],
                amenities: [],
                topDishes: [],
                brandDomain: data.domain || norm
              };
              onAddPlace(newPlace);
            }
          }
        } catch (err) {}
      }
    });
  }, [recentSearches, places, onAddPlace]);

  const findMatchingPlace = (term: string): Place | undefined => {
    const target = getNormalizedDomain(term);
    return places.find(p => {
      const pDom = getNormalizedDomain(p.brandDomain || p.website || p.id);
      return (target && pDom === target) ||
             p.name.toLowerCase() === term.toLowerCase() ||
             p.id.toLowerCase() === target.replace(/[^a-z0-9]/g, "-");
    });
  };

  const getItemLogoUrl = (term: string, place?: Place | null): string | null => {
    if (place) {
      const l = getPlaceLogoUrl(place);
      if (l) return l;
    }
    const cleanDomain = getNormalizedDomain(term);
    if (cleanDomain && cleanDomain.includes(".")) {
      return getPlaceLogoUrl({ name: term, brandDomain: cleanDomain });
    }
    return null;
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250); // wait for animation
  };

  const handleSearch = (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const q = typeof e === 'string' ? e : query;
    if (!q.trim()) return;
    
    const newRecent = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem("yoouz_recent_searches", JSON.stringify(newRecent));
    
    setSubmittedQuery(q);
  };
  
  // Calculate real trending places based on the number of associated videos
  const trending = [...places]
    .map(p => {
      const count = videos.filter(v => v.placeId === p.id || v.placeName === p.name || (p.brandDomain && v.dishOrItem === p.brandDomain)).length;
      return { ...p, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(p => p.brandDomain || p.name)
    .filter(name => name.length > 0);
  
  // Autocomplete matching from places
  const suggestions = query.length > 1 
    ? places.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.brandDomain?.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className={`fixed inset-0 h-[100dvh] z-[250] bg-zinc-950 flex flex-col font-sans transition-transform duration-250 ease-out ${isClosing ? 'translate-y-full' : 'animate-in slide-in-from-bottom'}`}>
      
      {/* Top Search Bar */}
      <div className="w-full flex items-center p-3 pt-[max(12px,env(safe-area-inset-top))] sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 gap-3">
        <button 
           onClick={handleClose}
           className="text-white p-1 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
           aria-label="Close"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <form onSubmit={handleSearch} className="flex-1 relative flex items-center group">
          <div className="absolute left-3 text-zinc-400 group-focus-within:text-white transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-[15px] rounded-lg py-2.5 pl-9 pr-9 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all placeholder:text-zinc-500"
            placeholder={t("search.placeholder", "example.com")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSubmittedQuery("");
            }}
          />
          {query && (
            <div className="absolute right-1 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSubmittedQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>

        <button 
          onClick={handleSearch}
          className="text-white font-bold text-[14px] px-1 active:opacity-70 transition-opacity whitespace-nowrap cursor-pointer"
        >
          {t("common.search", "Search")}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto w-full relative">
        {submittedQuery ? (
          <CopoSearchView
            places={places}
            videos={videos}
            onSelectVideo={onSelectVideo}
            onOpenPlace={onOpenPlace}
            onRecordForPlace={onRecordForPlace}
            onAddPlace={onAddPlace}
            isMobileModal={true}
            initialQuery={submittedQuery}
            hideSearchBar={true}
          />
        ) : (
          <div className="p-4 flex flex-col gap-6">
            
            {/* Autocomplete Suggestions */}
            {query.length > 0 && suggestions.length > 0 && (
              <div className="flex flex-col">
                {suggestions.map((p) => {
                  const logoUrl = getPlaceLogoUrl(p);
                  const displayName = p.brandDomain || p.name;
                  return (
                    <button 
                      key={p.id}
                      onClick={() => handleSearch(displayName)}
                      className="flex items-center gap-3 py-3 border-b border-zinc-800/50 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                        <SearchItemLogo 
                          name={displayName}
                          logoUrl={logoUrl}
                          iconType="search"
                        />
                      </div>
                      <span className="text-zinc-200 font-medium truncate">{displayName}</span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Recent Searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-400 text-sm font-bold">Recent</h3>
                  <button 
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem("yoouz_recent_searches");
                    }}
                    className="text-zinc-500 text-xs font-medium uppercase hover:text-zinc-300 cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-col">
                  {recentSearches.map((s, idx) => {
                    const place = findMatchingPlace(s);
                    const logoUrl = getItemLogoUrl(s, place);
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleSearch(s)}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                          <SearchItemLogo 
                            name={s}
                            logoUrl={logoUrl}
                            iconType="clock"
                          />
                        </div>
                        <span className="text-zinc-200 font-medium truncate">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Trending */}
            {query.length === 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-zinc-400 text-sm font-bold">Trending Searches</h3>
                <div className="flex flex-col">
                  {trending.map((s, idx) => {
                    const place = findMatchingPlace(s);
                    const logoUrl = getItemLogoUrl(s, place);
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleSearch(s)}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                          <SearchItemLogo 
                            name={s}
                            logoUrl={logoUrl}
                            iconType="trending"
                          />
                        </div>
                        <span className="text-zinc-200 font-medium truncate">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};
