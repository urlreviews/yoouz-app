import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { motion, AnimatePresence } from "motion/react";
import { formatRecordedDate, formatChatMessageTime } from "../utils/dateUtils";
import { resolveVideoPosterUrl } from "../utils/videoUtils";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";
import { ReportTarget } from "./CopoReportModal";
import { useLanguage } from "../i18n/LanguageContext";
import { deduplicateChatHistory, deduplicateChatThreads, getThreadPartnerKey, saveReadThreadTimestamp } from "../lib/socialSync";
import { getCanonicalUserKey } from "../lib/userCanonicalization";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { getSafeAvatarUrl, formatBusinessName, formatCityCountry } from "../utils/placeUtils";
import { getPlaceLogoUrl } from "../utils/logoUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";

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
    customVideoId?: string,
    customMessageId?: string,
    customCreatedAt?: number,
    cardData?: {
      placeId?: string;
      placeName?: string;
      placeAddress?: string;
      placeCategory?: string;
      placeRating?: number;
      placeImage?: string;
    }
  ) => Promise<void>;
  onMarkThreadRead?: (threadId: string) => void;
  onSelectVideo?: (videoId: string, source?: string) => void;
  onSelectPlace?: (placeId: string) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  onOpenReport?: (target: ReportTarget) => void;
  onDeleteThread?: (threadId: string, targetPartnerKey?: string) => void;
  blockedUserIds?: string[];
  onBlockUser?: (userId: string, userName: string) => void;
  onUnblockUser?: (userId: string, userName?: string) => void;
  onNavigateToNotifications?: () => void;
  onNavigateHome?: () => void;
  unreadNotifsCount?: number;
  selectedThreadId?: string;
  onSelectThreadId?: (id: string) => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
}

