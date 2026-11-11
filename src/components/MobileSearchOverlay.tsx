import React, { useEffect, useRef } from "react";
import { Search, X, Loader2, Building2, User, CheckCircle, ChevronRight } from "lucide-react";
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
      {/* Absolute Highest Level Premium Header */}
      <div className="flex flex-col gap-6 px-6 pt-14 pb-7 border-b border-white/[0.06] bg-zinc-950/95 backdrop-blur-3xl sticky top-0 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-4">
          <form onSubmit={onSubmit} className="flex-1">
            <div className="relative flex items-center w-full bg-zinc-900/50 rounded-[24px] px-6 py-[22px] border border-white/10 focus-within:border-white/30 focus-within:ring-8 focus-within:ring-white/5 transition-all duration-500 ease-out shadow-2xl group">
              <Search className="w-7 h-7 text-zinc-500 mr-4 shrink-0 transition-all duration-300 group-focus-within:text-white group-focus-within:scale-110" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-white text-[20px] font-black focus:outline-none placeholder:text-zinc-700 placeholder:font-bold caret-[#007aff]"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
              />
              <div className="flex items-center gap-3 ml-2">
                {isLoading && <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />}
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-1.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5 stroke-[3]" />
                  </button>
                )}
              </div>
            </div>
          </form>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white font-black text-[18px] tracking-tight transition-all active:scale-90 px-2 py-3"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Results List - Luxurious Spacing & High-End Interactions */}
      <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain no-scrollbar">
        {suggestions.length === 0 && !isLoading && query.trim() && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-zinc-800" />
            </div>
            <p className="text-zinc-500 font-bold text-xl">No results found</p>
            <p className="text-zinc-700 font-medium mt-2">Try searching for something else</p>
          </div>
        )}
        
        <div className="space-y-1.5">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(item)}
              className="w-full px-6 py-6 flex items-center gap-6 hover:bg-white/[0.04] active:bg-white/[0.08] rounded-[28px] text-left transition-all duration-300 group border border-transparent hover:border-white/5 active:scale-[0.98]"
            >
              <div className={`w-14 h-14 ${item.isCreator ? "rounded-full" : "rounded-[20px]"} bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300`}>
                {item.logoUrl ? (
                  <img src={item.logoUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : item.isCreator ? (
                  <User className="w-7 h-7 text-zinc-600" />
                ) : (
                  <Building2 className="w-7 h-7 text-zinc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 font-black text-[19px] text-white/95 truncate tracking-tight">
                  {item.title}
                  <CheckCircle className="w-5 h-5 fill-white text-zinc-950 shrink-0" />
                </div>
                {item.domain && <div className="text-[13px] text-zinc-600 font-black tracking-widest truncate mt-1 uppercase opacity-90">{item.domain}</div>}
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-zinc-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
