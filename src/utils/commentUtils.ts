import { ReviewComment } from "../types";

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

  // 1. Flatten and index all comments and any nested replies by ID
  rawComments.forEach((c) => {
    if (c && c.id) {
      const existing = allMap.get(c.id);
      if (existing) {
        allMap.set(c.id, {
          ...existing,
          ...c,
          replies: [...(existing.replies || []), ...(c.replies || [])]
        });
      } else {
        allMap.set(c.id, {
          ...c,
          replies: Array.isArray(c.replies) ? [...c.replies] : []
        });
      }

      // Also extract any nested replies in the input
      if (Array.isArray(c.replies)) {
        c.replies.forEach((r: any) => {
          if (r && r.id) {
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
