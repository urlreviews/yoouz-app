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

    const loadData = async () => {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { 
        const parsed = JSON.parse(deletedStr); 
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}

      try {
        // 1. Fetch from Server API
        const res = await fetch("/api/videos/feed");
        if (res.ok && active) {
          const data = await res.json();
          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            const valid = data.videos.filter((v: any) => !deletedIds.includes(v.id)).map(normalizeReview);
            
            setVideos((prev) => {
              const map = new Map<string, VideoReview>();
              // Keep recent local ones
              prev.forEach(v => {
                if (v.id.startsWith("rev-") && v.createdAtMs && (Date.now() - v.createdAtMs < 300000)) {
                  map.set(v.id, v);
                }
              });
              // Add server ones
              valid.forEach(v => map.set(v.id, { ...map.get(v.id), ...v }));
              
              const merged = Array.from(map.values());
              merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
              
              // Persist to cache
              try { localStorage.setItem("yoouz_cached_videos_v20", JSON.stringify(merged.slice(0, 50))); } catch(e){}
              
              return merged;
            });
            setIsLoading(false);
          } else {
             setIsLoading(false);
          }
        }
      } catch (err) {
        console.warn("[useFeedPagination] Server fetch failed:", err);
        setIsLoading(false);
      }

      // 2. Fetch from Firestore if available
      if (db && active) {
        try {
          const q = query(collection(db, "videoReviews"));
          const snap = await getDocs(q);
          if (!active) return;

          if (!snap.empty) {
            const fetched = snap.docs.map(docSnap => ({
              ...docSnap.data(),
              id: docSnap.id,
              createdAtMs: docSnap.data().createdAtMs || (docSnap.data().createdAt?.toMillis ? docSnap.data().createdAt.toMillis() : Date.now())
            })).filter(v => !deletedIds.includes(v.id)).map(normalizeReview);

            setVideos((prev) => {
              const map = new Map<string, VideoReview>();
              prev.forEach(v => map.set(v.id, v));
              fetched.forEach(v => map.set(v.id, { ...map.get(v.id), ...v }));
              const merged = Array.from(map.values());
              merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
              return merged;
            });
            setIsLoading(false);

            // Background sync-back to backend server to populate durable PostgreSQL
            snap.docs.forEach((docSnap) => {
              const rData = docSnap.data();
              if (rData && docSnap.id) {
                fetch("/api/videos/save-review", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...rData, id: docSnap.id })
                }).catch(() => {});
              }
            });
          } else if (videos.length === 0) {
             setIsLoading(false);
          }
        } catch (err) {
          console.warn("[useFeedPagination] Firestore fetch failed:", err);
          setIsLoading(false);
        }
      } else {
        // If no DB, we rely solely on server data
        setTimeout(() => { if (active) setIsLoading(false); }, 1500);
      }
    };

    loadData();

    // 3. Live Snapshot
    let unsubscribe = () => {};
    if (db) {
      unsubscribe = onSnapshot(collection(db, "videoReviews"), (snap) => {
        if (!active) return;
        if (snap.empty) return;

        const fetched = snap.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id,
          createdAtMs: docSnap.data().createdAtMs || (docSnap.data().createdAt?.toMillis ? docSnap.data().createdAt.toMillis() : Date.now())
        })).map(normalizeReview);

        setVideos((prev) => {
          const map = new Map<string, VideoReview>();
          prev.forEach(v => map.set(v.id, v));
          fetched.forEach(v => map.set(v.id, { ...map.get(v.id), ...v }));
          const merged = Array.from(map.values());
          merged.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          return merged;
        });
      });
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, [db]);

  const loadMore = async () => {
    setHasMore(false);
  };

  return { videos, setVideos, isLoading, loadMore, hasMore };
}

