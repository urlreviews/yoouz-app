import React, { useState, useEffect } from "react";
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
  const resolvedDomain = React.useMemo(() => {
    if (domain) return extractDomain(domain);
    if (website) return extractDomain(website);
    if (logoUrl) return extractDomain(logoUrl);
    if (name) return extractDomain(name);
    return null;
  }, [domain, website, logoUrl, name]);

  // Build the fallback cascade list
  const cascadeItems = React.useMemo(() => {
    const items: { url: string; fit: "contain" | "cover" }[] = [];
    const seen = new Set<string>();

    const addItem = (url: string | null | undefined, fit: "contain" | "cover" = "contain") => {
      if (!url) return;
      const clean = url.trim();
      if (!clean || clean === "data:;" || clean.startsWith("data:;") || seen.has(clean)) return;
      seen.add(clean);
      items.push({ url: clean, fit });
    };

    // 1. Direct match for known high-quality brand vector logos
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      addItem(KNOWN_BRAND_LOGOS[resolvedDomain], "contain");
    }

    // 2. Direct scraped or explicitly provided logoUrl (if valid and not a generic favicon)
    const isFavicon = logoUrl && (logoUrl.includes("favicon") || logoUrl.includes("gstatic.com") || logoUrl.includes("google.com/s2"));
    if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:image")) && !logoUrl.includes("ui-avatars") && !logoUrl.includes("dicebear") && !isFavicon) {
      addItem(logoUrl, "contain");
    }

    // 3. High-resolution brand logo retrieval APIs
    if (resolvedDomain) {
      addItem(`https://unavatar.io/${resolvedDomain}?fallback=false`, "contain");
      addItem(`https://icons.duckduckgo.com/ip3/${resolvedDomain}.ico`, "contain");
      addItem(`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${resolvedDomain}&size=256`, "contain");
    }

    // 4. Explicit logoUrl fallback if it was a favicon
    if (logoUrl && isFavicon && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:image"))) {
      addItem(logoUrl, "contain");
    }

    return items;
  }, [resolvedDomain, logoUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Reset indices if props change
  useEffect(() => {
    setCurrentIndex(0);
    setHasFailedAll(cascadeItems.length === 0);
  }, [cascadeItems]);

  const handleImageError = () => {
    if (currentIndex < cascadeItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const getInitials = () => {
    if (!name) return "P";
    const cleaned = name.replace(/^(een|a|the)\s+/i, "").trim();
    return cleaned.charAt(0).toUpperCase();
  };

  if (hasFailedAll || cascadeItems.length === 0) {
    // Strip bg-white and other bg- colors to ensure the fallback gradient displays properly
    const fallbackBgClass = className
      .split(" ")
      .filter((c) => !c.startsWith("bg-") && !c.includes("bg-"))
      .join(" ");

    return (
      <div className={`${fallbackBgClass} bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center shadow-inner border border-zinc-700/60`}>
        <span className={fallbackTextClassName}>
          {getInitials()}
        </span>
      </div>
    );
  }

  const currentItem = cascadeItems[currentIndex];

  return (
    <div className={className}>
      <img
        src={currentItem.url}
        alt={name || "Brand Logo"}
        className={`${imageClassName} ${currentItem.fit === "cover" ? "object-cover" : "object-contain"}`}
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
    </div>
  );
};
