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
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    const date = new Date(parsedTime);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return recordedAt;
}
