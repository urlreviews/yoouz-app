import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Clock, TrendingUp, X, AlertCircle, Building2, CheckCircle, MapPin, Globe, Loader2 } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoSearchView } from "./CopoSearchView";
import { CopoLocationSearchBar } from "./CopoLocationSearchBar";
import { useLanguage } from "../i18n/LanguageContext";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { extractCleanDomain, isValidDomainUrl, getCleanDomainUrl, isPlaceReviewMatch, formatBusinessName, KNOWN_OFFICIAL_NAMES, KNOWN_LOCATIONS, isGenericPlaceName } from "../utils/placeUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { queryGoogleCseForUrl } from "../utils/googleCse";
import { searchCitySuggestions, CitySuggestion } from "../utils/locationSearchHelper";

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchErrorNotification, setSearchErrorNotification] = useState<string | null>(null);
  const [showLocationBar, setShowLocationBar] = useState(false);
  const [isFocusedLocation, setIsFocusedLocation] = useState(false);
  const businessInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([]);

  const mobileCitySuggestions = React.useMemo(() => {
    if (!location.trim()) return [];
    return searchCitySuggestions(location, 6);
  }, [location]);

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
          const list = data.suggestions || [];
          setLiveSuggestions(list);
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
      setLiveSuggestions([]);
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
    
    // Clean query to remove obvious typos and junk that breaks Google search
    const cleanRaw = raw.trim()
      .replace(/brussles/gi, "brussels")
      .replace(/restuarant/gi, "restaurant")
      .replace(/airlin\s/gi, "airline ")
      .trim();

    setIsSearching(true);
    const trimmed = cleanRaw;
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

    // 0ms Fast Path: Check if live suggestions already resolved a clean domain while typing
    if (!isValidDomainUrl(cleanUrl) && liveSuggestions && liveSuggestions.length > 0) {
      const qLower = trimmed.toLowerCase();
      const matchInSuggest = liveSuggestions.find(s => {
        const sDom = s.domain ? extractCleanDomain(s.domain) : "";
        const sTitle = (s.title || s.name || "").toLowerCase().trim();
        if (!sDom && !sTitle) return false;

        const domMatches = isValidDomainUrl(sDom) && (
          sDom === qLower || 
          sDom.startsWith(qLower) || 
          qLower.startsWith(sDom) || 
          sDom.split('.')[0] === qLower ||
          sDom.split('.')[0].startsWith(qLower)
        );
        const titleMatches = sTitle && (
          sTitle === qLower || 
          sTitle.startsWith(qLower) || 
          qLower.startsWith(sTitle) ||
          sTitle.includes(qLower)
        );
        return domMatches || (isValidDomainUrl(sDom) && titleMatches);
      }) || (liveSuggestions[0]?.domain ? liveSuggestions[0] : null);

      if (matchInSuggest?.domain) {
        cleanUrl = extractCleanDomain(matchInSuggest.domain);
        console.info("[Search Mobile] Resolved instantly from pre-fetched suggestions:", cleanUrl);
      }
    }

    // Direct official business resolution via fast DuckDuckGo backend path
    if (!isValidDomainUrl(cleanUrl)) {
      console.info("[Search Mobile] Resolving official domain via fast DuckDuckGo path for:", trimmed);
      
      try {
        const backendResp = await fetch(`/api/url-metadata?q=${encodeURIComponent(trimmed)}&resolveOnly=true`, {
          signal: AbortSignal.timeout(7000)
        });
        if (backendResp.ok) {
          const data = await backendResp.json();
          if (data && data.domain && isValidDomainUrl(data.domain)) {
            cleanUrl = data.domain;
            console.info("[Search Mobile] Backend search successfully resolved domain:", cleanUrl);
          }
        }
      } catch (bErr) {
        console.warn("[Search Mobile] Backend search error:", bErr);
      }
    }

    if (!isValidDomainUrl(cleanUrl)) {
      console.warn("[Search Mobile] No official website domain found. Halting search to prevent creating fake profiles.");
      setIsSearching(false);
      setSearchErrorNotification(`No official website could be found for "${trimmed}". Please check the name or enter their official domain.`);
      setTimeout(() => setSearchErrorNotification(null), 5000);
      return;
    }
    setSearchErrorNotification(null);
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
              openingHours: data.openingHours || optimisticPlace.openingHours || "",
              locations: (data.locations && data.locations.length > 0) ? data.locations : (optimisticPlace.locations || []),
              bannerUrl: isValidBanner ? data.image : optimisticPlace.bannerUrl,
              ogImage: isValidBanner ? data.image : optimisticPlace.ogImage,
              logoUrl: isValidLogo ? data.logo : optimisticPlace.logoUrl,
              avatarUrl: isValidLogo ? data.logo : optimisticPlace.avatarUrl,
              website: data.url || optimisticPlace.website || (data.domain ? `https://${data.domain}` : ""),
              brandDomain: data.domain || optimisticPlace.brandDomain || (data.url ? extractCleanDomain(data.url) : ""),
              description: data.description || optimisticPlace.description
            });
          }
        })
        .catch(() => {});
    }

    setIsSearching(false);
    setSubmittedQuery(trimmed);
  };

  const executeSearch = (
    targetQuery?: string, 
    preferredName?: string,
    locationDetails?: { country?: string; state?: string; city?: string; rawBusinessName?: string; rawLocation?: string }
  ) => {
    const rawBiz = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!rawBiz) return;

    businessInputRef.current?.blur();
    locationInputRef.current?.blur();

    const loc = (locationDetails?.city || location).trim();
    const finalQ = loc ? `${rawBiz} ${loc}` : rawBiz;

    // Strict Rule: ONLY open the place profile drawer if location was explicitly provided by the user!
    if (loc) {
      // 0ms Check 1: Authoritative matching place in local places list
      const matchedPlace = findMatchingPlace(rawBiz, preferredName || rawBiz);
      if (matchedPlace) {
        onOpenPlace(matchedPlace.id);
        return;
      }

      // 0ms Check 2: Check pre-fetched suggestions in memory strictly
      const topMatch = mergedSuggestions.find(s => {
        const sTitle = (s.title || s.name || "").toLowerCase().trim();
        const sDom = (s.domain || "").toLowerCase().trim();
        const qLower = rawBiz.toLowerCase().trim();
        if (!qLower) return false;
        const domMatches = sDom && (sDom === qLower || sDom.startsWith(qLower) || sDom.split('.')[0] === qLower);
        const titleMatches = sTitle && (sTitle === qLower || sTitle.startsWith(qLower));
        return domMatches || titleMatches;
      });

      if (topMatch) {
        handleSelectSuggestion(topMatch);
        return;
      }
    }

    // Direct transition to background search results view
    setSubmittedQuery(finalQ);
  };

  const handleSelectSuggestion = async (item: any) => {
    businessInputRef.current?.blur();
    locationInputRef.current?.blur();

    let rawDom = item.domain || (typeof item === 'string' ? item : (item.brandDomain || item.website || ""));
    let cleanDom = isValidDomainUrl(rawDom) ? extractCleanDomain(rawDom) : "";
    const title = item.title || item.name || cleanDom || query;
    const loc = location.trim();

    if (!cleanDom && title) {
      const tLower = title.toLowerCase().trim();
      for (const [domKey, nameVal] of Object.entries(KNOWN_OFFICIAL_NAMES)) {
        if (nameVal.toLowerCase() === tLower || domKey.toLowerCase() === tLower) {
          if (domKey.includes('.')) {
            cleanDom = domKey;
            break;
          }
        }
      }
    }

    // 1. Check if place already matches in places list
    const existing = findMatchingPlace(cleanDom || title, title);
    if (existing) {
      const storeTerm = getCleanDomainUrl(existing) || cleanDom || title;
      if (storeTerm) {
        const newRecent = [storeTerm, ...recentSearches.filter(s => s && s !== storeTerm)].slice(0, 10);
        setRecentSearches(newRecent);
        try {
          localStorage.setItem("yoouz_recent_searches", JSON.stringify(newRecent));
        } catch {}
      }
      onOpenPlace(existing.id);
      return;
    }

    // 2. If the tapped suggestion does not have a pre-resolved official domain yet, execute the search immediately!
    if (!cleanDom || !isValidDomainUrl(cleanDom)) {
      console.info("[Search Mobile] Suggestion tapped without pre-resolved domain. Executing search immediately for:", title);
      setQuery(title);
      handleSearch(title, title);
      return;
    }

    const placeId = cleanDom.toLowerCase();
    const knownHead = KNOWN_LOCATIONS[cleanDom] || KNOWN_LOCATIONS[cleanDom.split('.')[0]];
    const instantLogo = item.logoUrl || (knownHead?.bannerUrl ? knownHead.bannerUrl : null) || (cleanDom ? getCleanLogoUrl(null, cleanDom) : "") || (cleanDom ? `/api/favicon?domain=${cleanDom}` : "");
    const instantName = knownHead?.name || (cleanDom && KNOWN_OFFICIAL_NAMES[cleanDom]) || title || (cleanDom ? formatBusinessName(cleanDom) : query);

    const storeTerm = cleanDom || title;
    const newRecent = [storeTerm, ...recentSearches.filter(s => s && s !== storeTerm)].slice(0, 10);
    setRecentSearches(newRecent);
    try {
      localStorage.setItem("yoouz_recent_searches", JSON.stringify(newRecent));
    } catch {}

    const newPlace: Place = {
      id: placeId,
      name: instantName,
      category: knownHead?.category || item.category || "Verified Business",
      categoryType: "all",
      address: knownHead?.address || item.address || "",
      city: knownHead?.city || loc || "",
      country: knownHead?.country || "",
      lat: knownHead?.lat || 0,
      lng: knownHead?.lng || 0,
      rating: knownHead?.rating || 5,
      totalReviews: knownHead?.totalReviews || 1,
      ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
      avatarUrl: instantLogo,
      logoUrl: instantLogo,
      bannerUrl: knownHead?.bannerUrl || "",
      ogImage: knownHead?.bannerUrl || "",
      photos: knownHead?.photos || [],
      openingHours: knownHead?.openingHours || "Available 24/7",
      isOpen: true,
      phone: knownHead?.phone || "",
      email: knownHead?.email || "",
      website: cleanDom ? `https://${cleanDom}` : "",
      priceRange: knownHead?.priceRange || "N/A",
      plusCode: "",
      description: knownHead?.description || "",
      popularKeywords: [],
      amenities: knownHead?.amenities || [],
      topDishes: [],
      brandDomain: cleanDom || undefined
    };

    if (onAddPlace) {
      onAddPlace(newPlace);
    }
    onOpenPlace(placeId);

    // Asynchronously fetch and enrich metadata from backend
    const enrichEndpoint = cleanDom 
      ? `/api/url-metadata?url=${encodeURIComponent(cleanDom)}`
      : `/api/url-metadata?q=${encodeURIComponent(title)}`;

    fetch(enrichEndpoint, { signal: AbortSignal.timeout(8000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && onAddPlace) {
          const isValidLogo = data.logo && !data.logo.includes("tap/0.png") && !data.logo.includes("icons/tap") && !data.logo.startsWith("data:;");
          const isValidBanner = data.image && !data.image.includes("unsplash.com") && !data.image.includes("placeholder");
          onAddPlace({
            ...newPlace,
            name: (data.siteName && !data.siteName.toLowerCase().includes("hostinger")) ? data.siteName : (data.title || newPlace.name),
            category: (data.category && data.category !== "Website") ? data.category : newPlace.category,
            address: (data.address && !data.address.startsWith("http")) ? data.address : newPlace.address,
            city: data.city || newPlace.city,
            country: data.country || newPlace.country,
            phone: data.phone || newPlace.phone,
            email: data.email || newPlace.email,
            bannerUrl: isValidBanner ? data.image : newPlace.bannerUrl,
            ogImage: isValidBanner ? data.image : newPlace.ogImage,
            logoUrl: isValidLogo ? data.logo : newPlace.logoUrl,
            avatarUrl: isValidLogo ? data.logo : newPlace.avatarUrl,
            website: data.url || newPlace.website || (data.domain ? `https://${data.domain}` : ""),
            brandDomain: data.domain || newPlace.brandDomain || (data.url ? extractCleanDomain(data.url) : undefined),
            description: data.description || newPlace.description,
            photos: data.image ? Array.from(new Set([data.image, ...(newPlace.photos || [])])) : newPlace.photos
          });
        }
      })
      .catch(() => {});
  };
  
  // Calculate real trending places mapped to clean items
  const trending = React.useMemo(() => {
    return [...places]
      .map(p => {
        const count = videos.filter(v => isPlaceReviewMatch(v, p)).length;
        return { place: p, count };
      })
      .sort((a, b) => b.count - a.count)
      .map(item => item.place)
      .filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx)
      .slice(0, 8);
  }, [places, videos]);
  
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
      
      {/* Top Search Header - Clean Single Bar iOS Style */}
      <div className="w-full pt-[max(12px,env(safe-area-inset-top))] px-3 pb-3 sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 shadow-md">
        <div className="w-full flex items-center gap-2.5">
          <div className="flex-1 h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 flex items-center gap-2.5 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-white/10 transition-all shadow-inner">
            {isSearching ? (
              <Loader2 className="w-4.5 h-4.5 text-amber-400 animate-spin shrink-0" />
            ) : (
              <Search className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
            )}
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

          <button 
            type="button"
            onClick={handleBack}
            className="text-zinc-300 hover:text-white active:scale-95 font-medium text-[15px] px-1.5 py-2 transition-colors cursor-pointer shrink-0"
          >
            {submittedQuery ? "Back" : "Cancel"}
          </button>
        </div>

        {searchErrorNotification && (
          <div className="px-4 pb-2">
            <div className="p-2.5 bg-red-950/70 border border-red-500/30 rounded-xl text-red-200 text-xs text-center animate-in fade-in slide-in-from-top-1">
              {searchErrorNotification}
            </div>
          </div>
        )}
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
        ) : isSearching ? (
          <div className="flex-1" />
        ) : (
          <div className="p-3 sm:p-4 flex flex-col gap-6">

            {/* Business Autocomplete Suggestions */}
            {query.length > 0 && mergedSuggestions.length > 0 && (
              <div className="flex flex-col divide-y divide-zinc-900/90 rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden shadow-xl">
                {mergedSuggestions.map((item, idx) => {
                  const rawDomain = item.domain || (typeof item === 'string' ? item : (item.brandDomain || item.website || ""));
                  let targetDomain = getCleanDomainUrl(item) || (isValidDomainUrl(rawDomain) ? extractCleanDomain(rawDomain) : "");
                  const title = item.title || item.name || (targetDomain ? formatBusinessName(targetDomain) : query);
                  const hasDomain = Boolean(targetDomain && targetDomain.includes('.') && isValidDomainUrl(targetDomain));
                  const itemLogo = item.logoUrl || (hasDomain ? getItemLogoUrl(targetDomain, item) : null);

                  const words = title.trim().split(/\s+/);
                  const allExceptLast = words.length > 1 ? words.slice(0, -1).join(" ") : "";
                  const lastWord = words.length > 1 ? words[words.length - 1] : title.trim();

                  return (
                    <button 
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      className="flex items-center gap-3.5 p-3.5 text-left cursor-pointer hover:bg-zinc-900/90 active:bg-zinc-850 transition-colors w-full group border-b border-zinc-900/80 last:border-0"
                    >
                      {hasDomain ? (
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
                        <div className="flex items-center gap-1.5 overflow-hidden" dir="auto">
                          <span className="text-white text-[16px] font-bold tracking-tight truncate leading-snug group-hover:text-amber-300 transition-colors">
                            {title}
                          </span>
                          <CheckCircle className="w-4 h-4 fill-white text-zinc-950 shrink-0" />
                        </div>
                        {hasDomain ? (
                          <div className="text-xs text-zinc-400 truncate mt-0.5 font-medium font-mono">
                            {targetDomain.toLowerCase()}
                          </div>
                        ) : null}
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
                <div className="flex flex-col divide-y divide-zinc-900/60">
                  {recentSearches.map((s, idx) => {
                    const place = findMatchingPlace(s);
                    const cleanUrl = getCleanDomainUrl(place || s) || (isValidDomainUrl(s) ? extractCleanDomain(s) : "");
                    const title = place?.name 
                      || (cleanUrl && KNOWN_OFFICIAL_NAMES[cleanUrl]) 
                      || (cleanUrl ? formatBusinessName(cleanUrl) : s);

                    return (
                      <button 
                        key={idx}
                        onClick={() => {
                          if (place) {
                            onOpenPlace(place.id);
                          } else {
                            handleSelectSuggestion({
                              title,
                              domain: cleanUrl
                            });
                          }
                        }}
                        className="flex items-center gap-3.5 py-3 text-left cursor-pointer hover:bg-zinc-900 active:bg-zinc-850 px-2 rounded-xl transition-colors group"
                      >
                        <SearchBusinessBadge 
                          term={cleanUrl || title}
                          place={place}
                          iconType="clock"
                          getItemLogoUrl={getItemLogoUrl}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-white text-[15px] font-bold tracking-tight truncate group-hover:text-amber-300 transition-colors" dir="auto">
                            {title}
                          </div>
                          {cleanUrl ? (
                            <div className="text-xs text-zinc-400 truncate mt-0.5 font-medium font-mono">
                              {cleanUrl}
                            </div>
                          ) : null}
                        </div>
                        <Clock className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
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
                <div className="flex flex-col divide-y divide-zinc-900/60">
                  {trending.map((place, idx) => {
                    const cleanUrl = getCleanDomainUrl(place);
                    const title = place.name 
                      || (cleanUrl && KNOWN_OFFICIAL_NAMES[cleanUrl]) 
                      || (cleanUrl ? formatBusinessName(cleanUrl) : "Business");

                    return (
                      <button 
                        key={idx}
                        onClick={() => onOpenPlace(place.id)}
                        className="flex items-center gap-3.5 py-3 text-left cursor-pointer hover:bg-zinc-900 active:bg-zinc-850 px-2 rounded-xl transition-colors group"
                      >
                        <SearchBusinessBadge 
                          term={cleanUrl || title}
                          place={place}
                          iconType="trending"
                          getItemLogoUrl={getItemLogoUrl}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-white text-[15px] font-bold tracking-tight truncate group-hover:text-amber-300 transition-colors" dir="auto">
                            {title}
                          </div>
                          {cleanUrl ? (
                            <div className="text-xs text-zinc-400 truncate mt-0.5 font-medium font-mono">
                              {cleanUrl}
                            </div>
                          ) : null}
                        </div>
                        <TrendingUp className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
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
