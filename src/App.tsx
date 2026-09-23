import { forceMute } from "./hooks/useGlobalMute";
import { useFeedPagination } from "./hooks/useFeedPagination";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Place, VideoReview, ReviewComment, NavSection, FeedSubTab, CopoNotification, CopoMessage, VideoAuthor, UserProfile, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from "./types";
import { isValidLatLng, sanitizeLatLng } from "./utils/geo";
import { CopoSidebar } from "./components/CopoSidebar";
import { SEOTags } from "./components/SEOTags";
import { AEOBlock } from "./components/AEOBlock";
import { CopoVideoPlayer } from "./components/CopoVideoPlayer";
// QR Widget intentionally removed per user request
import { CopoSearchView } from "./components/CopoSearchView";
import { CopoMobileSearchView } from "./components/CopoMobileSearchView";
import { CopoMobileDiscoverView } from "./components/CopoMobileDiscoverView";
import { GlobalUploadToast } from "./components/GlobalUploadToast";
import { CopoMapView } from "./components/CopoMapView";
import { CopoPlaceDrawer } from "./components/CopoPlaceDrawer";
import { CopoCreatorDrawer } from "./components/CopoCreatorDrawer";
import { CopoCommentsDrawer } from "./components/CopoCommentsDrawer";
import { CopoShareModal } from "./components/CopoShareModal";
import { CopoCreateModal } from "./components/CopoCreateModal";
import { CopoBusinessDashboardView } from "./components/CopoBusinessDashboardView";
import { CopoMoreView } from "./components/CopoMoreView";
import { CopoBookmarksView } from "./components/CopoBookmarksView";
import { CopoNotificationsView } from "./components/CopoNotificationsView";
import { CopoMessagesView } from "./components/CopoMessagesView";
import { CopoFollowingView } from "./components/CopoFollowingView";
import { CopoDiscoverView } from "./components/CopoDiscoverView";
import { CopoMobileNavDrawer } from "./components/CopoMobileNavDrawer";
import { CopoAdminPanel } from "./components/CopoAdminPanel";
import { CopoGoogleAuthModal, AuthIntent, CopoAuthPrompt } from "./components/CopoGoogleAuthModal";
import { CopoLegalModal } from "./components/CopoLegalModal";
import { CopoComparisonModal } from "./components/CopoComparisonModal";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { InAppNotificationToast, InAppToastPayload } from "./components/InAppNotificationToast";
import { CopoReportModal, ReportTarget } from "./components/CopoReportModal";
import { CopoNotificationSettingsModal } from "./components/CopoNotificationSettingsModal";
import { CopoEmbedView } from "./components/CopoEmbedView";
import { CopoTestEmbedView } from "./components/CopoTestEmbedView";
import { prefetchVideo } from "./utils/videoPrefetcher";
import { resolvePlayableVideoSource, resolveVideoPosterUrl } from "./utils/videoUtils";
import { auth, db, logOutUser, onAuthStateChanged, handleRedirectResult, handleBunnyDBError, OperationType } from "./lib/bunnydb";
import { collection, getDocs, getDoc, onSnapshot, query, orderBy, deleteDoc, doc, where, setDoc, updateDoc, increment, serverTimestamp } from "./lib/bunnydb";
import { cleanUndefinedFields, cleanData } from "./utils/cleanData";
import { getRawVideoBlobFromIndexedDB, deleteVideoBlobFromIndexedDB, clearAllVideoBlobsFromIndexedDB } from "./lib/videoStorage";
import { isPlaceReviewMatch, isAuthorMatch, synthesizePlaceFromReview, extractCleanDomain, getDisplayViews, formatViewCount, updateUserRegistry, resolveSafeAuthor, getSafeAvatarUrl, KNOWN_COMMUNITY_USERS, getPlaceSlug, formatBusinessName, getDeletedPlaceIds, isPlaceDeleted, getPlaceVariants, recordDeletedPlacesInLocalStorage, unrecordDeletedPlacesInLocalStorage, isUserDeleted, recordDeletedUsersInLocalStorage, unrecordDeletedUsersInLocalStorage, getDeletedUserIds, isUserDeactivated, recordDeactivatedUsersInLocalStorage, unrecordDeactivatedUsersInLocalStorage, getDeactivatedUserIds, YOOUZ_VIDEOS_CACHE_KEY } from "./utils/placeUtils";
import { getCleanLogoUrl, getPlaceLogoUrl, KNOWN_BRAND_BANNERS, KNOWN_BRAND_LOGOS, YOOUZ_LOGO_DATA_URI } from "./utils/logoUtils";
import { generateGoogleLetterAvatarSvg } from "./lib/avatar";
import { derivePlaceFromEmailOrDomain } from "./utils/businessDomainUtils";
import {
  sendSocialNotification,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  subscribeToChats,
  sendChatMessageToBunnyDB,
  markChatThreadAsRead,
  deleteChatThreadFromBunnyDB,
  deduplicateChatHistory,
  getThreadPartnerKey,
  deduplicateChatThreads
} from "./lib/socialSync";
import { buildCommentTree } from "./utils/commentUtils";

