import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { getCleanLogoUrl, KNOWN_BRAND_BANNERS, KNOWN_BRAND_LOGOS } from "./logoUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";

/**
 * Cleanly extracts domain name from URL or text string
 * e.g., "https://www.tajhotels.com/categories" -> "tajhotels.com"
 * "www-tajhotels-com" -> "tajhotels.com"
 * "tajhotels-com" -> "tajhotels.com"
 * "fiverr.com" -> "fiverr.com"
 */
export function extractCleanDomain(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  let clean = input.trim().toLowerCase();
  
  // Remove protocol
  clean = clean.replace(/^https?:\/\//, "");
  // Remove www. or www- or www/
  clean = clean.replace(/^www[\.\-\/]/, "");
  // Remove query, hash, and subpath
  clean = clean.split("/")[0].split("?")[0].split("#")[0];
  // Remove trailing colon and port
  clean = clean.split(":")[0];
  
  // If slug like "fiverr-com" or "tajhotels-com" where the user entered domain as id
  if (clean.endsWith("-com")) clean = clean.replace(/-com$/, ".com");
  if (clean.endsWith("-net")) clean = clean.replace(/-net$/, ".net");
  if (clean.endsWith("-org")) clean = clean.replace(/-org$/, ".org");
  if (clean.endsWith("-io")) clean = clean.replace(/-io$/, ".io");
  if (clean.endsWith("-co")) clean = clean.replace(/-co$/, ".co");
  if (clean.endsWith("-ai")) clean = clean.replace(/-ai$/, ".ai");
  if (clean.endsWith("-app")) clean = clean.replace(/-app$/, ".app");
  if (clean.endsWith("-dev")) clean = clean.replace(/-dev$/, ".dev");
  if (clean.endsWith("-me")) clean = clean.replace(/-me$/, ".me");
  if (clean.endsWith("-tech")) clean = clean.replace(/-tech$/, ".tech");
  if (clean.endsWith("-store")) clean = clean.replace(/-store$/, ".store");
  if (clean.endsWith("-be")) clean = clean.replace(/-be$/, ".be");
  if (clean.endsWith("-co-uk")) clean = clean.replace(/-co-uk$/, ".co.uk");

  // Strip again in case of www remaining
  clean = clean.replace(/^www[\.\-\/]/, "");

  return clean;
}

/**
 * Strict validator for whether an input is a valid domain/URL search.
 * Rejects single letters (e.g. "k", "n"), words without dots, or invalid URLs.
 */
export function isValidDomainUrl(input?: string | null): boolean {
  if (!input || typeof input !== "string") return false;
  const clean = extractCleanDomain(input);
  if (!clean || clean.length < 3) return false;
  // Must contain at least one dot separating domain label and TLD (e.g. uber.com, bhol.co.il)
  if (!clean.includes(".")) return false;
  const parts = clean.split(".");
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1];
  // TLD must be at least 2 characters and letters only
  if (!/^[a-z]{2,}$/i.test(tld)) return false;
  // Valid domain characters: alphanumeric and hyphens, not starting or ending with hyphen
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i.test(clean);
}

/**
 * Normalizes any place or raw query string into a strictly CLEAN URL:
 * e.g. "https://www.uber.com/path" -> "uber.com"
 * "www.bhol.co.il" -> "bhol.co.il"
 * "alaris-law.com" -> "alaris-law.com"
 * Guaranteed NO "www.", NO "https://", NO "http://", NO trailing slashes.
 */
export function getCleanDomainUrl(item?: string | { brandDomain?: string; website?: string; id?: string; name?: string; placeWebsite?: string; placeName?: string } | null): string {
  if (!item) return "";
  if (typeof item === "string") {
    return extractCleanDomain(item);
  }
  // If Place or Place-like object
  const domainSource = item.brandDomain || item.placeWebsite || item.website || item.id || item.placeName || item.name || "";
  const clean = extractCleanDomain(domainSource);
  if (clean && clean.includes(".")) return clean;
  if (item.brandDomain) {
    const brandClean = extractCleanDomain(item.brandDomain);
    if (brandClean && brandClean.includes(".")) return brandClean;
  }
  if (item.website || item.placeWebsite) {
    const webClean = extractCleanDomain(item.website || item.placeWebsite);
    if (webClean && webClean.includes(".")) return webClean;
  }
  return clean || "website.com";
}

