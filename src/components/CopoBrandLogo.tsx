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
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-zinc-200/40 bg-white shadow-2xl overflow-hidden flex items-center justify-center p-2 z-30 ring-1 ring-white/20",
  imageClassName = "w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast]",
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
      (typeof website === "string" && website.toLowerCase().trim().includes("yoouz")) ||
      (typeof logoUrl === "string" && (logoUrl.toLowerCase().includes("yoouz") || logoUrl.includes("favicon.svg")))
    );
  }, [resolvedDomain, name, domain, website, logoUrl]);

  // If Yoouz, render the official emblem directly as native vector SVG.
  // This guarantees 100% immediate rendering with zero network delay, no 404, no cache failure,
  // and no WebKit image decode failure during high GPU activity (video playback or camera recording).
  if (isYoouz) {
    return (
      <div className={className} id="copo-brand-logo-yoouz">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={imageClassName}
          aria-label="Yoouz"
        >
          <rect width="24" height="24" rx="6" fill="#09090b" />
          <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.8" />
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#ffffff"
          />
        </svg>
      </div>
    );
  }

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
      return `/api/favicon?domain=${resolvedDomain}`;
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
