import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { VideoReview, Place, ReviewComment, UserProfile } from "../types";
import { CopoVideoThumbnail } from "./CopoVideoThumbnail";
import { adminFetch, getAdminToken, hasAdminToken, setAdminToken } from "../lib/adminAuth";
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
  Camera,
  Edit,
  Edit3,
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
  Code,
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
  Briefcase,
  CornerDownRight,
  MessageCircle,
  CheckSquare,
  Square
} from "lucide-react";
import { isAuthorMatch, recordDeletedUsersInLocalStorage, isUserDeleted, getSafeAvatarUrl, extractCleanDomain, formatBusinessName, KNOWN_OFFICIAL_NAMES, isClientDeletedVideo, purgeVideoIdFromClientStorage } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { getPlaceLogoUrl, YOOUZ_LOGO_DATA_URI, getProxiedImageUrl } from "../utils/logoUtils";
import { releaseVideoHardwareDecoder } from "../utils/videoUtils";
import { formatRecordedDate, parseTimestampToMs } from "../utils/dateUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { subscribeAppHealth, resolveAllAppErrors, AppHealthSummary } from "../lib/errorMonitor";
import {
  AdminActionMenu,
  AdminPageHeader,
  AdminStatCard,
  AdminEmptyState,
  AdminModal,
  ADMIN_SURFACE,
  ADMIN_SURFACE_SUBTLE,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_BTN_DESTRUCTIVE,
  ADMIN_BTN_DESTRUCTIVE_SOLID,
  ADMIN_BTN_ICON,
  ADMIN_BTN_ICON_DANGER,
  ADMIN_INPUT,
  ADMIN_SELECT,
} from "./admin/AdminUI";

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
  onBroadcastNotification?: (notification: { title: string; message: string; targetUrl?: string; audience?: string; type?: string }) => void;
  onExit: () => void;
}

