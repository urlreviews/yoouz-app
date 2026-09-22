import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatRecordedDate } from "../utils/dateUtils";
import { extractCleanDomain, getSafeAvatarUrl } from "../utils/placeUtils";
import { CopoBrandLogo } from "./CopoBrandLogo";
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
  Settings,
  Trash2
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
  onNavigateToMessages?: (targetKey?: string) => void;
  onNavigateHome?: () => void;
  onUpdateNotifications?: (updated: CopoNotification[]) => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAll?: () => void;
  onSuccessAuth?: (userData: { name: string; email: string; avatar: string }) => void;
  onOpenSettings?: () => void;
  onOpenCreator?: (author: any) => void;
}

type FilterType = "all" | "unread" | "messages" | "likes" | "comments" | "people" | "bookmarks";

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
  onOpenSettings,
  onOpenCreator,
}) => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [swipedNotifId, setSwipedNotifId] = useState<string | null>(null);
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
  const handleDismiss = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
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
      if (activeFilter === "messages") return n.type === "message";
      if (activeFilter === "likes") return n.type === "like";
      if (activeFilter === "comments") return n.type === "comment";
      if (activeFilter === "people") return n.type === "follow";
      if (activeFilter === "bookmarks") return n.type === "bookmark" || n.type === "repost";
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
    { label: "Messages", value: "messages" },
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

  // Helper to open the interacting user's profile
  const handleOpenUserProfile = (notif: CopoNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    handleMarkAsRead(notif.id);
    if (!onOpenCreator || !notif.user?.name) return;

    const isYoouzTeam =
      (notif.user.name || "").toLowerCase().includes("yoouz") ||
      (notif.user.email || "").toLowerCase().includes("yoouz") ||
      (notif.user.email || "").toLowerCase().includes("admin");

    if (isYoouzTeam) {
      onOpenCreator({
        name: "Yoouz",
        handle: "@yoouz",
        email: "info@yoouz.com",
        id: "yoouz",
        userId: "yoouz",
        avatar: "/favicon.svg",
        bio: "Official Yoouz Support & Community Platform",
        location: "Global Platform",
        isVerified: true,
        followersCount: 10000,
      });
      return;
    }

    onOpenCreator({
      name: notif.user.name,
      avatar: notif.user.avatar,
      handle: notif.user.name.toLowerCase().replace(/\s+/g, ""),
      isFollowed: false
    });
  };

  return (
    <div 
      className="flex-1 h-full overflow-y-auto bg-zinc-950 text-white px-3.5 sm:px-6 md:px-8 py-3 sm:py-5 select-none" 
      style={{ paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))', paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
        
        {/* Top Header & Navigation Bar */}
        <div className="flex items-center justify-between gap-3 pt-1 pb-2">
          {/* Left: Back Button + Title */}
          <div className="flex items-center gap-3 min-w-0">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs border border-zinc-800"
                title="Back to Feed"
                aria-label="Back to Feed"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {t("nav.notifications", "Notifications")}
              </h1>
              <p className="text-xs text-zinc-400 font-medium truncate">
                {unreadCount > 0
                  ? `${unreadCount} ${t("notifications.newUpdates", "new updates")}`
                  : t("notifications.allCaughtUp", "All caught up")}
              </p>
            </div>
          </div>

          {/* Right: Actions & Settings */}
          <div className="flex items-center gap-2 shrink-0">
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-zinc-800/90 hover:bg-zinc-700 transition-all cursor-pointer border border-zinc-700/80 active:scale-95 shadow-xs whitespace-nowrap"
              >
                {t("notifications.markRead", "Mark read")}
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 transition-all cursor-pointer border border-zinc-800 active:scale-95 shadow-xs whitespace-nowrap"
              >
                {t("notifications.clearAll", "Clear all")}
              </button>
            )}

            {onOpenSettings && (
              <button
                id="btn-notifications-settings"
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-full text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 transition-all cursor-pointer border border-zinc-800 active:scale-95 shadow-xs flex items-center justify-center shrink-0"
                title={t("notifications.preferences", "Notification Preferences")}
                aria-label={t("notifications.preferences", "Notification Preferences")}
              >
                <Settings className="w-5 h-5" />
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
            <AnimatePresence initial={false}>
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
                <motion.div
                  key={`notif-${notif.id}`}
                  initial={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden", transition: { duration: 0.2 } }}
                  className="relative overflow-hidden bg-zinc-950 group"
                >
                  {/* Mobile Swipe-to-delete Red Backdrop (Active on mobile touch screens) */}
                  {isTouchDevice && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDraggingRef.current) return;
                        handleDismiss(notif.id, e);
                        setSwipedNotifId(null);
                      }}
                      className="md:hidden absolute inset-y-0 right-0 w-24 bg-rose-600 text-white flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer select-none active:bg-rose-700 z-0"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>Delete</span>
                    </div>
                  )}

                  {/* Notification Card */}
                  <motion.div
                    drag={isTouchDevice ? "x" : false}
                    dragConstraints={isTouchDevice ? { left: -96, right: 0 } : undefined}
                    dragElastic={isTouchDevice ? 0.12 : false}
                    animate={{ x: isTouchDevice && swipedNotifId === notif.id ? -96 : 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    onDragStart={() => {
                      isDraggingRef.current = true;
                    }}
                    onDragEnd={isTouchDevice ? (_, info) => {
                      if (info.offset.x < -35 || info.velocity.x < -200) {
                        setSwipedNotifId(notif.id);
                      } else {
                        setSwipedNotifId(null);
                      }
                      setTimeout(() => {
                        isDraggingRef.current = false;
                      }, 300);
                    } : undefined}
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      if (swipedNotifId === notif.id) {
                        setSwipedNotifId(null);
                        return;
                      }
                      if (swipedNotifId) {
                        setSwipedNotifId(null);
                      }
                      handleMarkAsRead(notif.id);
                      if (notif.type === "message" && onNavigateToMessages) {
                        const targetKey = notif.user?.email || (notif.user as any)?.id || notif.user?.name;
                        onNavigateToMessages(targetKey);
                      } else if (notif.type === "follow" && notif.user?.name && onOpenCreator) {
                        const isYoouzTeam =
                          (notif.user.name || "").toLowerCase().includes("yoouz") ||
                          (notif.user.email || "").toLowerCase().includes("yoouz") ||
                          (notif.user.email || "").toLowerCase().includes("admin");
                        if (!isYoouzTeam) {
                          onOpenCreator({
                            name: notif.user.name,
                            avatar: notif.user.avatar,
                            handle: notif.user.name.toLowerCase().replace(/\s+/g, ""),
                            isFollowed: false
                          });
                        }
                      } else if (notif.videoId) {
                        onSelectNotificationVideo(notif.videoId);
                      }
                    }}
                    className={`relative z-10 p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer transition-colors ${
                      !notif.isRead 
                        ? "bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800" 
                        : "bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-850"
                    }`}
                  >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Avatar with Badge Overlay - Tapping Avatar opens User Profile */}
                    <div 
                      onClick={(e) => handleOpenUserProfile(notif, e)}
                      className="relative shrink-0 select-none cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
                      title={notif.user?.name ? `View ${notif.user.name}'s profile` : "View profile"}
                    >
                      {(() => {
                        const userName = notif.user.name || "";
                        const userDomain = extractCleanDomain(userName || notif.user.avatar || "");
                        const isBusinessNotif = Boolean(
                          userName.includes(".") ||
                          userName.toLowerCase().includes("yoouz") ||
                          (notif.user.avatar && (notif.user.avatar.includes("/logos/") || notif.user.avatar.includes("/api/logo") || notif.user.avatar.includes("logo")))
                        );

                        if (isBusinessNotif) {
                          return (
                            <CopoBrandLogo
                              domain={userDomain || userName}
                              name={userName}
                              logoUrl={notif.user.avatar}
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-zinc-200/60 shadow-2xs hover:ring-2 hover:ring-white/40 transition-all shrink-0 flex items-center justify-center overflow-hidden ring-1 ring-white/10"
                              imageClassName="w-full h-full object-contain rounded-md [image-rendering:-webkit-optimize-contrast]"
                              fallbackTextClassName="font-extrabold text-xs text-zinc-950"
                            />
                          );
                        }

                        const avatarSrc = getSafeAvatarUrl(
                          notif.user.avatar,
                          notif.user.name,
                          (notif.user as any).email || (notif.user as any).id || notif.user.name
                        );

                        return (
                          <img
                            src={avatarSrc}
                            alt={notif.user.name}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-zinc-800/80 shadow-2xs hover:ring-2 hover:ring-white/40 transition-all"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getSafeAvatarUrl(
                                null,
                                notif.user.name,
                                (notif.user as any).email || (notif.user as any).id || notif.user.name
                              );
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
                        {/* Tapping User Name specifically opens User Profile */}
                        <span 
                          onClick={(e) => handleOpenUserProfile(notif, e)}
                          className="font-extrabold text-white hover:underline cursor-pointer transition-colors"
                          title={notif.user?.name ? `View ${notif.user.name}'s profile` : "View profile"}
                        >
                          {notif.user.name}
                        </span>{" "}
                        {details.type === "recommendation" ? (
                          <>
                            <span className="text-zinc-300 font-medium">recommended</span>{" "}
                            <span className="font-bold text-white underline-offset-2 hover:underline">
                              {details.target}
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
                              {details.target}
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
                              {details.target}
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

                  {/* Right Thumbnail & Desktop Quick Delete */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none">
                    {resolvedThumbnail ? (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                          if (notif.videoId) {
                            onSelectNotificationVideo(notif.videoId);
                          }
                        }}
                        className="w-11 h-14 sm:w-12 sm:h-15 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 shadow-md relative group-hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
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

                    {/* Desktop Dedicated Delete Button: visible on hover / focus, no swiping needed on desktop */}
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(notif.id, e)}
                      className="hidden sm:inline-flex p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer items-center justify-center shrink-0 active:scale-90"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
                </motion.div>
              );
            })}
            </AnimatePresence>
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
