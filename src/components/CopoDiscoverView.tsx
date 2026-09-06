import React, { useState, useMemo, useEffect } from "react";
import { VideoReview, VideoAuthor, UserProfile } from "../types";
import {
  Search,
  Users,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  MapPin
} from "lucide-react";
import { isAuthorMatch } from "../utils/placeUtils";
import { useLanguage } from "../i18n/LanguageContext";

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
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [fetchedDbUsers, setFetchedDbUsers] = useState<any[]>([]);
  const [profileSyncTick, setProfileSyncTick] = useState<number>(0);

  // Instantly re-render when local or global user profile updates occur (e.g. location changed to Brooklyn)
  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileSyncTick((prev) => prev + 1);
    };
    window.addEventListener("copo-profile-updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    return () => {
      window.removeEventListener("copo-profile-updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, []);

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

  // Consolidate real registered users and real authors from video reviews into unique profiles
  const realReviewers = useMemo(() => {
    // Helper to sanitize and normalize tokens
    const normalize = (val?: string | null): string => {
      if (!val) return "";
      return String(val)
        .toLowerCase()
        .trim()
        .replace(/^@+/, "")
        .replace(/[^a-z0-9]/g, "");
    };

    const getAppropriateAvatar = (name?: string, handle?: string, avatar?: string): string => {
      if (
        avatar &&
        !avatar.includes("dicebear") &&
        !avatar.includes("unsplash") &&
        !avatar.includes("/api/videos/") &&
        !avatar.includes(".mp4") &&
        !avatar.includes("rev-")
      ) {
        return avatar;
      }
      return `/api/avatar?name=${encodeURIComponent(name || "User")}&background=27272a&color=fff&bold=true&size=128`;
    };

    // Deep equality check to determine if candidate A and candidate B are the same human creator
    const areSameReviewer = (a: any, b: any): boolean => {
      if (!a || !b) return false;

      // Extract names, handles, emails, ids
      const aName = normalize(a.name || a.author?.name);
      const bName = normalize(b.name || b.author?.name);

      const aHandle = normalize(a.handle || a.author?.handle);
      const bHandle = normalize(b.handle || b.author?.handle);

      const aEmail = (a.email || a.userEmail || "").toLowerCase().trim();
      const bEmail = (b.email || b.userEmail || "").toLowerCase().trim();

      const aPrefix = aEmail.includes("@") ? normalize(aEmail.split("@")[0]) : "";
      const bPrefix = bEmail.includes("@") ? normalize(bEmail.split("@")[0]) : "";

      const aId = (a.id || a.uid || a.userId || "").toLowerCase().trim();
      const bId = (b.id || b.uid || b.userId || "").toLowerCase().trim();

      // 1. Known alias group for aouisesmee
      const isAouisesmee = (x: any) => {
        const s = `${x.name || ""} ${x.author?.name || ""} ${x.handle || ""} ${x.author?.handle || ""} ${x.email || x.userEmail || ""} ${x.id || x.uid || x.userId || ""}`.toLowerCase();
        return s.includes("aouisesmee") || s.includes("aouisesme") || s.includes("mlio66hdr9trvofdgddgwm30rku2");
      };
      if (isAouisesmee(a) && isAouisesmee(b)) return true;

      // 2. Direct ID / UID match
      if (aId && bId && (aId === bId || aId === `usr_${bId}` || bId === `usr_${aId}`)) return true;

      // 3. Direct Email match
      if (aEmail && bEmail && aEmail === bEmail) return true;

      // 4. Normalized Name match (must not be generic placeholder)
      const isGeneric = (n: string) => !n || n === "reviewer" || n === "user" || n === "localcontributor" || n === "communityreviewer";
      if (aName && bName && !isGeneric(aName) && aName === bName) return true;
      if (aHandle && bHandle && !isGeneric(aHandle) && aHandle === bHandle) return true;
      if (aName && bHandle && !isGeneric(aName) && aName === bHandle) return true;
      if (aHandle && bName && !isGeneric(aHandle) && aHandle === bName) return true;

      // 5. Email prefix matching handle or name
      if (aPrefix && !isGeneric(aPrefix)) {
        if (aPrefix === bName || aPrefix === bHandle) return true;
      }
      if (bPrefix && !isGeneric(bPrefix)) {
        if (bPrefix === aName || bPrefix === aHandle) return true;
      }

      // 6. Leverage isAuthorMatch
      if (isAuthorMatch({ author: a.author || a, userEmail: aEmail, userId: aId } as any, b.author || b)) {
        return true;
      }
      if (isAuthorMatch({ author: b.author || b, userEmail: bEmail, userId: bId } as any, a.author || a)) {
        return true;
      }

      return false;
    };

    const reviewersList: ReviewerData[] = [];

    // Helper to find or create a consolidated reviewer entry
    const getOrCreateReviewer = (candidate: any): ReviewerData => {
      let found = reviewersList.find(r => areSameReviewer(r.author, candidate) || areSameReviewer(r, candidate));
      if (!found) {
        const rawName = candidate.name || candidate.author?.name || candidate.email?.split("@")[0] || "Reviewer";
        const rawHandle = candidate.handle || candidate.author?.handle || `@${normalize(rawName)}`;
        const safeHandle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
        const bestAvatar = getAppropriateAvatar(rawName, safeHandle, candidate.avatar || candidate.author?.avatar);

        const candidateLoc = candidate.location || candidate.author?.location || (
          rawName.toLowerCase().includes("aouisesmee") ? "Los Angeles, California, United States" :
          rawName.toLowerCase().includes("biz riv") ? "Paris, France" : ""
        );

        found = {
          author: {
            name: rawName,
            handle: safeHandle,
            avatar: bestAvatar,
            bio: candidate.bio || candidate.author?.bio || "Community reviewer on Yoouz.",
            location: candidateLoc,
            isVerified: candidate.isVerified ?? candidate.author?.isVerified ?? true,
            isFollowed: Boolean(candidate.isFollowed || candidate.author?.isFollowed),
            followersCount: candidate.followersCount || candidate.author?.followersCount || 0
          },
          count: 0,
          avgRating: 5.0,
          videos: [],
          searchTokens: []
        };
        reviewersList.push(found);
      }
      return found;
    };

    // Read the most authoritative real-time profile (from state or localStorage)
    let activeUser = currentUser;
    try {
      const saved = localStorage.getItem("copo_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          activeUser = { ...(currentUser || {}), ...parsed };
        }
      }
    } catch (e) {}

    // 1. Process all real registered users & current user first to establish authoritative creator profiles
    const sourceUsers: any[] = [];
    if (activeUser) {
      sourceUsers.push({
        name: activeUser.name,
        email: activeUser.email,
        avatar: activeUser.avatar,
        handle: activeUser.handle,
        bio: activeUser.bio,
        location: activeUser.location,
        followersCount: activeUser.followersCount,
        isAuthoritative: true
      });
    }
    sourceUsers.push(...allUsers, ...fetchedDbUsers);

    // Read deleted users to ensure banned/purged accounts never appear
    let deletedUsersSet = new Set<string>();
    try {
      const savedDeleted = localStorage.getItem("yoouz_deleted_users");
      if (savedDeleted) {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p) deletedUsersSet.add(String(p).toLowerCase().trim());
          });
        }
      }
    } catch (e) {}

    sourceUsers.forEach((u) => {
      if (!u) return;
      const rawName = u.name || u.email?.split("@")[0] || "";
      const rawEmail = (u.email || "").toLowerCase().trim();
      const rawId = (u.id || u.uid || "").toLowerCase().trim();
      
      // Skip if explicitly deleted
      if (
        deletedUsersSet.has(rawName.toLowerCase()) ||
        deletedUsersSet.has(rawEmail) ||
        deletedUsersSet.has(rawId)
      ) {
        return;
      }

      if (rawName || rawEmail || u.handle) {
        const reviewer = getOrCreateReviewer(u);
        
        // Upgrade avatar if candidate has authentic photo
        if (u.avatar && !u.avatar.includes("dicebear") && !u.avatar.includes("unsplash") && !u.avatar.includes("/api/videos/")) {
          reviewer.author.avatar = u.avatar;
        }
        if (u.bio && (!reviewer.author.bio || reviewer.author.bio === "Community reviewer on Yoouz.")) {
          reviewer.author.bio = u.bio;
        }
        if (u.location && u.location.trim()) {
          reviewer.author.location = u.location.trim();
        }
        if (u.followersCount !== undefined && u.followersCount > (reviewer.author.followersCount || 0)) {
          reviewer.author.followersCount = u.followersCount;
        }

        // Add tokens (name and handle only)
        if (rawName) reviewer.searchTokens.push(rawName.toLowerCase());
        if (u.handle) reviewer.searchTokens.push(u.handle.toLowerCase().replace(/^@+/, ""));
      }
    });

    // 2. Process all video reviews to attach videos and find additional creators
    videos.forEach((v) => {
      if (!v || !v.author) return;
      const authorName = v.author.name || "Reviewer";
      const authorEmail = (v.userEmail || "").toLowerCase().trim();
      const authorId = (v.userId || "").toLowerCase().trim();

      // Skip deleted authors
      if (
        deletedUsersSet.has(authorName.toLowerCase()) ||
        deletedUsersSet.has(authorEmail) ||
        deletedUsersSet.has(authorId)
      ) {
        return;
      }

      const reviewer = getOrCreateReviewer({
        author: v.author,
        name: authorName,
        handle: v.author.handle,
        email: authorEmail,
        id: authorId,
        avatar: v.author.avatar,
        location: v.author.location
      });

      // Avoid duplicate video entries inside the reviewer's list
      if (!reviewer.videos.some((rv) => rv.id === v.id)) {
        reviewer.videos.push(v);
      }

      // Upgrade avatar if video has authentic Google avatar
      if (
        v.author.avatar &&
        !v.author.avatar.includes("dicebear") &&
        !v.author.avatar.includes("unsplash") &&
        !v.author.avatar.includes("/api/videos/") &&
        !v.author.avatar.includes(".mp4") &&
        !v.author.avatar.includes("rev-")
      ) {
        reviewer.author.avatar = v.author.avatar;
      }

      if (v.author.location && !reviewer.author.location) {
        reviewer.author.location = v.author.location;
      }

      if (v.author.isFollowed) {
        reviewer.author.isFollowed = true;
      }

      if (authorName) reviewer.searchTokens.push(authorName.toLowerCase());
      if (v.author.handle) reviewer.searchTokens.push(v.author.handle.toLowerCase().replace(/^@+/, ""));
    });

    // 3. Ensure all videos matching each reviewer via isAuthorMatch are properly associated
    reviewersList.forEach((reviewer) => {
      videos.forEach((v) => {
        if (!reviewer.videos.some((rv) => rv.id === v.id)) {
          if (
            isAuthorMatch(v, reviewer.author) ||
            areSameReviewer(reviewer.author, {
              name: v.author?.name,
              handle: v.author?.handle,
              email: v.userEmail,
              id: v.userId
            })
          ) {
            reviewer.videos.push(v);
          }
        }
      });

      // Calculate video review count & average rating
      reviewer.count = reviewer.videos.length;
      const totalRating = reviewer.videos.reduce((sum, item) => sum + (item.rating || 5), 0);
      reviewer.avgRating = reviewer.videos.length > 0 ? Number((totalRating / reviewer.videos.length).toFixed(1)) : 5.0;

      // Unique search tokens
      reviewer.searchTokens = Array.from(new Set(reviewer.searchTokens.filter(Boolean)));
    });

    // 4. Secondary deduplication pass: merge any remaining duplicate reviewer profiles
    const mergedList: ReviewerData[] = [];
    reviewersList.forEach((rev) => {
      const existing = mergedList.find((m) => areSameReviewer(m.author, rev.author));
      if (!existing) {
        mergedList.push(rev);
      } else {
        // Merge videos
        rev.videos.forEach((rv) => {
          if (!existing.videos.some((ev) => ev.id === rv.id)) {
            existing.videos.push(rv);
          }
        });
        existing.count = existing.videos.length;
        const total = existing.videos.reduce((s, x) => s + (x.rating || 5), 0);
        existing.avgRating = existing.videos.length > 0 ? Number((total / existing.videos.length).toFixed(1)) : 5.0;
        
        // Upgrade avatar if rev has authentic avatar
        if (
          rev.author.avatar &&
          !rev.author.avatar.includes("ui-avatars") &&
          !rev.author.avatar.includes("dicebear") &&
          !rev.author.avatar.includes("unsplash")
        ) {
          existing.author.avatar = rev.author.avatar;
        }

        if (rev.author.location && rev.author.location.trim()) {
          existing.author.location = rev.author.location.trim();
        }
        
        // Combine tokens (name & handle tokens only)
        existing.searchTokens = Array.from(new Set([...existing.searchTokens, ...rev.searchTokens]));
      }
    });

    // 5. Explicitly enforce the active user's latest profile (e.g. location update to Brooklyn) on their card
    if (activeUser) {
      mergedList.forEach((r) => {
        if (areSameReviewer(r.author, activeUser) || areSameReviewer(r, activeUser)) {
          if (activeUser.location !== undefined && activeUser.location !== null) {
            r.author.location = activeUser.location;
          }
          if (activeUser.name && activeUser.name.trim()) {
            r.author.name = activeUser.name.trim();
          }
          if (activeUser.avatar) {
            r.author.avatar = activeUser.avatar;
          }
          if (activeUser.bio) {
            r.author.bio = activeUser.bio;
          }
        }
      });
    }

    // 6. Final Sort: Reviewers with more video reviews first, then alphabetically
    mergedList.sort((a, b) => b.count - a.count || a.author.name.localeCompare(b.author.name));
    return mergedList;
  }, [videos, allUsers, fetchedDbUsers, currentUser, profileSyncTick]);

  // Filter reviewers matching search query with strict deduplication (only by name/username)
  const displayedReviewers = useMemo(() => {
    const raw = query.toLowerCase().trim();
    if (!raw) return realReviewers;
    
    const cleanQ = raw.replace(/^@/, "").trim();
    const qTokens = cleanQ.split(/\s+/).filter(Boolean);

    const matches = realReviewers.filter((item) => {
      const name = (item.author.name || "").toLowerCase();
      const handle = (item.author.handle || "").toLowerCase().replace(/^@/, "");
      
      // Direct string containment strictly on user name or username (handle)
      if (name.includes(cleanQ) || handle.includes(cleanQ)) {
        return true;
      }

      // Check name / handle search tokens
      if (item.searchTokens && item.searchTokens.some(tok => tok && (tok.includes(cleanQ) || cleanQ.includes(tok)))) {
        return true;
      }

      // Multi-word token match strictly on user name & username
      if (qTokens.length > 0) {
        const fullProfileString = `${name} ${handle} ${(item.searchTokens || []).join(" ")}`;
        if (qTokens.every(t => fullProfileString.includes(t))) {
          return true;
        }
      }

      return false;
    });

    // Strict deduplication guarantee: ensure each creator appears AT MOST ONCE in search results
    const uniqueReviewers: ReviewerData[] = [];
    const seenIdentities = new Set<string>();

    for (const r of matches) {
      const cleanName = (r.author.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const emailToken = (r.searchTokens.find(t => t.includes("@")) || "").toLowerCase().trim();
      const cleanKey = emailToken || cleanName;

      if (!cleanKey || !seenIdentities.has(cleanKey)) {
        if (cleanKey) seenIdentities.add(cleanKey);
        uniqueReviewers.push(r);
      }
    }

    return uniqueReviewers;
  }, [realReviewers, query]);

  return (
    <div
      id="copo-discover-root"
      className="flex-1 h-full w-full relative overflow-y-auto bg-zinc-950 text-white flex flex-col items-center p-4 sm:p-6 pt-6 sm:pt-10 pb-20 select-none"
    >
      {onNavigateHome && (
        <div className="w-full max-w-3xl flex justify-start mb-2">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors cursor-pointer border border-zinc-800 active:scale-95"
            title="Back to Feed"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t("nav.home", "Feed")}</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-3xl flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-[2vh] sm:mt-[4vh]">
        
        {/* Central Logo / Icon */}
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-xs animate-fade-in shrink-0">
          <Users className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight text-center mb-6">
          {t("discover.title", "Discover Reviewers")}
        </h1>

        {/* Search Bar - styled exactly like the Search page */}
        <div className="w-full max-w-xl mb-12">
          <div className="w-full relative group shadow-sm rounded-full bg-zinc-900 border border-zinc-800 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/20 transition-all">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("discover.searchPlaceholder", "Search reviewer by name...")}
              className="block w-full pl-12 pr-28 py-3.5 rounded-full text-[14px] bg-transparent focus:outline-none placeholder:text-zinc-500 text-white"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-24 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Clear search query"
              >
                <span className="text-xl font-medium leading-none">×</span>
              </button>
            )}
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <button
                type="button"
                className="h-9 px-5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                {t("common.search", "Search")}
              </button>
            </div>
          </div>
        </div>

        {/* Reviewers List */}
        {query.trim().length > 0 && (
          <div className="w-full text-left animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                {t("discover.searchResults", "Search Results")} ({displayedReviewers.length})
              </span>
            <span className="text-zinc-400 hidden sm:block font-medium">{t("discover.tapToView", "Tap card to view profile")}</span>
          </div>

          {displayedReviewers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {displayedReviewers.map((reviewer, idx) => {
                return (
                  <div
                    key={`reviewer-card-${reviewer.author.name}-${idx}`}
                    onClick={() => onOpenCreator(reviewer.author)}
                    className="bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    {/* Left: Avatar + Name + Metadata */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={reviewer.author.avatar}
                          alt={reviewer.author.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-zinc-800 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                          onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                            {reviewer.author.name}
                          </h3>
                          {reviewer.author.isVerified && (
                            <span title="Verified Reviewer" className="inline-flex items-center">
                              <CheckCircle className="w-4 h-4 fill-white text-black shrink-0" />
                            </span>
                          )}
                        </div>
                        
                        {reviewer.author.location ? (
                          <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 mb-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{reviewer.author.location}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 mb-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span>{t("discover.localContributor", "Local Contributor")}</span>
                          </p>
                        )}
                        
                        <p className="text-[11px] font-semibold text-zinc-500">
                          {reviewer.count} {reviewer.count === 1 ? t("common.videoReview", "video review") : t("common.videoReviews", "video reviews")}
                        </p>
                      </div>
                    </div>

                    {/* Right: Navigation Indicator */}
                    <div className="shrink-0 flex items-center pl-2 text-zinc-400 group-hover:text-white transition-colors">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center shadow-sm">
              <p className="text-sm font-bold text-white mb-1">
                {t("discover.noReviewersFound", `No reviewers found matching "${query}"`)}
              </p>
              <p className="text-xs text-zinc-400">
                {t("discover.trySearchingName", "Try searching by their name.")}
              </p>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
};
