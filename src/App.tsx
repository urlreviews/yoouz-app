import { useFeedPagination } from "./hooks/useFeedPagination";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Place, VideoReview, ReviewComment, NavSection, FeedSubTab, Club, CopoNotification, CopoMessage, VideoAuthor, UserProfile } from "./types";
import { isValidLatLng, sanitizeLatLng } from "./utils/geo";
import { CopoSidebar } from "./components/CopoSidebar";
import { CopoVideoPlayer } from "./components/CopoVideoPlayer";
// QR Widget intentionally removed per user request
import { CopoSearchView } from "./components/CopoSearchView";
import { CopoRecordReviewView } from "./components/CopoRecordReviewView";
import { CopoMobileSearchView } from "./components/CopoMobileSearchView";
import { GlobalUploadToast } from "./components/GlobalUploadToast";
import { CopoMapView } from "./components/CopoMapView";
import { CopoPlaceDrawer } from "./components/CopoPlaceDrawer";
import { CopoCreatorDrawer } from "./components/CopoCreatorDrawer";
import { CopoCommentsDrawer } from "./components/CopoCommentsDrawer";
import { CopoShareModal } from "./components/CopoShareModal";
import { CopoCreateModal } from "./components/CopoCreateModal";
import { CopoBusinessPricingModal } from "./components/CopoBusinessPricingModal";
import { CopoBusinessDashboardView } from "./components/CopoBusinessDashboardView";
import { CopoMoreView } from "./components/CopoMoreView";
import { CopoBookmarksView } from "./components/CopoBookmarksView";
import { CopoNotificationsView } from "./components/CopoNotificationsView";
import { CopoMessagesView } from "./components/CopoMessagesView";
import { CopoClubsView } from "./components/CopoClubsView";
import { CopoFollowingView } from "./components/CopoFollowingView";
import { CopoDiscoverView } from "./components/CopoDiscoverView";
import { CopoMobileNavDrawer } from "./components/CopoMobileNavDrawer";
import { CopoAdminPanel } from "./components/CopoAdminPanel";
import { CopoGoogleAuthModal, AuthIntent, CopoAuthPrompt } from "./components/CopoGoogleAuthModal";
import { CopoLegalModal } from "./components/CopoLegalModal";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { CopoReportModal, ReportTarget } from "./components/CopoReportModal";
import { prefetchVideo } from "./utils/videoPrefetcher";
import { auth, db, logOutUser, onAuthStateChanged, handleRedirectResult, handleFirestoreError, OperationType } from "./lib/firebase";
import { collection, getDocs, getDoc, onSnapshot, query, orderBy, deleteDoc, doc, where, setDoc, updateDoc } from "./lib/firebase";
import { cleanForFirestore } from "./utils/cleanFirestore";
import { getRawVideoBlobFromIndexedDB } from "./lib/videoStorage";
import { isPlaceReviewMatch, isAuthorMatch, synthesizePlaceFromReview, extractCleanDomain } from "./utils/placeUtils";
import { getCleanLogoUrl } from "./utils/logoUtils";
import { resolveVideoPosterUrl } from "./utils/videoUtils";
import {
  sendSocialNotification,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToChats,
  sendChatMessageToFirestore,
  markChatThreadAsRead,
  deleteChatThreadFromFirestore
} from "./lib/socialSync";

