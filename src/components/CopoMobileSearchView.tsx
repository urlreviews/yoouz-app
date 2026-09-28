import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Clock, TrendingUp, X, AlertCircle, Building2, CheckCircle, MapPin, Globe } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoSearchView } from "./CopoSearchView";
import { CopoLocationSearchBar } from "./CopoLocationSearchBar";
import { useLanguage } from "../i18n/LanguageContext";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { extractCleanDomain, isValidDomainUrl, getCleanDomainUrl, isPlaceReviewMatch, formatBusinessName, KNOWN_OFFICIAL_NAMES, isGenericPlaceName } from "../utils/placeUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { queryGoogleCseForUrl } from "../utils/googleCse";

interface CopoMobileSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onClose: () => void;
}

const SearchBusinessBadge: React.FC<{
  term: string;
  place?: Place | null;
  iconType: 'clock' | 'trending' | 'search';
  getItemLogoUrl: (term: string, place?: Place | null) => string | null;
}> = ({ term, place, iconType, getItemLogoUrl }) => {
  const cleanDomain = getCleanDomainUrl(place || term);
  const isBusinessOrDomain = Boolean((cleanDomain && cleanDomain.includes(".")) || place);
  const logoUrl = getItemLogoUrl(term, place);

  if (isBusinessOrDomain) {
    const domain = cleanDomain || term;
    const displayName = (cleanDomain && KNOWN_OFFICIAL_NAMES[cleanDomain])
      || (place?.brandDomain && KNOWN_OFFICIAL_NAMES[place.brandDomain])
      || (place?.name && !isGenericPlaceName(place.name) && place.name !== domain && place.name !== "Garage Jv" ? place.name : formatBusinessName(domain))
      || domain;
    return (
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm ring-1 ring-white/20 border border-zinc-200/60 flex items-center justify-center shrink-0 p-1 overflow-hidden">
        <CopoBrandLogo
          domain={domain}
          name={displayName}
          website={place?.website || (domain.includes(".") ? `https://${domain}` : undefined)}
          logoUrl={logoUrl || place?.logoUrl || place?.avatarUrl}
          bannerUrl={place?.bannerUrl || place?.ogImage}
          className="w-full h-full flex items-center justify-center p-0 overflow-hidden bg-transparent"
          imageClassName="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast]"
          fallbackTextClassName="font-black text-xs text-zinc-950 uppercase"
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center">
      {iconType === 'trending' ? (
        <TrendingUp className="w-4 h-4 text-zinc-500 opacity-50" />
      ) : iconType === 'search' ? (
        <Search className="w-4 h-4 text-zinc-500 opacity-50" />
      ) : (
        <Clock className="w-4 h-4 text-zinc-500 opacity-50" />
      )}
    </div>
  );
};

export const CopoMobileSearchView: React.FC<CopoMobileSearchViewProps> = ({
  places,
  videos,
  onSelectVideo,
  onOpenPlace,
  onRecordForPlace,
  onAddPlace,
  onClose
}) => {
  const { t } = useLanguage();
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [showLocationBar, setShowLocationBar] = useState(false);
  const [isFocusedLocation, setIsFocusedLocation] = useState(false);
  const businessInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([]);

  // Live Auto-Suggest debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setLiveSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}`);
        if (resp.ok) {
          const data = await resp.json();
          setLiveSuggestions(data.suggestions || []);
        }
      } catch (err) {}
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);
  
  // Recent searches (stored as clean domain URLs e.g. "uber.com", "bhol.co.il")
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const rawSaved = JSON.parse(localStorage.getItem("yoouz_recent_searches") || "[]");
      if (Array.isArray(rawSaved)) {
        const cleaned: string[] = [];
        for (const item of rawSaved) {
          if (!item || typeof item !== "string") continue;
          const trimmed = item.trim();
          if (trimmed.length < 3) continue; // Instantly discard single-letter searches like "n", "k"

          // Check if it matches a known place name, ID, or domain
          const matched = places.find(p => 
            p.name.toLowerCase() === trimmed.toLowerCase() ||
            p.id.toLowerCase() === trimmed.toLowerCase() ||
            p.brandDomain?.toLowerCase() === trimmed.toLowerCase()
          );

          const cleanDomain = getCleanDomainUrl(matched || trimmed);
          if (isValidDomainUrl(cleanDomain) && !cleaned.includes(cleanDomain)) {
            cleaned.push(cleanDomain);
          }
        }
        setRecentSearches(cleaned);
        localStorage.setItem("yoouz_recent_searches", JSON.stringify(cleaned));
      }
    } catch {}
    
    // Auto focus on mount
    setTimeout(() => {
      businessInputRef.current?.focus();
    }, 100);
  }, [places]);

  // Pre-fetch metadata in the background for any recent search item not already in places
  // so the database in BunnyDB/bunnydb keeps the banner and logo immediately
  useEffect(() => {
    if (!onAddPlace) return;
    recentSearches.forEach(async (term) => {
      const cleanDom = getCleanDomainUrl(term);
      if (!isValidDomainUrl(cleanDom)) return;
      const alreadySaved = places.some(p => {
        const pDom = getCleanDomainUrl(p);
        return pDom === cleanDom;
      });
      if (!alreadySaved) {
        try {
          const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(cleanDom)}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data.title || data.domain) {
              const fetchedLogo = data.logo || getCleanLogoUrl(null, data.domain) || "";
              const fetchedBanner = data.image || "";
              const newPlace: Place = {
                id: (data.domain || cleanDom).toLowerCase(),
                name: formatBusinessName(data.siteName || data.title, data.domain || cleanDom) || formatBusinessName(cleanDom) || cleanDom,
                category: data.category || "Website",
                categoryType: "all",
                address: data.address || "",
                city: data.city || "Online",
                country: data.country || "",
                lat: data.lat || 0,
                lng: data.lng || 0,
                rating: 5,
                totalReviews: 1,
                ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
                avatarUrl: fetchedLogo,
                logoUrl: fetchedLogo,
                bannerUrl: fetchedBanner,
                ogImage: fetchedBanner,
                photos: fetchedBanner ? [fetchedBanner] : [],
                openingHours: data.openingHours || "",
                isOpen: true,
                phone: data.phone || "",
                email: data.email || "",
                website: data.url || `https://${cleanDom}`,
                priceRange: "N/A",
                plusCode: "",
                description: data.description || "",
                popularKeywords: [],
                amenities: [],
                topDishes: [],
                brandDomain: data.domain || cleanDom
              };
              onAddPlace(newPlace);
            }
          }
        } catch (err) {}
      }
    });
  }, [recentSearches, places, onAddPlace]);

  const findMatchingPlace = (term: string, preferredName?: string): Place | undefined => {
    const base = (preferredName || term).trim();
    const target = extractCleanDomain(base);
    const rawTarget = extractCleanDomain(term);
    return places.find(p => {
      if (!p) return false;
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      const isRealDom = isValidDomainUrl(pDom);
      const pReviews = (p.totalReviews || 0) > 0 || (p.reviews && p.reviews.length > 0);

      if (target && pDom === target && isRealDom) return true;
      if (rawTarget && pDom === rawTarget && isRealDom) return true;
      
      const pNameLower = (p.name || "").toLowerCase().trim();
      const baseLower = base.toLowerCase();
      const termLower = term.toLowerCase();

      const isKnownBrand = Boolean(
        (pDom && KNOWN_OFFICIAL_NAMES[pDom]) ||
        (pNameLower && KNOWN_OFFICIAL_NAMES[pNameLower])
      );
      
      if (isKnownBrand && (pNameLower === baseLower || pNameLower === termLower)) {
        return true;
      }
      
      if (pReviews && isRealDom && (pNameLower === baseLower || pNameLower === termLower)) {
        return true;
      }
      return false;
    });
  };

  const getItemLogoUrl = (term: string, place?: Place | null): string | null => {
    if (place) {
      const l = getPlaceLogoUrl(place);
      if (l) return l;
    }
    const cleanDomain = getCleanDomainUrl(term);
    if (cleanDomain && cleanDomain.includes(".")) {
      return getPlaceLogoUrl({ name: cleanDomain, brandDomain: cleanDomain });
    }
    return null;
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250); // wait for animation
  };

  const handleBack = () => {
    if (submittedQuery) {
      setSubmittedQuery("");
      setQuery("");
      setTimeout(() => {
        businessInputRef.current?.focus();
      }, 100);
    } else {
      handleClose();
    }
  };

  const handleSearch = async (
    e: React.FormEvent | string,
    preferredName?: string,
    locationDetails?: { country?: string; state?: string; city?: string; rawBusinessName?: string; rawLocation?: string }
  ) => {
    if (typeof e !== 'string') e.preventDefault();
    const raw = typeof e === 'string' ? e : query;
    if (!raw || !raw.trim()) return;
    
    const trimmed = raw.trim();
    const baseName = (preferredName || locationDetails?.rawBusinessName || trimmed).trim();
    // Resolve matching place clean domain if available
    const matchedPlace = findMatchingPlace(trimmed, baseName);
    let cleanUrl = matchedPlace ? getCleanDomainUrl(matchedPlace) : extractCleanDomain(trimmed);

    // If not a domain with a dot, check KNOWN_OFFICIAL_NAMES (EXACT match only)
    if (!isValidDomainUrl(cleanUrl)) {
      const brandMatch = Object.entries(KNOWN_OFFICIAL_NAMES).find(([k, v]) => {
        if (!k.includes('.')) return false;
        const qL = trimmed.toLowerCase();
        const vL = v.toLowerCase();
        const kL = k.toLowerCase();
        const kRoot = kL.split('.')[0];
        return (
          vL === qL ||
          kL === qL ||
          kRoot === qL
        );
      });
      if (brandMatch) {
        cleanUrl = brandMatch[0];
      }
    }

    // If still not a valid domain, attempt to resolve via Google CSE
    if (!isValidDomainUrl(cleanUrl)) {
      console.info("[Search Mobile] Querying client-side Google CSE first for:", trimmed);
      let cseUrl: string | null = null;
      try {
        const cseTimeout = (ms: number) => new Promise<null>((_, reject) => setTimeout(() => reject(new Error("CSE Timeout")), ms));
        cseUrl = await Promise.race([
          queryGoogleCseForUrl(trimmed),
          cseTimeout(5000)
        ]);
      } catch (cseErr) {
        console.warn("[Search Mobile] Client-side Google CSE took too long or errored:", cseErr);
      }

      if (cseUrl) {
        const resolvedDom = extractCleanDomain(cseUrl);
        if (isValidDomainUrl(resolvedDom) && !resolvedDom.toLowerCase().includes('wikipedia.org')) {
          console.info("[Search Mobile] Successfully resolved domain via Google CSE:", resolvedDom);
          cleanUrl = resolvedDom;
        }
      }

      // If still not resolved, query backend search index
      if (!isValidDomainUrl(cleanUrl)) {
        try {
          const metaResp = await fetch(`/api/url-metadata?q=${encodeURIComponent(trimmed)}`);
          if (metaResp.ok) {
            const meta = await metaResp.json();
            if (meta && meta.domain && isValidDomainUrl(meta.domain) && !meta.domain.toLowerCase().includes('wikipedia.org')) {
              cleanUrl = meta.domain;
            }
          }
        } catch(e) {}
      }
    }

    const isRealDomain = isValidDomainUrl(cleanUrl);

    // Store recent searches (use cleanUrl if domain, otherwise fall back to trimmed name)
    const storeTerm = cleanUrl || trimmed;
    if (storeTerm) {
      const newRecent = [storeTerm, ...recentSearches.filter(s => s && s !== storeTerm)].slice(0, 10);
      setRecentSearches(newRecent);
      try {
        localStorage.setItem("yoouz_recent_searches", JSON.stringify(newRecent));
      } catch {}
    }

    // Synchronously register place into memory & database so logo/banner resolves on 1st search attempt
    if (!matchedPlace && onAddPlace) {
      const instantLogo = isRealDomain ? (getCleanLogoUrl(null, cleanUrl) || "") : "";
      const instantName = preferredName || locationDetails?.rawBusinessName || (cleanUrl && KNOWN_OFFICIAL_NAMES[cleanUrl]) || formatBusinessName(cleanUrl) || trimmed;
      const instantCity = locationDetails?.city || "";
      const instantCountry = locationDetails?.country || "";
      const optimisticPlace: Place = {
        id: isRealDomain ? cleanUrl.toLowerCase() : (baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-\.\u0590-\u05FF]/g, '') || "business"),
        name: instantName,
        category: "Verified Business",
        categoryType: "all",
        address: instantCity ? `${instantCity}${instantCountry ? ', ' + instantCountry : ''}` : "",
        city: instantCity,
        country: instantCountry,
        lat: 0,
        lng: 0,
        rating: 5,
        totalReviews: 1,
        ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
        avatarUrl: instantLogo,
        logoUrl: instantLogo,
        bannerUrl: "",
        ogImage: "",
        photos: [],
        openingHours: "Available 24/7",
        isOpen: true,
        phone: "",
        website: isRealDomain ? `https://${cleanUrl}` : "",
        priceRange: "N/A",
        plusCode: "",
        description: "",
        popularKeywords: [],
        amenities: [],
        topDishes: [],
        brandDomain: isRealDomain ? cleanUrl : ""
      };
      onAddPlace(optimisticPlace);

      // Immediately enrich with authentic address, phone, email, category in the background
      const searchEndpoint = isRealDomain 
        ? `/api/url-metadata?url=${encodeURIComponent(cleanUrl)}`
        : `/api/url-metadata?q=${encodeURIComponent(trimmed)}`;

      fetch(searchEndpoint)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && (data.title || data.address || data.phone || data.category || data.image || data.logo)) {
            const isValidLogo = data.logo && !data.logo.includes("tap/0.png") && !data.logo.includes("icons/tap") && !data.logo.startsWith("data:;");
            const isValidBanner = data.image && !data.image.includes("unsplash.com") && !data.image.includes("placeholder");
            onAddPlace({
              ...optimisticPlace,
              name: preferredName || locationDetails?.rawBusinessName || (cleanUrl && KNOWN_OFFICIAL_NAMES[cleanUrl]) || (data.domain && KNOWN_OFFICIAL_NAMES[data.domain]) || formatBusinessName(data.siteName || data.title, data.domain || cleanUrl) || optimisticPlace.name,
              category: data.category || optimisticPlace.category,
              address: (data.address && !data.address.startsWith("http")) ? data.address : optimisticPlace.address,
              city: locationDetails?.city || data.city || optimisticPlace.city,
              country: locationDetails?.country || data.country || optimisticPlace.country,
              phone: data.phone || optimisticPlace.phone,
              email: data.email || optimisticPlace.email,
              bannerUrl: isValidBanner ? data.image : optimisticPlace.bannerUrl,
              ogImage: isValidBanner ? data.image : optimisticPlace.ogImage,
              logoUrl: isValidLogo ? data.logo : optimisticPlace.logoUrl,
              avatarUrl: isValidLogo ? data.logo : optimisticPlace.avatarUrl,
              website: data.url || optimisticPlace.website,
              brandDomain: data.domain || optimisticPlace.brandDomain,
              description: data.description || optimisticPlace.description
            });
          }
        })
        .catch(() => {});
    }

    setSubmittedQuery(trimmed);
  };

  const executeSearch = (targetQuery?: string, preferredName?: string) => {
    const rawBiz = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!rawBiz) return;

    const loc = location.trim();
    const finalQ = loc ? `${rawBiz} ${loc}` : rawBiz;

    handleSearch(finalQ, preferredName || rawBiz, {
      country: "",
      state: "",
      city: loc,
      rawBusinessName: rawBiz,
      rawLocation: loc
    });
  };

  const handleSelectSuggestion = (item: any) => {
    const title = item.title || item.name || item.domain || query;
    const loc = location.trim();
    const cleanDom = item.domain && isValidDomainUrl(item.domain) ? extractCleanDomain(item.domain) : "";
    const chosen = cleanDom || title;
    const finalQ = loc ? `${chosen} ${loc}` : chosen;
    setQuery(chosen);
    handleSearch(finalQ, title, {
      country: "",
      state: "",
      city: loc,
      rawBusinessName: title,
      rawLocation: loc
    });
  };
  
  // Calculate real trending places mapped to clean URLs
  const trending = [...places]
    .map(p => {
      const count = videos.filter(v => isPlaceReviewMatch(v, p)).length;
      return { place: p, count };
    })
    .sort((a, b) => b.count - a.count)
    .map(item => getCleanDomainUrl(item.place))
    .filter(url => url && isValidDomainUrl(url))
    .filter((url, idx, arr) => arr.indexOf(url) === idx)
    .slice(0, 5);
  
  // Get instant local DB matches by checking name, domain, id or category
  const localMatches = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return places
      .filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pDom = (p.brandDomain || p.website || p.id || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        return pName.includes(trimmed) || pDom.includes(trimmed) || pCat.includes(trimmed);
      })
      .slice(0, 5)
      .map(p => {
        const dom = extractCleanDomain(p.brandDomain || p.website || p.id) || "";
        const hasDot = dom.includes('.');
        return {
          id: p.id,
          title: p.name || dom,
          domain: hasDot ? dom : "",
          logoUrl: p.logoUrl || (hasDot ? `/api/favicon?domain=${dom}` : ""),
          category: (p.category && p.category !== "Verified Business") ? p.category : "",
          address: p.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : (p.city || ""),
          source: "database"
        };
      });
  }, [query, places]);

  // Combine local matches with live suggestions fetched from the server to prevent any disappearing list elements
  const mergedSuggestions = React.useMemo(() => {
    const seen = new Set<string>();
    const merged = [];
    
    for (const item of [...localMatches, ...liveSuggestions]) {
      const key = (item.id || item.domain || item.title || "").toLowerCase().trim();
      if (!key) continue;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged.slice(0, 8);
  }, [localMatches, liveSuggestions]);

  return (
    <div className={`fixed inset-0 h-[100dvh] z-[250] bg-zinc-950 flex flex-col font-sans transition-transform duration-250 ease-out ${isClosing ? 'translate-y-full' : 'animate-in slide-in-from-bottom'}`}>
      
      {/* Top Search Header - Yelp Style */}
      <div className="w-full flex flex-col pt-[max(10px,env(safe-area-inset-top))] sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 shadow-md">
        
        {/* Header Navigation Bar (Cancel | Yoouz Logo | Search) */}
        <div className="w-full h-12 flex items-center justify-between px-3">
          <button 
             onClick={handleBack}
             className="text-zinc-300 hover:text-white font-medium text-sm px-2 py-1 -ml-1 transition-colors cursor-pointer"
          >
            {submittedQuery ? "Back" : "Cancel"}
          </button>
          
          <div className="flex items-center gap-1.5 select-none">
            <img src="/favicon.svg" alt="Yoouz" className="w-5 h-5 rounded-md" />
            <span className="font-black text-lg tracking-tight text-white">yoouz</span>
          </div>

          <button
            type="button"
            onClick={() => executeSearch()}
            disabled={!query.trim()}
            className="text-white font-bold text-sm px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            Search
          </button>
        </div>

        {/* Dual Yelp-Style Stacked Search Bars */}
        <div className="w-full flex flex-col gap-2 px-3 pb-3 pt-1">
          {/* Box 1: Business name / keyword */}
          <div className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 flex items-center gap-2.5 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-white/10 transition-all">
            <Search className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
            <input
              ref={businessInputRef}
              type="text"
              dir="auto"
              enterKeyHint="search"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (submittedQuery) setSubmittedQuery("");
              }}
              onFocus={() => {
                if (submittedQuery) setSubmittedQuery("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  executeSearch();
                }
              }}
              placeholder={t("search.businessPlaceholder", "Search business...")}
              className="flex-1 min-w-0 bg-transparent text-white text-[15px] font-medium placeholder:text-zinc-500 focus:outline-none"
              autoFocus={true}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  if (submittedQuery) setSubmittedQuery("");
                  businessInputRef.current?.focus();
                }}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer shrink-0 rounded-full hover:bg-zinc-800 transition-colors"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Box 2: Location (the same kind of search bar under that only for location!) */}
          {(showLocationBar || query.trim().length > 0 || location.trim().length > 0 || isFocusedLocation) ? (
            <div className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 flex items-center gap-2.5 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-white/10 transition-all animate-in fade-in slide-in-from-top-1 duration-150">
              <MapPin className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
              <input
                ref={locationInputRef}
                type="text"
                dir="auto"
                enterKeyHint="search"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (submittedQuery) setSubmittedQuery("");
                }}
                onFocus={() => {
                  setIsFocusedLocation(true);
                  if (submittedQuery) setSubmittedQuery("");
                }}
                onBlur={() => setIsFocusedLocation(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    executeSearch();
                  }
                }}
                placeholder={t("search.locationPlaceholder", "Location")}
                className="flex-1 min-w-0 bg-transparent text-white text-[15px] font-medium placeholder:text-zinc-500 focus:outline-none"
              />
              {location && (
                <button
                  type="button"
                  onClick={() => {
                    setLocation("");
                    if (submittedQuery) setSubmittedQuery("");
                    locationInputRef.current?.focus();
                  }}
                  className="p-1 text-zinc-400 hover:text-white cursor-pointer shrink-0 rounded-full hover:bg-zinc-800 transition-colors"
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
                setShowLocationBar(true);
                setTimeout(() => locationInputRef.current?.focus(), 50);
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 self-start px-1 py-0.5 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>Add location</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto w-full relative pb-24">
        {submittedQuery ? (
          <CopoSearchView
            key={submittedQuery}
            places={places}
            videos={videos}
            onSelectVideo={onSelectVideo}
            onOpenPlace={onOpenPlace}
            onRecordForPlace={onRecordForPlace}
            onAddPlace={onAddPlace}
            isMobileModal={true}
            initialQuery={submittedQuery}
            hideSearchBar={true}
          />
        ) : (
          <div className="p-3 sm:p-4 flex flex-col gap-6">
            
            {/* Autocomplete Suggestions */}
            {query.length > 0 && mergedSuggestions.length > 0 && (
              <div className="flex flex-col divide-y divide-zinc-900/90 rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden shadow-xl">
                {mergedSuggestions.map((item, idx) => {
                  const title = item.title || item.name || (item.domain && isValidDomainUrl(item.domain) ? item.domain : query);
                  const rawDomain = item.domain || (typeof item === 'string' ? item : (item.brandDomain || item.website || ""));
                  const targetDomain = isValidDomainUrl(rawDomain) ? extractCleanDomain(rawDomain) : "";
                  const hasDomain = Boolean(targetDomain && targetDomain.includes('.') && isValidDomainUrl(targetDomain) && targetDomain !== "yoouz.com");
                  const isDbOrBrand = (item.source === "database" || item.source === "brand_index") && hasDomain;
                  const itemLogo = item.logoUrl || (hasDomain ? getItemLogoUrl(targetDomain, item) : null);

                  return (
                    <button 
                      key={idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className="flex items-center gap-3.5 p-3.5 text-left cursor-pointer hover:bg-zinc-900/90 active:bg-zinc-850 transition-colors w-full group"
                    >
                      {isDbOrBrand && hasDomain ? (
                        <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-zinc-200/80 flex items-center justify-center shrink-0 p-1 overflow-hidden">
                          <CopoBrandLogo 
                            domain={targetDomain}
                            name={title}
                            logoUrl={itemLogo}
                            className="w-full h-full flex items-center justify-center p-0 overflow-hidden bg-transparent"
                            imageClassName="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                          <Search className="w-4.5 h-4.5 text-zinc-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-[16px] font-bold tracking-tight truncate leading-snug group-hover:text-amber-300 transition-colors">
                          <span>{title}</span>
                        </div>
                        {(hasDomain || (item.category && !item.category.toLowerCase().includes("verified") && !item.category.toLowerCase().includes("google") && item.category !== "Website") || (item.address && !item.address.toLowerCase().includes("verified") && !item.address.toLowerCase().includes("google"))) && (
                          <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
                            {hasDomain ? (
                              <span className="text-zinc-300 font-semibold truncate text-[12px]">{targetDomain.toLowerCase()}</span>
                            ) : null}
                            {item.category && !item.category.toLowerCase().includes("verified") && !item.category.toLowerCase().includes("google") && item.category !== "Website" && (
                              <>
                                {hasDomain && <span className="text-zinc-600">•</span>}
                                <span className="text-zinc-400 truncate text-[12px]">{item.category}</span>
                              </>
                            )}
                            {item.address && !item.address.toLowerCase().includes("verified") && !item.address.toLowerCase().includes("google") && (
                              <>
                                {(hasDomain || (item.category && !item.category.toLowerCase().includes("verified") && !item.category.toLowerCase().includes("google") && item.category !== "Website")) && <span className="text-zinc-700">•</span>}
                                <span className="text-zinc-400 truncate text-[12px]">{item.address}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <Search className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Recent Searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-400 text-sm font-bold">Recent</h3>
                  <button 
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem("yoouz_recent_searches");
                    }}
                    className="text-zinc-500 text-xs font-medium uppercase hover:text-zinc-300 cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-col">
                  {recentSearches.map((s, idx) => {
                    const place = findMatchingPlace(s);
                    const cleanUrl = getCleanDomainUrl(place || s);
                    if (!cleanUrl || !isValidDomainUrl(cleanUrl)) return null;

                    return (
                      <button 
                        key={idx}
                        onClick={() => {
                          setQuery(cleanUrl);
                          executeSearch(cleanUrl);
                        }}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 active:bg-zinc-850 px-2 rounded-lg transition-colors"
                      >
                        <SearchBusinessBadge 
                          term={cleanUrl}
                          place={place}
                          iconType="clock"
                          getItemLogoUrl={getItemLogoUrl}
                        />
                        <span className="text-white text-[15px] font-normal truncate">
                          {cleanUrl}
                        </span>
                        <Clock className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Trending */}
            {query.length === 0 && trending.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-zinc-400 text-sm font-bold">Trending Searches</h3>
                <div className="flex flex-col">
                  {trending.map((s, idx) => {
                    const place = findMatchingPlace(s);
                    const cleanUrl = getCleanDomainUrl(place || s);
                    if (!cleanUrl || !isValidDomainUrl(cleanUrl)) return null;

                    return (
                      <button 
                        key={idx}
                        onClick={() => {
                          setQuery(cleanUrl);
                          executeSearch(cleanUrl);
                        }}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 active:bg-zinc-850 px-2 rounded-lg transition-colors"
                      >
                        <SearchBusinessBadge 
                          term={cleanUrl}
                          place={place}
                          iconType="trending"
                          getItemLogoUrl={getItemLogoUrl}
                        />
                        <span className="text-white text-[15px] font-normal truncate">
                          {cleanUrl}
                        </span>
                        <TrendingUp className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};
