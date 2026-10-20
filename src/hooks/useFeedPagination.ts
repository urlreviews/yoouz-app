import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoReview } from '../types';
import { getDisplayViews, resolveSafeAuthor, unrecordDeletedUsersInLocalStorage, YOOUZ_VIDEOS_CACHE_KEY, getReviewTime, purgeVideoIdFromClientStorage } from '../utils/placeUtils';
import { INITIAL_SEED_VIDEOS } from '../data/seedReviews';
import { buildCommentTree } from '../utils/commentUtils';

// Helper to record deleted video IDs in localStorage and aggressively purge from all caches
function recordClientDeletedId(id: string) {
  if (!id) return;
  purgeVideoIdFromClientStorage(id);
}

// Helper to cleanly sanitize and normalize author data
export function normalizeReview(v: any): VideoReview {
  try {
    let likedIds: any[] = [];
    let savedIds: any[] = [];
    try { 
      const likedStr = localStorage.getItem("copo_liked_video_ids") || "[]";
      const parsed = JSON.parse(likedStr);
      if (Array.isArray(parsed)) likedIds = parsed;
    } catch(e){}
    try { 
      const savedStr = localStorage.getItem("copo_saved_video_ids") || "[]"; 
      const parsed = JSON.parse(savedStr); 
      if (Array.isArray(parsed)) savedIds = parsed;
    } catch(e){}

    const safeAuthor = resolveSafeAuthor(v);
    const computedViews = getDisplayViews(v);

    const videoId = v.id || v.videoId || `rev-${Math.random().toString(36).substring(2, 9)}`;
    const isBookmarked = (typeof v.isBookmarked === 'boolean' && v.isBookmarked) || savedIds.includes(String(videoId));
    const isLiked = (typeof v.isLiked === 'boolean' && v.isLiked) || likedIds.includes(String(videoId));

    const rawLikes = typeof v.likesCount === 'number' ? v.likesCount : (typeof v.likes === 'number' ? v.likes : 0);
    const likesCountVal = isLiked ? Math.max(1, rawLikes) : rawLikes;

    const rawBookmarks = typeof v.bookmarksCount === 'number' ? v.bookmarksCount : (typeof v.bookmarks === 'number' ? v.bookmarks : 0);
    const bookmarksCountVal = isBookmarked ? Math.max(1, rawBookmarks) : rawBookmarks;

    const sharesCountVal = typeof v.sharesCount === 'number' ? v.sharesCount : (typeof v.shares === 'number' ? v.shares : 0);

    const rawComments = Array.isArray(v.comments) ? v.comments : [];
    let commentsCountVal = 0;
    if (Array.isArray(v.comments)) {
      let cnt = 0;
      rawComments.forEach((c: any) => {
        if (c && c.id) {
          cnt += 1;
          if (Array.isArray(c.replies)) cnt += c.replies.length;
        }
      });
      commentsCountVal = cnt;
    } else {
      commentsCountVal = typeof v.commentsCount === 'number' ? v.commentsCount : 0;
    }

    const placeId = (v.placeId || "").toLowerCase();
    const placeName = (v.placeName || "").toLowerCase();
    let officialTitle = v.title || v.bunnyTitle || v.videoTitle || "";
    if (!officialTitle || officialTitle.startsWith("Video review for") || officialTitle.startsWith("Test Video Review") || officialTitle.startsWith("Great Review for")) {
      if (placeId.includes("topmenremovals") || placeName.includes("shirley") || placeName.includes("top men") || String(videoId).includes("3a641d6f")) {
        officialTitle = "Great Removals Service in London by Sheelys - Highly Recommended!";
      }
    }

    return {
      ...v,
      id: videoId,
      title: officialTitle,
      bunnyTitle: officialTitle,
      videoTitle: officialTitle,
      views: computedViews,
      viewsCount: computedViews,
      likes: likesCountVal,
      likesCount: likesCountVal,
      bookmarksCount: bookmarksCountVal,
      bookmarks: bookmarksCountVal,
      shares: sharesCountVal,
      sharesCount: sharesCountVal,
      comments: rawComments,
      commentsCount: commentsCountVal,
      isLiked: isLiked,
      isBookmarked: isBookmarked,
      author: safeAuthor
    };
  } catch (err) {
    console.error("[DEBUG feed] Critical error in normalizeReview:", err, v);
    return {
      ...v,
      id: v?.id || `rev-err-${Math.random().toString(36).substring(2, 9)}`,
      author: v?.author || { 
        name: "Verified Reviewer", 
        handle: "@user", 
        avatar: `/api/avatar?name=Reviewer&background=27272a&color=fff` 
      },
      createdAtMs: v?.createdAtMs || Date.now()
    } as VideoReview;
  }
}

const HARD_DELETED_IDS = [
  "rev-1792163491053-v36vs",
  "rev-1792160861770-testp",
  "rev-1792149988398-y1m39",
  "rev-1792147088540-hkfbr",
  "rev-1792144754152-nhnje",
  "rev-1792144526268-bpia4",
  "rev-1792141574940-8nksr",
  "rev-1792139631366-c160x",
  "rev-1792137705500-ctsbl",
  "rev-1792136722825-febn5",
  "rev-1792136010312-pkfpe",
  "rev-1792135365892-2zujn",
  "rev-1792100477925-2wc5y",
  "rev-1792100024637-5vyg4",
  "rev-1792099353143-plgkg",
  "rev-1792098609850-9uhht",
  "rev-1792097773522-7ekpg",
  "rev-1792097097789-382vs",
  "rev-1792097030831-3db9b",
  "rev-1792094007564-cp5b7",
  "rev-1792093281036-h5s9k",
  "rev-1792092312506-duy83",
  "rev-1792089793754-itjdb",
  "rev-1792089030317-pzhoj",
  "rev-1792087547251-w5is0",
  "rev-1792086743106-vslp4",
  "rev-1789841701519-2l6x8",
  "rev-1789577075627-3488d",
  "rev-1791493216352-testu",
  "rev-1790285022487-sx8xw",
  "rev-1790284845793-3h79d",
  "rev-1790282915287-46f7p",
  "rev-1790281811670-0id4f",
  "rev-1790278190422-qwzvw",
  "rev-1790259993561-a7622",
  "rev-1790070757373-dj8p0",
  "rev-1790344780190-1jqsf",
  "rev-1790339546979-n56mr",
  "rev-1790330711352-95fgt",
  "rev-1790330467164-vkfnx",
  "rev-1790329140988-422nf",
  "rev-1790328985692-cbgxc",
  "rev-1790323841535-1wmfi",
  "rev-1789421411968-6xx3t",
  "rev-1789421309884-ca7le",
  "rev-1789421167017-8i4l3",
  "rev-1789420100396-2578b",
  "rev-1787774080951-vuu2k",
  "rev-1788295000000-hertz",
  "rev-1788294000000-avis",
  "rev-12345",
  "rev-test-verify-123",
  "rev-test-big-thumb",
  "rev-1791495006783-jy6ld",
  "rev-1791494959785-27pap",
  "rev-1791485919882-l8av6",
  "rev-1790368898192-sw74n",
  "rev-1790363378621-w65oy",
  "rev-1790353801035-1rlp8",
  "rev-1792172427752-d6g7q",
  "rev-1792171873846-dj6oy",
  "rev-1792169706193-v5rko",
  "rev-1792168311201-mc11u",
  "rev-1792053448121-182jk",
  "rev-1792432790505-8re2s",
  "rev-1792432790505-4ovhe"
];

