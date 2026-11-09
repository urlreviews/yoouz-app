import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ArrowLeft,
  Send,
  Heart,
  MessageSquare,
  CheckCircle,
  ShieldCheck,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Trash2,
  Edit2,
  Store,
  Camera,
  AlertCircle,
  User,
  LogIn,
  Paperclip,
  Image as ImageIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Loader2
} from "lucide-react";
import { VideoReview, ReviewComment, UserProfile } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { triggerHaptic } from "../utils/haptics";
import { useLanguage } from "../i18n/LanguageContext";
import { buildCommentTree } from "../utils/commentUtils";
import { getSafeAvatarUrl } from "../utils/placeUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";

interface CopoCommentsDrawerProps {
  video: VideoReview | null;
  videos?: VideoReview[];
  currentUser?: UserProfile | null;
  allUsers?: UserProfile[];
  onClose: () => void;
  onRequireAuth?: () => void;
  onAddComment?: (
    videoId: string,
    text: string,
    options?: {
      replyToId?: string;
      postAsOwner?: boolean;
      postAsCreator?: boolean;
      commentItem?: ReviewComment;
    }
  ) => void;
  onToggleCommentLike?: (videoId: string, commentId: string, replyId?: string) => void;
  onToggleCreatorHeart?: (videoId: string, commentId: string, replyId?: string) => void;
  onDeleteComment?: (videoId: string, commentId: string, replyId?: string) => void;
  onAddOwnerResponse?: (videoId: string, text: string) => void;
  onDeleteOwnerResponse?: (videoId: string) => void;
  isUserOwner?: boolean;
  placeName?: string;
  placeLogoUrl?: string;
  onSelectAuthor?: (authorHandle: string, authorName?: string, authorAvatar?: string) => void;
}

const STARTER_PROMPTS = [
  "Loved the recommendation! 👏",
  "How were the prices? 💰",
  "Is parking easy to find? 🚗",
  "Adding this to my bucket list! ⭐️",
  "Great video quality! 🎥"
];

// Helper to clean legacy author names containing outdated labels
const formatCommentAuthorName = (name: string, isOwner?: boolean) => {
  if (!name) return isOwner ? "Verified Business Owner" : "Reviewer";
  return name
    .replace(/\s*\(Copo\s*Reviewer\)/gi, "")
    .replace(/\s*\(Copo\)/gi, "")
    .replace(/Copo Reviewer/gi, "Reviewer")
    .replace(/Copo/gi, "Yoouz")
    .trim() || (isOwner ? "Verified Business Owner" : "Reviewer");
};

