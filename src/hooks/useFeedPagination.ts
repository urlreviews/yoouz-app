import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, getDocs } from "../lib/firebase";
import { db } from '../lib/firebase';
import { VideoReview } from '../types';
import { getDisplayViews, resolveSafeAuthor } from '../utils/placeUtils';

// Helper to cleanly sanitize and normalize author data
function normalizeReview(v: any): VideoReview {
  let likedIds: any[] = [];
  let savedIds: any[] = [];
  try { 
    const parsed = JSON.parse(localStorage.getItem("copo_liked_video_ids") || "[]");
    if (Array.isArray(parsed)) likedIds = parsed;
  } catch(e){}
  try { 
    const parsed = JSON.parse(localStorage.getItem("copo_saved_video_ids") || "[]"); 
    if (Array.isArray(parsed)) savedIds = parsed;
  } catch(e){}

  const safeAuthor = resolveSafeAuthor(v);
  const computedViews = getDisplayViews(v);

  return {
    ...v,
    views: computedViews,
    viewsCount: computedViews,
    isLiked: likedIds.includes(v.id),
    isBookmarked: savedIds.includes(v.id),
    author: safeAuthor
  };
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
          console.log("[DEBUG feed] /api/videos/feed returned:", data?.videos?.length, "videos");
          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            const valid = data.videos.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
            setVideos((prev) => {
              const map = new Map<string, VideoReview>();
              
              // Keep local optimistic reviews
              prev.forEach((v) => {
                if (v.createdAtMs && (Date.now() - v.createdAtMs < 60000)) {
                  map.set(v.id, v);
                }
              });

              valid.forEach((v: VideoReview) => map.set(v.id, { ...map.get(v.id), ...v }));
              const merged = Array.from(map.values());
              merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
              console.log("[DEBUG feed] loadServerData setting videos to length:", merged.length);
              return merged;
            });
            setIsLoading(false);
          } else {
            console.log("[DEBUG feed] /api/videos/feed returned empty or no videos array.");
          }
        } else {
          console.warn("[DEBUG feed] /api/videos/feed fetch failed, res.ok:", res.ok);
        }
      } catch (e) {
        console.error("[DEBUG feed] /api/videos/feed error:", e);
      }
    };

    loadServerData();

    if (!db) {
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

        if (fetched.length > 0) {
          fetched.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          const filtered = fetched.filter(v => !deletedIds.includes(v.id)).map(normalizeReview);
          
          setVideos((prev) => {
            const prevMap = new Map<string, VideoReview>();
            prev.forEach((v) => prevMap.set(v.id, v));
            let followedAuthors = [];
            try { followedAuthors = JSON.parse(localStorage.getItem("copo_followed_authors") || "[]"); } catch(e){}

            const nextList: VideoReview[] = filtered.map(v => {
              const existing = prevMap.get(v.id);
              const isFollowed = followedAuthors.includes(v.author.name);
              const updatedV = { ...v, author: { ...v.author, isFollowed } };
              return existing ? { ...existing, ...updatedV, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : updatedV;
            });

            const firestoreIds = new Set(filtered.map(v => v.id));
            const now = Date.now();
            prev.forEach(v => {
              if (!firestoreIds.has(v.id) && !deletedIds.includes(v.id)) {
                nextList.push(v);
              }
            });

            nextList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
            return nextList;
          });

          try {
            localStorage.setItem("yoouz_cached_videos_v16", JSON.stringify(filtered.slice(0, 50)));
          } catch (e) {}
        }
        setIsLoading(false);
      } catch (err) {
        console.warn("Fast load failed:", err);
        setIsLoading(false);
      }
    };

    loadFirestoreData();

    // 3. Keep live snapshot sync running purely in the background to avoid blocking initial load
    const qLive = query(collection(db, "videoReviews"));
    const unsubscribe = onSnapshot(qLive, (snapshot) => {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { 
        const parsed = JSON.parse(deletedStr); 
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}

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
      console.log("[DEBUG feed] onSnapshot returned docs:", snapshot.docs.length, "filtered length:", filtered.length);

      setVideos((prev) => {
        console.log("[DEBUG feed] onSnapshot setVideos triggered. prev.length:", prev.length, "filtered.length:", filtered.length);
        if (filtered.length === 0) {
          if (prev.length > 0) {
            return prev.filter(v => !deletedIds.includes(v.id));
          }
          return [];
        }

        const prevMap = new Map<string, VideoReview>();
        prev.forEach((v) => prevMap.set(v.id, v));
        let followedAuthors = [];
        try { followedAuthors = JSON.parse(localStorage.getItem("copo_followed_authors") || "[]"); } catch(e){}

        const nextList: VideoReview[] = filtered.map(v => {
          const existing = prevMap.get(v.id);
          const isFollowed = followedAuthors.includes(v.author.name);
          const updatedV = { ...v, author: { ...v.author, isFollowed } };
          return existing ? { ...existing, ...updatedV, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : updatedV;
        });

        const firestoreIds = new Set(filtered.map(v => v.id));
        const now = Date.now();
        prev.forEach(v => {
          if (!firestoreIds.has(v.id) && !deletedIds.includes(v.id)) {
            nextList.push(v);
          }
        });

        nextList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        return nextList;
      });

      try {
        localStorage.setItem("yoouz_cached_videos_v16", JSON.stringify(filtered.slice(0, 50)));
      } catch (e) {}
      setIsLoading(false);
    }, (err) => {
      console.warn("Background feed live-sync notice:", err?.message || err);
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

