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
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col h-[100dvh]">
      {/* Header with Search Bar */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-800/60 bg-zinc-950">
        <form onSubmit={onSubmit} className="flex-1">
          <div className="relative flex items-center w-full bg-zinc-900 rounded-full px-4 py-3 border border-zinc-700 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/10 transition-all">
            <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
              <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-white text-base focus:outline-none"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin ml-2" />}
          </div>
        </form>
        <button onClick={onClose} className="text-white font-medium p-2">
          Cancel
        </button>
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
