import { UserProfile } from "../types";
import { formatAnonymousUserDisplayName } from "../lib/userCanonicalization";

export function getThreadPartnerDetails(thread: any, currentUser: UserProfile | null) {
  if (!thread) return { name: "Member", avatar: "", email: "", id: "", handle: "", isBusiness: false };

  const uEmail = (currentUser?.email || "").toLowerCase().trim();
  const uId = (currentUser?.userId || (currentUser as any)?.id || (currentUser as any)?.uid || (currentUser as any)?.placeId || "").toLowerCase().trim().replace(/^@/, "");
  const uName = (currentUser?.name || "").toLowerCase().trim();
  const uHandle = ((currentUser as any)?.handle || "").toLowerCase().trim().replace(/^@/, "");
  const isCurUserBusiness = Boolean((currentUser as any)?.isBusiness || (currentUser as any)?.placeId || uId.startsWith("place_") || uId.includes("."));
  const uPlaceId = ((currentUser as any)?.placeId || (isCurUserBusiness ? uId : "")).toLowerCase().trim();
  const isCurYoouz = isCurUserBusiness && (uPlaceId === "yoouz.com" || uPlaceId === "yoouz" || uName === "yoouz" || uEmail.includes("info@yoouz.com") || uEmail.endsWith("@yoouz.com"));

  const isMsgFromMe = (msg: any) => {
    if (!msg) return false;
    if (msg.isMe === true || msg.isMe === "true" || msg.senderName === "you" || msg.senderName === "You") return true;
    const mEmail = (msg.senderEmail || "").toLowerCase().trim();
    const mId = (msg.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const mName = (msg.senderName || "").toLowerCase().trim();
    if (uEmail && (mEmail === uEmail || mId === uEmail)) return true;
    if (uId && (mId === uId || mEmail === uId)) return true;
    if (uHandle && (mId === uHandle || mName === uHandle)) return true;
    if (uName && uName !== "user" && uName !== "member" && uName !== "reviewer" && mName === uName) return true;
    if (isCurUserBusiness) {
      if (uPlaceId && (mId === uPlaceId || mEmail === uPlaceId)) return true;
      if (isCurYoouz && (mName === "yoouz" || mId === "yoouz" || mId === "yoouz.com" || mEmail.includes("info@yoouz.com") || mEmail.endsWith("@yoouz.com"))) return true;
    }
    return false;
  };

  const isIdentityMe = (name?: string, email?: string, id?: string) => {
    const cleanE = (email || "").toLowerCase().trim();
    const cleanId = (id || "").toLowerCase().trim().replace(/^@/, "");
    const cleanN = (name || "").toLowerCase().trim();
    if (uEmail && (cleanE === uEmail || cleanId === uEmail)) return true;
    if (uId && (cleanId === uId || cleanE === uId)) return true;
    if (uHandle && (cleanId === uHandle || cleanN === uHandle)) return true;
    if (uName && uName !== "user" && uName !== "member" && uName !== "reviewer" && cleanN === uName) return true;
    if (isCurUserBusiness) {
      if (uPlaceId && (cleanId === uPlaceId || cleanE === uPlaceId)) return true;
      if (isCurYoouz && (cleanN === "yoouz" || cleanId === "yoouz" || cleanId === "yoouz.com" || cleanE.includes("info@yoouz.com") || cleanE.endsWith("@yoouz.com"))) return true;
    }
    return false;
  };

  let partner: { name: string; avatar: string; email: string; id: string; handle: string; isBusiness: boolean } | null = null;

  if (Array.isArray(thread.history) && thread.history.length > 0) {
    for (let i = thread.history.length - 1; i >= 0; i--) {
      const m = thread.history[i];
      if (m && !isMsgFromMe(m)) {
        const mName = (m.senderName || "").trim();
        if (mName && mName.toLowerCase() !== "user" && mName.toLowerCase() !== "reviewer" && mName.toLowerCase() !== "member" && mName.toLowerCase() !== uName) {
          partner = {
            name: mName,
            avatar: m.senderAvatar || "",
            email: (m.senderEmail || "").toLowerCase().trim(),
            id: (m.senderId || "").toLowerCase().trim().replace(/^@/, ""),
            handle: ((m as any).senderHandle || "").toLowerCase().trim().replace(/^@/, ""),
            isBusiness: Boolean(thread.isBusiness || m.isBusiness)
          };
          break;
        }
      }
    }
  }

  if (!partner && thread.participantProfiles && typeof thread.participantProfiles === "object") {
    const profiles = Object.entries(thread.participantProfiles);
    for (const [key, p] of profiles) {
      if (!p || typeof p !== "object") continue;
      const pEmail = ((p as any).email || key || "").toLowerCase().trim();
      const pName = ((p as any).name || "").trim();
      const pId = ((p as any).id || key || "").toLowerCase().trim().replace(/^@/, "");
      if (!isIdentityMe(pName, pEmail, pId) && pName && pName.toLowerCase() !== "user" && pName.toLowerCase() !== "reviewer" && pName.toLowerCase() !== "member") {
        partner = {
          name: pName,
          avatar: (p as any).avatar || "",
          email: pEmail,
          id: pId,
          handle: ((p as any).handle || "").toLowerCase().trim().replace(/^@/, ""),
          isBusiness: Boolean(thread.isBusiness || (p as any).isBusiness)
        };
        break;
      }
    }
  }

  if (!partner) {
    const tSenderEmail = (thread.senderEmail || "").toLowerCase().trim();
    const tSenderId = (thread.senderId || "").toLowerCase().trim().replace(/^@/, "");
    const tSenderName = (thread.senderName || "").trim();
    const isSenderMe = isIdentityMe(tSenderName, tSenderEmail, tSenderId);

    if (isSenderMe) {
      const rName = (thread.recipientName || "").trim();
      const cleanRName = (rName && rName.toLowerCase() !== "user" && rName.toLowerCase() !== uName) ? rName : "";
      if (cleanRName) {
        partner = {
          name: cleanRName,
          avatar: thread.recipientAvatar || "",
          email: (thread.recipientEmail || "").toLowerCase().trim(),
          id: (thread.recipientId || "").toLowerCase().trim().replace(/^@/, ""),
          handle: ((thread as any).recipientHandle || "").toLowerCase().trim().replace(/^@/, ""),
          isBusiness: Boolean(thread.isBusiness)
        };
      }
    } else if (tSenderName && tSenderName.toLowerCase() !== "user" && tSenderName.toLowerCase() !== uName) {
      partner = {
        name: tSenderName,
        avatar: thread.senderAvatar || "",
        email: tSenderEmail,
        id: tSenderId,
        handle: ((thread as any).senderHandle || "").toLowerCase().trim().replace(/^@/, ""),
        isBusiness: Boolean(thread.isBusiness)
      };
    }
  }

  if (!partner) {
    const fallbackName = (thread.recipientName && thread.recipientName.toLowerCase() !== uName)
      ? thread.recipientName
      : (thread.senderName && thread.senderName.toLowerCase() !== uName)
      ? thread.senderName
      : thread.placeName || "Business / Member";

    const fallbackAvatar = thread.recipientAvatar || thread.senderAvatar || "";
    const fallbackEmail = (thread.recipientEmail || thread.senderEmail || "").toLowerCase().trim();
    const fallbackId = (thread.recipientId || thread.senderId || "").toLowerCase().trim().replace(/^@/, "");

    partner = {
      name: fallbackName,
      avatar: fallbackAvatar,
      email: fallbackEmail,
      id: fallbackId,
      handle: ((thread as any).recipientHandle || (thread as any).senderHandle || "").toLowerCase().trim().replace(/^@/, ""),
      isBusiness: Boolean(thread.isBusiness)
    };
  }

  const pNameLower = (partner.name || "").toLowerCase().trim();
  const pIdLower = (partner.id || "").toLowerCase().trim();

  if (isCurUserBusiness) {
    const isOtherBiz = Boolean(
      (pNameLower === "yoouz" && uPlaceId !== "yoouz.com" && uPlaceId !== "yoouz") ||
      (pIdLower === "yoouz.com" && uPlaceId !== "yoouz.com") ||
      pIdLower.startsWith("place_") ||
      pIdLower.startsWith("place-") ||
      (thread.placeId && thread.placeId.toLowerCase() !== uPlaceId) ||
      (thread.senderId && thread.senderId.toLowerCase() !== uPlaceId && (thread.senderId.toLowerCase().startsWith("place_") || thread.senderId.toLowerCase().startsWith("place-"))) ||
      (pIdLower.includes(".") && !pIdLower.includes("@"))
    );
    partner.isBusiness = isOtherBiz;
  } else {
    if (pNameLower === "yoouz" || pIdLower === "yoouz" || pIdLower === "yoouz.com" || partner.email === "info@yoouz.com" || thread.placeId === "yoouz.com") {
      partner.isBusiness = true;
      partner.name = "Yoouz";
      partner.id = "yoouz.com";
      if (!partner.avatar && thread.recipientAvatar) {
        partner.avatar = thread.recipientAvatar;
      }
    } else if (thread.placeId || (thread.isBusiness && !pIdLower.includes("@")) || (pIdLower.includes(".") && !pIdLower.includes("@")) || pIdLower.startsWith("place-") || pIdLower.startsWith("place_")) {
      partner.isBusiness = true;
      if (thread.placeName && (!partner.name || partner.name === "Member" || partner.name === "User")) {
        partner.name = thread.placeName;
      }
      if (thread.placeId && !partner.id) {
        partner.id = thread.placeId;
      }
    }
  }

  partner.name = formatAnonymousUserDisplayName(
    partner.name,
    partner.id || partner.email || thread.id,
    Boolean(partner.isBusiness)
  );

  return partner;
}
