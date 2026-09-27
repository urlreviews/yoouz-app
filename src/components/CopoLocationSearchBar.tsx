import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
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
  compact?: boolean;
  className?: string;
}

export const CopoLocationSearchBar: React.FC<CopoLocationSearchBarProps> = ({
  onSearch,
  isSearching = false,
  initialQuery = "",
  initialLocation = "",
  initialCity = "",
  autoFocus = false,
  suggestions = [],
  isLoadingSuggest = false,
  onSelectSuggestion,
  className = ""
}) => {
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation || initialCity || "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) setBusinessName(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialLocation || initialCity) {
      setLocation(initialLocation || initialCity);
    }
  }, [initialLocation, initialCity]);

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

    const trimmedLoc = location.trim();
    
    // If business input is already a direct domain (e.g. "mjpsolicitors.co.uk" or "apple.com"), pass clean domain directly
    const cleanDom = extractCleanDomain(trimmedBiz);
    if (isValidDomainUrl(cleanDom)) {
      onSearch(cleanDom, {
        country: "",
        state: "",
        city: trimmedLoc,
        rawBusinessName: trimmedBiz,
        rawLocation: trimmedLoc
      });
      return;
    }

    // Build the combined query if location is provided
    let fullQuery = trimmedBiz;
    if (trimmedLoc) {
      fullQuery = `${trimmedBiz} ${trimmedLoc}`;
    }

    onSearch(fullQuery, {
      country: "",
      state: "",
      city: trimmedLoc,
      rawBusinessName: trimmedBiz,
      rawLocation: trimmedLoc
    });
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      <form
        onSubmit={handleSubmit}
        className="w-full bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-700/50 rounded-2xl md:rounded-3xl p-1.5 md:p-2 shadow-2xl transition-all"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-0">
          
          {/* 1. Business / Name / Keyword Input */}
          <div className="flex-1 flex items-center relative min-w-0 px-3 py-1.5 sm:py-2">
            <Search className="w-5 h-5 text-zinc-400 shrink-0 mr-2.5 transition-colors" />
            <input
              ref={inputRef}
              type="text"
              dir="auto"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                if (e.target.value.trim() && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder={t("search.placeholder", "Search business, service, or website...")}
              className="w-full bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none font-medium pr-6"
              autoFocus={autoFocus}
            />
            {businessName && (
              <button
                type="button"
                onClick={() => {
                  setBusinessName("");
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mr-1 shrink-0"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Divider between Business and Location */}
          <div className="hidden sm:block w-[1px] h-7 bg-zinc-800 mx-1 shrink-0" />
          <div className="sm:hidden w-full h-[1px] bg-zinc-800/80 my-0.5" />

          {/* 2. Location (City, Country, or Neighborhood - Optional & Multilingual) */}
          <div className="flex-1 flex items-center relative min-w-0 px-3 py-1.5 sm:py-2">
            <MapPin className="w-5 h-5 text-zinc-400 shrink-0 mr-2.5 transition-colors" />
            <input
              type="text"
              dir="auto"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("search.locationPlaceholder", "Location / City (optional)...")}
              className="w-full bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none font-medium pr-6"
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation("")}
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mr-1 shrink-0"
                title="Clear Location"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3. Search Submit Button */}
          <button
            type="submit"
            disabled={isSearching || !businessName.trim()}
            className="h-11 sm:h-12 px-6 rounded-xl md:rounded-2xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0 mt-1 sm:mt-0"
          >
            {isSearching || isLoadingSuggest ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : (
              <>
                <Search className="w-4 h-4 sm:hidden text-zinc-950 stroke-[2.5]" />
                <span>{t("common.search", "Search")}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Autocomplete / Live Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/80 max-h-[340px] overflow-y-auto animate-in fade-in duration-150">
          {suggestions.map((item, idx) => {
            const isDbOrBrand = item.source === "database" || item.source === "brand_index";
            const hasDomain = item.domain && item.domain.includes('.');
            return (
              <button
                key={idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (onSelectSuggestion) onSelectSuggestion(item);
                  else {
                    setBusinessName(item.title || item.domain);
                    handleSubmit();
                  }
                }}
                className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-zinc-900 transition-colors text-left cursor-pointer group"
              >
                {isDbOrBrand && hasDomain ? (
                  <CopoBrandLogo
                    domain={item.domain}
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
                  <div className="text-xs text-zinc-400 truncate flex items-center gap-2 mt-0.5" dir="auto">
                    {item.domain && <span className="text-zinc-500 font-mono">{item.domain}</span>}
                    {item.category && <span>• {item.category}</span>}
                    {item.address && <span>• {item.address}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
