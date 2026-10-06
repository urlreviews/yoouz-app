import { CopoNotification, CopoMessage, UserProfile } from "../types";
import { getCanonicalUserKey, isGenericUsername } from "./userCanonicalization";
import { generateGoogleLetterAvatarSvg } from "./avatar";
import { formatRecordedDate, parseTimestampToMs, resolveMessageTimestampMs } from "../utils/dateUtils";

export interface CreateNotificationParams {
  recipientEmail?: string;
  recipientHandle?: string;
  recipientId?: string;
  type: "like" | "comment" | "follow" | "repost" | "message" | "bookmark";
  user: {
    name: string;
    avatar: string;
    email?: string;
  };
  text: string;
  videoId?: string;
  videoThumbnail?: string;
  placeName?: string;
  customId?: string;
}

// Clean object helper to ensure payloads never contain undefined values
function sanitizeData(obj: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
}

// =========================================================================
// Real-Time SSE Shared Client (Server-Sent Events) for Zero-Latency Updates
// =========================================================================
type RealtimeEventHandler = (event: { type: string; [key: string]: any }) => void;
const realtimeListeners = new Set<RealtimeEventHandler>();
let activeEventSource: EventSource | null = null;
let sseReconnectTimer: any = null;
let sseRetryDelay = 2000;
let currentSseUserKey = "";
let isNetworkOnline = typeof navigator !== "undefined" ? navigator.onLine !== false : true;

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isNetworkOnline = true;
    sseRetryDelay = 2000;
    if (activeCurrentUser && realtimeListeners.size > 0 && !activeEventSource) {
      setupRealtimeStream(activeCurrentUser);
    }
  });

  window.addEventListener("offline", () => {
    isNetworkOnline = false;
    if (sseReconnectTimer) {
      clearTimeout(sseReconnectTimer);
      sseReconnectTimer = null;
    }
    if (activeEventSource) {
      try {
        activeEventSource.close();
      } catch (e) {}
      activeEventSource = null;
    }
  });
}

let activeCurrentUser: UserProfile | null = null;

function setupRealtimeStream(user: UserProfile) {
  activeCurrentUser = user;
  if (typeof window === "undefined" || typeof EventSource === "undefined") return;
  if (!isNetworkOnline) return;

  const email = (user.email || "").toLowerCase().trim();
  const userId = (user.userId || (user as any).id || "").trim();
  const name = (user.name || "").trim();
  const userKey = `${email}|${userId}|${name}`;

  if (activeEventSource && currentSseUserKey === userKey) {
    return;
  }

  if (activeEventSource) {
    try {
      activeEventSource.close();
    } catch (e) {}
    activeEventSource = null;
  }

  // Do not connect if document is hidden or user is offline
  if (typeof document !== "undefined" && document.hidden) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  currentSseUserKey = userKey;
  const query = new URLSearchParams({
    userEmail: email,
    userId: userId,
    userHandle: name
  }).toString();

  try {
    const es = new EventSource(`/api/realtime/stream?${query}`);
    activeEventSource = es;

    es.onopen = () => {
      sseRetryDelay = 5000;
    };

    es.onmessage = (e) => {
      sseRetryDelay = 5000;
      try {
        if (!e.data || e.data.trim() === "heartbeat") return;
        const parsed = JSON.parse(e.data);
        realtimeListeners.forEach((fn) => {
          try {
            fn(parsed);
          } catch (err) {}
        });
      } catch (parseErr) {}
    };

    es.onerror = () => {
      try {
        es.close();
      } catch (e) {}
      if (activeEventSource === es) {
        activeEventSource = null;
      }
      // Silently schedule reconnect only if online and tab is active
      if (!sseReconnectTimer && isNetworkOnline && typeof document !== "undefined" && !document.hidden) {
        sseReconnectTimer = setTimeout(() => {
          sseReconnectTimer = null;
          if (realtimeListeners.size > 0 && user && isNetworkOnline && !document.hidden) {
            setupRealtimeStream(user);
          }
        }, sseRetryDelay);
        sseRetryDelay = Math.min(sseRetryDelay * 2, 60000);
      }
    };
  } catch (err) {}
}

// Global tab visibility listener to cleanly pause/resume realtime stream
if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (activeEventSource) {
        try {
          activeEventSource.close();
        } catch (e) {}
        activeEventSource = null;
      }
    } else {
      if (currentSseUserKey && realtimeListeners.size > 0) {
        // Resume stream when tab returns to focus
        const dummyUser: UserProfile = {
          email: currentSseUserKey.split(":")[0] || "",
          handle: currentSseUserKey.split(":")[1] || "",
          name: currentSseUserKey.split(":")[1] || "User",
          avatar: ""
        };
        setupRealtimeStream(dummyUser);
      }
    }
  });
}

function registerRealtimeListener(user: UserProfile, handler: RealtimeEventHandler): () => void {
  realtimeListeners.add(handler);
  setupRealtimeStream(user);

  return () => {
    realtimeListeners.delete(handler);
    if (realtimeListeners.size === 0 && activeEventSource) {
      try {
        activeEventSource.close();
      } catch (e) {}
      activeEventSource = null;
      currentSseUserKey = "";
    }
  };
}

// Client-side recent notification dispatch cache (10s anti-duplicate window)
const recentDispatchedNotifKeys = new Map<string, number>();

/**
 * Send a notification to a recipient (persists in Bunny Cloud Database & instantly broadcasts via SSE)
 */
