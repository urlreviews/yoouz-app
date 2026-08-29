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

export function getDisplayUrlAsDomain(placeSource: { placeWebsite?: string, placeName?: string, name?: string, website?: string }): string {
  const urlSource = placeSource.placeWebsite || placeSource.website || placeSource.placeName || placeSource.name || "";
  let domain = extractCleanDomain(urlSource);
  
  if (!domain) return "website.com";

  if (!domain.includes(".")) {
    domain = domain.split('|')[0].replace(/[^a-z0-9]/g, "") + ".com";
  }

  return domain;
}

/**
 * Calculates or retrieves a comfortable, authentic view count for a video review.
 * If the video has an explicit recorded view count > 0, it uses that.
 * If the video's views are 0 or undefined, it computes a comfortable baseline
 * deterministically derived from its ID/created timestamp (between 135 and 1,880+),
 * so that no video starts at a dead/broken "0" and subsequent views naturally increment it.
 */
export function getDisplayViews(video?: Partial<VideoReview> | null): number {
  if (!video) return 0;
  
  const explicitViews = video.views ?? video.viewsCount;
  if (typeof explicitViews === "number" && explicitViews > 0) {
    return explicitViews;
  }

  // Generate a deterministic comfortable baseline view count based on the video ID/title
  const idStr = video.id || video.placeId || video.placeName || video.caption || "yoouz_video";
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  // Returns a comfortable number between 135 and 1,880
  const comfortableBase = 135 + (positiveHash % 1745);
  return comfortableBase;
}

/**
 * Formats a view count number into a compact, polished string (e.g. 1.2k, 14.5k, 1.1M, 240)
 */
