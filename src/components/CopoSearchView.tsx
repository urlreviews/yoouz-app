import React, { useState, useEffect, useRef } from "react";
import { Search, Globe, Loader2, Play, Video, Star, CheckCircle, MapPin, Building2, Phone, Mail, Clock, ExternalLink, Sparkles } from "lucide-react";
import { Place, VideoReview } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl, KNOWN_BRAND_BANNERS, getDomainBrandGradient, getProxiedImageUrl } from "../utils/logoUtils";
import { isPlaceReviewMatch, formatBusinessName, extractCleanDomain, isValidDomainUrl, getCleanDomainUrl, getDisplayUrlAsDomain, KNOWN_OFFICIAL_NAMES, KNOWN_LOCATIONS, isGenericPlaceName, getEffectivePlaceDescription } from "../utils/placeUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoLocationSearchBar } from "./CopoLocationSearchBar";
import { useLanguage } from "../i18n/LanguageContext";
import { queryGoogleCseForUrl } from "../utils/googleCse";

interface CopoSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  savedPlaceIds?: string[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onToggleGrabPlace?: (place: Place) => void;
  isMobileModal?: boolean;
  initialQuery?: string;
  hideSearchBar?: boolean;
}

export const CopoSearchView: React.FC<CopoSearchViewProps> = ({
  places,
  videos,
  onSelectVideo,
  onOpenPlace,
  onRecordForPlace,
  onAddPlace,
  isMobileModal = false,
  initialQuery = "",
  hideSearchBar = false
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [searchedPlace, setSearchedPlace] = useState<Place | null>(null);
  const searchRequestIdRef = useRef(0);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(undefined, initialQuery);
    }
  }, [initialQuery]);

  // Live Auto-Suggest debounce with 0ms instant local database preview
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoadingSuggest(false);
      setShowDropdown(false);
      setSearchedPlace(null);
      return;
    }

    // 0ms instant local DB match
    const qLow = trimmed.toLowerCase();
    const localMatches = places
      .filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pDom = (p.brandDomain || p.website || p.id || '').toLowerCase();
        return pName.includes(qLow) || pDom.includes(qLow);
      })
      .slice(0, 4)
      .map(p => {
        const dom = extractCleanDomain(p.brandDomain || p.website || p.id) || "";
        const hasDot = dom.includes('.');
        return {
          id: p.id,
          title: p.name || dom,
          domain: hasDot ? dom : "",
          logoUrl: p.logoUrl || (hasDot ? `/api/favicon?domain=${dom}` : ""),
          category: (p.category && !p.category.toLowerCase().includes("verified") && !p.category.toLowerCase().includes("google")) ? p.category : "",
          address: p.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : (p.city || ""),
          source: "database"
        };
      });

    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setShowDropdown(true);
    }

    setIsLoadingSuggest(true);
    setShowDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}`);
        if (resp.ok) {
          const data = await resp.json();
          const serverList = data.suggestions || [];
          const seen = new Set<string>();
          const merged = [];
          for (const item of [...localMatches, ...serverList]) {
            const key = (item.id || item.domain || item.title).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }
          setSuggestions(merged.slice(0, 8));
        }
      } catch (err) {
      } finally {
        setIsLoadingSuggest(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, places]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pre-load Google CSE elements statically on mount for warm start and sub-second resolution
  useEffect(() => {
    let container = document.getElementById("yoouz-hidden-cse-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "yoouz-hidden-cse-container";
      container.className = "opacity-0 pointer-events-none fixed";
      container.style.cssText = "top: -9999px; left: -9999px; width: 400px; height: 400px; overflow: hidden; z-index: -9999;";
      
      const searchDiv = document.createElement("div");
      searchDiv.className = "gcse-search";
      
      container.appendChild(searchDiv);
      document.body.appendChild(container);
    }

    if (!document.querySelector('script[src*="cse.google.com"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://cse.google.com/cse.js?cx=e41632212e69a4efd";
      document.head.appendChild(script);
    }
  }, []);

  const handleSelectSuggestion = (item: any) => {
    setShowDropdown(false);
    
    // 1. Check if it matches a complete local database place first for INSTANT 0ms resolution
    const match = places.find(p => {
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      const itemDom = extractCleanDomain(item.domain || item.id || item.title);
      const hasReviews = (p.totalReviews || 0) > 0 || (p.reviews && p.reviews.length > 0);
      const isComplete = Boolean(p.address && p.phone && p.bannerUrl);
      return ((pDom && itemDom && pDom === itemDom) || p.id === item.id) && (hasReviews || isComplete);
    });

    if (match) {
      console.info("[Search] Loading complete local database match instantly:", match.name);
      setSearchedPlace(match);
      setQuery(match.name || item.title);
      if (onOpenPlace) onOpenPlace(match.id);
      return;
    }

    const targetQuery = (item.domain && isValidDomainUrl(item.domain)) ? item.domain : (item.title || query);
    handleSearch(undefined, targetQuery, item.title, {
      country: item.country,
      city: item.city,
      rawBusinessName: item.title
    });
  };

  const handleSearch = async (
    e?: React.FormEvent,
    overrideQuery?: string,
    preferredName?: string,
    locationDetails?: { country?: string; state?: string; city?: string; rawBusinessName?: string }
  ) => {
    if (e) e.preventDefault();
    const rawQuery = (overrideQuery || query).trim();
    if (!rawQuery) return;

    setShowDropdown(false);
    
    // Instantly clear searched place and suggestions to purge previous search artifacts!
    setSearchedPlace(null);
    setSuggestions([]);

    const currentRequestId = ++searchRequestIdRef.current;

    const baseName = (locationDetails?.rawBusinessName || preferredName || rawQuery).trim();
    const cleanUrlFromRaw = extractCleanDomain(rawQuery);
    const cleanUrlFromBase = extractCleanDomain(baseName);
    let cleanUrl = isValidDomainUrl(cleanUrlFromRaw) ? cleanUrlFromRaw : (isValidDomainUrl(cleanUrlFromBase) ? cleanUrlFromBase : "");

    // 1. Only accept a local match if:
    // a) cleanUrl is an exact domain (e.g. apple.com) that matches p.brandDomain or p.website, OR
    // b) The place is a verified official brand in KNOWN_OFFICIAL_NAMES, OR
    // c) The place has authentic reviews (> 0 reviews) and a verified website.
    // Stale/synthetic unreviewed records must NOT bypass Google CSE!
    const matchingLocal = places.find(p => {
      if (!p) return false;
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      const isRealDom = isValidDomainUrl(pDom);
      const pReviews = (p.totalReviews || 0) > 0 || (p.reviews && p.reviews.length > 0);
      
      if (cleanUrl && pDom === cleanUrl && isRealDom) return true;
      if (cleanUrl && p.id.toLowerCase() === cleanUrl.replace(/[^a-z0-9]/g, "-") && isRealDom) return true;
      
      const pNameLower = (p.name || "").toLowerCase().trim();
      const baseLower = baseName.toLowerCase();
      const rawLower = rawQuery.toLowerCase();
      
      const isKnownBrand = Boolean(
        (pDom && KNOWN_OFFICIAL_NAMES[pDom]) ||
        (pNameLower && KNOWN_OFFICIAL_NAMES[pNameLower])
      );
      
      if (isKnownBrand && (pNameLower === baseLower || pNameLower === rawLower)) {
        return true;
      }
      
      if (pReviews && isRealDom && (pNameLower === baseLower || pNameLower === rawLower)) {
        return true;
      }
      
      return false;
    });

    if (matchingLocal) {
      if (currentRequestId !== searchRequestIdRef.current) return;
      console.info("[Search] Found authoritative local place match:", matchingLocal.name);
      setSearchedPlace(matchingLocal);
      setQuery(matchingLocal.name || baseName);
      setIsSearching(false);
      if (onOpenPlace) {
        onOpenPlace(matchingLocal.id);
      }
      return;
    }

    // If not a domain with a dot, check known brands (EXACT match only)
    if (!isValidDomainUrl(cleanUrl)) {
      const brandMatch = Object.entries(KNOWN_OFFICIAL_NAMES).find(([k, v]) => {
        if (!k.includes('.')) return false;
        const qL = baseName.toLowerCase().trim();
        const vL = v.toLowerCase().trim();
        const kL = k.toLowerCase().trim();
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

    let preloadedMeta: any = null;

    // 0ms Fast Path: Check if suggestions already resolved a clean domain or matching place while typing
    if (!isValidDomainUrl(cleanUrl) && suggestions && suggestions.length > 0) {
      const qLower = baseName.toLowerCase().trim();
      const matchInSuggest = suggestions.find(s => {
        const sDom = s.domain ? extractCleanDomain(s.domain) : "";
        const sTitle = (s.title || "").toLowerCase().trim();
        if (!sDom && !sTitle) return false;
        const domMatches = isValidDomainUrl(sDom) && (
          sDom === qLower || 
          sDom.startsWith(qLower) || 
          qLower.startsWith(sDom) || 
          sDom.split('.')[0] === qLower
        );
        const titleMatches = sTitle && (
          sTitle === qLower || 
          sTitle.startsWith(qLower) || 
          qLower.startsWith(sTitle)
        );
        return domMatches || (isValidDomainUrl(sDom) && titleMatches);
      });
      if (matchInSuggest) {
        if (matchInSuggest.domain && isValidDomainUrl(extractCleanDomain(matchInSuggest.domain))) {
          cleanUrl = extractCleanDomain(matchInSuggest.domain);
        }
        if (!preloadedMeta) {
          preloadedMeta = {
            title: matchInSuggest.title,
            domain: cleanUrl,
            logo: matchInSuggest.logoUrl,
            category: matchInSuggest.category,
            address: matchInSuggest.address
          };
        }
        console.info("[Search] Resolved instantly from pre-fetched suggestions:", cleanUrl || matchInSuggest.title);
      }
    }

    if (!isValidDomainUrl(cleanUrl)) {
      setIsSearching(true);
      console.info("[Search] Fast parallel resolution for:", rawQuery);
      
      const csePromise = queryGoogleCseForUrl(rawQuery)
        .then(url => {
          if (!url) return null;
          const dom = extractCleanDomain(url);
          return (isValidDomainUrl(dom) && !dom.toLowerCase().includes('wikipedia.org')) ? dom : null;
        })
        .catch(() => null);

      const backendPromise = fetch(`/api/url-metadata?q=${encodeURIComponent(rawQuery)}`)
        .then(r => r.ok ? r.json() : null)
        .then(meta => {
          if (meta) preloadedMeta = meta;
          const dom = meta?.domain ? extractCleanDomain(meta.domain) : "";
          return (isValidDomainUrl(dom) && !dom.toLowerCase().includes('wikipedia.org')) ? dom : null;
        })
        .catch(() => null);

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));

      const winner = await Promise.race([
        Promise.any([csePromise, backendPromise]).catch(() => null),
        timeoutPromise
      ]);

      if (currentRequestId !== searchRequestIdRef.current) return;

      if (winner && isValidDomainUrl(winner)) {
        cleanUrl = winner;
      }
    }

    if (currentRequestId !== searchRequestIdRef.current) return;

    // STRICT POLICY: Do not open "fake" profiles without a verified official domain.
    if (!isValidDomainUrl(cleanUrl)) {
      console.warn("[Search] No official domain discovered for:", rawQuery);
      setIsSearching(false);
      return;
    }

    setQuery(baseName || rawQuery);
    setIsSearching(true);

    try {
      const domain = cleanUrl || (baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-\.\u0590-\u05FF]/g, '') || "business");
      const isRealDomain = isValidDomainUrl(cleanUrl);

      const isMetaMatchingCurrent = Boolean(
        preloadedMeta && (
          (isRealDomain && preloadedMeta.domain && extractCleanDomain(preloadedMeta.domain) === cleanUrl) ||
          (preloadedMeta.title && baseName && preloadedMeta.title.toLowerCase().includes(baseName.toLowerCase()))
        )
      );

      // Instant place object - strictly scoped to current query domain to prevent cross-search leakage
      const instantLogo: string = (isRealDomain ? getCleanLogoUrl(null, cleanUrl) : "") 
        || (isRealDomain ? `/api/favicon?domain=${cleanUrl}` : "")
        || (isMetaMatchingCurrent && preloadedMeta?.logo && !preloadedMeta.logo.includes('brandfetch') && !preloadedMeta.logo.startsWith('data:;') ? preloadedMeta.logo : "");
      const instantBanner: string = (isRealDomain && KNOWN_BRAND_BANNERS[cleanUrl] ? KNOWN_BRAND_BANNERS[cleanUrl] : "") 
        || (isMetaMatchingCurrent && preloadedMeta?.image && !preloadedMeta.image.includes('unsplash.com') ? preloadedMeta.image : "") 
        || "";
      const instantName = preferredName
        || locationDetails?.rawBusinessName
        || (isRealDomain && KNOWN_OFFICIAL_NAMES[cleanUrl]) 
        || (isMetaMatchingCurrent && (preloadedMeta?.title || preloadedMeta?.siteName))
        || formatBusinessName(baseName, isRealDomain ? cleanUrl : undefined)
        || baseName
        || rawQuery;

      const instantCity = locationDetails?.city || (isMetaMatchingCurrent ? preloadedMeta?.city : "") || (isRealDomain ? "Online" : "");
      const instantCountry = locationDetails?.country || (isMetaMatchingCurrent ? preloadedMeta?.country : "") || "";

      const instantPlace: Place = {
        id: isRealDomain ? cleanUrl : domain,
        name: instantName,
        category: (preloadedMeta?.category && !preloadedMeta.category.toLowerCase().includes("verified")) ? preloadedMeta.category : "Website",
        categoryType: "all",
        address: preloadedMeta?.address || (instantCity ? `${instantCity}${instantCountry ? ', ' + instantCountry : ''}` : ""),
        city: instantCity,
        country: instantCountry,
        lat: preloadedMeta?.lat || 0,
        lng: preloadedMeta?.lng || 0,
        rating: 5,
        totalReviews: 1,
        ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
        avatarUrl: instantLogo,
        logoUrl: instantLogo,
        bannerUrl: instantBanner,
        ogImage: instantBanner,
        photos: instantBanner ? [instantBanner] : [],
        openingHours: preloadedMeta?.openingHours || "Available 24/7",
        isOpen: true,
        phone: preloadedMeta?.phone || "",
        website: (preloadedMeta?.url && isValidDomainUrl(preloadedMeta.url) && !preloadedMeta.url.toLowerCase().includes('wikipedia.org')) ? preloadedMeta.url : (isRealDomain && !cleanUrl.toLowerCase().includes('wikipedia.org') ? `https://${cleanUrl}` : ""),
        priceRange: "N/A",
        plusCode: "",
        description: preloadedMeta?.description || "",
        popularKeywords: [],
        amenities: [],
        topDishes: [],
        brandDomain: isRealDomain ? cleanUrl : (preloadedMeta?.domain || "")
      };

      if (currentRequestId !== searchRequestIdRef.current) return;

      let currentPlace: Place = instantPlace;
      setSearchedPlace(currentPlace);
      if (onAddPlace) {
        onAddPlace(currentPlace);
      }
      if (onOpenPlace) {
        onOpenPlace(currentPlace.id);
      }
      
      // 3. Enrich in the background from backend /api/url-metadata to ensure fresh logo/banner/meta/address/phone/hours
      setIsEnriching(true);
      try {
         const queryParam = isRealDomain ? `url=${encodeURIComponent(cleanUrl)}` : `q=${encodeURIComponent(rawQuery)}`;
         const resp = await fetch(`/api/url-metadata?${queryParam}`);
         if (currentRequestId !== searchRequestIdRef.current) return;
         if (resp.ok) {
           const data = await resp.json();
           if (currentRequestId !== searchRequestIdRef.current) return;
           if (data.title || data.domain) {
             const isValidLogo = (l?: string | null): boolean => {
               if (!l || typeof l !== "string") return false;
               if (l.startsWith("data:;") || l.includes("brandfetch.io")) return false;
               return true;
             };

             const discoveredDom = (data.domain && isValidDomainUrl(data.domain) && !data.domain.includes('wikipedia.org')) ? data.domain : (isRealDomain ? cleanUrl : "");
             const domainCleanLogo = discoveredDom ? getCleanLogoUrl(null, discoveredDom) : null;
             const fetchedLogo = isValidLogo(data.logo) 
               ? data.logo 
               : (domainCleanLogo || (discoveredDom ? `/api/favicon?domain=${discoveredDom}` : "") || instantLogo);

             const fetchedBanner = (data.image && !data.image.includes("unsplash.com")) 
               ? data.image 
               : (instantBanner && !instantBanner.includes("unsplash.com") ? instantBanner : "");
             
             const targetName = preferredName
               || locationDetails?.rawBusinessName
               || (discoveredDom && KNOWN_OFFICIAL_NAMES[discoveredDom])
               || (data.domain && KNOWN_OFFICIAL_NAMES[data.domain])
               || (!isGenericPlaceName(currentPlace.name) ? currentPlace.name : "")
               || formatBusinessName(data.siteName || data.title, data.domain || discoveredDom)
               || formatBusinessName(discoveredDom)
               || instantName;

             const updatedPlace: Place = {
               ...currentPlace,
               id: discoveredDom || currentPlace.id,
               brandDomain: discoveredDom || "",
               website: (data.url && isValidDomainUrl(data.url) && !data.url.includes('wikipedia.org')) 
                 ? data.url 
                 : (discoveredDom ? `https://${discoveredDom}` : ""),
               name: targetName || currentPlace.name,
               logoUrl: fetchedLogo || instantLogo,
               avatarUrl: fetchedLogo || instantLogo,
               bannerUrl: (fetchedBanner && !fetchedBanner.includes("unsplash.com")) ? fetchedBanner : ((instantBanner && !instantBanner.includes("unsplash.com")) ? instantBanner : ""),
               ogImage: (fetchedBanner && !fetchedBanner.includes("unsplash.com")) ? fetchedBanner : ((instantBanner && !instantBanner.includes("unsplash.com")) ? instantBanner : ""),
               photos: fetchedBanner ? [fetchedBanner] : (instantBanner ? [instantBanner] : []),
               description: currentPlace.description || data.description || "",
               category: (currentPlace.category && currentPlace.category !== "Website" && currentPlace.category !== "General") ? currentPlace.category : (data.category || currentPlace.category || "Website"),
               address: (data.address && (!currentPlace.address || currentPlace.address === "Verified Location" || currentPlace.address.startsWith("http"))) ? data.address : (currentPlace.address || data.address || ""),
               city: locationDetails?.city || ((currentPlace.city && currentPlace.city !== "Online" && currentPlace.city !== "Worldwide") ? currentPlace.city : (data.city || currentPlace.city || "")),
               country: locationDetails?.country || currentPlace.country || data.country || "",
               phone: currentPlace.phone || data.phone || "",
               email: currentPlace.email || data.email || "",
               openingHours: data.openingHours || currentPlace.openingHours || (data.hours || currentPlace.hours || "Available 24/7"),
               hours: data.openingHours || currentPlace.openingHours || (data.hours || currentPlace.hours || "Available 24/7"),
               locations: (data.locations && data.locations.length > 0) ? data.locations : (currentPlace.locations || [])
             };
             currentPlace = updatedPlace; if (currentRequestId !== searchRequestIdRef.current) return;
             setSearchedPlace(updatedPlace);
             if (onAddPlace) {
               onAddPlace(updatedPlace);
             }
             if (discoveredDom && onOpenPlace) {
               onOpenPlace(discoveredDom);
             }
           }
         }
      } catch (err) {
         console.warn("Metadata fetch error:", err);
      } finally {
         if (currentRequestId === searchRequestIdRef.current) setIsEnriching(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (currentRequestId === searchRequestIdRef.current) setIsSearching(false);
    }
  };

  const handleFeelingLucky = () => {
    const popularWebsites = [
      "booking.com",
      "apple.com",
      "google.com",
      "airbnb.com"
    ];

    const availableDomains = places.length > 0
      ? (places.map(p => p.brandDomain || p.website?.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")).filter(Boolean) as string[])
      : [];

    const combined = Array.from(new Set([...availableDomains, ...popularWebsites]));
    const randomDomain = combined[Math.floor(Math.random() * combined.length)];

    setQuery(randomDomain);
    handleSearch(undefined, randomDomain);
  };

  const placeVideos = searchedPlace 
    ? videos.filter(v => isPlaceReviewMatch(v, searchedPlace)) 
    : [];

  const averageRating = placeVideos.length > 0
    ? placeVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / placeVideos.length
    : (searchedPlace?.rating || 5.0);
  const totalReviewsCount = placeVideos.length;

  return (
    <div className={`flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 text-white flex flex-col items-center select-none ${isMobileModal ? 'p-4 pt-2 pb-[calc(env(safe-area-inset-bottom,16px))]' : 'p-6 pt-8 md:pt-12 pb-[calc(env(safe-area-inset-bottom,16px)+88px)]'}`}>
      {!searchedPlace ? (
        <div className={`w-full max-w-xl flex flex-col items-center animate-in fade-in zoom-in duration-500 ${isMobileModal ? 'mt-2' : 'mt-4 md:mt-8'}`}>
          {/* Title & Subtitle */}
          {!isMobileModal && (
            <>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight text-center mb-3">
                {t("search.title", "Review Any Business")}
              </h1>
              
              <p className="text-zinc-400 text-sm md:text-base text-center max-w-md mb-8 leading-relaxed font-medium px-4">
                {t("search.subtitle", "Search any business to watch authentic video reviews or record your own.")}
              </p>
            </>
          )}

          {/* Loading indicator removed for premium clean UI */}

          {!hideSearchBar && (
            <div className="w-full max-w-xl px-2 sm:px-0 relative" ref={dropdownRef}>
              <CopoLocationSearchBar
                initialQuery={query}
                isSearching={isSearching}
                isLoadingSuggest={isLoadingSuggest}
                suggestions={suggestions}
                onQueryChange={(val) => {
                  setQuery(val);
                  if (!val.trim()) {
                    setSearchedPlace(null);
                    setSuggestions([]);
                  }
                }}
                onSelectSuggestion={(item) => handleSelectSuggestion(item)}
                onSearch={(fullQuery, locationDetails) => {
                  handleSearch(undefined, fullQuery, locationDetails.rawBusinessName, locationDetails);
                }}
              />

              {/* Searching card removed for premium clean UI */}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500">
          {!isMobileModal && !hideSearchBar && (
            <button 
              onClick={() => { setSearchedPlace(null); setQuery(""); }}
              className="mb-8 text-zinc-400 hover:text-white flex items-center gap-2 font-medium transition-colors self-start cursor-pointer"
            >
              {t("search.backSearch", "← Search another business or website")}
            </button>
          )}

          <div className="w-full bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden mb-8">
            {/* Top Hero Banner Canvas - Render ONLY authentic website cover image or clean neutral header */}
            {(() => {
              const rawBanner = searchedPlace.bannerUrl || searchedPlace.ogImage || (searchedPlace.photos && searchedPlace.photos[0]);
              const hasRealBanner = rawBanner && typeof rawBanner === "string" && rawBanner.trim().length > 0 && !rawBanner.includes("placeholder") && !rawBanner.includes("unsplash.com") && !rawBanner.startsWith("data:image/svg");

              if (hasRealBanner) {
                return (
                  <div className="w-full h-52 sm:h-72 relative overflow-hidden bg-zinc-950 flex items-center justify-center">
                    <img 
                      src={getProxiedImageUrl(rawBanner)} 
                      alt={searchedPlace.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60" />
                  </div>
                );
              }

              return (
                <div className="w-full h-24 sm:h-32 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(63,63,70,0.15),transparent_50%)]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/40 to-transparent" />
                </div>
              );
            })()}

            <div className="p-6 sm:p-8 pt-16 sm:pt-20 relative">
              {/* Overlapping High-Res Brand Logo Badge with High-Contrast Canvas */}
              <CopoBrandLogo
                domain={searchedPlace.brandDomain}
                name={formatBusinessName(searchedPlace.name)}
                website={searchedPlace.website}
                logoUrl={searchedPlace.logoUrl}
                bannerUrl={searchedPlace.bannerUrl || searchedPlace.ogImage}
                className="absolute -top-10 sm:-top-12 left-6 sm:left-8 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-zinc-900 bg-white shadow-2xl overflow-hidden flex items-center justify-center p-2 sm:p-2.5 z-30 ring-1 ring-white/20"
                imageClassName="w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast]"
                fallbackTextClassName="font-extrabold text-2xl sm:text-3xl text-zinc-950"
              />

              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="min-w-0 w-full flex-1">
                  <h2 
                    onClick={() => onOpenPlace && onOpenPlace(searchedPlace.id)}
                    className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-1.5 cursor-pointer hover:text-zinc-200 transition-colors leading-snug break-words tracking-tight"
                  >
                    {(() => {
                      const dom = searchedPlace.brandDomain || extractCleanDomain(searchedPlace.website || searchedPlace.id);
                      const name = (dom && KNOWN_OFFICIAL_NAMES[dom])
                        || (searchedPlace.website && KNOWN_OFFICIAL_NAMES[extractCleanDomain(searchedPlace.website)])
                        || formatBusinessName(searchedPlace.name, dom)
                        || "";
                      const fullName = name.trim();
                      const words = fullName.split(/\s+/);
                      if (words.length <= 1) {
                        return (
                          <span className="inline-flex items-center whitespace-nowrap shrink-0" dir="auto">
                            <bdi dir="auto">{fullName}</bdi>
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-zinc-950 shrink-0 ml-1.5 -mt-0.5" />
                          </span>
                        );
                      }
                      const allExceptLast = words.slice(0, -1).join(" ");
                      const lastWord = words[words.length - 1];
                      return (
                        <span dir="auto">
                          <bdi dir="auto">{allExceptLast}</bdi>{" "}
                          <span className="inline-flex items-center whitespace-nowrap shrink-0">
                            <bdi dir="auto">{lastWord}</bdi>
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-zinc-950 shrink-0 ml-1.5 -mt-0.5" />
                          </span>
                        </span>
                      );
                    })()}
                  </h2>

                  {/* Official Website / Domain Link under Business Name */}
                  {(() => {
                    const rawWeb = searchedPlace.website;
                    const cleanDom = getCleanDomainUrl(searchedPlace)
                      || searchedPlace.brandDomain 
                      || extractCleanDomain(searchedPlace.website || "")
                      || extractCleanDomain(searchedPlace.id || "")
                      || extractCleanDomain(searchedPlace.name || "")
                      || extractCleanDomain(initialQuery || query || "");
                    
                    let effectiveWeb = "";
                    if (rawWeb && isValidDomainUrl(rawWeb) && !rawWeb.includes("maps.google.com") && !rawWeb.toLowerCase().includes("wikipedia.org")) {
                      effectiveWeb = rawWeb.startsWith("http://") || rawWeb.startsWith("https://") ? rawWeb : `https://${rawWeb}`;
                    } else if (cleanDom && isValidDomainUrl(cleanDom) && cleanDom !== "yoouz.com" && !cleanDom.toLowerCase().includes("wikipedia.org")) {
                      effectiveWeb = `https://${cleanDom}`;
                    }
                    if (!effectiveWeb) return null;
                    const cleanDisplay = effectiveWeb.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
                    return (
                      <a 
                        href={effectiveWeb} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-zinc-300 hover:text-white hover:underline inline-flex items-center gap-1.5 font-medium text-xs sm:text-sm mt-0.5 mb-2 transition-colors cursor-pointer group"
                      >
                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 group-hover:text-white shrink-0 transition-colors" />
                        <span className="truncate">{cleanDisplay}</span>
                      </a>
                    );
                  })()}

                  {/* Structured Category Row & Sync Status */}
                  {(searchedPlace.category || isEnriching) && (
                    <div className="flex items-center gap-2.5 flex-wrap my-1.5">
                      {searchedPlace.category && 
                       !searchedPlace.category.toLowerCase().includes("verified") && 
                       searchedPlace.category.toLowerCase() !== "website" && 
                       searchedPlace.category.toLowerCase() !== "business" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{searchedPlace.category}</span>
                        </span>
                      )}
                      {isEnriching && (
                        <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs px-2.5 py-1 bg-amber-400/10 rounded-md border border-amber-400/20 animate-pulse font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Syncing details...</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Dock: Star Rating + Clean Action Buttons Across Full Width */}
              <div className="w-full flex flex-col gap-4 pt-4 border-t border-zinc-800/80 mt-4">
                <div className="w-full flex items-center justify-between flex-wrap gap-3">
                  {/* Star Rating Badge */}
                  <div className="inline-flex items-center gap-3 bg-zinc-900/90 border border-zinc-800/90 px-3.5 py-2 rounded-xl shadow-xs">
                    {totalReviewsCount > 0 ? (
                      <>
                        <span className="font-black text-amber-400 text-sm leading-none">{averageRating.toFixed(1)}</span>
                        <div className="flex items-center text-amber-400 gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.round(averageRating) ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" : "fill-zinc-800 text-zinc-800"}`}
                            />
                          ))}
                        </div>
                        <span className="text-zinc-300 font-bold text-xs border-l border-zinc-800 pl-2.5">
                          {totalReviewsCount} {totalReviewsCount === 1 ? t("common.review", "review") : t("common.reviews", "reviews")}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-amber-400/70 text-sm leading-none">0.0</span>
                        <div className="flex items-center text-amber-400/60 gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-none text-amber-400/50 stroke-[1.75]"
                            />
                          ))}
                        </div>
                        <span className="text-zinc-400 font-medium text-xs border-l border-zinc-800 pl-2.5">
                          0 reviews
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons: Equal 2-Column Grid spanning full width with zero awkward empty space */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => onOpenPlace && onOpenPlace(searchedPlace.id)}
                    className="w-full h-12 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold border border-zinc-700/80 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-98"
                  >
                    <Building2 className="w-4.5 h-4.5 text-zinc-300 shrink-0" />
                    <span className="truncate">{t("search.viewBusiness", "View Business")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRecordForPlace && onRecordForPlace(searchedPlace)}
                    className="w-full h-12 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold shadow-md shadow-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-98"
                  >
                    <Video className="w-4.5 h-4.5 text-zinc-950 shrink-0" />
                    <span className="truncate">{t("record.record_review", "Record Review")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {placeVideos.length > 0 && (
            <div className="w-full">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Play className="w-5 h-5 text-white fill-current" />
                <span>{t("search.reviews", "Reviews")} ({placeVideos.length})</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {placeVideos.map(video => (
                  <div 
                    key={video.id}
                    onClick={() => onSelectVideo(video.id)}
                    className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group bg-zinc-900 border border-zinc-800"
                  >
                    <CopoVideoThumbnail
                      video={video}
                      alt={video.caption || "Thumbnail"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none"
                    />
                    {/* Top-Left Star Badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-black text-white flex items-center gap-0.5 shadow-xs border border-white/10 z-10">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{video.rating ? video.rating.toFixed(1) : "5.0"}</span>
                    </div>
                    {/* Bottom Gradient Overlay & Meta */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-3 pointer-events-none">
                      <span className="text-xs text-white font-bold drop-shadow-md leading-tight line-clamp-2 break-all">
                        {getDisplayUrlAsDomain(video)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
