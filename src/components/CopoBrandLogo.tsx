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
  const [fetchedLogo, setFetchedLogo] = useState<string | null>(null);
  const [triedProxy, setTriedProxy] = useState(false);
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

  // Check if target is Yoouz
  const isYoouz = useMemo(() => {
    return (
      resolvedDomain === "yoouz.com" ||
      resolvedDomain === "www.yoouz.com" ||
      resolvedDomain === "yoouz" ||
      (typeof name === "string" && name.toLowerCase().trim().includes("yoouz")) ||
      (typeof domain === "string" && domain.toLowerCase().trim().includes("yoouz")) ||
      (typeof website === "string" && website.toLowerCase().trim().includes("yoouz"))
    );
  }, [resolvedDomain, name, domain, website]);

  // Reset error & fallback ONLY if the incoming source itself fundamentally changes
  useEffect(() => {
    setHasError(false);
    setTriedProxy(false);
    setTriedFallback(false);
    setTriedDuckFallback(false);
  }, [resolvedDomain, logoUrl, name]);

  // Background auto-enrichment from live url-metadata ONLY if logoUrl was not directly provided and domain is unknown
  useEffect(() => {
    if (!logoUrl && !isYoouz && resolvedDomain && resolvedDomain.includes(".") && !KNOWN_BRAND_LOGOS[resolvedDomain]) {
      let isMounted = true;
      fetch(`/api/url-metadata?url=${encodeURIComponent(resolvedDomain)}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data && data.logo && typeof data.logo === "string" && data.logo.trim() !== "") {
            setFetchedLogo(data.logo);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [resolvedDomain, logoUrl, isYoouz]);

  const monogramSvg = useMemo(() => {
    return generateBrandMonogramSvg(name || resolvedDomain || "Place", 128);
  }, [name, resolvedDomain]);

  const googleFaviconUrl = useMemo(() => {
    if (isYoouz) return null;
    if (resolvedDomain && resolvedDomain.includes(".")) {
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${resolvedDomain}&size=256`;
    }
    return null;
  }, [resolvedDomain, isYoouz]);

  const duckFaviconUrl = useMemo(() => {
    if (isYoouz) return null;
    if (resolvedDomain && resolvedDomain.includes(".")) {
      return `https://icons.duckduckgo.com/ip3/${resolvedDomain}.ico`;
    }
    return null;
  }, [resolvedDomain, isYoouz]);

  const effectiveSrc = useMemo(() => {
    // 0. Yoouz official dark emblem with white star
    if (isYoouz) {
      return "/favicon.svg";
    }

    // 1. Explicit clean Logo URL from place record, database, or API
    const targetLogo = logoUrl || fetchedLogo;
    if (
      targetLogo &&
      !targetLogo.includes("brandfetch.io") &&
      targetLogo !== "data:;" &&
      !targetLogo.startsWith("data:;") &&
      (targetLogo.startsWith("/") || targetLogo.startsWith("http://") || targetLogo.startsWith("https://") || targetLogo.startsWith("data:image"))
    ) {
      if (targetLogo.startsWith("/api/proxy-image?url=")) {
        try {
          return decodeURIComponent(targetLogo.replace("/api/proxy-image?url=", ""));
        } catch (e) {
          return targetLogo;
        }
      }
      return targetLogo;
    }

    // 2. Known high quality vector logo by domain
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      return KNOWN_BRAND_LOGOS[resolvedDomain];
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
  }, [isYoouz, resolvedDomain, logoUrl, fetchedLogo, name, googleFaviconUrl]);

  const currentSrc = useMemo(() => {
    if (isYoouz) return "/favicon.svg";
    if (hasError) return null;
    if (triedDuckFallback) return duckFaviconUrl;
    if (triedFallback) return googleFaviconUrl || duckFaviconUrl;
    if (triedProxy && effectiveSrc && (effectiveSrc.startsWith("http://") || effectiveSrc.startsWith("https://"))) {
      return `/api/proxy-image?url=${encodeURIComponent(effectiveSrc)}`;
    }
    return effectiveSrc || googleFaviconUrl || duckFaviconUrl;
  }, [isYoouz, hasError, triedDuckFallback, triedFallback, triedProxy, duckFaviconUrl, googleFaviconUrl, effectiveSrc]);

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
          if (isYoouz) {
            setHasError(true);
            return;
          }
          if (!triedProxy && effectiveSrc && (effectiveSrc.startsWith("http://") || effectiveSrc.startsWith("https://")) && !effectiveSrc.startsWith("/api/")) {
            setTriedProxy(true);
          } else if (!triedFallback && googleFaviconUrl && currentSrc !== googleFaviconUrl) {
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
