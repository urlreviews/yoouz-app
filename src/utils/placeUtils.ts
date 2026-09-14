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
  
  // If slug like "fiverr-com", "digitalpark-ae", "mastercard-com", "legal500-com"
  if (clean.endsWith("-co-uk")) clean = clean.replace(/-co-uk$/, ".co.uk");
  if (clean.endsWith("-com")) clean = clean.replace(/-com$/, ".com");
  if (clean.endsWith("-net")) clean = clean.replace(/-net$/, ".net");
  if (clean.endsWith("-org")) clean = clean.replace(/-org$/, ".org");
  if (clean.endsWith("-io")) clean = clean.replace(/-io$/, ".io");
  if (clean.endsWith("-co")) clean = clean.replace(/-co$/, ".co");
  if (clean.endsWith("-ai")) clean = clean.replace(/-ai$/, ".ai");
  if (clean.endsWith("-app")) clean = clean.replace(/-app$/, ".app");
  if (clean.endsWith("-dev")) clean = clean.replace(/-dev$/, ".dev");
  if (clean.endsWith("-me")) clean = clean.replace(/-me$/, ".me");
  if (clean.endsWith("-ae")) clean = clean.replace(/-ae$/, ".ae");
  if (clean.endsWith("-be")) clean = clean.replace(/-be$/, ".be");
  if (clean.endsWith("-de")) clean = clean.replace(/-de$/, ".de");
  if (clean.endsWith("-fr")) clean = clean.replace(/-fr$/, ".fr");
  if (clean.endsWith("-uk")) clean = clean.replace(/-uk$/, ".uk");
  if (clean.endsWith("-ca")) clean = clean.replace(/-ca$/, ".ca");
  if (clean.endsWith("-tech")) clean = clean.replace(/-tech$/, ".tech");
  if (clean.endsWith("-store")) clean = clean.replace(/-store$/, ".store");
  if (clean.endsWith("-online")) clean = clean.replace(/-online$/, ".online");
  if (clean.endsWith("-xyz")) clean = clean.replace(/-xyz$/, ".xyz");
  if (clean.endsWith("-site")) clean = clean.replace(/-site$/, ".site");
  if (clean.endsWith("-digital")) clean = clean.replace(/-digital$/, ".digital");
  if (clean.endsWith("-agency")) clean = clean.replace(/-agency$/, ".agency");
  
  // Generic fallback for any hyphenated TLD (e.g. -sa, -in, -biz)
  if (!clean.includes(".") && /-([a-z]{2,10})$/i.test(clean)) {
    clean = clean.replace(/-([a-z]{2,10})$/i, ".$1");
  }

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
  if (urlSource.includes("place-custom") || urlSource.includes("yoouz")) {
    return "yoouz.com";
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
 * Verified Official Names Dictionary for Known Brands and Seeded Places
 */
export const KNOWN_OFFICIAL_NAMES: Record<string, string> = {
  "digitalpark": "Digital Park",
  "digitalpark.ae": "Digital Park",
  "digitalparkae": "Digital Park",
  "digitalparkae.com": "Digital Park",
  "dubaidigitalpark": "Dubai Digital Park",
  "aldhabidental": "Al Dhabi Dental Center",
  "aldhabidental.ae": "Al Dhabi Dental Center",
  "aldhabidentalcenter": "Al Dhabi Dental Center",
  "aldhabidentalclinic": "Al Dhabi Dental Center",
  "aldhabi": "Al Dhabi Dental Center",
  "thecapitalavenue": "The Capital Avenue",
  "thecapitalavenue.com": "The Capital Avenue",
  "thecapitalavenuerealestate": "The Capital Avenue Real Estate",
  "thecapitalavenuerealestateabudhabi": "The Capital Avenue Real Estate",
  "districtuae": "District Real Estate",
  "districtuae.com": "District Real Estate",
  "districtrealestate": "District Real Estate",
  "londontrustedtherapy": "London Trusted Therapy",
  "londontrustedtherapy.com": "London Trusted Therapy",
  "kempinski": "Kempinski Hotels",
  "kempinski.com": "Kempinski Hotels",
  "timehotels": "Time Hotels",
  "timehotels.com": "Time Hotels",
  "www-timehotels-com": "Time Hotels",
  "legal500": "The Legal 500",
  "legal500.com": "The Legal 500",
  "thelegal500": "The Legal 500",
  "freecancellations": "Free Cancellations",
  "freecancellations.com": "Free Cancellations",
  "www-freecancellations-com": "Free Cancellations",
  "tajhotels": "Taj Hotels",
  "tajhotels.com": "Taj Hotels",
  "www-tajhotels-com": "Taj Hotels",
  "plomberiebruxelles24": "Plomberie Bruxelles 24",
  "plomberiebruxelles24.be": "Plomberie Bruxelles 24",
  "toptechbelgium": "Toptech Belgium SRL",
  "toptechbelgiumsrl": "Toptech Belgium SRL",
  "bhol": "B'Chadrei Charedim",
  "bhol.co.il": "B'Chadrei Charedim",
  "brettlevy": "Brett Levy",
  "brettlevy.com": "Brett Levy",
  "yoouz": "Yoouz",
  "yoouz.com": "Yoouz",
  "apple": "Apple",
  "apple.com": "Apple",
  "github": "GitHub",
  "github.com": "GitHub",
  "google": "Google",
  "google.com": "Google",
  "uber": "Uber",
  "uber.com": "Uber",
  "spotify": "Spotify",
  "spotify.com": "Spotify",
  "facebook": "Facebook",
  "facebook.com": "Facebook",
  "meta": "Meta",
  "meta.com": "Meta",
  "reddit": "Reddit",
  "reddit.com": "Reddit",
  "ibm": "IBM",
  "ibm.com": "IBM",
  "ups": "UPS",
  "ups.com": "UPS",
  "cnn": "CNN",
  "cnn.com": "CNN",
  "zoom": "Zoom",
  "zoom.us": "Zoom",
  "zoom.com": "Zoom",
  "usa": "USA",
  "usa.com": "USA",
  "mastercard": "Mastercard",
  "mastercard.com": "Mastercard",
  "bensonbingham": "Benson & Bingham",
  "bensonbingham.com": "Benson & Bingham",
  "bensonandbingham": "Benson & Bingham",
  "bensonandbingham.com": "Benson & Bingham",
  "www-bensonbingham-com": "Benson & Bingham"
};

/**
 * Splits concatenated compound words, slugs, and camelCase domain strings into separate human-readable words.
 */
export function splitCompoundWords(str: string): string {
  let s = str.trim();
  // 1. Split camelCase/PascalCase
  s = s.replace(/([a-z])([A-Z])/g, "$1 $2");
  // 2. Split letter-number and number-letter
  s = s.replace(/([a-zA-Z])([0-9]+)/g, "$1 $2").replace(/([0-9]+)([a-zA-Z])/g, "$1 $2");
  // 3. Known brand/locational prefixes
  s = s.replace(/^(al|el|the|my|all|pro|top|best|smart|super|grand|royal|premier|prime|express|trusted|london|dubai|paris|nyc|uae|digital)(?=[a-z]{3,})/i, "$1 ");
  
  // 4. Known compound word boundaries & suffixes
  const commonWords = /(benson|bingham|injury|accident|lawyer|lawyers|attorney|attorneys|lawfirm|dental|clinic|center|centre|park|hotels?|avenue|valley|therapy|services?|solutions?|group|media|news|technology|tech|studios?|travel|cafe|coffee|bar|suites?|hospitals?|stores?|shops?|markets?|clubs?|fitness|gym|labs?|care|health|spa|salon|resorts?|villas?|restaurants?|kitchen|bakery|grill|bistro|plumber|plomberie|cancellations?|motors?|auto|rentals?|logistics|express|trust|trusted|capital|consulting|associates?|partners?|properties|realestate|agency|law|firm|dentists?|orthodontics|wellness|massage|towers?|plaza|square|malls?|hubs?|holdings|globals?|international|world|networks?|systems?|software|security|design|creative|productions?|interactive|marketing|defense|aviation|shipping|cargo|freight|courier)/gi;
  
  // Apply word splitting if no spaces yet
  const parts = s.split(" ").map(p => {
    if (p.length > 4 && !p.includes("-") && !p.includes("_")) {
      return p.replace(commonWords, " $1 ");
    }
    return p;
  });
  s = parts.join(" ").replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Formats a business name for display, cleaning it if it looks like a URL.
 * Converts domain-like strings, slugs, and SEO titles into clean, official separate-word business names.
 * e.g., "digitalpark.ae" -> "Digital Park"
 * e.g., "aldhabidental.ae" -> "Al Dhabi Dental Center"
 * e.g., "https://www.tajhotels.com/" -> "Taj Hotels"
 * e.g., "www-tajhotels-com" -> "Taj Hotels"
 * e.g., "thecapitalavenue.com" -> "The Capital Avenue"
 * e.g., "https://www.freecancellations.com" -> "Free Cancellations"
 */
export function formatBusinessName(name?: string | null): string {
  if (!name) return "";
  let trimmed = name.trim();
  
  // Quick lookup of trimmed normalized key
  const normalizedKey = trimmed.toLowerCase().replace(/^https?:\/\//, "").replace(/^www[\.\-]/, "").replace(/\/+$/, "");
  if (KNOWN_OFFICIAL_NAMES[normalizedKey]) {
    return KNOWN_OFFICIAL_NAMES[normalizedKey];
  }
  const cleanKey = normalizedKey.replace(/[^a-z0-9]/g, "");
  if (KNOWN_OFFICIAL_NAMES[cleanKey]) {
    return KNOWN_OFFICIAL_NAMES[cleanKey];
  }

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

  // Re-check normalized key after SEO title strip
  const strippedKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (KNOWN_OFFICIAL_NAMES[strippedKey]) {
    return KNOWN_OFFICIAL_NAMES[strippedKey];
  }

  // 4. If it is an explicit URL, domain, or domain-like string (e.g. "https://...", "www.domain.com", "domain.com", "tajhotels-com", "bhol.co.il", "digitalpark.ae")
  const isDomainLike = 
    trimmed.includes("://") || 
    trimmed.toLowerCase().startsWith("www.") || 
    trimmed.toLowerCase().startsWith("www-") ||
    trimmed.toLowerCase().startsWith("http:") ||
    trimmed.toLowerCase().startsWith("https:") ||
    /\.[a-z]{2,}(?:\/|$|\?|#)/i.test(trimmed) ||
    /^[a-z0-9-_]+(?:\.[a-z0-9-_]+)+$/i.test(trimmed) ||
    /-(?:com|net|org|io|co|ai|app|dev|tech|store|be|co-uk)$/i.test(trimmed);

  let rawName = trimmed;
  if (isDomainLike) {
    const cleanDomain = extractCleanDomain(trimmed);
    rawName = cleanDomain.replace(/\.(co\.[a-z]{2}|co\.[a-z]{3}|[a-z]{2,10})$/i, "").split(".")[0] || cleanDomain;
  }

  // 5. Final fallback cleanup - strip any remaining protocol, www, or TLD suffixes
  rawName = rawName
    .replace(/^https?:\/\//i, '')
    .replace(/^www[\.\-\/]/i, '')
    .replace(/\.(?:com|net|org|io|co|ai|app|dev|tech|store|be|co\.uk|co\.il|ae|ca|de|fr|it|es|eu|nl|ch|at|pl|in|cn|jp|kr|xyz|info|biz|online|site|law|club|me|tv|us|uk)$/i, '');

  // 6. Split compound words
  let spaced = splitCompoundWords(rawName);

  if (/^jb(?=[a-z])/i.test(spaced)) {
    spaced = spaced.replace(/^jb/i, "JB ");
  }
  if (/^brettlevy$/i.test(spaced)) {
    spaced = "Brett Levy";
  }

  const acronyms = new Set(["usa", "nyc", "la", "uk", "us", "ai", "api", "ibm", "bbc", "cnn", "cbs", "nbc", "hbo", "eu", "srl", "uae"]);
  const lowerCaseWords = new Set(["of", "the", "and", "in", "at", "de", "et", "du", "des"]);

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

  const result = words.join(' ');
  if (result.length > 0 && !result.includes(" ")) {
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result || trimmed;
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
  const sanitizeBanner = (url?: string | null): string => {
    if (!url || typeof url !== "string") return "";
    const t = url.trim();
    if (t.includes("unsplash.com") || t.includes("placeholder") || t.includes("mock")) {
      return "";
    }
    return t;
  };

  const existing = existingPlaces.find((p) => isPlaceReviewMatch(video, p));
  const domain = extractCleanDomain(video.placeWebsite || video.placeName || video.placeId);
  const cleanId = domain || (video.placeId ? extractCleanDomain(video.placeId) : `place-${Date.now()}`);
  const reviewBanner = sanitizeBanner(
    (video as any).placeBannerUrl ||
    (video as any).bannerUrl ||
    (video as any).ogImage ||
    (domain && KNOWN_BRAND_BANNERS[domain]) ||
    ""
  );
  const reviewLogo =
    (video.placeLogoUrl && !video.placeLogoUrl.includes("gstatic.com") && !video.placeLogoUrl.includes("faviconV2")) ? video.placeLogoUrl :
    ((domain && KNOWN_BRAND_LOGOS[domain]) ||
     (domain ? getCleanLogoUrl(null, domain) || "" : ""));

  if (existing) {
    const rawBanner = existing.bannerUrl || existing.ogImage || reviewBanner || (domain && KNOWN_BRAND_BANNERS[domain]) || "";
    const banner = sanitizeBanner(rawBanner);
    const logo = (existing.logoUrl && !existing.logoUrl.startsWith("data:;") && !existing.logoUrl.includes("gstatic.com") && !existing.logoUrl.includes("faviconV2")) ? existing.logoUrl : ((existing.avatarUrl && !existing.avatarUrl.startsWith("data:;") && !existing.avatarUrl.includes("gstatic.com") && !existing.avatarUrl.includes("faviconV2")) ? existing.avatarUrl : (reviewLogo || (domain && KNOWN_BRAND_LOGOS[domain]) || ""));
    const website = (existing.website && !existing.website.includes("maps.google.com")) 
      ? existing.website 
      : (video.placeWebsite || (domain ? `https://${domain}` : ""));
    const description = video.placeDescription || (existing.description && !existing.description.includes("Verified video review destination") && !existing.description.includes("Verified Yoouz business listing") ? existing.description : "") || existing.description || "";
    
    // Automatically promote clean formatted business name if existing name was a raw domain or slug
    const isGenericOrDomainName = !existing.name ||
      existing.name.toLowerCase() === (existing.id || "").toLowerCase() ||
      existing.name.toLowerCase() === (existing.brandDomain || "").toLowerCase() ||
      existing.name.includes(".") ||
      !existing.name.includes(" ") ||
      existing.name.toLowerCase() === "website" ||
      existing.name.toLowerCase().includes("bensonbingham");

    const updatedName = (video.placeName && (isGenericOrDomainName || !video.placeName.includes(".")))
      ? (formatBusinessName(video.placeName) || formatBusinessName(existing.name) || existing.name)
      : (formatBusinessName(existing.name) || existing.name);

    return {
      ...existing,
      name: updatedName,
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

export const KNOWN_COMMUNITY_USERS: Record<string, { name: string; handle: string; avatar: string; bio?: string; location?: string }> = {};

/**
 * Deleted Users Helpers: Synchronized across localStorage, SSE, and server index
 */
export function getDeletedUserIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("yoouz_deleted_users");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((s) => String(s).toLowerCase().trim()).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

export function unrecordDeletedUsersInLocalStorage(ids: string[]): void {
  if (typeof window === "undefined" || !Array.isArray(ids) || ids.length === 0) return;
  try {
    const rawYoouz = localStorage.getItem("yoouz_deleted_users");
    const rawCopo = localStorage.getItem("copo_deleted_users");
    const set = new Set<string>();
    if (rawYoouz) {
      try {
        const arr = JSON.parse(rawYoouz);
        if (Array.isArray(arr)) arr.forEach(s => set.add(String(s).toLowerCase().trim()));
      } catch (e) {}
    }
    if (rawCopo) {
      try {
        const arr = JSON.parse(rawCopo);
        if (Array.isArray(arr)) arr.forEach(s => set.add(String(s).toLowerCase().trim()));
      } catch (e) {}
    }

    for (const rawId of ids) {
      if (!rawId) continue;
      const clean = String(rawId).toLowerCase().trim();
      const withoutAt = clean.replace(/^@+/, "");
      const slugHyphens = withoutAt.replace(/[\s_]+/g, "-").trim();
      const slugSpaces = withoutAt.replace(/[-_]+/g, " ").trim();
      const username = clean.includes("@") ? clean.split("@")[0] : withoutAt;
      const usrKey = clean.startsWith("usr_") ? clean : `usr_${clean.replace(/[^a-zA-Z0-9]/g, "_")}`;

      const variants = [clean, withoutAt, slugHyphens, slugSpaces, username, usrKey];
      for (const v of variants) {
        set.delete(v);
      }
    }
    const result = Array.from(set);
    localStorage.setItem("yoouz_deleted_users", JSON.stringify(result));
    localStorage.setItem("copo_deleted_users", JSON.stringify(result));

    // Clear feed caches to ensure they reload instantly without stale user profiles/videos!
    try {
      localStorage.removeItem("yoouz_cached_videos_v28");
      localStorage.removeItem("yoouz_cached_videos_v27");
      localStorage.removeItem("yoouz_cached_videos_v26");
      localStorage.removeItem("yoouz_cached_videos_v25");
      localStorage.removeItem("yoouz_local_created_reviews");
    } catch (err) {}
  } catch (e) {}
}

export function purgeUserFromRegistryCache(ids: string[]): void {
  if (!Array.isArray(ids) || ids.length === 0) return;
  for (const rawId of ids) {
    if (!rawId) continue;
    const clean = String(rawId).toLowerCase().trim();
    const withoutAt = clean.replace(/^@+/, "");
    const slugHyphens = withoutAt.replace(/[\s_]+/g, "-").trim();
    const slugSpaces = withoutAt.replace(/[-_]+/g, " ").trim();
    const username = clean.includes("@") ? clean.split("@")[0] : withoutAt;
    const usrKey = clean.startsWith("usr_") ? clean : `usr_${clean.replace(/[^a-zA-Z0-9]/g, "_")}`;

    const variants = [clean, withoutAt, slugHyphens, slugSpaces, username, usrKey];
    for (const v of variants) {
      delete memoryUserRegistry[v];
    }
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("yoouz_users_registry_cache", JSON.stringify(memoryUserRegistry));
    } catch (e) {}
  }
}

export function recordDeletedUsersInLocalStorage(ids: string[]): void {
  if (typeof window === "undefined" || !Array.isArray(ids) || ids.length === 0) return;
  try {
    const current = getDeletedUserIds();
    const set = new Set(current);
    let changed = false;
    for (const rawId of ids) {
      if (!rawId) continue;
      const clean = String(rawId).toLowerCase().trim();
      const withoutAt = clean.replace(/^@+/, "");
      const slugHyphens = withoutAt.replace(/[\s_]+/g, "-").trim();
      const slugSpaces = withoutAt.replace(/[-_]+/g, " ").trim();
      const username = clean.includes("@") ? clean.split("@")[0] : withoutAt;
      const usrKey = clean.startsWith("usr_") ? clean : `usr_${clean.replace(/[^a-zA-Z0-9]/g, "_")}`;

      const variants = [clean, withoutAt, slugHyphens, slugSpaces, username, usrKey];
      for (const v of variants) {
        if (v && !set.has(v)) {
          set.add(v);
          changed = true;
        }
      }
    }
    if (changed) {
      localStorage.setItem("yoouz_deleted_users", JSON.stringify(Array.from(set)));
      localStorage.setItem("copo_deleted_users", JSON.stringify(Array.from(set)));
    }
    purgeUserFromRegistryCache(ids);
  } catch (e) {}
}

export function isUserDeleted(userOrIdOrEmail: any, deletedIds?: string[]): boolean {
  if (!userOrIdOrEmail) return false;
  const list = deletedIds || getDeletedUserIds();
  if (!list || list.length === 0) return false;
  const set = new Set(list.map((s) => String(s).toLowerCase().trim()).filter(Boolean));

  const checkVal = (v: any): boolean => {
    if (!v) return false;
    const s = String(v).toLowerCase().trim();
    if (!s) return false;
    const withoutAt = s.replace(/^@+/, "");
    const slugHyphens = withoutAt.replace(/[\s_]+/g, "-").trim();
    const slugSpaces = withoutAt.replace(/[-_]+/g, " ").trim();
    const username = s.includes("@") ? s.split("@")[0] : withoutAt;
    const usrKey = s.startsWith("usr_") ? s : `usr_${s.replace(/[^a-zA-Z0-9]/g, "_")}`;

    return set.has(s) || set.has(withoutAt) || set.has(slugHyphens) || set.has(slugSpaces) || set.has(username) || set.has(usrKey);
  };

  if (typeof userOrIdOrEmail === "string") {
    return checkVal(userOrIdOrEmail);
  }

  if (typeof userOrIdOrEmail === "object") {
    const u = userOrIdOrEmail;
    if (u.id && checkVal(u.id)) return true;
    if (u.uid && checkVal(u.uid)) return true;
    if (u.email && checkVal(u.email)) return true;
    if (u.handle && checkVal(u.handle)) return true;
    if (u.name && checkVal(u.name)) return true;
    if (u.username && checkVal(u.username)) return true;
    if (u.author && isUserDeleted(u.author, list)) return true;
    if (u.authorName && checkVal(u.authorName)) return true;
    if (u.authorHandle && checkVal(u.authorHandle)) return true;
  }

  return false;
}

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

    // Remove from local storage deleted list since we received active data
    try {
      const idsToRestore = [emailKey, nameKey, handleKey, uidKey].filter(Boolean);
      if (idsToRestore.length > 0) {
        unrecordDeletedUsersInLocalStorage(idsToRestore);
      }
    } catch (err) {}
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

  // 3. Match against known community users and user registry (if not deleted)
  const nameKey = rawName.toLowerCase().replace(/^@+/, "");
  const userKey = (video?.userId || video?.userEmail || (authorObj as any).userId || (authorObj as any).email || "").toLowerCase().trim();
  const handleKey = (authorObj.handle || "").toLowerCase().replace(/^@+/, "");

  let registryMatch = getUserFromRegistry(userKey) || getUserFromRegistry(nameKey) || getUserFromRegistry(handleKey);
  let knownMatch = KNOWN_COMMUNITY_USERS[nameKey] || KNOWN_COMMUNITY_USERS[userKey] || KNOWN_COMMUNITY_USERS[handleKey];

  if (isUserDeleted(registryMatch) || isUserDeleted(userKey) || isUserDeleted(nameKey) || isUserDeleted(handleKey)) {
    registryMatch = undefined;
  }
  if (isUserDeleted(knownMatch) || isUserDeleted(userKey) || isUserDeleted(nameKey) || isUserDeleted(handleKey)) {
    knownMatch = undefined;
  }

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

/**
 * Reads blacklisted/deleted place IDs from localStorage
 */
export function getDeletedPlaceIds(): string[] {
  try {
    const raw = localStorage.getItem("copo_deleted_places") || "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Returns all variants of a place (slug, dot, domain, name, www, without www)
 */
export function getPlaceVariants(placeOrId: any): string[] {
  if (!placeOrId) return [];
  const variants = new Set<string>();

  const rawId = typeof placeOrId === "string" ? placeOrId.trim() : (placeOrId.id || "").trim();
  if (rawId) {
    variants.add(rawId);
    variants.add(rawId.toLowerCase());
    variants.add(rawId.replace(/-/g, "."));
    variants.add(rawId.replace(/\./g, "-"));
  }

  const domainSource = typeof placeOrId === "object"
    ? (placeOrId.brandDomain || placeOrId.website || placeOrId.address || placeOrId.placeWebsite || "")
    : rawId;

  const cleanDomain = extractCleanDomain(domainSource);
  if (cleanDomain) {
    variants.add(cleanDomain);
    variants.add(cleanDomain.toLowerCase());
    variants.add(`www.${cleanDomain}`);
    variants.add(cleanDomain.replace(/\./g, "-"));
  }

  if (typeof placeOrId === "object") {
    if (placeOrId.name) {
      const name = String(placeOrId.name).trim().toLowerCase();
      if (name.length > 2) variants.add(name);
    }
    if (placeOrId.brandDomain) {
      const bd = extractCleanDomain(placeOrId.brandDomain);
      if (bd) variants.add(bd);
    }
    if (placeOrId.website) {
      const ws = extractCleanDomain(placeOrId.website);
      if (ws) variants.add(ws);
    }
  }

  return Array.from(variants).filter(Boolean);
}

/**
 * Checks if a place or ID matches the blacklist of deleted places
 */
export function isPlaceDeleted(placeOrId: any, deletedIds?: string[]): boolean {
  if (!placeOrId) return false;
  const list = deletedIds || getDeletedPlaceIds();
  if (!list || list.length === 0) return false;

  const variants = getPlaceVariants(placeOrId).map((v) => v.toLowerCase().trim());
  const deletedSet = new Set(list.map((s) => String(s).toLowerCase().trim()));

  for (const v of variants) {
    if (deletedSet.has(v)) return true;
  }

  // Also check domain substring match
  for (const d of deletedSet) {
    if (!d || d.length < 3) continue;
    for (const v of variants) {
      if (v === d) return true;
      if (v.includes(".") && d.includes(".") && (v === d || v.includes(d) || d.includes(v))) return true;
    }
  }

  return false;
}

export function unrecordDeletedPlacesInLocalStorage(variants: string[]): string[] {
  try {
    const current = getDeletedPlaceIds();
    const set = new Set(current);
    variants.forEach((v) => {
      const clean = String(v).trim().toLowerCase();
      const dot = clean.replace(/-/g, '.');
      const hyphen = clean.replace(/\./g, '-');
      set.delete(clean);
      set.delete(dot);
      set.delete(hyphen);
    });
    const updated = Array.from(set);
    localStorage.setItem("copo_deleted_places", JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

/**
 * Stores newly deleted place variants into localStorage
 */
export function recordDeletedPlacesInLocalStorage(variants: string[]): string[] {
  try {
    const current = getDeletedPlaceIds();
    const set = new Set(current);
    variants.forEach((v) => {
      const clean = String(v).trim();
      if (clean) set.add(clean);
    });
    const updated = Array.from(set);
    localStorage.setItem("copo_deleted_places", JSON.stringify(updated));
    return updated;
  } catch (e) {
    return variants;
  }
}
