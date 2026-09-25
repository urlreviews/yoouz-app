import React, { useState, useEffect, useRef } from "react";
import { Search, Globe, Video, Star, CheckCircle, Building2, MapPin, Loader2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { extractCleanDomain, formatBusinessName, KNOWN_OFFICIAL_NAMES } from "../utils/placeUtils";

interface CopoSearchTestViewProps {
  places: Place[];
  videos: VideoReview[];
  onRecordForPlace?: (place: Place) => void;
  onOpenPlace?: (placeId: string) => void;
}

interface SuggestionItem {
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
  onOpenPlace
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live Auto-Suggest debounce (triggers after 2 characters)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggest(false);
      setShowDropdown(false);
      return;
    }

    setIsLoadingSuggest(true);
    setShowDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}`);
        if (resp.ok) {
          const data = await resp.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error("Search suggest error:", err);
      } finally {
        setIsLoadingSuggest(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

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
    const placeId = cleanDom || item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-\.\u0590-\u05FF]/g, '');

    // Check existing place in memory
    const existing = places.find(p => 
      p.id.toLowerCase() === placeId || 
      (cleanDom && p.brandDomain === cleanDom) ||
      (p.name && p.name.toLowerCase() === item.title.toLowerCase())
    );
    if (existing) {
      setSelectedPlace(existing);
      setIsLoadingPlace(false);
      return;
    }

    // Set optimistic place
    const officialName = (cleanDom && KNOWN_OFFICIAL_NAMES[cleanDom]) || item.title || formatBusinessName(cleanDom) || item.title;
    const avatar = item.logoUrl && !item.logoUrl.includes('domain=.com') && !item.logoUrl.includes('domain=')
      ? item.logoUrl
      : (cleanDom ? `/api/favicon?domain=${cleanDom}` : `/api/avatar?name=${encodeURIComponent(officialName)}`);

    const optimisticPlace: Place = {
      id: placeId,
      name: officialName,
      category: item.category || "Verified Business",
      categoryType: "all",
      address: item.address || "",
      city: "",
      country: "",
      lat: 0,
      lng: 0,
      rating: 5,
      totalReviews: 1,
      ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
      avatarUrl: avatar,
      logoUrl: avatar,
      bannerUrl: "",
      ogImage: "",
      photos: [],
      isOpen: true,
      openingHours: "",
      phone: "",
      priceRange: "$$",
      plusCode: "",
      description: `${officialName} is a verified business on Yoouz, committed to delivering high quality services and customer satisfaction.`,
      popularKeywords: [],
      amenities: [],
      topDishes: [],
      website: cleanDom ? `https://${cleanDom}` : "",
      brandDomain: cleanDom
    };

    setSelectedPlace(optimisticPlace);

    // Fetch full metadata in background if real website domain exists or resolve it via name query
    try {
      const fetchUrl = cleanDom 
        ? `/api/url-metadata?url=${encodeURIComponent(cleanDom)}`
        : `/api/url-metadata?q=${encodeURIComponent(officialName)}`;
        
      const resp = await fetch(fetchUrl);
      if (resp.ok) {
        const data = await resp.json();
        const resolvedDomain = data.domain || cleanDom;
        const resolvedName = (resolvedDomain && KNOWN_OFFICIAL_NAMES[resolvedDomain]) || formatBusinessName(data.siteName || data.title, resolvedDomain) || optimisticPlace.name;
        const resolvedAvatar = (data.logo && !data.logo.includes('domain=.com')) 
          ? data.logo 
          : (resolvedDomain ? `/api/favicon?domain=${resolvedDomain}` : optimisticPlace.avatarUrl);

        setSelectedPlace(prev => prev ? {
          ...prev,
          name: resolvedName,
          category: (data.category && data.category !== "Website") ? data.category : prev.category,
          address: data.address || prev.address,
          city: data.city || prev.city,
          country: data.country || prev.country,
          logoUrl: resolvedAvatar,
          avatarUrl: resolvedAvatar,
          bannerUrl: data.image || prev.bannerUrl,
          description: data.description || prev.description,
          website: resolvedDomain ? `https://${resolvedDomain}` : prev.website,
          brandDomain: resolvedDomain || prev.brandDomain
        } : null);
      }
    } catch (err) {
      console.error("Url metadata fetch error:", err);
    } finally {
      setIsLoadingPlace(false);
    }
  };

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
            Search Business by Name or Website Domain (Any Language):
          </label>
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              placeholder="e.g. Auto Werkplaats Brugge or autowerkplaatsbrugge.be..."
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
                  <CopoBrandLogo
                    domain={item.domain}
                    name={item.title}
                    logoUrl={item.logoUrl}
                    className="w-9 h-9 rounded-xl border border-zinc-700 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1"
                    imageClassName="w-full h-full object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                        {item.title}
                      </span>
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
                      {item.domain && <span className="text-zinc-500 truncate">{item.domain}</span>}
                      {item.category && (
                        <>
                          {item.domain && <span className="text-zinc-700">•</span>}
                          <span className="text-zinc-400 truncate">{item.category}</span>
                        </>
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
        {selectedPlace && (
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative transition-all">
            {/* Banner Canvas */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-zinc-800 via-zinc-900 to-black relative overflow-hidden">
              {selectedPlace.bannerUrl ? (
                <img src={selectedPlace.bannerUrl} alt={selectedPlace.name} className="w-full h-full object-cover opacity-80" />
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
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <span>{selectedPlace.name}</span>
                    <CheckCircle className="w-5 h-5 fill-white text-zinc-950 shrink-0" />
                  </h2>

                  {/* Rating & Category */}
                  <div className="flex items-center gap-2.5 flex-wrap my-2 text-xs text-zinc-300">
                    <div className="inline-flex items-center gap-1.5 bg-zinc-850 border border-zinc-750 px-2.5 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-extrabold text-amber-400">5.0</span>
                      <span className="text-zinc-400">(1 review)</span>
                    </div>

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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
