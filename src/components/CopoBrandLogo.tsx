import React, { useState, useEffect } from "react";
import { extractDomain } from "../utils/logoUtils";

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
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center p-0.5 z-30 ring-1 ring-black/10",
  imageClassName = "w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast]",
  fallbackTextClassName = "font-black text-2xl sm:text-3xl text-white drop-shadow-md"
}) => {
  // Extract clean domain
  const resolvedDomain = React.useMemo(() => {
    if (domain) return extractDomain(domain);
    if (website) return extractDomain(website);
    if (logoUrl) return extractDomain(logoUrl);
    return null;
  }, [domain, website, logoUrl]);

    // Build the fallback cascade list
    const cascadeItems = React.useMemo(() => {
      const items: { url: string; fit: "contain" | "cover" }[] = [];
  
      // 1. Direct scraped logoUrl (if available and valid)
      // Check if it's a generic favicon
      const isFavicon = logoUrl && (logoUrl.includes("favicon") || logoUrl.includes("gstatic.com") || logoUrl.includes("google.com/s2"));

      if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:image")) && !logoUrl.includes("ui-avatars") && !logoUrl.includes("dicebear") && !isFavicon) {
        items.push({ url: logoUrl, fit: "contain" });
      }
  
      // 2. High-resolution brand logo retrieval APIs (Professional assets)
      if (resolvedDomain) {
        items.push({ url: `https://logos.hunter.io/${resolvedDomain}`, fit: "contain" });
        items.push({ url: `https://unavatar.io/${resolvedDomain}?fallback=false`, fit: "contain" });
      }
  
      // 3. Fallback to bannerUrl / ogImage (high quality brand representation!)
      // This guarantees we always have a gorgeous picture (e.g. from the page banner) if no brand logo is found!
      if (bannerUrl && (bannerUrl.startsWith("http://") || bannerUrl.startsWith("https://") || bannerUrl.startsWith("data:image"))) {
        items.push({ url: bannerUrl, fit: "cover" });
      }

      // 4. Reliable Google High-Res Favicon (256px) as secondary resort
      if (resolvedDomain) {
        items.push({ url: `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${resolvedDomain}&size=256`, fit: "contain" });
      }

      // 5. Explicit logoUrl (even if it's a favicon)
      if (logoUrl && isFavicon && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:image"))) {
        items.push({ url: logoUrl, fit: "contain" });
      }

      return items;
    }, [resolvedDomain, logoUrl, bannerUrl]);

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
    // Strip bg-white and other bg- colors to ensure the fallback gradient displays properly and is not overridden by a white background
    const fallbackBgClass = className
      .split(" ")
      .filter((c) => !c.startsWith("bg-") && !c.includes("bg-"))
      .join(" ");

    return (
      <div className={`${fallbackBgClass} bg-gradient-to-br from-[#1a73e8] via-indigo-600 to-blue-700 flex items-center justify-center shadow-inner`}>
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
