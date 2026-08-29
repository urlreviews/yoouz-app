import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, getDocs } from "../lib/firebase";
import { db } from '../lib/firebase';
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
      const cached = localStorage.getItem("yoouz_cached_videos_v16");
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
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem("yoouz_cached_videos_v16");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If we have cached videos, we do NOT show the skeleton screen initially!
          return false;
        }
      }
      return true;
    } catch (e) {
      return true;
    }
  });
  const [hasMore, setHasMore] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    // Auto-sync any local cached videos to server/Firestore on boot so they appear across private windows & devices
    const syncLocalToCloud = async () => {
      try {
        const cached = localStorage.getItem("yoouz_cached_videos_v16") || localStorage.getItem("copo_videos");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const v of parsed) {
              if (v && v.id) {
                fetch(`/api/nosql/videoReviews/${v.id}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ data: v })
                }).catch(() => {});
              }
            }
          }
        }
      } catch (e) {}
    };
    syncLocalToCloud();

    // 1. Initial fast load from server API
    const loadServerData = async () => {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { 
        const parsed = JSON.parse(deletedStr); 
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}

      try {
        console.log("[DEBUG feed] Fetching /api/videos/feed...");
        const res = await fetch("/api/videos/feed");
        if (res.ok && active) {
          const data = await res.json();
          console.log("[DEBUG feed] /api/videos/feed response success:", data?.success, "length:", data?.videos?.length);
          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            const valid = data.videos.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
            setVideos((prev) => {
              const map = new Map<string, VideoReview>();
              
              // Keep local optimistic reviews (less than 1 min old)
              prev.forEach((v) => {
                if (v.createdAtMs && (Date.now() - v.createdAtMs < 60000)) {
                  map.set(v.id, v);
                }
              });

              // Add API videos
              valid.forEach((v: VideoReview) => {
                const existing = map.get(v.id);
                map.set(v.id, { ...existing, ...v });
              });

              const merged = Array.from(map.values());
              merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
              console.log("[DEBUG feed] Final merged videos length:", merged.length);
              return merged;
            });
            setIsLoading(false);
          } else {
            console.log("[DEBUG feed] /api/videos/feed returned empty.");
            // If API is empty, still set loading to false so we don't hang
            setIsLoading(false);
          }
        } else {
          console.warn("[DEBUG feed] /api/videos/feed fetch failed:", res.status);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("[DEBUG feed] /api/videos/feed error:", e);
        setIsLoading(false);
      }
    };

    loadServerData();

    if (!db) {
      console.warn("[DEBUG feed] No Firebase DB detected.");
      setIsLoading(false);
      return;
    }

    // 2. Perform a fast single-round-trip read of the Firestore collection
    const loadFirestoreData = async () => {
      try {
        const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
        let deletedIds: string[] = [];
        try { 
          const parsed = JSON.parse(deletedStr); 
          if (Array.isArray(parsed)) deletedIds = parsed;
        } catch (e) {}

        const q = query(collection(db, "videoReviews"));
        const snapshot = await getDocs(q);
        if (!active) return;

        console.log("[DEBUG feed] loadFirestoreData snapshot size:", snapshot.size);
        if (snapshot.empty) {
          setIsLoading(false);
          return;
        }

        const fetched = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const docViews = typeof data.views === "number" ? data.views : (typeof data.viewsCount === "number" ? data.viewsCount : undefined);
          return {
            ...data,
            id: docSnap.id,
            createdAtMs: data.createdAtMs || (data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()),
            views: docViews,
            viewsCount: docViews,
            likes: typeof data.likes === "number" ? Math.max(0, data.likes) : 0,
            bookmarksCount: typeof data.bookmarksCount === "number" ? Math.max(0, data.bookmarksCount) : 0,
            sharesCount: typeof data.sharesCount === "number" ? Math.max(0, data.sharesCount) : (typeof data.shares === "number" ? Math.max(0, data.shares) : 0),
            commentsCount: typeof data.commentsCount === "number" ? data.commentsCount : (data.comments?.length || 0),
            comments: Array.isArray(data.comments) ? data.comments : []
          };
        }) as VideoReview[];

        fetched.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        const filtered = fetched.filter(v => !deletedIds.includes(v.id)).map(normalizeReview);
        
        if (filtered.length > 0) {
          setVideos((prev) => {
            const map = new Map<string, VideoReview>();
            prev.forEach((v) => map.set(v.id, v));
            
            filtered.forEach(v => {
              const existing = map.get(v.id);
              map.set(v.id, { ...existing, ...v });
            });

            const nextList = Array.from(map.values());
            nextList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
            return nextList;
          });

          try {
            localStorage.setItem("yoouz_cached_videos_v16", JSON.stringify(filtered.slice(0, 50)));
          } catch (e) {}
        }
        setIsLoading(false);
      } catch (err) {
        console.warn("[DEBUG feed] Fast load Firestore failed:", err);
        setIsLoading(false);
      }
    };

    loadFirestoreData();

    // 3. Keep live snapshot sync running purely in the background
    const unsubscribe = onSnapshot(collection(db, "videoReviews"), (snapshot) => {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { 
        const parsed = JSON.parse(deletedStr); 
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}

      if (snapshot.empty && videos.length === 0) {
        // Only stop loading if we truly have nothing
        setIsLoading(false);
        return;
      }

      const fetched = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const docViews = typeof data.views === "number" ? data.views : (typeof data.viewsCount === "number" ? data.viewsCount : undefined);
        return {
          ...data,
          id: docSnap.id,
          createdAtMs: data.createdAtMs || (data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()),
          views: docViews,
          viewsCount: docViews,
          likes: typeof data.likes === "number" ? Math.max(0, data.likes) : 0,
          bookmarksCount: typeof data.bookmarksCount === "number" ? Math.max(0, data.bookmarksCount) : 0,
          sharesCount: typeof data.sharesCount === "number" ? Math.max(0, data.sharesCount) : (typeof data.shares === "number" ? Math.max(0, data.shares) : 0),
          commentsCount: typeof data.commentsCount === "number" ? data.commentsCount : (data.comments?.length || 0),
          comments: Array.isArray(data.comments) ? data.comments : []
        };
      }) as VideoReview[];

      const filtered = fetched.filter(v => !deletedIds.includes(v.id)).map(normalizeReview);
      
      setVideos((prev) => {
        const map = new Map<string, VideoReview>();
        prev.forEach((v) => map.set(v.id, v));
        
        filtered.forEach(v => {
          const existing = map.get(v.id);
          map.set(v.id, { ...existing, ...v });
        });

        const nextList = Array.from(map.values());
        nextList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        return nextList;
      });

      try {
        localStorage.setItem("yoouz_cached_videos_v16", JSON.stringify(filtered.slice(0, 50)));
      } catch (e) {}
      setIsLoading(false);
    }, (err) => {
      console.warn("[DEBUG feed] Background sync error:", err);
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loadMore = async () => {
    setHasMore(false);
  };

  return { videos, setVideos, isLoading, loadMore, hasMore };
}

