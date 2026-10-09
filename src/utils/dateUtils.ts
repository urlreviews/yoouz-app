export function parseTimestampToMs(raw: any): number | null {
  if (typeof raw === "number" && !isNaN(raw)) {
    if (raw > 1500000000000 && raw < 2500000000000) return raw; // ms timestamp
    if (raw > 1500000000 && raw < 2500000000) return raw * 1000; // sec timestamp
  }
  if (typeof raw === "string" && raw.trim()) {
    const s = raw.trim();
    const lower = s.toLowerCase();
    if (lower === "just now" || lower === "now" || lower === "recently") return null;

    if (/^\d{12,14}$/.test(s)) {
      const n = Number(s);
      if (!isNaN(n) && n > 1500000000000 && n < 2500000000000) return n;
    }
    if (/^\d{10}$/.test(s)) {
      const n = Number(s);
      if (!isNaN(n) && n > 1500000000 && n < 2500000000) return n * 1000;
    }

    // Match 13-digit millisecond timestamp embedded in string/ID (e.g. msg_179019... or notif_179019... or rev-178984...)
    const msMatch = s.match(/(1[5-9]\d{11}|2\d{12})/);
    if (msMatch) {
      const num = Number(msMatch[1]);
      if (!isNaN(num) && num > 1500000000000 && num < 2500000000000) return num;
    }

    // Match 10-digit unix timestamp in string/ID
    const secMatch = s.match(/(1[5-9]\d{8}|2\d{9})/);
    if (secMatch) {
      const num = Number(secMatch[1]);
      if (!isNaN(num) && num > 1500000000 && num < 2500000000) return num * 1000;
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
    if (diffMs < 45000) {
      if (recordedAt && (recordedAt.toLowerCase().includes("yesterday") || recordedAt.toLowerCase().includes("ago") || recordedAt.toLowerCase().includes("day"))) {
        return recordedAt;
      }
      return "Just now";
    }
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${Math.max(1, diffMin)}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      if (recordedAt && (recordedAt.toLowerCase().includes("yesterday") || recordedAt.toLowerCase().includes("days ago"))) {
        return recordedAt;
      }
      return `${diffHr}h ago`;
    }
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

/**
 * Robustly resolve exact timestamp in milliseconds from a message object or raw value.
 * Handles embedded timestamps in IDs (msg_1790192617149_06ib), ISO strings, and createdAtMs.
 */
export function resolveMessageTimestampMs(msgOrTimestamp?: any, createdAtMs?: number): number {
  if (typeof createdAtMs === 'number' && createdAtMs > 1500000000000) return createdAtMs;
  if (!msgOrTimestamp) return 0;
  if (typeof msgOrTimestamp === 'number') {
    const p = parseTimestampToMs(msgOrTimestamp);
    if (p && p > 0) return p;
  }

  if (typeof msgOrTimestamp === 'object') {
    // 1. Check createdAtMs / createdAt / created_at
    const pCreatedAtMs = parseTimestampToMs(msgOrTimestamp.createdAtMs);
    if (pCreatedAtMs && pCreatedAtMs > 0) return pCreatedAtMs;

    const pCreatedAt = parseTimestampToMs(msgOrTimestamp.createdAt);
    if (pCreatedAt && pCreatedAt > 0) return pCreatedAt;

    const pCreated_at = parseTimestampToMs(msgOrTimestamp.created_at);
    if (pCreated_at && pCreated_at > 0) return pCreated_at;

    // 2. Check resolvedTime
    const pResolved = parseTimestampToMs(msgOrTimestamp.resolvedTime);
    if (pResolved && pResolved > 0) return pResolved;

    // 3. Check updatedAt / updated_at
    const pUpdated = parseTimestampToMs(msgOrTimestamp.updatedAt || msgOrTimestamp.updated_at);
    if (pUpdated && pUpdated > 0) return pUpdated;

    // 4. Check ISO / real string in timestamp
    if (typeof msgOrTimestamp.timestamp === 'string') {
      const p = parseTimestampToMs(msgOrTimestamp.timestamp);
      if (p && p > 0) return p;
    }

    // 5. Check embedded timestamp in id
    if (typeof msgOrTimestamp.id === 'string' || typeof msgOrTimestamp.id === 'number') {
      const p = parseTimestampToMs(msgOrTimestamp.id);
      if (p && p > 0) return p;
    }
  } else if (typeof msgOrTimestamp === 'string') {
    const p = parseTimestampToMs(msgOrTimestamp);
    if (p && p > 0) return p;
  }
  return 0;
}

/**
 * Check if two timestamps are on the exact same calendar day (local time)
 */
export function isSameCalendarDay(ms1: number, ms2: number): boolean {
  if (!ms1 || !ms2) return false;
  const d1 = new Date(ms1);
  const d2 = new Date(ms2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Date header separator pill (e.g. "Today", "Yesterday", "Wednesday, Sep 23", "Sep 24, 2026")
 * Matches standard UI conventions of WhatsApp, Telegram, iMessage, and Slack.
 */
export function formatChatDateDivider(timestampMs: number): string {
  if (!timestampMs || timestampMs <= 0) return "Earlier";
  const now = Date.now();
  const msgDate = new Date(timestampMs);
  const nowDate = new Date(now);

  if (isSameCalendarDay(timestampMs, now)) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(timestampMs, yesterday.getTime())) {
    return "Yesterday";
  }

  const diffDays = Math.floor((now - timestampMs) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    return msgDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  if (msgDate.getFullYear() === nowDate.getFullYear()) {
    return msgDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return msgDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Formats time only for chat bubbles (e.g. "7:51 AM", "12:05 PM").
 * Major platforms (WhatsApp, Telegram, iMessage, Signal) NEVER display "Just now" on a bubble.
 * They display the exact clock time of the message.
 */
export function formatMessageTimeOnly(timestampMs: number): string {
  const validMs = timestampMs > 0 ? timestampMs : Date.now();
  const msgDate = new Date(validMs);
  return msgDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Format conversation preview timestamp in inbox list (e.g. "3:50 PM", "Yesterday", "Wed", "Sep 21").
 * Matches standard conventions of WhatsApp, iMessage, and Telegram.
 */
export function formatThreadPreviewTime(timestampMs?: number | null): string {
  if (!timestampMs || timestampMs <= 0) return "";
  const now = Date.now();
  const msgDate = new Date(timestampMs);

  if (isSameCalendarDay(timestampMs, now)) {
    return msgDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(timestampMs, yesterday.getTime())) {
    return "Yesterday";
  }

  const diffDays = Math.floor((now - timestampMs) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    return msgDate.toLocaleDateString("en-US", { weekday: "short" });
  }

  const nowDate = new Date(now);
  if (msgDate.getFullYear() === nowDate.getFullYear()) {
    return msgDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return msgDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
}

/**
 * Comprehensive formatted time string for message headers, tooltips, or fallback displays.
 * (e.g. "3:50 PM", "Yesterday, 3:50 PM", "Mon, Sep 21, 3:50 PM", "Sep 21, 2026, 3:50 PM")
 */
export function formatChatMessageTime(timestamp?: string, createdAtMs?: number, msgId?: string): string {
  const ms = resolveMessageTimestampMs({ id: msgId, timestamp, createdAtMs }, createdAtMs);
  const validMs = ms > 0 ? ms : Date.now();
  const now = Date.now();
  const msgDate = new Date(validMs);
  const timeStr = msgDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  if (isSameCalendarDay(validMs, now)) {
    return timeStr;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(validMs, yesterday.getTime())) {
    return `Yesterday, ${timeStr}`;
  }

  const nowDate = new Date(now);
  if (msgDate.getFullYear() === nowDate.getFullYear()) {
    const monthDay = msgDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return `${monthDay}, ${timeStr}`;
  }

  return `${msgDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${timeStr}`;
}
