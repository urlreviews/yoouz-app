import { useState, useEffect } from 'react';
import { VideoReview } from '../types';
import { getDisplayViews, resolveSafeAuthor, unrecordDeletedUsersInLocalStorage, YOOUZ_VIDEOS_CACHE_KEY } from '../utils/placeUtils';
import { INITIAL_SEED_VIDEOS } from '../data/seedReviews';
import { buildCommentTree } from '../utils/commentUtils';

// Helper to record deleted video IDs in localStorage to avoid re-rendering stale caches
function recordClientDeletedId(id: string) {
  if (!id) return;
  try {
    const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
    let deletedIds: string[] = [];
    try {
      const parsed = JSON.parse(deletedStr);
      if (Array.isArray(parsed)) deletedIds = parsed;
    } catch (e) {}

    const strId = String(id);
    if (!deletedIds.includes(strId)) {
      deletedIds.push(strId);
      localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedIds));
    }

    // Immediately remove from cached feed and local reviews
    try {
      const cached = localStorage.getItem(YOOUZ_VIDEOS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((v: any) => v && v.id !== strId);
          localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(filtered));
        }
      }
    } catch (e) {}

    try {
      const localPubStr = localStorage.getItem("yoouz_local_created_reviews");
      if (localPubStr) {
        const parsedLp = JSON.parse(localPubStr);
        if (Array.isArray(parsedLp)) {
          const filteredLp = parsedLp.filter((v: any) => v && v.id !== strId);
          localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(filteredLp));
        }
      }
    } catch (e) {}
  } catch (e) {}
}

