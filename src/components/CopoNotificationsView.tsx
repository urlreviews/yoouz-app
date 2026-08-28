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
  ChevronLeft
} from "lucide-react";
import { CopoNotification, UserProfile, VideoReview } from "../types";
import { CopoAuthPrompt } from "./CopoGoogleAuthModal";

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
}

type FilterType = "all" | "unread" | "likes" | "comments" | "people";

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
  onSuccessAuth
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Unauthenticated Gating View
  if (!currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-white text-white md:text-zinc-900 flex flex-col justify-between pb-32 md:pb-6" >
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
    { label: "Followers", value: "people" }
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

    // Case D: Likes / Shares / Comments on a review of a place/domain
    const ofMatch = raw.match(/^(liked your video review of|shared your video review of|commented:\s*".*?"\s*on your review of)\s*(.+)$/i);
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
    // 1. If notif.videoId, look it up in allVideos for a valid thumbnail
    if (notif.videoId && allVideos.length > 0) {
      const match = allVideos.find((v) => v.id === notif.videoId);
      if (match && match.thumbnailUrl &&
          !match.thumbnailUrl.endsWith(".mp4") &&
          !match.thumbnailUrl.includes("clearbit") &&
          !match.thumbnailUrl.includes("logo.png") &&
          !match.thumbnailUrl.includes("favicon")
      ) {
        return match.thumbnailUrl;
      }
    }

    // 2. If notif.videoThumbnail is provided, validate it's a good thumbnail (not a logo)
    if (notif.videoThumbnail && typeof notif.videoThumbnail === "string" && notif.videoThumbnail.trim()) {
      const raw = notif.videoThumbnail.trim();
      const isLogoOrFavicon =
        raw.includes("clearbit") ||
        raw.includes("logo.png") ||
        raw.includes("logo.jpg") ||
        raw.includes("favicon") ||
        raw.includes("google.com/s2");
      const isVideoFile = raw.endsWith(".mp4") || raw.endsWith(".webm") || raw.endsWith(".mov") || raw.includes("/api/videos/stream/");

      if (!isLogoOrFavicon && !isVideoFile) {
        return raw;
      }
    }
    
    // 3. Fallback: Find the latest video by this user in allVideos
    const userLatestVideo = allVideos
      .filter((v) => v.author.name === notif.user.name)
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))[0];
    
    if (userLatestVideo && userLatestVideo.thumbnailUrl) {
      return userLatestVideo.thumbnailUrl;
    }

    // 4. Fallback to user avatar
    return notif.user?.avatar || null;
  };


  return (
    <div 
      className="flex-1 h-full overflow-y-auto bg-zinc-950 md:bg-zinc-50/80 text-white md:text-zinc-900 px-3.5 sm:px-6 md:px-8 py-4 sm:py-6 select-none" 
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))', paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
    >
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
        
        {/* Top Sub-Tab Switcher matching Messages */}
        {onNavigateToMessages && (
          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center p-1 bg-zinc-900/90 md:bg-zinc-100/90 backdrop-blur-md rounded-2xl border border-zinc-800 md:border-zinc-200/90 shadow-3xs">
              <button
                id="tab-notifs-messages"
                onClick={onNavigateToMessages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 md:text-zinc-600 hover:text-white md:hover:text-zinc-950 hover:bg-zinc-800/60 md:hover:bg-white/60 cursor-pointer transition-all active:scale-95"
              >
                <Mail className="w-4 h-4 text-zinc-400" />
                <span>Messages</span>
              </button>

              <button
                id="tab-notifs-activity"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-zinc-800 md:bg-white text-blue-400 md:text-[#1a73e8] shadow-xs cursor-pointer transition-all"
              >
                <Bell className="w-4 h-4 text-blue-400 md:text-[#1a73e8]" />
                <span>Activity</span>
                {unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 text-[10px] rounded-full bg-red-500 text-white flex items-center justify-center font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Native Mobile / Desktop Header */}
        <div className="flex items-center justify-between gap-3 pt-1 pb-1">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-9 h-9 rounded-full bg-zinc-900 md:bg-zinc-100 hover:bg-zinc-800 md:hover:bg-zinc-200 text-zinc-300 md:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95 shadow-sm border border-zinc-800 md:border-zinc-200"
                title="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white md:text-zinc-950 tracking-tight leading-none">
                Notifications
              </h2>
              <p className="text-[12px] text-zinc-400 md:text-zinc-500 font-medium mt-1">
                {unreadCount > 0
                  ? `${unreadCount} new update${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold text-blue-400 md:text-[#1a73e8] bg-blue-950/50 md:bg-blue-50 hover:bg-blue-900/50 md:hover:bg-blue-100 transition-colors cursor-pointer border border-blue-800/50 md:border-blue-100/80 active:scale-95"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold text-zinc-400 md:text-zinc-500 hover:text-red-400 md:hover:text-red-600 bg-zinc-900 md:bg-zinc-100 hover:bg-red-950/40 md:hover:bg-red-50 transition-colors cursor-pointer border border-zinc-800 md:border-zinc-200/80 active:scale-95"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Filter Pills Segment Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar -mx-1 px-1">
          {filterPills.map((pill) => {
            const isActive = activeFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => setActiveFilter(pill.value)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? "bg-[#1a73e8] text-white shadow-md shadow-blue-500/25 border border-transparent font-black"
                    : "bg-zinc-900 md:bg-white text-zinc-300 md:text-zinc-600 border border-zinc-800 md:border-zinc-200/90 shadow-2xs hover:bg-zinc-800 md:hover:bg-zinc-50 hover:text-white md:hover:text-zinc-900"
                }`}
              >
                <span>{pill.label}</span>
                {pill.count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold ${
                      isActive ? "bg-white text-[#1a73e8]" : "bg-red-500 text-white"
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
          <div className="bg-zinc-900/90 md:bg-white rounded-3xl border border-zinc-800 md:border-zinc-200/90 divide-y divide-zinc-800/60 md:divide-zinc-100 overflow-hidden shadow-2xs">
            {filteredNotifications.map((notif) => {
              // Custom badge styles
              const badgeStyles = {
                like: {
                  bg: "bg-rose-500 text-white ring-2 ring-zinc-900 md:ring-white",
                  icon: <Heart className="w-2.5 h-2.5 fill-current" />
                },
                comment: {
                  bg: "bg-blue-500 text-white ring-2 ring-zinc-900 md:ring-white",
                  icon: <MessageSquare className="w-2.5 h-2.5 fill-current" />
                },
                follow: {
                  bg: "bg-purple-500 text-white ring-2 ring-zinc-900 md:ring-white",
                  icon: <UserPlus className="w-2.5 h-2.5" />
                },
                repost: {
                  bg: "bg-amber-500 text-white ring-2 ring-zinc-900 md:ring-white",
                  icon: <Repeat2 className="w-2.5 h-2.5" />
                },
                message: {
                  bg: "bg-[#1a73e8] text-white ring-2 ring-zinc-900 md:ring-white",
                  icon: <Mail className="w-2.5 h-2.5" />
                }
              }[notif.type] || {
                bg: "bg-zinc-500 text-white ring-2 ring-zinc-900 md:ring-white",
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
                  className={`group relative p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3.5 hover:bg-zinc-800/60 md:hover:bg-zinc-50/90 active:bg-zinc-800 md:active:bg-zinc-100 cursor-pointer transition-colors ${
                    !notif.isRead ? "bg-blue-950/30 md:bg-blue-50/20" : ""
                  }`}
                >
                  {/* Left edge unread indicator bar */}
                  {!notif.isRead && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-[#1a73e8]" />
                  )}

                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pl-1">
                    {/* Avatar with Badge Overlay */}
                    <div className="relative shrink-0 select-none">
                      <img
                        src={notif.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.user.name || "User")}&background=1a73e8&color=fff`}
                        alt={notif.user.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-zinc-800 md:border-zinc-200/80 shadow-2xs"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.user.name || "User")}&background=1a73e8&color=fff`;
                        }}
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center text-[9px] shadow-xs ${badgeStyles.bg}`}>
                        {badgeStyles.icon}
                      </span>
                    </div>

                    {/* Notification Text Content */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-[13px] text-zinc-300 md:text-zinc-700 leading-snug break-words line-clamp-2 sm:line-clamp-none">
                        <span className="font-extrabold text-white md:text-zinc-950 hover:underline">
                          {notif.user.name}
                        </span>{" "}
                        {details.type === "recommendation" ? (
                          <>
                            <span className="text-zinc-300 md:text-zinc-600 font-medium">recommended</span>{" "}
                            <span className="font-bold text-blue-400 md:text-[#1a73e8] underline-offset-2 hover:underline">
                              <span className="sm:hidden">a website</span>
                              <span className="hidden sm:inline">{details.target}</span>
                            </span>
                            {details.rating && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-400 font-black text-[11px] sm:text-xs">
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400 inline shrink-0" />
                                <span>{details.rating}</span>
                              </span>
                            )}
                          </>
                        ) : details.type === "video_share" ? (
                          <>
                            <span className="text-zinc-300 md:text-zinc-600 font-medium">shared a review for</span>{" "}
                            <span className="font-bold text-blue-400 md:text-[#1a73e8] underline-offset-2 hover:underline">
                              <span className="sm:hidden">a place</span>
                              <span className="hidden sm:inline">{details.target}</span>
                            </span>
                            {details.rating && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-400 font-black text-[11px] sm:text-xs">
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400 inline shrink-0" />
                                <span>{details.rating}</span>
                              </span>
                            )}
                          </>
                        ) : details.type === "direct_message" ? (
                          <>
                            <span className="text-zinc-300 md:text-zinc-600 font-medium">sent a message:</span>{" "}
                            <span className="text-zinc-200 md:text-zinc-800 font-medium italic">
                              {details.messageBody}
                            </span>
                          </>
                        ) : details.type === "review_activity" ? (
                          <>
                            <span className="text-zinc-300 md:text-zinc-600 font-medium">{details.action}</span>{" "}
                            <span className="font-bold text-blue-400 md:text-[#1a73e8]">
                              <span className="sm:hidden">a place</span>
                              <span className="hidden sm:inline">{details.target}</span>
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-300 md:text-zinc-600 font-medium">{details.rawText}</span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-zinc-500 md:text-zinc-400 font-semibold block mt-0.5">
                        {formatRecordedDate(notif.timestamp, notif.createdAtMs)}
                      </span>
                    </div>
                  </div>

                  {/* Right Thumbnail & Dismiss */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none">
                    {resolvedThumbnail ? (
                      <div 
                        className="w-11 h-14 sm:w-13 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 md:border-zinc-200/90 shadow-md relative group-hover:scale-105 transition-transform duration-200"
                        title="Watch video review"
                      >
                        <img
                          src={resolvedThumbnail}
                          alt="Video review by creator"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Fallback to user avatar if thumbnail fails to load
                            const target = e.currentTarget as HTMLImageElement;
                            if (notif.user?.avatar && target.src !== notif.user.avatar) {
                              target.src = notif.user.avatar;
                            } else {
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.user.name || "Video")}&background=1a73e8&color=fff`;
                            }
                          }}
                        />
                        {/* Play badge overlay showing it's a live video review */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center shadow-sm">
                            <Play className="w-2.5 h-2.5 fill-white text-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Quick Dismiss Button */}
                    <button
                      onClick={(e) => handleDismiss(notif.id, e)}
                      className="p-1 sm:p-1.5 rounded-full bg-zinc-800 md:bg-zinc-100 hover:bg-red-950/50 md:hover:bg-red-50 hover:text-red-400 md:hover:text-red-600 text-zinc-400 border border-zinc-700 md:border-zinc-200/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-90"
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
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-900/80 md:bg-white rounded-3xl border border-zinc-800 md:border-zinc-200/90 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 md:bg-blue-50 text-blue-400 md:text-[#1a73e8] border border-zinc-700 md:border-blue-100 flex items-center justify-center mb-3">
              <BellOff className="w-7 h-7 stroke-[2]" />
            </div>
            <h3 className="font-black text-white md:text-zinc-900 text-base mb-1">No notifications</h3>
            <p className="text-xs text-zinc-400 md:text-zinc-500 max-w-xs leading-relaxed font-medium">
              {activeFilter === "all"
                ? "You're all caught up! Community updates and video review activity will appear here."
                : `No notifications found under "${activeFilter}".`}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-4 px-4 py-2 rounded-full text-xs font-bold text-blue-400 md:text-[#1a73e8] bg-blue-950/50 md:bg-blue-50 hover:bg-blue-900/50 md:hover:bg-blue-100 border border-blue-800/50 md:border-blue-100 transition-colors cursor-pointer"
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