export function getThreadPartnerDetails(thread: any, currentUser: UserProfile | null) {
  if (!thread) return { name: "Member", avatar: "", email: "", id: "", handle: "", isBusiness: false };

  const uEmail = (currentUser?.email || "").toLowerCase().trim();
  const uId = (currentUser?.userId || (currentUser as any)?.id || (currentUser as any)?.uid || "").toLowerCase().trim().replace(/^@/, "");
  const uName = (currentUser?.name || "").toLowerCase().trim();
  const uHandle = ((currentUser as any)?.handle || "").toLowerCase().trim().replace(/^@/, "");

  const isStevenViewing = uEmail.includes("avr6566gd") || uName.includes("steven") || uName.includes("avt");
  const isBenViewing = uEmail.includes("aouisesmee") || uEmail.includes("aouisemee") || uName.includes("ben");

  // Helper to check if a message is from currentUser
  const isMsgFromMe = (msg: any) => {
    if (!msg) return false;
    if (msg.isMe === true || msg.isMe === "true" || msg.senderName === "you" || msg.senderName === "You") return true;
    const mEmail = (msg.senderEmail || "").toLowerCase().trim();
    const mId = (msg.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const mName = (msg.senderName || "").toLowerCase().trim();
    if (uEmail && (mEmail === uEmail || mId === uEmail)) return true;
    if (uId && (mId === uId || mEmail === uId)) return true;
    if (uHandle && (mId === uHandle || mName === uHandle)) return true;
    if (uName && uName !== "user" && uName !== "member" && uName !== "reviewer" && mName === uName) return true;
    return false;
  };

  // 1. Inspect history for any message from partner
  if (Array.isArray(thread.history) && thread.history.length > 0) {
    for (let i = thread.history.length - 1; i >= 0; i--) {
      const m = thread.history[i];
      if (m && !isMsgFromMe(m)) {
        const mName = (m.senderName || "").trim();
        if (mName && mName.toLowerCase() !== "user" && mName.toLowerCase() !== "reviewer" && mName.toLowerCase() !== "member" && mName.toLowerCase() !== uName) {
          return {
            name: mName,
            avatar: m.senderAvatar || "",
            email: (m.senderEmail || "").toLowerCase().trim(),
            id: (m.senderId || "").toLowerCase().trim().replace(/^@/, ""),
            handle: ((m as any).senderHandle || "").toLowerCase().trim().replace(/^@/, ""),
            isBusiness: Boolean(thread.isBusiness || m.isBusiness)
          };
        }
      }
    }
  }

  // 2. Try participantProfiles map
  if (thread.participantProfiles && typeof thread.participantProfiles === "object") {
    const profiles = Object.entries(thread.participantProfiles);
    for (const [key, p] of profiles) {
      if (!p || typeof p !== "object") continue;
      const pEmail = ((p as any).email || key || "").toLowerCase().trim();
      const pName = ((p as any).name || "").trim();
      const pNameLower = pName.toLowerCase();
      const isMe = (uEmail && pEmail === uEmail) || (uName && pNameLower === uName && uName !== "user");
      if (!isMe && pName && pNameLower !== "user" && pNameLower !== "reviewer" && pNameLower !== "member") {
        return {
          name: pName,
          avatar: (p as any).avatar || "",
          email: pEmail,
          id: (p as any).id || key,
          handle: ((p as any).handle || "").toLowerCase().trim().replace(/^@/, ""),
          isBusiness: Boolean(thread.isBusiness)
        };
      }
    }
  }

  // 3. Compare sender vs recipient fields
  const tSenderEmail = (thread.senderEmail || "").toLowerCase().trim();
  const tSenderId = (thread.senderId || "").toLowerCase().trim().replace(/^@/, "");
  const tSenderName = (thread.senderName || "").trim();

  const isSenderMe = Boolean(
    (uEmail && (tSenderEmail === uEmail || tSenderId === uEmail)) ||
    (uId && (tSenderId === uId || tSenderEmail === uId)) ||
    (uHandle && (tSenderId === uHandle || tSenderName.toLowerCase() === uHandle)) ||
    (uName && tSenderName.toLowerCase() === uName && uName !== "member" && uName !== "user" && uName !== "reviewer")
  );

  if (isSenderMe) {
    const rName = (thread.recipientName || "").trim();
    const cleanRName = (rName && rName.toLowerCase() !== "user" && rName.toLowerCase() !== uName) ? rName : "";
    if (cleanRName) {
      return {
        name: cleanRName,
        avatar: thread.recipientAvatar || "",
        email: (thread.recipientEmail || "").toLowerCase().trim(),
        id: (thread.recipientId || "").toLowerCase().trim().replace(/^@/, ""),
        handle: ((thread as any).recipientHandle || "").toLowerCase().trim().replace(/^@/, ""),
        isBusiness: Boolean(thread.isBusiness)
      };
    }
  } else if (tSenderName && tSenderName.toLowerCase() !== "user" && tSenderName.toLowerCase() !== uName) {
    return {
      name: tSenderName,
      avatar: thread.senderAvatar || "",
      email: tSenderEmail,
      id: tSenderId,
      handle: ((thread as any).senderHandle || "").toLowerCase().trim().replace(/^@/, ""),
      isBusiness: Boolean(thread.isBusiness)
    };
  }

  // 4. Fallback for test personas (Steven Akan vs Ben Blue)
  if (isBenViewing) {
    return {
      name: "Steven Akan",
      avatar: thread.recipientAvatar || thread.senderAvatar || "",
      email: "avr6566gd@gmail.com",
      id: "stevenakan",
      handle: "stevenakan",
      isBusiness: false
    };
  }
  if (isStevenViewing) {
    return {
      name: "Ben Blue",
      avatar: thread.recipientAvatar || thread.senderAvatar || "",
      email: "aouisesmee@gmail.com",
      id: "benblue",
      handle: "benblue",
      isBusiness: false
    };
  }

  return {
    name: tSenderName || thread.recipientName || "Member",
    avatar: thread.senderAvatar || thread.recipientAvatar || "",
    email: tSenderEmail || (thread.recipientEmail || "").toLowerCase().trim(),
    id: tSenderId || (thread.recipientId || "").toLowerCase().trim().replace(/^@/, ""),
    handle: ((thread as any).senderHandle || (thread as any).recipientHandle || "").toLowerCase().trim().replace(/^@/, ""),
    isBusiness: Boolean(thread.isBusiness)
  };
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [deletedThreadKeys, setDeletedThreadKeys] = useState<Set<string>>(() => new Set());
  const [swipedThreadId, setSwipedThreadId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkTouch = () => {
        setIsTouchDevice(
          window.innerWidth < 768 &&
          ('ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches)
        );
      };
      checkTouch();
      window.addEventListener('resize', checkTouch);
      return () => window.removeEventListener('resize', checkTouch);
    }
  }, []);

  // On desktop (width >= 768), default to first thread if none selected; on mobile only select if user actively opened
  const selectedThreadId = localSelectedThreadId || propSelectedThreadId || draftThread?.id || (typeof window !== "undefined" && window.innerWidth >= 768 ? messages[0]?.id : "") || "";

  const setSelectedThreadId = (id: string) => {
    setLocalSelectedThreadId(id);
    if (id && currentUser) {
      saveReadThreadTimestamp(id, currentUser);
    }
    if (onSelectThreadId) {
      onSelectThreadId(id);
    }
    if (onMarkThreadRead && id) {
      onMarkThreadRead(id);
    }
    if (id && onUpdateMessages) {
      const updated = messages.map((m) =>
        m.id === id ? { ...m, unreadCount: 0 } : m
      );
      onUpdateMessages(updated);
    }
    setIsMobileThreadViewOpen(true);
  };

  // On desktop, auto-select first thread if none selected and notify parent to keep in sync
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      if (!localSelectedThreadId && !propSelectedThreadId && messages.length > 0) {
        const firstId = messages[0].id;
        setLocalSelectedThreadId(firstId);
        if (onSelectThreadId) onSelectThreadId(firstId);
        if (onMarkThreadRead && (messages[0].unreadCount || 0) > 0) {
          onMarkThreadRead(firstId);
        }
      }
    }
  }, [messages, localSelectedThreadId, propSelectedThreadId, onSelectThreadId, onMarkThreadRead]);

  // Sync mobile view state when thread ID changes externally
  useEffect(() => {
    if (propSelectedThreadId) {
      setLocalSelectedThreadId(propSelectedThreadId);
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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [actionThread, setActionThread] = useState<CopoMessage | null>(null);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [recipientFilterTab, setRecipientFilterTab] = useState<"all" | "businesses" | "members">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close options menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const targetEl = event.target as HTMLElement | null;
      if (targetEl?.closest?.("[data-chat-options-modal]")) {
        return;
      }
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
        setActionThread(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOptionsOpen(false);
        setActionThread(null);
        setShowBlockConfirmModal(false);
        setShowDeleteConfirmModal(false);
        setShowNewChatModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mark selected thread as read only when actually viewing the thread with unread messages
  useEffect(() => {
    if (!selectedThreadId) return;
    const isViewing = typeof window !== "undefined" && window.innerWidth >= 768 ? Boolean(localSelectedThreadId || propSelectedThreadId) : isMobileThreadViewOpen;
    if (!isViewing) return;

    const thread = messages.find((m) => m.id === selectedThreadId);
    if (thread && (thread.unreadCount || 0) > 0) {
      if (onMarkThreadRead) {
        onMarkThreadRead(selectedThreadId);
      }
      const updated = messages.map((m) =>
        m.id === selectedThreadId ? { ...m, unreadCount: 0 } : m
      );
      onUpdateMessages(updated);
    }
  }, [selectedThreadId, isMobileThreadViewOpen, localSelectedThreadId, propSelectedThreadId]);

  // Scroll to bottom of chat when active thread changes or new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadId, messages]);

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
      isBusiness?: boolean;
      category?: string;
      domain?: string;
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
    const isAouisesmee = myEmail.includes("aouisesmee") || myName.includes("aouisesmee") || myHandle.includes("aouisesmee") || myUid.includes("aouisesmee");
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

      if (isAouisesmee && (e.includes("aouisesmee") || n.includes("aouisesmee") || h.includes("aouisesmee"))) return true;
      if (isAvtErtuop && (e.includes("avr6566gd") || n.includes("avt") || h.includes("avt"))) return true;
      if (isBizRiv && (e.includes("louis42111") || n.includes("biz") || h.includes("biz"))) return true;

      return false;
    };

    const isDeleted = (cand: { email?: string; name?: string; id?: string; handle?: string }) => {
      const e = (cand.email || "").toLowerCase().trim();
      const n = (cand.name || "").toLowerCase().trim();
      const i = (cand.id || "").toLowerCase().trim();
      const h = (cand.handle || "").replace(/^@+/, "").toLowerCase().trim();

      // Exclude admin emails from public directory
      if (e === "admin@yoouz.com" || i === "admin-user-id") {
        return true;
      }

      return (
        (e && deletedSet.has(e)) ||
        (n && deletedSet.has(n)) ||
        (i && deletedSet.has(i)) ||
        (h && deletedSet.has(h))
      );
    };

    // STRONG GUARD 31: Disallow mock, fake, anonymous UUID, or generic placeholder accounts
    const isDisallowedRecipient = (cand: { email?: string; name?: string; id?: string; handle?: string }) => {
      const e = (cand.email || "").toLowerCase().trim();
      const n = (cand.name || "").toLowerCase().trim();
      const i = (cand.id || "").toLowerCase().trim();
      const h = (cand.handle || "").replace(/^@+/, "").toLowerCase().trim();

      // 1. Must have at least some identifier
      if (!e && !n && !h) return true;

      // 2. Reject pure anonymous UUIDs without registered email
      const isUuidOnly = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(i);
      if (isUuidOnly && (!e || !e.includes("@"))) return true;

      // 3. Reject generic / placeholder / mock names without registered email
      const isGenericName = !n || 
        n === "reviewer" || 
        n === "user" || 
        n === "registered user" || 
        n === "verified reviewer" || 
        n === "community creator" || 
        n === "local guide";

      if (isGenericName && (!e || !e.includes("@"))) return true;

      return false;
    };

    const getCanonicalKey = (cand: { email?: string; name?: string; id?: string; handle?: string }): string => {
      return getCanonicalUserKey(cand);
    };

    // 1. Ingest from allUsers
    allUsers.forEach((u: any) => {
      const uId = u.userId || u.uid || u.id || u.email;
      const uEmail = (u.email || "").toLowerCase().trim();
      const uName = (u.name || "").trim();
      const uHandle = (u.handle || "").trim();

      const cand = { email: uEmail, name: uName, id: uId, handle: uHandle };
      if (isMe(cand) || isDeleted(cand) || isDisallowedRecipient(cand)) return;
      const key = getCanonicalKey(cand);
      if (!key) return;

      const existing = map.get(key);
      const hasUploadedAvatar = (av?: string) =>
        Boolean(av && !av.includes("ui-avatars") && !av.includes("/api/avatar?name=User"));
      const bestAvatar = (hasUploadedAvatar(u.avatar) ? u.avatar : "") ||
        (hasUploadedAvatar(existing?.avatar) ? existing?.avatar : "") ||
        u.avatar ||
        existing?.avatar;
      const bestEmail = (uEmail && uEmail.includes("@") ? uEmail : "") || (existing?.email && existing.email.includes("@") ? existing.email : "");
      
      let bestName = uName && uName !== "Registered User" && uName !== "Reviewer" && uName !== "User" ? uName : (existing?.name || "");
      if (!bestName && bestEmail) {
        bestName = bestEmail.split("@")[0];
      }
      if (!bestName || bestName.toLowerCase() === "reviewer" || bestName.toLowerCase() === "user" || bestName.toLowerCase() === "registered user") {
        return; // Never insert a mock/nameless "Reviewer" card
      }

      const bestLocation = (u.location && u.location.length >= (existing?.location?.length || 0)) ? u.location : (existing?.location || u.location);
      const bestBio = (u.bio && u.bio.length >= (existing?.bio?.length || 0)) ? u.bio : (existing?.bio || u.bio || (bestLocation ? `Creator in ${bestLocation}` : "Community Member"));
      const isVerified = Boolean(u.isVerified ?? existing?.isVerified ?? true);
      const bestId = (bestEmail && bestEmail.includes("@") ? bestEmail : "") || (existing?.id && existing.id.includes("@") ? existing.id : "") || uId || existing?.id || key;

      map.set(key, {
        id: bestId,
        name: bestName,
        avatar: getSafeAvatarUrl(bestAvatar, bestName, bestId),
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
      if (isMe(cand) || isDeleted(cand) || isDisallowedRecipient(cand)) return;
      const key = getCanonicalKey(cand);
      if (!key) return;

      const existing = map.get(key);
      const hasUploadedAvatar = (av?: string) =>
        Boolean(av && !av.includes("ui-avatars") && !av.includes("/api/avatar?name=User"));
      const bestAvatar = (hasUploadedAvatar(v.author.avatar) ? v.author.avatar : "") ||
        (hasUploadedAvatar(existing?.avatar) ? existing?.avatar : "") ||
        v.author.avatar ||
        existing?.avatar;
      const bestEmail = (aEmail && aEmail.includes("@") ? aEmail : "") || (existing?.email && existing.email.includes("@") ? existing.email : "");
      
      let bestName = aName && aName !== "Registered User" && aName !== "Reviewer" && aName !== "User" ? aName : (existing?.name || "");
      if (!bestName && bestEmail) {
        bestName = bestEmail.split("@")[0];
      }
      if (!bestName || bestName.toLowerCase() === "reviewer" || bestName.toLowerCase() === "user" || bestName.toLowerCase() === "registered user") {
        return; // Never insert a mock/nameless "Reviewer" card
      }

      const bestLocation = (v.author.location && v.author.location.length >= (existing?.location?.length || 0)) ? v.author.location : (existing?.location || v.author.location);
      const bestBio = (v.author.bio && v.author.bio.length >= (existing?.bio?.length || 0)) ? v.author.bio : (existing?.bio || v.author.bio || (bestLocation ? `Creator in ${bestLocation}` : "Video Creator"));
      const isVerified = Boolean(v.author.isVerified ?? existing?.isVerified ?? true);
      const bestId = (bestEmail && bestEmail.includes("@") ? bestEmail : "") || (existing?.id && existing.id.includes("@") ? existing.id : "") || aId || existing?.id || key;

      map.set(key, {
        id: bestId,
        name: bestName,
        avatar: getSafeAvatarUrl(bestAvatar, bestName, bestId),
        email: bestEmail,
        bio: bestBio,
        location: bestLocation,
        isVerified
      });
    });

    // 3. Ingest businesses from places - STRICT RULE: Only claimed businesses can receive direct messages
    (places || []).forEach((p: Place) => {
      if (!p || !p.id) return;
      const pId = String(p.id).trim();

      // Only allow claimed businesses or Yoouz official
      const isClaimed = Boolean(
        p.isClaimed === true ||
        (p.claimedByEmail && p.claimedByEmail.trim() !== "") ||
        p.subscriptionPlan === "pro" ||
        p.subscriptionPlan === "premium" ||
        pId === "yoouz.com" ||
        pId === "yoouz" ||
        pId === "yoouz-com"
      );
      if (!isClaimed) return; // Completely hide unclaimed businesses from direct message directory

      const pDomain = (p.brandDomain || p.website || pId).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim();
      const pName = formatBusinessName(p.name || p.brandDomain || pId) || "Business";
      const pEmail = (p.claimedByEmail || p.email || (pId === "yoouz.com" || pId === "yoouz" ? "info@yoouz.com" : "")).toLowerCase().trim();

      // Don't show the business to its own manager if logged in as that business
      const myUserEmail = (currentUser?.email || "").toLowerCase().trim();
      if (myUserEmail && pEmail && myUserEmail === pEmail) return;

      const pKey = `place_${pId.toLowerCase()}`;
      if (map.has(pKey)) return;

      const placeLogo = getPlaceLogoUrl(p) || p.avatarUrl || p.logoUrl || `/api/avatar?name=${encodeURIComponent(pName)}&background=27272a&color=fff`;
      const location = [p.city, p.country].filter(Boolean).join(", ") || p.address || "Business";
      const bio = p.category || (p.description ? p.description.slice(0, 70) : "Verified Business");

      map.set(pKey, {
        id: pId,
        name: pName,
        avatar: placeLogo,
        email: pEmail || (pId === "yoouz.com" ? "info@yoouz.com" : undefined),
        bio: bio,
        location: location,
        isVerified: Boolean(p.isVerified || p.isClaimed || pId === "yoouz.com" || pId === "yoouz-com"),
        isBusiness: true,
        category: p.category || "Business",
        domain: pDomain
      });
    });

    // Guarantee Yoouz Official platform is always reachable unless currentUser is info@yoouz.com
    if (!map.has("place_yoouz.com") && !map.has("place_yoouz")) {
      const myUserEmail = (currentUser?.email || "").toLowerCase().trim();
      if (myUserEmail !== "info@yoouz.com") {
        map.set("place_yoouz.com", {
          id: "yoouz.com",
          name: "Yoouz",
          avatar: "/favicon.svg",
          email: "info@yoouz.com",
          bio: "Official Yoouz Support & Community",
          location: "Global Platform",
          isVerified: true,
          isBusiness: true,
          category: "Platform Support",
          domain: "yoouz.com"
        });
      }
    }

    return Array.from(map.values());
  }, [allUsers, allVideos, places, currentUser]);

  // Recipient search: Do not pre-dump the entire directory when opening modal.
  // User can search by name/keyword, or switch to "Businesses" to browse directory.
  const filteredRecipients = useMemo(() => {
    const q = newChatSearch.toLowerCase().trim().replace(/^@/, "");

    let pool = availableRecipients;
    if (recipientFilterTab === "businesses") {
      pool = pool.filter((r) => r.isBusiness);
    } else if (recipientFilterTab === "members") {
      pool = pool.filter((r) => !r.isBusiness);
    }

    if (!q) {
      if (recipientFilterTab === "businesses") {
        return pool.slice(0, 50);
      }
      return [];
    }

    return pool.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const location = (r.location || "").toLowerCase();
      const bio = (r.bio || "").toLowerCase();
      const category = (r.category || "").toLowerCase();
      const domain = (r.domain || "").toLowerCase();
      const id = (r.id || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        location.includes(q) ||
        bio.includes(q) ||
        category.includes(q) ||
        domain.includes(q) ||
        id.includes(q)
      );
    });
  }, [availableRecipients, newChatSearch, recipientFilterTab]);

  const handleStartNewUserChat = (recipient: {
    id: string;
    name: string;
    avatar: string;
    email?: string;
    isBusiness?: boolean;
    category?: string;
    domain?: string;
  }) => {
    // Check if recipient is an unclaimed business
    if (recipient.isBusiness) {
      const rId = (recipient.id || "").toLowerCase().trim();
      const rName = (recipient.name || "").toLowerCase().trim();
      const matchingPlace = (places || []).find((p) => {
        const pId = String(p.id || "").toLowerCase().trim();
        const pName = (p.name || "").toLowerCase().trim();
        const pDom = (p.brandDomain || "").toLowerCase().trim();
        return pId === rId || pName === rName || pDom === rId;
      });

      if (matchingPlace) {
        const isClaimed = Boolean(
          matchingPlace.isClaimed === true ||
          (matchingPlace.claimedByEmail && matchingPlace.claimedByEmail.trim() !== "") ||
          matchingPlace.subscriptionPlan === "pro" ||
          matchingPlace.subscriptionPlan === "premium" ||
          matchingPlace.id === "yoouz.com" ||
          matchingPlace.id === "yoouz"
        );
        if (!isClaimed) {
          setToastMessage("This business is not yet claimed on Yoouz.");
          setTimeout(() => setToastMessage(""), 3500);
          return;
        }
      }
    }

    let finalEmail = recipient.email;
    const rName = (recipient.name || "").toLowerCase().trim();
    const rId = (recipient.id || "").toLowerCase().trim();
    if (!finalEmail || !finalEmail.includes("@")) {
      if (rId.includes("@")) {
        finalEmail = rId;
      } else if (rName === "yoouz" || rId === "yoouz.com" || rId === "yoouz") {
        finalEmail = "info@yoouz.com";
      } else if (rName === "avt ertuop" || rId.includes("avtertuop") || rId.includes("avr6566gd")) {
        finalEmail = "avr6566gd@gmail.com";
      } else if (rName === "biz riv" || rId.includes("bizriv") || rId.includes("louis42111")) {
        finalEmail = "louis42111@gmail.com";
      } else if (rName.includes("aouisesmee") || rId.includes("aouisesmee")) {
        finalEmail = "aouisesmee@gmail.com";
      }
    }

    // Check if an existing thread exists by partner key or direct IDs
    const targetPartnerKey = getThreadPartnerKey({
      senderId: recipient.id,
      senderName: recipient.name,
      senderEmail: finalEmail || recipient.email,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientEmail: finalEmail || recipient.email
    }, currentUser);

    const existing = messages.find(
      (m) =>
        m.id === recipient.id ||
        (targetPartnerKey && getThreadPartnerKey(m, currentUser) === targetPartnerKey) ||
        m.senderId === recipient.id ||
        (m as any).recipientId === recipient.id ||
        (finalEmail && (m.senderId === finalEmail || m.senderEmail === finalEmail || (m as any).recipientEmail === finalEmail)) ||
        (m.senderName && recipient.name && m.senderName.toLowerCase() === recipient.name.toLowerCase()) ||
        ((m as any).recipientName && recipient.name && (m as any).recipientName.toLowerCase() === recipient.name.toLowerCase())
    );

    if (existing) {
      setSelectedThreadId(existing.id);
      setIsMobileThreadViewOpen(true);
      setShowNewChatModal(false);
      return;
    }

    const newId = `thread_${Date.now()}`;
    const isBizRecipient = Boolean(
      recipient.isBusiness === true ||
      recipient.id === "yoouz.com" ||
      recipient.id === "yoouz" ||
      (recipient.name && recipient.name.toLowerCase().trim() === "yoouz")
    );

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
        recipient.id.toLowerCase(),
        recipient.name.toLowerCase(),
        ...(rName === "yoouz" || rId === "yoouz.com" || finalEmail === "info@yoouz.com" ? ["yoouz.com", "yoouz", "info@yoouz.com"] : []),
        ...(rName === "avt ertuop" || finalEmail === "avr6566gd@gmail.com" ? ["avr6566gd@gmail.com", "avr6566gd", "avt ertuop", "avtertuop"] : []),
        ...(rName === "biz riv" || finalEmail === "louis42111@gmail.com" ? ["louis42111@gmail.com", "louis42111", "biz riv", "bizriv"] : []),
        ...(rName.includes("aouisesmee") || finalEmail === "aouisesmee@gmail.com" ? ["aouisesmee@gmail.com", "aouisesmee"] : [])
      ].filter(Boolean))
    );

    const newThread: CopoMessage = {
      id: newId,
      senderId: recipient.id || finalEmail || `usr_${Date.now()}`,
      senderName: recipient.name,
      senderAvatar: recipient.avatar,
      senderEmail: finalEmail,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientAvatar: recipient.avatar,
      recipientEmail: finalEmail,
      isBusiness: isBizRecipient,
      placeId: isBizRecipient && recipient.id !== "yoouz" && recipient.id !== "yoouz.com" ? (recipient.id as any) : undefined,
      participants,
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

  // Filter threads based on search with deduplication and instant local deleted filter
  const filteredThreads = useMemo(() => {
    const deduped = deduplicateChatThreads(messages, currentUser);
    const visible = deduped.filter((m) => {
      if (!m) return false;
      const mId = String(m.id || "").trim();
      const mPartnerKey = getThreadPartnerKey(m, currentUser);
      if (deletedThreadKeys.has(mId)) return false;
      if (mPartnerKey && deletedThreadKeys.has(mPartnerKey)) return false;
      return true;
    });

    if (!searchTerm.trim()) return visible;
    const q = searchTerm.toLowerCase();
    return visible.filter((m) =>
      m.senderName.toLowerCase().includes(q) ||
      (m.lastMessage && m.lastMessage !== "Conversation started" && m.lastMessage.toLowerCase().includes(q))
    );
  }, [messages, searchTerm, deletedThreadKeys, currentUser]);

  const activeThread = useMemo(() => {
    if (draftThread) {
      const draftKey = getThreadPartnerKey(draftThread, currentUser);
      if (draftThread.id === selectedThreadId || draftThread.senderId === selectedThreadId || (draftKey && draftKey === selectedThreadId)) {
        return filteredThreads.find((m) => m.id === selectedThreadId || getThreadPartnerKey(m, currentUser) === selectedThreadId || m.senderId === selectedThreadId) ||
               messages.find((m) => m.id === selectedThreadId || getThreadPartnerKey(m, currentUser) === selectedThreadId || m.senderId === selectedThreadId) ||
               draftThread;
      }
    }
    if (selectedThreadId) {
      const foundInFiltered = filteredThreads.find((m) => m.id === selectedThreadId || getThreadPartnerKey(m, currentUser) === selectedThreadId || m.senderId === selectedThreadId || m.recipientId === selectedThreadId || m.senderEmail === selectedThreadId || m.recipientEmail === selectedThreadId);
      if (foundInFiltered) return foundInFiltered;
      const found = messages.find((m) => m.id === selectedThreadId || getThreadPartnerKey(m, currentUser) === selectedThreadId || m.senderId === selectedThreadId || m.recipientId === selectedThreadId || m.senderEmail === selectedThreadId || m.recipientEmail === selectedThreadId);
      if (found) return found;
    }
    if (draftThread) return draftThread;
    return filteredThreads[0] || messages[0];
  }, [messages, filteredThreads, selectedThreadId, draftThread, currentUser]);

  const isSenderBlocked = useMemo(() => {
    if (!activeThread) return false;
    const sId = (activeThread.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const sName = (activeThread.senderName || "").toLowerCase().trim();
    return blockedUserIds.some((bId) => {
      const cleanB = (bId || "").toLowerCase().trim().replace(/^@/, "");
      return cleanB === sId || cleanB === sName || (sId.includes(cleanB) && cleanB.length > 2);
    });
  }, [activeThread, blockedUserIds]);

  const targetActionThread = actionThread || activeThread;

  const isActionTargetBlocked = useMemo(() => {
    if (!targetActionThread) return false;
    const sId = (targetActionThread.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const sName = (targetActionThread.senderName || "").toLowerCase().trim();
    return blockedUserIds.some((bId) => {
      const cleanB = (bId || "").toLowerCase().trim().replace(/^@/, "");
      return cleanB === sId || cleanB === sName || (sId.includes(cleanB) && cleanB.length > 2);
    });
  }, [targetActionThread, blockedUserIds]);

  // Total unread count for the header info
  const unreadCount = useMemo(() => {
    return filteredThreads.reduce((acc, m) => {
      if (m.id === selectedThreadId) return acc;
      return acc + (m.unreadCount || 0);
    }, 0);
  }, [filteredThreads, selectedThreadId]);

  const partnerDetails = useMemo(() => {
    return getThreadPartnerDetails(activeThread, currentUser);
  }, [activeThread, currentUser]);

  // Clean, filtered messages for the active conversation
  const checkIsMessageFromMe = useCallback((msg: any): boolean => {
    if (!msg) return false;

    // 1. Local explicit flag
    if (msg.isMe === true || msg.isMe === "true" || msg.senderName === "you" || msg.senderName === "You") {
      return true;
    }

    const msgSenderEmail = (msg.senderEmail || "").toLowerCase().trim();
    const msgSenderId = (msg.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const msgSenderName = (msg.senderName || "").toLowerCase().trim();
    const msgSenderHandle = (msg.senderHandle || "").toLowerCase().trim().replace(/^@/, "");

    const userEmail = (currentUser?.email || "").toLowerCase().trim();
    const userName = (currentUser?.name || "").toLowerCase().trim();
    const userId = (currentUser?.userId || (currentUser as any)?.id || (currentUser as any)?.uid || "").toLowerCase().trim().replace(/^@/, "");
    const userHandle = ((currentUser as any)?.handle || "").toLowerCase().trim().replace(/^@/, "");

    // 2. Direct email match
    if (userEmail && (msgSenderEmail === userEmail || msgSenderId === userEmail)) {
      return true;
    }

    // 3. Direct user ID / handle match
    if (userId && (msgSenderId === userId || msgSenderEmail === userId)) {
      return true;
    }
    if (userHandle && (msgSenderHandle === userHandle || msgSenderId === userHandle)) {
      return true;
    }

    // Persona checks
    const isStevenViewing = userEmail.includes("avr6566gd") || userName.includes("steven") || userName.includes("avt");
    const isBenViewing = userEmail.includes("aouisesmee") || userEmail.includes("aouisemee") || userName.includes("ben");

    if (isStevenViewing) {
      if (msgSenderName.includes("ben") || msgSenderEmail.includes("aouisesmee") || msgSenderId.includes("ben")) {
        return false;
      }
      if (msgSenderName.includes("steven") || msgSenderName.includes("avt") || msgSenderEmail.includes("avr6566gd") || msgSenderId.includes("steven") || msgSenderId.includes("avt")) {
        return true;
      }
    }

    if (isBenViewing) {
      if (msgSenderName.includes("steven") || msgSenderName.includes("avt") || msgSenderEmail.includes("avr6566gd") || msgSenderId.includes("steven") || msgSenderId.includes("avt")) {
        return false;
      }
      if (msgSenderName.includes("ben") || msgSenderEmail.includes("aouisesmee") || msgSenderId.includes("ben")) {
        return true;
      }
    }

    // 4. Name match (only if not a generic string)
    const isGenericName = !userName || userName === "user" || userName === "member" || userName === "reviewer";
    if (!isGenericName && userName === msgSenderName) {
      return true;
    }

    return false;
  }, [currentUser]);

  const activeThreadMessages = useMemo(() => {
    return deduplicateChatHistory(activeThread?.history || []).filter((m: any) => {
      const t = (m.text || "").trim();
      if (t === "Conversation started" || t === "Direct conversation") return false;
      return Boolean(t || m.videoThumbnail || m.videoId || m.placeId || m.placeName);
    });
  }, [activeThread?.history]);



  const handleSendText = async (
    text: string,
    videoUrl?: string,
    customVideoId?: string,
    cardData?: {
      placeId?: string;
      placeName?: string;
      placeAddress?: string;
      placeCategory?: string;
      placeRating?: number;
      placeImage?: string;
    }
  ) => {
    if (!text.trim() && !videoUrl && !customVideoId && !cardData?.placeId && !cardData?.placeName) return;
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

    const nowMs = Date.now();
    const deterministicMsgId = `msg_${nowMs}_${Math.random().toString(36).substring(2, 6)}`;
    const curEmail = (currentUser?.email || "").toLowerCase().trim();
    const curId = (currentUser?.userId || (currentUser as any)?.id || "").toLowerCase().trim();
    const curName = (currentUser?.name || "").trim();

    const newMessage = {
      id: deterministicMsgId,
      senderName: curName || "Reviewer",
      senderAvatar: currentUser?.avatar || generateGoogleLetterAvatarSvg(curName || "User", 128, curEmail || curName || "User"),
      senderEmail: curEmail,
      senderId: curEmail || curId || curName,
      text: text.trim(),
      timestamp: "Just now",
      createdAt: nowMs,
      createdAtMs: nowMs,
      isMe: true,
      videoThumbnail: sanitizedThumb,
      videoId: customVideoId,
      placeId: cardData?.placeId,
      placeName: cardData?.placeName,
      placeAddress: cardData?.placeAddress,
      placeCategory: cardData?.placeCategory,
      placeRating: cardData?.placeRating,
      placeImage: cardData?.placeImage
    };

    const threadHistory = activeThread.history || [];
    const updatedHistory = deduplicateChatHistory([...threadHistory, newMessage]);

    const activePartnerKey = getThreadPartnerKey(activeThread, currentUser);
    const threadExistsInList = messages.some(
      (m) => m.id === activeThread.id || (activePartnerKey && getThreadPartnerKey(m, currentUser) === activePartnerKey)
    );
    const updated = threadExistsInList
      ? messages.map((m) =>
          m.id === activeThread.id || (activePartnerKey && getThreadPartnerKey(m, currentUser) === activePartnerKey)
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

    setDeletedThreadKeys((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      if (activeThread.id) next.delete(activeThread.id);
      if (activePartnerKey) next.delete(activePartnerKey);
      if (activeThread.senderName) next.delete(activeThread.senderName.toLowerCase().trim());
      if (activeThread.senderId) next.delete(activeThread.senderId.toLowerCase().trim());
      return next;
    });

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
        customVideoId,
        deterministicMsgId,
        nowMs,
        cardData
      );
    }
  };



  const handleSendForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    handleSendText(replyText);
    setReplyText("");
  };

  const handleMarkAsReadAction = (targetOverride?: CopoMessage | null) => {
    const target = targetOverride || targetActionThread;
    if (!target) return;
    if (onMarkThreadRead) {
      onMarkThreadRead(target.id);
    }
    const updated = messages.map((m) =>
      m.id === target.id ? { ...m, unreadCount: 0 } : m
    );
    onUpdateMessages(updated);
    setIsOptionsOpen(false);
    setActionThread(null);
    showToast("Marked conversation as read.");
  };

  const handleBlockUserAction = (targetOverride?: CopoMessage | null) => {
    const target = targetOverride || targetActionThread;
    if (!target) return;
    const targetId = target.senderId || target.senderName;
    if (onBlockUser) {
      onBlockUser(targetId, target.senderName);
    }
    setShowBlockConfirmModal(false);
    setIsOptionsOpen(false);
    setActionThread(null);
    showToast(`Blocked @${target.senderName}. You will no longer receive messages.`);
  };

  const handleUnblockUserAction = (targetOverride?: CopoMessage | null) => {
    const target = targetOverride || targetActionThread;
    if (!target) return;
    const targetId = target.senderId || target.senderName;
    if (onUnblockUser) {
      onUnblockUser(targetId, target.senderName);
    }
    setIsOptionsOpen(false);
    setActionThread(null);
    showToast(`Unblocked @${target.senderName}.`);
  };

  const handleDeleteConversation = (targetOverride?: CopoMessage | null) => {
    const target = targetOverride || targetActionThread;
    if (!target) return;
    
    const partnerKey = getThreadPartnerKey(target);
    const tId = String(target.id || "").trim();
    const sName = (target.senderName || "").toLowerCase().trim();
    const sId = (target.senderId || "").toLowerCase().trim();
    const sEmail = (target.senderEmail || target.lastSenderEmail || "").toLowerCase().trim();

    // 0. Mark as deleted in local set for INSTANT 0ms DOM removal and collapse animation
    setDeletedThreadKeys((prev) => {
      const next = new Set(prev);
      if (tId) next.add(tId);
      if (partnerKey) next.add(partnerKey);
      if (sName) next.add(sName);
      if (sId) next.add(sId);
      if (sEmail) next.add(sEmail);
      return next;
    });

    // 1. Instantly filter messages in local state for 0ms visual feedback
    const remaining = messages.filter((m) => {
      const mId = String(m.id || "").trim();
      const mPartnerKey = getThreadPartnerKey(m);
      const mName = (m.senderName || "").toLowerCase().trim();
      const mIdKey = (m.senderId || "").toLowerCase().trim();
      if (tId && mId === tId) return false;
      if (partnerKey && mPartnerKey === partnerKey) return false;
      if (sName && mName === sName) return false;
      if (sId && mIdKey === sId) return false;
      return true;
    });
    onUpdateMessages(remaining);

    // 2. Call parent to persist deletion in BunnyDB & local deletion cache
    if (onDeleteThread) {
      onDeleteThread(target.id, target as any);
    }
    
    // 3. Clear active selection if the deleted thread was currently open
    if (target.id === selectedThreadId || target.id === localSelectedThreadId) {
      setLocalSelectedThreadId("");
      setIsMobileThreadViewOpen(false);
      if (onSelectThreadId) onSelectThreadId("");
    }
    
    // 4. Close all action modals and reset state
    setShowDeleteConfirmModal(false);
    setIsOptionsOpen(false);
    setActionThread(null);
    showToast("Conversation deleted.");
  };

  const handleReportAction = (targetOverride?: CopoMessage | null) => {
    const target = targetOverride || targetActionThread;
    if (!target) return;
    setIsOptionsOpen(false);
    setActionThread(null);
    if (onOpenReport) {
      onOpenReport({
        type: "user",
        author: {
          name: target.senderName,
          avatar: target.senderAvatar,
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
  const resolveAuthor = (name?: string, id?: string, avatar?: string): VideoAuthor | null => {
    // 1. Check in allVideos for matching author
    const matchVideo = allVideos.find(
      (v) =>
        (v.author?.name && name && v.author.name.toLowerCase() === name.toLowerCase()) ||
        (v.author?.name && name && v.author.name.toLowerCase() === name.toLowerCase().replace(/^@/, '')) ||
        (id && v.author?.name && v.author.name.toLowerCase() === id.toLowerCase().replace(/^@/, '')) ||
        (id && (v.author?.id === id || (v.author as any)?.userId === id || v.userId === id))
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
      const uName = (matchUser.name || name || "").trim();
      const uEmail = matchUser.email || (id && id.includes('@') ? id : undefined);
      if (!uName || uName.toLowerCase() === "reviewer" || uName.toLowerCase() === "user" || uName.toLowerCase() === "registered user") {
        if (uEmail) {
          const derivedName = uEmail.split("@")[0];
          return {
            name: derivedName,
            email: uEmail,
            userId: matchUser.userId || matchUser.id || id,
            id: matchUser.id || matchUser.userId || id,
            avatar: getSafeAvatarUrl(matchUser.avatar || avatar, derivedName, matchUser.userId || matchUser.id || id || derivedName),
            bio: matchUser.bio || "",
            location: matchUser.location || "",
            followersCount: matchUser.followersCount || 0,
            isVerified: Boolean(matchUser.isVerified === true),
          };
        }
        return null;
      }
      return {
        name: uName,
        email: uEmail,
        userId: matchUser.userId || matchUser.id || id,
        id: matchUser.id || matchUser.userId || id,
        avatar: getSafeAvatarUrl(matchUser.avatar || avatar, uName, matchUser.userId || matchUser.id || id || uName),
        bio: matchUser.bio || "",
        location: matchUser.location || "",
        followersCount: matchUser.followersCount || 0,
        isVerified: Boolean(matchUser.isVerified === true),
      };
    }

    // 3. Fallback: If not found in allVideos or allUsers, construct a valid author object dynamically using the passed parameters instead of returning null
    const fallbackName = (name || "User").trim();
    const fallbackEmail = id && id.includes('@') ? id : undefined;
    return {
      name: fallbackName,
      email: fallbackEmail,
      userId: id || name || "user",
      id: id || name || "user",
      avatar: avatar || getSafeAvatarUrl(avatar, fallbackName, id),
      bio: "Active Yoouz Member",
      location: "Global Community",
      followersCount: 0,
      isVerified: false,
    };
  };

  const checkIsBusinessThread = (thread: any) => {
    if (!thread) return false;
    const sId = (thread.senderId || "").toLowerCase().trim();
    const sName = (thread.senderName || "").toLowerCase().trim();

    if (sName === "yoouz" || sId === "yoouz.com" || sId === "yoouz" || sId === "info@yoouz.com") {
      return true;
    }

    if (thread.isBusiness === true) {
      if (!sId.includes("@") && (sId.includes(".") || sId.startsWith("place-"))) return true;
      if ((places || []).some((p) => (p.id || "").toLowerCase() === sId || (p.website || "").toLowerCase().includes(sId))) {
        return true;
      }
    }

    return false;
  };

  const checkIsThreadVerified = useCallback((thread: any): boolean => {
    if (!thread) return false;
    const sId = (thread.senderId || "").toLowerCase().trim();
    const sName = (thread.senderName || "").toLowerCase().trim();
    const sEmail = (thread.senderEmail || "").toLowerCase().trim();

    // 1. Official Yoouz system account
    if (sName === "yoouz" || sId === "yoouz.com" || sId === "yoouz" || sEmail === "info@yoouz.com") {
      return true;
    }

    // 2. Business thread: verify against claimed/verified places ONLY
    if (checkIsBusinessThread(thread) || thread.isBusiness) {
      const matchingPlace = (places || []).find(
        (p) =>
          (p.id && (p.id.toLowerCase() === sId || p.id.toLowerCase() === thread.placeId?.toLowerCase())) ||
          (p.website && p.website.toLowerCase().includes(sId)) ||
          (p.name && p.name.toLowerCase() === sName)
      );
      if (matchingPlace) {
        return Boolean(matchingPlace.isClaimed || matchingPlace.isVerified);
      }
      return false;
    }

    // 3. User / Creator: verify ONLY if user explicitly has isVerified === true
    const matchUser = (allUsers || []).find(
      (u) =>
        (u.name && u.name.toLowerCase() === sName) ||
        (u.userId && u.userId.toLowerCase() === sId) ||
        (u.id && u.id.toLowerCase() === sId) ||
        (u.email && u.email.toLowerCase() === sEmail)
    );
    if (matchUser && matchUser.isVerified === true) {
      return true;
    }

    return false;
  }, [places, allUsers]);

  const isPartnerVerified = useMemo(() => {
    if (!activeThread) return false;
    return checkIsThreadVerified(activeThread);
  }, [activeThread, checkIsThreadVerified]);

  const activeThreadPlace = useMemo(() => {
    if (!activeThread) return null;
    const sId = (activeThread.senderId || "").toLowerCase().trim();
    const sName = (activeThread.senderName || "").toLowerCase().trim();
    const threadPlaceId = (activeThread.placeId || "").toLowerCase().trim();

    return (places || []).find((p) => {
      const pId = (p.id || "").toLowerCase().trim();
      const pName = (p.name || "").toLowerCase().trim();
      const pWeb = (p.website || "").toLowerCase().trim();
      return (
        (threadPlaceId && pId === threadPlaceId) ||
        (sId && (pId === sId || pWeb.includes(sId))) ||
        (sName && pName === sName)
      );
    }) || null;
  }, [activeThread, places]);

  const handleOpenAuthorProfile = (
    name?: string,
    id?: string,
    avatar?: string,
    explicitPlaceId?: string,
    isBiz?: boolean
  ) => {
    const cleanId = (id || "").toLowerCase().trim();
    const cleanName = (name || "").toLowerCase().trim();
    const cleanExplicit = (explicitPlaceId || "").toLowerCase().trim();

    // STRICT GUARD: If cleanId contains '@', starts with 'usr_'/'user_', or is NOT a business, ALWAYS open creator drawer!
    if (cleanId.includes("@") || cleanId.startsWith("usr_") || cleanId.startsWith("user_") || isBiz === false) {
      const author = resolveAuthor(name, id, avatar);
      if (author && onOpenCreator) {
        onOpenCreator(author);
      }
      return;
    }

    // 1. Check if clicking Yoouz (Official platform business page)
    const isYoouzBusiness =
      cleanName === "yoouz" ||
      cleanName === "yoouz.com" ||
      cleanName === "yoouz beta" ||
      cleanId === "yoouz" ||
      cleanId === "yoouz.com" ||
      cleanId === "info@yoouz.com";

    if (isYoouzBusiness) {
      if (onSelectPlace) {
        onSelectPlace("yoouz.com");
        return;
      }
    }

    // 2. ONLY if explicitly a business account (e.g. isBiz === true AND id/explicitPlaceId is a place/domain format)
    const isExplicitBusiness = isBiz === true && !cleanId.includes("@") && (cleanId.includes(".") || cleanId.startsWith("place-") || cleanExplicit.length > 0);
    if (isExplicitBusiness) {
      const matchingPlace = (places || []).find((p) => {
        const pId = (p.id || "").toLowerCase().trim();
        const pDomain = (p.website || (p as any).brandDomain || (p as any).domain || p.id || "")
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .split("/")[0]
          .trim();
        return (
          pId === cleanId ||
          pDomain === cleanId ||
          pId === `${cleanId}.com` ||
          pDomain === `${cleanId}.com` ||
          (cleanExplicit && (pId === cleanExplicit || pDomain === cleanExplicit))
        );
      });

      if (matchingPlace && onSelectPlace) {
        onSelectPlace(matchingPlace.id);
        return;
      }

      if (cleanExplicit && onSelectPlace) {
        onSelectPlace(cleanExplicit);
        return;
      }

      if (!cleanId.includes("@") && (cleanId.includes(".") || cleanId.startsWith("place-")) && onSelectPlace) {
        onSelectPlace(cleanId);
        return;
      }
    }

    // 3. For all human users/creators (e.g. Ben Blue, Samet, etc.), resolve their author profile and open creator drawer!
    const author = resolveAuthor(name, id, avatar);
    if (author && onOpenCreator) {
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
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center justify-center shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-medium truncate">
                  {unreadCount > 0
                    ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
                    : filteredThreads.length > 0
                    ? `${filteredThreads.length} conversation${filteredThreads.length > 1 ? "s" : ""}`
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
                <AnimatePresence initial={false}>
                  {filteredThreads.map((thread) => {
                    const isActive = thread.id === selectedThreadId;
                    const threadPartner = getThreadPartnerDetails(thread, currentUser);
                    const lastHistMsg = thread.history && thread.history.length > 0 ? (thread.history[thread.history.length - 1] as any) : null;
                    const isLastMsgMe = Boolean(
                      lastHistMsg?.isMe ||
                      (currentUser?.email && (lastHistMsg?.senderEmail?.toLowerCase() === currentUser.email.toLowerCase() || lastHistMsg?.senderId?.toLowerCase() === currentUser.email.toLowerCase())) ||
                      (currentUser?.userId && lastHistMsg?.senderId?.toLowerCase() === currentUser.userId.toLowerCase()) ||
                      (currentUser?.name && lastHistMsg?.senderName?.toLowerCase() === currentUser.name.toLowerCase())
                    );
                    const isUnread = !isActive && !isLastMsgMe && Number(thread.unreadCount) > 0;
                    const threadBlocked = blockedUserIds.some((b) => {
                      const cb = (b || "").toLowerCase().replace(/^@/, "").trim();
                      const sId = (threadPartner.id || "").toLowerCase().replace(/^@/, "").trim();
                      const sName = (threadPartner.name || "").toLowerCase().trim();
                      return cb === sId || cb === sName;
                    });

                    return (
                      <motion.div
                        key={`chat-thread-${thread.id}`}
                        initial={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden", transition: { duration: 0.2 } }}
                        className="relative overflow-hidden bg-zinc-950 group select-none"
                      >
                        {/* Swipe-to-reveal Red Delete Button (Behind card - Mobile Touch Only) */}
                        {isTouchDevice && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDraggingRef.current) return;
                              handleDeleteConversation(thread);
                              setSwipedThreadId(null);
                            }}
                            className="md:hidden absolute inset-y-0 right-0 w-24 bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer select-none active:bg-rose-800 z-0"
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                            <span>Delete</span>
                          </div>
                        )}

                        {/* Thread Card (drag to reveal Delete button on touch screens) */}
                        <motion.div
                          drag={isTouchDevice ? "x" : false}
                          dragConstraints={isTouchDevice ? { left: -96, right: 0 } : undefined}
                          dragElastic={isTouchDevice ? 0.12 : false}
                          animate={{ x: isTouchDevice && swipedThreadId === thread.id ? -96 : 0 }}
                          transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          onDragStart={() => {
                            isDraggingRef.current = true;
                          }}
                          onDragEnd={isTouchDevice ? (_, info) => {
                            // If dragged left past threshold, reveal delete button. Otherwise snap back closed.
                            if (info.offset.x < -35 || info.velocity.x < -200) {
                              setSwipedThreadId(thread.id);
                            } else {
                              setSwipedThreadId(null);
                            }
                            setTimeout(() => {
                              isDraggingRef.current = false;
                            }, 300);
                          } : undefined}
                          onClick={() => {
                            if (isDraggingRef.current) return;
                            if (swipedThreadId === thread.id) {
                              setSwipedThreadId(null);
                              return;
                            }
                            if (swipedThreadId) {
                              setSwipedThreadId(null);
                            }
                            setSelectedThreadId(thread.id);
                          }}
                          className={`p-3.5 sm:p-4 flex items-center gap-3.5 cursor-pointer transition-colors relative z-10 bg-zinc-950 ${
                            isActive
                              ? "bg-zinc-900 border-l-4 border-white"
                              : "hover:bg-zinc-900/60 border-l-4 border-transparent"
                          }`}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAuthorProfile(threadPartner.name, threadPartner.id || threadPartner.email, threadPartner.avatar, undefined, threadPartner.isBusiness);
                            }}
                            className="relative shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                          >
                            {threadPartner.isBusiness ? (
                              <CopoBrandLogo
                                domain={threadPartner.id}
                                name={threadPartner.name}
                                logoUrl={threadPartner.avatar}
                                className="w-11 h-11 rounded-xl bg-white p-1 border border-zinc-200/60 shrink-0 shadow-xs flex items-center justify-center overflow-hidden ring-1 ring-white/10"
                                imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast]"
                                fallbackTextClassName="font-extrabold text-xs text-zinc-950"
                              />
                            ) : (
                              <img
                                src={getSafeAvatarUrl(threadPartner.avatar, threadPartner.name, threadPartner.id)}
                                alt={threadPartner.name}
                                className="w-11 h-11 rounded-full object-cover border border-zinc-800"
                                onError={(e) => { const target = e.currentTarget as HTMLImageElement; target.src = getSafeAvatarUrl(null, threadPartner.name, threadPartner.id); }} 
                              />
                            )}
                            {threadBlocked ? (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-zinc-950 flex items-center justify-center text-white" title="Blocked user">
                                <X className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAuthorProfile(threadPartner.name, threadPartner.id || threadPartner.email, threadPartner.avatar, undefined, threadPartner.isBusiness);
                                }}
                                className={`text-xs font-black truncate flex items-center gap-1.5 hover:opacity-80 cursor-pointer text-left transition-opacity ${isActive ? "text-white" : "text-zinc-200"}`}
                              >
                                <span>{threadPartner.name}</span>
                                {checkIsThreadVerified(thread) && (
                                  <span title="Verified" className="inline-flex items-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                                  </span>
                                )}
                                {threadBlocked && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950/60 text-red-400">
                                    Blocked
                                  </span>
                                )}
                              </button>
                              <span className="text-[10px] text-zinc-400 font-bold shrink-0">{formatRecordedDate(thread.timestamp, thread.createdAtMs)}</span>
                            </div>
                            <p className={`text-[11px] truncate ${isUnread ? "text-white font-black" : "text-zinc-300 font-medium"}`}>
                              {(() => {
                                const raw = (thread.lastMessage || "").trim();
                                if (raw && raw !== "Conversation started" && raw !== "Direct conversation") {
                                  return raw;
                                }
                                const hist = thread.history || [];
                                const lastHistMsg = hist.length > 0 ? (hist[hist.length - 1]?.text || "").trim() : "";
                                if (lastHistMsg && lastHistMsg !== "Conversation started" && lastHistMsg !== "Direct conversation") {
                                  return lastHistMsg;
                                }
                                return <span className="italic text-zinc-500 font-normal">No messages yet</span>;
                              })()}
                            </p>
                          </div>

                          {/* Right side controls: Unread badge & action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isUnread && (
                              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-zinc-950">
                                {thread.unreadCount > 99 ? "99+" : (thread.unreadCount || 1)}
                              </span>
                            )}
                            <button
                              type="button"
                              id={`btn-thread-options-${thread.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionThread(thread);
                                setIsOptionsOpen(true);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer shrink-0"
                              title={`Options for ${thread.senderName}`}
                              aria-label={`Options for ${thread.senderName}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
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
                        setLocalSelectedThreadId("");
                        if (onSelectThreadId) onSelectThreadId("");
                      }}
                      className="md:hidden w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-zinc-200 hover:text-white active:bg-zinc-800 active:scale-95 transition-all cursor-pointer shrink-0"
                      title="Back to inbox"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAuthorProfile(partnerDetails.name, partnerDetails.id || partnerDetails.email, partnerDetails.avatar, undefined, partnerDetails.isBusiness)}
                      className="relative shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      {partnerDetails.isBusiness ? (
                        <CopoBrandLogo
                          domain={partnerDetails.id}
                          name={partnerDetails.name}
                          logoUrl={partnerDetails.avatar}
                          className="w-10 h-10 sm:w-10 sm:h-10 rounded-xl bg-white p-1 border border-zinc-200/60 shrink-0 shadow-xs flex items-center justify-center overflow-hidden ring-1 ring-white/10"
                          imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast]"
                          fallbackTextClassName="font-extrabold text-xs text-zinc-950"
                        />
                      ) : (
                        <img
                          src={getSafeAvatarUrl(partnerDetails.avatar, partnerDetails.name, partnerDetails.id)}
                          alt={partnerDetails.name}
                          className="w-10 h-10 sm:w-10 sm:h-10 rounded-full object-cover border border-zinc-800"
                          onError={(e) => { const target = e.currentTarget as HTMLImageElement; target.src = getSafeAvatarUrl(null, partnerDetails.name, partnerDetails.id); }} 
                        />
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                    </button>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorProfile(partnerDetails.name, partnerDetails.id || partnerDetails.email, partnerDetails.avatar, undefined, partnerDetails.isBusiness)}
                        className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-white hover:text-zinc-200 cursor-pointer text-left transition-colors"
                      >
                        <span className="truncate">{partnerDetails.name}</span>
                        {isPartnerVerified && (
                          <span title="Verified" className="inline-flex items-center">
                            <CheckCircle2 className="w-4 h-4 fill-white text-zinc-950 shrink-0" />
                          </span>
                        )}
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
                      onClick={() => {
                        setActionThread(activeThread);
                        setIsOptionsOpen(!isOptionsOpen);
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                      title="Chat options & safety"
                      aria-label="Chat options & safety"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Desktop Dropdown Menu (hidden on mobile, uses full bottom action sheet on mobile) */}
                    {isOptionsOpen && targetActionThread && (
                      <div className="hidden md:block absolute right-0 top-11 w-56 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                        {/* Mark as read option */}
                        <button
                          id="btn-mark-chat-read"
                          onClick={() => handleMarkAsReadAction(targetActionThread)}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4 text-emerald-400" />
                          <span>Mark as Read</span>
                        </button>

                        <div className="my-1 border-t border-zinc-800" />

                        {/* Report option */}
                        <button
                          id="btn-report-chat-user"
                          onClick={() => handleReportAction(targetActionThread)}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Flag className="w-4 h-4 text-red-500" />
                          <span>Report User or Messages</span>
                        </button>

                        {/* Block/Unblock toggle */}
                        {isActionTargetBlocked ? (
                          <button
                            id="btn-unblock-chat-user"
                            onClick={() => handleUnblockUserAction(targetActionThread)}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>Unblock {targetActionThread.senderName}</span>
                          </button>
                        ) : (
                          <button
                            id="btn-block-chat-user"
                            onClick={() => handleBlockUserAction(targetActionThread)}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <UserX className="w-4 h-4 text-zinc-200" />
                            <span>Block {targetActionThread.senderName}</span>
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
                        You blocked {partnerDetails.name}. New messages from this user are blocked.
                      </span>
                    </div>
                    <button
                      onClick={() => handleUnblockUserAction(activeThread)}
                      className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold text-[11px] hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                )}

                {/* Messages Log area */}
                <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4 overscroll-contain">
                  {/* Introductory profile greeting when conversation has no messages yet */}
                  {activeThreadMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3.5 my-auto animate-in fade-in duration-300">
                      <div 
                        className="relative cursor-pointer hover:opacity-85 transition-opacity"
                        onClick={() => handleOpenAuthorProfile(partnerDetails.name, partnerDetails.id || partnerDetails.email, partnerDetails.avatar, undefined, partnerDetails.isBusiness)}
                      >
                        {partnerDetails.isBusiness ? (
                          <CopoBrandLogo
                            domain={partnerDetails.id}
                            name={partnerDetails.name}
                            logoUrl={partnerDetails.avatar}
                            className="w-20 h-20 rounded-2xl bg-white p-2 border-2 border-zinc-700 shadow-xl flex items-center justify-center overflow-hidden"
                            imageClassName="w-full h-full object-contain rounded-lg"
                            fallbackTextClassName="font-extrabold text-base text-zinc-950"
                          />
                        ) : (
                          <img
                            src={getSafeAvatarUrl(partnerDetails.avatar, partnerDetails.name, partnerDetails.id)}
                            alt={partnerDetails.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700 shadow-xl"
                            onError={(e) => { const target = e.currentTarget as HTMLImageElement; target.src = getSafeAvatarUrl(null, partnerDetails.name, partnerDetails.id); }}
                          />
                        )}
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                      </div>

                      <div className="space-y-1 max-w-sm">
                        <button
                          type="button"
                          onClick={() => handleOpenAuthorProfile(partnerDetails.name, partnerDetails.id || partnerDetails.email, partnerDetails.avatar, undefined, partnerDetails.isBusiness)}
                          className="flex items-center justify-center gap-1.5 font-bold text-base text-white hover:text-zinc-200 cursor-pointer transition-colors mx-auto"
                        >
                          <span>{partnerDetails.name}</span>
                          {isPartnerVerified && (
                            <span title="Verified" className="inline-flex items-center">
                              <CheckCircle2 className="w-4 h-4 fill-white text-zinc-950 shrink-0" />
                            </span>
                          )}
                        </button>
                        <p className="text-xs text-zinc-400 font-medium">
                          Active on Yoouz
                        </p>
                        <p className="text-[11px] text-zinc-500 pt-1.5 font-medium">
                          No messages yet. Say hello or share a recommendation to start the conversation!
                        </p>
                      </div>
                    </div>
                  ) : (
                    activeThreadMessages.map((msg) => {
                      const isMe = checkIsMessageFromMe(msg);
                      const isBiz = Boolean(partnerDetails.isBusiness);
                      const currentUserName = (currentUser?.name || "").toLowerCase().trim();
                      const rawSenderName = (msg.senderName || "").trim();
                      const displaySenderName = isMe
                        ? "You"
                        : (rawSenderName && rawSenderName.toLowerCase() !== currentUserName && rawSenderName.toLowerCase() !== "you"
                            ? rawSenderName 
                            : partnerDetails.name);
                      const displayAvatar = isMe
                        ? (currentUser?.avatar || msg.senderAvatar)
                        : (msg.senderAvatar || partnerDetails.avatar);

                      return (
                        <div
                          key={`msg-log-${msg.id}`}
                          className={`flex items-start gap-2.5 sm:gap-3 ${isMe ? "flex-row-reverse" : ""} animate-in fade-in duration-200`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isMe && currentUser) {
                                handleOpenAuthorProfile(currentUser.name, currentUser.userId || currentUser.email, currentUser.avatar);
                              } else {
                                handleOpenAuthorProfile(partnerDetails.name, partnerDetails.id || partnerDetails.email, partnerDetails.avatar, undefined, partnerDetails.isBusiness);
                              }
                            }}
                            className="shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                          >
                            {(() => {
                              if (isMe) {
                                return (
                                  <img
                                    src={getSafeAvatarUrl(displayAvatar, currentUser?.name || "You", currentUser?.email || (currentUser as any)?.handle)}
                                    alt={currentUser?.name || "You"}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-zinc-800"
                                    onError={(e) => { const target = e.currentTarget as HTMLImageElement; target.src = getSafeAvatarUrl(null, currentUser?.name || "You", currentUser?.email); }}
                                  />
                                );
                              }

                              if (isBiz) {
                                return (
                                  <CopoBrandLogo
                                    domain={partnerDetails.id}
                                    name={partnerDetails.name}
                                    logoUrl={displayAvatar}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white p-0.5 border border-zinc-200/60 shrink-0 shadow-xs flex items-center justify-center overflow-hidden ring-1 ring-white/10"
                                    imageClassName="w-full h-full object-contain rounded-sm"
                                    fallbackTextClassName="font-extrabold text-[10px] text-zinc-950"
                                  />
                                );
                              }

                              return (
                                <img
                                  src={getSafeAvatarUrl(displayAvatar, displaySenderName, msg.senderId || partnerDetails.id)}
                                  alt={displaySenderName}
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-zinc-800"
                                  onError={(e) => { const target = e.currentTarget as HTMLImageElement; target.src = getSafeAvatarUrl(null, displaySenderName, msg.senderId); }}
                                />
                              );
                            })()}
                          </button>
                          <div className={`flex flex-col space-y-1 max-w-sm sm:max-w-md ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                            <button
                              type="button"
                              onClick={() => {
                                if (isMe && currentUser) {
                                  handleOpenAuthorProfile(currentUser.name, currentUser.userId || currentUser.email, currentUser.avatar);
                                } else {
                                  handleOpenAuthorProfile(partnerDetails.name, partnerDetails.id || partnerDetails.email, partnerDetails.avatar, undefined, partnerDetails.isBusiness);
                                }
                              }}
                              className="text-[10px] text-zinc-200 font-bold hover:text-white cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <span>{displaySenderName}</span>
                              {!isMe && isPartnerVerified && (
                                <span title="Verified" className="inline-flex items-center">
                                  <CheckCircle2 className="w-2.5 h-2.5 fill-white text-zinc-950 shrink-0" />
                                </span>
                              )}
                              <span>· {formatChatMessageTime(msg.timestamp, msg.createdAtMs)}</span>
                            </button>
                            <div
                              className={`p-3 text-xs sm:text-sm shadow-2xs leading-relaxed rounded-2xl w-fit max-w-full ${
                                isMe
                                  ? "bg-zinc-800 text-white rounded-tr-none text-left font-medium"
                                  : "bg-zinc-900 text-zinc-200 rounded-tl-none text-left border border-zinc-800"
                              }`}
                            >
                              <p className="px-1">{msg.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message input area with native physical app styling & iOS auto-zoom prevention */}
                <form
                  onSubmit={handleSendForm}
                  className="p-2.5 sm:p-4 border-t border-zinc-800/80 bg-zinc-950/95 sm:bg-zinc-900 backdrop-blur-xl flex items-center gap-2 shrink-0 z-10"
                  style={{
                    paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 8}px` : "max(12px, env(safe-area-inset-bottom, 12px))"
                  }}
                >
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

      {/* Universal Chat Options (Action Sheet on Mobile & Modal on Desktop for Thread List) */}
      {isOptionsOpen && targetActionThread && (
        <div
          data-chat-options-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-xs p-0 md:p-4 animate-in fade-in duration-200"
          onClick={() => {
            setIsOptionsOpen(false);
            setActionThread(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-sm bg-zinc-900 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl p-5 space-y-3 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-200 pb-8 md:pb-5"
          >
            {/* Mobile drag bar */}
            <div className="md:hidden w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-2" />

            {/* Target profile preview header */}
            {(() => {
              const actionPartner = targetActionThread ? getThreadPartnerDetails(targetActionThread, currentUser) : null;
              const pName = actionPartner?.name || "Member";
              const pAvatar = actionPartner?.avatar || "";
              const pId = actionPartner?.id || actionPartner?.email || "user";
              return (
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getSafeAvatarUrl(pAvatar, pName, pId)}
                      alt={pName}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = getSafeAvatarUrl(null, pName, pId);
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {pName}
                      </p>
                      <p className="text-[11px] text-zinc-400">Conversation options</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsOpen(false);
                      setActionThread(null);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}
            <div className="space-y-1">
              {/* Mark as read option */}
              <button
                type="button"
                id="btn-options-mark-read"
                onClick={() => {
                  if (onMarkThreadRead && targetActionThread) {
                    onMarkThreadRead(targetActionThread.id);
                  }
                  if (targetActionThread) {
                    const updated = messages.map((m) =>
                      m.id === targetActionThread.id ? { ...m, unreadCount: 0 } : m
                    );
                    onUpdateMessages?.(updated);
                  }
                  setIsOptionsOpen(false);
                  setActionThread(null);
                  showToast("Marked as read");
                }}
                className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-2xl flex items-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Mark as Read</span>
              </button>

              {/* Report option */}
              <button
                type="button"
                id="btn-options-report-user"
                onClick={() => handleReportAction(targetActionThread)}
                className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-red-400 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <Flag className="w-5 h-5 text-red-500 shrink-0" />
                <span>Report User or Messages</span>
              </button>

              {/* Block / Unblock toggle */}
              {isActionTargetBlocked ? (
                <button
                  type="button"
                  id="btn-options-unblock-user"
                  onClick={() => handleUnblockUserAction(targetActionThread)}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-emerald-400 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Unblock {targetActionThread.senderName}</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-options-block-user"
                  onClick={() => handleBlockUserAction(targetActionThread)}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-red-400 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <UserX className="w-5 h-5 text-zinc-400 shrink-0" />
                  <span>Block {targetActionThread.senderName}</span>
                </button>
              )}

              {/* Delete Conversation */}
              <button
                type="button"
                id="btn-options-delete-thread"
                onClick={() => {
                  setIsOptionsOpen(false);
                  setShowDeleteConfirmModal(true);
                }}
                className="w-full px-4 py-3 text-left text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
                <span>Delete Conversation</span>
              </button>
            </div>

            {/* Cancel button */}
            <button
              type="button"
              onClick={() => {
                setIsOptionsOpen(false);
                setActionThread(null);
              }}
              className="w-full py-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-bold text-sm text-center active:scale-[0.99] transition-all cursor-pointer mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal Dialog */}
      {showBlockConfirmModal && targetActionThread && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-800 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">
                Block {targetActionThread.senderName}?
              </h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                They will not be able to message you or see your direct chat history. You can unblock them at any time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-200 font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBlockUserAction(targetActionThread)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
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
                  <p className="text-[10px] text-zinc-400">Message businesses, community members, and creators</p>
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

            {/* Filter Tabs: All / Businesses / Members */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setRecipientFilterTab("all")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  recipientFilterTab === "all"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRecipientFilterTab("businesses")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  recipientFilterTab === "businesses"
                    ? "bg-zinc-850 text-white border border-zinc-700 shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Businesses</span>
              </button>
              <button
                type="button"
                onClick={() => setRecipientFilterTab("members")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  recipientFilterTab === "members"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Members</span>
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={
                  recipientFilterTab === "businesses"
                    ? "Search business by name, category, or city..."
                    : recipientFilterTab === "members"
                    ? "Search reviewer or member by name..."
                    : "Search business, reviewer, or member by name..."
                }
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 text-xs text-white placeholder-zinc-500 pl-9 pr-8 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-600 font-medium"
              />
              {newChatSearch && (
                <button
                  type="button"
                  onClick={() => setNewChatSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List of recipients / search prompt */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50 min-h-[220px] max-h-[360px] pr-1">
              {!newChatSearch.trim() && recipientFilterTab !== "businesses" ? (
                <div className="py-12 px-4 text-center text-zinc-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-300 flex items-center justify-center mx-auto shadow-inner">
                    <Search className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-200">
                      {recipientFilterTab === "members" ? "Search community members" : "Search businesses & members"}
                    </p>
                    <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                      {recipientFilterTab === "members"
                        ? "Type a reviewer or member name above to message them directly."
                        : "Type a business or member name above, or switch to the Businesses tab."}
                    </p>
                  </div>
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="py-12 px-4 text-center text-zinc-400 space-y-2">
                  {recipientFilterTab === "businesses" ? (
                    <Building2 className="w-8 h-8 mx-auto text-zinc-600" />
                  ) : (
                    <User className="w-8 h-8 mx-auto text-zinc-600" />
                  )}
                  <p className="text-xs font-bold text-zinc-200">No results found</p>
                  <p className="text-[11px] text-zinc-400">
                    No {recipientFilterTab === "businesses" ? "business" : recipientFilterTab === "members" ? "member" : "business or member"} matches &ldquo;{newChatSearch.trim()}&rdquo;.
                  </p>
                </div>
              ) : (
                filteredRecipients.map((recipient) => (
                  <div
                    key={`recip-${recipient.id}`}
                    onClick={() => handleStartNewUserChat(recipient)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-850/80 rounded-2xl cursor-pointer transition-colors group border border-transparent hover:border-zinc-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {recipient.isBusiness ? (
                        <CopoBrandLogo
                          domain={recipient.domain || recipient.id}
                          name={recipient.name}
                          logoUrl={recipient.avatar}
                          className="w-10 h-10 rounded-xl bg-white p-1 border border-zinc-200/60 shrink-0 shadow-xs flex items-center justify-center overflow-hidden ring-1 ring-white/10"
                          imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast]"
                          fallbackTextClassName="font-extrabold text-xs text-zinc-950"
                        />
                      ) : (
                        <img
                          src={getSafeAvatarUrl(recipient.avatar, recipient.name, recipient.id)}
                          alt={recipient.name}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-800 shrink-0"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = getSafeAvatarUrl(null, recipient.name, recipient.id);
                          }}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                            {recipient.name}
                          </p>
                          {recipient.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 fill-white text-zinc-950 shrink-0" />
                          )}
                          {recipient.isBusiness && (
                            <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[9px] font-bold shrink-0">
                              Business
                            </span>
                          )}
                        </div>
                        {recipient.location ? (
                          <div className="flex items-start gap-1 text-[11px] text-zinc-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                            <span className="whitespace-normal break-words leading-tight">
                              {formatCityCountry(recipient.location || recipient)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-400 whitespace-normal break-words leading-tight mt-0.5">
                            {recipient.bio || (recipient.isBusiness ? "Verified Business" : "Community reviewer")}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartNewUserChat(recipient);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs border border-zinc-700/60"
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
      {showDeleteConfirmModal && targetActionThread && (
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
                This will delete the chat thread with {targetActionThread.senderName}. This action cannot be undone.
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
                onClick={() => handleDeleteConversation(targetActionThread)}
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
