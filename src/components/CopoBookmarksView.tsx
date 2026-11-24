import React, { useState } from "react";
import {
  Bookmark,
  Star,
  Camera,
  Trash2,
  Compass,
  MapPin,
  ChevronLeft,
  Store,
  User,
  CheckCircle2
} from "lucide-react";
import { VideoReview, UserProfile, Place } from "../types";
import { getDisplayUrlAsDomain, formatCityCountry, formatBusinessName, extractCleanDomain, getSafeAvatarUrl } from "../utils/placeUtils";
import { formatCompactRecency } from "../utils/dateUtils";
import { classifyBusinessCategory } from "../utils/categoryUtils";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { getRoundedRating } from "./CopoStarRating";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoBookmarksViewProps {
  bookmarkedVideos: VideoReview[];
  savedPlaces?: Place[];
  savedCreators?: any[]; // VideoAuthor[]
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onSelectVideo: (videoId: string) => void;
  onRemoveBookmark?: (videoId: string) => void;
  onNavigateHome?: () => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
  onSelectPlace?: (placeId: string) => void;
  onSelectCreator?: (author: any) => void;
  onRemovePlace?: (place: Place) => void;
  onRemoveCreator?: (author: any) => void;
}

type TabType = "videos" | "places" | "creators";

export const CopoBookmarksView: React.FC<CopoBookmarksViewProps> = ({
  bookmarkedVideos,
  savedPlaces = [],
  savedCreators = [],
  currentUser,
  onOpenAuth,
  onOpenHelp,
  onOpenLegal,
  onSelectVideo,
  onRemoveBookmark,
  onNavigateHome,
  onSuccessAuth,
  onSelectPlace,
  onSelectCreator,
  onRemovePlace,
  onRemoveCreator
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("videos");

  // Helper to clean up any raw URL addresses in list views
  const cleanDisplayAddress = (address: string) => {
    if (!address) return "";
    if (
      address.startsWith("http") ||
      address.includes("www.") ||
      address.includes(".com") ||
      address.includes(".fr") ||
      address.includes(".io")
    ) {
      return address.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
    }
    return address;
  };

  // Quick unsave video handler
  const handleUnsaveVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop navigation click
    if (onRemoveBookmark) {
      onRemoveBookmark(videoId);
    }
  };

  // Quick unsave place handler
  const handleUnsavePlace = (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemovePlace) {
      onRemovePlace(place);
    }
  };

  // Quick unsave creator handler
  const handleUnsaveCreator = (creator: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveCreator) {
      onRemoveCreator(creator);
    }
  };

  return (
    <div className="flex-1 h-full w-full max-w-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y bg-[#050506] text-white p-4 md:p-8 select-none" style={{ paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 border border-white/[0.1]"
                title="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-white/[0.05] text-white flex items-center justify-center border border-white/[0.1]">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white tracking-[-0.02em]">{t("nav.bookmarks", "Saved")}</h2>
              <p className="text-xs text-zinc-400 font-semibold">
                {t("bookmarks.subtitle", "Your saved visual reviews, places & creators")}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("videos")}
            className={`pb-3 relative cursor-pointer transition-all ${
              activeTab === "videos" ? "text-white font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              {t("bookmarks.tabPhotos", "Photos")} ({bookmarkedVideos.length})
            </span>
            {activeTab === "videos" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full animate-fade-in" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("places")}
            className={`pb-3 relative cursor-pointer transition-all ${
              activeTab === "places" ? "text-white font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              {t("bookmarks.tabPlaces", "Places")} ({savedPlaces.length})
            </span>
            {activeTab === "places" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full animate-fade-in" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("creators")}
            className={`pb-3 relative cursor-pointer transition-all ${
              activeTab === "creators" ? "text-white font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t("bookmarks.tabReviewers", "Reviewers")} ({savedCreators.length})
            </span>
            {activeTab === "creators" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full animate-fade-in" />
            )}
          </button>
        </div>

        {/* 1. PHOTOS TAB — Unified Signature Photo Review Card Grid */}
        {activeTab === "videos" && (
          bookmarkedVideos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {bookmarkedVideos.map((video) => {
                const wholeStars = getRoundedRating(video.rating || 5);
                const bDomain = extractCleanDomain(video.placeWebsite || video.placeId || "") || getDisplayUrlAsDomain(video);
                const bName = formatBusinessName(video.placeName || bDomain) || "Business";
                const recency = formatCompactRecency(video.recordedAt, video.createdAtMs);
                const catInfo = classifyBusinessCategory({
                  rawCategory: video.placeCategory,
                  name: bName,
                  domain: bDomain
                });
                const reviewerName = video.author?.name || video.authorName || "Reviewer";

                return (
                  <div
                    key={`saved-list-${video.id}`}
                    onClick={() => onSelectVideo(video.id)}
                    className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-[#111114] border border-white/[0.09] hover:border-white/[0.24] shadow-[0_12px_32px_rgba(0,0,0,0.55)] group cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <CopoVideoThumbnail
                      video={video}
                      alt={`${bName} photo review by ${reviewerName}`}
                      className="w-full h-full object-cover group-hover:scale-[1.035] transition-transform duration-500 ease-out pointer-events-none"
                    />

                    {/* Smooth Editorial Bottom Scrim */}
                    <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.74)_46%,rgba(0,0,0,0.22)_78%,transparent_100%)] pointer-events-none" />

                    {/* Top Row: Category Left + Recency & Unsave Right */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/[0.15] text-[10px] font-medium text-white/95 leading-none truncate max-w-[92px]">
                        {catInfo.badgeLabel}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-black/48 backdrop-blur-md border border-white/[0.12] text-[10px] font-medium text-white/85 leading-none tabular-nums">
                          {recency}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleUnsaveVideo(video.id, e)}
                          className="pointer-events-auto p-1 rounded-full bg-black/65 hover:bg-red-600/90 text-zinc-200 hover:text-white backdrop-blur-md border border-white/[0.14] transition-colors cursor-pointer"
                          title="Unsave"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Customer Review Info: 5-Star Rating + Brand Logo & Name + Review by */}
                    <div className="absolute bottom-2.5 inset-x-2.5 sm:inset-x-3 flex flex-col justify-end gap-1.5 pointer-events-none z-10">
                      <div className="flex items-center gap-1.5" aria-label={`Rated ${wholeStars} out of 5 stars`}>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3 h-3 ${
                                starIdx <= wholeStars
                                  ? "fill-[#F5B942] text-[#F5B942]"
                                  : "fill-white/15 text-white/25"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10.5px] font-semibold text-white/95 leading-none tabular-nums">
                          {wholeStars}/5
                        </span>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetPlaceId = bDomain || video.placeId || bName;
                            if (onSelectPlace && targetPlaceId) onSelectPlace(targetPlaceId);
                          }}
                          aria-label={`Open ${bName} profile`}
                          title={`View ${bName} profile`}
                          className="pointer-events-auto shrink-0 rounded-[8px] bg-transparent border-0 p-0 cursor-pointer hover:scale-[1.05] active:scale-95 transition-transform outline-none"
                        >
                          <CopoBrandLogo
                            domain={bDomain || video.placeId}
                            name={bName}
                            logoUrl={video.placeLogoUrl}
                            className="w-7 h-7 rounded-[8px] bg-white/95 border border-white/25 flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-sm"
                            imageClassName="w-full h-full object-contain"
                            fallbackTextClassName="text-[10px] font-bold text-zinc-900"
                          />
                        </button>
                        <div className="min-w-0 flex-1 flex flex-col items-start">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetPlaceId = bDomain || video.placeId || bName;
                              if (onSelectPlace && targetPlaceId) onSelectPlace(targetPlaceId);
                            }}
                            title={`View ${bName} profile`}
                            className="pointer-events-auto flex items-center gap-1 min-w-0 max-w-full text-left bg-transparent border-0 p-0 cursor-pointer group/biz outline-none"
                          >
                            <span className="text-white text-[12px] font-semibold tracking-[-0.015em] truncate leading-tight group-hover/biz:underline decoration-white/60 underline-offset-2">
                              {bName}
                            </span>
                            <CheckCircle2 className="w-3 h-3 fill-white text-zinc-950 shrink-0" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectCreator && video.author) onSelectCreator(video.author);
                            }}
                            title={`View ${reviewerName}'s profile`}
                            className="pointer-events-auto text-white/75 hover:text-white text-[10px] font-normal truncate max-w-full mt-0.5 text-left bg-transparent border-0 p-0 cursor-pointer hover:underline decoration-white/50 underline-offset-2 transition-colors outline-none"
                          >
                            {t("feed.reviewBy", "Review by")} {reviewerName}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-900/50 rounded-3xl border border-zinc-850">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                {t("photo.no_reviews", "No photo reviews saved yet")}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6 font-medium">
                {t("bookmarks.photosEmpty", "Tap the bookmark icon on any photo review to save it.")}
              </p>
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-white hover:bg-zinc-200 text-zinc-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t("nav.discover", "Discover Reviews")}</span>
                </button>
              )}
            </div>
          )
        )}

        {/* 2. PLACES TAB */}
        {activeTab === "places" && (
          savedPlaces.length > 0 ? (
            <div className="space-y-3">
              {savedPlaces.map((place) => {
                const cleanDomain = extractCleanDomain(place.id || place.website || place.brandDomain || place.name);
                const formattedTitle = formatBusinessName(place.name || cleanDomain) || t("common.businessPlace", "Business Place");

                return (
                  <div
                    key={`saved-place-list-${place.id}`}
                    onClick={() => onSelectPlace && onSelectPlace(place.id)}
                    className="group bg-zinc-900 rounded-2xl border border-zinc-800 p-4 hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <CopoBrandLogo
                        domain={cleanDomain}
                        name={formattedTitle}
                        website={place.website}
                        logoUrl={place.logoUrl || place.avatarUrl}
                        bannerUrl={place.bannerUrl}
                        className="w-12 h-12 rounded-xl bg-white p-1.5 border border-zinc-200/60 shrink-0 shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform ring-1 ring-white/10"
                        imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast]"
                        fallbackTextClassName="font-extrabold text-xs text-zinc-950"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-sm line-clamp-2 [overflow-wrap:anywhere] leading-snug">{formattedTitle}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-300 text-[10px] font-bold border border-zinc-750 shrink-0">
                            {place.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                          <div className="flex items-center text-amber-400 font-bold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                            <span>{place.rating?.toFixed(1) || "5.0"} ({place.totalReviews || 0})</span>
                          </div>
                          {(place.city || place.address || place.brandDomain || place.website) && (
                            <>
                              <span className="text-zinc-750">|</span>
                              <span className="truncate">{place.city || place.address || place.brandDomain || (place.website ? place.website.replace(/^https?:\/\//, '') : "")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleUnsavePlace(place, e)}
                        className="p-2 rounded-full hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 transition-all cursor-pointer"
                        title="Unsave Place"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-900/50 rounded-3xl border border-zinc-850">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                {t("place.no_saved_places", "No saved places yet")}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6 font-medium">
                {t("bookmarks.placesEmpty", "Grab places you want to visit from the map or review screens to build your bucket list.")}
              </p>
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-white hover:bg-zinc-200 text-zinc-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t("nav.search", "Explore Map")}</span>
                </button>
              )}
            </div>
          )
        )}

        {/* 3. CREATORS TAB */}
        {activeTab === "creators" && (
          savedCreators.length > 0 ? (
            <div className="space-y-3">
              {savedCreators.map((creator) => (
                <div
                  key={`saved-creator-list-${creator.name}`}
                  onClick={() => onSelectCreator && onSelectCreator(creator)}
                  className="group bg-zinc-900 rounded-2xl border border-zinc-800 p-4 hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={getSafeAvatarUrl(creator.avatar, creator.name, creator.handle)}
                      alt={creator.name}
                      className="w-11 h-11 rounded-full border border-zinc-800 shrink-0 object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = getSafeAvatarUrl(null, creator.name, creator.handle);
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm truncate leading-snug">{creator.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">
                          {formatCityCountry(creator) || (creator.videoReviewCount ? `${creator.videoReviewCount} ${creator.videoReviewCount === 1 ? t("common.photoReview", "photo review") : t("common.photoReviews", "photo reviews")}` : t("profile.communityReviewer", "Community Reviewer"))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleUnsaveCreator(creator, e)}
                      className="p-2 rounded-full hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 transition-all cursor-pointer"
                      title="Unsave Reviewer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-900/50 rounded-3xl border border-zinc-850">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                {t("profile.no_saved_reviewers", "No saved reviewers yet")}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6 font-medium">
                {t("bookmarks.reviewersEmpty", "Save trusted local guides & creators to instantly track their latest visual reviews.")}
              </p>
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-white hover:bg-zinc-200 text-zinc-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t("nav.discover", "Find Reviewers")}</span>
                </button>
              )}
            </div>
          )
        )}

      </div>
    </div>
  );
};
