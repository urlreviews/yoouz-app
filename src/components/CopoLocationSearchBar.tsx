import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { extractCleanDomain, isValidDomainUrl } from "../utils/placeUtils";

export interface CopoLocationSearchBarProps {
  onSearch: (
    fullQuery: string,
    locationDetails: {
      country: string;
      state: string;
      city: string;
      rawBusinessName: string;
      rawLocation?: string;
    }
  ) => void;
  isSearching?: boolean;
  initialQuery?: string;
  initialLocation?: string;
  initialCountry?: string;
  initialState?: string;
  initialCity?: string;
  autoFocus?: boolean;
  suggestions?: any[];
  isLoadingSuggest?: boolean;
  onSelectSuggestion?: (item: any) => void;
  onQueryChange?: (val: string) => void;
  compact?: boolean;
  hideDropdown?: boolean;
  className?: string;
}

export const CopoLocationSearchBar: React.FC<CopoLocationSearchBarProps> = ({
  onSearch,
  isSearching = false,
  initialQuery = "",
  autoFocus = false,
  suggestions = [],
  isLoadingSuggest = false,
  onSelectSuggestion,
  onQueryChange,
  hideDropdown = false,
  className = ""
}) => {
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const bizInputRef = useRef<HTMLInputElement>(null);
  const mobileBizInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBusinessName(initialQuery || "");
  }, [initialQuery]);

  // Click outside listener for suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedBiz = businessName.trim();
    if (!trimmedBiz) return;

    setShowSuggestions(false);
    
    // If business input is already a direct domain (e.g. "mjpsolicitors.co.uk" or "apple.com"), pass clean domain directly
    const cleanDom = extractCleanDomain(trimmedBiz);
    if (isValidDomainUrl(cleanDom)) {
      onSearch(cleanDom, {
        country: "",
        state: "",
        city: "",
        rawBusinessName: trimmedBiz
      });
      return;
    }

    onSearch(trimmedBiz, {
      country: "",
      state: "",
      city: "",
      rawBusinessName: trimmedBiz
    });
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      <form onSubmit={handleSubmit} className="w-full">
        
        {/* ========================================================================= */}
        {/* Desktop View (>= 640px) - Luxury Glassmorphic Unified Search Bar          */}
        {/* ========================================================================= */}
        <div className="hidden sm:flex items-center gap-2 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-white/10 rounded-full p-2 md:p-2.5 shadow-2xl transition-all duration-300 ring-1 ring-white/5">
          
          <div className="flex items-center relative min-w-0 flex-1 px-3 py-1.5">
            <Search className="w-5 h-5 shrink-0 mr-3 text-zinc-400 focus-within:text-white transition-colors" />
            <input
              ref={bizInputRef}
              type="text"
              dir="auto"
              value={businessName}
              onChange={(e) => {
                const val = e.target.value;
                setBusinessName(val);
                if (onQueryChange) {
                  onQueryChange(val);
                }
                if (val.trim()) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (onQueryChange) {
                  onQueryChange(businessName);
                }
                setShowSuggestions(true);
              }}
              placeholder={t("search.businessPlaceholder", "Search business...")}
              className="w-full bg-transparent text-white text-[15px] lg:text-base placeholder:text-zinc-500 focus:outline-none font-medium pr-7"
              autoFocus={autoFocus}
            />
            {businessName && (
              <button
                type="button"
                onClick={() => {
                  setBusinessName("");
                  setShowSuggestions(false);
                  if (onQueryChange) {
                    onQueryChange("");
                  }
                  bizInputRef.current?.focus();
                }}
                className="absolute right-2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 rounded-full hover:bg-zinc-800"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching || !businessName.trim()}
            className={`h-11 md:h-12 px-7 md:px-8 rounded-full font-bold text-sm md:text-[15px] transition-all flex items-center justify-center gap-2 shadow-lg shrink-0 ${
              isSearching
                ? "bg-zinc-800 text-white cursor-wait"
                : !businessName.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer active:scale-95"
            }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span className="text-white text-xs md:text-sm font-semibold">Searching...</span>
              </>
            ) : (
              <span>{t("common.search", "Search")}</span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* Mobile View (< 640px) - Unified Mobile Search Bar                         */}
        {/* ========================================================================= */}
        <div className="flex sm:hidden items-center gap-2 w-full">
          <div className="flex-1 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 flex items-center gap-2.5 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-white/10 transition-all shadow-inner">
            <Search className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
            
            <input
              ref={mobileBizInputRef}
              type="text"
              dir="auto"
              enterKeyHint="search"
              value={businessName}
              onChange={(e) => {
                const val = e.target.value;
                setBusinessName(val);
                if (onQueryChange) {
                  onQueryChange(val);
                }
                if (val.trim()) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (onQueryChange) {
                  onQueryChange(businessName);
                }
                setShowSuggestions(true);
              }}
              placeholder={t("search.businessPlaceholder", "Search business...")}
              className="flex-1 min-w-0 bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none font-medium"
              autoFocus={autoFocus}
            />

            {businessName && (
              <button
                type="button"
                onClick={() => {
                  setBusinessName("");
                  setShowSuggestions(false);
                  if (onQueryChange) {
                    onQueryChange("");
                  }
                  mobileBizInputRef.current?.focus();
                }}
                className="p-1 text-zinc-400 hover:text-white active:scale-95 transition-colors cursor-pointer shrink-0 rounded-full hover:bg-zinc-800"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching || !businessName.trim()}
            className={`h-12 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shrink-0 ${
              isSearching
                ? "bg-zinc-800 text-white cursor-wait"
                : !businessName.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer"
            }`}
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <span>{t("common.search", "Search")}</span>
            )}
          </button>
        </div>
      </form>

      {/* Autocomplete / Live Business Suggestions Dropdown */}
      {!hideDropdown && showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/80 max-h-[340px] overflow-y-auto animate-in fade-in duration-150">
          {suggestions.map((item, idx) => {
            const rawDomain = item.domain || (typeof item === 'string' ? item : (item.brandDomain || item.website || ""));
            let targetDomain = isValidDomainUrl(rawDomain) ? extractCleanDomain(rawDomain) : "";
            const hasDomain = Boolean(targetDomain && targetDomain.includes('.') && isValidDomainUrl(targetDomain));

            return (
              <button
                key={idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectSuggestion) onSelectSuggestion(item);
                  else {
                    setBusinessName(item.title || targetDomain || businessName);
                    handleSubmit();
                  }
                }}
                className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-zinc-900 active:bg-zinc-850 transition-colors text-left cursor-pointer group"
              >
                {hasDomain ? (
                  <CopoBrandLogo
                    domain={targetDomain}
                    name={item.title}
                    logoUrl={item.logoUrl}
                    className="w-8 h-8 rounded-lg border border-zinc-800 bg-white shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-0.5"
                    imageClassName="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xs flex items-center justify-center overflow-hidden shrink-0 text-zinc-400 group-hover:text-white transition-colors">
                    <Search className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white group-hover:text-zinc-200 transition-colors truncate" dir="auto">
                    <bdi dir="auto">{item.title}</bdi>
                  </div>
                  {hasDomain && (
                    <div className="text-xs text-zinc-400 truncate mt-0.5 font-medium font-mono" dir="auto">
                      {targetDomain.toLowerCase()}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* Subtle Google attribution at the very bottom of the results list */}
          <div className="w-full px-4 py-2 border-t border-zinc-800/50 bg-zinc-950/50 flex justify-end">
            <div className="flex items-center gap-1 opacity-20 hover:opacity-40 transition-opacity pointer-events-none grayscale brightness-[0.4]">
              <span className="text-[8px] font-medium text-zinc-500 uppercase tracking-widest">Enhanced by</span>
              <img 
                src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
                alt="Google"
                className="h-2 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
