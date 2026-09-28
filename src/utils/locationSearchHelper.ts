import { locationData } from "./locationData";
import { countryDialData, getCountryDialInfo } from "./countries";
import { cachedCountry, cachedState, cachedCity } from "./locationCache";

export interface LocationOption {
  country: string;
  countryCode: string;
  flag: string;
  stateLabel?: string;
  hasStates: boolean;
  states: string[];
}

export interface QuickLocationHub {
  label: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  flag: string;
}

export const POPULAR_HUBS: QuickLocationHub[] = [
  { label: "Abu Dhabi", city: "Abu Dhabi", state: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", flag: "🇦🇪" },
  { label: "Dubai", city: "Dubai", state: "Dubai", country: "United Arab Emirates", countryCode: "AE", flag: "🇦🇪" },
  { label: "London", city: "London", state: "England", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧" },
  { label: "New York", city: "New York City", state: "New York", country: "United States", countryCode: "US", flag: "🇺🇸" },
  { label: "Los Angeles", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", flag: "🇺🇸" },
  { label: "Tel Aviv", city: "Tel Aviv", country: "Israel", countryCode: "IL", flag: "🇮🇱" },
  { label: "Riyadh", city: "Riyadh", state: "Riyadh", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦" },
  { label: "Paris", city: "Paris", state: "Île-de-France", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { label: "Berlin", city: "Berlin", state: "Berlin", country: "Germany", countryCode: "DE", flag: "🇩🇪" },
  { label: "Toronto", city: "Toronto", state: "Ontario", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { label: "Sydney", city: "Sydney", state: "New South Wales", country: "Australia", countryCode: "AU", flag: "🇦🇺" }
];

/**
 * Retrieves all available countries with flags and state configuration
 */
export const getAllLocationCountries = (): LocationOption[] => {
  const map = new Map<string, LocationOption>();

  // 1. Load from countryDialData first (clean flags & names)
  for (const c of countryDialData) {
    const locConfig = locationData[c.name];
    map.set(c.name.toLowerCase(), {
      country: c.name,
      countryCode: c.code,
      flag: c.flag || "🌐",
      stateLabel: locConfig?.stateLabel || (locConfig?.hasStates ? "State / Region" : undefined),
      hasStates: Boolean(locConfig?.hasStates),
      states: locConfig?.states || []
    });
  }

  // 2. Supplement from cachedCountry
  const allCc = cachedCountry.getAllCountries();
  for (const c of allCc) {
    const key = c.name.toLowerCase();
    if (!map.has(key)) {
      const locConfig = locationData[c.name];
      map.set(key, {
        country: c.name,
        countryCode: c.isoCode,
        flag: c.flag || "🌐",
        stateLabel: locConfig?.stateLabel || (locConfig?.hasStates ? "State / Region" : undefined),
        hasStates: Boolean(locConfig?.hasStates),
        states: locConfig?.states || []
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.country.localeCompare(b.country));
};

/**
 * Get states, provinces, or emirates for a specific country
 */
export const getStatesForCountry = (countryName: string): { states: string[]; label: string } => {
  if (!countryName) return { states: [], label: "State / Province" };

  // Check locationData first for curated, high-accuracy state names (e.g. UAE emirates, UK regions)
  const directConfig = locationData[countryName];
  if (directConfig?.hasStates && directConfig.states && directConfig.states.length > 0) {
    return {
      states: directConfig.states,
      label: directConfig.stateLabel || "State / Province"
    };
  }

  // Fallback to cachedState by ISO code
  const dialInfo = getCountryDialInfo(countryName);
  if (dialInfo?.code) {
    const fromCache = cachedState.getStatesOfCountry(dialInfo.code);
    if (fromCache && fromCache.length > 0) {
      return {
        states: fromCache.map(s => s.name.replace(/\s+Emirate$/i, "").replace(/\s+Province$/i, "").replace(/\s+State$/i, "")),
        label: "State / Region"
      };
    }
  }

  return { states: [], label: "State / Province" };
};

/**
 * Get cities for a specific country and optional state/emirate
 */
export const getCitiesForLocation = (countryName: string, stateName?: string): string[] => {
  if (!countryName) return [];

  const directConfig = locationData[countryName];
  if (directConfig) {
    if (directConfig.hasStates && stateName && typeof directConfig.cities === "object" && !Array.isArray(directConfig.cities)) {
      const stateCities = (directConfig.cities as Record<string, string[]>)[stateName];
      if (stateCities && stateCities.length > 0) {
        return stateCities;
      }
    }
    if (Array.isArray(directConfig.cities) && directConfig.cities.length > 0) {
      return directConfig.cities;
    }
    if (typeof directConfig.cities === "object" && !Array.isArray(directConfig.cities)) {
      const all: string[] = [];
      for (const list of Object.values(directConfig.cities)) {
        if (Array.isArray(list)) all.push(...list);
      }
      if (all.length > 0) return Array.from(new Set(all));
    }
  }

  // Fallback to cachedCity
  const dialInfo = getCountryDialInfo(countryName);
  if (dialInfo?.code) {
    if (stateName) {
      const states = cachedState.getStatesOfCountry(dialInfo.code);
      const matchedState = states.find(s => s.name.toLowerCase().includes(stateName.toLowerCase()));
      if (matchedState) {
        const cities = cachedCity.getCitiesOfState(dialInfo.code, matchedState.isoCode);
        if (cities.length > 0) return cities.map(c => c.name);
      }
    }
    const countryCities = cachedCity.getCitiesOfCountry(dialInfo.code);
    if (countryCities.length > 0) return countryCities.map(c => c.name);
  }

  return [];
};

/**
 * Composes a high-precision targeted Google Search keyword query
 */
export const formatLocationSearchQuery = (
  businessName: string,
  country?: string,
  state?: string,
  city?: string
): { fullQuery: string; displayLocation: string } => {
  const trimmedName = (businessName || "").trim();
  const parts: string[] = [trimmedName];

  const locParts: string[] = [];
  if (city && city.trim() && !trimmedName.toLowerCase().includes(city.toLowerCase())) {
    parts.push(city.trim());
    locParts.push(city.trim());
  }
  if (state && state.trim() && state.toLowerCase() !== city?.toLowerCase() && !trimmedName.toLowerCase().includes(state.toLowerCase())) {
    parts.push(state.trim());
    locParts.push(state.trim());
  }
  if (country && country.trim() && !trimmedName.toLowerCase().includes(country.toLowerCase())) {
    parts.push(country.trim());
    locParts.push(country.trim());
  }

  return {
    fullQuery: parts.filter(Boolean).join(" ").trim(),
    displayLocation: locParts.join(", ")
  };
};

export interface CitySuggestion {
  city: string;
  state?: string;
  country: string;
  label: string;
}

/**
 * Fast search of global cities for auto-suggesting cities when typing in location input
 */
export const searchCitySuggestions = (query: string, maxResults = 8): CitySuggestion[] => {
  const q = (query || "").toLowerCase().trim();
  if (!q) {
    return [];
  }

  const results: CitySuggestion[] = [];
  const seen = new Set<string>();

  const getNormKey = (cityName: string, countryName: string) => {
    return `${cityName.toLowerCase().trim()}:${countryName.toLowerCase().trim()}`;
  };

  // 1. Check popular hubs first for exact prefix matches
  for (const h of POPULAR_HUBS) {
    if (h.city.toLowerCase().startsWith(q) || h.label.toLowerCase().startsWith(q)) {
      const key = getNormKey(h.city, h.country);
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          city: h.city,
          state: h.state,
          country: h.country,
          label: h.state ? `${h.city}, ${h.state}` : `${h.city}, ${h.country}`
        });
      }
    }
  }

  // 2. Search through curated locationData
  for (const [country, config] of Object.entries(locationData)) {
    if (results.length >= maxResults * 2) break;

    if (Array.isArray(config.cities)) {
      for (const cityName of config.cities) {
        if (results.length >= maxResults * 2) break;
        const cLower = cityName.toLowerCase();
        if (cLower.startsWith(q) || (q.length >= 3 && cLower.includes(q))) {
          const key = getNormKey(cityName, country);
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              city: cityName,
              country,
              label: `${cityName}, ${country}`
            });
          }
        }
      }
    } else if (typeof config.cities === 'object') {
      for (const [stateName, cityList] of Object.entries(config.cities)) {
        if (results.length >= maxResults * 2) break;
        if (Array.isArray(cityList)) {
          for (const cityName of cityList) {
            if (results.length >= maxResults * 2) break;
            const cLower = cityName.toLowerCase();
            if (cLower.startsWith(q) || (q.length >= 3 && cLower.includes(q))) {
              const key = getNormKey(cityName, country);
              if (!seen.has(key)) {
                seen.add(key);
                results.push({
                  city: cityName,
                  state: stateName,
                  country,
                  label: `${cityName}, ${stateName}`
                });
              } else {
                // If already added without state, update existing entry with state info if richer
                const existing = results.find(r => r.city.toLowerCase() === cityName.toLowerCase() && r.country.toLowerCase() === country.toLowerCase());
                if (existing && !existing.state && stateName) {
                  existing.state = stateName;
                  existing.label = `${cityName}, ${stateName}`;
                }
              }
            }
          }
        }
      }
    }
  }

  // Sort: prefix matches first, then shorter city names
  return results.sort((a, b) => {
    const aStarts = a.city.toLowerCase().startsWith(q);
    const bStarts = b.city.toLowerCase().startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.city.length - b.city.length;
  }).slice(0, maxResults);
};