export async function sendSocialNotification(params: CreateNotificationParams): Promise<void> {
  const rawTargetEmail = (params.recipientEmail || "").trim().toLowerCase();
  const targetHandle = (params.recipientHandle || "").trim().toLowerCase().replace(/^@/, "");
  const targetId = (params.recipientId || "").trim().toLowerCase().replace(/^@/, "");
  const senderEmail = (params.user.email || "").trim().toLowerCase();
  const senderName = (params.user.name || "").trim().toLowerCase();

  // Canonicalize recipient email if missing or username was supplied
  let targetEmail = rawTargetEmail;
  if (!targetEmail || !targetEmail.includes("@")) {
    if (targetId.includes("@")) {
      targetEmail = targetId;
    } else if (targetId === "avt ertuop" || targetId.includes("avtertuop") || targetHandle.includes("avtertuop") || targetId.includes("avr6566gd")) {
      targetEmail = "avr6566gd@gmail.com";
    } else if (targetId === "biz riv" || targetId.includes("bizriv") || targetHandle.includes("bizriv") || targetId.includes("louis42111")) {
      targetEmail = "louis42111@gmail.com";
    } else if (targetId.includes("aouisesmee") || targetHandle.includes("aouisesmee")) {
      targetEmail = "aouisesmee@gmail.com";
    }
  }

  // Canonicalize sender email if missing
  let canonSenderEmail = senderEmail;
  if (!canonSenderEmail || !canonSenderEmail.includes("@")) {
    if (senderName === "avt ertuop" || senderName.includes("avtertuop") || senderName.includes("avr6566gd")) {
      canonSenderEmail = "avr6566gd@gmail.com";
    } else if (senderName === "biz riv" || senderName.includes("bizriv") || senderName.includes("louis42111")) {
      canonSenderEmail = "louis42111@gmail.com";
    } else if (senderName.includes("aouisesmee")) {
      canonSenderEmail = "aouisesmee@gmail.com";
    }
  }

  // Do not send notifications to oneself (unless explicitly different canonical users)
  if (targetEmail && canonSenderEmail && targetEmail === canonSenderEmail && !targetEmail.includes("test")) {
    return;
  }

  // Anti-Double Message Guard: Check in-memory 10-second dispatch window
  const dedupeKey = `${targetEmail || targetId}|${params.type}|${canonSenderEmail || senderName}|${params.videoId || ""}|${(params.text || "").trim().toLowerCase()}`;
  const now = Date.now();
  const lastDispatched = recentDispatchedNotifKeys.get(dedupeKey);
  if (lastDispatched && now - lastDispatched < 10000) {
    console.log(`[SocialSync] Throttled duplicate notification dispatch: ${dedupeKey}`);
    return;
  }
  recentDispatchedNotifKeys.set(dedupeKey, now);

  // Periodic cleanup of dispatch cache
  if (recentDispatchedNotifKeys.size > 200) {
    for (const [k, time] of recentDispatchedNotifKeys.entries()) {
      if (now - time > 15000) recentDispatchedNotifKeys.delete(k);
    }
  }

  // Deterministic ID generation fallback to guarantee single database record even across parallel requests
  let notifId = params.customId;
  if (!notifId) {
    if (params.type === "comment" && params.videoId && params.text) {
      const cleanSnippet = params.text.replace(/[^a-z0-9]/gi, "").slice(0, 20);
      notifId = `notif_comment_${params.videoId}_${(targetEmail || targetId).replace(/[^a-z0-9]/gi, '_')}_${cleanSnippet}`;
    } else if (params.type === "like" && params.videoId) {
      notifId = `notif_like_${(canonSenderEmail || 'anon').replace(/[^a-z0-9]/gi, '_')}_${params.videoId}`;
    } else if (((params.type as string) === "repost" || (params.type as string) === "share") && params.videoId) {
      notifId = `notif_share_${(canonSenderEmail || 'anon').replace(/[^a-z0-9]/gi, '_')}_${params.videoId}`;
    } else if (params.type === "bookmark" && params.videoId) {
      notifId = `notif_bookmark_${(canonSenderEmail || 'anon').replace(/[^a-z0-9]/gi, '_')}_${params.videoId}`;
    } else if (params.type === "follow") {
      notifId = `notif_follow_${(canonSenderEmail || 'anon').replace(/[^a-z0-9]/gi, '_')}_${(targetHandle || targetEmail || targetId).replace(/[^a-z0-9]/gi, '_')}`;
    } else {
      notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  // Sanitize videoThumbnail: ensure no video stream URL is passed as image thumbnail
  let sanitizedThumbnail = (params.videoThumbnail || "").trim();
  const isVideoFile = sanitizedThumbnail.endsWith(".mp4") || sanitizedThumbnail.endsWith(".webm") || sanitizedThumbnail.includes("/api/videos/stream/");
  const isTinyLogo = sanitizedThumbnail.includes("clearbit") || sanitizedThumbnail.includes("logo.png") || sanitizedThumbnail.includes("favicon") || sanitizedThumbnail.includes("google.com/s2");
  if (isVideoFile || (isTinyLogo && params.user.avatar)) {
    sanitizedThumbnail = params.user.avatar || "";
  }

  const payload = sanitizeData({
    id: notifId,
    recipientEmail: targetEmail,
    recipientHandle: targetHandle,
    recipientId: targetId || targetEmail,
    type: params.type,
    user: {
      name: params.user.name || "Community Reviewer",
      avatar: params.user.avatar || generateGoogleLetterAvatarSvg(params.user.name || "User", 128, senderEmail || params.user.name || "User"),
      email: senderEmail
    },
    text: params.text,
    timestamp: new Date().toISOString(),
    createdAt: Date.now(),
    createdAtMs: Date.now(),
    videoId: params.videoId || "",
    videoThumbnail: sanitizedThumbnail,
    placeName: params.placeName || "",
    isRead: false
  });

  // 1. Primary write to Bunny Database (Cloud libSQL) + Live SSE Broadcast
  fetch("/api/interactions/notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notification: payload })
  }).catch(() => {});

  // 2. Secondary NoSQL mirror write
  fetch(`/api/nosql/notifications/${notifId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload, merge: true })
  }).catch(() => {});

  // 3. Local instantaneous event dispatch for 0ms UI responsiveness
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("copo-notification-received", { detail: payload }));
    } catch (e) {}
  }
}

// Persistent deleted notification tracking
const deletedNotifIds = new Set<string>();

export function getDeletedNotifIds(userKey?: string): Set<string> {
  if (userKey) {
    try {
      const stored = localStorage.getItem(`yoouz_deleted_notifs_${userKey}`);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          arr.forEach((id) => deletedNotifIds.add(id));
        }
      }
    } catch (e) {}
  }
  return deletedNotifIds;
}

export function recordDeletedNotifId(notificationId: string, userKey?: string) {
  if (!notificationId) return;
  deletedNotifIds.add(notificationId);
  if (userKey) {
    try {
      localStorage.setItem(`yoouz_deleted_notifs_${userKey}`, JSON.stringify(Array.from(deletedNotifIds)));
    } catch (e) {}
  }
}

/**
 * Filter notifications intended for the current user
 */
function filterNotificationsForUser(rawItems: any[], currentUser: UserProfile): CopoNotification[] {
  const userEmail = (currentUser.email || (currentUser as any).businessEmail || "").toLowerCase().trim();
  const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  const emailPrefix = userEmail && userEmail.includes("@") ? userEmail.split("@")[0].toLowerCase().trim() : "";
  const userHandle = (currentUser.handle || currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "").trim();
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userId = (currentUser.userId || (currentUser as any).id || (currentUser as any).uid || "").toLowerCase().trim();
  const userPlaceId = ((currentUser as any).placeId || (currentUser as any).businessPlaceId || "").toLowerCase().trim();

  const deletedSet = getDeletedNotifIds(userKey);

  const isAvtErtuopUser =
    userEmail.includes("avr6566gd") ||
    userName === "avt ertuop" ||
    userHandle === "avtertuop" ||
    userId.includes("avr6566gd") ||
    userName === "avt" ||
    userHandle === "avt" ||
    userName.includes("avt") ||
    userHandle.includes("avt");

  const isAouisesmeeUser =
    userEmail.includes("aouisesmee") ||
    userEmail.includes("aouisemee") ||
    userEmail.includes("aouisesme") ||
    userEmail.includes("aouiseme") ||
    userName.includes("aouisesmee") ||
    userName.includes("aouisemee") ||
    userName.includes("aouisesme") ||
    userName.includes("aouiseme") ||
    userHandle.includes("aouisesmee") ||
    userHandle.includes("aouisemee") ||
    userHandle.includes("aouisesme") ||
    userHandle.includes("aouiseme") ||
    userId.includes("aouisesmee") ||
    userId.includes("aouisemee") ||
    userId.includes("aouisesme") ||
    userId.includes("aouiseme");

  const isBizRivUser =
    userEmail.includes("louis42111") ||
    userName === "biz riv" ||
    userHandle === "bizriv" ||
    userId.includes("louis42111") ||
    userName.includes("biz") ||
    userHandle.includes("biz");

  const isYoouzBizUser =
    userEmail.includes("yoouz") ||
    userName.includes("yoouz") ||
    userHandle.includes("yoouz") ||
    userId.includes("yoouz") ||
    Boolean((currentUser as any).isBusiness) ||
    Boolean(userPlaceId);

  // Read preferences from currentUser or localStorage
  let prefs = currentUser?.notificationSettings;
  if (!prefs) {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem("copo_notification_settings") : null;
      if (stored) prefs = JSON.parse(stored);
    } catch (e) {}
  }
  // Master notification switch: If disabled, user receives ZERO notifications!
  if (prefs && prefs.enabled === false) {
    return [];
  }

  const list: CopoNotification[] = [];

  for (const data of rawItems) {
    if (!data || !data.id) continue;

    // Skip permanently deleted notifications
    if (deletedSet.has(data.id)) {
      continue;
    }

    let parsedInner: any = {};
    if (typeof data.data === "string") {
      try { parsedInner = JSON.parse(data.data); } catch(e){}
    } else if (typeof data.data === "object" && data.data) {
      parsedInner = data.data;
    }

    const senderEmail = (data.user?.email || parsedInner.user?.email || "").toLowerCase().trim();
    const senderName = (data.user?.name || parsedInner.user?.name || "").toLowerCase().trim();

    const recEmail = (data.recipientEmail || parsedInner.recipientEmail || "").toLowerCase().trim();
    const recHandle = (data.recipientHandle || parsedInner.recipientHandle || "").toLowerCase().trim().replace(/^@/, "");
    const recId = (data.recipientId || parsedInner.recipientId || "").toLowerCase().trim().replace(/^@/, "");
    const normRecId = recId.replace(/\s+/g, "");
    const normRecHandle = recHandle.replace(/\s+/g, "");

    const isSystemOrGlobal = recEmail === "all" || recId === "all" || recHandle === "all";

    // Matching aliases
    const matchesAvtErtuop = isAvtErtuopUser && (
      recEmail.includes("avr6566gd") ||
      recId === "avt ertuop" ||
      recHandle === "avt ertuop" ||
      normRecId.includes("avtertuop") ||
      normRecHandle.includes("avtertuop") ||
      recId.includes("avr6566gd") ||
      recEmail.includes("avt") ||
      recHandle.includes("avt") ||
      recId.includes("avt") ||
      normRecId === "avt" ||
      normRecHandle === "avt"
    );

    const matchesAouisesmee = isAouisesmeeUser && (
      recEmail.includes("aouisesmee") ||
      recEmail.includes("aouisemee") ||
      recEmail.includes("aouisesme") ||
      recEmail.includes("aouiseme") ||
      normRecHandle.includes("aouisesmee") ||
      normRecHandle.includes("aouisemee") ||
      normRecHandle.includes("aouisesme") ||
      normRecHandle.includes("aouiseme") ||
      normRecId.includes("aouisesmee") ||
      normRecId.includes("aouisemee") ||
      normRecId.includes("aouisesme") ||
      normRecId.includes("aouiseme") ||
      recId.includes("aouisesmee") ||
      recId.includes("aouisemee") ||
      recId.includes("aouisesme") ||
      recId.includes("aouiseme") ||
      recHandle.includes("aouisesmee") ||
      recHandle.includes("aouisemee") ||
      recHandle.includes("aouisesme") ||
      recHandle.includes("aouiseme")
    );

    const matchesBizRiv = isBizRivUser && (
      recEmail.includes("louis42111") ||
      normRecHandle.includes("bizriv") ||
      normRecId.includes("louis42111") ||
      normRecId.includes("bizriv") ||
      recId === "biz riv" ||
      recHandle === "biz riv" ||
      recHandle.includes("bizriv") ||
      normRecHandle.includes("biz")
    );

    const matchesYoouzBiz = isYoouzBizUser && (
      recEmail.includes("yoouz") ||
      recId.includes("yoouz") ||
      recHandle.includes("yoouz") ||
      normRecId.includes("yoouz") ||
      normRecHandle.includes("yoouz") ||
      (data.placeName && (data.placeName.toLowerCase().includes("yoouz") || (userName && userName.length > 2 && userName.toLowerCase().includes(data.placeName.toLowerCase()))))
    );

    const matchesPlaceId = Boolean(userPlaceId && (
      recId === userPlaceId ||
      recEmail === userPlaceId ||
      recHandle === userPlaceId ||
      normRecId === userPlaceId ||
      normRecId.includes(userPlaceId) ||
      (data.videoId && String(data.videoId).includes(userPlaceId)) ||
      (data.placeName && userPlaceId.includes(data.placeName.toLowerCase().replace(/[^a-z0-9]/g, '')))
    ));

    const isGeneralMatch =
      isSystemOrGlobal ||
      matchesAvtErtuop ||
      matchesAouisesmee ||
      matchesBizRiv ||
      matchesYoouzBiz ||
      matchesPlaceId ||
      (userEmail && (recEmail === userEmail || recId === userEmail || recHandle === userEmail || normRecId === userEmail)) ||
      (emailPrefix && (recEmail === emailPrefix || recHandle === emailPrefix || recId === emailPrefix || normRecId === emailPrefix || recEmail.startsWith(emailPrefix))) ||
      (userHandle && (recHandle === userHandle || recId === userHandle || normRecId === userHandle || normRecHandle === userHandle || recEmail.includes(userHandle))) ||
      (userName && (recHandle === userName || recId === userName || recEmail === userName || normRecId === userName.replace(/\s+/g, ""))) ||
      (userId && (recId === userId || recEmail === userId || normRecId === userId || normRecId.includes(userId)));

    if (!isGeneralMatch) {
      continue;
    }

    // Exclude accidental pure self-action unless explicitly testing or addressed
    const isPureSelfAction =
      (userEmail && senderEmail && senderEmail === userEmail && !senderEmail.includes("test")) ||
      (userName && senderName && userName === senderName && (!senderEmail || !userEmail || senderEmail === userEmail) && !userName.includes("test"));

    if (isPureSelfAction && !isSystemOrGlobal) {
      continue;
    }

    const notifType = data.type || parsedInner.type || "like";

    // Respect user's in-app notification preferences
    if (prefs) {
      if (prefs.enabled === false) {
        continue;
      }
      const normNotifType = String(notifType).toLowerCase().trim();
      if (normNotifType === "like" && prefs.likes === false) continue;
      if (normNotifType === "comment" && prefs.comments === false) continue;
      if ((normNotifType === "message" || normNotifType === "chat") && prefs.messages === false) continue;
      if (normNotifType === "follow" && prefs.follows === false) continue;
      if ((normNotifType === "bookmark" || normNotifType === "save") && prefs.bookmarks === false) continue;
      if ((normNotifType === "repost" || normNotifType === "share") && (prefs.shares === false || (prefs.shares === undefined && prefs.bookmarks === false))) continue;
    }

    // Resolve authentic creation timestamp
    const trueCreatedAtMs =
      parseTimestampToMs(data.createdAtMs) ??
      parseTimestampToMs(parsedInner.createdAtMs) ??
      parseTimestampToMs(data.createdAt) ??
      parseTimestampToMs(parsedInner.createdAt) ??
      parseTimestampToMs(data.id) ??
      parseTimestampToMs(parsedInner.id) ??
      Date.now();

    list.push({
      ...data,
      id: String(data.id),
      recipientEmail: data.recipientEmail || recEmail,
      recipientId: data.recipientId || recId,
      recipientHandle: data.recipientHandle || recHandle,
      type: data.type || "like",
      user: {
        name: data.user?.name || parsedInner.user?.name || "Community Reviewer",
        avatar: data.user?.avatar || parsedInner.user?.avatar || generateGoogleLetterAvatarSvg(data.user?.name || parsedInner.user?.name || "User", 128, senderEmail || data.user?.name || parsedInner.user?.name || "User"),
        email: data.user?.email || parsedInner.user?.email || senderEmail
      },
      text: data.text || parsedInner.text || "",
      timestamp: formatRecordedDate(undefined, trueCreatedAtMs),
      createdAtMs: trueCreatedAtMs,
      createdAt: trueCreatedAtMs,
      videoId: data.videoId || parsedInner.videoId,
      videoThumbnail: data.videoThumbnail || parsedInner.videoThumbnail,
      placeName: data.placeName || parsedInner.placeName,
      isRead: Boolean(data.isRead === true || data.isRead === 1 || data.read === true || data.read === 1 || data.isRead === "true" || data.isRead === "1" || parsedInner.isRead === true || parsedInner.read === true),
      read: Boolean(data.isRead === true || data.isRead === 1 || data.read === true || data.read === 1 || data.isRead === "true" || data.isRead === "1" || parsedInner.isRead === true || parsedInner.read === true)
    });
  }

  // Sort newest first
  list.sort((a, b) => {
    const timeA = a.createdAtMs || (a as any).createdAt || 0;
    const timeB = b.createdAtMs || (b as any).createdAt || 0;
    return timeB - timeA;
  });

  return list;
}

/**
 * Send an official welcome notification strictly once when a new user signs up
 */
export async function sendWelcomeNotificationForNewUser(currentUser: UserProfile): Promise<void> {
  if (!currentUser) return;
  const userEmail = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  if (!userEmail || !userEmail.includes("@")) return;

  const userKey = userEmail;
  const welcomeKey = `yoouz_welcome_sent_${userKey}`;
  
  // Skip if already sent strictly once for this user account
  if (typeof window !== "undefined" && localStorage.getItem(welcomeKey) === "true") {
    return;
  }

  const deletedSet = getDeletedNotifIds(userKey);

  // Skip if permanently deleted by user
  if (deletedSet.has(`welcome_notif_${userKey}`) || deletedSet.has("all_cleared")) {
    return;
  }

  try {
    await sendSocialNotification({
      customId: `welcome_notif_${userKey}`,
      recipientEmail: userEmail,
      recipientHandle: currentUser.name || userEmail.split("@")[0],
      recipientId: currentUser.userId || userEmail,
      type: "follow",
      user: {
        name: "Yoouz Team",
        avatar: "/yoouz-avatar-white.png",
        email: "team@yoouz.com"
      },
      text: "Welcome to Yoouz! Real people, real reviews. Explore authentic video reviews near you or record your first 60s review."
    });
    localStorage.setItem(welcomeKey, "true");
  } catch {}
}

/**
 * Real-time subscription to notifications for the current user
 * Uses Instant SSE streaming + Bunny Cloud Database + Instant Local Cache
 */
export function subscribeToNotifications(
  currentUser: UserProfile | null,
  onUpdate: (notifications: CopoNotification[]) => void
): () => void {
  if (!currentUser) {
    onUpdate([]);
    return () => {};
  }

  let isDisposed = false;
  let cachedNotifs: CopoNotification[] = [];
  const userEmail = currentUser ? (currentUser.email || (currentUser as any).businessEmail || "").toLowerCase().trim() : "";
  const userId = currentUser ? (currentUser.userId || (currentUser as any).id || (currentUser as any).placeId || "").toLowerCase().trim() : "";
  const userKey = (userEmail || userId || "anon").toLowerCase().trim();
  const cacheKey = `copo_cached_notifs_${userKey}`;

  const getCurrentPrefs = () => {
    let p = currentUser?.notificationSettings;
    if (!p) {
      try {
        const s = localStorage.getItem("copo_notification_settings");
        if (s) p = JSON.parse(s);
      } catch (e) {}
    }
    return p;
  };

  const updateList = (newItems: CopoNotification[]) => {
    if (isDisposed) return;
    const currentPrefs = getCurrentPrefs();
    if (currentPrefs && currentPrefs.enabled === false) {
      cachedNotifs = [];
      onUpdate([]);
      return;
    }

    // Filter against user's specific notification toggles (likes, comments, etc.)
    const filteredByPrefs = filterNotificationsForUser(newItems, currentUser);

    // Strict deduplication guard across memory, cache, and state
    const deduped: CopoNotification[] = [];
    const seen = new Set<string>();
    for (const item of filteredByPrefs) {
      if (!item || !item.id) continue;
      const rec = ((item as any).recipientEmail || (item as any).recipientId || "").toLowerCase().trim();
      const type = (item.type || "").toLowerCase().trim();
      const text = (item.text || "").toLowerCase().trim();
      const vid = (item.videoId || "").trim();
      const sender = (item.user?.name || item.user?.email || "").toLowerCase().trim();
      const dedupeKey = `${rec}|${type}|${sender}|${vid}|${text}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        deduped.push(item);
      }
    }
    cachedNotifs = deduped;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(deduped));
      if (userEmail) localStorage.setItem(`copo_cached_notifs_${userEmail}`, JSON.stringify(deduped));
      if (userId) localStorage.setItem(`copo_cached_notifs_${userId}`, JSON.stringify(deduped));
      if ((currentUser as any)?.placeId) localStorage.setItem(`copo_cached_notifs_${(currentUser as any).placeId}`, JSON.stringify(deduped));
    } catch (e) {}
    onUpdate(deduped);
  };

  // 0. Immediate load from LocalStorage cache so notifications never disappear on refresh
  try {
    const keysToTry = [
      cacheKey,
      userEmail ? `copo_cached_notifs_${userEmail}` : null,
      userId ? `copo_cached_notifs_${userId}` : null,
      (currentUser as any)?.placeId ? `copo_cached_notifs_${(currentUser as any).placeId}` : null
    ].filter(Boolean) as string[];

    for (const key of keysToTry) {
      const rawCache = localStorage.getItem(key);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((n: any) => {
            if (!n || !n.id) return false;
            if (String(n.id).startsWith("welcome_notif_") && parsed.length > 1 && (n.isRead === false || n.read === false)) {
              return false;
            }
            return true;
          }).map((n: any) => {
            const trueCreatedAtMs =
              parseTimestampToMs(n.createdAtMs) ??
              parseTimestampToMs(n.createdAt) ??
              parseTimestampToMs(n.id) ??
              Date.now();
            return {
              ...n,
              createdAtMs: trueCreatedAtMs,
              createdAt: trueCreatedAtMs,
              timestamp: formatRecordedDate(undefined, trueCreatedAtMs)
            };
          });
          if (cleaned.length > 0) {
            updateList(cleaned);
            break;
          }
        }
      }
    }
  } catch (e) {}

  // 1. Initial immediate fetch from Bunny Cloud Database
  let isFetchingNotifs = false;
  const fetchFromBunny = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (isFetchingNotifs) return;
    isFetchingNotifs = true;
    try {
      const userParam = userEmail || userId || "";
      const res = await fetch(`/api/nosql/notifications?user=${encodeURIComponent(userParam)}&_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || json.data || []);
        if (Array.isArray(items) && !isDisposed) {
          const filtered = filterNotificationsForUser(items, currentUser);
          
          // Merge server items with cached items to ensure real-time notifications are never dropped
          const map = new Map<string, CopoNotification>();
          
          // Seed with current filtered cached items
          const filteredCached = filterNotificationsForUser(cachedNotifs, currentUser);
          filteredCached.forEach((item) => {
            if (item && item.id) map.set(item.id, item);
          });
          
          // Overlay server items
          filtered.forEach((item) => {
            if (item && item.id) {
              const prev = map.get(item.id);
              if (prev) {
                map.set(item.id, {
                  ...item,
                  isRead: prev.isRead || item.isRead
                });
              } else {
                map.set(item.id, item);
              }
            }
          });

          const merged = Array.from(map.values()).sort((a, b) => {
            const timeA = a.createdAtMs || 0;
            const timeB = b.createdAtMs || 0;
            return timeB - timeA;
          });

          updateList(merged);
        }
      }
    } catch (e) {
    } finally {
      isFetchingNotifs = false;
    }
  };
  fetchFromBunny();

  // 2. Real-Time Instant SSE Event Listener (<100ms response time)
  const unregisterSse = registerRealtimeListener(currentUser, (evt) => {
    if (evt.type === "notification") {
      const notifData = evt.notification || evt.data;
      if (notifData) {
        const filtered = filterNotificationsForUser([notifData], currentUser);
        if (filtered.length > 0) {
          const freshItem = filtered[0];
          const freshMs = parseTimestampToMs(freshItem.createdAtMs) ?? parseTimestampToMs(freshItem.createdAt) ?? Date.now();
          freshItem.createdAtMs = freshMs;
          freshItem.createdAt = freshMs;
          freshItem.timestamp = formatRecordedDate(undefined, freshMs);

          const freshSender = (freshItem.user?.name || freshItem.user?.email || "").toLowerCase().trim();
          const freshType = (freshItem.type || "").toLowerCase().trim();
          const freshText = (freshItem.text || "").toLowerCase().trim();
          const freshVid = (freshItem.videoId || "").trim();
          const freshRec = ((freshItem as any).recipientEmail || (freshItem as any).recipientId || "").toLowerCase().trim();
          const freshDedupeKey = `${freshRec}|${freshType}|${freshSender}|${freshVid}|${freshText}`;

          const existingIdx = cachedNotifs.findIndex((n) => {
            if (n.id === freshItem.id) return true;
            const nSender = (n.user?.name || n.user?.email || "").toLowerCase().trim();
            const nType = (n.type || "").toLowerCase().trim();
            const nText = (n.text || "").toLowerCase().trim();
            const nVid = (n.videoId || "").trim();
            const nRec = ((n as any).recipientEmail || (n as any).recipientId || "").toLowerCase().trim();
            return `${nRec}|${nType}|${nSender}|${nVid}|${nText}` === freshDedupeKey;
          });

          let nextList: CopoNotification[];
          if (existingIdx >= 0) {
            nextList = [...cachedNotifs];
            nextList[existingIdx] = { ...cachedNotifs[existingIdx], ...freshItem };
          } else {
            nextList = [freshItem, ...cachedNotifs];
          }
          updateList(nextList);
        }
      }
    } else if (evt.type === "notification_read" && evt.id) {
      const nextList = cachedNotifs.map((n) => n.id === evt.id ? { ...n, isRead: evt.isRead !== false, read: evt.isRead !== false } : n);
      updateList(nextList);
    } else if (evt.type === "notifications_all_read") {
      const idSet = Array.isArray(evt.ids) && evt.ids.length > 0 ? new Set(evt.ids) : null;
      const nextList = cachedNotifs.map((n) => !idSet || idSet.has(n.id) ? { ...n, isRead: true, read: true } : n);
      updateList(nextList);
    } else if (evt.type === "notification_deleted" && evt.id) {
      const nextList = cachedNotifs.filter((n) => n.id !== evt.id);
      updateList(nextList);
    } else if (evt.type === "notifications_cleared") {
      updateList([]);
    } else if (evt.type === "notification_settings_updated") {
      const newSettings = evt.settings;
      if (newSettings && typeof newSettings === "object") {
        if (currentUser) {
          currentUser.notificationSettings = newSettings;
        }
        try {
          localStorage.setItem("copo_notification_settings", JSON.stringify(newSettings));
        } catch (e) {}
        updateList(cachedNotifs);
      }
    }
  });

  // 3. Periodic Background Sync (every 12 seconds when visible & online)
  const pollTimer = setInterval(() => {
    if (document.visibilityState === "visible" && (typeof navigator === "undefined" || navigator.onLine)) {
      fetchFromBunny();
    }
  }, 12000);

  const handleOnlineRefresh = () => {
    if (document.visibilityState === "visible") {
      fetchFromBunny();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnlineRefresh);
    window.addEventListener("focus", handleOnlineRefresh);
    document.addEventListener("visibilitychange", handleOnlineRefresh);
  }

  // 4. Instant local window event listener for 0ms in-app actions
  const handleLocalNotif = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (customEvt && customEvt.detail) {
      const filtered = filterNotificationsForUser([customEvt.detail], currentUser);
      if (filtered.length > 0) {
        const freshItem = filtered[0];
        const existingIdx = cachedNotifs.findIndex((n) => n.id === freshItem.id);
        let nextList: CopoNotification[];
        if (existingIdx >= 0) {
          nextList = [...cachedNotifs];
          nextList[existingIdx] = freshItem;
        } else {
          nextList = [freshItem, ...cachedNotifs];
        }
        updateList(nextList);
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("copo-notification-received", handleLocalNotif);
  }

  return () => {
    isDisposed = true;
    clearInterval(pollTimer);
    unregisterSse();
    if (typeof window !== "undefined") {
      window.removeEventListener("copo-notification-received", handleLocalNotif);
      window.removeEventListener("online", handleOnlineRefresh);
      window.removeEventListener("focus", handleOnlineRefresh);
      document.removeEventListener("visibilitychange", handleOnlineRefresh);
    }
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string, currentUser?: UserProfile | null): Promise<void> {
  if (!notificationId) return;

  const userEmail = currentUser ? (currentUser.email || (currentUser as any).businessEmail || "").toLowerCase().trim() : "";
  const userId = currentUser ? (currentUser.userId || (currentUser as any).id || (currentUser as any).placeId || "").toLowerCase().trim() : "";
  const userKey = (userEmail || userId || "anon").toLowerCase().trim();

  const keysToUpdate = Array.from(new Set([
    `copo_cached_notifs_${userKey}`,
    userEmail ? `copo_cached_notifs_${userEmail}` : null,
    userId ? `copo_cached_notifs_${userId}` : null,
    (currentUser as any)?.placeId ? `copo_cached_notifs_${(currentUser as any).placeId}` : null
  ].filter(Boolean))) as string[];

  keysToUpdate.forEach((cacheKey) => {
    try {
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((n: any) => n.id === notificationId ? { ...n, isRead: true, read: true } : n);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  });

  // 1. Dedicated high-performance interaction endpoint
  fetch("/api/interactions/notification/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: notificationId, isRead: true, recipientEmail: userEmail || userId })
  }).catch(() => {});

  // 2. Secondary NoSQL mirror endpoint
  fetch(`/api/nosql/notifications/${notificationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { isRead: true, read: true }, merge: true })
  }).catch(() => {});
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(notificationIds: string[], currentUser?: UserProfile | null): Promise<void> {
  if (!notificationIds || notificationIds.length === 0) return;

  const userEmail = currentUser ? (currentUser.email || (currentUser as any).businessEmail || "").toLowerCase().trim() : "";
  const userId = currentUser ? (currentUser.userId || (currentUser as any).id || (currentUser as any).placeId || "").toLowerCase().trim() : "";
  const userKey = (userEmail || userId || "anon").toLowerCase().trim();

  const keysToUpdate = Array.from(new Set([
    `copo_cached_notifs_${userKey}`,
    userEmail ? `copo_cached_notifs_${userEmail}` : null,
    userId ? `copo_cached_notifs_${userId}` : null,
    (currentUser as any)?.placeId ? `copo_cached_notifs_${(currentUser as any).placeId}` : null
  ].filter(Boolean))) as string[];

  const idSet = new Set(notificationIds);

  keysToUpdate.forEach((cacheKey) => {
    try {
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((n: any) => idSet.has(n.id) ? { ...n, isRead: true, read: true } : n);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  });

  // 1. Dedicated high-performance bulk endpoint
  fetch("/api/interactions/notification/read-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: notificationIds, recipientEmail: userEmail || userId })
  }).catch(() => {});

  // 2. Secondary NoSQL mirror update
  for (const id of notificationIds) {
    fetch(`/api/nosql/notifications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { isRead: true, read: true }, merge: true })
    }).catch(() => {});
  }
}

/**
 * Delete a notification permanently
 */
export async function deleteNotification(notificationId: string, currentUser?: UserProfile | null): Promise<void> {
  if (!notificationId) return;

  const userEmail = currentUser ? (currentUser.email || (currentUser as any).businessEmail || "").toLowerCase().trim() : "";
  const userId = currentUser ? (currentUser.userId || (currentUser as any).id || (currentUser as any).placeId || "").toLowerCase().trim() : "";
  const userKey = (userEmail || userId || "anon").toLowerCase().trim();

  recordDeletedNotifId(notificationId, userKey);
  if (userEmail) recordDeletedNotifId(notificationId, userEmail);
  if (userId) recordDeletedNotifId(notificationId, userId);

  const keysToUpdate = Array.from(new Set([
    `copo_cached_notifs_${userKey}`,
    userEmail ? `copo_cached_notifs_${userEmail}` : null,
    userId ? `copo_cached_notifs_${userId}` : null,
    (currentUser as any)?.placeId ? `copo_cached_notifs_${(currentUser as any).placeId}` : null
  ].filter(Boolean))) as string[];

  keysToUpdate.forEach((cacheKey) => {
    try {
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((n: any) => n.id !== notificationId);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  });

  // 1. Dedicated delete endpoint
  fetch("/api/interactions/notification/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: notificationId })
  }).catch(() => {});

  // 2. Secondary NoSQL DELETE
  fetch(`/api/nosql/notifications/${notificationId}`, {
    method: "DELETE"
  }).catch(() => {});
}

/**
 * Clear all notifications for user
 */
export async function clearAllNotifications(notificationIds: string[], currentUser?: UserProfile | null): Promise<void> {
  const userEmail = currentUser ? (currentUser.email || (currentUser as any).businessEmail || "").toLowerCase().trim() : "";
  const userId = currentUser ? (currentUser.userId || (currentUser as any).id || (currentUser as any).placeId || "").toLowerCase().trim() : "";
  const userKey = (userEmail || userId || "anon").toLowerCase().trim();

  recordDeletedNotifId("all_cleared", userKey);
  if (userEmail) recordDeletedNotifId("all_cleared", userEmail);
  if (userId) recordDeletedNotifId("all_cleared", userId);

  const keysToUpdate = Array.from(new Set([
    `copo_cached_notifs_${userKey}`,
    userEmail ? `copo_cached_notifs_${userEmail}` : null,
    userId ? `copo_cached_notifs_${userId}` : null,
    (currentUser as any)?.placeId ? `copo_cached_notifs_${(currentUser as any).placeId}` : null
  ].filter(Boolean))) as string[];

  keysToUpdate.forEach((cacheKey) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify([]));
    } catch (e) {}
  });

  // 1. Dedicated clear-all endpoint
  fetch("/api/interactions/notification/clear-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: notificationIds, recipientEmail: userEmail || userId })
  }).catch(() => {});

  if (Array.isArray(notificationIds)) {
    for (const id of notificationIds) {
      deleteNotification(id, currentUser);
    }
  }
}

export function getCanonicalDirectChatThreadId(userAKey: string, userBKey: string, isBusiness?: boolean, placeId?: string): string {
  if (isBusiness && placeId) {
    return `thread_biz_${placeId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  }
  const cleanA = (userAKey || "").toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, "_");
  const cleanB = (userBKey || "").toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, "_");
  const sorted = [cleanA, cleanB].sort().join("__");
  return `thread_dm_${sorted}`;
}

