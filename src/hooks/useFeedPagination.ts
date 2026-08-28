import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, getDocs } from "../lib/firebase";
import { db } from '../lib/firebase';
import { VideoReview } from '../types';

// Helper to cleanly sanitize and normalize author data
function normalizeReview(v: any): VideoReview {
  let author = v.author || {};
  let name = author.name || "Reviewer";
  let handle = author.name || "";

  // Fix known seed inconsistency for Biz Riv
  if (name === "Biz Riv" || handle === "@louis42111" || v.userId === "louis42111@gmail.com") {
    name = "Biz Riv";
    handle = "@bizriv";
  }

  if (!handle) {
    handle = `@${name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}`;
  } else if (!handle.startsWith("@")) {
    handle = `@${handle}`;
  }

  return {
    ...v,
    author: {
      ...author,
      name,
      handle,
      avatar: author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=059669&color=fff&bold=true&size=128`,
      isVerified: author.isVerified ?? true
    }
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
      try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

      try {
        const res = await fetch("/api/videos/feed");
        if (res.ok && active) {
          const data = await res.json();
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
              return merged;
            });
            setIsLoading(false);
          }
        }
      } catch (e) {}
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
        try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

        const q = query(collection(db, "videoReviews"));
        const snapshot = await getDocs(q);
        if (!active) return;

        const fetched = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id,
            createdAtMs: data.createdAtMs || (data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()),
            likes: typeof data.likes === "number" ? Math.max(0, data.likes) : 0,
            bookmarksCount: typeof data.bookmarksCount === "number" ? Math.max(0, data.bookmarksCount) : 0,
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
              return existing ? { ...updatedV, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : updatedV;
            });

            const firestoreIds = new Set(filtered.map(v => v.id));
            const now = Date.now();
            prev.forEach(v => {
              if (!firestoreIds.has(v.id) && !deletedIds.includes(v.id)) {
                if (v.createdAtMs && (now - v.createdAtMs < 10000)) {
                  nextList.push(v);
                }
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
      try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

      const fetched = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAtMs: data.createdAtMs || (data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()),
          likes: typeof data.likes === "number" ? Math.max(0, data.likes) : 0,
          bookmarksCount: typeof data.bookmarksCount === "number" ? Math.max(0, data.bookmarksCount) : 0,
          commentsCount: typeof data.commentsCount === "number" ? data.commentsCount : (data.comments?.length || 0),
          comments: Array.isArray(data.comments) ? data.comments : []
        };
      }) as VideoReview[];

      fetched.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      const filtered = fetched.filter(v => !deletedIds.includes(v.id)).map(normalizeReview);

      setVideos((prev) => {
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
          return existing ? { ...updatedV, localVideoUrl: existing.localVideoUrl || v.localVideoUrl } : updatedV;
        });

        const firestoreIds = new Set(filtered.map(v => v.id));
        const now = Date.now();
        prev.forEach(v => {
          if (!firestoreIds.has(v.id) && !deletedIds.includes(v.id)) {
            if (v.createdAtMs && (now - v.createdAtMs < 10000)) {
              nextList.push(v);
            }
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

