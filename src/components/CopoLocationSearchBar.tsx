import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, MapPin, Globe, Check, X, Loader2, Sparkles, Building2, SlidersHorizontal } from "lucide-react";
import { Country, State, City } from "country-state-city";
import { cachedCountry, cachedState, cachedCity } from "../utils/locationCache";
import { CountrySelector } from "./CountrySelector";
import { SearchableComboSelector } from "./SearchableComboSelector";
import { POPULAR_HUBS, formatLocationSearchQuery, QuickLocationHub } from "../utils/locationSearchHelper";
import { useLanguage } from "../i18n/LanguageContext";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { extractCleanDomain, isValidDomainUrl } from "../utils/placeUtils";

export interface CopoLocationSearchBarProps {
  onSearch: (fullQuery: string, locationDetails: { country: string; state: string; city: string; rawBusinessName: string }) => void;
  isSearching?: boolean;
  initialQuery?: string;
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
  initialCountry = "",
  initialState = "",
  initialCity = "",
  autoFocus = false,
  suggestions = [],
  isLoadingSuggest = false,
  onSelectSuggestion,
  compact = false,
  className = ""
}) => {
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);
  const [state, setState] = useState(initialState);
  const [city, setCity] = useState(initialCity);
  const [showLocationPanel, setShowLocationPanel] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) setBusinessName(initialQuery);
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

  // Compute states and cities dynamically based on selected country and state
  const { isoCode, statesObj, hasStates, stateOptions, uniqueCityOptions, stateLabel } = useMemo(() => {
    if (!country) {
      return {
        isoCode: "",
        statesObj: [],
        hasStates: false,
        stateOptions: [],
        uniqueCityOptions: [],
        stateLabel: t("profile.regionProvince", "Region / Province")
      };
    }

    const selectedCountryObj = cachedCountry.getAllCountries().find(c => c.name === country) ||
                               Country.getAllCountries().find(c => c.name.toLowerCase() === country.toLowerCase());
    const iso = selectedCountryObj?.isoCode || "";

    const rawStates = cachedState.getStatesOfCountry(iso) || State.getStatesOfCountry(iso) || [];
    const statesExist = rawStates.length > 0;
    const sOpts = rawStates.map(s => s.name);
    const label = t("profile.regionProvince", "Region / Province");

    let rawCityOpts: string[] = [];
    if (state) {
      const selectedStateObj = rawStates.find(s => s.name === state);
      if (selectedStateObj) {
        const stateCities = cachedCity.getCitiesOfState(iso, selectedStateObj.isoCode).map(c => c.name);
        rawCityOpts = stateCities.length > 0 ? stateCities : (cachedCity.getCitiesOfCountry(iso)?.map(c => c.name) || []);
      } else {
        rawCityOpts = cachedCity.getCitiesOfCountry(iso)?.map(c => c.name) || [];
      }
    } else {
      rawCityOpts = cachedCity.getCitiesOfCountry(iso)?.map(c => c.name) || [];
    }

    const uniqueCities = Array.from(new Set(rawCityOpts));

    return {
      isoCode: iso,
      statesObj: rawStates,
      hasStates: statesExist,
      stateOptions: sOpts,
      uniqueCityOptions: uniqueCities,
      stateLabel: label
    };
  }, [country, state, t]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setState("");
    setCity("");
  };

  const handleQuickHubSelect = (hub: QuickLocationHub) => {
    setCountry(hub.country);
    if (hub.state) setState(hub.state);
    setCity(hub.city);
    inputRef.current?.focus();
  };

  const handleClearLocation = () => {
    setCountry("");
    setState("");
    setCity("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = businessName.trim();
    if (!trimmed) return;

    setShowSuggestions(false);

    // If the input is already a direct domain (e.g. "mjpsolicitors.co.uk" or "apple.com"), pass clean domain
    const cleanDom = extractCleanDomain(trimmed);
    if (isValidDomainUrl(cleanDom)) {
      onSearch(cleanDom, { country, state, city, rawBusinessName: trimmed });
      return;
    }

    // Format full query with location components for pinpoint Google CSE accuracy
    const { fullQuery } = formatLocationSearchQuery(trimmed, country, state, city);
    onSearch(fullQuery, { country, state, city, rawBusinessName: trimmed });
  };

  return (
    <div className={`w-full flex flex-col gap-3 relative ${className}`} ref={containerRef}>
      
      {/* 1. Main Business Name Search Input */}
      <form onSubmit={handleSubmit} className="w-full relative group">
        <div className="w-full bg-zinc-900/90 backdrop-blur-2xl border border-zinc-700/80 hover:border-zinc-500/80 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/10 rounded-2xl md:rounded-3xl p-2 md:p-2.5 shadow-2xl transition-all">
          <div className="flex items-center gap-2">
            
            {/* Search Input Icon & Text */}
            <div className="flex-1 flex items-center relative min-w-0 pl-2">
              <Search className="w-5 h-5 text-zinc-400 shrink-0 group-focus-within:text-white transition-colors mr-2.5" />
              <input
                ref={inputRef}
                type="text"
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
                placeholder={t("search.placeholder", "Search business name (e.g. Hamad Bin Jarwan, MJP Solicitors)...")}
                className="w-full bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none py-2 pr-6 font-medium"
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
                  className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mr-1"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Toggle Location Panel Button (if compact) */}
            {compact && (
              <button
                type="button"
                onClick={() => setShowLocationPanel(!showLocationPanel)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  country || city
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
                }`}
                title="Toggle Location Target"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{city || country || "Location"}</span>
              </button>
            )}

            {/* Submit Search Button */}
            <button
              type="submit"
              disabled={isSearching || !businessName.trim()}
              className="h-10 px-5 rounded-xl md:rounded-2xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              {isSearching || isLoadingSuggest ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <span>{t("common.search", "Search")}</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 2. Structured Location Filter Card - Exactly Identical Design & Layout to Edit Profile */}
      {showLocationPanel && (
        <div className="w-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3.5 md:p-4 shadow-xl flex flex-col gap-3 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-200">
                {t("common.location", "Location Target (Country & City)")}
              </label>
            </div>
            
            {(country || city) && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-[11px] font-bold text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Exact CountrySelector component from Edit Profile */}
          <div className="space-y-1">
            <CountrySelector
              value={country}
              onChange={handleCountryChange}
            />
          </div>

          {/* Cascading State/Region and City Selectors (identical to Edit Profile) */}
          {country && (
            <div className="grid grid-cols-2 gap-3 pt-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {hasStates ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide pl-1 block">
                      {stateLabel}
                    </span>
                    <SearchableComboSelector
                      value={state}
                      onChange={(val) => {
                        setState(val);
                        setCity(""); // Reset city when state/region changes
                      }}
                      options={stateOptions}
                      placeholder={stateLabel}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide pl-1 block">
                      {t("profile.city", "City")}
                    </span>
                    <SearchableComboSelector
                      value={city}
                      onChange={setCity}
                      options={uniqueCityOptions}
                      placeholder={t("profile.selectCity", "Select City")}
                    />
                  </div>
                </>
              ) : (
                <div className="col-span-2 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide pl-1 block">
                    {t("profile.city", "City")}
                  </span>
                  <SearchableComboSelector
                    value={city}
                    onChange={setCity}
                    options={uniqueCityOptions}
                    placeholder={t("profile.selectCity", "Select City")}
                  />
                </div>
              )}
            </div>
          )}

          {/* Quick 1-Tap Popular Location Hubs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick Hubs:
            </span>
            {POPULAR_HUBS.map((hub) => {
              const isSelected = country.toLowerCase() === hub.country.toLowerCase() && city.toLowerCase() === hub.city.toLowerCase();
              return (
                <button
                  key={hub.label}
                  type="button"
                  onClick={() => handleQuickHubSelect(hub)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs"
                      : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <span>{hub.flag}</span>
                  <span>{hub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Location Active Targeting Info */}
          {(country || city) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800/90 text-xs text-zinc-300 mt-0.5">
              <span className="text-amber-400 font-bold">📍 Google Search Targeted To:</span>
              <span className="font-bold text-white truncate">
                {[city, state, country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. Autocomplete / Live Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-[60px] left-0 right-0 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/60 max-h-[340px] overflow-y-auto animate-in fade-in duration-150">
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
                className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-zinc-800/80 transition-colors text-left cursor-pointer group"
              >
                {isDbOrBrand && hasDomain ? (
                  <CopoBrandLogo
                    domain={item.domain}
                    name={item.title}
                    logoUrl={item.logoUrl}
                    className="w-8 h-8 rounded-lg border border-zinc-700 bg-white shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-0.5"
                    imageClassName="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xs flex items-center justify-center overflow-hidden shrink-0 text-zinc-400 group-hover:text-white transition-colors">
                    <Search className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-zinc-400 truncate flex items-center gap-2 mt-0.5">
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