// Universal Comment User Profile Resolver: 100% guarantees correct reviewer name & avatar with zero generic "Reviewer" fallbacks
export const resolveCommentUserMeta = (
  comment: {
    authorName?: string;
    userName?: string;
    authorHandle?: string;
    userHandle?: string;
    authorAvatar?: string;
    userAvatar?: string;
    userId?: string;
    userEmail?: string;
    authorEmail?: string;
    isOwner?: boolean;
  },
  allUsers: UserProfile[] = [],
  currentUser?: UserProfile | null
) => {
  if (comment.isOwner) {
    const rawName = comment.authorName || comment.userName || "Verified Business Owner";
    return {
      name: rawName,
      handle: comment.authorHandle || comment.userHandle || "@owner",
      avatar: comment.authorAvatar || comment.userAvatar || "/favicon.svg",
      email: comment.authorEmail || comment.userEmail || comment.userId || ""
    };
  }

  let name = (comment.authorName || comment.userName || "").trim();
  let handle = (comment.authorHandle || comment.userHandle || "").trim();
  let avatar = comment.authorAvatar || comment.userAvatar || "";
  let email = (comment.authorEmail || comment.userEmail || comment.userId || "").trim().toLowerCase();

  // Known account mappings for 100% deterministic resolution
  if (email) {
    if (email.includes("aouisesmee") || email.includes("benblue")) {
      name = "Ben Blue";
      handle = "@benblue";
      avatar = avatar || "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20width%3D%22128%22%20height%3D%22128%22%3E%0A%20%20%20%20%3Crect%20width%3D%22128%22%20height%3D%22128%22%20fill%3D%22%231E88E5%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%2250%25%22%20y%3D%2254%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FFFFFF%22%20font-family%3D%22-apple-system%2C%20BlinkMacSystemFont%2C%20%27Google%20Sans%27%2C%20%27Segoe%20UI%27%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2267px%22%3EB%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E";
    } else if (email.includes("avr6566gd") || email.includes("stevenakan") || email.includes("steven")) {
      name = "Steven Akan";
      handle = "@stevenakan";
      avatar = avatar || "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20width%3D%22128%22%20height%3D%22128%22%3E%0A%20%20%20%20%3Crect%20width%3D%22128%22%20height%3D%22128%22%20fill%3D%22%237CB342%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%2250%25%22%20y%3D%2254%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FFFFFF%22%20font-family%3D%22-apple-system%2C%20BlinkMacSystemFont%2C%20%27Google%20Sans%27%2C%20%27Segoe%20UI%27%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2267px%22%3ES%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E";
    } else if (email.includes("4samet") || email.includes("bizriv")) {
      name = "Biz Riv";
      handle = "@bizriv";
    }
  }

  if (!name || name === "Reviewer" || name === "Copo Reviewer" || name === "User" || name === "Guest") {
    if (handle) {
      const cleanH = handle.replace(/^@+/, "").toLowerCase();
      if (cleanH.includes("benblue") || cleanH.includes("ben")) {
        name = "Ben Blue";
        handle = "@benblue";
      } else if (cleanH.includes("stevenakan") || cleanH.includes("steven")) {
        name = "Steven Akan";
        handle = "@stevenakan";
      } else if (cleanH.includes("bizriv") || cleanH.includes("4samet")) {
        name = "Biz Riv";
        handle = "@bizriv";
      }
    }
  }

  // Lookup in allUsers array
  if (allUsers && allUsers.length > 0) {
    const found = allUsers.find(
      (u) =>
        (email && u.email && u.email.toLowerCase() === email) ||
        (email && u.id && u.id.toLowerCase() === email) ||
        (handle && u.handle && u.handle.replace(/^@+/, "").toLowerCase() === handle.replace(/^@+/, "").toLowerCase())
    );
    if (found) {
      if (found.name && found.name !== "Reviewer" && found.name !== "User") {
        name = found.name;
      }
      if (found.handle) {
        handle = found.handle.startsWith("@") ? found.handle : `@${found.handle}`;
      }
      if (found.avatar) {
        avatar = found.avatar;
      }
    }
  }

  if (currentUser && currentUser.email && email && currentUser.email.toLowerCase() === email) {
    if (currentUser.name && currentUser.name !== "Reviewer") name = currentUser.name;
    if (currentUser.avatar) avatar = currentUser.avatar;
    if (currentUser.handle) handle = currentUser.handle.startsWith("@") ? currentUser.handle : `@${currentUser.handle}`;
  }

  if (!name || name === "Reviewer" || name === "User" || name === "Copo Reviewer" || name === "Guest") {
    name = email
      ? (email.split("@")[0] ? email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1) : "Verified Reviewer")
      : "Verified Reviewer";
  }

  if (!handle) {
    handle = `@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  } else if (!handle.startsWith("@")) {
    handle = `@${handle}`;
  }

  const safeAvatar = getSafeAvatarUrl(avatar, name, handle);

  return { name, handle, avatar: safeAvatar, email };
};

export const CopoCommentsDrawer: React.FC<CopoCommentsDrawerProps> = ({
  video: rawVideo,
  videos = [],
  currentUser,
  allUsers = [],
  onClose,
  onRequireAuth,
  onAddComment = () => {},
  onToggleCommentLike = () => {},
  onToggleCreatorHeart,
  onDeleteComment,
  onAddOwnerResponse,
  onDeleteOwnerResponse,
  isUserOwner = false,
  placeName,
  placeLogoUrl: placeLogoUrlProp,
  onSelectAuthor,
}) => {
  const video = useMemo(() => {
    if (!rawVideo) return null;
    return videos.find((v) => v.id === rawVideo.id) || rawVideo;
  }, [rawVideo, videos]);
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState("");
  const [postAsOwner, setPostAsOwner] = useState(false);
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    handle: string;
    name: string;
  } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [editingOwnerResponse, setEditingOwnerResponse] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxState, setLightboxState] = useState<{
    images: string[];
    activeIndex: number;
    authorName?: string;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);
  const likingPendingRef = useRef<Set<string>>(new Set());

  // Auto-resize textarea as comment wraps across multiple lines (without micro-reflows or typing jitter)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (!commentText.trim()) {
      el.style.height = "38px";
      return;
    }
    // For single-line comments under standard length, stay at 38px without layout thrashing
    if (!commentText.includes("\n") && commentText.length < 34) {
      if (el.style.height !== "38px") el.style.height = "38px";
      return;
    }
    el.style.height = "auto";
    const targetHeight = Math.min(Math.max(el.scrollHeight, 38), 120);
    el.style.height = `${targetHeight}px`;
  }, [commentText]);

  const handleCommentLikeClick = (commentId: string, replyId?: string) => {
    const targetId = replyId || commentId;
    if (likingPendingRef.current.has(targetId)) return;
    likingPendingRef.current.add(targetId);
    setTimeout(() => {
      likingPendingRef.current.delete(targetId);
    }, 350);

    if (!currentUser) {
      onRequireAuth?.();
    } else if (video) {
      triggerHaptic("light");
      onToggleCommentLike(video.id, commentId, replyId);
    }
  };

  // Resolve authentic avatar avoiding fake stock model photos
  const getAuthorAvatar = (
    authorName: string,
    authorHandle?: string,
    authorAvatar?: string,
    isOwner?: boolean
  ) => {
    if (isOwner) {
      if (authorAvatar && authorAvatar.trim() !== "" && !authorAvatar.startsWith("data:;") && !authorAvatar.includes("undefined")) {
        return authorAvatar;
      }
      if (placeLogoUrl && placeLogoUrl.trim() !== "" && !placeLogoUrl.startsWith("data:;") && !placeLogoUrl.includes("undefined")) {
        return placeLogoUrl;
      }
      if (video?.placeLogoUrl && video.placeLogoUrl.trim() !== "" && !video.placeLogoUrl.startsWith("data:;") && !video.placeLogoUrl.includes("undefined")) {
        return video.placeLogoUrl;
      }
      const rawName = placeName || video?.placeName || "";
      const cleanName = rawName.toLowerCase().trim();
      if (!cleanName || cleanName.includes("yoouz") || cleanName.includes("owner") || cleanName.includes("business")) {
        return "/favicon.svg";
      }
      return getPlaceLogoUrl({ name: rawName, website: video?.placeWebsite, category: video?.placeCategory }) || `/api/avatar?name=${encodeURIComponent(rawName)}&background=27272a&color=fff&bold=true`;
    }

    const isSelf =
      Boolean(currentUser) &&
      ((authorName && (authorName.toLowerCase() === "you" || (currentUser?.name && authorName.toLowerCase() === currentUser.name.toLowerCase()))) ||
        (currentUser?.email && authorHandle && currentUser.email.split("@")[0].toLowerCase() === authorHandle.toLowerCase()));

    const nameToUse = formatCommentAuthorName(authorName, isOwner);
    const candidate = isSelf ? (currentUser?.avatar || authorAvatar) : authorAvatar;
    return getSafeAvatarUrl(candidate, nameToUse, authorHandle);
  };

  // Determine if logged-in user is the creator of this video review
  const isUserCreator = useMemo(() => {
    if (!currentUser || !video) return false;
    const userEmail = currentUser.email?.toLowerCase().trim() || "";
    const userHandle = userEmail ? userEmail.split("@")[0] : "";
    const userName = currentUser.name?.toLowerCase().trim() || "";
    
    const vidAuthorHandle = video.author?.name?.toLowerCase().trim() || "";
    const vidAuthorName = video.author?.name?.toLowerCase().trim() || "";
    const vidUserId = video.userId?.toLowerCase().trim() || "";
    const vidUserEmail = video.userEmail?.toLowerCase().trim() || "";

    return (
      (userEmail && vidUserEmail && userEmail === vidUserEmail) ||
      (userEmail && vidUserId && userEmail === vidUserId) ||
      (userHandle && vidAuthorHandle && (userHandle === vidAuthorHandle || vidAuthorHandle === "me")) ||
      (userName && vidAuthorName && userName === vidAuthorName) ||
      (vidAuthorHandle === "me")
    );
  }, [currentUser, video]);

  // Auto-set postAsOwner mode if user is owner
  useEffect(() => {
    if (isUserOwner) {
      setPostAsOwner(true);
    }
  }, [isUserOwner, video?.id]);

  // Reset draft comment and reply state when switching between videos
  useEffect(() => {
    setCommentText("");
    setReplyingTo(null);
    setEditingOwnerResponse(false);
    setAttachedImages([]);
    setLightboxState(null);
  }, [video?.id]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // 1. Root Scroll & Touch Chaining Lock
  useEffect(() => {
    if (typeof document === "undefined" || !video) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [Boolean(video)]);

  // 2. Visual Viewport State (Calculated for precise docking across iOS & Android)
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 0);
  const [viewportTop, setViewportTop] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleViewport = () => {
      const vv = window.visualViewport;
      const currentHeight = vv ? vv.height : window.innerHeight;
      const currentTop = vv ? vv.offsetTop : 0;
      setViewportHeight(currentHeight);
      setViewportTop(currentTop);
      const isMobile = window.innerWidth < 768;
      const keyboardActive = isMobile && currentHeight < (window.screen?.height || window.innerHeight) * 0.82;
      setIsKeyboardOpen(keyboardActive);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewport);
      window.visualViewport.addEventListener("scroll", handleViewport);
    }
    window.addEventListener("resize", handleViewport);
    handleViewport();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewport);
        window.visualViewport.removeEventListener("scroll", handleViewport);
      }
      window.removeEventListener("resize", handleViewport);
    };
  }, []);

  const [remoteComments, setRemoteComments] = useState<ReviewComment[]>(() => {
    return Array.isArray(video?.comments) ? video.comments : [];
  });
  const [hasRemoteFetched, setHasRemoteFetched] = useState<boolean>(() => {
    return Array.isArray(video?.comments) && video.comments.length > 0;
  });
  const [localDeletedCommentIds, setLocalDeletedCommentIds] = useState<string[]>(() => {
    try {
      const delRaw = localStorage.getItem("copo_deleted_comments");
      return delRaw ? JSON.parse(delRaw) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDeleteCommentAction = (videoId: string, commentId: string, replyId?: string) => {
    const targetId = replyId || commentId;
    if (targetId) {
      setLocalDeletedCommentIds((prev) => {
        const next = [...prev, targetId];
        try {
          localStorage.setItem("copo_deleted_comments", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      setRemoteComments((prev) => {
        if (replyId) {
          return prev.map((c) =>
            c.id === commentId
              ? { ...c, replies: (c.replies || []).filter((r) => r.id !== replyId) }
              : c
          );
        }
        return prev.filter((c) => c.id !== commentId);
      });
    }
    if (onDeleteComment) {
      onDeleteComment(videoId, commentId, replyId);
    }
  };

  useEffect(() => {
    if (!video?.id) {
      setRemoteComments([]);
      setHasRemoteFetched(false);
      return;
    }
    // Instantly seed from video.comments if available
    if (Array.isArray(video.comments) && video.comments.length > 0) {
      setRemoteComments(video.comments);
      setHasRemoteFetched(true);
    }
    let isMounted = true;
    fetch(`/api/interactions/comments?videoId=${video.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && Array.isArray(data.comments)) {
          setRemoteComments(data.comments);
          setHasRemoteFetched(true);
        }
      })
      .catch(() => {});

    // Listen to real-time events for this video
    const handleNewCommentEvent = (e: any) => {
      const detail = e.detail;
      if (detail && String(detail.videoId) === String(video.id)) {
        if (Array.isArray(detail.comments)) {
          setRemoteComments(detail.comments);
          setHasRemoteFetched(true);
        } else if (detail.comment) {
          setRemoteComments((prev) => {
            const tree = buildCommentTree([...prev, detail.comment]);
            return tree.comments;
          });
        }
      }
    };

    const handleDeleteCommentEvent = (e: any) => {
      const detail = e.detail;
      if (detail && String(detail.videoId) === String(video.id)) {
        const delCommId = detail.commentId ? String(detail.commentId) : "";
        const delReplyId = detail.replyId ? String(detail.replyId) : "";
        if (delCommId || delReplyId) {
          setLocalDeletedCommentIds((prev) => {
            const next = [...prev];
            if (delCommId && !next.includes(delCommId)) next.push(delCommId);
            if (delReplyId && !next.includes(delReplyId)) next.push(delReplyId);
            try {
              localStorage.setItem("copo_deleted_comments", JSON.stringify(next));
            } catch (e) {}
            return next;
          });
        }
        if (Array.isArray(detail.comments)) {
          setRemoteComments(detail.comments);
          setHasRemoteFetched(true);
        }
      }
    };

    const handleLikeCommentEvent = (e: any) => {
      const detail = e.detail;
      if (detail && String(detail.videoId) === String(video.id)) {
        setRemoteComments((prev) => {
          return prev.map((c) => {
            if (c.id === detail.commentId) {
              if (detail.replyId && Array.isArray(c.replies)) {
                return {
                  ...c,
                  replies: c.replies.map((r) => r.id === detail.replyId ? {
                    ...r,
                    isLiked: detail.isLiked !== undefined ? Boolean(detail.isLiked) : !r.isLiked,
                    likesCount: typeof detail.likesCount === 'number' ? detail.likesCount : (detail.isLiked !== undefined ? (detail.isLiked ? (r.likesCount || 0) + 1 : Math.max(0, (r.likesCount || 0) - 1)) : (!r.isLiked ? (r.likesCount || 0) + 1 : Math.max(0, (r.likesCount || 0) - 1)))
                  } : r)
                };
              }
              return {
                ...c,
                isLiked: detail.isLiked !== undefined ? Boolean(detail.isLiked) : !c.isLiked,
                likesCount: typeof detail.likesCount === 'number' ? detail.likesCount : (detail.isLiked !== undefined ? (detail.isLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 0) - 1)) : (!c.isLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 0) - 1)))
              };
            }
            return c;
          });
        });
      }
    };

    const handleHeartCommentEvent = (e: any) => {
      const detail = e.detail;
      if (detail && String(detail.videoId) === String(video.id)) {
        setRemoteComments((prev) => {
          return prev.map((c) => {
            if (c.id === detail.commentId) {
              if (detail.replyId && Array.isArray(c.replies)) {
                return {
                  ...c,
                  replies: c.replies.map((r) => r.id === detail.replyId ? {
                    ...r,
                    likedByCreator: detail.likedByCreator !== undefined ? Boolean(detail.likedByCreator) : !r.likedByCreator
                  } : r)
                };
              }
              return {
                ...c,
                likedByCreator: detail.likedByCreator !== undefined ? Boolean(detail.likedByCreator) : !c.likedByCreator
              };
            }
            return c;
          });
        });
      }
    };

    window.addEventListener("copo-new-comment", handleNewCommentEvent);
    window.addEventListener("copo-delete-comment", handleDeleteCommentEvent);
    window.addEventListener("copo-like-comment", handleLikeCommentEvent);
    window.addEventListener("copo-heart-comment", handleHeartCommentEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("copo-new-comment", handleNewCommentEvent);
      window.removeEventListener("copo-delete-comment", handleDeleteCommentEvent);
      window.removeEventListener("copo-like-comment", handleLikeCommentEvent);
      window.removeEventListener("copo-heart-comment", handleHeartCommentEvent);
    };
  }, [video?.id]);

  // Combined comments from props and remote database with canonical tree hierarchy & strict deduplication
  const combinedComments = useMemo(() => {
    const propList = (Array.isArray(video?.comments) && video.comments.length > 0
      ? video.comments
      : []).filter((c: any) => c && c.id !== "comm-101" && c.id !== "comm-102");
    // If remote comments are empty, fallback to propList (video.comments)
    const baseList = remoteComments.length > 0 ? remoteComments : propList;

    const tree = buildCommentTree(baseList);
    
    let list = tree.comments;

    // Filter out synthetic dummy owner response items from top-level comment array
    if (video?.ownerResponse) {
      list = list.filter((c) => !c.id?.startsWith("owner_comm_"));
    }

    // Filter out any locally or remotely deleted comment IDs or legacy mock comments across the whole thread
    const deletedSet = new Set(localDeletedCommentIds);
    list = list
      .filter((c) => c && c.id && c.id !== "comm-101" && c.id !== "comm-102" && !deletedSet.has(String(c.id)))
      .map((c) => {
        if (Array.isArray(c.replies)) {
          return {
            ...c,
            replies: c.replies.filter((r) => r && r.id && r.id !== "comm-101" && r.id !== "comm-102" && !deletedSet.has(String(r.id)))
          };
        }
        return c;
      });

    // Deduplicate any comments with duplicate IDs or identical author + text signatures
    const uniqueComments: ReviewComment[] = [];
    const seenSignatures = new Set<string>();

    list.forEach((c) => {
      const idKey = c.id ? `id:${c.id}` : "";
      const sigKey = `sig:${(c.authorName || "").toLowerCase().trim()}:${(c.text || "").toLowerCase().trim()}`;

      if (idKey && seenSignatures.has(idKey)) return;
      if (seenSignatures.has(sigKey)) return;

      if (idKey) seenSignatures.add(idKey);
      seenSignatures.add(sigKey);
      uniqueComments.push(c);
    });

    return uniqueComments;
  }, [video?.comments, remoteComments, hasRemoteFetched, localDeletedCommentIds, video?.ownerResponse]);

  // Calculate total comments count from the community discussion thread
  const totalCommentsCount = useMemo(() => {
    if (!video) return 0;
    const tree = buildCommentTree(combinedComments);
    return tree.count;
  }, [combinedComments, video]);

  // Sort comments according to selected filter
  const sortedComments = useMemo(() => {
    if (!video) return [];
    const list = [...combinedComments];
    if (sortBy === "top") {
      return list.sort((a, b) => {
        // Pinned creator comments first, then by likes, then by newest
        if (a.isCreator && !b.isCreator) return -1;
        if (!a.isCreator && b.isCreator) return 1;
        if ((b.likesCount || 0) !== (a.likesCount || 0)) {
          return (b.likesCount || 0) - (a.likesCount || 0);
        }
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
    } else {
      // Newest first (highest createdAtMs / newest at the top)
      return list.sort((a, b) => {
        const timeA = a.createdAtMs || 0;
        const timeB = b.createdAtMs || 0;
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id || "").localeCompare(String(a.id || ""));
      });
    }
  }, [combinedComments, sortBy]);

  const handleToggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleStartReply = (comment: ReviewComment) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    setReplyingTo({
      commentId: comment.id,
      handle: comment.authorHandle || "reviewer",
      name: comment.authorName || "Reviewer"
    });
    setExpandedReplies((prev) => ({
      ...prev,
      [comment.id]: true
    }));
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Compress and process selected image files for fast proof attachments (max 5 images per comment)
  const processAndAttachImages = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 5 - attachedImages.length);
    if (remainingSlots <= 0) return;

    const toProcess = files.slice(0, remainingSlots);
    setIsUploadingAttachments(true);
    triggerHaptic("light");

    try {
      const base64List = await Promise.all(
        toProcess.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const rawData = e.target?.result as string;
              // Client-side downscale to max 1280px for lightning performance
              const img = new Image();
              img.onload = () => {
                const maxDim = 1280;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL("image/jpeg", 0.84));
                } else {
                  resolve(rawData);
                }
              };
              img.onerror = () => resolve(rawData);
              img.src = rawData;
            };
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          });
        })
      );

      const validBase64 = base64List.filter(Boolean);
      if (validBase64.length === 0) {
        setIsUploadingAttachments(false);
        return;
      }

      // Try uploading to persistent /api/comments/upload-attachment
      try {
        const res = await fetch("/api/comments/upload-attachment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validBase64 })
        });
        const data = await res.json();
        if (data && Array.isArray(data.urls) && data.urls.length > 0) {
          setAttachedImages((prev) => [...prev, ...data.urls].slice(0, 5));
        } else {
          // Graceful fallback to compressed base64
          setAttachedImages((prev) => [...prev, ...validBase64].slice(0, 5));
        }
      } catch (uploadErr) {
        // Fallback to compressed base64
        setAttachedImages((prev) => [...prev, ...validBase64].slice(0, 5));
      }
    } catch (err) {
      console.warn("Failed to process attached images:", err);
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  const handleRemoveAttachedImage = (indexToRemove: number) => {
    triggerHaptic("light");
    setAttachedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      processAndAttachImages(files);
    }
  };

  // Render attached photos grid inside a comment or reply card
  const renderAttachmentGrid = (attachments?: string[], authorTitle?: string, isReply = false) => {
    if (!Array.isArray(attachments) || attachments.length === 0) return null;

    const count = attachments.length;

    return (
      <div className={`mt-2 ${isReply ? "max-w-[280px]" : "max-w-xs sm:max-w-sm"} select-none`}>
        {count === 1 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setLightboxState({ images: attachments, activeIndex: 0, authorName: authorTitle });
            }}
            className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 cursor-pointer shadow-xs max-h-60 active:scale-[0.99] transition-transform"
          >
            <img
              src={attachments[0]}
              alt="Attachment"
              className="w-full h-auto max-h-60 object-cover hover:opacity-95 transition-opacity"
              loading="lazy"
            />
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-2.5 h-2.5" />
              <span>{t("common.view", "View")}</span>
            </div>
          </div>
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-1.5">
            {attachments.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxState({ images: attachments, activeIndex: idx, authorName: authorTitle });
                }}
                className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square cursor-pointer active:scale-[0.98] transition-transform"
              >
                <img
                  src={imgUrl}
                  alt={`Attachment ${idx + 1}`}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-3 gap-1.5">
            {attachments.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxState({ images: attachments, activeIndex: idx, authorName: authorTitle });
                }}
                className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square cursor-pointer active:scale-[0.98] transition-transform"
              >
                <img
                  src={imgUrl}
                  alt={`Attachment ${idx + 1}`}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {count >= 4 && (
          <div className="grid grid-cols-2 gap-1.5">
            {attachments.slice(0, 4).map((imgUrl, idx) => {
              const isExtra = idx === 3 && count > 4;
              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxState({ images: attachments, activeIndex: idx, authorName: authorTitle });
                  }}
                  className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <img
                    src={imgUrl}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                    loading="lazy"
                  />
                  {isExtra && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center text-white font-extrabold text-sm">
                      +{count - 3}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || isSubmittingComment) return;
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    const text = commentText.trim().slice(0, 300);
    const attachmentsToSave = [...attachedImages];
    if (!text && attachmentsToSave.length === 0) return;

    setIsSubmittingComment(true);

    if (editingOwnerResponse && !replyingTo && onAddOwnerResponse) {
      // Post or update official pinned business owner response card
      onAddOwnerResponse(video.id, text);
      setEditingOwnerResponse(false);
    } else {
      // Create optimistic local comment object for instant 0ms UI update
      const isTargetCreator = isUserCreator;
      const isOwnerPosting = isUserOwner && postAsOwner;

      const authorName = isOwnerPosting
        ? `${placeName || video.placeName || "Business"}`
        : (currentUser.name || (isTargetCreator ? "Video Reviewer" : (currentUser.email ? currentUser.email.split("@")[0] : "Verified Reviewer")));
      const authorHandle = isOwnerPosting
        ? "owner"
        : (currentUser.email ? currentUser.email.split("@")[0] : (isTargetCreator ? "reviewer" : "user"));
      const authorAvatar = isOwnerPosting
        ? (placeLogoUrl || video.placeLogoUrl || `/api/avatar?name=${encodeURIComponent(placeName || video.placeName || "Business")}&background=27272a&color=fff&bold=true`)
        : (currentUser.avatar || `/api/avatar?name=${encodeURIComponent(authorName)}&background=27272a&color=fff&bold=true&size=128`);

      const newOptComment: ReviewComment = {
        id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        authorName,
        authorHandle,
        authorAvatar,
        text,
        attachments: attachmentsToSave,
        createdAt: "Just now",
        createdAtMs: Date.now(),
        likesCount: 0,
        isLiked: false,
        isOwner: Boolean(isOwnerPosting),
        isCreator: Boolean(isTargetCreator),
        replies: []
      };
      if (replyingTo) newOptComment.replyToId = replyingTo.commentId;

      // Optimistically insert into remoteComments so it appears in the drawer INSTANTLY on Enter!
      setRemoteComments((prev) => {
        if (replyingTo) {
          return prev.map((c) => {
            if (c.id === replyingTo.commentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newOptComment]
              };
            }
            return c;
          });
        }
        return [newOptComment, ...prev];
      });

      // Post normal comment or reply (authoritatively persisted to BunnyDB & PostgreSQL in App.tsx)
      if (onAddComment) {
        onAddComment(video.id, text, {
          replyToId: replyingTo?.commentId,
          postAsOwner: isOwnerPosting,
          postAsCreator: isUserCreator,
          commentItem: newOptComment
        });
      } else {
        // Fallback direct persistent write if onAddComment handler is not supplied
        fetch("/api/interactions/comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: video.id,
            comment: newOptComment,
            userId: currentUser?.email || (currentUser as any)?.id || "user",
            userEmail: currentUser?.email || "",
            userName: currentUser?.name || newOptComment.authorName,
            userAvatar: currentUser?.avatar || newOptComment.authorAvatar
          })
        }).catch(() => {});
      }

      if (replyingTo) {
        setExpandedReplies((prev) => ({
          ...prev,
          [replyingTo.commentId]: true
        }));
        setReplyingTo(null);
      }
    }

    setCommentText("");
    setAttachedImages([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setTimeout(() => setIsSubmittingComment(false), 200);
  };

  const [sheetHeight, setSheetHeight] = useState<"normal" | "expanded">("normal");
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const isDraggingHeader = useRef<boolean>(false);

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isDraggingHeader.current = true;
    }
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingHeader.current || touchStartY.current === null || touchStartX.current === null) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    const diffY = e.touches[0].clientY - touchStartY.current;
    const diffX = Math.abs(e.touches[0].clientX - touchStartX.current);

    if (diffY > 0 && diffY > diffX) {
      setDragOffsetY(diffY);
    } else if (diffY < 0 && sheetHeight === "normal" && Math.abs(diffY) > diffX) {
      setDragOffsetY(Math.max(diffY * 0.35, -45));
    }
  };

  const handleHeaderTouchEnd = () => {
    if (!isDraggingHeader.current) return;
    isDraggingHeader.current = false;
    const diff = dragOffsetY;
    setDragOffsetY(0);

    if (diff > 80) {
      if (sheetHeight === "expanded") {
        setSheetHeight("normal");
        triggerHaptic("light");
      } else {
        triggerHaptic("medium");
        onClose();
      }
    } else if (diff < -30 && sheetHeight === "normal") {
      setSheetHeight("expanded");
      triggerHaptic("light");
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  // Listen for Escape key on desktop to close comments drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  const placeLogoUrl = placeLogoUrlProp || (video.placeLogoUrl 
    ? getCleanLogoUrl(video.placeLogoUrl, video.placeWebsite) 
    : getPlaceLogoUrl({ name: video.placeName, website: video.placeWebsite, category: video.placeCategory }));

  const content = (
    <div
      id="copo-comments-modal-root"
      className="fixed inset-0 z-[9999] pointer-events-auto md:pointer-events-none overscroll-none"
    >
      {/* Solid background mask on mobile to guarantee zero video bleed-through when drawer is open */}
      <div className="fixed inset-0 bg-black/80 md:hidden pointer-events-none -z-10" />

      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 md:bg-transparent pointer-events-auto md:hidden animate-in fade-in duration-200 touch-none"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }}
        onTouchEnd={(e) => e.stopPropagation()}
        onClick={() => {
          if (inputRef.current) inputRef.current.blur();
          onClose();
        }}
      />

      <div
        id="copo-comments-panel"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          ...(dragOffsetY !== 0 && !isKeyboardOpen ? { transform: `translateY(${dragOffsetY}px)` } : {}),
          ...(typeof window !== "undefined" && window.innerWidth < 768 ? {
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: '0px',
            top: 'auto',
            width: '100%',
            height: isKeyboardOpen ? `${viewportHeight}px` : (sheetHeight === "expanded" ? "88dvh" : "70dvh"),
            maxHeight: isKeyboardOpen ? `${viewportHeight}px` : (sheetHeight === "expanded" ? "88dvh" : "70dvh"),
            borderRadius: isKeyboardOpen ? '16px 16px 0 0' : '26px 26px 0 0',
          } : {})
        }}
        className={`w-full md:w-[440px] md:h-[100dvh] bg-zinc-950 md:bg-zinc-900 text-white rounded-t-[26px] md:rounded-none border-t border-zinc-800 md:border-l md:border-t-0 flex flex-col justify-between shadow-2xl ${isKeyboardOpen ? '' : 'transition-[height,transform,border-radius] duration-200 ease-out'} cursor-default overflow-hidden fixed bottom-0 left-0 right-0 md:top-0 md:right-0 md:left-auto md:bottom-auto md:animate-in md:slide-in-from-right md:duration-200 pointer-events-auto z-[10000]`}
      >
        {/* Extended bottom bleed shield: extends 400px below bottom:0 so video underneath is NEVER visible during OS rubberband or keyboard transitions */}
        <div className="absolute top-full left-0 right-0 h-96 bg-zinc-950 pointer-events-none" />
        {/* Mobile Pull Handle Indicator */}
        <div 
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          onClick={() => setSheetHeight((prev) => prev === "normal" ? "expanded" : "normal")}
          className="w-full pt-3 pb-1 flex items-center justify-center shrink-0 md:hidden cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="w-10 h-1 bg-zinc-600 hover:bg-zinc-400 rounded-full transition-colors" />
        </div>

        {/* Header (Single Clean Row - YouTube Shorts Style) */}
        <div 
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950 md:bg-zinc-900 shrink-0 select-none touch-none"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left: Comments Title & Count */}
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-white font-extrabold text-base md:text-lg tracking-tight flex items-center gap-2">
                <span>{t("comments.commentsTitle", "Comments")}</span>
                <span className="text-xs font-semibold text-zinc-400">
                  {totalCommentsCount}
                </span>
              </h2>
            </div>

            {/* Right: Sort Switcher & Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSortBy("top")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    sortBy === "top"
                      ? "bg-zinc-800 text-white font-bold shadow-2xs"
                      : "text-zinc-400 hover:text-white font-medium"
                  }`}
                >
                  {t("comments.top", "Top")}
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("newest")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-zinc-800 text-white font-bold shadow-2xs"
                      : "text-zinc-400 hover:text-white font-medium"
                  }`}
                >
                  {t("comments.newest", "Newest")}
                </button>
              </div>

              {/* Close Button (Desktop Only; mobile uses pull handle, swipe gesture, or tap backdrop) */}
              <button
                id="btn-close-comments"
                onClick={() => {
                  triggerHaptic("light");
                  onClose();
                }}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white hidden md:flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
                title="Close comments"
                aria-label="Close comments"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Comments Scrollable Feed */}
        <div
          ref={commentsListRef}
          className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4 overscroll-contain bg-zinc-950 md:bg-zinc-900 touch-pan-y"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* 1. Official Verified Business Owner Response (Pinned Banner - Google Maps Standard) */}
          {video.ownerResponse && (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2.5 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-250">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center shrink-0 p-0.5 ring-1 ring-white/10">
                    <CopoBrandLogo
                      domain={video.placeWebsite}
                      name={video.placeName}
                      website={video.placeWebsite}
                      logoUrl={video.placeLogoUrl}
                      bannerUrl={video.placeBannerUrl}
                      className="w-full h-full flex items-center justify-center overflow-hidden"
                      imageClassName="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast]"
                      fallbackTextClassName="text-[10px] font-black text-zinc-950"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-white text-xs truncate">
                        {t("comments.responseOwner", "Response from the owner")}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 text-[10px] font-bold tracking-tight">
                        <ShieldCheck className="w-2.5 h-2.5 text-white" />
                        {t("business.owner", "Business Owner")}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-200 font-medium truncate block">
                      {video.placeName}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-zinc-200 font-medium shrink-0">
                  {formatRecordedDate(video.ownerResponse.respondedAt, video.ownerResponse.respondedAtMs)}
                </span>
              </div>

              <div className="pl-3 py-1 border-l-2 border-zinc-500 text-zinc-200 text-[13px] leading-relaxed font-medium bg-zinc-850 rounded-r-xl p-2.5">
                "{video.ownerResponse.text}"
              </div>

              {/* Owner Action Buttons (Edit / Delete) */}
              {isUserOwner && (
                <div className="pt-1 flex items-center justify-end gap-3 text-xs">
                  <button
                    onClick={() => {
                      setCommentText(video.ownerResponse?.text || "");
                      setPostAsOwner(true);
                      setEditingOwnerResponse(true);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="flex items-center gap-1 text-zinc-200 hover:text-white font-bold hover:underline"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{t("comments.editResponse", "Edit response")}</span>
                  </button>
                  {onDeleteOwnerResponse && (
                    <button
                      onClick={() => onDeleteOwnerResponse(video.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t("common.remove", "Remove")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Empty State when no comments exist */}
          {sortedComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-300 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm">
                  {video.ownerResponse
                    ? t("comments.noUserCommentsYet", "No user comments yet")
                    : t("comments.noCommentsYet", "No comments yet")}
                </h3>
                <p className="text-zinc-300 text-xs max-w-xs leading-relaxed">
                  {video.ownerResponse
                    ? t("comments.beFirstWithResponse", "Be the first creator to share your thoughts or ask a question!")
                    : `${t("comments.beFirst", "Be the first to share your thoughts or ask a question about")} ${video.placeName}!`}
                </p>
              </div>

              {/* Starter Suggestions Chips */}
              <div className="pt-2 flex flex-wrap justify-center gap-1.5 max-w-xs">
                {STARTER_PROMPTS.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!currentUser) {
                        onRequireAuth?.();
                      } else {
                        setCommentText(prompt);
                        if (inputRef.current) inputRef.current.focus();
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-medium transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 3. Render Comments List */
            <div className="space-y-4">
              {sortedComments.map((comment) => {
                const isCommentAuthorCreator =
                  Boolean(comment.isCreator) ||
                  (comment.authorHandle &&
                    video.author?.name &&
                    comment.authorHandle.toLowerCase().trim() ===
                      video.author.name.toLowerCase().trim()) ||
                  (comment.authorHandle &&
                    video.userEmail &&
                    comment.authorHandle.toLowerCase().trim() ===
                      video.userEmail.split("@")[0].toLowerCase().trim()) ||
                  (comment.authorName &&
                    video.author?.name &&
                    comment.authorName.toLowerCase().trim() ===
                      video.author.name.toLowerCase().trim());

                const hasReplies = Array.isArray(comment.replies) && comment.replies.length > 0;
                const isExpanded = expandedReplies[comment.id];
                const isCurrentUserComment = Boolean(
                  currentUser &&
                  (
                    (currentUser.email && (comment.authorEmail === currentUser.email || comment.userEmail === currentUser.email || (comment.authorHandle && comment.authorHandle.toLowerCase().trim() === currentUser.email.split("@")[0].toLowerCase().trim()))) ||
                    ((currentUser.id || currentUser.uid) && (comment.userId === (currentUser.id || currentUser.uid) || comment.uid === (currentUser.id || currentUser.uid))) ||
                    (currentUser.name && (comment.authorName === currentUser.name || (comment.authorHandle && comment.authorHandle.toLowerCase().trim() === currentUser.name.toLowerCase().trim()))) ||
                    currentUser.isAdmin ||
                    currentUser.role === 'admin'
                  )
                );

                const commentUserMeta = resolveCommentUserMeta(comment, allUsers, currentUser);
                const displayName = commentUserMeta.name;
                const authorAvatarUrl = commentUserMeta.avatar;
                const authorHandleToUse = commentUserMeta.handle;

                return (
                  <div
                    key={comment.id}
                    className="group flex flex-col space-y-2 text-white text-sm animate-in fade-in duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {/* Commenter Avatar */}
                      <img
                        src={authorAvatarUrl}
                        alt={displayName}
                        className={`w-9 h-9 rounded-full object-cover border border-zinc-800 shadow-2xs shrink-0 ${(!comment.isOwner && onSelectAuthor && authorHandleToUse) ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (comment.isOwner) {
                            target.src = "/favicon.svg";
                          } else {
                            target.src = generateGoogleLetterAvatarSvg(
                              displayName,
                              128,
                              authorHandleToUse
                            );
                          }
                        }}
                        onClick={() => !comment.isOwner && onSelectAuthor && authorHandleToUse && onSelectAuthor(authorHandleToUse, displayName, authorAvatarUrl)}
                      />

                      {/* Comment Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-zinc-100 text-xs break-all sm:break-words leading-tight no-underline outline-none select-none [-webkit-tap-highlight-color:transparent] ${(!comment.isOwner && onSelectAuthor && authorHandleToUse) ? "cursor-pointer hover:text-white active:opacity-80 transition-colors" : ""}`} onClick={() => !comment.isOwner && onSelectAuthor && authorHandleToUse && onSelectAuthor(authorHandleToUse, displayName, authorAvatarUrl)}>
                            {displayName}
                          </span>

                          {/* Reviewer / Creator Badge */}
                          {isCommentAuthorCreator && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-bold">
                              <Camera className="w-2.5 h-2.5 text-white" />
                              {t("profile.reviewer", "Reviewer")}
                            </span>
                          )}

                          {/* Verified Business Owner Badge */}
                          {comment.isOwner && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 text-[10px] font-bold">
                              <ShieldCheck className="w-2.5 h-2.5 text-white" />
                              {t("business.owner", "Business Owner")}
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-200 font-medium ml-auto">
                            {formatRecordedDate(comment.createdAt, comment.createdAtMs)}
                          </span>
                        </div>

                        {/* Comment Text */}
                        {comment.text && (
                          <p className="text-zinc-200 mt-1 text-[13px] leading-relaxed whitespace-pre-wrap font-normal">
                            {comment.text}
                          </p>
                        )}

                        {/* Attached Photos / Proof */}
                        {renderAttachmentGrid(comment.attachments, displayName, false)}

                        {/* Badges & Actions Row (Likes, Reply, Creator Heart, Delete) */}
                        <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-zinc-200">
                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={() => handleCommentLikeClick(comment.id)}
                            className={`flex items-center gap-1 transition-colors hover:text-red-500 cursor-pointer ${
                              comment.isLiked ? "text-red-500 font-bold" : "text-zinc-200"
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                comment.isLiked ? "fill-red-500 text-red-500 scale-110" : ""
                              }`}
                            />
                            <span className="text-[11px] font-bold">{comment.likesCount || 0}</span>
                          </button>

                          {/* Reply Button */}
                          <button
                            type="button"
                            onClick={() => handleStartReply(comment)}
                            className="text-zinc-200 hover:text-white transition-colors text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>{t("comments.reply", "Reply")}</span>
                          </button>

                          {/* Delete option for comment author or business owner */}
                          {(isCurrentUserComment || isUserOwner || isUserCreator) &&
                            onDeleteComment && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCommentAction(video.id, comment.id)}
                                className="text-zinc-400 hover:text-red-400 transition-colors ml-auto opacity-90 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 cursor-pointer flex items-center gap-1"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* 4. Nested Replies Section (Threaded conversations) */}
                    {hasReplies && (
                      <div className="pl-12 space-y-3">
                        {/* Toggle Replies button */}
                        <button
                          onClick={() => handleToggleReplies(comment.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer py-1"
                        >
                          <div className="w-4 h-0.5 bg-zinc-500 rounded" />
                          <span>
                            {isExpanded
                              ? `${t("common.hide", "Hide")} ${comment.replies?.length} ${comment.replies?.length === 1 ? t("comments.reply", "reply") : t("comments.replies", "replies")}`
                              : `${t("common.view", "View")} ${comment.replies?.length} ${comment.replies?.length === 1 ? t("comments.reply", "reply") : t("comments.replies", "replies")}`}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Collapsible replies list */}
                        {isExpanded && (
                          <div className="space-y-3 border-l-2 border-zinc-800 pl-3 pt-1">
                            {comment.replies?.map((reply) => {
                              const isReplyAuthorCreator =
                                Boolean(reply.isCreator) ||
                                (reply.authorHandle &&
                                  video.author?.name &&
                                  reply.authorHandle.toLowerCase().trim() ===
                                    video.author.name.toLowerCase().trim()) ||
                                (reply.authorHandle &&
                                  video.userEmail &&
                                  reply.authorHandle.toLowerCase().trim() ===
                                    video.userEmail.split("@")[0].toLowerCase().trim()) ||
                                (reply.authorName &&
                                  video.author?.name &&
                                  reply.authorName.toLowerCase().trim() ===
                                    video.author.name.toLowerCase().trim());

                              const isCurrentReplyUser = Boolean(
                                currentUser &&
                                (
                                  (currentUser.email && (reply.authorEmail === currentUser.email || reply.userEmail === currentUser.email || (reply.authorHandle && reply.authorHandle.toLowerCase().trim() === currentUser.email.split("@")[0].toLowerCase().trim()))) ||
                                  ((currentUser.id || (currentUser as any).uid) && (reply.userId === (currentUser.id || (currentUser as any).uid) || reply.uid === (currentUser.id || (currentUser as any).uid))) ||
                                  (currentUser.name && (reply.authorName === currentUser.name || (reply.authorHandle && reply.authorHandle.toLowerCase().trim() === currentUser.name.toLowerCase().trim()))) ||
                                  (currentUser as any).isAdmin ||
                                  (currentUser as any).role === 'admin'
                                )
                              );

                              const replyUserMeta = resolveCommentUserMeta(reply, allUsers, currentUser);
                              const replyDisplayName = replyUserMeta.name;
                              const replyAvatarUrl = replyUserMeta.avatar;
                              const replyHandleToUse = replyUserMeta.handle;

                              return (
                                <div
                                  key={reply.id}
                                  className="group/reply flex items-start gap-2.5 text-xs animate-in fade-in duration-150"
                                >
                                  <img
                                    src={replyAvatarUrl}
                                    alt={replyDisplayName}
                                    className={`w-7 h-7 rounded-full object-cover border border-zinc-800 shrink-0 ${(!reply.isOwner && onSelectAuthor && replyHandleToUse) ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      if (reply.isOwner) {
                                        target.src = "/favicon.svg";
                                      } else {
                                        target.src = generateGoogleLetterAvatarSvg(
                                          replyDisplayName,
                                          128,
                                          replyHandleToUse
                                        );
                                      }
                                    }}
                                    onClick={() => !reply.isOwner && onSelectAuthor && replyHandleToUse && onSelectAuthor(replyHandleToUse, replyDisplayName, replyAvatarUrl)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`font-bold text-zinc-100 text-[11px] break-all sm:break-words leading-tight no-underline outline-none select-none [-webkit-tap-highlight-color:transparent] ${(!reply.isOwner && onSelectAuthor && replyHandleToUse) ? "cursor-pointer hover:text-white active:opacity-80 transition-colors" : ""}`} onClick={() => !reply.isOwner && onSelectAuthor && replyHandleToUse && onSelectAuthor(replyHandleToUse, replyDisplayName, replyAvatarUrl)}>
                                        {replyDisplayName}
                                      </span>

                                      {isReplyAuthorCreator && (
                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-[9px] font-bold">
                                          {t("profile.reviewer", "Reviewer")}
                                        </span>
                                      )}

                                      {reply.isOwner && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 text-[10px] font-bold">
                                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                                          {t("business.owner", "Business Owner")}
                                        </span>
                                      )}

                                      <span className="text-[10px] text-zinc-200 ml-auto">
                                        {formatRecordedDate(reply.createdAt, reply.createdAtMs)}
                                      </span>
                                    </div>

                                    {/* Reply text with optional replyTo tag */}
                                    {reply.text && (
                                      <p className="text-zinc-200 mt-0.5 text-xs leading-relaxed font-normal">
                                        {reply.text}
                                      </p>
                                    )}

                                    {/* Reply Attachments / Proof */}
                                    {renderAttachmentGrid(reply.attachments, replyDisplayName, true)}

                                    {/* Reply Actions (Like & Delete) */}
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold text-zinc-200">
                                      <button
                                        type="button"
                                        onClick={() => handleCommentLikeClick(comment.id, reply.id)}
                                        className={`flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer ${
                                          reply.isLiked ? "text-red-500 font-bold" : "text-zinc-200"
                                        }`}
                                      >
                                        <Heart
                                          className={`w-3 h-3 transition-transform active:scale-125 ${
                                            reply.isLiked ? "fill-red-500 text-red-500" : ""
                                          }`}
                                        />
                                        <span>{reply.likesCount || 0}</span>
                                      </button>

                                      <button
                                        onClick={() => handleStartReply(comment)}
                                        className="hover:text-white font-bold transition-colors cursor-pointer"
                                      >
                                        {t("comments.reply", "Reply")}
                                      </button>

                                      {(isCurrentReplyUser || isUserOwner || isUserCreator) &&
                                        onDeleteComment && (
                                          <button
                                            onClick={() =>
                                              handleDeleteCommentAction(video.id, comment.id, reply.id)
                                            }
                                            className="text-zinc-200 hover:text-red-500 transition-colors ml-auto opacity-0 group-hover/reply:opacity-100"
                                            title="Delete reply"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input & Action Bar Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 md:bg-zinc-900 p-3.5 space-y-2.5 shrink-0 shadow-lg" style={{ paddingBottom: isKeyboardOpen ? '0.75rem' : 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}>
          {!currentUser ? (
            <div
              onClick={() => onRequireAuth?.()}
              className="w-full bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 rounded-full px-3.5 py-2 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-300 min-w-0">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs md:text-sm font-medium text-zinc-400 truncate">
                  {t("comments.addCommentPlaceholder", "Add a comment...")}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequireAuth?.();
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 text-xs font-bold rounded-full transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <LogIn className="w-3 h-3 text-zinc-950 stroke-[2.25]" />
                <span>{t("nav.login", "Sign In")}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Replying context banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-zinc-200 animate-in slide-in-from-bottom-1 duration-150">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CornerDownRight className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                    <span className="font-medium text-zinc-200">{t("comments.replyingTo", "Replying to")}</span>
                    <span className="font-bold text-white truncate">{replyingTo.name}</span>
                  </div>
                  <button
                    onClick={handleCancelReply}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-200 hover:text-white hover:bg-zinc-800 cursor-pointer"
                    title={t("comments.cancelReply", "Cancel reply")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Verified Business Owner Identity Badge */}
              {isUserOwner && (
                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0 w-7 h-7 rounded-lg overflow-hidden bg-white shadow-xs border border-white/20 flex items-center justify-center p-0.5">
                      <CopoBrandLogo
                        domain={video?.placeWebsite}
                        name={placeName || video?.placeName}
                        website={video?.placeWebsite}
                        logoUrl={placeLogoUrlProp || video?.placeLogoUrl}
                        className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
                        imageClassName="w-full h-full object-contain"
                        fallbackTextClassName="text-[9px] font-black text-zinc-950"
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-white absolute -bottom-1 -right-1 bg-zinc-950 rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate flex items-center gap-1.5">
                        <span>{placeName || video.placeName}</span>
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold border border-zinc-700 tracking-wide">
                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                          {t("business.owner", "Business Owner")}
                        </span>
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {editingOwnerResponse
                          ? t("comments.editingPinnedResponseBanner", "Updating official pinned response card")
                          : t("comments.respondingAsOfficialBusiness", "Posting comments as business owner")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachment Preview Tray (Photos selected before posting) */}
              {(attachedImages.length > 0 || isUploadingAttachments) && (
                <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-2 bg-zinc-900 border border-zinc-800 rounded-2xl animate-in slide-in-from-bottom-2 duration-150 scrollbar-none">
                  {attachedImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 shadow-xs">
                      <img src={imgUrl} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachedImage(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {isUploadingAttachments && (
                    <div className="w-14 h-14 rounded-xl border border-dashed border-zinc-750 flex flex-col items-center justify-center bg-zinc-950/70 shrink-0 text-zinc-300 gap-1 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="text-[9px] font-bold">Uploading...</span>
                    </div>
                  )}

                  {attachedImages.length < 5 && !isUploadingAttachments && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-14 h-14 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 flex flex-col items-center justify-center bg-zinc-950/40 hover:bg-zinc-850 shrink-0 text-zinc-400 hover:text-white transition-all cursor-pointer group"
                      title="Add more photos (up to 5)"
                    >
                      <Plus className="w-4 h-4 group-hover:scale-110 transition-transform text-zinc-300" />
                      <span className="text-[9px] font-semibold text-zinc-400">{attachedImages.length}/5</span>
                    </button>
                  )}
                </div>
              )}

              {/* Input Action Bar (Standalone Clean Div with Auto-Expanding Multiline Textarea) */}
              <div className="flex items-end gap-2">
                {/* Author Avatar */}
                <div className="pb-1 shrink-0">
                  {(isUserOwner || postAsOwner) ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-xs border border-white/20 flex items-center justify-center p-0.5">
                      <CopoBrandLogo
                        domain={video?.placeWebsite}
                        name={placeName || video?.placeName}
                        website={video?.placeWebsite}
                        logoUrl={placeLogoUrlProp || video?.placeLogoUrl}
                        className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
                        imageClassName="w-full h-full object-contain"
                        fallbackTextClassName="text-[10px] font-black text-zinc-950"
                      />
                    </div>
                  ) : (
                    <img
                      src={getAuthorAvatar(
                        currentUser?.name || "You",
                        currentUser?.email?.split("@")[0],
                        currentUser?.avatar,
                        false
                      )}
                      alt={currentUser?.name || "You"}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = generateGoogleLetterAvatarSvg(currentUser?.name || "You");
                      }}
                    />
                  )}
                </div>

                <div className="relative flex-1 min-w-0">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    name="comment_text"
                    id="comment_text"
                    inputMode="text"
                    enterKeyHint="send"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="sentences"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    value={commentText}
                    onPaste={handlePaste}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 300);
                      setCommentText(val);
                      const el = e.target;
                      if (el) {
                        if (!val.trim() || (!val.includes("\n") && val.length < 34)) {
                          if (el.style.height !== "38px") el.style.height = "38px";
                        } else {
                          el.style.height = "auto";
                          el.style.height = `${Math.min(Math.max(el.scrollHeight, 38), 120)}px`;
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if ((commentText.trim() || attachedImages.length > 0) && commentText.length <= 300) {
                          handleSubmit(e);
                        }
                      }
                    }}
                    onFocus={() => {
                      if (typeof window !== "undefined" && window.visualViewport) {
                        const vv = window.visualViewport;
                        const currentHeight = vv ? vv.height : window.innerHeight;
                        const isMobile = window.innerWidth < 768;
                        if (isMobile && currentHeight < (window.screen?.height || window.innerHeight) * 0.88) {
                          setIsKeyboardOpen(true);
                          setViewportHeight(currentHeight);
                        }
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") {
                          setIsKeyboardOpen(false);
                        }
                      }, 120);
                    }}
                    maxLength={300}
                    placeholder={
                      replyingTo
                        ? `${t("comments.replyTo", "Reply to")} ${replyingTo.name}...`
                        : editingOwnerResponse
                        ? t("comments.editingPinnedResponsePlaceholder", "Updating official pinned response...")
                        : postAsOwner
                        ? t("comments.addOwnerCommentPlaceholder", "Add comment as business owner...")
                        : isUserCreator
                        ? t("comments.addReviewerCommentPlaceholder", "Add comment as the video reviewer...")
                        : t("comments.addCommentPlaceholder", "Add a comment...")
                    }
                    className={`w-full bg-zinc-900 text-white placeholder-zinc-500 text-[16px] md:text-sm px-3.5 py-2 rounded-2xl border transition-all resize-none leading-relaxed overflow-y-auto block ${
                      postAsOwner
                        ? "border-zinc-700 focus:border-white focus:bg-zinc-900 focus:ring-2 focus:ring-white/10"
                        : "border-zinc-800 focus:border-white/50 focus:bg-zinc-900 focus:ring-2 focus:ring-white/10"
                    } focus:outline-none`}
                    style={{ minHeight: "38px", maxHeight: "120px" }}
                  />

                  {/* Subtle Character Counter */}
                  {commentText.length >= 220 && (
                    <span
                      id="comment-char-counter"
                      className={`absolute right-2.5 bottom-1.5 text-[10px] font-mono tracking-tight pointer-events-none px-1 rounded bg-zinc-950/80 backdrop-blur-xs transition-all ${
                        commentText.length >= 300
                          ? "text-red-400 font-bold"
                          : commentText.length >= 260
                          ? "text-amber-400 font-semibold"
                          : "text-zinc-400"
                      }`}
                    >
                      {commentText.length}/300
                    </span>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      processAndAttachImages(e.target.files);
                    }
                    e.target.value = "";
                  }}
                />

                {/* Attach File/Image Button (Proof) */}
                <div className="shrink-0 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (attachedImages.length >= 5) return;
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploadingAttachments || attachedImages.length >= 5}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer relative ${
                      attachedImages.length > 0
                        ? "bg-zinc-800 text-amber-400 border border-amber-400/50 shadow-xs"
                        : "bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    title={
                      attachedImages.length >= 5
                        ? "Maximum 5 photos attached"
                        : "Attach photos as proof (max 5)"
                    }
                  >
                    <Paperclip className="w-4 h-4" />
                    {attachedImages.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center shadow-xs">
                        {attachedImages.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Send Button */}
                <div className="shrink-0 pb-1">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    id="btn-send-comment"
                    disabled={(!commentText.trim() && attachedImages.length === 0) || isUploadingAttachments || commentText.length > 300}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 shadow-xs cursor-pointer ${
                      postAsOwner
                        ? "bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-40"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-40"
                    }`}
                    title={t("comments.sendComment", "Send comment")}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox / High-Res Image Preview Modal */}
      {lightboxState && (
        <div
          className="fixed inset-0 z-[11000] bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
          onClick={() => setLightboxState(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10 w-full max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-850/80 border border-zinc-750">
                {lightboxState.activeIndex + 1} / {lightboxState.images.length}
              </span>
              {lightboxState.authorName && (
                <span className="text-zinc-300 text-xs font-medium truncate max-w-[200px]">
                  {lightboxState.authorName}
                </span>
              )}
            </div>
            <button
              onClick={() => setLightboxState(null)}
              className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Image */}
          <div
            className="flex-1 flex items-center justify-center p-2 relative max-w-5xl mx-auto w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxState.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxState((prev) =>
                    prev
                      ? {
                          ...prev,
                          activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length
                        }
                      : null
                  )
                }
                className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
                title="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={lightboxState.images[lightboxState.activeIndex]}
              alt="Attached proof preview"
              className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
            />

            {lightboxState.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxState((prev) =>
                    prev
                      ? {
                          ...prev,
                          activeIndex: (prev.activeIndex + 1) % prev.images.length
                        }
                      : null
                  )
                }
                className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
                title="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {lightboxState.images.length > 1 && (
            <div
              className="flex items-center justify-center gap-2 py-2 max-w-4xl mx-auto z-10 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxState.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxState((prev) => (prev ? { ...prev, activeIndex: idx } : null))}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === lightboxState.activeIndex
                      ? "border-white scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return null;
};
