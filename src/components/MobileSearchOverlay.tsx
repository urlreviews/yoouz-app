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
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col h-[100dvh] safe-area-bottom">
      {/* Premium Header with Search Bar */}
      <div className="flex flex-col gap-4 px-6 pt-10 pb-5 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-2xl sticky top-0">
        <div className="flex items-center gap-4">
          <form onSubmit={onSubmit} className="flex-1">
            <div className="relative flex items-center w-full bg-zinc-900/80 rounded-2xl px-5 py-[18px] border border-white/10 focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/5 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <Search className="w-6 h-6 text-zinc-400 mr-4 shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-white text-[18px] font-bold focus:outline-none placeholder:text-zinc-600 placeholder:font-medium"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
              />
              {isLoading && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin ml-2" />}
            </div>
          </form>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white font-bold text-[17px] transition-colors whitespace-nowrap active:scale-95 py-2 px-1"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(item)}
            className="w-full px-4 py-4 flex items-center gap-4 hover:bg-zinc-900 rounded-xl text-left"
          >
            <div className={`w-10 h-10 ${item.isCreator ? "rounded-full" : "rounded-xl"} bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-700`}>
              {item.logoUrl ? (
                <img src={item.logoUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : item.isCreator ? (
                <User className="w-5 h-5 text-zinc-400" />
              ) : (
                <Building2 className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-base text-white truncate">
                {item.title}
                <CheckCircle className="w-4 h-4 fill-white text-zinc-950" />
              </div>
              {item.domain && <div className="text-sm text-zinc-400 truncate mt-0.5">{item.domain}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
