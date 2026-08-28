import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { getCleanLogoUrl } from "./logoUtils";

/**
 * Cleanly extracts domain name from URL or text string
 * e.g., "https://www.fiverr.com/categories" -> "fiverr.com"
 * "fiverr.com" -> "fiverr.com"
 * "fiverr-com" -> "fiverr.com"
 */
export function extractCleanDomain(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  let clean = input.trim().toLowerCase();
  
  // Remove protocol
  clean = clean.replace(/^https?:\/\//, "");
  // Remove www.
  clean = clean.replace(/^www\./, "");
  // Remove query, hash, and subpath
  clean = clean.split("/")[0].split("?")[0].split("#")[0];
  // Remove trailing colon and port
  clean = clean.split(":")[0];
  
  // If slug like "fiverr-com" where the user entered domain as id
  if (clean.endsWith("-com")) clean = clean.replace(/-com$/, ".com");
  if (clean.endsWith("-net")) clean = clean.replace(/-net$/, ".net");
  if (clean.endsWith("-org")) clean = clean.replace(/-org$/, ".org");
  if (clean.endsWith("-io")) clean = clean.replace(/-io$/, ".io");
  if (clean.endsWith("-co")) clean = clean.replace(/-co$/, ".co");
  if (clean.endsWith("-ai")) clean = clean.replace(/-ai$/, ".ai");

  return clean;
}

/**
 * Formats a business name for display, cleaning it if it looks like a URL.
 * Also attempts to convert domain-like strings into readable names.
 * e.g., "https://www.freecancellations.com" -> "Free Cancellations"
 */
export function formatBusinessName(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  
  // If it's already a clean name (contains spaces and no URL markers), return as is
  if (trimmed.includes(" ") && !trimmed.includes("://") && !trimmed.includes("www.")) {
    return trimmed;
  }

  // If it looks like a URL or domain, clean and format it
  if (
    trimmed.includes("://") || 
    trimmed.startsWith("www.") || 
    /\.[a-z]{2,}(\/|$)/i.test(trimmed)
  ) {
    const domain = extractCleanDomain(trimmed);
    const namePart = domain.split('.')[0];
    
    if (namePart) {
      // Split by common delimiters and capitalize
      // Also try to split camelCase if present
      const words = namePart
        .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase
        .split(/[-_ ]+/)
        .map(word => {
          if (!word) return "";
          // Common lowercase words for names
          const lowerCaseWords = ["of", "the", "and", "in", "at"];
          const lowerWord = word.toLowerCase();
          if (lowerCaseWords.includes(lowerWord)) return lowerWord;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .filter(Boolean);
      
      return words.join(' ');
    }
    return domain;
  }
  
  return trimmed;
}

/**
 * Checks if a VideoReview belongs to a given Place or Place identifier.
 * Extremely robust matching across IDs, URLs, domains, names, and slugs.
 */
export function isPlaceReviewMatch(
  video?: VideoReview | null,
  placeOrId?: Place | { id?: string; name?: string; website?: string; brandDomain?: string } | string | null
): boolean {
  if (!video || !placeOrId) return false;

  let placeId = "";
  let placeName = "";
  let placeWebsite = "";
  let placeBrandDomain = "";

  if (typeof placeOrId === "string") {
    placeId = placeOrId.trim();
    placeName = placeOrId.trim();
    placeWebsite = placeOrId.trim();
  } else {
    placeId = (placeOrId.id || "").trim();
    placeName = (placeOrId.name || "").trim();
    placeWebsite = (placeOrId.website || "").trim();
    placeBrandDomain = (placeOrId.brandDomain || "").trim();
  }

  const vPlaceId = (video.placeId || "").trim();
  const vPlaceName = (video.placeName || "").trim();
  const vPlaceWebsite = (video.placeWebsite || "").trim();

  // 1. Direct ID match
  if (placeId && vPlaceId && placeId.toLowerCase() === vPlaceId.toLowerCase()) {
    return true;
  }

  // 2. Direct exact Place Name match
  if (placeName && vPlaceName && placeName.toLowerCase() === vPlaceName.toLowerCase()) {
    return true;
  }

  // 3. Domain extraction match
  const placeDomain = extractCleanDomain(placeWebsite || placeBrandDomain || placeId || placeName);
  const vDomain = extractCleanDomain(vPlaceWebsite || vPlaceId || vPlaceName);

  if (placeDomain && vDomain && placeDomain === vDomain) {
    return true;
  }

  // 4. Normalized slug match (e.g. "fiverr-com" vs "fiverr.com")
  const normPlaceId = placeId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normVPlaceId = vPlaceId.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normPlaceId && normVPlaceId && normPlaceId === normVPlaceId) {
    return true;
  }

  // 5. Website domain contained in place name or video place name
  if (placeDomain && (vPlaceName.toLowerCase().includes(placeDomain) || vPlaceId.toLowerCase().includes(placeDomain))) {
    return true;
  }
  if (vDomain && (placeName.toLowerCase().includes(vDomain) || placeId.toLowerCase().includes(vDomain))) {
    return true;
  }

  // 6. Name partial match if business names are similar
  const cleanPName = placeName.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const cleanVName = vPlaceName.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  if (cleanPName && cleanVName && (cleanPName.includes(cleanVName) || cleanVName.includes(cleanPName))) {
    return true;
  }

  return false;
}

/**
 * Checks if a VideoReview belongs to a given author or user account.
 * Supports handle (with or without @), email, name, userId, or uid.
 */
export function isAuthorMatch(
  video?: VideoReview | null,
  authorOrUser?: VideoAuthor | UserProfile | { email?: string; handle?: string; name?: string; userId?: string; uid?: string; id?: string } | string | null
): boolean {
  if (!video || !authorOrUser) return false;

  let targetHandle = "";
  let targetEmail = "";
  let targetName = "";
  let targetUserId = "";
  let targetUid = "";

  if (typeof authorOrUser === "string") {
    const raw = authorOrUser.trim().toLowerCase();
    targetHandle = raw.replace(/^@/, "");
    targetEmail = raw;
    targetName = raw;
    targetUserId = raw;
    targetUid = raw;
  } else {
    targetHandle = (authorOrUser.name || "").replace(/^@/, "").trim().toLowerCase();
    targetEmail = ("email" in authorOrUser && authorOrUser.email ? authorOrUser.email : "").trim().toLowerCase();
    targetName = (authorOrUser.name || "").trim().toLowerCase();
    targetUserId = ("userId" in authorOrUser && authorOrUser.userId ? authorOrUser.userId : "").trim().toLowerCase();
    targetUid = (
      "uid" in authorOrUser && (authorOrUser as any).uid
        ? (authorOrUser as any).uid
        : "id" in authorOrUser && (authorOrUser as any).id
        ? (authorOrUser as any).id
        : ""
    ).trim().toLowerCase();
  }

  const vHandle = (video.author?.name || "").replace(/^@/, "").trim().toLowerCase();
  const vEmail = (video.userEmail || video.userId || "").trim().toLowerCase();
  const vName = (video.author?.name || "").trim().toLowerCase();
  const vUserId = (video.userId || "").trim().toLowerCase();

  // 1. Direct handle match
  if (targetHandle && vHandle && targetHandle === vHandle) return true;

  // 2. Direct email match
  if (targetEmail && (vEmail === targetEmail || vUserId === targetEmail)) return true;

  // 3. Email prefix to handle/name match
  const emailPrefix = targetEmail.split("@")[0];
  if (emailPrefix) {
    if (vHandle && emailPrefix === vHandle) return true;
    if (vName && emailPrefix === vName) return true;
    if (targetHandle && emailPrefix === targetHandle) return true;
  }
  const vEmailPrefix = vEmail.split("@")[0];
  if (vEmailPrefix) {
    if (targetHandle && vEmailPrefix === targetHandle) return true;
    if (targetName && vEmailPrefix === targetName) return true;
  }

  // 4. UID / UserId match
  if (targetUid && (targetUid === vUserId || targetUid === vEmail || targetUid === vHandle)) return true;
  if (targetUserId && (targetUserId === vUserId || targetUserId === vEmail || targetUserId === vHandle)) return true;

  // 5. Direct exact Name match (min length 3 to prevent single-char collision)
  if (targetName && vName && targetName === vName && targetName.length >= 3) return true;
  if (targetHandle && vName && targetHandle === vName && targetHandle.length >= 3) return true;
  if (targetName && vHandle && targetName === vHandle && targetName.length >= 3) return true;

  // 6. Alphanumeric normalized key match (min length 3)
  const normTarget = (targetHandle || targetName || emailPrefix).replace(/[^a-z0-9]/g, "");
  const normV = (vHandle || vName || vEmailPrefix).replace(/[^a-z0-9]/g, "");
  if (normTarget && normV && normTarget.length >= 3 && normTarget === normV) return true;

  // 7. Author handle = "me"
  if ((targetHandle === "me" || targetUserId === "me" || targetName === "me") && (vHandle === "me" || vUserId === "me" || vName === "me")) return true;

  return false;
}

/**
 * Synthesizes or updates a Place entry from a newly recorded VideoReview
 */
export function synthesizePlaceFromReview(video: VideoReview, existingPlaces: Place[] = []): Place {
  const existing = existingPlaces.find((p) => isPlaceReviewMatch(video, p));
  if (existing) {
    return {
      ...existing,
      totalReviews: Math.max(existing.totalReviews || 1, (existing.totalReviews || 0) + 1),
      rating: video.rating || existing.rating || 5.0,
      avatarUrl: existing.avatarUrl || video.placeLogoUrl || "",
      website: existing.website || video.placeWebsite || ""
    };
  }

  const domain = extractCleanDomain(video.placeWebsite || video.placeName || video.placeId);
  const cleanId = video.placeId || (domain ? domain.replace(/[^a-zA-Z0-9]/g, "-") : `place-${Date.now()}`);

  return {
    id: cleanId,
    name: formatBusinessName(video.placeName || domain) || "Verified Business",
    category: video.placeCategory || "Establishment",
    categoryType: "all",
    address: video.placeAddress || "Online / Verified",
    city: video.placeCity || "Global",
    lat: 0,
    lng: 0,
    rating: video.rating || 5.0,
    totalReviews: 1,
    ratingDistribution: { stars5: 1, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
    avatarUrl: video.placeLogoUrl || (domain ? getCleanLogoUrl(null, domain) || "" : ""),
    bannerUrl: video.thumbnailUrl || "",
    photos: video.thumbnailUrl ? [video.thumbnailUrl] : [],
    openingHours: "Available 24/7",
    isOpen: true,
    phone: "",
    website: video.placeWebsite || (domain ? `https://${domain}` : ""),
    priceRange: "N/A",
    isSavedToProfile: true,
    plusCode: "",
    description: `Verified video review destination for ${formatBusinessName(video.placeName || domain)}.`,
    popularKeywords: [{ tag: "Verified", count: 1 }],
    amenities: [],
    topDishes: []
  };
}
