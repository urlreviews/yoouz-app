import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { getCleanLogoUrl, KNOWN_BRAND_BANNERS, KNOWN_BRAND_LOGOS, getProxiedImageUrl, YOOUZ_LOGO_DATA_URI } from "./logoUtils";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { getCanonicalUserKey } from "../lib/userCanonicalization";

export const YOOUZ_VIDEOS_CACHE_KEY = "yoouz_cached_videos_v30";

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
export function getCleanDomainUrl(item?: string | { brandDomain?: string; website?: string; id?: string; name?: string; placeWebsite?: string; placeName?: string; placeId?: string } | null): string {
  if (!item) return "";
  const isRevId = (str?: string) => !str ? false : (str.startsWith("rev") || /rev\d+/i.test(str) || /rev[0-9a-f]{8,}/i.test(str) || str.includes("rev17895"));

  if (typeof item === "string") {
    if (isRevId(item)) return "yoouz.com";
    return extractCleanDomain(item);
  }
  // If Place or Place-like object
  let domainSource = item.brandDomain || item.placeWebsite || item.website;
  if (!domainSource && item.placeId && !isRevId(item.placeId)) domainSource = item.placeId;
  if (!domainSource && item.placeName && !isRevId(item.placeName)) domainSource = item.placeName;
  if (!domainSource && item.name && !isRevId(item.name)) domainSource = item.name;
  if (!domainSource && item.id && !isRevId(item.id)) domainSource = item.id;

  const clean = extractCleanDomain(domainSource || "");
  if (clean && clean.includes(".") && !isRevId(clean)) return clean;
  if (item.brandDomain) {
    const brandClean = extractCleanDomain(item.brandDomain);
    if (brandClean && brandClean.includes(".") && !isRevId(brandClean)) return brandClean;
  }
  if (item.website || item.placeWebsite) {
    const webClean = extractCleanDomain(item.website || item.placeWebsite);
    if (webClean && webClean.includes(".") && !isRevId(webClean)) return webClean;
  }
  return (clean && !isRevId(clean)) ? clean : "yoouz.com";
}

/**
 * Gets a clean URL slug for a place (e.g. "digitalpark.ae", "legal500.com", "yoouz.com")
 * Guarantees no "www." prefixes or URL protocol baggage while keeping authentic domain dots.
 */
export function getPlaceSlug(placeSource: string | { placeWebsite?: string, placeName?: string, name?: string, website?: string, brandDomain?: string, id?: string, placeId?: string } | null | undefined): string {
  const domain = getDisplayUrlAsDomain(placeSource);
  return domain.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9\._-]/g, "").trim();
}

