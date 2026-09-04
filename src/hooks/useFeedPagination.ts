import { useState, useEffect } from 'react';
import { VideoReview } from '../types';
import { getDisplayViews, resolveSafeAuthor } from '../utils/placeUtils';

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

    return {
      ...v,
      id: videoId,
      views: computedViews,
      viewsCount: computedViews,
      likes: typeof v.likesCount === 'number' ? v.likesCount : (typeof v.likes === 'number' ? v.likes : 0),
      isLiked: likedIds.includes(videoId),
      isBookmarked: savedIds.includes(videoId),
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
    try {
      const cached = localStorage.getItem("yoouz_cached_videos_v20");
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
        }
      }
    } catch (e) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(videos.length === 0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const loadData = async (isBackground = false) => {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { 
        const parsed = JSON.parse(deletedStr); 
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}

      try {
        // 1. Fetch from Server API (always fresh from BunnyDB)
        const res = await fetch(`/api/videos/feed?t=${Date.now()}`);
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
              // Track local optimistic state (likes, bookmarks, views)
              const interactionMap = new Map<string, { isLiked?: boolean; isBookmarked?: boolean; likes?: number; views?: number }>();
              prev.forEach((v) => {
                if (v && v.id) {
                  interactionMap.set(v.id, {
                    isLiked: v.isLiked,
                    isBookmarked: v.isBookmarked,
                    likes: v.likes,
                    views: v.views
                  });
                }
              });

              // Keep any fresh local pending uploads that haven't hit the server feed yet (within last 60s)
              const nowMs = Date.now();
              const pendingLocalVideos = prev.filter(
                (v) =>
                  v &&
                  v.id &&
                  !allDeletedSet.has(String(v.id)) &&
                  (v as any).isLocalUpload &&
                  nowMs - (v.createdAtMs || 0) < 60000 &&
                  !valid.some((sv) => sv.id === v.id)
              );

              // Server videos are authoritative: if a video was deleted on server, it is dropped here!
              const mergedServerVideos = valid.map((v) => {
                const local = interactionMap.get(v.id);
                if (local) {
                  return {
                    ...v,
                    isLiked: local.isLiked !== undefined ? local.isLiked : v.isLiked,
                    isBookmarked: local.isBookmarked !== undefined ? local.isBookmarked : v.isBookmarked,
                    likes: typeof local.likes === 'number' && local.likes > v.likes ? local.likes : v.likes,
                    views: typeof local.views === 'number' && local.views > v.views ? local.views : v.views
                  };
                }
                return v;
              });

              const merged = [...pendingLocalVideos, ...mergedServerVideos];
              merged.sort((a, b) => {
                const aTime = a.createdAtMs || (a.id && a.id.startsWith('rev-') ? parseInt(a.id.split('-')[1]) : 0) || 0;
                const bTime = b.createdAtMs || (b.id && b.id.startsWith('rev-') ? parseInt(b.id.split('-')[1]) : 0) || 0;
                return bTime - aTime;
              });
              
              // Persist fresh feed to cache
              try { localStorage.setItem("yoouz_cached_videos_v20", JSON.stringify(merged.slice(0, 50))); } catch(e){}
              
              return merged;
            });
            if (!isBackground) setIsLoading(false);
          } else {
            if (!isBackground) setIsLoading(false);
          }
        }
      } catch (err) {
        if (!isBackground) {
          console.warn("[useFeedPagination] Server fetch failed:", err);
          setIsLoading(false);
        }
      }

      if (!isBackground) {
        setTimeout(() => { if (active) setIsLoading(false); }, 1500);
      }
    };

    // 2. Real-Time Server-Sent Events (SSE) stream for instant cross-device deletions & updates
    let sse: EventSource | null = null;
    let sseReconnectTimeout: any = null;

    const setupSse = () => {
      try {
        sse = new EventSource("/api/videos/stream");

        sse.onmessage = (event) => {
          if (!active) return;
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
            } else if (payload.type === "purge_all_videos") {
              setVideos([]);
              try {
                localStorage.removeItem("copo_videos");
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
            sse.close();
            sse = null;
          }
          if (active) {
            sseReconnectTimeout = setTimeout(setupSse, 3000);
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

    // Live background polling every 3 seconds as ultra-reliable synchronization fallback
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    }, 3000);

    // Immediate refresh on tab focus / app resume
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      active = false;
      clearInterval(interval);
      if (sseReconnectTimeout) clearTimeout(sseReconnectTimeout);
      if (sse) {
        sse.close();
        sse = null;
      }
      window.removeEventListener("copo-video-deleted", handleVideoDeletedEvent);
      window.removeEventListener("copo-videos-purged", handleVideosPurgedEvent);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  const loadMore = async () => {
    setHasMore(false);
  };

  return { videos, setVideos, isLoading, loadMore, hasMore };
}
