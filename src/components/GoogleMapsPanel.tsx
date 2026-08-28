import React, { useState, useMemo } from "react";
import {
  Star,
  Search,
  ArrowUpDown,
  Video,
  Info,
  Navigation,
  Bookmark,
  Share2,
  Phone,
  Globe,
  Clock,
  MapPin,
  Camera,
  ChevronDown,
  Sparkles,
  Check,
  Tag
} from "lucide-react";
import { Place, VideoReview } from "../types";
import { formatBusinessName } from "../utils/placeUtils";
import { GoogleVideoReviewCard } from "./GoogleVideoReviewCard";

interface GoogleMapsPanelProps {
  place: Place;
  videoReviews: VideoReview[];
  activeTab: "overview" | "reviews" | "about";
  onSelectTab: (tab: "overview" | "reviews" | "about") => void;
  onOpenRecord: () => void;
  onOpenDirections: () => void;
  onToggleBookmarkPlace: (placeId: string) => void;
  isBookmarked: boolean;
  onOpenVideoModal: (review: VideoReview) => void;
  onToggleLikeReview: (reviewId: string) => void;
  onShareReview: (review: VideoReview) => void;
}

export const GoogleMapsPanel: React.FC<GoogleMapsPanelProps> = ({
  place,
  videoReviews,
  activeTab,
  onSelectTab,
  onOpenRecord,
  onOpenDirections,
  onToggleBookmarkPlace,
  isBookmarked,
  onOpenVideoModal,
  onToggleLikeReview,
  onShareReview
}) => {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [reviewSearchQuery, setReviewSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<"helpful" | "newest" | "highest" | "lowest">("helpful");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter video reviews for this place
  const placeVideoReviews = useMemo(() => {
    let list = videoReviews.filter((vr) => vr.placeId === place.id);
    if (selectedTag && selectedTag !== "All") {
      const lowerTag = selectedTag.toLowerCase();
      list = list.filter(
        (vr) =>
          vr.tags.some((t) => t.toLowerCase().includes(lowerTag)) ||
          (vr.dishOrItem && vr.dishOrItem.toLowerCase().includes(lowerTag)) ||
          vr.caption.toLowerCase().includes(lowerTag)
      );
    }
    if (reviewSearchQuery.trim()) {
      const q = reviewSearchQuery.toLowerCase();
      list = list.filter(
        (vr) =>
          vr.caption.toLowerCase().includes(q) ||
          vr.author.name.toLowerCase().includes(q) ||
          (vr.dishOrItem && vr.dishOrItem.toLowerCase().includes(q))
      );
    }

    if (sortOption === "newest") {
      // already sorted
    } else if (sortOption === "highest") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "lowest") {
      list = [...list].sort((a, b) => a.rating - b.rating);
    } else {
      list = [...list].sort((a, b) => b.likes - a.likes);
    }
    return list;
  }, [videoReviews, place.id, selectedTag, reviewSearchQuery, sortOption]);

  const totalRating = place.totalReviews || 1117;
  const dist = place.ratingDistribution || {
    stars5: 720,
    stars4: 250,
    stars3: 90,
    stars2: 35,
    stars1: 22
  };

  const getPercent = (count: number) => {
    return Math.round((count / totalRating) * 100);
  };

  return (
    <aside
      id="google-maps-place-drawer"
      className="w-full md:w-[412px] h-[calc(100vh-70px)] md:h-full bg-white shadow-xl flex flex-col z-20 overflow-y-auto border-r border-[#dadce0] select-text"
    >
      {/* 1. Header Banner & Photo Gallery */}
      {(place.bannerUrl || (place.photos && place.photos.length > 0)) && (
        <div className="relative h-48 w-full shrink-0 bg-zinc-950 overflow-hidden">
          <img
            src={place.bannerUrl || place.photos?.[0] || undefined}
            alt={formatBusinessName(place.name)}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10" />

          {/* Photos pill badge */}
          {((place.photos && place.photos.length > 0) || placeVideoReviews.length > 0) && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 border border-white/20 z-20">
              <Camera className="w-3.5 h-3.5" />
              <span>{(place.photos?.length || 0) + placeVideoReviews.length} media</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Place Title & Core Attributes */}
      <div className="p-4 pb-2 border-b border-[#dadce0]">
        <h1 className="text-[22px] font-medium text-[#202124] leading-snug font-['Google_Sans',Roboto,sans-serif]">
          {formatBusinessName(place.name)}
        </h1>

        <div className="flex items-center gap-1.5 mt-1 text-[13px] text-[#70757a]">
          <span className="font-bold text-[#202124] text-[14px]">{place.rating}</span>
          <div className="flex items-center text-[#e37400]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(place.rating)
                    ? "fill-[#fbbc04] text-[#fbbc04]"
                    : "text-[#dadce0] fill-[#dadce0]"
                }`}
              />
            ))}
          </div>
          <span>({(place.totalReviews || 0).toLocaleString()})</span>
          <span>•</span>
          <span>{place.category}</span>
        </div>

        {/* Quick Action Buttons: Directions, Save, Nearby, Share */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-1 pb-1">
          <button
            onClick={onOpenDirections}
            className="flex flex-col items-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full border border-[#dadce0] flex items-center justify-center text-[#1a73e8] group-hover:bg-blue-50 group-hover:border-[#1a73e8] transition-colors">
              <Navigation className="w-5 h-5 fill-[#1a73e8]" />
            </div>
            <span className="text-[11px] font-medium text-[#1a73e8]">Directions</span>
          </button>

          <button
            onClick={() => onToggleBookmarkPlace(place.id)}
            className="flex flex-col items-center gap-1.5 text-center group cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isBookmarked
                  ? "border-[#1a73e8] bg-blue-50 text-[#1a73e8]"
                  : "border-[#dadce0] text-[#1a73e8] group-hover:bg-blue-50"
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-[#1a73e8]" : ""}`} />
            </div>
            <span className="text-[11px] font-medium text-[#1a73e8]">
              {isBookmarked ? "Saved" : "Save"}
            </span>
          </button>

          <button
            onClick={onOpenRecord}
            className="flex flex-col items-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center hover:bg-[#1557b0] shadow-sm transition-colors">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-[#1a73e8]">Add Review</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: formatBusinessName(place.name), url: window.location.href }).catch(() => {});
              }
            }}
            className="flex flex-col items-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full border border-[#dadce0] flex items-center justify-center text-[#1a73e8] group-hover:bg-blue-50 group-hover:border-[#1a73e8] transition-colors">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-[#1a73e8]">Share</span>
          </button>
        </div>
      </div>

      {/* 3. Navigation Tabs matching Google Maps (Overview | Reviews | About) */}
      <div className="flex items-center border-b border-[#dadce0] px-4 font-['Google_Sans',Roboto,sans-serif]">
        <button
          id="tab-overview"
          onClick={() => onSelectTab("overview")}
          className={`py-3.5 px-3 text-[14px] font-medium cursor-pointer relative transition-colors ${
            activeTab === "overview" ? "text-[#1a73e8] font-bold" : "text-[#5f6368] hover:text-[#202124]"
          }`}
        >
          Overview
          {activeTab === "overview" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a73e8] rounded-full" />
          )}
        </button>

        <button
          id="tab-reviews"
          onClick={() => onSelectTab("reviews")}
          className={`py-3.5 px-3 text-[14px] font-medium cursor-pointer relative transition-colors ${
            activeTab === "reviews" ? "text-[#1a73e8] font-bold" : "text-[#5f6368] hover:text-[#202124]"
          }`}
        >
          Reviews
          {activeTab === "reviews" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a73e8] rounded-full" />
          )}
        </button>

        <button
          id="tab-about"
          onClick={() => onSelectTab("about")}
          className={`py-3.5 px-3 text-[14px] font-medium cursor-pointer relative transition-colors ${
            activeTab === "about" ? "text-[#1a73e8] font-bold" : "text-[#5f6368] hover:text-[#202124]"
          }`}
        >
          About
          {activeTab === "about" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a73e8] rounded-full" />
          )}
        </button>
      </div>

      {/* 4. Tab Content */}
      <div className="flex-1 p-4">
        {/* TAB 1: REVIEWS (100% Video-Only Reviews matching Google Maps screenshot) */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {/* Overall Rating & Breakdown Bars matching Screenshot */}
            <div className="grid grid-cols-[1fr_1.5fr] gap-4 items-center">
              {/* Left: 5-Star Distribution Bars */}
              <div className="space-y-1.5 text-[12px] font-medium text-[#70757a]">
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const key = `stars${starNum}` as keyof typeof dist;
                  const count = dist[key];
                  const percent = getPercent(count);
                  return (
                    <div key={starNum} className="flex items-center gap-2">
                      <span className="w-2">{starNum}</span>
                      <div className="flex-1 h-2 bg-[#e8eaed] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#fbbc04] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Big Score 4.3 + Stars + Review Count */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[44px] font-normal leading-none text-[#202124] font-['Google_Sans',Roboto,sans-serif]">
                  {place.rating}
                </span>
                <div className="flex items-center gap-0.5 my-1 text-[#fbbc04]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(place.rating)
                          ? "fill-[#fbbc04] text-[#fbbc04]"
                          : "text-[#dadce0] fill-[#dadce0]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-[#70757a]">
                  {(place.totalReviews || 0).toLocaleString()} reviews
                </span>
              </div>
            </div>

            {/* Notice: Reviews aren't verified */}
            <div className="flex items-center gap-1.5 text-[12px] text-[#70757a] pt-1">
              <span>Video reviews aren't verified</span>
              <Info className="w-3.5 h-3.5 text-[#70757a]" />
            </div>

            {/* Prominent Google Blue Button: Record a video review */}
            <button
              id="btn-write-review-pill"
              onClick={onOpenRecord}
              className="w-full h-10 px-4 rounded-full bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] font-medium text-[14px] flex items-center justify-center gap-2 transition-colors border border-[#d2e3fc]"
            >
              <Video className="w-4 h-4 text-[#1a73e8]" />
              <span>Record a video review</span>
            </button>

            {/* Reviews Search Bar & Sort Button */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-9 bg-white rounded-full border border-[#dadce0] flex items-center px-3 text-[13px] focus-within:border-blue-500">
                <Search className="w-4 h-4 text-[#70757a] shrink-0 mr-2" />
                <input
                  type="text"
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  placeholder="Search in reviews"
                  className="w-full bg-transparent outline-none text-[#202124] placeholder-[#70757a]"
                />
              </div>

              <div className="relative">
                <button
                  id="btn-sort-reviews"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="h-9 px-3 rounded-full border border-[#dadce0] hover:bg-gray-50 flex items-center gap-1.5 text-[13px] font-medium text-[#3c4043] transition-colors"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sort</span>
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-xl border border-[#dadce0] p-1 z-30 space-y-0.5 text-[13px]">
                    <button
                      onClick={() => {
                        setSortOption("helpful");
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Most helpful</span>
                      {sortOption === "helpful" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setSortOption("newest");
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Newest</span>
                      {sortOption === "newest" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setSortOption("highest");
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Highest rating</span>
                      {sortOption === "highest" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Keyword Filter Chips matching Screenshot (All, fruit 19, cash desk 17, etc.) */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {place.popularKeywords?.map((item) => {
                const isSelected = selectedTag === item.tag;
                return (
                  <button
                    key={item.tag}
                    onClick={() => setSelectedTag(item.tag)}
                    className={`h-8 px-3 rounded-full text-[13px] font-normal transition-all border ${
                      isSelected
                        ? "bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] font-medium"
                        : "bg-white text-[#3c4043] border-[#dadce0] hover:bg-gray-50"
                    }`}
                  >
                    <span>{item.tag}</span>
                    {item.tag !== "All" && (
                      <span className="text-[11px] text-[#70757a] ml-1.5">{item.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Video-Only Reviews Feed */}
            <div className="pt-2">
              {placeVideoReviews.length > 0 ? (
                placeVideoReviews.map((review) => (
                  <GoogleVideoReviewCard
                    key={review.id}
                    review={review}
                    onOpenVideoModal={onOpenVideoModal}
                    onToggleLike={onToggleLikeReview}
                    onShareReview={onShareReview}
                  />
                ))
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4 text-[14px] text-[#202124]">
            {place.description && (
              <p className="text-[#3c4043] leading-relaxed text-[13px] bg-[#f8f9fa] p-3 rounded-xl border border-[#dadce0]">
                {place.description}
              </p>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#1a73e8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#202124]">{place.address}</p>
                  {place.plusCode && (
                    <p className="text-[12px] text-[#70757a]">{place.plusCode}</p>
                  )}
                </div>
              </div>

              {place.openingHours && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#1a73e8] shrink-0" />
                  <div>
                    <span className={`font-medium ${place.isOpen !== false ? "text-emerald-700" : "text-amber-700"}`}>
                      {place.openingHours}
                    </span>
                  </div>
                </div>
              )}

              {place.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#1a73e8] shrink-0" />
                  <a href={`tel:${place.phone}`} className="text-[#1a73e8] hover:underline">
                    {place.phone}
                  </a>
                </div>
              )}

              {place.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#1a73e8] shrink-0" />
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1a73e8] hover:underline truncate max-w-[280px]"
                  >
                    {place.website.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")}
                  </a>
                </div>
              )}
            </div>

            {/* Popular video reviewed items */}
            {place.topDishes && place.topDishes.length > 0 && (
              <div className="pt-3">
                <h3 className="font-medium text-[15px] mb-2 font-['Google_Sans',Roboto,sans-serif]">
                  Top Video-Reviewed Items
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(place.topDishes || []).map((dish) => (
                    <span
                      key={dish}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1a73e8] text-xs font-medium border border-blue-100 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {dish}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ABOUT */}
        {activeTab === "about" && (
          <div className="space-y-4 text-[14px] text-[#202124]">
            {/* Full Business Description & URL Metadata */}
            <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#dadce0] space-y-1.5">
              <h4 className="font-bold text-[13px] text-[#202124] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#1a73e8]" />
                <span>About {formatBusinessName(place.name)}</span>
              </h4>
              <p className="text-[13px] text-[#3c4043] leading-relaxed font-normal">
                {place.description || "Verified Yoouz business listing with authentic video reviews from real users."}
              </p>
            </div>

            <h3 className="font-medium text-[15px] font-['Google_Sans',Roboto,sans-serif] pt-1">
              Amenities & Offerings
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {(place.amenities || ["Wheelchair accessible entrance", "Public Reception", "Verified Listing"]).map((amenity) => (
                <div key={amenity} className="flex items-center gap-2.5 text-[#3c4043]">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
