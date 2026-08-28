import React, { useState } from "react";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { Search, Globe, Loader2, Play, Video, Star } from "lucide-react";
import { Place, VideoReview } from "../types";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { isPlaceReviewMatch } from "../utils/placeUtils";

interface CopoRecordReviewViewProps {
  places: Place[];
  videos: VideoReview[];
  savedPlaceIds?: string[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onToggleGrabPlace?: (place: Place) => void;
}

export const CopoRecordReviewView: React.FC<CopoRecordReviewViewProps> = ({
  places,
  videos,
  onSelectVideo,
  onOpenPlace,
  onRecordForPlace,
  onAddPlace
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchedPlace, setSearchedPlace] = useState<Place | null>(null);

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

      let foundPlace = places.find(p => p.id === domain || p.brandDomain === domain);
      
      if (!foundPlace) {
         const resp = await fetch(`/api/url-metadata?url=${encodeURIComponent(urlString)}`);
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

  const placeVideos = searchedPlace 
    ? videos.filter(v => isPlaceReviewMatch(v, searchedPlace)) 
    : [];

  return (
    <div className="flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col items-center p-6 pt-10 pb-20">
      {!searchedPlace ? (
        <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-[10vh]">
          <div className="w-16 h-16 bg-zinc-900 md:bg-blue-50 border border-zinc-800 md:border-blue-100 rounded-full flex items-center justify-center mb-6 shadow-xs animate-fade-in">
            <Video className="w-8 h-8 text-[#1a73e8]" strokeWidth={1.5} />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white md:text-zinc-900 tracking-tight text-center mb-3">
            Record Review
          </h1>
          
          <p className="text-zinc-400 md:text-zinc-500 text-sm md:text-base text-center max-w-md mb-8 leading-relaxed font-medium px-4">
            Paste a business URL below to record your video review.
          </p>

          <form onSubmit={(e) => handleSearch(e)} className="w-full max-w-lg flex flex-col items-center">
            <div className="w-full relative group shadow-sm rounded-full bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 md:focus-within:ring-blue-100 transition-all">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-500 md:text-zinc-400 group-focus-within:text-[#1a73e8] transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-28 py-3.5 rounded-full text-[14px] bg-transparent focus:outline-none placeholder:text-zinc-500 md:placeholder:text-zinc-400 text-white md:text-zinc-900"
                placeholder="Paste business website URL..."
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
                  className="absolute inset-y-0 right-22 flex items-center text-zinc-400 hover:text-zinc-200 md:hover:text-zinc-600 transition-colors cursor-pointer"
                  title="Clear query"
                >
                  <span className="text-xl font-medium leading-none">×</span>
                </button>
              )}
              <div className="absolute inset-y-0 right-1.5 flex items-center">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="h-9 px-5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-[#1a73e8]/70 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-6 text-xs font-medium text-red-400 md:text-red-500 bg-red-950/40 md:bg-red-50 border border-red-900/50 md:border-red-100 rounded-xl py-2.5 px-3.5 flex items-start gap-2 animate-fade-in leading-relaxed max-w-md text-center">
              <span className="font-bold text-red-400 md:text-red-600 mt-0.5">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500">
          <button 
            onClick={() => { setSearchedPlace(null); setQuery(""); }}
            className="mb-8 text-zinc-400 md:text-zinc-500 hover:text-white md:hover:text-zinc-900 flex items-center gap-2 font-medium transition-colors self-start cursor-pointer"
          >
            ← Search another business or website
          </button>

           <div className="w-full bg-zinc-900 md:bg-white rounded-3xl border border-zinc-800 md:border-zinc-200 shadow-xl overflow-hidden mb-8">
            <div className="w-full h-52 sm:h-60 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden flex items-center justify-center">
              {searchedPlace.bannerUrl ? (
                <>
                  <img 
                    src={searchedPlace.bannerUrl} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <img 
                    src={searchedPlace.bannerUrl} 
                    alt="Banner" 
                    className="relative z-20 max-h-full max-w-full object-contain p-4 drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a73e8] via-indigo-800 to-slate-900 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/30" />
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest z-10">
                    <Globe className="w-4 h-4" />
                    <span>Verified Web Listing</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 pt-16 sm:pt-20 relative bg-zinc-950 md:bg-white">
              <CopoBrandLogo
                domain={searchedPlace.brandDomain}
                name={searchedPlace.name}
                website={searchedPlace.website}
                logoUrl={searchedPlace.logoUrl}
                bannerUrl={searchedPlace.bannerUrl || searchedPlace.ogImage}
                className="absolute -top-10 sm:-top-12 left-6 sm:left-8 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-zinc-900 md:border-white bg-zinc-900 md:bg-white shadow-xl overflow-hidden flex items-center justify-center p-0.5 z-30 ring-1 ring-white/10 md:ring-black/10"
              />

              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-white md:text-zinc-900 mb-2">{searchedPlace.name}</h2>
                  <a href={searchedPlace.website} target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline flex items-center gap-1.5 font-medium">
                    <Globe className="w-4 h-4" />
                    {searchedPlace.brandDomain || searchedPlace.website?.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")}
                  </a>
                  {searchedPlace.description && (
                    <p className="text-zinc-300 md:text-zinc-600 mt-4 max-w-2xl text-sm leading-relaxed">
                      {searchedPlace.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRecordForPlace && onRecordForPlace(searchedPlace)}
                  className="shrink-0 bg-[#1a73e8] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-5 h-5" />
                  Record Review
                </button>
              </div>
            </div>
          </div>

          <div className="w-full">
            <h3 className="text-xl font-bold text-white md:text-zinc-900 mb-6 flex items-center gap-2">
              <Play className="w-5 h-5 text-[#1a73e8] fill-current" />
              Video Reviews ({placeVideos.length})
            </h3>
            
            {placeVideos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {placeVideos.map(video => (
                  <div 
                    key={video.id}
                    onClick={() => onSelectVideo(video.id)}
                    className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group bg-zinc-900 border border-zinc-800 md:border-transparent"
                  >
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                       <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-3 h-3 ${i < video.rating ? "text-yellow-400 fill-current" : "text-white/30"}`} />
                          ))}
                       </div>
                       <p className="text-white text-xs font-medium line-clamp-2">{video.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full py-10 bg-zinc-900 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="flex gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-zinc-700 md:text-zinc-300" strokeWidth={1.5} />
                  ))}
                </div>
                <h4 className="text-lg font-bold text-white md:text-zinc-900">No reviews yet</h4>
                <p className="text-zinc-400 md:text-zinc-500 text-sm mt-1 mb-6">Be the first to share your experience with this website!</p>
                <button
                  onClick={() => onRecordForPlace && onRecordForPlace(searchedPlace)}
                  className="bg-zinc-900 md:bg-white border-2 border-[#1a73e8] text-[#1a73e8] px-5 py-2.5 rounded-full font-bold shadow-sm hover:bg-zinc-800 md:hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Record the first review
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
