import React, { useEffect, useRef } from "react";
import { Search, X, Loader2, Building2, User, CheckCircle } from "lucide-react";
import { SuggestionItem } from "./CopoHomePage";

interface MobileSearchOverlayProps {
  query: string;
  setQuery: (q: string) => void;
  suggestions: SuggestionItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestion: (item: SuggestionItem) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({
  query,
  setQuery,
  suggestions,
  isOpen,
  onClose,
  onSelectSuggestion,
  onSubmit,
  isLoading
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-zinc-950 flex flex-col h-[100dvh] safe-area-bottom select-none">
      {/* Standard High-End Search Header */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-2xl sticky top-0">
        <form onSubmit={onSubmit} className="flex-1">
          <div className="relative flex items-center w-full bg-zinc-900 rounded-full px-4 py-2.5 border border-zinc-700/80 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/10 transition-all shadow-inner">
            <Search className="w-4.5 h-4.5 text-zinc-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any business, place, or URL..."
              className="w-full bg-transparent text-white text-[15px] font-medium focus:outline-none placeholder:text-zinc-500 caret-[#007aff]"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin ml-2 shrink-0" />}
            {query.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuery("");
                  setTimeout(() => inputRef.current?.focus(), 10);
                }}
                className="p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white ml-2 shrink-0 cursor-pointer active:scale-90"
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
          className="text-zinc-300 hover:text-white font-semibold text-[15px] transition-colors shrink-0 px-1 py-1 active:scale-95"
        >
          Cancel
        </button>
      </div>

      {/* Results List - Normal, Clean Standard Size */}
      <div className="flex-1 overflow-y-auto px-2 py-2 overscroll-contain no-scrollbar divide-y divide-zinc-900/60">
        {suggestions.length === 0 && !isLoading && query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-zinc-400 font-medium text-sm">No results found for "{query}"</p>
          </div>
        )}
        
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(item)}
            className="w-full px-3 py-3 flex items-center gap-3.5 hover:bg-zinc-900/60 active:bg-zinc-900 rounded-xl text-left transition-colors group cursor-pointer"
          >
            <div className={`w-10 h-10 ${item.isCreator ? "rounded-full" : "rounded-xl"} bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-xs`}>
              {item.logoUrl ? (
                <img src={item.logoUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : item.isCreator ? (
                <User className="w-4 h-4 text-zinc-400" />
              ) : (
                <Building2 className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-sm text-white truncate">
                <span>{item.title}</span>
                <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
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
    </div>
  );
};
