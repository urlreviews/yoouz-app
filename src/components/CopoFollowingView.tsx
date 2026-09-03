import React, { useState, useMemo } from "react";
import {
  UserPlus,
  UserCheck,
  Users,
  Star,
  MapPin,
  Video,
  Play,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  ChevronLeft,
  UserMinus
} from "lucide-react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { getDisplayUrlAsDomain } from "../utils/placeUtils";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";

interface CopoFollowingViewProps {
  places: Place[];
  videos: VideoReview[];
  currentUser?: UserProfile | null;
  allUsers?: any[];
  onOpenAuth?: () => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onSelectVideo: (videoId: string, source?: string) => void;
  onOpenPlace: (placeId: string) => void;
  onOpenCreator: (author: VideoAuthor) => void;
  onToggleFollow: (authorHandle: string) => void;
  onToggleFollowPlace?: (placeId: string) => void;
  onNavigateHome?: () => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
}

export const CopoFollowingView: React.FC<CopoFollowingViewProps> = ({
  videos,
  currentUser,
  allUsers = [],
  onOpenHelp,
  onOpenLegal,
  onSelectVideo,
  onOpenPlace,
  onOpenCreator,
  onToggleFollow,
  onNavigateHome,
  onSuccessAuth
}) => {
  // Simplified 2-tab architecture: "reviews" (Video Feed) and "reviewers" (Local Guides & Creators)
  const [activeTab, setActiveTab] = useState<"reviews" | "reviewers">("reviews");
  const [reviewerSubTab, setReviewerSubTab] = useState<"following" | "followers" | "discover">("following");
  const [hoveredUnfollow, setHoveredUnfollow] = useState<string | null>(null);

  // Set of authors the current user follows (case-insensitive for robust matching)
  const followedAuthorsSet = useMemo(() => {
    const set = new Set<string>();
    (currentUser?.followedAuthors || []).forEach((name) => {
      if (name) set.add(name.toLowerCase().trim());
    });
    return set;
  }, [currentUser?.followedAuthors]);

  // Merge unique reviewers from videos and platform registered users
  const allAuthors = useMemo(() => {
    const map = new Map<string, VideoAuthor>();

    // 1. Gather authors from video reviews
    videos.forEach((v) => {
      if (v.author && v.author.name) {
        const key = v.author.name.toLowerCase().trim();
        const isFollowed = followedAuthorsSet.has(key) || Boolean(v.author.isFollowed);
        const existing = map.get(key);

        map.set(key, {
          ...v.author,
          isFollowed,
          videoReviewCount: (existing?.videoReviewCount || 0) + 1
        });
      }
    });

    // 2. Aggregate registered users into author directory
    allUsers.forEach((u: any) => {
      const name = (u.name || "").trim();
      if (!name || name === "Registered User" || name === "Reviewer") return;
      const key = name.toLowerCase();
      const existing = map.get(key);
      const isFollowed = followedAuthorsSet.has(key);
      const followersList = Array.isArray(u.followers) ? u.followers : [];
      const followersCount = typeof u.followersCount === "number" ? u.followersCount : followersList.length;

      map.set(key, {
        name,
        handle: u.handle || `@${key.replace(/[^a-z0-9]/g, "")}`,
        avatar: u.avatar || existing?.avatar || `/api/avatar?name=${encodeURIComponent(name)}&background=27272a&color=fff`,
        bio: u.bio || existing?.bio || "Food enthusiast & local reviewer",
        location: u.location || existing?.location,
        isVerified: u.isVerified || existing?.isVerified || false,
        isFollowed,
        followersCount: Math.max(followersCount, existing?.followersCount || 0),
        videoReviewCount: existing?.videoReviewCount || 0
      });
    });

    // Exclude current user from the directory so you don't follow yourself
    if (currentUser?.name) {
      map.delete(currentUser.name.toLowerCase().trim());
    }

    return Array.from(map.values());
  }, [videos, allUsers, followedAuthorsSet, currentUser]);

  // Authors the user follows
  const followedAuthors = useMemo(() => {
    return allAuthors.filter((a) => a.isFollowed);
  }, [allAuthors]);

  // Recommended reviewers (active creators not yet followed)
  const suggestedAuthors = useMemo(() => {
    return allAuthors
      .filter((a) => !a.isFollowed)
      .sort((a, b) => ((b.videoReviewCount || 0) + (b.followersCount || 0)) - ((a.videoReviewCount || 0) + (a.followersCount || 0)))
      .slice(0, 8);
  }, [allAuthors]);

  // People who follow the current user
  const myFollowers = useMemo(() => {
    if (!currentUser) return [];
    const myNameLower = (currentUser.name || "").toLowerCase().trim();
    const myEmailLower = (currentUser.email || "").toLowerCase().trim();
    const directFollowers = Array.isArray(currentUser.followers) ? currentUser.followers : [];

    const list: Array<{
      name: string;
      handle: string;
      avatar: string;
      bio: string;
      isFollowed: boolean;
      followersCount: number;
    }> = [];

    allUsers.forEach((u: any) => {
      const userName = (u.name || "").trim();
      if (!userName || userName.toLowerCase() === myNameLower) return;

      const userFollows = Array.isArray(u.followedAuthors) ? u.followedAuthors : [];
      const isFollowingMe =
        userFollows.some((h: string) => h.toLowerCase() === myNameLower || (myEmailLower && h.toLowerCase() === myEmailLower)) ||
        directFollowers.some((df: string) => df.toLowerCase() === userName.toLowerCase());

      if (isFollowingMe) {
        list.push({
          name: userName,
          handle: u.handle || `@${userName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
          avatar: u.avatar || `/api/avatar?name=${encodeURIComponent(userName)}&background=27272a&color=fff`,
          bio: u.bio || "Local Reviewer",
          isFollowed: followedAuthorsSet.has(userName.toLowerCase()),
          followersCount: typeof u.followersCount === "number" ? u.followersCount : 0
        });
      }
    });

    return list;
  }, [allUsers, currentUser, followedAuthorsSet]);

  // Video reviews posted by followed authors
  const reviewsFeed = useMemo(() => {
    return videos.filter((v) => {
      const authorName = (v.author?.name || "").toLowerCase().trim();
      return followedAuthorsSet.has(authorName) || v.author?.isFollowed;
    });
  }, [videos, followedAuthorsSet]);

  const realFollowersCount = Math.max(currentUser?.followersCount || 0, myFollowers.length);
  const followingCount = (currentUser?.followedAuthors || []).length;

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div id="following-auth-gate" className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-900 text-white flex flex-col justify-between pb-32 md:pb-6">
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
    <div id="following-directory-container" className="flex-1 h-full overflow-y-auto bg-zinc-950 text-white p-3.5 sm:p-6 select-none">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-32 md:pb-8">
        {/* Header Section */}
        <div id="following-header-card" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-4.5 sm:p-6 rounded-3xl border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                id="following-back-button"
                onClick={onNavigateHome}
                className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm border border-zinc-700/80"
                title="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-300" />
                <span>Following</span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Watch 60-second video reviews from local guides you follow and connect with trusted foodies.
              </p>
            </div>
          </div>

          {/* Social Stats Pill */}
          <div id="following-stats-badge" className="flex items-center justify-around sm:justify-center gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-2.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => {
                setActiveTab("reviewers");
                setReviewerSubTab("following");
              }}
              className="text-center pr-4 border-r border-zinc-800 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Following</p>
              <p className="text-base sm:text-lg font-black text-white">{followingCount}</p>
            </button>
            <button
              onClick={() => {
                setActiveTab("reviewers");
                setReviewerSubTab("followers");
              }}
              className="text-center pl-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Followers</p>
              <p className="text-base sm:text-lg font-black text-white">{realFollowersCount}</p>
            </button>
          </div>
        </div>

        {/* Simplified 2-Tab Navigation: Reviews Feed vs Reviewers */}
        <div id="following-main-tabs" className="grid grid-cols-2 gap-1 border border-zinc-800 bg-zinc-900 p-1 rounded-2xl shadow-xs">
          <button
            id="tab-btn-reviews-feed"
            onClick={() => setActiveTab("reviews")}
            className={`py-2.5 px-3 text-center text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "reviews"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Reviews Feed ({reviewsFeed.length})</span>
          </button>
          <button
            id="tab-btn-reviewers"
            onClick={() => setActiveTab("reviewers")}
            className={`py-2.5 px-3 text-center text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "reviewers"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Reviewers ({followingCount})</span>
          </button>
        </div>

        {/* Tab 1: Video Reviews Feed */}
        {activeTab === "reviews" && (
          <div id="reviews-feed-content" className="space-y-6 animate-in fade-in duration-200">
            {reviewsFeed.length === 0 ? (
              <div id="reviews-feed-empty-state" className="p-8 sm:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                  <Video className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-base font-bold text-white">Your Review Feed is Empty</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Follow authentic local reviewers and foodie guides to see their latest 60-second video reviews posted here.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    id="btn-discover-reviewers"
                    onClick={() => {
                      setActiveTab("reviewers");
                      setReviewerSubTab("discover");
                    }}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs inline-flex items-center gap-2 transition-transform cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Discover Local Reviewers</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                {reviewsFeed.map((video) => (
                  <div
                    key={`feed-video-${video.id}`}
                    id={`video-card-${video.id}`}
                    onClick={() => onSelectVideo(video.id)}
                    className="group relative aspect-[9/15] rounded-3xl overflow-hidden bg-black border border-zinc-800 cursor-pointer hover:border-zinc-500 hover:shadow-lg transition-all"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/30" />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all shadow-sm">
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    </div>

                    {/* Author Pill at Top */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreator(video.author);
                        }}
                        className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full pl-1 pr-2.5 py-1 text-white hover:bg-black/80 transition-colors max-w-[70%]"
                      >
                        <img
                          src={video.author.avatar || `/api/avatar?name=${encodeURIComponent(video.author.name || "User")}&background=27272a&color=fff`}
                          alt={video.author.name}
                          className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.src.includes('/api/avatar')) {
                              target.src = '/api/avatar?name=User&background=27272a&color=fff';
                            }
                          }}
                        />
                        <span className="text-[10px] font-extrabold truncate">
                          {video.author.name}
                        </span>
                      </div>

                      {/* Rating Badge */}
                      <div className="px-2 py-0.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-xs text-white text-[10px] font-black flex items-center gap-0.5 shrink-0 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-white text-white" />
                        <span>{video.rating}.0</span>
                      </div>
                    </div>

                    {/* Place Name and Caption at Bottom */}
                    <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                      <p
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPlace(video.placeId);
                        }}
                        className="font-bold text-xs hover:underline flex items-center gap-1 truncate text-zinc-100"
                      >
                        <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{getDisplayUrlAsDomain(video)}</span>
                      </p>
                      <p className="text-[10px] text-zinc-300 line-clamp-2 leading-tight">
                        "{video.caption}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Curated Recommendations Below Feed */}
            {suggestedAuthors.length > 0 && (
              <div id="feed-suggested-reviewers" className="pt-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs sm:text-sm font-black text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
                    <span>Recommended Local Reviewers</span>
                  </h3>
                  <button
                    onClick={() => {
                      setActiveTab("reviewers");
                      setReviewerSubTab("discover");
                    }}
                    className="text-xs text-zinc-400 hover:text-white font-bold cursor-pointer transition-colors"
                  >
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedAuthors.slice(0, 4).map((author) => (
                    <div
                      key={`feed-suggest-${author.name}`}
                      id={`suggested-reviewer-${author.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      className="p-3.5 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-zinc-700 transition-colors"
                    >
                      <div
                        onClick={() => onOpenCreator(author)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                      >
                        <img
                          src={author.avatar || `/api/avatar?name=${encodeURIComponent(author.name || "User")}&background=27272a&color=fff`}
                          alt={author.name}
                          className="w-11 h-11 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.src.includes('/api/avatar')) {
                              target.src = '/api/avatar?name=User&background=27272a&color=fff';
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white truncate">
                            <span className="truncate">{author.name}</span>
                            {author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {author.videoReviewCount ? `${author.videoReviewCount} video reviews` : "Local foodie"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleFollow(author.name)}
                        className="shrink-0 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition-transform shadow-xs whitespace-nowrap active:scale-95"
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

        {/* Tab 2: Reviewers & Community */}
        {activeTab === "reviewers" && (
          <div id="reviewers-tab-content" className="space-y-4 animate-in fade-in duration-200">
            {/* Reviewer Sub-filters */}
            <div id="reviewers-subtabs" className="flex border-b border-zinc-800 text-xs font-bold text-zinc-400 gap-5 sm:gap-6 overflow-x-auto no-scrollbar">
              <button
                id="subtab-following"
                onClick={() => setReviewerSubTab("following")}
                className={`pb-3 border-b-2 cursor-pointer transition-colors outline-none whitespace-nowrap ${
                  reviewerSubTab === "following"
                    ? "border-white text-white font-black"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Following ({followingCount})
              </button>
              <button
                id="subtab-followers"
                onClick={() => setReviewerSubTab("followers")}
                className={`pb-3 border-b-2 cursor-pointer transition-colors outline-none whitespace-nowrap ${
                  reviewerSubTab === "followers"
                    ? "border-white text-white font-black"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Followers ({realFollowersCount})
              </button>
              <button
                id="subtab-discover"
                onClick={() => setReviewerSubTab("discover")}
                className={`pb-3 border-b-2 cursor-pointer transition-colors outline-none whitespace-nowrap ${
                  reviewerSubTab === "discover"
                    ? "border-white text-white font-black"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Discover ({suggestedAuthors.length})
              </button>
            </div>

            {/* Sub-tab: Following */}
            {reviewerSubTab === "following" && (
              <div id="subtab-following-list" className="space-y-3">
                {followedAuthors.length === 0 ? (
                  <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                      <User className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <p className="font-bold text-white text-sm sm:text-base">You Aren't Following Anyone Yet</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Connect with genuine local guides and food reviewers to watch their curated recommendations.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setReviewerSubTab("discover")}
                        className="px-4.5 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5 transition-transform cursor-pointer shadow-xs active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Discover Reviewers</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {followedAuthors.map((author) => {
                      const isHovered = hoveredUnfollow === author.name;
                      return (
                        <div
                          key={`following-reviewer-${author.name}`}
                          id={`card-following-${author.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          className="p-3.5 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-zinc-700 transition-colors"
                        >
                          <div
                            onClick={() => onOpenCreator(author)}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                          >
                            <img
                              src={author.avatar || `/api/avatar?name=${encodeURIComponent(author.name || "User")}&background=27272a&color=fff`}
                              alt={author.name}
                              className="w-11 h-11 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (!target.src.includes('/api/avatar')) {
                                  target.src = '/api/avatar?name=User&background=27272a&color=fff';
                                }
                              }}
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white truncate">
                                <span className="truncate">{author.name}</span>
                                {author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />}
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {author.videoReviewCount ? `${author.videoReviewCount} reviews` : "Local guide"}
                              </p>
                            </div>
                          </div>

                          <button
                            id={`btn-toggle-following-${author.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            onMouseEnter={() => setHoveredUnfollow(author.name)}
                            onMouseLeave={() => setHoveredUnfollow(null)}
                            onClick={() => onToggleFollow(author.name)}
                            className={`shrink-0 px-3.5 py-1.5 rounded-full font-black text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                              isHovered
                                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                            }`}
                            title={isHovered ? "Unfollow this reviewer" : "You are following this reviewer"}
                          >
                            {isHovered ? (
                              <>
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>Unfollow</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                                <span>Following</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: Followers */}
            {reviewerSubTab === "followers" && (
              <div id="subtab-followers-list" className="space-y-3">
                {myFollowers.length === 0 ? (
                  <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <p className="font-bold text-white text-sm sm:text-base">No Followers Yet</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        When people follow your authentic video reviews, their profiles will appear here instantly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myFollowers.map((follower) => {
                      const isFollowingThem = followedAuthorsSet.has(follower.name.toLowerCase());
                      return (
                        <div
                          key={`follower-${follower.name}`}
                          id={`card-follower-${follower.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          className="p-3.5 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-zinc-700 transition-colors"
                        >
                          <div
                            onClick={() => onOpenCreator({ name: follower.name, avatar: follower.avatar, handle: follower.handle } as any)}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                          >
                            <img
                              src={follower.avatar}
                              alt={follower.name}
                              className="w-11 h-11 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (!target.src.includes('/api/avatar')) {
                                  target.src = '/api/avatar?name=User&background=27272a&color=fff';
                                }
                              }}
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <p className="font-bold text-xs sm:text-sm text-white truncate">{follower.name}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{follower.handle}</p>
                            </div>
                          </div>

                          <button
                            id={`btn-follow-back-${follower.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            onClick={() => onToggleFollow(follower.name)}
                            className={`shrink-0 px-3.5 py-1.5 rounded-full font-black text-xs inline-flex items-center gap-1.5 transition-transform cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                              isFollowingThem
                                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                                : "bg-white hover:bg-zinc-200 text-zinc-950"
                            }`}
                          >
                            {isFollowingThem ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Follow Back</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: Discover */}
            {reviewerSubTab === "discover" && (
              <div id="subtab-discover-list" className="space-y-3">
                {suggestedAuthors.length === 0 ? (
                  <div className="p-8 sm:p-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 space-y-2">
                    <p className="font-bold text-white text-xs sm:text-sm">You are following all featured reviewers</p>
                    <p className="text-xs text-zinc-400">New reviewers will appear here as the community grows.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedAuthors.map((author) => (
                      <div
                        key={`discover-${author.name}`}
                        id={`card-discover-${author.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        className="p-3.5 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-zinc-700 transition-colors"
                      >
                        <div
                          onClick={() => onOpenCreator(author)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                        >
                          <img
                            src={author.avatar || `/api/avatar?name=${encodeURIComponent(author.name || "User")}&background=27272a&color=fff`}
                            alt={author.name}
                            className="w-11 h-11 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.src.includes('/api/avatar')) {
                                target.src = '/api/avatar?name=User&background=27272a&color=fff';
                              }
                            }}
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white truncate">
                              <span className="truncate">{author.name}</span>
                              {author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {author.videoReviewCount ? `${author.videoReviewCount} video reviews` : "Local guide"}
                            </p>
                          </div>
                        </div>

                        <button
                          id={`btn-discover-follow-${author.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          onClick={() => onToggleFollow(author.name)}
                          className="shrink-0 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition-transform shadow-xs whitespace-nowrap active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
