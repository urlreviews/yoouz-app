import React, { useState, useEffect, useRef } from "react";
import { Search, Globe, Loader2, Play, Video, Star, CheckCircle, MapPin, Building2, Phone, Mail, Clock, ExternalLink, Sparkles } from "lucide-react";
import { Place, VideoReview } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl, KNOWN_BRAND_BANNERS, getDomainBrandGradient, getProxiedImageUrl } from "../utils/logoUtils";
import { isPlaceReviewMatch, formatBusinessName, extractCleanDomain, isValidDomainUrl, getCleanDomainUrl, getDisplayUrlAsDomain, KNOWN_OFFICIAL_NAMES, isGenericPlaceName, getEffectivePlaceDescription } from "../utils/placeUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { useLanguage } from "../i18n/LanguageContext";

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
  const [errorMsg, setErrorMsg] = useState("");
  const [searchedPlace, setSearchedPlace] = useState<Place | null>(null);

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
          category: p.category || "Verified Business",
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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item: any) => {
    setShowDropdown(false);
    if (item.domain && item.domain.includes('.')) {
      setQuery(item.domain);
      handleSearch(undefined, item.domain);
    } else if (item.id && places.some(p => p.id === item.id)) {
      const match = places.find(p => p.id === item.id);
      if (match) {
        setSearchedPlace(match);
        setQuery(match.name || item.title);
        return;
      }
    } else {
      setQuery(item.title);
      handleSearch(undefined, item.title);
    }
  };

  // Validate URL strictly - rejects plain words, single characters like 'k', etc.
  const isValidUrl = (urlString: string) => {
    return isValidDomainUrl(urlString);
  };

  const isDeepUrl = (urlString: string) => {
    try {
      const parsed = new URL(urlString.startsWith("http") ? urlString : "https://" + urlString);
      const hasPath = parsed.pathname !== "/" && parsed.pathname !== "";
      const hasExtra = parsed.search !== "" || parsed.hash !== "";
      return hasPath || hasExtra;
    } catch {
      return false;
    }
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const rawQuery = (overrideQuery || query).trim();
    if (!rawQuery) return;

    setShowDropdown(false);

    // Extract clean domain strictly (e.g. "www.uber.com" -> "uber.com", "https://bhol.co.il" -> "bhol.co.il")
    let cleanUrl = extractCleanDomain(rawQuery);

    // If matching a place by domain or place ID, resolve its clean domain
    const matchingLocal = places.find(p => {
      const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
      return pDom === cleanUrl || p.id.toLowerCase() === cleanUrl.replace(/[^a-z0-9]/g, "-");
    });

    if (matchingLocal) {
      cleanUrl = getCleanDomainUrl(matchingLocal);
    }

    // If not a domain with a dot, check local places by name, known brands, or query API to resolve domain
    if (!isValidDomainUrl(cleanUrl)) {
      const matchingByName = places.find(p => p.name && p.name.toLowerCase() === rawQuery.toLowerCase());
      if (matchingByName) {
        cleanUrl = getCleanDomainUrl(matchingByName);
      } else {
        const brandMatch = Object.entries(KNOWN_OFFICIAL_NAMES).find(([k, v]) => k.includes('.') && (v.toLowerCase() === rawQuery.toLowerCase() || k.toLowerCase().startsWith(rawQuery.toLowerCase())));
        if (brandMatch) {
          cleanUrl = brandMatch[0];
        }
      }
    }

    let preloadedMeta: any = null;
    if (!isValidDomainUrl(cleanUrl)) {
      setIsSearching(true);
      try {
        const metaResp = await fetch(`/api/url-metadata?q=${encodeURIComponent(rawQuery)}`);
        if (metaResp.ok) {
          preloadedMeta = await metaResp.json();
          if (preloadedMeta && preloadedMeta.domain) {
            cleanUrl = preloadedMeta.domain;
          }
        }
      } catch(e) {}
    }

    if (!isValidDomainUrl(cleanUrl) && cleanUrl.length < 2) {
      setErrorMsg("Please enter a valid website address or business name (e.g. Starbucks, isrotel.co.il).");
      setIsSearching(false);
      return;
    }

    if (isDeepUrl(rawQuery)) {
      setErrorMsg("Only base website addresses are allowed (e.g., example.com). Do not include subpages or articles.");
      setIsSearching(false);
      return;
    }

    setQuery(cleanUrl);
    setErrorMsg("");
    setIsSearching(true);

    try {
      const domain = cleanUrl;

      // 1. Check local places first by domain URL only
      let foundPlace = places.find(p => {
        const pDom = extractCleanDomain(p.brandDomain || p.website || p.id);
        return pDom === domain || p.id === domain || p.id === domain.replace(/[^a-zA-Z0-9]/g, "-");
      });

      // 2. Set instant optimistic place so there is ZERO delay, NO blank white state, and instant logo
      const instantLogo: string = foundPlace?.logoUrl 
        || (preloadedMeta?.logo && !preloadedMeta.logo.includes('brandfetch') ? preloadedMeta.logo : "") 
        || getCleanLogoUrl(null, domain) 
        || `/api/favicon?domain=${domain}`;
      const instantBanner: string = foundPlace?.bannerUrl 
        || (preloadedMeta?.image && !preloadedMeta.image.includes('unsplash.com') ? preloadedMeta.image : "") 
        || KNOWN_BRAND_BANNERS[domain] 
        || "";
      const instantName = (domain && KNOWN_OFFICIAL_NAMES[domain]) 
        || (cleanUrl && KNOWN_OFFICIAL_NAMES[cleanUrl])
        || preloadedMeta?.title
        || preloadedMeta?.siteName
        || formatBusinessName(foundPlace?.name || domain, domain)
        || domain;

      const instantPlace: Place = foundPlace || {
        id: domain,
        name: instantName,
        category: preloadedMeta?.category || "Verified Business",
        categoryType: "all",
        address: preloadedMeta?.address || "",
        city: preloadedMeta?.city || "Online",
        country: preloadedMeta?.country || "",
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
        website: preloadedMeta?.url || (domain.includes('.') ? `https://${domain}` : ""),
        priceRange: "N/A",
        plusCode: "",
        description: preloadedMeta?.description || "",
        popularKeywords: [],
        amenities: [],
        topDishes: [],
        brandDomain: domain
      };

      setSearchedPlace(instantPlace);
      if (onAddPlace) {
        onAddPlace(instantPlace);
      }
      
      // 3. Enrich in the background from backend /api/url-metadata to ensure fresh logo/banner/meta/address/phone/hours
      setIsEnriching(true);
      try {
         const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(domain)}`);
         if (resp.ok) {
           const data = await resp.json();
           if (data.title || data.domain) {
             const isValidLogo = (l?: string | null): boolean => {
               if (!l || typeof l !== "string") return false;
               if (l.startsWith("data:;") || l.includes("brandfetch.io")) return false;
               return true;
             };

             const domainCleanLogo = data.domain ? getCleanLogoUrl(null, data.domain) : null;
             const fetchedLogo = isValidLogo(data.logo) 
               ? data.logo 
               : (domainCleanLogo || instantLogo);

             const fetchedBanner = (data.image && !data.image.includes("unsplash.com")) 
               ? data.image 
               : (instantBanner && !instantBanner.includes("unsplash.com") ? instantBanner : "");
             
             if (foundPlace) {
               // Enrich existing place with fresh metadata
               const isGenericName = (n: string) => {
                 if (!n) return true;
                 const l = n.toLowerCase();
                 return l.includes("hostinger") || l.includes("untitled") || l.includes("react app") || l.includes("vite app") || l === "website" || l === foundPlace?.brandDomain;
               };

               const targetName = (domain && KNOWN_OFFICIAL_NAMES[domain])
                 || (data.domain && KNOWN_OFFICIAL_NAMES[data.domain])
                 || formatBusinessName(data.siteName || data.title, data.domain || domain)
                 || instantName;

               foundPlace = {
                 ...foundPlace,
                 name: targetName || foundPlace.name,
                 logoUrl: (foundPlace.logoUrl && isValidLogo(foundPlace.logoUrl)) ? foundPlace.logoUrl : (fetchedLogo || instantLogo),
                 avatarUrl: (foundPlace.avatarUrl && isValidLogo(foundPlace.avatarUrl)) ? foundPlace.avatarUrl : (fetchedLogo || instantLogo),
                 bannerUrl: (foundPlace.bannerUrl && !foundPlace.bannerUrl.includes("unsplash.com")) ? foundPlace.bannerUrl : (fetchedBanner || ""),
                 ogImage: (foundPlace.ogImage && !foundPlace.ogImage.includes("unsplash.com")) ? foundPlace.ogImage : (fetchedBanner || ""),
                 photos: (foundPlace.photos && foundPlace.photos.length > 0 && !foundPlace.photos[0].includes("unsplash.com")) ? foundPlace.photos : (fetchedBanner ? [fetchedBanner] : []),
                 description: foundPlace.description || data.description || "",
                 category: (foundPlace.category && foundPlace.category !== "Website" && foundPlace.category !== "General") ? foundPlace.category : (data.category || foundPlace.category || "Website"),
                 address: (data.address && (!foundPlace.address || foundPlace.address === "Verified Location" || foundPlace.address.startsWith("http"))) ? data.address : (foundPlace.address || data.address || ""),
                 city: (foundPlace.city && foundPlace.city !== "Online" && foundPlace.city !== "Worldwide") ? foundPlace.city : (data.city || foundPlace.city || ""),
                 country: foundPlace.country || data.country || "",
                 phone: foundPlace.phone || data.phone || "",
                 email: foundPlace.email || data.email || "",
                 openingHours: data.openingHours || foundPlace.openingHours || (data.hours || foundPlace.hours || "Available 24/7"),
                 hours: data.openingHours || foundPlace.openingHours || (data.hours || foundPlace.hours || "Available 24/7"),
                 locations: (data.locations && data.locations.length > 0) ? data.locations : (foundPlace.locations || [])
               };
               setSearchedPlace(foundPlace);
               if (onAddPlace) {
                 onAddPlace(foundPlace);
               }
             } else {
               const newPlace: Place = {
                 id: (data.domain || domain || "website").toLowerCase(),
                 name: (domain && KNOWN_OFFICIAL_NAMES[domain]) || (data.domain && KNOWN_OFFICIAL_NAMES[data.domain]) || formatBusinessName(data.siteName || data.title, data.domain || domain) || instantName || data.domain || domain,
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
                 avatarUrl: fetchedLogo || instantLogo,
                 logoUrl: fetchedLogo || instantLogo,
                 bannerUrl: (fetchedBanner && !fetchedBanner.includes("unsplash.com")) ? fetchedBanner : (instantBanner && !instantBanner.includes("unsplash.com") ? instantBanner : ""),
                 ogImage: (fetchedBanner && !fetchedBanner.includes("unsplash.com")) ? fetchedBanner : (instantBanner && !instantBanner.includes("unsplash.com") ? instantBanner : ""),
                 photos: ((fetchedBanner && !fetchedBanner.includes("unsplash.com")) || (instantBanner && !instantBanner.includes("unsplash.com"))) ? [(fetchedBanner && !fetchedBanner.includes("unsplash.com")) ? fetchedBanner : instantBanner] : [],
                 openingHours: data.openingHours || "Available 24/7",
                 isOpen: true,
                 phone: data.phone || "",
                 email: data.email || "",
                 website: data.url || `https://${domain}`,
                 priceRange: "N/A",
                 plusCode: "",
                 description: data.description || "",
                 popularKeywords: [],
                 amenities: [],
                 topDishes: [],
                 locations: data.locations || [],
                 brandDomain: data.domain || domain
               };
               foundPlace = newPlace;
               setSearchedPlace(newPlace);
               if (onAddPlace) {
                 onAddPlace(newPlace);
               }
             }
           }
         }
      } catch (err) {
         console.warn("Metadata fetch error:", err);
      } finally {
         setIsEnriching(false);
      }

      if (foundPlace) {
        setSearchedPlace(foundPlace);
      } else {
        setErrorMsg("Could not fetch information for this URL. Please try another.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while verifying the URL.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFeelingLucky = () => {
    const popularWebsites = [
      "wikipedia.org",
      "nytimes.com",
      "booking.com",
      "planity.com",
      "apple.com",
      "google.com",
      "github.com",
      "airbnb.com"
    ];

    const availableDomains = places.length > 0
      ? (places.map(p => p.brandDomain || p.website?.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")).filter(Boolean) as string[])
      : [];

    const combined = Array.from(new Set([...availableDomains, ...popularWebsites]));
    const randomDomain = combined[Math.floor(Math.random() * combined.length)];

    setQuery(randomDomain);
    setErrorMsg("");
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
    <div className={`flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 text-white flex flex-col items-center select-none ${isMobileModal ? 'p-4 pt-2 pb-[calc(env(safe-area-inset-bottom,16px))]' : 'p-6 pt-10 pb-[calc(env(safe-area-inset-bottom,16px)+88px)]'}`}>
      {!searchedPlace ? (
        <div className={`w-full max-w-2xl flex flex-col items-center animate-in fade-in zoom-in duration-500 ${isMobileModal ? 'mt-2' : 'mt-[10vh]'}`}>
          {/* Central Logo / Icon */}
          {!isMobileModal && (
            <>
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-xs animate-fade-in text-zinc-200">
                <Globe className="w-8 h-8 text-zinc-200" strokeWidth={1.5} />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight text-center mb-3">
                {t("search.title", "Review Any Business")}
              </h1>
              
              <p className="text-zinc-200 text-sm md:text-base text-center max-w-md mb-8 leading-relaxed font-medium px-4">
                {t("search.subtitle", "Search any business to watch authentic video reviews or record your own.")}
              </p>
            </>
          )}

          {!hideSearchBar && (
            <div className="w-full max-w-lg relative" ref={dropdownRef}>
              <form onSubmit={(e) => handleSearch(e)} className="w-full flex flex-col items-center">
                <div className="w-full relative group shadow-sm rounded-full bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-white/10 transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-200 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-28 py-3.5 rounded-full text-[14px] bg-transparent focus:outline-none placeholder:text-zinc-400 text-white"
                    placeholder={t("search.placeholder", "Search any business...")}
                    value={query}
                    onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setErrorMsg("");
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setErrorMsg("");
                        setSuggestions([]);
                        setShowDropdown(false);
                      }}
                      className="absolute inset-y-0 right-[5.5rem] flex items-center text-zinc-200 hover:text-white transition-colors cursor-pointer"
                      title="Clear search query"
                    >
                      <span className="text-xl font-medium leading-none">×</span>
                    </button>
                  )}
                  <div className="absolute inset-y-0 right-1.5 flex items-center">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="h-9 px-5 rounded-full bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-200 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                    >
                      {isSearching || isLoadingSuggest ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        t("common.search", "Search")
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Live Auto-Suggest Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/60 max-h-[340px] overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-zinc-800/80 transition-colors text-left cursor-pointer group"
                    >
                      {item.domain || item.logoUrl ? (
                        <CopoBrandLogo
                          domain={item.domain}
                          name={item.title}
                          logoUrl={item.logoUrl}
                          className="w-8 h-8 rounded-lg border border-zinc-700 bg-white shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-0.5"
                          imageClassName="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800 shadow-xs flex items-center justify-center overflow-hidden shrink-0 text-zinc-300">
                          <Building2 className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center min-w-0">
                          <div className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                            {(() => {
                              const words = (item.title || "").trim().split(/\s+/);
                              if (words.length <= 1) {
                                return (
                                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                    <span>{words[0] || item.title}</span>
                                    <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                                  </span>
                                );
                              }
                              const lastWord = words.pop();
                              const mainText = words.join(" ");
                              return (
                                <>
                                  <span>{mainText} </span>
                                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                    <span>{lastWord}</span>
                                    <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
                          {item.domain ? (
                            <>
                              <span className="text-zinc-400 font-medium truncate">{item.domain}</span>
                              {item.category && item.category !== "Verified Business" && (
                                <>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-zinc-400 truncate">{item.category}</span>
                                </>
                              )}
                            </>
                          ) : (
                            item.category && item.category !== "Verified Business" ? (
                              <span className="text-zinc-400 truncate">{item.category}</span>
                            ) : null
                          )}
                          {item.address && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span className="text-zinc-500 truncate">{item.address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 text-xs font-medium text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl py-2.5 px-3.5 flex items-start gap-2 animate-fade-in leading-relaxed max-w-md text-center">
              <span className="font-bold text-red-500 mt-0.5">⚠️</span>
              <span>{errorMsg}</span>
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
            {/* Top Hero Banner Canvas */}
            {(() => {
              const brandTheme = getDomainBrandGradient(searchedPlace.brandDomain || searchedPlace.name);
              const domainInitial = (searchedPlace.brandDomain || searchedPlace.name || "B").charAt(0).toUpperCase();

              return (
                <div 
                  className="w-full h-64 sm:h-80 relative overflow-hidden flex items-center justify-center group"
                  style={{
                    background: `linear-gradient(135deg, ${brandTheme.from} 0%, ${brandTheme.via} 50%, ${brandTheme.to} 100%)`
                  }}
                >
                  {/* Glowing Ambient Mesh Backdrop */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-80"
                    style={{
                      backgroundImage: `radial-gradient(circle at 50% 30%, ${brandTheme.glow}, transparent 70%)`
                    }}
                  />
                  <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                  {/* Watermark Brand Typography Emblem */}
                  <div className="absolute right-6 -bottom-8 pointer-events-none select-none opacity-10 font-black text-9xl sm:text-[140px] text-white tracking-tighter uppercase leading-none">
                    {domainInitial}
                  </div>

                  {(searchedPlace.bannerUrl || searchedPlace.ogImage) && (
                    <>
                      <img 
                        src={getProxiedImageUrl(searchedPlace.bannerUrl || searchedPlace.ogImage)} 
                        alt="Banner" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-75 z-10"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10 pointer-events-none" />
                    </>
                  )}
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
                <div className="min-w-0 flex-1">
                  <h2 
                    onClick={() => onOpenPlace && onOpenPlace(searchedPlace.id)}
                    className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5 cursor-pointer hover:text-zinc-200 transition-colors"
                  >
                    {(() => {
                      const dom = searchedPlace.brandDomain || extractCleanDomain(searchedPlace.website || searchedPlace.id);
                      const name = (dom && KNOWN_OFFICIAL_NAMES[dom])
                        || (searchedPlace.website && KNOWN_OFFICIAL_NAMES[extractCleanDomain(searchedPlace.website)])
                        || formatBusinessName(searchedPlace.name, dom)
                        || "";
                      const words = name.trim().split(/\s+/);
                      if (words.length <= 1) {
                        return (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span>{words[0] || name}</span>
                            <CheckCircle className="w-6 h-6 fill-white text-black shrink-0" />
                          </span>
                        );
                      }
                      const lastWord = words.pop();
                      const mainText = words.join(" ");
                      return (
                        <>
                          <span>{mainText} </span>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span>{lastWord}</span>
                            <CheckCircle className="w-6 h-6 fill-white text-black shrink-0" />
                          </span>
                        </>
                      );
                    })()}
                  </h2>
                  <a href={searchedPlace.website} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white hover:underline inline-flex items-center gap-1.5 font-medium text-sm mt-0.5 mb-2">
                    <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{searchedPlace.brandDomain || searchedPlace.website?.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")}</span>
                  </a>

                  {/* Structured Category Row */}
                  {searchedPlace.category && 
                   !searchedPlace.category.toLowerCase().includes("verified") && 
                   searchedPlace.category.toLowerCase() !== "website" && 
                   searchedPlace.category.toLowerCase() !== "business" && (
                    <div className="flex items-center gap-2.5 flex-wrap my-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{searchedPlace.category}</span>
                      </span>
                    </div>
                  )}

                  {/* Street Address & Location */}
                  {(searchedPlace.address || (searchedPlace.city && searchedPlace.city !== "Online" && searchedPlace.city !== "Worldwide")) && (
                    <div className="flex items-center gap-2 text-xs text-zinc-300 mt-2 flex-wrap">
                      <MapPin className="w-4 h-4 text-zinc-300 shrink-0" />
                      <span className="font-medium">
                        {[searchedPlace.address, (searchedPlace.city && searchedPlace.city !== "Online" && searchedPlace.city !== "Worldwide") ? searchedPlace.city : "", searchedPlace.country].filter(Boolean).join(", ")}
                      </span>
                      {searchedPlace.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([searchedPlace.name, searchedPlace.address, searchedPlace.city].filter(Boolean).join(", "))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-300 hover:text-white hover:underline inline-flex items-center gap-0.5 ml-1 font-semibold"
                        >
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Contact & Hours Badges */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-zinc-300 mt-2.5">
                    {searchedPlace.phone && (
                      <a href={`tel:${searchedPlace.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-1.5 bg-zinc-800/90 hover:bg-zinc-750 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-700/60 transition-colors font-semibold">
                        <Phone className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                        <span>{searchedPlace.phone}</span>
                      </a>
                    )}
                    {searchedPlace.email && !searchedPlace.email.toLowerCase().includes('4samet') && (
                      <a href={`mailto:${searchedPlace.email}`} className="inline-flex items-center gap-1.5 bg-zinc-800/90 hover:bg-zinc-750 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-700/60 transition-colors font-semibold">
                        <Mail className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                        <span>{searchedPlace.email}</span>
                      </a>
                    )}
                    {(searchedPlace.openingHours || (searchedPlace as any).hours) && !(searchedPlace.openingHours || (searchedPlace as any).hours).toLowerCase().includes("24/7") && (
                      <div className="inline-flex items-center gap-1.5 bg-zinc-800/90 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-700/60 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                        <span>{searchedPlace.openingHours || (searchedPlace as any).hours}</span>
                      </div>
                    )}
                    {isEnriching && (
                      <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs px-2.5 py-1 bg-amber-400/10 rounded-md border border-amber-400/20 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Syncing details...</span>
                      </div>
                    )}
                  </div>

                  {/* Action Dock Row: Star Rating Pill + Action Buttons on the SAME Horizontal Line */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800/80 mt-4">
                    {/* Star Rating Pill Badge */}
                    <div className="inline-flex items-center gap-2.5 bg-zinc-800/90 border border-zinc-700/80 px-3.5 py-2 rounded-full shadow-md">
                      {totalReviewsCount > 0 ? (
                        <>
                          <span className="font-black text-amber-400 text-sm leading-none">{averageRating.toFixed(1)}</span>
                          <div className="flex items-center text-amber-400 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "fill-zinc-700 text-zinc-700"}`}
                              />
                            ))}
                          </div>
                          <span className="text-zinc-300 font-extrabold text-xs ml-1 border-l border-zinc-700/80 pl-2.5">
                            {totalReviewsCount} {totalReviewsCount === 1 ? t("common.review", "video review") : t("common.reviews", "video reviews")}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-zinc-400 text-sm leading-none">0.0</span>
                          <div className="flex items-center text-zinc-600 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-3.5 h-3.5 fill-none text-zinc-500 stroke-[1.5]"
                              />
                            ))}
                          </div>
                          <span className="text-zinc-400 font-semibold text-xs ml-1 border-l border-zinc-700/80 pl-2.5">
                            0 video reviews
                          </span>
                        </>
                      )}
                    </div>

                    {/* Profile Action Pill Buttons */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onOpenPlace && onOpenPlace(searchedPlace.id)}
                        className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2 rounded-full font-bold border border-zinc-700 hover:border-zinc-600 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-98"
                      >
                        <Building2 className="w-3.5 h-3.5 text-zinc-300" />
                        <span>View Business Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRecordForPlace && onRecordForPlace(searchedPlace)}
                        className="bg-white hover:bg-zinc-200 text-zinc-950 px-5 py-2 rounded-full font-extrabold shadow-lg shadow-white/10 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-98"
                      >
                        <Video className="w-4 h-4 text-zinc-950" />
                        {t("record.record_video_review", "Record Video Review")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {placeVideos.length > 0 && (
            <div className="w-full">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Play className="w-5 h-5 text-white fill-current" />
                <span>{t("search.videoReviews", "Video Reviews")} ({placeVideos.length})</span>
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