export function getAllDeletedThreadsKeys(currentUser?: UserProfile | null): string[] {
  const keys = new Set<string>();
  keys.add("yoouz_deleted_threads");
  if (currentUser) {
    const list = [
      currentUser.userId,
      currentUser.id,
      (currentUser as any).uid,
      (currentUser as any).placeId,
      currentUser.email,
      currentUser.handle
    ].filter(Boolean).map(s => String(s).toLowerCase().trim().replace(/^@/, ''));
    for (const item of list) {
      if (item) keys.add(`yoouz_deleted_threads_${item}`);
    }
  }
  return Array.from(keys);
}

export function getDeletedThreadsKey(currentUser?: UserProfile | null): string {
  if (!currentUser) return "yoouz_deleted_threads";
  const id = (currentUser.userId || currentUser.id || (currentUser as any).uid || (currentUser as any).placeId || currentUser.email || "").toLowerCase().trim().replace(/^@/, '');
  return id ? `yoouz_deleted_threads_${id}` : "yoouz_deleted_threads";
}

export function getDeletedThreadsMap(currentUser?: UserProfile | null): Map<string, number> {
  const map = new Map<string, number>();
  if (typeof window === "undefined") return map;
  try {
    const keys = getAllDeletedThreadsKeys(currentUser);
    for (const userDelKey of keys) {
      const raw = localStorage.getItem(userDelKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (typeof item === "string" && item.trim()) {
              map.set(item.trim(), 1);
            } else if (item && typeof item === "object" && item.id) {
              const val = Number(item.deletedAt);
              map.set(String(item.id).trim(), !isNaN(val) && val > 0 ? val : 1);
            }
          }
        } else if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed)) {
            const val = Number(v);
            map.set(k.trim(), !isNaN(val) && val > 0 ? val : 1);
          }
        }
      }
    }
  } catch (e) {}
  return map;
}

export function saveDeletedThreadsMap(map: Map<string, number>, currentUser?: UserProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    const keys = getAllDeletedThreadsKeys(currentUser);
    const obj: Record<string, number> = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    const serialized = JSON.stringify(obj);
    for (const userDelKey of keys) {
      localStorage.setItem(userDelKey, serialized);
    }
  } catch (e) {}
}

export function saveReadThreadTimestamp(threadId: string, currentUser?: UserProfile | null, partnerKey?: string): void {
  if (typeof window === "undefined" || !currentUser || !threadId) return;
  try {
    const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
    const readKey = `copo_read_threads_${userKey}`;
    const existingRaw = localStorage.getItem(readKey);
    const map = existingRaw ? JSON.parse(existingRaw) : {};
    const now = Date.now();
    map[threadId] = now;
    map[threadId.toLowerCase()] = now;
    if (partnerKey) {
      map[partnerKey] = now;
      map[partnerKey.toLowerCase()] = now;
    }
    localStorage.setItem(readKey, JSON.stringify(map));
  } catch (e) {}
}

export function getReadThreadTimestamp(threadId: string, currentUser?: UserProfile | null): number {
  if (typeof window === "undefined" || !currentUser || !threadId) return 0;
  try {
    const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
    const readKey = `copo_read_threads_${userKey}`;
    const existingRaw = localStorage.getItem(readKey);
    if (!existingRaw) return 0;
    const map = JSON.parse(existingRaw);
    return Math.max(
      Number(map[threadId] || 0),
      Number(map[threadId.toLowerCase()] || 0)
    );
  } catch (e) {
    return 0;
  }
}

/**
 * Filter and format chat threads for the current user
 */