const PROTECTED_FEED_PLACES = new Set([
  "guard-slip-cafe-by-lgip.bayombong",
  "jollibee.ph"
]);

const PROTECTED_FEED_CREATORS = new Set([
  "edjo francis ramos",
  "edjofrancisramos",
  "@edjofrancisramos",
  "edjofrancisramos18@gmail.com"
]);

export const AUTHENTIC_PROTECTED_REVIEW_IDS = new Set([
  "rev-1792404298362-hrk2f",
  "rev-1792405036441-zqqwp"
]);

export const isPurgedItem = (v: any, extraDeletedIds?: string[] | Set<string>) => {
  if (!v || !v.id) return true;
  const id = String(v.id).trim();
  if (!id || id.length < 3) return true;

  if (extraDeletedIds) {
    if (extraDeletedIds instanceof Set && (extraDeletedIds.has(id) || extraDeletedIds.has(id.toLowerCase()))) return true;
    if (Array.isArray(extraDeletedIds) && extraDeletedIds.some(item => item && (String(item).trim() === id || String(item).trim().toLowerCase() === id.toLowerCase()))) return true;
  }
  if (HARD_DELETED_IDS.includes(id) || HARD_DELETED_IDS.includes(id.toLowerCase())) return true;
  if (id === "rev-12345" || id.startsWith("rev-test") || id.startsWith("rev-err-")) return true;

  const uId = (v.userId || "").toLowerCase().trim();
  const uEmail = (v.userEmail || "").toLowerCase().trim();
  const uName = (v.author?.name || v.authorName || "").toLowerCase().trim();
  const uHandle = (v.author?.handle || "").replace(/^@+/, "").toLowerCase().trim();

  const isProtectedCreator = PROTECTED_FEED_CREATORS.has(uId) || PROTECTED_FEED_CREATORS.has(uEmail) || PROTECTED_FEED_CREATORS.has(uName) || PROTECTED_FEED_CREATORS.has(uHandle);

  const pId = (v.placeId || "").toLowerCase().trim();
  const pName = (v.placeName || "").toLowerCase().trim();
  const pWebsite = (v.placeWebsite || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();

  const isProtectedPlace = PROTECTED_FEED_PLACES.has(pId) || PROTECTED_FEED_PLACES.has(pName) || PROTECTED_FEED_PLACES.has(pWebsite);

  // Check deleted places from localStorage (ignore empty/short strings)
  if (!isProtectedPlace) {
    try {
      const deletedPlacesStr = localStorage.getItem("copo_deleted_places") || localStorage.getItem("yoouz_deleted_places") || "[]";
      const deletedPlaces: string[] = JSON.parse(deletedPlacesStr);
      if (Array.isArray(deletedPlaces) && deletedPlaces.length > 0) {
        if (deletedPlaces.some(dp => {
          const dpLow = String(dp || "").toLowerCase().trim();
          if (dpLow.length < 2) return false;
          return dpLow === pId || dpLow === pName || (pWebsite && dpLow === pWebsite);
        })) {
          return true;
        }
      }
    } catch (e) {}
  }

  // Check deleted users from localStorage (ignore empty/short strings)
  try {
    const deletedUsersStr = localStorage.getItem("copo_deleted_users") || localStorage.getItem("yoouz_deleted_users") || "[]";
    const deletedUsers: string[] = JSON.parse(deletedUsersStr);
    if (Array.isArray(deletedUsers) && deletedUsers.length > 0) {
      if (deletedUsers.some(du => {
        const duLow = String(du || "").toLowerCase().trim();
        if (duLow.length < 3) return false;
        return duLow === uId || duLow === uEmail || duLow === uName || duLow === uHandle;
      })) {
        return true;
      }
    }
  } catch (e) {}

  if (v.placeId === "avis.com" || v.placeId === "hertz.com") return true;
  const placeNameLower = (v.placeName || "").toLowerCase().trim();
  if (placeNameLower === "hertz" || placeNameLower === "car rentals from avis") return true;
  return false;
};

export function useFeedPagination() {
  const [videos, setVideos] = useState<VideoReview[]>(() => {
    // Clear legacy purge flags from localStorage
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("copo_all_videos_purged");
        localStorage.removeItem("copo_all_videos_purged_time");
      } catch (e) {}
    }

    const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
    let deletedIds: string[] = [];
    try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

    HARD_DELETED_IDS.forEach(id => {
      if (!deletedIds.includes(id)) deletedIds.push(id);
    });

    try {
      // Purge all legacy and older cache versions from localStorage
      if (typeof localStorage !== "undefined") {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("yoouz_cached_videos_") || key === "copo_videos") && key !== YOOUZ_VIDEOS_CACHE_KEY) {
            try { localStorage.removeItem(key); } catch (e) {}
          }
        }
      }

      let localPublished: any[] = [];
      try {
        const now = Date.now();
        const localPubStr = localStorage.getItem("yoouz_local_created_reviews");
        if (localPubStr) {
          const parsedLp = JSON.parse(localPubStr);
          if (Array.isArray(parsedLp)) {
            // Only keep items that are not purged and were created in the last 60 seconds
            const cleanedLp = parsedLp.filter((v: any) => !isPurgedItem(v, deletedIds) && (now - (v.createdAtMs || 0) < 60000));
            localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(cleanedLp));
            localPublished = cleanedLp.map(normalizeReview);
          }
        }
      } catch (e) {}

      const combinedMap = new Map<string, VideoReview>();

      // 1. Injected server HTML baseline (highest authority! Instant live state for cold starts / private windows)
      if (typeof window !== "undefined" && Array.isArray((window as any).__INITIAL_FEED_VIDEOS__) && (window as any).__INITIAL_FEED_VIDEOS__.length > 0) {
        (window as any).__INITIAL_FEED_VIDEOS__
          .filter((v: any) => !isPurgedItem(v, deletedIds))
          .map(normalizeReview)
          .forEach((v: VideoReview) => {
            if (v && v.id) combinedMap.set(String(v.id), v);
          });
      }

      // 2. Cached feed videos from localStorage (only fill in any additional non-conflicting items)
      const cached = localStorage.getItem(YOOUZ_VIDEOS_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.filter((v: any) => !isPurgedItem(v, deletedIds)).map(normalizeReview).forEach((v: VideoReview) => {
              if (v && v.id && !combinedMap.has(String(v.id))) {
                combinedMap.set(String(v.id), v);
              }
            });
          }
        } catch (e) {}
      }

      // 3. Initial fresh seed baseline (guarantees the 5 authentic reviews are always seeded instantly)
      INITIAL_SEED_VIDEOS.filter((v: any) => !isPurgedItem(v, deletedIds)).map(normalizeReview).forEach((v) => {
        if (v && v.id && !combinedMap.has(String(v.id))) {
          combinedMap.set(String(v.id), v);
        }
      });

      // 4. Local published (optimistic uploads in last 60 seconds)
      localPublished.forEach((v) => {
        if (v && v.id) combinedMap.set(String(v.id), v);
      });

      const result = Array.from(combinedMap.values());
      result.sort((a, b) => getReviewTime(b) - getReviewTime(a));
      
      // Immediately persist fresh authoritative baseline back to localStorage cache
      try {
        localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(result.slice(0, 50)));
      } catch (e) {}

      return result;
    } catch (e) {}
    // Instant fallback to injected server videos or seed videos
    const fallbackSource = (typeof window !== "undefined" && Array.isArray((window as any).__INITIAL_FEED_VIDEOS__) && (window as any).__INITIAL_FEED_VIDEOS__.length > 0)
      ? (window as any).__INITIAL_FEED_VIDEOS__
      : INITIAL_SEED_VIDEOS;
    const seeds = fallbackSource.filter((v: any) => !isPurgedItem(v, deletedIds)).map(normalizeReview);
    seeds.sort((a, b) => getReviewTime(b) - getReviewTime(a));
    return seeds;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const loadDataRef = useRef<((pageNum: number, isBackground?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    let active = true;
    let isFetching = false;
    let sse: EventSource | null = null;
    let sseReconnectTimeout: any = null;
    let sseRetryDelay = 2000;

    const loadData = async (pageNum: number, isBackground = false) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!isBackground) setIsLoading(false);
        return;
      }
      if (isFetching) return;
      isFetching = true;

      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { 
        const parsed = JSON.parse(deletedStr); 
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}

      try {
        // 1. Fetch from Server API (with fresh cache-busting)
        let uEmail = localStorage.getItem("copo_user_email") || "";
        let uUid = localStorage.getItem("copo_user_uid") || "";
        if (!uEmail && !uUid) {
          try {
            const rawUser = localStorage.getItem("yoouz_current_user") || localStorage.getItem("copo_current_user") || "";
            if (rawUser) {
              const parsed = JSON.parse(rawUser);
              uEmail = parsed?.email || "";
              uUid = parsed?.id || parsed?.uid || "";
            }
          } catch (e) {}
        }
        const uIdentifier = uEmail || uUid || "";
        const res = await fetch(`/api/videos/feed?page=${pageNum}&limit=10&userId=${encodeURIComponent(uIdentifier)}&_t=${Date.now()}`, { cache: "no-store" });
        if (res.ok && active) {
          const data = await res.json();
          const hardBannedIds = [
            "rev-1787774080951-vuu2k",
            "rev-1788295000000-hertz",
            "rev-1788294000000-avis"
          ];
          const serverDeletedIds: string[] = Array.isArray(data?.deletedIds) ? data.deletedIds : [];
          const allDeletedSet = new Set(
            [...deletedIds, ...serverDeletedIds, ...hardBannedIds].map(String)
          );

          const isPurgedVideo = (v: any) => {
            if (!v || !v.id) return true;
            const id = String(v.id);
            if (allDeletedSet.has(id) || allDeletedSet.has(id.toLowerCase())) return true;
            if (v.placeId === "avis.com" || v.placeId === "hertz.com") return true;
            if (v.placeName === "Hertz" || v.placeName === "Car Rentals from Avis") return true;
            return false;
          };

          if (serverDeletedIds.length > 0 || hardBannedIds.length > 0) {
            try {
              localStorage.setItem("copo_deleted_videos", JSON.stringify(Array.from(allDeletedSet)));
              localStorage.removeItem("yoouz_cached_videos_v25");
              const cached = localStorage.getItem(YOOUZ_VIDEOS_CACHE_KEY);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                  const filtered = parsed.filter((v: any) => !isPurgedVideo(v));
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(filtered));
                }
              }
              const localPubStr = localStorage.getItem("yoouz_local_created_reviews");
              if (localPubStr) {
                const parsedLp = JSON.parse(localPubStr);
                if (Array.isArray(parsedLp)) {
                  const filteredLp = parsedLp.filter((v: any) => !isPurgedVideo(v));
                  localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(filteredLp));
                }
              }
            } catch (e) {}
          }

          if (data && Array.isArray(data.videos)) {
            const valid = data.videos
              .filter((v: any) => !isPurgedVideo(v))
              .map(normalizeReview);
            
            setVideos((prev) => {
              // Track local optimistic state (likes, bookmarks, views, comments, shares, rating)
              const interactionMap = new Map<string, { isLiked?: boolean; isBookmarked?: boolean; likes?: number; likesCount?: number; bookmarks?: number; bookmarksCount?: number; sharesCount?: number; views?: number; comments?: any[]; commentsCount?: number; rating?: number; placeRating?: number }>();
              prev.forEach((v) => {
                if (v && v.id) {
                  interactionMap.set(v.id, {
                    isLiked: v.isLiked,
                    isBookmarked: v.isBookmarked,
                    likes: v.likes,
                    likesCount: v.likesCount,
                    bookmarks: (v as any).bookmarks,
                    bookmarksCount: v.bookmarksCount,
                    sharesCount: v.sharesCount,
                    views: v.views,
                    comments: v.comments,
                    commentsCount: v.commentsCount,
                    rating: v.rating,
                    placeRating: v.placeRating
                  });
                }
              });

              // Keep only real, non-purged local pending uploads created in the last 60s currently in flight
              const now = Date.now();
              let localSavedReviews: any[] = [];
              try {
                const ls = localStorage.getItem("yoouz_local_created_reviews");
                if (ls) {
                  const parsed = JSON.parse(ls);
                  if (Array.isArray(parsed)) {
                    // Only keep in-flight items created in the last 60s
                    localSavedReviews = parsed.filter((r: any) => {
                      if (!r || !r.id || allDeletedSet.has(String(r.id)) || isPurgedItem(r)) return false;
                      const isRecent = (now - (r.createdAtMs || 0) < 60000);
                      return isRecent;
                    });
                    // Persist cleaned list back so old deleted local recordings are purged from phone storage
                    localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(localSavedReviews));
                  }
                }
              } catch (e) {}

              const isRecentInFlight = (v: any) => {
                if (!v || !v.id || allDeletedSet.has(String(v.id)) || isPurgedItem(v)) return false;
                const isLocal = Boolean((v as any).isLocalUpload) || Boolean((v as any).isUploading);
                const isRecent = (now - (v.createdAtMs || 0) < 60000);
                return isLocal && isRecent;
              };

              const pendingCandidateList = [
                ...prev.filter(isRecentInFlight),
                ...localSavedReviews
              ];

              const pendingLocalVideosMap = new Map<string, any>();
              pendingCandidateList.forEach((v) => {
                if (
                  v &&
                  v.id &&
                  !isPurgedItem(v) &&
                  !allDeletedSet.has(String(v.id)) &&
                  !valid.some((sv) => String(sv.id) === String(v.id))
                ) {
                  pendingLocalVideosMap.set(String(v.id), normalizeReview(v));
                }
              });
              const pendingLocalVideos = Array.from(pendingLocalVideosMap.values());

              // Server videos are authoritative: if a video or comment was deleted on server, it is dropped here!
              const mergedServerVideos = valid.map((v) => {
                const local = interactionMap.get(v.id);
                if (local) {
                  // Server comments are authoritative! Never resurrect stale cached comments.
                  // Only keep local optimistic comments currently in flight
                  const serverComments = v.comments || [];
                  const localOptimisticComments = (local.comments || []).filter((c: any) => c && c.isOptimistic);
                  
                  let deletedCommentIds: string[] = [];
                  try {
                    const delRaw = localStorage.getItem("copo_deleted_comments");
                    if (delRaw) deletedCommentIds = JSON.parse(delRaw);
                  } catch (e) {}
                  const deletedSet = new Set(deletedCommentIds);

                  const activeComments = (serverComments.length > 0 || localOptimisticComments.length > 0)
                    ? [...serverComments, ...localOptimisticComments].filter((c: any) => c && c.id && !deletedSet.has(String(c.id)))
                    : (local.comments || []).filter((c: any) => c && c.id && !deletedSet.has(String(c.id)));

                  const tree = buildCommentTree(activeComments);

                  let likedIds: string[] = [];
                  let savedIds: string[] = [];
                  try {
                    const lStr = localStorage.getItem("copo_liked_video_ids") || "[]";
                    if (lStr) likedIds = JSON.parse(lStr);
                  } catch (e) {}
                  try {
                    const sStr = localStorage.getItem("copo_saved_video_ids") || "[]";
                    if (sStr) savedIds = JSON.parse(sStr);
                  } catch (e) {}

                  const isLk = Boolean(v.isLiked) || Boolean(local?.isLiked) || likedIds.includes(String(v.id));
                  const isBm = Boolean(v.isBookmarked) || Boolean(local?.isBookmarked) || savedIds.includes(String(v.id));

                  const rawServerLikes = typeof v.likesCount === 'number' ? v.likesCount : (typeof v.likes === 'number' ? v.likes : 0);
                  const rawLocalLikes = typeof local?.likes === 'number' ? local.likes : (typeof local?.likesCount === 'number' ? local.likesCount : 0);
                  const effLikes = Math.max(rawServerLikes, rawLocalLikes, isLk ? 1 : 0);

                  const rawServerBookmarks = typeof v.bookmarksCount === 'number' ? v.bookmarksCount : (typeof v.bookmarks === 'number' ? v.bookmarks : 0);
                  const rawLocalBookmarks = typeof local?.bookmarksCount === 'number' ? local.bookmarksCount : (typeof local?.bookmarks === 'number' ? local.bookmarksCount : 0);
                  const effBookmarks = Math.max(rawServerBookmarks, rawLocalBookmarks, isBm ? 1 : 0);

                  const rawServerShares = typeof v.sharesCount === 'number' ? v.sharesCount : (typeof v.shares === 'number' ? v.shares : 0);
                  const rawLocalShares = typeof local.sharesCount === 'number' ? local.sharesCount : 0;
                  const effShares = Math.max(rawServerShares, rawLocalShares);
                  const serverRating = (typeof v.rating === 'number' && !isNaN(v.rating) && v.rating > 0) ? v.rating : 0;
                  const localRating = (typeof local.rating === 'number' && !isNaN(local.rating) && local.rating > 0) ? local.rating : 0;
                  const effRating = serverRating > 0 ? serverRating : (localRating > 0 ? localRating : 5.0);

                  return {
                    ...v,
                    rating: effRating,
                    placeRating: effRating,
                    isLiked: isLk,
                    isBookmarked: isBm,
                    likes: effLikes,
                    likesCount: effLikes,
                    bookmarks: effBookmarks,
                    bookmarksCount: effBookmarks,
                    shares: effShares,
                    sharesCount: effShares,
                    views: typeof local.views === 'number' && local.views > v.views ? local.views : v.views,
                    comments: tree.comments,
                    commentsCount: tree.count
                  };
                }
                return v;
              });

              const getReviewTime = (v: any) => {
                if (!v) return 0;
                const fromDt = v.createdAt ? new Date(v.createdAt.includes('T') ? v.createdAt : v.createdAt.replace(' ', 'T') + 'Z').getTime() : 0;
                const fromMs = typeof v.createdAtMs === 'number' ? v.createdAtMs : 0;
                const fromId = (v.id && typeof v.id === 'string' && v.id.startsWith('rev-')) ? parseInt(v.id.split('-')[1], 10) : 0;
                return Math.max(fromDt || 0, fromMs || 0, fromId || 0);
              };

              const merged = [...pendingLocalVideos, ...mergedServerVideos];
              merged.sort((a, b) => getReviewTime(b) - getReviewTime(a));
              
              const resultMap = new Map<string, VideoReview>();
              if (pageNum === 1) {
                // Keep all previously loaded non-deleted videos in state
                prev.forEach((v) => {
                  if (v && v.id && !allDeletedSet.has(String(v.id)) && !isPurgedItem(v)) {
                    resultMap.set(String(v.id), v);
                  }
                });
                // Overlay fresh server updates / pending videos
                merged.forEach((v) => {
                  if (v && v.id) {
                    resultMap.set(String(v.id), v);
                  }
                });
              } else {
                prev.forEach((v) => {
                  if (v && v.id) resultMap.set(String(v.id), v);
                });
                merged.forEach((v) => {
                  if (v && v.id) resultMap.set(String(v.id), v);
                });
              }

              const uniqueResult = Array.from(resultMap.values());
              uniqueResult.sort((a, b) => getReviewTime(b) - getReviewTime(a));
              setHasMore(mergedServerVideos.length === 10);

              // Persist fresh feed to cache
              try { 
                localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(uniqueResult.slice(0, 50))); 
              } catch(e){}
              
              return uniqueResult;
            });
            if (!isBackground) setIsLoading(false);
          } else {
            if (!isBackground) setIsLoading(false);
          }
        }
      } catch (err) {
        if (!isBackground) {
          setIsLoading(false);
        }
      } finally {
        isFetching = false;
      }

      if (!isBackground) {
        setTimeout(() => { if (active) setIsLoading(false); }, 1500);
      }
    };

    // 2. Real-Time Server-Sent Events (SSE) stream for instant cross-device deletions & updates
    const setupSse = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (typeof document !== "undefined" && document.hidden) return;
      if (sse) {
        try { sse.close(); } catch (e) {}
        sse = null;
      }

      try {
        const healthRes = await fetch("/api/health").catch(() => null);
        if (!healthRes || !healthRes.ok) return;
        const contentType = healthRes.headers.get("content-type") || "";
        if (contentType.includes("text/html")) return;
      } catch (e) {
        return;
      }

      try {
        sse = new EventSource("/api/videos/stream");

        sse.onopen = () => {
          sseRetryDelay = 5000;
        };

        sse.onmessage = (event) => {
          if (!active) return;
          sseRetryDelay = 5000;
          setTimeout(() => {
            try {
              const payload = JSON.parse(event.data);
              if (payload.type === "new_video" && payload.video) {
              const freshVideo = normalizeReview(payload.video);
              setVideos((prev) => {
                const filtered = prev.filter((v) => v.id !== freshVideo.id);
                const updated = [freshVideo, ...filtered];
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(updated.slice(0, 50)));
                } catch (e) {}
                return updated;
              });
              window.dispatchEvent(new CustomEvent("copo-video-created", { detail: { video: freshVideo } }));
            } else if (payload.type === "video_liked" && payload.videoId) {
              const targetId = String(payload.videoId);
              const newLikes = typeof payload.likesCount === "number" ? payload.likesCount : 0;
              let currentEmail = "";
              let currentUid = "";
              try {
                currentEmail = localStorage.getItem("copo_user_email") || "";
                currentUid = localStorage.getItem("copo_user_uid") || "";
                if (!currentEmail && !currentUid) {
                  const rawUser = localStorage.getItem("yoouz_current_user") || localStorage.getItem("copo_current_user") || "";
                  if (rawUser) {
                    const parsed = JSON.parse(rawUser);
                    currentEmail = parsed?.email || "";
                    currentUid = parsed?.id || parsed?.uid || "";
                  }
                }
              } catch (e) {}

              const pUserStr = String(payload.userId || "").toLowerCase().trim();
              const myEmailStr = currentEmail.toLowerCase().trim();
              const myUidStr = currentUid.toLowerCase().trim();
              const isMyAction = Boolean(pUserStr && ((myEmailStr && pUserStr === myEmailStr) || (myUidStr && pUserStr === myUidStr)));

              setVideos((prev) => {
                const updated = prev.map((v) => {
                  if (String(v.id) === targetId) {
                    const nextIsLiked = isMyAction ? Boolean(payload.isLiked) : (Boolean(v.isLiked) || (Boolean(payload.isLiked) && isMyAction));
                    return {
                      ...v,
                      likes: newLikes,
                      likesCount: newLikes,
                      isLiked: nextIsLiked
                    };
                  }
                  return v;
                });
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(updated.slice(0, 50)));
                } catch (e) {}
                return updated;
              });

              if (isMyAction) {
                try {
                  const lStr = localStorage.getItem("copo_liked_video_ids") || "[]";
                  let lIds: string[] = [];
                  try { lIds = JSON.parse(lStr); } catch (e) {}
                  if (payload.isLiked) {
                    if (!lIds.includes(targetId)) lIds.push(targetId);
                  } else {
                    lIds = lIds.filter(id => id !== targetId);
                  }
                  localStorage.setItem("copo_liked_video_ids", JSON.stringify(lIds));
                } catch (e) {}
              }

              window.dispatchEvent(new CustomEvent("copo-video-liked", { detail: { videoId: targetId, likesCount: newLikes, isLiked: payload.isLiked, userId: payload.userId } }));
            } else if (payload.type === "video_bookmarked" && payload.videoId) {
              const targetId = String(payload.videoId);
              const newBookmarks = typeof payload.bookmarksCount === "number" ? payload.bookmarksCount : 0;
              let currentEmail = "";
              let currentUid = "";
              try {
                currentEmail = localStorage.getItem("copo_user_email") || "";
                currentUid = localStorage.getItem("copo_user_uid") || "";
                if (!currentEmail && !currentUid) {
                  const rawUser = localStorage.getItem("yoouz_current_user") || localStorage.getItem("copo_current_user") || "";
                  if (rawUser) {
                    const parsed = JSON.parse(rawUser);
                    currentEmail = parsed?.email || "";
                    currentUid = parsed?.id || parsed?.uid || "";
                  }
                }
              } catch (e) {}

              const pUserStr = String(payload.userId || "").toLowerCase().trim();
              const myEmailStr = currentEmail.toLowerCase().trim();
              const myUidStr = currentUid.toLowerCase().trim();
              const isMyAction = Boolean(pUserStr && ((myEmailStr && pUserStr === myEmailStr) || (myUidStr && pUserStr === myUidStr)));

              setVideos((prev) => {
                const updated = prev.map((v) => {
                  if (String(v.id) === targetId) {
                    const nextIsBookmarked = isMyAction ? Boolean(payload.isBookmarked) : (Boolean(v.isBookmarked) || (Boolean(payload.isBookmarked) && isMyAction));
                    return {
                      ...v,
                      bookmarks: newBookmarks,
                      bookmarksCount: newBookmarks,
                      isBookmarked: nextIsBookmarked
                    };
                  }
                  return v;
                });
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(updated.slice(0, 50)));
                } catch (e) {}
                return updated;
              });

              if (isMyAction) {
                try {
                  const sStr = localStorage.getItem("copo_saved_video_ids") || "[]";
                  let sIds: string[] = [];
                  try { sIds = JSON.parse(sStr); } catch (e) {}
                  if (payload.isBookmarked) {
                    if (!sIds.includes(targetId)) sIds.push(targetId);
                  } else {
                    sIds = sIds.filter(id => id !== targetId);
                  }
                  localStorage.setItem("copo_saved_video_ids", JSON.stringify(sIds));
                } catch (e) {}
              }

              window.dispatchEvent(new CustomEvent("copo-video-bookmarked", { detail: { videoId: targetId, bookmarksCount: newBookmarks, isBookmarked: payload.isBookmarked, userId: payload.userId } }));
            } else if (payload.type === "video_updated" && payload.videoId) {
              const targetId = String(payload.videoId);
              const updates = payload.updates || {};
              setVideos((prev) => {
                const updated = prev.map((v) => {
                  if (String(v.id) === targetId) {
                    return {
                      ...v,
                      ...(updates.rating !== undefined && { rating: updates.rating, placeRating: updates.rating }),
                      ...(updates.caption !== undefined && { caption: updates.caption }),
                      ...(updates.dishOrItem !== undefined && { dishOrItem: updates.dishOrItem }),
                      ...(updates.tags !== undefined && { tags: updates.tags })
                    };
                  }
                  return v;
                });
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(updated.slice(0, 50)));
                } catch (e) {}
                return updated;
              });
              window.dispatchEvent(new CustomEvent("copo-video-updated", { detail: { videoId: targetId, updates } }));
            } else if (payload.type === "video_deleted" && payload.videoId) {
              const targetId = String(payload.videoId);
              recordClientDeletedId(targetId);
              setVideos((prev) => prev.filter((v) => v.id !== targetId));
              window.dispatchEvent(new CustomEvent("copo-video-deleted", { detail: { videoId: targetId } }));
            } else if (payload.type === "videos_purged" || payload.type === "purge_all_videos") {
              setVideos([]);
              if (typeof localStorage !== "undefined") {
                localStorage.setItem("copo_all_videos_purged", "true");
                localStorage.setItem("copo_all_videos_purged_time", String(Date.now()));
              }
              window.dispatchEvent(new CustomEvent("copo-videos-purged"));
            } else if (payload.type === "place_deleted" && (payload.placeId || payload.variants)) {
              const vars = Array.isArray(payload.variants) ? payload.variants : [payload.placeId];
              window.dispatchEvent(new CustomEvent("copo-place-deleted", { detail: { placeId: payload.placeId, variants: vars } }));
            } else if (payload.type === "bulk_places_deleted" && Array.isArray(payload.placeIds)) {
              payload.placeIds.forEach((pid: string) => {
                window.dispatchEvent(new CustomEvent("copo-place-deleted", { detail: { placeId: pid, variants: [pid] } }));
              });
            } else if (payload.type === "places_purged") {
              window.dispatchEvent(new CustomEvent("copo-places-purged"));
            } else if (payload.type === "place_updated" && payload.place) {
              window.dispatchEvent(new CustomEvent("copo-place-updated", { detail: { place: payload.place } }));
            } else if (payload.type === "user_deleted") {
              const uIds = Array.isArray(payload.userIds) ? payload.userIds : [payload.userId, payload.email, payload.name, payload.handle].filter(Boolean);
              window.dispatchEvent(new CustomEvent("copo-user-deleted", { detail: { userIds: uIds, email: payload.email, name: payload.name, handle: payload.handle } }));
            } else if (payload.type === "user_restored") {
              const uIds = Array.isArray(payload.userIds) ? payload.userIds : [payload.userId, payload.email].filter(Boolean);
              window.dispatchEvent(new CustomEvent("copo-user-restored", { detail: { ids: uIds } }));
            } else if (payload.type === "user_deactivated") {
              const uIds = Array.isArray(payload.userIds) ? payload.userIds : [payload.userId, payload.email, payload.name, payload.handle].filter(Boolean);
              window.dispatchEvent(new CustomEvent("copo-user-deactivated", { detail: { userIds: uIds, email: payload.email, name: payload.name, handle: payload.handle } }));
            } else if (payload.type === "user_reactivated") {
              const uIds = Array.isArray(payload.userIds) ? payload.userIds : [payload.userId, payload.email, payload.name, payload.handle].filter(Boolean);
              window.dispatchEvent(new CustomEvent("copo-user-reactivated", { detail: { userIds: uIds, email: payload.email, name: payload.name, handle: payload.handle } }));
            } else if (payload.type === "users_purged") {
              window.dispatchEvent(new CustomEvent("copo-users-purged"));
            } else if (payload.type === "init") {
              if (Array.isArray(payload.deletedIds) && payload.deletedIds.length > 0) {
                const serverDelSet = new Set(payload.deletedIds.map(String));
                payload.deletedIds.forEach((id: string) => recordClientDeletedId(id));
                setVideos((prev) => prev.filter((v) => !serverDelSet.has(String(v.id))));
                payload.deletedIds.forEach((id: string) => {
                  window.dispatchEvent(new CustomEvent("copo-video-deleted", { detail: { videoId: id } }));
                });
              }
              if (Array.isArray(payload.deletedPlaceIds)) {
                window.dispatchEvent(new CustomEvent("copo-init-deleted-places", { detail: { deletedPlaceIds: payload.deletedPlaceIds } }));
              }
              if (Array.isArray(payload.deletedUserIds)) {
                window.dispatchEvent(new CustomEvent("copo-init-deleted-users", { detail: { deletedUserIds: payload.deletedUserIds } }));
              }
              if (Array.isArray(payload.deactivatedUserIds)) {
                window.dispatchEvent(new CustomEvent("copo-init-deactivated-users", { detail: { deactivatedUserIds: payload.deactivatedUserIds } }));
              }
            } else if (payload.type === "bulk_videos_deleted" && Array.isArray(payload.videoIds)) {
              const idSet = new Set(payload.videoIds.map(String));
              payload.videoIds.forEach((id: string) => recordClientDeletedId(id));
              setVideos((prev) => prev.filter((v) => !idSet.has(v.id)));
              payload.videoIds.forEach((id: string) => {
                window.dispatchEvent(new CustomEvent("copo-video-deleted", { detail: { videoId: id } }));
              });
            } else if (payload.type === "new_comment" && payload.videoId) {
              const vidId = String(payload.videoId);
              setVideos((prev) => {
                const nextList = prev.map((v) => {
                  if (v.id === vidId) {
                    const rawList = payload.comments || [...(v.comments || []), payload.comment];
                    const tree = buildCommentTree(rawList);
                    return {
                      ...v,
                      comments: tree.comments,
                      commentsCount: payload.commentsCount !== undefined ? payload.commentsCount : tree.count
                    };
                  }
                  return v;
                });
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(nextList.slice(0, 50)));
                } catch (e) {}
                return nextList;
              });
              window.dispatchEvent(new CustomEvent("copo-new-comment", { detail: payload }));
            } else if (payload.type === "delete_comment" && payload.videoId) {
              const vidId = String(payload.videoId);
              const delCommId = payload.commentId ? String(payload.commentId) : "";
              const delReplyId = payload.replyId ? String(payload.replyId) : "";

              try {
                const delRaw = localStorage.getItem("copo_deleted_comments");
                const delList: string[] = delRaw ? JSON.parse(delRaw) : [];
                if (delCommId && !delList.includes(delCommId)) delList.push(delCommId);
                if (delReplyId && !delList.includes(delReplyId)) delList.push(delReplyId);
                localStorage.setItem("copo_deleted_comments", JSON.stringify(delList));
              } catch (e) {}

              setVideos((prev) => {
                const updated = prev.map((v) => {
                  if (v.id === vidId) {
                    const rawList = payload.comments || [];
                    const tree = buildCommentTree(rawList);
                    return {
                      ...v,
                      comments: tree.comments,
                      commentsCount: payload.commentsCount !== undefined ? payload.commentsCount : tree.count
                    };
                  }
                  return v;
                });
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(updated.slice(0, 50)));
                } catch (e) {}
                return updated;
              });
              window.dispatchEvent(new CustomEvent("copo-delete-comment", { detail: payload }));
            } else if (payload.type === "sync_comments") {
              loadData(1, true);
            } else if (payload.type === "like_comment" && payload.videoId) {
              window.dispatchEvent(new CustomEvent("copo-like-comment", { detail: payload }));
            } else if (payload.type === "heart_comment" && payload.videoId) {
              window.dispatchEvent(new CustomEvent("copo-heart-comment", { detail: payload }));
            } else if (payload.type === "owner_response_updated" && payload.videoId) {
              const vidId = String(payload.videoId);
              setVideos((prev) => prev.map((v) => {
                if (v.id === vidId) {
                  return {
                    ...v,
                    ownerResponse: payload.ownerResponse || undefined
                  };
                }
                return v;
              }));
              window.dispatchEvent(new CustomEvent("copo-owner-response-updated", { detail: payload }));
            } else if (payload.type === "video_liked" && payload.videoId) {
              const vidId = String(payload.videoId);
              setVideos((prev) => {
                const nextList = prev.map((v) => v.id === vidId ? {
                  ...v,
                  likes: typeof payload.likesCount === 'number' ? payload.likesCount : v.likes,
                  likesCount: typeof payload.likesCount === 'number' ? payload.likesCount : v.likesCount
                } : v);
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(nextList.slice(0, 50)));
                } catch (e) {}
                return nextList;
              });
            } else if (payload.type === "video_bookmarked" && payload.videoId) {
              const vidId = String(payload.videoId);
              setVideos((prev) => {
                const nextList = prev.map((v) => v.id === vidId ? {
                  ...v,
                  bookmarks: typeof payload.bookmarksCount === 'number' ? payload.bookmarksCount : v.bookmarks,
                  bookmarksCount: typeof payload.bookmarksCount === 'number' ? payload.bookmarksCount : v.bookmarksCount
                } : v);
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(nextList.slice(0, 50)));
                } catch (e) {}
                return nextList;
              });
            } else if (payload.type === "new_video_review" && payload.review && payload.review.id) {
              const incoming = normalizeReview(payload.review);
              const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
              let delList: string[] = [];
              try { delList = JSON.parse(deletedStr); } catch (e) {}
              if (!delList.includes(String(incoming.id))) {
                setVideos((prev) => {
                  let nextList: VideoReview[];
                  if (prev.some((v) => v.id === incoming.id)) {
                    nextList = prev.map((v) => v.id === incoming.id ? { ...v, ...incoming } : v);
                  } else {
                    nextList = [incoming, ...prev];
                  }
                  try {
                    localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(nextList.slice(0, 50)));
                  } catch (e) {}
                  return nextList;
                });
              }
            } else if (payload.type === "video_shared" && payload.videoId) {
              const vidId = String(payload.videoId);
              setVideos((prev) => {
                const nextList = prev.map((v) => v.id === vidId ? {
                  ...v,
                  shares: typeof payload.sharesCount === 'number' ? Math.max(v.shares || 0, payload.sharesCount) : v.shares,
                  sharesCount: typeof payload.sharesCount === 'number' ? Math.max(v.sharesCount || 0, payload.sharesCount) : v.sharesCount
                } : v);
                try {
                  localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(nextList.slice(0, 50)));
                } catch (e) {}
                return nextList;
              });
            } else if (payload.type === "purge_all_videos") {
              setVideos([]);
              try {
                localStorage.removeItem("copo_videos");
                localStorage.removeItem("yoouz_cached_videos_v25");
                localStorage.removeItem("yoouz_cached_videos_v22");
                localStorage.removeItem("yoouz_cached_videos_v21");
                localStorage.removeItem("yoouz_cached_videos_v20");
                localStorage.removeItem("yoouz_cached_videos_v16");
              } catch (e) {}
              window.dispatchEvent(new CustomEvent("copo-videos-purged"));
            }
          } catch (e) {}
        }, 0);
      };

        sse.onerror = () => {
          if (sse) {
            try { sse.close(); } catch (e) {}
            sse = null;
          }
          if (active && (typeof navigator === "undefined" || navigator.onLine) && typeof document !== "undefined" && !document.hidden) {
            if (sseReconnectTimeout) clearTimeout(sseReconnectTimeout);
            sseReconnectTimeout = setTimeout(setupSse, sseRetryDelay);
            sseRetryDelay = Math.min(sseRetryDelay * 2, 60000);
          }
        };
      } catch (e) {}
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (sse) {
          try { sse.close(); } catch (e) {}
          sse = null;
        }
      } else if (active) {
        setupSse();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    const sseInitTimer = setTimeout(() => {
      if (active) setupSse();
    }, 1200);

    // 3. Listen for live video, place, and user deletion events in current window
    const handleVideoDeletedEvent = (e: any) => {
      const deletedId = e?.detail?.videoId;
      if (deletedId) {
        recordClientDeletedId(deletedId);
        setVideos((prev) => prev.filter((v) => v.id !== deletedId));
      }
    };
    const handleVideosPurgedEvent = () => {
      setVideos([]);
      try {
        localStorage.removeItem("yoouz_cached_videos_v28");
        localStorage.removeItem("yoouz_cached_videos_v27");
        localStorage.removeItem("yoouz_cached_videos_v26");
        localStorage.removeItem("yoouz_cached_videos_v25");
        localStorage.removeItem("yoouz_local_created_reviews");
        localStorage.removeItem("copo_videos");
      } catch (e) {}
    };

    const handlePlaceDeletedEvent = (e: any) => {
      const vars: string[] = Array.isArray(e?.detail?.variants) ? e.detail.variants : (e?.detail?.placeId ? [e.detail.placeId] : []);
      const varsLow = vars.map(v => String(v).toLowerCase());
      if (varsLow.length > 0) {
        setVideos((prev) => prev.filter((v) => {
          const pId = (v.placeId || "").toLowerCase();
          const pName = (v.placeName || "").toLowerCase();
          return !varsLow.some(val => val === pId || val === pName || (val.length > 3 && pName.includes(val)));
        }));
      }
    };

    const handlePlacesPurgedEvent = () => {
      setVideos([]);
    };

    const handleUserDeletedEvent = (e: any) => {
      const uIds: string[] = Array.isArray(e?.detail?.userIds) ? e.detail.userIds : (e?.detail?.userId ? [e.detail.userId] : []);
      const uIdsLow = uIds.map(u => String(u).toLowerCase());
      if (uIdsLow.length > 0) {
        setVideos((prev) => prev.filter((v) => {
          const uId = (v.userId || "").toLowerCase();
          const uEmail = (v.userEmail || "").toLowerCase();
          const uName = (v.author?.name || v.authorName || "").toLowerCase();
          const uHandle = (v.author?.handle || "").replace(/^@+/, "").toLowerCase();
          return !uIdsLow.some(val => val === uId || val === uEmail || val === uName || val === uHandle);
        }));
      }
    };

    const handleUsersPurgedEvent = () => {
      setVideos([]);
    };

    const handleUserRestoredEvent = (e: any) => {
      const uIds = e.detail?.ids || [];
      if (Array.isArray(uIds) && uIds.length > 0) {
        try {
          unrecordDeletedUsersInLocalStorage(uIds);
        } catch (err) {}
      }
      loadData(1, true);
    };

    window.addEventListener("copo-video-deleted", handleVideoDeletedEvent);
    window.addEventListener("copo-videos-purged", handleVideosPurgedEvent);
    window.addEventListener("copo-place-deleted", handlePlaceDeletedEvent);
    window.addEventListener("copo-places-purged", handlePlacesPurgedEvent);
    window.addEventListener("copo-user-deleted", handleUserDeletedEvent);
    window.addEventListener("copo-user-restored", handleUserRestoredEvent);
    window.addEventListener("copo-users-purged", handleUsersPurgedEvent);

    loadDataRef.current = loadData;

    // Initial load
    loadData(1, false);

    // Live background polling (every 12 seconds) as backup synchronization
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && (typeof navigator === "undefined" || navigator.onLine)) {
        loadData(1, true);
      }
    }, 12000);

    // Immediate refresh on tab focus / app resume / network online
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && (typeof navigator === "undefined" || navigator.onLine)) {
        loadData(1, true);
      }
    };

    const handleOnline = () => {
      sseRetryDelay = 2000;
      if (!sse) setupSse();
      loadData(1, true);
    };

    const handleOffline = () => {
      if (sseReconnectTimeout) clearTimeout(sseReconnectTimeout);
      if (sse) {
        try { sse.close(); } catch (e) {}
        sse = null;
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      active = false;
      clearTimeout(sseInitTimer);
      clearInterval(interval);
      if (sseReconnectTimeout) clearTimeout(sseReconnectTimeout);
      if (sse) {
        try { sse.close(); } catch (e) {}
        sse = null;
      }
      window.removeEventListener("copo-video-deleted", handleVideoDeletedEvent);
      window.removeEventListener("copo-videos-purged", handleVideosPurgedEvent);
      window.removeEventListener("copo-place-deleted", handlePlaceDeletedEvent);
      window.removeEventListener("copo-places-purged", handlePlacesPurgedEvent);
      window.removeEventListener("copo-user-deleted", handleUserDeletedEvent);
      window.removeEventListener("copo-user-restored", handleUserRestoredEvent);
      window.removeEventListener("copo-users-purged", handleUsersPurgedEvent);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !loadDataRef.current) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadDataRef.current(nextPage, false);
  }, [isLoading, hasMore, page]);

  return { videos, setVideos, isLoading, loadMore, hasMore };
}
