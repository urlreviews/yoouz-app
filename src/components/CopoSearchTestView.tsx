import React, { useState, useEffect, useRef } from "react";
import { Search, Globe, Video, Star, CheckCircle, Building2, MapPin, Loader2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { extractCleanDomain, formatBusinessName, KNOWN_OFFICIAL_NAMES, isPlaceReviewMatch } from "../utils/placeUtils";

interface CopoSearchTestViewProps {
  places: Place[];
  videos: VideoReview[];
  onRecordForPlace?: (place: Place) => void;
  onOpenPlace?: (placeId: string) => void;
  onSelectVideo?: (videoId: string) => void;
  onAddPlace?: (place: Place) => void;
}

interface SuggestionItem {
  id?: string;
  title: string;
  domain: string;
  logoUrl: string;
  category?: string;
  address?: string;
  source: string;
}

export const CopoSearchTestView: React.FC<CopoSearchTestViewProps> = ({
  places,
  videos,
  onRecordForPlace,
  onOpenPlace,
  onSelectVideo,
  onAddPlace
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const localMatches: SuggestionItem[] = places
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
          const serverList: SuggestionItem[] = data.suggestions || [];
          
          // Merge local matches with server suggestions (avoiding duplicates)
          const seen = new Set<string>();
          const merged: SuggestionItem[] = [];
          
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
        console.error("Search suggest error:", err);
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

  // Handle selecting a suggestion or submitting search
  const handleSelectSuggestion = async (item: SuggestionItem) => {
    setShowDropdown(false);
    setQuery(item.title);
    setIsLoadingPlace(true);

    const hasDomain = Boolean(item.domain && item.domain.includes('.') && item.domain !== '.com');
    const cleanDom = hasDomain ? extractCleanDomain(item.domain) || item.domain.toLowerCase() : "";
    const placeId = item.id || cleanDom || item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-\.\u0590-\u05FF]/g, '');

    // Check existing place in memory
    const existing = places.find(p => 
      p.id.toLowerCase() === placeId.toLowerCase() || 
      (cleanDom && p.brandDomain === cleanDom) ||
      (p.name && p.name.toLowerCase() === item.title.toLowerCase())
    );
    if (existing) {
      setSelectedPlace(existing);
      setIsLoadingPlace(false);
      return;
    }

    // 0ms INSTANT Display when domain is already known
    if (cleanDom) {
      const instantAvatar = item.logoUrl && !item.logoUrl.includes('domain=.com')
        ? item.logoUrl 
        : `/api/favicon?domain=${cleanDom}`;

      const instantPlace: Place = {
        id: cleanDom,
        name: item.title,
        category: item.category || "Verified Business",
        categoryType: "all",
        address: item.address || "",
        city: "",
        country: "",
        lat: 0,
        lng: 0,
        rating: 5,
        totalReviews: 0,
        ratingDistribution: { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
        avatarUrl: instantAvatar,
        logoUrl: instantAvatar,
        bannerUrl: "",
        ogImage: "",
        photos: [],
        isOpen: true,
        openingHours: "",
        phone: "",
        priceRange: "$$",
        plusCode: "",
        description: `${item.title} is a verified business on Yoouz, committed to delivering high quality services and customer satisfaction.`,
        popularKeywords: [],
        amenities: [],
        topDishes: [],
        website: `https://${cleanDom}`,
        brandDomain: cleanDom
      };
      setSelectedPlace(instantPlace);
      setIsLoadingPlace(false);
      if (onAddPlace) onAddPlace(instantPlace);
    } else {
      setIsLoadingPlace(true);
    }

    // Fetch full DuckDuckGo metadata in background for instant enrichment
    try {
      const fetchUrl = cleanDom 
        ? `/api/url-metadata?url=${encodeURIComponent(cleanDom)}`
        : `/api/url-metadata?q=${encodeURIComponent(item.title)}`;
        
      const resp = await fetch(fetchUrl);
      if (resp.ok) {
        const data = await resp.json();
        const resolvedDomain = data.domain || cleanDom;
        const resolvedName = (resolvedDomain && KNOWN_OFFICIAL_NAMES[resolvedDomain]) || data.title || formatBusinessName(data.siteName || data.title, resolvedDomain) || item.title;
        const resolvedAvatar = (data.logo && !data.logo.includes('domain=.com')) 
          ? data.logo 
          : (resolvedDomain ? `/api/favicon?domain=${resolvedDomain}` : "");

        const finalPlace: Place = {
          id: resolvedDomain || placeId,
          name: resolvedName,
          category: (data.category && data.category !== "Website") ? data.category : (item.category || "Verified Business"),
          categoryType: "all",
          address: data.address || item.address || "",
          city: data.city || "",
          country: data.country || "",
          lat: data.lat || 0,
          lng: data.lng || 0,
          rating: 5,
          totalReviews: 0,
          ratingDistribution: { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
          avatarUrl: resolvedAvatar,
          logoUrl: resolvedAvatar,
          bannerUrl: data.image || "",
          ogImage: data.image || "",
          photos: data.image ? [data.image] : [],
          isOpen: true,
          openingHours: data.openingHours || "",
          phone: data.phone || "",
          priceRange: "$$",
          plusCode: "",
          description: data.description || `${resolvedName} is a verified business on Yoouz, committed to delivering high quality services and customer satisfaction.`,
          popularKeywords: [],
          amenities: [],
          topDishes: [],
          website: resolvedDomain ? `https://${resolvedDomain}` : (data.url || ""),
          brandDomain: resolvedDomain || cleanDom
        };

        setSelectedPlace(finalPlace);
        if (onAddPlace) {
          onAddPlace(finalPlace);
        }
      }
    } catch (err) {
      console.error("Url metadata fetch error:", err);
    } finally {
      setIsLoadingPlace(false);
    }
  };

  const placeVideos = selectedPlace
    ? videos.filter(v => isPlaceReviewMatch(v, selectedPlace))
    : [];

  const averageRating = placeVideos.length > 0
    ? placeVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / placeVideos.length
    : (selectedPlace?.rating || 5.0);

  const totalReviewsCount = placeVideos.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-4 sm:p-8 selection:bg-white selection:text-black">
      {/* Sandbox Header Badge */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black text-xl shadow-lg">
            Y
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">Yoouz Search Lab</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sandbox Mode
              </span>
            </div>
            <p className="text-xs text-zinc-400">Testing Live As-You-Type Business Name & Domain Resolver (/searchtest)</p>
          </div>
        </div>
      </div>

      {/* Main Search Test Container */}
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Search Input Box */}
        <div className="relative w-full" ref={dropdownRef}>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Search Any Business:
          </label>
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              placeholder="Search any business..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-12 pr-12 py-4 text-base text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all shadow-xl font-medium"
            />
            {isLoadingSuggest && (
              <Loader2 className="absolute right-4 w-5 h-5 text-zinc-400 animate-spin" />
            )}
          </div>

          {/* Live Auto-Suggest Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/60 max-h-[360px] overflow-y-auto">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-4 py-3.5 flex items-center gap-3.5 hover:bg-zinc-800/80 transition-colors text-left cursor-pointer group"
                >
                  {item.domain || item.logoUrl ? (
                    <CopoBrandLogo
                      domain={item.domain}
                      name={item.title}
                      logoUrl={item.logoUrl}
                      className="w-9 h-9 rounded-xl border border-zinc-700 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1"
                      imageClassName="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl border border-zinc-700 bg-zinc-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0 text-zinc-300">
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
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Business Profile Preview Box */}
        {isLoadingPlace ? (
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl animate-pulse">
            <div className="h-32 sm:h-40 -mx-6 -mt-6 bg-zinc-800/80 mb-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
            </div>
            <div className="w-20 h-20 rounded-2xl border-4 border-zinc-900 bg-zinc-800 absolute top-20 left-6 flex items-center justify-center shadow-xl">
              <Building2 className="w-8 h-8 text-zinc-500 animate-pulse" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-7 w-2/3 bg-zinc-800 rounded-lg"></div>
              <div className="h-4 w-1/3 bg-zinc-800/80 rounded-md"></div>
              <div className="h-16 w-full bg-zinc-800/40 rounded-xl mt-4"></div>
            </div>
          </div>
        ) : selectedPlace ? (
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative transition-all animate-fade-in">
            {/* Banner Canvas */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-zinc-800 via-zinc-900 to-black relative overflow-hidden">
              {selectedPlace.bannerUrl ? (
                <img src={selectedPlace.bannerUrl} alt={selectedPlace.name} className="w-full h-full object-cover opacity-80 animate-fade-in" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  <Building2 className="w-12 h-12 opacity-30" />
                </div>
              )}
            </div>

            <div className="p-6 pt-16 relative">
              {/* Brand Logo Overlay */}
              <CopoBrandLogo
                domain={selectedPlace.brandDomain}
                name={selectedPlace.name}
                website={selectedPlace.website}
                logoUrl={selectedPlace.logoUrl}
                className="absolute -top-10 left-6 w-20 h-20 rounded-2xl border-4 border-zinc-900 bg-white shadow-2xl overflow-hidden flex items-center justify-center p-2 z-20"
                imageClassName="w-full h-full object-contain"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white leading-snug">
                    {(() => {
                      const name = (selectedPlace.name || "").trim();
                      const words = name.split(/\s+/);
                      if (words.length <= 1) {
                        return (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span>{words[0] || name}</span>
                            <CheckCircle className="w-5 h-5 fill-white text-zinc-950 shrink-0" />
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
                            <CheckCircle className="w-5 h-5 fill-white text-zinc-950 shrink-0" />
                          </span>
                        </>
                      );
                    })()}
                  </h2>

                  {/* Rating & Category */}
                  <div className="flex items-center gap-2.5 flex-wrap my-2 text-xs text-zinc-300">
                    {totalReviewsCount > 0 ? (
                      <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-amber-400">{averageRating.toFixed(1)}</span>
                        <span className="text-zinc-300">({totalReviewsCount} {totalReviewsCount === 1 ? "video review" : "video reviews"})</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-zinc-850 border border-zinc-750 px-2.5 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-none text-zinc-500 stroke-[1.5]" />
                        <span className="font-bold text-zinc-400">0.0</span>
                        <span className="text-zinc-400">(0 video reviews)</span>
                      </div>
                    )}

                    {selectedPlace.category && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-850 border border-zinc-750 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{selectedPlace.category}</span>
                      </span>
                    )}
                  </div>

                  {/* Website Link Line */}
                  {selectedPlace.website && selectedPlace.website !== "https://" && selectedPlace.brandDomain && (
                    <a href={selectedPlace.website} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white hover:underline flex items-center gap-1.5 text-xs font-medium mt-2">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{selectedPlace.brandDomain}</span>
                    </a>
                  )}
                </div>

                {/* Record Video Review Action */}
                <button
                  onClick={() => onRecordForPlace && onRecordForPlace(selectedPlace)}
                  className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Video className="w-5 h-5 text-zinc-950" />
                  <span>Record Video Review</span>
                </button>
              </div>

              {selectedPlace.description && (
                <p className="text-xs text-zinc-400 leading-relaxed mt-4 pt-4 border-t border-zinc-800">
                  {selectedPlace.description}
                </p>
              )}

              {/* Dynamic Video Reviews Grid */}
              {placeVideos.length > 0 ? (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>Customer Video Reviews ({placeVideos.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {placeVideos.map((vid) => (
                      <button
                        key={vid.id}
                        onClick={() => onSelectVideo && onSelectVideo(vid.id)}
                        className="relative aspect-[9/16] rounded-2xl overflow-hidden group bg-zinc-950 border border-zinc-800 hover:border-zinc-500 transition-all text-left shadow-lg cursor-pointer"
                      >
                        <CopoVideoThumbnail
                          video={vid}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-between p-3">
                          <div className="flex justify-end">
                            <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black text-amber-400 flex items-center gap-0.5 border border-white/5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {vid.rating || 5}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                              {vid.caption || "Customer Review"}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-medium truncate mt-1">
                              By @{vid.author?.handle?.replace(/^@/, "") || vid.author?.name || "Reviewer"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 pt-6 border-t border-zinc-800 text-center py-6">
                  <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-55" />
                  <p className="text-sm font-bold text-zinc-300">No video reviews yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Be the first to record an authentic video review for this business!</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
