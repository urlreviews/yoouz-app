export function formatRecordedDate(recordedAt?: string, createdAtMs?: number): string {
  if (createdAtMs && createdAtMs > 0) {
    const diffMs = Date.now() - createdAtMs;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return "1 week ago";
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    const date = new Date(createdAtMs);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (!recordedAt) return "Recently";

  const lower = recordedAt.toLowerCase().trim();
  if (
    lower.includes("ago") ||
    lower.includes("yesterday") ||
    lower.includes("today") ||
    lower.includes("just now")
  ) {
    return recordedAt;
  }

  const parsedTime = Date.parse(recordedAt);
  if (!isNaN(parsedTime)) {
    const diffMs = Date.now() - parsedTime;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return "1 week ago";
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    const date = new Date(parsedTime);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return recordedAt;
}

export function formatChatMessageTime(timestamp?: string, createdAtMs?: number): string {
  if (createdAtMs && createdAtMs > 0) {
    const now = Date.now();
    const diffMs = now - createdAtMs;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";

    const msgDate = new Date(createdAtMs);
    const nowDate = new Date(now);
    const isToday = msgDate.toDateString() === nowDate.toDateString();

    const timeStr = msgDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    if (isToday) {
      return timeStr;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = msgDate.toDateString() === yesterday.toDateString();
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const isThisYear = msgDate.getFullYear() === nowDate.getFullYear();
    if (isThisYear) {
      const monthDay = msgDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${monthDay}, ${timeStr}`;
    }

    return msgDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (!timestamp) return "Just now";

  const lower = timestamp.toLowerCase().trim();
  if (lower === "just now" || lower === "now") return "Just now";

  const parsed = Date.parse(timestamp);
  if (!isNaN(parsed)) {
    return formatChatMessageTime(undefined, parsed);
  }

  return timestamp;
}
