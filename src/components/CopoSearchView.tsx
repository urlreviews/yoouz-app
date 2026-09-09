import React, { useState, useEffect } from "react";
import { Search, Globe, Loader2, Play, Video, Star, CheckCircle } from "lucide-react";
import { Place, VideoReview } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { isPlaceReviewMatch, formatBusinessName } from "../utils/placeUtils";
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
  const [errorMsg, setErrorMsg] = useState("");
  const [searchedPlace, setSearchedPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(undefined, initialQuery);
    }
  }, [initialQuery]);

  // Validate URL strictly
  const isValidUrl = (urlString: string) => {
    try {
      const parsed = new URL(urlString.startsWith("http") ? urlString : "https://" + urlString);
      return parsed.hostname.includes(".");
    } catch {
      return false;
    }
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
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    if (!isValidUrl(activeQuery.trim())) {
      setErrorMsg("Please enter a valid website address.");
      return;
    }

    if (isDeepUrl(activeQuery.trim())) {
      setErrorMsg("Only base website addresses are allowed (e.g., example.com). Do not include subpages or articles.");
      return;
    }

    setErrorMsg("");
    setIsSearching(true);
    setSearchedPlace(null);

    try {
      const urlString = activeQuery.trim();
      const parsedUrl = new URL(urlString.startsWith("http") ? urlString : "https://" + urlString);
      const domain = parsedUrl.hostname;

      // 1. Check local places first
      let foundPlace = places.find(p => p.id === domain || p.brandDomain === domain);
      
      // 2. Always fetch from backend /api/url-metadata to ensure fresh logo/banner
      try {
         const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(urlString)}`);
         if (resp.ok) {
           const data = await resp.json();
           if (data.title || data.domain) {
             const fetchedLogo = data.logo || (data.domain ? getCleanLogoUrl(null, data.domain) || "" : "");
             const fetchedBanner = data.image || "";
             
             if (foundPlace) {
               // Enrich existing place with fresh metadata
               const isGenericName = (n: string) => {
                 if (!n) return true;
                 const l = n.toLowerCase();
                 return l.includes("hostinger") || l.includes("untitled") || l.includes("react app") || l.includes("vite app") || l === "website" || l === foundPlace?.brandDomain;
               };

               foundPlace = {
                 ...foundPlace,
                 name: (data.title && (isGenericName(foundPlace.name) || foundPlace.name === foundPlace.brandDomain)) ? data.title : foundPlace.name,
                 logoUrl: (foundPlace.logoUrl && !foundPlace.logoUrl.startsWith("data:;")) ? foundPlace.logoUrl : (fetchedLogo || ""),
                 avatarUrl: (foundPlace.avatarUrl && !foundPlace.avatarUrl.startsWith("data:;")) ? foundPlace.avatarUrl : (fetchedLogo || ""),
                 bannerUrl: foundPlace.bannerUrl || fetchedBanner || "",
                 ogImage: foundPlace.ogImage || fetchedBanner || "",
                 photos: (foundPlace.photos && foundPlace.photos.length > 0) ? foundPlace.photos : (fetchedBanner ? [fetchedBanner] : []),
                 description: foundPlace.description || data.description || "",
               };
               if (onAddPlace) {
                 onAddPlace(foundPlace);
               }
             } else {
               const newPlace: Place = {
                 id: (data.domain || "website").replace(/[^a-zA-Z0-9]/g, "-"),
                 name: data.title || data.domain,
                 category: "Website",
                 categoryType: "all",
                 address: "",
                 city: "Online",
                 lat: 0,
                 lng: 0,
                 rating: 5,
                 totalReviews: 1,
                 ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
                 avatarUrl: fetchedLogo,
                 logoUrl: fetchedLogo,
                 bannerUrl: fetchedBanner,
                 ogImage: fetchedBanner,
                 photos: fetchedBanner ? [fetchedBanner] : [],
                 openingHours: "Available 24/7",
                 isOpen: true,
                 phone: "",
                 website: data.url || urlString,
                 priceRange: "N/A",
                 plusCode: "",
                 description: data.description || "",
                 popularKeywords: [],
                 amenities: [],
                 topDishes: [],
                 brandDomain: data.domain
               };
               foundPlace = newPlace;
               if (onAddPlace) {
                 onAddPlace(newPlace);
               }
             }
           }
         }
      } catch (err) {
         console.warn("Metadata fetch error:", err);
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
    : 0;
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
                {t("search.title", "Review Any Business or Website")}
              </h1>
              
              <p className="text-zinc-200 text-sm md:text-base text-center max-w-md mb-8 leading-relaxed font-medium px-4">
                {t("search.subtitle", "Paste a business URL below to see short video reviews or record your own.")}
              </p>
            </>
          )}

          {!hideSearchBar && (
            <form onSubmit={(e) => handleSearch(e)} className="w-full max-w-lg flex flex-col items-center">
              <div className="w-full relative group shadow-sm rounded-full bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-white/10 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-zinc-200 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-28 py-3.5 rounded-full text-[14px] bg-transparent focus:outline-none placeholder:text-zinc-400 text-white"
                  placeholder={t("search.placeholder", "example.com")}
                  value={query}
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
                    {isSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      t("common.search", "Search")
                    )}
                  </button>
                </div>
              </div>
            </form>
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
          <button 
            onClick={() => { setSearchedPlace(null); setQuery(""); }}
            className="mb-8 text-zinc-200 hover:text-white flex items-center gap-2 font-medium transition-colors self-start cursor-pointer"
          >
            {t("search.backSearch", "← Search another business or website")}
          </button>

          <div className="w-full bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden mb-8">
            {/* Top Hero Banner Canvas */}
            <div className="w-full h-64 sm:h-80 bg-zinc-950 relative overflow-hidden flex items-center justify-center group">
              {(searchedPlace.bannerUrl || searchedPlace.ogImage) ? (
                <>
                  <img 
                    src={searchedPlace.bannerUrl || searchedPlace.ogImage} 
                    alt="Banner" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.banner-fallback');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }
                      target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10" />
                  
                  {/* Banner Fallback */}
                  <div className="banner-fallback absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-black hidden items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30" />
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest z-10">
                      <Globe className="w-4 h-4" />
                      <span>{t("search.verifiedListing", "Verified Web Listing")}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Fallback Gradient Canvas for websites without any image */
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-black flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30" />
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest z-10">
                    <Globe className="w-4 h-4" />
                    <span>{t("search.verifiedListing", "Verified Web Listing")}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 pt-16 sm:pt-20 relative">
              {/* Overlapping High-Res Brand Logo Badge */}
              <CopoBrandLogo
                domain={searchedPlace.brandDomain}
                name={formatBusinessName(searchedPlace.name)}
                website={searchedPlace.website}
                logoUrl={searchedPlace.logoUrl}
                bannerUrl={searchedPlace.bannerUrl || searchedPlace.ogImage}
                className="absolute -top-10 sm:-top-12 left-6 sm:left-8 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-zinc-800 bg-white shadow-xl overflow-hidden flex items-center justify-center p-0.5 z-30 ring-1 ring-white/10"
              />

              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-white mb-2">
                    {(() => {
                      const name = formatBusinessName(searchedPlace.name) || "";
                      const words = name.split(" ");
                      const lastWord = words.pop();
                      return (
                        <>
                          {words.length > 0 && <span>{words.join(" ")} </span>}
                          <span className="whitespace-nowrap inline-flex items-center gap-2 align-bottom">
                            <span>{lastWord}</span>
                            <span title="Verified Business" className="inline-flex">
                              <CheckCircle className="w-6 h-6 fill-white text-black shrink-0" />
                            </span>
                          </span>
                        </>
                      );
                    })()}
                  </h2>
                  <a href={searchedPlace.website} target="_blank" rel="noreferrer" className="text-zinc-200 hover:text-white hover:underline flex items-center gap-1.5 font-medium text-sm mt-1 mb-2">
                    <Globe className="w-4 h-4 text-zinc-200" />
                    {searchedPlace.brandDomain || searchedPlace.website?.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")}
                  </a>
                  
                  {/* Star Rating Row */}
                  {totalReviewsCount > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "fill-zinc-800 text-zinc-800"}`}
                          />
                        ))}
                      </div>
                      <span className="text-white font-bold text-lg">{averageRating.toFixed(1)}</span>
                      <span className="text-zinc-200 font-medium text-sm">
                        ({totalReviewsCount} {totalReviewsCount === 1 ? t("common.review", "review") : t("common.reviews", "reviews")})
                      </span>
                    </div>
                  )}
                  {searchedPlace.description && (
                    <p className="text-zinc-200 mt-4 max-w-2xl text-sm leading-relaxed">
                      {searchedPlace.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRecordForPlace && onRecordForPlace(searchedPlace)}
                  className="shrink-0 bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-3 rounded-full font-bold shadow-lg shadow-white/10 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-5 h-5 text-zinc-950" />
                  {t("record.record_review", "Record Review")}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Play className="w-5 h-5 text-white fill-current" />
              <span>{t("search.videoReviews", "Video Reviews")} ({placeVideos.length})</span>
            </h3>
            
            {placeVideos.length > 0 ? (
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                       <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-3 h-3 ${i < video.rating ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />
                          ))}
                       </div>
                       <p className="text-white text-xs font-medium line-clamp-2">{video.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full py-10 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="flex gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-zinc-700" strokeWidth={1.5} />
                  ))}
                </div>
                <h4 className="text-lg font-bold text-white">{t("search.noReviewsYet", "No reviews yet")}</h4>
                <p className="text-zinc-200 text-sm mt-1 mb-6">
                  {t("search.beTheFirst", "Be the first to share your experience with this website!")}
                </p>
                <button
                  onClick={() => onRecordForPlace && onRecordForPlace(searchedPlace)}
                  className="bg-white hover:bg-zinc-200 text-zinc-950 px-5 py-2.5 rounded-full font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {t("search.recordFirst", "Record the first review")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
