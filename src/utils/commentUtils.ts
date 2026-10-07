import { ReviewComment } from "../types";

export function sanitizeCommentUser(c: any): any {
  if (!c) return c;

  let name = (c.authorName || c.userName || "").trim();
  let handle = (c.authorHandle || c.userHandle || "").trim();
  let avatar = c.authorAvatar || c.userAvatar || "";
  let email = (c.authorEmail || c.userEmail || c.userId || "").trim().toLowerCase();

  // Known account mappings for 100% deterministic resolution
  if (email) {
    if (email.includes("aouisesmee") || email.includes("benblue")) {
      name = "Ben Blue";
      handle = "@benblue";
      avatar = avatar || "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20width%3D%22128%22%20height%3D%22128%22%3E%0A%20%20%20%20%3Crect%20width%3D%22128%22%20height%3D%22128%22%20fill%3D%22%231E88E5%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%2250%25%22%20y%3D%2254%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FFFFFF%22%20font-family%3D%22-apple-system%2C%20BlinkMacSystemFont%2C%20%27Google%20Sans%27%2C%20%27Segoe%20UI%27%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2267px%22%3EB%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E";
    } else if (email.includes("avr6566gd") || email.includes("stevenakan") || email.includes("steven")) {
      name = "Steven Akan";
      handle = "@stevenakan";
      avatar = avatar || "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20width%3D%22128%22%20height%3D%22128%22%3E%0A%20%20%20%20%3Crect%20width%3D%22128%22%20height%3D%22128%22%20fill%3D%22%237CB342%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%2250%25%22%20y%3D%2254%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FFFFFF%22%20font-family%3D%22-apple-system%2C%20BlinkMacSystemFont%2C%20%27Google%20Sans%27%2C%20%27Segoe%20UI%27%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2267px%22%3ES%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E";
    } else if (email.includes("4samet") || email.includes("bizriv")) {
      name = "Biz Riv";
      handle = "@bizriv";
    }
  }

  if (!name || name === "Reviewer" || name === "Copo Reviewer" || name === "User" || name === "Guest") {
    if (handle) {
      const cleanH = handle.replace(/^@+/, "").toLowerCase();
      if (cleanH.includes("benblue") || cleanH.includes("ben")) {
        name = "Ben Blue";
        handle = "@benblue";
      } else if (cleanH.includes("stevenakan") || cleanH.includes("steven")) {
        name = "Steven Akan";
        handle = "@stevenakan";
      } else if (cleanH.includes("bizriv") || cleanH.includes("4samet")) {
        name = "Biz Riv";
        handle = "@bizriv";
      }
    }
  }

  if (!name || name === "Reviewer" || name === "User" || name === "Copo Reviewer") {
    if (email && email.includes("@")) {
      const part = email.split("@")[0];
      name = part ? part.charAt(0).toUpperCase() + part.slice(1) : "Verified Reviewer";
    } else {
      name = "Verified Reviewer";
    }
  }

  if (!handle) {
    handle = `@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  } else if (!handle.startsWith("@")) {
    handle = `@${handle}`;
  }

  return {
    ...c,
    authorName: name,
    userName: name,
    authorHandle: handle,
    userHandle: handle,
    authorAvatar: avatar || c.authorAvatar || c.userAvatar,
    userAvatar: avatar || c.authorAvatar || c.userAvatar,
    authorEmail: email || c.authorEmail || c.userEmail || c.userId,
    userEmail: email || c.authorEmail || c.userEmail || c.userId,
    userId: email || c.userId || c.authorEmail || c.userEmail
  };
}

/**
 * Normalizes, de-duplicates, and structures comments into a canonical tree hierarchy:
 * - Top-level comments in chronological / newest-first order
 * - Nested replies grouped inside their parent's `replies` array
 * - Eliminates duplicate top-level entries for replies
 * - Computes the single source of truth comments count: top-level + all replies
 */
export function buildCommentTree(rawComments: any[]): { comments: ReviewComment[]; count: number } {
  if (!Array.isArray(rawComments) || rawComments.length === 0) {
    return { comments: [], count: 0 };
  }

  const allMap = new Map<string, ReviewComment>();

  // 1. Flatten and index all comments and any nested replies by ID with sanitized author details
  rawComments.forEach((raw) => {
    if (raw && raw.id) {
      const c = sanitizeCommentUser(raw);
      const existing = allMap.get(c.id);
      if (existing) {
        allMap.set(c.id, {
          ...existing,
          ...c,
          replies: [...(existing.replies || []), ...(c.replies || []).map(sanitizeCommentUser)]
        });
      } else {
        allMap.set(c.id, {
          ...c,
          replies: Array.isArray(c.replies) ? c.replies.map(sanitizeCommentUser) : []
        });
      }

      // Also extract any nested replies in the input
      if (Array.isArray(c.replies)) {
        c.replies.forEach((rRaw: any) => {
          if (rRaw && rRaw.id) {
            const r = sanitizeCommentUser(rRaw);
            const existingReply = allMap.get(r.id);
            const parentId = r.replyToId || c.id;
            if (existingReply) {
              allMap.set(r.id, { ...existingReply, ...r, replyToId: parentId });
            } else {
              allMap.set(r.id, { ...r, replyToId: parentId, replies: [] });
            }
          }
        });
      }
    }
  });

  const topLevel: ReviewComment[] = [];
  const replies: ReviewComment[] = [];

  // 2. Separate into top-level comments vs replies based on replyToId
  allMap.forEach((c) => {
    if (c.replyToId) {
      replies.push(c);
    } else {
      topLevel.push({ ...c, replies: [] });
    }
  });

  // 3. Attach replies to their parent comments
  replies.forEach((reply) => {
    const parent = topLevel.find((p) => p.id === reply.replyToId);
    if (parent) {
      if (!Array.isArray(parent.replies)) parent.replies = [];
      if (!parent.replies.some((r) => r.id === reply.id)) {
        parent.replies.push(reply);
      }
    } else {
      // Check if replying to another reply (nested thread)
      let placed = false;
      for (const p of topLevel) {
        if (Array.isArray(p.replies) && p.replies.some((r) => r.id === reply.replyToId)) {
          if (!p.replies.some((r) => r.id === reply.id)) {
            p.replies.push(reply);
          }
          placed = true;
          break;
        }
      }
      // If parent really not found, keep as top-level to prevent data loss
      if (!placed) {
        topLevel.push(reply);
      }
    }
  });

  // 4. Calculate exact canonical count
  let totalCount = 0;
  topLevel.forEach((c) => {
    totalCount += 1;
    if (Array.isArray(c.replies)) {
      totalCount += c.replies.length;
    }
  });

  return { comments: topLevel, count: totalCount };
}
