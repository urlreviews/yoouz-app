import { Place } from "../types";

// High-fidelity vector logos for verified businesses
export const KNOWN_BRAND_LOGOS: Record<string, string> = {
  "midtownwellness.co.uk": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <g fill="#f4f4f5">
        <rect x="22" y="24" width="6" height="52" rx="3"/>
        <rect x="34" y="32" width="6" height="44" rx="3"/>
        <rect x="46" y="20" width="6" height="60" rx="3"/>
        <rect x="58" y="32" width="6" height="44" rx="3"/>
        <rect x="70" y="24" width="6" height="52" rx="3"/>
      </g>
    </svg>`),
  "coventgardenmassage.co.uk": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <g fill="#f4f4f5">
        <rect x="22" y="24" width="6" height="52" rx="3"/>
        <rect x="34" y="32" width="6" height="44" rx="3"/>
        <rect x="46" y="20" width="6" height="60" rx="3"/>
        <rect x="58" y="32" width="6" height="44" rx="3"/>
        <rect x="70" y="24" width="6" height="52" rx="3"/>
      </g>
    </svg>`),
  "spaandmassage.co.uk": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#292524"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#d97706" stroke-width="3"/>
      <path d="M50 24 C45 32 36 40 36 50 C36 60 42 66 50 72 C58 66 64 60 64 50 C64 40 55 32 50 24 Z" fill="#f59e0b"/>
      <circle cx="50" cy="46" r="6" fill="#fef3c7"/>
    </svg>`),
  "latakiano.be": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" stroke-width="2.5"/>
      <text x="50" y="58" font-family="'Playfair Display', serif" font-weight="bold" font-size="34" fill="#facc15" text-anchor="middle">LB</text>
      <path d="M38 70 Q50 64 62 70" stroke="#facc15" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`),
  "latakianobarbero.be": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" stroke-width="2.5"/>
      <text x="50" y="58" font-family="'Playfair Display', serif" font-weight="bold" font-size="34" fill="#facc15" text-anchor="middle">LB</text>
      <path d="M38 70 Q50 64 62 70" stroke="#facc15" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`),
  "bpost.be": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#dc2626"/>
      <circle cx="50" cy="50" r="32" fill="#ffffff"/>
      <path d="M38 38 H52 C58 38 62 42 62 48 C62 54 58 58 52 58 H44 V68 H38 V38 Z" fill="#dc2626"/>
      <circle cx="50" cy="48" r="4" fill="#ffffff"/>
    </svg>`),
  "bol.com": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0000a4"/>
      <text x="46" y="58" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">bol.</text>
      <circle cx="76" cy="53" r="5" fill="#00b4f0"/>
    </svg>`),
  "immoweb.be": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0284c7"/>
      <path d="M50 20 L24 44 H34 V74 H66 V44 H76 Z" fill="#ffffff"/>
      <rect x="58" y="26" width="6" height="12" fill="#ffffff"/>
      <rect x="44" y="52" width="12" height="22" rx="2" fill="#0284c7"/>
    </svg>`),
  "graftonpharmacy.co.uk": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#15803d"/>
      <rect x="42" y="24" width="16" height="52" rx="4" fill="#ffffff"/>
      <rect x="24" y="42" width="52" height="16" rx="4" fill="#ffffff"/>
    </svg>`),
  "cnn.com": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#cc0000"/>
      <text x="50" y="60" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-1">CNN</text>
    </svg>`),
  "edition.cnn.com": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#cc0000"/>
      <text x="50" y="60" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-1">CNN</text>
    </svg>`),
  "leopoldhotelantwerp.com": "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#7c2d12"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fcd34d" stroke-width="2"/>
      <text x="50" y="58" font-family="'Playfair Display', Georgia, serif" font-weight="bold" font-size="30" fill="#fef08a" text-anchor="middle">HL</text>
    </svg>`)
};

export function extractDomain(str: string | null | undefined): string | null {
  if (!str) return null;
  let trimmed = str.trim();
  if (!trimmed) return null;
  
  // Clean up if it's a full URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("://")) {
    try {
      const parsed = new URL(trimmed);
      return parsed.hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      let withoutProto = trimmed.split("://")[1] || trimmed;
      let host = withoutProto.split("/")[0] || withoutProto;
      return host.replace(/^www\./i, "").toLowerCase();
    }
  }
  
  let host = trimmed.split("/")[0] || trimmed;
  return host.replace(/^www\./i, "").toLowerCase();
}

export function getCleanLogoUrl(url: string | null | undefined, domain?: string | null): string | null {
  const cleanDomain = extractDomain(domain || url);
  if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
    return KNOWN_BRAND_LOGOS[cleanDomain];
  }

  if (url && (url.startsWith("data:image/") || url.startsWith("/api/") || url.startsWith("https://") || url.startsWith("http://"))) {
    if (!url.includes("clearbit.com")) {
      return url;
    }
  }

  if (cleanDomain && !cleanDomain.includes("favicon") && !cleanDomain.includes("ui-avatars") && !cleanDomain.includes("unavatar.io")) {
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=128`;
  }

  return url || null;
}

export function getPlaceLogoUrl(place: Partial<Place> | null | undefined): string | null {
  if (!place) return null;

  let domain = place.brandDomain;
  if (!domain && place.website) {
    domain = extractDomain(place.website);
  }
  if (!domain && place.address && (place.address.startsWith("http://") || place.address.startsWith("https://"))) {
    domain = extractDomain(place.address);
  }
  if (!domain && place.id && (place.id.includes(".com") || place.id.includes(".be") || place.id.includes(".co.uk") || place.id.includes("-com") || place.id.includes("-be") || place.id.includes("-co-uk"))) {
    domain = place.id.replace(/-com$/, ".com").replace(/-be$/, ".be").replace(/-co-uk$/, ".co.uk").replace(/^www-/, "");
  }

  const cleanDomain = domain?.trim().replace(/^www\./, "").toLowerCase();

  // 1. Direct match for known high-quality brand vector logos
  if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
    return KNOWN_BRAND_LOGOS[cleanDomain];
  }

  // 2. Explicit logoUrl provided
  if (place.logoUrl && place.logoUrl.trim() !== "") {
    return place.logoUrl;
  }
  
  // 3. Explicit avatarUrl provided (if not a generic ui-avatar or broken unsplash)
  if (
    place.avatarUrl &&
    place.avatarUrl.trim() !== "" &&
    place.avatarUrl !== place.bannerUrl &&
    !place.avatarUrl.includes("favicons") &&
    !place.avatarUrl.includes("photo-1526367790999")
  ) {
    return place.avatarUrl;
  }

  // 4. Reliable Google favicon resolution for the clean domain
  if (cleanDomain && cleanDomain.includes(".")) {
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=128`;
  }

  if (place.avatarUrl && place.avatarUrl.trim() !== "") {
    return place.avatarUrl;
  }

  return null;
}


