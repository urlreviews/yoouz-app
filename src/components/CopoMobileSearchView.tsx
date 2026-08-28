import React, { useState } from "react";
import { Search, Globe, Loader2, Play, Video, Star, X, ArrowLeft, ExternalLink } from "lucide-react";
import { Place, VideoReview } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { isPlaceReviewMatch } from "../utils/placeUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";

interface CopoMobileSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onClose: () => void;
}

export const CopoMobileSearchView: React.FC<CopoMobileSearchViewProps> = ({
  places,
  videos,
  onSelectVideo,
  onOpenPlace,
  onRecordForPlace,
  onAddPlace,
  onClose
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchedPlace, setSearchedPlace] = useState<Place | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

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

  const handleSearch = async (overrideQuery?: string) => {
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    if (!isValidUrl(activeQuery.trim())) {
      setErrorMsg("Please enter a valid website address (e.g. example.com).");
      return;
    }

    if (isDeepUrl(activeQuery.trim())) {
      setErrorMsg("Only main website addresses are allowed (e.g. example.com).");
      return;
    }

    setErrorMsg("");
    setIsSearching(true);
    setSearchedPlace(null);
    setLogoFailed(false);

    try {
      const urlString = activeQuery.trim();
      const parsedUrl = new URL(urlString.startsWith("http") ? urlString : "https://" + urlString);
      const domain = parsedUrl.hostname;

      let foundPlace = places.find(p => p.id === domain || p.brandDomain === domain);

      if (!foundPlace) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        try {
          const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(urlString)}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (resp.ok) {
            const data = await resp.json();
            if (data.title || data.domain) {
              const newPlace: Place = {
                id: data.domain.replace(/[^a-zA-Z0-9]/g, "-"),
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
                avatarUrl: data.logo || (data.domain ? getCleanLogoUrl(null, data.domain) || "" : ""),
                logoUrl: data.logo || (data.domain ? getCleanLogoUrl(null, data.domain) || "" : ""),
                bannerUrl: data.image || "",
                photos: data.image ? [data.image] : [],
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
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
             setErrorMsg("Metadata fetch timed out. Please try again.");
          } else {
             throw err;
          }
        }
      }

      if (foundPlace) {
        setSearchedPlace(foundPlace);
      } else {
        setErrorMsg("Could not fetch information for this URL. Please try another.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while looking up the website.");
    } finally {
      setIsSearching(false);
    }
  };

  const placeVideos = searchedPlace
    ? videos.filter(v => isPlaceReviewMatch(v, searchedPlace))
    : [];

  const rawLogoUrl = searchedPlace ? getPlaceLogoUrl(searchedPlace) : null;

  return (
    <div className="fixed inset-0 h-[100dvh] z-[250] bg-zinc-950 text-white flex flex-col font-sans animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-md mx-auto h-full flex flex-col min-h-0">
        {/* Top Search Header Bar */}
      <div className="px-3.5 pt-3.5 pb-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }} 
          className="w-full"
        >
          <div className="relative flex items-center bg-zinc-900 rounded-full border border-zinc-800 focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-xs px-3.5 py-2.5">
            <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2.5" />
            <input
              type="text"
              autoFocus
              placeholder="Paste business website URL..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setErrorMsg("");
              }}
              className="w-full bg-transparent text-[15px] font-medium text-white placeholder:text-zinc-400 focus:outline-none"
            />
            {/* Integrated Close / Clear X Button */}
            <button
              type="button"
              onClick={() => {
                if (query || searchedPlace) {
                  setQuery("");
                  setErrorMsg("");
                  setSearchedPlace(null);
                } else {
                  onClose();
                }
              }}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0 ml-1.5"
              title={query || searchedPlace ? "Clear" : "Close search"}
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-48 overscroll-contain">
        {errorMsg && (
          <div className="mb-4 text-xs font-medium text-red-400 bg-red-950/50 border border-red-800/60 rounded-xl p-3 flex items-start gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#1a73e8]" />
            <p className="text-xs font-semibold text-zinc-300">Verifying website details...</p>
          </div>
        ) : !searchedPlace ? (
          /* Clean Mobile Empty State */
          <div className="flex flex-col items-center justify-center pt-16 pb-12 text-center px-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#60a5fa] flex items-center justify-center mb-3.5 shadow-xs">
              <Globe className="w-7 h-7" strokeWidth={1.75} />
            </div>

            <h3 className="text-base font-extrabold text-white mb-1.5">
              Search Any Business or Website
            </h3>

            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-medium">
              Enter a website domain above to see short video reviews or record your own.
            </p>
          </div>
        ) : (
          /* Premium Search Result View for Mobile */
          <div className="animate-in fade-in duration-200">
            <button
              onClick={() => {
                setSearchedPlace(null);
                setQuery("");
              }}
              className="mb-4 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to search</span>
            </button>

            {/* Premium Business Card */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-md overflow-hidden mb-6">
              {/* Banner Top */}
              <div className="h-32 bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                {searchedPlace.bannerUrl ? (
                  <>
                    <img 
                      src={searchedPlace.bannerUrl} 
                      alt="Banner" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10" />
                  </>
                ) : (
                  <div className="w-full h-full bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 opacity-80" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
                  </div>
                )}
              </div>


              
                            {/* Card Body */}
              <div className="px-5 pb-6 relative z-10">
                {/* Logo Badge overlapping the banner */}
                <div className="relative -mt-10 mb-3 z-20">
                <CopoBrandLogo
                  domain={searchedPlace.brandDomain}
                  name={searchedPlace.name}
                  website={searchedPlace.website}
                  logoUrl={searchedPlace.logoUrl}
                  bannerUrl={searchedPlace.bannerUrl}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-zinc-900 bg-white shadow-xl overflow-hidden p-1.5 flex items-center justify-center relative ring-1 ring-black/20"
                  imageClassName="w-full h-full object-contain rounded-lg"
                  fallbackTextClassName="font-black text-xl text-white drop-shadow-sm"
                />
                </div>

                <h3 className="text-xl font-extrabold text-white leading-snug tracking-tight">
                  {searchedPlace.name}
                </h3>

                <a 
                  href={searchedPlace.website} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-[#60a5fa] text-xs font-semibold mt-2.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{searchedPlace.brandDomain || searchedPlace.website}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                {searchedPlace.description && (
                  <p className="text-zinc-300 text-xs mt-3 line-clamp-3 leading-relaxed font-normal">
                    {searchedPlace.description}
                  </p>
                )}

                <button
                  onClick={() => {
                    if (onRecordForPlace) {
                      onRecordForPlace(searchedPlace);
                    }
                  }}
                  className="w-full mt-5 bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.98] text-white py-3.5 rounded-full font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Record Video Review</span>
                </button>
              </div>
            </div>

            {/* Video Reviews Section */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                <Play className="w-4 h-4 text-[#60a5fa] fill-current" />
                <span>Video Reviews ({placeVideos.length})</span>
              </h4>

              {placeVideos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {placeVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        onSelectVideo(video.id);
                        onClose();
                      }}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-zinc-900 border border-zinc-800 shadow-xs active:scale-95 transition-transform"
                    >
                      <CopoVideoThumbnail
                        video={video}
                        alt={video.caption}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                        <div className="flex items-center gap-0.5 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 ${i < video.rating ? "text-yellow-400 fill-current" : "text-white/30"}`} />
                          ))}
                        </div>
                        <p className="text-white text-[11px] font-medium line-clamp-2 leading-tight">{video.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-[#60a5fa] flex items-center justify-center mx-auto mb-2.5">
                    <Video className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 font-semibold">
                    No video reviews yet for this website.
                  </p>
                  <button
                    onClick={() => {
                      if (onRecordForPlace) onRecordForPlace(searchedPlace);
                    }}
                    className="text-xs font-bold text-blue-400 bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-full hover:bg-zinc-700 shadow-xs transition-all cursor-pointer"
                  >
                    Be the first to record a review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
