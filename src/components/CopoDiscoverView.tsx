import React, { useState, useMemo, useEffect } from "react";
import { VideoReview, VideoAuthor, UserProfile } from "../types";
import {
  Search,
  Users,
  CheckCircle,
  Star,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  MapPin
} from "lucide-react";
import { isAuthorMatch } from "../utils/placeUtils";

interface CopoDiscoverViewProps {
  videos: VideoReview[];
  allUsers?: any[];
  currentUser?: UserProfile | null;
  onOpenCreator: (author: VideoAuthor) => void;
  onToggleFollow?: (name: string) => void;
  onStartChat?: (senderId: string, senderName: string, senderAvatar: string) => void;
  onSelectVideo?: (videoId: string, source?: string) => void;
  onOpenAuth?: () => void;
  onNavigateHome?: () => void;
}

interface ReviewerData {
  author: VideoAuthor;
  count: number;
  avgRating: number;
  videos: VideoReview[];
  searchTokens: string[];
}

export const CopoDiscoverView: React.FC<CopoDiscoverViewProps> = ({
  videos,
  allUsers = [],
  currentUser,
  onOpenCreator,
  onNavigateHome
}) => {
  const [query, setQuery] = useState("");
  const [fetchedDbUsers, setFetchedDbUsers] = useState<any[]>([]);

  // Automatically fetch & poll real registered users from server to ensure instant real-time discoverability
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/nosql/users");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setFetchedDbUsers(data);
          }
        }
      } catch (e) {
        // Silently handle
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Consolidate real registered users and real authors from video reviews
  const realReviewers = useMemo(() => {
    const map = new Map<string, ReviewerData>();

    const getCleanKey = (email?: string, handle?: string, name?: string): string => {
      if (email && email.includes("@")) return email.toLowerCase().trim();
      const raw = handle || name || "";
      return raw.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    };

    const getAppropriateAvatar = (name?: string, handle?: string, avatar?: string): string => {
      if (avatar && !avatar.includes("dicebear") && !avatar.includes("unsplash")) {
        return avatar;
      }
      const isBiz = (name || "").toLowerCase().includes("biz") || (handle || "").toLowerCase().includes("louis");
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=${isBiz ? "059669" : "1a73e8"}&color=fff&bold=true&size=128`;
    };

    // 1. Add reviewers from real video reviews
    videos.forEach((v) => {
      if (v.author && (v.author.name || v.author.name)) {
        const authorName = v.author.name || "Reviewer";
        const rawHandle = (v.author.name || authorName).replace(/^@+/, "");
        const normKey = getCleanKey(v.userEmail || v.userId, rawHandle, authorName);
        if (!normKey) return;

        const bestAvatar = getAppropriateAvatar(authorName, rawHandle, v.author.avatar);

        const existing = map.get(normKey);
        if (existing) {
          existing.count += 1;
          existing.videos.push(v);
          const totalRating = existing.videos.reduce((sum, item) => sum + (item.rating || 5), 0);
          existing.avgRating = Number((totalRating / existing.videos.length).toFixed(1));
          if (v.author.isFollowed) {
            existing.author.isFollowed = true;
          }
          if (v.author.name && (!existing.author.name || existing.author.name === "Reviewer")) {
            existing.author.name = v.author.name;
          }
          if (!existing.author.avatar || existing.author.avatar.includes("dicebear") || existing.author.avatar.includes("unsplash")) {
            existing.author.avatar = bestAvatar;
          }
        } else {
          map.set(normKey, {
            author: {
              ...v.author,
              name: authorName,
              
              avatar: bestAvatar,
              isVerified: v.author.isVerified ?? true,
              isFollowed: Boolean(v.author.isFollowed),
              followersCount: v.author.followersCount ?? 0,
              bio: v.author.bio || `Community reviewer on Yoouz.`
            },
            count: 1,
            avgRating: v.rating || 5.0,
            videos: [v],
            searchTokens: [
              authorName.toLowerCase(),
              rawHandle.toLowerCase(),
              normKey,
              (v.userEmail || "").toLowerCase()
            ]
          });
        }
      }
    });

    // 2. Add real registered users from database / current user
    const sourceUsers = [...allUsers, ...fetchedDbUsers];
    if (currentUser) {
      sourceUsers.push({
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        
        bio: currentUser.bio,
        followersCount: currentUser.followersCount
      });
    }

    sourceUsers.forEach((u) => {
      if (u && (u.name || u.email || u.name)) {
        const rawName = u.name || u.email?.split("@")[0] || "Reviewer";
        const rawHandle = (u.name || u.email?.split("@")[0] || rawName.toLowerCase().replace(/[^a-z0-9_]/g, "")).replace(/^@+/, "");
        const normKey = getCleanKey(u.email || u.uid || u.id, rawHandle, rawName);
        if (!normKey) return;

        const userAvatar = getAppropriateAvatar(rawName, rawHandle, u.avatar);

        const existing = map.get(normKey);
        if (existing) {
          if (!existing.author.avatar || existing.author.avatar.includes("ui-avatars") || existing.author.avatar.includes("unsplash")) {
            if (u.avatar && !u.avatar.includes("unsplash")) existing.author.avatar = u.avatar;
          }
          if (u.bio && !existing.author.bio) {
            existing.author.bio = u.bio;
          }
          if (u.followersCount !== undefined && !existing.author.followersCount) {
            existing.author.followersCount = u.followersCount;
          }
          if (u.name && existing.author.name !== u.name) {
            existing.searchTokens.push(u.name.toLowerCase());
          }
          if (u.email) {
            existing.searchTokens.push(u.email.toLowerCase());
            existing.searchTokens.push(u.email.split("@")[0].toLowerCase());
          }
        } else {
          const userVideos = videos.filter((v) => isAuthorMatch(v, { name: rawName,  email: u.email }));
          const totalRating = userVideos.reduce((sum, item) => sum + (item.rating || 5), 0);
          const avgRating = userVideos.length > 0 ? Number((totalRating / userVideos.length).toFixed(1)) : 5.0;

          map.set(normKey, {
            author: {
              name: rawName,
              
              avatar: userAvatar,
              bio: u.bio || "Community reviewer on Yoouz.",
              isVerified: u.isVerified ?? true,
              isFollowed: false,
              followersCount: u.followersCount ?? 0
            },
            count: userVideos.length,
            avgRating: avgRating,
            videos: userVideos,
            searchTokens: [
              rawName.toLowerCase(),
              rawHandle.toLowerCase(),
              normKey,
              (u.email || "").toLowerCase(),
              (u.email?.split("@")[0] || "").toLowerCase()
            ]
          });
        }
      }
    });

    const reviewersList = Array.from(map.values());
    // Sort by video count descending, then alphabetical
    reviewersList.sort((a, b) => b.count - a.count || a.author.name.localeCompare(b.author.name));
    return reviewersList;
  }, [videos, allUsers, fetchedDbUsers, currentUser]);

  // Filter reviewers matching search query
  const displayedReviewers = useMemo(() => {
    const raw = query.toLowerCase().trim();
    if (!raw) return realReviewers;
    
    const cleanQ = raw.replace(/^@/, "").trim();
    const qTokens = cleanQ.split(/\s+/).filter(Boolean);

    return realReviewers.filter((item) => {
      const name = (item.author.name || "").toLowerCase();
      const handle = (item.author.name || "").toLowerCase().replace(/^@/, "");
      const bio = (item.author.bio || "").toLowerCase();
      
      // Direct string containment
      if (name.includes(cleanQ) || handle.includes(cleanQ) || bio.includes(cleanQ)) {
        return true;
      }

      // Check search tokens
      if (item.searchTokens && item.searchTokens.some(tok => tok && (tok.includes(cleanQ) || cleanQ.includes(tok)))) {
        return true;
      }

      // Multi-word token match (e.g. "Biz Riv" matches name "Biz Riv" or initial letters)
      if (qTokens.length > 0) {
        const fullProfileString = `${name} ${handle} ${bio} ${(item.searchTokens || []).join(" ")}`;
        if (qTokens.every(t => fullProfileString.includes(t))) {
          return true;
        }
      }

      return false;
    });
  }, [realReviewers, query]);

  return (
    <div
      id="copo-discover-root"
      className="flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col items-center p-4 sm:p-6 pt-6 sm:pt-10 pb-20 select-none"
    >
      {onNavigateHome && (
        <div className="w-full max-w-3xl flex justify-start mb-2">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 md:bg-zinc-100 hover:bg-zinc-800 md:hover:bg-zinc-200 text-zinc-300 md:text-zinc-700 text-xs font-bold transition-colors cursor-pointer border border-zinc-800 md:border-zinc-200 active:scale-95"
            title="Back to Feed"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Feed</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-3xl flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-[2vh] sm:mt-[4vh]">
        
        {/* Central Logo / Icon */}
        <div className="w-16 h-16 bg-zinc-900 md:bg-blue-50 border border-zinc-800 md:border-blue-100 rounded-full flex items-center justify-center mb-6 shadow-xs animate-fade-in shrink-0">
          <Users className="w-8 h-8 text-[#1a73e8]" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-white md:text-zinc-900 tracking-tight text-center mb-6">
          Discover Reviewers
        </h1>

        {/* Search Bar - styled exactly like the Search page */}
        <div className="w-full max-w-xl mb-12">
          <div className="w-full relative group shadow-sm rounded-full bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 md:focus-within:ring-blue-100 transition-all">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500 md:text-zinc-400 group-focus-within:text-[#1a73e8] transition-colors" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviewer by name..."
              className="block w-full pl-12 pr-28 py-3.5 rounded-full text-[14px] bg-transparent focus:outline-none placeholder:text-zinc-500 md:placeholder:text-zinc-400 text-white md:text-zinc-900"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-24 flex items-center text-zinc-400 hover:text-zinc-200 md:hover:text-zinc-600 transition-colors cursor-pointer"
                title="Clear search query"
              >
                <span className="text-xl font-medium leading-none">×</span>
              </button>
            )}
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <button
                type="button"
                className="h-9 px-5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Reviewers List */}
        {query.trim().length > 0 && (
          <div className="w-full text-left animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 md:text-zinc-500 uppercase tracking-wider mb-4 px-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 md:text-blue-600" />
                Search Results ({displayedReviewers.length})
              </span>
            <span className="text-zinc-500 md:text-zinc-400 hidden sm:block font-medium">Tap card to view profile</span>
          </div>

          {displayedReviewers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {displayedReviewers.map((reviewer, idx) => {
                return (
                  <div
                    key={`reviewer-card-${reviewer.author.name}-${idx}`}
                    onClick={() => onOpenCreator(reviewer.author)}
                    className="bg-zinc-900 md:bg-white rounded-2xl border border-zinc-800 md:border-zinc-200 hover:border-blue-500 md:hover:border-blue-300 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    {/* Left: Avatar + Name + Metadata */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={reviewer.author.avatar}
                          alt={reviewer.author.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-zinc-800 md:border-zinc-100 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        {reviewer.author.isVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#1a73e8] text-white rounded-full flex items-center justify-center ring-2 ring-zinc-900 md:ring-white">
                            <CheckCircle className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm sm:text-base font-bold text-white md:text-zinc-900 truncate group-hover:text-[#1a73e8] transition-colors">
                            {reviewer.author.name}
                          </h3>
                          {reviewer.author.isVerified && (
                            <span className="text-[9px] font-black bg-blue-950/60 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] px-1.5 py-0.5 rounded border border-blue-800/40 md:border-blue-100 shrink-0 uppercase">
                              Verified
                            </span>
                          )}
                        </div>
                        
                        {reviewer.author.location ? (
                          <p className="text-xs text-zinc-400 md:text-zinc-500 font-semibold flex items-center gap-1 mb-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                            <span>{reviewer.author.location}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 md:text-zinc-400 font-medium mb-1 truncate">
                            Local Contributor
                          </p>
                        )}
                        
                        {reviewer.count > 0 ? (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 md:text-zinc-500">
                            <span className="flex items-center gap-0.5 text-amber-400 md:text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {reviewer.avgRating}
                            </span>
                            <span>•</span>
                            <span>{reviewer.count} {reviewer.count === 1 ? "video review" : "video reviews"}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-500 md:text-zinc-400 font-medium mt-0.5">
                            Community Reviewer • 0 reviews
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Navigation Indicator */}
                    <div className="shrink-0 flex items-center pl-2 text-zinc-500 md:text-zinc-400 group-hover:text-[#1a73e8] transition-colors">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900 md:bg-white rounded-2xl border border-zinc-800 md:border-zinc-200 p-8 text-center shadow-sm">
              <p className="text-sm font-bold text-white md:text-zinc-800 mb-1">
                No reviewers found matching "{query}"
              </p>
              <p className="text-xs text-zinc-400 md:text-zinc-500">
                Try searching by their name.
              </p>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
};
