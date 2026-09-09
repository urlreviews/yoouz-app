import React, { useState } from "react";
import {
  Bookmark,
  Star,
  Play,
  Trash2,
  Compass,
  MapPin,
  ChevronLeft,
  Store,
  User
} from "lucide-react";
import { VideoReview, UserProfile, Place } from "../types";
import { getDisplayUrlAsDomain } from "../utils/placeUtils";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";
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

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-900 text-white md:text-white flex flex-col justify-between pb-32 md:pb-6" >
        <CopoAuthPrompt
          intent="bookmarks"
          onOpenHelp={onOpenHelp}
          onOpenLegal={onOpenLegal}
          onSuccess={onSuccessAuth}
          isFullPage={true}
        />
      </div>
    );
  }

  // Helper to clean up any raw URL addresses in list views
  const cleanDisplayAddress = (address: string) => {
    if (!address) return "San Francisco";
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
    <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-950 text-white md:text-white p-4 md:p-8 select-none" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800 md:border-zinc-800">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm border border-zinc-800"
                title="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs border border-zinc-800">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{t("nav.bookmarks", "Bookmarks")}</h2>
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
              activeTab === "videos" ? "text-amber-400 font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" />
              {t("bookmarks.tabVideos", "Videos")} ({bookmarkedVideos.length})
            </span>
            {activeTab === "videos" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full animate-fade-in" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("places")}
            className={`pb-3 relative cursor-pointer transition-all ${
              activeTab === "places" ? "text-amber-400 font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              {t("bookmarks.tabPlaces", "Places")} ({savedPlaces.length})
            </span>
            {activeTab === "places" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full animate-fade-in" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("creators")}
            className={`pb-3 relative cursor-pointer transition-all ${
              activeTab === "creators" ? "text-amber-400 font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t("bookmarks.tabReviewers", "Reviewers")} ({savedCreators.length})
            </span>
            {activeTab === "creators" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full animate-fade-in" />
            )}
          </button>
        </div>

        {/* 1. VIDEOS TAB */}
        {activeTab === "videos" && (
          bookmarkedVideos.length > 0 ? (
            <div className="space-y-3">
              {bookmarkedVideos.map((video) => (
                <div
                  key={`saved-list-${video.id}`}
                  onClick={() => onSelectVideo(video.id)}
                  className="group bg-zinc-900 md:bg-zinc-900 rounded-2xl border border-zinc-800 md:border-zinc-800 p-4 hover:bg-zinc-800/80 md:hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-black border border-zinc-800 md:border-zinc-800 shrink-0 shadow-xs">
                      <CopoVideoThumbnail
                        video={video}
                        alt={video.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate leading-snug">
                          {getDisplayUrlAsDomain(video)}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-300 text-[10px] font-bold border border-zinc-750 shrink-0">
                          {video.placeCategory}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-200 mt-1">
                        <div className="flex items-center text-amber-400 font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                          <span>{typeof video.rating === "number" && !isNaN(video.rating) ? video.rating.toFixed(1) : (Number(video.rating) || 5.0).toFixed(1)}</span>
                        </div>
                        <span className="text-zinc-650">|</span>
                        <div className="flex items-center gap-0.5 truncate text-[11px] font-medium">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span className="truncate">{cleanDisplayAddress(video.placeAddress || video.placeCity)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <img
                          src={video.author.avatar || `/api/avatar?name=${encodeURIComponent(video.author.name || "User")}&background=1a73e8&color=fff`}
                          alt={video.author.name}
                          className="w-4.5 h-4.5 rounded-full border border-zinc-800"
                          onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }}
                        /> 
                        <span className="text-[10px] text-zinc-400 font-semibold">
                          {t("video.recommendedBy", "Recommended by")} <span className="text-zinc-200 hover:underline">{video.author.name}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleUnsaveVideo(video.id, e)}
                      className="p-2 rounded-full hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 transition-all cursor-pointer"
                      title="Unsave"
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
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                {t("video.no_reviews", "No video reviews saved yet")}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6 font-medium">
                {t("bookmarks.videosEmpty", "Tap the bookmark icon in any video's options menu to save it.")}
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
              {savedPlaces.map((place) => (
                <div
                  key={`saved-place-list-${place.id}`}
                  onClick={() => onSelectPlace && onSelectPlace(place.id)}
                  className="group bg-zinc-900 rounded-2xl border border-zinc-800 p-4 hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-800">
                      <img
                        src={place.photos?.[0] || place.bannerUrl || place.avatarUrl || `/api/placeholder?w=100&h=100&text=${encodeURIComponent(place.name)}`}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate leading-snug">{place.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-300 text-[10px] font-bold border border-zinc-750 shrink-0">
                          {place.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                        <div className="flex items-center text-amber-400 font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                          <span>{place.rating?.toFixed(1) || "5.0"} ({place.totalReviews || 0})</span>
                        </div>
                        <span className="text-zinc-750">|</span>
                        <span className="truncate">{place.address || place.city}</span>
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
              ))}
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
                  <span>{t("nav.map", "Explore Map")}</span>
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
                      src={creator.avatar || `/api/avatar?name=${encodeURIComponent(creator.name)}&background=27272a&color=fff`}
                      alt={creator.name}
                      className="w-11 h-11 rounded-full border border-zinc-800 shrink-0 object-cover"
                      onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }}
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate leading-snug">{creator.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{creator.handle || `@${creator.name.toLowerCase().replace(/\s+/g, "")}`}</p>
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
