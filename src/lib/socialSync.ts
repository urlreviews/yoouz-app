import { CopoNotification, CopoMessage, UserProfile } from "../types";
import { getCanonicalUserKey } from "./userCanonicalization";
import { generateGoogleLetterAvatarSvg } from "./avatar";

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
      name: params.user.name || "Yoouz Member",
      avatar: params.user.avatar || generateGoogleLetterAvatarSvg(params.user.name || "User", 128, senderEmail || params.user.name || "User"),
      email: senderEmail
    },
    text: params.text,
    timestamp: "Just now",
    createdAt: Date.now(),
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
    const prefs = currentUser.notificationSettings;
    if (prefs) {
      if (prefs.enabled === false && !isSystemOrGlobal) {
        continue;
      }
      if (notifType === "like" && prefs.likes === false) continue;
      if (notifType === "comment" && prefs.comments === false) continue;
      if (notifType === "message" && prefs.messages === false) continue;
      if (notifType === "follow" && prefs.follows === false) continue;
      if (notifType === "bookmark" && prefs.bookmarks === false) continue;
    }

    list.push({
      ...data,
      id: String(data.id),
      recipientEmail: data.recipientEmail || recEmail,
      recipientId: data.recipientId || recId,
      recipientHandle: data.recipientHandle || recHandle,
      type: data.type || "like",
      user: {
        name: data.user?.name || parsedInner.user?.name || "Yoouz Member",
        avatar: data.user?.avatar || parsedInner.user?.avatar || generateGoogleLetterAvatarSvg(data.user?.name || parsedInner.user?.name || "User", 128, senderEmail || data.user?.name || parsedInner.user?.name || "User"),
        email: data.user?.email || parsedInner.user?.email || senderEmail
      },
      text: data.text || parsedInner.text || "",
      timestamp: data.timestamp || parsedInner.timestamp || "Recently",
      createdAtMs: data.createdAtMs || data.createdAt || parsedInner.createdAtMs || parsedInner.createdAt || Date.now(),
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

  const updateList = (newItems: CopoNotification[]) => {
    if (isDisposed) return;
    // Strict deduplication guard across memory, cache, and state
    const deduped: CopoNotification[] = [];
    const seen = new Set<string>();
    for (const item of newItems) {
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
      const res = await fetch(`/api/nosql/notifications?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || json.data || []);
        if (Array.isArray(items) && !isDisposed) {
          const filtered = filterNotificationsForUser(items, currentUser);
          
          // Merge server items with cached items to ensure real-time notifications are never dropped
          const map = new Map<string, CopoNotification>();
          
          // Seed with current cached items
          cachedNotifs.forEach((item) => {
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

export function getDeletedThreadsKey(currentUser?: UserProfile | null): string {
  if (!currentUser) return "yoouz_deleted_threads";
  const id = (currentUser.userId || currentUser.id || (currentUser as any).uid || (currentUser as any).placeId || currentUser.email || "").toLowerCase().trim();
  return id ? `yoouz_deleted_threads_${id}` : "yoouz_deleted_threads";
}

export function getDeletedThreadsMap(currentUser?: UserProfile | null): Map<string, number> {
  const map = new Map<string, number>();
  if (typeof window === "undefined") return map;
  try {
    const userDelKey = getDeletedThreadsKey(currentUser);
    const raw = localStorage.getItem(userDelKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "string" && item.trim()) {
            // Do NOT default to Date.now() on every execution for legacy string arrays
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
  } catch (e) {}
  return map;
}

export function saveDeletedThreadsMap(map: Map<string, number>, currentUser?: UserProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    const userDelKey = getDeletedThreadsKey(currentUser);
    const obj: Record<string, number> = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    localStorage.setItem(userDelKey, JSON.stringify(obj));
  } catch (e) {}
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
      ? data.deletedForUsers.map((u: string) => (u || "").toLowerCase().trim())
      : [];
    if (userEmail && deletedForUsers.includes(userEmail)) {
      continue;
    }
    if (userId && deletedForUsers.includes(userId)) {
      continue;
    }

    const senderEmail = (data.senderEmail || data.lastSenderEmail || "").toLowerCase().trim();
    const senderId = (data.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const senderName = (data.senderName || data.lastSenderName || "").toLowerCase().trim();
    const recipientEmail = (data.recipientEmail || "").toLowerCase().trim();
    const recipientId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");
    const recipientName = (data.recipientName || "").toLowerCase().trim();
    const partnerKey = getThreadPartnerKey(data);

    // If user previously deleted this thread locally: check if any deletion key matches
    const deletedTimestamp = deletedThreadsMap.get(threadId) ??
                            (partnerKey ? deletedThreadsMap.get(partnerKey) : undefined) ??
                            (senderName ? deletedThreadsMap.get(senderName) : undefined) ??
                            (senderId ? deletedThreadsMap.get(senderId) : undefined) ??
                            (senderEmail ? deletedThreadsMap.get(senderEmail) : undefined) ??
                            (recipientName ? deletedThreadsMap.get(recipientName) : undefined) ??
                            (recipientId ? deletedThreadsMap.get(recipientId) : undefined) ??
                            (recipientEmail ? deletedThreadsMap.get(recipientEmail) : undefined);

    if (deletedTimestamp !== undefined) {
      const rawHistory = Array.isArray(data.history) ? data.history : [];
      const hasNewIncomingMsg = rawHistory.some((m: any) => {
        const msgTime = Number(m?.createdAt || m?.createdAtMs || 0);
        if (msgTime <= deletedTimestamp + 1000) return false;
        const msgSenderEmail = (m?.senderEmail || '').toLowerCase().trim();
        const msgSenderName = (m?.senderName || '').toLowerCase().trim();
        const msgSenderId = (m?.senderId || '').toLowerCase().trim();
        const isMyMsg = (userEmail && (msgSenderEmail === userEmail || msgSenderId === userEmail)) ||
                        (userName && (msgSenderName === userName || msgSenderId === userName)) ||
                        (userId && msgSenderId === userId);
        return !isMyMsg;
      });

      if (hasNewIncomingMsg) {
        deletedThreadsMap.delete(threadId);
        if (partnerKey) deletedThreadsMap.delete(partnerKey);
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
      let otherName = data.senderName || data.recipientName || "Yoouz Member";
      let otherId = data.senderId || data.recipientId || String(data.id);
      let otherAvatar = data.senderAvatar || data.recipientAvatar || generateGoogleLetterAvatarSvg(otherName, 128, otherId || otherName);

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
        } else if (senderEmail === userEmail && data.recipientName) {
          otherName = data.recipientName;
          otherAvatar = data.recipientAvatar || otherAvatar;
          otherId = data.recipientId || data.recipientEmail || otherId;
        } else if (data.senderName && senderEmail !== userEmail) {
          otherName = data.senderName;
          otherAvatar = data.senderAvatar || otherAvatar;
          otherId = data.senderId || data.senderEmail || otherId;
        }
      } else if (senderEmail === userEmail && data.recipientName) {
        otherName = data.recipientName;
        otherAvatar = data.recipientAvatar || otherAvatar;
        otherId = data.recipientId || data.recipientEmail || otherId;
      } else if (data.senderName) {
        otherName = data.senderName;
        otherAvatar = data.senderAvatar || otherAvatar;
        otherId = data.senderId || data.senderEmail || otherId;
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
        unreadCount = data.unreadCount || 1;
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

          return {
            id: m.id || `msg_${Date.now()}_${Math.random()}`,
            senderName: m.senderName || "Member",
            senderAvatar: m.senderAvatar || generateGoogleLetterAvatarSvg(m.senderName || "User", 128, msgSenderId || msgSenderEmail || m.senderName || "User"),
            text: m.text || "",
            timestamp: m.timestamp || "Just now",
            createdAtMs: m.createdAt,
            isMe: Boolean(isSender),
            videoThumbnail: m.videoThumbnail,
            videoId: m.videoId
          };
        })
        .filter((m: any) => {
          const t = (m.text || "").trim();
          if (t === "Conversation started" || t === "Direct conversation") return false;
          return Boolean(t || m.videoThumbnail || m.videoId);
        });

      // If the current user was the sender of the most recent message, this thread is read for them
      const lastHistMsg = processedHistory.length > 0 ? processedHistory[processedHistory.length - 1] : null;
      if (lastHistMsg && lastHistMsg.isMe) {
        unreadCount = 0;
      }

      const cleanRawLastMsg = (data.lastMessage && data.lastMessage !== "Conversation started" && data.lastMessage !== "Direct conversation") ? data.lastMessage.trim() : "";
      const lastMsg = (processedHistory[processedHistory.length - 1]?.text) || cleanRawLastMsg || "";

      threads.push({
        id: String(data.id),
        senderId: otherId,
        senderName: otherName,
        senderAvatar: otherAvatar,
        senderEmail: data.senderEmail,
        recipientEmail: data.recipientEmail,
        lastMessage: lastMsg,
        timestamp: data.timestamp || "Just now",
        createdAtMs: data.updatedAt || data.createdAt || (processedHistory[processedHistory.length - 1]?.createdAtMs) || Date.now(),
        unreadCount: Number(unreadCount) || 0,
        videoPreviewUrl: data.videoPreviewUrl,
        history: processedHistory
      });
    }
  }

  if (deletedThreadsModified) {
    saveDeletedThreadsMap(deletedThreadsMap, currentUser);
  }

  return deduplicateChatThreads(threads);
}

/**
 * Returns a normalized canonical partner key for chat thread deduplication.
 */
export function getThreadPartnerKey(thread: any, currentUserOverride?: UserProfile | null): string {
  if (!thread) return "";

  // 1. If explicit business / place thread
  if (thread.isBusiness || (thread.placeId && thread.placeId !== "yoouz" && thread.placeId !== "yoouz.com")) {
    const pId = (thread.placeId || thread.senderId || "").toLowerCase().trim();
    if (pId && pId !== "yoouz" && pId !== "yoouz.com") return `biz_${pId}`;
  }

  const sName = (thread.senderName || "").toLowerCase().trim();
  const sId = (thread.senderId || "").toLowerCase().trim().replace(/^@/, "");
  const sEmail = (thread.senderEmail || "").toLowerCase().trim();

  const rName = (thread.recipientName || "").toLowerCase().trim();
  const rId = (thread.recipientId || "").toLowerCase().trim().replace(/^@/, "");
  const rEmail = (thread.recipientEmail || "").toLowerCase().trim();

  if (
    sName === "yoouz" || sId === "yoouz" || sId === "yoouz.com" || sEmail.includes("info@yoouz.com") || sEmail.endsWith("@yoouz.com") ||
    rName === "yoouz" || rId === "yoouz" || rId === "yoouz.com" || rEmail.includes("info@yoouz.com") || rEmail.endsWith("@yoouz.com")
  ) {
    return "biz_yoouz";
  }

  const user = currentUserOverride || activeCurrentUser;
  const userEmail = (user?.email || "").toLowerCase().trim();
  const userName = (user?.name || "").toLowerCase().trim();
  const userHandle = (user?.handle || user?.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userId = (user?.userId || (user as any)?.id || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";

  // 2. Resolve canonical user identity clusters for both sides
  const senderCanonicalKey = getCanonicalUserKey({
    email: sEmail,
    name: sName,
    handle: sId,
    id: sId
  });

  const recipientCanonicalKey = getCanonicalUserKey({
    email: rEmail,
    name: rName,
    handle: rId,
    id: rId
  });

  // 3. Evaluate relative to active/current user if available
  if (user && (userEmail || userName || userId)) {
    const isSenderMe = Boolean(
      (userEmail && (sEmail === userEmail || sId === userEmail)) ||
      (emailPrefix && emailPrefix.length >= 3 && (sEmail.startsWith(emailPrefix) || sId === emailPrefix)) ||
      (userHandle && userHandle.length >= 3 && (sId === userHandle || sName === userHandle)) ||
      (userName && userName.length >= 3 && sName === userName) ||
      (userId && (sId === userId || sEmail === userId))
    );

    const isRecipientMe = Boolean(
      (userEmail && (rEmail === userEmail || rId === userEmail)) ||
      (emailPrefix && emailPrefix.length >= 3 && (rEmail.startsWith(emailPrefix) || rId === emailPrefix)) ||
      (userHandle && userHandle.length >= 3 && (rId === userHandle || rName === userHandle)) ||
      (userName && userName.length >= 3 && rName === userName) ||
      (userId && (rId === userId || rEmail === userId))
    );

    if (isSenderMe && !isRecipientMe) {
      return recipientCanonicalKey || (rEmail || rId || rName || "partner").toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    }
    if (isRecipientMe && !isSenderMe) {
      return senderCanonicalKey || (sEmail || sId || sName || "partner").toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    }
  }

  // 4. If thread object was pre-processed by processChatThreadsForUser, thread.senderName/senderId represents OTHER partner
  if (sId && sId !== userEmail && sId !== userId && sId !== userHandle) {
    if (senderCanonicalKey) return senderCanonicalKey;
  }

  // 5. Symmetric fallback
  if (senderCanonicalKey && recipientCanonicalKey && senderCanonicalKey !== recipientCanonicalKey) {
    const pair = [senderCanonicalKey, recipientCanonicalKey].sort();
    return `pair_${pair[0]}_${pair[1]}`;
  }

  return senderCanonicalKey || recipientCanonicalKey || (sEmail || sId || sName || rEmail || rId || rName || String(thread.id || "")).toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
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
    const existingIdx = partnerKey ? partnerIndexMap.get(partnerKey) : undefined;

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
      if (lastMergedMsg && lastMergedMsg.isMe) {
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
      if (lastCleanMsg && lastCleanMsg.isMe) {
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

  const sorted = [...messages].filter(Boolean).sort((a, b) => {
    const tA = Number(a.createdAtMs || a.createdAt || (typeof a.id === "string" && a.id.startsWith("msg_") ? parseInt(a.id.split("_")[1]) : 0) || 0);
    const tB = Number(b.createdAtMs || b.createdAt || (typeof b.id === "string" && b.id.startsWith("msg_") ? parseInt(b.id.split("_")[1]) : 0) || 0);
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
          if (!mTime || !eTime || Math.abs(mTime - eTime) < 45000) {
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
  customCreatedAt?: number
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

  const newMessage = {
    id: msgId,
    senderId: userEmail || currentUser.name,
    senderEmail: userEmail,
    senderName: currentUser.name || "Reviewer",
    senderAvatar: currentUser.avatar || generateGoogleLetterAvatarSvg(currentUser.name || "User", 128, userEmail || currentUser.name || "User"),
    text: messageText.trim(),
    timestamp: "Just now",
    createdAt: msgTime,
    createdAtMs: msgTime,
    isMe: true,
    videoThumbnail: sanitizedThumbnail,
    videoId: customVideoId
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
    timestamp: "Just now",
    updatedAt: Date.now(),
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
      text: `sent you a message: "${cleanNotifText}"`,
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
    timestamp: "Just now",
    unreadCount: 0,
    videoPreviewUrl: videoUrl,
    history: fullHistory.map((m: any) => ({
      id: m.id,
      senderName: m.senderName || "Member",
      senderAvatar: m.senderAvatar || "",
      text: m.text || "",
      timestamp: m.timestamp || "Just now",
      createdAtMs: m.createdAt,
      isMe: Boolean(
        (userEmail && (m.senderEmail?.toLowerCase() === userEmail || m.senderId === userEmail)) ||
        (emailPrefix && (m.senderEmail?.toLowerCase().startsWith(emailPrefix) || m.senderId === emailPrefix)) ||
        (userHandle && (m.senderId === userHandle || m.senderName?.toLowerCase() === userHandle)) ||
        (userName && m.senderName?.toLowerCase() === userName.toLowerCase()) ||
        m.id === newMessage.id ||
        m.isMe === true
      ),
      videoThumbnail: m.videoThumbnail,
      videoId: m.videoId
    }))
  };
}

/**
 * Mark a thread as read for current user
 */
export async function markChatThreadAsRead(threadId: string, currentUser: UserProfile): Promise<void> {
  if (!currentUser || !threadId) return;
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userId = (currentUser.userId || (currentUser as any).id || "").toLowerCase().trim();

  const isAvt = userEmail.includes("avr6566gd") || userName.includes("avt") || userHandle.includes("avt") || userId.includes("avr6566gd");
  const isAou = userEmail.includes("aouisesmee") || userName.includes("aouisesmee") || userId.includes("aouisesmee");
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
    unreadCountsUpdates["avt ertuop"] = 0;
    unreadCountsUpdates["avtertuop"] = 0;
    unreadCountsUpdates["avt"] = 0;
  }
  if (isAou) {
    unreadCountsUpdates["aouisesmee@gmail.com"] = 0;
    unreadCountsUpdates["aouisesmee"] = 0;
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

  // Mirror to BunnyDB
  fetch(`/api/nosql/chats/${threadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        unreadCount: 0,
        unreadCounts: unreadCountsUpdates
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
    : (partnerKeyOrTarget ? getThreadPartnerKey(partnerKeyOrTarget) : "");

  let targetSenderName = "";
  let targetSenderId = "";
  let targetSenderEmail = "";
  if (partnerKeyOrTarget && typeof partnerKeyOrTarget === "object") {
    targetSenderName = (partnerKeyOrTarget.senderName || "").toLowerCase().trim();
    targetSenderId = (partnerKeyOrTarget.senderId || "").toLowerCase().trim();
    targetSenderEmail = (partnerKeyOrTarget.senderEmail || partnerKeyOrTarget.lastSenderEmail || "").toLowerCase().trim();
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
    saveDeletedThreadsMap(map, currentUser);
  } catch (e) {}
  
  // 1. Remove from local storage chat cache for this user/business profile
  try {
    const uKey = currentUser
      ? (currentUser.userId || currentUser.id || (currentUser as any).uid || (currentUser as any).placeId || currentUser.email || "").toLowerCase().trim()
      : null;
    const cacheKeys = uKey
      ? [`copo_cached_chats_${uKey}`]
      : Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) || "").filter(k => k.startsWith('copo_cached_chats_'));

    for (const key of cacheKeys) {
      if (!key) continue;
      const rawCache = localStorage.getItem(key);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t: any) => {
            if (!t) return false;
            if (threadId && t.id === threadId) return false;
            if (targetPartnerKey && getThreadPartnerKey(t) === targetPartnerKey) return false;
            const sName = (t.senderName || "").toLowerCase().trim();
            const sId = (t.senderId || "").toLowerCase().trim();
            if (targetSenderName && sName === targetSenderName) return false;
            if (targetSenderId && sId === targetSenderId) return false;
            return true;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
  } catch (e) {}

  // 2. Soft delete on BunnyDB by adding user's identifiers to deletedForUsers array
  if (currentUser) {
    const allMyAliases = [
      currentUser.email,
      currentUser.userId,
      currentUser.id,
      (currentUser as any).uid,
      (currentUser as any).placeId,
      currentUser.name,
      currentUser.handle
    ].filter(Boolean).map(s => String(s).toLowerCase().trim().replace(/^@/, ''));

    try {
      const res = await fetch(`/api/nosql/chats?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || json.data || []);
        for (const item of items) {
          if (!item || !item.id) continue;
          const iId = String(item.id).trim();
          const pKey = getThreadPartnerKey(item);
          const iSenderName = (item.senderName || item.lastSenderName || "").toLowerCase().trim();
          const iSenderId = (item.senderId || "").toLowerCase().trim().replace(/^@/, '');
          
          const isMatch = (threadId && iId === threadId) ||
                          (targetPartnerKey && pKey === targetPartnerKey) ||
                          (targetSenderName && iSenderName === targetSenderName) ||
                          (targetSenderId && iSenderId === targetSenderId);

          if (isMatch) {
            const deletedForUsers = Array.isArray(item.deletedForUsers) ? [...item.deletedForUsers] : [];
            let modified = false;
            for (const alias of allMyAliases) {
              if (!deletedForUsers.includes(alias)) {
                deletedForUsers.push(alias);
                modified = true;
              }
            }
            if (modified) {
              await fetch(`/api/nosql/chats/${iId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...item,
                  deletedForUsers
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
