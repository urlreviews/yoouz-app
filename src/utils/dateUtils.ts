export function parseTimestampToMs(raw: any): number | null {
  if (typeof raw === "number" && !isNaN(raw) && raw > 1500000000000 && raw < 2500000000000) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim()) {
    const s = raw.trim();
    if (/^\d{12,14}$/.test(s)) {
      const n = Number(s);
      if (!isNaN(n) && n > 1500000000000 && n < 2500000000000) return n;
    }
    // Match 13-digit millisecond timestamp embedded in string/ID (e.g. notif_179019... or rev-178984...)
    const idMatch = s.match(/(17\d{11})/);
    if (idMatch) {
      const num = Number(idMatch[1]);
      if (!isNaN(num) && num > 1500000000000 && num < 2500000000000) return num;
    }
    // Try ISO or SQL date string
    const iso = s.includes("T")
      ? (s.endsWith("Z") ? s : s + "Z")
      : s.replace(" ", "T") + (s.endsWith("Z") ? "" : "Z");
    const parsedIso = Date.parse(iso);
    if (!isNaN(parsedIso) && parsedIso > 1500000000000 && parsedIso < 2500000000000) {
      return parsedIso;
    }
    const std = Date.parse(s);
    if (!isNaN(std) && std > 1500000000000 && std < 2500000000000) {
      return std;
    }
  }
  return null;
}

export function formatRecordedDate(recordedAt?: string, createdAtMs?: number): string {
  const targetMs = parseTimestampToMs(createdAtMs) ?? parseTimestampToMs(recordedAt);

  if (targetMs && targetMs > 0) {
    const diffMs = Date.now() - targetMs;
    // Clock drift guard: if diffMs is negative (e.g. client is slightly behind server), treat as Just now
    if (diffMs < 45000) return "Just now";
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${Math.max(1, diffMin)}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return "1 week ago";
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    const date = new Date(targetMs);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (!recordedAt) return "Recently";

  const lower = recordedAt.toLowerCase().trim();
  if (
    lower.includes("ago") ||
    lower.includes("yesterday") ||
    lower.includes("today")
  ) {
    return recordedAt;
  }

  return "Recently";
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
