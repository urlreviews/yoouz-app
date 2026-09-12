import { useState, useEffect } from 'react';
import { VideoReview } from '../types';
import { getDisplayViews, resolveSafeAuthor } from '../utils/placeUtils';
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

export function useFeedPagination() {
  const [videos, setVideos] = useState<VideoReview[]>(() => {
    const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
    let deletedIds: string[] = [];
    try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

    try {
      // Purge legacy caches to eliminate corrupted counts and stale sort
      localStorage.removeItem("yoouz_cached_videos_v21");
      localStorage.removeItem("yoouz_cached_videos_v20");
      localStorage.removeItem("yoouz_cached_videos_v19");
      localStorage.removeItem("yoouz_cached_videos_v18");
      localStorage.removeItem("yoouz_cached_videos_v16");

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
            localPublished = parsedLp.filter((v: any) => v && v.id && !deletedIds.includes(String(v.id))).map(normalizeReview);
          }
        }
      } catch (e) {}

      const cached = localStorage.getItem("yoouz_cached_videos_v22");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
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
        INITIAL_SEED_VIDEOS.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview).forEach((v) => {
          if (!combinedMap.has(v.id)) combinedMap.set(v.id, v);
        });
        const result = Array.from(combinedMap.values());
        result.sort((a, b) => getReviewTime(b) - getReviewTime(a));
        return result;
      }
    } catch (e) {}
    // Instant fallback to seed videos: eliminates cold-start skeleton and guarantees 0ms first card rendering
    const seeds = INITIAL_SEED_VIDEOS.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
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
          const serverDeletedIds: string[] = Array.isArray(data?.deletedIds) ? data.deletedIds : [];
          const allDeletedSet = new Set([...deletedIds, ...serverDeletedIds]);

          if (serverDeletedIds.length > 0) {
            try {
              localStorage.setItem("copo_deleted_videos", JSON.stringify(Array.from(allDeletedSet)));
            } catch (e) {}
          }

          if (data && Array.isArray(data.videos)) {
            const valid = data.videos
              .filter((v: any) => v && v.id && !allDeletedSet.has(String(v.id)))
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

              // Keep any fresh local pending uploads that haven't hit the server feed yet
              const pendingLocalVideos = prev.filter(
                (v) =>
                  v &&
                  v.id &&
                  !allDeletedSet.has(String(v.id)) &&
                  (v as any).isLocalUpload &&
                  !valid.some((sv) => sv.id === v.id)
              );

              // Server videos are authoritative: if a video was deleted on server, it is dropped here!
              const mergedServerVideos = valid.map((v) => {
                const local = interactionMap.get(v.id);
                if (local) {
                  const localComments = local.comments || [];
                  const serverComments = v.comments || [];

                  // Canonical tree build eliminates duplicate top-level entries and guarantees exact count parity
                  const combinedRaw = [...serverComments, ...localComments];
                  const tree = buildCommentTree(combinedRaw);

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
              try { localStorage.setItem("yoouz_cached_videos_v22", JSON.stringify(merged.slice(0, 50))); } catch(e){}
              
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
          sseRetryDelay = 2000;
        };

        sse.onmessage = (event) => {
          if (!active) return;
          sseRetryDelay = 2000;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "video_deleted" && payload.videoId) {
              const targetId = String(payload.videoId);
              recordClientDeletedId(targetId);
              setVideos((prev) => prev.filter((v) => v.id !== targetId));
              window.dispatchEvent(new CustomEvent("copo-video-deleted", { detail: { videoId: targetId } }));
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
              setVideos((prev) => prev.map((v) => {
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
              }));
              window.dispatchEvent(new CustomEvent("copo-delete-comment", { detail: payload }));
            } else if (payload.type === "like_comment" && payload.videoId) {
              window.dispatchEvent(new CustomEvent("copo-like-comment", { detail: payload }));
            } else if (payload.type === "heart_comment" && payload.videoId) {
              window.dispatchEvent(new CustomEvent("copo-heart-comment", { detail: payload }));
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

    // 3. Listen for live video deletion events in current window
    const handleVideoDeletedEvent = (e: any) => {
      const deletedId = e?.detail?.videoId;
      if (deletedId) {
        recordClientDeletedId(deletedId);
        setVideos((prev) => prev.filter((v) => v.id !== deletedId));
      }
    };
    const handleVideosPurgedEvent = () => {
      setVideos([]);
    };
    window.addEventListener("copo-video-deleted", handleVideoDeletedEvent);
    window.addEventListener("copo-videos-purged", handleVideosPurgedEvent);

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