function processChatThreadsForUser(rawItems: any[], currentUser: UserProfile): CopoMessage[] {
  if (currentUser) {
    activeCurrentUser = currentUser;
  }
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || currentUser.handle || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userFirstName = userName.split(/\s+/)[0] || "";
  const userId = (currentUser.userId || (currentUser as any).id || (currentUser as any).uid || "").toLowerCase().trim();
  const isBusinessUser = Boolean((currentUser as any).isBusiness || userId.startsWith("place_") || (currentUser as any).placeId);

  const deletedThreadsMap = getDeletedThreadsMap(currentUser);
  let deletedThreadsModified = false;

  const threads: CopoMessage[] = [];

  for (const data of rawItems) {
    if (!data) continue;
    const threadId = String(data.id || "").trim();
    if (!threadId) continue;

    // Check if deleted specifically on the server record
    const deletedForUsers = Array.isArray(data.deletedForUsers)
      ? data.deletedForUsers.map((u: string) => (u || "").toLowerCase().trim().replace(/^@/, ''))
      : [];
    const myAliases = [
      userEmail,
      userId,
      userHandle,
      userName,
      (currentUser as any).placeId,
      (currentUser as any).uid,
      (currentUser as any).id
    ].filter(Boolean).map(s => String(s).toLowerCase().trim().replace(/^@/, ''));

    if (deletedForUsers.some(del => myAliases.includes(del))) {
      continue;
    }

    const senderEmail = (data.senderEmail || data.lastSenderEmail || "").toLowerCase().trim();
    const senderId = (data.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const senderName = (data.senderName || data.lastSenderName || "").toLowerCase().trim();
    const recipientEmail = (data.recipientEmail || "").toLowerCase().trim();
    const recipientId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");
    const recipientName = (data.recipientName || "").toLowerCase().trim();
    const partnerKey = getThreadPartnerKey(data, currentUser);

    // Check if user explicitly deleted this thread locally by threadId, partnerKey, or participant aliases
    const deletedTimestamp = 
      deletedThreadsMap.get(threadId) ?? 
      (partnerKey ? deletedThreadsMap.get(partnerKey) : undefined) ??
      (senderId ? deletedThreadsMap.get(senderId) : undefined) ??
      (recipientId ? deletedThreadsMap.get(recipientId) : undefined) ??
      (senderEmail ? deletedThreadsMap.get(senderEmail) : undefined) ??
      (recipientEmail ? deletedThreadsMap.get(recipientEmail) : undefined) ??
      (senderName ? deletedThreadsMap.get(senderName) : undefined) ??
      (recipientName ? deletedThreadsMap.get(recipientName) : undefined);

    if (deletedTimestamp !== undefined && deletedTimestamp > 1) {
      const rawHistory = Array.isArray(data.history) ? data.history : [];
      const latestMsgTime = Math.max(
        Number(data.updatedAt || data.createdAt || 0),
        ...(rawHistory.map((m: any) => Number(m?.createdAt || m?.createdAtMs || 0)))
      );

      if (latestMsgTime > deletedTimestamp + 500) {
        deletedThreadsMap.delete(threadId);
        if (partnerKey) deletedThreadsMap.delete(partnerKey);
        if (senderId) deletedThreadsMap.delete(senderId);
        if (recipientId) deletedThreadsMap.delete(recipientId);
        if (senderEmail) deletedThreadsMap.delete(senderEmail);
        if (recipientEmail) deletedThreadsMap.delete(recipientEmail);
        if (senderName) deletedThreadsMap.delete(senderName);
        if (recipientName) deletedThreadsMap.delete(recipientName);
        deletedThreadsModified = true;
      } else {
        continue;
      }
    }

    const participants: string[] = Array.isArray(data.participants)
      ? data.participants.map((p: string) => (p || "").toLowerCase().trim().replace(/^@/, ""))
      : [];

    // Known Personas Matching (Steven Akan / Ben Blue / Biz Riv / Yoouz)
    const isStevenAkan =
      userEmail.includes("avr6566gd") ||
      userName.includes("steven") ||
      userHandle.includes("steven") ||
      userFirstName === "steven" ||
      userName === "avt ertuop" ||
      userHandle === "avtertuop" ||
      userId.includes("avr6566gd") ||
      userName.includes("avt") ||
      userHandle.includes("avt") ||
      userId.includes("avt");

    const isBenBlue =
      userEmail.includes("aouisesmee") ||
      userEmail.includes("aouisemee") ||
      userEmail.includes("aouisesme") ||
      userEmail.includes("aouiseme") ||
      userName.includes("ben") ||
      userHandle.includes("ben") ||
      userFirstName === "ben" ||
      userName.includes("aouisesmee") ||
      userHandle.includes("aouisesmee") ||
      userId.includes("aouisesmee");

    const isBizRiv =
      userEmail.includes("louis42111") ||
      userName === "biz riv" ||
      userHandle === "bizriv" ||
      userFirstName === "biz" ||
      userId.includes("louis42111") ||
      userEmail.includes("biz") ||
      userName.includes("biz");

    let isParticipant = false;

    const bizPlaceId = (((currentUser as any).placeId || userId || "") as string).toLowerCase().trim();
    const bizDomain = (bizPlaceId.includes(".") ? bizPlaceId : "").toLowerCase().trim();
    const bizNameLower = (userName || "").toLowerCase().trim();
    const bizSlug = bizNameLower.replace(/[^a-z0-9]/g, "");
    const isYoouzBiz = bizPlaceId === "yoouz.com" || bizPlaceId === "yoouz" || bizNameLower === "yoouz" || bizDomain === "yoouz.com";

    if (isBusinessUser) {
      // For Business Profiles: Include threads where this specific business entity is an explicit participant, recipient, or place
      const threadIdStr = String(data.id || "").toLowerCase();
      const pIdStr = String((data as any).placeId || "").toLowerCase();
      const recName = (data.recipientName || "").toLowerCase().trim();
      const senName = (data.senderName || "").toLowerCase().trim();
      const recId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");
      const senId = (data.senderId || "").toLowerCase().trim().replace(/^@/, "");
      const recEmail = (data.recipientEmail || "").toLowerCase().trim();
      const senEmail = (data.senderEmail || "").toLowerCase().trim();

      const bizMatch =
        (bizPlaceId && (
          participants.some(p => p.includes(bizPlaceId) || bizPlaceId.includes(p)) ||
          senderId === bizPlaceId || recipientId === bizPlaceId ||
          senId === bizPlaceId || recId === bizPlaceId ||
          pIdStr === bizPlaceId ||
          threadIdStr.includes(bizPlaceId)
        )) ||
        (bizDomain && (
          participants.some(p => p.includes(bizDomain) || bizDomain.includes(p)) ||
          senEmail.includes(bizDomain) || recEmail.includes(bizDomain) ||
          threadIdStr.includes(bizDomain)
        )) ||
        (userEmail && (
          participants.some(p => p.includes(userEmail)) ||
          senderEmail === userEmail || recipientEmail === userEmail ||
          senEmail === userEmail || recEmail === userEmail
        )) ||
        (userHandle && userHandle.length > 2 && (
          participants.some(p => p.includes(userHandle)) ||
          senderId === userHandle || recipientId === userHandle ||
          senId === userHandle || recId === userHandle
        )) ||
        (bizNameLower && bizNameLower !== "business manager" && (
          recName === bizNameLower || senName === bizNameLower ||
          participants.includes(bizNameLower)
        )) ||
        (bizSlug && bizSlug.length > 2 && (
          recName.replace(/[^a-z0-9]/g, "") === bizSlug ||
          senName.replace(/[^a-z0-9]/g, "") === bizSlug ||
          threadIdStr.includes(bizSlug)
        )) ||
        (isYoouzBiz && (
          participants.some(p => p.includes("yoouz") || p.includes("info@yoouz.com")) ||
          recName.includes("yoouz") || senName.includes("yoouz") ||
          recId.includes("yoouz") || senId.includes("yoouz") ||
          recEmail.includes("yoouz") || senEmail.includes("yoouz") ||
          threadIdStr.includes("yoouz")
        ));

      if (!bizMatch) {
        continue;
      }
      isParticipant = true;
    } else {
      const isGenericName = !userName || userName === "reviewer" || userName === "user" || userName === "local guide" || userName === "guest";

      const matchesStevenAkan = isStevenAkan && (
        participants.some(p => p.includes("avr6566gd") || p.includes("steven") || p === "avt ertuop" || p === "avtertuop" || p.includes("avt")) ||
        senderEmail.includes("avr6566gd") || senderEmail.includes("avt") || recipientEmail.includes("avr6566gd") || recipientEmail.includes("avt") ||
        senderName.includes("steven") || recipientName.includes("steven") || senderName.includes("avt") || recipientName.includes("avt") ||
        senderId.includes("steven") || recipientId.includes("steven") || senderId.includes("avr6566gd") || recipientId.includes("avr6566gd")
      );

      const matchesBenBlue = isBenBlue && (
        participants.some(p => p.includes("aouisesmee") || p.includes("aouisemee") || p.includes("ben")) ||
        senderEmail.includes("aouisesmee") || senderEmail.includes("aouisemee") || recipientEmail.includes("aouisesmee") || recipientEmail.includes("aouisemee") ||
        senderName.includes("ben") || recipientName.includes("ben") ||
        senderId.includes("ben") || recipientId.includes("ben") || senderId.includes("aouisesmee") || recipientId.includes("aouisesmee")
      );

      const matchesBizRiv = isBizRiv && (
        participants.some(p => p.includes("louis42111") || p === "biz riv" || p === "bizriv" || p.includes("biz")) ||
        senderEmail.includes("louis42111") || senderEmail.includes("biz") || recipientEmail.includes("louis42111") || recipientEmail.includes("biz") ||
        senderName.includes("biz") || recipientName.includes("biz") || senderId.includes("biz") || recipientId.includes("biz")
      );

      const historyHasUser = Array.isArray(data.history) && data.history.some((m: any) => {
        if (!m) return false;
        const mSE = (m.senderEmail || "").toLowerCase().trim();
        const mSI = (m.senderId || "").toLowerCase().trim().replace(/^@/, "");
        const mSN = (m.senderName || "").toLowerCase().trim();
        return (
          (userEmail && (mSE === userEmail || mSI === userEmail || mSE.includes(userEmail))) ||
          (emailPrefix && emailPrefix.length >= 3 && (mSE.startsWith(emailPrefix) || mSI === emailPrefix)) ||
          (userHandle && userHandle.length >= 3 && (mSI === userHandle || mSN === userHandle)) ||
          (!isGenericName && (mSN === userName || (userFirstName.length >= 3 && mSN.includes(userFirstName)))) ||
          (userId && (mSI === userId || mSE === userId)) ||
          (isBenBlue && (mSE.includes("aouisesmee") || mSE.includes("aouisemee") || mSN.includes("ben") || mSI.includes("ben"))) ||
          (isStevenAkan && (mSE.includes("avr6566gd") || mSN.includes("steven") || mSN.includes("avt") || mSI.includes("steven") || mSI.includes("avt"))) ||
          (isBizRiv && (mSE.includes("louis42111") || mSN.includes("biz") || mSI.includes("biz")))
        );
      });

      const threadIdStr = String(data.id || "").toLowerCase();
      const threadIdMatchesUser = Boolean(
        (userEmail && threadIdStr.includes(userEmail)) ||
        (emailPrefix && emailPrefix.length >= 3 && threadIdStr.includes(emailPrefix)) ||
        (userHandle && userHandle.length >= 3 && threadIdStr.includes(userHandle)) ||
        (isBenBlue && (threadIdStr.includes("aouisesmee") || threadIdStr.includes("ben"))) ||
        (isStevenAkan && (threadIdStr.includes("avr6566gd") || threadIdStr.includes("steven") || threadIdStr.includes("avt"))) ||
        (isBizRiv && (threadIdStr.includes("louis42111") || threadIdStr.includes("biz")))
      );

      const first3 = userFirstName.length >= 3 ? userFirstName : "";

      isParticipant = Boolean(
        matchesStevenAkan ||
        matchesBenBlue ||
        matchesBizRiv ||
        historyHasUser ||
        threadIdMatchesUser ||
        (userEmail && (participants.some(p => p.includes(userEmail)) || senderEmail === userEmail || recipientEmail === userEmail || senderId === userEmail || recipientId === userEmail)) ||
        (emailPrefix && emailPrefix.length >= 3 && (participants.some(p => p.includes(emailPrefix)) || senderId === emailPrefix || recipientId === emailPrefix || senderEmail.startsWith(emailPrefix) || recipientEmail.startsWith(emailPrefix))) ||
        (userHandle && userHandle.length >= 3 && (participants.some(p => p.includes(userHandle)) || senderId === userHandle || recipientId === userHandle)) ||
        (!isGenericName && (participants.includes(userName) || senderName === userName || recipientName === userName)) ||
        (first3 && (participants.some(p => p.includes(first3)) || senderName.includes(first3) || recipientName.includes(first3))) ||
        (userId && (participants.some(p => p.includes(userId)) || senderId === userId || recipientId === userId))
      );
    }

    if (isParticipant) {
      const isGenericName = !userName || userName === "reviewer" || userName === "user" || userName === "local guide" || userName === "guest";

      // Determine whether the current user is the sender, recipient, or participant
      const isSenderMe = Boolean(
        (userEmail && (senderEmail === userEmail || senderId === userEmail)) ||
        (emailPrefix && emailPrefix.length >= 3 && (senderEmail.startsWith(emailPrefix) || senderId === emailPrefix)) ||
        (userHandle && userHandle.length >= 3 && (senderId === userHandle || senderName === userHandle)) ||
        (!isGenericName && userName && (senderName === userName || (userFirstName.length >= 3 && senderName.includes(userFirstName)))) ||
        (userId && (senderId === userId || senderEmail === userId)) ||
        (isBenBlue && (senderEmail.includes("aouisesmee") || senderEmail.includes("aouisemee") || senderName.includes("ben") || senderId.includes("ben"))) ||
        (isStevenAkan && (senderEmail.includes("avr6566gd") || senderName.includes("steven") || senderName.includes("avt") || senderId.includes("steven") || senderId.includes("avt"))) ||
        (isBizRiv && (senderEmail.includes("louis42111") || senderName.includes("biz") || senderId.includes("biz")))
      );

      const isRecipientMe = Boolean(
        (userEmail && (recipientEmail === userEmail || recipientId === userEmail)) ||
        (emailPrefix && emailPrefix.length >= 3 && (recipientEmail.startsWith(emailPrefix) || recipientId === emailPrefix)) ||
        (userHandle && userHandle.length >= 3 && (recipientId === userHandle || recipientName === userHandle)) ||
        (!isGenericName && userName && (recipientName === userName || (userFirstName.length >= 3 && recipientName.includes(userFirstName)))) ||
        (userId && (recipientId === userId || recipientEmail === userId)) ||
        (isBenBlue && (recipientEmail.includes("aouisesmee") || recipientEmail.includes("aouisemee") || recipientName.includes("ben") || recipientId.includes("ben"))) ||
        (isStevenAkan && (recipientEmail.includes("avr6566gd") || recipientName.includes("steven") || recipientName.includes("avt") || recipientId.includes("steven") || recipientId.includes("avt"))) ||
        (isBizRiv && (recipientEmail.includes("louis42111") || recipientName.includes("biz") || recipientId.includes("biz")))
      );

      let otherName = "";
      let otherId = "";
      let otherAvatar = "";
      let otherEmail = "";

      // 1. If participantProfiles is provided, find the partner who is NOT me
      if (data.participantProfiles && typeof data.participantProfiles === "object") {
        const otherKey = Object.keys(data.participantProfiles).find((k) => {
          const normK = k.toLowerCase().replace(/^@/, "").trim();
          const isKeyMe = (
            normK === userEmail ||
            normK === emailPrefix ||
            normK === userHandle ||
            normK === userName ||
            normK === userId ||
            (isBusinessUser && (
              normK === bizPlaceId ||
              normK === bizDomain ||
              (isYoouzBiz && (normK === "info@yoouz.com" || normK === "yoouz.com" || normK === "yoouz"))
            )) ||
            (isBenBlue && (normK.includes("aouisesmee") || normK.includes("ben"))) ||
            (isStevenAkan && (normK.includes("avr6566gd") || normK.includes("steven") || normK.includes("avt"))) ||
            (isBizRiv && (normK.includes("louis42111") || normK.includes("biz")))
          );
          return !isKeyMe;
        });
        if (otherKey && data.participantProfiles[otherKey]) {
          const otherProfile = data.participantProfiles[otherKey];
          otherName = otherProfile.name || otherName;
          otherAvatar = otherProfile.avatar || otherAvatar;
          otherId = otherKey;
          otherEmail = otherProfile.email || otherEmail;
        }
      }

      // 2. If not resolved from participantProfiles, use sender/recipient mapping
      if (!otherName) {
        if (isSenderMe && !isRecipientMe && data.recipientName) {
          otherName = data.recipientName;
          otherAvatar = data.recipientAvatar || otherAvatar;
          otherId = data.recipientId || data.recipientEmail || otherId;
          otherEmail = data.recipientEmail || otherEmail;
        } else if (isRecipientMe && !isSenderMe && data.senderName) {
          otherName = data.senderName;
          otherAvatar = data.senderAvatar || otherAvatar;
          otherId = data.senderId || data.senderEmail || otherId;
          otherEmail = data.senderEmail || otherEmail;
        }
      }

      // 3. If otherName is still matching current user or empty, inspect chat history
      const normOther = (otherName || "").toLowerCase().trim();
      const isOtherActuallyMe = (
        !normOther ||
        (userEmail && normOther === userEmail) ||
        (userName && normOther === userName) ||
        (userHandle && normOther === userHandle) ||
        (isBenBlue && (normOther.includes("ben") || normOther.includes("aouisesmee"))) ||
        (isStevenAkan && (normOther.includes("steven") || normOther.includes("avt") || normOther.includes("avr6566gd"))) ||
        (isBizRiv && (normOther.includes("biz") || normOther.includes("louis42111")))
      );

      if (isOtherActuallyMe) {
        const rawHistoryList = Array.isArray(data.history) ? data.history : [];
        const nonMeHistoryMsg = rawHistoryList.slice().reverse().find((h: any) => {
          if (!h) return false;
          const hName = (h.senderName || "").toLowerCase().trim();
          const hEmail = (h.senderEmail || "").toLowerCase().trim();
          const hId = (((h as any).senderId || "") as string).toLowerCase().trim().replace(/^@/, "");
          if (h.isMe) return false;
          if (userEmail && (hEmail === userEmail || hId === userEmail)) return false;
          if (userName && userName !== "user" && userName !== "member" && hName === userName) return false;
          if (userId && (hId === userId || hEmail === userId)) return false;
          if (userHandle && (hId === userHandle || hName === userHandle)) return false;
          return Boolean(hName || hEmail || hId);
        });

        if (nonMeHistoryMsg) {
          otherName = nonMeHistoryMsg.senderName || otherName;
          otherAvatar = nonMeHistoryMsg.senderAvatar || otherAvatar;
          otherId = nonMeHistoryMsg.senderId || nonMeHistoryMsg.senderEmail || otherId;
          otherEmail = nonMeHistoryMsg.senderEmail || otherEmail;
        } else if (!isBusinessUser && (data.placeName || data.placeId || data.isBusiness)) {
          // If viewer is a regular user and thread is with a business
          otherName = data.placeName || data.recipientName || "Business";
          otherAvatar = data.recipientAvatar || otherAvatar;
          otherId = data.placeId || data.recipientId || "business";
          otherEmail = data.recipientEmail || otherEmail;
        } else {
          // Check recipient/sender fields that do not match the current user
          const rName = (data.recipientName || "").trim();
          const rEmail = (data.recipientEmail || "").toLowerCase().trim();
          const rId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");
          const isRMe = (userEmail && (rEmail === userEmail || rId === userEmail)) || (userName && rName.toLowerCase() === userName) || (userId && rId === userId);

          const sName = (data.senderName || "").trim();
          const sEmail = (data.senderEmail || "").toLowerCase().trim();
          const sId = (data.senderId || "").toLowerCase().trim().replace(/^@/, "");
          const isSMe = (userEmail && (sEmail === userEmail || sId === userEmail)) || (userName && sName.toLowerCase() === userName) || (userId && sId === userId);

          if (rName && !isRMe) {
            otherName = rName;
            otherAvatar = data.recipientAvatar || otherAvatar;
            otherId = rId || rEmail || otherId;
            otherEmail = rEmail || otherEmail;
          } else if (sName && !isSMe) {
            otherName = sName;
            otherAvatar = data.senderAvatar || otherAvatar;
            otherId = sId || sEmail || otherId;
            otherEmail = sEmail || otherEmail;
          } else {
            // Check participants array for any other participant
            const otherP = participants.find((p: string) => {
              const pl = (p || "").toLowerCase().trim();
              return pl && pl !== userEmail && pl !== userId && pl !== userName && pl !== userHandle && !pl.includes("test");
            });
            if (otherP) {
              otherName = otherP.includes("@") ? otherP.split("@")[0] : otherP;
              otherId = otherP;
              otherEmail = otherP.includes("@") ? otherP : "";
            } else {
              otherName = data.senderName || data.recipientName || "Member";
              otherAvatar = data.senderAvatar || data.recipientAvatar || generateGoogleLetterAvatarSvg(otherName, 128, otherName);
              otherId = data.senderId || data.recipientId || String(data.id);
            }
          }
        }
      }

      if (!otherAvatar) {
        otherAvatar = generateGoogleLetterAvatarSvg(otherName, 128, otherId || otherName);
      }
      if (!otherId) {
        otherId = String(data.id);
      }

      let unreadCount = 0;
      if (data.unreadCounts && typeof data.unreadCounts === "object") {
        unreadCount =
          data.unreadCounts[userEmail] ??
          data.unreadCounts[emailPrefix] ??
          data.unreadCounts[userHandle] ??
          data.unreadCounts[userName] ??
          data.unreadCounts[userId] ??
          (isBusinessUser ? (data.unreadCounts[bizPlaceId] ?? (bizDomain ? data.unreadCounts[bizDomain] : undefined) ?? (isYoouzBiz ? (data.unreadCounts["info@yoouz.com"] ?? data.unreadCounts["yoouz.com"] ?? data.unreadCounts["yoouz"]) : undefined)) : undefined) ??
          (isStevenAkan ? (data.unreadCounts["avr6566gd@gmail.com"] ?? data.unreadCounts["avr6566gd"] ?? data.unreadCounts["steven akan"] ?? data.unreadCounts["stevenakan"] ?? data.unreadCounts["steven"] ?? data.unreadCounts["avt ertuop"] ?? data.unreadCounts["avtertuop"] ?? data.unreadCounts["avt"]) : undefined) ??
          (isBenBlue ? (data.unreadCounts["aouisesmee@gmail.com"] ?? data.unreadCounts["aouisemee@gmail.com"] ?? data.unreadCounts["ben blue"] ?? data.unreadCounts["benblue"] ?? data.unreadCounts["ben"] ?? data.unreadCounts["aouisesmee"] ?? data.unreadCounts["aouisemee"]) : undefined) ??
          (isBizRiv ? (data.unreadCounts["louis42111@gmail.com"] ?? data.unreadCounts["louis42111"] ?? data.unreadCounts["biz riv"] ?? data.unreadCounts["bizriv"]) : undefined) ??
          0;
      } else if (data.lastSenderEmail && data.lastSenderEmail.toLowerCase() !== userEmail) {
        unreadCount = typeof data.unreadCount === "number" ? data.unreadCount : 1;
      }

      // If the last message was sent by ME, force unreadCount to 0
      const rawHistForUnread = Array.isArray(data.history) ? data.history : [];
      const lastHistMsg = rawHistForUnread.length > 0 ? rawHistForUnread[rawHistForUnread.length - 1] : null;
      if (lastHistMsg) {
        const lastMsgSenderName = (lastHistMsg.senderName || "").toLowerCase().trim();
        const lastMsgSenderEmail = (lastHistMsg.senderEmail || "").toLowerCase().trim();
        const lastMsgSenderId = (((lastHistMsg as any).senderId || "") as string).toLowerCase().trim().replace(/^@/, "");
        const isLastFromMe = Boolean(
          lastHistMsg.isMe ||
          (userEmail && (lastMsgSenderEmail === userEmail || lastMsgSenderId === userEmail)) ||
          (userName && lastMsgSenderName === userName) ||
          (isBenBlue && (lastMsgSenderName.includes("ben") || lastMsgSenderEmail.includes("aouisesmee") || lastMsgSenderEmail.includes("aouisemee") || lastMsgSenderId.includes("ben"))) ||
          (isStevenAkan && (lastMsgSenderName.includes("steven") || lastMsgSenderName.includes("avt") || lastMsgSenderEmail.includes("avr6566gd") || lastMsgSenderId.includes("steven"))) ||
          (isBizRiv && (lastMsgSenderName.includes("biz") || lastMsgSenderEmail.includes("louis42111")))
        );
        if (isLastFromMe) {
          unreadCount = 0;
        }
      }

      // Check local read timestamp persistence so unread count never comes back on page refresh
      const readTimestamp = Math.max(
        getReadThreadTimestamp(threadId, currentUser),
        partnerKey ? getReadThreadTimestamp(partnerKey, currentUser) : 0
      );
      if (readTimestamp > 0) {
        const latestMsgTime = Math.max(
          Number(data.updatedAt || data.createdAt || data.createdAtMs || 0),
          ...(rawHistForUnread.map((m: any) => Number(m?.createdAt || m?.createdAtMs || 0)))
        );
        if (latestMsgTime <= readTimestamp + 5000) {
          unreadCount = 0;
        }
      }

      const rawHistory = Array.isArray(data.history) ? data.history : [];
      const processedHistory = rawHistory
        .map((m: any) => {
          const msgSenderEmail = (m.senderEmail || "").toLowerCase().trim();
          const msgSenderId = (m.senderId || "").toLowerCase().trim().replace(/^@/, "");
          const msgSenderName = (m.senderName || "").toLowerCase().trim();

          const isSender =
            (userEmail && (msgSenderEmail === userEmail || msgSenderId === userEmail)) ||
            (emailPrefix && (msgSenderEmail.startsWith(emailPrefix) || msgSenderId === emailPrefix)) ||
            (userHandle && (msgSenderId === userHandle || msgSenderName === userHandle)) ||
            (userName && msgSenderName === userName) ||
            (userId && msgSenderId === userId) ||
            (isBusinessUser && (
              (bizPlaceId && (msgSenderId === bizPlaceId || msgSenderEmail === bizPlaceId)) ||
              (isYoouzBiz && (msgSenderEmail.includes("yoouz") || msgSenderName === "yoouz" || msgSenderId === "yoouz" || msgSenderId === "yoouz.com"))
            )) ||
            (isBenBlue && (msgSenderEmail.includes("aouisesmee") || msgSenderEmail.includes("aouisemee") || msgSenderName.includes("ben") || msgSenderId.includes("ben"))) ||
            (isStevenAkan && (msgSenderEmail.includes("avr6566gd") || msgSenderName.includes("steven") || msgSenderName.includes("avt") || msgSenderId.includes("steven") || msgSenderId.includes("avt"))) ||
            (isBizRiv && (msgSenderEmail.includes("louis42111") || msgSenderName.includes("biz") || msgSenderId.includes("biz")));

          let finalSenderName = m.senderName || "Member";
          let finalSenderAvatar = m.senderAvatar;
          let finalSenderEmail = m.senderEmail || msgSenderEmail;
          let finalSenderId = m.senderId || msgSenderId;

          if (!isSender) {
            if (finalSenderName === "You" || !finalSenderName) {
              finalSenderName = otherName || "Member";
            }
            if (!finalSenderAvatar) {
              finalSenderAvatar = otherAvatar || generateGoogleLetterAvatarSvg(finalSenderName, 128, finalSenderId || finalSenderEmail || finalSenderName);
            }
          } else {
            if (finalSenderName === "You" && currentUser.name) {
              finalSenderName = currentUser.name;
            }
            if (!finalSenderAvatar && currentUser.avatar) {
              finalSenderAvatar = currentUser.avatar;
            }
          }

          const itemMs = resolveMessageTimestampMs(m, m.createdAtMs || m.createdAt || m.created_at);
          const finalItemMs = itemMs > 0 ? itemMs : (parseTimestampToMs(m.id) || parseTimestampToMs(data.updatedAt) || parseTimestampToMs(data.createdAt) || Date.now());

          return {
            id: m.id || `msg_${finalItemMs}_${Math.random().toString(36).substring(2, 6)}`,
            senderName: finalSenderName,
            senderAvatar: finalSenderAvatar || generateGoogleLetterAvatarSvg(finalSenderName, 128, finalSenderId || finalSenderEmail || finalSenderName),
            senderEmail: finalSenderEmail,
            senderId: finalSenderId,
            text: m.text || "",
            timestamp: new Date(finalItemMs).toISOString(),
            createdAt: finalItemMs,
            createdAtMs: finalItemMs,
            resolvedTime: finalItemMs,
            isMe: Boolean(isSender),
            videoThumbnail: m.videoThumbnail,
            videoId: m.videoId,
            placeId: m.placeId,
            placeName: m.placeName,
            placeAddress: m.placeAddress,
            placeCategory: m.placeCategory,
            placeRating: m.placeRating,
            placeImage: m.placeImage
          };
        })
        .filter((m: any) => {
          const t = (m.text || "").trim();
          if (t === "Conversation started" || t === "Direct conversation") return false;
          return Boolean(t || m.videoThumbnail || m.videoId || m.placeId || m.placeName);
        });

      // If the current user was the sender of the most recent message, this thread is read for them
      const lastProcessedMsg = processedHistory.length > 0 ? processedHistory[processedHistory.length - 1] : null;
      if (lastProcessedMsg) {
        const msgSenderEmail = (lastProcessedMsg.senderEmail || '').toLowerCase().trim();
        const msgSenderName = (lastProcessedMsg.senderName || '').toLowerCase().trim();
        const msgSenderId = (lastProcessedMsg.senderId || '').toLowerCase().trim();
        const isMyLastMsg = lastProcessedMsg.isMe ||
                            (userEmail && (msgSenderEmail === userEmail || msgSenderId === userEmail)) ||
                            (userName && msgSenderName === userName) ||
                            (userId && msgSenderId === userId);
        if (isMyLastMsg) {
          unreadCount = 0;
        }
      }

      const cleanRawLastMsg = (data.lastMessage && data.lastMessage !== "Conversation started" && data.lastMessage !== "Direct conversation") ? data.lastMessage.trim() : "";
      const lastMsg = (processedHistory[processedHistory.length - 1]?.text) || cleanRawLastMsg || "";

      const threadMs = resolveMessageTimestampMs(lastProcessedMsg) || resolveMessageTimestampMs(data, data.updatedAt || data.createdAt) || Date.now();

      threads.push({
        id: String(data.id),
        senderId: otherId,
        senderName: otherName,
        senderAvatar: otherAvatar,
        senderEmail: data.senderEmail,
        recipientEmail: data.recipientEmail,
        lastMessage: lastMsg,
        timestamp: new Date(threadMs).toISOString(),
        createdAtMs: threadMs,
        updatedAt: threadMs,
        unreadCount: Number(unreadCount) || 0,
        unreadCounts: data.unreadCounts || {},
        readReceipts: data.readReceipts || {},
        videoPreviewUrl: data.videoPreviewUrl,
        history: processedHistory
      });
    }
  }

  if (deletedThreadsModified) {
    saveDeletedThreadsMap(deletedThreadsMap, currentUser);
  }

  return deduplicateChatThreads(threads, currentUser);
}

/**
 * Returns a normalized canonical partner key for chat thread deduplication.
 */
export function getThreadPartnerKey(thread: any, currentUserOverride?: UserProfile | null): string {
  if (!thread) return "";

  const user = currentUserOverride || activeCurrentUser;
  const userEmail = (user?.email || "").toLowerCase().trim();
  const userName = (user?.name || "").toLowerCase().trim();
  const userHandle = (user?.handle || user?.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userId = (user?.userId || (user as any)?.id || "").toLowerCase().trim();
  const isUserBusiness = Boolean((user as any)?.isBusiness || (user as any)?.placeId || userId.startsWith("place_"));
  const userPlaceId = (((user as any)?.placeId || userId || "") as string).toLowerCase().trim();
  const userDomain = (userPlaceId.includes(".") ? userPlaceId : "").toLowerCase().trim();
  const isUserYoouz = userPlaceId === "yoouz.com" || userPlaceId === "yoouz" || userName === "yoouz" || userEmail.includes("info@yoouz.com") || userEmail.endsWith("@yoouz.com");

  const sName = (thread.senderName || "").toLowerCase().trim();
  const sId = (thread.senderId || "").toLowerCase().trim().replace(/^@/, "");
  const sEmail = (thread.senderEmail || "").toLowerCase().trim();

  const rName = (thread.recipientName || "").toLowerCase().trim();
  const rId = (thread.recipientId || "").toLowerCase().trim().replace(/^@/, "");
  const rEmail = (thread.recipientEmail || "").toLowerCase().trim();

  // Helper to check if a side matches currentUser
  const isMe = (name?: string, email?: string, id?: string) => {
    if (!user) return false;
    const cleanE = (email || "").toLowerCase().trim();
    const cleanId = (id || "").toLowerCase().trim().replace(/^@/, "");
    const cleanN = (name || "").toLowerCase().trim();

    if (userEmail && (cleanE === userEmail || cleanId === userEmail)) return true;
    if (userId && (cleanId === userId || cleanE === userId)) return true;
    if (userHandle && userHandle.length >= 3 && (cleanId === userHandle || cleanN === userHandle)) return true;
    if (userName && userName !== "user" && userName !== "member" && userName !== "reviewer" && cleanN === userName) return true;

    if (isUserBusiness) {
      if (userPlaceId && (cleanId === userPlaceId || cleanE === userPlaceId)) return true;
      if (userDomain && (cleanId === userDomain || cleanE.includes(userDomain))) return true;
      if (isUserYoouz && (cleanN === "yoouz" || cleanId === "yoouz" || cleanId === "yoouz.com" || cleanE.includes("info@yoouz.com"))) return true;
    }

    const myCluster = getCanonicalUserKey({ email: userEmail, name: userName, handle: userHandle, id: userId });
    const theirCluster = getCanonicalUserKey({ email: cleanE, name: cleanN, handle: cleanId, id: cleanId });
    if (myCluster && theirCluster && myCluster === theirCluster) return true;

    return false;
  };

  const isSenderMe = isMe(sName, sEmail, sId);
  const isRecipientMe = isMe(rName, rEmail, rId);

  // If sender is ME, the conversation partner is the RECIPIENT
  if (isSenderMe && !isRecipientMe) {
    const isTargetBiz = Boolean(thread.isBusiness || thread.placeId || rId.includes(".") || rId.startsWith("place-") || rId === "yoouz" || rId === "yoouz.com" || rName === "yoouz");
    if (isTargetBiz) {
      const bizId = thread.placeId || (rId.includes(".") ? rId : (rId === "yoouz" || rName === "yoouz" ? "yoouz.com" : rId)) || "biz";
      return `biz_${bizId}`.toLowerCase().replace(/[^a-z0-9_.]/g, "_");
    }
    const rKey = getCanonicalUserKey({ email: rEmail, name: rName, handle: rId, id: rId });
    return rKey || (rEmail || rId || rName || "partner").replace(/[^a-z0-9]/g, "_");
  }

  // If recipient is ME (e.g. business receiving a customer message), the partner is the SENDER
  if (isRecipientMe && !isSenderMe) {
    const isSenderBiz = Boolean(thread.isBusiness || thread.placeId || sId.includes(".") || sId.startsWith("place-") || sId === "yoouz" || sId === "yoouz.com" || sName === "yoouz");
    if (isSenderBiz) {
      const bizId = thread.placeId || (sId.includes(".") ? sId : (sId === "yoouz" || sName === "yoouz" ? "yoouz.com" : sId)) || "biz";
      return `biz_${bizId}`.toLowerCase().replace(/[^a-z0-9_.]/g, "_");
    }
    const sKey = getCanonicalUserKey({ email: sEmail, name: sName, handle: sId, id: sId });
    return sKey || (sEmail || sId || sName || "partner").replace(/[^a-z0-9]/g, "_");
  }

  // General fallback: return unique canonical pair key so distinct users never merge into one another
  const sKey = getCanonicalUserKey({ email: sEmail, name: sName, handle: sId, id: sId }) || sEmail || sId || sName || "user1";
  const rKey = getCanonicalUserKey({ email: rEmail, name: rName, handle: rId, id: rId }) || rEmail || rId || rName || "user2";
  const pair = [sKey, rKey].sort();
  return `pair_${pair[0]}_${pair[1]}`.replace(/[^a-z0-9_]/g, "_");
}

/**
 * Deduplicates and merges multiple thread objects pointing to the same conversation partner.
 */
export function deduplicateChatThreads(threads: CopoMessage[], currentUserOverride?: UserProfile | null): CopoMessage[] {
  if (!Array.isArray(threads)) return [];
  const result: CopoMessage[] = [];
  const partnerIndexMap = new Map<string, number>();

  for (const raw of threads) {
    if (!raw) continue;
    const partnerKey = getThreadPartnerKey(raw, currentUserOverride);
    let existingIdx = partnerKey ? partnerIndexMap.get(partnerKey) : undefined;

    if (existingIdx === undefined) {
      const rawSenderName = (raw.senderName || "").toLowerCase().trim();
      const rawSenderEmail = (raw.senderEmail || "").toLowerCase().trim();
      const rawSenderId = (raw.senderId || "").toLowerCase().trim();
      const rawCanonicalKey = getCanonicalUserKey({ email: rawSenderEmail, name: rawSenderName, handle: rawSenderId, id: rawSenderId });

      const matchedIdx = result.findIndex((res) => {
        const resPartnerKey = getThreadPartnerKey(res, currentUserOverride);
        if (partnerKey && resPartnerKey && partnerKey === resPartnerKey) return true;
        if (raw.id && res.id && raw.id === res.id) return true;
        return false;
      });

      if (matchedIdx >= 0) {
        existingIdx = matchedIdx;
      }
    }

    const rawHist = Array.isArray(raw.history) ? raw.history : [];
    const cleanHist = deduplicateChatHistory(rawHist).filter((m: any) => {
      const t = (m.text || "").trim();
      if (t === "Conversation started" || t === "Direct conversation") return false;
      return Boolean(t || m.videoThumbnail || m.videoId);
    });

    const cleanRawMsg = (raw.lastMessage && raw.lastMessage !== "Conversation started" && raw.lastMessage !== "Direct conversation") ? raw.lastMessage.trim() : "";
    const lastHistText = cleanHist.length > 0 ? (cleanHist[cleanHist.length - 1]?.text || "").trim() : "";
    const effectiveLastMsg = lastHistText || cleanRawMsg;

    if (existingIdx !== undefined && existingIdx >= 0) {
      const existing = result[existingIdx];
      const mergedHist = deduplicateChatHistory([...(existing.history || []), ...cleanHist]);
      const mergedLastHistText = mergedHist.length > 0 ? (mergedHist[mergedHist.length - 1]?.text || "").trim() : "";
      const existingCleanMsg = (existing.lastMessage && existing.lastMessage !== "Conversation started" && existing.lastMessage !== "Direct conversation") ? existing.lastMessage.trim() : "";
      const finalLastMsg = mergedLastHistText || effectiveLastMsg || existingCleanMsg;

      const newestTime = Math.max(
        Number(existing.createdAtMs || (existing as any).updatedAt || 0),
        Number(raw.createdAtMs || (raw as any).updatedAt || 0),
        ...(mergedHist.map((m: any) => Number(m?.createdAt || m?.createdAtMs || 0)))
      );

      const lastMergedMsg = mergedHist.length > 0 ? mergedHist[mergedHist.length - 1] : null;
      let finalUnread = Math.max(existing.unreadCount || 0, raw.unreadCount || 0);
      if (lastMergedMsg) {
        const uEmail = (currentUserOverride?.email || "").toLowerCase().trim();
        const uName = (currentUserOverride?.name || "").toLowerCase().trim();
        const uId = (currentUserOverride?.userId || (currentUserOverride as any)?.id || "").toLowerCase().trim();
        const mEmail = (lastMergedMsg.senderEmail || "").toLowerCase().trim();
        const mName = (lastMergedMsg.senderName || "").toLowerCase().trim();
        const mId = (lastMergedMsg.senderId || "").toLowerCase().trim();
        if (lastMergedMsg.isMe || (uEmail && (mEmail === uEmail || mId === uEmail)) || (uName && mName === uName) || (uId && mId === uId)) {
          finalUnread = 0;
        }
      }

      // Check persistent read timestamp
      const readTimestamp = Math.max(
        getReadThreadTimestamp(raw.id || existing.id, currentUserOverride),
        partnerKey ? getReadThreadTimestamp(partnerKey, currentUserOverride) : 0
      );
      if (readTimestamp > 0 && newestTime <= readTimestamp + 5000) {
        finalUnread = 0;
      }

      result[existingIdx] = {
        ...existing,
        senderName: existing.senderName && !existing.senderName.startsWith("Member") ? existing.senderName : raw.senderName,
        senderAvatar: existing.senderAvatar || raw.senderAvatar,
        history: mergedHist,
        lastMessage: finalLastMsg,
        createdAtMs: newestTime || Date.now(),
        unreadCount: finalUnread,
        videoPreviewUrl: raw.videoPreviewUrl || existing.videoPreviewUrl,
        isBusiness: Boolean(existing.isBusiness || raw.isBusiness),
        placeId: existing.placeId || raw.placeId
      };
    } else {
      const lastCleanMsg = cleanHist.length > 0 ? cleanHist[cleanHist.length - 1] : null;
      let newUnread = Number(raw.unreadCount) || 0;
      if (lastCleanMsg) {
        const uEmail = (currentUserOverride?.email || "").toLowerCase().trim();
        const uName = (currentUserOverride?.name || "").toLowerCase().trim();
        const uId = (currentUserOverride?.userId || (currentUserOverride as any)?.id || "").toLowerCase().trim();
        const mEmail = (lastCleanMsg.senderEmail || "").toLowerCase().trim();
        const mName = (lastCleanMsg.senderName || "").toLowerCase().trim();
        const mId = (lastCleanMsg.senderId || "").toLowerCase().trim();
        if (lastCleanMsg.isMe || (uEmail && (mEmail === uEmail || mId === uEmail)) || (uName && mName === uName) || (uId && mId === uId)) {
          newUnread = 0;
        }
      }

      const readTimestamp = Math.max(
        getReadThreadTimestamp(raw.id, currentUserOverride),
        partnerKey ? getReadThreadTimestamp(partnerKey, currentUserOverride) : 0
      );
      const rawMsgTime = Math.max(
        Number(raw.createdAtMs || (raw as any).updatedAt || 0),
        ...(cleanHist.map((m: any) => Number(m?.createdAt || m?.createdAtMs || 0)))
      );
      if (readTimestamp > 0 && rawMsgTime <= readTimestamp + 5000) {
        newUnread = 0;
      }

      const newThread: CopoMessage = {
        ...raw,
        history: cleanHist,
        lastMessage: effectiveLastMsg,
        unreadCount: newUnread
      };
      if (partnerKey) {
        partnerIndexMap.set(partnerKey, result.length);
      }
      result.push(newThread);
    }
  }

  // Sort threads newest first
  result.sort((a, b) => {
    const timeA = Number(a.createdAtMs || (a as any).updatedAt || 0);
    const timeB = Number(b.createdAtMs || (b as any).updatedAt || 0);
    return timeB - timeA;
  });

  return result;
}

/**
 * Deduplicates chat message histories handling exact IDs and near-instantaneous optimistic duplicates
 */
export function deduplicateChatHistory(messages: any[]): any[] {
  if (!Array.isArray(messages)) return [];
  const result: any[] = [];
  const seenIds = new Set<string>();

  const sorted = [...messages].filter(Boolean).map((m: any) => {
    const t = resolveMessageTimestampMs(m, m.createdAtMs || m.createdAt);
    return {
      ...m,
      createdAtMs: t > 0 ? t : (m.createdAtMs || 0),
      createdAt: t > 0 ? t : (m.createdAt || 0)
    };
  }).sort((a, b) => {
    const tA = Number(a.createdAtMs || 0);
    const tB = Number(b.createdAtMs || 0);
    return tA - tB;
  });

  for (const m of sorted) {
    if (!m) continue;
    const mText = (m.text || "").trim();
    if (mText === "Conversation started" || mText === "Direct conversation") continue;
    if (!mText && !m.videoThumbnail && !m.videoId) continue;

    const msgId = String(m.id || "");
    if (msgId && seenIds.has(msgId)) continue;
    const mSender = (m.senderEmail || m.senderId || m.senderName || (m.isMe ? "me" : "")).toLowerCase().trim();
    const mTime = Number(m.createdAtMs || m.createdAt || 0);

    const duplicateIndex = result.findIndex((existing) => {
      const eText = (existing.text || "").trim();
      const eSender = (existing.senderEmail || existing.senderId || existing.senderName || (existing.isMe ? "me" : "")).toLowerCase().trim();
      const eTime = Number(existing.createdAtMs || existing.createdAt || 0);

      if (mText && eText && mText === eText) {
        const isSameSender = !mSender || !eSender || mSender === eSender || (m.isMe && existing.isMe);
        if (isSameSender) {
          if (mTime > 0 && eTime > 0 && Math.abs(mTime - eTime) < 15000) {
            return true;
          }
        }
      }
      return false;
    });

    if (duplicateIndex >= 0) {
      const existing = result[duplicateIndex];
      const isIncomingServer = msgId.startsWith("msg_");
      const isExistingTemp = String(existing.id || "").startsWith("user-msg-");

      if (isIncomingServer || isExistingTemp) {
        result[duplicateIndex] = { ...existing, ...m, id: isIncomingServer ? m.id : existing.id };
        if (msgId) seenIds.add(msgId);
      }
    } else {
      if (msgId) seenIds.add(msgId);
      result.push(m);
    }
  }

  return result;
}

/**
 * Real-time subscription to private chat threads for the current user
 * Instant SSE streaming + Bunny Cloud Database + Instant Local Cache
 */
export function subscribeToChats(
  currentUser: UserProfile | null,
  onUpdate: (threads: CopoMessage[]) => void
): () => void {
  if (!currentUser) {
    onUpdate([]);
    return () => {};
  }

  let isDisposed = false;
  let cachedThreads: CopoMessage[] = [];
  const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  const cacheKey = `copo_cached_chats_${userKey}`;

  const updateThreads = (newThreads: CopoMessage[]) => {
    if (isDisposed) return;
    const deduped = deduplicateChatThreads(newThreads, currentUser);
    cachedThreads = deduped;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(deduped));
    } catch (e) {}
    onUpdate(deduped);
  };

  // 0. Immediate load from LocalStorage cache so messages never disappear on refresh
  try {
    const deletedMap = getDeletedThreadsMap(currentUser);

    const rawCache = localStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filteredParsed = parsed.filter((t: any) => {
          if (!t) return false;
          const tId = String(t.id || "").trim();
          const pKey = getThreadPartnerKey(t, currentUser);
          const delTime = deletedMap.get(tId) ?? (pKey ? deletedMap.get(pKey) : undefined);
          if (delTime !== undefined) {
            const latestMsg = Math.max(
              Number(t.createdAtMs || t.updatedAt || 0),
              ...(Array.isArray(t.history) ? t.history.map((m: any) => Number(m?.createdAt || m?.createdAtMs || 0)) : [])
            );
            return latestMsg > delTime + 500;
          }
          return true;
        });
        const dedupedInitial = deduplicateChatThreads(filteredParsed, currentUser);
        cachedThreads = dedupedInitial;
        onUpdate(dedupedInitial);
      }
    }
  } catch (e) {}

  // 1. Initial immediate fetch from Bunny Cloud Database
  let isFetchingChats = false;
  const fetchFromBunny = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (isFetchingChats) return;
    isFetchingChats = true;
    try {
      const res = await fetch(`/api/nosql/chats?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || json.data || []);
        if (Array.isArray(items) && !isDisposed) {
          const processed = processChatThreadsForUser(items, currentUser);
          const serverPartnerKeys = new Set(processed.map((t) => getThreadPartnerKey(t, currentUser)));
          const serverThreadIds = new Set(processed.map((t) => t.id));
          const pendingThreads = cachedThreads.filter((t) => t && !serverThreadIds.has(t.id) && !serverPartnerKeys.has(getThreadPartnerKey(t, currentUser)));
          const merged = deduplicateChatThreads([...pendingThreads, ...processed], currentUser);
          updateThreads(merged);
        }
      }
    } catch (e) {
    } finally {
      isFetchingChats = false;
    }
  };
  fetchFromBunny();

  // 2. Real-Time Instant SSE Event Listener (<100ms response time)
  const unregisterSse = registerRealtimeListener(currentUser, (evt) => {
    if (evt.type === "chat_message") {
      const threadData = evt.data || evt.threadData;
      if (threadData) {
        const processed = processChatThreadsForUser([threadData], currentUser);
        if (processed.length > 0) {
          const freshThread = processed[0];
          const freshPartnerKey = getThreadPartnerKey(freshThread, currentUser);
          const existingIdx = cachedThreads.findIndex((t) => t.id === freshThread.id || (freshPartnerKey && getThreadPartnerKey(t, currentUser) === freshPartnerKey));
          let nextThreads: CopoMessage[];
          if (existingIdx >= 0) {
            const existingThread = cachedThreads[existingIdx];
            const mergedHist = deduplicateChatHistory([
              ...(existingThread.history || []),
              ...(freshThread.history || [])
            ]);
            const mergedThread: CopoMessage = {
              ...existingThread,
              ...freshThread,
              history: mergedHist,
              lastMessage: freshThread.lastMessage || (mergedHist[mergedHist.length - 1]?.text ?? existingThread.lastMessage)
            };
            nextThreads = [...cachedThreads];
            nextThreads[existingIdx] = mergedThread;
          } else {
            nextThreads = [freshThread, ...cachedThreads];
          }
          const dedupedNext = deduplicateChatThreads(nextThreads, currentUser);
          updateThreads(dedupedNext);
        }
      }
    } else if (evt.type === "chat_read") {
      const threadId = evt.threadId;
      const readAt = Number(evt.readAt) || Date.now();
      const readerEmail = (evt.readerEmail || '').toLowerCase().trim();
      const readerId = (evt.readerId || '').toLowerCase().trim();
      if (threadId) {
        const nextThreads = cachedThreads.map((t) => {
          if (t.id === threadId) {
            const currentReceipts = { ...(t.readReceipts || {}), ...(evt.readReceipts || {}) };
            if (readerEmail) currentReceipts[readerEmail] = readAt;
            if (readerId) currentReceipts[readerId] = readAt;
            return {
              ...t,
              readReceipts: currentReceipts,
              unreadCounts: { ...(t.unreadCounts || {}), ...(evt.unreadCounts || {}) }
            };
          }
          return t;
        });
        updateThreads(nextThreads);
      }
    }
  });

  // 3. Fallback background sync (every 12 seconds when visible & online)
  const pollTimer = setInterval(() => {
    if (document.visibilityState === "visible" && (typeof navigator === "undefined" || navigator.onLine)) {
      fetchFromBunny();
    }
  }, 12000);

  const handleOnlineRefreshChats = () => {
    if (document.visibilityState === "visible") {
      fetchFromBunny();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnlineRefreshChats);
    window.addEventListener("focus", handleOnlineRefreshChats);
    document.addEventListener("visibilitychange", handleOnlineRefreshChats);
  }

  return () => {
    isDisposed = true;
    clearInterval(pollTimer);
    unregisterSse();
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnlineRefreshChats);
      window.removeEventListener("focus", handleOnlineRefreshChats);
      document.removeEventListener("visibilitychange", handleOnlineRefreshChats);
    }
  };
}

/**
 * Send a message within a chat thread and persist to Bunny Database & SSE
 */
export async function sendChatMessage(
  threadId: string,
  messageText: string,
  currentUser: UserProfile,
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
): Promise<CopoMessage> {
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const userName = (currentUser.name || "").trim();
  const userHandle = (currentUser.name || "").replace(/^@/, "").trim().toLowerCase();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";

  let recipientEmail = (recipient.email || "").toLowerCase().trim();
  const recipientId = (recipient.id || "").trim().replace(/^@/, "");
  const recipientName = (recipient.name || "").trim();
  const recipientHandle = recipientId || recipientName.toLowerCase().replace(/\s+/g, "");

  // Auto-resolve known user canonical emails if not explicitly set
  if (!recipientEmail || !recipientEmail.includes("@")) {
    if (recipientId.includes("@")) {
      recipientEmail = recipientId.toLowerCase();
    } else if (recipientId === "yoouz.com" || recipientId === "yoouz" || recipientName.toLowerCase() === "yoouz") {
      recipientEmail = "info@yoouz.com";
    } else if (recipientName.toLowerCase() === "avt ertuop" || recipientId.includes("avtertuop") || recipientId.includes("avr6566gd")) {
      recipientEmail = "avr6566gd@gmail.com";
    } else if (recipientName.toLowerCase() === "biz riv" || recipientId.includes("bizriv") || recipientId.includes("louis42111")) {
      recipientEmail = "louis42111@gmail.com";
    } else if (recipientName.toLowerCase().includes("aouisesmee") || recipientId.includes("aouisesmee")) {
      recipientEmail = "aouisesmee@gmail.com";
    }
  }

  // Sanitize videoThumbnail
  let sanitizedThumbnail = (videoUrl || "").trim();
  const isVideoFile = sanitizedThumbnail.endsWith(".mp4") || sanitizedThumbnail.endsWith(".webm") || sanitizedThumbnail.includes("/api/videos/stream/");
  if (isVideoFile) {
    sanitizedThumbnail = currentUser.avatar || "";
  }

  const msgTime = customCreatedAt || Date.now();
  const msgId = customMessageId || `msg_${msgTime}_${Math.random().toString(36).substring(2, 6)}`;

  const curUserId = currentUser.userId || (currentUser as any).id || (currentUser as any).uid || "";
  const newMessage = {
    id: msgId,
    senderId: userEmail || curUserId || currentUser.name,
    senderEmail: userEmail,
    senderName: currentUser.name || "Reviewer",
    senderAvatar: currentUser.avatar || generateGoogleLetterAvatarSvg(currentUser.name || "User", 128, userEmail || currentUser.name || "User"),
    text: messageText.trim(),
    timestamp: new Date(msgTime).toISOString(),
    createdAt: msgTime,
    createdAtMs: msgTime,
    isMe: false,
    videoThumbnail: sanitizedThumbnail,
    videoId: customVideoId,
    placeId: cardData?.placeId,
    placeName: cardData?.placeName,
    placeAddress: cardData?.placeAddress,
    placeCategory: cardData?.placeCategory,
    placeRating: cardData?.placeRating,
    placeImage: cardData?.placeImage
  };

  let existingHistory: any[] = [];
  let prevRecipientUnread = 0;

  // 0. Try reading prior thread history from local cache first
  const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  const cacheKey = `copo_cached_chats_${userKey}`;
  try {
    const rawCache = localStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Array.isArray(parsed)) {
        const match = parsed.find((t: any) => t.id === threadId);
        if (match && Array.isArray(match.history) && match.history.length > 0) {
          existingHistory = match.history;
        }
      }
    }
  } catch (e) {}

  // 1. Try reading prior thread history from Bunny DB or bunnydb
  try {
    const res = await fetch(`/api/nosql/chats/${threadId}`);
    if (res.ok) {
      const d = await res.json();
      if (Array.isArray(d.history) && d.history.length > 0) {
        existingHistory = deduplicateChatHistory([...existingHistory, ...d.history]);
      }
      if (d.unreadCounts && typeof d.unreadCounts === "object") {
        prevRecipientUnread =
          d.unreadCounts[recipientEmail] ??
          d.unreadCounts[recipientId] ??
          d.unreadCounts[recipientHandle] ??
          d.unreadCounts[recipientName.toLowerCase()] ??
          0;
      }
    }
  } catch (e) {}

  const fullHistory = deduplicateChatHistory([...existingHistory, newMessage]);

  const canonicalAliases: string[] = [];
  if (recipientName.toLowerCase() === "yoouz" || recipientEmail === "info@yoouz.com" || recipientId.includes("yoouz")) {
    canonicalAliases.push("info@yoouz.com", "yoouz.com", "yoouz");
  }
  if (userName.toLowerCase() === "yoouz" || userEmail === "info@yoouz.com" || userEmail.endsWith("@yoouz.com")) {
    canonicalAliases.push("info@yoouz.com", "yoouz.com", "yoouz");
  }
  if (recipientName.toLowerCase().includes("steven") || recipientEmail === "avr6566gd@gmail.com" || recipientId.includes("steven") || recipientId.includes("avtertuop") || recipientId.includes("avt")) {
    canonicalAliases.push("avr6566gd@gmail.com", "avr6566gd", "steven akan", "stevenakan", "steven", "avt ertuop", "avtertuop", "avt");
  }
  if (userName.toLowerCase().includes("steven") || userEmail === "avr6566gd@gmail.com" || userHandle.includes("steven") || userEmail.includes("avt") || userName.toLowerCase().includes("avt")) {
    canonicalAliases.push("avr6566gd@gmail.com", "avr6566gd", "steven akan", "stevenakan", "steven", "avt ertuop", "avtertuop", "avt");
  }
  if (recipientName.toLowerCase().includes("ben") || recipientEmail.includes("aouisesmee") || recipientId.includes("ben") || recipientId.includes("aouisesmee")) {
    canonicalAliases.push("aouisesmee@gmail.com", "aouisemee@gmail.com", "aouisesmee", "aouisemee", "ben blue", "benblue", "ben");
  }
  if (userName.toLowerCase().includes("ben") || userEmail.includes("aouisesmee") || userHandle.includes("ben")) {
    canonicalAliases.push("aouisesmee@gmail.com", "aouisemee@gmail.com", "aouisesmee", "aouisemee", "ben blue", "benblue", "ben");
  }
  if (recipientName.toLowerCase() === "biz riv" || recipientEmail === "louis42111@gmail.com" || recipientId.includes("bizriv") || recipientId.includes("biz")) {
    canonicalAliases.push("louis42111@gmail.com", "louis42111", "biz riv", "bizriv", "biz");
  }
  if (userName.toLowerCase() === "biz riv" || userEmail === "louis42111@gmail.com" || userEmail.includes("biz") || userName.toLowerCase().includes("biz")) {
    canonicalAliases.push("louis42111@gmail.com", "louis42111", "biz riv", "bizriv", "biz");
  }

  const participantsList = Array.from(
    new Set(
      [
        userEmail,
        emailPrefix,
        userHandle,
        userName.toLowerCase(),
        currentUser.userId,
        recipientEmail,
        recipientId.toLowerCase(),
        recipientHandle.toLowerCase(),
        recipientName.toLowerCase(),
        ...canonicalAliases
      ].filter(Boolean)
    )
  );

  const nextUnreadCount = prevRecipientUnread + 1;

  const threadData = sanitizeData({
    id: threadId,
    participants: participantsList,
    deletedForUsers: [],
    participantProfiles: {
      [userEmail || userHandle || "sender"]: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        email: userEmail
      },
      [recipientEmail || recipientId || recipientHandle || "recipient"]: {
        name: recipient.name,
        avatar: recipient.avatar,
        email: recipientEmail
      }
    },
    lastMessage: messageText.trim(),
    lastSenderEmail: userEmail,
    lastSenderName: currentUser.name,
    senderEmail: userEmail,
    senderName: currentUser.name,
    senderAvatar: currentUser.avatar,
    recipientEmail: recipientEmail,
    recipientId: recipientId,
    recipientName: recipient.name,
    recipientAvatar: recipient.avatar,
    timestamp: new Date(msgTime).toISOString(),
    updatedAt: msgTime,
    createdAt: msgTime,
    videoPreviewUrl: videoUrl || "",
    history: fullHistory,
    unreadCounts: {
      [userEmail]: 0,
      ...(emailPrefix && { [emailPrefix]: 0 }),
      ...(userHandle && { [userHandle]: 0 }),
      ...(recipientEmail && { [recipientEmail]: nextUnreadCount }),
      ...(recipientEmail && recipientEmail.includes("@") && { [recipientEmail.split("@")[0]]: nextUnreadCount }),
      ...(recipientId && { [recipientId.toLowerCase()]: nextUnreadCount, [recipientId.toLowerCase().replace(/\s+/g, "")]: nextUnreadCount }),
      ...(recipientHandle && { [recipientHandle.toLowerCase()]: nextUnreadCount, [recipientHandle.toLowerCase().replace(/\s+/g, "")]: nextUnreadCount }),
      ...(recipientName && { [recipientName.toLowerCase()]: nextUnreadCount, [recipientName.toLowerCase().replace(/\s+/g, "")]: nextUnreadCount }),
      ...((recipientEmail === "avr6566gd@gmail.com" || recipientId.includes("steven") || recipientName.toLowerCase().includes("steven") || recipientId.includes("avt") || recipientName.toLowerCase().includes("avt")) ? {
        "avr6566gd@gmail.com": nextUnreadCount,
        "avr6566gd": nextUnreadCount,
        "steven akan": nextUnreadCount,
        "stevenakan": nextUnreadCount,
        "steven": nextUnreadCount,
        "avt ertuop": nextUnreadCount,
        "avtertuop": nextUnreadCount,
        "avt": nextUnreadCount
      } : {}),
      ...((recipientEmail.includes("aouisesmee") || recipientId.includes("ben") || recipientName.toLowerCase().includes("ben")) ? {
        "aouisesmee@gmail.com": nextUnreadCount,
        "aouisemee@gmail.com": nextUnreadCount,
        "aouisesmee": nextUnreadCount,
        "aouisemee": nextUnreadCount,
        "ben blue": nextUnreadCount,
        "benblue": nextUnreadCount,
        "ben": nextUnreadCount
      } : {}),
      ...((recipientEmail === "louis42111@gmail.com" || recipientId.includes("bizriv") || recipientName.toLowerCase() === "biz riv" || recipientId.includes("biz")) ? {
        "louis42111@gmail.com": nextUnreadCount,
        "louis42111": nextUnreadCount,
        "biz riv": nextUnreadCount,
        "bizriv": nextUnreadCount,
        "biz": nextUnreadCount
      } : {}),
      ...((recipientEmail.includes("aouisesmee") || recipientName.toLowerCase().includes("aouisesmee")) ? {
        "aouisesmee@gmail.com": nextUnreadCount,
        "aouisesmee": nextUnreadCount
      } : {})
    }
  });

  // 1. Direct write to Bunny Cloud Database & SSE Broadcast
  fetch("/api/interactions/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, message: newMessage, threadData })
  }).catch(() => {});

  fetch(`/api/nosql/chats/${threadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: threadData, merge: true })
  }).catch(() => {});

  // 3. Activity notification to recipient
  const targetRecipient = recipientEmail || recipientId || recipientHandle;
  if (targetRecipient && targetRecipient.toLowerCase() !== userEmail && targetRecipient.toLowerCase() !== emailPrefix) {
    let notifPreviewText = messageText.trim();
    notifPreviewText = notifPreviewText.replace(/\(\s*website[^)]*\)/gi, "").replace(/\blocat\b\.*/gi, "").trim();
    const cleanNotifText = notifPreviewText.length > 50 
      ? `${notifPreviewText.slice(0, 48).trim()}...` 
      : notifPreviewText;

    await sendSocialNotification({
      recipientEmail: recipientEmail,
      recipientHandle: recipientHandle,
      recipientId: recipientId,
      type: "message",
      user: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        email: userEmail
      },
      text: "sent you a message",
      videoThumbnail: videoUrl,
      videoId: customVideoId
    });
  }

  return {
    id: threadId,
    senderId: recipient.id,
    senderName: recipient.name,
    senderAvatar: recipient.avatar,
    lastMessage: messageText.trim(),
    timestamp: new Date(msgTime).toISOString(),
    createdAtMs: msgTime,
    updatedAt: msgTime,
    unreadCount: 0,
    videoPreviewUrl: videoUrl,
    history: fullHistory.map((m: any) => {
      const mMs = resolveMessageTimestampMs(m, m.createdAtMs || m.createdAt || m.created_at) || parseTimestampToMs(m.id) || msgTime;
      return {
        id: m.id,
        senderName: m.senderName || "Member",
        senderAvatar: m.senderAvatar || "",
        senderEmail: m.senderEmail,
        senderId: m.senderId,
        text: m.text || "",
        timestamp: new Date(mMs).toISOString(),
        createdAt: mMs,
        createdAtMs: mMs,
        resolvedTime: mMs,
        isMe: Boolean(
          (userEmail && (m.senderEmail?.toLowerCase() === userEmail || m.senderId === userEmail)) ||
          (emailPrefix && (m.senderEmail?.toLowerCase().startsWith(emailPrefix) || m.senderId === emailPrefix)) ||
          (userHandle && (m.senderId === userHandle || m.senderName?.toLowerCase() === userHandle)) ||
          (userName && m.senderName?.toLowerCase() === userName.toLowerCase()) ||
          m.id === newMessage.id
        ),
        videoThumbnail: m.videoThumbnail,
        videoId: m.videoId,
        placeId: m.placeId,
        placeName: m.placeName,
        placeAddress: m.placeAddress,
        placeCategory: m.placeCategory,
        placeRating: m.placeRating,
        placeImage: m.placeImage
      };
    })
  };
}

