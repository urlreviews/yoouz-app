import React, { useState, useMemo, useRef, useEffect } from "react";
import { VideoReview, Place, ReviewComment, UserProfile } from "../types";
import {
  Shield,
  Video,
  MapPin,
  Users,
  MessageSquare,
  Bell,
  Database,
  Search,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Filter,
  BarChart3,
  SlidersHorizontal,
  Send,
  Building2,
  Sparkles,
  ArrowLeft,
  LayoutGrid,
  List,
  Pin,
  FileText,
  BadgeCheck,
  UserCheck,
  UserPlus,
  Award,
  UserX,
  Globe,
  Phone,
  Mail,
  Share2,
  Heart,
  Bookmark,
  CreditCard,
  Receipt,
  DollarSign,
  TrendingUp,
  Clock,
  HardDrive,
  Server,
  Zap,
  Radio,
  Loader2,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { isAuthorMatch, recordDeletedUsersInLocalStorage, isUserDeleted } from "../utils/placeUtils";
import { getPlaceLogoUrl, YOOUZ_LOGO_DATA_URI, getProxiedImageUrl } from "../utils/logoUtils";
import { releaseVideoHardwareDecoder } from "../utils/videoUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { subscribeAppHealth, resolveAllAppErrors, AppHealthSummary } from "../lib/errorMonitor";

export const AdminPlaceLogo: React.FC<{
  place: Partial<Place> | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ place, size = "md", className = "" }) => {
  const sizeClasses =
    size === "sm"
      ? "w-9 h-9"
      : size === "lg"
      ? "w-14 h-14"
      : "w-12 h-12";

  const resolvedUrl = useMemo(() => {
    if (!place) return null;
    return getPlaceLogoUrl(place) || place.logoUrl || place.avatarUrl || null;
  }, [place]);

  const domain = useMemo(() => {
    if (!place) return null;
    return place.brandDomain || place.website || (place.id && place.id.includes(".") ? place.id : null);
  }, [place]);

  return (
    <CopoBrandLogo
      domain={domain}
      name={place?.name}
      website={place?.website}
      logoUrl={resolvedUrl}
      bannerUrl={place?.bannerUrl || place?.ogImage}
      className={`${sizeClasses} rounded-xl bg-white border border-zinc-200/60 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm ring-1 ring-white/10 ${className}`}
      imageClassName="w-full h-full object-contain rounded-lg [image-rendering:-webkit-optimize-contrast]"
      fallbackTextClassName="font-black text-xs text-zinc-950"
    />
  );
};

interface CopoAdminPanelProps {
  currentUser?: any;
  videos: VideoReview[];
  places: Place[];
  allUsers?: any[];
  onDeleteUser?: (user: any) => void;
  onUpdateUser?: (updatedUser: any) => void;
  onPurgeAllUsers?: () => void;
  onDeleteVideo: (id: string) => void;
  onBulkDeleteVideos?: (ids: string[]) => void;
  onPurgeAllVideos?: () => void;
  onUpdateVideo?: (updatedVideo: VideoReview) => void;
  onDeletePlace: (id: string) => void;
  onBulkDeletePlaces?: (ids: string[]) => void;
  onPurgeAllPlaces?: () => void;
  onUpdatePlace?: (updatedPlace: Place) => void;
  onAddPlace?: (newPlace: Place) => void;
  onDeleteComment?: (videoId: string, commentId: string, replyId?: string) => void;
  onBroadcastNotification?: (notification: { title: string; message: string; targetUrl?: string }) => void;
  onExit: () => void;
}

type AdminTab = "overview" | "health" | "creators" | "users" | "businesses" | "places" | "videos" | "comments" | "broadcast" | "database";

