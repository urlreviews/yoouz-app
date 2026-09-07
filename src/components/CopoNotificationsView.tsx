import React, { useState, useMemo } from "react";
import { formatRecordedDate } from "../utils/dateUtils";
import { extractCleanDomain } from "../utils/placeUtils";
import {
  Bell,
  BellOff,
  Heart,
  MessageSquare,
  UserPlus,
  Repeat2,
  Mail,
  X,
  Play,
  Film,
  Sparkles,
  Star,
  ChevronLeft,
  Bookmark,
  Settings
} from "lucide-react";
import { CopoNotification, UserProfile, VideoReview } from "../types";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";
import { useLanguage } from "../i18n/LanguageContext";

interface CopoNotificationsViewProps {
  notifications: CopoNotification[];
  currentUser?: UserProfile | null;
  allVideos?: VideoReview[];
  onOpenAuth?: () => void;
  onOpenHelp?: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
  onSelectNotificationVideo: (videoId?: string) => void;
  onNavigateToMessages?: () => void;
  onNavigateHome?: () => void;
  onUpdateNotifications?: (updated: CopoNotification[]) => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAll?: () => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
  onOpenSettings?: () => void;
}

type FilterType = "all" | "unread" | "likes" | "comments" | "people" | "bookmarks";

export const CopoNotificationsView: React.FC<CopoNotificationsViewProps> = ({
  notifications,
  currentUser,
  allVideos = [],
  onOpenAuth,
  onOpenHelp,
  onOpenLegal,
  onSelectNotificationVideo,
  onNavigateToMessages,
  onNavigateHome,
  onUpdateNotifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAll,
  onSuccessAuth,
  onOpenSettings
}) => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-900 text-white md:text-white flex flex-col justify-between pb-32 md:pb-6" >
        <CopoAuthPrompt
          intent="notifications"
          onOpenHelp={onOpenHelp}
          onOpenLegal={onOpenLegal}
          onSuccess={onSuccessAuth}
          isFullPage={true}
        />
      </div>
    );
  }

  // Helper to mark a single notification as read
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onMarkRead) onMarkRead(id);
    if (onUpdateNotifications) {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      onUpdateNotifications(updated);
    }
  };

  // Helper to mark all as read
  const handleMarkAllRead = () => {
    if (onMarkAllRead) onMarkAllRead();
    if (onUpdateNotifications) {
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      onUpdateNotifications(updated);
    }
  };

  // Helper to dismiss a notification
  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteNotification) onDeleteNotification(id);
    if (onUpdateNotifications) {
      const updated = notifications.filter((n) => n.id !== id);
      onUpdateNotifications(updated);
    }
  };

  // Helper to clear all notifications
  const handleClearAll = () => {
    if (onClearAll) onClearAll();
    if (onUpdateNotifications) {
      onUpdateNotifications([]);
    }
  };

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === "unread") return !n.isRead;
      if (activeFilter === "likes") return n.type === "like";
      if (activeFilter === "comments") return n.type === "comment";
      if (activeFilter === "people") return n.type === "follow";
      if (activeFilter === "bookmarks") return n.type === "bookmark";
      return true;
    });
  }, [notifications, activeFilter]);

  // Compute unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Render Category Filter Pills
  const filterPills: { label: string; value: FilterType; count?: number }[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread", count: unreadCount > 0 ? unreadCount : undefined },
    { label: "Likes", value: "likes" },
    { label: "Comments", value: "comments" },
    { label: "Followers", value: "people" },
    { label: "Saves", value: "bookmarks" }
  ];

  // Helper to parse notification text into clean, scannable parts
  const parseNotificationDetails = (rawText: string, notif: CopoNotification) => {
    let raw = (rawText || "").trim();

    // 1. Remove ugly tags like (Website...), (Website)..., (Website), locat..., or trailing dangling ellipsis
    raw = raw.replace(/\(\s*website[^)]*\)/gi, "");
    raw = raw.replace(/\blocat\b\.*/gi, "");

    // Case A: Recommendation message: "Check out my recommendation: domain.com ... "
    const recMatch = raw.match(/sent you a message:\s*"?Check out (?:my|this) recommendation:?\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[^!⭐★\n]+?)(?:!|⭐|★|\/|\d|\"|$)/i);
    if (recMatch) {
      const rawTarget = recMatch[1].trim().replace(/[!"]/g, "");
      const cleanTarget = extractCleanDomain(rawTarget) || rawTarget || "a website";
      // extract rating if present
      const starMatch = raw.match(/(?:⭐|★|\b)(\d(?:\.\d)?)(?:\/5|\s*stars?)?/i);
      const rating = starMatch ? starMatch[1] : null;
      return {
        type: "recommendation" as const,
        action: "recommended",
        target: cleanTarget,
        rating: rating ? parseFloat(rating).toFixed(1) : undefined
      };
    }

    // Case B: Video review share message: "Check out my/this video review for domain.com ... "
    const vidMatch = raw.match(/sent you a message:\s*"?Check out (?:my|this) video review for\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[^!⭐★\n]+?)(?:!|⭐|★|\/|\d|\"|$)/i);
    if (vidMatch) {
      const rawTarget = vidMatch[1].trim().replace(/[!"]/g, "");
      const cleanTarget = extractCleanDomain(rawTarget) || rawTarget || "a place";
      const starMatch = raw.match(/(?:⭐|★|\b)(\d(?:\.\d)?)(?:\/5|\s*stars?)?/i);
      const rating = starMatch ? starMatch[1] : null;
      return {
        type: "video_share" as const,
        action: "shared a review for",
        target: cleanTarget,
        rating: rating ? parseFloat(rating).toFixed(1) : undefined
      };
    }

    // Case C: Standard direct message
    const msgMatch = raw.match(/^sent you a message:\s*"?(.*?)"?$/i);
    if (msgMatch) {
      let msgBody = msgMatch[1].trim();
      msgBody = msgBody.replace(/\.{2,}$/, "").trim();
      if (msgBody.length > 50) {
        msgBody = msgBody.slice(0, 48).trim() + "...";
      }
      return {
        type: "direct_message" as const,
        action: "messaged:",
        messageBody: msgBody ? `"${msgBody}"` : "sent a message"
      };
    }

    // Case D: Likes / Shares / Comments / Saves on a review of a place/domain
    const ofMatch = raw.match(/^(liked your video review of|shared your video review of|saved your video review of|saved your review of|bookmarked your review of|commented:\s*".*?"\s*on your review of)\s*(.+)$/i);
    if (ofMatch) {
      const actionPart = ofMatch[1];
      const placePart = ofMatch[2].trim();
      const cleanPlace = extractCleanDomain(placePart) || placePart;
      return {
        type: "review_activity" as const,
        action: actionPart,
        target: cleanPlace
      };
    }

    // Default fallback
    return {
      type: "generic" as const,
      rawText: raw
    };
  };

  // Helper to resolve the best person speaking / video review thumbnail
  const resolveNotificationThumbnail = (notif: CopoNotification): string | null => {
    // Only display right video thumbnail if this is actually a video review interaction or has an explicit videoId
    if (!notif.videoId && notif.type !== "like" && notif.type !== "comment" && notif.type !== "repost" && notif.type !== "bookmark") {
      return null;
    }

    // 1. If notif.videoId, look it up in allVideos for a valid thumbnail
    if (notif.videoId && allVideos.length > 0) {
      const match = allVideos.find((v) => v.id === notif.videoId);
      if (
        match &&
        match.thumbnailUrl &&
        !match.thumbnailUrl.endsWith(".mp4") &&
        !match.thumbnailUrl.includes("clearbit") &&
        !match.thumbnailUrl.includes("logo.png") &&
        !match.thumbnailUrl.includes("favicon")
      ) {
        return match.thumbnailUrl;
      }
    }

    // 2. If notif.videoThumbnail is explicitly provided and valid
    if (notif.videoThumbnail && typeof notif.videoThumbnail === "string" && notif.videoThumbnail.trim()) {
      const raw = notif.videoThumbnail.trim();
      const isLogoOrFavicon =
        raw.includes("clearbit") ||
        raw.includes("logo.png") ||
        raw.includes("logo.jpg") ||
        raw.includes("favicon") ||
        raw.includes("google.com/s2");
      const isVideoFile =
        raw.endsWith(".mp4") ||
        raw.endsWith(".webm") ||
        raw.endsWith(".mov") ||
        raw.includes("/api/videos/stream/");

      if (!isLogoOrFavicon && !isVideoFile) {
        return raw;
      }
    }

    return null;
  };


  return (
    <div 
      className="flex-1 h-full overflow-y-auto bg-zinc-950 text-white px-3.5 sm:px-6 md:px-8 py-3 sm:py-5 select-none" 
      style={{ paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))', paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
        
        {/* Top Header & Navigation Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 pb-1">
          {/* Left: Back Button + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs border border-zinc-800"
                title="Back to Feed"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
                {t("nav.notifications", "Notifications")}
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">
                {unreadCount > 0
                  ? `${unreadCount} ${t("common.just_now", "new updates")}`
                  : t("common.success", "All caught up")}
              </p>
            </div>
          </div>

          {/* Right: Sub-tab Switcher & Header Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onNavigateToMessages && (
              <div className="inline-flex items-center p-0.5 bg-zinc-900/90 rounded-full border border-zinc-800 shadow-3xs">
                <button
                  id="tab-notifs-messages"
                  onClick={onNavigateToMessages}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold text-zinc-400 hover:text-white cursor-pointer transition-all active:scale-95"
                >
                  Messages
                </button>
                <button
                  id="tab-notifs-activity"
                  className="px-2.5 py-1 rounded-full text-[11px] font-black bg-white text-zinc-950 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Activity</span>
                  {unreadCount > 0 && (
                    <span className="min-w-[15px] h-[15px] px-1 text-[9px] rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white bg-zinc-800/80 hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-700/80 active:scale-95"
              >
                Mark read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800 active:scale-95"
              >
                Clear all
              </button>
            )}

            {onOpenSettings && (
              <button
                id="btn-notifications-settings"
                onClick={onOpenSettings}
                className="p-1.5 sm:p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800 active:scale-95"
                title="Notification Preferences"
                aria-label="Notification Preferences"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Paused Notifications Notice Banner */}
        {currentUser?.notificationSettings?.enabled === false && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0">
                <BellOff className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <span className="truncate font-medium">In-app notifications are paused in your preferences.</span>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold shrink-0 transition-all active:scale-95 text-xs shadow-sm"
              >
                Settings
              </button>
            )}
          </div>
        )}

        {/* Filter Pills Segment Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar -mx-1 px-1">
          {filterPills.map((pill) => {
            const isActive = activeFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => setActiveFilter(pill.value)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-md border border-transparent font-black"
                    : "bg-zinc-900/90 text-zinc-300 border border-zinc-800 shadow-2xs hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>{pill.label}</span>
                {pill.count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-extrabold ${
                      isActive ? "bg-zinc-900 text-white" : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    {pill.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification Feed Card List */}
        {filteredNotifications.length > 0 ? (
          <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 divide-y divide-zinc-800/50 overflow-hidden shadow-2xs backdrop-blur-md">
            {filteredNotifications.map((notif) => {
              // Custom badge styles
              const badgeStyles = {
                like: {
                  bg: "bg-zinc-700 text-white ring-2 ring-zinc-950",
                  icon: <Heart className="w-2.5 h-2.5 fill-current" />
                },
                comment: {
                  bg: "bg-zinc-700 text-white ring-2 ring-zinc-950",
                  icon: <MessageSquare className="w-2.5 h-2.5 fill-current" />
                },
                follow: {
                  bg: "bg-zinc-700 text-white ring-2 ring-zinc-950",
                  icon: <UserPlus className="w-2.5 h-2.5" />
                },
                repost: {
                  bg: "bg-zinc-700 text-white ring-2 ring-zinc-950",
                  icon: <Repeat2 className="w-2.5 h-2.5" />
                },
                bookmark: {
                  bg: "bg-amber-500 text-white ring-2 ring-zinc-950",
                  icon: <Bookmark className="w-2.5 h-2.5 fill-current" />
                },
                message: {
                  bg: "bg-zinc-700 text-white ring-2 ring-zinc-950",
                  icon: <Mail className="w-2.5 h-2.5" />
                }
              }[notif.type] || {
                bg: "bg-zinc-700 text-white ring-2 ring-zinc-950",
                icon: <Bell className="w-2.5 h-2.5" />
              };

              const resolvedThumbnail = resolveNotificationThumbnail(notif);
              const details = parseNotificationDetails(notif.text, notif);

              return (
                <div
                  key={`notif-${notif.id}`}
                  onClick={() => {
                    handleMarkAsRead(notif.id);
                    if (notif.type === "message" && onNavigateToMessages) {
                      onNavigateToMessages();
                    } else if (notif.videoId) {
                      onSelectNotificationVideo(notif.videoId);
                    }
                  }}
                  className={`group relative p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-zinc-800/60 active:bg-zinc-800 cursor-pointer transition-colors ${
                    !notif.isRead ? "bg-zinc-800/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Avatar with Badge Overlay */}
                    <div className="relative shrink-0 select-none">
                      {(() => {
                        const isYoouzTeam =
                          (notif.user.name || "").toLowerCase().includes("yoouz") ||
                          (notif.user.email || "").toLowerCase().includes("yoouz") ||
                          (notif.user.email || "").toLowerCase().includes("admin");
                        const avatarSrc = isYoouzTeam
                          ? "/yoouz-facebook-avatar.png"
                          : notif.user.avatar || `/api/avatar?name=${encodeURIComponent(notif.user.name || "User")}&background=27272a&color=fff`;

                        return (
                          <img
                            src={avatarSrc}
                            alt={notif.user.name}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-zinc-800/80 shadow-2xs"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = isYoouzTeam
                                ? "/apple-touch-icon.png"
                                : `/api/avatar?name=${encodeURIComponent(notif.user.name || "User")}&background=27272a&color=fff`;
                            }}
                          />
                        );
                      })()}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center text-[9px] shadow-xs ${badgeStyles.bg}`}>
                        {badgeStyles.icon}
                      </span>
                    </div>

                    {/* Notification Text Content */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-[13px] text-zinc-200 leading-snug break-words line-clamp-2">
                        <span className="font-extrabold text-white hover:underline">
                          {notif.user.name}
                        </span>{" "}
                        {details.type === "recommendation" ? (
                          <>
                            <span className="text-zinc-300 font-medium">recommended</span>{" "}
                            <span className="font-bold text-white underline-offset-2 hover:underline">
                              <span className="sm:hidden">a website</span>
                              <span className="hidden sm:inline">{details.target}</span>
                            </span>
                            {details.rating && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-zinc-200 font-black text-[11px]">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline shrink-0" />
                                <span>{details.rating}</span>
                              </span>
                            )}
                          </>
                        ) : details.type === "video_share" ? (
                          <>
                            <span className="text-zinc-300 font-medium">shared a review for</span>{" "}
                            <span className="font-bold text-white underline-offset-2 hover:underline">
                              <span className="sm:hidden">a place</span>
                              <span className="hidden sm:inline">{details.target}</span>
                            </span>
                            {details.rating && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-zinc-200 font-black text-[11px]">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline shrink-0" />
                                <span>{details.rating}</span>
                              </span>
                            )}
                          </>
                        ) : details.type === "direct_message" ? (
                          <>
                            <span className="text-zinc-300 font-medium">sent a message:</span>{" "}
                            <span className="text-zinc-300 font-medium italic">
                              {details.messageBody}
                            </span>
                          </>
                        ) : details.type === "review_activity" ? (
                          <>
                            <span className="text-zinc-300 font-medium">{details.action}</span>{" "}
                            <span className="font-bold text-white">
                              <span className="sm:hidden">a place</span>
                              <span className="hidden sm:inline">{details.target}</span>
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-300 font-medium">{details.rawText}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        )}
                        <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium block">
                          {formatRecordedDate(notif.timestamp, notif.createdAtMs)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Thumbnail & Dismiss */}
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    {resolvedThumbnail ? (
                      <div 
                        className="w-11 h-14 sm:w-12 sm:h-15 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 shadow-md relative group-hover:scale-105 transition-transform duration-200"
                        title="Watch video review"
                      >
                        <img
                          src={resolvedThumbnail}
                          alt="Video review by creator"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (notif.user?.avatar && target.src !== notif.user.avatar) {
                              target.src = notif.user.avatar;
                            } else {
                              target.src = `/api/avatar?name=${encodeURIComponent(notif.user.name || "Video")}&background=27272a&color=fff`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                          <div className="w-4.5 h-4.5 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center shadow-sm">
                            <Play className="w-2 h-2 fill-white text-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Quick Dismiss Button */}
                    <button
                      onClick={(e) => handleDismiss(notif.id, e)}
                      className="p-1 sm:p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-400 border border-zinc-700/60 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer active:scale-90"
                      title="Delete notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-900/80 rounded-3xl border border-zinc-800 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center mb-3">
              <BellOff className="w-7 h-7 stroke-[2]" />
            </div>
            <h3 className="font-black text-white text-base mb-1">No notifications</h3>
            <p className="text-xs text-zinc-200 max-w-xs leading-relaxed font-medium">
              {activeFilter === "all"
                ? "You're all caught up! Community updates and video review activity will appear here."
                : `No notifications found under "${activeFilter}".`}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-4 px-4 py-2 rounded-full text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
