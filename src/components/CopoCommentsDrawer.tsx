import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Sparkles,
  ArrowUpDown,
  Trash2,
  Edit2,
  Store,
  Camera,
  AlertCircle,
  User,
  LogIn
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
  currentUser?: UserProfile | null;
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

export const CopoCommentsDrawer: React.FC<CopoCommentsDrawerProps> = ({
  video,
  currentUser,
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

  const inputRef = useRef<HTMLInputElement>(null);
  const likingPendingRef = useRef<Set<string>>(new Set());

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

  const [remoteComments, setRemoteComments] = useState<ReviewComment[]>([]);
  const [hasRemoteFetched, setHasRemoteFetched] = useState(false);
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
    const propList = Array.isArray(video?.comments) ? video.comments : [];
    // If remote comments have been loaded, they are the authoritative source from the database.
    // Prop list may contain stale, cached deleted comments from a previous device session.
    const baseList = hasRemoteFetched
      ? remoteComments
      : (remoteComments.length > 0 ? remoteComments : propList);

    const tree = buildCommentTree(baseList);
    
    let list = tree.comments;

    // Filter out synthetic dummy owner response items from top-level comment array
    if (video?.ownerResponse) {
      list = list.filter((c) => !c.id?.startsWith("owner_comm_"));
    }

    // Filter out any locally or remotely deleted comment IDs across the whole thread
    const deletedSet = new Set(localDeletedCommentIds);
    list = list
      .filter((c) => c && c.id && !deletedSet.has(String(c.id)))
      .map((c) => {
        if (Array.isArray(c.replies)) {
          return {
            ...c,
            replies: c.replies.filter((r) => r && r.id && !deletedSet.has(String(r.id)))
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
        // Pinned creator comments first, then by likes
        if (a.isCreator && !b.isCreator) return -1;
        if (!a.isCreator && b.isCreator) return 1;
        return (b.likesCount || 0) - (a.likesCount || 0);
      });
    } else {
      // Newest first
      return list;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || isSubmittingComment) return;
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    const text = commentText.trim().slice(0, 300);
    if (!text) return;

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

      // Post normal comment or reply (saved to BunnyDB)
      if (onAddComment) {
        onAddComment(video.id, text, {
          replyToId: replyingTo?.commentId,
          postAsOwner: isOwnerPosting,
          postAsCreator: isUserCreator,
          commentItem: newOptComment
        });
      }

      // Direct persistent write to Bunny Cloud Database API to guarantee zero data loss
      fetch("/api/interactions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          comment: newOptComment,
          userId: currentUser?.email || (currentUser as any)?.id || "user"
        })
      }).catch(() => {});

      if (replyingTo) {
        setExpandedReplies((prev) => ({
          ...prev,
          [replyingTo.commentId]: true
        }));
        setReplyingTo(null);
      }
    }

    setCommentText("");
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

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic("light");
          onClose();
        }
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end bg-black/25 md:bg-black/60 pointer-events-auto cursor-pointer overscroll-contain animate-in fade-in duration-200"
    >
      <div
        id="copo-comments-panel"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={dragOffsetY !== 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' } : undefined}
        className={`w-full md:w-[460px] ${
          sheetHeight === "expanded" ? "h-[88dvh]" : "h-[65dvh]"
        } md:h-[100dvh] bg-zinc-950 md:bg-zinc-900 text-white rounded-t-[26px] md:rounded-none border-t border-zinc-800 md:border-l md:border-t-0 flex flex-col justify-between shadow-2xl transition-all duration-200 ease-out cursor-default overscroll-contain relative`}
      >
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
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain bg-zinc-950 md:bg-zinc-900"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* 1. Official Verified Business Owner Response (Pinned Banner - Google Maps Standard) */}
          {video.ownerResponse && (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2.5 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-250">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-900 shadow-xs border border-zinc-800 flex items-center justify-center shrink-0 p-0.5 ring-1 ring-white/10">
                    <CopoBrandLogo
                      domain={video.placeWebsite}
                      name={video.placeName}
                      website={video.placeWebsite}
                      logoUrl={video.placeLogoUrl}
                      bannerUrl={video.placeBannerUrl}
                      className="w-full h-full flex items-center justify-center overflow-hidden"
                      imageClassName="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast] [filter:drop-shadow(0px_0px_1px_rgba(255,255,255,0.25))]"
                      fallbackTextClassName="text-[10px] font-black text-white"
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
                const isCurrentUserComment =
                  currentUser?.email &&
                  comment.authorHandle &&
                  comment.authorHandle.toLowerCase().trim() ===
                    currentUser.email.split("@")[0].toLowerCase().trim();

                const displayName = formatCommentAuthorName(comment.authorName, comment.isOwner);

                return (
                  <div
                    key={comment.id}
                    className="group flex flex-col space-y-2 text-white text-sm animate-in fade-in duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {/* Commenter Avatar */}
                      <img
                        src={getAuthorAvatar(
                          comment.authorName,
                          comment.authorHandle,
                          comment.authorAvatar,
                          comment.isOwner
                        )}
                        alt={displayName}
                        className={`w-9 h-9 rounded-full object-cover border border-zinc-800 shadow-2xs shrink-0 ${(!comment.isOwner && onSelectAuthor && comment.authorHandle) ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (comment.isOwner) {
                            target.src = "/favicon.svg";
                          } else {
                            target.src = `/api/avatar?name=${encodeURIComponent(comment.authorName || "User")}&background=27272a&color=fff&bold=true`;
                          }
                        }}
                        onClick={() => !comment.isOwner && onSelectAuthor && comment.authorHandle && onSelectAuthor(comment.authorHandle, comment.authorName, comment.authorAvatar)}
                      />

                      {/* Comment Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-zinc-100 text-xs break-all sm:break-words leading-tight ${(!comment.isOwner && onSelectAuthor && comment.authorHandle) ? "cursor-pointer hover:underline" : ""}`} onClick={() => !comment.isOwner && onSelectAuthor && comment.authorHandle && onSelectAuthor(comment.authorHandle, comment.authorName, comment.authorAvatar)}>
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
                        <p className="text-zinc-200 mt-1 text-[13px] leading-relaxed whitespace-pre-wrap font-normal">
                          {comment.text}
                        </p>

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

                          {/* Creator Hearted Indicator / Bestow Creator Heart */}
                          {comment.likedByCreator ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isUserCreator && onToggleCreatorHeart && video) {
                                  onToggleCreatorHeart(video.id, comment.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/70 text-red-400 text-[10px] font-bold border border-red-900/60 shadow-xs ${
                                isUserCreator ? "cursor-pointer hover:bg-red-900/80" : ""
                              }`}
                              title={isUserCreator ? "Click to remove Creator Heart" : "Liked by creator"}
                            >
                              <Heart className="w-2.5 h-2.5 fill-red-400 text-red-400" />
                              <span>{t("comments.likedByCreator", "Liked by creator")}</span>
                            </button>
                          ) : (
                            isUserCreator &&
                            onToggleCreatorHeart && (
                              <button
                                type="button"
                                onClick={() => video && onToggleCreatorHeart(video.id, comment.id)}
                                className="text-amber-400 hover:text-amber-300 transition-colors text-[11px] flex items-center gap-1 font-semibold cursor-pointer"
                                title="Give Creator Heart"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>{t("comments.creatorHeart", "Creator Heart")}</span>
                              </button>
                            )
                          )}

                          {/* Delete option for comment author or business owner */}
                          {(isCurrentUserComment || isUserOwner || isUserCreator) &&
                            onDeleteComment && (
                              <button
                                onClick={() => handleDeleteCommentAction(video.id, comment.id)}
                                className="text-zinc-200 hover:text-red-500 transition-colors ml-auto opacity-0 group-hover:opacity-100 p-1"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
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

                              const isCurrentReplyUser =
                                currentUser?.email &&
                                reply.authorHandle &&
                                reply.authorHandle.toLowerCase().trim() ===
                                  currentUser.email.split("@")[0].toLowerCase().trim();

                              const replyDisplayName = formatCommentAuthorName(reply.authorName, reply.isOwner);

                              return (
                                <div
                                  key={reply.id}
                                  className="group/reply flex items-start gap-2.5 text-xs animate-in fade-in duration-150"
                                >
                                  <img
                                    src={getAuthorAvatar(
                                      reply.authorName,
                                      reply.authorHandle,
                                      reply.authorAvatar,
                                      reply.isOwner
                                    )}
                                    alt={replyDisplayName}
                                    className={`w-7 h-7 rounded-full object-cover border border-zinc-800 shrink-0 ${(!reply.isOwner && onSelectAuthor && reply.authorHandle) ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      if (reply.isOwner) {
                                        target.src = "/favicon.svg";
                                      } else {
                                        target.src = `/api/avatar?name=${encodeURIComponent(reply.authorName || "User")}&background=27272a&color=fff&bold=true`;
                                      }
                                    }}
                                    onClick={() => !reply.isOwner && onSelectAuthor && reply.authorHandle && onSelectAuthor(reply.authorHandle, reply.authorName, reply.authorAvatar)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`font-bold text-zinc-100 text-[11px] break-all sm:break-words leading-tight ${(!reply.isOwner && onSelectAuthor && reply.authorHandle) ? "cursor-pointer hover:underline" : ""}`} onClick={() => !reply.isOwner && onSelectAuthor && reply.authorHandle && onSelectAuthor(reply.authorHandle, reply.authorName, reply.authorAvatar)}>
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
                                    <p className="text-zinc-200 mt-0.5 text-xs leading-relaxed font-normal">
                                      {reply.text}
                                    </p>

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
        <div className="border-t border-zinc-800 bg-zinc-950 md:bg-zinc-900 p-3.5 space-y-2.5 shrink-0 shadow-lg" style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}>
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
                    <div className="relative shrink-0">
                      <img
                        src={placeLogoUrl || video?.placeLogoUrl || "/favicon.svg"}
                        alt={placeName || video.placeName}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-700 bg-black"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/favicon.svg'; }}
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-white absolute -bottom-1 -right-1 bg-black rounded-full" />
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

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                {/* Author Avatar (Uses Business Logo when posting as owner) */}
                <img
                  src={
                    (isUserOwner || postAsOwner)
                      ? (placeLogoUrl || video?.placeLogoUrl || "/favicon.svg")
                      : getAuthorAvatar(
                          currentUser?.name || "You",
                          currentUser?.email?.split("@")[0],
                          currentUser?.avatar,
                          false
                        )
                  }
                  alt={(isUserOwner || postAsOwner) ? (placeName || video.placeName) : (currentUser?.name || "You")}
                  className={`w-8 h-8 rounded-full object-cover shrink-0 ${
                    (isUserOwner || postAsOwner) ? "border border-zinc-700 bg-black shadow-md" : "border border-zinc-800"
                  }`}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (isUserOwner || postAsOwner) {
                      target.src = '/favicon.svg';
                    } else if (!target.src.includes('/api/avatar')) {
                      target.src = '/api/avatar?name=User&background=27272a&color=fff';
                    }
                  }}
                /> 
                 <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, 300))}
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
                    className={`w-full bg-zinc-900 text-white placeholder-zinc-500 text-xs sm:text-sm px-4 py-2.5 rounded-full border transition-all ${
                      postAsOwner
                        ? "border-zinc-700 focus:border-white focus:bg-zinc-900 focus:ring-2 focus:ring-white/10"
                        : "border-zinc-800 focus:border-white/50 focus:bg-zinc-900 focus:ring-2 focus:ring-white/10"
                    } focus:outline-none`}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    id="comment-char-counter"
                    className={`text-[11px] font-mono tracking-tight select-none transition-colors ${
                      commentText.length >= 300
                        ? "text-red-400 font-bold"
                        : commentText.length >= 260
                        ? "text-amber-400 font-medium"
                        : "text-zinc-200"
                    }`}
                  >
                    {commentText.length}/300
                  </span>

                  <button
                    type="submit"
                    id="btn-send-comment"
                    disabled={!commentText.trim() || commentText.length > 300}
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
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
