import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "./firebase";
import { CopoNotification, CopoMessage, UserProfile } from "../types";

export interface CreateNotificationParams {
  recipientEmail?: string;
  recipientHandle?: string;
  recipientId?: string;
  type: "like" | "comment" | "follow" | "repost" | "message";
  user: {
    name: string;
    ////handle: string;
    avatar: string;
    email?: string;
  };
  text: string;
  videoId?: string;
  videoThumbnail?: string;
  placeName?: string;
}

// Clean object helper to ensure Firestore never receives undefined
function sanitizeData(obj: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
}

/**
 * Send a notification to a recipient in Firestore
 */
export async function sendSocialNotification(params: CreateNotificationParams): Promise<void> {
  if (!db) return;

  const targetEmail = (params.recipientEmail || "").trim().toLowerCase();
  const targetHandle = (params.recipientHandle || "").trim().toLowerCase().replace(/^@/, "");
  const targetId = (params.recipientId || "").trim().toLowerCase().replace(/^@/, "");
  const senderEmail = (params.user.email || "").trim().toLowerCase();

  // Do not send notifications to oneself
  if (targetEmail && senderEmail && targetEmail === senderEmail) {
    return;
  }

  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const notifDocRef = doc(db, "notifications", notifId);

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
    recipientId: targetId,
    type: params.type,
    user: {
      name: params.user.name || "Yoouz Member",
      ////handle: (params.user.name || "").replace(/^@/, "") || params.user.name?.toLowerCase().replace(/\s+/g, "") || "member",
      avatar: params.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(params.user.name || "User")}&background=1a73e8&color=fff`,
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

  try {
    await setDoc(notifDocRef, payload);
  } catch (err) {
    console.warn("Error saving notification to Firestore:", err);
  }
}

/**
 * Real-time subscription to notifications for the current user
 */
export function subscribeToNotifications(
  currentUser: UserProfile | null,
  onUpdate: (notifications: CopoNotification[]) => void
): () => void {
  if (!db || !currentUser) {
    onUpdate([]);
    return () => {};
  }

  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userId = (currentUser.userId || "").toLowerCase().trim();

  try {
    const notifsRef = collection(db, "notifications");
    const unsubscribe = onSnapshot(
      notifsRef,
      (snapshot) => {
        const list: CopoNotification[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const senderEmail = (data.user?.email || "").toLowerCase().trim();

          // Don't show notifications created by current user
          if (userEmail && senderEmail && senderEmail === userEmail) {
            return;
          }

          const recEmail = (data.recipientEmail || "").toLowerCase().trim();
          const recHandle = (data.recipientHandle || "").toLowerCase().trim().replace(/^@/, "");
          const recId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");

          // Robust recipient matching
          const isForMe =
            (userEmail && (recEmail === userEmail || recId === userEmail || recHandle === userEmail)) ||
            (emailPrefix && (recEmail === emailPrefix || recHandle === emailPrefix || recId === emailPrefix || recEmail.startsWith(emailPrefix))) ||
            (userHandle && (recHandle === userHandle || recId === userHandle || recEmail.includes(userHandle))) ||
            (userName && (recHandle === userName || recId === userName || recEmail === userName)) ||
            (userId && (recId === userId || recEmail === userId));

          if (isForMe) {
            list.push({
              id: docSnap.id,
              type: data.type || "like",
              user: {
                name: data.user?.name || "Yoouz Member",
                ////handle: data.user?.name ? `@${data.user.name.replace(/^@/, "")}` : "@member",
                avatar: data.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user?.name || "User")}&background=1a73e8&color=fff`
              },
              text: data.text || "",
              timestamp: data.timestamp || "Recently",
              createdAtMs: data.createdAt,
              videoId: data.videoId,
              videoThumbnail: data.videoThumbnail,
              isRead: Boolean(data.isRead)
            });
          }
        });

        // Sort with newest on top
        list.sort((a, b) => {
          const timeA = a.createdAtMs || (a as any).createdAt || 0;
          const timeB = b.createdAtMs || (b as any).createdAt || 0;
          return timeB - timeA;
        });

        onUpdate(list);
      },
      (error) => {
        console.warn("Notifications subscription error:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Failed to subscribe to notifications:", err);
    return () => {};
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!db || !notificationId) return;
  try {
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, { isRead: true });
  } catch (err) {
    console.warn("Error marking notification read:", err);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(notificationIds: string[]): Promise<void> {
  if (!db || notificationIds.length === 0) return;
  for (const id of notificationIds) {
    try {
      const notifRef = doc(db, "notifications", id);
      await updateDoc(notifRef, { isRead: true });
    } catch (err) {
      console.warn("Error updating notification:", err);
    }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  if (!db || !notificationId) return;
  try {
    const notifRef = doc(db, "notifications", notificationId);
    await deleteDoc(notifRef);
  } catch (err) {
    console.warn("Error deleting notification:", err);
  }
}

/**
 * Real-time subscription to private chat threads for the current user
 */
export function subscribeToChats(
  currentUser: UserProfile | null,
  onUpdate: (threads: CopoMessage[]) => void
): () => void {
  if (!db || !currentUser) {
    onUpdate([]);
    return () => {};
  }

  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();
  const userId = (currentUser.userId || "").toLowerCase().trim();

  try {
    const chatsRef = collection(db, "chats");
    const unsubscribe = onSnapshot(
      chatsRef,
      (snapshot) => {
        const threads: CopoMessage[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const participants = Array.isArray(data.participants)
            ? data.participants.map((p: string) => (p || "").toLowerCase().trim().replace(/^@/, ""))
            : [];

          const senderEmail = (data.senderEmail || data.lastSenderEmail || "").toLowerCase().trim();
          const senderId = (data.senderId || "").toLowerCase().trim().replace(/^@/, "");
          const senderName = (data.senderName || data.lastSenderName || "").toLowerCase().trim();
          const recipientEmail = (data.recipientEmail || "").toLowerCase().trim();
          const recipientId = (data.recipientId || "").toLowerCase().trim().replace(/^@/, "");
          const recipientName = (data.recipientName || "").toLowerCase().trim();

          const isGenericName = !userName || userName === "reviewer" || userName === "user" || userName === "local guide" || userName === "guest";

          // Check if current user is part of this chat thread
          const isParticipant =
            (userEmail && (participants.includes(userEmail) || senderEmail === userEmail || recipientEmail === userEmail || senderId === userEmail || recipientId === userEmail)) ||
            (emailPrefix && (participants.includes(emailPrefix) || senderId === emailPrefix || recipientId === emailPrefix || senderEmail.startsWith(emailPrefix) || recipientEmail.startsWith(emailPrefix))) ||
            (userHandle && (participants.includes(userHandle) || senderId === userHandle || recipientId === userHandle)) ||
            (!isGenericName && (participants.includes(userName) || senderName === userName || recipientName === userName)) ||
            (userId && (participants.includes(userId) || senderId === userId || recipientId === userId));

          if (isParticipant) {
            // Find other participant info
            let otherName = data.senderName || data.recipientName || "Yoouz Member";
            let otherAvatar = data.senderAvatar || data.recipientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=1a73e8&color=fff`;
            let otherId = data.senderId || data.recipientId || docSnap.id;

            if (data.participantProfiles && typeof data.participantProfiles === "object") {
              const otherKey = Object.keys(data.participantProfiles).find((k) => {
                const normK = k.toLowerCase().replace(/^@/, "").trim();
                return (
                  normK !== userEmail &&
                  normK !== emailPrefix &&
                  normK !== userHandle &&
                  normK !== userName &&
                  normK !== userId
                );
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

            // Calculate unread count for current user
            let unreadCount = 0;
            if (data.unreadCounts && typeof data.unreadCounts === "object") {
              unreadCount =
                data.unreadCounts[userEmail] ??
                data.unreadCounts[emailPrefix] ??
                data.unreadCounts[userHandle] ??
                data.unreadCounts[userName] ??
                data.unreadCounts[userId] ??
                0;
            } else if (data.lastSenderEmail && data.lastSenderEmail.toLowerCase() !== userEmail) {
              unreadCount = data.unreadCount || 1;
            }

            // Process message history to correctly set `isMe` for the viewing user
            const rawHistory = Array.isArray(data.history) ? data.history : [];
            const processedHistory = rawHistory.map((m: any) => {
              const msgSenderEmail = (m.senderEmail || "").toLowerCase().trim();
              const msgSenderId = (m.senderId || "").toLowerCase().trim().replace(/^@/, "");
              const msgSenderName = (m.senderName || "").toLowerCase().trim();

              const isSender =
                (userEmail && (msgSenderEmail === userEmail || msgSenderId === userEmail)) ||
                (emailPrefix && (msgSenderEmail.startsWith(emailPrefix) || msgSenderId === emailPrefix)) ||
                (userHandle && msgSenderId === userHandle) ||
                (userName && msgSenderName === userName) ||
                (userId && msgSenderId === userId);

              return {
                id: m.id || `msg_${Date.now()}_${Math.random()}`,
                senderName: m.senderName || "Member",
                senderAvatar: m.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.senderName || "User")}&background=1a73e8&color=fff`,
                text: m.text || "",
                timestamp: m.timestamp || "Just now",
                createdAtMs: m.createdAt,
                isMe: Boolean(isSender),
                videoThumbnail: m.videoThumbnail,
                videoId: m.videoId
              };
            });

            threads.push({
              id: docSnap.id,
              senderId: otherId,
              senderName: otherName,
              senderAvatar: otherAvatar,
              lastMessage: data.lastMessage || (processedHistory[processedHistory.length - 1]?.text ?? "Conversation started"),
              timestamp: data.timestamp || "Just now",
              createdAtMs: data.updatedAt || data.createdAt || (processedHistory[processedHistory.length - 1]?.createdAtMs) || Date.now(),
              unreadCount: Number(unreadCount) || 0,
              videoPreviewUrl: data.videoPreviewUrl,
              history: processedHistory
            });
          }
        });

        // Sort threads by updatedAt or last activity
        threads.sort((a, b) => {
          const timeA = a.createdAtMs || (a as any).updatedAt || 0;
          const timeB = b.createdAtMs || (b as any).updatedAt || 0;
          return timeB - timeA;
        });

        onUpdate(threads);
      },
      (error) => {
        console.warn("Chats subscription error:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Failed to subscribe to chats:", err);
    return () => {};
  }
}

