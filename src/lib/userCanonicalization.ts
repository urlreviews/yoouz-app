/**
 * Centralized User Identity and Grouping Utilities
 * Provides consistent deduplication keys, canonical grouping, and anonymous U/XXXXXX handle formatting.
 */

export interface UserIdentityCandidate {
  email?: string;
  name?: string;
  handle?: string;
  id?: string;
  uid?: string;
}

const GENERIC_NAMES = new Set([
  "reviewer",
  "user",
  "registereduser",
  "communityreviewer",
  "local guide",
  "guest",
  "anon",
]);

const ANON_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hashSeed(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let code = "";
  let val = h >>> 0;
  for (let i = 0; i < 6; i++) {
    code += ANON_ALPHABET[val % ANON_ALPHABET.length];
    val = Math.floor(val / ANON_ALPHABET.length) ^ ((h >>> (i * 5)) + i * 31);
    val = Math.abs(val);
  }
  return code;
}

export function isLegacyDeletedIdentity(raw?: string): boolean {
  const s = String(raw || "").toLowerCase().trim();
  if (!s) return false;
  const compact = s.replace(/[^a-z0-9]/g, "");
  return (
    s.includes("steven akan") ||
    compact.includes("stevenakan") ||
    s.includes("avt ertuop") ||
    compact.includes("avtertuop") ||
    s.includes("ben blue") ||
    compact.includes("benblue") ||
    s === "biz riv" ||
    compact === "bizriv" ||
    s === "mlio66hdr9trvofdgddgwm30rku2"
  );
}

/**
 * Returns true if the given display name appears to be a personal "First Last" human name.
 */
export function isFirstLastHumanName(raw?: string): boolean {
  const s = String(raw || "").trim();
  if (!s) return false;
  if (/^U\/[A-Z0-9]{4,}$/i.test(s) || /^@[a-z0-9_.-]+$/i.test(s)) return false;
  if (s.includes("@") || s.includes(".com") || s.includes(".io") || s.includes(".net") || s.includes(".org")) return false;
  const lower = s.toLowerCase();
  if (
    lower === "yoouz" ||
    lower === "yoouz reviewer" ||
    lower === "yoouz user" ||
    lower === "you" ||
    lower === "user" ||
    lower === "member" ||
    lower === "anonymous" ||
    lower === "anonymous user" ||
    lower === "reviewer" ||
    lower === "local guide"
  ) {
    return false;
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts.length <= 4) {
    const allAlphaWords = parts.every((p) => /^[a-zA-Z][a-zA-Z'’-]*$/.test(p));
    if (allAlphaWords) return true;
  }
  return false;
}

/**
 * Formats a user's display name consistently. Preserves intentional display names and usernames
 * (e.g. "Sofia Rossi", "Marcus", "Jack T", "@handle", "U/XXXXXX"), while converting empty,
 * email-based, generic, or legacy deleted identities into deterministic U/XXXXXX handles.
 */
export function formatAnonymousUserDisplayName(
  rawName?: string,
  seed?: string,
  isBusiness?: boolean
): string {
  const s = String(rawName || "").trim();
  if (isBusiness) return s || "Business";
  if (s.toLowerCase() === "yoouz") return "Yoouz";
  if (s.toLowerCase() === "you") return "You";

  // Keep valid U/XXXXXX or custom @handle formats
  if (/^U\/[A-Z0-9]{4,}$/i.test(s)) {
    return `U/${s.slice(2).toUpperCase()}`;
  }
  if (/^u_[a-z0-9]{4,}$/i.test(s)) {
    return `U/${s.slice(2).toUpperCase()}`;
  }
  if (/^@[a-z0-9_.-]{3,}$/i.test(s)) {
    return s;
  }

  const effectiveSeed = (seed || s || "anon_yoouz").trim();
  const lower = s.toLowerCase();

  // Only anonymize empty, raw email, legacy deleted identities, or generic placeholders
  if (
    !s ||
    s.includes("@") ||
    isLegacyDeletedIdentity(s) ||
    isGenericUsername(s) ||
    lower === "verified reviewer" ||
    lower === "yoouz reviewer" ||
    lower === "yoouz user" ||
    lower === "anonymous" ||
    lower === "anonymous user" ||
    lower === "community member"
  ) {
    return `U/${hashSeed(effectiveSeed)}`;
  }

  return s;
}

export function isGenericUsername(str: string): boolean {
  if (!str) return true;
  const clean = str.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  return !clean || GENERIC_NAMES.has(clean) || clean.length < 2;
}

/**
 * Returns a consistent group identifier for deduplicating profiles in lists and chat threads.
 */
export function getCanonicalUserKey(candidate: UserIdentityCandidate): string {
  if (!candidate) return "";

  const email = (candidate.email || "").toLowerCase().trim();
  const name = (candidate.name || "").toLowerCase().trim();
  const handle = (candidate.handle || "").replace(/^@+/, "").toLowerCase().trim();
  const id = (candidate.id || candidate.uid || "").toLowerCase().trim();

  // Priority 1: Non-generic handle
  const cleanHandle = handle.replace(/[^a-z0-9]/g, "");
  if (cleanHandle && !isGenericUsername(cleanHandle) && cleanHandle.length >= 3) {
    return `user_group_handle_${cleanHandle}`;
  }

  // Priority 2: Non-generic name
  const cleanName = name.replace(/[^a-z0-9]/g, "");
  if (cleanName && !isGenericUsername(cleanName) && cleanName.length >= 3) {
    return `user_group_name_${cleanName}`;
  }

  // Fallback by email
  if (email && email.includes("@")) {
    const emailPrefix = email.split("@")[0].replace(/[^a-z0-9]/g, "");
    if (emailPrefix) return `user_group_email_${emailPrefix}`;
  }

  // Fallback by id
  if (id) {
    const cleanId = id.replace(/[^a-z0-9]/g, "");
    const isBareUuid = /^[0-9a-f]{32}$/i.test(cleanId);
    if (!isBareUuid || (email && email.includes("@"))) {
      return `user_group_id_${cleanId}`;
    }
  }

  if (name && !isGenericUsername(name)) {
    return name;
  }

  return "";
}
