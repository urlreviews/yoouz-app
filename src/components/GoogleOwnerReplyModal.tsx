import React, { useState, useEffect } from "react";
import { X, ShieldCheck, CornerDownLeft, Trash2, Send, Loader2, Star, Check } from "lucide-react";
import { VideoReview } from "../types";
import { formatBusinessName, resolveSafeAuthor, getSafeAvatarUrl } from "../utils/placeUtils";

interface GoogleOwnerReplyModalProps {
  isOpen: boolean;
  video: VideoReview | null;
  placeName: string;
  placeLogoUrl?: string | null;
  existingReply?: string;
  onSaveReply: (videoId: string, replyText: string) => Promise<void> | void;
  onDeleteReply?: (videoId: string) => Promise<void> | void;
  onClose: () => void;
}

export const GoogleOwnerReplyModal: React.FC<GoogleOwnerReplyModalProps> = ({
  isOpen,
  video,
  placeName,
  placeLogoUrl,
  existingReply = "",
  onSaveReply,
  onDeleteReply,
  onClose,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (video) {
      setReplyText(existingReply || video.ownerResponse?.text || "");
      setShowDeleteConfirm(false);
    }
  }, [video, existingReply]);

  if (!isOpen || !video) return null;

  const safeAuthor = resolveSafeAuthor(video.author);
  const hasExisting = Boolean(existingReply || video.ownerResponse?.text);

  const quickTemplates = [
    "Thank you for the review and visit! 🙏",
    "We appreciate your kind feedback and support! ✨",
    "Thank you for recommending us! ⭐️",
    "Looking forward to serving you again soon! 🌟",
  ];

  const handleApplyTemplate = (template: string) => {
    setReplyText((prev) => {
      if (!prev.trim()) return template;
      return `${prev.trim()} ${template}`;
    });
  };

  const handleSubmit = async () => {
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSaveReply(video.id, replyText.trim());
      onClose();
    } catch (e) {
      console.error("Failed to save owner reply:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteReply || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteReply(video.id);
      setReplyText("");
      setShowDeleteConfirm(false);
      onClose();
    } catch (e) {
      console.error("Failed to delete owner reply:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="google-owner-reply-backdrop"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="google-owner-reply-modal"
        className="w-full sm:max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[92vh] animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Business Profile Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between gap-3 bg-zinc-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                {placeLogoUrl ? (
                  <img
                    src={placeLogoUrl}
                    alt={placeName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {placeName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow">
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Response from the owner
                </span>
              </div>
              <h3 className="text-sm font-bold text-white truncate">
                {formatBusinessName(placeName)}
              </h3>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-google-reply"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          {/* Review snapshot preview */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={getSafeAvatarUrl(safeAuthor.avatar, safeAuthor.name, safeAuthor.handle)}
                  alt={safeAuthor.name}
                  className="w-6 h-6 rounded-full object-cover border border-zinc-700 shrink-0"
                />
                <span className="font-semibold text-xs text-zinc-200 truncate">
                  {safeAuthor.name}
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < (video.rating || 5) ? "fill-amber-400" : "text-zinc-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            {video.caption && (
              <p className="text-xs text-zinc-300 line-clamp-2 italic">
                "{video.caption}"
              </p>
            )}
          </div>

          {/* Response Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label htmlFor="owner-reply-input" className="font-medium">
                Public response
              </label>
              <span className={replyText.length > 480 ? "text-amber-400 font-medium" : "text-zinc-500"}>
                {replyText.length} / 500
              </span>
            </div>
            <textarea
              id="owner-reply-input"
              rows={4}
              maxLength={500}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Write a public response as ${formatBusinessName(placeName)}...`}
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-white focus:outline-none rounded-xl p-3 text-xs text-white placeholder-zinc-500 leading-relaxed resize-none transition-colors"
            />
          </div>

          {/* Quick response template pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-400">
              Quick response starters
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(template)}
                  className="px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-750 border border-zinc-700/60 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Existing reply banner (if already replied) */}
          {hasExisting && !showDeleteConfirm && (
            <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Check className="w-3.5 h-3.5 text-zinc-300" />
                <span>You previously published a public reply to this review.</span>
              </div>
              {onDeleteReply && (
                <button
                  type="button"
                  id="btn-confirm-delete-reply"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}

          {/* Delete confirmation state */}
          {showDeleteConfirm && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 space-y-2 text-xs">
              <p className="text-red-200 font-medium">
                Are you sure you want to remove your public response from this video review?
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            id="btn-cancel-google-reply"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-submit-google-reply"
            onClick={handleSubmit}
            disabled={!replyText.trim() || isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{hasExisting ? "Update Reply" : "Publish Reply"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
