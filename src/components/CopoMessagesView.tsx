import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Mail,
  Send,
  Video,
  Play,
  CheckCircle2,
  MapPin,
  Search,
  MessageSquare,
  Star,
  ExternalLink,
  Plus,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Flag,
  Trash2,
  MoreVertical,
  ArrowLeft,
  X,
  Calendar,
  Building2,
  Film,
  Compass,
  AlertTriangle,
  User
} from "lucide-react";
import { CopoMessage, Place, UserProfile, VideoAuthor, VideoReview } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";
import { ReportTarget } from "./CopoReportModal";

interface CopoMessagesViewProps {
  messages: CopoMessage[];
  currentUser?: UserProfile | null;
  places?: Place[];
  userVideos?: VideoReview[];
  allVideos?: VideoReview[];
  allUsers?: any[];
  onOpenAuth?: () => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onUpdateMessages: (updated: CopoMessage[]) => void;
  onSendMessage?: (
    threadId: string,
    text: string,
    recipient: { id: string; name: string; avatar: string; email?: string },
    videoUrl?: string,
    customVideoId?: string
  ) => Promise<void>;
  onMarkThreadRead?: (threadId: string) => void;
  onSelectVideo?: (videoId: string, source?: string) => void;
  onSelectPlace?: (placeId: string) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  onOpenReport?: (target: ReportTarget) => void;
  onDeleteThread?: (threadId: string) => void;
  blockedUserIds?: string[];
  onBlockUser?: (userId: string, userName: string) => void;
  onUnblockUser?: (userId: string) => void;
  onNavigateToNotifications?: () => void;
  onNavigateHome?: () => void;
  unreadNotifsCount?: number;
  selectedThreadId?: string;
  onSelectThreadId?: (id: string) => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
}