export function App() {
  // 0. Cache-Busting & Smart Sync Logic
  useEffect(() => {
    // Current App Version Timestamp
    const APP_VERSION = "2026-09-16-V34-CANONICAL-SEO-AND-SEARCH-INDEXING"; 
    try {
      localStorage.setItem("yoouz_app_version", APP_VERSION);
      
      // Safety: Purge old service workers to prevent aggressive caching
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for(let reg of registrations) reg.unregister();
        });
      }
    } catch (e) {}
  }, []);

  // Fast local storage state setup without page reload
  useEffect(() => {
    // Preserved: Do not clear user videos or data
  }, []);

  // 1. Core State with LocalStorage Persistence (Instant Logo & Banner Caching)
  const [places, setPlaces] = useState<Place[]>(() => {
    const defaultYoouzPlace: Place = {
      ...derivePlaceFromEmailOrDomain('yoouz.com', []),
      id: 'yoouz.com',
      name: 'Yoouz',
      category: 'Video Reviews & Discovery Platform',
      categoryType: 'all',
      address: '',
      city: '',
      country: '',
      website: 'https://yoouz.com',
      brandDomain: 'yoouz.com',
      logoUrl: YOOUZ_LOGO_DATA_URI,
      avatarUrl: YOOUZ_LOGO_DATA_URI,
      isClaimed: true,
      isVerified: true,
      claimedByEmail: 'info@yoouz.com',
      rating: 5.0,
      totalReviews: 1
    } as Place;

    try {
      const deletedPlaceIds = getDeletedPlaceIds();
      const cached = localStorage.getItem("yoouz_cached_places");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const list = parsed
            .filter((p: any) => !isPlaceDeleted(p, deletedPlaceIds))
            .map((p: any) => {
              // Strip any mock/fake/unsplash banners aggressively from the local cache on boot
              if (p.bannerUrl && (p.bannerUrl.includes('unsplash.com') || p.bannerUrl.includes('placeholder') || p.bannerUrl.includes('mock'))) {
                p.bannerUrl = "";
              }
              if (p.ogImage && (p.ogImage.includes('unsplash.com') || p.ogImage.includes('placeholder') || p.ogImage.includes('mock'))) {
                p.ogImage = "";
              }
              const isYoouz = p.id === 'yoouz.com' || (p.name && p.name.toLowerCase() === 'yoouz') || p.brandDomain === 'yoouz.com';
              return {
                ...p,
                logoUrl: isYoouz ? YOOUZ_LOGO_DATA_URI : p.logoUrl,
                avatarUrl: isYoouz ? YOOUZ_LOGO_DATA_URI : p.avatarUrl,
                address: isYoouz ? "" : (p.address?.includes("1111 Lincoln") ? "" : p.address),
                city: isYoouz ? "" : (p.city?.includes("Miami Beach") ? "" : p.city),
                country: isYoouz ? "" : p.country,
                lat: isYoouz ? 0 : p.lat,
                lng: isYoouz ? 0 : p.lng,
                isClaimed: isYoouz ? true : Boolean(p.isClaimed),
                isVerified: isYoouz ? true : Boolean(p.isVerified),
                claimedByEmail: isYoouz ? 'info@yoouz.com' : p.claimedByEmail,
                rating: typeof p.rating === "number" && !isNaN(p.rating) ? p.rating : (Number(p.rating) || 5.0),
                totalReviews: typeof p.totalReviews === "number" ? p.totalReviews : (Number(p.totalReviews) || 0)
              };
            });
          if (!list.some(p => p.id === 'yoouz.com' || (p.name && p.name.toLowerCase() === 'yoouz'))) {
            list.unshift(defaultYoouzPlace);
          }
          return list;
        }
      }
    } catch(e){}
    return [defaultYoouzPlace];
  });
  
  useEffect(() => {
    try {
      localStorage.setItem("yoouz_cached_places", JSON.stringify(places));
    } catch (e) {}
  }, [places]);

  const { videos, setVideos, isLoading: isLoadingVideos, loadMore: loadMoreVideos, hasMore } = useFeedPagination();
  const [notifications, setNotifications] = useState<CopoNotification[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("copo_saved_place_ids");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [savedCreators, setSavedCreators] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("yoouz_saved_creators");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [messages, setMessages] = useState<CopoMessage[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);

  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [inAppToast, setInAppToast] = useState<InAppToastPayload | null>(null);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstNotifLoadRef = useRef<boolean>(true);
  const prevChatHistoryLengthRef = useRef<Map<string, number>>(new Map());
  const isFirstChatLoadRef = useRef<boolean>(true);

  // 2. Navigation & Active Tab States
  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    // Immediate sync from URL on boot to prevent flash of home
    try {
      const pathname = window.location.pathname;
      if (pathname === "/yoouzadmin" || pathname.startsWith("/yoouzadmin")) return "admin";
      if (pathname === "/testembed" || pathname === "/test-embed" || pathname === "/embed-test") return "testembed";
      if (pathname === "/business" || pathname.startsWith("/business/") || pathname === "/portal" || pathname === "/business-dashboard") return "business";
      if (pathname === "/discover") return "discover";
      if (pathname === "/following") return "following";
      if (pathname === "/search") return "search";
      if (pathname === "/map") return "map";
      if (pathname === "/notifications") return "notifications";
      if (pathname === "/messages" || pathname.startsWith("/messages/")) return "messages";
      if (pathname === "/bookmarks" || pathname === "/saved") return "bookmarks";
      if (pathname === "/record_review") return "record_review";
      if (pathname === "/profile" || pathname === "/me") return "profile";
      if (pathname.startsWith("/profile/") || pathname.startsWith("/@")) return "home"; // Drawer opens on top of home
      
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const sectionParam = params.get("section") || (hash.startsWith("#/") && !hash.startsWith("#/place/") && !hash.startsWith("#/creator/") && !hash.startsWith("#/video/") ? hash.replace("#/", "") : null);
      if (sectionParam && ["discover", "map", "notifications", "messages", "bookmarks", "profile", "admin", "business", "search", "record_review", "following"].includes(sectionParam)) {
        return sectionParam as NavSection;
      }
    } catch (e) {}
    return "home";
  });
  const [activeSubTab, setActiveSubTab] = useState<FeedSubTab>("discover");
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [searchResetKey, setSearchResetKey] = useState<number>(0);
  const [recordReviewResetKey, setRecordReviewResetKey] = useState<number>(0);

  // Background Upload state for in-app navigation & bottom progress bar
  const [backgroundUpload, setBackgroundUpload] = useState<{
    isPublishing: boolean;
    progress: number;
    placeName: string;
  } | null>(null);

  useEffect(() => {
    if (!backgroundUpload?.isPublishing) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const msg = "Publishing... Keep Yoouz open until 100% complete.";
      e.returnValue = msg;
      return msg;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [backgroundUpload?.isPublishing]);

  // 3. Drawers & Modals States
    const previousSectionRef = useRef<NavSection | null>(null);
  const previousVideoIndexRef = useRef<number>(0);
  const savedHomeVideoIndexRef = useRef<number>(0);
  const [selectedPlaceIdForDrawer, setSelectedPlaceIdForDrawer] = useState<string | null>(null);
  const [embedTargetId, setEmbedTargetId] = useState<string | null>(() => {
    try {
      const pathname = window.location.pathname;
      if (pathname === "/testembed" || pathname === "/test-embed" || pathname === "/embed-test") return null;
      const params = new URLSearchParams(window.location.search);
      if (params.get("embed")) return decodeURIComponent(params.get("embed")!);
      const vidMatch = pathname.match(/^\/embed\/(?:video|v)\/([^\/]+)/i);
      if (vidMatch && vidMatch[1]) return decodeURIComponent(vidMatch[1]);
      const placeMatch = pathname.match(/^\/embed\/(?:place|p)\/([^\/]+)/i);
      if (placeMatch && placeMatch[1]) return decodeURIComponent(placeMatch[1]);
      const match = pathname.match(/^\/(?:embed|e)\/([^\/]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]);
      if (pathname === "/embed" || pathname === "/embed/") return "yoouz.com";
    } catch (e) {}
    return null;
  });
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
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState<boolean>(false);
  const [isMobileNavDrawerOpen, setIsMobileNavDrawerOpen] = useState<boolean>(false);
  const [hiddenVideoIds, setHiddenVideoIds] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("yoouz_hidden_videos") || "[]");
      if (Array.isArray(parsed)) return parsed;
      return [];
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

  const handleUnblockUser = (userId: string, userName?: string) => {
    setBlockedUserIds((prev) => {
      const cleanId = (userId || "").toLowerCase().trim().replace(/^@/, "");
      const cleanName = (userName || "").toLowerCase().trim().replace(/^@/, "");
      const next = prev.filter((id) => {
        const item = (id || "").toLowerCase().trim().replace(/^@/, "");
        if (cleanId && (item === cleanId || item.includes(cleanId) || cleanId.includes(item))) return false;
        if (cleanName && (item === cleanName || item.includes(cleanName) || cleanName.includes(item))) return false;
        return true;
      });
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
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("copo_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isUserDeleted(parsed)) {
          localStorage.removeItem("copo_user_profile");
          localStorage.removeItem("copo_user");
          localStorage.removeItem("copo_business_verified_session");
          return null;
        }
        const storedNotifs = localStorage.getItem("copo_notification_settings");
        if (storedNotifs) {
          try {
            parsed.notificationSettings = {
              ...DEFAULT_NOTIFICATION_PREFERENCES,
              ...JSON.parse(storedNotifs)
            };
          } catch (e) {}
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Helper to verify if user profile is activated with mandatory First & Last name
  const isProfileComplete = (user: UserProfile | null) => {
    if (!user) return false;
    const fName = (user.firstName || "").trim();
    const lName = (user.lastName || "").trim();
    if (fName && lName) return true;
    const fullName = (user.name || "").trim();
    if (fullName && !fullName.includes('@') && fullName !== 'Registered User' && fullName !== 'User' && fullName.includes(' ') && !fullName.toLowerCase().startsWith('usr_') && !fullName.toLowerCase().startsWith('user_')) {
      return true;
    }
    return false;
  };

  const handleSaveNotificationSettings = async (newSettings: NotificationPreferences) => {
    // 1. Instant synchronous local persistence
    try {
      localStorage.setItem("copo_notification_settings", JSON.stringify(newSettings));
    } catch (e) {}

    const currentEmail = currentUser?.email || auth.currentUser?.email || "";
    const currentUid = auth.currentUser?.uid || (currentUser as any)?.uid || (currentUser as any)?.id || "";

    setCurrentUser((prev) => {
      if (!prev) return null;
      const nextUser: UserProfile = {
        ...prev,
        notificationSettings: newSettings
      };
      try {
        localStorage.setItem("copo_user_profile", JSON.stringify(nextUser));
      } catch (e) {}
      return nextUser;
    });

    // 2. Real-time Live Database Update (BunnyDB users collection)
    const BunnyDBPromises: Promise<any>[] = [];


    // 3. Real-time Live Database Update (Server NoSQL API)
    const targetUid = currentUid || (currentEmail ? `usr_${currentEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : 'guest');
    const nosqlPromises: Promise<any>[] = [
      fetch(`/api/nosql/users/${targetUid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { notificationSettings: newSettings }, merge: true })
      }).catch((err) => console.warn("NoSQL notification sync warning:", err))
    ];

    if (currentEmail && targetUid !== `usr_${currentEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`) {
      nosqlPromises.push(
        fetch(`/api/nosql/users/usr_${currentEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { notificationSettings: newSettings }, merge: true })
        }).catch(() => {})
      );
    }

    await Promise.allSettled([...BunnyDBPromises, ...nosqlPromises]);
  };

  const [preselectedPlaceForRecording, setPreselectedPlaceForRecording] = useState<Place | null>(null);
  const [businessClaimTargetPlace, setBusinessClaimTargetPlace] = useState<Place | null>(null);
  const [businessInitialMode, setBusinessInitialMode] = useState<'signin' | 'claim' | 'demo'>('signin');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [comparisonCompetitor, setComparisonCompetitor] = useState<string>('yelp');
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<boolean>(false);
  const [deactivateSuccessToast, setDeactivateSuccessToast] = useState<boolean>(false);

  const forceLogoutUser = (reason?: string) => {
    try {
      localStorage.removeItem("copo_user_profile");
      localStorage.removeItem("copo_user");
      localStorage.removeItem("copo_business_verified_session");
      sessionStorage.removeItem("copo_temp_user");
      sessionStorage.removeItem("copo_business_session");
    } catch (e) {}

    setCurrentUser(null);
    setIsCreateModalOpen(false);
    setIsAuthModalOpen(false);

    try {
      logOutUser().catch(() => {});
    } catch (e) {}

    try {
      window.dispatchEvent(new CustomEvent("copo_auth_changed", { detail: null }));
    } catch (e) {}

    if (reason) {
      console.warn("[Yoouz Auth] Session terminated:", reason);
    }
  };

  const videosRef = useRef(videos);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Parse URL on initial load and handle browser back/forward navigation
  useEffect(() => {
    const syncFromUrl = () => {
      try {
        const pathname = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        if (pathname === "/testembed" || pathname === "/test-embed" || pathname === "/embed-test") {
          setEmbedTargetId(null);
          setActiveSection("testembed");
          return;
        }

        const vidMatch = pathname.match(/^\/embed\/(?:video|v)\/([^\/]+)/i);
        const placeMatch = pathname.match(/^\/embed\/(?:place|p)\/([^\/]+)/i);
        const match = pathname.match(/^\/(?:embed|e)\/([^\/]+)/i);
        const queryEmbed = params.get("embed");

        if (queryEmbed) {
          setEmbedTargetId(decodeURIComponent(queryEmbed));
          return;
        } else if (vidMatch && vidMatch[1]) {
          setEmbedTargetId(decodeURIComponent(vidMatch[1]));
          return;
        } else if (placeMatch && placeMatch[1]) {
          setEmbedTargetId(decodeURIComponent(placeMatch[1]));
          return;
        } else if (match && match[1]) {
          setEmbedTargetId(decodeURIComponent(match[1]));
          return;
        } else if (pathname === "/embed" || pathname === "/embed/") {
          setEmbedTargetId("yoouz.com");
          return;
        } else {
          setEmbedTargetId(null);
        }

        if (window.location.pathname === "/yoouzadmin" || window.location.pathname.startsWith("/yoouzadmin")) {
          setActiveSection("admin");
          return;
        }
        const hash = window.location.hash;

        let placeParam = params.get("place") || params.get("placeId") || params.get("p") || params.get("business") || (hash.startsWith("#/place/") ? hash.replace("#/place/", "") : null);
        if (!placeParam && hash.includes("placeId=")) {
          const hashParams = new URLSearchParams(hash.split("?")[1] || "");
          placeParam = hashParams.get("placeId") || hashParams.get("place");
        }
        let creatorParam = params.get("creator") || params.get("c") || params.get("user") || params.get("u") || (hash.startsWith("#/creator/") ? hash.replace("#/creator/", "") : null);
        let videoParam = params.get("video") || params.get("v") || (hash.startsWith("#/video/") ? hash.replace("#/video/", "") : null);
        let sectionParam = params.get("section") || (hash.startsWith("#/") && !hash.startsWith("#/place/") && !hash.startsWith("#/creator/") && !hash.startsWith("#/video/") ? hash.replace("#/", "") : null);

        // Pathname parsing for elite SEO routes (e.g. /review/domain.com/rev-12345 or /review/rev-12345)
        if (!videoParam) {
          const revMatch = pathname.match(/(rev-[a-zA-Z0-9_\-]+)/i);
          if (revMatch) {
            videoParam = revMatch[1];
          } else {
            const userVideoMatch = pathname.match(/^\/@([^\/]+)\/video\/([^\/]+)/) || pathname.match(/^\/creator\/([^\/]+)\/video\/([^\/]+)/);
            if (userVideoMatch) {
              creatorParam = userVideoMatch[1];
              videoParam = userVideoMatch[2];
            } else {
              const vMatch = pathname.match(/^\/(v|video|review)\/([^\/]+)(?:\/([^\/]+))?/);
              if (vMatch) {
                videoParam = vMatch[3] || vMatch[2];
              }
            }
          }
        }
        if (!creatorParam) {
          const cMatch = pathname.match(/^\/@([^\/]+)/) || pathname.match(/^\/profile\/([^\/]+)/) || pathname.match(/^\/creator\/([^\/]+)/) || pathname.match(/^\/user\/([^\/]+)/);
          if (cMatch) {
            creatorParam = cMatch[1];
          }
        }
        if (!placeParam) {
          const pMatch = pathname.match(/^\/place\/([^\/]+)/);
          if (pMatch) {
            placeParam = pMatch[1];
          } else {
            const bMatch = pathname.match(/^\/business\/([^\/]+)/);
            if (bMatch && bMatch[1] !== "dashboard" && bMatch[1] !== "claim" && bMatch[1] !== "portal") {
              placeParam = bMatch[1];
            }
          }
        }
        if (!sectionParam) {
          if (pathname === "/business" || pathname === "/business/claim" || pathname === "/business/dashboard" || pathname === "/portal" || pathname === "/business-dashboard") sectionParam = "business";
          if (pathname === "/discover") sectionParam = "discover";
          if (pathname === "/following") sectionParam = "following";
          if (pathname === "/search") sectionParam = "search";
          if (pathname === "/map") sectionParam = "map";
          if (pathname === "/notifications") sectionParam = "notifications";
          if (pathname === "/messages" || pathname.startsWith("/messages/")) sectionParam = "messages";
          if (pathname === "/bookmarks" || pathname === "/saved") sectionParam = "bookmarks";
          if (pathname === "/record_review") sectionParam = "record_review";
          if (pathname === "/profile" || pathname === "/me") sectionParam = "profile";
        }

        // Competitor comparison and GEO routes
        if (pathname.includes('/vs/') || pathname === '/compare' || pathname.includes('/alternatives/')) {
          let comp = 'yelp';
          if (pathname.includes('google')) comp = 'google';
          else if (pathname.includes('trustpilot')) comp = 'trustpilot';
          else if (pathname.includes('tripadvisor')) comp = 'tripadvisor';
          setComparisonCompetitor(comp);
          setIsComparisonModalOpen(true);
        }

        if (placeParam) {
          const cleanPlaceId = decodeURIComponent(placeParam);
          setSelectedPlaceIdForDrawer(cleanPlaceId);
          setSelectedAuthorForDrawer(null);

          const shouldTriggerRecord = 
            params.get("action") === "record" || 
            params.get("record") === "1" || 
            params.get("record") === "true" ||
            hash.includes("record_review") ||
            pathname.startsWith("/record/");

          if (shouldTriggerRecord) {
            setTimeout(() => {
              const targetPlace = (places || []).find((p: Place) => 
                p.id === cleanPlaceId || 
                getPlaceSlug(p) === cleanPlaceId || 
                (p.name && p.name.toLowerCase() === cleanPlaceId.toLowerCase())
              );
              if (targetPlace) {
                handleOpenCreateReview(targetPlace);
              }
            }, 300);
          }
        } else if (creatorParam) {
          const rawParam = decodeURIComponent(creatorParam).replace(/^@+/, "").toLowerCase().trim();
          
          // Check if this handle / param corresponds to a business or place
          const matchingPlace = (places || []).find((p: Place) => {
            const pId = (p.id || "").toLowerCase().trim();
            const pName = (p.name || "").toLowerCase().trim();
            const pDomain = (p.website || (p as any).brandDomain || (p as any).domain || p.id || "")
              .toLowerCase()
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "")
              .split("/")[0]
              .trim();
            const pSlug = pName.replace(/[^a-z0-9]/g, "");
            const rSlug = rawParam.replace(/[^a-z0-9]/g, "");

            return (
              pId === rawParam ||
              pId === `${rawParam}.com` ||
              pDomain === rawParam ||
              pDomain === `${rawParam}.com` ||
              pName === rawParam ||
              (rSlug.length > 2 && pSlug === rSlug) ||
              rawParam === "legal500" ||
              rawParam === "legal500.com"
            );
          });

          if (rawParam === "yoouz" || rawParam === "yoouz.com") {
            setSelectedPlaceIdForDrawer(null);
            setSelectedAuthorForDrawer({
              name: "Yoouz",
              handle: "@yoouz",
              email: "info@yoouz.com",
              id: "yoouz",
              userId: "yoouz",
              avatar: "/favicon.svg",
              bio: "Official Yoouz Support & Community Platform",
              location: "Global Platform",
              isVerified: true,
              followersCount: 10000,
            });
            try {
              window.history.replaceState(null, "", `/@yoouz`);
            } catch (e) {}
          } else if (matchingPlace || rawParam === "legal500" || rawParam === "legal500.com") {
            const targetPlaceId = matchingPlace ? matchingPlace.id : "legal500.com";
            setSelectedPlaceIdForDrawer(targetPlaceId);
            setSelectedAuthorForDrawer(null);
            try {
              window.history.replaceState(null, "", `/place/${getPlaceSlug(targetPlaceId)}`);
            } catch (e) {}
          } else {
            // STRICT POLICY 31: Fake/mock "reviewer" pages are strictly banned
            const isDisallowedSlug = !rawParam || 
              rawParam === "reviewer" || 
              rawParam === "user" || 
              rawParam === "registered-user" || 
              rawParam === "verified-reviewer" || 
              rawParam === "community-creator";

            if (isDisallowedSlug) {
              setSelectedAuthorForDrawer(null);
              setSelectedPlaceIdForDrawer(null);
              try { window.history.replaceState(null, "", "/"); } catch (e) {}
              return;
            }

            const rawClean = rawParam.replace(/^@+/, "").toLowerCase().trim();
            const rawCompact = rawClean.replace(/[^a-z0-9]/g, "");
            const rawSlug = rawClean.replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");

            const matchingVid = videosRef.current.find((v) => {
              if (!v.author) return false;
              const authorName = (v.author.name || "").trim().toLowerCase();
              const authorHandle = (v.author.handle || "").replace(/^@+/, "").trim().toLowerCase();
              const nameSlug = authorName.replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
              const nameCompact = authorName.replace(/[^a-z0-9]/g, "");
              const handleCompact = authorHandle.replace(/[^a-z0-9]/g, "");
              const userEmail = (v as any).userEmail ? (v as any).userEmail.split("@")[0].toLowerCase() : "";

              return (
                authorHandle === rawClean ||
                authorHandle === rawSlug ||
                authorName === rawClean ||
                nameSlug === rawSlug ||
                (rawCompact.length > 2 && (nameCompact === rawCompact || handleCompact === rawCompact)) ||
                (userEmail && userEmail === rawClean)
              );
            });

            if (matchingVid && matchingVid.author) {
              setSelectedAuthorForDrawer(matchingVid.author);
              setSelectedPlaceIdForDrawer(null);
            } else if (KNOWN_COMMUNITY_USERS[rawClean] || KNOWN_COMMUNITY_USERS[rawSlug] || KNOWN_COMMUNITY_USERS[rawCompact]) {
              const ku = KNOWN_COMMUNITY_USERS[rawClean] || KNOWN_COMMUNITY_USERS[rawSlug] || KNOWN_COMMUNITY_USERS[rawCompact];
              setSelectedAuthorForDrawer({
                name: ku.name,
                avatar: getSafeAvatarUrl(ku.avatar, ku.name, ku.name),
                bio: ku.bio || "Verified video reviewer on Yoouz.",
                location: ku.location || "",
                isVerified: true,
                isFollowed: false
              });
              setSelectedPlaceIdForDrawer(null);
            } else {
              // Check registered users for authentic profile
              fetch(`/api/nosql/users`)
                .then(res => res.json())
                .then(usersList => {
                  if (Array.isArray(usersList)) {
                    const matched = usersList.find((u: any) => {
                      const uName = (u.name || "").trim().toLowerCase();
                      const uNameSlug = uName.replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
                      const uHandle = (u.handle || "").replace(/^@+/, "").trim().toLowerCase();
                      const uEmail = (u.email || "").split("@")[0].toLowerCase();
                      const uCompact = uName.replace(/[^a-z0-9]/g, "");
                      return (
                        uName === rawClean ||
                        uNameSlug === rawSlug ||
                        uHandle === rawClean ||
                        uEmail === rawClean ||
                        (rawCompact.length > 2 && (uCompact === rawCompact || uHandle.replace(/[^a-z0-9]/g, "") === rawCompact))
                      );
                    });
                    if (matched && matched.name && matched.name.toLowerCase() !== "reviewer") {
                      setSelectedAuthorForDrawer({
                        name: matched.name,
                        avatar: getSafeAvatarUrl(matched.avatar, matched.name, matched.handle || matched.email || matched.name),
                        bio: matched.bio || "",
                        banner: matched.banner || "",
                        location: matched.location || "",
                        isVerified: matched.isVerified !== false,
                        isFollowed: false
                      });
                      setSelectedPlaceIdForDrawer(null);
                    } else {
                      // No authentic creator found; never fabricate mock pages
                      setSelectedAuthorForDrawer(null);
                      setSelectedPlaceIdForDrawer(null);
                      try { window.history.replaceState(null, "", "/"); } catch (e) {}
                    }
                  }
                })
                .catch(() => {
                  setSelectedAuthorForDrawer(null);
                  setSelectedPlaceIdForDrawer(null);
                });
            }
          }
        } else {
          setSelectedPlaceIdForDrawer(null);
          setSelectedAuthorForDrawer(null);
          if (
            sectionParam &&
            ["discover", "map", "notifications", "messages", "bookmarks", "profile", "admin", "search", "record_review", "following"].includes(sectionParam)
          ) {
            setActiveSection(sectionParam as NavSection);
          }
        }

        if (videoParam) {
          const targetVidId = decodeURIComponent(videoParam);
          const idx = videosRef.current.findIndex((v) => v.id === targetVidId);
          if (idx !== -1) {
            setCurrentVideoIndex(idx);
          } else {
            // Fetch from server API to ensure seed JSON data is merged with BunnyDB
            fetch(`/api/nosql/videoReviews/${targetVidId}`)
              .then(res => res.json())
              .then(vidData => {
                if (vidData && vidData.id) {
                  setVideos((prev) => {
                    if (prev.some((v) => v.id === vidData.id)) return prev;
                    return [vidData as VideoReview, ...prev];
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

  // Self-healing synchronization: push any locally cached/created user reviews to server & BunnyDB on boot (skipping deleted)
  useEffect(() => {
    try {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(deletedStr); } catch (e) {}
      const delSet = new Set(deletedIds.map(String));

      const localPubStr = localStorage.getItem("yoouz_local_created_reviews");
      if (localPubStr) {
        const list = JSON.parse(localPubStr);
        if (Array.isArray(list) && list.length > 0) {
          const nonDeleted = list.filter((rev: any) => rev && rev.id && !delSet.has(String(rev.id)));
          if (nonDeleted.length !== list.length) {
            localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(nonDeleted));
          }
          nonDeleted.forEach((rev: any) => {
            if (rev && rev.id) {
              fetch("/api/videos/save-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(rev)
              }).catch(() => {});
            }
          });
        }
      }
    } catch (e) {}
  }, []);

  // Global cross-device & cross-tab real-time deletion synchronization
  useEffect(() => {
    const handleDeletedEvent = (e: any) => {
      const targetId = e?.detail?.videoId;
      if (!targetId) return;
      const strId = String(targetId);

      // Instantly update places state reviews
      setPlaces(prev => prev.map(p => {
        const remainingReviews = (p.reviews || []).filter(r => String(r.id) !== strId);
        const wasInPlace = (p.reviews || []).some(r => String(r.id) === strId);
        return {
          ...p,
          reviews: remainingReviews,
          totalReviews: Math.max(0, (p.totalReviews || 0) - (wasInPlace ? 1 : 0))
        };
      }));

      // Close comments or share modals if they belonged to the deleted video
      setActiveCommentVideo(prev => (prev && String(prev.id) === strId ? null : prev));
      setActiveShareVideo(prev => (prev && String(prev.id) === strId ? null : prev));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "copo_deleted_videos" && e.newValue) {
        try {
          const deletedIds: string[] = JSON.parse(e.newValue);
          if (Array.isArray(deletedIds) && deletedIds.length > 0) {
            const delSet = new Set(deletedIds.map(String));
            setVideos(prev => prev.filter(v => !delSet.has(String(v.id))));
            setPlaces(prev => prev.map(p => ({
              ...p,
              reviews: (p.reviews || []).filter(r => !delSet.has(String(r.id)))
            })));
          }
        } catch (err) {}
      }
    };

    window.addEventListener("copo-video-deleted", handleDeletedEvent);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("copo-video-deleted", handleDeletedEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleAdminDeleteVideo = async (id: string) => {
    if (!id) return;
    const targetId = String(id);

    // Identify target video before deletion
    const targetVideo = videos.find(v => String(v.id) === targetId);

    // 1. Instantly remove from local videos state
    const remainingVideos = videos.filter(v => String(v.id) !== targetId);
    setVideos(remainingVideos);

    // 2. Remove from places reviews list & recalculate counts accurately
    setPlaces(prev => {
      const updated = prev.map(p => {
        const placeRemainingVideos = remainingVideos.filter(v => isPlaceReviewMatch(v, p));
        const newCount = placeRemainingVideos.length;
        const newRating = newCount > 0
          ? Number((placeRemainingVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / newCount).toFixed(1))
          : (p.rating || 5.0);

        const isAffected = targetVideo ? isPlaceReviewMatch(targetVideo, p) : false;

        const updatedPlace = {
          ...p,
          reviews: (p.reviews || []).filter(r => String(r.id) !== targetId),
          totalReviews: newCount,
          videoReviewCount: newCount,
          rating: newRating
        };

        if (isAffected && p.id) {
          // Persist the updated count directly to BunnyDB
          fetch(`/api/nosql/places/${encodeURIComponent(p.id)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              data: {
                ...updatedPlace,
                totalReviews: newCount,
                videoReviewCount: newCount,
                rating: newRating
              }, 
              merge: true 
            })
          }).catch(() => {});
        }

        return updatedPlace;
      });

      try {
        localStorage.setItem("yoouz_cached_places", JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    // 3. Dismiss any active modal/drawer viewing this deleted video
    setActiveCommentVideo(prev => (prev?.id === targetId ? null : prev));
    setActiveShareVideo(prev => (prev?.id === targetId ? null : prev));

    // 4. Save to deleted videos list to prevent re-merging from any cache
    try {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedVideos: string[] = [];
      try { deletedVideos = JSON.parse(deletedStr); } catch(e){}
      if (!deletedVideos.includes(targetId)) {
        deletedVideos.push(targetId);
        localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedVideos));
      }

      // Clean active and legacy local storage caches
      const cacheKeys = [
        YOOUZ_VIDEOS_CACHE_KEY,
        "yoouz_cached_videos_v28",
        "yoouz_cached_videos_v27",
        "yoouz_cached_videos_v26",
        "yoouz_cached_videos_v25",
        "copo_videos"
      ];
      cacheKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter((item: any) => item && item.id !== targetId);
              localStorage.setItem(k, JSON.stringify(cleaned));
            } else {
              localStorage.removeItem(k);
            }
          }
        } catch (e) {}
      });

      // Clean local published reviews
      try {
        const localPubStr = localStorage.getItem("yoouz_local_created_reviews");
        if (localPubStr) {
          const parsedLocal = JSON.parse(localPubStr);
          if (Array.isArray(parsedLocal)) {
            const cleaned = parsedLocal.filter((item: any) => item && item.id !== targetId);
            localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(cleaned));
          }
        }
      } catch (e) {}
    } catch (e) {}

    // 5. Clear IndexedDB cache
    deleteVideoBlobFromIndexedDB(targetId).catch(() => {});

    // 6. Broadcast window event for instant local component reactivity
    window.dispatchEvent(new CustomEvent("copo-video-deleted", { detail: { videoId: targetId } }));
    
    // 7. Call backend deletion APIs (purges BunnyDB, files, Bunny CDN, memory cache & broadcasts SSE)
    try {
      fetch("/api/videos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: targetId })
      }).catch(() => {});

      fetch("/api/admin/videos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: targetId })
      }).catch(() => {});

      fetch(`/api/nosql/videoReviews/${encodeURIComponent(targetId)}`, {
        method: "DELETE"
      }).catch(() => {});
    } catch (e) {}

    // 8. Delete directly from BunnyDB
    try {

    } catch (err) {}
  };

  const handleAdminBulkDeleteVideos = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetIds = ids.map(String);
    const idSet = new Set(targetIds);

    // 1. Instantly remove from local videos state
    const remainingVideos = videos.filter(v => !idSet.has(String(v.id)));
    setVideos(remainingVideos);

    // 2. Remove from places reviews list & accurately recalculate counts
    setPlaces(prev => {
      const updated = prev.map(p => {
        const placeRemainingVideos = remainingVideos.filter(v => isPlaceReviewMatch(v, p));
        const newCount = placeRemainingVideos.length;
        const newRating = newCount > 0
          ? Number((placeRemainingVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / newCount).toFixed(1))
          : (p.rating || 5.0);

        return {
          ...p,
          reviews: (p.reviews || []).filter(r => !idSet.has(String(r.id))),
          totalReviews: newCount,
          videoReviewCount: newCount,
          rating: newRating
        };
      });

      try {
        localStorage.setItem("yoouz_cached_places", JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    // 3. Dismiss any active modal/drawer viewing any of these deleted videos
    setActiveCommentVideo(prev => (prev && idSet.has(prev.id) ? null : prev));
    setActiveShareVideo(prev => (prev && idSet.has(prev.id) ? null : prev));

    // 4. Save deleted video IDs to prevent re-merging
    try {
      const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
      let deletedVideos: string[] = [];
      try { deletedVideos = JSON.parse(deletedStr); } catch(e){}
      targetIds.forEach(id => {
        if (!deletedVideos.includes(id)) deletedVideos.push(id);
      });
      localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedVideos));

      // Clean active and legacy local storage caches
      const cacheKeys = [
        YOOUZ_VIDEOS_CACHE_KEY,
        "yoouz_cached_videos_v28",
        "yoouz_cached_videos_v27",
        "yoouz_cached_videos_v26",
        "yoouz_cached_videos_v25",
        "copo_videos"
      ];
      cacheKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter((item: any) => item && !idSet.has(String(item.id)));
              localStorage.setItem(k, JSON.stringify(cleaned));
            } else {
              localStorage.removeItem(k);
            }
          }
        } catch (e) {}
      });

      // Clean local published reviews
      try {
        const localPubStr = localStorage.getItem("yoouz_local_created_reviews");
        if (localPubStr) {
          const parsedLocal = JSON.parse(localPubStr);
          if (Array.isArray(parsedLocal)) {
            const cleaned = parsedLocal.filter((item: any) => item && !idSet.has(String(item.id)));
            localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(cleaned));
          }
        }
      } catch (e) {}
    } catch (e) {}

    // 5. Clear IndexedDB cache for bulk deleted videos
    targetIds.forEach(id => deleteVideoBlobFromIndexedDB(id).catch(() => {}));

    // 6. Broadcast window events
    targetIds.forEach(id => {
      window.dispatchEvent(new CustomEvent("copo-video-deleted", { detail: { videoId: id } }));
    });
    
    // 7. Call backend admin API & video delete endpoints
    try {
      fetch("/api/admin/videos/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: targetIds })
      }).catch(() => {});

      targetIds.forEach(id => {
        fetch("/api/videos/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: id })
        }).catch(() => {});
        fetch(`/api/nosql/videoReviews/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
      });
    } catch (e) {}

    // 8. Delete directly from BunnyDB
    try {

    } catch (err) {}
  };

  const handleAdminPurgeAllVideos = async () => {
    // 1. Instantly clear local videos state
    setVideos([]);
    setPlaces(prev => prev.map(p => ({ ...p, reviews: [], totalReviews: 0 })));
    setActiveCommentVideo(null);
    setActiveShareVideo(null);

    try {
      localStorage.removeItem("copo_videos");
      localStorage.removeItem("copo_deleted_videos");
      localStorage.removeItem(YOOUZ_VIDEOS_CACHE_KEY);
      localStorage.removeItem("yoouz_cached_videos_v28");
      localStorage.removeItem("yoouz_cached_videos_v27");
      localStorage.removeItem("yoouz_cached_videos_v26");
      localStorage.removeItem("yoouz_cached_videos_v25");
    } catch (e) {}

    clearAllVideoBlobsFromIndexedDB().catch(() => {});

    window.dispatchEvent(new CustomEvent("copo-videos-purged"));

    // 2. Clear backend uploads on server
    try {
      fetch("/api/admin/videos/purge-all", { method: "POST" }).catch(() => {});
    } catch (e) {}

    // 3. Purge all videoReviews and videos from BunnyDB
    try {

    } catch (err) {
      console.warn("Failed to purge video reviews from BunnyDB:", err);
    }
  };

  const handleAdminDeletePlace = (id: string) => {
    const targetPlace = places.find(p => p.id === id);
    const variants = targetPlace ? getPlaceVariants(targetPlace) : [id];
    recordDeletedPlacesInLocalStorage([id, ...variants]);

    setPlaces(prev => prev.filter(p => !isPlaceDeleted(p, [id, ...variants])));

    fetch(`/api/admin/places/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, variants })
    }).catch(() => {
      fetch(`/api/nosql/places/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    });
  };

  const handleAdminBulkDeletePlaces = async (ids: string[]) => {
    const allVariants: string[] = [...ids];
    ids.forEach(id => {
      const targetPlace = places.find(p => p.id === id);
      if (targetPlace) {
        allVariants.push(...getPlaceVariants(targetPlace));
      }
    });
    recordDeletedPlacesInLocalStorage(allVariants);

    setPlaces(prev => prev.filter(p => !isPlaceDeleted(p, allVariants)));

    try {
      await fetch('/api/admin/places/bulk-delete', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, variants: allVariants })
      });
    } catch (e) {
      await Promise.all(ids.map(id => fetch(`/api/nosql/places/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {})));
    }
  };

  const handleAdminPurgeAllPlaces = async () => {
    const allPlaceIds = places.flatMap(p => getPlaceVariants(p));
    recordDeletedPlacesInLocalStorage(allPlaceIds);
    setPlaces([]);
    try {
      localStorage.setItem("yoouz_cached_places", "[]");
    } catch (e) {}

    try {
      await fetch('/api/admin/places/purge-all', {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {}
  };

  const handleAdminDeleteUser = async (userToDelete: any) => {
    const uId = (userToDelete.id || userToDelete.uid || "").toLowerCase().trim();
    const uUid = (userToDelete.uid || "").toLowerCase().trim();
    const uEmail = (userToDelete.email || "").toLowerCase().trim();
    const uName = (userToDelete.name || "").toLowerCase().trim();
    const uHandle = (userToDelete.handle || "").replace(/^@+/, "").toLowerCase().trim();

    // 1. Immediately remove from local registered users state
    setAllRegisteredUsers((prev) =>
      prev.filter((u) => {
        const thisId = (u.id || u.uid || "").toLowerCase().trim();
        const thisUid = (u.uid || "").toLowerCase().trim();
        const thisEmail = (u.email || "").toLowerCase().trim();
        const thisName = (u.name || "").toLowerCase().trim();
        const thisHandle = (u.handle || "").replace(/^@+/, "").toLowerCase().trim();

        if (uId && (thisId === uId || thisId === `usr_${uId}`)) return false;
        if (uUid && (thisUid === uUid || thisId === uUid)) return false;
        if (uEmail && thisEmail === uEmail) return false;
        if (uName && thisName === uName) return false;
        if (uHandle && thisHandle === uHandle) return false;
        return true;
      })
    );

    // Save to local storage blacklist
    try {
      recordDeletedUsersInLocalStorage([uId, uUid, uEmail, uName, uHandle]);
    } catch (e) {}

    // Check if the deleted user is the current active session
    if (currentUser && isUserDeleted(currentUser)) {
      forceLogoutUser("User deleted by admin");
    }

    // Also close drawer if viewing this user
    setSelectedAuthorForDrawer((prev) => {
      if (prev && isUserDeleted(prev)) return null;
      return prev;
    });

    // Remove their videos from the active feed
    setVideos((prev) => prev.filter((v) => !isUserDeleted(v.author || v.userId || v.authorName)));

    // 2. Call backend admin API
    try {
      if (userToDelete.role === "Business" && (userToDelete.id || userToDelete.uid)) {
        handleAdminDeletePlace(userToDelete.id || userToDelete.uid);
      }
      fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userToDelete.id || userToDelete.uid,
          uid: userToDelete.uid,
          email: userToDelete.email,
          name: userToDelete.name,
          handle: userToDelete.handle
        })
      }).catch(() => {});
      fetch(`/api/nosql/users/${encodeURIComponent(userToDelete.id || userToDelete.uid)}`, {
        method: "DELETE"
      }).catch(() => {});
    } catch (e) {}

    // 3. Delete directly from BunnyDB
    try {

    } catch (e) {}
  };

  const handleAdminUpdateUser = (updatedUser: any) => {
    const targetEmail = (updatedUser.email || "").toLowerCase().trim();
    const targetId = (updatedUser.id || updatedUser.uid || "").trim();

    setAllRegisteredUsers((prev) =>
      prev.map((u) => {
        const match =
          (targetEmail && u.email && u.email.toLowerCase() === targetEmail) ||
          (targetId && (u.id === targetId || u.uid === targetId));
        return match ? { ...u, ...updatedUser } : u;
      })
    );

    if (
      currentUser &&
      ((targetEmail && currentUser.email && currentUser.email.toLowerCase() === targetEmail) ||
        (targetId && (currentUser.id === targetId || currentUser.uid === targetId)))
    ) {
      setCurrentUser((prev: any) => (prev ? { ...prev, ...updatedUser } : prev));
    }

    fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: updatedUser.email,
        name: updatedUser.name,
        handle: updatedUser.handle,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified
      })
    }).catch(() => {});
  };

  // Synchronize URL: Keep it clean (root only) as requested by the user.
  // Synchronize App State to URL (True Client-Side Routing for SEO)
  useEffect(() => {
    try {
      let path = "/";
      let title = "Yoouz - Real Video Reviews by Real People | Authentic Business Reviews";

      if (selectedPlaceIdForDrawer) {
        const place = places.find(p => p.id === selectedPlaceIdForDrawer || extractCleanDomain(p.id) === extractCleanDomain(selectedPlaceIdForDrawer) || p.brandDomain === selectedPlaceIdForDrawer);
        const slug = getPlaceSlug(place || selectedPlaceIdForDrawer);
        path = `/place/${slug}`;
        title = place ? `${place.name} - Real Video Reviews & Ratings | Yoouz` : `${formatBusinessName(slug)} - Business Profile | Yoouz`;
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
        const currentVid = videos && currentVideoIndex >= 0 ? videos[currentVideoIndex] : null;
        const isDirectVideoRoute = window.location.pathname.startsWith("/review/") || window.location.pathname.startsWith("/v/") || window.location.pathname.startsWith("/video/") || window.location.search.includes("reviewId");
        if (currentVid && isDirectVideoRoute) {
          const domainSlug = getPlaceSlug(currentVid.placeWebsite || currentVid.placeId || currentVid.placeName || currentVid);
          path = `/review/${domainSlug}/${currentVid.id}`;
          const authorName = currentVid.author?.name || (currentVid as any)?.authorName || "Verified Reviewer";
          const placeName = formatBusinessName(currentVid.placeName || domainSlug);
          title = `${authorName}'s 60s Video Review of ${placeName} | Yoouz`;
        } else {
          path = "/";
          title = "Yoouz - Real Video Reviews by Real People | Authentic Business Reviews";
        }
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

  // BunnyDB Auth state listener and multi-tab reactive sync
  useEffect(() => {
    // Purge any accidental blacklist of valid community accounts
    try {
      const storedDeleted = localStorage.getItem("yoouz_deleted_users");
      if (storedDeleted) {
        const parsed = JSON.parse(storedDeleted);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((item: string) => {
            const s = String(item).toLowerCase();
            return !s.includes("aouisesmee") && s !== "mlio66hdr9trvofdgddgwm30rku2";
          });
          if (cleaned.length !== parsed.length) {
            localStorage.setItem("yoouz_deleted_users", JSON.stringify(cleaned));
          }
        }
      }
    } catch (e) {}

    // 1. Process Magic link token if coming from email
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const magicToken = urlParams.get("magic_token");
      const magicEmail = urlParams.get("email");

      if (magicToken && magicEmail) {
        fetch("/api/auth/verify-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: magicEmail, token: magicToken })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.user) {
              const fName = data.user.firstName || magicEmail.split("@")[0];
              const lName = data.user.lastName || "";
              const avatarSvg = generateGoogleLetterAvatarSvg(fName, 128, data.user.email || magicEmail);
              const profile: UserProfile = {
                id: data.user.uid || data.user.id,
                name: data.user.name || fName,
                email: data.user.email || magicEmail,
                avatar: data.user.avatar || avatarSvg,
                handle: data.user.handle,
                bio: data.user.bio || "Food explorer linking real businesses and websites with authentic 60-second video reviews.",
                memberSince: data.user.memberSince || "August 2026",
                isDeactivated: false
              };
              const reactivateIds = [magicEmail, data.user.email, data.user.id, data.user.uid, profile.name, profile.handle].filter(Boolean);
              unrecordDeactivatedUsersInLocalStorage(reactivateIds);
              unrecordDeletedUsersInLocalStorage(reactivateIds);
              fetch('/api/user/reactivate-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: profile.id, email: profile.email, name: profile.name, handle: profile.handle })
              }).catch(() => {});
              window.dispatchEvent(new CustomEvent("copo-user-reactivated", {
                detail: { userIds: reactivateIds }
              }));
              setCurrentUser(profile);
              localStorage.setItem("copo_user", JSON.stringify(profile));
              localStorage.setItem("copo_user_profile", JSON.stringify(profile));
              // Clean query parameters from URL
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, "", cleanUrl);
            }
          })
          .catch((err) => console.warn("Magic token verification error:", err));
      }
    } catch (e) {}

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

    // 2b. Business authentication & claim synchronization listener
    const handleBusinessAuthChanged = (e: any) => {
      const session = e?.detail;
      if (session && (session.placeId || session.domain)) {
        setPlaces((prev) =>
          prev.map((p) => {
            const matches =
              p.id === session.placeId ||
              (session.domain &&
                (p.id.includes(session.domain) ||
                  p.brandDomain === session.domain ||
                  (p.website && p.website.includes(session.domain))));
            if (matches) {
              const updated = {
                ...p,
                isClaimed: true,
                isVerified: true,
                claimedByEmail: session.businessEmail || p.claimedByEmail,
                ownerId: session.businessEmail || p.ownerId,
              };
              fetch(`/api/nosql/places/${encodeURIComponent(updated.id)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: updated, merge: true }),
              }).catch(() => {});
              return updated;
            }
            return p;
          })
        );
      }
    };
    window.addEventListener("copo_business_auth_changed", handleBusinessAuthChanged);

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

    // 4. BunnyDB onAuthStateChanged listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let savedProfile: Partial<UserProfile> = {};
        try {
          const str = localStorage.getItem("copo_user_profile");
          if (str) savedProfile = JSON.parse(str);
        } catch (e) {}

        // Priority: authentic Google photoURL or user-uploaded avatar. Never use video frames/thumbnails.
        let validAvatar = user.photoURL;
        if (!validAvatar && savedProfile.avatar) {
          const s = savedProfile.avatar;
          if (
            !s.includes("unsplash.com") &&
            !s.includes("photo-1534528741775") &&
            !s.includes("photo-1535713875002") &&
            !s.includes("dicebear") &&
            !s.includes("/api/videos/") &&
            !s.includes(".mp4") &&
            !s.includes("rev-")
          ) {
            validAvatar = getSafeAvatarUrl(s, user.displayName || user.email?.split("@")[0] || "User", user.email || user.displayName);
          }
        }
        if (!validAvatar) {
          validAvatar = generateGoogleLetterAvatarSvg(
            user.displayName || user.email?.split("@")[0] || "User",
            128,
            user.email || user.displayName
          );
        }

        let initialFollowed: string[] = [];
        try {
          const storedF = localStorage.getItem("copo_followed_authors");
          if (storedF) initialFollowed = JSON.parse(storedF);
        } catch (e) {}
        if (!initialFollowed.length && Array.isArray(savedProfile.followedAuthors)) {
          initialFollowed = savedProfile.followedAuthors;
        }

        const profileObj: UserProfile = {
          id: user.uid || (savedProfile as any)?.id || (savedProfile as any)?.uid || (user.email ? `usr_${user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : ''),
          uid: user.uid || (savedProfile as any)?.uid || (savedProfile as any)?.id || (user.email ? `usr_${user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : ''),
          name: user.displayName || savedProfile.name || user.email?.split("@")[0] || "User",
          email: user.email || savedProfile.email || "",
          avatar: validAvatar,
          bio: savedProfile.bio || "Food explorer linking real businesses and websites with authentic 60-second video reviews.",
          memberSince: savedProfile.memberSince || "August 2026",
          followedAuthors: initialFollowed,
          followingCount: initialFollowed.length,
          followersCount: typeof savedProfile.followersCount === "number" ? savedProfile.followersCount : 0,
          followers: Array.isArray(savedProfile.followers) ? savedProfile.followers : [],
          notificationSettings: (() => {
            try {
              const storedNotif = localStorage.getItem("copo_notification_settings");
              if (storedNotif) return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(storedNotif) };
            } catch (e) {}
            return savedProfile.notificationSettings ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...savedProfile.notificationSettings } : DEFAULT_NOTIFICATION_PREFERENCES;
          })()
        };

        if (user.email || user.uid) {
          unrecordDeletedUsersInLocalStorage([user.email || "", user.uid || "", profileObj.id, profileObj.name]);
          const reactivateIds = [user.email || "", user.uid || "", profileObj.id, profileObj.name, profileObj.handle].filter(Boolean);
          unrecordDeactivatedUsersInLocalStorage(reactivateIds);
          fetch('/api/user/reactivate-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: profileObj.id, uid: user.uid, email: user.email, name: profileObj.name, handle: profileObj.handle })
          }).catch(() => {});
          window.dispatchEvent(new CustomEvent("copo-user-reactivated", {
            detail: { userIds: reactivateIds }
          }));
        }
        setCurrentUser(profileObj);
        try {
          localStorage.setItem("copo_user_profile", JSON.stringify(profileObj));
        } catch (e) {}

        // Try reading custom profile data from BunnyDB if available
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (typeof (userDoc as any).exists === "function" ? (userDoc as any).exists() : Boolean((userDoc as any).exists)) {
            const data = userDoc.data();
            if (data) {
              let finalLocation = data.location || savedProfile.location || "";
              
              // Validate BunnyDB avatar - if it's a video frame, discard it and use Google/clean avatar
              let finalAvatar = profileObj.avatar;
              if (data.avatar && typeof data.avatar === "string") {
                const a = data.avatar;
                if (
                  !a.includes("unsplash.com") &&
                  !a.includes("dicebear") &&
                  !a.includes("/api/videos/") &&
                  !a.includes(".mp4") &&
                  !a.includes("rev-")
                ) {
                  finalAvatar = a;
                }
              }

              // Sync follows from BunnyDB to localStorage
              let fAuthors = initialFollowed;
              let fPlaces: string[] = [];
              if (data.followedAuthors && Array.isArray(data.followedAuthors)) {
                fAuthors = data.followedAuthors;
                localStorage.setItem("copo_followed_authors", JSON.stringify(fAuthors));
              }
              if (data.followedPlaces && Array.isArray(data.followedPlaces)) {
                fPlaces = data.followedPlaces;
                localStorage.setItem("copo_followed_places", JSON.stringify(fPlaces));
              } else {
                try {
                  fPlaces = JSON.parse(localStorage.getItem("copo_followed_places") || "[]");
                } catch(e){}
              }

              const updatedProfile: UserProfile = {
                ...profileObj,
                name: data.name || profileObj.name,
                bio: data.bio || profileObj.bio,
                avatar: finalAvatar,
                location: finalLocation,
                followedAuthors: fAuthors,
                followedPlaces: fPlaces,
                followingCount: fAuthors.length + fPlaces.length,
                followersCount: typeof data.followersCount === "number" ? data.followersCount : (profileObj.followersCount || 0),
                followers: Array.isArray(data.followers) ? data.followers : (profileObj.followers || []),
                isDeactivated: false,
                notificationSettings: data.notificationSettings
                  ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...data.notificationSettings }
                  : profileObj.notificationSettings
              };
              if (data.isDeactivated) {
                updateDoc(doc(db, "users", user.uid), {
                  isDeactivated: false
                }).catch(() => {});
              }
              setCurrentUser(updatedProfile);
              try {
                localStorage.setItem("copo_user_profile", JSON.stringify(updatedProfile));
                
                // Sync bookmarks and likes to localStorage
                let sIds = [];
                let lIds = [];
                if (data.savedVideoIds && Array.isArray(data.savedVideoIds)) {
                  sIds = data.savedVideoIds;
                  localStorage.setItem("copo_saved_video_ids", JSON.stringify(sIds));
                } else {
                  try { sIds = JSON.parse(localStorage.getItem("copo_saved_video_ids") || "[]"); } catch(e){}
                }
                if (data.likedVideoIds && Array.isArray(data.likedVideoIds)) {
                  lIds = data.likedVideoIds;
                  localStorage.setItem("copo_liked_video_ids", JSON.stringify(lIds));
                } else {
                  try { lIds = JSON.parse(localStorage.getItem("copo_liked_video_ids") || "[]"); } catch(e){}
                }
                
                // Instantly re-hydrate existing places and videos with the fresh follow and bookmark state
                setPlaces(prev => prev.map(p => ({ ...p, isFollowed: fPlaces.includes(p.id) })));
                setVideos(prev => prev.map(v => {
                  const isBm = sIds.includes(v.id);
                  const isLk = lIds.includes(v.id);
                  const curBm = typeof v.bookmarksCount === 'number' ? v.bookmarksCount : (typeof (v as any).bookmarks === 'number' ? (v as any).bookmarks : 0);
                  const curLk = typeof v.likesCount === 'number' ? v.likesCount : (typeof (v as any).likes === 'number' ? (v as any).likes : 0);
                  return { 
                    ...v, 
                    isBookmarked: isBm,
                    bookmarksCount: isBm ? Math.max(1, curBm) : curBm,
                    bookmarks: isBm ? Math.max(1, curBm) : curBm,
                    isLiked: isLk,
                    likesCount: isLk ? Math.max(1, curLk) : curLk,
                    likes: isLk ? Math.max(1, curLk) : curLk,
                    author: { ...v.author, isFollowed: fAuthors.includes(v.author.name) } 
                  };
                }));

                // Also sync interactions (bookmarks + likes) from BunnyDB
                const uIdentifier = user.email || user.uid;
                if (uIdentifier) {
                  fetch(`/api/interactions/user-interactions?userId=${encodeURIComponent(uIdentifier)}`)
                    .then(r => r.json())
                    .then(bRes => {
                      if (bRes && bRes.success) {
                        let updatedSaved = sIds;
                        let updatedLiked = lIds;
                        if (Array.isArray(bRes.savedVideoIds)) {
                          updatedSaved = Array.from(new Set([...sIds, ...bRes.savedVideoIds]));
                          localStorage.setItem("copo_saved_video_ids", JSON.stringify(updatedSaved));
                        }
                        if (Array.isArray(bRes.savedPlaceIds) && bRes.savedPlaceIds.length > 0) {
                          setSavedPlaceIds(prev => Array.from(new Set([...prev, ...bRes.savedPlaceIds])));
                        }
                        if (Array.isArray(bRes.likedVideoIds)) {
                          updatedLiked = Array.from(new Set([...lIds, ...bRes.likedVideoIds]));
                          localStorage.setItem("copo_liked_video_ids", JSON.stringify(updatedLiked));
                        }
                        setVideos(prev => prev.map(v => {
                          const isBm = updatedSaved.includes(v.id);
                          const isLk = updatedLiked.includes(v.id);
                          const curBm = typeof v.bookmarksCount === 'number' ? v.bookmarksCount : (typeof (v as any).bookmarks === 'number' ? (v as any).bookmarks : 0);
                          const curLk = typeof v.likesCount === 'number' ? v.likesCount : (typeof (v as any).likes === 'number' ? (v as any).likes : 0);
                          return {
                            ...v,
                            isBookmarked: isBm,
                            bookmarksCount: isBm ? Math.max(1, curBm) : curBm,
                            bookmarks: isBm ? Math.max(1, curBm) : curBm,
                            isLiked: isLk,
                            likesCount: isLk ? Math.max(1, curLk) : curLk,
                            likes: isLk ? Math.max(1, curLk) : curLk
                          };
                        }));
                      }
                    })
                    .catch(() => {});
                }
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
              
            } catch (geoErr) {
              console.warn("First signup IP geo-detection failed:", geoErr);
            }
        }
        } catch (e) {
          console.warn("Error fetching user from BunnyDB:", e);
        }
      } else {
        // If auth state is temporarily null (e.g. initial load or storage partitioning), preserve cached session if present
        const storedStr = localStorage.getItem("copo_user_profile");
        if (storedStr) {
          try {
            const parsed = JSON.parse(storedStr);
            if (parsed && parsed.email) {
              if (parsed.avatar) {
                parsed.avatar = getSafeAvatarUrl(parsed.avatar, parsed.name, parsed.email);
              }
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
      window.removeEventListener("copo_business_auth_changed", handleBusinessAuthChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;

  const effectiveMessagingUser = useMemo(() => {
    let effective = currentUser;
    if (activeSection === 'business') {
      try {
        const saved = localStorage.getItem('copo_business_verified_session');
        if (saved) {
          const session = JSON.parse(saved);
          if (session && session.placeId) {
            effective = {
              id: session.placeId,
              uid: session.placeId,
              userId: session.placeId,
              placeId: session.placeId,
              name: session.placeName || 'Business Manager',
              email: session.businessEmail || `biz_${session.placeId}@business.yoouz.com`,
              avatar: session.logoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              handle: (session.domain || session.placeName || 'business').toLowerCase().replace(/[^a-z0-9]/g, ''),
              isVerified: true,
              isBusiness: true
            } as any;
          }
        }
      } catch(e) {}
    }
    return effective;
  }, [currentUser, activeSection]);

  // Real-time BunnyDB sync for Notifications
  useEffect(() => {
    if (!effectiveMessagingUser) {
      setNotifications([]);
      prevNotifIdsRef.current.clear();
      isFirstNotifLoadRef.current = true;
      return;
    }

    const unsubscribe = subscribeToNotifications(effectiveMessagingUser, (notifs) => {
      setNotifications(notifs);

      if (isFirstNotifLoadRef.current) {
        isFirstNotifLoadRef.current = false;
        notifs.forEach((n) => prevNotifIdsRef.current.add(n.id));
        return;
      }

      // Check for brand new unread notification
      const newIncoming = notifs.find((n) => !n.isRead && !prevNotifIdsRef.current.has(n.id));
      notifs.forEach((n) => prevNotifIdsRef.current.add(n.id));

      if (newIncoming && activeSectionRef.current !== "notifications") {
        const prefs = currentUser.notificationSettings;
        if (prefs?.enabled === false) return;
        if (newIncoming.type === "like" && prefs?.likes === false) return;
        if (newIncoming.type === "comment" && prefs?.comments === false) return;
        if (newIncoming.type === "follow" && prefs?.follows === false) return;
        if (newIncoming.type === "bookmark" && prefs?.bookmarks === false) return;
        if (newIncoming.type === "message" && prefs?.messages === false) return;

        let title = "1 new notification";
        if (newIncoming.type === "like") title = "1 new like";
        else if (newIncoming.type === "comment") title = "1 new comment";
        else if (newIncoming.type === "follow") title = "1 new follower";
        else if (newIncoming.type === "bookmark") title = "1 new save";
        else if (newIncoming.type === "message") title = "1 new message";
        else if (newIncoming.type === "repost") title = "1 new share";

        setInAppToast({
          id: newIncoming.id,
          type: newIncoming.type === "message" ? "message" : "notification",
          actionType: newIncoming.type,
          title: title,
          subtitle: newIncoming.text ? `${newIncoming.user.name} ${newIncoming.text}` : `${newIncoming.user.name} interacted with you`,
          avatar: newIncoming.user.avatar,
          userName: newIncoming.user.name,
          onAction: () => {
            if (newIncoming.type === "message") {
              setActiveSection("messages");
            } else if (newIncoming.videoId) {
              handleSelectVideoById(newIncoming.videoId);
            } else {
              setActiveSection("notifications");
            }
          }
        });
      }
    });

    return () => unsubscribe();
  }, [effectiveMessagingUser, currentUser]);

  const calculateUnreadMessagesCount = (msgList: CopoMessage[], user: UserProfile | null) => {
    if (!user) return 0;
    const userEmail = (user.email || "").toLowerCase().trim();
    const userId = (user.userId || (user as any).id || "").toLowerCase().trim();
    const userName = (user.name || "").toLowerCase().trim();

    return msgList.reduce((acc, m) => {
      if (!m) return acc;
      const hist = m.history || [];
      const lastMsg = hist.length > 0 ? hist[hist.length - 1] : null;
      if (lastMsg) {
        const sEmail = (lastMsg.senderEmail || "").toLowerCase().trim();
        const sId = (((lastMsg as any).senderId || "") as string).toLowerCase().trim();
        const sName = (lastMsg.senderName || "").toLowerCase().trim();
        const isLastMsgFromMe = Boolean(
          lastMsg.isMe ||
          (userEmail && (sEmail === userEmail || sId === userEmail)) ||
          (userId && (sId === userId || sEmail === userId)) ||
          (userName && sName === userName)
        );
        if (isLastMsgFromMe) return acc;
      }
      return acc + (Number(m.unreadCount) > 0 ? Number(m.unreadCount) : 0);
    }, 0);
  };
  const prevMessagingUserKeyRef = useRef<string>("");

  // Real-time BunnyDB sync for Direct Messages & Chats
  useEffect(() => {
    if (!effectiveMessagingUser) {
      setMessages([]);
      prevChatHistoryLengthRef.current.clear();
      isFirstChatLoadRef.current = true;
      prevMessagingUserKeyRef.current = "";
      return;
    }

    const currentMsgUserKey = (effectiveMessagingUser.email || effectiveMessagingUser.userId || (effectiveMessagingUser as any).id || "anon").toLowerCase().trim();
    if (prevMessagingUserKeyRef.current !== currentMsgUserKey) {
      prevMessagingUserKeyRef.current = currentMsgUserKey;
      setMessages([]);
      prevChatHistoryLengthRef.current.clear();
      isFirstChatLoadRef.current = true;
    }

    const unsubscribe = subscribeToChats(effectiveMessagingUser, (threads) => {
      setMessages((prev) => {
        const prevMap = new Map<string, CopoMessage>();
        prev.forEach((t) => prevMap.set(t.id, t));

        const mergedThreads = threads.map((thread) => {
          const prevThread = prevMap.get(thread.id);
          if (!prevThread) return thread;

          const mergedHistory = deduplicateChatHistory([
            ...(prevThread.history || []),
            ...(thread.history || [])
          ]);

          const cleanLastMsg = (thread.lastMessage && thread.lastMessage !== "Conversation started" && thread.lastMessage !== "Direct conversation") ? thread.lastMessage : "";
          const histLastMsg = (mergedHistory[mergedHistory.length - 1]?.text) || "";
          const prevCleanMsg = (prevThread.lastMessage && prevThread.lastMessage !== "Conversation started" && prevThread.lastMessage !== "Direct conversation") ? prevThread.lastMessage : "";

          return {
            ...prevThread,
            ...thread,
            history: mergedHistory,
            lastMessage: histLastMsg || cleanLastMsg || prevCleanMsg || ""
          };
        });

        const currentUserEmail = (effectiveMessagingUser.email || "").toLowerCase().trim();
        const currentUserId = (effectiveMessagingUser.userId || (effectiveMessagingUser as any).id || "").toLowerCase().trim();
        const isBiz = Boolean((effectiveMessagingUser as any).isBusiness);

        const serverIds = new Set(threads.map((t) => t.id));
        const serverPartnerKeys = new Set(threads.map((t) => getThreadPartnerKey(t, effectiveMessagingUser)));
        const pendingLocal = prev.filter((m) => {
          if (!m) return false;
          const pKey = getThreadPartnerKey(m, effectiveMessagingUser);
          if (serverIds.has(m.id) || (pKey && serverPartnerKeys.has(pKey))) return false;
          if (m.id === activeThreadId || (pKey && pKey === activeThreadId)) return true;
          if (m.lastMessage || (m.history && m.history.length > 0)) return true;

          const participants = Array.isArray(m.participants)
            ? m.participants.map(p => (p || "").toLowerCase().trim().replace(/^@/, ''))
            : [];
          const sId = (m.senderId || "").toLowerCase().trim().replace(/^@/, '');
          const rId = (m.recipientId || "").toLowerCase().trim().replace(/^@/, '');
          const sEmail = (m.senderEmail || m.lastSenderEmail || "").toLowerCase().trim();
          const rEmail = (m.recipientEmail || "").toLowerCase().trim();

          if (isBiz) {
            return Boolean(
              (currentUserId && (participants.some(p => p.includes(currentUserId)) || sId === currentUserId || rId === currentUserId)) ||
              (currentUserEmail && (participants.some(p => p.includes(currentUserEmail)) || sEmail === currentUserEmail || rEmail === currentUserEmail))
            );
          } else {
            return Boolean(
              (currentUserEmail && (participants.some(p => p.includes(currentUserEmail)) || sEmail === currentUserEmail || rEmail === currentUserEmail)) ||
              (currentUserId && (participants.some(p => p.includes(currentUserId)) || sId === currentUserId || rId === currentUserId))
            );
          }
        });

        return deduplicateChatThreads([...pendingLocal, ...mergedThreads], effectiveMessagingUser);
      });

      if (isFirstChatLoadRef.current) {
        isFirstChatLoadRef.current = false;
        threads.forEach((t) => {
          prevChatHistoryLengthRef.current.set(t.id, t.history?.length || 0);
        });
        return;
      }

      // Detect new incoming message from partner
      const userEmail = (effectiveMessagingUser.email || "").toLowerCase().trim();
      const userName = (effectiveMessagingUser.name || "").toLowerCase().trim();
      const userHandle = ((effectiveMessagingUser as any).handle || "").toLowerCase().trim();
      const userId = (effectiveMessagingUser.userId || (effectiveMessagingUser as any).id || "").toLowerCase().trim();

      for (const t of threads) {
        const prevCount = prevChatHistoryLengthRef.current.get(t.id) ?? 0;
        const currentCount = t.history?.length || 0;
        prevChatHistoryLengthRef.current.set(t.id, currentCount);

        if (currentCount > prevCount) {
          const lastMsg = t.history && t.history.length > 0 ? t.history[t.history.length - 1] : null;
          if (lastMsg) {
            const senderEmail = (lastMsg.senderEmail || "").toLowerCase().trim();
            const senderName = (lastMsg.senderName || "").toLowerCase().trim();
            const senderId = (((lastMsg as any).senderId || "") as string).toLowerCase().trim().replace(/^@/, "");

            const isMeMsg =
              lastMsg.isMe === true ||
              (userEmail && (senderEmail === userEmail || senderId === userEmail)) ||
              (userName && senderName === userName) ||
              (userHandle && (senderId === userHandle || senderName === userHandle)) ||
              (userId && (senderId === userId || senderEmail === userId));

            const isFromOther = !isMeMsg;
            const msgTime = Number(lastMsg.createdAtMs || (lastMsg as any).createdAt || 0);
            const isLiveRecent = msgTime > 0 && (Date.now() - msgTime) < 15000;

            if (isFromOther && isLiveRecent && (activeSection !== "messages" || activeThreadId !== t.id)) {
              const prefs = currentUser?.notificationSettings;
              if (prefs?.enabled === false || prefs?.messages === false) return;

              setInAppToast({
                id: `chat_${t.id}_${lastMsg.id || Date.now()}`,
                type: "message",
                actionType: "message",
                title: `1 new message from ${t.senderName}`,
                subtitle: lastMsg.text || t.lastMessage || "sent you a message",
                avatar: t.senderAvatar || lastMsg.senderAvatar,
                userName: t.senderName,
                threadId: t.id,
                onAction: () => {
                  if (activeSection !== "business") {
                    setActiveSection("messages");
                    setActiveThreadId(t.id);
                  }
                }
              });
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [effectiveMessagingUser, currentUser, activeThreadId, activeSection]);

  // Real-time synchronization of all registered users across the platform
  useEffect(() => {
    let isCancelled = false;
    let isFetchingUsers = false;

    const fetchAllUsers = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (isFetchingUsers) return;
      isFetchingUsers = true;
      try {
        const res = await fetch(`/api/nosql/users?_t=${Date.now()}`);
        if (res.ok) {
          const list = await res.json();
          if (!isCancelled && Array.isArray(list)) {
            let deletedList: string[] = [];
            try {
              const stored = localStorage.getItem("yoouz_deleted_users") || localStorage.getItem("copo_deleted_users");
              if (stored) deletedList = JSON.parse(stored);
            } catch (e) {}
            const deletedSet = new Set(deletedList.map((k) => String(k).toLowerCase()));

            // Self-healing check: if an active user profile was returned by the DB,
            // they are currently active and cannot be considered deleted.
            const restoredIds: string[] = [];
            list.forEach((u: any) => {
              if (!u) return;
              const uEmail = (u.email || "").toLowerCase().trim();
              const uName = (u.name || "").toLowerCase().trim();
              const uId = (u.id || u.uid || u.userId || "").toLowerCase().trim();

              if (uEmail && deletedSet.has(uEmail)) restoredIds.push(uEmail);
              if (uName && deletedSet.has(uName)) restoredIds.push(uName);
              if (uId && deletedSet.has(uId)) restoredIds.push(uId);
            });

            if (restoredIds.length > 0) {
              unrecordDeletedUsersInLocalStorage(restoredIds);
              try {
                const stored = localStorage.getItem("yoouz_deleted_users") || localStorage.getItem("copo_deleted_users");
                if (stored) deletedList = JSON.parse(stored);
                else deletedList = [];
              } catch (e) {}
              deletedSet.clear();
              deletedList.forEach(k => deletedSet.add(String(k).toLowerCase()));
            }

            let validUsers = list.filter((u: any) => {
              if (!u) return false;
              const uEmail = (u.email || "").toLowerCase().trim();
              if (uEmail.includes("undefined")) return false;
              const uName = (u.name || "").toLowerCase().trim();
              const uId = (u.id || u.uid || u.userId || "").toLowerCase().trim();
              // Do not exclude admin users or default placeholders unless explicitly deleted by the admin
              if (deletedSet.has(uEmail) || (uName && deletedSet.has(uName)) || (uId && deletedSet.has(uId))) return false;
              return true;
            });

            // Ensure current active user is integrated into the user directory
            if (currentUser && (currentUser.email || currentUser.uid)) {
              const currentEmail = (currentUser.email || "").toLowerCase().trim();
              const currentUid = (currentUser.uid || currentUser.id || "").toLowerCase().trim();
              const exists = validUsers.some((u: any) => {
                const e = (u.email || "").toLowerCase().trim();
                const id = (u.id || u.uid || "").toLowerCase().trim();
                return (currentEmail && e === currentEmail) || (currentUid && id === currentUid);
              });
              if (!exists) {
                validUsers = [
                  {
                    ...currentUser,
                    id: currentUser.uid || currentUser.id || currentEmail,
                    role: currentUser.role || (currentUser.email === "admin@yoouz.com" ? "Super Admin" : "Member"),
                    isVerified: true
                  },
                  ...validUsers
                ];
              }
            }

            setAllRegisteredUsers(validUsers);
            updateUserRegistry(validUsers);

            // Synchronize author details across all videos in memory
            setVideos((prevVideos) => {
              let hasChanged = false;
              const nextVideos = prevVideos.map((v) => {
                const refreshedAuthor = resolveSafeAuthor(v, currentUser, validUsers);
                if (
                  refreshedAuthor.location !== v.author?.location ||
                  refreshedAuthor.avatar !== v.author?.avatar ||
                  refreshedAuthor.bio !== v.author?.bio ||
                  refreshedAuthor.banner !== (v.author as any)?.banner ||
                  refreshedAuthor.name !== v.author?.name
                ) {
                  hasChanged = true;
                  return {
                    ...v,
                    author: refreshedAuthor
                  };
                }
                return v;
              });
              return hasChanged ? nextVideos : prevVideos;
            });
          }
        }
      } catch (e) {
      } finally {
        isFetchingUsers = false;
      }
    };

    fetchAllUsers();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && (typeof navigator === "undefined" || navigator.onLine)) {
        fetchAllUsers();
      }
    }, 20000);

    const handleUsersRefresh = () => {
      if (document.visibilityState === "visible") {
        fetchAllUsers();
      }
    };

    window.addEventListener("online", handleUsersRefresh);
    window.addEventListener("focus", handleUsersRefresh);
    document.addEventListener("visibilitychange", handleUsersRefresh);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", handleUsersRefresh);
      window.removeEventListener("focus", handleUsersRefresh);
      document.removeEventListener("visibilitychange", handleUsersRefresh);
    };
  }, []);

  // Synchronize current user to remote BunnyDB so admin live stats and user list always reflect active users
  useEffect(() => {
    if (currentUser && (currentUser.email || currentUser.uid)) {
      const docId = currentUser.uid || currentUser.email?.replace(/[^a-zA-Z0-9]/g, "_") || "user_me";
      fetch(`/api/nosql/users/${encodeURIComponent(docId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentUser,
          role: currentUser.role || (currentUser.email === "admin@yoouz.com" ? "Super Admin" : "Member"),
          updatedAt: new Date().toISOString()
        })
      }).catch(() => {});
    }
  }, [currentUser]);

  const handleUpdateProfile = (updated: { name?: string; bio?: string; avatar?: string; banner?: string; location?: string; handle?: string; city?: string; state?: string; country?: string }) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const nextProfile: UserProfile = {
        ...prev,
        name: updated.name !== undefined ? updated.name : prev.name,
        bio: updated.bio !== undefined ? updated.bio : prev.bio,
        avatar: updated.avatar !== undefined ? updated.avatar : prev.avatar,
        banner: updated.banner !== undefined ? updated.banner : (prev as any).banner,
        location: updated.location !== undefined ? updated.location : prev.location,
        city: updated.city !== undefined ? updated.city : prev.city,
        state: updated.state !== undefined ? updated.state : (prev as any).state,
        country: updated.country !== undefined ? updated.country : prev.country,
        handle: updated.handle !== undefined ? updated.handle : (prev as any).handle
      };
      updateUserRegistry(nextProfile);
      setAllRegisteredUsers((prevUsers) => {
        const index = prevUsers.findIndex((u) => 
          u.email === nextProfile.email || u.uid === nextProfile.uid || u.name === nextProfile.name
        );
        if (index >= 0) {
          const copy = [...prevUsers];
          copy[index] = { ...copy[index], ...nextProfile };
          return copy;
        }
        return [nextProfile, ...prevUsers];
      });

      setVideos((prevVideos) =>
        prevVideos.map((v) => {
          if (isAuthorMatch(v, nextProfile)) {
            return {
              ...v,
              author: {
                ...v.author,
                name: nextProfile.name,
                avatar: nextProfile.avatar,
                location: nextProfile.location,
                city: nextProfile.city,
                country: nextProfile.country,
                bio: nextProfile.bio,
                banner: (nextProfile as any).banner
              }
            };
          }
          return v;
        })
      );

      setSelectedAuthorForDrawer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          name: nextProfile.name,
          avatar: nextProfile.avatar,
          location: nextProfile.location,
          city: nextProfile.city,
          country: nextProfile.country,
          bio: nextProfile.bio,
          banner: (nextProfile as any).banner
        };
      });

      return nextProfile;
    });
  };

  const handleDeactivateProfile = async () => {
    const userToDeactivate = {
      id: currentUser?.uid || currentUser?.id || auth.currentUser?.uid || "",
      uid: currentUser?.uid || currentUser?.id || auth.currentUser?.uid || "",
      email: currentUser?.email || "",
      name: currentUser?.name || "",
      handle: currentUser?.handle || ""
    };

    const userIdentifiers = [
      userToDeactivate.id,
      userToDeactivate.uid,
      userToDeactivate.email,
      userToDeactivate.name,
      userToDeactivate.handle
    ].filter(Boolean);

    // 1. Record in local deactivated list so profile and videos are instantly hidden from public feeds
    recordDeactivatedUsersInLocalStorage(userIdentifiers);

    // 2. Immediately strip videos authored by this user from active feed
    setVideos((prev) => prev.filter((v) => !isAuthorMatch(v, userToDeactivate)));

    // 3. Immediately hide reviews authored by this user from places state
    setPlaces((prev) =>
      prev.map((p) => ({
        ...p,
        reviews: (p.reviews || []).filter((r) => !isAuthorMatch(r, userToDeactivate))
      }))
    );

    // 4. Remove from all registered users in local memory
    setAllRegisteredUsers((prev) => prev.filter((u) => !isAuthorMatch(u, userToDeactivate)));

    // 5. Close drawer if open
    setSelectedAuthorForDrawer(null);

    // 6. Dispatch instant local event for real-time reactivity across all components
    window.dispatchEvent(
      new CustomEvent("copo-user-deactivated", {
        detail: {
          userIds: userIdentifiers,
          email: userToDeactivate.email,
          name: userToDeactivate.name,
          handle: userToDeactivate.handle
        }
      })
    );

    // 7. Notify backend to hide from public feeds & mark deactivated
    try {
      await fetch('/api/user/deactivate-account', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userToDeactivate,
          isDeactivated: true,
          deactivatedAt: new Date().toISOString()
        })
      });
    } catch (err) {
      console.warn("Backend deactivate request failed:", err);
    }

    // 8. Update in BunnyDB
    try {
      const docId = userToDeactivate.id || userToDeactivate.uid;
      if (docId) {
        await updateDoc(doc(db, "users", docId), {
          isDeactivated: true,
          deactivatedAt: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (e) {}

    // 9. Clean sign out
    try {
      await logOutUser();
    } catch (e) {
      console.warn("Failed to log out user during profile deactivation:", e);
    }

    // 10. Clear active session (data remains 100% intact on server/storage!)
    setCurrentUser(null);
    try {
      localStorage.removeItem("copo_user_profile");
      localStorage.removeItem("copo_user");
      localStorage.removeItem("copo_business_verified_session");
      sessionStorage.removeItem("copo_temp_user");
      sessionStorage.removeItem("copo_business_session");
    } catch (e) {}

    setDeactivateSuccessToast(true);
    setTimeout(() => {
      setDeactivateSuccessToast(false);
    }, 5000);

    setActiveSection("home");
  };

  const handleDeleteProfile = async () => {
    const userToPurge = {
      id: currentUser?.uid || currentUser?.id || auth.currentUser?.uid || "",
      uid: currentUser?.uid || currentUser?.id || auth.currentUser?.uid || "",
      email: currentUser?.email || "",
      name: currentUser?.name || "",
      handle: currentUser?.handle || ""
    };

    const userIdentifiers = [userToPurge.id, userToPurge.uid, userToPurge.email, userToPurge.name, userToPurge.handle].filter(Boolean);

    // 1. Permanently record in local blacklist so profile can never be re-read or restored
    recordDeletedUsersInLocalStorage(userIdentifiers);

    // 2. Immediately strip all videos authored by this user from application state
    setVideos((prev) => prev.filter((v) => !isAuthorMatch(v, userToPurge)));

    // 3. Immediately strip all reviews authored by this user from places state
    setPlaces((prev) =>
      prev.map((p) => ({
        ...p,
        reviews: (p.reviews || []).filter((r) => !isAuthorMatch(r, userToPurge))
      }))
    );

    // 4. Dispatch instant local event for real-time reactivity across all components and drawers
    window.dispatchEvent(
      new CustomEvent("copo-user-deleted", {
        detail: {
          userIds: userIdentifiers,
          email: userToPurge.email,
          name: userToPurge.name,
          handle: userToPurge.handle
        }
      })
    );

    // 5. Trigger full backend purge of all databases, Bunny CDN storage, and caches
    try {
      await fetch('/api/user/delete-account', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userToPurge)
      });
    } catch (err) {
      console.warn("Backend purge request failed:", err);
    }

    try {
      await logOutUser();
    } catch (e) {
      console.warn("Failed to log out user during profile deletion:", e);
    }

    // 6. Completely clear all authentication, profile, cache, and session local storage keys
    setCurrentUser(null);
    try {
      localStorage.removeItem("copo_user_profile");
      localStorage.removeItem("copo_user");
      localStorage.removeItem("copo_business_verified_session");
      localStorage.removeItem("yoouz_users_registry_cache");
      sessionStorage.removeItem("copo_temp_user");
      sessionStorage.removeItem("copo_business_session");
    } catch (e) {}

    setDeleteSuccessToast(true);
    setTimeout(() => {
      setDeleteSuccessToast(false);
    }, 5000);

    setActiveSection("home");
  };

  const handleDeleteUserVideo = async (vidId: string) => {
    if (!vidId) return;
    await handleAdminDeleteVideo(vidId);
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

    // Persist immediately to Backend API (BunnyDB + PostgreSQL + Server Index)
    try {
      fetch("/api/videos/update-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          updates
        })
      }).catch((err) => {
        console.warn("Server update review API error:", err);
      });

      // Update local storage cache immediately
      try {
        const cachedStr = localStorage.getItem(YOOUZ_VIDEOS_CACHE_KEY);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (Array.isArray(cached)) {
            const updated = cached.map((c: any) =>
              c.id === videoId
                ? {
                    ...c,
                    ...(updates.rating !== undefined && { rating: updates.rating, placeRating: updates.rating }),
                    ...(updates.caption !== undefined && { caption: updates.caption }),
                    ...(updates.dishOrItem !== undefined && { dishOrItem: updates.dishOrItem }),
                    ...(updates.tags !== undefined && { tags: updates.tags })
                  }
                : c
            );
            localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(updated));
          }
        }
      } catch (e) {}

      // Fallback mirror to BunnyDB if present

    } catch (err) {
      console.warn("Update video rating error:", err);
    }
  };

  // Video View Recording Session State
  const recordedViewsInSessionRef = useRef<Set<string>>(new Set());
  const pendingLikeClickRef = useRef<Map<string, number>>(new Map());
  const pendingFollowClickRef = useRef<Map<string, number>>(new Map());
  const pendingCommentClickRef = useRef<Map<string, number>>(new Map());

  const handleShareIncrement = (videoId: string, nextSharesCount?: number) => {
    if (!videoId) return;
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const currentShares = v.sharesCount || v.shares || 0;
          const updated = nextSharesCount !== undefined ? nextSharesCount : currentShares + 1;
          return {
            ...v,
            sharesCount: updated,
            shares: updated
          };
        }
        return v;
      })
    );
  };

  const handleRecordVideoView = (videoId: string) => {
    if (!videoId) return;

    // Deduplicate rapid repeat calls within this session
    if (recordedViewsInSessionRef.current.has(videoId)) return;
    recordedViewsInSessionRef.current.add(videoId);

    // 1. Increment in local React state
    setVideos((prev) => {
      const next = prev.map((v) => {
        if (v.id === videoId) {
          const currentViews = getDisplayViews(v);
          const nextViews = currentViews + 1;
          return {
            ...v,
            views: nextViews,
            viewsCount: nextViews
          };
        }
        return v;
      });

      // Update local storage cache
      try {
        localStorage.setItem(YOOUZ_VIDEOS_CACHE_KEY, JSON.stringify(next.slice(0, 50)));
      } catch (e) {}

      return next;
    });

    // 2. Persist to backend server API (which updates BunnyDB & reviews index)
    try {
      fetch(`/api/videos/${encodeURIComponent(videoId)}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.viewsCount === "number") {
            const serverViews = data.viewsCount;
            setVideos((prev) =>
              prev.map((v) => {
                if (v.id === videoId) {
                  const maxV = Math.max(v.views || 0, v.viewsCount || 0, serverViews);
                  return {
                    ...v,
                    views: maxV,
                    viewsCount: maxV
                  };
                }
                return v;
              })
            );
          }
        })
        .catch(() => {});
    } catch (e) {}
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

    let targetEmail = senderId && senderId.includes("@") ? senderId : undefined;
    const sName = (senderName || "").toLowerCase().trim();
    if (!targetEmail) {
      if (matchingPlace?.claimedByEmail) {
        targetEmail = matchingPlace.claimedByEmail;
      } else if (senderId === "yoouz.com" || senderId === "yoouz" || sName === "yoouz") {
        targetEmail = "info@yoouz.com";
      } else if (sName === "avt ertuop" || senderId.includes("avtertuop") || senderId.includes("avr6566gd")) {
        targetEmail = "avr6566gd@gmail.com";
      } else if (sName === "biz riv" || senderId.includes("bizriv") || senderId.includes("louis42111")) {
        targetEmail = "louis42111@gmail.com";
      } else if (sName.includes("aouisesmee") || senderId.includes("aouisesmee")) {
        targetEmail = "aouisesmee@gmail.com";
      }
    }

    const effUser = effectiveMessagingUser || currentUser;
    const targetPartnerKey = getThreadPartnerKey({
      senderId,
      senderName,
      senderEmail: targetEmail,
      recipientId: senderId,
      recipientName: senderName,
      recipientEmail: targetEmail
    }, effUser);

    const existingThread = messages.find(
      (m) =>
        m.id === senderId ||
        (targetPartnerKey && getThreadPartnerKey(m, effUser) === targetPartnerKey) ||
        m.senderId === senderId ||
        (m as any).recipientId === senderId ||
        (targetEmail && (m.senderId === targetEmail || m.senderEmail === targetEmail || (m as any).recipientEmail === targetEmail)) ||
        (m.senderName && senderName && m.senderName.toLowerCase() === senderName.toLowerCase()) ||
        ((m as any).recipientName && senderName && (m as any).recipientName.toLowerCase() === senderName.toLowerCase())
    );

    setActiveSection("messages");
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);

    if (existingThread) {
      setActiveThreadId(existingThread.id);
      return;
    }

    const userEmail = (effUser?.email || "").toLowerCase().trim();
    const userHandle = (effUser?.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
    const curName = (effUser?.name || "").trim();

    const participants = Array.from(
      new Set([
        userEmail,
        userEmail ? userEmail.split("@")[0] : "",
        userHandle,
        curName.toLowerCase(),
        effUser?.userId || "",
        targetEmail,
        targetEmail ? targetEmail.split("@")[0] : "",
        senderId,
        senderId.toLowerCase(),
        senderName.toLowerCase(),
        ...(sName === "yoouz" || senderId === "yoouz.com" || targetEmail === "info@yoouz.com" ? ["yoouz.com", "yoouz", "info@yoouz.com"] : []),
        ...(sName === "avt ertuop" || targetEmail === "avr6566gd@gmail.com" ? ["avr6566gd@gmail.com", "avr6566gd", "avt ertuop", "avtertuop"] : []),
        ...(sName === "biz riv" || targetEmail === "louis42111@gmail.com" ? ["louis42111@gmail.com", "louis42111", "biz riv", "bizriv"] : []),
        ...(sName.includes("aouisesmee") || targetEmail === "aouisesmee@gmail.com" ? ["aouisesmee@gmail.com", "aouisesmee"] : [])
      ].filter(Boolean))
    );

    const newThreadId = `thread_${Date.now()}`;
    const newThread: CopoMessage = {
      id: newThreadId,
      senderId,
      senderName,
      senderAvatar,
      senderEmail: targetEmail,
      recipientId: effUser?.userId || userEmail || "user",
      recipientName: curName || "User",
      recipientEmail: userEmail,
      recipientAvatar: currentUser?.avatar || "",
      participants,
      lastMessage: "",
      timestamp: "Just now",
      createdAtMs: Date.now(),
      unreadCount: 0,
      history: []
    };

    const updated = [newThread, ...messages];
    setMessages(updated);
    setActiveThreadId(newThreadId);

    const initialPayload = {
      id: newThreadId,
      participants,
      participantProfiles: {
        [userEmail || userHandle || "sender"]: {
          name: curName || "User",
          avatar: currentUser?.avatar || "",
          email: userEmail
        },
        [targetEmail || senderId || "recipient"]: {
          name: senderName,
          avatar: senderAvatar,
          email: targetEmail
        }
      },
      lastMessage: "",
      lastSenderEmail: userEmail,
      lastSenderName: curName || "User",
      senderEmail: userEmail,
      senderName: curName || "User",
      senderAvatar: currentUser?.avatar || "",
      recipientEmail: targetEmail,
      recipientId: senderId,
      recipientName: senderName,
      recipientAvatar: senderAvatar,
      timestamp: "Just now",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: []
    };

    fetch(`/api/nosql/chats/${newThreadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: initialPayload, merge: true })
    }).catch(() => {});
  };

  // Helper fallback URLs
  function defFallbackUrls(id: string) {
    return [];
  }

  // Places sync from BunnyDB with live subscription & auto-synthesis from reviews
  useEffect(() => {
    try {
      const deletedStr = localStorage.getItem("copo_deleted_places") || "[]";
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(deletedStr); } catch (e) {}

      // Initial base
      setPlaces((prev) => {
        const map = new Map<string, Place>();
        prev.forEach(p => map.set(p.id, p));
        return Array.from(map.values());
      });

      // 1. Fetch from BunnyDB / Server NoSQL
      const fetchServerPlaces = async () => {
        try {
          const res = await fetch(`/api/nosql/places?_t=${Date.now()}`);
          if (res.ok) {
            const serverList = await res.json();
            if (Array.isArray(serverList)) {
              const currentDeletedIds = getDeletedPlaceIds();
              const filtered = serverList.filter((p: any) => !isPlaceDeleted(p, currentDeletedIds));
              setPlaces(() => {
                let followedPlaces: string[] = [];
                try { followedPlaces = JSON.parse(localStorage.getItem("copo_followed_places") || "[]"); } catch(e){}
                let claimedPlaces: string[] = [];
                try { claimedPlaces = JSON.parse(localStorage.getItem("copo_claimed_places") || "[]"); } catch(e){}
                let businessSession: any = null;
                try { businessSession = JSON.parse(localStorage.getItem("copo_business_verified_session") || "null"); } catch(e){}

                const map = new Map<string, Place>();
                filtered.forEach((p: any) => {
                  if (!p || !p.id) return;
                  const rawId = String(p.id).toLowerCase().trim();
                  let canonId = rawId
                    .replace(/^place-custom-/, '')
                    .replace(/^www-/, '')
                    .replace(/^www\./, '')
                    .replace(/-co-nz$/, '.co.nz')
                    .replace(/-co-uk$/, '.co.uk')
                    .replace(/-com$/, '.com')
                    .replace(/-org$/, '.org')
                    .replace(/-net$/, '.net')
                    .replace(/-io$/, '.io')
                    .replace(/-ai$/, '.ai')
                    .replace(/-ae$/, '.ae')
                    .replace(/-de$/, '.de')
                    .replace(/-fr$/, '.fr')
                    .replace(/-nl$/, '.nl')
                    .replace(/-us$/, '.us');

                  if (!canonId.includes('.') && canonId.includes('-')) {
                    const parts = canonId.split('-');
                    if (parts.length >= 2) canonId = parts.slice(0, -1).join('-') + '.' + parts[parts.length - 1];
                  }

                  const domain = (p.brandDomain || (p.website ? p.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '') || canonId).toLowerCase().trim();
                  const key = domain || canonId;

                  const isFollowed = followedPlaces.includes(p.id) || followedPlaces.includes(canonId);
                  const isClaimedLocally = claimedPlaces.includes(p.id) || claimedPlaces.includes(canonId) || claimedPlaces.includes(domain) ||
                    Boolean(businessSession && (businessSession.placeId === p.id || businessSession.placeId === canonId || businessSession.domain === domain));
                  
                  const isYoouz = key === 'yoouz.com' || canonId === 'yoouz.com' || p.id === 'yoouz.com' || (p.name && p.name.toLowerCase() === 'yoouz');
                  // Only yoouz.com, locally claimed for this place, or explicitly claimed place (not leaked info@yoouz.com)
                  const isClaimed = Boolean(isYoouz || isClaimedLocally || (p.isClaimed && (isYoouz || (p.claimedByEmail && p.claimedByEmail !== 'info@yoouz.com'))));
                  const isVerified = Boolean(p.isVerified || isClaimed || isYoouz);
                  const claimedByEmail = isYoouz 
                    ? "info@yoouz.com" 
                    : (isClaimedLocally && businessSession?.placeId === p.id ? businessSession.businessEmail : (p.claimedByEmail && p.claimedByEmail !== "info@yoouz.com" ? p.claimedByEmail : undefined));
                  const rating = typeof p.rating === "number" && !isNaN(p.rating) ? p.rating : (Number(p.rating) || 5.0);
                  const totalReviews = typeof p.totalReviews === "number" ? p.totalReviews : (Number(p.totalReviews) || 0);

                  const placeObj: Place = {
                    ...p,
                    id: canonId.includes('.') ? canonId : p.id,
                    name: isYoouz ? "Yoouz" : p.name,
                    rating,
                    totalReviews,
                    isFollowed,
                    isClaimed,
                    isVerified,
                    claimedByEmail: claimedByEmail,
                    ownerId: isYoouz ? "info@yoouz.com" : (p.ownerId || claimedByEmail || undefined)
                  };

                  const existing = map.get(key);
                  if (!existing) {
                    map.set(key, placeObj);
                  } else {
                    const mergedLogo = (placeObj.logoUrl && !placeObj.logoUrl.includes('favicon.svg') && !placeObj.logoUrl.startsWith('<svg')) ? placeObj.logoUrl : (existing.logoUrl || placeObj.logoUrl);
                    const mergedBanner = placeObj.bannerUrl || existing.bannerUrl || '';
                    const mergedCategory = (placeObj.category && placeObj.category !== 'Website' && placeObj.category !== 'all') ? placeObj.category : (existing.category || placeObj.category);
                    const mergedPhone = placeObj.phone || (existing as any).phone || '';
                    const mergedHours = (placeObj as any).hours || placeObj.openingHours || (existing as any).hours || existing.openingHours || '';
                    const mergedDesc = (placeObj as any).description || (existing as any).description || '';
                    const mergedAddress = placeObj.address || existing.address || '';
                    const mergedWebsite = placeObj.website || existing.website || '';
                    const mergedEmail = (placeObj as any).email || (existing as any).email || '';

                    map.set(key, {
                      ...existing,
                      ...placeObj,
                      id: (canonId.includes('.') ? canonId : (existing.id.includes('.') ? existing.id : placeObj.id)),
                      logoUrl: mergedLogo,
                      avatarUrl: mergedLogo,
                      bannerUrl: mergedBanner,
                      ogImage: mergedBanner,
                      photos: mergedBanner ? [mergedBanner, ...(placeObj.photos || existing.photos || []).filter((ph: any) => ph !== mergedBanner)] : (placeObj.photos || existing.photos || []),
                      category: mergedCategory,
                      address: mergedAddress,
                      phone: mergedPhone,
                      hours: mergedHours,
                      openingHours: mergedHours,
                      description: mergedDesc,
                      website: mergedWebsite,
                      email: mergedEmail,
                      isClaimed: Boolean(placeObj.isClaimed || existing.isClaimed),
                      isVerified: Boolean(placeObj.isVerified || existing.isVerified),
                      claimedByEmail: placeObj.claimedByEmail || existing.claimedByEmail,
                      ownerId: placeObj.ownerId || existing.ownerId
                    });
                  }
                });

                if (!map.has('yoouz.com')) {
                  const yoouzBase = derivePlaceFromEmailOrDomain('yoouz.com', []);
                  map.set('yoouz.com', {
                    ...yoouzBase,
                    id: 'yoouz.com',
                    name: 'Yoouz',
                    category: 'Video Reviews & Discovery Platform',
                    categoryType: 'all',
                    address: '',
                    city: '',
                    country: '',
                    website: 'https://yoouz.com',
                    brandDomain: 'yoouz.com',
                    logoUrl: '/favicon.svg',
                    avatarUrl: '/favicon.svg',
                    bannerUrl: '/yoouz-brand-banner.svg',
                    ogImage: '/yoouz-brand-banner.svg',
                    isClaimed: true,
                    isVerified: true,
                    claimedByEmail: 'info@yoouz.com',
                    rating: 5.0,
                    totalReviews: 1
                  });
                }
                return Array.from(map.values());
              });
            }
          }
        } catch (e) {}
      };
      fetchServerPlaces();

      if (!db) return;
      const placesRef = collection(db, "places");
      const unsubscribe = onSnapshot(placesRef, (snapshot) => {
        const list: Place[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Place);
        });

        const currentDeletedIds = getDeletedPlaceIds();
        const filtered = list.filter(p => !isPlaceDeleted(p, currentDeletedIds));
        setPlaces((prev) => {
          let followedPlaces = [];
          try { followedPlaces = JSON.parse(localStorage.getItem("copo_followed_places") || "[]"); } catch(e){}

          const map = new Map<string, Place>();
          prev.filter(p => !isPlaceDeleted(p, currentDeletedIds)).forEach(p => map.set(p.id, p));
          filtered.forEach(p => {
             const existing = map.get(p.id);
             const isFollowed = followedPlaces.includes(p.id);
             const rating = typeof p.rating === "number" && !isNaN(p.rating) ? p.rating : (Number(p.rating) || existing?.rating || 5.0);
             const totalReviews = typeof p.totalReviews === "number" ? p.totalReviews : (Number(p.totalReviews) || existing?.totalReviews || 0);
             map.set(p.id, { ...existing, ...p, rating, totalReviews, isFollowed });
          });
          return Array.from(map.values());
        });
      }, (err) => {
        console.warn("Places snapshot notice:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Places sync error:", e);
    }
  }, []);

  // Real-time synchronization of place & user deletions across tabs and SSE
  useEffect(() => {
    const handlePlaceDeleted = (e: any) => {
      const { placeId, variants } = e.detail || {};
      const targetVariants = Array.isArray(variants) ? variants : (placeId ? [placeId] : []);
      if (targetVariants.length > 0) {
        recordDeletedPlacesInLocalStorage(targetVariants);
        setPlaces(prev => prev.filter(p => !isPlaceDeleted(p, targetVariants)));
      }
    };

    const handlePlacesPurged = () => {
      setPlaces([]);
      try { localStorage.setItem("yoouz_cached_places", "[]"); } catch(e){}
    };

    const handleInitDeletedPlaces = (e: any) => {
      const serverDeleted = e.detail?.deletedPlaceIds;
      if (Array.isArray(serverDeleted) && serverDeleted.length > 0) {
        recordDeletedPlacesInLocalStorage(serverDeleted);
        setPlaces(prev => prev.filter(p => !isPlaceDeleted(p, serverDeleted)));
      }
    };

    const handleUserDeleted = (e: any) => {
      const detail = e.detail || {};
      const userIdentifiers = [
        detail.userId,
        ...(Array.isArray(detail.userIds) ? detail.userIds : []),
        detail.email,
        detail.name,
        detail.handle
      ].filter(Boolean);

      if (userIdentifiers.length > 0) {
        recordDeletedUsersInLocalStorage(userIdentifiers);
      }

      // Check if active user session was deleted
      const activeUser = currentUserRef.current;
      if (activeUser && isUserDeleted(activeUser)) {
        forceLogoutUser("User account deleted live");
      }

      // Remove from active registered users list
      setAllRegisteredUsers(prev => prev.filter(u => !isUserDeleted(u)));

      // Remove from feed videos live
      setVideos(prev => prev.filter(v => !isUserDeleted(v.author || v.userId || v.authorName)));

      // Close profile drawer if open on deleted user
      setSelectedAuthorForDrawer(prev => {
        if (prev && isUserDeleted(prev)) return null;
        return prev;
      });
    };

    const handleUsersPurged = () => {
      forceLogoutUser("All user accounts purged");
      setAllRegisteredUsers([]);
    };

    const handleInitDeletedUsers = (e: any) => {
      const serverDeleted = e.detail?.deletedUserIds;
      if (Array.isArray(serverDeleted) && serverDeleted.length > 0) {
        recordDeletedUsersInLocalStorage(serverDeleted);
        const activeUser = currentUserRef.current;
        if (activeUser && isUserDeleted(activeUser)) {
          forceLogoutUser("Account was deleted on server");
        }
        setAllRegisteredUsers(prev => prev.filter(u => !isUserDeleted(u)));
        setVideos(prev => prev.filter(v => !isUserDeleted(v.author || v.userId || v.authorName)));
      }
    };

    const handleInitDeactivatedUsers = (e: any) => {
      const serverDeactivated = e.detail?.deactivatedUserIds;
      if (Array.isArray(serverDeactivated) && serverDeactivated.length > 0) {
        recordDeactivatedUsersInLocalStorage(serverDeactivated);
        setAllRegisteredUsers(prev => prev.filter(u => !isUserDeactivated(u)));
        setVideos(prev => prev.filter(v => !isUserDeactivated(v.author || v.userId || v.authorName)));
      }
    };

    const handleUserRestored = (e: any) => {
      const ids = e.detail?.ids || [];
      if (Array.isArray(ids) && ids.length > 0) {
        unrecordDeletedUsersInLocalStorage(ids);
      }
    };

    const handleUserDeactivated = (e: any) => {
      const userIdentifiers = e.detail?.userIds || [];
      if (Array.isArray(userIdentifiers) && userIdentifiers.length > 0) {
        recordDeactivatedUsersInLocalStorage(userIdentifiers);
      }
      setAllRegisteredUsers(prev => prev.filter(u => !isUserDeactivated(u)));
      setVideos(prev => prev.filter(v => !isUserDeactivated(v.author || v.userId || v.authorName)));
      setSelectedAuthorForDrawer(prev => (prev && isUserDeactivated(prev)) ? null : prev);
    };

    const handleUserReactivated = (e: any) => {
      const ids = e.detail?.userIds || [];
      if (Array.isArray(ids) && ids.length > 0) {
        unrecordDeactivatedUsersInLocalStorage(ids);
      }
      fetch('/api/videos')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setVideos(data);
          }
        })
        .catch(() => {});
    };

    const checkActiveUserDeleted = () => {
      const activeUser = currentUserRef.current;
      if (activeUser && isUserDeleted(activeUser)) {
        forceLogoutUser("Account deleted in background");
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "yoouz_deleted_users") {
        checkActiveUserDeleted();
        setAllRegisteredUsers(prev => prev.filter(u => !isUserDeleted(u)));
        setVideos(prev => prev.filter(v => !isUserDeleted(v.author || v.userId || v.authorName)));
      }
      if (e.key === "yoouz_deactivated_users") {
        setAllRegisteredUsers(prev => prev.filter(u => !isUserDeactivated(u)));
        setVideos(prev => prev.filter(v => !isUserDeactivated(v.author || v.userId || v.authorName)));
      }
    };

    const handlePlaceUpdatedEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const raw = customEvent.detail;
        const updated = (raw.place || raw) as Place;
        if (updated && updated.id) {
          handleUpdatePlace(updated, true);
        }
      }
    };

    window.addEventListener("copo-place-deleted", handlePlaceDeleted);
    window.addEventListener("copo-places-purged", handlePlacesPurged);
    window.addEventListener("copo-init-deleted-places", handleInitDeletedPlaces);
    window.addEventListener("copo-user-deleted", handleUserDeleted);
    window.addEventListener("copo-user-restored", handleUserRestored);
    window.addEventListener("copo-user-deactivated", handleUserDeactivated);
    window.addEventListener("copo-user-reactivated", handleUserReactivated);
    window.addEventListener("copo-users-purged", handleUsersPurged);
    window.addEventListener("copo-init-deleted-users", handleInitDeletedUsers);
    window.addEventListener("copo-init-deactivated-users", handleInitDeactivatedUsers);
    window.addEventListener("copo-place-updated", handlePlaceUpdatedEvent);
    window.addEventListener("yoouz-place-updated", handlePlaceUpdatedEvent);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", checkActiveUserDeleted);

    // Initial check on mount
    checkActiveUserDeleted();

    return () => {
      window.removeEventListener("copo-place-deleted", handlePlaceDeleted);
      window.removeEventListener("copo-places-purged", handlePlacesPurged);
      window.removeEventListener("copo-init-deleted-places", handleInitDeletedPlaces);
      window.removeEventListener("copo-user-deleted", handleUserDeleted);
      window.removeEventListener("copo-user-restored", handleUserRestored);
      window.removeEventListener("copo-user-deactivated", handleUserDeactivated);
      window.removeEventListener("copo-user-reactivated", handleUserReactivated);
      window.removeEventListener("copo-users-purged", handleUsersPurged);
      window.removeEventListener("copo-init-deleted-users", handleInitDeletedUsers);
      window.removeEventListener("copo-init-deactivated-users", handleInitDeactivatedUsers);
      window.removeEventListener("copo-place-updated", handlePlaceUpdatedEvent);
      window.removeEventListener("yoouz-place-updated", handlePlaceUpdatedEvent);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", checkActiveUserDeleted);
    };
  }, []);

  // Auto-synthesize places from any published video review (strictly ignoring deleted places)
  useEffect(() => {
    if (videos.length === 0) return;
    const currentDeleted = getDeletedPlaceIds();
    setPlaces((prev) => {
      let modified = false;
      const next = prev.filter(p => !isPlaceDeleted(p, currentDeleted));
      videos.forEach((v) => {
        if (isPlaceDeleted(v.placeId || v.placeWebsite || v.placeName, currentDeleted)) {
          return;
        }
        const idx = next.findIndex((p) => isPlaceReviewMatch(v, p));
        const reviewDomain = extractCleanDomain(v.placeWebsite || v.placeName || v.placeId);
        const knownBanner = reviewDomain && KNOWN_BRAND_BANNERS[reviewDomain] ? KNOWN_BRAND_BANNERS[reviewDomain] : "";
        const knownLogo = reviewDomain && KNOWN_BRAND_LOGOS[reviewDomain] ? KNOWN_BRAND_LOGOS[reviewDomain] : "";

        if (idx === -1) {
          const newPlace = synthesizePlaceFromReview(v, next);
          if (!isPlaceDeleted(newPlace, currentDeleted)) {
            next.push(newPlace);
            modified = true;
          }
        } else {
          // If existing place is missing banner, logo, or website, enrich it from the video review or known metadata!
          const existing = next[idx];
          const isYoouz = reviewDomain === "yoouz.com" || reviewDomain === "yoouz" || existing.id?.toLowerCase().includes("yoouz") || existing.name?.toLowerCase() === "yoouz";
          const YOOUZ_CDN_BANNER = "https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg";
          
          let reviewBanner = (v as any).placeBannerUrl || (v as any).bannerUrl || (v as any).ogImage || knownBanner;
          if (reviewBanner && (reviewBanner.includes("yoouz.com/og-banner.png") || reviewBanner.includes("1789810172562"))) {
            reviewBanner = isYoouz ? YOOUZ_CDN_BANNER : "";
          }
          const reviewLogo = v.placeLogoUrl && !v.placeLogoUrl.startsWith("data:;") && !v.placeLogoUrl.includes("gstatic.com") && !v.placeLogoUrl.includes("faviconV2") ? v.placeLogoUrl : (knownLogo || existing.logoUrl);
          const reviewWebsite = v.placeWebsite || (reviewDomain && reviewDomain.includes(".") ? `https://${reviewDomain}` : "");
          const currentWebsite = existing.website && existing.website.trim() !== "" && !existing.website.includes("maps.google.com") ? existing.website : "";
          const effectiveWeb = currentWebsite || reviewWebsite || (existing.brandDomain && existing.brandDomain.includes(".") ? `https://${existing.brandDomain}` : "");

          let existingBanner = existing.bannerUrl;
          if (existingBanner && (existingBanner.includes("yoouz.com/og-banner.png") || existingBanner.includes("1789810172562"))) {
            existingBanner = isYoouz ? YOOUZ_CDN_BANNER : "";
          }
          let existingOg = existing.ogImage;
          if (existingOg && (existingOg.includes("yoouz.com/og-banner.png") || existingOg.includes("1789810172562"))) {
            existingOg = isYoouz ? YOOUZ_CDN_BANNER : "";
          }
          if (isYoouz && (!existingBanner || existingBanner.includes("yoouz.com/og-banner.png") || existingBanner.includes("1789810172562"))) {
            existingBanner = YOOUZ_CDN_BANNER;
          }

          const effectiveBanner = existingBanner || existingOg || reviewBanner || knownBanner || (isYoouz ? YOOUZ_CDN_BANNER : "") || "";
          const effectiveLogo = (existing.logoUrl && !existing.logoUrl.startsWith("data:;") && !existing.logoUrl.includes("760X310") && !existing.logoUrl.includes("gstatic.com") && !existing.logoUrl.includes("faviconV2")) ? existing.logoUrl : ((existing.avatarUrl && !existing.avatarUrl.startsWith("data:;") && !existing.avatarUrl.includes("gstatic.com") && !existing.avatarUrl.includes("faviconV2")) ? existing.avatarUrl : (knownLogo || reviewLogo || (isYoouz ? "/favicon.svg" : "")));
          const effectiveDescription = v.placeDescription || (existing.description && !existing.description.includes("Verified video review destination") && !existing.description.includes("Verified Yoouz business listing") ? existing.description : "");

          if (
            (!existing.bannerUrl && effectiveBanner) ||
            (!existing.ogImage && effectiveBanner) ||
            (!existing.logoUrl && effectiveLogo) ||
            (!existing.website && effectiveWeb) ||
            (!existing.brandDomain && reviewDomain) ||
            (existing.bannerUrl === "" && effectiveBanner !== "") ||
            (effectiveDescription && (!existing.description || existing.description.includes("Verified video review destination") || existing.description.includes("Verified Yoouz business listing")))
          ) {
            next[idx] = {
              ...existing,
              bannerUrl: effectiveBanner || existing.bannerUrl || "",
              ogImage: effectiveBanner || existing.ogImage || "",
              logoUrl: effectiveLogo || existing.logoUrl || "",
              avatarUrl: effectiveLogo || existing.avatarUrl || "",
              website: effectiveWeb || existing.website || "",
              brandDomain: existing.brandDomain || reviewDomain || undefined,
              description: effectiveDescription || existing.description || "",
              photos: existing.photos && existing.photos.length > 0 ? existing.photos : (effectiveBanner ? [effectiveBanner] : [])
            };
            modified = true;
          }
        }
      });

      next.forEach((p, index) => {
        const matchingV = videos.filter(v => !isPlaceDeleted(v.placeId || v.placeWebsite || v.placeName, currentDeleted) && isPlaceReviewMatch(v, p));
        const computedCount = matchingV.length;
        const computedRating = matchingV.length > 0 
          ? Number((matchingV.reduce((acc, v) => acc + (v.rating || 5), 0) / matchingV.length).toFixed(1))
          : (p.rating || 5.0);

        if (p.totalReviews !== computedCount || p.videoReviewCount !== computedCount) {
          next[index] = { ...p, totalReviews: computedCount, videoReviewCount: computedCount, rating: computedRating };
          modified = true;

          // Sync to BunnyDB if review count changed
          if (p.id) {
            fetch(`/api/nosql/places/${encodeURIComponent(p.id)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                data: {
                  ...next[index],
                  totalReviews: computedCount,
                  videoReviewCount: computedCount,
                  rating: computedRating
                }, 
                merge: true 
              })
            }).catch(() => {});
          }
        }
      });

      if (modified) {
        try {
          localStorage.setItem("yoouz_cached_places", JSON.stringify(next));
        } catch (e) {}
      }

      return modified ? next : prev;
    });
  }, [videos]);

  // Sync preferences to LocalStorage
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
    const searchId = selectedPlaceIdForDrawer.trim();
    if (searchId.includes("@") || searchId.startsWith("usr_") || searchId.startsWith("user_")) {
      return null;
    }
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
          brandDomain: domain || undefined,
          category: "Establishment",
          categoryType: "all",
          address: "",
          city: "",
          country: "",
          rating: 5.0,
          totalReviews: 0,
          ratingDistribution: { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
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
          lat: 0,
          lng: 0,
          bannerUrl: "",
          ogImage: "",
          avatarUrl: domain ? getCleanLogoUrl(null, domain) || "" : "",
          logoUrl: domain ? getCleanLogoUrl(null, domain) || "" : "",
          isSavedToProfile: true
        } as Place;
      }
    }

    if (found) {
      const matchingVideoWithName = videos.find(
        (v) =>
          (isPlaceReviewMatch(v, found!) || v.placeId === found!.id) &&
          Boolean(v.placeName && v.placeName.trim() !== "" && !v.placeName.includes(".com"))
      );
      if (matchingVideoWithName?.placeName) {
        const candidateName = formatBusinessName(matchingVideoWithName.placeName);
        const isCurrentNameDomainLike = !found.name ||
          found.name.toLowerCase() === (found.id || "").toLowerCase() ||
          found.name.toLowerCase() === (found.brandDomain || "").toLowerCase() ||
          found.name.includes(".") ||
          !found.name.includes(" ") ||
          found.name.toLowerCase() === "website" ||
          found.name.toLowerCase().includes("bensonbingham");
        if (candidateName && (isCurrentNameDomainLike || !found.name)) {
          found = {
            ...found,
            name: candidateName
          };
        }
      }

      const matchingVideoWithBanner = videos.find(
        (v) =>
          (isPlaceReviewMatch(v, found!) || v.placeId === found!.id) &&
          Boolean((v as any).placeBannerUrl || (v as any).bannerUrl || (v as any).ogImage || v.placeWebsite)
      );
      const reviewDomain = extractCleanDomain(found.brandDomain || matchingVideoWithBanner?.placeWebsite || found.website || found.id || found.name);
      const reviewWebsite = matchingVideoWithBanner?.placeWebsite || (reviewDomain && reviewDomain.includes(".") ? `https://${reviewDomain}` : "");
      const currentWebsite = found.website && found.website.trim() !== "" && !found.website.includes("maps.google.com") ? found.website : "";
      const effectiveWeb = currentWebsite || reviewWebsite;

      if (matchingVideoWithBanner || (!found.website && effectiveWeb)) {
        const banner = (matchingVideoWithBanner as any)?.placeBannerUrl || (matchingVideoWithBanner as any)?.bannerUrl || (matchingVideoWithBanner as any)?.ogImage;
        const logo = matchingVideoWithBanner?.placeLogoUrl;
        found = {
          ...found,
          bannerUrl: found.bannerUrl || banner || found.bannerUrl,
          ogImage: found.ogImage || banner || found.ogImage,
          logoUrl: found.logoUrl || logo || found.logoUrl,
          avatarUrl: found.avatarUrl || logo || found.avatarUrl,
          website: effectiveWeb || found.website || "",
          brandDomain: found.brandDomain || (reviewDomain && reviewDomain.includes(".") ? reviewDomain : undefined),
          photos: found.photos && found.photos.length > 0 ? found.photos : (banner ? [banner] : [])
        };
      }

      const isYoouz = found.id === 'yoouz.com' || (found.name && found.name.toLowerCase() === 'yoouz') || found.brandDomain === 'yoouz.com' || (found.website && found.website.includes('yoouz.com'));
      if (isYoouz) {
        found = {
          ...found,
          address: '',
          city: '',
          country: '',
          lat: 0,
          lng: 0,
        };
      }
    }

    return found;
  }, [places, selectedPlaceIdForDrawer, videos]);

  // When selectedPlaceIdForDrawer is active, dynamically fetch full rich metadata from database if not present or missing banner/description
  useEffect(() => {
    if (!selectedPlaceIdForDrawer) return;
    const cleanId = selectedPlaceIdForDrawer.trim();
    if (!cleanId) return;

    fetch(`/api/nosql/places/${encodeURIComponent(cleanId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(fetchedPlace => {
        if (fetchedPlace && fetchedPlace.id) {
          const isYoouz = fetchedPlace.id === 'yoouz.com' || (fetchedPlace.name && fetchedPlace.name.toLowerCase() === 'yoouz') || fetchedPlace.brandDomain === 'yoouz.com' || (fetchedPlace.website && fetchedPlace.website.includes('yoouz.com'));
          if (isYoouz) {
            fetchedPlace.address = '';
            fetchedPlace.city = '';
            fetchedPlace.country = '';
            fetchedPlace.lat = 0;
            fetchedPlace.lng = 0;
          }
          setPlaces(prev => {
            const exists = prev.some(p => p.id === fetchedPlace.id);
            if (exists) {
              return prev.map(p => p.id === fetchedPlace.id ? { ...p, ...fetchedPlace } : p);
            }
            return [fetchedPlace, ...prev];
          });
        }
      })
      .catch(() => {});
  }, [selectedPlaceIdForDrawer]);

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
    const getReviewTime = (v: any) => {
      if (!v) return 0;
      const fromDt = v.createdAt ? new Date(v.createdAt.includes('T') ? v.createdAt : v.createdAt.replace(' ', 'T') + 'Z').getTime() : 0;
      const fromMs = typeof v.createdAtMs === 'number' ? v.createdAtMs : 0;
      const fromId = (v.id && typeof v.id === 'string' && v.id.startsWith('rev-')) ? parseInt(v.id.split('-')[1], 10) : 0;
      return Math.max(fromDt || 0, fromMs || 0, fromId || 0);
    };

    return [...filtered].sort((a, b) => {
      if (profileVideoSort === "highest") {
        return b.rating - a.rating;
      }
      return getReviewTime(b) - getReviewTime(a);
    });
  }, [videos, currentUser, profileVideoSort, profileVideoFilter]);

  // Active Feed Videos (Filtered by Fullscreen Context or Drawer state if active, otherwise Home feed)
  const activeFeedVideos = useMemo(() => {
    // Filter out hidden/blocked videos and deactivated users
    const visibleVideos = videos.filter((v) => !hiddenVideoIds.includes(v.id) && !isUserDeactivated(v.author || v.userId || v.authorName));

    if (embedTargetId) {
      const cleanSlug = embedTargetId.toLowerCase().trim();
      const isYoouz = cleanSlug === "yoouz.com" || cleanSlug === "yoouz";

      // 1. Resolve specific video if embedTargetId matches a specific video ID directly
      const specificVideo = visibleVideos.find((v) => v && (v.id === embedTargetId || v.id.toLowerCase() === cleanSlug)) || null;

      // 2. Resolve matching videos for the place/business
      const matched = visibleVideos.filter((v) => {
        if (!v) return false;
        if (isYoouz) {
          return (
            v.placeId === "yoouz.com" ||
            v.placeId === "place-custom-yoouz-com" ||
            v.placeId === "place-custom" ||
            (v.placeName && v.placeName.toLowerCase().includes("yoouz"))
          );
        }
        const vSlug = getPlaceSlug(v.placeId || v.placeName);
        return (
          vSlug === cleanSlug ||
          v.placeId === cleanSlug ||
          (v.placeName && v.placeName.toLowerCase().trim() === cleanSlug)
        );
      });

      let result = matched;
      if (specificVideo) {
        result = [specificVideo, ...matched.filter((v) => v.id !== specificVideo.id)];
      }

      if (result.length > 0) {
        return result;
      }
      if (specificVideo) {
        return [specificVideo];
      }
      return visibleVideos;
    }

    if (fullscreenFeedContext) {
      if (fullscreenFeedContext.type === "creator" && fullscreenFeedContext.authorData) {
        return visibleVideos.filter(v => isAuthorMatch(v, fullscreenFeedContext.authorData!));
      }
      if (fullscreenFeedContext.type === "place" && (fullscreenFeedContext.placeData || fullscreenFeedContext.id)) {
        const placeId = fullscreenFeedContext.placeData?.id || fullscreenFeedContext.id;
        const placeName = fullscreenFeedContext.placeData?.name;
        return visibleVideos.filter(v => 
          (placeId && (v.placeId === placeId || isPlaceReviewMatch(v, placeId))) ||
          (placeName && (v.placeName === placeName || isPlaceReviewMatch(v, placeName)))
        );
      }
      if (fullscreenFeedContext.type === "profile") {
        return userVideos;
      }
    }

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    // Priority 1: Place Drawer context (business profile open on desktop/mobile)
    if (isDesktop && isPlaceView && drawerPlace) {
      const pId = drawerPlace.id;
      const pName = drawerPlace.name;
      return visibleVideos.filter(v => 
        (pId && (v.placeId === pId || isPlaceReviewMatch(v, pId))) ||
        (pName && (v.placeName === pName || isPlaceReviewMatch(v, pName)))
      );
    }

    // Priority 2: Creator Drawer context (creator profile open on desktop/mobile)
    if (isDesktop && isCreatorView && selectedAuthorForDrawer) {
      return visibleVideos.filter(v => isAuthorMatch(v, selectedAuthorForDrawer));
    }

    // Priority 3: User Profile context
    if (activeSection === "profile") {
      return userVideos;
    }

    // Priority 4: Standard Home feed sub-tabs
    if (activeSubTab === "following") {
      const followed = visibleVideos.filter((v) => v.author.isFollowed || v.feedCategory === "following");
      return followed.length > 0 ? followed : (visibleVideos.length > 0 ? visibleVideos : videos);
    }

    // Emergency Fallback: If we have ANY videos but they are ALL hidden or filtered, show non-deactivated
    if (visibleVideos.length === 0 && videos.length > 0) {
      const nonDeactivated = videos.filter((v) => !isUserDeactivated(v.author || v.userId || v.authorName));
      return nonDeactivated;
    }

    return visibleVideos;
  }, [videos, activeSubTab, hiddenVideoIds, fullscreenFeedContext, isPlaceView, drawerPlace, isCreatorView, selectedAuthorForDrawer, activeSection, userVideos, embedTargetId]);

  // Synchronize currentVideoIndex when activeFeedVideos recomputes if we have a pending video
  // Synchronize and enrich selectedAuthorForDrawer with authentic Google avatar once videos load
  useEffect(() => {
    if (!selectedAuthorForDrawer) return;
    const authorName = (selectedAuthorForDrawer.name || "").replace(/^@+/, "").toLowerCase().trim();
    if (!authorName) return;

    // Check if we can find a matching author object in videos with a real Google avatar
    const matchingVid = videos.find((v) => {
      if (!v.author) return false;
      const h = (v.author.name || "").replace(/^@+/, "").toLowerCase().trim();
      const n = (v.author.name || "")
        .toLowerCase()
        .trim()
        .replace(/^@+/, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "")
        .replace(/-+/g, "-");
      return (
        (h === authorName || n === authorName) &&
        v.author.avatar &&
        !v.author.avatar.includes("ui-avatars") &&
        !v.author.avatar.includes("dicebear") &&
        !v.author.avatar.includes("/api/videos/") &&
        !v.author.avatar.includes(".mp4")
      );
    });

    if (matchingVid?.author?.avatar && matchingVid.author.avatar !== selectedAuthorForDrawer.avatar) {
      setSelectedAuthorForDrawer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          name: matchingVid.author.name || prev.name,
          avatar: matchingVid.author.avatar,
          bio: matchingVid.author.bio || prev.bio,
          banner: matchingVid.author.banner || prev.banner,
          location: matchingVid.author.location || prev.location,
          isVerified: matchingVid.author.isVerified ?? prev.isVerified
        };
      });
    }
  }, [videos]);

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

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    previousVideoIndexRef.current = currentVideoIndex; // Save background feed index before going fullscreen
    if (source === "creator" || isCreatorView) {
      const author = targetVid.author || selectedAuthorForDrawer;
      if (!author) return;

      const authorVids = videos.filter((v) => !hiddenVideoIds.includes(v.id) && isAuthorMatch(v, author));
      const idx = authorVids.findIndex((v) => v.id === videoId);

      if (isDesktop) {
        // Desktop: keep drawer open, update current video index within author vids
        if (idx !== -1) {
          setCurrentVideoIndex(idx);
        } else {
          setPendingVideoId(videoId);
        }
      } else {
        // Mobile: go fullscreen feed context
        setFullscreenFeedContext({
          type: "creator",
          id: author.name || author.name,
          title: "", // Do not show creator person name at top of video
          authorData: author
        });
        setSelectedPlaceIdForDrawer(null);
        setSelectedAuthorForDrawer(null);
        setActiveSection("home");

        if (idx !== -1) {
          setCurrentVideoIndex(idx);
        } else {
          setPendingVideoId(videoId);
        }
      }
    } else if (source === "place" || isPlaceView) {
      const p = drawerPlace || places.find(pl => pl.id === targetVid.placeId || pl.name === targetVid.placeName);
      const placeId = p?.id || targetVid.placeId;
      const placeName = p?.name || targetVid.placeName;

      const placeVids = videos.filter((v) => 
        !hiddenVideoIds.includes(v.id) && (
          (placeId && (v.placeId === placeId || isPlaceReviewMatch(v, placeId))) ||
          (placeName && (v.placeName === placeName || isPlaceReviewMatch(v, placeName)))
        )
      );
      const idx = placeVids.findIndex((v) => v.id === videoId);

      if (isDesktop) {
        // Desktop: keep drawer open, update current video index within place vids
        if (idx !== -1) {
          setCurrentVideoIndex(idx);
        } else {
          setPendingVideoId(videoId);
        }
      } else {
        // Mobile: go fullscreen feed context
        setFullscreenFeedContext({
          type: "place",
          id: placeId,
          title: placeName || "Business Reviews",
          placeData: p || null
        });
        setSelectedPlaceIdForDrawer(null);
        setSelectedAuthorForDrawer(null);
        setActiveSection("home");

        if (idx !== -1) {
          setCurrentVideoIndex(idx);
        } else {
          setPendingVideoId(videoId);
        }
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
      setSelectedPlaceIdForDrawer(targetVid.placeId);
      setSelectedAuthorForDrawer(null);
      setActiveSection("home");
      
      const vids = videos.filter((v) => v.placeId === targetVid.placeId || v.placeName === targetVid.placeName);
      const idx = vids.findIndex(v => v.id === videoId);
      if (idx !== -1) {
        setCurrentVideoIndex(idx);
      } else {
        setPendingVideoId(videoId);
      }
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
      setCurrentVideoIndex(previousVideoIndexRef.current);
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
    handleOpenCreatorDrawer({
      //handle: handle,
      name: currentUser.name || "Reviewer",
      avatar: currentUser.avatar || "",
      isVerified: true,
      isFollowed: false,
      bio: currentUser.bio || "",
      location: currentUser.location || ""
    });
    setActiveSection("home");
  };

  // Close Drawers completely (reset to previous section or global feed)
  const handleCloseDrawers = () => {
    setFullscreenFeedContext(null);
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);
    
    if (previousSectionRef.current) {
      setActiveSection(previousSectionRef.current);
      previousSectionRef.current = null;
    }

    // Restore the saved background feed video index!
    if (savedHomeVideoIndexRef.current !== undefined) {
      setCurrentVideoIndex(savedHomeVideoIndexRef.current);
    }
  };

  // Open Place Drawer
  const handleOpenPlaceDrawer = (placeId: string) => {
    if (!placeId) return;
    const cleanP = placeId.trim().toLowerCase();

    // STRICT GUARD: User accounts (emails, usr_*, user_*) must NEVER open as place drawers!
    const isUserAccount =
      cleanP.includes("@") ||
      cleanP.startsWith("usr_") ||
      cleanP.startsWith("user_") ||
      (allRegisteredUsers || []).some(
        (u: any) =>
          (u.email && u.email.toLowerCase().trim() === cleanP) ||
          (u.userId && u.userId.toLowerCase().trim() === cleanP) ||
          (u.id && u.id.toLowerCase().trim() === cleanP)
      );

    if (isUserAccount) {
      const matchedUser = (allRegisteredUsers || []).find(
        (u: any) =>
          (u.email && u.email.toLowerCase().trim() === cleanP) ||
          (u.userId && u.userId.toLowerCase().trim() === cleanP) ||
          (u.id && u.id.toLowerCase().trim() === cleanP)
      );
      const rawName = matchedUser?.name || cleanP.split("@")[0];
      const cleanName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
      const email = matchedUser?.email || (cleanP.includes("@") ? cleanP : undefined);
      const authorObj: VideoAuthor = {
        name: cleanName,
        email: email,
        userId: matchedUser?.userId || matchedUser?.id || cleanP,
        id: matchedUser?.id || matchedUser?.userId || cleanP,
        avatar: matchedUser?.avatar || getSafeAvatarUrl(null, cleanName, cleanP),
        bio: matchedUser?.bio || "Active Yoouz Member",
        location: matchedUser?.location || "Global Community",
        followersCount: matchedUser?.followersCount || 0,
        isVerified: matchedUser?.isVerified || false,
      };
      handleOpenCreatorDrawer(authorObj);
      return;
    }

    forceMute();
    // Explicitly pause all playing videos across the DOM immediately
    document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
      try { v.pause(); } catch (e) {}
    });
    
    // Save background video index and section before entering the drawer context
    if (!selectedPlaceIdForDrawer && !selectedAuthorForDrawer) {
      savedHomeVideoIndexRef.current = currentVideoIndex;
      previousSectionRef.current = activeSection;
    }

    setFullscreenFeedContext(null);
    setSelectedAuthorForDrawer(null);
    setSelectedPlaceIdForDrawer(placeId);
    
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (isDesktop) {
      setCurrentVideoIndex(0);
    }
  };

  // Open Creator Drawer
  const handleOpenCreatorDrawer = (author: VideoAuthor) => {
    forceMute();
    document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
      try { v.pause(); } catch (e) {}
    });

    const authorLower = (author.name || "").toLowerCase().trim();
    const authorIdentifier = (author.name || "").replace(/^@+/, "").trim().toLowerCase();

    // STRICT POLICY 31: Fake/mock "reviewer" pages are strictly banned
    if (!authorLower || authorLower === "reviewer" || authorLower === "user" || authorLower === "registered user" || authorLower === "verified reviewer") {
      const matchedRealUser = allRegisteredUsers?.find((u: any) => {
        const uEmail = (u.email || "").toLowerCase().trim();
        const aEmail = (author.email || "").toLowerCase().trim();
        return aEmail && uEmail === aEmail;
      });
      if (!matchedRealUser) {
        return;
      }
    }

    // Check if this author corresponds to a business / place
    const matchingPlace = (places || []).find((p: Place) => {
      const pId = (p.id || "").toLowerCase().trim();
      const pName = (p.name || "").toLowerCase().trim();
      const pDomain = (p.website || (p as any).brandDomain || (p as any).domain || p.id || "")
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .trim();
      const pSlug = pName.replace(/[^a-z0-9]/g, "");
      const aSlug = authorIdentifier.replace(/[^a-z0-9]/g, "");

      return (
        pId === authorIdentifier ||
        pId === `${authorIdentifier}.com` ||
        pDomain === authorIdentifier ||
        pDomain === `${authorIdentifier}.com` ||
        pName === authorLower ||
        (aSlug.length > 2 && pSlug === aSlug) ||
        authorLower === "legal 500" ||
        authorLower === "legal500" ||
        authorLower === "legal500.com"
      );
    });

    const isYoouzOfficial =
      authorLower === "yoouz" ||
      authorLower === "yoouz.com" ||
      authorLower === "yoouz beta" ||
      authorIdentifier === "yoouz" ||
      authorIdentifier === "yoouz.com" ||
      (author.email && author.email.toLowerCase().trim() === "info@yoouz.com");

    if (isYoouzOfficial) {
      handleOpenPlaceDrawer("yoouz.com");
      return;
    }

    if (matchingPlace || authorLower.includes("legal500")) {
      const targetPlaceId = matchingPlace ? matchingPlace.id : "legal500.com";
      handleOpenPlaceDrawer(targetPlaceId);
      return;
    }
    
    // Save background video index and section before entering the drawer context
    if (!selectedPlaceIdForDrawer && !selectedAuthorForDrawer) {
      savedHomeVideoIndexRef.current = currentVideoIndex;
      previousSectionRef.current = activeSection;
    }

    const registeredUser = allRegisteredUsers?.find((u: any) => {
      const uName = (u.name || "").trim().toLowerCase();
      const uHandle = (u.handle || "").replace(/^@+/, "").trim().toLowerCase();
      const uEmail = (u.email || "").split("@")[0].toLowerCase();
      return uName === authorIdentifier || uHandle === authorIdentifier || uEmail === authorIdentifier;
    });
    const known = KNOWN_COMMUNITY_USERS[authorIdentifier];
    const enrichedAuthor: VideoAuthor = {
      ...author,
      location: author.location || registeredUser?.location || known?.location,
      avatar: author.avatar || registeredUser?.avatar || known?.avatar,
      bio: author.bio || registeredUser?.bio || known?.bio
    };

    setFullscreenFeedContext(null);
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(enrichedAuthor);

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (isDesktop) {
      setCurrentVideoIndex(0);
    }
  };

  // Handle Likes - fully synced with BunnyDB
  const handleToggleLike = async (videoId: string) => {
    if (!currentUser) {
      setAuthIntent("like");
      setIsAuthModalOpen(true);
      return;
    }
    const now = Date.now();
    const lastClick = pendingLikeClickRef.current.get(videoId) || 0;
    if (now - lastClick < 350) return; // Prevent rapid multi-clicks
    pendingLikeClickRef.current.set(videoId, now);

    let nextLikes = 0;
    let nextIsLiked = false;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          nextIsLiked = !v.isLiked;
          const currentLikes = typeof v.likes === 'number' && !isNaN(v.likes) ? v.likes : 0;
          nextLikes = nextIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
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

    // Persist to Server and BunnyDB database
    try {
      const effectiveUserId = currentUser?.email || auth.currentUser?.uid || "community_user";
      fetch("/api/interactions/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, isLiked: nextIsLiked, likesCount: nextLikes, userId: effectiveUserId })
      })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.likesCount === 'number') {
          const authLikes = nextIsLiked ? Math.max(1, data.likesCount) : data.likesCount;
          setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likesCount: authLikes, likes: authLikes } : v));
        }
      })
      .catch(() => {});
    } catch (e) {}

    try {

    } catch (err) {}

    // Send social activity notification to video author
    if (nextIsLiked && currentUser) {
      const targetVid =
        videos.find((v) => v.id === videoId) ||
        videosRef.current.find((v) => v.id === videoId) ||
        places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);
      if (targetVid) {
        const { recipientEmail, recipientId, recipientHandle } = getAuthorNotificationRecipient(targetVid);

        sendSocialNotification({
          recipientEmail,
          recipientId,
          recipientHandle,
          type: "like",
          user: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            email: currentUser.email
          },
          text: `liked your video review of ${targetVid.placeName || "a place"}`,
          videoId: targetVid.id,
          videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
          placeName: targetVid.placeName,
          customId: `notif_like_${currentUser?.email || auth.currentUser?.uid || 'anon'}_${targetVid.id}`
        }).catch(() => {});
      }
    }
  };

  const getAuthorNotificationRecipient = (targetVid: VideoReview) => {
    const author = targetVid.author;
    const authorName = (author?.name || "").trim();
    const cleanHandle = authorName.replace(/^@/, "").trim();
    const authorHandle = ((author as any)?.handle || (targetVid as any).userHandle || "").toLowerCase().replace(/^@/, "").trim();

    let email = (targetVid.userEmail && targetVid.userEmail.includes("@") ? targetVid.userEmail : "") ||
                (author?.email && author.email.includes("@") ? author.email : "") ||
                (targetVid.userId && targetVid.userId.includes("@") ? targetVid.userId : "");

    let uid = targetVid.userId || (author as any)?.id || (author as any)?.uid || "";

    if (!email || !email.includes("@")) {
      const match = allRegisteredUsers.find((u) => {
        const uEmail = (u.email || "").toLowerCase();
        const uName = (u.name || "").toLowerCase();
        const uHandle = (u.handle || "").toLowerCase().replace(/^@/, "");
        const uId = (u.id || u.uid || "").toLowerCase();
        return (
          (uid && (uId === uid.toLowerCase() || uEmail === uid.toLowerCase())) ||
          (cleanHandle && (uHandle === cleanHandle.toLowerCase() || uName === cleanHandle.toLowerCase() || uEmail.startsWith(cleanHandle.toLowerCase()))) ||
          (authorHandle && (uHandle === authorHandle || uEmail.startsWith(authorHandle)))
        );
      });
      if (match) {
        if (match.email && match.email.includes("@")) email = match.email;
        if (!uid) uid = match.id || match.uid || "";
      }
    }

    if (!email || !email.includes("@")) {
      const lower = `${cleanHandle} ${authorHandle} ${(targetVid.userEmail || "")} ${(targetVid.userId || "")}`.toLowerCase();
      if (lower.includes("avtertuop") || lower.includes("avt ertuop") || lower.includes("avr6566gd") || lower.includes("avt")) {
        email = "avr6566gd@gmail.com";
      } else if (lower.includes("bizriv") || lower.includes("biz riv") || lower.includes("louis42111")) {
        email = "louis42111@gmail.com";
      } else if (lower.includes("aouisesmee")) {
        email = "aouisesmee@gmail.com";
      }
    }

    return {
      recipientEmail: email || cleanHandle,
      recipientId: uid || email || cleanHandle,
      recipientHandle: cleanHandle || authorHandle || authorName
    };
  };

  // Handle Bookmarks - fully synced with Server, BunnyDB & BunnyDB
  const handleToggleBookmark = async (videoId: string) => {
    if (!currentUser) {
      setAuthIntent("bookmarks");
      setIsAuthModalOpen(true);
      return;
    }
    let nextBookmarked = false;
    let nextCount = 0;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          nextBookmarked = !v.isBookmarked;
          const currentCount = typeof v.bookmarksCount === 'number' && !isNaN(v.bookmarksCount) ? v.bookmarksCount : (typeof (v as any).bookmarks === 'number' ? (v as any).bookmarks : 0);
          nextCount = nextBookmarked ? Math.max(1, currentCount + 1) : Math.max(0, currentCount - 1);
          return {
            ...v,
            isBookmarked: nextBookmarked,
            bookmarksCount: nextCount,
            bookmarks: nextCount
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
      
      // Also sync to global user profile in BunnyDB

    } catch (e) {}

    // Persist to Server, Bunny.net Database and BunnyDB database
    try {
      const targetVid =
        videos.find((v) => v.id === videoId) ||
        videosRef.current.find((v) => v.id === videoId) ||
        places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);

      fetch("/api/interactions/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          placeId: (targetVid as any)?.placeId || "",
          isBookmarked: nextBookmarked,
          bookmarksCount: nextCount,
          userId: currentUser?.email || auth.currentUser?.uid
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.bookmarksCount === 'number') {
          const authCount = nextBookmarked ? Math.max(1, data.bookmarksCount) : data.bookmarksCount;
          setVideos(prev => prev.map(v => v.id === videoId ? { ...v, bookmarksCount: authCount, bookmarks: authCount } : v));
        }
      })
      .catch(() => {});
    } catch (e) {}

    try {

    } catch (err) {}

    // Send social activity notification to video author for bookmark/save
    if (nextBookmarked && currentUser) {
      const targetVid =
        videos.find((v) => v.id === videoId) ||
        videosRef.current.find((v) => v.id === videoId) ||
        places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);
      if (targetVid) {
        const { recipientEmail, recipientId, recipientHandle } = getAuthorNotificationRecipient(targetVid);

        sendSocialNotification({
          recipientEmail,
          recipientId,
          recipientHandle,
          type: "bookmark",
          user: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            email: currentUser.email
          },
          text: `saved your video review of ${targetVid.placeName || "a place"}`,
          videoId: targetVid.id,
          videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
          placeName: targetVid.placeName,
          customId: `notif_bookmark_${currentUser?.email || auth.currentUser?.uid || 'anon'}_${targetVid.id}`
        }).catch(() => {});
      }
    }
  };

  // Handle Reposts - fully synced with local storage and BunnyDB
  const handleToggleRepost = async (videoId: string) => {
    if (!currentUser) {
      setAuthIntent("repost");
      setIsAuthModalOpen(true);
      return;
    }

    let nextReposted = false;
    let nextCount = 0;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          nextReposted = !(v as any).isReposted;
          const currentCount = typeof (v as any).repostsCount === 'number' && !isNaN((v as any).repostsCount) ? (v as any).repostsCount : 0;
          nextCount = nextReposted ? Math.max(1, currentCount + 1) : Math.max(0, currentCount - 1);
          return {
            ...v,
            isReposted: nextReposted,
            repostsCount: nextCount
          };
        }
        return v;
      })
    );

    // Persist to user's reposted list in LocalStorage
    try {
      const repostedStr = localStorage.getItem("copo_reposted_video_ids") || "[]";
      let repostedIds: string[] = [];
      try { repostedIds = JSON.parse(repostedStr); } catch (e) {}
      if (nextReposted) {
        if (!repostedIds.includes(videoId)) repostedIds.push(videoId);
      } else {
        repostedIds = repostedIds.filter((id) => id !== videoId);
      }
      localStorage.setItem("copo_reposted_video_ids", JSON.stringify(repostedIds));
    } catch (e) {}

    // Persist to Server and BunnyDB database
    try {
      const effectiveUserId = currentUser?.email || auth.currentUser?.uid || "community_user";
      fetch("/api/interactions/repost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          userId: effectiveUserId,
          isReposted: nextReposted
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.repostsCount === 'number') {
          const authCount = nextReposted ? Math.max(1, data.repostsCount) : data.repostsCount;
          setVideos(prev => prev.map(v => v.id === videoId ? { ...v, repostsCount: authCount, isReposted: nextReposted } : v));
        }
      })
      .catch(() => {});
    } catch (e) {}

    // Send social activity notification to video author for repost
    if (nextReposted && currentUser) {
      const targetVid =
        videos.find((v) => v.id === videoId) ||
        videosRef.current.find((v) => v.id === videoId) ||
        places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);
      if (targetVid) {
        const { recipientEmail, recipientId, recipientHandle } = getAuthorNotificationRecipient(targetVid);

        sendSocialNotification({
          recipientEmail,
          recipientId,
          recipientHandle,
          type: "repost",
          user: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            email: currentUser.email
          },
          text: `reposted your video review of ${targetVid.placeName || "a place"}`,
          videoId: targetVid.id,
          videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
          placeName: targetVid.placeName,
          customId: `notif_share_${currentUser?.email || auth.currentUser?.uid || 'anon'}_${targetVid.id}`
        }).catch(() => {});
      }
    }
  };

  // Handle Share
  const handleOpenShare = async (video: VideoReview) => {
    setActiveShareVideo(video);
  };

  const handleToggleFollow = async (authorHandle: string) => {
    if (!currentUser) {
      setAuthIntent('following');
      setIsAuthModalOpen(true);
      return;
    }

    const cleanAuthorHandle = (authorHandle || "").trim();
    if (!cleanAuthorHandle) return;

    const now = Date.now();
    const lastClick = pendingFollowClickRef.current.get(cleanAuthorHandle.toLowerCase()) || 0;
    if (now - lastClick < 350) return; // Throttles rapid multi-clicks
    pendingFollowClickRef.current.set(cleanAuthorHandle.toLowerCase(), now);

    // Determine current follow state accurately from currentUser followedAuthors and localStorage
    let followedList: string[] = [];
    try {
      const stored = localStorage.getItem("copo_followed_authors") || "[]";
      followedList = Array.isArray(JSON.parse(stored)) ? JSON.parse(stored) : [];
    } catch (e) {
      followedList = currentUser.followedAuthors || [];
    }
    if (currentUser.followedAuthors && Array.isArray(currentUser.followedAuthors)) {
      currentUser.followedAuthors.forEach((h) => {
        if (h && !followedList.some((ex) => ex.toLowerCase() === h.toLowerCase())) {
          followedList.push(h);
        }
      });
    }

    const isCurrentlyFollowed = followedList.some(
      (h) => h.toLowerCase() === cleanAuthorHandle.toLowerCase()
    );
    const newFollowState = !isCurrentlyFollowed;

    // 1. Calculate updated list
    const updatedFollowed = newFollowState
      ? [...followedList.filter((h) => h.toLowerCase() !== cleanAuthorHandle.toLowerCase()), cleanAuthorHandle]
      : followedList.filter((h) => h.toLowerCase() !== cleanAuthorHandle.toLowerCase());

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem("copo_followed_authors", JSON.stringify(updatedFollowed));
    } catch (e) {}

    // 3. Update currentUser state immediately
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const nextUser = {
        ...prev,
        followedAuthors: updatedFollowed,
        followingCount: updatedFollowed.length
      };
      try {
        localStorage.setItem("copo_user_profile", JSON.stringify(nextUser));
      } catch (e) {}
      return nextUser;
    });

    // 4. Update videos state immediately so cards from this author reflect state & follower counts
    setVideos((prev) =>
      prev.map((v) => {
        if (v.author && v.author.name && v.author.name.toLowerCase() === cleanAuthorHandle.toLowerCase()) {
          const curCount = typeof v.author.followersCount === "number" ? v.author.followersCount : 0;
          return {
            ...v,
            author: {
              ...v.author,
              isFollowed: newFollowState,
              followersCount: Math.max(0, curCount + (newFollowState ? 1 : -1))
            }
          };
        }
        return v;
      })
    );

    // 5. Update selectedAuthorForDrawer if drawer is open
    setSelectedAuthorForDrawer((prev) => {
      if (prev && prev.name && prev.name.toLowerCase() === cleanAuthorHandle.toLowerCase()) {
        const curCount = typeof prev.followersCount === "number" ? prev.followersCount : 0;
        return {
          ...prev,
          isFollowed: newFollowState,
          followersCount: Math.max(0, curCount + (newFollowState ? 1 : -1))
        };
      }
      return prev;
    });

    // 6. Update allRegisteredUsers state immediately so follower counts and follower lists reflect live
    const myIdentifier = currentUser.name || currentUser.email || "Reviewer";
    let targetUserObj: any = null;
    setAllRegisteredUsers((prev) =>
      prev.map((u) => {
        const isTarget =
          (u.name && u.name.toLowerCase() === cleanAuthorHandle.toLowerCase()) ||
          (u.handle && u.handle.toLowerCase() === cleanAuthorHandle.toLowerCase()) ||
          (u.email && u.email.toLowerCase().startsWith(cleanAuthorHandle.toLowerCase()));

        if (isTarget) {
          targetUserObj = u;
          const curCount = typeof u.followersCount === "number" ? u.followersCount : 0;
          const nextCount = Math.max(0, curCount + (newFollowState ? 1 : -1));
          const curFollowers = Array.isArray(u.followers) ? u.followers : [];
          const nextFollowers = newFollowState
            ? (curFollowers.includes(myIdentifier) ? curFollowers : [...curFollowers, myIdentifier])
            : curFollowers.filter((f: string) => f !== myIdentifier);
          return {
            ...u,
            followersCount: nextCount,
            followers: nextFollowers
          };
        }
        return u;
      })
    );

    // 7. Persist to server backend API instantly for live database sync across everybody
    const followerUid = auth.currentUser?.uid || currentUser.uid || currentUser.email || "user";
    fetch("/api/interactions/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerUserId: followerUid,
        followerName: currentUser.name || "Reviewer",
        followerAvatar: currentUser.avatar || "",
        targetHandle: cleanAuthorHandle,
        targetUserId: targetUserObj?.id || targetUserObj?.uid || "",
        isFollowed: newFollowState
      })
    }).catch((err) => console.warn("Notice updating server follow interaction:", err));

    // 8. Persist follower's profile in BunnyDB and NoSQL sync


    fetch(`/api/nosql/users/${followerUid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          followedAuthors: updatedFollowed,
          followingCount: updatedFollowed.length
        },
        merge: true
      })
    }).catch(() => {});

    const cleanEmailKey = (currentUser.email || "").toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (cleanEmailKey && `usr_${cleanEmailKey}` !== followerUid) {
      fetch(`/api/nosql/users/usr_${cleanEmailKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            followedAuthors: updatedFollowed,
            followingCount: updatedFollowed.length
          },
          merge: true
        })
      }).catch(() => {});
    }

    // 9. Persist target user's followers in BunnyDB and NoSQL sync
    const targetDocId = targetUserObj?.id || targetUserObj?.uid;
    if (targetDocId) {
      fetch(`/api/nosql/users/${targetDocId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            followersCount: Math.max(0, ((targetUserObj?.followersCount || 0) + (newFollowState ? 1 : -1))),
            followers: newFollowState
              ? Array.from(new Set([...(targetUserObj?.followers || []), myIdentifier]))
              : (targetUserObj?.followers || []).filter((f: string) => f !== myIdentifier)
          },
          merge: true
        })
      }).catch(() => {});
    }

    // 10. Send real-time social notification to target reviewer
    if (newFollowState && currentUser) {
      let recEmail = (targetUserObj?.email && targetUserObj.email.includes("@")) ? targetUserObj.email : "";
      let recId = targetUserObj?.id || targetUserObj?.uid || "";
      if (!recEmail) {
        const lower = cleanAuthorHandle.toLowerCase();
        if (lower.includes("avtertuop") || lower.includes("avt ertuop") || lower.includes("avr6566gd") || lower.includes("avt")) recEmail = "avr6566gd@gmail.com";
        else if (lower.includes("bizriv") || lower.includes("biz riv") || lower.includes("louis42111")) recEmail = "louis42111@gmail.com";
        else if (lower.includes("aouisesmee")) recEmail = "aouisesmee@gmail.com";
      }

      sendSocialNotification({
        recipientHandle: cleanAuthorHandle,
        recipientEmail: recEmail || cleanAuthorHandle.replace(/^@/, ""),
        recipientId: recId || recEmail || cleanAuthorHandle,
        type: "follow",
        user: {
          name: currentUser.name,
          avatar: currentUser.avatar,
          email: currentUser.email
        },
        text: `started following your reviews`,
        customId: `notif_follow_${currentUser?.email || auth.currentUser?.uid || 'anon'}_${cleanAuthorHandle}`
      }).catch(() => {});
    }
  };

  // Handle Follow Place (Business) - Strict Explicit Follow Only
  const handleToggleFollowPlace = (placeId: string) => {
    if (!currentUser) {
      setAuthIntent("general");
      setIsAuthModalOpen(true);
      return;
    }
    const cleanPlaceId = String(placeId || "").trim();
    if (!cleanPlaceId) return;

    const currentFollows = currentUser.followedPlaces || [];
    const isFollowing = currentFollows.some((id) => String(id).toLowerCase().trim() === cleanPlaceId.toLowerCase());
    const updatedFollowedPlaces = isFollowing
      ? currentFollows.filter((id) => String(id).toLowerCase().trim() !== cleanPlaceId.toLowerCase())
      : [...currentFollows, cleanPlaceId];
      
    const followerUid = currentUser.id || currentUser.uid || currentUser.email || "guest";
    setCurrentUser((prev) => (prev ? { ...prev, followedPlaces: updatedFollowedPlaces } : null));

    // Save strictly to followed places in localStorage
    try {
      localStorage.setItem("copo_followed_places", JSON.stringify(updatedFollowedPlaces));
    } catch (e) {}

    // Update places state to immediately reflect accurate follow state
    setPlaces((prev) =>
      prev.map((p) => {
        const pIdMatch = String(p.id).toLowerCase() === cleanPlaceId.toLowerCase();
        const pSlugMatch = (p as any).slug && String((p as any).slug).toLowerCase() === cleanPlaceId.toLowerCase();
        if (pIdMatch || pSlugMatch) {
          return { ...p, isFollowed: !isFollowing };
        }
        return p;
      })
    );

    // Call /api/follow for place
    fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerUserId: followerUid,
        followerName: currentUser.name || "User",
        followerAvatar: currentUser.avatar || "",
        placeId: cleanPlaceId,
        type: "place",
        isFollowed: !isFollowing
      })
    }).catch(() => {});

    // 9. Persist to NoSQL endpoint
    fetch(`/api/nosql/users/${followerUid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          followedPlaces: updatedFollowedPlaces
        },
        merge: true
      })
    }).catch(() => {});
  };

  // Handle Adding Comment or Threaded Reply - fully synced with BunnyDB
  const handleAddComment = async (
    videoId: string,
    text: string,
    options?: {
      replyToId?: string;
      postAsOwner?: boolean;
      postAsCreator?: boolean;
      commentItem?: ReviewComment;
    }
  ) => {
    if (!currentUser) {
      setAuthIntent("general");
      setIsAuthModalOpen(true);
      return;
    }

    const cleanText = (text || "").trim();
    if (!cleanText) return;

    const now = Date.now();
    const commentKey = `${videoId}:${cleanText}`;
    const lastCommentTime = pendingCommentClickRef.current.get(commentKey) || 0;
    if (now - lastCommentTime < 1500) return; // Deduplicates rapid double submissions
    pendingCommentClickRef.current.set(commentKey, now);

    const targetVid =
      videos.find((v) => v.id === videoId) ||
      videosRef.current.find((v) => v.id === videoId) ||
      (activeCommentVideo && activeCommentVideo.id === videoId ? activeCommentVideo : null) ||
      places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);

    const isTargetCreator = Boolean(
      options?.postAsCreator ||
      (currentUser.email && targetVid?.userEmail && currentUser.email.toLowerCase().trim() === (targetVid?.userEmail || "").toLowerCase().trim()) ||
      (currentUser.email && targetVid?.userId && currentUser.email.toLowerCase().trim() === (targetVid?.userId || "").toLowerCase().trim()) ||
      (currentUser.name && targetVid?.author?.name && currentUser.name.toLowerCase().trim() === (targetVid?.author?.name || "").toLowerCase().trim())
    );

    const targetPlace = places.find(
      (p) => p.id === targetVid?.placeId || (p.reviews && p.reviews.some((r) => r.id === videoId))
    );
    const placeName = targetPlace?.name || targetVid?.placeName || "Business";
    const placeLogo = targetPlace?.logoUrl || targetVid?.placeLogoUrl || "";

    const authorName = options?.commentItem?.authorName || (options?.postAsOwner
      ? placeName
      : (currentUser.name || (isTargetCreator ? "Video Reviewer" : (currentUser.email ? currentUser.email.split("@")[0] : "Verified Reviewer"))));
    const authorHandle = options?.commentItem?.authorHandle || (options?.postAsOwner
      ? (targetPlace?.brandDomain || "owner")
      : (currentUser.email ? currentUser.email.split("@")[0] : (isTargetCreator ? "reviewer" : "user")));
    const validCurrentAvatar =
      currentUser.avatar &&
      !currentUser.avatar.includes("photo-1534528741775") &&
      !currentUser.avatar.includes("photo-1535713875002")
        ? currentUser.avatar
        : "";

    const authorAvatar = options?.commentItem?.authorAvatar || (options?.postAsOwner
      ? (placeLogo || getSafeAvatarUrl(null, placeName, placeName))
      : getSafeAvatarUrl(validCurrentAvatar, authorName, (currentUser as any)?.handle || currentUser?.email || authorName));

    const newCommentItem: ReviewComment = options?.commentItem ? {
      ...options.commentItem,
      text: cleanText,
      isOwner: Boolean(options.postAsOwner || options.commentItem.isOwner)
    } : {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      authorName,
      authorHandle,
      authorAvatar,
      text: cleanText,
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

    const tree = buildCommentTree(nextComments);

    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              commentsCount: tree.count,
              comments: tree.comments
            }
          : v
      )
    );

    if (activeCommentVideo && activeCommentVideo.id === videoId) {
      setActiveCommentVideo((prev) =>
        prev
          ? {
              ...prev,
              commentsCount: tree.count,
              comments: tree.comments
            }
          : null
      );
    }

    // Persist to BunnyDB database & SQLite
    try {
      const dataToSave = cleanData({
        comments: tree.comments,
        commentsCount: tree.count
      });

      fetch(`/api/nosql/videoReviews/${videoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave, merge: true })
      }).catch(() => {});
      fetch("/api/interactions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, comment: newCommentItem, userId: currentUser?.email || auth.currentUser?.uid })
      }).catch(() => {});
    } catch (err) {
      console.warn("BunnyDB comment sync warning:", err);
    }

    // Send social notification for comment / reply IMMEDIATELY
    if (currentUser && targetVid) {
      const { recipientEmail, recipientId, recipientHandle } = getAuthorNotificationRecipient(targetVid);

      sendSocialNotification({
        recipientEmail,
        recipientId,
        recipientHandle,
        type: "comment",
        user: {
          name: currentUser.name,
          avatar: currentUser.avatar,
          email: currentUser.email
        },
        text: `commented: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}" on your review of ${targetVid.placeName || "a place"}`,
        videoId: targetVid.id,
        videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
        placeName: targetVid.placeName,
        customId: `notif_comment_${newCommentItem.id}`
      }).catch(() => {});

      // If replying to someone else's comment, also notify the comment author!
      if (options?.replyToId) {
        const parentComm = (targetVid.comments || []).find((c) => c.id === options.replyToId);
        if (parentComm) {
          const parentAuthor = (parentComm.authorName || parentComm.authorHandle || "").trim();
          const cleanP = parentAuthor.replace(/^@/, "");
          if (parentAuthor && cleanP.toLowerCase() !== (currentUser.name || "").toLowerCase() && parentAuthor !== currentUser.email) {
            let pEmail = parentComm.authorHandle?.includes("@") ? parentComm.authorHandle : "";
            if (!pEmail) {
              const lower = `${cleanP} ${parentComm.authorHandle || ""}`.toLowerCase();
              if (lower.includes("aouisesmee")) pEmail = "aouisesmee@gmail.com";
              else if (lower.includes("avtertuop") || lower.includes("avr6566gd") || lower.includes("avt")) pEmail = "avr6566gd@gmail.com";
              else if (lower.includes("bizriv") || lower.includes("louis42111")) pEmail = "louis42111@gmail.com";
            }
            sendSocialNotification({
              recipientEmail: pEmail || cleanP,
              recipientHandle: parentComm.authorHandle || cleanP,
              recipientId: pEmail || cleanP,
              type: "comment",
              user: {
                name: currentUser.name,
                avatar: currentUser.avatar,
                email: currentUser.email
              },
              text: `replied to your comment: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
              videoId: targetVid.id,
              videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
              placeName: targetVid.placeName,
              customId: `notif_reply_${newCommentItem.id}`
            }).catch(() => {});
          }
        }
      }
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
    let targetIsLiked = false;
    let targetLikesCount = 0;

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
                      targetIsLiked = nextLiked;
                      targetLikesCount = nextCount;
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
                targetIsLiked = nextLiked;
                targetLikesCount = nextCount;
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

    // Persist to BunnyDB database & SQLite
    try {
      const dataToSave = cleanData({ comments: updatedComments });

      fetch(`/api/nosql/videoReviews/${videoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave, merge: true })
      }).catch(() => {});
      fetch("/api/interactions/comment/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          commentId,
          replyId,
          userId: currentUser?.email || auth.currentUser?.uid,
          isLiked: targetIsLiked,
          likesCount: targetLikesCount
        })
      }).catch(() => {});
    } catch (err) {
      console.warn("BunnyDB comment like sync warning:", err);
    }

    // Send social activity notification to comment/reply author
    if (currentUser) {
      const targetVid =
        videos.find((v) => v.id === videoId) ||
        videosRef.current.find((v) => v.id === videoId) ||
        (activeCommentVideo && activeCommentVideo.id === videoId ? activeCommentVideo : null) ||
        places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);

      if (targetVid && targetVid.comments) {
        let likedComment: any = null;
        if (replyId) {
          const parent = targetVid.comments.find((c) => c.id === commentId);
          likedComment = parent?.replies?.find((r) => r.id === replyId);
        } else {
          likedComment = targetVid.comments.find((c) => c.id === commentId);
        }

        const isNowLiked = updatedComments.some((c) => {
          if (replyId) {
            return c.replies?.some((r) => r.id === replyId && r.isLiked);
          }
          return c.id === commentId && c.isLiked;
        });

        if (isNowLiked && likedComment) {
          const authorName = (likedComment.authorName || likedComment.authorHandle || likedComment.user?.name || "").trim();
          const cleanH = authorName.replace(/^@/, "");
          let authorEmail = likedComment.authorHandle?.includes("@") ? likedComment.authorHandle : (likedComment.user?.email || "");
          if (!authorEmail) {
            const lower = `${cleanH} ${likedComment.authorHandle || ""}`.toLowerCase();
            if (lower.includes("aouisesmee")) authorEmail = "aouisesmee@gmail.com";
            else if (lower.includes("avtertuop") || lower.includes("avr6566gd") || lower.includes("avt")) authorEmail = "avr6566gd@gmail.com";
            else if (lower.includes("bizriv") || lower.includes("louis42111")) authorEmail = "louis42111@gmail.com";
          }
          if (authorEmail !== currentUser.email && cleanH.toLowerCase() !== (currentUser.name || "").toLowerCase()) {
            sendSocialNotification({
              recipientEmail: authorEmail || cleanH,
              recipientHandle: cleanH || authorName,
              recipientId: authorEmail || cleanH,
              type: "like",
              user: {
                name: currentUser.name,
                avatar: currentUser.avatar,
                email: currentUser.email
              },
              text: `liked your comment: "${(likedComment.text || "").slice(0, 40)}${(likedComment.text || "").length > 40 ? '...' : ''}"`,
              videoId: targetVid.id,
              videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
              placeName: targetVid.placeName
            }).catch(() => {});
          }
        }
      }
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
      const dataToSave = cleanData({ comments: updatedComments });

      fetch(`/api/nosql/videoReviews/${videoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave, merge: true })
      }).catch(() => {});
      fetch("/api/interactions/comment/heart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          commentId,
          replyId,
          userId: currentUser?.email || auth.currentUser?.uid,
          likedByCreator: updatedComments.some((c) => {
            if (replyId) return c.replies?.some((r) => r.id === replyId && r.likedByCreator);
            return c.id === commentId && c.likedByCreator;
          })
        })
      }).catch(() => {});
    } catch (err) {
      console.warn("BunnyDB creator heart sync warning:", err);
    }

    // Send social activity notification to comment author if creator loved it
    if (currentUser) {
      const targetVid =
        videos.find((v) => v.id === videoId) ||
        videosRef.current.find((v) => v.id === videoId) ||
        (activeCommentVideo && activeCommentVideo.id === videoId ? activeCommentVideo : null) ||
        places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);

      if (targetVid && targetVid.comments) {
        let lovedComment: any = null;
        if (replyId) {
          const parent = targetVid.comments.find((c) => c.id === commentId);
          lovedComment = parent?.replies?.find((r) => r.id === replyId);
        } else {
          lovedComment = targetVid.comments.find((c) => c.id === commentId);
        }

        const isLoved = updatedComments.some((c) => {
          if (replyId) return c.replies?.some((r) => r.id === replyId && r.likedByCreator);
          return c.id === commentId && c.likedByCreator;
        });

        if (isLoved && lovedComment) {
          const cAuthor = (lovedComment.authorName || lovedComment.authorHandle || "").trim();
          const cleanH = cAuthor.replace(/^@/, "");
          let aEmail = lovedComment.authorHandle?.includes("@") ? lovedComment.authorHandle : "";
          if (!aEmail) {
            const lower = `${cleanH} ${lovedComment.authorHandle || ""}`.toLowerCase();
            if (lower.includes("aouisesmee")) aEmail = "aouisesmee@gmail.com";
            else if (lower.includes("avtertuop") || lower.includes("avr6566gd") || lower.includes("avt")) aEmail = "avr6566gd@gmail.com";
            else if (lower.includes("bizriv") || lower.includes("louis42111")) aEmail = "louis42111@gmail.com";
          }
          if (aEmail !== currentUser.email && cleanH.toLowerCase() !== (currentUser.name || "").toLowerCase()) {
            sendSocialNotification({
              recipientEmail: aEmail || cleanH,
              recipientHandle: cleanH || cAuthor,
              recipientId: aEmail || cleanH,
              type: "like",
              user: {
                name: currentUser.name,
                avatar: currentUser.avatar,
                email: currentUser.email
              },
              text: `loved your comment: "${(lovedComment.text || "").slice(0, 40)}${(lovedComment.text || "").length > 40 ? '...' : ''}"`,
              videoId: targetVid.id,
              videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
              placeName: targetVid.placeName
            }).catch(() => {});
          }
        }
      }
    }
  };

  // Handle Deleting a Comment or Reply
  const handleDeleteComment = async (
    videoId: string,
    commentId: string,
    replyId?: string
  ) => {
    const targetDeletedId = replyId || commentId;
    if (targetDeletedId) {
      try {
        const delRaw = localStorage.getItem("copo_deleted_comments");
        const delList: string[] = delRaw ? JSON.parse(delRaw) : [];
        if (!delList.includes(targetDeletedId)) {
          delList.push(targetDeletedId);
          localStorage.setItem("copo_deleted_comments", JSON.stringify(delList));
        }
      } catch (e) {}
    }

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
      let totalCount = 0;
      updatedComments.forEach((c) => {
        totalCount += 1;
        if (Array.isArray(c.replies)) totalCount += c.replies.length;
      });

      // Update cached feed immediately to prevent resurrection on page reload
      try {
        const cached = localStorage.getItem("yoouz_cached_videos_v30");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const updatedCache = parsed.map((v: any) =>
              v.id === videoId ? { ...v, comments: updatedComments, commentsCount: totalCount } : v
            );
            localStorage.setItem("yoouz_cached_videos_v30", JSON.stringify(updatedCache));
          }
        }
      } catch (e) {}

      const dataToSave = cleanData({ comments: updatedComments, commentsCount: totalCount });

      fetch(`/api/nosql/videoReviews/${videoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave, merge: true })
      }).catch(() => {});
      fetch("/api/interactions/comment/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          commentId,
          replyId,
          userId: currentUser?.email || auth.currentUser?.uid
        })
      }).catch(() => {});
    } catch (err) {
      console.warn("delete comment sync warning:", err);
    }
  };

  // Handle Adding/Updating Owner Response on Review - fully synced with BunnyDB
  const handleSaveOwnerResponse = async (videoId: string, text: string) => {
    const cleanText = text.trim();
    const ownerResp = cleanText ? {
      text: cleanText,
      respondedAt: "Just now",
      respondedAtMs: Date.now()
    } : undefined;

    let updatedComments: ReviewComment[] = [];

    setVideos((prev) => {
      const updated = prev.map((v) => {
        if (v.id === videoId) {
          const existingComments = v.comments || [];
          // Preserve all real user and business owner comments in the thread
          const cleanExisting = existingComments.filter((c) => c.id !== `owner_comm_${videoId}`);
          updatedComments = cleanExisting;

          return {
            ...v,
            ownerResponse: ownerResp,
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
              ownerResponse: ownerResp,
              comments: updatedComments,
              commentsCount: updatedComments.length
            }
          : null
      );
    }

    // Persist to Server and BunnyDB database via dedicated endpoint
    try {
      fetch("/api/videos/owner-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          text: cleanText
        })
      }).catch(() => {});
    } catch (e) {}

    // Send social notification to review author that business responded
    if (cleanText) {
      const targetVid =
        videos.find((v) => v.id === videoId) ||
        videosRef.current.find((v) => v.id === videoId) ||
        (activeCommentVideo && activeCommentVideo.id === videoId ? activeCommentVideo : null) ||
        places.flatMap((p) => p.reviews || []).find((v) => (v as any).id === videoId);

      if (targetVid) {
        const { recipientEmail, recipientId, recipientHandle } = getAuthorNotificationRecipient(targetVid);
        const placeName = targetVid.placeName || "Business";
        sendSocialNotification({
          recipientEmail,
          recipientId,
          recipientHandle,
          type: "comment",
          user: {
            name: `${placeName} (Owner)`,
            avatar: targetVid.placeLogoUrl || getSafeAvatarUrl(null, placeName, placeName),
            email: currentUser?.email || "owner@yoouz.com"
          },
          text: `responded to your review: "${cleanText.slice(0, 50)}${cleanText.length > 50 ? '...' : ''}"`,
          videoId: targetVid.id,
          videoThumbnail: resolveVideoPosterUrl(targetVid) || targetVid.author?.avatar,
          placeName: targetVid.placeName
        }).catch(() => {});
      }
    }
  };

  // Handle Deleting Owner Response
  const handleDeleteOwnerResponse = async (videoId: string) => {
    let updatedComments: ReviewComment[] = [];

    setVideos((prev) => {
      const updated = prev.map((v) => {
        if (v.id === videoId) {
          const { ownerResponse, ...rest } = v;
          updatedComments = (v.comments || []).filter((c) => c.id !== `owner_comm_${videoId}`);
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
      fetch("/api/videos/owner-response", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      }).catch(() => {});
    } catch (e) {}
  };

  // Handle Opening the Create Review Modal
  const handleOpenCreateReview = (place: Place | null = null) => {
    if (!currentUser || !isProfileComplete(currentUser)) {
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
    if (!videoId) return;
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }
    await handleAdminDeleteVideo(videoId);
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

  // Handle Save / Bookmark Creator
  const handleToggleSaveCreator = (author: VideoAuthor) => {
    if (!author?.name) return;
    const cleanName = author.name.toLowerCase();
    setSavedCreators((prev) => {
      const exists = prev.includes(cleanName);
      let next;
      if (exists) {
        next = prev.filter((n) => n !== cleanName);
      } else {
        next = [...prev, cleanName];
      }
      try {
        localStorage.setItem("yoouz_saved_creators", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Handle Updating Business Information (Claim, Edit, Add Phone/Website/Hours)
  const handleUpdatePlace = (updatedPlace: Place, skipServerSync = false) => {
    if (!updatedPlace || !updatedPlace.id) return;
    const updatedSlug = getPlaceSlug(updatedPlace.id);
    const updatedDomain = extractCleanDomain(updatedPlace.brandDomain || updatedPlace.website || updatedPlace.id);

    setPlaces((prev) => {
      let matched = false;
      const nextList = prev.map((p) => {
        const pSlug = getPlaceSlug(p.id);
        const pDomain = extractCleanDomain(p.brandDomain || p.website || p.id);
        const isMatch = p.id === updatedPlace.id || 
                        (updatedSlug && pSlug === updatedSlug) || 
                        (updatedDomain && pDomain === updatedDomain);
        if (isMatch) {
          matched = true;
          return {
            ...p,
            ...updatedPlace,
            id: updatedPlace.id || p.id
          };
        }
        return p;
      });

      const finalList = matched ? nextList : [updatedPlace, ...prev];
      try {
        localStorage.setItem("yoouz_cached_places", JSON.stringify(finalList));
      } catch (e) {}
      return finalList;
    });

    if (skipServerSync) return;

    // Mirror updates to BunnyDB so they persist forever
    try {
      fetch(`/api/nosql/places/${encodeURIComponent(updatedPlace.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedPlace, merge: true })
      }).catch((e) => console.error("Error updating place in BunnyDB:", e));

      if (updatedPlace.id.includes('yoouz') || updatedPlace.name?.toLowerCase() === 'yoouz') {
        fetch(`/api/nosql/places/yoouz.com`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedPlace, merge: true })
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to sync updated place to databases:", err);
    }
  };

  // Handle Publishing New Video Review
  const handlePublishVideoReview = (newReview: VideoReview) => {
    setIsCreateModalOpen(false);
    setPreselectedPlaceForRecording(null);
    
    // Ensure flags for feed pagination persistence
    (newReview as any).isLocalUpload = true;
    if (!newReview.createdAtMs) newReview.createdAtMs = Date.now();

    setVideos((prev) => {
      return [newReview, ...prev.filter((v) => v.id !== newReview.id)];
    });
    setSelectedPlaceIdForDrawer(null);
    setSelectedAuthorForDrawer(null);
    setFullscreenFeedContext(null);
    setActiveSection("home");
    setActiveSubTab("discover");
    setCurrentVideoIndex(0);
    savedHomeVideoIndexRef.current = 0;
    setPendingVideoId(newReview.id);

    // Persist to local durable backup store so it is never dropped across reload or navigation
    try {
      const existingSaved = localStorage.getItem("yoouz_local_created_reviews");
      let list: any[] = [];
      if (existingSaved) {
        try { list = JSON.parse(existingSaved); } catch (e) {}
      }
      if (!Array.isArray(list)) list = [];
      list = [newReview, ...list.filter((v: any) => v && v.id !== newReview.id)].slice(0, 50);
      localStorage.setItem("yoouz_local_created_reviews", JSON.stringify(list));
    } catch (e) {}

    // Double-sync to Bunny Database and Server
    try {
      fetch("/api/videos/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview)
      }).catch(() => {});

      fetch(`/api/nosql/videoReviews/${newReview.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newReview, merge: true })
      }).catch(() => {});
    } catch (e) {}

    // Ensure place exists in places list or update its rating/review count and persist to DB
    setPlaces((prev) => {
      const exists = prev.some((p) => isPlaceReviewMatch(newReview, p));
      let targetPlace: Place;
      let nextList: Place[];

      if (!exists) {
        targetPlace = synthesizePlaceFromReview(newReview, prev);
        targetPlace = {
          ...targetPlace,
          reviews: [newReview, ...(targetPlace.reviews || [])]
        };
        nextList = [targetPlace, ...prev];
      } else {
        nextList = prev.map((p) => {
          if (isPlaceReviewMatch(newReview, p)) {
            const newTotalReviews = (p.totalReviews || 0) + 1;
            const newRating = Number(
              (((p.rating || 5) * (p.totalReviews || 1) + newReview.rating) / newTotalReviews).toFixed(1)
            );
            const existingReviews = Array.isArray(p.reviews) ? p.reviews : [];
            const newReviews = [newReview, ...existingReviews.filter((r) => r.id !== newReview.id)];
            targetPlace = {
              ...p,
              reviews: newReviews,
              rating: newRating,
              totalReviews: newTotalReviews,
              videoReviewCount: (p.videoReviewCount || 0) + 1,
              logoUrl: p.logoUrl || newReview.placeLogoUrl || p.avatarUrl || "",
              avatarUrl: p.avatarUrl || newReview.placeLogoUrl || p.logoUrl || "",
              bannerUrl: p.bannerUrl || newReview.placeBannerUrl || p.ogImage || "",
              ogImage: p.ogImage || newReview.placeBannerUrl || p.bannerUrl || "",
              website: p.website || newReview.placeWebsite || "",
              description: newReview.placeDescription || (p.description && !p.description.includes("Verified video review destination") && !p.description.includes("Verified Yoouz business listing") ? p.description : "") || p.description || ""
            };
            return targetPlace;
          }
          return p;
        });
      }

      // Persist place directly to database so it is remembered forever
      if (targetPlace! && targetPlace.id) {

        fetch(`/api/nosql/places/${targetPlace.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: targetPlace, merge: true })
        }).catch(() => {});
      }

      return nextList;
    });
  };

  const bookmarkedVideos = useMemo(() => {
    return videos.filter((v) => v.isBookmarked);
  }, [videos]);

  const savedPlaces = useMemo(() => {
    return places.filter((p) => savedPlaceIds.includes(p.id));
  }, [places, savedPlaceIds]);

  const savedCreatorsList = useMemo(() => {
    const authorMap = new Map<string, VideoAuthor>();
    videos.forEach((v) => {
      if (v.author && v.author.name) {
        const key = v.author.name.toLowerCase().replace(/^@+/, '').trim();
        authorMap.set(key, {
          ...v.author,
          location: v.author.location || (v.placeCity && v.placeCity.toLowerCase() !== 'online' ? v.placeCity : undefined)
        });
      }
    });
    allRegisteredUsers.forEach((u) => {
      if (u.name) {
        const uLower = u.name.toLowerCase().replace(/^@+/, '').trim();
        const uLoc = u.location || (u.city && u.country ? `${u.city}, ${u.country}` : (u.city || u.country || ''));
        const existing = authorMap.get(uLower);
        authorMap.set(uLower, {
          name: u.name,
          handle: u.handle || `@${u.name.toLowerCase().replace(/\s+/g, '')}`,
          avatar: getSafeAvatarUrl(u.avatar || existing?.avatar, u.name, u.handle || u.name),
          bio: u.bio || existing?.bio,
          location: uLoc || existing?.location,
          city: u.city || existing?.city,
          country: u.country || existing?.country,
          isVerified: u.isVerified ?? existing?.isVerified,
          videoReviewCount: existing?.videoReviewCount,
          followersCount: u.followersCount || existing?.followersCount || 0,
          isFollowed: currentUser?.followedAuthors?.includes(u.name) || false
        });
      }
    });

    return savedCreators.map((name) => {
      const lower = name.toLowerCase().replace(/^@+/, '').trim();
      const existing = authorMap.get(lower) || authorMap.get(name.toLowerCase());
      const regUser = allRegisteredUsers.find((u: any) => {
        const uName = (u.name || '').trim().toLowerCase();
        const uHandle = (u.handle || '').replace(/^@+/, '').trim().toLowerCase();
        const uEmail = (u.email || '').split('@')[0].toLowerCase();
        return uName === lower || uHandle === lower || uEmail === lower;
      });
      const known = KNOWN_COMMUNITY_USERS[lower] || KNOWN_COMMUNITY_USERS[name.toLowerCase()];
      const isCurrent = currentUser && (
        (currentUser.name || '').trim().toLowerCase() === lower ||
        (currentUser.email || '').split('@')[0].toLowerCase() === lower
      );
      const currentLoc = currentUser?.location || (currentUser?.city && currentUser?.country ? `${currentUser.city}, ${currentUser.country}` : (currentUser?.city || currentUser?.country || ''));
      const currentCity = currentUser?.city;
      const currentCountry = currentUser?.country;

      const loc = existing?.location || regUser?.location || known?.location || (isCurrent ? currentLoc : '') || '';
      const city = existing?.city || regUser?.city || (isCurrent ? currentCity : '') || '';
      const country = existing?.country || regUser?.country || (isCurrent ? currentCountry : '') || '';
      const avatar = getSafeAvatarUrl((isCurrent ? currentUser?.avatar : undefined) || regUser?.avatar || existing?.avatar || known?.avatar, name, regUser?.handle || known?.handle || name);
      const isVerified = (isCurrent ? currentUser?.isVerified : undefined) ?? regUser?.isVerified ?? existing?.isVerified ?? (known as any)?.isVerified;

      return {
        ...(existing || {}),
        name: existing?.name || regUser?.name || known?.name || name,
        handle: existing?.handle || regUser?.handle || known?.handle || `@${name.toLowerCase().replace(/\s+/g, '')}`,
        avatar,
        location: loc,
        city,
        country,
        isVerified,
        isFollowed: currentUser?.followedAuthors?.includes(name) || existing?.isFollowed || false
      };
    });
  }, [videos, allRegisteredUsers, savedCreators, currentUser]);

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
    if (!activeCommentVideo) return false;

    // 1. In consumer view (Home, Discover, Search), users browse and comment as personal consumer accounts
    if (activeSection !== 'business') return false;

    // 2. Check verified business session or claimed places storage for active business view
    try {
      const rawSession = localStorage.getItem('copo_business_verified_session');
      if (rawSession) {
        const sess = JSON.parse(rawSession);
        if (sess && sess.placeId === activeCommentVideo.placeId) {
          return true;
        }
      }
      const rawClaimed = localStorage.getItem('copo_claimed_places');
      if (rawClaimed) {
        const claimedList = JSON.parse(rawClaimed);
        if (Array.isArray(claimedList) && claimedList.includes(activeCommentVideo.placeId)) {
          return true;
        }
      }
    } catch (e) {}

    // 3. Check logged-in user credentials against place (EXCLUDE admin role check!)
    if (!currentUser) return false;
    const place = places.find((p) => p.id === activeCommentVideo.placeId);
    if (!place) return false;
    return Boolean(
      (place.claimedByEmail && currentUser.email === place.claimedByEmail) ||
      (place.ownerId && currentUser.id === place.ownerId) ||
      (place.staffEmails && currentUser.email && place.staffEmails.includes(currentUser.email))
    );
  }, [activeCommentVideo, places, currentUser, activeSection]);

  const activeCommentPlace = useMemo(() => {
    if (!activeCommentVideo) return null;
    return (
      places.find((p) => p.id === activeCommentVideo.placeId || (p.reviews && p.reviews.some((r) => r.id === activeCommentVideo.id))) ||
      null
    );
  }, [activeCommentVideo, places]);

  const activeCommentPlaceLogo = useMemo(() => {
    if (!activeCommentVideo) return "/favicon.svg";
    if (activeCommentPlace?.logoUrl && activeCommentPlace.logoUrl.trim() !== "" && !activeCommentPlace.logoUrl.startsWith("data:;")) {
      return activeCommentPlace.logoUrl;
    }
    if (activeCommentVideo.placeLogoUrl && activeCommentVideo.placeLogoUrl.trim() !== "" && !activeCommentVideo.placeLogoUrl.startsWith("data:;")) {
      return activeCommentVideo.placeLogoUrl;
    }
    const name = activeCommentPlace?.name || activeCommentVideo.placeName || "";
    const cleanName = name.toLowerCase().trim();
    if (!cleanName || cleanName.includes("yoouz") || cleanName.includes("owner") || cleanName.includes("business")) {
      return "/favicon.svg";
    }
    return getPlaceLogoUrl({ name, website: activeCommentPlace?.website || activeCommentVideo.placeWebsite, category: activeCommentPlace?.category || activeCommentVideo.placeCategory }) || getSafeAvatarUrl(null, name, name);
  }, [activeCommentVideo, activeCommentPlace]);

  const activeCommentPlaceName = useMemo(() => {
    return activeCommentPlace?.name || activeCommentVideo?.placeName || "Yoouz";
  }, [activeCommentPlace, activeCommentVideo]);

  const seoTitle = useMemo(() => {
    if (embedTargetId) return `Embedded Video Review Player for ${embedTargetId} - Yoouz`;
    if (activeSection === 'business') return 'Yoouz for Business - Claim Your Profile & Leverage Video Reviews';
    if (activeSection === 'home' && activeSubTab === 'following') return 'Following - Your Favorite Reviewers on Yoouz';
    if (activeSection === 'home' && activeSubTab === 'discover') return 'Discover Authentic Video Reviews on Yoouz';
    if (activeSection === 'admin') return 'Yoouz Admin Dashboard';
    return 'Yoouz - Real Video Reviews by Real People | Authentic Business Reviews';
  }, [activeSection, activeSubTab, embedTargetId]);

  const seoDescription = useMemo(() => {
    if (embedTargetId) return `Watch authentic 60-second video reviews for ${embedTargetId} on Yoouz.`;
    if (activeSection === 'business') return 'Claim your business profile on Yoouz, monitor authentic 60-second video reviews, and connect with your customers through authentic video feedback.';
    if (activeSection === 'home' && activeSubTab === 'following') return 'Watch the latest video reviews from the creators and local businesses you follow on Yoouz.';
    if (activeSection === 'home' && activeSubTab === 'discover') return 'Explore a continuous feed of authentic 60-second video reviews. Discover the best local businesses, food, and experiences near you.';
    return 'Yoouz is the #1 authentic video review network. Discover local businesses, restaurants, cafes, services, and online brands with 100% genuine 60-second video reviews by real customers. Zero fake text reviews.';
  }, [activeSection, activeSubTab, embedTargetId]);

  const seoUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://yoouz.com';
    const url = new URL(window.location.href);
    return url.origin + url.pathname + url.search;
  }, [activeSection, activeSubTab]);

  if (embedTargetId) {
    return (
      <div
        id="copo-app-root"
        className="w-full h-full min-h-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden font-sans select-none antialiased relative"
      >
        <SEOTags title={`Embedded Video Review Player - Yoouz`} description={`Watch authentic 60-second video reviews for ${embedTargetId}`} url={seoUrl} />
        
        <CopoEmbedView
          embedId={embedTargetId}
          places={places}
          videos={videos}
          currentUser={currentUser}
          allUsers={allRegisteredUsers}
          onOpenComments={(video) => setActiveCommentVideo(video)}
          onOpenShare={(video) => setActiveShareVideo(video)}
          onOpenPlace={handleOpenPlaceDrawer}
          onOpenCreator={handleOpenCreatorDrawer}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onToggleFollow={handleToggleFollow}
          onOpenReport={(v) => handleOpenReport({ type: "video", video: v })}
          onRecordReview={(place) => {
            setPreselectedPlaceForRecording(place || null);
            setIsCreateModalOpen(true);
          }}
          onOpenAuth={() => {
            setAuthIntent('record');
            setIsAuthModalOpen(true);
          }}
          onOpenMenu={() => setIsMobileNavDrawerOpen(true)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onSelectSection={(section) => {
            if (section === "home") {
              setEmbedTargetId(null);
              setActiveSection("home");
            } else if (section === "search") {
              setIsSearchModalOpen(true);
            } else if (section === "record_review") {
              setIsCreateModalOpen(true);
            } else if (section === "messages" || section === "profile" || section === "notifications") {
              if (!currentUser) {
                setAuthIntent(section as AuthIntent);
                setIsAuthModalOpen(true);
              } else {
                setEmbedTargetId(null);
                setActiveSection(section);
              }
            } else {
              setEmbedTargetId(null);
              setActiveSection(section);
            }
          }}
          unreadNotifsCount={currentUser ? notifications.filter((n) => !n.isRead).length : 0}
          unreadMessagesCount={calculateUnreadMessagesCount(messages, currentUser)}
          onCloseEmbed={() => {
            setEmbedTargetId(null);
            setSelectedPlaceIdForDrawer(null);
            setSelectedAuthorForDrawer(null);

            // 1. Send postMessage to host window if inside an iframe
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: "YOOUZ_EMBED_CLOSE", action: "close" }, "*");
                window.parent.postMessage({ type: "YOOUZ_CLOSE_MODAL", action: "close" }, "*");
                window.parent.postMessage("yoouz_close", "*");
              }
            } catch (e) {}

            // 2. If navigated from an external business website, return to referrer
            if (document.referrer && !document.referrer.includes(window.location.host)) {
              window.location.href = document.referrer;
            } else {
              // 3. Otherwise replace URL state synchronously to /
              try {
                window.history.replaceState(null, "", "/");
              } catch (e) {}
            }
          }}
        />

        {/* Place Drawer */}
        {selectedPlaceIdForDrawer && drawerPlace && (
          <CopoPlaceDrawer
            place={drawerPlace}
            allVideos={videos}
            onClose={handleCloseDrawers}
            onSelectVideo={(videoId) => handleSelectVideoById(videoId, "place")}
            onToggleGrabPlace={handleToggleGrabPlace}
            onUpdatePlace={handleUpdatePlace}
            onToggleFollowPlace={handleToggleFollowPlace}
            onOpenReport={handleOpenReport}
            isSaved={savedPlaceIds.includes(drawerPlace.id)}
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
        )}

        {/* Creator Drawer */}
        {selectedAuthorForDrawer && (
          <CopoCreatorDrawer
            author={selectedAuthorForDrawer}
            allVideos={videos}
            currentUser={currentUser}
            allUsers={allRegisteredUsers}
            activeVideoId={videos[currentVideoIndex]?.id}
            onClose={handleCloseDrawers}
            onSelectVideo={(videoId) => handleSelectVideoById(videoId, "creator")}
            onToggleFollow={handleToggleFollow}
            onStartChat={handleStartChat}
            onUpdateProfile={handleUpdateProfile}
            onOpenReport={(author) => handleOpenReport({ type: "user", author })}
            onRecordReview={handleOpenCreateReview}
            onDeleteVideo={handleDeleteUserVideo}
            isSaved={selectedAuthorForDrawer ? savedCreators.includes(selectedAuthorForDrawer.name.toLowerCase()) : false}
            onToggleSaveCreator={handleToggleSaveCreator}
            onSignOut={async () => {
              await logOutUser();
              setCurrentUser(null);
              try {
                localStorage.removeItem("copo_user_profile");
              } catch (e) {}
              handleCloseDrawers();
            }}
            onDeactivateProfile={async () => {
              await handleDeactivateProfile();
              handleCloseDrawers();
            }}
            onDeleteProfile={async () => {
              await handleDeleteProfile();
              handleCloseDrawers();
            }}
            onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
            onOpenPlace={(placeId) => {
              setSelectedAuthorForDrawer(null);
              setSelectedPlaceIdForDrawer(placeId);
            }}
          />
        )}

        {activeCommentVideo && (
          <CopoCommentsDrawer
            video={activeCommentVideo}
            currentUser={currentUser}
            onClose={() => setActiveCommentVideo(null)}
            onRequireAuth={() => {
              setAuthIntent('comment');
              setIsAuthModalOpen(true);
            }}
            onAddComment={handleAddComment}
            onToggleCommentLike={handleToggleCommentLike}
            onToggleCreatorHeart={handleToggleCreatorHeart}
            onDeleteComment={handleDeleteComment}
            onAddOwnerResponse={handleSaveOwnerResponse}
            onDeleteOwnerResponse={handleDeleteOwnerResponse}
            isUserOwner={isUserOwnerOfCommentPlace}
            placeName={activeCommentPlaceName}
            placeLogoUrl={activeCommentPlaceLogo}
            onSelectAuthor={(handle, name, avatar) => {
              setActiveCommentVideo(null);
              handleOpenCreatorDrawer({
                name: name || handle,
                avatar: getSafeAvatarUrl(avatar, name || handle, handle || name),
                isVerified: false,
                isFollowed: false
              });
            }}
          />
        )}

        {/* Share Video Modal */}
        <CopoShareModal
          video={activeShareVideo}
          onClose={() => setActiveShareVideo(null)}
          onOpenReport={(v) => {
            setActiveShareVideo(null);
            handleOpenReport({ type: "video", video: v });
          }}
          onShareIncrement={handleShareIncrement}
        />

        {/* Report Modal */}
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

        <CopoGoogleAuthModal
          isOpen={isAuthModalOpen}
          intent={authIntent}
          onClose={() => setIsAuthModalOpen(false)}
          onOpenHelp={() => setIsAuthModalOpen(false)}
          onOpenLegal={(tab) => handleOpenLegal(tab)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
          }}
        />

        {/* Mobile Navigation Drawer (Hamburger Menu) */}
        <CopoMobileNavDrawer
          isOpen={isMobileNavDrawerOpen}
          onClose={() => setIsMobileNavDrawerOpen(false)}
          activeSection="home"
          onSelectSection={(section) => {
            setIsMobileNavDrawerOpen(false);
            if (section === "home") {
              // Stay on embed
            } else if (section === "search") {
              setIsSearchModalOpen(true);
            } else if (section === "record_review") {
              setIsCreateModalOpen(true);
            } else if (section === "business") {
              setEmbedTargetId(null);
              setActiveSection("business");
              window.history.pushState(null, "", "/business");
            } else {
              setEmbedTargetId(null);
              setActiveSection(section);
            }
          }}
          currentUser={currentUser}
          unreadNotifsCount={currentUser ? notifications.filter((n) => !n.isRead).length : 0}
          unreadMessagesCount={calculateUnreadMessagesCount(messages, currentUser)}
          onOpenCreateModal={() => {
            setIsMobileNavDrawerOpen(false);
            setIsCreateModalOpen(true);
          }}
          onOpenSearch={() => {
            setIsMobileNavDrawerOpen(false);
            setIsSearchModalOpen(true);
          }}
          onOpenAuth={(intent) => {
            setIsMobileNavDrawerOpen(false);
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
          onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
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
            onClose={() => setIsSearchModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      id="copo-app-root"
      className="flex w-screen h-[100dvh] overflow-hidden bg-zinc-950 text-white font-sans select-none antialiased relative"
    >
      <SEOTags title={seoTitle} description={seoDescription} url={seoUrl} />
      <AEOBlock />
      
      {/* Real-time In-App Pop-up Notifications & Messages Toast */}
      <InAppNotificationToast
        toast={inAppToast}
        onClose={() => setInAppToast(null)}
        onNavigateToThread={(threadId) => {
          setActiveSection("messages");
          setActiveThreadId(threadId);
        }}
        onNavigateToNotifications={() => {
          setActiveSection("notifications");
        }}
      />
      
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
          allUsers={allRegisteredUsers}
          activeVideoId={activeFeedVideos[currentVideoIndex]?.id}
          onClose={handleCloseDrawers}
          onSelectVideo={(videoId) => handleSelectVideoById(videoId, "creator")}
          onToggleFollow={handleToggleFollow}
          onStartChat={handleStartChat}
          onUpdateProfile={handleUpdateProfile}
          onOpenReport={(author) => handleOpenReport({ type: "user", author })}
          onRecordReview={handleOpenCreateReview}
          onDeleteVideo={handleDeleteUserVideo}
          isSaved={selectedAuthorForDrawer ? savedCreators.includes(selectedAuthorForDrawer.name.toLowerCase()) : false}
          onToggleSaveCreator={handleToggleSaveCreator}
          onSignOut={async () => {
            await logOutUser();
            setCurrentUser(null);
            try {
              localStorage.removeItem("copo_user_profile");
            } catch (e) {}
            handleCloseDrawers();
          }}
          onDeactivateProfile={async () => {
            await handleDeactivateProfile();
            handleCloseDrawers();
          }}
          onDeleteProfile={async () => {
            await handleDeleteProfile();
            handleCloseDrawers();
          }}
          onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
          onOpenPlace={(placeId) => {
            setSelectedAuthorForDrawer(null);
            setSelectedPlaceIdForDrawer(placeId);
          }}
        />
       ) : (activeSection === "business" || activeSection === "admin") ? null : (
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
                if (embedTargetId) {
                  setEmbedTargetId(null);
                  try {
                    window.history.replaceState(null, "", "/");
                  } catch (e) {}
                }
                setCurrentVideoIndex(0);
                setActiveSubTab("discover");
                setActiveSection("home");
                return;
              }
            }
            if (section === "discover") {
              if (window.innerWidth < 768) {
                setIsDiscoverModalOpen(true);
              } else {
                setSelectedPlaceIdForDrawer(null);
                setSelectedAuthorForDrawer(null);
                setActiveSection("discover");
              }
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
              window.history.pushState(null, "", "/yoouzadmin");
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
              setBusinessClaimTargetPlace(null);
              setBusinessInitialMode('signin');
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
          unreadMessagesCount={calculateUnreadMessagesCount(messages, currentUser)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenCreateModal={() => {
            if (!currentUser || !isProfileComplete(currentUser)) {
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
      <div className="copo-has-bottom-nav flex-1 h-[100dvh] flex flex-col relative overflow-hidden bg-zinc-950">
        {/* If in Feed View (Home) or Place / Creator drawer views: Display center video player */}
        {(isPlaceView || isCreatorView || activeSection === "home") && (
            <CopoVideoPlayer
              isPaused={Boolean(
                isCreateModalOpen || 
                isAuthModalOpen || 
                (activeSection !== "home" && !isPlaceView && !isCreatorView) ||
                (typeof window !== 'undefined' && window.innerWidth < 768 && (isPlaceView || isCreatorView))
              )}
              contextKey={currentFeedContextKey}
              onOpenCreateModal={() => {
                if (!currentUser || !isProfileComplete(currentUser)) {
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
              onOpenCreator={handleOpenCreatorDrawer}
              onOpenShare={handleOpenShare}
              onOpenReport={(v) => handleOpenReport({ type: "video", video: v })}
              currentUser={currentUser}
              allUsers={allRegisteredUsers}
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
              onToggleRepost={handleToggleRepost}
              onGoBack={
                embedTargetId
                  ? () => {
                      setEmbedTargetId(null);
                      setSelectedPlaceIdForDrawer(null);
                      setSelectedAuthorForDrawer(null);
                      try {
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage({ type: "YOOUZ_EMBED_CLOSE", action: "close" }, "*");
                          window.parent.postMessage({ type: "YOOUZ_CLOSE_MODAL", action: "close" }, "*");
                          window.parent.postMessage("yoouz_close", "*");
                        }
                      } catch (err) {}
                      if (document.referrer && !document.referrer.includes(window.location.host)) {
                        window.location.href = document.referrer;
                      } else {
                        try {
                          window.history.replaceState(null, "", "/");
                        } catch (err) {}
                      }
                    }
                  : fullscreenFeedContext
                  ? handleFeedGoBack
                  : undefined
              }
              onCloseEmbed={
                embedTargetId
                  ? () => {
                      setEmbedTargetId(null);
                      setSelectedPlaceIdForDrawer(null);
                      setSelectedAuthorForDrawer(null);
                      try {
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage({ type: "YOOUZ_EMBED_CLOSE", action: "close" }, "*");
                          window.parent.postMessage({ type: "YOOUZ_CLOSE_MODAL", action: "close" }, "*");
                          window.parent.postMessage("yoouz_close", "*");
                        }
                      } catch (err) {}
                      if (document.referrer && !document.referrer.includes(window.location.host)) {
                        window.location.href = document.referrer;
                      } else {
                        try {
                          window.history.replaceState(null, "", "/");
                        } catch (err) {}
                      }
                    }
                  : undefined
              }
              isEmbed={Boolean(embedTargetId)}
              feedContextTitle={embedTargetId ? embedTargetId : (fullscreenFeedContext?.title || (isCreatorView && selectedAuthorForDrawer ? selectedAuthorForDrawer.name : isPlaceView && drawerPlace ? drawerPlace.name : undefined))}
              onGoHome={handleGoHome}
              onOpenMenu={() => setIsMobileNavDrawerOpen(true)}
              onRecordView={handleRecordVideoView}
              unreadCount={(currentUser ? notifications.filter((n) => !n.isRead).length : 0) + (currentUser ? messages.reduce((acc, m) => acc + (m.unreadCount || 0), 0) : 0)}
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
                  
                  // Mirror to BunnyDB database immediately
                  fetch(`/api/nosql/places/${cleanPlace.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: cleanPlace, merge: true })
                  }).catch(() => {});

                  // Persist to BunnyDB immediately so it's "already saved" as per user request


                  setPlaces((prev) => {
                    const map = new Map<string, Place>();
                    map.set(cleanPlace.id, cleanPlace);
                    prev.forEach((p) => {
                      if (!map.has(p.id)) map.set(p.id, p);
                    });
                    return Array.from(map.values());
                  });
                }}
              />
            )}
            {activeSection === "record_review" && (
              <CopoSearchView
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

                  // Mirror to BunnyDB database immediately
                  fetch(`/api/nosql/places/${cleanPlace.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: cleanPlace, merge: true })
                  }).catch(() => {});

                  // Persist to BunnyDB immediately so it's "already saved" as per user request


                  setPlaces((prev) => {
                    const map = new Map<string, Place>();
                    map.set(cleanPlace.id, cleanPlace);
                    prev.forEach((p) => {
                      if (!map.has(p.id)) map.set(p.id, p);
                    });
                    return Array.from(map.values());
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
                onOpenCreator={handleOpenCreatorDrawer}
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

            {/* Live Embed Tester View */}
            {activeSection === "testembed" && (
              <CopoTestEmbedView
                places={places}
                videos={videos}
                onExit={() => {
                  setActiveSection("home");
                  try {
                    window.history.pushState(null, "", "/");
                  } catch (e) {}
                }}
              />
            )}


            {/* Admin View */}
            {activeSection === "admin" && (
              <CopoAdminPanel
                currentUser={currentUser}
                videos={videos}
                places={places}
                allUsers={allRegisteredUsers}
                onDeleteUser={handleAdminDeleteUser}
                onUpdateUser={handleAdminUpdateUser}
                onPurgeAllUsers={() => {
                  forceLogoutUser("All users purged by admin");
                  setAllRegisteredUsers([]);
                }}
                onDeleteVideo={handleAdminDeleteVideo}
                onBulkDeleteVideos={handleAdminBulkDeleteVideos}
                onPurgeAllVideos={handleAdminPurgeAllVideos}
                onUpdateVideo={(updatedVid) => {
                  setVideos((prev) => prev.map((v) => (v.id === updatedVid.id ? updatedVid : v)));
                  // Mirror to BunnyDB and Server
                  fetch("/api/videos/save-review", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedVid)
                  }).catch(() => {});
                  fetch(`/api/nosql/videoReviews/${updatedVid.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: updatedVid, merge: true })
                  }).catch(() => {});

                }}
                onDeletePlace={handleAdminDeletePlace}
                onBulkDeletePlaces={handleAdminBulkDeletePlaces}
                onPurgeAllPlaces={handleAdminPurgeAllPlaces}
                onUpdatePlace={(updatedPlace) => {
                  handleUpdatePlace(updatedPlace);
                }}
                onAddPlace={(newPlace) => {
                  setPlaces((prev) => [newPlace, ...prev.filter((p) => p.id !== newPlace.id)]);
                  // Mirror to BunnyDB
                  fetch(`/api/nosql/places/${newPlace.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: newPlace, merge: true })
                  }).catch(() => {});

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
                            avatar: "/api/avatar?name=Yoouz+Admin&background=27272a&color=fff&bold=true",
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
                onOpenSettings={() => setIsNotificationSettingsOpen(true)}
                onOpenCreator={handleOpenCreatorDrawer}
                onSuccessAuth={(user) => setCurrentUser(user)}
                onSelectNotificationVideo={(vidId) => vidId && handleSelectVideoById(vidId)}
                onNavigateToMessages={(targetKey) => {
                  setActiveSection("messages");
                  if (targetKey) {
                    const normTarget = String(targetKey).toLowerCase().trim();
                    const match = messages.find(
                      (m) =>
                        m.id === targetKey ||
                        (m.senderId && m.senderId.toLowerCase().trim() === normTarget) ||
                        (m.senderEmail && m.senderEmail.toLowerCase().trim() === normTarget) ||
                        (m.senderName && m.senderName.toLowerCase().trim() === normTarget) ||
                        (m.recipientEmail && m.recipientEmail.toLowerCase().trim() === normTarget) ||
                        (m.recipientName && m.recipientName.toLowerCase().trim() === normTarget) ||
                        (normTarget.includes("ben") && ((m.senderName || "").toLowerCase().includes("ben") || (m.senderEmail || "").toLowerCase().includes("aouisesmee"))) ||
                        (normTarget.includes("steven") && ((m.senderName || "").toLowerCase().includes("steven") || (m.senderEmail || "").toLowerCase().includes("avr6566gd")))
                    );
                    if (match) {
                      setActiveThreadId(match.id);
                    }
                  }
                }}
                onNavigateHome={handleGoHome}
                onUpdateNotifications={setNotifications}
                onMarkRead={(id) => {
                  markNotificationAsRead(id, currentUser);
                  if (effectiveMessagingUser) markNotificationAsRead(id, effectiveMessagingUser as any);
                  setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
                }}
                onMarkAllRead={() => {
                  const ids = notifications.map(n => n.id);
                  markAllNotificationsAsRead(ids, currentUser);
                  if (effectiveMessagingUser) markAllNotificationsAsRead(ids, effectiveMessagingUser as any);
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
                }}
                onDeleteNotification={(id) => deleteNotification(id, currentUser)}
                onClearAll={() => {
                  clearAllNotifications(notifications.map(n => n.id), currentUser);
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
                onOpenCreator={handleOpenCreatorDrawer}
                onDeleteThread={(threadId, targetPartnerKey) => {
                  const pKey = typeof targetPartnerKey === "string" ? targetPartnerKey : (targetPartnerKey ? getThreadPartnerKey(targetPartnerKey) : "");
                  const sName = (targetPartnerKey && typeof targetPartnerKey === "object" ? ((targetPartnerKey as any).senderName || "").toLowerCase().trim() : "");
                  const sId = (targetPartnerKey && typeof targetPartnerKey === "object" ? ((targetPartnerKey as any).senderId || "").toLowerCase().trim() : "");
                  deleteChatThreadFromBunnyDB(threadId, currentUser, targetPartnerKey);
                  setMessages((prev) => prev.filter((m) => {
                    if (!m) return false;
                    if (threadId && m.id === threadId) return false;
                    if (pKey && getThreadPartnerKey(m) === pKey) return false;
                    const mName = (m.senderName || "").toLowerCase().trim();
                    const mId = (m.senderId || "").toLowerCase().trim();
                    if (sName && mName === sName) return false;
                    if (sId && mId === sId) return false;
                    return true;
                  }));
                }}
                onSendMessage={async (threadId, text, recipient, videoUrl, customVideoId, customMessageId, customCreatedAt) => {
                  if (currentUser) {
                    await sendChatMessageToBunnyDB(
                      threadId,
                      text,
                      currentUser,
                      recipient,
                      videoUrl,
                      customVideoId,
                      customMessageId,
                      customCreatedAt
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
                savedPlaces={savedPlaces}
                savedCreators={savedCreatorsList}
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
                onSelectPlace={handleOpenPlaceDrawer}
                onSelectCreator={handleOpenCreatorDrawer}
                onRemovePlace={handleToggleGrabPlace}
                onRemoveCreator={handleToggleSaveCreator}
              />
            )}

            {/* Following Directory View */}
            {activeSection === "following" && (
              <CopoFollowingView
                places={places}
                videos={videos}
                currentUser={currentUser}
                allUsers={allRegisteredUsers}
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
                onOpenCreator={handleOpenCreatorDrawer}
                onToggleFollow={handleToggleFollow}
                onToggleFollowPlace={handleToggleFollowPlace}
              />
            )}

            {/* Profile View (Unauthenticated Only) */}
            {activeSection === "profile" && !currentUser && (
              <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-900 flex flex-col justify-between pb-32 md:pb-6" >
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
                    setBusinessClaimTargetPlace(null);
                    setBusinessInitialMode('signin');
                  }
                  setActiveSection(sec);
                }}
                places={places}
                videos={videos}
                currentUser={currentUser}
                allUsers={allRegisteredUsers}
                messages={messages}
                notifications={notifications}
                onOpenPlaceDrawer={handleOpenPlaceDrawer}
                onOpenCreator={(author) => {
                  handleOpenCreatorDrawer(author);
                  previousSectionRef.current = "business";
                }}
                initialPlace={businessClaimTargetPlace}
                initialMode={businessInitialMode}
                onClearInitialPlace={() => {
                  setBusinessClaimTargetPlace(null);
                  setBusinessInitialMode('signin');
                }}
                onSaveOwnerResponse={handleSaveOwnerResponse}
                onDeleteOwnerResponse={handleDeleteOwnerResponse}
                onAddComment={handleAddComment}
                onToggleCommentLike={handleToggleCommentLike}
                onToggleCreatorHeart={handleToggleCreatorHeart}
                onDeleteComment={handleDeleteComment}
                onUpdatePlace={handleUpdatePlace}
                onRecordReview={(targetPlace) => handleOpenCreateReview(targetPlace)}
                onSendMessage={async (threadId, text, recipient, videoUrl, customVideoId, customMessageId, customCreatedAt) => {
                  let effectiveSender = currentUser as any;
                  try {
                    const saved = localStorage.getItem('copo_business_verified_session');
                    if (saved) {
                      const session = JSON.parse(saved);
                      if (session && session.placeId) {
                        const matchingPlace = places.find(p => p.id === session.placeId);
                        effectiveSender = {
                          id: session.placeId,
                          uid: session.placeId,
                          name: session.placeName || matchingPlace?.name || 'Business Manager',
                          email: session.businessEmail || 'business@yoouz.com',
                          avatar: matchingPlace?.logoUrl || session.logoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                          handle: (session.domain || session.placeName || 'business').toLowerCase().replace(/[^a-z0-9]/g, ''),
                          isVerified: true
                        };
                      }
                    }
                  } catch(e) {}
                  
                  if (!effectiveSender) {
                    effectiveSender = {
                      id: 'business_owner',
                      uid: 'business_owner',
                      name: 'Business Manager',
                      email: 'business@yoouz.com',
                      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                      handle: 'business',
                      isVerified: true
                    };
                  }
                  
                  await sendChatMessageToBunnyDB(
                    threadId,
                    text,
                    effectiveSender,
                    recipient,
                    videoUrl,
                    customVideoId,
                    customMessageId,
                    customCreatedAt
                  );
                }}
                onDeleteThread={(threadId, targetPartnerKey) => {
                  const pKey = typeof targetPartnerKey === "string" ? targetPartnerKey : (targetPartnerKey ? getThreadPartnerKey(targetPartnerKey) : "");
                  const sName = (targetPartnerKey && typeof targetPartnerKey === "object" ? ((targetPartnerKey as any).senderName || "").toLowerCase().trim() : "");
                  const sId = (targetPartnerKey && typeof targetPartnerKey === "object" ? ((targetPartnerKey as any).senderId || "").toLowerCase().trim() : "");
                  deleteChatThreadFromBunnyDB(threadId, effectiveMessagingUser as any, targetPartnerKey);
                  setMessages((prev) => prev.filter((m) => {
                    if (!m) return false;
                    if (threadId && m.id === threadId) return false;
                    if (pKey && getThreadPartnerKey(m) === pKey) return false;
                    const mName = (m.senderName || "").toLowerCase().trim();
                    const mId = (m.senderId || "").toLowerCase().trim();
                    if (sName && mName === sName) return false;
                    if (sId && mId === sId) return false;
                    return true;
                  }));
                }}
                onMarkThreadRead={(threadId) => {
                  if (effectiveMessagingUser) {
                    markChatThreadAsRead(threadId, effectiveMessagingUser as any);
                  }
                }}
                onUpdateMessages={async (updated) => {
                  setMessages(updated);
                }}
                onSelectVideo={handleSelectVideoById}
                onToggleFollow={handleToggleFollow}
                onToggleFollowPlace={handleToggleFollowPlace}
                onMarkNotificationRead={(id) => {
                  if (effectiveMessagingUser) {
                    markNotificationAsRead(id, effectiveMessagingUser as any);
                  }
                  if (currentUser) {
                    markNotificationAsRead(id, currentUser);
                  }
                  setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
                }}
                onDeleteNotification={(id) => {
                  if (effectiveMessagingUser) {
                    deleteNotification(id, effectiveMessagingUser as any);
                  }
                  if (currentUser) {
                    deleteNotification(id, currentUser);
                  }
                  setNotifications(prev => prev.filter(n => n.id !== id));
                }}
                onUpdateNotifications={(updated) => {
                  setNotifications(updated);
                }}
                onClearAllNotifications={() => {
                  if (effectiveMessagingUser) {
                    clearAllNotifications(notifications.map(n => n.id), effectiveMessagingUser as any);
                  }
                  if (currentUser) {
                    clearAllNotifications(notifications.map(n => n.id), currentUser);
                  }
                  setNotifications([]);
                }}
                onSaveNotificationSettings={handleSaveNotificationSettings}
                onOpenLegal={handleOpenLegal}
              />
            )}
            {activeSection === "more" && (
              <CopoMoreView
                currentUser={currentUser}
                onOpenLegal={handleOpenLegal}
                onOpenComparison={(comp) => {
                  if (comp) setComparisonCompetitor(comp);
                  setIsComparisonModalOpen(true);
                }}
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
                onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
                onNavigate={(section) => {
                  if (section === "home") {
                    setSelectedPlaceIdForDrawer(null);
                    setSelectedAuthorForDrawer(null);
                    setCurrentVideoIndex(0);
                    setActiveSubTab("discover");
                    setActiveSection("home");
                  } else if (section === "discover") {
                    if (window.innerWidth < 768) {
                      setIsDiscoverModalOpen(true);
                    } else {
                      setSelectedPlaceIdForDrawer(null);
                      setSelectedAuthorForDrawer(null);
                      setActiveSection("discover");
                    }
                  } else if (section === "profile") {
                    handleGoToProfile();
                  } else {
                    setActiveSection(section);
                  }
                }}
                onDeactivateProfile={handleDeactivateProfile}
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
        placeName={activeCommentPlaceName}
        placeLogoUrl={activeCommentPlaceLogo}
        onSelectAuthor={(handle, name, avatar) => {
          setActiveCommentVideo(null); // Close the drawer first
          
          // Then open the creator profile
          handleOpenCreatorDrawer({
            name: name || handle,
            //handle: handle,
            avatar: getSafeAvatarUrl(avatar, name || handle, handle || name),
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
        onShareIncrement={handleShareIncrement}
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
            setIsDiscoverModalOpen(true);
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
          } else if ((activeSection as string) === "business" && (section as string) !== "business") {
            setBusinessClaimTargetPlace(null);
            setBusinessInitialMode('signin');
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
        unreadMessagesCount={calculateUnreadMessagesCount(messages, currentUser)}
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
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
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

            // Mirror to BunnyDB database immediately
            fetch(`/api/nosql/places/${cleanPlace.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: cleanPlace, merge: true })
            }).catch(() => {});

            // Persist to BunnyDB immediately so it's "already saved" as per user request


            setPlaces((prev) => {
              const map = new Map<string, Place>();
              map.set(cleanPlace.id, cleanPlace);
              prev.forEach((p) => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              return Array.from(map.values());
            });
          }}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}

      {/* Mobile Discover Overlay */}
      {isDiscoverModalOpen && (
        <CopoMobileDiscoverView
          videos={videos}
          allUsers={allRegisteredUsers}
          currentUser={currentUser}
          onOpenCreator={(author) => {
            setIsDiscoverModalOpen(false);
            handleOpenCreatorDrawer(author);
          }}
          onToggleFollow={handleToggleFollow}
          onStartChat={(id, name, avatar) => {
            setIsDiscoverModalOpen(false);
            handleStartChat(id, name, avatar);
          }}
          onSelectVideo={(id, source) => {
            setIsDiscoverModalOpen(false);
            handleSelectVideoById(id, (source as "profile" | "creator" | "place" | "general") || "general");
          }}
          onOpenAuth={() => {
            setIsDiscoverModalOpen(false);
            setAuthIntent('general');
            setIsAuthModalOpen(true);
          }}
          onNavigateHome={() => setIsDiscoverModalOpen(false)}
          onClose={() => setIsDiscoverModalOpen(false)}
        />
      )}

      {/* Google Sign-In Modal */}
      <CopoGoogleAuthModal
        isOpen={isAuthModalOpen}
        intent={authIntent}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenHelp={() => {
          setIsAuthModalOpen(false);
          setActiveSection('more');
        }}
        onOpenLegal={(tab) => {
          handleOpenLegal(tab);
        }}
        onSuccess={(user) => {
          const anyUser = user as any;
          const userIds = [anyUser.id || anyUser.uid, anyUser.email, anyUser.name, anyUser.handle].filter(Boolean);
          unrecordDeactivatedUsersInLocalStorage(userIds);
          fetch('/api/user/reactivate-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: anyUser.id || anyUser.uid, email: anyUser.email, name: anyUser.name, handle: anyUser.handle })
          }).catch(() => {});
          window.dispatchEvent(new CustomEvent("copo-user-reactivated", {
            detail: { userIds }
          }));
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          if (authIntent === 'record') {
            setIsCreateModalOpen(true);
          }
          setAuthIntent('general');
        }}
      />

      {/* Terms & Conditions / Privacy Policy Legal Modal */}
      <CopoLegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* User Notification Preferences Modal */}
      <CopoNotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        settings={currentUser?.notificationSettings}
        onSave={handleSaveNotificationSettings}
      />

      {/* Competitor Comparison (GEO & Conversion) Modal */}
      <CopoComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        initialCompetitor={comparisonCompetitor}
        onStartReview={() => {
          if (!currentUser || !isProfileComplete(currentUser)) {
            setAuthIntent('record');
            setIsAuthModalOpen(true);
          } else {
            setIsCreateModalOpen(true);
          }
        }}
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
        onStartBackgroundUpload={(placeName, progress) => {
          setBackgroundUpload({ isPublishing: true, progress, placeName });
        }}
        onUpdateBackgroundUpload={(progress) => {
          setBackgroundUpload((prev) => prev ? { ...prev, progress } : null);
        }}
        onCompleteBackgroundUpload={() => {
          setBackgroundUpload(null);
        }}
      />

      {/* Background Upload Bottom Progress Bar with Clear Guidance */}
      {backgroundUpload?.isPublishing && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-50 bg-zinc-950/95 backdrop-blur-xl text-white rounded-2xl p-4 border border-zinc-800 shadow-2xl animate-in slide-in-from-bottom-3 duration-300 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  Publishing review for {backgroundUpload.placeName}...
                </p>
                <p className="text-[11px] text-amber-400/90 font-medium">
                  Publishing... Keep Yoouz open until 100% complete.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-300 shrink-0">
              {Math.round(backgroundUpload.progress)}%
            </span>
          </div>

          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${backgroundUpload.progress}%` }}
            />
          </div>
        </div>
      )}

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
            <p className="text-[10px] text-zinc-200 font-semibold">Your profile data has been cleared permanently.</p>
          </div>
        </div>
      )}

      {deactivateSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white rounded-2xl px-5 py-4 border border-zinc-800 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black">Account Deactivated</p>
            <p className="text-[10px] text-zinc-300 font-semibold">Your profile and reviews are now hidden. Sign in anytime to reactivate!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