export function getDisplayUrlAsDomain(placeSource: string | { placeWebsite?: string, placeName?: string, name?: string, website?: string, brandDomain?: string, id?: string, placeId?: string } | null | undefined): string {
  if (!placeSource) return "yoouz.com";
  
  const isRevId = (str?: string) => !str ? false : (str.startsWith("rev") || /rev\d+/i.test(str) || /rev[0-9a-f]{8,}/i.test(str) || str.includes("rev17895"));

  if (typeof placeSource === "string") {
    if (isRevId(placeSource)) return "yoouz.com";
    const clean = extractCleanDomain(placeSource);
    if (clean && clean.includes(".") && !isRevId(clean)) return clean;
    if (clean && !isRevId(clean)) return `${clean}.com`;
    return "yoouz.com";
  }

  let urlSource = "";
  if (placeSource.brandDomain) urlSource = placeSource.brandDomain;
  else if (placeSource.placeWebsite) urlSource = placeSource.placeWebsite;
  else if (placeSource.website) urlSource = placeSource.website;
  else if (placeSource.placeId && !isRevId(placeSource.placeId)) urlSource = placeSource.placeId;
  else if (placeSource.placeName && !isRevId(placeSource.placeName)) urlSource = placeSource.placeName;
  else if (placeSource.name && !isRevId(placeSource.name)) urlSource = placeSource.name;
  else if (placeSource.id && !isRevId(placeSource.id)) urlSource = placeSource.id;

  if (!urlSource || isRevId(urlSource) || urlSource.includes("place-custom") || urlSource.includes("yoouz")) {
    return "yoouz.com";
  }

  let domain = extractCleanDomain(urlSource);
  
  if (!domain || isRevId(domain)) {
    if (placeSource.name || placeSource.placeName) {
      const pName = (placeSource.name || placeSource.placeName || "").trim();
      if (pName && !isRevId(pName)) {
        const cleanName = pName.toLowerCase().replace(/^www[\.\-]/, "").replace(/[^a-z0-9]/g, "");
        if (cleanName) return `${cleanName}.com`;
      }
    }
    return "yoouz.com";
  }

  if (!domain.includes(".")) {
    domain = domain.split('|')[0].replace(/[^a-z0-9]/g, "") + ".com";
  }

  if (isRevId(domain) || domain.startsWith("rev")) {
    return "yoouz.com";
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
  if (typeof explicitViews === "number" && !isNaN(explicitViews) && explicitViews >= 0) {
    return explicitViews;
  }

  return 0;
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
  "starbucks.com": "Starbucks",
  "starbucks": "Starbucks",
  "nike.com": "Nike",
  "nike": "Nike",
  "mcdonalds.com": "McDonald's",
  "mcdonalds": "McDonald's",
  "apple.com": "Apple",
  "apple": "Apple",
  "google.com": "Google",
  "google": "Google",
  "microsoft.com": "Microsoft",
  "microsoft": "Microsoft",
  "amazon.com": "Amazon",
  "amazon": "Amazon",
  "netflix.com": "Netflix",
  "netflix": "Netflix",
  "uber.com": "Uber",
  "uber": "Uber",
  "airbnb.com": "Airbnb",
  "airbnb": "Airbnb",
  "booking.com": "Booking.com",
  "booking": "Booking.com",
  "hilton.com": "Hilton Hotels",
  "hilton": "Hilton Hotels",
  "marriott.com": "Marriott Hotels",
  "marriott": "Marriott Hotels",
  "zara.com": "Zara",
  "zara": "Zara",
  "hm.com": "H&M",
  "carrefour.com": "Carrefour",
  "carrefour": "Carrefour",
  "isrotel.co.il": "ישרוטל אילת",
  "isrotel": "ישרוטל אילת",
  "danhotels.co.il": "דן אילת",
  "danhotels": "דן אילת",
  "clubhotels-israel.com": "קלאב הוטל אילת",
  "clubhotels.co.il": "קלאב הוטל אילת",
  "azrielimalls.co.il": "קניוני עזריאלי",
  "azrieli.com": "קבוצת עזריאלי",
  "azrieli": "קניוני עזריאלי",
  "azrielimall": "קניוני עזריאלי",
  "קניון עזריאלי תל אביב": "קניוני עזריאלי תל אביב",
  "קניון עזריאלי": "קניוני עזריאלי",
  "מרכז עזריאלי": "קניוני עזריאלי תל אביב",
  "קניוני עזריאלי": "קניוני עזריאלי",
  "dizengoff-center.co.il": "דיזנגוף סנטר",
  "dizengoffcenter.co.il": "דיזנגוף סנטר",
  "dizengoff": "דיזנגוף סנטר",
  "דיזנגוף סנטר": "דיזנגוף סנטר",
  "myofer.co.il": "קניוני עופר",
  "ofermalls": "קניוני עופר",
  "קניוני עופר": "קניוני עופר",
  "קניון רמת אביב": "קניון רמת אביב",
  "bigmalls.co.il": "מרכזי ביג",
  "bigmalls": "מרכזי ביג",
  "tlv-mall.co.il": "TLV Fashion Mall",
  "7stars.co.il": "קניון שבעת הכוכבים",
  "קניון שבעת הכוכבים": "קניון שבעת הכוכבים",
  "shufersal.co.il": "שופרסל",
  "shufersal": "שופרסל",
  "שופרסל": "שופרסל",
  "rami-levy.co.il": "רמי לוי שיווק השקמה",
  "ramilevy": "רמי לוי שיווק השקמה",
  "רמי לוי": "רמי לוי שיווק השקמה",
  "super-pharm.co.il": "סופר-פארם",
  "superpharm": "סופר-פארם",
  "סופר פארם": "סופר-פארם",
  "ynet.co.il": "Ynet",
  "ynet": "Ynet",
  "yust.com": "Yust Liege Hotel",
  "davidchantraine.be": "David Chantraine Eupen",
  "autowerkplaatsbrugge.be": "Auto Werkplaats Brugge",
  "autowerkplaatsbrugge": "Auto Werkplaats Brugge",
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
  "businessplace": "Business Place",
  "businessplace.com": "Business Place",
  "freecancellations": "Free Cancellations",
  "freecancellations.com": "Free Cancellations",
  "www-freecancellations-com": "Free Cancellations",
  "tajhotels": "Taj Hotels",
  "tajhotels.com": "Taj Hotels",
  "www-tajhotels-com": "Taj Hotels",
  "plomberiebruxelles24": "Plomberie Bruxelles 24",
  "plomberiebruxelles24.be": "Plomberie Bruxelles 24",
  "toptechbelgium": "Toptech Belgium SRL",
  "healis": "Healis",
  "healis.be": "Healis",
  "healis.com": "Healis",
  "healisbe": "Healis",
  "bvhealis": "Healis",
  "bvhealisholding": "Healis",
  "toptechbelgiumsrl": "Toptech Belgium SRL",
  "bhol": "B'Chadrei Charedim",
  "bhol.co.il": "B'Chadrei Charedim",
  "tandis": "Tandis",
  "tandis.be": "Tandis",
  "garageas": "Garage As",
  "garageas.be": "Garage As",
  "garageasbe": "Garage As",
  "garage-as": "Garage As",
  "garage-as.be": "Garage As",
  "www-garageas-be": "Garage As",
  "garage as": "Garage As",
  "garagejv": "Garage & Aanhangwagens Vermeersch J.",
  "garagejv.be": "Garage & Aanhangwagens Vermeersch J.",
  "garagejvbe": "Garage & Aanhangwagens Vermeersch J.",
  "garage-jv": "Garage & Aanhangwagens Vermeersch J.",
  "garage-jv.be": "Garage & Aanhangwagens Vermeersch J.",
  "www-garagejv-be": "Garage & Aanhangwagens Vermeersch J.",
  "garage jv": "Garage & Aanhangwagens Vermeersch J.",
  "apotheekgodelaine": "Apotheek Godelaine",
  "apotheekgodelaine.be": "Apotheek Godelaine",
  "www-apotheekgodelaine-be": "Apotheek Godelaine",
  "optieknieuwenhuysen": "Optiek Nieuwenhuysen",
  "optieknieuwenhuysen.be": "Optiek Nieuwenhuysen",
  "www-optieknieuwenhuysen-be": "Optiek Nieuwenhuysen",
  "nieuwenhuysen": "Optiek Nieuwenhuysen",
  "vandenbalck": "Optiek Vandenbalck",
  "vandenbalck.be": "Optiek Vandenbalck",
  "www-vandenbalck-be": "Optiek Vandenbalck",
  "toopoptiek": "Toop Optiek",
  "toopoptiek.com": "Toop Optiek",
  "www-toopoptiek-com": "Toop Optiek",
  "dental365": "Dental 365",
  "dental365.nl": "Dental 365",
  "www-dental365-nl": "Dental 365",
  "lassustandartsen": "Lassus Tandartsen",
  "lassustandartsen.nl": "Lassus Tandartsen",
  "www-lassustandartsen-nl": "Lassus Tandartsen",
  "lassustandartsen-nl": "Lassus Tandartsen",
  "dentisteerpent": "Dentiste Erpent",
  "dentisteerpent.be": "Dentiste Erpent",
  "dentiste-namur": "Dentiste Namur",
  "dentiste-namur.be": "Dentiste Namur",
  "brusselsdental": "Brussels Dental",
  "brusselsdental.com": "Brussels Dental",
  "brettlevy": "Brett Levy",
  "brettlevy.com": "Brett Levy",
  "yoouz": "Yoouz",
  "yoouz.com": "Yoouz",
  "hertz": "Hertz",
  "hertz.com": "Hertz",
  "www-hertz-com": "Hertz",
  "wwwhertzcom": "Hertz",
  "hertzcom": "Hertz",
  "github": "GitHub",
  "github.com": "GitHub",
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
  "www-bensonbingham-com": "Benson & Bingham",
  "lernerandrowe": "Lerner and Rowe Injury Attorneys",
  "lernerandrowe.com": "Lerner and Rowe Injury Attorneys",
  "www-lernerandrowe-com": "Lerner and Rowe Injury Attorneys",
  "lernerandrowelaw": "Lerner and Rowe Injury Attorneys",
  "lernerrowe": "Lerner and Rowe Injury Attorneys",
  "lernerrowe.com": "Lerner and Rowe Injury Attorneys",
  "vanlawfirm": "Van Law Firm Injury Attorneys",
  "vanlawfirm.com": "Van Law Firm Injury Attorneys",
  "www-vanlawfirm-com": "Van Law Firm Injury Attorneys",
  "alarislaw": "Alaris Law",
  "alaris-law": "Alaris Law",
  "alaris-law.com": "Alaris Law",
  "www-alaris-law-com": "Alaris Law",
  "nevadalegalservices": "Nevada Legal Services",
  "nevadalegalservices.org": "Nevada Legal Services",
  "www-nevadalegalservices-org": "Nevada Legal Services",
  "paulpowell": "The Paul Powell Law Firm",
  "paulpowell.com": "The Paul Powell Law Firm",
  "www-paulpowell-com": "The Paul Powell Law Firm",
  "thepaulpowelllawfirm": "The Paul Powell Law Firm",
  "paultoland": "Paul Toland Law Office",
  "paultolandlaw": "Paul Toland Law Office",
  "paultolandlaw.com": "Paul Toland Law Office",
  "theottleylawfirm": "The Ottley Law Firm",
  "theottleylawfirm.com": "The Ottley Law Firm",
  "mcveaghfleming": "McVeagh Fleming Lawyers",
  "mcveaghfleming.co.nz": "McVeagh Fleming Lawyers",
  "mcveaghfleminglawyers": "McVeagh Fleming Lawyers",
  "mcveaghfleminglawyers.co.nz": "McVeagh Fleming Lawyers",
  "mcveagh fleming": "McVeagh Fleming Lawyers",
  "mc veagh fleming": "McVeagh Fleming Lawyers",
  "mc veagh fleming lawyer s": "McVeagh Fleming Lawyers",
  "mcveagh fleming lawyer s": "McVeagh Fleming Lawyers",
  "www-mcveaghfleming-co-nz": "McVeagh Fleming Lawyers",
  "proximus": "Proximus",
  "proximus.be": "Proximus",
  "www.proximus.be": "Proximus",
  "pro-ximus": "Proximus",
  "pro ximus": "Proximus",
  "multipharma": "Multipharma",
  "multipharma.be": "Multipharma",
  "www.multipharma.be": "Multipharma",
  "autowerkplaatsbruggebe": "Auto Werkplaats Brugge",
  "autowerkplaats-brugge": "Auto Werkplaats Brugge",
  "autowerkplaats-brugge.be": "Auto Werkplaats Brugge",
  "www-autowerkplaatsbrugge-be": "Auto Werkplaats Brugge",
  "autowerkplaats brugge": "Auto Werkplaats Brugge",
  "auto werkplaats brugge": "Auto Werkplaats Brugge"
};

/**
 * Detects corrupt/fragmented strings scraped from website footers or contact blocks (e.g. "Kruis Tel", "St-Kruis Tel", "Tel: 050", etc.)
 */
export function isCorruptedBusinessName(name?: string | null): boolean {
  if (!name) return false;
  const lower = name.trim().toLowerCase();
  if (/^(st-)?kruis\s*tel$/i.test(lower)) return true;
  if (/^(st-)?kruis\s*tel[:\s]/i.test(lower)) return true;
  if (/^(tel|fax|gsm|phone|call|contact|address|location|postcode|zipcode|vat|be\s*0\d{3})[:\s]/i.test(lower)) return true;
  if (/^(tel|fax|gsm|phone)\b/i.test(lower) && /\d{3}/.test(lower)) return true;
  if (/^maalsesteenweg/i.test(lower) || /^postcode/i.test(lower)) return true;
  return false;
}

/**
 * Splits concatenated compound words, slugs, and camelCase domain strings into separate human-readable words.
 */
export function splitCompoundWords(str: string): string {
  let s = str.trim();
  // If already a clean capitalized word (e.g. "Proximus", "Multipharma"), do not split
  if (/^[A-Z][a-z0-9]+$/.test(s)) {
    return s;
  }
  // 1. Split camelCase/PascalCase
  s = s.replace(/([a-z])([A-Z])/g, "$1 $2");
  // 2. Split letter-number and number-letter
  s = s.replace(/([a-zA-Z])([0-9]+)/g, "$1 $2").replace(/([0-9]+)([a-zA-Z])/g, "$1 $2");
  // 3. Known brand/locational prefixes (Note: do NOT split "pro", "all", "my", "top" to prevent breaking Proximus, Profile, Alliance, etc.)
  s = s.replace(/^(the|smart|super|grand|royal|premier|prime|express|trusted|london|dubai|paris|nyc|uae|digital)(?=[a-z]{4,})/i, "$1 ");
  s = s.replace(/^(al|el)(?=[-_ ]|[A-Z]|dhabi|khaleej|hilal|ain|wasl|ittihad|rawda|wathba|ahli|saad)/i, "$1 ");
  
  // 4. Known compound word boundaries & suffixes (Longer/plural terms ordered before shorter prefixes)
  // Note: Avoid short sub-words like 'and' that cause false splits in words like 'tandis' or 'standard'
  const commonWords = /(autowerkplaats|werkplaats|carrosserie|garagejv|garageas|autobedrijf|autohandel|autowas|autocentrum|herstelplaats|werkplek|brugge|gent|antwerpen|brussel|leuven|hasselt|kortrijk|oostende|mechelen|sint|optiekzaken|optiekzaak|opticiens|opticien|opticians|optician|optometrie|optometrist|optometry|optiek|eyewear|eyecare|kidseyewear|brillen|tandartspraktijk|tandheelkunde|tandartsen|tandarts|tandzorg|dentistes|dentiste|dentistry|dentists|dentist|dental|orthodontics|zahnarztpraxis|zahnarzte|zahnarzt|rechtsanwälte|rechtsanwalt|advocatenkantoor|advocaten|advocaat|lawyers|lawyer|attorneys|attorney|lawfirm|notarissen|notaris|notaires|notaire|plomberie|plombier|loodgieters|loodgieter|bäckerei|bakkerij|boulangerie|apotheke|apotheek|pharmacie|pharmacy|clinics|clinic|clinique|kliniek|klinik|hospital|hospitals|hopital|makelaars|makelaar|immobilier|immobilien|realestate|realty|properties|consulting|solutions|services|service|group|partners|agency|studios|studio|technologies|technology|tech|lerner|rowe|benson|bingham|injury|accident|centers|center|centres|centre|parks|park|hotels|hotel|avenue|valley|therapy|groups|media|news|travel|cafes|cafe|coffee|bars|bar|suites|suite|stores|store|shops|shop|markets|market|clubs|club|fitness|gym|labs|lab|care|health|spas|spa|salons|salon|resorts|resort|villas|villa|restaurants|restaurant|kitchen|bakery|grill|bistro|plumbers|cancellations|cancellation|garages|garage|motors|motor|autos|auto|rentals|rental|logistics|express|trusted|trust|capital|associates|associate|law|firm|wellness|massage|towers|tower|plaza|square|malls|mall|hubs|hub|holdings|globals|global|international|world|networks|network|systems|system|software|security|design|creative|productions|production|interactive|marketing|defense|aviation|shipping|cargo|freight|courier)/gi;
  
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
export function formatDisplayHours(rawHours?: string | null): string {
  if (!rawHours || !rawHours.trim()) return "Open 24 Hours";
  const h = rawHours.trim();
  
  // Detect 24 hours / 0:00 - 23:59 / 00:00 - 23:59
  if (h.includes("0:00 - 23:59") || h.includes("00:00 - 23:59") || h.includes("24/7") || h.toLowerCase().includes("24 hours") || h.toLowerCase().includes("available 24/7")) {
    return "Open 24 Hours";
  }

  // If long spelled-out list of days like "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday: ..."
  if (h.includes("Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday") || h.includes("Monday, Tuesday, Wednesday")) {
    const parts = h.split(":");
    const timePart = parts.length > 1 ? parts.slice(1).join(":").trim() : "";
    if (timePart.includes("0:00 - 23:59") || timePart.includes("00:00 - 23:59") || !timePart) {
      return "Mon - Sun: Open 24 Hours";
    }
    return `Mon - Sun: ${timePart}`;
  }

  // Clean up Monday-Friday
  let clean = h
    .replace(/\bMonday\b/gi, "Mon")
    .replace(/\bTuesday\b/gi, "Tue")
    .replace(/\bWednesday\b/gi, "Wed")
    .replace(/\bThursday\b/gi, "Thu")
    .replace(/\bFriday\b/gi, "Fri")
    .replace(/\bSaturday\b/gi, "Sat")
    .replace(/\bSunday\b/gi, "Sun");

  return clean;
}

export function isGenericPlaceName(name?: string | null): boolean {
  if (!name) return true;
  if (isCorruptedBusinessName(name)) return true;
  const lower = name.trim().toLowerCase();
  const genericWords = new Set([
    "home",
    "home page",
    "homepage",
    "welcome",
    "welcome to",
    "index",
    "index page",
    "main",
    "main page",
    "default",
    "official site",
    "official website",
    "website",
    "page",
    "business",
    "business place",
    "verified business",
    "verified business place"
  ]);
  if (genericWords.has(lower)) return true;
  if (/^(home|welcome|index|default|main page|official site)\s*[|\-–—:•]/i.test(lower)) return true;
  return false;
}

export function formatBusinessName(name?: string | null, domain?: string | null, queryContextParam?: string | null): string {
  let rawDomain = domain || "";
  let queryContext = queryContextParam || "";
  if (rawDomain.includes(":")) {
    const parts = rawDomain.split(":");
    rawDomain = parts[0];
    if (!queryContext) queryContext = parts.slice(1).join(":");
  } else if (rawDomain.includes("|")) {
    const parts = rawDomain.split("|");
    rawDomain = parts[0];
    if (!queryContext) queryContext = parts.slice(1).join("|");
  }

  const cleanDom = rawDomain ? extractCleanDomain(rawDomain) : "";
  const domRoot = cleanDom ? cleanDom.replace(/\.(co\.[a-z]{2}|co\.[a-z]{3}|[a-z]{2,10})$/i, "").split(".")[0] : "";

  // If domain is provided and matches known official brands directly
  if (cleanDom && KNOWN_OFFICIAL_NAMES[cleanDom]) {
    return KNOWN_OFFICIAL_NAMES[cleanDom];
  }
  if (domRoot && KNOWN_OFFICIAL_NAMES[domRoot.toLowerCase()]) {
    return KNOWN_OFFICIAL_NAMES[domRoot.toLowerCase()];
  }

  // Reject corrupted or contact fragment titles (e.g. "Kruis Tel")
  if (name && isCorruptedBusinessName(name)) {
    if (cleanDom) return formatBusinessName(cleanDom);
    return "";
  }

  if (!name && cleanDom) {
    return formatBusinessName(cleanDom);
  }
  if (!name) return "";
  let trimmed = name.trim();

  // Guard against known agency/CMS/boilerplate titles leaking into business names
  const lowerTrimmedCheck = trimmed.toLowerCase();
  if (cleanDom && (
    lowerTrimmedCheck === "vaibe" ||
    lowerTrimmedCheck === "webflow" ||
    lowerTrimmedCheck === "wix" ||
    lowerTrimmedCheck === "squarespace" ||
    lowerTrimmedCheck === "wordpress" ||
    lowerTrimmedCheck === "elementor" ||
    lowerTrimmedCheck === "shopify" ||
    lowerTrimmedCheck === "vite" ||
    lowerTrimmedCheck === "react" ||
    lowerTrimmedCheck === "vue" ||
    lowerTrimmedCheck === "nextjs" ||
    lowerTrimmedCheck === "website" ||
    lowerTrimmedCheck === "untitled" ||
    lowerTrimmedCheck === "hostinger" ||
    lowerTrimmedCheck === "drupal"
  )) {
    return formatBusinessName(cleanDom);
  }

  // Guard against review IDs or raw ID strings leaking into business names (e.g., rev17895770756273488d)
  if (trimmed.startsWith("rev") && (/^rev\d+/i.test(trimmed) || /^rev[0-9a-f]{8,}/i.test(trimmed) || trimmed.includes("rev17895"))) {
    return "Yoouz";
  }
  
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

  // 2.5 Truncate at common verb/slogan marketing phrases (e.g. "Law Firm Wanted Law Is A Group of Law Firm S Offering Accessible Law...")
  const sloganVerbPattern = /\s+(?:is\s+a|is\s+an|is\s+the|is\s+een|is\s+het|offering|provides|providing|specializing\s+in|specialised\s+in|voor\s+al\s+uw|voor\s+al\s+je|pour\s+tous\s+vos|welkom\s+bij|welcome\s+to|dedicated\s+to|your\s+trusted)\b.*/i;
  if (sloganVerbPattern.test(trimmed)) {
    const truncated = trimmed.replace(sloganVerbPattern, "").trim();
    if (truncated && truncated.length >= 2 && !isGenericPlaceName(truncated)) {
      trimmed = truncated;
    }
  }

  // 2.6 Clean leading generic industry descriptors if followed by the actual brand name (e.g., "Law Firm Wanted Law" -> "Wanted Law")
  trimmed = trimmed.replace(/^(?:Law\s+Firm|Advocatenkantoor|Advocaten|Lawyer|Lawyers|Attorneys|Dental\s+Clinic|Tandartspraktijk|Restaurant|Bistro|Hotel|Auto\s+Garage|Carrosserie)\s+(?=[A-Z0-9])/i, "").trim();

  // 3. Clean up scraped SEO titles (e.g., "Garage Vermeersch J. : Auto's van alle merken...", "Home | Van Law Firm")
  const rawParts = trimmed.split(/\s*(?:[|\-–—•]|:)\s*/).map(p => p.trim()).filter(Boolean);
  if (rawParts.length > 1) {
    let bestCandidate: string | undefined = undefined;

    // First try finding a part that matches queryContext if provided
    if (queryContext) {
      const cleanQContext = queryContext.trim().toLowerCase();
      const qWords = cleanQContext.split(/\s+/).filter(w => w.length >= 2 && !/^(the|and|or|in|at|of|for|law|firm|inc|llc)$/i.test(w));
      if (qWords.length > 0) {
        // Try finding part containing all key query words
        bestCandidate = rawParts.find(p => {
          const pLower = p.toLowerCase();
          return qWords.every(w => pLower.includes(w)) && !isGenericPlaceName(p);
        });
        if (!bestCandidate) {
          bestCandidate = rawParts.find(p => {
            const pLower = p.toLowerCase();
            return qWords.some(w => pLower.includes(w)) && !isGenericPlaceName(p);
          });
        }
      }
    }

    // Second try finding a part that matches domRoot
    if (!bestCandidate && domRoot) {
      bestCandidate = rawParts.find(p => p.toLowerCase().includes(domRoot.toLowerCase()) && p.length <= 45 && !isGenericPlaceName(p));
    }

    // If domRoot is not inside title (e.g. domain is garagejv.be, title part is "Garage Vermeersch J."), select the first non-generic candidate part
    if (!bestCandidate) {
      const nonGenericParts = rawParts.filter(p => !isGenericPlaceName(p));
      if (nonGenericParts.length > 0) {
        const validCandidates = nonGenericParts.filter(p => p.length >= 2 && p.length <= 50);
        if (validCandidates.length > 0) {
          bestCandidate = validCandidates.find(p => !/^(the best|official site|welcome to|premiere|leading|top rated|personal injury|attorneys at law|auto's van|aanhangwagens in)/i.test(p)) || validCandidates[0];
        } else {
          bestCandidate = nonGenericParts[0];
        }
      }
    }

    if (bestCandidate) {
      trimmed = bestCandidate;
    }
  }

  // 3.1 Anchor preservation: if queryContext is a valid proper brand name (e.g. "Tobener Ravenscroft" or "Piotrowski Law"),
  // and trimmed is an SEO tagline/slogan that does NOT contain the key query brand words (e.g. "California Tenant Lawyers")
  // OR trimmed is a short acronym/abbreviation (e.g. "CP Law")
  if (queryContext) {
    const qTrim = queryContext.trim();
    const qWords = qTrim.split(/\s+/).filter(w => w.length >= 2 && !/^(the|and|or|in|at|of|for|inc|llc|pc|corp)$/i.test(w));
    if (qWords.length >= 1 && /^[A-Z0-9][A-Za-z0-9\s&'’\.,\-]+$/i.test(qTrim) && !qTrim.includes('.')) {
      const qLower = qTrim.toLowerCase();
      const trimmedLower = trimmed.toLowerCase();

      // Check if trimmed fails to contain any of the primary query brand words
      const matchesQueryWords = qWords.some(w => trimmedLower.includes(w.toLowerCase()));

      // If trimmed is an unrelated marketing slogan (e.g. "California Tenant Lawyers") or an acronym (e.g. "CP Law")
      if (!matchesQueryWords || (trimmedLower.length < qLower.length && !qLower.includes(trimmedLower))) {
        trimmed = qTrim;
      }
    }
  }

  // If queryContext has a city location (e.g. "Wanted Law Brugge") and trimmed is short ("Wanted Law"), attach city if query explicitly contained it
  if (queryContext) {
    const qTrim = queryContext.trim();
    const words = qTrim.split(/\s+/);
    if (words.length >= 2) {
      const lastQWord = words[words.length - 1];
      if (/^[A-Z][a-z]+$/.test(lastQWord) && lastQWord.length >= 3) {
        if (trimmed.toLowerCase().includes(words[0].toLowerCase()) && !trimmed.toLowerCase().includes(lastQWord.toLowerCase())) {
          trimmed = `${trimmed} ${lastQWord}`;
        }
      }
    }
  }

  // If the resulting trimmed string is still generic (e.g. "Home"), clear it
  if (isGenericPlaceName(trimmed)) {
    trimmed = "";
  }

  // Re-check normalized key after SEO title strip
  const strippedKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (strippedKey && KNOWN_OFFICIAL_NAMES[strippedKey]) {
    return KNOWN_OFFICIAL_NAMES[strippedKey];
  }

  // 3b. Detect if the string is an explicit marketing sentence/ad slogan (e.g., "Rent a car worldwide with best price guarantee")
  const lowerTrimmed = trimmed.toLowerCase();
  const sentenceWords = lowerTrimmed.split(/[\s,–—\-_/:]+/).filter(Boolean);
  
  const isMarketingSentence = 
    sentenceWords.length >= 4 && (
      lowerTrimmed.includes("autoverhuur") ||
      lowerTrimmed.includes("auto huren") ||
      lowerTrimmed.includes("mietwagen") ||
      lowerTrimmed.includes("autovermietung") ||
      lowerTrimmed.includes("location de voiture") ||
      lowerTrimmed.includes("car rental") ||
      lowerTrimmed.includes("rent a car") ||
      lowerTrimmed.includes("best rates") ||
      lowerTrimmed.includes("save more on") ||
      lowerTrimmed.includes("goedkoopste prijs") ||
      lowerTrimmed.includes("prijs garantie") ||
      lowerTrimmed.includes("find deals on") ||
      lowerTrimmed.includes("cheap flights")
    );

  if (isMarketingSentence) {
    for (const w of sentenceWords) {
      if (w.length >= 3 && KNOWN_OFFICIAL_NAMES[w]) {
        return KNOWN_OFFICIAL_NAMES[w];
      }
    }
    if (domRoot && domRoot.length >= 2) {
      return formatBusinessName(domRoot);
    }
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

  // 3c. If the string is already a clean capitalized business name from metadata, preserve directly
  if (!isDomainLike && trimmed && /^[A-Z][A-Za-z0-9\s&'’\.,\-]+$/.test(trimmed) && trimmed.length <= 50) {
    return trimmed;
  }

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

  // If rawName is already a clean single capitalized word (e.g. "Proximus", "Multipharma"), preserve directly
  if (/^[A-Z][a-z0-9]+$/.test(rawName)) {
    return rawName;
  }

  // 6. Split compound words
  let spaced = splitCompoundWords(rawName);

  if (/^jb(?=[a-z])/i.test(spaced)) {
    spaced = spaced.replace(/^jb/i, "JB ");
  }
  if (/^brettlevy$/i.test(spaced)) {
    spaced = "Brett Levy";
  }

  const acronyms = new Set(["usa", "nyc", "la", "uk", "us", "ai", "api", "ibm", "bbc", "cnn", "cbs", "nbc", "hbo", "eu", "srl", "uae", "lm", "jb", "sf"]);
  const lowerCaseWords = new Set(["of", "and", "in", "at", "de", "et", "du", "des"]);

  const words = spaced
    .split(/[-_ ]+/)
    .map((word, idx) => {
      if (!word) return "";
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) return lower.toUpperCase();
      if (lowerCaseWords.has(lower) && idx > 0) return lower;
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

  // Extract cleaned domains
  const placeDomain = extractCleanDomain(placeWebsite || placeBrandDomain || (placeId.includes(".") ? placeId : "") || (placeName.includes(".") ? placeName : ""));
  const vDomain = extractCleanDomain(vPlaceWebsite || (vPlaceId.includes(".") ? vPlaceId : "") || (vPlaceName.includes(".") ? vPlaceName : ""));

  // 1. STRICT DOMAIN ANTI-COLLISION CHECK:
  // If BOTH entities have domains, they ONLY match if the domains are IDENTICAL!
  // If domains differ (e.g. dentiste-namur.be vs dentisteerpent.be or tandis.be), they are definitively DIFFERENT businesses!
  if (placeDomain && vDomain) {
    return placeDomain.toLowerCase() === vDomain.toLowerCase();
  }

  // If one has a domain and the other does not, but one ID is a domain (contains dot or tld), they DO NOT match unless domains match!
  if (placeDomain || vDomain) {
    if (placeDomain && vPlaceId && vPlaceId.includes(".")) {
      const vClean = extractCleanDomain(vPlaceId);
      return vClean.toLowerCase() === placeDomain.toLowerCase();
    }
    if (vDomain && placeId && placeId.includes(".")) {
      const pClean = extractCleanDomain(placeId);
      return pClean.toLowerCase() === vDomain.toLowerCase();
    }
  }

  // 2. Direct ID match
  if (placeId && vPlaceId && placeId.toLowerCase() === vPlaceId.toLowerCase()) {
    return true;
  }

  // 3. Domain match with ID or slug
  if (placeDomain && vPlaceId) {
    const normVId = vPlaceId.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normPDomain = placeDomain.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normVId && normPDomain && normVId === normPDomain) return true;
  }
  if (vDomain && placeId) {
    const normPId = placeId.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normVDomain = vDomain.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normPId && normVDomain && normPId === normVDomain) return true;
  }

  // 4. Direct exact Place Name match (normalized) - ONLY if neither entity has a conflicting domain
  if (!placeDomain && !vDomain) {
    const cleanPName = placeName.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    const cleanVName = vPlaceName.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    if (cleanPName && cleanVName && cleanPName === cleanVName && cleanPName.length > 2) {
      return true;
    }
  }

  // 5. Normalized slug match (e.g. "fiverr-com" vs "fiverr.com")
  const normPlaceId = placeId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normVPlaceId = vPlaceId.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normPlaceId && normVPlaceId && normPlaceId === normVPlaceId && normPlaceId.length > 2) {
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

  // Strict Canonical User Cluster Anti-Collision Guard
  const targetCluster = getCanonicalUserKey({
    email: targetEmail,
    name: targetName,
    handle: targetHandle,
    id: targetUserId || targetUid
  });
  const videoCluster = getCanonicalUserKey({
    email: vEmail,
    name: vName,
    handle: vHandle,
    id: vUserId
  });

  if (targetCluster && videoCluster && targetCluster.startsWith("user_group_") && videoCluster.startsWith("user_group_")) {
    if (targetCluster !== videoCluster) {
      return false; // Hard barrier: completely forbids matching between distinct known accounts
    }
    return true; // Exact cluster match
  }

  // Prevent distinct valid emails from matching
  if (targetEmail.includes("@") && vEmail.includes("@") && targetEmail !== vEmail) {
    return false;
  }

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
    return getProxiedImageUrl(t);
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
    (domain && KNOWN_BRAND_LOGOS[domain]) ? KNOWN_BRAND_LOGOS[domain] :
    (video.placeLogoUrl && !video.placeLogoUrl.startsWith("data:;") && !video.placeLogoUrl.includes("tap/0.png")) ? video.placeLogoUrl :
    (domain ? getCleanLogoUrl(null, domain) || "" : "");

  if (existing) {
    const rawBanner = existing.bannerUrl || existing.ogImage || reviewBanner || (domain && KNOWN_BRAND_BANNERS[domain]) || "";
    const banner = sanitizeBanner(rawBanner);
    const logo = (domain && KNOWN_BRAND_LOGOS[domain]) ? KNOWN_BRAND_LOGOS[domain] : ((existing.logoUrl && !existing.logoUrl.startsWith("data:;") && !existing.logoUrl.includes("tap/0.png")) ? existing.logoUrl : ((existing.avatarUrl && !existing.avatarUrl.startsWith("data:;") && !existing.avatarUrl.includes("tap/0.png")) ? existing.avatarUrl : (reviewLogo || "")));
    const website = (existing.website && !existing.website.includes("maps.google.com")) 
      ? existing.website 
      : (video.placeWebsite || (domain ? `https://${domain}` : ""));
    const description = video.placeDescription || (existing.description && !existing.description.includes("Verified video review destination") && !existing.description.includes("Verified Yoouz business listing") ? existing.description : "") || existing.description || "";
    
    // Automatically promote clean formatted business name if existing name was generic, a raw domain, or slug
    const isGenericOrDomainName = !existing.name ||
      isGenericPlaceName(existing.name) ||
      existing.name.toLowerCase() === (existing.id || "").toLowerCase() ||
      existing.name.toLowerCase() === (existing.brandDomain || "").toLowerCase() ||
      existing.name.includes(".") ||
      !existing.name.includes(" ") ||
      existing.name.toLowerCase() === "website" ||
      existing.name.toLowerCase().includes("bensonbingham");

    const candidateName = (video.placeName && !isGenericPlaceName(video.placeName)) ? video.placeName : (domain ? domain : existing.name);
    const updatedName = formatBusinessName(candidateName) || formatBusinessName(existing.name) || formatBusinessName(domain) || "Verified Business";

    const isYoouz = existing.id === 'yoouz.com' || existing.brandDomain === 'yoouz.com' || existing.name?.toLowerCase() === 'yoouz' || domain === 'yoouz.com';

    const cleanReviewAddr = (video.placeAddress && !video.placeAddress.startsWith("http") && video.placeAddress !== "Verified Location") ? video.placeAddress : "";
    const cleanExistingAddr = (existing.address && !existing.address.startsWith("http") && existing.address !== "Verified Location") ? existing.address : "";
    const effectiveAddress = isYoouz ? "" : (cleanExistingAddr || cleanReviewAddr || "");
    const effectiveCity = isYoouz ? "" : (existing.city && existing.city !== "Online" && existing.city !== "Worldwide" ? existing.city : (video.placeCity || existing.city || ""));
    const effectiveCountry = isYoouz ? "" : (existing.country || video.placeCountry || "");
    const effectivePhone = existing.phone || video.placePhone || "";
    const effectiveEmail = existing.email || video.placeEmail || "";

    return {
      ...existing,
      name: updatedName,
      address: effectiveAddress,
      city: effectiveCity,
      country: effectiveCountry,
      phone: effectivePhone,
      email: effectiveEmail,
      lat: isYoouz ? 0 : (existing.lat || 0),
      lng: isYoouz ? 0 : (existing.lng || 0),
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

  const isYoouz = cleanId === 'yoouz.com' || cleanId.includes('yoouz') || domain === 'yoouz.com' || (video.placeName && video.placeName.toLowerCase() === 'yoouz');
  const cleanReviewAddr = (video.placeAddress && !video.placeAddress.startsWith("http") && video.placeAddress !== "Verified Location") ? video.placeAddress : "";
  const formattedName = formatBusinessName(video.placeName || domain) || "Verified Business";
  const initialCategory = video.placeCategory || "Establishment";
  const initialCity = isYoouz ? "" : (video.placeCity || "");
  const initialCountry = isYoouz ? "" : (video.placeCountry || "");
  
  const rawDescription = video.placeDescription || "";
  const computedDescription = getEffectivePlaceDescription({
    id: cleanId,
    name: formattedName,
    category: initialCategory,
    city: initialCity,
    country: initialCountry,
    website: video.placeWebsite || (domain ? `https://${domain}` : ""),
    brandDomain: domain || undefined,
    description: rawDescription
  });

  return {
    id: cleanId,
    name: formattedName,
    category: initialCategory,
    categoryType: "all",
    address: isYoouz ? "" : cleanReviewAddr,
    city: initialCity,
    country: initialCountry,
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
    phone: isYoouz ? "" : (video.placePhone || ""),
    email: isYoouz ? "" : (video.placeEmail || ""),
    website: video.placeWebsite || (domain ? `https://${domain}` : ""),
    priceRange: "N/A",
    isSavedToProfile: true,
    plusCode: "",
    description: computedDescription,
    popularKeywords: [{ tag: "Verified", count: 1 }],
    amenities: [],
    topDishes: []
  };
}

/**
 * Generates an authentic, context-aware business description tailored to the specific business
 */
export function generateSmartPlaceDescription(params: {
  name?: string;
  category?: string;
  city?: string;
  country?: string;
  website?: string;
  domain?: string;
  address?: string;
}): string {
  const name = (params.name || params.domain || "This business").trim();
  const domain = (params.domain || "").toLowerCase();
  const cat = (params.category || "").toLowerCase();
  const nameLower = name.toLowerCase();

  const isYoouz = domain === "yoouz.com" || domain === "yoouz" || nameLower === "yoouz";
  if (isYoouz) {
    return "The #1 authentic video review network. Discover local businesses, services, and online brands with 100% genuine 60-second video reviews by real customers. Zero fake text reviews.";
  }

  // Location string construction
  let locStr = "";
  if (params.city && params.city !== "Online" && params.city !== "Worldwide") {
    locStr = ` in ${params.city}${params.country ? ', ' + params.country : ''}`;
  } else if (params.country && params.country !== "Worldwide" && params.country !== "Global") {
    locStr = ` in ${params.country}`;
  } else if (params.address && !params.address.startsWith("http") && params.address !== "Verified Location") {
    locStr = ` located at ${params.address}`;
  } else if (params.domain) {
    locStr = ` online at ${params.domain}`;
  }

  // Domain/name specific known descriptions
  if (domain.includes("dentiste-namur") || (nameLower.includes("dentist e") && locStr.includes("Namur"))) {
    return "Dentist E is a premier dental clinic located in Namur, Belgium, providing comprehensive oral healthcare, routine checkups, cosmetic dentistry, and gentle patient treatments.";
  }
  if (domain.includes("brusselsdental") || nameLower.includes("brussels dental")) {
    return "Full-service high quality dental treatment center with English and French speaking dentists and specialists in Brussels, Belgium.";
  }
  if (domain.includes("aldhabidental") || nameLower.includes("al dhabi")) {
    return "Premier dental clinic in Abu Dhabi, UAE delivering comprehensive oral healthcare, cosmetic dentistry, orthodontic care, and dental implants.";
  }
  if (domain.includes("londontrustedtherapy") || nameLower.includes("london trusted therapy")) {
    return "Private psychology, therapy, and counseling services in Harley Street and central London.";
  }
  if (domain.includes("legal500") || nameLower.includes("legal 500")) {
    return "The Legal 500 analyzes the capabilities of law firms across the world with a comprehensive research programme.";
  }
  if (domain.includes("digitalpark") || nameLower.includes("digital park")) {
    return "Digital Park is Dubai Silicon Oasis's premier integrated smart community and technology business park.";
  }

  // Industry / Category specific templates
  if (cat.includes("dentist") || cat.includes("dental") || nameLower.includes("dentist") || nameLower.includes("dental")) {
    return `${name} is a trusted dental clinic${locStr}, providing comprehensive oral healthcare, preventive checkups, cosmetic dentistry, and patient-centered dental care.`;
  }
  if (cat.includes("law") || cat.includes("legal") || cat.includes("attorney") || cat.includes("lawyer") || nameLower.includes("law") || nameLower.includes("attorney")) {
    return `${name} is a dedicated law practice${locStr}, offering expert legal counsel, professional representation, and trusted advisory services for clients.`;
  }
  if (cat.includes("restaurant") || cat.includes("cafe") || cat.includes("food") || cat.includes("dining") || cat.includes("bakery") || cat.includes("bistro")) {
    return `${name} is a popular dining destination${locStr}, renowned for delicious cuisine, warm hospitality, and authentic guest experiences.`;
  }
  if (cat.includes("hotel") || cat.includes("resort") || cat.includes("hospitality") || cat.includes("accommodation") || cat.includes("lodge")) {
    return `${name} is a premier hospitality destination${locStr}, offering comfortable accommodations, top-tier amenities, and attentive guest service.`;
  }
  if (cat.includes("spa") || cat.includes("massage") || cat.includes("wellness") || cat.includes("therapy") || cat.includes("counseling")) {
    return `${name} is a dedicated wellness and therapy center${locStr}, providing restorative treatments, professional care, and personalized wellness services.`;
  }
  if (cat.includes("auto") || cat.includes("car") || cat.includes("vehicle") || cat.includes("rental")) {
    return `${name} is a dependable automotive and transportation service provider${locStr}, delivering reliable vehicle solutions and quality customer support.`;
  }
  if (cat.includes("tech") || cat.includes("digital") || cat.includes("software") || cat.includes("it ") || cat.includes("media")) {
    return `${name} provides innovative digital solutions, modern technology services, and trusted professional capabilities.`;
  }
  if (cat.includes("health") || cat.includes("medical") || cat.includes("clinic") || cat.includes("hospital") || cat.includes("doctor")) {
    return `${name} is a premier healthcare practice${locStr}, committed to delivering high-quality medical services and personalized patient care.`;
  }
  if (cat.includes("plumb") || cat.includes("electric") || cat.includes("contractor") || cat.includes("service") || cat.includes("repair")) {
    return `${name} provides professional, reliable emergency and maintenance services${locStr}, dedicated to quality workmanship and prompt client care.`;
  }

  // Default professional business description
  return `${name} is a premier provider${locStr}, committed to delivering high-quality products, professional capabilities, and exceptional client satisfaction.`;
}

/**
 * Returns a guaranteed valid, business-specific description for any Place or VideoReview
 */
export function getEffectivePlaceDescription(place?: any, fallbackCategory?: string): string {
  if (!place) return "";

  const rawDesc = place.description || place.placeDescription;
  const isGeneric = !rawDesc ||
    typeof rawDesc !== "string" ||
    rawDesc.trim() === "" ||
    rawDesc === "undefined" ||
    rawDesc.toLowerCase() === "home" ||
    rawDesc.includes("Verified Yoouz business listing") ||
    rawDesc.includes("Verified Yoouz location review") ||
    rawDesc.includes("Verified video review destination") ||
    rawDesc.toLowerCase().includes("verified business") ||
    rawDesc.includes("No description available");

  const name = place.name || place.placeName || "";
  const domain = (place.brandDomain || place.domain || (place.id?.includes(".") ? place.id : "") || extractCleanDomain(place.website || place.id || name) || "").toLowerCase();
  const isActuallyYoouz = domain === "yoouz.com" || domain === "yoouz" || name.toLowerCase() === "yoouz";

  if (!isGeneric) {
    const trimmed = rawDesc.trim();
    // If the place is NOT Yoouz, but description mentions "Yoouz is the premier authentic video review platform"
    if (!isActuallyYoouz && (trimmed.toLowerCase().includes("yoouz is the premier") || trimmed.toLowerCase().includes("100% genuine 60-second video reviews"))) {
      // Discard and generate accurate business description below
    } else {
      return trimmed;
    }
  }

  if (isActuallyYoouz) {
    return "Official verified business profile for Yoouz. 100% authentic 60-second video reviews by real customers. Zero fake text reviews.";
  }

  return generateSmartPlaceDescription({
    name: name || domain,
    category: place.category || place.placeCategory || fallbackCategory,
    city: place.city || place.placeCity,
    country: place.country || place.placeCountry,
    website: place.website || place.placeWebsite,
    domain: domain,
    address: place.address || place.placeAddress
  });
}

export const KNOWN_COMMUNITY_USERS: Record<string, { name: string; handle: string; avatar: string; bio?: string; location?: string }> = {
  "stevenakan": {
    name: "Steven Akan",
    handle: "@stevenakan",
    avatar: generateGoogleLetterAvatarSvg("Steven Akan", 128, "@stevenakan"),
    bio: "Verified video reviewer on Yoouz.",
    location: "Auckland, New Zealand"
  },
  "steven-akan": {
    name: "Steven Akan",
    handle: "@stevenakan",
    avatar: generateGoogleLetterAvatarSvg("Steven Akan", 128, "@stevenakan"),
    bio: "Verified video reviewer on Yoouz.",
    location: "Auckland, New Zealand"
  },
  "benblue": {
    name: "Ben Blue",
    handle: "@benblue",
    avatar: generateGoogleLetterAvatarSvg("Ben Blue", 128, "@benblue"),
    bio: "Authentic food & venue explorer on Yoouz.",
    location: "Sydney, Australia"
  },
  "ben-blue": {
    name: "Ben Blue",
    handle: "@benblue",
    avatar: generateGoogleLetterAvatarSvg("Ben Blue", 128, "@benblue"),
    bio: "Authentic food & venue explorer on Yoouz.",
    location: "Sydney, Australia"
  }
};

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

const PROTECTED_CREATORS_SET = new Set([
  "steven akan",
  "stevenakan",
  "@stevenakan",
  "ben blue",
  "benblue",
  "@benblue",
  "avr6566gd@gmail.com",
  "aouisesmee@gmail.com",
  "info@yoouz.com",
  "yoouz"
]);

export function isUserDeleted(userOrIdOrEmail: any, deletedIds?: string[]): boolean {
  if (!userOrIdOrEmail) return false;
  const list = deletedIds || getDeletedUserIds();
  if (!list || list.length === 0) return false;
  const set = new Set(list.map((s) => String(s).toLowerCase().trim()).filter(Boolean));

  const checkVal = (v: any): boolean => {
    if (!v) return false;
    const s = String(v).toLowerCase().trim();
    if (!s) return false;
    if (PROTECTED_CREATORS_SET.has(s)) return false;
    const withoutAt = s.replace(/^@+/, "");
    if (PROTECTED_CREATORS_SET.has(withoutAt)) return false;
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
    if (u.userId && checkVal(u.userId)) return true;
    if (u.email && checkVal(u.email)) return true;
    if (u.userEmail && checkVal(u.userEmail)) return true;
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
 * Deactivated Users Helpers:
 * When an account is deactivated, their profile and reviews are hidden from public views.
 * When they log back in, they are immediately reactivated and restored without glitches.
 */
export function getDeactivatedUserIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("yoouz_deactivated_users");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((s) => String(s).toLowerCase().trim()).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

export function recordDeactivatedUsersInLocalStorage(ids: string[]): void {
  if (typeof window === "undefined" || !Array.isArray(ids) || ids.length === 0) return;
  try {
    const current = getDeactivatedUserIds();
    const set = new Set(current);
    let changed = false;
    for (const rawId of ids) {
      if (!rawId) continue;
      const clean = String(rawId).toLowerCase().trim();
      const withoutAt = clean.replace(/^@+/, "");
      const username = clean.includes("@") ? clean.split("@")[0] : withoutAt;
      const variants = [clean, withoutAt, username];
      for (const v of variants) {
        if (v && !set.has(v)) {
          set.add(v);
          changed = true;
        }
      }
    }
    if (changed) {
      localStorage.setItem("yoouz_deactivated_users", JSON.stringify(Array.from(set)));
    }
  } catch (e) {}
}

export function unrecordDeactivatedUsersInLocalStorage(ids: string[]): void {
  if (typeof window === "undefined" || !Array.isArray(ids) || ids.length === 0) return;
  try {
    const current = getDeactivatedUserIds();
    const set = new Set(current);
    let changed = false;
    for (const rawId of ids) {
      if (!rawId) continue;
      const clean = String(rawId).toLowerCase().trim();
      const withoutAt = clean.replace(/^@+/, "");
      const username = clean.includes("@") ? clean.split("@")[0] : withoutAt;
      const variants = [clean, withoutAt, username];
      for (const v of variants) {
        if (set.has(v)) {
          set.delete(v);
          changed = true;
        }
      }
    }
    if (changed) {
      localStorage.setItem("yoouz_deactivated_users", JSON.stringify(Array.from(set)));
    }
  } catch (e) {}
}

export function isUserDeactivated(userOrIdOrEmail: any, deactivatedIds?: string[]): boolean {
  if (!userOrIdOrEmail) return false;
  const list = deactivatedIds || getDeactivatedUserIds();
  if (!list || list.length === 0) return false;
  const set = new Set(list.map((s) => String(s).toLowerCase().trim()).filter(Boolean));

  const checkVal = (v: any): boolean => {
    if (!v) return false;
    const s = String(v).toLowerCase().trim();
    if (!s) return false;
    if (set.has(s)) return true;
    const withoutAt = s.replace(/^@+/, "");
    if (set.has(withoutAt)) return true;
    const username = s.includes("@") ? s.split("@")[0] : withoutAt;
    if (set.has(username)) return true;
    return false;
  };

  if (typeof userOrIdOrEmail === "string") {
    return checkVal(userOrIdOrEmail);
  }

  if (typeof userOrIdOrEmail === "object") {
    const u = userOrIdOrEmail;
    if (u.isDeactivated === true) return true;
    if (u.id && checkVal(u.id)) return true;
    if (u.uid && checkVal(u.uid)) return true;
    if (u.userId && checkVal(u.userId)) return true;
    if (u.email && checkVal(u.email)) return true;
    if (u.userEmail && checkVal(u.userEmail)) return true;
    if (u.handle && checkVal(u.handle)) return true;
    if (u.name && checkVal(u.name)) return true;
    if (u.username && checkVal(u.username)) return true;
    if (u.author && isUserDeactivated(u.author, list)) return true;
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
      city: u.city,
      country: u.country,
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
  const isTargetYoouz = 
    (name && (name.toLowerCase().trim() === "yoouz" || name.toLowerCase().trim() === "yoouz beta")) ||
    (handle && (handle.toLowerCase().trim() === "@yoouz" || handle.toLowerCase().trim() === "yoouz" || handle.toLowerCase().trim() === "yoouz.com")) ||
    (avatarUrl && (avatarUrl.toLowerCase().includes("yoouz") || avatarUrl.includes("favicon.svg")));

  if (isTargetYoouz) {
    return YOOUZ_LOGO_DATA_URI;
  }

  let candidateAvatar = avatarUrl;
  if (!candidateAvatar || candidateAvatar === "data:;" || candidateAvatar.trim() === "" || candidateAvatar.includes("/api/avatar") || candidateAvatar.includes("ui-avatars") || candidateAvatar.includes("dicebear")) {
    const regUser = (handle ? getUserFromRegistry(handle) : null) || (name ? getUserFromRegistry(name) : null);
    if (regUser && regUser.avatar && !regUser.avatar.includes("/api/avatar") && !regUser.avatar.includes("data:;") && regUser.avatar.trim() !== "") {
      candidateAvatar = regUser.avatar;
    }
  }

  if (!candidateAvatar || candidateAvatar === "data:;" || candidateAvatar.trim() === "" || candidateAvatar.includes("/api/avatar") || candidateAvatar.includes("ui-avatars") || candidateAvatar.includes("dicebear")) {
    return generateGoogleLetterAvatarSvg(name || "User", 128, handle || name || "User");
  }

  // Filter out video files or paths accidentally stored as avatars
  if (
    candidateAvatar.includes(".mp4") ||
    candidateAvatar.includes("/api/videos/") ||
    candidateAvatar.includes("rev-") ||
    candidateAvatar.startsWith("blob:")
  ) {
    return generateGoogleLetterAvatarSvg(name || "User", 128, handle || name || "User");
  }

  // Handle SVG data URIs (e.g. legacy letter avatars stored in database, localStorage or currentUser)
  if (candidateAvatar.includes("data:image/svg+xml")) {
    // If it's a letter avatar SVG or contains rx rounded corners / text / legacy red color, regenerate a clean full-square SVG
    if (
      candidateAvatar.includes("rx%3D") ||
      candidateAvatar.includes("rx=") ||
      candidateAvatar.includes("%3Ctext") ||
      candidateAvatar.includes("<text") ||
      candidateAvatar.includes("letter") ||
      candidateAvatar.includes("%20rx") ||
      candidateAvatar.includes("E53935") ||
      candidateAvatar.includes("%23E53935") ||
      candidateAvatar.includes("dominant-baseline") ||
      candidateAvatar.includes("text-anchor") ||
      candidateAvatar.includes("font-family")
    ) {
      return generateGoogleLetterAvatarSvg(name || "User", 128, handle || name || "User");
    }

    // Otherwise strip any rx attribute from raw SVG data URIs
    return candidateAvatar
      .replace(/rx%3D%22\d+%22/gi, "")
      .replace(/rx%3D%27\d+%27/gi, "")
      .replace(/rx%3D\d+/gi, "")
      .replace(/rx="\d+"/gi, "")
      .replace(/rx='\d+'/gi, "");
  }

  // If it's another base64 image or photo
  if (candidateAvatar.startsWith("data:image/")) {
    return candidateAvatar;
  }

  let targetUrl = candidateAvatar;
  if (targetUrl.startsWith("/api/proxy-image?url=")) {
    try {
      targetUrl = decodeURIComponent(targetUrl.replace("/api/proxy-image?url=", ""));
    } catch (e) {}
  }

  // Optimize Google User Content avatars by requesting a smaller size (128x128) if not already specified
  if (targetUrl.includes("googleusercontent.com") && !targetUrl.includes("=s")) {
    targetUrl = targetUrl + "=s128-c";
  }

  return getProxiedImageUrl(targetUrl);
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

  // Strict canonical identity verification
  const videoCluster = getCanonicalUserKey({
    email: video?.userEmail || video?.userId,
    name: rawName,
    handle: authorObj.handle,
    id: video?.userId
  });

  if (videoCluster === "user_group_aouisesmee") {
    finalName = "Ben Blue";
    finalHandle = "@benblue";
    if (!candidateAvatar || candidateAvatar.includes("data:image/svg") || candidateAvatar.includes("7CB342") || candidateAvatar.includes("%237CB342")) {
      candidateAvatar = generateGoogleLetterAvatarSvg("Ben Blue", 128, "@benblue");
    }
  } else if (videoCluster === "user_group_stevenakan") {
    finalName = "Steven Akan";
    finalHandle = "@stevenakan";
    if (!candidateAvatar || candidateAvatar.includes("data:image/svg") || candidateAvatar.includes("1E88E5") || candidateAvatar.includes("%231E88E5") || candidateAvatar.includes("00897B") || candidateAvatar.includes("%2300897B")) {
      candidateAvatar = generateGoogleLetterAvatarSvg("Steven Akan", 128, "@stevenakan");
    }
  }

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

  const rawLocation = (isActiveUserMatch && activeUser?.location)
    ? activeUser.location
    : (registryMatch?.location || authorObj.location);

  const rawCity = (isActiveUserMatch && activeUser?.city)
    ? activeUser.city
    : (registryMatch?.city || authorObj.city);

  const rawCountry = (isActiveUserMatch && activeUser?.country)
    ? activeUser.country
    : (registryMatch?.country || authorObj.country);

  const finalLocation = normalizeLocationString(rawLocation, rawCity, undefined, rawCountry);
  const finalCity = rawCity || (finalLocation.includes("Miami Beach") ? "Miami Beach" : "");
  const finalCountry = rawCountry || (finalLocation.includes("United States") ? "United States" : "");

  const reviewCount = authorObj.videoReviewCount !== undefined ? authorObj.videoReviewCount : (registryMatch?.videoReviewCount ?? 0);
  const isVerifiedUser = authorObj.isVerified !== undefined ? authorObj.isVerified : (reviewCount > 0 || !!registryMatch?.isVerified);

  return {
    name: finalName,
    handle: finalHandle,
    avatar: finalAvatar,
    isVerified: isVerifiedUser,
    isLocalGuide: authorObj.isLocalGuide !== undefined ? authorObj.isLocalGuide : (reviewCount > 0),
    localGuideLevel: authorObj.localGuideLevel ?? (reviewCount > 0 ? 7 : 1),
    videoReviewCount: reviewCount,
    photosCount: authorObj.photosCount ?? 0,
    isFollowed: authorObj.isFollowed ?? false,
    bio: finalBio,
    banner: finalBanner,
    location: finalLocation,
    city: finalCity,
    country: finalCountry
  };
}

/**
 * Canonical Location String Normalizer.
 * Guarantees full consistency (e.g. "Miami Beach, Florida, United States") across all views and platforms.
 */
export function normalizeLocationString(
  loc?: string,
  city?: string,
  state?: string,
  country?: string
): string {
  let l = (loc || "").trim();
  let c = (city || "").trim();
  let s = (state || "").trim();
  let co = (country || "").trim();

  if (c && co) {
    if (c.toLowerCase() === co.toLowerCase()) return c;
    return formatCityCountry({ city: c, country: co, location: l });
  }

  if (l) {
    return formatCityCountry(l);
  }

  if (c) return c;
  if (co) return co;

  return "";
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
} | string | any): string {
  if (!creator) return "";
  const inputObj = typeof creator === "string" ? { location: creator } : creator;

  const cleanCity = (inputObj.city || "").trim();
  const cleanCountry = (inputObj.country || "").trim();
  if (
    cleanCity &&
    cleanCountry &&
    cleanCity.toLowerCase() !== "online" &&
    cleanCity.toLowerCase() !== "verified location" &&
    cleanCountry.toLowerCase() !== "online"
  ) {
    if (cleanCity.toLowerCase() === cleanCountry.toLowerCase()) return cleanCity;
    return `${cleanCity}, ${cleanCountry}`;
  }

  if (inputObj.location) {
    const rawLoc = String(inputObj.location).trim();
    if (rawLoc) {
      const parts = rawLoc
        .split(",")
        .map((p: string) => p.trim())
        .filter((p: string) => Boolean(p) && p.toLowerCase() !== "online" && p.toLowerCase() !== "verified location");

      // Filter out redundant city/county/region duplicates e.g., "City of London" when "London" is present
      const uniqueParts: string[] = [];
      parts.forEach((p) => {
        const pLower = p.toLowerCase();
        const isRedundant = uniqueParts.some((existing) => {
          const eLower = existing.toLowerCase();
          return eLower === pLower || (eLower.length > 3 && pLower.includes(eLower)) || (pLower.length > 3 && eLower.includes(pLower));
        });
        if (!isRedundant) {
          uniqueParts.push(p);
        }
      });

      if (uniqueParts.length >= 3) {
        return `${uniqueParts[0]}, ${uniqueParts[uniqueParts.length - 1]}`;
      }
      if (uniqueParts.length === 2) {
        return `${uniqueParts[0]}, ${uniqueParts[1]}`;
      }
      if (uniqueParts.length === 1) {
        return uniqueParts[0];
      }
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

const PROTECTED_PLACES_SET = new Set([
  "yoouz.com",
  "yoouz",
  "www.yoouz.com",
  "nevadalegalservices.org",
  "lernerandrowe.com",
  "mcveaghfleming.co.nz",
  "vanlawfirm.com"
]);

/**
 * Checks if a place or ID matches the blacklist of deleted places
 */
export function isPlaceDeleted(placeOrId: any, deletedIds?: string[]): boolean {
  if (!placeOrId) return false;
  const variants = getPlaceVariants(placeOrId).map((v) => v.toLowerCase().trim());
  if (variants.some((v) => PROTECTED_PLACES_SET.has(v))) {
    return false;
  }
  const list = deletedIds || getDeletedPlaceIds();
  if (!list || list.length === 0) return false;

  const deletedSet = new Set(list.map((s) => String(s).toLowerCase().trim()));

  for (const v of variants) {
    if (deletedSet.has(v)) return true;
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

/**
 * Verified headquarters and coordinates for known entities to guarantee 100% pin accuracy in Google Maps previews
 */
export const KNOWN_BUSINESS_HEADQUARTERS: Record<string, { name?: string; address?: string; postalCode?: string; city?: string; state?: string; country?: string; phone?: string; email?: string; openingHours?: string; category?: string; lat?: number; lng?: number; locations?: any[] }> = {
  "lernerandrowe.com": { address: "2701 E Camelback Rd #140", city: "Phoenix", state: "AZ", country: "United States", lat: 33.5092, lng: -112.0238 },
  "lernerandrowe": { address: "2701 E Camelback Rd #140", city: "Phoenix", state: "AZ", country: "United States", lat: 33.5092, lng: -112.0238 },
  "lernerandrowelaw": { address: "2701 E Camelback Rd #140", city: "Phoenix", state: "AZ", country: "United States", lat: 33.5092, lng: -112.0238 },
  "lernerrowe": { address: "2701 E Camelback Rd #140", city: "Phoenix", state: "AZ", country: "United States", lat: 33.5092, lng: -112.0238 },
  "bensonbingham.com": { address: "626 S 10th St", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1624, lng: -115.1378 },
  "bensonbingham": { address: "626 S 10th St", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1624, lng: -115.1378 },
  "vanlawfirm.com": { address: "1290 S Jones Blvd", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1558, lng: -115.2246 },
  "vanlawfirm": { address: "1290 S Jones Blvd", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1558, lng: -115.2246 },
  "nevadalegalservices.org": { address: "701 E Bridger Ave #400", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1685, lng: -115.1408 },
  "nevadalegalservices": { address: "701 E Bridger Ave #400", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1685, lng: -115.1408 },
  "mcveaghfleming.co.nz": { address: "Level 14/188 Quay St, Auckland CBD", city: "Auckland", country: "New Zealand", lat: -36.8436, lng: 174.7663 },
  "mcveaghfleming": { address: "Level 14/188 Quay St, Auckland CBD", city: "Auckland", country: "New Zealand", lat: -36.8436, lng: 174.7663 },
  "digitalpark.ae": { address: "Dubai Silicon Oasis", city: "Dubai", country: "United Arab Emirates", lat: 25.1228, lng: 55.3783 },
  "aldhabidental.ae": { address: "Al Khalidiyah", city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4754, lng: 54.3475 },
  "tajhotels.com": { address: "Apollo Bunder, Colaba", city: "Mumbai", country: "India", lat: 18.9217, lng: 72.8332 },
  "zoom.com": { address: "55 Almaden Blvd 6th floor", city: "San Jose", state: "CA", country: "United States", lat: 37.3328, lng: -121.8946 },
  "zoom.us": { address: "55 Almaden Blvd 6th floor", city: "San Jose", state: "CA", country: "United States", lat: 37.3328, lng: -121.8946 },
  "reddit.com": { address: "1455 Market St #1600", city: "San Francisco", state: "CA", country: "United States", lat: 37.7758, lng: -122.4178 },
  "spotify.com": { address: "4 World Trade Center, 150 Greenwich St", city: "New York", state: "NY", country: "United States", lat: 40.7118, lng: -74.0119 },
  "legal500.com": { address: "225-227 St John St", city: "London", country: "United Kingdom", lat: 51.5245, lng: -0.1037 },
  "legal500": { address: "225-227 St John St", city: "London", country: "United Kingdom", lat: 51.5245, lng: -0.1037 },
  "thelegal500": { address: "225-227 St John St", city: "London", country: "United Kingdom", lat: 51.5245, lng: -0.1037 },
  "paulpowell.com": { address: "8918 Spanish Ridge Ave #100", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1042, lng: -115.2863 },
  "paulpowell": { address: "8918 Spanish Ridge Ave #100", city: "Las Vegas", state: "NV", country: "United States", lat: 36.1042, lng: -115.2863 },
  "jbsimonslaw.com": { address: "75 Arlington St #500", city: "Boston", state: "MA", country: "United States", lat: 42.3512, lng: -71.0700 },
  "jbsimonslaw": { address: "75 Arlington St #500", city: "Boston", state: "MA", country: "United States", lat: 42.3512, lng: -71.0700 },
  "discriminationandsexualharassmentlawyers.com": { address: "1 Penn Plaza #4905", city: "New York", state: "NY", country: "United States", lat: 40.7516, lng: -73.9934 },
  "alaris-law.com": { address: "12 Rue de la Paix", city: "Paris", country: "France", lat: 48.8698, lng: 2.3312 },
  "alaris-law": { address: "12 Rue de la Paix", city: "Paris", country: "France", lat: 48.8698, lng: 2.3312 },
  "alarislaw": { address: "12 Rue de la Paix", city: "Paris", country: "France", lat: 48.8698, lng: 2.3312 },
  "msmithlawoffices.com": { address: "100 State St #900", city: "Boston", state: "MA", country: "United States", lat: 42.3592, lng: -71.0558 },
  "msmithlawoffices": { address: "100 State St #900", city: "Boston", state: "MA", country: "United States", lat: 42.3592, lng: -71.0558 },
  "brettlevy.com": { address: "10410 N 19th Ave", city: "Phoenix", state: "AZ", country: "United States", lat: 33.5802, lng: -112.1006 },
  "brettlevy": { address: "10410 N 19th Ave", city: "Phoenix", state: "AZ", country: "United States", lat: 33.5802, lng: -112.1006 },
  "paultolandlaw.com": { address: "15 Court Square #800", city: "Boston", state: "MA", country: "United States", lat: 42.3585, lng: -71.0592 },
  "paultolandlaw": { address: "15 Court Square #800", city: "Boston", state: "MA", country: "United States", lat: 42.3585, lng: -71.0592 },
  "businessplace.com": { address: "100 Enterprise Way", city: "New York", state: "NY", country: "United States", lat: 40.7128, lng: -74.0060 },
  "businessplace": { address: "100 Enterprise Way", city: "New York", state: "NY", country: "United States", lat: 40.7128, lng: -74.0060 },
  "garageas.be": {
    address: "Battelsesteenweg 282",
    postalCode: "2800",
    city: "Mechelen",
    country: "Belgium",
    phone: "+32 15 33 95 04",
    email: "garage-as@outlook.be",
    openingHours: "Mon-Fri: 08:00 - 12:00, 13:00 - 18:00 · Sat: 08:30 - 12:30 · Closed Sun",
    category: "Auto Repair & Garage",
    lat: 51.0371,
    lng: 4.4682
  },
  "garageas": {
    address: "Battelsesteenweg 282",
    postalCode: "2800",
    city: "Mechelen",
    country: "Belgium",
    phone: "+32 15 33 95 04",
    email: "garage-as@outlook.be",
    openingHours: "Mon-Fri: 08:00 - 12:00, 13:00 - 18:00 · Sat: 08:30 - 12:30 · Closed Sun",
    category: "Auto Repair & Garage",
    lat: 51.0371,
    lng: 4.4682
  },
  "garage-as.be": {
    address: "Battelsesteenweg 282",
    postalCode: "2800",
    city: "Mechelen",
    country: "Belgium",
    phone: "+32 15 33 95 04",
    email: "garage-as@outlook.be",
    openingHours: "Mon-Fri: 08:00 - 12:00, 13:00 - 18:00 · Sat: 08:30 - 12:30 · Closed Sun",
    category: "Auto Repair & Garage",
    lat: 51.0371,
    lng: 4.4682
  },
  "garage-as": {
    address: "Battelsesteenweg 282",
    postalCode: "2800",
    city: "Mechelen",
    country: "Belgium",
    phone: "+32 15 33 95 04",
    email: "garage-as@outlook.be",
    openingHours: "Mon-Fri: 08:00 - 12:00, 13:00 - 18:00 · Sat: 08:30 - 12:30 · Closed Sun",
    category: "Auto Repair & Garage",
    lat: 51.0371,
    lng: 4.4682
  },
  "garagejv.be": {
    address: "Sint-Bernadettestraat 76",
    postalCode: "9000",
    city: "Gent",
    country: "Belgium",
    phone: "+32 9 251 56 68",
    email: "info@garagejv.be",
    openingHours: "Mon-Thu: 08:00 - 12:00, 13:00 - 18:00 · Fri: By appointment · Closed Sat & Sun",
    category: "Auto Repair & Garage",
    lat: 51.0762,
    lng: 3.7481
  },
  "garagejv": {
    address: "Sint-Bernadettestraat 76",
    postalCode: "9000",
    city: "Gent",
    country: "Belgium",
    phone: "+32 9 251 56 68",
    email: "info@garagejv.be",
    openingHours: "Mon-Thu: 08:00 - 12:00, 13:00 - 18:00 · Fri: By appointment · Closed Sat & Sun",
    category: "Auto Repair & Garage",
    lat: 51.0762,
    lng: 3.7481
  },
  "garage-jv.be": {
    address: "Sint-Bernadettestraat 76",
    postalCode: "9000",
    city: "Gent",
    country: "Belgium",
    phone: "+32 9 251 56 68",
    email: "info@garagejv.be",
    openingHours: "Mon-Thu: 08:00 - 12:00, 13:00 - 18:00 · Fri: By appointment · Closed Sat & Sun",
    category: "Auto Repair & Garage",
    lat: 51.0762,
    lng: 3.7481
  },
  "garage-jv": {
    address: "Sint-Bernadettestraat 76",
    postalCode: "9000",
    city: "Gent",
    country: "Belgium",
    phone: "+32 9 251 56 68",
    email: "info@garagejv.be",
    openingHours: "Mon-Thu: 08:00 - 12:00, 13:00 - 18:00 · Fri: By appointment · Closed Sat & Sun",
    category: "Auto Repair & Garage",
    lat: 51.0762,
    lng: 3.7481
  },
  "brusselsdental.com": { address: "Rue de la Loi 235", postalCode: "1040", city: "Brussels", country: "Belgium", lat: 50.8436, lng: 4.3824 },
  "brusselsdental": { address: "Rue de la Loi 235", postalCode: "1040", city: "Brussels", country: "Belgium", lat: 50.8436, lng: 4.3824 },
  "apotheekgodelaine.be": { address: "Berkenlaan 85", postalCode: "2610", city: "Wilrijk", country: "Belgium", lat: 51.18288, lng: 4.39160 },
  "apotheekgodelaine": { address: "Berkenlaan 85", postalCode: "2610", city: "Wilrijk", country: "Belgium", lat: 51.18288, lng: 4.39160 },
  "optieknieuwenhuysen.be": { address: "Fruithoflaan 19", postalCode: "2600", city: "Berchem", country: "Belgium", lat: 51.1809661, lng: 4.4355056 },
  "optieknieuwenhuysen": { address: "Fruithoflaan 19", postalCode: "2600", city: "Berchem", country: "Belgium", lat: 51.1809661, lng: 4.4355056 },
  "vandenbalck.be": { 
    address: "Bondgenotenlaan 50a", 
    postalCode: "3000", 
    city: "Leuven", 
    country: "Belgium", 
    lat: 50.8804, 
    lng: 4.7042,
    locations: [
      { name: "Optiek Vandenbalck Eyecare", address: "Bondgenotenlaan 50a", postalCode: "3000", city: "Leuven", phone: "+32 16 22 28 85", email: "eyecare@vandenbalck.be" },
      { name: "Optiek Vandenbalck Eyewear", address: "Bondgenotenlaan 76", postalCode: "3000", city: "Leuven", phone: "+32 16 22 28 85", email: "eyewear@vandenbalck.be" }
    ]
  },
  "vandenbalck": { 
    address: "Bondgenotenlaan 50a", 
    postalCode: "3000", 
    city: "Leuven", 
    country: "Belgium", 
    lat: 50.8804, 
    lng: 4.7042,
    locations: [
      { name: "Optiek Vandenbalck Eyecare", address: "Bondgenotenlaan 50a", postalCode: "3000", city: "Leuven", phone: "+32 16 22 28 85", email: "eyecare@vandenbalck.be" },
      { name: "Optiek Vandenbalck Eyewear", address: "Bondgenotenlaan 76", postalCode: "3000", city: "Leuven", phone: "+32 16 22 28 85", email: "eyewear@vandenbalck.be" }
    ]
  },
  "toopoptiek.com": { 
    address: "Mechelsestraat 27", 
    postalCode: "3000", 
    city: "Leuven", 
    country: "Belgium", 
    lat: 50.8806643, 
    lng: 4.6996604,
    locations: [
      { city: "Leuven", postalCode: "3000", address: "Mechelsestraat 27", phone: "+32 16 89 94 28", email: "leuven@toopoptiek.com", openingHours: "Dinsdag - Zaterdag: 10:00 - 18:00 · Closed Maandag & Zondag" },
      { city: "Edegem", postalCode: "2650", address: "Mechelsesteenweg 476", phone: "+32 33 69 65 60", email: "antwerpen@toopoptiek.com", openingHours: "Dinsdag - Zaterdag: 10:00 - 18:00 · Closed Maandag & Zondag" },
      { city: "Sint-Martens-Latem", postalCode: "9830", address: "Kortrijksesteenweg 66", phone: "+32 9 469 44 44", email: "gent@toopoptiek.com", openingHours: "Dinsdag - Zaterdag: 10:00 - 18:00 · Closed Maandag & Zondag" }
    ]
  },
  "toopoptiek": { 
    address: "Mechelsestraat 27", 
    postalCode: "3000", 
    city: "Leuven", 
    country: "Belgium", 
    lat: 50.8806643, 
    lng: 4.6996604,
    locations: [
      { city: "Leuven", postalCode: "3000", address: "Mechelsestraat 27", phone: "+32 16 89 94 28", email: "leuven@toopoptiek.com", openingHours: "Dinsdag - Zaterdag: 10:00 - 18:00 · Closed Maandag & Zondag" },
      { city: "Edegem", postalCode: "2650", address: "Mechelsesteenweg 476", phone: "+32 33 69 65 60", email: "antwerpen@toopoptiek.com", openingHours: "Dinsdag - Zaterdag: 10:00 - 18:00 · Closed Maandag & Zondag" },
      { city: "Sint-Martens-Latem", postalCode: "9830", address: "Kortrijksesteenweg 66", phone: "+32 9 469 44 44", email: "gent@toopoptiek.com", openingHours: "Dinsdag - Zaterdag: 10:00 - 18:00 · Closed Maandag & Zondag" }
    ]
  },
  "dentisteerpent.be": { address: "Rue des Jacinthes 8", postalCode: "5101", city: "Erpent", country: "Belgium", lat: 50.4578, lng: 4.9082 },
  "dentisteerpent": { address: "Rue des Jacinthes 8", postalCode: "5101", city: "Erpent", country: "Belgium", lat: 50.4578, lng: 4.9082 },
  "dentiste-namur.be": { address: "Rue de Fer 22", postalCode: "5000", city: "Namur", country: "Belgium", lat: 50.4674, lng: 4.8719 },
  "dentiste-namur": { address: "Rue de Fer 22", postalCode: "5000", city: "Namur", country: "Belgium", lat: 50.4674, lng: 4.8719 },
  "tandis.be": { address: "Lange Gasthuisstraat 3", postalCode: "2000", city: "Antwerpen", country: "Belgium", lat: 51.2163, lng: 4.4042 },
  "tandis": { address: "Lange Gasthuisstraat 3", postalCode: "2000", city: "Antwerpen", country: "Belgium", lat: 51.2163, lng: 4.4042 },
  "dental365.nl": { address: "Kanaalstraat 40", postalCode: "4388 BN", city: "Oost-Souburg", country: "Netherlands", lat: 51.4682, lng: 3.6041 },
  "dental365": { address: "Kanaalstraat 40", postalCode: "4388 BN", city: "Oost-Souburg", country: "Netherlands", lat: 51.4682, lng: 3.6041 },
  "multipharma.be": {
    address: "Rue du Marché aux Poulets 37",
    postalCode: "1000",
    city: "Brussels",
    country: "Belgium",
    lat: 50.8491,
    lng: 4.3512,
    locations: [
      { name: "Multipharma Marché aux Poulets", address: "Rue du Marché aux Poulets 37", postalCode: "1000", city: "Brussels", phone: "+32 2 511 35 90", openingHours: "Mon - Sat: 09:00 - 18:00 · Closed Sun", lat: 50.8491, lng: 4.3512 },
      { name: "Multipharma Alexiens", address: "Rue des Alexiens 13", postalCode: "1000", city: "Brussels", phone: "+32 2 513 64 32", openingHours: "Mon - Fri: 09:00 - 17:30 · Closed Sat & Sun", lat: 50.8437, lng: 4.3518 },
      { name: "Multipharma Porte de Hal", address: "Rue Haute 343", postalCode: "1000", city: "Brussels", phone: "+32 2 511 33 64", openingHours: "Mon - Sat: 09:00 - 18:30 · Closed Sun", lat: 50.8351, lng: 4.3468 },
      { name: "Multipharma Parvis de Saint-Gilles", address: "Parvis de Saint-Gilles 45", postalCode: "1060", city: "Brussels", phone: "+32 2 537 01 89", openingHours: "Mon - Sat: 09:00 - 18:00 · Closed Sun", lat: 50.8298, lng: 4.3462 },
      { name: "Multipharma Charleroi", address: "Chaussée de Charleroi 38", postalCode: "1060", city: "Saint-Gilles", phone: "+32 2 537 60 11", openingHours: "Mon - Sat: 09:00 - 19:00 · Closed Sun", lat: 50.8306, lng: 4.3578 }
    ]
  },
  "multipharma": {
    address: "Rue du Marché aux Poulets 37",
    postalCode: "1000",
    city: "Brussels",
    country: "Belgium",
    lat: 50.8491,
    lng: 4.3512,
    locations: [
      { name: "Multipharma Marché aux Poulets", address: "Rue du Marché aux Poulets 37", postalCode: "1000", city: "Brussels", phone: "+32 2 511 35 90", openingHours: "Mon - Sat: 09:00 - 18:00 · Closed Sun", lat: 50.8491, lng: 4.3512 },
      { name: "Multipharma Alexiens", address: "Rue des Alexiens 13", postalCode: "1000", city: "Brussels", phone: "+32 2 513 64 32", openingHours: "Mon - Fri: 09:00 - 17:30 · Closed Sat & Sun", lat: 50.8437, lng: 4.3518 },
      { name: "Multipharma Porte de Hal", address: "Rue Haute 343", postalCode: "1000", city: "Brussels", phone: "+32 2 511 33 64", openingHours: "Mon - Sat: 09:00 - 18:30 · Closed Sun", lat: 50.8351, lng: 4.3468 },
      { name: "Multipharma Parvis de Saint-Gilles", address: "Parvis de Saint-Gilles 45", postalCode: "1060", city: "Brussels", phone: "+32 2 537 01 89", openingHours: "Mon - Sat: 09:00 - 18:00 · Closed Sun", lat: 50.8298, lng: 4.3462 },
      { name: "Multipharma Charleroi", address: "Chaussée de Charleroi 38", postalCode: "1060", city: "Saint-Gilles", phone: "+32 2 537 60 11", openingHours: "Mon - Sat: 09:00 - 19:00 · Closed Sun", lat: 50.8306, lng: 4.3578 }
    ]
  },
  "chemistwarehouse.com.au": {
    address: "416-418 George St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8703,
    lng: 151.2070,
    locations: [
      { name: "Chemist Warehouse Sydney CBD", address: "416-418 George St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9232 4470", openingHours: "Mon - Fri: 07:30 - 20:00, Sat - Sun: 09:00 - 18:00", lat: -33.8703, lng: 151.2070 },
      { name: "Chemist Warehouse Melbourne Bourke St", address: "327-333 Bourke St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 3 9654 6699", openingHours: "Mon - Fri: 08:00 - 21:00, Sat - Sun: 09:00 - 19:00", lat: -37.8135, lng: 144.9652 },
      { name: "Chemist Warehouse Brisbane Queen St", address: "138 Queen St", postalCode: "4000", city: "Brisbane", state: "QLD", country: "Australia", phone: "+61 7 3221 3466", openingHours: "Mon - Fri: 08:00 - 19:00, Sat - Sun: 09:00 - 18:00", lat: -27.4699, lng: 153.0255 },
      { name: "Chemist Warehouse Perth Hay St", address: "647 Hay St", postalCode: "6000", city: "Perth", state: "WA", country: "Australia", phone: "+61 8 9325 3300", openingHours: "Mon - Fri: 08:00 - 18:30, Sat: 09:00 - 17:30, Sun: 11:00 - 17:00", lat: -31.9536, lng: 115.8605 }
    ]
  },
  "chemistwarehouse": {
    address: "416-418 George St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8703,
    lng: 151.2070,
    locations: [
      { name: "Chemist Warehouse Sydney CBD", address: "416-418 George St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9232 4470", openingHours: "Mon - Fri: 07:30 - 20:00, Sat - Sun: 09:00 - 18:00", lat: -33.8703, lng: 151.2070 },
      { name: "Chemist Warehouse Melbourne Bourke St", address: "327-333 Bourke St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 3 9654 6699", openingHours: "Mon - Fri: 08:00 - 21:00, Sat - Sun: 09:00 - 19:00", lat: -37.8135, lng: 144.9652 },
      { name: "Chemist Warehouse Brisbane Queen St", address: "138 Queen St", postalCode: "4000", city: "Brisbane", state: "QLD", country: "Australia", phone: "+61 7 3221 3466", openingHours: "Mon - Fri: 08:00 - 19:00, Sat - Sun: 09:00 - 18:00", lat: -27.4699, lng: 153.0255 }
    ]
  },
  "priceline.com.au": {
    address: "Shop 25, 429 George St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8711,
    lng: 151.2067,
    locations: [
      { name: "Priceline Sydney Queen Victoria Building", address: "Shop 25, 429 George St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9233 2833", openingHours: "Mon - Fri: 08:00 - 19:00, Sat: 09:00 - 18:00, Sun: 10:00 - 17:00", lat: -33.8711, lng: 151.2067 },
      { name: "Priceline Melbourne Elizabeth St", address: "250 Elizabeth St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 3 9663 3311", openingHours: "Mon - Fri: 08:00 - 19:00, Sat - Sun: 09:30 - 18:00", lat: -37.8118, lng: 144.9634 },
      { name: "Priceline Brisbane Wintergarden", address: "171 Queen St", postalCode: "4000", city: "Brisbane", state: "QLD", country: "Australia", phone: "+61 7 3221 2166", openingHours: "Mon - Fri: 08:30 - 18:30, Sat: 09:00 - 17:30, Sun: 10:00 - 16:00", lat: -27.4692, lng: 153.0267 }
    ]
  },
  "priceline": {
    address: "Shop 25, 429 George St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8711,
    lng: 151.2067,
    locations: [
      { name: "Priceline Sydney Queen Victoria Building", address: "Shop 25, 429 George St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9233 2833", openingHours: "Mon - Fri: 08:00 - 19:00, Sat: 09:00 - 18:00, Sun: 10:00 - 17:00", lat: -33.8711, lng: 151.2067 },
      { name: "Priceline Melbourne Elizabeth St", address: "250 Elizabeth St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 3 9663 3311", openingHours: "Mon - Fri: 08:00 - 19:00, Sat - Sun: 09:30 - 18:00", lat: -37.8118, lng: 144.9634 }
    ]
  },
  "terrywhitechemmart.com.au": {
    address: "197 Pitt St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8696,
    lng: 151.2085,
    locations: [
      { name: "TerryWhite Chemmart Sydney Mid City", address: "197 Pitt St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9235 1566", openingHours: "Mon - Fri: 08:00 - 18:00, Sat: 09:00 - 16:00", lat: -33.8696, lng: 151.2085 },
      { name: "TerryWhite Chemmart Brisbane Queen St", address: "91 Queen St", postalCode: "4000", city: "Brisbane", state: "QLD", country: "Australia", phone: "+61 7 3229 3977", openingHours: "Mon - Fri: 08:00 - 18:00, Sat: 09:00 - 17:00", lat: -27.4705, lng: 153.0248 }
    ]
  },
  "commbank.com.au": {
    address: "48 Martin Pl",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8679,
    lng: 151.2100,
    locations: [
      { name: "CommBank Martin Place Flagship", address: "48 Martin Pl", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 13 2221", openingHours: "Mon - Fri: 09:30 - 16:00", lat: -33.8679, lng: 151.2100 },
      { name: "CommBank Melbourne Bourke St", address: "385 Bourke St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 13 2221", openingHours: "Mon - Fri: 09:30 - 16:00", lat: -37.8146, lng: 144.9622 }
    ]
  },
  "anz.com.au": {
    address: "833 Collins St",
    postalCode: "3008",
    city: "Melbourne",
    state: "VIC",
    country: "Australia",
    lat: -37.8208,
    lng: 144.9469,
    locations: [
      { name: "ANZ World Headquarters Docklands", address: "833 Collins St", postalCode: "3008", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 13 1314", openingHours: "Mon - Fri: 09:30 - 16:00", lat: -37.8208, lng: 144.9469 },
      { name: "ANZ Sydney Flagship", address: "242 Pitt St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 13 1314", openingHours: "Mon - Fri: 09:30 - 16:00", lat: -33.8722, lng: 151.2081 }
    ]
  },
  "opsm.com.au": {
    address: "413 George St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8702,
    lng: 151.2066,
    locations: [
      { name: "OPSM Sydney George St", address: "413 George St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9221 4455", openingHours: "Mon - Wed: 09:00 - 18:00, Thu: 09:00 - 20:00, Fri: 09:00 - 18:30, Sat - Sun: 10:00 - 17:00", lat: -33.8702, lng: 151.2066 },
      { name: "OPSM Melbourne Collins St", address: "280 Collins St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 3 9654 8877", openingHours: "Mon - Thu: 09:00 - 17:30, Fri: 09:00 - 19:00, Sat: 09:30 - 17:00, Sun: 11:00 - 16:00", lat: -37.8159, lng: 144.9649 }
    ]
  },
  "nationaldentalcare.com.au": {
    address: "Level 1, 107 Pitt St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8672,
    lng: 151.2088,
    locations: [
      { name: "National Dental Care Sydney CBD", address: "Level 1, 107 Pitt St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9232 3337", openingHours: "Mon - Fri: 08:00 - 17:30", lat: -33.8672, lng: 151.2088 },
      { name: "National Dental Care Brisbane CBD", address: "Level 4, 141 Queen St", postalCode: "4000", city: "Brisbane", state: "QLD", country: "Australia", phone: "+61 7 3221 0443", openingHours: "Mon - Fri: 08:00 - 17:00", lat: -27.4697, lng: 153.0259 }
    ]
  },
  "pacificsmilesdental.com.au": {
    address: "483 George St",
    postalCode: "2000",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    lat: -33.8735,
    lng: 151.2064,
    locations: [
      { name: "Pacific Smiles Dental Sydney Town Hall", address: "483 George St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9264 5644", openingHours: "Mon - Fri: 08:00 - 18:00, Sat: 08:30 - 16:00, Sun: 09:30 - 15:30", lat: -33.8735, lng: 151.2064 },
      { name: "Pacific Smiles Dental Melbourne CBD", address: "285 Little Collins St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 3 9663 0566", openingHours: "Mon - Fri: 08:00 - 18:00, Sat: 08:30 - 15:30", lat: -37.8152, lng: 144.9654 }
    ]
  },
  "jbhifi.com.au": {
    address: "206 Bourke St",
    postalCode: "3000",
    city: "Melbourne",
    state: "VIC",
    country: "Australia",
    lat: -37.8126,
    lng: 144.9678,
    locations: [
      { name: "JB Hi-Fi Melbourne Bourke St", address: "206 Bourke St", postalCode: "3000", city: "Melbourne", state: "VIC", country: "Australia", phone: "+61 3 9663 3555", openingHours: "Mon - Wed: 09:00 - 18:00, Thu - Fri: 09:00 - 21:00, Sat: 09:00 - 18:00, Sun: 10:00 - 18:00", lat: -37.8126, lng: 144.9678 },
      { name: "JB Hi-Fi Sydney City Galeries", address: "500 George St", postalCode: "2000", city: "Sydney", state: "NSW", country: "Australia", phone: "+61 2 9267 8500", openingHours: "Mon - Wed: 09:00 - 18:00, Thu: 09:00 - 21:00, Fri - Sat: 09:00 - 19:00, Sun: 10:00 - 18:00", lat: -33.8732, lng: 151.2072 }
    ]
  },
  "lassustandartsen.nl": { address: "Keizersgracht 378", postalCode: "1016 GB", city: "Amsterdam", country: "Netherlands", lat: 52.3688, lng: 4.8837 },
  "lassustandartsen": { address: "Keizersgracht 378", postalCode: "1016 GB", city: "Amsterdam", country: "Netherlands", lat: 52.3688, lng: 4.8837 },
  "usa.com": { address: "100 Wall Street", postalCode: "10005", city: "New York", state: "NY", country: "United States", lat: 40.7058, lng: -74.0071 },
  "starbucks.com": { name: "Starbucks", address: "2401 Utah Ave S", postalCode: "98134", city: "Seattle", state: "WA", country: "United States", phone: "+1 (800) 782-7282", email: "info@starbucks.com", openingHours: "Mon - Sun: 05:30 - 21:00", lat: 47.5802, lng: -122.3352 },
  "starbucks": { name: "Starbucks", address: "2401 Utah Ave S", postalCode: "98134", city: "Seattle", state: "WA", country: "United States", phone: "+1 (800) 782-7282", email: "info@starbucks.com", openingHours: "Mon - Sun: 05:30 - 21:00", lat: 47.5802, lng: -122.3352 },
  "nike.com": { name: "Nike", address: "One Bowerman Dr", postalCode: "97005", city: "Beaverton", state: "OR", country: "United States", phone: "+1 (800) 806-6453", email: "support@nike.com", openingHours: "Mon - Sat: 10:00 - 20:00 · Sun: 11:00 - 18:00", lat: 45.5088, lng: -122.8274 },
  "nike": { name: "Nike", address: "One Bowerman Dr", postalCode: "97005", city: "Beaverton", state: "OR", country: "United States", phone: "+1 (800) 806-6453", email: "support@nike.com", openingHours: "Mon - Sat: 10:00 - 20:00 · Sun: 11:00 - 18:00", lat: 45.5088, lng: -122.8274 },
  "mcdonalds.com": { name: "McDonald's", address: "110 N Carpenter St", postalCode: "60607", city: "Chicago", state: "IL", country: "United States", phone: "+1 (800) 244-6227", email: "contactus@mcdonalds.com", openingHours: "Open 24 Hours · 7 Days a Week", lat: 41.8835, lng: -87.6534 },
  "mcdonalds": { name: "McDonald's", address: "110 N Carpenter St", postalCode: "60607", city: "Chicago", state: "IL", country: "United States", phone: "+1 (800) 244-6227", email: "contactus@mcdonalds.com", openingHours: "Open 24 Hours · 7 Days a Week", lat: 41.8835, lng: -87.6534 },
  "apple.com": { name: "Apple", address: "One Apple Park Way", postalCode: "95014", city: "Cupertino", state: "CA", country: "United States", phone: "+1 (800) 692-7753", email: "contactus@apple.com", openingHours: "Mon - Sat: 10:00 - 21:00 · Sun: 11:00 - 19:00", lat: 37.3349, lng: -122.0090 },
  "isrotel.co.il": { name: "ישרוטל אילת", address: "Kamen St 1", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 8-638-6666", email: "orders@isrotel.co.il", openingHours: "Open 24/7 · Check-in 15:00 · Check-out 11:00", lat: 29.5532, lng: 34.9582 },
  "isrotel": { name: "ישרוטל אילת", address: "Kamen St 1", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 8-638-6666", email: "orders@isrotel.co.il", openingHours: "Open 24/7 · Check-in 15:00 · Check-out 11:00", lat: 29.5532, lng: 34.9582 },
  "danhotels.co.il": { name: "דן אילת", address: "Derech HaPa'amonim 1", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 3-520-2552", email: "reservations@danhotels.com", openingHours: "Open 24/7 · 7 Days a Week", lat: 29.5510, lng: 34.9650 },
  "danhotels.com": { name: "Dan Hotels", address: "Derech HaPa'amonim 1", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 3-520-2552", email: "reservations@danhotels.com", openingHours: "Open 24/7 · 7 Days a Week", lat: 29.5510, lng: 34.9650 },
  "danhotels": { name: "Dan Hotels", address: "Derech HaPa'amonim 1", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 3-520-2552", email: "reservations@danhotels.com", openingHours: "Open 24/7 · 7 Days a Week", lat: 29.5510, lng: 34.9650 },
  "clubhotels-israel.com": { name: "קלאב הוטל אילת", address: "Ha'arava Rd", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 8-636-1666", email: "info@clubhotels.co.il", openingHours: "Open 24/7 · 7 Days a Week", lat: 29.5520, lng: 34.9540 },
  "clubhotels.co.il": { name: "קלאב הוטל אילת", address: "Ha'arava Rd", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 8-636-1666", email: "info@clubhotels.co.il", openingHours: "Open 24/7 · 7 Days a Week", lat: 29.5520, lng: 34.9540 },
  "clubhotel.co.il": { name: "קלאב הוטל אילת", address: "Ha'arava Rd", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 8-636-1666", email: "info@clubhotels.co.il", openingHours: "Open 24/7 · 7 Days a Week", lat: 29.5520, lng: 34.9540 },
  "clubhotel": { name: "קלאב הוטל אילת", address: "Ha'arava Rd", postalCode: "88000", city: "Eilat", country: "Israel", phone: "+972 8-636-1666", email: "info@clubhotels.co.il", openingHours: "Open 24/7 · 7 Days a Week", lat: 29.5520, lng: 34.9540 },
  "azrielimalls.co.il": { name: "קניוני עזריאלי תל אביב", address: "Derech Menachem Begin 132", postalCode: "6701101", city: "Tel Aviv-Yafo", country: "Israel", phone: "+972 3-608-1111", email: "info@azrieli.com", openingHours: "Sun - Thu: 09:30 - 22:00, Fri: 09:00 - 15:00, Sat: After Shabbat - 23:00", category: "Shopping Mall", lat: 32.0747, lng: 34.7920 },
  "azrieli.com": { name: "קניוני עזריאלי תל אביב", address: "Derech Menachem Begin 132", postalCode: "6701101", city: "Tel Aviv-Yafo", country: "Israel", phone: "+972 3-608-1111", email: "info@azrieli.com", openingHours: "Sun - Thu: 09:30 - 22:00, Fri: 09:00 - 15:00, Sat: After Shabbat - 23:00", category: "Shopping Mall", lat: 32.0747, lng: 34.7920 }
};

export const KNOWN_LOCATIONS = KNOWN_BUSINESS_HEADQUARTERS;

/**
 * Verified city coordinates for reliable map previews across any new or existing business location
 */
export const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "berchem": { lat: 51.1809661, lng: 4.4355056 },
  "wilrijk": { lat: 51.18288, lng: 4.39160 },
  "phoenix": { lat: 33.4484, lng: -112.0740 },
  "las vegas": { lat: 36.1699, lng: -115.1398 },
  "boston": { lat: 42.3601, lng: -71.0589 },
  "new york": { lat: 40.7128, lng: -74.0060 },
  "new york city": { lat: 40.7128, lng: -74.0060 },
  "miami": { lat: 25.7617, lng: -80.1918 },
  "miami beach": { lat: 25.7907, lng: -80.1408 },
  "san jose": { lat: 37.3382, lng: -121.8863 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  "chicago": { lat: 41.8781, lng: -87.6298 },
  "london": { lat: 51.5074, lng: -0.1278 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "dubai": { lat: 25.2048, lng: 55.2708 },
  "abu dhabi": { lat: 24.4539, lng: 54.3773 },
  "auckland": { lat: -36.8485, lng: 174.7633 },
  "mumbai": { lat: 18.9217, lng: 72.8332 },
  "brussels": { lat: 50.8503, lng: 4.3517 },
  "bruxelles": { lat: 50.8503, lng: 4.3517 },
  "antwerpen": { lat: 51.2194, lng: 4.4025 },
  "antwerp": { lat: 51.2194, lng: 4.4025 },
  "namur": { lat: 50.4674, lng: 4.8719 },
  "erpent": { lat: 50.4578, lng: 4.9082 },
  "ghent": { lat: 51.0543, lng: 3.7174 },
  "gent": { lat: 51.0543, lng: 3.7174 },
  "liege": { lat: 50.6326, lng: 5.5797 },
  "doha": { lat: 25.2854, lng: 51.5310 },
  "riyadh": { lat: 24.7136, lng: 46.6753 },
  "toronto": { lat: 43.6532, lng: -79.3832 },
  "sydney": { lat: -33.8688, lng: 151.2093 },
  "melbourne": { lat: -37.8136, lng: 144.9631 },
  "brisbane": { lat: -27.4705, lng: 153.0260 },
  "perth": { lat: -31.9505, lng: 115.8605 },
  "adelaide": { lat: -34.9285, lng: 138.6007 },
  "gold coast": { lat: -28.0167, lng: 153.4000 },
  "canberra": { lat: -35.2809, lng: 149.1300 },
  "hobart": { lat: -42.8821, lng: 147.3272 },
  "darwin": { lat: -12.4634, lng: 130.8456 },
  "madrid": { lat: 40.4168, lng: -3.7038 }
};

/**
 * Resolves the cleanest, high-accuracy query string for Google Maps search, directions, and embeds.
 * Crucial: NEVER puts a raw domain (like "lernerandrowe.com" or "https://...") into Google Maps,
 * which causes Google Maps to return "Google Maps can't find domain.com".
 * Instead, passes the human-readable business name + real street address/city/state if available.
 */
export function getGoogleMapsQuery(place?: Partial<Place> | null, customDisplayName?: string): string {
  if (!place && !customDisplayName) return "Yoouz";

  const placeKey = (place?.brandDomain || place?.id || place?.website || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();

  // 1. Resolve authentic clean business name
  let name = customDisplayName && !customDisplayName.includes("://") && !customDisplayName.endsWith(".com")
    ? customDisplayName
    : formatBusinessName(place?.name || place?.id || place?.brandDomain || "");

  if (!name || name.includes("://") || name.endsWith(".com") || name.toLowerCase() === "yoouz.com") {
    name = formatBusinessName(place?.id || place?.brandDomain || place?.name || "") || "Yoouz";
  }

  // Filter out raw domain leftovers
  name = name.replace(/\.(com|net|org|ae|be|co\.uk|io|ai|app|co\.nz)$/i, "").trim();

  // 2. If a specific non-generic street address is passed on place, use it directly (supports branch selection)
  const rawAddress = (place?.address || "").trim();
  const isUrlOnly = /^(https?:\/\/|www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(rawAddress);
  const isGenericAddress = 
    !rawAddress ||
    rawAddress.toLowerCase() === placeKey ||
    isUrlOnly ||
    rawAddress.toLowerCase() === "verified location" ||
    rawAddress.toLowerCase() === "verified listing" ||
    rawAddress.toLowerCase() === "verified business" ||
    rawAddress.toLowerCase() === "online" ||
    rawAddress.toLowerCase() === "worldwide" ||
    rawAddress.toLowerCase() === "global" ||
    rawAddress.toLowerCase() === "website" ||
    rawAddress.toLowerCase().startsWith("official domain:");

  if (!isGenericAddress) {
    let q = `${name}, ${rawAddress}`;
    if (place?.city && !rawAddress.toLowerCase().includes(place.city.toLowerCase())) {
      q += `, ${place.city}`;
    }
    if (place?.country && !rawAddress.toLowerCase().includes(place.country.toLowerCase()) && !["worldwide", "global"].includes(place.country.toLowerCase())) {
      q += `, ${place.country}`;
    }
    return q;
  }

  // 3. Check known verified headquarters fallback
  const knownHq = KNOWN_BUSINESS_HEADQUARTERS[placeKey] || KNOWN_BUSINESS_HEADQUARTERS[placeKey.replace(/\.(com|org|net|ae|co\.nz|us|io|com\.au|au)$/i, '')];
  if (knownHq) {
    if (knownHq.address && knownHq.city) {
      return `${name}, ${knownHq.address}, ${knownHq.city}${knownHq.state ? ', ' + knownHq.state : ''}`;
    }
    if (knownHq.city) {
      return `${name}, ${knownHq.city}${knownHq.country ? ', ' + knownHq.country : ''}`;
    }
  }

  const rawCity = (place?.city || "").trim();
  const isGenericCity =
    !rawCity ||
    rawCity.toLowerCase() === "online" ||
    rawCity.toLowerCase() === "worldwide" ||
    rawCity.toLowerCase() === "global headquarters" ||
    rawCity.toLowerCase() === "global";

  const rawCountry = (place?.country || "").trim();
  const isGenericCountry = !rawCountry || rawCountry.toLowerCase() === "global" || rawCountry.toLowerCase() === "worldwide";

  // If we have a real street address
  if (!isGenericAddress) {
    return `${name}, ${rawAddress}`;
  }

  // If we have a real city / country
  if (!isGenericCity) {
    const loc = !isGenericCountry ? `${rawCity}, ${rawCountry}` : rawCity;
    return `${name}, ${loc}`;
  }

  if (!isGenericCountry) {
    return `${name}, ${rawCountry}`;
  }

  return name;
}

/**
 * Returns the Google Maps Directions / Place Card URL using the resolved business name and location.
 */
export function getGoogleMapsDirectionsUrl(place?: Partial<Place> | null, customDisplayName?: string): string {
  const query = getGoogleMapsQuery(place, customDisplayName);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Returns the Google Maps Embed URL using the resolved business name and location.
 * Standard embed automatically renders the pin, map tiles, and street view without blank water or coordinate collisions.
 */
export function getGoogleMapsEmbedUrl(place?: Partial<Place> | null, customDisplayName?: string): string {
  const query = getGoogleMapsQuery(place, customDisplayName);
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

/**
 * Formats phone numbers into professional international standard representation with clean spacing
 */
export function formatPhoneNumber(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  let clean = raw.trim();
  if (!clean || clean.length < 5) return clean;

  // Handle leading 00 as +
  if (clean.startsWith("00")) {
    clean = "+" + clean.slice(2);
  }

  const hasPlus = clean.startsWith("+");
  const digitsOnly = clean.replace(/[^0-9]/g, "");

  if (!digitsOnly) return clean;

  // Belgium (+32)
  if (clean.startsWith("+32") || (digitsOnly.startsWith("32") && digitsOnly.length >= 9)) {
    const rest = digitsOnly.startsWith("32") ? digitsOnly.slice(2) : digitsOnly;
    const local = rest.startsWith("0") ? rest.slice(1) : rest;
    
    // 1-digit area code: 2, 3, 4, 9 (e.g. 38886888 -> +32 3 888 68 88)
    if (/^[2349]/.test(local) && local.length === 8) {
      return `+32 ${local[0]} ${local.slice(1, 4)} ${local.slice(4, 6)} ${local.slice(6)}`;
    }
    // 2-digit area code: 81, 65, 50, 71, 10, 11, etc. (e.g. 81312191 -> +32 81 31 21 91)
    if (/^(10|11|12|13|14|15|16|19|50|51|52|53|54|55|56|57|58|59|60|61|63|64|65|67|68|69|71|80|81|82|83|84|85|86|87|89)/.test(local) && local.length === 8) {
      return `+32 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6)}`;
    }
    // Mobile: 47X, 48X, 49X, 46X (e.g. 470123456 -> +32 470 12 34 56)
    if (/^4[5-9]/.test(local) && local.length === 9) {
      return `+32 ${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
    }
    // Generic Belgium 8-9 digits fallback
    if (local.length === 8) {
      return `+32 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6)}`;
    }
    if (local.length === 9) {
      return `+32 ${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
    }
    return `+32 ${local}`;
  }

  // Belgium local format starting with 0 (e.g. 03 888 68 88 or 02 231 04 32 or 081 31 21 91)
  if (digitsOnly.startsWith("0") && digitsOnly.length === 9) {
    const local = digitsOnly.slice(1);
    if (/^[2349]/.test(local)) {
      return `+32 ${local[0]} ${local.slice(1, 4)} ${local.slice(4, 6)} ${local.slice(6)}`;
    }
    return `+32 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6)}`;
  }
  if (digitsOnly.startsWith("04") && digitsOnly.length === 10) {
    const local = digitsOnly.slice(1);
    return `+32 ${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
  }

  // US/Canada (+1)
  if (clean.startsWith("+1") || (digitsOnly.startsWith("1") && digitsOnly.length === 11)) {
    const rest = digitsOnly.startsWith("1") ? digitsOnly.slice(1) : digitsOnly;
    if (rest.length === 10) {
      return `+1 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`;
    }
  }

  // UAE (+971)
  if (clean.startsWith("+971") || (digitsOnly.startsWith("971") && digitsOnly.length >= 11)) {
    const rest = digitsOnly.startsWith("971") ? digitsOnly.slice(3) : digitsOnly;
    const local = rest.startsWith("0") ? rest.slice(1) : rest;
    if (local.length === 8) {
      return `+971 ${local[0]} ${local.slice(1, 4)} ${local.slice(4)}`;
    }
    if (local.length === 9) {
      return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
  }

  // France (+33)
  if (clean.startsWith("+33") || (digitsOnly.startsWith("33") && digitsOnly.length === 11)) {
    const rest = digitsOnly.startsWith("33") ? digitsOnly.slice(2) : digitsOnly;
    const local = rest.startsWith("0") ? rest.slice(1) : rest;
    if (local.length === 9) {
      return `+33 ${local[0]} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
    }
  }

  // UK (+44)
  if (clean.startsWith("+44") || (digitsOnly.startsWith("44") && digitsOnly.length >= 12)) {
    const rest = digitsOnly.startsWith("44") ? digitsOnly.slice(2) : digitsOnly;
    const local = rest.startsWith("0") ? rest.slice(1) : rest;
    if (local.startsWith("20") && local.length === 10) {
      return `+44 20 ${local.slice(2, 6)} ${local.slice(6)}`;
    }
    if (local.length === 10) {
      return `+44 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    }
  }

  // Spain (+34)
  if (clean.startsWith("+34") || (digitsOnly.startsWith("34") && digitsOnly.length === 11)) {
    const rest = digitsOnly.startsWith("34") ? digitsOnly.slice(2) : digitsOnly;
    if (rest.length === 9) {
      return `+34 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7)}`;
    }
  }

  // If already cleanly formatted with spaces/hyphens, preserve
  if (/^(\+[0-9]{1,4})\s+([0-9\s-()]+)$/.test(clean)) {
    return clean;
  }

  // Generic international fallback: group nicely
  if (hasPlus && digitsOnly.length >= 8) {
    const cc = digitsOnly.slice(0, 2);
    const rest = digitsOnly.slice(2);
    const chunks: string[] = [];
    let i = 0;
    while (i < rest.length) {
      const size = (rest.length - i) % 2 === 1 ? 3 : 2;
      chunks.push(rest.slice(i, i + size));
      i += size;
    }
    return `+${cc} ${chunks.join(" ")}`;
  }

  return clean;
}

