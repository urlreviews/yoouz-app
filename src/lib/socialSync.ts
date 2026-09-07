import { CopoNotification, CopoMessage, UserProfile } from "../types";

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
let currentSseUserKey = "";

function setupRealtimeStream(user: UserProfile) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") return;

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

  currentSseUserKey = userKey;
  const query = new URLSearchParams({
    userEmail: email,
    userId: userId,
    userHandle: name
  }).toString();

  try {
    const es = new EventSource(`/api/realtime/stream?${query}`);
    activeEventSource = es;

    es.onmessage = (e) => {
      try {
        if (!e.data || e.data.trim() === "heartbeat") return;
        const parsed = JSON.parse(e.data);
        realtimeListeners.forEach((fn) => {
          try {
            fn(parsed);
          } catch (err) {
            console.warn("Error in SSE listener handler:", err);
          }
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
      if (!sseReconnectTimer) {
        sseReconnectTimer = setTimeout(() => {
          sseReconnectTimer = null;
          if (realtimeListeners.size > 0 && user) {
            setupRealtimeStream(user);
          }
        }, 3500);
      }
    };
  } catch (err) {
    console.warn("Failed to initialize SSE EventSource:", err);
  }
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
    } else if (targetId.includes("aouisesmee") || targetHandle.includes("aouisesmee") || targetId.includes("4samet") || targetHandle.includes("4samet")) {
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
    } else if (senderName.includes("aouisesmee") || senderName.includes("4samet")) {
      canonSenderEmail = "aouisesmee@gmail.com";
    }
  }

  // Do not send notifications to oneself (unless explicitly different canonical users)
  if (targetEmail && canonSenderEmail && targetEmail === canonSenderEmail && !targetEmail.includes("test")) {
    return;
  }

  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

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
      avatar: params.user.avatar || `/api/avatar?name=${encodeURIComponent(params.user.name || "User")}&background=27272a&color=fff`,
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
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userId = (currentUser.userId || (currentUser as any).id || "").toLowerCase().trim();

  const deletedSet = getDeletedNotifIds(userKey);

  const list: CopoNotification[] = [];

  for (const data of rawItems) {
    if (!data || !data.id) continue;

    // Skip permanently deleted notifications
    if (deletedSet.has(data.id)) {
      continue;
    }

    const senderEmail = (data.user?.email || "").toLowerCase().trim();
    const senderName = (data.user?.name || "").toLowerCase().trim();

    const recEmail = (data.recipientEmail || "").toLowerCase().trim();
    const recHandle = (data.recipientHandle || "").toLowerCase().trim().replace(/^@/, "");
    const recId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");
    const normRecId = recId.replace(/\s+/g, "");
    const normRecHandle = recHandle.replace(/\s+/g, "");

    // Allow self-notifications if explicitly addressed to self or system
    const isExplicitSelfRecipient = (
      (userEmail && (recEmail === userEmail || recId === userEmail || recHandle === userEmail)) ||
      (userHandle && (recHandle === userHandle || recId === userHandle))
    );

    // Exclude accidental self-action duplicates unless explicitly targeted
    if (!isExplicitSelfRecipient) {
      if (userEmail && senderEmail && senderEmail === userEmail) {
        continue;
      }
      if (userName && senderName && userName === senderName && (!senderEmail || !userEmail || senderEmail === userEmail)) {
        continue;
      }
    }

    const isAvtErtuop = userEmail.includes("avr6566gd") || userName === "avt ertuop" || userHandle === "avtertuop" || userId.includes("avr6566gd") || userName.includes("avt") || userHandle.includes("avt");
    const isAouisesmee = userEmail.includes("aouisesmee") || userName.includes("aouisesmee") || userHandle.includes("aouisesmee") || userId.includes("aouisesmee") || userEmail.includes("4samet") || userName.includes("4samet") || userId.includes("4samet");
    const isBizRiv = userEmail.includes("louis42111") || userName === "biz riv" || userHandle === "bizriv" || userId.includes("louis42111");

    const matchesAvtErtuop = isAvtErtuop && (
      recEmail.includes("avr6566gd") ||
      recId === "avt ertuop" ||
      recHandle === "avt ertuop" ||
      normRecId.includes("avtertuop") ||
      normRecHandle.includes("avtertuop") ||
      recId.includes("avr6566gd") ||
      recEmail.includes("avt") ||
      recHandle.includes("avt") ||
      recId.includes("avt")
    );
    const matchesAouisesmee = isAouisesmee && (
      recEmail.includes("aouisesmee") ||
      recEmail.includes("4samet") ||
      normRecHandle.includes("aouisesmee") ||
      normRecId.includes("aouisesmee") ||
      recId.includes("aouisesmee") ||
      recId.includes("4samet") ||
      normRecId.includes("4samet") ||
      normRecHandle.includes("4samet") ||
      recHandle.includes("aouisesmee")
    );
    const matchesBizRiv = isBizRiv && (
      recEmail.includes("louis42111") ||
      normRecHandle.includes("bizriv") ||
      normRecId.includes("louis42111") ||
      normRecId.includes("bizriv") ||
      recId === "biz riv" ||
      recHandle === "biz riv" ||
      recHandle.includes("bizriv")
    );

    const isForMe =
      matchesAvtErtuop ||
      matchesAouisesmee ||
      matchesBizRiv ||
      recEmail === "all" || recId === "all" || recHandle === "all" ||
      (userEmail && (recEmail === userEmail || recId === userEmail || recHandle === userEmail || normRecId === userEmail)) ||
      (emailPrefix && (recEmail === emailPrefix || recHandle === emailPrefix || recId === emailPrefix || normRecId === emailPrefix || recEmail.startsWith(emailPrefix))) ||
      (userHandle && (recHandle === userHandle || recId === userHandle || normRecId === userHandle || normRecHandle === userHandle || recEmail.includes(userHandle))) ||
      (userName && (recHandle === userName || recId === userName || recEmail === userName || normRecId === userName.replace(/\s+/g, ""))) ||
      (userId && (recId === userId || recEmail === userId || normRecId === userId));

    if (isForMe) {
      list.push({
        id: String(data.id),
        type: data.type || "like",
        user: {
          name: data.user?.name || "Yoouz Member",
          avatar: data.user?.avatar || `/api/avatar?name=${encodeURIComponent(data.user?.name || "User")}&background=27272a&color=fff`
        },
        text: data.text || "",
        timestamp: data.timestamp || "Recently",
        createdAtMs: data.createdAt,
        videoId: data.videoId,
        videoThumbnail: data.videoThumbnail,
        placeName: data.placeName,
        isRead: Boolean(data.isRead === true || data.isRead === 1 || data.read === true || data.read === 1 || data.isRead === "true" || data.isRead === "1")
      });
    }
  }

  // System Welcome Notification Fallback if no user notifications exist yet and not deleted/cleared
  const welcomeId = `welcome_notif_${userHandle || "user"}`;
  if (list.length === 0 && !deletedSet.has(welcomeId) && !deletedSet.has("all_cleared")) {
    list.push({
      id: welcomeId,
      type: "follow",
      user: {
        name: "Yoouz Team",
        avatar: "/yoouz-facebook-avatar.png"
      },
      text: "Welcome to Yoouz! Real people, real reviews. Explore authentic video reviews near you or record your first 60s review.",
      timestamp: "Just now",
      createdAtMs: Date.now(),
      isRead: false
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
 * Send a official welcome notification to new users on their first sign in
 */
export async function sendWelcomeNotificationIfNeeded(currentUser: UserProfile): Promise<void> {
  if (!currentUser) return;
  const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  const welcomeKey = `yoouz_welcome_sent_${userKey}`;
  const deletedSet = getDeletedNotifIds(userKey);

  if (!localStorage.getItem(welcomeKey) && !deletedSet.has(`welcome_notif_${userKey}`) && !deletedSet.has("all_cleared")) {
    localStorage.setItem(welcomeKey, "true");
    sendSocialNotification({
      recipientEmail: currentUser.email || userKey,
      recipientHandle: currentUser.name || userKey,
      recipientId: currentUser.userId || userKey,
      type: "follow",
      user: {
        name: "Yoouz Team",
        avatar: "/yoouz-facebook-avatar.png",
        email: "team@yoouz.com"
      },
      text: "Welcome to Yoouz! Real people, real reviews. Explore authentic video reviews near you or record your first 60s review."
    }).catch(() => {});
  }
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

  // Ensure first-time signups receive the official welcome notification
  sendWelcomeNotificationIfNeeded(currentUser);

  let isDisposed = false;
  let cachedNotifs: CopoNotification[] = [];
  const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
  const cacheKey = `copo_cached_notifs_${userKey}`;

  const updateList = (newItems: CopoNotification[]) => {
    if (isDisposed) return;
    cachedNotifs = newItems;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(newItems));
    } catch (e) {}
    onUpdate(newItems);
  };

  // 0. Immediate load from LocalStorage cache so notifications never disappear on refresh
  try {
    const rawCache = localStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedNotifs = parsed;
        onUpdate(parsed);
      }
    }
  } catch (e) {}

  // 1. Initial immediate fetch from Bunny Cloud Database
  const fetchFromBunny = async () => {
    try {
      const res = await fetch("/api/nosql/notifications");
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || json.data || []);
        if (Array.isArray(items) && !isDisposed) {
          const filtered = filterNotificationsForUser(items, currentUser);
          updateList(filtered);
        }
      }
    } catch (e) {}
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
    }
  });

  // 3. Periodic Background Sync (every 4 seconds) for infallible consistency
  const pollTimer = setInterval(fetchFromBunny, 4000);

  return () => {
    isDisposed = true;
    clearInterval(pollTimer);
    unregisterSse();
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string, currentUser?: UserProfile | null): Promise<void> {
  if (!notificationId) return;

  if (currentUser) {
    try {
      const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
      const cacheKey = `copo_cached_notifs_${userKey}`;
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((n: any) => n.id === notificationId ? { ...n, isRead: true, read: true } : n);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  }

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

  if (currentUser) {
    try {
      const userKey = (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim();
      const cacheKey = `copo_cached_notifs_${userKey}`;
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const idSet = new Set(notificationIds);
          const updated = parsed.map((n: any) => idSet.has(n.id) ? { ...n, isRead: true, read: true } : n);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  }

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

  const userKey = currentUser
    ? (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim()
    : "";

  recordDeletedNotifId(notificationId, userKey);

  if (userKey) {
    try {
      const cacheKey = `copo_cached_notifs_${userKey}`;
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((n: any) => n.id !== notificationId);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  }

  fetch(`/api/nosql/notifications/${notificationId}`, {
    method: "DELETE"
  }).catch(() => {});
}

/**
 * Clear all notifications for user
 */
export async function clearAllNotifications(notificationIds: string[], currentUser?: UserProfile | null): Promise<void> {
  const userKey = currentUser
    ? (currentUser.email || currentUser.userId || (currentUser as any).id || "anon").toLowerCase().trim()
    : "";

  recordDeletedNotifId("all_cleared", userKey);

  if (Array.isArray(notificationIds)) {
    for (const id of notificationIds) {
      deleteNotification(id, currentUser);
    }
  }

  if (userKey) {
    try {
      const cacheKey = `copo_cached_notifs_${userKey}`;
      localStorage.setItem(cacheKey, JSON.stringify([]));
    } catch (e) {}
  }
}

/**
 * Filter and format chat threads for the current user
 */
function processChatThreadsForUser(rawItems: any[], currentUser: UserProfile): CopoMessage[] {
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userId = (currentUser.userId || (currentUser as any).id || "").toLowerCase().trim();

  const threads: CopoMessage[] = [];

  for (const data of rawItems) {
    if (!data) continue;
    const participants: string[] = Array.isArray(data.participants)
      ? data.participants.map((p: string) => (p || "").toLowerCase().trim().replace(/^@/, ""))
      : [];

    const senderEmail = (data.senderEmail || data.lastSenderEmail || "").toLowerCase().trim();
    const senderId = (data.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const senderName = (data.senderName || data.lastSenderName || "").toLowerCase().trim();
    const recipientEmail = (data.recipientEmail || "").toLowerCase().trim();
    const recipientId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");
    const recipientName = (data.recipientName || "").toLowerCase().trim();

    const isGenericName = !userName || userName === "reviewer" || userName === "user" || userName === "local guide" || userName === "guest";

    const isAvtErtuop = userEmail.includes("avr6566gd") || userName === "avt ertuop" || userHandle === "avtertuop" || userId.includes("avr6566gd") || userName.includes("avt") || userHandle.includes("avt") || userId.includes("avt");
    const isAouisesmee = userEmail.includes("aouisesmee") || userName.includes("aouisesmee") || userHandle.includes("aouisesmee") || userId.includes("aouisesmee") || userEmail.includes("4samet") || userName.includes("4samet") || userId.includes("4samet");
    const isBizRiv = userEmail.includes("louis42111") || userName === "biz riv" || userHandle === "bizriv" || userId.includes("louis42111") || userEmail.includes("biz") || userName.includes("biz");

    const matchesAvtErtuop = isAvtErtuop && (
      participants.some(p => p.includes("avr6566gd") || p === "avt ertuop" || p === "avtertuop" || p.includes("canon_user_avtertuop") || p.includes("avt")) ||
      senderEmail.includes("avr6566gd") || senderEmail.includes("avt") || recipientEmail.includes("avr6566gd") || recipientEmail.includes("avt") ||
      senderName.includes("avt") || recipientName.includes("avt")
    );
    const matchesAouisesmee = isAouisesmee && (
      participants.some(p => p.includes("aouisesmee") || p.includes("4samet") || p.includes("canon_user_aouisesmee")) ||
      senderEmail.includes("aouisesmee") || senderEmail.includes("4samet") || recipientEmail.includes("aouisesmee") || recipientEmail.includes("4samet") ||
      senderName.includes("aouisesmee") || senderName.includes("4samet") || recipientName.includes("aouisesmee") || recipientName.includes("4samet")
    );
    const matchesBizRiv = isBizRiv && (
      participants.some(p => p.includes("louis42111") || p === "biz riv" || p === "bizriv" || p.includes("canon_user_bizriv") || p.includes("biz")) ||
      senderEmail.includes("louis42111") || senderEmail.includes("biz") || recipientEmail.includes("louis42111") || recipientEmail.includes("biz") ||
      senderName.includes("biz") || recipientName.includes("biz")
    );

    const isParticipant =
      matchesAvtErtuop ||
      matchesAouisesmee ||
      matchesBizRiv ||
      (userEmail && (participants.includes(userEmail) || senderEmail === userEmail || recipientEmail === userEmail || senderId === userEmail || recipientId === userEmail)) ||
      (emailPrefix && (participants.includes(emailPrefix) || senderId === emailPrefix || recipientId === emailPrefix || senderEmail.startsWith(emailPrefix) || recipientEmail.startsWith(emailPrefix))) ||
      (userHandle && (participants.includes(userHandle) || senderId === userHandle || recipientId === userHandle)) ||
      (!isGenericName && (participants.includes(userName) || senderName === userName || recipientName === userName)) ||
      (userId && (participants.includes(userId) || senderId === userId || recipientId === userId));

    if (isParticipant) {
      let otherName = data.senderName || data.recipientName || "Yoouz Member";
      let otherAvatar = data.senderAvatar || data.recipientAvatar || `/api/avatar?name=${encodeURIComponent(otherName)}&background=27272a&color=fff`;
      let otherId = data.senderId || data.recipientId || String(data.id);

      if (data.participantProfiles && typeof data.participantProfiles === "object") {
        const otherKey = Object.keys(data.participantProfiles).find((k) => {
          const normK = k.toLowerCase().replace(/^@/, "").trim();
          const isKeyMe = (
            normK === userEmail ||
            normK === emailPrefix ||
            normK === userHandle ||
            normK === userName ||
            normK === userId ||
            (isAouisesmee && (normK.includes("aouisesmee") || normK.includes("4samet"))) ||
            (isAvtErtuop && (normK.includes("avr6566gd") || normK.includes("avt"))) ||
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
          (isAvtErtuop ? (data.unreadCounts["avr6566gd@gmail.com"] ?? data.unreadCounts["avr6566gd"] ?? data.unreadCounts["avt ertuop"] ?? data.unreadCounts["avtertuop"] ?? data.unreadCounts["avt"]) : undefined) ??
          (isAouisesmee ? (data.unreadCounts["aouisesmee@gmail.com"] ?? data.unreadCounts["aouisesmee"] ?? data.unreadCounts["4samet@gmail.com"] ?? data.unreadCounts["4samet"]) : undefined) ??
          (isBizRiv ? (data.unreadCounts["louis42111@gmail.com"] ?? data.unreadCounts["louis42111"] ?? data.unreadCounts["biz riv"] ?? data.unreadCounts["bizriv"]) : undefined) ??
          0;
      } else if (data.lastSenderEmail && data.lastSenderEmail.toLowerCase() !== userEmail) {
        unreadCount = data.unreadCount || 1;
      }

      const rawHistory = Array.isArray(data.history) ? data.history : [];
      const processedHistory = rawHistory.map((m: any) => {
        const msgSenderEmail = (m.senderEmail || "").toLowerCase().trim();
        const msgSenderId = (m.senderId || "").toLowerCase().trim().replace(/^@/, "");
        const msgSenderName = (m.senderName || "").toLowerCase().trim();

        const isSender =
          (userEmail && (msgSenderEmail === userEmail || msgSenderId === userEmail)) ||
          (emailPrefix && (msgSenderEmail.startsWith(emailPrefix) || msgSenderId === emailPrefix)) ||
          (userHandle && (msgSenderId === userHandle || msgSenderName === userHandle)) ||
          (userName && msgSenderName === userName) ||
          (userId && msgSenderId === userId) ||
          (isAouisesmee && (msgSenderEmail.includes("aouisesmee") || msgSenderEmail.includes("4samet") || msgSenderName.includes("aouisesmee") || msgSenderName.includes("4samet"))) ||
          (isAvtErtuop && (msgSenderEmail.includes("avr6566gd") || msgSenderName.includes("avt") || msgSenderId.includes("avt"))) ||
          (isBizRiv && (msgSenderEmail.includes("louis42111") || msgSenderName.includes("biz") || msgSenderId.includes("biz")));

        return {
          id: m.id || `msg_${Date.now()}_${Math.random()}`,
          senderName: m.senderName || "Member",
          senderAvatar: m.senderAvatar || `/api/avatar?name=${encodeURIComponent(m.senderName || "User")}&background=27272a&color=fff`,
          text: m.text || "",
          timestamp: m.timestamp || "Just now",
          createdAtMs: m.createdAt,
          isMe: Boolean(isSender),
          videoThumbnail: m.videoThumbnail,
          videoId: m.videoId
        };
      });

      threads.push({
        id: String(data.id),
        senderId: otherId,
        senderName: otherName,
        senderAvatar: otherAvatar,
        senderEmail: data.senderEmail,
        recipientEmail: data.recipientEmail,
        lastMessage: data.lastMessage || (processedHistory[processedHistory.length - 1]?.text ?? "Conversation started"),
        timestamp: data.timestamp || "Just now",
        createdAtMs: data.updatedAt || data.createdAt || (processedHistory[processedHistory.length - 1]?.createdAtMs) || Date.now(),
        unreadCount: Number(unreadCount) || 0,
        videoPreviewUrl: data.videoPreviewUrl,
        history: processedHistory
      });
    }
  }

  // Sort threads newest first
  threads.sort((a, b) => {
    const timeA = a.createdAtMs || (a as any).updatedAt || 0;
    const timeB = b.createdAtMs || (b as any).updatedAt || 0;
    return timeB - timeA;
  });

  return threads;
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
    cachedThreads = newThreads;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(newThreads));
    } catch (e) {}
    onUpdate(newThreads);
  };

  // 0. Immediate load from LocalStorage cache so messages never disappear on refresh
  try {
    const rawCache = localStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedThreads = parsed;
        onUpdate(parsed);
      }
    }
  } catch (e) {}

  // 1. Initial immediate fetch from Bunny Cloud Database
  const fetchFromBunny = async () => {
    try {
      const res = await fetch("/api/nosql/chats");
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || json.data || []);
        if (Array.isArray(items) && !isDisposed) {
          const processed = processChatThreadsForUser(items, currentUser);
          const serverThreadIds = new Set(processed.map((t) => t.id));
          const pendingThreads = cachedThreads.filter((t) => !serverThreadIds.has(t.id));
          const merged = [...pendingThreads, ...processed];
          updateThreads(merged);
        }
      }
    } catch (e) {}
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
          const existingIdx = cachedThreads.findIndex((t) => t.id === freshThread.id);
          let nextThreads: CopoMessage[];
          if (existingIdx >= 0) {
            nextThreads = [...cachedThreads];
            nextThreads[existingIdx] = freshThread;
          } else {
            nextThreads = [freshThread, ...cachedThreads];
          }
          nextThreads.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          updateThreads(nextThreads);
        }
      }
    }
  });

  // 3. Fallback background sync (every 4 seconds)
  const pollTimer = setInterval(fetchFromBunny, 4000);

  return () => {
    isDisposed = true;
    clearInterval(pollTimer);
    unregisterSse();
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
  customVideoId?: string
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

  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId: userEmail || currentUser.name,
    senderEmail: userEmail,
    senderName: currentUser.name || "Reviewer",
    senderAvatar: currentUser.avatar || `/api/avatar?name=${encodeURIComponent(currentUser.name || "User")}&background=27272a&color=fff`,
    text: messageText.trim(),
    timestamp: "Just now",
    createdAt: Date.now(),
    isMe: true,
    videoThumbnail: sanitizedThumbnail,
    videoId: customVideoId
  };

  let existingHistory: any[] = [];
  let prevRecipientUnread = 0;

  // 1. Try reading prior thread history from Bunny DB or Firestore
  try {
    const res = await fetch(`/api/nosql/chats/${threadId}`);
    if (res.ok) {
      const d = await res.json();
      if (Array.isArray(d.history)) {
        existingHistory = d.history;
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

  const fullHistory = [...existingHistory, newMessage];

  const canonicalAliases: string[] = [];
  if (recipientName.toLowerCase() === "avt ertuop" || recipientEmail === "avr6566gd@gmail.com" || recipientId.includes("avtertuop") || recipientId.includes("avt")) {
    canonicalAliases.push("avr6566gd@gmail.com", "avr6566gd", "avt ertuop", "avtertuop", "canon_user_avtertuop", "avt");
  }
  if (recipientName.toLowerCase() === "biz riv" || recipientEmail === "louis42111@gmail.com" || recipientId.includes("bizriv") || recipientId.includes("biz")) {
    canonicalAliases.push("louis42111@gmail.com", "louis42111", "biz riv", "bizriv", "canon_user_bizriv", "biz");
  }
  if (recipientName.toLowerCase().includes("aouisesmee") || recipientEmail === "aouisesmee@gmail.com" || recipientEmail.includes("4samet") || recipientId.includes("aouisesmee") || recipientId.includes("4samet")) {
    canonicalAliases.push("aouisesmee@gmail.com", "aouisesmee", "canon_user_aouisesmee", "4samet@gmail.com", "4samet");
  }
  if (userName.toLowerCase() === "avt ertuop" || userEmail === "avr6566gd@gmail.com" || userEmail.includes("avt") || userName.toLowerCase().includes("avt")) {
    canonicalAliases.push("avr6566gd@gmail.com", "avr6566gd", "avt ertuop", "avtertuop", "canon_user_avtertuop", "avt");
  }
  if (userName.toLowerCase() === "biz riv" || userEmail === "louis42111@gmail.com" || userEmail.includes("biz") || userName.toLowerCase().includes("biz")) {
    canonicalAliases.push("louis42111@gmail.com", "louis42111", "biz riv", "bizriv", "canon_user_bizriv", "biz");
  }
  if (userName.toLowerCase().includes("aouisesmee") || userEmail === "aouisesmee@gmail.com" || userEmail.includes("4samet") || userName.toLowerCase().includes("4samet")) {
    canonicalAliases.push("aouisesmee@gmail.com", "aouisesmee", "canon_user_aouisesmee", "4samet@gmail.com", "4samet");
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
      ...((recipientEmail === "avr6566gd@gmail.com" || recipientId.includes("avtertuop") || recipientName.toLowerCase() === "avt ertuop" || recipientId.includes("avt")) ? {
        "avr6566gd@gmail.com": nextUnreadCount,
        "avr6566gd": nextUnreadCount,
        "avt ertuop": nextUnreadCount,
        "avtertuop": nextUnreadCount,
        "avt": nextUnreadCount
      } : {}),
      ...((recipientEmail === "louis42111@gmail.com" || recipientId.includes("bizriv") || recipientName.toLowerCase() === "biz riv" || recipientId.includes("biz")) ? {
        "louis42111@gmail.com": nextUnreadCount,
        "louis42111": nextUnreadCount,
        "biz riv": nextUnreadCount,
        "bizriv": nextUnreadCount,
        "biz": nextUnreadCount
      } : {}),
      ...((recipientEmail.includes("aouisesmee") || recipientEmail.includes("4samet") || recipientName.toLowerCase().includes("aouisesmee") || recipientName.toLowerCase().includes("4samet")) ? {
        "aouisesmee@gmail.com": nextUnreadCount,
        "aouisesmee": nextUnreadCount,
        "4samet@gmail.com": nextUnreadCount,
        "4samet": nextUnreadCount
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
      isMe: (m.senderEmail && m.senderEmail.toLowerCase() === userEmail) || (m.senderId && m.senderId === userEmail) || true,
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
  const isAou = userEmail.includes("aouisesmee") || userEmail.includes("4samet") || userName.includes("aouisesmee") || userName.includes("4samet") || userId.includes("aouisesmee");
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
    unreadCountsUpdates["4samet@gmail.com"] = 0;
    unreadCountsUpdates["4samet"] = 0;
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
 * Delete a chat thread from Bunny Cloud Database
 */
export async function deleteChatThread(threadId: string): Promise<void> {
  if (!threadId) return;
  
  // Primary delete in BunnyDB
  fetch(`/api/nosql/chats/${threadId}`, {
    method: "DELETE"
  }).catch(() => {});
}

// Aliases for seamless backward compatibility
export const sendChatMessageToFirestore = sendChatMessage;
export const deleteChatThreadFromFirestore = deleteChatThread;
