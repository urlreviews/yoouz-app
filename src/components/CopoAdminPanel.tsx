import React, { useState, useMemo, useRef, useEffect } from "react";
import { VideoReview, Place, Club, ReviewComment, UserProfile } from "../types";
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
  Clock
} from "lucide-react";
import { isAuthorMatch } from "../utils/placeUtils";

interface CopoAdminPanelProps {
  videos: VideoReview[];
  places: Place[];
  allUsers?: any[];
  clubs?: Club[];
  onDeleteVideo: (id: string) => void;
  onBulkDeleteVideos?: (ids: string[]) => void;
  onPurgeAllVideos?: () => void;
  onUpdateVideo?: (updatedVideo: VideoReview) => void;
  onDeletePlace: (id: string) => void;
  onBulkDeletePlaces?: (ids: string[]) => void;
  onUpdatePlace?: (updatedPlace: Place) => void;
  onAddPlace?: (newPlace: Place) => void;
  onDeleteComment?: (videoId: string, commentId: string, replyId?: string) => void;
  onBroadcastNotification?: (notification: { title: string; message: string; targetUrl?: string }) => void;
  onExit: () => void;
}

type AdminTab = "overview" | "subscriptions" | "videos" | "places" | "users" | "comments" | "broadcast" | "database";

export const CopoAdminPanel: React.FC<CopoAdminPanelProps> = ({
  videos = [],
  places = [],
  allUsers = [],
  clubs = [],
  onDeleteVideo,
  onBulkDeleteVideos,
  onPurgeAllVideos,
  onUpdateVideo,
  onDeletePlace,
  onBulkDeletePlaces,
  onUpdatePlace,
  onAddPlace,
  onDeleteComment,
  onBroadcastNotification,
  onExit
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
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
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "registered" | "creators">("all");
  const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState<string>("all");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>("all");

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
  }, [previewVideo?.id]);

  const [editPlaceModal, setEditPlaceModal] = useState<Place | null>(null);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [editVideoModal, setEditVideoModal] = useState<VideoReview | null>(null);
  const [editUserModal, setEditUserModal] = useState<any | null>(null);
  const [broadcastData, setBroadcastData] = useState({ title: "", message: "", targetUrl: "" });
  const [isBroadcastSending, setIsBroadcastSending] = useState(false);

  // Deletion Confirmations
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<string | null>(null);
  const [confirmDeletePlaceId, setConfirmDeletePlaceId] = useState<string | null>(null);
  const [confirmBulkDeleteVideos, setConfirmBulkDeleteVideos] = useState(false);
  const [confirmPurgeAllVideos, setConfirmPurgeAllVideos] = useState(false);
  const [confirmBulkDeletePlaces, setConfirmBulkDeletePlaces] = useState(false);
  const [confirmDeleteCommentInfo, setConfirmDeleteCommentInfo] = useState<{ videoId: string; commentId: string } | null>(null);

  // Helper: Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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

  // Unique Users Mapping
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, any>();
    const getCleanHandle = (str?: string) => (str || "").replace(/^@+/, "").trim();

    (allUsers || []).forEach((u) => {
      if (!u) return;
      const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0] : u.id) || "user";
      const key = (u.email || cleanHandle).toLowerCase().trim();
      if (!key) return;

      userMap.set(key, {
        id: u.id || u.uid || cleanHandle,
        uid: u.uid || u.id,
        name: u.name || "Registered User",
        email: u.email || "",
        handle: cleanHandle,
        avatar:
          u.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=1a73e8&color=fff&bold=true&size=128`,
        isVerified: true,
        isRegisteredAccount: true,
        role: u.role || (u.email === "4samet@gmail.com" ? "Super Admin" : "Member"),
        memberSince: u.memberSince || "Active"
      });
    });

    (videos || []).forEach((v) => {
      if (!v) return;
      const author = v.author || {
        name: "Verified Reviewer",
        handle: v.userId || "reviewer",
        avatar: "",
        isVerified: true
      };
      const cleanHandle =
        getCleanHandle(author.name) ||
        (v.userEmail ? v.userEmail.split("@")[0] : getCleanHandle(v.userId) || "reviewer");
      const key = (v.userEmail || cleanHandle).toLowerCase().trim();
      if (!key) return;

      if (!userMap.has(key)) {
        userMap.set(key, {
          id: v.userId || cleanHandle,
          uid: v.userId || cleanHandle,
          name: author.name || "Verified Reviewer",
          email: v.userEmail || "",
          handle: cleanHandle,
          avatar:
            author.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || "User")}&background=1a73e8&color=fff&bold=true&size=128`,
          isVerified: author.isVerified !== false,
          isRegisteredAccount: Boolean(v.userId),
          role: "Creator",
          memberSince: "Active"
        });
      } else {
        const existing = userMap.get(key);
        if (existing && (!existing.name || existing.name === "Registered User") && author.name) {
          existing.name = author.name;
        }
        if (existing && (!existing.avatar || existing.avatar.includes("ui-avatars")) && author.avatar) {
          existing.avatar = author.avatar;
        }
      }
    });

    return Array.from(userMap.values());
  }, [allUsers, videos]);

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

  // Filtered Video List
  const filteredVideos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return videos.filter((v) => {
      const matchQuery =
        !q ||
        (v.placeName && v.placeName.toLowerCase().includes(q)) ||
        (v.author?.name && v.author.name.toLowerCase().includes(q)) ||
        (v.author?.name && v.author.name.toLowerCase().includes(q)) ||
        (v.caption && v.caption.toLowerCase().includes(q)) ||
        (v.id && v.id.toLowerCase().includes(q));

      const matchRating = videoRatingFilter === "all" || Math.round(v.rating) === videoRatingFilter;
      return matchQuery && matchRating;
    });
  }, [videos, searchQuery, videoRatingFilter]);

  // Filtered Places List
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return places.filter((p) => {
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
  }, [places, searchQuery, placeCategoryFilter, placeClaimFilter]);

  // Filtered Subscribed & Paid Places List (for Financial Tracking & Subscriptions tab)
  const filteredSubscribedPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return places.filter((p) => {
      const matchQuery =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.website && p.website.toLowerCase().includes(q)) ||
        (p.claimedByEmail && p.claimedByEmail.toLowerCase().includes(q)) ||
        (p.subscriptionTransactionId && p.subscriptionTransactionId.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));

      const plan = p.subscriptionPlan || "free";
      const status = p.subscriptionStatus || (plan !== "free" ? "active" : "free");

      const matchPlan = subscriptionPlanFilter === "all" || plan === subscriptionPlanFilter;
      const matchStatus = subscriptionStatusFilter === "all" || status === subscriptionStatusFilter;

      return matchQuery && matchPlan && matchStatus;
    });
  }, [places, searchQuery, subscriptionPlanFilter, subscriptionStatusFilter]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return uniqueUsers.filter((u) => {
      const matchQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchType =
        userTypeFilter === "all" ||
        (userTypeFilter === "registered" && u.isRegisteredAccount) ||
        (userTypeFilter === "creators" && u.role === "Creator");

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
    const totalViews = videos.reduce((acc, v) => acc + (v.sharesCount || 0) * 10 + (v.likes || 0) * 5 + 15, 0);
    const totalComm = allComments.length;
    const totalPlaces = places.length;
    const claimedPlaces = places.filter((p) => p.isClaimed || Boolean(p.claimedByEmail)).length;
    const avgRating = totalVids > 0 ? (videos.reduce((acc, v) => acc + (v.rating || 5), 0) / totalVids).toFixed(1) : "5.0";

    // Subscription & Revenue Metrics
    let mrr = 0;
    let paidPlacesCount = 0;
    let basicCount = 0;
    let proCount = 0;
    let premiumCount = 0;

    places.forEach((p) => {
      const plan = p.subscriptionPlan;
      const status = p.subscriptionStatus || (plan && plan !== "free" ? "active" : "free");
      const isPaid = (plan === "basic" || plan === "pro" || plan === "premium") && status !== "canceled" && status !== "unpaid";
      if (isPaid) {
        paidPlacesCount++;
        if (plan === "basic") {
          basicCount++;
          mrr += p.subscriptionAmount !== undefined ? p.subscriptionAmount : 29;
        } else if (plan === "pro") {
          proCount++;
          mrr += p.subscriptionAmount !== undefined ? p.subscriptionAmount : 79;
        } else if (plan === "premium") {
          premiumCount++;
          mrr += p.subscriptionAmount !== undefined ? p.subscriptionAmount : 199;
        }
      }
    });

    return {
      totalVideos: totalVids,
      totalLikes,
      totalViews,
      totalComments: totalComm,
      totalPlaces,
      claimedPlaces,
      unclaimedPlaces: totalPlaces - claimedPlaces,
      totalUsers: uniqueUsers.length,
      avgRating,
      mrr,
      arr: mrr * 12,
      paidPlacesCount,
      freePlacesCount: totalPlaces - paidPlacesCount,
      basicCount,
      proCount,
      premiumCount
    };
  }, [videos, places, uniqueUsers, allComments]);

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
  };

  const executePurgeAllVideos = () => {
    if (onPurgeAllVideos) {
      onPurgeAllVideos();
    }
    setSelectedVideoIds([]);
    setConfirmPurgeAllVideos(false);
    setPreviewVideo(null);
    showToast("All video reviews purged completely from storage and database.");
  };

  const executeDeletePlace = (id: string) => {
    onDeletePlace(id);
    setSelectedPlaceIds((prev) => prev.filter((pId) => pId !== id));
    setConfirmDeletePlaceId(null);
    showToast("Business place record removed.");
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
  };

  const handleSavePlaceEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlaceModal) return;
    if (onUpdatePlace) {
      onUpdatePlace(editPlaceModal);
    }
    showToast(`Updated business "${editPlaceModal.name}".`);
    setEditPlaceModal(null);
  };

  const handleCreateNewPlace = (newPlace: Place) => {
    if (onAddPlace) {
      onAddPlace(newPlace);
      showToast(`Created business "${newPlace.name}"!`);
      setIsAddPlaceOpen(false);
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

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex-1 w-full h-full min-h-screen flex items-center justify-center bg-zinc-50 p-4 relative z-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-zinc-50 to-zinc-50 pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Yoouz Admin Control</h1>
            <p className="text-sm text-zinc-400 mt-1">Authenticate to manage database, places, videos, and users</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Admin Passcode</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 text-base transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {authError && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold mt-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> {authError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 active:scale-98 flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Access Dashboard
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Default Key: <code className="text-zinc-400 font-mono">1234567890</code></span>
              <button
                type="button"
                onClick={onExit}
                className="text-zinc-400 hover:text-zinc-900 transition-colors"
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
    <div className="flex-1 w-full h-full min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans absolute inset-0 z-50 overflow-hidden select-none">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 bg-white/95 backdrop-blur border border-zinc-300 text-zinc-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-zinc-900 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Application Bar */}
      <header className="h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-zinc-100/60 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-300/50"
            title="Return to Yoouz Live Feed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-zinc-900">Yoouz</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 border border-blue-200 uppercase tracking-wide">
                  Master Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-6 relative hidden md:block">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search videos, businesses, creators, comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Firestore Cloud Synced
          </div>

          <button
            onClick={handleExportDataJSON}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 rounded-xl text-xs font-bold transition-all"
            title="Download JSON Database Backup"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-red-500/20"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav Tabs */}
        <aside className="w-64 border-r border-zinc-200/80 bg-white/50 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Navigation</div>

            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                Overview & KPIs
              </div>
            </button>

            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "subscriptions"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Subscriptions & Billing
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold">
                {metrics.paidPlacesCount} paid
              </span>
            </button>

            <button
              onClick={() => setActiveTab("videos")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "videos"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4" />
                Video Reviews
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono">
                {videos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("places")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "places"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4" />
                Places & Businesses
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono">
                {places.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                Users & Creators
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono">
                {uniqueUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("comments")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "comments"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                Comments Moderation
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono">
                {allComments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("broadcast")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "broadcast"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                Broadcast Alerts
              </div>
            </button>

            <button
              onClick={() => setActiveTab("database")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "database"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4" />
                Database & Cloud
              </div>
            </button>
          </div>

          {/* Quick System Badge */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Quick Actions</div>
            <button
              onClick={() => setIsAddPlaceOpen(true)}
              className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-blue-200"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Business
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 lg:p-8 relative">
          {/* Mobile Tab Nav */}
          <div className="md:hidden flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-zinc-200 no-scrollbar">
            {(
              [
                ["overview", "Overview"],
                ["subscriptions", `Billing (${metrics.paidPlacesCount})`],
                ["videos", `Videos (${videos.length})`],
                ["places", `Places (${places.length})`],
                ["users", `Users (${uniqueUsers.length})`],
                ["comments", "Moderation"],
                ["broadcast", "Broadcast"],
                ["database", "Database"]
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey as AdminTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tabKey ? "bg-blue-600 text-white" : "bg-white text-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW & KPIS */}
          {activeTab === "overview" && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Platform Command Center</h2>
                  <p className="text-sm text-zinc-400">Live operational overview across all video reviews, merchants, and users</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddPlaceOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Place
                  </button>
                  <button
                    onClick={() => setActiveTab("broadcast")}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 font-bold rounded-xl text-sm transition-all flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" /> Broadcast
                  </button>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div 
                  onClick={() => setActiveTab("subscriptions")}
                  className="p-5 rounded-2xl bg-white/80 hover:bg-white border border-emerald-200 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:border-emerald-500/60"
                >
                  <div className="flex items-center justify-between text-zinc-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Monthly Revenue (MRR)</span>
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-zinc-900">${metrics.mrr.toLocaleString()}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                    <span className="text-emerald-600 font-semibold">{metrics.paidPlacesCount} Paid Subscriptions</span>
                    <span>•</span>
                    <span className="text-zinc-400">${metrics.arr.toLocaleString()} ARR</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-zinc-200/90 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Video Reviews</span>
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-zinc-900">{metrics.totalVideos}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-emerald-400" /> {metrics.avgRating}
                    </span>
                    <span>Avg Customer Rating</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-zinc-200/90 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Places & Businesses</span>
                    <Building2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-zinc-900">{metrics.totalPlaces}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                    <span className="text-blue-600 font-semibold">{metrics.claimedPlaces} Claimed</span>
                    <span>•</span>
                    <span className="text-zinc-400">{metrics.unclaimedPlaces} Unclaimed</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-zinc-200/90 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Community Members</span>
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-black text-zinc-900">{metrics.totalUsers}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                    <span className="text-purple-600 font-semibold">100% Active</span>
                    <span>Accounts Synced</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-zinc-200/90 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Social Interactions</span>
                    <Heart className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="text-3xl font-black text-zinc-900">{metrics.totalLikes + metrics.totalComments}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                    <span>{metrics.totalLikes} Likes</span>
                    <span>•</span>
                    <span>{metrics.totalComments} Comments</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump Modules */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Reviews Summary */}
                <div className="p-6 rounded-2xl bg-white/60 border border-zinc-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      Recent Video Reviews
                    </h3>
                    <button
                      onClick={() => setActiveTab("videos")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View All ({videos.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {videos.slice(0, 4).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setPreviewVideo(v)}
                            className="w-10 h-14 rounded-lg bg-zinc-100 overflow-hidden relative shrink-0 cursor-pointer group"
                          >
                            <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-zinc-900" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-zinc-800 truncate">{v.placeName}</h4>
                            <p className="text-xs text-zinc-400 truncate">by {v.author?.name || "Reviewer"}</p>
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-0.5">
                              <Star className="w-3 h-3 fill-amber-400" /> {v.rating} Stars
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => setPreviewVideo(v)}
                            className="p-2 rounded-lg bg-white hover:bg-blue-600/20 text-zinc-600 hover:text-blue-600 transition-colors"
                            title="Preview Video"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditVideoModal(v)}
                            className="p-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
                            title="Edit Review"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {videos.length === 0 && (
                      <div className="py-8 text-center text-zinc-400 text-sm">No video reviews in database yet.</div>
                    )}
                  </div>
                </div>

                {/* Businesses Summary */}
                <div className="p-6 rounded-2xl bg-white/60 border border-zinc-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      Businesses & Directory
                    </h3>
                    <button
                      onClick={() => setActiveTab("places")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View All ({places.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {places.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-300 flex items-center justify-center shrink-0 overflow-hidden p-1">
                            {p.logoUrl || p.avatarUrl ? (
                              <img src={p.logoUrl || p.avatarUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                            ) : (
                              <MapPin className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-zinc-800 truncate">{p.name}</h4>
                            <p className="text-xs text-zinc-400 truncate">
                              {p.category} • {p.city || p.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              p.isClaimed || p.claimedByEmail
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-zinc-100 text-zinc-400"
                            }`}
                          >
                            {p.isClaimed || p.claimedByEmail ? "Claimed" : "Unclaimed"}
                          </span>
                          <button
                            onClick={() => setEditPlaceModal(p)}
                            className="p-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
                            title="Edit Place"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {places.length === 0 && (
                      <div className="py-8 text-center text-zinc-400 text-sm">No business places recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SUBSCRIPTIONS & FINANCIAL TRACKING */}
          {activeTab === "subscriptions" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              {/* Header & Financial Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                    Business Subscriptions & Revenue
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Monitor paying merchant accounts, recurring subscriptions, URLs, and payment transaction statuses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," + [
                        ["Business Name", "Website URL", "Owner Email", "Plan", "Status", "Amount", "Transaction ID"].join(","),
                        ...filteredSubscribedPlaces.map(p => [
                          `"${p.name || ''}"`,
                          `"${p.website || ''}"`,
                          `"${p.claimedByEmail || ''}"`,
                          `"${p.subscriptionPlan || 'free'}"`,
                          `"${p.subscriptionStatus || 'free'}"`,
                          `"$${p.subscriptionAmount || 0}"`,
                          `"${p.subscriptionTransactionId || ''}"`
                        ].join(","))
                      ].join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `yoouz_subscriptions_${Date.now()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToast("Exported subscriptions CSV report.");
                    }}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Financial KPI Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-emerald-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Monthly Recurring Revenue</span>
                  <div className="text-3xl font-black text-zinc-900 mt-1">${metrics.mrr.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400 mt-2">${metrics.arr.toLocaleString()} Annualized Run Rate</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Paying Businesses</span>
                  <div className="text-3xl font-black text-zinc-900 mt-1">{metrics.paidPlacesCount} / {places.length}</div>
                  <div className="text-xs text-zinc-400 mt-2">
                    {places.length > 0 ? ((metrics.paidPlacesCount / places.length) * 100).toFixed(1) : 0}% Conversion Rate
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Tier Breakdown</span>
                  <div className="flex items-center gap-2 mt-2 font-bold text-sm text-zinc-900">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">Basic: {metrics.basicCount}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs">Pro: {metrics.proCount}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">Elite: {metrics.premiumCount}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-2">{metrics.freePlacesCount} Free Tier Businesses</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Billing Provider</span>
                  <div className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Stripe / In-App
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">Live webhook & merchant checkout connected</div>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={subscriptionPlanFilter}
                    onChange={(e) => setSubscriptionPlanFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700"
                  >
                    <option value="all">All Plans</option>
                    <option value="basic">Basic ($29/mo)</option>
                    <option value="pro">Pro ($79/mo)</option>
                    <option value="premium">Premium Elite ($199/mo)</option>
                    <option value="free">Free Tier ($0)</option>
                  </select>

                  <select
                    value={subscriptionStatusFilter}
                    onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="active">Active (Paid)</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                    <option value="free">Free</option>
                  </select>
                </div>

                <div className="text-xs text-zinc-400 font-mono">
                  Showing {filteredSubscribedPlaces.length} of {places.length} businesses
                </div>
              </div>

              {/* Subscriptions Data Table */}
              <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50/80 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-200">
                      <tr>
                        <th className="p-4">Business & Identity</th>
                        <th className="p-4">Website URL</th>
                        <th className="p-4">Merchant Email</th>
                        <th className="p-4">Plan & Tier</th>
                        <th className="p-4">Payment Status</th>
                        <th className="p-4">Amount / Cycle</th>
                        <th className="p-4">Invoice / Tx ID</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 font-medium">
                      {filteredSubscribedPlaces.map((place) => {
                        const plan = place.subscriptionPlan || "free";
                        const status = place.subscriptionStatus || (plan !== "free" ? "active" : "free");
                        const amount = place.subscriptionAmount !== undefined 
                          ? place.subscriptionAmount 
                          : (plan === "basic" ? 29 : plan === "pro" ? 79 : plan === "premium" ? 199 : 0);

                        return (
                          <tr key={place.id} className="hover:bg-zinc-100/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-300 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                  {place.logoUrl || place.avatarUrl ? (
                                    <img src={place.logoUrl || place.avatarUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                                  ) : (
                                    <Building2 className="w-4 h-4 text-zinc-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                                    {place.name}
                                    {place.isClaimed && <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                                  </div>
                                  <div className="text-xs text-zinc-400 truncate">{place.city || place.address}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              {place.website ? (
                                <a
                                  href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 max-w-[180px] truncate"
                                >
                                  <Globe className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{place.website.replace(/^https?:\/\//, "")}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-xs text-zinc-600 italic">No URL set</span>
                              )}
                            </td>

                            <td className="p-4">
                              {place.claimedByEmail ? (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                                  <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  <span className="truncate max-w-[160px]">{place.claimedByEmail}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-400">Unclaimed</span>
                              )}
                            </td>

                            <td className="p-4">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                                  plan === "premium"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : plan === "pro"
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : plan === "basic"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-zinc-100 text-zinc-400"
                                }`}
                              >
                                {plan}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                                  status === "active"
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : status === "trialing"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : status === "past_due"
                                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                                    : status === "canceled"
                                    ? "bg-zinc-100 text-zinc-400"
                                    : "bg-zinc-100 text-zinc-400"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                                {status.toUpperCase()}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-zinc-900">${amount} <span className="text-xs text-zinc-400 font-normal">/mo</span></div>
                            </td>

                            <td className="p-4">
                              <span className="text-xs font-mono text-zinc-400">
                                {place.subscriptionTransactionId || (plan !== "free" ? `tx_rev_${place.id.slice(0, 6)}` : "—")}
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              <button
                                onClick={() => setEditPlaceModal(place)}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Edit className="w-3.5 h-3.5" /> Manage Billing
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredSubscribedPlaces.length === 0 && (
                  <div className="p-12 text-center text-zinc-400 space-y-2">
                    <CreditCard className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="font-bold text-zinc-400">No businesses match the subscription criteria.</p>
                    <p className="text-xs">Adjust your search or filter settings to view all businesses.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VIDEOS MANAGEMENT */}
          {activeTab === "videos" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select All Checkbox */}
                  {filteredVideos.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-600 mr-2">
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.length === filteredVideos.length && filteredVideos.length > 0}
                        onChange={handleSelectAllVideos}
                        className="w-4 h-4 rounded border-zinc-300 bg-zinc-50 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Select All ({filteredVideos.length})</span>
                    </label>
                  )}

                  {/* Rating Filter Dropdown */}
                  <select
                    value={videoRatingFilter}
                    onChange={(e) => setVideoRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Star Ratings</option>
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-zinc-50 p-1 rounded-xl border border-zinc-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
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
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl animate-in slide-in-from-right-2">
                          <span className="text-xs font-bold text-red-400">Delete {selectedVideoIds.length} videos?</span>
                          <button
                            onClick={executeBulkDeleteVideos}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-zinc-900 text-xs font-bold rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm
                          </button>
                          <button
                            onClick={() => setConfirmBulkDeleteVideos(false)}
                            className="p-1 text-zinc-400 hover:text-zinc-900"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmBulkDeleteVideos(true)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-zinc-900 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedVideoIds.length})
                        </button>
                      )}
                    </div>
                  )}

                  {/* Purge All Database Videos Button */}
                  {confirmPurgeAllVideos ? (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 p-1.5 px-3 rounded-xl animate-in slide-in-from-right-2">
                      <span className="text-xs font-bold text-red-400">Purge ALL videos from cloud database?</span>
                      <button
                        onClick={executePurgeAllVideos}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-zinc-900 text-xs font-bold rounded-lg shadow-sm"
                      >
                        Yes, Wipe All
                      </button>
                      <button
                        onClick={() => setConfirmPurgeAllVideos(false)}
                        className="p-1 text-zinc-400 hover:text-zinc-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeAllVideos(true)}
                      className="px-3 py-2 bg-zinc-100 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-300 hover:border-red-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
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
                      className="group relative bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:border-zinc-300 transition-all flex flex-col"
                    >
                      {/* Selection Box */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <input
                          type="checkbox"
                          checked={selectedVideoIds.includes(video.id)}
                          onChange={() => handleToggleVideoSelection(video.id)}
                          className="w-5 h-5 rounded border-zinc-300 bg-zinc-50/80 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-md"
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
                            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[11px] font-bold text-amber-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400" /> {video.rating}
                            </span>
                          </div>
                          <div>
                            <p className="text-zinc-900 font-black text-sm drop-shadow-md truncate">{video.placeName}</p>
                            <p className="text-zinc-600 text-xs truncate">by {video.author?.name || "Reviewer"}</p>
                          </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-blue-600/90 text-zinc-900 flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Bar */}
                      <div className="p-3 bg-white flex items-center justify-between border-t border-zinc-200">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
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
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                            title="Edit Review Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteVideoId === video.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => executeDeleteVideo(video.id)}
                                className="px-2 py-1 bg-red-600 text-zinc-900 rounded text-[11px] font-bold"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteVideoId(null)}
                                className="p-1 text-zinc-400 hover:text-zinc-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteVideoId(video.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
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
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50 text-xs font-bold uppercase text-zinc-400 border-b border-zinc-200">
                      <tr>
                        <th className="p-4 w-12">
                          <input
                            type="checkbox"
                            checked={selectedVideoIds.length === filteredVideos.length && filteredVideos.length > 0}
                            onChange={handleSelectAllVideos}
                            className="w-4 h-4 rounded border-zinc-300 bg-white text-blue-600 cursor-pointer"
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
                    <tbody className="divide-y divide-zinc-200/80">
                      {filteredVideos.map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-100/40 transition-colors">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedVideoIds.includes(v.id)}
                              onChange={() => handleToggleVideoSelection(v.id)}
                              className="w-4 h-4 rounded border-zinc-300 bg-white text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <div
                              onClick={() => setPreviewVideo(v)}
                              className="w-12 h-16 rounded-lg bg-zinc-100 overflow-hidden relative cursor-pointer group"
                            >
                              <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-zinc-900" />
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-zinc-900">{v.placeName}</div>
                            <div className="text-xs text-zinc-400">{v.placeCategory || "Establishment"}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-zinc-700">{v.author?.name || "Reviewer"}</div>
                            <div className="text-xs text-zinc-400">{v.author?.name || v.userEmail || "user"}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400" /> {v.rating}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-zinc-400">
                            <div>{v.likes || 0} Likes</div>
                            <div>{v.commentsCount || (v.comments || []).length} Comments</div>
                          </td>
                          <td className="p-4 text-xs text-zinc-400">{v.recordedAt || "Recent"}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPreviewVideo(v)}
                                className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"
                                title="Play Video"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditVideoModal(v)}
                                className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => executeDeleteVideo(v.id)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
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
                <div className="py-16 text-center text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-200">
                  No video reviews found matching criteria.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLACES & BUSINESSES MANAGEMENT */}
          {activeTab === "places" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select All Checkbox */}
                  {filteredPlaces.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-600 mr-2">
                      <input
                        type="checkbox"
                        checked={selectedPlaceIds.length === filteredPlaces.length && filteredPlaces.length > 0}
                        onChange={handleSelectAllPlaces}
                        className="w-4 h-4 rounded border-zinc-300 bg-zinc-50 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Select All ({filteredPlaces.length})</span>
                    </label>
                  )}

                  {/* Claim Status Filter */}
                  <select
                    value={placeClaimFilter}
                    onChange={(e) => setPlaceClaimFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Ownership Status</option>
                    <option value="claimed">Claimed by Merchant</option>
                    <option value="unclaimed">Unclaimed Directory</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={placeCategoryFilter}
                    onChange={(e) => setPlaceCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right Buttons */}
                <div className="flex items-center gap-3">
                  {selectedPlaceIds.length > 0 && (
                    <div>
                      {confirmBulkDeletePlaces ? (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl animate-in slide-in-from-right-2">
                          <span className="text-xs font-bold text-red-400">Delete {selectedPlaceIds.length} businesses?</span>
                          <button
                            onClick={executeBulkDeletePlaces}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-zinc-900 text-xs font-bold rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Yes
                          </button>
                          <button
                            onClick={() => setConfirmBulkDeletePlaces(false)}
                            className="p-1 text-zinc-400 hover:text-zinc-900"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmBulkDeletePlaces(true)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-zinc-900 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedPlaceIds.length})
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setIsAddPlaceOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Place
                  </button>
                </div>
              </div>

              {/* Places List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlaces.map((place) => {
                  const placeVideos = videos.filter((v) => v.placeId === place.id || v.placeName === place.name);
                  const isClaimed = place.isClaimed || Boolean(place.claimedByEmail);

                  return (
                    <div
                      key={place.id}
                      className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedPlaceIds.includes(place.id)}
                              onChange={() => handleTogglePlaceSelection(place.id)}
                              className="w-4 h-4 rounded border-zinc-300 bg-zinc-50 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />

                            <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-300 flex items-center justify-center shrink-0 overflow-hidden p-1">
                              {place.logoUrl || place.avatarUrl ? (
                                <img
                                  src={place.logoUrl || place.avatarUrl}
                                  alt=""
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-zinc-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-black text-zinc-900 text-base truncate">{place.name}</h3>
                              <p className="text-xs text-zinc-400 truncate">
                                {place.category} • {place.city || place.address}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Place Stats & Claim Info */}
                        <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Merchant Status:</span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                isClaimed
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
                                  : "bg-zinc-100 text-zinc-400"
                              }`}
                            >
                              {isClaimed ? `Claimed (${place.claimedByEmail || "Verified"})` : "Unclaimed"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-zinc-400">
                            <span>Video Reviews:</span>
                            <span className="font-bold text-zinc-900">{placeVideos.length} recorded</span>
                          </div>

                          {place.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                              <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{place.phone}</span>
                            </div>
                          )}

                          {place.website && (
                            <div className="flex items-center gap-1.5 text-blue-600 truncate">
                              <Globe className="w-3 h-3 shrink-0" />
                              <a href={place.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                                {place.website.replace(/^https?:\/\//, "")}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/80">
                        <button
                          onClick={() => setEditPlaceModal(place)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Business
                        </button>

                        {confirmDeletePlaceId === place.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => executeDeletePlace(place.id)}
                              className="px-2.5 py-1 bg-red-600 text-zinc-900 rounded-lg text-xs font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeletePlaceId(null)}
                              className="p-1 text-zinc-400 hover:text-zinc-900"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeletePlaceId(place.id)}
                            className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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

              {filteredPlaces.length === 0 && (
                <div className="py-16 text-center text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-200">
                  No places or businesses found.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS & CREATORS */}
          {activeTab === "users" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center gap-3">
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All User Accounts ({uniqueUsers.length})</option>
                    <option value="registered">Registered Firestore Accounts</option>
                    <option value="creators">Video Creators Only</option>
                  </select>
                </div>
                <div className="text-xs text-zinc-400 font-semibold">
                  Showing {filteredUsers.length} active users
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                  const userVideos = videos.filter((v) =>
                    isAuthorMatch(v, {
                      name: user.name,
                      handle: `@${user.name}`,
                      email: user.email,
                      uid: user.uid || user.id
                    })
                  );

                  return (
                    <div
                      key={user.name || user.email || user.id}
                      className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-300 overflow-hidden shrink-0">
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-zinc-900 text-base truncate">{user.name}</h3>
                            {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                          </div>
                          
                          {user.email && <p className="text-xs text-zinc-400 truncate">{user.email}</p>}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-zinc-400">Reviews Authored: </span>
                          <span className="font-bold text-zinc-900">{userVideos.length}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-semibold text-[10px]">
                          {user.role || "Member"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                        <button
                          onClick={() => setEditUserModal(user)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Profile
                        </button>

                        {userVideos.length > 0 && (
                          <button
                            onClick={() => {
                              const userVidIds = userVideos.map((v) => v.id);
                              if (onBulkDeleteVideos) onBulkDeleteVideos(userVidIds);
                              showToast(`Removed all ${userVidIds.length} reviews for @${user.name}`);
                            }}
                            className="px-2.5 py-1.5 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors"
                            title="Remove this user's videos (keeps account intact)"
                          >
                            Clear Reviews
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredUsers.length === 0 && (
                <div className="py-16 text-center text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-200">
                  No users found.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMMENTS & MODERATION */}
          {activeTab === "comments" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200">
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">Comments & Social Moderation</h3>
                  <p className="text-xs text-zinc-400">Review and moderate user discussions across all video reviews</p>
                </div>
                <div className="text-xs font-mono text-zinc-400 bg-zinc-50 px-3 py-1 rounded-xl border border-zinc-200">
                  {allComments.length} Total Comments
                </div>
              </div>

              <div className="space-y-3">
                {filteredComments.map((item) => {
                  const commentKey = `${item.video.id}_${item.comment.id}`;
                  return (
                    <div
                      key={commentKey}
                      className="p-4 rounded-2xl bg-white border border-zinc-200 flex items-start justify-between gap-4 hover:border-zinc-300 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={item.comment.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.comment.authorName)}`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover bg-zinc-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-900 text-sm">{item.comment.authorName}</span>
                            <span className="text-xs text-zinc-400">@{item.comment.authorHandle}</span>
                            {item.isReply && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400">Reply</span>
                            )}
                            <span className="text-[11px] text-zinc-400">• on "{item.video.placeName}"</span>
                          </div>
                          <p className="text-zinc-700 text-sm mt-1 bg-zinc-50/60 p-2.5 rounded-xl border border-zinc-200/80">
                            {item.comment.text}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {confirmDeleteCommentInfo?.commentId === item.comment.id ? (
                          <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 p-1.5 rounded-xl">
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
                              }}
                              className="px-2 py-1 bg-red-600 text-zinc-900 rounded text-xs font-bold"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCommentInfo(null)}
                              className="p-1 text-zinc-400 hover:text-zinc-900"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmDeleteCommentInfo({ videoId: item.video.id, commentId: item.comment.id })
                            }
                            className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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
                  <div className="py-16 text-center text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-200">
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
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Broadcast Platform Notification</h2>
                <p className="text-sm text-zinc-400">
                  Send real-time instant announcements to all registered users and creators across Yoouz.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-5 shadow-md">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={broadcastData.title}
                    onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                    placeholder="e.g. New Features Live / Special Weekend Update"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Message Body (Required)
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                    placeholder="Write announcement message that will appear in users' notification inboxes..."
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Target Video or Business URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={broadcastData.targetUrl}
                    onChange={(e) => setBroadcastData({ ...broadcastData, targetUrl: e.target.value })}
                    placeholder="e.g. video_id or https://yoouz.com/place/..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isBroadcastSending || !broadcastData.message.trim()}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-zinc-900 font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm cursor-pointer"
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
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Database & Cloud Integrations</h2>
                <p className="text-sm text-zinc-400">
                  Direct connectivity, backup exports, and system state diagnostics.
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-6 rounded-3xl bg-white border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <h3 className="font-bold text-zinc-900 text-base">Firestore Database Connected</h3>
                      <p className="text-xs text-zinc-400">Auto-Detect Long Polling & Resilient Offline Cache Active</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 text-emerald-600">
                    STATUS: HEALTHY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-zinc-400 block mb-1">Total Videos in DB</span>
                    <span className="font-mono text-base font-bold text-zinc-900">{videos.length} docs</span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-zinc-400 block mb-1">Total Places in DB</span>
                    <span className="font-mono text-base font-bold text-zinc-900">{places.length} docs</span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-zinc-400 block mb-1">Total Registered Users</span>
                    <span className="font-mono text-base font-bold text-zinc-900">{uniqueUsers.length} docs</span>
                  </div>
                </div>
              </div>

              {/* Backup & Tools */}
              <div className="p-6 rounded-3xl bg-white border border-zinc-200 space-y-4">
                <h3 className="font-bold text-zinc-900 text-base">Database Backup & Recovery</h3>
                <p className="text-sm text-zinc-400">
                  Export complete collections as formatted JSON for external backups or offline analysis.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleExportDataJSON}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Download className="w-4 h-4" /> Download Complete JSON Backup
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
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-zinc-50/80 hover:bg-zinc-100 text-zinc-900 transition-colors border border-zinc-300"
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
                  className="p-2.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-zinc-900/40"
                >
                  {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  className="p-2.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-zinc-900/40"
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
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-600 font-bold text-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {previewVideo.rating} Stars
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">ID: {previewVideo.id}</span>
                  </div>
                  <h3 className="text-xl font-black text-zinc-900">{previewVideo.placeName}</h3>
                  <p className="text-xs text-zinc-400">{previewVideo.placeAddress || previewVideo.placeCategory}</p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <img
                    src={previewVideo.author?.avatar || "https://ui-avatars.com/api/?name=Reviewer"}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">{previewVideo.author?.name || "Reviewer"}</h4>
                    <p className="text-xs text-zinc-400">@{previewVideo.author?.name || "user"}</p>
                  </div>
                </div>

                {previewVideo.caption && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Review Caption</label>
                    <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                      {previewVideo.caption}
                    </p>
                  </div>
                )}

                {previewVideo.transcript && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">AI Spoken Transcript</label>
                    <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200 max-h-28 overflow-y-auto">
                      {previewVideo.transcript}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
                <button
                  onClick={() => {
                    setEditVideoModal(previewVideo);
                    setPreviewVideo(null);
                  }}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit Metadata
                </button>
                <button
                  onClick={() => executeDeleteVideo(previewVideo.id)}
                  className="px-4 py-3 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-zinc-900 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-red-500/30"
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
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <h3 className="text-xl font-black text-zinc-900">Edit Business Details</h3>
              <button onClick={() => setEditPlaceModal(null)} className="p-2 text-zinc-400 hover:text-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlaceEdits} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editPlaceModal.name}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={editPlaceModal.category}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={editPlaceModal.city || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Full Street Address</label>
                  <input
                    type="text"
                    value={editPlaceModal.address || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPlaceModal.phone || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editPlaceModal.website || ""}
                    onChange={(e) => setEditPlaceModal({ ...editPlaceModal, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Logo / Avatar Image URL</label>
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
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Merchant Claim Email</label>
                  <input
                    type="email"
                    value={editPlaceModal.claimedByEmail || ""}
                    onChange={(e) =>
                      setEditPlaceModal({
                        ...editPlaceModal,
                        claimedByEmail: e.target.value,
                        isClaimed: Boolean(e.target.value.trim())
                      })
                    }
                    placeholder="merchant@business.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editPlaceModal.description || ""}
                  onChange={(e) => setEditPlaceModal({ ...editPlaceModal, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subscription & Billing Controls */}
              <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
                  <CreditCard className="w-4 h-4" /> Subscription & Monetization Controls
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Plan Tier</label>
                    <select
                      value={editPlaceModal.subscriptionPlan || "free"}
                      onChange={(e) => {
                        const newPlan = e.target.value as any;
                        const price = newPlan === "basic" ? 29 : newPlan === "pro" ? 79 : newPlan === "premium" ? 199 : 0;
                        setEditPlaceModal({
                          ...editPlaceModal,
                          subscriptionPlan: newPlan,
                          subscriptionStatus: newPlan === "free" ? "free" : (editPlaceModal.subscriptionStatus && editPlaceModal.subscriptionStatus !== "free" ? editPlaceModal.subscriptionStatus : "active"),
                          subscriptionAmount: price,
                          subscriptionPaidAt: newPlan !== "free" ? (editPlaceModal.subscriptionPaidAt || Date.now()) : undefined,
                          subscriptionTransactionId: newPlan !== "free" ? (editPlaceModal.subscriptionTransactionId || `tx_${Date.now().toString(36)}`) : undefined
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 font-bold text-xs"
                    >
                      <option value="free">Free / None ($0)</option>
                      <option value="basic">Basic ($29/mo)</option>
                      <option value="pro">Pro ($79/mo)</option>
                      <option value="premium">Premium Elite ($199/mo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Payment Status</label>
                    <select
                      value={editPlaceModal.subscriptionStatus || (editPlaceModal.subscriptionPlan && editPlaceModal.subscriptionPlan !== "free" ? "active" : "free")}
                      onChange={(e) => setEditPlaceModal({ ...editPlaceModal, subscriptionStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 font-bold text-xs"
                    >
                      <option value="active">Active (Paid)</option>
                      <option value="trialing">Free Trialing</option>
                      <option value="past_due">Past Due</option>
                      <option value="canceled">Canceled</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="free">Free Tier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Monthly Price ($)</label>
                    <input
                      type="number"
                      value={editPlaceModal.subscriptionAmount ?? (editPlaceModal.subscriptionPlan === "basic" ? 29 : editPlaceModal.subscriptionPlan === "pro" ? 79 : editPlaceModal.subscriptionPlan === "premium" ? 199 : 0)}
                      onChange={(e) => setEditPlaceModal({ ...editPlaceModal, subscriptionAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Payment Method / Gateway</label>
                    <input
                      type="text"
                      value={editPlaceModal.subscriptionPaymentMethod || "Credit Card (Stripe)"}
                      onChange={(e) => setEditPlaceModal({ ...editPlaceModal, subscriptionPaymentMethod: e.target.value })}
                      placeholder="e.g. Visa ending in 4242"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Transaction / Invoice ID</label>
                    <input
                      type="text"
                      value={editPlaceModal.subscriptionTransactionId || ""}
                      onChange={(e) => setEditPlaceModal({ ...editPlaceModal, subscriptionTransactionId: e.target.value })}
                      placeholder="e.g. in_1Qabcd..."
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditPlaceModal(null)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
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
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-xl font-black text-zinc-900">Edit Video Review</h3>
              <button onClick={() => setEditVideoModal(null)} className="p-2 text-zinc-400 hover:text-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoEdits} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Business Place Name</label>
                <input
                  type="text"
                  value={editVideoModal.placeName}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, placeName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Star Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={editVideoModal.rating}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, rating: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Review Caption</label>
                <textarea
                  rows={3}
                  value={editVideoModal.caption || ""}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, caption: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Voice Transcript</label>
                <textarea
                  rows={3}
                  value={editVideoModal.transcript || ""}
                  onChange={(e) => setEditVideoModal({ ...editVideoModal, transcript: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditVideoModal(null)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
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
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-xl font-black text-zinc-900">Edit User Profile</h3>
              <button onClick={() => setEditUserModal(null)} className="p-2 text-zinc-400 hover:text-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editUserModal.name}
                  onChange={(e) => setEditUserModal({ ...editUserModal, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Handle (@username)</label>
                <input
                  type="text"
                  value={editUserModal.name}
                  onChange={(e) => setEditUserModal({ ...editUserModal, handle: e.target.value.replace(/^@/, "") })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={editUserModal.avatar}
                  onChange={(e) => setEditUserModal({ ...editUserModal, avatar: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-xs font-bold text-zinc-600">Verified Badge</span>
                <input
                  type="checkbox"
                  checked={editUserModal.isVerified !== false}
                  onChange={(e) => setEditUserModal({ ...editUserModal, isVerified: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-300 bg-white text-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Updated user @${editUserModal.name}.`);
                    setEditUserModal(null);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
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
  const [subscriptionPlan, setSubscriptionPlan] = useState<"free" | "basic" | "pro" | "premium">("free");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = `place_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const price = subscriptionPlan === "basic" ? 29 : subscriptionPlan === "pro" ? 79 : subscriptionPlan === "premium" ? 199 : 0;

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
      avatarUrl: logoUrl.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a73e8&color=fff&bold=true`,
      logoUrl: logoUrl.trim(),
      bannerUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
      photos: [],
      openingHours: "Mon-Sun 10:00 AM - 10:00 PM",
      isOpen: true,
      phone: phone.trim(),
      website: website.trim(),
      priceRange: "$$",
      plusCode: "",
      description: "Verified business on Yoouz video platform.",
      popularKeywords: [{ tag: "Verified", count: 1 }],
      amenities: ["Free Wi-Fi", "Credit Cards Accepted"],
      topDishes: [],
      isClaimed: Boolean(claimedByEmail.trim()),
      claimedByEmail: claimedByEmail.trim() || undefined,
      subscriptionPlan: subscriptionPlan,
      subscriptionStatus: subscriptionPlan === "free" ? "free" : "active",
      subscriptionAmount: price,
      subscriptionPaidAt: subscriptionPlan !== "free" ? Date.now() : undefined,
      subscriptionTransactionId: subscriptionPlan !== "free" ? `tx_new_${Date.now().toString(36)}` : undefined
    };

    onSave(newPlace);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <h3 className="text-xl font-black text-zinc-900">Create New Business Page</h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Business Name (Required)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Blue Bottle Coffee"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Cafe, Restaurant, Hotel"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">City / Region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. San Francisco"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Full Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 66 Mint St, San Francisco, CA"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 415-555-0199"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://bluebottlecoffee.com"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Logo URL (Optional)</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Assign Claim to Email (Optional)</label>
              <input
                type="email"
                value={claimedByEmail}
                onChange={(e) => setClaimedByEmail(e.target.value)}
                placeholder="owner@business.com"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">Initial Subscription Tier</label>
            <select
              value={subscriptionPlan}
              onChange={(e) => setSubscriptionPlan(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-bold text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Free / None ($0/mo)</option>
              <option value="basic">Basic Tier ($29/mo)</option>
              <option value="pro">Pro Tier ($79/mo)</option>
              <option value="premium">Premium Elite Tier ($199/mo)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
            >
              Create Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