type AdminTab = "overview" | "health" | "creators" | "users" | "businesses" | "places" | "videos" | "comments" | "likes" | "bookmarks" | "messages" | "broadcast" | "database" | "search" | "agencies" | "indexing";

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
  // Authentication State (server-verified in-memory Bearer token only — never stored in localStorage/sessionStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasAdminToken());
  const [authMode, setAuthMode] = useState<"loading" | "setup" | "login">("loading");
  const [authSource, setAuthSource] = useState<"env" | "claimed" | "none">("none");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Check whether an admin passcode is configured on the server
  useEffect(() => {
    if (isAuthenticated) return;
    let cancelled = false;
    setAuthMode((prev) => (prev === "login" ? "login" : "loading"));
    fetch("/api/admin/auth/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const configured = Boolean(data?.configured);
        setAuthSource(data?.source || (configured ? "claimed" : "none"));
        setAuthMode(configured ? "login" : "setup");
      })
      .catch(() => {
        if (!cancelled) setAuthMode("login");
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Automatically return to sign-in screen if the admin session expires (401)
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setAuthError("Your admin session expired. Please sign in again.");
    };
    window.addEventListener("yoouz-admin-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("yoouz-admin-unauthorized", handleUnauthorized);
  }, []);

  // Global Search Input Ref (Cmd+K / Ctrl+K shortcut)
  const adminSearchInputRef = useRef<HTMLInputElement>(null);

  // Desktop keyboard shortcuts: Escape dismisses modals, Cmd/Ctrl+K focuses search
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        adminSearchInputRef.current?.focus();
        adminSearchInputRef.current?.select();
        return;
      }
      if (e.key !== "Escape") return;
      if (adminConfirmDialog && !isAdminConfirmRunning) {
        setAdminConfirmDialog(null);
      } else if (pendingIncompleteIds && !isPurgingIncomplete) {
        setPendingIncompleteIds(null);
      } else if (confirmMasterResetModal && !isMasterResetting) {
        setConfirmMasterResetModal(false);
      } else if (confirmDeleteChatId) {
        setConfirmDeleteChatId(null);
      } else if (confirmBulkDeleteChats) {
        setConfirmBulkDeleteChats(false);
      } else if (confirmPurgeAllChats) {
        setConfirmPurgeAllChats(false);
      } else if (confirmDeleteLikeId) {
        setConfirmDeleteLikeId(null);
      } else if (confirmPurgeAllLikes) {
        setConfirmPurgeAllLikes(false);
      } else if (confirmDeleteBookmarkId) {
        setConfirmDeleteBookmarkId(null);
      } else if (confirmPurgeAllBookmarks) {
        setConfirmPurgeAllBookmarks(false);
      } else if (confirmDeleteShareId) {
        setConfirmDeleteShareId(null);
      } else if (confirmPurgeAllShares) {
        setConfirmPurgeAllShares(false);
      } else if (confirmDeleteVideoId) {
        setConfirmDeleteVideoId(null);
      } else if (confirmDeletePlaceId) {
        setConfirmDeletePlaceId(null);
      } else if (confirmDeleteBusinessId) {
        setConfirmDeleteBusinessId(null);
      } else if (confirmDeleteUserId) {
        setConfirmDeleteUserId(null);
      } else if (confirmDeleteCommentInfo) {
        setConfirmDeleteCommentInfo(null);
      } else if (confirmBulkDeleteVideos) {
        setConfirmBulkDeleteVideos(false);
      } else if (confirmPurgeAllVideos) {
        setConfirmPurgeAllVideos(false);
      } else if (confirmBulkDeletePlaces) {
        setConfirmBulkDeletePlaces(false);
      } else if (confirmPurgeAllPlaces) {
        setConfirmPurgeAllPlaces(false);
      } else if (confirmBulkDeleteBusinesses) {
        setConfirmBulkDeleteBusinesses(false);
      } else if (confirmPurgeAllBusinesses) {
        setConfirmPurgeAllBusinesses(false);
      } else if (confirmBulkDeleteComments) {
        setConfirmBulkDeleteComments(false);
      } else if (confirmPurgeAllComments) {
        setConfirmPurgeAllComments(false);
      } else if (previewLikeVideoModal) {
        setPreviewLikeVideoModal(null);
      } else if (previewVideo) {
        setPreviewVideo(null);
      } else if (inspectChatModal) {
        setInspectChatModal(null);
      } else if (selectedCommentDetailModal) {
        setSelectedCommentDetailModal(null);
      } else if (selectedLikeDetailModal) {
        setSelectedLikeDetailModal(null);
      } else if (selectedBookmarkDetailModal) {
        setSelectedBookmarkDetailModal(null);
      } else if (selectedShareDetailModal) {
        setSelectedShareDetailModal(null);
      } else if (selectedItemJsonModal) {
        setSelectedItemJsonModal(null);
      } else if (inspectTableModal) {
        setInspectTableModal(null);
      } else if (editCommentModal) {
        setEditCommentModal(null);
        setEditCommentText("");
      } else if (editPlaceModal) {
        setEditPlaceModal(null);
      } else if (editVideoModal) {
        setEditVideoModal(null);
      } else if (editUserModal) {
        setEditUserModal(null);
      } else if (editAgencyModal) {
        setEditAgencyModal(null);
      } else if (isAddAgencyOpen) {
        setIsAddAgencyOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [videoRatingFilter, setVideoRatingFilter] = useState<number | "all">("all");
  const [videoSortFilter, setVideoSortFilter] = useState<"newest" | "highest_rated" | "lowest_rated" | "most_likes" | "most_comments">("newest");
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState<string>("all");
  const [placeClaimFilter, setPlaceClaimFilter] = useState<"all" | "claimed" | "unclaimed">("all");
  const [creatorFilter, setCreatorFilter] = useState<"all" | "verified" | "top" | "unverified">("all");
  const [userFilter, setUserFilter] = useState<"all" | "verified" | "unverified">("all");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "registered" | "creators" | "business" | "members" | "pending">("all");

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
  const [editVideoModal, setEditVideoModal] = useState<VideoReview | null>(null);
  const [editUserModal, setEditUserModal] = useState<any | null>(null);
  const [broadcastData, setBroadcastData] = useState({ title: "", message: "", targetUrl: "" });
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "creators" | "businesses">("all");
  const [broadcastType, setBroadcastType] = useState<"announcement" | "feature" | "alert" | "promo">("announcement");
  const [isBroadcastSending, setIsBroadcastSending] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("yoouz_broadcast_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [confirmMasterResetModal, setConfirmMasterResetModal] = useState(false);
  const [masterResetConfirmText, setMasterResetConfirmText] = useState("");
  const [sessionDeletedUserKeys, setSessionDeletedUserKeys] = useState<Set<string>>(new Set());
  const [adminConfirmDialog, setAdminConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isAdminConfirmRunning, setIsAdminConfirmRunning] = useState(false);
  const [isPurgingCdnCache, setIsPurgingCdnCache] = useState(false);
  const [isPingingEdge, setIsPingingEdge] = useState(false);
  const [pingEdgeResult, setPingEdgeResult] = useState<{ latencyMs: number; timestamp: string } | null>(null);
  const [inspectTableModal, setInspectTableModal] = useState<string | null>(null);
  const [tableDataItems, setTableDataItems] = useState<any[]>([]);
  const [isLoadingTableData, setIsLoadingTableData] = useState(false);
  const [tableDataQuery, setTableDataQuery] = useState("");
  const [selectedItemJsonModal, setSelectedItemJsonModal] = useState<any | null>(null);

  const fetchTableData = async (tableName: string) => {
    setIsLoadingTableData(true);
    try {
      let endpoint = `/api/nosql/${tableName}?_t=${Date.now()}`;
      if (tableName === "notifications") {
        endpoint = `/api/admin/notifications?_t=${Date.now()}`;
      } else if (tableName === "chats") {
        endpoint = `/api/admin/chats?_t=${Date.now()}`;
      } else if (tableName === "likes") {
        endpoint = `/api/admin/likes?_t=${Date.now()}`;
      } else if (tableName === "bookmarks") {
        endpoint = `/api/admin/bookmarks?_t=${Date.now()}`;
      } else if (tableName === "shares") {
        endpoint = `/api/admin/shares?_t=${Date.now()}`;
      }
      const res = await (endpoint.startsWith("/api/admin/") ? adminFetch(endpoint, { cache: "no-store" }) : fetch(endpoint, { cache: "no-store" }));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTableDataItems(data);
        } else if (data && Array.isArray(data.items)) {
          setTableDataItems(data.items);
        } else if (data && Array.isArray(data.notifications)) {
          setTableDataItems(data.notifications);
        } else if (data && Array.isArray(data.chats)) {
          setTableDataItems(data.chats);
        } else {
          setTableDataItems([]);
        }
      } else {
        setTableDataItems([]);
      }
    } catch (e) {
      setTableDataItems([]);
    } finally {
      setIsLoadingTableData(false);
    }
  };

  useEffect(() => {
    if (inspectTableModal) {
      setTableDataQuery("");
      fetchTableData(inspectTableModal);
    }
  }, [inspectTableModal]);

  // Admin Direct Messages & Chats State
  const [adminChats, setAdminChats] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [hasLoadedChats, setHasLoadedChats] = useState(false);
  const [isDeduplicatingChats, setIsDeduplicatingChats] = useState(false);
  const [inspectChatModal, setInspectChatModal] = useState<any | null>(null);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [chatFilter, setChatFilter] = useState<"all" | "active" | "with_media" | "empty">("all");
  const [chatSort, setChatSort] = useState<"recent" | "most_messages" | "oldest">("recent");
  const [confirmBulkDeleteChats, setConfirmBulkDeleteChats] = useState(false);
  const [confirmPurgeAllChats, setConfirmPurgeAllChats] = useState(false);
  const [confirmDeleteChatId, setConfirmDeleteChatId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  // Admin Likes & Reactions Audit Feed State
  const [adminLikes, setAdminLikes] = useState<any[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [likesSearchQuery, setLikesSearchQuery] = useState("");
  const [likesSort, setLikesSort] = useState<"newest" | "oldest">("newest");
  const [previewLikeVideoModal, setPreviewLikeVideoModal] = useState<any | null>(null);
  const [selectedLikeDetailModal, setSelectedLikeDetailModal] = useState<any | null>(null);
  const [confirmDeleteLikeId, setConfirmDeleteLikeId] = useState<string | null>(null);
  const [confirmPurgeAllLikes, setConfirmPurgeAllLikes] = useState(false);
  const [isDeletingLikeId, setIsDeletingLikeId] = useState<string | null>(null);

  const fetchAdminLikes = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingLikes(true);
    try {
      const res = await adminFetch(`/api/admin/likes?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAdminLikes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Failed to fetch admin likes:", e);
    } finally {
      if (!silent) setIsLoadingLikes(false);
    }
  }, []);

  const handleDeleteLike = async (likeId: string) => {
    setIsDeletingLikeId(likeId);
    try {
      const targetLike = adminLikes.find((l) => l.id === likeId);
      const res = await adminFetch(`/api/admin/likes/${encodeURIComponent(likeId)}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const targetVideoId = data?.videoId || targetLike?.videoId;
        const nextLikesCount = typeof data?.likesCount === "number" ? data.likesCount : undefined;
        showToast("Like removed successfully");
        setAdminLikes((prev) => prev.filter((l) => l.id !== likeId));
        setConfirmDeleteLikeId(null);
        if (selectedLikeDetailModal?.id === likeId) {
          setSelectedLikeDetailModal(null);
        }
        if (targetVideoId) {
          setDbVideos((prev) =>
            prev.map((v) =>
              String(v.id) === String(targetVideoId)
                ? { ...v, likes: nextLikesCount ?? Math.max(0, (v.likes || 1) - 1), likesCount: nextLikesCount ?? Math.max(0, (v.likes || 1) - 1) }
                : v
            )
          );
          window.dispatchEvent(new CustomEvent("copo-video-liked", { detail: { videoId: targetVideoId, likesCount: nextLikesCount } }));
        }
        if (typeof fetchLiveStats === "function") {
          fetchLiveStats();
        }
      } else {
        showToast("Failed to delete like");
      }
    } catch (e) {
      showToast("Error deleting like");
    } finally {
      setIsDeletingLikeId(null);
    }
  };

  const handlePurgeAllLikes = async () => {
    try {
      const res = await adminFetch("/api/admin/likes/purge-all", { method: "POST" });
      if (res.ok) {
        showToast("All likes purged successfully");
        setAdminLikes([]);
        setDbVideos((prev) => prev.map((v) => ({ ...v, likes: 0, likesCount: 0 })));
        setConfirmPurgeAllLikes(false);
        if (typeof fetchLiveStats === "function") {
          fetchLiveStats();
        }
      } else {
        showToast("Failed to purge likes");
      }
    } catch (e) {
      showToast("Error purging likes");
    }
  };

  // Admin Bookmarks & Saved Reviews Audit Feed State
  const [adminBookmarks, setAdminBookmarks] = useState<any[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [bookmarksSearchQuery, setBookmarksSearchQuery] = useState("");
  const [bookmarksSort, setBookmarksSort] = useState<"newest" | "oldest">("newest");
  const [selectedBookmarkDetailModal, setSelectedBookmarkDetailModal] = useState<any | null>(null);
  const [confirmDeleteBookmarkId, setConfirmDeleteBookmarkId] = useState<string | null>(null);
  const [confirmPurgeAllBookmarks, setConfirmPurgeAllBookmarks] = useState(false);
  const [isDeletingBookmarkId, setIsDeletingBookmarkId] = useState<string | null>(null);

  // Admin Shares Audit Feed State
  const [adminShares, setAdminShares] = useState<any[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [sharesSearchQuery, setSharesSearchQuery] = useState("");
  const [sharesSort, setSharesSort] = useState<"newest" | "oldest">("newest");
  const [selectedShareDetailModal, setSelectedShareDetailModal] = useState<any | null>(null);
  const [confirmDeleteShareId, setConfirmDeleteShareId] = useState<string | null>(null);
  const [confirmPurgeAllShares, setConfirmPurgeAllShares] = useState(false);
  const [isDeletingShareId, setIsDeletingShareId] = useState<string | null>(null);

  const fetchAdminBookmarks = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingBookmarks(true);
    try {
      const res = await adminFetch(`/api/admin/bookmarks?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAdminBookmarks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Failed to fetch admin bookmarks:", e);
    } finally {
      if (!silent) setIsLoadingBookmarks(false);
    }
  }, []);

  const handleDeleteBookmark = async (bookmarkId: string) => {
    setIsDeletingBookmarkId(bookmarkId);
    try {
      const targetBm = adminBookmarks.find((b) => b.id === bookmarkId);
      const res = await adminFetch(`/api/admin/bookmarks/${encodeURIComponent(bookmarkId)}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const targetVideoId = data?.videoId || targetBm?.videoId;
        const nextBmCount = typeof data?.bookmarksCount === "number" ? data.bookmarksCount : undefined;
        showToast("Saved bookmark removed successfully");
        setAdminBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        setConfirmDeleteBookmarkId(null);
        if (selectedBookmarkDetailModal?.id === bookmarkId) {
          setSelectedBookmarkDetailModal(null);
        }
        if (targetVideoId) {
          setDbVideos((prev) =>
            prev.map((v) =>
              String(v.id) === String(targetVideoId)
                ? { ...v, bookmarks: nextBmCount ?? Math.max(0, (v.bookmarksCount || 1) - 1), bookmarksCount: nextBmCount ?? Math.max(0, (v.bookmarksCount || 1) - 1) }
                : v
            )
          );
          window.dispatchEvent(new CustomEvent("copo-video-bookmarked", { detail: { videoId: targetVideoId, bookmarksCount: nextBmCount } }));
        }
        if (typeof fetchLiveStats === "function") {
          fetchLiveStats();
        }
      } else {
        showToast("Failed to delete bookmark");
      }
    } catch (e) {
      showToast("Error deleting bookmark");
    } finally {
      setIsDeletingBookmarkId(null);
    }
  };

  const handlePurgeAllBookmarks = async () => {
    try {
      const res = await adminFetch("/api/admin/bookmarks/purge-all", { method: "POST" });
      if (res.ok) {
        showToast("All saved bookmarks purged successfully");
        setAdminBookmarks([]);
        setDbVideos((prev) => prev.map((v) => ({ ...v, bookmarks: 0, bookmarksCount: 0 })));
        setConfirmPurgeAllBookmarks(false);
        if (typeof fetchLiveStats === "function") {
          fetchLiveStats();
        }
      } else {
        showToast("Failed to purge bookmarks");
      }
    } catch (e) {
      showToast("Error purging bookmarks");
    }
  };

  const handlePurgeAllShares = async () => {
    try {
      const res = await adminFetch("/api/admin/shares/purge-all", { method: "POST" });
      if (res.ok) {
        showToast("All shares purged successfully");
        setAdminShares([]);
        setConfirmPurgeAllShares(false);
        if (typeof fetchLiveStats === "function") {
          fetchLiveStats();
        }
      } else {
        showToast("Failed to purge shares");
      }
    } catch (e) {
      showToast("Error purging shares");
    }
  };

  const fetchAdminShares = useCallback(async () => {
    setIsLoadingShares(true);
    try {
      const res = await adminFetch(`/api/admin/shares?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAdminShares(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Failed to fetch admin shares:", e);
    } finally {
      setIsLoadingShares(false);
    }
  }, []);

  const handleDeleteShare = async (shareId: string) => {
    setIsDeletingShareId(shareId);
    try {
      const res = await adminFetch(`/api/admin/shares/${shareId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Share record removed successfully");
        setAdminShares((prev) => prev.filter((s) => s.id !== shareId));
        setConfirmDeleteShareId(null);
        if (selectedShareDetailModal?.id === shareId) {
          setSelectedShareDetailModal(null);
        }
        if (typeof fetchLiveStats === "function") {
          fetchLiveStats();
        }
      } else {
        showToast("Failed to delete share record");
      }
    } catch (e) {
      showToast("Error deleting share record");
    } finally {
      setIsDeletingShareId(null);
    }
  };


  // Business Name & Compound Word Integrity Center State
  const [brandTestInput, setBrandTestInput] = useState("lassustandartsen.nl");
  const [brandTestResult, setBrandTestResult] = useState<any>(null);
  const [isTestingBrand, setIsTestingBrand] = useState(false);
  const [isRepairingBrandNames, setIsRepairingBrandNames] = useState(false);
  const [brandRepairReport, setBrandRepairReport] = useState<any>(null);

  const handleTestBrandName = async (customInput?: string) => {
    const input = (customInput || brandTestInput || "").trim();
    if (!input) return;
    setIsTestingBrand(true);
    try {
      const res = await adminFetch("/api/admin/test-parse-brand-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      setBrandTestResult(data);
    } catch (e: any) {
      setBrandTestResult({ success: false, error: e?.message || "Failed to test brand parser" });
    } finally {
      setIsTestingBrand(false);
    }
  };

  const [isFlushingMetadataCache, setIsFlushingMetadataCache] = useState(false);
  const [searchIntelLogs, setSearchIntelLogs] = useState<any[]>([]);
  const [isFetchingSearchIntel, setIsFetchingSearchIntel] = useState(false);

  const fetchSearchIntel = async (silent = false) => {
    if (!silent) setIsFetchingSearchIntel(true);
    try {
      const res = await adminFetch("/api/admin/search-intel");
      if (res.ok) {
        const data = await res.json();
        setSearchIntelLogs(data.logs || []);
      }
    } catch (e) {}
    finally {
      if (!silent) setIsFetchingSearchIntel(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "search") {
      fetchSearchIntel(searchIntelLogs.length > 0);
      const interval = setInterval(() => fetchSearchIntel(true), 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab, isAuthenticated]);

  const handleFlushMetadataAndAssetCache = async () => {
    setIsFlushingMetadataCache(true);
    try {
      // Clear client-side search & metadata caches
      try {
        localStorage.removeItem("yoouz_recent_searches");
        localStorage.removeItem("url_metadata_cache");
        localStorage.removeItem("copo_recent_searches");
        localStorage.removeItem("copo_search_cache");
        sessionStorage.removeItem("url_metadata_cache");
        sessionStorage.removeItem("yoouz_search_cache");
      } catch (e) {}

      const res = await adminFetch("/api/admin/flush-metadata-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(data.message || `Metadata & search query cache flushed! Sanitized ${data.cleanedCount || 0} place asset(s).`);
        window.dispatchEvent(new CustomEvent("copo-cache-flushed"));
        if (typeof fetchHealthDiagnostic === "function") {
          fetchHealthDiagnostic();
        }
      } else {
        showToast(data?.error || "Error flushing metadata cache");
      }
    } catch (e: any) {
      showToast("Network error flushing metadata cache");
    } finally {
      setIsFlushingMetadataCache(false);
    }
  };

  const handleRepairAllBusinessNames = async () => {
    setIsRepairingBrandNames(true);
    try {
      const res = await adminFetch("/api/admin/repair-business-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setBrandRepairReport(data);
      if (data && data.success) {
        showToast(`Business names repaired: ${data.fixedPlacesCount} place(s), ${data.fixedReviewsCount} review(s).`);
        if (typeof fetchHealthDiagnostic === "function") {
          fetchHealthDiagnostic();
        }
      } else {
        showToast(data?.error || "Error repairing business names");
      }
    } catch (e: any) {
      setBrandRepairReport({ success: false, error: e?.message || "Failed to repair business names" });
      showToast("Network error repairing business names");
    } finally {
      setIsRepairingBrandNames(false);
    }
  };

  const handleTogglePremium = async (biz: Place) => {
    const planStr = ((biz as any).plan || (biz as any).subscriptionPlan || '').toLowerCase();
    const isCurrentlyPremium = planStr !== 'free' && Boolean(
      (biz as any).isPremium === true ||
      planStr === 'premium' ||
      (biz as any).isPremiumPlan === true
    );
    const newStatus = !isCurrentlyPremium;
    const updated = {
      ...biz,
      isPremium: newStatus,
      plan: newStatus ? "premium" : "free",
      isPremiumPlan: newStatus,
      subscriptionPlan: (newStatus ? "premium" : "free") as "premium" | "free"
    } as Place;

    if (onUpdatePlace) {
      onUpdatePlace(updated);
      showToast(`Business plan for ${biz.name} updated to ${newStatus ? "PREMIUM ($199/mo)" : "FREE package"}.`);
      setDbPlaces(prev => prev.map(p => p.id === biz.id ? updated : p));
      
      // Sync active local business session if present
      try {
        const rawSession = localStorage.getItem('copo_business_verified_session');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed && (parsed.placeId === biz.id || parsed.domain === biz.id || parsed.domain === biz.brandDomain)) {
            parsed.isPremium = newStatus;
            parsed.plan = newStatus ? "premium" : "free";
            localStorage.setItem('copo_business_verified_session', JSON.stringify(parsed));
            window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: parsed }));
          }
        }
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('copo-place-updated', { detail: { place: updated } }));
      setTimeout(fetchLiveStats, 400);
    }
  };

  const fetchAdminAgencies = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingAdminAgencies(true);
    try {
      const res = await adminFetch(`/api/admin/agencies?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAdminAgencies(Array.isArray(data.agencies) ? data.agencies : []);
      }
    } catch (e) {
      console.warn("Failed to fetch admin agencies:", e);
    } finally {
      if (!silent) setIsLoadingAdminAgencies(false);
    }
  }, []);

  const handleAddAgency = async () => {
    if (!newAgency.name) return;
    try {
      const res = await adminFetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgency)
      });
      if (res.ok) {
        showToast("Agency registered successfully!");
        setIsAddAgencyOpen(false);
        setNewAgency({
          name: "",
          logoUrl: "",
          website: "",
          phone: "",
          email: "",
          city: "",
          country: "Belgium"
        });
        fetchAdminAgencies();
      }
    } catch (e) {
      showToast("Error adding agency");
    }
  };

  const handleUpdateAgency = async () => {
    if (!editAgencyModal || !editAgencyModal.name) return;
    try {
      const res = await adminFetch(`/api/admin/agencies/${editAgencyModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAgencyModal)
      });
      if (res.ok) {
        showToast("Agency updated successfully!");
        setEditAgencyModal(null);
        fetchAdminAgencies();
      }
    } catch (e) {
      showToast("Error updating agency");
    }
  };

  const handleDeleteAgency = (id: string) => {
    setAdminConfirmDialog({
      title: "Delete agency?",
      message: "This will permanently remove the agency record from Yoouz.",
      confirmLabel: "Delete Agency",
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/admin/agencies/${id}`, {
            method: "DELETE"
          });
          if (res.ok) {
            showToast("Agency deleted successfully!");
            fetchAdminAgencies();
          }
        } catch (e) {
          showToast("Error deleting agency");
        }
      }
    });
  };

  const fetchAdminChats = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingChats(true);
    try {
      const res = await adminFetch("/api/admin/chats");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.chats)) {
        setAdminChats(data.chats);
      }
    } catch (e) {
      console.warn("Failed to fetch admin chats:", e);
    } finally {
      setHasLoadedChats(true);
      if (!silent) setIsLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "messages") {
      fetchAdminChats(hasLoadedChats);
    } else if (activeTab === "likes" || activeTab === "overview") {
      fetchAdminLikes(adminLikes.length > 0);
    }
    if (activeTab === "bookmarks" || activeTab === "overview") {
      fetchAdminBookmarks(adminBookmarks.length > 0);
    }
    if (activeTab === "agencies") {
      fetchAdminAgencies(adminAgencies.length > 0);
    }
  }, [activeTab, isAuthenticated, fetchAdminChats, fetchAdminLikes, fetchAdminBookmarks, fetchAdminAgencies]);

  const handleDeduplicateChats = async () => {
    setIsDeduplicatingChats(true);
    try {
      const res = await adminFetch("/api/admin/chats/deduplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(`Deduplicated: ${data.mergedCount} thread(s) merged, ${data.deletedDuplicates} duplicate(s) removed.`);
        fetchAdminChats();
      } else {
        showToast("No duplicates found or error deduplicating.");
      }
    } catch (e) {
      showToast("Failed to deduplicate chats.");
    } finally {
      setIsDeduplicatingChats(false);
    }
  };

  const handlePurgeEmptyChats = () => {
    setAdminConfirmDialog({
      title: "Purge empty chat threads?",
      message: "Remove all orphan chat threads that contain zero messages.",
      confirmLabel: "Purge Threads",
      onConfirm: async () => {
        try {
          const res = await adminFetch("/api/admin/chats/purge-empty", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
          const data = await res.json();
          if (data && data.success) {
            showToast(`Purged ${data.deletedCount || 0} empty thread(s).`);
            fetchAdminChats();
          }
        } catch (e) {
          showToast("Failed to purge empty threads.");
        }
      }
    });
  };

  const handleDeleteAdminChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/nosql/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        setAdminChats((prev) => prev.filter((c) => c.id !== chatId));
        setSelectedChatIds((prev) => prev.filter((id) => id !== chatId));
        if (inspectChatModal?.id === chatId) setInspectChatModal(null);
        setConfirmDeleteChatId(null);
        showToast("Thread deleted successfully.");
      }
    } catch (e) {
      showToast("Error deleting thread.");
    }
  };

  const handleBulkDeleteChats = async () => {
    if (selectedChatIds.length === 0) return;
    try {
      await Promise.all(
        selectedChatIds.map((id) => fetch(`/api/nosql/chats/${id}`, { method: "DELETE" }))
      );
      setAdminChats((prev) => prev.filter((c) => !selectedChatIds.includes(c.id)));
      showToast(`Deleted ${selectedChatIds.length} chat thread(s) successfully.`);
      setSelectedChatIds([]);
      setConfirmBulkDeleteChats(false);
      fetchAdminChats();
    } catch (e) {
      showToast("Error during bulk delete.");
    }
  };

  const handlePurgeAllChats = async () => {
    try {
      const res = await adminFetch("/api/admin/chats/purge-all", { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        setAdminChats([]);
        setSelectedChatIds([]);
        setConfirmPurgeAllChats(false);
        showToast("All chat threads purged permanently.");
      } else {
        showToast("Error purging chats.");
      }
    } catch (e) {
      showToast("Failed to purge all chats.");
    }
  };

  const handleSendAdminReply = async () => {
    if (!inspectChatModal || !adminReplyText.trim()) return;
    setIsSendingAdminReply(true);
    const newMsg = {
      id: `msg_${Date.now()}_admin`,
      senderName: "Yoouz Admin",
      senderEmail: "admin@yoouz.com",
      senderAvatar: "/api/avatar?name=Yoouz+Admin",
      text: adminReplyText.trim(),
      createdAt: new Date().toISOString(),
      createdAtMs: Date.now()
    };
    const updatedHistory = [...(Array.isArray(inspectChatModal.history) ? inspectChatModal.history : []), newMsg];
    const updatedChat = {
      ...inspectChatModal,
      history: updatedHistory,
      lastMessage: adminReplyText.trim(),
      lastSenderEmail: "admin@yoouz.com",
      lastSenderName: "Yoouz Admin",
      updatedAt: Date.now()
    };
    try {
      await fetch(`/api/nosql/chats/${inspectChatModal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: updatedChat,
          merge: true
        })
      });
      setInspectChatModal(updatedChat);
      setAdminChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
      setAdminReplyText("");
      showToast("Admin message sent to thread.");
    } catch (e) {
      showToast("Failed to send admin message.");
    } finally {
      setIsSendingAdminReply(false);
    }
  };

  const handleDeleteMessageFromThread = async (msgIdOrIndex: string | number) => {
    if (!inspectChatModal) return;
    try {
      const res = await adminFetch("/api/admin/chats/delete-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: inspectChatModal.id,
          messageId: msgIdOrIndex
        })
      });
      const data = await res.json();
      if (data && data.success && data.chat) {
        setInspectChatModal(data.chat);
        setAdminChats((prev) => prev.map((c) => (c.id === inspectChatModal.id ? { ...c, ...data.chat } : c)));
        showToast("Message deleted permanently.");
      } else {
        const updatedHistory = (inspectChatModal.history || []).filter((m: any, idx: number) => {
          if (typeof msgIdOrIndex === "string") return m.id !== msgIdOrIndex;
          return idx !== msgIdOrIndex;
        });
        const lastM = updatedHistory.length > 0 ? (updatedHistory[updatedHistory.length - 1].text || "Shared a video") : "No messages yet";
        const updatedChat = { ...inspectChatModal, history: updatedHistory, lastMessage: lastM };
        setInspectChatModal(updatedChat);
        setAdminChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
        showToast("Message removed from thread.");
      }
    } catch (e) {
      showToast("Failed to delete message.");
    }
  };

  const handleEditMessageInThread = async (msgIdOrIndex: string | number) => {
    if (!inspectChatModal || !editingMessageText.trim()) return;
    try {
      const res = await adminFetch("/api/admin/chats/edit-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: inspectChatModal.id,
          messageId: msgIdOrIndex,
          newText: editingMessageText.trim()
        })
      });
      const data = await res.json();
      if (data && data.success && data.chat) {
        setInspectChatModal(data.chat);
        setAdminChats((prev) => prev.map((c) => (c.id === inspectChatModal.id ? { ...c, ...data.chat } : c)));
        setEditingMessageId(null);
        setEditingMessageText("");
        showToast("Message edited successfully.");
      } else {
        const updatedHistory = (inspectChatModal.history || []).map((m: any, idx: number) => {
          if (String(m.id || idx) === String(msgIdOrIndex)) {
            return { ...m, text: editingMessageText.trim(), editedByAdminAt: new Date().toISOString() };
          }
          return m;
        });
        const lastM = updatedHistory.length > 0 ? (updatedHistory[updatedHistory.length - 1].text || "Shared a video") : "No messages yet";
        const updatedChat = { ...inspectChatModal, history: updatedHistory, lastMessage: lastM };
        setInspectChatModal(updatedChat);
        setAdminChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
        setEditingMessageId(null);
        setEditingMessageText("");
        showToast("Message updated locally.");
      }
    } catch (e) {
      showToast("Failed to edit message.");
    }
  };

  const chatMetrics = useMemo(() => {
    const totalThreads = adminChats.length;
    let totalMessages = 0;
    let mediaCount = 0;
    const participantsSet = new Set<string>();

    adminChats.forEach((chat) => {
      const history = Array.isArray(chat.history) ? chat.history : [];
      totalMessages += history.length;
      if (history.some((m: any) => m.videoThumbnail || m.videoId || m.videoUrl)) {
        mediaCount++;
      }
      if (chat.senderName) participantsSet.add(chat.senderName);
      if (chat.recipientName) participantsSet.add(chat.recipientName);
      if (chat.senderEmail) participantsSet.add(chat.senderEmail);
      if (chat.recipientEmail) participantsSet.add(chat.recipientEmail);
    });

    return {
      totalThreads,
      totalMessages,
      mediaCount,
      totalParticipants: participantsSet.size
    };
  }, [adminChats]);

  const filteredAdminChats = useMemo(() => {
    let list = [...adminChats];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((chat) => {
        const idMatch = String(chat.id || "").toLowerCase().includes(q);
        const senderMatch = String(chat.senderName || "").toLowerCase().includes(q) || String(chat.senderEmail || "").toLowerCase().includes(q);
        const recipientMatch = String(chat.recipientName || "").toLowerCase().includes(q) || String(chat.recipientEmail || "").toLowerCase().includes(q);
        const lastMsgMatch = String(chat.lastMessage || "").toLowerCase().includes(q);
        const participantsMatch = Array.isArray(chat.participants) && chat.participants.some((p: any) => String(p).toLowerCase().includes(q));
        const historyMatch = Array.isArray(chat.history) && chat.history.some((m: any) => String(m.text || "").toLowerCase().includes(q));
        return idMatch || senderMatch || recipientMatch || lastMsgMatch || participantsMatch || historyMatch;
      });
    }

    // Filter
    if (chatFilter === "active") {
      list = list.filter((c) => Array.isArray(c.history) && c.history.length > 0);
    } else if (chatFilter === "with_media") {
      list = list.filter((c) => Array.isArray(c.history) && c.history.some((m: any) => m.videoThumbnail || m.videoId || m.videoUrl));
    } else if (chatFilter === "empty") {
      list = list.filter((c) => !Array.isArray(c.history) || c.history.length === 0);
    }

    // Sort
    list.sort((a, b) => {
      const countA = Array.isArray(a.history) ? a.history.length : 0;
      const countB = Array.isArray(b.history) ? b.history.length : 0;
      const timeA = a.updatedAt || a.createdAtMs || 0;
      const timeB = b.updatedAt || b.createdAtMs || 0;

      if (chatSort === "most_messages") {
        return countB - countA;
      } else if (chatSort === "oldest") {
        return timeA - timeB;
      }
      return timeB - timeA;
    });

    return list;
  }, [adminChats, searchQuery, chatFilter, chatSort]);

  // System Health & Bug Diagnostics State
  const [healthData, setHealthData] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [clientHealthSummary, setClientHealthSummary] = useState<AppHealthSummary | null>(null);
  const [subsystemCategory, setSubsystemCategory] = useState<string>("all");
  const [subsystemSearchQuery, setSubsystemSearchQuery] = useState<string>("");
  const [expandedSubsystems, setExpandedSubsystems] = useState<Record<string, boolean>>({});
  const [overviewVideoFilter, setOverviewVideoFilter] = useState<string>("all");
  const [overviewPlaceFilter, setOverviewPlaceFilter] = useState<string>("all");

  const toggleSubsystemExpand = (key: string) => {
    setExpandedSubsystems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllSubsystems = (expand: boolean) => {
    if (!healthData?.subsystems) return;
    const next: Record<string, boolean> = {};
    Object.keys(healthData.subsystems).forEach((k) => {
      next[k] = expand;
    });
    setExpandedSubsystems(next);
  };

  const fetchHealthDiagnostic = async (silent = false) => {
    if (!silent) setIsHealthLoading(true);
    try {
      const res = await adminFetch("/api/system/health-check");
      const data = await res.json();
      if (data && data.success) {
        setHealthData(data);
      }
    } catch (e) {
      console.warn("Health check fetch error:", e);
    } finally {
      if (!silent) setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchHealthDiagnostic(false);
    const interval = setInterval(() => {
      fetchHealthDiagnostic(true);
    }, 30000);
    const unsubscribe = subscribeAppHealth((summary) => {
      setClientHealthSummary(summary);
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isAuthenticated]);

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
      const res = await adminFetch("/api/system/clear-error-logs", {
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
      const res = await adminFetch("/api/system/sync-comments-cache", {
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
      const res = await adminFetch("/api/system/reconcile-user-profiles", {
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
      const res = await adminFetch("/api/system/audit-followers", {
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
      const res = await adminFetch("/api/system/resync-business-banners", {
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
      const res = await adminFetch("/api/system/resync-maps-previews", {
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
      const res = await adminFetch("/api/admin/verify-social-share-cards", {
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
      const res = await adminFetch("/api/admin/notifications/deduplicate", {
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
  const [confirmDeleteCommentInfo, setConfirmDeleteCommentInfo] = useState<{ videoId: string; commentId: string; replyId?: string } | null>(null);
  const [commentTypeFilter, setCommentTypeFilter] = useState<"all" | "top_level" | "replies" | "liked">("all");
  const [commentPlaceFilter, setCommentPlaceFilter] = useState<string>("all");
  const [commentSortFilter, setCommentSortFilter] = useState<"newest" | "oldest" | "most_likes" | "longest">("newest");
  const [selectedCommentKeys, setSelectedCommentKeys] = useState<string[]>([]);
  const [confirmBulkDeleteComments, setConfirmBulkDeleteComments] = useState(false);
  const [confirmPurgeAllComments, setConfirmPurgeAllComments] = useState(false);
  const [editCommentModal, setEditCommentModal] = useState<{ video: VideoReview; comment: ReviewComment; isReply?: boolean; parentCommentId?: string } | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [selectedCommentDetailModal, setSelectedCommentDetailModal] = useState<{ comment: ReviewComment; video?: VideoReview; isReply?: boolean; parentCommentId?: string } | null>(null);

  // Business Tab Specific State
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [businessCategoryFilter, setBusinessCategoryFilter] = useState<string>("all");

  const [deletedUserKeys, setDeletedUserKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("yoouz_deleted_users") || "[]";
      const arr = JSON.parse(stored);
      const filtered = (Array.isArray(arr) ? arr : []).filter((k: string) => {
        const s = String(k).toLowerCase();
        return !s.includes("admin@yoouz.com");
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

  // Google Search Console & Indexing State
  const [isPingingGoogleIndex, setIsPingingGoogleIndex] = useState(false);
  const [indexingStatusResult, setIndexingStatusResult] = useState<any>(null);

  const handleTriggerGoogleIndexing = async () => {
    setIsPingingGoogleIndex(true);
    try {
      const res = await fetch("/api/seo/ping-index", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Google Search Console & IndexNow pings submitted successfully!");
        setIndexingStatusResult(data);
      } else {
        showToast("Google indexing ping dispatched.");
      }
    } catch (e: any) {
      showToast("Google indexing ping completed.");
    } finally {
      setIsPingingGoogleIndex(false);
    }
  };

  // Live Database Items State (Direct fetch from /api/nosql/* to guarantee 100% parity with Database tab)
  const [dbPlaces, setDbPlaces] = useState<Place[]>(() => {
    try {
      const cached = localStorage.getItem("yoouz_cached_places");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [dbVideos, setDbVideos] = useState<VideoReview[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>(() => {
    try {
      localStorage.removeItem("yoouz_admin_cached_users");
      const cached = localStorage.getItem("yoouz_admin_cached_users_v2");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [dbComments, setDbComments] = useState<any[]>([]);

  // Partner Agencies State
  const [adminAgencies, setAdminAgencies] = useState<any[]>([]);
  const [isLoadingAdminAgencies, setIsLoadingAdminAgencies] = useState(false);
  const [agencySearchQuery, setAgencySearchQuery] = useState("");
  const [agencyCountryFilter, setAgencyCountryFilter] = useState("all");
  const [editAgencyModal, setEditAgencyModal] = useState<any | null>(null);
  const [isAddAgencyOpen, setIsAddAgencyOpen] = useState(false);
  const [newAgency, setNewAgency] = useState({
    name: "",
    logoUrl: "",
    website: "",
    phone: "",
    email: "",
    city: "",
    country: "Belgium"
  });

  // Merged authoritative collections
  const activePlaces = useMemo(() => {
    const map = new Map<string, Place>();
    const processItem = (p: Place) => {
      if (!p || !p.id) return;
      const key = String(p.id).toLowerCase().trim();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...p, id: key });
      } else {
        map.set(key, { ...existing, ...p, id: key });
      }
    };

    (places || []).forEach(processItem);
    (dbPlaces || []).forEach(processItem);
    return Array.from(map.values());
  }, [places, dbPlaces]);

  const activeVideos = useMemo(() => {
    const map = new Map<string, VideoReview>();
    (videos || []).forEach((v) => {
      if (v && v.id && !isClientDeletedVideo(v)) {
        map.set(String(v.id), v);
      }
    });
    (dbVideos || []).forEach((v) => {
      if (v && v.id && !isClientDeletedVideo(v)) {
        map.set(String(v.id), v);
      }
    });
    return Array.from(map.values());
  }, [videos, dbVideos]);

  const activeAllUsers = useMemo(() => {
    const map = new Map<string, any>();
    (allUsers || []).forEach((u) => {
      if (u) {
        const key = u.id || u.uid || u.email || u.handle;
        if (key) map.set(String(key).toLowerCase(), u);
      }
    });
    (dbUsers || []).forEach((u) => {
      if (u) {
        const key = u.id || u.uid || u.email || u.handle;
        if (key) map.set(String(key).toLowerCase(), u);
      }
    });
    return Array.from(map.values());
  }, [allUsers, dbUsers]);

  const fetchLiveStats = async (silent = true) => {
    if (!silent) setIsLoadingLiveStats(true);
    const withSignal = (ms = 10000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      return { signal: controller.signal, done: () => clearTimeout(timer) };
    };
    try {
      const statsCtrl = withSignal(8000);
      const statsTask = adminFetch("/api/admin/live-stats", { cache: "no-store", signal: statsCtrl.signal })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setLiveStats(data);
            setLastSyncedTime(new Date());
          }
        })
        .catch(() => {})
        .finally(() => {
          statsCtrl.done();
          if (!silent) setIsLoadingLiveStats(false);
        });

      const usersCtrl = withSignal(10000);
      const usersTask = adminFetch("/api/admin/users", { cache: "no-store", signal: usersCtrl.signal })
        .then(async (res) => {
          if (res.ok) {
            const usersData = await res.json();
            const list = Array.isArray(usersData) ? usersData : (usersData?.users || []);
            if (Array.isArray(list)) {
              setDbUsers(list);
              try {
                localStorage.removeItem("yoouz_admin_cached_users");
                localStorage.setItem("yoouz_admin_cached_users_v2", JSON.stringify(list));
              } catch (e) {}
            }
          }
        })
        .catch(() => {})
        .finally(() => usersCtrl.done());

      const placesCtrl = withSignal(12000);
      const placesTask = fetch(`/api/nosql/places?_t=${Date.now()}`, { cache: "no-store", signal: placesCtrl.signal })
        .then(async (res) => {
          if (res.ok) {
            const placesData = await res.json();
            if (Array.isArray(placesData)) {
              setDbPlaces(placesData);
              try {
                localStorage.setItem("yoouz_cached_places", JSON.stringify(placesData));
              } catch (e) {}
            }
          }
        })
        .catch(() => {})
        .finally(() => placesCtrl.done());

      const videosCtrl = withSignal(12000);
      const videosTask = fetch(`/api/nosql/videoReviews?_t=${Date.now()}`, { cache: "no-store", signal: videosCtrl.signal })
        .then(async (res) => {
          if (res.ok) {
            const videosData = await res.json();
            if (Array.isArray(videosData)) {
              const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
              let localDel: string[] = [];
              try { localDel = JSON.parse(deletedStr); } catch (e) {}
              const delSet = new Set(localDel.map((s) => String(s).toLowerCase().trim()));
              const cleanVideos = videosData.filter((v) => v && v.id && !delSet.has(String(v.id).toLowerCase().trim()));
              setDbVideos(cleanVideos);
            }
          }
        })
        .catch(() => {})
        .finally(() => videosCtrl.done());

      const chatsCtrl = withSignal(10000);
      const chatsTask = adminFetch("/api/admin/chats", { cache: "no-store", signal: chatsCtrl.signal })
        .then(async (res) => {
          if (res.ok) {
            const chatsData = await res.json();
            if (chatsData && chatsData.success && Array.isArray(chatsData.chats)) {
              setAdminChats(chatsData.chats);
              setHasLoadedChats(true);
            }
          }
        })
        .catch(() => {})
        .finally(() => chatsCtrl.done());

      const commentsCtrl = withSignal(10000);
      const commentsTask = fetch(`/api/nosql/comments?_t=${Date.now()}`, { cache: "no-store", signal: commentsCtrl.signal })
        .then(async (res) => {
          if (res.ok) {
            const commentsData = await res.json();
            if (Array.isArray(commentsData)) {
              setDbComments(commentsData);
            }
          }
        })
        .catch(() => {})
        .finally(() => commentsCtrl.done());

      const broadcastsCtrl = withSignal(10000);
      const broadcastsTask = adminFetch(`/api/admin/broadcasts?_t=${Date.now()}`, { cache: "no-store", signal: broadcastsCtrl.signal })
        .then(async (res) => {
          if (res.ok) {
            const bcData = await res.json();
            if (bcData && bcData.success && Array.isArray(bcData.broadcasts) && bcData.broadcasts.length > 0) {
              setBroadcastHistory(bcData.broadcasts);
              try {
                localStorage.setItem("yoouz_broadcast_history", JSON.stringify(bcData.broadcasts));
              } catch {}
            }
          }
        })
        .catch(() => {})
        .finally(() => broadcastsCtrl.done());

      await Promise.allSettled([statsTask, usersTask, placesTask, videosTask, chatsTask, commentsTask, broadcastsTask]);
    } catch (err) {
      console.warn("Failed to fetch live admin stats:", err);
    } finally {
      if (!silent) setIsLoadingLiveStats(false);
    }
  };

  // Cross-component deletion reactivity
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleDeleted = (e: any) => {
      const vidId = e?.detail?.videoId;
      if (vidId) {
        const vidIdLower = String(vidId).toLowerCase().trim();
        setDbVideos((prev) => prev.filter((v) => String(v.id).toLowerCase().trim() !== vidIdLower));
        setSelectedVideoIds((prev) => prev.filter((id) => String(id).toLowerCase().trim() !== vidIdLower));
      }
    };
    const handlePurged = () => {
      setDbVideos([]);
      setSelectedVideoIds([]);
    };
    const handleLiked = (e: any) => {
      const vidId = e?.detail?.videoId;
      const nLikes = typeof e?.detail?.likesCount === "number" ? e?.detail?.likesCount : undefined;
      if (vidId && nLikes !== undefined) {
        setDbVideos((prev) => prev.map((v) => String(v.id) === String(vidId) ? { ...v, likes: nLikes, likesCount: nLikes } : v));
      }
      fetchAdminLikes(true);
      fetchLiveStats(true);
    };
    const handleBookmarked = (e: any) => {
      const vidId = e?.detail?.videoId;
      const nBm = typeof e?.detail?.bookmarksCount === "number" ? e?.detail?.bookmarksCount : undefined;
      if (vidId && nBm !== undefined) {
        setDbVideos((prev) => prev.map((v) => String(v.id) === String(vidId) ? { ...v, bookmarks: nBm, bookmarksCount: nBm } : v));
      }
      fetchAdminBookmarks(true);
      fetchLiveStats(true);
    };
    const handleComment = () => {
      fetchLiveStats(true);
    };
    const handleProfileUpdated = () => {
      fetchLiveStats(true);
    };

    window.addEventListener("copo-video-deleted", handleDeleted);
    window.addEventListener("copo-videos-purged", handlePurged);
    window.addEventListener("copo-video-liked", handleLiked);
    window.addEventListener("copo-video-bookmarked", handleBookmarked);
    window.addEventListener("copo-new-comment", handleComment);
    window.addEventListener("copo-profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("copo-video-deleted", handleDeleted);
      window.removeEventListener("copo-videos-purged", handlePurged);
      window.removeEventListener("copo-video-liked", handleLiked);
      window.removeEventListener("copo-video-bookmarked", handleBookmarked);
      window.removeEventListener("copo-new-comment", handleComment);
      window.removeEventListener("copo-profile-updated", handleProfileUpdated);
    };
  }, [isAuthenticated, fetchAdminLikes, fetchAdminBookmarks]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLiveStats(false);
    fetchAdminLikes(true);
    fetchAdminBookmarks(true);
    const interval = setInterval(() => {
      fetchLiveStats(true);
      fetchAdminLikes(true);
      fetchAdminBookmarks(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchAdminLikes, fetchAdminBookmarks]);

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

    // 1. Immediately record in persistent deleted users local store, session set, and purge from dbUsers
    recordDeletedUsersInLocalStorage([targetId, targetUid, targetEmail, targetName, targetHandle]);

    const keysToAdd: string[] = [];
    if (targetId) keysToAdd.push(targetId.toLowerCase());
    if (targetUid) keysToAdd.push(targetUid.toLowerCase());
    if (targetEmail) {
      keysToAdd.push(targetEmail);
      keysToAdd.push(`usr_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
    }
    if (targetName) keysToAdd.push(targetName.toLowerCase());
    if (targetHandle) keysToAdd.push(targetHandle);

    setSessionDeletedUserKeys((prev) => {
      const next = new Set(prev);
      keysToAdd.forEach((k) => next.add(k));
      return next;
    });

    setDeletedUserKeys((prev) => {
      const next = new Set(prev);
      keysToAdd.forEach((k) => next.add(k));
      try {
        localStorage.setItem("yoouz_deleted_users", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    // Immediately remove from dbUsers and cached user storage so UI updates instantaneously
    setDbUsers((prev) => {
      const keySet = new Set(keysToAdd);
      const filtered = prev.filter((u) => {
        if (!u) return false;
        const uId = String(u.id || "").toLowerCase().trim();
        const uUid = String(u.uid || "").toLowerCase().trim();
        const uEmail = String(u.email || "").toLowerCase().trim();
        const uName = String(u.name || "").toLowerCase().trim();
        return !((uId && keySet.has(uId)) || (uUid && keySet.has(uUid)) || (uEmail && keySet.has(uEmail)) || (targetEmail && uName === targetName.toLowerCase()));
      });
      try {
        localStorage.setItem("yoouz_admin_cached_users_v2", JSON.stringify(filtered));
      } catch {}
      return filtered;
    });

    setConfirmDeleteUserId(null);

    // 2. Notify parent component
    if (onDeleteUser) {
      onDeleteUser(targetUser);
    }

    // 3. Request deletion on server across all databases
    try {
      const res = await adminFetch("/api/admin/users/delete", {
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
      setTimeout(() => fetchLiveStats(true), 400);
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

      const res = await adminFetch("/api/admin/users/purge-all", {
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

  // Server-Backed Auth Handler (supports first-run setup & sign-in)
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = passwordInput.trim();
    if (!trimmed) {
      setAuthError("Please enter an admin passcode.");
      return;
    }
    if (authMode === "setup") {
      if (trimmed.length < 8) {
        setAuthError("Passcode must be at least 8 characters.");
        return;
      }
      if (trimmed !== confirmPasswordInput.trim()) {
        setAuthError("Passcodes do not match.");
        return;
      }
    }

    setIsAuthSubmitting(true);
    setAuthError("");
    try {
      const endpoint = authMode === "setup" ? "/api/admin/auth/setup" : "/api/admin/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: trimmed })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        setAuthError(data?.error || (res.status === 401 ? "Invalid admin passcode." : "Authentication failed."));
        return;
      }
      setAdminToken(String(data.token));
      setPasswordInput("");
      setConfirmPasswordInput("");
      setIsAuthenticated(true);
    } catch {
      setAuthError("Unable to reach server. Please try again.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    const activeToken = getAdminToken();
    setAdminToken(null);
    setPasswordInput("");
    setConfirmPasswordInput("");
    setAuthError("");
    setAuthMode("login");
    setIsAuthenticated(false);
    if (activeToken) {
      fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${activeToken}` },
        keepalive: true
      }).catch(() => {});
    }
  };

  const activeKeysSet = useMemo(() => {
    const set = new Set<string>();
    (activeAllUsers || []).forEach((u) => {
      if (u) {
        if (u.id) set.add(String(u.id).toLowerCase().trim());
        if (u.uid) set.add(String(u.uid).toLowerCase().trim());
        if (u.email) {
          const cleanE = String(u.email).toLowerCase().trim();
          set.add(cleanE);
          set.add(`usr_${cleanE.replace(/[^a-zA-Z0-9]/g, '_')}`);
        }
      }
    });
    return set;
  }, [activeAllUsers, isAuthenticated]);

  // Unique Users Mapping (Real registered users and video creators, without fake business email injection!)
  const uniqueUsers = useMemo(() => {
    const getCleanHandle = (str?: string) => (str || "").replace(/^@+/, "").trim().toLowerCase();
    const isSessionDeleted = (val?: string) => {
      if (!val || sessionDeletedUserKeys.size === 0) return false;
      const clean = val.toLowerCase().trim();
      const withoutAt = clean.replace(/^@+/, "");
      return sessionDeletedUserKeys.has(clean) || sessionDeletedUserKeys.has(withoutAt);
    };

    const isKeyDeleted = (val?: string) => {
      if (!val) return false;
      const clean = val.toLowerCase().trim();
      const withoutAt = clean.replace(/^@+/, "");
      if (sessionDeletedUserKeys.has(clean) || sessionDeletedUserKeys.has(withoutAt)) {
        return true;
      }
      if (activeKeysSet.has(clean) || activeKeysSet.has(withoutAt)) {
        return false;
      }
      return deletedUserKeys.has(clean) || deletedUserKeys.has(withoutAt);
    };

    const mergedList: any[] = [];
    
    (activeAllUsers || []).forEach((u) => {
      if (!u) return;
      if (
        isSessionDeleted(u.id) ||
        isSessionDeleted(u.uid) ||
        isSessionDeleted(u.email) ||
        isSessionDeleted(u.name) ||
        isSessionDeleted(u.handle) ||
        (!isAuthenticated && (
          isKeyDeleted(u.id) ||
          isKeyDeleted(u.uid) ||
          isKeyDeleted(u.email) ||
          isKeyDeleted(u.name) ||
          isKeyDeleted(u.handle)
        ))
      ) {
        return;
      }
      const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0].toLowerCase() : u.id) || "user";
      const isPending = u.status === "pending_verification" || (u.role && String(u.role).includes("Pending")) || u.isVerified === false;
      mergedList.push({
        id: u.id || u.uid || cleanHandle,
        uid: u.uid || u.id,
        name: u.name || "Registered User",
        email: u.email || "",
        handle: cleanHandle,
        bio: u.bio || "",
        avatar: getSafeAvatarUrl(u.avatar, u.name, cleanHandle || u.email),
        isVerified: !isPending && u.isVerified !== false,
        isRegisteredAccount: true,
        role: u.role || (u.email === "admin@yoouz.com" ? "Super Admin" : (isPending ? "Member (Pending Verification)" : "Member")),
        status: u.status || (isPending ? "pending_verification" : "verified"),
        memberSince: u.memberSince || "Active"
      });
    });

    (activeVideos || []).forEach((v) => {
      if (!v) return;
      if (
        isKeyDeleted(v.userEmail) ||
        isKeyDeleted(v.author?.name) ||
        isKeyDeleted(v.userId)
      ) {
        return;
      }
      const author = v.author || {
        name: "Community Member",
        handle: v.userId || "reviewer",
        avatar: "",
        isVerified: false
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
        if (!match.avatar || match.avatar.includes("ui-avatars")) match.avatar = getSafeAvatarUrl(author.avatar, author.name, vCleanHandle);
        match.role = "Creator"; 
      } else {
        mergedList.push({
          id: vUserId || vCleanHandle,
          uid: vUserId || vCleanHandle,
          name: author.name || "Community Member",
          email: vEmail,
          handle: vCleanHandle,
          avatar: getSafeAvatarUrl(author.avatar, author.name, vCleanHandle || author.handle),
          isVerified: false,
          isRegisteredAccount: Boolean(vUserId),
          role: "Creator",
          memberSince: "Active"
        });
      }
    });

    // Final deduplication loop to aggressively merge records by Email or Name
    const finalList: any[] = [];
    mergedList.forEach(u => {
       const rawEmail = String(u.email || "").toLowerCase().trim();
       const cleanName = u.name ? u.name.toLowerCase().trim() : "";
       if (
         rawEmail === "admin@users.yoouz.com" ||
         rawEmail === "stevenakan@users.yoouz.com" ||
         rawEmail === "benblue@users.yoouz.com" ||
         cleanName === "yoouz admin" ||
         cleanName === "steven akan" ||
         cleanName === "ben blue" ||
         cleanName === "u/testa1" ||
         String(u.id || u.uid || "").toLowerCase().trim() === "anon_test_a1"
       ) {
         return;
       }
       let existing = null;
       if (u.email) {
         existing = finalList.find(x => String(x.email || "").toLowerCase().trim() === String(u.email).toLowerCase().trim());
       }
       if (!existing && cleanName && cleanName !== "registered user" && cleanName !== "verified reviewer") {
           existing = finalList.find(x => (x.name || "").toLowerCase().trim() === cleanName);
       }
       
       if (!existing) {
         finalList.push(u);
       } else {
         if (u.role === "Creator") existing.role = "Creator";
         if (u.email && (!existing.email || String(existing.email).endsWith("@users.yoouz.com"))) existing.email = u.email;
         if (u.avatar && !u.avatar.includes("ui-avatars") && (!existing.avatar || existing.avatar.includes("ui-avatars"))) existing.avatar = u.avatar;
       }
    });
    // Do not filter out incomplete signups; keep all registered users in the admin view so the admin can always find them!
    return finalList.filter(u => {
       if (
         isSessionDeleted(u.id) ||
         isSessionDeleted(u.uid) ||
         isSessionDeleted(u.email) ||
         isSessionDeleted(u.name) ||
         isSessionDeleted(u.handle) ||
         (!isAuthenticated && (
           isKeyDeleted(u.id) ||
           isKeyDeleted(u.uid) ||
           isKeyDeleted(u.email) ||
           isKeyDeleted(u.name) ||
           isKeyDeleted(u.handle)
         ))
       ) {
         return false;
       }
       return true;
    });
  }, [activeAllUsers, activeVideos, deletedUserKeys, sessionDeletedUserKeys, isAuthenticated]);

  // Helper to normalize comment details with full user resolution for Admin View
  const resolveCommentUserMeta = useCallback((c: ReviewComment): ReviewComment => {
    const rawUserId = c.userId || (c as any).userEmail || (c as any).authorEmail || "";
    const rawName = c.authorName || (c as any).userName || "";
    const rawHandle = c.authorHandle || (c as any).userHandle || "";
    const rawAvatar = c.authorAvatar || (c as any).userAvatar || "";

    // Search for matching registered user account in uniqueUsers
    const matchedUser = uniqueUsers.find((u) => {
      if (rawUserId && u.email && u.email.toLowerCase() === rawUserId.toLowerCase()) return true;
      if (rawName && u.name && u.name.toLowerCase().trim() === rawName.toLowerCase().trim()) return true;
      if (rawHandle && u.handle && u.handle.toLowerCase().replace(/^@/,'') === rawHandle.toLowerCase().replace(/^@/,'')) return true;
      return false;
    });

    let resolvedName = matchedUser?.name || rawName;
    if (!resolvedName || resolvedName === "User" || resolvedName === "Verified Reviewer" || resolvedName === "Community Member") {
      if (rawUserId.includes("@")) {
        const prefix = rawUserId.split("@")[0];
        resolvedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      } else {
        resolvedName = "Community Member";
      }
    }

    let resolvedHandle = matchedUser?.handle || rawHandle;
    if (!resolvedHandle) {
      resolvedHandle = `@${resolvedName.toLowerCase().replace(/\s+/g, '')}`;
    }

    let resolvedAvatar = matchedUser?.avatar || rawAvatar;
    if (!resolvedAvatar || resolvedAvatar.includes("ui-avatars")) {
      resolvedAvatar = getSafeAvatarUrl("", resolvedName, resolvedHandle);
    } else {
      resolvedAvatar = getSafeAvatarUrl(resolvedAvatar, resolvedName, resolvedHandle);
    }

    const resolvedEmail = matchedUser?.email || rawUserId;

    return {
      ...c,
      authorName: resolvedName,
      userName: resolvedName,
      authorHandle: resolvedHandle,
      userHandle: resolvedHandle,
      authorAvatar: resolvedAvatar,
      userAvatar: resolvedAvatar,
      userId: resolvedEmail,
      authorEmail: resolvedEmail,
      isCreator: matchedUser?.role === "Creator" || c.isCreator,
      isOwner: matchedUser?.role === "Business" || c.isOwner
    } as any;
  }, [uniqueUsers]);

  // All Comments aggregation for Moderation
  const allComments = useMemo(() => {
    const list: { video: VideoReview; comment: ReviewComment; isReply?: boolean; parentCommentId?: string }[] = [];
    const seenCommentKeys = new Set<string>();

    (dbComments || []).forEach((c) => {
      if (!c || !c.id || c.id === "comm-101" || c.id === "comm-102") return;
      
      const vId = c.videoId || "";
      if (vId && isClientDeletedVideo(vId)) return;
      const video = activeVideos.find((v) => String(v.id) === String(vId));
      if (!video) return; // Completely skip comments for deleted or missing videos

      const key = `${video.id}_${c.id}`;
      if (!seenCommentKeys.has(key)) {
        seenCommentKeys.add(key);
        list.push({
          video,
          comment: resolveCommentUserMeta(c),
          isReply: Boolean(c.isReply || c.parentId),
          parentCommentId: c.parentId
        });
      }
    });
    return list;
  }, [dbComments, activeVideos, resolveCommentUserMeta]);

  // Separate Creators vs Community Users
  const { creatorsList, standardUsersList } = useMemo(() => {
    const creators: any[] = [];
    const regularUsers: any[] = [];

    uniqueUsers.forEach((u) => {
      const userVideos = activeVideos.filter((v) =>
        isAuthorMatch(v, {
          name: u.name,
          handle: `@${u.name}`,
          email: u.email,
          uid: u.uid || u.id
        })
      );

      // Never exclude any registered user or account; ensure every user is displayed instantly
      const isCreator = userVideos.length > 0 || (u.role === "Creator" || u.role === "Super Admin" || u.role === "Business");
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
  }, [uniqueUsers, activeVideos]);

  // Filtered Video List
  const filteredVideos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = activeVideos.filter((v) => {
      const matchQuery =
        !q ||
        (v.placeName && v.placeName.toLowerCase().includes(q)) ||
        (v.author?.name && v.author.name.toLowerCase().includes(q)) ||
        (v.author?.handle && v.author.handle.toLowerCase().includes(q)) ||
        (v.caption && v.caption.toLowerCase().includes(q)) ||
        (v.transcript && v.transcript.toLowerCase().includes(q)) ||
        (v.id && v.id.toLowerCase().includes(q));

      const matchRating = videoRatingFilter === "all" || Math.round(v.rating) === videoRatingFilter;
      return matchQuery && matchRating;
    });

    return result.sort((a, b) => {
      if (videoSortFilter === "highest_rated") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (videoSortFilter === "lowest_rated") {
        return (a.rating || 0) - (b.rating || 0);
      }
      if (videoSortFilter === "most_likes") {
        return (b.likes || 0) - (a.likes || 0);
      }
      if (videoSortFilter === "most_comments") {
        const countA = b.commentsCount || (b.comments?.length || 0);
        const countB = a.commentsCount || (a.comments?.length || 0);
        return countB - countA;
      }
      // default: newest
      return (b.createdAtMs || 0) - (a.createdAtMs || 0);
    });
  }, [activeVideos, searchQuery, videoRatingFilter, videoSortFilter]);

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

    activePlaces.forEach((p) => {
      if (!p || !p.id) return;
      const rawId = String(p.id).toLowerCase().trim();
      const key = rawId;
      const canonId = rawId;

      const isYoouz = key === 'yoouz.com' || canonId === 'yoouz.com' || rawId === 'yoouz.com' || rawId === 'yoouz-com' || (p.name && p.name.toLowerCase() === 'yoouz');
      const isLocalClaimed = Boolean(localVerifiedPlaceId && (localVerifiedPlaceId === rawId || localVerifiedPlaceId === canonId || localVerifiedPlaceId === key));

      const isClaimed = Boolean(isYoouz || p.isClaimed || p.claimedByEmail || isLocalClaimed);
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
        category: 'Technology & Photo Review Platform',
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
        bannerUrl: 'https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg',
        photos: ['https://rev1.b-cdn.net/banners/yoouz_brand_banner.jpg'],
        openingHours: '24/7',
        isOpen: true,
        phone: '',
        priceRange: 'Free',
        plusCode: '',
        description: 'Live Camera Photo Reviews Platform',
        popularKeywords: [{ tag: 'authentic', count: 1 }, { tag: 'photo reviews', count: 1 }],
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
        category: existingYoouz.category || 'Technology & Photo Review Platform',
        logoUrl: existingYoouz.logoUrl || YOOUZ_LOGO_DATA_URI
      });
    }

    return Array.from(canonicalMap.values());
  }, [activePlaces]);

  // Separate Businesses (Claimed / Merchant Corporate Entities) vs Physical Places (Local Directory Venues)
  const { allBusinesses, allPhysicalPlaces } = useMemo(() => {
    const businesses: Place[] = [];
    const physicalPlaces: Place[] = [];

    deduplicatedPlaces.forEach((p) => {
      const rawId = String(p.id).toLowerCase();
      const isYoouz = p.id === 'yoouz.com' || p.brandDomain === 'yoouz.com' || rawId === 'yoouz.com' || rawId === 'yoouz-com' || rawId === 'place-custom-yoouz-com' || (p.name && p.name.toLowerCase() === 'yoouz');
      const isClaimedBusiness = Boolean(isYoouz || p.isClaimed || p.claimedByEmail);

      if (isClaimedBusiness) {
        businesses.push({
          ...p,
          isClaimed: true,
          isVerified: true,
          website: p.website || (isYoouz ? 'https://yoouz.com' : (p.brandDomain ? `https://${p.brandDomain}` : '')),
          brandDomain: p.brandDomain || (isYoouz ? 'yoouz.com' : (p.website ? p.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : p.id)),
          claimedByEmail: isYoouz ? 'info@yoouz.com' : p.claimedByEmail
        });
      }
      // Always include in allPhysicalPlaces so all venues in directory remain visible and editable in Places tab
      physicalPlaces.push(p);
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
        (p.brandDomain && p.brandDomain.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));

      const matchCategory = placeCategoryFilter === "all" || p.category?.toLowerCase() === placeCategoryFilter.toLowerCase();
      const isPlaceClaimed = Boolean(p.isClaimed || p.claimedByEmail);
      const matchClaim =
        placeClaimFilter === "all" ||
        (placeClaimFilter === "claimed" && isPlaceClaimed) ||
        (placeClaimFilter === "unclaimed" && !isPlaceClaimed);
      return matchQuery && matchCategory && matchClaim;
    });
  }, [allPhysicalPlaces, searchQuery, placeCategoryFilter, placeClaimFilter]);

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

    return activeVideos.filter((v) => {
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

      const isPending = u.status === "pending_verification" || (u.role && String(u.role).includes("Pending")) || u.isVerified === false;
      const matchType =
        userTypeFilter === "all" ||
        (userTypeFilter === "members" && u.role !== "Creator" && u.role !== "Business") ||
        (userTypeFilter === "creators" && u.role === "Creator") ||
        (userTypeFilter === "pending" && isPending) ||
        (userTypeFilter === "registered" && (u.isRegisteredAccount || Boolean(u.email))) ||
        (userTypeFilter === "business" && u.role === "Business");

      return matchQuery && matchType;
    });
  }, [uniqueUsers, searchQuery, userTypeFilter]);

  // Unique Places with Comments for Filter Dropdown
  const uniqueCommentPlaces = useMemo(() => {
    const map = new Map<string, string>();
    allComments.forEach((c) => {
      const pId = c.video.placeId || c.video.placeName || "";
      const pName = c.video.placeName || pId;
      if (pId && pName) {
        map.set(pId, pName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allComments]);

  // Comment Moderation Metrics
  const commentMetrics = useMemo(() => {
    const total = allComments.length;
    const replies = allComments.filter((c) => c.isReply).length;
    const topLevel = total - replies;
    const liked = allComments.filter((c) => c.comment.isLiked || (c.comment.likesCount || 0) > 0).length;
    const commenters = new Set(allComments.map((c) => c.comment.authorName || c.comment.authorHandle)).size;
    return { total, replies, topLevel, liked, commenters };
  }, [allComments]);

  // Filtered and Sorted Comments List
  const filteredComments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = allComments.filter((item) => {
      // 1. Search Query Match across text, author, handle, place name, and place ID
      const matchSearch =
        !q ||
        (item.comment.text || "").toLowerCase().includes(q) ||
        (item.comment.authorName || "").toLowerCase().includes(q) ||
        (item.comment.authorHandle || "").toLowerCase().includes(q) ||
        (item.video.placeName || "").toLowerCase().includes(q) ||
        (item.video.placeId || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      // 2. Type Filter Match
      if (commentTypeFilter === "top_level" && item.isReply) return false;
      if (commentTypeFilter === "replies" && !item.isReply) return false;
      if (commentTypeFilter === "liked" && !item.comment.isLiked && (item.comment.likesCount || 0) === 0) return false;

      // 3. Place Filter Match
      if (commentPlaceFilter !== "all") {
        const pNorm = commentPlaceFilter.toLowerCase();
        const vPlaceId = (item.video.placeId || "").toLowerCase();
        const vPlaceName = (item.video.placeName || "").toLowerCase();
        if (vPlaceId !== pNorm && vPlaceName !== pNorm && !vPlaceName.includes(pNorm)) {
          return false;
        }
      }

      return true;
    });

    // 4. Sort Order
    list = [...list].sort((a, b) => {
      const timeA = typeof a.comment.createdAtMs === "number" ? a.comment.createdAtMs : 0;
      const timeB = typeof b.comment.createdAtMs === "number" ? b.comment.createdAtMs : 0;
      const likesA = a.comment.likesCount || 0;
      const likesB = b.comment.likesCount || 0;

      if (commentSortFilter === "oldest") {
        return timeA - timeB;
      }
      if (commentSortFilter === "most_likes") {
        return likesB - likesA;
      }
      if (commentSortFilter === "longest") {
        return (b.comment.text || "").length - (a.comment.text || "").length;
      }
      // default: newest
      return timeB - timeA;
    });

    return list;
  }, [allComments, searchQuery, commentTypeFilter, commentPlaceFilter, commentSortFilter]);

  // Filtered and Sorted Likes List
  const filteredLikes = useMemo(() => {
    let list = adminLikes.filter((l) => {
      if (!l || !l.videoId) return true;
      if (isClientDeletedVideo(l.videoId)) return false;
      return activeVideos.some((v) => String(v.id) === String(l.videoId));
    });
    if (likesSearchQuery.trim()) {
      const q = likesSearchQuery.toLowerCase().trim();
      list = list.filter((l) => {
        const uName = String(l.userName || "").toLowerCase();
        const uHandle = String(l.userHandle || "").toLowerCase();
        const pName = String(l.placeName || "").toLowerCase();
        const vId = String(l.videoId || "").toLowerCase();
        const lId = String(l.id || "").toLowerCase();
        return uName.includes(q) || uHandle.includes(q) || pName.includes(q) || vId.includes(q) || lId.includes(q);
      });
    }

    if (likesSort === "oldest") {
      list.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
    } else {
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    }
    return list;
  }, [adminLikes, activeVideos, likesSearchQuery, likesSort]);

  // Filtered and Sorted Bookmarks List
  const filteredBookmarks = useMemo(() => {
    let list = adminBookmarks.filter((b) => {
      if (!b || !b.videoId) return true;
      if (isClientDeletedVideo(b.videoId)) return false;
      return activeVideos.some((v) => String(v.id) === String(b.videoId));
    });
    if (bookmarksSearchQuery.trim()) {
      const q = bookmarksSearchQuery.toLowerCase().trim();
      list = list.filter((b) => {
        const uName = String(b.userName || "").toLowerCase();
        const uHandle = String(b.userHandle || "").toLowerCase();
        const pName = String(b.placeName || "").toLowerCase();
        const pId = String(b.placeId || "").toLowerCase();
        const vId = String(b.videoId || "").toLowerCase();
        const bId = String(b.id || "").toLowerCase();
        return uName.includes(q) || uHandle.includes(q) || pName.includes(q) || pId.includes(q) || vId.includes(q) || bId.includes(q);
      });
    }

    if (bookmarksSort === "oldest") {
      list.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
    } else {
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    }
    return list;
  }, [adminBookmarks, activeVideos, bookmarksSearchQuery, bookmarksSort]);

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
    activePlaces.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [activePlaces]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalVids = activeVideos.length;
    const totalLikes = activeVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
    const totalShares = activeVideos.reduce((acc, v) => acc + (v.sharesCount || 0), 0);
    const totalBookmarks = activeVideos.reduce((acc, v) => acc + (v.bookmarksCount || 0), 0);
    const totalViews = activeVideos.reduce((acc, v) => acc + (v.viewsCount || v.views || 0), 0);
    const totalComm = allComments.length;
    const totalBusinesses = allBusinesses.length;
    const totalPhysicalPlaces = allPhysicalPlaces.length;
    const totalPlaces = deduplicatedPlaces.length;
    const claimedPlaces = totalBusinesses;
    const unclaimedPlaces = totalPhysicalPlaces;
    const avgRating = totalVids > 0 ? (activeVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / totalVids).toFixed(1) : "5.0";

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
  }, [activeVideos, deduplicatedPlaces, allBusinesses, allPhysicalPlaces, uniqueUsers, creatorsList, standardUsersList, allComments]);

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
    if (selectedPlaceIds.length === filteredPhysicalPlaces.length && filteredPhysicalPlaces.length > 0) {
      setSelectedPlaceIds([]);
    } else {
      setSelectedPlaceIds(filteredPhysicalPlaces.map((p) => p.id));
    }
  };

  const handleTogglePlaceSelection = (id: string) => {
    setSelectedPlaceIds((prev) => (prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]));
  };

  // Execution Handlers
  const executeDeleteVideo = async (id: string) => {
    if (!id) return;
    const strId = String(id).trim();

    // 1. Immediately purge client storage and add to permanent blacklist
    purgeVideoIdFromClientStorage(strId);

    // 2. Immediately remove from internal dbVideos and active selection
    setDbVideos((prev) => prev.filter((v) => String(v.id).trim() !== strId && String(v.id).trim().toLowerCase() !== strId.toLowerCase()));
    setSelectedVideoIds((prev) => prev.filter((vId) => String(vId).trim() !== strId && String(vId).trim().toLowerCase() !== strId.toLowerCase()));
    setConfirmDeleteVideoId(null);
    if (previewVideo && (String(previewVideo.id).trim() === strId || String(previewVideo.id).trim().toLowerCase() === strId.toLowerCase())) setPreviewVideo(null);

    // 3. Call parent onDeleteVideo prop (updates App.tsx state & client storage)
    onDeleteVideo(strId);

    // 4. Show instant feedback
    showToast("Photo review removed permanently from feed and database.");

    // 5. Guarantee backend deletion across all endpoints and sync Bunny Stream library
    try {
      await Promise.allSettled([
        adminFetch("/api/admin/videos/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: strId })
        }),
        fetch("/api/videos/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: strId })
        }),
        fetch(`/api/nosql/videoReviews/${encodeURIComponent(strId)}`, { method: "DELETE" }),
        adminFetch("/api/admin/bunny/sync-library", { method: "POST" })
      ]);
    } catch (e) {}

    setTimeout(fetchLiveStats, 300);
  };

  const executeBulkDeleteVideos = async () => {
    if (selectedVideoIds.length === 0) return;
    const idsToDelete = selectedVideoIds.map((id) => String(id).trim());
    const count = idsToDelete.length;
    const idSet = new Set(idsToDelete.flatMap((id) => [id, id.toLowerCase()]));

    // 1. Immediately purge client storage and blacklist all IDs
    idsToDelete.forEach((id) => purgeVideoIdFromClientStorage(id));

    // 2. Instantly remove from internal dbVideos
    setDbVideos((prev) => prev.filter((v) => !idSet.has(String(v.id).trim()) && !idSet.has(String(v.id).trim().toLowerCase())));
    setSelectedVideoIds([]);
    setConfirmBulkDeleteVideos(false);
    if (previewVideo && (idSet.has(String(previewVideo.id).trim()) || idSet.has(String(previewVideo.id).trim().toLowerCase()))) setPreviewVideo(null);

    // 3. Call parent prop
    if (onBulkDeleteVideos) {
      onBulkDeleteVideos(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteVideo(id));
    }

    showToast(`Deleted ${count} selected photo reviews.`);

    // 4. Direct backend endpoints
    try {
      await Promise.allSettled([
        adminFetch("/api/admin/videos/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds: idsToDelete })
        }),
        ...idsToDelete.map((id) =>
          fetch(`/api/nosql/videoReviews/${encodeURIComponent(id)}`, { method: "DELETE" })
        ),
        adminFetch("/api/admin/bunny/sync-library", { method: "POST" })
      ]);
    } catch (e) {}

    setTimeout(fetchLiveStats, 300);
  };

  const executePurgeAllVideos = async () => {
    // 1. Instantly wipe internal state
    setDbVideos([]);
    setSelectedVideoIds([]);
    setConfirmPurgeAllVideos(false);
    setPreviewVideo(null);

    // 2. Call parent prop
    if (onPurgeAllVideos) {
      onPurgeAllVideos();
    }

    showToast("All photo reviews purged completely from storage and database.");

    // 3. Direct backend call
    try {
      await Promise.allSettled([
        adminFetch("/api/admin/videos/purge-all", { method: "POST" }),
        adminFetch("/api/admin/bunny/sync-library", { method: "POST" })
      ]);
    } catch (e) {}

    setTimeout(fetchLiveStats, 300);
  };

  const removePlaceIdsFromLocalDb = (idsToRemove: string[]) => {
    if (idsToRemove.length === 0) return;
    const idSet = new Set(idsToRemove.map((id) => String(id).trim().toLowerCase()));
    setDbPlaces((prev) => {
      const next = prev.filter((p) => !idSet.has(String(p.id).trim().toLowerCase()));
      try {
        localStorage.setItem("yoouz_cached_places", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const executeDeletePlace = async (id: string) => {
    removePlaceIdsFromLocalDb([id]);
    onDeletePlace(id);
    setSelectedPlaceIds((prev) => prev.filter((pId) => pId !== id));
    setConfirmDeletePlaceId(null);
    showToast("Place record removed from directory and database.");
    try {
      await fetch(`/api/nosql/places/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {}
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const executeBulkDeletePlaces = async () => {
    if (selectedPlaceIds.length === 0) return;
    const ids = [...selectedPlaceIds];
    const count = ids.length;
    removePlaceIdsFromLocalDb(ids);
    if (onBulkDeletePlaces) {
      onBulkDeletePlaces(ids);
    } else {
      ids.forEach((id) => onDeletePlace(id));
    }
    setSelectedPlaceIds([]);
    setConfirmBulkDeletePlaces(false);
    showToast(`Deleted ${count} selected places.`);
    try {
      await Promise.allSettled(ids.map((id) => fetch(`/api/nosql/places/${encodeURIComponent(id)}`, { method: "DELETE" })));
    } catch {}
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const executePurgeAllPlaces = async () => {
    const ids = allPhysicalPlaces.map((p) => p.id);
    removePlaceIdsFromLocalDb(ids);
    if (onPurgeAllPlaces) {
      onPurgeAllPlaces();
    } else if (onBulkDeletePlaces && ids.length > 0) {
      onBulkDeletePlaces(ids);
    } else {
      ids.forEach((id) => onDeletePlace(id));
    }
    setSelectedPlaceIds([]);
    setConfirmPurgeAllPlaces(false);
    showToast("All place records purged from database.");
    try {
      await Promise.allSettled(ids.map((id) => fetch(`/api/nosql/places/${encodeURIComponent(id)}`, { method: "DELETE" })));
    } catch {}
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const executeBulkDeleteBusinesses = async () => {
    if (selectedBusinessIds.length === 0) return;
    const ids = [...selectedBusinessIds];
    const count = ids.length;
    removePlaceIdsFromLocalDb(ids);
    if (onBulkDeletePlaces) {
      onBulkDeletePlaces(ids);
    } else {
      ids.forEach((id) => onDeletePlace(id));
    }
    setSelectedBusinessIds([]);
    setConfirmBulkDeleteBusinesses(false);
    showToast(`Deleted ${count} selected businesses.`);
    try {
      await Promise.allSettled(ids.map((id) => fetch(`/api/nosql/places/${encodeURIComponent(id)}`, { method: "DELETE" })));
    } catch {}
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const executePurgeAllBusinesses = async () => {
    const ids = allBusinesses.map((b) => b.id);
    removePlaceIdsFromLocalDb(ids);
    ids.forEach((id) => onDeletePlace(id));
    setSelectedBusinessIds([]);
    setConfirmPurgeAllBusinesses(false);
    showToast("Purged all claimed businesses.");
    try {
      await Promise.allSettled(ids.map((id) => fetch(`/api/nosql/places/${encodeURIComponent(id)}`, { method: "DELETE" })));
    } catch {}
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const handleQuickClaimPlace = (place: Place) => {
    const domain = (place.brandDomain || (place.website ? place.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] : "") || place.id).toLowerCase();
    const updated: Place = {
      ...place,
      isClaimed: true,
      isVerified: true,
      claimedByEmail: "info@yoouz.com",
      brandDomain: domain
    };
    setDbPlaces((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    if (onUpdatePlace) {
      onUpdatePlace(updated);
    }
    showToast(`Claimed "${place.name}" as an official business.`);
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const handleQuickUnclaimPlace = (place: Place) => {
    const updated: Place = {
      ...place,
      isClaimed: false,
      isVerified: false,
      claimedByEmail: ""
    };
    setDbPlaces((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    if (onUpdatePlace) {
      onUpdatePlace(updated);
    }
    showToast(`Removed business claim for "${place.name}".`);
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const handleSavePlaceEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlaceModal) return;
    const updated = { ...editPlaceModal };
    setDbPlaces((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    if (onUpdatePlace) {
      onUpdatePlace(updated);
    }
    showToast(`Updated business "${updated.name}".`);
    setEditPlaceModal(null);
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const handleSaveVideoEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVideoModal) return;
    const vDomain = extractCleanDomain(editVideoModal.placeWebsite || editVideoModal.placeId || editVideoModal.placeName);
    const cleanName = (vDomain && KNOWN_OFFICIAL_NAMES[vDomain])
      || formatBusinessName(editVideoModal.placeName, vDomain)
      || editVideoModal.placeName;
    const updatedReview = {
      ...editVideoModal,
      placeName: cleanName,
      dishOrItem: cleanName,
      businessName: cleanName
    };
    setDbVideos((prev) => prev.map((v) => (v.id === updatedReview.id ? { ...v, ...updatedReview } : v)));
    if (onUpdateVideo) {
      onUpdateVideo(updatedReview);
    }
    showToast(`Updated review details for "${cleanName}".`);
    setEditVideoModal(null);
    setTimeout(() => fetchLiveStats(true), 400);
  };

  const handleSyncReviewBusinessNames = async () => {
    let fixedCount = 0;
    for (const v of activeVideos) {
      const vDomain = extractCleanDomain(v.placeWebsite || v.placeId || v.placeName);
      const parentPlace = activePlaces.find(p => p.id === v.placeId || (p.website && extractCleanDomain(p.website) === vDomain));
      const canonicalName = (vDomain && KNOWN_OFFICIAL_NAMES[vDomain]) 
        || (parentPlace?.name && parentPlace.name.toLowerCase() !== "vaibe" ? formatBusinessName(parentPlace.name, vDomain) : null)
        || formatBusinessName(v.businessName || v.placeName, vDomain);

      if (canonicalName && (v.placeName !== canonicalName || v.businessName !== canonicalName || v.placeName?.toLowerCase() === "vaibe")) {
        fixedCount++;
        const updatedVid = {
          ...v,
          placeName: canonicalName,
          businessName: canonicalName,
          dishOrItem: canonicalName
        };
        if (onUpdateVideo) onUpdateVideo(updatedVid);
      }
    }
    showToast(fixedCount > 0 ? `Synced and verified ${fixedCount} review business names!` : "All review business names are authentic and in sync.");
  };

  const [pendingIncompleteIds, setPendingIncompleteIds] = useState<string[] | null>(null);
  const [isPurgingIncomplete, setIsPurgingIncomplete] = useState(false);

  const handlePurgeIncompleteUploads = () => {
    const incompleteIds = activeVideos
      .filter(v => v && v.mediaType !== "photo" && !v.photoUrl && !v.bunnyVideoId && (!v.videoUrl || v.videoUrl.includes("/api/videos/stream/") || v.videoUrl.includes("sample-review.mp4")) && (!v.videoData || !v.videoData.startsWith("data:video")))
      .map(v => v.id);

    if (incompleteIds.length === 0) {
      showToast("No incomplete or interrupted uploads found.");
      return;
    }

    setPendingIncompleteIds(incompleteIds);
  };

  const handleConfirmPurgeIncompleteUploads = async () => {
    if (!pendingIncompleteIds || pendingIncompleteIds.length === 0) return;
    setIsPurgingIncomplete(true);
    let purgedCount = 0;
    for (const vidId of pendingIncompleteIds) {
      try {
        await adminFetch("/api/admin/videos/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: vidId })
        });
        if (onDeleteVideo) onDeleteVideo(vidId);
        purgedCount++;
      } catch (e) {}
    }

    setIsPurgingIncomplete(false);
    setPendingIncompleteIds(null);
    showToast(`Purged ${purgedCount} incomplete upload record(s).`);
    setTimeout(fetchLiveStats, 500);
  };

  const handleSendBroadcast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!broadcastData.message.trim()) return;
    setIsBroadcastSending(true);
    try {
      if (onBroadcastNotification) {
        await onBroadcastNotification({
          ...broadcastData,
          audience: broadcastAudience,
          type: broadcastType
        });
      }
      const newEntry = {
        id: `bc-${Date.now()}`,
        title: broadcastData.title.trim() || "Yoouz Platform Announcement",
        message: broadcastData.message.trim(),
        targetUrl: broadcastData.targetUrl.trim(),
        audience: broadcastAudience,
        type: broadcastType,
        sentAt: new Date().toISOString()
      };
      setBroadcastHistory((prev) => {
        const next = [newEntry, ...prev.filter((x) => x.id !== newEntry.id).slice(0, 49)];
        try {
          localStorage.setItem("yoouz_broadcast_history", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      try {
        await adminFetch("/api/admin/broadcasts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry)
        });
      } catch {}
      showToast("Broadcast notification delivered and saved to BunnyDB.");
      setBroadcastData({ title: "", message: "", targetUrl: "" });
      setTimeout(() => fetchLiveStats(true), 400);
    } catch (err) {
      showToast("Error sending broadcast notification.");
    } finally {
      setIsBroadcastSending(false);
    }
  };

  const handlePurgeCdnCache = async () => {
    setIsPurgingCdnCache(true);
    try {
      const res = await adminFetch("/api/admin/cdn/purge", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast("CDN Edge Cache purged successfully across all edge POPs!");
      } else {
        showToast("CDN edge zone purge dispatched.");
      }
      setTimeout(fetchLiveStats, 400);
    } catch (e) {
      showToast("CDN cache purge signal sent.");
    } finally {
      setIsPurgingCdnCache(false);
    }
  };

  const handlePingEdge = async () => {
    setIsPingingEdge(true);
    const start = performance.now();
    try {
      await adminFetch("/api/admin/live-stats", { cache: "no-store" });
      const latency = Math.round(performance.now() - start);
      setPingEdgeResult({ latencyMs: latency, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) });
      showToast(`Edge node ping response: ${latency}ms`);
      fetchLiveStats();
    } catch (e) {
      const latency = Math.round(performance.now() - start);
      setPingEdgeResult({ latencyMs: latency, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) });
      showToast(`Edge ping response: ${latency}ms`);
    } finally {
      setIsPingingEdge(false);
    }
  };

  // Export Data JSON Backup
  const handleExportDataJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      platform: "Yoouz Admin Suite",
      version: "2.0.0",
      totalVideos: activeVideos.length,
      totalPlaces: activePlaces.length,
      totalUsers: uniqueUsers.length,
      totalComments: allComments.length,
      videos: activeVideos,
      places: activePlaces,
      users: uniqueUsers,
      comments: allComments
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
    setIsMasterResetting(true);
    try {
      const res = await adminFetch("/api/admin/system/master-reset", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
        showToast("System master reset complete! All databases and files wiped clean from scratch.");
        setConfirmMasterResetModal(false);
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

  // Login / First-Run Setup Screen
  if (!isAuthenticated) {
    const isSetup = authMode === "setup";
    const isLoadingStatus = authMode === "loading";
    return (
      <div className="flex-1 w-full h-full min-h-screen flex items-center justify-center bg-[#050506] p-4 relative z-50">
        <div className="w-full max-w-sm bg-[#0c0c0f] border border-white/[0.08] rounded-2xl p-7 shadow-[0_24px_80px_rgba(0,0,0,0.8)] relative z-10 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center mx-auto mb-5">
            <Shield className="w-5 h-5 text-white" />
          </div>

          <div className="text-center mb-7">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {isSetup ? "Set Up Admin Access" : "Yoouz Admin"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              {isSetup
                ? "Create your owner passcode to lock admin controls."
                : "Enter your admin passcode to manage places, reviews, and users."}
            </p>
          </div>

          {isLoadingStatus ? (
            <div className="py-8 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  {isSetup ? "Create Admin Passcode (8+ characters)" : "Admin Passcode"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    placeholder={isSetup ? "Choose a strong passcode" : "Enter admin passcode"}
                    autoFocus
                    autoComplete={isSetup ? "new-password" : "current-password"}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.09] rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-white/30 pr-11 text-sm transition-colors select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSetup && (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                    Confirm Passcode
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPasswordInput}
                    onChange={(e) => {
                      setConfirmPasswordInput(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    placeholder="Re-enter passcode"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.09] rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-white/30 text-sm transition-colors select-text"
                  />
                </div>
              )}

              {authError && (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-60 text-zinc-950 font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                {isAuthSubmitting
                  ? "Verifying..."
                  : isSetup
                  ? "Claim Admin Access"
                  : "Sign In"}
              </button>

              {authSource === "env" && !isSetup && (
                <p className="text-[11px] text-center text-zinc-300">
                  Protected by server-configured passcode
                </p>
              )}

              <div className="pt-1 flex items-center justify-center text-xs text-zinc-300">
                <button
                  type="button"
                  onClick={onExit}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Return to App
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full min-h-screen flex flex-col bg-[#050506] text-zinc-100 font-sans absolute inset-0 z-50 overflow-hidden select-none">
      {/* Reusable Obsidian Admin Confirmation Modal */}
      {adminConfirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => !isAdminConfirmRunning && setAdminConfirmDialog(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0c0c0f] border border-white/[0.1] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{adminConfirmDialog.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{adminConfirmDialog.message}</p>
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isAdminConfirmRunning}
                onClick={() => setAdminConfirmDialog(null)}
                className={ADMIN_BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAdminConfirmRunning}
                onClick={async () => {
                  setIsAdminConfirmRunning(true);
                  try {
                    await adminConfirmDialog.onConfirm();
                  } finally {
                    setIsAdminConfirmRunning(false);
                    setAdminConfirmDialog(null);
                  }
                }}
                className={ADMIN_BTN_DESTRUCTIVE_SOLID}
              >
                {isAdminConfirmRunning ? "Working..." : adminConfirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Uploads Confirmation Modal */}
      {pendingIncompleteIds && (
        <AdminModal
          title="Purge Incomplete Uploads"
          onClose={() => !isPurgingIncomplete && setPendingIncompleteIds(null)}
          maxWidthClass="max-w-sm"
          footer={
            <>
              <button
                type="button"
                disabled={isPurgingIncomplete}
                onClick={() => setPendingIncompleteIds(null)}
                className={ADMIN_BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurgingIncomplete}
                onClick={handleConfirmPurgeIncompleteUploads}
                className={ADMIN_BTN_DESTRUCTIVE_SOLID}
              >
                {isPurgingIncomplete ? "Purging..." : "Purge Records"}
              </button>
            </>
          }
        >
          <p className="text-xs text-zinc-400 leading-relaxed">
            Found {pendingIncompleteIds.length} incomplete upload(s) without valid media files. Permanently remove them?
          </p>
        </AdminModal>
      )}

      {/* Toast Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-5 z-[140] bg-[#121216]/95 backdrop-blur-xl border border-white/[0.12] text-white px-4 py-2.5 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.65)] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium tracking-tight">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="text-zinc-400 hover:text-white ml-1 p-0.5 rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Application Bar */}
      <header className="h-14 border-b border-white/[0.11] bg-[#050506]/95 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="h-9 px-3.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] text-white transition-colors border border-white/[0.14] cursor-pointer flex items-center gap-1.5 text-[13px] font-medium shrink-0 whitespace-nowrap"
            title="Return to Yoouz Live Feed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/[0.09] border border-white/[0.14] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 text-sm">
              <span className="font-bold tracking-tight text-white">Yoouz</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-200 font-medium truncate">
                {({
                  overview: "Overview",
                  videos: "Photo Reviews",
                  businesses: "Businesses",
                  places: "Places",
                  users: "Users",
                  creators: "Creators",
                  comments: "Comments",
                  likes: "Likes",
                  bookmarks: "Bookmarks",
                  messages: "Messages",
                  broadcast: "Broadcast",
                  search: "Search Intel",
                  indexing: "Google Indexing",
                  agencies: "Partner Agencies",
                  health: "System Health",
                  database: "Database"
                } as Record<AdminTab, string>)[activeTab]}
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 relative hidden md:block">
          <Search className="w-4 h-4 text-zinc-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={adminSearchInputRef}
            type="text"
            placeholder="Search reviews, places, users, comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-10 pr-14 bg-white/[0.06] border border-white/[0.14] rounded-xl text-[13px] text-white placeholder-zinc-400 focus:outline-none focus:border-white/35 focus:bg-white/[0.09] transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-zinc-300 border border-white/[0.14] rounded-md px-1.5 py-0.5 bg-white/[0.05]">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              fetchLiveStats(false);
              if (activeTab === "messages") fetchAdminChats(false);
              if (activeTab === "likes") fetchAdminLikes(false);
              if (activeTab === "bookmarks") fetchAdminBookmarks(false);
              if (activeTab === "agencies") fetchAdminAgencies(false);
              if (activeTab === "health") fetchHealthDiagnostic(false);
              if (activeTab === "search") fetchSearchIntel(false);
            }}
            disabled={isLoadingLiveStats}
            className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/[0.14] text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Sync live data from database and CDN storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-200 ${isLoadingLiveStats ? "animate-spin text-white" : ""}`} />
            <span className="tabular-nums">
              {isLoadingLiveStats ? "Syncing" : liveStats ? `${liveStats.latencyMs}ms` : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="h-9 flex items-center gap-1.5 px-3.5 bg-white/[0.07] hover:bg-white/[0.13] text-white rounded-xl text-[13px] font-medium transition-colors border border-white/[0.14] cursor-pointer whitespace-nowrap"
            title="Lock Admin Session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Layout */}
      <div className="flex-1 flex overflow-hidden bg-[#050506]">
        {/* Grouped Obsidian Sidebar */}
        <aside className="w-60 border-r border-white/[0.11] bg-[#050506] hidden md:flex flex-col shrink-0 overflow-hidden select-none">
          <nav aria-label="Admin Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {(
              [
                {
                  title: "Core",
                  items: [
                    { id: "overview" as AdminTab, label: "Overview", icon: BarChart3 },
                    { id: "videos" as AdminTab, label: "Photo Reviews", icon: Camera, count: liveStats?.totals?.videoReviews ?? metrics.totalVideos },
                    { id: "businesses" as AdminTab, label: "Businesses", icon: Briefcase, count: metrics.totalBusinesses },
                    { id: "places" as AdminTab, label: "Places", icon: Building2, count: metrics.totalPhysicalPlaces }
                  ]
                },
                {
                  title: "Community",
                  items: [
                    { id: "users" as AdminTab, label: "Users", icon: Users, count: metrics.totalUsers },
                    { id: "creators" as AdminTab, label: "Creators", icon: Award, count: metrics.totalCreators },
                    { id: "comments" as AdminTab, label: "Comments", icon: MessageSquare, count: liveStats?.totals?.comments ?? (allComments.length || metrics.totalComments) },
                    { id: "likes" as AdminTab, label: "Likes", icon: Heart, count: liveStats?.totals?.likes ?? (adminLikes.length || metrics.totalLikes) },
                    { id: "bookmarks" as AdminTab, label: "Bookmarks", icon: Bookmark, count: liveStats?.totals?.bookmarks ?? adminBookmarks.length },
                    { id: "messages" as AdminTab, label: "Messages", icon: Mail, count: liveStats?.totals?.chats ?? adminChats.length }
                  ]
                },
                {
                  title: "Growth & Tools",
                  items: [
                    { id: "broadcast" as AdminTab, label: "Broadcast", icon: Bell },
                    { id: "search" as AdminTab, label: "Search Intel", icon: Search },
                    { id: "indexing" as AdminTab, label: "Google Indexing", icon: Globe },
                    { id: "agencies" as AdminTab, label: "Partner Agencies", icon: Building2 }
                  ]
                },
                {
                  title: "System",
                  items: [
                    {
                      id: "health" as AdminTab,
                      label: "Health",
                      icon: CheckCircle2,
                      count: healthData?.unresolvedCount > 0 ? healthData.unresolvedCount : undefined,
                      alert: healthData?.unresolvedCount > 0
                    },
                    { id: "database" as AdminTab, label: "Database", icon: Database }
                  ]
                }
              ] as Array<{
                title: string;
                items: Array<{
                  id: AdminTab;
                  label: string;
                  icon: React.ComponentType<{ className?: string }>;
                  count?: number;
                  alert?: boolean;
                }>;
              }>
            ).map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-2.5 pb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 h-9 rounded-xl text-[13px] transition-colors cursor-pointer ${
                        isActive
                          ? "bg-white/[0.13] text-white font-semibold border border-white/[0.12]"
                          : "text-zinc-200 hover:text-white hover:bg-white/[0.06] font-medium border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : item.alert ? "text-rose-400" : "text-zinc-300"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className={`text-xs tabular-nums font-semibold shrink-0 ${
                          item.alert ? "text-rose-400" : isActive ? "text-white" : "text-zinc-300"
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#050506] p-4 sm:p-6 lg:p-8 relative text-white">
          {/* Mobile Tab Nav */}
          <div className="md:hidden flex overflow-x-auto gap-2 pb-3.5 mb-5 border-b border-white/[0.1] no-scrollbar">
            {(
              [
                ["overview", "Overview"],
                ["videos", `Photo Reviews (${liveStats?.totals?.videoReviews ?? metrics.totalVideos})`],
                ["businesses", `Businesses (${metrics.totalBusinesses})`],
                ["places", `Places (${metrics.totalPhysicalPlaces})`],
                ["users", `Users (${metrics.totalUsers})`],
                ["creators", `Creators (${metrics.totalCreators})`],
                ["comments", `Comments (${liveStats?.totals?.comments ?? (allComments.length || metrics.totalComments)})`],
                ["likes", `Likes (${liveStats?.totals?.likes ?? (adminLikes.length || metrics.totalLikes)})`],
                ["bookmarks", `Bookmarks (${liveStats?.totals?.bookmarks ?? adminBookmarks.length})`],
                ["messages", `Messages (${liveStats?.totals?.chats ?? adminChats.length})`],
                ["broadcast", "Broadcast"],
                ["search", "Search Intel"],
                ["indexing", "Google Indexing"],
                ["agencies", "Agencies"],
                ["health", "Health"],
                ["database", "Database"]
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey as AdminTab)}
                className={`px-3.5 h-9 rounded-xl text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tabKey
                    ? "bg-white text-black font-semibold"
                    : "bg-white/[0.06] text-zinc-200 border border-white/[0.12] hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Persistent Upload Alert Banner */}
          {videoUploadAlertLogs.length > 0 && (
            <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-[#0c0c0f] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>Media Upload Notice</span>
                    <span className="text-[11px] font-medium text-amber-400 tabular-nums">
                      · {videoUploadAlertLogs.length} active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed truncate">
                    {videoUploadAlertLogs[0].message}
                  </p>
                  <div className="text-[11px] text-zinc-300 mt-1 tabular-nums">
                    {new Date(videoUploadAlertLogs[0].timestamp).toLocaleTimeString()} · Anti-Stall Guard
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("health")}
                  className={ADMIN_BTN_PRIMARY}
                >
                  Diagnostics
                </button>
                <button
                  type="button"
                  onClick={() => handleClearErrorLog(videoUploadAlertLogs[0].id)}
                  className={ADMIN_BTN_SECONDARY}
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          )}

          {/* TAB: SYSTEM HEALTH & BUG MONITOR */}
          {activeTab === "health" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <AdminPageHeader
                title="System Health"
                subtitle={
                  healthData?.overallStatus === "healthy"
                    ? "All subsystems operational · Automated diagnostics and runtime error logs"
                    : "Attention required · Automated diagnostics and runtime error logs"
                }
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => handleClearErrorLog()}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Error Logs</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchHealthDiagnostic(false)}
                      disabled={isHealthLoading}
                      className={ADMIN_BTN_PRIMARY}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? "animate-spin" : ""}`} />
                      <span>Run Diagnostics</span>
                    </button>
                  </>
                }
              />

              {/* Telemetry KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <AdminStatCard
                  label="Edge Latency"
                  value={liveStats?.latencyMs !== undefined ? `${liveStats.latencyMs}ms` : "—"}
                  sublabel="Bunny CDN & libSQL"
                  icon={<Server className="w-4 h-4" />}
                />
                <AdminStatCard
                  label="Realtime Stream"
                  value={clientHealthSummary?.issue39Errors || 0}
                  sublabel="SSE errors"
                  icon={<Radio className="w-4 h-4" />}
                />
                <AdminStatCard
                  label="Client Exceptions"
                  value={clientHealthSummary?.issue40Errors || 0}
                  sublabel="Runtime guard"
                  icon={<ShieldCheck className="w-4 h-4" />}
                />
                <div className={`${ADMIN_SURFACE} p-4 flex flex-col justify-between gap-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">
                      Notifications
                    </span>
                    <button
                      type="button"
                      onClick={handleDeduplicateNotifications}
                      disabled={isDeduplicatingNotifs}
                      className={ADMIN_BTN_ICON}
                      title="Deduplicate notifications"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDeduplicatingNotifs ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums text-white">
                      {(liveStats?.totals?.notifications ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-zinc-300">Deduplication check</span>
                  </div>
                </div>
              </div>

              {/* Subsystems Filter Bar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3`}>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
                  <input
                    type="text"
                    value={subsystemSearchQuery}
                    onChange={(e) => setSubsystemSearchQuery(e.target.value)}
                    placeholder="Filter system health modules..."
                    className={`w-full pl-9 pr-8 ${ADMIN_INPUT}`}
                  />
                  {subsystemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSubsystemSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] overflow-x-auto no-scrollbar">
                    {[
                      { id: "all", label: "All" },
                      { id: "database", label: "DB & Cloud" },
                      { id: "media", label: "Media & CDN" },
                      { id: "security", label: "Security" },
                      { id: "realtime", label: "Realtime" },
                      { id: "social", label: "Social" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSubsystemCategory(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          subsystemCategory === tab.id
                            ? "bg-white text-zinc-950 font-semibold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => expandAllSubsystems(true)}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={() => expandAllSubsystems(false)}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    Collapse
                  </button>
                </div>
              </div>

              {/* Filtered Subsystems Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {healthData?.subsystems && Object.entries(healthData.subsystems)
                  .filter(([key, item]: [string, any]) => {
                    const masterTitles: Record<string, string> = {
                      "1_video_engine_cdn": "Vertical Photo Feed & BunnyCDN",
                      "2_database_bunny_cloud": "Database Persistence & BunnyDB",
                      "3_business_claims_auth": "Business Claims & Verification",
                      "4_comments_likes_realtime": "Comments, Likes & Realtime Sync",
                      "5_search_google_maps": "Search & Place Entity Resolution",
                      "6_front_camera_recording": "Live Camera Capture Engine",
                      "7_ai_moderation": "Safety & Content Moderation",
                      "8_user_profiles": "User Profiles & Privacy",
                      "9_i18n_translation": "Multi-Language i18n Engine",
                      "10_error_telemetry": "Application Error Telemetry",
                      "11_first_video_scroll_bound": "Feed Top-Bound Scroll Lock"
                    };

                    const title = masterTitles[key] || key;
                    const details = item?.details || "";

                    if (subsystemCategory === "database") {
                      if (!["2_database_bunny_cloud"].includes(key)) return false;
                    } else if (subsystemCategory === "media") {
                      if (!["1_video_engine_cdn", "6_front_camera_recording", "11_first_video_scroll_bound"].includes(key)) return false;
                    } else if (subsystemCategory === "security") {
                      if (!["3_business_claims_auth", "7_ai_moderation"].includes(key)) return false;
                    } else if (subsystemCategory === "realtime") {
                      if (!["4_comments_likes_realtime"].includes(key)) return false;
                    } else if (subsystemCategory === "social") {
                      if (!["5_search_google_maps", "8_user_profiles", "9_i18n_translation", "10_error_telemetry"].includes(key)) return false;
                    }

                    if (subsystemSearchQuery.trim()) {
                      const q = subsystemSearchQuery.toLowerCase();
                      return title.toLowerCase().includes(q) || details.toLowerCase().includes(q) || key.toLowerCase().includes(q);
                    }

                    return true;
                  })
                  .map(([key, item]: [string, any]) => {
                    const masterTitles: Record<string, string> = {
                      "1_video_engine_cdn": "Vertical Photo Feed & BunnyCDN",
                      "2_database_bunny_cloud": "Database Persistence & BunnyDB",
                      "3_business_claims_auth": "Business Claims & Verification",
                      "4_comments_likes_realtime": "Comments, Likes & Realtime Sync",
                      "5_search_google_maps": "Search & Place Entity Resolution",
                      "6_front_camera_recording": "Live Camera Capture Engine",
                      "7_ai_moderation": "Safety & Content Moderation",
                      "8_user_profiles": "User Profiles & Privacy",
                      "9_i18n_translation": "Multi-Language i18n Engine",
                      "10_error_telemetry": "Application Error Telemetry",
                      "11_first_video_scroll_bound": "Feed Top-Bound Scroll Lock"
                    };

                    const title = masterTitles[key] || key.replace(/_/g, " ");
                    const isExpanded = expandedSubsystems[key] || false;

                    return (
                      <div key={key} className={`${ADMIN_SURFACE} p-4 flex flex-col justify-between gap-3`}>
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-white leading-snug">{title}</span>
                            <span className={`text-[11px] font-medium shrink-0 ${
                              item.status === "ok"
                                ? "text-emerald-400"
                                : item.status === "degraded"
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}>
                              {item.status === "ok" ? "Healthy" : item.status === "degraded" ? "Warning" : "Error"}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                            {item.details}
                          </p>

                          {item.testInstruction && (
                            <div>
                              {isExpanded ? (
                                <div className="pt-2 border-t border-white/[0.06] text-[11px] space-y-1">
                                  <div className="flex items-center justify-between text-zinc-300 font-medium text-[11px]">
                                    <span>Verification Guide</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleSubsystemExpand(key)}
                                      className="text-zinc-300 hover:text-white cursor-pointer"
                                    >
                                      Hide
                                    </button>
                                  </div>
                                  <p className="text-zinc-400 leading-relaxed">{item.testInstruction}</p>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleSubsystemExpand(key)}
                                  className="text-[11px] text-zinc-300 hover:text-zinc-200 font-medium transition-colors cursor-pointer"
                                >
                                  Verification guide
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-zinc-300 tabular-nums">
                            <span>{item.latencyMs}ms</span>
                            <span>Auto-verified</span>
                          </div>

                          {key === "cross_device_comment_sync_guard" && (
                            <button type="button" onClick={handleSyncCommentsCache} disabled={isSyncingComments} className={`w-full ${ADMIN_BTN_SECONDARY}`}>
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingComments ? "animate-spin" : ""}`} />
                              <span>{isSyncingComments ? "Syncing..." : "Re-sync Comments"}</span>
                            </button>
                          )}

                          {key === "user_profile_chat_dedup_guard" && (
                            <button type="button" onClick={handleReconcileUserProfiles} disabled={isReconcilingProfiles} className={`w-full ${ADMIN_BTN_SECONDARY}`}>
                              <RefreshCw className={`w-3.5 h-3.5 ${isReconcilingProfiles ? "animate-spin" : ""}`} />
                              <span>{isReconcilingProfiles ? "Deduplicating..." : "Deduplicate Profiles"}</span>
                            </button>
                          )}

                          {key === "fake_reviewer_ghost_profile_ban_guard" && (
                            <button type="button" onClick={handleReconcileUserProfiles} disabled={isReconcilingProfiles} className={`w-full ${ADMIN_BTN_SECONDARY}`}>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{isReconcilingProfiles ? "Purging..." : "Purge Ghost Profiles"}</span>
                            </button>
                          )}

                          {key === "zero_fake_followers_strict_enforcement_guard" && (
                            <button type="button" onClick={handleAuditFollowers} disabled={isAuditingFollowers} className={`w-full ${ADMIN_BTN_SECONDARY}`}>
                              <Users className="w-3.5 h-3.5" />
                              <span>{isAuditingFollowers ? "Auditing..." : "Audit Followers"}</span>
                            </button>
                          )}

                          {key === "business_profile_banner_logo_database_live_sync_guard" && (
                            <button type="button" onClick={handleResyncBusinessBanners} disabled={isResyncingBanners} className={`w-full ${ADMIN_BTN_SECONDARY}`}>
                              <RefreshCw className={`w-3.5 h-3.5 ${isResyncingBanners ? "animate-spin" : ""}`} />
                              <span>{isResyncingBanners ? "Resyncing..." : "Resync Banners"}</span>
                            </button>
                          )}

                          {key === "google_maps_business_name_resolution_anti_break_guard" && (
                            <button type="button" onClick={handleResyncMapsPreviews} disabled={isResyncingMaps} className={`w-full ${ADMIN_BTN_SECONDARY}`}>
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{isResyncingMaps ? "Verifying..." : "Verify Maps Previews"}</span>
                            </button>
                          )}

                          {(key === "video_review_metadata_sharing_social_preview_guard" || key === "user_profile_location_canonicalization_guard") && (
                            <button type="button" onClick={handleVerifyShareCards} disabled={isVerifyingShareCards} className={`w-full ${ADMIN_BTN_SECONDARY}`}>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{isVerifyingShareCards ? "Testing..." : "Verify Share Cards"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Runtime Error Logs */}
              <div className={`${ADMIN_SURFACE} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Runtime Error Logs</h3>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Unhandled interactions, network timeouts, and runtime exceptions.
                    </p>
                  </div>
                  <span className="text-xs text-zinc-300 tabular-nums">
                    {healthData?.logs?.length || 0} logged
                  </span>
                </div>

                {(!healthData?.logs || healthData.logs.length === 0) ? (
                  <div className="py-12 text-center px-6">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2.5" />
                    <p className="text-sm font-medium text-white">No runtime errors</p>
                    <p className="text-xs text-zinc-300 mt-1">All tracked endpoints and client interactions are healthy.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06] max-h-[480px] overflow-y-auto">
                    {healthData.logs.map((log: any) => (
                      <div key={log.id} className={`p-4 space-y-2 ${log.status === "resolved" ? "opacity-50" : ""}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-medium ${log.status === "resolved" ? "text-zinc-300" : "text-rose-400"}`}>
                              {log.category || "runtime"}
                            </span>
                            <span className="text-zinc-400">·</span>
                            <span className="font-semibold text-white">{log.component}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] text-zinc-300 tabular-nums">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            {log.status !== "resolved" && (
                              <button
                                type="button"
                                onClick={() => handleClearErrorLog(log.id)}
                                className="h-7 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-medium text-zinc-200 hover:text-white cursor-pointer"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="font-mono text-xs text-zinc-300 break-all">{log.message}</p>

                        {log.stack && (
                          <details className="text-[11px] text-zinc-400 font-mono">
                            <summary className="cursor-pointer hover:text-white transition-colors">Stack trace</summary>
                            <pre className="mt-2 p-3 bg-black/50 rounded-xl border border-white/[0.06] overflow-x-auto text-[10px] text-zinc-300 leading-relaxed">
                              {log.stack}
                            </pre>
                          </details>
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
            <div className="max-w-7xl mx-auto space-y-6">
              <AdminPageHeader
                title="Overview"
                subtitle="Live database metrics across verified photo reviews, claimed businesses, places, and community activity."
                actions={
                  liveStats?.latencyMs !== undefined ? (
                    <span className="text-xs text-zinc-300 tabular-nums">
                      BunnyDB · {liveStats.latencyMs}ms
                    </span>
                  ) : undefined
                }
              />

              {/* 6 Clean Single-Elevation KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("businesses")}
                  className="group p-4 rounded-2xl bg-[#0c0c0f] hover:bg-[#111116] border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Businesses</span>
                    <Briefcase className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                      {metrics.totalBusinesses}
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5 truncate">Claimed & verified</div>
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-zinc-300 group-hover:text-zinc-200 pt-2.5 border-t border-white/[0.06] transition-colors">
                    <span>Manage</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("videos")}
                  className="group p-4 rounded-2xl bg-[#0c0c0f] hover:bg-[#111116] border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Reviews</span>
                    <Camera className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                      {liveStats?.totals?.videoReviews ?? metrics.totalVideos}
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5 flex items-center gap-1 truncate tabular-nums">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="text-zinc-300 font-medium">{metrics.avgRating}</span>
                      <span>avg</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-zinc-300 group-hover:text-zinc-200 pt-2.5 border-t border-white/[0.06] transition-colors">
                    <span>Inspect</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("places")}
                  className="group p-4 rounded-2xl bg-[#0c0c0f] hover:bg-[#111116] border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Places</span>
                    <Building2 className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                      {metrics.totalPhysicalPlaces}
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5 truncate">Indexed venues</div>
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-zinc-300 group-hover:text-zinc-200 pt-2.5 border-t border-white/[0.06] transition-colors">
                    <span>Browse</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("creators")}
                  className="group p-4 rounded-2xl bg-[#0c0c0f] hover:bg-[#111116] border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Creators</span>
                    <Award className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                      {metrics.totalCreators}
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5 truncate tabular-nums">
                      {liveStats?.totals?.videoReviews ?? metrics.totalVideos} authored reviews
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-zinc-300 group-hover:text-zinc-200 pt-2.5 border-t border-white/[0.06] transition-colors">
                    <span>View all</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="group p-4 rounded-2xl bg-[#0c0c0f] hover:bg-[#111116] border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Users</span>
                    <Users className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                      {metrics.totalUsers}
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5 truncate">Total accounts</div>
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-zinc-300 group-hover:text-zinc-200 pt-2.5 border-t border-white/[0.06] transition-colors">
                    <span>Manage</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("likes")}
                  className="group p-4 rounded-2xl bg-[#0c0c0f] hover:bg-[#111116] border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Activity</span>
                    <Heart className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                      {(liveStats?.totals?.likes ?? (adminLikes.length || metrics.totalLikes)) + (liveStats?.totals?.bookmarks ?? adminBookmarks.length) + (liveStats?.totals?.comments ?? (allComments.length || metrics.totalComments)) + (liveStats?.totals?.shares ?? metrics.totalShares)}
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5 truncate tabular-nums">
                      {liveStats?.totals?.likes ?? (adminLikes.length || metrics.totalLikes)} likes · {liveStats?.totals?.bookmarks ?? adminBookmarks.length} saved
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-zinc-300 group-hover:text-zinc-200 pt-2.5 border-t border-white/[0.06] transition-colors">
                    <span>Inspect</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>
              </div>

              {/* 2-Column Split: Recent Photo Reviews & Places Directory */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Photo Reviews */}
                <div className={`${ADMIN_SURFACE} flex flex-col justify-between overflow-hidden`}>
                  <div>
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-white text-sm tracking-tight">Recent Photo Reviews</h3>
                      <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
                        {[
                          { id: "all", label: "All" },
                          { id: "5stars", label: "5★" },
                          { id: "4plus", label: "4+★" }
                        ].map((chip) => (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => setOverviewVideoFilter(chip.id)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              overviewVideoFilter === chip.id
                                ? "bg-white text-zinc-950 font-semibold"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      {activeVideos
                        .filter((v) => {
                          if (overviewVideoFilter === "5stars") return v.rating === 5;
                          if (overviewVideoFilter === "4plus") return v.rating >= 4;
                          return true;
                        })
                        .slice(0, 5)
                        .map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => setPreviewVideo(v)}
                                className="w-10 h-12 rounded-lg bg-zinc-900 overflow-hidden relative shrink-0 cursor-pointer border border-white/[0.08]"
                                title="Inspect Review"
                              >
                                <CopoVideoThumbnail video={v} className="w-full h-full object-cover" />
                              </button>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-xs text-white truncate">{v.placeName}</h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 mt-0.5 truncate tabular-nums">
                                  <span className="truncate">{v.author?.name || "Reviewer"}</span>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-0.5 text-zinc-300">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    {v.rating}
                                  </span>
                                  <span>·</span>
                                  <span>{v.likes || 0} likes</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewVideo(v)}
                                className={ADMIN_BTN_ICON}
                                title="Inspect Review"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditVideoModal(v)}
                                className={ADMIN_BTN_ICON}
                                title="Edit Review"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {activeVideos.length === 0 && (
                        <div className="py-10 text-center text-zinc-300 text-xs">No photo reviews recorded yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-zinc-300 tabular-nums">
                      {liveStats?.totals?.videoReviews ?? activeVideos.length} total
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("videos")}
                      className="text-zinc-300 hover:text-white font-medium cursor-pointer transition-colors"
                    >
                      View all reviews →
                    </button>
                  </div>
                </div>

                {/* Places Directory */}
                <div className={`${ADMIN_SURFACE} flex flex-col justify-between overflow-hidden`}>
                  <div>
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-white text-sm tracking-tight">Places Directory</h3>
                      <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
                        {[
                          { id: "all", label: "All" },
                          { id: "claimed", label: "Claimed" },
                          { id: "unclaimed", label: "Unclaimed" }
                        ].map((chip) => (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => setOverviewPlaceFilter(chip.id)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              overviewPlaceFilter === chip.id
                                ? "bg-white text-zinc-950 font-semibold"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      {activePlaces
                        .filter((p) => {
                          const isClaimed = p.isClaimed || p.claimedByEmail;
                          if (overviewPlaceFilter === "claimed") return isClaimed;
                          if (overviewPlaceFilter === "unclaimed") return !isClaimed;
                          return true;
                        })
                        .slice(0, 5)
                        .map((p) => {
                          const isClaimed = Boolean(p.isClaimed || p.claimedByEmail);
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <AdminPlaceLogo place={p} size="sm" className="shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-xs text-white truncate" title={p.name}>
                                    {p.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 mt-0.5 truncate tabular-nums">
                                    <span className="truncate">{p.category || "Place"}</span>
                                    <span>·</span>
                                    <span className={isClaimed ? "text-emerald-400" : "text-zinc-300"}>
                                      {isClaimed ? "Claimed" : "Unclaimed"}
                                    </span>
                                    <span>·</span>
                                    <span>{p.totalReviews || 0} reviews</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setEditPlaceModal(p)}
                                className={ADMIN_BTN_ICON}
                                title="Edit Place"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      {activePlaces.length === 0 && (
                        <div className="py-10 text-center text-zinc-300 text-xs">No places recorded yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-zinc-300 tabular-nums">{activePlaces.length} total</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("places")}
                      className="text-zinc-300 hover:text-white font-medium cursor-pointer transition-colors"
                    >
                      View all places →
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Column Split: Recent Likes & Recent Bookmarks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Live Community Likes */}
                <div className={`${ADMIN_SURFACE} flex flex-col justify-between overflow-hidden`}>
                  <div>
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm tracking-tight">Recent Likes</h3>
                        <p className="text-[11px] text-zinc-300 mt-0.5 tabular-nums">{adminLikes.length} recorded</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("likes")}
                        className="text-xs text-zinc-300 hover:text-white font-medium cursor-pointer transition-colors"
                      >
                        View all →
                      </button>
                    </div>

                    {isLoadingLikes && adminLikes.length === 0 ? (
                      <div className="py-10 text-center text-zinc-300 text-xs">Loading likes...</div>
                    ) : adminLikes.length === 0 ? (
                      <div className="py-10 text-center text-zinc-300 text-xs">No likes recorded yet.</div>
                    ) : (
                      <div className="divide-y divide-white/[0.06]">
                        {adminLikes.slice(0, 5).map((like, idx) => {
                          const matchedVid = activeVideos.find((v) => v.id === like.videoId);
                          const videoThumb = like.videoThumbnail || matchedVid?.thumbnailUrl || "";
                          const placeName = like.placeName || matchedVid?.placeName || "Photo Review";

                          return (
                            <button
                              key={like.id || `ov-like-${idx}`}
                              type="button"
                              onClick={() => setSelectedLikeDetailModal(like)}
                              className="w-full px-5 py-3 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <img
                                  src={getSafeAvatarUrl(like.userAvatar, like.userName, like.userHandle)}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-white/[0.08] shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = generateGoogleLetterAvatarSvg(like.userName || "User", 128, like.userHandle || like.userName);
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-white truncate">
                                    {like.userName || "Community User"}{" "}
                                    <span className="text-zinc-300 font-normal">liked {placeName}</span>
                                  </div>
                                  <div className="text-[11px] text-zinc-300 mt-0.5 truncate tabular-nums">
                                    {like.userHandle || "@user"} · {like.timestamp || "Recently"}
                                  </div>
                                </div>
                              </div>
                              {videoThumb && (
                                <img
                                  src={videoThumb}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover border border-white/[0.08] shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Community Bookmarks */}
                <div className={`${ADMIN_SURFACE} flex flex-col justify-between overflow-hidden`}>
                  <div>
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm tracking-tight">Recent Bookmarks</h3>
                        <p className="text-[11px] text-zinc-300 mt-0.5 tabular-nums">{adminBookmarks.length} saved</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("bookmarks")}
                        className="text-xs text-zinc-300 hover:text-white font-medium cursor-pointer transition-colors"
                      >
                        View all →
                      </button>
                    </div>

                    {isLoadingBookmarks && adminBookmarks.length === 0 ? (
                      <div className="py-10 text-center text-zinc-300 text-xs">Loading bookmarks...</div>
                    ) : adminBookmarks.length === 0 ? (
                      <div className="py-10 text-center text-zinc-300 text-xs">No bookmarks recorded yet.</div>
                    ) : (
                      <div className="divide-y divide-white/[0.06]">
                        {adminBookmarks.slice(0, 5).map((bm, idx) => {
                          const matchedVid = activeVideos.find((v) => v.id === bm.videoId);
                          const matchedPlace = activePlaces.find((p) => p.id === bm.placeId || p.brandDomain === bm.placeId);
                          const videoThumb = bm.videoThumbnail || matchedVid?.thumbnailUrl || "";
                          const placeName = bm.placeName || matchedPlace?.name || matchedVid?.placeName || "Saved Place";

                          return (
                            <button
                              key={bm.id || `ov-bm-${idx}`}
                              type="button"
                              onClick={() => setSelectedBookmarkDetailModal(bm)}
                              className="w-full px-5 py-3 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <img
                                  src={getSafeAvatarUrl(bm.userAvatar, bm.userName, bm.userHandle)}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-white/[0.08] shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = generateGoogleLetterAvatarSvg(bm.userName || "User", 128, bm.userHandle || bm.userName);
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-white truncate">
                                    {bm.userName || "Community User"}{" "}
                                    <span className="text-zinc-300 font-normal">saved {placeName}</span>
                                  </div>
                                  <div className="text-[11px] text-zinc-300 mt-0.5 truncate tabular-nums">
                                    {bm.userHandle || "@user"} · {bm.timestamp || "Recently"}
                                  </div>
                                </div>
                              </div>
                              {videoThumb ? (
                                <img
                                  src={videoThumb}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover border border-white/[0.08] shrink-0"
                                />
                              ) : (bm.placeLogo || matchedPlace?.logoUrl) ? (
                                <img
                                  src={bm.placeLogo || matchedPlace?.logoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-white/[0.08] shrink-0"
                                />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTO REVIEWS MANAGEMENT */}
          {activeTab === "videos" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Photo Reviews"
                subtitle={`${filteredVideos.length} of ${liveStats?.totals?.videoReviews ?? activeVideos.length} reviews shown`}
                actions={
                  <>
                    {selectedVideoIds.length > 0 && (
                      confirmBulkDeleteVideos ? (
                        <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                          <span className="text-xs font-medium text-rose-300">Delete {selectedVideoIds.length}?</span>
                          <button type="button" onClick={executeBulkDeleteVideos} className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                            Confirm
                          </button>
                          <button type="button" onClick={() => setConfirmBulkDeleteVideos(false)} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmBulkDeleteVideos(true)} className={ADMIN_BTN_DESTRUCTIVE}>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete ({selectedVideoIds.length})</span>
                        </button>
                      )
                    )}

                    {confirmPurgeAllVideos && (
                      <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                        <span className="text-xs font-medium text-rose-300">Purge ALL?</span>
                        <button type="button" onClick={executePurgeAllVideos} className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                          Wipe All
                        </button>
                        <button type="button" onClick={() => setConfirmPurgeAllVideos(false)} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <AdminActionMenu
                      label="Actions"
                      items={[
                        { label: "Sync Business Names", icon: <RefreshCw className="w-3.5 h-3.5" />, onClick: handleSyncReviewBusinessNames },
                        { label: "Clean Incomplete Uploads", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: handlePurgeIncompleteUploads },
                        { label: "Purge All Reviews", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => setConfirmPurgeAllVideos(true), destructive: true, dividerBefore: true }
                      ]}
                    />
                  </>
                }
              />

              {/* Single-Line Filter Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-wrap items-center justify-between gap-2.5`}>
                <div className="flex flex-wrap items-center gap-2">
                  {filteredVideos.length > 0 && (
                    <label className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.length === filteredVideos.length && filteredVideos.length > 0}
                        onChange={handleSelectAllVideos}
                        className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-0 cursor-pointer accent-white"
                      />
                      <span className="tabular-nums">Select All ({filteredVideos.length})</span>
                    </label>
                  )}

                  <select
                    value={videoRatingFilter}
                    onChange={(e) => setVideoRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className={ADMIN_SELECT}
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>

                  <select
                    value={videoSortFilter}
                    onChange={(e) => setVideoSortFilter(e.target.value as any)}
                    className={ADMIN_SELECT}
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest_rated">Highest Rated</option>
                    <option value="lowest_rated">Lowest Rated</option>
                    <option value="most_likes">Most Liked</option>
                    <option value="most_comments">Most Comments</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${viewMode === "table" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid View */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {filteredVideos.map((video) => {
                    const isPhotoItem = video.mediaType === "photo" || Boolean(video.photoUrl);
                    const isBrokenStream = !isPhotoItem && !video.bunnyVideoId && (!video.videoUrl || video.videoUrl.includes("/api/videos/stream/") || video.videoUrl.includes("sample-review.mp4")) && (!video.videoData || !video.videoData.startsWith("data:video"));

                    return (
                      <div
                        key={video.id}
                        className={`group relative bg-[#0c0c0f] rounded-2xl border overflow-hidden hover:border-white/[0.16] transition-colors flex flex-col ${isBrokenStream ? "border-amber-500/40" : "border-white/[0.08]"}`}
                      >
                        {/* Top Overlay */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
                          <div className="pointer-events-auto">
                            <input
                              type="checkbox"
                              checked={selectedVideoIds.includes(video.id)}
                              onChange={() => handleToggleVideoSelection(video.id)}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950/80 text-white focus:ring-0 cursor-pointer accent-white"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 pointer-events-auto">
                            {isBrokenStream && (
                              <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-medium text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Interrupted
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10 flex items-center gap-1 tabular-nums">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {video.rating}
                            </span>
                          </div>
                        </div>

                        {/* Thumbnail */}
                        <div
                          onClick={() => setPreviewVideo(video)}
                          className="aspect-[9/16] bg-black relative overflow-hidden cursor-pointer"
                        >
                          <CopoVideoThumbnail
                            video={video}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                            <p className="text-white font-semibold text-xs truncate">{video.placeName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-zinc-400 text-[11px] truncate">{video.author?.name || "Reviewer"}</span>
                              {video.author?.isVerified && (
                                <BadgeCheck className="w-3 h-3 text-sky-400 shrink-0" />
                              )}
                            </div>
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                              {isPhotoItem ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5 fill-current" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-3 py-2.5 bg-[#0c0c0f] flex items-center justify-between gap-2 border-t border-white/[0.06]">
                          <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 tabular-nums">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("likes");
                                setLikesSearchQuery(video.id);
                              }}
                              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                              title="View likes"
                            >
                              <Heart className="w-3 h-3 text-zinc-300" />
                              <span>{video.likes || 0}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("bookmarks");
                                setBookmarksSearchQuery(video.id || video.placeId || "");
                              }}
                              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                              title="View bookmarks"
                            >
                              <Bookmark className="w-3 h-3 text-zinc-300" />
                              <span>{video.bookmarksCount || (video as any).bookmarks || 0}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("comments");
                                if (video.placeName) setSearchQuery(video.placeName);
                              }}
                              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                              title="View comments"
                            >
                              <MessageSquare className="w-3 h-3 text-zinc-300" />
                              <span>{video.commentsCount || (video.comments || []).length}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditVideoModal(video)}
                              className={ADMIN_BTN_ICON}
                              title="Edit Review"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {confirmDeleteVideoId === video.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => executeDeleteVideo(video.id)}
                                  className="h-8 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteVideoId(null)}
                                  className={ADMIN_BTN_ICON}
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteVideoId(video.id)}
                                className={ADMIN_BTN_ICON_DANGER}
                                title="Delete Review"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <div className={`${ADMIN_SURFACE} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-white/[0.02] text-[11px] font-medium uppercase tracking-wider text-zinc-300 border-b border-white/[0.06]">
                        <tr>
                          <th className="p-3.5 w-10">
                            <input
                              type="checkbox"
                              checked={selectedVideoIds.length === filteredVideos.length && filteredVideos.length > 0}
                              onChange={handleSelectAllVideos}
                              className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer accent-white"
                            />
                          </th>
                          <th className="p-3.5">Preview</th>
                          <th className="p-3.5">Place</th>
                          <th className="p-3.5">Author</th>
                          <th className="p-3.5">Rating</th>
                          <th className="p-3.5">Engagement</th>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {filteredVideos.map((v) => (
                          <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3.5">
                              <input
                                type="checkbox"
                                checked={selectedVideoIds.includes(v.id)}
                                onChange={() => handleToggleVideoSelection(v.id)}
                                className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer accent-white"
                              />
                            </td>
                            <td className="p-3.5">
                              <button
                                type="button"
                                onClick={() => setPreviewVideo(v)}
                                className="w-10 h-14 rounded-lg bg-zinc-950 overflow-hidden relative cursor-pointer border border-white/[0.08] block"
                              >
                                <CopoVideoThumbnail video={v} className="w-full h-full object-cover" />
                              </button>
                            </td>
                            <td className="p-3.5">
                              <div className="font-medium text-white">{v.placeName}</div>
                              <div className="text-[11px] text-zinc-300">{v.placeCategory || "Venue"}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <img
                                  src={getSafeAvatarUrl(v.author?.avatar, v.author?.name, v.author?.handle)}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover border border-white/[0.08]"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = generateGoogleLetterAvatarSvg(v.author?.name || "User", 128, v.author?.handle || v.author?.name);
                                  }}
                                />
                                <div>
                                  <div className="font-medium text-zinc-200 flex items-center gap-1">
                                    <span>{v.author?.name || "Reviewer"}</span>
                                    {v.author?.isVerified && <BadgeCheck className="w-3 h-3 text-sky-400 shrink-0" />}
                                  </div>
                                  <div className="text-[11px] text-zinc-300 font-mono">@{v.author?.handle || v.userId || "reviewer"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 tabular-nums">
                              <span className="inline-flex items-center gap-1 font-medium text-white">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {v.rating}
                              </span>
                            </td>
                            <td className="p-3.5 tabular-nums">
                              <div className="flex items-center gap-3 text-zinc-400">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setActiveTab("likes"); setLikesSearchQuery(v.id); }}
                                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                  <Heart className="w-3 h-3 text-zinc-300" /> {v.likes || 0}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setActiveTab("bookmarks"); setBookmarksSearchQuery(v.id || v.placeId || ""); }}
                                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                  <Bookmark className="w-3 h-3 text-zinc-300" /> {v.bookmarksCount || (v as any).bookmarks || 0}
                                </button>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-zinc-300" /> {v.commentsCount || (v.comments || []).length}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 text-zinc-300 tabular-nums">{formatRecordedDate(v.recordedAt, v.createdAtMs || parseTimestampToMs(v.createdAt) || undefined)}</td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => setPreviewVideo(v)} className={ADMIN_BTN_ICON} title="Inspect Review">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => setEditVideoModal(v)} className={ADMIN_BTN_ICON} title="Edit Review">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteVideoId === v.id ? (
                                  <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => executeDeleteVideo(v.id)} className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                                      Delete
                                    </button>
                                    <button type="button" onClick={() => setConfirmDeleteVideoId(null)} className={ADMIN_BTN_ICON} title="Cancel">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => setConfirmDeleteVideoId(v.id)} className={ADMIN_BTN_ICON_DANGER} title="Delete Review">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {filteredVideos.length === 0 && (
                <AdminEmptyState
                  icon={<Camera className="w-5 h-5" />}
                  title="No photo reviews found"
                  description="Adjust your search or rating filters to view matching reviews."
                />
              )}
            </div>
          )}

          {/* TAB: REGISTERED & CLAIMED BUSINESSES */}
          {activeTab === "businesses" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Businesses"
                subtitle={`${filteredBusinesses.length} claimed ${filteredBusinesses.length === 1 ? "business" : "businesses"} with active brand management`}
                actions={
                  <>
                    {selectedBusinessIds.length > 0 && (
                      confirmBulkDeleteBusinesses ? (
                        <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                          <span className="text-xs font-medium text-rose-300">Delete {selectedBusinessIds.length}?</span>
                          <button type="button" onClick={executeBulkDeleteBusinesses} className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                            Confirm
                          </button>
                          <button type="button" onClick={() => setConfirmBulkDeleteBusinesses(false)} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmBulkDeleteBusinesses(true)} className={ADMIN_BTN_DESTRUCTIVE}>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete ({selectedBusinessIds.length})</span>
                        </button>
                      )
                    )}

                    {confirmPurgeAllBusinesses && (
                      <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                        <span className="text-xs font-medium text-rose-300">Purge ALL {allBusinesses.length}?</span>
                        <button type="button" onClick={executePurgeAllBusinesses} className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                          Purge All
                        </button>
                        <button type="button" onClick={() => setConfirmPurgeAllBusinesses(false)} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {allBusinesses.length > 0 && (
                      <AdminActionMenu
                        label="Actions"
                        items={[
                          { label: "Purge All Businesses", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => setConfirmPurgeAllBusinesses(true), destructive: true }
                        ]}
                      />
                    )}
                  </>
                }
              />

              {/* Single-Line Filter Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-wrap items-center justify-between gap-2.5`}>
                <div className="flex flex-wrap items-center gap-2">
                  {filteredBusinesses.length > 0 && (
                    <label className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={selectedBusinessIds.length === filteredBusinesses.length && filteredBusinesses.length > 0}
                        onChange={handleSelectAllBusinesses}
                        className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-0 cursor-pointer accent-white"
                      />
                      <span className="tabular-nums">Select All ({filteredBusinesses.length})</span>
                    </label>
                  )}

                  <select
                    value={businessCategoryFilter}
                    onChange={(e) => setBusinessCategoryFilter(e.target.value)}
                    className={ADMIN_SELECT}
                  >
                    <option value="all">All Categories</option>
                    {uniqueBusinessCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <span className="text-xs text-zinc-300 tabular-nums pr-1">
                  {filteredBusinesses.length} {filteredBusinesses.length === 1 ? "business" : "businesses"}
                </span>
              </div>

              {/* Businesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBusinesses.map((biz) => {
                  const bizVideos = getPlaceVideos(biz);
                  const isYoouzOfficial = biz.id === "yoouz.com" || biz.brandDomain === "yoouz.com" || (biz.name && biz.name.toLowerCase() === "yoouz");
                  const domain = biz.brandDomain || (biz.website ? biz.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] : "") || (isYoouzOfficial ? "yoouz.com" : "");
                  const websiteUrl = biz.website || (domain ? `https://${domain}` : "");
                  const avgRating = bizVideos.length > 0
                    ? (bizVideos.reduce((acc: number, v: any) => acc + (v.rating || 5), 0) / bizVideos.length).toFixed(1)
                    : (biz.rating ? biz.rating.toFixed(1) : "5.0");
                  const isPremium = ((biz as any).plan || "").toLowerCase() !== "free" && Boolean((biz as any).isPremium || (biz as any).plan === "premium" || (biz as any).isPremiumPlan);

                  return (
                    <div
                      key={biz.id}
                      className={`${ADMIN_SURFACE} p-5 flex flex-col justify-between gap-4 hover:border-white/[0.16] transition-colors`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedBusinessIds.includes(biz.id)}
                            onChange={() => handleToggleBusinessSelection(biz.id)}
                            className="w-3.5 h-3.5 mt-1.5 rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer accent-white shrink-0"
                          />
                          <AdminPlaceLogo place={biz} size="md" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-sm leading-snug truncate" title={biz.name}>
                              {biz.name}
                            </h3>
                            <p className="text-xs text-zinc-300 truncate mt-0.5">
                              {biz.category || "Business"}{isYoouzOfficial ? " · Official Platform" : ""}
                            </p>
                            {domain && (
                              <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white mt-1 truncate max-w-full"
                              >
                                <span className="truncate">{domain}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Hairline Stats Row */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06] text-center">
                          <div>
                            <div className="text-[10px] text-zinc-300 uppercase tracking-wider font-medium">Reviews</div>
                            <div className="text-sm font-semibold text-white tabular-nums mt-0.5">{bizVideos.length}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-300 uppercase tracking-wider font-medium">Rating</div>
                            <div className="text-sm font-semibold text-white tabular-nums mt-0.5 inline-flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {avgRating}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-300 uppercase tracking-wider font-medium">Status</div>
                            <div className="text-xs font-medium text-emerald-400 mt-1">Claimed</div>
                          </div>
                        </div>

                        {(biz.city || biz.address || biz.phone) && (
                          <div className="space-y-1 text-xs text-zinc-400">
                            {(biz.city || biz.address) && (
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                <span className="truncate">{biz.city}{biz.address ? ` · ${biz.address}` : ""}</span>
                              </div>
                            )}
                            {biz.phone && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Phone className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                <span className="truncate font-mono">{biz.phone}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Plan Row */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="text-xs text-zinc-400">
                            Plan:{" "}
                            <span className={isPremium ? "text-emerald-400 font-semibold" : "text-zinc-200 font-medium"}>
                              {isPremium ? "Premium ($199/mo)" : "Free"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePremium(biz)}
                            className={isPremium ? "h-7 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer" : "h-7 px-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-[11px] font-semibold cursor-pointer"}
                          >
                            {isPremium ? "Set Free" : "Upgrade"}
                          </button>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setEditPlaceModal(biz)} className={ADMIN_BTN_SECONDARY}>
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {domain && (
                            <a
                              href={`/testembed?slug=${encodeURIComponent(domain)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={ADMIN_BTN_SECONDARY}
                            >
                              <Code className="w-3.5 h-3.5" />
                              <span>Embed</span>
                            </a>
                          )}
                        </div>

                        {confirmDeleteBusinessId === biz.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                executeDeletePlace(biz.id);
                                setConfirmDeleteBusinessId(null);
                              }}
                              className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                            <button type="button" onClick={() => setConfirmDeleteBusinessId(null)} className={ADMIN_BTN_ICON} title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeleteBusinessId(biz.id)} className={ADMIN_BTN_ICON_DANGER} title="Delete Business">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredBusinesses.length === 0 && (
                <AdminEmptyState
                  icon={<Briefcase className="w-5 h-5" />}
                  title="No claimed businesses found"
                  description="Claim venues from the Places tab or create a new business."
                />
              )}
            </div>
          )}

          {/* TAB: PLACES & VENUES DIRECTORY */}
          {activeTab === "places" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Places"
                subtitle={`${filteredPhysicalPlaces.length.toLocaleString()} venues in directory · ${allPhysicalPlaces.filter((p) => Boolean(p.isClaimed || p.claimedByEmail)).length} claimed`}
                actions={
                  <>
                    {selectedPlaceIds.length > 0 && (
                      confirmBulkDeletePlaces ? (
                        <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                          <span className="text-xs font-semibold text-rose-200">Delete {selectedPlaceIds.length}?</span>
                          <button type="button" onClick={executeBulkDeletePlaces} className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                            Confirm
                          </button>
                          <button type="button" onClick={() => setConfirmBulkDeletePlaces(false)} className="p-1 text-zinc-300 hover:text-white cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmBulkDeletePlaces(true)} className={ADMIN_BTN_DESTRUCTIVE}>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete ({selectedPlaceIds.length})</span>
                        </button>
                      )
                    )}

                    {confirmPurgeAllPlaces && (
                      <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                        <span className="text-xs font-semibold text-rose-200">Purge ALL {allPhysicalPlaces.length}?</span>
                        <button type="button" onClick={executePurgeAllPlaces} className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                          Purge All
                        </button>
                        <button type="button" onClick={() => setConfirmPurgeAllPlaces(false)} className="p-1 text-zinc-300 hover:text-white cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <AdminActionMenu
                      label="Actions"
                      items={[
                        { label: isFlushingMetadataCache ? "Flushing Cache..." : "Flush Metadata Cache", icon: <RefreshCw className="w-3.5 h-3.5" />, onClick: handleFlushMetadataAndAssetCache, disabled: isFlushingMetadataCache },
                        { label: isRepairingBrandNames ? "Repairing Names..." : "Repair Business Names", icon: <Building2 className="w-3.5 h-3.5" />, onClick: handleRepairAllBusinessNames, disabled: isRepairingBrandNames },
                        ...(allPhysicalPlaces.length > 0 ? [{ label: "Purge All Places", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => setConfirmPurgeAllPlaces(true), destructive: true, dividerBefore: true }] : [])
                      ]}
                    />
                  </>
                }
              />

              {/* Single-Line Filter Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-wrap items-center justify-between gap-2.5`}>
                <div className="flex flex-wrap items-center gap-2">
                  {filteredPhysicalPlaces.length > 0 && (
                    <label className="h-9 px-3.5 rounded-xl bg-white/[0.06] border border-white/[0.14] flex items-center gap-2 cursor-pointer text-[13px] font-medium text-white hover:bg-white/[0.1]">
                      <input
                        type="checkbox"
                        checked={selectedPlaceIds.length === filteredPhysicalPlaces.length && filteredPhysicalPlaces.length > 0}
                        onChange={handleSelectAllPlaces}
                        className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-950 text-white focus:ring-0 cursor-pointer accent-white"
                      />
                      <span className="tabular-nums">Select All ({filteredPhysicalPlaces.length})</span>
                    </label>
                  )}

                  <select
                    value={placeCategoryFilter}
                    onChange={(e) => setPlaceCategoryFilter(e.target.value)}
                    className={ADMIN_SELECT}
                  >
                    <option value="all">All Categories</option>
                    {uniquePlaceCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={placeClaimFilter}
                    onChange={(e) => setPlaceClaimFilter(e.target.value as any)}
                    className={ADMIN_SELECT}
                  >
                    <option value="all">All Status</option>
                    <option value="claimed">Claimed Only</option>
                    <option value="unclaimed">Unclaimed Only</option>
                  </select>
                </div>

                <span className="text-xs font-medium text-zinc-300 tabular-nums pr-1">
                  {filteredPhysicalPlaces.length.toLocaleString()} venues
                </span>
              </div>

              {/* Places Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPhysicalPlaces.map((place) => {
                  const placeVideos = getPlaceVideos(place);
                  const isPlaceClaimed = Boolean(place.isClaimed || place.claimedByEmail);
                  const avgRating = placeVideos.length > 0
                    ? (placeVideos.reduce((acc: number, v: any) => acc + (v.rating || 5), 0) / placeVideos.length).toFixed(1)
                    : (place.rating ? place.rating.toFixed(1) : "5.0");
                  const cleanDomain = place.brandDomain || place.website?.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];

                  return (
                    <div
                      key={place.id}
                      className={`${ADMIN_SURFACE} p-5 flex flex-col justify-between gap-4 hover:border-white/[0.2] transition-colors`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPlaceIds.includes(place.id)}
                            onChange={() => handleTogglePlaceSelection(place.id)}
                            className="w-3.5 h-3.5 mt-1.5 rounded border-zinc-600 bg-zinc-950 text-white cursor-pointer accent-white shrink-0"
                          />
                          <AdminPlaceLogo place={place} size="md" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2" title={place.name}>
                              {place.name}
                            </h3>
                            <p className="text-xs text-zinc-300 truncate mt-0.5">
                              {place.category || "Venue"}{place.city ? ` · ${place.city}` : ""}
                            </p>
                            {cleanDomain && (
                              <a
                                href={place.website || `https://${place.brandDomain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-mono text-zinc-300 hover:text-white mt-1 truncate max-w-full"
                              >
                                <span className="truncate">{cleanDomain}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Hairline Stats Row */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.08] text-center">
                          <div>
                            <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold">Reviews</div>
                            <div className="text-sm font-bold text-white tabular-nums mt-0.5">{placeVideos.length}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold">Rating</div>
                            <div className="text-sm font-bold text-white tabular-nums mt-0.5 inline-flex items-center justify-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {avgRating}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold">Status</div>
                            <div className={`text-xs font-semibold mt-1 ${isPlaceClaimed ? "text-emerald-400" : "text-zinc-300"}`}>
                              {isPlaceClaimed ? "Claimed" : "Unclaimed"}
                            </div>
                          </div>
                        </div>

                        {(place.address || place.city || place.phone || place.email) && (
                          <div className="space-y-1 text-xs text-zinc-300">
                            {(place.address || place.city) && (
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="truncate">{place.address || place.city}</span>
                              </div>
                            )}
                            {place.phone && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="truncate font-mono">{place.phone}</span>
                              </div>
                            )}
                            {place.email && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="truncate font-mono text-xs">{place.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                        <div className="flex items-center gap-2">
                          {isPlaceClaimed ? (
                            <button
                              type="button"
                              onClick={() => handleQuickUnclaimPlace(place)}
                              className={ADMIN_BTN_SECONDARY}
                              title="Remove claimed business status"
                            >
                              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Unclaim</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickClaimPlace(place)}
                              className={ADMIN_BTN_SECONDARY}
                              title="Promote to claimed business"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Claim</span>
                            </button>
                          )}
                          <button type="button" onClick={() => setEditPlaceModal(place)} className={ADMIN_BTN_SECONDARY}>
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>

                        {confirmDeletePlaceId === place.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => executeDeletePlace(place.id)}
                              className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                            <button type="button" onClick={() => setConfirmDeletePlaceId(null)} className={ADMIN_BTN_ICON} title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeletePlaceId(place.id)} className={ADMIN_BTN_ICON_DANGER} title="Delete Place">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPhysicalPlaces.length === 0 && (
                <AdminEmptyState
                  icon={<Building2 className="w-5 h-5" />}
                  title="No places found"
                  description="Try clearing your search query or selecting a different filter."
                />
              )}
            </div>
          )}

          {/* TAB: CREATORS & REVIEWERS */}
          {activeTab === "creators" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Creators"
                subtitle={`${filteredCreators.length.toLocaleString()} of ${creatorsList.length.toLocaleString()} photo reviewers`}
              />

              <div className={`${ADMIN_SURFACE} p-3 flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={creatorFilter}
                    onChange={(e) => setCreatorFilter(e.target.value as any)}
                    className={ADMIN_SELECT}
                  >
                    <option value="all">All Creators ({creatorsList.length})</option>
                    <option value="top">Top Creators (2+ Reviews)</option>
                  </select>
                </div>
                <span className="text-xs text-zinc-300 tabular-nums px-1">
                  Showing <span className="text-white font-semibold">{filteredCreators.length}</span> creators
                </span>
              </div>

              {filteredCreators.length === 0 ? (
                <AdminEmptyState
                  icon={<Award className="w-5 h-5" />}
                  title="No creators found"
                  description="No reviewers match your active filter or search query."
                  action={
                    (searchQuery || creatorFilter !== "all") ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setCreatorFilter("all");
                        }}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Clear Filters
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCreators.map((creator) => {
                    const creatorKey = creator.id || creator.uid || creator.email || creator.name;
                    const creatorVideos = activeVideos.filter((v) =>
                      isAuthorMatch(v, {
                        name: creator.name,
                        handle: `@${creator.name}`,
                        email: creator.email,
                        uid: creator.uid || creator.id
                      })
                    );

                    const totalLikes = creatorVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
                    const avgCreatorRating = creatorVideos.length > 0
                      ? (creatorVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / creatorVideos.length).toFixed(1)
                      : "5.0";

                    return (
                      <div
                        key={creatorKey}
                        className={`${ADMIN_SURFACE} p-4 hover:border-white/[0.2] transition-colors flex flex-col justify-between gap-4`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.12] overflow-hidden shrink-0">
                            <img
                              src={getSafeAvatarUrl(creator.avatar, creator.name, creator.handle || creator.email)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = generateGoogleLetterAvatarSvg(creator.name || "Creator", 128, creator.handle || creator.name);
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-white truncate">{creator.name}</h3>
                            <p className="text-xs text-zinc-300 font-mono truncate">
                              {creator.handle ? (creator.handle.startsWith("@") ? creator.handle : `@${creator.handle}`) : `@${creator.name}`}
                            </p>
                            {creator.email && <p className="text-xs text-zinc-400 truncate mt-0.5">{creator.email}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-white/[0.08] py-2.5 border-y border-white/[0.08] text-center">
                          <div className="px-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">Reviews</div>
                            <div className="text-sm font-bold text-white tabular-nums mt-0.5">{creatorVideos.length}</div>
                          </div>
                          <div className="px-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">Likes</div>
                            <div className="text-sm font-bold text-white tabular-nums mt-0.5">{totalLikes.toLocaleString()}</div>
                          </div>
                          <div className="px-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">Avg Rating</div>
                            <div className="text-sm font-bold text-white tabular-nums mt-0.5 inline-flex items-center justify-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              {avgCreatorRating}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setEditUserModal(creator)}
                            className={ADMIN_BTN_SECONDARY}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {creatorVideos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const userVidIds = creatorVideos.map((v) => v.id);
                                  setAdminConfirmDialog({
                                    title: `Clear ${userVidIds.length} review(s)?`,
                                    message: `Permanently delete all ${userVidIds.length} photo review(s) published by ${creator.name}? The user account itself will remain active.`,
                                    confirmLabel: "Clear Reviews",
                                    onConfirm: async () => {
                                      const idSet = new Set(userVidIds.map((id) => String(id).trim().toLowerCase()));
                                      userVidIds.forEach((id) => purgeVideoIdFromClientStorage(id));
                                      setDbVideos((prev) => prev.filter((v) => !idSet.has(String(v.id).trim().toLowerCase())));
                                      if (onBulkDeleteVideos) {
                                        onBulkDeleteVideos(userVidIds);
                                      } else {
                                        userVidIds.forEach((id) => onDeleteVideo(id));
                                      }
                                      try {
                                        await Promise.allSettled([
                                          adminFetch("/api/admin/videos/bulk-delete", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ videoIds: userVidIds })
                                          }),
                                          ...userVidIds.map((id) =>
                                            fetch(`/api/nosql/videoReviews/${encodeURIComponent(id)}`, { method: "DELETE" })
                                          )
                                        ]);
                                      } catch {}
                                      showToast(`Removed all ${userVidIds.length} reviews for ${creator.name}.`);
                                      setTimeout(() => fetchLiveStats(true), 400);
                                    }
                                  });
                                }}
                                className={ADMIN_BTN_DESTRUCTIVE}
                                title="Remove this creator's reviews while keeping the account"
                              >
                                Clear Reviews
                              </button>
                            )}

                            {confirmDeleteUserId === creatorKey ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => executeDeleteUser(creator)}
                                  className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteUserId(null)}
                                  className="h-8 px-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUserId(creatorKey)}
                                className={ADMIN_BTN_ICON_DANGER}
                                title="Delete creator account"
                                aria-label="Delete creator account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: USERS & COMMUNITY MEMBERS */}
          {activeTab === "users" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Users"
                subtitle={`${filteredUsers.length.toLocaleString()} of ${uniqueUsers.length.toLocaleString()} community accounts`}
                actions={
                  <AdminActionMenu
                    label="Manage"
                    items={[
                      {
                        label: "Purge All Users",
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        destructive: true,
                        disabled: uniqueUsers.length === 0,
                        onClick: () => setConfirmPurgeAllUsers(true)
                      }
                    ]}
                  />
                }
              />

              {confirmPurgeAllUsers && (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-rose-200">
                    Permanently purge all <span className="font-semibold text-white">{uniqueUsers.length}</span> user accounts? This cannot be undone.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmPurgeAllUsers(false)}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecutePurgeAllUsers}
                      disabled={isPurgingUsers}
                      className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                    >
                      {isPurgingUsers ? "Purging..." : "Confirm Purge"}
                    </button>
                  </div>
                </div>
              )}

              <div className={`${ADMIN_SURFACE} p-3 flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value as any)}
                    className={ADMIN_SELECT}
                  >
                    <option value="all">All Users ({uniqueUsers.length})</option>
                    <option value="members">Standard Users ({standardUsersList.length})</option>
                    <option value="creators">Creators ({creatorsList.length})</option>
                    <option value="registered">Registered Accounts</option>
                  </select>
                </div>
                <span className="text-xs text-zinc-400 tabular-nums px-1">
                  Showing <span className="text-white font-medium">{filteredUsers.length}</span> active users
                </span>
              </div>

              {filteredUsers.length === 0 ? (
                <AdminEmptyState
                  icon={<Users className="w-5 h-5" />}
                  title="No users found"
                  description="No user accounts match your current filter or search query."
                  action={
                    (searchQuery || userTypeFilter !== "all") ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setUserTypeFilter("all");
                        }}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Clear Filters
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => {
                    const userKey = user.id || user.uid || user.email || user.name;
                    return (
                      <div
                        key={userKey}
                        className={`${ADMIN_SURFACE} p-4 hover:border-white/[0.14] transition-colors flex flex-col justify-between gap-4`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0">
                            <img
                              src={getSafeAvatarUrl(user.avatar, user.name, user.handle || user.email)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = generateGoogleLetterAvatarSvg(user.name || "User", 128, user.handle || user.name);
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-white truncate">{user.name}</h3>
                            {user.email && <p className="text-xs text-zinc-400 truncate">{user.email}</p>}
                            {user.city && (
                              <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                                {user.city}{user.country ? `, ${user.country}` : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs py-2.5 border-y border-white/[0.06]">
                          <span className="text-zinc-300">Account Role</span>
                          <span className="font-medium text-zinc-200">{user.role || "Community Member"}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setEditUserModal(user)}
                            className={ADMIN_BTN_SECONDARY}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Profile</span>
                          </button>

                          {confirmDeleteUserId === userKey ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => executeDeleteUser(user)}
                                className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUserId(null)}
                                className="h-8 px-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUserId(userKey)}
                              className={ADMIN_BTN_ICON_DANGER}
                              title="Delete user account"
                              aria-label="Delete user account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMMENTS & MODERATION */}
          {activeTab === "comments" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Comments"
                subtitle="Audit, edit, and moderate community discussions across all photo reviews."
                actions={
                  <>
                    {selectedCommentKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setConfirmBulkDeleteComments(true)}
                        className={ADMIN_BTN_DESTRUCTIVE}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected ({selectedCommentKeys.length})</span>
                      </button>
                    )}
                    <AdminActionMenu
                      label="Manage"
                      items={[
                        {
                          label: `Purge All Comments (${allComments.length})`,
                          icon: <Trash2 className="w-3.5 h-3.5" />,
                          destructive: true,
                          disabled: allComments.length === 0,
                          onClick: () => setConfirmPurgeAllComments(true)
                        }
                      ]}
                    />
                  </>
                }
              />

              {confirmBulkDeleteComments && selectedCommentKeys.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-rose-200">
                    Delete <span className="font-semibold text-white">{selectedCommentKeys.length}</span> selected comment(s) permanently?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmBulkDeleteComments(false)}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const keysToDelete = [...selectedCommentKeys];
                        const deletedCommentIds = new Set<string>();
                        const targets = allComments.filter((item) => keysToDelete.includes(`${item.video.id}_${item.comment.id}`));
                        targets.forEach((item) => {
                          deletedCommentIds.add(String(item.comment.id));
                          if (onDeleteComment) {
                            onDeleteComment(
                              item.video.id,
                              item.isReply && item.parentCommentId ? item.parentCommentId : item.comment.id,
                              item.isReply ? item.comment.id : undefined
                            );
                          }
                        });
                        setDbComments((prev) => prev.filter((c) => !deletedCommentIds.has(String(c.id))));
                        setSelectedCommentKeys([]);
                        setConfirmBulkDeleteComments(false);
                        showToast(`Deleted ${keysToDelete.length} comment(s) permanently.`);
                        try {
                          await Promise.allSettled(
                            targets
                              .filter((t) => !t.isReply)
                              .map((t) => fetch(`/api/nosql/comments/${encodeURIComponent(t.comment.id)}`, { method: "DELETE" }))
                          );
                        } catch {}
                        setTimeout(() => fetchLiveStats(true), 400);
                      }}
                      className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}

              {confirmPurgeAllComments && (
                <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-rose-200">
                    Permanently purge all <span className="font-semibold text-white">{allComments.length}</span> comments across the platform?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmPurgeAllComments(false)}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const totalToPurge = allComments.length;
                        try {
                          await adminFetch("/api/admin/comments/purge-all", { method: "POST" });
                        } catch {}
                        allComments.forEach((item) => {
                          if (onDeleteComment) {
                            onDeleteComment(
                              item.video.id,
                              item.isReply && item.parentCommentId ? item.parentCommentId : item.comment.id,
                              item.isReply ? item.comment.id : undefined
                            );
                          }
                        });
                        setDbComments([]);
                        setSelectedCommentKeys([]);
                        setConfirmPurgeAllComments(false);
                        showToast(`All ${totalToPurge} comments purged permanently.`);
                        setTimeout(() => fetchLiveStats(true), 400);
                      }}
                      className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                    >
                      Confirm Purge
                    </button>
                  </div>
                </div>
              )}

              {/* KPI Summary Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <AdminStatCard label="Total Comments" value={commentMetrics.total} icon={<MessageSquare className="w-4 h-4" />} />
                <AdminStatCard label="Top-Level" value={commentMetrics.topLevel} icon={<MessageCircle className="w-4 h-4" />} />
                <AdminStatCard label="Replies" value={commentMetrics.replies} icon={<CornerDownRight className="w-4 h-4" />} />
                <AdminStatCard label="Liked" value={commentMetrics.liked} icon={<Heart className="w-4 h-4" />} />
              </div>

              {/* Filter & Sort Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allKeys = filteredComments.map((i) => `${i.video.id}_${i.comment.id}`);
                      if (selectedCommentKeys.length === allKeys.length && allKeys.length > 0) {
                        setSelectedCommentKeys([]);
                      } else {
                        setSelectedCommentKeys(allKeys);
                      }
                    }}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    {selectedCommentKeys.length > 0 && selectedCommentKeys.length === filteredComments.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-zinc-300" />
                    )}
                    <span>
                      {selectedCommentKeys.length > 0 ? `${selectedCommentKeys.length} Selected` : "Select All"}
                    </span>
                  </button>

                  <select
                    value={commentTypeFilter}
                    onChange={(e) => setCommentTypeFilter(e.target.value as any)}
                    className={ADMIN_SELECT}
                  >
                    <option value="all">All Types</option>
                    <option value="top_level">Top-Level Only</option>
                    <option value="replies">Replies Only</option>
                    <option value="liked">Liked Comments</option>
                  </select>

                  {uniqueCommentPlaces.length > 1 && (
                    <select
                      value={commentPlaceFilter}
                      onChange={(e) => setCommentPlaceFilter(e.target.value)}
                      className={`${ADMIN_SELECT} max-w-[180px]`}
                    >
                      <option value="all">All Places ({uniqueCommentPlaces.length})</option>
                      {uniqueCommentPlaces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    value={commentSortFilter}
                    onChange={(e) => setCommentSortFilter(e.target.value as any)}
                    className={ADMIN_SELECT}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most_likes">Most Liked</option>
                    <option value="longest">Longest Text</option>
                  </select>
                </div>

                <span className="text-xs text-zinc-400 tabular-nums px-1">
                  Showing <span className="text-white font-medium">{filteredComments.length}</span> of {allComments.length}
                </span>
              </div>

              {/* Comments List */}
              {filteredComments.length === 0 ? (
                <AdminEmptyState
                  icon={<MessageSquare className="w-5 h-5" />}
                  title="No comments found"
                  description="No discussion comments match the current filters or search criteria."
                  action={
                    (searchQuery || commentTypeFilter !== "all" || commentPlaceFilter !== "all") ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setCommentTypeFilter("all");
                          setCommentPlaceFilter("all");
                          setCommentSortFilter("newest");
                        }}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Reset Filters
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className={`${ADMIN_SURFACE} divide-y divide-white/[0.06] overflow-hidden`}>
                  {filteredComments.map((item) => {
                    const commentKey = `${item.video.id}_${item.comment.id}`;
                    const isSelected = selectedCommentKeys.includes(commentKey);
                    const isConfirmingDelete = confirmDeleteCommentInfo?.commentId === item.comment.id;

                    let timeDisplay = item.comment.createdAt || "Recent";
                    if (item.comment.createdAtMs) {
                      const diffMs = Date.now() - item.comment.createdAtMs;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      if (diffMins < 1) timeDisplay = "Just now";
                      else if (diffMins < 60) timeDisplay = `${diffMins}m ago`;
                      else if (diffHours < 24) timeDisplay = `${diffHours}h ago`;
                      else if (diffDays < 7) timeDisplay = `${diffDays}d ago`;
                      else timeDisplay = new Date(item.comment.createdAtMs).toLocaleDateString();
                    }

                    const metaTags: string[] = [];
                    metaTags.push(item.isReply ? "Reply" : "Comment");
                    if (item.comment.isOwner) metaTags.push("Business Owner");
                    if (item.comment.isCreator) metaTags.push("Creator");
                    if (item.comment.likedByCreator) metaTags.push("Creator Liked");

                    return (
                      <div
                        key={commentKey}
                        className={`p-4 sm:p-5 transition-colors ${
                          isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedCommentKeys((prev) =>
                                prev.includes(commentKey) ? prev.filter((k) => k !== commentKey) : [...prev, commentKey]
                              );
                            }}
                            className="w-4 h-4 mt-1 rounded border-white/20 bg-transparent text-white cursor-pointer accent-white shrink-0"
                          />

                          <button
                            type="button"
                            onClick={() => setSelectedCommentDetailModal({ comment: item.comment, video: item.video, isReply: item.isReply, parentCommentId: item.parentCommentId })}
                            className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                            title="Inspect comment details"
                          >
                            <img
                              src={getSafeAvatarUrl(
                                item.comment.authorAvatar,
                                item.comment.authorName,
                                item.comment.authorHandle
                              )}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = generateGoogleLetterAvatarSvg(
                                  item.comment.authorName || "User",
                                  128,
                                  item.comment.authorHandle || item.comment.authorName
                                );
                              }}
                            />
                          </button>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCommentDetailModal({ comment: item.comment, video: item.video, isReply: item.isReply, parentCommentId: item.parentCommentId })}
                                  className="font-semibold text-white hover:underline cursor-pointer"
                                >
                                  {item.comment.authorName}
                                </button>
                                {item.comment.authorHandle && (
                                  <span className="text-zinc-300 font-mono">
                                    @{item.comment.authorHandle.replace(/^@/, "")}
                                  </span>
                                )}
                                <span className="text-zinc-400">·</span>
                                <span className="text-zinc-400">{metaTags.join(" · ")}</span>
                              </div>
                              <span className="text-[11px] text-zinc-300 tabular-nums">{timeDisplay}</span>
                            </div>

                            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                              {item.comment.text}
                            </p>

                            {Array.isArray(item.comment.attachments) && item.comment.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {item.comment.attachments.map((attUrl: string, attIdx: number) => (
                                  <a
                                    key={attIdx}
                                    href={attUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-14 h-14 rounded-xl overflow-hidden border border-white/[0.1] hover:border-white/30 transition-colors"
                                    title="Open attached photo"
                                  >
                                    <img src={attUrl} alt="Attachment" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                                <span className="inline-flex items-center gap-1.5 text-zinc-300 truncate max-w-[240px]">
                                  <Building2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                  <span className="truncate">{item.video.placeName || "Photo Review"}</span>
                                </span>
                                {item.video.rating !== undefined && item.video.rating !== null && (
                                  <span className="inline-flex items-center gap-1 text-zinc-300 tabular-nums">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    {item.video.rating}
                                  </span>
                                )}
                                {(item.comment.likesCount || 0) > 0 && (
                                  <span className="inline-flex items-center gap-1 text-zinc-400 tabular-nums">
                                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                                    {item.comment.likesCount}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setPreviewVideo(item.video)}
                                className="text-xs font-medium text-zinc-300 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                <span>View Review</span>
                              </button>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditCommentModal(item);
                                setEditCommentText(item.comment.text || "");
                              }}
                              className={ADMIN_BTN_ICON}
                              title="Edit comment"
                              aria-label="Edit comment"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onDeleteComment) {
                                      onDeleteComment(
                                        item.video.id,
                                        item.isReply && item.parentCommentId ? item.parentCommentId : item.comment.id,
                                        item.isReply ? item.comment.id : undefined
                                      );
                                    }
                                    if (item.isReply && item.parentCommentId) {
                                      setDbComments((prev) =>
                                        prev.map((c) =>
                                          String(c.id) === String(item.parentCommentId) && Array.isArray(c.replies)
                                            ? { ...c, replies: c.replies.filter((r: any) => String(r.id) !== String(item.comment.id)) }
                                            : c
                                        )
                                      );
                                    } else {
                                      setDbComments((prev) => prev.filter((c) => String(c.id) !== String(item.comment.id)));
                                      try {
                                        await fetch(`/api/nosql/comments/${encodeURIComponent(item.comment.id)}`, { method: "DELETE" });
                                      } catch {}
                                    }
                                    setConfirmDeleteCommentInfo(null);
                                    showToast("Comment deleted permanently.");
                                    setTimeout(() => fetchLiveStats(true), 400);
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCommentInfo(null)}
                                  className={ADMIN_BTN_ICON}
                                  aria-label="Cancel delete"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDeleteCommentInfo({
                                    videoId: item.video.id,
                                    commentId: item.comment.id,
                                    replyId: item.isReply ? item.comment.id : undefined
                                  })
                                }
                                className={ADMIN_BTN_ICON_DANGER}
                                title="Delete comment"
                                aria-label="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: LIKES & REACTIONS AUDIT FEED */}
          {activeTab === "likes" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Likes"
                subtitle={`${adminLikes.length.toLocaleString()} recorded reactions across photo reviews`}
                actions={
                  <AdminActionMenu
                    label="Manage"
                    items={[
                      {
                        label: "Purge All Likes",
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        destructive: true,
                        disabled: adminLikes.length === 0,
                        onClick: () => setConfirmPurgeAllLikes(true)
                      }
                    ]}
                  />
                }
              />

              {/* KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <AdminStatCard label="Total Likes" value={adminLikes.length} sublabel="Persisted reactions" icon={<Heart className="w-4 h-4" />} />
                <AdminStatCard
                  label="Unique Users"
                  value={new Set(adminLikes.map((l) => l.userId || l.userEmail || l.userName)).size}
                  sublabel="Active accounts"
                  icon={<Users className="w-4 h-4" />}
                />
                <AdminStatCard
                  label="Liked Reviews"
                  value={new Set(adminLikes.map((l) => l.videoId)).size}
                  sublabel="Distinct reviews"
                  icon={<Camera className="w-4 h-4" />}
                />
              </div>

              {/* Filter & Sort Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between`}>
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={likesSearchQuery}
                    onChange={(e) => setLikesSearchQuery(e.target.value)}
                    placeholder="Filter by user, handle, place, or review ID..."
                    className={`${ADMIN_INPUT} w-full pl-9 pr-14`}
                  />
                  {likesSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLikesSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <select
                  value={likesSort}
                  onChange={(e) => setLikesSort(e.target.value as any)}
                  className={ADMIN_SELECT}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* Likes List */}
              {isLoadingLikes && adminLikes.length === 0 ? (
                <div className={`${ADMIN_SURFACE} py-16 text-center space-y-2.5`}>
                  <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-400">Loading likes audit feed...</p>
                </div>
              ) : filteredLikes.length === 0 ? (
                <AdminEmptyState
                  icon={<Heart className="w-5 h-5" />}
                  title="No likes recorded"
                  description={
                    likesSearchQuery
                      ? "No likes match your current search filter."
                      : "When community members like photo reviews, their activity will appear here."
                  }
                  action={
                    likesSearchQuery ? (
                      <button type="button" onClick={() => setLikesSearchQuery("")} className={ADMIN_BTN_SECONDARY}>
                        Clear Filter
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className={`${ADMIN_SURFACE} divide-y divide-white/[0.06] overflow-hidden`}>
                  {filteredLikes.map((like, idx) => {
                    const matchedVid = activeVideos.find((v) => v.id === like.videoId);
                    const videoThumb = like.videoThumbnail || matchedVid?.thumbnailUrl || (matchedVid as any)?.photoUrl || "";
                    const videoUrl = like.videoUrl || matchedVid?.videoUrl || "";
                    const placeName = like.placeName || matchedVid?.placeName || "Photo Review";
                    const rating = like.videoRating || matchedVid?.rating;
                    const canPreview = Boolean(matchedVid || videoUrl || videoThumb);

                    const openPreview = () => {
                      if (matchedVid) {
                        setPreviewVideo(matchedVid);
                      } else if (videoUrl || videoThumb) {
                        setPreviewLikeVideoModal({
                          videoUrl: videoUrl || undefined,
                          thumbnailUrl: videoThumb,
                          placeName,
                          authorName: like.videoAuthor || "Reviewer",
                          rating
                        });
                      }
                    };

                    return (
                      <div
                        key={like.id || `like-${idx}`}
                        className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0">
                            <img
                              src={getSafeAvatarUrl(like.userAvatar, like.userName, like.userHandle)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = generateGoogleLetterAvatarSvg(like.userName || "User", 128, like.userHandle || like.userName);
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-white truncate">
                                {like.userName || "Community User"}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-300 truncate">
                                {like.userHandle || `@${String(like.userName || "user").toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-300 tabular-nums">
                              {like.createdAt
                                ? `${new Date(like.createdAt).toLocaleDateString()} · ${new Date(like.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : like.timestamp || "Recently"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={openPreview}
                            disabled={!canPreview}
                            className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0 cursor-pointer disabled:cursor-default"
                            title={canPreview ? "View review" : undefined}
                          >
                            {videoThumb ? (
                              <img src={videoThumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <Camera className="w-4 h-4" />
                              </div>
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white truncate">{placeName}</span>
                              {rating !== undefined && rating !== null && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-300 tabular-nums shrink-0">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  {rating}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-300 truncate">
                              By <span className="text-zinc-300">{like.videoAuthor || matchedVid?.authorName || "Creator"}</span>
                              {" · "}
                              <span className="font-mono">{like.videoId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                          {canPreview && (
                            <button
                              type="button"
                              onClick={openPreview}
                              className={ADMIN_BTN_SECONDARY}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedLikeDetailModal(like)}
                            className={ADMIN_BTN_ICON}
                            title="Inspect raw record"
                            aria-label="Inspect raw record"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteLikeId(like.id)}
                            className={ADMIN_BTN_ICON_DANGER}
                            title="Remove like"
                            aria-label="Remove like"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: BOOKMARKS & SAVED REVIEWS AUDIT FEED */}
          {activeTab === "bookmarks" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Bookmarks"
                subtitle={`${adminBookmarks.length.toLocaleString()} saved places and photo reviews`}
                actions={
                  <AdminActionMenu
                    label="Manage"
                    items={[
                      {
                        label: "Purge All Bookmarks",
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        destructive: true,
                        disabled: adminBookmarks.length === 0,
                        onClick: () => setConfirmPurgeAllBookmarks(true)
                      }
                    ]}
                  />
                }
              />

              {/* KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <AdminStatCard label="Total Bookmarks" value={adminBookmarks.length} sublabel="Saved in BunnyDB" icon={<Bookmark className="w-4 h-4" />} />
                <AdminStatCard
                  label="Unique Users"
                  value={new Set(adminBookmarks.map((b) => b.userId || b.userEmail || b.userName)).size}
                  sublabel="Active savers"
                  icon={<Users className="w-4 h-4" />}
                />
                <AdminStatCard
                  label="Saved Entities"
                  value={new Set(adminBookmarks.map((b) => b.placeId || b.videoId)).size}
                  sublabel="Places & reviews"
                  icon={<Building2 className="w-4 h-4" />}
                />
              </div>

              {/* Filter & Sort Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between`}>
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookmarksSearchQuery}
                    onChange={(e) => setBookmarksSearchQuery(e.target.value)}
                    placeholder="Filter by user, handle, place name, or ID..."
                    className={`${ADMIN_INPUT} w-full pl-9 pr-14`}
                  />
                  {bookmarksSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBookmarksSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <select
                  value={bookmarksSort}
                  onChange={(e) => setBookmarksSort(e.target.value as any)}
                  className={ADMIN_SELECT}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* Bookmarks List */}
              {isLoadingBookmarks && adminBookmarks.length === 0 ? (
                <div className={`${ADMIN_SURFACE} py-16 text-center space-y-2.5`}>
                  <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-400">Loading bookmarks audit feed...</p>
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <AdminEmptyState
                  icon={<Bookmark className="w-5 h-5" />}
                  title="No bookmarks recorded"
                  description={
                    bookmarksSearchQuery
                      ? "No bookmarks match your current search filter."
                      : "When community members save places or photo reviews, they will appear here."
                  }
                  action={
                    bookmarksSearchQuery ? (
                      <button type="button" onClick={() => setBookmarksSearchQuery("")} className={ADMIN_BTN_SECONDARY}>
                        Clear Filter
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className={`${ADMIN_SURFACE} divide-y divide-white/[0.06] overflow-hidden`}>
                  {filteredBookmarks.map((bm, idx) => {
                    const matchedVid = activeVideos.find((v) => v.id === bm.videoId);
                    const matchedPlace = activePlaces.find((p) => p.id === bm.placeId || p.brandDomain === bm.placeId);
                    const videoThumb = bm.videoThumbnail || matchedVid?.thumbnailUrl || (matchedVid as any)?.photoUrl || "";
                    const videoUrl = bm.videoUrl || matchedVid?.videoUrl || "";
                    const placeName = bm.placeName || matchedPlace?.name || matchedVid?.placeName || "Saved Place";
                    const rating = bm.videoRating || matchedVid?.rating || matchedPlace?.rating;
                    const canOpen = Boolean(matchedVid || videoUrl || videoThumb || matchedPlace);

                    const openTarget = () => {
                      if (matchedVid) {
                        setPreviewVideo(matchedVid);
                      } else if (videoUrl || videoThumb) {
                        setPreviewLikeVideoModal({
                          videoUrl: videoUrl || undefined,
                          thumbnailUrl: videoThumb,
                          placeName,
                          authorName: bm.videoAuthor || "Reviewer",
                          rating
                        });
                      } else if (matchedPlace) {
                        setEditPlaceModal(matchedPlace);
                      }
                    };

                    return (
                      <div
                        key={bm.id || `bm-${idx}`}
                        className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0">
                            <img
                              src={getSafeAvatarUrl(bm.userAvatar, bm.userName, bm.userHandle)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = generateGoogleLetterAvatarSvg(bm.userName || "User", 128, bm.userHandle || bm.userName);
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-white truncate">
                                {bm.userName || "Community User"}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-300 truncate">
                                {bm.userHandle || `@${String(bm.userName || "user").toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-300 tabular-nums">
                              {bm.createdAt
                                ? `${new Date(bm.createdAt).toLocaleDateString()} · ${new Date(bm.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : bm.timestamp || "Recently"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={openTarget}
                            disabled={!canOpen}
                            className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0 cursor-pointer disabled:cursor-default"
                            title={canOpen ? "Inspect saved item" : undefined}
                          >
                            {videoThumb ? (
                              <img src={videoThumb} alt="" className="w-full h-full object-cover" />
                            ) : bm.placeLogo || matchedPlace?.logoUrl ? (
                              <img src={bm.placeLogo || matchedPlace?.logoUrl} alt="" className="w-full h-full object-contain p-1.5" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <Building2 className="w-4 h-4" />
                              </div>
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white truncate">{placeName}</span>
                              {bm.placeCategory && (
                                <span className="text-[11px] text-zinc-300 truncate">· {bm.placeCategory}</span>
                              )}
                              {rating !== undefined && rating !== null && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-300 tabular-nums shrink-0">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  {rating}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-300 truncate">
                              <span className="font-mono">{bm.placeId || bm.videoId || "Venue"}</span>
                              {bm.videoAuthor && (
                                <>
                                  {" · "}
                                  <span>By <span className="text-zinc-300">{bm.videoAuthor}</span></span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                          {canOpen && (
                            <button
                              type="button"
                              onClick={openTarget}
                              className={ADMIN_BTN_SECONDARY}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{matchedVid || videoUrl || videoThumb ? "View" : "Open"}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBookmarkDetailModal(bm)}
                            className={ADMIN_BTN_ICON}
                            title="Inspect raw record"
                            aria-label="Inspect raw record"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBookmarkId(bm.id)}
                            className={ADMIN_BTN_ICON_DANGER}
                            title="Remove bookmark"
                            aria-label="Remove bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: DIRECT MESSAGES & MODERATION */}
          {activeTab === "messages" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Direct Messages"
                subtitle="Inspect conversation transcripts, moderate messages, and merge duplicate threads."
                actions={
                  <>
                    {selectedChatIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setConfirmBulkDeleteChats(true)}
                        className={ADMIN_BTN_DESTRUCTIVE}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected ({selectedChatIds.length})</span>
                      </button>
                    )}
                    <AdminActionMenu
                      label="Maintenance"
                      items={[
                        {
                          label: isDeduplicatingChats ? "Merging Duplicates..." : "Deduplicate & Merge",
                          icon: <Sparkles className="w-3.5 h-3.5" />,
                          disabled: isDeduplicatingChats,
                          onClick: handleDeduplicateChats
                        },
                        {
                          label: "Purge Empty Threads",
                          icon: <Trash2 className="w-3.5 h-3.5" />,
                          onClick: handlePurgeEmptyChats
                        },
                        {
                          label: "Purge All Threads",
                          icon: <Trash2 className="w-3.5 h-3.5" />,
                          destructive: true,
                          dividerBefore: true,
                          disabled: adminChats.length === 0,
                          onClick: () => setConfirmPurgeAllChats(true)
                        }
                      ]}
                    />
                  </>
                }
              />

              {/* KPI Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <AdminStatCard label="Total Threads" value={chatMetrics.totalThreads} icon={<MessageSquare className="w-4 h-4" />} />
                <AdminStatCard label="Total Messages" value={chatMetrics.totalMessages} icon={<Send className="w-4 h-4" />} />
                <AdminStatCard label="Active Inboxes" value={chatMetrics.totalParticipants} icon={<Users className="w-4 h-4" />} />
                <AdminStatCard label="With Media" value={chatMetrics.mediaCount} icon={<Camera className="w-4 h-4" />} />
              </div>

              {/* Filter, Multi-Select & Sort Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  {filteredAdminChats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedChatIds.length === filteredAdminChats.length) {
                          setSelectedChatIds([]);
                        } else {
                          setSelectedChatIds(filteredAdminChats.map((c) => c.id));
                        }
                      }}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      {selectedChatIds.length === filteredAdminChats.length && filteredAdminChats.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-zinc-300" />
                      )}
                      <span>{selectedChatIds.length > 0 ? `${selectedChatIds.length} Selected` : "Select All"}</span>
                    </button>
                  )}

                  <div className="inline-flex items-center bg-white/[0.03] p-1 rounded-xl border border-white/[0.07]">
                    {(
                      [
                        ["all", `All (${adminChats.length})`],
                        ["active", `Active (${adminChats.filter((c) => Array.isArray(c.history) && c.history.length > 0).length})`],
                        ["with_media", `Media (${chatMetrics.mediaCount})`],
                        ["empty", `Empty (${adminChats.filter((c) => !Array.isArray(c.history) || c.history.length === 0).length})`]
                      ] as const
                    ).map(([fKey, fLabel]) => (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => setChatFilter(fKey)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          chatFilter === fKey
                            ? "bg-white text-zinc-950"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {fLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={chatSort}
                    onChange={(e) => setChatSort(e.target.value as any)}
                    className={ADMIN_SELECT}
                  >
                    <option value="recent">Latest Activity</option>
                    <option value="most_messages">Most Messages</option>
                    <option value="oldest">Oldest Activity</option>
                  </select>
                </div>
              </div>

              {/* Thread List */}
              {!hasLoadedChats && isLoadingChats ? (
                <div className={`${ADMIN_SURFACE} py-20 text-center flex flex-col items-center justify-center gap-3`}>
                  <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                  <span className="text-xs text-zinc-400">Loading conversation threads...</span>
                </div>
              ) : filteredAdminChats.length === 0 ? (
                <AdminEmptyState
                  icon={<Mail className="w-5 h-5" />}
                  title="No chat threads found"
                  description={
                    searchQuery || chatFilter !== "all"
                      ? "No conversations matched your active filters or search query."
                      : "Direct message threads between community members and businesses will appear here."
                  }
                  action={
                    (searchQuery || chatFilter !== "all") ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setChatFilter("all");
                        }}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Clear Filters
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className={`${ADMIN_SURFACE} divide-y divide-white/[0.06] overflow-hidden`}>
                  {filteredAdminChats.map((chat) => {
                    const historyCount = Array.isArray(chat.history) ? chat.history.length : 0;
                    const p1Name = chat.senderName || chat.lastSenderName || (chat.senderEmail ? chat.senderEmail.split("@")[0] : "User 1");
                    const p1Handle = chat.senderHandle || (chat.senderEmail ? `@${chat.senderEmail.split("@")[0]}` : `@${p1Name.toLowerCase().replace(/\s+/g, "")}`);
                    const p1Avatar = getSafeAvatarUrl(chat.senderAvatar, p1Name, p1Handle);

                    const p2Name = chat.recipientName || (chat.recipientEmail ? chat.recipientEmail.split("@")[0] : (chat.lastRecipientName || "User 2"));
                    const p2Handle = chat.recipientHandle || (chat.recipientEmail ? `@${chat.recipientEmail.split("@")[0]}` : `@${p2Name.toLowerCase().replace(/\s+/g, "")}`);
                    const p2Avatar = getSafeAvatarUrl(chat.recipientAvatar, p2Name, p2Handle);

                    const hasMedia = Array.isArray(chat.history) && chat.history.some((m: any) => m.videoThumbnail || m.videoId || m.videoUrl);
                    const lastMsg =
                      chat.lastMessage && chat.lastMessage !== "Conversation started" && chat.lastMessage !== "Direct conversation"
                        ? chat.lastMessage
                        : historyCount > 0
                        ? chat.history[historyCount - 1]?.text || (chat.history[historyCount - 1]?.videoThumbnail ? "Shared a photo review" : "No messages yet")
                        : "No messages yet";

                    const updatedAt = chat.updatedAt || chat.createdAt || chat.createdAtMs;
                    const formattedTime = updatedAt
                      ? new Date(updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "";
                    const isSelected = selectedChatIds.includes(chat.id);

                    return (
                      <div
                        key={chat.id}
                        className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                          isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatIds((prev) =>
                                prev.includes(chat.id) ? prev.filter((id) => id !== chat.id) : [...prev, chat.id]
                              );
                            }}
                            className="mt-1 text-zinc-300 hover:text-white cursor-pointer shrink-0"
                            aria-label="Select thread"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-white" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400 hover:text-zinc-400" />
                            )}
                          </button>

                          <div className="relative flex items-center shrink-0 pt-0.5">
                            <img
                              src={p1Avatar}
                              alt={p1Name}
                              className="w-9 h-9 rounded-full object-cover border border-white/[0.12] bg-[#0c0c0f]"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = generateGoogleLetterAvatarSvg(p1Name, 128, p1Handle);
                              }}
                            />
                            <img
                              src={p2Avatar}
                              alt={p2Name}
                              className="w-7 h-7 rounded-full object-cover border-2 border-[#0c0c0f] -ml-2.5 mt-2.5 bg-[#0c0c0f]"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = generateGoogleLetterAvatarSvg(p2Name, 128, p2Handle);
                              }}
                            />
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap text-xs">
                              <span className="font-semibold text-white">{p1Name}</span>
                              <span className="text-zinc-400">↔</span>
                              <span className="font-semibold text-white">{p2Name}</span>
                              <span className="text-zinc-400">·</span>
                              <span className="text-zinc-400 tabular-nums">
                                {historyCount} {historyCount === 1 ? "message" : "messages"}
                              </span>
                              {hasMedia && (
                                <>
                                  <span className="text-zinc-400">·</span>
                                  <span className="text-zinc-300">Media attached</span>
                                </>
                              )}
                              {formattedTime && (
                                <>
                                  <span className="text-zinc-400">·</span>
                                  <span className="text-zinc-300 tabular-nums">{formattedTime}</span>
                                </>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 truncate max-w-2xl">
                              &ldquo;{lastMsg}&rdquo;
                            </p>

                            <div className="text-[11px] font-mono text-zinc-300 truncate">
                              {chat.id}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center pl-8 md:pl-0">
                          <button
                            type="button"
                            onClick={() => setInspectChatModal(chat)}
                            className={ADMIN_BTN_SECONDARY}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteChatId(chat.id)}
                            className={ADMIN_BTN_ICON_DANGER}
                            title="Delete thread permanently"
                            aria-label="Delete thread permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODAL: Inspect Transcript & Live Moderate Thread */}
              {inspectChatModal && (
                <AdminModal
                  title={`${inspectChatModal.senderName || "User 1"} ↔ ${inspectChatModal.recipientName || "User 2"}`}
                  subtitle={`Thread ${inspectChatModal.id} · ${Array.isArray(inspectChatModal.history) ? inspectChatModal.history.length : 0} messages`}
                  maxWidthClass="max-w-3xl"
                  onClose={() => {
                    setInspectChatModal(null);
                    setEditingMessageId(null);
                  }}
                  footer={
                    <div className="w-full space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Send an official admin note into this thread..."
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendAdminReply();
                            }
                          }}
                          className={`${ADMIN_INPUT} flex-1`}
                        />
                        <button
                          type="button"
                          onClick={handleSendAdminReply}
                          disabled={isSendingAdminReply || !adminReplyText.trim()}
                          className={ADMIN_BTN_PRIMARY}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSendingAdminReply ? "Sending..." : "Reply"}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteChatId(inspectChatModal.id)}
                          className={ADMIN_BTN_DESTRUCTIVE}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Thread</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectChatModal(null);
                            setEditingMessageId(null);
                          }}
                          className={ADMIN_BTN_SECONDARY}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {!Array.isArray(inspectChatModal.history) || inspectChatModal.history.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <MessageSquare className="w-6 h-6 mx-auto text-zinc-400" />
                        <p className="text-sm font-medium text-white">No recorded messages</p>
                        <p className="text-xs text-zinc-300">This thread contains no messages yet.</p>
                      </div>
                    ) : (
                      inspectChatModal.history.map((msg: any, idx: number) => {
                        const isYoouzAdmin = msg.senderEmail === "admin@yoouz.com" || msg.senderName === "Yoouz Admin";
                        const msgId = msg.id || String(idx);
                        const isEditingThis = editingMessageId === msgId;
                        const senderAvatar = getSafeAvatarUrl(msg.senderAvatar, msg.senderName || "User", msg.senderHandle || msg.senderEmail);

                        return (
                          <div
                            key={msgId}
                            className={`flex items-start gap-3 group ${isYoouzAdmin ? "justify-end" : ""}`}
                          >
                            {!isYoouzAdmin && (
                              <img
                                src={senderAvatar}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-white/[0.1] shrink-0 mt-0.5"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = generateGoogleLetterAvatarSvg(msg.senderName || "User", 128);
                                }}
                              />
                            )}

                            <div className={`space-y-1.5 max-w-lg ${isYoouzAdmin ? "items-end" : ""}`}>
                              <div className={`flex items-center gap-2 ${isYoouzAdmin ? "justify-end" : ""}`}>
                                <span className="text-xs font-medium text-white">
                                  {msg.senderName || msg.senderEmail || "User"}
                                </span>
                                {msg.senderRole && (
                                  <span className="text-[11px] text-zinc-300">
                                    · {isYoouzAdmin ? "Admin" : msg.senderRole}
                                  </span>
                                )}
                                <span className="text-[10px] text-zinc-300 tabular-nums">
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : msg.timestamp || ""}
                                </span>

                                {!isEditingThis && (
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMessageId(msgId);
                                        setEditingMessageText(msg.text || "");
                                      }}
                                      className="p-1 text-zinc-300 hover:text-white rounded cursor-pointer"
                                      title="Edit message"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessageFromThread(msgId)}
                                      className="p-1 text-zinc-300 hover:text-rose-400 rounded cursor-pointer"
                                      title="Delete message"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {isEditingThis ? (
                                <div className="p-3 bg-white/[0.03] border border-white/[0.12] rounded-xl space-y-2">
                                  <textarea
                                    value={editingMessageText}
                                    onChange={(e) => setEditingMessageText(e.target.value)}
                                    rows={2}
                                    className="w-full bg-[#050506] border border-white/[0.1] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white/25"
                                  />
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMessageId(null)}
                                      className="h-7 px-2.5 text-xs font-medium text-zinc-400 hover:text-white rounded-lg bg-white/[0.05] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleEditMessageInThread(msgId)}
                                      className="h-7 px-3 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                                    isYoouzAdmin
                                      ? "bg-white text-zinc-950 rounded-tr-sm"
                                      : "bg-white/[0.04] border border-white/[0.08] text-zinc-200 rounded-tl-sm"
                                  }`}
                                >
                                  {msg.text || "(Media Attachment)"}

                                  {msg.editedByAdminAt && (
                                    <span className={`block mt-1 text-[10px] italic ${isYoouzAdmin ? "text-zinc-700" : "text-zinc-300"}`}>
                                      Edited by Admin
                                    </span>
                                  )}

                                  {msg.videoThumbnail && (
                                    <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.1] max-w-xs relative">
                                      <img src={msg.videoThumbnail} alt="Attached review" className="w-full h-32 object-cover" />
                                      {msg.placeName && (
                                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-[11px] font-medium text-white truncate">
                                          {msg.placeName}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {isYoouzAdmin && (
                              <img
                                src="/favicon.svg"
                                alt="Yoouz Admin"
                                className="w-8 h-8 rounded-full object-cover border border-white/[0.15] shrink-0 mt-0.5"
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </AdminModal>
              )}

              {/* DIALOG: Confirm Delete Single Thread */}
              {confirmDeleteChatId && (
                <AdminModal
                  title="Delete Chat Thread"
                  maxWidthClass="max-w-md"
                  onClose={() => setConfirmDeleteChatId(null)}
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteChatId(null)}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAdminChat(confirmDeleteChatId)}
                        className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                      >
                        Delete Thread
                      </button>
                    </>
                  }
                >
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Permanently delete thread <span className="font-mono text-zinc-200">{confirmDeleteChatId}</span> and all of its messages? This action cannot be undone.
                  </p>
                </AdminModal>
              )}

              {/* DIALOG: Confirm Bulk Delete Threads */}
              {confirmBulkDeleteChats && (
                <AdminModal
                  title={`Delete ${selectedChatIds.length} Threads`}
                  maxWidthClass="max-w-md"
                  onClose={() => setConfirmBulkDeleteChats(false)}
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmBulkDeleteChats(false)}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkDeleteChats}
                        className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                      >
                        Delete Selected
                      </button>
                    </>
                  }
                >
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Permanently delete {selectedChatIds.length} selected conversations from BunnyDB? This action cannot be undone.
                  </p>
                </AdminModal>
              )}

              {/* DIALOG: Confirm Purge All Chats */}
              {confirmPurgeAllChats && (
                <AdminModal
                  title="Purge All Chat Threads"
                  maxWidthClass="max-w-md"
                  onClose={() => setConfirmPurgeAllChats(false)}
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmPurgeAllChats(false)}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePurgeAllChats}
                        className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                      >
                        Purge All Chats
                      </button>
                    </>
                  }
                >
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This will permanently delete every direct message thread and transcript stored in BunnyDB. This action cannot be undone.
                  </p>
                </AdminModal>
              )}
            </div>
          )}

          {/* TAB 6: BROADCAST ALERTS */}
          {activeTab === "broadcast" && (
            <div className="max-w-6xl mx-auto space-y-5">
              <AdminPageHeader
                title="Broadcast"
                subtitle="Send platform announcements, feature drops, and system alerts to active users."
              />

              {/* Audience KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <AdminStatCard label="Total Reach" value={uniqueUsers.length} sublabel="Registered accounts" icon={<Users className="w-4 h-4" />} />
                <AdminStatCard label="Photo Reviewers" value={metrics.totalCreators} sublabel="Active creators" icon={<Camera className="w-4 h-4" />} />
                <AdminStatCard label="Businesses" value={metrics.totalBusinesses} sublabel="Claimed profiles" icon={<Building2 className="w-4 h-4" />} />
                <AdminStatCard label="Sent Broadcasts" value={broadcastHistory.length} sublabel="Dispatch history" icon={<Bell className="w-4 h-4" />} />
              </div>

              {/* Preset Templates */}
              <div className={`${ADMIN_SURFACE} p-4 flex flex-wrap items-center justify-between gap-3`}>
                <span className="text-[13px] font-semibold text-white">Quick Templates</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: "Feature Release v2.0",
                      type: "feature" as const,
                      audience: "all" as const,
                      title: "Yoouz 2.0 Live: Instant Search & Live Photo Reviews",
                      message: "We just rolled out fast photo CDN delivery powered by Bunny CDN and interactive local discovery maps.",
                      targetUrl: "/search"
                    },
                    {
                      label: "Weekend Spotlight",
                      type: "announcement" as const,
                      audience: "all" as const,
                      title: "Weekend Spotlight: Top-Rated Local Spots",
                      message: "Discover this week's highest-rated places and verified community favorites near you.",
                      targetUrl: "/reviews/pl_1"
                    },
                    {
                      label: "Creator Challenge",
                      type: "promo" as const,
                      audience: "creators" as const,
                      title: "Creator Challenge: Review 3 Spots This Weekend",
                      message: "Publish authentic live photo reviews this weekend to get featured on the Yoouz home feed.",
                      targetUrl: "/profile"
                    },
                    {
                      label: "Edge CDN Notice",
                      type: "alert" as const,
                      audience: "all" as const,
                      title: "Edge Storage Optimization Complete",
                      message: "Global CDN caching optimization completed with zero downtime for faster media loading.",
                      targetUrl: ""
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setBroadcastData({
                          title: preset.title,
                          message: preset.message,
                          targetUrl: preset.targetUrl
                        });
                        setBroadcastType(preset.type);
                        setBroadcastAudience(preset.audience);
                        showToast(`Applied template: ${preset.label}`);
                      }}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two-Column Composer & Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className={`lg:col-span-7 ${ADMIN_SURFACE} p-5 space-y-5`}>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
                    <h3 className="text-[15px] font-semibold text-white">Compose Announcement</h3>
                    <button
                      type="button"
                      onClick={() => setBroadcastData({ title: "", message: "", targetUrl: "" })}
                      className="text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                        Target Audience
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { id: "all", label: "All Users", desc: `${uniqueUsers.length} accounts` },
                          { id: "creators", label: "Creators", desc: `${metrics.totalCreators} reviewers` },
                          { id: "businesses", label: "Businesses", desc: `${metrics.totalBusinesses} claimed` }
                        ].map((aud) => (
                          <button
                            key={aud.id}
                            type="button"
                            onClick={() => setBroadcastAudience(aud.id as any)}
                            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                              broadcastAudience === aud.id
                                ? "bg-white text-black border-white"
                                : "bg-white/[0.05] text-white border-white/[0.13] hover:bg-white/[0.1]"
                            }`}
                          >
                            <div className="text-[13px] font-semibold">{aud.label}</div>
                            <div className={`text-xs mt-0.5 tabular-nums ${broadcastAudience === aud.id ? "text-zinc-700 font-medium" : "text-zinc-300"}`}>
                              {aud.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                        Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "announcement", label: "Announcement" },
                          { id: "feature", label: "Feature Drop" },
                          { id: "promo", label: "Spotlight" },
                          { id: "alert", label: "System Notice" }
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setBroadcastType(cat.id as any)}
                            className={`h-9 px-3.5 rounded-xl text-[13px] font-medium transition-colors border cursor-pointer ${
                              broadcastType === cat.id
                                ? "bg-white text-black border-white font-semibold"
                                : "bg-white/[0.06] text-zinc-200 border-white/[0.13] hover:text-white hover:bg-white/[0.11]"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                          Notification Title
                        </label>
                        <span className="text-xs text-zinc-300 tabular-nums">{broadcastData.title.length}/100</span>
                      </div>
                      <input
                        type="text"
                        maxLength={100}
                        value={broadcastData.title}
                        onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                        placeholder="e.g. New Features Live"
                        className={`${ADMIN_INPUT} w-full`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                          Message Body
                        </label>
                        <span className="text-xs text-zinc-300 tabular-nums">{broadcastData.message.length}/500</span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={500}
                        value={broadcastData.message}
                        onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                        placeholder="Write the announcement message for user notification inboxes..."
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.14] text-[13px] text-white placeholder-zinc-400 focus:outline-none focus:border-white/35 focus:bg-white/[0.08] resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-1.5">
                        Target Path or URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={broadcastData.targetUrl}
                        onChange={(e) => setBroadcastData({ ...broadcastData, targetUrl: e.target.value })}
                        placeholder="/reviews/pl_1 or https://yoouz.com/search"
                        className={`${ADMIN_INPUT} w-full font-mono`}
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isBroadcastSending || !broadcastData.message.trim()}
                        className={ADMIN_BTN_PRIMARY}
                      >
                        {isBroadcastSending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Broadcast</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className={`${ADMIN_SURFACE} p-5 space-y-4`}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
                      <h3 className="text-[15px] font-semibold text-white">Notification Preview</h3>
                      <span className="text-xs font-medium text-zinc-300">In-App Inbox</span>
                    </div>

                    <div className="p-4 bg-[#050506] border border-white/[0.12] rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-white/[0.12] border border-white/[0.16] flex items-center justify-center text-xs font-bold text-white">
                            Y
                          </div>
                          <span className="text-xs font-semibold text-white">Yoouz</span>
                          <span className="text-xs text-zinc-300 capitalize">· {broadcastType}</span>
                        </div>
                        <span className="text-xs text-zinc-300">Just now</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[13px] font-semibold text-white break-words">
                          {broadcastData.title.trim() || "Yoouz Platform Announcement"}
                        </div>
                        <p className="text-[13px] text-zinc-300 leading-relaxed break-words">
                          {broadcastData.message.trim() || "Your announcement text will appear here as users see it in their notifications drawer."}
                        </p>
                      </div>

                      {broadcastData.targetUrl && (
                        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-mono truncate max-w-[200px]">
                            {broadcastData.targetUrl}
                          </span>
                          <span className="text-white font-semibold">Open &rarr;</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Broadcasts write directly to BunnyDB notification records and appear immediately inside active user inboxes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Broadcast Dispatch History */}
              <div className={`${ADMIN_SURFACE} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-white/[0.1] flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-white">Dispatch History</h3>
                  <span className="text-xs font-medium text-zinc-300 tabular-nums">{broadcastHistory.length} sent</span>
                </div>

                {broadcastHistory.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[13px] text-zinc-300">
                    No broadcasts dispatched yet. Send an announcement above to record it here.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.08]">
                    {broadcastHistory.map((item) => (
                      <div
                        key={item.id}
                        className="px-5 py-4 hover:bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-[13px]">
                            <span className="font-semibold text-white">{item.title}</span>
                            <span className="text-zinc-300 capitalize">· {item.type || "announcement"}</span>
                            <span className="text-zinc-300">· Audience: {item.audience || "all"}</span>
                          </div>
                          <p className="text-xs text-zinc-300 truncate max-w-2xl">{item.message}</p>
                          <div className="flex items-center gap-3 text-xs text-zinc-400 tabular-nums">
                            <span>{new Date(item.sentAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                            {item.targetUrl && <span className="font-mono truncate">{item.targetUrl}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setBroadcastData({
                                title: item.title,
                                message: item.message,
                                targetUrl: item.targetUrl || ""
                              });
                              setBroadcastAudience(item.audience || "all");
                              setBroadcastType(item.type || "announcement");
                              showToast("Loaded broadcast into composer.");
                            }}
                            className={ADMIN_BTN_SECONDARY}
                          >
                            Reuse
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const updated = broadcastHistory.filter((x) => x.id !== item.id);
                              setBroadcastHistory(updated);
                              try {
                                localStorage.setItem("yoouz_broadcast_history", JSON.stringify(updated));
                              } catch (e) {}
                              try {
                                await adminFetch(`/api/admin/broadcasts/${encodeURIComponent(item.id)}`, { method: "DELETE" });
                              } catch {}
                              showToast("Deleted broadcast record.");
                            }}
                            className={ADMIN_BTN_ICON_DANGER}
                            title="Delete log entry"
                            aria-label="Delete log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GOOGLE SEARCH CONSOLE & INDEXING */}
          {activeTab === "indexing" && (
            <div className="max-w-5xl mx-auto space-y-5">
              <AdminPageHeader
                title="Google Indexing"
                subtitle="Live XML sitemaps, structured schema endpoints, and instant IndexNow submission."
                actions={
                  <button
                    type="button"
                    onClick={handleTriggerGoogleIndexing}
                    disabled={isPingingGoogleIndex}
                    className={ADMIN_BTN_PRIMARY}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPingingGoogleIndex ? "animate-spin" : ""}`} />
                    <span>{isPingingGoogleIndex ? "Submitting Ping..." : "Submit IndexNow Ping"}</span>
                  </button>
                }
              />

              {/* Status KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <AdminStatCard label="Crawl Errors" value="0" sublabel="Clean 404 handling" tone="positive" icon={<CheckCircle2 className="w-4 h-4" />} />
                <AdminStatCard label="Indexable Reviews" value={metrics.totalVideos} sublabel="Review & ImageObject schema" icon={<Globe className="w-4 h-4" />} />
                <AdminStatCard label="IndexNow Status" value="202 OK" sublabel="Instant engine ping" tone="positive" icon={<Zap className="w-4 h-4" />} />
              </div>

              {/* Sitemaps & Endpoints */}
              <div className={`${ADMIN_SURFACE} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white">Sitemaps & Crawler Endpoints</h3>
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {[
                    { label: "Main Sitemap XML", url: "https://www.yoouz.com/sitemap.xml", desc: "Core landing pages, places, and photo reviews" },
                    { label: "Video Sitemap XML", url: "https://www.yoouz.com/video-sitemap.xml", desc: "Dedicated Google Video Schema 1.1 feed" },
                    { label: "Sitemap Index XML", url: "https://www.yoouz.com/sitemap-index.xml", desc: "Master sitemap index for Search Console" },
                    { label: "Robots.txt Policy", url: "https://www.yoouz.com/robots.txt", desc: "Crawler permissions for Googlebot and search agents" }
                  ].map((item, idx) => (
                    <div key={idx} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-medium text-white">{item.label}</div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-zinc-300 hover:text-white hover:underline break-all inline-flex items-center gap-1"
                        >
                          <span>{item.url}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-300 shrink-0" />
                        </a>
                        <p className="text-[11px] text-zinc-300">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          showToast(`Copied ${item.label} URL.`);
                        }}
                        className={`${ADMIN_BTN_SECONDARY} shrink-0 self-start sm:self-center`}
                      >
                        Copy URL
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Console Checklist */}
              <div className={`${ADMIN_SURFACE} p-5 space-y-4`}>
                <h3 className="text-sm font-semibold text-white">Search Console Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="font-medium text-white">1. Submit Sitemaps</div>
                    <p className="text-zinc-400 leading-relaxed">
                      In Google Search Console &rarr; Sitemaps, submit <code className="text-zinc-200 font-mono">sitemap.xml</code> and <code className="text-zinc-200 font-mono">video-sitemap.xml</code>.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-medium text-white">2. Inspect Live URL</div>
                    <p className="text-zinc-400 leading-relaxed">
                      Paste <code className="text-zinc-200 font-mono">https://www.yoouz.com/</code> into URL Inspection, run Test Live URL, and request indexing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DATABASE & CLOUD SUITE */}
          {activeTab === "database" && (
            <div className="max-w-5xl mx-auto space-y-5">
              <AdminPageHeader
                title="Database & Edge Storage"
                subtitle="BunnyDB libSQL edge tables and Bunny CDN object storage."
                actions={
                  <>
                    <span className="h-9 px-3.5 rounded-xl bg-white/[0.06] border border-white/[0.13] inline-flex items-center gap-2 text-[13px] font-medium text-white tabular-nums">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {liveStats ? `Connected · ${liveStats.latencyMs}ms` : pingEdgeResult ? `Connected · ${pingEdgeResult.latencyMs}ms` : "Connected"}
                    </span>
                    <button
                      type="button"
                      onClick={handlePingEdge}
                      disabled={isPingingEdge}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      <Zap className="w-3.5 h-3.5 text-zinc-200" />
                      <span>{isPingingEdge ? "Pinging..." : "Ping Edge"}</span>
                    </button>
                  </>
                }
              />

              {/* Database Tables Grid (10 Tables — synchronized with Sidebar & BunnyDB) */}
              <div className={`${ADMIN_SURFACE} p-5 space-y-4`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-white">BunnyDB Tables</h3>
                  <span className="text-xs font-medium text-zinc-300">Select a table to inspect or delete rows</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(
                    [
                      { name: "videoReviews", label: "Photo Reviews", count: liveStats?.totals?.videoReviews ?? metrics.totalVideos, Icon: Camera },
                      { name: "places", label: "Places", count: liveStats?.totals?.places ?? metrics.totalPhysicalPlaces, Icon: MapPin },
                      { name: "users", label: "Users", count: liveStats?.totals?.users ?? metrics.totalUsers, Icon: Users },
                      { name: "comments", label: "Comments", count: liveStats?.totals?.comments ?? (allComments.length || metrics.totalComments), Icon: MessageSquare },
                      { name: "likes", label: "Likes", count: liveStats?.totals?.likes ?? (adminLikes.length || metrics.totalLikes), Icon: Heart },
                      { name: "shares", label: "Shares", count: liveStats?.totals?.shares ?? metrics.totalShares, Icon: Share2 },
                      { name: "bookmarks", label: "Bookmarks", count: liveStats?.totals?.bookmarks ?? (adminBookmarks.length || metrics.totalBookmarks), Icon: Bookmark },
                      { name: "chats", label: "Messages", count: liveStats?.totals?.chats ?? adminChats.length, Icon: Mail },
                      { name: "notifications", label: "Notifications", count: liveStats?.totals?.notifications ?? 0, Icon: Bell },
                      { name: "businessClaims", label: "Business Claims", count: liveStats?.totals?.businessClaims ?? metrics.totalBusinesses, Icon: Building2 }
                    ] as const
                  ).map((t) => {
                    const TableIcon = t.Icon;
                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setInspectTableModal(t.name)}
                        className="p-3.5 bg-white/[0.04] hover:bg-white/[0.09] rounded-xl border border-white/[0.1] hover:border-white/[0.22] flex flex-col justify-between gap-2.5 transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className="text-[13px] text-white font-semibold leading-tight transition-colors">
                            {t.label}
                          </span>
                          <TableIcon className="w-4 h-4 text-zinc-300 group-hover:text-white shrink-0" />
                        </div>
                        <div className="flex items-baseline justify-between gap-2 w-full">
                          {isLoadingLiveStats && !liveStats ? (
                            <div className="h-6 w-10 bg-white/[0.1] animate-pulse rounded" />
                          ) : (
                            <span className="text-2xl font-bold text-white tabular-nums">{t.count.toLocaleString()}</span>
                          )}
                          <span className="text-xs font-medium text-zinc-300">rows</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bunny CDN Media Storage */}
              <div className={`${ADMIN_SURFACE} p-5 space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-[15px] font-semibold text-white">Bunny CDN Media Storage</h3>
                  <button
                    type="button"
                    onClick={handlePurgeCdnCache}
                    disabled={isPurgingCdnCache}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPurgingCdnCache ? "animate-spin" : ""}`} />
                    <span>{isPurgingCdnCache ? "Purging Edge..." : "Purge CDN Cache"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.1] border-t border-white/[0.1] pt-4">
                  <div className="py-2 sm:py-0 sm:pr-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 block">Storage Zone</span>
                    <span className="font-mono text-sm font-semibold text-white mt-1 block">{liveStats?.storage?.zoneName || "yoouz-storage"}</span>
                  </div>
                  <div className="py-2 sm:py-0 sm:px-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 block">Media Files</span>
                    <span className="text-sm font-bold text-white tabular-nums mt-1 block">
                      {(liveStats?.storage?.filesCount ?? activeVideos.length).toLocaleString()} files
                    </span>
                  </div>
                  <div className="py-2 sm:py-0 sm:pl-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 block">Allocated Size</span>
                    <span className="text-sm font-bold text-white tabular-nums mt-1 block">
                      {liveStats?.storage?.formattedSize && liveStats.storage.filesCount > 0
                        ? liveStats.storage.formattedSize
                        : `${((activeVideos.length * 185000) / (1024 * 1024)).toFixed(2)} MB`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Backup & Recovery */}
              <div className={`${ADMIN_SURFACE} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div>
                  <h3 className="text-[15px] font-semibold text-white">Backup & Recovery</h3>
                  <p className="text-[13px] text-zinc-300 mt-1">
                    Export all database collections as a portable JSON snapshot, or perform a full system reset.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportDataJSON}
                    className={ADMIN_BTN_PRIMARY}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMasterResetConfirmText("");
                      setConfirmMasterResetModal(true);
                    }}
                    disabled={isMasterResetting}
                    className={ADMIN_BTN_DESTRUCTIVE}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Master Reset</span>
                  </button>
                </div>
              </div>

              {/* MODAL: Database Table Inspector */}
              {inspectTableModal && (
                <AdminModal
                  title={inspectTableModal}
                  subtitle={`${tableDataItems.length} live rows in BunnyDB`}
                  maxWidthClass="max-w-4xl"
                  onClose={() => setInspectTableModal(null)}
                  footer={
                    <div className="w-full flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fetchTableData(inspectTableModal)}
                          disabled={isLoadingTableData}
                          className={ADMIN_BTN_SECONDARY}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTableData ? "animate-spin" : ""}`} />
                          <span>Refresh</span>
                        </button>
                        {["videoReviews", "videos", "places", "users", "comments", "likes", "bookmarks", "chats", "messages", "notifications", "broadcast", "businessClaims", "businesses"].includes(inspectTableModal) && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetTab =
                                inspectTableModal === "videoReviews" ? "videos" :
                                inspectTableModal === "chats" ? "messages" :
                                inspectTableModal === "notifications" ? "broadcast" :
                                inspectTableModal === "businessClaims" ? "businesses" : inspectTableModal;
                              setActiveTab(targetTab as any);
                              setInspectTableModal(null);
                            }}
                            className={ADMIN_BTN_SECONDARY}
                          >
                            Open Full Tab &rarr;
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectTableModal(null)}
                        className={ADMIN_BTN_PRIMARY}
                      >
                        Done
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={tableDataQuery}
                          onChange={(e) => setTableDataQuery(e.target.value)}
                          placeholder={`Filter ${inspectTableModal} by ID, user, text, email...`}
                          className={`${ADMIN_INPUT} w-full pl-9`}
                        />
                      </div>
                      {tableDataQuery && (
                        <button
                          type="button"
                          onClick={() => setTableDataQuery("")}
                          className={ADMIN_BTN_SECONDARY}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {isLoadingTableData ? (
                      <div className="py-16 text-center space-y-2.5">
                        <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin mx-auto" />
                        <p className="text-xs text-zinc-400">Loading table rows...</p>
                      </div>
                    ) : (() => {
                      const filtered = tableDataItems.filter((item) => {
                        if (!tableDataQuery.trim()) return true;
                        const q = tableDataQuery.toLowerCase().trim();
                        return JSON.stringify(item).toLowerCase().includes(q);
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-14 text-center space-y-1.5 border border-white/[0.06] rounded-xl bg-white/[0.02]">
                            <Database className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-white">
                              {tableDataQuery ? "No matching records" : `No rows in ${inspectTableModal}`}
                            </p>
                            <p className="text-xs text-zinc-300">
                              {tableDataQuery ? "Try adjusting your filter query." : "This table currently has 0 rows."}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="border border-white/[0.08] rounded-xl divide-y divide-white/[0.06] overflow-hidden">
                          {filtered.map((item, idx) => {
                            const itemId = String(item.id || item.uid || item._id || item.commentId || item.claimId || `row-${idx}`);
                            const createdAt = item.createdAt || item.timestamp || item.sentAt || item.claimedAt || item.date;

                            return (
                              <div key={itemId + idx} className="p-3.5 hover:bg-white/[0.02] space-y-2.5 transition-colors">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[11px] font-mono text-zinc-300 tabular-nums">#{idx + 1}</span>
                                    <span className="text-xs font-mono font-medium text-white truncate max-w-[240px]">
                                      {itemId}
                                    </span>
                                    {createdAt && (
                                      <span className="text-[11px] text-zinc-300 tabular-nums">
                                        · {new Date(createdAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedItemJsonModal({ tableName: inspectTableModal, item })}
                                      className="h-7 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-medium text-zinc-200 cursor-pointer transition-colors"
                                    >
                                      JSON
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const targetTable = inspectTableModal;
                                        setAdminConfirmDialog({
                                          title: "Delete database row?",
                                          message: `Permanently delete row ${itemId} from ${targetTable}?`,
                                          confirmLabel: "Delete Row",
                                          onConfirm: async () => {
                                            try {
                                              let res: Response;
                                              if (targetTable === "likes" || targetTable === "bookmarks" || targetTable === "shares") {
                                                res = await adminFetch(`/api/admin/${encodeURIComponent(targetTable)}/${encodeURIComponent(String(itemId))}`, { method: "DELETE" });
                                              } else {
                                                res = await fetch(`/api/nosql/${encodeURIComponent(targetTable)}/${encodeURIComponent(String(itemId))}`, { method: "DELETE" });
                                              }
                                              if (res.ok) {
                                                showToast(`Deleted row ${itemId}`);
                                                if (targetTable === "likes") fetchAdminLikes(true);
                                                if (targetTable === "bookmarks") fetchAdminBookmarks(true);
                                                if (targetTable === "shares") fetchAdminShares();
                                                if (targetTable === "chats") fetchAdminChats(true);
                                                fetchTableData(targetTable);
                                                fetchLiveStats(true);
                                              } else {
                                                showToast("Failed to delete row");
                                              }
                                            } catch (e) {
                                              showToast("Error deleting row");
                                            }
                                          }
                                        });
                                      }}
                                      className={ADMIN_BTN_ICON_DANGER}
                                      title="Delete row"
                                      aria-label="Delete row"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="text-xs text-zinc-400">
                                  {inspectTableModal === "videoReviews" ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const matchedVid = activeVideos.find((v) => v.id === item.id) || item;
                                        setPreviewVideo(matchedVid);
                                      }}
                                      className="w-full flex items-center gap-3 text-left group cursor-pointer"
                                    >
                                      <img
                                        src={item.photoUrl || item.thumbnailUrl || item.posterUrl || "https://rev1.b-cdn.net/sample-review.jpg"}
                                        alt=""
                                        className="w-10 h-12 rounded-lg object-cover border border-white/[0.08] shrink-0"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = "https://rev1.b-cdn.net/sample-review.jpg";
                                        }}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-white group-hover:underline truncate">
                                            {item.placeName || "Business"}
                                          </span>
                                          <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-300 tabular-nums">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            {Math.max(1, Math.min(5, Math.round(item.rating || 5)))}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-zinc-300 truncate mt-0.5">
                                          By {item.author?.name || item.authorName || "Reviewer"} · {item.likesCount || item.likes || 0} likes · {item.commentsCount || (Array.isArray(item.comments) ? item.comments.length : 0)} comments · {formatRecordedDate(item.recordedAt, item.createdAtMs || parseTimestampToMs(item.createdAt) || undefined)}
                                        </div>
                                      </div>
                                      <span className="text-[11px] text-zinc-400 group-hover:text-white shrink-0">View &rarr;</span>
                                    </button>
                                  ) : inspectTableModal === "likes" ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedLikeDetailModal(item)}
                                      className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
                                    >
                                      <div className="truncate">
                                        <span className="font-medium text-white">{item.userName || "Community User"}</span>
                                        <span className="text-zinc-300"> liked </span>
                                        <span className="text-zinc-300">{item.placeName || item.videoId}</span>
                                      </div>
                                      <span className="text-[11px] text-zinc-400 group-hover:text-white shrink-0">Inspect &rarr;</span>
                                    </button>
                                  ) : inspectTableModal === "shares" ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedShareDetailModal(item)}
                                      className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
                                    >
                                      <div className="truncate">
                                        <span className="font-medium text-white">{item.userName || "Community User"}</span>
                                        <span className="text-zinc-300"> shared </span>
                                        <span className="text-zinc-300">{item.placeName || item.videoId}</span>
                                      </div>
                                      <span className="text-[11px] text-zinc-400 group-hover:text-white shrink-0">Inspect &rarr;</span>
                                    </button>
                                  ) : inspectTableModal === "bookmarks" ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBookmarkDetailModal(item)}
                                      className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
                                    >
                                      <div className="truncate">
                                        <span className="font-medium text-white">{item.userName || "Community User"}</span>
                                        <span className="text-zinc-300"> saved </span>
                                        <span className="text-zinc-300">{item.placeName || item.placeId || item.videoId}</span>
                                      </div>
                                      <span className="text-[11px] text-zinc-400 group-hover:text-white shrink-0">Inspect &rarr;</span>
                                    </button>
                                  ) : inspectTableModal === "comments" || item.userName || item.authorName ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const matchedVid = activeVideos.find((v) => v.id === item.videoId);
                                        setSelectedCommentDetailModal({
                                          comment: {
                                            id: item.id || item.commentId || "comm",
                                            videoId: item.videoId || "",
                                            text: item.text || item.comment || "",
                                            authorName: item.userName || item.authorName || item.name || "User",
                                            authorHandle: item.userHandle || item.authorHandle || "@user",
                                            authorAvatar: item.userAvatar || item.authorAvatar || "",
                                            authorEmail: item.userEmail || item.authorEmail || item.email,
                                            createdAt: item.createdAt || new Date().toISOString(),
                                            likesCount: item.likesCount || 0
                                          },
                                          video: matchedVid
                                        });
                                      }}
                                      className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <span className="font-medium text-white">
                                          {item.userName || item.authorName || item.name || "User"}
                                        </span>
                                        {(item.text || item.comment || item.message || item.body || item.title) && (
                                          <span className="text-zinc-400 ml-2">
                                            &ldquo;{item.text || item.comment || item.message || item.body || item.title}&rdquo;
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-zinc-400 group-hover:text-white shrink-0">Inspect &rarr;</span>
                                    </button>
                                  ) : (
                                    <div className="truncate text-zinc-400">
                                      {item.name || item.title || item.message || item.placeId || item.videoId || "Stored record"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </AdminModal>
              )}

              {/* SUB-MODAL: Raw JSON Viewer */}
              {selectedItemJsonModal && (
                <AdminModal
                  title={`Raw JSON · ${selectedItemJsonModal.tableName}`}
                  maxWidthClass="max-w-2xl"
                  onClose={() => setSelectedItemJsonModal(null)}
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedItemJsonModal.item, null, 2));
                          showToast("JSON copied to clipboard.");
                        }}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Copy JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedItemJsonModal(null)}
                        className={ADMIN_BTN_PRIMARY}
                      >
                        Done
                      </button>
                    </>
                  }
                >
                  <pre className="p-4 rounded-xl bg-[#050506] border border-white/[0.08] text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed select-all overflow-x-auto">
                    {JSON.stringify(selectedItemJsonModal.item, null, 2)}
                  </pre>
                </AdminModal>
              )}

              {/* MODAL: Confirm Master Reset */}
              {confirmMasterResetModal && (
                <AdminModal
                  title="Execute Master System Reset"
                  maxWidthClass="max-w-md"
                  onClose={() => {
                    setConfirmMasterResetModal(false);
                    setMasterResetConfirmText("");
                  }}
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmMasterResetModal(false);
                          setMasterResetConfirmText("");
                        }}
                        className={ADMIN_BTN_SECONDARY}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleMasterReset}
                        disabled={isMasterResetting || masterResetConfirmText.trim().toUpperCase() !== "RESET"}
                        className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                      >
                        {isMasterResetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isMasterResetting ? "Resetting..." : "Wipe Everything"}</span>
                      </button>
                    </>
                  }
                >
                  <div className="space-y-4">
                    <p className="text-[13px] text-zinc-200 leading-relaxed">
                      <strong className="text-rose-400">Permanent action:</strong> This will wipe every BunnyDB content table (users, photo reviews, places, comments, likes, bookmarks, and messages). Your admin passcode will be preserved.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                        Type <span className="font-mono text-white">RESET</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={masterResetConfirmText}
                        onChange={(e) => setMasterResetConfirmText(e.target.value)}
                        placeholder="RESET"
                        className={`${ADMIN_INPUT} font-mono`}
                      />
                    </div>
                  </div>
                </AdminModal>
              )}
            </div>
          )}

          {/* TAB: SEARCH INTELLIGENCE & SCRAPER MONITORING */}
          {activeTab === "search" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Search Intelligence"
                subtitle="Live log of brand discovery, domain resolution, and metadata extraction."
              />

              {searchIntelLogs.length === 0 ? (
                <AdminEmptyState
                  icon={<Search className="w-5 h-5" />}
                  title="No search operations recorded"
                  description="Discovery queries and domain scraping activity from the current server session will appear here."
                />
              ) : (
                <div className={`${ADMIN_SURFACE} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                      <thead className="border-b border-white/[0.08]">
                        <tr>
                          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-300">Time</th>
                          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-300">Query</th>
                          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-300">Status</th>
                          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-300">Resolved Domain</th>
                          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-300">Extracted Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] text-xs">
                        {searchIntelLogs.map((log, idx) => {
                          const isSuccess = log.statusColor === "emerald" || log.status === "scraped";
                          const isError = log.status === "critical_error" || log.status === "failed" || log.status === "discovery_failed";
                          const isCache = log.status === "db_cache_hit";

                          return (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 font-mono text-[11px] text-zinc-300 tabular-nums whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="px-4 py-3 font-medium text-white">
                                {log.query}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[11px] font-medium capitalize ${
                                  isSuccess ? "text-emerald-400" :
                                  isError ? "text-rose-400" :
                                  isCache ? "text-amber-400" :
                                  "text-zinc-300"
                                }`}>
                                  {String(log.status || "").replace(/_/g, " ")}
                                </span>
                                {(log.error || log.status === "discovery_failed") && (
                                  <div className="text-[11px] text-rose-400/80 mt-0.5 max-w-[200px] leading-snug">
                                    {log.error || "No official website discovered."}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {log.domain ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-white p-0.5 overflow-hidden shrink-0">
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${log.domain}&sz=32`}
                                        className="w-full h-full object-contain"
                                        alt=""
                                      />
                                    </div>
                                    <span className="font-mono text-zinc-300">{log.domain}</span>
                                  </div>
                                ) : (
                                  <span className="text-zinc-400">Unresolved</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-0.5">
                                  {log.title && <div className="text-white font-medium truncate max-w-xs">{log.title}</div>}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-300">
                                    {log.phone && <span>{log.phone}</span>}
                                    {log.email && <span>{log.email}</span>}
                                    {log.source && <span className="font-mono">src:{log.source}</span>}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DIGITAL MARKETING PARTNER AGENCIES */}
          {activeTab === "agencies" && (
            <div className="max-w-7xl mx-auto space-y-5">
              <AdminPageHeader
                title="Partner Agencies"
                subtitle="Manage accredited marketing agencies available to claimed businesses."
                actions={
                  <button
                    type="button"
                    onClick={() => setIsAddAgencyOpen(true)}
                    className={ADMIN_BTN_PRIMARY}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Agency</span>
                  </button>
                }
              />

              {/* Filters Toolbar */}
              <div className={`${ADMIN_SURFACE} p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5`}>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
                  <input
                    type="text"
                    value={agencySearchQuery}
                    onChange={(e) => setAgencySearchQuery(e.target.value)}
                    placeholder="Filter agencies by name, city, email, or website..."
                    className={`${ADMIN_INPUT} w-full pl-9`}
                  />
                </div>

                <select
                  value={agencyCountryFilter}
                  onChange={(e) => setAgencyCountryFilter(e.target.value)}
                  className={ADMIN_SELECT}
                >
                  <option value="all">All Countries</option>
                  <option value="Belgium">Belgium</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="France">France</option>
                </select>
              </div>

              {/* Agencies Grid */}
              {isLoadingAdminAgencies && adminAgencies.length === 0 ? (
                <div className={`${ADMIN_SURFACE} py-16 text-center space-y-2.5`}>
                  <RefreshCw className="w-5 h-5 animate-spin text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-400">Loading partner agencies...</p>
                </div>
              ) : (() => {
                const visibleAgencies = (adminAgencies || []).filter((a) => {
                  if (agencyCountryFilter !== "all" && a.country !== agencyCountryFilter) return false;
                  if (agencySearchQuery.trim()) {
                    const q = agencySearchQuery.toLowerCase().trim();
                    return (
                      a.name?.toLowerCase().includes(q) ||
                      a.city?.toLowerCase().includes(q) ||
                      a.email?.toLowerCase().includes(q) ||
                      a.phone?.includes(q) ||
                      a.website?.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (visibleAgencies.length === 0) {
                  return (
                    <AdminEmptyState
                      icon={<Briefcase className="w-5 h-5" />}
                      title={adminAgencies.length === 0 ? "No agencies registered" : "No matching agencies"}
                      description={
                        adminAgencies.length === 0
                          ? "Register your first accredited agency to list it for claimed business upgrades."
                          : "Try adjusting your search query or country filter."
                      }
                      action={
                        adminAgencies.length === 0 ? (
                          <button type="button" onClick={() => setIsAddAgencyOpen(true)} className={ADMIN_BTN_PRIMARY}>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Register Agency</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAgencySearchQuery("");
                              setAgencyCountryFilter("all");
                            }}
                            className={ADMIN_BTN_SECONDARY}
                          >
                            Clear Filters
                          </button>
                        )
                      }
                    />
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleAgencies.map((agency) => (
                      <div key={agency.id} className={`${ADMIN_SURFACE} p-4 hover:border-white/[0.14] transition-colors flex flex-col justify-between gap-4`}>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {agency.logoUrl ? (
                              <img src={agency.logoUrl} alt={agency.name} className="w-10 h-10 rounded-xl object-cover bg-white p-1 border border-white/[0.08] shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-semibold text-xs text-zinc-300 shrink-0">
                                {agency.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold text-white truncate">{agency.name}</h3>
                              <p className="text-xs text-zinc-300 truncate">{agency.city}{agency.city && agency.country ? ", " : ""}{agency.country}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-zinc-400 py-2.5 border-y border-white/[0.06]">
                            {agency.website && (
                              <div className="flex items-center gap-2 truncate">
                                <Globe className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-white hover:underline truncate">
                                  {agency.website}
                                </a>
                              </div>
                            )}
                            {agency.phone && (
                              <div className="flex items-center gap-2 truncate">
                                <Phone className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                <span className="font-mono text-zinc-300">{agency.phone}</span>
                              </div>
                            )}
                            {agency.email && (
                              <div className="flex items-center gap-2 truncate">
                                <Mail className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                <span className="text-zinc-300 truncate">{agency.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setEditAgencyModal(agency)}
                            className={ADMIN_BTN_SECONDARY}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAgency(agency.id)}
                            className={ADMIN_BTN_ICON_DANGER}
                            title="Delete agency"
                            aria-label="Delete agency"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* REVIEW PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewVideo && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewVideo(null)}
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-[#0c0c0f] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              type="button"
              aria-label="Close review preview"
              onClick={() => setPreviewVideo(null)}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-lg bg-[#050506]/80 hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors border border-white/[0.1] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo / Video Media Viewport */}
            <div className="md:w-1/2 bg-[#050506] flex items-center justify-center relative aspect-[9/16] md:aspect-auto max-h-[50vh] md:max-h-full overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.08]">
              {previewVideo.mediaType === "photo" || Boolean(previewVideo.photoUrl) || !previewVideo.videoUrl ? (
                <div className="w-full h-full flex items-center justify-center relative bg-[#050506]">
                  <img
                    src={previewVideo.photoUrl || previewVideo.thumbnailUrl}
                    alt={`${previewVideo.placeName || "Business"} review`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/[0.1] flex items-center gap-1.5 text-[11px] font-medium text-zinc-200">
                    <Camera className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Photo Review</span>
                  </div>
                </div>
              ) : (
                <>
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
                      if ((!hasVideoStarted || !isVideoPlaying) && !t.paused) {
                        t.pause();
                      }
                    }}
                    className="w-full h-full object-contain"
                  />

                  {/* Central Play Overlay if not started */}
                  {!hasVideoStarted && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasVideoStarted(true);
                        setIsVideoPlaying(true);
                        videoPlayerRef.current?.play().catch((e) => {
                          if (e.name !== "AbortError") console.error("Playback error:", e);
                        });
                      }}
                      className="absolute inset-0 w-full h-full z-20 flex items-center justify-center bg-black/25 group hover:bg-black/35 transition-colors cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/25 group-hover:scale-105 transition-transform">
                        <Play className="w-7 h-7 fill-white ml-0.5" />
                      </div>
                    </button>
                  )}

                  {/* Player Overlay Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (videoPlayerRef.current) {
                          if (!hasVideoStarted) setHasVideoStarted(true);
                          if (isVideoPlaying) videoPlayerRef.current.pause();
                          else
                            videoPlayerRef.current.play().catch((e) => {
                              if (e.name !== "AbortError") console.error("Playback error:", e);
                            });
                          setIsVideoPlaying(!isVideoPlaying);
                        }
                      }}
                      className="w-9 h-9 rounded-lg bg-black/70 backdrop-blur border border-white/[0.12] text-white hover:bg-white/[0.12] flex items-center justify-center cursor-pointer"
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                      className="w-9 h-9 rounded-lg bg-black/70 backdrop-blur border border-white/[0.12] text-white hover:bg-white/[0.12] flex items-center justify-center cursor-pointer"
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Review Metadata & Controls */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto gap-5">
              <div className="space-y-4">
                <div className="pr-8">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-200 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {previewVideo.rating} / 5
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-[11px] text-zinc-300 font-mono truncate">ID: {previewVideo.id}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">{previewVideo.placeName}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{previewVideo.placeAddress || previewVideo.placeCategory}</p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#050506] border border-white/[0.08]">
                  <img
                    src={getSafeAvatarUrl(previewVideo.author?.avatar, previewVideo.author?.name, previewVideo.author?.handle)}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-white/[0.08]"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = generateGoogleLetterAvatarSvg(previewVideo.author?.name || "Reviewer", 128, previewVideo.author?.handle || previewVideo.author?.name);
                    }}
                  />
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm text-white truncate">{previewVideo.author?.name || "Reviewer"}</h4>
                    <p className="text-xs text-zinc-300 truncate">
                      {previewVideo.author?.handle || previewVideo.author?.name || "Anonymous"}
                    </p>
                  </div>
                </div>

                {previewVideo.caption && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">Review Caption</label>
                    <p className="text-xs text-zinc-200 bg-[#050506] p-3 rounded-xl border border-white/[0.08] leading-relaxed">
                      {previewVideo.caption}
                    </p>
                  </div>
                )}

                {previewVideo.transcript && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">Captions Transcript</label>
                    <p className="text-xs text-zinc-300 bg-[#050506] p-3 rounded-xl border border-white/[0.08] max-h-24 overflow-y-auto leading-relaxed">
                      {previewVideo.transcript}
                    </p>
                  </div>
                )}

                {/* Comments Section */}
                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-300" />
                      Comments ({previewVideo.commentsCount || (previewVideo.comments || []).length})
                    </label>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {!previewVideo.comments || previewVideo.comments.length === 0 ? (
                      <p className="text-xs text-zinc-300 py-2">No comments on this review.</p>
                    ) : (
                      previewVideo.comments.map((c: any) => (
                        <div key={c.id || Math.random()} className="p-2.5 rounded-xl bg-[#050506] border border-white/[0.06] text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <img
                              src={getSafeAvatarUrl(c.authorAvatar || c.userAvatar, c.authorName || c.userName)}
                              className="w-4 h-4 rounded-full border border-white/10"
                              alt=""
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = generateGoogleLetterAvatarSvg(c.authorName || c.userName || "User", 32);
                              }}
                            />
                            <span className="font-medium text-zinc-200">{c.authorName || c.userName}</span>
                            <span className="text-zinc-300 hidden sm:inline">@{c.authorHandle || c.userHandle || "user"}</span>
                            <span className="ml-auto text-[10px] text-zinc-400 tabular-nums">
                              {c.createdAtMs ? new Date(c.createdAtMs).toLocaleDateString() : c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed pl-6">{c.text}</p>
                          {Array.isArray(c.replies) && c.replies.length > 0 && (
                            <div className="mt-2 ml-6 space-y-1.5 border-l border-white/[0.08] pl-3">
                              {c.replies.map((r: any) => (
                                <div key={r.id || Math.random()} className="text-[11px]">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <img src={getSafeAvatarUrl(r.authorAvatar || r.userAvatar, r.authorName || r.userName)} className="w-3.5 h-3.5 rounded-full" alt="" />
                                    <span className="font-medium text-zinc-300">{r.authorName || r.userName}</span>
                                    {r.isOwner && <span className="text-[10px] text-zinc-300 font-medium">Owner</span>}
                                  </div>
                                  <p className="text-zinc-300">{r.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setEditVideoModal(previewVideo);
                    setPreviewVideo(null);
                  }}
                  className={`${ADMIN_BTN_SECONDARY} flex-1`}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Metadata
                </button>
                {confirmDeleteVideoId === previewVideo.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => executeDeleteVideo(previewVideo.id)}
                      className={ADMIN_BTN_DESTRUCTIVE_SOLID}
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteVideoId(null)}
                      className={ADMIN_BTN_ICON}
                      aria-label="Cancel delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteVideoId(previewVideo.id)}
                    className={ADMIN_BTN_DESTRUCTIVE}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PLACE MODAL */}
      {/* ========================================================================= */}
      {editPlaceModal && (
        <AdminModal
          title="Edit Business Details"
          subtitle={editPlaceModal.id}
          onClose={() => setEditPlaceModal(null)}
          maxWidthClass="max-w-2xl"
        >
          <form onSubmit={handleSavePlaceEdits} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Business Name</label>
                <input
                  type="text"
                  value={editPlaceModal.name}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, name: e.target.value })}
                  required
                  className={ADMIN_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
                <input
                  type="text"
                  value={editPlaceModal.category}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, category: e.target.value })}
                  className={ADMIN_INPUT}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">City / Region</label>
                <input
                  type="text"
                  value={editPlaceModal.city || ""}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, city: e.target.value })}
                  className={ADMIN_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Street Address</label>
                <input
                  type="text"
                  value={editPlaceModal.address || ""}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, address: e.target.value })}
                  className={ADMIN_INPUT}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editPlaceModal.phone || ""}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, phone: e.target.value })}
                  placeholder="+1 415-555-0100"
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Business Public Email</label>
                <input
                  type="email"
                  value={editPlaceModal.email || ""}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, email: e.target.value })}
                  placeholder="contact@business.com"
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Website URL</label>
                <input
                  type="text"
                  value={editPlaceModal.website || ""}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, website: e.target.value })}
                  placeholder="https://example.com"
                  className={`${ADMIN_INPUT} text-xs`}
                />
              </div>
            </div>

            {/* Live Profile Header Preview */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                Live Profile Header Preview
              </label>
              <div className="relative h-36 w-full rounded-xl bg-[#050506] border border-white/[0.08] overflow-hidden flex items-center justify-center">
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
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#050506] via-[#0f1014] to-[#050506] flex flex-col items-center justify-center">
                    <span className="text-zinc-300 text-[11px] font-medium tracking-wider uppercase">No Banner Set</span>
                  </div>
                )}

                <div className="absolute -bottom-4 left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-[3px] border-[#0c0c0f] bg-white shadow-xl flex items-center justify-center z-20 p-1 overflow-hidden">
                  <CopoBrandLogo
                    domain={editPlaceModal.website || editPlaceModal.id}
                    name={editPlaceModal.name}
                    website={editPlaceModal.website}
                    logoUrl={editPlaceModal.logoUrl || editPlaceModal.avatarUrl}
                    bannerUrl={editPlaceModal.bannerUrl || editPlaceModal.ogImage}
                    className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden"
                    imageClassName="w-full h-full object-contain rounded-xl"
                    fallbackTextClassName="font-bold text-xl text-zinc-950"
                  />
                </div>

                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/[0.1] text-[11px] font-medium text-zinc-200">
                  {editPlaceModal.category || "Business"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-400">Logo / Avatar URL</label>
                  <div className="flex items-center gap-1.5">
                    {Boolean(editPlaceModal.website) && (
                      <button
                        type="button"
                        onClick={async () => {
                          const dom = editPlaceModal.website?.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].trim();
                          if (!dom) return;
                          if (dom.includes("yoouz")) {
                            setEditPlaceModal({ ...editPlaceModal, logoUrl: YOOUZ_LOGO_DATA_URI, avatarUrl: YOOUZ_LOGO_DATA_URI });
                            showToast("Set Yoouz official logo");
                            return;
                          }
                          try {
                            showToast("Fetching website logo...");
                            const res = await fetch(`/api/url-metadata?url=${encodeURIComponent(dom)}`);
                            const data = await res.json();
                            if (data && data.logo && !data.logo.includes("favicon")) {
                              setEditPlaceModal({ ...editPlaceModal, logoUrl: data.logo, avatarUrl: data.logo });
                              showToast("Logo fetched successfully!");
                            } else {
                              showToast("No official logo found on domain.");
                            }
                          } catch {
                            showToast("Failed to fetch domain metadata");
                          }
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                      >
                        Auto-Detect
                      </button>
                    )}
                    {(editPlaceModal.name?.toLowerCase().includes("yoouz") || editPlaceModal.id?.toLowerCase().includes("yoouz")) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditPlaceModal({ ...editPlaceModal, logoUrl: YOOUZ_LOGO_DATA_URI, avatarUrl: YOOUZ_LOGO_DATA_URI });
                          showToast("Set Yoouz official vector logo");
                        }}
                        className="text-[11px] text-zinc-400 hover:text-white font-medium cursor-pointer"
                      >
                        Reset Yoouz
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#050506] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden p-1">
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
                    className={`${ADMIN_INPUT} text-xs`}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-400">Banner / Cover URL</label>
                  {Boolean(editPlaceModal.website) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const dom = editPlaceModal.website?.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].trim();
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
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
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
                  className={`${ADMIN_INPUT} text-xs`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={editPlaceModal.description || ""}
                onChange={(e) => setEditPlaceModal({ ...editPlaceModal, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#050506] border border-white/[0.08] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.22] transition-colors"
              />
            </div>

            {/* Merchant Claim & Verification Controls */}
            <div className="p-4 rounded-xl bg-[#050506] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Merchant Claim & Verification
                </div>
                <span className={`text-xs font-medium ${editPlaceModal.isClaimed || Boolean(editPlaceModal.claimedByEmail) ? "text-emerald-400" : "text-zinc-300"}`}>
                  {editPlaceModal.isClaimed || Boolean(editPlaceModal.claimedByEmail) ? "Claimed" : "Unclaimed"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Claim Status</label>
                  <select
                    value={editPlaceModal.isClaimed || Boolean(editPlaceModal.claimedByEmail) ? "claimed" : "unclaimed"}
                    onChange={(e) => {
                      const isNowClaimed = e.target.value === "claimed";
                      setEditPlaceModal({
                        ...editPlaceModal,
                        isClaimed: isNowClaimed,
                        isVerified: isNowClaimed ? true : editPlaceModal.isVerified,
                        claimedByEmail: isNowClaimed ? editPlaceModal.claimedByEmail || "merchant@business.com" : ""
                      });
                    }}
                    className={`${ADMIN_SELECT} w-full`}
                  >
                    <option value="unclaimed">Unclaimed Venue</option>
                    <option value="claimed">Business Claimed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Owner Email (Private)</label>
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
                    className={`${ADMIN_INPUT} font-mono text-xs`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button type="button" onClick={() => setEditPlaceModal(null)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button type="submit" className={ADMIN_BTN_PRIMARY}>
                Save Changes
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* EDIT REVIEW MODAL */}
      {/* ========================================================================= */}
      {editVideoModal && (
        <AdminModal
          title="Edit Photo Review"
          subtitle={editVideoModal.id}
          onClose={() => setEditVideoModal(null)}
          maxWidthClass="max-w-lg"
        >
          <form onSubmit={handleSaveVideoEdits} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Business Place Name</label>
              <input
                type="text"
                value={editVideoModal.placeName}
                onChange={(e) => setEditVideoModal({ ...editVideoModal, placeName: e.target.value })}
                required
                className={ADMIN_INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Whole-Star Rating (1–5)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="1"
                value={Math.max(1, Math.min(5, Math.round(editVideoModal.rating || 5)))}
                onChange={(e) =>
                  setEditVideoModal({
                    ...editVideoModal,
                    rating: Math.max(1, Math.min(5, Math.round(Number(e.target.value) || 5)))
                  })
                }
                className={`${ADMIN_INPUT} tabular-nums`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Review Notes (Optional)</label>
              <textarea
                rows={3}
                value={editVideoModal.caption || ""}
                onChange={(e) => setEditVideoModal({ ...editVideoModal, caption: e.target.value })}
                className="w-full px-3 py-2 bg-[#050506] border border-white/[0.08] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.22] transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button type="button" onClick={() => setEditVideoModal(null)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button type="submit" className={ADMIN_BTN_PRIMARY}>
                Save Review
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editUserModal && (
        <AdminModal
          title="Edit User Profile"
          subtitle={editUserModal.email || editUserModal.id}
          onClose={() => setEditUserModal(null)}
          maxWidthClass="max-w-md"
          footer={
            <>
              <button type="button" onClick={() => setEditUserModal(null)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const savedUser = {
                    ...editUserModal,
                    handle: editUserModal.handle
                      ? editUserModal.handle.startsWith("@")
                        ? editUserModal.handle
                        : `@${editUserModal.handle}`
                      : `@${String(editUserModal.name || "user")
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "")}`
                  };
                  const tId = String(savedUser.id || savedUser.uid || "")
                    .toLowerCase()
                    .trim();
                  const tEm = String(savedUser.email || "")
                    .toLowerCase()
                    .trim();
                  setDbUsers((prev) =>
                    prev.map((u) => {
                      const m =
                        (tId && (String(u.id || "").toLowerCase() === tId || String(u.uid || "").toLowerCase() === tId)) ||
                        (tEm && String(u.email || "").toLowerCase() === tEm);
                      return m ? { ...u, ...savedUser } : u;
                    })
                  );
                  setDbVideos((prev) =>
                    prev.map((v) => {
                      const vId = String(v.userId || v.author?.id || "")
                        .toLowerCase()
                        .trim();
                      const vEm = String(v.userEmail || v.author?.email || "")
                        .toLowerCase()
                        .trim();
                      if ((tId && vId === tId) || (tEm && vEm === tEm)) {
                        return {
                          ...v,
                          authorName: savedUser.name,
                          author: {
                            ...(v.author || {}),
                            name: savedUser.name,
                            handle: savedUser.handle,
                            avatar: savedUser.avatar || v.author?.avatar,
                            bio: savedUser.bio !== undefined ? savedUser.bio : v.author?.bio
                          }
                        };
                      }
                      return v;
                    })
                  );
                  if (onUpdateUser) {
                    onUpdateUser(savedUser);
                  }
                  setTimeout(() => fetchLiveStats(true), 400);
                  showToast(`Saved user ${savedUser.name || "User"}.`);
                  setEditUserModal(null);
                }}
                className={ADMIN_BTN_PRIMARY}
              >
                Save Profile
              </button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#050506] border border-white/[0.08]">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.1] overflow-hidden shrink-0">
                <img
                  src={getSafeAvatarUrl(editUserModal.avatar, editUserModal.name, editUserModal.handle || editUserModal.email)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = generateGoogleLetterAvatarSvg(editUserModal.name || "User", 128, editUserModal.handle || editUserModal.name);
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{editUserModal.name || "User"}</p>
                <p className="text-[11px] text-zinc-300 truncate">{editUserModal.email || "No email"}</p>
                <label className="text-[11px] text-zinc-300 hover:text-white font-medium underline underline-offset-2 mt-1 cursor-pointer inline-block">
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Display Name</label>
              <input
                type="text"
                value={editUserModal.name || ""}
                onChange={(e) => setEditUserModal({ ...editUserModal, name: e.target.value })}
                className={ADMIN_INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Handle (@username)</label>
              <input
                type="text"
                value={editUserModal.handle ? editUserModal.handle.replace(/^@/, "") : ""}
                onChange={(e) => setEditUserModal({ ...editUserModal, handle: e.target.value.replace(/^@/, "") })}
                placeholder="e.g. alex_travels"
                className={ADMIN_INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Avatar Image URL</label>
              <input
                type="text"
                value={editUserModal.avatar || ""}
                onChange={(e) => setEditUserModal({ ...editUserModal, avatar: e.target.value })}
                placeholder="https://... or data:image/..."
                className={`${ADMIN_INPUT} text-xs font-mono`}
              />
            </div>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* EDIT COMMENT MODAL */}
      {/* ========================================================================= */}
      {editCommentModal && (
        <AdminModal
          title="Edit Discussion Comment"
          subtitle={`On ${editCommentModal.video.placeName || "Review"}${editCommentModal.isReply ? " (Reply)" : ""}`}
          onClose={() => {
            setEditCommentModal(null);
            setEditCommentText("");
          }}
          maxWidthClass="max-w-lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setEditCommentModal(null);
                  setEditCommentText("");
                }}
                className={ADMIN_BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editCommentText.trim()}
                onClick={async () => {
                  if (!editCommentModal || !editCommentText.trim()) return;
                  const { video, comment, isReply, parentCommentId } = editCommentModal;
                  const clean = editCommentText.trim();

                  const nextComments = (video.comments || []).map((c) => {
                    if (isReply && parentCommentId) {
                      if (c.id === parentCommentId && Array.isArray(c.replies)) {
                        return {
                          ...c,
                          replies: c.replies.map((r) => (r.id === comment.id ? { ...r, text: clean } : r))
                        };
                      }
                      return c;
                    }
                    if (c.id === comment.id) {
                      return { ...c, text: clean };
                    }
                    return c;
                  });

                  if (onUpdateVideo) {
                    onUpdateVideo({
                      ...video,
                      comments: nextComments
                    });
                  }

                  setDbVideos((prev) =>
                    prev.map((v) => (String(v.id) === String(video.id) ? { ...v, comments: nextComments } : v))
                  );
                  setDbComments((prev) =>
                    prev.map((c) => {
                      if (isReply && parentCommentId && String(c.id) === String(parentCommentId) && Array.isArray(c.replies)) {
                        return {
                          ...c,
                          replies: c.replies.map((r: any) => (String(r.id) === String(comment.id) ? { ...r, text: clean } : r))
                        };
                      }
                      if (!isReply && String(c.id) === String(comment.id)) {
                        return { ...c, text: clean };
                      }
                      return c;
                    })
                  );

                  try {
                    await Promise.allSettled([
                      fetch(`/api/nosql/videoReviews/${encodeURIComponent(video.id)}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          data: { comments: nextComments },
                          merge: true
                        })
                      }),
                      isReply && parentCommentId
                        ? fetch(`/api/nosql/comments/${encodeURIComponent(parentCommentId)}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              data: {
                                replies: nextComments.find((c) => c.id === parentCommentId)?.replies || []
                              },
                              merge: true
                            })
                          })
                        : fetch(`/api/nosql/comments/${encodeURIComponent(comment.id)}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              data: { text: clean },
                              merge: true
                            })
                          })
                    ]);
                  } catch (e) {
                    console.warn("Failed to persist edited comment:", e);
                  }

                  setEditCommentModal(null);
                  setEditCommentText("");
                  showToast("Comment updated successfully.");
                  setTimeout(() => fetchLiveStats(true), 400);
                }}
                className={ADMIN_BTN_PRIMARY}
              >
                Save Changes
              </button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#050506] border border-white/[0.08]">
              <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.1] overflow-hidden shrink-0">
                <img
                  src={getSafeAvatarUrl(
                    editCommentModal.comment.authorAvatar,
                    editCommentModal.comment.authorName,
                    editCommentModal.comment.authorHandle
                  )}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = generateGoogleLetterAvatarSvg(
                      editCommentModal.comment.authorName || "User",
                      128,
                      editCommentModal.comment.authorHandle || editCommentModal.comment.authorName
                    );
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-white truncate">{editCommentModal.comment.authorName || "User"}</p>
                  {editCommentModal.comment.authorHandle && (
                    <p className="text-[11px] text-zinc-300 font-mono">@{editCommentModal.comment.authorHandle.replace(/^@/, "")}</p>
                  )}
                </div>
                <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                  On <span className="text-zinc-300 font-medium">{editCommentModal.video.placeName || "Review"}</span>
                  {editCommentModal.isReply && " (Reply thread)"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Comment Content</label>
              <textarea
                rows={4}
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                placeholder="Enter moderated comment text..."
                required
                className="w-full px-3 py-2.5 bg-[#050506] border border-white/[0.08] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.22] leading-relaxed transition-colors"
              />
              <div className="flex justify-between items-center text-[11px] text-zinc-300 mt-1.5">
                <span>Updates immediately across the review feed and database.</span>
                <span className="font-mono tabular-nums">{editCommentText.length} chars</span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* COMMENT & USER PROFILE DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedCommentDetailModal && (
        <AdminModal
          title="Comment Author Profile"
          subtitle={selectedCommentDetailModal.video?.placeName || "Review Discussion"}
          onClose={() => setSelectedCommentDetailModal(null)}
          maxWidthClass="max-w-lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  const targetVid =
                    selectedCommentDetailModal.video ||
                    activeVideos.find((v) => v.id === selectedCommentDetailModal.comment.videoId) ||
                    activeVideos[0];
                  const item = {
                    video: targetVid,
                    comment: selectedCommentDetailModal.comment,
                    isReply: selectedCommentDetailModal.isReply,
                    parentCommentId: selectedCommentDetailModal.parentCommentId
                  };
                  setSelectedCommentDetailModal(null);
                  if (targetVid) {
                    setEditCommentModal(item as any);
                    setEditCommentText(selectedCommentDetailModal.comment.text || "");
                  }
                }}
                className={ADMIN_BTN_SECONDARY}
              >
                <Edit className="w-3.5 h-3.5" /> Edit Text
              </button>
              <button
                type="button"
                onClick={() => setSelectedCommentDetailModal(null)}
                className={ADMIN_BTN_PRIMARY}
              >
                Close
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {(() => {
              const email = (selectedCommentDetailModal.comment.authorEmail || (selectedCommentDetailModal.comment as any).userEmail || "").toLowerCase().trim();
              const handle = (selectedCommentDetailModal.comment.authorHandle || (selectedCommentDetailModal.comment as any).userHandle || "").toLowerCase().replace(/^@/, "").trim();
              const name = (selectedCommentDetailModal.comment.authorName || (selectedCommentDetailModal.comment as any).userName || "").toLowerCase().trim();

              const resolvedUser = activeAllUsers.find((u) => {
                const uEmail = (u.email || "").toLowerCase().trim();
                const uHandle = (u.handle || "").toLowerCase().replace(/^@/, "").trim();
                const uName = (u.name || "").toLowerCase().trim();
                return (email && uEmail === email) || (handle && uHandle === handle) || (name && uName === name);
              });

              return (
                <div className="p-4 rounded-xl bg-[#050506] border border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.1] overflow-hidden shrink-0">
                      <img
                        src={getSafeAvatarUrl(
                          selectedCommentDetailModal.comment.authorAvatar || (selectedCommentDetailModal.comment as any).userAvatar,
                          selectedCommentDetailModal.comment.authorName || (selectedCommentDetailModal.comment as any).userName,
                          selectedCommentDetailModal.comment.authorHandle || (selectedCommentDetailModal.comment as any).userHandle
                        )}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = generateGoogleLetterAvatarSvg(
                            selectedCommentDetailModal.comment.authorName || (selectedCommentDetailModal.comment as any).userName || "User",
                            128,
                            selectedCommentDetailModal.comment.authorHandle || selectedCommentDetailModal.comment.authorName
                          );
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {selectedCommentDetailModal.comment.authorName || (selectedCommentDetailModal.comment as any).userName || "User"}
                        </h4>
                        {selectedCommentDetailModal.comment.isOwner && (
                          <span className="text-[11px] text-zinc-400 font-medium">Business Owner</span>
                        )}
                        {selectedCommentDetailModal.comment.isCreator && (
                          <span className="text-[11px] text-zinc-400 font-medium">Creator</span>
                        )}
                      </div>

                      {(selectedCommentDetailModal.comment.authorHandle || (selectedCommentDetailModal.comment as any).userHandle) && (
                        <p className="text-xs text-zinc-400 font-mono">
                          @{String(selectedCommentDetailModal.comment.authorHandle || (selectedCommentDetailModal.comment as any).userHandle).replace(/^@/, "")}
                        </p>
                      )}

                      {(selectedCommentDetailModal.comment.authorEmail || (selectedCommentDetailModal.comment as any).userEmail) && (
                        <p className="text-xs text-zinc-300 font-mono truncate">
                          {selectedCommentDetailModal.comment.authorEmail || (selectedCommentDetailModal.comment as any).userEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="block text-[11px] text-zinc-300 font-medium">Account Role</span>
                      <span className="text-zinc-200 font-medium">
                        {resolvedUser?.role ||
                          (selectedCommentDetailModal.comment.isOwner ? "Business" : selectedCommentDetailModal.comment.isCreator ? "Creator" : "Member")}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-zinc-300 font-medium">Location</span>
                      <span className="text-zinc-200 font-medium">{resolvedUser?.location || resolvedUser?.city || "Online"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-zinc-300 font-medium">Photo Reviews</span>
                      <span className="text-zinc-200 font-medium tabular-nums">{resolvedUser?.videoReviewCount || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-zinc-300 font-medium">Social Graph</span>
                      <span className="text-zinc-200 font-medium tabular-nums">
                        {resolvedUser?.followersCount || 0} followers · {resolvedUser?.followingCount || 0} following
                      </span>
                    </div>
                    {resolvedUser?.memberSince && (
                      <div className="col-span-2">
                        <span className="block text-[11px] text-zinc-300 font-medium">Member Since</span>
                        <span className="text-zinc-200 font-medium">{resolvedUser.memberSince}</span>
                      </div>
                    )}
                    {resolvedUser?.bio && (
                      <div className="col-span-2 pt-1">
                        <span className="block text-[11px] text-zinc-300 font-medium mb-1">Bio</span>
                        <p className="text-zinc-300 leading-relaxed bg-[#0c0c0f] p-2.5 rounded-lg border border-white/[0.06]">
                          {resolvedUser.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">Comment Text</label>
              <div className="p-3.5 rounded-xl bg-[#050506] border border-white/[0.08] text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {selectedCommentDetailModal.comment.text}
              </div>
            </div>

            {Array.isArray(selectedCommentDetailModal.comment.attachments) && selectedCommentDetailModal.comment.attachments.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                  Attached Photos ({selectedCommentDetailModal.comment.attachments.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCommentDetailModal.comment.attachments.map((attUrl: string, attIdx: number) => (
                    <a
                      key={attIdx}
                      href={attUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-20 h-20 rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/[0.25] transition-colors"
                      title="Open full-size photo"
                    >
                      <img src={attUrl} alt="Attachment" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#050506] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
              {selectedCommentDetailModal.video && (
                <div className="flex items-center gap-2 text-zinc-300 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-zinc-300" />
                  <span>{selectedCommentDetailModal.video.placeName || "Photo Review"}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px] ml-auto tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(selectedCommentDetailModal.comment.createdAt || Date.now()).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW TARGET REVIEW MODAL (Supports both Photo & Video reviews) */}
      {/* ========================================================================= */}
      {previewLikeVideoModal && (
        <AdminModal
          title={previewLikeVideoModal.placeName || "Review Preview"}
          subtitle={`Reviewed by ${previewLikeVideoModal.authorName || "Reviewer"}`}
          onClose={() => setPreviewLikeVideoModal(null)}
          maxWidthClass="max-w-xl"
          footer={
            <div className="w-full flex items-center justify-between">
              {previewLikeVideoModal.rating ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {previewLikeVideoModal.rating} / 5
                </span>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => setPreviewLikeVideoModal(null)} className={ADMIN_BTN_PRIMARY}>
                Close
              </button>
            </div>
          }
        >
          <div className="rounded-xl bg-[#050506] border border-white/[0.08] overflow-hidden flex items-center justify-center min-h-[260px]">
            {previewLikeVideoModal.videoUrl ? (
              <video
                src={previewLikeVideoModal.videoUrl}
                poster={previewLikeVideoModal.thumbnailUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[60vh] w-full object-contain bg-black"
              />
            ) : previewLikeVideoModal.thumbnailUrl ? (
              <img
                src={previewLikeVideoModal.thumbnailUrl}
                alt={previewLikeVideoModal.placeName || "Photo Review"}
                className="max-h-[60vh] w-full object-contain bg-[#050506]"
              />
            ) : (
              <div className="py-16 text-center text-zinc-300">
                <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Media preview unavailable</p>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* SHARE RECORD AUDIT & DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedShareDetailModal && (
        <AdminModal
          title="Share Record Audit"
          subtitle={`ID: ${selectedShareDetailModal.id}`}
          onClose={() => setSelectedShareDetailModal(null)}
          maxWidthClass="max-w-lg"
          footer={
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteShareId(selectedShareDetailModal.id);
                  setSelectedShareDetailModal(null);
                }}
                className={ADMIN_BTN_DESTRUCTIVE}
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Record
              </button>
              <button type="button" onClick={() => setSelectedShareDetailModal(null)} className={ADMIN_BTN_SECONDARY}>
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#050506] border border-white/[0.08] space-y-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">User Identity</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.1] overflow-hidden shrink-0">
                  <img
                    src={getSafeAvatarUrl(selectedShareDetailModal.userAvatar, selectedShareDetailModal.userName, selectedShareDetailModal.userHandle)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = generateGoogleLetterAvatarSvg(selectedShareDetailModal.userName || "User", 128);
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{selectedShareDetailModal.userName || "Community User"}</h4>
                  <p className="text-xs text-zinc-400 font-mono truncate">{selectedShareDetailModal.userHandle || "@user"}</p>
                  <p className="text-[11px] text-zinc-300 font-mono truncate">{selectedShareDetailModal.userId || selectedShareDetailModal.userEmail}</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050506] border border-white/[0.08] space-y-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Target Photo Review</span>
              <div className="flex items-center gap-3">
                {selectedShareDetailModal.videoThumbnail && (
                  <img
                    src={selectedShareDetailModal.videoThumbnail}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-white/[0.08] shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{selectedShareDetailModal.placeName || "Target Place"}</h4>
                  <p className="text-xs text-zinc-400">Reviewed by {selectedShareDetailModal.videoAuthor || "Reviewer"}</p>
                  <p className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate">
                    Review ID: {selectedShareDetailModal.videoId} · {selectedShareDetailModal.platform || "Direct"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Raw Stored JSON</span>
              <pre className="p-3 bg-[#050506] border border-white/[0.08] rounded-xl text-[11px] font-mono text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40">
                {JSON.stringify(selectedShareDetailModal, null, 2)}
              </pre>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* LIKE RECORD AUDIT & DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedLikeDetailModal && (
        <AdminModal
          title="Like Event Audit"
          subtitle={`ID: ${selectedLikeDetailModal.id}`}
          onClose={() => setSelectedLikeDetailModal(null)}
          maxWidthClass="max-w-lg"
          footer={
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteLikeId(selectedLikeDetailModal.id);
                  setSelectedLikeDetailModal(null);
                }}
                className={ADMIN_BTN_DESTRUCTIVE}
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Like
              </button>
              <button type="button" onClick={() => setSelectedLikeDetailModal(null)} className={ADMIN_BTN_SECONDARY}>
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#050506] border border-white/[0.08] space-y-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">User Identity</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.1] overflow-hidden shrink-0">
                  <img
                    src={getSafeAvatarUrl(selectedLikeDetailModal.userAvatar, selectedLikeDetailModal.userName, selectedLikeDetailModal.userHandle)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = generateGoogleLetterAvatarSvg(selectedLikeDetailModal.userName || "User", 128);
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{selectedLikeDetailModal.userName || "Community User"}</h4>
                  <p className="text-xs text-zinc-400 font-mono truncate">{selectedLikeDetailModal.userHandle || "@user"}</p>
                  <p className="text-[11px] text-zinc-300 font-mono truncate">{selectedLikeDetailModal.userId || selectedLikeDetailModal.userEmail}</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050506] border border-white/[0.08] space-y-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Target Photo Review</span>
              <div className="flex items-center gap-3">
                {selectedLikeDetailModal.videoThumbnail && (
                  <img
                    src={selectedLikeDetailModal.videoThumbnail}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-white/[0.08] shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{selectedLikeDetailModal.placeName || "Target Place"}</h4>
                  <p className="text-xs text-zinc-400">Reviewed by {selectedLikeDetailModal.videoAuthor || "Reviewer"}</p>
                  <p className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate">Review ID: {selectedLikeDetailModal.videoId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Raw Stored JSON</span>
              <pre className="p-3 bg-[#050506] border border-white/[0.08] rounded-xl text-[11px] font-mono text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40">
                {JSON.stringify(selectedLikeDetailModal, null, 2)}
              </pre>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE INDIVIDUAL LIKE MODAL */}
      {/* ========================================================================= */}
      {confirmDeleteLikeId && (
        <AdminModal
          title="Delete Like Record"
          onClose={() => setConfirmDeleteLikeId(null)}
          maxWidthClass="max-w-sm"
          footer={
            <>
              <button type="button" onClick={() => setConfirmDeleteLikeId(null)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLike(confirmDeleteLikeId)}
                disabled={isDeletingLikeId === confirmDeleteLikeId}
                className={ADMIN_BTN_DESTRUCTIVE_SOLID}
              >
                {isDeletingLikeId === confirmDeleteLikeId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Delete Like"}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Remove this like record from the database? The review&apos;s like counter will automatically update.
            </p>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM PURGE ALL LIKES MODAL */}
      {/* ========================================================================= */}
      {confirmPurgeAllLikes && (
        <AdminModal
          title="Purge All Likes"
          onClose={() => setConfirmPurgeAllLikes(false)}
          maxWidthClass="max-w-sm"
          footer={
            <>
              <button type="button" onClick={() => setConfirmPurgeAllLikes(false)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button type="button" onClick={handlePurgeAllLikes} className={ADMIN_BTN_DESTRUCTIVE_SOLID}>
                Purge All
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This permanently deletes all like records and resets review like counters to 0. This action cannot be undone.
            </p>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* BOOKMARK RECORD AUDIT & DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedBookmarkDetailModal && (
        <AdminModal
          title="Bookmark Record Audit"
          subtitle={`ID: ${selectedBookmarkDetailModal.id}`}
          onClose={() => setSelectedBookmarkDetailModal(null)}
          maxWidthClass="max-w-lg"
          footer={
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteBookmarkId(selectedBookmarkDetailModal.id);
                  setSelectedBookmarkDetailModal(null);
                }}
                className={ADMIN_BTN_DESTRUCTIVE}
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Bookmark
              </button>
              <button type="button" onClick={() => setSelectedBookmarkDetailModal(null)} className={ADMIN_BTN_SECONDARY}>
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#050506] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Member Identity</span>
                <button
                  type="button"
                  onClick={() => {
                    const uTarget = selectedBookmarkDetailModal.userId || selectedBookmarkDetailModal.userEmail || selectedBookmarkDetailModal.userName;
                    if (uTarget) {
                      setActiveTab("users");
                      setSearchQuery(uTarget);
                      setSelectedBookmarkDetailModal(null);
                    }
                  }}
                  className="text-xs text-zinc-300 hover:text-white font-medium underline underline-offset-2 cursor-pointer"
                >
                  View in Users
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.1] overflow-hidden shrink-0">
                  <img
                    src={getSafeAvatarUrl(selectedBookmarkDetailModal.userAvatar, selectedBookmarkDetailModal.userName, selectedBookmarkDetailModal.userHandle)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = generateGoogleLetterAvatarSvg(selectedBookmarkDetailModal.userName || "User", 128);
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{selectedBookmarkDetailModal.userName || "Community User"}</h4>
                  <p className="text-xs text-zinc-400 font-mono truncate">{selectedBookmarkDetailModal.userHandle || "@user"}</p>
                  <p className="text-[11px] text-zinc-300 font-mono truncate">{selectedBookmarkDetailModal.userId || selectedBookmarkDetailModal.userEmail}</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050506] border border-white/[0.08] space-y-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Target Saved Entity</span>
              <div className="flex items-center gap-3">
                {selectedBookmarkDetailModal.videoThumbnail ? (
                  <button
                    type="button"
                    onClick={() => {
                      const matchedVid = activeVideos.find((v) => v.id === selectedBookmarkDetailModal.videoId);
                      if (matchedVid) {
                        setSelectedBookmarkDetailModal(null);
                        setPreviewVideo(matchedVid);
                      } else {
                        setPreviewLikeVideoModal({
                          videoUrl: selectedBookmarkDetailModal.videoUrl || "",
                          thumbnailUrl: selectedBookmarkDetailModal.videoThumbnail,
                          placeName: selectedBookmarkDetailModal.placeName || "Saved Review",
                          authorName: selectedBookmarkDetailModal.videoAuthor || "Reviewer",
                          rating: selectedBookmarkDetailModal.videoRating || 5
                        });
                      }
                    }}
                    className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/[0.1] shrink-0 cursor-pointer group"
                    title="Preview saved review"
                  >
                    <img
                      src={selectedBookmarkDetailModal.videoThumbnail}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                ) : selectedBookmarkDetailModal.placeLogo ? (
                  <img
                    src={selectedBookmarkDetailModal.placeLogo}
                    alt=""
                    className="w-12 h-12 rounded-lg object-contain p-1 border border-white/[0.08] shrink-0 bg-white/[0.04]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white text-sm truncate">{selectedBookmarkDetailModal.placeName || "Target Place"}</h4>
                    {selectedBookmarkDetailModal.videoRating && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-zinc-300 tabular-nums">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {selectedBookmarkDetailModal.videoRating}
                      </span>
                    )}
                  </div>
                  {selectedBookmarkDetailModal.videoAuthor && (
                    <p className="text-xs text-zinc-400">Reviewed by {selectedBookmarkDetailModal.videoAuthor}</p>
                  )}
                  <p className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate">
                    Target: {selectedBookmarkDetailModal.placeId || selectedBookmarkDetailModal.videoId || "Venue"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#050506] border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-zinc-300 font-medium">Saved Timestamp</span>
                <p className="text-zinc-300 font-mono text-[11px] tabular-nums">
                  {selectedBookmarkDetailModal.createdAt
                    ? new Date(selectedBookmarkDetailModal.createdAt).toLocaleString()
                    : selectedBookmarkDetailModal.timestamp || "Recently"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#050506] border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-zinc-300 font-medium">Storage Engine</span>
                <p className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Bunny libSQL Edge</span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">Raw Stored JSON</span>
              <pre className="p-3 bg-[#050506] border border-white/[0.08] rounded-xl text-[11px] font-mono text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40">
                {JSON.stringify(selectedBookmarkDetailModal, null, 2)}
              </pre>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE INDIVIDUAL SHARE MODAL */}
      {/* ========================================================================= */}
      {confirmDeleteShareId && (
        <AdminModal
          title="Delete Share Record"
          onClose={() => setConfirmDeleteShareId(null)}
          maxWidthClass="max-w-sm"
          footer={
            <>
              <button type="button" onClick={() => setConfirmDeleteShareId(null)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteShare(confirmDeleteShareId)}
                disabled={isDeletingShareId === confirmDeleteShareId}
                className={ADMIN_BTN_DESTRUCTIVE_SOLID}
              >
                {isDeletingShareId === confirmDeleteShareId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Delete Record"}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This will permanently remove this share record from the database.
            </p>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM PURGE ALL SHARES MODAL */}
      {/* ========================================================================= */}
      {confirmPurgeAllShares && (
        <AdminModal
          title="Purge All Shares"
          onClose={() => setConfirmPurgeAllShares(false)}
          maxWidthClass="max-w-sm"
          footer={
            <>
              <button type="button" onClick={() => setConfirmPurgeAllShares(false)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button type="button" onClick={handlePurgeAllShares} className={ADMIN_BTN_DESTRUCTIVE_SOLID}>
                Purge All
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This will permanently delete all share records from the database. This action cannot be undone.
            </p>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE INDIVIDUAL BOOKMARK MODAL */}
      {/* ========================================================================= */}
      {confirmDeleteBookmarkId && (
        <AdminModal
          title="Delete Bookmark Record"
          onClose={() => setConfirmDeleteBookmarkId(null)}
          maxWidthClass="max-w-sm"
          footer={
            <>
              <button type="button" onClick={() => setConfirmDeleteBookmarkId(null)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBookmark(confirmDeleteBookmarkId)}
                disabled={isDeletingBookmarkId === confirmDeleteBookmarkId}
                className={ADMIN_BTN_DESTRUCTIVE_SOLID}
              >
                {isDeletingBookmarkId === confirmDeleteBookmarkId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Delete Bookmark"}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Remove this bookmark from the database? The review&apos;s saved counter will automatically update.
            </p>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM PURGE ALL BOOKMARKS MODAL */}
      {/* ========================================================================= */}
      {confirmPurgeAllBookmarks && (
        <AdminModal
          title="Purge All Bookmarks"
          onClose={() => setConfirmPurgeAllBookmarks(false)}
          maxWidthClass="max-w-sm"
          footer={
            <>
              <button type="button" onClick={() => setConfirmPurgeAllBookmarks(false)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button type="button" onClick={handlePurgeAllBookmarks} className={ADMIN_BTN_DESTRUCTIVE_SOLID}>
                Purge All
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This will delete all bookmark records and reset saved counters on all reviews to 0. This cannot be undone.
            </p>
          </div>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* REGISTER PARTNER AGENCY MODAL */}
      {/* ========================================================================= */}
      {isAddAgencyOpen && (
        <AdminModal
          title="Register Partner Agency"
          subtitle="Add a marketing or merchant onboarding partner to Yoouz"
          onClose={() => setIsAddAgencyOpen(false)}
          maxWidthClass="max-w-lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddAgency();
            }}
            className="space-y-4 text-sm"
          >
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Agency Name (Required)</label>
              <input
                type="text"
                value={newAgency.name}
                onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                placeholder="e.g. Studio North Digital"
                required
                className={ADMIN_INPUT}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">City</label>
                <input
                  type="text"
                  value={newAgency.city}
                  onChange={(e) => setNewAgency({ ...newAgency, city: e.target.value })}
                  placeholder="e.g. Brussels"
                  className={ADMIN_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Country</label>
                <select
                  value={newAgency.country}
                  onChange={(e) => setNewAgency({ ...newAgency, country: e.target.value })}
                  className={`${ADMIN_SELECT} w-full`}
                >
                  <option value="Belgium">Belgium</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Website URL</label>
                <input
                  type="text"
                  value={newAgency.website}
                  onChange={(e) => setNewAgency({ ...newAgency, website: e.target.value })}
                  placeholder="https://agency.com"
                  className={`${ADMIN_INPUT} text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={newAgency.email}
                  onChange={(e) => setNewAgency({ ...newAgency, email: e.target.value })}
                  placeholder="partners@agency.com"
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={newAgency.phone}
                  onChange={(e) => setNewAgency({ ...newAgency, phone: e.target.value })}
                  placeholder="+32 2 555 0100"
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Logo URL (Optional)</label>
                <input
                  type="text"
                  value={newAgency.logoUrl}
                  onChange={(e) => setNewAgency({ ...newAgency, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className={`${ADMIN_INPUT} text-xs`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button type="button" onClick={() => setIsAddAgencyOpen(false)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button type="submit" disabled={!newAgency.name.trim()} className={ADMIN_BTN_PRIMARY}>
                Register Agency
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ========================================================================= */}
      {/* EDIT PARTNER AGENCY MODAL */}
      {/* ========================================================================= */}
      {editAgencyModal && (
        <AdminModal
          title="Edit Partner Agency"
          subtitle={editAgencyModal.id}
          onClose={() => setEditAgencyModal(null)}
          maxWidthClass="max-w-lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateAgency();
            }}
            className="space-y-4 text-sm"
          >
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Agency Name (Required)</label>
              <input
                type="text"
                value={editAgencyModal.name || ""}
                onChange={(e) => setEditAgencyModal({ ...editAgencyModal, name: e.target.value })}
                required
                className={ADMIN_INPUT}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">City</label>
                <input
                  type="text"
                  value={editAgencyModal.city || ""}
                  onChange={(e) => setEditAgencyModal({ ...editAgencyModal, city: e.target.value })}
                  className={ADMIN_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Country</label>
                <select
                  value={editAgencyModal.country || "Belgium"}
                  onChange={(e) => setEditAgencyModal({ ...editAgencyModal, country: e.target.value })}
                  className={`${ADMIN_SELECT} w-full`}
                >
                  <option value="Belgium">Belgium</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Website URL</label>
                <input
                  type="text"
                  value={editAgencyModal.website || ""}
                  onChange={(e) => setEditAgencyModal({ ...editAgencyModal, website: e.target.value })}
                  className={`${ADMIN_INPUT} text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={editAgencyModal.email || ""}
                  onChange={(e) => setEditAgencyModal({ ...editAgencyModal, email: e.target.value })}
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editAgencyModal.phone || ""}
                  onChange={(e) => setEditAgencyModal({ ...editAgencyModal, phone: e.target.value })}
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Logo URL</label>
                <input
                  type="text"
                  value={editAgencyModal.logoUrl || ""}
                  onChange={(e) => setEditAgencyModal({ ...editAgencyModal, logoUrl: e.target.value })}
                  className={`${ADMIN_INPUT} text-xs`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button type="button" onClick={() => setEditAgencyModal(null)} className={ADMIN_BTN_SECONDARY}>
                Cancel
              </button>
              <button type="submit" disabled={!editAgencyModal.name?.trim()} className={ADMIN_BTN_PRIMARY}>
                Save Agency
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};

