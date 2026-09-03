import React, { useState, useMemo } from "react";
import {
  UserPlus,
  UserCheck,
  UserMinus,
  Users,
  User,
  ChevronLeft,
  Search,
  X,
  CheckCircle2
} from "lucide-react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
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
  onOpenCreator,
  onToggleFollow,
  onNavigateHome,
  onSuccessAuth
}) => {
  // Pure, clean 2-tab architecture: "following" (Who I Follow) and "followers" (Who Follows Me)
  const [activeTab, setActiveTab] = useState<"following" | "followers">("following");
  const [hoveredUnfollow, setHoveredUnfollow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Set of authors the current user follows (case-insensitive for robust matching)
  const followedAuthorsSet = useMemo(() => {
    const set = new Set<string>();
    (currentUser?.followedAuthors || []).forEach((name) => {
      if (name) set.add(name.toLowerCase().trim());
    });
    return set;
  }, [currentUser?.followedAuthors]);

  // Merge unique reviewers from videos and platform registered users
  const allAuthorsMap = useMemo(() => {
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
    let deletedList: string[] = [];
    try {
      const stored = localStorage.getItem("yoouz_deleted_users");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          deletedList = parsed.filter((k: string) => {
            const s = String(k).toLowerCase();
            return !s.includes("aouisesmee") && s !== "mlio66hdr9trvofdgddgwm30rku2" && !s.includes("4samet");
          });
        }
      }
    } catch {}
    const deletedSet = new Set(deletedList.map((k) => String(k).toLowerCase()));

    allUsers.forEach((u: any) => {
      const name = (u.name || "").trim();
      const email = (u.email || "").toLowerCase().trim();
      const id = (u.id || u.uid || "").toLowerCase().trim();
      if (!name || name === "Registered User" || name === "Reviewer") return;
      if (email === "4samet@gmail.com" || name.toLowerCase() === "samet" || id === "4samet-user-id" || id === "usr_4samet_gmail_com") return;
      if (deletedSet.has(email) || deletedSet.has(name.toLowerCase()) || deletedSet.has(id)) return;

      const key = name.toLowerCase();
      const existing = map.get(key);
      const isFollowed = followedAuthorsSet.has(key);
      const followersList = Array.isArray(u.followers) ? u.followers : [];
      const followersCount = typeof u.followersCount === "number" ? u.followersCount : followersList.length;

      map.set(key, {
        name,
        avatar: u.avatar || existing?.avatar || `/api/avatar?name=${encodeURIComponent(name)}&background=27272a&color=fff`,
        bio: u.bio || existing?.bio || "Community reviewer on Yoouz",
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
    if (currentUser?.email) {
      map.delete(currentUser.email.toLowerCase().trim());
    }
    map.delete("samet");
    map.delete("4samet@gmail.com");

    return map;
  }, [videos, allUsers, followedAuthorsSet, currentUser]);

  // People the current user follows (guarantees every item in followedAuthors is rendered)
  const followedAuthors = useMemo(() => {
    if (!currentUser) return [];
    const list: VideoAuthor[] = [];
    const seen = new Set<string>();

    const rawFollowed = Array.isArray(currentUser.followedAuthors) ? currentUser.followedAuthors : [];
    rawFollowed.forEach((nameItem) => {
      const clean = (nameItem || "").trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      const existing = allAuthorsMap.get(key);
      if (existing) {
        list.push({ ...existing, isFollowed: true });
      } else {
        // Synthesize fallback so database follows are never lost
        list.push({
          name: clean,
          avatar: `/api/avatar?name=${encodeURIComponent(clean)}&background=27272a&color=fff`,
          bio: "Community reviewer",
          isFollowed: true,
          followersCount: 0,
          videoReviewCount: 0
        });
      }
    });

    return list;
  }, [currentUser, allAuthorsMap]);

  // People who follow the current user
  const myFollowers = useMemo(() => {
    if (!currentUser) return [];
    const myNameLower = (currentUser.name || "").toLowerCase().trim();
    const myEmailLower = (currentUser.email || "").toLowerCase().trim();
    const directFollowers = Array.isArray(currentUser.followers) ? currentUser.followers : [];

    const list: Array<{
      name: string;
      avatar: string;
      bio?: string;
      location?: string;
      isFollowed: boolean;
      followersCount: number;
    }> = [];
    const seen = new Set<string>();

    allUsers.forEach((u: any) => {
      const userName = (u.name || "").trim();
      if (!userName || userName.toLowerCase() === myNameLower) return;

      const userFollows = Array.isArray(u.followedAuthors) ? u.followedAuthors : [];
      const isFollowingMe =
        userFollows.some((h: string) => h.toLowerCase() === myNameLower || (myEmailLower && h.toLowerCase() === myEmailLower)) ||
        directFollowers.some((df: string) => df.toLowerCase() === userName.toLowerCase());

      if (isFollowingMe) {
        const key = userName.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        list.push({
          name: userName,
          avatar: u.avatar || `/api/avatar?name=${encodeURIComponent(userName)}&background=27272a&color=fff`,
          bio: u.bio || "Community reviewer",
          location: u.location,
          isFollowed: followedAuthorsSet.has(key),
          followersCount: typeof u.followersCount === "number" ? u.followersCount : 0
        });
      }
    });

    // Add any direct followers not found in allUsers
    directFollowers.forEach((df: string) => {
      const clean = (df || "").trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (key === myNameLower || seen.has(key)) return;
      seen.add(key);

      list.push({
        name: clean,
        avatar: `/api/avatar?name=${encodeURIComponent(clean)}&background=27272a&color=fff`,
        bio: "Community reviewer",
        isFollowed: followedAuthorsSet.has(key),
        followersCount: 0
      });
    });

    return list;
  }, [allUsers, currentUser, followedAuthorsSet]);

  // Filter lists based strictly on reviewer name (no handles, just like Discover)
  const filteredFollowing = useMemo(() => {
    if (!searchQuery.trim()) return followedAuthors;
    const q = searchQuery.toLowerCase().trim();
    return followedAuthors.filter((a) =>
      a.name.toLowerCase().includes(q)
    );
  }, [followedAuthors, searchQuery]);

  const filteredFollowers = useMemo(() => {
    if (!searchQuery.trim()) return myFollowers;
    const q = searchQuery.toLowerCase().trim();
    return myFollowers.filter((f) =>
      f.name.toLowerCase().includes(q)
    );
  }, [myFollowers, searchQuery]);

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
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-32 md:pb-12">
        {/* Header Card */}
        <div id="following-header-card" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 p-4.5 sm:p-6 rounded-3xl border border-zinc-800 shadow-sm">
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
                <span>Following & Followers</span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Manage who you follow and see who follows your reviews.
              </p>
            </div>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div id="following-segmented-tabs" className="grid grid-cols-2 gap-1 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 shrink-0 self-stretch sm:self-auto sm:w-64">
            <button
              id="tab-btn-following"
              onClick={() => {
                setActiveTab("following");
                setSearchQuery("");
              }}
              className={`py-2 px-3 text-center text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "following"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <span>Following</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "following" ? "bg-zinc-200 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"}`}>
                {followedAuthors.length}
              </span>
            </button>
            <button
              id="tab-btn-followers"
              onClick={() => {
                setActiveTab("followers");
                setSearchQuery("");
              }}
              className={`py-2 px-3 text-center text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "followers"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <span>Followers</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === "followers" ? "bg-zinc-200 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"}`}>
                {myFollowers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search / Filter Input */}
        {(followedAuthors.length > 0 || myFollowers.length > 0 || searchQuery) && (
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === "following" ? "following" : "followers"} by name...`}
              className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-0.5 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Following List */}
        {activeTab === "following" && (
          <div id="tab-following-content" className="space-y-3 animate-in fade-in duration-150">
            {filteredFollowing.length === 0 ? (
              <div id="following-empty-state" className="p-8 sm:p-12 rounded-3xl bg-zinc-900/90 border border-zinc-800 text-center text-zinc-400 space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="font-bold text-white text-sm sm:text-base">
                    {searchQuery ? "No matching reviewers found" : "You aren't following anyone yet"}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {searchQuery
                      ? `No reviewer matches "${searchQuery}". Try a different name.`
                      : "When you follow authentic local reviewers on Yoouz, they will appear here."}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFollowing.map((author) => {
                  const isHovered = hoveredUnfollow === author.name;
                  return (
                    <div
                      key={`following-reviewer-${author.name}`}
                      id={`card-following-${author.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      className="p-3.5 sm:p-4 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-zinc-700/80 transition-colors"
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
                            {author.videoReviewCount ? `${author.videoReviewCount} video ${author.videoReviewCount === 1 ? 'review' : 'reviews'}` : (author.location ? `📍 ${author.location}` : (author.bio || "Community reviewer"))}
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
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
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

        {/* Tab 2: Followers List */}
        {activeTab === "followers" && (
          <div id="tab-followers-content" className="space-y-3 animate-in fade-in duration-150">
            {filteredFollowers.length === 0 ? (
              <div id="followers-empty-state" className="p-8 sm:p-12 rounded-3xl bg-zinc-900/90 border border-zinc-800 text-center text-zinc-400 space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="font-bold text-white text-sm sm:text-base">
                    {searchQuery ? "No matching followers found" : "No followers yet"}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {searchQuery
                      ? `No follower matches "${searchQuery}". Try a different name.`
                      : "When other local reviewers follow your profile, they will appear here."}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFollowers.map((follower) => {
                  const isFollowingThem = followedAuthorsSet.has(follower.name.toLowerCase());
                  const isHovered = hoveredUnfollow === follower.name;
                  return (
                    <div
                      key={`follower-${follower.name}`}
                      id={`card-follower-${follower.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      className="p-3.5 sm:p-4 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-zinc-700/80 transition-colors"
                    >
                      <div
                        onClick={() => onOpenCreator({ name: follower.name, avatar: follower.avatar } as any)}
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
                          <p className="text-[11px] text-zinc-400 truncate">
                            {follower.location ? `📍 ${follower.location}` : (follower.bio || "Community reviewer")}
                          </p>
                        </div>
                      </div>

                      <button
                        id={`btn-follower-action-${follower.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        onMouseEnter={() => setHoveredUnfollow(follower.name)}
                        onMouseLeave={() => setHoveredUnfollow(null)}
                        onClick={() => onToggleFollow(follower.name)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full font-black text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                          isFollowingThem
                            ? isHovered
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                            : "bg-white hover:bg-zinc-200 text-zinc-950"
                        }`}
                      >
                        {isFollowingThem ? (
                          isHovered ? (
                            <>
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Unfollow</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                              <span>Following</span>
                            </>
                          )
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
      </div>
    </div>
  );
};
