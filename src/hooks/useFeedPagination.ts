import { useState, useEffect } from 'react';
import { VideoReview } from '../types';
import { getDisplayViews, resolveSafeAuthor } from '../utils/placeUtils';

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
    // Fallback to a safe minimal object to avoid breaking the entire feed
    return {
      ...v,
      id: v?.id || `rev-err-${Math.random().toString(36).substring(2, 9)}`,
      author: v?.author || { 
        name: "Verified Reviewer", 
        handle: "@user", 
        avatar: `https://ui-avatars.com/api/?name=Reviewer&background=27272a&color=fff` 
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
          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            const valid = data.videos.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
            
            setVideos((prev) => {
              const map = new Map<string, VideoReview>();
              
              // Seed map with existing state
              prev.forEach(v => {
                map.set(v.id, v);
              });

              // Server videos update matching IDs with latest ratings, views, likes, etc.
              valid.forEach(v => {
                const existing = map.get(v.id);
                if (existing) {
                  map.set(v.id, {
                    ...existing,
                    ...v,
                    rating: v.rating !== undefined ? v.rating : existing.rating,
                    placeRating: v.placeRating !== undefined ? v.placeRating : (v.rating !== undefined ? v.rating : existing.placeRating),
                    likes: typeof v.likes === 'number' ? v.likes : existing.likes,
                    views: typeof v.views === 'number' ? v.views : existing.views,
                    isLiked: existing.isLiked !== undefined ? existing.isLiked : v.isLiked,
                    isBookmarked: existing.isBookmarked !== undefined ? existing.isBookmarked : v.isBookmarked
                  });
                } else {
                  map.set(v.id, v);
                }
              });
              
              const merged = Array.from(map.values());
              merged.sort((a, b) => {
                const aTime = a.createdAtMs || (a.id && a.id.startsWith('rev-') ? parseInt(a.id.split('-')[1]) : 0) || 0;
                const bTime = b.createdAtMs || (b.id && b.id.startsWith('rev-') ? parseInt(b.id.split('-')[1]) : 0) || 0;
                return bTime - aTime;
              });
              
              // Persist to cache
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

    // Initial load
    loadData(false);

    // Live background polling every 5 seconds for instant multi-device rating updates
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    }, 5000);

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
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  const loadMore = async () => {
    setHasMore(false);
  };

  return { videos, setVideos, isLoading, loadMore, hasMore };
}