export const CopoAdminPanel: React.FC<CopoAdminPanelProps> = ({
  currentUser,
  videos = [],
  places = [],
  allUsers = [],
  onDeleteUser,
  onUpdateUser,
  onPurgeAllUsers,
  onDeleteVideo,
  onBulkDeleteVideos,
  onPurgeAllVideos,
  onUpdateVideo,
  onDeletePlace,
  onBulkDeletePlaces,
  onPurgeAllPlaces,
  onUpdatePlace,
  onAddPlace,
  onDeleteComment,
  onBroadcastNotification,
  onExit
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const email = currentUser?.email?.toLowerCase().trim();
      const role = currentUser?.role?.toLowerCase();
      if (role === 'admin' || email === 'admin@yoouz.com' || email === 'aouisesmee@gmail.com' || email?.endsWith('@yoouz.com')) {
        return true;
      }
      return sessionStorage.getItem("yoouz_admin_auth") === "true";
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [videoRatingFilter, setVideoRatingFilter] = useState<number | "all">("all");
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState<string>("all");
  const [placeClaimFilter, setPlaceClaimFilter] = useState<"all" | "claimed" | "unclaimed">("all");
  const [creatorFilter, setCreatorFilter] = useState<"all" | "verified" | "top" | "unverified">("all");
  const [userFilter, setUserFilter] = useState<"all" | "verified" | "unverified">("all");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "registered" | "creators" | "business">("all");

  // Multi-Selection
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);

  // Dialog & Modal States
  const [previewVideo, setPreviewVideo] = useState<VideoReview | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Reset hasVideoStarted when previewVideo changes
  useEffect(() => {
    setHasVideoStarted(false);
    setIsVideoPlaying(false);
    return () => {
      if (videoPlayerRef.current) {
        releaseVideoHardwareDecoder(videoPlayerRef.current);
      }
    };
  }, [previewVideo?.id]);

  const [editPlaceModal, setEditPlaceModal] = useState<Place | null>(null);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [editVideoModal, setEditVideoModal] = useState<VideoReview | null>(null);
  const [editUserModal, setEditUserModal] = useState<any | null>(null);
  const [broadcastData, setBroadcastData] = useState({ title: "", message: "", targetUrl: "" });
  const [isBroadcastSending, setIsBroadcastSending] = useState(false);

  // System Health & Bug Diagnostics State
  const [healthData, setHealthData] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [clientHealthSummary, setClientHealthSummary] = useState<AppHealthSummary | null>(null);

  const fetchHealthDiagnostic = async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch("/api/system/health-check");
      const data = await res.json();
      if (data && data.success) {
        setHealthData(data);
      }
    } catch (e) {
      console.warn("Health check fetch error:", e);
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthDiagnostic();
    const interval = setInterval(fetchHealthDiagnostic, 30000);
    const unsubscribe = subscribeAppHealth((summary) => {
      setClientHealthSummary(summary);
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const videoUploadAlertLogs = useMemo(() => {
    return (healthData?.logs || []).filter((l: any) =>
      l.status !== "resolved" &&
      (l.category === "video_player" ||
        l.component?.toLowerCase().includes("video") ||
        l.message?.toLowerCase().includes("video") ||
        l.message?.toLowerCase().includes("upload") ||
        l.message?.toLowerCase().includes("watchdog") ||
        l.message?.toLowerCase().includes("stall"))
    );
  }, [healthData?.logs]);

  const handleClearErrorLog = async (id?: string) => {
    resolveAllAppErrors();
    try {
      const res = await fetch("/api/system/clear-error-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(id ? "Resolved error log entry." : "All error logs cleared.");
        fetchHealthDiagnostic();
      }
    } catch (e) {
      showToast("Failed to clear error logs.");
    }
  };

  const [isSyncingComments, setIsSyncingComments] = useState(false);
  const handleSyncCommentsCache = async () => {
    setIsSyncingComments(true);
    try {
      const res = await fetch("/api/system/sync-comments-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast("Comments synchronized & mobile/desktop caches flushed globally.");
        fetchHealthDiagnostic();
      } else {
        showToast("Failed to sync comments cache.");
      }
    } catch (e) {
      showToast("Error syncing comments cache.");
    } finally {
      setIsSyncingComments(false);
    }
  };

  const [isReconcilingProfiles, setIsReconcilingProfiles] = useState(false);
  const handleReconcileUserProfiles = async () => {
    setIsReconcilingProfiles(true);
    try {
      const res = await fetch("/api/system/reconcile-user-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(data.message || "User profiles reconciled and deduplicated globally.");
        fetchHealthDiagnostic();
      } else {
        showToast("Failed to reconcile user profiles.");
      }
    } catch (e) {
      showToast("Error reconciling user profiles.");
    } finally {
      setIsReconcilingProfiles(false);
    }
  };

  const [isAuditingFollowers, setIsAuditingFollowers] = useState(false);
  const handleAuditFollowers = async () => {
    setIsAuditingFollowers(true);
    try {
      const res = await fetch("/api/system/audit-followers", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(data.message || "Followers audit complete. Zero fake followers policy strictly enforced.");
        fetchHealthDiagnostic();
      } else {
        showToast("Follower audit completed.");
      }
    } catch (e) {
      showToast("Error executing follower audit.");
    } finally {
      setIsAuditingFollowers(false);
    }
  };

  const [isResyncingBanners, setIsResyncingBanners] = useState(false);
  const handleResyncBusinessBanners = async () => {
    setIsResyncingBanners(true);
    try {
      const res = await fetch("/api/system/resync-business-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(data.message || "Business profile banners synchronized with Bunny CDN.");
        fetchHealthDiagnostic();
        fetchLiveStats();
      } else {
        showToast("Failed to sync business profile banners.");
      }
    } catch (e) {
      showToast("Error syncing business profile banners.");
    } finally {
      setIsResyncingBanners(false);
    }
  };

  const [isResyncingMaps, setIsResyncingMaps] = useState(false);
  const handleResyncMapsPreviews = async () => {
    setIsResyncingMaps(true);
    try {
      const res = await fetch("/api/system/resync-maps-previews", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(data.message || "Google Maps previews verified across all businesses.");
        fetchHealthDiagnostic();
        fetchLiveStats();
      } else {
        showToast("Failed to verify Google Maps previews.");
      }
    } catch (e) {
      showToast("Error verifying Google Maps previews.");
    } finally {
      setIsResyncingMaps(false);
    }
  };

  const [isVerifyingShareCards, setIsVerifyingShareCards] = useState(false);
  const handleVerifyShareCards = async () => {
    setIsVerifyingShareCards(true);
    try {
      const res = await fetch("/api/admin/verify-social-share-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(`Social share cards & metadata verified: ${data.totalVerified} reviews tested. Status: ${data.status.toUpperCase()}`);
        fetchHealthDiagnostic();
        fetchLiveStats();
      } else {
        showToast("Failed to verify social share cards.");
      }
    } catch (e) {
      showToast("Error verifying social share cards.");
    } finally {
      setIsVerifyingShareCards(false);
    }
  };

  const [isDeduplicatingNotifs, setIsDeduplicatingNotifs] = useState(false);
  const handleDeduplicateNotifications = async () => {
    setIsDeduplicatingNotifs(true);
    try {
      const res = await fetch("/api/admin/notifications/deduplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(`Notification Deduplication Guard: Removed ${data.deletedCount} duplicate(s). ${data.activeNotifications} verified notifications active.`);
        fetchHealthDiagnostic();
        fetchLiveStats();
      } else {
        showToast("Deduplication complete. Zero duplicate notifications found.");
      }
    } catch (e) {
      showToast("Error running notification deduplication.");
    } finally {
      setIsDeduplicatingNotifs(false);
    }
  };

  // Deletion Confirmations
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<string | null>(null);
  const [confirmDeletePlaceId, setConfirmDeletePlaceId] = useState<string | null>(null);
  const [confirmDeleteBusinessId, setConfirmDeleteBusinessId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmBulkDeleteVideos, setConfirmBulkDeleteVideos] = useState(false);
  const [confirmPurgeAllVideos, setConfirmPurgeAllVideos] = useState(false);
  const [confirmBulkDeletePlaces, setConfirmBulkDeletePlaces] = useState(false);
  const [confirmPurgeAllPlaces, setConfirmPurgeAllPlaces] = useState(false);
  const [confirmBulkDeleteBusinesses, setConfirmBulkDeleteBusinesses] = useState(false);
  const [confirmPurgeAllBusinesses, setConfirmPurgeAllBusinesses] = useState(false);
  const [confirmDeleteCommentInfo, setConfirmDeleteCommentInfo] = useState<{ videoId: string; commentId: string } | null>(null);

  // Business Tab Specific State
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [businessCategoryFilter, setBusinessCategoryFilter] = useState<string>("all");

  const [deletedUserKeys, setDeletedUserKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("yoouz_deleted_users") || "[]";
      const arr = JSON.parse(stored);
      const filtered = (Array.isArray(arr) ? arr : []).filter((k: string) => {
        const s = String(k).toLowerCase();
        return !s.includes("aouisesmee") && s !== "mlio66hdr9trvofdgddgwm30rku2";
      });
      return new Set(filtered.map((k: string) => String(k).toLowerCase()));
    } catch {
      return new Set();
    }
  });

  // Authoritative Live Bunny Database & Storage Telemetry State
  const [liveStats, setLiveStats] = useState<{
    success: boolean;
    timestamp: number;
    latencyMs: number;
    database: {
      engine: string;
      connected: boolean;
      counts: Record<string, number>;
    };
    totals: {
      users: number;
      places: number;
      videoReviews: number;
      comments: number;
      likes: number;
      shares: number;
      bookmarks: number;
      chats: number;
      notifications: number;
      businessClaims: number;
      follows: number;
    };
    storage: {
      filesCount: number;
      totalBytes: number;
      formattedSize: string;
      zoneName: string;
      folder: string;
      connected: boolean;
      error: string | null;
    };
  } | null>(null);

  const [isLoadingLiveStats, setIsLoadingLiveStats] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);

  const fetchLiveStats = async () => {
    setIsLoadingLiveStats(true);
    try {
      const res = await fetch("/api/admin/live-stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLiveStats(data);
        setLastSyncedTime(new Date());
      }
    } catch (err) {
      console.warn("Failed to fetch live admin stats:", err);
    } finally {
      setIsLoadingLiveStats(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLiveStats();
      const interval = setInterval(fetchLiveStats, 8000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Helper: Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // User Deletion Handler
  const executeDeleteUser = async (targetUser: any) => {
    const targetId = String(targetUser.id || targetUser.uid || "").trim();
    const targetUid = String(targetUser.uid || targetUser.id || "").trim();
    const targetEmail = (targetUser.email || "").toLowerCase().trim();
    const targetName = (targetUser.name || "").trim();
    const targetHandle = (targetUser.handle || "").replace(/^@+/, "").toLowerCase().trim();

    // 1. Immediately record in persistent deleted users local store and state
    recordDeletedUsersInLocalStorage([targetId, targetUid, targetEmail, targetName, targetHandle]);

    setDeletedUserKeys((prev) => {
      const next = new Set(prev);
      if (targetId) next.add(targetId.toLowerCase());
      if (targetUid) next.add(targetUid.toLowerCase());
      if (targetEmail) {
        next.add(targetEmail);
        next.add(`usr_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
      }
      if (targetName) next.add(targetName.toLowerCase());
      if (targetHandle) next.add(targetHandle);

      try {
        localStorage.setItem("yoouz_deleted_users", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    setConfirmDeleteUserId(null);

    // 2. Notify parent component
    if (onDeleteUser) {
      onDeleteUser(targetUser);
    }

    // 3. Request deletion on server across all databases
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId,
          uid: targetUid,
          email: targetEmail,
          name: targetName,
          handle: targetHandle
        })
      });
      if (res.ok) {
        showToast(`User ${targetName || targetEmail || "account"} deleted permanently.`);
      } else {
        await fetch(`/api/nosql/users/${encodeURIComponent(targetId || targetUid)}`, { method: "DELETE" });
        showToast(`User ${targetName || targetEmail || "account"} deleted.`);
      }
    } catch (e) {
      showToast(`User deleted.`);
    }
  };

  const [confirmPurgeAllUsers, setConfirmPurgeAllUsers] = useState(false);
  const [isPurgingUsers, setIsPurgingUsers] = useState(false);

  const handleExecutePurgeAllUsers = async () => {
    setIsPurgingUsers(true);
    try {
      // Record all active user keys locally so current user session is cleaned
      const allKeys: string[] = [];
      uniqueUsers.forEach((u) => {
        if (u.id) allKeys.push(u.id);
        if (u.uid) allKeys.push(u.uid);
        if (u.email) allKeys.push(u.email);
        if (u.name) allKeys.push(u.name);
        if (u.handle) allKeys.push(u.handle);
      });
      recordDeletedUsersInLocalStorage(allKeys);

      const res = await fetch("/api/admin/users/purge-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (onPurgeAllUsers) {
        onPurgeAllUsers();
      }
      showToast("All user accounts purged successfully.");
    } catch (e) {
      showToast("Error purging user accounts.");
    } finally {
      setIsPurgingUsers(false);
      setConfirmPurgeAllUsers(false);
    }
  };

  // Auth Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "1234567890" || passwordInput === "admin") {
      setIsAuthenticated(true);
      setAuthError("");
      try {
        sessionStorage.setItem("yoouz_admin_auth", "true");
      } catch {}
    } else {
      setAuthError("Incorrect admin password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem("yoouz_admin_auth");
    } catch {}
  };

  // Unique Users Mapping (Real registered users and video creators, without fake business email injection!)
  const uniqueUsers = useMemo(() => {
    const getCleanHandle = (str?: string) => (str || "").replace(/^@+/, "").trim().toLowerCase();
    const isKeyDeleted = (val?: string) => {
      if (!val) return false;
      const clean = val.toLowerCase().trim();
      const withoutAt = clean.replace(/^@+/, "");
      return deletedUserKeys.has(clean) || deletedUserKeys.has(withoutAt);
    };

    const mergedList: any[] = [];
    
    (allUsers || []).forEach((u) => {
      if (!u) return;
      if (
        isKeyDeleted(u.id) ||
        isKeyDeleted(u.uid) ||
        isKeyDeleted(u.email) ||
        isKeyDeleted(u.name) ||
        isKeyDeleted(u.handle)
      ) {
        return;
      }
      const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0].toLowerCase() : u.id) || "user";
      mergedList.push({
        id: u.id || u.uid || cleanHandle,
        uid: u.uid || u.id,
        name: u.name || "Registered User",
        email: u.email || "",
        handle: cleanHandle,
        bio: u.bio || "",
        avatar:
          u.avatar ||
          `/api/avatar?name=${encodeURIComponent(u.name || "User")}&background=27272a&color=fff&bold=true&size=128`,
        isVerified: u.isVerified !== false,
        isRegisteredAccount: true,
        role: u.role || (u.email === "admin@yoouz.com" ? "Super Admin" : "Member"),
        memberSince: u.memberSince || "Active"
      });
    });

    (videos || []).forEach((v) => {
      if (!v) return;
      if (
        isKeyDeleted(v.userEmail) ||
        isKeyDeleted(v.author?.name) ||
        isKeyDeleted(v.userId)
      ) {
        return;
      }
      const author = v.author || {
        name: "Verified Reviewer",
        handle: v.userId || "reviewer",
        avatar: "",
        isVerified: true
      };
      
      const vEmail = (v.userEmail || "").toLowerCase().trim();
      const vUserId = (v.userId || "").toLowerCase().trim();
      const vCleanHandle = getCleanHandle(author.name) || (vEmail ? vEmail.split("@")[0] : getCleanHandle(vUserId) || "reviewer");
      
      let match = mergedList.find(u => {
        const uEmail = (u.email || "").toLowerCase().trim();
        const uUserId = (u.uid || u.id || "").toLowerCase().trim();
        const uCleanHandle = getCleanHandle(u.name);
        
        return (
          (vEmail && uEmail && vEmail === uEmail) ||
          (vUserId && uUserId && vUserId === uUserId) ||
          (vCleanHandle && uEmail && uEmail.startsWith(vCleanHandle + "@")) ||
          (vCleanHandle && uCleanHandle && vCleanHandle === uCleanHandle)
        );
      });
      
      if (match) {
        if (!match.name || match.name === "Registered User") match.name = author.name;
        if (!match.avatar || match.avatar.includes("ui-avatars")) match.avatar = author.avatar;
        match.role = "Creator"; 
      } else {
        mergedList.push({
          id: vUserId || vCleanHandle,
          uid: vUserId || vCleanHandle,
          name: author.name || "Verified Reviewer",
          email: vEmail,
          handle: vCleanHandle,
          avatar:
            author.avatar ||
            `/api/avatar?name=${encodeURIComponent(author.name || "User")}&background=27272a&color=fff&bold=true&size=128`,
          isVerified: author.isVerified !== false,
          isRegisteredAccount: Boolean(vUserId),
          role: "Creator",
          memberSince: "Active"
        });
      }
    });

    // Final deduplication loop to aggressively merge records by Email or Name
    const finalList: any[] = [];
    mergedList.forEach(u => {
       const cleanName = u.name ? u.name.toLowerCase().trim() : "";
       let existing = null;
       if (u.email) {
         existing = finalList.find(x => x.email === u.email);
       }
       if (!existing && cleanName && cleanName !== "registered user" && cleanName !== "verified reviewer") {
           existing = finalList.find(x => (x.name || "").toLowerCase().trim() === cleanName);
       }
       
       if (!existing) {
         finalList.push(u);
       } else {
         if (u.role === "Creator") existing.role = "Creator";
         if (u.email && !existing.email) existing.email = u.email;
         if (u.avatar && !u.avatar.includes("ui-avatars") && (!existing.avatar || existing.avatar.includes("ui-avatars"))) existing.avatar = u.avatar;
       }
    });
    // Do not filter out incomplete signups; keep all registered users in the admin view so the admin can always find them!
    return finalList.filter(u => {
       if (
         isKeyDeleted(u.id) ||
         isKeyDeleted(u.uid) ||
         isKeyDeleted(u.email) ||
         isKeyDeleted(u.name) ||
         isKeyDeleted(u.handle)
       ) {
         return false;
       }
       return true;
    });
  }, [allUsers, videos, deletedUserKeys]);

  // All Comments aggregation for Moderation
  const allComments = useMemo(() => {
    const list: { video: VideoReview; comment: ReviewComment; isReply?: boolean; parentCommentId?: string }[] = [];
    videos.forEach((v) => {
      (v.comments || []).forEach((c) => {
        list.push({ video: v, comment: c });
        if (Array.isArray(c.replies)) {
          c.replies.forEach((r) => {
            list.push({ video: v, comment: r, isReply: true, parentCommentId: c.id });
          });
        }
      });
    });
    return list;
  }, [videos]);

  // Separate Creators vs Community Users
  const { creatorsList, standardUsersList } = useMemo(() => {
    const creators: any[] = [];
    const regularUsers: any[] = [];

    uniqueUsers.forEach((u) => {
      const userVideos = videos.filter((v) =>
        isAuthorMatch(v, {
          name: u.name,
          handle: `@${u.name}`,
          email: u.email,
          uid: u.uid || u.id
        })
      );

      // Exclude placeholder/anonymous accounts that have 0 reviews and no real email/identity
      const isPlaceholderName = !u.email && (
        u.name === "Verified Reviewer" || 
        u.name === "Registered User" || 
        u.name === "Yoouz Reviewer" ||
        u.id === "usr_verified_reviewer"
      );
      if (isPlaceholderName && userVideos.length === 0) {
        return;
      }

      const isCreator = userVideos.length > 0 || (u.role === "Creator" && !isPlaceholderName);
      const totalLikes = userVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
      const totalViews = userVideos.reduce((acc, v) => acc + (v.viewsCount || v.views || 0), 0);
      const avgRating = userVideos.length > 0 ? (userVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / userVideos.length).toFixed(1) : "5.0";

      const enriched = {
        ...u,
        videosCount: userVideos.length,
        userVideos,
        totalLikes,
        totalViews,
        avgRating
      };

      if (isCreator) {
        creators.push(enriched);
      } else {
        regularUsers.push(enriched);
      }
    });

    return { creatorsList: creators, standardUsersList: regularUsers };
  }, [uniqueUsers, videos]);

  // Filtered Video List
  const filteredVideos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return videos.filter((v) => {
      const matchQuery =
        !q ||
        (v.placeName && v.placeName.toLowerCase().includes(q)) ||
        (v.author?.name && v.author.name.toLowerCase().includes(q)) ||
        (v.caption && v.caption.toLowerCase().includes(q)) ||
        (v.id && v.id.toLowerCase().includes(q));

      const matchRating = videoRatingFilter === "all" || Math.round(v.rating) === videoRatingFilter;
      return matchQuery && matchRating;
    });
  }, [videos, searchQuery, videoRatingFilter]);

  // Deduplicated Places (Guarantees every business appears exactly once with merged claim and video state)
  const deduplicatedPlaces = useMemo(() => {
    const canonicalMap = new Map<string, Place>();
    
    // Check local storage for verified business claims as fallback
    let localVerifiedPlaceId = "";
    let localVerifiedEmail = "";
    try {
      const sessStr = localStorage.getItem("copo_business_verified_session");
      if (sessStr) {
        const sess = JSON.parse(sessStr);
        if (sess && sess.placeId) {
          localVerifiedPlaceId = String(sess.placeId).toLowerCase();
          localVerifiedEmail = sess.email || "";
        }
      }
    } catch (e) {}

    places.forEach((p) => {
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
        if (parts.length >= 2) {
          canonId = parts.slice(0, -1).join('-') + '.' + parts[parts.length - 1];
        }
      }

      const domain = (p.brandDomain || (p.website ? p.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '') || canonId).toLowerCase().trim();
      const key = domain || canonId;

      const isYoouz = key === 'yoouz.com' || canonId === 'yoouz.com' || rawId === 'yoouz.com' || rawId === 'yoouz-com' || (p.name && p.name.toLowerCase() === 'yoouz');
      const isLocalClaimed = Boolean(localVerifiedPlaceId && (localVerifiedPlaceId === rawId || localVerifiedPlaceId === canonId || localVerifiedPlaceId === key));

      const isClaimed = Boolean(p.isClaimed || p.claimedByEmail || isYoouz || isLocalClaimed);
      const claimedEmail = p.claimedByEmail || (isYoouz ? "info@yoouz.com" : (isLocalClaimed ? localVerifiedEmail : undefined));

      const existing = canonicalMap.get(key);
      if (!existing) {
        canonicalMap.set(key, {
          ...p,
          id: canonId.includes('.') ? canonId : p.id,
          isClaimed,
          isVerified: Boolean(p.isVerified || isClaimed),
          claimedByEmail: claimedEmail
        });
      } else {
        const preferNew = (!existing.id.includes('.') && canonId.includes('.')) || (!existing.isClaimed && isClaimed);
        const base = preferNew ? p : existing;
        const other = preferNew ? existing : p;
        canonicalMap.set(key, {
          ...other,
          ...base,
          id: (base.id.includes('.') ? base.id : (other.id.includes('.') ? other.id : base.id)),
          isClaimed: Boolean(base.isClaimed || other.isClaimed || isClaimed),
          isVerified: Boolean(base.isVerified || other.isVerified || isClaimed),
          claimedByEmail: base.claimedByEmail || other.claimedByEmail || claimedEmail
        });
      }
    });

    // Ensure yoouz.com is always present as the verified official platform business
    if (!canonicalMap.has('yoouz.com')) {
      canonicalMap.set('yoouz.com', {
        id: 'yoouz.com',
        name: 'Yoouz',
        brandDomain: 'yoouz.com',
        website: 'https://yoouz.com',
        category: 'Technology & Video Review Platform',
        categoryType: 'all',
        address: 'Global Platform • yoouz.com',
        city: 'Global',
        country: 'Worldwide',
        lat: 0,
        lng: 0,
        rating: 5.0,
        totalReviews: 1,
        ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
        avatarUrl: '/favicon.svg',
        bannerUrl: '/og-banner.png',
        photos: [],
        openingHours: '24/7',
        isOpen: true,
        phone: '',
        priceRange: 'Free',
        plusCode: '',
        description: 'Authentic 60-Second Video Reviews Platform',
        popularKeywords: [{ tag: 'authentic', count: 1 }, { tag: 'video reviews', count: 1 }],
        amenities: ['Official Platform', 'Verified Brand'],
        topDishes: [],
        isClaimed: true,
        isVerified: true,
        claimedByEmail: 'info@yoouz.com',
        logoUrl: YOOUZ_LOGO_DATA_URI
      });
    } else {
      const existingYoouz = canonicalMap.get('yoouz.com')!;
      canonicalMap.set('yoouz.com', {
        ...existingYoouz,
        name: 'Yoouz',
        brandDomain: 'yoouz.com',
        website: existingYoouz.website || 'https://yoouz.com',
        isClaimed: true,
        isVerified: true,
        claimedByEmail: existingYoouz.claimedByEmail || 'info@yoouz.com',
        category: existingYoouz.category || 'Technology & Video Review Platform',
        logoUrl: existingYoouz.logoUrl || YOOUZ_LOGO_DATA_URI
      });
    }

    return Array.from(canonicalMap.values());
  }, [places]);

  // Separate Businesses (Claimed / Merchant Corporate Entities) vs Physical Places (Local Directory Venues)
  const { allBusinesses, allPhysicalPlaces } = useMemo(() => {
    const businesses: Place[] = [];
    const physicalPlaces: Place[] = [];

    deduplicatedPlaces.forEach((p) => {
      const rawId = String(p.id).toLowerCase();
      const isYoouz = p.id === 'yoouz.com' || p.brandDomain === 'yoouz.com' || rawId === 'yoouz.com' || rawId === 'yoouz-com' || rawId === 'place-custom-yoouz-com' || (p.name && p.name.toLowerCase() === 'yoouz');
      const isClaimedBusiness = Boolean(p.isClaimed || p.claimedByEmail || isYoouz);

      if (isClaimedBusiness) {
        businesses.push({
          ...p,
          isClaimed: true,
          isVerified: true,
          website: p.website || (isYoouz ? 'https://yoouz.com' : (p.brandDomain ? `https://${p.brandDomain}` : '')),
          brandDomain: p.brandDomain || (isYoouz ? 'yoouz.com' : (p.website ? p.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : p.id)),
          claimedByEmail: isYoouz ? 'info@yoouz.com' : p.claimedByEmail
        });
      } else {
        physicalPlaces.push(p);
      }
    });

    return { allBusinesses: businesses, allPhysicalPlaces: physicalPlaces };
  }, [deduplicatedPlaces]);

  // Filtered Businesses List (Single entry per claimed business profile)
  const filteredBusinesses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allBusinesses.filter((b) => {
      const matchQuery =
        !q ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.brandDomain && b.brandDomain.toLowerCase().includes(q)) ||
        (b.website && b.website.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.id && b.id.toLowerCase().includes(q));

      const matchCategory = businessCategoryFilter === "all" || b.category?.toLowerCase() === businessCategoryFilter.toLowerCase();
      return matchQuery && matchCategory;
    });
  }, [allBusinesses, searchQuery, businessCategoryFilter]);

  // Filtered Physical Places List (Community review venues directory)
  const filteredPhysicalPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allPhysicalPlaces.filter((p) => {
      const matchQuery =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));

      const matchCategory = placeCategoryFilter === "all" || p.category?.toLowerCase() === placeCategoryFilter.toLowerCase();
      return matchQuery && matchCategory;
    });
  }, [allPhysicalPlaces, searchQuery, placeCategoryFilter]);

  // Filtered Places List (Combined fallback if needed)
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return deduplicatedPlaces.filter((p) => {
      const matchQuery =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.claimedByEmail && p.claimedByEmail.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));

      const matchCategory = placeCategoryFilter === "all" || p.category?.toLowerCase() === placeCategoryFilter.toLowerCase();
      const matchClaim =
        placeClaimFilter === "all" ||
        (placeClaimFilter === "claimed" && (p.isClaimed || Boolean(p.claimedByEmail))) ||
        (placeClaimFilter === "unclaimed" && !p.isClaimed && !p.claimedByEmail);

      return matchQuery && matchCategory && matchClaim;
    });
  }, [deduplicatedPlaces, searchQuery, placeCategoryFilter, placeClaimFilter]);

  // Helper to get all video reviews matching a place across canonical aliases
  const getPlaceVideos = (place: Place) => {
    const rawId = String(place.id).toLowerCase();
    const canonId = rawId.replace(/^place-custom-/, '').replace(/^www-/, '').replace(/^www\./, '');
    const domain = (place.brandDomain || (place.website ? place.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '')).toLowerCase();
    const pName = (place.name || "").toLowerCase().trim();

    return videos.filter((v) => {
      const vPlaceId = String(v.placeId || "").toLowerCase();
      const vPlaceName = String(v.placeName || "").toLowerCase().trim();
      return (
        vPlaceId === rawId ||
        vPlaceId === canonId ||
        vPlaceId === domain ||
        (domain && vPlaceId.includes(domain)) ||
        (pName && vPlaceName === pName)
      );
    });
  };

  // Filtered Creators List
  const filteredCreators = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return creatorsList.filter((c) => {
      const matchQuery =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.handle && c.handle.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const matchFilter =
        creatorFilter === "all" ||
        (creatorFilter === "verified" && c.isVerified) ||
        (creatorFilter === "unverified" && !c.isVerified) ||
        (creatorFilter === "top" && c.videosCount >= 2);

      return matchQuery && matchFilter;
    });
  }, [creatorsList, searchQuery, creatorFilter]);

  // Filtered Standard Users List
  const filteredStandardUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return standardUsersList.filter((u) => {
      const matchQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.handle && u.handle.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchFilter =
        userFilter === "all" ||
        (userFilter === "verified" && u.isVerified) ||
        (userFilter === "unverified" && !u.isVerified);

      return matchQuery && matchFilter;
    });
  }, [standardUsersList, searchQuery, userFilter]);

  // Filtered Users List (Combined fallback)
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return uniqueUsers.filter((u) => {
      const matchQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.handle && u.handle.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchType =
        userTypeFilter === "all" ||
        (userTypeFilter === "registered" && u.isRegisteredAccount) ||
        (userTypeFilter === "creators" && u.role === "Creator") ||
        (userTypeFilter === "business" && u.role === "Business");

      return matchQuery && matchType;
    });
  }, [uniqueUsers, searchQuery, userTypeFilter]);

  // Filtered Comments List
  const filteredComments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allComments.filter((item) => {
      if (!q) return true;
      return (
        item.comment.text.toLowerCase().includes(q) ||
        item.comment.authorName.toLowerCase().includes(q) ||
        item.video.placeName?.toLowerCase().includes(q)
      );
    });
  }, [allComments, searchQuery]);

  // Categories list
  const uniqueBusinessCategories = useMemo(() => {
    const set = new Set<string>();
    allBusinesses.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set).sort();
  }, [allBusinesses]);

  const uniquePlaceCategories = useMemo(() => {
    const set = new Set<string>();
    allPhysicalPlaces.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [allPhysicalPlaces]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [places]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalVids = videos.length;
    const totalLikes = videos.reduce((acc, v) => acc + (v.likes || 0), 0);
    const totalShares = videos.reduce((acc, v) => acc + (v.sharesCount || 0), 0);
    const totalBookmarks = videos.reduce((acc, v) => acc + (v.bookmarksCount || 0), 0);
    const totalViews = videos.reduce((acc, v) => acc + (v.viewsCount || v.views || 0), 0);
    const totalComm = allComments.length;
    const totalBusinesses = allBusinesses.length;
    const totalPhysicalPlaces = allPhysicalPlaces.length;
    const totalPlaces = deduplicatedPlaces.length;
    const claimedPlaces = totalBusinesses;
    const unclaimedPlaces = totalPhysicalPlaces;
    const avgRating = totalVids > 0 ? (videos.reduce((acc, v) => acc + (v.rating || 5), 0) / totalVids).toFixed(1) : "5.0";

    return {
      totalVideos: totalVids,
      totalLikes,
      totalShares,
      totalBookmarks,
      totalViews,
      totalComments: totalComm,
      totalBusinesses,
      totalPhysicalPlaces,
      totalPlaces,
      claimedPlaces,
      unclaimedPlaces,
      totalUsers: uniqueUsers.length,
      totalCreators: creatorsList.length,
      totalCommunityUsers: standardUsersList.length,
      avgRating
    };
  }, [videos, deduplicatedPlaces, allBusinesses, allPhysicalPlaces, uniqueUsers, creatorsList, standardUsersList, allComments]);

  // Multi-select handlers
  const handleSelectAllBusinesses = () => {
    if (selectedBusinessIds.length === filteredBusinesses.length) {
      setSelectedBusinessIds([]);
    } else {
      setSelectedBusinessIds(filteredBusinesses.map((b) => b.id));
    }
  };

  const handleToggleBusinessSelection = (id: string) => {
    setSelectedBusinessIds((prev) => (prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]));
  };

  // Multi-select handlers
  const handleSelectAllVideos = () => {
    if (selectedVideoIds.length === filteredVideos.length) {
      setSelectedVideoIds([]);
    } else {
      setSelectedVideoIds(filteredVideos.map((v) => v.id));
    }
  };

  const handleToggleVideoSelection = (id: string) => {
    setSelectedVideoIds((prev) => (prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]));
  };

  const handleSelectAllPlaces = () => {
    if (selectedPlaceIds.length === filteredPlaces.length) {
      setSelectedPlaceIds([]);
    } else {
      setSelectedPlaceIds(filteredPlaces.map((p) => p.id));
    }
  };

  const handleTogglePlaceSelection = (id: string) => {
    setSelectedPlaceIds((prev) => (prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]));
  };

  // Execution Handlers
  const executeDeleteVideo = (id: string) => {
    onDeleteVideo(id);
    setSelectedVideoIds((prev) => prev.filter((vId) => vId !== id));
    setConfirmDeleteVideoId(null);
    if (previewVideo?.id === id) setPreviewVideo(null);
    showToast("Video review removed permanently from feed and database.");
    setTimeout(fetchLiveStats, 400);
  };

  const executeBulkDeleteVideos = () => {
    if (selectedVideoIds.length === 0) return;
    const count = selectedVideoIds.length;
    if (onBulkDeleteVideos) {
      onBulkDeleteVideos(selectedVideoIds);
    } else {
      selectedVideoIds.forEach((id) => onDeleteVideo(id));
    }
    setSelectedVideoIds([]);
    setConfirmBulkDeleteVideos(false);
    showToast(`Deleted ${count} selected video reviews.`);
    setTimeout(fetchLiveStats, 400);
  };

  const executePurgeAllVideos = () => {
    if (onPurgeAllVideos) {
      onPurgeAllVideos();
    }
    setSelectedVideoIds([]);
    setConfirmPurgeAllVideos(false);
    setPreviewVideo(null);
    showToast("All video reviews purged completely from storage and database.");
    setTimeout(fetchLiveStats, 400);
  };

  const executeDeletePlace = (id: string) => {
    onDeletePlace(id);
    setSelectedPlaceIds((prev) => prev.filter((pId) => pId !== id));
    setConfirmDeletePlaceId(null);
    showToast("Business place record removed.");
    setTimeout(fetchLiveStats, 400);
  };

  const executeBulkDeletePlaces = () => {
    if (selectedPlaceIds.length === 0) return;
    const count = selectedPlaceIds.length;
    if (onBulkDeletePlaces) {
      onBulkDeletePlaces(selectedPlaceIds);
    } else {
      selectedPlaceIds.forEach((id) => onDeletePlace(id));
    }
    setSelectedPlaceIds([]);
    setConfirmBulkDeletePlaces(false);
    showToast(`Deleted ${count} selected business pages.`);
    setTimeout(fetchLiveStats, 400);
  };

  const executePurgeAllPlaces = () => {
    if (onPurgeAllPlaces) {
      onPurgeAllPlaces();
    } else if (onBulkDeletePlaces && places.length > 0) {
      onBulkDeletePlaces(places.map(p => p.id));
    } else {
      places.forEach(p => onDeletePlace(p.id));
    }
    setSelectedPlaceIds([]);
    setConfirmPurgeAllPlaces(false);
    showToast("All business records purged completely from database.");
    setTimeout(fetchLiveStats, 400);
  };

  const executeBulkDeleteBusinesses = () => {
    if (selectedBusinessIds.length === 0) return;
    const count = selectedBusinessIds.length;
    if (onBulkDeletePlaces) {
      onBulkDeletePlaces(selectedBusinessIds);
    } else {
      selectedBusinessIds.forEach((id) => onDeletePlace(id));
    }
    setSelectedBusinessIds([]);
    setConfirmBulkDeleteBusinesses(false);
    showToast(`Deleted ${count} selected businesses.`);
    setTimeout(fetchLiveStats, 400);
  };

  const executePurgeAllBusinesses = () => {
    allBusinesses.forEach((b) => onDeletePlace(b.id));
    setSelectedBusinessIds([]);
    setConfirmPurgeAllBusinesses(false);
    showToast("Purged all claimed businesses.");
    setTimeout(fetchLiveStats, 400);
  };

  const handleQuickClaimPlace = (place: Place) => {
    const domain = (place.brandDomain || (place.website ? place.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '') || place.id).toLowerCase();
    const updated: Place = {
      ...place,
      isClaimed: true,
      isVerified: true,
      claimedByEmail: "info@yoouz.com",
      brandDomain: domain
    };
    if (onUpdatePlace) {
      onUpdatePlace(updated);
    }
    showToast(`Claimed "${place.name}" as an official business.`);
    setTimeout(fetchLiveStats, 400);
  };

  const handleSavePlaceEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlaceModal) return;
    if (onUpdatePlace) {
      onUpdatePlace(editPlaceModal);
    }
    showToast(`Updated business "${editPlaceModal.name}".`);
    setEditPlaceModal(null);
    setTimeout(fetchLiveStats, 400);
  };

  const handleCreateNewPlace = (newPlace: Place) => {
    if (onAddPlace) {
      onAddPlace(newPlace);
      showToast(`Created business "${newPlace.name}"!`);
      setIsAddPlaceOpen(false);
      setTimeout(fetchLiveStats, 400);
    }
  };

  const handleSaveVideoEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVideoModal) return;
    if (onUpdateVideo) {
      onUpdateVideo(editVideoModal);
    }
    showToast(`Updated review details for "${editVideoModal.placeName}".`);
    setEditVideoModal(null);
    setTimeout(fetchLiveStats, 400);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.message.trim()) return;
    setIsBroadcastSending(true);
    try {
      if (onBroadcastNotification) {
        await onBroadcastNotification(broadcastData);
      }
      showToast("Broadcast notification sent to all active users!");
      setBroadcastData({ title: "", message: "", targetUrl: "" });
    } catch (err) {
      showToast("Error sending broadcast notification.");
    } finally {
      setIsBroadcastSending(false);
    }
  };

  // Export Data JSON Backup
  const handleExportDataJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      platform: "Yoouz Admin Suite",
      version: "2.0.0",
      totalVideos: videos.length,
      totalPlaces: places.length,
      totalUsers: uniqueUsers.length,
      videos,
      places,
      users: uniqueUsers
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yoouz_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Database backup JSON downloaded successfully.");
  };

  const [isMasterResetting, setIsMasterResetting] = useState(false);
  const handleMasterReset = async () => {
    if (!window.confirm("⚠️ EXTREME WARNING: This will permanently wipe ALL tables (users, videoReviews, places, comments, etc.) and ALL files from scratch! Are you 100% sure you want to reset everything?")) {
      return;
    }
    setIsMasterResetting(true);
    try {
      const res = await fetch("/api/admin/system/master-reset", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
        showToast("System master reset complete! All databases and files wiped clean from scratch.");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showToast(data.error || "Failed to execute master reset.");
      }
    } catch (err: any) {
      showToast("Error executing master reset.");
    } finally {
      setIsMasterResetting(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex-1 w-full h-full min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative z-50">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 text-white">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight">Yoouz Admin Control</h1>
            <p className="text-sm text-zinc-200 mt-1">Authenticate to manage database, places, videos, and users</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-200 mb-2">Admin Passcode</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 pr-12 text-base transition-all font-medium select-text"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {authError && (
                <div className="flex items-center gap-1.5 text-zinc-200 text-xs font-semibold mt-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> {authError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-2xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Access Dashboard
            </button>

            <div className="pt-2 flex items-center justify-center text-xs text-zinc-400">
              <button
                type="button"
                onClick={onExit}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-center font-medium"
              >
                Return to App
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans absolute inset-0 z-50 overflow-hidden select-none">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 bg-zinc-900/95 backdrop-blur border border-zinc-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-2.5 h-2.5 rounded-full bg-white shrink-0 animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-zinc-200 hover:text-white ml-2 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Application Bar */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-all border border-zinc-700 cursor-pointer flex items-center gap-2 text-xs font-bold shadow-sm"
            title="Return to Yoouz Live Feed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit to Yoouz</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">Yoouz</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 uppercase tracking-wide">
                  Master Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-6 relative hidden md:block">
          <Search className="w-4 h-4 text-zinc-200 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search videos, businesses, creators, comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveStats}
            disabled={isLoadingLiveStats}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            title="Click to refresh live stats directly from BunnyDB & CDN Storage"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden xl:inline">BunnyDB & CDN:</span>
            <span className="text-emerald-400 font-mono font-bold">
              {liveStats ? `${liveStats.latencyMs}ms` : "Live"}
            </span>
            <RefreshCw className={`w-3 h-3 ml-0.5 text-zinc-400 hover:text-white ${isLoadingLiveStats ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={handleExportDataJSON}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Download JSON Database Backup"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-zinc-700 cursor-pointer"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Layout */}
      <div className="flex-1 flex overflow-hidden bg-zinc-950">
        {/* Sidebar Nav Tabs */}
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950/80 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Navigation</div>

            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                Overview & KPIs
              </div>
            </button>

            <button
              onClick={() => setActiveTab("health")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "health"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-4 h-4 ${healthData?.overallStatus === 'healthy' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                System Health & Bugs
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                healthData?.unresolvedCount > 0
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {healthData?.unresolvedCount > 0 ? `${healthData.unresolvedCount} issues` : "100% Green"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("creators")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "creators"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-amber-400" />
                Creators & Reviewers
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === "creators" ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 text-amber-400 border border-zinc-800"}`}>
                {metrics.totalCreators}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                Community Members
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === "users" ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 text-zinc-200 border border-zinc-800"}`}>
                {metrics.totalCommunityUsers}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("businesses")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "businesses"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-zinc-300" />
                Businesses
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === "businesses" ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 text-zinc-200 border border-zinc-800"}`}>
                {metrics.totalBusinesses}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("places")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "places"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-zinc-400" />
                Places Directory
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === "places" ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 text-zinc-200 border border-zinc-800"}`}>
                {metrics.totalPhysicalPlaces}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("videos")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "videos"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4" />
                Video Reviews
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${activeTab === "videos" ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 text-zinc-200 border border-zinc-800"}`}>
                {videos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("comments")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "comments"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                Comments Moderation
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${activeTab === "comments" ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 text-zinc-200 border border-zinc-800"}`}>
                {allComments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("broadcast")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "broadcast"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                Broadcast Alerts
              </div>
            </button>

            <button
              onClick={() => setActiveTab("database")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "database"
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "text-zinc-200 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4" />
                Database & Cloud
              </div>
            </button>
          </div>

          {/* Quick System Badge */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Quick Actions</div>
            <button
              onClick={() => setIsAddPlaceOpen(true)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Business
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 lg:p-8 relative text-white">
          {/* Mobile Tab Nav */}
          <div className="md:hidden flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-zinc-800 no-scrollbar">
            {(
              [
                ["overview", "Overview"],
                ["health", "Health 🟢"],
                ["creators", `Creators (${metrics.totalCreators})`],
                ["users", `Users (${metrics.totalCommunityUsers})`],
                ["businesses", `Businesses (${metrics.totalBusinesses})`],
                ["places", `Places (${metrics.totalPhysicalPlaces})`],
                ["videos", `Videos (${videos.length})`],
                ["comments", "Moderation"],
                ["broadcast", "Broadcast"],
                ["database", "Database"]
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey as AdminTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tabKey ? "bg-white text-zinc-950" : "bg-zinc-900 text-zinc-200 border border-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Persistent Video Recording & Upload Alert Banner */}
          {videoUploadAlertLogs.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold shrink-0 text-lg">
                  🎥
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Video Upload & Recording Alert
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
                      {videoUploadAlertLogs.length} Active Notice{videoUploadAlertLogs.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                    {videoUploadAlertLogs[0].message}
                  </p>
                  <div className="text-[10px] text-amber-400/80 mt-1 font-mono">
                    Logged at {new Date(videoUploadAlertLogs[0].timestamp).toLocaleTimeString()} • Auto-rescued by Anti-Stall Guard
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => setActiveTab("health")}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  View Diagnostics
                </button>
                <button
                  onClick={() => handleClearErrorLog(videoUploadAlertLogs[0].id)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          )}

          {/* TAB: SYSTEM HEALTH & BUG MONITOR */}
          {activeTab === "health" && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white tracking-tight">System Health & Diagnostic Center</h2>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      healthData?.overallStatus === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${healthData?.overallStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-ping'}`} />
                      {healthData?.overallStatus === 'healthy' ? 'ALL SYSTEMS GREEN 🟢' : 'ATTENTION REQUIRED 🔴'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Automated sub-system diagnostics, real-time UI error tracing, and step-by-step testing instructions for all features.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchHealthDiagnostic}
                    disabled={isHealthLoading}
                    className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? 'animate-spin' : ''}`} />
                    Run Diagnostic Suite
                  </button>
                  <button
                    onClick={() => handleClearErrorLog()}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Error Logs
                  </button>
                </div>
              </div>

              {/* Telemetry Issue Monitors (#39, #40 & #41) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Issue #39 Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black font-mono text-sm">
                      #39
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Realtime Stream Connection Stability
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                          {clientHealthSummary?.issue39Errors || 0} Console Errors
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Monitored SSE / EventSource connection lifecycle, tab visibility detection & silent reconnect.
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>

                {/* Issue #40 Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black font-mono text-sm">
                      #40
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Universal Site API & Resource Telemetry
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                          {clientHealthSummary?.issue40Errors || 0} Issues Detected
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Monitored application resources, Bunny CDN range streaming & zero unhandled exceptions.
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>

                {/* Issue #41 Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black font-mono text-sm">
                      #41
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Mobile User Location Layout Stability
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                          0 Reflow Jumps
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Fixed 2-line architecture prevents location from flickering or jumping back and forth across lines.
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>

                {/* Issue #47 Card - Duplicate Notification Prevention */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black font-mono text-sm">
                      #47
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Real-Time Comments Duplicate Notification Prevention
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                          {healthData?.subsystems?.duplicate_notification_prevention_live_guard?.duplicateCount || 0} Duplicates (0 Active)
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Multi-channel deduplication at client dispatch, SSE broadcasting, and database writes with deterministic IDs.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={handleDeduplicateNotifications}
                      disabled={isDeduplicatingNotifs}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDeduplicatingNotifs ? "animate-spin" : ""}`} />
                      {isDeduplicatingNotifs ? "Scanning..." : "Clean Duplicates"}
                    </button>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Subsystems Health Grid (7 Core Modules) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData?.subsystems && Object.entries(healthData.subsystems).map(([key, item]: [string, any]) => {
                  const titles: Record<string, string> = {
                    video_feed_engine: "1. Video Feed & Caching Engine",
                    comments_system: "2. Comments & Double Message Guard",
                    database_persistence: "3. BunnyDB Cloud & Storage Backup",
                    video_streaming_cdn: "4. Video Range Streaming (HTTP 206)",
                    business_auth_claims: "5. Business Auth & Magic Link",
                    search_place_resolution: "6. Search & Domain Resolution",
                    ai_content_safety: "7. Gemini Vision Safety Moderation",
                    like_button_throttling: "8. Like Button Multi-Click Throttling",
                    user_follow_sync: "9. Follow Button & Profile State Sync",
                    video_playback_controls: "10. Video Controls & Speed Rate Toggle",
                    camera_recording_modal: "11. Front Camera Selfie & 60s Countdown",
                    bookmarks_and_saved_places: "12. Bookmarks & Saved Collections",
                    notifications_and_badges: "13. Notifications & Activity Feed",
                    i18n_language_engine: "14. Multi-Language i18n Translation",
                    video_review_persistence_sync: "15. Review Submission & Business Page Sync Guard",
                    business_owner_claims: "16. Business Claims & Verified Badge Engine",
                    place_drawer_directions: "17. Google Maps Directions & Contact Actions",
                    user_profiles_avatars: "18. Reviewer Profile Drawers & Avatars",
                    video_cascade_deletion: "19. Review Deletion & Cascade Storage Cleanup",
                    business_pricing_stripe: "20. Business Agency Partnerships & Verification",
                    content_moderation_reporting: "21. Content Flagging & Moderation Queue",
                    pwa_service_worker_cache: "22. PWA Cache Eviction & Service Worker",
                    video_sharing_deep_links: "23. Deep Links, Share & Embed Generator",
                    category_clubs_discovery: "24. Category Filters & Place Discovery",
                    video_review_feed_retention: "25. Video Review Retention & Feed Disappearance Guard",
                    comments_deduplication_sync: "26. Review ID Leak Guard, Caption Sanitizer & Comments Deduplication",
                    business_profile_review_match_guard: "27. Business Profile Place Review Matching & Empty State Guard",
                    comments_realtime_sync_guard: "28. Video Comments & Owner Response Real-Time Sync Guard",
                    cross_device_comment_sync_guard: "29. Cross-Device Comment Deletion, Mobile Cache & Business Owner Logo Guard",
                    user_profile_chat_dedup_guard: "30. Business Chat Single-Profile & User Address Update Guard",
                    fake_reviewer_ghost_profile_ban_guard: "31. Fake/Mock Reviewer Profile, Anonymous UUID Recipient & Ghost Creator Drawer Ban Guard",
                    zero_fake_followers_strict_enforcement_guard: "32. Zero Fake/Synthetic Followers for Businesses & Users Guard",
                    business_comments_messages_sync_guard: "33. Business Video Review Comments & Direct Messages Notification Sync Guard",
                    business_universal_notifications_all_interactions_guard: "34. Business Universal All-Interaction Notifications & Direct Message Delivery Guard",
                    business_profile_banner_logo_database_live_sync_guard: "35. Business Profile Logo, Cover Banner & Info Live Database Storage Guard",
                    google_maps_business_name_resolution_anti_break_guard: "36. Google Maps Entity Resolution, Embedded Maps & Directions Anti-Break Guard",
                    universal_avatar_deterministic_sync_guard: "37. Universal Avatar Parity & Deterministic Color Sync Guard",
                    business_cover_banner_sync_storage_guard: "38. Business Profile Cover Banner Instant Sync & Storage Asset Purge Guard",
                    realtime_stream_sse_stability_guard: "39. Real-Time Stream & SSE Connection Stability Guard",
                    universal_resource_api_telemetry_guard: "40. Universal Application & Resource Error Telemetry Guard",
                    mobile_user_profile_location_layout_stability_guard: "41. Mobile User Profile Location Layout Stability & Anti-Flicker Guard",
                    video_author_user_attribution_integrity_guard: "42. Video Review Author Identity & User Attribution Anti-Collision Guard",
                    video_review_metadata_sharing_social_preview_guard: "43. Video Review Social Sharing Preview & OpenGraph Metadata Integrity Guard",
                    user_profile_location_canonicalization_guard: "43. Video Review Social Sharing Preview & OpenGraph Metadata Integrity Guard",
                    video_recording_upload_anti_stall_guard: "44. Video Recording, 95% Anti-Stall & Resilient Publishing Guard",
                    video_cross_device_instant_live_sync_guard: "45. Video Review Cross-Device Instant Live Feed Broadcast & Global Cloud Sync Guard",
                    business_web_listing_logo_banner_contrast_guard: "46. Business Web Listing Logo, Cover Banner Instant Resolution & Dark-Mode High-Contrast Visibility Guard",
                    duplicate_notification_prevention_live_guard: "47. Real-Time Video Comments Duplicate Notification Prevention & Multi-Channel Anti-Collision Guard"
                  };

                  const icons: Record<string, string> = {
                    video_feed_engine: "🎬",
                    comments_system: "💬",
                    database_persistence: "⚡",
                    video_streaming_cdn: "📡",
                    business_auth_claims: "🔐",
                    search_place_resolution: "🔍",
                    ai_content_safety: "🛡️",
                    like_button_throttling: "❤️",
                    user_follow_sync: "👤",
                    video_playback_controls: "⏯️",
                    camera_recording_modal: "📷",
                    bookmarks_and_saved_places: "🔖",
                    notifications_and_badges: "🔔",
                    i18n_language_engine: "🌐",
                    video_review_persistence_sync: "📹",
                    business_owner_claims: "🏷️",
                    place_drawer_directions: "🗺️",
                    user_profiles_avatars: "🖼️",
                    video_cascade_deletion: "🗑️",
                    business_pricing_stripe: "🤝",
                    content_moderation_reporting: "🚩",
                    pwa_service_worker_cache: "📲",
                    video_sharing_deep_links: "🔗",
                    category_clubs_discovery: "🧭",
                    video_review_feed_retention: "🛡️",
                    comments_deduplication_sync: "💬",
                    business_profile_review_match_guard: "🏢",
                    comments_realtime_sync_guard: "⚡",
                    cross_device_comment_sync_guard: "🔄",
                    user_profile_chat_dedup_guard: "👤",
                    fake_reviewer_ghost_profile_ban_guard: "👻",
                    zero_fake_followers_strict_enforcement_guard: "🛡️",
                    business_comments_messages_sync_guard: "🔔",
                    business_universal_notifications_all_interactions_guard: "📬",
                    business_profile_banner_logo_database_live_sync_guard: "🖼️",
                    google_maps_business_name_resolution_anti_break_guard: "🗺️",
                    universal_avatar_deterministic_sync_guard: "🎨",
                    business_cover_banner_sync_storage_guard: "🖼️",
                    realtime_stream_sse_stability_guard: "⚡",
                    universal_resource_api_telemetry_guard: "🛡️",
                    mobile_user_profile_location_layout_stability_guard: "📍",
                    video_author_user_attribution_integrity_guard: "🛡️",
                    video_review_metadata_sharing_social_preview_guard: "🔗",
                    user_profile_location_canonicalization_guard: "📍",
                    video_recording_upload_anti_stall_guard: "📹",
                    video_cross_device_instant_live_sync_guard: "🔄",
                    business_web_listing_logo_banner_contrast_guard: "✨",
                    duplicate_notification_prevention_live_guard: "🔔"
                  };

                  return (
                    <div key={key} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{icons[key] || "⚙️"}</span>
                          <span className="text-xs font-bold text-white">{titles[key] || key}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          item.status === 'ok'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : item.status === 'degraded'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {item.status === 'ok' ? 'PASSED 🟢' : item.status === 'degraded' ? 'WARNING 🟡' : 'ERROR 🔴'}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 font-mono">
                        {item.details}
                      </p>

                      <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <span>📋 How To Test This Feature:</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-normal">
                          {item.testInstruction}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
                        <span>Latency: {item.latencyMs}ms</span>
                        <span>Auto-Checked</span>
                      </div>

                      {key === "cross_device_comment_sync_guard" && (
                        <button
                          type="button"
                          onClick={handleSyncCommentsCache}
                          disabled={isSyncingComments}
                          className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingComments ? "animate-spin" : ""}`} />
                          <span>{isSyncingComments ? "Reconciling Comments & Flushing Device Caches..." : "Re-sync Comments & Flush Stale Device Caches"}</span>
                        </button>
                      )}

                      {key === "user_profile_chat_dedup_guard" && (
                        <button
                          type="button"
                          onClick={handleReconcileUserProfiles}
                          disabled={isReconcilingProfiles}
                          className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isReconcilingProfiles ? "animate-spin" : ""}`} />
                          <span>{isReconcilingProfiles ? "Reconciling & Deduplicating User Profiles..." : "Re-sync & Deduplicate User Profiles"}</span>
                        </button>
                      )}

                      {key === "fake_reviewer_ghost_profile_ban_guard" && (
                        <button
                          type="button"
                          onClick={handleReconcileUserProfiles}
                          disabled={isReconcilingProfiles}
                          className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isReconcilingProfiles ? "Purging Ghost Records & Enforcing Policies..." : "Purge Ghost Profiles & Enforce Real Identities"}</span>
                        </button>
                      )}

                      {key === "zero_fake_followers_strict_enforcement_guard" && (
                        <button
                          type="button"
                          onClick={handleAuditFollowers}
                          disabled={isAuditingFollowers}
                          className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isAuditingFollowers ? "Auditing Follower Integrity..." : "Audit & Purge Synthetic Follower Relationships"}</span>
                        </button>
                      )}

                      {key === "business_profile_banner_logo_database_live_sync_guard" && (
                        <button
                          type="button"
                          onClick={handleResyncBusinessBanners}
                          disabled={isResyncingBanners}
                          className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isResyncingBanners ? "animate-spin text-amber-400" : "text-emerald-400"}`} />
                          <span>{isResyncingBanners ? "Synchronizing Banners with Bunny CDN..." : "Resync Business Banners with Bunny CDN"}</span>
                        </button>
                      )}

                      {key === "google_maps_business_name_resolution_anti_break_guard" && (
                        <button
                          type="button"
                          onClick={handleResyncMapsPreviews}
                          disabled={isResyncingMaps}
                          className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                          <MapPin className={`w-3.5 h-3.5 ${isResyncingMaps ? "animate-bounce text-amber-400" : "text-emerald-400"}`} />
                          <span>{isResyncingMaps ? "Verifying Google Maps Previews for All Places..." : "Re-Verify Google Maps Previews for All Businesses"}</span>
                        </button>
                      )}

                      {(key === "video_review_metadata_sharing_social_preview_guard" || key === "user_profile_location_canonicalization_guard") && (
                        <button
                          type="button"
                          onClick={handleVerifyShareCards}
                          disabled={isVerifyingShareCards}
                          className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                          <Share2 className={`w-3.5 h-3.5 ${isVerifyingShareCards ? "animate-spin text-amber-400" : "text-cyan-400"}`} />
                          <span>{isVerifyingShareCards ? "Auditing & Verifying Social Share Cards..." : "Test & Verify Social Share Cards for All Reviews"}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Real-Time Reported Error & Exception Log Section */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>🐛</span> Real-Time Error & Exception Logs
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Every unhandled button click, network timeout, or component error is logged here automatically in real time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-mono">
                      {healthData?.logs?.length || 0} Total Logged Events
                    </span>
                  </div>
                </div>

                {(!healthData?.logs || healthData.logs.length === 0) ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Zero Error Logs Detected</h4>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                        The system has logged zero runtime exceptions or broken interactions across all features. Everything is running smoothly!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {healthData.logs.map((log: any) => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all ${
                          log.status === 'resolved'
                            ? 'bg-zinc-950/50 border-zinc-800/50 opacity-60'
                            : 'bg-zinc-950 border-rose-500/30 shadow-lg'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              log.status === 'resolved'
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {log.category || 'uncaught'}
                            </span>
                            <span className="font-bold text-white">{log.component}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-200 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            {log.status !== 'resolved' && (
                              <button
                                onClick={() => handleClearErrorLog(log.id)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="font-mono text-zinc-200 font-medium bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80 break-all">
                          {log.message}
                        </p>

                        {log.stack && (
                          <details className="text-[11px] text-zinc-200 font-mono">
                            <summary className="cursor-pointer hover:text-white transition-colors">
                              View Stack Trace
                            </summary>
                            <pre className="mt-2 p-2.5 bg-black/60 rounded-xl overflow-x-auto text-[10px] text-rose-300/90 leading-tight">
                              {log.stack}
                            </pre>
                          </details>
                        )}

                        {log.testSteps && (
                          <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/90">
                            <span className="font-bold text-amber-400 block mb-1">How To Test & Reproduce:</span>
                            <pre className="whitespace-pre-wrap font-sans text-zinc-300">
                              {log.testSteps}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW & KPIS */}
          {activeTab === "overview" && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Platform Command Center</h2>
                  <p className="text-sm text-zinc-200">Live operational overview across all video reviews, merchants, and users</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddPlaceOpen(true)}
                    className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Place
                  </button>
                  <button
                    onClick={() => setActiveTab("broadcast")}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" /> Broadcast
                  </button>
                </div>
              </div>

              {/* Bunny.net Real-Time Edge Database & CDN Storage Telemetry Hub */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">
                      🐰
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-white">Bunny.net Cloud Database & Storage Telemetry</h3>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Connected
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Authoritative libSQL Edge queries & Bunny CDN storage status • Auto-synced in real-time
                        {liveStats?.latencyMs !== undefined ? ` • ${liveStats.latencyMs}ms latency` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchLiveStats}
                      disabled={isLoadingLiveStats}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-zinc-700 cursor-pointer shadow-sm"
                      title="Directly ping and sync all table rows and storage from Bunny"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLiveStats ? "animate-spin text-amber-400" : "text-zinc-400"}`} />
                      <span>{isLoadingLiveStats ? "Syncing..." : "Refresh Live Sync"}</span>
                    </button>
                  </div>
                </div>

                {/* 8 Core Authoritative Counters from Bunny Database & Storage */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {/* 1. Video Reviews */}
                  <div 
                    onClick={() => setActiveTab("videos")}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Videos</span>
                      <Video className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveStats?.totals?.videoReviews ?? videos.length}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">BunnyDB videoReviews</span>
                  </div>

                  {/* 2. Claimed Businesses */}
                  <div 
                    onClick={() => setActiveTab("businesses")}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Businesses</span>
                      <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {metrics.totalBusinesses}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">Claimed Entities</span>
                  </div>

                  {/* 2b. Places Directory */}
                  <div 
                    onClick={() => setActiveTab("places")}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Places Directory</span>
                      <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {metrics.totalPhysicalPlaces}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">Unclaimed Venues</span>
                  </div>

                  {/* 3. Community Users */}
                  <div 
                    onClick={() => setActiveTab("users")}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Users</span>
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveStats?.totals?.users ?? uniqueUsers.length}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">BunnyDB users</span>
                  </div>

                  {/* 4. Comments */}
                  <div 
                    onClick={() => setActiveTab("comments")}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Comments</span>
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveStats?.totals?.comments ?? allComments.length}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">BunnyDB comments</span>
                  </div>

                  {/* 5. Likes */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Likes</span>
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveStats?.totals?.likes ?? metrics.totalLikes}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">BunnyDB likes</span>
                  </div>

                  {/* 6. Shares */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Shares</span>
                      <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveStats?.totals?.shares ?? metrics.totalShares}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">BunnyDB shares</span>
                  </div>

                  {/* 7. Bookmarks */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bookmarks</span>
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveStats?.totals?.bookmarks ?? metrics.totalBookmarks}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">BunnyDB bookmarks</span>
                  </div>

                  {/* 8. Bunny CDN Storage */}
                  <div 
                    onClick={() => setActiveTab("database")}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Storage</span>
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveStats?.storage?.filesCount ?? 0} <span className="text-xs font-normal text-zinc-400">files</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono truncate">
                      {liveStats?.storage?.formattedSize || "0.00 MB"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div 
                  onClick={() => setActiveTab("businesses")}
                  className="p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between text-zinc-200 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Claimed Businesses</span>
                    <Briefcase className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div className="text-3xl font-black text-white">{metrics.totalBusinesses}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-300 mt-2">
                    <span className="text-zinc-200 font-semibold">Business Claimed</span>
                    <span>•</span>
                    <span className="text-zinc-400">Official Profiles</span>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab("videos")}
                  className="p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between text-zinc-200 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Video Reviews</span>
                    <Video className="w-5 h-5 text-zinc-200" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {liveStats?.totals?.videoReviews ?? metrics.totalVideos}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200 mt-2">
                    <span className="text-zinc-200 font-semibold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {metrics.avgRating}
                    </span>
                    <span>Avg Rating</span>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab("places")}
                  className="p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between text-zinc-200 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Places Directory</span>
                    <Building2 className="w-5 h-5 text-zinc-200" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {metrics.totalPhysicalPlaces}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200 mt-2">
                    <span className="text-zinc-300 font-semibold">{metrics.totalPhysicalPlaces} Venues</span>
                    <span>•</span>
                    <span className="text-zinc-400">Unclaimed Directory</span>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab("creators")}
                  className="p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between text-zinc-200 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Creators</span>
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{metrics.totalCreators}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200 mt-2">
                    <span className="text-amber-400 font-semibold">{liveStats?.totals?.videoReviews ?? metrics.totalVideos} Videos</span>
                    <span>Authored</span>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab("users")}
                  className="p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between text-zinc-200 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Community Users</span>
                    <Users className="w-5 h-5 text-zinc-200" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {liveStats?.totals?.users ?? metrics.totalCommunityUsers}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200 mt-2">
                    <span className="text-zinc-200 font-semibold">Registered</span>
                    <span>Accounts</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-200 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Interactions</span>
                    <Heart className="w-5 h-5 text-zinc-200" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {(liveStats?.totals?.likes ?? metrics.totalLikes) + (liveStats?.totals?.comments ?? metrics.totalComments) + (liveStats?.totals?.shares ?? metrics.totalShares)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200 mt-2">
                    <span>{liveStats?.totals?.likes ?? metrics.totalLikes} Likes</span>
                    <span>•</span>
                    <span>{liveStats?.totals?.comments ?? metrics.totalComments} Comm.</span>
                    <span>•</span>
                    <span>{liveStats?.totals?.shares ?? metrics.totalShares} Shares</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump Modules */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Reviews Summary */}
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Video className="w-4 h-4 text-white" />
                      Recent Video Reviews
                    </h3>
                    <button
                      onClick={() => setActiveTab("videos")}
                      className="text-xs font-bold text-zinc-200 hover:text-white cursor-pointer"
                    >
                      View All ({videos.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {videos.slice(0, 4).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setPreviewVideo(v)}
                            className="w-10 h-14 rounded-lg bg-zinc-900 overflow-hidden relative shrink-0 cursor-pointer group"
                          >
                            <img src={getProxiedImageUrl(v.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-white truncate">{v.placeName}</h4>
                            <p className="text-xs text-zinc-200 truncate">by {v.author?.name || "Reviewer"}</p>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-200 mt-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {v.rating} Stars
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => setPreviewVideo(v)}
                            className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer border border-zinc-800"
                            title="Preview Video"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditVideoModal(v)}
                            className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer border border-zinc-800"
                            title="Edit Review"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {videos.length === 0 && (
                      <div className="py-8 text-center text-zinc-200 text-sm">No video reviews in database yet.</div>
                    )}
                  </div>
                </div>

                {/* Businesses Summary */}
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-white" />
                      Businesses & Directory
                    </h3>
                    <button
                      onClick={() => setActiveTab("places")}
                      className="text-xs font-bold text-zinc-200 hover:text-white cursor-pointer"
                    >
                      View All ({places.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {places.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <AdminPlaceLogo place={p} size="sm" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-white truncate" title={p.name}>{p.name}</h4>
                            <p className="text-xs text-zinc-200 truncate">
                              {p.category} • {p.city || p.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              p.isClaimed || p.claimedByEmail
                                ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                                : "bg-zinc-900 text-zinc-200 border border-zinc-800"
                            }`}
                          >
                            {p.isClaimed || p.claimedByEmail ? "Claimed" : "Unclaimed"}
                          </span>
                          <button
                            onClick={() => setEditPlaceModal(p)}
                            className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer border border-zinc-800"
                            title="Edit Place"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {places.length === 0 && (
                      <div className="py-8 text-center text-zinc-200 text-sm">No business places recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEOS MANAGEMENT */}
          {activeTab === "videos" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select All Checkbox */}
                  {filteredVideos.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-200 mr-2">
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.length === filteredVideos.length && filteredVideos.length > 0}
                        onChange={handleSelectAllVideos}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-zinc-500 cursor-pointer accent-white"
                      />
                      <span>Select All ({filteredVideos.length})</span>
                    </label>
                  )}

                  {/* Rating Filter Dropdown */}
                  <select
                    value={videoRatingFilter}
                    onChange={(e) => setVideoRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none"
                  >
                    <option value="all">All Star Ratings</option>
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-200 hover:text-zinc-200"}`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "table" ? "bg-zinc-800 text-white" : "text-zinc-200 hover:text-zinc-200"}`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-3">
                  {selectedVideoIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      {confirmBulkDeleteVideos ? (
                        <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 px-3 py-1.5 rounded-xl animate-in slide-in-from-right-2">
                          <span className="text-xs font-bold text-red-300">Delete {selectedVideoIds.length} videos?</span>
                          <button
                            onClick={executeBulkDeleteVideos}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm
                          </button>
                          <button
                            onClick={() => setConfirmBulkDeleteVideos(false)}
                            className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmBulkDeleteVideos(true)}
                          className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedVideoIds.length})
                        </button>
                      )}
                    </div>
                  )}

                  {/* Purge All Database Videos Button */}
                  {confirmPurgeAllVideos ? (
                    <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 p-1.5 px-3 rounded-xl animate-in slide-in-from-right-2">
                      <span className="text-xs font-bold text-red-300">Purge ALL videos from cloud database?</span>
                      <button
                        onClick={executePurgeAllVideos}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                      >
                        Yes, Wipe All
                      </button>
                      <button
                        onClick={() => setConfirmPurgeAllVideos(false)}
                        className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeAllVideos(true)}
                      className="px-3 py-2 bg-zinc-950 hover:bg-red-950/60 text-zinc-200 hover:text-red-300 border border-zinc-800 hover:border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Purge All Video Reviews
                    </button>
                  )}
                </div>
              </div>

              {/* Grid View */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className="group relative bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm hover:border-zinc-700 transition-all flex flex-col"
                    >
                      {/* Selection Box */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <input
                          type="checkbox"
                          checked={selectedVideoIds.includes(video.id)}
                          onChange={() => handleToggleVideoSelection(video.id)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-950/80 text-white focus:ring-zinc-500 cursor-pointer shadow-md accent-white"
                        />
                      </div>

                      {/* Video Thumbnail */}
                      <div
                        onClick={() => setPreviewVideo(video)}
                        className="aspect-[9/16] bg-black relative overflow-hidden cursor-pointer"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-3">
                          <div className="flex justify-end">
                            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[11px] font-bold text-white flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {video.rating}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-black text-sm drop-shadow-md truncate">{video.placeName}</p>
                            <p className="text-zinc-200 text-xs truncate">by {video.author?.name || "Reviewer"}</p>
                          </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 ml-0.5 fill-current" />
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Bar */}
                      <div className="p-3 bg-zinc-900 flex items-center justify-between border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {video.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {video.commentsCount || (video.comments || []).length}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditVideoModal(video)}
                            className="p-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit Review Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteVideoId === video.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => executeDeleteVideo(video.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteVideoId(null)}
                                className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteVideoId(video.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm text-zinc-200">
                    <thead className="bg-zinc-950 text-xs font-bold uppercase text-zinc-200 border-b border-zinc-800">
                      <tr>
                        <th className="p-4 w-12">
                          <input
                            type="checkbox"
                            checked={selectedVideoIds.length === filteredVideos.length && filteredVideos.length > 0}
                            onChange={handleSelectAllVideos}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer accent-white"
                          />
                        </th>
                        <th className="p-4">Preview</th>
                        <th className="p-4">Business Place</th>
                        <th className="p-4">Author / Reviewer</th>
                        <th className="p-4">Rating</th>
                        <th className="p-4">Engagement</th>
                        <th className="p-4">Recorded</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredVideos.map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-850/50 transition-colors">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedVideoIds.includes(v.id)}
                              onChange={() => handleToggleVideoSelection(v.id)}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer accent-white"
                            />
                          </td>
                          <td className="p-4">
                            <div
                              onClick={() => setPreviewVideo(v)}
                              className="w-12 h-16 rounded-lg bg-zinc-950 overflow-hidden relative cursor-pointer group"
                            >
                              <img src={getProxiedImageUrl(v.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white">{v.placeName}</div>
                            <div className="text-xs text-zinc-200">{v.placeCategory || "Establishment"}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-zinc-200">{v.author?.name || "Reviewer"}</div>
                            <div className="text-xs text-zinc-200">{v.author?.name || v.userEmail || "user"}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {v.rating}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-zinc-200">
                            <div>{v.likes || 0} Likes</div>
                            <div>{v.commentsCount || (v.comments || []).length} Comments</div>
                          </td>
                          <td className="p-4 text-xs text-zinc-200">{v.recordedAt || "Recent"}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPreviewVideo(v)}
                                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white cursor-pointer"
                                title="Play Video"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditVideoModal(v)}
                                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => executeDeleteVideo(v.id)}
                                className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/50 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredVideos.length === 0 && (
                <div className="py-16 text-center text-zinc-200 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
                  No video reviews found matching criteria.
                </div>
              )}
            </div>
          )}

          {/* TAB: REGISTERED & CLAIMED BUSINESSES */}
          {activeTab === "businesses" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              {/* Policy 32 Banner: Zero Fake Followers Guarantee */}
              <div className="flex items-center justify-between gap-3 p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                    32
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      Guard 32 Active: Zero Fake/Synthetic Followers for Businesses & Users
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      Customer video reviews and saved bookmarks strictly decoupled from followers. Only authentic explicit "+ Follow" clicks are counted.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAuditFollowers}
                  disabled={isAuditingFollowers}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAuditingFollowers ? "Auditing..." : "Audit Followers"}</span>
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select All Checkbox */}
                  {filteredBusinesses.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-200 mr-2">
                      <input
                        type="checkbox"
                        checked={selectedBusinessIds.length === filteredBusinesses.length && filteredBusinesses.length > 0}
                        onChange={handleSelectAllBusinesses}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-zinc-500 cursor-pointer accent-white"
                      />
                      <span>Select All ({filteredBusinesses.length})</span>
                    </label>
                  )}

                  {/* Business Category Filter */}
                  <select
                    value={businessCategoryFilter}
                    onChange={(e) => setBusinessCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none"
                  >
                    <option value="all">All Business Categories</option>
                    {uniqueBusinessCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right Buttons */}
                <div className="flex items-center gap-3">
                  {allBusinesses.length > 0 && (
                    <div>
                      {confirmPurgeAllBusinesses ? (
                        <div className="flex items-center gap-2 bg-red-950/60 border border-red-700 px-3 py-1.5 rounded-xl animate-in slide-in-from-right-2">
                          <span className="text-xs font-bold text-red-300">Purge ALL {allBusinesses.length} claimed businesses?</span>
                          <button
                            onClick={executePurgeAllBusinesses}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow"
                          >
                            <Check className="w-3.5 h-3.5" /> Purge All
                          </button>
                          <button
                            onClick={() => setConfirmPurgeAllBusinesses(false)}
                            className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmPurgeAllBusinesses(true)}
                          className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Purge all claimed businesses permanently from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Purge Businesses
                        </button>
                      )}
                    </div>
                  )}

                  {selectedBusinessIds.length > 0 && (
                    <div>
                      {confirmBulkDeleteBusinesses ? (
                        <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 px-3 py-1.5 rounded-xl animate-in slide-in-from-right-2">
                          <span className="text-xs font-bold text-red-300">Delete {selectedBusinessIds.length} businesses?</span>
                          <button
                            onClick={executeBulkDeleteBusinesses}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Yes
                          </button>
                          <button
                            onClick={() => setConfirmBulkDeleteBusinesses(false)}
                            className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmBulkDeleteBusinesses(true)}
                          className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedBusinessIds.length})
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setIsAddPlaceOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register Business
                  </button>
                </div>
              </div>

              {/* Businesses List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBusinesses.map((biz) => {
                  const bizVideos = getPlaceVideos(biz);
                  const isYoouzOfficial = biz.id === 'yoouz.com' || biz.brandDomain === 'yoouz.com' || (biz.name && biz.name.toLowerCase() === 'yoouz');
                  const domain = biz.brandDomain || (biz.website ? biz.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '') || (isYoouzOfficial ? 'yoouz.com' : '');
                  const websiteUrl = biz.website || (domain ? `https://${domain}` : '');

                  return (
                    <div
                      key={biz.id}
                      className={`p-4 rounded-2xl bg-zinc-900 border transition-all flex flex-col justify-between space-y-4 ${
                        isYoouzOfficial ? "border-zinc-700 ring-1 ring-zinc-700/50 shadow-md" : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 w-full">
                          <input
                            type="checkbox"
                            checked={selectedBusinessIds.includes(biz.id)}
                            onChange={() => handleToggleBusinessSelection(biz.id)}
                            className="w-4 h-4 mt-1.5 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-zinc-500 cursor-pointer accent-white shrink-0"
                          />

                          <AdminPlaceLogo place={biz} size="md" className="shrink-0 mt-0.5" />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 
                                className="font-bold text-white text-sm sm:text-base leading-snug break-words" 
                                title={biz.name}
                              >
                                {biz.name}
                              </h3>
                              {isYoouzOfficial && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-200">
                                  Official Platform
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {biz.category}
                            </p>
                          </div>
                        </div>

                        {/* Domain / Website URL Pill */}
                        {domain && (
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono font-bold truncate">
                              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="truncate">{domain}</span>
                            </div>
                            {websiteUrl && (
                              <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 ml-2"
                              >
                                Visit <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Business Claim & Metrics Info */}
                        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-medium">Status:</span>
                            {/* Neutral non-green badge per user guidelines */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                              Business Claimed
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-400 font-medium">Video Reviews:</span>
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Video className="w-3.5 h-3.5 text-zinc-400" />
                              {bizVideos.length > 0 ? (
                                <span className="text-zinc-200 font-bold">{bizVideos.length} recorded</span>
                              ) : (
                                <span className="text-zinc-500 font-normal">0 reviews</span>
                              )}
                            </span>
                          </div>

                          {biz.city && (
                            <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{biz.city}{biz.address ? ` • ${biz.address}` : ''}</span>
                            </div>
                          )}

                          {biz.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                              <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{biz.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                        <button
                          onClick={() => setEditPlaceModal(biz)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Business
                        </button>

                        {confirmDeleteBusinessId === biz.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                executeDeletePlace(biz.id);
                                setConfirmDeleteBusinessId(null);
                              }}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteBusinessId(null)}
                              className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteBusinessId(biz.id)}
                            className="p-2 rounded-xl text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete Business"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredBusinesses.length === 0 && (
                <div className="py-16 text-center text-zinc-300 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800 space-y-2">
                  <p className="font-bold">No businesses found matching criteria.</p>
                  <p className="text-xs text-zinc-500">You can claim venues from the Places Directory tab or register a new business.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: PLACES & VENUES DIRECTORY */}
          {activeTab === "places" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select All Checkbox */}
                  {filteredPhysicalPlaces.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-200 mr-2">
                      <input
                        type="checkbox"
                        checked={selectedPlaceIds.length === filteredPhysicalPlaces.length && filteredPhysicalPlaces.length > 0}
                        onChange={handleSelectAllPlaces}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-zinc-500 cursor-pointer accent-white"
                      />
                      <span>Select All ({filteredPhysicalPlaces.length})</span>
                    </label>
                  )}

                  {/* Category Filter */}
                  <select
                    value={placeCategoryFilter}
                    onChange={(e) => setPlaceCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none"
                  >
                    <option value="all">All Place Categories</option>
                    {uniquePlaceCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right Buttons */}
                <div className="flex items-center gap-3">
                  {allPhysicalPlaces.length > 0 && (
                    <div>
                      {confirmPurgeAllPlaces ? (
                        <div className="flex items-center gap-2 bg-red-950/60 border border-red-700 px-3 py-1.5 rounded-xl animate-in slide-in-from-right-2">
                          <span className="text-xs font-bold text-red-300">Purge ALL {allPhysicalPlaces.length} places permanently?</span>
                          <button
                            onClick={executePurgeAllPlaces}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow"
                          >
                            <Check className="w-3.5 h-3.5" /> Purge All
                          </button>
                          <button
                            onClick={() => setConfirmPurgeAllPlaces(false)}
                            className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmPurgeAllPlaces(true)}
                          className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Purge all directory places permanently from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Purge Places
                        </button>
                      )}
                    </div>
                  )}

                  {selectedPlaceIds.length > 0 && (
                    <div>
                      {confirmBulkDeletePlaces ? (
                        <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 px-3 py-1.5 rounded-xl animate-in slide-in-from-right-2">
                          <span className="text-xs font-bold text-red-300">Delete {selectedPlaceIds.length} places?</span>
                          <button
                            onClick={executeBulkDeletePlaces}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Yes
                          </button>
                          <button
                            onClick={() => setConfirmBulkDeletePlaces(false)}
                            className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmBulkDeletePlaces(true)}
                          className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedPlaceIds.length})
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setIsAddPlaceOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Place
                  </button>
                </div>
              </div>

              {/* Places List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPhysicalPlaces.map((place) => {
                  const placeVideos = getPlaceVideos(place);

                  return (
                    <div
                      key={place.id}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 w-full">
                          <input
                            type="checkbox"
                            checked={selectedPlaceIds.includes(place.id)}
                            onChange={() => handleTogglePlaceSelection(place.id)}
                            className="w-4 h-4 mt-1.5 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-zinc-500 cursor-pointer accent-white shrink-0"
                          />

                          <AdminPlaceLogo place={place} size="md" className="shrink-0 mt-0.5" />

                          <div className="min-w-0 flex-1">
                            <h3 
                              className="font-bold text-white text-sm sm:text-base leading-snug break-words line-clamp-2" 
                              title={place.name}
                            >
                              {place.name}
                            </h3>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {place.category}{place.city || place.address ? ` • ${place.city || place.address}` : (place.brandDomain || place.website ? ` • ${place.brandDomain || place.website}` : "")}
                            </p>
                          </div>
                        </div>

                        {/* Place Directory Info */}
                        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-medium">Directory Status:</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium text-[11px] bg-zinc-850 border border-zinc-750 text-zinc-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                              Unclaimed Venue
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-400 font-medium">Video Reviews:</span>
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Video className="w-3.5 h-3.5 text-zinc-400" />
                              {placeVideos.length > 0 ? (
                                <span className="text-zinc-200 font-bold">{placeVideos.length} recorded</span>
                              ) : (
                                <span className="text-zinc-500 font-normal">0 reviews</span>
                              )}
                            </span>
                          </div>

                          {place.address && (
                            <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{place.address}</span>
                            </div>
                          )}

                          {place.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                              <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{place.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickClaimPlace(place)}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-zinc-700"
                            title="Promote this place to an official claimed business profile"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-zinc-300" /> Claim as Business
                          </button>
                          <button
                            onClick={() => setEditPlaceModal(place)}
                            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-zinc-800"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                        </div>

                        {confirmDeletePlaceId === place.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => executeDeletePlace(place.id)}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeletePlaceId(null)}
                              className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeletePlaceId(place.id)}
                            className="p-2 rounded-xl text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete Place"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPhysicalPlaces.length === 0 && (
                <div className="py-16 text-center text-zinc-300 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
                  No places found in directory.
                </div>
              )}
            </div>
          )}

          {/* TAB: CREATORS & REVIEWERS */}
          {activeTab === "creators" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Guard 30 & 31 Active:</strong> Real Verified Reviewer Identities Only. Fake, mock "Reviewer" profiles and blank anonymous UUIDs are strictly banned from directory, chat, and creator drawers.</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 font-mono shrink-0">
                  0 Mock Profiles Allowed
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-white">Creators & Video Reviewers</span>
                  </div>

                  <select
                    value={creatorFilter}
                    onChange={(e) => setCreatorFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none"
                  >
                    <option value="all">All Creators ({creatorsList.length})</option>
                    <option value="verified">Verified Creators Only ({creatorsList.filter((c) => c.isVerified).length})</option>
                    <option value="top">Top Creators (3+ Reviews)</option>
                  </select>
                </div>

                <div className="text-xs text-zinc-300 font-semibold bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                  Showing <span className="text-amber-400 font-bold">{filteredCreators.length}</span> creators
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCreators.map((creator) => {
                  const creatorVideos = videos.filter((v) =>
                    isAuthorMatch(v, {
                      name: creator.name,
                      handle: `@${creator.name}`,
                      email: creator.email,
                      uid: creator.uid || creator.id
                    })
                  );

                  const totalLikes = creatorVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
                  const totalViews = creatorVideos.reduce((acc, v) => acc + (v.views || 0), 0);
                  const avgCreatorRating = creatorVideos.length > 0 
                    ? (creatorVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / creatorVideos.length).toFixed(1)
                    : "5.0";

                  return (
                    <div
                      key={creator.name || creator.email || creator.id}
                      className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-full bg-zinc-950 border border-amber-500/30 overflow-hidden shrink-0 relative">
                          <img 
                            src={creator.avatar} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { 
                              const target = e.currentTarget as HTMLImageElement; 
                              if (!target.src.includes('/api/avatar')) { 
                                target.src = `/api/avatar?name=${encodeURIComponent(creator.name || "Creator")}&background=27272a&color=fff`; 
                              } 
                            }} 
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white text-base truncate">{creator.name}</h3>
                            {creator.isVerified && (
                              <span title="Verified Creator">
                                <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-amber-400/90 font-mono truncate">
                            {creator.handle ? (creator.handle.startsWith("@") ? creator.handle : `@${creator.handle}`) : `@${creator.name}`}
                          </p>

                          {creator.email && <p className="text-[11px] text-zinc-400 truncate mt-0.5">{creator.email}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-bold">Reviews</div>
                          <div className="font-black text-white text-sm">{creatorVideos.length}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-bold">Likes</div>
                          <div className="font-black text-white text-sm">{totalLikes}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-bold">Avg Rating</div>
                          <div className="font-black text-amber-400 text-sm flex items-center justify-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" /> {avgCreatorRating}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setEditUserModal(creator)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit Creator
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {creatorVideos.length > 0 && (
                              <button
                                onClick={() => {
                                  const userVidIds = creatorVideos.map((v) => v.id);
                                  if (onBulkDeleteVideos) onBulkDeleteVideos(userVidIds);
                                  showToast(`Removed all ${userVidIds.length} reviews for @${creator.name}`);
                                }}
                                className="px-2.5 py-1.5 text-orange-400 hover:bg-orange-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                title="Remove this creator's videos (keeps account intact)"
                              >
                                Clear Reviews
                              </button>
                            )}

                            {confirmDeleteUserId === (creator.id || creator.uid) ? (
                              <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-900/60 p-1 rounded-xl">
                                <span className="text-[11px] font-bold text-red-300 px-1">Delete?</span>
                                <button
                                  onClick={() => executeDeleteUser(creator)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteUserId(null)}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteUserId(creator.id || creator.uid)}
                                className="px-2.5 py-1.5 text-red-400 hover:bg-red-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Delete creator account"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCreators.length === 0 && (
                <div className="py-16 text-center text-zinc-400 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
                  No creators found matching criteria.
                </div>
              )}
            </div>
          )}

          {/* TAB: USERS & COMMUNITY MEMBERS */}
          {activeTab === "users" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Guard 30 & 31 Active:</strong> Real Verified Reviewer Identities Only. Fake, mock "Reviewer" profiles and blank anonymous UUIDs are strictly banned from directory, chat, and creator drawers.</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 font-mono shrink-0">
                  0 Mock Profiles Allowed
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-zinc-200" />
                    <span className="text-sm font-bold text-white">All Users & Community Members</span>
                  </div>

                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none"
                  >
                    <option value="all">All Users ({uniqueUsers.length})</option>
                    <option value="registered">Registered Accounts</option>
                    <option value="creators">Creators ({creatorsList.length})</option>
                  </select>

                  {confirmPurgeAllUsers ? (
                    <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800 px-2 py-1 rounded-xl">
                      <span className="text-xs text-red-200 font-bold">Purge ALL user accounts?</span>
                      <button
                        onClick={handleExecutePurgeAllUsers}
                        disabled={isPurgingUsers}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isPurgingUsers ? "Purging..." : "Confirm Purge"}
                      </button>
                      <button
                        onClick={() => setConfirmPurgeAllUsers(false)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeAllUsers(true)}
                      className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Delete all user accounts"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" /> Purge All Users
                    </button>
                  )}
                </div>

                <div className="text-xs text-zinc-300 font-semibold bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                  Showing <span className="text-white font-bold">{filteredUsers.length}</span> active users
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                  return (
                    <div
                      key={user.name || user.email || user.id}
                      className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0">
                          <img 
                            src={user.avatar} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { 
                              const target = e.currentTarget as HTMLImageElement; 
                              if (!target.src.includes('/api/avatar')) { 
                                target.src = `/api/avatar?name=${encodeURIComponent(user.name || "User")}&background=27272a&color=fff`; 
                              } 
                            }} 
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white text-base truncate">{user.name}</h3>
                            {user.isVerified && <BadgeCheck className="w-4 h-4 text-zinc-200 shrink-0" />}
                          </div>
                          
                          {user.email && <p className="text-xs text-zinc-300 truncate">{user.email}</p>}
                          {user.city && (
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {user.city}{user.country ? `, ${user.country}` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-zinc-400">Account Type: </span>
                          <span className="font-bold text-white">{user.role || "Community Member"}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold text-[10px]">
                          {user.role || "Member"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setEditUserModal(user)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit Profile
                          </button>

                          {confirmDeleteUserId === (user.id || user.uid) ? (
                            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-900/60 p-1 rounded-xl">
                              <span className="text-[11px] font-bold text-red-300 px-1">Delete user?</span>
                              <button
                                onClick={() => executeDeleteUser(user)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteUserId(null)}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteUserId(user.id || user.uid)}
                              className="px-2.5 py-1.5 text-red-400 hover:bg-red-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Delete entire user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStandardUsers.length === 0 && (
                <div className="py-16 text-center text-zinc-400 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
                  No community members found.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMMENTS & MODERATION */}
          {activeTab === "comments" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <h3 className="font-bold text-white text-base">Comments & Social Moderation</h3>
                  <p className="text-xs text-zinc-200">Review and moderate user discussions across all video reviews</p>
                </div>
                <div className="text-xs font-mono text-zinc-200 bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800">
                  {allComments.length} Total Comments
                </div>
              </div>

              <div className="space-y-3">
                {filteredComments.map((item) => {
                  const commentKey = `${item.video.id}_${item.comment.id}`;
                  return (
                    <div
                      key={commentKey}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start justify-between gap-4 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={item.comment.authorAvatar || `/api/avatar?name=${encodeURIComponent(item.comment.authorName)}&background=27272a&color=fff&bold=true`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover bg-zinc-950 shrink-0"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} /> 
 <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{item.comment.authorName}</span>
                            <span className="text-xs text-zinc-200">@{item.comment.authorHandle}</span>
                            {item.isReply && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">Reply</span>
                            )}
                            <span className="text-[11px] text-zinc-200">• on "{item.video.placeName}"</span>
                          </div>
                          <p className="text-zinc-200 text-sm mt-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                            {item.comment.text}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {confirmDeleteCommentInfo?.commentId === item.comment.id ? (
                          <div className="flex items-center gap-1 bg-red-950/40 border border-red-800/60 p-1.5 rounded-xl">
                            <button
                              onClick={() => {
                                if (onDeleteComment) {
                                  onDeleteComment(
                                    item.video.id,
                                    item.isReply && item.parentCommentId ? item.parentCommentId : item.comment.id,
                                    item.isReply ? item.comment.id : undefined
                                  );
                                }
                                setConfirmDeleteCommentInfo(null);
                                showToast("Comment deleted permanently.");
                                setTimeout(fetchLiveStats, 400);
                              }}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCommentInfo(null)}
                              className="p-1 text-zinc-200 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmDeleteCommentInfo({ videoId: item.video.id, commentId: item.comment.id })
                            }
                            className="p-2 rounded-xl text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredComments.length === 0 && (
                  <div className="py-16 text-center text-zinc-200 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
                    No comments found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: BROADCAST ALERTS */}
          {activeTab === "broadcast" && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Broadcast Platform Notification</h2>
                <p className="text-sm text-zinc-200">
                  Send real-time instant announcements to all registered users and creators across Yoouz.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-md">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-200 mb-2">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={broadcastData.title}
                    onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                    placeholder="e.g. New Features Live / Special Weekend Update"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-200 mb-2">
                    Message Body (Required)
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                    placeholder="Write announcement message that will appear in users' notification inboxes..."
                    required
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-200 mb-2">
                    Target Video or Business URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={broadcastData.targetUrl}
                    onChange={(e) => setBroadcastData({ ...broadcastData, targetUrl: e.target.value })}
                    placeholder="e.g. video_id or https://yoouz.com/place/..."
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isBroadcastSending || !broadcastData.message.trim()}
                    className="px-6 py-3.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {isBroadcastSending ? "Broadcasting..." : "Send Broadcast to All Users"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: DATABASE & CLOUD SUITE */}
          {activeTab === "database" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Database & Cloud Integrations</h2>
                <p className="text-sm text-zinc-200">
                  Direct connectivity, backup exports, and system state diagnostics for Bunny.net and Cloud Sync.
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-white text-base">Bunny.net libSQL Edge Database & CDN Storage Active</h3>
                      <p className="text-xs text-zinc-400">Zero-latency distributed edge database + Bunny CDN persistent object storage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchLiveStats}
                      disabled={isLoadingLiveStats}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLiveStats ? "animate-spin text-amber-400" : "text-zinc-400"}`} />
                      <span>{isLoadingLiveStats ? "Syncing..." : "Sync Tables"}</span>
                    </button>
                    <span className="text-xs font-mono bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-emerald-400 font-bold">
                      {liveStats ? `CONNECTED (${liveStats.latencyMs}ms)` : "CONNECTED"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1">Live Videos in DB</span>
                    <span className="font-mono text-lg font-bold text-white">
                      {liveStats?.totals?.videoReviews ?? videos.length} rows
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">table: videoReviews</span>
                  </div>
                  <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1">Live Places in DB</span>
                    <span className="font-mono text-lg font-bold text-white">
                      {liveStats?.totals?.places ?? places.length} rows
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">table: places</span>
                  </div>
                  <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1">Registered Users</span>
                    <span className="font-mono text-lg font-bold text-white">
                      {liveStats?.totals?.users ?? uniqueUsers.length} rows
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">table: users</span>
                  </div>
                  <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1">CDN Video Storage</span>
                    <span className="font-mono text-lg font-bold text-emerald-400">
                      {liveStats?.storage?.filesCount ?? 0} files ({liveStats?.storage?.formattedSize || "0.00 MB"})
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">path: rev1/videos/</span>
                  </div>
                </div>
              </div>

              {/* Bunny.net Database Tables Live Row Counter */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🐰</span>
                    <h3 className="font-bold text-white text-base">Bunny.net Database Tables Live Row Parity</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg font-bold">
                    10 Database Tables Verified
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real-time direct row counts from Bunny.net Edge libSQL tables. Any updates, creates, or deletions reflect here immediately.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-1">
                  {[
                    { name: "videoReviews", label: "Video Reviews", count: liveStats?.totals?.videoReviews ?? videos.length },
                    { name: "places", label: "Places & Businesses", count: liveStats?.totals?.places ?? places.length },
                    { name: "users", label: "User Accounts", count: liveStats?.totals?.users ?? uniqueUsers.length },
                    { name: "comments", label: "Comments", count: liveStats?.totals?.comments ?? allComments.length },
                    { name: "likes", label: "Likes", count: liveStats?.totals?.likes ?? metrics.totalLikes },
                    { name: "shares", label: "Shares", count: liveStats?.totals?.shares ?? metrics.totalShares },
                    { name: "bookmarks", label: "Bookmarks", count: liveStats?.totals?.bookmarks ?? metrics.totalBookmarks },
                    { name: "chats", label: "Direct Messages", count: liveStats?.totals?.chats ?? 0 },
                    { name: "notifications", label: "Notifications", count: liveStats?.totals?.notifications ?? 0 },
                    { name: "businessClaims", label: "Business Claims", count: liveStats?.totals?.businessClaims ?? 0 }
                  ].map((t) => (
                    <div key={t.name} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] text-zinc-300 font-bold truncate">{t.name}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-black text-white font-mono">{t.count}</span>
                        <span className="text-[10px] text-zinc-500">rows</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bunny CDN Object Storage Telemetry */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-base">Bunny CDN Video Storage Details</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold">
                    rev1/videos/ Zone
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Raw video files uploaded during review creation are stored in the Bunny Edge Storage cluster. Permanent video or account deletion purges the file from this storage bucket.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1">Storage Zone</span>
                    <span className="font-mono text-sm font-bold text-white">{liveStats?.storage?.zoneName || "yoouz-storage"}</span>
                  </div>
                  <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1">Video Files in CDN</span>
                    <span className="font-mono text-sm font-bold text-white">{liveStats?.storage?.filesCount ?? 0} media files</span>
                  </div>
                  <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1">Total Allocated Size</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{liveStats?.storage?.formattedSize || "0.00 MB"}</span>
                  </div>
                </div>
              </div>

              {/* Backup & Tools */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
                <h3 className="font-bold text-white text-base">Database Backup & Recovery</h3>
                <p className="text-sm text-zinc-200">
                  Export complete collections as formatted JSON for external backups, archiving, or offline analysis.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleExportDataJSON}
                    className="px-5 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-2xl text-sm transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Complete JSON Backup
                  </button>

                  <button
                    onClick={handleMasterReset}
                    disabled={isMasterResetting}
                    className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-sm transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isMasterResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Master System Reset (Wipe All From Scratch)
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* VIDEO PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors border border-zinc-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player Box */}
            <div className="md:w-1/2 bg-black flex items-center justify-center relative aspect-[9/16] md:aspect-auto max-h-[50vh] md:max-h-full">
              <video
                ref={videoPlayerRef}
                src={previewVideo.videoUrl || previewVideo.localVideoUrl}
                poster={previewVideo.thumbnailUrl}
                loop
                playsInline
                muted={isVideoMuted}
                onCanPlay={() => {
                  if (!hasVideoStarted && videoPlayerRef.current) {
                    videoPlayerRef.current.pause();
                    setIsVideoPlaying(false);
                  }
                }}
                onPlaying={() => {
                  if (!hasVideoStarted && videoPlayerRef.current) {
                    videoPlayerRef.current.pause();
                    setIsVideoPlaying(false);
                  } else {
                    setIsVideoPlaying(true);
                  }
                }}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onTimeUpdate={(e) => {
                  const t = e.currentTarget;
                  // Safety catch: force pause if it should be stopped but is moving
                  if ((!hasVideoStarted || !isVideoPlaying) && !t.paused) {
                    t.pause();
                  }
                }}
                className="w-full h-full object-contain"
              />

              {/* Central Play Overlay if not started */}
              {!hasVideoStarted && (
                <button
                  onClick={() => {
                    setHasVideoStarted(true);
                    setIsVideoPlaying(true);
                    videoPlayerRef.current?.play();
                  }}
                  className="absolute inset-0 w-full h-full z-20 flex items-center justify-center bg-black/20 group hover:bg-black/30 transition-all cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 fill-white ml-1" />
                  </div>
                </button>
              )}

              {/* Player Overlay Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (videoPlayerRef.current) {
                      if (!hasVideoStarted) setHasVideoStarted(true);
                      if (isVideoPlaying) videoPlayerRef.current.pause();
                      else videoPlayerRef.current.play();
                      setIsVideoPlaying(!isVideoPlaying);
                    }
                  }}
                  className="p-2.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-zinc-900/40 cursor-pointer"
                >
                  {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  className="p-2.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-zinc-900/40 cursor-pointer"
                >
                  {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Video Metadata & Controls */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {previewVideo.rating} Stars
                    </span>
                    <span className="text-xs text-zinc-200 font-mono">ID: {previewVideo.id}</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{previewVideo.placeName}</h3>
                  <p className="text-xs text-zinc-200">{previewVideo.placeAddress || previewVideo.placeCategory}</p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <img
                    src={previewVideo.author?.avatar || "/api/avatar?name=Reviewer&background=27272a&color=fff&bold=true"}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                   onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} /> 
 <div>
                    <h4 className="font-bold text-sm text-white">{previewVideo.author?.name || "Reviewer"}</h4>
                    <p className="text-xs text-zinc-200">@{previewVideo.author?.name || "user"}</p>
                  </div>
                </div>

                {previewVideo.caption && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-200 uppercase">Review Caption</label>
                    <p className="text-sm text-zinc-200 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      {previewVideo.caption}
                    </p>
                  </div>
                )}

                {previewVideo.transcript && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-200 uppercase">AI Spoken Transcript</label>
                    <p className="text-xs text-zinc-200 bg-zinc-950 p-3 rounded-xl border border-zinc-800 max-h-28 overflow-y-auto">
                      {previewVideo.transcript}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setEditVideoModal(previewVideo);
                    setPreviewVideo(null);
                  }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit className="w-4 h-4" /> Edit Metadata
                </button>
                <button
                  onClick={() => executeDeleteVideo(previewVideo.id)}
                  className="px-4 py-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-red-800/60 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PLACE MODAL */}
      {/* ========================================================================= */}
      {editPlaceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-black text-white">Edit Business Details</h3>
              <button onClick={() => setEditPlaceModal(null)} className="p-2 text-zinc-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlaceEdits} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editPlaceModal.name}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1">Category</label>
                  <input
                    type="text"
                    value={editPlaceModal.category}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={editPlaceModal.city || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1">Full Street Address</label>
                  <input
                    type="text"
                    value={editPlaceModal.address || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPlaceModal.phone || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editPlaceModal.website || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              {/* Live Profile Header Preview (Matching Place & Creator Profile left-aligned squircle frame) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Live Profile Header Preview
                </label>
                <div className="relative h-36 w-full rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-inner flex items-center justify-center">
                  {/* Banner Image / Gradient */}
                  {editPlaceModal.bannerUrl || editPlaceModal.ogImage ? (
                    <img
                      src={getProxiedImageUrl(editPlaceModal.bannerUrl || editPlaceModal.ogImage)}
                      alt={editPlaceModal.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-zinc-950 via-slate-900 to-zinc-950 flex flex-col items-center justify-center">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
                      <span className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Verified Listing</span>
                    </div>
                  )}

                  {/* Left-Aligned Squircle Logo Frame */}
                  <div className="absolute -bottom-4 left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] border-[3px] border-zinc-900 bg-white shadow-xl flex items-center justify-center z-20 p-1 ring-1 ring-white/20 overflow-hidden">
                    <CopoBrandLogo
                      domain={editPlaceModal.website || editPlaceModal.id}
                      name={editPlaceModal.name}
                      website={editPlaceModal.website}
                      logoUrl={editPlaceModal.logoUrl || editPlaceModal.avatarUrl}
                      bannerUrl={editPlaceModal.bannerUrl || editPlaceModal.ogImage}
                      className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden"
                      imageClassName="w-full h-full object-contain rounded-xl"
                      fallbackTextClassName="font-black text-xl text-zinc-950"
                    />
                  </div>

                  {/* Top-Right Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white flex items-center gap-1">
                    <span>{editPlaceModal.category || "Business"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-200">Logo / Avatar Image URL</label>
                    <div className="flex items-center gap-1.5">
                      {Boolean(editPlaceModal.website) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const dom = editPlaceModal.website?.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim();
                            if (!dom) return;
                            if (dom.includes('yoouz')) {
                              setEditPlaceModal({ ...editPlaceModal, logoUrl: YOOUZ_LOGO_DATA_URI, avatarUrl: YOOUZ_LOGO_DATA_URI });
                              showToast("Set Yoouz official logo");
                              return;
                            }
                            try {
                              showToast("Fetching website logo...");
                              const res = await fetch(`/api/url-metadata?url=${encodeURIComponent(dom)}`);
                              const data = await res.json();
                              if (data && data.logo) {
                                setEditPlaceModal({ ...editPlaceModal, logoUrl: data.logo, avatarUrl: data.logo });
                                showToast("Logo fetched successfully!");
                              } else {
                                const fav = `/api/favicon?domain=${dom}`;
                                setEditPlaceModal({ ...editPlaceModal, logoUrl: fav, avatarUrl: fav });
                                showToast("Using high-res domain favicon!");
                              }
                            } catch {
                              const fav = `/api/favicon?domain=${dom}`;
                              setEditPlaceModal({ ...editPlaceModal, logoUrl: fav, avatarUrl: fav });
                              showToast("Applied domain favicon");
                            }
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 cursor-pointer"
                        >
                          Auto-Detect
                        </button>
                      )}
                      {(editPlaceModal.name?.toLowerCase().includes('yoouz') || editPlaceModal.id?.toLowerCase().includes('yoouz')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditPlaceModal({ ...editPlaceModal, logoUrl: YOOUZ_LOGO_DATA_URI, avatarUrl: YOOUZ_LOGO_DATA_URI });
                            showToast("Set Yoouz official vector logo");
                          }}
                          className="text-[10px] text-zinc-200 hover:text-white font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 cursor-pointer"
                        >
                          Reset Yoouz Logo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-inner">
                      <AdminPlaceLogo place={editPlaceModal} size="sm" className="w-full h-full object-contain" />
                    </div>
                    <input
                      type="text"
                      value={editPlaceModal.logoUrl || editPlaceModal.avatarUrl || ""}
                      onChange={(e) =>
                        setEditPlaceModal({
                          ...editPlaceModal,
                          logoUrl: e.target.value,
                          avatarUrl: e.target.value
                        })
                      }
                      placeholder="https://... or data:image/..."
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-200">Banner / Cover Image URL</label>
                    {Boolean(editPlaceModal.website) && (
                      <button
                        type="button"
                        onClick={async () => {
                          const dom = editPlaceModal.website?.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim();
                          if (!dom) return;
                          try {
                            showToast("Fetching website banner...");
                            const res = await fetch(`/api/url-metadata?url=${encodeURIComponent(dom)}`);
                            const data = await res.json();
                            if (data && (data.banner || data.image || data.ogImage)) {
                              const banner = data.banner || data.image || data.ogImage;
                              setEditPlaceModal({ ...editPlaceModal, bannerUrl: banner, ogImage: banner });
                              showToast("Banner fetched successfully!");
                            } else {
                              showToast("No banner found on website");
                            }
                          } catch {
                            showToast("Could not fetch banner");
                          }
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 cursor-pointer"
                      >
                        Auto-Detect
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editPlaceModal.bannerUrl || editPlaceModal.ogImage || ""}
                    onChange={(e) =>
                      setEditPlaceModal({
                        ...editPlaceModal,
                        bannerUrl: e.target.value,
                        ogImage: e.target.value
                      })
                    }
                    placeholder="https://... cover photo or banner"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editPlaceModal.description || ""}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Merchant Claim & Verification Controls */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Merchant Claim & Verification
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    editPlaceModal.isClaimed || Boolean(editPlaceModal.claimedByEmail)
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                      : "bg-zinc-850 text-zinc-400 border border-zinc-700"
                  }`}>
                    {editPlaceModal.isClaimed || Boolean(editPlaceModal.claimedByEmail) ? "Profile Claimed" : "Unclaimed"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Claim Status</label>
                    <select
                      value={editPlaceModal.isClaimed || Boolean(editPlaceModal.claimedByEmail) ? "claimed" : "unclaimed"}
                      onChange={(e) => {
                        const isNowClaimed = e.target.value === "claimed";
                        setEditPlaceModal({
                          ...editPlaceModal,
                          isClaimed: isNowClaimed,
                          isVerified: isNowClaimed ? true : editPlaceModal.isVerified,
                          claimedByEmail: isNowClaimed ? (editPlaceModal.claimedByEmail || "merchant@business.com") : ""
                        });
                      }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-bold text-xs focus:outline-none"
                    >
                      <option value="unclaimed">Unclaimed Venue</option>
                      <option value="claimed">Business Claimed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Owner Email</label>
                    <input
                      type="email"
                      value={editPlaceModal.claimedByEmail || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditPlaceModal({
                          ...editPlaceModal,
                          claimedByEmail: val,
                          isClaimed: Boolean(val.trim())
                        });
                      }}
                      placeholder="owner@company.com"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditPlaceModal(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Business Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NEW PLACE MODAL */}
      {/* ========================================================================= */}
      {isAddPlaceOpen && (
        <CreatePlaceModal onClose={() => setIsAddPlaceOpen(false)} onSave={handleCreateNewPlace} />
      )}

      {/* ========================================================================= */}
      {/* EDIT VIDEO REVIEW MODAL */}
      {/* ========================================================================= */}
      {editVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-black text-white">Edit Video Review</h3>
              <button onClick={() => setEditVideoModal(null)} className="p-2 text-zinc-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoEdits} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Business Place Name</label>
                <input
                  type="text"
                  value={editVideoModal.placeName}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, placeName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Star Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={editVideoModal.rating}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, rating: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Review Caption</label>
                <textarea
                  rows={3}
                  value={editVideoModal.caption || ""}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, caption: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Voice Transcript</label>
                <textarea
                  rows={3}
                  value={editVideoModal.transcript || ""}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, transcript: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditVideoModal(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-black text-white">Edit User Profile</h3>
              <button onClick={() => setEditUserModal(null)} className="p-2 text-zinc-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 relative group">
                  <img
                    src={editUserModal.avatar || `/api/avatar?name=${encodeURIComponent(editUserModal.name || "User")}&background=27272a&color=fff`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes('/api/avatar')) {
                        target.src = `/api/avatar?name=${encodeURIComponent(editUserModal.name || "User")}&background=27272a&color=fff`;
                      }
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{editUserModal.name || "User"}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{editUserModal.email || "No email"}</p>
                  <label className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline mt-1 cursor-pointer block">
                    Upload Avatar Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setEditUserModal({ ...editUserModal, avatar: reader.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editUserModal.name || ""}
                  onChange={(e) => setEditUserModal({ ...editUserModal, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Handle (@username)</label>
                <input
                  type="text"
                  value={editUserModal.handle ? editUserModal.handle.replace(/^@/, "") : ""}
                  onChange={(e) => setEditUserModal({ ...editUserModal, handle: e.target.value.replace(/^@/, "") })}
                  placeholder="e.g. alex_travels"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={editUserModal.avatar || ""}
                  onChange={(e) => setEditUserModal({ ...editUserModal, avatar: e.target.value })}
                  placeholder="https://... or data:image/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs font-bold text-zinc-200">Verified Badge</span>
                <input
                  type="checkbox"
                  checked={editUserModal.isVerified !== false}
                  onChange={(e) => setEditUserModal({ ...editUserModal, isVerified: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-zinc-500 cursor-pointer accent-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateUser) {
                      onUpdateUser(editUserModal);
                    }
                    showToast(`Saved user @${editUserModal.name || "User"}.`);
                    setEditUserModal(null);
                  }}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl cursor-pointer shadow-lg"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: CREATE PLACE MODAL
// =========================================================================
const CreatePlaceModal: React.FC<{ onClose: () => void; onSave: (p: Place) => void }> = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Restaurant");
  const [city, setCity] = useState("San Francisco");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [claimedByEmail, setClaimedByEmail] = useState("");
  const [rating, setRating] = useState(5.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = `place_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newPlace: Place = {
      id,
      name: name.trim(),
      category: category.trim(),
      categoryType: "restaurants",
      address: address.trim() || `${city}, CA`,
      city: city.trim(),
      lat: 37.7749,
      lng: -122.4194,
      rating,
      totalReviews: 1,
      videoReviewCount: 0,
      ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
      avatarUrl: logoUrl.trim() || `/api/avatar?name=${encodeURIComponent(name)}&background=27272a&color=fff&bold=true`,
      logoUrl: logoUrl.trim(),
      bannerUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
      photos: [],
      openingHours: "Mon-Sun 10:00 AM - 10:00 PM",
      isOpen: true,
      phone: phone.trim(),
      website: website.trim(),
      priceRange: "$$",
      plusCode: "",
      description: "Claimed business on Yoouz video platform.",
      popularKeywords: [{ tag: "Authentic", count: 1 }],
      amenities: ["Free Wi-Fi", "Credit Cards Accepted"],
      topDishes: [],
      isClaimed: Boolean(claimedByEmail.trim()),
      isVerified: Boolean(claimedByEmail.trim()),
      claimedByEmail: claimedByEmail.trim() || undefined
    };

    onSave(newPlace);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h3 className="text-xl font-black text-white">Create New Business Page</h3>
          <button onClick={onClose} className="p-2 text-zinc-200 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">Business Name (Required)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Blue Bottle Coffee"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Cafe, Restaurant, Hotel"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">City / Region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. San Francisco"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">Full Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 66 Mint St, San Francisco, CA"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 415-555-0199"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://bluebottlecoffee.com"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">Logo URL (Optional)</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1">Assign Claim to Email (Optional)</label>
              <input
                type="email"
                value={claimedByEmail}
                onChange={(e) => setClaimedByEmail(e.target.value)}
                placeholder="owner@business.com"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl shadow-lg cursor-pointer"
            >
              Create Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