export function formatViewCount(views?: number | null): string {
  if (!views || views <= 0) return "0";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${views}`;
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

export const KNOWN_COMMUNITY_USERS: Record<string, { name: string; handle: string; avatar: string; bio?: string }> = {
  "aouisesmee": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz."
  },
  "aouisesmee@gmail.com": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz."
  },
  "biz riv": {
    name: "Biz Riv",
    handle: "@bizriv",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJDmKh2JyZy4i-XrVSPutEqOYbyS9itBJHYy0256cvAaHGTKg=s96-c",
    bio: "Food explorer linking real businesses and authentic video reviews."
  },
  "bizriv": {
    name: "Biz Riv",
    handle: "@bizriv",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJDmKh2JyZy4i-XrVSPutEqOYbyS9itBJHYy0256cvAaHGTKg=s96-c",
    bio: "Food explorer linking real businesses and authentic video reviews."
  },
  "louis42111": {
    name: "Biz Riv",
    handle: "@bizriv",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJDmKh2JyZy4i-XrVSPutEqOYbyS9itBJHYy0256cvAaHGTKg=s96-c",
    bio: "Food explorer linking real businesses and authentic video reviews."
  },
  "louis42111@gmail.com": {
    name: "Biz Riv",
    handle: "@bizriv",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJDmKh2JyZy4i-XrVSPutEqOYbyS9itBJHYy0256cvAaHGTKg=s96-c",
    bio: "Food explorer linking real businesses and authentic video reviews."
  },
  "avt ertuop": {
    name: "avt ertuop",
    handle: "@avr6566gd",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJcSBil87wKNy6vlkPQPGaAagu2GtFV1B5CLSXC9j7YTs70Cg=s96-c",
    bio: "Community reviewer on Yoouz."
  },
  "avr6566gd": {
    name: "avt ertuop",
    handle: "@avr6566gd",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJcSBil87wKNy6vlkPQPGaAagu2GtFV1B5CLSXC9j7YTs70Cg=s96-c",
    bio: "Community reviewer on Yoouz."
  },
  "avr6566gd@gmail.com": {
    name: "avt ertuop",
    handle: "@avr6566gd",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJcSBil87wKNy6vlkPQPGaAagu2GtFV1B5CLSXC9j7YTs70Cg=s96-c",
    bio: "Community reviewer on Yoouz."
  }
};

/**
 * Robustly resolves the real author name and authentic avatar photo for a video review.
 * Guarantees that authentic Google profile photos and uploaded user pictures are always preserved
 * and never replaced with generic fallback initial icons or placeholder names.
 */
export function resolveSafeAuthor(
  video: Partial<VideoReview> | null | undefined,
  currentUserOverride?: UserProfile | null
): VideoAuthor {
  const authorObj = (video?.author && typeof video.author === "object") ? video.author : ({} as any);
  
  // 1. Determine raw name candidate
  let rawName = (
    authorObj.name ||
    (video as any)?.authorName ||
    (video as any)?.author_name ||
    (video as any)?.userName ||
    (video?.userId && video.userId.includes("@") ? video.userId.split("@")[0] : video?.userId) ||
    ""
  ).trim();

  // If rawName is a generic placeholder, try userEmail or userId
  if (rawName.toLowerCase() === "reviewer" || rawName.toLowerCase() === "verified reviewer" || !rawName) {
    if (video?.userEmail) {
      rawName = video.userEmail.split("@")[0];
    } else if (video?.userId && video.userId.includes("@")) {
      rawName = video.userId.split("@")[0];
    }
  }

  // 2. Check current logged-in user match from localStorage or argument
  let activeUser = currentUserOverride;
  if (!activeUser && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("copo_user_profile");
      if (stored) activeUser = JSON.parse(stored);
    } catch (e) {}
  }

  // 3. Match against known community users
  const nameKey = rawName.toLowerCase().replace(/^@+/, "");
  const userKey = (video?.userId || video?.userEmail || "").toLowerCase().trim();
  const knownMatch = KNOWN_COMMUNITY_USERS[nameKey] || KNOWN_COMMUNITY_USERS[userKey];

  let finalName = knownMatch?.name || (rawName && rawName.toLowerCase() !== "reviewer" ? rawName : "Yoouz Reviewer");
  let finalHandle = knownMatch?.handle || authorObj.handle || `@${finalName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}`;
  if (!finalHandle.startsWith("@")) finalHandle = `@${finalHandle}`;

  // 4. Resolve authentic avatar
  let candidateAvatar = authorObj.avatar || (video as any)?.authorAvatar || (video as any)?.avatar;

  // Filter out invalid video file paths mistakenly passed as avatars
  if (
    candidateAvatar &&
    (candidateAvatar.includes("/api/videos/") ||
      candidateAvatar.includes(".mp4") ||
      candidateAvatar.includes("rev-"))
  ) {
    candidateAvatar = "";
  }

  // Check if active user matches this video
  if (activeUser && (
    (activeUser.email && (activeUser.email.toLowerCase() === userKey || activeUser.email.toLowerCase() === (video?.userEmail || "").toLowerCase())) ||
    (activeUser.name && activeUser.name.toLowerCase() === finalName.toLowerCase()) ||
    (activeUser.name && activeUser.name.toLowerCase() === nameKey)
  )) {
    if (activeUser.name) finalName = activeUser.name;
    if (activeUser.avatar && !candidateAvatar) candidateAvatar = activeUser.avatar;
  }

  let finalAvatar = "";
  if (candidateAvatar && !candidateAvatar.includes("dicebear") && !candidateAvatar.includes("ui-avatars.com")) {
    finalAvatar = candidateAvatar;
  } else if (knownMatch?.avatar) {
    finalAvatar = knownMatch.avatar;
  } else if (candidateAvatar) {
    finalAvatar = candidateAvatar;
  } else if (activeUser?.avatar) {
    finalAvatar = activeUser.avatar;
  } else {
    finalAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=27272a&color=fff&bold=true&size=128`;
  }

  return {
    name: finalName,
    handle: finalHandle,
    avatar: finalAvatar,
    isVerified: authorObj.isVerified ?? true,
    isLocalGuide: authorObj.isLocalGuide ?? true,
    localGuideLevel: authorObj.localGuideLevel ?? 7,
    videoReviewCount: authorObj.videoReviewCount ?? 1,
    photosCount: authorObj.photosCount ?? 0,
    isFollowed: authorObj.isFollowed ?? false,
    bio: knownMatch?.bio || authorObj.bio,
    banner: authorObj.banner,
    location: authorObj.location
  };
}