export const CopoMessagesView: React.FC<CopoMessagesViewProps> = ({
  messages,
  currentUser,
  places = [],
  userVideos = [],
  allVideos = [],
  allUsers = [],
  onOpenAuth,
  onOpenHelp,
  onOpenLegal,
  onUpdateMessages,
  onSendMessage,
  onMarkThreadRead,
  onSelectVideo,
  onSelectPlace,
  onOpenCreator,
  onOpenReport,
  onDeleteThread,
  blockedUserIds = [],
  onBlockUser,
  onUnblockUser,
  onNavigateToNotifications,
  onNavigateHome,
  unreadNotifsCount = 0,
  selectedThreadId: propSelectedThreadId,
  onSelectThreadId,
  onSuccessAuth
}) => {
  const [localSelectedThreadId, setLocalSelectedThreadId] = useState<string>("");
  const [isMobileThreadViewOpen, setIsMobileThreadViewOpen] = useState(false);

  const selectedThreadId = propSelectedThreadId || localSelectedThreadId || messages[0]?.id || "";

  const setSelectedThreadId = (id: string) => {
    if (onSelectThreadId) {
      onSelectThreadId(id);
    } else {
      setLocalSelectedThreadId(id);
    }
    setIsMobileThreadViewOpen(true);
  };

  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickRecommend, setShowQuickRecommend] = useState(false);
  const [recommendSearch, setRecommendSearch] = useState("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mark selected thread as read immediately upon load or change
  useEffect(() => {
    if (!selectedThreadId) return;
    if (onMarkThreadRead) {
      onMarkThreadRead(selectedThreadId);
    }
    const thread = messages.find((m) => m.id === selectedThreadId);
    if (thread && thread.unreadCount > 0) {
      const updated = messages.map((m) =>
        m.id === selectedThreadId ? { ...m, unreadCount: 0 } : m
      );
      onUpdateMessages(updated);
    }
  }, [selectedThreadId]);

  // Scroll to bottom of chat when active thread changes or new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadId, messages]);

  const activeThread = useMemo(() => {
    return messages.find((m) => m.id === selectedThreadId) || messages[0];
  }, [messages, selectedThreadId]);

  // Discover available community members for user-to-user messaging
  const availableRecipients = useMemo(() => {
    const list: { id: string; name: string; avatar: string; handle?: string; email?: string; bio?: string }[] = [];
    const seen = new Set<string>();

    const myEmail = (currentUser?.email || "").toLowerCase().trim();
    const myName = (currentUser?.name || "").toLowerCase().trim();

    // 1. From allUsers
    allUsers.forEach((u: any) => {
      const uId = u.userId || u.id || u.email;
      const uEmail = (u.email || "").toLowerCase().trim();
      const uName = u.name || "Reviewer";
      if (!uId || (uEmail && uEmail === myEmail) || (uName && uName.toLowerCase() === myName)) return;
      const key = (uEmail || uId).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: uId,
          name: uName,
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=1a73e8&color=fff`,
          //handle: u.name || uName.toLowerCase().replace(/\s+/g, ""),
          email: uEmail,
          bio: u.bio || "Local Guide & Reviewer"
        });
      }
    });

    // 2. From allVideos authors
    allVideos.forEach((v) => {
      if (!v.author) return;
      const aName = v.author.name;
      const aId = v.author.id || v.author.userId || v.author.name || aName;
      const aEmail = (v.author.email || "").toLowerCase().trim();
      if (!aName || (aEmail && aEmail === myEmail) || aName.toLowerCase() === myName) return;
      const key = (aEmail || aId || aName).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: aId,
          name: aName,
          avatar: v.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(aName)}&background=1a73e8&color=fff`,
          //handle: v.author.name,
          email: aEmail,
          bio: v.author.bio || "Community Creator"
        });
      }
    });

    return list;
  }, [allUsers, allVideos, currentUser]);

  const filteredRecipients = useMemo(() => {
    if (!newChatSearch.trim()) return availableRecipients;
    const q = newChatSearch.toLowerCase().trim().replace(/^@/, "");
    return availableRecipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
    );
  }, [availableRecipients, newChatSearch]);

  const handleStartNewUserChat = (recipient: { id: string; name: string; avatar: string; email?: string }) => {
    // Check if an existing thread exists
    const existing = messages.find(
      (m) =>
        m.senderId === recipient.id ||
        m.senderId === recipient.email ||
        (m.senderName && m.senderName.toLowerCase() === recipient.name.toLowerCase())
    );

    if (existing) {
      setSelectedThreadId(existing.id);
      setShowNewChatModal(false);
      return;
    }

    const newId = `thread_${Date.now()}`;
    const newThread: CopoMessage = {
      id: newId,
      senderId: recipient.email || recipient.id,
      senderName: recipient.name,
      senderAvatar: recipient.avatar,
      lastMessage: "",
      timestamp: "Just now",
      createdAtMs: Date.now(),
      unreadCount: 0,
      history: []
    };

    onUpdateMessages([newThread, ...messages]);
    setSelectedThreadId(newId);
    setShowNewChatModal(false);
  };

  const isSenderBlocked = useMemo(() => {
    if (!activeThread) return false;
    const sId = (activeThread.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const sName = (activeThread.senderName || "").toLowerCase().trim();
    return blockedUserIds.some((bId) => {
      const cleanB = (bId || "").toLowerCase().trim().replace(/^@/, "");
      return cleanB === sId || cleanB === sName || (sId.includes(cleanB) && cleanB.length > 2);
    });
  }, [activeThread, blockedUserIds]);

  // Total unread count for the header info
  const unreadCount = useMemo(() => {
    return messages.reduce((acc, m) => acc + (m.unreadCount || 0), 0);
  }, [messages]);

  // Filter threads based on search
  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    return messages.filter((m) =>
      m.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messages, searchTerm]);

  // Search places for recommendation
  const filteredPlacesForRecommend = useMemo(() => {
    if (!recommendSearch.trim()) return places.slice(0, 12);
    const q = recommendSearch.toLowerCase();
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
    );
  }, [places, recommendSearch]);

  // Search user & community videos for recommendation
  const filteredUserVideosForRecommend = useMemo(() => {
    const pool = (userVideos && userVideos.length > 0) ? userVideos : (allVideos || []);
    if (!recommendSearch.trim()) return pool.slice(0, 12);
    const q = recommendSearch.toLowerCase();
    return pool.filter(
      (v) =>
        v.placeName.toLowerCase().includes(q) ||
        (v.caption && v.caption.toLowerCase().includes(q)) ||
        (v.author?.name && v.author.name.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [userVideos, allVideos, recommendSearch]);

  const handleSendText = async (text: string, videoUrl?: string, customVideoId?: string) => {
    if (!text.trim() && !videoUrl && !customVideoId) return;
    if (!activeThread) return;

    if (isSenderBlocked) {
      showToast("Cannot send messages to a blocked user. Please unblock first.");
      return;
    }

    // Sanitize thumbnail URL: ensure no MP4 video stream files or empty strings are stored as image thumbnail URLs
    let sanitizedThumb = videoUrl;
    if (customVideoId && (!sanitizedThumb || sanitizedThumb.endsWith(".mp4") || sanitizedThumb.includes("/api/videos/stream/"))) {
      const matchVid = (allVideos || []).find((v) => v.id === customVideoId) || (userVideos || []).find((v) => v.id === customVideoId);
      if (matchVid) {
        sanitizedThumb = resolveVideoPosterUrl(matchVid) || matchVid.author?.avatar || currentUser?.avatar;
      }
    } else if (sanitizedThumb && (sanitizedThumb.endsWith(".mp4") || sanitizedThumb.includes("/api/videos/stream/"))) {
      sanitizedThumb = currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";
    }

    const newMessage = {
      id: `user-msg-${Date.now()}`,
      senderName: currentUser?.name || "Local Guide (You)",
      senderAvatar: currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      text: text.trim(),
      timestamp: "Just now",
      isMe: true,
      videoThumbnail: sanitizedThumb,
      videoId: customVideoId
    };

    const threadHistory = activeThread.history || [];
    const updatedHistory = [...threadHistory, newMessage];

    const updated = messages.map((m) =>
      m.id === activeThread.id
        ? {
            ...m,
            lastMessage: text.trim(),
            timestamp: "Just now",
            unreadCount: 0,
            videoPreviewUrl: sanitizedThumb || m.videoPreviewUrl,
            history: updatedHistory
          }
        : m
    );

    onUpdateMessages(updated);

    if (onSendMessage) {
      await onSendMessage(
        activeThread.id,
        text.trim(),
        {
          id: activeThread.senderId,
          name: activeThread.senderName,
          avatar: activeThread.senderAvatar
        },
        sanitizedThumb,
        customVideoId
      );
    }
  };

  const handleSendForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    handleSendText(replyText);
    setReplyText("");
  };

  const handleBlockUserAction = () => {
    if (!activeThread) return;
    const targetId = activeThread.senderId || activeThread.senderName;
    if (onBlockUser) {
      onBlockUser(targetId, activeThread.senderName);
    }
    setShowBlockConfirmModal(false);
    setIsOptionsOpen(false);
    showToast(`Blocked @${activeThread.senderName}. You will no longer receive messages.`);
  };

  const handleUnblockUserAction = () => {
    if (!activeThread) return;
    const targetId = activeThread.senderId || activeThread.senderName;
    if (onUnblockUser) {
      onUnblockUser(targetId);
    }
    showToast(`Unblocked @${activeThread.senderName}.`);
  };

  const handleDeleteConversation = () => {
    if (!activeThread) return;
    if (onDeleteThread) {
      onDeleteThread(activeThread.id);
    } else {
      const remaining = messages.filter((m) => m.id !== activeThread.id);
      onUpdateMessages(remaining);
    }
    setShowDeleteConfirmModal(false);
    setIsOptionsOpen(false);
    setIsMobileThreadViewOpen(false);
    showToast("Conversation deleted.");
  };

  const handleReportAction = () => {
    if (!activeThread) return;
    setIsOptionsOpen(false);
    if (onOpenReport) {
      onOpenReport({
        type: "user",
        author: {
          name: activeThread.senderName,
          //handle: activeThread.senderId || activeThread.senderName.toLowerCase().replace(/\s+/g, ""),
          avatar: activeThread.senderAvatar,
          isVerified: true
        }
      });
    } else {
      showToast("Report submitted to Trust & Safety team (report@yoouz.com).");
    }
  };

  // Helper to open full video or find matching video review
  const handleOpenVideoCard = (videoId?: string) => {
    if (!videoId) {
      if (allVideos[0]?.id) {
        onSelectVideo?.(allVideos[0].id);
      }
      return;
    }

    // Check if videoId is a direct video ID
    const directVideo = allVideos.find((v) => v.id === videoId);
    if (directVideo) {
      onSelectVideo?.(directVideo.id);
      return;
    }

    // Check if videoId is a place ID
    const matchingPlaceVideo = allVideos.find(
      (v) => v.placeId === videoId || v.placeName?.toLowerCase() === videoId.toLowerCase()
    );
    if (matchingPlaceVideo) {
      onSelectVideo?.(matchingPlaceVideo.id);
      return;
    }

    // Fallback directly
    onSelectVideo?.(videoId);
  };

  // Helper to open business drawer / reservation flow
  const handleOpenPlaceCard = (placeIdOrVideoId?: string) => {
    if (!placeIdOrVideoId) return;

    // Check if it matches a direct place
    const directPlace = places.find(
      (p) =>
        p.id === placeIdOrVideoId ||
        p.name.toLowerCase() === placeIdOrVideoId.toLowerCase()
    );
    if (directPlace && onSelectPlace) {
      onSelectPlace(directPlace.id);
      return;
    }

    // Check if video has placeId
    const vid = allVideos.find((v) => v.id === placeIdOrVideoId);
    if (vid && vid.placeId && onSelectPlace) {
      onSelectPlace(vid.placeId);
      return;
    }

    if (onSelectPlace) {
      onSelectPlace(placeIdOrVideoId);
    }
  };

  // Helper to resolve an author object from name, id, or avatar
  const resolveAuthor = (name?: string, id?: string, avatar?: string): VideoAuthor => {
    // 1. Check in allVideos for matching author
    const matchVideo = allVideos.find(
      (v) =>
        (v.author?.name && name && v.author.name.toLowerCase() === name.toLowerCase()) ||
        (v.author?.name && name && v.author.name.toLowerCase() === name.toLowerCase().replace(/^@/, '')) ||
        (id && v.author?.name && v.author.name.toLowerCase() === id.toLowerCase().replace(/^@/, ''))
    );
    if (matchVideo && matchVideo.author) {
      return matchVideo.author;
    }

    // 2. Check in allUsers
    const matchUser = allUsers.find(
      (u) =>
        (u.name && name && u.name.toLowerCase() === name.toLowerCase()) ||
        (u.userId && id && u.userId === id) ||
        (u.id && id && u.id === id) ||
        (u.email && id && u.email === id)
    );
    if (matchUser) {
      return {
        name: matchUser.name || name || "Reviewer",
        //handle: (matchUser.name || matchUser.name || name || "reviewer").toLowerCase().replace(/[^a-z0-9]/g, ""),
        email: matchUser.email || (id && id.includes('@') ? id : undefined),
        userId: matchUser.userId || matchUser.id || id,
        id: matchUser.id || matchUser.userId || id,
        avatar: matchUser.avatar || avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=1a73e8&color=fff`,
        bio: matchUser.bio || "Local Guide & Food Reviewer on Yoouz. Sharing authentic local culinary discoveries.",
        followersCount: matchUser.followersCount || 145,
        videoReviewCount: 8,
        photosCount: 24,
        isVerified: true,
        isLocalGuide: true,
        localGuideLevel: 7
      };
    }

    // 3. Fallback author object
    const cleanHandle = (name || id || "reviewer").toLowerCase().replace(/[^a-z0-9]/g, "");
    return {
      name: name || "Local Guide",
      //handle: cleanHandle || "reviewer",
      email: id && id.includes('@') ? id : undefined,
      userId: id,
      id: id,
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=1a73e8&color=fff`,
      bio: "Local food & travel reviewer on Yoouz. Exploring top rated places and sharing honest video reviews.",
      followersCount: 145,
      videoReviewCount: 6,
      photosCount: 18,
      isVerified: true,
      isLocalGuide: true,
      localGuideLevel: 7
    };
  };

  const handleOpenAuthorProfile = (name?: string, id?: string, avatar?: string) => {
    const author = resolveAuthor(name, id, avatar);
    if (onOpenCreator) {
      onOpenCreator(author);
    }
  };

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white flex flex-col justify-between pb-32 md:pb-6" >
        <CopoAuthPrompt
          intent="messages"
          onOpenHelp={onOpenHelp}
          onOpenLegal={onOpenLegal}
          onSuccess={onSuccessAuth}
          isFullPage={true}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-50 text-white md:text-zinc-900 p-3 sm:p-4 md:p-8 flex flex-col select-none" >
      
      {/* Toast alert banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-4 md:space-y-6">
        
        {/* Header section matching Google Maps & TikTok Vibe with Sub-Tabs */}
        <div className="flex flex-col gap-3 bg-zinc-900 md:bg-white p-4 sm:p-5 rounded-3xl border border-zinc-800 md:border-zinc-200/80 shadow-xs shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="w-9 h-9 rounded-full bg-zinc-950 md:bg-zinc-100 hover:bg-zinc-800 md:hover:bg-zinc-200 text-zinc-300 md:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm border border-zinc-800 md:border-zinc-200"
                  title="Back to Feed"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
              <div className="inline-flex items-center p-1 bg-zinc-950 md:bg-zinc-100/90 rounded-2xl border border-zinc-800 md:border-zinc-200">
                <button
                  id="tab-inbox-messages"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-zinc-800 md:bg-white text-blue-400 md:text-[#1a73e8] shadow-xs cursor-pointer transition-all"
                >
                  <Mail className="w-4 h-4 text-blue-400 md:text-[#1a73e8]" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 text-[10px] rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {onNavigateToNotifications && (
                  <button
                    id="tab-inbox-notifications"
                    onClick={onNavigateToNotifications}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 hover:bg-zinc-800/60 md:hover:bg-white/60 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                    <span>Activity</span>
                    {unreadNotifsCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 text-[10px] rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                        {unreadNotifsCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 bg-zinc-950 md:bg-zinc-50 border border-zinc-800 md:border-zinc-150 rounded-2xl px-4 py-2 shrink-0">
              <div className="text-center border-r border-zinc-800 md:border-zinc-200 pr-4">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Unread</p>
                <p className="text-sm font-black text-[#1a73e8]">{unreadCount}</p>
              </div>
              <div className="text-center pl-1">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Chats</p>
                <p className="text-sm font-black text-white md:text-zinc-950">{messages.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Master Chat Dashboard Frame */}
        <div className="flex-1 bg-zinc-900 md:bg-white rounded-3xl border border-zinc-800 md:border-zinc-200/80 shadow-sm flex overflow-hidden min-h-[500px] h-[calc(100vh-210px)] relative">
          
          {/* Threads Column (Hidden on mobile if viewing active thread) */}
          <div className={`w-full md:w-80 border-r border-zinc-800 md:border-zinc-200 flex flex-col bg-zinc-950 md:bg-white shrink-0 ${isMobileThreadViewOpen ? "hidden md:flex" : "flex"}`}>
            {/* Search thread input and New Chat button */}
            <div className="p-3 sm:p-4 border-b border-zinc-800 md:border-zinc-150 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 md:bg-zinc-50 text-xs text-white md:text-zinc-900 placeholder-zinc-500 md:placeholder-zinc-400 pl-9 pr-3 py-2 rounded-xl border border-zinc-800 md:border-zinc-200 focus:outline-none focus:border-[#1a73e8] focus:bg-zinc-800 md:focus:bg-white transition-all font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewChatSearch("");
                  setShowNewChatModal(true);
                }}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shrink-0 transition-colors cursor-pointer"
                title="Start new message"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* List of active threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 md:divide-zinc-100">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 space-y-3 mt-4">
                  <Mail className="w-8 h-8 text-zinc-600 md:text-zinc-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white md:text-zinc-800">No conversations yet</p>
                    <p className="text-[11px] text-zinc-500">Connect and message other community reviewers.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewChatSearch("");
                      setShowNewChatModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a73e8] text-white text-xs font-bold shadow-xs hover:bg-[#1557b0] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start a Message</span>
                  </button>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === selectedThreadId;
                  const isUnread = thread.unreadCount > 0;
                  const threadBlocked = blockedUserIds.some((b) => {
                    const cb = (b || "").toLowerCase().replace(/^@/, "").trim();
                    const sId = (thread.senderId || "").toLowerCase().replace(/^@/, "").trim();
                    const sName = (thread.senderName || "").toLowerCase().trim();
                    return cb === sId || cb === sName;
                  });

                  return (
                    <div
                      key={`chat-thread-${thread.id}`}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`p-3.5 sm:p-4 flex items-center gap-3.5 cursor-pointer transition-all relative ${
                        isActive
                          ? "bg-blue-950/60 md:bg-[#e8f0fe]/75 border-l-4 border-blue-500 md:border-[#1a73e8]"
                          : "hover:bg-zinc-900 md:hover:bg-zinc-50 border-l-4 border-transparent"
                      }`}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAuthorProfile(thread.senderName, thread.senderId, thread.senderAvatar);
                        }}
                        className="relative shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        <img
                          src={thread.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.senderName || "User")}&background=1a73e8&color=fff`}
                          alt={thread.senderName}
                          className="w-11 h-11 rounded-full object-cover border border-zinc-800 md:border-zinc-200"
                        />
                        {threadBlocked ? (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-zinc-950 md:ring-white flex items-center justify-center text-white" title="Blocked user">
                            <X className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-950 md:ring-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAuthorProfile(thread.senderName, thread.senderId, thread.senderAvatar);
                            }}
                            className={`text-xs font-black truncate flex items-center gap-1.5 hover:opacity-80 cursor-pointer text-left transition-opacity ${isActive ? "text-blue-400 md:text-[#1a73e8]" : "text-white md:text-zinc-900"}`}
                          >
                            <span>{thread.senderName}</span>
                            {threadBlocked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950/60 md:bg-red-100 text-red-400 md:text-red-600">
                                Blocked
                              </span>
                            )}
                          </button>
                          <span className="text-[10px] text-zinc-400 font-bold shrink-0">{formatRecordedDate(thread.timestamp, thread.createdAtMs)}</span>
                        </div>
                        <p className={`text-[11px] truncate ${isUnread ? "text-white md:text-zinc-950 font-black" : "text-zinc-400 md:text-zinc-500 font-medium"}`}>
                          {thread.lastMessage}
                        </p>
                      </div>

                      {/* Blue badge for unread count */}
                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8] shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Content Panel (Full on mobile when thread active, or split on md+) */}
          <div className={`flex-1 flex-col justify-between bg-zinc-950 md:bg-zinc-50/40 relative ${isMobileThreadViewOpen ? "flex" : "hidden md:flex"}`}>
            {activeThread ? (
              <>
                {/* Active Chat Header */}
                <div className="p-3 sm:p-4 border-b border-zinc-800 md:border-zinc-200 flex items-center justify-between bg-zinc-900 md:bg-white shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Mobile Back to List Button */}
                    <button
                      onClick={() => setIsMobileThreadViewOpen(false)}
                      className="md:hidden p-1.5 -ml-1 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800"
                      title="Back to inbox"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                      className="relative shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      <img
                        src={activeThread.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeThread.senderName || "User")}&background=1a73e8&color=fff`}
                        alt={activeThread.senderName}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-zinc-800 md:border-zinc-200"
                      />
                    </button>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                        className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-white md:text-zinc-950 hover:text-blue-400 md:hover:text-[#1a73e8] cursor-pointer text-left transition-colors"
                      >
                        <span className="truncate">{activeThread.senderName}</span>
                        <CheckCircle2 className="w-4 h-4 fill-[#1a73e8] text-white shrink-0" />
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isSenderBlocked ? (
                          <span className="text-[10px] text-red-400 md:text-red-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Blocked by you</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 md:text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active on Yoouz</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions Menu (Block, Report, Delete) */}
                  <div className="flex items-center gap-2 relative" ref={optionsRef}>
                    <button
                      id="btn-chat-options-menu"
                      onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white md:hover:text-zinc-800 hover:bg-zinc-800 md:hover:bg-zinc-100 transition-colors"
                      title="Chat options & safety"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Options Dropdown Menu */}
                    {isOptionsOpen && (
                      <div className="absolute right-0 top-10 w-56 bg-zinc-900 md:bg-white rounded-2xl border border-zinc-800 md:border-zinc-200/90 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                        {/* Report option */}
                        <button
                          id="btn-report-chat-user"
                          onClick={handleReportAction}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-300 md:text-zinc-700 hover:bg-zinc-800 md:hover:bg-zinc-50 hover:text-red-400 md:hover:text-red-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Flag className="w-4 h-4 text-red-500" />
                          <span>Report User or Messages</span>
                        </button>

                        {/* Block/Unblock toggle */}
                        {isSenderBlocked ? (
                          <button
                            id="btn-unblock-chat-user"
                            onClick={() => {
                              handleUnblockUserAction();
                              setIsOptionsOpen(false);
                            }}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-300 md:text-zinc-700 hover:bg-zinc-800 md:hover:bg-zinc-50 hover:text-emerald-400 md:hover:text-emerald-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>Unblock {activeThread.senderName}</span>
                          </button>
                        ) : (
                          <button
                            id="btn-block-chat-user"
                            onClick={() => {
                              setIsOptionsOpen(false);
                              setShowBlockConfirmModal(true);
                            }}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-300 md:text-zinc-700 hover:bg-zinc-800 md:hover:bg-zinc-50 hover:text-red-400 md:hover:text-red-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <UserX className="w-4 h-4 text-zinc-400 md:text-zinc-500" />
                            <span>Block {activeThread.senderName}</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-zinc-800 md:border-zinc-100" />

                        {/* Delete Conversation */}
                        <button
                          id="btn-delete-chat-thread"
                          onClick={() => {
                            setIsOptionsOpen(false);
                            setShowDeleteConfirmModal(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-red-400 md:text-red-600 hover:bg-zinc-800 md:hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span>Delete Conversation</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Blocked User Notice Banner */}
                {isSenderBlocked && (
                  <div className="bg-red-950/50 md:bg-red-50 border-b border-red-900/60 md:border-red-200 px-4 py-2.5 flex items-center justify-between text-xs text-red-300 md:text-red-800 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="font-semibold">
                        You blocked {activeThread.senderName}. New messages from this user are blocked.
                      </span>
                    </div>
                    <button
                      onClick={handleUnblockUserAction}
                      className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold text-[11px] hover:bg-red-700 transition-colors shadow-2xs"
                    >
                      Unblock
                    </button>
                  </div>
                )}

                {/* Messages Log area */}
                <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
                  {/* Default introductory message if history is empty */}
                  {(!activeThread.history || activeThread.history.length === 0) ? (
                    <div className="flex items-start gap-3 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                        className="shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        <img
                          src={activeThread.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeThread.senderName || "User")}&background=1a73e8&color=fff`}
                          alt={activeThread.senderName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-800 md:border-zinc-200"
                        />
                      </button>
                      <div className="space-y-1 max-w-md">
                        <button
                          type="button"
                          onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                          className="text-[10px] text-zinc-400 font-bold hover:text-blue-400 md:hover:text-[#1a73e8] cursor-pointer transition-colors"
                        >
                          {activeThread.senderName} · {formatRecordedDate(activeThread.timestamp, activeThread.createdAtMs)}
                        </button>
                        <div className="bg-zinc-900 md:bg-white p-3.5 rounded-2xl rounded-tl-none text-xs text-zinc-100 md:text-zinc-800 border border-zinc-800 md:border-zinc-150 shadow-2xs leading-relaxed">
                          <p>{activeThread.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    activeThread.history.map((msg) => (
                      <div
                        key={`msg-log-${msg.id}`}
                        className={`flex items-start gap-2.5 sm:gap-3 ${msg.isMe ? "flex-row-reverse" : ""} animate-in fade-in duration-200`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.isMe && currentUser) {
                              handleOpenAuthorProfile(currentUser.name, currentUser.userId || currentUser.email, currentUser.avatar);
                            } else {
                              handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar);
                            }
                          }}
                          className="shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                        >
                          <img
                            src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || "User")}&background=1a73e8&color=fff`}
                            alt={msg.senderName}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-zinc-800 md:border-zinc-200"
                          />
                        </button>
                        <div className={`flex flex-col space-y-1 max-w-sm sm:max-w-md ${msg.isMe ? "items-end text-right" : "items-start text-left"}`}>
                          <button
                            type="button"
                            onClick={() => {
                              if (msg.isMe && currentUser) {
                                handleOpenAuthorProfile(currentUser.name, currentUser.userId || currentUser.email, currentUser.avatar);
                              } else {
                                handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar);
                              }
                            }}
                            className="text-[10px] text-zinc-400 font-bold hover:text-blue-400 md:hover:text-[#1a73e8] cursor-pointer transition-colors"
                          >
                            {msg.isMe ? "You" : msg.senderName} · {formatRecordedDate(msg.timestamp, msg.createdAtMs)}
                          </button>
                          <div
                            className={`p-3 text-xs shadow-2xs leading-relaxed rounded-2xl ${
                              msg.videoThumbnail ? "w-[260px] sm:w-[280px]" : "w-fit max-w-full"
                            } ${
                              msg.isMe
                                ? "bg-[#1a73e8] text-white rounded-tr-none text-left"
                                : "bg-zinc-900 md:bg-white text-zinc-100 md:text-zinc-800 rounded-tl-none text-left border border-zinc-800 md:border-zinc-150"
                            }`}
                          >
                            <p className="px-1">{msg.text}</p>

                            {/* Render shared recommendation / video review card inside message bubble */}
                            {msg.videoThumbnail ? (
                              <div
                                onClick={() => handleOpenVideoCard(msg.videoId)}
                                className="mt-2.5 bg-zinc-950 rounded-xl overflow-hidden shadow-sm cursor-pointer group/card border border-zinc-800 md:border-black/10 w-full"
                              >
                                <div className="relative aspect-[4/5] bg-zinc-900">
                                  <img
                                    src={msg.videoThumbnail}
                                    alt="Recommendation preview"
                                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      // Do not fallback to avatar, just use a generic placeholder for the video review
                                      target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/30 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/95 text-zinc-900 flex items-center justify-center shadow-lg group-hover/card:scale-110 transition-transform duration-300">
                                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                                    </div>
                                  </div>
                                </div>
                                <div className="px-3 py-2.5 bg-zinc-900 md:bg-white flex items-center justify-between gap-2 border-t border-zinc-800 md:border-zinc-100">
                                  <div className="flex items-center gap-1.5">
                                    <Film className="w-3.5 h-3.5 text-blue-400 md:text-[#1a73e8]" />
                                    <span className="text-[11px] font-bold text-white md:text-zinc-800">Watch Video Review</span>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Render shared video preview if it is configured at the thread level */}
                  {activeThread.videoPreviewUrl && (!activeThread.history || activeThread.history.length === 0) ? (
                    <div className="ml-10 max-w-xs rounded-2xl overflow-hidden border border-zinc-800 md:border-zinc-200 bg-zinc-900 md:bg-white shadow-2xs">
                      <div className="relative aspect-[16/10]">
                        <img
                          src={activeThread.videoPreviewUrl}
                          alt="Shared video"
                          className="w-full h-full object-cover"
                        />
                        <div
                          onClick={() => handleOpenVideoCard()}
                          className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-[#1a73e8] hover:scale-105 cursor-pointer transition-all shadow-sm"
                        >
                          <Play className="w-4 h-4 fill-white translate-x-0.5" />
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 md:bg-zinc-50 text-[11px] text-zinc-300 md:text-zinc-700 font-bold flex items-center justify-between border-t border-zinc-800 md:border-zinc-150">
                        <span className="flex items-center gap-1.5 text-white md:text-zinc-800">
                          <Video className="w-4 h-4 text-blue-400 md:text-[#1a73e8]" />
                          <span>Video Recommendation</span>
                        </span>
                        <button
                          onClick={() => handleOpenVideoCard()}
                          className="text-blue-400 md:text-[#1a73e8] hover:underline flex items-center gap-0.5"
                        >
                          <span>Play</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced "Recommend a Local Spot / Video" Tray */}
                <div className="px-3 sm:px-4 shrink-0 relative">
                  {showQuickRecommend && (
                    <div className="absolute bottom-2 left-3 right-3 sm:left-4 sm:right-4 bg-zinc-900 md:bg-white border border-zinc-800 md:border-zinc-200 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200 z-20 space-y-3.5 max-h-[380px] flex flex-col">
                      <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <h5 className="text-xs font-black text-white md:text-zinc-900">
                            Share a Recommendation with {activeThread.senderName}
                          </h5>
                        </div>
                        <button
                          onClick={() => setShowQuickRecommend(false)}
                          className="p-1 rounded-full hover:bg-zinc-800 md:hover:bg-zinc-100 text-zinc-400 hover:text-white md:hover:text-zinc-600 font-bold"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Search in tray */}
                      <div className="relative shrink-0">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search your uploaded reviews..."
                          value={recommendSearch}
                          onChange={(e) => setRecommendSearch(e.target.value)}
                          className="w-full bg-zinc-950 md:bg-zinc-50 text-xs text-white md:text-zinc-900 placeholder-zinc-500 md:placeholder-zinc-400 pl-8 pr-3 py-2 rounded-xl border border-zinc-800 md:border-zinc-200 focus:outline-none focus:border-[#1a73e8] font-medium"
                        />
                      </div>

                      {/* Scrollable list of items to share */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredUserVideosForRecommend.length === 0 ? (
                          <div className="p-6 text-center text-zinc-400 space-y-1.5">
                            <Film className="w-7 h-7 mx-auto text-zinc-600 md:text-zinc-300" />
                            <p className="text-xs font-bold text-white md:text-zinc-600">No recorded reviews yet</p>
                            <p className="text-[10px] text-zinc-400">
                              You haven't recorded any video reviews to share.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {filteredUserVideosForRecommend.map((vid) => (
                              <div
                                key={`user-vid-rec-${vid.id}`}
                                onClick={() => {
                                  const poster = resolveVideoPosterUrl(vid) || vid.author?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";
                                  handleSendText(
                                    `Check out this video review for ${vid.placeName}! ⭐️ ${vid.rating || 5}/5`,
                                    poster,
                                    vid.id
                                  );
                                  setShowQuickRecommend(false);
                                }}
                                className="p-2.5 bg-zinc-950 md:bg-zinc-50 hover:bg-zinc-800 md:hover:bg-blue-50/70 border border-zinc-800 md:border-zinc-200/80 hover:border-[#1a73e8] rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 text-left group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800 md:border-zinc-200">
                                    <img
                                      src={resolveVideoPosterUrl(vid) || vid.author?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                                      alt={vid.placeName}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        if (vid.author?.avatar && target.src !== vid.author.avatar) {
                                          target.src = vid.author.avatar;
                                        } else {
                                          target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <h6 className="text-xs font-black text-white md:text-zinc-900 group-hover:text-[#1a73e8] truncate">
                                      {vid.placeName}
                                    </h6>
                                    <p className="text-[10px] text-zinc-400 md:text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                                      <span>{vid.rating || 5} · {vid.author?.name || "Verified Review"}</span>
                                    </p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-[#1a73e8] text-white rounded-lg text-[10px] font-bold shrink-0 shadow-2xs">
                                  Share
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Message input area */}
                <form
                  onSubmit={handleSendForm}
                  className="p-3 sm:p-4 border-t border-zinc-800 md:border-zinc-200 bg-zinc-900 md:bg-white flex items-center gap-2 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setShowQuickRecommend(!showQuickRecommend)}
                    title="Recommend a Place or Video Review"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      showQuickRecommend
                        ? "bg-blue-500/20 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] border border-blue-500/40 md:border-blue-200"
                        : "bg-zinc-800 md:bg-zinc-50 hover:bg-zinc-700 md:hover:bg-zinc-100 text-zinc-300 md:text-zinc-600 border border-zinc-700 md:border-zinc-200"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    disabled={isSenderBlocked}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isSenderBlocked
                        ? `You have blocked ${activeThread.senderName}`
                        : `Write a message to ${activeThread.senderName}...`
                    }
                    className="flex-1 bg-zinc-800 md:bg-zinc-50 disabled:bg-zinc-900 md:disabled:bg-zinc-100 disabled:text-zinc-500 md:disabled:text-zinc-400 text-white md:text-zinc-900 placeholder-zinc-500 md:placeholder-zinc-400 text-xs sm:text-sm px-4 py-2.5 rounded-full border border-zinc-700 md:border-zinc-200 focus:outline-none focus:border-[#1a73e8] focus:bg-zinc-800 md:focus:bg-white transition-all font-medium"
                  />
                  
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSenderBlocked}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a73e8] disabled:opacity-40 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950 md:bg-zinc-50/50 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] flex items-center justify-center">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <p className="text-base font-bold text-white md:text-zinc-800 font-['Google_Sans',sans-serif]">Your Local Guides Inbox</p>
                  <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                    Select a conversation from the sidebar to message verified reviewers, ask questions, or share restaurant recommendations.
                  </p>
                </div>
              </div>
            )}
          </div>
          
        </div>

      </div>

      {/* Block Confirmation Modal Dialog */}
      {showBlockConfirmModal && activeThread && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 md:bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-800 md:border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 md:bg-red-50 text-red-500 md:text-red-600 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white md:text-zinc-900">
                Block {activeThread.senderName}?
              </h3>
              <p className="text-xs text-zinc-400 md:text-zinc-500 leading-relaxed">
                They will not be able to message you or see your direct chat history. You can unblock them at any time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 md:border-zinc-250 text-zinc-300 md:text-zinc-700 font-bold text-xs hover:bg-zinc-800 md:hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockUserAction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-700 transition-colors shadow-xs"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start New Chat / Message Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 md:bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-zinc-800 md:border-zinc-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 md:border-zinc-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/15 text-[#1a73e8] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white md:text-zinc-900">New Direct Message</h3>
                  <p className="text-[10px] text-zinc-400">Message community members and creators</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 md:bg-zinc-100 text-zinc-400 hover:text-white md:hover:text-zinc-900 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search member */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 md:bg-zinc-50 text-xs text-white md:text-zinc-900 placeholder-zinc-500 md:placeholder-zinc-400 pl-9 pr-3 py-2 rounded-xl border border-zinc-800 md:border-zinc-200 focus:outline-none focus:border-[#1a73e8] font-medium"
              />
            </div>

            {/* List of members */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50 md:divide-zinc-100 min-h-[220px] max-h-[360px] pr-1">
              {filteredRecipients.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 space-y-2">
                  <User className="w-8 h-8 mx-auto text-zinc-600 md:text-zinc-300" />
                  <p className="text-xs font-semibold">No members found</p>
                </div>
              ) : (
                filteredRecipients.map((recipient) => (
                  <div
                    key={`recip-${recipient.id}`}
                    onClick={() => handleStartNewUserChat(recipient)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-800/60 md:hover:bg-zinc-50 rounded-2xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={recipient.avatar}
                        alt={recipient.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-800 md:border-zinc-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white md:text-zinc-900 truncate group-hover:text-blue-400 md:group-hover:text-[#1a73e8] transition-colors">
                          {recipient.name}
                        </p>
                        
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1 rounded-xl bg-zinc-800 md:bg-zinc-100 group-hover:bg-[#1a73e8] text-zinc-300 md:text-zinc-700 group-hover:text-white text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 md:border-zinc-150 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white md:hover:text-zinc-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Conversation Confirmation Modal */}
      {showDeleteConfirmModal && activeThread && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-zinc-900">
                Delete this conversation?
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This will delete the chat thread with {activeThread.senderName}. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-250 text-zinc-700 font-bold text-xs hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConversation}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