/**
 * Send a message within a chat thread and persist to Firestore
 */
export async function sendChatMessageToFirestore(
  threadId: string,
  messageText: string,
  currentUser: UserProfile,
  recipient: { id: string; name: string; avatar: string; email?: string },
  videoUrl?: string,
  customVideoId?: string
): Promise<CopoMessage> {
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const userName = (currentUser.name || "").trim();
  const userHandle = (currentUser.name || currentUser.name || "").replace(/^@/, "").trim().toLowerCase();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";

  const recipientEmail = (recipient.email || "").toLowerCase().trim();
  const recipientId = (recipient.id || "").trim().replace(/^@/, "");
  const recipientName = (recipient.name || "").trim();
  const recipientHandle = recipientId || recipientName.toLowerCase().replace(/\s+/g, "");

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
    senderName: currentUser.name || "Local Guide",
    senderAvatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "User")}&background=1a73e8&color=fff`,
    text: messageText.trim(),
    timestamp: "Just now",
    createdAt: Date.now(),
    isMe: true,
    videoThumbnail: sanitizedThumbnail,
    videoId: customVideoId
  };

  const threadDocRef = doc(db, "chats", threadId);

  // Sync to Firestore
  try {
    let existingHistory: any[] = [];
    let prevRecipientUnread = 0;

    try {
      const snap = await getDoc(threadDocRef);
      if (snap.exists()) {
        const d = snap.data();
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
    } catch (readErr) {
      console.warn("Could not read prior chat thread:", readErr);
    }

    const fullHistory = [...existingHistory, newMessage];

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
          recipientName.toLowerCase()
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
        ...(recipientId && { [recipientId.toLowerCase()]: nextUnreadCount }),
        ...(recipientHandle && { [recipientHandle.toLowerCase()]: nextUnreadCount }),
        ...(recipientName && { [recipientName.toLowerCase()]: nextUnreadCount })
      }
    });

    // Save document with full history array to Firestore
    await setDoc(threadDocRef, threadData, { merge: true });
    
    // Also send an activity notification to recipient
    const targetRecipient = recipientEmail || recipientId || recipientHandle;
    if (targetRecipient && targetRecipient.toLowerCase() !== userEmail && targetRecipient.toLowerCase() !== emailPrefix) {
      // Generate clean notification preview text
      let notifPreviewText = messageText.trim();
      // Remove any trailing ellipsis or weird category tags
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
          ////handle: currentUser.email ? currentUser.email.split("@")[0] : (currentUser.name || "member"),
          avatar: currentUser.avatar,
          email: userEmail
        },
        text: `sent you a message: "${cleanNotifText}"`,
        videoThumbnail: videoUrl,
        videoId: customVideoId
      });
    }
  } catch (err) {
    console.warn("Error sending chat message to Firestore:", err);
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
    history: [newMessage]
  };
}

/**
 * Mark a thread as read for current user
 */
export async function markChatThreadAsRead(threadId: string, currentUser: UserProfile): Promise<void> {
  if (!db || !currentUser || !threadId) return;
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const emailPrefix = userEmail ? userEmail.split("@")[0].toLowerCase() : "";
  const userHandle = (currentUser.name || currentUser.name || "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  const userName = (currentUser.name || "").toLowerCase().trim();

  try {
    const threadDocRef = doc(db, "chats", threadId);
    
    const unreadCountsUpdates: Record<string, number> = {};
    if (userEmail) unreadCountsUpdates[userEmail] = 0;
    if (emailPrefix) unreadCountsUpdates[emailPrefix] = 0;
    if (userHandle) unreadCountsUpdates[userHandle] = 0;
    if (userName) unreadCountsUpdates[userName] = 0;
    if (currentUser.userId) unreadCountsUpdates[currentUser.userId] = 0;

    await setDoc(threadDocRef, { 
      unreadCount: 0,
      unreadCounts: unreadCountsUpdates 
    }, { merge: true });
  } catch (err) {
    console.warn("Error marking chat thread read:", err);
  }
}

/**
 * Delete a chat thread from Firestore
 */
export async function deleteChatThreadFromFirestore(threadId: string): Promise<void> {
  if (!db || !threadId) return;
  try {
    const threadDocRef = doc(db, "chats", threadId);
    await deleteDoc(threadDocRef);
  } catch (err) {
    console.warn("Error deleting chat thread:", err);
  }
}
