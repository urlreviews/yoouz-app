import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Clock, TrendingUp, X } from "lucide-react";
import { VideoReview, UserProfile, VideoAuthor } from "../types";
import { getSafeAvatarUrl } from "../utils/placeUtils";
import { CopoDiscoverView } from "./CopoDiscoverView";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoMobileDiscoverViewProps {
  videos: VideoReview[];
  allUsers?: any[];
  currentUser?: UserProfile | null;
  onOpenCreator: (author: VideoAuthor) => void;
  onToggleFollow?: (name: string) => void;
  onStartChat?: (senderId: string, senderName: string, senderAvatar: string) => void;
  onSelectVideo?: (videoId: string, source?: string) => void;
  onOpenAuth?: () => void;
  onNavigateHome?: () => void;
  onClose: () => void;
}

export const CopoMobileDiscoverView: React.FC<CopoMobileDiscoverViewProps> = ({
  videos,
  allUsers = [],
  currentUser,
  onOpenCreator,
  onToggleFollow,
  onStartChat,
  onSelectVideo,
  onOpenAuth,
  onNavigateHome,
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
      const saved = JSON.parse(localStorage.getItem("yoouz_recent_discover_searches") || "[]");
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
    localStorage.setItem("yoouz_recent_discover_searches", JSON.stringify(newRecent));
    
    setSubmittedQuery(q);
  };
  
  // Calculate real trending creators based on the number of associated videos
  const trending = [...allUsers]
    .map(u => {
      const count = videos.filter(v => v.userId === u.id || v.author?.name === u.name).length;
      return { ...u, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(u => u.name || u.handle)
    .filter(name => name && name.length > 0);
  
  // Autocomplete matching from users
  const suggestions = query.length > 1 
    ? allUsers.filter(u => (u.name || "").toLowerCase().includes(query.toLowerCase()) || (u.handle || "").toLowerCase().includes(query.toLowerCase())).slice(0, 5)
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
            placeholder={t("discover.searchPlaceholder", "Search reviewer by name...")}
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
          <CopoDiscoverView
            videos={videos}
            allUsers={allUsers}
            currentUser={currentUser}
            onOpenCreator={onOpenCreator}
            onToggleFollow={onToggleFollow}
            onStartChat={onStartChat}
            onSelectVideo={onSelectVideo}
            onOpenAuth={onOpenAuth}
            onNavigateHome={onNavigateHome}
            isMobileModal={true}
            initialQuery={submittedQuery}
            hideSearchBar={true}
          />
        ) : (
          <div className="p-4 flex flex-col gap-6">
            
            {/* Autocomplete Suggestions */}
            {query.length > 0 && suggestions.length > 0 && (
              <div className="flex flex-col">
                {suggestions.map((u) => (
                  <button 
                    key={u.id || u.handle}
                    onClick={() => handleSearch(u.name || u.handle)}
                    className="flex items-center gap-3 py-3 border-b border-zinc-800/50 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                      {u.avatar ? (
                        <img src={getSafeAvatarUrl(u.avatar, u.name, u.handle)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-bold">
                          {(u.name || u.handle || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-zinc-200 font-medium truncate">{u.name || u.handle}</span>
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
                      localStorage.removeItem("yoouz_recent_discover_searches");
                    }}
                    className="text-zinc-500 text-xs font-medium uppercase hover:text-zinc-300 cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-col">
                  {recentSearches.map((s, idx) => {
                    const user = allUsers.find(u => u.name === s || u.handle === s);
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleSearch(s)}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                          <img
                            src={getSafeAvatarUrl(user?.avatar, user?.name || s, user?.handle || s)}
                            alt={s}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = getSafeAvatarUrl(null, user?.name || s, user?.handle || s);
                            }}
                          />
                        </div>
                        <span className="text-zinc-200 font-medium truncate">{s}</span>
                        <Clock className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Trending */}
            {query.length === 0 && trending.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-zinc-400 text-sm font-bold">Trending Creators</h3>
                <div className="flex flex-col">
                  {trending.map((s, idx) => {
                    const user = allUsers.find(u => u.name === s || u.handle === s);
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleSearch(s)}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                          <img
                            src={getSafeAvatarUrl(user?.avatar, user?.name || s, user?.handle || s)}
                            alt={s}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = getSafeAvatarUrl(null, user?.name || s, user?.handle || s);
                            }}
                          />
                        </div>
                        <span className="text-zinc-200 font-medium truncate">{s}</span>
                        <TrendingUp className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-50" />
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
