import React, { useEffect, useState } from "react";
import { MessageSquare, Bell, Heart, UserPlus, Bookmark, Repeat2, Mail, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface InAppToastPayload {
  id: string;
  type: "message" | "notification";
  actionType?: "like" | "comment" | "follow" | "bookmark" | "repost" | "message";
  title: string;
  subtitle: string;
  avatar?: string;
  threadId?: string;
  onAction?: () => void;
}

interface InAppNotificationToastProps {
  toast: InAppToastPayload | null;
  onClose: () => void;
  onNavigateToThread?: (threadId: string) => void;
  onNavigateToNotifications?: () => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  toast,
  onClose,
  onNavigateToThread,
  onNavigateToNotifications,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const startTime = Date.now();
    const duration = 6500; // 6.5 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onClose();
      }
    }, 50);

    return () => clearInterval(timer);
  }, [toast?.id, onClose]);

  if (!toast) return null;

  const handleClick = () => {
    if (toast.onAction) {
      toast.onAction();
    } else if (toast.type === "message" && toast.threadId && onNavigateToThread) {
      onNavigateToThread(toast.threadId);
    } else if (onNavigateToNotifications) {
      onNavigateToNotifications();
    }
    onClose();
  };

  // Determine badge styling based on actionType
  const actionType = toast.actionType || (toast.type === "message" ? "message" : undefined);
  let badgeBg = "bg-white text-zinc-950";
  let progressBg = "bg-white";
  let ActionIcon = Bell;

  if (actionType === "message") {
    badgeBg = "bg-emerald-400 text-zinc-950";
    progressBg = "bg-emerald-400";
    ActionIcon = Mail;
  } else if (actionType === "like") {
    badgeBg = "bg-white text-zinc-950";
    progressBg = "bg-white";
    ActionIcon = Heart;
  } else if (actionType === "comment") {
    badgeBg = "bg-sky-400 text-zinc-950";
    progressBg = "bg-sky-400";
    ActionIcon = MessageSquare;
  } else if (actionType === "follow") {
    badgeBg = "bg-violet-400 text-zinc-950";
    progressBg = "bg-violet-400";
    ActionIcon = UserPlus;
  } else if (actionType === "bookmark") {
    badgeBg = "bg-amber-400 text-zinc-950";
    progressBg = "bg-amber-400";
    ActionIcon = Bookmark;
  } else if (actionType === "repost") {
    badgeBg = "bg-blue-400 text-zinc-950";
    progressBg = "bg-blue-400";
    ActionIcon = Repeat2;
  }

  return (
    <AnimatePresence>
      <div className="fixed top-4 left-0 right-0 z-[400] flex justify-center px-3 pointer-events-none select-none">
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.94 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pointer-events-auto w-full max-w-[390px] rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-zinc-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.85)] p-3 text-white overflow-hidden relative cursor-pointer group active:scale-[0.98] transition-transform"
          onClick={handleClick}
        >
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${progressBg}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Avatar or Icon */}
            <div className="relative shrink-0">
              {(() => {
                const isYoouz =
                  (toast.title || "").toLowerCase().includes("yoouz") ||
                  (toast.avatar || "").includes("yoouz");

                if (isYoouz) {
                  return (
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700 shadow-sm ring-2 ring-zinc-700/80 shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  );
                }

                if (toast.avatar) {
                  return (
                    <img
                      src={toast.avatar}
                      alt={toast.title}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-700/80"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes("/api/avatar")) {
                          target.src = `/api/avatar?name=${encodeURIComponent(toast.title || "User")}&background=27272a&color=fff`;
                        }
                      }}
                    />
                  );
                }

                return (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 text-white`}>
                    <ActionIcon className="w-5 h-5" />
                  </div>
                );
              })()}

              {/* Type Badge on avatar */}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-black ${badgeBg} ring-2 ring-zinc-950`}
              >
                <ActionIcon className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-bold text-white tracking-tight truncate">
                  {toast.title}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                  Just now
                </span>
              </div>
              <p className="text-[12px] text-zinc-300 font-normal line-clamp-1 mt-0.5 [overflow-wrap:anywhere]">
                {toast.subtitle}
              </p>
            </div>

            {/* Action / Close */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white text-[11px] font-bold border border-zinc-600 transition-all flex items-center gap-0.5"
              >
                <span>{toast.type === "message" ? "Reply" : "View"}</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-7 h-7 rounded-full hover:bg-zinc-800 active:scale-90 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
