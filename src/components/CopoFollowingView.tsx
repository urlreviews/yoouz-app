import React, { useState, useMemo, useEffect } from "react";
import {
  UserPlus,
  UserCheck,
  UserMinus,
  Users,
  User,
  ChevronLeft,
  Search,
  X,
  CheckCircle2,
  MapPin,
  Building2,
  Star,
  Globe,
  Store
} from "lucide-react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { formatBusinessName, extractCleanDomain, getDisplayUrlAsDomain } from "../utils/placeUtils";
import { getCanonicalUserKey } from "../lib/userCanonicalization";

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

// Helper to unify and deduplicate author and user aliases
const getCanonicalAuthorKey = (raw: string | { name?: string; email?: string; id?: string; handle?: string }): string => {
  if (!raw) return "";
  const obj = typeof raw === "string" ? { name: raw } : raw;
  return getCanonicalUserKey(obj);
};

export const CopoFollowingView: React.FC<CopoFollowingViewProps> = ({
  places = [],
  videos = [],
  currentUser,
  allUsers = [],
  onOpenHelp,
  onOpenLegal,
  onOpenCreator,
  onOpenPlace,
  onToggleFollow,
  onToggleFollowPlace,
  onNavigateHome,
  onSuccessAuth
}) => {
  // Tabs: "following" (Who I Follow) and "followers" (Who Follows Me)
  const [activeTab, setActiveTab] = useState<"following" | "followers">("following");
  // Sub-filter inside Following: "all" | "reviewers" | "businesses"
  const [followingFilter, setFollowingFilter] = useState<"all" | "reviewers" | "businesses">("all");
  const [hoveredUnfollow, setHoveredUnfollow] = useState<string | null>(null);
  const [hoveredUnfollowPlace, setHoveredUnfollowPlace] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [profileSyncTick, setProfileSyncTick] = useState<number>(0);

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

  // Set of authors the current user follows (case-insensitive for robust matching)
  const followedAuthorsSet = useMemo(() => {
    const set = new Set<string>();
    (currentUser?.followedAuthors || []).forEach((name) => {
      if (name) set.add(name.toLowerCase().trim());
    });
    return set;
  }, [currentUser?.followedAuthors, profileSyncTick]);

  // Set of places the current user follows
  const followedPlacesSet = useMemo(() => {
    const set = new Set<string>();
    (currentUser?.followedPlaces || []).forEach((id) => {
      if (id) set.add(id.toLowerCase().trim());
    });
    try {
      const stored = localStorage.getItem("copo_followed_places");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => {
            if (id) set.add(String(id).toLowerCase().trim());
          });
        }
      }
    } catch (e) {}
    return set;
  }, [currentUser?.followedPlaces, profileSyncTick]);

  // Merge unique reviewers from videos and platform registered users
  const allAuthorsMap = useMemo(() => {
    const map = new Map<string, VideoAuthor>();

    // 1. Gather authors from video reviews
    videos.forEach((v) => {
      if (v.author && v.author.name) {
        const key = v.author.name.toLowerCase().trim();
        const isFollowed = followedAuthorsSet.has(key);
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
            return !s.includes("aouisesmee") && s !== "mlio66hdr9trvofdgddgwm30rku2";
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
      if (email === "admin@yoouz.com" || id === "admin-user-id") return;
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

    return map;
  }, [videos, allUsers, followedAuthorsSet, currentUser, profileSyncTick]);

  // People the current user follows
  const followedAuthors = useMemo(() => {
    if (!currentUser) return [];
    const list: VideoAuthor[] = [];
    const seen = new Set<string>();

    const rawFollowed = Array.isArray(currentUser.followedAuthors) ? currentUser.followedAuthors : [];
    rawFollowed.forEach((nameItem) => {
      const clean = (nameItem || "").trim();
      if (!clean) return;
      const key = getCanonicalAuthorKey(clean);
      if (!key || seen.has(key)) return;
      seen.add(key);

      const existing = allAuthorsMap.get(clean.toLowerCase()) || allAuthorsMap.get(key);
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

  // Businesses / Places the current user follows
  const followedPlacesList = useMemo(() => {
    const list: Place[] = [];
    const seen = new Set<string>();

    // 1. Check all places with isFollowed or in followedPlacesSet
    places.forEach((p) => {
      const pidLower = p.id.toLowerCase().trim();
      const pSlugLower = extractCleanDomain(p.website || p.name || p.id).replace(/[^a-z0-9]/g, "-");
      const isFollowed = followedPlacesSet.has(pidLower) || followedPlacesSet.has(pSlugLower);

      if (isFollowed && !seen.has(pidLower)) {
        seen.add(pidLower);
        seen.add(pSlugLower);

        // Dynamically compute review count and average rating from videos
        const matchingVideos = videos.filter(
          (v) =>
            v.placeId === p.id ||
            v.placeName?.toLowerCase() === p.name?.toLowerCase() ||
            (v.placeWebsite && extractCleanDomain(v.placeWebsite) === extractCleanDomain(p.website))
        );
        const reviewCount = Math.max(matchingVideos.length, p.videoReviewCount || p.totalReviews || 0);
        let dynamicRating = p.rating || 5.0;
        if (matchingVideos.length > 0) {
          const sum = matchingVideos.reduce((acc, v) => acc + (v.rating || 5), 0);
          dynamicRating = Number((sum / matchingVideos.length).toFixed(1));
        }

        list.push({
          ...p,
          rating: dynamicRating,
          totalReviews: reviewCount,
          isFollowed: true
        });
      }
    });

    // 2. Check any followed places in followedPlacesSet that weren't in places state
    followedPlacesSet.forEach((pid) => {
      const pidLower = pid.toLowerCase().trim();
      if (!seen.has(pidLower)) {
        seen.add(pidLower);
        const cleanDomain = extractCleanDomain(pid);
        const formattedName = formatBusinessName(pid);

        // Match from videos if available
        const matchingVideos = videos.filter(
          (v) =>
            v.placeId.toLowerCase() === pidLower ||
            v.placeName?.toLowerCase() === formattedName.toLowerCase() ||
            (v.placeWebsite && extractCleanDomain(v.placeWebsite) === cleanDomain)
        );
        const sampleVid = matchingVideos[0];
        const reviewCount = matchingVideos.length;
        let dynamicRating = 5.0;
        if (matchingVideos.length > 0) {
          const sum = matchingVideos.reduce((acc, v) => acc + (v.rating || 5), 0);
          dynamicRating = Number((sum / matchingVideos.length).toFixed(1));
        }

        const logoUrl =
          sampleVid?.placeLogoUrl ||
          sampleVid?.placeBannerUrl ||
          (cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : "");

        list.push({
          id: pid,
          name: formattedName || pid,
          category: sampleVid?.placeCategory || "Business",
          categoryType: "all",
          address: sampleVid?.placeAddress || sampleVid?.placeCity || "Verified Business",
          city: sampleVid?.placeCity || "Miami, FL",
          lat: 25.7617,
          lng: -80.1918,
          rating: dynamicRating,
          totalReviews: reviewCount || 1,
          ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
          avatarUrl: logoUrl,
          bannerUrl: sampleVid?.placeBannerUrl || "",
          photos: [],
          openingHours: "Open now",
          isOpen: true,
          phone: "",
          website: sampleVid?.placeWebsite || (cleanDomain ? `https://${cleanDomain}` : ""),
          priceRange: "$$",
          plusCode: "",
          description: sampleVid?.placeDescription || `Verified business on Yoouz.`,
          popularKeywords: [],
          amenities: [],
          topDishes: [],
          isFollowed: true,
          logoUrl
        });
      }
    });

    return list;
  }, [places, videos, followedPlacesSet, profileSyncTick]);

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
        const key = getCanonicalAuthorKey(u);
        if (!key || seen.has(key)) return;
        seen.add(key);

        list.push({
          name: userName,
          avatar: u.avatar || `/api/avatar?name=${encodeURIComponent(userName)}&background=27272a&color=fff`,
          bio: u.bio || "Community reviewer",
          location: u.location,
          isFollowed: followedAuthorsSet.has(userName.toLowerCase()),
          followersCount: typeof u.followersCount === "number" ? u.followersCount : 0
        });
      }
    });

    // Add any direct followers not found in allUsers
    directFollowers.forEach((df: string) => {
      const clean = (df || "").trim();
      if (!clean) return;
      const key = getCanonicalAuthorKey(clean);
      if (!key || key === getCanonicalAuthorKey(myNameLower) || seen.has(key)) return;
      seen.add(key);

      list.push({
        name: clean,
        avatar: `/api/avatar?name=${encodeURIComponent(clean)}&background=27272a&color=fff`,
        bio: "Community reviewer",
        isFollowed: followedAuthorsSet.has(clean.toLowerCase()),
        followersCount: 0
      });
    });

    return list;
  }, [allUsers, currentUser, followedAuthorsSet, profileSyncTick]);

  // Filtered lists
  const filteredAuthors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return followedAuthors;
    const allList = Array.from(allAuthorsMap.values());
    return allList
      .filter((a) => a.name.toLowerCase().includes(q) || (a.bio && a.bio.toLowerCase().includes(q)))
      .map((a) => ({
        ...a,
        isFollowed: followedAuthorsSet.has(a.name.toLowerCase().trim())
      }));
  }, [followedAuthors, searchQuery, allAuthorsMap, followedAuthorsSet]);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return followedPlacesList;
    return places
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.website && p.website.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
      .map((p) => {
        const pidLower = p.id.toLowerCase().trim();
        const pSlugLower = extractCleanDomain(p.website || p.name || p.id).replace(/[^a-z0-9]/g, "-");
        const isFollowed = followedPlacesSet.has(pidLower) || followedPlacesSet.has(pSlugLower);
        return { ...p, isFollowed };
      });
  }, [followedPlacesList, searchQuery, places, followedPlacesSet]);

  const filteredFollowers = useMemo(() => {
    if (!searchQuery.trim()) return myFollowers;
    const q = searchQuery.toLowerCase().trim();
    return myFollowers.filter((f) => f.name.toLowerCase().includes(q));
  }, [myFollowers, searchQuery]);

  const totalFollowingCount = followedAuthors.length + followedPlacesList.length;

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
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 pb-32 md:pb-12">
        {/* Sleek Native-Style Header */}
        <div id="following-header-card" className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {onNavigateHome && (
                <button
                  id="following-back-button"
                  onClick={onNavigateHome}
                  className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm border border-zinc-800"
                  title="Back to Feed"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 truncate">
                  <Users className="w-5 h-5 text-zinc-300 shrink-0" />
                  <span className="truncate">Following & Followers</span>
                </h1>
                <p className="text-xs text-zinc-300 font-medium truncate mt-0.5">
                  Manage businesses and reviewers you follow on Yoouz
                </p>
              </div>
            </div>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div id="following-segmented-tabs" className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-inner">
            <button
              id="tab-btn-following"
              onClick={() => {
                setActiveTab("following");
                setSearchQuery("");
              }}
              className={`py-2 px-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "following"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              <span>Following</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "following" ? "bg-zinc-200 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                {totalFollowingCount}
              </span>
            </button>
            <button
              id="tab-btn-followers"
              onClick={() => {
                setActiveTab("followers");
                setSearchQuery("");
              }}
              className={`py-2 px-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "followers"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              <span>Followers</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "followers" ? "bg-zinc-200 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                {myFollowers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="space-y-2.5">
          {(totalFollowingCount > 0 || myFollowers.length > 0 || searchQuery) && (
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "following"
                    ? "Search followed businesses or reviewers..."
                    : "Search followers by name..."
                }
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-600 focus:bg-zinc-900 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Sub-Filters inside Following: All, Reviewers, Businesses */}
          {activeTab === "following" && totalFollowingCount > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setFollowingFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  followingFilter === "all"
                    ? "bg-white text-zinc-950 border-white shadow-xs font-bold"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                }`}
              >
                All ({totalFollowingCount})
              </button>
              <button
                onClick={() => setFollowingFilter("businesses")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                  followingFilter === "businesses"
                    ? "bg-white text-zinc-950 border-white shadow-xs font-bold"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Businesses ({followedPlacesList.length})</span>
              </button>
              <button
                onClick={() => setFollowingFilter("reviewers")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                  followingFilter === "reviewers"
                    ? "bg-white text-zinc-950 border-white shadow-xs font-bold"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Reviewers ({followedAuthors.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Following Content */}
        {activeTab === "following" && (
          <div id="tab-following-content" className="space-y-2 animate-in fade-in duration-150">
            {totalFollowingCount === 0 ? (
              <div id="following-empty-state" className="p-8 sm:p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center text-zinc-300 space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-zinc-850 text-white flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="font-bold text-white text-sm sm:text-base">
                    {searchQuery ? "No matching results found" : "You aren't following anyone yet"}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {searchQuery
                      ? `No business or reviewer matches "${searchQuery}". Try a different name.`
                      : "When you follow businesses or authentic local reviewers on Yoouz, they will appear here."}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* 1. Businesses Section */}
                {(followingFilter === "all" || followingFilter === "businesses") &&
                  filteredPlaces.map((place) => {
                    const isHovered = hoveredUnfollowPlace === place.id;
                    const cleanDomain = extractCleanDomain(place.website || place.id);
                    const formattedTitle = formatBusinessName(place.name || cleanDomain);
                    const resolvedLogo =
                      place.logoUrl ||
                      place.avatarUrl ||
                      place.ogImage ||
                      (cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : "");

                    return (
                      <div
                        key={`following-place-${place.id}`}
                        id={`card-following-place-${place.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                        onClick={() => onOpenPlace(place.id)}
                        className="bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-3.5 sm:p-4 shadow-sm transition-all flex items-center justify-between gap-3.5 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          {/* Modern Squircle Business Logo */}
                          <CopoBrandLogo
                            domain={cleanDomain}
                            name={formattedTitle}
                            website={place.website}
                            logoUrl={place.logoUrl || place.avatarUrl}
                            bannerUrl={place.bannerUrl || place.ogImage}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white p-1.5 border border-zinc-200/60 shrink-0 shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform ring-1 ring-white/10"
                            imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast] [filter:drop-shadow(0px_0px_1px_rgba(0,0,0,0.25))]"
                            fallbackTextClassName="font-extrabold text-xs text-zinc-950"
                          />

                          {/* Business Info: Streamlined 2-Line Layout */}
                          <div className="min-w-0 flex-1 text-left">
                            {/* Row 1: Name + Badges */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                                {formattedTitle}
                              </h3>
                              <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                              <span className="bg-zinc-800 text-zinc-300 text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-zinc-700 uppercase tracking-wider shrink-0">
                                Business
                              </span>
                            </div>

                            {/* Row 2: Star Rating + Video Review Count + Location / Website */}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium truncate mt-0.5">
                              <span className="text-amber-400 font-bold flex items-center gap-0.5 shrink-0">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {typeof place.rating === "number" ? place.rating.toFixed(1) : "5.0"}
                              </span>
                              <span className="text-zinc-600 shrink-0">·</span>
                              <span className="shrink-0">
                                {place.totalReviews || 1} {place.totalReviews === 1 ? "video review" : "video reviews"}
                              </span>
                              {(place.city || place.address) && (
                                <>
                                  <span className="text-zinc-600 shrink-0">·</span>
                                  <span className="truncate">{place.city || place.address}</span>
                                </>
                              )}
                              {!place.city && !place.address && cleanDomain && (
                                <>
                                  <span className="text-zinc-600 shrink-0">·</span>
                                  <span className="truncate">{cleanDomain}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Unfollow Button */}
                        <button
                          id={`btn-toggle-following-place-${place.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                          onMouseEnter={() => setHoveredUnfollowPlace(place.id)}
                          onMouseLeave={() => setHoveredUnfollowPlace(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleFollowPlace) {
                              onToggleFollowPlace(place.id);
                            } else {
                              onToggleFollow(place.id);
                            }
                          }}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                            isHovered
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700"
                          }`}
                          title={isHovered ? "Unfollow this business" : "You are following this business"}
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

                {/* 2. Reviewers Section */}
                {(followingFilter === "all" || followingFilter === "reviewers") &&
                  filteredAuthors.map((author) => {
                    const isHovered = hoveredUnfollow === author.name;
                    return (
                      <div
                        key={`following-reviewer-${author.name}`}
                        id={`card-following-${author.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                        onClick={() => onOpenCreator(author)}
                        className="bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-3.5 sm:p-4 shadow-sm transition-all flex items-center justify-between gap-3.5 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          {/* Circular Reviewer Avatar */}
                          <img
                            src={author.avatar || `/api/avatar?name=${encodeURIComponent(author.name || "User")}&background=27272a&color=fff`}
                            alt={author.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.src.includes("/api/avatar")) {
                                target.src = "/api/avatar?name=User&background=27272a&color=fff";
                              }
                            }}
                          />
                          {/* Reviewer Info: Streamlined 2-Line Layout */}
                          <div className="min-w-0 flex-1 text-left">
                            {/* Row 1: Name + Verification */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                                {author.name}
                              </h3>
                              {author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />}
                            </div>

                            {/* Row 2: Video Reviews Count + Location */}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium truncate mt-0.5">
                              <span className="shrink-0">
                                {author.videoReviewCount
                                  ? `${author.videoReviewCount} ${author.videoReviewCount === 1 ? "video review" : "video reviews"}`
                                  : author.bio || "Community reviewer"}
                              </span>
                              {author.location && (
                                <>
                                  <span className="text-zinc-600 shrink-0">·</span>
                                  <span className="truncate">{author.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          id={`btn-toggle-following-${author.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                          onMouseEnter={() => setHoveredUnfollow(author.name)}
                          onMouseLeave={() => setHoveredUnfollow(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFollow(author.name);
                          }}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                            isHovered
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700"
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
          <div id="tab-followers-content" className="space-y-2 animate-in fade-in duration-150">
            {filteredFollowers.length === 0 ? (
              <div id="followers-empty-state" className="p-8 sm:p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center text-zinc-300 space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-zinc-850 text-white flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="font-bold text-white text-sm sm:text-base">
                    {searchQuery ? "No matching followers found" : "No followers yet"}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {searchQuery
                      ? `No follower matches "${searchQuery}". Try a different name.`
                      : "When other local reviewers follow your profile, they will appear here."}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredFollowers.map((follower) => {
                  const isFollowingThem = followedAuthorsSet.has(follower.name.toLowerCase());
                  const isHovered = hoveredUnfollow === follower.name;
                  return (
                    <div
                      key={`follower-${follower.name}`}
                      id={`card-follower-${follower.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                      onClick={() => onOpenCreator({ name: follower.name, avatar: follower.avatar } as any)}
                      className="bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-3.5 sm:p-4 shadow-sm transition-all flex items-center justify-between gap-3.5 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                        <img
                          src={follower.avatar}
                          alt={follower.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.src.includes("/api/avatar")) {
                              target.src = "/api/avatar?name=User&background=27272a&color=fff";
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                              {follower.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium truncate mt-0.5">
                            <span className="shrink-0">
                              {follower.bio || "Community reviewer"}
                            </span>
                            {follower.location && (
                              <>
                                <span className="text-zinc-600 shrink-0">·</span>
                                <span className="truncate">{follower.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        id={`btn-follower-action-${follower.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                        onMouseEnter={() => setHoveredUnfollow(follower.name)}
                        onMouseLeave={() => setHoveredUnfollow(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFollow(follower.name);
                        }}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                          isFollowingThem
                            ? isHovered
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700"
                            : "bg-white hover:bg-zinc-200 text-zinc-950 font-black"
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
