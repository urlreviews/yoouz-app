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
import { isAuthorMatch, getSafeAvatarUrl, formatCityCountry } from "../utils/placeUtils";
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
  isMobileModal?: boolean;
  initialQuery?: string;
  hideSearchBar?: boolean;
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
  onNavigateHome,
  isMobileModal = false,
  initialQuery = "",
  hideSearchBar = false
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
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
    let isFetching = false;
    const fetchUsers = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch(`/api/nosql/users?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setFetchedDbUsers(data);
          }
        }
      } catch (e) {
        // Silently handle
      } finally {
        isFetching = false;
      }
    };

    fetchUsers();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && (typeof navigator === "undefined" || navigator.onLine)) {
        fetchUsers();
      }
    }, 30000);

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchUsers();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleFocus);
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
      return getSafeAvatarUrl(avatar, name, handle);
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

      // 1. Direct ID / UID match
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

        const candidateLoc = candidate.location || candidate.author?.location || "";

        found = {
          author: {
            name: rawName,
            handle: safeHandle,
            avatar: bestAvatar,
            bio: candidate.bio || candidate.author?.bio || "",
            location: candidateLoc,
            isVerified: false,
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
      className="flex-1 h-full w-full max-w-full min-w-0 relative overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none touch-pan-y bg-[#050506] text-white flex flex-col items-center p-4 sm:p-6 pt-6 sm:pt-10 pb-24 select-none"
    >
      {onNavigateHome && (
        <div className="w-full max-w-3xl flex justify-start mb-2">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold transition-colors cursor-pointer border border-white/[0.1] active:scale-95"
            title="Back to Feed"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            <span>{t("nav.home", "Home")}</span>
          </button>
        </div>
      )}

      <div className={`w-full max-w-3xl flex flex-col items-center animate-in fade-in duration-300 ${isMobileModal ? 'mt-0' : 'mt-2 sm:mt-4'}`}>
        
        {!hideSearchBar && !isMobileModal && (
          <>
            <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.1] rounded-2xl flex items-center justify-center mb-4 shadow-sm shrink-0">
              <Users className="w-7 h-7 text-white" strokeWidth={1.6} />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-[-0.03em] text-center mb-2">
              {t("discover.title", "Discover Reviewers")}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 text-center mb-6 max-w-md">
              {t("discover.subtitle", "Browse verified community members sharing real, live camera photo reviews.")}
            </p>
          </>
        )}

        {/* Search Bar */}
        {!hideSearchBar && (
          <div className="w-full max-w-xl mb-8">
            <div className="w-full relative group shadow-[0_12px_36px_rgba(0,0,0,0.55)] rounded-full bg-white/[0.045] border border-white/[0.1] focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/[0.06] transition-all">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-zinc-400 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("discover.searchPlaceholder", "Search reviewer by name or handle...")}
                className="block w-full pl-12 pr-28 py-3.5 rounded-full text-[14px] bg-transparent focus:outline-none placeholder:text-zinc-500 text-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 right-24 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Clear search query"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="absolute inset-y-0 right-1.5 flex items-center">
                <button
                  type="button"
                  className="h-9 px-5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {t("discover.searchAction", "Search")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviewers List (Always visible on load so Discover never shows an empty black void) */}
        <div className="w-full text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3.5 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              {query.trim().length > 0
                ? `${t("discover.searchResults", "Search Results")} (${displayedReviewers.length})`
                : `${t("discover.activeReviewers", "Active Reviewers")} (${displayedReviewers.length})`}
            </span>
            <span className="text-zinc-500 hidden sm:block font-normal normal-case tracking-normal">
              {t("discover.tapToView", "Tap a reviewer to open their profile")}
            </span>
          </div>

          {displayedReviewers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedReviewers.map((reviewer, idx) => {
                return (
                  <div
                    key={`reviewer-card-${reviewer.author.name}-${idx}`}
                    onClick={() => onOpenCreator(reviewer.author)}
                    className="bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/[0.08] hover:border-white/[0.18] p-4 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
                  >
                    {/* Left: Avatar + Name + Metadata */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={getSafeAvatarUrl(reviewer.author.avatar, reviewer.author.name, reviewer.author.handle)}
                          alt={reviewer.author.name}
                          className="w-12 h-12 rounded-full object-cover border border-white/[0.12] group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = getSafeAvatarUrl(null, reviewer.author.name, reviewer.author.handle);
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-sm sm:text-[15px] font-semibold text-white truncate group-hover:text-zinc-100 transition-colors">
                            {reviewer.author.name}
                          </h3>
                        </div>
                        
                        {reviewer.author.location ? (
                          <p className="text-xs text-zinc-400 font-normal flex items-center gap-1 truncate mb-0.5">
                            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="truncate">{formatCityCountry(reviewer.author.location || reviewer.author)}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 font-normal truncate mb-0.5">
                            {t("discover.localContributor", "Community Reviewer")}
                          </p>
                        )}
                        
                        <p className="text-[11px] font-medium text-zinc-300 tabular-nums">
                          {reviewer.count} {reviewer.count === 1 ? t("common.photoReview", "photo review") : t("common.photoReviews", "photo reviews")}
                        </p>
                      </div>
                    </div>

                    {/* Right: Navigation Indicator */}
                    <div className="shrink-0 flex items-center text-zinc-500 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/[0.025] rounded-3xl border border-white/[0.08] p-10 text-center">
              <p className="text-sm font-semibold text-white mb-1">
                {query.trim()
                  ? t("discover.noReviewersFound", `No reviewers found matching "${query}"`)
                  : t("discover.noReviewersYet", "No reviewers yet")}
              </p>
              <p className="text-xs text-zinc-400">
                {query.trim()
                  ? t("discover.trySearchingName", "Try searching by another name or handle.")
                  : t("discover.beFirst", "Post the first live photo review to appear here.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
