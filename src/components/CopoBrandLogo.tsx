import React, { useState, useMemo, useEffect } from "react";
import { extractDomain, KNOWN_BRAND_LOGOS, getProxiedImageUrl, isFaviconUrl, isWhiteOrInvertedLogo } from "../utils/logoUtils";
import { isValidDomainUrl } from "../utils/placeUtils";

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
  onLoad?: () => void;
}

// Global in-memory cache to prevent re-fetching and eliminate flicker during view transitions
const KNOWN_LOADED_LOGOS = new Set<string>();

export const CopoBrandLogo: React.FC<CopoBrandLogoProps> = ({
  domain,
  name,
  website,
  logoUrl,
  bannerUrl,
  className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex items-center justify-center p-2 z-30 ring-1 ring-white/10",
  imageClassName = "w-full h-full object-contain rounded-xl [image-rendering:-webkit-optimize-contrast]",
  fallbackTextClassName = "font-black text-2xl sm:text-3xl text-white drop-shadow-sm",
  loading = "lazy",
  fetchPriority = "auto",
  onLoad
}) => {
  const [hasError, setHasError] = useState(false);

  // Extract clean domain from any source
  const resolvedDomain = useMemo(() => {
    if (domain && isValidDomainUrl(domain)) return extractDomain(domain);
    if (website && isValidDomainUrl(website)) return extractDomain(website);
    if (logoUrl && !logoUrl.includes("brandfetch.io") && !logoUrl.startsWith("/api/") && isValidDomainUrl(logoUrl)) return extractDomain(logoUrl);
    if (name && isValidDomainUrl(name)) return extractDomain(name);
    return null;
  }, [domain, website, logoUrl, name]);

  // Check if target is Yoouz
  const isYoouz = useMemo(() => {
    const cleanD = (resolvedDomain || "").toLowerCase().trim();
    const cleanN = (typeof name === "string" ? name : "").toLowerCase().trim();
    return (
      cleanD === "yoouz.com" ||
      cleanD === "www.yoouz.com" ||
      cleanD === "yoouz" ||
      cleanN === "yoouz" ||
      cleanN === "yoouz.com"
    );
  }, [resolvedDomain, name]);

  const effectiveSrc = useMemo(() => {
    if (isYoouz) return "/favicon.svg";

    const cleanDomain = (resolvedDomain || "").replace(/^www\./, "").toLowerCase().trim();

    // 0. Known high quality vector/authentic logo by domain ALWAYS takes top priority
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
      !isFaviconUrl(logoUrl) &&
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

    // 2. High-resolution Google Social Brand Icon (256px) fallback by domain
    if (cleanDomain && cleanDomain.includes(".")) {
      return getProxiedImageUrl(`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${cleanDomain}&size=256`);
    }

    return null;
  }, [isYoouz, resolvedDomain, logoUrl, name]);

  const currentSrc = useMemo(() => {
    if (isYoouz) return "/favicon.svg";
    if (!effectiveSrc || isFaviconUrl(effectiveSrc)) return null;
    return getProxiedImageUrl(effectiveSrc);
  }, [isYoouz, effectiveSrc]);

  const isKnownLoaded = currentSrc ? KNOWN_LOADED_LOGOS.has(currentSrc) : false;
  const [imgLoaded, setImgLoaded] = useState<boolean>(isKnownLoaded);

  const lastSrcRef = React.useRef<string | null>(null);
  const lastDomainRef = React.useRef<string | null>(null);

  // Reset error & fallback state ONLY when the effective image source actually changes
  useEffect(() => {
    if (currentSrc !== lastSrcRef.current) {
      setHasError(false);
      
      const cleanDom = (resolvedDomain || "").toLowerCase().trim();
      const lastDom = (lastDomainRef.current || "").toLowerCase().trim();
      const domainChanged = cleanDom !== lastDom;
      
      if (currentSrc && KNOWN_LOADED_LOGOS.has(currentSrc)) {
        setImgLoaded(true);
      } else if (!domainChanged && imgLoaded) {
        // Keep previous image visible while new source loads
      } else {
        setImgLoaded(false);
      }
      
      lastSrcRef.current = currentSrc;
      lastDomainRef.current = resolvedDomain;
    }
  }, [currentSrc, resolvedDomain, logoUrl, name]);

  useEffect(() => {
    if (currentSrc && KNOWN_LOADED_LOGOS.has(currentSrc)) {
      setImgLoaded(true);
    }
  }, [currentSrc]);

  // Synchronously notify parent when image or initials are ready
  useEffect(() => {
    if ((imgLoaded || !currentSrc) && onLoad) {
      onLoad();
    }
  }, [imgLoaded, currentSrc]);

  const initials = useMemo(() => {
    const candidate = name || resolvedDomain || "B";
    const clean = candidate.replace(/^(?:https?:\/\/)?(?:www\.)?/, "").trim();
    const words = clean.split(/[\s.\-_]+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return (clean.charAt(0) || "B").toUpperCase();
  }, [name, resolvedDomain]);

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

  // Dedicated Yoouz emblem
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

  const shouldAttemptImage = Boolean(currentSrc && !hasError);
  const isWhiteLogo = currentSrc ? isWhiteOrInvertedLogo(currentSrc) : false;

  return (
    <div className={containerClasses}>
      {/* 1. Official Vector Brand Monogram Fallback (Strictly replaces favicons with elegant, high-contrast brand initials) */}
      {(!shouldAttemptImage || !imgLoaded) && (
        <div className={`absolute inset-0 w-full h-full flex items-center justify-center select-none bg-zinc-950 border border-zinc-800/80 rounded-xl ${imageClassName} shadow-inner`}>
          <span className={`text-white font-black tracking-tight select-none ${fallbackTextClassName}`}>
            {initials}
          </span>
        </div>
      )}

      {/* 2. Primary Official Brand Logo Layer (Crisp authentic vector/raster logo from business) */}
      {shouldAttemptImage && (
        <div className={`absolute inset-0 w-full h-full rounded-xl transition-colors duration-300 ${isWhiteLogo ? "bg-zinc-950" : "bg-transparent"}`}>
          <img
            src={currentSrc!}
            alt={name || "Brand Logo"}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            className={`${imageClassName} relative z-10 transition-opacity duration-150 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            referrerPolicy="no-referrer"
            onLoad={() => {
              if (currentSrc) {
                KNOWN_LOADED_LOGOS.add(currentSrc);
              }
              setImgLoaded(true);
              onLoad?.();
            }}
            onError={() => {
              setHasError(true);
              setImgLoaded(false);
            }}
          />
        </div>
      )}
    </div>
  );
};
