import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Clock, TrendingUp, X, AlertCircle, Building2, CheckCircle } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoSearchView } from "./CopoSearchView";
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
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
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
      inputRef.current?.focus();
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

  const findMatchingPlace = (term: string): Place | undefined => {
    const target = extractCleanDomain(term);
    return places.find(p => {
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      return (target && pDom === target) ||
             p.brandDomain?.toLowerCase() === target ||
             p.name.toLowerCase() === term.toLowerCase() ||
             p.id.toLowerCase() === target.replace(/[^a-z0-9]/g, "-") ||
             p.id.toLowerCase() === term.toLowerCase().replace(/[^a-z0-9]/g, "-");
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
      setValidationError("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      handleClose();
    }
  };

  const handleSearch = async (e: React.FormEvent | string, preferredName?: string) => {
    if (typeof e !== 'string') e.preventDefault();
    const raw = typeof e === 'string' ? e : query;
    if (!raw || !raw.trim()) return;
    
    const trimmed = raw.trim();
    // Resolve matching place clean domain if available
    const matchedPlace = findMatchingPlace(trimmed);
    let cleanUrl = matchedPlace ? getCleanDomainUrl(matchedPlace) : extractCleanDomain(trimmed);

    // If not a domain with a dot, check KNOWN_OFFICIAL_NAMES
    if (!isValidDomainUrl(cleanUrl)) {
      const brandMatch = Object.entries(KNOWN_OFFICIAL_NAMES).find(([k, v]) => k.includes('.') && (v.toLowerCase() === trimmed.toLowerCase() || k.toLowerCase().startsWith(trimmed.toLowerCase())));
      if (brandMatch) {
        cleanUrl = brandMatch[0];
      }
    }

    // If still not a valid domain, attempt to resolve via Google CSE
    if (!isValidDomainUrl(cleanUrl)) {
      setValidationError("");
      console.info("[Search Mobile] Querying client-side Google CSE first for:", trimmed);
      let cseUrl: string | null = null;
      try {
        const cseTimeout = (ms: number) => new Promise<null>((_, reject) => setTimeout(() => reject(new Error("CSE Timeout")), ms));
        cseUrl = await Promise.race([
          queryGoogleCseForUrl(trimmed),
          cseTimeout(3000)
        ]);
      } catch (cseErr) {
        console.warn("[Search Mobile] Client-side Google CSE took too long or errored:", cseErr);
      }

      if (cseUrl) {
        const resolvedDom = extractCleanDomain(cseUrl);
        if (isValidDomainUrl(resolvedDom)) {
          console.info("[Search Mobile] Successfully resolved domain via Google CSE:", resolvedDom);
          cleanUrl = resolvedDom;
        }
      }
    }

    // Reject non-domains that couldn't be resolved
    if (!isValidDomainUrl(cleanUrl)) {
      setValidationError("Please enter a valid business name or website (e.g. Starbucks, isrotel.co.il)");
      setTimeout(() => setValidationError(""), 3500);
      return;
    }

    setValidationError("");

    // Store ONLY clean URL (e.g. "uber.com", never "www." or "https://")
    const newRecent = [cleanUrl, ...recentSearches.filter(s => s !== cleanUrl)].slice(0, 10);
    setRecentSearches(newRecent);
    try {
      localStorage.setItem("yoouz_recent_searches", JSON.stringify(newRecent));
    } catch {}

    // Synchronously register place into memory & database so logo/banner resolves on 1st search attempt
    if (!matchedPlace && onAddPlace) {
      const instantLogo = getCleanLogoUrl(null, cleanUrl) || "";
      const instantName = preferredName || (cleanUrl && KNOWN_OFFICIAL_NAMES[cleanUrl]) || formatBusinessName(cleanUrl) || cleanUrl;
      const optimisticPlace: Place = {
        id: cleanUrl.toLowerCase(),
        name: instantName,
        category: "Website",
        categoryType: "all",
        address: "",
        city: "Online",
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
        website: `https://${cleanUrl}`,
        priceRange: "N/A",
        plusCode: "",
        description: "",
        popularKeywords: [],
        amenities: [],
        topDishes: [],
        brandDomain: cleanUrl
      };
      onAddPlace(optimisticPlace);

      // Immediately enrich with authentic address, phone, email, category in the background
      fetch(`/api/url-metadata?url=${encodeURIComponent(cleanUrl)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && (data.title || data.address || data.phone || data.category || data.image || data.logo)) {
            const isValidLogo = data.logo && !data.logo.includes("tap/0.png") && !data.logo.includes("icons/tap") && !data.logo.startsWith("data:;");
            const isValidBanner = data.image && !data.image.includes("unsplash.com") && !data.image.includes("placeholder");
            onAddPlace({
              ...optimisticPlace,
              name: preferredName || (cleanUrl && KNOWN_OFFICIAL_NAMES[cleanUrl]) || (data.domain && KNOWN_OFFICIAL_NAMES[data.domain]) || formatBusinessName(data.siteName || data.title, data.domain || cleanUrl) || optimisticPlace.name,
              category: data.category || optimisticPlace.category,
              address: (data.address && !data.address.startsWith("http")) ? data.address : optimisticPlace.address,
              city: data.city || optimisticPlace.city,
              country: data.country || optimisticPlace.country,
              phone: data.phone || optimisticPlace.phone,
              email: data.email || optimisticPlace.email,
              bannerUrl: isValidBanner ? data.image : optimisticPlace.bannerUrl,
              ogImage: isValidBanner ? data.image : optimisticPlace.ogImage,
              logoUrl: isValidLogo ? data.logo : optimisticPlace.logoUrl,
              avatarUrl: isValidLogo ? data.logo : optimisticPlace.avatarUrl,
              description: data.description || optimisticPlace.description
            });
          }
        })
        .catch(() => {});
    }
    
    setQuery(cleanUrl);
    setSubmittedQuery(cleanUrl);
  };

  const handleSelectSuggestion = async (item: any) => {
    // 1. Check if it matches a local database place first for INSTANT 0ms resolution
    const match = findMatchingPlace(item.domain || item.id || item.title);
    if (match) {
      console.info("[Search Mobile] Loading local database match instantly:", match.name);
      const cleanDom = getCleanDomainUrl(match);
      setQuery(cleanDom);
      setSubmittedQuery(cleanDom);
      return;
    }

    // 2. Since it is not a local database match, resolve genuine URL via Google CSE
    setValidationError("");
    let targetQuery = item.title;
    console.info("[Search Mobile] Selected autocomplete suggestion. Querying Google CSE for genuine URL:", targetQuery);
    
    let cseUrl: string | null = null;
    try {
      const cseTimeout = (ms: number) => new Promise<null>((_, reject) => setTimeout(() => reject(new Error("CSE Timeout")), ms));
      cseUrl = await Promise.race([
        queryGoogleCseForUrl(targetQuery),
        cseTimeout(3000)
      ]);
    } catch (cseErr) {
      console.warn("[Search Mobile] Google CSE resolve on suggestion click timed out or failed:", cseErr);
    }

    let resolvedDom = item.domain;
    if (cseUrl) {
      const parsedDom = extractCleanDomain(cseUrl);
      if (isValidDomainUrl(parsedDom)) {
        console.info("[Search Mobile] Resolved genuine domain via Google CSE:", parsedDom);
        resolvedDom = parsedDom;
      }
    }

    if (resolvedDom && isValidDomainUrl(resolvedDom)) {
      setQuery(resolvedDom);
      setSubmittedQuery(resolvedDom);
      
      // Store in recent searches
      const newRecent = [resolvedDom, ...recentSearches.filter(s => s !== resolvedDom)].slice(0, 10);
      setRecentSearches(newRecent);
      try {
        localStorage.setItem("yoouz_recent_searches", JSON.stringify(newRecent));
      } catch {}

      // Add optimistic place
      if (onAddPlace) {
        const instantLogo = getCleanLogoUrl(null, resolvedDom) || "";
        const instantName = item.title || (resolvedDom && KNOWN_OFFICIAL_NAMES[resolvedDom]) || formatBusinessName(resolvedDom) || resolvedDom;
        const optimisticPlace: Place = {
          id: resolvedDom.toLowerCase(),
          name: instantName,
          category: item.category || "Website",
          categoryType: "all",
          address: "",
          city: "Online",
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
          website: `https://${resolvedDom}`,
          priceRange: "N/A",
          plusCode: "",
          description: "",
          popularKeywords: [],
          amenities: [],
          topDishes: [],
          brandDomain: resolvedDom
        };
        onAddPlace(optimisticPlace);

        // Enrich in the background
        fetch(`/api/url-metadata?url=${encodeURIComponent(resolvedDom)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && (data.title || data.address || data.phone || data.category || data.image || data.logo)) {
              const isValidLogo = data.logo && !data.logo.includes("tap/0.png") && !data.logo.includes("icons/tap") && !data.logo.startsWith("data:;");
              const isValidBanner = data.image && !data.image.includes("unsplash.com") && !data.image.includes("placeholder");
              onAddPlace({
                ...optimisticPlace,
                name: (resolvedDom && KNOWN_OFFICIAL_NAMES[resolvedDom]) || (data.domain && KNOWN_OFFICIAL_NAMES[data.domain]) || formatBusinessName(data.siteName || data.title, data.domain || resolvedDom) || optimisticPlace.name,
                category: data.category || optimisticPlace.category,
                address: (data.address && !data.address.startsWith("http")) ? data.address : optimisticPlace.address,
                city: data.city || optimisticPlace.city,
                country: data.country || optimisticPlace.country,
                phone: data.phone || optimisticPlace.phone,
                email: data.email || optimisticPlace.email,
                bannerUrl: isValidBanner ? data.image : optimisticPlace.bannerUrl,
                ogImage: isValidBanner ? data.image : optimisticPlace.ogImage,
                logoUrl: isValidLogo ? data.logo : optimisticPlace.logoUrl,
                avatarUrl: isValidLogo ? data.logo : optimisticPlace.avatarUrl,
                description: data.description || optimisticPlace.description
              });
            }
          })
          .catch(() => {});
      }
    } else {
      setValidationError("Please enter a valid business name or website (e.g. Starbucks, isrotel.co.il)");
      setTimeout(() => setValidationError(""), 3500);
    }
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
          category: p.category || "Verified Business",
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
      
      {/* Top Search Bar */}
      <div className="w-full flex flex-col p-3 pt-[max(12px,env(safe-area-inset-top))] sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 gap-2">
        <div className="w-full flex items-center gap-3">
          <button 
             onClick={handleBack}
             className="text-white p-1 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
             aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <form onSubmit={handleSearch} className="flex-1 relative flex items-center group">
            <div className="absolute left-3 text-zinc-400 group-focus-within:text-white transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-zinc-900 border border-zinc-800 text-white text-[15px] rounded-lg py-2.5 pl-9 pr-9 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all placeholder:text-zinc-500"
              placeholder={t("search.placeholder", "Search any business...")}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSubmittedQuery("");
                if (validationError) setValidationError("");
              }}
            />
            {query && (
              <div className="absolute right-1 flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSubmittedQuery("");
                    setValidationError("");
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>

          <button 
            onClick={handleSearch}
            className="text-white font-bold text-[14px] px-1 active:opacity-70 transition-opacity whitespace-nowrap cursor-pointer"
          >
            {t("common.search", "Search")}
          </button>
        </div>

        {validationError && (
          <div className="py-2 px-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto w-full relative">
        {submittedQuery ? (
          <CopoSearchView
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
          <div className="p-4 flex flex-col gap-6">
            
            {/* Autocomplete Suggestions */}
            {query.length > 0 && mergedSuggestions.length > 0 && (
              <div className="flex flex-col">
                {mergedSuggestions.map((item, idx) => {
                  const title = item.title || item.name || getCleanDomainUrl(item);
                  const targetDomain = item.domain || getCleanDomainUrl(item);
                  const isDbOrBrand = item.source === "database" || item.source === "brand_index";
                  const hasDomain = targetDomain && targetDomain.includes('.');
                  const itemLogo = item.logoUrl || getItemLogoUrl(targetDomain, item);

                  return (
                    <button 
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
                    >
                      {isDbOrBrand && hasDomain ? (
                        <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center shrink-0 p-1 overflow-hidden">
                          <CopoBrandLogo 
                            domain={targetDomain}
                            name={title}
                            logoUrl={itemLogo}
                            className="w-full h-full flex items-center justify-center p-0 overflow-hidden bg-transparent"
                            imageClassName="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400">
                          <Search className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-[15px] font-medium truncate">
                          <span>{title}</span>
                          {isDbOrBrand && (
                            <CheckCircle className="inline-block ml-1.5 w-3.5 h-3.5 fill-white text-zinc-950 shrink-0 align-middle" />
                          )}
                        </div>
                        {isDbOrBrand && (
                          <div className="flex items-center gap-2 text-xs text-zinc-500 truncate mt-0.5">
                            {hasDomain ? (
                              <>
                                <span className="text-zinc-400 font-semibold truncate text-[11px] sm:text-xs">{targetDomain.toLowerCase()}</span>
                                <span className="text-zinc-600">•</span>
                              </>
                            ) : null}
                            <span className="text-zinc-400 truncate text-[11px] sm:text-xs">{item.category || "Verified Business"}</span>
                            {item.address && (
                              <>
                                <span className="text-zinc-700">•</span>
                                <span className="text-zinc-500 truncate text-[11px] sm:text-xs">{item.address}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <Search className="w-4 h-4 text-zinc-500 ml-auto shrink-0 opacity-50" />
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSearch(cleanUrl);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handleSearch(cleanUrl);
                        }}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSearch(cleanUrl);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handleSearch(cleanUrl);
                        }}
                        className="flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-zinc-900 px-2 rounded-lg transition-colors"
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
