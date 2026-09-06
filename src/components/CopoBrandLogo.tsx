import React, { useState, useMemo, useEffect } from "react";
import { extractDomain, KNOWN_BRAND_LOGOS, generateBrandMonogramSvg } from "../utils/logoUtils";

interface CopoBrandLogoProps {
  domain?: string | null;
  name?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackTextClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}

export const CopoBrandLogo: React.FC<CopoBrandLogoProps> = ({
  domain,
  name,
  website,
  logoUrl,
  bannerUrl,
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden flex items-center justify-center p-1 z-30 ring-1 ring-white/10",
  imageClassName = "w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast]",
  fallbackTextClassName = "font-black text-2xl sm:text-3xl text-zinc-900 drop-shadow-sm",
  loading = "lazy",
  fetchPriority = "auto"
}) => {
  const [hasError, setHasError] = useState(false);

  // Extract clean domain from any source
  const resolvedDomain = useMemo(() => {
    if (domain) return extractDomain(domain);
    if (website) return extractDomain(website);
    if (logoUrl && !logoUrl.includes("brandfetch.io")) return extractDomain(logoUrl);
    if (name) return extractDomain(name);
    return null;
  }, [domain, website, logoUrl, name]);

  // Reset error when inputs change
  useEffect(() => {
    setHasError(false);
  }, [domain, website, logoUrl, name]);

  const monogramSvg = useMemo(() => {
    return generateBrandMonogramSvg(name || resolvedDomain || "Place", 128);
  }, [name, resolvedDomain]);

  const effectiveSrc = useMemo(() => {
    // 1. Known high quality vector logo by domain
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      return KNOWN_BRAND_LOGOS[resolvedDomain];
    }

    // 2. Explicit clean Logo URL
    if (
      logoUrl &&
      !logoUrl.includes("brandfetch.io") &&
      !logoUrl.includes("gstatic.com/faviconV2") &&
      logoUrl !== "data:;" &&
      !logoUrl.startsWith("data:;") &&
      (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("/api/") || logoUrl.startsWith("data:image"))
    ) {
      if (logoUrl.startsWith("/api/proxy-image?url=")) {
        try {
          return decodeURIComponent(logoUrl.replace("/api/proxy-image?url=", ""));
        } catch (e) {
          return logoUrl;
        }
      }
      return logoUrl;
    }

    // 3. Known domain lookup by name
    const cleanName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (KNOWN_BRAND_LOGOS[cleanName]) {
      return KNOWN_BRAND_LOGOS[cleanName];
    }

    return null;
  }, [resolvedDomain, logoUrl, name]);

  if (hasError || !effectiveSrc) {
    return (
      <div className={className}>
        <img
          src={monogramSvg}
          alt={name || "Brand Logo"}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={imageClassName}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={effectiveSrc}
        alt={name || "Brand Logo"}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={imageClassName}
        referrerPolicy="no-referrer"
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
};
