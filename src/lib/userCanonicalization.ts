/**
 * Centralized User Identity and Grouping Utilities
 * Provides consistent deduplication keys and canonical grouping for users across views and services.
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
  "anon"
]);

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

  // Cluster 1: Ese / aouisesmee
  if (
    email.includes("aouisesmee") ||
    email.includes("aouisesme") ||
    email.includes("aouisemee") ||
    email.includes("aouiseme") ||
    name.includes("aouisesmee") ||
    name.includes("aouisemee") ||
    handle.includes("aouisesmee") ||
    handle.includes("aouisemee") ||
    id.includes("aouisesmee") ||
    id.includes("aouisemee") ||
    id === "mlio66hdr9trvofdgddgwm30rku2" ||
    name === "ben blue" ||
    name.replace(/[^a-z0-9]/g, "") === "benblue" ||
    handle === "benblue"
  ) {
    return "user_group_aouisesmee";
  }

  // Cluster 2: Biz Riv
  if (
    name === "biz riv" ||
    name.replace(/[^a-z0-9]/g, "") === "bizriv" ||
    handle === "bizriv" ||
    email.includes("louis42111") ||
    handle.includes("louis42111") ||
    id.includes("louis42111")
  ) {
    return "user_group_bizriv";
  }

  // Cluster 3: Steven Akan (unified with avr6566gd and previous test aliases)
  if (
    name === "steven akan" ||
    name.replace(/[^a-z0-9]/g, "") === "stevenakan" ||
    handle === "stevenakan" ||
    handle.replace(/[^a-z0-9]/g, "") === "stevenakan" ||
    id === "steven_akan" ||
    id.includes("steven_akan") ||
    id.includes("stevenakan") ||
    name === "avt ertuop" ||
    name.replace(/[^a-z0-9]/g, "") === "avtertuop" ||
    email.includes("avr6566gd") ||
    handle.includes("avr6566gd") ||
    id.includes("avr6566gd")
  ) {
    return "user_group_stevenakan";
  }

  // Priority 1: Non-generic handle
  const cleanHandle = handle.replace(/[^a-z0-9]/g, "");
  if (cleanHandle && !isGenericUsername(cleanHandle) && cleanHandle.length >= 3) {
    return `user_group_handle_${cleanHandle}`;
  }

  // Priority 2: Non-generic real name
  const cleanName = name.replace(/[^a-z0-9]/g, "");
  if (cleanName && !isGenericUsername(cleanName) && cleanName.length >= 3) {
    return `user_group_name_${cleanName}`;
  }

  // Fallback by email
  if (email && email.includes("@")) {
    const emailPrefix = email.split("@")[0].replace(/[^a-z0-9]/g, "");
    if (emailPrefix) return `user_group_email_${emailPrefix}`;
  }

  // Fallback by id (only if not an anonymous generic ID)
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