/**
 * Gets a clean URL slug for a place (e.g. "digitalpark.ae", "legal500.com", "yoouz.com")
 * Guarantees no "www." prefixes or URL protocol baggage while keeping authentic domain dots.
 */
export function getPlaceSlug(placeSource: string | { placeWebsite?: string, placeName?: string, name?: string, website?: string, brandDomain?: string, id?: string } | null | undefined): string {
  const domain = getDisplayUrlAsDomain(placeSource);
  return domain.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9\._-]/g, "").trim();
}

export function getDisplayUrlAsDomain(placeSource: string | { placeWebsite?: string, placeName?: string, name?: string, website?: string, brandDomain?: string, id?: string } | null | undefined): string {
  if (!placeSource) return "website.com";
  let urlSource = "";
  if (typeof placeSource === "string") {
    urlSource = placeSource;
  } else if (typeof placeSource === "object") {
    urlSource = placeSource.brandDomain || placeSource.placeWebsite || placeSource.website || placeSource.id || placeSource.placeName || placeSource.name || "";
  }
  let domain = extractCleanDomain(urlSource);
  
  if (!domain) {
    if (typeof placeSource === "string" && placeSource.trim()) {
      const cleanStr = placeSource.trim().toLowerCase().replace(/^www[\.\-]/, "").replace(/[^a-z0-9]/g, "");
      if (cleanStr) return `${cleanStr}.com`;
    } else if (placeSource && typeof placeSource === "object" && (placeSource.name || placeSource.placeName)) {
      const cleanName = (placeSource.name || placeSource.placeName || "").trim().toLowerCase().replace(/^www[\.\-]/, "").replace(/[^a-z0-9]/g, "");
      if (cleanName) return `${cleanName}.com`;
    }
    return "website.com";
  }

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
 * e.g., "https://www.tajhotels.com/" -> "Taj Hotels"
 * "www-tajhotels-com" -> "Taj Hotels"
 * "tajhotels-com" -> "Taj Hotels"
 * "https://www.freecancellations.com" -> "Free Cancellations"
 */
export function formatBusinessName(name?: string | null): string {
  if (!name) return "";
  let trimmed = name.trim();
  
  // 1. Remove concatenated navigation text & spam keywords like "MenuCloseMoreMoreMore..."
  trimmed = trimmed.replace(/(?:Menu|Close|More|Search|Login|Sign|Cart|Navigation|Toggle|Header|Footer|Cookies|Accept|Privacy|Skip to content){2,}.*$/i, '').trim();
  trimmed = trimmed.replace(/([a-z0-9])(?:Menu|Close|More|Search|Login|Sign|Cart|Toggle|Header|Footer).*/i, '$1').trim();
  
  // 2. Strip standard SEO abbreviations like "L500 | Legal 500" -> "Legal 500"
  if (/^L500\s*[|\-–—:]\s*/i.test(trimmed)) {
    trimmed = trimmed.replace(/^L500\s*[|\-–—:]\s*/i, "");
  }

  // 3. Clean up scraped SEO titles (e.g., "BrandName | The Best Service in Town" or "BrandName – The Clients Guide...")
  const seoDelimiters = [" | ", " – ", " — ", " - ", " : ", " • "];
  for (const delimiter of seoDelimiters) {
    if (trimmed.includes(delimiter)) {
      const parts = trimmed.split(delimiter).map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        const first = parts[0];
        if (first.length >= 2 && first.length <= 40) {
          trimmed = first;
          break;
        } else if (parts[1] && parts[1].length >= 2 && parts[1].length <= 40) {
          trimmed = parts[1];
          break;
        }
      }
    }
  }

  // 4. If it is an explicit URL, domain, or domain-like string (e.g. "https://...", "www.domain.com", "domain.com", "tajhotels-com", "bhol.co.il", "digitalpark.ae")
  if (
    trimmed.includes("://") || 
    trimmed.toLowerCase().startsWith("www.") || 
    trimmed.toLowerCase().startsWith("www-") ||
    trimmed.toLowerCase().startsWith("http:") ||
    trimmed.toLowerCase().startsWith("https:") ||
    /\.[a-z]{2,}(?:\/|$|\?|#)/i.test(trimmed) ||
    /^[a-z0-9-_]+(?:\.[a-z0-9-_]+)+$/i.test(trimmed) ||
    /-(?:com|net|org|io|co|ai|app|dev|tech|store|be|co-uk)$/i.test(trimmed)
  ) {
    const domain = extractCleanDomain(trimmed);
    const namePart = domain.split('.')[0];
    
    if (namePart) {
      const commonSuffixes = /(law|group|firm|media|news|park|tech|studios?|travel|cafe|coffee|bar|hotel|suites|dentist|dental|clinic|hospital|store|shop|market|club|fitness|gym|app|avocats?)$/i;
      let spaced = namePart
        .replace(/([a-zA-Z])([0-9])/g, "$1 $2")
        .replace(/([0-9])([a-zA-Z])/g, "$1 $2")
        .replace(/([a-z])([A-Z])/g, "$1 $2");

      if (commonSuffixes.test(spaced) && !spaced.includes(" ") && !spaced.includes("-")) {
        spaced = spaced.replace(commonSuffixes, " $1");
      }
      if (/^jb(?=[a-z])/i.test(spaced)) {
        spaced = spaced.replace(/^jb/i, "JB ");
      }
      if (/^brettlevy$/i.test(spaced)) {
        spaced = "Brett Levy";
      }

      const acronyms = new Set(["usa", "nyc", "la", "uk", "us", "ai", "api", "ibm", "bbc", "cnn", "cbs", "nbc", "hbo", "eu"]);
      const lowerCaseWords = new Set(["of", "the", "and", "in", "at"]);

      const words = spaced
        .split(/[-_ ]+/)
        .map(word => {
          if (!word) return "";
          const lower = word.toLowerCase();
          if (acronyms.has(lower)) return lower.toUpperCase();
          if (lowerCaseWords.has(lower)) return lower;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .filter(Boolean);
        
      return words.join(' ');
    }
    return domain;
  }

  // 5. Final fallback cleanup - absolutely strip any remaining protocol, www, or TLD suffixes
  let cleanName = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^www[\.\-\/]/i, '')
    .replace(/\.(?:com|net|org|io|co|ai|app|dev|tech|store|be|co\.uk|co\.il|ae|ca|de|fr|it|es|eu|nl|ch|at|pl|in|cn|jp|kr|xyz|info|biz|online|site|law|club|me|tv|us|uk)$/i, '');

  if (!cleanName.includes(" ") && cleanName.length > 1) {
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }
  
  return cleanName;
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
    targetHandle = ((authorOrUser as any).handle || authorOrUser.name || "").replace(/^@/, "").trim().toLowerCase();
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

  // Guard against generic words matching all reviews
  const isGeneric = (val: string) => !val || val === "reviewer" || val === "verified reviewer" || val === "user" || val === "guest";
  if (isGeneric(targetName) && !targetEmail && !targetUserId && !targetUid && isGeneric(targetHandle)) {
    return false;
  }

  const vHandle = (video.author?.handle || video.author?.name || "").replace(/^@/, "").trim().toLowerCase();
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
  const domain = extractCleanDomain(video.placeWebsite || video.placeName || video.placeId);
  const cleanId = video.placeId || (domain ? domain.replace(/[^a-zA-Z0-9]/g, "-") : `place-${Date.now()}`);
  const reviewBanner =
    (video as any).placeBannerUrl ||
    (video as any).bannerUrl ||
    (video as any).ogImage ||
    (domain && KNOWN_BRAND_BANNERS[domain]) ||
    "";
  const reviewLogo =
    video.placeLogoUrl ||
    (domain && KNOWN_BRAND_LOGOS[domain]) ||
    (domain ? getCleanLogoUrl(null, domain) || "" : "");

  if (existing) {
    const banner = existing.bannerUrl || existing.ogImage || reviewBanner || (domain && KNOWN_BRAND_BANNERS[domain]) || "";
    const logo = (existing.logoUrl && !existing.logoUrl.startsWith("data:;")) ? existing.logoUrl : ((existing.avatarUrl && !existing.avatarUrl.startsWith("data:;")) ? existing.avatarUrl : (reviewLogo || (domain && KNOWN_BRAND_LOGOS[domain]) || ""));
    const website = (existing.website && !existing.website.includes("maps.google.com")) 
      ? existing.website 
      : (video.placeWebsite || (domain ? `https://${domain}` : ""));
    const description = video.placeDescription || (existing.description && !existing.description.includes("Verified video review destination") && !existing.description.includes("Verified Yoouz business listing") ? existing.description : "") || existing.description || "";
    return {
      ...existing,
      totalReviews: Math.max(existing.totalReviews || 1, (existing.totalReviews || 0) + 1),
      rating: video.rating || existing.rating || 5.0,
      avatarUrl: logo,
      logoUrl: logo,
      website: website || "",
      brandDomain: existing.brandDomain || domain || undefined,
      bannerUrl: banner,
      ogImage: banner || existing.ogImage || "",
      description: description || existing.description,
      photos: Array.from(new Set([...(existing.photos || []), ...(banner ? [banner] : [])]))
    };
  }

  const initialDescription = video.placeDescription || "";

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
    avatarUrl: reviewLogo,
    logoUrl: reviewLogo,
    brandDomain: domain || undefined,
    bannerUrl: reviewBanner,
    ogImage: reviewBanner,
    photos: reviewBanner ? [reviewBanner] : [],
    openingHours: "Available 24/7",
    isOpen: true,
    phone: "",
    website: video.placeWebsite || (domain ? `https://${domain}` : ""),
    priceRange: "N/A",
    isSavedToProfile: true,
    plusCode: "",
    description: initialDescription || `Verified video review destination for ${formatBusinessName(video.placeName || domain)}.`,
    popularKeywords: [{ tag: "Verified", count: 1 }],
    amenities: [],
    topDishes: []
  };
}

export const KNOWN_COMMUNITY_USERS: Record<string, { name: string; handle: string; avatar: string; bio?: string; location?: string }> = {
  "aouisesmee": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "aouisesmee@gmail.com": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "usr_aouisesmee_gmail_com": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "aouisesmee_gmail_com": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "mLiO66HDR9TRvOFdGddGWm30rKu2": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "mlio66hdr9trvofdgddgwm30rku2": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "aouisesme": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "aouisesme@gmail.com": {
    name: "aouisesmee",
    handle: "@aouisesmee",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJAq74cxWFFV90VchWmgEsIwjE0fPv5ee-9wK2r19lbDH7Ea9s=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
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
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "avr6566gd": {
    name: "avt ertuop",
    handle: "@avr6566gd",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJcSBil87wKNy6vlkPQPGaAagu2GtFV1B5CLSXC9j7YTs70Cg=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  },
  "avr6566gd@gmail.com": {
    name: "avt ertuop",
    handle: "@avr6566gd",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJcSBil87wKNy6vlkPQPGaAagu2GtFV1B5CLSXC9j7YTs70Cg=s96-c",
    bio: "Community reviewer on Yoouz.",
    location: "Los Angeles, California, United States"
  }
};

/**
 * Global User Registry and in-memory cache for instant synchronous resolution across all views
 */
let memoryUserRegistry: Record<string, any> = {};

export function updateUserRegistry(users: any[] | any): void {
  if (!users) return;
  const list = Array.isArray(users) ? users : [users];
  list.forEach((u) => {
    if (!u) return;
    const emailKey = (u.email || "").toLowerCase().trim();
    const nameKey = (u.name || "").toLowerCase().replace(/^@+/, "").trim();
    const handleKey = (u.handle || "").toLowerCase().replace(/^@+/, "").trim();
    const uidKey = (u.uid || u.userId || u.id || "").toLowerCase().trim();

    const entry = {
      name: u.name,
      handle: u.handle || (u.name ? `@${u.name.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "@user"),
      avatar: u.avatar,
      bio: u.bio,
      banner: u.banner,
      location: u.location,
      email: u.email
    };

    if (emailKey) memoryUserRegistry[emailKey] = entry;
    if (nameKey) memoryUserRegistry[nameKey] = entry;
    if (handleKey) memoryUserRegistry[handleKey] = entry;
    if (uidKey) memoryUserRegistry[uidKey] = entry;
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("yoouz_users_registry_cache", JSON.stringify(memoryUserRegistry));
    } catch (e) {}
  }
}

export function getUserFromRegistry(key: string): any {
  if (!key) return null;
  const cleanKey = key.toLowerCase().replace(/^@+/, "").trim();
  if (memoryUserRegistry[cleanKey]) return memoryUserRegistry[cleanKey];

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("yoouz_users_registry_cache");
      if (stored) {
        memoryUserRegistry = JSON.parse(stored);
        if (memoryUserRegistry[cleanKey]) return memoryUserRegistry[cleanKey];
      }
    } catch (e) {}
  }
  return null;
}

/**
 * Robustly resolves the real author name and authentic avatar photo for a video review.
 * Guarantees that authentic Google profile photos and uploaded user pictures are always preserved
 * and never replaced with generic fallback initial icons or placeholder names.
 */
export function getSafeAvatarUrl(avatarUrl?: string | null, name?: string | null, handle?: string | null): string {
  if (!avatarUrl || avatarUrl === "data:;" || avatarUrl.trim() === "") {
    return generateGoogleLetterAvatarSvg(name || "User", 128, handle || name || "User");
  }

  // Filter out video files or paths accidentally stored as avatars
  if (
    avatarUrl.includes(".mp4") ||
    avatarUrl.includes("/api/videos/") ||
    avatarUrl.includes("rev-") ||
    avatarUrl.startsWith("blob:")
  ) {
    return generateGoogleLetterAvatarSvg(name || "User", 128, handle || name || "User");
  }

  // If it's already an SVG data URI or base64 image, return directly
  if (avatarUrl.startsWith("data:image/")) {
    return avatarUrl;
  }

  let targetUrl = avatarUrl;
  if (targetUrl.startsWith("/api/proxy-image?url=")) {
    try {
      targetUrl = decodeURIComponent(targetUrl.replace("/api/proxy-image?url=", ""));
    } catch (e) {}
  }

  // Optimize Google User Content avatars by requesting a smaller size (128x128) if not already specified
  if (targetUrl.includes("googleusercontent.com") && !targetUrl.includes("=s")) {
    return targetUrl + "=s128-c";
  }

  return targetUrl;
}

export function resolveSafeAuthor(
  video: Partial<VideoReview> | null | undefined,
  currentUserOverride?: UserProfile | null,
  allUsersList?: any[]
): VideoAuthor {
  if (allUsersList && allUsersList.length > 0) {
    updateUserRegistry(allUsersList);
  }
  if (currentUserOverride) {
    updateUserRegistry(currentUserOverride);
  }

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

  // 3. Match against known community users and user registry
  const nameKey = rawName.toLowerCase().replace(/^@+/, "");
  const userKey = (video?.userId || video?.userEmail || (authorObj as any).userId || (authorObj as any).email || "").toLowerCase().trim();
  const handleKey = (authorObj.handle || "").toLowerCase().replace(/^@+/, "");

  const registryMatch = getUserFromRegistry(userKey) || getUserFromRegistry(nameKey) || getUserFromRegistry(handleKey);
  const knownMatch = KNOWN_COMMUNITY_USERS[nameKey] || KNOWN_COMMUNITY_USERS[userKey] || KNOWN_COMMUNITY_USERS[handleKey];

  let finalName = registryMatch?.name || knownMatch?.name || (rawName && rawName.toLowerCase() !== "reviewer" ? rawName : "Yoouz Reviewer");
  let finalHandle = registryMatch?.handle || knownMatch?.handle || authorObj.handle || `@${finalName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}`;
  if (!finalHandle.startsWith("@")) finalHandle = `@${finalHandle}`;

  // 4. Resolve authentic candidate avatar
  let candidateAvatar = registryMatch?.avatar || authorObj.avatar || (video as any)?.authorAvatar || (video as any)?.avatar;

  // Filter out invalid video file paths mistakenly passed as avatars
  if (
    candidateAvatar &&
    (candidateAvatar.includes("/api/videos/") ||
      candidateAvatar.includes(".mp4") ||
      candidateAvatar.includes("rev-") ||
      candidateAvatar === "data:;")
  ) {
    candidateAvatar = "";
  }

  // Check if active user matches this video
  let isActiveUserMatch = false;
  if (activeUser && (
    (activeUser.email && (activeUser.email.toLowerCase() === userKey || activeUser.email.toLowerCase() === (video?.userEmail || "").toLowerCase())) ||
    (activeUser.name && activeUser.name.toLowerCase() === finalName.toLowerCase()) ||
    (activeUser.name && activeUser.name.toLowerCase() === nameKey)
  )) {
    isActiveUserMatch = true;
    if (activeUser.name) finalName = activeUser.name;
    if (activeUser.avatar) candidateAvatar = activeUser.avatar;
  }

  if (!candidateAvatar && knownMatch?.avatar) {
    candidateAvatar = knownMatch.avatar;
  }

  const finalAvatar = getSafeAvatarUrl(candidateAvatar, finalName, finalHandle);

  const finalBio = (isActiveUserMatch && activeUser?.bio)
    ? activeUser.bio
    : (registryMatch?.bio || knownMatch?.bio || authorObj.bio);

  const finalBanner = (isActiveUserMatch && (activeUser as any)?.banner)
    ? (activeUser as any).banner
    : (registryMatch?.banner || authorObj.banner);

  const finalLocation = (isActiveUserMatch && activeUser?.location)
    ? activeUser.location
    : (registryMatch?.location || authorObj.location);

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
    bio: finalBio,
    banner: finalBanner,
    location: finalLocation
  };
}

/**
 * Formats a clean City, Country display string for a user/reviewer.
 * Never exposes @handles or usernames.
 * E.g., "Los Angeles, California, United States" -> "Los Angeles, United States"
 *       "Paris, France" -> "Paris, France"
 */
export function formatCityCountry(creator?: {
  city?: string;
  country?: string;
  location?: string;
} | any): string {
  if (!creator) return "";
  const cleanCity = (creator.city || "").trim();
  const cleanCountry = (creator.country || "").trim();
  if (
    cleanCity &&
    cleanCountry &&
    cleanCity.toLowerCase() !== "online" &&
    cleanCity.toLowerCase() !== "verified location" &&
    cleanCountry.toLowerCase() !== "online"
  ) {
    return `${cleanCity}, ${cleanCountry}`;
  }

  if (creator.location) {
    const parts = String(creator.location)
      .split(",")
      .map((p: string) => p.trim())
      .filter((p: string) => Boolean(p) && p.toLowerCase() !== "online" && p.toLowerCase() !== "verified location");

    if (parts.length >= 3) {
      return `${parts[0]}, ${parts[parts.length - 1]}`;
    }
    if (parts.length === 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    if (parts.length === 1) {
      return parts[0];
    }
  }

  if (cleanCity && cleanCity.toLowerCase() !== "online" && cleanCity.toLowerCase() !== "verified location") {
    return cleanCity;
  }
  if (cleanCountry && cleanCountry.toLowerCase() !== "online") {
    return cleanCountry;
  }

  return "";
}