export function App() {
  // Fast local storage state setup without page reload
  useEffect(() => {
    // Preserved: Do not clear user videos or data
  }, []);

  // 1. Core State with LocalStorage Persistence
  const [places, setPlaces] = useState<Place[]>([]);

  const { videos, setVideos, isLoading: isLoadingVideos, loadMore: loadMoreVideos, hasMore } = useFeedPagination();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [notifications, setNotifications] = useState<CopoNotification[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<CopoMessage[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);

  const [activeThreadId, setActiveThreadId] = useState<string>("");

  // 2. Navigation & Active Tab States
  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    // Immediate sync from URL on boot to prevent flash of home
    try {
      const pathname = window.location.pathname;
      if (pathname === "/admin" || pathname.startsWith("/admin")) return "admin";
      if (pathname === "/business") return "business";
      if (pathname === "/discover") return "discover";
      if (pathname === "/following") return "following";
      if (pathname === "/search") return "search";
      if (pathname === "/map") return "map";
      if (pathname === "/notifications") return "notifications";
      if (pathname === "/messages") return "messages";
      if (pathname === "/bookmarks") return "bookmarks";
      if (pathname === "/record_review") return "record_review";
      if (pathname === "/clubs") return "clubs";
      if (pathname.startsWith("/profile/") || pathname.startsWith("/@")) return "profile"; // actually, if it's someone else's profile, it might open a drawer, not just set section to profile. If it's my profile, it's 'profile'. But let's just let syncFromUrl handle the drawer logic, and we return 'home' or 'discover' as base.
      
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const sectionParam = params.get("section") || (hash.startsWith("#/") && !hash.startsWith("#/place/") && !hash.startsWith("#/creator/") && !hash.startsWith("#/video/") ? hash.replace("#/", "") : null);
      if (sectionParam && ["discover", "map", "notifications", "messages", "bookmarks", "profile", "admin", "business", "search", "record_review", "following", "clubs"].includes(sectionParam)) {
        return sectionParam as NavSection;
      }
    } catch (e) {}
    return "home";
  });
  const [activeSubTab, setActiveSubTab] = useState<FeedSubTab>("discover");
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [searchResetKey, setSearchResetKey] = useState<number>(0);
  const [recordReviewResetKey, setRecordReviewResetKey] = useState<number>(0);

  // 3. Drawers & Modals States
  const previousSectionRef = useRef<NavSection | null>(null);
  const [selectedPlaceIdForDrawer, setSelectedPlaceIdForDrawer] = useState<string | null>(null);
  const [selectedAuthorForDrawer, setSelectedAuthorForDrawer] = useState<VideoAuthor | null>(null);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);
  const [placeReviewSort, setPlaceReviewSort] = useState<"latest" | "oldest" | "highest" | "lowest" | "popular">("latest");
  const [placeStarFilter, setPlaceStarFilter] = useState<number | "all">("all");
  const [profileVideoSort, setProfileVideoSort] = useState<"latest" | "highest" | "lowest" | "oldest" | "popular">("latest");
  const [profileVideoFilter, setProfileVideoFilter] = useState<number | "all">("all");
  const [activeCommentVideo, setActiveCommentVideo] = useState<VideoReview | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<VideoReview | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [activeReportTarget, setActiveReportTarget] = useState<ReportTarget | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isMobileNavDrawerOpen, setIsMobileNavDrawerOpen] = useState<boolean>(false);
  const [hiddenVideoIds, setHiddenVideoIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("yoouz_hidden_videos") || "[]");
    } catch {
      return [];
    }
  });
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("yoouz_blocked_users") || "[]");
    } catch {
      return [];
    }
  });

  const handleBlockUser = (userId: string, userName?: string) => {
    setBlockedUserIds((prev) => {
      const cleanId = (userId || "").toLowerCase().trim().replace(/^@/, "");
      const cleanName = (userName || "").toLowerCase().trim();
      const toAdd = [cleanId, cleanName].filter(Boolean);
      const next = Array.from(new Set([...prev, ...toAdd]));
      try {
        localStorage.setItem("yoouz_blocked_users", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleUnblockUser = (userId: string) => {
    setBlockedUserIds((prev) => {
      const cleanId = (userId || "").toLowerCase().trim().replace(/^@/, "");
      const next = prev.filter((id) => id !== cleanId && !cleanId.includes(id));
      try {
        localStorage.setItem("yoouz_blocked_users", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>('general');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<"terms" | "privacy">("terms");

  const handleOpenLegal = (tab: "terms" | "privacy" = "terms") => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };
  const [preselectedPlaceForRecording, setPreselectedPlaceForRecording] = useState<Place | null>(null);
  const [businessClaimTargetPlace, setBusinessClaimTargetPlace] = useState<Place | null>(null);
  const [businessInitialMode, setBusinessInitialMode] = useState<'signin' | 'claim' | 'demo'>('signin');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<boolean>(false);

  // Background prefetch first few videos for instant playback when entering feed
  useEffect(() => {
    if (videos && videos.length > 0) {
      videos.slice(0, 3).forEach(v => {
        if (v.videoUrl) prefetchVideo(v.videoUrl);
      });
    }
  }, [videos]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("copo_user_profile");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  });

  const videosRef = useRef(videos);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Parse URL on initial load and handle browser back/forward navigation
  useEffect(() => {
    const syncFromUrl = () => {
      try {
        if (window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin")) {
          setActiveSection("admin");
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const pathname = window.location.pathname;

        let placeParam = params.get("place") || params.get("p") || params.get("business") || (hash.startsWith("#/place/") ? hash.replace("#/place/", "") : null);
        let creatorParam = params.get("creator") || params.get("c") || params.get("user") || params.get("u") || (hash.startsWith("#/creator/") ? hash.replace("#/creator/", "") : null);
        let videoParam = params.get("video") || params.get("v") || (hash.startsWith("#/video/") ? hash.replace("#/video/", "") : null);
        let sectionParam = params.get("section") || (hash.startsWith("#/") && !hash.startsWith("#/place/") && !hash.startsWith("#/creator/") && !hash.startsWith("#/video/") ? hash.replace("#/", "") : null);

        // Pathname parsing for elite SEO routes
        if (!videoParam) {
          const vMatch = pathname.match(/^\/(v|review)\/([^\/]+)/);
          if (vMatch) videoParam = vMatch[2];
        }
        if (!creatorParam) {
          const cMatch = pathname.match(/^\/@([^\/]+)/) || pathname.match(/^\/profile\/([^\/]+)/);
          if (cMatch) {
            creatorParam = cMatch[1];
          }
        }
        if (!placeParam) {
          const pMatch = pathname.match(/^\/place\/([^\/]+)/) || pathname.match(/^\/business\/([^\/]+)/);
          if (pMatch) placeParam = pMatch[1];
        }
        if (!sectionParam) {
          if (pathname === "/discover") sectionParam = "discover";
          if (pathname === "/following") sectionParam = "following";
          if (pathname === "/search") sectionParam = "search";
          if (pathname === "/map") sectionParam = "map";
          if (pathname === "/notifications") sectionParam = "notifications";
          if (pathname === "/messages") sectionParam = "messages";
          if (pathname === "/bookmarks") sectionParam = "bookmarks";
          if (pathname === "/clubs") sectionParam = "clubs";
          if (pathname === "/record_review") sectionParam = "record_review";
        }

        if (placeParam) {
          const cleanPlaceId = decodeURIComponent(placeParam);
          setSelectedPlaceIdForDrawer(cleanPlaceId);
          setSelectedAuthorForDrawer(null);
          // If we are coming from a deep link or popstate, don't force home if we were elsewhere
          // But usually Place Drawer is viewed on top of home
        } else if (creatorParam) {
          const rawParam = decodeURIComponent(creatorParam).replace(/^@+/, "").toLowerCase().trim();
          const matchingVid = videosRef.current.find((v) => {
            if (!v.author) return false;
            const h = (v.author.name || "").replace(/^@+/, "").toLowerCase().trim();
            const n = (v.author.name || "")
              .toLowerCase()
              .trim()
              .replace(/^@+/, "")
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9_-]/g, "")
              .replace(/-+/g, "-");
            return h === rawParam || n === rawParam;
          });
          const authorObj: VideoAuthor = matchingVid?.author || {
            name: rawParam.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            //handle: rawParam,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawParam}`,
            isVerified: true,
            isFollowed: false
          };
          setSelectedAuthorForDrawer(authorObj);
          setSelectedPlaceIdForDrawer(null);
        } else {
          setSelectedPlaceIdForDrawer(null);
          setSelectedAuthorForDrawer(null);
          if (
            sectionParam &&
            ["discover", "map", "notifications", "messages", "bookmarks", "profile", "admin", "search", "record_review", "following", "clubs"].includes(sectionParam)
          ) {
            setActiveSection(sectionParam as NavSection);
          }
        }

        if (videoParam) {
          const targetVidId = decodeURIComponent(videoParam);
          const idx = videosRef.current.findIndex((v) => v.id === targetVidId);
          if (idx !== -1) {
            setCurrentVideoIndex(idx);
          } else if (db) {
            getDoc(doc(db, "videoReviews", targetVidId)).then((snap) => {
              if (snap.exists()) {
                const vidData = snap.data() as VideoReview;
                setVideos((prev) => {
                  if (prev.some((v) => v.id === vidData.id)) return prev;
                  return [{ ...vidData, id: snap.id }, ...prev];
                });
                setCurrentVideoIndex(0);
              }
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("URL sync warning:", err);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  const handleAdminDeleteVideo = async (id: string) => {
    // 1. Instantly remove from local videos state
    setVideos(prev => {
      const updated = prev.filter(v => v.id !== id);
      try {
        // Save to deleted videos list to prevent re-merging from any cache
        const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
        let deletedVideos: string[] = [];
        try { deletedVideos = JSON.parse(deletedStr); } catch(e){}
        if (!deletedVideos.includes(id)) {
          deletedVideos.push(id);
          localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedVideos));
        }
        const cached = localStorage.getItem("yoouz_cached_videos_v16");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            localStorage.setItem("yoouz_cached_videos_v16", JSON.stringify(parsed.filter(v => v.id !== id)));
          }
        }
      } catch (e) {}
      return updated;
    });
    
    // 2. Call backend admin API for guaranteed deletion (preserves user accounts 100%)
    try {
      fetch("/api/admin/videos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id })
      }).catch((e) => console.warn("Admin backend video delete notice:", e));
    } catch (e) {}

    // 3. Delete directly from Firestore
    try {
      if (db) {
        deleteDoc(doc(db, "videoReviews", id)).catch(() => {});
        deleteDoc(doc(db, "videos", id)).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to delete video from Firestore:", err);
    }
  };

  const handleAdminBulkDeleteVideos = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    // 1. Instantly remove from local videos state
    setVideos(prev => {
      const updated = prev.filter(v => !ids.includes(v.id));
      try {
        // Save deleted video IDs to prevent re-merging
        const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
        let deletedVideos: string[] = [];
        try { deletedVideos = JSON.parse(deletedStr); } catch(e){}
        ids.forEach(id => {
          if (!deletedVideos.includes(id)) {
            deletedVideos.push(id);
          }
        });
        localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedVideos));
        
        const cached = localStorage.getItem("yoouz_cached_videos_v16");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            localStorage.setItem("yoouz_cached_videos_v16", JSON.stringify(parsed.filter(v => !ids.includes(v.id))));
          }
        }
      } catch (e) {}
      return updated;
    });
    
    // 2. Call backend admin API
    try {
      fetch("/api/admin/videos/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: ids })
      }).catch((e) => console.warn("Admin backend bulk delete notice:", e));
    } catch (e) {}

    // 3. Delete directly from Firestore
    try {
      if (db) {
        await Promise.all(ids.map(id => {
          deleteDoc(doc(db, "videoReviews", id)).catch(() => {});
          return deleteDoc(doc(db, "videos", id)).catch(() => {});
        }));
      }
    } catch (err) {
      console.warn("Failed to bulk delete videos from Firestore:", err);
    }
  };

  const handleAdminPurgeAllVideos = async () => {
    // 1. Instantly clear local videos state
    setVideos([]);
    try {
      localStorage.removeItem("copo_videos");
      localStorage.removeItem("copo_deleted_videos");
      localStorage.removeItem("yoouz_cached_videos_v16");
    } catch (e) {}

    // 2. Clear backend uploads on server
    try {
      fetch("/api/admin/videos/purge-all", { method: "POST" }).catch(() => {});
    } catch (e) {}

    // 3. Purge all videoReviews and videos from Firestore
    try {
      if (db) {
        // Fetch directly from Firestore without relying on local state
        const snap = await getDocs(collection(db, "videoReviews"));
        const deletes = snap.docs.map((d) => deleteDoc(doc(db, "videoReviews", d.id)).catch(console.error));
        await Promise.all(deletes);

        const vSnap = await getDocs(collection(db, "videos"));
        const vDeletes = vSnap.docs.map((d) => deleteDoc(doc(db, "videos", d.id)).catch(console.error));
        await Promise.all(vDeletes);
      }
    } catch (err) {
      console.warn("Failed to purge video reviews from Firestore:", err);
    }
  };

  const handleAdminDeletePlace = (id: string) => {
    setPlaces(prev => {
      const updated = prev.filter(p => p.id !== id);
      try {
        // Keep track of deleted place so it doesn't merge back from mock data
        const deletedStr = localStorage.getItem("copo_deleted_places") || "[]";
        let deletedPlaces = [];
        try { deletedPlaces = JSON.parse(deletedStr); } catch(e){}
        if (!deletedPlaces.includes(id)) {
          deletedPlaces.push(id);
          localStorage.setItem("copo_deleted_places", JSON.stringify(deletedPlaces));
        }
      } catch (e) {}
      return updated;
    });
  };

  const handleAdminBulkDeletePlaces = async (ids: string[]) => {
    setPlaces(prev => {
      const updated = prev.filter(p => !ids.includes(p.id));
      try {
        const deletedStr = localStorage.getItem("copo_deleted_places") || "[]";
        let deletedPlaces: string[] = [];
        try { deletedPlaces = JSON.parse(deletedStr); } catch(e){}
        ids.forEach(id => {
          if (!deletedPlaces.includes(id)) {
            deletedPlaces.push(id);
          }
        });
        localStorage.setItem("copo_deleted_places", JSON.stringify(deletedPlaces));
      } catch (e) {}
      return updated;
    });
    
    try {
      if (db) {
        await Promise.all(ids.map(id => deleteDoc(doc(db, "places", id))));
      }
    } catch (err) {
      console.warn("Failed to bulk delete places from Firestore:", err);
    }
  };

  // Synchronize URL: Keep it clean (root only) as requested by the user.
  // Synchronize App State to URL (True Client-Side Routing for SEO)
  useEffect(() => {
    try {
      let path = "/";
      let title = "Yoouz - Real Video Reviews by Real People | Authentic Business Reviews";

      if (selectedPlaceIdForDrawer) {
        path = `/place/${selectedPlaceIdForDrawer}`;
        const place = places.find(p => p.id === selectedPlaceIdForDrawer);
        title = place ? `${place.name} - Real Video Reviews & Ratings | Yoouz` : "Business Profile | Yoouz";
      } else if (selectedAuthorForDrawer) {
        const cleanSlug = (selectedAuthorForDrawer.name || selectedAuthorForDrawer.name || "reviewer")
          .toLowerCase()
          .trim()
          .replace(/^@+/, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9_-]/g, "")
          .replace(/-+/g, "-");
        path = `/@${cleanSlug}`;
        title = `${selectedAuthorForDrawer.name} (@${cleanSlug}) - Video Reviews | Yoouz`;
      } else if (activeSection === "home") {
        path = "/";
        title = "Yoouz - Real Video Reviews by Real People | Authentic Business Reviews";
      } else if (activeSection === "search") {
        path = "/search";
        title = "Search & Explore Real Video Reviews | Yoouz";
      } else if (activeSection === "discover") {
        path = "/discover";
        title = "Discover Trending Places & Video Reviews | Yoouz";
      } else if (activeSection === "business") {
        path = "/business";
        title = "Yoouz for Business - Verified Customer Video Reviews & Feedback";
      } else if (activeSection === "following") {
        path = "/following";
        title = "Following Feed - Creator Video Reviews | Yoouz";
      } else if (activeSection === "bookmarks") {
        path = "/bookmarks";
        title = "Saved Video Reviews & Bookmarks | Yoouz";
      } else if (activeSection === "messages") {
        path = "/messages";
        title = "Direct Messages | Yoouz";
      } else if (activeSection === "notifications") {
        path = "/notifications";
        title = "Notifications | Yoouz";
      } else if (activeSection === "more") {
        path = "/more";
        title = "Settings & Community | Yoouz";
      } else if (activeSection === "profile" && currentUser) {
        const cleanSlug = (currentUser.name || currentUser.name || currentUser.email?.split('@')[0] || "user")
          .toLowerCase()
          .trim()
          .replace(/^@+/, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9_-]/g, "")
          .replace(/-+/g, "-");
        path = `/@${cleanSlug}`;
        title = `${currentUser.name || "My Profile"} | Yoouz`;
      } else {
        path = `/${activeSection}`;
        title = `${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} | Yoouz`;
      }

      // Update Document Meta Title for SEO
      document.title = title;

      // Update URL if it differs from current pathname (excluding search query string to avoid infinite loops if it exists)
      if (window.location.pathname !== path) {
        const isCurrentlyVideo = window.location.pathname.startsWith("/v/") || window.location.pathname.includes("/video/");
        const isGoingToVideo = path.startsWith("/v/") || path.includes("/video/");
        
        if (isCurrentlyVideo && isGoingToVideo) {
          // Use replaceState while scrolling feed to avoid filling up the history stack
          window.history.replaceState({}, "", path);
        } else {
          // Use pushState for actual navigation between different types of views (e.g., Profile -> Video)
          window.history.pushState({}, "", path);
        }
      }
    } catch (err) {
      console.warn("URL sync warning:", err);
    }
  }, [selectedPlaceIdForDrawer, selectedAuthorForDrawer, activeSection, currentVideoIndex, videos, places, currentUser]);

  // Firebase Auth state listener and multi-tab reactive sync
  useEffect(() => {
    // 1. Process Google redirect result if returning from full-page redirect
    handleRedirectResult().then((redirectedUser) => {
      if (redirectedUser) {
        setCurrentUser(redirectedUser);
      }
    });

    // 2. Immediate custom auth event listener
    const handleCustomAuth = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      } else if (e.detail === null) {
        setCurrentUser(null);
      }
    };
    window.addEventListener("copo_auth_changed", handleCustomAuth);

    // 3. Multi-tab storage synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "copo_user_profile") {
        if (e.newValue) {
          try {
            setCurrentUser(JSON.parse(e.newValue));
          } catch (err) {}
        } else {
          setCurrentUser(null);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 4. Firebase onAuthStateChanged listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let savedProfile: Partial<UserProfile> = {};
        try {
          const str = localStorage.getItem("copo_user_profile");
          if (str) savedProfile = JSON.parse(str);
        } catch (e) {}

        // Use authentic Google photoURL or clean initials avatar
        let validAvatar = user.photoURL || savedProfile.avatar;
        if (
          !validAvatar ||
          validAvatar.includes("unsplash.com") ||
          validAvatar.includes("photo-1534528741775") ||
          validAvatar.includes("photo-1535713875002")
        ) {
          validAvatar =
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.displayName || user.email?.split("@")[0] || "User"
            )}&background=1a73e8&color=fff&bold=true&size=128`;
        }

        const profileObj: UserProfile = {
          name: user.displayName || savedProfile.name || user.email?.split("@")[0] || "Google User",
          email: user.email || savedProfile.email || "",
          avatar: validAvatar,
          bio: savedProfile.bio || "Food explorer linking real businesses and websites with authentic 60-second video reviews.",
          memberSince: savedProfile.memberSince || "August 2026"
        };

        setCurrentUser(profileObj);
        try {
          localStorage.setItem("copo_user_profile", JSON.stringify(profileObj));
        } catch (e) {}

        // Try reading custom profile data from Firestore if available
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data) {
              let finalLocation = data.location || savedProfile.location || "";
              
              const updatedProfile: UserProfile = {
                ...profileObj,
                name: data.name || profileObj.name,
                bio: data.bio || profileObj.bio,
                avatar: data.avatar || profileObj.avatar,
                location: finalLocation,
              };
              setCurrentUser(updatedProfile);
              try {
                localStorage.setItem("copo_user_profile", JSON.stringify(updatedProfile));
                
                // Sync follows from Firestore to localStorage
                let fAuthors = [];
                let fPlaces = [];
                if (data.followedAuthors && Array.isArray(data.followedAuthors)) {
                  fAuthors = data.followedAuthors;
                  localStorage.setItem("copo_followed_authors", JSON.stringify(fAuthors));
                }
                if (data.followedPlaces && Array.isArray(data.followedPlaces)) {
                  fPlaces = data.followedPlaces;
                  localStorage.setItem("copo_followed_places", JSON.stringify(fPlaces));
                }
                
                // Instantly re-hydrate existing places and videos with the fresh follow state
                setPlaces(prev => prev.map(p => ({ ...p, isFollowed: fPlaces.includes(p.id) })));
                setVideos(prev => prev.map(v => ({ ...v, author: { ...v.author, isFollowed: fAuthors.includes(v.author.name) } })));
                
              } catch (e) {}

              // If the existing user does not have a location set yet, backfill it via Geo-IP!
              if (!finalLocation) {
                try {
                  const res = await fetch("https://freeipapi.com/api/json");
                  if (res.ok) {
                    const geoData = await res.json();
                    if (geoData && geoData.cityName && geoData.countryName) {
                      const city = geoData.cityName.trim();
                      let country = geoData.countryName.trim();
                      if (country === "United States" && geoData.regionName) {
                        const stateMap: Record<string, string> = {
                          "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
                          "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
                          "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
                          "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
                          "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
                          "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
                          "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
                          "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
                          "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
                          "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
                        };
                        country = stateMap[geoData.regionName] || geoData.regionName;
                      }
                      const detectedLocation = `${city}, ${country}`;
                      if (detectedLocation) {
                        const profileWithLocation = {
                          ...updatedProfile,
                          location: detectedLocation
                        };
                        setCurrentUser(profileWithLocation);
                        localStorage.setItem("copo_user_profile", JSON.stringify(profileWithLocation));
                        
                        await setDoc(doc(db, "users", user.uid), {
                          location: detectedLocation
                        }, { merge: true });
                      }
                    }
                  }
                } catch (geoErr) {
                  console.warn("Backfilling IP geo-detection failed for existing user:", geoErr);
                }
              }
            }
          } else {
            // First signup! Perform lightweight automatic IP geolocation lookup
            try {
              const res = await fetch("https://freeipapi.com/api/json");
              let detectedLocation = "";
              if (res.ok) {
                const geoData = await res.json();
                if (geoData && geoData.cityName && geoData.countryName) {
                  const city = geoData.cityName.trim();
                  let country = geoData.countryName.trim();
                  if (country === "United States" && geoData.regionName) {
                    const stateMap: Record<string, string> = {
                      "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
                      "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
                      "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
                      "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
                      "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
                      "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
                      "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
                      "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
                      "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
                      "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
                    };
                    country = stateMap[geoData.regionName] || geoData.regionName;
                  }
                  detectedLocation = `${city}, ${country}`;
                }
              }
              
              const signupProfile: UserProfile = {
                ...profileObj,
                location: detectedLocation || ""
              };
              setCurrentUser(signupProfile);
              localStorage.setItem("copo_user_profile", JSON.stringify(signupProfile));
              
              // Save user doc to Firestore with geo-location
              await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: signupProfile.name,
                email: signupProfile.email,
                avatar: signupProfile.avatar,
                bio: signupProfile.bio,
                location: detectedLocation || "",
                createdAt: Date.now(),
                lastLogin: Date.now()
              }, { merge: true });
            } catch (geoErr) {
              console.warn("First signup IP geo-detection failed:", geoErr);
              // Fallback to saving standard user document without location
              await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: profileObj.name,
                email: profileObj.email,
                avatar: profileObj.avatar,
                bio: profileObj.bio,
                createdAt: Date.now(),
                lastLogin: Date.now()
              }, { merge: true });
            }
          }
        } catch (err) {}
      } else {
        // If auth state is temporarily null (e.g. initial load or storage partitioning), preserve cached session if present
        const storedStr = localStorage.getItem("copo_user_profile");
        if (storedStr) {
          try {
            const parsed = JSON.parse(storedStr);
            if (parsed && parsed.email) {
              setCurrentUser(parsed);
              return;
            }
          } catch (e) {}
        }
        setCurrentUser(null);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("copo_auth_changed", handleCustomAuth);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Real-time Firestore sync for Notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications(currentUser, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time Firestore sync for Direct Messages & Chats
  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToChats(currentUser, (threads) => {
      setMessages(threads);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time synchronization of all registered users across the platform
  useEffect(() => {
    let isCancelled = false;

    const fetchAllUsers = async () => {
      try {
        const res = await fetch("/api/nosql/users");
        if (res.ok) {
          const list = await res.json();
          if (!isCancelled && Array.isArray(list)) {
            setAllRegisteredUsers(list.filter((u: any) => u.name && u.name !== "Registered User" && u.name !== "Reviewer" && u.email && !u.email.includes("undefined")));
          }
        }
      } catch (e) {}
    };

    fetchAllUsers();
    const interval = setInterval(fetchAllUsers, 4000);

    if (db) {
      try {
        const usersCol = collection(db, "users");
        const unsubscribe = onSnapshot(usersCol, (snapshot) => {
          if (!isCancelled && snapshot && snapshot.docs) {
            const dbUsers: any[] = [];
            snapshot.forEach((docSnap) => {
              dbUsers.push({ id: docSnap.id, ...docSnap.data() });
            });
            if (dbUsers.length > 0) {
              setAllRegisteredUsers((prev) => {
                const map = new Map<string, any>();
                prev.forEach((u) => map.set((u.uid || u.id || u.email || u.name || "").toLowerCase(), u));
                dbUsers.forEach((u) => map.set((u.uid || u.id || u.email || u.name || "").toLowerCase(), u));
                return Array.from(map.values()).filter((u: any) => u.name && u.name !== "Registered User" && u.name !== "Reviewer" && u.email && !u.email.includes("undefined"));
              });
            }
          }
        }, () => {});

        return () => {
          isCancelled = true;
          clearInterval(interval);
          unsubscribe();
        };
      } catch (err) {}
    }

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleUpdateProfile = (updated: { name?: string; bio?: string; avatar?: string; location?: string }) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const nextProfile: UserProfile = {
        ...prev,
        name: updated.name !== undefined ? updated.name : prev.name,
        bio: updated.bio !== undefined ? updated.bio : prev.bio,
        avatar: updated.avatar !== undefined ? updated.avatar : prev.avatar,
        location: updated.location !== undefined ? updated.location : prev.location
      };
      try {
        localStorage.setItem("copo_user_profile", JSON.stringify(nextProfile));
        if (auth.currentUser && db) {
          setDoc(doc(db, "users", auth.currentUser.uid), {
            uid: auth.currentUser.uid,
            name: nextProfile.name,
            email: nextProfile.email,
            avatar: nextProfile.avatar,
            bio: nextProfile.bio,
            location: nextProfile.location || "",
            lastLogin: Date.now()
          }, { merge: true }).catch((err) => {
            console.warn("Failed to update user profile in Firestore:", err);
          });
        }
      } catch (e) {}
      return nextProfile;
    });
  };

  const handleDeleteProfile = async () => {
    if (auth.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        if (db) {
          await deleteDoc(doc(db, "users", uid));
        }
      } catch (err) {
        console.warn("Failed to delete user document from Firestore:", err);
      }
    }

    try {
      await logOutUser();
    } catch (e) {
      console.warn("Failed to log out user during profile deletion:", e);
    }

    setCurrentUser(null);
    try {
      localStorage.removeItem("copo_user_profile");
    } catch (e) {}

    setDeleteSuccessToast(true);
    setTimeout(() => {
      setDeleteSuccessToast(false);
    }, 5000);

    setActiveSection("home");
  };

  const handleDeleteUserVideo = async (vidId: string) => {
    try {
      if (db) {
        await deleteDoc(doc(db, "videoReviews", vidId)).catch(() => {});
        await deleteDoc(doc(db, "videos", vidId)).catch(() => {});
      }
      
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      const deletedList = JSON.parse(deletedStr);
      if (!deletedList.includes(vidId)) {
        deletedList.push(vidId);
        localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedList));
      }
      
      setVideos(prev => prev.filter(v => v.id !== vidId));
    } catch(e) {
      console.warn("Delete video error:", e);
    }
  };

  const handleUpdateVideoReview = async (
    videoId: string,
    updates: { rating?: number; caption?: string; dishOrItem?: string; tags?: string[] }
  ) => {
    let targetPlaceId: string | null = null;
    let targetPlaceName: string | null = null;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          targetPlaceId = v.placeId;
          targetPlaceName = v.placeName;
          return {
            ...v,
            rating: updates.rating !== undefined ? updates.rating : v.rating,
            placeRating: updates.rating !== undefined ? updates.rating : v.placeRating,
            caption: updates.caption !== undefined ? updates.caption : v.caption,
            dishOrItem: updates.dishOrItem !== undefined ? updates.dishOrItem : v.dishOrItem,
            tags: updates.tags !== undefined ? updates.tags : v.tags
          };
        }
        return v;
      })
    );

    // If rating was changed, recalculate the place average rating across all its videos
    if (updates.rating !== undefined) {
      setPlaces((prev) =>
        prev.map((p) => {
          if (
            (targetPlaceId && p.id === targetPlaceId) ||
            (targetPlaceName && (p.name || "").toLowerCase().trim() === targetPlaceName.toLowerCase().trim())
          ) {
            const updatedRating = updates.rating!;
            const allPlaceReviews = videos.map((v) =>
              v.id === videoId ? { ...v, rating: updatedRating } : v
            ).filter((v) => isPlaceReviewMatch(v, p));

            if (allPlaceReviews.length > 0) {
              const sum = allPlaceReviews.reduce((acc, r) => acc + r.rating, 0);
              const avg = Number((sum / allPlaceReviews.length).toFixed(1));
              return {
                ...p,
                rating: avg
              };
            }
          }
          return p;
        })
      );
    }

    // Persist to Firestore: videoReviews and legacy videos collections
    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        await setDoc(
          vidRef,
          {
            ...(updates.rating !== undefined && { rating: updates.rating, placeRating: updates.rating }),
            ...(updates.caption !== undefined && { caption: updates.caption }),
            ...(updates.dishOrItem !== undefined && { dishOrItem: updates.dishOrItem }),
            ...(updates.tags !== undefined && { tags: updates.tags }),
            updatedAt: Date.now()
          },
          { merge: true }
        );

        const legacyRef = doc(db, "videos", videoId);
        await setDoc(
          legacyRef,
          {
            ...(updates.rating !== undefined && { rating: updates.rating }),
            ...(updates.caption !== undefined && { caption: updates.caption }),
            updatedAt: Date.now()
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch (err) {
      console.warn("Firestore update video rating error:", err);
    }
  };

  const handleStartChat = async (senderId: string, senderName: string, senderAvatar: string) => {
    // Check if target recipient is an unclaimed business
    const matchingPlace = places.find(
      (p) =>
        p.id === senderId ||
        (p.name && senderName && p.name.toLowerCase() === senderName.toLowerCase())
    );
    if (matchingPlace) {
      const isPlaceClaimed = Boolean(
        matchingPlace.isClaimed ||
        (matchingPlace.claimedByEmail && matchingPlace.claimedByEmail.trim() !== "") ||
        matchingPlace.subscriptionPlan === "pro" ||
        matchingPlace.subscriptionPlan === "premium"
      );
      if (!isPlaceClaimed) {
        setSelectedPlaceIdForDrawer(matchingPlace.id);
        setActiveSection("home");
        return;
      }
    }

    const existingThread = messages.find(
      (m) =>
        m.senderId === senderId ||
        (m.senderName && senderName && m.senderName.toLowerCase() === senderName.toLowerCase())
    );

    setActiveSection("messages");
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);

    if (existingThread) {
      setActiveThreadId(existingThread.id);
      return;
    }

    const newThreadId = `thread_${Date.now()}`;
    const newThread: CopoMessage = {
      id: newThreadId,
      senderId,
      senderName,
      senderAvatar,
      lastMessage: "",
      timestamp: "Just now",
      createdAtMs: Date.now(),
      unreadCount: 0,
      history: []
    };

    const updated = [newThread, ...messages];
    setMessages(updated);
    setActiveThreadId(newThreadId);
  };

  // Helper fallback URLs
  function defFallbackUrls(id: string) {
    return [];
  }

  // Places sync from Firestore with live subscription & auto-synthesis from reviews
  useEffect(() => {
    try {
      const deletedStr = localStorage.getItem("copo_deleted_places") || "[]";
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

      // Initial base
      setPlaces((prev) => {
        const map = new Map<string, Place>();
        prev.forEach(p => map.set(p.id, p));
        return Array.from(map.values()).filter((u: any) => u.name && u.name !== "Registered User" && u.name !== "Reviewer" && u.email && !u.email.includes("undefined"));
      });

      if (!db) return;
      const placesRef = collection(db, "places");
      const unsubscribe = onSnapshot(placesRef, (snapshot) => {
        const list: Place[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Place);
        });

        const filtered = list.filter(p => !deletedIds.includes(p.id));
        setPlaces((prev) => {
          let followedPlaces = [];
          try { followedPlaces = JSON.parse(localStorage.getItem("copo_followed_places") || "[]"); } catch(e){}

          const map = new Map<string, Place>();
          prev.forEach(p => map.set(p.id, p));
          filtered.forEach(p => {
             const existing = map.get(p.id);
             const isFollowed = followedPlaces.includes(p.id);
             map.set(p.id, { ...existing, ...p, isFollowed });
          });
          return Array.from(map.values()).filter((u: any) => u.name && u.name !== "Registered User" && u.name !== "Reviewer" && u.email && !u.email.includes("undefined"));
        });
      }, (err) => {
        console.warn("Places snapshot notice:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Places sync error:", e);
    }
  }, []);

  // Auto-synthesize places from any published video review
  useEffect(() => {
    if (videos.length === 0) return;
    setPlaces((prev) => {
      let modified = false;
      const next = [...prev];
      videos.forEach((v) => {
        const exists = next.some((p) => isPlaceReviewMatch(v, p));
        if (!exists) {
          const newPlace = synthesizePlaceFromReview(v, next);
          next.push(newPlace);
          modified = true;
        }
      });
      return modified ? next : prev;
    });
  }, [videos]);

  // Sync preferences to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("copo_clubs", JSON.stringify(clubs));
    } catch (e) { console.warn(e); }
  }, [clubs]);

  useEffect(() => {
    try {
      localStorage.setItem("copo_notifications", JSON.stringify(notifications));
    } catch (e) { console.warn(e); }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem("copo_saved_place_ids", JSON.stringify(savedPlaceIds));
    } catch (e) { console.warn(e); }
  }, [savedPlaceIds]);

  // Preselected drawer place object
  const drawerPlace = useMemo(() => {
    if (!selectedPlaceIdForDrawer) return null;
    const searchId = selectedPlaceIdForDrawer;
    let found = places.find(
      (p) =>
        p.id === searchId ||
        isPlaceReviewMatch({ placeId: p.id, placeName: p.name, placeWebsite: p.website } as VideoReview, searchId)
    );
    if (!found) {
      const matchingVideo = videos.find(
        (v) =>
          v.placeId === searchId ||
          v.id === searchId ||
          isPlaceReviewMatch(v, searchId)
      );
      if (matchingVideo) {
        found = synthesizePlaceFromReview(matchingVideo, places);
      } else {
        const domain = extractCleanDomain(searchId);
        found = {
          id: searchId,
          name: domain || searchId,
          category: "Establishment",
          categoryType: "all",
          address: domain ? "Online / Verified" : "Google Maps Location",
          city: "Online",
          rating: 5.0,
          totalReviews: 1,
          ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
          photos: [],
          openingHours: "",
          isOpen: undefined,
          phone: "",
          website: domain ? `https://${domain}` : "",
          priceRange: "$",
          plusCode: "",
          description: "Verified Yoouz location review destination.",
          popularKeywords: [{ tag: "Verified", count: 1 }],
          amenities: ["Wheelchair accessible entrance"],
          topDishes: [],
          lat: 37.7749,
          lng: -122.4194,
          bannerUrl: "",
          avatarUrl: domain ? getCleanLogoUrl(null, domain) || "" : "",
          isSavedToProfile: true
        } as Place;
      }
    }
    return found;
  }, [places, selectedPlaceIdForDrawer, videos]);

  // Fullscreen Feed Context for TikTok-style scroll through specific Creator or Business videos
  const [fullscreenFeedContext, setFullscreenFeedContext] = useState<{
    type: "creator" | "place" | "profile";
    id?: string;
    title: string;
    authorData?: VideoAuthor | null;
    placeData?: Place | null;
  } | null>(null);

  // Determine if in Business/Place view or Creator view
  const isPlaceView = Boolean(selectedPlaceIdForDrawer && drawerPlace);
  const isCreatorView = Boolean(selectedAuthorForDrawer);

  const currentFeedContextKey = useMemo(() => {
    if (isPlaceView) return `place_${drawerPlace?.id || selectedPlaceIdForDrawer}`;
    if (isCreatorView) return `creator_${selectedAuthorForDrawer?.name || selectedAuthorForDrawer?.name}`;
    if (fullscreenFeedContext) return `fullscreen_${fullscreenFeedContext.type}_${fullscreenFeedContext.id}`;
    return `section_${activeSection}_${activeSubTab}`;
  }, [isPlaceView, drawerPlace, selectedPlaceIdForDrawer, isCreatorView, selectedAuthorForDrawer, fullscreenFeedContext, activeSection, activeSubTab]);

  const userVideos = useMemo(() => {
    let filtered = videos;
    if (!currentUser) {
      // If user isn't explicitly signed in, show reviews created in this session or marked 'me'
      filtered = videos.filter((v) => v.author?.name === "me" || v.userId === "me" || v.id.startsWith("rev-"));
    } else {
      filtered = videos.filter((v) => {
        // Robust author match using placeUtils
        if (isAuthorMatch(v, currentUser)) return true;
        // Author handle = "me"
        if (v.author?.name === "me" || v.userId === "me") return true;
        // User recorded video review check
        if (v.id.startsWith("rev-")) return true;
        return false;
      });
    }

    // Apply Profile Filters
    if (profileVideoFilter !== "all") {
      filtered = filtered.filter(v => Math.round(v.rating) === profileVideoFilter);
    }

    // Apply Profile Sort
    return [...filtered].sort((a, b) => {
      if (profileVideoSort === "highest") {
        return b.rating - a.rating;
      }
      const timeA = a.createdAtMs || (a.recordedAt ? new Date(a.recordedAt).getTime() : 0) || 0;
      const timeB = b.createdAtMs || (b.recordedAt ? new Date(b.recordedAt).getTime() : 0) || 0;
      return timeB - timeA;
    });
  }, [videos, currentUser, profileVideoSort, profileVideoFilter]);

  // Active Feed Videos (Filtered by Fullscreen Context or Drawer state if active, otherwise Home feed)
  const activeFeedVideos = useMemo(() => {
    // Filter out hidden/blocked videos
    const visibleVideos = videos.filter((v) => !hiddenVideoIds.includes(v.id));

    // Priority 0: Fullscreen Feed Context (when user clicked a video from a Creator or Business or Profile to watch fullscreen with TikTok scroll)
    if (fullscreenFeedContext) {
      if (fullscreenFeedContext.type === "creator" && fullscreenFeedContext.authorData) {
        const filtered = visibleVideos.filter(v => isAuthorMatch(v, fullscreenFeedContext.authorData!));
        if (filtered.length > 0) return filtered;
      }
      if (fullscreenFeedContext.type === "place" && (fullscreenFeedContext.placeData || fullscreenFeedContext.id)) {
        const placeId = fullscreenFeedContext.placeData?.id || fullscreenFeedContext.id;
        const placeName = fullscreenFeedContext.placeData?.name;
        const filtered = visibleVideos.filter(v => 
          (placeId && (v.placeId === placeId || isPlaceReviewMatch(v, placeId))) ||
          (placeName && (v.placeName === placeName || isPlaceReviewMatch(v, placeName)))
        );
        if (filtered.length > 0) return filtered;
      }
      if (fullscreenFeedContext.type === "profile") {
        return userVideos.length > 0 ? userVideos : visibleVideos;
      }
    }

    // Priority 1: Business/Place context (if viewing a specific place)
    if (isPlaceView && drawerPlace) {
      const filtered = visibleVideos.filter(v => 
        v.placeId === drawerPlace.id || 
        v.placeName === drawerPlace.name ||
        isPlaceReviewMatch(v, drawerPlace.id) ||
        isPlaceReviewMatch(v, drawerPlace.name)
      );
      return filtered;
    }

    // Priority 2: Creator context (if viewing a specific author profile)
    if (isCreatorView && selectedAuthorForDrawer) {
      const filtered = visibleVideos.filter(v => isAuthorMatch(v, selectedAuthorForDrawer));
      return filtered;
    }

    // Priority 3: User Profile context
    if (activeSection === "profile") {
      return userVideos;
    }

    // Priority 4: Standard Home feed sub-tabs
    if (activeSubTab === "following") {
      const followed = visibleVideos.filter((v) => v.author.isFollowed || v.feedCategory === "following");
      return followed.length > 0 ? followed : visibleVideos;
    }
    if (activeSubTab === "clubs") {
      const clubVids = visibleVideos.filter((v) => v.clubName || v.feedCategory === "clubs");
      return clubVids.length > 0 ? clubVids : visibleVideos;
    }
    return visibleVideos;
  }, [videos, activeSubTab, hiddenVideoIds, fullscreenFeedContext, isPlaceView, drawerPlace, isCreatorView, selectedAuthorForDrawer, activeSection, userVideos]);

  // Synchronize currentVideoIndex when activeFeedVideos recomputes if we have a pending video
  useEffect(() => {
    if (pendingVideoId) {
      const idx = activeFeedVideos.findIndex((v) => v.id === pendingVideoId);
      if (idx !== -1) {
        setCurrentVideoIndex(idx);
        setPendingVideoId(null);
      }
    }
  }, [activeFeedVideos, pendingVideoId]);

  // Handle Video Selection from search/map/profile/bookmarks or place/creator drawer
  const handleSelectVideoById = (
    videoId: string,
    source?: "profile" | "creator" | "place" | "general"
  ) => {
    const targetVid = videos.find((v) => v.id === videoId);
    if (!targetVid) return;

    if (source === "creator" || isCreatorView) {
      const author = targetVid.author || selectedAuthorForDrawer;
      if (!author) return;
      const cleanHandle = (author.name || author.name || "creator").replace(/^@+/, "");
      const authorDisplay = author.name || cleanHandle;
      setFullscreenFeedContext({
        type: "creator",
        id: author.name || author.name,
        title: authorDisplay,
        authorData: author
      });
      setSelectedPlaceIdForDrawer(null);
      setSelectedAuthorForDrawer(null);
      setActiveSection("home");

      // Calculate index immediately for zero-lag playback
      const authorVids = videos.filter((v) => !hiddenVideoIds.includes(v.id) && isAuthorMatch(v, author));
      const idx = authorVids.findIndex((v) => v.id === videoId);
      if (idx !== -1) {
        setCurrentVideoIndex(idx);
      } else {
        setPendingVideoId(videoId);
      }
    } else if (source === "place" || isPlaceView) {
      const p = drawerPlace || places.find(pl => pl.id === targetVid.placeId || pl.name === targetVid.placeName);
      const placeId = p?.id || targetVid.placeId;
      const placeName = p?.name || targetVid.placeName;
      setFullscreenFeedContext({
        type: "place",
        id: placeId,
        title: placeName || "Business Reviews",
        placeData: p || null
      });
      setSelectedPlaceIdForDrawer(null);
      setSelectedAuthorForDrawer(null);
      setActiveSection("home");

      // Calculate index immediately for zero-lag playback
      const placeVids = videos.filter((v) => 
        !hiddenVideoIds.includes(v.id) && (
          (placeId && (v.placeId === placeId || isPlaceReviewMatch(v, placeId))) ||
          (placeName && (v.placeName === placeName || isPlaceReviewMatch(v, placeName)))
        )
      );
      const idx = placeVids.findIndex((v) => v.id === videoId);
      if (idx !== -1) {
        setCurrentVideoIndex(idx);
      } else {
        setPendingVideoId(videoId);
      }
    } else if (source === "profile") {
      setFullscreenFeedContext({
        type: "profile",
        title: "My Reviews"
      });
      setSelectedPlaceIdForDrawer(null);
      setSelectedAuthorForDrawer(null);
      setActiveSection("home");

      const idx = userVideos.findIndex((v) => v.id === videoId);
      if (idx !== -1) {
        setCurrentVideoIndex(idx);
      } else {
        setPendingVideoId(videoId);
      }
    } else {
      // Default (search, map, bookmarks, home): open place view with this video as the ONLY context
      setFullscreenFeedContext(null);
      setSelectedAuthorForDrawer(null);
      setSelectedPlaceIdForDrawer(targetVid.placeId || targetVid.placeName);
      setPendingVideoId(videoId);
    }
  };

  // TikTok Back button handler (takes you back to the profile drawer where you came from)
  const handleFeedGoBack = () => {
    // Explicitly pause all videos on the page synchronously to prevent background playback on mobile (e.g. iOS Safari)
    try {
      const vids = document.querySelectorAll("video");
      vids.forEach((v) => {
        try {
          v.pause();
        } catch (e) {}
      });
    } catch (err) {
      console.warn("Failed to pause videos globally on back navigation:", err);
    }

    if (fullscreenFeedContext) {
      if (fullscreenFeedContext.type === "creator" && fullscreenFeedContext.authorData) {
        setSelectedAuthorForDrawer(fullscreenFeedContext.authorData);
        setSelectedPlaceIdForDrawer(null);
      } else if (fullscreenFeedContext.type === "place" && (fullscreenFeedContext.placeData || fullscreenFeedContext.id)) {
        setSelectedPlaceIdForDrawer(fullscreenFeedContext.placeData?.id || fullscreenFeedContext.id || null);
        setSelectedAuthorForDrawer(null);
      } else if (fullscreenFeedContext.type === "profile") {
        handleGoToProfile();
      }
      setFullscreenFeedContext(null);
    } else if (isCreatorView || isPlaceView) {
      handleCloseDrawers();
    } else {
      handleGoHome();
    }
  };

  // Go to main Home Feed (resetting all filters, drawers, and context)
  const handleGoHome = () => {
    setFullscreenFeedContext(null);
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);
    setActiveSection("home");
    setActiveSubTab("discover");
    setCurrentVideoIndex(0);
  };

  // If the user authenticates while on the 'profile' view placeholder, redirect them to the creator drawer
  useEffect(() => {
    if (activeSection === "profile" && currentUser) {
      handleGoToProfile();
    }
  }, [activeSection, currentUser]);

  const handleGoToProfile = () => {
    if (!currentUser) {
      setAuthIntent("profile");
      setIsAuthModalOpen(true);
      return;
    }
    const handle = currentUser.name || currentUser.email?.split("@")[0] || "me";
    window.history.pushState(null, "", "/@" + handle);
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer({
      //handle: handle,
      name: currentUser.name || "Reviewer",
      avatar: currentUser.avatar || "",
      isVerified: true,
      isFollowed: false,
      bio: currentUser.bio || "",
      location: currentUser.location || ""
    });
    setActiveSection("home");
    setCurrentVideoIndex(0);
  };

  // Close Drawers completely (reset to previous section or global feed)
  const handleCloseDrawers = () => {
    setFullscreenFeedContext(null);
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);
    setCurrentVideoIndex(0);
    if (previousSectionRef.current) {
      setActiveSection(previousSectionRef.current);
      previousSectionRef.current = null;
    }
  };

  // Open Place Drawer
  const handleOpenPlaceDrawer = (placeId: string) => {
    if (activeSection !== "home") {
      previousSectionRef.current = activeSection;
    }
    setFullscreenFeedContext(null);
    setSelectedAuthorForDrawer(null);
    setSelectedPlaceIdForDrawer(placeId);
    setCurrentVideoIndex(0);
  };

  // Handle Likes - fully synced with Firestore
  const handleToggleLike = async (videoId: string) => {
    let nextLikes = 0;
    let nextIsLiked = false;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          nextIsLiked = !v.isLiked;
          nextLikes = nextIsLiked ? v.likes + 1 : Math.max(0, v.likes - 1);
          return {
            ...v,
            isLiked: nextIsLiked,
            likes: nextLikes
          };
        }
        return v;
      })
    );

    // Persist to user's liked set in LocalStorage
    try {
      const likedStr = localStorage.getItem("copo_liked_video_ids") || "[]";
      let likedIds: string[] = [];
      try { likedIds = JSON.parse(likedStr); } catch (e) {}
      if (nextIsLiked) {
        if (!likedIds.includes(videoId)) likedIds.push(videoId);
      } else {
        likedIds = likedIds.filter((id) => id !== videoId);
      }
      localStorage.setItem("copo_liked_video_ids", JSON.stringify(likedIds));
    } catch (e) {}

    // Persist to Server and Firestore database
    try {
      fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId, likes: nextLikes })
      }).catch(() => {});
    } catch (e) {}

    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        setDoc(vidRef, { likes: nextLikes }, { merge: true }).catch(() => {});
      }
    } catch (err) {}

    // Send social activity notification to video author
    if (nextIsLiked && currentUser) {
      const targetVid = videos.find((v) => v.id === videoId);
      if (targetVid) {
        const targetAuthor = targetVid.author;
        const recipientEmail =
          targetVid.userId ||
          (targetAuthor?.name ? targetAuthor.name.replace(/^@/, "") : "") ||
          targetVid.userEmail ||
          "";
        const recipientHandle = targetAuthor?.name || "";

        sendSocialNotification({
          recipientEmail,
          recipientHandle,
          type: "like",
          user: {
            name: currentUser.name,
            //handle: currentUser.email ? currentUser.email.split("@")[0] : currentUser.name,
            avatar: currentUser.avatar,
            email: currentUser.email
          },
          text: `liked your video review of ${targetVid.placeName || "a place"}`,
          videoId: targetVid.id,
          videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
          placeName: targetVid.placeName
        }).catch(() => {});
      }
    }
  };

  // Handle Bookmarks - fully synced with Server & Firestore
  const handleToggleBookmark = async (videoId: string) => {
    let nextBookmarked = false;
    let nextCount = 0;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          nextBookmarked = !v.isBookmarked;
          nextCount = nextBookmarked ? v.bookmarksCount + 1 : Math.max(0, v.bookmarksCount - 1);
          return {
            ...v,
            isBookmarked: nextBookmarked,
            bookmarksCount: nextCount
          };
        }
        return v;
      })
    );

    // Persist to user's saved list in LocalStorage
    try {
      const savedStr = localStorage.getItem("copo_saved_video_ids") || "[]";
      let savedIds: string[] = [];
      try { savedIds = JSON.parse(savedStr); } catch (e) {}
      if (nextBookmarked) {
        if (!savedIds.includes(videoId)) savedIds.push(videoId);
      } else {
        savedIds = savedIds.filter((id) => id !== videoId);
      }
      localStorage.setItem("copo_saved_video_ids", JSON.stringify(savedIds));
    } catch (e) {}

    // Persist to Server and Firestore database
    try {
      fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId, bookmarksCount: nextCount })
      }).catch(() => {});
    } catch (e) {}

    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        setDoc(vidRef, { bookmarksCount: nextCount }, { merge: true }).catch(() => {});
      }
    } catch (err) {}
  };

  // Handle Follow
  const handleOpenShare = async (video: VideoReview) => {
    setActiveShareVideo(video);
    setVideos(prev => prev.map(v => {
      if (v.id === video.id) {
        return { ...v, shares: (v.shares || 0) + 1 };
      }
      return v;
    }));
    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", video.id);
        setDoc(vidRef, { shares: (video.shares || 0) + 1 }, { merge: true }).catch(() => {});
      }
    } catch (e) {}

    // Send social notification for share
    if (currentUser && video) {
      const targetAuthor = video.author;
      const recipientEmail =
        video.userId ||
        (targetAuthor?.name ? targetAuthor.name.replace(/^@/, "") : "") ||
        video.userEmail ||
        "";
      const recipientHandle = targetAuthor?.name || "";

      sendSocialNotification({
        recipientEmail,
        recipientHandle,
        type: "repost",
        user: {
          name: currentUser.name,
          //handle: currentUser.email ? currentUser.email.split("@")[0] : currentUser.name,
          avatar: currentUser.avatar,
          email: currentUser.email
        },
        text: `shared your video review of ${video.placeName || "a place"}`,
        videoId: video.id,
        videoThumbnail: resolveVideoPosterUrl(video) || video.author?.avatar,
        placeName: video.placeName
      }).catch(() => {});
    }
  };

  const handleToggleFollow = (authorHandle: string) => {
    if (!currentUser) {
      setAuthIntent('following');
      setIsAuthModalOpen(true);
      return;
    }
    let newFollowState = true;
    
    setVideos((prev) => {
      const firstMatch = prev.find(v => v.author.name === authorHandle);
      if (firstMatch) {
        newFollowState = !firstMatch.author.isFollowed;
      }

      return prev.map((v) => {
        if (v.author.name === authorHandle) {
          return { ...v, author: { ...v.author, isFollowed: newFollowState } };
        }
        return v;
      });
    });
    
    try {
      const stored = localStorage.getItem("copo_followed_authors") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(authorHandle)) followed.push(authorHandle);
      else if (!newFollowState) followed = followed.filter(h => h !== authorHandle);
      localStorage.setItem("copo_followed_authors", JSON.stringify(followed));
      
      // Persist to Firestore if user is logged in
      if (auth.currentUser && db) {
        setDoc(doc(db, "users", auth.currentUser.uid), {
          followedAuthors: followed
        }, { merge: true }).catch(err => console.warn("Failed to update followedAuthors:", err));
      }
    } catch(e) {}
    
    setSelectedAuthorForDrawer((prev) => {
      if (prev && prev.name === authorHandle) {
        return { ...prev, isFollowed: newFollowState };
      }
      return prev;
    });

    // Send social notification for follow
    if (newFollowState && currentUser) {
      sendSocialNotification({
        recipientHandle: authorHandle,
        recipientEmail: authorHandle.replace(/^@/, ""),
        type: "follow",
        user: {
          name: currentUser.name,
          //handle: currentUser.email ? currentUser.email.split("@")[0] : currentUser.name,
          avatar: currentUser.avatar,
          email: currentUser.email
        },
        text: `started following your reviews`
      }).catch(() => {});
    }
  };

  // Handle Follow Place (Business)
  const handleToggleFollowPlace = (placeId: string) => {
    if (!currentUser) {
      setAuthIntent('following');
      setIsAuthModalOpen(true);
      return;
    }
    let newFollowState = true;
    setPlaces((prev) => {
      const updated = prev.map((p) => {
        if (p.id === placeId) {
          newFollowState = !p.isFollowed;
          return { ...p, isFollowed: newFollowState };
        }
        return p;
      });
      return updated;
    });
    
    try {
      const stored = localStorage.getItem("copo_followed_places") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(placeId)) followed.push(placeId);
      else if (!newFollowState) followed = followed.filter(id => id !== placeId);
      localStorage.setItem("copo_followed_places", JSON.stringify(followed));
      
      // Persist to Firestore if user is logged in
      if (auth.currentUser && db) {
        setDoc(doc(db, "users", auth.currentUser.uid), {
          followedPlaces: followed
        }, { merge: true }).catch(err => console.warn("Failed to update followedPlaces:", err));
      }
    } catch(e) {}
  };

  // Handle Adding Comment or Threaded Reply - fully synced with Firestore
  const handleAddComment = async (
    videoId: string,
    text: string,
    options?: {
      replyToId?: string;
      postAsOwner?: boolean;
      postAsCreator?: boolean;
    }
  ) => {
    if (!currentUser) {
      setAuthIntent("general");
      setIsAuthModalOpen(true);
      return;
    }

    const targetVid = videos.find((v) => v.id === videoId);
    const isTargetCreator = Boolean(
      options?.postAsCreator ||
      (currentUser.email && targetVid?.userEmail && currentUser.email.toLowerCase().trim() === (targetVid?.userEmail || "").toLowerCase().trim()) ||
      (currentUser.email && targetVid?.userId && currentUser.email.toLowerCase().trim() === (targetVid?.userId || "").toLowerCase().trim()) ||
      (currentUser.name && targetVid?.author?.name && currentUser.name.toLowerCase().trim() === (targetVid?.author?.name || "").toLowerCase().trim())
    );

    const authorName = currentUser.name || (options?.postAsOwner ? "Verified Business Owner" : (isTargetCreator ? "Video Reviewer" : (currentUser.email ? currentUser.email.split("@")[0] : "Verified Reviewer")));
    const authorHandle = currentUser.email ? currentUser.email.split("@")[0] : (options?.postAsOwner ? "owner" : (isTargetCreator ? "reviewer" : "user"));
    const validCurrentAvatar =
      currentUser.avatar &&
      !currentUser.avatar.includes("photo-1534528741775") &&
      !currentUser.avatar.includes("photo-1535713875002")
        ? currentUser.avatar
        : "";

    const authorAvatar =
      validCurrentAvatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=1a73e8&color=fff&bold=true&size=128`;

    const newCommentItem: ReviewComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      authorName,
      authorHandle,
      authorAvatar,
      text,
      createdAt: "Just now",
      createdAtMs: Date.now(),
      likesCount: 0,
      isLiked: false,
      isOwner: Boolean(options?.postAsOwner),
      isCreator: isTargetCreator,
      replies: []
    };
    if (options?.replyToId) newCommentItem.replyToId = options.replyToId;

    let nextComments: ReviewComment[] = [];
    if (options?.replyToId) {
      // Add as nested reply under target comment
      nextComments = (targetVid?.comments || []).map((c) => {
        if (c.id === options.replyToId) {
          return {
            ...c,
            replies: [...(c.replies || []), newCommentItem]
          };
        }
        return c;
      });
    } else {
      // Top-level comment
      nextComments = [newCommentItem, ...(targetVid?.comments || [])];
    }

    // Calculate total count (comments + all nested replies)
    let totalCount = 0;
    nextComments.forEach((c) => {
      totalCount += 1;
      if (Array.isArray(c.replies)) totalCount += c.replies.length;
    });

    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              commentsCount: totalCount,
              comments: nextComments
            }
          : v
      )
    );

    if (activeCommentVideo && activeCommentVideo.id === videoId) {
      setActiveCommentVideo((prev) =>
        prev
          ? {
              ...prev,
              commentsCount: totalCount,
              comments: nextComments
            }
          : null
      );
    }

    // Persist to Firestore database
    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        // Stripping undefined values using cleanForFirestore
        const dataToSave = cleanForFirestore({
          comments: nextComments,
          commentsCount: totalCount
        });
        await setDoc(vidRef, dataToSave, { merge: true });
      }
    } catch (err) {
      console.warn("Firestore comment sync warning:", err);
    }

    // Send social notification for comment / reply
    if (currentUser && targetVid) {
      const targetAuthor = targetVid.author;
      let recipientEmail =
        targetVid.userId ||
        (targetAuthor?.name ? targetAuthor.name.replace(/^@/, "") : "") ||
        targetVid.userEmail ||
        "";
      let recipientHandle = targetAuthor?.name || "";

      sendSocialNotification({
        recipientEmail,
        recipientHandle,
        type: "comment",
        user: {
          name: currentUser.name,
          //handle: currentUser.email ? currentUser.email.split("@")[0] : currentUser.name,
          avatar: currentUser.avatar,
          email: currentUser.email
        },
        text: `commented: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}" on your review of ${targetVid.placeName || "a place"}`,
        videoId: targetVid.id,
        videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
        placeName: targetVid.placeName
      }).catch(() => {});
    }
  };

  // Handle Comment Like / Unlike
  const handleToggleCommentLike = async (
    videoId: string,
    commentId: string,
    replyId?: string
  ) => {
    if (!currentUser) {
      setAuthIntent("general");
      setIsAuthModalOpen(true);
      return;
    }

    let updatedComments: ReviewComment[] = [];

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const currentList = v.comments || [];
          if (replyId) {
            // Reply like toggle
            updatedComments = currentList.map((c) => {
              if (c.id === commentId && Array.isArray(c.replies)) {
                return {
                  ...c,
                  replies: c.replies.map((r) => {
                    if (r.id === replyId) {
                      const nextLiked = !r.isLiked;
                      const nextCount = nextLiked
                        ? (r.likesCount || 0) + 1
                        : Math.max(0, (r.likesCount || 0) - 1);
                      return { ...r, isLiked: nextLiked, likesCount: nextCount };
                    }
                    return r;
                  })
                };
              }
              return c;
            });
          } else {
            // Top comment like toggle
            updatedComments = currentList.map((c) => {
              if (c.id === commentId) {
                const nextLiked = !c.isLiked;
                const nextCount = nextLiked
                  ? (c.likesCount || 0) + 1
                  : Math.max(0, (c.likesCount || 0) - 1);
                return { ...c, isLiked: nextLiked, likesCount: nextCount };
              }
              return c;
            });
          }
          return {
            ...v,
            comments: updatedComments
          };
        }
        return v;
      })
    );

    if (activeCommentVideo && activeCommentVideo.id === videoId) {
      setActiveCommentVideo((prev) =>
        prev
          ? {
              ...prev,
              comments: updatedComments
            }
          : null
      );
    }

    // Persist to Firestore database
    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        await setDoc(vidRef, cleanForFirestore({ comments: updatedComments }), { merge: true });
      }
    } catch (err) {
      console.warn("Firestore comment like sync warning:", err);
    }
  };

  // Handle Creator Hearting a comment
  const handleToggleCreatorHeart = async (
    videoId: string,
    commentId: string,
    replyId?: string
  ) => {
    let updatedComments: ReviewComment[] = [];

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const currentList = v.comments || [];
          if (replyId) {
            updatedComments = currentList.map((c) => {
              if (c.id === commentId && Array.isArray(c.replies)) {
                return {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === replyId ? { ...r, likedByCreator: !r.likedByCreator } : r
                  )
                };
              }
              return c;
            });
          } else {
            updatedComments = currentList.map((c) =>
              c.id === commentId ? { ...c, likedByCreator: !c.likedByCreator } : c
            );
          }
          return { ...v, comments: updatedComments };
        }
        return v;
      })
    );

    if (activeCommentVideo && activeCommentVideo.id === videoId) {
      setActiveCommentVideo((prev) =>
        prev ? { ...prev, comments: updatedComments } : null
      );
    }

    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        await setDoc(vidRef, cleanForFirestore({ comments: updatedComments }), { merge: true });
      }
    } catch (err) {
      console.warn("Firestore creator heart sync warning:", err);
    }
  };

  // Handle Deleting a Comment or Reply
  const handleDeleteComment = async (
    videoId: string,
    commentId: string,
    replyId?: string
  ) => {
    let updatedComments: ReviewComment[] = [];

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const currentList = v.comments || [];
          if (replyId) {
            updatedComments = currentList.map((c) => {
              if (c.id === commentId && Array.isArray(c.replies)) {
                return {
                  ...c,
                  replies: c.replies.filter((r) => r.id !== replyId)
                };
              }
              return c;
            });
          } else {
            updatedComments = currentList.filter((c) => c.id !== commentId);
          }

          let totalCount = 0;
          updatedComments.forEach((c) => {
            totalCount += 1;
            if (Array.isArray(c.replies)) totalCount += c.replies.length;
          });

          return {
            ...v,
            commentsCount: totalCount,
            comments: updatedComments
          };
        }
        return v;
      })
    );

    if (activeCommentVideo && activeCommentVideo.id === videoId) {
      let totalCount = 0;
      updatedComments.forEach((c) => {
        totalCount += 1;
        if (Array.isArray(c.replies)) totalCount += c.replies.length;
      });

      setActiveCommentVideo((prev) =>
        prev
          ? {
              ...prev,
              commentsCount: totalCount,
              comments: updatedComments
            }
          : null
      );
    }

    try {
      if (db) {
        let totalCount = 0;
        updatedComments.forEach((c) => {
          totalCount += 1;
          if (Array.isArray(c.replies)) totalCount += c.replies.length;
        });

        const vidRef = doc(db, "videoReviews", videoId);
        await setDoc(
          vidRef,
          cleanForFirestore({ comments: updatedComments, commentsCount: totalCount }),
          { merge: true }
        );
      }
    } catch (err) {
      console.warn("Firestore delete comment sync warning:", err);
    }
  };

  // Handle Adding/Updating Owner Response on Review - fully synced with Firestore
  const handleSaveOwnerResponse = async (videoId: string, text: string) => {
    const ownerResp = {
      text: text.trim(),
      respondedAt: "Just now",
      respondedAtMs: Date.now()
    };

    let updatedComments: ReviewComment[] = [];

    setVideos((prev) => {
      const updated = prev.map((v) => {
        if (v.id === videoId) {
          const placeName = v.placeName || "Business";
          const placeLogo = v.placeLogoUrl || "";
          const existingComments = v.comments || [];

          // Create or update owner comment in comments array
          const ownerComment: ReviewComment = {
            id: `owner_comm_${videoId}`,
            authorName: `${placeName} (Owner)`,
            authorHandle: "owner",
            authorAvatar: placeLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(placeName)}&background=1a73e8&color=fff&bold=true`,
            text: text.trim(),
            createdAt: "Just now",
      createdAtMs: Date.now(),
            likesCount: 0,
            isOwner: true,
            isCreator: false,
            replies: []
          };

          const filteredComments = existingComments.filter((c) => !c.isOwner && c.id !== `owner_comm_${videoId}`);
          updatedComments = text.trim() ? [ownerComment, ...filteredComments] : filteredComments;

          return {
            ...v,
            ownerResponse: text.trim() ? ownerResp : undefined,
            comments: updatedComments,
            commentsCount: updatedComments.length
          };
        }
        return v;
      });
      return updated;
    });

    if (activeCommentVideo && activeCommentVideo.id === videoId) {
      setActiveCommentVideo((prev) =>
        prev
          ? {
              ...prev,
              ownerResponse: text.trim() ? ownerResp : undefined,
              comments: updatedComments,
              commentsCount: updatedComments.length
            }
          : null
      );
    }

    // Persist to Server and Firestore database
    try {
      fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: videoId,
          ownerResponse: text.trim() ? ownerResp : null,
          comments: updatedComments,
          commentsCount: updatedComments.length
        })
      }).catch(() => {});
    } catch (e) {}

    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        await setDoc(vidRef, cleanForFirestore({
          ownerResponse: text.trim() ? ownerResp : null,
          comments: updatedComments,
          commentsCount: updatedComments.length
        }), { merge: true });
      }
    } catch (err) {
      console.warn("Firestore owner response sync warning:", err);
    }
  };

  // Handle Deleting Owner Response
  const handleDeleteOwnerResponse = async (videoId: string) => {
    let updatedComments: ReviewComment[] = [];

    setVideos((prev) => {
      const updated = prev.map((v) => {
        if (v.id === videoId) {
          const { ownerResponse, ...rest } = v;
          updatedComments = (v.comments || []).filter((c) => !c.isOwner && c.id !== `owner_comm_${videoId}`);
          return {
            ...rest,
            ownerResponse: undefined,
            comments: updatedComments,
            commentsCount: updatedComments.length
          };
        }
        return v;
      });
      return updated;
    });

    if (activeCommentVideo && activeCommentVideo.id === videoId) {
      setActiveCommentVideo((prev) => {
        if (!prev) return null;
        const { ownerResponse, ...rest } = prev;
        return {
          ...rest,
          ownerResponse: undefined,
          comments: updatedComments,
          commentsCount: updatedComments.length
        };
      });
    }

    try {
      if (db) {
        const vidRef = doc(db, "videoReviews", videoId);
        await setDoc(vidRef, cleanForFirestore({
          ownerResponse: null,
          comments: updatedComments,
          commentsCount: updatedComments.length
        }), { merge: true });
      }
    } catch (err) {
      console.warn("Firestore delete owner response sync warning:", err);
    }
  };

  // Handle Opening the Create Review Modal
  const handleOpenCreateReview = (place: Place | null = null) => {
    if (!currentUser) {
      setAuthIntent('record');
      setPreselectedPlaceForRecording(place);
      setIsAuthModalOpen(true);
    } else {
      setPreselectedPlaceForRecording(place);
      setIsCreateModalOpen(true);
    }
  };

  // Handle Deleting a Video Review
  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    setVideos((prev) => prev.filter((v) => v.id !== videoId));

    try {
      if (db) {
        await deleteDoc(doc(db, "videoReviews", videoId));
      }
    } catch (err) {
      console.warn("Firestore delete video error:", err);
    }
  };

  // Handle Grab / Save Place to Profile
  const handleToggleGrabPlace = (place: Place) => {
    setPlaces((prev) => {
      if (prev.some((p) => p.id === place.id)) return prev;
      return [place, ...prev];
    });

    setSavedPlaceIds((prev) => {
      const exists = prev.includes(place.id);
      if (exists) {
        return prev.filter((id) => id !== place.id);
      } else {
        return [place.id, ...prev];
      }
    });
  };

  // Handle Updating Business Information (Claim, Edit, Add Phone/Website/Hours)
  const handleUpdatePlace = (updatedPlace: Place) => {
    setPlaces((prev) => {
      const exists = prev.some((p) => p.id === updatedPlace.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p));
      }
      return [updatedPlace, ...prev];
    });
  };

  // Handle Publishing New Video Review
  const handlePublishVideoReview = (newReview: VideoReview) => {
    setVideos((prev) => {
      return [newReview, ...prev.filter((v) => v.id !== newReview.id)];
    });
    setActiveSection("home");
    setActiveSubTab("discover");
    setSelectedPlaceIdForDrawer(newReview.placeId); // Open the business profile drawer after submission
    setSelectedAuthorForDrawer(null);
    setPendingVideoId(newReview.id);

    // Persist to Firestore database so all viewers across any browser/device see it immediately
    try {
      if (db) {
        setDoc(doc(db, "videoReviews", newReview.id), cleanForFirestore(newReview), { merge: true }).catch(() => {});
      }
    } catch (e) {}

    // If currentUser avatar was a default dicebear robot or missing, use their real camera snapshot
    if (newReview.thumbnailUrl && currentUser && (!currentUser.avatar || currentUser.avatar.includes("dicebear"))) {
      const updatedUser = { ...currentUser, avatar: newReview.thumbnailUrl };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem("copo_user_profile", JSON.stringify(updatedUser));
      } catch (e) {}
    }

    // Auto-grab place to profile
    setSavedPlaceIds((prev) => {
      if (!prev.includes(newReview.placeId)) {
        return [newReview.placeId, ...prev];
      }
      return prev;
    });

    // Ensure place exists in places list or update its rating/review count
    setPlaces((prev) => {
      const exists = prev.some((p) => isPlaceReviewMatch(newReview, p));
      if (!exists) {
        const newPlace = synthesizePlaceFromReview(newReview, prev);
        return [newPlace, ...prev];
      }
      return prev.map((p) => {
        if (isPlaceReviewMatch(newReview, p)) {
          const newTotalReviews = (p.totalReviews || 0) + 1;
          const newRating = Number(
            (((p.rating || 5) * (p.totalReviews || 1) + newReview.rating) / newTotalReviews).toFixed(1)
          );
          return {
            ...p,
            rating: newRating,
            totalReviews: newTotalReviews,
            videoReviewCount: (p.videoReviewCount || 0) + 1
          };
        }
        return p;
      });
    });
  };

  // Handle Club Join
  const handleToggleJoinClub = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) =>
        c.id === clubId
          ? {
              ...c,
              isJoined: !c.isJoined,
              membersCount: c.isJoined ? c.membersCount - 1 : c.membersCount + 1
            }
          : c
      )
    );
  };

  const bookmarkedVideos = useMemo(() => {
    return videos.filter((v) => v.isBookmarked);
  }, [videos]);

  const savedPlaces = useMemo(() => {
    const userVideoPlaceIds = new Set(userVideos.map((v) => v.placeId));
    const userVideoPlaceNames = new Set(
      userVideos.map((v) => (v.placeName || "").toLowerCase().trim()).filter(Boolean)
    );

    return places.filter(
      (p) =>
        savedPlaceIds.includes(p.id) ||
        p.isSavedToProfile ||
        userVideoPlaceIds.has(p.id) ||
        userVideoPlaceNames.has((p.name || "").toLowerCase().trim())
    );
  }, [places, savedPlaceIds, userVideos]);

  const handleOpenReport = (target: ReportTarget | VideoReview | { type: "user"; author: VideoAuthor } | { type: "place"; placeName: string; placeId: string }) => {
    if ("videoUrl" in target) {
      setActiveReportTarget({ type: "video", video: target as VideoReview });
    } else if ("type" in target) {
      setActiveReportTarget(target as ReportTarget);
    }
    setIsReportModalOpen(true);
  };

  const handleBlockOrHide = (target: ReportTarget) => {
    if (target.video?.id) {
      const vidId = target.video.id;
      setHiddenVideoIds((prev) => {
        const next = Array.from(new Set([...prev, vidId]));
        try {
          localStorage.setItem("yoouz_hidden_videos", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
    if (target.author) {
      handleBlockUser(target.author.name || target.author.name, target.author.name);
    }
  };

  const isUserOwnerOfCommentPlace = useMemo(() => {
    if (!activeCommentVideo || !currentUser) return false;
    const place = places.find((p) => p.id === activeCommentVideo.placeId);
    if (!place) return false;
    return Boolean(
      currentUser.email === "4samet@gmail.com" ||
      (place.claimedByEmail && currentUser.email === place.claimedByEmail) ||
      (place.staffEmails && currentUser.email && place.staffEmails.includes(currentUser.email))
    );
  }, [activeCommentVideo, places, currentUser]);

  return (
    <div
      id="copo-app-root"
      className="flex w-screen h-[100dvh] overflow-hidden bg-zinc-100 text-zinc-900 font-sans select-none antialiased relative"
    >
      {/* 1. Left Section: Business/Place Details Panel OR Creator Profile Panel OR Standard Navigation Sidebar */}
       {isPlaceView ? (
        <CopoPlaceDrawer
          place={drawerPlace}
          allVideos={videos}
          onClose={handleCloseDrawers}
          onSelectVideo={(videoId) => handleSelectVideoById(videoId, "place")}
          onToggleGrabPlace={handleToggleGrabPlace}
          onUpdatePlace={handleUpdatePlace}
          onToggleFollowPlace={handleToggleFollowPlace}
          onOpenReport={handleOpenReport}
          isSaved={drawerPlace ? savedPlaceIds.includes(drawerPlace.id) : false}
          reviewSort={placeReviewSort}
          onSortChange={(sort) => {
            setPlaceReviewSort(sort);
            setCurrentVideoIndex(0);
          }}
          starFilter={placeStarFilter}
          onStarFilterChange={(stars) => {
            setPlaceStarFilter(stars);
            setCurrentVideoIndex(0);
          }}
          currentUser={currentUser}
          onRecordForPlace={handleOpenCreateReview}
          onStartChat={handleStartChat}
          onClaimBusiness={(place) => {
            setBusinessClaimTargetPlace(place);
            setBusinessInitialMode('claim');
            handleCloseDrawers();
            setActiveSection('business');
          }}
        />
      ) : isCreatorView ? (
        <CopoCreatorDrawer
          author={selectedAuthorForDrawer}
          allVideos={videos}
          currentUser={currentUser}
          activeVideoId={activeFeedVideos[currentVideoIndex]?.id}
          onClose={handleCloseDrawers}
          onSelectVideo={(videoId) => handleSelectVideoById(videoId, "creator")}
          onToggleFollow={handleToggleFollow}
          onStartChat={handleStartChat}
          onUpdateProfile={handleUpdateProfile}
          onOpenReport={(author) => handleOpenReport({ type: "user", author })}
          onRecordReview={handleOpenCreateReview}
          onDeleteVideo={handleDeleteUserVideo}
          onSignOut={async () => {
            await logOutUser();
            setCurrentUser(null);
            try {
              localStorage.removeItem("copo_user_profile");
            } catch (e) {}
            handleCloseDrawers();
          }}
          onDeleteProfile={async () => {
            await handleDeleteProfile();
            handleCloseDrawers();
          }}
        />
       ) : activeSection === "business" ? null : (
        <CopoSidebar
          activeSection={activeSection}
          currentUser={currentUser}
          onOpenLegal={handleOpenLegal}
          onSelectSection={(section) => {
            if (section === "search") {
              setSearchResetKey((prev) => prev + 1);
            }
            if (section === "record_review") {
              setRecordReviewResetKey((prev) => prev + 1);
            }
            if (section === "home" || section === "more") {
              setSelectedPlaceIdForDrawer(null);
              setSelectedAuthorForDrawer(null);
              if (section === "home") {
                setCurrentVideoIndex(0);
                setActiveSubTab("discover");
                setActiveSection("home");
                return;
              }
            }
            if (section === "discover") {
              setSelectedPlaceIdForDrawer(null);
              setSelectedAuthorForDrawer(null);
              setActiveSection("discover");
              return;
            }
            if (section === "profile") {
              handleGoToProfile();
              return;
            }
            if ((section as string) === "admin") {
              setSelectedPlaceIdForDrawer(null);
              setSelectedAuthorForDrawer(null);
              setActiveSection("admin");
              window.history.pushState(null, "", "/admin");
              return;
            } else if ((activeSection as string) === "admin" && (section as string) !== "admin") {
              window.history.pushState(null, "", "/");
            }
            if ((section as string) === "business") {
              setSelectedPlaceIdForDrawer(null);
              setSelectedAuthorForDrawer(null);
              setActiveSection("business");
              window.history.pushState(null, "", "/business");
              return;
            } else if ((activeSection as string) === "business" && (section as string) !== "business") {
              window.history.pushState(null, "", "/");
            }
            if (!currentUser && ["messages", "notifications", "bookmarks", "following"].includes(section as string)) {
              setAuthIntent(section as AuthIntent);
              setIsAuthModalOpen(true);
              return;
            }

            setSelectedPlaceIdForDrawer(null);
            setSelectedAuthorForDrawer(null);
            setActiveSection(section);
          }}
          unreadNotifsCount={currentUser ? notifications.filter((n) => !n.isRead).length : 0}
          unreadMessagesCount={currentUser ? messages.reduce((acc, m) => acc + (m.unreadCount || 0), 0) : 0}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenCreateModal={() => {
            if (!currentUser) {
              setAuthIntent('record');
              setIsAuthModalOpen(true);
            } else {
              setPreselectedPlaceForRecording(null);
              setIsCreateModalOpen(true);
            }
          }}
        />
      )}

      {/* 2. Main Stage Content Switcher */}
      <div className={`flex-1 h-[100dvh] flex flex-col relative overflow-hidden bg-zinc-950 md:bg-zinc-50 ${activeSection === "business" ? "" : "pb-mobile-nav"}`}>
        {/* If in Feed View (Home, Clubs) or Place / Creator drawer views: Display center video player */}
        {(isPlaceView || isCreatorView || activeSection === "home" || activeSection === "clubs") && (
            <CopoVideoPlayer
              isPaused={isCreateModalOpen || isAuthModalOpen}
              contextKey={currentFeedContextKey}
              onOpenCreateModal={() => {
                if (!currentUser) {
                  setAuthIntent('record');
                  setIsAuthModalOpen(true);
                } else {
                  setPreselectedPlaceForRecording(null);
                  setIsCreateModalOpen(true);
                }
              }}
              onLoadMore={loadMoreVideos}
              videos={activeFeedVideos}
              isLoading={isLoadingVideos}
              places={places}
              currentIndex={currentVideoIndex}
              onSelectVideoIndex={setCurrentVideoIndex}
              activeSubTab={activeSubTab}
              onSelectSubTab={(tab) => {
                setActiveSubTab(tab);
                setCurrentVideoIndex(0);
              }}
              onOpenComments={(v) => setActiveCommentVideo(v)}
              onOpenPlace={handleOpenPlaceDrawer}
              onOpenCreator={(author) => {
                setSelectedPlaceIdForDrawer(null);
                setSelectedAuthorForDrawer(author);
                setCurrentVideoIndex(0);
              }}
              onOpenShare={handleOpenShare}
              onOpenReport={(v) => handleOpenReport({ type: "video", video: v })}
              currentUser={currentUser}
              onDeleteVideo={handleDeleteUserVideo}
              onUpdateVideoReview={handleUpdateVideoReview}
              onHideVideo={(vidId) => {
                const targetVid = activeFeedVideos.find((v) => v.id === vidId);
                if (targetVid) {
                  handleBlockOrHide({ type: "video", video: targetVid });
                }
              }}
              onToggleLike={handleToggleLike}
              onToggleBookmark={handleToggleBookmark}
              onToggleFollow={handleToggleFollow}
              onGoBack={fullscreenFeedContext ? handleFeedGoBack : undefined}
              feedContextTitle={fullscreenFeedContext?.title}
              onGoHome={handleGoHome}
              onOpenMenu={() => setIsMobileNavDrawerOpen(true)}
            />
        )}

        {/* Other Sections (Search, Map, Notifications, Messages, Bookmarks, Profile) when NOT in Place or Creator view */}
        {!isPlaceView && !isCreatorView && (
          <>
            {/* Search View (Desktop Live Search Places, Businesses, Addresses & Videos) */}
            {activeSection === "search" && (
              <CopoSearchView
                key={searchResetKey}
                places={places}
                videos={videos}
                savedPlaceIds={savedPlaceIds}
                onSelectVideo={handleSelectVideoById}
                onOpenPlace={handleOpenPlaceDrawer}
                onToggleGrabPlace={handleToggleGrabPlace}
                onRecordForPlace={(place) => {
                  if (!currentUser) {
                    setAuthIntent('record');
                    setPreselectedPlaceForRecording(place);
                    setIsAuthModalOpen(true);
                  } else {
                    setPreselectedPlaceForRecording(place);
                    setIsCreateModalOpen(true);
                  }
                }}
                onAddPlace={(newPlace) => {
                  if (!newPlace) return;
                  const [safeLat, safeLng] = sanitizeLatLng(newPlace.lat, newPlace.lng);
                  const cleanPlace = { ...newPlace, lat: safeLat, lng: safeLng };
                  
                  // Persist to Firestore immediately so it's "already saved" as per user request
                  if (db && cleanPlace.id) {
                    try {
                      setDoc(doc(db, "places", cleanPlace.id), cleanForFirestore(cleanPlace), { merge: true })
                        .catch(err => console.warn("Auto-save place search result error:", err));
                    } catch (e) {}
                  }

                  setPlaces((prev) => {
                    const map = new Map<string, Place>();
                    map.set(cleanPlace.id, cleanPlace);
                    prev.forEach((p) => {
                      if (!map.has(p.id)) map.set(p.id, p);
                    });
                    return Array.from(map.values()).filter((u: any) => u.name && u.name !== "Registered User" && u.name !== "Reviewer" && u.email && !u.email.includes("undefined"));
                  });
                }}
              />
            )}
            {activeSection === "record_review" && (
              <CopoRecordReviewView
                key={recordReviewResetKey}
                places={places}
                videos={videos}
                savedPlaceIds={savedPlaceIds}
                onSelectVideo={handleSelectVideoById}
                onOpenPlace={handleOpenPlaceDrawer}
                onToggleGrabPlace={handleToggleGrabPlace}
                onRecordForPlace={(place) => {
                  if (!currentUser) {
                    setAuthIntent('record');
                    setPreselectedPlaceForRecording(place);
                    setIsAuthModalOpen(true);
                  } else {
                    setPreselectedPlaceForRecording(place);
                    setIsCreateModalOpen(true);
                  }
                }}
                onAddPlace={(newPlace) => {
                  if (!newPlace) return;
                  const [safeLat, safeLng] = sanitizeLatLng(newPlace.lat, newPlace.lng);
                  const cleanPlace = { ...newPlace, lat: safeLat, lng: safeLng };

                  // Persist to Firestore immediately so it's "already saved" as per user request
                  if (db && cleanPlace.id) {
                    try {
                      setDoc(doc(db, "places", cleanPlace.id), cleanForFirestore(cleanPlace), { merge: true })
                        .catch(err => console.warn("Auto-save place search result error:", err));
                    } catch (e) {}
                  }

                  setPlaces((prev) => {
                    const map = new Map<string, Place>();
                    map.set(cleanPlace.id, cleanPlace);
                    prev.forEach((p) => {
                      if (!map.has(p.id)) map.set(p.id, p);
                    });
                    return Array.from(map.values()).filter((u: any) => u.name && u.name !== "Registered User" && u.name !== "Reviewer" && u.email && !u.email.includes("undefined"));
                  });
                }}
              />
            )}

            {/* Discover Reviewers / Creators Directory View */}
            {activeSection === "discover" && (
              <CopoDiscoverView
                videos={videos}
                allUsers={allRegisteredUsers}
                currentUser={currentUser}
                onOpenCreator={(author) => {
                  setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);
                  setActiveSection("home");
                  setCurrentVideoIndex(0);
                }}
                onToggleFollow={handleToggleFollow}
                onStartChat={handleStartChat}
                onSelectVideo={handleSelectVideoById}
                onNavigateHome={handleGoHome}
                onOpenAuth={() => {
                  setAuthIntent('general');
                  setIsAuthModalOpen(true);
                }}
              />
            )}

            {/* Map View (Map pins & place video cards) */}
            {activeSection === "map" && (
              <CopoMapView
                places={places}
                videos={videos}
                onOpenPlace={handleOpenPlaceDrawer}
                onSelectVideo={handleSelectVideoById}
              />
            )}


            {/* Admin View */}
            {activeSection === "admin" && (
              <CopoAdminPanel
                videos={videos}
                places={places}
                allUsers={allRegisteredUsers}
                clubs={clubs}
                onDeleteVideo={handleAdminDeleteVideo}
                onBulkDeleteVideos={handleAdminBulkDeleteVideos}
                onPurgeAllVideos={handleAdminPurgeAllVideos}
                onUpdateVideo={(updatedVid) => {
                  setVideos((prev) => prev.map((v) => (v.id === updatedVid.id ? updatedVid : v)));
                  if (db) {
                    setDoc(doc(db, "videoReviews", updatedVid.id), cleanForFirestore(updatedVid), { merge: true }).catch(() => {});
                  }
                }}
                onDeletePlace={handleAdminDeletePlace}
                onBulkDeletePlaces={handleAdminBulkDeletePlaces}
                onUpdatePlace={(updatedPlace) => {
                  handleUpdatePlace(updatedPlace);
                  if (db) {
                    setDoc(doc(db, "places", updatedPlace.id), cleanForFirestore(updatedPlace), { merge: true }).catch(() => {});
                  }
                }}
                onAddPlace={(newPlace) => {
                  setPlaces((prev) => [newPlace, ...prev.filter((p) => p.id !== newPlace.id)]);
                  if (db) {
                    setDoc(doc(db, "places", newPlace.id), cleanForFirestore(newPlace), { merge: true }).catch(() => {});
                  }
                }}
                onDeleteComment={handleDeleteComment}
                onBroadcastNotification={async (notif) => {
                  try {
                    const allU = allRegisteredUsers || [];
                    for (const u of allU) {
                      const recEmail = u.email || u.name || u.id;
                      if (recEmail) {
                        sendSocialNotification({
                          recipientEmail: recEmail,
                          recipientHandle: u.name || recEmail,
                          type: "message",
                          user: {
                            name: "Yoouz Admin Team",
                            //handle: "yoouz",
                            avatar: "https://ui-avatars.com/api/?name=Yoouz+Admin&background=1a73e8&color=fff&bold=true",
                            email: "admin@yoouz.com"
                          },
                          text: notif.message,
                          videoId: notif.targetUrl
                        }).catch(() => {});
                      }
                    }
                  } catch (e) {}
                }}
                onExit={() => {
                  setActiveSection("home");
                  window.history.pushState(null, "", "/");
                }}
              />
            )}

            {/* Notifications View */}
            {activeSection === "notifications" && (
              <CopoNotificationsView
                notifications={notifications}
                currentUser={currentUser}
                allVideos={videos}
                onOpenAuth={() => {
                  setAuthIntent('notifications');
                  setIsAuthModalOpen(true);
                }}
                onOpenHelp={() => setActiveSection('more')}
                onOpenLegal={handleOpenLegal}
                onSuccessAuth={(user) => setCurrentUser(user)}
                onSelectNotificationVideo={(vidId) => vidId && handleSelectVideoById(vidId)}
                onNavigateToMessages={() => setActiveSection("messages")}
                onNavigateHome={handleGoHome}
                onUpdateNotifications={setNotifications}
                onMarkRead={markNotificationAsRead}
                onMarkAllRead={() => {
                  markAllNotificationsAsRead(notifications.map(n => n.id));
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                }}
                onDeleteNotification={deleteNotification}
                onClearAll={() => {
                  notifications.forEach(n => deleteNotification(n.id));
                  setNotifications([]);
                }}
              />
            )}

            {/* Direct Messages View */}
            {activeSection === "messages" && (
              <CopoMessagesView
                messages={messages}
                currentUser={currentUser}
                places={places}
                userVideos={userVideos}
                allVideos={videos}
                onOpenAuth={() => {
                  setAuthIntent('messages');
                  setIsAuthModalOpen(true);
                }}
                onOpenHelp={() => setActiveSection('more')}
                onOpenLegal={handleOpenLegal}
                onSuccessAuth={(user) => setCurrentUser(user)}
                selectedThreadId={activeThreadId}
                onSelectThreadId={setActiveThreadId}
                onOpenReport={handleOpenReport}
                onSelectPlace={handleOpenPlaceDrawer}
                onNavigateToNotifications={() => setActiveSection("notifications")}
                onNavigateHome={handleGoHome}
                unreadNotifsCount={currentUser ? notifications.filter((n) => !n.isRead).length : 0}
                blockedUserIds={blockedUserIds}
                onBlockUser={handleBlockUser}
                onUnblockUser={handleUnblockUser}
                allUsers={allRegisteredUsers}
                onOpenCreator={(author) => {
                  setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);
                  setCurrentVideoIndex(0);
                }}
                onDeleteThread={(threadId) => {
                  deleteChatThreadFromFirestore(threadId);
                  setMessages((prev) => prev.filter((m) => m.id !== threadId));
                }}
                onSendMessage={async (threadId, text, recipient, videoUrl, customVideoId) => {
                  if (currentUser) {
                    await sendChatMessageToFirestore(
                      threadId,
                      text,
                      currentUser,
                      recipient,
                      videoUrl,
                      customVideoId
                    );
                  }
                }}
                onMarkThreadRead={(threadId) => {
                  if (currentUser) {
                    markChatThreadAsRead(threadId, currentUser);
                  }
                }}
                onUpdateMessages={async (updated) => {
                  setMessages(updated);
                }}
                onSelectVideo={handleSelectVideoById}
              />
            )}

            {/* Bookmarks / Bucket List View */}
            {activeSection === "bookmarks" && (
              <CopoBookmarksView
                bookmarkedVideos={bookmarkedVideos}
                currentUser={currentUser}
                onOpenAuth={() => {
                  setAuthIntent('bookmarks');
                  setIsAuthModalOpen(true);
                }}
                onOpenHelp={() => setActiveSection('more')}
                onOpenLegal={handleOpenLegal}
                onSuccessAuth={(user) => setCurrentUser(user)}
                onSelectVideo={handleSelectVideoById}
                onRemoveBookmark={handleToggleBookmark}
                onNavigateHome={handleGoHome}
              />
            )}

            {/* Following Directory View */}
            {activeSection === "following" && (
              <CopoFollowingView
                places={places}
                videos={videos}
                currentUser={currentUser}
                onOpenAuth={() => {
                  setAuthIntent('following');
                  setIsAuthModalOpen(true);
                }}
                onOpenHelp={() => setActiveSection('more')}
                onOpenLegal={handleOpenLegal}
                onSuccessAuth={(user) => setCurrentUser(user)}
                onSelectVideo={handleSelectVideoById}
                onOpenPlace={handleOpenPlaceDrawer}
                onNavigateHome={handleGoHome}
                onOpenCreator={(author) => {
                  setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);
                  setCurrentVideoIndex(0);
                }}
                onToggleFollow={handleToggleFollow}
                onToggleFollowPlace={handleToggleFollowPlace}
              />
            )}

            {/* Profile View (Unauthenticated Only) */}
            {activeSection === "profile" && !currentUser && (
              <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white flex flex-col justify-between pb-32 md:pb-6" >
                <CopoAuthPrompt
                  intent="profile"
                  onOpenHelp={() => setActiveSection('more')}
                  onOpenLegal={handleOpenLegal}
                  onSuccess={(user) => {
                    setCurrentUser(user);
                  }}
                  isFullPage={true}
                />
              </div>
            )}

            {/* More / About & FAQ View */}
            {/* Pricing View */}
            {/* Business Dashboard View */}
            {activeSection === "business" && (
              <CopoBusinessDashboardView 
                onNavigate={(sec) => {
                  if (sec === "home") {
                    window.history.pushState(null, "", "/");
                  }
                  setActiveSection(sec);
                }}
                places={places}
                videos={videos}
                currentUser={currentUser}
                onOpenPlaceDrawer={handleOpenPlaceDrawer}
                onOpenCreator={(author) => {
                  previousSectionRef.current = "business";
                  setSelectedPlaceIdForDrawer(null);
                  setSelectedAuthorForDrawer(author);
                  setCurrentVideoIndex(0);
                }}
                initialPlace={businessClaimTargetPlace}
                initialMode={businessInitialMode}
                onSaveOwnerResponse={handleSaveOwnerResponse}
                onDeleteOwnerResponse={handleDeleteOwnerResponse}
              />
            )}
            {activeSection === "more" && (
              <CopoMoreView
                currentUser={currentUser}
                onOpenLegal={handleOpenLegal}
                onOpenAuth={() => {
                  setAuthIntent('general');
                  setIsAuthModalOpen(true);
                }}
                onSuccessAuth={(user) => setCurrentUser(user)}
                onSignOut={async () => {
                  await logOutUser();
                  setCurrentUser(null);
                  try {
                    localStorage.removeItem("copo_user_profile");
                  } catch (e) {}
                }}
                onNavigate={(section) => {
                  if (section === "home") {
                    setSelectedPlaceIdForDrawer(null);
                    setSelectedAuthorForDrawer(null);
                    setCurrentVideoIndex(0);
                    setActiveSubTab("discover");
                    setActiveSection("home");
                  } else if (section === "discover") {
                    setSelectedPlaceIdForDrawer(null);
                    setSelectedAuthorForDrawer(null);
                    setActiveSection("discover");
                  } else if (section === "profile") {
                    handleGoToProfile();
                  } else {
                    setActiveSection(section);
                  }
                }}
                onDeleteProfile={handleDeleteProfile}
              />
            )}
          </>
        )}
      </div>

      {/* Video Comments Drawer */}
      <CopoCommentsDrawer
        video={activeCommentVideo}
        currentUser={currentUser}
        onClose={() => setActiveCommentVideo(null)}
        onRequireAuth={() => {
          setAuthIntent("general");
          setIsAuthModalOpen(true);
        }}
        onAddComment={handleAddComment}
        onToggleCommentLike={handleToggleCommentLike}
        onToggleCreatorHeart={handleToggleCreatorHeart}
        onDeleteComment={handleDeleteComment}
        onAddOwnerResponse={handleSaveOwnerResponse}
        onDeleteOwnerResponse={handleDeleteOwnerResponse}
        isUserOwner={isUserOwnerOfCommentPlace}
        placeName={activeCommentVideo?.placeName}
        onSelectAuthor={(handle, name, avatar) => {
          setActiveCommentVideo(null); // Close the drawer first
          
          // Then open the creator profile
          setSelectedAuthorForDrawer({
            name: name || handle,
            //handle: handle,
            avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`,
            isVerified: false,
            isFollowed: false
          });
        }}
      />

      {/* Share Video Modal */}
      <CopoShareModal
        video={activeShareVideo}
        onClose={() => setActiveShareVideo(null)}
        onOpenReport={(v) => {
          setActiveShareVideo(null);
          handleOpenReport({ type: "video", video: v });
        }}
      />

      {/* Special Yoouz In-App Reporting Flow (TikTok / FB / YouTube style -> report@yoouz.com) */}
      <CopoReportModal
        isOpen={isReportModalOpen}
        target={activeReportTarget}
        currentUser={currentUser}
        onClose={() => {
          setIsReportModalOpen(false);
          setActiveReportTarget(null);
        }}
        onBlockOrHide={handleBlockOrHide}
      />

      {/* Mobile Navigation Drawer */}
      <CopoMobileNavDrawer
        isOpen={isMobileNavDrawerOpen}
        onClose={() => setIsMobileNavDrawerOpen(false)}
        activeSection={activeSection}
        onSelectSection={(section) => {
          if (section === "home") {
            setSelectedPlaceIdForDrawer(null);
            setSelectedAuthorForDrawer(null);
            setCurrentVideoIndex(0);
            setActiveSubTab("discover");
            setActiveSection("home");
            return;
          }
          if (section === "discover") {
            setSelectedPlaceIdForDrawer(null);
            setSelectedAuthorForDrawer(null);
            setActiveSection("discover");
            return;
          }
          if (section === "profile") {
            handleGoToProfile();
            return;
          }
          if (section === "search") {
            setIsSearchModalOpen(true);
            return;
          }
          if ((section as string) === "business") {
            setSelectedPlaceIdForDrawer(null);
            setSelectedAuthorForDrawer(null);
            setActiveSection("business");
            window.history.pushState(null, "", "/business");
            return;
          }
          if (!currentUser && ["messages", "notifications", "bookmarks", "following"].includes(section as string)) {
            setAuthIntent(section as AuthIntent);
            setIsAuthModalOpen(true);
            return;
          }
          setSelectedPlaceIdForDrawer(null);
          setSelectedAuthorForDrawer(null);
          setActiveSection(section);
        }}
        currentUser={currentUser}
        unreadNotifsCount={currentUser ? notifications.filter((n) => !n.isRead).length : 0}
        unreadMessagesCount={currentUser ? messages.reduce((acc, m) => acc + (m.unreadCount || 0), 0) : 0}
        onOpenCreateModal={() => {
          if (!currentUser) {
            setAuthIntent('record');
            setIsAuthModalOpen(true);
          } else {
            setPreselectedPlaceForRecording(null);
            setIsCreateModalOpen(true);
          }
        }}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenAuth={(intent) => {
          setAuthIntent((intent as AuthIntent) || 'general');
          setIsAuthModalOpen(true);
        }}
        onOpenLegal={handleOpenLegal}
        onSignOut={async () => {
          await logOutUser();
          setCurrentUser(null);
          try {
            localStorage.removeItem("copo_user_profile");
          } catch (e) {}
        }}
        onOpenEditProfile={handleGoToProfile}
      />

      {/* Mobile Search Overlay */}
      {isSearchModalOpen && (
        <CopoMobileSearchView
          key={searchResetKey}
          places={places}
          videos={videos}
          onSelectVideo={(id) => {
            setIsSearchModalOpen(false);
            handleSelectVideoById(id);
          }}
          onOpenPlace={(id) => {
            setIsSearchModalOpen(false);
            handleOpenPlaceDrawer(id);
          }}
          onRecordForPlace={(place) => {
            setIsSearchModalOpen(false);
            if (!currentUser) {
              setAuthIntent('record');
              setPreselectedPlaceForRecording(place);
              setIsAuthModalOpen(true);
            } else {
              setPreselectedPlaceForRecording(place);
              setIsCreateModalOpen(true);
            }
          }}
          onAddPlace={(newPlace) => {
            if (!newPlace) return;
            const [safeLat, safeLng] = sanitizeLatLng(newPlace.lat, newPlace.lng);
            const cleanPlace = { ...newPlace, lat: safeLat, lng: safeLng };
            setPlaces((prev) => {
              const map = new Map<string, Place>();
              map.set(cleanPlace.id, cleanPlace);
              prev.forEach((p) => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              return Array.from(map.values()).filter((u: any) => u.name && u.name !== "Registered User" && u.name !== "Reviewer" && u.email && !u.email.includes("undefined"));
            });
          }}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}

      {/* Google Sign-In Modal */}
      <CopoGoogleAuthModal
        isOpen={isAuthModalOpen}
        intent={authIntent}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenHelp={() => {
          setIsAuthModalOpen(false);
          setActiveSection('more');
        }}
        onOpenLegal={(tab) => {
          handleOpenLegal(tab);
        }}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          setAuthIntent('general');
        }}
      />

      {/* Terms & Conditions / Privacy Policy Legal Modal */}
      <CopoLegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Record Video Review Modal */}
      <CopoCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPreselectedPlaceForRecording(null);
        }}
        places={places}
        videos={videos}
        preselectedPlace={preselectedPlaceForRecording}
        onPublishVideoReview={handlePublishVideoReview}
        currentUser={currentUser}
        onAddPlace={handleUpdatePlace}
      />

      <GlobalUploadToast />
      <PWAInstallPrompt />

      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white rounded-2xl px-5 py-4 border border-zinc-800 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black">Profile Successfully Deleted</p>
            <p className="text-[10px] text-zinc-400 font-semibold">Your Google-linked profile data has been cleared permanently.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

