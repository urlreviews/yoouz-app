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
  User,
  CheckCheck
} from "lucide-react";
import { CopoMessage, Place, UserProfile, VideoAuthor, VideoReview } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";
import { ReportTarget } from "./CopoReportModal";
import { useLanguage } from "../i18n/LanguageContext";

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
  const { t } = useLanguage();
  const [localSelectedThreadId, setLocalSelectedThreadId] = useState<string>("");
  const [isMobileThreadViewOpen, setIsMobileThreadViewOpen] = useState(false);
  const [draftThread, setDraftThread] = useState<CopoMessage | null>(null);

  const selectedThreadId = localSelectedThreadId || propSelectedThreadId || draftThread?.id || messages[0]?.id || "";

  const setSelectedThreadId = (id: string) => {
    setLocalSelectedThreadId(id);
    if (onSelectThreadId) {
      onSelectThreadId(id);
    }
    setIsMobileThreadViewOpen(true);
  };

  // Sync mobile view state when thread ID changes externally
  useEffect(() => {
    if (propSelectedThreadId) {
      setIsMobileThreadViewOpen(true);
    }
  }, [propSelectedThreadId]);

  // Mobile virtual keyboard handling for physical app feel
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      if (window.visualViewport) {
        const offset = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(offset > 50 ? offset : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewport);
      window.visualViewport.addEventListener("scroll", updateViewport);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateViewport);
        window.visualViewport.removeEventListener("scroll", updateViewport);
      }
    };
  }, []);

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

  // Mark selected thread as read immediately upon load, change, or incoming message
  useEffect(() => {
    if (!selectedThreadId) return;
    const thread = messages.find((m) => m.id === selectedThreadId);
    if (thread && (thread.unreadCount || 0) > 0) {
      if (onMarkThreadRead) {
        onMarkThreadRead(selectedThreadId);
      }
      const updated = messages.map((m) =>
        m.id === selectedThreadId ? { ...m, unreadCount: 0 } : m
      );
      onUpdateMessages(updated);
    } else if (selectedThreadId && onMarkThreadRead) {
      onMarkThreadRead(selectedThreadId);
    }
  }, [selectedThreadId, messages]);

  // Scroll to bottom of chat when active thread changes or new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadId, messages]);

  const activeThread = useMemo(() => {
    if (draftThread && draftThread.id === selectedThreadId) {
      return messages.find((m) => m.id === selectedThreadId) || draftThread;
    }
    const found = messages.find((m) => m.id === selectedThreadId);
    if (found) return found;
    if (draftThread) return draftThread;
    return messages[0];
  }, [messages, selectedThreadId, draftThread]);

  // Discover available community members for user-to-user messaging (strictly deduplicated and canonical)
  const availableRecipients = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      avatar: string;
      handle?: string;
      email?: string;
      bio?: string;
      location?: string;
      isVerified?: boolean;
    }>();

    // Check deleted users in localStorage so deleted accounts are never shown
    let deletedList: string[] = [];
    try {
      const stored = localStorage.getItem("yoouz_deleted_users");
      if (stored) deletedList = JSON.parse(stored);
    } catch {}
    const deletedSet = new Set(deletedList.map((k) => String(k).toLowerCase().trim()));

    const myEmail = (currentUser?.email || "").toLowerCase().trim();
    const myName = (currentUser?.name || "").toLowerCase().trim();
    const myUid = (currentUser?.uid || currentUser?.id || "").toLowerCase().trim();
    const myHandle = ((currentUser as any)?.handle || "").replace(/^@+/, "").toLowerCase().trim();

    const isAvtErtuop = myEmail.includes("avr6566gd") || myName === "avt ertuop" || myHandle === "avtertuop" || myUid.includes("avr6566gd") || myName.includes("avt");
    const isAouisesmee = myEmail.includes("aouisesmee") || myName.includes("aouisesmee") || myHandle.includes("aouisesmee") || myUid.includes("aouisesmee") || myEmail.includes("4samet") || myName.includes("4samet");
    const isBizRiv = myEmail.includes("louis42111") || myName === "biz riv" || myHandle === "bizriv" || myUid.includes("louis42111") || myEmail.includes("biz");

    const isMe = (cand: { email?: string; name?: string; id?: string; handle?: string }) => {
      const e = (cand.email || "").toLowerCase().trim();
      const n = (cand.name || "").toLowerCase().trim();
      const i = (cand.id || "").toLowerCase().trim();
      const h = (cand.handle || "").replace(/^@+/, "").toLowerCase().trim();

      if (e && myEmail && e === myEmail) return true;
      if (n && myName && n === myName && n !== "reviewer" && n !== "user") return true;
      if (i && myUid && (i === myUid || i === `usr_${myUid}` || myUid === `usr_${i}`)) return true;
      if (h && myHandle && h === myHandle) return true;

      if (isAouisesmee && (e.includes("aouisesmee") || e.includes("4samet") || n.includes("aouisesmee") || h.includes("aouisesmee"))) return true;
      if (isAvtErtuop && (e.includes("avr6566gd") || n.includes("avt") || h.includes("avt"))) return true;
      if (isBizRiv && (e.includes("louis42111") || n.includes("biz") || h.includes("biz"))) return true;

      return false;
    };

    const isDeleted = (cand: { email?: string; name?: string; id?: string; handle?: string }) => {
      const e = (cand.email || "").toLowerCase().trim();
      const n = (cand.name || "").toLowerCase().trim();
      const i = (cand.id || "").toLowerCase().trim();
      const h = (cand.handle || "").replace(/^@+/, "").toLowerCase().trim();

      return (
        (e && deletedSet.has(e)) ||
        (n && deletedSet.has(n)) ||
        (i && deletedSet.has(i)) ||
        (h && deletedSet.has(h))
      );
    };

    const getCanonicalKey = (cand: { email?: string; name?: string; id?: string; handle?: string }): string => {
      const e = (cand.email || "").toLowerCase().trim();
      const n = (cand.name || "").toLowerCase().trim();
      const i = (cand.id || "").toLowerCase().trim();
      const h = (cand.handle || "").replace(/^@+/, "").toLowerCase().trim();

      // 1. Group all aliases for aouisesmee
      if (
        e.includes("aouisesmee") || e.includes("aouisesme") ||
        n.includes("aouisesmee") || n.includes("aouisesme") ||
        h.includes("aouisesmee") || h.includes("aouisesme") ||
        i.includes("aouisesmee") || i.includes("aouisesme") || i === "mlio66hdr9trvofdgddgwm30rku2"
      ) {
        return "canon_user_aouisesmee";
      }

      // 2. Group all aliases for Biz Riv
      if (
        n === "biz riv" || n.replace(/[^a-z0-9]/g, "") === "bizriv" ||
        e.includes("louis42111") || h.includes("louis42111") || i.includes("louis42111")
      ) {
        return "canon_user_bizriv";
      }

      // 3. Group all aliases for avt ertuop
      if (
        n === "avt ertuop" || n.replace(/[^a-z0-9]/g, "") === "avtertuop" ||
        e.includes("avr6566gd") || h.includes("avr6566gd") || i.includes("avr6566gd")
      ) {
        return "canon_user_avtertuop";
      }

      // 4. Normalized non-generic clean name
      const cleanName = n.replace(/[^a-z0-9]/g, "");
      const isGeneric = (str: string) => !str || str === "reviewer" || str === "user" || str === "registereduser" || str === "communityreviewer";
      if (cleanName && !isGeneric(cleanName) && cleanName.length >= 2) {
        return `canon_name_${cleanName}`;
      }

      // 5. Normalized clean handle
      const cleanHandle = h.replace(/[^a-z0-9]/g, "");
      if (cleanHandle && !isGeneric(cleanHandle) && cleanHandle.length >= 2) {
        return `canon_handle_${cleanHandle}`;
      }

      // 6. Normalized email prefix
      if (e && e.includes("@")) {
        const prefix = e.split("@")[0].replace(/[^a-z0-9]/g, "");
        if (prefix && prefix.length >= 2 && !isGeneric(prefix)) {
          return `canon_email_${prefix}`;
        }
      }

      // 7. Clean ID
      if (i) {
        const cleanId = i.replace(/^usr_/, "").replace(/[^a-z0-9]/g, "");
        if (cleanId) return `canon_id_${cleanId}`;
      }

      return "";
    };

    // 1. Ingest from allUsers
    allUsers.forEach((u: any) => {
      const uId = u.userId || u.uid || u.id || u.email;
      const uEmail = (u.email || "").toLowerCase().trim();
      const uName = (u.name || "").trim();
      const uHandle = (u.handle || "").trim();

      const cand = { email: uEmail, name: uName, id: uId, handle: uHandle };
      if (isMe(cand) || isDeleted(cand)) return;
      const key = getCanonicalKey(cand);
      if (!key) return;

      const existing = map.get(key);
      const hasUploadedAvatar = (av?: string) =>
        Boolean(av && !av.includes("ui-avatars") && !av.includes("/api/avatar?name=User"));
      const bestAvatar = (hasUploadedAvatar(u.avatar) ? u.avatar : "") ||
        (hasUploadedAvatar(existing?.avatar) ? existing?.avatar : "") ||
        u.avatar ||
        existing?.avatar;
      const bestEmail = uEmail && uEmail.includes("@") ? uEmail : (existing?.email || "");
      const bestName = uName && uName !== "Registered User" && uName !== "Reviewer" ? uName : (existing?.name || uName || "Reviewer");
      const bestLocation = u.location || existing?.location;
      const bestBio = u.bio || existing?.bio || "Community Creator";
      const isVerified = Boolean(u.isVerified ?? existing?.isVerified ?? true);

      map.set(key, {
        id: uId || existing?.id || key,
        name: bestName,
        avatar: bestAvatar || `/api/avatar?name=${encodeURIComponent(bestName)}&background=1a73e8&color=fff`,
        email: bestEmail,
        bio: bestBio,
        location: bestLocation,
        isVerified
      });
    });

    // 2. Ingest from allVideos authors
    allVideos.forEach((v) => {
      if (!v.author) return;
      const aName = (v.author.name || "").trim();
      const aId = v.author.id || (v.author as any).userId || v.userId || aName;
      const aEmail = (v.author.email || v.userEmail || "").toLowerCase().trim();
      const aHandle = ((v.author as any).handle || "").trim();

      const cand = { email: aEmail, name: aName, id: aId, handle: aHandle };
      if (isMe(cand) || isDeleted(cand)) return;
      const key = getCanonicalKey(cand);
      if (!key) return;

      const existing = map.get(key);
      const hasUploadedAvatar = (av?: string) =>
        Boolean(av && !av.includes("ui-avatars") && !av.includes("/api/avatar?name=User"));
      const bestAvatar = (hasUploadedAvatar(v.author.avatar) ? v.author.avatar : "") ||
        (hasUploadedAvatar(existing?.avatar) ? existing?.avatar : "") ||
        v.author.avatar ||
        existing?.avatar;
      const bestEmail = aEmail && aEmail.includes("@") ? aEmail : (existing?.email || "");
      const bestName = aName && aName !== "Registered User" && aName !== "Reviewer" ? aName : (existing?.name || aName || "Reviewer");
      const bestLocation = v.author.location || existing?.location;
      const bestBio = v.author.bio || existing?.bio || "Community Creator";
      const isVerified = Boolean(v.author.isVerified ?? existing?.isVerified ?? true);

      map.set(key, {
        id: existing?.id || aId || key,
        name: bestName,
        avatar: bestAvatar || `/api/avatar?name=${encodeURIComponent(bestName)}&background=1a73e8&color=fff`,
        email: bestEmail,
        bio: bestBio,
        location: bestLocation,
        isVerified
      });
    });

    return Array.from(map.values());
  }, [allUsers, allVideos, currentUser]);

  // Recipient search: Do not pre-dump the entire directory when opening modal.
  // User must search by name/keyword to see matching results.
  const filteredRecipients = useMemo(() => {
    const q = newChatSearch.toLowerCase().trim().replace(/^@/, "");
    if (!q) return [];

    return availableRecipients.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const location = (r.location || "").toLowerCase();
      const bio = (r.bio || "").toLowerCase();
      return name.includes(q) || email.includes(q) || location.includes(q) || bio.includes(q);
    });
  }, [availableRecipients, newChatSearch]);

  const handleStartNewUserChat = (recipient: { id: string; name: string; avatar: string; email?: string }) => {
    let finalEmail = recipient.email;
    const rName = (recipient.name || "").toLowerCase().trim();
    const rId = (recipient.id || "").toLowerCase().trim();
    if (!finalEmail || !finalEmail.includes("@")) {
      if (rId.includes("@")) {
        finalEmail = rId;
      } else if (rName === "avt ertuop" || rId.includes("avtertuop") || rId.includes("avr6566gd")) {
        finalEmail = "avr6566gd@gmail.com";
      } else if (rName === "biz riv" || rId.includes("bizriv") || rId.includes("louis42111")) {
        finalEmail = "louis42111@gmail.com";
      } else if (rName.includes("aouisesmee") || rId.includes("aouisesmee")) {
        finalEmail = "aouisesmee@gmail.com";
      }
    }

    // Check if an existing thread exists
    const existing = messages.find(
      (m) =>
        m.senderId === recipient.id ||
        (finalEmail && (m.senderId === finalEmail || m.senderEmail === finalEmail)) ||
        (m.senderName && m.senderName.toLowerCase() === recipient.name.toLowerCase())
    );

    if (existing) {
      setSelectedThreadId(existing.id);
      setIsMobileThreadViewOpen(true);
      setShowNewChatModal(false);
      return;
    }

    const newId = `thread_${Date.now()}`;
    const newThread: CopoMessage = {
      id: newId,
      senderId: recipient.id || finalEmail || `usr_${Date.now()}`,
      senderName: recipient.name,
      senderAvatar: recipient.avatar,
      senderEmail: finalEmail,
      lastMessage: "",
      timestamp: "Just now",
      createdAtMs: Date.now(),
      unreadCount: 0,
      history: []
    };

    setDraftThread(newThread);
    onUpdateMessages([newThread, ...messages]);
    setSelectedThreadId(newId);
    setIsMobileThreadViewOpen(true);
    setShowNewChatModal(false);

    // Persist thread container shell to Bunny DB immediately
    const userEmail = (currentUser?.email || "").toLowerCase().trim();
    const userHandle = (currentUser?.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
    const userName = (currentUser?.name || "").trim();

    const participants = Array.from(
      new Set([
        userEmail,
        userEmail ? userEmail.split("@")[0] : "",
        userHandle,
        userName.toLowerCase(),
        currentUser?.userId || "",
        finalEmail,
        finalEmail ? finalEmail.split("@")[0] : "",
        recipient.id,
        recipient.name.toLowerCase(),
        ...(rName === "avt ertuop" || finalEmail === "avr6566gd@gmail.com" ? ["avr6566gd@gmail.com", "avr6566gd", "avt ertuop", "avtertuop", "canon_user_avtertuop"] : []),
        ...(rName === "biz riv" || finalEmail === "louis42111@gmail.com" ? ["louis42111@gmail.com", "louis42111", "biz riv", "bizriv", "canon_user_bizriv"] : []),
        ...(rName.includes("aouisesmee") || finalEmail === "aouisesmee@gmail.com" ? ["aouisesmee@gmail.com", "aouisesmee", "canon_user_aouisesmee"] : [])
      ].filter(Boolean))
    );

    const initialPayload = {
      id: newId,
      participants,
      participantProfiles: {
        [userEmail || userHandle || "sender"]: {
          name: userName || "User",
          avatar: currentUser?.avatar || "",
          email: userEmail
        },
        [finalEmail || recipient.id || "recipient"]: {
          name: recipient.name,
          avatar: recipient.avatar,
          email: finalEmail
        }
      },
      lastMessage: "",
      lastSenderEmail: userEmail,
      lastSenderName: userName || "User",
      senderEmail: userEmail,
      senderName: userName || "User",
      senderAvatar: currentUser?.avatar || "",
      recipientEmail: finalEmail,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientAvatar: recipient.avatar,
      timestamp: "Just now",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: []
    };

    fetch(`/api/nosql/chats/${newId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: initialPayload, merge: true })
    }).catch(() => {});
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
      senderName: currentUser?.name || "You",
      senderAvatar: currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      text: text.trim(),
      timestamp: "Just now",
      isMe: true,
      videoThumbnail: sanitizedThumb,
      videoId: customVideoId
    };

    const threadHistory = activeThread.history || [];
    const updatedHistory = [...threadHistory, newMessage];

    const threadExistsInList = messages.some((m) => m.id === activeThread.id);
    const updated = threadExistsInList
      ? messages.map((m) =>
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
        )
      : [
          {
            ...activeThread,
            lastMessage: text.trim(),
            timestamp: "Just now",
            unreadCount: 0,
            videoPreviewUrl: sanitizedThumb || activeThread.videoPreviewUrl,
            history: updatedHistory
          },
          ...messages
        ];

    onUpdateMessages(updated);
    setDraftThread(null);

    const targetRecipientEmail =
      activeThread.recipientEmail ||
      activeThread.senderEmail ||
      (activeThread.senderId && activeThread.senderId.includes("@") ? activeThread.senderId : undefined);

    if (onSendMessage) {
      await onSendMessage(
        activeThread.id,
        text.trim(),
        {
          id: activeThread.senderId,
          name: activeThread.senderName,
          avatar: activeThread.senderAvatar,
          email: targetRecipientEmail
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
        avatar: matchUser.avatar || avatar || `/api/avatar?name=${encodeURIComponent(name || "User")}&background=1a73e8&color=fff`,
        bio: matchUser.bio || "Local Reviewer on Yoouz. Sharing authentic video reviews and discoveries.",
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
      avatar: avatar || `/api/avatar?name=${encodeURIComponent(name || "User")}&background=1a73e8&color=fff`,
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
    if (id && onSelectPlace && places.find(p => p.id === id || (p as any).brandDomain === id)) {
      onSelectPlace(id);
      return;
    }
    const author = resolveAuthor(name, id, avatar);
    if (onOpenCreator) {
      onOpenCreator(author);
    }
  };

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-900 flex flex-col justify-between pb-32 md:pb-6" >
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
    <div className="flex-1 h-full overflow-y-auto bg-zinc-950 text-white p-0 sm:p-4 md:p-8 flex flex-col select-none">
      
      {/* Toast alert banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col md:space-y-6 h-full">
        
        {/* Header section (Native mobile & desktop layout) */}
        <div className={`flex flex-col gap-3 bg-zinc-950 sm:bg-zinc-900 px-3.5 py-3 sm:p-5 rounded-none sm:rounded-3xl border-b sm:border border-zinc-800 shadow-xs shrink-0 ${isMobileThreadViewOpen ? "hidden md:flex" : "flex"}`}>
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back Button + Title & Counter */}
            <div className="flex items-center gap-3 min-w-0">
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs border border-zinc-800"
                  title="Back to Feed"
                  aria-label="Back to Feed"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                    {t("nav.messages", "Messages")}
                  </h1>
                  {unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-white text-zinc-950 flex items-center justify-center shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-medium truncate">
                  {unreadCount > 0
                    ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
                    : messages.length > 0
                    ? `${messages.length} conversation${messages.length > 1 ? "s" : ""}`
                    : "No conversations yet"}
                </p>
              </div>
            </div>

            {/* Right: New Chat compose button + Desktop stats */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden sm:flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 shrink-0">
                <div className="text-center border-r border-zinc-800 pr-4">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Unread</p>
                  <p className="text-sm font-black text-white">{unreadCount}</p>
                </div>
                <div className="text-center pl-1">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Chats</p>
                  <p className="text-sm font-black text-white">{messages.length}</p>
                </div>
              </div>

              <button
                type="button"
                id="btn-new-chat"
                onClick={() => {
                  setNewChatSearch("");
                  setShowNewChatModal(true);
                }}
                className="w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs border border-zinc-800"
                title="New Conversation"
                aria-label="New Conversation"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Master Chat Dashboard Frame */}
        <div className={`flex-1 bg-zinc-950 sm:bg-zinc-900 rounded-none sm:rounded-3xl sm:border border-zinc-800 shadow-sm flex overflow-hidden ${isMobileThreadViewOpen ? "fixed inset-0 z-50 md:relative md:inset-auto md:z-auto h-[100dvh] md:h-[calc(100vh-210px)] min-h-0" : "h-[calc(100vh-120px)] sm:h-[calc(100vh-210px)] min-h-[500px]"}`}>
          
          {/* Threads Column (Hidden on mobile if viewing active thread) */}
          <div className={`w-full md:w-80 border-r border-zinc-800 flex flex-col bg-zinc-950 shrink-0 ${isMobileThreadViewOpen ? "hidden md:flex" : "flex"}`}>
            {/* Search thread input */}
            <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-950">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search chats or reviewers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/90 text-xs text-white placeholder-zinc-500 pl-10 pr-9 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all font-medium shadow-inner"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of active threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-zinc-200 space-y-3 mt-4">
                  <Mail className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">No conversations yet</p>
                    <p className="text-[11px] text-zinc-200">Connect and message other community reviewers.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewChatSearch("");
                      setShowNewChatModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-white text-xs font-bold shadow-xs hover:bg-zinc-700 transition-colors cursor-pointer"
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
                          ? "bg-zinc-900 border-l-4 border-white"
                          : "hover:bg-zinc-900/60 border-l-4 border-transparent"
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
                          src={thread.senderAvatar || `/api/avatar?name=${encodeURIComponent(thread.senderName || "User")}&background=27272a&color=fff`}
                          alt={thread.senderName}
                          className="w-11 h-11 rounded-full object-cover border border-zinc-800"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} /> 
                        {threadBlocked ? (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-zinc-950 flex items-center justify-center text-white" title="Blocked user">
                            <X className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
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
                            className={`text-xs font-black truncate flex items-center gap-1.5 hover:opacity-80 cursor-pointer text-left transition-opacity ${isActive ? "text-white" : "text-zinc-200"}`}
                          >
                            <span>{thread.senderName}</span>
                            {threadBlocked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950/60 text-red-400">
                                Blocked
                              </span>
                            )}
                          </button>
                          <span className="text-[10px] text-zinc-200 font-bold shrink-0">{formatRecordedDate(thread.timestamp, thread.createdAtMs)}</span>
                        </div>
                        <p className={`text-[11px] truncate ${isUnread ? "text-white font-black" : "text-zinc-200 font-medium"}`}>
                          {thread.lastMessage || "Direct conversation"}
                        </p>
                      </div>

                      {/* White badge for unread count */}
                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Content Panel (Full on mobile when thread active, or split on md+) */}
          <div className={`flex-1 flex flex-col justify-between bg-zinc-950 relative h-full overflow-hidden ${isMobileThreadViewOpen ? "flex" : "hidden md:flex"}`}>
            {activeThread ? (
              <>
                {/* Active Chat Header */}
                <div className="p-3 sm:p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/95 sm:bg-zinc-900 backdrop-blur-xl shrink-0 z-10">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Mobile Back to List Button with large tap area */}
                    <button
                      onClick={() => {
                        setIsMobileThreadViewOpen(false);
                        if (onSelectThreadId) onSelectThreadId("");
                      }}
                      className="md:hidden w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-zinc-200 hover:text-white active:bg-zinc-800 active:scale-95 transition-all cursor-pointer shrink-0"
                      title="Back to inbox"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                      className="relative shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      <img
                        src={activeThread.senderAvatar || `/api/avatar?name=${encodeURIComponent(activeThread.senderName || "User")}&background=27272a&color=fff`}
                        alt={activeThread.senderName}
                        className="w-10 h-10 sm:w-10 sm:h-10 rounded-full object-cover border border-zinc-800"
                       onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                    </button>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                        className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-white hover:text-zinc-200 cursor-pointer text-left transition-colors"
                      >
                        <span className="truncate">{activeThread.senderName}</span>
                        <CheckCircle2 className="w-4 h-4 fill-white text-zinc-950 shrink-0" />
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isSenderBlocked ? (
                          <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Blocked by you</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-200 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                      className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                      title="Chat options & safety"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Options Dropdown Menu */}
                    {isOptionsOpen && (
                      <div className="absolute right-0 top-11 w-56 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                        {/* Mark as read option */}
                        <button
                          id="btn-mark-chat-read"
                          onClick={() => {
                            if (activeThread?.id) {
                              onMarkThreadRead?.(activeThread.id);
                              const updated = messages.map((m) =>
                                m.id === activeThread.id ? { ...m, unreadCount: 0 } : m
                              );
                              onUpdateMessages(updated);
                            }
                            setIsOptionsOpen(false);
                            showToast("Marked conversation as read.");
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4 text-emerald-400" />
                          <span>Mark as Read</span>
                        </button>

                        <div className="my-1 border-t border-zinc-800" />

                        {/* Report option */}
                        <button
                          id="btn-report-chat-user"
                          onClick={handleReportAction}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
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
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer"
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
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <UserX className="w-4 h-4 text-zinc-200" />
                            <span>Block {activeThread.senderName}</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-zinc-800" />

                        {/* Delete Conversation */}
                        <button
                          id="btn-delete-chat-thread"
                          onClick={() => {
                            setIsOptionsOpen(false);
                            setShowDeleteConfirmModal(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
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
                  <div className="bg-red-950/50 border-b border-red-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-red-300 animate-in fade-in">
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
                <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4 overscroll-contain">
                  {/* Default introductory message if history is empty */}
                  {(!activeThread.history || activeThread.history.length === 0) && (!activeThread.lastMessage || !activeThread.lastMessage.trim()) ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-4 my-auto animate-in fade-in duration-300">
                      <div className="relative">
                        <img
                          src={activeThread.senderAvatar || `/api/avatar?name=${encodeURIComponent(activeThread.senderName || "User")}&background=27272a&color=fff`}
                          alt={activeThread.senderName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700 shadow-xl"
                          onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }}
                        />
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5 font-bold text-base text-white">
                          <span>{activeThread.senderName}</span>
                          <CheckCircle2 className="w-4 h-4 fill-white text-zinc-950 shrink-0" />
                        </div>
                        <p className="text-xs text-zinc-200 max-w-xs">
                          Reviewer on Yoouz
                        </p>
                      </div>
                    </div>
                  ) : (!activeThread.history || activeThread.history.length === 0) ? (
                    <div className="flex items-start gap-3 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                        className="shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        <img
                          src={activeThread.senderAvatar || `/api/avatar?name=${encodeURIComponent(activeThread.senderName || "User")}&background=27272a&color=fff`}
                          alt={activeThread.senderName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                         onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
                      </button>
                      <div className="space-y-1 max-w-md">
                        <button
                          type="button"
                          onClick={() => handleOpenAuthorProfile(activeThread.senderName, activeThread.senderId, activeThread.senderAvatar)}
                          className="text-[10px] text-zinc-200 font-bold hover:text-white cursor-pointer transition-colors"
                        >
                          {activeThread.senderName} · {formatRecordedDate(activeThread.timestamp, activeThread.createdAtMs)}
                        </button>
                        <div className="bg-zinc-900 p-3.5 rounded-2xl rounded-tl-none text-xs text-zinc-100 border border-zinc-800 shadow-2xs leading-relaxed">
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
                            src={msg.isMe ? (currentUser?.avatar || msg.senderAvatar) : (msg.senderAvatar || `/api/avatar?name=${encodeURIComponent(msg.senderName || "User")}&background=27272a&color=fff`)}
                            alt={msg.isMe ? (currentUser?.name || msg.senderName) : msg.senderName}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-zinc-800"
                           onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />
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
                            className="text-[10px] text-zinc-200 font-bold hover:text-white cursor-pointer transition-colors"
                          >
                            {msg.isMe ? "You" : msg.senderName} · {formatRecordedDate(msg.timestamp, msg.createdAtMs)}
                          </button>
                          <div
                            className={`p-3 text-xs sm:text-sm shadow-2xs leading-relaxed rounded-2xl ${
                              msg.videoThumbnail ? "w-[260px] sm:w-[280px]" : "w-fit max-w-full"
                            } ${
                              msg.isMe
                                ? "bg-zinc-800 text-white rounded-tr-none text-left font-medium"
                                : "bg-zinc-900 text-zinc-200 rounded-tl-none text-left border border-zinc-800"
                            }`}
                          >
                            <p className="px-1">{msg.text}</p>

                            {/* Render shared recommendation / video review card inside message bubble */}
                            {msg.videoThumbnail ? (
                              <div
                                onClick={() => handleOpenVideoCard(msg.videoId)}
                                className="mt-2.5 bg-zinc-950 rounded-xl overflow-hidden shadow-sm cursor-pointer group/card border border-zinc-800 w-full"
                              >
                                <div className="relative aspect-[4/5] bg-zinc-900">
                                  <img
                                    src={msg.videoThumbnail}
                                    alt="Recommendation preview"
                                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";
                                    }} /> 
                                  <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/30 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800/95 text-white flex items-center justify-center shadow-lg group-hover/card:scale-110 transition-transform duration-300">
                                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                                    </div>
                                  </div>
                                </div>
                                <div className="px-3 py-2.5 bg-zinc-900 flex items-center justify-between gap-2 border-t border-zinc-800">
                                  <div className="flex items-center gap-1.5">
                                    <Film className="w-3.5 h-3.5 text-zinc-200" />
                                    <span className="text-[11px] font-bold text-white">Watch Video Review</span>
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
                    <div className="ml-10 max-w-xs rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xs">
                      <div className="relative aspect-[16/10]">
                        <img
                          src={activeThread.videoPreviewUrl}
                          alt="Shared video"
                          className="w-full h-full object-cover"
                        />
                        <div
                          onClick={() => handleOpenVideoCard()}
                          className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-zinc-800 hover:scale-105 cursor-pointer transition-all shadow-sm"
                        >
                          <Play className="w-4 h-4 fill-white translate-x-0.5" />
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-950 text-[11px] text-zinc-200 font-bold flex items-center justify-between border-t border-zinc-800">
                        <span className="flex items-center gap-1.5 text-white">
                          <Video className="w-4 h-4 text-zinc-200" />
                          <span>Video Recommendation</span>
                        </span>
                        <button
                          onClick={() => handleOpenVideoCard()}
                          className="text-zinc-200 hover:text-white hover:underline flex items-center gap-0.5 cursor-pointer"
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
                    <div className="absolute bottom-2 left-3 right-3 sm:left-4 sm:right-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200 z-20 space-y-3.5 max-h-[380px] flex flex-col">
                      <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-white" />
                          <h5 className="text-xs font-black text-white">
                            Share a Recommendation with {activeThread.senderName}
                          </h5>
                        </div>
                        <button
                          onClick={() => setShowQuickRecommend(false)}
                          className="p-1 rounded-full hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Search in tray */}
                      <div className="relative shrink-0">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-200" />
                        <input
                          type="text"
                          placeholder="Search your uploaded reviews..."
                          value={recommendSearch}
                          onChange={(e) => setRecommendSearch(e.target.value)}
                          className="w-full bg-zinc-950 text-xs text-white placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-white/50 font-medium"
                        />
                      </div>

                      {/* Scrollable list of items to share */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredUserVideosForRecommend.length === 0 ? (
                          <div className="p-6 text-center text-zinc-200 space-y-1.5">
                            <Film className="w-7 h-7 mx-auto text-zinc-600" />
                            <p className="text-xs font-bold text-white">No recorded reviews yet</p>
                            <p className="text-[10px] text-zinc-200">
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
                                className="p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 text-left group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
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
                                      }} /> 
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <h6 className="text-xs font-black text-white group-hover:text-white truncate">
                                      {vid.placeName}
                                    </h6>
                                    <p className="text-[10px] text-zinc-200 truncate flex items-center gap-1 mt-0.5">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                                      <span>{vid.rating || 5} · {vid.author?.name || "Verified Review"}</span>
                                    </p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-zinc-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-2xs">
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

                {/* Message input area with native physical app styling & iOS auto-zoom prevention */}
                <form
                  onSubmit={handleSendForm}
                  className="p-2.5 sm:p-4 border-t border-zinc-800/80 bg-zinc-950/95 sm:bg-zinc-900 backdrop-blur-xl flex items-center gap-2 shrink-0 z-10"
                  style={{
                    paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 8}px` : "max(12px, env(safe-area-inset-bottom, 12px))"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowQuickRecommend(!showQuickRecommend)}
                    title="Recommend a Place or Video Review"
                    className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer ${
                      showQuickRecommend
                        ? "bg-white text-black font-bold shadow-md"
                        : "bg-zinc-900 sm:bg-zinc-800 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 sm:border-zinc-700"
                    }`}
                  >
                    <MapPin className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    disabled={isSenderBlocked}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isSenderBlocked
                        ? `You have blocked ${activeThread.senderName}`
                        : `Message ${activeThread.senderName}...`
                    }
                    className="flex-1 bg-zinc-900 sm:bg-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-200 text-white placeholder-zinc-500 text-[16px] sm:text-sm px-4 py-2.5 min-h-[44px] sm:min-h-[40px] rounded-full border border-zinc-700/80 sm:border-zinc-700 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-medium"
                  />
                  
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSenderBlocked}
                    className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:bg-zinc-900 sm:disabled:bg-zinc-800 disabled:text-zinc-600 text-black flex items-center justify-center transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Send className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950 space-y-4 relative">
                {isMobileThreadViewOpen && (
                  <button
                    onClick={() => {
                      setIsMobileThreadViewOpen(false);
                      setLocalSelectedThreadId("");
                      if (onSelectThreadId) onSelectThreadId("");
                    }}
                    className="md:hidden absolute top-4 left-4 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 hover:text-white cursor-pointer"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <p className="text-base font-bold text-white font-['Google_Sans',sans-serif]">Messages</p>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    Select a conversation to message reviewers.
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
          <div className="bg-zinc-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-800 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">
                Block {activeThread.senderName}?
              </h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                They will not be able to message you or see your direct chat history. You can unblock them at any time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-200 font-bold text-xs hover:bg-zinc-800 transition-colors"
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
          <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-zinc-800 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">New Direct Message</h3>
                  <p className="text-[10px] text-zinc-200">Message community members and creators</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search member */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-200" />
              <input
                type="text"
                placeholder="Search reviewer or member by name..."
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 text-xs text-white placeholder-zinc-500 pl-9 pr-8 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-600 font-medium"
              />
              {newChatSearch && (
                <button
                  type="button"
                  onClick={() => setNewChatSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-white p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List of members / search prompt */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50 min-h-[220px] max-h-[360px] pr-1">
              {!newChatSearch.trim() ? (
                <div className="py-12 px-4 text-center text-zinc-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center mx-auto shadow-inner">
                    <Search className="w-5 h-5 text-zinc-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-200">Search members by name</p>
                    <p className="text-[11px] text-zinc-200 max-w-xs mx-auto">
                      Type a name above to find community members and creators to message.
                    </p>
                  </div>
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="py-12 px-4 text-center text-zinc-200 space-y-2">
                  <User className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs font-bold text-zinc-200">No members found</p>
                  <p className="text-[11px] text-zinc-200">
                    No member matches &ldquo;{newChatSearch.trim()}&rdquo;. Try another name.
                  </p>
                </div>
              ) : (
                filteredRecipients.map((recipient) => (
                  <div
                    key={`recip-${recipient.id}`}
                    onClick={() => handleStartNewUserChat(recipient)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-800/60 rounded-2xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={recipient.avatar}
                        alt={recipient.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-800 shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.includes('/api/avatar')) {
                            target.src = '/api/avatar?name=User&background=27272a&color=fff';
                          }
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">
                            {recipient.name}
                          </p>
                          {recipient.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                          )}
                        </div>
                        {recipient.location ? (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-200 truncate">
                            <MapPin className="w-3 h-3 text-zinc-200 shrink-0" />
                            <span className="truncate">{recipient.location}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-200 truncate">{recipient.bio || "Community reviewer"}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartNewUserChat(recipient);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 text-zinc-200 group-hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:text-white cursor-pointer"
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
          <div className="bg-zinc-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-800 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">
                Delete this conversation?
              </h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                This will delete the chat thread with {activeThread.senderName}. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-200 font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
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
