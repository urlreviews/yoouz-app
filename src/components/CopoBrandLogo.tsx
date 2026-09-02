import React, { useMemo } from "react";
import { extractDomain, KNOWN_BRAND_LOGOS, KNOWN_BRAND_BANNERS } from "../utils/logoUtils";

interface CopoBrandLogoProps {
  domain?: string | null;
  name?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackTextClassName?: string;
}

export const CopoBrandLogo: React.FC<CopoBrandLogoProps> = ({
  domain,
  name,
  website,
  logoUrl,
  bannerUrl,
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-zinc-800 bg-white shadow-xl overflow-hidden flex items-center justify-center p-0.5 z-30 ring-1 ring-white/10",
  imageClassName = "w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast]",
  fallbackTextClassName = "font-black text-2xl sm:text-3xl text-white drop-shadow-md"
}) => {
  // Extract clean domain from any source
  const resolvedDomain = useMemo(() => {
    if (domain) return extractDomain(domain);
    if (website) return extractDomain(website);
    if (logoUrl) return extractDomain(logoUrl);
    if (name) return extractDomain(name);
    return null;
  }, [domain, website, logoUrl, name]);

  const { src, isCover } = useMemo(() => {
    // 1. Known high quality vectors
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      return { src: KNOWN_BRAND_LOGOS[resolvedDomain], isCover: false };
    }
    
    // 2. Direct scraped logo (skip if it looks like a generic favicon, since gstatic is better)
    const isFavicon = logoUrl && (logoUrl.includes("favicon") || logoUrl.includes("gstatic.com") || logoUrl.includes("google.com/s2"));
    if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("/api/") || logoUrl.startsWith("data:image")) && !logoUrl.includes("ui-avatars") && !logoUrl.includes("dicebear") && !isFavicon) {
      return { src: logoUrl, isCover: false };
    }
    
    // 3. Fallback to Google Favicon CDN
    if (resolvedDomain) {
      return { src: `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${resolvedDomain}&size=256`, isCover: false };
    }
    
    // 4. ui-avatars native fallback if NO domain and NO logoUrl
    const avatarName = name ? name.replace(/^(een|a|the)\s+/i, "").trim() : "Place";
    return { 
      src: `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=18181b&color=ffffff&size=256&font-size=0.4&bold=true`, 
      isCover: false 
    };
  }, [resolvedDomain, logoUrl, name]);

  const fallbackUrl = useMemo(() => {
    const avatarName = name ? name.replace(/^(een|a|the)\s+/i, "").trim() : "Place";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=18181b&color=ffffff&size=256&font-size=0.4&bold=true`;
  }, [name]);

  return (
    <div className={className}>
      <img
        src={src}
        alt={name || "Brand Logo"}
        loading="lazy"
        decoding="async"
        className={`${imageClassName} ${isCover ? "object-cover" : "object-contain"}`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          if ((e.currentTarget as HTMLImageElement).src !== fallbackUrl) {
            (e.currentTarget as HTMLImageElement).src = fallbackUrl;
          }
        }}
      />
    </div>
  );
};
