import React, { useState, useMemo } from "react";
import {
  UserPlus,
  UserCheck,
  Users,
  Compass,
  Star,
  MapPin,
  Video,
  Play,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  Heart,
  ChevronLeft
} from "lucide-react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";
import { CopoBrandLogo } from "./CopoBrandLogo";

interface CopoFollowingViewProps {
  places: Place[];
  videos: VideoReview[];
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onSelectVideo: (videoId: string, source?: string) => void;
  onOpenPlace: (placeId: string) => void;
  onOpenCreator: (author: VideoAuthor) => void;
  onToggleFollow: (authorHandle: string) => void;
  onToggleFollowPlace: (placeId: string) => void;
  onNavigateHome?: () => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
}

export const CopoFollowingView: React.FC<CopoFollowingViewProps> = ({
  places,
  videos,
  currentUser,
  onOpenAuth,
  onOpenHelp,
  onOpenLegal,
  onSelectVideo,
  onOpenPlace,
  onOpenCreator,
  onToggleFollow,
  onToggleFollowPlace,
  onNavigateHome,
  onSuccessAuth
}) => {
  const [activeTab, setActiveTab] = useState<"activity" | "guides" | "businesses">("activity");
  const [guideSubTab, setGuideSubTab] = useState<"following" | "followers" | "suggestions">("following");

  // Get unique authors from all real videos in Firestore
  const allAuthors = useMemo(() => {
    const map = new Map<string, VideoAuthor>();
    videos.forEach((v) => {
      if (v.author && v.author.name) {
        map.set(v.author.name, v.author);
      }
    });
    return Array.from(map.values());
  }, [videos]);

  // Authors the user follows
  const followedAuthors = useMemo(() => {
    return allAuthors.filter((a) => a.isFollowed);
  }, [allAuthors]);

  // Suggested authors (not yet followed, sorted by level/reviews count)
  const suggestedAuthors = useMemo(() => {
    return allAuthors
      .filter((a) => !a.isFollowed)
      .slice(0, 6);
  }, [allAuthors]);

  // Followed businesses/places
  const followedPlaces = useMemo(() => {
    return places.filter((p) => p.isFollowed);
  }, [places]);

  // Suggested businesses (popular places, not followed)
  const suggestedPlaces = useMemo(() => {
    return places
      .filter((p) => !p.isFollowed)
      .slice(0, 4);
  }, [places]);

  // Combined activity feed: videos posted by followed authors or followed businesses
  const activityFeed = useMemo(() => {
    return videos.filter((v) => {
      const isAuthorFollowed = v.author.isFollowed;
      const isPlaceFollowed = places.find((p) => p.id === v.placeId)?.isFollowed;
      return isAuthorFollowed || isPlaceFollowed;
    });
  }, [videos, places]);

  const realFollowersCount = currentUser?.followersCount || 0;

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col justify-between pb-32 md:pb-6">
        <CopoAuthPrompt
          intent="following"
          onOpenHelp={onOpenHelp}
          onOpenLegal={onOpenLegal}
          onSuccess={onSuccessAuth}
          isFullPage={true}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-50 text-white md:text-zinc-900 p-3.5 sm:p-6 select-none">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-32 md:pb-6">
        {/* Header section matching Google Maps Native App Style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 md:bg-white p-4.5 sm:p-6 rounded-3xl border border-zinc-800 md:border-zinc-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-9 h-9 rounded-full bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-300 md:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm border border-zinc-700/80 md:border-zinc-200"
                title="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white md:text-zinc-950 tracking-tight flex items-center gap-2 font-['Google_Sans',sans-serif]">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8]" />
                <span>Following Directory</span>
              </h1>
              <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium leading-relaxed">
                Discover updates, follow recommended local guides, and track favorite local businesses.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-around sm:justify-center gap-4 bg-zinc-950 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200/70 rounded-2xl px-5 py-2.5 shrink-0">
            <div className="text-center pr-4 border-r border-zinc-800 md:border-zinc-200/80">
              <p className="text-[10px] text-zinc-500 md:text-zinc-400 font-extrabold uppercase tracking-wider">Following</p>
              <p className="text-base sm:text-lg font-black text-[#1a73e8]">{followedAuthors.length + followedPlaces.length}</p>
            </div>
            <div className="text-center pl-2">
              <p className="text-[10px] text-zinc-500 md:text-zinc-400 font-extrabold uppercase tracking-wider">Followers</p>
              <p className="text-base sm:text-lg font-black text-white md:text-zinc-950">{realFollowersCount}</p>
            </div>
          </div>
        </div>

        {/* Premium Core Tabs: Activity Feed | Local Guides | Businesses */}
        <div className="flex items-center border border-zinc-800 md:border-zinc-200/90 bg-zinc-900 md:bg-white p-1 rounded-2xl shadow-2xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 min-w-[110px] py-2.5 px-3 text-center text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "activity"
                ? "bg-[#1a73e8] text-white shadow-xs"
                : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-900 hover:bg-zinc-800 md:hover:bg-zinc-50"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Updates ({activityFeed.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex-1 min-w-[110px] py-2.5 px-3 text-center text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "guides"
                ? "bg-[#1a73e8] text-white shadow-xs"
                : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-900 hover:bg-zinc-800 md:hover:bg-zinc-50"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Guides ({followedAuthors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("businesses")}
            className={`flex-1 min-w-[110px] py-2.5 px-3 text-center text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "businesses"
                ? "bg-[#1a73e8] text-white shadow-xs"
                : "text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-900 hover:bg-zinc-800 md:hover:bg-zinc-50"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Places ({followedPlaces.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* TAB 1: UPDATES & ACTIVITY FEED */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {activityFeed.length === 0 ? (
                <div className="p-12 rounded-3xl bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/80 text-center text-zinc-400 md:text-zinc-500 space-y-4 shadow-2xs">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-base font-bold text-white md:text-zinc-800">No updates from followed accounts yet</p>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                      Follow verified food reviewers, local guides, or restaurants to see their latest video reviews published right here.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab("guides")}
                      className="px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Find Guides to Follow</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {activityFeed.map((video) => (
                    <div
                      key={`activity-video-${video.id}`}
                      onClick={() => onSelectVideo(video.id)}
                      className="group relative aspect-[9/15] rounded-3xl overflow-hidden bg-black border border-zinc-800 md:border-zinc-200/80 cursor-pointer hover:border-[#1a73e8] hover:shadow-md transition-all animate-in fade-in duration-300"
                    >
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/15" />
                      <div className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/60 backdrop-blur-2xs flex items-center justify-center text-white opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all shadow-sm">
                        <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      </div>

                      {/* Header author tag */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCreator(video.author);
                          }}
                          className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full pl-1 pr-2.5 py-1 text-white hover:bg-black/60 transition-colors"
                        >
                          <img
                            src={video.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.author.name || "User")}&background=1a73e8&color=fff`}
                            alt={video.author.name}
                            className="w-5 h-5 rounded-full object-cover border border-white/20"
                          />
                          <span className="text-[9.5px] font-extrabold truncate max-w-[80px]">
                            {video.author.name}
                          </span>
                        </div>
                        <div className="px-2 py-1 rounded-full bg-amber-500 text-white text-[9.5px] font-black flex items-center gap-0.5 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-white text-white" />
                          <span>{video.rating}.0</span>
                        </div>
                      </div>

                      {/* Footer Place info */}
                      <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPlace(video.placeId);
                          }}
                          className="font-bold text-xs hover:underline flex items-center gap-1 truncate"
                        >
                          <MapPin className="w-3 h-3 text-[#1a73e8]" />
                          <span className="truncate">{video.placeName}</span>
                        </p>
                        <p className="text-[10px] text-zinc-300 line-clamp-2 leading-tight">
                          "{video.caption}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions Section under feed */}
              {suggestedAuthors.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs sm:text-sm font-bold text-white md:text-zinc-800 flex items-center gap-1.5 px-1">
                    <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <span>Popular Guides You Might Like</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedAuthors.slice(0, 2).map((author) => (
                      <div
                        key={`activity-suggest-${author.name}`}
                        className="p-3.5 sm:p-4 bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-zinc-700 md:hover:border-zinc-300 transition-colors"
                      >
                        <div
                          onClick={() => onOpenCreator(author)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                        >
                          <img
                            src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || "User")}&background=1a73e8&color=fff`}
                            alt={author.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-800 md:border-zinc-200 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white md:text-zinc-950 truncate">
                              <span className="truncate">{author.name}</span>
                              {author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 fill-[#1a73e8] text-white shrink-0" />}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onToggleFollow(author.name)}
                          className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#1a73e8] hover:bg-blue-700 text-white font-extrabold text-[11px] sm:text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PEOPLE & GUIDES */}
          {activeTab === "guides" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Guides Sub Tabs: Following | Followers | Suggestions */}
              <div className="flex border-b border-zinc-800 md:border-zinc-200 text-xs font-bold text-zinc-400 md:text-zinc-500 gap-5 sm:gap-6 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setGuideSubTab("following")}
                  className={`pb-3 border-b-2 cursor-pointer transition-colors outline-none focus:outline-none whitespace-nowrap ${
                    guideSubTab === "following" ? "border-white md:border-zinc-900 text-white md:text-zinc-950 font-extrabold" : "border-transparent text-zinc-400 md:text-zinc-500 hover:text-zinc-200 md:hover:text-zinc-800"
                  }`}
                >
                  Following ({followedAuthors.length})
                </button>
                <button
                  onClick={() => setGuideSubTab("followers")}
                  className={`pb-3 border-b-2 cursor-pointer transition-colors outline-none focus:outline-none whitespace-nowrap ${
                    guideSubTab === "followers" ? "border-white md:border-zinc-900 text-white md:text-zinc-950 font-extrabold" : "border-transparent text-zinc-400 md:text-zinc-500 hover:text-zinc-200 md:hover:text-zinc-800"
                  }`}
                >
                  Followers ({realFollowersCount})
                </button>
                <button
                  onClick={() => setGuideSubTab("suggestions")}
                  className={`pb-3 border-b-2 cursor-pointer transition-colors outline-none focus:outline-none whitespace-nowrap ${
                    guideSubTab === "suggestions" ? "border-white md:border-zinc-900 text-white md:text-zinc-950 font-extrabold" : "border-transparent text-zinc-400 md:text-zinc-500 hover:text-zinc-200 md:hover:text-zinc-800"
                  }`}
                >
                  Recommended
                </button>
              </div>

              {/* Subtab Contents */}
              {guideSubTab === "following" && (
                <div className="space-y-3">
                  {followedAuthors.length === 0 ? (
                    <div className="p-8 sm:p-10 rounded-2xl bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/90 text-center text-zinc-400 md:text-zinc-500 space-y-2">
                      <p className="font-bold text-white md:text-zinc-800 text-xs sm:text-sm">You aren't following any local guides yet</p>
                      <p className="text-xs text-zinc-400 md:text-zinc-500">Follow local reviewers to track their dining and venue insights.</p>
                      {suggestedAuthors.length > 0 && (
                        <div className="pt-2">
                          <button
                            onClick={() => setGuideSubTab("suggestions")}
                            className="px-4 py-2 rounded-xl bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-white md:text-zinc-800 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Show Suggestions
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {followedAuthors.map((author) => (
                        <div
                          key={`guide-following-${author.name}`}
                          className="p-3.5 sm:p-4 bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-zinc-700 md:hover:border-zinc-300 transition-colors"
                        >
                          <div
                            onClick={() => onOpenCreator(author)}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                          >
                            <img
                              src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || "User")}&background=1a73e8&color=fff`}
                              alt={author.name}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-800 md:border-zinc-200 shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white md:text-zinc-950 truncate">
                                <span className="truncate">{author.name}</span>
                                {author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 fill-[#1a73e8] text-white shrink-0" />}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onToggleFollow(author.name)}
                            className="shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-200 md:text-zinc-800 border border-zinc-700 md:border-zinc-200 font-extrabold text-[11px] sm:text-xs inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400 md:text-emerald-600" />
                            <span>Following</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {guideSubTab === "followers" && (
                <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/90 text-center text-zinc-400 md:text-zinc-500 space-y-3 shadow-2xs animate-in fade-in duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] flex items-center justify-center mx-auto">
                    <Users className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white md:text-zinc-900 text-sm sm:text-base">No followers yet</p>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 max-w-sm mx-auto leading-relaxed">
                      When real reviewers, friends, or local guides follow your profile, they will appear here.
                    </p>
                  </div>
                </div>
              )}

              {guideSubTab === "suggestions" && (
                <div className="space-y-3">
                  {suggestedAuthors.length === 0 ? (
                    <div className="p-8 sm:p-10 rounded-2xl bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/90 text-center text-zinc-400 md:text-zinc-500 space-y-2">
                      <p className="font-bold text-white md:text-zinc-800 text-xs sm:text-sm">No recommended guides right now</p>
                      <p className="text-xs text-zinc-400 md:text-zinc-500">Record reviews or explore local businesses to connect with creators.</p>
                    </div>
                  ) : (
                    suggestedAuthors.map((author) => (
                      <div
                        key={`guide-suggest-${author.name}`}
                        className="p-3.5 sm:p-4 bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-zinc-700 md:hover:border-zinc-300 transition-colors animate-in fade-in duration-200"
                      >
                        <div
                          onClick={() => onOpenCreator(author)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                        >
                          <img
                            src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || "User")}&background=1a73e8&color=fff`}
                            alt={author.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-800 md:border-zinc-200 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white md:text-zinc-950 truncate">
                              <span className="truncate">{author.name}</span>
                              {author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 fill-[#1a73e8] text-white shrink-0" />}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onToggleFollow(author.name)}
                          className="shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#1a73e8] hover:bg-blue-700 text-white font-extrabold text-[11px] sm:text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BUSINESSES */}
          {activeTab === "businesses" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-3">
                {followedPlaces.length === 0 ? (
                  <div className="p-10 rounded-2xl bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/80 text-center text-zinc-400 md:text-zinc-500 space-y-4 shadow-2xs">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] flex items-center justify-center mx-auto">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-bold text-white md:text-zinc-800 text-sm">No followed businesses yet</p>
                      <p className="text-xs text-zinc-400 md:text-zinc-500">Follow restaurants, bakeries, or shops to track their updates and customer response posts.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {followedPlaces.map((place) => (
                      <div
                        key={`business-followed-${place.id}`}
                        className="p-4 bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/80 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-[#1a73e8] transition-colors gap-3"
                      >
                        <div
                          onClick={() => onOpenPlace(place.id)}
                          className="flex items-start gap-3 cursor-pointer group min-w-0"
                        >
                          <CopoBrandLogo
                            domain={place.brandDomain}
                            name={place.name}
                            website={place.website || place.address}
                            logoUrl={place.logoUrl || place.avatarUrl}
                            bannerUrl={place.bannerUrl || place.ogImage}
                            className="w-12 h-12 rounded-xl bg-zinc-800 md:bg-zinc-100 border border-zinc-700 md:border-zinc-200 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm"
                            imageClassName="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast]"
                            fallbackTextClassName="font-bold text-lg text-zinc-300 md:text-zinc-600"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <h4 className="font-bold text-xs sm:text-sm text-white md:text-zinc-950 group-hover:text-[#1a73e8] transition-colors truncate">
                              {place.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400 md:text-amber-600 font-bold mt-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                              <span>{place.rating.toFixed(1)}</span>
                              <span className="text-zinc-500 md:text-zinc-400 font-normal">({place.totalReviews})</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 md:text-zinc-500 mt-0.5 truncate">{place.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-800 md:border-zinc-100 pt-3 mt-1">
                          <span className="text-[10px] text-zinc-500 md:text-zinc-400 font-bold uppercase tracking-wider">{place.category}</span>
                          <button
                            onClick={() => onToggleFollowPlace(place.id)}
                            className="px-3.5 py-1.5 rounded-full bg-zinc-800 md:bg-zinc-100 hover:bg-zinc-700 md:hover:bg-zinc-200 text-zinc-200 md:text-zinc-800 border border-zinc-700 md:border-zinc-300 font-extrabold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400 md:text-emerald-600" />
                            <span>Following</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions row */}
              {suggestedPlaces.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h3 className="text-sm font-bold text-white md:text-zinc-800 flex items-center gap-1.5 px-1">
                    <Compass className="w-4 h-4 text-[#1a73e8]" />
                    <span>Popular Businesses to Follow</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestedPlaces.map((place) => (
                      <div
                        key={`business-suggest-${place.id}`}
                        className="p-4 bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200/80 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-zinc-700 md:hover:border-zinc-300 transition-colors gap-3"
                      >
                        <div
                          onClick={() => onOpenPlace(place.id)}
                          className="flex items-start gap-3 cursor-pointer group min-w-0"
                        >
                          <CopoBrandLogo
                            domain={place.brandDomain}
                            name={place.name}
                            website={place.website || place.address}
                            logoUrl={place.logoUrl || place.avatarUrl}
                            bannerUrl={place.bannerUrl || place.ogImage}
                            className="w-12 h-12 rounded-xl bg-zinc-800 md:bg-zinc-100 border border-zinc-700 md:border-zinc-200 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm"
                            imageClassName="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast]"
                            fallbackTextClassName="font-bold text-lg text-zinc-300 md:text-zinc-600"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <h4 className="font-bold text-xs sm:text-sm text-white md:text-zinc-950 group-hover:text-[#1a73e8] transition-colors truncate">
                              {place.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400 md:text-amber-600 font-bold mt-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                              <span>{place.rating.toFixed(1)}</span>
                              <span className="text-zinc-500 md:text-zinc-400 font-normal">({place.totalReviews})</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 md:text-zinc-500 mt-0.5 truncate">{place.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-800 md:border-zinc-100 pt-3 mt-1">
                          <span className="text-[10px] text-zinc-500 md:text-zinc-400 font-bold uppercase tracking-wider">{place.category}</span>
                          <button
                            onClick={() => onToggleFollowPlace(place.id)}
                            className="px-3.5 py-1.5 rounded-full bg-[#1a73e8] hover:bg-blue-700 text-white font-extrabold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};