const recentlyMarkedReadMap = new Map<string, number>();

/**
 * Mark a thread as read for current user
 */
export async function markChatThreadAsRead(threadId: string, currentUser: UserProfile): Promise<void> {
  if (!currentUser || !threadId) return;

  saveReadThreadTimestamp(threadId, currentUser);

  const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  const debounceKey = `${userKey}_${threadId}`;
  const now = Date.now();
  const lastMarked = recentlyMarkedReadMap.get(debounceKey) || 0;
  if (now - lastMarked < 300) {
    return;
  }
  recentlyMarkedReadMap.set(debounceKey, now);

  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userId = (currentUser.userId || (currentUser as any).id || "").toLowerCase().trim();

  const isAvt = userEmail.includes("avr6566gd") || userName.includes("avt") || userHandle.includes("avt") || userId.includes("avr6566gd") || userName.includes("steven") || userHandle.includes("steven");
  const isAou = userEmail.includes("aouisesmee") || userEmail.includes("aouisemee") || userName.includes("aouisesmee") || userId.includes("aouisesmee") || userName.includes("ben") || userHandle.includes("ben");
  const isBiz = userEmail.includes("louis42111") || userName.includes("biz") || userHandle.includes("biz") || userId.includes("louis42111");

  const unreadCountsUpdates: Record<string, number> = {};
  if (userEmail) unreadCountsUpdates[userEmail] = 0;
  if (emailPrefix) unreadCountsUpdates[emailPrefix] = 0;
  if (userHandle) unreadCountsUpdates[userHandle] = 0;
  if (userName) unreadCountsUpdates[userName] = 0;
  if (userId) unreadCountsUpdates[userId] = 0;
  if (isAvt) {
    unreadCountsUpdates["avr6566gd@gmail.com"] = 0;
    unreadCountsUpdates["avr6566gd"] = 0;
    unreadCountsUpdates["steven akan"] = 0;
    unreadCountsUpdates["stevenakan"] = 0;
    unreadCountsUpdates["steven"] = 0;
    unreadCountsUpdates["avt ertuop"] = 0;
    unreadCountsUpdates["avtertuop"] = 0;
    unreadCountsUpdates["avt"] = 0;
  }
  if (isAou) {
    unreadCountsUpdates["aouisesmee@gmail.com"] = 0;
    unreadCountsUpdates["aouisemee@gmail.com"] = 0;
    unreadCountsUpdates["aouisesmee"] = 0;
    unreadCountsUpdates["aouisemee"] = 0;
    unreadCountsUpdates["ben blue"] = 0;
    unreadCountsUpdates["benblue"] = 0;
    unreadCountsUpdates["ben"] = 0;
  }
  if (isBiz) {
    unreadCountsUpdates["louis42111@gmail.com"] = 0;
    unreadCountsUpdates["louis42111"] = 0;
    unreadCountsUpdates["biz riv"] = 0;
    unreadCountsUpdates["bizriv"] = 0;
    unreadCountsUpdates["biz"] = 0;
  }

  // Immediately update local cache so on page refresh it's marked as read
  try {
    const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
    const cacheKey = `copo_cached_chats_${userKey}`;
    const rawCache = localStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Array.isArray(parsed)) {
        const updatedCache = parsed.map((t: any) => t.id === threadId ? { ...t, unreadCount: 0 } : t);
        localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
      }
    }
  } catch (e) {}

  // Broadcast live read receipt to server & SSE
  const readNowMs = Date.now();
  fetch("/api/interactions/read_receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId,
      readerId: currentUser.userId || (currentUser as any).id || (currentUser as any).uid || userEmail,
      readerEmail: userEmail,
      readAt: readNowMs
    })
  }).catch(() => {});

  // Mirror to BunnyDB
  fetch(`/api/nosql/chats/${threadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        unreadCount: 0,
        unreadCounts: unreadCountsUpdates,
        readReceipts: userEmail ? { [userEmail]: readNowMs } : {}
      },
      merge: true
    })
  }).catch(() => {});
}

/**
 * Delete a chat thread from Bunny Cloud Database and local caches for a specific user or business
 */
export async function deleteChatThread(threadId: string, currentUser?: UserProfile | null, partnerKeyOrTarget?: string | any): Promise<void> {
  if (!threadId && !partnerKeyOrTarget) return;

  const targetPartnerKey = typeof partnerKeyOrTarget === "string" 
    ? partnerKeyOrTarget 
    : (partnerKeyOrTarget ? getThreadPartnerKey(partnerKeyOrTarget, currentUser) : "");

  let targetSenderName = "";
  let targetSenderId = "";
  let targetSenderEmail = "";
  let targetRecipientName = "";
  let targetRecipientId = "";
  let targetRecipientEmail = "";
  if (partnerKeyOrTarget && typeof partnerKeyOrTarget === "object") {
    targetSenderName = (partnerKeyOrTarget.senderName || "").toLowerCase().trim();
    targetSenderId = (partnerKeyOrTarget.senderId || "").toLowerCase().trim().replace(/^@/, '');
    targetSenderEmail = (partnerKeyOrTarget.senderEmail || partnerKeyOrTarget.lastSenderEmail || "").toLowerCase().trim();
    targetRecipientName = ((partnerKeyOrTarget.recipientName || "") as string).toLowerCase().trim();
    targetRecipientId = (((partnerKeyOrTarget as any).recipientId || "") as string).toLowerCase().trim().replace(/^@/, '');
    targetRecipientEmail = (((partnerKeyOrTarget as any).recipientEmail || "") as string).toLowerCase().trim();
  }

  // 0. Add to persistent deleted threads map with current timestamp for this specific user/business
  try {
    const map = getDeletedThreadsMap(currentUser);
    const now = Date.now();
    if (threadId) map.set(threadId, now);
    if (targetPartnerKey) map.set(targetPartnerKey, now);
    if (targetSenderName) map.set(targetSenderName, now);
    if (targetSenderId) map.set(targetSenderId, now);
    if (targetSenderEmail) map.set(targetSenderEmail, now);
    if (targetRecipientName) map.set(targetRecipientName, now);
    if (targetRecipientId) map.set(targetRecipientId, now);
    if (targetRecipientEmail) map.set(targetRecipientEmail, now);
    saveDeletedThreadsMap(map, currentUser);
  } catch (e) {}
  
  // 1. Remove from local storage chat cache for this user/business profile
  try {
    const allKeys = getAllDeletedThreadsKeys(currentUser);
    const cacheKeys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) || "").filter(k => k.startsWith('copo_cached_chats_'));

    for (const key of cacheKeys) {
      if (!key) continue;
      const rawCache = localStorage.getItem(key);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t: any) => {
            if (!t) return false;
            const tId = String(t.id || "").trim();
            if (threadId && tId === threadId) return false;
            const pKey = getThreadPartnerKey(t, currentUser);
            if (targetPartnerKey && pKey === targetPartnerKey) return false;
            const sName = (t.senderName || "").toLowerCase().trim();
            const sId = (t.senderId || "").toLowerCase().trim().replace(/^@/, '');
            const sEmail = (t.senderEmail || t.lastSenderEmail || "").toLowerCase().trim();
            const rName = ((t.recipientName || "") as string).toLowerCase().trim();
            const rId = (((t as any).recipientId || "") as string).toLowerCase().trim().replace(/^@/, '');
            const rEmail = (((t as any).recipientEmail || "") as string).toLowerCase().trim();

            if (targetSenderName && (sName === targetSenderName || rName === targetSenderName)) return false;
            if (targetSenderId && (sId === targetSenderId || rId === targetSenderId)) return false;
            if (targetSenderEmail && (sEmail === targetSenderEmail || rEmail === targetSenderEmail)) return false;
            if (targetRecipientName && (sName === targetRecipientName || rName === targetRecipientName)) return false;
            if (targetRecipientId && (sId === targetRecipientId || rId === targetRecipientId)) return false;
            if (targetRecipientEmail && (sEmail === targetRecipientEmail || rEmail === targetRecipientEmail)) return false;
            return true;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
  } catch (e) {}

  // 2. Notify backend of deletion and soft delete on BunnyDB by adding user's identifiers to deletedForUsers array
  const allMyAliases = currentUser ? [
    currentUser.email,
    currentUser.userId,
    currentUser.id,
    (currentUser as any).uid,
    (currentUser as any).placeId,
    currentUser.name,
    currentUser.handle
  ].filter(Boolean).map(s => String(s).toLowerCase().trim().replace(/^@/, '')) : [];

  if (threadId) {
    // Call server-side chat delete interaction
    fetch("/api/interactions/chat/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        userId: currentUser?.userId || (currentUser as any)?.id,
        userEmail: currentUser?.email,
        placeId: (currentUser as any)?.placeId,
        allAliases: allMyAliases
      })
    }).catch(() => {});
  }

  if (currentUser) {
    try {
      const res = await fetch(`/api/nosql/chats?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || json.data || []);
        for (const item of items) {
          if (!item || !item.id) continue;
          const iId = String(item.id).trim();
          const pKey = getThreadPartnerKey(item, currentUser);
          const iSenderName = (item.senderName || item.lastSenderName || "").toLowerCase().trim();
          const iSenderId = (item.senderId || "").toLowerCase().trim().replace(/^@/, '');
          const iRecipientName = ((item.recipientName || "") as string).toLowerCase().trim();
          const iRecipientId = (((item as any).recipientId || "") as string).toLowerCase().trim().replace(/^@/, '');
          
          const isMatch = (threadId && iId === threadId) ||
                          (targetPartnerKey && pKey === targetPartnerKey) ||
                          (targetSenderName && (iSenderName === targetSenderName || iRecipientName === targetSenderName)) ||
                          (targetSenderId && (iSenderId === targetSenderId || iRecipientId === targetSenderId)) ||
                          (targetRecipientName && (iSenderName === targetRecipientName || iRecipientName === targetRecipientName)) ||
                          (targetRecipientId && (iSenderId === targetRecipientId || iRecipientId === targetRecipientId));

          if (isMatch) {
            const deletedForUsers = Array.isArray(item.deletedForUsers) ? [...item.deletedForUsers] : [];
            let modified = false;
            for (const alias of allMyAliases) {
              if (alias && !deletedForUsers.includes(alias)) {
                deletedForUsers.push(alias);
                modified = true;
              }
            }
            if (modified) {
              await fetch(`/api/nosql/chats/${iId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  data: {
                    ...item,
                    deletedForUsers
                  },
                  merge: true
                })
              }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {}
  }

  // Fallback: Direct delete in BunnyDB if no user context provided
  if (!currentUser && threadId) {
    fetch(`/api/nosql/chats/${threadId}`, {
      method: "DELETE"
    }).catch(() => {});
  }
}

// Aliases for seamless backward compatibility
export const sendChatMessageToBunnyDB = sendChatMessage;
export const deleteChatThreadFromBunnyDB = deleteChatThread;

/**
 * Completely clears any local deletion markers for a partner, user, or thread so fresh chats and messages are always visible.
 */
export function unmarkDeletedThread(partnerOrThread: any, currentUser?: UserProfile | null): void {
  try {
    const map = getDeletedThreadsMap(currentUser);
    let modified = false;
    const keysToRemove: string[] = [];
    if (typeof partnerOrThread === "string") {
      const s = partnerOrThread.toLowerCase().trim();
      if (s) keysToRemove.push(s, s.replace(/^@/, ''));
    } else if (partnerOrThread && typeof partnerOrThread === "object") {
      if (partnerOrThread.id) {
        keysToRemove.push(String(partnerOrThread.id).trim(), String(partnerOrThread.id).toLowerCase().trim());
      }
      const pKey = getThreadPartnerKey(partnerOrThread, currentUser);
      if (pKey) keysToRemove.push(pKey);
      if (partnerOrThread.name) keysToRemove.push(partnerOrThread.name.toLowerCase().trim());
      if (partnerOrThread.senderName) keysToRemove.push(partnerOrThread.senderName.toLowerCase().trim());
      if (partnerOrThread.recipientName) keysToRemove.push(partnerOrThread.recipientName.toLowerCase().trim());
      if (partnerOrThread.senderId) {
        const sid = String(partnerOrThread.senderId).toLowerCase().trim();
        keysToRemove.push(sid, sid.replace(/^@/, ''));
      }
      if (partnerOrThread.recipientId) {
        const rid = String(partnerOrThread.recipientId).toLowerCase().trim();
        keysToRemove.push(rid, rid.replace(/^@/, ''));
      }
      if (partnerOrThread.email) keysToRemove.push(partnerOrThread.email.toLowerCase().trim());
      if (partnerOrThread.senderEmail) keysToRemove.push(partnerOrThread.senderEmail.toLowerCase().trim());
      if (partnerOrThread.recipientEmail) keysToRemove.push(partnerOrThread.recipientEmail.toLowerCase().trim());
    }
    for (const k of keysToRemove) {
      if (k && map.has(k)) {
        map.delete(k);
        modified = true;
      }
    }
    if (modified) {
      saveDeletedThreadsMap(map, currentUser);
    }
  } catch (e) {}
}
