import React, { useState, useMemo, useEffect } from "react";
import { extractDomain, KNOWN_BRAND_LOGOS, getDeterministicBrandTheme, getProxiedImageUrl } from "../utils/logoUtils";

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

// Global in-memory cache to prevent re-fetching and eliminate flicker during view transitions
const KNOWN_LOADED_LOGOS = new Set<string>();
const KNOWN_FAILED_LOGOS = new Set<string>();

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
  const [triedProxy, setTriedProxy] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Extract clean domain from any source
  const resolvedDomain = useMemo(() => {
    if (domain) return extractDomain(domain);
    if (website) return extractDomain(website);
    if (logoUrl && !logoUrl.includes("brandfetch.io") && !logoUrl.startsWith("/api/")) return extractDomain(logoUrl);
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

  // Deterministic Brand Theme (Letters & Color)
  const brandTheme = useMemo(() => {
    return getDeterministicBrandTheme(name || resolvedDomain, resolvedDomain);
  }, [name, resolvedDomain]);

  // If Yoouz, render the official emblem directly as native vector SVG.
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

  // Reset error & fallback ONLY if the domain identity fundamentally changes
  useEffect(() => {
    setHasError(false);
    setTriedProxy(false);
  }, [resolvedDomain]);

  const googleFaviconUrl = useMemo(() => {
    if (isYoouz) return null;
    if (resolvedDomain && resolvedDomain.includes(".")) {
      return `/api/favicon?domain=${resolvedDomain}`;
    }
    return null;
  }, [resolvedDomain, isYoouz]);

  const effectiveSrc = useMemo(() => {
    if (isYoouz) return "/favicon.svg";

    // 0. Known high quality vector/authentic logo by domain ALWAYS takes top priority
    const cleanDomain = (resolvedDomain || "").replace(/^www\./, "").toLowerCase().trim();
    if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
      return getProxiedImageUrl(KNOWN_BRAND_LOGOS[cleanDomain]);
    }
    if (resolvedDomain && KNOWN_BRAND_LOGOS[resolvedDomain]) {
      return getProxiedImageUrl(KNOWN_BRAND_LOGOS[resolvedDomain]);
    }
    const cleanName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanName && KNOWN_BRAND_LOGOS[cleanName]) {
      return getProxiedImageUrl(KNOWN_BRAND_LOGOS[cleanName]);
    }

    // 1. Explicit clean Logo URL from place record or metadata
    if (
      logoUrl &&
      !logoUrl.includes("brandfetch.io") &&
      logoUrl !== "data:;" &&
      !logoUrl.startsWith("data:;") &&
      !logoUrl.includes("LogoHeader") &&
      !logoUrl.includes("1024x170") &&
      !logoUrl.includes("tap/0.png") &&
      !logoUrl.includes("icons/tap") &&
      (logoUrl.startsWith("/") || logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:image"))
    ) {
      return getProxiedImageUrl(logoUrl);
    }

    // 2. High-resolution authentic favicon endpoint
    if (googleFaviconUrl) {
      return googleFaviconUrl;
    }

    return null;
  }, [isYoouz, resolvedDomain, logoUrl, name, googleFaviconUrl]);

  const [triedFaviconFallback, setTriedFaviconFallback] = useState(false);

  const currentSrc = useMemo(() => {
    if (isYoouz) return "/favicon.svg";
    if (hasError) return null;
    if (triedFaviconFallback && googleFaviconUrl) {
      return googleFaviconUrl;
    }
    const base = effectiveSrc || googleFaviconUrl;
    if (!base) return null;
    return getProxiedImageUrl(base);
  }, [isYoouz, hasError, triedFaviconFallback, googleFaviconUrl, effectiveSrc]);

  const isKnownLoaded = currentSrc ? KNOWN_LOADED_LOGOS.has(currentSrc) : false;
  const isKnownFailed = currentSrc ? KNOWN_FAILED_LOGOS.has(currentSrc) : false;
  const [imgLoaded, setImgLoaded] = useState<boolean>(isKnownLoaded);

  useEffect(() => {
    if (currentSrc && KNOWN_LOADED_LOGOS.has(currentSrc)) {
      setImgLoaded(true);
    }
  }, [currentSrc]);

  const shouldAttemptImage = !hasError && !!currentSrc && !isKnownFailed;

  const hasPosition =
    className.includes("absolute") ||
    className.includes("relative") ||
    className.includes("fixed") ||
    className.includes("sticky");
  const hasOverflow = className.includes("overflow-");

  const containerClasses = [
    !hasPosition ? "relative" : "",
    !hasOverflow ? "overflow-hidden" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={containerClasses}>
      {/* 1. Rock-Solid Deterministic Monogram Base Layer (Immediate zero-delay rendering, never fails) */}
      <div
        className={`absolute inset-0 w-full h-full flex items-center justify-center select-none ${imageClassName}`}
        style={{ backgroundColor: brandTheme.bgColor }}
      >
        <span
          className={`font-black tracking-tight leading-none ${fallbackTextClassName}`}
          style={{ color: brandTheme.textColor }}
        >
          {brandTheme.letters}
        </span>
      </div>

      {/* 2. Primary Brand Logo / Favicon Layer (Fades in on load, perfectly graceful) */}
      {shouldAttemptImage && (
        <img
          src={currentSrc}
          alt={name || "Brand Logo"}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={`${imageClassName} relative z-10 transition-opacity duration-200 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          referrerPolicy="no-referrer"
          onLoad={() => {
            if (currentSrc) KNOWN_LOADED_LOGOS.add(currentSrc);
            setImgLoaded(true);
          }}
          onError={() => {
            if (currentSrc) KNOWN_FAILED_LOGOS.add(currentSrc);
            if (!triedFaviconFallback && googleFaviconUrl && currentSrc !== googleFaviconUrl) {
              setTriedFaviconFallback(true);
              setImgLoaded(false);
            } else {
              setHasError(true);
            }
          }}
        />
      )}
    </div>
  );
};
