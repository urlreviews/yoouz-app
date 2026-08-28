import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
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
  AlertCircle
} from "lucide-react";
import { VideoReview, ReviewComment, UserProfile } from "../types";
import { formatRecordedDate } from "../utils/dateUtils";
import { getPlaceLogoUrl, getCleanLogoUrl } from "../utils/logoUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
import { triggerHaptic } from "../utils/haptics";
import { useSwipeDownToDismiss } from "../hooks/useSwipeDownToDismiss";

interface CopoCommentsDrawerProps {
  video: VideoReview | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onRequireAuth?: () => void;
  onAddComment: (
    videoId: string,
    text: string,
    options?: {
      replyToId?: string;
      
      postAsOwner?: boolean;
      postAsCreator?: boolean;
    }
  ) => void;
  onToggleCommentLike: (videoId: string, commentId: string, replyId?: string) => void;
  onToggleCreatorHeart?: (videoId: string, commentId: string, replyId?: string) => void;
  onDeleteComment?: (videoId: string, commentId: string, replyId?: string) => void;
  onAddOwnerResponse?: (videoId: string, text: string) => void;
  onDeleteOwnerResponse?: (videoId: string) => void;
  isUserOwner?: boolean;
  placeName?: string;
  onSelectAuthor?: (authorHandle: string, authorName?: string, authorAvatar?: string) => void;
}

