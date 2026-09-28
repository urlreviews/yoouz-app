import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, MapPin, X, Loader2, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { extractCleanDomain, isValidDomainUrl } from "../utils/placeUtils";
import { searchCitySuggestions, CitySuggestion } from "../utils/locationSearchHelper";

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
  initialLocation = "",
  initialCity = "",
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
  const [location, setLocation] = useState(initialLocation || initialCity || "");
  const [activeField, setActiveField] = useState<"business" | "location" | null>(null);
  const [hasLocationPulse, setHasLocationPulse] = useState(false);
  const [showLocationInputMobile, setShowLocationInputMobile] = useState(Boolean(initialLocation || initialCity));
  const [showSuggestions, setShowSuggestions] = useState(false);

  const bizInputRef = useRef<HTMLInputElement>(null);
  const locInputRef = useRef<HTMLInputElement>(null);
  const mobileBizInputRef = useRef<HTMLInputElement>(null);
  const mobileLocInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBusinessName(initialQuery || "");
  }, [initialQuery]);

  useEffect(() => {
    setLocation(initialLocation || initialCity || "");
    if (initialLocation || initialCity) {
      setShowLocationInputMobile(true);
      setHasLocationPulse(false);
    } else {
      setShowLocationInputMobile(false);
    }
  }, [initialLocation, initialCity]);

  // Click outside listener for suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const citySuggestions = useMemo(() => {
    if (activeField !== "location" || !location.trim()) return [];
    return searchCitySuggestions(location, 6);
  }, [activeField, location]);

  const handleLocationChange = (val: string) => {
    setLocation(val);
    setActiveField("location");
    setShowSuggestions(false);
    if (val.trim()) {
      setHasLocationPulse(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedBiz = businessName.trim();
    if (!trimmedBiz) return;

    setShowSuggestions(false);

    const trimmedLoc = location.trim();
    
    // If business input is already a direct domain (e.g. "mjpsolicitors.co.uk" or "apple.com"), pass clean domain directly
    const cleanDom = extractCleanDomain(trimmedBiz);
    if (isValidDomainUrl(cleanDom)) {
      setHasLocationPulse(false);
      onSearch(cleanDom, {
        country: "",
        state: "",
        city: trimmedLoc,
        rawBusinessName: trimmedBiz,
        rawLocation: trimmedLoc
      });
      return;
    }

    setHasLocationPulse(false);

    // Build the combined query
    const fullQuery = trimmedLoc ? `${trimmedBiz} ${trimmedLoc}`.trim() : trimmedBiz;

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
      <form onSubmit={handleSubmit} className="w-full">
        
        {/* ========================================================================= */}
        {/* Desktop View (>= 640px) - Luxury Glassmorphic Pill with Fluid Expansion */}
        {/* ========================================================================= */}
        <div className={`hidden sm:flex items-center gap-1 bg-zinc-950/90 backdrop-blur-2xl border ${
          hasLocationPulse ? "border-zinc-500 ring-2 ring-white/20" : "border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600"
        } rounded-full p-2 md:p-2.5 shadow-2xl transition-all duration-300 ring-1 ring-white/5`}>
          
          {/* 1. Business / Name / Keyword Input */}
          <div 
            className={`flex items-center relative min-w-0 px-3 py-2 rounded-full transition-all duration-200 ${
              activeField === "business" ? "flex-[1.8] bg-zinc-900/60" : "flex-[1.5]"
            }`}
          >
            <Search className={`w-5 h-5 shrink-0 mr-3 transition-colors ${activeField === "business" ? "text-white" : "text-zinc-400"}`} />
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
                setActiveField("business");
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

          {/* Vertical Divider Line | */}
          <div className="w-[1px] h-7 bg-zinc-700/80 mx-1.5 shrink-0" />

          {/* 2. Location Input - Distinct, Clean & Inviting */}
          <div 
            className={`flex items-center relative min-w-0 px-3.5 py-2 rounded-full transition-all duration-200 ${
              hasLocationPulse
                ? "flex-[1.6] bg-zinc-900 ring-1 ring-white/30"
                : activeField === "location"
                ? "flex-[1.5] bg-zinc-900/80 ring-1 ring-white/10"
                : businessName.trim() && !location
                ? "flex-[1.2] bg-zinc-900/40 hover:bg-zinc-900/60"
                : "flex-1"
            }`}
          >
            <MapPin className={`w-5 h-5 shrink-0 mr-2.5 transition-colors ${
              hasLocationPulse || activeField === "location" ? "text-white" : "text-zinc-400"
            }`} />
            <input
              ref={locInputRef}
              type="text"
              dir="auto"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => {
                setActiveField("location");
                setHasLocationPulse(false);
              }}
              placeholder={t("search.locationPlaceholder", "Location")}
              className="w-full bg-transparent text-[15px] lg:text-base text-white placeholder:text-zinc-500 focus:outline-none font-medium pr-7 transition-colors"
            />
            {location && (
              <button
                type="button"
                onClick={() => {
                  setLocation("");
                  locInputRef.current?.focus();
                }}
                className="absolute right-2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 rounded-full hover:bg-zinc-800"
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
        {/* Mobile View (< 640px) - Yelp-Style Twin Stacked Search Bars               */}
        {/* ========================================================================= */}
        <div className="flex sm:hidden flex-col gap-2 w-full">
          
          {/* Box 1: Business / Domain Input */}
          <div className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 flex items-center gap-2.5 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-white/10 transition-all">
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
                setActiveField("business");
                if (onQueryChange) {
                  onQueryChange(businessName);
                }
                setShowSuggestions(true);
              }}
              placeholder={t("search.businessPlaceholder", "Search business...")}
              className="flex-1 min-w-0 bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none font-medium"
              autoFocus={autoFocus}
            />

            {/* Business Clear Button */}
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

          {/* Box 2: Location Input (Revealed automatically under business box) */}
          {(businessName.trim().length > 0 || location.trim().length > 0 || showLocationInputMobile || activeField === "location") ? (
            <div className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 flex items-center gap-2.5 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-white/10 transition-all animate-in fade-in slide-in-from-top-1 duration-150">
              <MapPin className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
              
              <input
                ref={mobileLocInputRef}
                type="text"
                dir="auto"
                enterKeyHint="search"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => {
                  setActiveField("location");
                  setHasLocationPulse(false);
                }}
                placeholder={t("search.locationPlaceholder", "Location")}
                className="flex-1 min-w-0 bg-transparent text-[15px] text-white placeholder:text-zinc-500 focus:outline-none font-medium"
              />

              {location && (
                <button
                  type="button"
                  onClick={() => {
                    handleLocationChange("");
                    mobileLocInputRef.current?.focus();
                  }}
                  className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 rounded-full hover:bg-zinc-800"
                  title="Clear Location"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowLocationInputMobile(true);
                setTimeout(() => mobileLocInputRef.current?.focus(), 50);
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 self-start px-1 py-0.5 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>Add location</span>
            </button>
          )}

          {/* Clean Mobile Search Action Button */}
          <button
            type="submit"
            disabled={isSearching || !businessName.trim()}
            className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm mt-0.5 ${
              isSearching
                ? "bg-zinc-800 text-white cursor-wait"
                : !businessName.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer"
            }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span className="text-white">Searching...</span>
              </>
            ) : (
              <span>{t("common.search", "Search")}</span>
            )}
          </button>
        </div>
      </form>

      {/* City / Location Suggestions Dropdown */}
      {!hideDropdown && activeField === "location" && citySuggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto animate-in fade-in duration-150">
          <div className="px-4 py-2 bg-zinc-900/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/80">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span>Matching Cities & Neighborhoods</span>
          </div>
          {citySuggestions.map((c, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setLocation(c.city);
                setActiveField(null);
                setShowSuggestions(false);
                bizInputRef.current?.focus();
                mobileBizInputRef.current?.focus();
              }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-900 active:bg-zinc-850 transition-colors text-left cursor-pointer group border-b border-zinc-850/60 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-white transition-colors">
                <MapPin className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-white group-hover:text-zinc-200 transition-colors truncate">
                  {c.city}
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {c.state ? `${c.state}, ${c.country}` : c.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete / Live Business Suggestions Dropdown */}
      {!hideDropdown && activeField === "business" && showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/80 max-h-[340px] overflow-y-auto animate-in fade-in duration-150">
          {suggestions.map((item, idx) => {
            const rawDomain = item.domain || (typeof item === 'string' ? item : (item.brandDomain || item.website || ""));
            let targetDomain = isValidDomainUrl(rawDomain) ? extractCleanDomain(rawDomain) : "";
            const hasDomain = Boolean(targetDomain && targetDomain.includes('.') && isValidDomainUrl(targetDomain));

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
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
                  <div className="text-xs text-zinc-400 truncate flex items-center gap-2 mt-0.5" dir="auto">
                    {hasDomain && <span className="text-zinc-300 font-medium font-mono">{targetDomain}</span>}
                    {item.category && !item.category.toLowerCase().includes("verified") && !item.category.toLowerCase().includes("google") && item.category !== "Website" && (
                      <>
                        {hasDomain && <span>•</span>}
                        <span>{item.category}</span>
                      </>
                    )}
                    {item.address && !item.address.toLowerCase().includes("verified") && !item.address.toLowerCase().includes("google") && (
                      <>
                        {(hasDomain || (item.category && !item.category.toLowerCase().includes("verified") && !item.category.toLowerCase().includes("google") && item.category !== "Website")) && <span>•</span>}
                        <span>{item.address}</span>
                      </>
                    )}
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
