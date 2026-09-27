import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, MapPin, X, Loader2, AlertCircle } from "lucide-react";
import { Country, State, City } from "country-state-city";
import { cachedCountry, cachedState, cachedCity } from "../utils/locationCache";
import { CountrySelector } from "./CountrySelector";
import { SearchableComboSelector } from "./SearchableComboSelector";
import { formatLocationSearchQuery } from "../utils/locationSearchHelper";
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
  className = ""
}) => {
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);
  const [state, setState] = useState(initialState);
  const [city, setCity] = useState(initialCity);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationError, setLocationError] = useState<"country" | "city" | null>(null);

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
  const { statesObj, hasStates, stateOptions, uniqueCityOptions, stateLabel } = useMemo(() => {
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
    if (newCountry) {
      setLocationError(null);
    }
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (newCity) {
      setLocationError(null);
    }
  };

  const handleClearLocation = () => {
    setCountry("");
    setState("");
    setCity("");
    setLocationError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = businessName.trim();
    if (!trimmed) return;

    setShowSuggestions(false);

    // If the input is already a direct domain (e.g. "mjpsolicitors.co.uk" or "apple.com"), pass clean domain directly
    const cleanDom = extractCleanDomain(trimmed);
    if (isValidDomainUrl(cleanDom)) {
      setLocationError(null);
      onSearch(cleanDom, { country, state, city, rawBusinessName: trimmed });
      return;
    }

    // When searching by business name, country and city are mandatory
    if (!country) {
      setLocationError("country");
      return;
    }

    if (!city) {
      setLocationError("city");
      return;
    }

    setLocationError(null);

    // Format full query with location components for pinpoint search
    const { fullQuery } = formatLocationSearchQuery(trimmed, country, state, city);
    onSearch(fullQuery, { country, state, city, rawBusinessName: trimmed });
  };

  return (
    <div className={`w-full flex flex-col gap-3 relative ${className}`} ref={containerRef}>
      
      {/* 1. Main Business Name Search Input */}
      <form onSubmit={handleSubmit} className="w-full relative group">
        <div className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-zinc-700/50 rounded-2xl md:rounded-3xl p-2 md:p-2.5 shadow-xl transition-all">
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
                placeholder={t("search.placeholder", "Search business name...")}
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
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

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

      {/* 2. Structured Location Filter Card - Identical Layout to Edit Profile */}
      <div className={`w-full bg-zinc-950 border ${locationError ? "border-rose-500/60 ring-1 ring-rose-500/20" : "border-zinc-800"} rounded-2xl p-4 shadow-xl flex flex-col gap-3 transition-all`}>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300">
              {t("common.location", "Location")}
            </label>
          </div>
          
          {(country || city) && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Validation error message if location missing */}
        {locationError && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {locationError === "country"
                ? "Please select a Country to target this business."
                : "Please select a City to target this business."}
            </span>
          </div>
        )}

        {/* Exact CountrySelector component */}
        <div className="space-y-1">
          <CountrySelector
            value={country}
            onChange={handleCountryChange}
            hasError={locationError === "country"}
          />
        </div>

        {/* Cascading State/Region and City Selectors */}
        {country && (
          <div className="grid grid-cols-2 gap-3 pt-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
            {hasStates ? (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">
                    {stateLabel}
                  </span>
                  <SearchableComboSelector
                    value={state}
                    onChange={(val) => {
                      setState(val);
                      setCity("");
                    }}
                    options={stateOptions}
                    placeholder={stateLabel}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">
                    {t("profile.city", "City")}
                  </span>
                  <SearchableComboSelector
                    value={city}
                    onChange={handleCityChange}
                    options={uniqueCityOptions}
                    placeholder={t("profile.selectCity", "Select City")}
                    hasError={locationError === "city"}
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide pl-1 block">
                  {t("profile.city", "City")}
                </span>
                <SearchableComboSelector
                  value={city}
                  onChange={handleCityChange}
                  options={uniqueCityOptions}
                  placeholder={t("profile.selectCity", "Select City")}
                  hasError={locationError === "city"}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Autocomplete / Live Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-[60px] left-0 right-0 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/80 max-h-[340px] overflow-y-auto animate-in fade-in duration-150">
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
                  <div className="font-bold text-sm text-white group-hover:text-zinc-200 transition-colors truncate">
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