// Helper to cleanly sanitize and normalize author data
function normalizeReview(v: any): VideoReview {
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
    const isBookmarked = savedIds.includes(videoId);
    const isLiked = likedIds.includes(videoId);

    const rawLikes = typeof v.likesCount === 'number' ? v.likesCount : (typeof v.likes === 'number' ? v.likes : 0);
    const likesCountVal = isLiked ? Math.max(1, rawLikes) : rawLikes;

    const rawBookmarks = typeof v.bookmarksCount === 'number' ? v.bookmarksCount : (typeof v.bookmarks === 'number' ? v.bookmarks : 0);
    const bookmarksCountVal = isBookmarked ? Math.max(1, rawBookmarks) : rawBookmarks;

    const sharesCountVal = typeof v.sharesCount === 'number' ? v.sharesCount : (typeof v.shares === 'number' ? v.shares : 0);

    return {
      ...v,
      id: videoId,
      views: computedViews,
      viewsCount: computedViews,
      likes: likesCountVal,
      likesCount: likesCountVal,
      bookmarksCount: bookmarksCountVal,
      bookmarks: bookmarksCountVal,
      shares: sharesCountVal,
      sharesCount: sharesCountVal,
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
  "rev-1787774080951-vuu2k",
  "rev-1788295000000-hertz",
  "rev-1788294000000-avis",
  "rev-12345",
  "rev-test-verify-123",
  "rev-test-big-thumb"
];

const PROTECTED_FEED_PLACES = new Set([
  "yoouz.com",
  "yoouz",
  "www.yoouz.com",
  "nevadalegalservices.org",
  "lernerandrowe.com",
  "mcveaghfleming.co.nz",
  "vanlawfirm.com"
]);

const PROTECTED_FEED_CREATORS = new Set([
  "steven akan",
  "stevenakan",
  "@stevenakan",
  "ben blue",
  "benblue",
  "@benblue",
  "avr6566gd@gmail.com",
  "aouisesmee@gmail.com",
  "info@yoouz.com",
  "yoouz"
]);

export const isPurgedItem = (v: any, extraDeletedIds?: string[] | Set<string>) => {
  if (!v || !v.id) return true;
  const id = String(v.id);
  if (HARD_DELETED_IDS.includes(id)) return true;
  if (extraDeletedIds) {
    if (extraDeletedIds instanceof Set && extraDeletedIds.has(id)) return true;
    if (Array.isArray(extraDeletedIds) && extraDeletedIds.includes(id)) return true;
  }
  if (id === "rev-12345" || id.startsWith("rev-test") || id.startsWith("rev-err-")) return true;

  const pId = (v.placeId || "").toLowerCase().trim();
  const pName = (v.placeName || "").toLowerCase().trim();
  const pWebsite = (v.placeWebsite || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();

  const isProtectedPlace = PROTECTED_FEED_PLACES.has(pId) || PROTECTED_FEED_PLACES.has(pName) || PROTECTED_FEED_PLACES.has(pWebsite);

  // Check deleted places from localStorage
  if (!isProtectedPlace) {
    try {
      const deletedPlacesStr = localStorage.getItem("copo_deleted_places") || localStorage.getItem("yoouz_deleted_places") || "[]";
      const deletedPlaces: string[] = JSON.parse(deletedPlacesStr);
      if (Array.isArray(deletedPlaces) && deletedPlaces.length > 0) {
        if (deletedPlaces.some(dp => {
          const dpLow = String(dp).toLowerCase().trim();
          return dpLow === pId || dpLow === pName || (pWebsite && dpLow === pWebsite);
        })) {
          return true;
        }
      }
    } catch (e) {}
  }

  const uId = (v.userId || "").toLowerCase();
  const uEmail = (v.userEmail || "").toLowerCase();
  const uName = (v.author?.name || v.authorName || "").toLowerCase();
  const uHandle = (v.author?.handle || "").replace(/^@+/, "").toLowerCase();

  const isProtectedCreator = PROTECTED_FEED_CREATORS.has(uId) || PROTECTED_FEED_CREATORS.has(uEmail) || PROTECTED_FEED_CREATORS.has(uName) || PROTECTED_FEED_CREATORS.has(uHandle);

  // Check deleted users from localStorage
  if (!isProtectedCreator) {
    try {
      const deletedUsersStr = localStorage.getItem("copo_deleted_users") || localStorage.getItem("yoouz_deleted_users") || "[]";
      const deletedUsers: string[] = JSON.parse(deletedUsersStr);
      if (Array.isArray(deletedUsers) && deletedUsers.length > 0) {
        if (deletedUsers.some(du => {
          const duLow = String(du).toLowerCase();
          return duLow === uId || duLow === uEmail || duLow === uName || duLow === uHandle;
        })) {
          return true;
        }
      }
    } catch (e) {}
  }

  if (v.placeId === "avis.com" || v.placeId === "hertz.com") return true;
  const placeNameLower = (v.placeName || "").toLowerCase();
  if (placeNameLower === "hertz" || placeNameLower === "car rentals from avis") return true;
  return false;
};

export function useFeedPagination() {
  const [videos, setVideos] = useState<VideoReview[]>(() => {
    const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
    let deletedIds: string[] = [];
    try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

    HARD_DELETED_IDS.forEach(id => {
      if (!deletedIds.includes(id)) deletedIds.push(id);
    });

    try {
      // Purge legacy caches
      ["yoouz_cached_videos_v28", "yoouz_cached_videos_v27", "yoouz_cached_videos_v26", "yoouz_cached_videos_v25"].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      const getReviewTime = (v: any) => {
        if (!v) return 0;
        const fromDt = v.createdAt ? new Date(v.createdAt.includes('T') ? v.createdAt : v.createdAt.replace(' ', 'T') + 'Z').getTime() : 0;
        const fromMs = typeof v.createdAtMs === 'number' ? v.createdAtMs : 0;
        const fromId = (v.id && typeof v.id === 'string' && v.id.startsWith('rev-')) ? parseInt(v.id.split('-')[1], 10) : 0;
        return Math.max(fromDt || 0, fromMs || 0, fromId || 0);
      };

      let localPublished: any[] = [];
      try {
        const localPubStr = localStorage.getItem("yoouz_local_created_reviews");
        if (localPubStr) {
          const parsedLp = JSON.parse(localPubStr);
          if (Array.isArray(parsedLp)) {
            const cleanedLp = parsedLp.filter((v: any) => !isPurgedItem(v));
            localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(cleanedLp));
            localPublished = cleanedLp.map(normalizeReview);
          }
        }
      } catch (e) {}

      const cached = localStorage.getItem(YOOUZ_VIDEOS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((v: any) => !isPurgedItem(v)).map(normalizeReview);
          if (filtered.length > 0) {
            const combinedMap = new Map<string, VideoReview>();
            localPublished.forEach((v) => combinedMap.set(v.id, v));
            filtered.forEach((v) => {
              if (!combinedMap.has(v.id)) combinedMap.set(v.id, v);
            });
            const result = Array.from(combinedMap.values());
            result.sort((a, b) => getReviewTime(b) - getReviewTime(a));
            return result;
          }
        }
      }

      if (localPublished.length > 0) {
        const combinedMap = new Map<string, VideoReview>();
        localPublished.forEach((v) => combinedMap.set(v.id, v));
        INITIAL_SEED_VIDEOS.filter((v: any) => !isPurgedItem(v)).map(normalizeReview).forEach((v) => {
          if (!combinedMap.has(v.id)) combinedMap.set(v.id, v);
        });
        const result = Array.from(combinedMap.values());
        result.sort((a, b) => getReviewTime(b) - getReviewTime(a));
        return result;
      }
    } catch (e) {}
    // Instant fallback to seed videos: eliminates cold-start skeleton and guarantees 0ms first card rendering
    const seeds = INITIAL_SEED_VIDEOS.filter((v: any) => !isPurgedItem(v)).map(normalizeReview);
    return seeds;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    let isFetching = false;
    let sse: EventSource | null = null;
    let sseReconnectTimeout: any = null;
    let sseRetryDelay = 2000;

    const loadData = async (isBackground = false) => {
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
        const res = await fetch(`/api/videos/feed?_t=${Date.now()}`, { cache: "no-store" });
        if (res.ok && active) {
          const data = await res.json();
          const hardBannedIds = [
            "rev-1787774080951-vuu2k",
            "rev-1788295000000-hertz",
            "rev-1788294000000-avis"
          ];
          const serverDeletedIds: string[] = Array.isArray(data?.deletedIds) ? data.deletedIds : [];
          const allDeletedSet = new Set([...deletedIds, ...serverDeletedIds, ...hardBannedIds]);

          const isPurgedVideo = (v: any) => {
            if (!v || !v.id) return true;
            const id = String(v.id);
            if (allDeletedSet.has(id)) return true;
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
              // Track local optimistic state (likes, bookmarks, views, comments, shares)
              const interactionMap = new Map<string, { isLiked?: boolean; isBookmarked?: boolean; likes?: number; bookmarksCount?: number; sharesCount?: number; views?: number; comments?: any[]; commentsCount?: number }>();
              prev.forEach((v) => {
                if (v && v.id) {
                  interactionMap.set(v.id, {
                    isLiked: v.isLiked,
                    isBookmarked: v.isBookmarked,
                    likes: v.likes,
                    bookmarksCount: v.bookmarksCount,
                    sharesCount: v.sharesCount,
                    views: v.views,
                    comments: v.comments,
                    commentsCount: v.commentsCount
                  });
                }
              });

              // Keep only real, non-purged local pending uploads or recently created reviews
              let localSavedReviews: any[] = [];
              try {
                const ls = localStorage.getItem("yoouz_local_created_reviews");
                if (ls) {
                  const parsed = JSON.parse(ls);
                  if (Array.isArray(parsed)) localSavedReviews = parsed;
                }
              } catch (e) {}

              const pendingCandidateList = [
                ...prev.filter((v) => v && (Boolean((v as any).isLocalUpload) || (v.createdAtMs ? (Date.now() - v.createdAtMs < 900000) : false))),
                ...localSavedReviews
              ];

              const pendingLocalVideosMap = new Map<string, any>();
              pendingCandidateList.forEach((v) => {
                if (
                  v &&
                  v.id &&
                  !isPurgedItem(v) &&
                  !allDeletedSet.has(String(v.id)) &&
                  !valid.some((sv) => sv.id === v.id)
                ) {
                  pendingLocalVideosMap.set(v.id, normalizeReview(v));
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

                  const isBm = local.isBookmarked !== undefined ? local.isBookmarked : v.isBookmarked;
                  const isLk = local.isLiked !== undefined ? local.isLiked : v.isLiked;

                  const rawServerLikes = typeof v.likesCount === 'number' ? v.likesCount : (typeof v.likes === 'number' ? v.likes : 0);
                  const rawLocalLikes = typeof local.likes === 'number' ? local.likes : 0;
                  const effLikes = isLk ? Math.max(1, rawServerLikes, rawLocalLikes) : Math.max(0, rawServerLikes);

                  const rawServerBm = typeof v.bookmarksCount === 'number' ? v.bookmarksCount : (typeof v.bookmarks === 'number' ? v.bookmarks : 0);
                  const rawLocalBm = typeof local.bookmarksCount === 'number' ? local.bookmarksCount : 0;
                  const effBookmarks = isBm ? Math.max(1, rawServerBm, rawLocalBm) : Math.max(0, rawServerBm);

                  const rawServerShares = typeof v.sharesCount === 'number' ? v.sharesCount : (typeof v.shares === 'number' ? v.shares : 0);
                  const rawLocalShares = typeof local.sharesCount === 'number' ? local.sharesCount : 0;
                  const effShares = Math.max(rawServerShares, rawLocalShares);

                  return {
                    ...v,
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
              
              // Persist fresh feed to cache
              try { 
                localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(merged.slice(0, 50))); 
              } catch(e){}
              
              return merged;
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
    const setupSse = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (sse) {
        try { sse.close(); } catch (e) {}
        sse = null;
      }

      try {
        sse = new EventSource("/api/videos/stream");

        sse.onopen = () => {
          sseRetryDelay = 5000;
        };

        sse.onmessage = (event) => {
          if (!active) return;
          sseRetryDelay = 5000;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "video_deleted" && payload.videoId) {
              const targetId = String(payload.videoId);
              recordClientDeletedId(targetId);
              setVideos((prev) => prev.filter((v) => v.id !== targetId));
              window.dispatchEvent(new CustomEvent("copo-video-deleted", { detail: { videoId: targetId } }));
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
            } else if (payload.type === "users_purged") {
              window.dispatchEvent(new CustomEvent("copo-users-purged"));
            } else if (payload.type === "init") {
              if (Array.isArray(payload.deletedPlaceIds)) {
                window.dispatchEvent(new CustomEvent("copo-init-deleted-places", { detail: { deletedPlaceIds: payload.deletedPlaceIds } }));
              }
              if (Array.isArray(payload.deletedUserIds)) {
                window.dispatchEvent(new CustomEvent("copo-init-deleted-users", { detail: { deletedUserIds: payload.deletedUserIds } }));
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
              setVideos((prev) => prev.map((v) => {
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
              }));
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
              loadData(true);
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
              setVideos((prev) => prev.map((v) => v.id === vidId ? {
                ...v,
                likes: typeof payload.likesCount === 'number' ? payload.likesCount : v.likes,
                likesCount: typeof payload.likesCount === 'number' ? payload.likesCount : v.likesCount
              } : v));
            } else if (payload.type === "video_bookmarked" && payload.videoId) {
              const vidId = String(payload.videoId);
              setVideos((prev) => prev.map((v) => v.id === vidId ? {
                ...v,
                bookmarks: typeof payload.bookmarksCount === 'number' ? payload.bookmarksCount : v.bookmarks,
                bookmarksCount: typeof payload.bookmarksCount === 'number' ? payload.bookmarksCount : v.bookmarksCount
              } : v));
            } else if (payload.type === "new_video_review" && payload.review && payload.review.id) {
              const incoming = normalizeReview(payload.review);
              const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
              let delList: string[] = [];
              try { delList = JSON.parse(deletedStr); } catch (e) {}
              if (!delList.includes(String(incoming.id))) {
                setVideos((prev) => {
                  if (prev.some((v) => v.id === incoming.id)) {
                    return prev.map((v) => v.id === incoming.id ? { ...v, ...incoming } : v);
                  }
                  return [incoming, ...prev];
                });
              }
            } else if (payload.type === "video_shared" && payload.videoId) {
              const vidId = String(payload.videoId);
              setVideos((prev) => prev.map((v) => v.id === vidId ? {
                ...v,
                shares: typeof payload.sharesCount === 'number' ? Math.max(v.shares || 0, payload.sharesCount) : v.shares,
                sharesCount: typeof payload.sharesCount === 'number' ? Math.max(v.sharesCount || 0, payload.sharesCount) : v.sharesCount
              } : v));
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
            } else if (payload.type === "init" && Array.isArray(payload.deletedIds)) {
              const serverDelSet = new Set(payload.deletedIds.map(String));
              payload.deletedIds.forEach((id: string) => recordClientDeletedId(id));
              setVideos((prev) => prev.filter((v) => !serverDelSet.has(v.id)));
            }
          } catch (e) {}
        };

        sse.onerror = () => {
          if (sse) {
            try { sse.close(); } catch (e) {}
            sse = null;
          }
          if (active && (typeof navigator === "undefined" || navigator.onLine)) {
            if (sseReconnectTimeout) clearTimeout(sseReconnectTimeout);
            sseReconnectTimeout = setTimeout(setupSse, sseRetryDelay);
            sseRetryDelay = Math.min(sseRetryDelay * 1.5, 30000);
          }
        };
      } catch (e) {}
    };

    setupSse();

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
      loadData(true);
    };

    window.addEventListener("copo-video-deleted", handleVideoDeletedEvent);
    window.addEventListener("copo-videos-purged", handleVideosPurgedEvent);
    window.addEventListener("copo-place-deleted", handlePlaceDeletedEvent);
    window.addEventListener("copo-places-purged", handlePlacesPurgedEvent);
    window.addEventListener("copo-user-deleted", handleUserDeletedEvent);
    window.addEventListener("copo-user-restored", handleUserRestoredEvent);
    window.addEventListener("copo-users-purged", handleUsersPurgedEvent);

    // Initial load
    loadData(false);

    // Live background polling (every 12 seconds) as backup synchronization
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && (typeof navigator === "undefined" || navigator.onLine)) {
        loadData(true);
      }
    }, 12000);

    // Immediate refresh on tab focus / app resume / network online
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && (typeof navigator === "undefined" || navigator.onLine)) {
        loadData(true);
      }
    };

    const handleOnline = () => {
      sseRetryDelay = 2000;
      if (!sse) setupSse();
      loadData(true);
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

  const loadMore = async () => {
    setHasMore(false);
  };

  return { videos, setVideos, isLoading, loadMore, hasMore };
}
