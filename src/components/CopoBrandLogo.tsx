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
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex items-center justify-center p-2 z-30 ring-1 ring-white/10",
  imageClassName = "w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast] [filter:drop-shadow(0px_0px_1px_rgba(255,255,255,0.25))]",
  fallbackTextClassName = "font-black text-2xl sm:text-3xl text-white drop-shadow-sm",
  loading = "lazy",
  fetchPriority = "auto"
}) => {
  const [triedFallback, setTriedFallback] = useState(false);
  const [triedDuckFallback, setTriedDuckFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Extract clean domain from any source
  const resolvedDomain = useMemo(() => {
    if (domain) return extractDomain(domain);
    if (website) return extractDomain(website);
    if (logoUrl && !logoUrl.includes("brandfetch.io")) return extractDomain(logoUrl);
    if (name) return extractDomain(name);
    return null;
  }, [domain, website, logoUrl, name]);

  // Reset error & fallback ONLY if the incoming source itself fundamentally changes
  useEffect(() => {
    setHasError(false);
    setTriedFallback(false);
    setTriedDuckFallback(false);
  }, [resolvedDomain, logoUrl, name]);

  const monogramSvg = useMemo(() => {
    return generateBrandMonogramSvg(name || resolvedDomain || "Place", 128);
  }, [name, resolvedDomain]);

  const googleFaviconUrl = useMemo(() => {
    if (resolvedDomain && resolvedDomain.includes(".")) {
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${resolvedDomain}&size=256`;
    }
    return null;
  }, [resolvedDomain]);

  const duckFaviconUrl = useMemo(() => {
    if (resolvedDomain && resolvedDomain.includes(".")) {
      return `https://icons.duckduckgo.com/ip3/${resolvedDomain}.ico`;
    }
    return null;
  }, [resolvedDomain]);

  const effectiveSrc = useMemo(() => {
    // 1. Known high quality vector logo by domain
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      return KNOWN_BRAND_LOGOS[resolvedDomain];
    }

    // 2. Explicit clean Logo URL from authentic metadata or API
    if (
      logoUrl &&
      !logoUrl.includes("brandfetch.io") &&
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

    // 4. High-resolution authentic 256px favicon if domain is known
    if (googleFaviconUrl) {
      return googleFaviconUrl;
    }

    return null;
  }, [resolvedDomain, logoUrl, name, googleFaviconUrl]);

  const currentSrc = useMemo(() => {
    if (hasError) return null;
    if (triedDuckFallback) return duckFaviconUrl;
    if (triedFallback) return googleFaviconUrl || duckFaviconUrl;
    return effectiveSrc || googleFaviconUrl || duckFaviconUrl;
  }, [hasError, triedDuckFallback, triedFallback, duckFaviconUrl, googleFaviconUrl, effectiveSrc]);

  if (hasError || !currentSrc) {
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
        src={currentSrc}
        alt={name || "Brand Logo"}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={imageClassName}
        referrerPolicy="no-referrer"
        onError={() => {
          if (!triedFallback && googleFaviconUrl && currentSrc !== googleFaviconUrl) {
            setTriedFallback(true);
          } else if (!triedDuckFallback && duckFaviconUrl && currentSrc !== duckFaviconUrl) {
            setTriedDuckFallback(true);
          } else {
            setHasError(true);
          }
        }}
      />
    </div>
  );
};