const QUICK_EMOJIS = ["❤️", "🔥", "👏", "👍", "🤤", "⭐️", "📍", "🙌"];
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
  onAddComment,
  onToggleCommentLike,
  onToggleCreatorHeart,
  onDeleteComment,
  onAddOwnerResponse,
  onDeleteOwnerResponse,
  isUserOwner = false,
  placeName,
  onSelectAuthor,
}) => {
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

  // Resolve authentic avatar avoiding fake stock model photos
  const getAuthorAvatar = (
    authorName: string,
    authorHandle?: string,
    authorAvatar?: string,
    isOwner?: boolean
  ) => {
    const isSelf =
      Boolean(currentUser) &&
      ((authorName && (authorName.toLowerCase() === "you" || (currentUser?.name && authorName.toLowerCase() === currentUser.name.toLowerCase()))) ||
        (currentUser?.email && authorHandle && currentUser.email.split("@")[0].toLowerCase() === authorHandle.toLowerCase()));

    if (isSelf && currentUser?.avatar && !currentUser.avatar.includes("photo-1534528741775") && !currentUser.avatar.includes("photo-1535713875002")) {
      return currentUser.avatar;
    }

    if (
      authorAvatar &&
      !authorAvatar.includes("unsplash.com") &&
      !authorAvatar.includes("photo-1534528741775") &&
      !authorAvatar.includes("photo-1535713875002")
    ) {
      return authorAvatar;
    }

    const nameToUse = formatCommentAuthorName(authorName, isOwner);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToUse)}&background=1a73e8&color=fff&bold=true&size=128`;
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

  // Auto-set postAsOwner mode if user is owner and no owner response exists
  useEffect(() => {
    if (isUserOwner && !video?.ownerResponse) {
      setPostAsOwner(true);
    } else {
      setPostAsOwner(false);
    }
  }, [isUserOwner, video?.id, video?.ownerResponse]);

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

  // Calculate total comments count including nested replies and owner response
  const totalCommentsCount = useMemo(() => {
    if (!video) return 0;
    let count = video.ownerResponse ? 1 : 0;
    if (Array.isArray(video.comments)) {
      video.comments.forEach((c) => {
        count += 1;
        if (Array.isArray(c.replies)) {
          count += c.replies.length;
        }
      });
    }
    return Math.max(count, video.commentsCount || 0);
  }, [video?.comments, video?.ownerResponse, video?.commentsCount]);

  // Sort comments according to selected filter
  const sortedComments = useMemo(() => {
    if (!video || !Array.isArray(video.comments)) return [];
    const list = [...video.comments];
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
  }, [video?.comments, sortBy]);

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

  const handleInsertEmoji = (emoji: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    setCommentText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    const text = commentText.trim();
    if (!text) return;

    if (postAsOwner && !replyingTo && onAddOwnerResponse) {
      // Post as official pinned business owner response
      onAddOwnerResponse(video.id, text);
      setEditingOwnerResponse(false);
    } else {
      // Post normal comment or reply
      onAddComment(video.id, text, {
        replyToId: replyingTo?.commentId,
        //: replyingTo?.name,
        postAsOwner: isUserOwner && postAsOwner,
        postAsCreator: isUserCreator
      });
      if (replyingTo) {
        setExpandedReplies((prev) => ({
          ...prev,
          [replyingTo.commentId]: true
        }));
        setReplyingTo(null);
      }
    }
    setCommentText("");
  };

  const { dragOffsetY, swipeProps } = useSwipeDownToDismiss({
    onDismiss: onClose,
    threshold: 60
  });

  if (!video) return null;

  const placeLogoUrl = video.placeLogoUrl 
    ? getCleanLogoUrl(video.placeLogoUrl, video.placeWebsite) 
    : getPlaceLogoUrl({ name: video.placeName, website: video.placeWebsite, category: video.placeCategory });

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
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end bg-black/60 backdrop-blur-sm cursor-pointer overscroll-contain animate-in fade-in duration-200"
    >
      <div
        id="copo-comments-panel"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' } : undefined}
        className="w-full md:w-[460px] h-[100dvh] md:h-[100dvh] bg-zinc-950 md:bg-white text-white md:text-zinc-900 rounded-none md:rounded-none border-t md:border-l border-zinc-800 md:border-zinc-200 md:border-t-0 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200 cursor-default overscroll-contain relative transition-transform"
      >
        {/* Mobile Pull Handle Indicator (Interactive Touch Area) */}
        <div 
          {...swipeProps} 
          className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center z-30 md:hidden cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-12 h-1.5 bg-zinc-700 md:bg-zinc-200 rounded-full" />
        </div>

        {/* Header */}
        <div 
          {...swipeProps}
          className="px-5 pt-7 pb-4 md:pt-4 border-b border-zinc-800 md:border-zinc-200 bg-zinc-950 md:bg-white shrink-0 rounded-t-none md:rounded-none touch-pan-y"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-950/60 md:bg-blue-50 border border-blue-800/60 md:border-blue-100/50 text-blue-400 md:text-blue-600 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white md:text-zinc-950 font-bold text-base leading-tight">Comments</h2>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 md:bg-zinc-100 text-zinc-300 md:text-zinc-600 text-[10px] font-bold">
                    {totalCommentsCount}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-400 md:text-zinc-500 font-medium mt-0.5 break-words line-clamp-2">
                  {video.placeName}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-zinc-850 md:bg-zinc-100/80 flex items-center justify-center text-zinc-400 md:text-zinc-500 hover:text-white md:hover:text-zinc-900 hover:bg-zinc-800 md:hover:bg-zinc-200 transition-colors shrink-0"
              title="Close comments"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-header controls (Sort) */}
          <div className="flex justify-end">
            <div className="flex items-center bg-zinc-900 md:bg-zinc-100/80 p-0.5 rounded-lg border border-zinc-800 md:border-zinc-200/50">
              <button
                onClick={() => setSortBy("top")}
                className={`px-3 py-1 rounded-md text-xs transition-all ${
                  sortBy === "top"
                    ? "bg-zinc-800 md:bg-white text-white md:text-zinc-900 shadow-sm font-bold"
                    : "text-zinc-400 md:text-zinc-500 hover:text-white md:hover:text-zinc-800 font-medium"
                }`}
              >
                Top
              </button>
              <button
                onClick={() => setSortBy("newest")}
                className={`px-3 py-1 rounded-md text-xs transition-all ${
                  sortBy === "newest"
                    ? "bg-zinc-800 md:bg-white text-white md:text-zinc-900 shadow-sm font-bold"
                    : "text-zinc-400 md:text-zinc-500 hover:text-white md:hover:text-zinc-800 font-medium"
                }`}
              >
                Newest
              </button>
            </div>
          </div>
        </div>

        {/* Comments Scrollable Feed */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain bg-zinc-950 md:bg-white"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* 1. Official Verified Business Owner Response (Pinned Banner - Google Maps Standard) */}
          {video.ownerResponse && (
            <div className="p-4 bg-gradient-to-br from-blue-950/40 md:from-blue-50/90 via-sky-950/30 md:via-sky-50/50 to-indigo-950/20 md:to-indigo-50/40 border border-blue-800/60 md:border-blue-200/80 rounded-2xl space-y-2.5 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-250">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-900 md:bg-white border border-blue-800 md:border-blue-200 flex items-center justify-center shrink-0">
                    <CopoBrandLogo
                      domain={video.placeWebsite}
                      name={video.placeName}
                      website={video.placeWebsite}
                      logoUrl={video.placeLogoUrl}
                      bannerUrl={video.placeBannerUrl}
                      className="w-full h-full"
                      imageClassName="w-full h-full object-cover"
                      fallbackTextClassName="text-xs font-black text-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-white md:text-zinc-950 text-xs truncate">
                        Response from the owner
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold tracking-tight">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Verified Business
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 md:text-zinc-500 font-medium truncate block">
                      {video.placeName}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                  {formatRecordedDate(video.ownerResponse.respondedAt, video.ownerResponse.respondedAtMs)}
                </span>
              </div>

              <div className="pl-3 py-1 border-l-2 border-blue-500 text-zinc-200 md:text-zinc-800 text-[13px] leading-relaxed font-medium bg-zinc-900/80 md:bg-white/70 rounded-r-xl p-2.5">
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
                    className="flex items-center gap-1 text-blue-400 md:text-[#1a73e8] hover:text-blue-300 md:hover:text-blue-700 font-bold hover:underline"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit response</span>
                  </button>
                  {onDeleteOwnerResponse && (
                    <button
                      onClick={() => onDeleteOwnerResponse(video.id)}
                      className="flex items-center gap-1 text-red-400 md:text-red-500 hover:text-red-300 md:hover:text-red-700 font-semibold hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Empty State when no comments exist */}
          {sortedComments.length === 0 && !video.ownerResponse ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-zinc-900 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] flex items-center justify-center shadow-xs">
                <MessageSquare className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white md:text-zinc-900 font-bold text-sm">No comments yet</h3>
                <p className="text-zinc-400 md:text-zinc-500 text-xs max-w-xs leading-relaxed">
                  Be the first to share your thoughts or ask a question about {video.placeName}!
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
                    className="px-3 py-1.5 rounded-full bg-zinc-900 md:bg-zinc-100 hover:bg-zinc-800 md:hover:bg-blue-50 text-zinc-300 md:text-zinc-700 hover:text-white md:hover:text-[#1a73e8] border border-zinc-800 md:border-zinc-200 text-xs font-medium transition-all cursor-pointer"
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
                    className="group flex flex-col space-y-2 text-white md:text-zinc-900 text-sm animate-in fade-in duration-200"
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
                        className={`w-9 h-9 rounded-full object-cover border border-zinc-800 md:border-zinc-200 shadow-2xs shrink-0 ${(!comment.isOwner && onSelectAuthor && comment.authorHandle) ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`} onClick={() => !comment.isOwner && onSelectAuthor && comment.authorHandle && onSelectAuthor(comment.authorHandle, comment.authorName, comment.authorAvatar)}
                      />

                      {/* Comment Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-white md:text-zinc-950 text-xs truncate ${(!comment.isOwner && onSelectAuthor && comment.authorHandle) ? "cursor-pointer hover:underline" : ""}`} onClick={() => !comment.isOwner && onSelectAuthor && comment.authorHandle && onSelectAuthor(comment.authorHandle, comment.authorName, comment.authorAvatar)}>
                            {displayName}
                          </span>

                          {/* Reviewer / Creator Badge */}
                          {isCommentAuthorCreator && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-blue-950/60 md:bg-blue-50 text-blue-400 md:text-blue-700 border border-blue-800/60 md:border-blue-200 text-[10px] font-bold">
                              <Camera className="w-2.5 h-2.5 text-blue-400 md:text-blue-600" />
                              Reviewer
                            </span>
                          )}

                          {/* Verified Business Owner Badge */}
                          {comment.isOwner && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-950/60 md:bg-amber-50 text-amber-300 md:text-amber-800 border border-amber-800/60 md:border-amber-200 text-[10px] font-bold">
                              <ShieldCheck className="w-2.5 h-2.5 text-amber-400 md:text-amber-600" />
                              Business Owner
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-500 md:text-zinc-400 font-medium ml-auto">
                            {formatRecordedDate(comment.createdAt, comment.createdAtMs)}
                          </span>
                        </div>

                        {/* Comment Text */}
                        <p className="text-zinc-300 md:text-zinc-800 mt-1 text-[13px] leading-relaxed whitespace-pre-wrap font-normal">
                          {comment.text}
                        </p>

                        {/* Badges & Actions Row (Likes, Reply, Creator Heart, Delete) */}
                        <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-zinc-400 md:text-zinc-500">
                          {/* Like Button */}
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                onRequireAuth?.();
                              } else {
                                onToggleCommentLike(video.id, comment.id);
                              }
                            }}
                            className={`flex items-center gap-1 transition-colors hover:text-red-500 cursor-pointer ${
                              comment.isLiked ? "text-red-500 font-bold" : "text-zinc-400 md:text-zinc-500"
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                comment.isLiked ? "fill-red-500 text-red-500 scale-110" : ""
                              }`}
                            />
                            <span className="text-[11px]">{comment.likesCount || 0}</span>
                          </button>

                          {/* Reply Button */}
                          <button
                            onClick={() => handleStartReply(comment)}
                            className="text-zinc-400 md:text-zinc-500 hover:text-blue-400 md:hover:text-[#1a73e8] transition-colors text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>Reply</span>
                          </button>

                          {/* Creator Hearted Indicator / Bestow Creator Heart */}
                          {comment.likedByCreator ? (
                            <div
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-950/60 md:bg-red-50 text-red-400 md:text-red-600 text-[10px] font-bold border border-red-900/60 md:border-red-100"
                              title="Hearted by the video creator"
                            >
                              <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                              <span>Liked by creator</span>
                            </div>
                          ) : (
                            isUserCreator &&
                            onToggleCreatorHeart && (
                              <button
                                onClick={() => onToggleCreatorHeart(video.id, comment.id)}
                                className="text-zinc-500 md:text-zinc-400 hover:text-red-500 transition-colors text-[11px] flex items-center gap-0.5"
                                title="Give Creator Heart"
                              >
                                <Heart className="w-3 h-3" />
                                <span>Heart</span>
                              </button>
                            )
                          )}

                          {/* Delete option for comment author or business owner */}
                          {(isCurrentUserComment || isUserOwner || isUserCreator) &&
                            onDeleteComment && (
                              <button
                                onClick={() => onDeleteComment(video.id, comment.id)}
                                className="text-zinc-500 md:text-zinc-400 hover:text-red-500 transition-colors ml-auto opacity-0 group-hover:opacity-100 p-1"
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
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-400 md:text-[#1a73e8] hover:text-blue-300 md:hover:text-blue-700 transition-colors cursor-pointer py-1"
                        >
                          <div className="w-4 h-0.5 bg-blue-400 md:bg-blue-300 rounded" />
                          <span>
                            {isExpanded
                              ? `Hide ${comment.replies?.length} ${comment.replies?.length === 1 ? "reply" : "replies"}`
                              : `View ${comment.replies?.length} ${comment.replies?.length === 1 ? "reply" : "replies"}`}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Collapsible replies list */}
                        {isExpanded && (
                          <div className="space-y-3 border-l-2 border-zinc-800 md:border-zinc-100 pl-3 pt-1">
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
                                    className={`w-7 h-7 rounded-full object-cover border border-zinc-800 md:border-zinc-200 shrink-0 ${(!reply.isOwner && onSelectAuthor && reply.authorHandle) ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`} onClick={() => !reply.isOwner && onSelectAuthor && reply.authorHandle && onSelectAuthor(reply.authorHandle, reply.authorName, reply.authorAvatar)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`font-bold text-white md:text-zinc-950 text-[11px] truncate ${(!reply.isOwner && onSelectAuthor && reply.authorHandle) ? "cursor-pointer hover:underline" : ""}`} onClick={() => !reply.isOwner && onSelectAuthor && reply.authorHandle && onSelectAuthor(reply.authorHandle, reply.authorName, reply.authorAvatar)}>
                                        {replyDisplayName}
                                      </span>

                                      {isReplyAuthorCreator && (
                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-blue-950/60 md:bg-blue-50 text-blue-400 md:text-blue-700 border border-blue-800/60 md:border-blue-200 text-[9px] font-bold">
                                          Reviewer
                                        </span>
                                      )}

                                      {reply.isOwner && (
                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-amber-950/60 md:bg-amber-50 text-amber-300 md:text-amber-800 border border-amber-800/60 md:border-amber-200 text-[9px] font-bold">
                                          Owner
                                        </span>
                                      )}

                                      <span className="text-[10px] text-zinc-500 md:text-zinc-400 ml-auto">
                                        {formatRecordedDate(reply.createdAt, reply.createdAtMs)}
                                      </span>
                                    </div>

                                    {/* Reply text with optional replyTo tag */}
                                    <p className="text-zinc-300 md:text-zinc-800 mt-0.5 text-xs leading-relaxed font-normal">
                                      {reply.text}
                                    </p>

                                    {/* Reply Actions (Like & Delete) */}
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold text-zinc-400 md:text-zinc-500">
                                      <button
                                        onClick={() => {
                                          if (!currentUser) {
                                            onRequireAuth?.();
                                          } else {
                                            onToggleCommentLike(video.id, comment.id, reply.id);
                                          }
                                        }}
                                        className={`flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer ${
                                          reply.isLiked ? "text-red-500 font-bold" : "text-zinc-400 md:text-zinc-500"
                                        }`}
                                      >
                                        <Heart
                                          className={`w-3 h-3 ${
                                            reply.isLiked ? "fill-red-500 text-red-500" : ""
                                          }`}
                                        />
                                        <span>{reply.likesCount || 0}</span>
                                      </button>

                                      <button
                                        onClick={() => handleStartReply(comment)}
                                        className="hover:text-blue-400 md:hover:text-[#1a73e8] font-bold transition-colors cursor-pointer"
                                      >
                                        Reply
                                      </button>

                                      {(isCurrentReplyUser || isUserOwner || isUserCreator) &&
                                        onDeleteComment && (
                                          <button
                                            onClick={() =>
                                              onDeleteComment(video.id, comment.id, reply.id)
                                            }
                                            className="text-zinc-500 md:text-zinc-400 hover:text-red-500 transition-colors ml-auto opacity-0 group-hover/reply:opacity-100"
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
        <div className="border-t border-zinc-800 md:border-zinc-200 bg-zinc-950 md:bg-white p-3.5 space-y-2.5 shrink-0 shadow-lg" style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}>
          {!currentUser ? (
            <div className="bg-zinc-900 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-zinc-950 md:bg-white border border-zinc-800 md:border-zinc-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.22 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.5-.38-2.27s.13-1.55.38-2.27H6.58H1.19C.43 8.1 0 9.98 0 12s.43 3.9 1.19 5.42l4.09-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white md:text-zinc-900 truncate">Sign in to join the conversation</p>
                  <p className="text-[11px] text-zinc-400 md:text-zinc-500 truncate">Leave comments, like reviews, and reply to reviewers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRequireAuth?.()}
                className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] active:scale-95 text-white text-xs font-bold rounded-full transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>Sign in</span>
              </button>
            </div>
          ) : (
            <>
              {/* Replying context banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-blue-950/60 md:bg-blue-50/80 border border-blue-800/60 md:border-blue-200 rounded-xl text-xs text-blue-200 md:text-blue-900 animate-in slide-in-from-bottom-1 duration-150">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-400 md:text-[#1a73e8] shrink-0" />
                    <span className="font-medium text-zinc-400 md:text-zinc-600">Replying to</span>
                    <span className="font-bold text-blue-400 md:text-[#1a73e8] truncate">{replyingTo.name}</span>
                  </div>
                  <button
                    onClick={handleCancelReply}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white md:hover:text-zinc-700 hover:bg-zinc-800 md:hover:bg-blue-100 cursor-pointer"
                    title="Cancel reply"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Emoji Bar */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInsertEmoji(emoji)}
                    className="w-8 h-8 rounded-full hover:bg-zinc-850 md:hover:bg-zinc-100 flex items-center justify-center text-base transition-transform hover:scale-125 shrink-0 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Verified Business Owner Toggle (When user has claimed the business) */}
              {isUserOwner && (
                <div className="flex items-center justify-between bg-amber-950/40 md:bg-amber-50/70 border border-amber-800/60 md:border-amber-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-amber-400 md:text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-amber-200 md:text-amber-950 truncate">
                        Verified Business Owner
                      </p>
                      <p className="text-[10px] text-amber-300/80 md:text-amber-700 truncate">
                        {placeName || video.placeName}
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={postAsOwner}
                      onChange={(e) => setPostAsOwner(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 border-amber-700 md:border-amber-300 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] font-extrabold text-amber-300 md:text-amber-800">Reply as Owner</span>
                  </label>
                </div>
              )}

              {/* Posting as Reviewer Badge if logged in user is creator */}
              {isUserCreator && !isUserOwner && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/60 md:bg-blue-50 border border-blue-800/60 md:border-blue-100 rounded-lg text-[11px] text-blue-300 md:text-blue-800 font-semibold">
                  <Camera className="w-3.5 h-3.5 text-blue-400 md:text-[#1a73e8]" />
                  <span>You are posting as the verified video reviewer</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                {/* User Avatar */}
                <img
                  src={getAuthorAvatar(
                    currentUser?.name || "You",
                    currentUser?.email?.split("@")[0],
                    currentUser?.avatar,
                    postAsOwner
                  )}
                  alt={currentUser?.name || "You"}
                  className="w-8 h-8 rounded-full object-cover border border-zinc-800 md:border-zinc-200 shrink-0"
                />

                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={500}
                    placeholder={
                      replyingTo
                        ? `Reply to ${replyingTo.name}...`
                        : postAsOwner
                        ? "Add official response from business owner..."
                        : isUserCreator
                        ? "Add comment as the video reviewer..."
                        : "Add a friendly comment..."
                    }
                    className={`w-full bg-zinc-900 md:bg-zinc-50 text-white md:text-zinc-900 placeholder-zinc-500 md:placeholder-zinc-400 text-xs sm:text-sm px-4 py-2.5 rounded-full border transition-all ${
                      postAsOwner
                        ? "border-amber-700 md:border-amber-400 focus:border-amber-500 md:focus:border-amber-600 focus:bg-zinc-850 md:focus:bg-white focus:ring-2 focus:ring-amber-900/30 md:focus:ring-amber-100"
                        : "border-zinc-800 md:border-zinc-200 focus:border-blue-500 md:focus:border-[#1a73e8] focus:bg-zinc-850 md:focus:bg-white focus:ring-2 focus:ring-blue-900/30 md:focus:ring-blue-50"
                    } focus:outline-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className={`w-9 h-9 rounded-full text-white flex items-center justify-center transition-all shrink-0 shadow-xs cursor-pointer ${
                    postAsOwner
                      ? "bg-amber-600 hover:bg-amber-700 disabled:opacity-40"
                      : "bg-[#1a73e8] hover:bg-blue-700 disabled:opacity-40"
                  }`}
                  title="Send comment"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
