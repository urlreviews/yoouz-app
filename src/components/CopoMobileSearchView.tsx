import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Clock, TrendingUp, X } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoSearchView } from "./CopoSearchView";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoMobileSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onClose: () => void;
}

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
  
  const trending = [
    "airbnb.com",
    "nike.com",
    "spotify.com",
    "netflix.com"
  ];
  
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
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-[15px] rounded-lg py-2.5 pl-9 pr-[84px] focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all placeholder:text-zinc-500"
            placeholder={t("search.placeholder", "example.com")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSubmittedQuery("");
            }}
          />
          <div className="absolute right-1 flex items-center gap-1">
            {query && (
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
            )}
            <button 
              type="submit"
              className="text-white font-bold text-[13px] px-2 py-1 hover:bg-zinc-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              {t("common.search", "Search")}
            </button>
          </div>
        </form>
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
                {suggestions.map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => handleSearch(p.brandDomain || p.name)}
                    className="flex items-center gap-3 py-3 border-b border-zinc-800/50 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="text-zinc-200 font-medium truncate">{p.brandDomain || p.name}</span>
                  </button>
                ))}
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
                  {recentSearches.map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSearch(s)}
                      className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                    >
                      <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-200 font-medium truncate">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trending */}
            {query.length === 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-zinc-400 text-sm font-bold">Trending Searches</h3>
                <div className="flex flex-col">
                  {trending.map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSearch(s)}
                      className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-zinc-300 shrink-0" />
                      <span className="text-zinc-200 font-medium truncate">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};
